---
name: Bug report
about: Report a problem with claude-code-statusline
title: ''
labels: bug
assignees: ''
---

**Describe the bug**
A clear description of what's wrong.

**Expected behavior**
What you expected to happen.

**Environment**
- OS: [e.g. macOS 15, Windows 11, Ubuntu 24]
- Node.js version: [run `node -v`]
- Claude Code version: [run `claude --version`]
- Plugin version: [check `.claude-plugin/plugin.json`]
- Layout: [expanded / compact]
- Language: [en / zh / ja / ko / fr / de / es / pt / ru]

**Debug log**
Enable debug logging and attach the output:
```bash
export CCSL_DEBUG=1
# Use Claude Code normally, then check:
cat ~/.claude/statusline-debug.log
```

**Additional context**
Any other details, screenshots, or config files.
