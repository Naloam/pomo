import React from 'react';
import { Text, Box } from 'ink';
import type { TimerState } from '../../types/index.js';
import { formatTime, getProgress } from '../../core/timer.js';

/** Props for TimerDisplay component */
interface TimerDisplayProps {
  /** Current timer state */
  state: TimerState;
}

/**
 * Render a progress bar using Unicode block characters.
 * @param progress - progress value 0-1
 * @param width - total bar width in characters
 * @returns string of block characters representing the progress
 */
function renderProgressBar(progress: number, width: number = 20): string {
  const filled = Math.round(progress * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * TimerDisplay component - shows remaining time, progress bar, and session type.
 * @param props - TimerDisplayProps
 */
export function TimerDisplay({ state }: TimerDisplayProps): React.ReactElement {
  const timeStr = formatTime(state.remaining);
  const progress = getProgress(state);
  const bar = renderProgressBar(progress);
  const percent = Math.round(progress * 100);

  const typeLabel = state.type === 'focus' ? 'Focus' : 'Break';
  const statusLabel = state.isPaused ? 'Paused' : state.isRunning ? 'Running' : 'Stopped';

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Box justifyContent="center">
        <Text bold color="cyan">
          {typeLabel} Session
        </Text>
        <Text dimColor> ({statusLabel})</Text>
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text bold color="white">
          {timeStr}
        </Text>
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text>
          <Text color="green">{bar}</Text>
          <Text dimColor> {percent}%</Text>
        </Text>
      </Box>
    </Box>
  );
}
