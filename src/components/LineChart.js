/* eslint-disable no-unused-vars */
import { useState } from 'react'
import { fmtW, locale, plural, t } from '../i18n'

export function LineChart({ data, period, setPeriod, unit, totalPoints = 0, dark = true }) {
  unit = unit || t('кг')
  // text/line colour for the current theme
  const ink = (a) => (dark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`)
  const chipBg = dark ? '#2c2c2e' : '#e5e5ea'
  const [tooltip, setTooltip] = useState(null)

  const periods = [{ id:'1M', label:t('1 мес') }, { id:'3M', label:t('3 мес') }, { id:'ALL', label:t('Всё') }]

  const noData = (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
            background: period===p.id ? 'var(--accent)' : chipBg,
            color: period===p.id ? '#000' : ink(0.5),
          }}>{p.label}</button>
        ))}
      </div>
      <div style={{textAlign:'center',padding:'28px 0'}}>
        <div style={{fontSize:36,marginBottom:8}}>📊</div>
        <div style={{fontSize:14,fontWeight:600,opacity:0.5,marginBottom:4}}>
          {period !== 'ALL' && totalPoints >= 2 ? (period === '1M' ? t('За месяц меньше 2 тренировок') : t('За 3 месяца меньше 2 тренировок')) : t('Нужно минимум 2 тренировки')}
        </div>
        <div style={{fontSize:12,opacity:0.3}}>
          {period !== 'ALL' && totalPoints >= 2 ? t('выбери период подлиннее') : t('для отображения графика')}
        </div>
      </div>
    </div>
  )

  if (!data || data.length < 2) return noData

  const vals = data.map(d => d.val)
  const minV = Math.floor(Math.min(...vals) * 0.95)
  const maxV = Math.ceil(Math.max(...vals) * 1.05)
  const range = maxV - minV || 1
  const W = 400; const H = 140; const padL = 36; const padR = 10; const padT = 14; const padB = 22

  // Ось X пропорциональна датам: перерыв в тренировках виден как промежуток
  const tOf = (d) => new Date(d.date + 'T12:00:00').getTime()
  const t0 = tOf(data[0]), t1 = tOf(data[data.length - 1]), span = (t1 - t0) || 1
  const pts = data.map((d, i) => ({
    x: padL + (t1 > t0 ? (tOf(d) - t0) / span : i / (data.length - 1)) * (W - padL - padR),
    y: padT + (1 - (d.val - minV) / range) * (H - padT - padB),
    ...d
  }))

  function smoothPath(points) {
    if (points.length < 2) return ''
    let d = `M${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i-1]; const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
    }
    return d
  }

  const path = smoothPath(pts)
  const area = path + ` L${pts[pts.length-1].x},${H-padB} L${pts[0].x},${H-padB} Z`
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    val: Math.round(minV + range * t),
    y: padT + (1 - t) * (H - padT - padB)
  }))

  // Date axis: 4 evenly spaced ticks; the year is added when the range is long
  const longRange = t1 - t0 > 300 * 86400000
  const fmtTick = (ms) => new Date(ms).toLocaleDateString(locale(), longRange ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' })
  const xTicks = (t1 > t0 ? [0, 1 / 3, 2 / 3, 1] : [0]).map((f, i, a) => ({
    x: padL + f * (W - padL - padR), label: fmtTick(t0 + f * span),
    anchor: a.length === 1 ? 'start' : i === 0 ? 'start' : i === a.length - 1 ? 'end' : 'middle',
  }))
  // Period caption under the chart: exact dates and how long it took
  const days = Math.round((t1 - t0) / 86400000)
  const months = Math.round(days / 30.44)
  const duration = days < 60
    ? `${days} ${plural(days, ['день', 'дня', 'дней'], ['day', 'days'])}`
    : months < 24 ? `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'], ['month', 'months'])}`
      : `${Math.round(days / 365.25 * 10) / 10} ${t('г.')}`
  // The year is shown only when the range is not entirely in the current year
  const sameYear = new Date(t0).getFullYear() === new Date().getFullYear() && new Date(t1).getFullYear() === new Date().getFullYear()
  const fmtFull = (ms) => new Date(ms).toLocaleDateString(locale(), sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })

  // Summary shows both directions: progress = record vs start, decline = last workout vs record.
  // A light last session therefore shows a drop without hiding the gain made over the period.
  const round1 = (v) => +v.toFixed(1)
  const first = round1(vals[0])
  const last = round1(vals[vals.length - 1])
  const record = round1(Math.max(...vals))
  const gain = round1(record - first)
  const gainPct = first > 0 ? round1((gain / first) * 100) : 0
  const fromRecord = round1(last - record)
  const signed = (v) => (v > 0 ? '+' : v < 0 ? '−' : '+') + Math.abs(v)
  const ORANGE = 'var(--accent)', RED = '#FF453A', MUTED = ink(0.5)
  const tiles = [
    { label: t('Старт'), value: `${first} ${unit}` },
    { label: t('Рекорд'), value: `${record} ${unit}`,
      sub: gain > 0 ? `${signed(gain)} ${unit} · ${signed(gainPct)}%` : t('без роста'), subColor: gain > 0 ? ORANGE : MUTED },
    { label: t('Сейчас'), value: `${last} ${unit}`, valueColor: fromRecord < 0 ? RED : ink(1),
      sub: fromRecord < 0 ? `${signed(fromRecord)} ${unit} ${t('от рекорда')}` : t('🔥 на рекорде'), subColor: fromRecord < 0 ? RED : ORANGE },
  ]

  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
            background: period===p.id ? 'var(--accent)' : chipBg,
            color: period===p.id ? '#000' : ink(0.5),
          }}>{p.label}</button>
        ))}
      </div>
      <div style={{position:'relative'}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,overflow:'visible',display:'block'}}>
          <defs>
            <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {gridLines.map((g,i) => (
            <g key={i}>
              <line x1={padL} y1={g.y} x2={W-padR} y2={g.y} stroke={ink(0.06)} strokeWidth="1"/>
              <text x={padL-4} y={g.y+4} textAnchor="end" fontSize="9" fill={ink(0.35)}>{g.val}</text>
            </g>
          ))}
          {xTicks.map((tk, i) => (
            <text key={'x' + i} x={tk.x} y={H - padB + 15} textAnchor={tk.anchor} fontSize="9" fill={ink(0.4)}>{tk.label}</text>
          ))}
          <path d={area} fill="url(#cg2)"/>
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {(() => {
            // Много точек — уменьшаем кружки и зону касания, чтобы не слипались
            const step = (W - padL - padR) / Math.max(pts.length - 1, 1)
            const dense = pts.length > 25
            const hitR = Math.max(4, Math.min(16, step / 2))
            return pts.map((p,i) => (
              <g key={i} style={{cursor:'pointer'}}
                onMouseEnter={()=>setTooltip(p)} onMouseLeave={()=>setTooltip(null)}
                onTouchStart={e=>{e.preventDefault();setTooltip(p)}} onTouchEnd={()=>setTimeout(()=>setTooltip(null),1200)}>
                <circle cx={p.x} cy={p.y} r={hitR} fill="transparent"/>
                <circle cx={p.x} cy={p.y} r={tooltip?.date===p.date ? (dense?4:6) : (dense?2:4)} fill="var(--accent)" stroke="#000" strokeWidth={dense?1:2}/>
              </g>
            ))
          })()}
        </svg>
        {tooltip && (() => {
          const leftPct = Math.min(Math.max((tooltip.x / W) * 100, 10), 90)
          const topPx = Math.max(tooltip.y - 8, 0)
          const fullDate = tooltip.date
            ? new Date(tooltip.date+'T12:00:00').toLocaleDateString(locale(),{day:'numeric',month:'long',year:'numeric'})
            : tooltip.label
          // Значение точки — уже сам вес / время / повторения, поэтому вторая строка — только повторения
          const setLine = (tooltip.metric === 'e1rm' && tooltip.bestReps > 0) ? `${fmtW(tooltip.bestWeight)} × ${tooltip.bestReps} ${t('повт')}`
            : (tooltip.metric === 'weight' && tooltip.bestReps > 0) ? `× ${tooltip.bestReps} ${t('повт')}`
            : (tooltip.metric === 'reps' && tooltip.bestWeight > 0) ? `${t('доп. вес')} ${fmtW(tooltip.bestWeight)}` : null
          return (
            <div style={{
              position:'absolute',
              left:`${leftPct}%`,
              top:topPx,
              transform:'translate(-50%, -110%)',
              background:'#2c2c2e',
              border:'1px solid rgba(var(--accent-rgb),0.4)',
              borderRadius:10,
              padding:'10px 14px',
              boxShadow:'0 4px 12px rgba(0,0,0,0.4)',
              pointerEvents:'none',
              zIndex:10,
              textAlign:'center',
              whiteSpace:'nowrap',
            }}>
              <div style={{fontSize:18,fontWeight:700,color:'var(--accent)',lineHeight:1.2}}>{tooltip.metric === 'e1rm' ? '≈' : ''}{tooltip.val} {unit}{tooltip.metric === 'e1rm' && <span style={{fontSize:11,opacity:0.7,marginLeft:4}}>{t('1ПМ')}</span>}</div>
              {setLine && <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.9)',marginTop:3}}>{setLine}</div>}
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:3}}>{fullDate}</div>
            </div>
          )
        })()}
      </div>
      <div style={{textAlign:'center',fontSize:12,color:ink(0.5),marginTop:2}}>
        📅 {fmtFull(t0)} — {fmtFull(t1)} · <b style={{color:ink(0.8)}}>{duration}</b>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:10,background:ink(0.04),borderRadius:12,padding:'10px 14px'}}>
        {tiles.map(t => (
          <div key={t.label} style={{textAlign:'center',flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:t.valueColor || ink(1)}}>{t.value}</div>
            {t.sub && <div style={{fontSize:10,fontWeight:700,color:t.subColor,marginTop:1}}>{t.sub}</div>}
            <div style={{fontSize:9,opacity:0.35,marginTop:2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
