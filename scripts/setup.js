#!/usr/bin/env node
'use strict';

// setup.js — Idempotent statusline setup called by SessionStart hook.

const fs = require('fs');
const path = require('path');
const { INSTALL_DIR, TARGET_JS, TARGET_LIB, readSettings, writeSettings, isOurs, statusLineCommand, copyDirSync } = require('./shared');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const sourceJs = path.join(pluginRoot, 'scripts', 'statusline.js');
const sourceLib = path.join(pluginRoot, 'scripts', 'lib');

// Copy statusline.js and lib/ (skip if target is up-to-date)
try {
  fs.mkdirSync(INSTALL_DIR, { recursive: true });
  if (fs.existsSync(sourceJs)) {
    let needCopy = true;
    try {
      const src = fs.statSync(sourceJs);
      const tgt = fs.statSync(TARGET_JS);
      if (tgt.mtimeMs >= src.mtimeMs && tgt.size === src.size) needCopy = false;
    } catch {}
    if (needCopy) {
      fs.copyFileSync(sourceJs, TARGET_JS);
      if (fs.existsSync(sourceLib)) copyDirSync(sourceLib, TARGET_LIB);
    }
  }
} catch {}

// Configure statusLine in settings.json
try {
  const settings = readSettings();
  const cmd = (settings.statusLine && settings.statusLine.command) || '';
  if (cmd && !isOurs(cmd)) process.exit(0);
  const want = statusLineCommand();
  if (cmd === want) process.exit(0);
  settings.statusLine = { type: 'command', command: want, padding: 0 };
  writeSettings(settings);
} catch {}
