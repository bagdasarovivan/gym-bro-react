// Stretching after the workout: static holds that can be done standing in a gym, using a rack,
// a bench or a pull-up bar — no lying on the floor. Same sequence after any workout.
// Images: put /images/stretch/<id>.webp; until a picture exists the emoji is shown.
import { stepSeconds } from '../components/RoutinePlayer'

// sec — hold time; sides — the hold is done on each side (sec per side)
export const STRETCH_MOVES = {
  // Upper body
  bar_hang:         { name: 'Вис на турнике',          emoji: '🙌', sec: 30, cue: 'Повисни на прямых руках, плечи расслаблены, ноги можно оставить на полу или на скамье. Разгружает позвоночник и тянет широчайшие.' },
  lat_rack:         { name: 'Широчайшие у стойки',     emoji: '🧲', sec: 30, cue: 'Возьмись обеими руками за стойку на уровне пояса, отведи таз назад и опусти грудь между рук. Спина прямая.' },
  chest_rack:       { name: 'Грудь у стойки',          emoji: '🚪', sec: 30, sides: true, cue: 'Предплечье на стойку, локоть на уровне плеча. Медленно разворачивай корпус от руки, пока не почувствуешь грудную мышцу.' },
  cross_arm:        { name: 'Плечо поперёк груди',     emoji: '💪', sec: 30, sides: true, cue: 'Прямую руку перед грудью прижми другой рукой выше локтя. Плечо не поднимай к уху.' },
  triceps_overhead: { name: 'Трицепс за головой',      emoji: '🙆', sec: 30, sides: true, cue: 'Согни руку за головой, другой рукой мягко потяни локоть вниз и к центру. Корпус ровно.' },
  // Lower body
  quad_standing:    { name: 'Квадрицепс стоя',         emoji: '🦵', sec: 30, sides: true, cue: 'Держась за стойку, возьми стопу рукой и подтяни пятку к ягодице. Колени рядом, таз чуть вперёд.' },
  hamstring_bench:  { name: 'Бицепс бедра на скамье',  emoji: '🪑', sec: 30, sides: true, cue: 'Пятку на скамью, нога прямая, носок на себя. Наклоняйся вперёд с прямой спиной, не округляя поясницу.' },
  hip_flexor_lunge: { name: 'Сгибатели бедра в выпаде', emoji: '🏃', sec: 30, sides: true, cue: 'Длинный шаг вперёд, заднее колено почти прямое. Подкрути таз и мягко опускайся, пока не потянет перед бедра сзади стоящей ноги.' },
  glute_figure4:    { name: 'Ягодицы стоя',            emoji: '4️⃣', sec: 30, sides: true, cue: 'Держась за стойку, положи щиколотку на колено опорной ноги и присядь, отводя таз назад, как будто садишься на стул.' },
  calf_wall:        { name: 'Икры у стены',            emoji: '🦶', sec: 30, sides: true, cue: 'Руки в стену, одна нога сзади прямая, пятка прижата к полу. Подайся корпусом вперёд.' },
}

const BLOCKS = [
  { title: 'Верх', subtitle: 'Спина, грудь, руки', moves: ['bar_hang', 'lat_rack', 'chest_rack', 'cross_arm', 'triceps_overhead'] },
  { title: 'Низ', subtitle: 'Бёдра, ягодицы, икры', moves: ['quad_standing', 'hamstring_bench', 'hip_flexor_lunge', 'glute_figure4', 'calf_wall'] },
]

export function buildStretch() {
  const steps = BLOCKS.flatMap(b => b.moves.map(id => ({ id, block: b.title, ...STRETCH_MOVES[id] })))
  const totalSec = steps.reduce((s, m) => s + stepSeconds(m), 0)
  return { blocks: BLOCKS, steps, totalMin: Math.max(1, Math.round(totalSec / 60)) }
}
