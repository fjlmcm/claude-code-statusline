#!/usr/bin/env node
'use strict';

// install.js — Manual installer for claude-code-statusline.

const fs = require('fs');
const path = require('path');
const { INSTALL_DIR, SETTINGS_PATH, TARGET_JS, TARGET_LIB, readSettings, writeSettings, isOurs, statusLineCommand, copyDirSync } = require('./scripts/shared');

const sourceJs = path.join(__dirname, 'scripts', 'statusline.js');
const sourceLib = path.join(__dirname, 'scripts', 'lib');

console.log('=== claude-code-statusline installer ===\n');

if (!fs.existsSync(sourceJs)) {
  console.error('ERROR: Cannot find scripts/statusline.js');
  process.exit(1);
}

console.log('[+] Node.js:', process.version);
console.log('[+] Source:', sourceJs);

// Copy statusline.js and lib/
fs.mkdirSync(INSTALL_DIR, { recursive: true });
fs.copyFileSync(sourceJs, TARGET_JS);
console.log('[+] Copied statusline.js to', TARGET_JS);

if (fs.existsSync(sourceLib)) {
  copyDirSync(sourceLib, TARGET_LIB);
  console.log('[+] Copied lib/ to', TARGET_LIB);
}

// Update settings.json
if (fs.existsSync(SETTINGS_PATH)) {
  fs.copyFileSync(SETTINGS_PATH, SETTINGS_PATH + '.bak');
  console.log('[+] Backed up settings.json');
}
const settings = readSettings();
const existingCmd = (settings.statusLine && settings.statusLine.command) || '';
if (existingCmd && !isOurs(existingCmd)) {
  console.log('[!] WARNING: statusLine is configured for another tool.');
  console.log('    Current:', existingCmd);
  console.log('    Overwriting with claude-code-statusline.');
}
settings.statusLine = { type: 'command', command: statusLineCommand(), padding: 0 };
writeSettings(settings);
console.log('[+] Configured statusLine in settings.json');

console.log('\n=== Installation complete! ===');
console.log('Restart Claude Code to see the statusline.\n');
console.log('To customize, create ~/.claude/statusline-config.json');
console.log('or set CCSL_* environment variables. See README.md for details.');
