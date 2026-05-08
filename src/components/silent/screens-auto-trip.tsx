// @ts-nocheck
// Silent Automotive Console — Auto Trip 確認 UI (P2 v5.1.0)
//
// 設計: docs/specs/p2-auto-trip-design.md §5 UI 配置
// History 画面の sub-tab "Drives" として表示される想定。
//
// 表示要素:
//   - pending trip 一覧 (時系列降順、distance/duration/開始時刻)
//   - tap で AutoTripConfirmModal: Confirm as drive / Edit / Ignore
// Confirm 時に DriveLogRecord 生成 + outbox sync + status='confirmed'
// Stitch mock 準拠: docs/assets/stitch-auto-trip-confirmation.png

import React from "react";
const { useState, useEffect, useMemo } = React;
import { useAutoTripStore } from "../../store/useAutoTripStore";
import { useDriveLogStore } from "../../store/useDriveLogStore";
import { useSyncStore } from "../../store/useSyncStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useToastStore } from "../../store/useToastStore";
import { Divider } from "./primitives";

function fmtKm(distanceM: number): string {
  return (distanceM / 1000).toFixed(1);
}

function fmtDuration(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m - h * 60}m`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) return (crypto as any).randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Confirm Modal ────────────────────────────────────────────

function AutoTripConfirmModal({ trip, onClose }) {
  const confirm = useAutoTripStore((s) => s.confirm);
  const ignore = useAutoTripStore((s) => s.ignore);
  const addDriveLog = useDriveLogStore((s) => s.addRecord);
  const syncSend = useSyncStore((s) => s.syncSend);
  const gasUrl = useSettingsStore((s) => s.settings.gasUrl);
  const showToast = useToastStore((s) => s.showToast);

  const [departure, setDeparture] = useState(
    `GPS: ${trip.startLat.toFixed(4)},${trip.startLng.toFixed(4)}`,
  );
  const [destination, setDestination] = useState(
    `GPS: ${trip.endLat.toFixed(4)},${trip.endLng.toFixed(4)}`,
  );
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);

  const distanceKm = trip.distanceM / 1000;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const id = uuid();
      const date = trip.startTs.slice(0, 10);
      const memo = `auto-detected ${fmtDuration(trip.durationS)}${
        trip.avgSpeedMps != null ? ` · avg ${(trip.avgSpeedMps * 3.6).toFixed(1)}km/h` : ""
      }`;
      const record = {
        id,
        date,
        departure,
        destination,
        distance: Math.round(distanceKm * 10) / 10,
        startOdometer: 0,
        endOdometer: 0,
        purpose,
        memo,
        createdAt: new Date().toISOString(),
      };
      addDriveLog(record);

      // GAS sync (outbox 経由、offline でも安全)
      if (gasUrl) {
        void syncSend(gasUrl, {
          type: "driveLog",
          id,
          date,
          departure,
          destination,
          distance: String(record.distance),
          startOdometer: "",
          endOdometer: "",
          efficiency: "",
          purpose,
          memo,
        });
      }

      await confirm(trip.id, id);
      showToast("移動ログとして記録しました", "success");
      onClose();
    } catch (e) {
      console.error("[autotrip] confirm failed", e);
      showToast("記録に失敗しました", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleIgnore = async () => {
    setBusy(true);
    try {
      await ignore(trip.id);
      showToast("非表示にしました", "success");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0A0908",
          border: "1px solid rgba(255,250,240,0.08)",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#F4F2EE",
        }}
      >
        <div style={{ fontSize: 10, color: "#E8A04A", letterSpacing: "0.20em", textTransform: "uppercase", marginBottom: 4 }}>
          Auto Trip · {fmtDate(trip.startTs)}
        </div>
        <div className="num" style={{ fontSize: 36, fontWeight: 200, lineHeight: 1, marginBottom: 4 }}>
          {fmtKm(trip.distanceM)}
          <span style={{ fontSize: 12, color: "#5C5752", marginLeft: 8 }}>km</span>
        </div>
        <div style={{ fontSize: 11, color: "#A8A39B" }}>
          {fmtTime(trip.startTs)} → {fmtTime(trip.endTs)} · {fmtDuration(trip.durationS)} ·{" "}
          {trip.avgSpeedMps != null ? `${(trip.avgSpeedMps * 3.6).toFixed(0)}km/h avg` : "—"}
        </div>

        <div style={{ height: 24 }} />
        <Divider />
        <div style={{ height: 16 }} />

        <Field label="departure" value={departure} onChange={setDeparture} />
        <Field label="destination" value={destination} onChange={setDestination} />
        <Field label="purpose (任意)" value={purpose} onChange={setPurpose} />

        <div style={{ height: 24 }} />

        <button
          onClick={handleConfirm}
          disabled={busy}
          style={{
            width: "100%",
            background: busy ? "#3A2F1F" : "#E8A04A",
            color: "#0A0908",
            border: "none",
            borderRadius: 12,
            padding: "14px 20px",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            cursor: busy ? "not-allowed" : "pointer",
            marginBottom: 8,
          }}
        >
          {busy ? "saving…" : "Confirm as drive"}
        </button>
        <button
          onClick={handleIgnore}
          disabled={busy}
          style={{
            width: "100%",
            background: "transparent",
            color: "#5C5752",
            border: "1px solid rgba(255,250,240,0.08)",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 12,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            cursor: busy ? "not-allowed" : "pointer",
            marginBottom: 8,
          }}
        >
          Ignore (歩行 / 助手席など)
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          style={{
            width: "100%",
            background: "transparent",
            color: "#5C5752",
            border: "none",
            padding: "8px",
            fontSize: 11,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: "#5C5752", letterSpacing: "0.20em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "rgba(255,250,240,0.03)",
          border: "1px solid rgba(255,250,240,0.06)",
          borderRadius: 8,
          padding: "10px 12px",
          color: "#F4F2EE",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
        }}
      />
    </div>
  );
}

// ─── Auto Trip List Section (HistoryScreen 内) ────────────────

export function AutoTripSection() {
  const trips = useAutoTripStore((s) => s.trips);
  const refresh = useAutoTripStore((s) => s.refresh);
  const recompute = useAutoTripStore((s) => s.recompute);
  const loading = useAutoTripStore((s) => s.loading);
  const showToast = useToastStore((s) => s.showToast);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // active trips を pending top に。confirmed/ignored は下に薄く
  const sorted = useMemo(() => {
    const order = { pending: 0, confirmed: 1, ignored: 2 };
    return [...trips].sort((a, b) => {
      const oa = order[a.status] ?? 9;
      const ob = order[b.status] ?? 9;
      if (oa !== ob) return oa - ob;
      return b.startTs.localeCompare(a.startTs);
    });
  }, [trips]);

  const pendingCount = trips.filter((t) => t.status === "pending").length;

  const handleRecompute = async () => {
    showToast("再計算中…", "info");
    const r = await recompute();
    if (r) {
      showToast(`${r.tripsCreated} trips from ${r.samplesProcessed} samples`, "success");
    } else {
      showToast("再計算 unavailable (web)", "error");
    }
  };

  return (
    <div style={{ padding: "0 24px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 12px" }}>
        <div style={{ fontSize: 10, color: "#5C5752", letterSpacing: "0.20em", textTransform: "uppercase" }}>
          Auto Drives · {pendingCount} pending
        </div>
        <button
          onClick={handleRecompute}
          disabled={loading}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,250,240,0.08)",
            borderRadius: 8,
            padding: "6px 10px",
            color: "#A8A39B",
            fontSize: 9,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "…" : "Recompute"}
        </button>
      </div>

      {sorted.length === 0 && (
        <div style={{ fontSize: 11, color: "#5C5752", padding: "32px 0", textAlign: "center" }}>
          まだ自動移動ログがありません。<br />
          BG GPS で 100m 以上 / 60 秒以上の移動を検知すると自動で行が増えます。
        </div>
      )}

      {sorted.map((t) => {
        const dim = t.status !== "pending";
        const statusColor =
          t.status === "confirmed" ? "#7A9E3F" : t.status === "ignored" ? "#5C5752" : "#E8A04A";
        const statusLabel =
          t.status === "confirmed" ? "logged" : t.status === "ignored" ? "ignored" : "pending";
        return (
          <div
            key={t.id}
            onClick={() => t.status === "pending" && setSelected(t)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 0",
              borderBottom: "1px solid rgba(255,250,240,0.04)",
              cursor: t.status === "pending" ? "pointer" : "default",
              opacity: dim ? 0.45 : 1,
            }}
          >
            <div style={{ width: 36, flexShrink: 0 }}>
              <div className="num" style={{ fontSize: 16, color: "#F4F2EE", fontWeight: 300, lineHeight: 1 }}>
                {fmtDate(t.startTs)}
              </div>
              <div style={{ fontSize: 9, color: "#5C5752", letterSpacing: "0.18em", marginTop: 3 }}>
                {fmtTime(t.startTs)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="num" style={{ fontSize: 18, color: "#F4F2EE", fontWeight: 300, lineHeight: 1 }}>
                {fmtKm(t.distanceM)}
                <span style={{ fontSize: 10, color: "#5C5752", marginLeft: 4 }}>km</span>
              </div>
              <div style={{ fontSize: 10, color: "#5C5752", marginTop: 4 }}>
                {fmtDuration(t.durationS)}
                {t.avgSpeedMps != null ? ` · ${(t.avgSpeedMps * 3.6).toFixed(0)}km/h` : ""}
              </div>
            </div>
            <div
              style={{
                fontSize: 9,
                color: statusColor,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                width: 64,
                textAlign: "right",
              }}
            >
              {statusLabel}
            </div>
          </div>
        );
      })}

      {selected && <AutoTripConfirmModal trip={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
