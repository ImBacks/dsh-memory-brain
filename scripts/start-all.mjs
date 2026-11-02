#!/usr/bin/env node
// 一键启动的顺序与旧 start-all.sh 一致：DSH → QQ → SnowLuma → 等 OneBot → qq-bridge。
// Windows 上 QQ / SnowLuma 由用户自己打开并注入，本脚本只负责 DSH + 桥接（见 README.windows.md）。
// 具体实现见 src/runtime/orchestrator.mjs（Linux systemd / Windows PID 两条路）。
//
// 用法：
//   node scripts/start-all.mjs                  # 全部启动（RAG 按 config.json 的 memoryRag.enabled）
//   START_RAG=1 node scripts/start-all.mjs      # 打开 RAG 并一起启动
//   node scripts/start-all.mjs --rag            # 只起向量记忆并打开开关
//   node scripts/start-all.mjs --desktop        # 指定连 DSH 桌面版（默认自动：已打开的桌面版优先，否则 dsh web）
//   node scripts/start-all.mjs --web            # 指定用 dsh web（3080）
//
// 这个入口**只用 Node 内置模块**：刚 clone 下来还没装依赖时，编排器的 import（js-yaml 等）
// 会直接抛 ERR_MODULE_NOT_FOUND。所以先在这里补一次 npm ci，再动态加载编排器。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function dependenciesInstalled() {
  return ['js-yaml', '@snowluma/sdk', '@deepseek-ai/dsh-host-apiproxy']
    .every((name) => fs.existsSync(path.join(ROOT, 'node_modules', ...name.split('/'), 'package.json')));
}

function installDependencies() {
  console.log('[start] 首次运行：安装依赖（npm ci，大约 10~60 秒）...');
  // npm 在 Windows 上是 npm.cmd；Node 18.20+/20.12+ 不允许不经 shell 直接 spawn .cmd，
  // 所以走 cmd.exe（命令行是固定字符串，不拼任何外部输入）。
  const r = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm ci --no-audit --no-fund'], { cwd: ROOT, stdio: 'inherit' })
    : spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0 || !dependenciesInstalled()) {
    console.error('[fail] npm ci 失败：请确认已安装 Node.js（自带 npm）且能联网，然后在本目录手动运行 npm ci');
    return false;
  }
  console.log('  ok   依赖安装完成');
  return true;
}

if (!dependenciesInstalled() && !installDependencies()) {
  process.exitCode = 1;
} else {
  const { runStart } = await import(pathToFileURL(path.join(ROOT, 'src', 'runtime', 'orchestrator.mjs')).href);
  await runStart()
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      console.error(`[start] 启动失败：${error?.stack ?? error}`);
      process.exitCode = 1;
    });
}
