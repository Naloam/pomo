import type { Session } from '../types/index.js';

/**
 * 将会话数据格式化为 JSON 字符串
 * @param data - 会话数组
 * @returns 格式化的 JSON 字符串（带缩进）
 */
export function formatJson(data: Session[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * 将会话数据格式化为 CSV 字符串
 * @param data - 会话数组
 * @returns 格式化的 CSV 字符串（含表头）
 */
export function formatCsv(data: Session[]): string {
  const headers = ['id', 'type', 'startedAt', 'endedAt', 'duration', 'actualDuration', 'status'];

  const rows = data.map((session) =>
    [
      session.id,
      session.type,
      session.startedAt,
      session.endedAt ?? '',
      session.duration,
      session.actualDuration ?? '',
      session.status,
    ].join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}
