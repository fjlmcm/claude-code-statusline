'use strict';

const { fill, detectLang, formatResetTime, formatDuration } = require('../scripts/lib/i18n');

describe('fill', () => {
  test('replaces placeholders', () => {
    expect(fill('{a} and {b}', { a: 'X', b: 'Y' })).toBe('X and Y');
  });

  test('missing key becomes empty string', () => {
    expect(fill('{a} {b}', { a: 'X' })).toBe('X ');
  });

  test('no placeholders returns original', () => {
    expect(fill('hello', {})).toBe('hello');
  });
});

describe('detectLang', () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
  });

  test('CCSL_LANG takes priority', () => {
    process.env.CCSL_LANG = 'zh_CN.UTF-8';
    expect(detectLang()).toBe('zh');
  });

  test('falls back to en for unknown language', () => {
    process.env.CCSL_LANG = 'xx';
    process.env.LANG = '';
    process.env.LC_ALL = '';
    // Should not throw; falls back to Intl or 'en'
    const lang = detectLang();
    expect(typeof lang).toBe('string');
  });

  test('uses LANG env if CCSL_LANG not set', () => {
    delete process.env.CCSL_LANG;
    process.env.LANG = 'ja_JP.UTF-8';
    expect(detectLang()).toBe('ja');
  });
});

describe('formatResetTime', () => {
  test('returns empty for falsy input', () => {
    expect(formatResetTime('', 'en')).toBe('');
    expect(formatResetTime(null, 'en')).toBe('');
  });

  test('returns empty for invalid date', () => {
    expect(formatResetTime('not-a-date', 'en')).toBe('');
  });

  test('formats today time in English (12h)', () => {
    const today = new Date();
    today.setHours(14, 0, 0, 0);
    const result = formatResetTime(today.toISOString(), 'en');
    expect(result).toBe('2pm');
  });

  test('formats today time in French (24h)', () => {
    const today = new Date();
    today.setHours(14, 0, 0, 0);
    const result = formatResetTime(today.toISOString(), 'fr');
    expect(result).toBe('14h');
  });

  test('formats different-day time with date', () => {
    // Use a date far in the future to ensure it's not today
    const result = formatResetTime('2099-03-15T10:00:00Z', 'en');
    expect(result).toMatch(/Mar/);
  });
});

describe('formatDuration', () => {
  test('returns empty for zero or negative', () => {
    expect(formatDuration(0, 'en')).toBe('');
    expect(formatDuration(-1000, 'en')).toBe('');
  });

  test('formats seconds', () => {
    expect(formatDuration(5000, 'en')).toBe('5s');
  });

  test('formats minutes', () => {
    expect(formatDuration(120000, 'en')).toBe('2m');
  });

  test('formats hours and minutes', () => {
    expect(formatDuration(3720000, 'en')).toBe('1h2m');
  });

  test('uses Chinese units', () => {
    expect(formatDuration(3720000, 'zh')).toBe('1小时2分钟');
  });

  test('uses Japanese units', () => {
    expect(formatDuration(120000, 'ja')).toBe('2分');
  });
});
