import { describe, it, expect } from 'vitest';
import type { Session, Distraction } from '../types/index.js';
import {
  countTodayPomodoros,
  getWeeklyTrend,
  getTopDistractions,
  calculateStats,
} from './stats.js';

// --- Helpers ---

/** Create a completed focus session started on the given ISO date */
function focusSession(
  id: number,
  startedAt: string,
  status: 'running' | 'completed' | 'interrupted' = 'completed',
): Session {
  return {
    id,
    type: 'focus',
    startedAt,
    endedAt: status === 'completed' ? startedAt : null,
    duration: 1500,
    actualDuration: status === 'completed' ? 1500 : null,
    status,
  };
}

/** Create a completed break session */
function breakSession(id: number, startedAt: string): Session {
  return {
    id,
    type: 'break',
    startedAt,
    endedAt: startedAt,
    duration: 300,
    actualDuration: 300,
    status: 'completed',
  };
}

/** Create a distraction record */
function distraction(
  id: number,
  reason: string,
  sessionId: number,
  createdAt: string = '2026-06-03T10:00:00',
): Distraction {
  return { id, sessionId, reason, createdAt };
}

// --- Tests ---

describe('countTodayPomodoros', () => {
  it('counts completed focus sessions whose startedAt is today', () => {
    const now = new Date('2026-06-03T15:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-06-03T09:00:00'),
      focusSession(2, '2026-06-03T09:30:00'),
      focusSession(3, '2026-06-03T10:00:00'),
    ];
    expect(countTodayPomodoros(sessions, now)).toBe(3);
  });

  it('ignores sessions from other days', () => {
    const now = new Date('2026-06-03T15:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-06-02T09:00:00'), // yesterday
      focusSession(2, '2026-06-03T09:00:00'), // today
    ];
    expect(countTodayPomodoros(sessions, now)).toBe(1);
  });

  it('ignores non-completed focus sessions', () => {
    const now = new Date('2026-06-03T15:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-06-03T09:00:00', 'completed'),
      focusSession(2, '2026-06-03T09:30:00', 'running'),
      focusSession(3, '2026-06-03T10:00:00', 'interrupted'),
    ];
    expect(countTodayPomodoros(sessions, now)).toBe(1);
  });

  it('ignores break sessions even if completed today', () => {
    const now = new Date('2026-06-03T15:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-06-03T09:00:00'),
      breakSession(2, '2026-06-03T09:25:00'),
    ];
    expect(countTodayPomodoros(sessions, now)).toBe(1);
  });

  it('returns 0 for empty sessions', () => {
    expect(countTodayPomodoros([], new Date('2026-06-03T15:00:00'))).toBe(0);
  });
});

describe('getWeeklyTrend', () => {
  it('returns a 7-element array', () => {
    const trend = getWeeklyTrend([], new Date('2026-06-03T12:00:00'));
    expect(trend).toHaveLength(7);
  });

  it('maps Monday-Sunday correctly (2026-06-01 is Monday)', () => {
    // 2026-06-01 Mon, 06-02 Tue, 06-03 Wed
    const now = new Date('2026-06-03T12:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-06-01T09:00:00'), // Mon
      focusSession(2, '2026-06-01T10:00:00'), // Mon
      focusSession(3, '2026-06-02T09:00:00'), // Tue
      focusSession(4, '2026-06-03T09:00:00'), // Wed
      focusSession(5, '2026-06-03T10:00:00'), // Wed
      focusSession(6, '2026-06-03T11:00:00'), // Wed
    ];
    const trend = getWeeklyTrend(sessions, now);
    expect(trend).toEqual([2, 1, 3, 0, 0, 0, 0]);
  });

  it('ignores sessions outside the current week', () => {
    // 2026-06-03 is Wednesday, week starts Mon 06-01
    const now = new Date('2026-06-03T12:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-05-25T09:00:00'), // previous week Monday
      focusSession(2, '2026-05-31T09:00:00'), // previous week Sunday
      focusSession(3, '2026-06-01T09:00:00'), // this Monday
    ];
    const trend = getWeeklyTrend(sessions, now);
    expect(trend[0]).toBe(1); // Monday
    expect(trend.reduce((a: number, b: number) => a + b, 0)).toBe(1);
  });

  it('ignores non-completed and non-focus sessions', () => {
    const now = new Date('2026-06-03T12:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-06-01T09:00:00', 'completed'),
      focusSession(2, '2026-06-01T10:00:00', 'running'),
      focusSession(3, '2026-06-01T11:00:00', 'interrupted'),
      breakSession(4, '2026-06-02T09:00:00'),
    ];
    const trend = getWeeklyTrend(sessions, now);
    expect(trend).toEqual([1, 0, 0, 0, 0, 0, 0]);
  });

  it('returns all zeros for empty sessions', () => {
    const trend = getWeeklyTrend([], new Date('2026-06-03T12:00:00'));
    expect(trend).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('handles Sunday correctly as last element (index 6)', () => {
    // 2026-06-07 is Sunday
    const now = new Date('2026-06-07T12:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-06-07T09:00:00'), // Sunday
    ];
    const trend = getWeeklyTrend(sessions, now);
    expect(trend).toEqual([0, 0, 0, 0, 0, 0, 1]);
  });

  it('works when now is a Sunday and week starts on previous Monday', () => {
    // 2026-06-07 Sunday, week Mon=06-01
    const now = new Date('2026-06-07T23:59:59');
    const sessions: Session[] = [
      focusSession(1, '2026-06-01T09:00:00'), // Mon
      focusSession(2, '2026-06-07T09:00:00'), // Sun
    ];
    const trend = getWeeklyTrend(sessions, now);
    expect(trend).toEqual([1, 0, 0, 0, 0, 0, 1]);
  });
});

describe('getTopDistractions', () => {
  it('returns top N distractions sorted by count descending', () => {
    const dists: Distraction[] = [
      distraction(1, 'phone', 1),
      distraction(2, 'phone', 1),
      distraction(3, 'phone', 1),
      distraction(4, 'email', 1),
      distraction(5, 'email', 1),
      distraction(6, 'noise', 1),
    ];
    const top = getTopDistractions(dists, 3);
    expect(top).toEqual([
      { reason: 'phone', count: 3 },
      { reason: 'email', count: 2 },
      { reason: 'noise', count: 1 },
    ]);
  });

  it('defaults limit to 3', () => {
    const dists: Distraction[] = [
      distraction(1, 'a', 1),
      distraction(2, 'b', 1),
      distraction(3, 'c', 1),
      distraction(4, 'd', 1),
    ];
    const top = getTopDistractions(dists);
    expect(top).toHaveLength(3);
  });

  it('respects custom limit', () => {
    const dists: Distraction[] = [
      distraction(1, 'a', 1),
      distraction(2, 'b', 1),
      distraction(3, 'c', 1),
    ];
    expect(getTopDistractions(dists, 2)).toHaveLength(2);
    expect(getTopDistractions(dists, 10)).toHaveLength(3);
  });

  it('sorts alphabetically when counts are equal', () => {
    const dists: Distraction[] = [
      distraction(1, 'zebra', 1),
      distraction(2, 'apple', 1),
      distraction(3, 'mango', 1),
    ];
    const top = getTopDistractions(dists, 3);
    expect(top).toEqual([
      { reason: 'apple', count: 1 },
      { reason: 'mango', count: 1 },
      { reason: 'zebra', count: 1 },
    ]);
  });

  it('returns empty array for empty distractions', () => {
    expect(getTopDistractions([])).toEqual([]);
    expect(getTopDistractions([], 5)).toEqual([]);
  });

  it('handles case with fewer unique reasons than limit', () => {
    const dists: Distraction[] = [distraction(1, 'phone', 1), distraction(2, 'phone', 2)];
    const top = getTopDistractions(dists, 5);
    expect(top).toEqual([{ reason: 'phone', count: 2 }]);
  });
});

describe('calculateStats', () => {
  it('returns a complete Stats object', () => {
    const now = new Date('2026-06-03T15:00:00');
    const sessions: Session[] = [
      focusSession(1, '2026-06-03T09:00:00'),
      focusSession(2, '2026-06-03T10:00:00'),
      focusSession(3, '2026-06-01T09:00:00'),
    ];
    const dists: Distraction[] = [
      distraction(1, 'phone', 1),
      distraction(2, 'phone', 1),
      distraction(3, 'slack', 2),
    ];

    const stats = calculateStats(sessions, dists, now);

    expect(stats.todayPomodoros).toBe(2);
    expect(stats.weeklyTrend).toHaveLength(7);
    expect(stats.weeklyTrend).toEqual([1, 0, 2, 0, 0, 0, 0]);
    expect(stats.topDistractions).toEqual([
      { reason: 'phone', count: 2 },
      { reason: 'slack', count: 1 },
    ]);
  });

  it('returns zeros and empty topDistractions for empty inputs', () => {
    const now = new Date('2026-06-03T15:00:00');
    const stats = calculateStats([], [], now);

    expect(stats.todayPomodoros).toBe(0);
    expect(stats.weeklyTrend).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(stats.topDistractions).toEqual([]);
  });
});
