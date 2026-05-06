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
// 結果 (location) は localStorage に蓄積。本格実装は P2 で SQLite + GAS sync に切替。

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

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

function appendSample(s: PocLocationSample) {
  try {
    const raw = localStorage.getItem(POC_STORAGE_KEY) || "[]";
    const arr = JSON.parse(raw) as PocLocationSample[];
    arr.push(s);
    if (arr.length > POC_MAX_SAMPLES) arr.splice(0, arr.length - POC_MAX_SAMPLES);
    localStorage.setItem(POC_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error("[BG-POC] save failed", e);
  }
}

export interface BgPocStats {
  ready: boolean;
  enabled: boolean;
  sampleCount: number;
  lastTs: string | null;
  lastActivity: string | null;
  isMoving: boolean;
  error: string | null;
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
  });

  useEffect(() => {
    let cancelled = false;
    let watcherId: string | null = null;

    async function init() {
      if (!Capacitor.isNativePlatform()) {
        if (!cancelled) setStats((s) => ({ ...s, error: "native only" }));
        return;
      }

      try {
        const mod = await import(
          /* @vite-ignore */ "@capacitor-community/background-geolocation"
        );
        const BG = mod.BackgroundGeolocation ?? (mod as any).default ?? mod;

        watcherId = await BG.addWatcher(
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

            const sample: PocLocationSample = {
              ts: new Date(location.time ?? Date.now()).toISOString(),
              lat: location.latitude,
              lng: location.longitude,
              speed: speedMps,
              accuracy: location.accuracy ?? 0,
              activity,
              isMoving,
            };
            appendSample(sample);

            if (!cancelled) {
              const arr = JSON.parse(localStorage.getItem(POC_STORAGE_KEY) || "[]");
              setStats((s) => ({
                ...s,
                ready: true,
                enabled: true,
                sampleCount: arr.length,
                lastTs: sample.ts,
                lastActivity: activity,
                isMoving,
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
        // dynamic import 経由で plugin を取り出して removeWatcher
        import(
          /* @vite-ignore */ "@capacitor-community/background-geolocation"
        ).then((mod) => {
          const BG = (mod as any).BackgroundGeolocation ?? (mod as any).default ?? mod;
          BG.removeWatcher({ id: watcherId }).catch((e: any) =>
            console.warn("[BG-POC] removeWatcher failed", e),
          );
        });
      }
    };
  }, []);

  return stats;
}

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
