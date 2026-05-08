// useBackgroundGeolocation — community plugin (@capacitor-community/background-geolocation)
//
// 2026-05-06 Pro Bridge L4 council 後の path D' 採択で transistorsoft (有償) から
// 移行。license popup 解消が主目的。activity recognition (IN_VEHICLE 等) は失われ、
// motion / heartbeat 系 callback も無くなったが、yamaga101 個人 carve-out で
// S25 Ultra 専用 + battery 最適化手動 OFF なら community で十分という判定。
//
// 旧 transistorsoft 版の API surface (stats.ready / enabled / sampleCount /
// lastTs / lastActivity / isMoving / error) は維持。lastActivity は AR がない
// ので speed ベースで MOVING / STILL を合成する。
//
// 2026-05-08 v5.1.0: P2 Auto Trip 着地に伴い SQLite write-through に切替。
//   - native: SQLite gps_samples + trip-segmenter.tickIncremental に投入
//   - web: localStorage fallback (PoC のまま、`ev-poc-bg-locations`)
//   - 起動時: 旧 localStorage の samples を SQLite に 1 回 import (冪等)
// 詳細: docs/specs/p2-auto-trip-design.md

import { useEffect, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import {
  insertSample,
  countSamples,
  isSqliteAvailable,
} from "../services/sqlite";
import {
  tickIncremental,
  importLegacyLocalStorageSamples,
} from "../services/trip-segmenter";

// community plugin は types-only で main JS を export しない。
// 使う側で registerPlugin して native bridge を取り出す。
const BackgroundGeolocation =
  registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

export interface PocLocationSample {
  ts: string;
  lat: number;
  lng: number;
  speed: number | null;
  accuracy: number;
  activity: string | null;
  isMoving: boolean;
}

const POC_STORAGE_KEY = "ev-poc-bg-locations";
const POC_MAX_SAMPLES = 5000;
// speed (m/s) ≥ 1.0 を MOVING (≈ 3.6km/h、徒歩〜)。歩行+運転両方とも MOVING 扱い。
// transistorsoft の AR ベース IN_VEHICLE / ON_FOOT 細分はもう取れないので、簡素化。
const MOVING_SPEED_THRESHOLD_MPS = 1.0;

// ─── localStorage fallback (web / SQLite 不通時) ──────────────

function appendSampleLocalStorage(s: PocLocationSample) {
  try {
    const raw = localStorage.getItem(POC_STORAGE_KEY) || "[]";
    const arr = JSON.parse(raw) as PocLocationSample[];
    arr.push(s);
    if (arr.length > POC_MAX_SAMPLES) arr.splice(0, arr.length - POC_MAX_SAMPLES);
    localStorage.setItem(POC_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error("[BG-POC] localStorage save failed", e);
  }
}

// ─── stats hook ───────────────────────────────────────────────

export interface BgPocStats {
  ready: boolean;
  enabled: boolean;
  sampleCount: number;
  lastTs: string | null;
  lastActivity: string | null;
  isMoving: boolean;
  error: string | null;
  lastLat: number | null;
  lastLng: number | null;
  lastSpeedMps: number | null;
  lastAccuracyM: number | null;
}

export function useBackgroundGeolocation() {
  const [stats, setStats] = useState<BgPocStats>({
    ready: false,
    enabled: false,
    sampleCount: 0,
    lastTs: null,
    lastActivity: null,
    isMoving: false,
    error: null,
    lastLat: null,
    lastLng: null,
    lastSpeedMps: null,
    lastAccuracyM: null,
  });

  useEffect(() => {
    let cancelled = false;
    let watcherId: string | null = null;

    async function init() {
      if (!Capacitor.isNativePlatform()) {
        if (!cancelled) setStats((s) => ({ ...s, error: "native only" }));
        return;
      }

      // 起動時 1 回: 旧 localStorage samples を SQLite に import
      try {
        const existing = await countSamples();
        if (existing === 0) {
          const imported = await importLegacyLocalStorageSamples();
          if (imported > 0) {
            console.log(`[BG-POC] migrated ${imported} legacy samples to SQLite`);
          }
        }
      } catch (e) {
        console.warn("[BG-POC] legacy migration failed", e);
      }

      try {
        watcherId = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: "EV Manager — BG GPS で位置を記録中",
            backgroundTitle: "EV Manager",
            requestPermissions: true,
            stale: false,
            distanceFilter: 10,
          },
          (location: any, error: any) => {
            if (error) {
              console.error("[BG-POC] watcher error", error);
              if (!cancelled) {
                setStats((s) => ({ ...s, error: String(error?.message ?? error) }));
              }
              return;
            }
            if (!location) return;

            const speedMps: number | null =
              typeof location.speed === "number" && !Number.isNaN(location.speed)
                ? location.speed
                : null;
            const isMoving =
              speedMps != null && speedMps >= MOVING_SPEED_THRESHOLD_MPS;
            const activity = isMoving ? "MOVING" : "STILL";
            const ts = new Date(location.time ?? Date.now()).toISOString();
            const accuracyM = location.accuracy ?? 0;

            // SQLite write-through (+ segmenter tick)。失敗しても fallback で続行
            void (async () => {
              try {
                if (isSqliteAvailable()) {
                  const sampleId = await insertSample({
                    ts,
                    lat: location.latitude,
                    lng: location.longitude,
                    speed_mps: speedMps,
                    accuracy_m: accuracyM,
                    is_moving: isMoving ? 1 : 0,
                    trip_id: null,
                  });
                  await tickIncremental({
                    sampleId,
                    ts,
                    lat: location.latitude,
                    lng: location.longitude,
                    speedMps,
                    accuracyM,
                    isMoving,
                  });
                }
              } catch (e) {
                console.error("[BG-POC] sqlite write failed", e);
              }
              // localStorage は引き続き短期 PoC ステータス表示用に書く (web 互換)
              appendSampleLocalStorage({
                ts,
                lat: location.latitude,
                lng: location.longitude,
                speed: speedMps,
                accuracy: accuracyM,
                activity,
                isMoving,
              });
            })();

            if (!cancelled) {
              // sampleCount は SQLite が source of truth、native では SQLite から取得
              if (isSqliteAvailable()) {
                void countSamples().then((n) => {
                  if (!cancelled) {
                    setStats((s) => ({ ...s, sampleCount: n }));
                  }
                });
              } else {
                const arr = JSON.parse(localStorage.getItem(POC_STORAGE_KEY) || "[]");
                setStats((s) => ({ ...s, sampleCount: arr.length }));
              }
              setStats((s) => ({
                ...s,
                ready: true,
                enabled: true,
                lastTs: ts,
                lastActivity: activity,
                isMoving,
                lastLat: location.latitude,
                lastLng: location.longitude,
                lastSpeedMps: speedMps,
                lastAccuracyM: accuracyM,
              }));
            }
          },
        );

        if (!cancelled) {
          setStats((s) => ({ ...s, ready: true, enabled: true }));
        }
      } catch (e) {
        console.error("[BG-POC] init error", e);
        if (!cancelled) setStats((s) => ({ ...s, error: String(e) }));
      }
    }

    init();
    return () => {
      cancelled = true;
      if (watcherId) {
        BackgroundGeolocation.removeWatcher({ id: watcherId }).catch((e: any) =>
          console.warn("[BG-POC] removeWatcher failed", e),
        );
      }
    };
  }, []);

  return stats;
}

// ─── legacy export (Settings の export JSON 用) ───────────────

export function exportPocSamples(): PocLocationSample[] {
  try {
    return JSON.parse(localStorage.getItem(POC_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearPocSamples(): void {
  localStorage.removeItem(POC_STORAGE_KEY);
}
