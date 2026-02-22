'use strict';

const fs = require('fs');

const { debugLog } = require('./debug');

function parseTranscript(transcriptPath) {
  const result = { todosTotal: 0, todosDone: 0 };
  if (!transcriptPath) return result;
  try {
    const stat = fs.statSync(transcriptPath);
    const readSize = Math.min(stat.size, 128 * 1024);
    const buf = Buffer.alloc(readSize);
    const fd = fs.openSync(transcriptPath, 'r');
    fs.readSync(fd, buf, 0, readSize, Math.max(0, stat.size - readSize));
    fs.closeSync(fd);
    let text = buf.toString('utf8');
    if (stat.size > readSize) {
      const idx = text.indexOf('\n');
      if (idx >= 0) text = text.slice(idx + 1);
    }
    let tasks = {};
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      const content = entry && entry.message && entry.message.content;
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        if (!block || block.type !== 'tool_use') continue;
        const name = block.name || '';
        const inp = block.input || {};
        if (name === 'TodoWrite') {
          tasks = {};
          (inp.todos || []).forEach((t, i) => { tasks[String(i)] = t.status || 'pending'; });
        } else if (name === 'TaskCreate') {
          tasks[inp.id || String(Object.keys(tasks).length)] = 'pending';
        } else if (name === 'TaskUpdate' && inp.taskId && inp.status) {
          if (inp.status === 'done' || inp.status === 'completed') tasks[inp.taskId] = 'completed';
          else if (inp.status === 'deleted') delete tasks[inp.taskId];
          else tasks[inp.taskId] = inp.status;
        }
      }
    }
    result.todosTotal = Object.keys(tasks).length;
    result.todosDone = Object.values(tasks).filter(s => s === 'completed').length;
  } catch (e) { debugLog(e); }
  return result;
}

module.exports = { parseTranscript };
