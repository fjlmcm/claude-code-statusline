# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Code statusline plugin — a Node.js CLI tool that renders a live status bar in Claude Code's terminal showing model info, git status, context usage, and real-time Anthropic API quota data. Supports 9 languages and two layout modes (expanded/compact).

## Commands

- **Run tests:** `npm test` (uses Jest)
- **Run a single test file:** `npx jest tests/render.test.js`
- **Manual install (for dev):** `node ccsl-install.js`
- **Manual uninstall:** `node ccsl-uninstall.js`
- **Test statusline output directly:** pipe JSON to `node scripts/statusline.js`

## Architecture

The entry point is `scripts/statusline.js`. It reads JSON session data from stdin, assembles state from lib modules, and writes ANSI-formatted output to stdout.

### Core modules (`scripts/lib/`)

- **config.js** — ANSI constants, path definitions (`~/.claude/` files), config loading (file + env vars), credential reading (file or macOS Keychain), plan detection from OAuth subscription type
- **quota.js** — Fetches quota from `api.anthropic.com/api/oauth/usage` via OAuth token; uses atomic file-based cache (`usage_cache.json`); stale cache triggers a detached background child process (`--refresh-cache` flag); lock file prevents concurrent refresh spawns; 429 responses trigger exponential backoff (60s→120s→240s→300s cap) persisted to `.backoff` file
- **render.js** — `renderExpanded` (2-line) and `renderCompact` (1-line) layouts; displays **remaining** quota percentage (100 - used); expanded mode shows 7d per-model breakdown inline (`7d left:opus 80% sonnet 23%`); color thresholds based on used%: green ≤50%, yellow ≤80%, red >80%; all spaces replaced with NBSP for terminal rendering
- **i18n.js** — `STRINGS`, `TIME_FORMATS`, `DURATION_UNITS` for 9 locales (en/zh/ja/ko/fr/de/es/pt/ru); `detectLang()` checks `CCSL_LANG` → `LANG`/`LC_ALL` → `Intl`; `fill()` is a simple `{key}` template function
- **context.js** — Calculates context window usage percentage from `used_percentage` or token counts
- **git.js** — Reads branch from `.git/HEAD` directly (supports worktrees via gitdir), runs `git status --porcelain` and `git rev-list` for dirty/ahead/behind counts
- **transcript.js** — Parses Claude Code JSONL transcript (tail 128KB) to count TodoWrite/TaskCreate/TaskUpdate operations for compact mode's task counter
- **debug.js** — Conditional logging to `~/.claude/statusline-debug.log` when `CCSL_DEBUG=1`

### Install/Setup flow

- **Plugin install:** `hooks/hooks.json` registers a `SessionStart` hook that runs `scripts/setup.js`
- **setup.js** — Idempotent: copies scripts to `~/.claude/plugins/claude-code-statusline/`, sets `statusLine.command` in `~/.claude/settings.json`
- **ccsl-install.js / ccsl-uninstall.js** — Manual install/uninstall entry points; shared logic lives in `scripts/shared.js`

## Key Design Decisions

- Quota refresh is **always async** (detached child process) — the statusline must never block Claude Code
- 429 rate limits use **exponential backoff** with state persisted to file, respecting `Retry-After` header
- Lock file + backoff file prevent concurrent refresh spawns and excessive API calls
- Quota displays **remaining** percentage (not used), which is more intuitive
- Config priority: env vars (`CCSL_*`) > config file (`~/.claude/statusline-config.json`) > defaults
- Default `cache_ttl` is 120 seconds to reduce API pressure
- Git info reads `.git/HEAD` directly instead of `git branch` for speed; only shells out for dirty/ahead/behind
- All output spaces are replaced with `\u00A0` (NBSP) so Claude Code's terminal doesn't collapse them
- API key users (`ANTHROPIC_API_KEY` set) get no quota section since API keys have no 5h/7d limits
