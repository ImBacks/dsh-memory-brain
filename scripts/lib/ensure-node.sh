# start-all.sh / stop-all.sh 共用（source，不单独运行）。
# ssh 执行命令、cron 不加载 ~/.bashrc，只装了 nvm 的人 PATH 里根本没有 node。
# 这里只保证有一个 node 能跑脚本；具体该用哪个版本由 scripts/start-all.mjs 决定。
if ! command -v node >/dev/null 2>&1; then
  qqb_nvm_bin="$(ls -d "${NVM_DIR:-$HOME/.nvm}"/versions/node/v*/bin 2>/dev/null | sort -V | tail -n 1)"
  if [ -z "$qqb_nvm_bin" ]; then
    echo "[fail] 找不到 node：PATH 里没有，${NVM_DIR:-$HOME/.nvm} 里也没有。" >&2
    echo "  先安装 Node.js 24；用别的版本管理器的话，把 node 所在目录加进 PATH。" >&2
    exit 127
  fi
  export PATH="$qqb_nvm_bin:$PATH"
  unset qqb_nvm_bin
fi
