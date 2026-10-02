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
