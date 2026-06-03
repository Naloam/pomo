import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { AppConfig } from '../types/index.js';

/** 默认配置 */
const DEFAULT_CONFIG: AppConfig = {
  focusDuration: 1500,
  breakDuration: 300,
  notifyEnabled: true,
};

/**
 * 获取配置文件路径
 * @returns 配置文件的绝对路径
 */
export function getConfigPath(): string {
  return join(homedir(), '.pomo', 'config.json');
}

/**
 * 读取配置文件，若不存在则返回默认配置
 * @returns AppConfig 对象
 */
export function readConfig(): AppConfig {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      focusDuration:
        typeof parsed.focusDuration === 'number'
          ? parsed.focusDuration
          : DEFAULT_CONFIG.focusDuration,
      breakDuration:
        typeof parsed.breakDuration === 'number'
          ? parsed.breakDuration
          : DEFAULT_CONFIG.breakDuration,
      notifyEnabled:
        typeof parsed.notifyEnabled === 'boolean'
          ? parsed.notifyEnabled
          : DEFAULT_CONFIG.notifyEnabled,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 写入配置文件
 * @param config - 要写入的配置对象
 */
export function writeConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  const dir = join(homedir(), '.pomo');
  mkdirSync(dir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
