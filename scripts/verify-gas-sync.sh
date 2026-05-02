#!/bin/bash
# verify-gas-sync.sh — yamaga101 GAS Web App の疎通確認 (M-3 完了判定用)。
#
# Usage:
#   GAS_URL='https://script.google.com/macros/s/.../exec' \
#   GAS_TOKEN='tok_xxxxx' \
#   bash scripts/verify-gas-sync.sh
#
# Exit:
#   0 = OK (Sheet に書き込まれた)
#   1 = NG (詳細を stderr)

set -uo pipefail

if [ -z "${GAS_URL:-}" ] || [ -z "${GAS_TOKEN:-}" ]; then
  echo "ERROR: GAS_URL / GAS_TOKEN を環境変数で渡してください" >&2
  echo "  例: GAS_URL='...' GAS_TOKEN='...' bash scripts/verify-gas-sync.sh" >&2
  exit 1
fi

TEST_ID="verify-$(date +%s)"
PAYLOAD=$(cat <<JSON
{
  "kind": "charging",
  "token": "$GAS_TOKEN",
  "id": "$TEST_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "startBattery": 50,
  "endBattery": 60,
  "startRange": 100,
  "endRange": 150,
  "memo": "M-3 verify smoke test"
}
JSON
)

echo "POST $GAS_URL"
echo "  test id: $TEST_ID"

RESPONSE="$(curl -sS -X POST -H "Content-Type: application/json" \
  --data "$PAYLOAD" \
  -L \
  "$GAS_URL" 2>&1)"
RC=$?

echo "  response: $RESPONSE"
echo "  curl exit: $RC"

if [ $RC -ne 0 ]; then
  echo "ERROR: curl failed" >&2
  exit 1
fi

case "$RESPONSE" in
  *OK*|*ok*|*success*|*"\"ok\":true"*)
    echo "✓ Web App reachable と判定"
    echo "→ Spreadsheet で id=$TEST_ID 行が追加されたことを目視確認してください:"
    echo "  https://docs.google.com/spreadsheets/d/1HK8C4C1IeK9Lf0UvDweqIkksEv6Jyer3jx_UNRSlceA/edit"
    exit 0
    ;;
  *401*|*Unauthorized*|*"invalid token"*)
    echo "✗ 認証エラー — Token が違うか rotateSharedToken の実行ログから取得し直してください" >&2
    exit 1
    ;;
  *)
    echo "△ 想定外レスポンス。Apps Script の実行記録を確認してください" >&2
    echo "  https://script.google.com/d/1Zmz_57Yy0Pqs9FOpsm3e-1RdPacmlpo6asoPgbHdaEARMNm2aaO3Ucpy/edit" >&2
    exit 1
    ;;
esac
