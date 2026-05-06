// @ts-nocheck
// Silent Automotive Console — primitives (Pro Bridge L4 採択 v5.0.0、2026-05-06)
// HeroNumber, AccentChip, GhostButton, PrimaryButton, Card, StatusLabel,
// MicroChart, BottomNav, AppShell, S25Frame.

import React from "react";
const { useState, useMemo, useEffect, useRef, useContext } = React;

// NavContext — SilentApp が provide、BottomNav / GhostButton 等が consume。
// 値は (key: string) => void で navigate(navKey) を呼ぶ
const NavContext = React.createContext(null);

// ─────────────────────────────────────────────────────────────
// S25Frame — minimal Android frame, pure black, edge-to-edge
// transparent status bar. Replaces AndroidDevice for our aesthetic.
// ─────────────────────────────────────────────────────────────
function S25Frame({ children, width = 412, height = 892, time = '9:41', battery = 84 }) {
  return (
    <div
      style={{
        width, height,
        borderRadius: 36,
        overflow: 'hidden',
        background: '#000',
        border: '1px solid rgba(255,250,240,0.10)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.02) inset',
        position: 'relative',
        fontFamily: "'Inter', 'Zen Kaku Gothic Antique', sans-serif",
        color: '#F4F2EE',
      }}
      className="silent-app"
    >
      {/* Edge-to-edge content (status bar overlay drawn last, on top) */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {/* Status bar — transparent, sits over content */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          fontSize: 13, fontWeight: 500,
          color: '#F4F2EE',
          letterSpacing: 0.1,
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
        {/* center punch-hole */}
        <div style={{
          position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)',
          width: 12, height: 12, borderRadius: 12, background: '#000',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* signal */}
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
            <rect x="0" y="8" width="3" height="3" rx="0.5" fill="#F4F2EE"/>
            <rect x="4.5" y="6" width="3" height="5" rx="0.5" fill="#F4F2EE"/>
            <rect x="9" y="3" width="3" height="8" rx="0.5" fill="#F4F2EE"/>
            <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="#F4F2EE" opacity="0.4"/>
          </svg>
          {/* wifi */}
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
            <path d="M7.5 2C4.5 2 2 3.3 0 5l1.5 1.5C3 5.3 5.1 4.5 7.5 4.5S12 5.3 13.5 6.5L15 5C13 3.3 10.5 2 7.5 2z" fill="#F4F2EE"/>
            <path d="M7.5 6C5.8 6 4.4 6.7 3 7.5L4.5 9c.9-.6 1.9-1 3-1s2.1.4 3 1L12 7.5C10.6 6.7 9.2 6 7.5 6z" fill="#F4F2EE"/>
          </svg>
          {/* battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 500, marginRight: 3, opacity: 0.9 }} className="num">{battery}</span>
            <div style={{
              width: 22, height: 11, borderRadius: 3,
              border: '1px solid rgba(244,242,238,0.5)',
              padding: 1, position: 'relative',
            }}>
              <div style={{ width: `${battery}%`, height: '100%', background: '#F4F2EE', borderRadius: 1 }} />
            </div>
            <div style={{ width: 1.5, height: 4, background: 'rgba(244,242,238,0.5)', borderRadius: '0 1px 1px 0' }} />
          </div>
        </div>
      </div>

      {/* Gesture nav handle */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 108, height: 4, borderRadius: 2,
        background: 'rgba(244,242,238,0.5)',
        zIndex: 50,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AppShell — content area + bottom nav. Reserves space for status bar
// (top safe area) and gesture nav (bottom safe area). children render
// inside a scrollable region.
// ─────────────────────────────────────────────────────────────
function AppShell({ children, nav, navActive }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Top safe area (status bar overlay sits here) */}
      <div style={{ height: 36, flexShrink: 0 }} />
      <div className="silent-scroll" style={{ flex: 1, position: 'relative' }}>
        {children}
      </div>
      {nav && <BottomNav active={navActive} />}
      {/* Bottom safe area for gesture handle */}
      <div style={{ height: 24, flexShrink: 0, background: '#000' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HeroNumber — the keystone primitive. Tabular, ultralight, big.
// ─────────────────────────────────────────────────────────────
function HeroNumber({ value, unit, size = 200, weight = 200, color = '#F4F2EE', unitSize, style = {} }) {
  return (
    <div
      className="num"
      style={{
        fontSize: size,
        fontWeight: weight,
        lineHeight: 0.9,
        letterSpacing: '-0.04em',
        color,
        fontVariantNumeric: 'tabular-nums',
        display: 'flex',
        alignItems: 'baseline',
        gap: size * 0.04,
        ...style,
      }}
    >
      <span>{value}</span>
      {unit && (
        <span style={{
          fontSize: unitSize ?? size * 0.22,
          fontWeight: 300,
          color: 'var(--text-tertiary)',
          letterSpacing: '-0.01em',
        }}>{unit}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatusLabel — kicker. Sparse uppercase. Tertiary text.
// ─────────────────────────────────────────────────────────────
function StatusLabel({ children, accent = false, style = {} }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.20em',
      textTransform: 'uppercase',
      color: accent ? '#E8A04A' : '#5C5752',
      ...style,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// AccentChip — small amber pill, sparse uppercase micro text.
// ─────────────────────────────────────────────────────────────
function AccentChip({ children, dot = true, style = {} }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 100,
      border: '1px solid rgba(232,160,74,0.30)',
      background: 'rgba(232,160,74,0.08)',
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.20em',
      textTransform: 'uppercase',
      color: '#E8A04A',
      ...style,
    }}>
      {dot && <span style={{ width: 4, height: 4, borderRadius: 2, background: '#E8A04A' }} />}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GhostButton — border 1px @ 12% alpha, fill 6% on tap.
// ─────────────────────────────────────────────────────────────
function GhostButton({ children, onClick, style = {}, height = 44 }) {
  const [down, setDown] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      style={{
        height,
        padding: '0 18px',
        borderRadius: 12,
        border: '1px solid rgba(255,250,240,0.12)',
        background: down ? 'rgba(255,250,240,0.06)' : 'transparent',
        color: '#F4F2EE',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '-0.005em',
        cursor: 'pointer',
        transition: 'background 120ms cubic-bezier(0.22,1,0.36,1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
    >{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// PrimaryButton — amber fill, black text, 48dp.
// ─────────────────────────────────────────────────────────────
function PrimaryButton({ children, onClick, style = {} }) {
  const [down, setDown] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      style={{
        height: 48,
        padding: '0 24px',
        borderRadius: 12,
        border: 'none',
        background: '#E8A04A',
        color: '#000',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '-0.005em',
        cursor: 'pointer',
        transform: down ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms cubic-bezier(0.22,1,0.36,1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        ...style,
      }}
    >{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// Card — 1px @ 6% alpha border, no fill, padding 24px.
// ─────────────────────────────────────────────────────────────
function Card({ children, style = {}, padding = 24 }) {
  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid rgba(255,250,240,0.06)',
      padding,
      ...style,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// MicroChart — sparkline. stroke 1.5px, no fill area, optional dots.
// data: array of numbers. width/height in px.
// ─────────────────────────────────────────────────────────────
function MicroChart({ data = [], width = 280, height = 60, color = '#F4F2EE', accent, fill = false, dots = false }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y];
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={`mcfg-${data.length}-${data[0]}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent || color} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={accent || color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#mcfg-${data.length}-${data[0]})`} />
        </>
      )}
      <path d={d} fill="none" stroke={accent || color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {dots && pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 2.5 : 0} fill={accent || color} />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// BottomNav — 5 tab, glass blur, 1px top border, amber active line.
// ─────────────────────────────────────────────────────────────
function BottomNav({ active = 'today' }) {
  const navigate = useContext(NavContext);
  const tabs = [
    { id: 'today',    label: 'Today',    icon: NavIcons.today    },
    { id: 'charge',   label: 'Charge',   icon: NavIcons.charge   },
    { id: 'history',  label: 'History',  icon: NavIcons.history  },
    { id: 'stats',    label: 'Stats',    icon: NavIcons.stats    },
    { id: 'vehicle',  label: 'Vehicle',  icon: NavIcons.vehicle  },
    { id: 'settings', label: 'Settings', icon: NavIcons.settings },
  ];
  return (
    <div style={{
      flexShrink: 0,
      position: 'relative',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      background: 'rgba(0,0,0,0.75)',
      borderTop: '1px solid rgba(255,250,240,0.06)',
      display: 'flex',
      height: 64,
    }}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        const c = isActive ? '#E8A04A' : '#5C5752';
        const Icon = t.icon;
        return (
          <div key={t.id}
            onClick={() => navigate && navigate(t.id)}
            style={{
              flex: 1, position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, cursor: 'pointer',
            }}>
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 28, height: 2, background: '#E8A04A',
              }} />
            )}
            <Icon size={22} color={c} />
            <span style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: c,
            }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Minimal stroked icons — 1.5px stroke
const NavIcons = {
  today: ({ size = 22, color = '#5C5752' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="2.5" fill={color}/>
    </svg>
  ),
  charge: ({ size = 22, color = '#5C5752' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>
    </svg>
  ),
  history: ({ size = 22, color = '#5C5752' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="7" x2="21" y2="7"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="17" x2="14" y2="17"/>
    </svg>
  ),
  stats: ({ size = 22, color = '#5C5752' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-9"/>
    </svg>
  ),
  vehicle: ({ size = 22, color = '#5C5752' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 16h14M6 16l1.5-5h9L18 16M7.5 11l1-3h7l1 3M7 19v-3M17 19v-3"/>
      <circle cx="8" cy="16" r="1.4" fill={color}/>
      <circle cx="16" cy="16" r="1.4" fill={color}/>
    </svg>
  ),
  settings: ({ size = 22, color = '#5C5752' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Divider — single 1px line @ 4% alpha
// ─────────────────────────────────────────────────────────────
function Divider({ style = {} }) {
  return <div style={{ height: 1, background: 'rgba(255,250,240,0.04)', ...style }} />;
}

// ─────────────────────────────────────────────────────────────
// Row — list item, 56dp height, border-bottom 1px @ 4%
// ─────────────────────────────────────────────────────────────
function Row({ label, value, sub, onClick, style = {}, last = false, accent = false }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center',
      minHeight: 56,
      padding: '0 24px',
      borderBottom: last ? 'none' : '1px solid rgba(255,250,240,0.04)',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: '#F4F2EE', fontWeight: 400, letterSpacing: '-0.005em' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#5C5752', marginTop: 2, letterSpacing: '0.02em' }}>{sub}</div>}
      </div>
      {value !== undefined && (
        <div className="num" style={{
          fontSize: 13,
          color: accent ? '#E8A04A' : '#A8A39B',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 400,
        }}>{value}</div>
      )}
    </div>
  );
}

export {
  NavContext,
  S25Frame, AppShell,
  HeroNumber, StatusLabel, AccentChip,
  GhostButton, PrimaryButton, Card, MicroChart, BottomNav, Divider, Row,
  NavIcons,
};
