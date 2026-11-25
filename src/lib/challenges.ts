import { randomUUID } from "node:crypto";
import { db } from "./db";
import { isChallengeDay, nextUnmarkedDay } from "./challenge-days";

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
  return (q.byUser.all(userId) as Challenge[]).map(withProgress);
}

function markedDays(id: string): number[] {
  return (q.marks.all(id) as { day: number }[]).map(({ day }) => day);
}

function withProgress(challenge: Challenge): ChallengeWithProgress {
  const days = markedDays(challenge.id);
  return { ...challenge, days, done: days.length };
}

export function getChallenge(
  id: string,
  userId: string,
): ChallengeWithProgress | null {
  const c = q.one.get(id, userId) as Challenge | undefined;
  return c ? withProgress(c) : null;
}

function refreshCompletion(id: string, lengthDays: number) {
  const n = (q.markCount.get(id) as { n: number }).n;
  if (n >= lengthDays) q.setCompleted.run(new Date().toISOString(), id);
  else q.setCompleted.run(null, id);
}

/** Toggle one day on/off. Returns the new marked-days array. */
export const toggleDay = db.transaction((id: string, userId: string, day: number): number[] | null => {
  const c = q.one.get(id, userId) as Challenge | undefined;
  if (!c || !isChallengeDay(day, c.lengthDays)) return null;
  const exists = q.hasDay.get(id, day);
  if (exists) q.removeDay.run(id, day);
  else q.addDay.run(id, day, new Date().toISOString());
  refreshCompletion(id, c.lengthDays);
  return markedDays(id);
}).immediate;

/** Mark the next unmarked day (one-tap "done today"). */
export const markNext = db.transaction((id: string, userId: string): number[] | null => {
  const c = q.one.get(id, userId) as Challenge | undefined;
  if (!c) return null;
  const days = markedDays(id);
  const day = nextUnmarkedDay(days, c.lengthDays);
  if (day === undefined) return days;
  q.addDay.run(id, day, new Date().toISOString());
  refreshCompletion(id, c.lengthDays);
  return markedDays(id);
}).immediate;

export const deleteChallenge = db.transaction((id: string, userId: string) => {
  const c = q.one.get(id, userId) as Challenge | undefined;
  if (!c) return;
  q.delMarks.run(id);
  q.del.run(id, userId);
}).immediate;
