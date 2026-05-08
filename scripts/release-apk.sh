#!/usr/bin/env bash
#
# release-apk.sh — debug APK を GitHub Releases にアップロード。
#
# Drive だと debug 署名は毎回 malware 自動 flag に引っかかるため、配布は
# GitHub Releases に統一。yamaga101 carve-out 配下、Google OAuth 不要。
#
# 配布 URL は /releases/latest/download/app-debug.apk が canonical。
# release ごとに変わらない安定 URL なのでメール本文 / QR 等にこれを貼れば
# 次回以降 v4.9.2, v4.10.0 ... と上がっても自動で最新を返す。
#
# 注意: 旧 Drive の APK 資産はこの script では削除しない。flagged 状態で
# Drive 上に残るので、不要なら手動で Trash に移動すること。新 release を
# 作っても Drive 側は触らない (もう Drive を配布チャネルとして使わない)。
#
# Usage:
#   bash scripts/release-apk.sh         # tag = v<package.json.version>
#   bash scripts/release-apk.sh --prerelease   # 公開しない / latest にしない
#
# Requirements:
#   - gh CLI が yamaga101 で認証済 (gh auth status で確認)
#   - APK 既存 (npm run cap:sync 等で android/app/build/outputs/apk/debug/app-debug.apk)
#

set -euo pipefail

REPO="yamaga101/ev-manager"
APK="android/app/build/outputs/apk/debug/app-debug.apk"
# default は production-like に出して /latest/download/ で取れるようにする。
# debug 署名 APK を確定 release と扱うのは違和感あるが、PoC 期間中の利便性優先。
# 完全に隠しておきたい時だけ --prerelease を付ける。
PRERELEASE_FLAG="--latest"

for arg in "$@"; do
  case "$arg" in
    --prerelease) PRERELEASE_FLAG="--prerelease" ;;
    --apk=*) APK="${arg#--apk=}" ;;
    *) echo "[error] unknown arg: $arg" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$APK" ]]; then
  echo "[error] APK 無し: $APK" >&2
  echo "  build してから実行してください: npm run cap:sync" >&2
  exit 1
fi

# v5.2.0/v5.2.1 で base path mismatch (`/ev-manager/`) で APK が白画面になった
# 障害を踏まえた pre-flight check。assets/public/index.html が `./assets/` 相対
# パスを使っているか確認、絶対 `/ev-manager/` が残っていたら abort。
WEB_INDEX="android/app/src/main/assets/public/index.html"
if [[ -f "$WEB_INDEX" ]]; then
  if grep -q '"/ev-manager/assets/' "$WEB_INDEX"; then
    echo "[error] APK assets path に /ev-manager/ 絶対パスが混入しています" >&2
    echo "  Capacitor WebView は file:// 経由で load するため、/ev-manager/ では 404 で白画面になります" >&2
    echo "  fix: 'npm run cap:sync' を再実行 (build:native が --base=./ で再ビルド)" >&2
    exit 1
  fi
fi

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"
NAME="EV Manager v${VERSION} (Android debug)"
ASSET_NAME="ev-manager-v${VERSION}-debug.apk"
SIZE_MB=$(awk "BEGIN {printf \"%.1f\", $(stat -f%z "$APK") / 1024 / 1024}")

echo "[info] repo    = ${REPO}"
echo "[info] version = ${VERSION}"
echo "[info] tag     = ${TAG}"
echo "[info] apk     = ${APK} (${SIZE_MB} MB)"

# tag が既に存在していたら release を update、なければ新規作成
if gh release view "$TAG" -R "$REPO" >/dev/null 2>&1; then
  echo "[info] release ${TAG} 既存 → asset を上書き"
  gh release upload "$TAG" "$APK#${ASSET_NAME}" --clobber -R "$REPO"
else
  echo "[info] release ${TAG} 新規作成"
  NOTES=$(cat <<EOF
EV Manager v${VERSION} Android debug APK

⚠️ 個人 carve-out ビルド (yamaga101)。debug 署名のため Play ストア配布不可。
S25 Ultra で「不明な提供元のアプリのインストール」を許可してから install してください。

含まれる主な変更は CHANGELOG / docs/logs/ を参照。
EOF
)
  gh release create "$TAG" "$APK#${ASSET_NAME}" \
    --title "$NAME" \
    --notes "$NOTES" \
    $PRERELEASE_FLAG \
    -R "$REPO"
fi

URL=$(gh release view "$TAG" --json url -R "$REPO" -q .url)
# gh の `apk#name` syntax は label を変えるが name はそのまま (`app-debug.apk`)。
# ダウンロード URL は name ベースなので最初の asset の url を取る。
ASSET_URL=$(gh release view "$TAG" --json assets -R "$REPO" -q ".assets[0].url")
# /releases/latest/download/<name> は最新 release を指す stable URL (302 redirect)。
# release ごとに変わらないので、メール本文や QR には基本これを貼る。
LATEST_URL="https://github.com/${REPO}/releases/latest/download/app-debug.apk"

echo ""
echo "[ok]   release page : ${URL}"
echo "[ok]   asset url    : ${ASSET_URL}"
echo "[ok]   latest url   : ${LATEST_URL}   (← 安定: 次回 release でも同じ)"

# macOS なら latest URL をクリップボードへ (release ごとに同じ短い URL)
if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$LATEST_URL" | pbcopy
  echo "[ok]   pbcopy       : latest URL をクリップボードに copy 済"
fi
