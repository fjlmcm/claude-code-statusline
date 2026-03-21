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

function remainingPart(used, label) {
  return `${usedColor(used)}${label} ${100 - used}%${RESET}`;
}

function quotaLabel(S, fallback, resets_at, lang, verbose) {
  if (verbose) {
    const rt = formatResetTime(resets_at, lang);
    if (rt) return fill(S.quota_before, { time: rt });
  }
  return fallback;
}

function renderQuotaSegments(usageData, S, config, verbose) {
  const parts = [];

  // 5h quota
  const fiveH = usageData.five_hour;
  if (fiveH && fiveH.utilization != null) {
    const used = Math.round(fiveH.utilization);
    const label = quotaLabel(S, S.quota_5h, fiveH.resets_at, config.lang, verbose);
    parts.push(`${usedColor(used)}${label}:${100 - used}%${RESET}`);
  }

  // 7d quota — inline per-model breakdown when available
  const sevenD = usageData.seven_day;
  if (sevenD && sevenD.utilization != null) {
    const opus = usageData.seven_day_opus;
    const sonnet = usageData.seven_day_sonnet;
    const hasModelBreakdown = verbose && (opus || sonnet);
    const label = quotaLabel(S, S.quota_7d, sevenD.resets_at, config.lang, verbose);

    let seg;
    if (hasModelBreakdown) {
      const modelParts = [];
      // opus: use seven_day_opus if available, otherwise use overall as opus
      const opusUsed = Math.round((opus && opus.utilization != null) ? opus.utilization : sevenD.utilization);
      modelParts.push(remainingPart(opusUsed, 'opus'));
      if (sonnet && sonnet.utilization != null) {
        modelParts.push(remainingPart(Math.round(sonnet.utilization), 'sonnet'));
      }
      seg = `${label}:` + modelParts.join(' ');
    } else {
      const used = Math.round(sevenD.utilization);
      seg = `${usedColor(used)}${label}:${100 - used}%${RESET}`;
    }
    parts.push(seg);
  }

  // extra_usage
  if (verbose) {
    const extra = usageData.extra_usage;
    if (extra && extra.is_enabled && extra.utilization != null) {
      const used = Math.round(extra.utilization);
      parts.push(`${usedColor(used)}${S.quota_extra}:${100 - used}%${RESET}`);
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
