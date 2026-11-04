#!/usr/bin/env node
// 一键停止的跨平台实现（入口：stop-all.sh / stop-all.bat，它们只是一层转发）。
// 用法：node scripts/stop-all.mjs [--all] [--rag]
import { runStop } from '../src/runtime/orchestrator.mjs';
import { mirrorOutputToLog } from './lib/entry-guard.mjs';

mirrorOutputToLog('stop-all');
runStop().then((code) => { process.exitCode = code; }).catch((error) => {
  console.error(`[stop] 停止失败：${error?.stack ?? error}`);
  process.exitCode = 1;
});
