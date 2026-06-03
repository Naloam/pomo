import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/** 单例数据库连接实例 */
let db: Database.Database | null = null;

/**
 * 获取数据库连接单例
 * @returns better-sqlite3 数据库实例
 */
export function getDb(): Database.Database {
  if (db) return db;

  const dbDir = join(homedir(), '.pomo');
  mkdirSync(dbDir, { recursive: true });

  const dbPath = join(dbDir, 'sessions.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * 初始化数据库表结构
 * - sessions: 番茄钟会话记录
 * - distractions: 分心记录
 */
export function initDb(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('focus', 'break')),
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration INTEGER NOT NULL,
      actual_duration INTEGER,
      status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'interrupted'))
    );

    CREATE TABLE IF NOT EXISTS distractions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);
}

/**
 * 关闭数据库连接（用于测试清理）
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 覆盖数据库连接实例（仅供测试使用）
 * @param instance - 要设置的数据库实例，传 null 则重置
 */
export function setDbForTesting(instance: Database.Database | null): void {
  db = instance;
}
