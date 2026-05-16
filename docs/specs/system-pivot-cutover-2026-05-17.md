---
visibility: private
created: 2026-05-17
operator: shigaki
status: drafted (operator review 待ち; 新 repo 名 / packageId は operator decision pending)
adr_role: ADR-3 of pivot triplet
relates_to:
  - docs/specs/system-pivot-to-movement-log-2026-05-17.md (ADR-1)
  - docs/specs/system-pivot-storage-backup-2026-05-17.md (ADR-2)
  - docs/specs/p3-auto-update.md (auto-update mechanism survives cutover)
  - docs/specs/system-gas-yamaga101-carveout.md (carve-out invariants port to new repo)
---

# ADR-3: movement-log pivot — cutover sequence

## Status

**Drafted** (2026-05-17, operator review pending). Naming decisions resolved (operator 2026-05-17 via AskUserQuestion):

1. **New repo name**: `movement-log` (§D1)
2. **New Capacitor packageId**: `jp.gmail.yamaga101.movementlog` (§D2)

All cutover mechanics specified; ready for implementation.

## Context

ADR-1 established the pivot (single hard cut, Timeline+Segments domain, automatic+confirm data entry, local-first storage, full identity rename). ADR-2 specified storage mechanics (SQLite + 3 export formats + migration). ADR-3 owns the **actual cutover sequence**: how the operator transitions from v5.2.2 ev-manager on device to v6.0.0 new-app on device with zero data loss.

The hardest constraints:

- **Android packageId change = new app**. v5.2.2 cannot upgrade in place. Operator must manually uninstall v5.2.2 and install new app.
- **App-private storage cannot be carried over** (Android security). Migration must go through user-mediated export → import.
- **Old `yamaga101/ev-manager` repo Releases must remain accessible** as rollback path. Don't delete.
- **Carve-out invariants** (`shigaki@k35.jp` ban, `GoogleDrive-shigaki@k35` ban) port verbatim to new repo.
- **Version bump SoT** (`standards.md`) targets multiple files per release; new repo gets the same 1-commit-1-version discipline from commit 1.

## Decision

### D1: New repo name — **`movement-log`** (operator chose 2026-05-17)

Considered candidates and operator decision:

| # | Name | Pros | Cons | Status |
|---|------|------|------|--------|
| 1 | `movement-log` | Literal, search-friendly, no ambiguity | Generic, may collide with existing GitHub names | **✓ Adopted** |
| 2 | `move-track` | Short, action-oriented | "track" overloaded (audio, sports, GPS) | rejected |
| 3 | `trail-log` | GPS trail imagery | Hiking connotation may bias interpretation | rejected |
| 4 | `transit-log` | Hints at multi-modal | "transit" connotes public transport, mismatched with car/walk | rejected |

Constraints satisfied by `movement-log`:
- Lowercase, hyphen-separated (GitHub convention)
- Reasonable as Android display label (operator sees daily)
- Reverse-domain segment: `movementlog` (no hyphen, Android packageId rules)
- Generic but precise — matches ADR-1 §D2 Timeline+Segments framing without over-narrowing

Constraints the chosen name must satisfy:
- Available as `github.com/yamaga101/<name>` (operator to verify)
- Available as npm package name (low priority — not publishing)
- Reasonable as Android display label (UI shows it to operator daily)
- Reasonable as packageId reverse-domain segment

### D2: New Capacitor packageId — **`jp.gmail.yamaga101.movementlog`**

Derived from D1 (`movement-log` → `movementlog`):

- Pattern: `jp.gmail.yamaga101.<repo-name-flattened>`
- Lowercase, no hyphens (Android packageId rules)
- Reverse-domain follows existing carve-out convention (compare: old `jp.gmail.yamaga101.evmanager`)
- packageId is **forever** — once published on a device, changing requires another full cutover. Locked at this value.

### D3: Repo creation strategy

**Option A (chosen)**: Create new GitHub repo, copy + adapt files from `ev-manager` (no git history transfer).

- New repo starts fresh, commit 1 is "initial scaffold from ev-manager"
- Old `ev-manager` git history accessible at original repo URL (not lost, just not carried)
- Git blame for new code starts at v6.0.0 (clean slate)

Rejected: git filter-repo to extract subset with history. Reasons: history is full of EV-specific commits irrelevant to new identity; "clean slate" semantics match the rebrand; filter-repo adds complexity for no operator-visible benefit.

### D4: Preflight checklist (run BEFORE first new-repo commit)

Operator checks each item in order. Each item is reversible until step 12.

```
[ ]  1. v5.2.2 device verification: open ev-manager, confirm app launches without errors,
        confirm latest driveLog entries are present (catch any pending sync that would be lost)
[ ]  2. CSV archive: export charging history, maintenance history, vehicle info, insurance,
        tax, inspection records from GAS Spreadsheet to local CSV files. Verify row counts.
        Store under ~/Projects/ev-manager-archive-2026-05/ (new dir, NOT inside ev-manager repo).
[ ]  3. JSON full backup: open v5.2.2 → Settings → Export All Data → save JSON file
        to ~/Projects/ev-manager-archive-2026-05/v5.2.2-full-backup.json (this becomes the
        ADR-2 §D3 migration source for v6)
[ ]  4. GAS Spreadsheet freeze: rename "ev-manager-data" sheet to "ev-manager-data-archived-2026-05"
        and add a top-row banner "READ ONLY — archived 2026-05-17, see movement-log for current data"
[ ]  5. Drive folder verify: confirm ~/Projects/ev-manager-archive-2026-05/ contains all
        CSV files + JSON backup. Sync to Drive (yamaga101) for off-device durability.
[ ]  6. Old repo final tag: in ev-manager repo, tag the current HEAD as `v5.2.2-final-archive`
        with annotated message "Final EV-manager release before pivot to movement-log. See new repo: <D1 name>"
[ ]  7. Old repo README addendum: prepend a "## ⚠️ Project archived" section pointing to new repo
[ ]  8. New repo create on GitHub (per D1 name)
[ ]  9. New repo initial scaffold commit (copy + adapt files from ev-manager; see §D5 for KEEP/DELETE/REWRITE matrix)
[ ] 10. New repo carve-out CI: port check-no-k35.sh + .github/workflows/k35-check.yml (verify identical invariants)
[ ] 11. New repo pre-commit hooks: port via npm run setup-hooks pattern (per project CLAUDE.md)
[ ] 12. New repo signing key: copy Android signing keystore from ev-manager
        (preserves operator trust but Android still treats new packageId as new app — keystore
        is for APK signature verification, not app identity)
```

Steps 1-7 are reversible (revert by re-opening Spreadsheet, removing tag, etc.). Step 8+ enter the new repo; revert = delete new repo (acceptable at this stage).

### D5: KEEP / DELETE / REWRITE matrix (commit-1 scaffold scope)

| Path | Action | Note |
|------|--------|------|
| `src/components/charging/` | DELETE | EV-specific, no port |
| `src/components/maintenance/` | DELETE | EV-specific |
| `src/components/vehicle/` | DELETE | Vehicle metadata removed (ADR-1 §D2) |
| `src/components/meter-capture/` | DELETE | Odometer concept gone |
| `src/components/stats/` | DELETE | SOH/efficiency stats EV-specific |
| `src/components/history/HistoryList.tsx` | REWRITE | Default sub-tab was "charging"; new: Timeline (per ADR-1 §D2) |
| `src/components/silent/App.tsx` | REWRITE | Currently imports useChargingStore; new: no EV references |
| `src/components/redesign/App.tsx` | REWRITE | Same |
| `src/components/settings/SettingsPanel.tsx` | REWRITE | JSON export schema in :528-568 EV-shaped; new: per ADR-2 §D4 (JSON full backup of segments+trips only) |
| `src/components/onboarding/` | KEEP+EDIT | Onboarding flow survives; copy text updates |
| `src/components/help/` | KEEP+EDIT | Help text updates for movement-log |
| `src/components/inputs/` | KEEP | Reusable input primitives |
| `src/components/ui/` | KEEP | UI kit |
| `src/store/useChargingStore.ts` | DELETE | — |
| `src/store/useMaintenanceStore.ts` | DELETE | — |
| `src/store/useVehicleStore.ts` | DELETE | — |
| `src/store/useDriveLogStore.ts` | REWRITE | Becomes `useSegmentsStore.ts` per ADR-1 §D2 (Segment as persistence unit); backed by SQLite per ADR-2 |
| `src/store/useAutoTripStore.ts` | KEEP+EDIT | AutoTrip detection survives; output is now Segments (pending status) not Trips |
| `src/store/useLocationStore.ts` | KEEP | GPS sampling |
| `src/store/useSettingsStore.ts` | REWRITE | Remove EV-specific flags (battery rate, electricity rate, night rate); add backup cadence settings per ADR-2 §D5 |
| `src/store/useSyncStore.ts` | DELETE | GAS sync retired per ADR-1 §D4 / ADR-2 §A3 |
| `src/store/useToastStore.ts` | KEEP | UI toast |
| `gas/Code.gs` | DELETE | GAS sync retired |
| `gas/` (directory) | DELETE | — |
| `src/services/auto-update.ts` | REWRITE | URL hardcode `yamaga101/ev-manager` → `yamaga101/<new-repo-name>`; APK filename pattern preserved |
| `src/services/migration/v5-to-v6.ts` | NEW | ADR-2 §D3 import logic |
| `src/services/sqlite/` | NEW | ADR-2 §D2 schema + repository pattern |
| `src/services/export/` | NEW | ADR-2 §D4 CSV/GeoJSON/JSON writers |
| `shared/types/index.ts` | REWRITE | Drop GasPayload EV fields; add Segment/Trip/TimelineDay types per ADR-1 §D2 |
| `capacitor.config.ts` | REWRITE | New packageId per D2, new app name per D1 |
| `android/app/build.gradle` | REWRITE | Same |
| `android/app/src/main/AndroidManifest.xml` | REWRITE | New label |
| `android/app/src/main/res/values/strings.xml` | REWRITE | New `app_name` |
| `manifest.json` | REWRITE | New PWA manifest name+description |
| `package.json` | REWRITE | New name field + version reset to `0.1.0` (per D6) |
| `.github/workflows/k35-check.yml` | PORT | Identical content |
| `scripts/check-no-k35.sh` | PORT | Identical |
| `docs/specs/` | KEEP | Carry forward ADR-1/2/3 + relevant existing specs (p1-native-shell-runbook, p2-auto-trip, p3-auto-update, system-apk-distribution, system-gas-yamaga101-carveout, claude-design-brief) |
| `docs/specs/v460-runbook.md` | DELETE | EV-era specific |
| `docs/specs/p01-bg-geolocation-plugin-decision.md` | KEEP | BG GPS plugin choice survives |
| `EV_MANAGER_step1b_step2_bundle.md` | DELETE | EV-era bundle doc |
| `CLAUDE.md` | REWRITE | New project identity; KEEP carve-out section (port verbatim) |
| `README.md` | REWRITE | New product description |

### D6: Versioning strategy

New repo starts at **`0.1.0`** (development), ships to `1.0.0` once Sprint Contract (Done/Verify/Revert) is met for the first usable Timeline+Segments UI.

Rationale: this is a new product identity; carrying over v6.0.0 from the old repo would imply continuity that the rename + packageId change explicitly breaks. `1.0.0` for new identity is cleaner semver.

Version bump SoT: per `standards.md` global rule + project CLAUDE.md, all version-targeted files bump together in same commit. Initial scaffold = `0.1.0`. First user-facing ship = `1.0.0`. Patches `1.0.1`, etc.

### D7: Manual cutover sequence (device-side, after new repo `1.0.0` builds)

Operator performs in order:

```
[ ] 1. Verify Drive backup from preflight step 5 is intact (JSON file accessible)
[ ] 2. On Android device: Settings → Apps → ev-manager → Uninstall
       (do NOT clear data first; the uninstall path is cleaner)
[ ] 3. Browser (Samsung Internet) → new repo Releases page → download app-debug.apk
[ ] 4. Install APK (Samsung Internet → Open after download)
       NOTE: NEW packageId means Android treats as new app; "Install from unknown source"
       prompt appears again as if first install
[ ] 5. Open new app → first-launch onboarding
[ ] 6. Onboarding step "Import legacy data" → file picker → select v5.2.2-full-backup.json
       from Drive (or local download)
[ ] 7. Verify imported row count matches expected (operator notes count from preflight
       step 3 export)
[ ] 8. Enable AutoTrip → confirm BG GPS permission grant flow
[ ] 9. Confirm timeline view shows imported segments (mode='car', source='import',
       status='confirmed')
[ ] 10. Perform 1 test trip (walk a short distance, return) → verify AutoTrip detects,
        pending segment appears, confirm flow works
[ ] 11. Trigger manual export (CSV) → verify file written to Drive
[ ] 12. Settings → enable weekly auto-backup
[ ] 13. Re-test auto-update flow: bump version to 1.0.1 (tiny patch), build, release,
        verify polling picks up update and ApkInstaller flow works
```

Steps 1-7 are recoverable (reinstall v5.2.2 from old repo Releases archive + re-open Drive backup). Steps 8+ assume new app is operational; if those fail, rollback per §D8.

### D8: Rollback procedure

If new app is unusable after cutover:

1. Uninstall new app (Settings → Apps → <new name> → Uninstall)
2. Browser → `github.com/yamaga101/ev-manager/releases/tag/v5.2.2` → download app-debug.apk
3. Install (Android still trusts the old packageId signing key)
4. Open v5.2.2 — should resume from cloud sync state (last GAS sync data still in Spreadsheet — wait, GAS sheet was renamed in preflight §D4 step 4; v5.2.2 sync may error)
5. **Caveat**: If preflight §D4 already renamed the GAS sheet, v5.2.2 sync will fail. Rollback also requires: open GAS Spreadsheet → rename `ev-manager-data-archived-2026-05` back to `ev-manager-data`. After that, v5.2.2 resumes normal operation.

Time-to-rollback estimate: ~5 minutes (uninstall + download + install + GAS sheet rename).

The window during which rollback is needed-but-impossible: zero, because old repo Releases stay accessible.

### D9: Old `ev-manager` repo afterlife

Post-cutover, `ev-manager` repo is **archived** (GitHub: Settings → Archive this repository).

- All v5.2.2 Releases stay downloadable
- README addendum (preflight §D4 step 7) points to new repo
- No new commits; no new Releases
- Old v5.2.2 device installs that don't get manually upgraded keep polling old Releases → "no update" response forever (no error, just stable)
- After ~6 months, evaluate hard-delete of old repo (probably keep indefinitely as historical record)

## Consequences

### Positive

- **Zero data loss** for movement history (JSON backup + import covers it)
- **Charging/maintenance archival preserved** (CSV files in `~/Projects/ev-manager-archive-2026-05/` + Drive)
- **Rollback path always available** (old repo Releases stay live; reinstall + GAS sheet rename = 5min)
- **Clean new identity** from commit 1 (no inherited EV cruft in git blame)
- **Signing key preserved** (operator trust UX — "Install from unknown source" prompt familiar)
- **Auto-update mechanism survives** at new URL (P3 ApkInstaller flow retested at v1.0.1)

### Negative

- **Cutover is operator-mediated** (~30 min of focused work: preflight + uninstall + install + verification + test trip)
- **Two apps installed briefly possible** if operator forgets to uninstall v5.2.2 — both apps will try to sample GPS in BG → battery drain + data confusion. Cutover §D7 step 2 is explicit about uninstall order
- **GAS sheet rename breaks v5.2.2 sync** during cutover window → rollback requires sheet un-rename (documented in §D8)
- **Old `ev-manager` repo Releases keep getting polled forever** by any device that didn't migrate. Acceptable since the only such device is operator's, which will be migrated

### Neutral

- ~30 min cutover is a one-time cost
- Old repo archive is free on GitHub
- New repo creation is free

## Alternatives Rejected

### A1: git filter-repo to carry partial history into new repo

**Why rejected**: Adds complexity; git blame for new code starts polluted with EV-era commits; new identity benefits from clean slate. Old repo is the historical record.

### A2: Keep ev-manager repo, just rename + restructure inside

**Why rejected**: Confuses GitHub URL, Releases history, CI artifacts. Conflicts with ADR-1 §D5 full-rename decision. Audit trail (git log) would mix EV and movement-log eras awkwardly.

### A3: Soft cutover (both apps coexist for a transition period)

**Why rejected**: Two background-GPS apps competing = battery + data confusion. No multi-user reason to gradual transition. Hard uninstall step 2 of §D7 prevents this.

### A4: Reuse v5.2.2 packageId in new repo (avoid the packageId trap entirely)

**Why rejected**: Then it's not a true rename — Android still shows it as "ev-manager" until app label string is updated, and even after, the package management identity is stuck in the past. ADR-1 §D5 explicitly requires new identity. Hard cut at packageId is part of pivot semantics.

### A5: Use Google Play internal testing channel for managed updates

**Why rejected**: Operator distribution is side-loaded; Play Store path adds account + review + delay friction for zero benefit at single-user scale.

## Open questions

- **New repo name** (D1) — operator decision in review
- **APK distribution canonical URL pattern** — assumed identical to old (`releases/latest/download/app-debug.apk`), verify at first new release
- **Migration UI text** (onboarding "Import legacy data" wording) — implementation detail, not ADR scope
- **AutoTrip default-confirm threshold** (auto-confirm high-confidence segments without UI prompt?) — out of cutover scope, future enhancement

## Evidence

- ADR-1 §D5 establishes rename non-negotiable
- ADR-2 §D3 specifies migration mechanism (operator-mediated, file-based)
- Pro Bridge axis 1 (HYBRID) supports single hard cut over staged
- Pro Bridge axis 3 (HYBRID) supports GAS retirement (so GAS sheet rename in §D4 step 4 is acceptable; no live sync downstream)
- Memory `feedback_capacitor_build_pipeline`: cap:sync requirement noted in §D7 step 4 (new APK must use npm run cap:sync, not manual cap sync + npm run build)
- Memory `feedback_send_urls_proactively`: any URL operator needs to open on device (new repo Releases URL) gets sent via Gmail to yamaga101 (in addition to chat) — operationalized at cutover §D7 step 3

## Related

- ADR-1, ADR-2 (this triplet)
- `p3-auto-update.md` (auto-update flow that survives cutover)
- `system-apk-distribution.md` (APK distribution pattern, unchanged)
- `system-gas-yamaga101-carveout.md` (carve-out invariants port to new repo)
