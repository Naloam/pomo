# pomo

Terminal Pomodoro + Distraction Tracker. Focus in 25-minute sprints, log distractions, review your stats.

<!-- screenshot here -->

## Install

```bash
npm install -g .
```

This registers the `pomo` command globally via the `bin` field in `package.json`.

## Commands

### pomo start

Start a 25-minute focus timer with a live TUI display.

```bash
pomo start
```

### pomo break

Start a 5-minute break timer.

```bash
pomo break
```

### pomo distract "reason"

Record a distraction during the current focus session.

```bash
pomo distract "checked phone"
pomo distract "replied to message"
```

### pomo stats

View today's pomodoro count, weekly trend, and top distraction reasons.

```bash
pomo stats
```

### pomo history [--week|--month]

Show completed pomodoros as ASCII progress bars. Defaults to last 7 days.

```bash
pomo history           # last 7 days
pomo history --week    # last 7 days
pomo history --month   # last 30 days
```

### pomo export [--format json|csv] [-o file]

Export all session history to stdout or a file.

```bash
pomo export                              # JSON to stdout
pomo export --format csv                 # CSV to stdout
pomo export -o sessions.json             # JSON to file
pomo export --format csv -o sessions.csv # CSV to file
```

### pomo config list|get|set [key] [value]

Manage configuration stored in `~/.pomo/config.json`.

```bash
pomo config list                  # show all config
pomo config get focusDuration     # get a value
pomo config set focusDuration 30  # set focus duration (minutes)
pomo config set breakDuration 10  # set break duration (minutes)
pomo config set notifyEnabled true # enable desktop notifications
```

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.x (strict mode)
- **TUI:** ink@5 + react@18
- **Storage:** better-sqlite3 (`~/.pomo/sessions.db`)
- **CLI:** commander@12
- **Tests:** vitest

## License

MIT
