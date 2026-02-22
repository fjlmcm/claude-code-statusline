'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEBUG = !!(process.env.CCSL_DEBUG && process.env.CCSL_DEBUG !== '0');
const LOG_FILE = path.join(os.homedir(), '.claude', 'statusline-debug.log');

function debugLog(msg) {
  if (!DEBUG) return;
  try {
    const ts = new Date().toISOString();
    const line = msg instanceof Error
      ? `[${ts}] ${msg.stack || msg.message}\n`
      : `[${ts}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line);
  } catch {}
}

module.exports = { DEBUG, LOG_FILE, debugLog };
