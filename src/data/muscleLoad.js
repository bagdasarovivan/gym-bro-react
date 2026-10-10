// Расчёт нагрузки на мышцы: группы (фильтры) и детальная анатомия (карта мышц).
/* eslint-disable no-unused-vars */
import { EXERCISE_MUSCLES, GRIP_MUSCLES, normalizeName } from './exerciseCatalog'

export const MUSCLE_RECOVERY_HOURS = {
  calves:     30,
  abs:        36,
  core:       36,
  forearms:   36,
  biceps:     42,
  triceps:    42,
  shoulders:  54,
  traps:      54,
  chest:      60,
  lats:       60,
  upper_back: 60,
  lower_back: 84,
  quads:      84,
  hamstrings: 84,
  glutes:     84,
  adductors:  84,
}

// Max = recovery-based theoretical max × 1.5 buffer
// So "100%" = 1.5x the physiological limit = actual injury territory
// At 2x/week for heavy muscles: ~67% = "Отлично", not red
export const MUSCLE_MAX_MONTHLY = Object.fromEntries(
  Object.entries(MUSCLE_RECOVERY_HOURS).map(([k, v]) => [k, Math.ceil(720 / v * 1.5)])
)

// Secondary coefficient per muscle:
// lower_back acts as stabilizer — reduce to avoid red from compound movements
export const SECONDARY_COEFF_MAP = {
  lower_back: 0.15,
}

export function calcMuscleLoad(workouts, periodDays) {
  // Group by day first — one day = max 1.0 load per muscle regardless of exercise count
  const dayMuscleMap = {} // { 'YYYY-MM-DD': Map(muscle -> maxCoeff) }
  workouts.forEach(workout => {
    const date = workout.workout_date
    if (!dayMuscleMap[date]) dayMuscleMap[date] = {}
    const exName = normalizeName(workout.exercises?.name)
    const gripMatch = exName && exName.match(/^(.+) \((.+)\)$/)
    let exMuscles
    if (gripMatch && GRIP_MUSCLES[gripMatch[1]]?.[gripMatch[2]]) {
      exMuscles = GRIP_MUSCLES[gripMatch[1]][gripMatch[2]]
    } else {
      exMuscles = EXERCISE_MUSCLES[exName]
    }
    if (!exMuscles) return
    // Primary muscles get 1.0 — override any secondary already recorded
    exMuscles.primary?.forEach(m => { dayMuscleMap[date][m] = 1.0 })
    // Secondary muscles — muscle-specific coeff, only if primary hasn't claimed it today
    exMuscles.secondary?.forEach(m => {
      if (!dayMuscleMap[date][m]) dayMuscleMap[date][m] = SECONDARY_COEFF_MAP[m] ?? 0.35
    })
  })
  // Sum across days
  const muscleLoad = {}
  Object.values(dayMuscleMap).forEach(dayMuscles => {
    Object.entries(dayMuscles).forEach(([muscle, coeff]) => {
      muscleLoad[muscle] = (muscleLoad[muscle] || 0) + coeff
    })
  })
  const periodMonths = periodDays / 30
  const result = {}
  Object.entries(muscleLoad).forEach(([muscle, trainings]) => {
    const maxForPeriod = (MUSCLE_MAX_MONTHLY[muscle] || 10) * periodMonths
    const percent = Math.round((trainings / maxForPeriod) * 100)
    let label, color
    if (percent === 0)       { label = 'Нет';        color = 'none' }
    else if (percent <= 30)  { label = 'Мало';       color = 'low' }
    else if (percent <= 60)  { label = 'Норма';      color = 'normal' }
    else if (percent <= 90)  { label = 'Отлично';    color = 'good' }
    else                     { label = 'Перегрузка'; color = 'over' }
    result[muscle] = { load: Math.min(percent, 100), label, color, percent }
  })
  return result
}

// ─── ДЕТАЛЬНАЯ АНАТОМИЯ ДЛЯ КАРТЫ МЫШЦ ─────────────────────────────────────────
// Группы (EXERCISE_MUSCLES) по-прежнему используются для фильтров и списков упражнений,
// а карта мышц считает нагрузку по 29 отдельным мышцам.
export const ANATOMY_LABELS = {
  traps_upper:'Верхние трапеции', rhomboids:'Ромбовидные и средняя трапеция',
  delts_front:'Передние дельты', delts_side:'Средние дельты', delts_rear:'Задние дельты',
  rotator:'Вращатели плеча', chest_upper:'Верх груди', chest_lower:'Середина и низ груди',
  serratus:'Зубчатые', biceps:'Бицепс', brachioradialis:'Плечелучевая',
  forearm_flexors:'Сгибатели предплечья', forearm_extensors:'Разгибатели предплечья', triceps:'Трицепс',
  abs:'Прямая мышца живота', obliques:'Косые мышцы живота', hip_flexors:'Сгибатели бедра',
  lats:'Широчайшие', erectors:'Разгибатели спины',
  glutes_max:'Большая ягодичная', glutes_med:'Средняя ягодичная',
  rectus_femoris:'Прямая мышца бедра', vastus_lateralis:'Латеральная широкая (квадрицепс)',
  vastus_medialis:'Медиальная широкая («капля»)', adductors:'Приводящие',
  hamstrings:'Бицепс бедра', tibialis:'Передняя большеберцовая',
  gastrocnemius:'Икроножная', soleus:'Камбаловидная',
}

// Группа → детальные мышцы (для упражнений без своей разметки и для восстановления)
export const GROUP_TO_ANATOMY = {
  chest:['chest_upper','chest_lower'], shoulders:['delts_front','delts_side','delts_rear'],
  triceps:['triceps'], biceps:['biceps'], forearms:['brachioradialis','forearm_flexors','forearm_extensors'],
  lats:['lats'], upper_back:['rhomboids','rotator'], lower_back:['erectors'], traps:['traps_upper'],
  abs:['abs','obliques','serratus','hip_flexors'], core:['abs','obliques'],
  quads:['rectus_femoris','vastus_lateralis','vastus_medialis','adductors'],
  hamstrings:['hamstrings'], adductors:['adductors'], glutes:['glutes_max','glutes_med'], calves:['gastrocnemius','soleus','tibialis'],
}

export const ANATOMY_PARENT = {}

Object.entries(GROUP_TO_ANATOMY).forEach(([g, list]) => list.forEach(m => { if (!ANATOMY_PARENT[m]) ANATOMY_PARENT[m] = g }))

export const Q3 = 'rectus_femoris vastus_lateralis vastus_medialis'

// 'основные / вспомогательные'
export const EXERCISE_ANATOMY_SRC = {
  'Бабочка': 'chest_upper chest_lower / delts_front',
  'Сведение ног в тренажёре': 'adductors / glutes_med',
  'Разведение ног в тренажёре': 'glutes_med glutes_max /',
  'Подъём на носки стоя': 'gastrocnemius soleus /',
  'Жим гантелей сидя': 'delts_front delts_side / triceps traps_upper',
  'Гравитрон': 'lats / biceps rhomboids brachioradialis',
  'Сумо-становая тяга': 'glutes_max adductors rectus_femoris vastus_lateralis vastus_medialis / hamstrings erectors traps_upper forearm_flexors',
  'Зашагивания на тумбу': 'rectus_femoris vastus_lateralis vastus_medialis glutes_max / hamstrings glutes_med adductors',
  'Скручивания на блоке': 'abs / obliques',
  'Обратные отжимания от скамьи': 'triceps / chest_lower delts_front',
  'Тяга в рычажном тренажёре': 'lats rhomboids / biceps delts_rear traps_upper',
  'Хип-траст в тренажёре': 'glutes_max / hamstrings glutes_med adductors',
  'Боковая планка': 'obliques abs / glutes_med delts_side',
  'Велосипед на пресс': 'obliques abs / hip_flexors',
  'Подъём коленей на брусьях': 'abs hip_flexors / obliques',
  'Обратная гиперэкстензия': 'glutes_max / hamstrings erectors',
  'Пуловер на блоке': 'lats / triceps serratus delts_rear',
  'Приседания в Смите': 'rectus_femoris vastus_lateralis vastus_medialis glutes_max / hamstrings adductors',
  'Румынская тяга с гантелями': 'hamstrings glutes_max / erectors forearm_flexors',
  'Разгибание руки в наклоне': 'triceps /',
  'Фермерская прогулка': 'forearm_flexors traps_upper / abs obliques glutes_max',
  'Бёрпи': 'rectus_femoris vastus_lateralis chest_lower / delts_front triceps abs glutes_max',
  'Болгарские выпады':        `${Q3} glutes_max / hamstrings adductors glutes_med tibialis`,
  'Вертикальный жим':         'delts_front delts_side / triceps traps_upper',
  'Выпады':                   `${Q3} glutes_max / hamstrings adductors glutes_med tibialis`,
  'Гакк-приседания':          `${Q3} / glutes_max adductors`,
  'Гиперэкстензия':           'erectors / glutes_max hamstrings',
  'Жим Арнольда':             'delts_front delts_side / triceps traps_upper',
  'Жим Соца':                 `delts_front delts_side / triceps traps_upper abs ${Q3}`,
  'Жим в тренажёре на грудь': 'chest_lower / chest_upper delts_front triceps',
  'Жим гантелей лёжа':        'chest_lower / chest_upper delts_front triceps',
  'Жим гантелей наклон':      'chest_upper delts_front / chest_lower triceps',
  'Жим лёжа':                 'chest_lower / chest_upper delts_front triceps',
  'Жим над головой':          'delts_front delts_side / triceps traps_upper serratus',
  'Жим ногами':               `${Q3} glutes_max / hamstrings adductors`,
  'Жим штанги в наклоне':     'chest_upper delts_front / chest_lower triceps',
  'Изолированные сгибания на бицепс': 'biceps / brachioradialis',
  'Колесо для пресса':        'abs / obliques lats serratus hip_flexors',
  'Кроссовер':                'chest_lower / chest_upper delts_front',
  'Махи гирей':               'glutes_max hamstrings / erectors delts_front forearm_flexors',
  'Молотки':                  'brachioradialis biceps / forearm_flexors forearm_extensors',
  'Молотки лёжа':             'brachioradialis biceps / forearm_flexors forearm_extensors',
  'Обратная разводка':        'delts_rear / rhomboids rotator',
  'Отведение ноги в блоке':   'glutes_max glutes_med / hamstrings',
  'Отжимания':                'chest_lower / chest_upper delts_front triceps serratus abs',
  'Отжимания на брусьях':     'triceps chest_lower / delts_front',
  'Планка':                   'abs / obliques erectors delts_front',
  'Подтягивания':             'lats / biceps rhomboids delts_rear brachioradialis forearm_flexors',
  'Подъём гантелей на бицепс':'biceps / brachioradialis forearm_flexors',
  'Подъём на икры сидя':      'soleus / gastrocnemius',
  'Подъём ног в висе на пресс':'abs hip_flexors / obliques forearm_flexors',
  'Подъём штанги на бицепс':  'biceps / brachioradialis forearm_flexors delts_front',
  'Приседания':               `${Q3} glutes_max / adductors hamstrings erectors`,
  'Приседания с гантелью (гоблет)': `${Q3} glutes_max / adductors abs`,
  'Пуловер':                  'lats chest_lower / serratus triceps',
  'Разведение гантелей стоя': 'delts_side / traps_upper delts_front',
  'Разводка в наклоне':       'delts_rear / rhomboids rotator',
  'Разводка гантелей':        'chest_lower chest_upper / delts_front',
  'Разводка гантелей стоя':   'delts_side / traps_upper',
  'Разгибание из-за головы на трицепс': 'triceps / ',
  'Разгибание ног':           `${Q3} / `,
  'Разгибания на блоке':      'triceps / ',
  'Румынская тяга':           'hamstrings glutes_max / erectors forearm_flexors',
  'Русские скручивания':      'obliques / abs hip_flexors',
  'Сгибание ног':             'hamstrings / gastrocnemius',
  'Сгибания запястий':        'forearm_flexors / ',
  'Сгибания на блоке':        'biceps / brachioradialis forearm_flexors',
  'Сгибания на скамье Скотта':'biceps / brachioradialis',
  'Скручивания':              'abs / obliques',
  'Становая тяга':            `hamstrings glutes_max erectors / traps_upper lats rhomboids forearm_flexors ${Q3}`,
  'Тяга Т-штанги':            'lats rhomboids / delts_rear biceps traps_upper erectors',
  'Тяга вертикального блока': 'lats / biceps rhomboids delts_rear',
  'Тяга гантели в наклоне':   'lats rhomboids / delts_rear biceps',
  'Тяга горизонтального блока':'lats rhomboids / delts_rear biceps',
  'Тяга к лицу':              'delts_rear rotator / rhomboids traps_upper',
  'Тяга к подбородку':        'delts_side traps_upper / delts_front biceps',
  'Тяга штанги в наклоне':    'lats rhomboids / delts_rear biceps erectors traps_upper',
  'Французский жим':          'triceps / ',
  'Фронтальный присед':       `${Q3} glutes_max / abs erectors delts_front`,
  'Шраги':                    'traps_upper / forearm_flexors rhomboids',
  'Ягодичный мост':           'glutes_max / hamstrings glutes_med',
}

export const GRIP_ANATOMY_SRC = {
  'Тяга вертикального блока': {
    'Стандартный':'lats / biceps rhomboids delts_rear', 'Широкий':'lats / rhomboids delts_rear',
    'Узкий':'lats / biceps rhomboids', 'Обратный':'lats biceps / brachioradialis rhomboids',
  },
  'Тяга горизонтального блока': {
    'Стандартный':'lats rhomboids / biceps delts_rear', 'Широкий':'rhomboids delts_rear / lats traps_upper',
    'Узкий':'lats / rhomboids biceps', 'Обратный':'lats biceps / rhomboids',
  },
  'Подтягивания': {
    'Стандартный':'lats / biceps rhomboids delts_rear forearm_flexors', 'Широкий':'lats / rhomboids delts_rear',
    'Узкий':'lats biceps / rhomboids forearm_flexors', 'Обратный':'biceps lats / rhomboids brachioradialis',
  },
  'Тяга штанги в наклоне': {
    'Стандартный':'lats rhomboids / biceps delts_rear erectors', 'Широкий':'rhomboids delts_rear / lats traps_upper erectors',
    'Узкий':'lats / biceps rhomboids erectors', 'Обратный':'lats biceps / rhomboids erectors',
  },
  'Жим лёжа': {
    'Стандартный':'chest_lower / chest_upper delts_front triceps', 'Широкий':'chest_lower chest_upper / delts_front',
    'Узкий':'triceps / chest_lower delts_front',
  },
  'Подъём гантелей на бицепс': {
    'Обычный':'biceps / brachioradialis forearm_flexors', 'Молоток':'brachioradialis biceps / forearm_flexors forearm_extensors',
  },
  'Колесо для пресса': {
    'С колен':'abs / obliques lats serratus hip_flexors', 'Стоя':'abs / obliques lats serratus hip_flexors erectors delts_front',
  },
}

export const parseAnatomy = (str) => {
  const [p = '', s = ''] = str.split('/')
  return { primary: p.trim().split(/\s+/).filter(Boolean), secondary: s.trim().split(/\s+/).filter(Boolean) }
}

export const EXERCISE_ANATOMY = Object.fromEntries(Object.entries(EXERCISE_ANATOMY_SRC).map(([k, v]) => [k, parseAnatomy(v)]))

export const GRIP_ANATOMY = Object.fromEntries(Object.entries(GRIP_ANATOMY_SRC).map(([k, o]) =>
  [k, Object.fromEntries(Object.entries(o).map(([g, v]) => [g, parseAnatomy(v)]))]))

export const expandGroups = (groups) => [...new Set((groups || []).flatMap(g => GROUP_TO_ANATOMY[g] || []))]

export function getAnatomy(rawName) {
  const name = normalizeName(rawName)
  if (!name) return null
  if (EXERCISE_ANATOMY[name]) return EXERCISE_ANATOMY[name]
  const m = name.match(/^(.+) \((.+)\)$/)
  if (m && GRIP_ANATOMY[m[1]]?.[m[2]]) return GRIP_ANATOMY[m[1]][m[2]]
  const base = m ? m[1] : name
  if (EXERCISE_ANATOMY[base]) return EXERCISE_ANATOMY[base]
  // нет детальной разметки — раскрываем группы
  const grp = (m && GRIP_MUSCLES[m[1]]?.[m[2]]) || EXERCISE_MUSCLES[base]
  if (!grp) return null
  const primary = expandGroups(grp.primary)
  return { primary, secondary: expandGroups(grp.secondary).filter(x => !primary.includes(x)) }
}

export const ANATOMY_SECONDARY_COEFF = { erectors: 0.15 }

export function calcAnatomyLoad(workouts, periodDays) {
  const dayMap = {}
  workouts.forEach(w => {
    const a = getAnatomy(w.exercises?.name)
    if (!a) return
    const d = (dayMap[w.workout_date] = dayMap[w.workout_date] || {})
    a.primary.forEach(m => { d[m] = 1.0 })
    a.secondary.forEach(m => { if (!d[m]) d[m] = ANATOMY_SECONDARY_COEFF[m] ?? 0.35 })
  })
  const load = {}
  Object.values(dayMap).forEach(d => Object.entries(d).forEach(([m, c]) => { load[m] = (load[m] || 0) + c }))
  const periodMonths = periodDays / 30
  const result = {}
  Object.entries(load).forEach(([m, trainings]) => {
    const maxForPeriod = (MUSCLE_MAX_MONTHLY[ANATOMY_PARENT[m]] || 10) * periodMonths
    const percent = Math.round((trainings / maxForPeriod) * 100)
    let label, color
    if (percent === 0)       { label = 'Нет';        color = 'none' }
    else if (percent <= 30)  { label = 'Мало';       color = 'low' }
    else if (percent <= 60)  { label = 'Норма';      color = 'normal' }
    else if (percent <= 90)  { label = 'Отлично';    color = 'good' }
    else                     { label = 'Перегрузка'; color = 'over' }
    result[m] = { load: Math.min(percent, 100), label, color, percent }
  })
  return result
}
