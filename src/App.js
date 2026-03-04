/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

const HEAVY_WEIGHTS = Array.from({ length: 61 }, (_, i) => i * 5)
const LIGHT_WEIGHTS = [...new Set([
  ...Array.from({ length: 11 }, (_, i) => i),
  ...Array.from({ length: 21 }, (_, i) => 10 + i * 2),
  ...Array.from({ length: 21 }, (_, i) => 50 + i * 5),
])].sort((a, b) => a - b)
const MACHINE_WEIGHTS = Array.from({ length: 61 }, (_, i) => i * 5)
const REPS_OPTIONS = Array.from({ length: 51 }, (_, i) => i)
const TIME_OPTIONS = Array.from({ length: 51 }, (_, i) => i * 5)

const EXERCISE_TYPE = {
  'Жим лёжа':'heavy','Приседания':'heavy','Становая тяга':'heavy','Румынская тяга':'heavy',
  'Жим над головой':'heavy','Жим ногами':'heavy','Тяга штанги в наклоне':'heavy','Тяга вниз':'heavy',
  'Тяга сидя':'heavy','Жим гантелей наклон':'light','Жим гантелей лёжа':'light',
  'Разводка гантелей':'light','Разводка лёжа':'light','Выпады':'light','Сгибание ног':'light',
  'Разгибание ног':'light','Отжимания':'light','Подтягивания':'light','Скручивания':'light',
  'Гиперэкстензия':'light','Бицепс':'light','Трицепс':'light','Планка':'timed',
  'Жим Арнольда':'light','Кроссовер':'light','Болгарские выпады':'light',
  'Молотки':'light','Французский жим':'light','Тяга к лицу':'light',
  'Ягодичный мост':'heavy','Шраги':'heavy','Отжимания на брусьях':'light','Тяга Т-штанги':'heavy',
}

const EXERCISE_IMAGES = {
  // Грудь
  'Жим лёжа':'/images/bench.png',
  'Жим гантелей лёжа':'/images/dumbbell_bench.png',
  'Жим гантелей наклон':'/images/incline_dumbbell_press.png',
  'Жим штанги в наклоне':'/images/incline_bench_press.png',
  'Жим узким хватом':'/images/close_grip_bench.png',
  'Разводка гантелей':'/images/dumbbell_flyes.png',
  'Разводка лёжа':'/images/flat_dumbbell_flyes.png',
  'Кроссовер':'/images/cable_fly.png',
  'Отжимания':'/images/push_ups.png',
  'Пуловер':'/images/pullover.png',
  // Плечи
  'Жим над головой':'/images/ohp.png',
  'Жим Арнольда':'/images/arnold_press.png',
  'Тяга к лицу':'/images/face_pull.png',
  'Разводка в наклоне':'/images/bent_over_raise.png',
  'Тяга к подбородку':'/images/upright_row.png',
  // Трапеции / Верх спины
  'Шраги':'/images/shrugs.png',
  // Спина
  'Тяга вниз':'/images/lat_pulldown.png',
  'Тяга сидя':'/images/seated_cable_row.png',
  'Тяга штанги в наклоне':'/images/barbell_row.png',
  'Тяга Т-штанги':'/images/t_bar_row.png',
  'Подтягивания':'/images/pull_ups.png',
  'Гиперэкстензия':'/images/hyperextension.png',
  // Бицепс
  'Подъём штанги стоя':'/images/barbell_curl.png',
  'Подъём гантелей стоя':'/images/dumbbell_curl.png',
  'Молотки':'/images/hammer_curl.png',
  'Изолированные сгибания':'/images/concentration_curl.png',
  'Сгибания на скамье Скотта':'/images/scott_curl.png',
  'Сгибания на блоке':'/images/cable_curl.png',
  'Обратные сгибания':'/images/reverse_curl.png',
  // Трицепс
  'Французский жим':'/images/french_press.png',
  'Разгибания на блоке':'/images/cable_pushdown.png',
  'Разгибания из-за головы':'/images/overhead_tricep.png',
  'Трицепс гантель':'/images/dumbbell_curl.png',
  'Отжимания на брусьях':'/images/dips.png',
  // Ноги — квадрицепс
  'Приседания':'/images/squat.png',
  'Жим ногами':'/images/leg_press.png',
  'Разгибание ног':'/images/leg_extension.png',
  'Болгарские выпады':'/images/bulgarian_split_squat.png',
  'Выпады':'/images/lunges.png',
  'Приседания с гантелью (гоблет)':'/images/goblet_squat.png',
  'Гакк-приседания':'/images/hack_squat.png',
  // Ноги — бицепс бедра
  'Становая тяга':'/images/deadlift.png',
  'Румынская тяга':'/images/romanian_deadlift.png',
  'Сгибание ног':'/images/leg_curl.png',
  // Ягодицы
  'Ягодичный мост':'/images/hip_thrust.png',
  'Отведение ноги в блоке':'/images/cable_kickback.png',
  // Пресс
  'Скручивания':'/images/crunches.png',
  'Планка':'/images/plank.png',
  'Русские скручивания':'/images/russian_twist.png',
  'Подъём ног в висе':'/images/hanging_leg_raise.png',
  // Предплечья
  'Сгибания запястий':'/images/wrist_curl.png',
}



const EXERCISE_MUSCLES = {
  // Грудь
  'Жим лёжа':                    ['chest','triceps','shoulders'],
  'Жим гантелей лёжа':           ['chest','triceps','shoulders'],
  'Жим гантелей наклон':         ['chest','shoulders','triceps'],
  'Жим штанги в наклоне':        ['chest','shoulders','triceps'],
  'Жим узким хватом':            ['chest','triceps'],
  'Разводка гантелей':           ['chest','shoulders'],
  'Разводка лёжа':               ['chest','shoulders'],
  'Кроссовер':                   ['chest','shoulders'],
  'Отжимания':                   ['chest','triceps','shoulders'],
  'Пуловер':                     ['chest','lats'],
  // Плечи
  'Жим над головой':             ['shoulders','triceps','traps'],
  'Жим Арнольда':                ['shoulders','triceps'],
  'Lateral Raise':               ['shoulders'],
  'Тяга к лицу':                 ['shoulders','upper_back','traps'],
  'Разводка в наклоне':          ['shoulders','upper_back'],
  'Тяга к подбородку':           ['shoulders','traps','biceps'],
  // Трапеции / Верх спины
  'Шраги':                       ['traps','upper_back'],
  // Спина
  'Тяга штанги в наклоне':       ['lats','upper_back','biceps','traps'],
  'Тяга сидя':                   ['lats','upper_back','biceps'],
  'Тяга вниз':                   ['lats','biceps','upper_back'],
  'Тяга Т-штанги':               ['lats','upper_back','biceps'],
  'Подтягивания':                ['lats','biceps','upper_back'],
  'Гиперэкстензия':              ['lower_back','glutes','hamstrings'],
  // Бицепс
  'Подъём штанги стоя':          ['biceps','forearms'],
  'Подъём гантелей стоя':        ['biceps','forearms'],
  'Молотки':                     ['biceps','forearms'],
  'Изолированные сгибания':      ['biceps'],
  'Сгибания на скамье Скотта':   ['biceps'],
  'Сгибания на блоке':           ['biceps','forearms'],
  'Обратные сгибания':           ['biceps','forearms'],
  // Трицепс
  'Французский жим':             ['triceps'],
  'Разгибания на блоке':         ['triceps'],
  'Разгибания из-за головы':     ['triceps'],
  'Трицепс гантель':             ['triceps'],
  'Отжимания на брусьях':        ['triceps','chest','shoulders'],
  // Квадрицепс
  'Приседания':                  ['quads','glutes','lower_back','hamstrings'],
  'Жим ногами':                  ['quads','glutes'],
  'Разгибание ног':              ['quads'],
  'Болгарские выпады':           ['quads','glutes','hamstrings'],
  'Выпады':                      ['quads','glutes','hamstrings'],
  'Приседания с гантелью (гоблет)': ['quads','glutes'],
  'Гакк-приседания':             ['quads','glutes'],
  // Бицепс бедра
  'Становая тяга':               ['lower_back','glutes','hamstrings','traps','lats'],
  'Румынская тяга':              ['hamstrings','glutes','lower_back'],
  'Сгибание ног':                ['hamstrings'],
  // Ягодицы
  'Ягодичный мост':              ['glutes','hamstrings'],
  'Отведение ноги в блоке':      ['glutes','hamstrings'],
  // Пресс
  'Скручивания':                 ['abs'],
  'Планка':                      ['abs','lower_back'],
  'Русские скручивания':         ['abs'],
  'Подъём ног в висе':           ['abs'],
  // Предплечья
  'Сгибания запястий':           ['forearms'],
}



const GRIP_EXERCISES = ['Тяга вниз', 'Тяга сидя', 'Подтягивания', 'Тяга штанги в наклоне', 'Жим лёжа']
const GRIP_OPTIONS = ['Стандартный', 'Широкий', 'Узкий', 'Обратный']
const GRIP_MUSCLES = {
  'Тяга вниз': {
    'Стандартный': ['lats','biceps','upper_back'],
    'Широкий':     ['lats','upper_back'],
    'Узкий':       ['lats','biceps','upper_back'],
    'Обратный':    ['lats','biceps'],
  },
  'Тяга сидя': {
    'Стандартный': ['lats','upper_back','biceps'],
    'Широкий':     ['upper_back','lats'],
    'Узкий':       ['lats','upper_back','biceps'],
    'Обратный':    ['biceps','lats'],
  },
  'Подтягивания': {
    'Стандартный': ['lats','biceps','upper_back'],
    'Широкий':     ['lats','upper_back'],
    'Узкий':       ['lats','biceps'],
    'Обратный':    ['biceps','lats'],
  },
  'Тяга штанги в наклоне': {
    'Стандартный': ['lats','upper_back','biceps','traps'],
    'Широкий':     ['upper_back','lats','traps'],
    'Узкий':       ['lats','biceps','upper_back'],
    'Обратный':    ['biceps','lats','upper_back'],
  },
  'Жим лёжа': {
    'Стандартный': ['chest','triceps','shoulders'],
    'Широкий':     ['chest','shoulders'],
    'Узкий':       ['triceps','chest'],
  },
}

const MONTH_MOTIVATIONS = {
  1:  ['Первая тренировка месяца! Отличное начало', 'Старт дан! Так держать', 'Первый шаг самый важный!'],
  2:  ['Уже вторая! Входишь в ритм', 'Два раза это уже привычка!', 'Продолжаешь значит серьёзно настроен'],
  3:  ['Три тренировки! Ты в ударе', 'Третья пошла! Тело скажет спасибо', 'Три из трёх красавчик!'],
  4:  ['Четыре! Неделя почти закрыта', 'Уже 4 тренировки серьёзный подход', 'Четвёртая! Мышцы растут'],
  5:  ['Пять тренировок! Ты машина', 'Пятёрка! Это уже уровень', '5 тренировок это серьёзно'],
  6:  ['Шесть! Уже виден прогресс', 'Шестая стабильность это сила', '6 раз тело уже меняется'],
  7:  ['Семь! Неделя тренировок позади', 'Седьмая! Ты не сдаёшься уважаю', 'Семь тренировок ты крут!'],
  8:  ['Восемь! Скоро будут заметны результаты', '8 тренировок монстр!', 'Восьмая! Режим соблюдается'],
  9:  ['Девять! Почти десятка', 'Девятая характер стальной', '9 раз это очень серьёзно'],
  10: ['10 ТРЕНИРОВОК! Легенда месяца', 'Десятка! Ты абсолютный зверь', '10 раз переходишь на другой уровень'],
  15: ['15 ТРЕНИРОВОК! Просто монстр', 'Пятнадцать! Такой дисциплины ни у кого нет', '15 раз ты изменился навсегда'],
  20: ['20 ТРЕНИРОВОК ЗА МЕСЯЦ! Легенда', 'Двадцать! Ты профессионал', '20 тренировок нереально круто'],
}
function getMotivation(count) {
  const exact = MONTH_MOTIVATIONS[count]
  if (exact) return exact[Math.floor(Math.random() * exact.length)]
  if (count > 20) return count + ' тренировок за месяц — ты легенда!'
  const msgs = [count+'-я тренировка! Продолжай в том же духе', 'Уже '+count+'! Прогресс очевиден', count+' тренировок — ты на верном пути']
  return msgs[count % 3]
}


const EXERCISES = Object.keys(EXERCISE_IMAGES).sort((a, b) => a.localeCompare(b))

const DEFAULT_FAVORITES = ['Жим лёжа','Приседания','Становая тяга']

function getWeightOptions(exName) {
  const t = EXERCISE_TYPE[exName] || 'light'
  return t === 'heavy' ? HEAVY_WEIGHTS : t === 'timed' ? TIME_OPTIONS : t === 'machine' ? MACHINE_WEIGHTS : LIGHT_WEIGHTS
}


const EN_TO_RU = {
  'Bench Press':'Жим лёжа','Squat':'Приседания','Deadlift':'Становая тяга',
  'Romanian Deadlift':'Румынская тяга','Overhead Press':'Жим над головой',
  'Leg Press':'Жим ногами','Barbell Row':'Тяга штанги в наклоне',
  'Lat Pulldown':'Тяга вниз','Seated Cable Row':'Тяга сидя',
  'Incline Dumbbell Press':'Жим гантелей наклон','Dumbbell Bench Press':'Жим гантелей лёжа',
  'Dumbbell Flyes':'Разводка гантелей','Flat Dumbbell Flyes':'Разводка лёжа',
  'Lunges':'Выпады','Leg Curl':'Сгибание ног','Leg Extension':'Разгибание ног',
  'Push Ups':'Отжимания','Pull Ups':'Подтягивания','Crunches':'Скручивания',
  'Hyperextension':'Гиперэкстензия','Biceps':'Бицепс','Triceps':'Трицепс',
  'Plank':'Планка','Arnold Press':'Жим Арнольда','Cable Fly':'Кроссовер',
  'Bulgarian Split Squat':'Болгарские выпады','Hammer Curl':'Молотки',
  'Skull Crushers':'Французский жим','Face Pull':'Тяга к лицу',
  'Hip Thrust':'Ягодичный мост','Shrugs':'Шраги','Dips':'Отжимания на брусьях',
  'T-Bar Row':'Тяга Т-штанги','Arnold press':'Жим Арнольда',
}
function ruName(name) { return EN_TO_RU[name] || name }

function formatMonth(m) {
  if (!m) return ''
  const [y,mo] = m.split('-')
  const s = new Date(parseInt(y), parseInt(mo)-1).toLocaleDateString('ru', {month:'long', year:'numeric'})
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDateShort(d) {
  return new Date(d).toLocaleDateString('ru', { day:'numeric', month:'long' })
}

// daysAgo removed

// todayLabel removed

function buildCopyText(date, workouts) {
  const lines = [`📅 ${date} · ${workouts.length} упр.`]
  const reversed = [...workouts].reverse()
  reversed.forEach(w => {
    const sets = w.sets?.sort((a,b) => a.set_no-b.set_no)
      .map(s => s.time_sec > 0 ? `${s.time_sec}s` : `${s.weight}×${s.reps}`).join(', ')
    lines.push(`${w.exercises?.name}: ${sets}`)
  })
  return lines.join('\n')
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:#000;margin:0}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
.app{background:#000;min-height:100vh;color:white;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;max-width:480px;margin:0 auto;padding-bottom:90px}
.header{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(24px);z-index:50}
.header-logo{width:30px;height:30px;border-radius:8px;object-fit:cover}
.header h1{font-size:20px;font-weight:700;letter-spacing:-0.3px;margin-left:9px}
.header-left{display:flex;align-items:center}
.streak-badge{background:rgba(255,100,0,0.12);border:1px solid rgba(255,100,0,0.25);border-radius:20px;padding:4px 11px;font-size:13px;font-weight:700;color:#FF6400}
.onboard-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px}
.onboard-card{background:#111;border-radius:24px;padding:32px 24px;text-align:center;max-width:360px;width:100%;border:1px solid rgba(255,255,255,0.08)}
.onboard-emoji{font-size:60px;margin-bottom:18px;display:block}
.onboard-title{font-size:26px;font-weight:800;margin-bottom:10px}
.onboard-sub{font-size:14px;opacity:0.5;line-height:1.6;margin-bottom:24px}
.onboard-features{text-align:left;margin-bottom:24px;display:flex;flex-direction:column;gap:12px}
.onboard-feature{display:flex;align-items:center;gap:12px;font-size:14px;opacity:0.75}
.onboard-btn{width:100%;padding:16px;background:#fff;border:none;border-radius:16px;font-size:16px;font-weight:700;color:#000;cursor:pointer}
.section{padding:20px 20px}
.date-label{font-size:13px;opacity:0.35;font-weight:500;margin-bottom:16px;text-transform:capitalize;letter-spacing:0.1px}
.back-btn{background:#1c1c1e;border:none;color:rgba(255,255,255,0.7);font-size:14px;font-weight:600;cursor:pointer;padding:8px 14px;margin-bottom:20px;display:inline-flex;align-items:center;gap:6px;border-radius:99px;transition:all 0.15s}.back-btn:active{background:#2c2c2e;color:white}
.ex-selector-btn{width:100%;background:#1c1c1e;border:none;border-radius:14px;padding:16px 18px;color:white;font-size:16px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;text-align:left;margin-bottom:20px}
.ex-selector-btn:active{background:#2c2c2e}
.ex-header{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.ex-image{width:80px;height:80px;border-radius:16px;object-fit:cover;flex-shrink:0}
.ex-title{font-size:22px;font-weight:700;letter-spacing:-0.3px}
.fav-section{display:flex;align-items:center;justify-content:space-between;margin:0 0 20px;padding:14px 16px;background:#1c1c1e;border-radius:14px}
.fav-section-label{font-size:11px;opacity:0.35;font-weight:500;text-transform:uppercase;letter-spacing:0.5px}
.fav-section-name{font-size:14px;font-weight:600;margin-top:2px}
.fav-big-btn{background:#2c2c2e;border:none;border-radius:12px;padding:10px 16px;font-size:20px;cursor:pointer;transition:all 0.15s}
.fav-big-btn.active{background:rgba(255,200,0,0.15)}
.last-hint{background:#1c1c1e;border:none;border-radius:14px;padding:12px 16px;margin:0 0 20px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6}
.sets-lbl{font-size:13px;font-weight:600;opacity:0.35;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px}
.set-row{display:flex;gap:10px;margin-bottom:16px;align-items:flex-end}
.set-num{opacity:0.25;width:18px;font-size:13px;font-weight:500;flex-shrink:0;text-align:center;padding-bottom:14px}
.set-sep{opacity:0.2;flex-shrink:0;font-size:16px;padding-bottom:14px}
.dpicker-wrap{flex:1;position:relative;z-index:10}
.dpicker-label{font-size:11px;font-weight:600;opacity:0.35;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
.dpicker-btn{width:100%;background:#1c1c1e;border:1.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 14px;color:white;font-size:17px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;text-align:left}
.dpicker-btn.open{border-color:rgba(48,209,88,0.5);background:#1c1c1e}
.dpicker-btn:active{background:#2c2c2e}
.dpicker-unit{font-size:13px;opacity:0.45;font-weight:500}
.dpicker-chevron{opacity:0.4;font-size:18px;transition:transform 0.2s}
.dpicker-btn.open .dpicker-chevron{transform:rotate(180deg);opacity:0.7}
.dpicker-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#2c2c2e;border-radius:14px;max-height:220px;overflow-y:auto;z-index:200;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08)}
.dpicker-opt{padding:13px 16px;font-size:17px;font-weight:500;cursor:pointer;transition:background 0.1s;color:rgba(255,255,255,0.75)}
.dpicker-opt:hover{background:rgba(255,255,255,0.06)}
.dpicker-opt.active{color:#30D158;font-weight:700;background:rgba(48,209,88,0.08)}
.dpicker-opt-unit{font-size:13px;opacity:0.45}
.set-btns{display:flex;gap:10px;margin:10px 0 24px}
.set-btn{flex:1;padding:12px;background:#1c1c1e;border:none;border-radius:12px;color:rgba(255,255,255,0.7);font-size:14px;font-weight:500;cursor:pointer;transition:all 0.15s}
.set-btn:active{background:#2c2c2e}
.timer-card{background:linear-gradient(135deg,rgba(255,159,10,0.1),rgba(255,159,10,0.05));border:1px solid rgba(255,159,10,0.2);border-radius:20px;padding:16px 18px;margin-bottom:20px;display:flex;align-items:center;gap:14px}
.timer-card.idle{background:#1c1c1e;border:1px solid rgba(255,255,255,0.06)}
.timer-lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;opacity:0.5;margin-bottom:4px}
.timer-num{font-size:40px;font-weight:800;color:#FF9F0A;font-variant-numeric:tabular-nums;letter-spacing:-2px;line-height:1}
.timer-skip{background:rgba(255,159,10,0.15);border:1px solid rgba(255,159,10,0.25);border-radius:12px;padding:10px 16px;color:#FF9F0A;font-size:14px;font-weight:700;cursor:pointer;flex-shrink:0}
.timer-start{background:#30D158;border:none;border-radius:12px;padding:10px 18px;color:#000;font-size:14px;font-weight:700;cursor:pointer;flex-shrink:0}
.save-btn{width:100%;padding:16px;background:#30D158;border:none;border-radius:16px;font-size:17px;font-weight:700;color:#000;cursor:pointer;transition:all 0.2s;letter-spacing:-0.2px}
.save-btn:active{background:#28B84A}
.save-btn.done{background:#30D158}
.day-group{margin-bottom:4px}
.day-hdr{width:100%;background:#1c1c1e;border:none;border-radius:14px;padding:14px 16px;color:white;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;text-align:left;margin-bottom:2px}
.day-hdr:active{background:#2c2c2e}
.day-hdr.open{border-radius:14px 14px 0 0}
.day-chev{opacity:0.3;transition:transform 0.2s;font-size:12px;flex-shrink:0}
.day-chev.open{transform:rotate(180deg);opacity:0.6}
.day-body{background:#1c1c1e;border-radius:0 0 14px 14px;overflow:hidden;margin-bottom:2px}
.day-actions{display:flex;border-bottom:1px solid rgba(255,255,255,0.05)}
.day-action-btn{flex:1;padding:10px;background:none;border:none;color:rgba(255,255,255,0.4);font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}
.day-action-btn:hover{color:rgba(255,255,255,0.8)}
.day-action-btn.ok{color:#30D158}
.day-action-btn+.day-action-btn{border-left:1px solid rgba(255,255,255,0.05)}
.day-action-btn.del{color:rgba(255,59,48,0.7)}
.day-action-btn.del:hover{color:#FF453A}
.hist-card{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04)}
.hist-card:last-child{border-bottom:none}
.hist-ex{font-size:14px;font-weight:600;margin-bottom:7px}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{padding:4px 10px;border-radius:99px;background:#2c2c2e;font-size:12px;font-weight:600;color:rgba(255,255,255,0.7)}
.stats-row{display:flex;gap:8px;margin-bottom:24px}
.stat-card{flex:1;background:#1c1c1e;border:none;border-radius:16px;padding:16px 10px;text-align:center}
.stat-val{font-size:22px;font-weight:700;letter-spacing:-0.5px}
.stat-lbl{font-size:10px;opacity:0.4;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px;font-weight:500}
.prog-title{font-size:17px;font-weight:700;margin:24px 0 12px;letter-spacing:-0.3px}
.chart-wrap{background:#1c1c1e;border:none;border-radius:16px;padding:16px;margin-bottom:8px}
.chart-ex-select{width:100%;background:#2c2c2e;border:none;border-radius:12px;padding:10px 14px;color:white;font-size:14px;font-weight:500;outline:none;margin-bottom:14px;cursor:pointer;-webkit-appearance:none;appearance:none}
.chart-ex-select option{background:#2c2c2e;color:white}
.chart-nodata{text-align:center;opacity:0.35;font-size:14px;padding:30px 0}
.cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.cal-btn{background:#1c1c1e;border:none;border-radius:10px;padding:8px 16px;color:rgba(255,255,255,0.6);cursor:pointer;font-size:15px;font-weight:500}
.cal-mname{font-size:16px;font-weight:700;letter-spacing:-0.3px}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:24px}
.cal-dow{text-align:center;font-size:10px;opacity:0.3;font-weight:600;padding-bottom:6px}
.cal-cell{aspect-ratio:1;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;font-weight:500;background:#1c1c1e;color:rgba(255,255,255,0.6)}
.cal-cell.empty{background:transparent}
.cal-cell.trained{background:rgba(48,209,88,0.15);color:#30D158;cursor:pointer;font-weight:700}
.cal-cell.trained:active{background:rgba(48,209,88,0.25)}
.cal-cell.today{box-shadow:0 0 0 1.5px rgba(255,255,255,0.3)}
.cal-vol{font-size:7px;opacity:0.65;margin-top:1px}
.pr-group{margin-bottom:4px}
.pr-hdr{width:100%;background:#1c1c1e;border:none;border-radius:14px;padding:13px 16px;color:white;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;text-align:left;margin-bottom:2px}
.pr-hdr:active{background:#2c2c2e}
.pr-hdr.open{border-radius:14px 14px 0 0}
.pr-hdr-left{display:flex;align-items:center;gap:12px}
.pr-thumb{width:38px;height:38px;border-radius:10px;object-fit:cover;flex-shrink:0}
.pr-thumb-ph{width:38px;height:38px;border-radius:10px;background:#2c2c2e;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.pr-name{font-size:15px;font-weight:600}
.pr-val{font-size:17px;font-weight:700;color:#30D158}
.pr-detail{background:#1c1c1e;border-top:1px solid rgba(255,255,255,0.05);border-radius:0 0 14px 14px;padding:14px 16px;display:flex;gap:14px;margin-bottom:2px}
.pr-detail-img{width:70px;border-radius:12px;flex-shrink:0;object-fit:cover}
.pr-detail-sets{font-size:16px;font-weight:700}
.pr-detail-date{font-size:12px;opacity:0.4;margin-top:3px}
.pr-detail-est{font-size:13px;color:#30D158;margin-top:4px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:flex-end;justify-content:center;animation:fov 0.2s ease;backdrop-filter:blur(8px);padding-bottom:env(keyboard-inset-height,0px)}
@keyframes fov{from{opacity:0}to{opacity:1}}
.modal{background:#1c1c1e;border-radius:20px 20px 0 0;width:100%;max-width:480px;max-height:85vh;max-height:85dvh;display:flex;flex-direction:column;animation:sup 0.3s cubic-bezier(0.34,1.1,0.64,1)}
@keyframes sup{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal-handle{width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:10px auto 0;flex-shrink:0}
.modal-hdr{padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;position:sticky;top:0;background:#1c1c1e;z-index:1}
.modal-title{font-size:17px;font-weight:700;margin-bottom:12px}
.modal-srch-wrap{position:relative}
.modal-srch-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:0.35}
.modal-srch{width:100%;background:#2c2c2e;border:none;border-radius:12px;padding:10px 14px 10px 36px;color:white;font-size:15px;outline:none;font-weight:400}
.modal-srch::placeholder{color:rgba(255,255,255,0.3)}
.modal-list{overflow-y:auto;padding:6px 10px 30px;flex:1}
.modal-sect-lbl{font-size:11px;font-weight:600;opacity:0.35;text-transform:uppercase;letter-spacing:0.8px;padding:12px 10px 4px}
.modal-item{padding:12px 10px;border-radius:12px;cursor:pointer;font-size:15px;font-weight:500;display:flex;align-items:center;gap:12px;transition:background 0.1s}
.modal-item:active{background:rgba(255,255,255,0.06)}
.modal-img{width:36px;height:36px;border-radius:8px;object-fit:cover;flex-shrink:0}
.modal-ph{width:36px;height:36px;border-radius:8px;background:#2c2c2e;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.modal-body{padding:16px 18px 30px;overflow-y:auto;flex:1}
.edit-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.edit-inp{flex:1;background:#2c2c2e;border:none;border-radius:10px;padding:11px;color:white;font-size:16px;font-weight:600;text-align:center;outline:none}
.edit-del{background:rgba(255,59,48,0.1);border:none;border-radius:10px;padding:11px 14px;color:#FF453A;cursor:pointer;font-size:14px}
.edit-save-btn{width:100%;padding:14px;background:#30D158;border:none;border-radius:14px;font-size:16px;font-weight:700;color:#000;cursor:pointer;margin-top:14px}
.nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:480px;background:rgba(0,0,0,0.9);border-top:1px solid rgba(255,255,255,0.06);display:flex;padding:10px 0 26px;z-index:50;backdrop-filter:blur(24px)}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;transition:opacity 0.15s;padding:4px 0}
.nav-icon{font-size:22px}
.nav-lbl{font-size:10px;font-weight:600;letter-spacing:0.2px}
@media(max-width:480px){.nav-bar{width:100%}}
.timer-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:150;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(8px);animation:fov 0.2s ease}
.timer-modal{background:#1c1c1e;border-radius:24px 24px 0 0;width:100%;max-width:480px;padding:0 0 40px;animation:sup 0.3s cubic-bezier(0.34,1.1,0.64,1)}
.timer-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:24px}
.timer-tab{flex:1;padding:14px;background:none;border:none;color:rgba(255,255,255,0.4);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.15s;position:relative}
.timer-tab.active{color:white}
.timer-tab.active::after{content:"";position:absolute;bottom:0;left:20%;right:20%;height:2px;background:#30D158;border-radius:99px}
.timer-icon-btn{background:none;border:none;cursor:pointer;font-size:20px;padding:4px 6px;opacity:0.7;transition:opacity 0.15s}
.timer-icon-btn:hover{opacity:1}
.timer-big-num{font-size:72px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-3px;text-align:center;margin:16px 0}
.timer-controls{display:flex;gap:12px;padding:0 24px;justify-content:center}
.timer-ctrl-btn{flex:1;padding:14px;border:none;border-radius:16px;font-size:16px;font-weight:700;cursor:pointer;max-width:160px}
.timer-ctrl-btn.primary{background:#30D158;color:#000}
.timer-ctrl-btn.secondary{background:#2c2c2e;color:white}
.timer-ctrl-btn.danger{background:rgba(255,59,48,0.15);color:#FF453A}
.alert-toast{position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:300;background:#1c1c1e;border-radius:20px;padding:16px 20px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);animation:toastIn 0.4s cubic-bezier(0.34,1.2,0.64,1);min-width:280px;max-width:360px}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.alert-toast-icon{font-size:32px;flex-shrink:0}
.alert-toast-title{font-size:15px;font-weight:800;margin-bottom:2px}
.alert-toast-sub{font-size:13px;opacity:0.5}
.auth-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:#000}
.auth-card{width:100%;max-width:380px;background:#1c1c1e;border-radius:24px;padding:32px 24px}
.auth-logo{width:64px;height:64px;border-radius:16px;object-fit:cover;margin:0 auto 20px;display:block}
.auth-logo-ph{width:64px;height:64px;border-radius:16px;background:#2c2c2e;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:32px}
.auth-title{font-size:28px;font-weight:800;text-align:center;margin-bottom:6px;letter-spacing:-0.5px}
.auth-sub{font-size:14px;opacity:0.4;text-align:center;margin-bottom:28px}
.auth-inp-lbl{font-size:12px;font-weight:600;opacity:0.4;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
.auth-inp{width:100%;background:#2c2c2e;border:none;border-radius:12px;padding:14px 16px;color:white;font-size:16px;outline:none;margin-bottom:14px}
.auth-inp:focus{box-shadow:0 0 0 2px rgba(48,209,88,0.4)}
.auth-btn{width:100%;padding:15px;background:#30D158;border:none;border-radius:14px;font-size:16px;font-weight:700;color:#000;cursor:pointer;margin-top:4px;transition:opacity 0.15s}
.auth-btn:disabled{opacity:0.5}
.auth-err{background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.25);border-radius:10px;padding:10px 14px;font-size:13px;color:#FF453A;margin-bottom:14px;text-align:center}
.auth-switch{text-align:center;margin-top:18px;font-size:14px;opacity:0.5}
.auth-switch button{background:none;border:none;color:#30D158;font-size:14px;font-weight:600;cursor:pointer;padding:0;margin-left:4px}
.auth-user-bar{display:flex;align-items:center;gap:8px}
.auth-signout{background:none;border:none;color:rgba(255,255,255,0.35);font-size:12px;cursor:pointer;padding:4px 8px;border-radius:8px}
.auth-signout:hover{color:rgba(255,255,255,0.7)}`

function LineChart({ data, period, setPeriod }) {
  const [tooltip, setTooltip] = useState(null)

  const periods = [{ id:'1M', label:'1 мес' }, { id:'3M', label:'3 мес' }, { id:'ALL', label:'Всё' }]

  const noData = (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
            background: period===p.id ? '#30D158' : '#2c2c2e',
            color: period===p.id ? '#000' : 'rgba(255,255,255,0.5)',
          }}>{p.label}</button>
        ))}
      </div>
      <div style={{textAlign:'center',padding:'28px 0'}}>
        <div style={{fontSize:36,marginBottom:8}}>📊</div>
        <div style={{fontSize:14,fontWeight:600,opacity:0.5,marginBottom:4}}>Нужно минимум 2 тренировки</div>
        <div style={{fontSize:12,opacity:0.3}}>для отображения графика</div>
      </div>
    </div>
  )

  if (!data || data.length < 2) return noData

  const vals = data.map(d => d.val)
  const minV = Math.floor(Math.min(...vals) * 0.95)
  const maxV = Math.ceil(Math.max(...vals) * 1.05)
  const range = maxV - minV || 1
  const W = 400; const H = 140; const padL = 36; const padR = 10; const padT = 14; const padB = 22

  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * (W - padL - padR),
    y: padT + (1 - (d.val - minV) / range) * (H - padT - padB),
    ...d
  }))

  function smoothPath(points) {
    if (points.length < 2) return ''
    let d = `M${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i-1]; const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
    }
    return d
  }

  const path = smoothPath(pts)
  const area = path + ` L${pts[pts.length-1].x},${H-padB} L${pts[0].x},${H-padB} Z`
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    val: Math.round(minV + range * t),
    y: padT + (1 - t) * (H - padT - padB)
  }))

  const first = vals[0]; const last = vals[vals.length-1]
  const diff = +(last - first).toFixed(1)
  const pct = first > 0 ? ((diff / first) * 100).toFixed(1) : 0

  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
            background: period===p.id ? '#30D158' : '#2c2c2e',
            color: period===p.id ? '#000' : 'rgba(255,255,255,0.5)',
          }}>{p.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,overflow:'visible',display:'block'}}>
        <defs>
          <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#30D158" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#30D158" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {gridLines.map((g,i) => (
          <g key={i}>
            <line x1={padL} y1={g.y} x2={W-padR} y2={g.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
            <text x={padL-4} y={g.y+4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{g.val}</text>
          </g>
        ))}
        <path d={area} fill="url(#cg2)"/>
        <path d={path} fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i) => (
          <g key={i} style={{cursor:'pointer'}} onMouseEnter={()=>setTooltip(p)} onMouseLeave={()=>setTooltip(null)}>
            <circle cx={p.x} cy={p.y} r="14" fill="transparent"/>
            <circle cx={p.x} cy={p.y} r={tooltip?.label===p.label?6:4} fill="#30D158" stroke="#000" strokeWidth="2"/>
          </g>
        ))}
        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x,48), W-48)
          const ty = tooltip.y - 16
          return (
            <g>
              <rect x={tx-38} y={ty-16} width={76} height={26} rx="7" fill="#1c1c1e" stroke="rgba(48,209,88,0.4)" strokeWidth="1"/>
              <text x={tx} y={ty+1} textAnchor="middle" fontSize="11" fill="#30D158" fontWeight="700">{tooltip.val} kg</text>
              <text x={tx} y={ty+14} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">{tooltip.label}</text>
            </g>
          )
        })()}
      </svg>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:14,background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'10px 14px'}}>
        {[['Старт', first+' kg'], ['Прирост', (diff>=0?'+':'')+diff+' kg'], ['Рост', (Number(pct)>=0?'+':'')+pct+'%'], ['Сейчас', last+' kg']].map(([lbl,val],i) => (
          <div key={i} style={{textAlign:'center'}}>
            <div style={{fontSize:14,fontWeight:700,color: i===1||i===2 ? (diff>=0?'#30D158':'#FF453A') : 'white'}}>{val}</div>
            <div style={{fontSize:9,opacity:0.35,marginTop:2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MuscleMap({ muscleScores, period = 7 }) {
  const [hovered, setHovered] = useState(null)

  // Per-muscle recommended sessions per week (×4 for 30-day period)
  const RECOMMENDED_WEEKLY = {
    chest: 2, shoulders: 3, biceps: 3, triceps: 3, forearms: 3,
    abs: 3, quads: 2, calves: 3,
    traps: 2, upper_back: 2, lats: 2, lower_back: 2,
    glutes: 2, hamstrings: 2,
  }
  const getRecommended = (muscle) => {
    const weekly = RECOMMENDED_WEEKLY[muscle] ?? 2
    return period === 7 ? weekly : weekly * 4
  }
  const getPct = (count, muscle) => {
    if (!count) return 0
    return Math.round((count / getRecommended(muscle)) * 100)
  }
  const getLevel = (count, muscle) => {
    const pct = getPct(count, muscle)
    if (pct === 0)   return 'none'
    if (pct < 50)    return 'low'
    if (pct < 90)    return 'normal'
    if (pct <= 110)  return 'excellent'
    return 'overload'
  }
  const getColor = (muscle) => {
    const level = getLevel(muscleScores[muscle] || 0, muscle)
    if (level === 'none')      return 'rgba(255,255,255,0)'
    if (level === 'low')       return 'rgba(255,214,10,0.45)'
    if (level === 'normal')    return 'rgba(48,200,94,0.5)'
    if (level === 'excellent') return 'rgba(48,209,88,0.7)'
    return 'rgba(255,69,58,0.6)' // overload
  }
  const getStroke = (muscle) => {
    const level = getLevel(muscleScores[muscle] || 0, muscle)
    if (level === 'none')      return hovered === muscle ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0)'
    if (level === 'low')       return 'rgba(255,214,10,0.9)'
    if (level === 'normal')    return 'rgba(48,200,94,1)'
    if (level === 'excellent') return 'rgba(48,209,88,1)'
    return 'rgba(255,69,58,1)' // overload
  }
  const muscleNames = {
    chest:'Грудь', shoulders:'Плечи', biceps:'Бицепс', triceps:'Трицепс',
    abs:'Пресс', quads:'Квадрицепс', calves:'Икры', forearms:'Предплечья',
    upper_back:'Верхняя спина', lats:'Широчайшие', lower_back:'Поясница',
    glutes:'Ягодицы', hamstrings:'Бицепс бедра', traps:'Трапеции'
  }

  // SVG viewBox matches image 1536x1024
  // Front figure center ~384, Back figure center ~1130
  // Bilateral muscles split into _L/_R to fix iOS compound-path hit-test bug
  const zones = {
    // === FRONT (single) ===
    chest: "M 338,232 Q 426,214 514,232 Q 521,274 506,325 Q 426,343 346,325 Q 331,274 338,232 Z",
    abs:   "M 354,327 Q 426,340 498,327 Q 506,371 501,417 Q 496,463 486,485 Q 426,494 366,485 Q 356,463 351,417 Q 346,371 354,327 Z",

    // === FRONT (bilateral) ===
    shoulders_L: "M 286,204 Q 321,186 354,204 Q 366,232 361,278 Q 331,297 291,278 Q 271,251 286,204 Z",
    shoulders_R: "M 498,204 Q 531,186 566,204 Q 581,251 561,278 Q 521,297 491,278 Q 486,232 498,204 Z",
    biceps_L:    "M 251,288 Q 278,278 296,290 Q 304,325 301,371 Q 294,399 274,399 Q 248,389 238,362 Q 234,327 251,288 Z",
    biceps_R:    "M 556,290 Q 574,278 601,288 Q 618,327 614,362 Q 604,389 578,399 Q 558,399 551,371 Q 548,325 556,290 Z",
    triceps_L:   "M 294,290 Q 314,281 328,294 Q 336,327 334,374 Q 326,401 304,401 Q 290,392 288,362 Q 286,327 294,290 Z",
    triceps_R:   "M 524,294 Q 538,281 558,290 Q 566,327 564,362 Q 562,392 548,401 Q 526,401 518,374 Q 516,327 524,294 Z",
    forearms_L:  "M 231,405 Q 258,396 278,408 Q 286,438 284,475 Q 276,498 254,498 Q 228,488 218,461 Q 214,429 231,405 Z",
    forearms_R:  "M 574,408 Q 594,396 621,405 Q 638,429 634,461 Q 624,488 598,498 Q 576,498 568,475 Q 566,438 574,408 Z",
    quads_L:     "M 358,500 Q 388,491 411,503 Q 418,535 416,593 Q 414,648 404,679 Q 381,692 358,683 Q 338,667 334,627 Q 331,577 338,535 Z",
    quads_R:     "M 441,503 Q 464,491 494,500 Q 514,535 518,577 Q 521,627 514,667 Q 494,692 471,692 Q 448,679 436,648 Q 434,593 441,503 Z",
    calves_L:    "M 348,713 Q 374,704 394,713 Q 404,741 402,787 Q 398,824 378,836 Q 354,840 338,827 Q 328,799 331,762 Z",
    calves_R:    "M 458,713 Q 478,704 504,713 Q 521,762 514,799 Q 504,827 474,836 Q 454,836 450,799 Q 448,762 458,713 Z",

    // === BACK (single) ===
    traps:      "M 1015,204 Q 1105,186 1195,204 Q 1203,239 1190,269 Q 1105,281 1020,269 Q 1007,239 1015,204 Z",
    upper_back: "M 1020,272 Q 1105,285 1190,272 Q 1200,313 1193,355 Q 1183,383 1105,392 Q 1027,383 1017,355 Q 1010,313 1020,272 Z",
    lower_back: "M 1030,392 Q 1105,405 1180,392 Q 1187,424 1183,457 Q 1173,479 1105,485 Q 1037,479 1027,457 Q 1023,424 1030,392 Z",

    // === BACK (bilateral) ===
    lats_L:        "M 973,239 Q 1000,226 1017,241 Q 1023,278 1025,334 Q 1023,380 1010,401 Q 987,408 967,389 Q 953,364 957,318 Z",
    lats_R:        "M 1193,241 Q 1210,226 1237,239 Q 1253,278 1253,318 Q 1257,364 1243,389 Q 1223,408 1200,401 Q 1187,380 1185,334 Q 1187,278 1193,241 Z",
    glutes_L:      "M 1033,485 Q 1070,475 1097,488 Q 1103,516 1100,559 Q 1093,596 1067,605 Q 1037,602 1020,584 Q 1010,556 1017,519 Z",
    glutes_R:      "M 1113,488 Q 1140,475 1177,485 Q 1193,519 1190,556 Q 1183,584 1143,602 Q 1117,602 1110,559 Q 1107,516 1113,488 Z",
    hamstrings_L:  "M 1025,609 Q 1053,599 1077,611 Q 1087,642 1085,695 Q 1080,734 1057,744 Q 1030,744 1013,725 Q 1000,697 1003,655 Z",
    hamstrings_R:  "M 1133,611 Q 1157,599 1185,609 Q 1207,655 1197,697 Q 1183,725 1153,744 Q 1130,744 1125,695 Q 1123,642 1133,611 Z",
    calves_back_L: "M 1020,753 Q 1045,744 1067,753 Q 1077,781 1075,821 Q 1067,849 1043,855 Q 1020,852 1007,833 Q 997,803 1003,775 Z",
    calves_back_R: "M 1143,753 Q 1165,744 1190,753 Q 1207,775 1203,803 Q 1193,833 1167,855 Q 1143,849 1135,821 Q 1133,781 1143,753 Z",
  }

  const hoveredCount = muscleScores[hovered] || 0
  const hoveredLevel = getLevel(hoveredCount, hovered)
  const hoveredPct = getPct(hoveredCount, hovered)
  const scoreColor = hoveredLevel === 'overload' ? '#FF453A' : hoveredLevel === 'excellent' ? '#30D158' : hoveredLevel === 'normal' ? '#30C85E' : hoveredLevel === 'low' ? '#FFD60A' : 'rgba(255,255,255,0.3)'

  const handleZone = (muscle) => ({
    fill: hovered === muscle ? (hoveredCount > 0 ? getColor(muscle) : 'rgba(255,255,255,0.12)') : getColor(muscle),
    stroke: hovered === muscle ? (hoveredCount > 0 ? getStroke(muscle) : 'rgba(255,255,255,0.5)') : getStroke(muscle),
    strokeWidth: hovered === muscle ? 1.5 : 0.8,
    style: { cursor: 'pointer', transition: 'all 0.15s' },
    onMouseEnter: () => setHovered(muscle),
    onMouseLeave: () => setHovered(null),
    onClick: () => setHovered(prev => prev === muscle ? null : muscle),
    onTouchStart: (e) => { e.preventDefault(); setHovered(muscle); },
    onTouchEnd: (e) => { e.preventDefault(); },
  })

  return (
    <div style={{userSelect:'none'}}>
      {/* Info bar */}
      <div style={{height:32,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
        {hovered ? (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:scoreColor,flexShrink:0}}/>
            <span style={{fontSize:14,fontWeight:700,color:scoreColor}}>
              {muscleNames[hovered] || muscleNames[hovered.replace('_back','')]}
            </span>
            <span style={{fontSize:12,opacity:0.5}}>
              {hoveredCount > 0 ? `${hoveredPct}%` : 'не тренируется'}
            </span>
          </div>
        ) : (
          <div style={{fontSize:11,opacity:0.2,letterSpacing:'1px',textTransform:'uppercase'}}>наведи на мышцу</div>
        )}
      </div>

      {/* SVG overlay on image */}
      <div style={{position:'relative',width:'100%',maxWidth:560,margin:'0 auto'}}>
        <img
          src="/images/muscle_map.png"
          alt="muscle map"
          style={{width:'100%',display:'block',borderRadius:12,filter:'brightness(0.92) invert(1)',opacity:0.85}}
        />
        <svg
          viewBox="0 0 1536 1024"
          style={{position:'absolute',inset:0,width:'100%',height:'100%'}}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* FRONT zones */}
          <path d={zones.chest} {...handleZone('chest')}/>
          <path d={zones.shoulders_L} {...handleZone('shoulders')}/>
          <path d={zones.shoulders_R} {...handleZone('shoulders')}/>
          <path d={zones.biceps_L} {...handleZone('biceps')}/>
          <path d={zones.biceps_R} {...handleZone('biceps')}/>
          <path d={zones.triceps_L} {...handleZone('triceps')}/>
          <path d={zones.triceps_R} {...handleZone('triceps')}/>
          <path d={zones.forearms_L} {...handleZone('forearms')}/>
          <path d={zones.forearms_R} {...handleZone('forearms')}/>
          <path d={zones.abs} {...handleZone('abs')}/>
          <path d={zones.quads_L} {...handleZone('quads')}/>
          <path d={zones.quads_R} {...handleZone('quads')}/>
          <path d={zones.calves_L} {...handleZone('calves')}/>
          <path d={zones.calves_R} {...handleZone('calves')}/>

          {/* BACK zones */}
          <path d={zones.traps} {...handleZone('traps')}/>
          <path d={zones.upper_back} {...handleZone('upper_back')}/>
          <path d={zones.lats_L} {...handleZone('lats')}/>
          <path d={zones.lats_R} {...handleZone('lats')}/>
          <path d={zones.lower_back} {...handleZone('lower_back')}/>
          <path d={zones.glutes_L} {...handleZone('glutes')}/>
          <path d={zones.glutes_R} {...handleZone('glutes')}/>
          <path d={zones.hamstrings_L} {...handleZone('hamstrings')}/>
          <path d={zones.hamstrings_R} {...handleZone('hamstrings')}/>
          <path d={zones.calves_back_L} {...handleZone('calves_back')}/>
          <path d={zones.calves_back_R} {...handleZone('calves_back')}/>
        </svg>
      </div>


    </div>
  )
}


function DropdownPicker({ options, value, onChange, unit = '', label = '', labelFn = null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const el = ref.current?.querySelector(`[data-val="${value}"]`)
    if (el) el.scrollIntoView({ block: 'center' })
  }, [open, value])

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close) }
  }, [])

  return (
    <div className="dpicker-wrap" ref={ref}>
      {label && <div className="dpicker-label">{label}</div>}
      <button className={`dpicker-btn${open?' open':''}`} onClick={() => setOpen(o => !o)}>
        <span className="dpicker-val">{labelFn ? (value ? labelFn(value) : '') : value}{!labelFn && unit && <span className="dpicker-unit"> {unit}</span>}</span>
        <span className="dpicker-chevron">⌄</span>
      </button>
      {open && (
        <div className="dpicker-dropdown">
          {options.map(opt => (
            <div key={opt} data-val={opt}
              className={`dpicker-opt${opt === value ? ' active' : ''}`}
              onClick={() => { onChange(opt); setOpen(false) }}>
              {labelFn ? labelFn(opt) : opt} {!labelFn && unit && <span className="dpicker-opt-unit">{unit}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
function ModalItem({ ex, onSelect }) {
  const img = EXERCISE_IMAGES[ex.name]
  return (
    <div className="modal-item" onClick={onSelect}>
      {img ? <img src={img} alt={ex.name} className="modal-img" onError={e => e.target.style.display='none'}/> : <div className="modal-ph">🏋️</div>}
      {ex.name}
    </div>
  )
}

function EditModal({ data, onClose, onSave }) {
  const [workouts, setWorkouts] = useState(data.workouts.map(w => ({
    ...w,
    editSets: w.sets?.sort((a,b) => a.set_no-b.set_no).map(s => ({ weight: String(s.weight), reps: String(s.reps), time_sec: s.time_sec ?? null })) || []
  })))

  const upd = (wi, si, f, v) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:w.editSets.map((s,j) => j!==si?s:{...s,[f]:v})}))
  const del = (wi, si) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:w.editSets.filter((_,j)=>j!==si)}))
  const add = (wi) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:[...w.editSets,{weight:'0',reps:'0',time_sec:null}]}))

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target.classList.contains('modal-overlay'))onClose()}}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-hdr">
          <div className="modal-title" style={{marginBottom:0}}>✏️ {formatDateShort(data.date)}</div>
        </div>
        <div className="modal-body">
          {workouts.map((w, wi) => {
            const isTimed = (EXERCISE_TYPE[ruName(w.exercises?.name)] || 'light') === 'timed'
            return (
            <div key={w.id} style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10,opacity:0.7}}>{ruName(w.exercises?.name)}</div>
              {w.editSets.map((s,si) => (
                <div key={si} className="edit-row">
                  <span style={{opacity:0.3,width:18,fontSize:12,textAlign:'center'}}>{si+1}</span>
                  {isTimed ? (
                    <input className="edit-inp" type="number" value={s.time_sec ?? ''} onChange={e=>upd(wi,si,'time_sec',e.target.value)} placeholder="сек" style={{flex:2}}/>
                  ) : (
                    <>
                      <input className="edit-inp" type="number" value={s.weight} onChange={e=>upd(wi,si,'weight',e.target.value)} placeholder="кг"/>
                      <span style={{opacity:0.3,fontSize:14}}>×</span>
                      <input className="edit-inp" type="number" value={s.reps} onChange={e=>upd(wi,si,'reps',e.target.value)} placeholder="повт"/>
                    </>
                  )}
                  <button className="edit-del" onClick={()=>del(wi,si)}>✕</button>
                </div>
              ))}
              <button className="set-btn" style={{width:'100%',marginTop:4}} onClick={()=>add(wi)}>➕ Подход</button>
              <button className="edit-save-btn" onClick={()=>onSave(w.id,w.editSets)}>💾 Сохранить {w.exercises?.name}</button>
            </div>
          )})}

        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = not logged in
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [tab, setTab] = useState('add')
  const exercises = EXERCISES.map((name, i) => ({ id: i, name }))
  const [favorites, setFavorites] = useState(DEFAULT_FAVORITES)
  const [showOnboard, setShowOnboard] = useState(false)
  const [selectedEx, setSelectedEx] = useState(null)
  const [sets, setSets] = useState([{ weight: 0, reps: 0 }])
  const [saved, setSaved] = useState(false)
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState([])
  const [openDays, setOpenDays] = useState({})
  const [historyMonth, setHistoryMonth] = useState('')
  const [copiedDay, setCopiedDay] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [lastSession, setLastSession] = useState(null)
  const [showExModal, setShowExModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [prs, setPrs] = useState([])
  const [openPrs, setOpenPrs] = useState({})
  const [stats, setStats] = useState(null)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calDayData, setCalDayData] = useState(null)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calData, setCalData] = useState({})
  const [calDayModal, setCalDayModal] = useState(null)
  const [chartEx, setChartEx] = useState('')
  const [chartData, setChartData] = useState([])
  const [chartPeriod, setChartPeriod] = useState('ALL')
  const [musclePeriod, setMusclePeriod] = useState(30)
  const [timerSecs, setTimerSecs] = useState(null)
  const [timerDuration, setTimerDuration] = useState(90)
  const timerRef = useRef(null)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [timerMode, setTimerMode] = useState('countdown')
  const [showTimerChoice, setShowTimerChoice] = useState(false)
  const [timerPickerMins, setTimerPickerMins] = useState(1)
  const [timerPickerSecs, setTimerPickerSecs] = useState(30)
  const [stopwatchSecs, setStopwatchSecs] = useState(0)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  const stopwatchRef = useRef(null)
  const [prAlert, setPrAlert] = useState(null)
  const [streakAlert, setStreakAlert] = useState(null)
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0])
  const [showDateModal, setShowDateModal] = useState(false)
  const [workoutExercises, setWorkoutExercises] = useState([])
  const [kbHeight, setKbHeight] = useState(0)
  const historyLoaded = useRef(false)

  const handleAuth = async () => {
    setAuthLoading(true); setAuthError('')
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      if (error) setAuthError(error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
      if (error) setAuthError(error.message.includes('already registered') ? 'Этот email уже зарегистрирован' : error.message)
    }
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setFavorites(DEFAULT_FAVORITES)
    setHistory([]); setPrs([]); setStats(null)
  }

  useEffect(() => { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); return () => document.head.removeChild(s) }, [])

  // Track virtual keyboard height for iOS Safari
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setKbHeight(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update) }
  }, [])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load favorites from supabase when user logs in
  useEffect(() => {
    if (!user) return
    const initKey = 'gbFavsInit_' + user.id
    supabase.from('user_favorites').select('exercise_name').eq('user_id', user.id)
      .then(async ({ data }) => {
        const initialized = localStorage.getItem(initKey)
        if (data && data.length > 0) {
          setFavorites(data.map(r => r.exercise_name))
          localStorage.setItem(initKey, '1')
        } else if (!initialized) {
          // Truly first time — insert defaults
          const inserts = DEFAULT_FAVORITES.map(name => ({ user_id: user.id, exercise_name: name }))
          await supabase.from('user_favorites').insert(inserts)
          setFavorites(DEFAULT_FAVORITES)
          localStorage.setItem(initKey, '1')
        } else {
          // User cleared all favorites intentionally
          setFavorites([])
        }
      })
    // Show onboard only once per user
    const key = 'gbOnboarded_' + user.id
    if (!localStorage.getItem(key)) setShowOnboard(true)
  }, [user])

  useEffect(() => {
    const weighted = EXERCISES.find(e => !['Скручивания','Планка','Отжимания','Подтягивания'].includes(e))
    if (!chartEx) setChartEx(weighted || EXERCISES[0])
  }, [])

  useEffect(() => {
    async function load() {
      if (!user) return
      const thisM = new Date().toISOString().slice(0,7)
      const { data } = await supabase.from('workouts').select('workout_date').eq('user_id', user.id)
      if (!data) return
      const monthCount = new Set(data.filter(r => r.workout_date.startsWith(thisM)).map(r => r.workout_date)).size
      setStreak(monthCount)
    }
    load()
  }, [saved, user])

  useEffect(() => {
    if (tab !== 'history') return
    supabase.from('workouts').select('id,workout_date,exercises(name),sets(set_no,weight,reps,time_sec)')
      .eq('user_id', user.id).order('workout_date', { ascending: false }).order('id', { ascending: false }).limit(200)
      .then(({ data }) => setHistory(data || []))
  }, [tab, saved])

  useEffect(() => {
    if (tab !== 'progress') return
    async function load() {
      const { data: wData } = await supabase.from('workouts').select('id,workout_date').eq('user_id', user.id)
      const totalW = new Set(wData?.map(w => w.workout_date)).size
      const thisM = new Date().toISOString().slice(0,7)
      const monthW = new Set(wData?.filter(w => w.workout_date.startsWith(thisM)).map(w => w.workout_date)).size
      const monthIds = (wData||[]).filter(w=>w.workout_date.startsWith(thisM)).map(w=>w.id).filter(Boolean)
      let monthKg = 0
      if (monthIds.length > 0) {
        const { data: sData } = await supabase.from('sets').select('weight,reps,workout_id').gt('weight',0).gt('reps',0).in('workout_id', monthIds)
        monthKg = (sData||[]).reduce((s,r)=>s+r.weight*r.reps, 0)
      }
      setStats({ totalW, monthW, monthKg })
      const { data: pData } = await supabase.from('workouts').select('workout_date,exercises(name),sets(weight,reps)').eq('user_id', user.id)
      const ENG_TO_RUS = {'Жим лёжа':'Жим лёжа','Приседания':'Приседания','Становая тяга':'Становая тяга','Румынская тяга':'Румынская тяга','Жим над головой':'Жим над головой','Жим ногами':'Жим ногами','Тяга штанги в наклоне':'Тяга штанги в наклоне','Тяга вниз':'Тяга вниз','Тяга сидя':'Тяга сидя','Жим гантелей наклон':'Жим гантелей наклон','Жим гантелей лёжа':'Жим гантелей лёжа','Разводка гантелей':'Разводка гантелей','Разводка лёжа':'Разводка лёжа','Выпады':'Выпады','Сгибание ног':'Сгибание ног','Разгибание ног':'Разгибание ног','Отжимания':'Отжимания','Подтягивания':'Подтягивания','Скручивания':'Скручивания','Гиперэкстензия':'Гиперэкстензия','Бицепс':'Бицепс','Трицепс':'Трицепс','Планка':'Планка','Жим Арнольда':'Жим Арнольда','Кроссовер':'Кроссовер','Болгарские выпады':'Болгарские выпады','Молотки':'Молотки','Французский жим':'Французский жим','Тяга к лицу':'Тяга к лицу','Ягодичный мост':'Ягодичный мост','Шраги':'Шраги','Отжимания на брусьях':'Отжимания на брусьях','Тяга Т-штанги':'Тяга Т-штанги'}
      const map = {}
      pData?.forEach(w => {
        const rawName = w.exercises?.name; if (!rawName) return
        const name = EN_TO_RU[rawName] || rawName
        w.sets?.forEach(s => {
          if (s.weight>0&&s.reps>0) {
            const est=s.weight*(1+s.reps/30)
            if (!map[name]||est>map[name].est) map[name]={est:parseFloat(est.toFixed(1)),weight:s.weight,reps:s.reps,date:w.workout_date}
          } else if (s.time_sec>0) {
            if (!map[name]||s.time_sec>map[name].time_sec) map[name]={est:null,weight:0,reps:0,time_sec:s.time_sec,date:w.workout_date}
          }
        })
      })
      setPrs(Object.entries(map).sort((a,b) => (b[1].est ?? -Infinity) - (a[1].est ?? -Infinity)))
    }
    load()
  }, [tab])

  useEffect(() => {
    if (tab !== 'progress') return
    async function load() {
      const start = `${calYear}-${String(calMonth+1).padStart(2,'0')}-01`
      const end = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${new Date(calYear,calMonth+1,0).getDate()}`
      const { data } = await supabase.from('workouts').select('workout_date,sets(weight,reps)').eq('user_id', user.id).gte('workout_date',start).lte('workout_date',end)
      const map = {}
      data?.forEach(w => { const d=new Date(w.workout_date).getDate(); if(!map[d]) map[d]=0; w.sets?.forEach(s => { if(s.weight>0&&s.reps>0) map[d]+=s.weight*s.reps }) })
      setCalData(map)
    }
    load()
  }, [tab, calYear, calMonth])

  useEffect(() => {
    if (!chartEx || tab !== 'progress') return
    async function load() {
      const enName = Object.entries(EN_TO_RU).find(([,v])=>v===chartEx)?.[0] || chartEx
      const matchName = (n) => !n ? false : (n === chartEx || n === enName || ruName(n) === chartEx || n.startsWith(chartEx + ' (') || n.startsWith(enName + ' ('))
      const byDate = {}
      // First try from already-loaded history
      history.forEach(w => {
        if (!matchName(w.exercises?.name)) return
        const best = (w.sets||[]).filter(s=>s.weight>0&&s.reps>0).reduce((b,s)=>s.weight>b?s.weight:b, 0)
        if (best > 0 && (!byDate[w.workout_date] || best > byDate[w.workout_date])) byDate[w.workout_date] = best
      })
      // If nothing found, query DB directly
      if (Object.keys(byDate).length === 0) {
        const r1a = await supabase.from('exercises').select('id').eq('name', chartEx)
        const r1b = await supabase.from('exercises').select('id').ilike('name', `${chartEx} (%)`)
        const r2a = (!r1a.data?.length && !r1b.data?.length) ? await supabase.from('exercises').select('id').eq('name', enName) : {data:[]}
        const r2b = (!r1a.data?.length && !r1b.data?.length) ? await supabase.from('exercises').select('id').ilike('name', `${enName} (%)`) : {data:[]}
        const exIds = [...(r1a.data||[]), ...(r1b.data||[]), ...(r2a.data||[]), ...(r2b.data||[])].map(e=>e.id)
        if (exIds.length) {
          const { data } = await supabase.from('workouts').select('workout_date,sets(weight,reps)').in('exercise_id',exIds).eq('user_id', user.id).order('workout_date',{ascending:false}).limit(200)
          ;(data||[]).forEach(w => {
            const best = (w.sets||[]).filter(s=>s.weight>0&&s.reps>0).reduce((b,s)=>s.weight>b?s.weight:b, 0)
            if (best > 0 && (!byDate[w.workout_date] || best > byDate[w.workout_date])) byDate[w.workout_date] = best
          })
        }
      }
      const pts = Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b)).map(([date,val])=>({ val, date, label: new Date(date+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'short'}) })).filter(p=>p.val>0)
      setChartData(pts)
    }
    load()
  }, [chartEx, tab, history])

  useEffect(() => {
    if (!selectedEx) return
    async function load() {
      let { data: ex } = await supabase.from('exercises').select('id').eq('name',selectedEx).single()
      if (!ex) { setLastSession(null); return }
      const { data } = await supabase.from('workouts').select('workout_date,sets(set_no,weight,reps,time_sec)').eq('exercise_id',ex.id).eq('user_id', user.id).order('workout_date',{ascending:false}).limit(1).single()
      setLastSession(data || null)
    }
    load()
  }, [selectedEx])

  useEffect(() => {
    if (timerSecs === null || timerPaused) { clearInterval(timerRef.current); return }
    if (timerSecs <= 0) { setTimerSecs(null); setTimerPaused(false); if (navigator.vibrate) navigator.vibrate([200,100,200,100,400]); return }
    timerRef.current = setInterval(() => setTimerSecs(s => s<=1?null:s-1), 1000)
    return () => clearInterval(timerRef.current)
  }, [timerSecs, timerPaused])

  useEffect(() => {
    if (!stopwatchRunning) { clearInterval(stopwatchRef.current); return }
    stopwatchRef.current = setInterval(() => setStopwatchSecs(s => s+1), 1000)
    return () => clearInterval(stopwatchRef.current)
  }, [stopwatchRunning])

  useEffect(() => {
    if (!selectedEx) return
    const opts = getWeightOptions(selectedEx)
    setSets([{ weight: opts[0], reps: REPS_OPTIONS[0] }])
  }, [selectedEx])

  const addSet = () => { setSets(prev => { const last = prev[prev.length-1]; return [...prev, { weight: last.weight, reps: last.reps }] }) }
  const removeSet = () => sets.length > 1 && setSets(sets.slice(0,-1))
  const updateSet = (i, f, v) => { const n=[...sets]; n[i][f]=v; setSets(n) }
  const toggleFav = async (name) => {
    const isFavNow = favorites.includes(name)
    const newFavs = isFavNow ? favorites.filter(f => f !== name) : [...favorites, name]
    setFavorites(newFavs)
    if (user) {
      if (isFavNow) {
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('exercise_name', name)
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, exercise_name: name })
      }
    }
  }
  const addExToWorkout = async (name) => {
    setShowExModal(false)
    setModalSearch('')
    // fetch last session for this exercise (including grip variants)
    let lastSess = null
    const { data: exDbExact } = await supabase.from('exercises').select('id').eq('name', name)
    const { data: exDbGrip } = await supabase.from('exercises').select('id').ilike('name', `${name} (%)`)
    const allExIds = [...(exDbExact||[]), ...(exDbGrip||[])].map(e => e.id)
    if (allExIds.length) {
      const { data: lastW } = await supabase.from('workouts').select('workout_date,sets(set_no,weight,reps,time_sec)').in('exercise_id', allExIds).eq('user_id', user.id).order('workout_date',{ascending:false}).limit(1).single()
      lastSess = lastW || null
    }
    const grip = GRIP_EXERCISES.includes(name) ? 'Стандартный' : null
    setWorkoutExercises(prev => [...prev, { name, grip, open: true, lastSession: lastSess, sets: [{ weight: 0, reps: 0 }] }])
  }

  const saveWorkout = async () => {
    if (!workoutExercises.length) return
    if (saveWorkout._saving) return
    saveWorkout._saving = true
    for (const exItem of workoutExercises) {
      const exIsTimed = (EXERCISE_TYPE[exItem.name] || 'light') === 'timed'
      const filled = exItem.sets.filter(s => exIsTimed ? s.weight > 0 : (s.weight > 0 && s.reps > 0))
      if (!filled.length) continue
      const saveName = (exItem.grip && exItem.grip !== 'Стандартный') ? `${exItem.name} (${exItem.grip})` : exItem.name
      let { data: ex } = await supabase.from('exercises').select('id').eq('name', saveName).single()
      if (!ex) {
        const { data: inserted } = await supabase.from('exercises').insert({ name: saveName }).select().single()
        ex = inserted
      }
      if (!ex) continue
      const { data: w } = await supabase.from('workouts').insert({ workout_date: workoutDate, exercise_id: ex.id, user_id: user.id }).select().single()
      if (!w) { saveWorkout._saving = false; continue }
      const exIsTimed2 = (EXERCISE_TYPE[exItem.name] || 'light') === 'timed'
      await supabase.from('sets').insert(filled.map((s,i) => ({
        workout_id: w.id, set_no: i+1,
        weight: exIsTimed2 ? 0 : (s.weight||0),
        reps: exIsTimed2 ? 0 : (s.reps||0),
        time_sec: exIsTimed2 ? (s.weight||0) : null
      })))
      const maxSaved = Math.max(...filled.map(s => s.weight))
      const repsSaved = filled.find(s => s.weight === maxSaved)?.reps || 0
      const existingPr = prs.find(([name]) => name === exItem.name)
      if (existingPr) {
        const [,pr] = existingPr
        if (maxSaved > pr.weight) {
          setPrAlert({ name: exItem.name, weight: maxSaved, reps: repsSaved, prev: pr.weight })
          if (navigator.vibrate) navigator.vibrate([100,50,100,50,300])
          setTimeout(() => setPrAlert(null), 4000)
        }
      }
    }
    const thisM2 = new Date().toISOString().slice(0,7)
    const { data: mData } = await supabase.from('workouts').select('workout_date').eq('user_id', user.id)
    const monthCount = new Set((mData||[]).filter(r => r.workout_date.startsWith(thisM2)).map(r => r.workout_date)).size
    setStreak(monthCount)
    setStreakAlert({ type: 'month', count: monthCount, msg: getMotivation(monthCount) })
    setTimeout(() => setStreakAlert(null), 4500)
    saveWorkout._saving = false
    setSaved(true)
    setTimeout(() => { setSaved(false); setWorkoutStarted(false); setWorkoutExercises([]) }, 2000)
  }

  const deleteWorkout = async (workoutId) => {
    if (!window.confirm('Удалить это упражнение из тренировки?')) return
    await supabase.from('sets').delete().eq('workout_id', workoutId)
    await supabase.from('workouts').delete().eq('id', workoutId)
    setSaved(p => !p)
  }

  const deleteDay = async (date, workouts) => {
    if (!window.confirm(`Удалить тренировку за ${date}?`)) return
    const ids = workouts.map(w => w.id)
    for (const id of ids) {
      await supabase.from('sets').delete().eq('workout_id', id)
      await supabase.from('workouts').delete().eq('id', id)
    }
    setSaved(p => !p)
  }

  const copyDay = async (date, workouts) => {
    try { await navigator.clipboard.writeText(buildCopyText(date, workouts)) } catch {}
    setCopiedDay(date); setTimeout(() => setCopiedDay(null), 2000)
  }

  const openCalDay = async (day) => {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const { data } = await supabase.from('workouts').select('id,exercises(name),sets(set_no,weight,reps,time_sec)').eq('workout_date',dateStr).eq('user_id', user.id)
    setCalDayModal({ date: dateStr, workouts: data || [] })
  }

  const saveEdit = async (workoutId, newSets) => {
    await supabase.from('sets').delete().eq('workout_id', workoutId)
    await supabase.from('sets').insert(newSets.map((s,i) => ({ workout_id:workoutId, set_no:i+1, weight:parseFloat(s.weight)||0, reps:parseInt(s.reps)||0, time_sec: s.time_sec != null ? parseFloat(s.time_sec)||0 : null })))
    setEditModal(null); setSaved(p => !p)
  }

  const filtered = exercises.filter(e => {
    const q = modalSearch.toLowerCase().trim()
    if (!q) return true
    return e.name.toLowerCase().includes(q)
  })
  const favFiltered = filtered.filter(e => favorites.includes(e.name))
  const restFiltered = filtered.filter(e => !favorites.includes(e.name))
  const grouped = history.reduce((acc,w) => { if(!acc[w.workout_date]) acc[w.workout_date]=[]; acc[w.workout_date].push(w); return acc }, {})
  const calMonthName = new Date(calYear,calMonth).toLocaleDateString('ru',{month:'long',year:'numeric'})
  const firstDow = new Date(calYear,calMonth,1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear,calMonth+1,0).getDate()
  const todayStr = new Date().toISOString().split('T')[0] // eslint-disable-line
  const weightOpts = selectedEx ? getWeightOptions(selectedEx) : LIGHT_WEIGHTS
  const exType = EXERCISE_TYPE[selectedEx] || 'light'
  const isFav = favorites.includes(selectedEx)

  // Loading state
  if (user === undefined) return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:40}}>💪</div>
    </div>
  )

  // Auth screen
  if (user === null) return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/images/gymbro_icon.png" alt="logo" className="auth-logo" onError={e=>{e.target.style.display='none'}}/>
        <div className="auth-title">Gym BRO</div>
        <div className="auth-sub">{authMode==='login' ? 'Войди в свой аккаунт' : 'Создай новый аккаунт'}</div>
        {authError && <div className="auth-err">{authError}</div>}
        <div className="auth-inp-lbl">Email</div>
        <input className="auth-inp" type="email" placeholder="твой@email.com" value={authEmail}
          onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAuth()}/>
        <div className="auth-inp-lbl">Пароль</div>
        <input className="auth-inp" type="password" placeholder="минимум 6 символов" value={authPassword}
          onChange={e=>setAuthPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAuth()}/>
        <button className="auth-btn" onClick={handleAuth} disabled={authLoading || !authEmail || !authPassword}>
          {authLoading ? '...' : authMode==='login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
        <div className="auth-switch">
          {authMode==='login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          <button onClick={()=>{setAuthMode(m=>m==='login'?'register':'login');setAuthError('')}}>
            {authMode==='login' ? 'Регистрация' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      {showOnboard && (
        <div className="onboard-overlay">
          <div className="onboard-card">
            <span className="onboard-emoji">💪</span>
            <div className="onboard-title">Gym BRO</div>
            <div className="onboard-sub">Твой личный дневник тренировок. Записывай подходы, следи за прогрессом, бей рекорды.</div>
            <div className="onboard-features">
              {[['📝','Записывай тренировки за секунды'],['📈','Следи за личными рекордами'],['🔥','Не теряй серию тренировок'],['📅','Смотри историю в календаре']].map(([icon,text]) => (
                <div key={text} className="onboard-feature"><span style={{fontSize:20,width:36,textAlign:'center'}}>{icon}</span><span>{text}</span></div>
              ))}
            </div>
            <button className="onboard-btn" onClick={() => { if(user) localStorage.setItem('gbOnboarded_'+user.id,'1'); setShowOnboard(false) }}>Начать тренироваться 🚀</button>
          </div>
        </div>
      )}

      <div className="header">
        <div className="header-left">
          <img src="/images/gymbro_icon.png" alt="logo" className="header-logo" onError={e=>e.target.style.display='none'}/>
          <h1>Gym BRO</h1>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={() => { setTimerSecs(timerSecs===null?timerDuration:null); setTimerPaused(true) }} style={{
            background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:99,padding:'6px 12px',cursor:'pointer',
            color:'rgba(255,255,255,0.8)',fontSize:18,
            fontWeight:700,display:'flex',alignItems:'center'
          }}>
            {'⏱'}
          </button>
          {streak >= 1 && <div className="streak-badge">{streak}🔥</div>}
          <button onClick={handleSignOut} style={{
            background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:99,padding:'5px 11px',cursor:'pointer',
            color:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:600
          }}>Выйти</button>
        </div>
      </div>

      {tab === 'add' && (
        <div className="section">

          {(timerSecs !== null || stopwatchRunning || timerMode === 'stopwatch') && (
            <div style={{background: timerMode==='stopwatch' ? 'linear-gradient(135deg,rgba(48,209,88,0.1),rgba(48,209,88,0.05))' : 'linear-gradient(135deg,rgba(255,159,10,0.1),rgba(255,159,10,0.05))',border: timerMode==='stopwatch' ? '1px solid rgba(48,209,88,0.2)' : '1px solid rgba(255,159,10,0.2)',borderRadius:20,padding:'16px 18px',marginBottom:16}}>
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <button onClick={()=>{setTimerMode('countdown');setStopwatchRunning(false);setStopwatchSecs(0);if(timerSecs===null){setTimerSecs(timerDuration);setTimerPaused(true)}}} style={{flex:1,padding:'7px 0',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,background:timerMode==='countdown'?'rgba(255,159,10,0.2)':'rgba(255,255,255,0.06)',color:timerMode==='countdown'?'#FF9F0A':'rgba(255,255,255,0.4)'}}>⏱ Таймер</button>
                <button onClick={()=>{setTimerMode('stopwatch');setTimerSecs(null);setTimerPaused(false)}} style={{flex:1,padding:'7px 0',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,background:timerMode==='stopwatch'?'rgba(48,209,88,0.2)':'rgba(255,255,255,0.06)',color:timerMode==='stopwatch'?'#30D158':'rgba(255,255,255,0.4)'}}>⏲ Секундомер</button>
                <button onClick={()=>{setTimerSecs(null);setTimerPaused(false);setStopwatchRunning(false);setStopwatchSecs(0);setTimerMode('countdown')}} style={{width:32,height:32,borderRadius:10,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.35)',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
              </div>
              {timerMode === 'countdown' ? (<>
                <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:12}}>
                  <span style={{fontSize:48,fontWeight:800,color:timerPaused?'rgba(255,159,10,0.55)':'#FF9F0A',fontVariantNumeric:'tabular-nums',letterSpacing:'-2px'}}>
                    {`${Math.floor((timerSecs||0)/60)}:${String((timerSecs||0)%60).padStart(2,'0')}`}
                  </span>
                  {timerPaused && <span style={{fontSize:13,color:'rgba(255,159,10,0.5)',fontWeight:600}}>пауза</span>}
                </div>
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  <button onClick={()=>setTimerPaused(p=>!p)} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:timerPaused?'#30D158':'rgba(255,159,10,0.15)',color:timerPaused?'#000':'#FF9F0A'}}>
                    {timerPaused ? '▶ Продолжить' : '⏸ Пауза'}
                  </button>
                  <button onClick={()=>{setTimerSecs(timerDuration);setTimerPaused(true)}} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)'}}>↺ Заново</button>

                </div>
                <div style={{fontSize:11,opacity:0.35,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>Изменить время</div>
                <DropdownPicker options={Array.from({length:50},(_,i)=>(i+1)*5)} value={timerDuration} onChange={v=>{setTimerDuration(v);setTimerSecs(v);setTimerPaused(true)}} unit="сек" label=""/>
              </>) : (<>
                <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:12}}>
                  <span style={{fontSize:48,fontWeight:800,color:stopwatchRunning?'#30D158':'rgba(255,255,255,0.85)',fontVariantNumeric:'tabular-nums',letterSpacing:'-2px'}}>
                    {`${Math.floor(stopwatchSecs/60)}:${String(stopwatchSecs%60).padStart(2,'0')}`}
                  </span>
                </div>
                <div style={{display:'flex',gap:8,marginBottom:4}}>
                  <button onClick={()=>setStopwatchRunning(r=>!r)} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:stopwatchRunning?'rgba(255,59,48,0.15)':'#30D158',color:stopwatchRunning?'#FF453A':'#000'}}>
                    {stopwatchRunning ? '⏸ Пауза' : '▶ Старт'}
                  </button>
                  <button onClick={()=>{setStopwatchSecs(0);setStopwatchRunning(false)}} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)'}}>↺ Сброс</button>

                </div>
              </>)}
            </div>
          )}

          {!workoutStarted ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,paddingTop:'20vh',paddingBottom:40,gap:44}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.28)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:14}}>
                  {new Date().toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'long'})}
                </div>
                <div style={{fontSize:26,fontWeight:700,color:'rgba(255,255,255,0.8)',letterSpacing:'-0.3px'}}>Тренировка</div>
              </div>
              <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <style>{`
                  @keyframes pulse-ring{0%{transform:scale(1);opacity:0.15}70%{transform:scale(1.4);opacity:0}100%{transform:scale(1.4);opacity:0}}
                  .pr1{position:absolute;width:150px;height:150px;border-radius:50%;border:1px solid rgba(255,255,255,0.4);animation:pulse-ring 2.4s ease-out infinite;pointer-events:none}
                  .pr2{animation-delay:1.2s!important}
                  .start-btn:active{transform:scale(0.95)!important}
                `}</style>
                <div className="pr1"/>
                <div className="pr1 pr2"/>
                <button className="start-btn" onClick={()=>setShowDateModal(true)} style={{
                  width:150,height:150,borderRadius:'50%',cursor:'pointer',zIndex:1,
                  background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.15)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  transition:'transform 0.15s,background 0.2s,border-color 0.2s',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.09)';e.currentTarget.style.borderColor='rgba(255,255,255,0.28)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}}
                  onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'}
                  onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
                  onTouchStart={e=>e.currentTarget.style.transform='scale(0.95)'}
                  onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
                >
                  <span style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.75)',letterSpacing:'3px',textTransform:'uppercase'}}>НАЧАТЬ</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <button onClick={()=>{if(workoutExercises.length>0&&!window.confirm('Выйти? Все упражнения будут потеряны.'))return;setWorkoutStarted(false);setWorkoutExercises([]);setSaved(false)}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.45)',fontSize:14,cursor:'pointer',padding:'4px 0',fontWeight:600}}>← Назад</button>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',fontWeight:600}}>
                  📅 {new Date(workoutDate+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'long'})}
                </div>
              </div>
              {workoutExercises.map((ex, exIdx) => {
                const isOpen = ex.open
                const exType2 = EXERCISE_TYPE[ex.name] || 'light'
                const wOpts = getWeightOptions(ex.name)
                return (
                  <div key={exIdx} style={{background:'rgba(255,255,255,0.04)',borderRadius:16,border:'1px solid rgba(255,255,255,0.07)',marginBottom:10,overflow:'hidden'}}>
                    <button onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i===exIdx?{...e,open:!e.open}:e))}
                      style={{width:'100%',background:'none',border:'none',padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',textAlign:'left'}}>
                      {EXERCISE_IMAGES[ex.name]
                        ? <img src={EXERCISE_IMAGES[ex.name]} alt={ex.name} style={{width:36,height:36,borderRadius:8,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
                        : <div style={{width:36,height:36,borderRadius:8,background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>🏋️</div>
                      }
                      <div style={{flex:1}}>
                        <span style={{fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.9)'}}>{ex.name}</span>
                        {ex.grip && ex.grip !== 'Стандартный' && <span style={{fontSize:11,color:'rgba(255,159,10,0.8)',marginLeft:6,fontWeight:600}}>({ex.grip})</span>}
                      </div>
                      <span style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginRight:4}}>{ex.sets.filter(s=>s.weight>0&&s.reps>0).length} подх.</span>
                      <button onClick={e=>{e.stopPropagation();setWorkoutExercises(prev=>prev.filter((_,i)=>i!==exIdx))}}
                        style={{background:'rgba(255,59,48,0.1)',border:'none',borderRadius:8,padding:'4px 8px',color:'#FF453A',cursor:'pointer',fontSize:12,fontWeight:700,marginRight:4}}>✕</button>
                      <span style={{color:'rgba(255,255,255,0.4)',fontSize:20,display:'inline-block',transform:isOpen?'rotate(180deg)':'none',transition:'transform 0.2s',padding:'2px 8px',minWidth:32,textAlign:'center'}}>▼</span>
                    </button>
                    {isOpen && (
                      <div style={{padding:'0 14px 14px'}}>
                        {ex.lastSession && (
                          <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginBottom:10,padding:'7px 10px',background:'rgba(255,255,255,0.03)',borderRadius:8}}>
                            💡 Прошлый раз: {ex.lastSession.sets?.sort((a,b)=>a.set_no-b.set_no).map(s=>s.time_sec>0?`${s.time_sec}s`:`${s.weight}×${s.reps}`).join(' · ')}
                          </div>
                        )}
                        {ex.grip !== null && ex.grip !== undefined && (
                          <div style={{marginBottom:12}}>
                            <div style={{fontSize:11,opacity:0.4,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Хват</div>
                            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                              {(GRIP_MUSCLES[ex.name] ? Object.keys(GRIP_MUSCLES[ex.name]) : GRIP_OPTIONS).map(g => (
                                <button key={g} onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,grip:g}))}
                                  style={{padding:'5px 12px',borderRadius:99,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',
                                    background: ex.grip===g ? '#FF9F0A' : 'rgba(255,255,255,0.08)',
                                    color: ex.grip===g ? '#000' : 'rgba(255,255,255,0.6)'}}>
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {ex.sets.map((s,si) => (
                          <div key={si} className="set-row">
                            <span className="set-num">{si+1}</span>
                            {exType2 === 'timed' ? (
                              <DropdownPicker options={TIME_OPTIONS} value={s.weight} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,weight:v})}))} unit="s" label={`Подход ${si+1}`}/>
                            ) : (
                              <>
                                <DropdownPicker options={wOpts} value={s.weight} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,weight:v})}))} unit="кг" label={`Подход ${si+1} — Вес`}/>
                                <span className="set-sep">×</span>
                                <DropdownPicker options={REPS_OPTIONS} value={s.reps} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,reps:v})}))} unit="повт" label={`Подход ${si+1} — Повт`}/>
                              </>
                            )}
                          </div>
                        ))}
                        <div className="set-btns" style={{marginTop:4}}>
                          <button className="set-btn" onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:[...e.sets,{weight:e.sets[e.sets.length-1]?.weight||0,reps:e.sets[e.sets.length-1]?.reps||0}]}))}>➕ Подход</button>
                          <button className="set-btn" onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.length>1?e.sets.slice(0,-1):e.sets}))} style={{opacity:ex.sets.length<=1?0.35:1}}>➖ Убрать</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              <button className="ex-selector-btn" onClick={()=>setShowExModal(true)} style={{marginBottom:16}}>
                <span style={{opacity:0.55}}>➕ Добавить упражнение...</span>
                <span style={{opacity:0.4,fontSize:20}}>⏄</span>
              </button>
              {workoutExercises.length > 0 && (
                <button className={`save-btn${saved?' done':''}`} onClick={saveWorkout} disabled={saved}>
                  {saved ? '✅ Тренировка сохранена!' : `💾 Сохранить тренировку (${workoutExercises.length} упр.)`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'history' && (() => {
        // Build list of available months from history
        const allMonths = [...new Set(history.map(w => w.workout_date.slice(0,7)))].sort().reverse()
        const activeMonth = historyMonth || allMonths[0] || ''
        const filtered = history.filter(w => w.workout_date.startsWith(activeMonth))
        const filteredGrouped = filtered.reduce((acc,w) => { if(!acc[w.workout_date]) acc[w.workout_date]=[]; acc[w.workout_date].push(w); return acc }, {})
        const workoutDaysCount = Object.keys(filteredGrouped).length
        const monthLabel = (m) => {
          if (!m) return ''
          const [y,mo] = m.split('-')
          return new Date(y, mo-1).toLocaleDateString('ru', {month:'long', year:'numeric'})
        }
        return (
          <div className="section">
            {/* Month selector */}
            {allMonths.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                  <div style={{flex:1}}>
                    <DropdownPicker
                      options={allMonths}
                      value={activeMonth}
                      onChange={v=>{setHistoryMonth(v);setOpenDays({})}}
                      unit=""
                      label="Месяц"
                      labelFn={formatMonth}
                    />
                  </div>
                  <div style={{background:'#1c1c1e',borderRadius:12,padding:'10px 14px',textAlign:'center',flexShrink:0,minWidth:72}}>
                    <div style={{fontSize:22,fontWeight:800,color:'#30D158'}}>{workoutDaysCount}</div>
                    <div style={{fontSize:10,opacity:0.4,marginTop:2,textTransform:'uppercase',letterSpacing:'0.5px'}}>трен.</div>
                  </div>
                </div>
              </div>
            )}
            {Object.keys(filteredGrouped).length === 0 && <div style={{opacity:0.5,marginTop:20}}>Нет записей</div>}
            {Object.entries(filteredGrouped).map(([date, ws]) => {
              const isOpen = openDays[date]
              return (
                <div key={date} className="day-group">
                  <button className={`day-hdr${isOpen?' open':''}`} onClick={() => setOpenDays(p=>({...p,[date]:!p[date]}))}>
                    <span>{formatDateShort(date)}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:12,opacity:0.4}}>{ws.length} упр.</span>
                      <span className={`day-chev${isOpen?' open':''}`}>▼</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="day-body">
                      <div className="day-actions">
                        <button className={`day-action-btn${copiedDay===date?' ok':''}`} onClick={() => copyDay(date,ws)}>{copiedDay===date?'✅ Скопировано':'📋 Копировать'}</button>
                        <button className="day-action-btn" onClick={() => setEditModal({date,workouts:ws.map(w=>({...w,sets:w.sets?[...w.sets]:[]}))})}> ✏️ Редактировать</button>
                        <button className="day-action-btn del" onClick={() => deleteDay(date,ws)}>🗑 Удалить</button>
                      </div>
                      {ws.map(w => (
                        <div key={w.id} className="hist-card" style={{position:'relative'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <div className="hist-ex">{ruName(w.exercises?.name)}</div>
                            <button onClick={()=>deleteWorkout(w.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,opacity:0.4,padding:'0 4px',color:'#ff453a'}} title="Удалить упражнение">✕</button>
                          </div>
                          <div className="chips">{w.sets?.sort((a,b)=>a.set_no-b.set_no).map((s,i) => <span key={i} className="chip">{s.time_sec>0?`${s.time_sec}s`:`${s.weight}×${s.reps}`}</span>)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {tab === 'progress' && (() => {
        // Compute muscle scores
        const daysAgoDate = new Date(Date.now() - musclePeriod*24*60*60*1000).toISOString().split('T')[0]
        const recentHistory = history.filter(w => w.workout_date >= daysAgoDate)
        // Count unique training days per muscle (not exercise occurrences)
        const muscleDates = {}
        recentHistory.forEach(w => {
          const wName = ruName(w.exercises?.name)
          // Check if exercise has grip variant (e.g. "Тяга вниз (Широкий)")
          const gripMatch = wName.match(/^(.+) \((.+)\)$/)
          let muscles = []
          if (gripMatch && GRIP_MUSCLES[gripMatch[1]]?.[gripMatch[2]]) {
            muscles = GRIP_MUSCLES[gripMatch[1]][gripMatch[2]]
          } else {
            muscles = EXERCISE_MUSCLES[wName] || []
          }
          muscles.forEach(m => {
            if (!muscleDates[m]) muscleDates[m] = new Set()
            muscleDates[m].add(w.workout_date)
          })
        })
        const muscleCounts = Object.fromEntries(Object.entries(muscleDates).map(([m, dates]) => [m, dates.size]))
        const muscleScores = muscleCounts
        return (
        <div className="section">
          {stats && (
            <div className="stats-row">
              <div className="stat-card"><div className="stat-val">{stats.monthW}</div><div className="stat-lbl">{new Date().toLocaleDateString('ru',{month:'long'})}</div></div>
              <div className="stat-card"><div className="stat-val">{stats.totalW}</div><div className="stat-lbl">всего</div></div>
              <div className="stat-card"><div className="stat-val" style={{color:'#69F0AE',fontSize:18}}>{stats.monthKg>=1000?`${(stats.monthKg/1000).toFixed(1)}K`:Math.round(stats.monthKg)} kg</div><div className="stat-lbl">поднято за месяц</div></div>
            </div>
          )}
          <div className="prog-title">💪 Нагрузка по мышцам</div>
          <div className="chart-wrap" style={{padding:'16px 8px'}}>
            <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:14}}>
              {[[7,'7 дней'],[30,'30 дней']].map(([days,label]) => (
                <button key={days} onClick={()=>setMusclePeriod(days)} style={{
                  padding:'6px 18px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
                  background: musclePeriod===days ? '#30D158' : '#2c2c2e',
                  color: musclePeriod===days ? '#000' : 'rgba(255,255,255,0.5)',
                }}>{label}</button>
              ))}
            </div>
            <MuscleMap muscleScores={muscleScores} period={musclePeriod}/>
            <div style={{display:'flex',justifyContent:'center',gap:14,marginTop:12}}>
              {[['#3A3A3C','Нет'],['#FFD60A','Мало'],['#30C85E','Норма'],['#30D158','Отлично'],['#FF453A','Перегрузка']].map(([color,label])=>(
                <div key={label} style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:10,height:10,borderRadius:3,background:color,flexShrink:0}}/>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="prog-title">📅 Календарь</div>
          <div className="cal-nav">
            <button className="cal-btn" onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1)}}>◀</button>
            <span className="cal-mname">{calMonthName}</span>
            <button className="cal-btn" onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1)}}>▶</button>
          </div>
          <div className="cal-grid">
            {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=><div key={d} className="cal-dow">{d}</div>)}
            {Array(offset).fill(null).map((_,i)=><div key={`e${i}`} className="cal-cell empty"/>)}
            {Array(daysInMonth).fill(null).map((_,i)=>{
              const day=i+1; const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const trained=calData[day]!==undefined; const vol=calData[day]||0
              return <div key={day} className={`cal-cell${trained?' trained':''}${ds===todayStr?' today':''}`} onClick={()=>trained&&openCalDay(day)}>{day}{trained&&vol>0&&<div className="cal-vol">{vol>=1000?`${(vol/1000).toFixed(1)}K`:vol}</div>}</div>
            })}
          </div>
          <button onClick={()=>setOpenPrs(p=>({...p,__all__:!p.__all__}))} style={{
            width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',
            cursor:'pointer',marginBottom:4
          }}>
            <span style={{fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.85)'}}>🏆 Личные рекорды</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.35)'}}>{prs.length} упр.</span>
              <span style={{color:'rgba(255,255,255,0.3)',fontSize:12,display:'inline-block',transition:'transform 0.2s',transform:openPrs.__all__?'rotate(180deg)':'none'}}>▼</span>
            </div>
          </button>
          {openPrs.__all__ && <div style={{background:'rgba(255,255,255,0.04)',borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)',marginBottom:4}}>
          {prs.map(([name,pr], prIdx)=>{
            const isOpen=openPrs[name]; const img=EXERCISE_IMAGES[ruName(name)]
            return (
              <div key={name} style={{borderBottom: prIdx<prs.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none'}}>
                <button style={{width:'100%',background:'none',border:'none',cursor:'pointer',padding:'11px 16px',display:'flex',alignItems:'center',gap:10,textAlign:'left'}} onClick={()=>setOpenPrs(p=>({...p,[name]:!p[name]}))}>
                  {img ? <img src={img} alt={name} style={{width:32,height:32,borderRadius:7,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/> : <div style={{width:32,height:32,borderRadius:7,background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:16}}>🏋️</div>}
                  <span style={{flex:1,color:'rgba(255,255,255,0.85)',fontSize:14,fontWeight:600}}>{ruName(name)}</span>
                  <span style={{color:'#30D158',fontSize:14,fontWeight:700,marginRight:8}}>{pr.time_sec>0 ? `${pr.time_sec}с` : `~${pr.est} кг`}</span>
                  <span style={{color:'rgba(255,255,255,0.25)',fontSize:11,display:'inline-block',transition:'transform 0.2s',transform:isOpen?'rotate(180deg)':'none'}}>▼</span>
                </button>
                {isOpen && <div style={{padding:'2px 16px 12px 58px',display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontSize:13,color:'rgba(255,255,255,0.6)',fontWeight:600}}>{pr.time_sec>0 ? `${pr.time_sec}с` : `${pr.weight} кг × ${pr.reps} повт`}</span>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>{new Date(pr.date).toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>}
              </div>
            )
          })}
          </div>}
          <div className="prog-title">📊 График роста</div>
          <div className="chart-wrap">
            <select className="chart-ex-select" value={chartEx} onChange={e=>setChartEx(e.target.value)}>{exercises.map(e=><option key={e.id} value={e.name}>{ruName(e.name)}</option>)}</select>
            <LineChart data={(() => {
              if (chartPeriod === 'ALL') return chartData
              const months = chartPeriod === '1M' ? 1 : 3
              const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months)
              const cutoffStr = cutoff.toISOString().split('T')[0]
              return chartData.filter(p => p.date >= cutoffStr)
            })()} period={chartPeriod} setPeriod={setChartPeriod}/>
          </div>
        </div>
        )
      })()}

      {showExModal && (
        <div className="modal-overlay" style={{paddingBottom:kbHeight}} onClick={e=>{if(e.target.classList.contains('modal-overlay')){setShowExModal(false);setModalSearch('')}}}>
          <div className="modal">
            <div className="modal-handle"/>
            <div className="modal-hdr">
              <div className="modal-title">Выбери упражнение</div>
              <div className="modal-srch-wrap"><span className="modal-srch-icon">🔍</span><input className="modal-srch" placeholder="Поиск..." value={modalSearch} onChange={e=>setModalSearch(e.target.value)}/></div>
            </div>
            <div className="modal-list">
              {!modalSearch&&favFiltered.length>0&&<><div className="modal-sect-lbl">⭐ Избранные</div>{favFiltered.map(ex=><ModalItem key={ex.id} ex={ex} onSelect={()=>addExToWorkout(ex.name)}/>)}<div className="modal-sect-lbl">Все упражнения</div></>}
              {(modalSearch?filtered:restFiltered).map(ex=><ModalItem key={ex.id} ex={ex} onSelect={()=>addExToWorkout(ex.name)}/>)}
            </div>
          </div>
        </div>
      )}

      {calDayModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target.classList.contains('modal-overlay'))setCalDayModal(null)}}>
          <div className="modal">
            <div className="modal-handle"/>
            <div className="modal-hdr"><div className="modal-title" style={{marginBottom:0}}>{formatDateShort(calDayModal.date)}</div></div>
            <div className="modal-list">
              {calDayModal.workouts.map(w=>(
                <div key={w.id} style={{padding:'12px 10px',borderRadius:12,marginBottom:6,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:7}}>{ruName(w.exercises?.name)}</div>
                  <div className="chips">{w.sets?.sort((a,b)=>a.set_no-b.set_no).map((s,i)=><span key={i} className="chip">{s.time_sec>0?`${s.time_sec}s`:`${s.weight}×${s.reps}`}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editModal && <EditModal data={editModal} onClose={()=>setEditModal(null)} onSave={saveEdit}/>}

      {/* Timer Modal */}
      {showDateModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowDateModal(false)}}>
          <div style={{background:'#1c1c1e',borderRadius:20,padding:'28px 24px',width:'calc(100% - 48px)',maxWidth:320,border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{fontSize:17,fontWeight:700,color:'#fff',marginBottom:20,textAlign:'center'}}>📅 Выбери дату тренировки</div>
            <div style={{position:'relative',marginBottom:16}}>
              <div style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:12,padding:'14px 16px',color:'#fff',fontSize:16,fontWeight:600,
                display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span>{new Date(workoutDate+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'long',year:'numeric'})}</span>
                <span style={{fontSize:18}}>📅</span>
              </div>
              <input type="date" value={workoutDate} onChange={e=>setWorkoutDate(e.target.value)}
                style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',opacity:0,cursor:'pointer',zIndex:2,colorScheme:'dark'}}/>
            </div>
            <button onClick={()=>{setShowDateModal(false);setWorkoutStarted(true)}}
              style={{width:'100%',padding:'15px',borderRadius:14,border:'none',cursor:'pointer',
              background:'#30D158',color:'#000',fontSize:15,fontWeight:700}}>
              ✅ Начать тренировку
            </button>
          </div>
        </div>
      )}


      {/* PR Alert Toast */}
      {prAlert && (
        <div className="alert-toast" style={{borderColor:'rgba(255,200,0,0.3)'}}>
          <div className="alert-toast-icon">🥇</div>
          <div>
            <div className="alert-toast-title">Новый рекорд!</div>
            <div className="alert-toast-sub">{prAlert.name}: {prAlert.weight} кг × {prAlert.reps} повт</div>
            <div style={{fontSize:11,color:'#FF9F0A',marginTop:2}}>Было: {prAlert.prev} кг</div>
          </div>
        </div>
      )}

      {/* Motivational Toast */}
      {streakAlert && streakAlert.type === 'month' && (
        <div className="alert-toast" style={{borderColor:'rgba(48,209,88,0.3)'}}>
          <div className="alert-toast-icon">
            {streakAlert.count>=20?'👑':streakAlert.count>=10?'🏆':streakAlert.count>=5?'⚡':'🔥'}
          </div>
          <div>
            <div className="alert-toast-title">{streakAlert.count}-я тренировка месяца!</div>
            <div className="alert-toast-sub">{streakAlert.msg}</div>
          </div>
        </div>
      )}

      <div className="nav-bar">
        {[{id:'add',icon:'➕',label:'Тренировка'},{id:'history',icon:'📜',label:'История'},{id:'progress',icon:'📈',label:'Прогресс'}].map(t=>(
          <div key={t.id} className="nav-item" style={{opacity:tab===t.id?1:0.38}} onClick={()=>{setTab(t.id);if(t.id!=='add'){setWorkoutStarted(false);setSelectedEx(null)}}}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-lbl" style={{color:tab===t.id?'#00C853':'white'}}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
