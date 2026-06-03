/**
 * 番茄钟会话类型
 */
export type SessionType = 'focus' | 'break';

/**
 * 会话状态
 */
export type SessionStatus = 'running' | 'completed' | 'interrupted';

/**
 * 番茄钟会话记录
 */
export interface Session {
  /** 会话ID */
  id: number;
  /** 会话类型：专注或休息 */
  type: SessionType;
  /** 开始时间（ISO 8601） */
  startedAt: string;
  /** 结束时间（ISO 8601），null 表示正在进行 */
  endedAt: string | null;
  /** 计划时长（秒） */
  duration: number;
  /** 实际时长（秒），null 表示正在进行 */
  actualDuration: number | null;
  /** 会话状态 */
  status: SessionStatus;
}

/**
 * 分心记录
 */
export interface Distraction {
  /** 分心ID */
  id: number;
  /** 关联的专注会话ID */
  sessionId: number;
  /** 分心原因 */
  reason: string;
  /** 记录时间（ISO 8601） */
  createdAt: string;
}

/**
 * 计时器状态
 */
export interface TimerState {
  /** 是否正在运行 */
  isRunning: boolean;
  /** 是否已暂停 */
  isPaused: boolean;
  /** 剩余时间（秒） */
  remaining: number;
  /** 总时长（秒） */
  total: number;
  /** 当前会话类型 */
  type: SessionType;
  /** 当前会话ID，null 表示未开始 */
  sessionId: number | null;
}

/**
 * 统计数据
 */
export interface Stats {
  /** 今日完成的番茄数 */
  todayPomodoros: number;
  /** 本周每日番茄数（周一到周日） */
  weeklyTrend: number[];
  /** Top 3 分心原因 */
  topDistractions: Array<{
    reason: string;
    count: number;
  }>;
}

/**
 * 数据库配置
 */
export interface DbConfig {
  /** 数据库文件路径 */
  path: string;
}

/**
 * 计时器配置
 */
export interface TimerConfig {
  /** 专注时长（秒），默认 25 分钟 */
  focusDuration: number;
  /** 休息时长（秒），默认 5 分钟 */
  breakDuration: number;
}

/**
 * 创建会话的参数
 */
export interface CreateSessionParams {
  /** 会话类型 */
  type: SessionType;
  /** 计划时长（秒） */
  duration: number;
}

/**
 * 创建分心记录的参数
 */
export interface CreateDistractionParams {
  /** 关联的会话ID */
  sessionId: number;
  /** 分心原因 */
  reason: string;
}

/**
 * 应用配置
 */
export interface AppConfig {
  /** 专注时长（秒），默认 1500（25 分钟） */
  focusDuration: number;
  /** 休息时长（秒），默认 300（5 分钟） */
  breakDuration: number;
  /** 是否启用系统通知，默认 true */
  notifyEnabled: boolean;
}

/**
 * 可配置的配置项键名
 */
export type ConfigKey = keyof AppConfig;
