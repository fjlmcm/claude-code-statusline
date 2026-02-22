#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const INSTALL_DIR = path.join(CLAUDE_DIR, 'plugins', 'claude-code-statusline');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const TARGET_JS = path.join(INSTALL_DIR, 'statusline.js');
const TARGET_LIB = path.join(INSTALL_DIR, 'lib');

function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch { return {}; }
}

function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
}

function isOurs(cmd) {
  return cmd && cmd.includes('statusline');
}

function statusLineCommand() {
  return 'node "' + TARGET_JS.replace(/\\/g, '/') + '"';
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = {
  CLAUDE_DIR, INSTALL_DIR, SETTINGS_PATH, TARGET_JS, TARGET_LIB,
  readSettings, writeSettings, isOurs, statusLineCommand, copyDirSync,
};
