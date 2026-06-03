import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { getAllSessions } from '../store/sessions.js';
import { HistoryView } from '../ui/HistoryView.js';

/**
 * 创建 history 命令
 * 展示历史完成数据的 ASCII 进度条视图
 * @returns Commander 命令实例
 */
export function createHistoryCommand(): Command {
  const command = new Command('history')
    .description('Show pomodoro history with ASCII progress bars')
    .option('--week', 'Show last 7 days')
    .option('--month', 'Show last 30 days')
    .action(async (opts: { week?: boolean; month?: boolean }) => {
      const sessions = getAllSessions();
      const days = opts.month ? 30 : 7; // default to week view

      const { waitUntilExit } = render(React.createElement(HistoryView, { sessions, days }));

      await waitUntilExit();
    });

  return command;
}
