/* ============================================================
   EV Manager — Design canvas main entry
   ============================================================ */

const { useState, useEffect } = React;

function App() {
  const DesignCanvas = window.DesignCanvas;
  const DCSection = window.DCSection;
  const DCArtboard = window.DCArtboard;
  return (
    <DesignCanvas>
      <DCSection id="title" title="EV Manager · NEXUS v2 — Direction A (Evolution)" subtitle="Personal EV total-management PWA · Capacitor 7 / S25 Ultra · 日本語 UI" />

      <DCSection id="primary" title="主要 5 タブ — S25 Ultra Portrait (412 × 915)" subtitle="BottomNav 主要画面 · One UI 8.0 · edge-to-edge">
        <DCArtboard id="ab-charge-start"   label="01 · Charging — 開始"     width={412} height={915}>
          <PhoneShellWrap><ChargingStartScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-charge-live"    label="02 · Charging — 進行中"   width={412} height={915}>
          <PhoneShellWrap><ChargingLiveScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-charge-done"    label="03 · Charging — 完了"     width={412} height={915}>
          <PhoneShellWrap><ChargingCompleteScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-history"        label="04 · History"             width={412} height={915}>
          <PhoneShellWrap><HistoryScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-stats"          label="05 · Stats"               width={412} height={915}>
          <PhoneShellWrap><StatsScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-vehicle"        label="06 · Vehicle"             width={412} height={915}>
          <PhoneShellWrap><VehicleScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-settings"       label="07 · Settings"            width={412} height={915}>
          <PhoneShellWrap><SettingsScreen /></PhoneShellWrap>
        </DCArtboard>
      </DCSection>

      <DCSection id="sub" title="サブ画面 — S25 Ultra Portrait" subtitle="主要タブから遷移する画面">
        <DCArtboard id="ab-maint"    label="08 · Maintenance"  width={412} height={915}>
          <PhoneShellWrap><MaintenanceScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-inspect"  label="09 · Inspection"   width={412} height={915}>
          <PhoneShellWrap><InspectionScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-meter"    label="10 · Meter Capture" width={412} height={915}>
          <PhoneShellWrap><MeterCaptureScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-onboard"  label="11 · Onboarding"   width={412} height={915}>
          <PhoneShellWrap><OnboardingScreen /></PhoneShellWrap>
        </DCArtboard>
        <DCArtboard id="ab-help"     label="12 · Help / FAQ"   width={412} height={915}>
          <PhoneShellWrap><HelpScreen /></PhoneShellWrap>
        </DCArtboard>
      </DCSection>

      <DCSection id="land" title="S25 Ultra Landscape (915 × 412)" subtitle="運転中ドライブログ専用 — BG GPS 連動">
        <DCArtboard id="ab-drive" label="13 · Drive Log (Landscape)" width={915} height={412}>
          <LandscapeShell><DriveLogLandscape /></LandscapeShell>
        </DCArtboard>
      </DCSection>

      <DCSection id="tab" title="Tablet Portrait (800 × 1280) — 将来対応" subtitle="同じトークン・同じコンポーネント、グリッド再配置のみ">
        <DCArtboard id="ab-tablet" label="14 · Tablet Dashboard" width={800} height={1280}>
          <TabletShell><TabletDashboard /></TabletShell>
        </DCArtboard>
      </DCSection>

      <DCSection id="rationale" title="Rationale & Component Map" subtitle="設計判断と、既存コードへの対応">
        <DCArtboard id="ab-rationale" label="15 · Rationale"      width={780} height={1180}>
          <RationaleDoc />
        </DCArtboard>
        <DCArtboard id="ab-compmap"   label="16 · Component Map"  width={780} height={1180}>
          <ComponentMapDoc />
        </DCArtboard>
        <DCArtboard id="ab-tokens"    label="17 · Token cheat-sheet" width={780} height={1180}>
          <TokenSheet />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

/* ---------- Phone shell wrappers ---------- */
function PhoneShellWrap({ children }) {
  return (
    <div className="ev-device-frame">
      <div className="ev-device-frame__bezel">
        <div className="ev-device-frame__inner">{children}</div>
      </div>
    </div>
  );
}
function LandscapeShell({ children }) {
  return (
    <div className="ev-device-frame is-land">
      <div className="ev-device-frame__bezel">
        <div className="ev-device-frame__inner">{children}</div>
      </div>
    </div>
  );
}
function TabletShell({ children }) {
  return (
    <div className="ev-device-frame is-tab">
      <div className="ev-device-frame__bezel">
        <div className="ev-device-frame__inner">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Rationale doc ---------- */
function RationaleDoc() {
  return (
    <div className="ev-doc">
      <header>
        <div className="ev-doc__kicker">RATIONALE / 設計判断</div>
        <h1>NEXUS v2 — なぜこの形か</h1>
        <p className="ev-doc__lede">
          v1 の SF/サイバー方向性は維持しつつ、長時間利用での読みやすさ・運転中の片手操作・
          Foreground service との視覚的な棲み分けを軸に再設計しました。
        </p>
      </header>

      <h2>1. Typography — Orbitron → Sora へ</h2>
      <p>
        Orbitron は短いラベルでは映えますが、日本語と混在する設定画面や履歴で「映画ポスター調」
        が情報密度を阻害していました。<b>Sora</b>（ジオメトリック・サンセリフ）に置き換えることで、
        テクニカルな姿勢を保ったまま JP/EN ハイブリッドの可読性を改善。kWh / ¥ / SOC% などの
        数字は <b>JetBrains Mono</b> を継続。本文は Inter + Noto Sans JP。
      </p>

      <h2>2. Color — シグナル色を 1 段落ち着かせる</h2>
      <p>
        Cyber Cyan (#00F0FF) は屋外昼間の S25U で網膜残像が強かったため
        <b> #22E6FF</b> へ。Plasma Green も #39FF14 から <b>#4DFF9B</b> に再調整して
        充電中の長時間注視に耐える明度に。Surface は純黒回避（#04060D）で OLED スメアを抑制、
        パネルは rgba 透過 + blur で「層の浮き」を強化しました。
      </p>

      <h2>3. Charging Live — 一画面集約 / 80% ターゲット可視化</h2>
      <p>
        進行中は <b>SOC リング</b>を 240px の主役に置き、+ 経過 / kWh / 実効レートの 3 メトリクス、
        + 80% 到達予測バーで「あと何分か」を即座に把握できる構成。終了 CTA は danger 色で
        誤操作を防ぎつつ、累計料金を sub に表示して「途中終了の影響」を可視化。
      </p>

      <h2>4. Foreground Service との棲み分け</h2>
      <p>
        BG GPS 通知は Android 通知バーが第一情報源。アプリ内では Settings の小さな
        <code>FgServiceTag</code> でステータスを示すのみとし、HUD やトーストでの再通知はしません。
        ドライブログ（横画面）でだけ「DRIVING · BG GPS REC」のキッカーを残し、
        「アプリが今何をしているか」を運転中に確認できるようにしました。
      </p>

      <h2>5. 片手操作 — 主アクションは画面下半分</h2>
      <p>
        BottomNav に加え、各画面の <b>主 CTA を画面下端</b>に固定（充電開始・終了 / 完了 /
        次へ）。Stat tile や履歴行は親指届きやすい中段以下に配置。Reminder banner は
        最上部だが「通知を受け取る」のみで、アクションを要求しない設計。
      </p>

      <h2>6. Glass surface 強化</h2>
      <p>
        v1 の panel は単純な rgba。v2 は <code>backdrop-filter: blur(20px) saturate(140%)</code> +
        内側 1px のハイライト + 外側ドロップシャドウで、深度差を作って情報階層を強調しています。
      </p>

      <h2>7. 比較が必要なら</h2>
      <p>
        Direction B（iOS 26 / Material You / Tactical / Tesla 系）への切替は、tokens.css の
        差し替えと panel/CTA の variant 追加で対応可能な構造にしてあります。
        次イテレーションで A/B 並列を希望する場合はこの canvas に <code>DCSection</code> を追加します。
      </p>
    </div>
  );
}

/* ---------- Component map ---------- */
function ComponentMapDoc() {
  const rows = [
    ["BottomNav",         "src/components/ui/BottomNav.tsx",       "ev-bottomnav, ev-tab",                   "5 タブ + active dot + safe-area inset-bottom"],
    ["ProgressRing",      "src/components/ui/ProgressRing.tsx",    "ev-ring",                                "size/stroke/color prop。SOC・残期限などに使用"],
    ["Toast",             "src/components/ui/Toast.tsx",           "ev-toast",                               "tone: ok/warning/error。kind に応じた左ストライプ"],
    ["ReminderBanner",    "src/components/ui/ReminderBanner.tsx",  "ev-reminder",                            "全画面共通最上部。danger/warning/info 3 段階"],
    ["Starfield",         "src/components/ui/Starfield.tsx",       "nexus-grid-bg + nexus-orb",              "アニメ grid + ambient orbs (この canvas で再現)"],
    ["Modal",             "src/components/ui/Modal.tsx",           "ev-panel.is-elevated",                   "Sheet 形式。surface-elevated トークン"],
    ["StartChargingForm", "src/components/charging/StartChargingForm.tsx",  "ev-rate-plan, ev-field",       "RatePlan + Field を組み合わせて再現"],
    ["LiveChargingScreen","src/components/charging/LiveChargingScreen.tsx", "ev-charging-live, ev-progress-track", "リング + 80% target marker"],
    ["CompletionSummary", "src/components/charging/CompletionSummary.tsx",  "ev-summary-cell",              "2x2 グリッドで kWh / ¥ / 単価 / 経過"],
    ["StatsDashboard",    "src/components/stats/StatsDashboard.tsx",        "ev-stat-tile + MiniChart/BarChart", "tone により枠色のヒントが変わる"],
    ["VehicleTab",        "src/components/vehicle/VehicleTab.tsx",          "ev-vehicle-hero + SectionGroup",   "Hero + Insurance/Tax/Inspection sub-sections"],
    ["AddInsuranceForm",  "src/components/vehicle/AddInsuranceForm.tsx",    "ev-panel.is-elevated + Field",  "Modal 内で reuse"],
    ["MaintenanceTab",    "src/components/maintenance/MaintenanceTab.tsx",  "ev-upcoming + timeline rows",   "次回推奨 + 履歴"],
    ["AddMaintenanceForm","src/components/maintenance/AddMaintenanceForm.tsx", "Modal + Field",             "AddInspectionForm と layout 共有"],
    ["MeterCapture",      "src/components/meter-capture/*.tsx",             "ev-meter-cam",                   "カメラビュー + OCR 結果オーバーレイ"],
    ["Onboarding",        "src/components/onboarding/*.tsx",                "ev-onboard-logo + ev-dot",       "4 ステップ。最終ステップで GAS 認証へ"],
    ["Help",              "src/components/help/*.tsx",                      "ev-faq-q / ev-faq-a",            "Q/A アコーディオン (expanded 状態を表示)"],
  ];
  return (
    <div className="ev-doc">
      <header>
        <div className="ev-doc__kicker">COMPONENT MAP</div>
        <h1>既存コードとの対応</h1>
        <p className="ev-doc__lede">
          このデザインの各要素が、既存の React コンポーネントのどこに対応するか。
          tokens.css の <code>@theme</code> 変数をそのまま <code>className</code> 経由で参照できます。
        </p>
      </header>
      <table className="ev-table">
        <thead>
          <tr><th>Design</th><th>File</th><th>Class / token</th><th>Note</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><code>{r[0]}</code></td>
              <td className="mono">{r[1]}</td>
              <td className="mono">{r[2]}</td>
              <td>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Tailwind v4 で使う例</h2>
      <pre className="ev-pre">{`<div class="bg-[var(--color-surface-panel)] border border-[var(--color-edge-soft)]
            rounded-[var(--radius-lg)] p-[var(--space-4)]
            text-[var(--color-text-bright)] font-[var(--font-display)]">
  ...
</div>`}</pre>
      <p className="text-[12px] text-[var(--color-text-muted)] mt-2">
        既存の zustand / i18next 接続はそのまま。tokens.css を差し替え、
        primitive の className を上記対応表に合わせて更新するだけで適用できます。
      </p>
    </div>
  );
}

/* ---------- Token cheat sheet ---------- */
function TokenSheet() {
  const swatches = [
    ["signal-cyan",        "#22E6FF", "primary / focus / link"],
    ["signal-cyan-dim",    "#0FA3B8", "secondary primary"],
    ["signal-violet",      "#8B7BFF", "secondary accent / SOH"],
    ["charge-plasma",      "#4DFF9B", "充電中・成功状態"],
    ["state-warning",      "#FFB020", "車検・期限"],
    ["state-danger",       "#FF4D6A", "終了・削除"],
    ["surface-void",       "#04060D", "root bg"],
    ["surface-deep",       "#080C18", "page bg"],
    ["surface-base",       "#0E1424", "below-glass"],
    ["text-bright",        "#EAF2FF", "見出し・主要数値"],
    ["text-default",       "#C4D2E8", "本文"],
    ["text-muted",         "#8597B3", "ラベル・補助"],
    ["text-dim",           "#5C6B85", "メタ"],
  ];
  return (
    <div className="ev-doc">
      <header>
        <div className="ev-doc__kicker">TOKENS</div>
        <h1>NEXUS v2 — palette & type</h1>
      </header>
      <h2>Color tokens</h2>
      <div className="ev-swatch-grid">
        {swatches.map(([name, hex, use]) => (
          <div key={name} className="ev-swatch">
            <div className="ev-swatch__chip" style={{ background: hex }} />
            <div className="font-mono text-[11px] text-[var(--color-text-bright)] mt-2">--color-{name}</div>
            <div className="font-mono text-[10px] text-[var(--color-text-muted)]">{hex}</div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1">{use}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-6">Typography</h2>
      <div className="ev-type-row">
        <div className="font-display text-[44px] text-[var(--color-text-bright)] leading-none">Sora — Display</div>
        <div className="text-[11px] font-mono text-[var(--color-text-muted)] mt-2">--font-display · 38–56px headings</div>
      </div>
      <div className="ev-type-row">
        <div className="text-[18px] text-[var(--color-text-bright)]" style={{fontFamily:"var(--font-sans)"}}>Inter + Noto Sans JP — Body 本文サンプル ABC</div>
        <div className="text-[11px] font-mono text-[var(--color-text-muted)] mt-2">--font-sans · 13–17px</div>
      </div>
      <div className="ev-type-row">
        <div className="font-mono text-[20px] text-[var(--color-charge-plasma)]">JetBrains Mono · 27.4 kWh · ¥753 · 96.5%</div>
        <div className="text-[11px] font-mono text-[var(--color-text-muted)] mt-2">--font-mono · 数字・コード・タイムスタンプ</div>
      </div>

      <h2 className="mt-6">Radii / Shadow</h2>
      <div className="grid grid-cols-3 gap-3 mt-2">
        {[["xs","4"],["sm","8"],["md","12"],["lg","16"],["xl","22"],["pill","999"]].map(([k,v]) => (
          <div key={k} className="ev-radius-demo" style={{ borderRadius: v + "px" }}>
            <span className="font-mono text-[11px] text-[var(--color-text-muted)]">--radius-{k}</span>
            <span className="font-mono text-[11px] text-[var(--color-text-bright)]">{v}px</span>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
