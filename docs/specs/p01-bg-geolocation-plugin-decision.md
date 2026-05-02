---
visibility: internal
---
# P0-1 — BG Geolocation plugin 決定

## 結論
**`@transistorsoft/capacitor-background-geolocation` 採用 ($499)**

Gemini 3.1 Pro 調査 (2026-05-03) に基づく Council 判断。

## 比較サマリ

| 評価軸 | A) `@capacitor-community` (Free) | B) `@transistorsoft` ($499) |
|---|---|---|
| Capacitor 7 対応 | △ Issue で有志がパッチ対応中 | ◎ v5.x 系で公式対応済 |
| Android API 36 対応 | △ FGS 12 時間制限でクラッシュ報告あり | ◎ FGS 自動再起動など完全対応 |
| One UI 8.0 Deep Sleep 回避 | × Kill されやすい | ◎ Samsung 固有処理・回避策内蔵 |
| Trip Detection 精度 | △ OS 標準 API 依存、誤検知あり | ◎ 機械学習ベースで高精度 |
| バッテリー (1日) | 8〜12% | 3〜5% (motionchange 起動のみ) |
| 既知バグ (GitHub) | API 36 権限周り未解決 issue 多数 | 軽微な型エラーのみ (即日修正) |
| TypeScript 型 | ◯ | ◎ (厳密かつ高度) |

## 採用根拠

1. 6 週間の短納期で API 36 / One UI 8.0 の OS 仕様を自社実装するリスクが過大
2. アプリ Kill 時生存性 + Trip 検出精度 + 省電力性が商用品質
3. ライセンス費 \$499 (~¥75,000) は工数削減で即回収

## Android 16 (API 36) 対応要点

- **POST_NOTIFICATIONS 必須化**: Capacitor 標準 `@capacitor/local-notifications` で許可取得
- **FGS タイプ宣言**: `AndroidManifest.xml` に `<service ... android:foregroundServiceType="location" />` 必須
- **12 時間 FGS 上限**: B プラグインの「停止直前 WorkManager 経由で再スケジュール」機能で回避
- **Play Store 審査文言例**: 「EV の走行履歴を自動検知し、バックグラウンドで充電残量予測および GAS 連携を行うため、`ACCESS_BACKGROUND_LOCATION` が不可欠」

## One UI 8.0 specific

- **「制限なし」アプリ追加 deep link**:
  - 標準: `android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS`
  - One UI 8.0 直接遷移: `com.samsung.android.sm.ACTION_BATTERY_UNRESTRICTED`
- **誘導 UX**: オンボーディングで GIF 動画 → Intent で設定画面へ
- **Adaptive battery 対策**: B プラグインの Heartbeat 機能 (定期 AlarmManager 発火) で Deep Sleep 移行を OS レベルで妨害

## 出典
- [Capacitor 7 Release Notes](https://capacitorjs.com/docs/updating/7-0)
- [TransistorSoft Background Geolocation](https://transistorsoft.com/)
- [Android 16 Behavior Changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- [Don't kill my app! (Samsung)](https://dontkillmyapp.com/samsung)

## 次アクション

- P0-3 PoC: B プラグインの評価版で 3 日連続 BG 測位生存テスト
- P1 着手時に正式ライセンス購入判断 (PoC 通過確認後)
