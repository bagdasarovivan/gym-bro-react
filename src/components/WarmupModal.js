import { useMemo } from 'react'
import { buildWarmup } from '../data/warmup'
import { RoutinePlayer } from './RoutinePlayer'

// Guided universal warm-up before the workout
export function WarmupModal({ onClose, onComplete }) {
  const plan = useMemo(() => buildWarmup(), [])
  return (
    <RoutinePlayer plan={plan} title="🤸 Разминка" imgDir="warmup" summary="стоя, без инвентаря"
      onComplete={onComplete} startLabel="▶ Начать разминку" onClose={onClose}
      done={{ emoji: '🔥', title: 'Разминка завершена', text: 'Тело готово. Теперь можно работать.', button: 'К тренировке' }} />
  )
}
