// Day notes: illness, injury, vacation… stored in the day_notes table (one note per user per day).
import { EXERCISE_MUSCLES } from './exerciseCatalog'

// `range`: can be set for several days at once ("from … to …")
// `pause`: these days don't break the "Iron discipline" week series
export const NOTE_KINDS = [
  { id: 'sick', label: 'Болезнь', color: '#7FB77E', range: true, pause: true },
  { id: 'injury', label: 'Травма', color: '#E0685A', range: true, pause: true },
  { id: 'vacation', label: 'Отпуск', color: '#5FA8D3', range: true, pause: true },
  { id: 'rest', label: 'Отдых', color: '#9C8ADE', range: true, pause: false },
  { id: 'tired', label: 'Усталость', color: '#C49A6C', range: false, pause: false },
  { id: 'max', label: 'Максимум', color: '#E8B84A', range: false, pause: false },
  { id: 'note', label: 'Заметка', color: '#C9B79C', range: false, pause: false },
]
export const noteKind = (id) => NOTE_KINDS.find(k => k.id === id) || NOTE_KINDS[NOTE_KINDS.length - 1]

// Injured body part → muscle groups (EXERCISE_MUSCLES keys) whose exercises get a warning
export const BODY_PARTS = [
  { id: 'shoulder', label: 'Плечо', muscles: ['shoulders', 'chest', 'traps'] },
  { id: 'elbow', label: 'Локоть', muscles: ['biceps', 'triceps', 'forearms'] },
  { id: 'wrist', label: 'Запястье', muscles: ['forearms', 'biceps', 'triceps'] },
  { id: 'neck', label: 'Шея', muscles: ['traps'] },
  { id: 'back', label: 'Спина', muscles: ['upper_back', 'lats', 'traps'] },
  { id: 'lower_back', label: 'Поясница', muscles: ['lower_back'] },
  { id: 'knee', label: 'Колено', muscles: ['quads', 'hamstrings', 'adductors'] },
  { id: 'ankle', label: 'Голеностоп', muscles: ['calves'] },
  { id: 'other', label: 'Другое', muscles: [] },
]
export const bodyPart = (id) => BODY_PARTS.find(p => p.id === id)

const D = (d) => new Date(d + 'T12:00:00')
export const addDaysStr = (d, n) => { const x = new Date(D(d).getTime() + n * 86400000); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
export const daysBetween = (a, b) => Math.round((D(b) - D(a)) / 86400000)

// Dates from `from` to `to` inclusive (at most 60 days)
export function dateRange(from, to) {
  const out = []
  for (let d = from; d <= to && out.length < 60; d = addDaysStr(d, 1)) out.push(d)
  return out
}

// Consecutive days with the same kind of note around `date` → { from, to } (to show "12–18 Oct")
export function noteSpan(notes, date) {
  const n = notes[date]
  if (!n) return null
  let from = date, to = date
  while (notes[addDaysStr(from, -1)]?.kind === n.kind && notes[addDaysStr(from, -1)]?.body_part === n.body_part) from = addDaysStr(from, -1)
  while (notes[addDaysStr(to, 1)]?.kind === n.kind && notes[addDaysStr(to, 1)]?.body_part === n.body_part) to = addDaysStr(to, 1)
  return { from, to }
}

// Injury notes in the 14 days up to `date` that concern this exercise → the latest one per body part
export function injuryWarnings(notes, exName, date) {
  const m = EXERCISE_MUSCLES[exName]
  if (!m) return []
  const muscles = [...(m.primary || []), ...(m.secondary || [])]
  const found = {}
  for (let i = 0; i <= 14; i++) {
    const d = addDaysStr(date, -i)
    const n = notes[d]
    if (n?.kind !== 'injury' || !n.body_part || found[n.body_part]) continue
    const part = bodyPart(n.body_part)
    if (part && part.muscles.some(x => muscles.includes(x))) found[n.body_part] = { ...n, date: d, part }
  }
  return Object.values(found)
}

// Dates that pause the week series (illness, injury, vacation)
export const pauseDates = (notes) => new Set(Object.values(notes || {}).filter(n => noteKind(n.kind).pause).map(n => n.note_date))
