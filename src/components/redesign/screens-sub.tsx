// @ts-nocheck
// NEXUS v2 sub screens — canvas/ev-screens-sub.jsx を TSX 化
// canvas-only な DriveLogLandscape / TabletDashboard も同梱 (production では未使用)

import React from 'react';
import { NexusBg, ReminderBanner, AppHeader, BottomNav, Panel, Chip, PrimaryCTA, StatTile, Field, SectionTitle, ProgressRing, FgServiceTag, MiniChart, BarChart } from './primitives';
import { FavRow } from './screens-main';

/* ============================================================
   EV Manager — Sub screens (Maintenance, Inspection, Meter, Onboarding, Help) +
   Landscape drive log + Tablet
   ============================================================ */

/* ---------- 6. MAINTENANCE ---------- */
function MaintenanceScreen() {
  const items = [
    { date: "2026-04-28", title: "タイヤローテーション", shop: "オートバックス 高崎", odo: "23,140 km", price: "¥3,300" },
    { date: "2025-11-12", title: "ワイパーゴム交換", shop: "DIY", odo: "20,883 km", price: "¥1,840" },
    { date: "2025-08-04", title: "12V バッテリー交換", shop: "ディーラー", odo: "18,201 km", price: "¥18,700" },
    { date: "2025-04-22", title: "タイヤ交換 (夏)", shop: "イエローハット", odo: "14,520 km", price: "¥58,400" },
  ];
  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="MAINTENANCE / メンテ" title="メンテナンス記録" right={<button className="ev-cta-secondary !px-3 !py-1.5 !text-[12px]">+ 追加</button>} />
      <div className="ev-screen__body pt-1">
        <Panel className="p-4">
          <div className="flex items-baseline justify-between">
            <SectionTitle>次回推奨</SectionTitle>
            <span className="font-mono text-[11px] text-[var(--color-text-muted)]">残り走行距離</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <UpcomingChip name="タイヤローテーション" left="2,860 km" pct={65} />
            <UpcomingChip name="ブレーキ点検" left="5,613 km" pct={42} />
          </div>
        </Panel>
        <div className="mt-3 space-y-2">
          {items.map((it, i) => (
            <Panel key={i} className="p-3.5 flex gap-3 items-center" interactive>
              <div className="ev-maint-glyph">🔧</div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <div className="text-[14px] text-[var(--color-text-bright)] font-medium">{it.title}</div>
                  <div className="font-mono text-[12px] text-[var(--color-text-bright)]">{it.price}</div>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">{it.date} · {it.shop} · ODO {it.odo}</div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
      <BottomNav active="car" />
    </div>
  );
}
function UpcomingChip({ name, left, pct }) {
  return (
    <div className="ev-upcoming">
      <div className="text-[12px] text-[var(--color-text-bright)]">{name}</div>
      <div className="ev-progress-track is-thin mt-2"><div className="ev-progress-fill is-warn" style={{ width: pct + "%" }} /></div>
      <div className="font-mono text-[10px] text-[var(--color-text-muted)] mt-1">{left}</div>
    </div>
  );
}

/* ---------- 7. INSPECTION ---------- */
function InspectionScreen() {
  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="INSPECTION / 点検" title="点検記録" />
      <div className="ev-screen__body pt-1">
        <Panel className="p-5" glow>
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] text-[var(--color-state-warning)] font-mono uppercase">NEXT INSPECTION</div>
            <div className="font-display text-[42px] text-[var(--color-text-bright)] mt-2 leading-none">47<span className="text-[18px] ml-1.5 text-[var(--color-text-muted)]">日後</span></div>
            <div className="font-mono text-[12px] text-[var(--color-text-muted)] mt-2">2026-06-19 · 車検 (継続検査)</div>
          </div>
          <div className="ev-progress-track mt-4"><div className="ev-progress-fill is-warn" style={{ width: "87%" }} /></div>
          <div className="flex justify-between mt-1.5 font-mono text-[10px] text-[var(--color-text-dim)]">
            <span>2024-06</span><span>87% 経過</span><span>2026-06</span>
          </div>
        </Panel>

        <SectionTitle>履歴</SectionTitle>
        <div className="space-y-2">
          {[
            { date: "2025-04-15", title: "12ヶ月点検", shop: "日産プリンス群馬", price: "¥18,700", odo: "14,201 km" },
            { date: "2024-06-08", title: "新車車検", shop: "日産プリンス群馬", price: "¥87,400", odo: "8,420 km" },
          ].map((it, i) => (
            <Panel key={i} className="p-3.5">
              <div className="flex items-baseline justify-between">
                <div className="text-[14px] text-[var(--color-text-bright)] font-medium">{it.title}</div>
                <div className="font-mono text-[12px] text-[var(--color-text-bright)]">{it.price}</div>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">{it.date} · {it.shop} · {it.odo}</div>
            </Panel>
          ))}
        </div>
      </div>
      <BottomNav active="car" />
    </div>
  );
}

/* ---------- 8. METER CAPTURE ---------- */
function MeterCaptureScreen() {
  return (
    <div className="ev-screen">
      <div className="ev-meter-cam">
        <div className="ev-meter-cam__viewfinder">
          <div className="ev-meter-cam__frame">
            <span className="ev-meter-cam__corner tl" /><span className="ev-meter-cam__corner tr" />
            <span className="ev-meter-cam__corner bl" /><span className="ev-meter-cam__corner br" />
            <div className="ev-meter-cam__readout">
              <div className="text-[10px] tracking-[0.3em] text-[var(--color-charge-plasma)] font-mono uppercase">OCR DETECTED</div>
              <div className="font-mono text-[44px] text-[var(--color-charge-plasma)] mt-1 leading-none">24,387</div>
              <div className="font-mono text-[11px] text-[var(--color-text-muted)] mt-1">km · 信頼度 98.2%</div>
            </div>
          </div>
          <div className="ev-meter-cam__hint">
            <span className="ev-status-dot is-plasma" />
            <span className="text-[12px] text-[var(--color-text-bright)]">メーターを枠内に収めてください</span>
          </div>
        </div>
        <div className="ev-meter-cam__controls">
          <button className="ev-meter-cam__btn ev-meter-cam__btn--ghost">フラッシュ</button>
          <button className="ev-meter-cam__shutter" aria-label="撮影"><span /></button>
          <button className="ev-meter-cam__btn ev-meter-cam__btn--ghost">手動入力</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 9. ONBOARDING ---------- */
function OnboardingScreen() {
  return (
    <div className="ev-screen">
      <NexusBg />
      <div className="ev-screen__body justify-between flex flex-col h-full">
        <div />
        <div className="text-center px-4">
          <div className="ev-onboard-logo">
            <div className="ev-onboard-logo__ring" />
            <div className="ev-onboard-logo__ring is-2" />
            <div className="ev-onboard-logo__core">EV</div>
          </div>
          <div className="text-[10px] tracking-[0.4em] text-[var(--color-signal-cyan)] font-mono uppercase mt-7">NEXUS · v2</div>
          <h1 className="font-display text-[34px] text-[var(--color-text-bright)] mt-3 leading-tight" style={{textWrap:"balance"}}>
            あなたの EV<br/>ライフを、すべて記録。
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-3 leading-relaxed" style={{textWrap:"balance"}}>
            充電・走行・メンテ・税金—— ひとつのアプリで。<br/>GAS 同期で永続バックアップ。
          </p>
        </div>
        <div className="px-4 pb-2">
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <span className="ev-dot is-on" /><span className="ev-dot" /><span className="ev-dot" /><span className="ev-dot" />
          </div>
          <PrimaryCTA tone="cyan">はじめる</PrimaryCTA>
          <button className="ev-link mt-3 mx-auto block">既存データから復元</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 10. HELP ---------- */
function HelpScreen() {
  const faqs = [
    { q: "GAS sync が NG になります", a: "Settings → GAS sync → エンドポイントを再認証してください。" },
    { q: "BG GPS の通知を消したい", a: "Android の仕様上、Foreground service 通知は非表示にできません。" },
    { q: "充電器が自動検出されない", a: "GPS 精度を「高」に設定し、屋外で再試行してください。" },
    { q: "SOH はどう計算される？", a: "充電履歴の容量推定値からの 30 日移動平均です。" },
  ];
  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="HELP / ヘルプ" title="よくある質問" />
      <div className="ev-screen__body pt-1">
        <Panel className="p-4 flex items-center gap-3">
          <div className="ev-help-glyph">?</div>
          <div className="flex-1">
            <div className="text-[14px] text-[var(--color-text-bright)]">v2.4.1 · NEXUS</div>
            <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">Capacitor 7 · Android 16 · S25 Ultra</div>
          </div>
          <button className="ev-cta-secondary !px-3 !py-1.5 !text-[12px]">更新確認</button>
        </Panel>
        <div className="mt-3 space-y-2">
          {faqs.map((f, i) => (
            <Panel key={i} className="p-3.5">
              <div className="flex gap-2 items-start">
                <span className="ev-faq-q">Q</span>
                <span className="text-[13.5px] text-[var(--color-text-bright)] flex-1">{f.q}</span>
                <span className="text-[var(--color-text-dim)]">▾</span>
              </div>
              <div className="flex gap-2 items-start mt-2 pt-2 border-t border-[var(--color-edge-faint)]">
                <span className="ev-faq-a">A</span>
                <span className="text-[12px] text-[var(--color-text-muted)] flex-1 leading-relaxed">{f.a}</span>
              </div>
            </Panel>
          ))}
        </div>
      </div>
      <BottomNav active="settings" />
    </div>
  );
}

/* ---------- LANDSCAPE — Drive log ---------- */
function DriveLogLandscape() {
  return (
    <div className="ev-screen ev-screen--land">
      <NexusBg />
      <div className="ev-drivelog">
        <div className="ev-drivelog__left">
          <div className="text-[10px] tracking-[0.3em] text-[var(--color-charge-plasma)] font-mono uppercase">DRIVING · BG GPS REC</div>
          <div className="flex items-baseline gap-3 mt-2">
            <div className="font-display text-[64px] leading-none text-[var(--color-text-bright)]">68</div>
            <div className="font-mono text-[14px] text-[var(--color-text-muted)]">km/h</div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5">
            <LandStat label="ODO" value="24,402" unit="km" />
            <LandStat label="区間" value="62.4" unit="km" />
            <LandStat label="電費" value="6.8" unit="km/kWh" />
            <LandStat label="残 SOC" value="51" unit="%" />
            <LandStat label="航続" value="218" unit="km" />
            <LandStat label="経過" value="01:24:08" unit="" mono />
          </div>
        </div>
        <div className="ev-drivelog__right">
          <div className="ev-map-placeholder is-land">
            <svg viewBox="0 0 200 100" className="ev-map-route" preserveAspectRatio="none">
              <path d="M5,80 Q40,70 60,55 T120,40 Q150,32 195,18" stroke="var(--color-signal-cyan)" strokeWidth="1.5" fill="none" strokeDasharray="2 3"/>
              <circle cx="195" cy="18" r="3" fill="var(--color-charge-plasma)"/>
              <circle cx="5"   cy="80" r="2" fill="var(--color-signal-cyan)"/>
            </svg>
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-[var(--color-text-muted)]">[ map placeholder ]</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function LandStat({ label, value, unit }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className="font-mono text-[20px] text-[var(--color-text-bright)] mt-0.5 leading-none">{value}{unit && <span className="text-[11px] text-[var(--color-text-dim)] ml-1">{unit}</span>}</div>
    </div>
  );
}

/* ---------- TABLET ---------- */
function TabletDashboard() {
  const cost = [4200, 3800, 5100, 4600, 5400, 4900, 5800, 5200, 4700, 5100, 4400, 5800];
  const months = ["6","7","8","9","10","11","12","1","2","3","4","5"];
  const soh = [100, 99.6, 99.1, 98.7, 98.4, 98.0, 97.7, 97.4, 97.1, 96.9, 96.7, 96.5];
  return (
    <div className="ev-screen ev-screen--tab">
      <NexusBg />
      <div className="ev-tab-shell">
        <aside className="ev-tab-rail">
          <div className="ev-tab-rail__brand">
            <div className="ev-tab-rail__logo">EV</div>
            <div>
              <div className="text-[14px] text-[var(--color-text-bright)] font-medium">NEXUS</div>
              <div className="text-[10px] font-mono text-[var(--color-text-muted)]">v2.4.1</div>
            </div>
          </div>
          {["充電","履歴","統計","車両","設定"].map((l, i) => (
            <button key={l} className={`ev-tab-rail__item ${i === 2 ? "is-active" : ""}`}>
              <span className="ev-tab-rail__dot"/>{l}
            </button>
          ))}
          <div className="flex-1" />
          <FgServiceTag />
        </aside>
        <main className="ev-tab-main">
          <AppHeader kicker="DASHBOARD" title="統計ダッシュボード" subtitle="2025-06 〜 2026-05" right={<Chip tone="cyan">同期 2分前</Chip>} />
          <div className="grid grid-cols-4 gap-4 mt-2">
            <StatTile label="累計走行" value="24,387" unit="km" delta="+1,247" tone="cyan" />
            <StatTile label="平均電費" value="6.2" unit="km/kWh" delta="+0.3" tone="plasma" />
            <StatTile label="月次コスト" value="5,800" unit="¥" delta="+8.4%" tone="warning" />
            <StatTile label="SOH" value="96.5" unit="%" delta="-0.2" tone="violet" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Panel className="p-5 col-span-2">
              <SectionTitle>月次コスト推移</SectionTitle>
              <BarChart data={cost} labels={months} h={180} color="var(--color-signal-cyan)" />
            </Panel>
            <Panel className="p-5">
              <SectionTitle>SOH 推移</SectionTitle>
              <MiniChart data={soh} h={150} color="var(--color-signal-violet)" />
            </Panel>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Panel className="p-5">
              <SectionTitle>★ お気に入り充電スポット</SectionTitle>
              <div className="mt-3 space-y-2">
                <FavRow rank={1} name="自宅 (200V)" count={47} avg="¥27.9" />
                <FavRow rank={2} name="道の駅 川場田園プラザ" count={12} avg="¥27.5" />
                <FavRow rank={3} name="イオンモール高崎" count={8} avg="¥27.5" />
              </div>
            </Panel>
            <Panel className="p-5">
              <SectionTitle>最近の充電</SectionTitle>
              <div className="mt-3 space-y-2 font-mono text-[12px] text-[var(--color-text-muted)]">
                <div className="flex justify-between"><span>今日 14:23 · 27.4 kWh</span><span className="text-[var(--color-text-bright)]">¥753</span></div>
                <div className="flex justify-between"><span>5/01 22:15 · 18.2 kWh</span><span className="text-[var(--color-text-bright)]">¥510</span></div>
                <div className="flex justify-between"><span>4/26 09:42 · 22.0 kWh</span><span className="text-[var(--color-text-bright)]">¥605</span></div>
                <div className="flex justify-between"><span>4/12 18:30 · 24.8 kWh</span><span className="text-[var(--color-text-bright)]">¥694</span></div>
              </div>
            </Panel>
          </div>
        </main>
      </div>
    </div>
  );
}

Object.assign(window, {
  MaintenanceScreen, InspectionScreen, MeterCaptureScreen,
  OnboardingScreen, HelpScreen, DriveLogLandscape, TabletDashboard,
});

export { MaintenanceScreen, InspectionScreen, MeterCaptureScreen, OnboardingScreen, HelpScreen, DriveLogLandscape, TabletDashboard };
