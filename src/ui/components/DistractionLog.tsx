import React from 'react';
import { Text, Box } from 'ink';
import type { Distraction } from '../../types/index.js';

/** Props for DistractionLog component */
interface DistractionLogProps {
  /** List of distractions for the current session */
  distractions: Distraction[];
}

/**
 * Format an ISO timestamp to a short HH:MM display.
 * @param iso - ISO 8601 date string
 * @returns time string in HH:MM format
 */
function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * DistractionLog component - displays a list of distractions for the current session.
 * @param props - DistractionLogProps
 */
export function DistractionLog({ distractions }: DistractionLogProps): React.ReactElement {
  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="red">
      <Box justifyContent="center">
        <Text bold color="red">
          Distraction Log
        </Text>
        <Text dimColor> ({distractions.length})</Text>
      </Box>

      {distractions.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor> No distractions recorded. Stay focused!</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {distractions.map((d) => (
            <Box key={d.id}>
              <Text dimColor>{formatTimeShort(d.createdAt)} </Text>
              <Text color="redBright">{d.reason}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
