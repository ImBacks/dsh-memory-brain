# 老用户升级 —— 给 AI 的操作手册

> 目标读者：**代替用户把已经装好的本项目升级到最新版的 AI**（Linux、Windows 都适用）。全新安装不看这份，看 [README](../../README.md) 或 [Windows 部署手册](WINDOWS_AI_DEPLOY.md)。
>
> 为什么老用户要走这份手册：2026-11-04 仓库整理过一次提交历史，文件内容没变，但提交号和标签都变了。v0.5.1 及更早的 `update.sh` 跟不上，直接运行会报「连不上 origin」，这不是网络问题。

---

## 0. 不可越过的约定

1. **她的记忆在 `state/`，配置在 `config.json`。** 没有用户确认，不删除、不覆盖这两样，也不删旧目录。
2. **不读、不输出隐私内容。** `state/` 里的聊天记录和账本、`config.json` 里的令牌、`~/.dsh/.credentials.yaml`，只看文件名、数量和大小，不贴进对话。
3. **不要运行 `git pull`、`git merge origin/main`、`git rebase`。** 旧 clone 和新历史对不上，这些命令会报错，或者把旧历史合回来。
4. **不要 `git push`，也不要提交 `state/`、`config.json`。**
5. **`--yes` 和 `git reset --hard` 要先得到用户同意。** `--yes` 会自动同意备份后的升级、迁移和重启。
6. **不要动 QQ、SnowLuma、DSH 的账号和凭据。**
7. **实际情况和手册对不上，就停下来告诉用户**，不要自己发明命令。目录里有 `docs/design/HANDOFF.md` 的是作者本人的线上目录，不能用本手册，直接停。

动手前告诉用户：升级时她会短暂下线；开始前先把查到的情况和要走的路线说清楚，等用户确认。

---

## 1. 只读检查

先问用户或自己找到项目目录（里面有 `src/bridge.js`），在该目录执行。下面的命令 Linux、Windows 通用，也都不改任何东西。

Linux 上如果用 nvm，先在同一个 shell 里加载，否则可能拿到系统 node：

```bash
. ~/.nvm/nvm.sh
```

```text
node -v
node -p "require('./package.json').version"
git rev-parse --is-inside-work-tree
git remote get-url origin
git branch --show-current
git status --short
```

Node 要 `>= 22.13`，建议 24。太旧先让用户升级 Node，不要继续。

记下 `state/` 现在有多少文件，升级后要对比：

```text
node -e "const fs=require('fs'),p=require('path');let n=0,b=0;const w=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=p.join(d,e.name);if(e.isDirectory())w(f);else if(e.isFile()){n++;b+=fs.statSync(f).size}}};w('state');console.log(n+' files, '+b+' bytes')"
```

**按结果选路线：**

| 查到的情况 | 路线 |
|---|---|
| `git rev-parse` 报错、目录里没有 `.git`（下载 ZIP 安装的） | §3 |
| `origin` 是 `y083245/dsh-memory-brain`，版本 `>= 0.5.2` | §2，跳过第 1 步 |
| `origin` 是 `y083245/dsh-memory-brain`，版本更早 | §2 |
| `origin` 是别的仓库（上游 `Derpyu520/qq-bridge`、用户自己的 fork） | 停下问用户：本手册只管 `y083245/dsh-memory-brain` 的安装 |
| 其它命令报错，或看不懂结果 | 停下问用户 |

---

## 2. 路线 A：用 git 安装的（原地升级）

在项目目录执行。第 1～2 步不改用户数据，也不重启服务。

**第 1 步：取新版升级脚本。** 只需要这一次。

```text
git fetch origin
git checkout origin/main -- scripts/update.sh scripts/update.mjs scripts/lib/upgrade-common.mjs
```

**第 2 步：预演，把计划给用户看。**

```text
node scripts/update.mjs --dry-run
```

正常时会看到「当前」「目标」两个版本、「仓库整理过提交历史」（版本比 v0.5.2 旧才有）、要重启哪些服务。退出码 0 就继续。

- 输出「本地有自己的提交」：走下面的「有自己的提交」。
- 第 6 步提示 `sidecars/memory-rag/uv.lock` 未跟踪：这是 `uv` 生成的文件，删掉它再重新预演。
- 第 6 步列出其它没法自动处理的改动：把**文件清单**给用户，由用户决定另存还是放弃，不要自己丢弃。角色卡、仿真提示词、memory-rag 参数脚本会自动挪进 `state/` 覆盖层，不用管。

**第 3 步：用户确认后，正式升级。**

```text
node scripts/update.mjs --yes
```

脚本会先把 `state/`、`config.json` 备份到 `~/qq-bridge-backups/`，再升级、装依赖、重启受影响的服务。

| 退出码 | 意思 | 怎么办 |
|---|---|---|
| 0 | 完成。看到「升级完成（部分）」说明 QQ 或 SnowLuma 没在跑，有服务没重启 | 等用户开好 QQ，运行 `node scripts/start-all.mjs` |
| 1 | 检查没通过，代码没改 | 把提示转告用户 |
| 2 | 中途失败或健康检查没过 | 看 §5 回滚 |
| 3 | 被取消，代码没改 | 确认用户的意思 |

**第 4 步：如果第 1 节查到的分支不是 `main`**（比如 `windows-native`，或显示为空的游离状态），切回来：

```text
git switch -C main origin/main
```

然后去 §4 验证。

### 有自己的提交

本地改过代码并提交过时，脚本会拒绝升级。**这几步要改动本地分支，每一步都先和用户确认。**

1. 看最近的提交，和用户一起认出哪些是他自己的。下面的 `<提交号>` 就是这些。

   ```text
   git log --oneline -15
   ```

2. 存一份，再回到他原来的版本（`<旧版本>` 是第 1 节查到的版本号，前面加 `v`，比如 `v0.4.0`）。`state/`、`config.json` 不受影响。

   ```text
   git branch my-commits-backup
   git fetch origin --force --tags
   git reset --hard <旧版本>
   ```

3. 回到上面的第 1 步，走完路线 A。
4. 升级成功后把他的提交放回来，从旧到新。有冲突就停下问用户，不要自己决定怎么解。

   ```text
   git cherry-pick <提交号>
   ```

---

## 3. 路线 B：下载 ZIP 安装的

ZIP 没有 `.git`，升级脚本用不了。做法是把它转成 git 安装：clone 一份，切到用户原来的版本，放回数据，再跑正式的升级脚本。备份和迁移都由脚本完成，以后也能直接用脚本升级。

没装 git 就先让用户装。下面用 `<旧目录>` 表示用户现在的目录，`<版本>` 表示第 1 节查到的版本号。

**第 1 步：用户确认后停服务。** 在旧目录执行。Windows 用 `stop-all.bat --all`（QQ、SnowLuma 保留）；Linux 用 `./stop-all.sh --all`，它会连 QQ 一起停，之后可能要重新扫码，先告诉用户。

**第 2 步：把旧目录改名为备份，不要删。** 比如 `qq-bridge` 改成 `qq-bridge-old`。下面的 `<备份目录>` 指它。新目录必须用回**原来的路径**：DSH 配置和 systemd 服务里写的是绝对路径。

**第 3 步：在原来的位置 clone，切到用户原来的版本。** 标签从 `v0.3.0` 起才有；`<版本>` 没有对应标签时，用不高于它的最近一个标签（`git tag -l "v*"` 可以看）。

```text
git clone https://github.com/y083245/dsh-memory-brain.git <旧目录>
cd <旧目录>
git checkout --detach v<版本>
git checkout origin/main -- scripts/update.sh scripts/update.mjs scripts/lib/upgrade-common.mjs
npm ci --no-audit --no-fund
```

**第 4 步：把用户的东西放回来。** 不存在的项会跳过。在新目录执行。

```text
node -e "const fs=require('fs'),p=require('path');const o=process.argv[1];for(const x of ['state','config.json','voice-config.json','audio','sidecars/memory-rag/.venv','roles','dsh/agent-presets','sidecars/memory-rag/config.yml']){const s=p.join(o,x);if(fs.existsSync(s)){fs.cpSync(s,x,{recursive:true,force:true,verbatimSymlinks:true,preserveTimestamps:true});console.log('copied',x)}}" "<备份目录>"
```

用 §1 的命令核对 `state/` 的文件数和备份目录一致（把命令里的 `'state'` 换成备份目录下的 `state`）。不一致就停下。

**第 5 步：看有哪些用户改动。**

```text
git status --short
node scripts/update.mjs --dry-run
```

`git status` 列出的，是用户改过的角色卡、提示词和参数，脚本会挪进 `state/` 覆盖层。把清单给用户确认。如果列出一大堆，多半是 `<版本>` 选错了，或者 ZIP 不是那个标签打的包：停下告诉用户。

**第 6 步：正式升级，再切回 `main`。** 退出码的含义同路线 A。服务已经停了，脚本可能说有服务没重启，这是正常的。

```text
node scripts/update.mjs --yes
git switch -C main origin/main
```

**第 7 步：启动。** QQ 和 SnowLuma 要在运行（Windows 由用户自己开；Linux 脚本会拉起 QQ，可能要扫码）。

```text
node scripts/start-all.mjs
```

它可能要问是否重启 DSH。AI 的 shell 不是终端，答不了：用户同意后，先把环境变量 `QQB_ASSUME_YES` 设成 `1` 再运行。

然后去 §4 验证。**旧目录先留着**，等用户用几天没问题，由用户自己决定删不删。

---

## 4. 验证

全部在新版目录执行。

**版本和代码：**

```text
node -p "require('./package.json').version"
git status --short
```

版本应该是最新版，`git status` 应该是空的。如果只多出 `sidecars/memory-rag/uv.lock`，把它删掉，否则下次升级会被它拦住。

**记忆还在：** 跑 §1 统计 `state/` 的命令，和升级前对比。文件数只应该相同或变多（升级会加 `upgrade.json` 这类记录）。变少就停下告诉用户，备份还在。

**服务连通：** 不会打印令牌。

```text
node -e "const fs=require('fs');const t=fs.readFileSync('state/console-token','utf8').trim();fetch('http://127.0.0.1:3100/api/status',{headers:{'x-console-token':t}}).then(r=>r.json()).then(j=>console.log(j.dshReady,j.snowluma))"
```

应该看到 `true { connected: true, accountOnline: true, good: true }`。

**真实回复：** 请用户用管理员 QQ 给机器人发一句私聊，确认她回复了，再问一件她该记得的事。日志在 `~/.ai-companion-run/bridge.log`（Windows 是 `%USERPROFILE%\.ai-companion-run\bridge.log`），只看报错行，不要把聊天内容贴出来。

---

## 5. 出问题时

**路线 A 回滚：** 回到升级前的提交，并用备份还原 `state/`、`config.json`。还原前会再存一份当前数据。

```text
node scripts/rollback.mjs --yes
```

**路线 B 回滚：** 停掉新目录的服务（`node scripts/stop-all.mjs --all`），把新目录改名，把备份目录改回原来的名字，再按用户原来的方式启动。

| 现象 | 处理 |
|---|---|
| 「连不上 origin」 | 跑的还是旧脚本，回到 §2 第 1 步。第 1 步的 `git fetch origin` 也失败才是网络问题 |
| 「本地有自己的提交」 | §2 的「有自己的提交」 |
| 她回「agent 处理出错」 | DSH 没配好密钥或余额不足，让用户看 DSH 的「模型」页 |
| 她不调工具、不回消息 | 重启一次 DSH 再看；还不行就在新目录运行 `node scripts/setup-dsh.mjs`，再重启 DSH |
| 向量记忆起不来 | 检索会退回关键词，记忆不丢。`sidecars/memory-rag/.venv` 不能用就重建，见 [README](../../README.md) 或 [Windows 手册](WINDOWS_AI_DEPLOY.md) 的 RAG 一节 |

---

## 6. 结束时告诉用户

- 从哪个版本升到哪个版本，走的哪条路线。
- 备份在哪：`~/qq-bridge-backups/` 里的文件名；路线 B 还有备份目录。备份里有聊天原文，不需要时可以删。
- `state/` 文件数对比，和 §4 各项的结果。没验证的如实说。
- 以后升级：Linux 运行 `bash scripts/update.sh`，Windows 运行 `update.bat`。
