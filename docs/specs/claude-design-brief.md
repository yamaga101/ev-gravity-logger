---
visibility: private
---
# ev-manager — Claude Design Redesign Brief

claude.ai/design (Claude Design) で UI リデザインを依頼するための brief パケット。
yt-player と同様のフロー (HTML canvas + tokens.css + JSX modules → コードへ手動適用) を想定。

## How to use
1. claude.ai/design で新規プロジェクト作成 (例: "EV Manager UI Redesign")
2. 下の「Brief (paste this)」セクションを丸ごとコピーして最初のメッセージに貼る
3. 出力された tokens.css + JSX をローカルにダウンロード or copy
4. このセッションの Claude Code に「Claude Design 出力を適用して」と指示 → 実コードに統合

---

## Brief (paste this)

```
# Project: EV Manager — Personal EV Total Management App

## What this app does
個人 EV (電気自動車) の総合管理 PWA → Capacitor 7 Android ネイティブ移行中のアプリ。
家族で共有しないオーナー専用 (= 1ユーザー想定)。日本語 UI。

## Stack (output must match)
- React 19 + TypeScript
- Tailwind CSS v4 (`@theme` directive で token を定義)
- Capacitor 7 Android (S25 Ultra ターゲット / One UI 8.0 / Android 16)
- Vite ビルド
- 自作 UI primitives (BottomNav, Modal, ProgressRing, Toast)
- 状態管理: zustand (store/)
- i18n: i18next (現状日本語のみ)

## Output format request
- `tokens.css`: Tailwind v4 `@theme { --color-*: ...; }` 形式 (yt-player と同様)
- `*.tsx` modules: React 19 + Tailwind class ベース (TouchableOpacity 等の RN 系は使わない)
- 単一の HTML design canvas で全画面を artboard 配置
- design canvas には breakpoint 別 artboards を含める (下記 Breakpoints 参照)

## Breakpoints (artboards)
| Name | Size | Use |
|---|---|---|
| **S25U Portrait** (primary) | 412 × 915 | Capacitor 実機メイン |
| **S25U Landscape** | 915 × 412 | 横画面 (運転中ドライブログ) |
| **Tablet Portrait** (optional) | 800 × 1280 | 将来のタブレット対応 |

## Screens (10 sections)
全画面を artboards で並べてください。BottomNav による主要 5 タブ + サブ画面構成。

### 主要 5 タブ (BottomNav)
1. **Charging** — 充電ログ
   - 開始フォーム (StartChargingForm): 充電器選択, kWh, 料金, タイムスタンプ
   - 充電中ライブ画面 (LiveChargingScreen): 進行中の SOC・経過時間・実効レート
   - 完了サマリ (CompletionSummary): kWh, 料金, kWh単価, 完了 SOC
2. **History** — 履歴
   - 充電・メンテ・点検の統合タイムライン
   - フィルタ (種別 / 期間)
3. **Stats** — 統計ダッシュボード
   - コスト推移グラフ (月次)
   - SOH 推移グラフ
   - 走行距離 / 平均電費
   - お気に入り充電スポット
4. **Vehicle** — 車両情報
   - 車両基本情報 (型式・年式・購入日)
   - 保険セクション (InsuranceSection): 加入中 + 履歴
   - 税金セクション (TaxSection): 自動車税・重量税
   - 車検 (Inspection registration)
5. **Settings** — 設定
   - GAS sync (Google Apps Script) 設定
   - リマインダー通知 ON/OFF
   - BG GPS (移動ログ自動記録) 設定 — Foreground service notification あり
   - データエクスポート / インポート

### サブ画面
6. **Maintenance** — メンテナンス記録 (タイヤ交換等)
7. **Inspection** — 点検記録 (12ヶ月点検)
8. **Meter Capture** — 走行距離メーター画像キャプチャ + OCR
9. **Onboarding** — 初回起動 walkthrough
10. **Help** — ヘルプ・FAQ

## Current theme: "NEXUS Deep Space Command Interface"
SF / サイバー系のダークテーマ。継続するか刷新するかは下記 Direction で指定。

### Current tokens (継続する場合のベース)
```css
@theme {
  /* Primary: Cyber Cyan */
  --color-nexus-cyan: #00F0FF;
  --color-nexus-cyan-dim: #00A8B3;

  /* Secondary: Electric Violet */
  --color-nexus-violet: #7B61FF;

  /* Charging: Plasma Green */
  --color-nexus-green: #39FF14;

  /* Status */
  --color-nexus-warning: #FFB800;
  --color-nexus-error: #FF3D57;

  /* Surfaces - Deep Space */
  --color-space-void: #030712;
  --color-space-deep: #0A0F1E;
  --color-space-panel: rgba(10, 15, 30, 0.85);
  --color-space-elevated: rgba(15, 23, 42, 0.9);

  /* Text */
  --color-text-bright: #F0F6FF;
  --color-text-mid: #8899B3;
  --color-text-dim: #6B7A8E;

  /* Typography */
  --font-display: "Orbitron", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --font-sans: "Exo 2", "Noto Sans JP", sans-serif;
}
```

特徴:
- アニメーション付き grid 背景 (`nexus-grid-bg`)
- ambient glow orbs (深度演出)
- glass surface (panel に rgba 透過 + blur)

## Design Direction (選んでください、複数可)

### A. NEXUS の "進化" (推奨度: ★★★)
- 配色は維持・コンポーネントだけリファイン
- typography をモダン化 (Orbitron → Sora や Space Grotesk 等)
- glass surface のクオリティを上げる (border / blur / depth)

### B. テーマ完全置換 (推奨度: ★★)
- 候補:
  - **iOS 26 風**: Apple HIG 準拠、白背景 + 強アクセント
  - **Material You 動的テーマ**: Pixel 系
  - **Cyber Tactical**: 軍用 HUD 系 (NEXUS の路線継続だがより硬派)
  - **Tesla Model Y dashboard 系**: ミニマル・グレー・ドライバー視認性
- 1 案だけ選ぶか、3 案並べて比較生成

### C. 機能優先・装飾削減 (推奨度: ★)
- グラデ・glow 全廃、フラット化
- 視認性最優先 (運転中の使用想定)

## Constraints (重要)
- **Foreground service notification 表示中**: BG GPS plugin が Android 通知バーに常駐通知を出す → アプリ内の "BG GPS status" 表示は通知と二重化しないよう簡素化
- **GAS sync 状態**: Settings 画面に sync OK/NG バッジが必要
- **Reminder banner**: 全画面共通の最上部に表示される可能性あり (車検期限切れ警告等)
- **片手操作前提**: BottomNav 主要操作 + 主アクションは画面下半分
- **safe-area v4.8.0 対応済み**: edge-to-edge レイアウト前提 (env(safe-area-inset-*) 使用可)

## Component map (output が参照すべきもの)
```
src/components/
├── ui/                 ← primitive (BottomNav, Modal, ProgressRing, Toast, Starfield, ReminderBanner, ErrorBoundary)
├── charging/           ← StartChargingForm, LiveChargingScreen, CompletionSummary
├── maintenance/        ← MaintenanceTab, AddMaintenanceForm, AddInspectionForm
├── vehicle/            ← VehicleTab, VehicleInfoSection, InsuranceSection, AddInsuranceForm, TaxSection
├── stats/              ← StatsDashboard
├── history/            ← (timeline)
├── inputs/             ← (form fields)
├── meter-capture/      ← (OCR)
├── onboarding/         ← (walkthrough)
├── help/               ← (FAQ)
└── settings/           ← (GAS sync, reminders, BG GPS)
```

## Deliverables checklist
- [ ] `EV Manager Redesign.html` — 全画面 artboard を並べた design canvas
- [ ] `tokens.css` — Tailwind v4 `@theme` 形式の新トークン
- [ ] `BottomNav.tsx` — 5 タブ底部ナビ
- [ ] `ChargingScreen.tsx` (主要 1 画面パイロット)
- [ ] `StatsDashboard.tsx` (主要 1 画面パイロット)
- [ ] **Rationale** セクション: なぜそのデザイン判断にしたか (yt-player の brief 同様)
- [ ] **Component map**: どの token / class が既存コードのどこに対応するか

## Out of scope (今回は触らない)
- BG GPS plugin の挙動 (PoC 評価期間中、2026-05-06 まで凍結)
- データモデル / GAS sync 仕様
- 認証フロー (現状 Settings 画面の GAS URL 入力のみ)
- i18n 多言語化 (現状日本語のみで OK)
```

---

## After Claude Design returns output

ファイルが揃ったらこのリポに置く場所:

| Claude Design 出力 | 配置先 |
|---|---|
| `EV Manager Redesign.html` | `docs/specs/redesign/canvas.html` |
| `tokens.css` | `src/index.css` の `@theme` ブロックを置換 |
| `BottomNav.tsx` | `src/components/ui/BottomNav.tsx` 置換 |
| `*.tsx` modules | `src/components/<section>/` の該当ファイル置換 |
| Rationale | `docs/specs/redesign/rationale.md` |

**Claude Code への指示テンプレ**:
```
docs/specs/redesign/ に Claude Design 出力を置いた。
tokens.css を src/index.css に統合 + BottomNav.tsx を置換 + ChargingScreen を適用してくれ。
既存 NEXUS class を残したまま新 token を併存させ、画面ごとに段階移行できるようにする。
```

## Workflow tips (yt-player から学んだこと)

- **iteration ごとに version bump** (4.8.x → 4.9.0 でテーマ刷新を区切る)
- **screen 単位の段階適用**: 1 画面試して OK なら他へ波及
- **token 移行期間は両方併存**: 旧 NEXUS と新 tokens を共存させ、PR で 1 画面ずつ切替
- **PoC 期間中は Settings/Stats などの非 PoC 画面から着手** (BG GPS 系は最後)
