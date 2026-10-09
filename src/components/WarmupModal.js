import { useMemo } from 'react'
import { buildWarmup } from '../data/warmup'
import { RoutinePlayer } from './RoutinePlayer'
import { t } from '../i18n'

// Guided universal warm-up before the workout
export function WarmupModal({ onClose, onComplete }) {
  const plan = useMemo(() => buildWarmup(), [])
  return (
    <RoutinePlayer plan={plan} title={t('🤸 Разминка')} imgDir="warmup" summary={t('стоя, без инвентаря')}
      onComplete={onComplete} startLabel={t('▶ Начать разминку')} onClose={onClose}
      done={{ emoji: '🔥', title: t('Разминка завершена'), text: t('Тело готово. Теперь можно работать.'), button: t('К тренировке') }} />
  )
}
