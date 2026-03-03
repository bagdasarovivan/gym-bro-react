import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

const HEAVY_WEIGHTS = Array.from({ length: 61 }, (_, i) => i * 5)
const LIGHT_WEIGHTS = [...new Set([
  ...Array.from({ length: 11 }, (_, i) => i),
  ...Array.from({ length: 21 }, (_, i) => 10 + i * 2),
  ...Array.from({ length: 21 }, (_, i) => 50 + i * 5),
])].sort((a, b) => a - b)
const REPS_OPTIONS = Array.from({ length: 51 }, (_, i) => i)
const TIME_OPTIONS = Array.from({ length: 51 }, (_, i) => i * 5)

const EXERCISE_TYPE = {
  'Bench Press':'heavy','Squat':'heavy','Deadlift':'heavy','Romanian Deadlift':'heavy',
  'Overhead Press':'heavy','Leg Press':'heavy','Barbell Row':'heavy','Lat Pulldown':'heavy',
  'Seated Cable Row':'heavy','Incline Dumbbell Press':'light','Dumbbell Bench':'light',
  'Dumbbell Flyes':'light','Flat Dumbbell Flyes':'light','Lunges':'light','Leg Curl':'light',
  'Leg Extension':'light','Push-Ups':'light','Pull-Ups':'light','Crunches':'light',
  'Hyperextension':'light','Biceps':'light','Triceps':'light','Plank':'timed',
  'Arnold Press':'light','Cable Fly':'light','Bulgarian Split Squat':'light',
  'Hammer Curl':'light','Skull Crushers':'light','Face Pull':'light',
  'Hip Thrust':'heavy','Shrugs':'heavy','Dips':'light','T-Bar Row':'heavy',
}

const EXERCISE_IMAGES = {
  'Bench Press':'/images/bench.png','Squat':'/images/squat.png','Deadlift':'/images/deadlift.png',
  'Overhead Press':'/images/ohp.png','Biceps':'/images/biceps.png','Triceps':'/images/triceps.png',
  'Dumbbell Flyes':'/images/dumbbell_flyes.png','Romanian Deadlift':'/images/romanian_deadlift.png',
  'Incline Dumbbell Press':'/images/incline_dumbbell_press.png','Lat Pulldown':'/images/lat_pulldown.png',
  'Seated Cable Row':'/images/seated_cable_row.png','Dumbbell Bench':'/images/dumbbell_bench.png',
  'Push-Ups':'/images/push_ups.png','Leg Press':'/images/leg_press.png','Lunges':'/images/lunges.png',
  'Leg Curl':'/images/leg_curl.png','Leg Extension':'/images/leg_extension.png',
  'Barbell Row':'/images/barbell_row.png','Pull-Ups':'/images/pull_ups.png','Plank':'/images/plank.png',
  'Crunches':'/images/crunches.png','Flat Dumbbell Flyes':'/images/flat_dumbbell_flyes.png',
  'Hyperextension':'/images/hyperextension.png',
  'Arnold Press':'/images/arnold_press.png','Cable Fly':'/images/cable_fly.png',
  'Bulgarian Split Squat':'/images/bulgarian_split_squat.png','Hammer Curl':'/images/hammer_curl.png',
  'Skull Crushers':'/images/skull_crushers.png','Face Pull':'/images/face_pull.png',
  'Hip Thrust':'/images/hip_thrust.png','Shrugs':'/images/shrugs.png',
  'Dips':'/images/dips.png','T-Bar Row':'/images/t_bar_row.png',
}



const EXERCISE_MUSCLES = {
  'Bench Press':       ['chest','triceps','shoulders'],
  'Incline Dumbbell Press': ['chest','shoulders','triceps'],
  'Dumbbell Bench':    ['chest','triceps','shoulders'],
  'Dumbbell Flyes':    ['chest','shoulders'],
  'Flat Dumbbell Flyes':['chest','shoulders'],
  'Cable Fly':         ['chest','shoulders'],
  'Push-Ups':          ['chest','triceps','shoulders'],
  'Overhead Press':    ['shoulders','triceps','traps'],
  'Arnold Press':      ['shoulders','triceps'],
  'Lateral Raise':     ['shoulders'],
  'Face Pull':         ['shoulders','upper_back','traps'],
  'Shrugs':            ['traps','upper_back'],
  'Squat':             ['quads','glutes','lower_back','hamstrings'],
  'Bulgarian Split Squat':['quads','glutes','hamstrings'],
  'Leg Press':         ['quads','glutes'],
  'Leg Extension':     ['quads'],
  'Lunges':            ['quads','glutes','hamstrings'],
  'Deadlift':          ['lower_back','glutes','hamstrings','traps','lats'],
  'Romanian Deadlift': ['hamstrings','glutes','lower_back'],
  'Hip Thrust':        ['glutes','hamstrings'],
  'Leg Curl':          ['hamstrings'],
  'Barbell Row':       ['lats','upper_back','biceps','traps'],
  'Seated Cable Row':  ['lats','upper_back','biceps'],
  'Lat Pulldown':      ['lats','biceps','upper_back'],
  'T-Bar Row':         ['lats','upper_back','biceps'],
  'Pull-Ups':          ['lats','biceps','upper_back'],
  'Biceps':            ['biceps','forearms'],
  'Hammer Curl':       ['biceps','forearms'],
  'Triceps':           ['triceps'],
  'Skull Crushers':    ['triceps'],
  'Dips':              ['triceps','chest','shoulders'],
  'Hyperextension':    ['lower_back','glutes','hamstrings'],
  'Crunches':          ['abs'],
  'Plank':             ['abs','lower_back'],
}

const EXERCISES = Object.keys(EXERCISE_IMAGES).sort((a, b) => a.localeCompare(b))

const DEFAULT_FAVORITES = ['Bench Press','Squat','Deadlift']

function getWeightOptions(exName) {
  const t = EXERCISE_TYPE[exName] || 'light'
  return t === 'heavy' ? HEAVY_WEIGHTS : t === 'timed' ? TIME_OPTIONS : LIGHT_WEIGHTS
}

function formatMonth(m) {
  if (!m) return ''
  const [y,mo] = m.split('-')
  const s = new Date(parseInt(y), parseInt(mo)-1).toLocaleDateString('ru', {month:'long', year:'numeric'})
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDateShort(d) {
  return new Date(d).toLocaleDateString('ru', { day:'numeric', month:'long' })
}

function daysAgo(d) {
  const diff = Math.floor((new Date() - new Date(d)) / 86400000)
  if (diff === 0) return 'сегодня'
  if (diff === 1) return 'вчера'
  return `${diff} дн. назад`
}

function todayLabel() {
  return new Date().toLocaleDateString('ru', { weekday:'long', day:'numeric', month:'long' })
}

function buildCopyText(date, workouts) {
  const lines = [`📅 ${date} · ${workouts.length} exercises`]
  workouts.forEach(w => {
    const sets = w.sets?.sort((a,b) => b.set_no-a.set_no)
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
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:flex-end;justify-content:center;animation:fov 0.2s ease;backdrop-filter:blur(8px)}
@keyframes fov{from{opacity:0}to{opacity:1}}
.modal{background:#1c1c1e;border-radius:20px 20px 0 0;width:100%;max-width:480px;max-height:85vh;display:flex;flex-direction:column;animation:sup 0.3s cubic-bezier(0.34,1.1,0.64,1)}
@keyframes sup{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal-handle{width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:10px auto 0;flex-shrink:0}
.modal-hdr{padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0}
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

function MuscleMap({ muscleScores }) {
  const [hovered, setHovered] = useState(null)

  const getColor = (muscle) => {
    const score = muscleScores[muscle] || 0
    if (score === 0) return 'rgba(255,255,255,0)'
    if (score < 0.33) return 'rgba(255,214,0,0.35)'
    if (score < 0.66) return 'rgba(255,140,0,0.45)'
    return 'rgba(255,59,48,0.55)'
  }
  const getStroke = (muscle) => {
    const score = muscleScores[muscle] || 0
    if (score === 0) return hovered === muscle ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0)'
    if (score < 0.33) return 'rgba(255,214,0,0.8)'
    if (score < 0.66) return 'rgba(255,140,0,0.9)'
    return 'rgba(255,59,48,1)'
  }
  const muscleNames = {
    chest:'Грудь', shoulders:'Плечи', biceps:'Бицепс', triceps:'Трицепс',
    abs:'Пресс', quads:'Квадрицепс', calves:'Икры', forearms:'Предплечья',
    upper_back:'Верхняя спина', lats:'Широчайшие', lower_back:'Поясница',
    glutes:'Ягодицы', hamstrings:'Бицепс бедра', traps:'Трапеции'
  }

  // SVG viewBox matches image 1536x1024
  // Front figure center ~384, Back figure center ~1130
  const zones = {
    // === FRONT ===
    // chest
    chest: "M 295,295 Q 340,275 385,280 Q 430,275 470,295 Q 480,330 470,365 Q 430,385 385,382 Q 340,385 295,365 Q 280,330 295,295 Z",
    // shoulders front
    shoulders: "M 230,270 Q 255,245 290,255 Q 305,275 300,310 Q 275,330 250,320 Q 225,305 230,270 Z M 470,255 Q 505,245 530,270 Q 535,305 510,320 Q 485,330 460,310 Q 455,275 470,255 Z",
    // biceps
    biceps: "M 205,330 Q 225,320 245,330 Q 255,360 252,395 Q 240,415 220,412 Q 200,405 195,375 Q 190,350 205,330 Z M 515,330 Q 535,320 555,330 Q 568,350 563,375 Q 558,405 538,412 Q 518,415 506,395 Q 503,360 515,330 Z",
    // triceps front
    triceps: "M 245,332 Q 265,322 278,335 Q 285,360 280,395 Q 268,415 252,412 Q 240,400 240,375 Q 238,355 245,332 Z M 482,332 Q 495,322 515,332 Q 520,355 518,375 Q 518,400 506,412 Q 490,415 478,395 Q 473,360 482,332 Z",
    // forearms
    forearms: "M 193,418 Q 215,410 235,420 Q 245,448 248,478 Q 240,495 222,493 Q 200,488 190,460 Q 185,440 193,418 Z M 525,418 Q 545,410 567,418 Q 575,440 570,460 Q 560,488 538,493 Q 520,495 512,478 Q 515,448 525,418 Z",
    // abs
    abs: "M 320,378 Q 355,368 385,372 Q 415,368 450,378 Q 460,410 458,450 Q 456,490 450,520 Q 415,530 385,528 Q 355,530 320,520 Q 314,490 312,450 Q 310,410 320,378 Z",
    // quads
    quads: "M 318,570 Q 345,558 372,565 Q 388,595 390,640 Q 390,690 380,730 Q 360,748 340,742 Q 315,732 308,700 Q 300,660 303,620 Q 305,590 318,570 Z M 398,565 Q 425,558 452,570 Q 465,590 467,620 Q 470,660 462,700 Q 455,732 430,742 Q 410,748 390,730 Q 380,690 380,640 Q 382,595 398,565 Z",
    // calves
    calves: "M 318,800 Q 340,792 358,800 Q 368,825 366,862 Q 362,895 345,905 Q 328,908 318,893 Q 308,870 308,843 Q 308,818 318,800 Z M 400,800 Q 418,792 440,800 Q 450,818 450,843 Q 450,870 440,893 Q 430,908 413,905 Q 396,895 392,862 Q 390,825 400,800 Z",

    // === BACK ===
    // traps
    traps: "M 978,268 Q 1020,248 1065,255 Q 1110,248 1152,268 Q 1158,295 1148,318 Q 1108,330 1065,326 Q 1022,330 982,318 Q 972,295 978,268 Z",
    // upper_back
    upper_back: "M 990,325 Q 1025,315 1065,320 Q 1105,315 1140,325 Q 1155,355 1150,390 Q 1140,420 1105,432 Q 1065,438 1025,432 Q 990,420 980,390 Q 975,355 990,325 Z",
    // lats
    lats: "M 958,330 Q 982,318 998,332 Q 1005,365 1000,405 Q 992,435 972,445 Q 952,442 942,420 Q 935,395 940,365 Q 944,342 958,330 Z M 1132,330 Q 1148,318 1172,330 Q 1176,342 1180,365 Q 1185,395 1178,420 Q 1168,442 1148,445 Q 1128,435 1120,405 Q 1115,365 1122,332 Z",
    // lower_back
    lower_back: "M 1005,438 Q 1035,428 1065,432 Q 1095,428 1125,438 Q 1132,462 1128,490 Q 1118,515 1065,520 Q 1012,515 1002,490 Q 998,462 1005,438 Z",
    // glutes
    glutes: "M 998,528 Q 1028,518 1058,524 Q 1068,548 1065,580 Q 1060,610 1040,622 Q 1018,626 1002,610 Q 988,590 990,562 Q 992,542 998,528 Z M 1072,524 Q 1102,518 1132,528 Q 1138,542 1140,562 Q 1142,590 1128,610 Q 1112,626 1090,622 Q 1070,610 1065,580 Q 1062,548 1072,524 Z",
    // hamstrings
    hamstrings: "M 992,635 Q 1018,625 1042,635 Q 1055,660 1055,700 Q 1053,742 1040,765 Q 1022,778 1002,772 Q 982,762 975,738 Q 968,705 972,668 Q 976,645 992,635 Z M 1088,635 Q 1112,625 1138,635 Q 1154,645 1158,668 Q 1162,705 1155,738 Q 1148,762 1128,772 Q 1108,778 1090,765 Q 1077,742 1075,700 Q 1075,660 1088,635 Z",
    // calves back
    calves_back: "M 988,782 Q 1010,774 1030,782 Q 1042,805 1042,835 Q 1040,868 1025,882 Q 1008,888 995,875 Q 980,858 978,828 Q 976,805 988,782 Z M 1100,782 Q 1120,774 1142,782 Q 1154,805 1152,828 Q 1150,858 1135,875 Q 1122,888 1105,882 Q 1090,868 1088,835 Q 1088,805 1100,782 Z",
  }

  const score = muscleScores[hovered] || 0
  const scoreColor = score > 0.66 ? '#FF453A' : score > 0.33 ? '#FF9F0A' : score > 0 ? '#FFD60A' : 'rgba(255,255,255,0.3)'

  const handleZone = (muscle) => ({
    fill: hovered === muscle ? (score > 0 ? getColor(muscle) : 'rgba(255,255,255,0.12)') : getColor(muscle),
    stroke: hovered === muscle ? (score > 0 ? getStroke(muscle) : 'rgba(255,255,255,0.5)') : getStroke(muscle),
    strokeWidth: hovered === muscle ? 1.5 : 0.8,
    style: { cursor: 'pointer', transition: 'all 0.15s' },
    onMouseEnter: () => setHovered(muscle),
    onMouseLeave: () => setHovered(null),
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
              {score > 0 ? Math.round(score*100)+'% нагрузки' : 'не тренируется'}
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
          <path d={zones.shoulders} {...handleZone('shoulders')}/>
          <path d={zones.biceps} {...handleZone('biceps')}/>
          <path d={zones.triceps} {...handleZone('triceps')}/>
          <path d={zones.forearms} {...handleZone('forearms')}/>
          <path d={zones.abs} {...handleZone('abs')}/>
          <path d={zones.quads} {...handleZone('quads')}/>
          <path d={zones.calves} {...handleZone('calves')}/>

          {/* BACK zones */}
          <path d={zones.traps} {...handleZone('traps')}/>
          <path d={zones.upper_back} {...handleZone('upper_back')}/>
          <path d={zones.lats} {...handleZone('lats')}/>
          <path d={zones.lower_back} {...handleZone('lower_back')}/>
          <path d={zones.glutes} {...handleZone('glutes')}/>
          <path d={zones.hamstrings} {...handleZone('hamstrings')}/>
          <path d={zones.calves_back} {...handleZone('calves_back')}/>
        </svg>
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:14,flexWrap:'wrap'}}>
        {[
          ['rgba(255,59,48,0.6)','rgba(255,59,48,1)','Много'],
          ['rgba(255,140,0,0.5)','rgba(255,140,0,0.9)','Средне'],
          ['rgba(255,214,0,0.4)','rgba(255,214,0,0.8)','Мало'],
          ['rgba(255,255,255,0.08)','rgba(255,255,255,0.3)','Не тренируется'],
        ].map(([fill,stroke,label])=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:12,height:12,borderRadius:3,background:fill,border:`1px solid ${stroke}`}}/>
            <span style={{fontSize:11,opacity:0.45}}>{label}</span>
          </div>
        ))}
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
              {opt} {unit && <span className="dpicker-opt-unit">{unit}</span>}
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
    editSets: w.sets?.sort((a,b) => a.set_no-b.set_no).map(s => ({ weight: String(s.weight), reps: String(s.reps) })) || []
  })))

  const upd = (wi, si, f, v) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:w.editSets.map((s,j) => j!==si?s:{...s,[f]:v})}))
  const del = (wi, si) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:w.editSets.filter((_,j)=>j!==si)}))
  const add = (wi) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:[...w.editSets,{weight:'0',reps:'0'}]}))

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target.classList.contains('modal-overlay'))onClose()}}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-hdr">
          <div className="modal-title" style={{marginBottom:0}}>✏️ {formatDateShort(data.date)}</div>
        </div>
        <div className="modal-body">
          {workouts.map((w, wi) => (
            <div key={w.id} style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10,opacity:0.7}}>{w.exercises?.name}</div>
              {w.editSets.map((s,si) => (
                <div key={si} className="edit-row">
                  <span style={{opacity:0.3,width:18,fontSize:12,textAlign:'center'}}>{si+1}</span>
                  <input className="edit-inp" type="number" value={s.weight} onChange={e=>upd(wi,si,'weight',e.target.value)} placeholder="кг"/>
                  <span style={{opacity:0.3,fontSize:14}}>×</span>
                  <input className="edit-inp" type="number" value={s.reps} onChange={e=>upd(wi,si,'reps',e.target.value)} placeholder="повт"/>
                  <button className="edit-del" onClick={()=>del(wi,si)}>✕</button>
                </div>
              ))}
              <button className="set-btn" style={{width:'100%',marginTop:4}} onClick={()=>add(wi)}>➕ Подход</button>
              <button className="edit-save-btn" onClick={()=>onSave(w.id,w.editSets)}>💾 Сохранить {w.exercises?.name}</button>
            </div>
          ))}
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
  const [timerSecs, setTimerSecs] = useState(null)
  const [timerDuration, setTimerDuration] = useState(90)
  const timerRef = useRef(null)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [timerMode, setTimerMode] = useState('countdown')
  const [stopwatchSecs, setStopwatchSecs] = useState(0)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  const stopwatchRef = useRef(null)
  const [prAlert, setPrAlert] = useState(null)
  const [streakAlert, setStreakAlert] = useState(null)
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
    const weighted = EXERCISES.find(e => !['Crunches','Plank','Push-Ups','Pull-Ups'].includes(e))
    if (!chartEx) setChartEx(weighted || EXERCISES[0])
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('workouts').select('workout_date').order('workout_date', { ascending: false })
      if (!data?.length) return
      const dates = [...new Set(data.map(r => r.workout_date))].sort().reverse()
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (dates[0] < yesterday) return
      let s = 0; let exp = new Date(dates[0])
      for (const d of dates) { const c = new Date(d); if (c.toDateString() === exp.toDateString()) { s++; exp.setDate(exp.getDate()-1) } else break }
      setStreak(s)
      if ([7,30,100].includes(s)) {
        setStreakAlert(s)
        setTimeout(() => setStreakAlert(null), 4000)
      }
    }
    load()
  }, [saved])

  useEffect(() => {
    if (tab !== 'history') return
    supabase.from('workouts').select('id,workout_date,exercises(name),sets(set_no,weight,reps,time_sec)')
      .order('workout_date', { ascending: false }).order('id', { ascending: false }).limit(200)
      .then(({ data }) => setHistory(data || []))
  }, [tab, saved])

  useEffect(() => {
    if (tab !== 'progress') return
    async function load() {
      const { data: wData } = await supabase.from('workouts').select('workout_date')
      const { data: sData } = await supabase.from('sets').select('weight,reps').gt('weight',0).gt('reps',0)
      const totalW = new Set(wData?.map(w => w.workout_date)).size
      const thisM = new Date().toISOString().slice(0,7)
      const monthW = new Set(wData?.filter(w => w.workout_date.startsWith(thisM)).map(w => w.workout_date)).size
      const totalKg = sData?.reduce((s,r) => s+r.weight*r.reps, 0) || 0
      setStats({ totalW, monthW, totalKg })
      const { data: pData } = await supabase.from('workouts').select('workout_date,exercises(name),sets(weight,reps)')
      const map = {}
      pData?.forEach(w => {
        const name = w.exercises?.name; if (!name) return
        w.sets?.forEach(s => { if (s.weight>0&&s.reps>0) { const est=s.weight*(1+s.reps/30); if (!map[name]||est>map[name].est) map[name]={est:parseFloat(est.toFixed(1)),weight:s.weight,reps:s.reps,date:w.workout_date} } })
      })
      setPrs(Object.entries(map).sort((a,b) => b[1].est-a[1].est))
    }
    load()
  }, [tab])

  useEffect(() => {
    if (tab !== 'progress') return
    async function load() {
      const start = `${calYear}-${String(calMonth+1).padStart(2,'0')}-01`
      const end = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${new Date(calYear,calMonth+1,0).getDate()}`
      const { data } = await supabase.from('workouts').select('workout_date,sets(weight,reps)').gte('workout_date',start).lte('workout_date',end)
      const map = {}
      data?.forEach(w => { const d=new Date(w.workout_date).getDate(); if(!map[d]) map[d]=0; w.sets?.forEach(s => { if(s.weight>0&&s.reps>0) map[d]+=s.weight*s.reps }) })
      setCalData(map)
    }
    load()
  }, [tab, calYear, calMonth])

  useEffect(() => {
    if (!chartEx || tab !== 'progress') return
    async function load() {
      const { data: ex } = await supabase.from('exercises').select('id').eq('name',chartEx).single()
      if (!ex) return
      const { data } = await supabase.from('workouts').select('workout_date,sets(weight,reps)').eq('exercise_id',ex.id).order('workout_date',{ascending:true}).limit(30)
      const pts = (data||[]).map(w => ({ val: Math.max(...(w.sets?.filter(s=>s.weight>0).map(s=>s.weight)||[0])), label: new Date(w.workout_date).toLocaleDateString('ru',{day:'numeric',month:'short'}) })).filter(p=>p.val>0)
      setChartData(pts)
    }
    load()
  }, [chartEx, tab])

  useEffect(() => {
    if (!selectedEx) return
    async function load() {
      let { data: ex } = await supabase.from('exercises').select('id').eq('name',selectedEx).single()
      if (!ex) { setLastSession(null); return }
      const { data } = await supabase.from('workouts').select('workout_date,sets(set_no,weight,reps,time_sec)').eq('exercise_id',ex.id).order('workout_date',{ascending:false}).limit(1).single()
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
  const saveWorkout = async () => {
    const filled = sets.filter(s => s.weight > 0 && s.reps > 0)
    if (!filled.length) return
    // Upsert exercise to ensure it exists in DB
    let { data: ex } = await supabase.from('exercises').select('id').eq('name',selectedEx).single()
    if (!ex) {
      const { data: inserted } = await supabase.from('exercises').insert({ name: selectedEx }).select().single()
      ex = inserted
    }
    if (!ex) return
    const { data: w } = await supabase.from('workouts').insert({ workout_date: new Date().toISOString().split('T')[0], exercise_id: ex.id }).select().single()
    await supabase.from('sets').insert(filled.map((s,i) => ({ workout_id:w.id, set_no:i+1, weight:s.weight, reps:s.reps, time_sec:null })))
    // Check for new PR
    const maxSaved = Math.max(...filled.map(s => s.weight))
    const repsSaved = filled.find(s => s.weight === maxSaved)?.reps || 0
    const existingPr = prs.find(([name]) => name === selectedEx)
    if (existingPr) {
      const [,pr] = existingPr
      if (maxSaved > pr.weight) {
        setPrAlert({ name: selectedEx, weight: maxSaved, reps: repsSaved, prev: pr.weight })
        if (navigator.vibrate) navigator.vibrate([100,50,100,50,300])
        setTimeout(() => setPrAlert(null), 4000)
      }
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setSelectedEx(null) }, 1500)
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
    const { data } = await supabase.from('workouts').select('id,exercises(name),sets(set_no,weight,reps,time_sec)').eq('workout_date',dateStr)
    setCalDayModal({ date: dateStr, workouts: data || [] })
  }

  const saveEdit = async (workoutId, newSets) => {
    await supabase.from('sets').delete().eq('workout_id', workoutId)
    await supabase.from('sets').insert(newSets.map((s,i) => ({ workout_id:workoutId, set_no:i+1, weight:parseFloat(s.weight)||0, reps:parseInt(s.reps)||0, time_sec:null })))
    setEditModal(null); setSaved(p => !p)
  }

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(modalSearch.toLowerCase()))
  const favFiltered = filtered.filter(e => favorites.includes(e.name))
  const restFiltered = filtered.filter(e => !favorites.includes(e.name))
  const grouped = history.reduce((acc,w) => { if(!acc[w.workout_date]) acc[w.workout_date]=[]; acc[w.workout_date].push(w); return acc }, {})
  const calMonthName = new Date(calYear,calMonth).toLocaleDateString('ru',{month:'long',year:'numeric'})
  const firstDow = new Date(calYear,calMonth,1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear,calMonth+1,0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]
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
          <button onClick={() => setShowTimerModal(true)} style={{
            background:(timerSecs!==null||stopwatchRunning)?'rgba(255,159,10,0.15)':'rgba(255,255,255,0.08)',
            border:(timerSecs!==null||stopwatchRunning)?'1px solid rgba(255,159,10,0.4)':'1px solid rgba(255,255,255,0.1)',
            borderRadius:99,padding:'6px 12px',cursor:'pointer',
            color:(timerSecs!==null||stopwatchRunning)?'#FF9F0A':'rgba(255,255,255,0.8)',
            fontSize:(timerSecs!==null||stopwatchRunning)?13:18,
            fontWeight:700,fontVariantNumeric:'tabular-nums',border:'none',
            display:'flex',alignItems:'center'
          }}>
            {(timerSecs!==null||stopwatchRunning)
              ? (timerSecs!==null
                  ? `⏱ ${Math.floor(timerSecs/60)}:${String(timerSecs%60).padStart(2,'0')}`
                  : `⏲ ${Math.floor(stopwatchSecs/60)}:${String(stopwatchSecs%60).padStart(2,'0')}`)
              : '⏱'}
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
          <div className="date-label">{todayLabel()}</div>
          {(timerSecs !== null || stopwatchRunning) && (
            <div className="timer-card" style={{flexDirection:'column',gap:10,alignItems:'stretch'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div className="timer-lbl">{timerSecs!==null ? '⏱ Таймер отдыха' : '⏲ Секундомер'}</div>
                  <div className="timer-num" style={{marginTop:2}}>
                    {timerSecs!==null
                      ? `${Math.floor(timerSecs/60)}:${String(timerSecs%60).padStart(2,'0')}`
                      : `${Math.floor(stopwatchSecs/60)}:${String(stopwatchSecs%60).padStart(2,'0')}`}
                    {timerPaused && <span style={{fontSize:14,opacity:0.5,marginLeft:8,fontWeight:600}}>пауза</span>}
                  </div>
                </div>
                <button onClick={()=>{setTimerSecs(null);setTimerPaused(false);setStopwatchRunning(false);setStopwatchSecs(0)}}
                  style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:10,width:32,height:32,cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
              </div>
              {timerSecs !== null && (
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setTimerPaused(p=>!p)} style={{
                    flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,
                    background: timerPaused ? '#30D158' : 'rgba(255,159,10,0.15)',
                    color: timerPaused ? '#000' : '#FF9F0A'
                  }}>{timerPaused ? '▶ Продолжить' : '⏸ Пауза'}</button>
                  <button onClick={()=>{setTimerSecs(timerDuration);setTimerPaused(false)}} style={{
                    flex:1,padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,
                    background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)'
                  }}>↺ Заново</button>
                </div>
              )}
              {timerSecs !== null && (
                <div>
                  <div style={{fontSize:11,opacity:0.35,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>Изменить время</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {[30,60,90,120,180].map(t=>(
                      <button key={t} onClick={()=>{setTimerDuration(t);setTimerSecs(t);setTimerPaused(false)}} style={{
                        padding:'5px 12px',borderRadius:99,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',
                        background: timerDuration===t ? '#FF9F0A' : 'rgba(255,255,255,0.07)',
                        color: timerDuration===t ? '#000' : 'rgba(255,255,255,0.5)'
                      }}>{t}с</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {!selectedEx ? (
            <button className="ex-selector-btn" onClick={() => setShowExModal(true)}>
              <span style={{opacity:0.45}}>Выбери упражнение...</span>
              <span style={{opacity:0.4,fontSize:20}}>⌄</span>
            </button>
          ) : (
            <>
              <button className="back-btn" onClick={() => setSelectedEx(null)}>‹ Упражнения</button>
              <div className="ex-header">
                {EXERCISE_IMAGES[selectedEx]
                  ? <img src={EXERCISE_IMAGES[selectedEx]} alt={selectedEx} className="ex-image" onError={e=>e.target.style.display='none'}/>
                  : <div style={{width:90,height:90,borderRadius:14,background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,flexShrink:0}}>🏋️</div>
                }
                <div className="ex-title">{selectedEx}</div>
              </div>
              <div className="fav-section">
                <div><div className="fav-section-label">Избранное</div><div className="fav-section-name">{isFav?'⭐ В избранном':'☆ Не в избранном'}</div></div>
                <button className={`fav-big-btn${isFav?' active':''}`} onClick={() => toggleFav(selectedEx)}>{isFav?'⭐':'☆'}</button>
              </div>
              {lastSession && (
                <div className="last-hint">
                  💡 <b>В прошлый раз</b> ({daysAgo(lastSession.workout_date)}, {formatDateShort(lastSession.workout_date)}):&nbsp;
                  {lastSession.sets?.sort((a,b)=>a.set_no-b.set_no).map(s=>s.time_sec>0?`${s.time_sec}s`:`${s.weight}×${s.reps}`).join(' · ')}
                </div>
              )}
              <div className="sets-lbl">Подходы</div>
              {sets.map((s,i) => (
                <div key={i} className="set-row">
                  <span className="set-num">{i+1}</span>
                  {exType === 'timed' ? (
                    <DropdownPicker options={TIME_OPTIONS} value={s.weight} onChange={v=>updateSet(i,'weight',v)} unit="s" label={`Подход ${i+1} — Время`}/>
                  ) : (
                    <>
                      <DropdownPicker options={weightOpts} value={s.weight} onChange={v=>updateSet(i,'weight',v)} unit="кг" label={`Подход ${i+1} — Вес`}/>
                      <span className="set-sep">×</span>
                      <DropdownPicker options={REPS_OPTIONS} value={s.reps} onChange={v=>updateSet(i,'reps',v)} unit="повт" label={`Подход ${i+1} — Повторения`}/>
                    </>
                  )}
                </div>
              ))}
              <div className="set-btns">
                <button className="set-btn" onClick={addSet}>➕ Добавить</button>
                <button className="set-btn" onClick={removeSet} style={{opacity:sets.length<=1?0.35:1}}>➖ Убрать</button>
              </div>
              <button className={`save-btn${saved?' done':''}`} onClick={saveWorkout}>{saved?'✅ Сохранено!':'💾 Сохранить тренировку'}</button>
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
                        <div key={w.id} className="hist-card">
                          <div className="hist-ex">{w.exercises?.name}</div>
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
        // Compute muscle scores from last 30 days history
        const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]
        const recentHistory = history.filter(w => w.workout_date >= thirtyDaysAgo)
        const muscleCounts = {}
        recentHistory.forEach(w => {
          const muscles = EXERCISE_MUSCLES[w.exercises?.name] || []
          muscles.forEach(m => { muscleCounts[m] = (muscleCounts[m] || 0) + 1 })
        })
        const maxCount = Math.max(1, ...Object.values(muscleCounts))
        const muscleScores = Object.fromEntries(Object.entries(muscleCounts).map(([m,c]) => [m, c/maxCount]))
        return (
        <div className="section">
          {stats && (
            <div className="stats-row">
              <div className="stat-card"><div className="stat-val">{stats.monthW}</div><div className="stat-lbl">этот месяц</div></div>
              <div className="stat-card"><div className="stat-val">{stats.totalW}</div><div className="stat-lbl">всего</div></div>
              <div className="stat-card"><div className="stat-val" style={{color:'#69F0AE',fontSize:18}}>{stats.totalKg>=1000?`${(stats.totalKg/1000).toFixed(1)}K`:Math.round(stats.totalKg)} kg</div><div className="stat-lbl">поднято</div></div>
            </div>
          )}
          <div className="prog-title">💪 Нагрузка по мышцам</div>
          <div className="chart-wrap" style={{padding:'16px 8px'}}>
            <div style={{fontSize:11,opacity:0.35,textAlign:'center',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.5px'}}>За последние 30 дней</div>
            <MuscleMap muscleScores={muscleScores}/>
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
          <div className="prog-title">🏆 Личные рекорды</div>
          {prs.map(([name,pr])=>{
            const isOpen=openPrs[name]; const img=EXERCISE_IMAGES[name]
            return (
              <div key={name} className="pr-group">
                <button className={`pr-hdr${isOpen?' open':''}`} onClick={()=>setOpenPrs(p=>({...p,[name]:!p[name]}))}>
                  <div className="pr-hdr-left">{img?<img src={img} alt={name} className="pr-thumb" onError={e=>e.target.style.display='none'}/>:<div className="pr-thumb-ph">🏋️</div>}<span className="pr-name">{name}</span></div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}><span className="pr-val">{pr.est} kg</span><span className="day-chev" style={{transform:isOpen?'rotate(180deg)':'none'}}>▼</span></div>
                </button>
                {isOpen&&<div className="pr-detail">{img&&<img src={img} alt={name} className="pr-detail-img" onError={e=>e.target.style.display='none'}/>}<div><div className="pr-detail-sets">{pr.weight} кг × {pr.reps} повт</div><div className="pr-detail-date">{new Date(pr.date).toLocaleDateString('ru',{day:'numeric',month:'long',year:'numeric'})}</div><div className="pr-detail-est">Оценка 1RM: {pr.est} kg</div></div></div>}
              </div>
            )
          })}
          <div className="prog-title">📊 График роста</div>
          <div className="chart-wrap">
            <select className="chart-ex-select" value={chartEx} onChange={e=>setChartEx(e.target.value)}>{exercises.map(e=><option key={e.id} value={e.name}>{e.name}</option>)}</select>
            <LineChart data={chartData} period={chartPeriod} setPeriod={setChartPeriod}/>
          </div>
        </div>
        )
      })()}

      {showExModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target.classList.contains('modal-overlay')){setShowExModal(false);setModalSearch('')}}}>
          <div className="modal">
            <div className="modal-handle"/>
            <div className="modal-hdr">
              <div className="modal-title">Выбери упражнение</div>
              <div className="modal-srch-wrap"><span className="modal-srch-icon">🔍</span><input className="modal-srch" placeholder="Поиск..." value={modalSearch} onChange={e=>setModalSearch(e.target.value)} autoFocus/></div>
            </div>
            <div className="modal-list">
              {!modalSearch&&favFiltered.length>0&&<><div className="modal-sect-lbl">⭐ Избранные</div>{favFiltered.map(ex=><ModalItem key={ex.id} ex={ex} onSelect={()=>{setSelectedEx(ex.name);setShowExModal(false);setModalSearch('')}}/>)}<div className="modal-sect-lbl">Все упражнения</div></>}
              {(modalSearch?filtered:restFiltered).map(ex=><ModalItem key={ex.id} ex={ex} onSelect={()=>{setSelectedEx(ex.name);setShowExModal(false);setModalSearch('')}}/>)}
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
                  <div style={{fontSize:14,fontWeight:700,marginBottom:7}}>{w.exercises?.name}</div>
                  <div className="chips">{w.sets?.sort((a,b)=>a.set_no-b.set_no).map((s,i)=><span key={i} className="chip">{s.time_sec>0?`${s.time_sec}s`:`${s.weight}×${s.reps}`}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editModal && <EditModal data={editModal} onClose={()=>setEditModal(null)} onSave={saveEdit}/>}

      {/* Timer Modal */}
      {showTimerModal && (
        <div className="timer-modal-overlay" onClick={e=>{if(e.target.classList.contains('timer-modal-overlay'))setShowTimerModal(false)}}>
          <div className="timer-modal">
            <div className="modal-handle"/>
            <div className="timer-tabs">
              <button className={`timer-tab${timerMode==='countdown'?' active':''}`} onClick={()=>setTimerMode('countdown')}>⏱ Таймер</button>
              <button className={`timer-tab${timerMode==='stopwatch'?' active':''}`} onClick={()=>setTimerMode('stopwatch')}>⏲ Секундомер</button>
            </div>
            {timerMode === 'countdown' ? (
              <div style={{padding:'0 24px'}}>
                <div style={{marginBottom:16}}>
                  <DropdownPicker options={Array.from({length:50},(_,i)=>(i+1)*5)} value={timerDuration} onChange={v=>{setTimerDuration(v);setTimerSecs(null)}} unit="сек" label="Длительность"/>
                </div>
                <div className="timer-big-num" style={{color: timerSecs!==null ? '#FF9F0A' : 'white'}}>
                  {timerSecs !== null
                    ? `${Math.floor(timerSecs/60)}:${String(timerSecs%60).padStart(2,'0')}`
                    : `${Math.floor(timerDuration/60)}:${String(timerDuration%60).padStart(2,'0')}`}
                </div>
                <div className="timer-controls">
                  {timerSecs !== null
                    ? <button className="timer-ctrl-btn danger" onClick={()=>setTimerSecs(null)}>✕ Стоп</button>
                    : <button className="timer-ctrl-btn primary" onClick={()=>setTimerSecs(timerDuration)}>▶ Старт</button>
                  }
                </div>
              </div>
            ) : (
              <div style={{padding:'0 24px'}}>
                <div className="timer-big-num" style={{color: stopwatchRunning ? '#30D158' : 'white'}}>
                  {`${Math.floor(stopwatchSecs/60)}:${String(stopwatchSecs%60).padStart(2,'0')}`}
                </div>
                <div className="timer-controls" style={{gap:10}}>
                  <button className="timer-ctrl-btn secondary" onClick={()=>{setStopwatchSecs(0);setStopwatchRunning(false)}}>↺ Сброс</button>
                  <button className={`timer-ctrl-btn${stopwatchRunning?' danger':' primary'}`} onClick={()=>setStopwatchRunning(r=>!r)}>
                    {stopwatchRunning ? '⏸ Пауза' : '▶ Старт'}
                  </button>
                </div>
              </div>
            )}
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

      {/* Streak Alert Toast */}
      {streakAlert && (
        <div className="alert-toast" style={{borderColor:'rgba(255,100,0,0.3)'}}>
          <div className="alert-toast-icon">{streakAlert===7?'🔥':streakAlert===30?'⚡':'👑'}</div>
          <div>
            <div className="alert-toast-title">{streakAlert} дней подряд!</div>
            <div className="alert-toast-sub">{streakAlert===7?'Неделя без пропусков — огонь!':streakAlert===30?'Месяц! Ты машина 💪':'100 дней! Легенда 🏆'}</div>
          </div>
        </div>
      )}

      <div className="nav-bar">
        {[{id:'add',icon:'➕',label:'Тренировка'},{id:'history',icon:'📜',label:'История'},{id:'progress',icon:'📈',label:'Прогресс'}].map(t=>(
          <div key={t.id} className="nav-item" style={{opacity:tab===t.id?1:0.38}} onClick={()=>setTab(t.id)}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-lbl" style={{color:tab===t.id?'#00C853':'white'}}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
