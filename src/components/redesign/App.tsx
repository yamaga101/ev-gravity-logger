// NEXUS v2 (Direction A) — production entry
// 旧 App は ?ui=v1 で fallback。BottomNav タップで内部 state 切替。
// useBackgroundGeolocation を root で 1 回呼ぶ → BG GPS PoC を死守 (5/6 評価まで)。

import React, { useState, useEffect, useMemo } from "react";
import { useBackgroundGeolocation } from "../../hooks/useBackgroundGeolocation";
import { useChargingStore } from "../../store/useChargingStore";
import { APP_VERSION } from "../../constants/defaults.ts";
import { NavContext } from "./primitives";
import {
  ChargingStartScreen,
  ChargingLiveScreen,
  ChargingCompleteScreen,
  HistoryScreen,
  StatsScreen,
  VehicleScreen,
  SettingsScreen,
} from "./screens-main";
import {
  MaintenanceScreen,
  InspectionScreen,
  MeterCaptureScreen,
  OnboardingScreen,
  HelpScreen,
  DriveLogLandscape,
  TabletDashboard,
} from "./screens-sub";

// screen キー (URL param 用) → component
const SCREENS: Record<string, React.ComponentType> = {
  "charge-start": ChargingStartScreen,
  "charge-live": ChargingLiveScreen,
  "charge-done": ChargingCompleteScreen,
  history: HistoryScreen,
  stats: StatsScreen,
  vehicle: VehicleScreen,
  settings: SettingsScreen,
  maintenance: MaintenanceScreen,
  inspection: InspectionScreen,
  meter: MeterCaptureScreen,
  onboarding: OnboardingScreen,
  help: HelpScreen,
  "drive-landscape": DriveLogLandscape,
  "tablet-dashboard": TabletDashboard,
};

// BottomNav の tab id → screen キー
const NAV_TO_SCREEN: Record<string, string> = {
  charge: "charge-start",
  history: "history",
  stats: "stats",
  car: "vehicle",
  settings: "settings",
};

const DEFAULT_SCREEN = "charge-start";

function getInitialScreen(): string {
  if (typeof window === "undefined") return DEFAULT_SCREEN;
  const fromUrl = new URLSearchParams(window.location.search).get("screen");
  return (fromUrl && SCREENS[fromUrl]) ? fromUrl : DEFAULT_SCREEN;
}

export default function RedesignApp() {
  // ⚡ PoC 死守: BG GPS hook を root で呼ぶ。これがないと 5/6 評価データが切れる
  const bgStats = useBackgroundGeolocation();

  const [active, setActive] = useState<string>(getInitialScreen);
  const activeSession = useChargingStore((s) => s.activeSession);

  // BottomNav の tab id を受けて画面切替。
  // 充電タブは activeSession 有無で start/live を自動選択 (state machine)
  const navigate = useMemo(
    () => (navKey: string) => {
      let next = NAV_TO_SCREEN[navKey] || navKey;
      if (navKey === "charge") {
        next = activeSession ? "charge-live" : "charge-start";
      }
      if (SCREENS[next]) setActive(next);
    },
    [activeSession],
  );

  // ?screen=<name> で直接アクセスもサポート (戻る/進むで反応)
  useEffect(() => {
    const onPop = () => setActive(getInitialScreen());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const Screen = SCREENS[active] || ChargingStartScreen;

  return (
    <NavContext.Provider value={navigate}>
      <Screen />
      <BgPocBadge stats={bgStats} />
      <VersionTag />
    </NavContext.Provider>
  );
}

// standards.md §4 — 全 PJ 共通 version 表示。BottomNav の真上に小さく常駐。
// SoT: shared/constants/defaults.ts APP_VERSION + vite define __GIT_SHA__ (build 起源判別用)
// 上部 BG badge と分離 (役割が違う: BG=実時 telemetry, version=build 起源)
function VersionTag() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
        right: 12,
        zIndex: 50,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 9,
        letterSpacing: "0.12em",
        color: "rgba(120, 200, 230, 0.32)",
        pointerEvents: "none",
      }}
    >
      v{APP_VERSION} · {__GIT_SHA__}
    </div>
  );
}

// PoC 評価期間 (5/6) 中だけ右上に常駐する小さな BG 状態 chip。
// stats.ready=false (web / 未起動) なら描画しない → 本番 UI を汚さない
function BgPocBadge({ stats }: { stats: ReturnType<typeof useBackgroundGeolocation> }) {
  if (!stats.ready) return null;
  const color = stats.isMoving ? "#00F0FF" : "#6B7A8E";
  const label = stats.lastActivity ? `${stats.sampleCount}/${stats.lastActivity}` : `${stats.sampleCount}`;
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(max(env(safe-area-inset-top, 0px), var(--android-inset-top, 28px)) + 6px)",
        right: 8,
        zIndex: 60,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 9,
        letterSpacing: "0.18em",
        color,
        textTransform: "uppercase",
        pointerEvents: "none",
        textShadow: "0 0 4px rgba(0,0,0,0.6)",
      }}
    >
      BG:{label}
    </div>
  );
}
