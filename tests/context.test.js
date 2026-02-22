'use strict';

const { withAutocompactBuffer, getContextPercent } = require('../scripts/lib/context');

describe('withAutocompactBuffer', () => {
  test('applies 22.5% buffer', () => {
    expect(withAutocompactBuffer(50)).toBe(61);
  });

  test('caps at 100', () => {
    expect(withAutocompactBuffer(90)).toBe(100);
  });

  test('0 stays 0', () => {
    expect(withAutocompactBuffer(0)).toBe(0);
  });

  test('rounds correctly', () => {
    expect(withAutocompactBuffer(10)).toBe(12);
  });
});

describe('getContextPercent', () => {
  test('returns null for falsy input', () => {
    expect(getContextPercent(null)).toBeNull();
    expect(getContextPercent(undefined)).toBeNull();
  });

  test('uses used_percentage when available', () => {
    const result = getContextPercent({ used_percentage: 50 });
    expect(result).toBe(61); // 50 * 1.225 = 61.25 -> 61
  });

  test('calculates from tokens when used_percentage missing', () => {
    const result = getContextPercent({
      context_window_size: 200000,
      current_usage: { input_tokens: 50000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    });
    // 50000/200000 = 25%, floor = 25, with buffer = 31
    expect(result).toBe(31);
  });

  test('returns null when no usage data', () => {
    expect(getContextPercent({})).toBeNull();
    expect(getContextPercent({ context_window_size: 200000 })).toBeNull();
  });

  test('clamps used_percentage to [0,100] before buffer', () => {
    const result = getContextPercent({ used_percentage: 150 });
    expect(result).toBe(100);
  });
});
