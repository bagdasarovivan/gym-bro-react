/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { supabase } from './supabase'
import { DropdownPicker } from './components/DropdownPicker'
import { EditModal } from './components/EditModal'
import { WeightModal } from './components/WeightModal'
import { WarmupModal } from './components/WarmupModal'
import { StretchModal } from './components/StretchModal'
import { ChartExercisePicker } from './components/ChartExercisePicker'
import { HistoryView } from './components/History'
import { AchTabs, AchievementCelebration, BadgeGrid, MonthArchive, MonthChallenges, MonthMedalsSummary } from './components/Achievements'
import { computeAchievements, describeId, swapChallenge } from './data/achievements'
import { KG_TO_LB, dispW, exInfo, exName, fmtVolume, fmtW, isEn, isLbs, locale, muscleLabel, num, plural, setPrefs, workoutsN, t, toKg, variantName, weightOptions } from './i18n'
import { LineChart } from './components/LineChart'
import { ModalItem } from './components/ModalItem'
import { MuscleMap } from './components/MuscleMap'
import { PlansSheet, TodayPlanCard } from './components/Plans'
import { WorkoutHome } from './components/WorkoutHome'
import { ExerciseMuscleMap, ExerciseStats, ExerciseVariants, exerciseIndex } from './components/ExerciseStats'
import { DEFAULT_FAVORITES, EXERCISES, EXERCISE_IMAGES, EXERCISE_INFO, EXERCISE_MUSCLES, EXERCISE_TYPE, LIGHT_WEIGHTS, MUSCLE_FILTERS_ROW1, MUSCLE_FILTERS_ROW2, MUSCLE_FILTER_MAP, MUSCLE_LABELS, REPS_OPTIONS, TIME_OPTIONS, VARIANT_EXERCISES, getDefaultVariant, getExImage, getVariantOptions, getWarmupSets, getWeightOptions, normalizeName } from './data/exerciseCatalog'
import { RANK_LEVELS, RANK_QUOTES, getMotivation, getRank } from './data/motivation'
import { calcAnatomyLoad } from './data/muscleLoad'
import { PLAN_DAYS } from './data/plans'
import { CSS_ALL } from './styles/appCss'
import { fetchAllRows } from './utils/db'
import { buildCopyText, formatDateShort, formatMonth, localDateStr } from './utils/format'
import { baseExName, bestSet, e1rm, exMetric, isRepsType, recordMetric, setValue, uiSetToStored } from './utils/records'

const DEFAULT_SETTINGS = { username: '', weight: '', height: '', units: 'kg', theme: 'dark', language: 'ru', accent: 'orange' }

// Accent colours (Settings → Appearance). Every accent in the UI is var(--accent) / rgba(var(--accent-rgb), a).
const ACCENTS = [
  { id: 'orange', hex: '#FF9F0A', rgb: '255,159,10', name: 'Оранжевый' },
  { id: 'green', hex: '#30D158', rgb: '48,209,88', name: 'Зелёный' },
  { id: 'purple', hex: '#BF5AF2', rgb: '191,90,242', name: 'Фиолетовый' },
  { id: 'blue', hex: '#0A84FF', rgb: '10,132,255', name: 'Синий' },
  { id: 'pink', hex: '#FF375F', rgb: '255,55,95', name: 'Розовый' },
]
// Uniform action card of the workout screen (add exercise, program, warm-up, stretching)
const ActionCard = ({ icon, title, sub, onClick, thm, last }) => (
  <button onClick={onClick} style={{width:'100%',marginBottom:last?16:10,padding:'14px 16px',borderRadius:18,border:`1px solid ${thm.border}`,background:thm.card,cursor:'pointer',display:'flex',alignItems:'center',gap:14,textAlign:'left'}}>
    <div style={{width:44,height:44,borderRadius:13,background:'rgba(var(--accent-rgb),0.14)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,flexShrink:0}}>{icon}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:16,fontWeight:700,color:thm.text}}>{title}</div>
      <div style={{fontSize:12,color:thm.text40,marginTop:3}}>{sub}</div>
    </div>
    <span style={{color:thm.text30,fontSize:20}}>›</span>
  </button>
)

// Flame icon in the accent colour (an emoji can't be recoloured)
const Flame = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', filter: 'drop-shadow(0 0 3px rgba(var(--accent-rgb),0.5))' }}>
    <path fill="var(--accent)" d="M12 2c.6 3.2 2.6 4.9 4.3 6.9C18 10.9 19 12.9 19 15.2 19 19 15.9 22 12 22s-7-3-7-6.8c0-2.4 1.1-4.3 2.6-5.8.2 1.6 1 2.8 2.2 3.4C9.4 9.6 10 5.3 12 2z"/>
    <path fill="#fff" fillOpacity="0.6" d="M12 12.6c1.4 1.4 2.8 2.6 2.8 4.5A2.8 2.8 0 0 1 12 19.9a2.8 2.8 0 0 1-2.8-2.8c0-1.3.6-2.3 1.5-3 .2.8.6 1.2 1.2 1.4-.2-1.1-.1-2.1.1-2.9z"/>
  </svg>
)
const applyAccent = (id) => {
  const a = ACCENTS.find(x => x.id === id) || ACCENTS[0]
  const root = document.documentElement
  root.style.setProperty('--accent', a.hex)
  root.style.setProperty('--accent-rgb', a.rgb)
}

// The PDF report is rendered from an HTML string — escape anything that comes from the database
const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Name an exercise is saved under: «Жим лёжа (Узкий)» for a non-default variant
const exSaveName = (ex) => (ex.grip && ex.grip !== getDefaultVariant(ex.name)) ? `${ex.name} (${ex.grip})` : ex.name

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
  const [saved, setSaved] = useState(false)             // save button state only
  const [dataVersion, setDataVersion] = useState(0)     // bump to refetch data after saving / editing / deleting
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState([])
  const [openDays, setOpenDays] = useState({})
  const [historyYear, setHistoryYear] = useState('')
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
  const [chartPeriod, setChartPeriod] = useState('1M')
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
  // ── Achievements ──
  const [allRows, setAllRows] = useState(null)          // every workout with sets (loaded with the records)
  const [routineLog, setRoutineLog] = useState({ w: [], s: [] }) // completed warm-ups / stretches by date
  const [monthPicks, setMonthPicks] = useState({})                // chosen monthly challenges: { 'YYYY-MM': { ids, swaps, out } }
  const [achReady, setAchReady] = useState(false)        // user_metadata (seen ids, routine log) loaded
  const achSeenRef = useRef(undefined)                   // undefined = not loaded, null = never stored, [] = ids
  const [achQueue, setAchQueue] = useState([])           // celebrations waiting to be shown
  const [achToast, setAchToast] = useState(null)
  const [achTab, setAchTab] = useState('month')
  const [achUnviewed, setAchUnviewed] = useState(false)
  const [streakAlert, setStreakAlert] = useState(null)
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [workoutDate, setWorkoutDate] = useState(() => localDateStr(new Date()))
  const [workoutExercises, setWorkoutExercises] = useState([])
  const [draftRestored, setDraftRestored] = useState(false)
  const draftReadyRef = useRef(false)
  const [kbHeight, setKbHeight] = useState(0)
  const historyLoaded = useRef(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  // Body weight log (table body_weights): status 'loading' | 'ok' | 'missing' (table not created yet) | 'error'
  const [bodyWeights, setBodyWeights] = useState([])
  const [weightsStatus, setWeightsStatus] = useState('loading')
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showStretch, setShowStretch] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  setPrefs(settings) // language and units for t() / formatters during this render
  // accent colour as CSS variables (cheap, idempotent)
  useEffect(() => { applyAccent(settings.accent) }, [settings.accent])
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportPeriod, setExportPeriod] = useState('all')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [streakModalData, setStreakModalData] = useState(null)
  const [streakMotivQuote, setStreakMotivQuote] = useState('')
  const [exTabSearch, setExTabSearch] = useState('')
  const [exTabFilter, setExTabFilter] = useState('all')
  const [exTabSort, setExTabSort] = useState('az')     // az | freq | old
  const [exDetailModal, setExDetailModal] = useState(null)

  // Plan state
  const [activePlans, setActivePlans] = useState([])
  const [planWeights, setPlanWeights] = useState({})
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [pendingRatingPlan, setPendingRatingPlan] = useState(null)
  const [planOnboarding, setPlanOnboarding] = useState(false)
  const [planNotice, setPlanNotice] = useState(null)   // weight changes after a plan workout
  const [editSetModal, setEditSetModal] = useState(null) // {exIdx, setIdx, weight, reps}

  const handleAuth = async () => {
    setAuthLoading(true); setAuthError('')
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      if (error) setAuthError(error.message === 'Invalid login credentials' ? t('Неверный email или пароль') : error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
      if (error) setAuthError(error.message.includes('already registered') ? t('Этот email уже зарегистрирован') : error.message)
    }
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setFavorites(DEFAULT_FAVORITES)
    setHistory([]); setPrs([]); setStats(null)
    setSettings(DEFAULT_SETTINGS)
    setWorkoutExercises([]); setWorkoutStarted(false); setSelectedEx(null)
  }

  // Settings are stored in the account (Supabase auth user_metadata), so they are the same on
  // every device and are not lost when the browser clears site data; localStorage is a local cache.
  const saveSettings = async (newSettings) => {
    setSettings(newSettings)
    if (!user) return false
    try { localStorage.setItem('gymBroSettings_' + user.id, JSON.stringify(newSettings)) } catch {}
    const { error } = await supabase.auth.updateUser({ data: { settings: newSettings } })
    return !error
  }

  // ── Body weight log ────────────────────────────────────────────────────────
  const isMissingTable = (error) => !!error && (error.code === '42P01' || error.code === 'PGRST205' || (/body_weights/.test(error.message || '') && /not find|does not exist/i.test(error.message || '')))
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('body_weights').select('measured_on,weight').eq('user_id', user.id).order('measured_on')
      if (cancelled) return
      if (error) { setWeightsStatus(isMissingTable(error) ? 'missing' : 'error'); return }
      setBodyWeights((data || []).map(r => ({ measured_on: r.measured_on, weight: Number(r.weight) })))
      setWeightsStatus('ok')
    })()
    return () => { cancelled = true }
  }, [user])
  const addWeighIn = async (measured_on, weight) => {
    const { error } = await supabase.from('body_weights').upsert({ user_id: user.id, measured_on, weight }, { onConflict: 'user_id,measured_on' })
    if (error) { if (isMissingTable(error)) setWeightsStatus('missing'); return false }
    const next = [...bodyWeights.filter(e => e.measured_on !== measured_on), { measured_on, weight }].sort((a, b) => a.measured_on.localeCompare(b.measured_on))
    setBodyWeights(next); setWeightsStatus('ok')
    return true
  }
  const deleteWeighIn = async (measured_on) => {
    const { error } = await supabase.from('body_weights').delete().eq('user_id', user.id).eq('measured_on', measured_on)
    if (error) return false
    const next = bodyWeights.filter(e => e.measured_on !== measured_on)
    setBodyWeights(next)
    return true
  }

  const exportWorkouts = async (period) => {
    setShowExportModal(false)
    let query = supabase.from('workouts').select('workout_date,exercises(name),sets(set_no,weight,reps,time_sec)').eq('user_id', user.id).order('workout_date', { ascending: false })
    if (period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365
      const from = localDateStr(new Date(Date.now() - days * 86400000))
      query = query.gte('workout_date', from)
    }
    const { data } = await query
    const rows = data || []

    // Group by date
    const byDate = {}
    rows.forEach(w => {
      if (!byDate[w.workout_date]) byDate[w.workout_date] = []
      byDate[w.workout_date].push(w)
    })
    const sortedDates = Object.keys(byDate).sort((a,b) => b.localeCompare(a))

    const now = new Date()
    const periodLabel = period === 'all' ? t('Все время')
      : period === '7d' ? t('Последние 7 дней')
      : period === '30d' ? t('Последние 30 дней')
      : period === '3m' ? t('Последние 3 месяца')
      : period === '6m' ? t('Последние 6 месяцев')
      : t('Последний год')
    const genDate = now.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })

    // Stats
    const workoutDatesAll = [...new Set(rows.map(r => r.workout_date))]
    const totalKg = rows.reduce((sum, w) => sum + (w.sets||[]).reduce((s2, s) => s2 + (s.weight||0)*(s.reps||1), 0), 0)
    const totalVol = fmtVolume(totalKg)

    const workoutRows = sortedDates.map(date => {
      const dateStr = new Date(date + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })
      const exGroups = {}
      byDate[date].forEach(w => {
        const name = w.exercises?.name || ''
        if (!exGroups[name]) exGroups[name] = []
        exGroups[name].push(...(w.sets || []))
      })
      const dayKg = byDate[date].reduce((sum, w) => sum + (w.sets||[]).reduce((s2, s) => s2 + (s.weight||0)*(s.reps||1), 0), 0)
      const dayKgStr = fmtVolume(dayKg)
      const exCards = Object.entries(exGroups).map(([rawName, sets]) => {
        const validSets = sets.filter(s => s.weight > 0 || s.reps > 0 || s.time_sec > 0)
        if (!validSets.length) return null
        const ruExName = exName(normalizeName(rawName))
        const setLines = validSets.map((s, i) => {
          const label = s.time_sec > 0
            ? (s.weight > 0 ? `${t('Подход {n}',{n:i+1})}: ${s.time_sec} ${t('сек')} × ${kgToDisplay(s.weight)} ${wUnit}` : `${t('Подход {n}',{n:i+1})}: ${s.time_sec} ${t('сек')}`)
            : s.weight > 0 ? `${t('Подход {n}',{n:i+1})}: ${kgToDisplay(s.weight)} ${wUnit} × ${s.reps}` : `${t('Подход {n}',{n:i+1})}: ${s.reps} ${t('повт')}`
          return `<div style="padding:2px 0;color:rgba(255,255,255,0.6);font-size:11px;">${escapeHtml(label)}</div>`
        }).join('')
        return `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:4px;">${escapeHtml(ruExName)}</div>${setLines}</div>`
      }).filter(Boolean)
      // Split exercises into two columns
      const half = Math.ceil(exCards.length / 2)
      const col1 = exCards.slice(0, half).join('')
      const col2 = exCards.slice(half).join('')
      return `
        <div style="margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0 4px;">
            <div style="color:#FF9F0A;font-size:13px;font-weight:700;">${dateStr}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:11px;">${t('Итого:')} ${dayKgStr}</div>
          </div>
          <div style="border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:10px;"></div>
          <div style="display:table;width:100%;table-layout:fixed;">
            <div style="display:table-cell;width:50%;vertical-align:top;padding-right:12px;">${col1}</div>
            <div style="display:table-cell;width:50%;vertical-align:top;padding-left:12px;border-left:1px solid rgba(255,255,255,0.08);">${col2}</div>
          </div>
        </div>`
    }).join('')

    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#1a1a1a;color:#ffffff;padding:28px 28px 20px;min-height:100%;">
        <div style="margin-bottom:16px;">
          <div style="color:#FF9F0A;font-size:38px;font-weight:800;letter-spacing:-1px;line-height:1;">GYM BRO</div>
          <div style="color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;margin-top:6px;">${t('Отчёт за {period}',{period:periodLabel})}</div>
          <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:2px;">${t('Сформирован {date}',{date:genDate})}</div>
        </div>
        <div style="border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:16px;"></div>
        <div style="margin-bottom:16px;">
          <div style="color:#FF9F0A;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">${t('Статистика')}</div>
          <div style="font-size:12px;margin-bottom:4px;color:rgba(255,255,255,0.8);">${t('Всего тренировок:')} <b style="color:#ffffff;">${workoutDatesAll.length}</b></div>
          <div style="font-size:12px;color:rgba(255,255,255,0.8);">${t('Поднято за период:')} <b style="color:#ffffff;">${totalVol}</b></div>
        </div>
        <div style="border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:16px;"></div>
        <div style="color:#FF9F0A;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px;">${t('Тренировки')}</div>
        ${workoutRows}
        <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:20px;padding-top:8px;text-align:center;color:rgba(255,255,255,0.25);font-size:10px;">
          ${t('Gym BRO — Твой личный тренировочный журнал')}
        </div>
      </div>`

    const fileMonth = now.toLocaleDateString(locale(), { month: 'long' }).replace(' ', '_')
    const fileYear = now.getFullYear()

    // html2pdf (~1 МБ) грузится только при экспорте, а не при открытии приложения
    const { default: html2pdf } = await import('html2pdf.js')
    html2pdf().set({
      margin: 0,
      filename: `gymBRO_${fileMonth}_${fileYear}.pdf`,
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, backgroundColor: '#1a1a1a' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(html).save()
  }

  const clearHistory = async () => {
    setShowClearConfirm(false)
    const { data: workoutsData } = await supabase.from('workouts').select('id').eq('user_id', user.id)
    const ids = (workoutsData || []).map(w => w.id)
    for (const id of ids) {
      await supabase.from('sets').delete().eq('workout_id', id)
    }
    await supabase.from('workouts').delete().eq('user_id', user.id)
    setHistory([]); setPrs([]); setStats(null); setDataVersion(v => v + 1)
  }

  const openStreakModal = async () => {
    setShowStreakModal(true); setAchUnviewed(false)
    setStreakModalData(null)
    const rankNow = getRank(streak)
    const quotesArr = RANK_QUOTES[rankNow.name] || RANK_QUOTES['Новичок']
    setStreakMotivQuote(quotesArr[Math.floor(Math.random() * quotesArr.length)])
    if (!user) return
    const thisM = localDateStr(new Date()).slice(0,7)
    const { data: wData } = await supabase.from('workouts').select('id,workout_date').eq('user_id', user.id)
    if (!wData) return
    const monthIds = wData.filter(w => w.workout_date.startsWith(thisM)).map(w => w.id)
    let monthKg = 0, bestWorkout = null
    if (monthIds.length > 0) {
      const { data: sData } = await supabase.from('sets').select('weight,reps,workout_id').gt('weight',0).gt('reps',0).in('workout_id', monthIds)
      monthKg = (sData||[]).reduce((s,r) => s + r.weight * r.reps, 0)
      const byDay = {}
      ;(sData||[]).forEach(s => {
        const w = wData.find(w => w.id === s.workout_id)
        if (!w) return
        byDay[w.workout_date] = (byDay[w.workout_date]||0) + s.weight * s.reps
      })
      const bestEntry = Object.entries(byDay).sort((a,b) => b[1]-a[1])[0]
      if (bestEntry) bestWorkout = { date: bestEntry[0], kg: Math.round(bestEntry[1]) }
    }
    const { data: pData } = await supabase.from('workouts').select('workout_date,exercises(name),sets(weight,reps)').eq('user_id', user.id)
    const allTimePR = {}, beforePR = {}, monthPRmap = {}
    ;(pData||[]).forEach(w => {
      const name = normalizeName(w.exercises?.name); if (!name) return
      w.sets?.forEach(s => {
        if (s.weight > 0 && s.reps > 0) {
          const est = s.weight * (1 + s.reps / 30)
          if (!allTimePR[name] || est > allTimePR[name].est) allTimePR[name] = { est, weight:s.weight, reps:s.reps, date:w.workout_date }
          // «Лучший прирост» compares the heaviest weight lifted before this month and in this month
          const bucket = w.workout_date.startsWith(thisM) ? monthPRmap : beforePR
          if (!bucket[name] || s.weight > bucket[name].weight) bucket[name] = { weight: s.weight }
        }
      })
    })
    const monthPRs = Object.values(allTimePR).filter(pr => pr.date?.startsWith(thisM)).length
    let bestImprovement = null
    Object.entries(monthPRmap).forEach(([name, cur]) => {
      const prev = beforePR[name]
      if (prev && cur.weight > prev.weight) {
        const diff = parseFloat((cur.weight - prev.weight).toFixed(1))
        if (!bestImprovement || diff > bestImprovement.diff) bestImprovement = { name, diff }
      }
    })
    const past3 = []
    for (let i = 1; i <= 3; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const m = localDateStr(d).slice(0,7)
      const count = new Set(wData.filter(w => w.workout_date.startsWith(m)).map(w => w.workout_date)).size
      past3.push({ month: m, count })
    }
    setStreakModalData({ monthKg: Math.round(monthKg), monthPRs, bestWorkout, bestImprovement, past3 })
  }

  useEffect(() => { const s = document.createElement('style'); s.textContent = CSS_ALL; document.head.appendChild(s); return () => document.head.removeChild(s) }, [])

  useEffect(() => {
    document.body.style.background = settings.theme === 'light' ? '#f2f2f7' : '#000'
    return () => { document.body.style.background = '' }
  }, [settings.theme])

  // Track virtual keyboard height for iOS Safari
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setKbHeight(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update) }
  }, [])


  // ── Черновик тренировки ────────────────────────────────────────────────────
  // Незавершённая тренировка хранится на устройстве: если вкладку выгрузило или страница
  // перезагрузилась, подходы не теряются. После сохранения тренировки черновик удаляется.
  useEffect(() => {
    draftReadyRef.current = false
    if (!user) return
    try {
      const raw = localStorage.getItem('gymBroDraft_' + user.id)
      const draft = raw ? JSON.parse(raw) : null
      if (draft && Array.isArray(draft.exercises) && draft.exercises.length) {
        setWorkoutExercises(draft.exercises)
        if (draft.date) setWorkoutDate(draft.date)
        setWorkoutStarted(true)
        setDraftRestored(true)
        setTimeout(() => setDraftRestored(false), 3500)
      } else {
        // no draft for this account: never keep another account's workout in progress
        setWorkoutExercises([]); setWorkoutStarted(false)
      }
    } catch {}
    draftReadyRef.current = true
  }, [user])

  useEffect(() => {
    if (!user || !draftReadyRef.current) return
    try {
      const key = 'gymBroDraft_' + user.id
      if (workoutExercises.length) localStorage.setItem(key, JSON.stringify({ date: workoutDate, exercises: workoutExercises, savedAt: Date.now() }))
      else localStorage.removeItem(key)
    } catch {}
  }, [workoutExercises, workoutDate, user])

  // Auth listener. Supabase fires several events on start (INITIAL_SESSION, TOKEN_REFRESHED…)
  // with a new user object each time — keep the same object while the user id is unchanged,
  // otherwise every [user] effect refetches its data 2–3 times.
  useEffect(() => {
    const applySession = (session) => {
      const next = session?.user ?? null
      setUser(prev => (prev && next && prev.id === next.id) ? prev : next)
    }
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applySession(session))
    return () => subscription.unsubscribe()
  }, [])

  // Load favorites from supabase when user logs in
  useEffect(() => {
    if (!user) return
    const initKey = 'gbFavsInit_' + user.id
    supabase.from('favorites').select('exercise_name').eq('user_id', user.id)
      .then(async ({ data }) => {
        const initialized = localStorage.getItem(initKey)
        if (data && data.length > 0) {
          setFavorites(data.map(r => r.exercise_name))
          localStorage.setItem(initKey, '1')
        } else if (!initialized) {
          // Truly first time — insert defaults
          const inserts = DEFAULT_FAVORITES.map(name => ({ user_id: user.id, exercise_name: name }))
          await supabase.from('favorites').insert(inserts)
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

    // Load settings: account first, then the local cache. Settings that exist only locally
    // (saved by older versions) are uploaded to the account once.
    let local = null
    try { local = JSON.parse(localStorage.getItem('gymBroSettings_' + user.id) || 'null') } catch {}
    const remote = user.user_metadata?.settings
    if (remote) {
      setSettings({ ...DEFAULT_SETTINGS, ...remote })
    } else if (local) {
      setSettings({ ...DEFAULT_SETTINGS, ...local })
      supabase.auth.updateUser({ data: { settings: { ...DEFAULT_SETTINGS, ...local } } })
    } else {
      setSettings(DEFAULT_SETTINGS)
    }
  }, [user])

  useEffect(() => {
    if (prs.length > 0 && !chartEx) setChartEx(prs[0][0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prs])

  useEffect(() => {
    async function load() {
      if (!user) return
      const thisM = localDateStr(new Date()).slice(0,7)
      const { data: wDates } = await supabase.from('workouts').select('workout_date').eq('user_id', user.id).gte('workout_date', thisM + '-01')
      if (!wDates) return
      const monthCount = new Set(wDates.map(w => w.workout_date)).size
      setStreak(monthCount)
    }
    load()
  }, [dataVersion, user])

  useEffect(() => {
    async function loadPlans() {
      if (!user) return
      const { data: plans } = await supabase.from('workout_plans').select('*').eq('user_id', user.id).eq('is_active', true).order('slot')
      if (!plans) return
      setActivePlans(plans)
      if (plans.length > 0) {
        const { data: pw } = await supabase.from('plan_weights').select('*').in('plan_id', plans.map(p => p.id))
        const map = {}
        for (const row of (pw || [])) {
          map[`${row.plan_id}:${row.exercise_name}`] = row
        }
        setPlanWeights(map)
      }
    }
    loadPlans()
  }, [user, dataVersion])

  // История за последние 12 месяцев. Раньше был limit(200) записей (= упражнений),
  // что давало лишь ~4–5 месяцев. Грузим порциями, т.к. Supabase отдаёт максимум 1000 строк за запрос.
  useEffect(() => {
    // нужна и на «Прогрессе» — карта мышц считается по истории
    if ((tab !== 'history' && tab !== 'progress') || !user) return
    let cancelled = false
    const since = new Date(); since.setDate(1); since.setMonth(since.getMonth() - 11)
    const sinceStr = `${since.getFullYear()}-${String(since.getMonth()+1).padStart(2,'0')}-01`
    const PAGE = 1000
    ;(async () => {
      const all = []
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase.from('workouts').select('id,workout_date,exercises(name),sets(set_no,weight,reps,time_sec)')
          .eq('user_id', user.id).gte('workout_date', sinceStr)
          .order('workout_date', { ascending: false }).order('id', { ascending: false })
          .range(from, from + PAGE - 1)
        if (error || !data) break
        all.push(...data)
        if (data.length < PAGE) break
      }
      if (!cancelled) setHistory(all)
    })()
    return () => { cancelled = true }
  }, [tab, dataVersion, user])

  useEffect(() => {
    if (tab !== 'progress' || !user) return
    async function load() {
      const wData = await fetchAllRows(() => supabase.from('workouts').select('id,workout_date').eq('user_id', user.id).order('id'))
      const totalW = new Set(wData.map(w => w.workout_date)).size
      const thisM = localDateStr(new Date()).slice(0,7)
      const monthW = new Set(wData.filter(w => w.workout_date.startsWith(thisM)).map(w => w.workout_date)).size
      const monthIds = wData.filter(w=>w.workout_date.startsWith(thisM)).map(w=>w.id).filter(Boolean)
      let monthKg = 0
      if (monthIds.length > 0) {
        const { data: sData } = await supabase.from('sets').select('weight,reps,workout_id').gt('weight',0).gt('reps',0).in('workout_id', monthIds)
        monthKg = (sData||[]).reduce((s,r)=>s+r.weight*r.reps, 0)
      }
      setStats({ totalW, monthW, monthKg })
    }
    let cancelled = false
    load()
    return () => { cancelled = true }
  }, [tab, user, dataVersion])

  // All-time records. Loaded on sign-in (not only on Progress) so the workout screen can spot a new record live.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      // Рекорды по всей истории. Каждая вариация («Жим лёжа (Узкий)») — отдельный рекорд, как и на графике.
      // Record for weight exercises = best estimated 1RM (100×5 beats 100×1); plank — time, ab wheel — reps.
      const pData = await fetchAllRows(() => supabase.from('workouts').select('id,workout_date,exercises(name),sets(set_no,weight,reps,time_sec)').eq('user_id', user.id).order('id'))
      if (!cancelled) setAllRows(pData)
      const map = {}
      pData.forEach(w => {
        const name = normalizeName(w.exercises?.name); if (!name) return
        const metric = exMetric(name)
        const { best, value } = bestSet(w.sets, metric === 'weight' ? 'e1rm' : metric)
        if (!best) return
        const cur = map[name]
        const better = !cur || value > cur.value || (value === cur.value && (best.reps || 0) > (cur.reps || 0))
        if (better) map[name] = { metric, value, weight: best.weight || 0, reps: best.reps || 0, time_sec: best.time_sec || 0, date: w.workout_date }
      })
      const order = { weight: 0, reps: 1, time: 2 }
      if (!cancelled) setPrs(Object.entries(map).sort((a,b) => (order[a[1].metric] - order[b[1].metric]) || (b[1].value - a[1].value)))
    }
    load()
    return () => { cancelled = true }
  }, [user, dataVersion])

  useEffect(() => {
    if (tab !== 'progress' || !user) return
    async function load() {
      const start = `${calYear}-${String(calMonth+1).padStart(2,'0')}-01`
      const end = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${new Date(calYear,calMonth+1,0).getDate()}`
      const { data } = await supabase.from('workouts').select('workout_date,sets(weight,reps)').eq('user_id', user.id).gte('workout_date',start).lte('workout_date',end)
      const map = {}
      data?.forEach(w => { const d=Number(w.workout_date.slice(8,10)); if(!map[d]) map[d]=0; w.sets?.forEach(s => { if(s.weight>0&&s.reps>0) map[d]+=s.weight*s.reps }) })
      setCalData(map)
    }
    load()
  }, [tab, calYear, calMonth, user])

  useEffect(() => {
    if (!chartEx || tab !== 'progress' || !user) return
    async function load() {
      // График строится ровно по выбранному упражнению, как и рекорд: «Жим лёжа» и «Жим лёжа (Узкий)» — разные.
      // Старые и английские названия в базе распознаются через normalizeName.
      const metric = exMetric(chartEx)
      const byDate = {}
      const allEx = await fetchAllRows(() => supabase.from('exercises').select('id,name').order('id'))
      const exIds = allEx.filter(e => normalizeName(e.name) === chartEx).map(e => e.id)
      if (exIds.length) {
        const rows = await fetchAllRows(() => supabase.from('workouts').select('id,workout_date,sets(weight,reps,time_sec)')
          .in('exercise_id', exIds).eq('user_id', user.id).order('id'))
        rows.forEach(w => {
          const { best, value } = bestSet(w.sets, metric)
          if (!best) return
          const cur = byDate[w.workout_date]
          if (!cur || value > cur.orm) byDate[w.workout_date] = { ...cur, orm: value, best }
          if (metric === 'weight') {
            const r = bestSet(w.sets, 'e1rm')
            const c = byDate[w.workout_date]
            if (r.best && (!c.e1 || r.value > c.e1)) byDate[w.workout_date] = { ...c, e1: r.value, e1best: r.best }
          }
        })
      }
      if (cancelled) return
      const pts = Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b)).map(([date,{orm,best,e1,e1best}])=>({
        val: parseFloat(orm.toFixed(1)),
        e1rm: e1 ? parseFloat(e1.toFixed(1)) : null,
        e1Weight: e1best?.weight || 0,
        e1Reps: e1best?.reps || 0,
        metric,
        date,
        label: new Date(date+'T12:00:00').toLocaleDateString(locale(),{day:'numeric',month:'short'}),
        bestWeight: best.weight || 0,
        bestReps: best.reps || 0,
        bestTimeSec: best.time_sec || 0,
      })).filter(p=>p.val>0)
      setChartData(pts)
    }
    let cancelled = false
    load()
    return () => { cancelled = true }
  }, [chartEx, tab, user, dataVersion])

  useEffect(() => {
    if (!selectedEx || !user) return
    async function load() {
      let { data: ex } = await supabase.from('exercises').select('id').eq('name',selectedEx).order('id').limit(1).maybeSingle()
      if (!ex) { setLastSession(null); return }
      const { data } = await supabase.from('workouts').select('workout_date,sets(set_no,weight,reps,time_sec)').eq('exercise_id',ex.id).eq('user_id', user.id).order('workout_date',{ascending:false}).limit(1).maybeSingle()
      setLastSession(data || null)
    }
    load()
  }, [selectedEx, user])

  useEffect(() => {
    if (timerSecs === null || timerPaused) { clearInterval(timerRef.current); return }
    if (timerSecs <= 0) { setTimerSecs(null); setTimerPaused(false); if (navigator.vibrate) navigator.vibrate([200,100,200,100,400]); return }
    timerRef.current = setInterval(() => setTimerSecs(s => (s === null ? null : s - 1)), 1000)
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
  const toggleFav = useCallback(async (name) => {
    const isFavNow = favorites.includes(name)
    const newFavs = isFavNow ? favorites.filter(f => f !== name) : [...favorites, name]
    setFavorites(newFavs)
    if (user) {
      if (isFavNow) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('exercise_name', name)
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, exercise_name: name })
      }
    }
  }, [favorites, user])
  const addExToWorkout = useCallback(async (name) => {
    setShowExModal(false)
    setModalSearch('')
    const grip = getDefaultVariant(name)
    const tempId = Date.now()
    // Add immediately — optimistic UI (no lag)
    setWorkoutExercises(prev => [...prev, { tempId, name, grip, open: true, lastSession: null, sets: [{ weight: 0, reps: 0 }] }])
    // Load last session in background
    try {
      const [{ data: exDbExact }, { data: exDbGrip }] = await Promise.all([
        supabase.from('exercises').select('id').eq('name', name),
        supabase.from('exercises').select('id').ilike('name', `${name} (%)`)
      ])
      const allExIds = [...(exDbExact||[]), ...(exDbGrip||[])].map(e => e.id)
      if (allExIds.length) {
        const { data: lastW } = await supabase.from('workouts').select('workout_date,sets(set_no,weight,reps,time_sec)').in('exercise_id', allExIds).eq('user_id', user.id).order('workout_date',{ascending:false}).limit(1).single()
        if (lastW) {
          setWorkoutExercises(prev => prev.map(e => e.tempId === tempId ? {...e, lastSession: lastW} : e))
        }
      }
    } catch {}
  }, [user])

  const getProgressStep = (planType, exName, isBase) => {
    const legEx = ['Приседания','Жим ногами','Становая тяга']
    if (planType === 'strength') {
      if (!isBase) return 0
      return legEx.includes(exName) ? 5 : 2.5
    }
    if (planType === 'mass' || planType === 'cut' || planType === 'fit') {
      const t = EXERCISE_TYPE[exName] || 'light'
      if (t === 'machine') return 5
      if (t === 'heavy') return 2.5
      return 2
    }
    return 2
  }

  const applyProgression = async (plan, rating, completedMap, liftedMap = {}) => {
    const days = PLAN_DAYS[plan.plan_type] || []
    const dayIdx = (plan.current_day - 1) % days.length
    const dayDef = days[dayIdx]
    if (!dayDef) return

    const updates = [], changes = []
    for (const ex of dayDef.exercises) {
      const key = `${plan.id}:${ex.name}`
      const pw = planWeights[key]
      if (!pw) continue
      // first time with this plan exercise: start from the weight actually lifted, no progression yet
      if (!(pw.working_weight > 0)) {
        if (liftedMap[ex.name] > 0) { updates.push({ plan_id: plan.id, exercise_name: ex.name, working_weight: liftedMap[ex.name], last_rating: rating }); changes.push({ name: ex.name, from: 0, to: liftedMap[ex.name] }) }
        continue
      }
      const completedSets = completedMap[ex.name] || 0
      const allCompleted = completedSets >= ex.sets
      let newWeight = pw.working_weight
      const step = getProgressStep(plan.plan_type, ex.name, ex.isBase)

      if (plan.plan_type === 'strength') {
        if (ex.isBase) {
          if ((rating === 'good' || rating === 'super') && allCompleted) {
            newWeight = pw.working_weight + step
          } else if (rating === 'hard') {
            newWeight = Math.round(pw.working_weight * 0.9)
          }
        }
      } else {
        if ((rating === 'good' || rating === 'super') && allCompleted && step > 0) {
          newWeight = pw.working_weight + step
        } else if (rating === 'hard') {
          newWeight = Math.round(pw.working_weight * 0.95)
        }
      }
      if (newWeight !== pw.working_weight) {
        changes.push({ name: ex.name, from: pw.working_weight, to: newWeight })
        updates.push({ plan_id: plan.id, exercise_name: ex.name, working_weight: newWeight, last_rating: rating })
      } else {
        updates.push({ plan_id: plan.id, exercise_name: ex.name, working_weight: pw.working_weight, last_rating: rating })
      }
    }

    const fresh = {}
    for (const u of updates) {
      fresh[`${u.plan_id}:${u.exercise_name}`] = u.working_weight
      await supabase.from('plan_weights').update({ working_weight: u.working_weight, last_rating: u.last_rating, updated_at: new Date().toISOString() })
        .eq('user_id', user.id).eq('plan_id', u.plan_id).eq('exercise_name', u.exercise_name)
    }

    setPlanWeights(prev => { const next = { ...prev }; Object.entries(fresh).forEach(([k, w]) => { if (next[k]) next[k] = { ...next[k], working_weight: w } }); return next })
    const nextDay = (plan.current_day % plan.total_days) + 1
    await supabase.from('workout_plans').update({ current_day: nextDay, workout_count: plan.workout_count + 1 }).eq('id', plan.id)
    setActivePlans(prev => prev.map(p => p.id === plan.id ? { ...p, current_day: nextDay, workout_count: p.workout_count + 1 } : p))
    return changes
  }

  // ── Achievements ──────────────────────────────────────────────────────
  // Seen ids and the routine log live in user_metadata so celebrations don't repeat on another device.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    achSeenRef.current = undefined; setAchReady(false); setAllRows(null)
    ;(async () => {
      let md = user.user_metadata || {}
      try { const { data } = await supabase.auth.getUser(); if (data?.user?.user_metadata) md = data.user.user_metadata } catch {}
      if (cancelled) return
      setRoutineLog({ w: md.routineLog?.w || [], s: md.routineLog?.s || [] })
      setMonthPicks(md.monthCh && typeof md.monthCh === 'object' ? md.monthCh : {})
      achSeenRef.current = Array.isArray(md.achSeen) ? md.achSeen : null
      setAchReady(true)
    })()
    return () => { cancelled = true }
  }, [user])

  const achievements = useMemo(() => {
    if (!allRows || !achReady || weightsStatus === 'loading') return null
    try { return computeAchievements({ rows: allRows, bodyWeights, routineLog, today: localDateStr(new Date()), sex: settings.sex || 'male', monthPicks, seed: user?.id || '' }) }
    catch (e) { console.error('achievements', e); return null }
  }, [allRows, achReady, bodyWeights, weightsStatus, routineLog, settings.sex, monthPicks, user?.id])

  // Monthly challenges: freeze the month's pick once shown, and swap one on request (max 3 per month)
  const saveMonthPicks = useCallback((month, entry) => {
    setMonthPicks(prev => {
      const next = { ...prev, [month]: entry }
      // keep the last 24 months only
      Object.keys(next).sort().slice(0, -24).forEach(k => delete next[k])
      supabase.auth.updateUser({ data: { monthCh: next } })
      return next
    })
  }, [])
  useEffect(() => {
    const cur = achievements?.current
    if (cur?.needsSave) saveMonthPicks(cur.month, { ids: cur.challenges.map(c => c.id), swaps: cur.swaps || 0, out: cur.out || [] })
  }, [achievements, saveMonthPicks])
  const swapMonthChallenge = useCallback((idx) => {
    const cur = achievements?.current
    if (!cur) return
    const next = swapChallenge(cur, idx, user?.id || '')
    if (next) saveMonthPicks(cur.month, next)
  }, [achievements, saveMonthPicks, user?.id])
  // Per-exercise stats for the Exercises tab
  const exIndex = useMemo(() => exerciseIndex(allRows), [allRows])

  // Celebrate newly earned ones. On the very first run everything already earned is marked as seen quietly.
  useEffect(() => {
    if (!achievements || achSeenRef.current === undefined) return
    const first = achSeenRef.current === null
    const seen = new Set(achSeenRef.current || [])
    const fresh = achievements.ids.filter(id => !seen.has(id))
    if (!fresh.length && !first) return
    const next = [...seen, ...fresh]
    achSeenRef.current = next
    supabase.auth.updateUser({ data: { achSeen: next } })
    if (first) {
      if (achievements.earnedCount) { setAchToast(achievements.earnedCount); setTimeout(() => setAchToast(null), 5000) }
      return
    }
    const cur = achievements.current.month
    // Badges earned long ago (e.g. a newly added badge that past workouts already satisfy) are not celebrated
    // one by one: only those earned in the last 3 days get a celebration, the rest show a single toast.
    const d3 = new Date(Date.now() - 3 * 86400000)
    const since = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-${String(d3.getDate()).padStart(2, '0')}`
    const isOld = id => id.startsWith('p:') && (achievements.idDates?.[id] || '9999') < since
    const old = fresh.filter(isOld).length
    const items = fresh.filter(id => !isOld(id) && (id.startsWith('p:') || id.startsWith(`m:${cur}:`))).map(id => describeId(id, achievements)).filter(Boolean)
    if (old && !items.length) { setAchToast(achievements.earnedCount); setAchUnviewed(true); setTimeout(() => setAchToast(null), 5000) }
    if (items.length) {
      setAchQueue(q => [...q, ...items]); setAchUnviewed(true)
      if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 200])
    }
  }, [achievements])

  const logRoutine = (type) => {
    const next = { w: [...routineLog.w], s: [...routineLog.s] }
    next[type].push(localDateStr(new Date()))
    setRoutineLog(next)
    supabase.auth.updateUser({ data: { routineLog: next } })
  }

  // ── Live personal records ─────────────────────────────────────────────
  const prMap = useMemo(() => Object.fromEntries(prs), [prs])
  // Record for a workout exercise, its metric and the stored-shape sets
  const exRecordInfo = (ex) => {
    const key = normalizeName(exSaveName(ex))
    const type = EXERCISE_TYPE[ex.name] || 'light'
    return { key, pr: prMap[key], metric: recordMetric(key), stored: ex.sets.map(s => uiSetToStored(s, type)) }
  }
  const celebratedRef = useRef({})
  const prAlertTimer = useRef(null)
  // A second after the last change, celebrate a set that beats the all-time record (once per new best).
  useEffect(() => {
    if (!workoutExercises.length) { celebratedRef.current = {}; return }
    const t = setTimeout(() => {
      for (const ex of workoutExercises) {
        const { key, pr, metric, stored } = exRecordInfo(ex)
        if (!pr) continue // first time doing it — nothing to beat yet
        const { best, value } = bestSet(stored, metric)
        if (!best || value <= pr.value + 1e-6 || value <= (celebratedRef.current[key] || 0)) continue
        celebratedRef.current[key] = value
        setPrAlert({ name: key, metric, best, value, pr })
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300])
        clearTimeout(prAlertTimer.current)
        prAlertTimer.current = setTimeout(() => setPrAlert(null), 4500)
        break
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [workoutExercises, prMap]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Training plans ──────────────────────────────────────────────────────
  // Heaviest weight of the latest session of an exercise (all grips) — a starting weight for plan sets
  const lastWorkingWeight = (name) => {
    const rows = (allRows || []).filter(w => baseExName(normalizeName(w.exercises?.name)) === name)
    if (!rows.length) return { weight: 0, session: null }
    const last = rows.reduce((a, b) => (b.workout_date > a.workout_date ? b : a))
    return { weight: Math.max(0, ...(last.sets || []).filter(x => x.reps > 0).map(x => x.weight || 0)), session: last }
  }
  // Load a day of a plan into today's workout and open the workout screen
  const loadPlanDay = async (plan, dayIdx) => {
    const dayDef = (PLAN_DAYS[plan.plan_type] || [])[dayIdx]
    if (!dayDef || loadingPlan) return
    setLoadingPlan(true)
    try {
      const newExercises = await Promise.all(dayDef.exercises.map(async ex => {
        const key = `${plan.id}:${ex.name}`
        let pw = planWeights[key]
        if (!pw) {
          const { data: inserted } = await supabase.from('plan_weights').insert({
            user_id: user.id, plan_id: plan.id, exercise_name: ex.name,
            working_weight: 0, target_reps: ex.reps, target_sets: ex.sets
          }).select().single()
          pw = inserted
          if (pw) setPlanWeights(prev => ({ ...prev, [key]: pw }))
        }
        const hist = lastWorkingWeight(ex.name)
        const wt = pw?.working_weight > 0 ? pw.working_weight : hist.weight
        // weight is filled in, reps are left for the user: a set counts only once it was really done
        const ty = EXERCISE_TYPE[ex.name] || 'light'
        const sets = Array.from({ length: ex.sets }, () => ({ weight: ty === 'timed' ? 0 : wt, reps: 0, done: false }))
        return { tempId: Date.now() + Math.random(), name: ex.name, grip: getDefaultVariant(ex.name), open: false, lastSession: hist.session, sets,
          planId: plan.id, isBase: ex.isBase, target: { sets: ex.sets, reps: ex.reps, weight: wt } }
      }))
      if (newExercises[0]) newExercises[0].open = true
      setWorkoutExercises(prev => {
        if (!prev.length) setWorkoutDate(localDateStr(new Date()))
        return [...prev.filter(e => !newExercises.some(n => n.name === e.name)), ...newExercises]
      })
      setShowPlanModal(false)
      setTab('add'); setWorkoutStarted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoadingPlan(false)
    }
  }
  // Repeat a past workout: same exercises and grips, weights prefilled, reps left to fill in
  const repeatWorkout = async (last) => {
    const items = []
    for (const w of last.rows) {
      const full = normalizeName(w.exercises?.name); if (!full) continue
      const base = baseExName(full)
      const variant = full !== base ? full.match(/\(([^)]*)\)\s*$/)?.[1] : null
      const grip = variant || getDefaultVariant(base)
      if (items.some(e => e.name === base && e.grip === grip)) continue
      const ty = EXERCISE_TYPE[base] || 'light'
      const sorted = [...(w.sets || [])].sort((a, b) => a.set_no - b.set_no)
      const sets = (sorted.length ? sorted : [{}]).map(x => ({ weight: ty === 'timed' ? 0 : (x.weight || 0), reps: 0 }))
      items.push({ tempId: Date.now() + Math.random(), name: base, grip, open: false, lastSession: { workout_date: w.workout_date, sets: sorted }, sets })
    }
    if (!items.length) return
    items[0].open = true
    setWorkoutDate(localDateStr(new Date()))
    setWorkoutExercises(items)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  // Start a program from the catalogue (replaces the active one)
  const choosePlan = async (type) => {
    const days = PLAN_DAYS[type] || []
    for (const p of activePlans) await supabase.from('workout_plans').update({ is_active: false }).eq('id', p.id)
    const { data: plan, error } = await supabase.from('workout_plans').insert({
      user_id: user.id, plan_type: type, slot: 1, total_days: days.length, current_day: 1, workout_count: 0
    }).select().single()
    if (error || !plan) {
      setSaveError(t('Не удалось подключить программу. Проверь интернет и попробуй ещё раз.')); setTimeout(() => setSaveError(null), 8000)
      return false
    }
    setActivePlans([plan])
    return true
  }
  const stopPlan = async (plan) => {
    await supabase.from('workout_plans').update({ is_active: false }).eq('id', plan.id)
    setActivePlans(prev => prev.filter(p => p.id !== plan.id))
  }

  const saveWorkout = async () => {
    if (!workoutExercises.length) return
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true); setSaveError(null)
    // Every Supabase call is checked: exercises that failed stay on screen (and in the draft) so the
    // user can retry; exercises that were saved are removed so a retry does not duplicate them.
    const savedItems = new Set(), failed = []
    for (const exItem of workoutExercises) {
      const exType = EXERCISE_TYPE[exItem.name] || 'light'
      const exIsTimed = exType === 'timed'
      const filled = exItem.sets.filter(s => exIsTimed ? s.weight > 0 : isRepsType(exType) ? s.reps > 0 : (s.weight > 0 && s.reps > 0))
      if (!filled.length) { savedItems.add(exItem); continue }
      const saveName = exSaveName(exItem)
      try {
        let { data: ex, error: e1 } = await supabase.from('exercises').select('id').eq('name', saveName).order('id').limit(1).maybeSingle()
        if (e1) throw e1
        if (!ex) {
          const { data: inserted, error: e2 } = await supabase.from('exercises').insert({ name: saveName }).select().single()
          if (e2) throw e2
          ex = inserted
        }
        if (!ex) throw new Error('exercise')
        const { data: w, error: e3 } = await supabase.from('workouts').insert({ workout_date: workoutDate, exercise_id: ex.id, user_id: user.id }).select().single()
        if (e3 || !w) throw e3 || new Error('workout')
        const { error: e4 } = await supabase.from('sets').insert(filled.map((s,i) => ({
          workout_id: w.id, set_no: i+1,
          weight: exIsTimed ? (s.timedWeight||0) : (s.weight||0),
          reps: exIsTimed ? 0 : (s.reps||0),
          time_sec: exIsTimed ? (s.weight||0) : null
        })))
        if (e4) { await supabase.from('workouts').delete().eq('id', w.id); throw e4 }
        savedItems.add(exItem)
      } catch {
        failed.push(exItem)
      }
    }
    savingRef.current = false
    setSaving(false)
    if (savedItems.size) setDataVersion(v => v + 1)
    if (failed.length) {
      setWorkoutExercises(prev => prev.filter(e => !savedItems.has(e)))
      setSaveError(t('Не удалось сохранить: {list}. Проверь интернет и нажми «Сохранить» ещё раз.', { list: failed.map(e => exName(e.name)).join(', ') }))
      setTimeout(() => setSaveError(null), 8000)
      return
    }
    // everything is in the database: drop the draft right away (a reload must not restore and re-save it)
    try { localStorage.removeItem('gymBroDraft_' + user.id) } catch {}
    try {
      const thisM2 = localDateStr(new Date()).slice(0,7)
      const { data: sessData } = await supabase.from('workouts').select('workout_date').eq('user_id', user.id).gte('workout_date', thisM2 + '-01')
      const monthCount = new Set((sessData || []).map(w => w.workout_date)).size
      setStreak(monthCount)
      setStreakAlert({ type: 'month', count: monthCount, msg: getMotivation(monthCount) })
      setTimeout(() => setStreakAlert(null), 4500)
    } catch {}
    // Check if any plan exercises were in this workout
    const planEx = workoutExercises.find(e => e.planId)
    if (planEx) {
      const plan = activePlans.find(p => p.id === planEx.planId)
      if (plan) {
        setPendingRatingPlan(plan)
        setShowRatingModal(true)
        return
      }
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setWorkoutStarted(false); setWorkoutExercises([]) }, 1000)
  }

  const deleteWorkout = async (workoutId) => {
    if (!window.confirm(t('Удалить это упражнение из тренировки?'))) return
    await supabase.from('sets').delete().eq('workout_id', workoutId)
    await supabase.from('workouts').delete().eq('id', workoutId)
    setDataVersion(v => v + 1)
  }

  const deleteDay = async (date, workouts) => {
    if (!window.confirm(t('Удалить тренировку за {date}?',{date}))) return
    const ids = workouts.map(w => w.id)
    for (const id of ids) {
      await supabase.from('sets').delete().eq('workout_id', id)
      await supabase.from('workouts').delete().eq('id', id)
    }
    setDataVersion(v => v + 1)
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

  // changes: [{ workoutId, sets }] — only the exercises that were edited
  const saveEdit = async (changes) => {
    let ok = true
    for (const { workoutId, sets: newSets } of changes) {
      const { error: e1 } = await supabase.from('sets').delete().eq('workout_id', workoutId)
      if (e1) { ok = false; continue }
      const rows = newSets.map((s,i) => ({ workout_id:workoutId, set_no:i+1, weight:parseFloat(s.weight)||0, reps:parseInt(s.reps)||0, time_sec: s.time_sec != null ? parseFloat(s.time_sec)||0 : null }))
      if (rows.length) { const { error: e2 } = await supabase.from('sets').insert(rows); if (e2) ok = false }
    }
    setDataVersion(v => v + 1)
    if (ok) setEditModal(null)
    else { setSaveError(t('Не удалось сохранить изменения. Проверь интернет и попробуй ещё раз.')); setTimeout(() => setSaveError(null), 8000) }
  }

  const filtered = useMemo(() => {
    const q = modalSearch.toLowerCase().trim()
    if (!q) return exercises
    return exercises.filter(e => e.name.toLowerCase().includes(q) || exName(e.name).toLowerCase().includes(q))
  }, [exercises, modalSearch, settings.language]) // eslint-disable-line react-hooks/exhaustive-deps
  const favSet = useMemo(() => new Set(favorites), [favorites])
  const favFiltered = useMemo(() => filtered.filter(e => favSet.has(e.name)), [filtered, favSet])
  const restFiltered = useMemo(() => filtered.filter(e => !favSet.has(e.name)), [filtered, favSet])
  const grouped = history.reduce((acc,w) => { if(!acc[w.workout_date]) acc[w.workout_date]=[]; acc[w.workout_date].push(w); return acc }, {})
  const calMonthName = new Date(calYear,calMonth).toLocaleDateString(locale(),{month:'long',year:'numeric'})
  const firstDow = new Date(calYear,calMonth,1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear,calMonth+1,0).getDate()
  const todayStr = localDateStr(new Date())
  const weightOpts = selectedEx ? getWeightOptions(selectedEx) : LIGHT_WEIGHTS
  const exType = EXERCISE_TYPE[selectedEx] || 'light'
  const isFav = favorites.includes(selectedEx)

  // kg/lbs helpers
  const kgToDisplay = (kg) => num(dispW(kg))
  // Set as a short chip: "100×5", "12 повт", "60s×10кг"
  const setChip = (s) => s.time_sec>0 ? (s.weight>0 ? `${s.time_sec}s×${kgToDisplay(s.weight)}${wUnit}` : `${s.time_sec}s`) : (s.weight>0 ? `${kgToDisplay(s.weight)}×${s.reps}` : `${s.reps} ${t('повт')}`)
  const wUnit = settings.units === 'lbs' ? 'lbs' : t('кг')
  // "100 кг × 5 (≈117 кг)", "12 повт", "90 сек"
  const fmtRecordSet = (metric, s, value) => metric === 'time' ? `${s.time_sec} ${t('сек')}`
    : metric === 'reps' ? `${s.reps} ${t('повт')}${s.weight > 0 ? ` +${kgToDisplay(s.weight)} ${wUnit}` : ''}`
    : `${kgToDisplay(s.weight)} ${wUnit} × ${s.reps}${s.reps > 1 ? ` (≈${kgToDisplay(Math.round(value))} ${wUnit})` : ''}`

  // Theme helpers
  const isDark = settings.theme !== 'light'
  const thm = {
    card: isDark ? '#1c1c1e' : '#ffffff',
    card2: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    input: isDark ? '#2c2c2e' : '#f2f2f7',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    border2: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: isDark ? '#ffffff' : '#1c1c1e',
    text85: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
    text70: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    text50: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    text45: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
    text40: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    text35: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
    text30: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    text28: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)',
    text25: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
    btnBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    btnBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    headerBg: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(242,242,247,0.92)',
    modalBg: isDark ? '#1c1c1e' : '#ffffff',
    overlayCard: isDark ? '#1c1c1e' : '#ffffff',
  }

  // Loading state
  if (user === undefined) return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:120,height:120,borderRadius:28,overflow:'hidden',border:'2px solid rgba(255,255,255,0.08)'}}>
        <img src="/images/gymbro_logo.webp" alt="Gym BRO" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      </div>
      <div style={{fontSize:24,fontWeight:700,color:'#fff',marginTop:16,letterSpacing:1}}>Gym BRO</div>
    </div>
  )

  // Auth screen
  if (user === null) return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/images/gymbro_icon.png" alt="logo" className="auth-logo" onError={e=>{e.target.style.display='none'}}/>
        <div className="auth-title">Gym BRO</div>
        <div className="auth-sub">{authMode==='login' ? t('Войди в свой аккаунт') : t('Создай новый аккаунт')}</div>
        {authError && <div className="auth-err">{authError}</div>}
        <div className="auth-inp-lbl">Email</div>
        <input className="auth-inp" type="email" placeholder={t('твой@email.com')} value={authEmail}
          onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAuth()}/>
        <div className="auth-inp-lbl">{t('Пароль')}</div>
        <input className="auth-inp" type="password" placeholder={t('минимум 6 символов')} value={authPassword}
          onChange={e=>setAuthPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAuth()}/>
        <button className="auth-btn" onClick={handleAuth} disabled={authLoading || !authEmail || !authPassword}>
          {authLoading ? '...' : authMode==='login' ? t('Войти') : t('Зарегистрироваться')}
        </button>
        <div className="auth-switch">
          {authMode==='login' ? t('Нет аккаунта?') : t('Уже есть аккаунт?')}
          <button onClick={()=>{setAuthMode(m=>m==='login'?'register':'login');setAuthError('')}}>
            {authMode==='login' ? t('Регистрация') : t('Войти')}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app" data-theme={settings.theme}>
      {showOnboard && (
        <div className="onboard-overlay">
          <div className="onboard-card">
            <span className="onboard-emoji">💪</span>
            <div className="onboard-title">Gym BRO</div>
            <div className="onboard-sub">{t('Твой личный дневник тренировок. Записывай подходы, следи за прогрессом, бей рекорды.')}</div>
            <div className="onboard-features">
              {[['📝',t('Записывай тренировки за секунды')],['📈',t('Следи за личными рекордами')],['🔥',t('Не теряй серию тренировок')],['📅',t('Смотри историю в календаре')]].map(([icon,text]) => (
                <div key={text} className="onboard-feature"><span style={{fontSize:20,width:36,textAlign:'center'}}>{icon}</span><span>{text}</span></div>
              ))}
            </div>
            <button className="onboard-btn" onClick={() => { if(user) localStorage.setItem('gbOnboarded_'+user.id,'1'); setShowOnboard(false) }}>{t('Начать тренироваться 🚀')}</button>
          </div>
        </div>
      )}

      <div className="header">
        <div className="header-left">
          <img src="/images/gymbro_icon.png" alt="logo" className="header-logo" onError={e=>e.target.style.display='none'}/>
          <h1>Gym BRO</h1>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={() => setShowWeightModal(true)} aria-label={t('Вес тела')} style={{
            background: showWeightModal ? 'rgba(var(--accent-rgb),0.08)' : thm.btnBg,
            border: showWeightModal ? '1.5px solid var(--accent)' : `1px solid ${thm.btnBorder}`,
            borderRadius:10,padding:'0',width:36,height:36,cursor:'pointer',color:thm.text70,
            fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
          }}>🧍</button>
          <button onClick={() => { const isOpen=timerSecs!==null||stopwatchRunning||timerMode==='stopwatch'; if(isOpen){setTimerSecs(null);setTimerPaused(false);setStopwatchRunning(false);setStopwatchSecs(0);setTimerMode('countdown')}else{setTimerSecs(timerDuration);setTimerPaused(true)} }} style={{
            background: (timerSecs!==null||stopwatchRunning||timerMode==='stopwatch') ? 'rgba(var(--accent-rgb),0.08)' : thm.btnBg,
            border: (timerSecs!==null||stopwatchRunning||timerMode==='stopwatch') ? '1.5px solid var(--accent)' : `1px solid ${thm.btnBorder}`,
            borderRadius:10,padding:'0',width:36,height:36,cursor:'pointer',
            color: (timerSecs!==null||stopwatchRunning||timerMode==='stopwatch') ? 'rgba(255,255,255,0.8)' : thm.text70,
            fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
          }}>⏱</button>
          {(streak >= 1 || achievements) && <button onClick={openStreakModal} aria-label={t('Достижения')} style={{position:'relative',
            background:'rgba(var(--accent-rgb),0.12)',border:'1px solid rgba(var(--accent-rgb),0.3)',
            borderRadius:10,padding:'0 10px',height:36,cursor:'pointer',gap:3,
            fontSize:14,fontWeight:800,color:'var(--accent)',display:'flex',alignItems:'center',flexShrink:0,whiteSpace:'nowrap'
          }}>{streak >= 1 ? <>{streak}<Flame size={17}/></> : '🏅'}{achUnviewed && <span style={{position:'absolute',top:-3,right:-3,width:9,height:9,borderRadius:'50%',background:'var(--accent)',border:'2px solid #000'}}/>}</button>}
          <button onClick={() => setTab(t => t === 'settings' ? 'add' : 'settings')} style={{
            background: tab==='settings' ? 'rgba(var(--accent-rgb),0.08)' : thm.btnBg,
            border: tab==='settings' ? '1.5px solid var(--accent)' : `1px solid ${thm.btnBorder}`,
            borderRadius:10,padding:'0',width:36,height:36,cursor:'pointer',
            color: tab==='settings' ? 'rgba(255,255,255,0.8)' : thm.text50,fontSize:18,
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
          }}>⚙️</button>
        </div>
      </div>
      {showWarmup && (
        <WarmupModal onClose={() => setShowWarmup(false)} onComplete={() => logRoutine('w')}/>
      )}
      {showStretch && (
        <StretchModal onClose={() => setShowStretch(false)} onComplete={() => logRoutine('s')}/>
      )}
      {showWeightModal && (
        <WeightModal entries={bodyWeights} status={weightsStatus} onAdd={addWeighIn} onDelete={deleteWeighIn} onClose={() => setShowWeightModal(false)}/>
      )}

      {tab === 'add' && (
        <div className="section">

          {(timerSecs !== null || stopwatchRunning || timerMode === 'stopwatch') && (
            <div style={{background: timerMode==='stopwatch' ? 'linear-gradient(135deg,rgba(var(--accent-rgb),0.1),rgba(var(--accent-rgb),0.05))' : 'linear-gradient(135deg,rgba(var(--accent-rgb),0.1),rgba(var(--accent-rgb),0.05))',border: timerMode==='stopwatch' ? '1px solid rgba(var(--accent-rgb),0.2)' : '1px solid rgba(var(--accent-rgb),0.2)',borderRadius:20,padding:'16px 18px',marginBottom:16}}>
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <button onClick={()=>{setTimerMode('countdown');setStopwatchRunning(false);setStopwatchSecs(0);if(timerSecs===null){setTimerSecs(timerDuration);setTimerPaused(true)}}} style={{flex:1,padding:'7px 0',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,background:timerMode==='countdown'?'rgba(var(--accent-rgb),0.2)':'rgba(255,255,255,0.06)',color:timerMode==='countdown'?'var(--accent)':'rgba(255,255,255,0.4)'}}>{t('⏱ Таймер')}</button>
                <button onClick={()=>{setTimerMode('stopwatch');setTimerSecs(null);setTimerPaused(false)}} style={{flex:1,padding:'7px 0',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,background:timerMode==='stopwatch'?'rgba(var(--accent-rgb),0.2)':'rgba(255,255,255,0.06)',color:timerMode==='stopwatch'?'var(--accent)':'rgba(255,255,255,0.4)'}}>{t('⏲ Секундомер')}</button>
                <button onClick={()=>{setTimerSecs(null);setTimerPaused(false);setStopwatchRunning(false);setStopwatchSecs(0);setTimerMode('countdown')}} style={{width:32,height:32,borderRadius:10,border:'none',cursor:'pointer',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.35)',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
              </div>
              {/* Both modes are stacked in one grid cell so the panel keeps the same height when switching */}
              <div style={{display:'grid'}}>
              <div className={timerMode==='countdown'?undefined:'tm-hidden'} style={{gridArea:'1/1',visibility:timerMode==='countdown'?'visible':'hidden'}} aria-hidden={timerMode!=='countdown'}>
                <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:12}}>
                  <span style={{fontSize:48,fontWeight:800,color:timerPaused?'rgba(var(--accent-rgb),0.55)':'var(--accent)',fontVariantNumeric:'tabular-nums',letterSpacing:'-2px'}}>
                    {`${Math.floor((timerSecs||0)/60)}:${String((timerSecs||0)%60).padStart(2,'0')}`}
                  </span>
                  {timerPaused && <span style={{fontSize:13,color:'rgba(var(--accent-rgb),0.5)',fontWeight:600}}>{t('пауза')}</span>}
                </div>
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  <button onClick={()=>setTimerPaused(p=>!p)} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:timerPaused?'var(--accent)':'rgba(var(--accent-rgb),0.15)',color:timerPaused?'#000':'var(--accent)'}}>
                    {timerPaused ? t('▶ Продолжить') : t('⏸ Пауза')}
                  </button>
                  <button onClick={()=>{setTimerSecs(timerDuration);setTimerPaused(true)}} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)'}}>{t('↺ Заново')}</button>

                </div>
                <div style={{fontSize:11,opacity:0.35,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>{t('Изменить время')}</div>
                <DropdownPicker options={Array.from({length:50},(_,i)=>(i+1)*5)} value={timerDuration} onChange={v=>{setTimerDuration(v);setTimerSecs(v);setTimerPaused(true)}} unit={t('сек')} label=""/>
              </div>
              <div className={timerMode==='stopwatch'?undefined:'tm-hidden'} style={{gridArea:'1/1',visibility:timerMode==='stopwatch'?'visible':'hidden'}} aria-hidden={timerMode!=='stopwatch'}>
                <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:12}}>
                  <span style={{fontSize:48,fontWeight:800,color:stopwatchRunning?'var(--accent)':'rgba(255,255,255,0.85)',fontVariantNumeric:'tabular-nums',letterSpacing:'-2px'}}>
                    {`${Math.floor(stopwatchSecs/60)}:${String(stopwatchSecs%60).padStart(2,'0')}`}
                  </span>
                </div>
                <div style={{display:'flex',gap:8,marginBottom:4}}>
                  <button onClick={()=>setStopwatchRunning(r=>!r)} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:stopwatchRunning?'rgba(255,59,48,0.15)':'var(--accent)',color:stopwatchRunning?'#FF453A':'#000'}}>
                    {stopwatchRunning ? t('⏸ Пауза') : t('▶ Старт')}
                  </button>
                  <button onClick={()=>{setStopwatchSecs(0);setStopwatchRunning(false)}} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)'}}>{t('↺ Сброс')}</button>

                </div>
              </div>
              </div>
            </div>
          )}

          {!workoutStarted ? (() => {
            // Start screen: date, glowing round button and which workout of the month this will be
            const todayStr = localDateStr(new Date())
            const trainedToday = (allRows || []).some(w => w.workout_date === todayStr)
            const RU_MONTH_IN = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре']
            const monthIn = isEn() ? new Date().toLocaleDateString('en-US', { month: 'long' }) : RU_MONTH_IN[new Date().getMonth()]
            const resume = workoutExercises.length > 0
            const hint = resume ? t('Тренировка не сохранена — продолжи')
              : trainedToday ? t('Сегодня уже была тренировка — можно добавить ещё')
              : t('Это будет {n}-я тренировка в {month}', { n: streak + 1, month: monthIn })
            const press = (e, v) => { e.currentTarget.style.filter = v < 1 ? 'brightness(0.88)' : '' }
            return (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,paddingTop:'14vh',paddingBottom:40,gap:36}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:13,color:thm.text50,fontWeight:600,textTransform:'uppercase',letterSpacing:'2px'}}>
                  {new Date().toLocaleDateString(locale(),{weekday:'long',day:'numeric',month:'long'})}
                </div>
                <div style={{fontSize:30,fontWeight:800,color:thm.text,letterSpacing:'-0.5px',marginTop:10}}>{resume ? t('Продолжим?') : t('Время тренироваться')}</div>
              </div>
              <style>{`
                /* soft filled waves rolling out from the button + a slow "breathing" glow on the button itself */
                @keyframes start-wave{0%{transform:scale(0.72);opacity:0.5}100%{transform:scale(1.35);opacity:0}}
                @keyframes start-breathe{0%,100%{transform:scale(1);box-shadow:0 0 36px rgba(var(--accent-rgb),0.35),0 0 0 0 rgba(var(--accent-rgb),0.25)}50%{transform:scale(1.035);box-shadow:0 0 64px rgba(var(--accent-rgb),0.6),0 0 0 10px rgba(var(--accent-rgb),0.08)}}
                @keyframes start-halo{0%,100%{opacity:0.7}50%{opacity:1}}
                .start-pulse{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(var(--accent-rgb),0) 52%,rgba(var(--accent-rgb),0.28) 66%,rgba(var(--accent-rgb),0) 72%);animation:start-wave 3.6s cubic-bezier(0.22,0.61,0.36,1) infinite;pointer-events:none}
                .start-pulse.p2{animation-delay:1.2s}
                .start-pulse.p3{animation-delay:2.4s}
                .start-halo{animation:start-halo 3.6s ease-in-out infinite}
                .start-btn{animation:start-breathe 3.6s ease-in-out infinite}
                .start-btn:active{animation-play-state:paused}
                @media (prefers-reduced-motion: reduce){.start-pulse,.start-btn,.start-halo{animation:none}}
              `}</style>
              <div style={{position:'relative',width:232,height:232,borderRadius:'50%',background:'rgba(var(--accent-rgb),0.07)',border:'1px solid rgba(var(--accent-rgb),0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div className="start-pulse"/>
                <div className="start-pulse p2"/>
                <div className="start-pulse p3"/>
                <div className="start-halo" style={{position:'relative',zIndex:1,width:196,height:196,borderRadius:'50%',background:'rgba(var(--accent-rgb),0.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <button className="start-btn" onClick={()=>{ if (!workoutExercises.length) setWorkoutDate(localDateStr(new Date())); setWorkoutStarted(true) }}
                    onMouseDown={e=>press(e,0.95)} onMouseUp={e=>press(e,1)} onMouseLeave={e=>press(e,1)}
                    onTouchStart={e=>press(e,0.95)} onTouchEnd={e=>press(e,1)}
                    style={{width:164,height:164,borderRadius:'50%',border:'none',cursor:'pointer',background:'var(--accent)',color:'#000',
                      fontSize:resume?16:20,fontWeight:900,letterSpacing:'3px',boxShadow:'0 0 48px rgba(var(--accent-rgb),0.45)',transition:'filter 0.15s'}}>
                    {resume ? t('ПРОДОЛЖИТЬ') : t('НАЧАТЬ')}
                  </button>
                </div>
              </div>
              <div style={{fontSize:14,color:thm.text50,textAlign:'center',maxWidth:300,lineHeight:1.4}}>{hint}</div>
              {!resume && activePlans[0] && <TodayPlanCard plan={activePlans[0]} thm={thm} onStart={loadPlanDay} onOpen={()=>setShowPlanModal('my')}/>}
            </div>
            )
          })() : (
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <button onClick={()=>{setWorkoutStarted(false);setSaved(false)}} className="back-btn">{t('← Назад')}</button>
                {/* Дата тренировки — тап открывает выбор даты */}
                <label style={{position:'relative',fontSize:13,color:thm.text70,fontWeight:600,padding:'6px 10px',borderRadius:10,background:thm.btnBg,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                  📅 {new Date(workoutDate+'T12:00:00').toLocaleDateString(locale(),{day:'numeric',month:'long'})}
                  <span style={{fontSize:11,opacity:0.6}}>▾</span>
                  <input type="date" value={workoutDate} max={localDateStr(new Date())} onChange={e=>e.target.value && setWorkoutDate(e.target.value)}
                    aria-label={t('Дата тренировки')}
                    style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0,cursor:'pointer',colorScheme:'dark'}}/>
                </label>
              </div>
              {workoutExercises.map((ex, exIdx) => {
                const isOpen = ex.open
                const exType2 = EXERCISE_TYPE[ex.name] || 'light'
                const wOpts = getWeightOptions(ex.name)
                const rec = exRecordInfo(ex)
                const beats = rec.pr ? rec.stored.map(st => setValue(st, rec.metric) > rec.pr.value + 1e-6) : []
                return (
                  <div key={exIdx} style={{background:thm.card2,borderRadius:16,border:`1px solid ${thm.border}`,marginBottom:10}}>
                    <button onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i===exIdx?{...e,open:!e.open}:e))}
                      style={{width:'100%',background:'none',border:'none',padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',textAlign:'left'}}>
                      {getExImage(ex.name)
                        ? <img src={getExImage(ex.name)} alt={ex.name} loading="lazy" decoding="async" style={{width:36,height:36,borderRadius:8,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
                        : <div style={{width:36,height:36,borderRadius:8,background:thm.btnBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>🏋️</div>
                      }
                      <div style={{flex:1}}>
                        <span style={{fontSize:15,fontWeight:700,color:thm.text85}}>{exName(ex.name)}</span>
                        {ex.grip && ex.grip !== getDefaultVariant(ex.name) && <span style={{fontSize:11,color:'rgba(var(--accent-rgb),0.8)',marginLeft:6,fontWeight:600}}>({ex.grip})</span>}
                      </div>
                      <span style={{fontSize:12,color:thm.text30,marginRight:4}}>{ex.sets.filter(s=>exType2==='timed'?s.weight>0:isRepsType(exType2)?s.reps>0:(s.weight>0&&s.reps>0)).length} {t('подх.')}</span>
                      <button onClick={e=>{e.stopPropagation();setWorkoutExercises(prev=>prev.filter((_,i)=>i!==exIdx))}}
                        style={{background:'rgba(255,59,48,0.1)',border:'none',borderRadius:8,padding:'4px 8px',color:'#FF453A',cursor:'pointer',fontSize:12,fontWeight:700,marginRight:4}}>✕</button>
                      <span style={{color:thm.text40,fontSize:20,display:'inline-block',transform:isOpen?'rotate(180deg)':'none',transition:'transform 0.2s',padding:'2px 8px',minWidth:32,textAlign:'center'}}>▼</span>
                    </button>
                    {isOpen && (
                      <div style={{padding:'0 14px 14px'}}>
                        {ex.target && (() => {
                          const doneN = ex.sets.filter(s=>exType2==='timed'?s.weight>0:isRepsType(exType2)?s.reps>0:(s.weight>0&&s.reps>0)).length
                          const reached = doneN >= ex.target.sets
                          return (
                            <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,marginBottom:10,padding:'8px 10px',borderRadius:10,background:'rgba(var(--accent-rgb),0.1)',border:'1px solid rgba(var(--accent-rgb),0.25)'}}>
                              <span>🎯</span>
                              <span style={{flex:1,color:thm.text85,fontWeight:600}}>{t('Цель')}: {ex.target.sets}×{ex.target.reps || t('макс')}{ex.target.weight > 0 && exType2 !== 'timed' ? ` · ${fmtW(ex.target.weight)}` : ''}</span>
                              <span style={{fontWeight:800,color:reached?'#30D158':'var(--accent)'}}>{reached ? '✓ ' : ''}{doneN}/{ex.target.sets}</span>
                            </div>
                          )
                        })()}
                        {ex.lastSession && (
                          <div style={{fontSize:12,color:thm.text35,marginBottom:10,padding:'7px 10px',background:thm.card2,borderRadius:8}}>
                            💡 {t('Прошлый раз:')} {ex.lastSession.sets?.sort((a,b)=>a.set_no-b.set_no).slice(-3).map(setChip).join(' · ')}
                          </div>
                        )}
                        {rec.pr && (
                          <div style={{fontSize:12,color:thm.text35,marginTop:ex.lastSession?-4:0,marginBottom:10,padding:'0 10px'}}>
                            🏆 {t('Рекорд:')} {fmtRecordSet(rec.metric, rec.pr, rec.pr.value)}
                          </div>
                        )}
                        {ex.grip !== null && ex.grip !== undefined && (
                          <div style={{marginBottom:12}}>
                            <div style={{fontSize:11,opacity:0.4,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>{VARIANT_EXERCISES.has(ex.name) ? t('Вариация') : t('Хват')}</div>
                            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                              {getVariantOptions(ex.name).map(g => (
                                <button key={g} onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,grip:g}))}
                                  style={{padding:'5px 12px',borderRadius:99,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',
                                    background: ex.grip===g ? 'var(--accent)' : thm.btnBg,
                                    color: ex.grip===g ? '#000' : 'rgba(255,255,255,0.6)'}}>
                                  {variantName(g)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {(() => {
                          const workingWeight = ex.sets[0]?.weight || 0
                          const warmups = exType2 === 'timed' ? [] : getWarmupSets(ex.name, workingWeight)
                          return (
                            <>
                              {ex.sets.map((s,si) => (
                                <div key={si} className="set-row">
                                  {beats[si]
                                    ? <span className="set-num" title={t('Новый рекорд')} style={{opacity:1,fontSize:14}}>🏆</span>
                                    : <span className="set-num">{si+1}</span>}
                                  {exType2 === 'timed' ? (
                                    <>
                                      <DropdownPicker options={TIME_OPTIONS} value={s.weight} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,weight:v})}))} unit="s" label={t('Подход {n}',{n:si+1})}/>
                                      <span className="set-sep">×</span>
                                      <div style={{display:'flex',flexDirection:'column',flex:1}}>
                                        <div className="dpicker-label">{t('Вес')} ({wUnit})</div>
                                        <div style={{display:'flex',alignItems:'center',gap:6,height:51}}>
                                          <button onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,timedWeight:Math.max(0,toKg(dispW(ss.timedWeight||0)-5))})}))} style={{width:40,height:40,borderRadius:10,border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>−</button>
                                          <span style={{flex:1,textAlign:'center',fontSize:17,fontWeight:600,color:(s.timedWeight||0)>0?'#fff':'rgba(255,255,255,0.3)'}}>{num(dispW(s.timedWeight||0))}</span>
                                          <button onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,timedWeight:toKg(dispW(ss.timedWeight||0)+5)})}))} style={{width:40,height:40,borderRadius:10,border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
                                        </div>
                                      </div>
                                    </>
                                  ) : exType2 === 'bodyweight' ? (
                                    <DropdownPicker options={REPS_OPTIONS} value={s.reps} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,weight:0,reps:v})}))} unit={t('повт')} label={t('Подход {n} — Повт',{n:si+1})}/>
                                  ) : (
                                    <>
                                      <DropdownPicker options={weightOptions(wOpts)} value={dispW(s.weight)} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,weight:toKg(v)})}))} unit={wUnit} label={exType2==='bodyweight_plus' ? t('Подход {n} — +вес',{n:si+1}) : t('Подход {n} — Вес',{n:si+1})}/>
                                      <span className="set-sep">×</span>
                                      <DropdownPicker options={REPS_OPTIONS} value={s.reps} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,reps:v})}))} unit={t('повт')} label={t('Подход {n} — Повт',{n:si+1})}/>
                                    </>
                                  )}
                                </div>
                              ))}
                              <div className="set-btns" style={{marginTop:4}}>
                                <button className="set-btn" onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:[...e.sets,{weight:e.sets[e.sets.length-1]?.weight||0,reps:e.sets[e.sets.length-1]?.reps||0,timedWeight:e.sets[e.sets.length-1]?.timedWeight||0}]}))}>{t('➕ Подход')}</button>
                                <button className="set-btn" onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.length>1?e.sets.slice(0,-1):e.sets}))} style={{opacity:ex.sets.length<=1?0.35:1}}>{t('➖ Убрать')}</button>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
              {workoutExercises.length > 0
                ? <ActionCard thm={thm} icon="＋" title={t('Добавить упражнение')} sub={t('Выбрать вручную')} onClick={()=>setShowExModal(true)}/>
                : <WorkoutHome thm={thm} allRows={allRows} favorites={favorites} activePlans={activePlans}
                    onRepeat={repeatWorkout} onAdd={addExToWorkout} onOpenAll={()=>setShowExModal(true)}
                    onOpenPlans={v=>setShowPlanModal(v)} onStartPlanDay={loadPlanDay}
                    onWarmup={()=>setShowWarmup(true)} onStretch={()=>setShowStretch(true)}/>}
              {workoutExercises.length > 0 && (
                <button className={`save-btn${saved?' done':''}`} onClick={saveWorkout} disabled={saving || saved}>
                  {saved ? t('✅ Сохранено!') : saving ? t('⏳ Сохранение...') : t('💾 Сохранить тренировку ({n} упр.)',{n:workoutExercises.length})}
                </button>
              )}
              {workoutExercises.length > 0 && (
                <div style={{display:'flex',gap:8,marginTop:10}}>
                  {[['🤸',t('Разминка'),()=>setShowWarmup(true)],['🧘',t('Растяжка'),()=>setShowStretch(true)]].map(([icon,label,fn])=>(
                    <button key={label} onClick={fn} style={{flex:1,padding:'10px 12px',borderRadius:12,border:`1px solid ${thm.border}`,background:'transparent',color:thm.text50,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                      <span style={{fontSize:15}}>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <HistoryView history={history} allRows={allRows} month={historyMonth} setMonth={setHistoryMonth} year={historyYear} setYear={setHistoryYear}
          openDays={openDays} setOpenDays={setOpenDays} copiedDay={copiedDay} onCopy={copyDay}
          onEdit={(date, ws) => setEditModal({ date, workouts: ws.map(w => ({ ...w, sets: w.sets ? [...w.sets] : [] })) })}
          onDeleteDay={deleteDay} onDeleteExercise={deleteWorkout} setChip={setChip} thm={thm} isDark={isDark}/>
      )}

      {tab === 'progress' && (() => {
        // Compute muscle scores
        const daysAgoDate = localDateStr(new Date(Date.now() - musclePeriod*24*60*60*1000))
        const recentHistory = history.filter(w => w.workout_date >= daysAgoDate)
        const muscleScores = calcAnatomyLoad(recentHistory, musclePeriod)
        return (
        <div className="section">
          {stats && (
            <div className="stats-row">
              <div className="stat-card"><div className="stat-val">{stats.monthW}</div><div className="stat-lbl">{new Date().toLocaleDateString(locale(),{month:'long'})}</div></div>
              <div className="stat-card"><div className="stat-val">{stats.totalW}</div><div className="stat-lbl">{t('всего')}</div></div>
              <div className="stat-card"><div className="stat-val" style={{color:'var(--accent)',fontSize:18}}>{fmtVolume(stats.monthKg)}</div><div className="stat-lbl">{t('поднято за месяц')}</div></div>
            </div>
          )}
          <div className="prog-title">{t('💪 Нагрузка по мышцам')}</div>
          <div className="chart-wrap" style={{padding:'16px 8px'}}>
            <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:14}}>
              {[[7,t('7 дней')],[30,t('30 дней')]].map(([days,label]) => (
                <button key={days} onClick={()=>setMusclePeriod(days)} style={{
                  padding:'6px 18px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
                  background: musclePeriod===days ? 'var(--accent)' : (isDark ? '#2c2c2e' : '#e5e5ea'),
                  color: musclePeriod===days ? '#000' : thm.text50,
                }}>{label}</button>
              ))}
            </div>
            <MuscleMap muscleScores={muscleScores} period={musclePeriod}/>
            <div style={{display:'flex',justifyContent:'center',gap:14,marginTop:12}}>
              {[['#3A3A3C',t('Нет')],['#FFD60A',t('Мало')],['#9EDB3F',t('Норма')],['#30D158',t('Отлично')],['#FF453A',t('Перегрузка')]].map(([color,label])=>(
                <div key={label} style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:10,height:10,borderRadius:3,background:color,flexShrink:0}}/>
                  <span style={{fontSize:11,color:thm.text40,fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="prog-title">{t('📅 Календарь')}</div>
          <div className="cal-nav">
            <button className="cal-btn" onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1)}}>◀</button>
            <span className="cal-mname">{calMonthName}</span>
            <button className="cal-btn" onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1)}}>▶</button>
          </div>
          <div className="cal-grid">
            {[t('Пн'),t('Вт'),t('Ср'),t('Чт'),t('Пт'),t('Сб'),t('Вс')].map(d=><div key={d} className="cal-dow">{d}</div>)}
            {Array(offset).fill(null).map((_,i)=><div key={`e${i}`} className="cal-cell empty"/>)}
            {Array(daysInMonth).fill(null).map((_,i)=>{
              const day=i+1; const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const trained=calData[day]!==undefined; const vol=calData[day]||0
              return <div key={day} className={`cal-cell${trained?' trained':''}${ds===todayStr?' today':''}`} onClick={()=>trained&&openCalDay(day)}>{day}{trained&&vol>0&&<div className="cal-vol">{(()=>{const v=isLbs()?Math.round(vol*KG_TO_LB):vol;return v>=1000?`${(v/1000).toFixed(1)}K`:v})()}</div>}</div>
            })}
          </div>
          <button onClick={()=>setOpenPrs(p=>({...p,__all__:!p.__all__}))} style={{
            width:'100%',background:thm.card2,border:`1px solid ${thm.border}`,
            borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',
            cursor:'pointer',marginBottom:4
          }}>
            <span style={{fontSize:15,fontWeight:700,color:thm.text85}}>{t('🏆 Личные рекорды')}</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,color:thm.text35}}>{prs.length} {t('упр.')}</span>
              <span style={{color:thm.text30,fontSize:12,display:'inline-block',transition:'transform 0.2s',transform:openPrs.__all__?'rotate(180deg)':'none'}}>▼</span>
            </div>
          </button>
          {openPrs.__all__ && <div style={{background:thm.card2,borderRadius:14,overflow:'hidden',border:`1px solid ${thm.border}`,marginBottom:4}}>
          {prs.map(([name,pr], prIdx)=>{
            const isOpen=openPrs[name]; const img=getExImage(name)
            return (
              <div key={name} style={{borderBottom: prIdx<prs.length-1 ? `1px solid ${thm.border2}` : 'none'}}>
                <button style={{width:'100%',background:'none',border:'none',cursor:'pointer',padding:'11px 16px',display:'flex',alignItems:'center',gap:10,textAlign:'left'}} onClick={()=>setOpenPrs(p=>({...p,[name]:!p[name]}))}>
                  {img ? <img src={img} alt={name} loading="lazy" decoding="async" style={{width:32,height:32,borderRadius:7,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/> : <div style={{width:32,height:32,borderRadius:7,background:thm.btnBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:16}}>🏋️</div>}
                  <span style={{flex:1,color:thm.text85,fontSize:14,fontWeight:600}}>{exName(normalizeName(name))}</span>
                  <span style={{color:'var(--accent)',fontSize:14,fontWeight:700,marginRight:8}}>{pr.metric==='time' ? `${pr.time_sec} ${t('сек')}` : pr.metric==='reps' ? `${pr.reps} ${t('повт')}${pr.weight>0?` +${kgToDisplay(pr.weight)}`:''}` : `${kgToDisplay(pr.weight)} × ${pr.reps}`}</span>
                  <span style={{color:thm.text25,fontSize:11,display:'inline-block',transition:'transform 0.2s',transform:isOpen?'rotate(180deg)':'none'}}>▼</span>
                </button>
                {isOpen && <div style={{padding:'2px 16px 12px 58px',display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontSize:13,color:thm.text50,fontWeight:600}}>{pr.metric==='time' ? `${pr.time_sec} ${t('сек')}${pr.weight>0?` × ${kgToDisplay(pr.weight)} ${wUnit}`:''}` : pr.metric==='reps' ? `${pr.reps} ${t('повт')}${pr.weight>0?` ${t('с доп. весом')} ${kgToDisplay(pr.weight)} ${wUnit}`:''}` : `${kgToDisplay(pr.weight)} ${wUnit} × ${pr.reps} ${t('повт')} · ${t('1ПМ')} ≈ ${kgToDisplay(Math.round(pr.value*10)/10)} ${wUnit}`}</span>
                  <span style={{fontSize:12,color:thm.text30}}>{new Date(pr.date+'T12:00:00').toLocaleDateString(locale(),{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>}
              </div>
            )
          })}
          </div>}
          <div className="prog-title">{t('📊 График роста')}</div>
          <div className="chart-wrap">
            <ChartExercisePicker names={prs.map(([name])=>name)} value={chartEx} onChange={setChartEx} theme={isDark?'dark':'light'}/>
            <LineChart data={(() => {
              // Weight exercises are always charted by estimated 1RM; the tooltip shows the real set behind it
              const byMode = chartData[0]?.metric === 'weight'
                ? chartData.map(p => ({ ...p, val: p.e1rm ?? p.val, metric: 'e1rm', bestWeight: p.e1Weight, bestReps: p.e1Reps }))
                : chartData
              const base = chartPeriod === 'ALL' ? byMode : (() => {
                const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (chartPeriod === '1M' ? 30 : 91))
                const cutoffStr = localDateStr(cutoff)
                return byMode.filter(p => p.date >= cutoffStr)
              })()
              if (settings.units === 'lbs' && (base[0]?.metric === 'weight' || base[0]?.metric === 'e1rm')) return base.map(p => ({...p, val: Math.round(p.val * 2.20462 * 10) / 10}))
              return base
            })()} period={chartPeriod} setPeriod={setChartPeriod} totalPoints={chartData.length}
              unit={chartData[0]?.metric === 'time' ? t('сек') : chartData[0]?.metric === 'reps' ? t('повт') : wUnit} dark={isDark}/>
          </div>
        </div>
        )
      })()}

      {showExModal && (
        <div className="modal-overlay" style={{paddingBottom:kbHeight}} onClick={e=>{if(e.target.classList.contains('modal-overlay')){setShowExModal(false);setModalSearch('')}}}>
          <div className="modal">
            <div className="modal-handle"/>
            <div className="modal-hdr">
              <div className="modal-title">{t('Выбери упражнение')}</div>
              <div className="modal-srch-wrap"><span className="modal-srch-icon">🔍</span><input className="modal-srch" placeholder={t('Поиск...')} value={modalSearch} onChange={e=>setModalSearch(e.target.value)}/></div>
            </div>
            <div className="modal-list">
              {!modalSearch&&favFiltered.length>0&&<><div className="modal-sect-lbl">{t('⭐ Избранные')}</div>{favFiltered.map(ex=><ModalItem key={ex.id} ex={ex} lang={settings.language} onAdd={addExToWorkout} isFav={true} onToggleFav={toggleFav}/>)}<div className="modal-sect-lbl">{t('Все упражнения')}</div></>}
              {(modalSearch?filtered:restFiltered).map(ex=><ModalItem key={ex.id} ex={ex} lang={settings.language} onAdd={addExToWorkout} isFav={favSet.has(ex.name)} onToggleFav={toggleFav}/>)}
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
                <div key={w.id} style={{padding:'12px 10px',borderRadius:12,marginBottom:6,background:thm.card2,border:`1px solid ${thm.border}`}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:7,color:thm.text}}>{normalizeName(w.exercises?.name)}</div>
                  <div className="chips">{w.sets?.sort((a,b)=>a.set_no-b.set_no).map((s,i)=><span key={i} className="chip">{setChip(s)}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editModal && <EditModal data={editModal} onClose={()=>setEditModal(null)} onSave={saveEdit}/>}

      {tab === 'settings' && (
        <div className="section">
          <div style={{fontSize:20,fontWeight:700,marginBottom:20,letterSpacing:'-0.3px'}}>{t('⚙️ Настройки')}</div>


          {/* Тренировки */}
          <div className="settings-card">
            <div className="settings-section-title">{t('🏋️ Тренировки')}</div>
            <div className="settings-row">
              <div className="settings-row-label">{t('Единицы веса')}</div>
              <div className="settings-toggle">
                {['kg','lbs'].map(u=>(
                  <button key={u} className={`settings-toggle-btn${settings.units===u?' active':''}`}
                    onClick={()=>saveSettings({...settings,units:u})}>{u}</button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">{t('Пол (для разрядов)')}</div>
              <div className="settings-toggle">
                {[['male',t('Муж')],['female',t('Жен')]].map(([v,l])=>(
                  <button key={v} className={`settings-toggle-btn${(settings.sex||'male')===v?' active':''}`}
                    onClick={()=>saveSettings({...settings,sex:v})}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Внешний вид */}
          <div className="settings-card">
            <div className="settings-section-title">{t('🎨 Внешний вид')}</div>
            <div className="settings-row" style={{marginBottom:14}}>
              <div className="settings-row-label">{t('Тема')}</div>
              <div className="settings-toggle">
                {[['dark',t('🌙 Тёмная')],['light',t('☀️ Светлая')]].map(([val,label])=>(
                  <button key={val} className={`settings-toggle-btn${settings.theme===val?' active':''}`}
                    onClick={()=>saveSettings({...settings,theme:val})}>{label}</button>
                ))}
              </div>
            </div>
            <div className="settings-row" style={{marginBottom:14}}>
              <div className="settings-row-label">{t('Цвет')}</div>
              <div style={{display:'flex',gap:10}}>
                {ACCENTS.map(a => {
                  const on = (settings.accent || 'orange') === a.id
                  return (
                    <button key={a.id} aria-label={t(a.name)} title={t(a.name)} aria-pressed={on}
                      onClick={()=>saveSettings({...settings,accent:a.id})}
                      style={{width:30,height:30,borderRadius:'50%',background:a.hex,cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center',
                        border:'none',boxShadow:on?`0 0 0 2px ${isDark?'#1c1c1e':'#fff'}, 0 0 0 4px ${a.hex}`:'none',transition:'box-shadow 0.15s'}}>
                      {on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">{t('Язык')}</div>
              <div className="settings-toggle">
                {[['ru','RU'],['en','EN']].map(([val,label])=>(
                  <button key={val} className={`settings-toggle-btn${settings.language===val?' active':''}`}
                    onClick={()=>saveSettings({...settings,language:val})}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Данные */}
          <div className="settings-card">
            <div className="settings-section-title">{t('💾 Данные')}</div>
            <button className="settings-action-btn" onClick={()=>setShowExportModal(true)}>
              <span>📤</span> {t('Экспорт тренировок')}
            </button>
            <button className="settings-action-btn danger" onClick={()=>setShowClearConfirm(true)}>
              <span>🗑</span> {t('Очистить историю')}
            </button>
          </div>

          {/* Аккаунт */}
          <div className="settings-card">
            <div className="settings-section-title">{t('👤 Аккаунт')}</div>
            <div style={{fontSize:13,color:thm.text40,marginBottom:16,padding:'10px 12px',background:thm.card2,borderRadius:10}}>
              📧 {user?.email}
            </div>
            <button className="settings-signout-btn" onClick={handleSignOut}>
              {t('Выйти из аккаунта')}
            </button>
          </div>
        </div>
      )}

      {/* Exercises Tab */}
      {tab === 'exercises' && (() => {
        const allExNames = Object.keys(EXERCISE_IMAGES)
        const filtered = allExNames.filter(name => {
          const primaryMuscles = EXERCISE_MUSCLES[name]?.primary || []
          if (exTabFilter === 'favorites') return favorites.includes(name) && (name.toLowerCase().includes(exTabSearch.toLowerCase()) || exName(name).toLowerCase().includes(exTabSearch.toLowerCase()))
          const matchesFilter = exTabFilter === 'all' || (MUSCLE_FILTER_MAP[exTabFilter] || []).some(m => primaryMuscles.includes(m))
          const matchesSearch = name.toLowerCase().includes(exTabSearch.toLowerCase()) || exName(name).toLowerCase().includes(exTabSearch.toLowerCase())
          return matchesFilter && matchesSearch
        }).sort((a,b) => {
            const ea = exIndex.get(a), eb = exIndex.get(b)
            if (exTabSort === 'freq') return (eb?.count || 0) - (ea?.count || 0) || exName(a).localeCompare(exName(b))
            // «давно»: done exercises from the longest ago, never-done ones at the end
            if (exTabSort === 'old') return (!ea) - (!eb) || (ea && eb ? ea.last.localeCompare(eb.last) : 0) || exName(a).localeCompare(exName(b))
            return exName(a).localeCompare(exName(b))
          })
        return (
          <div className="section" style={{paddingTop:16}}>
            <div style={{position:'relative',marginBottom:0}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:16,opacity:0.35,pointerEvents:'none'}}>🔍</span>
              <input className="ex-tab-search" placeholder={t('Поиск упражнения...')} value={exTabSearch}
                onChange={e=>setExTabSearch(e.target.value)} style={{color:thm.text,background:thm.input}}/>
            </div>
            <div className="muscle-filters">
              <div className="muscle-filters-fav-row">
                <button className={`muscle-chip-fav${exTabFilter==='favorites'?' active':''}`}
                  style={exTabFilter!=='favorites'?{background:thm.btnBg,color:thm.text50,border:`1px solid ${thm.border}`}:{border:'none'}}
                  onClick={()=>setExTabFilter('favorites')}>{t('⭐ Избранные')}</button>
              </div>
              <div className="muscle-filters-divider"/>
              <div className="muscle-filters-row">
                {MUSCLE_FILTERS_ROW1.map(f => (
                  <button key={f.id} className={`muscle-chip${exTabFilter===f.id?' active':''}`}
                    style={exTabFilter!==f.id?{background:thm.btnBg,color:thm.text50,border:`1px solid ${thm.border}`}:{border:'none'}}
                    onClick={()=>setExTabFilter(f.id)}>{t(f.label)}</button>
                ))}
              </div>
              <div className="muscle-filters-row">
                {MUSCLE_FILTERS_ROW2.map(f => (
                  <button key={f.id} className={`muscle-chip${exTabFilter===f.id?' active':''}`}
                    style={exTabFilter!==f.id?{background:thm.btnBg,color:thm.text50,border:`1px solid ${thm.border}`}:{border:'none'}}
                    onClick={()=>setExTabFilter(f.id)}>{t(f.label)}</button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'-4px 2px 10px'}}>
              <span style={{fontSize:12,color:thm.text40}}>{filtered.length} {plural(filtered.length,['упражнение','упражнения','упражнений'],['exercise','exercises'])}</span>
              <div style={{display:'flex',gap:2,padding:2,borderRadius:10,background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'}}>
                {[['az',t('А–Я')],['freq',t('Частые')],['old',t('Давно')]].map(([id,label]) => (
                  <button key={id} onClick={()=>setExTabSort(id)} style={{padding:'4px 10px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                    background:exTabSort===id?(isDark?'#3a3a3c':'#fff'):'transparent',color:exTabSort===id?thm.text:thm.text50}}>{label}</button>
                ))}
              </div>
            </div>
            {filtered.length === 0 && (
              <div style={{textAlign:'center',color:thm.text40,fontSize:14,padding:'40px 0'}}>{exTabFilter==='favorites'?t('Нет избранных упражнений'):t('Ничего не найдено')}</div>
            )}
            {filtered.map(name => {
              const img = EXERCISE_IMAGES[name]
              const exMuscles = EXERCISE_MUSCLES[name]
              const primaryMuscles = exMuscles?.primary || []
              const secondaryMuscles = exMuscles?.secondary || []
              const isFav = favorites.includes(name)
              return (
                <div key={name} className="ex-list-item" style={{background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)',border:`1px solid ${thm.border}`}}
                  onClick={()=>setExDetailModal(name)}>
                  {img
                    ? <img src={img} alt={name} className="ex-list-img" loading="lazy" decoding="async" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>
                    : null}
                  <div className="ex-list-ph" style={{display: img ? 'none' : 'flex'}}>💪</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="ex-list-name" style={{color:thm.text}}>{exName(name)}</div>
                    <div style={{fontSize:12,marginTop:2}}>
                      <span style={{color:thm.text60}}>{primaryMuscles.slice(0,2).map(m=>muscleLabel(m, MUSCLE_LABELS[m]||m)).join(' · ')}</span>
                      {secondaryMuscles.length > 0 && <span style={{color:thm.text30,fontSize:11}}>{' · '}{secondaryMuscles.slice(0,2).map(m=>muscleLabel(m, MUSCLE_LABELS[m]||m)).join(', ')}</span>}
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();toggleFav(name)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,padding:'4px 6px',flexShrink:0,lineHeight:1,color:'inherit'}}>{isFav?'⭐':'☆'}</button>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Exercise Detail Modal */}
      {exDetailModal && (() => {
        const name = exDetailModal
        const img = EXERCISE_IMAGES[name]
        const exMusclesDetail = EXERCISE_MUSCLES[name]
        const primaryMusclesDetail = exMusclesDetail?.primary || []
        const secondaryMusclesDetail = exMusclesDetail?.secondary || []
        const info = exInfo(name, EXERCISE_INFO[name])
        return (
          <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setExDetailModal(null)}}>
            <div className="modal" style={{background:thm.modalBg}}>
              <div className="modal-handle" style={{background:isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.12)'}}/>
              <div style={{padding:'14px 18px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
                <span style={{fontSize:17,fontWeight:700,color:thm.text}}>{exName(name)}</span>
                <button onClick={()=>setExDetailModal(null)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:thm.text50,lineHeight:1}}>×</button>
              </div>
              <div className="modal-body">
                {img
                  ? <img src={img} alt={name} className="ex-detail-img" loading="lazy" decoding="async" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>
                  : null}
                <div className="ex-detail-ph" style={{display: img ? 'none' : 'flex'}}>💪</div>
                <div className="ex-detail-muscles">
                  {primaryMusclesDetail.map(m => (
                    <span key={m} className="ex-detail-muscle-tag">{muscleLabel(m, MUSCLE_LABELS[m]||m)}</span>
                  ))}
                  {secondaryMusclesDetail.map(m => (
                    <span key={'s_'+m} className="ex-detail-muscle-tag-secondary">{muscleLabel(m, MUSCLE_LABELS[m]||m)}</span>
                  ))}
                </div>
                <button onClick={()=>{ addExToWorkout(name); setWorkoutStarted(true); setTab('add'); setExDetailModal(null); window.scrollTo({ top: 0 }) }}
                  style={{width:'100%',margin:'12px 0 4px',padding:'12px',borderRadius:14,border:'none',background:'var(--accent)',color:'#000',fontSize:15,fontWeight:700,cursor:'pointer'}}>
                  {workoutExercises.some(e => e.name === name) ? t('✓ Уже в тренировке — добавить ещё раз') : t('＋ Добавить в тренировку')}
                </button>
                <ExerciseStats base={name} entry={exIndex.get(name)} achievements={achievements} thm={thm} isDark={isDark}/>
                <ExerciseVariants name={name} thm={thm} isDark={isDark}/>
                {info ? (
                  <>
                    <div className="ex-detail-section">
                      <div className="ex-detail-section-lbl">{t('Описание')}</div>
                      <div className="ex-detail-text" style={{color:thm.text70}}>{info.desc}</div>
                    </div>
                    <div className="ex-detail-section">
                      <div className="ex-detail-section-lbl">{t('Польза')}</div>
                      <div className="ex-detail-text" style={{color:thm.text70}}>{info.benefit}</div>
                    </div>
                    <div className="ex-detail-section">
                      <div className="ex-detail-section-lbl" style={{color:'var(--accent)',opacity:1}}>{t('💡 Советы')}</div>
                      <div className="ex-detail-text" style={{color:thm.text70}}>{info.tips}</div>
                    </div>
                  </>
                ) : (
                  <div style={{textAlign:'center',color:thm.text40,fontSize:14,padding:'20px 0'}}>{t('Описание скоро появится')}</div>
                )}
                <ExerciseMuscleMap name={name} thm={thm}/>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Timer Modal */}
      <AchievementCelebration item={achQueue[0]} left={achQueue.length - 1} onNext={() => setAchQueue(q => q.slice(1))}/>
      {achToast && (
        <div className="alert-toast" onClick={() => setAchToast(null)} style={{borderColor:'rgba(var(--accent-rgb),0.3)',cursor:'pointer'}}>
          <div className="alert-toast-icon">🏅</div>
          <div>
            <div className="alert-toast-title">{t('У тебя уже {n} достижений!',{n:achToast})}</div>
            <div className="alert-toast-sub">{t('Загляни в 🔥 — там всё по истории тренировок')}</div>
          </div>
        </div>
      )}
      {planNotice && (
        <div className="alert-toast" onClick={() => setPlanNotice(null)} style={{borderColor:'rgba(var(--accent-rgb),0.45)',cursor:'pointer',zIndex:3000,alignItems:'flex-start'}}>
          <div className="alert-toast-icon">📈</div>
          <div style={{minWidth:0}}>
            <div className="alert-toast-title">{t('План обновлён')}</div>
            {planNotice.slice(0, 5).map(c => (
              <div key={c.name} className="alert-toast-sub" style={{opacity:0.8}}>
                {exName(c.name)}: {c.from > 0 ? <>{fmtW(c.from)} → <b style={{color: c.to > c.from ? '#30D158' : '#FF9F0A'}}>{fmtW(c.to)}</b></> : <>{t('рабочий вес')} <b>{fmtW(c.to)}</b></>}
              </div>
            ))}
          </div>
        </div>
      )}
      {saveError && (
        <div className="alert-toast" onClick={() => setSaveError(null)} style={{borderColor:'rgba(255,69,58,0.5)',cursor:'pointer',zIndex:3000}}>
          <div className="alert-toast-icon">⚠️</div>
          <div><div className="alert-toast-title" style={{whiteSpace:'normal'}}>{saveError}</div></div>
        </div>
      )}
      {/* PR Alert Toast */}
      {prAlert && (
        <div className="alert-toast" onClick={()=>setPrAlert(null)} style={{borderColor:'rgba(255,200,0,0.3)',cursor:'pointer'}}>
          <div className="alert-toast-icon">🏆</div>
          <div>
            <div className="alert-toast-title">{t('Новый рекорд!')}</div>
            <div className="alert-toast-sub" style={{opacity:0.75}}>{prAlert.name}: {fmtRecordSet(prAlert.metric, prAlert.best, prAlert.value)}</div>
            <div style={{fontSize:11,color:'var(--accent)',marginTop:2}}>{t('Было:')} {fmtRecordSet(prAlert.metric, prAlert.pr, prAlert.pr.value)}</div>
          </div>
        </div>
      )}

      {/* Motivational Toast */}
      {draftRestored && (
        <div className="alert-toast" style={{borderColor:'rgba(var(--accent-rgb),0.3)',pointerEvents:'none'}}>
          <div className="alert-toast-icon">💾</div>
          <div>
            <div className="alert-toast-title">{t('Тренировка восстановлена')}</div>
            <div className="alert-toast-sub">{t('Все введённые подходы на месте')}</div>
          </div>
        </div>
      )}
      {streakAlert && streakAlert.type === 'month' && (
        <div className="alert-toast" style={{borderColor:'rgba(var(--accent-rgb),0.3)'}}>
          <div className="alert-toast-icon">
            {streakAlert.count>=20?'👑':streakAlert.count>=10?'🏆':streakAlert.count>=5?'⚡':<Flame size={32}/>}
          </div>
          <div>
            <div className="alert-toast-title">{t('{n}-я тренировка месяца!',{n:streakAlert.count})}</div>
            <div className="alert-toast-sub">{streakAlert.msg}</div>
          </div>
        </div>
      )}

      {/* Export Period Modal */}
      {showExportModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowExportModal(false)}}>
          <div style={{background:thm.overlayCard,borderRadius:20,padding:'28px 24px',width:'calc(100% - 48px)',maxWidth:340,border:`1px solid ${thm.border}`}}>
            <div style={{fontSize:17,fontWeight:700,color:thm.text,marginBottom:6,textAlign:'center'}}>{t('📤 Экспорт тренировок')}</div>
            <div style={{fontSize:13,color:thm.text50,marginBottom:20,textAlign:'center'}}>{t('Выбери период')}</div>
            {[['7d',t('Последние 7 дней')],['30d',t('Последние 30 дней')],['3m',t('Последние 3 месяца')],['6m',t('Последние 6 месяцев')],['1y',t('Последний год')],['all',t('Всё время')]].map(([val,label])=>(
              <button key={val} onClick={()=>{setExportPeriod(val);exportWorkouts(val)}} style={{
                width:'100%',padding:'13px 16px',borderRadius:12,border:`1px solid ${exportPeriod===val?'rgba(var(--accent-rgb),0.4)':thm.border}`,
                background:exportPeriod===val?'rgba(var(--accent-rgb),0.1)':thm.card2,
                color:exportPeriod===val?'var(--accent)':thm.text,fontSize:14,fontWeight:600,cursor:'pointer',
                marginBottom:8,textAlign:'left',transition:'all 0.15s'
              }}>{label}</button>
            ))}
            <button onClick={()=>setShowExportModal(false)} style={{width:'100%',padding:'12px',borderRadius:12,border:'none',background:'rgba(255,59,48,0.1)',color:'#FF453A',fontSize:14,fontWeight:600,cursor:'pointer',marginTop:4}}>{t('Отмена')}</button>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowClearConfirm(false)}}>
          <div style={{background:thm.overlayCard,borderRadius:20,padding:'28px 24px',width:'calc(100% - 48px)',maxWidth:320,border:`1px solid ${thm.border}`}}>
            <div style={{fontSize:32,textAlign:'center',marginBottom:12}}>🗑</div>
            <div style={{fontSize:17,fontWeight:700,color:thm.text,marginBottom:8,textAlign:'center'}}>{t('Очистить историю?')}</div>
            <div style={{fontSize:14,color:thm.text50,marginBottom:24,textAlign:'center',lineHeight:1.5}}>{t('Все тренировки будут удалены безвозвратно. Это действие нельзя отменить.')}</div>
            <button onClick={clearHistory} style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:'#FF3B30',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',marginBottom:10}}>
              {t('Удалить всё')}
            </button>
            <button onClick={()=>setShowClearConfirm(false)} style={{width:'100%',padding:'14px',borderRadius:14,border:`1px solid ${thm.border}`,background:thm.card2,color:thm.text70,fontSize:15,fontWeight:600,cursor:'pointer'}}>
              {t('Отмена')}
            </button>
          </div>
        </div>
      )}

      {/* Streak / Rank Modal */}
      {showStreakModal && (() => {
        const rank = getRank(streak)
        return (
          <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowStreakModal(false)}}>
            <div className="modal" style={{background:thm.modalBg,maxHeight:'88dvh'}}>
              <div className="modal-handle" style={{background:isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.12)'}}/>
              <div style={{padding:'16px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
                <span style={{fontSize:17,fontWeight:700,color:thm.text}}>{t('Достижения')}</span>
                <button onClick={()=>setShowStreakModal(false)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:thm.text50,lineHeight:1}}>×</button>
              </div>
              <AchTabs tab={achTab} setTab={setAchTab} thm={thm} isDark={isDark}/>
              <div style={{overflowY:'auto',padding:'16px 20px 32px',flex:1}}>
                {achTab === 'all' && (achievements
                  ? <><MonthMedalsSummary medals={achievements.monthMedals} perfect={achievements.perfectMonths} thm={thm} isDark={isDark}/><BadgeGrid list={achievements.permanent} thm={thm} isDark={isDark}/></>
                  : <div style={{textAlign:'center',color:thm.text40,fontSize:14,padding:'24px 0'}}>{t('Загрузка...')}</div>)}
                {achTab === 'month' && (<>
                {/* Rank — compact */}
                <div style={{background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',borderRadius:20,padding:'14px 16px',marginBottom:12,border:`1px solid ${thm.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{fontSize:38,lineHeight:1}}>{rank.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:18,fontWeight:800,color:thm.text}}>{t(rank.name)}</div>
                      <div style={{fontSize:12,color:thm.text50,marginTop:2}}>{t('{w} в этом месяце',{w:workoutsN(streak)})}</div>
                    </div>
                  </div>
                  {!rank.isMax ? (
                    <div style={{marginTop:12}}>
                      <div style={{height:6,background:isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${Math.round(rank.progress*100)}%`,background:'var(--accent)',borderRadius:99,transition:'width 0.5s ease'}}/>
                      </div>
                      <div style={{fontSize:12,color:thm.text40,marginTop:6}}>{t('Ещё {w} до ранга «{rank}»',{w:workoutsN(rank.nextAt - streak), rank:t(rank.nextName)})} {RANK_LEVELS.find(r=>r.name===rank.nextName)?.icon}</div>
                    </div>
                  ) : <div style={{fontSize:12,color:'var(--accent)',marginTop:10,fontWeight:700}}>{t('Максимальный ранг достигнут! 🎉')}</div>}
                  {streakMotivQuote && <div style={{fontSize:12,color:thm.text50,fontStyle:'italic',marginTop:10}}>«{t(streakMotivQuote)}»</div>}
                </div>

                {achievements && <MonthChallenges month={achievements.current} thm={thm} isDark={isDark} onSwap={swapMonthChallenge}/>}
                {/* Best of the month (totals are in the challenges above and in History) */}
                {streakModalData && (streakModalData.bestWorkout || streakModalData.bestImprovement) && (
                <div style={{background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',borderRadius:20,padding:'16px 18px',marginBottom:12,border:`1px solid ${thm.border}`}}>
                  <div style={{fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:thm.text40,marginBottom:12}}>{t('Лучшее за месяц')}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {streakModalData.bestWorkout && (
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:14,color:thm.text70}}>{t('🔝 Лучшая тренировка')}</span>
                        <span style={{fontSize:14,fontWeight:600,color:thm.text,textAlign:'right'}}>
                          {formatDateShort(streakModalData.bestWorkout.date)} · {fmtVolume(streakModalData.bestWorkout.kg)}
                        </span>
                      </div>
                    )}
                    {streakModalData.bestImprovement && (
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:4}}>
                        <span style={{fontSize:14,color:thm.text70}}>{t('📈 Лучший прирост')}</span>
                        <span style={{fontSize:14,fontWeight:600,color:'var(--accent)',textAlign:'right',maxWidth:'55%'}}>
                          {exName(streakModalData.bestImprovement.name)} +{fmtW(streakModalData.bestImprovement.diff)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {achievements
                  ? <MonthArchive archive={achievements.archive} thm={thm} isDark={isDark}/>
                  : null}
                </>)}
              </div>
            </div>
          </div>
        )
      })()}

              {/* Edit set modal */}
              {editSetModal && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setEditSetModal(null)}>
                  <div style={{background:'#1C1C1E',borderRadius:'20px 20px 0 0',padding:24,width:'100%',maxWidth:480}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontSize:17,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:20}}>{t('Изменить подход')}</div>
                    {editSetModal.isTimed ? (
                      <div style={{marginBottom:16}}>
                        <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:8}}>{t('Секунды')}</div>
                        <input type="number" value={editSetModal.weight} onChange={e=>setEditSetModal(m=>({...m,weight:+e.target.value}))}
                          style={{width:'100%',padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:16,boxSizing:'border-box'}}/>
                      </div>
                    ) : (
                      <div style={{display:'flex',gap:12,marginBottom:16}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:8}}>{t('Вес (кг)')}</div>
                          <input type="number" value={editSetModal.weight} onChange={e=>setEditSetModal(m=>({...m,weight:+e.target.value}))}
                            style={{width:'100%',padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:16,boxSizing:'border-box'}}/>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:8}}>{t('Повторения')}</div>
                          <input type="number" value={editSetModal.reps} onChange={e=>setEditSetModal(m=>({...m,reps:+e.target.value}))}
                            style={{width:'100%',padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:16,boxSizing:'border-box'}}/>
                        </div>
                      </div>
                    )}
                    <button onClick={()=>{
                      setWorkoutExercises(prev=>prev.map((e,i)=>i!==editSetModal.exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==editSetModal.setIdx?ss:{...ss,weight:editSetModal.weight,reps:editSetModal.reps})}))
                      setEditSetModal(null)
                    }} style={{width:'100%',padding:'14px',borderRadius:14,background:'var(--accent)',color:'#000',fontSize:16,fontWeight:700,border:'none',cursor:'pointer'}}>
                      {t('Сохранить')}
                    </button>
                  </div>
                </div>
              )}

              {showPlanModal && (
                <PlansSheet thm={thm} activePlans={activePlans} planWeights={planWeights} initialView={typeof showPlanModal === 'string' ? showPlanModal : undefined}
                  onClose={() => setShowPlanModal(false)} onStartDay={loadPlanDay} onChoose={choosePlan} onStop={stopPlan} guessWeight={n => lastWorkingWeight(n).weight}/>
              )}

              {/* Onboarding modal */}
              {planOnboarding && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
                  <div style={{background:'#1C1C1E',borderRadius:24,padding:28,maxWidth:360,width:'100%',textAlign:'center'}}>
                    <div style={{fontSize:36,marginBottom:16}}>👋</div>
                    <div style={{fontSize:20,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:12}}>{t('Первая тренировка')}</div>
                    <div style={{fontSize:15,color:'rgba(255,255,255,0.55)',lineHeight:1.6,marginBottom:24}}>
                      {t('Сегодня найдём твой стартовый вес.')}<br/>
                      {t('Возьми вес с которым сделаешь нужное количество повторений комфортно — не на максимуме.')}<br/><br/>
                      {t('Gym BRO запомнит и будет считать прогрессию сам.')}
                    </div>
                    <button onClick={()=>setPlanOnboarding(false)} style={{width:'100%',padding:'14px',borderRadius:14,background:'var(--accent)',color:'#000',fontSize:16,fontWeight:700,border:'none',cursor:'pointer'}}>
                      {t('Понятно, начинаем!')}
                    </button>
                  </div>
                </div>
              )}

              {/* Rating modal */}
              {showRatingModal && pendingRatingPlan && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
                  <div style={{background:'#1C1C1E',borderRadius:24,padding:28,maxWidth:360,width:'100%',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:20}}>{t('Как прошла тренировка? 💪')}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
                      {[{key:'hard',label:t('😓 Тяжело')},{key:'ok',label:t('😐 Нормально')},{key:'good',label:t('😊 Хорошо')},{key:'super',label:t('🔥 Супер')}].map(r=>(
                        <button key={r.key} onClick={async ()=>{
                          // a set counts as completed when it was filled in; the heaviest weight seeds a plan weight of 0
                          const completedMap = {}, liftedMap = {}
                          for (const ex of workoutExercises) {
                            if (ex.planId === pendingRatingPlan.id) {
                              const ty = EXERCISE_TYPE[ex.name] || 'light'
                              const done = ex.sets.filter(s => isRepsType(ty) ? s.reps > 0 : (s.weight > 0 && s.reps > 0))
                              completedMap[ex.name] = done.length
                              liftedMap[ex.name] = Math.max(0, ...done.map(s => s.weight || 0))
                            }
                          }
                          try {
                            const changes = await applyProgression(pendingRatingPlan, r.key, completedMap, liftedMap)
                            if (changes?.length) { setPlanNotice(changes); setTimeout(() => setPlanNotice(null), 9000) }
                          } catch {}
                          setShowRatingModal(false)
                          setPendingRatingPlan(null)
                          setSaved(true)
                          setTimeout(() => { setSaved(false); setWorkoutStarted(false); setWorkoutExercises([]) }, 1000)
                        }} style={{padding:'14px',borderRadius:14,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.85)',fontSize:15,fontWeight:600,cursor:'pointer'}}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={()=>{ setShowRatingModal(false); setPendingRatingPlan(null); setSaved(true); setTimeout(() => { setSaved(false); setWorkoutStarted(false); setWorkoutExercises([]) }, 1000) }}
                      style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:14,cursor:'pointer',padding:8}}>{t('Пропустить')}</button>
                  </div>
                </div>
              )}


      <div className="nav-bar">
        {[{id:'add',icon:'➕',label:t('Тренировка')},{id:'history',icon:'📜',label:t('История')},{id:'progress',icon:'📈',label:t('Прогресс')},{id:'exercises',icon:'📋',label:t('Упражнения')}].map(t=>(
          <div key={t.id} className="nav-item" style={{opacity:tab===t.id?1:0.62}} onClick={()=>{setTab(t.id);if(t.id!=='add'){setWorkoutStarted(false);setSelectedEx(null)}}}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-lbl" style={{color:tab===t.id?'var(--accent)':thm.text}}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
