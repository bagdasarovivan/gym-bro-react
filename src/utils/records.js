// Чем меряется прогресс упражнения и выбор лучшего подхода (общие для рекордов и графика).
/* eslint-disable no-unused-vars */
import { EXERCISE_TYPE } from '../data/exerciseCatalog'

// Название без вариации: «Жим лёжа (Узкий)» → «Жим лёжа»
export const baseExName = (name) => (name || '').replace(/\s*\([^)]*\)\s*$/, '').trim()

// Чем меряется прогресс: вес / время / повторения (для упражнений без веса)
// bodyweight — только повторения (колесо); bodyweight_plus — повторения + дополнительный вес по желанию
export const isRepsType = (t) => t === 'bodyweight' || t === 'bodyweight_plus'

export function exMetric(name) {
  const t = EXERCISE_TYPE[baseExName(name)] || EXERCISE_TYPE[name] || 'light'
  return t === 'timed' ? 'time' : isRepsType(t) ? 'reps' : 'weight'
}

export function setValue(s, metric) {
  if (metric === 'time') return s.time_sec || 0
  if (metric === 'reps') return s.reps || 0
  return (s.weight > 0 && s.reps > 0) ? s.weight : 0
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
