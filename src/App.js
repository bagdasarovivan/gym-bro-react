import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// =========================
// CONSTANTS
// =========================
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

const DEFAULT_FAVORITES = ['Bench Press', 'Squat', 'Deadlift']

// =========================
// GLOBAL CSS
// =========================
const GLOBAL_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
body { background: #0a0a0a; margin: 0; }
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

.app { background: #0f0f0f; min-height: 100vh; color: white; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; max-width: 480px; margin: 0 auto; padding-bottom: 90px; }

/* HEADER */
.header { padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: rgba(15,15,15,0.97); backdrop-filter: blur(20px); z-index: 50; }
.header-logo { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
.header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-left: 10px; }
.header-left { display: flex; align-items: center; }
.streak-badge { background: rgba(255,100,0,0.15); border: 1px solid rgba(255,100,0,0.3); border-radius: 20px; padding: 5px 12px; font-size: 14px; font-weight: 700; color: #FF6400; }

/* ONBOARDING */
.onboard-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeOv 0.3s ease; }
.onboard-card { background: #1a1a1a; border-radius: 24px; padding: 32px 24px; text-align: center; max-width: 360px; width: 100%; border: 1px solid rgba(255,255,255,0.08); }
.onboard-emoji { font-size: 64px; margin-bottom: 20px; display: block; }
.onboard-title { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 10px; }
.onboard-sub { font-size: 15px; opacity: 0.55; line-height: 1.6; margin-bottom: 28px; }
.onboard-features { text-align: left; margin-bottom: 28px; display: flex; flex-direction: column; gap: 12px; }
.onboard-feature { display: flex; align-items: center; gap: 12px; font-size: 14px; opacity: 0.8; }
.onboard-feature-icon { font-size: 20px; width: 36px; text-align: center; flex-shrink: 0; }
.onboard-btn { width: 100%; padding: 16px; background: linear-gradient(135deg,#00C853,#00E676); border: none; border-radius: 16px; font-size: 17px; font-weight: 800; color: #001a0d; cursor: pointer; }

/* SECTION */
.section { padding: 20px; }
.date-label { font-size: 13px; opacity: 0.4; font-weight: 600; margin-bottom: 16px; text-transform: capitalize; }

/* EXERCISE SELECTOR */
.ex-selector-btn { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 15px 18px; color: white; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; margin-bottom: 16px; text-align: left; }
.ex-selector-btn:hover { background: rgba(255,255,255,0.08); }
.ex-selector-btn.selected { border-color: rgba(0,200,83,0.35); background: rgba(0,200,83,0.06); }
.ex-selector-right { display: flex; align-items: center; gap: 10px; }
.fav-btn { background: none; border: none; font-size: 18px; cursor: pointer; padding: 2px; line-height: 1; }

/* MODAL */
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
.modal-img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.modal-placeholder { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }

/* WORKOUT FORM */
.ex-image { width: 120px; border-radius: 14px; margin-bottom: 12px; display: block; }
.last-hint { background: rgba(41,121,255,0.08); border: 1px solid rgba(41,121,255,0.2); border-radius: 12px; padding: 10px 14px; margin: 0 0 16px; font-size: 13px; color: #82B1FF; line-height: 1.5; }
.sets-lbl { font-size: 11px; font-weight: 700; opacity: 0.38; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
.set-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.set-num { opacity: 0.3; width: 18px; font-size: 12px; font-weight: 700; flex-shrink: 0; text-align: center; }
.set-input { flex: 1; min-width: 0; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 6px; color: white; font-size: 17px; font-weight: 700; text-align: center; outline: none; transition: all 0.18s; width: 100%; }
.set-input:focus { border-color: rgba(0,200,83,0.4); background: rgba(0,200,83,0.05); }
.set-sep { opacity: 0.25; flex-shrink: 0; font-size: 14px; }
.set-btns { display: flex; gap: 10px; margin: 8px 0 20px; }
.set-btn { flex: 1; padding: 11px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.set-btn:hover { background: rgba(255,255,255,0.09); }

/* TIMER */
.timer-card { background: linear-gradient(135deg, rgba(255,100,0,0.12), rgba(255,60,0,0.06)); border: 1px solid rgba(255,100,0,0.25); border-radius: 20px; padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
.timer-left .timer-lbl { font-size: 12px; opacity: 0.6; margin-bottom: 4px; }
.timer-countdown { font-size: 36px; font-weight: 800; color: #FF6400; font-variant-numeric: tabular-nums; }
.timer-skip { background: rgba(255,100,0,0.2); border: 1px solid rgba(255,100,0,0.3); border-radius: 12px; padding: 9px 16px; color: #FF6400; font-size: 14px; font-weight: 700; cursor: pointer; }

.save-btn { width: 100%; padding: 16px; background: linear-gradient(135deg,#00C853,#00E676); border: none; border-radius: 16px; font-size: 17px; font-weight: 800; color: #001a0d; cursor: pointer; box-shadow: 0 4px 24px rgba(0,200,83,0.22); transition: all 0.2s; }
.save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(0,200,83,0.32); }
.save-btn.done { background: #00C853; transform: none; box-shadow: none; }

/* HISTORY */
.day-group { margin-bottom: 6px; }
.day-header-btn { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 13px 16px; color: white; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.15s; text-align: left; margin-bottom: 4px; }
.day-header-btn:hover { background: rgba(255,255,255,0.07); }
.day-header-btn.open { border-radius: 14px 14px 6px 6px; border-color: rgba(0,200,83,0.2); }
.day-header-meta { font-size: 12px; opacity: 0.45; font-weight: 500; margin-top: 2px; }
.day-chevron { opacity: 0.4; transition: transform 0.2s; font-size: 14px; }
.day-chevron.open { transform: rotate(180deg); opacity: 0.8; }
.day-cards { padding: 0 0 10px; display: flex; flex-direction: column; gap: 6px; animation: fadeOv 0.2s ease; }
.hist-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px 6px 14px 14px; padding: 13px 16px; }
.hist-ex { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { padding: 5px 11px; border-radius: 99px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.11); font-size: 13px; font-weight: 600; }

/* PROGRESS */
.stats-row { display: flex; gap: 10px; margin-bottom: 22px; }
.stat-card { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px 10px; text-align: center; }
.stat-val { font-size: 22px; font-weight: 800; }
.stat-lbl { font-size: 10px; opacity: 0.45; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
.prog-title { font-size: 17px; font-weight: 800; margin: 20px 0 12px; }

/* PR CARDS */
.pr-group { margin-bottom: 6px; }
.pr-header-btn { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 13px 16px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.15s; text-align: left; margin-bottom: 4px; }
.pr-header-btn:hover { background: rgba(255,255,255,0.07); }
.pr-header-btn.open { border-radius: 14px 14px 6px 6px; border-color: rgba(0,200,83,0.2); }
.pr-header-left { display: flex; align-items: center; gap: 12px; }
.pr-thumb { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.pr-thumb-placeholder { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.pr-name { font-size: 15px; font-weight: 700; }
.pr-val { font-size: 18px; font-weight: 800; color: #69F0AE; }
.pr-detail-card { background: rgba(0,200,83,0.05); border: 1px solid rgba(0,200,83,0.15); border-radius: 6px 6px 14px 14px; padding: 14px 16px; margin-bottom: 4px; display: flex; align-items: center; gap: 14px; animation: fadeOv 0.2s ease; }
.pr-detail-img { width: 70px; border-radius: 10px; flex-shrink: 0; }
.pr-detail-info { flex: 1; }
.pr-detail-sets { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.pr-detail-date { font-size: 12px; opacity: 0.45; }
.pr-detail-est { font-size: 13px; color: #69F0AE; margin-top: 4px; }

/* CALENDAR */
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.cal-btn { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 7px 14px; color: white; cursor: pointer; font-size: 15px; }
.cal-month-name { font-size: 16px; font-weight: 800; }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; margin-bottom: 24px; }
.cal-dow { text-align: center; font-size: 10px; opacity: 0.38; font-weight: 700; padding-bottom: 6px; }
.cal-cell { aspect-ratio: 1; border-radius: 9px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.04); cursor: default; }
.cal-cell.empty { background: transparent; cursor: default; }
.cal-cell.trained { background: rgba(0,200,83,0.18); border: 1px solid rgba(0,200,83,0.32); color: #69F0AE; cursor: pointer; transition: all 0.15s; }
.cal-cell.trained:hover { background: rgba(0,200,83,0.28); }
.cal-cell.today { box-shadow: 0 0 0 1.5px rgba(255,255,255,0.35); }
.cal-vol { font-size: 7.5px; opacity: 0.7; margin-top: 1px; }

/* CHART */
.chart-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 16px; margin-bottom: 20px; }
.chart-ex-select { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 14px; color: white; font-size: 14px; outline: none; margin-bottom: 14px; cursor: pointer; }
.chart-area { position: relative; height: 140px; }
.chart-no-data { text-align: center; opacity: 0.4; font-size: 14px; padding: 40px 0; }

/* CALENDAR DAY MODAL */
.cal-modal-title { font-size: 18px; font-weight: 800; margin-bottom: 16px; }
.cal-modal-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 13px 16px; margin-bottom: 10px; }
.cal-modal-ex { font-size: 15px; font-weight: 700; margin-bottom: 8px; }

/* NAV */
.nav-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 480px; background: rgba(15,15,15,0.97); border-top: 1px solid rgba(255,255,255,0.07); display: flex; padding: 10px 0 24px; z-index: 50; backdrop-filter: blur(20px); }
.nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: opacity 0.18s; padding: 4px 0; }
.nav-icon { font-size: 22px; }
.nav-lbl { font-size: 10px; font-weight: 700; }
@media (max-width:480px) { .nav-bar { width: 100%; } }
`

// =========================
// HELPERS
// =========================
function formatDate(d) {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Сегодня'
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера'
  return date.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })
}

function daysAgo(d) {
  const diff = Math.floor((new Date() - new Date(d)) / 86400000)
  if (diff === 0) return 'сегодня'
  if (diff === 1) return 'вчера'
  return `${diff} дн. назад`
}

function todayLabel() {
  return new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Simple SVG line chart
function LineChart({ data }) {
  if (!data || data.length < 2) return <div className="chart-no-data">Недостаточно данных</div>
  const vals = data.map(d => d.val)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const W = 400; const H = 110; const pad = 16
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2)
    const y = H - pad - ((d.val - min) / range) * (H - pad * 2)
    return { x, y, ...d }
  })
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = pathD + ` L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 120 }}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#69F0AE" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#69F0AE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#cg)" />
        <path d={pathD} fill="none" stroke="#69F0AE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#69F0AE" />)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.4, marginTop: 4 }}>
        <span>{data[0].label}</span>
        <span style={{ color: '#69F0AE', opacity: 1, fontWeight: 700 }}>{vals[vals.length - 1]} kg</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  )
}

// =========================
// MAIN APP
// =========================
export default function App() {
  const [tab, setTab] = useState('add')
  const [exercises, setExercises] = useState([])
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gbFavs')) || DEFAULT_FAVORITES } catch { return DEFAULT_FAVORITES }
  })
  const [showOnboard, setShowOnboard] = useState(() => !localStorage.getItem('gbOnboarded'))
  const [selectedEx, setSelectedEx] = useState(null)
  const [sets, setSets] = useState([{ weight: '', reps: '' }])
  const [saved, setSaved] = useState(false)
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState([])
  const [openDays, setOpenDays] = useState({})
  const [lastSession, setLastSession] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [prs, setPrs] = useState([])
  const [openPrs, setOpenPrs] = useState({})
  const [stats, setStats] = useState(null)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calData, setCalData] = useState({})
  const [calDayData, setCalDayData] = useState(null)
  const [chartEx, setChartEx] = useState('')
  const [chartData, setChartData] = useState([])
  const [timerSecs, setTimerSecs] = useState(null)
  const timerRef = useRef(null)

  // CSS
  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = GLOBAL_CSS
    document.head.appendChild(s)
    return () => document.head.removeChild(s)
  }, [])

  // Exercises
  useEffect(() => {
    supabase.from('exercises').select('*').order('name').then(({ data }) => {
      setExercises(data || [])
      if (!chartEx && data?.length) setChartEx(data[0].name)
    })
  }, [])

  // Streak
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

  // History
  useEffect(() => {
    if (tab !== 'history') return
    supabase.from('workouts').select('id,workout_date,exercises(name),sets(set_no,weight,reps,time_sec)')
      .order('workout_date', { ascending: false }).order('id', { ascending: false }).limit(200)
      .then(({ data }) => setHistory(data || []))
  }, [tab, saved])

  // Progress stats + PRs
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
            if (!map[name] || est > map[name].est) map[name] = { est: parseFloat(est.toFixed(1)), weight: s.weight, reps: s.reps, date: w.workout_date }
          }
        })
      })
      setPrs(Object.entries(map).sort((a, b) => b[1].est - a[1].est))
    }
    load()
  }, [tab])

  // Calendar data
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

  // Chart data
  useEffect(() => {
    if (!chartEx || tab !== 'progress') return
    async function load() {
      const { data: ex } = await supabase.from('exercises').select('id').eq('name', chartEx).single()
      if (!ex) return
      const { data } = await supabase.from('workouts').select('workout_date,sets(weight,reps)')
        .eq('exercise_id', ex.id).order('workout_date', { ascending: true }).limit(30)
      if (!data?.length) { setChartData([]); return }
      const points = data.map(w => {
        const maxW = Math.max(...(w.sets?.filter(s => s.weight > 0 && s.reps > 0).map(s => s.weight) || [0]))
        return { val: maxW, label: new Date(w.workout_date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) }
      }).filter(p => p.val > 0)
      setChartData(points)
    }
    load()
  }, [chartEx, tab])

  // Last session
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

  // Timer
  useEffect(() => {
    if (timerSecs === null) { clearInterval(timerRef.current); return }
    if (timerSecs <= 0) { setTimerSecs(null); return }
    timerRef.current = setInterval(() => setTimerSecs(s => s <= 1 ? null : s - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [timerSecs])

  const startTimer = () => setTimerSecs(90)

  const addSet = () => setSets([...sets, { weight: '', reps: '' }])
  const removeSet = () => sets.length > 1 && setSets(sets.slice(0, -1))
  const updateSet = (i, f, v) => { const n = [...sets]; n[i][f] = v; setSets(n) }

  const toggleFav = (name) => {
    setFavorites(prev => {
      const next = prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
      localStorage.setItem('gbFavs', JSON.stringify(next))
      return next
    })
  }

  const saveWorkout = async () => {
    const filled = sets.filter(s => s.weight && s.reps)
    if (!filled.length) return
    const { data: ex } = await supabase.from('exercises').select('id').eq('name', selectedEx).single()
    const { data: w } = await supabase.from('workouts').insert({ workout_date: new Date().toISOString().split('T')[0], exercise_id: ex.id }).select().single()
    await supabase.from('sets').insert(filled.map((s, i) => ({ workout_id: w.id, set_no: i + 1, weight: parseFloat(s.weight), reps: parseInt(s.reps), time_sec: null })))
    setSaved(true)
    startTimer()
    setTimeout(() => { setSaved(false); setSelectedEx(null); setSets([{ weight: '', reps: '' }]) }, 1500)
  }

  const openCalDay = async (day) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const { data } = await supabase.from('workouts').select('id,exercises(name),sets(set_no,weight,reps,time_sec)')
      .eq('workout_date', dateStr)
    setCalDayData({ date: dateStr, workouts: data || [] })
  }

  const onboardDone = () => { localStorage.setItem('gbOnboarded', '1'); setShowOnboard(false) }

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(modalSearch.toLowerCase()))
  const favFiltered = filtered.filter(e => favorites.includes(e.name))
  const restFiltered = filtered.filter(e => !favorites.includes(e.name))

  const calMonthName = new Date(calYear, calMonth).toLocaleDateString('ru', { month: 'long', year: 'numeric' })
  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const grouped = history.reduce((acc, w) => { if (!acc[w.workout_date]) acc[w.workout_date] = []; acc[w.workout_date].push(w); return acc }, {})

  const timerMin = timerSecs !== null ? Math.floor(timerSecs / 60) : 0
  const timerSecDisp = timerSecs !== null ? String(timerSecs % 60).padStart(2, '0') : '00'

  return (
    <div className="app">

      {/* ONBOARDING */}
      {showOnboard && (
        <div className="onboard-overlay">
          <div className="onboard-card">
            <span className="onboard-emoji">💪</span>
            <div className="onboard-title">Gym BRO</div>
            <div className="onboard-sub">Твой личный дневник тренировок. Записывай подходы, следи за прогрессом, бей рекорды.</div>
            <div className="onboard-features">
              {[
                ['📝', 'Записывай тренировки за секунды'],
                ['📈', 'Следи за личными рекордами'],
                ['🔥', 'Не теряй серию тренировок'],
                ['📅', 'Смотри историю в календаре'],
              ].map(([icon, text]) => (
                <div key={text} className="onboard-feature">
                  <span className="onboard-feature-icon">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button className="onboard-btn" onClick={onboardDone}>Начать тренироваться 🚀</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <img src="/icon.ico" alt="logo" className="header-logo" onError={e => e.target.style.display = 'none'} />
          <h1>Gym BRO</h1>
        </div>
        {streak >= 1 && <div className="streak-badge">{streak}🔥</div>}
      </div>

      {/* TAB: ADD WORKOUT */}
      {tab === 'add' && (
        <div className="section">
          <div className="date-label">{todayLabel()}</div>

          {/* Timer */}
          {timerSecs !== null && (
            <div className="timer-card">
              <div className="timer-left">
                <div className="timer-lbl">Отдых между подходами</div>
                <div className="timer-countdown">{timerMin}:{timerSecDisp}</div>
              </div>
              <button className="timer-skip" onClick={() => setTimerSecs(null)}>Пропустить</button>
            </div>
          )}

          {/* Exercise selector */}
          <button className={`ex-selector-btn${selectedEx ? ' selected' : ''}`} onClick={() => setShowModal(true)}>
            <span style={{ opacity: selectedEx ? 1 : 0.45 }}>{selectedEx || 'Выбери упражнение...'}</span>
            <div className="ex-selector-right">
              {selectedEx && (
                <button className="fav-btn" onClick={e => { e.stopPropagation(); toggleFav(selectedEx) }}
                  title={favorites.includes(selectedEx) ? 'Убрать из избранного' : 'В избранное'}>
                  {favorites.includes(selectedEx) ? '⭐' : '☆'}
                </button>
              )}
              <span style={{ opacity: 0.4, fontSize: 20 }}>⌄</span>
            </div>
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

      {/* TAB: HISTORY */}
      {tab === 'history' && (
        <div className="section">
          {Object.keys(grouped).length === 0 && <div style={{ opacity: 0.5, marginTop: 20 }}>Нет записей</div>}
          {Object.entries(grouped).map(([date, ws]) => {
            const isOpen = openDays[date]
            const exNames = [...new Set(ws.map(w => w.exercises?.name).filter(Boolean))]
            return (
              <div key={date} className="day-group">
                <button className={`day-header-btn${isOpen ? ' open' : ''}`}
                  onClick={() => setOpenDays(p => ({ ...p, [date]: !p[date] }))}>
                  <div>
                    <div>{formatDate(date)}</div>
                    <div className="day-header-meta">{exNames.join(', ')}</div>
                  </div>
                  <span className={`day-chevron${isOpen ? ' open' : ''}`}>▼</span>
                </button>
                {isOpen && (
                  <div className="day-cards">
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
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* TAB: PROGRESS */}
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

          {/* Chart */}
          <div className="prog-title">📊 График роста</div>
          <div className="chart-wrap">
            <select className="chart-ex-select" value={chartEx} onChange={e => setChartEx(e.target.value)}>
              {exercises.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
            <div className="chart-area">
              <LineChart data={chartData} />
            </div>
          </div>

          {/* Calendar */}
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
                <div key={day} className={`cal-cell${trained ? ' trained' : ''}${ds === todayStr ? ' today' : ''}`}
                  onClick={() => trained && openCalDay(day)}>
                  {day}
                  {trained && vol > 0 && <div className="cal-vol">{vol >= 1000 ? `${(vol / 1000).toFixed(1)}K` : vol}</div>}
                </div>
              )
            })}
          </div>

          {/* PRs */}
          <div className="prog-title">🏆 Личные рекорды</div>
          {prs.map(([name, pr]) => {
            const isOpen = openPrs[name]
            const img = EXERCISE_IMAGES[name]
            return (
              <div key={name} className="pr-group">
                <button className={`pr-header-btn${isOpen ? ' open' : ''}`}
                  onClick={() => setOpenPrs(p => ({ ...p, [name]: !p[name] }))}>
                  <div className="pr-header-left">
                    {img ? <img src={img} alt={name} className="pr-thumb" onError={e => e.target.style.display = 'none'} />
                      : <div className="pr-thumb-placeholder">🏋️</div>}
                    <div className="pr-name">{name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="pr-val">{pr.est} kg</span>
                    <span className="day-chevron" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="pr-detail-card">
                    {img && <img src={img} alt={name} className="pr-detail-img" onError={e => e.target.style.display = 'none'} />}
                    <div className="pr-detail-info">
                      <div className="pr-detail-sets">{pr.weight} кг × {pr.reps} повт</div>
                      <div className="pr-detail-date">{new Date(pr.date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <div className="pr-detail-est">Оценка 1RM: {pr.est} kg</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* EXERCISE MODAL */}
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
              {!modalSearch && favFiltered.length > 0 && <>
                <div className="modal-section-lbl">⭐ Избранные</div>
                {favFiltered.map(ex => <ModalItem key={ex.id} ex={ex} onSelect={() => { setSelectedEx(ex.name); setSets([{ weight: '', reps: '' }]); setShowModal(false); setModalSearch('') }} />)}
                <div className="modal-section-lbl">Все упражнения</div>
              </>}
              {(modalSearch ? filtered : restFiltered).map(ex => (
                <ModalItem key={ex.id} ex={ex} onSelect={() => { setSelectedEx(ex.name); setSets([{ weight: '', reps: '' }]); setShowModal(false); setModalSearch('') }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR DAY MODAL */}
      {calDayData && (
        <div className="modal-overlay" onClick={e => { if (e.target.classList.contains('modal-overlay')) setCalDayData(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">
                {new Date(calDayData.date).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
              </div>
            </div>
            <div className="modal-list">
              {calDayData.workouts.length === 0 && <div style={{ opacity: 0.5, padding: 20 }}>Нет данных</div>}
              {calDayData.workouts.map(w => (
                <div key={w.id} className="cal-modal-card">
                  <div className="cal-modal-ex">{w.exercises?.name}</div>
                  <div className="chips">
                    {w.sets?.sort((a, b) => a.set_no - b.set_no).map((s, i) => (
                      <span key={i} className="chip">{s.time_sec > 0 ? `${s.time_sec}s` : `${s.weight}×${s.reps}`}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
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