---
visibility: internal
---
# P3 Auto-Update — GitHub Releases polling + native install (ADR)

**Status**: Implementing 2026-05-08 (v5.2.0)
**Author**: Opus 4.7 (L4 default、ユーザー path A 採決)

## Sprint Contract

- **Done**: アプリ起動時 (6h cooldown) に GitHub `/repos/yamaga101/ev-manager/releases/latest` を fetch し、tag が APP_VERSION より新しければ画面上部に "Update available" banner 表示。banner タップで APK download → ACTION_VIEW intent で Android パッケージインストーラを起動 → ユーザー Confirm → 自動 install。
- **Verify**: 古い version の APK で起動 → banner 出る → タップ → download progress → install プロンプト → 新 version で再起動できる。
- **Revert**: revert commit + AndroidManifest から `REQUEST_INSTALL_PACKAGES` permission 削除。

## Context

- ev-manager は debug-signed APK を GitHub Releases (canonical `releases/latest/download/app-debug.apk`) で配布、現状はメール link → Samsung Internet → 手動 install
- Play Store は debug-signed では出せない (release-signed + Play Console 必要)、yamaga101 carve-out 単独で運用するなら過剰
- Capgo / OTA hot-patch は web bundle のみで native plugin (v5.1.0 SQLite 等) が変わると追従できない
- 既存 `release-apk.sh` の出力 URL を再利用すれば server / 追加インフラ不要

## Decision

### 1. Native bridge: ApkInstallerPlugin (Java、self-hosted)

`@PluginMethod install(path)` を 1 つだけ持つ Capacitor custom plugin を `android/app/src/main/java/jp/gmail/yamaga101/evmanager/ApkInstallerPlugin.java` に置く。MainActivity で `registerPlugin(ApkInstallerPlugin.class)`。

実装:
1. `FileProvider.getUriForFile()` で content:// URI 取得 (`${applicationId}.fileprovider` authority、既存)
2. `Intent(Intent.ACTION_VIEW)` + `setDataAndType(uri, "application/vnd.android.package-archive")`
3. `FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK`
4. `startActivity()`

### 2. Permissions

AndroidManifest.xml:
- `<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />`

初回 install 時にユーザーが「不明なソースからのアプリ」許可を 1 回手動承認する必要あり (Android 8+ since 2017)。Galaxy S25 Ultra の場合は: 設定 → アプリ → ev-manager → 不明なアプリのインストール → 許可。

### 3. FileProvider paths

`android/app/src/main/res/xml/file_paths.xml` に APK cache 用 path を追加:
```xml
<cache-path name="apk_cache" path="apk/" />
```
(`Filesystem.Directory.Cache + "apk/app-debug.apk"` を共有可能にする)

### 4. JS service `src/services/auto-update.ts`

```ts
checkForUpdate(): Promise<{available: boolean, latestVersion?: string, downloadUrl?: string}>
downloadAndInstall(downloadUrl: string, onProgress: (pct) => void): Promise<void>
```

flow:
1. `lastCheck` を localStorage に保存、6h 以内なら skip
2. `fetch("https://api.github.com/repos/yamaga101/ev-manager/releases/latest")` (Accept: application/vnd.github+json)
3. `data.tag_name` (例: `v5.2.0`) を APP_VERSION (例: `5.1.0`) と semver 比較
4. 新ければ `data.assets[].browser_download_url` から `app-debug.apk` 探す
5. `Filesystem.downloadFile()` で `Cache/apk/app-debug.apk` に保存
6. `Filesystem.getUri()` で絶対 path 取得
7. `ApkInstaller.install({ path })` で intent 起動

### 5. UI: `<UpdateBanner />` 1 個

3 UI variant (Silent / NEXUS v2 / legacy) すべての root に配置。状態: `idle | checking | available | downloading | error`。

- `idle / checking`: 非表示
- `available`: 上部 sticky banner「v5.2.0 が利用可能 — タップで更新」
- `downloading`: progress bar (% は Filesystem の progress event から)
- `error`: 失敗理由 + dismiss ボタン

### 6. cooldown / 起動 hook

- `useEffect` で SilentApp / RedesignApp / legacy App 起動時 1 回 check
- localStorage `ev-update-last-check` (ISO8601) で 6h cooldown
- ユーザーがバナー dismiss したら cooldown +24h (`ev-update-dismissed-version`)

### 7. 安全性

- HTTPS (GitHub API + canonical URL は強制 HTTPS)
- tag_name + APP_VERSION 比較で **同 version 以下** は banner 出さない (rollback 攻撃時もユーザーが install 拒否すれば被害ゼロ)
- カスタム Java plugin は `install(path)` 1 method のみ、外部から呼べる scope 最小
- `REQUEST_INSTALL_PACKAGES` は危険 permission だが、本人 1 台専用 carve-out なので許容

## Alternatives Rejected

1. **Capgo / CapacitorUpdater (OTA hot-patch)**
   - ❌ web bundle のみ、native plugin 変更追従不可 (v5.1.0 SQLite 追加のような場面で死ぬ)
   - ❌ Capgo account 依存、free tier 越えで有償化リスク

2. **Tasker / MacroDroid 外部 poll**
   - ❌ 外部 app 依存、設定 fragile、デバイス変えたら飛ぶ

3. **Custom server で update manifest 配信**
   - ❌ サーバー追加運用コスト、GitHub で十分

4. **Play Store + release signing**
   - ❌ keystore 管理 + Play Console 設定 + 審査、carve-out 個人 1 台で合わない

## Implementation Order

| # | Scope | Files |
|---|-------|-------|
| 1 | Permission + FileProvider path | `AndroidManifest.xml`, `file_paths.xml` |
| 2 | ApkInstallerPlugin.java + MainActivity register | `ApkInstallerPlugin.java`, `MainActivity.java` |
| 3 | `@capacitor/filesystem` install | `package.json` |
| 4 | auto-update service | `src/services/auto-update.ts` |
| 5 | UpdateBanner component | `src/components/ui/UpdateBanner.tsx` |
| 6 | App root 統合 (Silent / NEXUS v2 / legacy) | `silent/App.tsx`, `redesign/App.tsx`, `App.tsx` |
| 7 | version bump (5.1.0 → 5.2.0) | package.json + defaults.ts + build.gradle + GAS |
| 8 | build + ship | release-apk.sh |

## References

- 既存 release pipeline: `scripts/release-apk.sh`
- canonical APK URL: `https://github.com/yamaga101/ev-manager/releases/latest/download/app-debug.apk`
- GitHub API: `https://api.github.com/repos/yamaga101/ev-manager/releases/latest`
- Android 8+ install permission: https://developer.android.com/reference/android/Manifest.permission#REQUEST_INSTALL_PACKAGES
