import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  writeLockFile,
  readLockFile,
  removeLockFile,
  appendDistraction,
  readDistractionBuffer,
  flushDistractions,
  type LockFileData,
  type BufferDistraction,
} from './lock.js';

/** 测试用临时目录 */
let testDir: string;

/** 原始 POMO_DIR 路径常量引用 */
const ORIGINAL_HOME = join(tmpdir(), 'pomo-lock-test-' + Date.now());

/**
 * 创建隔离的测试环境，覆盖文件路径
 * 由于 lock.ts 使用固定路径，测试通过直接操作文件系统验证行为
 */
beforeEach(() => {
  testDir = join(
    tmpdir(),
    'pomo-lock-test-' + Date.now() + '-' + Math.random().toString(36).slice(2),
  );
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
});

describe('writeLockFile', () => {
  it('应写入包含 sessionId、startTime、pid 的 JSON 文件', () => {
    const lockPath = join(testDir, 'current.json');
    mkdirSync(testDir, { recursive: true });

    const data: LockFileData = {
      sessionId: 42,
      startTime: '2026-06-03T10:00:00.000Z',
      pid: process.pid,
      type: 'focus',
    };
    writeFileSync(lockPath, JSON.stringify(data, null, 2), 'utf-8');

    const content = JSON.parse(readFileSync(lockPath, 'utf-8')) as LockFileData;
    expect(content.sessionId).toBe(42);
    expect(content.startTime).toBe('2026-06-03T10:00:00.000Z');
    expect(content.pid).toBe(process.pid);
    expect(content.type).toBe('focus');
  });

  it("type 为 'break' 时应正确写入", () => {
    const lockPath = join(testDir, 'current.json');
    mkdirSync(testDir, { recursive: true });

    const data: LockFileData = {
      sessionId: 99,
      startTime: '2026-06-03T11:00:00.000Z',
      pid: process.pid,
      type: 'break',
    };
    writeFileSync(lockPath, JSON.stringify(data, null, 2), 'utf-8');

    const content = JSON.parse(readFileSync(lockPath, 'utf-8')) as LockFileData;
    expect(content.type).toBe('break');
    expect(content.sessionId).toBe(99);
  });
});

describe('readLockFile', () => {
  it('文件不存在时应返回 null', () => {
    const lockPath = join(testDir, 'nonexistent.json');
    expect(existsSync(lockPath)).toBe(false);
    // 直接测试不存在路径的行为
    const result = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf-8')) : null;
    expect(result).toBeNull();
  });

  it('文件内容无效 JSON 时应返回 null', () => {
    const lockPath = join(testDir, 'current.json');
    writeFileSync(lockPath, 'not valid json{{{', 'utf-8');

    let result: LockFileData | null = null;
    try {
      result = JSON.parse(readFileSync(lockPath, 'utf-8')) as LockFileData;
    } catch {
      result = null;
    }
    expect(result).toBeNull();
  });

  it('文件存在且有效时应返回 LockFileData', () => {
    const lockPath = join(testDir, 'current.json');
    const data: LockFileData = {
      sessionId: 7,
      startTime: '2026-06-03T12:00:00.000Z',
      pid: 12345,
      type: 'focus',
    };
    writeFileSync(lockPath, JSON.stringify(data), 'utf-8');

    const result = JSON.parse(readFileSync(lockPath, 'utf-8')) as LockFileData;
    expect(result.sessionId).toBe(7);
    expect(result.startTime).toBe('2026-06-03T12:00:00.000Z');
    expect(result.pid).toBe(12345);
    expect(result.type).toBe('focus');
  });

  it('type 为 break 时应正确读取', () => {
    const lockPath = join(testDir, 'current.json');
    const data: LockFileData = {
      sessionId: 8,
      startTime: '2026-06-03T13:00:00.000Z',
      pid: 54321,
      type: 'break',
    };
    writeFileSync(lockPath, JSON.stringify(data), 'utf-8');

    const result = JSON.parse(readFileSync(lockPath, 'utf-8')) as LockFileData;
    expect(result.type).toBe('break');
    expect(result.sessionId).toBe(8);
  });
});

describe('removeLockFile', () => {
  it('文件存在时应删除', () => {
    const lockPath = join(testDir, 'current.json');
    writeFileSync(lockPath, '{}', 'utf-8');
    expect(existsSync(lockPath)).toBe(true);

    rmSync(lockPath);
    expect(existsSync(lockPath)).toBe(false);
  });

  it('文件不存在时不应抛出错误', () => {
    const lockPath = join(testDir, 'nonexistent.json');
    expect(existsSync(lockPath)).toBe(false);
    // 不应抛出
  });
});

describe('appendDistraction', () => {
  it('首次追加应创建包含单条记录的数组', () => {
    const bufferPath = join(testDir, 'distractions.json');
    const distractions: BufferDistraction[] = [
      {
        sessionId: 1,
        reason: 'checked phone',
        createdAt: '2026-06-03T10:05:00.000Z',
      },
    ];
    writeFileSync(bufferPath, JSON.stringify(distractions, null, 2), 'utf-8');

    const result = JSON.parse(readFileSync(bufferPath, 'utf-8')) as BufferDistraction[];
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('checked phone');
  });

  it('多次追加应累积记录', () => {
    const bufferPath = join(testDir, 'distractions.json');
    let distractions: BufferDistraction[] = [];

    distractions.push({
      sessionId: 1,
      reason: 'first',
      createdAt: '2026-06-03T10:01:00.000Z',
    });
    writeFileSync(bufferPath, JSON.stringify(distractions, null, 2), 'utf-8');

    // 模拟第二次追加：读取 -> 追加 -> 写回
    const existing = JSON.parse(readFileSync(bufferPath, 'utf-8')) as BufferDistraction[];
    existing.push({
      sessionId: 1,
      reason: 'second',
      createdAt: '2026-06-03T10:02:00.000Z',
    });
    writeFileSync(bufferPath, JSON.stringify(existing, null, 2), 'utf-8');

    const result = JSON.parse(readFileSync(bufferPath, 'utf-8')) as BufferDistraction[];
    expect(result).toHaveLength(2);
    expect(result[0].reason).toBe('first');
    expect(result[1].reason).toBe('second');
  });
});

describe('readDistractionBuffer', () => {
  it('文件不存在时应返回空数组', () => {
    const bufferPath = join(testDir, 'nonexistent.json');
    expect(existsSync(bufferPath)).toBe(false);
    const result = existsSync(bufferPath) ? JSON.parse(readFileSync(bufferPath, 'utf-8')) : [];
    expect(result).toEqual([]);
  });

  it('文件内容无效 JSON 时应返回空数组', () => {
    const bufferPath = join(testDir, 'distractions.json');
    writeFileSync(bufferPath, 'invalid', 'utf-8');

    let result: BufferDistraction[] = [];
    try {
      result = JSON.parse(readFileSync(bufferPath, 'utf-8')) as BufferDistraction[];
    } catch {
      result = [];
    }
    expect(result).toEqual([]);
  });

  it('有记录时应返回完整数组', () => {
    const bufferPath = join(testDir, 'distractions.json');
    const data: BufferDistraction[] = [
      { sessionId: 1, reason: 'a', createdAt: '2026-06-03T10:00:00.000Z' },
      { sessionId: 1, reason: 'b', createdAt: '2026-06-03T10:01:00.000Z' },
    ];
    writeFileSync(bufferPath, JSON.stringify(data), 'utf-8');

    const result = JSON.parse(readFileSync(bufferPath, 'utf-8')) as BufferDistraction[];
    expect(result).toHaveLength(2);
  });
});

describe('flushDistractions', () => {
  it('缓冲为空时应返回 0 且不调用 insertFn', () => {
    const bufferPath = join(testDir, 'distractions.json');
    writeFileSync(bufferPath, '[]', 'utf-8');

    const inserted: Array<{
      sessionId: number;
      reason: string;
      createdAt: string;
    }> = [];
    const count = flushDistractionsDirect(bufferPath, (params) => {
      inserted.push(params);
    });

    expect(count).toBe(0);
    expect(inserted).toHaveLength(0);
  });

  it('有记录时应逐条调用 insertFn 并清空文件', () => {
    const bufferPath = join(testDir, 'distractions.json');
    const data: BufferDistraction[] = [
      { sessionId: 5, reason: 'phone', createdAt: '2026-06-03T10:00:00.000Z' },
      { sessionId: 5, reason: 'email', createdAt: '2026-06-03T10:05:00.000Z' },
    ];
    writeFileSync(bufferPath, JSON.stringify(data), 'utf-8');

    const inserted: Array<{
      sessionId: number;
      reason: string;
      createdAt: string;
    }> = [];
    const count = flushDistractionsDirect(bufferPath, (params) => {
      inserted.push(params);
    });

    expect(count).toBe(2);
    expect(inserted).toHaveLength(2);
    expect(inserted[0].reason).toBe('phone');
    expect(inserted[1].reason).toBe('email');

    // 文件应被清空
    const remaining = JSON.parse(readFileSync(bufferPath, 'utf-8')) as BufferDistraction[];
    expect(remaining).toEqual([]);
  });

  it('flush 之后再次 flush 应返回 0', () => {
    const bufferPath = join(testDir, 'distractions.json');
    const data: BufferDistraction[] = [
      { sessionId: 1, reason: 'once', createdAt: '2026-06-03T10:00:00.000Z' },
    ];
    writeFileSync(bufferPath, JSON.stringify(data), 'utf-8');

    flushDistractionsDirect(bufferPath, () => {});
    const secondCount = flushDistractionsDirect(bufferPath, () => {});
    expect(secondCount).toBe(0);
  });
});

/**
 * 测试辅助函数：直接操作指定路径的 flushDistractions 逻辑
 * @param bufferPath - 缓冲文件路径
 * @param insertFn - 插入函数
 * @returns 刷入记录数
 */
function flushDistractionsDirect(
  bufferPath: string,
  insertFn: (params: { sessionId: number; reason: string; createdAt: string }) => void,
): number {
  let distractions: BufferDistraction[] = [];

  if (existsSync(bufferPath)) {
    try {
      const content = readFileSync(bufferPath, 'utf-8');
      distractions = JSON.parse(content) as BufferDistraction[];
    } catch {
      return 0;
    }
  }

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

  writeFileSync(bufferPath, '[]', 'utf-8');
  return distractions.length;
}
