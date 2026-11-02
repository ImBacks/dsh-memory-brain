// 外部命令定位 —— 只负责「找到可执行文件」，不负责启动。
//
// Windows 的 npm / pnpm / dsh 入口通常是 .cmd 垫片，Node 的 spawn 不能直接执行 .cmd
// （没有 shell 会 EINVAL）。这里优先把垫片里的 JS 入口解析出来，用 process.execPath
// 直接跑；解析不出来才退回 cmd.exe（固定参数、不拼用户输入）。
import fs from 'node:fs';
import path from 'node:path';

function isFile(file, fsImpl = fs) {
  try { return fsImpl.statSync(file).isFile(); } catch { return false; }
}

function pathValue(env) {
  return env?.PATH ?? env?.Path ?? env?.path ?? '';
}

/** 在 PATH 里找命令（Windows 按 PATHEXT 补扩展名）。找不到返回 null。 */
export function findExecutable(name, { env = process.env, platform = process.platform, fsImpl = fs } = {}) {
  const raw = String(name ?? '').trim();
  if (!raw) return null;
  if (path.isAbsolute(raw)) return isFile(raw, fsImpl) ? raw : null;
  const exts = platform === 'win32'
    ? (path.extname(raw) ? [''] : String(env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean))
    : [''];
  for (const dir of pathValue(env).split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = path.join(dir, raw + ext);
      if (isFile(candidate, fsImpl)) return candidate;
    }
  }
  return null;
}

/**
 * 从 npm / corepack 生成的 .cmd 垫片里解析真正的 JS 入口。
 *
 * 典型垫片：
 *   "%_prog%"  "%dp0%\node_modules\@deepseek-ai\dsh\bin.js" %*
 *   "%~dp0\node_modules\corepack\dist\pnpm.js" %*
 * 只认相对垫片目录的一段路径；解析不到就返回 null（交给 cmd.exe 兜底）。
 */
export function resolveShimScript(shimPath, { fsImpl = fs } = {}) {
  let text;
  try { text = fsImpl.readFileSync(shimPath, 'utf8'); } catch { return null; }
  // Electron 自带的 CLI（例如 DSH 桌面版 dsh.cmd）虽然也以 .js 结尾，
  // 但必须由它自己的 exe + ELECTRON_RUN_AS_NODE 启动；用 process.execPath 跑会缺 Electron 运行时。
  // 这类垫片交给 cmd.exe（下面的 ComSpec 分支）执行。
  if (/ELECTRON_RUN_AS_NODE/i.test(text) || !/(%_prog%|\bnode(?:\.exe)?\b)/i.test(text)) return null;
  const patterns = [
    /%dp0%\\([^"\r\n]+?\.(?:js|cjs|mjs))/i,
    /%~dp0\\([^"\r\n]+?\.(?:js|cjs|mjs))/i,
    /%~dp0\/([^"\r\n]+?\.(?:js|cjs|mjs))/i
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const candidate = path.resolve(path.dirname(shimPath), match[1].replace(/\\/g, '/'));
    if (isFile(candidate, fsImpl)) return candidate;
  }
  return null;
}

/**
 * 解析 Electron 自带 CLI 的 .cmd 垫片（DSH 桌面版的 dsh.cmd）：
 *
 *   set "ELECTRON_RUN_AS_NODE=1"
 *   "%~dp0..\..\..\..\DeepSeek Harness.exe" --expose-internals "%~dp0..\..\..\app.asar\dsh\...\cli.js" %*
 *
 * 直接用 exe + 参数数组 + ELECTRON_RUN_AS_NODE=1 启动，完全绕开 cmd.exe：
 * 装在 Program Files 这类带空格的目录里也不受 cmd 引号规则影响。
 * 解析不了就返回 null（交给 cmd.exe 兜底）。
 */
export function resolveElectronShim(shimPath, { fsImpl = fs } = {}) {
  let text;
  try { text = fsImpl.readFileSync(shimPath, 'utf8'); } catch { return null; }
  if (!/ELECTRON_RUN_AS_NODE\s*=\s*1/i.test(text)) return null;
  const line = text.split(/\r?\n/).map((l) => l.trim()).find((l) => /%\*\s*$/.test(l) && /\.exe"?\s/i.test(l));
  if (!line) return null;
  const tokens = [...line.replace(/%\*\s*$/, '').matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2]);
  if (!tokens.length) return null;
  const dir = `${path.win32.dirname(shimPath)}\\`;
  const expand = (token) => token.replace(/%~dp0/gi, () => dir);
  const exe = path.win32.resolve(expand(tokens[0]));
  if (!/\.exe$/i.test(exe) || !isFile(exe, fsImpl)) return null;
  const args = tokens.slice(1).map((token) => (/%~dp0/i.test(token) ? path.win32.resolve(expand(token)) : token));
  if (args.some((arg) => arg.includes('%'))) return null;
  return { command: exe, args, env: { ELECTRON_RUN_AS_NODE: '1' } };
}

/** cmd.exe 的保守引用：只在有空白/特殊字符时加引号；路径里的 `"` 直接拒绝。 */
function quoteForCmd(value) {
  const s = String(value);
  if (/["\r\n]/.test(s)) throw new Error(`命令参数里不能有双引号或换行：${JSON.stringify(s)}`);
  if (!/[\s&|<>^()]/.test(s)) return s;
  return `"${s}"`;
}

/**
 * 把「命令 + 参数数组」变成 spawn/execFile 能直接用的形态。
 *
 * 调用方启动时必须把返回的 `env`（若有）合并进子进程环境。
 * @returns {{command:string,args:string[],env?:object,windowsVerbatimArguments?:boolean,resolved?:string,via?:string}}
 */
export function commandSpec(command, args = [], {
  env = process.env,
  platform = process.platform,
  fsImpl = fs,
  nodeBin = process.execPath
} = {}) {
  const raw = String(command ?? '').trim();
  if (!raw) throw new Error('命令为空');
  const resolved = path.isAbsolute(raw) ? raw : (findExecutable(raw, { env, platform, fsImpl }) || raw);
  if (platform === 'win32' && /\.(cmd|bat)$/i.test(resolved)) {
    const electron = resolveElectronShim(resolved, { fsImpl });
    if (electron) {
      return { command: electron.command, args: [...electron.args, ...args], env: electron.env, resolved, via: 'electron-shim' };
    }
    const shimScript = resolveShimScript(resolved, { fsImpl });
    const node = findExecutable(nodeBin, { env, platform, fsImpl }) || (isFile(nodeBin, fsImpl) ? nodeBin : null);
    if (shimScript && node) {
      return { command: node, args: [shimScript, ...args], resolved, via: 'node-shim' };
    }
    const comspec = env.ComSpec || env.COMSPEC || 'cmd.exe';
    // `cmd /s /c` 会剥掉整行**首尾**各一个引号：只给参数加引号时，带空格的垫片路径
    // （"…\Program Files\…\dsh.cmd" web）首尾引号被剥掉后在空格处截断。所以整行再包一层引号。
    const line = `"${[resolved, ...args].map(quoteForCmd).join(' ')}"`;
    return {
      command: comspec,
      args: ['/d', '/v:off', '/s', '/c', line],
      windowsVerbatimArguments: true,
      resolved,
      via: 'cmd-shim'
    };
  }
  return { command: resolved, args: [...args], resolved, via: resolved === raw ? 'direct' : 'path' };
}

/** 子进程的可读展示（日志用）。 */
export function describeCommand(spec) {
  const parts = [spec.command, ...(spec.args ?? [])].map((part) => {
    const s = String(part);
    return /\s/.test(s) ? JSON.stringify(s) : s;
  });
  return parts.join(' ');
}
