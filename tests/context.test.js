'use strict';

const { getContextPercent } = require('../scripts/lib/context');

describe('getContextPercent', () => {
  test('returns null for falsy input', () => {
    expect(getContextPercent(null)).toBeNull();
    expect(getContextPercent(undefined)).toBeNull();
  });

  test('uses used_percentage when available', () => {
    const result = getContextPercent({ used_percentage: 50 });
    expect(result).toBe(50);
  });

  test('calculates from tokens when used_percentage missing', () => {
    const result = getContextPercent({
      context_window_size: 200000,
      current_usage: { input_tokens: 50000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    });
    // 50000/200000 = 25%
    expect(result).toBe(25);
  });

  test('returns null when no usage data', () => {
    expect(getContextPercent({})).toBeNull();
    expect(getContextPercent({ context_window_size: 200000 })).toBeNull();
  });

  test('clamps used_percentage to [0,100]', () => {
    expect(getContextPercent({ used_percentage: 150 })).toBe(100);
    expect(getContextPercent({ used_percentage: -5 })).toBe(0);
  });

  test('rounds used_percentage', () => {
    expect(getContextPercent({ used_percentage: 33.7 })).toBe(34);
  });
});
