/* eslint-disable no-unused-vars */
import { useState } from 'react'
import { ANATOMY_LABELS } from '../data/muscleLoad'
import { MUSCLE_MAP_VIEWS, MUSCLE_ZONES_BY_VIEW } from '../data/muscleZones'

export function MuscleMap({ muscleScores, period = 7 }) {
  const [hovered, setHovered] = useState(null)

  const scoreOf = (muscle) => muscleScores[muscle]
  const getColor = (muscle) => {
    const level = scoreOf(muscle)?.color || 'none'
    if (level === 'none')   return 'rgba(255,255,255,0)'
    if (level === 'low')    return 'rgba(255,214,10,0.45)'
    if (level === 'normal') return 'rgba(158,219,63,0.45)'
    if (level === 'good')   return 'rgba(48,209,88,0.7)'
    return 'rgba(255,69,58,0.6)' // over
  }
  const getStroke = (muscle) => {
    const level = scoreOf(muscle)?.color || 'none'
    if (level === 'none')   return hovered === muscle ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0)'
    if (level === 'low')    return 'rgba(255,214,10,0.9)'
    if (level === 'normal') return 'rgba(158,219,63,1)'
    if (level === 'good')   return 'rgba(48,209,88,1)'
    return 'rgba(255,69,58,1)' // over
  }
  const muscleNames = ANATOMY_LABELS

  const hoveredScore = (hovered && scoreOf(hovered)) || { load: 0, label: 'Нет', color: 'none', percent: 0 }
  const hoveredLevel = hoveredScore.color
  const scoreColor = hoveredLevel === 'over' ? '#FF453A' : hoveredLevel === 'good' ? '#30D158' : hoveredLevel === 'normal' ? '#9EDB3F' : hoveredLevel === 'low' ? '#FFD60A' : 'rgba(255,255,255,0.3)'

  const handleZone = (muscle) => ({
    fill: hovered === muscle ? (hoveredScore.load > 0 ? getColor(muscle) : 'rgba(255,255,255,0.12)') : getColor(muscle),
    stroke: hovered === muscle ? (hoveredScore.load > 0 ? getStroke(muscle) : 'rgba(255,255,255,0.5)') : getStroke(muscle),
    strokeWidth: hovered === muscle ? 1.5 : 0.8,
    style: { cursor: 'pointer', transition: 'all 0.15s' },
    onMouseEnter: () => setHovered(muscle),
    onMouseLeave: () => setHovered(null),
    onClick: () => setHovered(prev => prev === muscle ? null : muscle),
    onTouchStart: (e) => { e.preventDefault(); setHovered(muscle); },
    onTouchEnd: (e) => { e.preventDefault(); },
  })

  return (
    <div style={{userSelect:'none'}}>
      {/* Info bar */}
      <div style={{height:32,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
        {hovered ? (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:scoreColor,flexShrink:0}}/>
            <span style={{fontSize:14,fontWeight:700,color:scoreColor}}>
              {muscleNames[hovered]}
            </span>
            <span style={{fontSize:12,opacity:0.5}}>
              {`${hoveredScore.label} · ${hoveredScore.percent}%`}
            </span>
          </div>
        ) : (
          <div style={{fontSize:11,opacity:0.2,letterSpacing:'1px',textTransform:'uppercase'}}>нажми на мышцу</div>
        )}
      </div>

      {/* Две фигуры: каждая — обрезанный кадр картинки + SVG-зоны в тех же координатах */}
      <div style={{display:'flex',gap:12,width:'100%',maxWidth:520,margin:'0 auto'}}>
        {MUSCLE_MAP_VIEWS.map(v => (
          <div key={v.key} style={{position:'relative',flex:1,aspectRatio:`${v.w} / ${v.h}`,overflow:'hidden'}}>
            <img
              src="/images/muscle_map.png"
              alt={v.key === 'front' ? 'мышцы спереди' : 'мышцы сзади'}
              style={{position:'absolute',width:`${1536 / v.w * 100}%`,maxWidth:'none',left:`${-v.x / v.w * 100}%`,top:`${-v.y / v.h * 100}%`,filter:'brightness(0.92) invert(1)',opacity:0.85}}
            />
            <svg
              viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`}
              style={{position:'absolute',inset:0,width:'100%',height:'100%'}}
              preserveAspectRatio="xMidYMid meet"
            >
              {MUSCLE_ZONES_BY_VIEW[v.key].map(([muscle, d], i) => <path key={i} d={d} {...handleZone(muscle)}/>)}
            </svg>
          </div>
        ))}
      </div>


    </div>
  )
}
