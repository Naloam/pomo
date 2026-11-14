import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { SessionType } from '../types/index.js';

/** Lock file 内容结构 */
export interface LockFileData {
  /** 当前运行的会话 ID */
  sessionId: number;
  /** 会话开始时间（ISO 8601） */
  startTime: string;
  /** 运行中的进程 PID */
  pid: number;
  /** 当前会话类型 */
  type: SessionType;
}

/** 缓冲的分心记录结构 */
export interface BufferDistraction {
  /** 关联的会话 ID */
  sessionId: number;
  /** 分心原因 */
  reason: string;
  /** 记录时间（ISO 8601） */
  createdAt: string;
}

/** ~/.pomo 目录路径 */
const POMO_DIR = join(homedir(), '.pomo');

/** lock 文件路径 */
const LOCK_FILE_PATH = join(POMO_DIR, 'current.json');

/** distractions 缓冲文件路径 */
const DISTRACTIONS_BUFFER_PATH = join(POMO_DIR, 'distractions.json');

/**
 * 获取 lock 文件路径（供测试覆盖）
 * @returns lock 文件的绝对路径
 */
export function getLockFilePath(): string {
  return LOCK_FILE_PATH;
}

/**
 * 获取 distractions 缓冲文件路径（供测试覆盖）
 * @returns distractions 缓冲文件的绝对路径
 */
export function getDistractionsBufferPath(): string {
  return DISTRACTIONS_BUFFER_PATH;
}

/**
 * 写入 lock 文件，记录当前活跃会话信息
 * @param sessionId - 当前会话 ID
 * @param startTime - 会话开始时间（ISO 8601）
 * @param type - 当前会话类型
 */
export function writeLockFile(sessionId: number, startTime: string, type: SessionType): void {
  mkdirSync(POMO_DIR, { recursive: true });

  const data: LockFileData = {
    sessionId,
    startTime,
    pid: process.pid,
    type,
  };

  writeFileSync(LOCK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 读取 lock 文件，返回当前活跃会话信息
 * @returns LockFileData 或 null（文件不存在时）
 */
export function readLockFile(): LockFileData | null {
  if (!existsSync(LOCK_FILE_PATH)) {
    return null;
  }

  try {
    const content = readFileSync(LOCK_FILE_PATH, 'utf-8');
    const data = JSON.parse(content) as LockFileData;
    return data;
  } catch {
    return null;
  }
}

/**
 * 删除 lock 文件
 */
export function removeLockFile(): void {
  if (existsSync(LOCK_FILE_PATH)) {
    unlinkSync(LOCK_FILE_PATH);
  }
}

/**
 * 追加分心记录到 distractions.json 缓冲文件
 * @param sessionId - 关联的会话 ID
 * @param reason - 分心原因
 */
export function appendDistraction(sessionId: number, reason: string): void {
  mkdirSync(POMO_DIR, { recursive: true });

  let distractions: BufferDistraction[] = [];

  if (existsSync(DISTRACTIONS_BUFFER_PATH)) {
    try {
      const content = readFileSync(DISTRACTIONS_BUFFER_PATH, 'utf-8');
      distractions = JSON.parse(content) as BufferDistraction[];
    } catch {
      distractions = [];
    }
  }

  distractions.push({
    sessionId,
    reason,
    createdAt: new Date().toISOString(),
  });

  writeFileSync(DISTRACTIONS_BUFFER_PATH, JSON.stringify(distractions, null, 2), 'utf-8');
}

/**
 * 读取 distractions 缓冲文件中的所有记录
 * @returns BufferDistraction 数组
 */
export function readDistractionBuffer(): BufferDistraction[] {
  if (!existsSync(DISTRACTIONS_BUFFER_PATH)) {
    return [];
  }

  try {
    const content = readFileSync(DISTRACTIONS_BUFFER_PATH, 'utf-8');
    return JSON.parse(content) as BufferDistraction[];
  } catch {
    return [];
  }
}

/**
 * 检查指定 pid 的进程是否仍然存活（信号 0 探测）。
 *
 * 用于崩溃恢复：lock 文件里记录了会话进程的 pid，SIGKILL / 关闭终端等
 * 未走 SIGINT 清理路径的退出会让会话行永久停留在 running。ESRCH = 进程
 * 不存在；EPERM = 进程存在但属于其他用户（视为存活，宁可保守拒绝启动）。
 * pid 被复用理论上可能误判存活，对单人 CLI 场景是可接受的启发式。
 *
 * @param pid - 进程 ID
 * @returns 进程存活返回 true
 */
export function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * 将 distractions.json 中的记录刷入 SQLite，然后清空缓冲文件
 * @param insertFn - 插入分心记录到数据库的函数
 * @returns 成功刷入的记录数
 */
export function flushDistractions(
  insertFn: (params: { sessionId: number; reason: string; createdAt: string }) => void,
): number {
  const distractions = readDistractionBuffer();

  if (distractions.length === 0) {
    return 0;
  }

  for (const d of distractions) {
    insertFn({
      sessionId: d.sessionId,
      reason: d.reason,
      createdAt: d.createdAt,
    });
  }

  // 清空缓冲文件
  writeFileSync(DISTRACTIONS_BUFFER_PATH, '[]', 'utf-8');

  return distractions.length;
}
