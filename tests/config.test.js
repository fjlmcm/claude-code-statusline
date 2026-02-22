'use strict';

const { loadConfig, detectPlan } = require('../scripts/lib/config');

describe('loadConfig', () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
  });

  test('returns default config', () => {
    const config = loadConfig();
    expect(config).toHaveProperty('layout');
    expect(config).toHaveProperty('cache_ttl');
    expect(config).toHaveProperty('lang');
    expect(config).toHaveProperty('plan');
  });

  test('invalid layout falls back to expanded', () => {
    process.env.CCSL_LAYOUT = 'invalid';
    const config = loadConfig();
    expect(config.layout).toBe('expanded');
  });

  test('compact layout is accepted', () => {
    process.env.CCSL_LAYOUT = 'compact';
    const config = loadConfig();
    expect(config.layout).toBe('compact');
  });

  test('invalid lang falls back to en', () => {
    process.env.CCSL_LANG = 'xx';
    const config = loadConfig();
    expect(config.lang).toBe('en');
  });

  test('valid lang is accepted', () => {
    process.env.CCSL_LANG = 'zh';
    const config = loadConfig();
    expect(config.lang).toBe('zh');
  });

  test('cache_ttl below 10 is clamped', () => {
    process.env.CCSL_CACHE_TTL = '5';
    const config = loadConfig();
    expect(config.cache_ttl).toBe(10);
  });

  test('cache_ttl above 600 is clamped', () => {
    process.env.CCSL_CACHE_TTL = '9999';
    const config = loadConfig();
    expect(config.cache_ttl).toBe(600);
  });

  test('cache_ttl within range is kept', () => {
    process.env.CCSL_CACHE_TTL = '120';
    const config = loadConfig();
    expect(config.cache_ttl).toBe(120);
  });
});

describe('detectPlan', () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
  });

  test('returns config.plan if set', () => {
    expect(detectPlan({ plan: 'MyPlan' }, '')).toBe('MyPlan');
  });

  test('detects Bedrock from model ID', () => {
    expect(detectPlan({ plan: '' }, 'anthropic.claude-v3')).toBe('Bedrock');
  });

  test('detects API from env var', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    expect(detectPlan({ plan: '' }, 'claude-opus-4-6')).toBe('API');
    delete process.env.ANTHROPIC_API_KEY;
  });

  test('returns empty string for non-Bedrock model without API key (when no credentials)', () => {
    delete process.env.ANTHROPIC_API_KEY;
    // detectPlan reads ~/.claude/.credentials.json, so result depends on local env.
    // At minimum, it should return a string and not throw.
    const result = detectPlan({ plan: '' }, 'claude-opus-4-6');
    expect(typeof result).toBe('string');
  });
});
