// @ts-nocheck
// NEXUS v2 main screens — canvas/ev-screens-main.jsx を TSX 化
// L3 wiring: Settings 画面の GAS URL 表示と「今すぐ同期」ボタンを実 store と接続。
// BG GPS toggle は **PoC 期間中は visual のみ未配線** (5/6 評価まで service を触らない)。

import React from 'react';
import { NexusBg, ReminderBanner, AppHeader, BottomNav, Panel, ProgressRing, Chip, PrimaryCTA, StatTile, MiniChart, BarChart, Field, FgServiceTag, SectionTitle, Toast, NavContext } from './primitives';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useSyncStore } from '../../store/useSyncStore';
import { useToastStore } from '../../store/useToastStore';
import { useChargingStore } from '../../store/useChargingStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { exportPocSamples, clearPocSamples } from '../../hooks/useBackgroundGeolocation';

/* ============================================================
   EV Manager — Screen modules (主要 5 タブ)
   ============================================================ */

/* ---------- 1. CHARGING — three states ---------- */

function ChargingStartScreen() {
  // L3 wire: 充電開始ボタンで activeSession を作成
  const startSession = useChargingStore((s) => s.startSession);
  const settings = useSettingsStore((s) => s.settings);
  const pushToast = useToastStore((s) => s.push);
  const navigate = React.useContext(NavContext);

  const handleStart = () => {
    const session = {
      id: `s-${Date.now()}`,
      startTime: new Date().toISOString(),
      odometer: 0,
      startBattery: 38,
      startRange: 0,
      efficiency: 6.0,
      startedAt: Date.now(),
      locationName: "クイック開始",
      voltage: 400,
      amperage: 125,
      kw: 50,
    };
    startSession(session);
    pushToast?.({ kind: "ok", title: "充電開始", body: session.locationName });
    navigate?.("charge-live");
  };

  return (
    <div className="ev-screen">
      <NexusBg />
      <ReminderBanner kind="warning" icon="⚠" title="充電セッション準備" meta={settings.gasUrl ? "GAS 同期: 設定済" : "GAS 未設定 — Settings へ"} />
      <AppHeader kicker="CHARGING / 充電開始" title="充電を記録" subtitle="ステーション選択後、開始前 SOC を入力" right={<Chip tone={settings.gasUrl ? "cyan" : "warning"}>{settings.gasUrl ? "GAS OK" : "未設定"}</Chip>} />

      <div className="ev-screen__body">
        <Panel className="p-5">
          <SectionTitle action="変更">充電器</SectionTitle>
          <div className="flex items-center gap-3 mt-2">
            <div className="ev-charger-glyph">DC</div>
            <div className="flex-1">
              <div className="text-[15px] text-[var(--color-text-bright)] font-medium">e-Mobility Power 90kW</div>
              <div className="text-[12px] text-[var(--color-text-muted)] font-mono">道の駅 川場田園プラザ · 2.3km</div>
            </div>
            <Chip tone="plasma" solid>空き 1/2</Chip>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="開始 SOC" value="38" unit="%" focused />
          <Field label="目標 SOC" value="80" unit="%" />
        </div>

        <Panel className="p-4 mt-3">
          <SectionTitle>料金プラン</SectionTitle>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <RatePlan name="ZESP3" rate="¥27.5/min" active />
            <RatePlan name="ビジター" rate="¥66/min" />
            <RatePlan name="その他" rate="入力" />
          </div>
        </Panel>

        <div className="mt-4" onClick={handleStart} role="button" style={{ cursor: "pointer" }}>
          <PrimaryCTA tone="plasma" glyph={<BoltGlyph />} sub="クイック開始 (詳細入力は Settings から)">充電開始</PrimaryCTA>
        </div>
      </div>

      <BottomNav active="charge" />
    </div>
  );
}

function RatePlan({ name, rate, active }) {
  return (
    <div className={`ev-rate-plan ${active ? "is-active" : ""}`}>
      <div className="text-[11px] text-[var(--color-text-muted)] tracking-wider uppercase">{name}</div>
      <div className="text-[13px] font-mono text-[var(--color-text-bright)] mt-0.5">{rate}</div>
    </div>
  );
}

const BoltGlyph = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor"/>
  </svg>
);

function ChargingLiveScreen() {
  // L3 wire: activeSession + リアルタイム経過時間 + 充電終了ボタン
  const activeSession = useChargingStore((s) => s.activeSession);
  const clearSession = useChargingStore((s) => s.clearSession);
  const addRecord = useChargingStore((s) => s.addRecord);
  const pushToast = useToastStore((s) => s.push);
  const navigate = React.useContext(NavContext);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!activeSession) {
    return (
      <div className="ev-screen">
        <NexusBg />
        <div className="ev-screen__body" style={{ padding: 40, textAlign: "center" }}>
          <div className="text-[14px] text-[var(--color-text-muted)]">アクティブな充電セッションがありません</div>
          <div className="mt-4" onClick={() => navigate?.("charge-start")} role="button" style={{ cursor: "pointer" }}>
            <PrimaryCTA tone="cyan">充電を開始する</PrimaryCTA>
          </div>
        </div>
      </div>
    );
  }

  const elapsedSec = Math.max(0, Math.floor((now - activeSession.startedAt) / 1000));
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");
  // ざっくり推定: kw を base に経過時間で kWh 推定 (実機では別の真値、ここは UX のみ)
  const kw = typeof activeSession.kw === "number" ? activeSession.kw : parseFloat(activeSession.kw as any) || 50;
  const estKwh = (kw * elapsedSec) / 3600;
  const estSocAdd = activeSession.efficiency > 0 ? Math.min(80 - activeSession.startBattery, estKwh / 0.6) : 0;
  const currentSoc = Math.min(100, activeSession.startBattery + estSocAdd);
  const isDC = kw >= 30;

  const handleEnd = () => {
    const record: any = {
      ...activeSession,
      endTime: new Date().toISOString(),
      endBattery: Math.round(currentSoc),
      endRange: 0,
      chargedKwh: Math.round(estKwh * 10) / 10,
      cost: Math.round(estKwh * 27.5),
      duration: elapsedSec,
      chargeSpeed: kw,
    };
    addRecord(record);
    clearSession();
    pushToast?.({ kind: "ok", title: "充電完了", body: `${record.chargedKwh} kWh / ¥${record.cost}` });
    navigate?.("charge-done");
  };

  return (
    <div className="ev-screen">
      <NexusBg />
      <div className="ev-screen__body ev-charging-live">
        <div className="text-center mt-2">
          <div className="text-[10px] tracking-[0.3em] text-[var(--color-charge-plasma)] font-mono uppercase">CHARGING IN PROGRESS</div>
          <div className="text-[12px] text-[var(--color-text-muted)] mt-1 font-mono">{activeSession.locationName} · {isDC ? "DC急速" : "AC普通"}</div>
        </div>

        <div className="flex justify-center mt-6">
          <ProgressRing
            value={currentSoc} size={240} stroke={12}
            color="var(--color-charge-plasma)"
            label={<><span className="text-[64px] font-display font-light leading-none">{Math.round(currentSoc)}</span><span className="text-[24px] font-display ml-1">%</span></>}
            sublabel={<span className="font-mono text-[12px] text-[var(--color-text-muted)]">+{Math.round(currentSoc - activeSession.startBattery)}% / {activeSession.startBattery} → {Math.round(currentSoc)}</span>}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-7">
          <LiveMetric label="経過" value={`${mm}:${ss}`} unit="" />
          <LiveMetric label="kWh" value={estKwh.toFixed(1)} unit="kWh" />
          <LiveMetric label="実効" value={kw.toFixed(1)} unit="kW" />
        </div>

        <Panel className="p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider">目標 80% に到達まで</span>
            <span className="font-mono text-[var(--color-charge-plasma)]">{currentSoc >= 80 ? "達成" : "進行中"}</span>
          </div>
          <div className="ev-progress-track mt-3">
            <div className="ev-progress-fill" style={{ width: `${currentSoc}%` }} />
            <div className="ev-progress-target" style={{ left: "80%" }}>
              <div className="ev-progress-target__line" />
              <div className="ev-progress-target__label">80</div>
            </div>
          </div>
          <div className="flex justify-between mt-1.5 font-mono text-[10px] text-[var(--color-text-dim)]">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <SecondaryCTA>一時停止</SecondaryCTA>
          <button className="ev-cta ev-cta--danger" onClick={handleEnd} type="button">
            <span className="ev-cta__label">充電終了</span>
            <span className="ev-cta__sub">¥{Math.round(estKwh * 27.5)} 累計</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveMetric({ label, value, unit }) {
  return (
    <div className="ev-live-metric">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className="font-mono text-[22px] text-[var(--color-text-bright)] mt-1 leading-none">{value}</div>
      {unit && <div className="text-[10px] text-[var(--color-text-dim)] font-mono mt-1">{unit}</div>}
    </div>
  );
}

function SecondaryCTA({ children }) {
  return <button className="ev-cta-secondary">{children}</button>;
}

function ChargingCompleteScreen() {
  // L3 wire: 直近 history[0] から完了サマリ表示
  const lastRecord = useChargingStore((s) => s.history[0]);
  const navigate = React.useContext(NavContext);

  if (!lastRecord) {
    return (
      <div className="ev-screen">
        <NexusBg />
        <div className="ev-screen__body" style={{ padding: 40, textAlign: "center" }}>
          <div className="text-[14px] text-[var(--color-text-muted)]">直近の充電記録がありません</div>
          <div className="mt-4" onClick={() => navigate?.("history")} role="button" style={{ cursor: "pointer" }}>
            <PrimaryCTA tone="cyan">履歴を見る</PrimaryCTA>
          </div>
        </div>
      </div>
    );
  }

  const kwh = lastRecord.chargedKwh ?? 0;
  const cost = lastRecord.cost ?? 0;
  const unitCost = kwh > 0 ? Math.round(cost / kwh) : 0;
  const startSoc = lastRecord.startBattery ?? 0;
  const endSoc = lastRecord.endBattery ?? 0;
  const durationSec = lastRecord.duration ?? 0;
  const mm = String(Math.floor(durationSec / 60)).padStart(2, "0");
  const ss = String(durationSec % 60).padStart(2, "0");

  return (
    <div className="ev-screen">
      <NexusBg />
      <Toast kind="ok" title="充電完了" body="履歴に保存しました" />
      <div className="ev-screen__body pt-12">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)] font-mono uppercase">SESSION COMPLETE</div>
          <div className="text-[68px] font-display font-light leading-none mt-2 text-[var(--color-charge-plasma)]" style={{textShadow: "0 0 24px rgba(77,255,155,0.4)"}}>{kwh.toFixed(1)}</div>
          <div className="text-[14px] text-[var(--color-text-muted)] font-mono">kWh 充電</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-7">
          <SummaryCell label="料金" value={`¥${cost.toLocaleString()}`} sub={`¥${unitCost}/kWh`} />
          <SummaryCell label="kWh 単価" value={`¥${unitCost}`} sub={`実効 ${(lastRecord.chargeSpeed ?? 0).toFixed(1)}kW`} tone="cyan" />
          <SummaryCell label="開始 → 終了" value={`${startSoc} → ${endSoc}%`} sub={`+${endSoc - startSoc}pp`} />
          <SummaryCell label="経過時間" value={`${mm}:${ss}`} sub={lastRecord.locationName || "—"} />
        </div>

        <Panel className="p-4 mt-4">
          <SectionTitle>場所</SectionTitle>
          <div className="ev-map-placeholder mt-2">
            <div className="ev-map-pin" />
            <div className="text-[11px] font-mono text-[var(--color-text-muted)]">{lastRecord.locationName || "—"}</div>
          </div>
          <button className="ev-link mt-3">★ お気に入りに追加</button>
        </Panel>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <SecondaryCTA>メモ追加</SecondaryCTA>
          <div onClick={() => navigate?.("history")} role="button" style={{ cursor: "pointer" }}>
            <PrimaryCTA tone="cyan">完了</PrimaryCTA>
          </div>
        </div>
      </div>
      <BottomNav active="charge" />
    </div>
  );
}

function SummaryCell({ label, value, sub, tone = "default" }) {
  return (
    <Panel className={`ev-summary-cell tone-${tone} p-3.5`}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className="font-mono text-[24px] text-[var(--color-text-bright)] mt-1 leading-none">{value}</div>
      {sub && <div className="text-[10px] text-[var(--color-text-dim)] font-mono mt-1.5">{sub}</div>}
    </Panel>
  );
}

/* ---------- 2. HISTORY — unified timeline ---------- */

function HistoryScreen() {
  // L3 wire: 実 charging history を表示 (mock fallback あり)
  const history = useChargingStore((s) => s.history);
  const fmt = (ts: string | undefined) => {
    if (!ts) return "—";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (sameDay) return `今日 ${time}`;
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `昨日 ${time}`;
    return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, "0")} ${time}`;
  };
  const records = history.slice(0, 30).map((r) => {
    const kw = typeof r.kw === "number" ? r.kw : parseFloat(r.kw as any) || 0;
    const isDC = kw >= 30;
    const kwh = (r.chargedKwh ?? 0).toFixed(1);
    const cost = (r.cost ?? 0).toLocaleString("ja-JP");
    return {
      type: "charge" as const,
      date: fmt(r.endTime || (r as any).timestamp),
      title: `${isDC ? "急速" : "普通"}充電 ${kwh}kWh`,
      meta: `${r.locationName || "—"} · ¥${cost}`,
      tag: isDC ? "DC" : "AC",
    };
  });
  // 履歴ゼロ時のオンボーディング表示は維持
  const items = records.length > 0 ? records : [
    { type: "charge", date: "—", title: "まだ履歴がありません", meta: "充電を記録すると一覧表示されます", tag: undefined },
  ];
  const TYPE_GLYPH = { charge: "⚡", maint: "🔧", inspect: "🛡" };
  const TYPE_TONE  = { charge: "plasma", maint: "violet", inspect: "cyan" };
  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="HISTORY / 履歴" title="タイムライン" subtitle="充電・メンテ・点検の統合表示" />
      <div className="px-4 mb-3 flex gap-2 overflow-x-auto">
        <FilterChip active>すべて</FilterChip>
        <FilterChip>充電</FilterChip>
        <FilterChip>メンテ</FilterChip>
        <FilterChip>点検</FilterChip>
        <FilterChip>1ヶ月</FilterChip>
      </div>
      <div className="ev-screen__body pt-0">
        <div className="ev-timeline">
          {items.map((it, i) => (
            <div key={i} className={`ev-timeline__item tone-${TYPE_TONE[it.type]}`}>
              <div className="ev-timeline__rail">
                <div className="ev-timeline__node">{TYPE_GLYPH[it.type]}</div>
              </div>
              <Panel className="p-3.5 flex-1">
                <div className="flex items-baseline justify-between">
                  <div className="text-[11px] font-mono text-[var(--color-text-muted)]">{it.date}</div>
                  {it.tag && <Chip tone={it.tag === "DC" ? "plasma" : "cyan"}>{it.tag}</Chip>}
                </div>
                <div className="text-[15px] text-[var(--color-text-bright)] mt-1 font-medium">{it.title}</div>
                <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{it.meta}</div>
              </Panel>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="history" />
    </div>
  );
}

function FilterChip({ children, active }) {
  return <button className={`ev-filter-chip ${active ? "is-active" : ""}`}>{children}</button>;
}

/* ---------- 3. STATS — dashboard ---------- */

function StatsScreen() {
  // L3 wire: 主要 KPI を実 history 集計から。グラフは mock 維持 (集計 logic 移植は次)
  const history = useChargingStore((s) => s.history);
  const totalKwh = history.reduce((s, r) => s + (r.chargedKwh ?? 0), 0);
  const totalCost = history.reduce((s, r) => s + (r.cost ?? 0), 0);
  const sessions = history.length;
  const avgEfficiency = (() => {
    const xs = history.map((r) => r.efficiency).filter((v) => typeof v === "number" && v > 0);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  })();
  const lastSoh = history.find((r) => typeof r.soh === "number")?.soh ?? null;
  const fmt = (n: number, d = 0) => n.toLocaleString("ja-JP", { minimumFractionDigits: d, maximumFractionDigits: d });
  // 月次コスト集計 (直近 12 ヶ月)
  const now = new Date();
  const cost = Array.from({ length: 12 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return history.reduce((s, r) => {
      const t = new Date(r.endTime || (r as any).timestamp);
      if (isNaN(t.getTime())) return s;
      return t.getFullYear() === m.getFullYear() && t.getMonth() === m.getMonth() ? s + (r.cost ?? 0) : s;
    }, 0);
  });
  const months = Array.from({ length: 12 }, (_, i) => String(((now.getMonth() - 11 + i) % 12 + 12) % 12 + 1));
  const soh = [100, 99.6, 99.1, 98.7, 98.4, 98.0, 97.7, 97.4, 97.1, 96.9, 96.7, 96.5];
  const totalCostStr = fmt(cost.reduce((a, b) => a + b, 0));

  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="STATS / 統計" title="ダッシュボード" subtitle={`${sessions} 件の充電履歴`} right={<Chip tone="cyan">{sessions > 0 ? "実データ" : "mock"}</Chip>} />

      <div className="ev-screen__body pt-1">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="累計 kWh" value={fmt(totalKwh, 1)} unit="kWh" delta={`${sessions} 回`} tone="cyan" />
          <StatTile label="平均電費" value={avgEfficiency != null ? avgEfficiency.toFixed(1) : "—"} unit="km/kWh" tone="plasma" />
          <StatTile label="累計コスト" value={fmt(totalCost)} unit="¥" tone="warning" />
          <StatTile label="SOH" value={lastSoh != null ? lastSoh.toFixed(1) : "—"} unit="%" tone="violet" />
        </div>

        <Panel className="p-4 mt-3">
          <div className="flex items-baseline justify-between">
            <SectionTitle>月次コスト推移</SectionTitle>
            <span className="font-mono text-[11px] text-[var(--color-text-muted)]">¥{totalCostStr} / 12mo</span>
          </div>
          <BarChart data={cost} labels={months} h={130} color="var(--color-signal-cyan)" />
        </Panel>

        <Panel className="p-4 mt-3">
          <div className="flex items-baseline justify-between">
            <SectionTitle>SOH 推移</SectionTitle>
            <span className="font-mono text-[11px] text-[var(--color-state-warning)]">−3.5pp / 12mo</span>
          </div>
          <MiniChart data={soh} h={120} color="var(--color-signal-violet)" />
          <div className="flex justify-between mt-1 font-mono text-[10px] text-[var(--color-text-dim)]">
            <span>2025-06</span><span>2026-05</span>
          </div>
        </Panel>

        <Panel className="p-4 mt-3">
          <SectionTitle action="全件">★ お気に入り充電スポット</SectionTitle>
          <div className="mt-2 space-y-2">
            <FavRow rank={1} name="自宅 (200V)" count={47} avg="¥27.9" />
            <FavRow rank={2} name="道の駅 川場田園プラザ" count={12} avg="¥27.5" />
            <FavRow rank={3} name="イオンモール高崎" count={8} avg="¥27.5" />
          </div>
        </Panel>
      </div>
      <BottomNav active="stats" />
    </div>
  );
}

function FavRow({ rank, name, count, avg }) {
  return (
    <div className="ev-fav-row">
      <div className="ev-fav-row__rank">{rank}</div>
      <div className="flex-1">
        <div className="text-[14px] text-[var(--color-text-bright)]">{name}</div>
        <div className="text-[11px] text-[var(--color-text-muted)] font-mono">{count} 回 · 平均 {avg}/min</div>
      </div>
    </div>
  );
}

/* ---------- 4. VEHICLE ---------- */

function VehicleScreen() {
  // L3 wire: 実 vehicle store + charging history から表示
  const registration = useVehicleStore((s) => s.registration);
  const insuranceRecords = useVehicleStore((s) => s.insuranceRecords);
  const taxRecords = useVehicleStore((s) => s.taxRecords);
  const history = useChargingStore((s) => s.history);

  const title = registration?.model || "車両未登録";
  const subtitle = registration
    ? [registration.year ? `${registration.year}年式` : null, registration.purchaseDate ? `購入 ${registration.purchaseDate.slice(0, 7)}` : null]
        .filter(Boolean).join(" · ")
    : "Settings から登録";
  const lastOdometer = history[0]?.odometer ?? null;
  const lastSoh = history.find((r) => typeof r.soh === "number")?.soh ?? null;

  // 次回車検: registration.expiryDate (ISO 文字列) からの残日数
  const expiryDate = registration?.expiryDate || null;
  const daysToExpiry = expiryDate ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)) : null;
  const expiryProgress = daysToExpiry != null ? Math.max(0, Math.min(100, 100 - (daysToExpiry / 365) * 100)) : 0;
  const expiryTone = daysToExpiry != null && daysToExpiry < 60 ? "warning" : "default";

  // 加入中保険 (endDate 未到達 + 最新)
  const now = Date.now();
  const activeInsurance = insuranceRecords
    .filter((r) => r.endDate && new Date(r.endDate).getTime() > now)
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""))[0];

  // 税金 (最新 2 件)
  const taxByType = (type: string) => taxRecords.filter((t) => t.taxType === type)[0];
  const automobileTax = taxByType("automobile");
  const weightTax = taxByType("weight");

  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="VEHICLE / 車両" title={title} subtitle={subtitle || "—"} />

      <div className="ev-screen__body pt-1">
        {/* Hero card */}
        <Panel className="p-5 ev-vehicle-hero" glow>
          <div className="ev-vehicle-illust">
            <div className="ev-vehicle-illust__inner" aria-label="vehicle photo placeholder">
              <span className="font-mono text-[10px] text-[var(--color-text-dim)]">{registration?.plateNumber || "[ vehicle photo ]"}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <HeroStat label="ODO" value={lastOdometer != null ? lastOdometer.toLocaleString() : "—"} unit="km" />
            <HeroStat label="SOH" value={lastSoh != null ? lastSoh.toFixed(1) : "—"} unit="%" />
            <HeroStat label="次回車検" value={daysToExpiry != null ? String(daysToExpiry) : "—"} unit="日" tone={expiryTone} />
          </div>
        </Panel>

        <SectionGroup title="保険" sub="Insurance" action="履歴">
          <Panel className="p-4">
            {activeInsurance ? (
              <>
                <div className="flex items-baseline justify-between">
                  <div className="text-[14px] text-[var(--color-text-bright)] font-medium">{activeInsurance.provider} · {activeInsurance.coverageSummary}</div>
                  <Chip tone="cyan" solid>加入中</Chip>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 font-mono text-[12px]">
                  <InfoCell label="満期" value={activeInsurance.endDate} />
                  <InfoCell label="月額" value={`¥${(activeInsurance.premium ?? 0).toLocaleString()}`} />
                  <InfoCell label="種別" value={activeInsurance.type === "mandatory" ? "自賠責" : "任意"} />
                </div>
              </>
            ) : (
              <div className="text-[12px] text-[var(--color-text-muted)]">加入中の保険なし · Settings から追加</div>
            )}
          </Panel>
        </SectionGroup>

        <SectionGroup title="税金" sub="Tax">
          <div className="grid grid-cols-2 gap-3">
            <TaxCard
              name="自動車税"
              amount={automobileTax ? `¥${automobileTax.amount.toLocaleString()}` : "¥0"}
              sub={automobileTax ? `期限 ${automobileTax.dueDate}` : "EV 免税"}
              tone="plasma"
            />
            <TaxCard
              name="重量税"
              amount={weightTax ? `¥${weightTax.amount.toLocaleString()}` : "¥0"}
              sub={weightTax ? `期限 ${weightTax.dueDate}` : "車検時"}
              tone="cyan"
            />
          </div>
        </SectionGroup>

        <SectionGroup title="車検" sub="Inspection">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] text-[var(--color-text-bright)]">次回車検</div>
                <div className="text-[11px] text-[var(--color-text-muted)] font-mono">{expiryDate || "未登録"}{daysToExpiry != null ? ` · 残り ${daysToExpiry} 日` : ""}</div>
              </div>
              <ProgressRing
                value={expiryProgress}
                size={56}
                stroke={5}
                color={expiryTone === "warning" ? "var(--color-state-warning)" : "var(--color-signal-cyan)"}
                label={<span className="font-mono text-[11px]">{Math.round(expiryProgress)}%</span>}
                glow={false}
              />
            </div>
          </Panel>
        </SectionGroup>
      </div>
      <BottomNav active="car" />
    </div>
  );
}

function HeroStat({ label, value, unit, tone }) {
  return (
    <div className="ev-hero-stat">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className={`font-mono text-[22px] mt-1 leading-none ${tone === "warning" ? "text-[var(--color-state-warning)]" : "text-[var(--color-text-bright)]"}`}>{value}</div>
      {unit && <div className="text-[10px] text-[var(--color-text-dim)] font-mono mt-1">{unit}</div>}
    </div>
  );
}
function SectionGroup({ title, sub, action, children }) {
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between mb-2 px-0.5">
        <div>
          <span className="text-[15px] text-[var(--color-text-bright)] font-medium">{title}</span>
          <span className="text-[10px] text-[var(--color-text-dim)] font-mono uppercase tracking-wider ml-2">{sub}</span>
        </div>
        {action && <span className="text-[12px] text-[var(--color-signal-cyan)]">{action} ›</span>}
      </div>
      {children}
    </div>
  );
}
function InfoCell({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className="font-mono text-[var(--color-text-bright)] mt-1">{value}</div>
    </div>
  );
}
function TaxCard({ name, amount, sub, tone }) {
  return (
    <Panel className={`ev-tax-card tone-${tone} p-4`}>
      <div className="text-[12px] text-[var(--color-text-muted)]">{name}</div>
      <div className="font-mono text-[26px] text-[var(--color-text-bright)] mt-1 leading-none">{amount}</div>
      <div className="text-[10px] text-[var(--color-text-dim)] font-mono mt-2">{sub}</div>
    </Panel>
  );
}

/* ---------- 5. SETTINGS ---------- */

function SettingsScreen() {
  // L3 wire: GAS URL & outbox count from real stores
  const gasUrl = useSettingsStore((s) => s.settings.gasUrl);
  const outbox = useSyncStore((s) => s.outbox);
  const flushOutbox = useSyncStore((s) => s.flushOutbox);
  const pushToast = useToastStore((s) => s.push);
  const pendingCount = outbox.filter((e) => e.status !== "acked").length;
  const ackedCount = outbox.filter((e) => e.status === "acked").length;
  const totalCount = outbox.length;
  const isHealthy = !!gasUrl && pendingCount === 0;
  const shortUrl = gasUrl ? `script.google.com/...${gasUrl.slice(-4)}` : "未設定";

  const onSyncNow = async () => {
    if (!gasUrl) {
      pushToast?.({ kind: "error", title: "GAS URL 未設定", body: "先にエンドポイントを設定してください" });
      return;
    }
    pushToast?.({ kind: "info", title: "同期中…", body: `${pendingCount} 件を送信` });
    try {
      const res = await flushOutbox(gasUrl);
      pushToast?.({ kind: "ok", title: "同期完了", body: `${res.ackedCount} 件成功 / ${res.failedCount} 件失敗` });
    } catch (e: any) {
      pushToast?.({ kind: "error", title: "同期失敗", body: String(e?.message || e) });
    }
  };

  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="SETTINGS / 設定" title="システム" />
      <div className="ev-screen__body pt-1">

        <FgServiceTag />

        <SectionGroup title="GAS Sync" sub="Google Apps Script">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`ev-status-dot ${isHealthy ? "is-ok" : "is-warn"}`} />
                  <span className="text-[14px] text-[var(--color-text-bright)]">{isHealthy ? "接続正常" : pendingCount > 0 ? `保留 ${pendingCount} 件` : "未設定"}</span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-1">送信済 {ackedCount} 件 / 合計 {totalCount} 件</div>
              </div>
              <button className="ev-cta-secondary" onClick={onSyncNow} type="button">今すぐ同期</button>
            </div>
            <div className="ev-settings-divider" />
            <SettingsRow label="エンドポイント" value={shortUrl} mono />
            <SettingsRow label="保留中" value={`${pendingCount} 件`} />
          </Panel>
        </SectionGroup>

        <SectionGroup title="通知" sub="Notifications">
          <Panel className="p-1">
            <ToggleRow label="充電完了通知" sub="80% / 100% 到達時" on />
            <ToggleRow label="リマインダー" sub="車検・点検期限" on />
            <ToggleRow label="月次レポート" sub="毎月 1 日 9:00" />
          </Panel>
        </SectionGroup>

        <SectionGroup title="バックグラウンド GPS" sub="移動ログ自動記録">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] text-[var(--color-text-bright)]">記録中</div>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-1">通知バーに常駐通知 (Foreground service)</div>
              </div>
              <Toggle on />
            </div>
            <div className="ev-info-callout mt-3">
              <span className="ev-info-callout__icon">i</span>
              <span className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Android の通知バーに常駐通知が表示されます。アプリ内では二重表示を避けるため簡素化されています。
              </span>
            </div>
          </Panel>
          <BgPocDebugPanel />
        </SectionGroup>

        <SectionGroup title="データ" sub="Export / Import">
          <Panel className="p-1">
            <ActionRow label="エクスポート (CSV)" sub="142 件のレコード" />
            <ActionRow label="インポート" sub="JSON / CSV 対応" />
            <ActionRow label="バックアップを作成" sub="ローカル暗号化" />
          </Panel>
        </SectionGroup>
      </div>
      <BottomNav active="settings" />
    </div>
  );
}

function SettingsRow({ label, value, mono }) {
  return (
    <div className="ev-settings-row">
      <span className="text-[12px] text-[var(--color-text-muted)]">{label}</span>
      <span className={`text-[12px] text-[var(--color-text-default)] ${mono ? "font-mono" : ""} truncate ml-3`}>{value}</span>
    </div>
  );
}
function ToggleRow({ label, sub, on }) {
  return (
    <div className="ev-list-row">
      <div className="flex-1">
        <div className="text-[14px] text-[var(--color-text-bright)]">{label}</div>
        {sub && <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">{sub}</div>}
      </div>
      <Toggle on={on} />
    </div>
  );
}
function ActionRow({ label, sub }) {
  return (
    <div className="ev-list-row is-tappable">
      <div className="flex-1">
        <div className="text-[14px] text-[var(--color-text-bright)]">{label}</div>
        {sub && <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">{sub}</div>}
      </div>
      <span className="text-[var(--color-text-dim)]">›</span>
    </div>
  );
}
function Toggle({ on }) {
  return (
    <span className={`ev-toggle ${on ? "is-on" : ""}`}>
      <span className="ev-toggle__thumb" />
    </span>
  );
}

// PoC 期間 (5/6 評価まで) 中だけ表示する移動ログ debug パネル。
// localStorage を 2 秒ごとに poll → 件数 / 最終 ts / activity を表示。
// JSON download + クリアで端末から PC に持ち出して分析できる。
function BgPocDebugPanel() {
  const pushToast = useToastStore((s) => s.push);
  const [snapshot, setSnapshot] = React.useState<{ count: number; lastTs: string | null; lastActivity: string | null }>({
    count: 0,
    lastTs: null,
    lastActivity: null,
  });

  React.useEffect(() => {
    const refresh = () => {
      const arr = exportPocSamples();
      const last = arr[arr.length - 1];
      setSnapshot({
        count: arr.length,
        lastTs: last?.ts ?? null,
        lastActivity: last?.activity ?? null,
      });
    };
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  const lastTsLabel = snapshot.lastTs
    ? new Date(snapshot.lastTs).toLocaleString("ja-JP", { hour12: false })
    : "—";

  const onExport = () => {
    const samples = exportPocSamples();
    if (samples.length === 0) {
      pushToast?.({ kind: "info", title: "PoC サンプル空", body: "BG ログは 0 件です" });
      return;
    }
    try {
      const blob = new Blob([JSON.stringify(samples, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `bg-poc-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushToast?.({ kind: "ok", title: "PoC ログ出力", body: `${samples.length} 件を JSON で保存` });
    } catch (e: any) {
      pushToast?.({ kind: "error", title: "PoC 出力失敗", body: String(e?.message || e) });
    }
  };

  const onClear = () => {
    if (snapshot.count === 0) return;
    if (!confirm(`PoC ログ ${snapshot.count} 件を削除しますか? (元に戻せません)`)) return;
    clearPocSamples();
    setSnapshot({ count: 0, lastTs: null, lastActivity: null });
    pushToast?.({ kind: "ok", title: "PoC ログをクリア", body: "localStorage から削除しました" });
  };

  return (
    <Panel className="p-4 mt-3">
      <div className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)] font-mono uppercase mb-3">PoC Debug</div>
      <div className="grid grid-cols-3 gap-3 font-mono text-[12px]">
        <div>
          <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">件数</div>
          <div className="text-[18px] text-[var(--color-text-bright)] mt-1">{snapshot.count}</div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">Activity</div>
          <div className="text-[12px] text-[var(--color-text-bright)] mt-1.5 truncate">{snapshot.lastActivity || "—"}</div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">Last</div>
          <div className="text-[10px] text-[var(--color-text-bright)] mt-1.5 truncate">{lastTsLabel}</div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="ev-cta-secondary flex-1" onClick={onExport} type="button">JSON 出力</button>
        <button className="ev-cta-secondary flex-1" onClick={onClear} type="button" disabled={snapshot.count === 0}>クリア</button>
      </div>
    </Panel>
  );
}

Object.assign(window, {
  ChargingStartScreen, ChargingLiveScreen, ChargingCompleteScreen,
  HistoryScreen, StatsScreen, VehicleScreen, SettingsScreen,
});

export { ChargingStartScreen, ChargingLiveScreen, ChargingCompleteScreen, HistoryScreen, StatsScreen, VehicleScreen, SettingsScreen, FavRow };
