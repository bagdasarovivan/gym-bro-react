import { useEffect, useRef, useState } from 'react'

const ORANGE = '#FF9F0A'

// Picture for a move: /images/<imgDir>/<id>.webp, an existing exercise image, or the emoji.
// `thumb` — small list icon: falls back to the bare emoji instead of a tinted tile.
function MoveImage({ move, imgDir, size, thumb = false }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [move.id])
  const src = move.img ? `/images/${move.img}.webp` : `/images/${imgDir}/${move.id}.webp`
  const radius = thumb ? 8 : 20
  if (failed) {
    return thumb
      ? <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{move.emoji}</div>
      : <div style={{ width: size, height: size, borderRadius: radius, background: 'rgba(255,159,10,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3 }}>{move.emoji}</div>
  }
  // Square, like exercise pictures elsewhere in the app
  return <img src={src} alt={move.name} onError={() => setFailed(true)} loading={thumb ? 'lazy' : undefined}
    style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
}

function Ring({ progress, children }) {
  const r = 54, c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: 128, height: 128 }}>
      <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="64" cy="64" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle cx="64" cy="64" r={r} stroke={ORANGE} strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)} style={{ transition: 'stroke-dashoffset 0.3s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>{children}</div>
    </div>
  )
}

// Total seconds a timed step runs: two sides run back to back
export const stepSeconds = (m) => (m.sec ? m.sec * (m.sides ? 2 : 1) : 0)

// Duration label for the overview list
const durationLabel = (m) => m.sec ? (m.sides ? `${m.sec} сек × 2` : `${m.sec} сек`) : `×${m.reps}`

// Guided routine (warm-up, stretching): overview → step-by-step player → done.
// plan: { blocks:[{title,subtitle,moves:[id]}], steps:[{id,name,emoji,cue,sec|reps,sides?,block}], totalMin }
// A step with `sides` runs `sec` per side; the player vibrates and says when to switch.
export function RoutinePlayer({ plan, title, imgDir, summary, startLabel, done, onClose, onComplete }) {
  const [phase, setPhase] = useState('overview') // overview | run | done
  const [idx, setIdx] = useState(0)
  const [left, setLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const tick = useRef(null)
  const step = plan.steps[idx]
  const total = step ? stepSeconds(step) : 0

  // (Re)start the countdown for a timed step
  useEffect(() => {
    if (phase !== 'run' || !step) return
    setLeft(stepSeconds(step)); setPaused(false)
  }, [phase, idx, step])
  useEffect(() => {
    clearInterval(tick.current)
    if (phase !== 'run' || !step?.sec || paused) return
    tick.current = setInterval(() => setLeft(l => l - 1), 1000)
    return () => clearInterval(tick.current)
  }, [phase, idx, paused, step])
  useEffect(() => {
    if (phase !== 'run' || !step?.sec || paused) return
    if (left <= 0) {
      if (navigator.vibrate) navigator.vibrate([120, 60, 120])
      next()
    } else if (step.sides && left === step.sec) {
      if (navigator.vibrate) navigator.vibrate(200) // halfway: switch sides
    }
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    if (idx + 1 >= plan.steps.length) { setPhase('done'); onComplete?.(); if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]) }
    else setIdx(i => i + 1)
  }
  const prev = () => setIdx(i => Math.max(0, i - 1))
  const nextStep = plan.steps[idx + 1]
  // For two-sided steps: seconds left on the current side and which side it is
  const onFirstSide = step?.sides && left > step.sec
  const shownLeft = step?.sides ? Math.max(0, onFirstSide ? left - step.sec : left) : Math.max(0, left)

  const btn = (primary) => ({
    flex: 1, padding: '14px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
    background: primary ? ORANGE : 'rgba(255,255,255,0.08)', color: primary ? '#000' : 'rgba(255,255,255,0.85)',
  })

  return (
    <div className="timer-modal-overlay" onClick={e => { if (e.target === e.currentTarget && phase !== 'run') onClose() }}>
      <div className="timer-modal" style={{ padding: '18px 20px 34px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} aria-label="Закрыть" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {phase === 'overview' && (
          <>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 14 }}>
              ~{plan.totalMin} мин · {plan.steps.length} упражнений · {summary}
            </div>
            {plan.blocks.map(b => (
              <div key={b.title} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{b.title}</span>
                  <span style={{ fontSize: 12, opacity: 0.45 }}>{b.subtitle}</span>
                </div>
                {b.moves.map(id => {
                  const m = plan.steps.find(s => s.id === id)
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <MoveImage move={m} imgDir={imgDir} size={40} thumb />
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{m.name}</span>
                      <span style={{ fontSize: 13, opacity: 0.55, fontWeight: 600, whiteSpace: 'nowrap' }}>{durationLabel(m)}</span>
                    </div>
                  )
                })}
              </div>
            ))}
            <button onClick={() => { setIdx(0); setPhase('run') }} style={{ ...btn(true), width: '100%', marginTop: 18, fontSize: 16 }}>{startLabel}</button>
          </>
        )}

        {phase === 'run' && step && (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {plan.steps.map((s, i) => (
                <div key={s.id} style={{ flex: 1, height: 4, borderRadius: 2, background: i < idx ? ORANGE : i === idx ? 'rgba(255,159,10,0.55)' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{step.block} · {idx + 1}/{plan.steps.length}</div>
            <div style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 14px' }}>{step.name}</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><MoveImage move={step} imgDir={imgDir} size={240} /></div>
            <div style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.5, marginBottom: 18, textAlign: 'center' }}>{step.cue}</div>
            {step.sides && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                {['Одна сторона', 'Другая сторона'].map((label, i) => {
                  const active = i === 0 ? onFirstSide : !onFirstSide
                  return <span key={label} style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                    background: active ? 'rgba(255,159,10,0.18)' : 'rgba(255,255,255,0.05)', color: active ? ORANGE : 'rgba(255,255,255,0.35)' }}>{label}</span>
                })}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              {step.sec ? (
                <Ring progress={1 - Math.max(0, left) / total}>
                  <div style={{ fontSize: 40, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: paused ? 'rgba(255,255,255,0.4)' : 'white' }}>{shownLeft}</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>{paused ? 'пауза' : 'сек'}</div>
                </Ring>
              ) : (
                <Ring progress={0}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: ORANGE }}>×{step.reps}</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>повторений</div>
                </Ring>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={prev} disabled={idx === 0} style={{ ...btn(false), flex: 0.6, opacity: idx === 0 ? 0.35 : 1 }}>‹</button>
              {step.sec
                ? <button onClick={() => setPaused(p => !p)} style={btn(false)}>{paused ? '▶ Дальше' : '⏸ Пауза'}</button>
                : null}
              <button onClick={next} style={btn(true)}>{step.sec ? 'Пропустить ›' : 'Готово ›'}</button>
            </div>
            {nextStep && <div style={{ fontSize: 12, opacity: 0.4, textAlign: 'center', marginTop: 12 }}>Далее: {nextStep.name}</div>}
          </>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '18px 0 4px' }}>
            <div style={{ fontSize: 56 }}>{done.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 6px' }}>{done.title}</div>
            <div style={{ fontSize: 14, opacity: 0.6 }}>{done.text}</div>
            <button onClick={onClose} style={{ ...btn(true), width: '100%', marginTop: 18, fontSize: 16 }}>{done.button}</button>
          </div>
        )}
      </div>
    </div>
  )
}
