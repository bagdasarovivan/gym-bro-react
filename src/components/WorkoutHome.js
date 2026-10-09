import { useMemo, useState } from 'react'
import { MUSCLE_FILTERS_ROW1, MUSCLE_FILTERS_ROW2, getExImage, normalizeName } from '../data/exerciseCatalog'
import { groupsOf } from '../data/achievements'
import { exName, fmtVolume, locale, plural, t } from '../i18n'
import { localDateStr } from '../utils/format'
import { TodayPlanCard } from './Plans'

// Empty workout screen: last workout with "repeat", muscle readiness, plan of the day,
// quick add from favourites, warm-up and stretching.

const ACC = 'var(--accent)'
const accA = (a) => `rgba(var(--accent-rgb),${a})`
const DAY = 86400000
const GROUP_LABEL = Object.fromEntries([...MUSCLE_FILTERS_ROW1, ...MUSCLE_FILTERS_ROW2].map(f => [f.id, f.label]))
const GROUP_ORDER = ['chest', 'back', 'legs', 'shoulders', 'glutes', 'biceps', 'triceps', 'abs', 'calves']
const dayDiff = (date) => Math.round((new Date(localDateStr(new Date()) + 'T12:00:00') - new Date(date + 'T12:00:00')) / DAY)

const Title = ({ children, thm, right }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '18px 2px 8px' }}>
    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: thm.text40 }}>{children}</span>
    {right}
  </div>
)

function Thumb({ name, size }) {
  const img = getExImage(name)
  const [bad, setBad] = useState(false)
  if (!img || bad) return <div style={{ width: size, height: size, borderRadius: 14, background: 'rgba(128,128,128,0.15)' }} />
  return <img src={img} alt="" loading="lazy" onError={() => setBad(true)} style={{ width: size, height: size, borderRadius: 14, objectFit: 'cover', background: '#fff', display: 'block' }} />
}

// The latest workout day: its exercises (in the order they were done) and tonnage
export function lastWorkout(allRows) {
  const rows = (allRows || []).filter(w => w.workout_date && normalizeName(w.exercises?.name))
  if (!rows.length) return null
  const today = localDateStr(new Date())
  const dates = [...new Set(rows.map(w => w.workout_date))].sort().reverse()
  const date = dates.find(d => d < today) || dates[0]
  const day = rows.filter(w => w.workout_date === date).sort((a, b) => (a.id || 0) - (b.id || 0))
  const volume = day.reduce((s, w) => s + (w.sets || []).reduce((a, x) => a + (x.weight > 0 && x.reps > 0 ? x.weight * x.reps : 0), 0), 0)
  const groups = [...new Set(day.flatMap(w => groupsOf(normalizeName(w.exercises.name))))]
  return { date, rows: day, volume, groups }
}

// Days since each big muscle group was trained (primary muscles)
function readiness(allRows) {
  const last = {}
  ;(allRows || []).forEach(w => {
    const name = normalizeName(w.exercises?.name); if (!name || !(w.sets || []).length) return
    groupsOf(name).forEach(g => { if (!last[g] || w.workout_date > last[g]) last[g] = w.workout_date })
  })
  return GROUP_ORDER.map(g => {
    const days = last[g] ? dayDiff(last[g]) : null
    const level = days === null || days >= 3 ? 'ready' : days === 2 ? 'almost' : 'rest'
    return { id: g, days, level }
  }).sort((a, b) => ['ready', 'almost', 'rest'].indexOf(a.level) - ['ready', 'almost', 'rest'].indexOf(b.level))
}

const LEVEL = {
  ready: { color: '#30D158', bg: 'rgba(48,209,88,0.12)' },
  almost: { color: '#FFD60A', bg: 'rgba(255,214,10,0.12)' },
  rest: { color: '#FF6B5E', bg: 'rgba(255,69,58,0.12)' },
}

export function WorkoutHome({ thm, allRows, favorites, activePlans, onRepeat, onAdd, onOpenAll, onOpenPlans, onStartPlanDay, onWarmup, onStretch }) {
  const last = useMemo(() => lastWorkout(allRows), [allRows])
  const ready = useMemo(() => readiness(allRows), [allRows])
  const [repeating, setRepeating] = useState(false)
  const ago = last ? dayDiff(last.date) : 0
  const agoText = !last ? '' : ago <= 0 ? t('сегодня') : ago === 1 ? t('вчера') : t('{n} дн. назад', { n: ago })
  const dateRaw = last ? new Date(last.date + 'T12:00:00').toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  const dateText = dateRaw.charAt(0).toUpperCase() + dateRaw.slice(1)
  // quick add: favourites, else the most used exercises
  const quick = useMemo(() => {
    if (favorites?.length) return favorites
    const count = {}
    ;(allRows || []).forEach(w => { const n = normalizeName(w.exercises?.name); if (n) { const b = n.replace(/\s*\([^)]*\)\s*$/, ''); count[b] = (count[b] || 0) + 1 } })
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n]) => n)
  }, [favorites, allRows])

  return (
    <div>
      {/* Last workout + repeat */}
      {last ? (
        <div style={{ borderRadius: 22, padding: 16, background: `linear-gradient(160deg, ${accA(0.16)}, ${accA(0.04)} 60%)`, border: `1px solid ${accA(0.3)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: ACC }}>{t('ПРОШЛАЯ ТРЕНИРОВКА')}</span>
            <span style={{ fontSize: 12, color: thm.text50, fontWeight: 600 }}>{agoText}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: thm.text, margin: '6px 0 2px' }}>{dateText}</div>
          <div style={{ fontSize: 13, color: thm.text50 }}>
            {last.rows.length} {plural(last.rows.length, ['упражнение', 'упражнения', 'упражнений'], ['exercise', 'exercises'])}
            {last.volume > 0 && <> · {fmtVolume(last.volume)}</>}
            {last.groups.length > 0 && <> · {last.groups.slice(0, 3).map(g => t(GROUP_LABEL[g] || g)).join(', ')}</>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {last.rows.slice(0, 8).map(w => (
              <div key={w.id} title={exName(normalizeName(w.exercises.name))} style={{ flexShrink: 0 }}><Thumb name={normalizeName(w.exercises.name)} size={40} /></div>
            ))}
          </div>
          <button disabled={repeating} onClick={async () => { setRepeating(true); try { await onRepeat(last) } finally { setRepeating(false) } }}
            style={{ width: '100%', marginTop: 14, padding: 13, borderRadius: 14, border: 'none', background: ACC, color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            🔁 {t('Повторить эту тренировку')}
          </button>
        </div>
      ) : (
        <div style={{ borderRadius: 22, padding: 18, background: `linear-gradient(160deg, ${accA(0.16)}, ${accA(0.04)} 60%)`, border: `1px solid ${accA(0.3)}` }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: thm.text }}>{t('Первая тренировка! 💪')}</div>
          <div style={{ fontSize: 13, color: thm.text50, marginTop: 4 }}>{t('Добавь упражнения или выбери программу — дальше Gym BRO подскажет веса.')}</div>
        </div>
      )}

      {/* Plan of the day */}
      {activePlans.length > 0 ? (
        <>
          <Title thm={thm}>{t('По программе')}</Title>
          {activePlans.map(p => <TodayPlanCard key={p.id} full plan={p} thm={thm} onStart={onStartPlanDay} onOpen={() => onOpenPlans('my')} />)}
        </>
      ) : null}

      {/* Muscle readiness */}
      {last && (
        <>
          <Title thm={thm} right={<span style={{ fontSize: 11, color: thm.text35 }}>{t('по дням отдыха')}</span>}>{t('Готовность мышц')}</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ready.map(r => (
              <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 99, background: LEVEL[r.level].bg, fontSize: 12, fontWeight: 700, color: thm.text85 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: LEVEL[r.level].color }} />
                {t(GROUP_LABEL[r.id] || r.id)}
                {r.level !== 'ready' && <span style={{ color: thm.text40, fontWeight: 600 }}>{r.days === 0 ? t('сегодня') : r.days === 1 ? t('вчера') : t('{n} дн.', { n: r.days })}</span>}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Quick add */}
      <Title thm={thm} right={<span style={{ fontSize: 11, color: thm.text35 }}>{favorites?.length ? t('⭐ избранные') : t('частые')}</span>}>{t('Быстро добавить')}</Title>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        <button onClick={onOpenAll} style={{ flexShrink: 0, width: 76, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto', borderRadius: 16, background: accA(0.14), border: `1px dashed ${accA(0.5)}`, color: ACC, fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>＋</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACC, marginTop: 6, lineHeight: 1.2 }}>{t('Все упражнения')}</div>
        </button>
        {quick.map(name => (
          <button key={name} onClick={() => onAdd(name)} style={{ flexShrink: 0, width: 76, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto' }}><Thumb name={name} size={64} /></div>
            <div style={{ fontSize: 11, fontWeight: 600, color: thm.text70, marginTop: 6, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{exName(name)}</div>
          </button>
        ))}
      </div>

      {/* Program (when none), warm-up, stretching */}
      <div style={{ display: 'grid', gridTemplateColumns: activePlans.length ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 18, marginBottom: 16 }}>
        {!activePlans.length && <Tile icon="📋" title={t('Программы')} sub={t('7 планов')} onClick={() => onOpenPlans('catalog')} thm={thm} />}
        <Tile icon="🤸" title={t('Разминка')} sub={t('до тренировки')} onClick={onWarmup} thm={thm} />
        <Tile icon="🧘" title={t('Растяжка')} sub={t('после')} onClick={onStretch} thm={thm} />
      </div>
    </div>
  )
}

function Tile({ icon, title, sub, onClick, thm }) {
  return (
    <button onClick={onClick} style={{ padding: '14px 10px', borderRadius: 18, border: `1px solid ${thm.border}`, background: thm.card, cursor: 'pointer', textAlign: 'left', minWidth: 0 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: accA(0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: thm.text, marginTop: 10 }}>{title}</div>
      <div style={{ fontSize: 11, color: thm.text40, marginTop: 2 }}>{sub}</div>
    </button>
  )
}
