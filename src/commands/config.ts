import { Command } from 'commander';
import type { AppConfig, ConfigKey } from '../types/index.js';
import { readConfig, writeConfig } from '../store/config.js';

/**
 * 将秒数格式化为可读的分钟字符串
 * @param seconds - 秒数
 * @returns 格式化字符串，如 "25m"
 */
function formatDuration(seconds: number): string {
  return `${Math.round(seconds / 60)}m`;
}

/**
 * 创建 config 命令
 * 管理 pomo 配置文件（~/.pomo/config.json）
 * @returns Commander 命令实例
 */
export function createConfigCommand(): Command {
  const command = new Command('config').description('Manage pomo configuration');

  command
    .command('list')
    .description('List all configuration values')
    .action(() => {
      const config = readConfig();
      console.log('Current configuration:');
      console.log(`  focusDuration = ${formatDuration(config.focusDuration)}`);
      console.log(`  breakDuration = ${formatDuration(config.breakDuration)}`);
      console.log(`  notifyEnabled = ${config.notifyEnabled}`);
    });

  command
    .command('get <key>')
    .description('Get a configuration value')
    .action((key: string) => {
      const config = readConfig();
      if (!(key in config)) {
        console.error(`Unknown config key: ${key}`);
        console.error(`Valid keys: ${Object.keys(config).join(', ')}`);
        process.exitCode = 1;
        return;
      }

      const configKey = key as ConfigKey;
      const value = config[configKey];
      if (
        typeof value === 'number' &&
        (configKey === 'focusDuration' || configKey === 'breakDuration')
      ) {
        console.log(formatDuration(value));
      } else {
        console.log(String(value));
      }
    });

  command
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      const config = readConfig();

      if (!(key in config)) {
        console.error(`Unknown config key: ${key}`);
        console.error(`Valid keys: ${Object.keys(config).join(', ')}`);
        process.exitCode = 1;
        return;
      }

      const configKey = key as ConfigKey;
      const updated: AppConfig = { ...config };

      if (configKey === 'focusDuration' || configKey === 'breakDuration') {
        const numVal = Number(value);
        if (isNaN(numVal) || numVal <= 0) {
          console.error(`Value for ${key} must be a positive number.`);
          process.exitCode = 1;
          return;
        }
        // Accept minutes input (e.g., "25") and convert to seconds
        updated[configKey] = numVal * 60;
      } else if (configKey === 'notifyEnabled') {
        if (value !== 'true' && value !== 'false') {
          console.error(`Value for ${key} must be "true" or "false".`);
          process.exitCode = 1;
          return;
        }
        updated.notifyEnabled = value === 'true';
      }

      writeConfig(updated);
      console.log(`Set ${key} = ${value}`);
    });

  return command;
}
