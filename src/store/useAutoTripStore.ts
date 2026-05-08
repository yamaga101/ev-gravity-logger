// AutoTripStore — SQLite trips table の React 側 view + 操作 API
//
// 設計: docs/specs/p2-auto-trip-design.md
//
// SQLite が source of truth、zustand は memory cache + React rerender 用。
// SQLite 不通 (Web) では空配列のまま安全動作。
// 永続化は SQLite 側で済んでいるので zustand persist は使わない。

import { create } from "zustand";
import type { AutoTripRecord } from "../types/index.ts";
import {
  getAllTrips,
  setTripStatus,
  isSqliteAvailable,
  type SqliteTripRow,
} from "../services/sqlite";
import { recomputeAllTrips } from "../services/trip-segmenter";

function rowToRecord(r: SqliteTripRow): AutoTripRecord {
  return {
    id: r.id,
    startTs: r.start_ts,
    endTs: r.end_ts,
    startLat: r.start_lat,
    startLng: r.start_lng,
    endLat: r.end_lat,
    endLng: r.end_lng,
    distanceM: r.distance_m,
    durationS: r.duration_s,
    sampleCount: r.sample_count,
    avgSpeedMps: r.avg_speed_mps,
    maxSpeedMps: r.max_speed_mps,
    status: r.status,
    driveLogId: r.drive_log_id,
    confirmedAt: r.confirmed_at,
  };
}

interface AutoTripState {
  trips: AutoTripRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  confirm: (id: string, driveLogId: string) => Promise<void>;
  ignore: (id: string) => Promise<void>;
  recompute: () => Promise<{ tripsCreated: number; samplesProcessed: number } | null>;
}

export const useAutoTripStore = create<AutoTripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,
  refresh: async () => {
    if (!isSqliteAvailable()) {
      set({ trips: [], loading: false, error: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const rows = await getAllTrips();
      set({ trips: rows.map(rowToRecord), loading: false });
    } catch (e) {
      console.error("[autotrip] refresh failed", e);
      set({ loading: false, error: String(e) });
    }
  },
  confirm: async (id, driveLogId) => {
    if (!isSqliteAvailable()) return;
    try {
      await setTripStatus(id, "confirmed", driveLogId);
      await get().refresh();
    } catch (e) {
      console.error("[autotrip] confirm failed", e);
      set({ error: String(e) });
    }
  },
  ignore: async (id) => {
    if (!isSqliteAvailable()) return;
    try {
      await setTripStatus(id, "ignored", null);
      await get().refresh();
    } catch (e) {
      console.error("[autotrip] ignore failed", e);
      set({ error: String(e) });
    }
  },
  recompute: async () => {
    if (!isSqliteAvailable()) return null;
    set({ loading: true, error: null });
    try {
      const r = await recomputeAllTrips();
      await get().refresh();
      return r;
    } catch (e) {
      console.error("[autotrip] recompute failed", e);
      set({ loading: false, error: String(e) });
      return null;
    }
  },
}));
