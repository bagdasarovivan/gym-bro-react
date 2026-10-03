/* eslint-disable no-unused-vars */
import { useState } from 'react'

export function LineChart({ data, period, setPeriod, unit = 'кг', totalPoints = 0 }) {
  const [tooltip, setTooltip] = useState(null)

  const periods = [{ id:'1M', label:'1 мес' }, { id:'3M', label:'3 мес' }, { id:'ALL', label:'Всё' }]

  const noData = (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
            background: period===p.id ? '#FF9F0A' : '#2c2c2e',
            color: period===p.id ? '#000' : 'rgba(255,255,255,0.5)',
          }}>{p.label}</button>
        ))}
      </div>
      <div style={{textAlign:'center',padding:'28px 0'}}>
        <div style={{fontSize:36,marginBottom:8}}>📊</div>
        <div style={{fontSize:14,fontWeight:600,opacity:0.5,marginBottom:4}}>
          {period !== 'ALL' && totalPoints >= 2 ? `За ${period === '1M' ? 'месяц' : '3 месяца'} меньше 2 тренировок` : 'Нужно минимум 2 тренировки'}
        </div>
        <div style={{fontSize:12,opacity:0.3}}>
          {period !== 'ALL' && totalPoints >= 2 ? 'выбери период подлиннее' : 'для отображения графика'}
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

  // "Start" is the first workout of the period; "Now" is the best of the last 3 workouts, so a single
  // light day at the end does not turn real progress into "+0" or a fake drop.
  const k = Math.min(3, vals.length)
  const round1 = (v) => +v.toFixed(1)
  const first = round1(vals[0])
  const last = round1(Math.max(...vals.slice(-k)))
  const record = round1(Math.max(...vals))
  const diff = round1(last - first)
  const pct = first > 0 ? ((diff / first) * 100).toFixed(1) : 0
  // Running best ("best result to date") as a dashed step line: it only goes up, so the trend is obvious
  let best = -Infinity
  const bestPath = pts.map((p, i) => {
    const prevBest = best
    best = Math.max(best, p.val)
    const y = padT + (1 - (best - minV) / range) * (H - padT - padB)
    if (i === 0) return `M${p.x},${y}`
    const prevY = padT + (1 - (prevBest - minV) / range) * (H - padT - padB)
    return `L${p.x},${prevY} L${p.x},${y}`
  }).join(' ') + ` L${W - padR},${padT + (1 - (best - minV) / range) * (H - padT - padB)}`

  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
            background: period===p.id ? '#FF9F0A' : '#2c2c2e',
            color: period===p.id ? '#000' : 'rgba(255,255,255,0.5)',
          }}>{p.label}</button>
        ))}
      </div>
      <div style={{position:'relative'}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,overflow:'visible',display:'block'}}>
          <defs>
            <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF9F0A" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#FF9F0A" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {gridLines.map((g,i) => (
            <g key={i}>
              <line x1={padL} y1={g.y} x2={W-padR} y2={g.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <text x={padL-4} y={g.y+4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{g.val}</text>
            </g>
          ))}
          <path d={area} fill="url(#cg2)"/>
          <path d={bestPath} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeDasharray="4 4"/>
          <path d={path} fill="none" stroke="#FF9F0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                <circle cx={p.x} cy={p.y} r={tooltip?.date===p.date ? (dense?4:6) : (dense?2:4)} fill="#FF9F0A" stroke="#000" strokeWidth={dense?1:2}/>
              </g>
            ))
          })()}
        </svg>
        {tooltip && (() => {
          const leftPct = Math.min(Math.max((tooltip.x / W) * 100, 10), 90)
          const topPx = Math.max(tooltip.y - 8, 0)
          const fullDate = tooltip.date
            ? new Date(tooltip.date+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'long',year:'numeric'})
            : tooltip.label
          // Значение точки — уже сам вес / время / повторения, поэтому вторая строка — только повторения
          const setLine = (tooltip.metric === 'weight' && tooltip.bestReps > 0) ? `× ${tooltip.bestReps} повт`
            : (tooltip.metric === 'reps' && tooltip.bestWeight > 0) ? `доп. вес ${tooltip.bestWeight} кг` : null
          return (
            <div style={{
              position:'absolute',
              left:`${leftPct}%`,
              top:topPx,
              transform:'translate(-50%, -110%)',
              background:'#2c2c2e',
              border:'1px solid rgba(255,159,10,0.4)',
              borderRadius:10,
              padding:'10px 14px',
              boxShadow:'0 4px 12px rgba(0,0,0,0.4)',
              pointerEvents:'none',
              zIndex:10,
              textAlign:'center',
              whiteSpace:'nowrap',
            }}>
              <div style={{fontSize:18,fontWeight:700,color:'#FF9F0A',lineHeight:1.2}}>{tooltip.val} {unit}</div>
              {setLine && <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.9)',marginTop:3}}>{setLine}</div>}
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:3}}>{fullDate}</div>
            </div>
          )
        })()}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:14,background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'10px 14px'}}>
        {[['Старт', first+' '+unit, null], ['Сейчас', last+' '+unit, null],
          ['Прирост', (diff>=0?'+':'')+diff+' '+unit, (Number(pct)>=0?'+':'')+pct+'%'], ['Рекорд', record+' '+unit, null]].map(([lbl,val,sub],i) => (
          <div key={i} style={{textAlign:'center'}}>
            <div style={{fontSize:14,fontWeight:700,color: i===2 ? (diff>0?'#FF9F0A':diff<0?'#FF453A':'white') : 'white'}}>{val}</div>
            {sub && <div style={{fontSize:10,fontWeight:700,color: diff>0?'#FF9F0A':diff<0?'#FF453A':'rgba(255,255,255,0.5)'}}>{sub}</div>}
            <div style={{fontSize:9,opacity:0.35,marginTop:2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',gap:8,marginTop:8,fontSize:10,opacity:0.35,lineHeight:1.4}}>
        <span>{k > 1 ? `Старт — первая тренировка, Сейчас — лучшая из ${k} последних` : 'Старт — первая тренировка, Сейчас — последняя'}</span>
        <span style={{whiteSpace:'nowrap'}}>┄ лучший на дату</span>
      </div>
    </div>
  )
}
