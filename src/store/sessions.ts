import type {
  Session,
  SessionStatus,
  Distraction,
  CreateSessionParams,
  CreateDistractionParams,
} from '../types/index.js';
import { getDb } from './db.js';

/**
 * 将数据库行映射为 Session 对象
 * @param row - 数据库行
 * @returns Session 对象
 */
function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as number,
    type: row.type as Session['type'],
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | null,
    duration: row.duration as number,
    actualDuration: row.actual_duration as number | null,
    status: row.status as SessionStatus,
  };
}

/**
 * 将数据库行映射为 Distraction 对象
 * @param row - 数据库行
 * @returns Distraction 对象
 */
function rowToDistraction(row: Record<string, unknown>): Distraction {
  return {
    id: row.id as number,
    sessionId: row.session_id as number,
    reason: row.reason as string,
    createdAt: row.created_at as string,
  };
}

/**
 * 创建新的会话
 * @param params - 创建会话参数
 * @returns 创建的 Session 对象
 */
export function createSession(params: CreateSessionParams): Session {
  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (type, started_at, ended_at, duration, actual_duration, status)
    VALUES (?, ?, NULL, ?, NULL, 'running')
  `);

  const result = stmt.run(params.type, now, params.duration);

  return {
    id: Number(result.lastInsertRowid),
    type: params.type,
    startedAt: now,
    endedAt: null,
    duration: params.duration,
    actualDuration: null,
    status: 'running',
  };
}

/**
 * 结束指定会话
 * @param id - 会话ID
 * @param status - 结束状态（completed 或 interrupted）
 * @returns 更新后的 Session 对象，若会话不存在返回 null
 */
export function endSession(
  id: number,
  status: Extract<SessionStatus, 'completed' | 'interrupted'>,
): Session | null {
  const db = getDb();

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;

  if (!session) return null;

  const endedAt = new Date().toISOString();
  const startedAt = new Date(session.started_at as string);
  const actualDuration = Math.round((new Date(endedAt).getTime() - startedAt.getTime()) / 1000);

  db.prepare('UPDATE sessions SET ended_at = ?, actual_duration = ?, status = ? WHERE id = ?').run(
    endedAt,
    actualDuration,
    status,
    id,
  );

  return {
    id,
    type: session.type as Session['type'],
    startedAt: session.started_at as string,
    endedAt,
    duration: session.duration as number,
    actualDuration,
    status,
  };
}

/**
 * 获取当前正在进行的会话
 * @returns 当前运行中的 Session，若无返回 null
 */
export function getCurrentSession(): Session | null {
  const db = getDb();

  const row = db
    .prepare("SELECT * FROM sessions WHERE status = 'running' ORDER BY id DESC LIMIT 1")
    .get() as Record<string, unknown> | undefined;

  return row ? rowToSession(row) : null;
}

/**
 * 获取指定日期的所有会话
 * @param date - 日期字符串（YYYY-MM-DD）
 * @returns 该日期的 Session 数组
 */
export function getSessionsByDate(date: string): Session[] {
  const db = getDb();

  const rows = db
    .prepare('SELECT * FROM sessions WHERE DATE(started_at) = ? ORDER BY started_at')
    .all(date) as Record<string, unknown>[];

  return rows.map(rowToSession);
}

/**
 * 获取所有会话
 * @returns 所有 Session 数组
 */
export function getAllSessions(): Session[] {
  const db = getDb();

  const rows = db.prepare('SELECT * FROM sessions ORDER BY started_at').all() as Record<
    string,
    unknown
  >[];

  return rows.map(rowToSession);
}

/**
 * 添加分心记录
 * @param params - 创建分心记录参数
 * @returns 创建的 Distraction 对象
 */
export function addDistraction(params: CreateDistractionParams): Distraction {
  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO distractions (session_id, reason, created_at)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(params.sessionId, params.reason, now);

  return {
    id: Number(result.lastInsertRowid),
    sessionId: params.sessionId,
    reason: params.reason,
    createdAt: now,
  };
}

/**
 * 获取指定会话的所有分心记录
 * @param sessionId - 会话ID
 * @returns 该会话的 Distraction 数组
 */
export function getDistractionsBySession(sessionId: number): Distraction[] {
  const db = getDb();

  const rows = db
    .prepare('SELECT * FROM distractions WHERE session_id = ? ORDER BY created_at')
    .all(sessionId) as Record<string, unknown>[];

  return rows.map(rowToDistraction);
}

/**
 * 获取所有分心记录
 * @returns 所有 Distraction 数组
 */
export function getAllDistractions(): Distraction[] {
  const db = getDb();

  const rows = db.prepare('SELECT * FROM distractions ORDER BY created_at').all() as Record<
    string,
    unknown
  >[];

  return rows.map(rowToDistraction);
}
