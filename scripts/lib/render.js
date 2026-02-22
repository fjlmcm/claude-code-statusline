'use strict';

const path = require('path');
const os = require('os');

const {
  RESET, BOLD, DIM, CYAN, GREEN, YELLOW, RED, MAGENTA, NBSP,
} = require('./config');
const { fill, formatResetTime, formatDuration } = require('./i18n');

function emitLine(line) {
  process.stdout.write((RESET + line).replace(/ /g, NBSP) + '\n');
}

function usedColor(pct) {
  if (pct <= 50) return GREEN;
  if (pct <= 80) return YELLOW;
  return RED;
}

function abbreviatePath(p) {
  if (!p) return '~';
  const home = os.homedir().replace(/\\/g, '/');
  const norm = p.replace(/\\/g, '/');
  if (norm.startsWith(home)) return '~' + norm.slice(home.length);
  return norm;
}

function renderQuotaSegments(usageData, S, config, verbose) {
  const parts = [];
  for (const [field, label] of [['five_hour', 'quota_5h'], ['seven_day', 'quota_7d']]) {
    const bucket = usageData[field];
    if (!bucket || bucket.utilization == null) continue;
    const used = Math.round(bucket.utilization);
    let seg = `${usedColor(used)}${S[label]}:${used}%${RESET}`;
    if (verbose) {
      const rt = formatResetTime(bucket.resets_at, config.lang);
      if (rt) seg += ` ${DIM}${fill(S.reset_wrap, { time: rt })}${RESET}`;
    }
    parts.push(seg);
  }
  if (verbose) {
    for (const [key, label] of [['seven_day_opus', 'opus'], ['seven_day_sonnet', 'sonnet']]) {
      const md = usageData[key];
      if (md && md.utilization != null) {
        const used = Math.round(md.utilization);
        if (used > 0) parts.push(`${usedColor(used)}${label}:${used}%${RESET}`);
      }
    }
  }
  return parts;
}

function renderExpanded({ data, config, S, model, plan, currentDir, gitInfo, costData, ctxPercent, usageData }) {
  // Line 1: [Model] Plan ~/path session:Nm lines:+N/-N
  const l1 = [];
  l1.push(`${BOLD}${CYAN}[${model}]${RESET}`);
  if (plan) l1.push(` ${BOLD}${MAGENTA}${plan}${RESET}`);
  l1.push(` ${DIM}${abbreviatePath(currentDir)}${RESET}`);

  const dur = formatDuration(costData.total_duration_ms || 0, config.lang);
  if (dur) l1.push(` ${DIM}${S.session}:${dur}${RESET}`);

  const added = costData.total_lines_added || 0;
  const removed = costData.total_lines_removed || 0;
  if (added > 0 || removed > 0) l1.push(` ${DIM}${S.lines}:${RESET}${GREEN}+${added}${RESET}${DIM}/${RESET}${RED}-${removed}${RESET}`);

  // Line 2: git context | quota
  const l2 = [];
  if (gitInfo.branch) {
    let g = `${MAGENTA}${gitInfo.branch}${RESET}`;
    if (gitInfo.dirty > 0) g += ` ${YELLOW}${S.dirty}:${gitInfo.dirty}${RESET}`;
    if (gitInfo.ahead > 0) g += ` ${GREEN}↑${gitInfo.ahead}${RESET}`;
    if (gitInfo.behind > 0) g += ` ${RED}↓${gitInfo.behind}${RESET}`;
    l2.push(g);
  }

  if (ctxPercent != null) l2.push(`${usedColor(ctxPercent)}${S.ctx}:${ctxPercent}%${RESET}`);

  const vim = data.vim;
  if (vim && vim.mode) {
    const vc = vim.mode === 'NORMAL' ? CYAN : vim.mode === 'INSERT' ? GREEN : YELLOW;
    l2.push(`${vc}${vim.mode}${RESET}`);
  }

  if (data.agent && data.agent.name) l2.push(`${CYAN}${data.agent.name}${RESET}`);

  if (usageData) {
    l2.push(`${DIM}|${RESET}`);
    l2.push(...renderQuotaSegments(usageData, S, config, true));
  }

  emitLine(l1.join(''));
  emitLine(l2.join(' '));
}

function renderCompact({ data, config, S, model, plan, currentDir, gitInfo, costData, ctxPercent, usageData, tx }) {
  const p = [];
  p.push(`${BOLD}${CYAN}[${model}]${RESET}`);
  if (plan) p.push(`${BOLD}${MAGENTA}${plan}${RESET}`);

  const dirName = currentDir ? path.basename(currentDir) : '~';
  p.push(`${GREEN}${dirName}${RESET}`);

  if (gitInfo.branch) {
    let g = `${MAGENTA}${gitInfo.branch}${RESET}`;
    if (gitInfo.dirty > 0) g += ` ${YELLOW}${S.dirty}:${gitInfo.dirty}${RESET}`;
    p.push(g);
  }

  if (ctxPercent != null) p.push(`${usedColor(ctxPercent)}${S.ctx}:${ctxPercent}%${RESET}`);

  const dur = formatDuration(costData.total_duration_ms || 0, config.lang);
  if (dur) p.push(`${DIM}${S.session}:${dur}${RESET}`);

  if (tx.todosTotal > 0) {
    const c = tx.todosDone === tx.todosTotal ? GREEN : YELLOW;
    p.push(`${S.tasks}:${c}${tx.todosDone}/${tx.todosTotal}${RESET}`);
  }

  if (usageData) {
    p.push(`${DIM}|${RESET}`);
    p.push(...renderQuotaSegments(usageData, S, config, false));
  }

  emitLine(p.join(' '));
}

module.exports = {
  emitLine, usedColor, abbreviatePath, renderQuotaSegments,
  renderExpanded, renderCompact,
};
