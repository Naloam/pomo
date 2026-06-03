import React from 'react';
import { Text, Box } from 'ink';
import type { Stats } from '../../types/index.js';

/** Props for StatsView component */
interface StatsViewProps {
  /** Aggregated statistics */
  stats: Stats;
}

/** Day labels for the weekly trend (Mon-Sun) */
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Render a simple horizontal bar chart for a single day.
 * @param count - number of pomodoros that day
 * @param maxCount - maximum count across the week (for scaling)
 * @returns string of block characters representing the bar
 */
function renderBar(count: number, maxCount: number): string {
  if (maxCount === 0) return '';
  const maxWidth = 10;
  const width = Math.round((count / maxCount) * maxWidth);
  return '█'.repeat(width);
}

/**
 * StatsView component - displays today's pomodoro count, weekly trend, and top distractions.
 * @param props - StatsViewProps
 */
export function StatsView({ stats }: StatsViewProps): React.ReactElement {
  const maxWeekly = Math.max(...stats.weeklyTrend, 1);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="yellow">
      <Box justifyContent="center">
        <Text bold color="yellow">
          Statistics
        </Text>
      </Box>

      {/* Today's pomodoros */}
      <Box marginTop={1}>
        <Text bold>Today: </Text>
        <Text color="green">{stats.todayPomodoros}</Text>
        <Text> pomodoro{stats.todayPomodoros !== 1 ? 's' : ''}</Text>
      </Box>

      {/* Weekly trend */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Weekly Trend:</Text>
        {DAY_LABELS.map((label, i) => (
          <Box key={label}>
            <Text dimColor>{label} </Text>
            <Text color="green">{renderBar(stats.weeklyTrend[i], maxWeekly)}</Text>
            <Text dimColor> {stats.weeklyTrend[i]}</Text>
          </Box>
        ))}
      </Box>

      {/* Top distractions */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Top Distractions:</Text>
        {stats.topDistractions.length === 0 ? (
          <Text dimColor> None recorded</Text>
        ) : (
          stats.topDistractions.map((d, i) => (
            <Text key={d.reason}>
              <Text dimColor> {i + 1}. </Text>
              <Text>{d.reason}</Text>
              <Text dimColor> ({d.count}x)</Text>
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}
