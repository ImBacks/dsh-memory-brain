// 用户自己启动的 SnowLuma：找到它的安装目录、确认 OneBot HTTP / WebSocket 能用哪个 token。
//
// Windows 一键启动的约定是「用户先自己用 SnowLuma 注入 QQ 并开好 OneBot 服务，
// 再运行 start-all.bat」。这时本脚本不知道 SnowLuma 装在哪，而 token 恰恰写在
// <SnowLuma>/config/onebot_<QQ号>.json 里（HTTP 与 WS 各一个，值不同）。找目录的顺序：
//   1) config.json 的 snowluma.homeDir / orchestrator.snowDir、环境变量 SNOWLUMA_HOME / SNOW_DIR；
//   2) 监听 OneBot 端口的进程及其父进程链（SnowLuma.exe 的路径、`node X:\…\index.mjs`、
//      双击 launcher.bat 时父 cmd.exe 命令行里的完整路径）；
//   3) 常见解压位置（~/SnowLuma、各盘根目录的 SnowLuma，见 paths.findSnowLumaDir）。
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { readOneBotTokens } from '../snowluma-conn.js';
import { findSnowLumaDir } from './paths.mjs';

function run(command, args, timeout = 15000) {
  return new Promise((resolve) => {
    try {
      execFile(command, args, { timeout, windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (error, stdout) => resolve(String(stdout ?? '')));
    } catch {
      resolve('');
    }
  });
}

function isDir(dir) {
  try { return fs.statSync(dir).isDirectory(); } catch { return false; }
}

/** 像不像一个 SnowLuma 目录：有 config/ 且（有 onebot_*.json 或程序文件）。 */
export function looksLikeSnowLuma(dir) {
  if (!dir || !isDir(path.join(dir, 'config'))) return false;
  if (readOneBotTokens(dir).length) return true;
  return ['index.mjs', 'SnowLuma.exe', 'launcher.bat'].some((name) => fs.existsSync(path.join(dir, name)));
}

/** 从一条进程信息里猜 SnowLuma 目录（只返回候选，调用方再用 looksLikeSnowLuma 校验）。 */
export function dirsFromProcess({ exe = '', cmd = '' } = {}) {
  // 进程扫描只在 Windows 上做（PowerShell），这里固定按 win32 路径语义，Linux CI 上测试也成立。
  const out = [];
  if (/snowluma\.exe$/i.test(exe)) out.push(path.win32.dirname(exe));
  for (const match of String(cmd).matchAll(/"([^"]+\.(?:mjs|bat|cmd|exe))"|(\S+\.(?:mjs|bat|cmd|exe))/gi)) {
    const file = match[1] ?? match[2];
    if (path.win32.isAbsolute(file) && /^[A-Za-z]:/.test(file) && !/[\\/](?:system32|windows)[\\/]/i.test(file)) out.push(path.win32.dirname(file));
  }
  return out;
}

const OWNER_CHAIN = (port) => [
  "$ErrorActionPreference = 'SilentlyContinue'",
  `$c = Get-NetTCPConnection -State Listen -LocalPort ${Number(port)} | Select-Object -First 1`,
  '$procId = if ($c) { [int]$c.OwningProcess } else { 0 }',
  '$out = @()',
  'for ($i = 0; $i -lt 4 -and $procId -gt 0; $i++) {',
  '  $p = Get-CimInstance Win32_Process -Filter "ProcessId = $procId"',
  '  if (-not $p) { break }',
  '  $out += [pscustomobject]@{ pid = [int]$p.ProcessId; exe = [string]$p.ExecutablePath; cmd = [string]$p.CommandLine }',
  '  $procId = [int]$p.ParentProcessId',
  '}',
  'ConvertTo-Json -InputObject @($out) -Compress'
].join('\n');

/** 监听 port 的进程 + 最多 3 层父进程（仅 Windows）。 */
export async function processChainForPort(port, { platform = process.platform } = {}) {
  if (platform !== 'win32' || !Number.isInteger(Number(port))) return [];
  const raw = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', OWNER_CHAIN(port)]);
  try {
    const parsed = JSON.parse(raw.trim() || '[]');
    return (Array.isArray(parsed) ? parsed : [parsed]).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * 按优先级列出可能的 SnowLuma 目录（去重、只留看起来像的）。
 * @returns {Promise<Array<{dir:string, source:string}>>}
 */
export async function locateSnowLumaHomes({ config = {}, env = process.env, wsPort, platform = process.platform, home } = {}) {
  const out = [];
  const seen = new Set();
  const add = (dir, source) => {
    if (!dir) return;
    const resolved = path.resolve(String(dir));
    const key = platform === 'win32' ? resolved.toLowerCase() : resolved;
    if (seen.has(key) || !looksLikeSnowLuma(resolved)) return;
    seen.add(key);
    out.push({ dir: resolved, source });
  };
  add(config.snowluma?.homeDir, 'config.json snowluma.homeDir');
  add(config.orchestrator?.snowDir, 'config.json orchestrator.snowDir');
  add(env.SNOWLUMA_HOME, 'SNOWLUMA_HOME');
  add(env.SNOW_DIR, 'SNOW_DIR');
  for (const proc of await processChainForPort(wsPort, { platform })) {
    for (const dir of dirsFromProcess(proc)) add(dir, `进程 PID ${proc.pid}`);
  }
  add(findSnowLumaDir({ platform, env, ...(home ? { home } : {}) }), '常见安装位置');
  return out;
}

/**
 * 试一次 OneBot WebSocket：能 open 就算通（SnowLuma 用 ?access_token= 鉴权，与 @snowluma/sdk 一致）。
 * @returns {Promise<{ok:boolean, error?:string}>}
 */
export function probeOneBotWs(wsUrl, token, { timeoutMs = 4000 } = {}) {
  return new Promise((resolve) => {
    let socket;
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { socket?.close(); } catch { /* 已关 */ }
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, error: 'timeout' }), timeoutMs);
    try {
      const url = new URL(wsUrl);
      if (token) url.searchParams.set('access_token', token);
      socket = new WebSocket(url);
      socket.addEventListener('open', () => finish({ ok: true }));
      socket.addEventListener('error', () => finish({ ok: false, error: 'rejected' }));
      socket.addEventListener('close', (event) => finish({ ok: false, error: `closed ${event.code}` }));
    } catch (error) {
      finish({ ok: false, error: error?.message ?? String(error) });
    }
  });
}
