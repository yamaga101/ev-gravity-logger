// @ts-nocheck
// Silent Automotive Console — main screens (Today, Charge, History)

import React from "react";
const { useState, useMemo, useEffect, useContext } = React;
import {
  NavContext,
  S25Frame, AppShell, HeroNumber, StatusLabel, AccentChip,
  GhostButton, PrimaryButton, Card, MicroChart, BottomNav, Divider, Row, NavIcons,
} from "./primitives";
import { useChargingStore } from "../../store/useChargingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useBackgroundGeolocation } from "../../hooks/useBackgroundGeolocation";

// 「いま充電すべきか?」の核を 1 秒で答える hero。real data を反映。
function fmtKm(km: number): string { return km.toFixed(0); }
function fmtPct(pct: number): string { return pct.toFixed(0); }

// ─────────────────────────────────────────────────────────────
// 1. TODAY — hero. 1-second judgement.
// ─────────────────────────────────────────────────────────────
function TodayScreen() {
  const navigate = useContext(NavContext);
  const history = useChargingStore((s) => s.history);
  const settings = useSettingsStore((s) => s.settings);
  const bg = useBackgroundGeolocation();

  // 最新 record から SOC を取る、なければ 80% 仮置き
  const lastRec = history[0];
  const currentSoc = lastRec?.endBattery ?? 80;
  const efficiency = settings.electricityRate ? 6.0 : 6.0; // km/kWh、後で settings から取得
  const batteryCap = settings.batteryCapacity || 62; // kWh
  const range = Math.round((currentSoc / 100) * batteryCap * efficiency);
  const sohPct = lastRec?.soh ?? 96; // SOH% from latest record
  const today = new Date();
  const dateStr = today.toLocaleDateString("ja-JP", { weekday: "short", day: "numeric", month: "short" });

  return (
    <AppShell nav navActive="today">
      <div style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Top: kicker + bg gps chip + settings gear */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <StatusLabel>{dateStr}</StatusLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 100,
              border: `1px solid ${bg.ready ? 'rgba(180,122,54,0.25)' : 'rgba(92,87,82,0.25)'}`,
              fontSize: 9, fontWeight: 500, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: bg.ready ? '#B47A36' : '#5C5752',
            }}>
              <span style={{ width: 4, height: 4, borderRadius: 2, background: bg.ready ? '#B47A36' : '#5C5752' }} />
              BG&nbsp;GPS · {bg.ready ? 'ON' : 'OFF'}
            </div>
            <div onClick={() => navigate && navigate('settings')}
              style={{ cursor: 'pointer', padding: 4, color: '#5C5752', display: 'flex' }}
              aria-label="設定">
              <NavIcons.settings size={18} color="#5C5752" />
            </div>
          </div>
        </div>

        {/* Generous top whitespace */}
        <div style={{ height: 64 }} />

        {/* SOC hero — real data から */}
        <div>
          <StatusLabel style={{ marginBottom: 16 }}>State of Charge</StatusLabel>
          <HeroNumber value={fmtPct(currentSoc)} unit="%" size={196} weight={200} />
        </div>

        <div style={{ height: 32 }} />

        {/* Estimated range + SOH */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>Range</StatusLabel>
            <div className="num" style={{ fontSize: 44, fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, color: '#F4F2EE' }}>
              {fmtKm(range)}<span style={{ fontSize: 18, color: '#5C5752', marginLeft: 4 }}>km</span>
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(255,250,240,0.08)' }} />
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>SOH</StatusLabel>
            <div className="num" style={{ fontSize: 44, fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, color: '#F4F2EE' }}>
              {fmtPct(sohPct)}<span style={{ fontSize: 18, color: '#5C5752', marginLeft: 4 }}>%</span>
            </div>
          </div>
        </div>

        <div style={{ height: 28 }} />

        {/* GPS sample count (BG GPS PoC indicator) */}
        {bg.ready && (
          <div style={{ fontSize: 11, color: '#5C5752', letterSpacing: '0.04em' }}>
            BG GPS · {bg.sampleCount} samples · last {bg.lastTs ? new Date(bg.lastTs).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "—"}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Last charge — real record から */}
        <Card style={{ padding: '16px 20px' }}>
          <StatusLabel style={{ marginBottom: 8 }}>Last Charge</StatusLabel>
          {lastRec ? (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#F4F2EE', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {new Date(lastRec.endTime || lastRec.startTime).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {lastRec.locationName || "—"}
              </div>
              <div className="num" style={{ fontSize: 13, color: '#E8A04A', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                ¥{(lastRec.cost || 0).toLocaleString()}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#5C5752' }}>まだ充電ログがありません</div>
          )}
        </Card>

        <div style={{ height: 16 }} />

        {/* Ghost actions — minimal trio */}
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostButton style={{ flex: 1 }} onClick={() => navigate && navigate('charge')}>充電</GhostButton>
          <GhostButton style={{ flex: 1 }} onClick={() => navigate && navigate('history')}>履歴</GhostButton>
          <GhostButton style={{ flex: 1 }} onClick={() => navigate && navigate('vehicle')}>車両</GhostButton>
        </div>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2a. CHARGE START — station + start SOC + target + price
// ─────────────────────────────────────────────────────────────
function ChargeStartScreen() {
  const navigate = useContext(NavContext);
  const startSession = useChargingStore((s) => s.startSession);
  const settings = useSettingsStore((s) => s.settings);
  const bg = useBackgroundGeolocation();

  // 編集可能な開始 SOC / target SOC (タップで +/- できる粒度)
  const [startSoc, setStartSoc] = useState<number>(40);
  const [targetSoc, setTargetSoc] = useState<number>(80);

  // 推定 kWh / cost
  const batteryCap = settings.batteryCapacity || 62;
  const electricityRate = settings.electricityRate || 30;
  const chargedKwh = Math.max(0, ((targetSoc - startSoc) / 100) * batteryCap);
  const estCost = Math.round(chargedKwh * electricityRate);
  const estMin = Math.round((chargedKwh / 50) * 60); // 50 kW DC fast 換算

  const handleStart = () => {
    const now = new Date();
    const session = {
      id: `sess-${now.getTime()}`,
      startTime: now.toISOString(),
      odometer: 0, // 後で実装
      startBattery: startSoc,
      startRange: Math.round((startSoc / 100) * batteryCap * 6),
      efficiency: 6.0,
      startedAt: now.getTime(),
      locationName: bg.lastLat && bg.lastLng
        ? `GPS: ${bg.lastLat.toFixed(4)}, ${bg.lastLng.toFixed(4)}`
        : "Current Location",
      voltage: 0,
      amperage: 0,
      kw: 50,
      startLat: bg.lastLat ?? undefined,
      startLng: bg.lastLng ?? undefined,
      startAccuracyM: bg.lastAccuracyM ?? undefined,
    };
    startSession(session);
    navigate && navigate('charge-live');
  };

  return (
    <AppShell nav navActive="charge">
      <div style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusLabel>Charge · Start</StatusLabel>
          <span style={{ fontSize: 11, color: '#5C5752' }}>Step 1 / 3</span>
        </div>

        <div style={{ height: 40 }} />

        {/* Location (GPS から推定) */}
        <StatusLabel style={{ marginBottom: 12 }}>Location</StatusLabel>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', borderBottom: '1px solid rgba(255,250,240,0.06)',
        }}>
          <div>
            <div style={{ fontSize: 16, color: '#F4F2EE', letterSpacing: '-0.005em' }}>
              {bg.ready && bg.lastLat ? `GPS · ${bg.lastLat.toFixed(4)}, ${bg.lastLng.toFixed(4)}` : "Current Location"}
            </div>
            <div style={{ fontSize: 11, color: '#5C5752', marginTop: 4 }}>
              {bg.ready ? `accuracy ±${Math.round(bg.lastAccuracyM ?? 0)}m · sample ${bg.sampleCount}` : 'GPS 待機中'}
            </div>
          </div>
        </div>

        <div style={{ height: 36 }} />

        {/* SOC start → target、tap で +/- 5% */}
        <StatusLabel style={{ marginBottom: 18 }}>State of Charge</StatusLabel>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div onClick={() => setStartSoc(((startSoc + 5) % 105))} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: 10, color: '#5C5752', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Start (tap to ±)</div>
            <HeroNumber value={String(startSoc)} unit="%" size={88} unitSize={22} />
          </div>
          <div style={{
            flex: 1, height: 1, background: 'rgba(255,250,240,0.08)',
            position: 'relative', alignSelf: 'center', marginTop: 16,
          }}>
            <div style={{ position: 'absolute', right: -6, top: -3, width: 7, height: 7, background: '#E8A04A', borderRadius: 0, transform: 'rotate(45deg)' }} />
          </div>
          <div onClick={() => setTargetSoc(((targetSoc + 5) > 100 ? 50 : targetSoc + 5))} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: 10, color: '#E8A04A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Target (tap to ±)</div>
            <HeroNumber value={String(targetSoc)} unit="%" size={88} unitSize={22} color="#E8A04A" />
          </div>
        </div>

        <div style={{ height: 36 }} />

        {/* Estimated price (real calc) */}
        <Card style={{ padding: '20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <StatusLabel style={{ marginBottom: 6 }}>Estimated</StatusLabel>
              <div style={{ fontSize: 11, color: '#A8A39B' }}>{chargedKwh.toFixed(1)} kWh · ~ {estMin} min</div>
            </div>
            <div className="num" style={{ fontSize: 28, fontWeight: 200, color: '#F4F2EE', letterSpacing: '-0.02em' }}>¥{estCost.toLocaleString()}</div>
          </div>
        </Card>

        <div style={{ flex: 1 }} />

        <PrimaryButton onClick={handleStart}>Start Charge</PrimaryButton>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2b. CHARGE LIVE — running session
// ─────────────────────────────────────────────────────────────
function ChargeLiveScreen() {
  const navigate = useContext(NavContext);
  const session = useChargingStore((s) => s.activeSession);
  const addRecord = useChargingStore((s) => s.addRecord);
  const clearSession = useChargingStore((s) => s.clearSession);
  const settings = useSettingsStore((s) => s.settings);
  const bg = useBackgroundGeolocation();

  // 経過時間を tick (1 秒間隔)
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // session が無い場合は start 画面へ自動 redirect
  useEffect(() => {
    if (!session && navigate) {
      const timer = setTimeout(() => navigate('charge-start'), 100);
      return () => clearTimeout(timer);
    }
  }, [session, navigate]);

  // tap で +1% 進める用の "現在 SOC" simulator
  const [currentSoc, setCurrentSoc] = useState<number>(session?.startBattery ?? 40);
  useEffect(() => { setCurrentSoc(session?.startBattery ?? 40); }, [session?.id]);

  if (!session) {
    return (
      <AppShell nav navActive="charge">
        <div style={{ padding: 24, color: '#5C5752', fontSize: 12 }}>
          充電セッションがありません。Start 画面に戻ります…
        </div>
      </AppShell>
    );
  }

  const targetSoc = 80; // session に target を保存してないので暫定
  const elapsedSec = Math.floor((now - session.startedAt) / 1000);
  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedRest = elapsedSec % 60;
  const batteryCap = settings.batteryCapacity || 62;
  const electricityRate = settings.electricityRate || 30;
  const chargedKwh = Math.max(0, ((currentSoc - session.startBattery) / 100) * batteryCap);
  const costSoFar = Math.round(chargedKwh * electricityRate);
  const power = (typeof session.kw === "number" ? session.kw : 50) || 50;
  const remainingPct = Math.max(0, targetSoc - currentSoc);
  const remainingMin = Math.round((remainingPct / 100) * batteryCap / power * 60);

  const handleStop = () => {
    const endNow = new Date();
    const startMs = session.startedAt;
    const duration = (endNow.getTime() - startMs) / 1000;
    const endBattery = currentSoc;
    const finalKwh = Math.max(0, ((endBattery - session.startBattery) / 100) * batteryCap);
    const cost = Math.round(finalKwh * electricityRate);
    const chargeSpeed = duration > 0 ? finalKwh / (duration / 3600) : 0;
    const record = {
      ...session,
      endTime: endNow.toISOString(),
      endBattery,
      endRange: Math.round((endBattery / 100) * batteryCap * 6),
      chargedKwh: finalKwh,
      cost,
      duration,
      chargeSpeed,
      endLat: bg.lastLat ?? undefined,
      endLng: bg.lastLng ?? undefined,
      endAccuracyM: bg.lastAccuracyM ?? undefined,
    };
    addRecord(record);
    clearSession();
    navigate && navigate('charge-done');
  };

  return (
    <AppShell nav navActive="charge">
      <div style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AccentChip>Charging</AccentChip>
          <span className="num" style={{ fontSize: 11, color: '#5C5752', fontVariantNumeric: 'tabular-nums' }}>
            {new Date(session.startTime).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} · {session.locationName}
          </span>
        </div>

        <div style={{ height: 56 }} />

        {/* Live SOC — tap で +1% (debug) */}
        <StatusLabel style={{ marginBottom: 14 }}>Now (tap to +1)</StatusLabel>
        <div onClick={() => setCurrentSoc((v) => Math.min(100, v + 1))} style={{ cursor: 'pointer' }}>
          <HeroNumber value={String(currentSoc)} unit="%" size={180} weight={200} />
        </div>

        <div style={{ height: 24 }} />

        {/* Progress */}
        <div style={{ height: 2, background: 'rgba(255,250,240,0.06)', borderRadius: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${currentSoc}%`, background: '#E8A04A' }} />
          <div style={{ position: 'absolute', left: `${targetSoc}%`, top: -3, width: 8, height: 8, borderRadius: 4,
            border: '1px solid rgba(232,160,74,0.5)', background: '#000', transform: 'translateX(-50%)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 10, color: '#5C5752', letterSpacing: '0.16em' }}>{session.startBattery}%</span>
          <span style={{ fontSize: 10, color: '#E8A04A', letterSpacing: '0.16em' }}>TARGET {targetSoc}%</span>
        </div>

        <div style={{ height: 40 }} />

        {/* 3 cluster numerics */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>Elapsed</StatusLabel>
            <div className="num" style={{ fontSize: 32, fontWeight: 200, color: '#F4F2EE', letterSpacing: '-0.02em' }}>
              {elapsedMin}<span style={{ fontSize: 14, color: '#5C5752', marginLeft: 2 }}>m</span> {String(elapsedRest).padStart(2, '0')}<span style={{ fontSize: 14, color: '#5C5752', marginLeft: 2 }}>s</span>
            </div>
          </div>
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>Remaining</StatusLabel>
            <div className="num" style={{ fontSize: 32, fontWeight: 200, color: '#F4F2EE', letterSpacing: '-0.02em' }}>
              ~{remainingMin}<span style={{ fontSize: 14, color: '#5C5752', marginLeft: 2 }}>m</span>
            </div>
          </div>
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>Power</StatusLabel>
            <div className="num" style={{ fontSize: 32, fontWeight: 200, color: '#E8A04A', letterSpacing: '-0.02em' }}>
              {power}<span style={{ fontSize: 14, color: '#5C5752', marginLeft: 2 }}>kW</span>
            </div>
          </div>
        </div>

        <div style={{ height: 32 }} />

        <Card style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 11, color: '#A8A39B' }}>Est. cost so far</span>
            <span className="num" style={{ fontSize: 18, fontWeight: 300, color: '#F4F2EE' }}>¥{costSoFar.toLocaleString()}</span>
          </div>
        </Card>

        <div style={{ flex: 1 }} />

        <GhostButton style={{ height: 48, width: '100%' }} onClick={handleStop}>Stop Charge</GhostButton>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2c. CHARGE DONE — completion summary
// ─────────────────────────────────────────────────────────────
function ChargeDoneScreen() {
  const navigate = useContext(NavContext);
  const lastRec = useChargingStore((s) => s.history[0]);

  if (!lastRec) {
    return (
      <AppShell nav navActive="charge">
        <div style={{ padding: 24, color: '#5C5752', fontSize: 12 }}>
          完了した充電セッションがありません
        </div>
      </AppShell>
    );
  }

  const durMin = Math.floor((lastRec.duration ?? 0) / 60);
  const durSec = Math.floor((lastRec.duration ?? 0) % 60);
  const efficiency = lastRec.efficiency || 6.0;
  const avgPower = lastRec.chargeSpeed || 0;

  return (
    <AppShell nav navActive="charge">
      <div style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>

        <StatusLabel>Charge · Complete</StatusLabel>

        <div style={{ height: 56 }} />

        {/* Delta */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className="num" style={{ fontSize: 28, color: '#5C5752', fontWeight: 200 }}>{lastRec.startBattery}%</span>
          <span style={{ fontSize: 16, color: '#5C5752' }}>→</span>
          <HeroNumber value={String(lastRec.endBattery)} unit="%" size={120} weight={200} color="#F4F2EE" unitSize={28} />
        </div>

        <div style={{ height: 8 }} />
        <div className="num" style={{ fontSize: 13, color: '#E8A04A', letterSpacing: '0.04em' }}>
          + {lastRec.endBattery - lastRec.startBattery} % · {(lastRec.chargedKwh || 0).toFixed(1)} kWh
        </div>

        <div style={{ height: 48 }} />

        {/* Stats */}
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid rgba(255,250,240,0.04)' }}>
          <span style={{ fontSize: 13, color: '#A8A39B' }}>Duration</span>
          <span className="num" style={{ fontSize: 13, color: '#F4F2EE' }}>{durMin}m {String(durSec).padStart(2, '0')}s</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid rgba(255,250,240,0.04)' }}>
          <span style={{ fontSize: 13, color: '#A8A39B' }}>Avg. Power</span>
          <span className="num" style={{ fontSize: 13, color: '#F4F2EE' }}>{avgPower.toFixed(1)} kW</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid rgba(255,250,240,0.04)' }}>
          <span style={{ fontSize: 13, color: '#A8A39B' }}>Efficiency</span>
          <span className="num" style={{ fontSize: 13, color: '#F4F2EE' }}>{efficiency.toFixed(1)} km/kWh</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0' }}>
          <span style={{ fontSize: 13, color: '#A8A39B' }}>Cost</span>
          <span className="num" style={{ fontSize: 13, color: '#E8A04A', fontWeight: 500 }}>¥{(lastRec.cost || 0).toLocaleString()}</span>
        </div>
        {(lastRec.startLat || lastRec.endLat) && (
          <div style={{ padding: '20px 0', fontSize: 11, color: '#5C5752', letterSpacing: '0.04em' }}>
            GPS: {lastRec.startLat?.toFixed(4) ?? "—"}, {lastRec.startLng?.toFixed(4) ?? "—"}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <GhostButton style={{ flex: 1 }} onClick={() => navigate && navigate('history')}>履歴で見る</GhostButton>
          <PrimaryButton style={{ flex: 1 }} onClick={() => navigate && navigate('today')}>Done</PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. HISTORY — real charging records timeline
// ─────────────────────────────────────────────────────────────
function HistoryScreen() {
  const history = useChargingStore((s) => s.history);

  // 月別グルーピング
  const grouped = useMemo(() => {
    const map = new Map<string, { month: string; year: string; items: any[]; total: number }>();
    for (const rec of history) {
      const ts = rec.endTime || rec.startTime || rec.timestamp;
      if (!ts) continue;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString("en-US", { month: "long" });
      const year = String(d.getFullYear());
      const existing = map.get(key) || { month: monthName, year, items: [], total: 0 };
      existing.items.push({
        d: String(d.getDate()).padStart(2, '0'),
        day: d.toLocaleString("en-US", { weekday: "short" }),
        loc: rec.locationName || "—",
        delta: `+${(rec.endBattery ?? 0) - (rec.startBattery ?? 0)}%`,
        cost: `¥${(rec.cost || 0).toLocaleString()}`,
      });
      existing.total += (rec.cost || 0);
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([_, v]) => v);
  }, [history]);

  const totalCost = history.reduce((acc, r) => acc + (r.cost || 0), 0);

  const Section = ({ month, year, total, count, items }) => (
    <div style={{ padding: '0 24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 0 16px' }}>
        <div>
          <div className="num" style={{ fontSize: 28, fontWeight: 200, color: '#F4F2EE', letterSpacing: '-0.02em', lineHeight: 1 }}>{month}</div>
          <div style={{ fontSize: 10, color: '#5C5752', letterSpacing: '0.20em', marginTop: 4 }}>{year}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="num" style={{ fontSize: 16, color: '#F4F2EE', fontWeight: 300 }}>{total}</div>
          <div style={{ fontSize: 10, color: '#5C5752', letterSpacing: '0.20em', marginTop: 4 }}>{count}</div>
        </div>
      </div>
      <Divider />
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '18px 0',
          borderBottom: i === items.length - 1 ? 'none' : '1px solid rgba(255,250,240,0.04)',
        }}>
          <div className="num" style={{ width: 36, flexShrink: 0 }}>
            <div style={{ fontSize: 18, color: '#F4F2EE', fontWeight: 300, lineHeight: 1 }}>{it.d}</div>
            <div style={{ fontSize: 9, color: '#5C5752', letterSpacing: '0.18em', marginTop: 3 }}>{it.day.toUpperCase()}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#F4F2EE', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{it.loc}</div>
          <div className="num" style={{ fontSize: 12, color: '#A8A39B', width: 48, textAlign: 'right' }}>{it.delta}</div>
          <div className="num" style={{ fontSize: 13, color: '#E8A04A', width: 60, textAlign: 'right' }}>{it.cost}</div>
        </div>
      ))}
    </div>
  );

  return (
    <AppShell nav navActive="history">
      <div style={{ padding: '24px 24px 0' }}>
        <StatusLabel>History</StatusLabel>
        <div style={{ height: 32 }} />
        <HeroNumber value={String(history.length)} unit="sessions" size={56} unitSize={13} weight={200} />
        <div style={{ height: 8 }} />
        <div className="num" style={{ fontSize: 12, color: '#5C5752' }}>{history.length === 0 ? "まだ充電ログがありません" : `total · ¥${totalCost.toLocaleString()}`}</div>
      </div>
      <div style={{ height: 24 }} />
      {grouped.map((g, i) => (
        <Section
          key={i}
          month={g.month}
          year={g.year}
          total={`¥${g.total.toLocaleString()}`}
          count={`${g.items.length} session${g.items.length > 1 ? 's' : ''}`}
          items={g.items}
        />
      ))}
    </AppShell>
  );
}

export { TodayScreen, ChargeStartScreen, ChargeLiveScreen, ChargeDoneScreen, HistoryScreen };
