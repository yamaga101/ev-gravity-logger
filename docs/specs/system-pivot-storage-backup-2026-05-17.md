---
visibility: private
created: 2026-05-17
operator: shigaki
status: drafted (operator review 待ち)
adr_role: ADR-2 of pivot triplet
relates_to:
  - docs/specs/system-pivot-to-movement-log-2026-05-17.md (ADR-1, domain model)
  - docs/specs/system-pivot-cutover-2026-05-17.md (ADR-3, cutover)
  - docs/specs/p2-auto-trip-design.md (existing AutoTrip)
---

# ADR-2: movement-log pivot — storage & backup design

## Status

**Drafted** (2026-05-17, operator review pending). Implements ADR-1 §D4 (local-first storage with Capacitor SQLite + explicit export).

## Context

ADR-1 §D4 established the policy direction: GAS live sync retired, Capacitor SQLite local-first, explicit export. This ADR specifies the mechanics:

- SQLite library choice
- Table schema (Segment + optional Trip grouping + TimelineDay derived view)
- Migration of existing v5.2.2 `driveLog` data into new schema
- Export format details (CSV / GeoJSON / JSON)
- Restore/import path
- Backup cadence (manual vs automatic) and destination

The decisive constraints from upstream ADRs:
- ADR-1 §D2: Segment is persistence unit, Timeline is read view, Trip is optional derived grouping
- ADR-1 §D3: data-entry mode is automatic+confirm hybrid → schema must distinguish pending vs confirmed segments
- ADR-1 §D5: identity rename will produce new packageId → Android-private storage path changes → no auto-migration of SQLite DB between old/new install; migration is one-shot at cutover, not ongoing

## Decision

### D1: SQLite library = `@capacitor-community/sqlite`

Use `@capacitor-community/sqlite` (the canonical community plugin for Capacitor 7 Android+iOS+Web).

Rationale:
- Maintained, Capacitor 7 compatible (active releases through 2026)
- Encrypted-DB option available if operator later wants at-rest encryption
- Native + Web fallback (sql.js) — PWA legacy still functional if needed for debug
- Single-file `.db` artifact simplifies backup (copy file)

Rejected alternatives:
- `expo-sqlite`: Expo-tied, foreign to Capacitor stack
- Raw IndexedDB: schema-less, fragile for relational shape, no real query support
- Continue Zustand persist localStorage: not durable enough for long-lived movement history (per Pro Bridge axis 3 risk)
- WatermelonDB / RxDB: heavier than needed for single-user

### D2: Schema

Three tables + one optional table:

```sql
-- Authoritative persistence unit
CREATE TABLE segments (
  id              TEXT PRIMARY KEY,           -- ULID
  started_at      TEXT NOT NULL,              -- ISO 8601 UTC
  ended_at        TEXT,                       -- null = open / still active
  mode            TEXT NOT NULL CHECK(mode IN ('walk','bike','car','train')),
  distance_meters REAL,                       -- nullable for manual entries without GPS
  path_geojson    TEXT,                       -- GeoJSON LineString JSON, nullable
  from_label      TEXT,
  to_label        TEXT,
  note            TEXT,
  source          TEXT NOT NULL CHECK(source IN ('manual','gps','import')),
  confidence      REAL,                       -- 0.0-1.0, for source='gps' only
  status          TEXT NOT NULL CHECK(status IN ('pending','confirmed','discarded')) DEFAULT 'pending',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX idx_segments_started_at ON segments(started_at);
CREATE INDEX idx_segments_status_started ON segments(status, started_at);
CREATE INDEX idx_segments_mode ON segments(mode);

-- Optional user-curated grouping (commute = walk→train→walk, etc.)
CREATE TABLE trips (
  id              TEXT PRIMARY KEY,
  label           TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE TABLE trip_segments (
  trip_id         TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  segment_id      TEXT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  ordinal         INTEGER NOT NULL,
  PRIMARY KEY (trip_id, segment_id)
);

-- Schema metadata
CREATE TABLE schema_meta (
  key             TEXT PRIMARY KEY,
  value           TEXT NOT NULL
);
INSERT INTO schema_meta (key, value) VALUES
  ('schema_version', '1'),
  ('app_id', 'movement-log'),               -- replaced at cutover with chosen name
  ('initialized_at', strftime('%Y-%m-%dT%H:%M:%fZ','now'));
```

Notes:
- `path_geojson` stored as JSON text (SQLite has no GeoJSON type). Read/write through small helpers.
- `status='pending'` for AutoTrip-detected unconfirmed segments. Confirm UI flips to `confirmed`. Discarded = soft-delete (kept for undo, hard-deleted on operator-triggered purge).
- TimelineDay is a derived view, not a table. Computed on demand: `SELECT * FROM segments WHERE status='confirmed' AND date(started_at, 'localtime') = $date ORDER BY started_at`.
- Schema versioning starts at `1`. Future migrations via versioned migration files.

### D3: Migration from v5.2.2 `driveLog` data (one-shot at cutover)

Since packageId changes (ADR-1 §D5), Android-private storage is NOT carried over. Migration is operator-initiated and one-shot:

1. **Pre-cutover (in v5.2.2)**: operator opens v5.2.2 → Settings → "Export All Data" → writes JSON backup to Drive (yamaga101 carve-out).
2. **Cutover**: install new app → first launch shows "Import legacy data" prompt → operator picks JSON file → app maps:
   - Each `driveLog` entry → 1 `segments` row with `mode='car'` (default, since v5.2.2 was EV-centric and didn't have mode), `source='import'`, `status='confirmed'`, `path_geojson=null` (driveLog had no GPS path stored)
   - Charging/maintenance/vehicle entries: **not imported** (they don't fit the new domain model; CSV archive from ADR-3 preflight is the canonical historical record for those).
   - Confirmed/pending Trip queue from `useAutoTripStore` → `segments` with appropriate status, preserving timestamps
3. **Post-import**: operator verifies counts match → enables AutoTrip → app is operational.

Migration code lives in `src/services/migration/v5-to-v6.ts`, runs once, idempotent (re-running with same input file is a no-op).

Alternative considered (rejected): write a Capacitor file-copy bridge to lift the old app-private DB before uninstall. Rejected because: (a) Android security model prevents one app reading another's private storage without root, (b) the export-then-import path is simpler and operator-controlled, (c) v5.2.2 Zustand-persist is in `localStorage` (WebView), not a SQLite DB anyway — the lift wouldn't be a file copy, would require running the old app once and exporting.

### D4: Export formats (3 formats, parallel)

#### CSV (tabular review, Spreadsheet import)

```
id,started_at,ended_at,mode,distance_meters,from_label,to_label,note,source,confidence,status
01HX...,2026-05-17T08:12:30Z,2026-05-17T08:34:15Z,walk,1240,home,nishitetsu-fukuoka,morning commute leg 1,gps,0.92,confirmed
...
```

- One row per segment
- `path_geojson` column omitted (CSV is for tabular review, not geometry)
- Timestamps as ISO 8601 UTC (Spreadsheet handles tz on display)
- One CSV file per export (date-stamped filename: `segments-YYYY-MM-DD.csv`)

#### GeoJSON (mapping tools — geojson.io, QGIS, etc.)

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "exported_at": "2026-05-17T12:00:00Z",
    "schema_version": "1",
    "app_id": "movement-log"
  },
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "LineString", "coordinates": [[lng,lat],[lng,lat],...] },
      "properties": {
        "id": "01HX...", "mode": "walk", "started_at": "2026-05-17T08:12:30Z",
        "ended_at": "2026-05-17T08:34:15Z", "distance_meters": 1240,
        "from_label": "home", "to_label": "nishitetsu-fukuoka",
        "source": "gps", "confidence": 0.92, "status": "confirmed"
      }
    }
  ]
}
```

- Only segments with `path_geojson IS NOT NULL` included
- One GeoJSON file per export

#### JSON (full-fidelity backup/restore)

```json
{
  "schema_version": "1",
  "exported_at": "2026-05-17T12:00:00Z",
  "app_id": "movement-log",
  "segments": [
    { "id": "...", "started_at": "...", ..., "path_geojson": {...} }
  ],
  "trips": [
    { "id": "...", "label": "morning commute", "segments": ["id1","id2","id3"] }
  ]
}
```

- Round-trip safe: import of this JSON reconstructs SQLite exactly
- Used as the v5→v6 migration vehicle (ADR-2 §D3) and as periodic backup
- One JSON file per export

### D5: Export trigger UX

Two trigger paths:

#### Manual

- Settings → Backup → "Export All" → file picker → write to Drive folder
- Per-format buttons: "Export CSV (last 30 days)", "Export GeoJSON (last 30 days)", "Export JSON (full backup)"
- Date range picker for CSV/GeoJSON (default: last 30 days; option: all)
- Confirmation toast on success with row count

#### Automatic (opt-in, weekly)

- Settings → Backup → Toggle "Weekly auto-backup to Drive"
- Cron-equivalent: Sunday 03:00 local time
- Writes JSON full-backup to `Drive:/movement-log/backups/movement-log-backup-YYYY-MM-DD.json`
- Notification on success/failure
- Keeps last 8 backups (rolling); older are deleted automatically
- Failure modes: Drive auth lapsed → notification + Settings highlights re-auth button; Drive quota full → notification + manual cleanup hint

Drive integration reuses yamaga101 carve-out auth flow (operator already authenticated through existing app's GAS sync, but the new app's auth is separate since packageId changes — re-auth at first backup).

### D6: Restore / Import

- Settings → Backup → "Import from backup..."
- File picker: accept `.json` (full backup) or `.csv` (segments-only append)
- Pre-import validation: parse schema_version, app_id, segment shape; show count to be imported
- Conflict resolution: per-segment ID UPSERT (incoming wins on conflict). Operator confirmation prompt before overwriting >0 existing rows
- Atomic: BEGIN TRANSACTION → all inserts → COMMIT (or rollback on any failure)
- Post-import: count summary toast + Settings shows last import timestamp

### D7: Archive format versioning

`schema_version` starts at `"1"`. Export files embed schema_version in metadata. Future schema changes:
- Additive (new optional column): increment to `"1.1"`, old imports still work
- Breaking (remove/rename column): increment to `"2"`, app provides migration on import
- Forward-only: a v1 app cannot import a v2 backup; v2 app can import v1 (with migration). v2 app exports only v2.

## Consequences

### Positive

- **Crash-safe persistence**: SQLite ACID transactions vs Zustand-persist localStorage (which can corrupt under partial writes)
- **Real query capability**: filter by date/mode/status/distance without loading all rows into memory
- **Backup completeness**: 3 formats cover human review (CSV), geometry (GeoJSON), and full-fidelity restore (JSON)
- **No live API dependency**: app functions fully offline; Drive sync is opt-in
- **Migration path defined**: v5.2.2 → v6 not a data-loss event for movement history (charging/maintenance go to CSV archive per ADR-3 preflight)
- **Future extensibility**: trips table exists from day 1 even if UI ships without it; adding "group as trip" UI later doesn't need migration

### Negative

- **First implementation cost**: ~3-4 dev sessions (SQLite plugin setup, schema migrations, repository pattern for segments, export writers × 3, import parser, Settings UI for backup)
- **Native plugin = native build complexity**: `@capacitor-community/sqlite` requires `cap sync` after install + Android Studio build verify per memory `feedback_capacitor_build_pipeline`
- **PWA legacy fallback uses sql.js** (heavier bundle for web target). Acceptable since PWA is debug-only now
- **Drive backup competes with GAS auth in carve-out** — operator must re-auth at first use (one-time)
- **No multi-device sync**: deliberate, but operator must export-then-import manually if ever switching devices

### Neutral

- Schema versioned, migration framework starts simple (just version comparison + per-version migration function). Cost grows linearly with schema changes.
- Backup file paths follow `movement-log/` convention in Drive (new folder, doesn't conflict with old `ev-manager/` data)

## Alternatives Rejected

### A1: Continue Zustand persist as primary store, no SQLite

**Why rejected**: ADR-1 §D4 / Pro Bridge axis 3 risk explicit — Zustand-persist localStorage is not durable enough for long-lived movement history. Single corrupt write can lose months of data. SQLite ACID is the minimum bar for a personal log.

### A2: Use IndexedDB directly (no SQLite plugin)

**Why rejected**: IndexedDB lacks schema enforcement, has poor query story, and requires more custom code than SQLite for the same outcomes. SQLite gives `CHECK` constraints, indexes, transactions, and SQL — all of which save implementation effort.

### A3: Keep GAS sync as alternative backup tier

**Why rejected**: ADR-1 §D4 retired GAS for this app. Adding it back as "backup tier" reintroduces the schema-migration problem Pro Bridge identified. Drive file backups (JSON) achieve the same off-device durability without the schema-coupling.

### A4: Single export format (just JSON)

**Why rejected**: JSON is great for round-trip but poor for human review and incompatible with mapping tools. The cost of CSV + GeoJSON writers is low (~50L each); the operator's review/visualization workflows are too valuable to gate on JSON parsing.

### A5: Cloud sync via Firebase / Supabase / custom backend

**Why rejected**: Operator is sole user, single device, side-loaded distribution. Cloud sync brings auth + cost + backend maintenance with no multi-device or multi-user benefit. Local-first + Drive backup gives identical durability with zero backend cost.

### A6: Path geometry stored as encoded polyline (Google-style) instead of GeoJSON

**Why rejected**: GeoJSON is more interoperable (geojson.io, QGIS, Leaflet, etc. all consume it directly). Encoded polyline saves bytes (~50% smaller) but adds a decode step. For single-user app with <100K segments lifetime, the byte savings don't justify the interop cost.

## Open questions (resolved in implementation PR)

- **AutoTrip mode inference algorithm**: current v5.2.2 P2 AutoTrip infers based on avg speed (presumably). For v6 with walk/bike/car/train modes, the threshold table needs documentation. Out of ADR-2 scope; goes in implementation README.
- **SQLite encryption at rest**: skipping for v6.0.0, add later if operator wants
- **Trip auto-grouping** (e.g., infer commute trip from "walk → train → walk" pattern): out of scope for first ship, manual grouping UI only

## Evidence

- ADR-1 §D4 establishes policy direction (local-first + export)
- Capacitor 7 + `@capacitor-community/sqlite` confirmed compatible via plugin's release notes (operator can verify via `npm view @capacitor-community/sqlite peerDependencies`)
- yamaga101 carve-out Drive auth flow exists (current GAS sync uses it via OAuth in `useSyncStore` infrastructure that ADR-1 KEEP set preserves)

## Related

- ADR-1 `system-pivot-to-movement-log-2026-05-17.md` — domain model (D2 Timeline+Segments, D4 storage policy direction)
- ADR-3 `system-pivot-cutover-2026-05-17.md` — cutover sequence (consumes ADR-2 §D3 migration script + §D5 export trigger)
- `p2-auto-trip-design.md` — existing AutoTrip mode inference (carries forward, schema integration noted in §D3)
- Memory: `feedback_capacitor_build_pipeline.md` (cap:sync requirement)
