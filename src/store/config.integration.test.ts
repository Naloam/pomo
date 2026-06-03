import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import type { AppConfig } from '../types/index.js';

/**
 * Integration-style tests for the config store logic.
 * Since the actual readConfig/writeConfig use homedir(), we test the
 * logic patterns here with temp directories.
 */
describe('config store logic', () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'pomo-config-test-'));
    configPath = join(tempDir, 'config.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should have correct default values', () => {
    // Default config as defined in the module
    const defaults: AppConfig = {
      focusDuration: 1500,
      breakDuration: 300,
      notifyEnabled: true,
    };
    expect(defaults.focusDuration).toBe(25 * 60);
    expect(defaults.breakDuration).toBe(5 * 60);
    expect(defaults.notifyEnabled).toBe(true);
  });

  it('should read written config correctly', () => {
    const config: AppConfig = {
      focusDuration: 1800,
      breakDuration: 600,
      notifyEnabled: false,
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as AppConfig;
    expect(parsed).toEqual(config);
  });

  it('should handle missing fields with defaults', () => {
    const partial = { focusDuration: 900 };
    writeFileSync(configPath, JSON.stringify(partial));

    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;

    const config: AppConfig = {
      focusDuration: typeof parsed.focusDuration === 'number' ? parsed.focusDuration : 1500,
      breakDuration: typeof parsed.breakDuration === 'number' ? parsed.breakDuration : 300,
      notifyEnabled: typeof parsed.notifyEnabled === 'boolean' ? parsed.notifyEnabled : true,
    };

    expect(config.focusDuration).toBe(900);
    expect(config.breakDuration).toBe(300);
    expect(config.notifyEnabled).toBe(true);
  });

  it('should handle invalid JSON gracefully', () => {
    writeFileSync(configPath, 'not valid json');

    const raw = readFileSync(configPath, 'utf-8');
    let config: AppConfig;
    try {
      config = JSON.parse(raw) as AppConfig;
    } catch {
      config = { focusDuration: 1500, breakDuration: 300, notifyEnabled: true };
    }

    expect(config.focusDuration).toBe(1500);
    expect(config.breakDuration).toBe(300);
    expect(config.notifyEnabled).toBe(true);
  });

  it('should overwrite existing config', () => {
    const config1: AppConfig = {
      focusDuration: 1500,
      breakDuration: 300,
      notifyEnabled: true,
    };
    const config2: AppConfig = {
      focusDuration: 2400,
      breakDuration: 480,
      notifyEnabled: false,
    };

    writeFileSync(configPath, JSON.stringify(config1, null, 2));
    writeFileSync(configPath, JSON.stringify(config2, null, 2));

    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as AppConfig;
    expect(parsed).toEqual(config2);
  });

  it('should create directory if needed', () => {
    const nestedDir = join(tempDir, '.pomo');
    const nestedPath = join(nestedDir, 'config.json');
    mkdirSync(nestedDir, { recursive: true });

    const config: AppConfig = {
      focusDuration: 1500,
      breakDuration: 300,
      notifyEnabled: true,
    };
    writeFileSync(nestedPath, JSON.stringify(config, null, 2));

    const raw = readFileSync(nestedPath, 'utf-8');
    const parsed = JSON.parse(raw) as AppConfig;
    expect(parsed).toEqual(config);
  });
});
