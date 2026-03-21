'use strict';

const fs = require('fs');
const { spawn } = require('child_process');

const { debugLog } = require('./debug');
const { CACHE_FILE, readJSON, readCredentials } = require('./config');

const LOCK_FILE = CACHE_FILE + '.lock';
const BACKOFF_FILE = CACHE_FILE + '.backoff';

function readBackoff() {
  try { return JSON.parse(fs.readFileSync(BACKOFF_FILE, 'utf8')); } catch { return null; }
}

function writeBackoff(count, waitSec) {
  try {
    fs.writeFileSync(BACKOFF_FILE, JSON.stringify({ count, retryAfter: Date.now() + waitSec * 1000 }));
  } catch (e) { debugLog(e); }
}

function clearBackoff() {
  try { fs.unlinkSync(BACKOFF_FILE); } catch {}
}

function refreshCache() {
  const https = require('https');
  try {
    const creds = readCredentials();
    if (!creds || !creds.claudeAiOauth || !creds.claudeAiOauth.accessToken) {
      debugLog('refreshCache: no credentials available');
      return;
    }
    const token = creds.claudeAiOauth.accessToken;
    const req = https.get({
      hostname: 'api.anthropic.com',
      path: '/api/oauth/usage',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'anthropic-beta': 'oauth-2025-04-20',
      },
      timeout: 5000,
    }, (res) => {
      if (res.statusCode === 429) {
        const bo = readBackoff();
        const count = (bo ? bo.count : 0) + 1;
        const retryAfterHeader = parseInt(res.headers['retry-after'], 10) || 0;
        const backoffSec = Math.min(60 * Math.pow(2, count - 1), 300);
        const waitSec = Math.max(backoffSec, retryAfterHeader);
        writeBackoff(count, waitSec);
        debugLog(`refreshCache: 429, backoff ${waitSec}s (count: ${count})`);
        return;
      }
      if (res.statusCode !== 200) {
        debugLog(`refreshCache: HTTP ${res.statusCode}`);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          JSON.parse(body);
          const tmp = CACHE_FILE + '.tmp';
          fs.writeFileSync(tmp, body);
          fs.renameSync(tmp, CACHE_FILE);
          clearBackoff();
        } catch (e) { debugLog(e); }
      });
    });
    req.on('timeout', () => { debugLog('refreshCache: request timeout'); req.destroy(); });
    req.on('error', (e) => { debugLog(e); });
  } catch (e) { debugLog(e); }
}

function getUsageData(cacheTtl, entryPoint) {
  let cachedData = null;
  let cacheAge = Infinity;
  try {
    const stat = fs.statSync(CACHE_FILE);
    cacheAge = (Date.now() - stat.mtimeMs) / 1000;
    cachedData = readJSON(CACHE_FILE);
  } catch (e) { debugLog(e); }
  if (cacheAge >= cacheTtl) {
    // Skip if in 429 backoff period
    const bo = readBackoff();
    if (bo && bo.retryAfter > Date.now()) return cachedData;
    // Skip if another refresh is already in progress
    let locked = false;
    try {
      const lockAge = (Date.now() - fs.statSync(LOCK_FILE).mtimeMs) / 1000;
      locked = lockAge < cacheTtl;
    } catch {}
    if (!locked) {
      try {
        fs.writeFileSync(LOCK_FILE, String(Date.now()));
        const child = spawn(process.execPath, [entryPoint, '--refresh-cache'], {
          stdio: 'ignore', detached: true, windowsHide: true,
        });
        child.unref();
      } catch (e) { debugLog(e); }
    }
  }
  return cachedData;
}

module.exports = { refreshCache, getUsageData };
