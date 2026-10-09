import { useMemo } from 'react'
import { buildStretch } from '../data/stretch'
import { RoutinePlayer } from './RoutinePlayer'
import { t } from '../i18n'

// Guided stretching after the workout
export function StretchModal({ onClose, onComplete }) {
  const plan = useMemo(() => buildStretch(), [])
  return (
    <RoutinePlayer plan={plan} title={t('🧘 Растяжка')} imgDir="stretch" summary={t('стоя, у стойки или скамьи')}
      onComplete={onComplete} startLabel={t('▶ Начать растяжку')} onClose={onClose}
      done={{ emoji: '🧘', title: t('Растяжка завершена'), text: t('Отличная работа. Не забудь попить воды.'), button: t('Готово') }} />
  )
}
