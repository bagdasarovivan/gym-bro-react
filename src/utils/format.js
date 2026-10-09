// Форматирование дат и текста.
/* eslint-disable no-unused-vars */
import { dispW, exName, isLbs, locale, num, t, wUnit } from '../i18n'

export const localDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

export function formatMonth(m) {
  if (!m) return ''
  const [y,mo] = m.split('-')
  const s = new Date(parseInt(y), parseInt(mo)-1).toLocaleDateString(locale(), {month:'long', year:'numeric'})
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDateShort(d) {
  return new Date(d).toLocaleDateString(locale(), { day:'numeric', month:'long' })
}

// Sets as one line. Reps-only sets without weight (ab wheel, push-ups…):
// all equal → "4×6" (sets × reps), different → "6, 6, 8 повт".
export function formatSetsText(sets) {
  const sorted = [...(sets || [])].sort((a, b) => a.set_no - b.set_no)
  const repsOnly = sorted.length > 0 && sorted.every(s => !(s.weight > 0) && !(s.time_sec > 0) && s.reps > 0)
  if (repsOnly) {
    const reps = sorted.map(s => s.reps)
    return reps.every(r => r === reps[0]) ? `${reps.length}×${reps[0]}` : `${reps.join(', ')} ${t('повт')}`
  }
  // weights in the display unit (kg or lbs)
  return sorted.map(s => s.time_sec > 0 ? (s.weight > 0 ? `${s.time_sec}s×${num(dispW(s.weight))}${wUnit()}` : `${s.time_sec}s`) : (s.weight > 0 ? `${num(dispW(s.weight))}×${s.reps}` : `${s.reps} ${t('повт')}`)).join(', ')
}

export function buildCopyText(date, workouts) {
  const lines = [`📅 ${date} · ${workouts.length} ${t('упр.')}${isLbs() ? ' · lbs' : ''}`]
  const reversed = [...workouts].reverse()
  reversed.forEach(w => {
    lines.push(`${exName(w.exercises?.name)}: ${formatSetsText(w.sets)}`)
  })
  return lines.join('\n')
}
