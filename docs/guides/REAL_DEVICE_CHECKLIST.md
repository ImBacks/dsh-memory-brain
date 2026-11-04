# 真机复现清单（v0.5.0 Linux / Windows 合并）

CI 和无界面探测能证明的都已经证明了。下面这些**只有真机才能下结论**，按优先级排。结论写回这份文件。

## 1. Windows 桌面版「preset 行不注册」（用户反馈，未复现）

**反馈原文的结论是推测**（「很可能是桌面版这次更新改了注册机制」）。已核对的事实：

| 核对项 | 结果 |
| --- | --- |
| DSH 源码 `rc.3 → rc.5 → 0.2.2-alpha.3`：`packages/preset/agent-preset/src` | 没有改动，注册机制没变 |
| npm 版 `dsh web`：rc.5、0.2.2-alpha.3（全新 profile，隔离 HOME） | `qq-chat` / `qq-chat-v2` 都注册上，能建会话 |
| 桌面版 rc.5 的真实 Host（macOS，无界面按 main 进程的参数拉起，全新 profile） | 同上 |
| 官方 Windows 安装包 `dsh-latest-windows-x64.exe`（0.2.1-rc.5，CI `dsh-desktop-windows`，静默安装后按 main 进程的方式拉起 Host，全新 profile） | 同上：`agentPresets/list` 有 `qq-chat`、`qq-chat-v2`，`session/create` 成功 |

所以在全新 profile 上**没有复现**，怀疑点不在注册机制，而在**反馈用户那台机器的 profile 状态**（升级过来的旧 profile、用过恢复、挪过目录）。CI 没有覆盖的是：带旧 profile 升级、真正打开 Electron 窗口。真机上按顺序查：

1. 运行 `start-all.bat`，看新增的这一行：`DSH 已注册 QQ 预设` 还是 `DSH 里没有 QQ 预设（缺 …）`。没注册时它会接着打印磁盘诊断，把整段发回来，还有 `%USERPROFILE%\.ai-companion-run\start-all.log`。
2. 桌面版**「恢复 / 禁用所有插件」**会把第三方 bundle 从 `profiles\desktop\package.json` 摘掉、把 `cordis.patch.yml` 改名成 `.bak-*`（源码 `sanitizeProfile`）。看 `dsh.profile.bundles` 里还有没有 `qq-agent-presets`。
3. `profiles\desktop\node_modules\qq-agent-presets` 这个 junction 还在不在、指向的目录还在不在（用户挪过项目目录时会断）。
4. 桌面版启动日志里有没有 `disabling profile plugin` / `skipped`：DSH 会跳过声明了不兼容 dsh 版本的插件。
5. `setup-dsh` 输出里 `dsh plugin --profile desktop install` 是否 OK（`%USERPROFILE%\.ai-companion-run\setup-dsh.log`）。

## 2. Windows 双击 `start-all.bat` 闪退

已定位并修复的原因：旧 `.bat` 在括号块里 `echo %cmdcmdline%`，目录名带 `)`（重复下载的 `xxx (1)`）或 `&` 时是语法错误，cmd.exe 直接关窗口；更早的版本（`b91af1b` 之前）则根本没有 `pause`。CI 在带 `( ) & ! % ^` 空格和中文的目录里按双击方式真跑。

CI 的 runner 是 Windows Server，**没覆盖**这些，真机请确认：

- [ ] 从 zip 解压到桌面，双击：窗口留住、能读到报错
- [ ] 目录名带括号（`dsh-memory-brain (1)`）
- [ ] 用户名是中文的账户
- [ ] Windows Terminal 设为默认终端时
- [ ] 没装 Node：提示去 nodejs.org；Node 18/20：提示版本太旧
- [ ] 还闪退的话：看 `%USERPROFILE%\.ai-companion-run\start-all.log`（有内容说明 Node 跑起来了，是 cmd 之后的问题；没有内容说明 Node 没跑到）

## 3. SnowLuma 2.4.0

静态核对过 `SnowLuma-v2.4.0-linux-x64-lite`：`config/onebot_<uin>.json`、`SNOWLUMA_HOOK_AUTOLOAD`、`launcher.sh` 都还在，本项目读 token、拉起的方式不用改。**没有真注入 QQ 验证过**：

- [ ] Linux QQ 3.2.32 + SnowLuma 2.4.0：注入、登录、收发（线上现在是 2.2.0，升它要重新注入 / 可能扫码，我没动）
- [ ] 更新的 Linux QQ（3.2.34+）现在能不能注入：能的话 README 就不用再钉 3.2.32
- [ ] Windows QQNT + SnowLuma 2.4.0
- [ ] 2.3 起第一次运行要在 WebUI 同意协议（`SNOWLUMA_ACCEPT_EULA` 由使用者本人决定，脚本不替他同意；等待 OneBot 时会提示）
- [ ] `@snowluma/sdk` 还在 1.x（npm 最新 2.4.0）：WS 客户端走标准 OneBot，目前没发现不兼容，要升需要单独改 `patch-snowluma-sdk.mjs`

## 4. macOS（Docker 跑 Linux 容器）

macOS 不做原生适配，README 让用户用 Docker 跑 Linux 容器。项目不提供现成镜像，**这条路没有完整跑过**（QQ 扫码要图形桌面，SnowLuma 要 `SYS_PTRACE`）。有用户跑通后把坑写回 README。

## 6. 记忆服务遗忘的偶发残留

CI 的 macOS job 上出现过一次：`test_forget_key_removes_l2_and_leaves_group_alone` 遗忘后，原始字节扫描仍读到已删摘要。逻辑层的删除断言都过了，Chroma 只存向量和过滤字段。本机整组跑 8 遍、单个用例跑 150 遍都**没复现**，所以残留在哪个文件没有定论。

已做的是加固，不是确证的修复：遗忘后 `VACUUM` 重写整个库（`secure_delete` 不保证页内未分配区域干净）、确认 `wal_checkpoint(TRUNCATE)` 真的截断。如果 Linux / Windows 的 CI 再红，断言信息现在会直接列出含明文的文件。

## 5. 线上 `~/qq-bridge` 还没动

本次改动都在分支上。线上切到这份代码要单独做（`stop-all.sh` 语义没变，但 `start-all.sh` 已是 Node 编排），需要你决定时间，重启前我会再问。

## 7. v0.5.1 还没发布：待修的 CI 偶发失败

**现状**：`v0.5.0` 已发布，但它把 21 个 macOS 元数据文件（`._*`，每个 163 字节，只有 `com.apple.provenance` 属性，没有个人信息，不影响运行）带进了仓库，也没跑通上游带来的 `CI` 工作流。修复都在分支 `release/v0.5.1` 上（程序行为没变，不用重启服务），**还没有合进 `main`，也没打标签**。

**剩下的一个红项（没有修，留给单独的窗口）**

- **现象**：`CI / 离线回归（test:audit）`（`windows-latest`，Node 22）失败，`Audit suite: 56/57`。
- **报错**：`scripts/test-audit-regressions.mjs` 的 `FAIL R17 拆成两条发送的会话令牌同样被拦截 — Error: request hung`。
- **是偶发**：提交 `440e3de` 上同一个 job 是 57/57；之后的 `9b703ff` 只改了 `scripts/ci-dsh-compat.mjs`，这个测试用不到它。至今只见过这一次。
- **日志**：`gh run view 41772778282 -R y083245/dsh-memory-brain`，job `126386090447`。
- **还没查**：`request hung` 是测试 harness 给请求设的超时，还是桥接那边真的没回；R17 这条路径（拆成两条发送的令牌拦截）是上游的代码，合并时 `src/bridge.js` 这一带有过冲突。它拦不拦得住令牌关系到安全，不要只靠重跑过关。

**修完后的发布步骤**

1. `release/v0.5.1` 上 **`CI` 和 `test` 两条工作流都要绿**（别只看 `test`，v0.5.0 就是这样漏的）。
2. `main` 和 `windows-native` 快进到同一提交，打附注标签 `v0.5.1`，建 GitHub Release，删掉 `release/v0.5.1`。
3. 推之前确认 `git ls-files | grep -E '(^|/)\._'` 为空。在 Mac 上打包传文件要设 `COPYFILE_DISABLE=1`。
