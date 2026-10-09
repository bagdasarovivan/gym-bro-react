import { useMemo } from 'react'
import { MUSCLE_FILTERS_ROW1, MUSCLE_FILTERS_ROW2, getExImage, normalizeName } from '../data/exerciseCatalog'
import { buildDays, groupsOf, recordEvents, weekKey } from '../data/achievements'
import { bestSet, recordMetric } from '../utils/records'
import { exName, fmtVolume, isEn, locale, plural, t } from '../i18n'

// History tab: month strip, month summary, week separators and rich day cards.
const ORANGE = '#FF9F0A', GREEN = '#30D158', RED = '#FF453A'
const GROUP_LABEL = Object.fromEntries([...MUSCLE_FILTERS_ROW1, ...MUSCLE_FILTERS_ROW2].map(f => [f.id, f.label]))
const volume = (sets) => (sets || []).reduce((s, x) => s + (x.weight > 0 && x.reps > 0 ? x.weight * x.reps : 0), 0)
const dayVolume = (ws) => ws.reduce((s, w) => s + volume(w.sets), 0)
const D = (d) => new Date(d + 'T12:00:00')
const addDays = (d, n) => { const x = new Date(D(d).getTime() + n * 86400000); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
const prevMonthKey = (m) => { const x = new Date(+m.slice(0, 4), +m.slice(5, 7) - 2, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}` }
const pct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null)

function Thumb({ name, size = 26 }) {
  const img = getExImage(name)
  if (!img) return <div style={{ width: size, height: size, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0 }}>🏋️</div>
  return <img src={img} alt="" loading="lazy" decoding="async" style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
}

function Delta({ value }) {
  if (value === null || value === undefined) return null
  const up = value > 0, same = value === 0
  return <span style={{ fontSize: 11, fontWeight: 700, color: same ? 'rgba(255,255,255,0.4)' : up ? GREEN : RED }}>{same ? '=' : up ? '↑' : '↓'} {Math.abs(value)}%</span>
}

export function HistoryView({ history, allRows, month, setMonth, year, setYear, openDays, setOpenDays, copiedDay, onCopy, onEdit, onDeleteDay, onDeleteExercise, setChip, thm, isDark }) {
  // Record events over the whole history: "date|exercise" → new PR that day
  const prIndex = useMemo(() => {
    const ev = recordEvents(buildDays(allRows || history))
    return new Set(ev.events.map(e => `${e.date}|${e.name}`))
  }, [allRows, history])
  // Best set per exercise per date, to compare with the previous session
  const sessions = useMemo(() => {
    const m = {}
    ;(allRows || history).forEach(w => {
      const name = normalizeName(w.exercises?.name); if (!name) return
      const metric = recordMetric(name)
      const { best, value } = bestSet(w.sets, metric)
      if (!best) return
      ;(m[name] = m[name] || []).push({ date: w.workout_date, best, value })
    })
    Object.values(m).forEach(a => a.sort((x, y) => x.date.localeCompare(y.date)))
    return m
  }, [allRows, history])

  // Whole history once loaded (all years), the last 12 months until then
  const rows = allRows || history
  const months = [...new Set(rows.map(w => w.workout_date.slice(0, 7)))].sort().reverse()
  const active = month && months.includes(month) ? month : months[0] || ''
  const inMonth = rows.filter(w => w.workout_date.startsWith(active))
  const byDate = {}
  inMonth.forEach(w => { (byDate[w.workout_date] = byDate[w.workout_date] || []).push(w) })
  Object.values(byDate).forEach(ws => ws.sort((a, b) => (a.id || 0) - (b.id || 0))) // order they were logged
  // Workout days per month, for the year grid
  const daysPerMonth = {}
  new Set(rows.map(w => w.workout_date)).forEach(d => { const m = d.slice(0, 7); daysPerMonth[m] = (daysPerMonth[m] || 0) + 1 })
  const years = [...new Set(months.map(m => m.slice(0, 4)))]
  const activeYear = year && years.includes(year) ? year : active.slice(0, 4)
  const dates = Object.keys(byDate).sort().reverse()

  // Month summary vs the previous month
  // The current month is compared with the same days of the previous month, past months with the whole month
  const prevM = prevMonthKey(active)
  const today = new Date()
  const isCurrent = active === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  // same days of the previous month, capped at its length (31 Oct → 1–30 Sep)
  const prevLen = new Date(+prevM.slice(0, 4), +prevM.slice(5, 7), 0).getDate()
  const cutDay = String(Math.min(today.getDate(), prevLen)).padStart(2, '0')
  const prevRows = rows.filter(w => w.workout_date.startsWith(prevM) && (!isCurrent || w.workout_date.slice(8, 10) <= cutDay))
  const volNow = dayVolume(inMonth), volPrev = dayVolume(prevRows)
  const daysNow = dates.length, daysPrev = new Set(prevRows.map(w => w.workout_date)).size
  const prsNow = [...prIndex].filter(k => k.startsWith(active)).length
  // Workouts per Monday-week of the month
  // (weeks crossing the month boundary count their workouts from both months)
  const weekCounts = {}
  new Set(rows.map(w => w.workout_date)).forEach(d => { const k = weekKey(d); weekCounts[k] = (weekCounts[k] || 0) + 1 })
  const firstWeek = weekKey(`${active}-01`)
  const weeks = []
  for (let k = firstWeek; k.slice(0, 7) <= active; k = addDays(k, 7)) weeks.push(k)
  const maxWeek = Math.max(3, ...weeks.map(k => weekCounts[k] || 0))
  const weekShort = (k) => `${D(k).getDate()}–${D(addDays(k, 6)).getDate()}`

  const monthShort = (m) => {
    const s = D(`${m}-01`).toLocaleDateString(locale(), { month: 'short' }).replace('.', '')
    return s.charAt(0).toUpperCase() + s.slice(1, 3) // 3 letters: Янв, Фев, Сен… / Jan, Feb…
  }
  const monthLong = (m) => { const s = D(`${m}-01`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1) }
  const dayTitle = (d) => { const s = D(d).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1) }
  const weekRange = (k) => {
    const end = addDays(k, 6)
    const f = (d, withMonth) => D(d).toLocaleDateString(locale(), withMonth ? { day: 'numeric', month: 'short' } : { day: 'numeric' }).replace('.', '')
    if (k.slice(0, 7) !== end.slice(0, 7)) return `${f(k, true)} – ${f(end, true)}`
    return isEn() ? `${f(k, true)}–${D(end).getDate()}` : `${f(k)}–${f(end, true)}` // "Oct 5–11" / "5–11 окт" 
  }
  const card = { background: isDark ? '#1c1c1e' : '#fff', borderRadius: 16, border: `1px solid ${thm.border}` }

  if (!months.length) return <div className="section"><div style={{ opacity: 0.5, marginTop: 20, textAlign: 'center' }}>{t('Нет записей')}</div></div>

  // Day list grouped by week
  const groups = []
  dates.forEach(d => { const k = weekKey(d); if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, dates: [] }); groups[groups.length - 1].dates.push(d) })

  return (
    <div className="section">
      {/* Year chips (only when there is more than one year) + month grid of the selected year */}
      {years.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {years.map(y => (
            <button key={y} onClick={() => { setYear(y); const m = months.find(x => x.startsWith(y)); if (m) setMonth(m); setOpenDays({}) }} style={{
              padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800,
              background: y === activeYear ? (isDark ? '#fff' : '#1c1c1e') : 'transparent', color: y === activeYear ? (isDark ? '#000' : '#fff') : thm.text50,
            }}>{y}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 14 }}>
        {Array.from({ length: 12 }, (_, i) => `${activeYear}-${String(i + 1).padStart(2, '0')}`).map(m => {
          const n = daysPerMonth[m] || 0
          const sel = m === active
          return (
            <button key={m} disabled={!n} onClick={() => { setMonth(m); setOpenDays({}) }} style={{
              padding: '8px 0 6px', borderRadius: 12, border: 'none', cursor: n ? 'pointer' : 'default',
              background: sel ? ORANGE : (isDark ? '#1c1c1e' : '#fff'), opacity: n ? 1 : 0.35,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#000' : thm.text }}>{monthShort(m)}</div>
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: sel ? 'rgba(0,0,0,0.6)' : n ? ORANGE : thm.text35 }}>{n || '·'}</div>
            </button>
          )
        })}
      </div>

      {/* Month summary */}
      <div style={{ ...card, padding: '16px 16px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: thm.text50, marginBottom: 12 }}>{monthLong(active)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {[
            [daysNow, plural(daysNow, ['тренировка', 'тренировки', 'тренировок'], ['workout', 'workouts']), pct(daysNow, daysPrev)],
            [fmtVolume(volNow), t('поднято'), pct(volNow, volPrev)],
            [prsNow, plural(prsNow, ['рекорд', 'рекорда', 'рекордов'], ['PR', 'PRs']), null],
          ].map(([v, l, d], i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: i === 2 && prsNow ? ORANGE : thm.text, lineHeight: 1.1 }}>{v}</div>
              <div style={{ fontSize: 11, color: thm.text40, marginTop: 3 }}>{l}</div>
              <div style={{ minHeight: 14, marginTop: 2 }}><Delta value={d} /></div>
            </div>
          ))}
        </div>
        {/* Workouts per week */}
        <div style={{ fontSize: 10, fontWeight: 700, color: thm.text35, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 12 }}>{t('Тренировки по неделям')}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 52, marginTop: 6 }}>
          {weeks.map(k => {
            const n = weekCounts[k] || 0
            const future = k > addDays(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`, 0)
            return (
              <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: n ? ORANGE : thm.text35 }}>{future ? '' : n}</div>
                <div style={{ width: '100%', height: Math.max(3, (n / maxWeek) * 22), borderRadius: 4, background: n ? ORANGE : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'), opacity: n ? 0.35 + 0.65 * (n / maxWeek) : 1 }} />
                <div style={{ fontSize: 9, color: thm.text35, whiteSpace: 'nowrap' }}>{weekShort(k)}</div>
              </div>
            )
          })}
        </div>
        {daysPrev > 0 && <div style={{ fontSize: 10, color: thm.text35, marginTop: 6 }}>
          {isCurrent
            ? t('Сравнение с {range}', { range: isEn()
                ? `${D(`${prevM}-01`).toLocaleDateString(locale(), { month: 'long' })} 1–${+cutDay}`
                : `1–${D(`${prevM}-${cutDay}`).toLocaleDateString(locale(), { day: 'numeric', month: 'long' })}` })
            : t('Сравнение с прошлым месяцем')}
        </div>}
      </div>

      {groups.map(g => {
        const gDays = g.dates
        const gVol = gDays.reduce((s, d) => s + dayVolume(byDate[d]), 0)
        return (
          <div key={g.k} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '10px 4px 8px', fontSize: 12, fontWeight: 700, color: thm.text40, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>{t('Неделя')} {weekRange(g.k)}</span>
              <span style={{ textTransform: 'none', fontWeight: 600 }}>{gDays.length} {isEn() ? plural(gDays.length, [], ['workout', 'workouts']) : t('трен.')} · {fmtVolume(gVol)}</span>
            </div>
            {gDays.map(date => {
              const ws = byDate[date]
              const isOpen = openDays[date]
              const names = [...new Set(ws.map(w => normalizeName(w.exercises?.name)).filter(Boolean))]
              const groupsCount = {}
              names.forEach(n => groupsOf(n).forEach(gr => { groupsCount[gr] = (groupsCount[gr] || 0) + 1 }))
              const muscles = Object.entries(groupsCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([gr]) => t(GROUP_LABEL[gr] || gr))
              const prs = names.filter(n => prIndex.has(`${date}|${n}`)).length
              const sets = ws.reduce((s, w) => s + (w.sets?.length || 0), 0)
              return (
                <div key={date} style={{ ...card, marginBottom: 8, overflow: 'hidden' }}>
                  <button onClick={() => setOpenDays(p => ({ ...p, [date]: !p[date] }))} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 14px', textAlign: 'left', color: thm.text }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>{dayTitle(date)}</span>
                      {prs > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: ORANGE, background: 'rgba(255,159,10,0.12)', borderRadius: 99, padding: '3px 8px' }}>🏆 {prs}</span>}
                      <span style={{ fontSize: 15, fontWeight: 800, color: ORANGE }}>{fmtVolume(dayVolume(ws))}</span>
                      <span style={{ fontSize: 11, color: thm.text30, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </div>
                    <div style={{ fontSize: 12, color: thm.text40, marginTop: 4 }}>
                      {muscles.length ? muscles.join(' · ') + ' · ' : ''}{names.length} {t('упр.')} · {sets} {t('подх.')}
                    </div>
                    {!isOpen && (
                      <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                        {names.slice(0, 7).map(n => <Thumb key={n} name={n} />)}
                        {names.length > 7 && <div style={{ fontSize: 12, color: thm.text40, alignSelf: 'center' }}>+{names.length - 7}</div>}
                      </div>
                    )}
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${thm.border}` }}>
                      {ws.map(w => {
                        const name = normalizeName(w.exercises?.name)
                        const metric = recordMetric(name)
                        const sorted = [...(w.sets || [])].sort((a, b) => (a.set_no || 0) - (b.set_no || 0))
                        const { best, value } = bestSet(sorted, metric)
                        const isPR = prIndex.has(`${date}|${name}`)
                        const prev = (sessions[name] || []).filter(s => s.date < date).pop()
                        const cmp = prev && best ? (value > prev.value + 1e-9 ? 'up' : value < prev.value - 1e-9 ? 'down' : 'same') : null
                        return (
                          <div key={w.id} style={{ padding: '11px 14px', borderBottom: `1px solid ${thm.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Thumb name={name} size={34} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: thm.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exName(name)}</div>
                                {cmp && (
                                  <div style={{ fontSize: 11, marginTop: 2, color: cmp === 'up' ? GREEN : cmp === 'down' ? RED : thm.text40 }}>
                                    {cmp === 'up' ? '↑' : cmp === 'down' ? '↓' : '='} {t('к {date}', { date: D(prev.date).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }).replace('.', '') })}: {setChip(prev.best)}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => onDeleteExercise(w.id)} title={t('Удалить упражнение')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.4, padding: '0 4px', color: RED }}>✕</button>
                            </div>
                            <div className="chips" style={{ marginTop: 8, paddingLeft: 44 }}>
                              {sorted.map((s, i) => {
                                const top = s === best
                                return (
                                  <span key={i} className="chip" style={top ? { background: isPR ? 'rgba(255,159,10,0.18)' : 'rgba(255,159,10,0.1)', color: ORANGE, boxShadow: 'inset 0 0 0 1px rgba(255,159,10,0.35)' } : undefined}>
                                    {top && isPR ? '🏆 ' : ''}{setChip(s)}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                      <div className="day-actions" style={{ margin: 0, borderRadius: 0 }}>
                        <button className={`day-action-btn${copiedDay === date ? ' ok' : ''}`} onClick={() => onCopy(date, ws)}>{copiedDay === date ? t('✅ Скопировано') : t('📋 Копировать')}</button>
                        <button className="day-action-btn" onClick={() => onEdit(date, ws)}>{t('✏️ Изменить')}</button>
                        <button className="day-action-btn del" onClick={() => onDeleteDay(date, ws)}>{t('🗑 Удалить')}</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

