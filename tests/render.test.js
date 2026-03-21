'use strict';

const { usedColor, abbreviatePath, renderQuotaSegments } = require('../scripts/lib/render');
const { GREEN, YELLOW, RED, RESET, DIM } = require('../scripts/lib/config');
const { STRINGS } = require('../scripts/lib/i18n');

describe('usedColor', () => {
  test('green for <= 50%', () => {
    expect(usedColor(0)).toBe(GREEN);
    expect(usedColor(50)).toBe(GREEN);
  });

  test('yellow for 51-80%', () => {
    expect(usedColor(51)).toBe(YELLOW);
    expect(usedColor(80)).toBe(YELLOW);
  });

  test('red for > 80%', () => {
    expect(usedColor(81)).toBe(RED);
    expect(usedColor(100)).toBe(RED);
  });
});

describe('abbreviatePath', () => {
  const os = require('os');
  const home = os.homedir().replace(/\\/g, '/');

  test('returns ~ for empty path', () => {
    expect(abbreviatePath('')).toBe('~');
    expect(abbreviatePath(null)).toBe('~');
  });

  test('abbreviates home directory', () => {
    const result = abbreviatePath(home + '/projects/my-app');
    expect(result).toBe('~/projects/my-app');
  });

  test('non-home path returned as-is (normalized)', () => {
    const result = abbreviatePath('/tmp/test');
    expect(result).toBe('/tmp/test');
  });
});

describe('renderQuotaSegments', () => {
  const S = STRINGS.en;
  const config = { lang: 'en' };

  test('returns empty array for empty usage data', () => {
    const parts = renderQuotaSegments({}, S, config, false);
    expect(parts).toEqual([]);
  });

  test('renders 5h bucket as remaining', () => {
    const data = { five_hour: { utilization: 25 } };
    const parts = renderQuotaSegments(data, S, config, false);
    expect(parts.length).toBe(1);
    expect(parts[0]).toContain('75%');
  });

  test('renders both buckets', () => {
    const data = {
      five_hour: { utilization: 25 },
      seven_day: { utilization: 50 },
    };
    const parts = renderQuotaSegments(data, S, config, false);
    expect(parts.length).toBe(2);
  });

  test('verbose mode adds reset time', () => {
    const today = new Date();
    today.setHours(15, 0, 0, 0);
    const data = { five_hour: { utilization: 25, resets_at: today.toISOString() } };
    const parts = renderQuotaSegments(data, S, config, true);
    expect(parts.length).toBe(1);
    expect(parts[0]).toContain('reset');
  });

  test('extra_usage shown in verbose mode when enabled', () => {
    const data = {
      five_hour: { utilization: 10 },
      extra_usage: { is_enabled: true, utilization: 40 },
    };
    const parts = renderQuotaSegments(data, S, config, true);
    expect(parts.some(p => p.includes('extra') && p.includes('60%'))).toBe(true);
  });

  test('extra_usage hidden when not enabled', () => {
    const data = {
      five_hour: { utilization: 10 },
      extra_usage: { is_enabled: false, utilization: null },
    };
    const parts = renderQuotaSegments(data, S, config, true);
    expect(parts.some(p => p.includes('extra'))).toBe(false);
  });
});
