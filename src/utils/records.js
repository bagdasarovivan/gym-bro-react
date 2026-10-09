// Чем меряется прогресс упражнения и выбор лучшего подхода (общие для рекордов и графика).
/* eslint-disable no-unused-vars */
import { EXERCISE_TYPE } from '../data/exerciseCatalog'

// Название без вариации: «Жим лёжа (Узкий)» → «Жим лёжа»
// Catalogue names that end in brackets themselves — they are not a variant
const BRACKET_NAMES = new Set(['Приседания с гантелью (гоблет)'])
export const baseExName = (name) => (BRACKET_NAMES.has((name || '').trim()) ? name.trim() : (name || '').replace(/\s*\([^)]*\)\s*$/, '').trim())

// Чем меряется прогресс: вес / время / повторения (для упражнений без веса)
// bodyweight — только повторения (колесо); bodyweight_plus — повторения + дополнительный вес по желанию
export const isRepsType = (t) => t === 'bodyweight' || t === 'bodyweight_plus'

export function exMetric(name) {
  const t = EXERCISE_TYPE[baseExName(name)] || EXERCISE_TYPE[name] || 'light'
  return t === 'timed' ? 'time' : isRepsType(t) ? 'reps' : 'weight'
}

// Estimated one-rep max (Epley): weight × (1 + reps / 30); a single rep is the weight itself.
// It tells 100×1 from 100×5 — plain "max weight" shows both as 100 kg.
export const e1rm = (weight, reps) => (reps <= 1 ? weight : weight * (1 + reps / 30))

export function setValue(s, metric) {
  if (metric === 'e1rm') return (s.weight > 0 && s.reps > 0) ? e1rm(s.weight, s.reps) : 0
  if (metric === 'time') return s.time_sec || 0
  if (metric === 'reps') return s.reps || 0
  return (s.weight > 0 && s.reps > 0) ? s.weight : 0
}

// Metric a record is ranked by: estimated 1RM for weight exercises, otherwise time or reps
export const recordMetric = (name) => { const m = exMetric(name); return m === 'weight' ? 'e1rm' : m }

// A set as edited on the workout screen → the stored shape ({weight, reps, time_sec}).
// Timed exercises keep seconds in `weight` and the optional extra load in `timedWeight`.
export function uiSetToStored(s, exType) {
  if (exType === 'timed') return { weight: s.timedWeight || 0, reps: 0, time_sec: s.weight || 0 }
  if (exType === 'bodyweight') return { weight: 0, reps: s.reps || 0, time_sec: 0 }
  return { weight: s.weight || 0, reps: s.reps || 0, time_sec: 0 }
}

// Лучший подход: максимальный вес (при равном весе — больше повторений), время или повторения
export function bestSet(sets, metric) {
  let best = null, bestVal = 0
  ;(sets || []).forEach(s => {
    const v = setValue(s, metric)
    if (v <= 0) return
    if (v > bestVal || (v === bestVal && best && (s.reps || 0) > (best.reps || 0))) { bestVal = v; best = s }
  })
  return { best, value: bestVal }
}
