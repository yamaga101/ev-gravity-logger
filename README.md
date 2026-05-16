# ev-manager

> ## ⚠️ Project archived (2026-05-17)
>
> このリポジトリは **`movement-log`** にピボットしました。後継アプリ:
> **https://github.com/yamaga101/movement-log** (新 repo、新 Capacitor packageId)
>
> ev-manager は v5.2.2 で凍結 (tag `v5.2.2-final-archive`)。
> v5.2.2 までの Releases は引き続きダウンロード可 (rollback 用)。
> 新しい開発・新リリースはすべて `movement-log` repo で行います。
>
> 移行経緯: ADR-1/2/3 (`docs/specs/system-pivot-*-2026-05-17.md`)。
> Cutover 手順: `docs/specs/system-pivot-cutover-2026-05-17.md` (§D7)。
>
> ---

EV 総合管理アプリ (v5.2.2 final)。Capacitor 7 + Android (S25 Ultra / One UI 8.0 / Android 16)。

## 機能 (v5.2.2 時点)

- 充電ログ / メンテナンス / 点検 / 保険 / 税金 / 車検 登録
- BG GPS 自動ドライブログ (P2 AutoTrip)
- 統計: コスト推移グラフ、SOH 推移グラフ、お気に入り充電スポット
- GAS sync (yamaga101 Spreadsheet)
- 自動アップデート (GitHub Releases polling + ApkInstaller native bridge)

## Pivot 後の所属

ピボット理由・新 domain model・cutover 手順は ADR triplet 参照:

- `docs/specs/system-pivot-to-movement-log-2026-05-17.md` (ADR-1: domain model)
- `docs/specs/system-pivot-storage-backup-2026-05-17.md` (ADR-2: storage + migration)
- `docs/specs/system-pivot-cutover-2026-05-17.md` (ADR-3: cutover sequence)

新アプリ `movement-log` は EV 機能を hard delete し、Timeline+Segments domain で
歩行 / 自転車 / 電車 / 車 すべての移動を local-first SQLite に記録します。

## Carve-out (yamaga101 例外3)

- 全 GAS / Sheets / Drive リソースは yamaga101@gmail.com 配下
- `npm run check-k35` で k35 混入検知
- 詳細: `docs/specs/system-gas-yamaga101-carveout.md`

## Rollback (v5.2.2 復元)

新アプリで問題が発生した場合の手順は `docs/specs/system-pivot-cutover-2026-05-17.md` §D8 参照。
- v5.2.2 APK: [Releases tag v5.2.2](https://github.com/yamaga101/ev-manager/releases/tag/v5.2.2)
- GAS sheet 名は `ev-manager-data-archived-2026-05` → `ev-manager-data` に戻す必要あり
