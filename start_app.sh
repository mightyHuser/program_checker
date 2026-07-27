#!/bin/bash
# バックエンドとフロントエンドを同時に起動するスクリプト（macOS/Linux用）
# start_app.bat のmacOS版
#
# Code Runner等の非対話シェルではpyenv/nvmが初期化されず
# `python`/`npm`が見つからない、または誤ったバージョンを指すことがあるため、
# ここで明示的に読み込む。

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# pyenvのshims（rehash済みのpython/pip等のラッパー）をPATHの先頭に追加
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/shims:$PATH"

# nvmを初期化してnpmを使えるようにする
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ctrl+C で両方のプロセスを終了させる
cleanup() {
  echo ""
  echo "Stopping backend and frontend..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

cd "$SCRIPT_DIR/backend" && python main.py &
BACKEND_PID=$!

cd "$SCRIPT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo "App started! Access frontend at http://localhost:5173"
echo "Press Ctrl+C to stop both backend and frontend."

wait "$BACKEND_PID" "$FRONTEND_PID"
