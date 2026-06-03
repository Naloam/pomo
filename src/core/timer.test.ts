import { describe, it, expect } from 'vitest';
import type { TimerState } from '../types/index.js';
import {
  createTimerState,
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
  tick,
  getProgress,
  formatTime,
} from './timer.js';

describe('createTimerState', () => {
  it('should create a stopped timer with given type and duration', () => {
    const state = createTimerState('focus', 1500);
    expect(state).toEqual({
      isRunning: false,
      isPaused: false,
      remaining: 1500,
      total: 1500,
      type: 'focus',
      sessionId: null,
    });
  });

  it('should work with break type', () => {
    const state = createTimerState('break', 300);
    expect(state.type).toBe('break');
    expect(state.remaining).toBe(300);
    expect(state.total).toBe(300);
    expect(state.isPaused).toBe(false);
  });
});

describe('startTimer', () => {
  it('should return a running timer state', () => {
    const state = startTimer('focus', 1500);
    expect(state).toEqual({
      isRunning: true,
      isPaused: false,
      remaining: 1500,
      total: 1500,
      type: 'focus',
      sessionId: null,
    });
  });

  it('should work with break type', () => {
    const state = startTimer('break', 300);
    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.type).toBe('break');
    expect(state.remaining).toBe(300);
  });
});

describe('stopTimer', () => {
  it('should set isRunning to false while preserving other fields', () => {
    const running: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 900,
      total: 1500,
      type: 'focus',
      sessionId: 42,
    };
    const stopped = stopTimer(running);
    expect(stopped).toEqual({
      isRunning: false,
      isPaused: false,
      remaining: 900,
      total: 1500,
      type: 'focus',
      sessionId: 42,
    });
  });

  it('should be idempotent on an already stopped timer', () => {
    const stopped: TimerState = {
      isRunning: false,
      isPaused: false,
      remaining: 600,
      total: 1500,
      type: 'break',
      sessionId: null,
    };
    expect(stopTimer(stopped)).toEqual(stopped);
  });
});

describe('pauseTimer', () => {
  it('should pause a running timer', () => {
    const running: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 900,
      total: 1500,
      type: 'focus',
      sessionId: 42,
    };
    const paused = pauseTimer(running);
    expect(paused).toEqual({
      isRunning: false,
      isPaused: true,
      remaining: 900,
      total: 1500,
      type: 'focus',
      sessionId: 42,
    });
  });

  it('should not change state if timer is not running', () => {
    const stopped: TimerState = {
      isRunning: false,
      isPaused: false,
      remaining: 600,
      total: 1500,
      type: 'focus',
      sessionId: null,
    };
    expect(pauseTimer(stopped)).toEqual(stopped);
  });

  it('should not change state if already paused', () => {
    const paused: TimerState = {
      isRunning: false,
      isPaused: true,
      remaining: 600,
      total: 1500,
      type: 'focus',
      sessionId: 5,
    };
    expect(pauseTimer(paused)).toEqual(paused);
  });

  it('should preserve remaining time', () => {
    const running: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 42,
      total: 1500,
      type: 'break',
      sessionId: 1,
    };
    const paused = pauseTimer(running);
    expect(paused.remaining).toBe(42);
    expect(paused.total).toBe(1500);
  });
});

describe('resumeTimer', () => {
  it('should resume a paused timer', () => {
    const paused: TimerState = {
      isRunning: false,
      isPaused: true,
      remaining: 600,
      total: 1500,
      type: 'focus',
      sessionId: 42,
    };
    const resumed = resumeTimer(paused);
    expect(resumed).toEqual({
      isRunning: true,
      isPaused: false,
      remaining: 600,
      total: 1500,
      type: 'focus',
      sessionId: 42,
    });
  });

  it('should not change state if timer is running', () => {
    const running: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 900,
      total: 1500,
      type: 'focus',
      sessionId: 1,
    };
    expect(resumeTimer(running)).toEqual(running);
  });

  it('should not change state if timer is stopped (not paused)', () => {
    const stopped: TimerState = {
      isRunning: false,
      isPaused: false,
      remaining: 600,
      total: 1500,
      type: 'focus',
      sessionId: null,
    };
    expect(resumeTimer(stopped)).toEqual(stopped);
  });

  it('should preserve remaining time', () => {
    const paused: TimerState = {
      isRunning: false,
      isPaused: true,
      remaining: 123,
      total: 1500,
      type: 'break',
      sessionId: 3,
    };
    const resumed = resumeTimer(paused);
    expect(resumed.remaining).toBe(123);
    expect(resumed.total).toBe(1500);
  });
});

describe('tick', () => {
  it('should decrement remaining by 1', () => {
    const state = startTimer('focus', 1500);
    const next = tick(state);
    expect(next.remaining).toBe(1499);
    expect(next.isRunning).toBe(true);
  });

  it('should not change state if timer is not running', () => {
    const state = createTimerState('focus', 1500);
    const next = tick(state);
    expect(next).toEqual(state);
  });

  it('should not change state if timer is paused', () => {
    const paused: TimerState = {
      isRunning: false,
      isPaused: true,
      remaining: 900,
      total: 1500,
      type: 'focus',
      sessionId: 1,
    };
    const next = tick(paused);
    expect(next).toEqual(paused);
    expect(next.remaining).toBe(900);
  });

  it('should stop the timer when remaining reaches 0', () => {
    const state: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 1,
      total: 1,
      type: 'focus',
      sessionId: 1,
    };
    const next = tick(state);
    expect(next.remaining).toBe(0);
    expect(next.isRunning).toBe(false);
  });

  it('should not go below 0 remaining', () => {
    const state: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 0,
      total: 1500,
      type: 'focus',
      sessionId: 1,
    };
    const next = tick(state);
    expect(next.remaining).toBe(0);
    expect(next.isRunning).toBe(false);
  });

  it('should preserve all other fields', () => {
    const state: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 100,
      total: 1500,
      type: 'break',
      sessionId: 7,
    };
    const next = tick(state);
    expect(next.total).toBe(1500);
    expect(next.type).toBe('break');
    expect(next.sessionId).toBe(7);
    expect(next.isPaused).toBe(false);
  });
});

describe('getProgress', () => {
  it('should return 0 for a fresh timer', () => {
    const state = startTimer('focus', 1500);
    expect(getProgress(state)).toBe(0);
  });

  it('should return 1 when remaining is 0', () => {
    const state: TimerState = {
      isRunning: false,
      isPaused: false,
      remaining: 0,
      total: 1500,
      type: 'focus',
      sessionId: 1,
    };
    expect(getProgress(state)).toBe(1);
  });

  it('should return 0.5 at halfway point', () => {
    const state: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 750,
      total: 1500,
      type: 'focus',
      sessionId: 1,
    };
    expect(getProgress(state)).toBe(0.5);
  });

  it('should return 0 when total is 0 (edge case)', () => {
    const state: TimerState = {
      isRunning: false,
      isPaused: false,
      remaining: 0,
      total: 0,
      type: 'focus',
      sessionId: null,
    };
    expect(getProgress(state)).toBe(0);
  });

  it('should return values between 0 and 1', () => {
    const state: TimerState = {
      isRunning: true,
      isPaused: false,
      remaining: 375,
      total: 1500,
      type: 'break',
      sessionId: 2,
    };
    expect(getProgress(state)).toBeCloseTo(0.75);
  });
});

describe('formatTime', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format seconds-only values', () => {
    expect(formatTime(45)).toBe('00:45');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(1500)).toBe('25:00');
  });

  it('should format 1 minute as 01:00', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('should format mixed minutes and seconds', () => {
    expect(formatTime(90)).toBe('01:30');
  });

  it('should handle large values', () => {
    expect(formatTime(3661)).toBe('61:01');
  });

  it('should handle 1 second', () => {
    expect(formatTime(1)).toBe('00:01');
  });
});
