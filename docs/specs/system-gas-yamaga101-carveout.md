---
visibility: internal
---
# ev-manager — yamaga101 carve-out

## これは何？
ev-manager（EV 総合管理 PWA → Capacitor Android ネイティブ移行中）の
データ同期バックエンドを **shigaki@k35.jp から yamaga101@gmail.com へ
逆移行**する取り決め。GAS Apps Script、紐付き Spreadsheet、Drive 写真
フォルダ（B案 staging）の全リソースが対象。

## なぜあるの？
ev-manager は個人車両（EV）の充電・整備・点検・保険・税金・車検・
ドライブログを管理する個人用アプリ。会社 Workspace（k35）のリソースを
使う必然性がない（業務データではない）。

cx-fxbot（FX bot）・yt-player（個人視聴履歴）と同じ判断基準で carve-out
する。退職時の切り離し容易性、コンプライアンス（個人活動の会社資産分離）、
Capacitor ネイティブ化に伴う新環境構築の機会を活かして実施。

直前のコミット `a9a8905` (2026-04 yamaga101 → k35 移行) を逆向きに
巻き戻す形になる。

## どう動いてるの？
- アプリ: `src/store/useSyncStore.ts` の `syncSend` が
  `Settings.gasUrl` (yamaga101 デプロイ URL) に POST。共有 Token
  ヘッダー認証
- 受信側: yamaga101@gmail.com の Spreadsheet「EV Manager Sync」に
  バインドされた Apps Script (`gas/Code.gs`) が doPost で各シート
  (charging / drivelog / maintenance / inspection / insurance / tax /
  registration / snapshot) に書込
- Web App は **アクセス: 全員 / 実行: yamaga101 自身** でデプロイ
- 共有 Token は `rotateSharedToken()` で発行、PWA Settings に貼って
  保存。Capacitor ネイティブ化後は EncryptedSharedPreferences で保管

## 壊れたらどうする？
1. Apps Script の「実行 → 実行記録」でエラー確認
2. Web App 再デプロイ (`clasp deploy -i <既存 deployment ID>` で上書き)
3. PWA Settings の GAS URL は変えない（既存 deployment ID を再利用すれば
   URL 不変）
4. Token 失効時は `rotateSharedToken()` 再実行 → PWA Settings に新 Token

## 止めたらどうなる？
GAS 同期が機能しなくなる。LocalStorage（PWA）/ AsyncStorage 相当
（ネイティブ）のローカルデータは残るので単独利用は継続可能。
複数端末横断や履歴バックアップは失われる。

## 必要なアカウント・権限
- yamaga101@gmail.com (Spreadsheet 所有 + Apps Script 実行)
- アプリ側からの匿名 POST + Token ヘッダー認証 (公開 Web App)
- Drive スコープ (B案 staging で写真処理する場合)

## 関連する人・部署
個人利用扱い。会社 (k35) リソースは使わない (cx-fxbot / yt-player と
同列の carve-out)。

## 技術メモ（わかる人向け）

### 旧リソース (k35 配下、廃止予定)
- 旧 scriptId: `1Wlj5nwZLrZ2aPbnpFohJGEIUtJveMXlKJm9uoYuT9H0dq7b1xl_k1--C`
- 旧 SpreadsheetID: `1Cvn4oUoN7lsd5VW0MufgwSwrdNC-LE9VbPwZ2eG0cvA` (gas/Code.gs L22 hardcoded)
- M-1〜M-4 完了後、M-5 で archive → 30日後削除

### 新リソース (yamaga101 配下、M-1〜M-2 で構築)
- 新 SpreadsheetID: `TBD` (M-2 で確定)
- 新 Apps Script ID: `TBD` (M-1 で確定)
- 新 Deployment ID: `TBD` (M-1 で確定)
- **新 Web App exec URL**: `TBD` (M-1 で確定)

### Deployment Runbook (M-1)
1. yamaga101 で `clasp login` (`~/.clasprc.json` を chmod 600 に再設定)
2. `https://sheets.new` を yamaga101 ログイン状態で開き、タイトル
   「EV Manager Sync」に変更
3. 拡張機能 → Apps Script → 既存 `gas/Code.gs` を貼って保存。
   `appsscript.json` の OAuth scope を移植 (script.scriptapp、
   script.external_request、spreadsheets、drive 等)
4. デプロイ → 新しいデプロイ → ウェブアプリ
   - 説明: `EV Manager Sync v4.6.1 (yamaga101)`
   - 実行: 自分 (yamaga101)
   - アクセス: 全員
5. 権限承認 → 新 Web App URL をコピー
6. `gas/.clasp.json` の `scriptId` を新 ID に書換 → コミット (Token は
   含めない)
7. M-3 で PWA Settings の GAS URL 差替・Token 再設定

### M-4 ガード設置
- `scripts/check-no-k35.sh` を cx-fxbot から移植
  - 検査パターン: `shigaki@k35\.jp\|GoogleDrive-shigaki@k35`
  - 検査対象: `.sh .ps1 .py .js .ts .tsx .gs .json .plist .yml .yaml`
  - 除外: `docs/` (歴史的記録の保持を許容)、`.git/`、`node_modules/`、
    `dist/`、`build/`
- `.husky/pre-commit` または `package.json` scripts に
  `precommit: bash scripts/check-no-k35.sh --staged` を追加
- GitHub Actions に `check-no-k35` job を追加

### Capacitor ネイティブ化 (P1+) との接続
- Capacitor Android シェルからも同じ yamaga101 GAS を叩く
  (URL/Token 共通)
- Token は **EncryptedSharedPreferences** に保管
  (`@capacitor/preferences` + native android encrypted backend)
- ネイティブからの fetch は CORS 不要 (WebView でなく native HTTP
  client を使えば回避可能、ただし CapacitorHttp プラグインで CORS
  迂回が標準)

### 仕様変更履歴
- 2026-05-02 v1.0: yamaga101 carve-out spec 作成 (本ドキュメント)。
  M-1〜M-5 着手前
