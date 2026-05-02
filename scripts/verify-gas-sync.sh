#!/bin/bash
# verify-gas-sync.sh — yamaga101 GAS Web App の疎通確認 (M-3 完了判定用)。
#
# Python 実装 (curl の redirect 仕様差を回避するため)。
# macOS 標準 Python 3 で動作。
#
# Usage:
#   GAS_URL='https://script.google.com/macros/s/.../exec' \
#   GAS_TOKEN='evm_xxxxx' \
#   bash scripts/verify-gas-sync.sh
#
# Exit: 0 = OK / 1 = NG

set -uo pipefail

if [ -z "${GAS_URL:-}" ] || [ -z "${GAS_TOKEN:-}" ]; then
  echo "ERROR: GAS_URL / GAS_TOKEN を環境変数で渡してください" >&2
  exit 1
fi

export GAS_URL GAS_TOKEN

python3 - <<'PYEOF'
import json
import os
import sys
import time
import urllib.request
import urllib.error

GAS_URL = os.environ["GAS_URL"]
GAS_TOKEN = os.environ["GAS_TOKEN"]


def post(payload: dict) -> tuple[int, str]:
    """POST JSON to Apps Script Web App, follow redirects keeping POST method."""
    body = json.dumps(payload).encode("utf-8")
    url = GAS_URL
    for _ in range(5):  # max 5 redirects
        req = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308):
                loc = e.headers.get("Location")
                if not loc:
                    return e.code, e.read().decode("utf-8", errors="replace")
                url = loc
                continue
            return e.code, e.read().decode("utf-8", errors="replace")
        except Exception as e:
            return -1, f"network error: {e!r}"
    return -1, "too many redirects"


def judge(label: str, status: int, body: str, expect_ok: bool = True) -> bool:
    snippet = body[:300].replace("\n", "\\n")
    print(f"  status: {status}")
    print(f"  body[:300]: {snippet}")
    if status != 200:
        print(f"  ✗ HTTP {status}", file=sys.stderr)
        return False
    try:
        j = json.loads(body)
    except Exception:
        print("  ✗ レスポンスが JSON ではない (HTML が返っている可能性)", file=sys.stderr)
        return False
    if j.get("ok") is True:
        print(f"  ✓ {label} OK")
        return True
    print(f"  ✗ ok=false: {j}", file=sys.stderr)
    return False


# Phase 1: ping
print("=== Phase 1: ping ===")
status, body = post({"type": "ping", "token": GAS_TOKEN})
if not judge("ping", status, body):
    sys.exit(1)

# Phase 2: charging
print("")
print("=== Phase 2: charging 1件投入 ===")
test_id = f"verify-{int(time.time())}"
now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
payload = {
    "type": "charging",
    "token": GAS_TOKEN,
    "id": test_id,
    "timestamp": now,
    "startBattery": 50,
    "endBattery": 60,
    "startRange": 100,
    "endRange": 150,
    "memo": "M-3 verify smoke test",
}
print(f"  test id: {test_id}")
status, body = post(payload)
if not judge("charging 書込", status, body):
    sys.exit(1)

print("")
print("→ Spreadsheet で確認:")
print("  https://docs.google.com/spreadsheets/d/1HK8C4C1IeK9Lf0UvDweqIkksEv6Jyer3jx_UNRSlceA/edit")
print(f"  「充電ログ」シートに id={test_id} 行が追加されているはず")
PYEOF
