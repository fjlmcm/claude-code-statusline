# Changelog

## [1.1.8] - 2026-02-22

### Features
- Two-line expanded statusline with model, plan, path, session duration, lines changed
- Git info: branch, dirty count, ahead/behind
- Context window percentage with autocompact buffer
- Real-time 5h/7d quota display via Anthropic OAuth API
- Background quota refresh (never blocks Claude Code)
- Compact single-line mode
- 9 languages: en, zh, ja, ko, fr, de, es, pt, ru
- Plan auto-detection: Pro, Max 5x, Max 20x, API, Bedrock
- Plugin install, npm install, and manual install support
- Config via JSON file or CCSL_* environment variables
- Debug logging: `CCSL_DEBUG=1` writes to `~/.claude/statusline-debug.log`
- Config validation with safe fallback defaults
- Atomic cache writes to prevent corruption
- Modular architecture: 8 focused modules under `scripts/lib/`
- Test suite: 51 tests covering i18n, config, context, render, and git
- GitHub issue templates for bug reports and feature requests
