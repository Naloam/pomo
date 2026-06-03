import React, { useState, useEffect, useRef } from 'react';
import { Text, Box, useApp, useInput } from 'ink';
import type { TimerState, Stats, Distraction } from '../types/index.js';
import { tick, pauseTimer, resumeTimer, stopTimer } from '../core/timer.js';
import { endSession } from '../store/sessions.js';
import { readConfig } from '../store/config.js';
import { notifyFocusComplete, notifyBreakComplete } from '../notify.js';
import { TimerDisplay } from './components/TimerDisplay.js';
import { StatsView } from './components/StatsView.js';
import { DistractionLog } from './components/DistractionLog.js';

/** Props for App component */
interface AppProps {
  /** Display mode */
  mode: 'timer' | 'stats';
  /** Timer state (required in timer mode) */
  timerState?: TimerState;
  /** Aggregated statistics (required in stats mode) */
  stats?: Stats;
  /** Distractions for the current session (optional, shown in timer mode) */
  distractions?: Distraction[];
}

/**
 * Main application component.
 * Renders either the timer view or the stats view based on the mode prop.
 * In timer mode, runs a countdown via useEffect + setInterval and calls
 * endSession + terminal bell when the timer reaches zero.
 * @param props - AppProps
 */
export function App({
  mode,
  timerState: initialTimerState,
  stats,
  distractions,
}: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [currentState, setCurrentState] = useState<TimerState | undefined>(initialTimerState);
  const sessionEndedRef = useRef(false);

  // Keyboard shortcuts: p = pause, r = resume, q = stop & exit
  useInput((input) => {
    if (mode !== 'timer') {
      return;
    }

    if (input === 'p') {
      setCurrentState((prev) => (prev ? pauseTimer(prev) : prev));
    } else if (input === 'r') {
      setCurrentState((prev) => (prev ? resumeTimer(prev) : prev));
    } else if (input === 'q') {
      setCurrentState((prev) => {
        if (prev && prev.sessionId !== null && prev.isRunning) {
          endSession(prev.sessionId, 'interrupted');
        }
        return prev ? stopTimer(prev) : prev;
      });
      exit();
    }
  });

  // Countdown interval: tick every second while the timer is running
  useEffect(() => {
    if (mode !== 'timer' || !currentState?.isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentState((prev) => {
        if (!prev || !prev.isRunning) {
          return prev;
        }
        return tick(prev);
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [mode, currentState?.isRunning]);

  // Completion detection: when remaining hits 0, play bell and end the session
  useEffect(() => {
    if (mode !== 'timer' || !currentState) {
      return;
    }

    if (
      currentState.remaining === 0 &&
      !sessionEndedRef.current &&
      currentState.sessionId !== null
    ) {
      sessionEndedRef.current = true;
      process.stdout.write('\x07');
      endSession(currentState.sessionId, 'completed');

      // Send system notification if enabled in config
      const config = readConfig();
      if (config.notifyEnabled) {
        if (currentState.type === 'focus') {
          notifyFocusComplete();
        } else {
          notifyBreakComplete();
        }
      }

      // Allow one render frame for the UI to update before exiting
      setTimeout(() => {
        exit();
      }, 100);
    }
  }, [mode, currentState?.remaining, currentState?.sessionId, exit]);

  if (mode === 'timer') {
    if (!currentState) {
      return (
        <Box padding={1}>
          <Text color="red">Error: timerState is required in timer mode.</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color="white">
            {'  '}POMO{'  '}
          </Text>
        </Box>
        <TimerDisplay state={currentState} />
        {distractions && distractions.length > 0 && <DistractionLog distractions={distractions} />}
        <Box marginTop={1}>
          <Text dimColor>{'  '}p pause | r resume | q quit</Text>
        </Box>
      </Box>
    );
  }

  // stats mode
  if (!stats) {
    return (
      <Box padding={1}>
        <Text color="red">Error: stats is required in stats mode.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="white">
          {'  '}POMO{'  '}
        </Text>
      </Box>
      <StatsView stats={stats} />
    </Box>
  );
}
