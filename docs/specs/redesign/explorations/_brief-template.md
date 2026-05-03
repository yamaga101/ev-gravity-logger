# Stitch Exploration Brief Template

Stitch (`mcp__stitch__*`) に渡す探索 brief のテンプレート。

## 使い方

1. このテンプレをコピーして `YYYY-MM-DD-<screen>-v<N>/brief.md` を作成
2. Claude Code に「Stitch で <screen> を生成して」と依頼
3. 出力 (HTML/CSS/screenshot) を同フォルダに保存
4. 採用したら `_adopted.md` に追記

## Brief 内容

```
# Screen: <ChargingScreen / StatsDashboard / ...>
# Project: ev-manager
# Direction: <NEXUS evolution / iOS 26 / Material You / Cyber Tactical / Tesla>

## Brand context
- App: 個人 EV 管理
- Existing theme: NEXUS Deep Space Command Interface (cyan / violet / green on dark)
- Target: Capacitor Android (S25 Ultra portrait 412×915)

## What this screen does
<画面の目的を 1-2 文>

## Required elements
- <必須要素リスト>

## Style direction
- <配色 / typography / 装飾の方針>

## Reference
- 既存 token: cyan #00F0FF, violet #7B61FF, green #39FF14, void #030712
- 既存 typography: Orbitron (display) / Exo 2 (sans) / JetBrains Mono (mono)

## Output expectation
- 5 variations
- HTML + CSS (no JS)
- screenshot per variation
```

## 採用台帳のフォーマット (`_adopted.md`)

```
## 2026-MM-DD <screen>
- v1 (rejected): <理由>
- v2 (rejected): <理由>
- **v3 (adopted)**: <理由>
- v4 (rejected): <理由>
- v5 (rejected): <理由>

→ canvas/ への昇格時に v3 のスクショを claude.ai/design brief に添付
```
