import { describe, it, expect } from 'vitest';
import type { Session } from '../types/index.js';
import { getDailyCounts, renderBar } from './HistoryView.js';

describe('getDailyCounts', () => {
  it('should return entries for the specified number of days', () => {
    const result = getDailyCounts([], 7);
    expect(result).toHaveLength(7);
  });

  it('should return 30 entries for month view', () => {
    const result = getDailyCounts([], 30);
    expect(result).toHaveLength(30);
  });

  it('should count completed focus sessions per day', () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const sessions: Session[] = [
      {
        id: 1,
        type: 'focus',
        startedAt: now.toISOString(),
        endedAt: now.toISOString(),
        duration: 1500,
        actualDuration: 1500,
        status: 'completed',
      },
      {
        id: 2,
        type: 'focus',
        startedAt: now.toISOString(),
        endedAt: now.toISOString(),
        duration: 1500,
        actualDuration: 1500,
        status: 'completed',
      },
      {
        id: 3,
        type: 'break',
        startedAt: now.toISOString(),
        endedAt: now.toISOString(),
        duration: 300,
        actualDuration: 300,
        status: 'completed',
      },
    ];

    const result = getDailyCounts(sessions, 1);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2); // 2 focus sessions, 1 break ignored
  });

  it('should not count interrupted sessions', () => {
    const now = new Date();

    const sessions: Session[] = [
      {
        id: 1,
        type: 'focus',
        startedAt: now.toISOString(),
        endedAt: now.toISOString(),
        duration: 1500,
        actualDuration: 600,
        status: 'interrupted',
      },
    ];

    const result = getDailyCounts(sessions, 1);
    expect(result[0].count).toBe(0);
  });

  it('should not count running sessions', () => {
    const now = new Date();

    const sessions: Session[] = [
      {
        id: 1,
        type: 'focus',
        startedAt: now.toISOString(),
        endedAt: null,
        duration: 1500,
        actualDuration: null,
        status: 'running',
      },
    ];

    const result = getDailyCounts(sessions, 1);
    expect(result[0].count).toBe(0);
  });

  it('should return 0 count for days with no sessions', () => {
    const result = getDailyCounts([], 7);
    for (const day of result) {
      expect(day.count).toBe(0);
    }
  });

  it('should include day labels', () => {
    const result = getDailyCounts([], 7);
    const validLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (const day of result) {
      expect(validLabels).toContain(day.label);
    }
  });

  it('should include date strings in YYYY-MM-DD format', () => {
    const result = getDailyCounts([], 7);
    for (const day of result) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('renderBar', () => {
  it('should render empty bar when count is 0', () => {
    const bar = renderBar(0, 10);
    expect(bar).toBe('░'.repeat(10));
    expect(bar).toHaveLength(10);
  });

  it('should render full bar when count equals max', () => {
    const bar = renderBar(10, 10);
    expect(bar).toBe('█'.repeat(10));
    expect(bar).toHaveLength(10);
  });

  it('should render half bar', () => {
    const bar = renderBar(5, 10);
    expect(bar).toBe('█████░░░░░');
    expect(bar).toHaveLength(10);
  });

  it('should handle max of 0 (no data)', () => {
    const bar = renderBar(0, 0);
    expect(bar).toBe('░'.repeat(10));
    expect(bar).toHaveLength(10);
  });

  it('should scale proportionally', () => {
    const bar = renderBar(1, 4);
    // 1/4 * 10 = 2.5, rounds to 3
    expect(bar).toHaveLength(10);
    const filledCount = (bar.match(/█/g) ?? []).length;
    expect(filledCount).toBe(3);
  });
});
