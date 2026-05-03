// @ts-nocheck
// NEXUS v2 main screens — canvas/ev-screens-main.jsx を TSX 化

import React from 'react';
import { NexusBg, ReminderBanner, AppHeader, BottomNav, Panel, ProgressRing, Chip, PrimaryCTA, StatTile, MiniChart, BarChart, Field, FgServiceTag, SectionTitle, Toast } from './primitives';

/* ============================================================
   EV Manager — Screen modules (主要 5 タブ)
   ============================================================ */

/* ---------- 1. CHARGING — three states ---------- */

function ChargingStartScreen() {
  return (
    <div className="ev-screen">
      <NexusBg />
      <ReminderBanner kind="warning" icon="⚠" title="次回車検まで 47 日" meta="2026-06-19 期限 · タップして確認" />
      <AppHeader kicker="CHARGING / 充電開始" title="充電を記録" subtitle="ステーション選択後、開始前 SOC を入力" right={<Chip tone="cyan">GAS 同期 OK</Chip>} />

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

        <div className="mt-4">
          <PrimaryCTA tone="plasma" glyph={<BoltGlyph />} sub="GPS で充電器を自動検出済み">充電開始</PrimaryCTA>
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
  return (
    <div className="ev-screen">
      <NexusBg />
      <div className="ev-screen__body ev-charging-live">
        <div className="text-center mt-2">
          <div className="text-[10px] tracking-[0.3em] text-[var(--color-charge-plasma)] font-mono uppercase">CHARGING IN PROGRESS</div>
          <div className="text-[12px] text-[var(--color-text-muted)] mt-1 font-mono">e-Mobility Power 90kW · DC急速</div>
        </div>

        <div className="flex justify-center mt-6">
          <ProgressRing
            value={62} size={240} stroke={12}
            color="var(--color-charge-plasma)"
            label={<><span className="text-[64px] font-display font-light leading-none">62</span><span className="text-[24px] font-display ml-1">%</span></>}
            sublabel={<span className="font-mono text-[12px] text-[var(--color-text-muted)]">+24% / 38 → 62</span>}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-7">
          <LiveMetric label="経過" value="14:23" unit="" mono />
          <LiveMetric label="kWh" value="18.7" unit="kWh" />
          <LiveMetric label="実効" value="78.4" unit="kW" />
        </div>

        <Panel className="p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider">予測 80% 到達</span>
            <span className="font-mono text-[var(--color-charge-plasma)]">+ 06:12</span>
          </div>
          <div className="ev-progress-track mt-3">
            <div className="ev-progress-fill" style={{ width: "62%" }} />
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
          <button className="ev-cta ev-cta--danger">
            <span className="ev-cta__label">充電終了</span>
            <span className="ev-cta__sub">¥514 累計</span>
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
  return (
    <div className="ev-screen">
      <NexusBg />
      <Toast kind="ok" title="充電完了" body="GAS sync · 履歴に保存しました" />
      <div className="ev-screen__body pt-12">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)] font-mono uppercase">SESSION COMPLETE</div>
          <div className="text-[68px] font-display font-light leading-none mt-2 text-[var(--color-charge-plasma)]" style={{textShadow: "0 0 24px rgba(77,255,155,0.4)"}}>27.4</div>
          <div className="text-[14px] text-[var(--color-text-muted)] font-mono">kWh 充電</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-7">
          <SummaryCell label="料金" value="¥753" sub="¥27.5/min × 27:23" />
          <SummaryCell label="kWh 単価" value="¥27.5" sub="今月平均 ¥29.8" tone="cyan" />
          <SummaryCell label="開始 → 終了" value="38 → 80%" sub="+42pp" />
          <SummaryCell label="経過時間" value="27:23" sub="実効 60.0kW" />
        </div>

        <Panel className="p-4 mt-4">
          <SectionTitle>場所</SectionTitle>
          <div className="ev-map-placeholder mt-2">
            <div className="ev-map-pin" />
            <div className="text-[11px] font-mono text-[var(--color-text-muted)]">35.6541, 138.9762 · 道の駅 川場田園プラザ</div>
          </div>
          <button className="ev-link mt-3">★ お気に入りに追加</button>
        </Panel>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <SecondaryCTA>メモ追加</SecondaryCTA>
          <PrimaryCTA tone="cyan">完了</PrimaryCTA>
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
  const items = [
    { type: "charge", date: "今日 14:23", title: "急速充電 27.4kWh", meta: "道の駅 川場田園プラザ · ¥753", tag: "DC" },
    { type: "charge", date: "5/01 22:15", title: "普通充電 18.2kWh", meta: "自宅 · ¥510", tag: "AC" },
    { type: "maint",  date: "4/28",      title: "タイヤローテーション", meta: "オートバックス 高崎 · ¥3,300" },
    { type: "charge", date: "4/26 09:42", title: "急速充電 22.0kWh", meta: "イオンモール高崎 · ¥605", tag: "DC" },
    { type: "inspect", date: "4/15",     title: "12ヶ月点検", meta: "ディーラー · ¥18,700" },
    { type: "charge", date: "4/12 18:30", title: "普通充電 24.8kWh", meta: "自宅 · ¥694", tag: "AC" },
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
  const cost = [4200, 3800, 5100, 4600, 5400, 4900, 5800, 5200, 4700, 5100, 4400, 5800];
  const months = ["6","7","8","9","10","11","12","1","2","3","4","5"];
  const soh = [100, 99.6, 99.1, 98.7, 98.4, 98.0, 97.7, 97.4, 97.1, 96.9, 96.7, 96.5];
  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="STATS / 統計" title="ダッシュボード" subtitle="2025-06 〜 2026-05 (12ヶ月)" right={<Chip tone="cyan">同期 2分前</Chip>} />

      <div className="ev-screen__body pt-1">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="累計走行" value="24,387" unit="km" delta="+1,247" tone="cyan" />
          <StatTile label="平均電費" value="6.2" unit="km/kWh" delta="+0.3" tone="plasma" />
          <StatTile label="月次コスト" value="5,800" unit="¥" delta="+8.4%" tone="warning" />
          <StatTile label="SOH" value="96.5" unit="%" delta="-0.2" tone="violet" />
        </div>

        <Panel className="p-4 mt-3">
          <div className="flex items-baseline justify-between">
            <SectionTitle>月次コスト推移</SectionTitle>
            <span className="font-mono text-[11px] text-[var(--color-text-muted)]">¥58,800 / 12mo</span>
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
  return (
    <div className="ev-screen">
      <NexusBg />
      <AppHeader kicker="VEHICLE / 車両" title="ニッサン リーフ e+" subtitle="ZE1 · 2022年式 · 購入 2023-04" />

      <div className="ev-screen__body pt-1">
        {/* Hero card */}
        <Panel className="p-5 ev-vehicle-hero" glow>
          <div className="ev-vehicle-illust">
            <div className="ev-vehicle-illust__inner" aria-label="vehicle photo placeholder">
              <span className="font-mono text-[10px] text-[var(--color-text-dim)]">[ vehicle photo ]</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <HeroStat label="ODO" value="24,387" unit="km" />
            <HeroStat label="SOH" value="96.5" unit="%" />
            <HeroStat label="次回車検" value="47" unit="日" tone="warning" />
          </div>
        </Panel>

        <SectionGroup title="保険" sub="Insurance" action="履歴">
          <Panel className="p-4">
            <div className="flex items-baseline justify-between">
              <div className="text-[14px] text-[var(--color-text-bright)] font-medium">ソニー損保 · 一般車両</div>
              <Chip tone="cyan" solid>加入中</Chip>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 font-mono text-[12px]">
              <InfoCell label="満期" value="2026-12-15" />
              <InfoCell label="月額" value="¥4,820" />
              <InfoCell label="等級" value="20 (60%)" />
            </div>
          </Panel>
        </SectionGroup>

        <SectionGroup title="税金" sub="Tax">
          <div className="grid grid-cols-2 gap-3">
            <TaxCard name="自動車税" amount="¥0" sub="EV 免税" tone="plasma" />
            <TaxCard name="重量税" amount="¥0" sub="2026-06 (車検時)" tone="cyan" />
          </div>
        </SectionGroup>

        <SectionGroup title="車検" sub="Inspection">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] text-[var(--color-text-bright)]">次回車検</div>
                <div className="text-[11px] text-[var(--color-text-muted)] font-mono">2026-06-19 · 残り 47 日</div>
              </div>
              <ProgressRing value={87} size={56} stroke={5} color="var(--color-state-warning)" label={<span className="font-mono text-[11px]">87%</span>} glow={false} />
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
                  <span className="ev-status-dot is-ok" />
                  <span className="text-[14px] text-[var(--color-text-bright)]">接続正常</span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-1">最終同期 2分前 · 142 件 / 142 件</div>
              </div>
              <button className="ev-cta-secondary">今すぐ同期</button>
            </div>
            <div className="ev-settings-divider" />
            <SettingsRow label="エンドポイント" value="script.google.com/...AKfy" mono />
            <SettingsRow label="同期間隔" value="15 分" />
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

Object.assign(window, {
  ChargingStartScreen, ChargingLiveScreen, ChargingCompleteScreen,
  HistoryScreen, StatsScreen, VehicleScreen, SettingsScreen,
});

export { ChargingStartScreen, ChargingLiveScreen, ChargingCompleteScreen, HistoryScreen, StatsScreen, VehicleScreen, SettingsScreen };
