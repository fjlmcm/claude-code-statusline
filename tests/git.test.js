'use strict';

const path = require('path');
const { findGitDir } = require('../scripts/lib/git');

describe('findGitDir', () => {
  test('finds .git in current repo', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const { gitDir, repoRoot: root } = findGitDir(repoRoot);
    expect(gitDir).toBeTruthy();
    expect(root).toBe(repoRoot);
  });

  test('returns null for non-existent path', () => {
    const { gitDir, repoRoot } = findGitDir('/this/path/does/not/exist');
    expect(gitDir).toBeNull();
    expect(repoRoot).toBeNull();
  });

  test('walks up to find .git', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const subDir = path.join(repoRoot, 'scripts', 'lib');
    const { gitDir, repoRoot: root } = findGitDir(subDir);
    expect(gitDir).toBeTruthy();
    expect(root).toBe(repoRoot);
  });
});
