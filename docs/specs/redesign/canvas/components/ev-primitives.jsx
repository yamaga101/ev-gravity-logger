/* ============================================================
   EV Manager — Shared UI primitives
   Mirrors src/components/ui/* in the actual codebase.
   ============================================================ */

const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Phone shell ---------- */
function PhoneShell({ children, label, w = 412, h = 915, statusBar = "dark", note }) {
  return (
    <div className="ev-phone-shell" style={{ width: w, height: h }}>
      <div className="ev-phone-screen">
        <PhoneStatusBar variant={statusBar} />
        {children}
      </div>
      {note ? <div className="ev-phone-note">{note}</div> : null}
    </div>
  );
}

function PhoneStatusBar({ variant = "dark", time = "9:41" }) {
  return (
    <div className={`ev-statusbar ${variant === "light" ? "is-light" : ""}`}>
      <span className="ev-statusbar__time">{time}</span>
      <div className="ev-statusbar__notch" />
      <span className="ev-statusbar__icons">
        <SignalGlyph />
        <WifiGlyph />
        <BatteryGlyph />
      </span>
    </div>
  );
}

const SignalGlyph = () => (
  <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
    <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="currentColor"/>
    <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="currentColor"/>
    <rect x="7" y="3" width="2.5" height="7" rx="0.5" fill="currentColor"/>
    <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="currentColor"/>
  </svg>
);
const WifiGlyph = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
    <path d="M7 9.5a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
    <path d="M2 4.5a7 7 0 0110 0M4 6.5a4 4 0 016 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
  </svg>
);
const BatteryGlyph = () => (
  <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
    <rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" fill="none"/>
    <rect x="2" y="2" width="13" height="6" rx="1" fill="currentColor"/>
    <rect x="20" y="3" width="1.5" height="4" rx="0.5" fill="currentColor"/>
  </svg>
);

/* ---------- Background atmosphere ---------- */
function NexusBg({ withOrbs = true }) {
  return (
    <>
      <div className="nexus-grid-bg" />
      {withOrbs && (
        <>
          <div className="nexus-orb nexus-orb--cyan" />
          <div className="nexus-orb nexus-orb--violet" />
        </>
      )}
    </>
  );
}

/* ---------- Reminder banner (global top) ---------- */
function ReminderBanner({ kind = "warning", icon = "!", title, meta, onDismiss }) {
  const tone = kind === "danger" ? "is-danger" : kind === "info" ? "is-info" : "is-warning";
  return (
    <div className={`ev-reminder ${tone}`}>
      <span className="ev-reminder__icon">{icon}</span>
      <div className="ev-reminder__text">
        <div className="ev-reminder__title">{title}</div>
        {meta && <div className="ev-reminder__meta">{meta}</div>}
      </div>
      <button className="ev-reminder__close" onClick={onDismiss} aria-label="閉じる">×</button>
    </div>
  );
}

/* ---------- App header (per-screen) ---------- */
function AppHeader({ title, subtitle, right, kicker }) {
  return (
    <header className="ev-header">
      <div>
        {kicker && <div className="ev-header__kicker">{kicker}</div>}
        <h1 className="ev-header__title">{title}</h1>
        {subtitle && <div className="ev-header__sub">{subtitle}</div>}
      </div>
      {right && <div className="ev-header__right">{right}</div>}
    </header>
  );
}

/* ---------- Bottom navigation ---------- */
const NAV_ICONS = {
  charge: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  stats: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  car: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M4 14l1.5-5a2 2 0 012-1.5h9a2 2 0 012 1.5L20 14M3 14h18v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-4z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="7" cy="16.5" r="1" fill="currentColor"/>
      <circle cx="17" cy="16.5" r="1" fill="currentColor"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2l-2.4-.9-2 3.5 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
};

function BottomNav({ active = "charge" }) {
  const tabs = [
    { id: "charge",   label: "充電" },
    { id: "history",  label: "履歴" },
    { id: "stats",    label: "統計" },
    { id: "car",      label: "車両" },
    { id: "settings", label: "設定" },
  ];
  return (
    <nav className="ev-bottomnav">
      <div className="ev-bottomnav__rail">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button key={t.id} className={`ev-tab ${on ? "is-active" : ""}`}>
              <span className="ev-tab__icon">{NAV_ICONS[t.id]}</span>
              <span className="ev-tab__label">{t.label}</span>
              {on && <span className="ev-tab__dot" />}
            </button>
          );
        })}
      </div>
      <div className="ev-bottomnav__safe" />
    </nav>
  );
}

/* ---------- Progress ring ---------- */
function ProgressRing({ value = 0, size = 200, stroke = 10, color = "var(--color-signal-cyan)", trackColor = "rgba(140,170,220,0.10)", label, sublabel, glow = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className="ev-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ filter: glow ? `drop-shadow(0 0 14px ${color}66)` : "none" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none"/>
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out-quint)" }}
        />
      </svg>
      <div className="ev-ring__inner">
        {label && <div className="ev-ring__value">{label}</div>}
        {sublabel && <div className="ev-ring__sub">{sublabel}</div>}
      </div>
    </div>
  );
}

/* ---------- Glass panel ---------- */
function Panel({ children, className = "", as: Tag = "div", interactive = false, glow = false, ...rest }) {
  return (
    <Tag className={`ev-panel ${interactive ? "is-interactive" : ""} ${glow ? "has-glow" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------- Stat tile ---------- */
function StatTile({ label, value, unit, delta, tone = "default", glyph }) {
  return (
    <Panel className={`ev-stat-tile tone-${tone}`}>
      <div className="ev-stat-tile__head">
        <span className="ev-stat-tile__label">{label}</span>
        {glyph && <span className="ev-stat-tile__glyph">{glyph}</span>}
      </div>
      <div className="ev-stat-tile__value">
        <span className="ev-stat-tile__num">{value}</span>
        {unit && <span className="ev-stat-tile__unit">{unit}</span>}
      </div>
      {delta && <div className={`ev-stat-tile__delta ${delta.startsWith("-") ? "is-down" : "is-up"}`}>{delta}</div>}
    </Panel>
  );
}

/* ---------- Pill / chip ---------- */
function Chip({ children, tone = "default", solid = false }) {
  return <span className={`ev-chip tone-${tone} ${solid ? "is-solid" : ""}`}>{children}</span>;
}

/* ---------- Big primary CTA ---------- */
function PrimaryCTA({ children, tone = "cyan", glyph, sub }) {
  return (
    <button className={`ev-cta ev-cta--${tone}`}>
      {glyph && <span className="ev-cta__glyph">{glyph}</span>}
      <span className="ev-cta__label">{children}</span>
      {sub && <span className="ev-cta__sub">{sub}</span>}
    </button>
  );
}

/* ---------- Toast (rendered as decoration) ---------- */
function Toast({ kind = "ok", title, body }) {
  return (
    <div className={`ev-toast tone-${kind}`}>
      <div className="ev-toast__bar" />
      <div className="ev-toast__body">
        <div className="ev-toast__title">{title}</div>
        {body && <div className="ev-toast__sub">{body}</div>}
      </div>
    </div>
  );
}

/* ---------- Sparkline / line chart (simple) ---------- */
function MiniChart({ data, w = 320, h = 120, color = "var(--color-signal-cyan)", area = true }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - 8 - ((v - min) / range) * (h - 20)]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const fill = area ? `${d} L${w} ${h} L0 ${h} Z` : "";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color.replace(/[^a-z0-9]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {area && <path d={fill} fill={`url(#g-${color.replace(/[^a-z0-9]/gi,"")})`}/>}
      <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}/>
      {pts.slice(-1).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={color}/>
      ))}
    </svg>
  );
}

/* ---------- Bar chart ---------- */
function BarChart({ data, labels, w = 320, h = 140, color = "var(--color-signal-cyan)" }) {
  const max = Math.max(...data);
  const bw = w / data.length - 6;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = (v / max) * (h - 24);
        const x = i * (bw + 6) + 3;
        const y = h - bh - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="3"
                  fill={color} opacity={0.85}
                  style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}/>
            <text x={x + bw/2} y={h - 3} textAnchor="middle"
                  fill="var(--color-text-dim)" fontSize="9" fontFamily="var(--font-mono)">
              {labels?.[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Form field ---------- */
function Field({ label, value, unit, focused = false, hint }) {
  return (
    <label className={`ev-field ${focused ? "is-focused" : ""}`}>
      <span className="ev-field__label">{label}</span>
      <span className="ev-field__row">
        <span className="ev-field__value">{value}</span>
        {unit && <span className="ev-field__unit">{unit}</span>}
      </span>
      {hint && <span className="ev-field__hint">{hint}</span>}
    </label>
  );
}

/* ---------- Foreground service tag ---------- */
function FgServiceTag() {
  return (
    <div className="ev-fg-tag">
      <span className="ev-fg-tag__pulse" />
      <span>BG GPS 記録中 · 通知バー常駐</span>
    </div>
  );
}

/* ---------- Section title ---------- */
function SectionTitle({ children, action }) {
  return (
    <div className="ev-section-title">
      <span>{children}</span>
      {action && <span className="ev-section-title__action">{action}</span>}
    </div>
  );
}

Object.assign(window, {
  PhoneShell, PhoneStatusBar, NexusBg, ReminderBanner, AppHeader,
  BottomNav, ProgressRing, Panel, StatTile, Chip, PrimaryCTA,
  Toast, MiniChart, BarChart, Field, FgServiceTag, SectionTitle,
});
