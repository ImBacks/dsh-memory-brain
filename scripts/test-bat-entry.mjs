#!/usr/bin/env node
// 一键入口（.bat / .sh）的回归：它们必须保持薄、纯 ASCII + CRLF，并且在 Windows 上真跑一遍，
// 尤其是路径里带 ( ) & ! % 空格 中文、模拟资源管理器双击（cmd /c ""…bat" "）的情况。
// 背景：旧版 start-all.bat 在括号块里展开 %cmdcmdline%，目录名带 ")"（比如重复下载的「xxx (1)」）
// 就是语法错误，cmd.exe 直接关窗口，用户只看到闪退。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkNodeVersion, mirrorOutputToLog } from './lib/entry-guard.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRIES = ['start-all', 'stop-all', 'update', 'rollback'];
let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log(`PASS ${name}`); } catch (error) { failed += 1; console.log(`FAIL ${name}\n  ${error?.stack ?? error}`); }
}

await test('.bat 全部是纯 ASCII + CRLF，并且只转发到 Node', () => {
  for (const name of ENTRIES) {
    const buf = fs.readFileSync(path.join(ROOT, `${name}.bat`));
    assert.equal([...buf].filter((b) => b > 127).length, 0, `${name}.bat 必须纯 ASCII`);
    const text = buf.toString('latin1');
    assert.equal(text.match(/(?<!\r)\n/g)?.length ?? 0, 0, `${name}.bat 必须 CRLF`);
    assert.ok(text.includes(`scripts\\${name}.mjs`), `${name}.bat 必须转发到 scripts\\${name}.mjs`);
    assert.ok(text.split('\r\n').length < 45, `${name}.bat 要保持薄`);
  }
});

await test('.bat 不在括号块里展开用户路径（闪退回归）', () => {
  for (const name of ENTRIES) {
    const lines = fs.readFileSync(path.join(ROOT, `${name}.bat`), 'latin1').split('\r\n').filter((l) => !/^rem /i.test(l));
    assert.ok(!lines.some((l) => /\(\s*$/.test(l)), `${name}.bat 不能有多行括号块`);
    assert.ok(!lines.some((l) => /^echo %cmdcmdline%/i.test(l)), `${name}.bat 不能 echo %cmdcmdline%`);
    assert.ok(lines.some((l) => /setlocal DisableDelayedExpansion/i.test(l)), `${name}.bat 要关掉延迟展开（路径里可能有 !）`);
  }
});

await test('.sh 入口都是薄转发（不超过 12 行，exec node …mjs）', () => {
  for (const file of ['start-all.sh', 'stop-all.sh', 'scripts/update.sh', 'scripts/rollback.sh']) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(text.split('\n').length <= 12, `${file} 要保持薄`);
    assert.match(text, /exec node .*\.mjs/, `${file} 要转发到 Node`);
    assert.ok(!text.includes('\r'), `${file} 必须 LF`);
  }
});

await test('entry-guard：Node 版本门槛', () => {
  const lines = [];
  assert.equal(checkNodeVersion('24.0.0', (l) => lines.push(l)), true);
  assert.equal(checkNodeVersion('22.13.0', (l) => lines.push(l)), true);
  assert.equal(lines.length, 0);
  assert.equal(checkNodeVersion('22.12.9', (l) => lines.push(l)), false);
  assert.equal(checkNodeVersion('18.20.4', (l) => lines.push(l)), false);
  assert.ok(lines.some((l) => l.includes('nodejs.org')));
});

await test('entry-guard：输出另存到 ~/.ai-companion-run/<name>.log，且不影响原输出', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'qqb-entry-log-'));
  const got = [];
  const stream = { write: (chunk) => { got.push(String(chunk)); return true; } };
  mirrorOutputToLog('start-all', { home, stdout: stream, stderr: stream });
  stream.write('你好\n');
  assert.deepEqual(got, ['你好\n']);
  assert.ok(fs.readFileSync(path.join(home, '.ai-companion-run', 'start-all.log'), 'utf8').includes('你好'));
});

if (process.platform === 'win32') {
  // 真跑：把 .bat 和一个替身 mjs 放进各种奇怪目录，模拟双击（cmd /c ""…bat" "），stdin 给回车让 pause 过去。
  const DIRS = ['plain', 'a b', 'dup (1)', 'R&D', 'bang!', 'pct%20x', '中文 目录 (2)', 'x^y', 'a,b;c=d'];
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'qqb-bat-'));
  const prepare = (dirName, name, exit) => {
    const dir = path.join(base, `${name}-${exit}`, dirName);
    fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, `${name}.bat`), path.join(dir, `${name}.bat`));
    fs.writeFileSync(path.join(dir, 'scripts', `${name}.mjs`), `console.log('STUB-RAN', JSON.stringify(process.argv.slice(2)));\nprocess.exitCode = ${exit};\n`);
    return path.join(dir, `${name}.bat`);
  };
  const doubleClick = (bat, env = {}) => spawnSync(process.env.ComSpec || 'cmd.exe', ['/c', `""${bat}" "`], {
    input: '\r\n', encoding: 'utf8', windowsVerbatimArguments: true, timeout: 60000,
    env: { ...process.env, QQB_NO_PAUSE: '', ...env }
  });
  for (const dirName of DIRS) {
    await test(`双击 start-all.bat：目录「${dirName}」成功路径跑到底、退出码 0、会 pause`, () => {
      const r = doubleClick(prepare(dirName, 'start-all', 0));
      assert.match(r.stdout, /STUB-RAN/, `替身没跑到：${r.stdout}\n${r.stderr}`);
      assert.match(r.stdout, /press any key|按任意键|请按/i, `双击时必须 pause：${r.stdout}`);
      assert.equal(r.status, 0, r.stderr);
    });
    await test(`双击 start-all.bat：目录「${dirName}」失败路径打印 FAILED、传回退出码`, () => {
      const r = doubleClick(prepare(dirName, 'start-all', 7));
      assert.match(r.stdout, /STUB-RAN/);
      assert.match(r.stdout, /\[start-all\] FAILED/);
      assert.equal(r.status, 7);
    });
  }
  await test('QQB_NO_PAUSE=1 不 pause', () => {
    const r = doubleClick(prepare('nopause', 'start-all', 0), { QQB_NO_PAUSE: '1' });
    assert.doesNotMatch(r.stdout, /press any key|按任意键|请按/i);
    assert.equal(r.status, 0);
  });
  await test('在已打开的控制台里运行（cmdcmdline 不含脚本名）不 pause', () => {
    const bat = prepare('console', 'start-all', 0);
    const r = spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', `call "${bat}"`], { encoding: 'utf8', input: '', timeout: 60000, windowsVerbatimArguments: true, env: { ...process.env, QQB_NO_PAUSE: '' } });
    assert.match(r.stdout, /STUB-RAN/);
    assert.equal(r.status, 0);
  });
  await test('只把 .bat 从压缩包里拖出来（没有 scripts\\）：说清楚要先解压，不闪退', () => {
    const dir = path.join(base, 'lonely');
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'start-all.bat'), path.join(dir, 'start-all.bat'));
    const r = doubleClick(path.join(dir, 'start-all.bat'));
    assert.match(r.stdout, /Extract the whole zip/);
    assert.equal(r.status, 1);
  });
  await test('参数原样转发', () => {
    const r = spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', `call "${prepare('args', 'start-all', 0)}" --web --rag`], { encoding: 'utf8', timeout: 60000, windowsVerbatimArguments: true, env: { ...process.env, QQB_NO_PAUSE: '1' } });
    assert.match(r.stdout, /STUB-RAN \["--web","--rag"\]/);
  });
} else {
  console.log('SKIP 真跑 .bat 只在 Windows 上做');
}

console.log(failed ? `FAILED ${failed}` : 'OK');
process.exitCode = failed ? 1 : 0;
