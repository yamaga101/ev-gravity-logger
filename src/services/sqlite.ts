// SQLite service — P2 Auto Trip 用永続層
//
// 設計詳細: docs/specs/p2-auto-trip-design.md
// native (Android) のみ動作。Web は no-op (returns null DB)、上位 hook が
// localStorage fallback を続けるので break しない。
//
// 全 export は idempotent: open は 2 回呼んでも同じ instance、migrations は
// schema_version を見て差分のみ apply。

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

const DB_NAME = "ev_manager_v1";
const SCHEMA_VERSION = 1;

let _sqlite: SQLiteConnection | null = null;
let _db: SQLiteDBConnection | null = null;
let _opening: Promise<SQLiteDBConnection | null> | null = null;

const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS gps_samples (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       ts TEXT NOT NULL,
       lat REAL NOT NULL,
       lng REAL NOT NULL,
       speed_mps REAL,
       accuracy_m REAL NOT NULL,
       is_moving INTEGER NOT NULL,
       trip_id TEXT
     );`,
    `CREATE INDEX IF NOT EXISTS idx_samples_ts ON gps_samples(ts);`,
    `CREATE INDEX IF NOT EXISTS idx_samples_trip ON gps_samples(trip_id);`,
    `CREATE TABLE IF NOT EXISTS trips (
       id TEXT PRIMARY KEY,
       start_ts TEXT NOT NULL,
       end_ts TEXT NOT NULL,
       start_lat REAL NOT NULL,
       start_lng REAL NOT NULL,
       end_lat REAL NOT NULL,
       end_lng REAL NOT NULL,
       distance_m REAL NOT NULL,
       duration_s INTEGER NOT NULL,
       sample_count INTEGER NOT NULL,
       avg_speed_mps REAL,
       max_speed_mps REAL,
       status TEXT NOT NULL,
       drive_log_id TEXT,
       confirmed_at TEXT
     );`,
    `CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);`,
    `CREATE INDEX IF NOT EXISTS idx_trips_start ON trips(start_ts);`,
    `CREATE TABLE IF NOT EXISTS schema_meta (
       key TEXT PRIMARY KEY,
       value TEXT NOT NULL
     );`,
  ],
};

export function isSqliteAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function openDb(): Promise<SQLiteDBConnection | null> {
  if (!isSqliteAvailable()) return null;
  if (_db) return _db;
  if (_opening) return _opening;

  _opening = (async () => {
    try {
      _sqlite = _sqlite ?? new SQLiteConnection(CapacitorSQLite);

      // 既存 connection の再利用 (cold reload 後など)
      const ret = await _sqlite.checkConnectionsConsistency();
      const isConn = (await _sqlite.isConnection(DB_NAME, false)).result;
      if (ret.result && isConn) {
        _db = await _sqlite.retrieveConnection(DB_NAME, false);
      } else {
        _db = await _sqlite.createConnection(
          DB_NAME,
          false,
          "no-encryption",
          1,
          false,
        );
      }
      await _db.open();
      await runMigrations(_db);
      return _db;
    } catch (e) {
      console.error("[sqlite] openDb failed", e);
      _db = null;
      return null;
    } finally {
      _opening = null;
    }
  })();

  return _opening;
}

async function runMigrations(db: SQLiteDBConnection): Promise<void> {
  // 初回は schema_meta が無いので catch で 0 扱い
  let current = 0;
  try {
    await db.execute(
      `CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`,
    );
    const r = await db.query(
      `SELECT value FROM schema_meta WHERE key = 'schema_version' LIMIT 1;`,
    );
    if (r.values && r.values.length > 0) {
      current = parseInt(String(r.values[0].value), 10) || 0;
    }
  } catch {
    current = 0;
  }

  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const stmts = MIGRATIONS[v];
    if (!stmts) continue;
    for (const sql of stmts) {
      await db.execute(sql);
    }
    await db.run(
      `INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('schema_version', ?);`,
      [String(v)],
    );
  }
}

export async function getDb(): Promise<SQLiteDBConnection | null> {
  return openDb();
}

// ─── gps_samples helpers ──────────────────────────────────────

export interface SqliteSampleRow {
  id?: number;
  ts: string;
  lat: number;
  lng: number;
  speed_mps: number | null;
  accuracy_m: number;
  is_moving: 0 | 1;
  trip_id: string | null;
}

export async function insertSample(s: SqliteSampleRow): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const r = await db.run(
    `INSERT INTO gps_samples (ts, lat, lng, speed_mps, accuracy_m, is_moving, trip_id)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [s.ts, s.lat, s.lng, s.speed_mps, s.accuracy_m, s.is_moving, s.trip_id],
  );
  return r.changes?.lastId ?? null;
}

export async function bulkInsertSamples(rows: SqliteSampleRow[]): Promise<number> {
  const db = await getDb();
  if (!db || rows.length === 0) return 0;
  const stmt = `INSERT INTO gps_samples (ts, lat, lng, speed_mps, accuracy_m, is_moving, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?);`;
  const set = rows.map((s) => ({
    statement: stmt,
    values: [s.ts, s.lat, s.lng, s.speed_mps, s.accuracy_m, s.is_moving, s.trip_id],
  }));
  const r = await db.executeSet(set);
  return r.changes?.changes ?? 0;
}

export async function countSamples(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const r = await db.query(`SELECT COUNT(*) AS n FROM gps_samples;`);
  return Number(r.values?.[0]?.n ?? 0);
}

export async function getRecentSamples(limit = 100): Promise<SqliteSampleRow[]> {
  const db = await getDb();
  if (!db) return [];
  const r = await db.query(
    `SELECT id, ts, lat, lng, speed_mps, accuracy_m, is_moving, trip_id
     FROM gps_samples ORDER BY ts DESC LIMIT ?;`,
    [limit],
  );
  return (r.values ?? []) as SqliteSampleRow[];
}

export async function getSamplesAfter(tsIso: string, limit = 1000): Promise<SqliteSampleRow[]> {
  const db = await getDb();
  if (!db) return [];
  const r = await db.query(
    `SELECT id, ts, lat, lng, speed_mps, accuracy_m, is_moving, trip_id
     FROM gps_samples WHERE ts > ? ORDER BY ts ASC LIMIT ?;`,
    [tsIso, limit],
  );
  return (r.values ?? []) as SqliteSampleRow[];
}

export async function getAllSamplesAsc(): Promise<SqliteSampleRow[]> {
  const db = await getDb();
  if (!db) return [];
  const r = await db.query(
    `SELECT id, ts, lat, lng, speed_mps, accuracy_m, is_moving, trip_id
     FROM gps_samples ORDER BY ts ASC;`,
  );
  return (r.values ?? []) as SqliteSampleRow[];
}

export async function updateSampleTripId(sampleId: number, tripId: string | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.run(`UPDATE gps_samples SET trip_id = ? WHERE id = ?;`, [tripId, sampleId]);
}

export async function bulkUpdateSampleTripIds(
  sampleIds: number[],
  tripId: string | null,
): Promise<void> {
  const db = await getDb();
  if (!db || sampleIds.length === 0) return;
  const placeholders = sampleIds.map(() => "?").join(",");
  await db.run(
    `UPDATE gps_samples SET trip_id = ? WHERE id IN (${placeholders});`,
    [tripId, ...sampleIds],
  );
}

// ─── trips helpers ────────────────────────────────────────────

export interface SqliteTripRow {
  id: string;
  start_ts: string;
  end_ts: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance_m: number;
  duration_s: number;
  sample_count: number;
  avg_speed_mps: number | null;
  max_speed_mps: number | null;
  status: "pending" | "confirmed" | "ignored";
  drive_log_id: string | null;
  confirmed_at: string | null;
}

export async function upsertTrip(t: SqliteTripRow): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.run(
    `INSERT INTO trips (id, start_ts, end_ts, start_lat, start_lng, end_lat, end_lng,
       distance_m, duration_s, sample_count, avg_speed_mps, max_speed_mps, status, drive_log_id, confirmed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       end_ts=excluded.end_ts,
       end_lat=excluded.end_lat,
       end_lng=excluded.end_lng,
       distance_m=excluded.distance_m,
       duration_s=excluded.duration_s,
       sample_count=excluded.sample_count,
       avg_speed_mps=excluded.avg_speed_mps,
       max_speed_mps=excluded.max_speed_mps,
       status=excluded.status,
       drive_log_id=excluded.drive_log_id,
       confirmed_at=excluded.confirmed_at;`,
    [
      t.id,
      t.start_ts,
      t.end_ts,
      t.start_lat,
      t.start_lng,
      t.end_lat,
      t.end_lng,
      t.distance_m,
      t.duration_s,
      t.sample_count,
      t.avg_speed_mps,
      t.max_speed_mps,
      t.status,
      t.drive_log_id,
      t.confirmed_at,
    ],
  );
}

export async function getAllTrips(): Promise<SqliteTripRow[]> {
  const db = await getDb();
  if (!db) return [];
  const r = await db.query(
    `SELECT id, start_ts, end_ts, start_lat, start_lng, end_lat, end_lng,
       distance_m, duration_s, sample_count, avg_speed_mps, max_speed_mps,
       status, drive_log_id, confirmed_at
     FROM trips ORDER BY start_ts DESC;`,
  );
  return (r.values ?? []) as SqliteTripRow[];
}

export async function setTripStatus(
  id: string,
  status: SqliteTripRow["status"],
  driveLogId: string | null = null,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const confirmedAt = status === "confirmed" ? new Date().toISOString() : null;
  await db.run(
    `UPDATE trips SET status = ?, drive_log_id = ?, confirmed_at = ? WHERE id = ?;`,
    [status, driveLogId, confirmedAt, id],
  );
}

export async function deleteAllTrips(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(`DELETE FROM trips;`);
  await db.execute(`UPDATE gps_samples SET trip_id = NULL;`);
}
