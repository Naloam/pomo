# Fix: TUI countdown + session auto-end

## Date: 2026-06-03

## Changes

- **src/ui/App.tsx**: Added `useState` for mutable timer state, `useEffect` + `setInterval` (1s) for countdown via `tick()`, `useEffect` to detect `remaining === 0` and trigger terminal bell (`\x07`), `endSession(sessionId, "completed")`, and `exit()`.
- **src/cli.ts**: Wired `session.id` into `timerState.sessionId` for both `start` and `break` commands so App can call `endSession` on completion.

## Verification

- `tsc --noEmit` passes with zero errors
- All 125 existing tests pass
