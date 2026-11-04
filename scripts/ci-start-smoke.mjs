#!/usr/bin/env node
// CI：真的跑一遍一键入口。把仓库复制到带括号和空格的目录（不带 node_modules，让入口自己 npm ci），
// Windows 按资源管理器双击的方式调用 start-all.bat。没有 SnowLuma，所以应该走到「等 OneBot」后失败退出，
// 关键是：不闪退、错误信息留得下来、退出码传得回来。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'qqb-smoke-'));
const dir = path.join(base, 'dsh-memory-brain (1)');
fs.cpSync(ROOT, dir, {
  recursive: true,
  filter: (src) => !['.git', 'node_modules', 'state', 'config.json'].includes(path.basename(src))
});

const env = { ...process.env, QQB_ONEBOT_WAIT_SECONDS: '5', QQB_ASSUME_YES: '1' };
const isWin = process.platform === 'win32';
const r = isWin
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/c', `""${path.join(dir, 'start-all.bat')}" "`], { input: '\r\n', encoding: 'utf8', env, windowsVerbatimArguments: true, timeout: 600000 })
  : spawnSync('bash', [path.join(dir, 'start-all.sh')], { input: '', encoding: 'utf8', env, timeout: 600000 });
const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
console.log(out);

const problems = [];
const expect = (cond, what) => { if (!cond) problems.push(what); };
expect(out.includes('把 QQ 预设 / MCP 装进 DSH'), '没有走到安装预设');
expect(/DSH 已注册 QQ 预设/.test(out), 'DSH 里没注册上 QQ 预设');
expect(out.includes('OneBot'), '没有走到等 OneBot');
expect(r.status === 1, `退出码应为 1（没有 SnowLuma），实际 ${r.status}`);
if (isWin) {
  expect(out.includes('[start-all] FAILED'), '失败时 .bat 没有留言');
  expect(/press any key|按任意键|请按/i.test(out), '双击时 .bat 没有 pause');
}
const log = path.join(os.homedir(), '.ai-companion-run', 'start-all.log');
expect(fs.existsSync(log) && fs.readFileSync(log, 'utf8').includes('OneBot'), '启动输出没有另存到 start-all.log');

// 收尾：把刚起的 dsh web 停掉，顺便走一遍 stop-all。
const stop = spawnSync(process.execPath, [path.join(dir, 'scripts', 'stop-all.mjs'), '--all'], { encoding: 'utf8', env, timeout: 120000 });
console.log(stop.stdout);
expect(stop.status === 0, `stop-all 退出码 ${stop.status}`);

for (const p of problems) console.error(`::error::${p}`);
process.exit(problems.length ? 1 : 0);
