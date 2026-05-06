// Silent Automotive Console — sub screens (Stats, Vehicle, Settings, Icon)

// ─────────────────────────────────────────────────────────────
// 4. STATS —疎密対比. Hero clusters + sparklines.
// ─────────────────────────────────────────────────────────────
function StatsScreen() {
  const costTrend = [12, 18, 14, 22, 19, 25, 23, 28, 24, 31, 27, 34];
  const sohTrend  = [99.4, 99.1, 98.8, 98.5, 98.0, 97.7, 97.4, 97.1, 96.8, 96.5, 96.2, 96.0];
  const freqTrend = [3, 4, 2, 5, 4, 3, 6, 5, 4, 5, 7, 5];

  const Mini = ({ label, value, unit, data, accent = false, fill = false, w = 312 }) => (
    <div style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,250,240,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <StatusLabel>{label}</StatusLabel>
        <div className="num" style={{ fontSize: 18, fontWeight: 300, color: accent ? '#E8A04A' : '#F4F2EE' }}>
          {value}<span style={{ fontSize: 10, color: '#5C5752', marginLeft: 4, letterSpacing: '0.10em' }}>{unit}</span>
        </div>
      </div>
      <MicroChart data={data} width={w} height={48} color="#F4F2EE" accent={accent ? '#E8A04A' : undefined} fill={fill} dots />
    </div>
  );

  return (
    <AppShell nav navActive="stats">
      <div style={{ padding: '24px 24px 0' }}>
        <StatusLabel>Stats · 90 days</StatusLabel>

        <div style={{ height: 40 }} />

        {/* Three hero cluster — total cost / km / efficiency */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: '#5C5752', letterSpacing: '0.20em', textTransform: 'uppercase', marginBottom: 6 }}>Cost</div>
            <HeroNumber value="34,210" unit="¥" size={36} unitSize={11} weight={200} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#5C5752', letterSpacing: '0.20em', textTransform: 'uppercase', marginBottom: 6 }}>Driven</div>
            <HeroNumber value="2,847" unit="km" size={36} unitSize={11} weight={200} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#E8A04A', letterSpacing: '0.20em', textTransform: 'uppercase', marginBottom: 6 }}>Avg.</div>
            <HeroNumber value="6.1" unit="km/kWh" size={36} unitSize={11} weight={200} color="#E8A04A" />
          </div>
        </div>

        <div style={{ height: 32 }} />

        <Divider />
        <Mini label="Cost trend / month"      value="¥3,420"  unit="avg"  data={costTrend} fill />
        <Mini label="State of health"          value="96.0"    unit="%"    data={sohTrend} accent />
        <Mini label="Charge frequency"          value="4.5"     unit="/wk"  data={freqTrend} />

        <div style={{ height: 24 }} />
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. VEHICLE — photo + meta + tabbed sub
// ─────────────────────────────────────────────────────────────
function VehicleScreen() {
  return (
    <AppShell nav navActive="vehicle">
      <div>
        {/* Image placeholder — full bleed */}
        <div style={{
          height: 220, position: 'relative',
          background: '#0A0A0A',
          borderBottom: '1px solid rgba(255,250,240,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* subtle stripe placeholder */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,250,240,0.025) 0 1px, transparent 1px 12px)',
          }}/>
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.20em',
            color: '#3A3633',
            textTransform: 'uppercase',
          }}>
            [ vehicle photo · 412 × 220 ]
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <StatusLabel>Vehicle</StatusLabel>
          <div style={{ height: 12 }} />
          <div style={{ fontSize: 26, fontWeight: 300, color: '#F4F2EE', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Nissan Leaf e+
          </div>
          <div style={{ fontSize: 12, color: '#5C5752', marginTop: 6, letterSpacing: '0.04em' }}>
            群馬 530 や 12-34 · Y101
          </div>

          <div style={{ height: 32 }} />

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(255,250,240,0.06)', marginBottom: 4 }}>
            {[
              { l: 'Overview', a: true },
              { l: 'Maint.',   a: false },
              { l: 'Tax',      a: false },
              { l: 'Insurance',a: false },
            ].map((t, i) => (
              <div key={i} style={{
                padding: '12px 0',
                fontSize: 12, fontWeight: 500,
                color: t.a ? '#F4F2EE' : '#5C5752',
                borderBottom: t.a ? '1px solid #E8A04A' : 'none',
                marginBottom: -1,
                letterSpacing: '0.02em',
              }}>{t.l}</div>
            ))}
          </div>

          <div style={{ height: 8 }} />

          {/* Spec rows */}
          <Row label="Odometer"     value="48,217 km" />
          <Row label="Battery SOH"  value="96.0 %" accent />
          <Row label="Capacity"     value="62 kWh" />
          <Row label="Purchased"    value="2022.04.18" />
          <Row label="Next Inspection" value="2026.04.18" sub="あと 348 日" />
          <Row label="Warranty"     value="160,000 km / 8 yr" last />

          <div style={{ height: 24 }} />

          {/* Mini stat */}
          <Card style={{ padding: '16px 20px' }}>
            <StatusLabel style={{ marginBottom: 10 }}>SOH · 24 months</StatusLabel>
            <MicroChart
              data={[100, 99.6, 99.2, 98.7, 98.3, 97.9, 97.5, 97.2, 96.8, 96.5, 96.2, 96.0]}
              width={320} height={48} accent="#E8A04A" fill dots
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. SETTINGS — quiet vertical list
// ─────────────────────────────────────────────────────────────
function SettingsScreen() {
  const SectionHead = ({ children }) => (
    <div style={{ padding: '32px 24px 12px' }}>
      <StatusLabel>{children}</StatusLabel>
    </div>
  );
  const Item = ({ label, value, sub, last = false }) => (
    <div style={{
      display: 'flex', alignItems: 'center',
      minHeight: 56, padding: '0 24px',
      borderBottom: last ? 'none' : '1px solid rgba(255,250,240,0.04)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: '#F4F2EE' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#5C5752', marginTop: 2 }}>{sub}</div>}
      </div>
      {value && <div style={{ fontSize: 12, color: '#A8A39B' }}>{value}</div>}
      <span style={{ fontSize: 16, color: '#3A3633', marginLeft: 12 }}>›</span>
    </div>
  );

  return (
    <AppShell nav navActive="vehicle">
      <div style={{ padding: '24px 24px 0' }}>
        <StatusLabel>Settings</StatusLabel>
      </div>

      <SectionHead>Vehicle</SectionHead>
      <Item label="車両情報"       value="Leaf e+" />
      <Item label="走行距離 補正" value="48,217 km" />
      <Item label="バッテリー設定" sub="62 kWh · 96% SOH" last />

      <SectionHead>Sync</SectionHead>
      <Item label="GAS sync"       value="ON" sub="last: 2 min ago" />
      <Item label="Drive backup"   value="ON" sub="weekly · sun 03:00" last />

      <SectionHead>Notifications</SectionHead>
      <Item label="充電完了"        value="通知" />
      <Item label="低 SOC 警告"     value="20%" />
      <Item label="点検予定"        value="14 日前" last />

      <SectionHead>Data</SectionHead>
      <Item label="エクスポート" />
      <Item label="リセット" sub="すべての履歴と設定を削除" last />

      <SectionHead>About</SectionHead>
      <Item label="プライバシー" />
      <Item label="ライセンス" last />

      {/* Version stamp at the bottom */}
      <div style={{ padding: '40px 24px 32px', textAlign: 'center' }}>
        <div className="num" style={{ fontSize: 11, color: '#3A3633', letterSpacing: '0.20em' }}>
          EV MANAGER · v 5.0.0
        </div>
        <div style={{ fontSize: 10, color: '#3A3633', letterSpacing: '0.20em', marginTop: 6 }}>
          YAMAGA101 · CARVE-OUT
        </div>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. APP ICON — single amber dot, pure black bg.
// Three variants: foreground, themed mono, in-context.
// ─────────────────────────────────────────────────────────────
function AppIconArtboard() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0A0A0A',
      padding: 32,
      display: 'flex', flexDirection: 'column', gap: 24,
      fontFamily: 'Inter, sans-serif', color: '#F4F2EE',
    }}>
      <div>
        <StatusLabel>App Icon</StatusLabel>
        <div style={{ height: 8 }} />
        <div style={{ fontSize: 18, fontWeight: 300, letterSpacing: '-0.01em' }}>Calm Dot</div>
        <div style={{ fontSize: 11, color: '#5C5752', marginTop: 6 }}>
          Single amber circle · 24dp radius / 108dp canvas
        </div>
      </div>

      {/* Three icons in a row */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-around', marginTop: 8 }}>
        {/* primary */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 108, height: 108, borderRadius: 24,
            background: '#000',
            border: '1px solid rgba(255,250,240,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: '#E8A04A' }} />
          </div>
          <div style={{ fontSize: 9, color: '#5C5752', letterSpacing: '0.20em', marginTop: 12, textTransform: 'uppercase' }}>Primary</div>
        </div>

        {/* themed (monochrome) */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 108, height: 108, borderRadius: 24,
            background: '#262626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, border: '1.5px solid #F4F2EE', background: 'transparent' }} />
          </div>
          <div style={{ fontSize: 9, color: '#5C5752', letterSpacing: '0.20em', marginTop: 12, textTransform: 'uppercase' }}>Themed</div>
        </div>

        {/* round mask */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 108, height: 108, borderRadius: 54,
            background: '#000',
            border: '1px solid rgba(255,250,240,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: '#E8A04A' }} />
          </div>
          <div style={{ fontSize: 9, color: '#5C5752', letterSpacing: '0.20em', marginTop: 12, textTransform: 'uppercase' }}>Round</div>
        </div>
      </div>

      {/* size scale */}
      <div style={{ marginTop: 8 }}>
        <StatusLabel>Scale</StatusLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 16 }}>
          {[64, 48, 32, 24, 16].map(s => (
            <div key={s} style={{
              width: s, height: s, borderRadius: s * 0.22,
              background: '#000',
              border: '1px solid rgba(255,250,240,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{ width: s * 0.30, height: s * 0.30, borderRadius: '50%', background: '#E8A04A' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,250,240,0.04)' }}>
        <div style={{ fontSize: 10, color: '#5C5752', lineHeight: 1.7, letterSpacing: '0.02em' }}>
          · No glyph, no bolt, no glow<br/>
          · Black canvas · single amber dot<br/>
          · Themed icon: white outline only
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StatsScreen, VehicleScreen, SettingsScreen, AppIconArtboard });
