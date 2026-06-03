import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import { getAllSessions } from '../store/sessions.js';
import { formatJson, formatCsv } from '../core/formatter.js';

/**
 * 创建 export 命令
 * 导出所有历史会话数据为 JSON 或 CSV 格式
 * @returns Commander 命令实例
 */
export function createExportCommand(): Command {
  const command = new Command('export')
    .description('Export all session history data')
    .option('-f, --format <format>', 'Output format: json or csv', 'json')
    .option('-o, --output <file>', 'Output file path (default: stdout)')
    .action((opts: { format: string; output?: string }) => {
      const sessions = getAllSessions();

      let formatted: string;
      if (opts.format === 'csv') {
        formatted = formatCsv(sessions);
      } else if (opts.format === 'json') {
        formatted = formatJson(sessions);
      } else {
        console.error(`Unknown format: ${opts.format}. Use json or csv.`);
        process.exitCode = 1;
        return;
      }

      if (opts.output) {
        writeFileSync(opts.output, formatted + '\n', 'utf-8');
        console.log(`Exported ${sessions.length} sessions to ${opts.output}`);
      } else {
        process.stdout.write(formatted + '\n');
      }
    });

  return command;
}
