---
visibility: private
created: 2026-05-17
operator: shigaki
status: adopted (operator approval 2026-05-17, Pro Bridge Round 2 全面採用)
decision_id_barrier: l4-20260516T225311Z-b92ca2
bridge_id_pro: gptpro-20260516T225309Z-78b667
relates_to:
  - docs/specs/p2-auto-trip-design.md
  - docs/specs/p3-auto-update.md
  - project_p3_1_pro_bridge_dissent (memory)
supersedes: (none — this is the first ADR for the pivot)
---

# ADR-1: ev-manager → movement-log app pivot — domain model & framing

## Status

**Adopted** (2026-05-17). Pending follow-up ADRs:
- ADR-2: storage & backup (Capacitor SQLite + export 戦略)
- ADR-3: cutover (preflight checklist + new repo/app naming + manual reinstall path)

## Context

### Trigger

Operator request (2026-05-17): "EV 記録外して、移動ログ機能に特化してほしい"

Translation: remove EV-specific records (charging, maintenance, vehicle metadata, insurance, tax, SOH), specialize the app on general movement logging (walking / biking / car / train).

### Project state at decision time

- Repo: `ev-manager` v5.2.2 (Capacitor 7 Android shell + PWA legacy)
- 9 zustand stores (1660L), ~22 component dirs, GAS `Code.gs` 451L
- v5.2.2 auto-update (GitHub Releases polling + ApkInstaller) active and proven (5 trips Confirmed → driveLog OK, 2026-05-08)
- Android packageId: `jp.gmail.yamaga101.evmanager`
- Auto-update polling: hardcoded `yamaga101/ev-manager` in `src/services/auto-update.ts:17`
- Single operator (shigaki), yamaga101 carve-out
- Pending design debt: P3.1 walking-inclusion has 8 must_change items from prior Pro Bridge Round 1 dissent (collision between walking and Trip-model)

### Operator 4-axis confirmation (AskUserQuestion 2026-05-17)

1. EV feature removal depth: **hard delete** (full removal of charging/maintenance/vehicle/meter-capture/stats — code + stores + GAS sync + i18n)
2. Vehicle metadata: **completely removed** (general-purpose movement log; only mode enum walk/bike/car/train)
3. Repo/app name: **full rename** (repo + Android packageId + APK URL + CI carve-out + auto-update polling)
4. Existing user data (charging/maintenance): **GAS clean cut** — export to CSV archive then drop

### Council & Bridge process

**L4 council** (3 flagship, attendance verified by `orchestra-verify-attendance.py`):
- Opus 4.7 (this assistant): synthesizer
- Gemini 3.1 Pro (structural/phasing analyst)
- GPT-5.5 Codex (code-level mechanics analyst)

Council unanimous recommendation: 3-stage staged release (v5.3 lobotomy → v5.4 bridge → v6.0 rebirth identity) with critical risk flags around packageId trap, Zustand persist hydration crash, GAS sync queue deadlock. Gemini Pro additionally flagged Trip-vs-Timeline category error but did not act on it in the plan.

**Pro Bridge Round 2** (A-with-canary path, intent=architecture, GPT-5.5 Pro via `/gptpro`):
- BRIDGE_ID: `gptpro-20260516T225309Z-78b667`
- Verdict: **reject-and-redesign** (not pivot rejection — framing rejection)
- Core flaw: council solved pivot as *release-management* problem; the real problem is *domain-model replacement*
- Per-axis: Axis 1 HYBRID (single hard cut, not 3-stage), Axis 2 INVERT (Trip → Timeline+Segments), Axis 3 HYBRID (drop GAS sync, replace with local-first SQLite + export)
- 4th-axis blind spot identified: **data-entry mode** (manual / start-stop / automatic / hybrid) — architecturally decisive, unasked by council
- Confidence: 0.84

Operator decision (2026-05-17 via AskUserQuestion): **全面採用 (modify-plan)** — adopt Pro Bridge recommendations across all 3 axes.

## Decision

### D1: Single hard cut, not staged release

The pivot ships as a **single hard cut** (not the council's 3-stage v5.3→v5.4→v6.0 plan).

- New repo with new identity from commit 1
- Old `ev-manager` repo: archived (frozen, not deleted — git history preserved)
- Old v5.2.2 app on operator's device: manually uninstalled at cutover
- New app: manually installed (new packageId → Android treats as new app)
- Preflight checklist (per ADR-3) replaces the safety value of staging

Rationale: single-operator context. The staged plan's primary value (user coordination, in-place auto-update preservation) does not apply when operator is the sole user and APK is side-loaded. Pro Bridge HYBRID verdict on Axis 1.

### D2: Timeline + Segments domain model (Trip retired)

The canonical record shape replaces `driveLog` Trip-shaped objects with continuous Timeline composed of Segments.

#### Core types (TypeScript sketch — final shape in implementation PR)

```ts
type MovementMode = 'walk' | 'bike' | 'car' | 'train';

interface MovementSegment {
  id: string;                                  // ULID or UUID
  startedAt: string;                           // ISO 8601 UTC
  endedAt?: string;                            // open if currently active
  mode: MovementMode;
  distanceMeters?: number;
  path?: GeoJSON.LineString | null;            // GPS route geometry (optional)
  fromLabel?: string;                          // reverse-geocoded or user-set
  toLabel?: string;
  note?: string;
  source: 'manual' | 'gps' | 'import';
  confidence?: number;                         // 0.0-1.0 for auto-detected
  createdAt: string;
  updatedAt: string;
}

interface MovementTimelineDay {
  date: string;                                // YYYY-MM-DD (local tz)
  segmentIds: string[];                        // ordered by startedAt
}

// Optional, derived — NOT a base persistence object:
interface MovementTrip {
  id: string;
  segmentIds: string[];                        // user-grouped (e.g., commute = walk→train→walk)
  label?: string;
  createdAt: string;
}
```

#### Key shape decisions

- **Segment is the persistence unit**, not Trip. A multi-modal commute is naturally 3 segments (walk → train → walk), not 1 trip with confused mode.
- **Timeline is the primary read view** (day-indexed). Trip is a derived grouping for user convenience, materialized on demand or stored as user-curated grouping records.
- **Mode is a flat enum**, not a vehicle-association. `car` does not imply vehicle ownership; it is just movement mode.
- **Path is optional** — manual entries have no GPS path; auto entries have GPS path; imported entries may or may not.
- **Source is required** to distinguish manual vs gps-auto vs import for UI affordances (edit/confirm/split).

Rationale: Pro Bridge INVERT verdict on Axis 2. The existing P3.1 walking-inclusion 8 must_change items are downstream symptoms of Trip-model collision with multi-modal movement. Reframing now eliminates that debt instead of patching it.

### D3: data-entry mode = automatic + confirm hybrid

The app's data-entry mode is **automatic detection with operator confirmation** — the model already shipped via P2 AutoTrip (v5.1.0).

- BG GPS continuously samples (per P3.2 transparency design)
- AutoTrip detects movement Segments (start / end / mode inference from avg speed)
- Operator opens app → Confirm UI shows pending unconfirmed Segments
- Operator confirms / edits / merges / splits / discards
- Confirmed Segments enter the Timeline; unconfirmed Segments stay in pending queue

Manual entry remains supported as escape hatch (Settings → "+" → manual segment form) for cases AutoTrip missed (e.g., GPS off, indoor activity).

Rationale: Pro Bridge identified data-entry mode as 4th-axis blind spot. For this project the answer is already settled by P2 ship history — `automatic + confirm` is the established mode. Documenting it explicitly here because it constrains every downstream design (Timeline pre-supposes continuous sensing, manual-only would have been a different schema).

### D4: Local-first storage (Capacitor SQLite), GAS live sync retired

Storage moves from Zustand-persist localStorage + GAS sync to **Capacitor SQLite local-first** with explicit export.

- Authoritative store: Capacitor SQLite (`@capacitor-community/sqlite` or equivalent)
- Zustand: UI/session state only (not historical data of record)
- Export formats:
  - **CSV** for tabular review (Spreadsheet import)
  - **GeoJSON** for path geometry (mapping tools)
  - **JSON** for full-fidelity backup/restore
- GAS sync: **retired**. No live API bridge.
- Spreadsheet view (if operator wants one): produced as static export, not bidirectional sync

Rationale: Pro Bridge HYBRID verdict on Axis 3. GAS sync's complexity (schema migration, queue, deadlock risk) is not justified for single-operator GPS log. Local-first + export gives the same data accessibility with simpler architecture and removes the pivot's hardest migration problem. Full storage design → ADR-2.

### D5: Identity rename — new repo + new packageId

- New GitHub repo: **`movement-log`** (operator decision 2026-05-17 via AskUserQuestion; rationale in ADR-3 §D1)
- New Capacitor packageId: **`jp.gmail.yamaga101.movementlog`**
- New APK distribution URL (new repo Releases)
- New CI carve-out script (`scripts/check-no-k35.sh` migrates to new repo with same invariants)
- v5.2.2 ev-manager: archived, manual uninstall on operator device

Rationale: Pro Bridge HYBRID/INVERT logic — identity rename is non-negotiable per operator axis 3 confirmation. ADR-3 will own the cutover sequence and the actual name choice.

## Consequences

### Positive

- **P3.1 debt eliminated**: 8 must_change items from Round 1 dissent become moot under Timeline+Segments — walking is a first-class Segment, not a Trip exception.
- **Schema migration problem disappears**: no GAS sync = no live schema to migrate; CSV archive is the only export needed before cutover.
- **Single-operator coordination cost**: zero (sole user, side-loaded distribution).
- **Reduced surface area**: 5 component dirs deleted (charging, maintenance, vehicle, meter-capture, stats) + 3 stores (charging 149L, maintenance 68L, vehicle 76L) + GAS handlers writeCharging/patchCharging/consolidateSheets.
- **Domain-model purity**: from-scratch movement-log semantics, not "EV minus charging" inherited shape.
- **Backup robustness improves**: local-first + explicit export is more resilient to GAS API outages than live sync.

### Negative

- **Rewrite scope significantly larger than council baseline**: `driveLog` store → Segment + Timeline store is a non-trivial redesign (not just rename). Estimated 3-4 stores rewritten, ~6 component dirs touched, persistence migration code required.
- **Single hard cut = bigger blast radius if anything breaks**: no v5.4 fallback. Mitigated by preflight checklist (ADR-3) and rollback = reinstall v5.2.2 APK from old repo Releases archive.
- **No backup until SQLite + export ship**: window of vulnerability between local-first ship and first successful export. Mitigated by export being part of v6.0 ship checklist.
- **Operator must perform manual uninstall + install** at cutover (acceptable per single-operator context).
- **Existing v5.2.2 will keep polling old `yamaga101/ev-manager` Releases forever** if not uninstalled. Old repo Releases can be left static (final v5.2.2 stays installable) so polling returns "no update" but doesn't error.

### Neutral

- Auto-update flow (P3) survives intact, now pointing at new repo with same mechanism. Re-tested at v6.0 ship.
- yamaga101 carve-out invariants preserved (new repo gets `check-no-k35.sh` + CI workflow ported verbatim).

## Alternatives Rejected

### A1: Council baseline — 3-stage staged release (v5.3 lobotomy → v5.4 bridge → v6.0 rebirth)

**Why rejected**: Production-multi-user reflex applied to a single-operator app. Staging's value is user coordination; with zero other users, the friction (3 separate releases + 3 separate rollback paths + bridge logic that exists only to be thrown away) exceeds the safety benefit. Pro Bridge HYBRID verdict explicit.

### A2: Preserve Trip model + add mode enum (Bridge Axis 2 partial adopt)

**Why rejected**: Inherits exactly the framing collision that P3.1 already exposed with 8 must_change items. Walking → train → walking commute does not fit "1 Trip with confused mode" or "3 Trips" cleanly. Pro Bridge INVERT verdict: the existing debt is the proof that mode-enum-on-Trip is insufficient. Reframing now is cheaper than patching forever.

### A3: Keep GAS live sync, just drop charging/maintenance handlers

**Why rejected**: Maintains schema complexity, queue infrastructure, auth, idempotency, error handling, dispatcher — all for a single-user GPS log where local-first + export covers the same use case. Pro Bridge HYBRID verdict: the value GAS adds (live bidirectional sync, cross-device, multi-user collaboration) doesn't apply here. Spreadsheet-as-dashboard, if wanted, is a static export.

### A4: Defer pivot, do P3.1 walking-inclusion redesign first under current EV identity

**Why rejected**: P3.1 8 must_change items are symptoms of Trip-model framing, not isolated bugs. Fixing them inside the EV identity perpetuates the wrong domain model. Pivot at this moment retires the framing problem and the inherited identity in one cut.

### A5: New repo from scratch (greenfield), abandon ev-manager codebase

**Why rejected**: Discards working components (autoTrip detection logic, BG GPS native bridge, ApkInstaller integration, auto-update flow, GAS auth/dispatcher infrastructure that powers the export ADR-2 will define). KEEP set components (silent/ + onboarding/ + settings/ + sync infrastructure + ui/) cover ~60% of the new app's surface. Hard cut inside the existing codebase preserves this leverage.

## Open questions (ADR-2 / ADR-3 scope)

- **New repo/app name** — decided in ADR-3
- **SQLite library choice** (`@capacitor-community/sqlite` vs alternatives) — ADR-2
- **Path geometry format on-disk** (GeoJSON vs encoded polyline vs PostGIS-style) — ADR-2
- **Export trigger UX** (manual button vs scheduled vs both) — ADR-2
- **Migration of existing v5.2.2 driveLog data** to new Segment shape (manual import after cutover? scripted? abandon and start fresh?) — ADR-3
- **Preflight checklist contents** (CSV export verify, GAS freeze, signing key preservation across packageId, version bump targets) — ADR-3
- **Rollback procedure** if v6.0 ship-stops the app on operator's device — ADR-3

## Evidence

- L4 council attendance: `orchestra-verify-attendance.py --window 300` → `VERDICT: ok — all recent flagship-targeted delegations used the expected model` (2/2 OK: gemini-3.1-pro-preview + gpt-5.5)
- Pro Bridge Round 2 cognition ledger: `~/.harness-health/gptpro-bridge-cognition.jsonl` entry `bridge_id=gptpro-20260516T225309Z-78b667 phase=a_with_canary high_blast_radius=true frame_source=l4_full option_set_delta=added_option decision_delta=decision_changed new_premise_count=2`
- L4 barrier transitions: `decision_id=l4-20260516T225311Z-b92ca2` open → dispatched (canary_verified=true) → returned → synth state=returned → closed
- 4 markers verified in Pro Bridge response (BRIDGE_ID + PACKET_SHA256_12 echoed at start and end, all matching)
- 4 stream batched synthesis: operator-frame / l4-internal / gptpro-dissent / codex-result (skipped) — NOT collapsed into "4 model opinions" per ADR barrier instruction

## Related

- Memory: `project_pivot_to_movement_log.md`, `project_pro_bridge_round2_pivot_dissent.md`, `project_p3_1_pro_bridge_dissent.md`, `feedback_walking_is_log_target.md`
- Specs (existing): `p2-auto-trip-design.md` (data-entry mode origin), `p3-auto-update.md` (auto-update mechanism survives cutover)
- Pending ADRs: ADR-2 (storage & backup), ADR-3 (cutover sequence + new identity)
