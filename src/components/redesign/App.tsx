// @ts-nocheck
// NEXUS v2 (Direction A) pilot entry — feature-flagged via ?ui=v2&screen=<name>
// 既存 src/App.tsx は変更最小限、ここに切替ロジックを集約。

import React from "react";
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

export default function RedesignApp() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get("screen") || "menu";
  const Screen = SCREENS[screen];

  if (!Screen) {
    const groups: Array<{ title: string; keys: string[] }> = [
      { title: "Charging", keys: ["charge-start", "charge-live", "charge-done"] },
      { title: "Main", keys: ["history", "stats", "vehicle", "settings"] },
      {
        title: "Sub",
        keys: ["maintenance", "inspection", "meter", "onboarding", "help"],
      },
      { title: "Other form factors", keys: ["drive-landscape", "tablet-dashboard"] },
    ];
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-surface-void, #04060D)",
          color: "var(--color-text-bright, #EAF2FF)",
          padding: "32px 20px",
          fontFamily:
            'var(--font-sans, "Inter", system-ui, sans-serif)',
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: 28,
              fontFamily: 'var(--font-display, "Sora")',
              margin: 0,
              marginBottom: 8,
            }}
          >
            EV Manager · NEXUS v2 — Pilot
          </h1>
          <p style={{ color: "var(--color-text-muted, #C4D2E8)", marginBottom: 24 }}>
            URL に <code>?ui=v2&amp;screen=&lt;name&gt;</code> を付けて画面を選択。
          </p>
          {groups.map((g) => (
            <div key={g.title} style={{ marginBottom: 20 }}>
              <h2
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-text-dim, #8597B3)",
                  marginBottom: 8,
                }}
              >
                {g.title}
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 8,
                }}
              >
                {g.keys.map((key) => (
                  <a
                    key={key}
                    href={`?ui=v2&screen=${key}`}
                    style={{
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(140,170,220,0.15)",
                      borderRadius: 12,
                      color: "var(--color-signal-cyan, #22E6FF)",
                      textDecoration: "none",
                      fontFamily: 'var(--font-mono, "JetBrains Mono")',
                      fontSize: 13,
                    }}
                  >
                    {key}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <p style={{ marginTop: 32, fontSize: 12, color: "var(--color-text-dim, #8597B3)" }}>
            Production への適用は段階移行: 現在は Pilot として旧 UI と並存。元 UI に戻すには <code>?ui=v2</code> を外してリロード。
          </p>
        </div>
      </div>
    );
  }

  return <Screen />;
}
