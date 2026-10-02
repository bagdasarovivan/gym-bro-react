/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react'

export function DropdownPicker({ options, value, onChange, unit = '', label = '', labelFn = null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const el = ref.current?.querySelector(`[data-val="${value}"]`)
    const dropdown = ref.current?.querySelector('.dpicker-dropdown')
    if (el && dropdown) {
      // Scroll only the dropdown container (not the page) to center active item
      dropdown.scrollTop = el.offsetTop - dropdown.clientHeight / 2 + el.clientHeight / 2
    }
  }, [open, value])

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close) }
  }, [])

  useEffect(() => {
    if (!open) return
    const handleScroll = (e) => {
      // Don't close when scrolling inside the dropdown itself
      if (ref.current?.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [open])

  return (
    <div className={`dpicker-wrap${open ? ' is-open' : ''}`} ref={ref}>
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
              {labelFn ? labelFn(opt) : opt} {!labelFn && unit && <span className="dpicker-opt-unit">{unit}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
