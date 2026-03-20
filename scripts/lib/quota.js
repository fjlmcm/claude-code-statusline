'use strict';

const fs = require('fs');
const { spawn } = require('child_process');

const { debugLog } = require('./debug');
const { CACHE_FILE, readJSON, readCredentials } = require('./config');

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
      if (res.statusCode !== 200) {
        debugLog(`refreshCache: HTTP ${res.statusCode}`);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          JSON.parse(body);
          // Atomic write: write to tmp then rename
          const tmp = CACHE_FILE + '.tmp';
          fs.writeFileSync(tmp, body);
          fs.renameSync(tmp, CACHE_FILE);
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
    try {
      const child = spawn(process.execPath, [entryPoint, '--refresh-cache'], {
        stdio: 'ignore', detached: true, windowsHide: true,
      });
      child.unref();
    } catch (e) { debugLog(e); }
  }
  if (!cachedData) return null;
  // Mark stale if cache is very old or any reset time has passed
  let stale = cacheAge > 3 * cacheTtl;
  if (!stale) {
    const now = Date.now();
    for (const key of ['five_hour', 'seven_day']) {
      const bucket = cachedData[key];
      if (bucket && bucket.resets_at && new Date(bucket.resets_at).getTime() < now) {
        stale = true;
        break;
      }
    }
  }
  return { data: cachedData, stale };
}

module.exports = { refreshCache, getUsageData };
