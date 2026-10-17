// Форматирование дат и текста.
/* eslint-disable no-unused-vars */
import { dispW, exName, isLbs, locale, num, t, wUnit } from '../i18n'
import { isCardio } from '../data/exerciseCatalog'
import { noteKind } from '../data/notes'

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
// Cardio entry: "25 мин · 4,2 км · 300 ккал" (distance and calories only when logged)
export const fmtMinutes = (sec) => { const m = Math.round((sec || 0) / 60); return m >= 60 ? `${Math.floor(m / 60)} ${t('ч')} ${m % 60 ? `${m % 60} ${t('мин')}` : ''}`.trim() : `${m} ${t('мин')}` }
export function cardioText(s) {
  const parts = [fmtMinutes(s.time_sec)]
  if (Number(s.distance_km) > 0) parts.push(`${num(Number(s.distance_km))} ${t('км')}`)
  if (Number(s.calories) > 0) parts.push(`${Math.round(s.calories)} ${t('ккал')}`)
  return parts.join(' · ')
}

export function formatSetsText(sets, cardio = false) {
  const sorted = [...(sets || [])].sort((a, b) => a.set_no - b.set_no)
  if (cardio) return sorted.map(cardioText).join(', ')
  const repsOnly = sorted.length > 0 && sorted.every(s => !(s.weight > 0) && !(s.time_sec > 0) && s.reps > 0)
  if (repsOnly) {
    const reps = sorted.map(s => s.reps)
    return reps.every(r => r === reps[0]) ? `${reps.length}×${reps[0]}` : `${reps.join(', ')} ${t('повт')}`
  }
  // weights in the display unit (kg or lbs)
  return sorted.map(s => s.time_sec > 0 ? (s.weight > 0 ? `${s.time_sec}s×${num(dispW(s.weight))}${wUnit()}` : `${s.time_sec}s`) : (s.weight > 0 ? `${num(dispW(s.weight))}×${s.reps}` : `${s.reps} ${t('повт')}`)).join(', ')
}

export function buildCopyText(date, workouts, dayNote = null) {
  const lines = [`📅 ${date} · ${workouts.length} ${t('упр.')}${isLbs() ? ' · lbs' : ''}`]
  // the day's note (illness, injury, workout note…) goes right under the date
  if (dayNote && (dayNote.text || dayNote.kind !== 'note')) lines.push(`${t(noteKind(dayNote.kind).label)}${dayNote.text ? `: ${dayNote.text}` : ''}`)
  // in the order the exercises were logged (by id), whatever order the caller passes
  const ordered = [...workouts].sort((a, b) => (a.id || 0) - (b.id || 0))
  ordered.forEach(w => {
    lines.push(`${exName(w.exercises?.name)}: ${formatSetsText(w.sets, isCardio(w.exercises?.name))}`)
  })
  return lines.join('\n')
}
