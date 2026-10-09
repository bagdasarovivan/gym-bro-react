// Achievements: permanent badges with tiers plus monthly challenges.
// Everything is derived from the workout history, so past workouts count and every tier gets the real
// date it was earned. Only warm-up / stretching completions are logged separately (routineLog).
import { EXERCISE_MUSCLES, MUSCLE_FILTER_MAP, normalizeName } from './exerciseCatalog'
import { getRank } from './motivation'
import { baseExName, recordMetric, setValue } from '../utils/records'
import { fmtVolume, fmtW, locale, plural, t } from '../i18n'
import { RANKS, RANK_NAMES, STANDARDS, categoryFor } from './standards'

export const TIERS = [
  { name: 'Бронза', color: '#CD7F32', medal: '🥉' },
  { name: 'Серебро', color: '#C0C0C0', medal: '🥈' },
  { name: 'Золото', color: '#FFD700', medal: '🥇' },
  { name: 'Платина', color: '#7FDBDA', medal: '💠' },
  { name: 'Алмаз', color: '#B9F2FF', medal: '💎' },
]

// Tier look (name/colour/medal) of an achievement: sport-rank badges carry their own
export const tierOf = (a, i) => (a.tierInfo ? a.tierInfo[i] : TIERS[i])
// Colours for sport ranks, from youth ranks to МСМК
const RANK_COLORS = { 'III юн': '#8FA3B8', 'II юн': '#9DB4CC', 'I юн': '#AEC6E0', III: '#CD7F32', II: '#C0C0C0', I: '#FFD700', КМС: '#7FDBDA', МС: '#B9F2FF', МСМК: '#FF6B6B', Элита: '#C77DFF' }

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
function permanent(days, bodyWeights, routineDates, sex) {
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

  // Sport ranks as medal badges: tiers are the norms of the weight class of the latest weigh-in
  // (ЕВСК 2026 for bench and total, specialised federations for the other lifts — see standards.js)
  if (bodyWeights?.length) {
    const std = STANDARDS[sex === 'female' ? 'female' : 'male']
    const body = bodyWeights[bodyWeights.length - 1].weight
    const fullTotal = []
    {
      const ev = [...bench.map(p => ({ ...p, k: 'b' })), ...squat.map(p => ({ ...p, k: 's' })), ...dead.map(p => ({ ...p, k: 'd' }))].sort((a, b) => a.date.localeCompare(b.date))
      const cur = { b: 0, s: 0, d: 0 }
      ev.forEach(p => { cur[p.k] = p.value; if (cur.b && cur.s && cur.d) fullTotal.push({ date: p.date, value: cur.b + cur.s + cur.d }) })
    }
    // Heaviest weight (extra weight for bodyweight moves) across all variants of an exercise
    const bestByBase = (base) => {
      let b = 0; const s = []
      days.forEach(d => d.items.forEach(it => {
        if (it.base !== base) return
        it.sets.forEach(x => { if (x.reps > 0 && x.weight > b) { b = x.weight; s.push({ date: d.date, value: b }) } })
      }))
      return s
    }
    const rankBadge = (id, name, desc, series, rows) => {
      const row = categoryFor(rows, body)
      const ranks = RANKS.filter(r => row.norms[r] != null)
      add({ id, group: 'Разряды', emoji: '🎖', name, desc, cat: row.label, bodyWeight: body,
        tiers: ranks.map(r => row.norms[r]), tierInfo: ranks.map(r => ({ name: RANK_NAMES[r], color: RANK_COLORS[r], medal: '🎖' })), fmt: kg }, series)
    }
    rankBadge('rank_total', 'Разряд по сумме троеборья', 'Разрядные нормативы ЕВСК 2026 по сумме классического троеборья (присед + жим + становая) для твоей весовой категории.', fullTotal, std.total)
    rankBadge('rank_bench', 'Разряд в жиме лёжа', 'Разрядные нормативы ЕВСК 2026 по классическому жиму лёжа для твоей весовой категории. Засчитывается реально поднятый вес.', bench, std.bench)
    rankBadge('rank_squat', 'Разряд в приседе', 'Нормативы ISF (федерация стритлифтинга России), приседания без экипировки, для твоей весовой категории.', squat, std.squat)
    rankBadge('rank_deadlift', 'Разряд в становой тяге', 'Нормативы WRPF (дивизион с допинг-контролем), становая тяга без экипировки, для твоей весовой категории.', dead, std.deadlift)
    rankBadge('rank_pullup', 'Разряд в подтягиваниях с весом', 'Нормативы ISF по подтягиваниям с отягощением (классика) для твоей весовой категории. Считается дополнительный вес, любой хват.', bestByBase('Подтягивания'), std.pullup)
    rankBadge('rank_dip', 'Разряд в отжиманиях на брусьях', 'Нормативы ISF по отжиманиям на брусьях с отягощением (классика) для твоей весовой категории. Считается дополнительный вес.', bestByBase('Отжимания на брусьях'), std.dip)
    rankBadge('rank_curl', 'Разряд в подъёме на бицепс', 'Нормативы WRPF (дивизион с допинг-контролем) по строгому подъёму штанги на бицепс для твоей весовой категории.', bestByBase('Подъём штанги на бицепс'), std.curl)
  }

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

  // ── More strength (heaviest weight; extra weight for bodyweight moves) ──
  const bestOf = (base) => {
    let b = 0; const s = []
    days.forEach(d => d.items.forEach(it => {
      if (it.base !== base) return
      it.sets.forEach(x => { if (x.reps > 0 && x.weight > b) { b = x.weight; s.push({ date: d.date, value: b }) } })
    }))
    return s
  }
  const ohp = bestOf('Жим над головой'), pullW = bestOf('Подтягивания'), dipW = bestOf('Отжимания на брусьях')
  add({ id: 'ohp', group: 'Сила', emoji: '🙌', name: 'Жим стоя', desc: 'Вес в жиме штанги над головой', tiers: [40, 60, 80, 100], fmt: kg }, ohp)
  add({ id: 'db_press', group: 'Сила', emoji: '🔩', name: 'Жим гантелей', desc: 'Вес одной гантели в жиме лёжа', tiers: [30, 40, 50], fmt: kg }, bestOf('Жим гантелей лёжа'))
  add({ id: 'row', group: 'Сила', emoji: '🚣', name: 'Тяга в наклоне', desc: 'Вес в тяге штанги в наклоне', tiers: [60, 80, 100, 120], fmt: kg }, bestOf('Тяга штанги в наклоне'))
  add({ id: 'pull_w', group: 'Сила', emoji: '🧗', name: 'Подтягивания с весом', desc: 'Дополнительный вес в подтягиваниях, любой хват', tiers: [10, 20, 30, 40], fmt: v => `+${fmtW(v)}` }, pullW)
  add({ id: 'dip_w', group: 'Сила', emoji: '🤸', name: 'Брусья с весом', desc: 'Дополнительный вес в отжиманиях на брусьях', tiers: [20, 40, 60], fmt: v => `+${fmtW(v)}` }, dipW)
  add({ id: 'curl', group: 'Сила', emoji: '💪', name: 'Бицепс штангой', desc: 'Вес в подъёме штанги на бицепс', tiers: [40, 50, 60], fmt: kg }, bestOf('Подъём штанги на бицепс'))
  add({ id: 'glute', group: 'Сила', emoji: '🍑', name: 'Ягодичный мост', desc: 'Вес в ягодичном мосте', tiers: [100, 150, 200], fmt: kg }, bestOf('Ягодичный мост'))
  add({ id: 'club', group: 'Сила', emoji: '🎯', name: 'Клуб 1000 фунтов', desc: 'Сумма троеборья: 1000 lb ≈ 454 кг, затем 1200 lb ≈ 544 кг', tiers: [453.59, 544.31], fmt: kg }, total)

  // ── More relative strength ──
  add({ id: 'bw_bench2', group: 'Сила к весу', emoji: '⚖️', name: 'Жим полтора веса', desc: needBW ? 'Добавь вес тела в 🧍, чтобы считать' : 'Жим лёжа ≥ 1,25 и 1,5 веса тела', tiers: [1.25, 1.5], fmt: x }, rel(bench))
  add({ id: 'bw_squat2', group: 'Сила к весу', emoji: '⚖️', name: 'Присед два веса', desc: needBW ? 'Добавь вес тела в 🧍, чтобы считать' : 'Присед ≥ 2 весов тела', tiers: [2], fmt: x }, rel(squat))
  add({ id: 'bw_dead2', group: 'Сила к весу', emoji: '⚖️', name: 'Становая два с половиной', desc: needBW ? 'Добавь вес тела в 🧍, чтобы считать' : 'Становая ≥ 2,5 веса тела', tiers: [2.5], fmt: x }, rel(dead))
  add({ id: 'bw_pull', group: 'Сила к весу', emoji: '⚖️', name: 'Подтягивания с полувесом', desc: needBW ? 'Добавь вес тела в 🧍, чтобы считать' : 'Дополнительный вес в подтягиваниях ≥ половины веса тела', tiers: [0.5], fmt: x }, rel(pullW))

  // ── Endurance ──
  const repsOf = (base) => {
    let b = 0; const s = []
    days.forEach(d => d.items.forEach(it => { if (it.base !== base) return; it.sets.forEach(x => { if ((x.reps || 0) > b) { b = x.reps; s.push({ date: d.date, value: b }) } }) }))
    return s
  }
  const reps = v => `${v} ${t('повт')}`
  add({ id: 'dip_reps', group: 'Выносливость', emoji: '🤸', name: 'Мастер брусьев', desc: 'Отжиманий на брусьях за один подход', tiers: [15, 25, 40], fmt: reps }, repsOf('Отжимания на брусьях'))
  add({ id: 'pushup_reps', group: 'Выносливость', emoji: '🫸', name: 'Отжимания', desc: 'Отжиманий от пола за один подход', tiers: [30, 50, 75], fmt: reps }, repsOf('Отжимания'))
  {
    // Bench press with at least the body weight on the bar, most reps in one set
    let b = 0; const s = []
    if (!needBW) days.forEach(d => { const bw = bodyWeightAt(bodyWeights, d.date); d.items.forEach(it => { if (it.base !== 'Жим лёжа') return; it.sets.forEach(x => { if (x.weight >= bw && (x.reps || 0) > b) { b = x.reps; s.push({ date: d.date, value: b }) } }) }) })
    add({ id: 'bw_bench_reps', group: 'Выносливость', emoji: '🔁', name: 'Свой вес на повторы', desc: needBW ? 'Добавь вес тела в 🧍, чтобы считать' : 'Жим лёжа своего веса на 5 и на 10 повторов', tiers: [5, 10], fmt: reps }, s)
  }
  {
    // Most reps of one exercise (all variants together) in one workout
    let b = 0; const s = []
    days.forEach(d => {
      const per = {}
      d.items.forEach(it => { per[it.base] = (per[it.base] || 0) + it.sets.reduce((a, x) => a + (x.reps || 0), 0) })
      const m = Math.max(0, ...Object.values(per))
      if (m > b) { b = m; s.push({ date: d.date, value: b }) }
    })
    add({ id: 'hundred', group: 'Выносливость', emoji: '💯', name: 'Сотка', desc: 'Повторов одного упражнения за тренировку', tiers: [100, 200], fmt: reps }, s)
  }
  let repAcc = 0
  add({ id: 'all_reps', group: 'Выносливость', emoji: '🔢', name: 'Тысячи повторов', desc: 'Повторов за всё время', tiers: [1000, 10000, 50000], fmt: reps },
    days.map(d => ({ date: d.date, value: (repAcc += d.items.reduce((a, it) => a + it.sets.reduce((q, x) => q + (x.reps || 0), 0), 0)) })))

  // ── More consistency ──
  {
    // Chain of workouts with gaps of at most 2 days (every other day or more often)
    const s = []; let n = 0, best = 0, cur = 0
    days.forEach((d, i) => {
      n = i && (parse(d.date) - parse(days[i - 1].date)) / DAY <= 2 ? n + 1 : 1
      if (n > best) { best = n; s.push({ date: d.date, value: n }) }
    })
    if (days.length) cur = (parse(fmtDate(new Date())) - parse(days[days.length - 1].date)) / DAY <= 2 ? n : 0
    add({ id: 'chain', group: 'Постоянство', emoji: '⛓️', name: 'Через день', desc: 'Тренировок подряд с перерывом не больше одного дня', tiers: [5, 10, 20, 30], fmt: v => `${v} ${t('тр.')}` }, s, { current: Math.max(cur, 0) })
  }
  {
    const s = []; let b = 0
    ;[...perWeek.entries()].sort(([a], [c]) => a.localeCompare(c)).forEach(([, dates]) => { if (dates.length > b) { b = dates.length; s.push({ date: dates[dates.length - 1], value: b }) } })
    add({ id: 'week_max', group: 'Постоянство', emoji: '🗓️', name: 'Ударная неделя', desc: 'Тренировок за одну неделю', tiers: [4, 5, 6], fmt: v => `${v} ${t('тр.')}` }, s)
  }
  {
    // Consecutive calendar months with 8+ workouts (the current month does not break the run)
    const perMonth = {}
    days.forEach(d => { const m = d.date.slice(0, 7); (perMonth[m] = perMonth[m] || []).push(d.date) })
    const s = []; let run = 0, cur = 0
    if (days.length) {
      const nowM = fmtDate(new Date()).slice(0, 7)
      for (let m = days[0].date.slice(0, 7); m <= nowM; m = fmtDate(new Date(+m.slice(0, 4), +m.slice(5, 7), 1)).slice(0, 7)) {
        const ds = perMonth[m] || []
        if (ds.length >= 8) { run++; s.push({ date: ds[7], value: run }) } else if (m !== nowM) run = 0
      }
      cur = run
    }
    add({ id: 'months8', group: 'Постоянство', emoji: '📆', name: 'Месяц за месяцем', desc: 'Месяцев подряд, в каждом 8+ тренировок', tiers: [2, 3, 6, 12], fmt: v => `${v} ${t('мес.')}` }, s, { current: cur })
  }
  {
    const s = []
    if (days.length) {
      const today = fmtDate(new Date()), f = parse(days[0].date)
      for (let y = 1; y <= 5; y++) { const d = fmtDate(new Date(f.getFullYear() + y, f.getMonth(), f.getDate())); if (d <= today) s.push({ date: d, value: y }) }
    }
    add({ id: 'anniversary', group: 'Постоянство', emoji: '🎂', name: 'Годовщина', desc: 'Лет с первой тренировки', tiers: [1, 2, 3], fmt: v => `${v} ${plural(v, ['год', 'года', 'лет'], ['year', 'years'])}` }, s)
  }
  {
    const s = []
    days.forEach((d, i) => { if (i && (parse(d.date) - parse(days[i - 1].date)) / DAY >= 14) s.push({ date: d.date, value: s.length + 1 }) })
    add({ id: 'comeback', group: 'Постоянство', emoji: '🔄', name: 'Возвращение', desc: 'Вернулся в зал после перерыва в 2 недели и больше', secret: true, tiers: [1], fmt: v => `${v}` }, s)
  }

  // ── More volume ──
  const setCount = (it) => it.sets.filter(x => (x.reps || 0) > 0 || (x.time_sec || 0) > 0).length
  add({ id: 'day_sets', group: 'Объём', emoji: '📋', name: 'Много подходов', desc: 'Подходов за одну тренировку', tiers: [20, 30, 40], fmt: v => `${v} ${t('подх.')}` },
    days.map(d => ({ date: d.date, value: d.items.reduce((a, it) => a + setCount(it), 0) })))
  let setAcc = 0
  add({ id: 'all_sets', group: 'Объём', emoji: '🧱', name: 'Подход за подходом', desc: 'Подходов за всё время', tiers: [250, 1000, 5000, 10000], fmt: v => `${v} ${t('подх.')}` },
    days.map(d => ({ date: d.date, value: (setAcc += d.items.reduce((a, it) => a + setCount(it), 0)) })))
  {
    const wk = {}, mo = {}, ws = [], ms = []
    dayVol.forEach(p => {
      const k = weekKey(p.date), m = p.date.slice(0, 7)
      wk[k] = (wk[k] || 0) + p.value; mo[m] = (mo[m] || 0) + p.value
      ws.push({ date: p.date, value: wk[k] }); ms.push({ date: p.date, value: mo[m] })
    })
    add({ id: 'week_tonnage', group: 'Объём', emoji: '🚚', name: 'Тяжёлая неделя', desc: 'Тоннаж за одну неделю', tiers: [20000, 40000, 60000], fmt: tons }, ws)
    add({ id: 'month_tonnage', group: 'Объём', emoji: '🏗️', name: 'Тяжёлый месяц', desc: 'Тоннаж за один месяц', tiers: [100000, 200000, 300000], fmt: tons }, ms)
  }

  // ── More records ──
  {
    const perDay = {}, s = []; let b = 0
    events.forEach(e => { perDay[e.date] = (perDay[e.date] || 0) + 1 })
    Object.keys(perDay).sort().forEach(d => { if (perDay[d] > b) { b = perDay[d]; s.push({ date: d, value: b }) } })
    add({ id: 'pr_day', group: 'Рекорды', emoji: '⚡', name: 'Рекордный день', desc: 'Рекордов за одну тренировку', tiers: [3, 5], fmt: v => `${v} ${t('рек.')}` }, s)
    const names = new Set(), s2 = []
    events.forEach(e => { if (!names.has(e.name)) { names.add(e.name); s2.push({ date: e.date, value: names.size }) } })
    add({ id: 'pr_wide', group: 'Рекорды', emoji: '🌐', name: 'Рекорды везде', desc: 'Разных упражнений, в которых побит рекорд', tiers: [10, 20], fmt: v => `${v}` }, s2)
  }
  {
    // Bench press gain over the heaviest weight of the first bench workout
    const first = days.find(d => d.items.some(it => it.name === 'Жим лёжа'))
    const base = first ? Math.max(0, ...first.items.filter(it => it.name === 'Жим лёжа').flatMap(it => it.sets.filter(x => x.reps > 0).map(x => x.weight || 0))) : 0
    add({ id: 'bench_gain', group: 'Рекорды', emoji: '📈', name: 'Прибавка в жиме', desc: 'На сколько вырос жим лёжа с первой записи', tiers: [10, 20, 30], fmt: v => `+${fmtW(v)}` }, bench.map(p => ({ date: p.date, value: p.value - base })).filter(p => p.value > 0))
  }

  // ── Fun ──
  {
    const at = (pred) => { for (const d of days) for (const it of d.items) if (it.sets.some(x => pred(x, it))) return [{ date: d.date, value: 1 }]; return [] }
    add({ id: 'dozen13', group: 'Забавные', emoji: '🃏', name: 'Чёртова дюжина', desc: 'Подход ровно на 13 повторов', secret: true, tiers: [1], fmt: v => `${v}` }, at(x => x.reps === 13))
    add({ id: 'even100', group: 'Забавные', emoji: '🎱', name: 'Ровный счёт', desc: 'Подход ровно со 100 кг', tiers: [1], fmt: v => `${v}` }, at(x => x.reps > 0 && x.weight === 100))
    // Every catalogue exercise of a muscle group done at least once
    const byGroup = {}
    Object.keys(EXERCISE_MUSCLES).forEach(n => groupsOf(n).forEach(g => (byGroup[g] = byGroup[g] || new Set()).add(n)))
    const done = new Set(), complete = new Set(), s = []
    days.forEach(d => d.items.forEach(it => {
      done.add(it.base)
      GROUPS.forEach(g => { if (!complete.has(g) && byGroup[g]?.size && [...byGroup[g]].every(n => done.has(n))) { complete.add(g); s.push({ date: d.date, value: complete.size }) } })
    }))
    add({ id: 'collector', group: 'Забавные', emoji: '🗂️', name: 'Коллекционер', desc: 'Групп мышц, в которых сделал все упражнения из каталога', tiers: [1, 3, 6], fmt: v => `${v} ${t('из')} ${GROUPS.length}` }, s)
    // Weeks where chest, back, legs and shoulders were all trained
    const BIG = ['chest', 'back', 'legs', 'shoulders'], s2 = []; let n = 0
    ;[...perWeek.entries()].sort(([a], [c]) => a.localeCompare(c)).forEach(([, dates]) => {
      const got = new Set()
      for (const date of dates) {
        days.find(d => d.date === date).items.forEach(it => groupsOf(it.name).forEach(g => got.add(g)))
        if (BIG.every(g => got.has(g))) { s2.push({ date, value: ++n }); break }
      }
    })
    add({ id: 'balanced', group: 'Забавные', emoji: '☯️', name: 'Сбалансированный', desc: 'Недель, в которых проработаны грудь, спина, ноги и плечи', tiers: [1, 10, 25], fmt: v => `${v} ${t('нед.')}` }, s2)
  }

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

// Challenge pool: each month gets CH_PER_MONTH of them (seeded per user and month, stored in user_metadata
// once shown); up to MAX_SWAPS challenges without a medal can be swapped per month.
// Months before ROTATION_START keep the original fixed set so their medals do not change.
export const CH_PER_MONTH = 5
export const MAX_SWAPS = 3
export const ROTATION_START = '2026-10'
const LEGACY_IDS = ['tonnage', 'records', 'weeks', 'full_body', 'routines']
export const POOL_IDS = ['tonnage', 'records', 'weeks', 'full_body', 'routines', 'visits', 'sets', 'reps', 'new_ex', 'big3', 'heavy_day', 'pull_total', 'legs', 'variety', 'chain', 'weekend', 'push_total']

// Small deterministic PRNG (FNV-1a hash + xorshift-multiply mix)
function rng(seedStr) {
  let h = 2166136261
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296 }
}
const shuffled = (arr, seedStr) => { const r = rng(seedStr), a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

// Default pick for a month: avoids last month's challenges when possible; `keep` ids stay in
export function pickChallenges(month, seed, avoid = [], keep = []) {
  const order = shuffled(POOL_IDS, `${seed}:${month}`)
  const out = [...keep]
  for (const id of order.filter(x => !avoid.includes(x)).concat(order.filter(x => avoid.includes(x)))) {
    if (out.length >= CH_PER_MONTH) break
    if (!out.includes(id)) out.push(id)
  }
  return out
}

// Replace challenge `idx` of the current month; returns the new stored state or null when not allowed
export function swapChallenge(current, idx, seed) {
  const used = current.swaps || 0
  const c = current.challenges[idx]
  if (!c || c.tier > 0 || used >= MAX_SWAPS) return null
  const ids = current.challenges.map(x => x.id)
  const out = [...(current.out || []), c.id]
  const cand = shuffled(POOL_IDS, `${seed}:${current.month}:swap${used + 1}`).find(x => !ids.includes(x) && !out.includes(x))
    || POOL_IDS.find(x => !ids.includes(x))
  if (!cand) return null
  ids[idx] = cand
  return { ids, swaps: used + 1, out }
}

function monthly(month, days, recordEventsList, routineDates, volByMonth, ids) {
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
  const mEvents = recordEventsList.filter(e => e.date.startsWith(month))
  const routines = routineDates.filter(d => d.startsWith(month)).length

  const repsOf = (pred) => mDays.reduce((s, d) => s + d.items.filter(pred).reduce((a, it) => a + it.sets.reduce((q, x) => q + (x.reps || 0), 0), 0), 0)
  const setsN = mDays.reduce((s, d) => s + d.items.reduce((a, it) => a + it.sets.filter(x => (x.reps || 0) > 0 || (x.time_sec || 0) > 0).length, 0), 0)
  const firstSeen = {}
  days.forEach(d => d.items.forEach(it => { if (!firstSeen[it.base]) firstSeen[it.base] = d.date }))
  const newEx = Object.values(firstSeen).filter(d => d.startsWith(month)).length
  const big3 = new Set(mEvents.filter(e => ['Жим лёжа', 'Приседания', 'Становая тяга'].includes(e.name)).map(e => e.name)).size
  const dayVols = mDays.map(d => d.items.reduce((a, it) => a + volume(it.sets), 0))
  const prevDayVols = days.filter(d => d.date < month).map(d => d.items.reduce((a, it) => a + volume(it.sets), 0)).filter(v => v > 0).sort((x, y) => x - y)
  const q = (f) => prevDayVols[Math.min(prevDayVols.length - 1, Math.floor(prevDayVols.length * f))]
  const heavyTiers = prevDayVols.length >= 5
    ? [round100(q(0.5)), round100(q(0.8)), round100(prevDayVols[prevDayVols.length - 1]) + 100]
    : [5000, 8000, 12000]
  let chain = 0
  { let n = 0; mDays.forEach((d, i) => { n = i && (parse(d.date) - parse(mDays[i - 1].date)) / DAY <= 2 ? n + 1 : 1; chain = Math.max(chain, n) }) }
  const weekend = mDays.filter(d => [0, 6].includes(parse(d.date).getDay())).length
  const variety = new Set(mDays.flatMap(d => d.items.map(it => it.base))).size
  const legs = mDays.filter(d => d.items.some(it => groupsOf(it.name).includes('legs'))).length
  const times = v => `${v} ${plural(v, ['раз', 'раза', 'раз'], ['time', 'times'])}`
  const tr = v => `${v} ${t('тр.')}`
  const reps = v => `${v} ${t('повт')}`

  const DEFS = {
    tonnage: [{ emoji: '🏋️', name: 'Поднятый вес', desc: 'Бронза — твой обычный месяц, серебро — +10 %, золото — побить лучший месяц', tiers: tonnageTiers(prevMonths.map(m => volByMonth[m])), fmt: tons }, vol],
    records: [{ emoji: '🏆', name: 'Рекорды', desc: 'Сколько рекордов поставил за месяц', tiers: [1, 3, 5], fmt: v => `${v} ${t('рек.')}` }, mEvents.length],
    weeks: [{ emoji: '📅', name: 'Без пропусков', desc: `Недели с 2+ тренировками (в месяце ${weeks.length} нед.)`, tiers: [2, weeks.length - 1, weeks.length], fmt: v => `${v} ${t('из')} ${weeks.length}` }, goodWeeks],
    full_body: [{ emoji: '🦾', name: 'Всё тело', desc: 'Сколько групп мышц проработал', tiers: [5, 7, GROUPS.length], fmt: v => `${v} ${t('из')} ${GROUPS.length}` }, groups.size],
    routines: [{ emoji: '🤸', name: 'Разминка и растяжка', desc: 'Сколько раз сделал до конца', tiers: [4, 8, 12], fmt: times }, routines],
    visits: [{ emoji: '🗓️', name: 'Регулярность', desc: 'Тренировок за месяц', tiers: [8, 12, 16], fmt: tr }, visits],
    sets: [{ emoji: '📋', name: 'Подходы', desc: 'Подходов за месяц', tiers: [100, 150, 200], fmt: v => `${v} ${t('подх.')}` }, setsN],
    reps: [{ emoji: '🔢', name: 'Повторения', desc: 'Повторов за месяц', tiers: [1000, 1500, 2000], fmt: reps }, repsOf(() => true)],
    new_ex: [{ emoji: '🆕', name: 'Новенькое', desc: 'Упражнений, которые делаешь впервые', tiers: [1, 2, 3], fmt: v => `${v}` }, newEx],
    big3: [{ emoji: '🏛️', name: 'Большая тройка', desc: 'Рекорды в жиме, приседе и становой: сколько из трёх', tiers: [1, 2, 3], fmt: v => `${v} ${t('из')} 3` }, big3],
    heavy_day: [{ emoji: '🚛', name: 'Тяжёлый день', desc: 'Тоннаж за одну тренировку; пороги — от твоих прошлых тренировок', tiers: heavyTiers, fmt: tons }, Math.max(0, ...dayVols)],
    pull_total: [{ emoji: '🧗', name: 'Турник', desc: 'Подтягиваний за месяц', tiers: [100, 200, 300], fmt: reps }, repsOf(it => it.base === 'Подтягивания')],
    legs: [{ emoji: '🦵', name: 'Не пропускай ноги', desc: 'Тренировок с упражнениями на ноги', tiers: [4, 6, 8], fmt: tr }, legs],
    variety: [{ emoji: '🎨', name: 'Разнообразие', desc: 'Разных упражнений за месяц', tiers: [10, 15, 20], fmt: v => `${v}` }, variety],
    chain: [{ emoji: '⛓️', name: 'Через день', desc: 'Тренировок подряд с перерывом не больше одного дня', tiers: [4, 6, 8], fmt: tr }, chain],
    weekend: [{ emoji: '🌤️', name: 'Выходные в зале', desc: 'Тренировок в субботу и воскресенье', tiers: [2, 4, 6], fmt: tr }, weekend],
    push_total: [{ emoji: '🫸', name: 'Отжимания', desc: 'Отжиманий от пола и на брусьях за месяц', tiers: [150, 300, 500], fmt: reps }, repsOf(it => it.base === 'Отжимания' || it.base === 'Отжимания на брусьях')],
  }
  const ch = (id) => { const [def, value] = DEFS[id]; return { id, ...def, value, tier: def.tiers.filter(x => value >= x).length } }
  return { month, visits, rank: getRank(visits), challenges: ids.filter(id => DEFS[id]).map(ch) }
}

// ── Entry point ─────────────────────────────────────────────────────────────
// routineLog: { w: ['YYYY-MM-DD', ...], s: [...] } — completed warm-ups / stretches
// monthPicks: { 'YYYY-MM': { ids, swaps, out } } stored challenge choice per month; seed: per-user string
export function computeAchievements({ rows, bodyWeights = [], routineLog = {}, today, sex = 'male', monthPicks = {}, seed = '' }) {
  const days = buildDays(rows)
  const bw = [...(bodyWeights || [])].sort((a, b) => a.measured_on.localeCompare(b.measured_on))
  const routineDates = [...(routineLog.w || []), ...(routineLog.s || [])].sort()
  const perm = permanent(days, bw, routineDates, sex)

  const volByMonth = {}
  days.forEach(d => { const m = d.date.slice(0, 7); volByMonth[m] = (volByMonth[m] || 0) + d.items.reduce((s, it) => s + volume(it.sets), 0) })
  const { events } = recordEvents(days)
  const thisMonth = today.slice(0, 7)
  // Challenge ids of a month: stored choice, else the legacy set (old months) or a seeded pick
  const prevMonth = (m) => fmtDate(new Date(+m.slice(0, 4), +m.slice(5, 7) - 2, 1)).slice(0, 7)
  const idsCache = {}
  const idsFor = (m) => {
    if (idsCache[m]) return idsCache[m]
    const stored = monthPicks?.[m]?.ids
    let ids
    if (Array.isArray(stored) && stored.length) ids = stored
    else if (m < ROTATION_START) ids = LEGACY_IDS
    else {
      // First rotating month: keep the old challenges that already have a medal
      const keep = m === ROTATION_START ? monthly(m, days, events, routineDates, volByMonth, LEGACY_IDS).challenges.filter(c => c.tier > 0).map(c => c.id) : []
      ids = pickChallenges(m, seed, m > ROTATION_START ? idsFor(prevMonth(m)) : LEGACY_IDS, keep)
    }
    return (idsCache[m] = ids)
  }
  const current = monthly(thisMonth, days, events, routineDates, volByMonth, idsFor(thisMonth))
  current.swaps = monthPicks?.[thisMonth]?.swaps || 0
  current.out = monthPicks?.[thisMonth]?.out || []
  current.needsSave = !monthPicks?.[thisMonth]?.ids?.length
  // Past months, newest first
  const archive = []
  if (days.length) {
    for (let m = days[0].date.slice(0, 7); m < thisMonth; m = fmtDate(new Date(+m.slice(0, 4), +m.slice(5, 7), 1)).slice(0, 7)) archive.unshift(monthly(m, days, events, routineDates, volByMonth, idsFor(m)))
  }
  // Medals from monthly challenges over all months (the highest tier of each challenge counts)
  const monthMedals = [0, 0, 0]
  ;[current, ...archive].forEach(m => m.challenges.forEach(c => { if (c.tier) monthMedals[c.tier - 1]++ }))

  // Ids of everything earned — used to celebrate only new ones
  const ids = []
  const idDates = {}
  perm.forEach(a => a.earned.forEach((d, i) => { if (d) { ids.push(`p:${a.id}:${i}`); idDates[`p:${a.id}:${i}`] = d } }))
  ;[current, ...archive].forEach(m => {
    if (m.visits) ids.push(`m:${m.month}:rank:${m.rank.name}`)
    m.challenges.forEach(c => { for (let i = 0; i < c.tier; i++) ids.push(`m:${m.month}:${c.id}:${i}`) })
  })
  return { permanent: perm, current, archive: archive.slice(0, 12), monthMedals, ids, idDates, earnedCount: perm.reduce((s, a) => s + a.tier, 0) }
}

// Human description of an achievement id, for the celebration screen
export function describeId(id, ach) {
  const [kind, a, b, c] = id.split(':')
  if (kind === 'p') {
    const p = ach.permanent.find(x => x.id === a); if (!p) return null
    const ti = +b
    const ti_ = tierOf(p, ti)
    return { emoji: p.emoji, title: t(p.name), sub: p.tiers.length > 1 ? `${ti_.medal} ${t(ti_.name)} · ${p.fmt(p.tiers[ti])}` : t(p.desc), color: p.tiers.length > 1 ? ti_.color : '#FF9F0A' }
  }
  const m = a === ach.current.month ? ach.current : ach.archive.find(x => x.month === a)
  if (!m) return null
  if (b === 'rank') return { emoji: m.rank.icon, title: t('Ранг месяца: {rank}', { rank: t(c) }), sub: t('{n} тренировок в этом месяце', { n: m.visits }), color: '#FF9F0A' }
  const ch = m.challenges.find(x => x.id === b); if (!ch) return null
  const ti = +c
  return { emoji: TIERS[ti].medal, title: t('{tier} месяца: {name}', { tier: t(TIERS[ti].name), name: t(ch.name).toLowerCase() }), sub: ch.fmt(ch.tiers[ti]), color: TIERS[ti].color }
}
