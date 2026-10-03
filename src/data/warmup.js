// Warm-up library and a builder that adapts the warm-up to today's workout.
// Images: put /images/warmup/<id>.webp; until a picture exists the emoji is shown.
import { getAnatomy } from './muscleLoad'
import { getDefaultVariant } from './exerciseCatalog'

// sec — timed step; reps — repetitions (the user taps «Готово»)
export const WARMUP_MOVES = {
  jumping_jacks:  { name: 'Прыжки «звёздочка»',       emoji: '⭐', sec: 60, cue: 'Мягко на носках, руки над головой. Темп такой, чтобы можно было говорить.' },
  high_knees:     { name: 'Бег на месте',              emoji: '🏃', sec: 60, cue: 'Колени до уровня пояса, работай руками. Без прыжков — если болят колени.' },
  arm_circles:    { name: 'Вращения руками',           emoji: '🔄', sec: 30, cue: '15 сек вперёд, 15 сек назад. Начни с маленьких кругов, постепенно увеличивай.' },
  shoulder_pass:  { name: 'Выкруты с палкой',          emoji: '🦯', reps: 10, cue: 'Палка или резина широким хватом: из положения перед собой — за спину и обратно. Руки прямые.' },
  wrist_rolls:    { name: 'Вращения запястий',         emoji: '✊', sec: 20, cue: 'Сцепи пальцы в замок и вращай кистями в обе стороны.' },
  hip_circles:    { name: 'Вращения тазом',            emoji: '⭕', sec: 30, cue: 'Руки на поясе, широкие круги тазом. По 15 сек в каждую сторону.' },
  torso_twists:   { name: 'Повороты корпуса',          emoji: '↔️', reps: 12, cue: 'Стопы на месте, поворачивайся плечами, руки расслаблены.' },
  knee_circles:   { name: 'Вращения коленями',         emoji: '🦵', sec: 20, cue: 'Стопы вместе, ладони на коленях, круги в обе стороны.' },
  ankle_rolls:    { name: 'Вращения стопой',           emoji: '🦶', sec: 20, cue: 'Носок в пол, по 10 сек каждой стопой.' },
  cat_cow:        { name: 'Кошка-корова',              emoji: '🐈', reps: 10, cue: 'На четвереньках: выгни спину вверх на выдохе, прогни вниз на вдохе. Медленно.' },
  scap_pushups:   { name: 'Отжимания лопатками',       emoji: '🪽', reps: 12, cue: 'Упор лёжа, руки прямые. Сводим и разводим только лопатки — локти не сгибаем.' },
  wall_pushups:   { name: 'Отжимания от стены',        emoji: '🧱', reps: 12, cue: 'Лёгкая версия отжиманий: разогревает грудь, плечи и трицепс без нагрузки.', img: 'push_ups' },
  band_pull_apart:{ name: 'Разведение резины',         emoji: '🎗️', reps: 15, cue: 'Резина на уровне груди, прямые руки разводим в стороны, сводим лопатки. Без резины — с полотенцем.' },
  dead_hang:      { name: 'Вис на турнике',            emoji: '🙌', sec: 20, cue: 'Расслабленный вис, плечи тянутся вверх. Разгружает позвоночник и готовит хват.' },
  scap_pullups:   { name: 'Подтягивания лопатками',    emoji: '🔼', reps: 8, cue: 'В висе опусти плечи вниз, не сгибая рук, и вернись. Включает широчайшие.' },
  air_squats:     { name: 'Приседания без веса',       emoji: '🪑', reps: 15, cue: 'Пятки на полу, колени по направлению носков, таз назад. Глубоко, но без боли.', img: 'squat' },
  lunge_twist:    { name: 'Выпад с поворотом',         emoji: '🌀', reps: 8, cue: 'Глубокий выпад, поворот корпуса к передней ноге. По 4 на каждую ногу.', img: 'lunges' },
  leg_swings:     { name: 'Махи ногами',               emoji: '🦿', reps: 20, cue: 'Держись за опору: 10 махов вперёд-назад и 10 в стороны каждой ногой.' },
  glute_bridge:   { name: 'Ягодичный мост',            emoji: '🌉', reps: 15, cue: 'Лёжа на спине, поднимай таз за счёт ягодиц, пауза наверху на 1 сек.', img: 'hip_thrust' },
  good_morning:   { name: 'Наклоны «гуд морнинг»',     emoji: '🙇', reps: 12, cue: 'Руки за головой, спина прямая, наклон за счёт таза. Растягивает бицепс бедра.' },
  inchworm:       { name: 'Гусеница',                  emoji: '🐛', reps: 6, cue: 'Из наклона пройди руками в упор лёжа и обратно. Ноги почти прямые.' },
  dead_bug:       { name: 'Мёртвый жук',               emoji: '🪲', reps: 12, cue: 'Лёжа, поясница прижата: одновременно опускай противоположные руку и ногу.' },
}

const PULSE = ['jumping_jacks']
const JOINTS = ['arm_circles', 'hip_circles', 'knee_circles', 'ankle_rolls']
// Targeted activation per focus area of the workout
const FOCUS_MOVES = {
  push: ['shoulder_pass', 'scap_pushups', 'wall_pushups'],
  pull: ['cat_cow', 'band_pull_apart', 'scap_pullups'],
  legs: ['air_squats', 'lunge_twist', 'leg_swings', 'glute_bridge'],
  hinge: ['good_morning', 'glute_bridge', 'cat_cow'],
  core: ['dead_bug'],
}
const FOCUS_LABELS = { push: 'грудь и плечи', pull: 'спина', legs: 'ноги', hinge: 'задняя поверхность', core: 'кор' }
const MUSCLE_FOCUS = {
  chest_upper: 'push', chest_lower: 'push', delts_front: 'push', delts_side: 'push', triceps: 'push', serratus: 'push',
  lats: 'pull', rhomboids: 'pull', delts_rear: 'pull', rotator: 'pull', biceps: 'pull', brachioradialis: 'pull', traps_upper: 'pull',
  rectus_femoris: 'legs', vastus_lateralis: 'legs', vastus_medialis: 'legs', adductors: 'legs', glutes_max: 'legs', glutes_med: 'legs',
  gastrocnemius: 'legs', soleus: 'legs', tibialis: 'legs',
  hamstrings: 'hinge', erectors: 'hinge',
  abs: 'core', obliques: 'core', hip_flexors: 'core',
}

// Which focus areas today's exercises hit (primary muscles weigh more)
export function workoutFocus(exerciseNames) {
  const score = {}
  exerciseNames.forEach(n => {
    const a = getAnatomy(n)
    if (!a) return
    a.primary.forEach(m => { const f = MUSCLE_FOCUS[m]; if (f) score[f] = (score[f] || 0) + 2 })
    a.secondary.forEach(m => { const f = MUSCLE_FOCUS[m]; if (f) score[f] = (score[f] || 0) + 0.5 })
  })
  return Object.entries(score).sort((a, b) => b[1] - a[1]).filter(([, v]) => v >= 2).map(([f]) => f).slice(0, 3)
}

// Builds the body warm-up: pulse → joints → activation for today's focus (no weighted ramp-up sets)
export function buildWarmup(workoutExercises = []) {
  const names = workoutExercises.map(e => (e.grip && e.grip !== getDefaultVariant(e.name) ? `${e.name} (${e.grip})` : e.name))
  let focus = workoutFocus(names)
  const general = focus.length === 0
  if (general) focus = ['push', 'pull', 'legs']

  const used = new Set()
  const take = (ids) => ids.filter(id => !used.has(id) && used.add(id))
  const activation = []
  focus.forEach(f => activation.push(...take(FOCUS_MOVES[f]).slice(0, general ? 1 : 3)))
  if (!general && focus.includes('push') && !used.has('wrist_rolls')) activation.unshift(...take(['wrist_rolls']))
  if (general) activation.push(...take(['inchworm', 'torso_twists']))

  const blocks = [
    { title: 'Пульс', subtitle: 'Разогреваем тело', moves: take(PULSE) },
    { title: 'Суставы', subtitle: 'Мягко разрабатываем', moves: take(JOINTS) },
    { title: 'Активация', subtitle: general ? 'Всё тело' : `Под тренировку: ${focus.map(f => FOCUS_LABELS[f]).join(', ')}`, moves: activation },
  ]

  const steps = blocks.flatMap(b => b.moves.map(id => ({ id, block: b.title, ...WARMUP_MOVES[id] })))
  const totalSec = steps.reduce((s, m) => s + (m.sec || m.reps * 3), 0)
  return { blocks, steps, focus: general ? [] : focus, totalMin: Math.max(1, Math.round(totalSec / 60)) }
}
