import { useMemo } from 'react'
import { buildDays, tierOf } from '../data/achievements'
import { GRIP_MUSCLES, getVariantOptions, EXERCISE_MUSCLES, MUSCLE_LABELS, GRIP_EXERCISES } from '../data/exerciseCatalog'
import { getAnatomy, ANATOMY_LABELS } from '../data/muscleLoad'
import { e1rm, recordMetric } from '../utils/records'
import { anatomyLabel, dispW, fmtVolume, fmtW, locale, muscleLabel, num, plural, t, variantName } from '../i18n'
import { MuscleMap } from './MuscleMap'

// Per-exercise statistics for the Exercises tab: everything is derived from the workout history (allRows),
// grouped by the base exercise name so all grips/variants count together.

const DAY = 86400000
const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
const dayDiff = (date) => Math.round((today() - new Date(date + 'T00:00:00').getTime()) / DAY)
const fmtTime = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} ${t('сек')}`)

// Badges that belong to an exercise (ids from achievements.js)
const EX_BADGES = {
  'Жим лёжа': ['rank_bench', 'bench', 'bw_bench', 'bw_bench2', 'bw_bench_reps', 'bench_gain'],
  'Приседания': ['rank_squat', 'squat', 'bw_squat', 'bw_squat2'],
  'Становая тяга': ['rank_deadlift', 'deadlift', 'bw_dead', 'bw_dead2'],
  'Подтягивания': ['rank_pullup', 'pull_w', 'pullups', 'bw_pull'],
  'Отжимания на брусьях': ['rank_dip', 'dip_w', 'dip_reps'],
  'Подъём штанги на бицепс': ['rank_curl', 'curl'],
  'Жим над головой': ['ohp'],
  'Жим гантелей лёжа': ['db_press'],
  'Тяга штанги в наклоне': ['row'],
  'Ягодичный мост': ['glute'],
  'Отжимания': ['pushup_reps'],
  'Колесо для пресса': ['wheel'],
}

// base name → summary of everything done with it
export function exerciseIndex(allRows) {
  const idx = new Map()
  buildDays(allRows || []).forEach(({ date, items }) => items.forEach(it => {
    let e = idx.get(it.base)
    if (!e) { e = { base: it.base, sessions: [], dates: new Set() }; idx.set(it.base, e) }
    e.sessions.push({ date, name: it.name, sets: it.sets })
    e.dates.add(date)
  }))
  idx.forEach(e => {
    const metric = recordMetric(e.base)
    let best = null, bestE = 0, maxReps = 0, maxTime = 0, reps = 0, vol = 0
    const perDay = new Map()
    e.sessions.forEach(s => s.sets.forEach(x => {
      const w = x.weight || 0, r = x.reps || 0, ts = x.time_sec || 0
      reps += r; if (w > 0 && r > 0) vol += w * r
      if (r > maxReps) maxReps = r
      if (ts > maxTime) maxTime = ts
      if (w > 0 && r > 0 && (!best || w > best.weight || (w === best.weight && r > best.reps))) best = { weight: w, reps: r, date: s.date }
      const est = w > 0 && r > 0 ? e1rm(w, r) : 0
      if (est > bestE) bestE = est
      const v = metric === 'time' ? ts : metric === 'reps' ? r : est
      if (v > (perDay.get(s.date) || 0)) perDay.set(s.date, v)
    }))
    const dates = [...e.dates].sort()
    Object.assign(e, {
      metric, best, bestE1rm: bestE, maxReps, maxTime, totalReps: reps, volume: vol,
      count: dates.length, first: dates[0], last: dates[dates.length - 1],
      series: [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value })),
    })
    e.sessions.sort((a, b) => b.date.localeCompare(a.date))
  })
  return idx
}

// Short "best" label for list rows
export function bestLabel(e) {
  if (!e) return ''
  if (e.metric === 'time') return e.maxTime ? fmtTime(e.maxTime) : ''
  if (e.metric === 'reps') return e.best ? `+${num(dispW(e.best.weight))} × ${e.best.reps}` : e.maxReps ? `${e.maxReps} ${t('повт')}` : ''
  return e.best ? `${fmtW(e.best.weight)} × ${e.best.reps}` : ''
}

export function agoLabel(date) {
  const d = dayDiff(date)
  if (d <= 0) return t('сегодня')
  if (d === 1) return t('вчера')
  return t('{n} дн. назад', { n: d })
}

const fmtDateShort = (d) => new Date(d + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'short' })

function setText(x, metric) {
  if (metric === 'time') return fmtTime(x.time_sec || 0) + (x.weight > 0 ? ` +${num(dispW(x.weight))}` : '')
  if (metric === 'reps') return x.weight > 0 ? `+${num(dispW(x.weight))}×${x.reps || 0}` : `${x.reps || 0}`
  return `${num(dispW(x.weight || 0))}×${x.reps || 0}`
}

// Small line chart of the best value per workout
function Sparkline({ series, metric, thm }) {
  const pts = series.slice(-30)
  if (pts.length < 2) return null
  const W = 300, H = 70, P = 6
  const vals = pts.map(p => p.value), min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1
  const xy = pts.map((p, i) => [P + (i / (pts.length - 1)) * (W - 2 * P), H - P - ((p.value - min) / span) * (H - 2 * P)])
  const path = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const fmtV = v => (metric === 'time' ? fmtTime(Math.round(v)) : metric === 'reps' ? `${Math.round(v)}` : fmtW(Math.round(v * 2) / 2))
  const delta = vals[vals.length - 1] - vals[0]
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: thm.text50, marginBottom: 4 }}>
        <span>{metric === 'e1rm' ? t('Расчётный максимум') : metric === 'time' ? t('Лучшее время') : t('Лучший подход')}</span>
        <span style={{ color: delta > 0 ? '#30D158' : delta < 0 ? '#FF453A' : thm.text50, fontWeight: 700 }}>
          {delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : ''}{fmtV(Math.abs(delta))}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 70, display: 'block' }} preserveAspectRatio="none">
        <defs><linearGradient id="exsg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#FF9F0A" stopOpacity="0.35" /><stop offset="1" stopColor="#FF9F0A" stopOpacity="0" /></linearGradient></defs>
        <path d={`${path} L${xy[xy.length - 1][0]},${H} L${xy[0][0]},${H} Z`} fill="url(#exsg)" />
        <path d={path} fill="none" stroke="#FF9F0A" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: thm.text40, marginTop: 2 }}>
        <span>{fmtDateShort(pts[0].date)} · {fmtV(vals[0])}</span>
        <span>{fmtDateShort(pts[pts.length - 1].date)} · {fmtV(vals[vals.length - 1])}</span>
      </div>
    </div>
  )
}

const Section = ({ label, children, thm }) => (
  <div className="ex-detail-section">
    <div className="ex-detail-section-lbl">{label}</div>
    {children}
  </div>
)

function Tile({ value, label, thm, isDark }) {
  return (
    <div style={{ flex: '1 1 30%', minWidth: 90, padding: '10px 12px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: thm.text, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: thm.text50, marginTop: 2 }}>{label}</div>
    </div>
  )
}

// "My stats" part of the exercise card
export function ExerciseStats({ base, entry, achievements, thm, isDark }) {
  const badges = useMemo(() => (EX_BADGES[base] || [])
    .map(id => achievements?.permanent?.find(a => a.id === id))
    .filter(a => a && !(a.secret && !a.tier)), [base, achievements])

  if (!entry) {
    return (
      <div style={{ margin: '14px 0 4px', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,159,10,0.1)', color: thm.text70, fontSize: 14 }}>
        ✨ {t('Ты ещё не делал это упражнение. Добавь его в тренировку — здесь появятся рекорды и прогресс.')}
      </div>
    )
  }
  const m = entry.metric
  const tiles = []
  if (m === 'e1rm') {
    if (entry.best) tiles.push([`${fmtW(entry.best.weight)} × ${entry.best.reps}`, t('Лучший подход')])
    if (entry.bestE1rm) tiles.push([fmtW(Math.round(entry.bestE1rm * 2) / 2), t('Расчётный 1ПМ')])
  } else if (m === 'reps') {
    tiles.push([`${entry.maxReps} ${t('повт')}`, t('Больше всего за подход')])
    if (entry.best) tiles.push([`+${fmtW(entry.best.weight)}`, t('Макс. доп. вес')])
  } else tiles.push([fmtTime(entry.maxTime), t('Лучшее время')])
  tiles.push([`${entry.count}`, plural(entry.count, ['тренировка', 'тренировки', 'тренировок'], ['workout', 'workouts'])])
  tiles.push([agoLabel(entry.last), t('последний раз')])
  if (entry.totalReps) tiles.push([`${entry.totalReps}`, t('повторов всего')])
  if (entry.volume) tiles.push([fmtVolume(entry.volume), t('тоннаж всего')])

  return (
    <>
      <Section label={t('Мои результаты')} thm={thm}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tiles.map(([v, l]) => <Tile key={l} value={v} label={l} thm={thm} isDark={isDark} />)}
        </div>
        {entry.series.length >= 2 && <div style={{ marginTop: 12 }}><Sparkline series={entry.series} metric={m} thm={thm} /></div>}
      </Section>

      {badges.length > 0 && (
        <Section label={t('Медали')} thm={thm}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {badges.map(a => {
              const got = a.tier > 0 ? tierOf(a, a.tier - 1) : null
              const next = a.tier < a.tiers.length ? a.tiers[a.tier] : null
              const left = next != null ? next - a.value : 0
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
                  <span style={{ fontSize: 20 }}>{got ? got.medal : a.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: thm.text }}>{t(a.name)}</div>
                    <div style={{ fontSize: 12, color: thm.text50 }}>
                      {got && <span style={{ color: got.color, fontWeight: 700 }}>{t(got.name)}</span>}
                      {got && ' · '}
                      {next != null
                        ? t('до «{tier}» осталось {v}', { tier: t(tierOf(a, a.tier).name), v: a.fmt(Math.max(0, Math.round(left * 100) / 100)) })
                        : t('максимальный уровень')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      <Section label={t('Последние тренировки')} thm={thm}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entry.sessions.slice(0, 5).map((s, i) => {
            const v = s.name.match(/\(([^)]*)\)\s*$/)?.[1]
            return (
              <div key={s.date + i} style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'baseline' }}>
                <span style={{ width: 56, flexShrink: 0, color: thm.text50 }}>{fmtDateShort(s.date)}</span>
                <span style={{ flex: 1, color: thm.text70 }}>
                  {v && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 99, marginRight: 6, background: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }}>{variantName(v)}</span>}
                  {s.sets.filter(x => (x.reps || 0) > 0 || (x.time_sec || 0) > 0).map(x => setText(x, m)).join(' · ') || '—'}
                </span>
              </div>
            )
          })}
        </div>
      </Section>
    </>
  )
}

// Muscle map with the exercise's primary (green) and secondary (yellow) muscles
export function ExerciseMuscleMap({ name, thm }) {
  const an = getAnatomy(name)
  if (!an || !an.primary.length) return null
  const scores = {}
  an.secondary.forEach(k => { scores[k] = { color: 'low', label: 'Вспомогательная', load: 1 } })
  an.primary.forEach(k => { scores[k] = { color: 'good', label: 'Основная', load: 1 } })
  return (
    <Section label={t('Какие мышцы работают')} thm={thm}>
      <MuscleMap muscleScores={scores} showPercent={false} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: thm.text50, marginTop: 6 }}>
        <span><span style={{ color: '#30D158' }}>●</span> {t('Основная')}</span>
        <span><span style={{ color: '#FFD60A' }}>●</span> {t('Вспомогательная')}</span>
      </div>
    </Section>
  )
}

// Grip / variant options with the muscles each one emphasises
export function ExerciseVariants({ name, thm, isDark }) {
  if (!GRIP_EXERCISES.includes(name)) return null
  const opts = getVariantOptions(name)
  const rows = opts.map(v => {
    const an = getAnatomy(`${name} (${v})`)
    const grp = GRIP_MUSCLES[name]?.[v] || EXERCISE_MUSCLES[name]
    const focus = an?.primary?.length
      ? an.primary.slice(0, 3).map(k => anatomyLabel(k, ANATOMY_LABELS[k] || k))
      : (grp?.primary || []).map(k => muscleLabel(k, MUSCLE_LABELS[k] || k))
    return { v, focus }
  })
  return (
    <Section label={t('Варианты хвата')} thm={thm}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(({ v, focus }) => (
          <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '8px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: thm.text, minWidth: 92 }}>{variantName(v)}</span>
            <span style={{ fontSize: 12, color: thm.text60 }}>{focus.length ? `${t('акцент')}: ${focus.join(', ')}` : ''}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}
