'use strict';

function getContextPercent(ctx) {
  if (!ctx) return null;
  const native = ctx.used_percentage;
  if (typeof native === 'number' && !isNaN(native)) {
    return Math.min(100, Math.max(0, Math.round(native)));
  }
  const ctxSize = ctx.context_window_size || 0;
  const usage = ctx.current_usage;
  if (!usage || ctxSize <= 0) return null;
  const current = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
  return Math.min(100, Math.floor(current * 100 / ctxSize));
}

module.exports = { getContextPercent };
