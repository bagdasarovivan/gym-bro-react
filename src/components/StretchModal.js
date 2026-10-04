import { useMemo } from 'react'
import { buildStretch } from '../data/stretch'
import { RoutinePlayer } from './RoutinePlayer'

// Guided stretching after the workout
export function StretchModal({ onClose }) {
  const plan = useMemo(() => buildStretch(), [])
  return (
    <RoutinePlayer plan={plan} title="🧘 Растяжка" imgDir="stretch" summary="стоя, у стойки или скамьи"
      startLabel="▶ Начать растяжку" onClose={onClose}
      done={{ emoji: '🧘', title: 'Растяжка завершена', text: 'Отличная работа. Не забудь попить воды.', button: 'Готово' }} />
  )
}
