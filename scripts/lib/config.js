'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const { debugLog } = require('./debug');
const { STRINGS, detectLang } = require('./i18n');

// ANSI
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';

const NBSP = '\u00A0';
const AUTOCOMPACT_BUFFER = 0.225;

// Paths
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const CACHE_FILE = path.join(CLAUDE_DIR, 'usage_cache.json');
const CREDS_FILE = path.join(CLAUDE_DIR, '.credentials.json');
const CONFIG_FILE = path.join(CLAUDE_DIR, 'statusline-config.json');

function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { debugLog(e); return null; }
}

// macOS: read credentials from Keychain; Windows/Linux: read from file
function readCredentials() {
  // Try file first (Windows/Linux, or legacy macOS)
  const fileCreds = readJSON(CREDS_FILE);
  if (fileCreds && fileCreds.claudeAiOauth && fileCreds.claudeAiOauth.accessToken) {
    return fileCreds;
  }
  // macOS: fall back to Keychain
  if (process.platform === 'darwin') {
    try {
      const raw = execFileSync(
        '/usr/bin/security',
        ['find-generic-password', '-s', 'Claude Code-credentials', '-w'],
        { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      if (raw) {
        const data = JSON.parse(raw);
        // Supplement subscriptionType from file if Keychain lacks it
        if (data.claudeAiOauth && !data.claudeAiOauth.subscriptionType && fileCreds && fileCreds.claudeAiOauth) {
          data.claudeAiOauth.subscriptionType = fileCreds.claudeAiOauth.subscriptionType;
          data.claudeAiOauth.rateLimitTier = fileCreds.claudeAiOauth.rateLimitTier;
        }
        return data;
      }
    } catch (e) { debugLog(e); }
  }
  return null;
}

function loadConfig() {
  const config = { layout: 'expanded', cache_ttl: 60, lang: detectLang(), plan: '' };
  const fc = readJSON(CONFIG_FILE);
  if (fc) {
    if (fc.layout) config.layout = fc.layout;
    if (fc.lang) config.lang = fc.lang;
    if (fc.plan) config.plan = fc.plan;
    if (fc.cache_ttl != null) config.cache_ttl = Number(fc.cache_ttl) || 60;
  }
  if (process.env.CCSL_LAYOUT) config.layout = process.env.CCSL_LAYOUT;
  if (process.env.CCSL_CACHE_TTL) config.cache_ttl = Number(process.env.CCSL_CACHE_TTL) || 60;
  if (process.env.CCSL_LANG) config.lang = process.env.CCSL_LANG.slice(0, 2).toLowerCase();
  if (process.env.CCSL_PLAN) config.plan = process.env.CCSL_PLAN;

  // Validate config values
  if (!['expanded', 'compact'].includes(config.layout)) {
    debugLog(`Invalid layout "${config.layout}", falling back to "expanded"`);
    config.layout = 'expanded';
  }
  if (!STRINGS[config.lang]) {
    debugLog(`Invalid lang "${config.lang}", falling back to "en"`);
    config.lang = 'en';
  }
  if (config.cache_ttl < 10 || config.cache_ttl > 600) {
    debugLog(`Invalid cache_ttl ${config.cache_ttl}, clamping to [10, 600]`);
    config.cache_ttl = Math.max(10, Math.min(600, config.cache_ttl));
  }

  return config;
}

function detectPlan(config, modelId) {
  if (config.plan) return config.plan;
  if (modelId && modelId.includes('anthropic.claude-')) return 'Bedrock';
  if (process.env.ANTHROPIC_API_KEY) return 'API';
  const creds = readCredentials();
  const oauth = (creds && creds.claudeAiOauth) || {};
  const subType = (oauth.subscriptionType || '').toLowerCase();
  const tier = (oauth.rateLimitTier || '').toLowerCase();
  if (subType.includes('max')) {
    if (tier.includes('20x')) return 'Max 20x';
    if (tier.includes('5x')) return 'Max 5x';
    return 'Max';
  }
  if (subType.includes('pro')) return 'Pro';
  if (subType.includes('team')) return 'Team';
  if (subType && !subType.includes('api')) return subType.charAt(0).toUpperCase() + subType.slice(1);
  return '';
}

function hasOAuthCredentials() {
  const creds = readCredentials();
  return !!(creds && creds.claudeAiOauth && creds.claudeAiOauth.accessToken);
}

module.exports = {
  RESET, BOLD, DIM, CYAN, GREEN, YELLOW, RED, MAGENTA,
  NBSP, AUTOCOMPACT_BUFFER,
  CLAUDE_DIR, CACHE_FILE, CREDS_FILE, CONFIG_FILE,
  readJSON, readCredentials, loadConfig, detectPlan, hasOAuthCredentials,
};
