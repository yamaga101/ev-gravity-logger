---
visibility: internal
---

# APK Distribution (GitHub Releases)

## これは何？

ev-manager の debug APK を **GitHub Releases にアップロード**して S25 Ultra 等の
端末から直接ダウンロードできるようにする自動化 script。

## なぜ Drive じゃないの？

2026-05-06 検証で判明: Google Drive の自動 malware スキャンが **debug 署名 APK を
毎回 flag** する。所有者は引き続きアクセスできるが「リンクを知っている全員」共有が
無効化され、`https://drive.google.com/file/d/.../view` を別端末で開いても
「ドキュメントを開けません 内部エラーが発生しました」になる (実体は ToS ブロック)。

release keystore で signed APK を作れば回避できるが、PoC 段階の毎ビルドに署名する
コストは見合わない。**GitHub Releases は APK を malware スキャンしない**ため、
未署名の debug ビルドでも安定配布できる。

副次効果として:
- yamaga101 GCP の OAuth Client / API Enable / Test User 登録 等が一切不要
- carve-out 例外3 の「k35 混入禁止」を自然に満たす (gh CLI のみに依存)
- version tag (`vX.Y.Z`) と APK が紐づき、ビルド履歴が自動で残る

## どう動いてるの？

```
npm run release-apk
  └─ bash scripts/release-apk.sh
      ├─ package.json から version 抽出 (vX.Y.Z)
      ├─ APK 存在確認 (android/app/build/outputs/apk/debug/app-debug.apk)
      ├─ 既存 release があれば asset 上書き、無ければ新規作成
      │     gh release create v<X.Y.Z> <apk> --latest --title ... --notes ...
      ├─ release page URL / asset URL / latest stable URL を出力
      └─ macOS なら pbcopy で latest URL をクリップボードへ
```

`ship-apk` (`npm run cap:sync && npm run release-apk`) で **build → sync → release**
を 1 発。

### 配布 URL は `/releases/latest/download/` を canonical に

毎 release ごとに URL を貼り替える運用は腐る。GitHub の built-in:

```
https://github.com/yamaga101/ev-manager/releases/latest/download/app-debug.apk
```

これは 302 redirect で **最新 (latest 指定された) release の asset** に飛ぶ。
v4.9.1 → v4.9.2 → v4.10.0 と上がっても URL 自体は同じ。メール本文 / QR コード /
spec / README にはこの URL を貼る運用に統一。

そのため script は `--latest` (= prerelease=false かつ latest フラグ) で release を
作る。debug 署名でも PoC 期間中は配布コスト最小化のため latest 扱いにする。

「まだ表に出したくない」build を作るときだけ `--prerelease` を付ける。
prerelease は `/latest/download/` から除外される。

## 壊れたらどうする？

| 症状 | 対処 |
|---|---|
| `gh: command not found` | `brew install gh` |
| `gh auth status` で expired | `gh auth login` で yamaga101 として再認証 |
| `Tag <vX.Y.Z> already exists` | スクリプトが自動で `--clobber` で asset 上書き対応済 |
| Asset upload で `403` | repo write 権限不足。`gh auth refresh -s repo` |
| 端末で APK タップしても install できない | 「不明な提供元のアプリのインストール」を Drive/Files app に対して許可 |

## 止めたらどうなる？

CI 影響なし。配布が手動 (gh CLI 直叩き or GitHub web UI でアセット添付) に戻るだけ。

## 必要なアカウント・権限

- **GitHub yamaga101 アカウント** のみ (Google アカウント不要)
- `gh` CLI 認証 (scope: `repo`)
- public repo (`yamaga101/ev-manager`) — release アセットは誰でもダウンロード可

## 関連する人・部署

個人作業 (志柿)。会社 GitHub 経由しない。

## 技術メモ (わかる人向け)

### 既存 OAuth Client / Drive 配下リソース (現在は未使用)

| リソース | 状態 | 後始末 |
|---|---|---|
| GCP project `gen-lang-client-0371763712` | OAuth consent screen + 「EV Manager CLI」OAuth Client 作成済 | 残置 (Gemini API Key と共存。将来再利用の可能性) |
| Drive folder「EV Manager builds」 | 2026-05-06 時点で flagged な v4.9.1 APK 1 ファイル | この session で Trash 済 → 30 日後自動完全削除 |
| `~/.config/ev-manager/credentials.json` | PKCE-only Desktop OAuth client | 未使用、削除可 |

### release notes について

`gh release create` の `--notes` で雛形を渡している。重要な変更点は
`docs/logs/YYYY-MM-DD.md` または commit message body に書き、release notes には
「CHANGELOG / logs を参照」とだけ書く運用 (二重管理を避ける)。

### prerelease フラグ

PoC 期間中はデフォルト `--latest` (= 公開 / latest 扱い) にして
`/releases/latest/download/` を機能させる。隠したい debug build のみ
`bash scripts/release-apk.sh --prerelease` で prerelease 化する。

prerelease 化された release は `/latest/download/` から除外され、別途
`/releases/download/v<X.Y.Z>/app-debug.apk` の version 固定 URL を案内する必要がある。

### Drive 旧資産の cleanup について

この script は **Drive 上の旧 APK を削除しない**。Drive を配布チャネルとして
使うのを廃止したため、新 release を作っても Drive 側は touch しない設計。
旧 APK (例: `EV Manager builds/ev-manager-v4.9.1-debug.apk` が flagged 状態で
残っているもの) は Drive web UI で手動 Trash すること。

### gh CLI と Token

`~/.config/gh/hosts.yml` に keyring 経由で OAuth token が格納される。Mac の
keychain と統合されているので chmod 600 等の心配は不要 (キーチェーン側で保護)。
yamaga101 アカウントの `repo` scope token を使用。
