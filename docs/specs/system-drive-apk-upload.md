---
visibility: internal
---

# Drive APK Upload (yamaga101)

## これは何？

ev-manager の debug APK を **yamaga101 Drive にアップロードして自分にメール通知** する自動化 script。
S25 Ultra の Drive app から install できる「公開リンク」を毎回手作りせずに済ませる。

## なぜあるの？

- USB 直転送 (`npm run cap:run`) は端末が adb に出ないと固まる (USB デバッグ・端末認可・ケーブル状態に依存)
- 手動で Drive web UI に D&D → 共有設定 → リンク取得 → メール作成だと毎回 30 秒ロス
- carve-out 例外3 で yamaga101 配下に閉じた経路を保つ必要がある (k35 混入禁止)

## どう動いてるの？

```
npm run upload-apk
  └─ python3 scripts/upload-apk-to-drive.py
      ├─ ~/.config/ev-manager/credentials.json で OAuth 認証
      │    (token.json が無ければブラウザを開いて初回認可、以降は refresh)
      ├─ Drive 「EV Manager builds」フォルダを ensure (root 直下)
      ├─ ev-manager-vX.Y.Z-debug.apk として upload (同名は上書き)
      ├─ 「リンクを知っている全員 / 閲覧者」で共有設定
      ├─ webViewLink を取得
      └─ Gmail で yamaga101@gmail.com 宛に件名 [EV Manager] APK vX.Y.Z build link で送信
```

`ship-apk` script (`npm run cap:sync && npm run upload-apk`) を使うと **build → upload → メール** をワンショット。

## 壊れたらどうする？

| 症状 | 対処 |
|---|---|
| `credentials.json が無い` で落ちる | Setup 手順 (下記) を実行 |
| `invalid_grant` で refresh が落ちる | `~/.config/ev-manager/token.json` 削除 → 再 run でブラウザ認証やり直し |
| Drive アップロードで `403 quotaExceeded` | yamaga101 Drive の容量不足。古い APK を Trash |
| Gmail が `accessNotConfigured` で送信失敗 | cx-dict 流用 GCP project で Gmail API 未有効。`https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=830466619863` で enable。enable まではメールは warn で skip され、リンクは print から手動コピー可 |
| Gmail 送信が `400 invalid To` 等 | RECIPIENT (script 内定数) が壊れていないか確認 |

## 止めたらどうなる？

止めても build は壊れない (`npm run cap:run` は引き続き使える)。
PoC 期間中の APK 共有 flow が手動 D&D に戻るだけ。

## 必要なアカウント・権限

- **yamaga101 Google アカウント** のみ。k35 混入禁止
- yamaga101 GCP project の OAuth Desktop Client (cx-dict 流用 OK、同一 project)
- スコープ: `drive.file` + `gmail.send` (最小権限)

## 関連する人・部署

個人作業 (志柿)。会社 Workspace 経由しない。

## 技術メモ (わかる人向け)

### Setup (初回のみ)

#### Option A — cx-dict の OAuth Client を流用 (推奨・即動く)

同一 yamaga101 GCP project の Desktop Client を共有する。token.json は別物 (scope が違う)
ので干渉しない。

```bash
mkdir -p ~/.config/ev-manager && chmod 700 ~/.config/ev-manager
cp ~/.config/cx-dict/credentials.json ~/.config/ev-manager/credentials.json
chmod 600 ~/.config/ev-manager/credentials.json
npm run upload-apk
# 初回はブラウザが開く → yamaga101 でログイン → Drive + Gmail 認可
# token.json が ~/.config/ev-manager/ に生成されて以降は無人で動く
```

#### Option B — yamaga101 GCP で新規 OAuth Desktop Client を作成

cx-dict との結合を嫌う場合。
[GCP Console (yamaga101)](https://console.cloud.google.com/apis/credentials) →
「OAuth クライアント ID」→ アプリの種類 = Desktop → 作成 → JSON ダウンロード →
`~/.config/ev-manager/credentials.json` に配置 (chmod 600) → `npm run upload-apk`。

### Token / Credentials のパス規約

| ファイル | パス | 権限 |
|---|---|---|
| OAuth Desktop Client config | `~/.config/ev-manager/credentials.json` | 600 |
| Refresh + access token | `~/.config/ev-manager/token.json` | 600 |

`~/.config/google-api/` の共用パスは使わない (life-tasks 等と混在するため。cx-dict
carve-out 文書と同じ判断)。

### Drive 構造

- ルート直下に「EV Manager builds」フォルダ (script が初回作成)
- ファイル名: `ev-manager-vX.Y.Z-debug.apk` (X.Y.Z は package.json の version)
- 同名アップロードは上書き (file id を保持して update、リンクが変わらない)

### k35 不混入の確認

```bash
npm run check-k35   # scripts/check-no-k35.sh
```

CI (`.github/workflows/k35-check.yml`) でも push/PR 時に検査される。
