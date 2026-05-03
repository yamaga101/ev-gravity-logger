# Project: EV Manager — Personal EV Total Management App

## What this app does
個人 EV (電気自動車) の総合管理 PWA → Capacitor 7 Android ネイティブ移行中のアプリ。家族で共有しないオーナー専用 (= 1ユーザー想定)。日本語 UI。

## Stack (output must match)
- React 19 + TypeScript
- Tailwind CSS v4 (`@theme` directive で token を定義)
- Capacitor 7 Android (S25 Ultra ターゲット / One UI 8.0 / Android 16)
- Vite ビルド
- 自作 UI primitives (BottomNav, Modal, ProgressRing, Toast)
- 状態管理: zustand
- i18n: i18next (現状日本語のみ)

## Output format request
- `tokens.css`: Tailwind v4 `@theme { --color-*: ...; }` 形式 (yt-player と同様)
- `*.tsx` modules: React 19 + Tailwind class ベース (TouchableOpacity 等の RN 系は使わない)
- 単一の HTML design canvas で全画面を artboard 配置
- design canvas には breakpoint 別 artboards を含める

## Breakpoints (artboards)
| Name | Size | Use |
|---|---|---|
| S25U Portrait (primary) | 412 × 915 | Capacitor 実機メイン |
| S25U Landscape | 915 × 412 | 横画面 (運転中ドライブログ) |
| Tablet Portrait (optional) | 800 × 1280 | 将来のタブレット対応 |

## Screens (10 sections)
全画面を artboards で並べてください。BottomNav による主要 5 タブ + サブ画面構成。

### 主要 5 タブ (BottomNav)
1. Charging — 充電ログ
   - StartChargingForm: 充電器選択, kWh, 料金, タイムスタンプ
   - LiveChargingScreen: 進行中の SOC・経過時間・実効レート
   - CompletionSummary: kWh, 料金, kWh単価, 完了 SOC
2. History — 充電・メンテ・点検の統合タイムライン (フィルタ: 種別 / 期間)
3. Stats — 統計ダッシュボード
   - コスト推移グラフ (月次)
   - SOH 推移グラフ
   - 走行距離 / 平均電費
   - お気に入り充電スポット
4. Vehicle — 車両情報
   - 車両基本情報 (型式・年式・購入日)
   - InsuranceSection: 加入中 + 履歴
   - TaxSection: 自動車税・重量税
   - 車検 (Inspection registration)
5. Settings — 設定
   - GAS sync (Google Apps Script) 設定
   - リマインダー通知 ON/OFF
   - BG GPS (移動ログ自動記録) 設定 — Foreground service notification あり
   - データエクスポート / インポート

### サブ画面
6. Maintenance — メンテナンス記録 (タイヤ交換等)
7. Inspection — 点検記録 (12ヶ月点検)
8. Meter Capture — 走行距離メーター画像キャプチャ + OCR
9. Onboarding — 初回起動 walkthrough
10. Help — ヘルプ・FAQ

## Current theme: "NEXUS Deep Space Command Interface"
SF / サイバー系のダークテーマ。継続するか刷新するかは下記 Direction で指定。

### Current tokens (継続する場合のベース)
- Primary: Cyber Cyan #00F0FF / dim #00A8B3
- Secondary: Electric Violet #7B61FF
- Charging: Plasma Green #39FF14
- Status: warning #FFB800 / error #FF3D57
- Surfaces (Deep Space): void #030712 / deep #0A0F1E / panel rgba(10,15,30,0.85) / elevated rgba(15,23,42,0.9)
- Text: bright #F0F6FF / mid #8899B3 / dim #6B7A8E
- Typography: Orbitron (display) / JetBrains Mono (mono) / Exo 2 + Noto Sans JP (sans)

特徴:
- アニメーション付き grid 背景 (nexus-grid-bg)
- ambient glow orbs (深度演出)
- glass surface (panel に rgba 透過 + blur)

## Design Direction (1 つ選ぶか、3 案並べて比較生成してください)

### A. NEXUS の "進化" (推奨度 ★★★)
- 配色維持・コンポーネントだけリファイン
- typography をモダン化 (Orbitron → Sora や Space Grotesk 等)
- glass surface のクオリティ向上 (border / blur / depth)

### B. テーマ完全置換 (推奨度 ★★)
- 候補: iOS 26 風 / Material You 動的テーマ / Cyber Tactical (軍用 HUD) / Tesla Model Y dashboard 系

### C. 機能優先・装飾削減 (推奨度 ★)
- グラデ・glow 全廃、フラット化
- 視認性最優先 (運転中の使用想定)

## Constraints (重要)
- Foreground service notification 表示中: BG GPS plugin が Android 通知バーに常駐通知を出す → アプリ内の "BG GPS status" 表示は通知と二重化しないよう簡素化
- GAS sync 状態: Settings 画面に sync OK/NG バッジが必要
- Reminder banner: 全画面共通の最上部に表示される可能性あり (車検期限切れ警告等)
- 片手操作前提: BottomNav 主要操作 + 主アクションは画面下半分
- safe-area v4.8.0 対応済み: edge-to-edge レイアウト前提 (env(safe-area-inset-*) 使用可)

## Component map (output が参照すべきもの)
- src/components/ui/: BottomNav, Modal, ProgressRing, Toast, Starfield, ReminderBanner, ErrorBoundary
- src/components/charging/: StartChargingForm, LiveChargingScreen, CompletionSummary
- src/components/maintenance/: MaintenanceTab, AddMaintenanceForm, AddInspectionForm
- src/components/vehicle/: VehicleTab, VehicleInfoSection, InsuranceSection, AddInsuranceForm, TaxSection
- src/components/stats/: StatsDashboard
- src/components/history/, inputs/, meter-capture/, onboarding/, help/, settings/

## Deliverables checklist
- EV Manager Redesign.html — 全画面 artboard を並べた design canvas
- tokens.css — Tailwind v4 `@theme` 形式の新トークン
- BottomNav.tsx — 5 タブ底部ナビ
- ChargingScreen.tsx (主要 1 画面パイロット)
- StatsDashboard.tsx (主要 1 画面パイロット)
- Rationale section: なぜそのデザイン判断にしたか
- Component map: どの token / class が既存コードのどこに対応するか

## Out of scope (今回は触らない)
- BG GPS plugin の挙動 (PoC 評価期間中、2026-05-06 まで凍結)
- データモデル / GAS sync 仕様
- 認証フロー
- i18n 多言語化 (現状日本語のみで OK)

## yt-player との関係
yt-player プロジェクトで使った手法 (HTML canvas + tokens.css + JSX modules + Rationale) と同じフォーマット・同じ品質基準で頼みます。Tailwind v4 @theme 形式は流用 OK。配色テーマは EV manager 用 (車・電力系) に最適化してください。

まず Direction A (NEXUS evolution) ベースで最初の design canvas を作って、その後 B との比較が必要なら別 iteration で。
