/* eslint-disable no-unused-vars */
import { memo } from 'react'
import { getExImage } from '../data/exerciseCatalog'

export const ModalItem = memo(function ModalItem({ ex, onAdd, isFav, onToggleFav }) {
  const img = getExImage(ex.name)
  return (
    <div className="modal-item" onClick={()=>onAdd(ex.name)} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
        {img ? <img src={img} alt={ex.name} className="modal-img" loading="lazy" decoding="async" onError={e => e.target.style.display='none'}/> : <div className="modal-ph">🏋️</div>}
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ex.name}</span>
      </div>
      {onToggleFav && (
        <button onClick={e=>{e.stopPropagation();onToggleFav(ex.name)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,padding:'4px 6px',flexShrink:0,lineHeight:1}}>{isFav ? '⭐' : '☆'}</button>
      )}
    </div>
  )
})
