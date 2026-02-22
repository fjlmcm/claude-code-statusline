# Contributing to claude-code-statusline

Thanks for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/fjlmcm/claude-code-statusline.git
cd claude-code-statusline
npm install
```

## Running Tests

```bash
npm test
```

## Project Structure

```
scripts/
  statusline.js          # Entry point (~40 lines)
  lib/
    debug.js             # Debug logging (CCSL_DEBUG=1)
    i18n.js              # Strings, time formats, duration units
    config.js            # ANSI constants, paths, config loading
    git.js               # Git directory detection and status
    quota.js             # API cache refresh and usage data
    context.js           # Context window percentage calculation
    transcript.js        # Transcript parsing for task counts
    render.js            # Output rendering (expanded + compact)
  shared.js              # Install helpers shared by setup.js and install.js
  setup.js               # Idempotent setup (called by SessionStart hook)
install.js               # Manual installer
uninstall.js             # Manual uninstaller
tests/                   # Jest test suite
```

## Code Style

- `'use strict'` at the top of every file
- No external runtime dependencies (Node.js stdlib only)
- All catch blocks must log via `debugLog()` — no empty `catch {}`
- Keep the statusline script fast: no synchronous network calls, no heavy I/O in the render path

## Making Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests as needed
4. Run `npm test` and ensure all tests pass
5. Test the statusline manually: `echo '{"model":{"display_name":"Opus 4.6"}}' | node scripts/statusline.js`
6. Submit a pull request

## Debugging

Set `CCSL_DEBUG=1` to enable debug logging:

```bash
export CCSL_DEBUG=1
```

Logs are written to `~/.claude/statusline-debug.log`.

## Reporting Bugs

Please use the [bug report template](https://github.com/fjlmcm/claude-code-statusline/issues/new?template=bug_report.md) and include your debug log if possible.
