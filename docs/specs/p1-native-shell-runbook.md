---
visibility: internal
---
# P1 ネイティブシェル化 Runbook (Capacitor 7 + Android)

**前提**: P0-1 で `@transistorsoft/capacitor-background-geolocation` 採用決定。本 runbook はファストパス (BG GPS 抜きのシェル) まで。BG GPS は P2 で別途追加。

**対象端末**: Galaxy S25 Ultra / One UI 8.0 / Android 16

## Phase 1: 依存追加 (志柿手作業 5-10分)

### 1-1. node_modules インストール
```bash
cd ~/Projects/ev-manager
npm install
```

エラーなく完了することを確認。`@capacitor/core` `@capacitor/cli` `@capacitor/android` `@capacitor/preferences` が新規追加。

### 1-2. Capacitor init (config はリポジトリに既にある)
```bash
# capacitor.config.ts は既存。npx cap init を再実行する必要なし。
# 直接 sync するだけで OK
npm run build:native
npx cap add android
```

`android/` ディレクトリが生成される (~50MB、Gradle / Android 設定一式)。

### 1-3. Android Studio を Mac にインストール (まだなら)
- https://developer.android.com/studio から Mac 版ダウンロード
- 起動 → SDK Manager で **Android 16 (API 36)** SDK install
- Android Studio で `~/Projects/ev-manager/android` を開いて Gradle sync

### 1-4. 完了報告
ターミナル出力に `✔ create android` が出れば OK。Claude に「Android プラットフォーム追加完了」と教える。

---

## Phase 2: AndroidManifest 設定 (Claude 担当)

`android/app/src/main/AndroidManifest.xml` に以下を追記:
- `INTERNET` (既定)
- `POST_NOTIFICATIONS` (Android 16 必須)
- `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_LOCATION` (P2 BG GPS 用、先行で宣言)
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION` (P2 用、Play Store 審査の正当化文書要)
- `WAKE_LOCK` (FGS 維持)
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` (One UI 電池ケア除外用)

`android/app/build.gradle` の `compileSdk` / `targetSdk` を 36 に。

`MainActivity.java` の plugin 登録は Capacitor 7 の自動構成に任せる。

---

## Phase 3: JSON import 画面の native 対応 (Claude 担当)

既存 `SettingsPanel.tsx` の JSON export/import は **そのまま** Capacitor で動く (Web API の `<input type="file">` と Blob/URL.createObjectURL を Capacitor が転送)。

ただし Token 保管は `@capacitor/preferences` (EncryptedSharedPreferences) に変更:
- `useSettingsStore` の `gasSharedToken` 永続化先を localStorage → Preferences plugin
- web fallback 用に `Capacitor.isNativePlatform()` で分岐

---

## Phase 4: ビルド + 実機転送 (志柿手作業)

### 4-1. APK ビルド
```bash
cd ~/Projects/ev-manager
npm run cap:sync       # vite build --base=./ + cap sync
npx cap open android   # Android Studio が開く
```

Android Studio で:
- 上部 ▶ ボタン → デバイスに **Galaxy S25 Ultra (USB 接続)** を選択 → Run
- もしくは Build → Build Bundle(s) / APK(s) → APK
- 生成された `app-debug.apk` を S25 Ultra に転送 (USB or adb push)

### 4-2. 動作確認 (S25 Ultra)
1. インストール → 起動
2. 既存 PWA を Chrome で開く → 設定 → JSON エクスポート → ファイルダウンロード
3. ネイティブアプリ → 設定 → JSON インポート → ダウンロードしたファイル選択 → 既存データが復元
4. GAS URL / Token は新環境のものを入力 (or PWA settings から JSON 経由で復元される)
5. 充電ログを 1 件追加 → yamaga101 Sheet に書き込まれることを Mac で MCP 確認

---

## Phase 5: 課題リスト (P2 着手前)

- 充電タブ等の touch UX 確認 (Web ベース UI が指タップで使いやすいか)
- ステータスバー / セーフエリア対応 (Capacitor Status Bar plugin)
- スプラッシュ画面 (Capacitor Splash Screen plugin)
- アイコン作成 (1024x1024 マスター → cap-icon-generator)
- ホーム長押しでアプリインストール時のショートカット動作
- BG GPS は P2 で transistorsoft 導入時に集中対応

## トラブル対応

| 症状 | 対処 |
|---|---|
| `npm install` で peer-dep エラー | `npm install --legacy-peer-deps` |
| Gradle sync 失敗 | Android Studio → File → Invalidate Caches |
| Java 17 が必要と言われる | `brew install openjdk@17` + `JAVA_HOME` 設定 |
| `npx cap sync` で webDir not found | `npm run build:native` 先に走らせる |
| 起動時に白画面 | `vite.config.ts` の `base` が `/ev-manager/` のままビルドされている可能性。`build:native` スクリプトを使ったか確認 |
| アプリが TLS エラー | `server.androidScheme: "https"` を確認 |
