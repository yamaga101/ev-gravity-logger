# M-1 Runbook: GAS を yamaga101 へ複製・新デプロイ

**目的**: ev-manager の Apps Script + Spreadsheet を k35 → yamaga101 carve-out (例外3) する。
**所要**: 志柿の手作業 ~10分 + Claude 引取り後の自動処理 ~5分。

## 旧 (k35) リソース
- scriptId: `1Wlj5nwZLrZ2aPbnpFohJGEIUtJveMXlKJm9uoYuT9H0dq7b1xl_k1--C`
- SpreadsheetID: `1Cvn4oUoN7lsd5VW0MufgwSwrdNC-LE9VbPwZ2eG0cvA`

---

## Phase A — 志柿手作業 (yamaga101 で実施)

### A-1. clasp を yamaga101 で再ログイン
ターミナルで:
```bash
# 既存の k35 認証を別名退避（後で復元可能に）
mv ~/.clasprc.json ~/.clasprc.k35.json.bak 2>/dev/null

# yamaga101 でログイン (ブラウザ起動)
clasp login
# → ブラウザで yamaga101@gmail.com を選択 → 承認

# 権限 600 確認
chmod 600 ~/.clasprc.json
```

### A-2. yamaga101 で新 Spreadsheet 作成
1. `https://sheets.new` を yamaga101 ログイン状態で開く
2. タイトルを **「EV Manager Sync」** に変更
3. URL から SpreadsheetID をコピー (例: `https://docs.google.com/spreadsheets/d/{ID}/edit`)
4. **新 SpreadsheetID をメモして Claude に教える**

### A-3. Apps Script プロジェクト作成
1. 上記 Spreadsheet の **拡張機能 → Apps Script** クリック
2. 開いた Apps Script エディタの **プロジェクト名を「EV Manager Sync」** に変更
3. URL の `/projects/{ID}/` から **scriptId をコピー**
4. **scriptId を Claude に教える**

→ ここまで終わったら Claude にバトンタッチ。

---

## Phase B — Claude 引取り (志柿が ID 2つを伝えた後)

### B-1. gas/.clasp.json を新 scriptId に書換
```json
{
  "scriptId": "<NEW_SCRIPT_ID>",
  "rootDir": ".",
  ...
}
```

### B-2. gas/Code.gs の SPREADSHEET_ID を新 ID に書換
- L22 `var SPREADSHEET_ID = "<NEW_SPREADSHEET_ID>";`

### B-3. gas/appsscript.json の OAuth scopes を必要分追加
現状:
```json
"oauthScopes": ["https://www.googleapis.com/auth/script.scriptapp"]
```
必要 scopes:
- `script.scriptapp` (既存)
- `spreadsheets` (シート読み書き)
- `script.external_request` (CORS preflight, fetch 用途あれば)
- `drive` (B案 staging 用、現状未使用なら省略可)

### B-4. clasp push
```bash
cd gas
clasp push -f   # 新プロジェクトに Code.gs / appsscript.json アップ
```

### B-5. clasp deploy (新規 deployment)
```bash
clasp deploy --description "EV Manager Sync v4.6.2 (yamaga101)"
# → deploymentId と Web App URL が表示される
```

→ Web App URL は **アクセス: 全員 / 実行: 自分 (yamaga101)** で初回承認が必要 (志柿が手動で許可)。

---

## Phase C — 志柿手作業 (Web App 公開承認)

### C-1. 初回権限承認
1. Apps Script エディタで **デプロイ → デプロイを管理** を開く
2. B-5 で作った Deployment の **設定 (歯車)** クリック → 編集モード
3. **アクセス: 全員 (匿名含む)** を確認 → デプロイ
4. 権限承認ダイアログで **詳細 → (安全でないページに移動) → 許可** (個人スクリプトなので Google の警告は出る)

### C-2. rotateSharedToken() 実行
1. Apps Script エディタの関数ドロップダウンで **`rotateSharedToken`** を選択 → 実行
2. 実行ログに新 Token が表示される → コピー

→ Token を Claude に伝えて M-3 へ。

---

## Phase D — Claude 引取り (M-2 / M-3 完了)

### D-1. M-2 旧データ移管
旧 SpreadsheetID `1Cvn4oUoN7lsd5VW0MufgwSwrdNC-LE9VbPwZ2eG0cvA` から:
- 各シート (charging / drivelog / maintenance / inspection / insurance / tax / driveLog) を CSV export
- 新 Spreadsheet に import (またはシートコピー機能で直接複製)
- ※GAS の `getOrCreateSheet` がヘッダ自動生成するので空でも動くが、履歴保全のため移管推奨

### D-2. M-3 PWA Settings 差替
PWA を起動し:
1. 設定 → GAS URL に Phase B-5 で得た Web App URL を入力
2. 設定 → 共有 Token に Phase C-2 の Token を入力
3. 設定 → 「Test 接続」ボタンで疎通確認
4. 既存 Charging/DriveLog レコードを 1件追加 → 新 Spreadsheet に書き込まれることを確認

### D-3. M-2 完了後 carve-out spec 更新
`docs/specs/system-gas-yamaga101-carveout.md` の TBD 3箇所 (新 SpreadsheetID / Apps Script ID / Web App URL) を実値に書換。

### D-4. commit
```
chore: migrate GAS from k35 to yamaga101 (carve-out 例外3)

旧 scriptId 1Wlj5n... を yamaga101 配下の新 scriptId に置換。
SpreadsheetID も新環境に切替。

詳細: docs/specs/system-gas-yamaga101-carveout.md
```

---

## チェックリスト (M-1〜M-4 完了判定)

- [ ] yamaga101 で `clasp login` 完了 (chmod 600)
- [ ] 新 SpreadsheetID 取得 → carve-out spec に記録
- [ ] 新 scriptId 取得 → gas/.clasp.json 更新
- [ ] Code.gs L22 SPREADSHEET_ID を新 ID に
- [ ] appsscript.json OAuth scopes 拡張
- [ ] clasp push / deploy 成功
- [ ] Web App URL 取得 → carve-out spec に記録
- [ ] rotateSharedToken 実行 → Token 取得
- [ ] PWA Settings に新 URL + Token 設定
- [ ] Test 接続 OK
- [ ] 1件レコード追加 → 新 Sheet 反映確認
- [ ] `npm run check-k35` → exit 0
- [ ] commit + push (CI で k35-check 通過)

→ 全 ✅ で M-5 (旧 k35 廃止) 着手解禁。
