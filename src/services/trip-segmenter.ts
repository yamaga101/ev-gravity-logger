// Trip segmenter — gps_samples → trips
//
// 設計詳細: docs/specs/p2-auto-trip-design.md §3 Segmentation engine
//
// 2 モード:
//   1. tickIncremental(sample): native hook が新サンプルごとに呼ぶ。
//      アクティブ trip があれば extend、無ければ start 判定、idle で close。
//   2. recomputeAllTrips(): 全 gps_samples からゼロベースで trips 再構築。
//      migration / debug 用。
//
// 全 export は SQLite 不通 (Web) でも crash せず no-op (return null/0)。

import type { PocLocationSample } from "../hooks/useBackgroundGeolocation";
import {
  getAllSamplesAsc,
  upsertTrip,
  bulkUpdateSampleTripIds,
  insertSample,
  type SqliteSampleRow,
  type SqliteTripRow,
  isSqliteAvailable,
  deleteAllTrips,
} from "./sqlite";

// ─── tunables ─────────────────────────────────────────────────
// MOVING_SPEED_THRESHOLD_MPS は hook 側で is_moving を判定済なので
// ここでは使わない (将来 raw speed から再判定する場合に再利用)。
const MIN_TRIP_DISTANCE_M = 100;                // 100m 未満は破棄 (駐車場)
const MIN_TRIP_DURATION_S = 60;                 // 60 秒未満は破棄
const IDLE_GAP_TO_CLOSE_S = 300;                // STILL 5 分連続で close
const NO_SAMPLE_TIMEOUT_S = 600;                // 10 分新サンプル無しで close

// ─── helpers ──────────────────────────────────────────────────

function uuid(): string {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function tsDiffSec(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 1000;
}

// ─── incremental state ────────────────────────────────────────

interface ActiveTripState {
  id: string;
  startTs: string;
  startLat: number;
  startLng: number;
  lastTs: string;
  lastLat: number;
  lastLng: number;
  distanceM: number;
  sampleIds: number[];
  speeds: number[];   // m/s, 非 null のみ
  movingCount: number;
  stillStreak: number;       // 連続 STILL サンプル数
  stillStreakStartTs: string | null;
}

let _active: ActiveTripState | null = null;

// hook 経由で SQLite 書込を済ませた後に sampleId を渡してもらうので
// 引数で受ける。Web では sampleId=null (no-op になる)。
export interface SegmentInput {
  sampleId: number | null;
  ts: string;
  lat: number;
  lng: number;
  speedMps: number | null;
  accuracyM: number;
  isMoving: boolean;
}

/**
 * 新サンプル投入時に呼ぶ。
 * Returns: trip が close された時に true、それ以外 false。
 */
export async function tickIncremental(s: SegmentInput): Promise<boolean> {
  if (!isSqliteAvailable() || s.sampleId == null) return false;

  // 既存の active trip が timeout していないか先にチェック
  if (_active) {
    const gap = tsDiffSec(_active.lastTs, s.ts);
    if (gap >= NO_SAMPLE_TIMEOUT_S) {
      await closeActiveTrip();
    }
  }

  if (s.isMoving) {
    if (!_active) {
      _active = {
        id: uuid(),
        startTs: s.ts,
        startLat: s.lat,
        startLng: s.lng,
        lastTs: s.ts,
        lastLat: s.lat,
        lastLng: s.lng,
        distanceM: 0,
        sampleIds: [s.sampleId],
        speeds: s.speedMps != null ? [s.speedMps] : [],
        movingCount: 1,
        stillStreak: 0,
        stillStreakStartTs: null,
      };
    } else {
      _active.distanceM += haversineM(
        _active.lastLat,
        _active.lastLng,
        s.lat,
        s.lng,
      );
      _active.lastTs = s.ts;
      _active.lastLat = s.lat;
      _active.lastLng = s.lng;
      _active.sampleIds.push(s.sampleId);
      if (s.speedMps != null) _active.speeds.push(s.speedMps);
      _active.movingCount += 1;
      _active.stillStreak = 0;
      _active.stillStreakStartTs = null;
    }
    return false;
  }

  // STILL sample
  if (_active) {
    _active.lastTs = s.ts;
    _active.sampleIds.push(s.sampleId);
    _active.stillStreak += 1;
    if (_active.stillStreakStartTs == null) {
      _active.stillStreakStartTs = s.ts;
    }
    const stillDur = tsDiffSec(_active.stillStreakStartTs, s.ts);
    if (stillDur >= IDLE_GAP_TO_CLOSE_S) {
      return await closeActiveTrip();
    }
  }
  return false;
}

/**
 * Active trip を強制 close。tunables 未満なら破棄 (sample.trip_id は null のまま)。
 * Returns: 永続化された場合 true、破棄された場合 false。
 */
async function closeActiveTrip(): Promise<boolean> {
  if (!_active) return false;
  const a = _active;
  _active = null;

  const durationS = Math.round(tsDiffSec(a.startTs, a.lastTs));
  const distanceM = a.distanceM;

  // 短すぎる trip は破棄
  if (distanceM < MIN_TRIP_DISTANCE_M || durationS < MIN_TRIP_DURATION_S) {
    return false;
  }

  const avgSpeed =
    a.speeds.length > 0
      ? a.speeds.reduce((x, y) => x + y, 0) / a.speeds.length
      : null;
  const maxSpeed = a.speeds.length > 0 ? Math.max(...a.speeds) : null;

  const trip: SqliteTripRow = {
    id: a.id,
    start_ts: a.startTs,
    end_ts: a.lastTs,
    start_lat: a.startLat,
    start_lng: a.startLng,
    end_lat: a.lastLat,
    end_lng: a.lastLng,
    distance_m: distanceM,
    duration_s: durationS,
    sample_count: a.sampleIds.length,
    avg_speed_mps: avgSpeed,
    max_speed_mps: maxSpeed,
    status: "pending",
    drive_log_id: null,
    confirmed_at: null,
  };
  await upsertTrip(trip);
  await bulkUpdateSampleTripIds(a.sampleIds, a.id);
  return true;
}

/**
 * 起動時など、念のため hung 状態の active trip を flush する用。
 */
export async function flushActiveTripIfStale(maxIdleS = NO_SAMPLE_TIMEOUT_S): Promise<void> {
  if (!_active) return;
  const idle = tsDiffSec(_active.lastTs, new Date().toISOString());
  if (idle >= maxIdleS) {
    await closeActiveTrip();
  }
}

/**
 * 全 gps_samples からゼロベースで trips 再構築。migration / debug 用。
 * 既存 trips は全削除 → サンプル trip_id を null に戻し → 再 segment。
 */
export async function recomputeAllTrips(): Promise<{ tripsCreated: number; samplesProcessed: number }> {
  if (!isSqliteAvailable()) return { tripsCreated: 0, samplesProcessed: 0 };

  await deleteAllTrips();
  _active = null;

  const samples = await getAllSamplesAsc();
  let tripsCreated = 0;

  for (const row of samples) {
    if (row.id == null) continue;
    const closed = await tickIncremental({
      sampleId: row.id,
      ts: row.ts,
      lat: row.lat,
      lng: row.lng,
      speedMps: row.speed_mps,
      accuracyM: row.accuracy_m,
      isMoving: row.is_moving === 1,
    });
    if (closed) tripsCreated += 1;
  }

  // 最後の active trip も close 試行
  const closedFinal = await closeActiveTrip();
  if (closedFinal) tripsCreated += 1;

  return { tripsCreated, samplesProcessed: samples.length };
}

/**
 * localStorage の旧 PoC samples を SQLite に bulk import。
 * 起動時に 1 回呼ばれる想定。冪等: 既に SQLite にデータがあれば no-op。
 */
export async function importLegacyLocalStorageSamples(): Promise<number> {
  if (!isSqliteAvailable()) return 0;

  const POC_KEY = "ev-poc-bg-locations";
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(POC_KEY);
  } catch {
    return 0;
  }
  if (!raw) return 0;

  let arr: PocLocationSample[];
  try {
    arr = JSON.parse(raw) as PocLocationSample[];
  } catch {
    return 0;
  }
  if (!Array.isArray(arr) || arr.length === 0) return 0;

  let imported = 0;
  for (const s of arr) {
    const id = await insertSample({
      ts: s.ts,
      lat: s.lat,
      lng: s.lng,
      speed_mps: s.speed,
      accuracy_m: s.accuracy ?? 0,
      is_moving: s.isMoving ? 1 : 0,
      trip_id: null,
    });
    if (id != null) imported += 1;
  }
  return imported;
}

// helper for type re-export
export type { SqliteSampleRow };
