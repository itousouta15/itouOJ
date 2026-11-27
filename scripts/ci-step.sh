#!/usr/bin/env bash
# 用法：scripts/ci-step.sh <錯誤代碼> <指令...>
# 指令失敗時輸出帶代碼的 GitHub 橘/紅色註解，並保留原本的結束碼。
# 代碼說明見 docs/error-codes.md。
code="$1"; shift
"$@"
status=$?
if [ "$status" -ne 0 ]; then
  echo "::error title=[$code] CI 步驟失敗::請對照 docs/error-codes.md 的 $code（指令：$*）"
fi
exit "$status"
