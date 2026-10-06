// Warm-up: a short universal body warm-up that is comfortable to do standing anywhere in the gym —
// no floor work, no equipment, no barbell. Same sequence before any workout.
// Images: put /images/warmup/<id>.webp; until a picture exists the emoji is shown.

// sec — timed step; reps — repetitions (the user taps «Готово»)
export const WARMUP_MOVES = {
  // Pulse
  jumping_jacks:  { name: 'Прыжки «звёздочка»',   emoji: '⭐', sec: 60, cue: 'Мягко на носках, руки над головой. Темп такой, чтобы можно было говорить. Можно заменить 2–3 минутами на дорожке или велотренажёре.' },
  // Joints
  neck_tilts:     { name: 'Наклоны головы',        emoji: '🙂', sec: 20, cue: 'Плавно вперёд-назад и к плечам. Без резких круговых вращений.' },
  shoulder_rolls: { name: 'Вращения плечами',      emoji: '🔃', sec: 20, cue: 'Поднимай плечи к ушам и прокручивай назад, потом вперёд. Руки расслаблены.' },
  arm_circles:    { name: 'Вращения руками',       emoji: '🔄', sec: 30, cue: '15 сек вперёд, 15 сек назад. Начни с маленьких кругов, постепенно увеличивай.' },
  wrist_rolls:    { name: 'Вращения запястий',     emoji: '✊', sec: 20, cue: 'Сцепи пальцы в замок и вращай кистями в обе стороны.' },
  hip_circles:    { name: 'Вращения тазом',        emoji: '⭕', sec: 30, cue: 'Руки на поясе, широкие круги тазом. По 15 сек в каждую сторону.' },
  knee_circles:   { name: 'Вращения коленями',     emoji: '🦵', sec: 20, cue: 'Руки на поясе, подними колено и вращай голенью по кругу в обе стороны. По 10 сек на каждую ногу.' },
  ankle_rolls:    { name: 'Вращения стопой',       emoji: '🦶', sec: 20, cue: 'Носок в пол, по 10 сек каждой стопой.' },
  // Whole body, standing
  arm_swings:     { name: 'Махи руками',           emoji: '🤗', reps: 12, cue: 'Разводи прямые руки в стороны и скрещивай перед грудью, как будто обнимаешь себя. Раскрывает грудь и плечи.' },
  torso_twists:   { name: 'Повороты корпуса',      emoji: '↔️', reps: 12, cue: 'Стопы на месте, поворачивайся плечами вправо-влево, руки свободно следуют за корпусом.' },
  side_bends:     { name: 'Наклоны в стороны',     emoji: '🌙', reps: 10, cue: 'Рука над головой, тянись в сторону. По 5 на каждую сторону, без рывков.' },
  air_squats:     { name: 'Приседания без веса',   emoji: '🪑', reps: 12, cue: 'Руки вперёд, пятки на полу, колени по направлению носков. Глубина — насколько комфортно.' },
  knee_hugs:      { name: 'Колено к груди',        emoji: '🧎', reps: 10, cue: 'Стоя, подтяни колено к груди руками на пару секунд, поставь ногу и смени. По 5 на ногу.' },
  leg_swings:     { name: 'Махи ногами',           emoji: '🦿', reps: 20, cue: 'Держись рукой за стойку или тренажёр: 10 махов вперёд-назад и 10 в стороны каждой ногой.' },
}

const BLOCKS = [
  { title: 'Пульс', subtitle: 'Разогреваем тело', moves: ['jumping_jacks'] },
  { title: 'Суставы', subtitle: 'Сверху вниз', moves: ['neck_tilts', 'shoulder_rolls', 'arm_circles', 'wrist_rolls', 'hip_circles', 'knee_circles', 'ankle_rolls'] },
  { title: 'Всё тело', subtitle: 'Стоя, без инвентаря', moves: ['arm_swings', 'torso_twists', 'side_bends', 'air_squats', 'knee_hugs', 'leg_swings'] },
]

export function buildWarmup() {
  const steps = BLOCKS.flatMap(b => b.moves.map(id => ({ id, block: b.title, ...WARMUP_MOVES[id] })))
  const totalSec = steps.reduce((s, m) => s + (m.sec || m.reps * 3), 0)
  return { blocks: BLOCKS, steps, totalMin: Math.max(1, Math.round(totalSec / 60)) }
}
