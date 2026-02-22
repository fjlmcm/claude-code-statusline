#!/usr/bin/env node
'use strict';

const fs = require('fs');

const { STRINGS } = require('./lib/i18n');
const { loadConfig, detectPlan, hasOAuthCredentials } = require('./lib/config');
const { getGitInfo } = require('./lib/git');
const { refreshCache, getUsageData } = require('./lib/quota');
const { getContextPercent } = require('./lib/context');
const { parseTranscript } = require('./lib/transcript');
const { emitLine, renderExpanded, renderCompact } = require('./lib/render');

if (process.argv[2] === '--refresh-cache') {
  refreshCache();
} else {
  let input = '';
  try { input = fs.readFileSync(0, 'utf8'); } catch {}
  let data;
  try { data = JSON.parse(input); } catch { emitLine('[Claude Code]'); process.exit(0); }

  const config = loadConfig();
  const S = STRINGS[config.lang] || STRINGS.en;
  const model = (data.model && data.model.display_name) || 'Claude';
  const modelId = (data.model && data.model.id) || '';
  const currentDir = (data.workspace && data.workspace.current_dir) || '';
  const costData = data.cost || {};
  const ctxPercent = getContextPercent(data.context_window || {});
  const gitInfo = getGitInfo(currentDir);
  const plan = detectPlan(config, modelId);
  const usageData = hasOAuthCredentials() ? getUsageData(config.cache_ttl, __filename) : null;

  const state = { data, config, S, model, plan, currentDir, gitInfo, costData, ctxPercent, usageData };

  if (config.layout === 'compact') {
    renderCompact({ ...state, tx: parseTranscript(data.transcript_path || '') });
  } else {
    renderExpanded(state);
  }
}
