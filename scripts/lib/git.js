'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { debugLog } = require('./debug');

function findGitDir(cwd) {
  try {
    const gitPath = path.join(cwd, '.git');
    let stat;
    try { stat = fs.statSync(gitPath); } catch (e) { debugLog(e); stat = null; }
    if (stat && stat.isFile()) {
      const content = fs.readFileSync(gitPath, 'utf8').trim();
      if (content.startsWith('gitdir:')) {
        let gitDir = content.slice(7).trim();
        if (!path.isAbsolute(gitDir)) gitDir = path.join(cwd, gitDir);
        return { gitDir, repoRoot: cwd };
      }
    } else if (stat && stat.isDirectory()) {
      return { gitDir: gitPath, repoRoot: cwd };
    } else {
      const parent = path.dirname(cwd);
      if (parent !== cwd) return findGitDir(parent);
    }
  } catch (e) { debugLog(e); }
  return { gitDir: null, repoRoot: null };
}

function getGitInfo(cwd) {
  const info = { branch: '', dirty: 0, ahead: 0, behind: 0 };
  if (!cwd) return info;
  const { gitDir, repoRoot } = findGitDir(cwd);
  if (!gitDir) return info;

  try {
    const ref = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
    if (ref.startsWith('ref: refs/heads/')) info.branch = ref.slice(16);
    else if (ref.length >= 7) info.branch = ref.slice(0, 7);
  } catch (e) { debugLog(e); }

  if (!repoRoot) return info;
  const opts = { encoding: 'utf8', timeout: 2000, windowsHide: true };

  try {
    const out = execFileSync('git', ['-C', repoRoot, 'status', '--porcelain'], opts);
    if (out.trim()) info.dirty = out.trim().split('\n').length;
  } catch (e) { debugLog(e); }

  if (info.branch) {
    try {
      const out = execFileSync('git', ['-C', repoRoot, 'rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], opts);
      const parts = out.trim().split(/\s+/);
      if (parts.length === 2) {
        info.ahead = Number(parts[0]) || 0;
        info.behind = Number(parts[1]) || 0;
      }
    } catch (e) { debugLog(e); }
  }
  return info;
}

module.exports = { findGitDir, getGitInfo };
