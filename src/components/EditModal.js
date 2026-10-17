/* eslint-disable no-unused-vars */
import { useState } from 'react'
import { EXERCISE_TYPE, isCardio, normalizeName } from '../data/exerciseCatalog'
import { formatDateShort } from '../utils/format'
import { dispW, exName, t, toKg, wUnit } from '../i18n'

export function EditModal({ data, onClose, onSave }) {
  const [workouts, setWorkouts] = useState(data.workouts.map(w => ({
    ...w,
    // origKg/origW: an untouched weight is saved back as the original kg value (no kg→lbs→kg rounding drift)
    editSets: [...(w.sets || [])].sort((a,b) => a.set_no-b.set_no).map(s => isCardio(normalizeName(w.exercises?.name))
      // cardio: minutes, km, kcal (stored as time_sec / distance_km / calories)
      ? { cardio: true, min: String(Math.round((s.time_sec || 0) / 6) / 10), distance_km: s.distance_km ? String(s.distance_km) : '', calories: s.calories ? String(s.calories) : '' }
      : { weight: String(dispW(s.weight)), reps: String(s.reps), time_sec: s.time_sec ?? null, origKg: s.weight, origW: String(dispW(s.weight)) })
  })))
  const [saving, setSaving] = useState(false)
  const initial = useState(() => JSON.stringify(workouts.map(w => w.editSets)))[0]
  const sig = (w) => JSON.stringify(w.editSets)
  const initialSigs = JSON.parse(initial)
  const changed = workouts.filter((w, i) => JSON.stringify(initialSigs[i]) !== sig(w))
  const toStored = (s) => s.cardio
    ? { cardio: true, weight: '0', reps: '0', time_sec: String(Math.round((Number(String(s.min).replace(',', '.')) || 0) * 60)), distance_km: s.distance_km, calories: s.calories }
    : ({ ...s, weight: String(s.weight === s.origW && s.origKg != null ? s.origKg : toKg(Number(String(s.weight).replace(',','.')) || 0)) })
  const saveAll = async () => {
    if (!changed.length) { onClose(); return }
    setSaving(true)
    await onSave(changed.map(w => ({ workoutId: w.id, sets: w.editSets.map(toStored) })))
    setSaving(false)
  }

  const upd = (wi, si, f, v) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:w.editSets.map((s,j) => j!==si?s:{...s,[f]:v})}))
  const del = (wi, si) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:w.editSets.filter((_,j)=>j!==si)}))
  const add = (wi) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:[...w.editSets,isCardio(normalizeName(w.exercises?.name)) ? { cardio: true, min: '', distance_km: '', calories: '' } : {weight:'0',reps:'0',time_sec:null}]}))

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target.classList.contains('modal-overlay'))onClose()}}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-hdr">
          <div className="modal-title" style={{marginBottom:0}}>✏️ {formatDateShort(data.date)}</div>
        </div>
        <div className="modal-body">
          {workouts.map((w, wi) => {
            const isTimed = (EXERCISE_TYPE[normalizeName(w.exercises?.name)] || 'light') === 'timed'
            return (
            <div key={w.id} style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10,opacity:0.7}}>{exName(normalizeName(w.exercises?.name))}</div>
              {w.editSets.map((s,si) => (
                <div key={si} className="edit-row">
                  <span style={{opacity:0.3,width:18,fontSize:12,textAlign:'center'}}>{si+1}</span>
                  {s.cardio ? (
                    <>
                      <input className="edit-inp" type="text" inputMode="decimal" value={s.min} onChange={e=>upd(wi,si,'min',e.target.value)} placeholder={t('мин')} aria-label={t('мин')}/>
                      <input className="edit-inp" type="text" inputMode="decimal" value={s.distance_km} onChange={e=>upd(wi,si,'distance_km',e.target.value)} placeholder={t('км')} aria-label={t('км')}/>
                      <input className="edit-inp" type="text" inputMode="numeric" value={s.calories} onChange={e=>upd(wi,si,'calories',e.target.value)} placeholder={t('ккал')} aria-label={t('ккал')}/>
                    </>
                  ) : isTimed ? (
                    <input className="edit-inp" type="number" value={s.time_sec ?? ''} onChange={e=>upd(wi,si,'time_sec',e.target.value)} placeholder={t('сек')} style={{flex:2}}/>
                  ) : (
                    <>
                      <input className="edit-inp" type="number" value={s.weight} onChange={e=>upd(wi,si,'weight',e.target.value)} placeholder={wUnit()}/>
                      <span style={{opacity:0.3,fontSize:14}}>×</span>
                      <input className="edit-inp" type="number" value={s.reps} onChange={e=>upd(wi,si,'reps',e.target.value)} placeholder={t('повт')}/>
                    </>
                  )}
                  <button className="edit-del" onClick={()=>del(wi,si)}>✕</button>
                </div>
              ))}
              <button className="set-btn" style={{width:'100%',marginTop:4}} onClick={()=>add(wi)}>{t('➕ Подход')}</button>
            </div>
          )})}
          {/* one button saves every edited exercise; weights are edited in the display unit and saved in kg */}
          <button className="edit-save-btn" disabled={saving} onClick={saveAll} style={{opacity:saving?0.6:1}}>💾 {saving ? t('⏳ Сохранение...') : t('Сохранить изменения')}</button>

        </div>
      </div>
    </div>
  )
}
