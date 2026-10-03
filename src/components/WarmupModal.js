import { useEffect, useMemo, useRef, useState } from 'react'
import { buildWarmup } from '../data/warmup'

const ORANGE = '#FF9F0A'

// Picture for a warm-up move: /images/warmup/<id>.webp, an existing exercise image, or the emoji.
function MoveImage({ move, size }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [move.id])
  const src = move.img ? `/images/${move.img}.webp` : `/images/warmup/${move.id}.webp`
  if (failed) {
    return <div style={{ width: size, height: size * 0.66, borderRadius: 18, background: 'rgba(255,159,10,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3 }}>{move.emoji}</div>
  }
  return <img src={src} alt={move.name} onError={() => setFailed(true)}
    style={{ width: size, height: size * 0.66, borderRadius: 18, objectFit: 'cover', background: '#fff' }} />
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

// Guided warm-up built for today's workout: overview → step-by-step player → done.
export function WarmupModal({ workoutExercises, onClose, wUnit = 'кг', kgToDisplay = (v) => v }) {
  const plan = useMemo(() => buildWarmup(workoutExercises), [workoutExercises])
  const [phase, setPhase] = useState('overview') // overview | run | done
  const [idx, setIdx] = useState(0)
  const [left, setLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const tick = useRef(null)
  const step = plan.steps[idx]

  // (Re)start the countdown for a timed step
  useEffect(() => {
    if (phase !== 'run' || !step) return
    setLeft(step.sec || 0); setPaused(false)
  }, [phase, idx, step])
  useEffect(() => {
    clearInterval(tick.current)
    if (phase !== 'run' || !step?.sec || paused) return
    tick.current = setInterval(() => setLeft(l => l - 1), 1000)
    return () => clearInterval(tick.current)
  }, [phase, idx, paused, step])
  useEffect(() => {
    if (phase === 'run' && step?.sec && left <= 0 && !paused) {
      if (navigator.vibrate) navigator.vibrate([120, 60, 120])
      next()
    }
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    if (idx + 1 >= plan.steps.length) { setPhase('done'); if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]) }
    else setIdx(i => i + 1)
  }
  const prev = () => setIdx(i => Math.max(0, i - 1))
  const nextStep = plan.steps[idx + 1]

  const btn = (primary) => ({
    flex: 1, padding: '14px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
    background: primary ? ORANGE : 'rgba(255,255,255,0.08)', color: primary ? '#000' : 'rgba(255,255,255,0.85)',
  })

  const RampUps = () => plan.rampUps.length > 0 && (
    <div style={{ background: 'rgba(255,159,10,0.07)', border: '1px solid rgba(255,159,10,0.25)', borderRadius: 14, padding: '12px 14px', marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🏋️ Разминочные подходы</div>
      {plan.rampUps.map(r => (
        <div key={r.name} style={{ fontSize: 13, opacity: 0.85, marginTop: 4, lineHeight: 1.5 }}>
          <b>{r.name}</b>: {r.sets.map(s => `${kgToDisplay(s.w)}×${s.r}`).join(' → ')} → <span style={{ color: ORANGE, fontWeight: 700 }}>{kgToDisplay(r.working)} {wUnit} рабочий</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="timer-modal-overlay" onClick={e => { if (e.target === e.currentTarget && phase !== 'run') onClose() }}>
      <div className="timer-modal" style={{ padding: '18px 20px 34px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>🤸 Разминка</div>
          <button onClick={onClose} aria-label="Закрыть" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {phase === 'overview' && (
          <>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 14 }}>
              ~{plan.totalMin} мин · {plan.steps.length} упражнений{plan.focus.length ? ' · под сегодняшнюю тренировку' : ' · на всё тело'}
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
                      <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{m.emoji}</span>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{m.name}</span>
                      <span style={{ fontSize: 13, opacity: 0.55, fontWeight: 600 }}>{m.sec ? `${m.sec} сек` : `×${m.reps}`}</span>
                    </div>
                  )
                })}
              </div>
            ))}
            <RampUps />
            <button onClick={() => { setIdx(0); setPhase('run') }} style={{ ...btn(true), width: '100%', marginTop: 18, fontSize: 16 }}>▶ Начать разминку</button>
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><MoveImage move={step} size={300} /></div>
            <div style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.5, marginBottom: 18, textAlign: 'center' }}>{step.cue}</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              {step.sec ? (
                <Ring progress={1 - Math.max(0, left) / step.sec}>
                  <div style={{ fontSize: 40, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: paused ? 'rgba(255,255,255,0.4)' : 'white' }}>{Math.max(0, left)}</div>
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
            <div style={{ fontSize: 56 }}>🔥</div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 6px' }}>Разминка завершена</div>
            <div style={{ fontSize: 14, opacity: 0.6 }}>Тело готово. Теперь можно работать.</div>
            <div style={{ textAlign: 'left' }}><RampUps /></div>
            <button onClick={onClose} style={{ ...btn(true), width: '100%', marginTop: 18, fontSize: 16 }}>К тренировке</button>
          </div>
        )}
      </div>
    </div>
  )
}
