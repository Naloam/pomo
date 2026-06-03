import React, { useEffect } from 'react';
import { Text, Box, useApp } from 'ink';
import type { Session } from '../types/index.js';

/** 星期名称缩写 */
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** 进度条宽度（字符数） */
const BAR_WIDTH = 10;

/** 已完成块字符 */
const FILLED_BLOCK = '█';

/** 未完成块字符 */
const EMPTY_BLOCK = '░';

interface DailyCount {
  /** 日期标签（如 Mon, Tue） */
  label: string;
  /** 日期字符串（YYYY-MM-DD） */
  date: string;
  /** 完成的番茄数 */
  count: number;
}

/**
 * 将日期对象格式化为 YYYY-MM-DD 字符串（本地时区）
 * @param d - Date 对象
 * @returns 日期字符串
 */
function toLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取星期缩写标签
 * @param d - Date 对象
 * @returns 三天字母缩写（Mon, Tue, ...）
 */
function getDayLabel(d: Date): string {
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  const dayIndex = d.getDay();
  // Convert to Mon=0, Sun=6
  const adjusted = dayIndex === 0 ? 6 : dayIndex - 1;
  return DAY_NAMES[adjusted];
}

/**
 * 生成每日番茄计数数据
 * @param sessions - 所有会话列表
 * @param days - 显示天数
 * @returns 每日计数数组（从最早到最近）
 */
export function getDailyCounts(sessions: Session[], days: number): DailyCount[] {
  const now = new Date();
  const counts = new Map<string, number>();

  // Count completed focus sessions per day
  for (const s of sessions) {
    if (s.type !== 'focus' || s.status !== 'completed') continue;
    const date = toLocalDate(new Date(s.startedAt));
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  // Build the date range
  const result: DailyCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = toLocalDate(d);
    result.push({
      label: getDayLabel(d),
      date: dateStr,
      count: counts.get(dateStr) ?? 0,
    });
  }

  return result;
}

/**
 * 生成 ASCII 进度条字符串
 * @param count - 当前计数
 * @param max - 最大计数（用于缩放）
 * @returns 进度条字符串
 */
export function renderBar(count: number, max: number): string {
  if (max === 0) {
    return EMPTY_BLOCK.repeat(BAR_WIDTH);
  }
  const filled = Math.round((count / max) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  return FILLED_BLOCK.repeat(filled) + EMPTY_BLOCK.repeat(empty);
}

interface HistoryViewProps {
  /** 所有会话数据 */
  sessions: Session[];
  /** 显示天数 */
  days: number;
}

/**
 * 历史视图 Ink 组件
 * 用 ASCII 进度条展示每日完成的番茄数
 */
export function HistoryView({ sessions, days }: HistoryViewProps): React.JSX.Element {
  const { exit } = useApp();
  const dailyCounts = getDailyCounts(sessions, days);
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1);

  useEffect(() => {
    // Exit after the component has rendered its output
    exit();
  }, [exit]);

  return (
    <Box flexDirection="column">
      {dailyCounts.map((day) => (
        <Box key={day.date}>
          <Text>
            {day.label} {renderBar(day.count, maxCount)} {day.count}{' '}
            {day.count === 1 ? 'pomodoro' : 'pomodoros'}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
