// useBackgroundGeolocation — P0-3 PoC: transistorsoft demo で 3日連続 BG 測位生存テスト
// Council 推奨設定値ベース。Universal 移動ログの素地。
//
// 結果 (location/motionchange/activitychange) は console + localStorage に蓄積。
// 本格実装は P2 で SQLite + GAS sync に切替。

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
const POC_MAX_SAMPLES = 5000; // 3 日 ~ 数千件想定

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
    let unsubscribers: Array<() => void> = [];

    async function init() {
      if (!Capacitor.isNativePlatform()) {
        if (!cancelled) setStats((s) => ({ ...s, error: "native only" }));
        return;
      }

      try {
        // dynamic import で web ビルドが死なないように
        const mod = await import(
          /* @vite-ignore */ "@transistorsoft/capacitor-background-geolocation"
        );
        const BG = mod.default ?? mod;

        // listeners
        const locSub = BG.onLocation((loc: any) => {
          const sample: PocLocationSample = {
            ts: new Date(loc.timestamp).toISOString(),
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            speed: loc.coords.speed ?? null,
            accuracy: loc.coords.accuracy,
            activity: loc.activity?.type ?? null,
            isMoving: !!loc.is_moving,
          };
          appendSample(sample);
          if (!cancelled) {
            const arr = JSON.parse(localStorage.getItem(POC_STORAGE_KEY) || "[]");
            setStats((s) => ({
              ...s,
              sampleCount: arr.length,
              lastTs: sample.ts,
              lastActivity: sample.activity,
              isMoving: sample.isMoving,
            }));
          }
        });
        unsubscribers.push(() => locSub.remove?.());

        const motionSub = BG.onMotionChange((event: any) => {
          console.log("[BG-POC] motionchange", event.isMoving, event.location);
        });
        unsubscribers.push(() => motionSub.remove?.());

        const activitySub = BG.onActivityChange((event: any) => {
          console.log("[BG-POC] activitychange", event.activity, event.confidence);
          if (!cancelled) {
            setStats((s) => ({ ...s, lastActivity: event.activity }));
          }
        });
        unsubscribers.push(() => activitySub.remove?.());

        // ready (Council 推奨設定)
        const state = await BG.ready({
          desiredAccuracy: BG.DESIRED_ACCURACY_HIGH,
          distanceFilter: 10,
          stopTimeout: 15,
          stationaryRadius: 25,
          activityRecognitionInterval: 10000,
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
          notification: {
            title: "EV Manager — 移動記録",
            text: "アプリは BG で位置を記録しています",
            sticky: true,
          },
          debug: false, // PoC 中は false (true にすると効果音うるさい)
          logLevel: BG.LOG_LEVEL_VERBOSE,
        });

        if (!cancelled) setStats((s) => ({ ...s, ready: true, enabled: state.enabled }));

        if (!state.enabled) {
          await BG.start();
          if (!cancelled) setStats((s) => ({ ...s, enabled: true }));
        }
      } catch (e) {
        console.error("[BG-POC] init error", e);
        if (!cancelled) setStats((s) => ({ ...s, error: String(e) }));
      }
    }

    init();
    return () => {
      cancelled = true;
      unsubscribers.forEach((fn) => fn());
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
