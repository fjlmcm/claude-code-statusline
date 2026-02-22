#!/usr/bin/env node
'use strict';

// uninstall.js — Remove claude-code-statusline.

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR, INSTALL_DIR, SETTINGS_PATH, readSettings, writeSettings, isOurs } = require('./scripts/shared');

console.log('=== claude-code-statusline uninstaller ===\n');

// Remove installed plugin directory
if (fs.existsSync(INSTALL_DIR)) {
  fs.rmSync(INSTALL_DIR, { recursive: true, force: true });
  console.log('[+] Removed', INSTALL_DIR);
}

// Remove runtime files
for (const f of ['usage_cache.json', 'statusline-config.json']) {
  const target = path.join(CLAUDE_DIR, f);
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
    console.log('[+] Removed', target);
  }
}

// Remove statusLine from settings.json (only if it points to our script)
if (fs.existsSync(SETTINGS_PATH)) {
  const settings = readSettings();
  if (!settings.statusLine) {
    console.log('[*] No statusLine in settings.json.');
  } else if (!isOurs(settings.statusLine.command)) {
    console.log('[*] statusLine not managed by this plugin — skipping.');
  } else {
    fs.copyFileSync(SETTINGS_PATH, SETTINGS_PATH + '.uninstall.bak');
    console.log('[+] Backed up settings.json');
    delete settings.statusLine;
    writeSettings(settings);
    console.log('[+] Removed statusLine from settings.json.');
  }
}

console.log('\n=== Uninstall complete! ===');
console.log('Restart Claude Code to apply changes.');
