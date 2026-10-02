// Форматирование дат и текста.
/* eslint-disable no-unused-vars */

export const localDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

export function formatMonth(m) {
  if (!m) return ''
  const [y,mo] = m.split('-')
  const s = new Date(parseInt(y), parseInt(mo)-1).toLocaleDateString('ru', {month:'long', year:'numeric'})
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDateShort(d) {
  return new Date(d).toLocaleDateString('ru', { day:'numeric', month:'long' })
}

export function buildCopyText(date, workouts) {
  const lines = [`📅 ${date} · ${workouts.length} упр.`]
  const reversed = [...workouts].reverse()
  reversed.forEach(w => {
    const sets = w.sets?.sort((a,b) => a.set_no-b.set_no)
      .map(s => s.time_sec > 0 ? (s.weight > 0 ? `${s.time_sec}s×${s.weight}кг` : `${s.time_sec}s`) : (s.weight > 0 ? `${s.weight}×${s.reps}` : `${s.reps} повт`)).join(', ')
    lines.push(`${w.exercises?.name}: ${sets}`)
  })
  return lines.join('\n')
}
