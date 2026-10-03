/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { supabase } from './supabase'
import { DropdownPicker } from './components/DropdownPicker'
import { EditModal } from './components/EditModal'
import { ProfileCard } from './components/ProfileCard'
import { WeightModal } from './components/WeightModal'
import { ScaleIcon } from './components/ScaleIcon'
import { LineChart } from './components/LineChart'
import { ModalItem } from './components/ModalItem'
import { MuscleMap } from './components/MuscleMap'
import { DEFAULT_FAVORITES, EXERCISES, EXERCISE_IMAGES, EXERCISE_INFO, EXERCISE_MUSCLES, EXERCISE_TYPE, LIGHT_WEIGHTS, MUSCLE_FILTERS_ROW1, MUSCLE_FILTERS_ROW2, MUSCLE_FILTER_MAP, MUSCLE_LABELS, REPS_OPTIONS, TIME_OPTIONS, VARIANT_EXERCISES, getDefaultVariant, getExImage, getVariantOptions, getWarmupSets, getWeightOptions, normalizeName, ruName } from './data/exerciseCatalog'
import { GREAT_QUOTES, RANK_LEVELS, RANK_QUOTES, getMotivation, getRank } from './data/motivation'
import { calcAnatomyLoad } from './data/muscleLoad'
import { PLAN_DAYS, PLAN_ICONS, PLAN_NAMES } from './data/plans'
import { CSS_ALL } from './styles/appCss'
import { fetchAllRows } from './utils/db'
import { buildCopyText, formatDateShort, formatMonth, localDateStr } from './utils/format'
import { bestSet, exMetric, isRepsType } from './utils/records'

const DEFAULT_SETTINGS = { username: '', weight: '', height: '', units: 'kg', theme: 'dark', language: 'ru' }

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
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportPeriod, setExportPeriod] = useState('all')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [streakModalData, setStreakModalData] = useState(null)
  const [streakQuote, setStreakQuote] = useState(0)
  const [streakMotivQuote, setStreakMotivQuote] = useState('')
  const [exTabSearch, setExTabSearch] = useState('')
  const [exTabFilter, setExTabFilter] = useState('all')
  const [exDetailModal, setExDetailModal] = useState(null)

  // Plan state
  const [activePlans, setActivePlans] = useState([])
  const [planWeights, setPlanWeights] = useState({})
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [showDayPreview, setShowDayPreview] = useState(null) // {plan, dayIdx, dayDef}
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [pendingRatingPlan, setPendingRatingPlan] = useState(null)
  const [planOnboarding, setPlanOnboarding] = useState(false)
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(null)
  const [editSetModal, setEditSetModal] = useState(null) // {exIdx, setIdx, weight, reps}

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
    setSettings(DEFAULT_SETTINGS)
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
  const saveProfile = (profile) => saveSettings({ ...settings, ...profile })

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
    const periodLabel = period === 'all' ? 'Все время'
      : period === '7d' ? 'Последние 7 дней'
      : period === '30d' ? 'Последние 30 дней'
      : period === '3m' ? 'Последние 3 месяца'
      : period === '6m' ? 'Последние 6 месяцев'
      : 'Последний год'
    const genDate = now.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })

    // Stats
    const workoutDatesAll = [...new Set(rows.map(r => r.workout_date))]
    const totalKg = rows.reduce((sum, w) => sum + (w.sets||[]).reduce((s2, s) => s2 + (s.weight||0)*(s.reps||1), 0), 0)
    const totalKgK = totalKg >= 1000 ? `${(totalKg/1000).toFixed(1)}K` : String(Math.round(totalKg))

    const workoutRows = sortedDates.map(date => {
      const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
      const exGroups = {}
      byDate[date].forEach(w => {
        const name = w.exercises?.name || ''
        if (!exGroups[name]) exGroups[name] = []
        exGroups[name].push(...(w.sets || []))
      })
      const dayKg = byDate[date].reduce((sum, w) => sum + (w.sets||[]).reduce((s2, s) => s2 + (s.weight||0)*(s.reps||1), 0), 0)
      const dayKgStr = dayKg >= 1000 ? `${(dayKg/1000).toFixed(1)}K кг` : `${Math.round(dayKg)} кг`
      const exCards = Object.entries(exGroups).map(([exName, sets]) => {
        const validSets = sets.filter(s => s.weight > 0 || s.reps > 0 || s.time_sec > 0)
        if (!validSets.length) return null
        const ruExName = normalizeName(exName)
        const setLines = validSets.map((s, i) => {
          const label = s.time_sec > 0
            ? (s.weight > 0 ? `Подход ${i+1}: ${s.time_sec} сек × ${kgToDisplay(s.weight)} ${wUnit}` : `Подход ${i+1}: ${s.time_sec} сек`)
            : s.weight > 0 ? `Подход ${i+1}: ${s.weight} кг × ${s.reps}` : `Подход ${i+1}: ${s.reps} повт`
          return `<div style="padding:2px 0;color:rgba(255,255,255,0.6);font-size:11px;">${label}</div>`
        }).join('')
        return `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:4px;">${ruExName}</div>${setLines}</div>`
      }).filter(Boolean)
      // Split exercises into two columns
      const half = Math.ceil(exCards.length / 2)
      const col1 = exCards.slice(0, half).join('')
      const col2 = exCards.slice(half).join('')
      return `
        <div style="margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0 4px;">
            <div style="color:#FF9F0A;font-size:13px;font-weight:700;">${dateStr}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:11px;">Итого: ${dayKgStr}</div>
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
          <div style="color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;margin-top:6px;">Отчёт за ${periodLabel}</div>
          <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:2px;">Отчёт за ${genDate}</div>
        </div>
        <div style="border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:16px;"></div>
        <div style="margin-bottom:16px;">
          <div style="color:#FF9F0A;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Статистика</div>
          <div style="font-size:12px;margin-bottom:4px;color:rgba(255,255,255,0.8);">Всего тренировок: <b style="color:#ffffff;">${workoutDatesAll.length}</b></div>
          <div style="font-size:12px;color:rgba(255,255,255,0.8);">Поднято за период: <b style="color:#ffffff;">${totalKgK} кг</b></div>
        </div>
        <div style="border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:16px;"></div>
        <div style="color:#FF9F0A;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px;">Тренировки</div>
        ${workoutRows}
        <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:20px;padding-top:8px;text-align:center;color:rgba(255,255,255,0.25);font-size:10px;">
          Gym BRO — Твой личный тренировочный журнал
        </div>
      </div>`

    const fileMonth = now.toLocaleDateString('ru', { month: 'long' }).replace(' ', '_')
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
    setHistory([]); setPrs([]); setStats(null); setSaved(p => !p)
  }

  const openStreakModal = async () => {
    setShowStreakModal(true)
    setStreakModalData(null)
    setStreakQuote(Math.floor(Math.random() * GREAT_QUOTES.length))
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
          if (!w.workout_date.startsWith(thisM)) {
            if (!beforePR[name] || est > beforePR[name].est) beforePR[name] = { est, weight:s.weight }
          } else {
            if (!monthPRmap[name] || est > monthPRmap[name].est) monthPRmap[name] = { est, weight:s.weight }
          }
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
  }, [saved, user])

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
  }, [user, saved])

  // История за последние 12 месяцев. Раньше был limit(200) записей (= упражнений),
  // что давало лишь ~4–5 месяцев. Грузим порциями, т.к. Supabase отдаёт максимум 1000 строк за запрос.
  useEffect(() => {
    // нужна и на «Прогрессе» — карта мышц считается по истории
    if ((tab !== 'history' && tab !== 'progress') || !user) return
    let cancelled = false
    const since = new Date(); since.setMonth(since.getMonth() - 11); since.setDate(1)
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
  }, [tab, saved, user])

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
      // Рекорды по всей истории. Каждая вариация («Жим лёжа (Узкий)») — отдельный рекорд, как и на графике.
      // Рекорд = максимальный вес (при равном весе — больше повторений); для планки — время, для колеса — повторения.
      const pData = await fetchAllRows(() => supabase.from('workouts').select('id,workout_date,exercises(name),sets(weight,reps,time_sec)').eq('user_id', user.id).order('id'))
      const map = {}
      pData.forEach(w => {
        const name = normalizeName(w.exercises?.name); if (!name) return
        const metric = exMetric(name)
        const { best, value } = bestSet(w.sets, metric)
        if (!best) return
        const cur = map[name]
        const better = !cur || value > cur.value || (value === cur.value && (best.reps || 0) > (cur.reps || 0))
        if (better) map[name] = { metric, value, weight: best.weight || 0, reps: best.reps || 0, time_sec: best.time_sec || 0, date: w.workout_date }
      })
      const order = { weight: 0, reps: 1, time: 2 }
      if (!cancelled) setPrs(Object.entries(map).sort((a,b) => (order[a[1].metric] - order[b[1].metric]) || (b[1].value - a[1].value)))
    }
    let cancelled = false
    load()
    return () => { cancelled = true }
  }, [tab, user, saved])

  useEffect(() => {
    if (tab !== 'progress' || !user) return
    async function load() {
      const start = `${calYear}-${String(calMonth+1).padStart(2,'0')}-01`
      const end = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${new Date(calYear,calMonth+1,0).getDate()}`
      const { data } = await supabase.from('workouts').select('workout_date,sets(weight,reps)').eq('user_id', user.id).gte('workout_date',start).lte('workout_date',end)
      const map = {}
      data?.forEach(w => { const d=new Date(w.workout_date).getDate(); if(!map[d]) map[d]=0; w.sets?.forEach(s => { if(s.weight>0&&s.reps>0) map[d]+=s.weight*s.reps }) })
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
          if (!cur || value > cur.orm) byDate[w.workout_date] = { orm: value, best }
        })
      }
      if (cancelled) return
      const pts = Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b)).map(([date,{orm,best}])=>({
        val: parseFloat(orm.toFixed(1)),
        metric,
        date,
        label: new Date(date+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'short'}),
        bestWeight: best.weight || 0,
        bestReps: best.reps || 0,
        bestTimeSec: best.time_sec || 0,
      })).filter(p=>p.val>0)
      setChartData(pts)
    }
    let cancelled = false
    load()
    return () => { cancelled = true }
  }, [chartEx, tab, user, saved])

  useEffect(() => {
    if (!selectedEx || !user) return
    async function load() {
      let { data: ex } = await supabase.from('exercises').select('id').eq('name',selectedEx).single()
      if (!ex) { setLastSession(null); return }
      const { data } = await supabase.from('workouts').select('workout_date,sets(set_no,weight,reps,time_sec)').eq('exercise_id',ex.id).eq('user_id', user.id).order('workout_date',{ascending:false}).limit(1).single()
      setLastSession(data || null)
    }
    load()
  }, [selectedEx, user])

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

  const applyProgression = async (plan, rating, completedMap) => {
    const days = PLAN_DAYS[plan.plan_type] || []
    const dayIdx = (plan.current_day - 1) % days.length
    const dayDef = days[dayIdx]
    if (!dayDef) return

    const updates = []
    for (const ex of dayDef.exercises) {
      const key = `${plan.id}:${ex.name}`
      const pw = planWeights[key]
      if (!pw || pw.working_weight === 0) continue
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
        updates.push({ plan_id: plan.id, exercise_name: ex.name, working_weight: newWeight, last_rating: rating })
      } else {
        updates.push({ plan_id: plan.id, exercise_name: ex.name, working_weight: pw.working_weight, last_rating: rating })
      }
    }

    for (const u of updates) {
      await supabase.from('plan_weights').update({ working_weight: u.working_weight, last_rating: u.last_rating, updated_at: new Date().toISOString() })
        .eq('user_id', user.id).eq('plan_id', u.plan_id).eq('exercise_name', u.exercise_name)
    }

    const nextDay = (plan.current_day % plan.total_days) + 1
    await supabase.from('workout_plans').update({ current_day: nextDay, workout_count: plan.workout_count + 1 }).eq('id', plan.id)
  }

  const saveWorkout = async () => {
    if (!workoutExercises.length) return
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    for (const exItem of workoutExercises) {
      const exType = EXERCISE_TYPE[exItem.name] || 'light'
      const exIsTimed = exType === 'timed'
      const filled = exItem.sets.filter(s => exIsTimed ? s.weight > 0 : isRepsType(exType) ? s.reps > 0 : (s.weight > 0 && s.reps > 0))
      if (!filled.length) continue
      const saveName = (exItem.grip && exItem.grip !== getDefaultVariant(exItem.name)) ? `${exItem.name} (${exItem.grip})` : exItem.name
      let { data: ex } = await supabase.from('exercises').select('id').eq('name', saveName).single()
      if (!ex) {
        const { data: inserted } = await supabase.from('exercises').insert({ name: saveName }).select().single()
        ex = inserted
      }
      if (!ex) continue
      const { data: w } = await supabase.from('workouts').insert({ workout_date: workoutDate, exercise_id: ex.id, user_id: user.id }).select().single()
      if (!w) { savingRef.current = false; continue }
      await supabase.from('sets').insert(filled.map((s,i) => ({
        workout_id: w.id, set_no: i+1,
        weight: exIsTimed ? (s.timedWeight||0) : (s.weight||0),
        reps: exIsTimed ? 0 : (s.reps||0),
        time_sec: exIsTimed ? (s.weight||0) : null
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
    const thisM2 = localDateStr(new Date()).slice(0,7)
    const { data: sessData } = await supabase.from('workouts').select('workout_date').eq('user_id', user.id).gte('workout_date', thisM2 + '-01')
    const monthCount = new Set((sessData || []).map(w => w.workout_date)).size
    setStreak(monthCount)
    setStreakAlert({ type: 'month', count: monthCount, msg: getMotivation(monthCount) })
    setTimeout(() => setStreakAlert(null), 4500)
    savingRef.current = false
    setSaving(false)
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

  const filtered = useMemo(() => {
    const q = modalSearch.toLowerCase().trim()
    if (!q) return exercises
    return exercises.filter(e => e.name.toLowerCase().includes(q))
  }, [exercises, modalSearch])
  const favSet = useMemo(() => new Set(favorites), [favorites])
  const favFiltered = useMemo(() => filtered.filter(e => favSet.has(e.name)), [filtered, favSet])
  const restFiltered = useMemo(() => filtered.filter(e => !favSet.has(e.name)), [filtered, favSet])
  const grouped = history.reduce((acc,w) => { if(!acc[w.workout_date]) acc[w.workout_date]=[]; acc[w.workout_date].push(w); return acc }, {})
  const calMonthName = new Date(calYear,calMonth).toLocaleDateString('ru',{month:'long',year:'numeric'})
  const firstDow = new Date(calYear,calMonth,1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear,calMonth+1,0).getDate()
  const todayStr = localDateStr(new Date())
  const weightOpts = selectedEx ? getWeightOptions(selectedEx) : LIGHT_WEIGHTS
  const exType = EXERCISE_TYPE[selectedEx] || 'light'
  const isFav = favorites.includes(selectedEx)

  // kg/lbs helpers
  const kgToDisplay = (kg) => settings.units === 'lbs' ? Math.round(kg * 2.20462 * 10) / 10 : kg
  const wUnit = settings.units === 'lbs' ? 'lbs' : 'кг'

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
    <div className="app" data-theme={settings.theme}>
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
          <button onClick={() => setShowWeightModal(true)} aria-label="Вес тела" style={{
            background: showWeightModal ? 'rgba(255,159,10,0.08)' : thm.btnBg,
            border: showWeightModal ? '1.5px solid #FF9F0A' : `1px solid ${thm.btnBorder}`,
            borderRadius:10,padding:'0',width:36,height:36,cursor:'pointer',color:thm.text70,
            fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
          }}><ScaleIcon size={20}/></button>
          <button onClick={() => { const isOpen=timerSecs!==null||stopwatchRunning||timerMode==='stopwatch'; if(isOpen){setTimerSecs(null);setTimerPaused(false);setStopwatchRunning(false);setStopwatchSecs(0);setTimerMode('countdown')}else{setTimerSecs(timerDuration);setTimerPaused(true)} }} style={{
            background: (timerSecs!==null||stopwatchRunning||timerMode==='stopwatch') ? 'rgba(255,159,10,0.08)' : thm.btnBg,
            border: (timerSecs!==null||stopwatchRunning||timerMode==='stopwatch') ? '1.5px solid #FF9F0A' : `1px solid ${thm.btnBorder}`,
            borderRadius:10,padding:'0',width:36,height:36,cursor:'pointer',
            color: (timerSecs!==null||stopwatchRunning||timerMode==='stopwatch') ? 'rgba(255,255,255,0.8)' : thm.text70,
            fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
          }}>⏱</button>
          {streak >= 1 && <button onClick={openStreakModal} style={{
            background:'rgba(255,100,0,0.12)',border:'1px solid rgba(255,100,0,0.25)',
            borderRadius:10,padding:'0 10px',height:36,cursor:'pointer',
            fontSize:13,fontWeight:700,color:'#FF6400',display:'flex',alignItems:'center',flexShrink:0,whiteSpace:'nowrap'
          }}>{streak}🔥</button>}
          <button onClick={() => setTab(t => t === 'settings' ? 'add' : 'settings')} style={{
            background: tab==='settings' ? 'rgba(255,159,10,0.08)' : thm.btnBg,
            border: tab==='settings' ? '1.5px solid #FF9F0A' : `1px solid ${thm.btnBorder}`,
            borderRadius:10,padding:'0',width:36,height:36,cursor:'pointer',
            color: tab==='settings' ? 'rgba(255,255,255,0.8)' : thm.text50,fontSize:18,
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
          }}>⚙️</button>
        </div>
      </div>
      {showWeightModal && (
        <WeightModal entries={bodyWeights} status={weightsStatus} onAdd={addWeighIn} onDelete={deleteWeighIn} onClose={() => setShowWeightModal(false)}/>
      )}

      {tab === 'add' && (
        <div className="section">

          {(timerSecs !== null || stopwatchRunning || timerMode === 'stopwatch') && (
            <div style={{background: timerMode==='stopwatch' ? 'linear-gradient(135deg,rgba(255,159,10,0.1),rgba(255,159,10,0.05))' : 'linear-gradient(135deg,rgba(255,159,10,0.1),rgba(255,159,10,0.05))',border: timerMode==='stopwatch' ? '1px solid rgba(255,159,10,0.2)' : '1px solid rgba(255,159,10,0.2)',borderRadius:20,padding:'16px 18px',marginBottom:16}}>
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <button onClick={()=>{setTimerMode('countdown');setStopwatchRunning(false);setStopwatchSecs(0);if(timerSecs===null){setTimerSecs(timerDuration);setTimerPaused(true)}}} style={{flex:1,padding:'7px 0',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,background:timerMode==='countdown'?'rgba(255,159,10,0.2)':'rgba(255,255,255,0.06)',color:timerMode==='countdown'?'#FF9F0A':'rgba(255,255,255,0.4)'}}>⏱ Таймер</button>
                <button onClick={()=>{setTimerMode('stopwatch');setTimerSecs(null);setTimerPaused(false)}} style={{flex:1,padding:'7px 0',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,background:timerMode==='stopwatch'?'rgba(255,159,10,0.2)':'rgba(255,255,255,0.06)',color:timerMode==='stopwatch'?'#FF9F0A':'rgba(255,255,255,0.4)'}}>⏲ Секундомер</button>
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
                  <button onClick={()=>setTimerPaused(p=>!p)} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:timerPaused?'#FF9F0A':'rgba(255,159,10,0.15)',color:timerPaused?'#000':'#FF9F0A'}}>
                    {timerPaused ? '▶ Продолжить' : '⏸ Пауза'}
                  </button>
                  <button onClick={()=>{setTimerSecs(timerDuration);setTimerPaused(true)}} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)'}}>↺ Заново</button>

                </div>
                <div style={{fontSize:11,opacity:0.35,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>Изменить время</div>
                <DropdownPicker options={Array.from({length:50},(_,i)=>(i+1)*5)} value={timerDuration} onChange={v=>{setTimerDuration(v);setTimerSecs(v);setTimerPaused(true)}} unit="сек" label=""/>
              </>) : (<>
                <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:12}}>
                  <span style={{fontSize:48,fontWeight:800,color:stopwatchRunning?'#FF9F0A':'rgba(255,255,255,0.85)',fontVariantNumeric:'tabular-nums',letterSpacing:'-2px'}}>
                    {`${Math.floor(stopwatchSecs/60)}:${String(stopwatchSecs%60).padStart(2,'0')}`}
                  </span>
                </div>
                <div style={{display:'flex',gap:8,marginBottom:4}}>
                  <button onClick={()=>setStopwatchRunning(r=>!r)} style={{flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:stopwatchRunning?'rgba(255,59,48,0.15)':'#FF9F0A',color:stopwatchRunning?'#FF453A':'#000'}}>
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
                <div style={{fontSize:12,color:thm.text28,fontWeight:600,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:14}}>
                  {new Date().toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'long'})}
                </div>
                <div style={{fontSize:26,fontWeight:700,color:thm.text70,letterSpacing:'-0.3px'}}>Тренировка</div>
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
                <button className="start-btn" onClick={()=>{ if (!workoutExercises.length) setWorkoutDate(localDateStr(new Date())); setWorkoutStarted(true) }} style={{
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
                  <span style={{fontSize:13,fontWeight:700,color:thm.text70,letterSpacing:'3px',textTransform:'uppercase'}}>{workoutExercises.length>0?'ПРОДОЛЖИТЬ':'НАЧАТЬ'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <button onClick={()=>{setWorkoutStarted(false);setSaved(false)}} className="back-btn">← Назад</button>
                {/* Дата тренировки — тап открывает выбор даты */}
                <label style={{position:'relative',fontSize:13,color:thm.text70,fontWeight:600,padding:'6px 10px',borderRadius:10,background:thm.btnBg,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                  📅 {new Date(workoutDate+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'long'})}
                  <span style={{fontSize:11,opacity:0.6}}>▾</span>
                  <input type="date" value={workoutDate} max={localDateStr(new Date())} onChange={e=>e.target.value && setWorkoutDate(e.target.value)}
                    aria-label="Дата тренировки"
                    style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0,cursor:'pointer',colorScheme:'dark'}}/>
                </label>
              </div>
              {workoutExercises.map((ex, exIdx) => {
                const isOpen = ex.open
                const exType2 = EXERCISE_TYPE[ex.name] || 'light'
                const wOpts = getWeightOptions(ex.name)
                return (
                  <div key={exIdx} style={{background:thm.card2,borderRadius:16,border:`1px solid ${thm.border}`,marginBottom:10}}>
                    <button onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i===exIdx?{...e,open:!e.open}:e))}
                      style={{width:'100%',background:'none',border:'none',padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',textAlign:'left'}}>
                      {getExImage(ex.name)
                        ? <img src={getExImage(ex.name)} alt={ex.name} loading="lazy" decoding="async" style={{width:36,height:36,borderRadius:8,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
                        : <div style={{width:36,height:36,borderRadius:8,background:thm.btnBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>🏋️</div>
                      }
                      <div style={{flex:1}}>
                        <span style={{fontSize:15,fontWeight:700,color:thm.text85}}>{ex.name}</span>
                        {ex.grip && ex.grip !== getDefaultVariant(ex.name) && <span style={{fontSize:11,color:'rgba(255,159,10,0.8)',marginLeft:6,fontWeight:600}}>({ex.grip})</span>}
                      </div>
                      <span style={{fontSize:12,color:thm.text30,marginRight:4}}>{ex.sets.filter(s=>isRepsType(exType2)?s.reps>0:(s.weight>0&&s.reps>0)).length} подх.</span>
                      <button onClick={e=>{e.stopPropagation();setWorkoutExercises(prev=>prev.filter((_,i)=>i!==exIdx))}}
                        style={{background:'rgba(255,59,48,0.1)',border:'none',borderRadius:8,padding:'4px 8px',color:'#FF453A',cursor:'pointer',fontSize:12,fontWeight:700,marginRight:4}}>✕</button>
                      <span style={{color:thm.text40,fontSize:20,display:'inline-block',transform:isOpen?'rotate(180deg)':'none',transition:'transform 0.2s',padding:'2px 8px',minWidth:32,textAlign:'center'}}>▼</span>
                    </button>
                    {isOpen && (
                      <div style={{padding:'0 14px 14px'}}>
                        {ex.lastSession && (
                          <div style={{fontSize:12,color:thm.text35,marginBottom:10,padding:'7px 10px',background:thm.card2,borderRadius:8}}>
                            💡 Прошлый раз: {ex.lastSession.sets?.sort((a,b)=>a.set_no-b.set_no).slice(-3).map(s=>s.time_sec>0?(s.weight>0?`${s.time_sec}s×${kgToDisplay(s.weight)}${wUnit}`:`${s.time_sec}s`):(s.weight>0?`${kgToDisplay(s.weight)}×${s.reps}`:`${s.reps} повт`)).join(' · ')}
                          </div>
                        )}
                        {ex.grip !== null && ex.grip !== undefined && (
                          <div style={{marginBottom:12}}>
                            <div style={{fontSize:11,opacity:0.4,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>{VARIANT_EXERCISES.has(ex.name) ? 'Вариация' : 'Хват'}</div>
                            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                              {getVariantOptions(ex.name).map(g => (
                                <button key={g} onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,grip:g}))}
                                  style={{padding:'5px 12px',borderRadius:99,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',
                                    background: ex.grip===g ? '#FF9F0A' : thm.btnBg,
                                    color: ex.grip===g ? '#000' : 'rgba(255,255,255,0.6)'}}>
                                  {g}
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
                                  <span className="set-num">{si+1}</span>
                                  {exType2 === 'timed' ? (
                                    <>
                                      <DropdownPicker options={TIME_OPTIONS} value={s.weight} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,weight:v})}))} unit="s" label={`Подход ${si+1}`}/>
                                      <span className="set-sep">×</span>
                                      <div style={{display:'flex',flexDirection:'column',flex:1}}>
                                        <div className="dpicker-label">Вес (кг)</div>
                                        <div style={{display:'flex',alignItems:'center',gap:6,height:51}}>
                                          <button onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,timedWeight:Math.max(0,(ss.timedWeight||0)-5)})}))} style={{width:40,height:40,borderRadius:10,border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>−</button>
                                          <span style={{flex:1,textAlign:'center',fontSize:17,fontWeight:600,color:(s.timedWeight||0)>0?'#fff':'rgba(255,255,255,0.3)'}}>{s.timedWeight||0}</span>
                                          <button onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,timedWeight:(ss.timedWeight||0)+5})}))} style={{width:40,height:40,borderRadius:10,border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
                                        </div>
                                      </div>
                                    </>
                                  ) : exType2 === 'bodyweight' ? (
                                    <DropdownPicker options={REPS_OPTIONS} value={s.reps} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,weight:0,reps:v})}))} unit="повт" label={`Подход ${si+1} — Повт`}/>
                                  ) : (
                                    <>
                                      <DropdownPicker options={wOpts} value={s.weight} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,weight:v})}))} unit={settings.units==='lbs'?'':wUnit} labelFn={settings.units==='lbs'?(v=>`${kgToDisplay(v)} lbs`):null} label={exType2==='bodyweight_plus' ? `Подход ${si+1} — +вес` : `Подход ${si+1} — Вес`}/>
                                      <span className="set-sep">×</span>
                                      <DropdownPicker options={REPS_OPTIONS} value={s.reps} onChange={v=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==si?ss:{...ss,reps:v})}))} unit="повт" label={`Подход ${si+1} — Повт`}/>
                                    </>
                                  )}
                                </div>
                              ))}
                              <div className="set-btns" style={{marginTop:4}}>
                                <button className="set-btn" onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:[...e.sets,{weight:e.sets[e.sets.length-1]?.weight||0,reps:e.sets[e.sets.length-1]?.reps||0,timedWeight:e.sets[e.sets.length-1]?.timedWeight||0}]}))}>➕ Подход</button>
                                <button className="set-btn" onClick={()=>setWorkoutExercises(prev=>prev.map((e,i)=>i!==exIdx?e:{...e,sets:e.sets.length>1?e.sets.slice(0,-1):e.sets}))} style={{opacity:ex.sets.length<=1?0.35:1}}>➖ Убрать</button>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Plan cards — only shown when no exercises added yet */}
              {workoutExercises.length === 0 && <div style={{marginBottom:12}}>
                {activePlans.map(plan => {
                  const days = PLAN_DAYS[plan.plan_type] || []
                  const dayIdx = (plan.current_day - 1) % days.length
                  const dayDef = days[dayIdx]
                  const week = Math.floor((plan.workout_count) / days.length) + 1
                  return (
                    <div key={plan.id} onClick={()=>setShowDayPreview({plan, dayIdx, dayDef})} style={{background:'rgba(255,255,255,0.06)',borderRadius:14,border:'1px solid rgba(255,255,255,0.1)',padding:'12px 14px',marginBottom:8,cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.9)'}}>{PLAN_ICONS[plan.plan_type]} {PLAN_NAMES[plan.plan_type]}</span>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:600}}>{plan.slot===1?'основной':'доп.'}</span>
                      </div>
                      <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>{dayDef?.label} · Неделя {week} · тренировка {plan.workout_count+1}</div>
                    </div>
                  )
                })}
                {activePlans.length === 0 && (
                  <button onClick={()=>setShowPlanModal(true)} style={{width:'100%',marginBottom:10,padding:'16px 20px',borderRadius:16,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.06)',cursor:'pointer',display:'flex',alignItems:'center',gap:14,textAlign:'left'}}>
                    <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,159,10,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>📋</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:16,fontWeight:600,color:'#fff',marginBottom:4}}>Выбрать план тренировок</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:4}}>Тренируйся по программе</div>
                    </div>
                    <span style={{color:'rgba(255,255,255,0.2)',fontSize:18}}>›</span>
                  </button>
                )}
                {activePlans.length === 1 && (
                  <button onClick={()=>setShowPlanModal(true)} style={{width:'100%',marginBottom:8,padding:'10px 14px',borderRadius:12,border:'1px dashed rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                    + Добавить второй план
                  </button>
                )}
                {activePlans.length > 0 && (
                  <button onClick={()=>setShowPlanModal(true)} style={{width:'100%',marginTop:2,padding:'8px 14px',borderRadius:12,border:'none',background:'transparent',color:'rgba(255,255,255,0.35)',fontSize:12,cursor:'pointer'}}>
                    ⚙️ Управление планами
                  </button>
                )}
              </div>}
              <button onClick={()=>setShowExModal(true)} style={{width:'100%',marginBottom:10,padding:'16px 20px',borderRadius:16,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.06)',cursor:'pointer',display:'flex',alignItems:'center',gap:14,textAlign:'left'}}>
                <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>＋</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:600,color:'#fff',marginBottom:4}}>Добавить упражнение</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:4}}>Выбрать вручную</div>
                </div>
                <span style={{color:'rgba(255,255,255,0.2)',fontSize:18}}>›</span>
              </button>
              {workoutExercises.length === 0 && (<>
              <button onClick={()=>setShowComingSoon(true)} style={{width:'100%',marginBottom:10,padding:'16px 20px',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.05)',cursor:'pointer',display:'flex',alignItems:'center',gap:14,textAlign:'left'}}>
                <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,200,0,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🤸</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:600,color:'rgba(255,255,255,0.75)',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>Разминка<span style={{fontSize:10,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',color:'#FF9F0A',background:'rgba(255,159,10,0.12)',borderRadius:6,padding:'2px 6px'}}>скоро</span></div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:4}}>Подготовь тело к тренировке</div>
                </div>
                <span style={{color:'rgba(255,255,255,0.2)',fontSize:18}}>›</span>
              </button>
              <button onClick={()=>setShowComingSoon(true)} style={{width:'100%',marginBottom:16,padding:'16px 20px',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.05)',cursor:'pointer',display:'flex',alignItems:'center',gap:14,textAlign:'left'}}>
                <div style={{width:44,height:44,borderRadius:12,background:'rgba(100,180,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🧘</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:600,color:'rgba(255,255,255,0.75)',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>Растяжка<span style={{fontSize:10,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',color:'#FF9F0A',background:'rgba(255,159,10,0.12)',borderRadius:6,padding:'2px 6px'}}>скоро</span></div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:4}}>Восстановление после нагрузки</div>
                </div>
                <span style={{color:'rgba(255,255,255,0.2)',fontSize:18}}>›</span>
              </button>
              </>)}
              {workoutExercises.length > 0 && (
                <button className={`save-btn${saved?' done':''}`} onClick={saveWorkout} disabled={saving || saved}>
                  {saved ? '✅ Сохранено!' : saving ? '⏳ Сохранение...' : `💾 Сохранить тренировку (${workoutExercises.length} упр.)`}
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
                    <div style={{fontSize:22,fontWeight:800,color:'#FF9F0A'}}>{workoutDaysCount}</div>
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
                            <div className="hist-ex">{normalizeName(w.exercises?.name)}</div>
                            <button onClick={()=>deleteWorkout(w.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,opacity:0.4,padding:'0 4px',color:'#ff453a'}} title="Удалить упражнение">✕</button>
                          </div>
                          <div className="chips">{w.sets?.sort((a,b)=>a.set_no-b.set_no).map((s,i) => <span key={i} className="chip">{s.time_sec>0?(s.weight>0?`${s.time_sec}s×${kgToDisplay(s.weight)}${wUnit}`:`${s.time_sec}s`):(s.weight>0?`${kgToDisplay(s.weight)}×${s.reps}`:`${s.reps} повт`)}</span>)}</div>
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
        const daysAgoDate = localDateStr(new Date(Date.now() - musclePeriod*24*60*60*1000))
        const recentHistory = history.filter(w => w.workout_date >= daysAgoDate)
        const muscleScores = calcAnatomyLoad(recentHistory, musclePeriod)
        return (
        <div className="section">
          {stats && (
            <div className="stats-row">
              <div className="stat-card"><div className="stat-val">{stats.monthW}</div><div className="stat-lbl">{new Date().toLocaleDateString('ru',{month:'long'})}</div></div>
              <div className="stat-card"><div className="stat-val">{stats.totalW}</div><div className="stat-lbl">всего</div></div>
              <div className="stat-card"><div className="stat-val" style={{color:'#FF9F0A',fontSize:18}}>{(()=>{const v=settings.units==='lbs'?Math.round(stats.monthKg*2.20462):Math.round(stats.monthKg);return v>=1000?`${(v/1000).toFixed(1)}K`:v})()}{' '}{wUnit}</div><div className="stat-lbl">поднято за месяц</div></div>
            </div>
          )}
          <div className="prog-title">💪 Нагрузка по мышцам</div>
          <div className="chart-wrap" style={{padding:'16px 8px'}}>
            <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:14}}>
              {[[7,'7 дней'],[30,'30 дней']].map(([days,label]) => (
                <button key={days} onClick={()=>setMusclePeriod(days)} style={{
                  padding:'6px 18px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
                  background: musclePeriod===days ? '#FF9F0A' : '#2c2c2e',
                  color: musclePeriod===days ? '#000' : 'rgba(255,255,255,0.5)',
                }}>{label}</button>
              ))}
            </div>
            <MuscleMap muscleScores={muscleScores} period={musclePeriod}/>
            <div style={{display:'flex',justifyContent:'center',gap:14,marginTop:12}}>
              {[['#3A3A3C','Нет'],['#FFD60A','Мало'],['#9EDB3F','Норма'],['#30D158','Отлично'],['#FF453A','Перегрузка']].map(([color,label])=>(
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
            width:'100%',background:thm.card2,border:`1px solid ${thm.border}`,
            borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',
            cursor:'pointer',marginBottom:4
          }}>
            <span style={{fontSize:15,fontWeight:700,color:thm.text85}}>🏆 Личные рекорды</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,color:thm.text35}}>{prs.length} упр.</span>
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
                  <span style={{flex:1,color:thm.text85,fontSize:14,fontWeight:600}}>{normalizeName(name)}</span>
                  <span style={{color:'#FF9F0A',fontSize:14,fontWeight:700,marginRight:8}}>{pr.metric==='time' ? `${pr.time_sec} сек` : pr.metric==='reps' ? `${pr.reps} повт${pr.weight>0?` +${kgToDisplay(pr.weight)}`:''}` : `${kgToDisplay(pr.weight)} ${wUnit}`}</span>
                  <span style={{color:thm.text25,fontSize:11,display:'inline-block',transition:'transform 0.2s',transform:isOpen?'rotate(180deg)':'none'}}>▼</span>
                </button>
                {isOpen && <div style={{padding:'2px 16px 12px 58px',display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontSize:13,color:thm.text50,fontWeight:600}}>{pr.metric==='time' ? `${pr.time_sec} сек${pr.weight>0?` × ${kgToDisplay(pr.weight)} ${wUnit}`:''}` : pr.metric==='reps' ? `${pr.reps} повт${pr.weight>0?` с доп. весом ${kgToDisplay(pr.weight)} ${wUnit}`:''}` : `${kgToDisplay(pr.weight)} ${wUnit} × ${pr.reps} повт`}</span>
                  <span style={{fontSize:12,color:thm.text30}}>{new Date(pr.date).toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>}
              </div>
            )
          })}
          </div>}
          <div className="prog-title">📊 График роста</div>
          <div className="chart-wrap">
            <select className="chart-ex-select" value={chartEx} onChange={e=>setChartEx(e.target.value)}>{prs.map(([name])=><option key={name} value={name}>{ruName(name)}</option>)}</select>
            <LineChart data={(() => {
              const base = chartPeriod === 'ALL' ? chartData : (() => {
                const months = chartPeriod === '1M' ? 1 : 3
                const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months)
                const cutoffStr = localDateStr(cutoff)
                return chartData.filter(p => p.date >= cutoffStr)
              })()
              if (settings.units === 'lbs' && base[0]?.metric === 'weight') return base.map(p => ({...p, val: Math.round(p.val * 2.20462 * 10) / 10}))
              return base
            })()} period={chartPeriod} setPeriod={setChartPeriod} totalPoints={chartData.length}
              unit={chartData[0]?.metric === 'time' ? 'сек' : chartData[0]?.metric === 'reps' ? 'повт' : wUnit}/>
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
              {!modalSearch&&favFiltered.length>0&&<><div className="modal-sect-lbl">⭐ Избранные</div>{favFiltered.map(ex=><ModalItem key={ex.id} ex={ex} onAdd={addExToWorkout} isFav={true} onToggleFav={toggleFav}/>)}<div className="modal-sect-lbl">Все упражнения</div></>}
              {(modalSearch?filtered:restFiltered).map(ex=><ModalItem key={ex.id} ex={ex} onAdd={addExToWorkout} isFav={favSet.has(ex.name)} onToggleFav={toggleFav}/>)}
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
                  <div className="chips">{w.sets?.sort((a,b)=>a.set_no-b.set_no).map((s,i)=><span key={i} className="chip">{s.time_sec>0?(s.weight>0?`${s.time_sec}s×${kgToDisplay(s.weight)}${wUnit}`:`${s.time_sec}s`):(s.weight>0?`${kgToDisplay(s.weight)}×${s.reps}`:`${s.reps} повт`)}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editModal && <EditModal data={editModal} onClose={()=>setEditModal(null)} onSave={saveEdit}/>}

      {tab === 'settings' && (
        <div className="section">
          <div style={{fontSize:20,fontWeight:700,marginBottom:20,letterSpacing:'-0.3px'}}>⚙️ Настройки</div>

          {/* Profile */}
          <ProfileCard settings={settings} onSave={saveProfile}/>

          {/* Тренировки */}
          <div className="settings-card">
            <div className="settings-section-title">🏋️ Тренировки</div>
            <div className="settings-row">
              <div className="settings-row-label">Единицы веса</div>
              <div className="settings-toggle">
                {['kg','lbs'].map(u=>(
                  <button key={u} className={`settings-toggle-btn${settings.units===u?' active':''}`}
                    onClick={()=>saveSettings({...settings,units:u})}>{u}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Внешний вид */}
          <div className="settings-card">
            <div className="settings-section-title">🎨 Внешний вид</div>
            <div className="settings-row" style={{marginBottom:14}}>
              <div className="settings-row-label">Тема</div>
              <div className="settings-toggle">
                {[['dark','🌙 Тёмная'],['light','☀️ Светлая']].map(([val,label])=>(
                  <button key={val} className={`settings-toggle-btn${settings.theme===val?' active':''}`}
                    onClick={()=>saveSettings({...settings,theme:val})}>{label}</button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">Язык</div>
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
            <div className="settings-section-title">💾 Данные</div>
            <button className="settings-action-btn" onClick={()=>setShowExportModal(true)}>
              <span>📤</span> Экспорт тренировок
            </button>
            <button className="settings-action-btn danger" onClick={()=>setShowClearConfirm(true)}>
              <span>🗑</span> Очистить историю
            </button>
          </div>

          {/* Аккаунт */}
          <div className="settings-card">
            <div className="settings-section-title">👤 Аккаунт</div>
            <div style={{fontSize:13,color:thm.text40,marginBottom:16,padding:'10px 12px',background:thm.card2,borderRadius:10}}>
              📧 {user?.email}
            </div>
            <button className="settings-signout-btn" onClick={handleSignOut}>
              Выйти из аккаунта
            </button>
          </div>
        </div>
      )}

      {/* Exercises Tab */}
      {tab === 'exercises' && (() => {
        const allExNames = Object.keys(EXERCISE_IMAGES)
        const filtered = allExNames.filter(name => {
          const primaryMuscles = EXERCISE_MUSCLES[name]?.primary || []
          if (exTabFilter === 'favorites') return favorites.includes(name) && name.toLowerCase().includes(exTabSearch.toLowerCase())
          const matchesFilter = exTabFilter === 'all' || (MUSCLE_FILTER_MAP[exTabFilter] || []).some(m => primaryMuscles.includes(m))
          const matchesSearch = name.toLowerCase().includes(exTabSearch.toLowerCase())
          return matchesFilter && matchesSearch
        }).sort((a,b) => a.localeCompare(b,'ru'))
        return (
          <div className="section" style={{paddingTop:16}}>
            <div style={{position:'relative',marginBottom:0}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:16,opacity:0.35,pointerEvents:'none'}}>🔍</span>
              <input className="ex-tab-search" placeholder="Поиск упражнения..." value={exTabSearch}
                onChange={e=>setExTabSearch(e.target.value)} style={{color:thm.text,background:thm.input}}/>
            </div>
            <div className="muscle-filters">
              <div className="muscle-filters-fav-row">
                <button className={`muscle-chip-fav${exTabFilter==='favorites'?' active':''}`}
                  style={exTabFilter!=='favorites'?{background:thm.btnBg,color:thm.text50,border:`1px solid ${thm.border}`}:{border:'none'}}
                  onClick={()=>setExTabFilter('favorites')}>⭐ Избранные</button>
              </div>
              <div className="muscle-filters-divider"/>
              <div className="muscle-filters-row">
                {MUSCLE_FILTERS_ROW1.map(f => (
                  <button key={f.id} className={`muscle-chip${exTabFilter===f.id?' active':''}`}
                    style={exTabFilter!==f.id?{background:thm.btnBg,color:thm.text50,border:`1px solid ${thm.border}`}:{border:'none'}}
                    onClick={()=>setExTabFilter(f.id)}>{f.label}</button>
                ))}
              </div>
              <div className="muscle-filters-row">
                {MUSCLE_FILTERS_ROW2.map(f => (
                  <button key={f.id} className={`muscle-chip${exTabFilter===f.id?' active':''}`}
                    style={exTabFilter!==f.id?{background:thm.btnBg,color:thm.text50,border:`1px solid ${thm.border}`}:{border:'none'}}
                    onClick={()=>setExTabFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            </div>
            {filtered.length === 0 && (
              <div style={{textAlign:'center',color:thm.text40,fontSize:14,padding:'40px 0'}}>{exTabFilter==='favorites'?'Нет избранных упражнений':'Ничего не найдено'}</div>
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
                  <div style={{flex:1}}>
                    <div className="ex-list-name" style={{color:thm.text}}>{name}</div>
                    <div style={{fontSize:12,marginTop:2}}>
                      <span style={{color:thm.text60}}>{primaryMuscles.slice(0,2).map(m=>MUSCLE_LABELS[m]||m).join(' · ')}</span>
                      {secondaryMuscles.length > 0 && <span style={{color:thm.text30,fontSize:11}}>{' · '}{secondaryMuscles.slice(0,2).map(m=>MUSCLE_LABELS[m]||m).join(', ')}</span>}
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
        const info = EXERCISE_INFO[name]
        return (
          <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setExDetailModal(null)}}>
            <div className="modal" style={{background:thm.modalBg}}>
              <div className="modal-handle" style={{background:isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.12)'}}/>
              <div style={{padding:'14px 18px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
                <span style={{fontSize:17,fontWeight:700,color:thm.text}}>{name}</span>
                <button onClick={()=>setExDetailModal(null)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:thm.text50,lineHeight:1}}>×</button>
              </div>
              <div className="modal-body">
                {img
                  ? <img src={img} alt={name} className="ex-detail-img" loading="lazy" decoding="async" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>
                  : null}
                <div className="ex-detail-ph" style={{display: img ? 'none' : 'flex'}}>💪</div>
                <div className="ex-detail-muscles">
                  {primaryMusclesDetail.map(m => (
                    <span key={m} className="ex-detail-muscle-tag">{MUSCLE_LABELS[m]||m}</span>
                  ))}
                  {secondaryMusclesDetail.map(m => (
                    <span key={'s_'+m} className="ex-detail-muscle-tag-secondary">{MUSCLE_LABELS[m]||m}</span>
                  ))}
                </div>
                {info ? (
                  <>
                    <div className="ex-detail-section">
                      <div className="ex-detail-section-lbl">Описание</div>
                      <div className="ex-detail-text" style={{color:thm.text70}}>{info.desc}</div>
                    </div>
                    <div className="ex-detail-section">
                      <div className="ex-detail-section-lbl">Польза</div>
                      <div className="ex-detail-text" style={{color:thm.text70}}>{info.benefit}</div>
                    </div>
                    <div className="ex-detail-section">
                      <div className="ex-detail-section-lbl" style={{color:'#FF9F0A',opacity:1}}>💡 Советы</div>
                      <div className="ex-detail-text" style={{color:thm.text70}}>{info.tips}</div>
                    </div>
                  </>
                ) : (
                  <div style={{textAlign:'center',color:thm.text40,fontSize:14,padding:'20px 0'}}>Описание скоро появится</div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Timer Modal */}
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
      {draftRestored && (
        <div className="alert-toast" style={{borderColor:'rgba(255,159,10,0.3)',pointerEvents:'none'}}>
          <div className="alert-toast-icon">💾</div>
          <div>
            <div className="alert-toast-title">Тренировка восстановлена</div>
            <div className="alert-toast-sub">Все введённые подходы на месте</div>
          </div>
        </div>
      )}
      {streakAlert && streakAlert.type === 'month' && (
        <div className="alert-toast" style={{borderColor:'rgba(255,159,10,0.3)'}}>
          <div className="alert-toast-icon">
            {streakAlert.count>=20?'👑':streakAlert.count>=10?'🏆':streakAlert.count>=5?'⚡':'🔥'}
          </div>
          <div>
            <div className="alert-toast-title">{streakAlert.count}-я тренировка месяца!</div>
            <div className="alert-toast-sub">{streakAlert.msg}</div>
          </div>
        </div>
      )}

      {/* Export Period Modal */}
      {showExportModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowExportModal(false)}}>
          <div style={{background:thm.overlayCard,borderRadius:20,padding:'28px 24px',width:'calc(100% - 48px)',maxWidth:340,border:`1px solid ${thm.border}`}}>
            <div style={{fontSize:17,fontWeight:700,color:thm.text,marginBottom:6,textAlign:'center'}}>📤 Экспорт тренировок</div>
            <div style={{fontSize:13,color:thm.text50,marginBottom:20,textAlign:'center'}}>Выбери период</div>
            {[['7d','Последние 7 дней'],['30d','Последние 30 дней'],['3m','Последние 3 месяца'],['6m','Последние 6 месяцев'],['1y','Последний год'],['all','Всё время']].map(([val,label])=>(
              <button key={val} onClick={()=>{setExportPeriod(val);exportWorkouts(val)}} style={{
                width:'100%',padding:'13px 16px',borderRadius:12,border:`1px solid ${exportPeriod===val?'rgba(255,159,10,0.4)':thm.border}`,
                background:exportPeriod===val?'rgba(255,159,10,0.1)':thm.card2,
                color:exportPeriod===val?'#FF9F0A':thm.text,fontSize:14,fontWeight:600,cursor:'pointer',
                marginBottom:8,textAlign:'left',transition:'all 0.15s'
              }}>{label}</button>
            ))}
            <button onClick={()=>setShowExportModal(false)} style={{width:'100%',padding:'12px',borderRadius:12,border:'none',background:'rgba(255,59,48,0.1)',color:'#FF453A',fontSize:14,fontWeight:600,cursor:'pointer',marginTop:4}}>Отмена</button>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowClearConfirm(false)}}>
          <div style={{background:thm.overlayCard,borderRadius:20,padding:'28px 24px',width:'calc(100% - 48px)',maxWidth:320,border:`1px solid ${thm.border}`}}>
            <div style={{fontSize:32,textAlign:'center',marginBottom:12}}>🗑</div>
            <div style={{fontSize:17,fontWeight:700,color:thm.text,marginBottom:8,textAlign:'center'}}>Очистить историю?</div>
            <div style={{fontSize:14,color:thm.text50,marginBottom:24,textAlign:'center',lineHeight:1.5}}>Все тренировки будут удалены безвозвратно. Это действие нельзя отменить.</div>
            <button onClick={clearHistory} style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:'#FF3B30',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',marginBottom:10}}>
              Удалить всё
            </button>
            <button onClick={()=>setShowClearConfirm(false)} style={{width:'100%',padding:'14px',borderRadius:14,border:`1px solid ${thm.border}`,background:thm.card2,color:thm.text70,fontSize:15,fontWeight:600,cursor:'pointer'}}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Streak / Rank Modal */}
      {showStreakModal && (() => {
        const rank = getRank(streak)
        const greatQ = GREAT_QUOTES[streakQuote]
        function fMonth(m) {
          const [y,mo] = m.split('-')
          const s = new Date(parseInt(y), parseInt(mo)-1).toLocaleDateString('ru',{month:'long',year:'numeric'})
          return s.charAt(0).toUpperCase()+s.slice(1)
        }
        return (
          <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowStreakModal(false)}}>
            <div className="modal" style={{background:thm.modalBg,maxHeight:'88dvh'}}>
              <div className="modal-handle" style={{background:isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.12)'}}/>
              <div style={{padding:'16px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
                <span style={{fontSize:17,fontWeight:700,color:thm.text}}>Статистика месяца</span>
                <button onClick={()=>setShowStreakModal(false)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:thm.text50,lineHeight:1}}>×</button>
              </div>
              <div style={{overflowY:'auto',padding:'16px 20px 32px',flex:1}}>

                {/* Rank block */}
                <div style={{background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',borderRadius:20,padding:'24px 20px',marginBottom:12,border:`1px solid ${thm.border}`,textAlign:'center'}}>
                  <div style={{fontSize:56,marginBottom:8}}>{rank.icon}</div>
                  <div style={{fontSize:22,fontWeight:800,color:thm.text,marginBottom:4}}>{rank.name}</div>
                  <div style={{fontSize:13,color:thm.text50,marginBottom:16}}>{streak} тренировок в этом месяце</div>
                  {!rank.isMax && (
                    <div style={{marginBottom:16}}>
                      <div style={{height:6,background:isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${Math.round(rank.progress*100)}%`,background:'#FF9F0A',borderRadius:99,transition:'width 0.5s ease'}}/>
                      </div>
                      <div style={{fontSize:12,color:thm.text40,marginTop:6}}>{rank.nextAt - streak} тренировок до ранга «{rank.nextName}» {RANK_LEVELS.find(r=>r.name===rank.nextName)?.icon}</div>
                    </div>
                  )}
                  {rank.isMax && <div style={{fontSize:12,color:'#FF9F0A',marginBottom:16,fontWeight:700}}>Максимальный ранг достигнут! 🎉</div>}
                  <div style={{fontSize:14,color:thm.text70,fontStyle:'italic',lineHeight:1.5,marginBottom:10}}>«{streakMotivQuote}»</div>
                  <div style={{fontSize:13,color:thm.text50,fontStyle:'italic',lineHeight:1.5,borderTop:`1px solid ${thm.border}`,paddingTop:12,marginTop:4}}>
                    «{greatQ.text}»
                    <div style={{fontSize:11,color:thm.text35,marginTop:4}}>— {greatQ.author}</div>
                  </div>
                </div>

                {/* Month stats */}
                <div style={{background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',borderRadius:20,padding:'18px 20px',marginBottom:12,border:`1px solid ${thm.border}`}}>
                  <div style={{fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:thm.text40,marginBottom:14}}>Статистика месяца</div>
                  {streakModalData === null ? (
                    <div style={{textAlign:'center',color:thm.text40,fontSize:14,padding:'12px 0'}}>Загрузка...</div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:14,color:thm.text70}}>🏋️ Тренировок</span>
                        <span style={{fontSize:15,fontWeight:700,color:thm.text}}>{streak}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:14,color:thm.text70}}>📦 Поднято</span>
                        <span style={{fontSize:15,fontWeight:700,color:thm.text}}>{settings.units==='lbs'?`${Math.round(streakModalData.monthKg*2.20462)} lbs`:`${streakModalData.monthKg} кг`}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:14,color:thm.text70}}>🏆 Новых рекордов</span>
                        <span style={{fontSize:15,fontWeight:700,color:streakModalData.monthPRs>0?'#FF9F0A':thm.text}}>{streakModalData.monthPRs}</span>
                      </div>
                      {streakModalData.bestWorkout && (
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:14,color:thm.text70}}>🔝 Лучшая тренировка</span>
                          <span style={{fontSize:14,fontWeight:600,color:thm.text,textAlign:'right'}}>
                            {formatDateShort(streakModalData.bestWorkout.date)} · {settings.units==='lbs'?`${Math.round(streakModalData.bestWorkout.kg*2.20462)} lbs`:`${streakModalData.bestWorkout.kg} кг`}
                          </span>
                        </div>
                      )}
                      {streakModalData.bestImprovement && (
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:4}}>
                          <span style={{fontSize:14,color:thm.text70}}>📈 Лучший прирост</span>
                          <span style={{fontSize:14,fontWeight:600,color:'#FF9F0A',textAlign:'right',maxWidth:'55%'}}>
                            {streakModalData.bestImprovement.name} +{settings.units==='lbs'?`${Math.round(streakModalData.bestImprovement.diff*2.20462)} lbs`:`${streakModalData.bestImprovement.diff} кг`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Past 3 months */}
                {streakModalData && streakModalData.past3.some(m=>m.count>0) && (
                  <div style={{background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',borderRadius:20,padding:'18px 20px',border:`1px solid ${thm.border}`}}>
                    <div style={{fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:thm.text40,marginBottom:14}}>Прошлые месяцы</div>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {streakModalData.past3.map(m => {
                        const r = getRank(m.count)
                        return (
                          <div key={m.month} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:20}}>{m.count>0?r.icon:'💤'}</span>
                              <div>
                                <div style={{fontSize:13,color:thm.text70}}>{fMonth(m.month)}</div>
                                <div style={{fontSize:12,color:thm.text40}}>{m.count>0?r.name:'Нет тренировок'}</div>
                              </div>
                            </div>
                            <div style={{fontSize:15,fontWeight:700,color:thm.text}}>{m.count} <span style={{fontSize:12,color:thm.text40,fontWeight:500}}>тр.</span></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

              {/* Edit set modal */}
              {editSetModal && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setEditSetModal(null)}>
                  <div style={{background:'#1C1C1E',borderRadius:'20px 20px 0 0',padding:24,width:'100%',maxWidth:480}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontSize:17,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:20}}>Изменить подход</div>
                    {editSetModal.isTimed ? (
                      <div style={{marginBottom:16}}>
                        <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:8}}>Секунды</div>
                        <input type="number" value={editSetModal.weight} onChange={e=>setEditSetModal(m=>({...m,weight:+e.target.value}))}
                          style={{width:'100%',padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:16,boxSizing:'border-box'}}/>
                      </div>
                    ) : (
                      <div style={{display:'flex',gap:12,marginBottom:16}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:8}}>Вес (кг)</div>
                          <input type="number" value={editSetModal.weight} onChange={e=>setEditSetModal(m=>({...m,weight:+e.target.value}))}
                            style={{width:'100%',padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:16,boxSizing:'border-box'}}/>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:8}}>Повторения</div>
                          <input type="number" value={editSetModal.reps} onChange={e=>setEditSetModal(m=>({...m,reps:+e.target.value}))}
                            style={{width:'100%',padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:16,boxSizing:'border-box'}}/>
                        </div>
                      </div>
                    )}
                    <button onClick={()=>{
                      setWorkoutExercises(prev=>prev.map((e,i)=>i!==editSetModal.exIdx?e:{...e,sets:e.sets.map((ss,j)=>j!==editSetModal.setIdx?ss:{...ss,weight:editSetModal.weight,reps:editSetModal.reps})}))
                      setEditSetModal(null)
                    }} style={{width:'100%',padding:'14px',borderRadius:14,background:'#FF9F0A',color:'#000',fontSize:16,fontWeight:700,border:'none',cursor:'pointer'}}>
                      Сохранить
                    </button>
                  </div>
                </div>
              )}

              {/* Plan selection modal */}
              {showPlanModal && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setShowPlanModal(false)}>
                  <div style={{background:'#1C1C1E',borderRadius:24,padding:24,width:'100%',maxWidth:400}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontSize:19,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:6}}>Выбери план тренировок</div>
                    <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:16}}>Gym BRO будет подбирать упражнения и веса автоматически</div>
                    {activePlans.length > 0 && (
                      <div style={{marginBottom:16}}>
                        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',color:'rgba(255,255,255,0.3)',marginBottom:8}}>Активные планы</div>
                        {activePlans.map(plan => {
                          const days = PLAN_DAYS[plan.plan_type] || []
                          const dayIdx = (plan.current_day - 1) % days.length
                          const dayDef = days[dayIdx]
                          const week = Math.floor((plan.workout_count) / days.length) + 1
                          return (
                            <div key={plan.id} onClick={()=>setShowPlanModal(false)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(255,255,255,0.06)',borderRadius:12,padding:'10px 12px',marginBottom:8,cursor:'pointer'}}>
                              <div>
                                <div style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.9)'}}>{PLAN_ICONS[plan.plan_type]} {PLAN_NAMES[plan.plan_type]}</div>
                                <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>{dayDef?.label} · Неделя {week}</div>
                              </div>
                              <button onClick={e=>{e.stopPropagation();setConfirmDeletePlan(plan)}} style={{background:'rgba(255,59,48,0.12)',border:'none',color:'#FF453A',width:28,height:28,borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {activePlans.length < 2 && (
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                        {['strength','mass','cut','fit'].map(type => (
                          <button key={type} onClick={async ()=>{
                            setShowPlanModal(false)
                            const days = PLAN_DAYS[type]
                            const slot = activePlans.length + 1
                            const { data: plan } = await supabase.from('workout_plans').insert({
                              user_id: user.id, plan_type: type, slot, total_days: days.length,
                              current_day: 1, workout_count: 0
                            }).select().single()
                            if (plan) {
                              setActivePlans(prev => [...prev, plan])
                              setPlanOnboarding(true)
                            }
                          }} style={{padding:'18px 12px',borderRadius:16,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',cursor:'pointer',textAlign:'left'}}>
                            <div style={{fontSize:28,marginBottom:8}}>{PLAN_ICONS[type]}</div>
                            <div style={{fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.9)'}}>{PLAN_NAMES[type]}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confirm delete plan modal */}
              {confirmDeletePlan && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1002,display:'flex',alignItems:'center',justifyContent:'center',padding:32}}>
                  <div style={{background:'#1C1C1E',borderRadius:20,padding:24,width:'100%',maxWidth:320,textAlign:'center'}}>
                    <div style={{fontSize:16,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:8}}>Удалить план «{PLAN_NAMES[confirmDeletePlan.plan_type]}»?</div>
                    <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:24}}>Прогресс весов будет сохранён.</div>
                    <div style={{display:'flex',gap:10}}>
                      <button onClick={()=>setConfirmDeletePlan(null)} style={{flex:1,padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'rgba(255,255,255,0.6)',fontSize:15,fontWeight:600,cursor:'pointer'}}>Отмена</button>
                      <button onClick={async ()=>{
                        await supabase.from('workout_plans').update({is_active:false}).eq('id',confirmDeletePlan.id)
                        setActivePlans(prev => prev.filter(p => p.id !== confirmDeletePlan.id))
                        setConfirmDeletePlan(null)
                      }} style={{flex:1,padding:'12px',borderRadius:12,border:'none',background:'rgba(255,59,48,0.85)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>Удалить</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Onboarding modal */}
              {planOnboarding && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
                  <div style={{background:'#1C1C1E',borderRadius:24,padding:28,maxWidth:360,width:'100%',textAlign:'center'}}>
                    <div style={{fontSize:36,marginBottom:16}}>👋</div>
                    <div style={{fontSize:20,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:12}}>Первая тренировка</div>
                    <div style={{fontSize:15,color:'rgba(255,255,255,0.55)',lineHeight:1.6,marginBottom:24}}>
                      Сегодня найдём твой стартовый вес.<br/>
                      Возьми вес с которым сделаешь нужное количество повторений комфортно — не на максимуме.<br/><br/>
                      Gym BRO запомнит и будет считать прогрессию сам.
                    </div>
                    <button onClick={()=>setPlanOnboarding(false)} style={{width:'100%',padding:'14px',borderRadius:14,background:'#FF9F0A',color:'#000',fontSize:16,fontWeight:700,border:'none',cursor:'pointer'}}>
                      Понятно, начинаем!
                    </button>
                  </div>
                </div>
              )}

              {/* Day preview modal */}
              {showDayPreview && (()=>{
                const {plan, dayIdx, dayDef} = showDayPreview
                const week = Math.floor(plan.workout_count / (PLAN_DAYS[plan.plan_type]?.length||1)) + 1
                return (
                  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowDayPreview(null)}>
                    <div style={{background:'#1C1C1E',borderRadius:'20px 20px 0 0',padding:24,width:'100%',maxWidth:480,paddingBottom:40,maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
                      <div style={{fontSize:17,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:4}}>{dayDef.label}</div>
                      <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:4}}>{PLAN_ICONS[plan.plan_type]} {PLAN_NAMES[plan.plan_type]} · Неделя {week} · тренировка {plan.workout_count+1}</div>
                      <div style={{fontSize:13,color:'#FF9F0A',marginBottom:16}}>⚡ Разогрей {dayDef.warmupHint}</div>
                      {dayDef.exercises.map((ex,i) => {
                        const key = `${plan.id}:${ex.name}`
                        const pw = planWeights[key]
                        const hasWeight = pw && pw.working_weight > 0
                        return (
                          <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'rgba(255,255,255,0.05)',borderRadius:12,marginBottom:6}}>
                            <div>
                              <span style={{fontSize:14,fontWeight:600,color:'rgba(255,255,255,0.85)'}}>{ex.name}</span>
                              {ex.isBase && <span style={{fontSize:11,color:'#FF9F0A',marginLeft:6,fontWeight:600}}>база</span>}
                            </div>
                            <span style={{fontSize:13,color:'rgba(255,255,255,0.45)',fontWeight:600}}>
                              {hasWeight ? `${pw.working_weight}кг × ${ex.reps} × ${ex.sets}` : `? × ${ex.reps} × ${ex.sets}`}
                            </span>
                          </div>
                        )
                      })}
                      <button disabled={loadingPlan} onClick={async ()=>{
                        setLoadingPlan(true)
                        try {
                          // веса плана для всех упражнений запрашиваются параллельно, а не по очереди
                          const newExercises = await Promise.all(dayDef.exercises.map(async ex => {
                            const key = `${plan.id}:${ex.name}`
                            let pw = planWeights[key]
                            if (!pw) {
                              const { data: inserted } = await supabase.from('plan_weights').insert({
                                user_id: user.id, plan_id: plan.id, exercise_name: ex.name,
                                working_weight: 0, target_reps: ex.reps, target_sets: ex.sets
                              }).select().single()
                              pw = inserted
                              if (pw) setPlanWeights(prev => ({...prev, [key]: pw}))
                            }
                            const wt = pw?.working_weight || 0
                            const sets = Array.from({length: ex.sets}, () => ({weight: wt, reps: ex.reps, done: false}))
                            return {name: ex.name, grip: getDefaultVariant(ex.name), open: true, lastSession: null, sets, planId: plan.id, isBase: ex.isBase}
                          }))
                          setWorkoutExercises(prev => {
                            const existing = prev.filter(e => !newExercises.some(n => n.name === e.name))
                            return [...existing, ...newExercises]
                          })
                          if (!workoutStarted) setWorkoutStarted(true)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        } finally {
                          setLoadingPlan(false)
                          setShowDayPreview(null)
                        }
                      }} style={{width:'100%',marginTop:16,padding:'14px',borderRadius:14,background:'#FF9F0A',color:'#000',fontSize:16,fontWeight:700,border:'none',cursor:loadingPlan?'default':'pointer',opacity:loadingPlan?0.7:1}}>
                        {loadingPlan ? 'Загружаю упражнения…' : 'Загрузить в тренировку'}
                      </button>
                      <button onClick={()=>setShowDayPreview(null)} style={{width:'100%',marginTop:8,padding:'12px',borderRadius:14,border:'none',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:14,cursor:'pointer'}}>
                        ← Закрыть
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* Rating modal */}
              {showRatingModal && pendingRatingPlan && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
                  <div style={{background:'#1C1C1E',borderRadius:24,padding:28,maxWidth:360,width:'100%',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:20}}>Как прошла тренировка? 💪</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
                      {[{key:'hard',label:'😓 Тяжело'},{key:'ok',label:'😐 Нормально'},{key:'good',label:'😊 Хорошо'},{key:'super',label:'🔥 Супер'}].map(r=>(
                        <button key={r.key} onClick={async ()=>{
                          const completedMap = {}
                          for (const ex of workoutExercises) {
                            if (ex.planId === pendingRatingPlan.id) {
                              completedMap[ex.name] = ex.sets.filter(s=>s.done).length
                            }
                          }
                          await applyProgression(pendingRatingPlan, r.key, completedMap)
                          setShowRatingModal(false)
                          setPendingRatingPlan(null)
                          setSaved(true)
                          setTimeout(() => { setSaved(false); setWorkoutStarted(false); setWorkoutExercises([]) }, 1000)
                        }} style={{padding:'14px',borderRadius:14,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.85)',fontSize:15,fontWeight:600,cursor:'pointer'}}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

      {showComingSoon && (
        <div onClick={()=>setShowComingSoon(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div onClick={e=>e.stopPropagation()} style={{textAlign:'center',padding:'32px 24px',background:'rgba(28,28,30,0.98)',borderRadius:16,width:'100%',maxWidth:320,boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
            <div style={{fontSize:48,marginBottom:16}}>🚧</div>
            <div style={{fontSize:20,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:12}}>В разработке</div>
            <div style={{fontSize:15,color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:28}}>Эта функция совсем скоро появится в Gym BRO. Следи за обновлениями! 💪</div>
            <button onClick={()=>setShowComingSoon(false)} style={{width:'100%',padding:'14px',borderRadius:14,background:'#FF9F0A',color:'#000',fontSize:16,fontWeight:700,border:'none',cursor:'pointer'}}>Понятно</button>
          </div>
        </div>
      )}

      <div className="nav-bar">
        {[{id:'add',icon:'➕',label:'Тренировка'},{id:'history',icon:'📜',label:'История'},{id:'progress',icon:'📈',label:'Прогресс'},{id:'exercises',icon:'📋',label:'Упражнения'}].map(t=>(
          <div key={t.id} className="nav-item" style={{opacity:tab===t.id?1:0.62}} onClick={()=>{setTab(t.id);if(t.id!=='add'){setWorkoutStarted(false);setSelectedEx(null)}}}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-lbl" style={{color:tab===t.id?'#FF9F0A':'white'}}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
