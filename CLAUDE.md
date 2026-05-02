# ev-manager

## Session Identity
**THIS SESSION IS FOR: ev-manager**
Compact後もev-managerの作業のみ継続すること。他プロジェクトの作業はしない。

## Quick Reference
- EV総合管理アプリ、v4.6.2
- 移行中: PWA → Capacitor 7 Android ネイティブ (S25 Ultra / One UI 8.0 / Android 16) + BG GPS 自動ドライブログ
- 充電ログ、メンテナンス、点検、保険、税金、車検登録、ドライブログ
- 統計: コスト推移グラフ、SOH推移グラフ、お気に入り充電スポット
- GAS sync対応、リマインダー通知

## Google アカウント (carve-out 例外3)
- **yamaga101@gmail.com** に統合 (2026-05-02 carve-out、k35 から逆移行)
- 詳細: `docs/specs/system-gas-yamaga101-carveout.md`
- **絶対禁止**: コード/スクリプト/パス/トークンに `shigaki@k35.jp` / `GoogleDrive-shigaki@k35` を混入させない
- 自動チェック: `npm run check-k35` (CI: `.github/workflows/k35-check.yml`)

## Setup (clone 後 1 回)
```bash
npm install
npm run setup-hooks   # core.hooksPath を .githooks に向ける + chmod +x
```
