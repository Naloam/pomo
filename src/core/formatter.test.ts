import { describe, it, expect } from 'vitest';
import type { Session } from '../types/index.js';
import { formatJson, formatCsv } from './formatter.js';

const mockSessions: Session[] = [
  {
    id: 1,
    type: 'focus',
    startedAt: '2026-06-03T09:00:00.000Z',
    endedAt: '2026-06-03T09:25:00.000Z',
    duration: 1500,
    actualDuration: 1500,
    status: 'completed',
  },
  {
    id: 2,
    type: 'break',
    startedAt: '2026-06-03T09:25:00.000Z',
    endedAt: '2026-06-03T09:30:00.000Z',
    duration: 300,
    actualDuration: 300,
    status: 'completed',
  },
  {
    id: 3,
    type: 'focus',
    startedAt: '2026-06-03T10:00:00.000Z',
    endedAt: null,
    duration: 1500,
    actualDuration: null,
    status: 'running',
  },
];

describe('formatJson', () => {
  it('should return valid JSON string', () => {
    const result = formatJson(mockSessions);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should preserve all session data', () => {
    const result = formatJson(mockSessions);
    const parsed = JSON.parse(result) as Session[];
    expect(parsed).toEqual(mockSessions);
  });

  it('should format with 2-space indentation', () => {
    const result = formatJson(mockSessions);
    expect(result).toContain('  ');
    expect(result.startsWith('[')).toBe(true);
  });

  it('should handle empty array', () => {
    const result = formatJson([]);
    expect(result).toBe('[]');
  });

  it('should handle single session', () => {
    const result = formatJson([mockSessions[0]]);
    const parsed = JSON.parse(result) as Session[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual(mockSessions[0]);
  });
});

describe('formatCsv', () => {
  it('should include header row', () => {
    const result = formatCsv(mockSessions);
    const lines = result.split('\n');
    expect(lines[0]).toBe('id,type,startedAt,endedAt,duration,actualDuration,status');
  });

  it('should have correct number of rows', () => {
    const result = formatCsv(mockSessions);
    const lines = result.split('\n');
    expect(lines).toHaveLength(4); // header + 3 data rows
  });

  it('should format session data correctly', () => {
    const result = formatCsv(mockSessions);
    const lines = result.split('\n');
    expect(lines[1]).toBe(
      '1,focus,2026-06-03T09:00:00.000Z,2026-06-03T09:25:00.000Z,1500,1500,completed',
    );
  });

  it('should use empty string for null values', () => {
    const result = formatCsv(mockSessions);
    const lines = result.split('\n');
    // Third session has null endedAt and null actualDuration
    expect(lines[3]).toBe('3,focus,2026-06-03T10:00:00.000Z,,1500,,running');
  });

  it('should handle empty array', () => {
    const result = formatCsv([]);
    expect(result).toBe('id,type,startedAt,endedAt,duration,actualDuration,status');
  });

  it('should handle single session', () => {
    const result = formatCsv([mockSessions[0]]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
  });
});
