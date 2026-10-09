// Планы тренировок (Сила / Масса / Рельеф / Форма) по дням.
/* eslint-disable no-unused-vars */

// ─── PLAN DEFINITIONS ───────────────────────────────────────────────────────
export const PLAN_ICONS = { strength:'🏋️', mass:'💪', cut:'🔥', fit:'🤸' }

export const PLAN_NAMES = { strength:'Сила', mass:'Масса', cut:'Рельеф', fit:'Форма' }

export const PLAN_DESC  = { strength:'5×5, база', mass:'8–12 повт', cut:'12–15', fit:'Баланс' }

export const PLAN_DAYS = {
  strength: [
    {
      label:'День А — Верх тела',
      warmupHint:'плечи, грудь, поясница',
      exercises:[
        {name:'Жим лёжа',           sets:5, reps:5,  isBase:true},
        {name:'Тяга штанги в наклоне',sets:5, reps:5,  isBase:true},
        {name:'Жим гантелей наклон', sets:3, reps:8,  isBase:false},
        {name:'Тяга горизонтального блока',sets:3,reps:10,isBase:false},
        {name:'Французский жим',     sets:3, reps:10, isBase:false},
        {name:'Подъём гантелей на бицепс',sets:3,reps:10,isBase:false},
      ]
    },
    {
      label:'День Б — Низ тела',
      warmupHint:'ноги, поясница, бёдра',
      exercises:[
        {name:'Приседания',          sets:5, reps:5,  isBase:true},
        {name:'Румынская тяга',      sets:4, reps:8,  isBase:true},
        {name:'Жим ногами',          sets:4, reps:10, isBase:false},
        {name:'Сгибание ног',        sets:3, reps:12, isBase:false},
        {name:'Подъём на икры сидя', sets:4, reps:15, isBase:false},
      ]
    }
  ],
  mass: [
    {
      label:'День А — Push',
      warmupHint:'плечи, грудь',
      exercises:[
        {name:'Жим лёжа',              sets:4, reps:10, isBase:true},
        {name:'Жим гантелей наклон',   sets:3, reps:12, isBase:false},
        {name:'Жим Арнольда',          sets:3, reps:12, isBase:false},
        {name:'Разведение гантелей стоя',sets:3,reps:15,isBase:false},
        {name:'Отжимания на брусьях',  sets:3, reps:12, isBase:false},
        {name:'Разгибания на блоке',   sets:3, reps:15, isBase:false},
      ]
    },
    {
      label:'День Б — Pull',
      warmupHint:'плечи, спина',
      exercises:[
        {name:'Тяга штанги в наклоне',    sets:4,reps:10,isBase:true},
        {name:'Тяга вертикального блока', sets:3,reps:12,isBase:false},
        {name:'Тяга горизонтального блока',sets:3,reps:12,isBase:false},
        {name:'Тяга к лицу',             sets:3,reps:15,isBase:false},
        {name:'Подъём гантелей на бицепс',sets:3,reps:12,isBase:false},
        {name:'Молотки',                  sets:3,reps:12,isBase:false},
      ]
    },
    {
      label:'День В — Ноги',
      warmupHint:'ноги, бёдра, поясница',
      exercises:[
        {name:'Приседания',          sets:4,reps:10,isBase:true},
        {name:'Румынская тяга',      sets:4,reps:10,isBase:false},
        {name:'Жим ногами',          sets:3,reps:12,isBase:false},
        {name:'Болгарские выпады',   sets:3,reps:12,isBase:false},
        {name:'Сгибание ног',        sets:3,reps:15,isBase:false},
        {name:'Подъём на икры сидя', sets:4,reps:20,isBase:false},
      ]
    }
  ],
  cut: [
    {
      label:'День А — Верх + Пресс',
      warmupHint:'всё тело, 5 мин кардио',
      exercises:[
        {name:'Жим лёжа',                    sets:3,reps:15,isBase:false},
        {name:'Тяга горизонтального блока',   sets:3,reps:15,isBase:false},
        {name:'Жим гантелей наклон',          sets:3,reps:15,isBase:false},
        {name:'Тяга вертикального блока',     sets:3,reps:15,isBase:false},
        {name:'Разведение гантелей стоя',     sets:3,reps:15,isBase:false},
        {name:'Тяга к лицу',                 sets:3,reps:15,isBase:false},
        {name:'Скручивания',                  sets:3,reps:20,isBase:false},
        {name:'Планка',                       sets:3,reps:45,isBase:false},
      ]
    },
    {
      label:'День Б — Низ + Кардио',
      warmupHint:'ноги, 5 мин прыжки',
      exercises:[
        {name:'Приседания',          sets:4,reps:15,isBase:false},
        {name:'Сгибание ног',        sets:4,reps:15,isBase:false},
        {name:'Болгарские выпады',   sets:3,reps:12,isBase:false},
        {name:'Жим ногами',          sets:3,reps:20,isBase:false},
        {name:'Подъём на икры сидя', sets:4,reps:20,isBase:false},
        {name:'Подъём ног в висе на пресс',sets:3,reps:15,isBase:false},
      ]
    },
    {
      label:'День В — Всё тело',
      warmupHint:'5 мин кардио',
      exercises:[
        {name:'Жим над головой',       sets:3,reps:15,isBase:false},
        {name:'Тяга штанги в наклоне', sets:3,reps:15,isBase:false},
        {name:'Махи гирей',            sets:4,reps:15,isBase:false},
        {name:'Выпады',                sets:3,reps:12,isBase:false},
        {name:'Отжимания',             sets:3,reps:0, isBase:false},
        {name:'Русские скручивания',   sets:3,reps:20,isBase:false},
      ]
    }
  ],
  fit: [
    {
      label:'День А',
      warmupHint:'всё тело',
      exercises:[
        {name:'Приседания',                sets:3,reps:12,isBase:false},
        {name:'Жим гантелей лёжа',         sets:3,reps:12,isBase:false},
        {name:'Тяга вертикального блока',  sets:3,reps:12,isBase:false},
        {name:'Жим Арнольда',              sets:3,reps:12,isBase:false},
        {name:'Гиперэкстензия',            sets:3,reps:15,isBase:false},
        {name:'Планка',                    sets:3,reps:30,isBase:false},
      ]
    },
    {
      label:'День Б',
      warmupHint:'всё тело',
      exercises:[
        {name:'Румынская тяга',              sets:3,reps:12,isBase:false},
        {name:'Жим гантелей наклон',         sets:3,reps:12,isBase:false},
        {name:'Тяга горизонтального блока',  sets:3,reps:12,isBase:false},
        {name:'Разведение гантелей стоя',    sets:3,reps:15,isBase:false},
        {name:'Подъём гантелей на бицепс',   sets:2,reps:12,isBase:false},
        {name:'Разгибания на блоке',         sets:2,reps:12,isBase:false},
        {name:'Скручивания',                 sets:3,reps:15,isBase:false},
      ]
    },
    {
      label:'День В',
      warmupHint:'всё тело',
      exercises:[
        {name:'Выпады',                    sets:3,reps:12,isBase:false},
        {name:'Отжимания',                 sets:3,reps:0, isBase:false},
        {name:'Тяга гантели в наклоне',    sets:3,reps:12,isBase:false},
        {name:'Тяга к лицу',              sets:3,reps:15,isBase:false},
        {name:'Молотки',                   sets:2,reps:12,isBase:false},
        {name:'Французский жим',           sets:2,reps:12,isBase:false},
        {name:'Подъём ног в висе на пресс',sets:3,reps:12,isBase:false},
      ]
    }
  ]
}

// ─── NEW PROGRAMS ────────────────────────────────────────────────────────────
Object.assign(PLAN_DAYS, {
  fullbody: [
    { label: 'День А — Всё тело', warmupHint: 'всё тело, плечи', exercises: [
      { name: 'Приседания', sets: 3, reps: 8, isBase: true },
      { name: 'Жим лёжа', sets: 3, reps: 8, isBase: true },
      { name: 'Тяга вертикального блока', sets: 3, reps: 10, isBase: false },
      { name: 'Жим над головой', sets: 3, reps: 10, isBase: false },
      { name: 'Планка', sets: 3, reps: 45, isBase: false },
    ] },
    { label: 'День Б — Всё тело', warmupHint: 'поясница, бёдра, плечи', exercises: [
      { name: 'Становая тяга', sets: 3, reps: 5, isBase: true },
      { name: 'Жим гантелей наклон', sets: 3, reps: 10, isBase: false },
      { name: 'Тяга горизонтального блока', sets: 3, reps: 10, isBase: false },
      { name: 'Выпады', sets: 3, reps: 10, isBase: false },
      { name: 'Скручивания', sets: 3, reps: 15, isBase: false },
    ] },
    { label: 'День В — Всё тело', warmupHint: 'ноги, плечи, локти', exercises: [
      { name: 'Фронтальный присед', sets: 3, reps: 8, isBase: true },
      { name: 'Отжимания на брусьях', sets: 3, reps: 10, isBase: false },
      { name: 'Подтягивания', sets: 3, reps: 8, isBase: false },
      { name: 'Разведение гантелей стоя', sets: 3, reps: 15, isBase: false },
      { name: 'Подъём ног в висе на пресс', sets: 3, reps: 12, isBase: false },
    ] },
  ],
  upperlower: [
    { label: 'Верх А — Сила', warmupHint: 'плечи, грудь, спина', exercises: [
      { name: 'Жим лёжа', sets: 4, reps: 6, isBase: true },
      { name: 'Тяга штанги в наклоне', sets: 4, reps: 8, isBase: true },
      { name: 'Жим над головой', sets: 3, reps: 8, isBase: false },
      { name: 'Тяга вертикального блока', sets: 3, reps: 10, isBase: false },
      { name: 'Подъём штанги на бицепс', sets: 3, reps: 10, isBase: false },
      { name: 'Французский жим', sets: 3, reps: 10, isBase: false },
    ] },
    { label: 'Низ А — Сила', warmupHint: 'ноги, бёдра, поясница', exercises: [
      { name: 'Приседания', sets: 4, reps: 6, isBase: true },
      { name: 'Румынская тяга', sets: 3, reps: 8, isBase: false },
      { name: 'Жим ногами', sets: 3, reps: 10, isBase: false },
      { name: 'Сгибание ног', sets: 3, reps: 12, isBase: false },
      { name: 'Подъём на икры сидя', sets: 4, reps: 15, isBase: false },
    ] },
    { label: 'Верх Б — Объём', warmupHint: 'плечи, грудь, спина', exercises: [
      { name: 'Жим гантелей наклон', sets: 4, reps: 10, isBase: false },
      { name: 'Подтягивания', sets: 4, reps: 8, isBase: false },
      { name: 'Жим Арнольда', sets: 3, reps: 10, isBase: false },
      { name: 'Тяга гантели в наклоне', sets: 3, reps: 10, isBase: false },
      { name: 'Молотки', sets: 3, reps: 12, isBase: false },
      { name: 'Разгибания на блоке', sets: 3, reps: 12, isBase: false },
    ] },
    { label: 'Низ Б — Объём', warmupHint: 'ноги, поясница', exercises: [
      { name: 'Становая тяга', sets: 4, reps: 5, isBase: true },
      { name: 'Болгарские выпады', sets: 3, reps: 10, isBase: false },
      { name: 'Разгибание ног', sets: 3, reps: 12, isBase: false },
      { name: 'Ягодичный мост', sets: 3, reps: 10, isBase: false },
      { name: 'Колесо для пресса', sets: 3, reps: 10, isBase: false },
    ] },
  ],
  glutes: [
    { label: 'День А — Ягодицы', warmupHint: 'бёдра, ягодицы', exercises: [
      { name: 'Ягодичный мост', sets: 4, reps: 10, isBase: true },
      { name: 'Румынская тяга', sets: 3, reps: 10, isBase: false },
      { name: 'Болгарские выпады', sets: 3, reps: 12, isBase: false },
      { name: 'Отведение ноги в блоке', sets: 3, reps: 15, isBase: false },
      { name: 'Скручивания', sets: 3, reps: 15, isBase: false },
    ] },
    { label: 'День Б — Ноги', warmupHint: 'колени, бёдра', exercises: [
      { name: 'Приседания', sets: 4, reps: 10, isBase: true },
      { name: 'Жим ногами', sets: 3, reps: 12, isBase: false },
      { name: 'Сгибание ног', sets: 3, reps: 12, isBase: false },
      { name: 'Гиперэкстензия', sets: 3, reps: 15, isBase: false },
      { name: 'Подъём на икры сидя', sets: 3, reps: 15, isBase: false },
    ] },
    { label: 'День В — Ягодицы + верх', warmupHint: 'всё тело', exercises: [
      { name: 'Ягодичный мост', sets: 3, reps: 12, isBase: false },
      { name: 'Выпады', sets: 3, reps: 12, isBase: false },
      { name: 'Гакк-приседания', sets: 3, reps: 10, isBase: false },
      { name: 'Отведение ноги в блоке', sets: 3, reps: 15, isBase: false },
      { name: 'Тяга вертикального блока', sets: 3, reps: 12, isBase: false },
      { name: 'Жим гантелей лёжа', sets: 3, reps: 12, isBase: false },
    ] },
  ],
})

// Catalogue cards. `perWeek` workouts a week, `weeks` = length of one cycle.
export const PROGRAMS = [
  { id: 'fullbody', icon: '⚡', name: 'Фулбади 3×', goal: 'Сила и масса', level: 'Новичок', perWeek: 3, weeks: 8,
    desc: 'Всё тело за тренировку, три разных дня. Лучший старт: базовые движения каждую тренировку и быстрый рост весов.' },
  { id: 'strength', icon: '🏋️', name: 'Сила 5×5', goal: 'Сила', level: 'Средний', perWeek: 3, weeks: 8,
    desc: 'Классика: жим, тяга и присед в 5 подходах по 5 повторений. Дни А и Б чередуются, вес растёт после каждой удачной тренировки.' },
  { id: 'mass', icon: '💪', name: 'Push · Pull · Ноги', goal: 'Масса', level: 'Средний', perWeek: 3, weeks: 10,
    desc: 'Жимы, тяги и ноги в отдельные дни, 10–12 повторений. Каждая группа мышц получает полную нагрузку и отдых.' },
  { id: 'upperlower', icon: '🧱', name: 'Верх / Низ', goal: 'Масса', level: 'Опытный', perWeek: 4, weeks: 8,
    desc: 'Четыре тренировки: силовой и объёмный день для верха и для низа. Для тех, кто тренируется регулярно.' },
  { id: 'glutes', icon: '🍑', name: 'Ягодицы и ноги', goal: 'Ноги', level: 'Любой', perWeek: 3, weeks: 8,
    desc: 'Акцент на ягодицы и ноги, верх тела поддерживается. Ягодичный мост и приседания — главные движения.' },
  { id: 'cut', icon: '🔥', name: 'Рельеф', goal: 'Рельеф', level: 'Любой', perWeek: 3, weeks: 6,
    desc: 'Много повторений и короткий отдых: сохраняет мышцы и тратит больше калорий. Хорошо сочетается с дефицитом.' },
  { id: 'fit', icon: '🤸', name: 'Форма', goal: 'Тонус', level: 'Новичок', perWeek: 3, weeks: 6,
    desc: 'Спокойные тренировки на всё тело, чтобы втянуться в режим и освоить технику.' },
]
export const programOf = (type) => PROGRAMS.find(p => p.id === type)
Object.assign(PLAN_ICONS, Object.fromEntries(PROGRAMS.map(p => [p.id, p.icon])))
Object.assign(PLAN_NAMES, Object.fromEntries(PROGRAMS.map(p => [p.id, p.name])))

// Position in the program: day of the cycle, week and progress of the whole program
export function planProgress(plan) {
  const prog = programOf(plan.plan_type)
  const days = PLAN_DAYS[plan.plan_type] || []
  const perWeek = prog?.perWeek || days.length || 3
  const total = perWeek * (prog?.weeks || 8)
  const done = plan.workout_count || 0
  return {
    prog, days, dayIdx: days.length ? (plan.current_day - 1) % days.length : 0,
    week: Math.min(prog?.weeks || 99, Math.floor(done / perWeek) + 1), weeks: prog?.weeks || 8,
    done, total, pct: Math.min(1, done / total),
  }
}
