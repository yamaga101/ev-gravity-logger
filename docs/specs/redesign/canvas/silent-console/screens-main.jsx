// Silent Automotive Console — main screens (Today, Charge, History)

// ─────────────────────────────────────────────────────────────
// 1. TODAY — hero. 1-second judgement.
// ─────────────────────────────────────────────────────────────
function TodayScreen() {
  return (
    <AppShell nav navActive="today">
      <div style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Top: kicker + bg gps chip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <StatusLabel>Tuesday · 06 May</StatusLabel>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 8px', borderRadius: 100,
            border: '1px solid rgba(180,122,54,0.25)',
            fontSize: 9, fontWeight: 500, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#B47A36',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: 2, background: '#B47A36' }} />
            BG&nbsp;GPS · ON
          </div>
        </div>

        {/* Generous top whitespace */}
        <div style={{ height: 64 }} />

        {/* SOC hero */}
        <div>
          <StatusLabel style={{ marginBottom: 16 }}>State of Charge</StatusLabel>
          <HeroNumber value="78" unit="%" size={196} weight={200} />
        </div>

        <div style={{ height: 32 }} />

        {/* Estimated range */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>Range</StatusLabel>
            <div className="num" style={{ fontSize: 44, fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, color: '#F4F2EE' }}>
              280<span style={{ fontSize: 18, color: '#5C5752', marginLeft: 4 }}>km</span>
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(255,250,240,0.08)' }} />
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>SOH</StatusLabel>
            <div className="num" style={{ fontSize: 44, fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, color: '#F4F2EE' }}>
              96<span style={{ fontSize: 18, color: '#5C5752', marginLeft: 4 }}>%</span>
            </div>
          </div>
        </div>

        <div style={{ height: 28 }} />

        {/* Charge prediction */}
        <div style={{ fontSize: 12, color: '#A8A39B', letterSpacing: '0.01em' }}>
          次の充電 <span style={{ color: '#F4F2EE', marginLeft: 8 }}>2 日後の朝</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Last charge — single line */}
        <Card style={{ padding: '16px 20px' }}>
          <StatusLabel style={{ marginBottom: 8 }}>Last Charge</StatusLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 13, color: '#F4F2EE', minWidth: 0 }}>
              昨日 19:42 · 川場田園プラザ
            </div>
            <div className="num" style={{ fontSize: 13, color: '#E8A04A', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              ¥1,237
            </div>
          </div>
        </Card>

        <div style={{ height: 16 }} />

        {/* Ghost actions — minimal trio */}
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostButton style={{ flex: 1 }}>充電</GhostButton>
          <GhostButton style={{ flex: 1 }}>履歴</GhostButton>
          <GhostButton style={{ flex: 1 }}>車両</GhostButton>
        </div>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2a. CHARGE START — station + start SOC + target + price
// ─────────────────────────────────────────────────────────────
function ChargeStartScreen() {
  return (
    <AppShell nav navActive="charge">
      <div style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusLabel>Charge · Start</StatusLabel>
          <span style={{ fontSize: 11, color: '#5C5752' }}>Step 1 / 3</span>
        </div>

        <div style={{ height: 40 }} />

        {/* Station */}
        <StatusLabel style={{ marginBottom: 12 }}>Station</StatusLabel>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', borderBottom: '1px solid rgba(255,250,240,0.06)',
        }}>
          <div>
            <div style={{ fontSize: 16, color: '#F4F2EE', letterSpacing: '-0.005em' }}>川場田園プラザ</div>
            <div style={{ fontSize: 11, color: '#5C5752', marginTop: 4 }}>群馬県 · 50 kW · 充電器 02</div>
          </div>
          <span style={{ fontSize: 18, color: '#5C5752' }}>›</span>
        </div>

        <div style={{ height: 36 }} />

        {/* SOC start → target */}
        <StatusLabel style={{ marginBottom: 18 }}>State of Charge</StatusLabel>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: '#5C5752', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Start</div>
            <HeroNumber value="42" unit="%" size={88} unitSize={22} />
          </div>
          <div style={{
            flex: 1, height: 1, background: 'rgba(255,250,240,0.08)',
            position: 'relative', alignSelf: 'center', marginTop: 16,
          }}>
            <div style={{ position: 'absolute', right: -6, top: -3, width: 7, height: 7, background: '#E8A04A', borderRadius: 0, transform: 'rotate(45deg)' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#E8A04A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Target</div>
            <HeroNumber value="80" unit="%" size={88} unitSize={22} color="#E8A04A" />
          </div>
        </div>

        {/* Slider mock */}
        <div style={{ marginTop: 22, height: 2, background: 'rgba(255,250,240,0.08)', borderRadius: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '42%', right: '20%', top: 0, height: '100%', background: '#E8A04A' }} />
          <div style={{ position: 'absolute', left: '80%', top: -7, width: 16, height: 16, borderRadius: 8, background: '#E8A04A', transform: 'translateX(-50%)' }} />
        </div>

        <div style={{ height: 36 }} />

        {/* Estimated price */}
        <Card style={{ padding: '20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <StatusLabel style={{ marginBottom: 6 }}>Estimated</StatusLabel>
              <div style={{ fontSize: 11, color: '#A8A39B' }}>15.2 kWh · ~ 22 min</div>
            </div>
            <div className="num" style={{ fontSize: 28, fontWeight: 200, color: '#F4F2EE', letterSpacing: '-0.02em' }}>¥912</div>
          </div>
        </Card>

        <div style={{ flex: 1 }} />

        <PrimaryButton>Start Charge</PrimaryButton>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2b. CHARGE LIVE — running session
// ─────────────────────────────────────────────────────────────
function ChargeLiveScreen() {
  return (
    <AppShell nav navActive="charge">
      <div style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AccentChip>Charging</AccentChip>
          <span className="num" style={{ fontSize: 11, color: '#5C5752', fontVariantNumeric: 'tabular-nums' }}>14:22 · 川場田園プラザ</span>
        </div>

        <div style={{ height: 56 }} />

        {/* Live SOC */}
        <StatusLabel style={{ marginBottom: 14 }}>Now</StatusLabel>
        <HeroNumber value="63" unit="%" size={180} weight={200} />

        <div style={{ height: 24 }} />

        {/* Progress line */}
        <div style={{ height: 2, background: 'rgba(255,250,240,0.06)', borderRadius: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '63%', background: '#E8A04A' }} />
          <div style={{ position: 'absolute', left: '80%', top: -3, width: 8, height: 8, borderRadius: 4,
            border: '1px solid rgba(232,160,74,0.5)', background: '#000', transform: 'translateX(-50%)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 10, color: '#5C5752', letterSpacing: '0.16em' }}>42%</span>
          <span style={{ fontSize: 10, color: '#E8A04A', letterSpacing: '0.16em' }}>TARGET 80%</span>
        </div>

        <div style={{ height: 40 }} />

        {/* 3 cluster numerics */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>Elapsed</StatusLabel>
            <div className="num" style={{ fontSize: 32, fontWeight: 200, color: '#F4F2EE', letterSpacing: '-0.02em' }}>
              12<span style={{ fontSize: 14, color: '#5C5752', marginLeft: 2 }}>m</span> 04<span style={{ fontSize: 14, color: '#5C5752', marginLeft: 2 }}>s</span>
            </div>
          </div>
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>Remaining</StatusLabel>
            <div className="num" style={{ fontSize: 32, fontWeight: 200, color: '#F4F2EE', letterSpacing: '-0.02em' }}>
              ~10<span style={{ fontSize: 14, color: '#5C5752', marginLeft: 2 }}>m</span>
            </div>
          </div>
          <div>
            <StatusLabel style={{ marginBottom: 8 }}>Power</StatusLabel>
            <div className="num" style={{ fontSize: 32, fontWeight: 200, color: '#E8A04A', letterSpacing: '-0.02em' }}>
              48<span style={{ fontSize: 14, color: '#5C5752', marginLeft: 2 }}>kW</span>
            </div>
          </div>
        </div>

        <div style={{ height: 32 }} />

        <Card style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 11, color: '#A8A39B' }}>Est. cost so far</span>
            <span className="num" style={{ fontSize: 18, fontWeight: 300, color: '#F4F2EE' }}>¥538</span>
          </div>
        </Card>

        <div style={{ flex: 1 }} />

        <GhostButton style={{ height: 48, width: '100%' }}>Stop Charge</GhostButton>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2c. CHARGE DONE — completion summary
// ─────────────────────────────────────────────────────────────
function ChargeDoneScreen() {
  return (
    <AppShell nav navActive="charge">
      <div style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>

        <StatusLabel>Charge · Complete</StatusLabel>

        <div style={{ height: 56 }} />

        {/* Delta */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className="num" style={{ fontSize: 28, color: '#5C5752', fontWeight: 200 }}>42%</span>
          <span style={{ fontSize: 16, color: '#5C5752' }}>→</span>
          <HeroNumber value="80" unit="%" size={120} weight={200} color="#F4F2EE" unitSize={28} />
        </div>

        <div style={{ height: 8 }} />
        <div className="num" style={{ fontSize: 13, color: '#E8A04A', letterSpacing: '0.04em' }}>
          + 38 % · 16.4 kWh
        </div>

        <div style={{ height: 48 }} />

        {/* Stats */}
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid rgba(255,250,240,0.04)' }}>
          <span style={{ fontSize: 13, color: '#A8A39B' }}>Duration</span>
          <span className="num" style={{ fontSize: 13, color: '#F4F2EE' }}>22m 14s</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid rgba(255,250,240,0.04)' }}>
          <span style={{ fontSize: 13, color: '#A8A39B' }}>Avg. Power</span>
          <span className="num" style={{ fontSize: 13, color: '#F4F2EE' }}>44.2 kW</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid rgba(255,250,240,0.04)' }}>
          <span style={{ fontSize: 13, color: '#A8A39B' }}>Efficiency</span>
          <span className="num" style={{ fontSize: 13, color: '#F4F2EE' }}>5.8 km/kWh</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0' }}>
          <span style={{ fontSize: 13, color: '#A8A39B' }}>Cost</span>
          <span className="num" style={{ fontSize: 13, color: '#E8A04A', fontWeight: 500 }}>¥984</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <GhostButton style={{ flex: 1 }}>履歴で見る</GhostButton>
          <PrimaryButton style={{ flex: 1 }}>Done</PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. HISTORY — timeline
// ─────────────────────────────────────────────────────────────
function HistoryScreen() {
  const may = [
    { d: '06', day: 'Tue', loc: '川場田園プラザ',  delta: '+38%',  cost: '¥984' },
    { d: '04', day: 'Sun', loc: '道の駅 みなかみ',  delta: '+22%',  cost: '¥541' },
    { d: '01', day: 'Thu', loc: '自宅 (200V)',      delta: '+45%',  cost: '¥612' },
  ];
  const apr = [
    { d: '28', day: 'Mon', loc: '湯沢 IC SA',       delta: '+30%',  cost: '¥720' },
    { d: '23', day: 'Wed', loc: '川場田園プラザ',   delta: '+34%',  cost: '¥876' },
    { d: '19', day: 'Sat', loc: '自宅 (200V)',      delta: '+50%',  cost: '¥680' },
    { d: '14', day: 'Mon', loc: '高崎 SA',          delta: '+18%',  cost: '¥412' },
    { d: '08', day: 'Tue', loc: '自宅 (200V)',      delta: '+42%',  cost: '¥570' },
  ];

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
        <HeroNumber value="42" unit="sessions" size={56} unitSize={13} weight={200} />
        <div style={{ height: 8 }} />
        <div className="num" style={{ fontSize: 12, color: '#5C5752' }}>last 90 days · ¥34,210 total</div>
      </div>
      <div style={{ height: 24 }} />
      <Section month="May"   year="2026" total="¥2,137" count="3 sessions" items={may} />
      <Section month="April" year="2026" total="¥3,258" count="5 sessions" items={apr} />
    </AppShell>
  );
}

Object.assign(window, { TodayScreen, ChargeStartScreen, ChargeLiveScreen, ChargeDoneScreen, HistoryScreen });
