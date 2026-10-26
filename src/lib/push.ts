import webpush from "web-push";
import { db } from "./db";
import { env } from "./env";

// VAPID keys: from env if set, otherwise generated once and kept in SQLite so
// existing subscriptions stay valid across restarts and redeploys.
function vapidKeys(): { publicKey: string; privateKey: string } {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  const row = db.prepare(`SELECT value FROM kv WHERE key = 'vapid'`).get() as
    | { value: string }
    | undefined;
  if (row) return JSON.parse(row.value);
  const keys = webpush.generateVAPIDKeys();
  db.prepare(`INSERT OR IGNORE INTO kv (key, value) VALUES ('vapid', ?)`).run(JSON.stringify(keys));
  return vapidKeys();
}

let configured = false;
function setup() {
  if (configured) return;
  const { publicKey, privateKey } = vapidKeys();
  // The subject must be https: or mailto: (plain http breaks local dev).
  const subject =
    process.env.VAPID_SUBJECT ||
    (env.appUrl.startsWith("https://") ? env.appUrl : "mailto:reto33@localhost");
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function vapidPublicKey(): string {
  return vapidKeys().publicKey;
}

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

const q = {
  upsertSub: db.prepare(
    `INSERT INTO push_sub (endpoint, userId, p256dh, auth, createdAt) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET userId = excluded.userId, p256dh = excluded.p256dh, auth = excluded.auth`,
  ),
  delSub: db.prepare(`DELETE FROM push_sub WHERE endpoint = ?`),
  delSubForUser: db.prepare(`DELETE FROM push_sub WHERE endpoint = ? AND userId = ?`),
  subsFor: db.prepare(`SELECT * FROM push_sub WHERE userId = ?`),
  subCount: db.prepare(`SELECT COUNT(*) n FROM push_sub WHERE userId = ?`),
  getReminder: db.prepare(`SELECT * FROM reminder WHERE userId = ?`),
  upsertReminder: db.prepare(
    `INSERT INTO reminder (userId, time, tz) VALUES (?, ?, ?)
     ON CONFLICT(userId) DO UPDATE SET time = excluded.time, tz = excluded.tz`,
  ),
  delReminder: db.prepare(`DELETE FROM reminder WHERE userId = ?`),
  allReminders: db.prepare(`SELECT * FROM reminder`),
  setSent: db.prepare(`UPDATE reminder SET lastSentDate = ? WHERE userId = ?`),
  // Unfinished challenges plus the time of their latest mark.
  active: db.prepare(
    `SELECT c.id, c.habit, c.lengthDays,
            (SELECT COUNT(*) FROM day_mark m WHERE m.challengeId = c.id) AS done,
            (SELECT MAX(doneAt) FROM day_mark m WHERE m.challengeId = c.id) AS lastAt
       FROM challenge c WHERE c.userId = ? AND c.completedAt IS NULL ORDER BY c.createdAt DESC`,
  ),
};

type Reminder = { userId: string; time: string; tz: string; lastSentDate: string | null };

export function saveSubscription(userId: string, sub: PushSubscriptionJSON) {
  q.upsertSub.run(sub.endpoint, userId, sub.keys.p256dh, sub.keys.auth, new Date().toISOString());
}

export function removeSubscription(userId: string, endpoint: string) {
  q.delSubForUser.run(endpoint, userId);
  if ((q.subCount.get(userId) as { n: number }).n === 0) q.delReminder.run(userId);
}

export function getReminder(userId: string): Reminder | null {
  return (q.getReminder.get(userId) as Reminder | undefined) ?? null;
}

export function setReminder(userId: string, time: string, tz: string) {
  q.upsertReminder.run(userId, normalizeTime(time), validTz(tz));
}

/** Send a notification to every device of a user; drops dead subscriptions. */
export async function sendToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<number> {
  setup();
  const subs = q.subsFor.all(userId) as { endpoint: string; p256dh: string; auth: string }[];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 6 },
        );
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) q.delSub.run(s.endpoint);
        else console.error("[push] send failed", code, (err as Error).message);
      }
    }),
  );
  return sent;
}

function normalizeTime(t: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return "20:00";
  const h = Math.min(23, +m[1]);
  const min = Math.min(59, +m[2]);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function validTz(tz: string): string {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "America/Lima";
  }
}

/** Local date ("YYYY-MM-DD") and time ("HH:MM") of an instant in a time zone. */
function localParts(date: Date, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** One scheduler pass: remind users whose reminder time has passed today. */
export async function runReminderTick(now = new Date()) {
  for (const r of q.allReminders.all() as Reminder[]) {
    const local = localParts(now, r.tz);
    if (local.time < r.time || r.lastSentDate === local.date) continue;

    type Row = { id: string; habit: string; lengthDays: number; done: number; lastAt: string | null };
    const pending = (q.active.all(r.userId) as Row[]).filter(
      (c) => !c.lastAt || localParts(new Date(c.lastAt), r.tz).date !== local.date,
    );
    if (pending.length > 0) {
      const c = pending[0];
      const more = pending.length > 1 ? ` (y ${pending.length - 1} más)` : "";
      await sendToUser(r.userId, {
        title: c.done > 0 ? `🔥 ¡No pierdas tu racha de ${c.done}!` : "🔥 ¡Hoy empieza tu reto!",
        body: `Marca el día ${c.done + 1} de «${c.habit}»${more}.`,
        url: pending.length > 1 ? "/app" : `/app/c/${c.id}`,
        tag: "daily-reminder",
      });
    }
    // Only after a send attempt, so a crash above retries next minute.
    q.setSent.run(local.date, r.userId);
  }
}

const g = globalThis as unknown as { __reminderTimer?: NodeJS.Timeout };

/** Start the once-a-minute reminder loop (idempotent). */
export function startReminderScheduler() {
  if (g.__reminderTimer) return;
  const tick = () => runReminderTick().catch((e) => console.error("[push] tick failed", e));
  g.__reminderTimer = setInterval(tick, 60_000);
  tick();
}
