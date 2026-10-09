// Achievements: permanent badges with tiers plus monthly challenges.
// Everything is derived from the workout history, so past workouts count and every tier gets the real
// date it was earned. Only warm-up / stretching completions are logged separately (routineLog).
import { EXERCISE_MUSCLES, MUSCLE_FILTER_MAP, normalizeName } from './exerciseCatalog'
import { getRank } from './motivation'
import { baseExName, e1rm, recordMetric, setValue } from '../utils/records'
import { fmtVolume, fmtW, locale, plural, t } from '../i18n'
import { RANKS, RANK_NAMES, STANDARDS, categoryFor, rankFor } from './standards'

export const TIERS = [
  { name: 'Бронза', color: '#CD7F32', medal: '🥉' },
  { name: 'Серебро', color: '#C0C0C0', medal: '🥈' },
  { name: 'Золото', color: '#FFD700', medal: '🥇' },
  { name: 'Платина', color: '#7FDBDA', medal: '💠' },
  { name: 'Алмаз', color: '#B9F2FF', medal: '💎' },
]

const DAY = 86400000
const parse = (d) => new Date(d + 'T12:00:00')
const fmtDate = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
// Monday of the week the date belongs to
export const weekKey = (d) => { const dt = parse(d); const wd = (dt.getDay() + 6) % 7; return fmtDate(new Date(dt.getTime() - wd * DAY)) }
const addDays = (d, n) => fmtDate(new Date(parse(d).getTime() + n * DAY))
const tons = (kg) => fmtVolume(kg)

// Volume of a set list, same rule as the month stats: weight × reps of loaded sets
const volume = (sets) => (sets || []).reduce((s, x) => s + (x.weight > 0 && x.reps > 0 ? x.weight * x.reps : 0), 0)

// Muscle groups (the 9 filter groups) an exercise trains, by its primary muscles
const GROUPS = Object.keys(MUSCLE_FILTER_MAP)
export function groupsOf(name) {
  const m = EXERCISE_MUSCLES[baseExName(name)] || EXERCISE_MUSCLES[name]
  if (!m) return []
  return GROUPS.filter(g => MUSCLE_FILTER_MAP[g].some(x => m.primary.includes(x)))
}

// rows: [{ workout_date, exercises: { name }, sets: [{ weight, reps, time_sec }] }] → days in date order
export function buildDays(rows) {
  const byDate = new Map()
  ;(rows || []).forEach(w => {
    const name = normalizeName(w.exercises?.name)
    if (!name || !w.workout_date) return
    if (!byDate.has(w.workout_date)) byDate.set(w.workout_date, [])
    byDate.get(w.workout_date).push({ name, base: baseExName(name), sets: w.sets || [] })
  })
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({ date, items }))
}

// Body weight on a date: the latest weigh-in on or before it, otherwise the first one after
function bodyWeightAt(entries, date) {
  if (!entries?.length) return null
  let w = null
  for (const e of entries) { if (e.measured_on <= date) w = e.weight; else break }
  return w ?? entries[0].weight
}

// First date a running series reaches each tier. series: [{ date, value }]
function crossings(series, tiers) {
  return tiers.map(t => series.find(p => p.value >= t)?.date || null)
}

// Replays history per exercise and returns every new-record event (the first time doing an exercise is not one)
export function recordEvents(days) {
  const best = {}, streak = {}, events = []
  let prStreakDate = null
  days.forEach(({ date, items }) => {
    const dayBest = {}
    items.forEach(it => {
      const metric = recordMetric(it.name)
      it.sets.forEach(s => { const v = setValue(s, metric); if (v > (dayBest[it.name] || 0)) dayBest[it.name] = v })
    })
    Object.entries(dayBest).forEach(([name, v]) => {
      if (v <= 0) return
      if (best[name] !== undefined && v > best[name] + 1e-9) {
        events.push({ date, name })
        streak[name] = (streak[name] || 0) + 1
        if (streak[name] >= 3 && !prStreakDate) prStreakDate = date
      } else streak[name] = 0
      best[name] = Math.max(best[name] || 0, v)
    })
  })
  return { events, prStreakDate }
}

// ── Permanent achievements ───────────────────────────────────────────────────
function permanent(days, bodyWeights, routineDates) {
  const list = []
  const add = (def, series, opts = {}) => {
    const earned = crossings(series, def.tiers)
    const value = opts.current ?? (series.length ? Math.max(...series.map(p => p.value)) : 0)
    list.push({ ...def, earned, value, tier: earned.filter(Boolean).length })
  }

  // Workouts
  const count = days.map((d, i) => ({ date: d.date, value: i + 1 }))
  add({ id: 'first', group: 'Постоянство', emoji: '🎉', name: 'Первая тренировка', desc: 'Запиши первую тренировку', tiers: [1], fmt: v => `${v}` }, count)
  add({ id: 'workouts', group: 'Постоянство', emoji: '🏋️', name: 'Ветеран зала', desc: 'Всего тренировок', tiers: [10, 50, 100, 250, 500], fmt: v => `${v} ${t('тр.')}` }, count)

  // Consecutive weeks with at least 2 workouts
  const perWeek = new Map()
  days.forEach(d => { const k = weekKey(d.date); if (!perWeek.has(k)) perWeek.set(k, []); perWeek.get(k).push(d.date) })
  const weekSeries = []
  let run = 0, curRun = 0
  if (days.length) {
    const thisWeek = weekKey(fmtDate(new Date()))
    for (let k = weekKey(days[0].date); k <= thisWeek; k = addDays(k, 7)) {
      const dates = perWeek.get(k) || []
      if (dates.length >= 2) { run++; weekSeries.push({ date: dates[1], value: run }) }
      else if (k !== thisWeek) run = 0 // the current week is still in progress
    }
    curRun = run
  }
  add({ id: 'weeks', group: 'Постоянство', emoji: '📅', name: 'Железная дисциплина', desc: 'Недель подряд, в каждой хотя бы 2 тренировки', tiers: [4, 12, 26, 52], fmt: v => `${v} ${t('нед.')}` }, weekSeries, { current: curRun })

  // Strength — heaviest weight actually lifted (any reps)
  const bestLift = (name) => {
    let b = 0; const s = []
    days.forEach(d => d.items.forEach(it => {
      if (it.name !== name) return
      it.sets.forEach(x => { if (x.reps > 0 && x.weight > b) { b = x.weight; s.push({ date: d.date, value: b }) } })
    }))
    return s
  }
  const bench = bestLift('Жим лёжа'), squat = bestLift('Приседания'), dead = bestLift('Становая тяга')
  const kg = v => fmtW(v)
  add({ id: 'bench', group: 'Сила', emoji: '🏋️', name: 'Жим лёжа', desc: 'Вес в жиме лёжа', tiers: [60, 80, 100, 120, 140], fmt: kg }, bench)
  add({ id: 'squat', group: 'Сила', emoji: '🦵', name: 'Приседания', desc: 'Вес в приседе', tiers: [80, 100, 140, 180, 220], fmt: kg }, squat)
  add({ id: 'deadlift', group: 'Сила', emoji: '🏗️', name: 'Становая тяга', desc: 'Вес в становой тяге', tiers: [100, 140, 180, 220, 260], fmt: kg }, dead)
  // Sum of the three best lifts
  const total = []
  {
    const ev = [...bench.map(p => ({ ...p, k: 'b' })), ...squat.map(p => ({ ...p, k: 's' })), ...dead.map(p => ({ ...p, k: 'd' }))].sort((a, b) => a.date.localeCompare(b.date))
    const cur = { b: 0, s: 0, d: 0 }
    ev.forEach(p => { cur[p.k] = p.value; total.push({ date: p.date, value: cur.b + cur.s + cur.d }) })
  }
  add({ id: 'total', group: 'Сила', emoji: '🏛️', name: 'Сумма троеборья', desc: 'Сумма жима, приседа и становой', tiers: [300, 400, 500, 600], fmt: kg }, total)
  // Pull-ups: most reps in one set (any grip)
  const pull = []
  { let b = 0; days.forEach(d => d.items.forEach(it => { if (it.base !== 'Подтягивания') return; it.sets.forEach(x => { if ((x.reps || 0) > b) { b = x.reps; pull.push({ date: d.date, value: b }) } }) })) }
  add({ id: 'pullups', group: 'Сила', emoji: '🧗', name: 'Турникмен', desc: 'Подтягиваний за один подход', tiers: [10, 15, 20, 25], fmt: v => `${v} ${t('повт')}` }, pull)

  // Relative to body weight
  const rel = (series) => series.map(p => { const bw = bodyWeightAt(bodyWeights, p.date); return { date: p.date, value: bw ? p.value / bw : 0 } })
  const x = v => `${(Math.floor(v * 100) / 100).toLocaleString(locale())}× ${t('веса')}`
  const needBW = !bodyWeights?.length
  add({ id: 'bw_bench', group: 'Сила к весу', emoji: '⚖️', name: 'Жим своего веса', desc: needBW ? 'Добавь вес тела в 🧍, чтобы считать' : 'Жим лёжа ≥ веса тела', tiers: [1], fmt: x }, rel(bench))
  add({ id: 'bw_squat', group: 'Сила к весу', emoji: '⚖️', name: 'Присед полтора веса', desc: needBW ? 'Добавь вес тела в 🧍, чтобы считать' : 'Присед ≥ 1,5 веса тела', tiers: [1.5], fmt: x }, rel(squat))
  add({ id: 'bw_dead', group: 'Сила к весу', emoji: '⚖️', name: 'Становая два веса', desc: needBW ? 'Добавь вес тела в 🧍, чтобы считать' : 'Становая ≥ 2 весов тела', tiers: [2], fmt: x }, rel(dead))

  // Volume
  const dayVol = days.map(d => ({ date: d.date, value: d.items.reduce((s, it) => s + volume(it.sets), 0) }))
  add({ id: 'day_tonnage', group: 'Объём', emoji: '🚛', name: 'Тяжёлый день', desc: 'Тоннаж за одну тренировку', tiers: [5000, 10000, 15000, 20000], fmt: tons }, dayVol)
  let acc = 0
  add({ id: 'all_tonnage', group: 'Объём', emoji: '⛰️', name: 'Тонны железа', desc: 'Тоннаж за всё время', tiers: [50000, 100000, 250000, 500000, 1000000], fmt: tons }, dayVol.map(p => ({ date: p.date, value: (acc += p.value) })))

  // Records
  const { events, prStreakDate } = recordEvents(days)
  add({ id: 'records', group: 'Рекорды', emoji: '🏆', name: 'Рекордсмен', desc: 'Сколько раз побил свой рекорд', tiers: [1, 10, 50, 100], fmt: v => `${v}` }, events.map((e, i) => ({ date: e.date, value: i + 1 })))
  add({ id: 'pr_streak', group: 'Рекорды', emoji: '🔥', name: 'Серия рекордов', desc: 'Рекорд в одном упражнении 3 тренировки подряд', secret: true, tiers: [1], fmt: v => `${v}` }, prStreakDate ? [{ date: prStreakDate, value: 1 }] : [])

  // Misc
  const seen = new Set(), variety = []
  days.forEach(d => d.items.forEach(it => { if (!seen.has(it.base)) { seen.add(it.base); variety.push({ date: d.date, value: seen.size }) } }))
  add({ id: 'variety', group: 'Разное', emoji: '🎨', name: 'Разнообразие', desc: 'Разных упражнений', tiers: [10, 20, 30], fmt: v => `${v}` }, variety)
  const fullWeeks = []
  {
    let n = 0
    ;[...perWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([, dates]) => {
      const got = new Set()
      for (const date of dates) {
        days.find(d => d.date === date).items.forEach(it => groupsOf(it.name).forEach(g => got.add(g)))
        if (got.size === GROUPS.length) { fullWeeks.push({ date, value: ++n }); break }
      }
    })
  }
  add({ id: 'full_body', group: 'Разное', emoji: '🦾', name: 'Всё тело', desc: `Все ${GROUPS.length} групп мышц за одну неделю`, tiers: [1, 5, 20], fmt: v => `${v} ${t('нед.')}` }, fullWeeks)
  add({ id: 'routines', group: 'Разное', emoji: '🤸', name: 'Подготовка', desc: 'Разминок и растяжек до конца', tiers: [10, 50, 100], fmt: v => `${v}` }, routineDates.map((d, i) => ({ date: d, value: i + 1 })))
  const wheel = []
  days.forEach(d => { const r = d.items.filter(it => it.base === 'Колесо для пресса').reduce((s, it) => s + it.sets.reduce((a, x) => a + (x.reps || 0), 0), 0); if (r) wheel.push({ date: d.date, value: r }) })
  add({ id: 'wheel', group: 'Разное', emoji: '🛞', name: 'Колесо 100', desc: '100 повторов на колесе за тренировку', secret: true, tiers: [100], fmt: v => `${v} ${t('повт')}` }, wheel)

  return list
}

// ── Monthly challenges ──────────────────────────────────────────────────────
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const round100 = (v) => Math.round(v / 100) * 100

// Personal tonnage goals from previous months: bronze = usual month, silver = +10 %, gold = beat the best month
export function tonnageTiers(prevMonthVolumes) {
  const prev = prevMonthVolumes.filter(v => v > 0)
  if (!prev.length) return [20000, 40000, 60000]
  const typical = median(prev.slice(-6)), best = Math.max(...prev)
  const bronze = round100(typical), silver = round100(typical * 1.1)
  const gold = best + 100 > silver ? round100(best) + 100 : round100(silver * 1.05)
  return [Math.max(100, bronze), Math.max(200, silver), Math.max(300, gold)]
}

// Weeks belonging to a month: Monday-based weeks whose Thursday falls in the month
function monthWeeks(month) {
  const first = month + '-01'
  const out = []
  for (let k = weekKey(first); ; k = addDays(k, 7)) {
    const thu = addDays(k, 3)
    if (thu.slice(0, 7) > month) break
    if (thu.slice(0, 7) === month) out.push(k)
  }
  return out
}

function monthly(month, days, recordEventsList, routineDates, volByMonth) {
  const mDays = days.filter(d => d.date.startsWith(month))
  const visits = mDays.length
  const vol = volByMonth[month] || 0
  const prevMonths = Object.keys(volByMonth).filter(m => m < month).sort()
  const weeks = monthWeeks(month)
  const perWeek = {}
  mDays.forEach(d => { const k = weekKey(d.date); perWeek[k] = (perWeek[k] || 0) + 1 })
  // Weeks overlapping the month may hold workouts from the neighbouring month too
  days.forEach(d => { const k = weekKey(d.date); if (weeks.includes(k) && !d.date.startsWith(month)) perWeek[k] = (perWeek[k] || 0) + 1 })
  const goodWeeks = weeks.filter(k => (perWeek[k] || 0) >= 2).length
  const groups = new Set(); mDays.forEach(d => d.items.forEach(it => groupsOf(it.name).forEach(g => groups.add(g))))
  const recs = recordEventsList.filter(e => e.date.startsWith(month)).length
  const routines = routineDates.filter(d => d.startsWith(month)).length

  const ch = (def, value) => ({ ...def, value, tier: def.tiers.filter(t => value >= t).length })
  return {
    month, visits, rank: getRank(visits),
    challenges: [
      ch({ id: 'tonnage', emoji: '🏋️', name: 'Поднятый вес', desc: 'Бронза — твой обычный месяц, серебро — +10 %, золото — побить лучший месяц', tiers: tonnageTiers(prevMonths.map(m => volByMonth[m])), fmt: tons }, vol),
      ch({ id: 'records', emoji: '🏆', name: 'Рекорды', desc: 'Сколько рекордов поставил за месяц', tiers: [1, 3, 5], fmt: v => `${v} ${t('рек.')}` }, recs),
      ch({ id: 'weeks', emoji: '📅', name: 'Без пропусков', desc: `Недели с 2+ тренировками (в месяце ${weeks.length} нед.)`, tiers: [2, weeks.length - 1, weeks.length], fmt: v => `${v} ${t('из')} ${weeks.length}` }, goodWeeks),
      ch({ id: 'full_body', emoji: '🦾', name: 'Всё тело', desc: 'Сколько групп мышц проработал', tiers: [5, 7, GROUPS.length], fmt: v => `${v} ${t('из')} ${GROUPS.length}` }, groups.size),
      ch({ id: 'routines', emoji: '🤸', name: 'Разминка и растяжка', desc: 'Сколько раз сделал до конца', tiers: [4, 8, 12], fmt: v => `${v} ${plural(v, ['раз', 'раза', 'раз'], ['time', 'times'])}` }, routines),
    ],
  }
}

// ── Sport classification (разряды) ──────────────────────────────────────────
// Running best of the heaviest weight actually lifted (≥1 rep) for an exercise
function liftSeries(days, name) {
  let b = 0; const s = []
  days.forEach(d => d.items.forEach(it => {
    if (it.name !== name) return
    it.sets.forEach(x => { if (x.reps > 0 && x.weight > b) { b = x.weight; s.push({ date: d.date, value: b }) } })
  }))
  return s
}
// Ranks by the classic bench press and the classic total, in the category of the latest body weight
function classification(days, bw, sex) {
  const std = STANDARDS[sex === 'female' ? 'female' : 'male']
  const bench = liftSeries(days, 'Жим лёжа'), squat = liftSeries(days, 'Приседания'), dead = liftSeries(days, 'Становая тяга')
  const totalSeries = []
  {
    const ev = [...bench.map(p => ({ ...p, k: 'b' })), ...squat.map(p => ({ ...p, k: 's' })), ...dead.map(p => ({ ...p, k: 'd' }))].sort((a, b) => a.date.localeCompare(b.date))
    const cur = { b: 0, s: 0, d: 0 }
    ev.forEach(p => { cur[p.k] = p.value; if (cur.b && cur.s && cur.d) totalSeries.push({ date: p.date, value: cur.b + cur.s + cur.d }) })
  }
  let benchE1 = 0
  days.forEach(d => d.items.forEach(it => { if (it.name === 'Жим лёжа') it.sets.forEach(x => { if (x.weight > 0 && x.reps > 0) benchE1 = Math.max(benchE1, e1rm(x.weight, x.reps)) }) }))
  const bodyWeight = bw.length ? bw[bw.length - 1].weight : null
  const lift = (id, name, series, rows, extra = {}) => {
    const best = series.length ? series[series.length - 1].value : 0
    if (!bodyWeight) return { id, name, best, ...extra }
    const row = categoryFor(rows, bodyWeight)
    const r = rankFor(row, best)
    // first date each rank was reached (in today's category)
    const earned = {}
    series.forEach(p => { const x = rankFor(row, p.value); if (x.rank) RANKS.slice(0, RANKS.indexOf(x.rank) + 1).forEach(k => { if (row.norms[k] != null && !earned[k]) earned[k] = p.date }) })
    return { id, name, best, row, ...r, earned, ...extra }
  }
  return {
    sex: sex === 'female' ? 'female' : 'male', bodyWeight,
    bench: lift('bench', 'Жим лёжа', bench, std.bench, { e1: benchE1 }),
    total: lift('total', 'Сумма троеборья', totalSeries, std.total, {
      parts: { bench: bench.length ? bench[bench.length - 1].value : 0, squat: squat.length ? squat[squat.length - 1].value : 0, dead: dead.length ? dead[dead.length - 1].value : 0 },
    }),
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────
// routineLog: { w: ['YYYY-MM-DD', ...], s: [...] } — completed warm-ups / stretches
export function computeAchievements({ rows, bodyWeights = [], routineLog = {}, today, sex = 'male' }) {
  const days = buildDays(rows)
  const bw = [...(bodyWeights || [])].sort((a, b) => a.measured_on.localeCompare(b.measured_on))
  const routineDates = [...(routineLog.w || []), ...(routineLog.s || [])].sort()
  const perm = permanent(days, bw, routineDates)

  const volByMonth = {}
  days.forEach(d => { const m = d.date.slice(0, 7); volByMonth[m] = (volByMonth[m] || 0) + d.items.reduce((s, it) => s + volume(it.sets), 0) })
  const { events } = recordEvents(days)
  const thisMonth = today.slice(0, 7)
  const current = monthly(thisMonth, days, events, routineDates, volByMonth)
  // Past months, newest first (up to 12)
  const archive = []
  if (days.length) {
    for (let m = days[0].date.slice(0, 7); m < thisMonth; m = fmtDate(new Date(+m.slice(0, 4), +m.slice(5, 7), 1)).slice(0, 7)) archive.unshift(monthly(m, days, events, routineDates, volByMonth))
  }

  // Ids of everything earned — used to celebrate only new ones
  const ids = []
  perm.forEach(a => a.earned.forEach((d, i) => d && ids.push(`p:${a.id}:${i}`)))
  ;[current, ...archive].forEach(m => {
    if (m.visits) ids.push(`m:${m.month}:rank:${m.rank.name}`)
    m.challenges.forEach(c => { for (let i = 0; i < c.tier; i++) ids.push(`m:${m.month}:${c.id}:${i}`) })
  })
  const ranks = classification(days, bw, sex)
  ;[ranks.bench, ranks.total].forEach(l => Object.keys(l.earned || {}).forEach(r => ids.push(`r:${l.id}:${r}`)))

  // Everything earned with its date, newest first (for «Последние полученные»)
  const recent = []
  perm.forEach(a => a.earned.forEach((d, i) => d && recent.push({ date: d, id: `p:${a.id}:${i}` })))
  ;[ranks.bench, ranks.total].forEach(l => Object.entries(l.earned || {}).forEach(([r, d]) => recent.push({ date: d, id: `r:${l.id}:${r}` })))
  recent.sort((a, b) => b.date.localeCompare(a.date))

  return { permanent: perm, current, archive: archive.slice(0, 12), ids, earnedCount: perm.reduce((s, a) => s + a.tier, 0), ranks, recent }
}

// Human description of an achievement id, for the celebration screen
export function describeId(id, ach) {
  const [kind, a, b, c] = id.split(':')
  if (kind === 'r') {
    const l = ach.ranks?.[a]; if (!l || !l.row) return null
    return { emoji: '🎖', title: t('Разряд выполнен: {rank}', { rank: t(RANK_NAMES[b]) }), sub: `${t(l.name)} · ${fmtW(l.row.norms[b])} · ${t('категория {cat}', { cat: l.row.label })}`, color: '#FF9F0A' }
  }
  if (kind === 'p') {
    const p = ach.permanent.find(x => x.id === a); if (!p) return null
    const ti = +b
    return { emoji: p.emoji, title: t(p.name), sub: p.tiers.length > 1 ? `${TIERS[ti].medal} ${t(TIERS[ti].name)} · ${p.fmt(p.tiers[ti])}` : t(p.desc), color: p.tiers.length > 1 ? TIERS[ti].color : '#FF9F0A' }
  }
  const m = a === ach.current.month ? ach.current : ach.archive.find(x => x.month === a)
  if (!m) return null
  if (b === 'rank') return { emoji: m.rank.icon, title: t('Ранг месяца: {rank}', { rank: t(c) }), sub: t('{n} тренировок в этом месяце', { n: m.visits }), color: '#FF9F0A' }
  const ch = m.challenges.find(x => x.id === b); if (!ch) return null
  const ti = +c
  return { emoji: TIERS[ti].medal, title: t('{tier} месяца: {name}', { tier: t(TIERS[ti].name), name: t(ch.name).toLowerCase() }), sub: ch.fmt(ch.tiers[ti]), color: TIERS[ti].color }
}
