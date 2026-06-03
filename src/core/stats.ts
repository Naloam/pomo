import type { Session, Distraction, Stats } from '../types/index.js';

/**
 * Parse an ISO 8601 date string and return just the date portion (YYYY-MM-DD)
 * using the local timezone.
 *
 * @param iso - ISO 8601 date string
 * @returns date string in YYYY-MM-DD format (local time)
 */
function toLocalDate(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the Monday of the current week in local timezone.
 *
 * @param now - reference Date (defaults to current time)
 * @returns Date object set to 00:00:00 on Monday of the current week
 */
function getWeekMonday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  const day = d.getDay();
  // Convert so Monday=0, Sunday=6
  const offset = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - offset);
  return d;
}

/**
 * Count completed focus sessions for today.
 *
 * A session counts if:
 * - type is "focus"
 * - status is "completed"
 * - startedAt falls on the same local calendar date as `now`
 *
 * @param sessions - list of all sessions
 * @param now - reference Date representing "today" (defaults to current time)
 * @returns number of completed focus pomodoros today
 */
export function countTodayPomodoros(sessions: Session[], now: Date = new Date()): number {
  const today = toLocalDate(now.toISOString());
  return sessions.filter(
    (s) => s.type === 'focus' && s.status === 'completed' && toLocalDate(s.startedAt) === today,
  ).length;
}

/**
 * Get the weekly trend as a 7-element array of daily pomodoro counts.
 *
 * Index 0 = Monday, index 6 = Sunday. Counts completed focus sessions
 * whose startedAt falls on the corresponding calendar day of the current week.
 *
 * @param sessions - list of all sessions
 * @param now - reference Date for determining the current week (defaults to current time)
 * @returns array of 7 numbers (Mon-Sun)
 */
export function getWeeklyTrend(sessions: Session[], now: Date = new Date()): number[] {
  const monday = getWeekMonday(now);

  // Build an array of 7 YYYY-MM-DD strings for Mon..Sun
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(toLocalDate(d.toISOString()));
  }

  // Filter completed focus sessions within the week
  const trend = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessions) {
    if (s.type !== 'focus' || s.status !== 'completed') continue;
    const date = toLocalDate(s.startedAt);
    const idx = weekDates.indexOf(date);
    if (idx !== -1) {
      trend[idx]++;
    }
  }

  return trend;
}

/**
 * Get the top N distraction reasons ranked by frequency.
 *
 * @param distractions - list of all distractions
 * @param limit - maximum number of results to return (default 3)
 * @returns array of { reason, count } sorted descending by count, then alphabetically by reason
 */
export function getTopDistractions(
  distractions: Distraction[],
  limit: number = 3,
): Array<{ reason: string; count: number }> {
  const counts = new Map<string, number>();
  for (const d of distractions) {
    counts.set(d.reason, (counts.get(d.reason) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .slice(0, limit);
}

/**
 * Calculate aggregated statistics from sessions and distractions.
 *
 * @param sessions - list of all sessions
 * @param distractions - list of all distractions
 * @param now - reference Date (defaults to current time)
 * @returns Stats object with todayPomodoros, weeklyTrend, and topDistractions
 */
export function calculateStats(
  sessions: Session[],
  distractions: Distraction[],
  now: Date = new Date(),
): Stats {
  return {
    todayPomodoros: countTodayPomodoros(sessions, now),
    weeklyTrend: getWeeklyTrend(sessions, now),
    topDistractions: getTopDistractions(distractions),
  };
}
