#!/usr/bin/env bash
# 薄入口：实现在 scripts/update.mjs（Linux / Windows 共用），这里不写逻辑。
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 老版本第一次升级：只取了 update.sh 时，把它依赖的文件也取下来。
if [ ! -f "$DIR/update.mjs" ] || [ ! -f "$DIR/lib/upgrade-common.mjs" ]; then
  git -C "$DIR/.." fetch --tags --force --quiet origin
  git -C "$DIR/.." checkout origin/main -- scripts/update.mjs scripts/lib/upgrade-common.mjs
fi
exec node "$DIR/update.mjs" "$@"
