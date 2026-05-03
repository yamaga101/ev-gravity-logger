---
visibility: private
---
# ev-manager — Redesign Workspace

claude.ai/design (リーダー) + Stitch (サブ) の役割分担で運用するリデザイン作業領域。

## ディレクトリの意味

| Path | 役割 | SoT? |
|---|---|---|
| `canvas/` | claude.ai/design 出力 (tokens.css, JSX, rationale) | **✅ Source of Truth** |
| `explorations/` | Stitch ラフ案 (採用/不採用問わず保存) | ❌ disposable |
| `assets/` | Stitch 直接出力アセット (icons / illustrations / hero) | ✅ canonical |

## 鉄則 (3 つ)

1. **片方向フロー**: Stitch → claude.ai/design (探索アイデアを brief に取り込む) のみ。逆はしない
2. **token 排他**: production の `src/index.css` に入る `--color-*` 等は **canvas/tokens.css** 経由のみ
3. **iteration 台帳**: `explorations/_adopted.md` に「v1〜v5 のうち v3 採用、理由 X」を毎回記録

## 標準ワークフロー

```
[Phase 1: 探索 (任意)]    Stitch で 5 案 → スクショ → 1 つに絞る
       ↓
[Phase 2: 確定]            claude.ai/design に brief + Phase 1 のスクショ投入
                           → tokens.css + JSX modules + rationale.md 出力
       ↓
[Phase 3: 適用]            Claude Code が canvas/ を src/ に統合
       ↓
[Phase 4: アセット]        Stitch でアイコン・イラスト・hero 個別生成
```

## brief 本体

`docs/specs/claude-design-brief.md` (paste-ready)

## 関連

- 移行戦略: token 並存期間 → 画面ごと段階移行
- iteration ごとに version bump (4.8.x → 4.9.0 でテーマ刷新区切り)
- PoC 期間 (〜2026-05-06) は Stats / Settings から先行、BG GPS 系画面は最後
