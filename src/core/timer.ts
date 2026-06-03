import type { SessionType, TimerState } from '../types/index.js';

/**
 * 创建新的计时器状态（未运行，等待 start）
 * @param type - 会话类型（focus 或 break）
 * @param duration - 总时长（秒）
 * @returns 初始 TimerState
 */
export function createTimerState(type: SessionType, duration: number): TimerState {
  return {
    isRunning: false,
    isPaused: false,
    remaining: duration,
    total: duration,
    type,
    sessionId: null,
  };
}

/**
 * 启动计时器，返回运行中的 TimerState
 * @param type - 会话类型
 * @param duration - 总时长（秒）
 * @returns 运行中的 TimerState（sessionId 为 null，由 store 层赋值）
 */
export function startTimer(type: SessionType, duration: number): TimerState {
  return {
    isRunning: true,
    isPaused: false,
    remaining: duration,
    total: duration,
    type,
    sessionId: null,
  };
}

/**
 * 停止计时器，返回已停止的 TimerState
 * @param state - 当前计时器状态
 * @returns 已停止的 TimerState，remaining 保持当前值
 */
export function stopTimer(state: TimerState): TimerState {
  return {
    ...state,
    isRunning: false,
    isPaused: false,
  };
}

/**
 * 暂停计时器，返回已暂停的 TimerState
 * 只有正在运行的计时器才能暂停
 * @param state - 当前计时器状态
 * @returns 已暂停的 TimerState，remaining 保持当前值
 */
export function pauseTimer(state: TimerState): TimerState {
  if (!state.isRunning) {
    return state;
  }
  return {
    ...state,
    isRunning: false,
    isPaused: true,
  };
}

/**
 * 恢复已暂停的计时器，返回运行中的 TimerState
 * 只有已暂停的计时器才能恢复
 * @param state - 当前计时器状态
 * @returns 恢复运行的 TimerState，remaining 保持当前值
 */
export function resumeTimer(state: TimerState): TimerState {
  if (!state.isPaused) {
    return state;
  }
  return {
    ...state,
    isRunning: true,
    isPaused: false,
  };
}

/**
 * 每秒更新计时器状态（tick）
 * 当 remaining 降到 0 时自动停止
 * @param state - 当前计时器状态
 * @returns 更新后的 TimerState
 */
export function tick(state: TimerState): TimerState {
  if (!state.isRunning) {
    return state;
  }

  const nextRemaining = Math.max(0, state.remaining - 1);

  return {
    ...state,
    remaining: nextRemaining,
    isRunning: nextRemaining > 0,
  };
}

/**
 * 获取计时器进度百分比
 * @param state - 当前计时器状态
 * @returns 进度 0-1（0 = 未开始，1 = 已完成）
 */
export function getProgress(state: TimerState): number {
  if (state.total === 0) {
    return 0;
  }
  return (state.total - state.remaining) / state.total;
}

/**
 * 格式化秒数为 MM:SS 字符串
 * @param seconds - 秒数（非负整数）
 * @returns 格式化的时间字符串，如 "25:00"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
