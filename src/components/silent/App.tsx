// @ts-nocheck
// Silent Automotive Console — production entry (Pro Bridge L4 採択 v5.0.0)
//
// 旧 NEXUS v2 (cyan sci-fi) は ?ui=v2 で fallback、旧 v1 は ?ui=v1 で fallback。
// 内部 nav 状態で Today / Charge / History / Stats / Vehicle / Settings を切替。
// useBackgroundGeolocation は root で 1 回呼ぶ → BG GPS PoC 死守。

import React, { useState, useMemo, useEffect } from "react";
import { useBackgroundGeolocation } from "../../hooks/useBackgroundGeolocation";
import { useChargingStore } from "../../store/useChargingStore";
import { APP_VERSION } from "../../constants/defaults";
import { NavContext } from "./primitives";
import {
  TodayScreen,
  ChargeStartScreen,
  ChargeLiveScreen,
  ChargeDoneScreen,
  HistoryScreen,
} from "./screens-main";
import {
  StatsScreen,
  VehicleScreen,
  SettingsScreen,
} from "./screens-sub";

const SCREENS: Record<string, React.ComponentType> = {
  today: TodayScreen,
  "charge-start": ChargeStartScreen,
  "charge-live": ChargeLiveScreen,
  "charge-done": ChargeDoneScreen,
  history: HistoryScreen,
  stats: StatsScreen,
  vehicle: VehicleScreen,
  settings: SettingsScreen,
};

// BottomNav の tab id → screen キー
const NAV_TO_SCREEN: Record<string, string> = {
  today: "today",
  charge: "charge-start",
  history: "history",
  stats: "stats",
  car: "vehicle",
  settings: "settings",
};

const DEFAULT_SCREEN = "today";

function getInitialScreen(): string {
  if (typeof window === "undefined") return DEFAULT_SCREEN;
  const fromUrl = new URLSearchParams(window.location.search).get("screen");
  return fromUrl && SCREENS[fromUrl] ? fromUrl : DEFAULT_SCREEN;
}

export default function SilentApp() {
  // PoC 死守: BG GPS hook を root で呼ぶ
  const bgStats = useBackgroundGeolocation();
  // active charging session detection (Charge state machine 切替)
  const activeSession = useChargingStore((s) => s.activeSession);

  const [active, setActive] = useState<string>(getInitialScreen);

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

  useEffect(() => {
    const onPop = () => setActive(getInitialScreen());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Silent Console 全体に「silent-app」class を付ける (tokens.css の reset / fonts 反映)
  useEffect(() => {
    document.body.classList.add("silent-app");
    return () => { document.body.classList.remove("silent-app"); };
  }, []);

  // BottomNav から navigate を pass する手段が screens 側に無いので、
  // window.__silentNavigate で expose (canvas pattern 互換)。
  // primitives.tsx の BottomNav が onNav={...} prop を取れる場合は別途 wiring。
  useEffect(() => {
    (window as any).__silentNavigate = navigate;
    return () => { delete (window as any).__silentNavigate; };
  }, [navigate]);

  const Screen = SCREENS[active] || TodayScreen;

  return (
    <NavContext.Provider value={navigate}>
      <div className="silent-app" style={{ minHeight: "100vh", background: "#000", color: "#F4F2EE" }}>
        <Screen />
        <BgStatusChip stats={bgStats} />
      </div>
    </NavContext.Provider>
  );
}

// 上部 status chip — Today 画面 上部に micro 表示。BG state 確認用。
// brief 通り cyan ではなく amber くすみで、不可視に近い density。
function BgStatusChip({ stats }: { stats: ReturnType<typeof useBackgroundGeolocation> }) {
  if (!stats.ready) return null;
  const tone = stats.isMoving ? "rgba(232, 160, 74, 0.55)" : "rgba(168, 163, 155, 0.32)";
  const label = stats.lastActivity
    ? `${stats.sampleCount}/${stats.lastActivity}`
    : `${stats.sampleCount}`;
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(max(env(safe-area-inset-top, 0px), var(--android-inset-top, 28px)) + 4px)",
        right: 12,
        zIndex: 60,
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        letterSpacing: "0.12em",
        color: tone,
        textTransform: "uppercase",
        pointerEvents: "none",
      }}
    >
      bg · {label}
    </div>
  );
}
