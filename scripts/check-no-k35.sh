#!/bin/bash
# check-no-k35.sh — ev-manager に shigaki@k35 残骸が混入していないか検査。
#
# Why: 2026-05-02 yamaga101 carve-out (例外3) 後、k35 path が残ったまま
# 同期先が混在するとサイレント故障を起こす。
# 「ev-manager で k35 が混入 = 絶対バグ」として pre-commit / CI で自動検査する。
#
# 参照: rules/behavior.md 例外3、docs/specs/system-gas-yamaga101-carveout.md
#
# 検査対象: 実行コード (.sh .ps1 .py .js .ts .tsx .gs .json .plist .yml .yaml)
# 検査除外: docs/ (歴史的記録), .git/, node_modules/, dist/, build/, *.log
#
# 終了コード:
#   0 = 違反なし
#   1 = 違反検出 (詳細を stderr に出力)
#
# Usage:
#   scripts/check-no-k35.sh           # リポジトリ全体を検査
#   scripts/check-no-k35.sh --staged  # git staged ファイルのみ (pre-commit hook 用)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PATTERN='shigaki@k35\.jp\|GoogleDrive-shigaki@k35'

if [ "${1:-}" = "--staged" ]; then
    FILES="$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null \
              | grep -E '\.(sh|ps1|py|js|ts|tsx|gs|json|plist|ya?ml)$' \
              | grep -v '^docs/' \
              || true)"
else
    FILES="$(find . -type f \
              \( -name '*.sh' -o -name '*.ps1' -o -name '*.py' \
                 -o -name '*.js' -o -name '*.ts' -o -name '*.tsx' \
                 -o -name '*.gs' -o -name '*.json' -o -name '*.plist' \
                 -o -name '*.yml' -o -name '*.yaml' \) \
              -not -path './.git/*' \
              -not -path './node_modules/*' \
              -not -path './dist/*' \
              -not -path './build/*' \
              -not -path './docs/*' 2>/dev/null \
              | sed 's|^\./||')"
fi

if [ -z "$FILES" ]; then
    exit 0
fi

VIOLATIONS=""
while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ ! -f "$f" ] && continue
    HITS="$(grep -nE "$PATTERN" "$f" 2>/dev/null || true)"
    if [ -n "$HITS" ]; then
        VIOLATIONS="${VIOLATIONS}${f}:\n${HITS}\n"
    fi
done <<< "$FILES"

if [ -n "$VIOLATIONS" ]; then
    {
        echo "ERROR: ev-manager で shigaki@k35 参照が検出されました (yamaga101 carve-out 例外3 違反)"
        echo "---"
        echo -e "$VIOLATIONS"
        echo "---"
        echo "ポリシー: rules/behavior.md 例外3 / docs/specs/system-gas-yamaga101-carveout.md"
        echo "コメント文中の歴史的記録は許容。実行コードのみ修正対象"
    } >&2
    exit 1
fi

exit 0
