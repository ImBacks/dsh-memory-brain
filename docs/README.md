# 文档索引

> 本索引优先列出**已入库、可在公开仓库阅读**的文档。根目录主要保留 `README.md`、`README.en.md`、
> `RULES.md`；GitHub 社区健康文件与许可文件按惯例也放在根目录或 `.github/`，包括 `LICENSE`、
> `NOTICE.md`、`SECURITY.md` 和 `CONTRIBUTING.md`。
>
> 状态标记：✅ 当前使用说明 · 🗄️ 带日期的历史记录（用于追溯，不代表当前实现或最新验证结果）。
> 仓库目录结构与 `scripts/` 命名约定见 [FOLDER_MAP.md](FOLDER_MAP.md)。
>
> **术语边界**：文中出现的 `[Hook]`、原生组件、逐字节比对、运行时源码等，均指 SnowLuma 行为或其观测记录；qq-bridge 不注入、不挂钩、不修改 SnowLuma 本体。

## 安装、使用与运维

| 文档 | 内容 | 状态 |
| --- | --- | --- |
| [guides/PROJECT_GUIDE.md](guides/PROJECT_GUIDE.md) | **权威项目说明书**（113 KB / 1450+ 行）：架构、内外核划分、数据流、配置全解、安全机制、调试与改进指南，含 2026-08-20 ~ 2026-09-11 的逐轮更新记录 | ✅ **唯一权威版本**（另一份同名精简版已归档到 legacy，见下） |
| [../README.md](../README.md) | **主页：项目特点 + 一步一步的部署教程**（第一次部署从这里开始） | ✅ |
| [FORK_FEATURES.md](FORK_FEATURES.md) | 本分支新增功能详解：长期记忆、向量记忆、人格与情绪、记忆代谢、主动想起、联想、账本建议、每日报表 | ✅ |
| [guides/FULL_GUIDE.md](guides/FULL_GUIDE.md) | 完整说明（原主页 README）：配置项全表、运行模式、控制台功能、运维、已知行为、上游版本适配说明 | ✅ |
| [guides/REAL_DEVICE_CHECKLIST.md](guides/REAL_DEVICE_CHECKLIST.md) | **真机复现清单**：CI 证明不了、要在真机上确认的事项（桌面版预设、闪退、SnowLuma 2.4.0、macOS） | ✅ |
| [../README.windows.md](../README.windows.md) | **Windows 原生（非 WSL）简版安装部署**：DSH / QQNT / SnowLuma / 一键脚本 / RAG | ✅ |
| [guides/WINDOWS_AI_DEPLOY.md](guides/WINDOWS_AI_DEPLOY.md) | **给 AI 的 Windows 部署手册**：前置检查、精确命令、provider 探测、SnowLuma 挂载、RAG、验证清单、已知 Windows 坑 | ✅ |
| [guides/DSH_SETUP.md](guides/DSH_SETUP.md) | DSH 端安装说明：`qq-chat` / `qq-chat-v2` preset 与三个 MCP server 怎么挂到目标设备的 DSH 上 | ✅ |
| [guides/VOICE.md](guides/VOICE.md) | 语音发送全解：独立工具（`voice-tool/` 的图形界面与命令行）、桥接 CLI、AI 工具、控制台面板，以及**工具拆出后的配置解析顺序** | ✅ 2026 整理时已更新（工具移到上一级 `voice-tool/`） |
| [guides/TOKEN_USAGE_CONSOLE.md](guides/TOKEN_USAGE_CONSOLE.md) | 控制台「令牌与花费」看板：数据来源、计价口径（峰谷分时）、API、配置 | ✅ |
| [guides/CONSOLE-UI-TESTING.md](guides/CONSOLE-UI-TESTING.md) | 控制台离线预览（`npm run preview:console`）与离线浏览器回归（`npm run test:console-ui`）怎么用 | ✅ 2026 整理时自 `scripts/` 移入 |
| [guides/SECURITY_BASELINE.md](guides/SECURITY_BASELINE.md) | **安全基线与威胁模型**：威胁主体、已实现的边界（准入/工具面/出站/控制台/落盘/网络）、已知残余风险、发布前回归清单、改动检查单 | ✅ **改动安全相关代码前必读**（2026-09-20 新增） |
| [DSH 安装指南](guides/DSH_SETUP.md) | 兼容范围、依赖安装、DSH 插件与 preset、启动验证和常见故障排查 | ✅ |
| [权限与安全规则](../RULES.md) | 四种模式、权限分层、人格与仿真提示词、黑话学习和管理命令 | ✅ |
| [控制台「令牌与花费」看板](guides/TOKEN_USAGE_CONSOLE.md) | 用量来源、计价口径、API、配置和存储 | ✅ |
| [控制台离线预览与回归](guides/CONSOLE-UI-TESTING.md) | `npm run preview:console`、`npm run test:console-ui` 与基线维护 | ✅ |
| [发布前隐私检查](guides/PRIVACY.md) | 工作树与历史扫描、命中判读、CI 用法及历史扫描存档 | ✅ |
| [安全基线与威胁模型](guides/SECURITY_BASELINE.md) | 已实现的安全边界、残余风险、发布检查和改动检查单 | ✅ |
| [第三方组件与数据传输说明](../NOTICE.md) | 著作权、许可、第三方组件、独立关系、主要网络出口和使用风险 | ✅ |
| [安全报告策略](../SECURITY.md) | 私密漏洞报告渠道、支持范围与部署侧要求 | ✅ |
| [参与贡献](../CONTRIBUTING.md) | 环境、测试、PR 和分支协作方式 | ✅ |

## 当前工程记录

| 文档 | 内容 | 状态 |
| --- | --- | --- |
| [DSH 0.2.1 适配记录](guides/DSH_021_ADAPTATION.md) | DSH 0.2.1-rc.2 适配证据、失效提示词变量与工具守卫 | 🗄️ 2026-10-22，对应 `v0.2.1-r1` |
| [2026-10-31 仓库体检](guides/AUDIT_2026-10-31.md) | 会话资料隔离、发送撤权、网络与路径边界、依赖和历史隐私扫描 | 🗄️ 2026-10-31 |
| [2026-10-31 issues 核查](guides/ISSUE_STATUS_2026-10-31.md) | 当时未关闭 issues 的逐项结论、验证范围与未复现事项 | 🗄️ 2026-10-31 |
| [2026-10-31 Code scanning 核查](guides/CODE_SCANNING_2026-10-31.md) | 当时 14 条告警的风险判断、修复与复扫边界 | 🗄️ 2026-10-31 |

## 历史适配记录

| 文档 | 内容 | 状态 |
| --- | --- | --- |
| [DSH 0.2.0 适配记录](guides/DSH_020_ADAPTATION.md) | DSH 0.2.0-rc.2 适配及后续 `v0.2.0-rN` 发布记录 | 🗄️ 历史资料；当前 DSH 适配说明优先看 0.2.1 记录 |

## 本地未入库资料

以下目录或文件可能存在于维护者的本地工作副本，但被 `.gitignore` 排除，**不属于公开仓库文档**：

- `docs/audits/`、`docs/design/`、`docs/legacy/`、`docs/research/`；
- `docs/guides/PROJECT_GUIDE.md`、`docs/guides/VOICE.md`。

这些资料只用于本地追溯，可能包含旧配置、旧实现或个人信息。`PROJECT_GUIDE.md` 是历史说明书，
不是当前实现的“唯一权威来源”；当前行为以代码、上述入库指南和带日期的验证记录为准。
本地索引如需保留这些条目，应使用纯文本说明，不要给公开读者提供无效链接。

## 按需求查找

| 需求 | 入口 |
| --- | --- |
| 安装、升级或排查连接 | [DSH 安装指南](guides/DSH_SETUP.md) |
| 了解模式、权限与管理命令 | [使用规则](../RULES.md) |
| 修改人格卡 | [人格卡写作规范](../roles/README.md) |
| 查看用量与费用口径 | [用量看板](guides/TOKEN_USAGE_CONSOLE.md) |
| 修改控制台并运行离线回归 | [控制台测试指南](guides/CONSOLE-UI-TESTING.md) |
| 修改安全相关代码 | [安全基线](guides/SECURITY_BASELINE.md) |
| 核查 DSH 版本适配 | [0.2.1 适配记录](guides/DSH_021_ADAPTATION.md) |
| 查找目录或脚本用途 | [FOLDER_MAP](FOLDER_MAP.md) |
| 报告安全问题 | [安全策略](../SECURITY.md) |
