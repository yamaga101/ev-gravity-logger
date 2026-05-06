#!/usr/bin/env python3
"""
EV Manager — APK を yamaga101 Drive にアップロード + 自分宛にメール通知。

carve-out 例外3 (security.md §7): 全 yamaga101@gmail.com 配下。
コード/パス/トークンに k35 を一切混入しない。

Usage:
  python3 scripts/upload-apk-to-drive.py [--apk PATH] [--no-mail] [--no-share]

Setup (初回のみ):
  Option A (推奨): cx-dict の OAuth Client を流用 (同一 yamaga101 GCP project)
    mkdir -p ~/.config/ev-manager && chmod 700 ~/.config/ev-manager
    cp ~/.config/cx-dict/credentials.json ~/.config/ev-manager/
    chmod 600 ~/.config/ev-manager/credentials.json
    npm run upload-apk   # 初回はブラウザで認証 → token.json 自動生成

  Option B: yamaga101 GCP で新規 OAuth Desktop Client を作成
    https://console.cloud.google.com/apis/credentials (yamaga101 アカウント)
    → ダウンロードした JSON を ~/.config/ev-manager/credentials.json に配置

Drive folder: "EV Manager builds" (ルートに自動作成)。同名 APK が既にあれば上書き。
"""

import argparse
import json
import os
import sys
from base64 import urlsafe_b64encode
from email.mime.text import MIMEText
from pathlib import Path

CONFIG_DIR = Path.home() / ".config" / "ev-manager"
CREDENTIALS_PATH = CONFIG_DIR / "credentials.json"
TOKEN_PATH = CONFIG_DIR / "token.json"

DRIVE_FOLDER_NAME = "EV Manager builds"
RECIPIENT = "yamaga101@gmail.com"

SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/gmail.send",
]


def ensure_config_dir() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    os.chmod(CONFIG_DIR, 0o700)


def get_credentials():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    ensure_config_dir()
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        if not CREDENTIALS_PATH.exists():
            sys.exit(
                "[error] credentials.json が無い: "
                f"{CREDENTIALS_PATH}\n"
                "Setup 手順は scripts/upload-apk-to-drive.py 冒頭 docstring を参照。"
            )
        flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
        creds = flow.run_local_server(port=0)

    TOKEN_PATH.write_text(creds.to_json())
    os.chmod(TOKEN_PATH, 0o600)
    return creds


def find_or_create_folder(drive, name: str) -> str:
    q = (
        f"name='{name}' "
        "and mimeType='application/vnd.google-apps.folder' "
        "and 'root' in parents "
        "and trashed=false"
    )
    res = drive.files().list(q=q, fields="files(id,name)").execute()
    if res.get("files"):
        return res["files"][0]["id"]
    folder = drive.files().create(
        body={"name": name, "mimeType": "application/vnd.google-apps.folder"},
        fields="id",
    ).execute()
    return folder["id"]


def find_existing_file(drive, folder_id: str, name: str) -> str | None:
    q = f"name='{name}' and '{folder_id}' in parents and trashed=false"
    res = drive.files().list(q=q, fields="files(id,name)").execute()
    files = res.get("files") or []
    return files[0]["id"] if files else None


def upload_apk(drive, apk_path: Path, folder_id: str, version: str, share: bool):
    from googleapiclient.http import MediaFileUpload

    name = f"ev-manager-v{version}-debug.apk"
    media = MediaFileUpload(
        str(apk_path),
        mimetype="application/vnd.android.package-archive",
        resumable=True,
    )

    existing = find_existing_file(drive, folder_id, name)
    if existing:
        meta = drive.files().update(
            fileId=existing,
            media_body=media,
            fields="id,name,webViewLink",
        ).execute()
    else:
        meta = drive.files().create(
            body={"name": name, "parents": [folder_id]},
            media_body=media,
            fields="id,name,webViewLink",
        ).execute()

    if share:
        drive.permissions().create(
            fileId=meta["id"],
            body={"role": "reader", "type": "anyone"},
        ).execute()
        meta = drive.files().get(
            fileId=meta["id"], fields="id,name,webViewLink"
        ).execute()

    return meta


def send_link_mail(gmail, version: str, file_name: str, link: str) -> dict:
    body = (
        f"EV Manager v{version} の APK を Drive にアップロードしました。\n\n"
        f"ファイル名: {file_name}\n"
        f"ダウンロード: {link}\n\n"
        "S25 Ultra の Drive app で開いて install してください。\n"
        "「不明な提供元のアプリのインストール」を許可する必要があります。\n"
    )
    msg = MIMEText(body)
    msg["Subject"] = f"[EV Manager] APK v{version} build link"
    msg["To"] = RECIPIENT
    msg["From"] = "me"
    raw = urlsafe_b64encode(msg.as_bytes()).decode()
    return gmail.users().messages().send(userId="me", body={"raw": raw}).execute()


def detect_version() -> str:
    pkg = Path(__file__).resolve().parent.parent / "package.json"
    return json.loads(pkg.read_text(encoding="utf-8"))["version"]


def main() -> None:
    ap = argparse.ArgumentParser(description="Upload EV Manager APK to yamaga101 Drive.")
    ap.add_argument(
        "--apk",
        default="android/app/build/outputs/apk/debug/app-debug.apk",
        help="APK のパス (default: debug build 出力)",
    )
    ap.add_argument("--no-mail", action="store_true", help="メール送信をスキップ")
    ap.add_argument("--no-share", action="store_true", help="anyone-with-link 共有を付けない")
    args = ap.parse_args()

    apk = Path(args.apk).resolve()
    if not apk.exists():
        sys.exit(
            f"[error] APK 無し: {apk}\n"
            "  まず `npm run cap:sync` 等で build してください。"
        )

    version = detect_version()
    size_mb = apk.stat().st_size / 1024 / 1024
    print(f"[info] version = {version}")
    print(f"[info] apk     = {apk} ({size_mb:.1f} MB)")

    creds = get_credentials()

    from googleapiclient.discovery import build

    drive = build("drive", "v3", credentials=creds, cache_discovery=False)
    folder_id = find_or_create_folder(drive, DRIVE_FOLDER_NAME)
    print(f"[info] folder  = {DRIVE_FOLDER_NAME} ({folder_id})")

    meta = upload_apk(drive, apk, folder_id, version, share=not args.no_share)
    link = meta["webViewLink"]
    print(f"[ok]   upload  = {meta['name']}")
    print(f"[ok]   link    = {link}")

    if not args.no_mail:
        gmail = build("gmail", "v1", credentials=creds, cache_discovery=False)
        try:
            send_link_mail(gmail, version, meta["name"], link)
            print(f"[ok]   mail    = {RECIPIENT}")
        except Exception as e:
            # Gmail API が GCP project で無効な場合 (403 accessNotConfigured) 等は
            # メール失敗で全体を落とさず、リンクは既に手元にあるので続行する。
            # GCP console で Gmail API を enable すれば次回から自動送信になる。
            print(f"[warn] mail skipped: {type(e).__name__}: {e}")
            print(f"[hint] Gmail API を有効化: https://console.developers.google.com/apis/api/gmail.googleapis.com/overview")


if __name__ == "__main__":
    main()
