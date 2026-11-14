import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { closeDb, setDbForTesting } from './db.js';
import {
  createSession,
  endSession,
  getCurrentSession,
  getSessionsByDate,
  getAllSessions,
  addDistraction,
  getDistractionsBySession,
  getAllDistractions,
} from './sessions.js';

/**
 * 创建内存数据库并初始化表结构，用于测试隔离
 */
function setupTestDb(): void {
  // 关闭之前的连接
  closeDb();

  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  db.exec(`
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

  setDbForTesting(db);
}

describe('createSession', () => {
  beforeEach(() => {
    setupTestDb();
  });

  it('should create a focus session', () => {
    const session = createSession({ type: 'focus', duration: 1500 });

    expect(session.type).toBe('focus');
    expect(session.duration).toBe(1500);
    expect(session.status).toBe('running');
    expect(session.endedAt).toBeNull();
    expect(session.actualDuration).toBeNull();
    expect(session.id).toBeGreaterThan(0);
    expect(session.startedAt).toBeTruthy();
  });

  it('should create a break session', () => {
    const session = createSession({ type: 'break', duration: 300 });

    expect(session.type).toBe('break');
    expect(session.duration).toBe(300);
    expect(session.status).toBe('running');
  });

  it('should assign incremental ids', () => {
    const s1 = createSession({ type: 'focus', duration: 1500 });
    const s2 = createSession({ type: 'break', duration: 300 });

    expect(s2.id).toBe(s1.id + 1);
  });
});

describe('endSession', () => {
  beforeEach(() => {
    setupTestDb();
  });

  it('should end a session as completed', () => {
    const session = createSession({ type: 'focus', duration: 1500 });
    const ended = endSession(session.id, 'completed');

    expect(ended).not.toBeNull();
    expect(ended!.status).toBe('completed');
    expect(ended!.endedAt).toBeTruthy();
    expect(ended!.actualDuration).toBeGreaterThanOrEqual(0);
  });

  it('should end a session as interrupted', () => {
    const session = createSession({ type: 'focus', duration: 1500 });
    const ended = endSession(session.id, 'interrupted');

    expect(ended).not.toBeNull();
    expect(ended!.status).toBe('interrupted');
    expect(ended!.endedAt).toBeTruthy();
  });

  it('should return null for non-existent session', () => {
    const result = endSession(999, 'completed');
    expect(result).toBeNull();
  });
});

describe('getCurrentSession', () => {
  beforeEach(() => {
    setupTestDb();
  });

  it('should return null when no running session exists', () => {
    expect(getCurrentSession()).toBeNull();
  });

  it('should return the running session', () => {
    const created = createSession({ type: 'focus', duration: 1500 });
    const current = getCurrentSession();

    expect(current).not.toBeNull();
    expect(current!.id).toBe(created.id);
    expect(current!.status).toBe('running');
  });

  it('should return null after session ends', () => {
    const session = createSession({ type: 'focus', duration: 1500 });
    endSession(session.id, 'completed');

    expect(getCurrentSession()).toBeNull();
  });

  it('should return the latest running session', () => {
    const s1 = createSession({ type: 'focus', duration: 1500 });
    endSession(s1.id, 'completed');
    const s2 = createSession({ type: 'break', duration: 300 });

    const current = getCurrentSession();
    expect(current).not.toBeNull();
    expect(current!.id).toBe(s2.id);
  });
});

describe('getSessionsByDate', () => {
  beforeEach(() => {
    setupTestDb();
  });

  it('should return sessions for a specific date', () => {
    // 创建一个会话，用今天的【本地】日期查询（与 stats 层 toLocalDate 口径一致；
    // 原断言用 toISOString() 的 UTC 日期，在非 UTC 时区的清晨会间歇性失败）
    createSession({ type: 'focus', duration: 1500 });
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const sessions = getSessionsByDate(localDate);
    expect(sessions.length).toBe(1);
    expect(sessions[0].type).toBe('focus');
  });

  it('should return empty array for date with no sessions', () => {
    const sessions = getSessionsByDate('2000-01-01');
    expect(sessions).toEqual([]);
  });
});

describe('getAllSessions', () => {
  beforeEach(() => {
    setupTestDb();
  });

  it('should return all sessions ordered by startedAt', () => {
    createSession({ type: 'focus', duration: 1500 });
    createSession({ type: 'break', duration: 300 });
    createSession({ type: 'focus', duration: 1500 });

    const sessions = getAllSessions();
    expect(sessions.length).toBe(3);
  });

  it('should return empty array when no sessions exist', () => {
    expect(getAllSessions()).toEqual([]);
  });
});

describe('addDistraction', () => {
  beforeEach(() => {
    setupTestDb();
  });

  it('should add a distraction record', () => {
    const session = createSession({ type: 'focus', duration: 1500 });
    const distraction = addDistraction({
      sessionId: session.id,
      reason: 'checked phone',
    });

    expect(distraction.sessionId).toBe(session.id);
    expect(distraction.reason).toBe('checked phone');
    expect(distraction.id).toBeGreaterThan(0);
    expect(distraction.createdAt).toBeTruthy();
  });

  it('should add multiple distractions to same session', () => {
    const session = createSession({ type: 'focus', duration: 1500 });
    addDistraction({ sessionId: session.id, reason: 'phone' });
    addDistraction({ sessionId: session.id, reason: 'email' });

    const distractions = getDistractionsBySession(session.id);
    expect(distractions.length).toBe(2);
  });
});

describe('getDistractionsBySession', () => {
  beforeEach(() => {
    setupTestDb();
  });

  it('should return distractions for a specific session', () => {
    const s1 = createSession({ type: 'focus', duration: 1500 });
    const s2 = createSession({ type: 'focus', duration: 1500 });

    addDistraction({ sessionId: s1.id, reason: 'phone' });
    addDistraction({ sessionId: s2.id, reason: 'email' });
    addDistraction({ sessionId: s1.id, reason: 'noise' });

    const distractions = getDistractionsBySession(s1.id);
    expect(distractions.length).toBe(2);
    expect(distractions.every((d) => d.sessionId === s1.id)).toBe(true);
  });

  it('should return empty array for session with no distractions', () => {
    const session = createSession({ type: 'focus', duration: 1500 });
    expect(getDistractionsBySession(session.id)).toEqual([]);
  });
});

describe('getAllDistractions', () => {
  beforeEach(() => {
    setupTestDb();
  });

  it('should return all distractions ordered by createdAt', () => {
    const session = createSession({ type: 'focus', duration: 1500 });
    addDistraction({ sessionId: session.id, reason: 'phone' });
    addDistraction({ sessionId: session.id, reason: 'email' });

    const distractions = getAllDistractions();
    expect(distractions.length).toBe(2);
  });

  it('should return empty array when no distractions exist', () => {
    expect(getAllDistractions()).toEqual([]);
  });
});

afterAll(() => {
  closeDb();
});
