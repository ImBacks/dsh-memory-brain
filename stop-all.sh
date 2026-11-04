#!/usr/bin/env bash
# 兼容旧用法：真正的实现在 scripts/stop-all.mjs（Linux/Windows 共用）。
# 用 $0 定位仓库根，从任意目录调用都能找到脚本。
ROOT="$(cd "$(dirname "$0")" && pwd)"
. "$ROOT/scripts/lib/ensure-node.sh"
exec node "$ROOT/scripts/stop-all.mjs" "$@"
