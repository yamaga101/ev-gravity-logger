#!/usr/bin/env python3
"""
bulk-migrate.py — PWA JSON export を yamaga101 GAS に一括 POST する

Council (Gemini 3.1 Pro + GPT-5.5) 統合方針:
- Sequential POST + 1.5s インターバル (GAS quota 対応)
- 指数バックオフ retry (429/5xx/timeout) 最大 3 回
- 即 abort: auth(unauthorized) / GAS URL 異常 / schema mismatch
- 通常失敗は ledger に残して skip continue、最終 exit nonzero
- Python 側で payload 正規化 (旧 ChargingRecord フィールド吸収)
- dry-run mode
- ledger: scripts/migrate-ledger-{ts}.jsonl (type/id/status/attempt/body)
- 検証: 投入前件数 vs シート実件数 (実シート読みは MCP 側で別途)

Usage:
  GAS_URL='https://...' GAS_TOKEN='evm_...' \\
  python3 scripts/bulk-migrate.py path/to/ev-gravity-backup-2026-05-03.json [--dry-run]

Exit codes:
  0 = 全件成功
  1 = 部分失敗 (ledger 参照)
  2 = 即 abort (auth/url/schema)
  3 = 入力不正 (引数/ファイル/JSON)
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone


GAS_URL = os.environ.get("GAS_URL", "")
GAS_TOKEN = os.environ.get("GAS_TOKEN", "")
DRY_RUN = "--dry-run" in sys.argv
SLEEP_SEC = 1.5
MAX_ATTEMPTS = 3


def die(code: int, msg: str) -> None:
    print(f"FATAL: {msg}", file=sys.stderr)
    sys.exit(code)


def ledger_path() -> str:
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"scripts/migrate-ledger-{ts}.jsonl"


def post_json(payload: dict) -> tuple[int, str]:
    """POST with redirect that preserves method (Apps Script Web App pattern)."""
    body = json.dumps(payload).encode("utf-8")
    url = GAS_URL
    for _ in range(5):
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
        except (urllib.error.URLError, TimeoutError) as e:
            return -1, f"network: {e!r}"
    return -1, "too many redirects"


def post_with_retry(payload: dict) -> tuple[bool, str, int]:
    """Returns (ok, body, attempts). ok=True if Code.gs returned ok:true."""
    last_body = ""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        if DRY_RUN:
            return True, '{"ok":true,"dryRun":true}', attempt

        status, body = post_json(payload)
        last_body = body

        if status != 200:
            # transient: retry with backoff
            time.sleep(2 ** (attempt - 1))
            continue
        try:
            j = json.loads(body)
        except Exception:
            # html/redirect smell
            if "ファイルが見つかりません" in body or "<html" in body.lower():
                return False, body, attempt
            time.sleep(2 ** (attempt - 1))
            continue

        if j.get("ok") is True:
            return True, body, attempt
        # ok:false — examine error for abort vs continue
        err = (j.get("error") or "").lower()
        if "unauthorized" in err or "shared token" in err or "missing type" in err:
            # auth/schema → abort
            return False, body, attempt
        # other ok:false → retry
        time.sleep(2 ** (attempt - 1))
    return False, last_body, MAX_ATTEMPTS


# ---------- normalizers (PWA store record → GAS payload) ----------

def norm_charging(r: dict) -> dict:
    """ChargingRecord → ChargingGasPayload (旧フィールド吸収)。"""
    return {
        "type": "charging",
        "id": str(r["id"]),
        "status": "completed",
        "startTime": str(r.get("startTime") or r.get("timestamp") or ""),
        "endTime": str(r.get("endTime") or ""),
        "startOdometer": str(r.get("odometer", "")),
        "efficiency": str(r.get("efficiency", "")),
        "startSoC": str(r.get("startBattery") if r.get("startBattery") is not None else r.get("battery", "")),
        "endSoC": str(r.get("endBattery") if r.get("endBattery") is not None else r.get("batteryAfter", "")),
        "startRange": str(r.get("startRange", "")),
        "endRange": str(r.get("endRange", "")),
        "location": str(r.get("locationName", "")),
        "addedKwh": str(r.get("chargedKwh", "")),
        "cost": str(r.get("cost", "")),
        "startRangeAcOn": str(r.get("startRangeAcOn", "")),
        "endRangeAcOn": str(r.get("endRangeAcOn", "")),
    }


def norm_drivelog(r: dict) -> dict:
    return {
        "type": "driveLog",
        "id": str(r["id"]),
        "date": str(r.get("date", "")),
        "departure": str(r.get("departure", "")),
        "destination": str(r.get("destination", "")),
        "distance": r.get("distance", 0),
        "startOdometer": r.get("startOdometer", 0),
        "endOdometer": r.get("endOdometer", 0),
        "efficiency": r.get("efficiency", ""),
        "purpose": str(r.get("purpose", "")),
        "memo": str(r.get("memo", "")),
    }


def norm_maintenance(r: dict) -> dict:
    return {
        "type": "maintenance",
        "id": str(r["id"]),
        "date": str(r.get("date", "")),
        "category": str(r.get("category", "")),
        "description": str(r.get("description", "")),
        "cost": str(r.get("cost", "")),
        "odometer": str(r.get("odometer", "")),
        "nextDueDate": str(r.get("nextDueDate", "")),
        "memo": str(r.get("memo", "")),
    }


def norm_inspection(r: dict) -> dict:
    return {
        "type": "inspection",
        "id": str(r["id"]),
        "date": str(r.get("date", "")),
        "inspectionType": str(r.get("type", "")),
        "odometer": str(r.get("odometer", "")),
        "cost": str(r.get("cost", "")),
        "soh": str(r.get("soh", "")),
        "nextDueDate": str(r.get("nextDueDate", "")),
        "findings": str(r.get("findings", "")),
    }


def norm_insurance(r: dict) -> dict:
    return {
        "type": "insurance",
        "id": str(r["id"]),
        "provider": str(r.get("provider", "")),
        "policyNumber": str(r.get("policyNumber", "")),
        "insuranceType": str(r.get("type", "")),
        "coverageSummary": str(r.get("coverageSummary", "")),
        "premium": str(r.get("premium", "")),
        "startDate": str(r.get("startDate", "")),
        "endDate": str(r.get("endDate", "")),
        "memo": str(r.get("memo", "")),
    }


def norm_tax(r: dict) -> dict:
    return {
        "type": "tax",
        "id": str(r["id"]),
        "taxType": str(r.get("taxType", "")),
        "amount": str(r.get("amount", "")),
        "dueDate": str(r.get("dueDate", "")),
        "paidDate": str(r.get("paidDate", "")),
        "fiscalYear": str(r.get("fiscalYear", "")),
        "memo": str(r.get("memo", "")),
    }


# ---------- main ----------

def main() -> None:
    if not GAS_URL or not GAS_TOKEN:
        die(3, "GAS_URL / GAS_TOKEN env vars required")
    if "/macros/s/" not in GAS_URL or not GAS_URL.endswith("/exec"):
        die(2, f"GAS_URL の形式が不正: {GAS_URL}")
    if not GAS_TOKEN.startswith("evm_"):
        die(2, "GAS_TOKEN は 'evm_' で始まるはず")

    args = [a for a in sys.argv[1:] if a != "--dry-run"]
    if len(args) != 1:
        die(3, "usage: bulk-migrate.py <export.json> [--dry-run]")
    export_path = args[0]
    if not os.path.isfile(export_path):
        die(3, f"file not found: {export_path}")

    with open(export_path) as f:
        data = json.load(f)

    # 入力件数集計
    sources = [
        ("charging", data.get("history", []), norm_charging),
        ("driveLog", data.get("driveLog", []), norm_drivelog),
        ("maintenance", data.get("maintenance", []), norm_maintenance),
        ("inspection", data.get("inspection", []), norm_inspection),
        ("insurance", data.get("insurance", []), norm_insurance),
        ("tax", data.get("tax", []), norm_tax),
    ]
    total = sum(len(items) for _, items, _ in sources)
    print(f"export {export_path} version={data.get('version','?')} total={total}")
    for name, items, _ in sources:
        print(f"  {name}: {len(items)}")
    print(f"dry_run={DRY_RUN} sleep={SLEEP_SEC}s max_attempts={MAX_ATTEMPTS}")
    print("")

    if total == 0:
        print("nothing to migrate")
        return

    # ledger
    led_path = ledger_path()
    led = open(led_path, "w")
    print(f"ledger: {led_path}")
    print("")

    sent = 0
    ok_count = 0
    fail_count = 0

    for name, items, normalizer in sources:
        if not items:
            continue
        print(f"=== {name} ({len(items)}件) ===")
        for r in items:
            sent += 1
            try:
                payload = normalizer(r)
            except Exception as e:
                fail_count += 1
                print(f"  [{sent}/{total}] {name}/{r.get('id','?')} normalize FAIL: {e}")
                led.write(json.dumps({
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "type": name, "id": r.get("id"),
                    "status": "normalize_error", "error": str(e),
                }, ensure_ascii=False) + "\n")
                continue

            payload["token"] = GAS_TOKEN
            payload["idempotencyKey"] = f"migrate:{payload['id']}"

            ok, body, attempts = post_with_retry(payload)
            led.write(json.dumps({
                "ts": datetime.now(timezone.utc).isoformat(),
                "type": name, "id": payload["id"],
                "status": "ok" if ok else "fail",
                "attempts": attempts,
                "body": body[:500],
            }, ensure_ascii=False) + "\n")
            led.flush()

            if ok:
                ok_count += 1
                print(f"  [{sent}/{total}] {name}/{payload['id']} OK (attempt={attempts})")
            else:
                fail_count += 1
                print(f"  [{sent}/{total}] {name}/{payload['id']} FAIL: {body[:200]}")
                # auth-class abort
                blow = body.lower() if body else ""
                if "unauthorized" in blow or "shared token" in blow:
                    led.close()
                    die(2, "auth 失敗で abort。Token を確認")

            if not DRY_RUN:
                time.sleep(SLEEP_SEC)

    led.close()
    print("")
    print(f"=== summary ===")
    print(f"  total : {total}")
    print(f"  ok    : {ok_count}")
    print(f"  fail  : {fail_count}")
    print(f"  ledger: {led_path}")
    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
