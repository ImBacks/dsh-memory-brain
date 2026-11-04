#!/usr/bin/env node
// 仓库是公开的：作者本机的 agent 说明、设计文档和交接记录不能被提交。.gitignore 挡不住 git add -f，这里再兜一层。
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) {
  console.log('SKIP 不是 git 仓库（比如 ZIP 下载的）');
  process.exit(0);
}
const FORBIDDEN = /(^|\/)(CLAUDE|AGENTS|GEMINI)\.md$|(^|\/)\.claude\/|^docs\/design\/|(^|\/)worker-kit\/|(^|\/)HANDOFF[^/]*\.md$|_SPEC\.md$/i;
const hits = r.stdout.split('\0').filter((name) => FORBIDDEN.test(name));
assert.deepEqual(hits, [], `这些文件不该进公开仓库：${hits.join(', ')}`);
console.log('PASS 没有 agent 说明和设计文档被跟踪');
