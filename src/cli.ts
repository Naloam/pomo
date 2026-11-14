#!/usr/bin/env node

import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { App } from './ui/App.js';
import { initDb, closeDb } from './store/db.js';
import {
  createSession,
  getCurrentSession,
  endSession,
  addDistraction,
  getAllSessions,
  getAllDistractions,
} from './store/sessions.js';
import {
  writeLockFile,
  readLockFile,
  removeLockFile,
  appendDistraction,
  flushDistractions,
  isProcessAlive,
} from './store/lock.js';
import { calculateStats } from './core/stats.js';
import { startTimer } from './core/timer.js';
import { TimerConfig, type SessionType } from './types/index.js';
import { createExportCommand } from './commands/export.js';
import { createConfigCommand } from './commands/config.js';
import { createHistoryCommand } from './commands/history.js';

const DEFAULT_CONFIG: TimerConfig = {
  focusDuration: 25 * 60, // 25 分钟
  breakDuration: 5 * 60, // 5 分钟
};

/**
 * 启动计时器的公共逻辑，供 start 和 break 命令共用
 * @param type - 会话类型（focus 或 break）
 * @param duration - 计时器时长（秒）
 * @param label - 启动时的提示文字
 */
async function launchTimer(type: SessionType, duration: number, label: string): Promise<void> {
  try {
    initDb();

    // 检查是否有正在进行的会话
    const current = getCurrentSession();
    if (current) {
      const lock = readLockFile();
      const stillRunning =
        lock !== null && lock.sessionId === current.id && isProcessAlive(lock.pid);
      if (stillRunning) {
        console.log('⚠️  已有正在进行的会话，请先完成或停止它');
        process.exit(1);
      }
      // 上个会话的进程已不在（SIGKILL / 关闭终端等未走清理路径）：
      // 标记为 interrupted、刷入其缓冲的分心记录并清掉陈旧 lock，
      // 否则一次崩溃会让 start/break 永远被拒（本 CLI 没有 stop 命令）。
      endSession(current.id, 'interrupted');
      flushDistractions((params) => addDistraction(params));
      removeLockFile();
      console.log(`🧹 清理了未正常结束的会话 #${current.id}（标记为 interrupted）`);
    }

    // 创建新会话
    const session = createSession({ type, duration });

    // 写入 lock 文件，供 pomo distract 跨进程使用
    writeLockFile(session.id, session.startedAt, type);

    console.log(label);

    // 注册信号处理器，确保 graceful shutdown（SIGTERM 是 kill 的默认信号）
    const shutdown = (): void => {
      flushDistractions((params) => addDistraction(params));
      removeLockFile();
      closeDb();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // 创建计时器状态，并关联数据库会话 ID
    const timerState = {
      ...startTimer(type, duration),
      sessionId: session.id,
    };

    // 渲染 TUI
    const { waitUntilExit } = render(
      React.createElement(App, {
        mode: 'timer',
        timerState,
      }),
    );

    await waitUntilExit();

    // 结束会话后清理 lock 文件并将缓冲的分心记录刷入 SQLite
    flushDistractions((params) => addDistraction(params));
    removeLockFile();
    closeDb();
  } catch (error) {
    console.error('❌ 错误:', error);
    closeDb();
    process.exit(1);
  }
}

const program = new Command();

program.name('pomo').description('Terminal Pomodoro + Distraction Tracker').version('1.0.0');

program
  .command('start')
  .description('Start a 25-minute focus timer')
  .action(async () => {
    await launchTimer('focus', DEFAULT_CONFIG.focusDuration, '🍅 开始专注！');
  });

program
  .command('break')
  .description('Start a 5-minute break timer')
  .action(async () => {
    await launchTimer('break', DEFAULT_CONFIG.breakDuration, '☕ 开始休息！');
  });

program
  .command('distract <reason>')
  .description('Record a distraction during current focus session')
  .action((reason: string) => {
    try {
      // 从 lock 文件获取当前会话（避免 SQLite 并发锁）
      const lock = readLockFile();
      if (!lock) {
        console.log('⚠️  没有正在进行的专注会话');
        process.exit(1);
      }

      if (lock.type !== 'focus') {
        console.log('⚠️  只能在专注会话中记录分心');
        process.exit(1);
      }

      // 追加分心记录到缓冲文件
      appendDistraction(lock.sessionId, reason);

      console.log(`📝 已记录分心: ${reason}`);
    } catch (error) {
      console.error('❌ 错误:', error);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description("Show today's statistics")
  .action(() => {
    try {
      initDb();

      // 获取数据
      const sessions = getAllSessions();
      const distractions = getAllDistractions();

      // 计算统计
      const stats = calculateStats(sessions, distractions);

      // 渲染统计视图
      render(React.createElement(App, { mode: 'stats', stats }));

      closeDb();
    } catch (error) {
      console.error('❌ 错误:', error);
      closeDb();
      process.exit(1);
    }
  });

// 注册新命令
program.addCommand(createExportCommand());
program.addCommand(createConfigCommand());
program.addCommand(createHistoryCommand());

program.parse();
