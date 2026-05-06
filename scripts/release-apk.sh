#!/usr/bin/env bash
#
# release-apk.sh — debug APK を GitHub Releases にアップロード。
#
# Drive だと debug 署名は毎回 malware 自動 flag に引っかかるため、配布は
# GitHub Releases に統一。yamaga101 carve-out 配下、Google OAuth 不要。
#
# Usage:
#   bash scripts/release-apk.sh         # tag = v<package.json.version>, prerelease
#   bash scripts/release-apk.sh --no-prerelease
#
# Requirements:
#   - gh CLI が yamaga101 で認証済 (gh auth status で確認)
#   - APK 既存 (npm run cap:sync 等で android/app/build/outputs/apk/debug/app-debug.apk)
#

set -euo pipefail

REPO="yamaga101/ev-manager"
APK="android/app/build/outputs/apk/debug/app-debug.apk"
PRERELEASE_FLAG="--prerelease"

for arg in "$@"; do
  case "$arg" in
    --no-prerelease) PRERELEASE_FLAG="" ;;
    --apk=*) APK="${arg#--apk=}" ;;
    *) echo "[error] unknown arg: $arg" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$APK" ]]; then
  echo "[error] APK 無し: $APK" >&2
  echo "  build してから実行してください: npm run cap:sync" >&2
  exit 1
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

echo ""
echo "[ok]   release page : ${URL}"
echo "[ok]   asset url    : ${ASSET_URL}"

# macOS Mac なら release page URL をクリップボードへ
if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$URL" | pbcopy
  echo "[ok]   pbcopy       : release page URL をクリップボードに copy 済"
fi
