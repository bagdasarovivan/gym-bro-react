import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const EXERCISE_IMAGES = {
  'Bench Press': '/images/bench.png', 'Squat': '/images/squat.png',
  'Deadlift': '/images/deadlift.png', 'Overhead Press': '/images/ohp.png',
  'Biceps': '/images/biceps.png', 'Triceps': '/images/triceps.png',
  'Dumbbell Flyes': '/images/dumbbell_flyes.png', 'Romanian Deadlift': '/images/romanian_deadlift.png',
  'Incline Dumbbell Press': '/images/incline_dumbbell_press.png', 'Lat Pulldown': '/images/lat_pulldown.png',
  'Seated Cable Row': '/images/seated_cable_row.png', 'Dumbbell Bench': '/images/dumbbell_bench.png',
  'Push-Ups': '/images/push_ups.png', 'Leg Press': '/images/leg_press.png',
  'Lunges': '/images/lunges.png', 'Leg Curl': '/images/leg_curl.png',
  'Leg Extension': '/images/leg_extension.png', 'Barbell Row': '/images/barbell_row.png',
  'Pull-Ups': '/images/pull_ups.png', 'Plank': '/images/plank.png',
  'Crunches': '/images/crunches.png', 'Flat Dumbbell Flyes': '/images/flat_dumbbell_flyes.png',
  'Hyperextension': '/images/hyperextension.png',
}

const FAVORITES = ['Bench Press', 'Squat', 'Deadlift']

const GLOBAL_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
body { background: #0a0a0a; margin: 0; }
input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

.app { background: #0f0f0f; min-height: 100vh; color: white; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; max-width: 480px; margin: 0 auto; padding-bottom: 90px; }

.header { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: rgba(15,15,15,0.97); backdrop-filter: blur(20px); z-index: 50; }
.header h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
.streak-badge { background: rgba(255,100,0,0.15); border: 1px solid rgba(255,100,0,0.3); border-radius: 20px; padding: 5px 12px; font-size: 14px; font-weight: 700; color: #FF6400; }

.section { padding: 20px; }

.ex-selector-btn { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px 18px; color: white; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; margin-bottom: 20px; text-align: left; }
.ex-selector-btn:hover { background: rgba(255,255,255,0.08); }
.ex-selector-btn.selected { border-color: rgba(0,200,83,0.35); background: rgba(0,200,83,0.06); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100; display: flex; align-items: flex-end; justify-content: center; animation: fadeOv 0.2s ease; }
@keyframes fadeOv { from { opacity:0 } to { opacity:1 } }
.modal { background: #1c1c1c; border-radius: 24px 24px 0 0; width: 100%; max-width: 480px; max-height: 82vh; display: flex; flex-direction: column; animation: slideUp 0.28s cubic-bezier(0.34,1.2,0.64,1); }
@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
.modal-handle { width: 38px; height: 4px; background: rgba(255,255,255,0.18); border-radius: 99px; margin: 12px auto 0; flex-shrink: 0; }
.modal-header { padding: 14px 18px 12px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
.modal-title { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
.modal-search-wrap { position: relative; }
.modal-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); opacity: 0.4; }
.modal-search { width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 14px 10px 38px; color: white; font-size: 15px; outline: none; }
.modal-search:focus { border-color: rgba(0,200,83,0.3); }
.modal-list { overflow-y: auto; padding: 6px 10px 30px; flex: 1; }
.modal-section-lbl { font-size: 11px; font-weight: 700; opacity: 0.38; text-transform: uppercase; letter-spacing: 1px; padding: 12px 10px 4px; }
.modal-item { padding: 12px 10px; border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 12px; transition: background 0.12s; }
.modal-item:hover { background: rgba(255,255,255,0.07); }
.modal-item:active { background: rgba(255,255,255,0.1); }
.modal-img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.modal-placeholder { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }

.ex-image { width: 130px; border-radius: 14px; margin-bottom: 14px; display: block; }
.last-hint { background: rgba(41,121,255,0.08); border: 1px solid rgba(41,121,255,0.2); border-radius: 12px; padding: 10px 14px; margin: 0 0 16px; font-size: 13px; color: #82B1FF; line-height: 1.5; }
.sets-lbl { font-size: 11px; font-weight: 700; opacity: 0.38; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.set-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
.set-num { opacity: 0.3; width: 20px; font-size: 13px; font-weight: 700; flex-shrink: 0; text-align: center; }
.set-input { flex: 1; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 13px; color: white; font-size: 18px; font-weight: 700; text-align: center; outline: none; transition: all 0.18s; }
.set-input:focus { border-color: rgba(0,200,83,0.4); background: rgba(0,200,83,0.05); }
.set-sep { opacity: 0.25; flex-shrink: 0; }
.set-btns { display: flex; gap: 10px; margin: 8px 0 24px; }
.set-btn { flex: 1; padding: 11px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.set-btn:hover { background: rgba(255,255,255,0.09); }
.save-btn { width: 100%; padding: 16px; background: linear-gradient(135deg,#00C853,#00E676); border: none; border-radius: 16px; font-size: 17px; font-weight: 800; color: #001a0d; cursor: pointer; box-shadow: 0 4px 24px rgba(0,200,83,0.22); transition: all 0.2s; }
.save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(0,200,83,0.32); }
.save-btn.done { background: #00C853; transform: none; box-shadow: none; }

.day-lbl { font-size: 11px; font-weight: 700; opacity: 0.38; text-transform: uppercase; letter-spacing: 0.8px; padding: 14px 0 8px; }
.hist-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; }
.hist-ex { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { padding: 5px 11px; border-radius: 99px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.11); font-size: 13px; font-weight: 600; }

.stats-row { display: flex; gap: 10px; margin-bottom: 22px; }
.stat-card { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px 10px; text-align: center; }
.stat-val { font-size: 22px; font-weight: 800; }
.stat-lbl { font-size: 10px; opacity: 0.45; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
.prog-title { font-size: 17px; font-weight: 800; margin: 20px 0 12px; }
.pr-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 13px 16px; margin-bottom: 9px; display: flex; align-items: center; justify-content: space-between; }
.pr-name { font-size: 15px; font-weight: 700; }
.pr-sub { font-size: 11px; opacity: 0.42; margin-top: 2px; }
.pr-val { font-size: 18px; font-weight: 800; color: #69F0AE; }

.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.cal-btn { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 7px 14px; color: white; cursor: pointer; font-size: 15px; }
.cal-month-name { font-size: 16px; font-weight: 800; }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; margin-bottom: 24px; }
.cal-dow { text-align: center; font-size: 10px; opacity: 0.38; font-weight: 700; padding-bottom: 6px; }
.cal-cell { aspect-ratio: 1; border-radius: 9px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.04); }
.cal-cell.empty { background: transparent; }
.cal-cell.trained { background: rgba(0,200,83,0.18); border: 1px solid rgba(0,200,83,0.32); color: #69F0AE; }
.cal-cell.today { box-shadow: 0 0 0 1.5px rgba(255,255,255,0.35); }
.cal-vol { font-size: 7.5px; opacity: 0.7; margin-top: 1px; }

.nav-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 480px; background: rgba(15,15,15,0.97); border-top: 1px solid rgba(255,255,255,0.07); display: flex; padding: 10px 0 24px; z-index: 50; backdrop-filter: blur(20px); }
.nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: opacity 0.18s; padding: 4px 0; }
.nav-icon { font-size: 22px; }
.nav-lbl { font-size: 10px; font-weight: 700; }
@media (max-width:480px) { .nav-bar { width: 100%; } }
`

function formatDate(d) {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Сегодня'
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера'
  return date.toLocaleDateString('ru', { day: 'numeric', month: 'long' })
}

function daysAgo(d) {
  const diff = Math.floor((new Date() - new Date(d)) / 86400000)
  if (diff === 0) return 'сегодня'
  if (diff === 1) return 'вчера'
  return `${diff} дн. назад`
}

export default function App() {
  const [tab, setTab] = useState('add')
  const [exercises, setExercises] = useState([])
  const [selectedEx, setSelectedEx] = useState(null)
  const [sets, setSets] = useState([{ weight: '', reps: '' }])
  const [saved, setSaved] = useState(false)
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState([])
  const [lastSession, setLastSession] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [prs, setPrs] = useState([])
  const [stats, setStats] = useState(null)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calData, setCalData] = useState({})

  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = GLOBAL_CSS
    document.head.appendChild(s)
    return () => document.head.removeChild(s)
  }, [])

  useEffect(() => {
    supabase.from('exercises').select('*').order('name').then(({ data }) => setExercises(data || []))
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('workouts').select('workout_date').order('workout_date', { ascending: false })
      if (!data?.length) return
      const dates = [...new Set(data.map(r => r.workout_date))].sort().reverse()
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (dates[0] < yesterday) return
      let s = 0; let exp = new Date(dates[0])
      for (const d of dates) {
        const curr = new Date(d)
        if (curr.toDateString() === exp.toDateString()) { s++; exp.setDate(exp.getDate() - 1) } else break
      }
      setStreak(s)
    }
    load()
  }, [saved])

  useEffect(() => {
    if (tab !== 'history') return
    supabase.from('workouts').select('id,workout_date,exercises(name),sets(set_no,weight,reps,time_sec)')
      .order('workout_date', { ascending: false }).order('id', { ascending: false }).limit(150)
      .then(({ data }) => setHistory(data || []))
  }, [tab, saved])

  useEffect(() => {
    if (tab !== 'progress') return
    async function load() {
      const { data: wData } = await supabase.from('workouts').select('workout_date')
      const { data: sData } = await supabase.from('sets').select('weight,reps').gt('weight', 0).gt('reps', 0)
      const totalW = new Set(wData?.map(w => w.workout_date)).size
      const thisM = new Date().toISOString().slice(0, 7)
      const monthW = new Set(wData?.filter(w => w.workout_date.startsWith(thisM)).map(w => w.workout_date)).size
      const totalKg = sData?.reduce((s, r) => s + r.weight * r.reps, 0) || 0
      setStats({ totalW, monthW, totalKg })

      const { data: pData } = await supabase.from('workouts').select('workout_date,exercises(name),sets(weight,reps)')
      const map = {}
      pData?.forEach(w => {
        const name = w.exercises?.name; if (!name) return
        w.sets?.forEach(s => {
          if (s.weight > 0 && s.reps > 0) {
            const est = s.weight * (1 + s.reps / 30)
            if (!map[name] || est > map[name].est) map[name] = { est: est.toFixed(1), weight: s.weight, reps: s.reps, date: w.workout_date }
          }
        })
      })
      setPrs(Object.entries(map).sort((a, b) => b[1].est - a[1].est))
    }
    load()
  }, [tab])

  useEffect(() => {
    if (tab !== 'progress') return
    async function load() {
      const start = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`
      const lastDay = new Date(calYear, calMonth + 1, 0).getDate()
      const end = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${lastDay}`
      const { data } = await supabase.from('workouts').select('workout_date,sets(weight,reps)').gte('workout_date', start).lte('workout_date', end)
      const map = {}
      data?.forEach(w => {
        const d = new Date(w.workout_date).getDate()
        if (!map[d]) map[d] = 0
        w.sets?.forEach(s => { if (s.weight > 0 && s.reps > 0) map[d] += s.weight * s.reps })
      })
      setCalData(map)
    }
    load()
  }, [tab, calYear, calMonth])

  useEffect(() => {
    if (!selectedEx) return
    async function load() {
      const { data: ex } = await supabase.from('exercises').select('id').eq('name', selectedEx).single()
      if (!ex) return
      const { data } = await supabase.from('workouts').select('workout_date,sets(set_no,weight,reps,time_sec)')
        .eq('exercise_id', ex.id).order('workout_date', { ascending: false }).limit(1).single()
      setLastSession(data || null)
    }
    load()
  }, [selectedEx])

  const addSet = () => setSets([...sets, { weight: '', reps: '' }])
  const removeSet = () => sets.length > 1 && setSets(sets.slice(0, -1))
  const updateSet = (i, f, v) => { const n = [...sets]; n[i][f] = v; setSets(n) }

  const saveWorkout = async () => {
    const filled = sets.filter(s => s.weight && s.reps)
    if (!filled.length) return
    const { data: ex } = await supabase.from('exercises').select('id').eq('name', selectedEx).single()
    const { data: w } = await supabase.from('workouts').insert({ workout_date: new Date().toISOString().split('T')[0], exercise_id: ex.id }).select().single()
    await supabase.from('sets').insert(filled.map((s, i) => ({ workout_id: w.id, set_no: i + 1, weight: parseFloat(s.weight), reps: parseInt(s.reps), time_sec: null })))
    setSaved(true)
    setTimeout(() => { setSaved(false); setSelectedEx(null); setSets([{ weight: '', reps: '' }]) }, 1500)
  }

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(modalSearch.toLowerCase()))
  const favFiltered = filtered.filter(e => FAVORITES.includes(e.name))
  const restFiltered = filtered.filter(e => !FAVORITES.includes(e.name))

  const calMonthName = new Date(calYear, calMonth).toLocaleDateString('ru', { month: 'long', year: 'numeric' })
  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const grouped = history.reduce((acc, w) => { if (!acc[w.workout_date]) acc[w.workout_date] = []; acc[w.workout_date].push(w); return acc }, {})

  return (
    <div className="app">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>💪</span>
          <h1>Gym BRO</h1>
        </div>
        {streak >= 1 && <div className="streak-badge">{streak}🔥</div>}
      </div>

      {tab === 'add' && (
        <div className="section">
          <button className={`ex-selector-btn${selectedEx ? ' selected' : ''}`} onClick={() => setShowModal(true)}>
            <span style={{ opacity: selectedEx ? 1 : 0.45 }}>{selectedEx || 'Выбери упражнение...'}</span>
            <span style={{ opacity: 0.4, fontSize: 20 }}>⌄</span>
          </button>

          {selectedEx && (
            <>
              {EXERCISE_IMAGES[selectedEx] && (
                <img src={EXERCISE_IMAGES[selectedEx]} alt={selectedEx} className="ex-image" onError={e => e.target.style.display = 'none'} />
              )}
              {lastSession && (
                <div className="last-hint">
                  💡 <b>В прошлый раз</b> ({daysAgo(lastSession.workout_date)}, {new Date(lastSession.workout_date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}):&nbsp;
                  {lastSession.sets?.sort((a, b) => a.set_no - b.set_no).map(s => s.time_sec > 0 ? `${s.time_sec}s` : `${s.weight}×${s.reps}`).join(' · ')}
                </div>
              )}
              <div className="sets-lbl">Подходы</div>
              {sets.map((s, i) => (
                <div key={i} className="set-row">
                  <span className="set-num">{i + 1}</span>
                  <input type="number" placeholder="кг" value={s.weight} onChange={e => updateSet(i, 'weight', e.target.value)} className="set-input" />
                  <span className="set-sep">×</span>
                  <input type="number" placeholder="повт" value={s.reps} onChange={e => updateSet(i, 'reps', e.target.value)} className="set-input" />
                </div>
              ))}
              <div className="set-btns">
                <button className="set-btn" onClick={addSet}>➕ Добавить</button>
                <button className="set-btn" onClick={removeSet} style={{ opacity: sets.length <= 1 ? 0.35 : 1 }}>➖ Убрать</button>
              </div>
              <button className={`save-btn${saved ? ' done' : ''}`} onClick={saveWorkout}>
                {saved ? '✅ Сохранено!' : '💾 Сохранить тренировку'}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="section">
          {Object.keys(grouped).length === 0 && <div style={{ opacity: 0.5, marginTop: 20 }}>Нет записей</div>}
          {Object.entries(grouped).map(([date, ws]) => (
            <div key={date}>
              <div className="day-lbl">{formatDate(date)}</div>
              {ws.map(w => (
                <div key={w.id} className="hist-card">
                  <div className="hist-ex">{w.exercises?.name}</div>
                  <div className="chips">
                    {w.sets?.sort((a, b) => a.set_no - b.set_no).map((s, i) => (
                      <span key={i} className="chip">{s.time_sec > 0 ? `${s.time_sec}s` : `${s.weight}×${s.reps}`}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'progress' && (
        <div className="section">
          {stats && (
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-val">{stats.monthW}</div>
                <div className="stat-lbl">этот месяц</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{stats.totalW}</div>
                <div className="stat-lbl">всего</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{ color: '#69F0AE', fontSize: 18 }}>
                  {stats.totalKg >= 1000 ? `${(stats.totalKg / 1000).toFixed(1)}K` : Math.round(stats.totalKg)} kg
                </div>
                <div className="stat-lbl">поднято</div>
              </div>
            </div>
          )}

          <div className="prog-title">📅 Календарь</div>
          <div className="cal-nav">
            <button className="cal-btn" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}>◀</button>
            <span className="cal-month-name">{calMonthName}</span>
            <button className="cal-btn" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}>▶</button>
          </div>
          <div className="cal-grid">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => <div key={d} className="cal-dow">{d}</div>)}
            {Array(offset).fill(null).map((_, i) => <div key={`e${i}`} className="cal-cell empty" />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1
              const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const trained = calData[day] !== undefined
              const vol = calData[day] || 0
              return (
                <div key={day} className={`cal-cell${trained ? ' trained' : ''}${ds === todayStr ? ' today' : ''}`}>
                  {day}
                  {trained && vol > 0 && <div className="cal-vol">{vol >= 1000 ? `${(vol / 1000).toFixed(1)}K` : vol}</div>}
                </div>
              )
            })}
          </div>

          <div className="prog-title">🏆 Личные рекорды</div>
          {prs.map(([name, pr]) => (
            <div key={name} className="pr-card">
              <div>
                <div className="pr-name">{name}</div>
                <div className="pr-sub">{pr.weight}×{pr.reps} · {new Date(pr.date).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div className="pr-val">{pr.est} kg</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target.classList.contains('modal-overlay')) { setShowModal(false); setModalSearch('') } }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">Выбери упражнение</div>
              <div className="modal-search-wrap">
                <span className="modal-search-icon">🔍</span>
                <input className="modal-search" placeholder="Поиск..." value={modalSearch} onChange={e => setModalSearch(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="modal-list">
              {!modalSearch && favFiltered.length > 0 && (
                <>
                  <div className="modal-section-lbl">⭐ Избранные</div>
                  {favFiltered.map(ex => <ModalItem key={ex.id} ex={ex} onSelect={() => { setSelectedEx(ex.name); setSets([{ weight: '', reps: '' }]); setShowModal(false); setModalSearch('') }} />)}
                  <div className="modal-section-lbl">Все упражнения</div>
                </>
              )}
              {(modalSearch ? filtered : restFiltered).map(ex => (
                <ModalItem key={ex.id} ex={ex} onSelect={() => { setSelectedEx(ex.name); setSets([{ weight: '', reps: '' }]); setShowModal(false); setModalSearch('') }} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="nav-bar">
        {[{ id: 'add', icon: '➕', label: 'Тренировка' }, { id: 'history', icon: '📜', label: 'История' }, { id: 'progress', icon: '📈', label: 'Прогресс' }].map(t => (
          <div key={t.id} className="nav-item" style={{ opacity: tab === t.id ? 1 : 0.38 }} onClick={() => setTab(t.id)}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-lbl" style={{ color: tab === t.id ? '#00C853' : 'white' }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ModalItem({ ex, onSelect }) {
  const img = EXERCISE_IMAGES[ex.name]
  return (
    <div className="modal-item" onClick={onSelect}>
      {img ? <img src={img} alt={ex.name} className="modal-img" onError={e => e.target.style.display = 'none'} /> : <div className="modal-placeholder">🏋️</div>}
      {ex.name}
    </div>
  )
}