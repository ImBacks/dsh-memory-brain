# 🐟 BigFatFish · 有长期记忆的 QQ 陪伴 AI

**Brain with External Multi-Layer Memory** —— 让 AI 像一个真实的朋友一样待在你的 QQ 里：记得你说过的事、会慢慢忘、有自己的脾气，还会主动来找你。

基于 [Derpyu520/qq-bridge](https://github.com/Derpyu520/qq-bridge) 改造，大脑用 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)，QQ 收发靠 [SnowLuma](https://github.com/SnowLuma/SnowLuma)。

**中文** | [English](README.en.md)

---

## ✨ 项目特点

| | 能力 | 一句话说明 |
| --- | --- | --- |
| 💬 | **像真人一样聊天** | 不是有问必答的客服：她自己看消息、决定接不接话、什么时候潜水，会发表情、拍一拍、发语音 |
| 📒 | **记得住** | 每个人一本「账本」（喜好、经历、约定），聊天记录永久存档；隔了几周问「上次说想去哪来着」也能翻出来 |
| 🔎 | **语义检索** | 向量 + 关键词混合检索，换个说法也能找到；每段聊天自动提炼成一句话摘要和人物关系 |
| 🌫️ | **会遗忘** | 按「遗忘曲线」算每件事记得多牢，久不提的会淡，再被提起又想起来，像人一样 |
| 🎭 | **有性格和情绪** | 被夸会高兴、被损会嘴硬，对每个人的亲近程度不一样，性格随相处慢慢变化（可先「只观察不生效」） |
| ⏰ | **会主动** | 有「自己的时间」，会忽然想起一件旧事；答应过的约定到期了会主动来提醒 |
| 🧩 | **会联想 & 帮她记事** | 想起一件事时顺着人和事带出相关的另一件；聊完自动整理出「值得记住的事」，由她自己决定记不记 |
| 🖥️ | **可视化控制台** | 浏览器里看她记得什么、心情如何、花了多少钱，开关每个功能；**用到的 API 在「API 管理」一页填完**（含记忆服务的总开关）；还有每日报表 |
| 🧠 | **实时脑图** | 打开一个页面，看她每用到一块记忆，对应的脑区和光点就亮起来，还能回放过去 7 天（[说明](CHANGELOG.md)） |
| 🔒 | **安全、数据在本地** | 白名单才响应、工具白名单、敏感信息拦截；聊天记录和记忆只存在你自己的电脑上 |

新增功能的详细说明见 👉 **[docs/FORK_FEATURES.md](docs/FORK_FEATURES.md)**

---

## 🧭 它是怎么跑起来的

```
你的 QQ 好友 / 群
      │  消息
      ▼
 QQ 客户端（一个 QQ 小号）
      │  SnowLuma 把 QQ 消息转成程序能读的格式（OneBot，:3000 / :3001）
      ▼
 qq-bridge（本项目，:3100 控制台）──── 记忆服务 memory-rag（可选，:8093）
      │                                     └─ embedding：本地显卡 或 云端 API
      ▼
 DeepSeek Harness（DSH）──── DeepSeek API（她的「大脑」）
```

一共要装 4 样东西：**DSH**（AI 本体）、**QQ + SnowLuma**（收发 QQ）、**本项目**（把两边连起来，加上记忆和人格），以及可选的**记忆服务**。

---

## 💻 选你的系统

同一份代码、同一个分支，按系统选一条路走：

| 系统 | QQ + SnowLuma | DSH | 一键启动 | 教程 |
| --- | --- | --- | --- | --- |
| 🐧 **Linux** | Linux QQ + SnowLuma，可以由脚本拉起 | 网页版 `dsh web` | `./start-all.sh` | [Linux 安装](#-linux-安装) |
| 🪟 **Windows 10 / 11**（原生，不是 WSL） | QQNT + SnowLuma，自己打开并注入 | 桌面版或网页版都行 | 双击 `start-all.bat` | [Windows 安装](#-windows-安装) |
| 🍎 **macOS** | 不做原生适配 | — | — | 用 [Docker 跑 Linux 容器](#-macos用-docker-跑-linux-容器) |

**开始之前都要准备：**

- 一个**专门给 AI 用的 QQ 小号**（⚠️ 不要用大号，第三方客户端有被风控的风险）
- 一个 **DeepSeek API 密钥**：到 [platform.deepseek.com](https://platform.deepseek.com) 注册、充值几块钱、创建 API Key（形如 `sk-...`，只显示一次，先存好）。桌面版也可以直接登录 DeepSeek 账号
- （可选）一张 **10 GB 显存以上的 NVIDIA 显卡**，用来在本地跑记忆服务的 embedding；没有也没关系，可以用云端 API，或者先不开记忆服务

> **版本说明**：实际跑通全链路的组合是 **SnowLuma 2.2.0**（Linux 配 QQ 3.2.32，Windows 配 QQNT 9.9）。更新的 SnowLuma（目前到 2.4.0）读配置和启动的方式已核对过、不用改代码，但还没有真正注入 QQ 验证过，见[真机复现清单](docs/guides/REAL_DEVICE_CHECKLIST.md)。DSH 由 CI 在 Linux、Windows 上持续核对：0.2.1-rc.3、latest、alpha。

---

## 🐧 Linux 安装

第一次大约 1 小时。下面的命令都在**终端**里输入（Ubuntu 按 `Ctrl + Alt + T` 打开），`#` 开头的是说明，不用输入。推荐 Ubuntu 22.04 及以上、有桌面的电脑，因为 QQ 要扫码登录。

### 第 1 步：安装 Node.js 24

```bash
# 安装 nvm（Node 版本管理器），装完关掉终端重新打开一个
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# 安装 Node.js 24 并检查版本
nvm install 24
node -v        # 显示 v24.x.x 就对了
```

### 第 2 步：安装并启动 DSH

```bash
npm install -g @deepseek-ai/dsh@latest

# 启动（这个终端窗口保持开着）
dsh web --no-open
```

用浏览器打开 <http://127.0.0.1:3080>，按提示点「**添加 API Key**」（或者打开「**设置 → 模型**」），填入 DeepSeek 密钥并保存。能在网页里和它正常聊天，这一步就成功了。

### 第 3 步：安装 QQ 和 SnowLuma

**3.1 安装 Linux QQ 3.2.32**

> ⚠️ SnowLuma 2.2.0 必须配 QQ 3.2.32（3.2.34 会注入失败）。官网只提供最新版，旧版可以在 [Rodert/qq-versions](https://github.com/Rodert/qq-versions) 这类存档里找到 `QQ_3.2.32_…_amd64_01.deb`（第三方存档，下载后请自行核对来源和校验值）。

```bash
sudo apt install ./QQ_3.2.32_*_amd64_01.deb

# 防止 QQ 自动升级到不兼容的版本
echo "127.0.0.1 qqpatch.gtimg.cn" | sudo tee -a /etc/hosts
```

打开 QQ，用**小号**扫码登录，保持 QQ 开着。

**3.2 安装并启动 SnowLuma**

1. 到 [SnowLuma v2.2.0](https://github.com/SnowLuma/SnowLuma/releases/tag/v2.2.0) 下载 `SnowLuma-v2.2.0-linux-x64-lite.tar.gz`，解压到比如 `~/snowluma/`。
2. 给 Node 一个「读取其它程序」的权限（SnowLuma 要靠它接入 QQ，只需做一次；**以后升级或重装 Node 后要重新做**）：

   ```bash
   sudo setcap cap_sys_ptrace=ep "$(readlink -f "$(which node)")"
   ```

3. 启动 SnowLuma（这个终端窗口保持开着）：

   ```bash
   cd ~/snowluma/SnowLuma-v2.2.0-linux-x64-lite
   node ./index.mjs
   ```

4. 用浏览器打开日志里给出的 WebUI 地址（一般是 <http://127.0.0.1:5099>），用日志里的**初始密码**登录，按提示：同意条款 → 改密码 → 接入已登录的 QQ。
5. 在 WebUI 的 OneBot 设置里打开 **WebSocket 服务端**（默认 `3001`）和 **HTTP API**（默认 `3000`），记下 HTTP API 的令牌（accessToken）。

> SnowLuma 是独立的第三方项目，请阅读它的 EULA。按其条款，本项目**不会**替你下载、安装 SnowLuma，也不会替你同意协议。

### 第 4 步：安装本项目

```bash
git clone https://github.com/y083245/dsh-memory-brain.git
cd dsh-memory-brain
npm install
cp config.example.json config.json
```

用文本编辑器打开 `config.json`（例如 `nano config.json`），改这几处：

```jsonc
{
  "ownerQQ": 10001,                     // 你自己（主人）的 QQ 号
  "allow": {
    "private": [10001],                 // 允许和她私聊的 QQ 号（至少填上你自己）
    "groups": [20001]                   // 允许她说话的群号（不想进群就留空 []）
  },
  "snowluma": {
    "wsUrl": "ws://127.0.0.1:3001",     // 第 3.2 步的 WebSocket 端口
    "httpUrl": "http://127.0.0.1:3000", // 第 3.2 步的 HTTP API 端口
    "accessToken": "HTTP API 的令牌"     // 没设令牌就留空 ""
  }
}
```

> 白名单留空时她**谁都不理**（这是故意的安全默认值），所以一定要至少填上你自己的 QQ 号。
> WebSocket 和 HTTP API 的令牌可能不一样，`accessToken` 填 HTTP API 的那个即可，WebSocket 的令牌桥接会自己发现。

把本项目的聊天模式和工具装进 DSH，**然后重启 DSH**（回到第 2 步那个终端，按 `Ctrl + C`，再执行一次 `dsh web --no-open`）：

```bash
node scripts/setup-dsh.mjs
```

> 漏了这一步或没重启 DSH，QQ 上会**完全没反应**，这是最常见的坑。

### 第 5 步：启动并测试 🎉

```bash
# 先测试本项目和 DSH 能不能连通（会建一个临时测试会话，跑完自动清理）
npm run self-test

# 正式启动（这个终端窗口保持开着）
npm start
```

日志里看到 `SnowLuma 已连接` 和 `DSH 已就绪` 就成功了。现在用你自己的 QQ 给小号发一句「在吗」，等她回复。

打开**控制台**（新开一个终端执行，复制输出的网址到浏览器）：

```bash
echo "http://127.0.0.1:3100/?token=$(cat state/console-token)"
```

> Linux 电脑在别的地方（远程服务器）时，在你自己的电脑上先执行 `ssh -L 3100:127.0.0.1:3100 用户名@服务器地址`，再用同样的网址打开。不要把 3100 暴露到公网。

### 第 6 步（可选）：一键启动、崩溃自动重启

都跑通以后，就不用开这么多终端了：

- `./start-all.sh`：按顺序启动 DSH → QQ → SnowLuma → 本项目，已经在跑的自动跳过。程序路径不在默认位置时，用 `DSH_DIR`、`SNOW_DIR`、`QQ_BIN` 环境变量或 `config.json` 的 `orchestrator` 段覆盖，**不要直接改脚本**。
- `bash scripts/systemd/install.sh`：把本项目和记忆服务装成 systemd 用户服务，崩溃自动拉起；加 `--enable` 开机自启（QQ 仍需人工扫码登录）。

基础的「QQ 里的 AI 朋友」到这里就跑起来了，想加人格和记忆服务，看[可选增强](#-可选增强linuxwindows-通用)。

---

## 🪟 Windows 安装

适用于 **Windows 10 / 11（x64），不用 WSL**。一句话流程：**装好 DSH → 用 SnowLuma 注入 QQ → 双击 `start-all.bat`**。其余的（装依赖、生成配置、把预设装进 DSH、找 SnowLuma 的令牌）脚本都会自己做。

> 想让 AI 帮你部署：把 [WINDOWS_AI_DEPLOY.md](docs/guides/WINDOWS_AI_DEPLOY.md) 发给它。想每个服务单独开窗口手动起：看 [WINDOWS_MANUAL_DEPLOY.md](docs/guides/WINDOWS_MANUAL_DEPLOY.md)。更多细节在 [README.windows.md](README.windows.md)。

### 第 1 步：安装 Node.js 和 Git

- [Node.js 24 LTS](https://nodejs.org/)（至少 22.13，自带 npm）。装完打开新窗口，`node -v` 能看到版本号。
- [Git for Windows](https://git-scm.com/download/win)。也可以用网页上的 **Code → Download ZIP** 代替，但那样就用不了 `update.bat` 升级。

### 第 2 步：安装 DSH（桌面版、网页版二选一）

| | 桌面版（推荐新手） | 网页版 |
| --- | --- | --- |
| 怎么装 | 下载[官方安装包](https://download.deepseek.com/desktop/dsh-latest-windows-x64.exe)，双击安装 | `npm install -g @deepseek-ai/dsh@latest` |
| 配模型 | 在桌面版里登录 DeepSeek 账号，或在「设置 → 模型」填 API Key | 启动后浏览器打开 <http://127.0.0.1:3080>，「设置 → 模型」里填 |
| 地址 | 每次启动随机端口，脚本和桥接会自动找到 | 固定 `3080` |

`start-all.bat` 默认自动挑：**桌面版开着就用桌面版，否则启动 `dsh web`**。想固定一个，用 `start-all.bat --desktop` 或 `start-all.bat --web`。QQ 预设会同时装进两个版本，随时换都不用重装。

### 第 3 步：用 SnowLuma 注入 QQ（要你自己操作）

1. 安装 QQNT，用**小号**登录。
2. 到 [SnowLuma Releases](https://github.com/SnowLuma/SnowLuma/releases) 下载 Windows 包（`SnowLuma-v*-win-x64.zip`），解压到任意目录。
3. 双击 `launcher.bat`，浏览器打开 WebUI（一般是 <http://127.0.0.1:5099>），按引导：同意条款 → 改密码 → 注入 QQ。
4. 在 OneBot 网络配置里确认 **HTTP 服务端（3000）**和 **WebSocket 服务端（3001）都已启用**。收消息走 WebSocket，发消息走 HTTP。

> QQ 先登录、SnowLuma 后启动时，SnowLuma 默认不会去挂已经在运行的 QQ：先退出 QQ 再启动 SnowLuma，或在 WebUI 里打开自动注入。令牌不用手抄，下一步会自动找。

### 第 4 步：安装本项目并一键启动

```bat
git clone https://github.com/y083245/dsh-memory-brain.git
cd dsh-memory-brain
start-all.bat
```

也可以在资源管理器里直接**双击 `start-all.bat`**。它会依次：

1. 第一次运行时自动 `npm ci` 装依赖；
2. 没有 `config.json` 就从示例生成，并在窗口里**问你的 QQ 号**（设为管理员并加进私聊白名单）；
3. 把 QQ 预设和工具装进 DSH，并确认 DSH 真的注册上了；DSH 开着又需要重启时，会问你要不要自动重启；
4. 连上 DSH，检查有没有可用模型，没有就告诉你去哪里配；
5. 等 SnowLuma 的 OneBot 就绪（最多 5 分钟），找到它的 HTTP / WebSocket 令牌并写回 `config.json`；
6. 拉起桥接，确认「SnowLuma 已连接」和「DSH 已就绪」都出现。

看到 `全部就绪` 后，用你的 QQ 给小号发一条私聊「在吗」，收到回复就成功了。控制台在 <http://127.0.0.1:3100/>，令牌在 `state\console-token`，日志在 `%USERPROFILE%\.ai-companion-run\`。

> **窗口一闪就没了？** 新版报错后会停在「按任意键继续」。如果还是一闪而过，确认是解压后运行的（不是在压缩包里直接双击），再看 `%USERPROFILE%\.ai-companion-run\start-all.log`，每次运行的输出都存在这里。

Windows 没有 systemd，所以没有开机自启。需要的话用「任务计划程序」在登录时运行 `start-all.bat`（无人值守时设 `QQB_ASSUME_YES=1`、`QQB_NO_PAUSE=1`）。

基础部分到这里就跑起来了，想加人格和记忆服务，看下一节。

---

## ✨ 可选增强（Linux、Windows 通用）

### 开启人格与情绪

1. 打开控制台 →「**API 管理**」页 →「人格判读」卡片，填入 DeepSeek 密钥（可以和 DSH 用同一个），保存。
2. 回到「**人格与情绪**」页，按页面提示**确认出厂性格**，然后打开「启用」。
3. 先让它跑两三天「**影子模式**」（只观察、不影响她说话），在页面上看判读得准不准。
4. 觉得没问题，再勾选「**注入给她**」，她的情绪和性格就会开始影响说话了。

### 开启记忆服务 memory-rag

开了之后她能「换个说法也想得起来」，还会自动整理聊天摘要、联想、给她提「值得记住的事」。

<details>
<summary><b>点这里展开安装步骤</b></summary>

**1. 安装 Python 环境**（用 [uv](https://docs.astral.sh/uv/)）

Linux：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh     # 装完重新打开终端
cd sidecars/memory-rag
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -e .
```

Windows（先按 uv 官网装好 uv）：

```bat
cd sidecars\memory-rag
uv venv --python 3.12 .venv
uv pip install --python .venv\Scripts\python.exe -e .
```

**2. 选一种 embedding（把文字变成向量的模型）**

三种方式走的都是 **OpenAI 兼容的 `POST /v1/embeddings` 接口**，在控制台「**API 管理**」页 → RAG 卡片里选（**先打开 RAG 开关才能填**）：

- **本项目自带 llama.cpp（有 NVIDIA 显卡、≥ 10 GB 显存）**：装好 [llama.cpp](https://github.com/ggml-org/llama.cpp)，从 [Qwen/Qwen3-Embedding-8B-GGUF](https://huggingface.co/Qwen/Qwen3-Embedding-8B-GGUF) 下载 `Qwen3-Embedding-8B-Q8_0.gguf`，然后启动（保持开着）：

  ```bash
  llama-server -m /path/to/Qwen3-Embedding-8B-Q8_0.gguf --embedding --pooling last --host 127.0.0.1 --port 8091 -ngl 99 -c 8192 -ub 8192
  ```

  控制台里选「本项目自带 llama.cpp」即可（这也是缺省）。Windows 上也可以把路径写进 `config.json` 的 `orchestrator.embedBin`、`embedModel`，由脚本启动。

- **自己部署的本地服务（Ollama / LM Studio / vLLM / 你自己的 llama.cpp）**：例如 Ollama 先 `ollama pull bge-m3`，控制台里选「我自己部署的本地服务」，地址填 `127.0.0.1:11434`、模型填 `bge-m3`，点「测试连接」（会自动填好维度）再保存。**只能填本机地址**；RAG 开关不会去启停你自己的服务。

- **没有显卡 → 云端 API**（硅基流动、阿里百炼、智谱、OpenAI 等）：选「云端 API」，填 https 地址（例如 `https://api.siliconflow.cn/v1`）、模型和密钥，测试连接后保存。⚠️ 这样聊天内容会发给该服务商。

  各家的地址、维度、每批条数上限见「API 管理」页顶部的「兼容性说明」或 [memory-rag 的说明](sidecars/memory-rag/README.md)。换模型需要全量重建向量库，页面会先提示再自动做。

**3. 启动并打开 RAG 开关**

记忆服务有一个**总开关**（`config.json` 的 `memoryRag.enabled`，**缺省是关**）：关着时桥接根本不去连它，检索用普通的关键词。

- 最简单的：在控制台「API 管理」页打开 RAG 开关，页面上能看到「启动中 → 运行中」；关掉会停服务、释放显存（数据都留着）。
- 命令行：Linux 用 `./start-all.sh --rag`，Windows 用 `start-all.bat --rag`；关闭是 `stop-all` 加 `--rag`。

聊天摘要和「值得记住的事」默认用「人格判读」那把 DeepSeek 密钥来提炼（每天几毛钱）；想换一家或单独计费，在「API 管理」→「话题提炼」里取消「和人格判读用同一个 API」再填。

</details>

---

## 🍎 macOS：用 Docker 跑 Linux 容器

macOS 不做原生适配（SnowLuma 也没有 macOS 版）。请用 Docker 起一个 Linux 容器，在容器里按上面的 [Linux 安装](#-linux-安装)流程部署，要注意：

- QQ 只有 amd64 的安装包：Apple 芯片的 Mac 用 `--platform linux/amd64` 起容器。
- SnowLuma 接入 QQ 要 ptrace 权限：起容器时加 `--cap-add=SYS_PTRACE`，容器里照样要做第 3 步的 `setcap`。
- QQ 要扫码登录，容器里要有图形桌面（比如 VNC）；DSH 和控制台都只监听容器内的 `127.0.0.1`，用同一个桌面里的浏览器打开。
- 把项目目录挂成卷，`state/` 和 `config.json` 才不会随容器丢失。

项目不提供现成镜像，这条路作者没有完整跑过。

---

## 🕹️ 日常使用

| 要做什么 | Linux | Windows |
| --- | --- | --- |
| 启动（已在跑的自动跳过） | `./start-all.sh` | `start-all.bat` |
| 停止桥接和记忆服务 | `./stop-all.sh` | `stop-all.bat` |
| 连本脚本起的 DSH 一起停 | `./stop-all.sh --all` | `stop-all.bat --all` |
| 只开 / 只关记忆服务 | `./start-all.sh --rag` / `./stop-all.sh --rag` | `start-all.bat --rag` / `stop-all.bat --rag` |
| 检查有没有新版本 | `bash scripts/update.sh --check` | `update.bat --check` |
| 升级 | `bash scripts/update.sh` | `update.bat` |
| 回到升级前 | `bash scripts/rollback.sh` | `rollback.bat` |

> Linux 上 `stop-all.sh` 会连 QQ 和 SnowLuma 一起停，下次可能要重新扫码。Windows 上这两个归你自己管，脚本不动它们。

---

## 🔄 升级到新版本

升级脚本会先备份 `state/` 和 `config.json`（聊天记录、记忆、配置都不会丢），把你改过的角色卡和提示词挪进 `state/` 覆盖层，再快进到新版本、补装依赖。它只会重启本项目、记忆服务和 DSH 中需要重启的那几个，**永远不会动 QQ 和 SnowLuma**。升级失败时会打印回滚命令。每个版本改了什么见 [CHANGELOG.md](CHANGELOG.md)。

**已经是 v0.5.2 及以后：**

```bash
bash scripts/update.sh --check   # Linux：先看看有什么新版本、要重启什么
bash scripts/update.sh           # 真正升级
```

```bat
update.bat --check
update.bat
```

### v0.5.1 及更早的老用户：先跑一次

2026-11-04 仓库整理过一次提交历史（文件内容没变，提交号变了），旧的升级脚本跟不上，会报「连不上 origin」。在项目目录里执行，只需要这一次：

**🐧 Linux：**

```bash
git fetch origin && git checkout origin/main -- scripts/update.sh scripts/update.mjs scripts/lib/upgrade-common.mjs
bash scripts/update.sh
```

**🪟 Windows，git clone 的：**

```bat
git fetch origin
git checkout origin/main -- scripts/update.sh scripts/update.mjs scripts/lib/upgrade-common.mjs
node scripts/update.mjs
```

从 `windows-native` 分支 clone 的（这个分支已经合进 `main` 并删除），跑完再执行一条 `git switch -C main origin/main`。

本地有自己的提交时脚本会拒绝升级，处理办法见 [CHANGELOG](CHANGELOG.md) 的 v0.5.2。以后就可以用 `bash scripts/update.sh` / `update.bat` 了。

**🪟 Windows，下载 ZIP 的**（没有 git，用不了升级脚本）：运行 `stop-all.bat`，把 `state\` 和 `config.json` 复制出来备份；下载新 ZIP 解压到新目录，把这两样放回去，再双击 `start-all.bat`。

**升级之后：**

- **从 v0.4.0 或更早升上来，要重启一次 DSH**，新版的预设和安全守卫才会生效。脚本问你时答 `y` 就行；如果它说没找到 DSH，就自己完全退出 DSH（桌面版要在托盘里退出）再打开。
- **QQ 和 SnowLuma 不用动**，也不用升级。
- 想退回去：Linux 运行 `bash scripts/rollback.sh`，Windows 运行 `rollback.bat`。
- 许可证从这一版起变了（禁止商用），见[致谢与许可](#-致谢与许可)。

> 改过 `start-all.sh` 的 Linux 用户会被脚本拦下：把路径改成环境变量（`DSH_DIR`、`SNOW_DIR`、`QQ_BIN`），再执行 `git checkout -- start-all.sh stop-all.sh` 重新升级。

---

## ❓ 常见问题

| 现象 | 原因和解决 |
| --- | --- |
| QQ 上发消息她完全没反应 | ① 没跑 `node scripts/setup-dsh.mjs` 或跑完没重启 DSH；② 白名单里没有你的 QQ 号；③ 看桥接窗口或 `bridge.log` 有没有报错 |
| `start-all` 提示「DSH 里没有 QQ 预设」 | 按它打印的诊断处理。桌面版用过「恢复 / 禁用插件」时要重新运行 `node scripts/setup-dsh.mjs`，然后**完全退出** DSH（托盘里退出）再打开 |
| Windows 双击 `start-all.bat` 窗口一闪就没 | 确认已解压；看 `%USERPROFILE%\.ai-companion-run\start-all.log`；老版本（目录名带括号时）有这个 bug，请升级 |
| 她回「agent 处理出错」 | DSH 没配好 DeepSeek 密钥或余额不足，检查 DSH 的「模型」页 |
| 日志出现 `session/model-unavailable` | DSH 里还没有可用模型（没登录账号 / 没填 API Key），或 `dsh.provider` 写死了当前 DSH 没有的值。保持 `"auto"` 会跟随 DSH 的默认模型 |
| Linux 上 SnowLuma 接入 QQ 失败 | 多半是 QQ 版本和 SnowLuma 不配（2.2.0 要配 3.2.32），或者 Node 没有 `setcap` 权限（升级 Node 后要重新做） |
| ssh 命令、cron 里跑 `start-all.sh` 报 node 版本不够 | 这类非交互 shell 不加载 nvm。脚本会自动去 `~/.nvm` 里找合适的 node；找不到就 `nvm install 24`，用别的版本管理器的话设 `NODE_BIN=/path/to/node`（或 `config.json` 的 `orchestrator.nodeBin`） |
| 一直「等待 SnowLuma 的 OneBot 服务」 | SnowLuma 还没注入 QQ，或 OneBot 的 HTTP（3000）/ WebSocket（3001）没启用；SnowLuma 2.3 及以上第一次运行要先在 WebUI 同意协议；端口不同就改 `config.json` 的 `snowluma.httpUrl` / `wsUrl` |
| QQ 已登录，但 OneBot 3000 / 3001 不起 | SnowLuma 默认不挂已经在运行的 QQ：先退出 QQ 再启动 SnowLuma，或启动前设 `SNOWLUMA_HOOK_AUTOLOAD=1`、在 WebUI 打开自动注入 |
| 日志出现 `SnowLuma 错误：{}` / `1006` | 正常现象：首次连接时桥接在自动修正 WebSocket 令牌，随后会显示「已连接」 |
| 报 HTTP 426 | `httpUrl` 填成了 WebSocket 的端口，改成 HTTP API 的端口 |
| 「API 管理」页 RAG 显示「部分可用」 | 记忆服务在跑，但 embedding 没起来：看状态后面的原因（显存不足、没装 llama.cpp / 模型、地址或模型名填错）；修好前检索自动只用关键词 |
| Windows 上 RAG 开关能点但服务没起 | 看 `%USERPROFILE%\.ai-companion-run\memory-rag.log`；确认 `sidecars\memory-rag\.venv\Scripts\python.exe` 存在 |
| 开了代理（Clash 等 fake-ip 模式）后她看不到图片 | 在代理的 `fake-ip-filter` 里加上 `+.qq.com`、`+.qq.com.cn`、`+.qpic.cn`、`+.gtimg.cn` |

更多「已知行为」和排查方法见 [完整说明](docs/guides/FULL_GUIDE.md)。

---

## 🧪 开发与测试

```bash
npm test      # 跨平台单元测试，自动跳过需要真实 DSH / QQ / 浏览器的用例
```

CI 在 Linux、Windows 上跑单元测试和 memory-rag 测试，用真实的 DSH 核对预设注册和建会话，并在 Windows 上真的跑一遍一键启动。`.sh` 和 `.bat` 只做薄入口，逻辑都写在 `scripts/*.mjs` 和 `src/runtime/` 里。

---

## 📚 更多文档

| 想了解 | 去看 |
| --- | --- |
| 新增功能的详细说明（记忆、人格、遗忘、主动、联想、报表…） | [docs/FORK_FEATURES.md](docs/FORK_FEATURES.md) |
| 配置项全表、运行模式、控制台功能、运维、已知行为 | [docs/guides/FULL_GUIDE.md](docs/guides/FULL_GUIDE.md) |
| 记忆服务 memory-rag（接口、遗忘与重建、embedding 选择） | [sidecars/memory-rag/README.md](sidecars/memory-rag/README.md) |
| DSH 端安装细节（preset 与 MCP 怎么挂上去） | [docs/guides/DSH_SETUP.md](docs/guides/DSH_SETUP.md) |
| 控制台「令牌与花费」看板 | [docs/guides/TOKEN_USAGE_CONSOLE.md](docs/guides/TOKEN_USAGE_CONSOLE.md) |
| 安全承诺 / 安全基线 / 隐私 | [RULES.md](RULES.md) · [SECURITY_BASELINE](docs/guides/SECURITY_BASELINE.md) · [PRIVACY](docs/guides/PRIVACY.md) |
| 仓库目录结构 | [docs/FOLDER_MAP.md](docs/FOLDER_MAP.md) |

---

## 🙏 致谢与许可

- 上游项目 [Derpyu520/qq-bridge](https://github.com/Derpyu520/qq-bridge)，本仓库保留其全部提交历史与版权声明
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)、[SnowLuma](https://github.com/SnowLuma/SnowLuma)、[Chroma](https://github.com/chroma-core/chroma)、[llama.cpp](https://github.com/ggml-org/llama.cpp)、[Qwen3-Embedding](https://huggingface.co/Qwen)
- 许可证：[PolyForm Noncommercial 1.0.0](LICENSE)（禁止商用）。上游 `v0.2.1-r1` 之后改用此许可，本仓库合入了之后的代码，因此一起遵守；详见 [NOTICE.md](NOTICE.md)

> **合规提醒**：SnowLuma 是独立第三方项目，与腾讯 / QQ 无隶属关系。本项目仅供学习与技术研究，使用前请阅读 SnowLuma 的 EULA 与《QQ 用户协议》，风险自负。
