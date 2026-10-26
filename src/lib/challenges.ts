import { randomUUID } from "node:crypto";
import { db } from "./db";

export const CHALLENGE_LENGTH = 33;

export type Challenge = {
  id: string;
  userId: string;
  habit: string;
  rewardTangible: string | null;
  rewardIntangible: string | null;
  rewardGrand: string | null;
  lengthDays: number;
  createdAt: string;
  completedAt: string | null;
};

export type ChallengeWithProgress = Challenge & {
  done: number;
  days: number[]; // marked day numbers
};

const q = {
  insert: db.prepare(
    `INSERT INTO challenge (id, userId, habit, rewardTangible, rewardIntangible, rewardGrand, lengthDays, createdAt)
     VALUES (@id, @userId, @habit, @rewardTangible, @rewardIntangible, @rewardGrand, @lengthDays, @createdAt)`,
  ),
  byUser: db.prepare(
    `SELECT * FROM challenge WHERE userId = ? ORDER BY completedAt IS NOT NULL, createdAt DESC`,
  ),
  one: db.prepare(`SELECT * FROM challenge WHERE id = ? AND userId = ?`),
  del: db.prepare(`DELETE FROM challenge WHERE id = ? AND userId = ?`),
  delMarks: db.prepare(`DELETE FROM day_mark WHERE challengeId = ?`),
  marks: db.prepare(`SELECT day FROM day_mark WHERE challengeId = ? ORDER BY day`),
  markCount: db.prepare(`SELECT COUNT(*) n FROM day_mark WHERE challengeId = ?`),
  hasDay: db.prepare(`SELECT 1 FROM day_mark WHERE challengeId = ? AND day = ?`),
  addDay: db.prepare(`INSERT OR IGNORE INTO day_mark (challengeId, day, doneAt) VALUES (?, ?, ?)`),
  removeDay: db.prepare(`DELETE FROM day_mark WHERE challengeId = ? AND day = ?`),
  setCompleted: db.prepare(`UPDATE challenge SET completedAt = ? WHERE id = ?`),
};

export function createChallenge(
  userId: string,
  input: { habit: string; tangible?: string; intangible?: string; grand?: string },
): string {
  const id = randomUUID();
  q.insert.run({
    id,
    userId,
    habit: input.habit.trim().slice(0, 80),
    rewardTangible: input.tangible?.trim().slice(0, 140) || null,
    rewardIntangible: input.intangible?.trim().slice(0, 140) || null,
    rewardGrand: input.grand?.trim().slice(0, 140) || null,
    lengthDays: CHALLENGE_LENGTH,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export function listChallenges(userId: string): ChallengeWithProgress[] {
  const rows = q.byUser.all(userId) as Challenge[];
  return rows.map((c) => {
    const days = (q.marks.all(c.id) as { day: number }[]).map((r) => r.day);
    return { ...c, days, done: days.length };
  });
}

export function getChallenge(
  id: string,
  userId: string,
): ChallengeWithProgress | null {
  const c = q.one.get(id, userId) as Challenge | undefined;
  if (!c) return null;
  const days = (q.marks.all(c.id) as { day: number }[]).map((r) => r.day);
  return { ...c, days, done: days.length };
}

function refreshCompletion(id: string, lengthDays: number) {
  const n = (q.markCount.get(id) as { n: number }).n;
  if (n >= lengthDays) q.setCompleted.run(new Date().toISOString(), id);
  else q.setCompleted.run(null, id);
}

/** Toggle one day on/off. Returns the new marked-days array. */
export function toggleDay(id: string, userId: string, day: number): number[] | null {
  const c = q.one.get(id, userId) as Challenge | undefined;
  if (!c) return null;
  if (day < 1 || day > c.lengthDays) return null;
  const exists = q.hasDay.get(id, day);
  if (exists) q.removeDay.run(id, day);
  else q.addDay.run(id, day, new Date().toISOString());
  refreshCompletion(id, c.lengthDays);
  return (q.marks.all(id) as { day: number }[]).map((r) => r.day);
}

/** Mark the next unmarked day (one-tap "done today"). */
export function markNext(id: string, userId: string): number[] | null {
  const c = q.one.get(id, userId) as Challenge | undefined;
  if (!c) return null;
  const marked = new Set((q.marks.all(id) as { day: number }[]).map((r) => r.day));
  for (let d = 1; d <= c.lengthDays; d++) {
    if (!marked.has(d)) {
      q.addDay.run(id, d, new Date().toISOString());
      refreshCompletion(id, c.lengthDays);
      break;
    }
  }
  return (q.marks.all(id) as { day: number }[]).map((r) => r.day);
}

export function deleteChallenge(id: string, userId: string) {
  const c = q.one.get(id, userId) as Challenge | undefined;
  if (!c) return;
  q.delMarks.run(id);
  q.del.run(id, userId);
}
