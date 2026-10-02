/* eslint-disable no-unused-vars */
import { useState } from 'react'
import { EXERCISE_TYPE, normalizeName } from '../data/exerciseCatalog'
import { formatDateShort } from '../utils/format'

export function EditModal({ data, onClose, onSave }) {
  const [workouts, setWorkouts] = useState(data.workouts.map(w => ({
    ...w,
    editSets: w.sets?.sort((a,b) => a.set_no-b.set_no).map(s => ({ weight: String(s.weight), reps: String(s.reps), time_sec: s.time_sec ?? null })) || []
  })))

  const upd = (wi, si, f, v) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:w.editSets.map((s,j) => j!==si?s:{...s,[f]:v})}))
  const del = (wi, si) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:w.editSets.filter((_,j)=>j!==si)}))
  const add = (wi) => setWorkouts(prev => prev.map((w,i) => i!==wi?w:{...w,editSets:[...w.editSets,{weight:'0',reps:'0',time_sec:null}]}))

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
              <div style={{fontSize:14,fontWeight:700,marginBottom:10,opacity:0.7}}>{normalizeName(w.exercises?.name)}</div>
              {w.editSets.map((s,si) => (
                <div key={si} className="edit-row">
                  <span style={{opacity:0.3,width:18,fontSize:12,textAlign:'center'}}>{si+1}</span>
                  {isTimed ? (
                    <input className="edit-inp" type="number" value={s.time_sec ?? ''} onChange={e=>upd(wi,si,'time_sec',e.target.value)} placeholder="сек" style={{flex:2}}/>
                  ) : (
                    <>
                      <input className="edit-inp" type="number" value={s.weight} onChange={e=>upd(wi,si,'weight',e.target.value)} placeholder="кг"/>
                      <span style={{opacity:0.3,fontSize:14}}>×</span>
                      <input className="edit-inp" type="number" value={s.reps} onChange={e=>upd(wi,si,'reps',e.target.value)} placeholder="повт"/>
                    </>
                  )}
                  <button className="edit-del" onClick={()=>del(wi,si)}>✕</button>
                </div>
              ))}
              <button className="set-btn" style={{width:'100%',marginTop:4}} onClick={()=>add(wi)}>➕ Подход</button>
              <button className="edit-save-btn" onClick={()=>onSave(w.id,w.editSets)}>💾 Сохранить {w.exercises?.name}</button>
            </div>
          )})}

        </div>
      </div>
    </div>
  )
}
