// 一键脚本入口共用的两件小事（只用 Node 内置模块，依赖还没装时也要能跑）。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MIN_NODE = [22, 13];
export const MIN_NODE_VERSION = MIN_NODE.join('.');

/** 版本太旧时直接说清楚，别让用户去猜后面某个 import 的报错。 */
export function checkNodeVersion(version = process.versions.node, print = console.error) {
  const [major, minor] = String(version).split('.').map(Number);
  if (major > MIN_NODE[0] || (major === MIN_NODE[0] && minor >= MIN_NODE[1])) return true;
  print(`[fail] 当前 Node.js 是 v${version}，本项目至少要 v${MIN_NODE.join('.')}（建议 24 LTS）`);
  print('  到 https://nodejs.org/ 安装新版，再重新打开窗口运行。');
  return false;
}

/** 把这次运行的输出另存一份：窗口被关掉（或双击闪退）之后，用户还有东西可以发给别人看。 */
export function mirrorOutputToLog(name, { home = os.homedir(), stdout = process.stdout, stderr = process.stderr } = {}) {
  let fd;
  try {
    const dir = path.join(home, '.ai-companion-run');
    fs.mkdirSync(dir, { recursive: true });
    fd = fs.openSync(path.join(dir, `${name}.log`), 'w');
  } catch {
    return null; // 写不了日志不影响启动
  }
  for (const stream of [stdout, stderr]) {
    const write = stream.write.bind(stream);
    stream.write = (chunk, ...rest) => {
      try { fs.writeSync(fd, typeof chunk === 'string' ? chunk : Buffer.from(chunk)); } catch { /* 同上 */ }
      return write(chunk, ...rest);
    };
  }
  return fd;
}
