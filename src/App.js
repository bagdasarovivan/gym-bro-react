import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// =========================
// CONSTANTS
// =========================
const FAVORITES = ['Bench Press', 'Squat', 'Deadlift']

const EXERCISE_IMAGES = {
  'Bench Press': '/images/bench.png',
  'Squat': '/images/squat.png',
  'Deadlift': '/images/deadlift.png',
  'Overhead Press': '/images/ohp.png',
  'Biceps': '/images/biceps.png',
  'Triceps': '/images/triceps.png',
  'Dumbbell Flyes': '/images/dumbbell_flyes.png',
  'Romanian Deadlift': '/images/romanian_deadlift.png',
  'Incline Dumbbell Press': '/images/incline_dumbbell_press.png',
  'Lat Pulldown': '/images/lat_pulldown.png',
  'Seated Cable Row': '/images/seated_cable_row.png',
  'Dumbbell Bench': '/images/dumbbell_bench.png',
  'Push-Ups': '/images/push_ups.png',
  'Leg Press': '/images/leg_press.png',
  'Lunges': '/images/lunges.png',
  'Leg Curl': '/images/leg_curl.png',
  'Leg Extension': '/images/leg_extension.png',
  'Barbell Row': '/images/barbell_row.png',
  'Pull-Ups': '/images/pull_ups.png',
  'Plank': '/images/plank.png',
  'Crunches': '/images/crunches.png',
  'Flat Dumbbell Flyes': '/images/flat_dumbbell_flyes.png',
  'Hyperextension': '/images/hyperextension.png',
}

const EXERCISE_TYPE = {
  'Bench Press': 'heavy', 'Squat': 'heavy', 'Deadlift': 'heavy',
  'Romanian Deadlift': 'heavy', 'Overhead Press': 'heavy', 'Leg Press': 'heavy',
  'Barbell Row': 'heavy', 'Lat Pulldown': 'heavy', 'Seated Cable Row': 'heavy',
  'Incline Dumbbell Press': 'light', 'Dumbbell Bench': 'light', 'Dumbbell Flyes': 'light',
  'Flat Dumbbell Flyes': 'light', 'Lunges': 'light', 'Leg Curl': 'light',
  'Leg Extension': 'light', 'Push-Ups': 'light', 'Pull-Ups': 'light',
  'Crunches': 'light', 'Hyperextension': 'light', 'Biceps': 'light', 'Triceps': 'light',
  'Plank': 'timed',
}

// =========================
// STYLES
// =========================
const S = {
  app: {
    background: '#111', minHeight: '100vh', color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    maxWidth: '480px', margin: '0 auto', paddingBottom: '90px',
  },
  header: {
    padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, background: 'rgba(17,17,17,0.96)',
    backdropFilter: 'blur(20px)', zIndex: 10,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  h1: { fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' },
  streakBadge: {
    background: 'rgba(255,100,0,0.15)', border: '1px solid rgba(255,100,0,0.3)',
    borderRadius: '20px', padding: '6px 12px', fontSize: '14px',
    fontWeight: 700, color: '#FF6400',
  },
  section: { padding: '20px' },
  sectionTitle: {
    fontSize: '13px', fontWeight: 700, opacity: 0.45,
    textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px',
  },
  exCard: {
    padding: '14px 16px', margin: '8px 0',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px', cursor: 'pointer',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '16px', fontWeight: 600, transition: 'all 0.15s',
  },
  exCardFav: {
    border: '1px solid rgba(0,200,83,0.2)',
    background: 'rgba(0,200,83,0.05)',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#5B9BD5',
    fontSize: '16px', cursor: 'pointer', padding: 0, marginBottom: '16px',
    display: 'flex', alignItems: 'center', gap: '4px',
  },
  exName: { fontSize: '24px', fontWeight: 800, marginBottom: '4px' },
  lastHint: {
    background: 'rgba(41,121,255,0.08)', border: '1px solid rgba(41,121,255,0.2)',
    borderRadius: '12px', padding: '10px 14px', margin: '12px 0',
    fontSize: '13px', color: '#82B1FF',
  },
  setRow: { display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' },
  setNum: { opacity: 0.4, width: '24px', fontSize: '13px', fontWeight: 700, flexShrink: 0 },
  input: {
    flex: 1, background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px', padding: '12px',
    color: 'white', fontSize: '18px', fontWeight: 700,
    textAlign: 'center', outline: 'none', width: '100%',
  },
  sep: { opacity: 0.3, flexShrink: 0 },
  smallBtns: { display: 'flex', gap: '10px', margin: '4px 0 24px' },
  smallBtn: {
    flex: 1, padding: '10px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px',
    color: 'white', fontSize: '14px', cursor: 'pointer',
  },
  saveBtn: {
    width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #00C853, #00E676)',
    border: 'none', borderRadius: '16px',
    fontSize: '17px', fontWeight: 800, color: '#001a0d',
    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,200,83,0.3)',
  },
  saveBtnDone: { background: '#00C853' },
  historyCard: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px', padding: '14px 16px', marginBottom: '10px',
  },
  historyExName: { fontSize: '16px', fontWeight: 700, marginBottom: '8px' },
  chip: {
    display: 'inline-block', padding: '5px 10px',
    borderRadius: '999px', background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    margin: '3px 5px 3px 0', fontSize: '14px', whiteSpace: 'nowrap',
  },
  prChip: {
    display: 'inline-block', padding: '2px 8px',
    background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.35)',
    borderRadius: '6px', fontSize: '12px', color: '#FFD700',
    marginLeft: '8px', verticalAlign: 'middle',
  },
  dayHeader: {
    fontSize: '13px', opacity: 0.4, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.6px',
    padding: '12px 0 6px',
  },
  navBar: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '480px', background: 'rgba(17,17,17,0.97)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', padding: '10px 0 20px', zIndex: 20,
  },
  navItem: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'opacity 0.2s',
  },
}

// =========================
// HELPERS
// =========================
function pluralRu(n, one, few, many) {
  if (n % 100 >= 11 && n % 100 <= 19) return many
  const r = n % 10
  if (r === 1) return one
  if (r >= 2 && r <= 4) return few
  return many
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' })
}

function daysAgoText(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000)
  if (diff === 0) return 'сегодня'
  if (diff === 1) return 'вчера'
  return `${diff} ${pluralRu(diff, 'день', 'дня', 'дней')} назад`
}

// =========================
// MAIN APP
// =========================
export default function App() {
  const [tab, setTab] = useState('add')
  const [exercises, setExercises] = useState([])
  const [selectedEx, setSelectedEx] = useState(null)
  const [sets, setSets] = useState([{ weight: '', reps: '' }])
  const [saved, setSaved] = useState(false)
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState([])
  const [lastSession, setLastSession] = useState(null)
  const [search, setSearch] = useState('')

  // Load exercises
  useEffect(() => {
    supabase.from('exercises').select('*').order('name')
      .then(({ data }) => setExercises(data || []))
  }, [])

  // Load streak
  useEffect(() => {
    async function loadStreak() {
      const { data } = await supabase
        .from('workouts')
        .select('workout_date')
        .order('workout_date', { ascending: false })

      if (!data || !data.length) return
      const dates = [...new Set(data.map(r => r.workout_date))].sort().reverse()
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (dates[0] < yesterday) return

      let s = 0
      let expected = new Date(dates[0])
      for (const d of dates) {
        const curr = new Date(d)
        if (curr.toDateString() === expected.toDateString()) {
          s++
          expected.setDate(expected.getDate() - 1)
        } else break
      }
      setStreak(s)
    }
    loadStreak()
  }, [saved])

  // Load history
  useEffect(() => {
    if (tab !== 'history') return
    async function loadHistory() {
      const { data } = await supabase
        .from('workouts')
        .select(`
          id, workout_date,
          exercises(name),
          sets(set_no, weight, reps, time_sec)
        `)
        .order('workout_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(100)
      setHistory(data || [])
    }
    loadHistory()
  }, [tab, saved])

  // Load last session for exercise
  useEffect(() => {
    if (!selectedEx) return
    async function loadLast() {
      const { data } = await supabase
        .from('workouts')
        .select(`workout_date, sets(set_no, weight, reps, time_sec)`)
        .eq('exercise_id',
          (await supabase.from('exercises').select('id').eq('name', selectedEx).single()).data?.id
        )
        .order('workout_date', { ascending: false })
        .limit(1)
        .single()
      setLastSession(data || null)
    }
    loadLast()
  }, [selectedEx])

  const addSet = () => setSets([...sets, { weight: '', reps: '' }])
  const removeSet = () => sets.length > 1 && setSets(sets.slice(0, -1))
  const updateSet = (i, field, value) => {
    const n = [...sets]; n[i][field] = value; setSets(n)
  }

  const saveWorkout = async () => {
    const filled = sets.filter(s => s.weight && s.reps)
    if (!filled.length) return

    const { data: ex } = await supabase
      .from('exercises').select('id').eq('name', selectedEx).single()

    const { data: workout } = await supabase
      .from('workouts').insert({
        workout_date: new Date().toISOString().split('T')[0],
        exercise_id: ex.id
      }).select().single()

    await supabase.from('sets').insert(
      filled.map((s, i) => ({
        workout_id: workout.id, set_no: i + 1,
        weight: parseFloat(s.weight), reps: parseInt(s.reps), time_sec: null
      }))
    )
    setSaved(true)
    setTimeout(() => {
      setSaved(false); setSelectedEx(null)
      setSets([{ weight: '', reps: '' }]); setSearch('')
    }, 1500)
  }

  // Group history by date
  const groupedHistory = history.reduce((acc, w) => {
    const d = w.workout_date
    if (!acc[d]) acc[d] = []
    acc[d].push(w)
    return acc
  }, {})

  const exType = EXERCISE_TYPE[selectedEx] || 'light'
  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )
  const favs = filtered.filter(e => FAVORITES.includes(e.name))
  const rest = filtered.filter(e => !FAVORITES.includes(e.name))

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={{ fontSize: '26px' }}>💪</span>
          <span style={S.h1}>Gym BRO</span>
        </div>
        {streak >= 1 && (
          <div style={S.streakBadge}>{streak}🔥</div>
        )}
      </div>

      {/* TAB: Add Workout */}
      {tab === 'add' && (
        <div style={S.section}>
          {!selectedEx ? (
            <>
              {/* Search */}
              <input
                placeholder="🔍 Поиск упражнения..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  ...S.input, textAlign: 'left', fontSize: '15px',
                  fontWeight: 400, marginBottom: '16px', padding: '12px 14px',
                }}
              />

              {favs.length > 0 && !search && (
                <>
                  <div style={S.sectionTitle}>⭐ Избранные</div>
                  {favs.map(ex => (
                    <ExCard key={ex.id} name={ex.name} fav
                      onClick={() => { setSelectedEx(ex.name); setSets([{ weight: '', reps: '' }]) }}
                    />
                  ))}
                  <div style={{ ...S.sectionTitle, marginTop: '16px' }}>Все упражнения</div>
                </>
              )}
              {rest.map(ex => (
                <ExCard key={ex.id} name={ex.name}
                  onClick={() => { setSelectedEx(ex.name); setSets([{ weight: '', reps: '' }]) }}
                />
              ))}
            </>
          ) : (
            <>
              <button style={S.backBtn} onClick={() => { setSelectedEx(null); setLastSession(null) }}>
                ← Назад
              </button>

              {/* Exercise image */}
              {EXERCISE_IMAGES[selectedEx] && (
                <img
                  src={EXERCISE_IMAGES[selectedEx]}
                  alt={selectedEx}
                  style={{ width: '140px', borderRadius: '12px', marginBottom: '12px' }}
                  onError={e => e.target.style.display = 'none'}
                />
              )}

              <div style={S.exName}>{selectedEx}</div>

              {/* Last session hint */}
              {lastSession && (
                <div style={S.lastHint}>
                  💡 <b>В прошлый раз</b> ({daysAgoText(lastSession.workout_date)}, {new Date(lastSession.workout_date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}):&nbsp;
                  {lastSession.sets
                    ?.sort((a, b) => a.set_no - b.set_no)
                    .map(s => s.time_sec > 0 ? `${s.time_sec}s` : `${s.weight}×${s.reps}`)
                    .join(' · ')}
                </div>
              )}

              {/* Sets */}
              <div style={{ ...S.sectionTitle, marginTop: '16px' }}>Подходы</div>

              {exType === 'timed' ? (
                sets.map((s, i) => (
                  <div key={i} style={S.setRow}>
                    <span style={S.setNum}>{i + 1}</span>
                    <input type="number" placeholder="сек" value={s.time}
                      onChange={e => updateSet(i, 'time', e.target.value)}
                      style={S.input}
                    />
                  </div>
                ))
              ) : (
                sets.map((s, i) => (
                  <div key={i} style={S.setRow}>
                    <span style={S.setNum}>{i + 1}</span>
                    <input type="number" placeholder="кг" value={s.weight}
                      onChange={e => updateSet(i, 'weight', e.target.value)}
                      style={S.input}
                    />
                    <span style={S.sep}>×</span>
                    <input type="number" placeholder="повт" value={s.reps}
                      onChange={e => updateSet(i, 'reps', e.target.value)}
                      style={S.input}
                    />
                  </div>
                ))
              )}

              <div style={S.smallBtns}>
                <button style={S.smallBtn} onClick={addSet}>➕ Добавить</button>
                <button style={{ ...S.smallBtn, opacity: sets.length <= 1 ? 0.3 : 1 }}
                  onClick={removeSet}>➖ Убрать</button>
              </div>

              <button
                style={{ ...S.saveBtn, ...(saved ? S.saveBtnDone : {}) }}
                onClick={saveWorkout}
              >
                {saved ? '✅ Сохранено!' : '💾 Сохранить тренировку'}
              </button>
            </>
          )}
        </div>
      )}

      {/* TAB: History */}
      {tab === 'history' && (
        <div style={S.section}>
          <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>📜 История</h2>
          {Object.keys(groupedHistory).length === 0 && (
            <div style={{ opacity: 0.5 }}>Нет записей</div>
          )}
          {Object.entries(groupedHistory).map(([date, workouts]) => (
            <div key={date}>
              <div style={S.dayHeader}>{formatDate(date)}</div>
              {workouts.map(w => (
                <div key={w.id} style={S.historyCard}>
                  <div style={S.historyExName}>{w.exercises?.name}</div>
                  <div>
                    {w.sets
                      ?.sort((a, b) => a.set_no - b.set_no)
                      .map((s, i) => (
                        <span key={i} style={S.chip}>
                          {s.time_sec > 0 ? `${s.time_sec}s` : `${s.weight}×${s.reps}`}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* TAB: Progress */}
      {tab === 'progress' && (
        <div style={S.section}>
          <h2 style={{ opacity: 0.6 }}>📈 Прогресс — скоро</h2>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={S.navBar}>
        {[
          { id: 'add', icon: '➕', label: 'Тренировка' },
          { id: 'history', icon: '📜', label: 'История' },
          { id: 'progress', icon: '📈', label: 'Прогресс' },
        ].map(t => (
          <div key={t.id} style={{ ...S.navItem, opacity: tab === t.id ? 1 : 0.4 }}
            onClick={() => setTab(t.id)}>
            <span style={{ fontSize: '24px' }}>{t.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: tab === t.id ? '#00C853' : 'white' }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// =========================
// EXERCISE CARD
// =========================
function ExCard({ name, onClick, fav }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.exCard,
        ...(fav ? S.exCardFav : {}),
        background: hover ? 'rgba(255,255,255,0.09)' : (fav ? 'rgba(0,200,83,0.05)' : 'rgba(255,255,255,0.05)'),
      }}
    >
      <span>{name}</span>
      <span style={{ opacity: 0.3 }}>›</span>
    </div>
  )
}