import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { env } from "./env";

// Single shared connection. Next may re-import in dev; cache on globalThis.
const g = globalThis as unknown as { __db?: Database.Database };

function create(): Database.Database {
  mkdirSync(dirname(env.dbPath), { recursive: true });
  const db = new Database(env.dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // App tables (better-auth tables are created by its own migrations).
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenge (
      id            TEXT PRIMARY KEY,
      userId        TEXT NOT NULL,
      habit         TEXT NOT NULL,
      rewardTangible   TEXT,
      rewardIntangible TEXT,
      rewardGrand      TEXT,
      lengthDays    INTEGER NOT NULL DEFAULT 33,
      createdAt     TEXT NOT NULL,
      completedAt   TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_challenge_user ON challenge(userId);

    CREATE TABLE IF NOT EXISTS day_mark (
      challengeId TEXT NOT NULL,
      day         INTEGER NOT NULL,
      doneAt      TEXT NOT NULL,
      PRIMARY KEY (challengeId, day)
    );

    -- Small key/value store (e.g. auto-generated VAPID keys).
    CREATE TABLE IF NOT EXISTS kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Web Push subscriptions, one per device/browser.
    CREATE TABLE IF NOT EXISTS push_sub (
      endpoint  TEXT PRIMARY KEY,
      userId    TEXT NOT NULL,
      p256dh    TEXT NOT NULL,
      auth      TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_sub(userId);

    -- Daily reminder settings per user. time is local "HH:MM" in tz.
    CREATE TABLE IF NOT EXISTS reminder (
      userId       TEXT PRIMARY KEY,
      time         TEXT NOT NULL,
      tz           TEXT NOT NULL,
      lastSentDate TEXT
    );
  `);
  return db;
}

export const db = g.__db ?? (g.__db = create());
