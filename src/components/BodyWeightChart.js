import { useState } from 'react'
import { KG_TO_LB, isLbs, locale, t, wUnit } from '../i18n'

// Body weight over time. Daily weight swings by 1–2 kg (water, food), so besides the raw points
// the chart draws a 7-day rolling average. The summary shows the actual weigh-ins.
const PERIODS = [{ id: '1M', label: '1 мес', months: 1 }, { id: '3M', label: '3 мес', months: 3 }, { id: 'ALL', label: 'Всё' }]
const DAY = 86400000
const ts = (d) => new Date(d + 'T12:00:00').getTime()
const fmt = (v) => (Math.round(v * 10) / 10).toString()

export function rollingAverage(entries, days = 7) {
  return entries.map((e, i) => {
    const end = ts(e.measured_on)
    const win = entries.slice(0, i + 1).filter(x => end - ts(x.measured_on) < days * DAY)
    return win.reduce((s, x) => s + Number(x.weight), 0) / win.length
  })
}

export function BodyWeightChart({ entries, defaultPeriod = '3M' }) {
  const [period, setPeriod] = useState(defaultPeriod)
  const [tip, setTip] = useState(null)
  // Charted in the display unit (kg or lbs)
  const sorted = [...entries].sort((a, b) => a.measured_on.localeCompare(b.measured_on)).map(e => ({ ...e, weight: isLbs() ? Number(e.weight) * KG_TO_LB : Number(e.weight) }))
  const unit = wUnit()
  const avgAll = rollingAverage(sorted)
  const p = PERIODS.find(x => x.id === period)
  let from = 0
  if (p.months) {
    const cut = new Date(); cut.setMonth(cut.getMonth() - p.months)
    from = cut.getTime()
  }
  const idx = sorted.map((e, i) => i).filter(i => ts(sorted[i].measured_on) >= from)
  const data = idx.map(i => ({ ...sorted[i], w: Number(sorted[i].weight), avg: avgAll[i] }))

  const tabs = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
      {PERIODS.map(x => (
        <button key={x.id} onClick={() => setPeriod(x.id)} style={{
          padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
          background: period === x.id ? 'var(--accent)' : '#2c2c2e', color: period === x.id ? '#000' : 'rgba(255,255,255,0.5)',
        }}>{t(x.label)}</button>
      ))}
    </div>
  )
  if (data.length < 2) {
    return (
      <div>
        {tabs}
        <div style={{ textAlign: 'center', padding: '22px 0', fontSize: 13, opacity: 0.45 }}>
          {sorted.length < 2 ? t('Добавь хотя бы 2 взвешивания, чтобы увидеть график') : t('За этот период меньше 2 взвешиваний')}
        </div>
      </div>
    )
  }

  const W = 400, H = 130, padL = 34, padR = 10, padT = 12, padB = 18
  const ys = data.flatMap(d => [d.w, d.avg])
  const minV = Math.floor(Math.min(...ys) - 0.5), maxV = Math.ceil(Math.max(...ys) + 0.5), range = maxV - minV || 1
  const t0 = ts(data[0].measured_on), t1 = ts(data[data.length - 1].measured_on), span = (t1 - t0) || 1
  const X = (d) => padL + ((ts(d.measured_on) - t0) / span) * (W - padL - padR)
  const Y = (v) => padT + (1 - (v - minV) / range) * (H - padT - padB)
  const avgPath = data.map((d, i) => `${i ? 'L' : 'M'}${X(d)},${Y(d.avg)}`).join(' ')
  const rawPath = data.map((d, i) => `${i ? 'L' : 'M'}${X(d)},${Y(d.w)}`).join(' ')
  const grid = [0, 0.5, 1].map(k => ({ v: minV + range * k, y: Y(minV + range * k) }))

  // Summary uses real weigh-ins: users expect "now" to be the number they just entered
  const start = data[0].w, now = data[data.length - 1].w, diff = now - start
  const avgNow = data[data.length - 1].avg
  const diffColor = Math.abs(diff) < 0.05 ? 'white' : 'var(--accent)'
  const dateLabel = (d) => new Date(d + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'short' })

  return (
    <div>
      {tabs}
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}>
          {grid.map((g, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={g.y} y2={g.y} stroke="rgba(255,255,255,0.06)" />
              <text x={padL - 4} y={g.y + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{fmt(g.v)}</text>
            </g>
          ))}
          <path d={rawPath} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <path d={avgPath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => (
            <g key={i} onMouseEnter={() => setTip(d)} onMouseLeave={() => setTip(null)}
              onTouchStart={e => { e.preventDefault(); setTip(d) }} onTouchEnd={() => setTimeout(() => setTip(null), 1200)}>
              <circle cx={X(d)} cy={Y(d.w)} r="10" fill="transparent" />
              <circle cx={X(d)} cy={Y(d.w)} r={tip === d ? 4 : 2.5} fill="#fff" opacity={tip === d ? 1 : 0.6} />
            </g>
          ))}
          <text x={padL} y={H - 2} fontSize="9" fill="rgba(255,255,255,0.3)">{dateLabel(data[0].measured_on)}</text>
          <text x={W - padR} y={H - 2} fontSize="9" textAnchor="end" fill="rgba(255,255,255,0.3)">{dateLabel(data[data.length - 1].measured_on)}</text>
        </svg>
        {tip && (
          <div style={{ position: 'absolute', left: `${Math.min(Math.max(X(tip) / W * 100, 15), 85)}%`, top: Y(tip.w) - 8, transform: 'translate(-50%,-110%)',
            background: '#2c2c2e', border: '1px solid rgba(var(--accent-rgb),0.4)', borderRadius: 10, padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{fmt(tip.w)} {unit}</div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>{new Date(tip.measured_on + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 14px' }}>
        {[[t('Было'), `${fmt(start)} ${unit}`, 'white'], [t('Сейчас'), `${fmt(now)} ${unit}`, 'white'], [t('Изменение'), `${diff > 0 ? '+' : ''}${fmt(diff)} ${unit}`, diffColor]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 9, opacity: 0.35, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, opacity: 0.35, marginTop: 8 }}>{t('Оранжевая линия — среднее за 7 дней')}{Math.abs(avgNow - now) >= 0.05 ? ` (${t('сейчас')} ${fmt(avgNow)} ${unit})` : ''}, {t('точки — отдельные взвешивания')}</div>
    </div>
  )
}
