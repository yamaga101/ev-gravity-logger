// @ts-nocheck
// NEXUS v2 (Direction A) — production entry
// 旧 App は ?ui=v1 で fallback。BottomNav タップで内部 state 切替。
// useBackgroundGeolocation を root で 1 回呼ぶ → BG GPS PoC を死守 (5/6 評価まで)。

import React, { useState, useEffect, useMemo } from "react";
import { useBackgroundGeolocation } from "../../hooks/useBackgroundGeolocation";
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
  useBackgroundGeolocation();

  const [active, setActive] = useState<string>(getInitialScreen);

  // BottomNav の tab id を受けて画面切替
  const navigate = useMemo(
    () => (navKey: string) => {
      const next = NAV_TO_SCREEN[navKey] || navKey;
      if (SCREENS[next]) setActive(next);
    },
    [],
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
    </NavContext.Provider>
  );
}
