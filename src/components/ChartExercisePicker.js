import { useMemo, useState } from 'react'
import { GRIP_EXERCISES, getDefaultVariant, getExImage, getVariantOptions } from '../data/exerciseCatalog'
import { baseExName } from '../utils/records'

// Exercise picker for the growth chart.
// Variants of one exercise («Тяга вертикального блока», «… (Широкий)», «… (Узкий)») are shown as one row
// in the list; after picking it, chips switch between the variants that have data. The default variant
// (saved without a suffix, e.g. «Стандартный» grip) is selected first.

const groupKey = (name) => {
  const base = baseExName(name)
  return GRIP_EXERCISES.includes(base) ? base : name
}
const variantLabel = (name, base) => {
  if (name === base) return getDefaultVariant(base) || base
  return name.match(/\(([^)]*)\)\s*$/)?.[1] || name
}

function Thumb({ name, size = 36 }) {
  const img = getExImage(name)
  const [failed, setFailed] = useState(false)
  if (!img || failed) {
    return <div style={{ width: size, height: size, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0 }}>🏋️</div>
  }
  return <img src={img} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)}
    style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: '#fff' }} />
}

export function ChartExercisePicker({ names, value, onChange, theme }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  // base → names with data, in the order of `names`
  const groups = useMemo(() => {
    const m = new Map()
    names.forEach(n => { const k = groupKey(n); if (!m.has(k)) m.set(k, []); m.get(k).push(n) })
    return m
  }, [names])

  const curBase = groupKey(value)
  const curGroup = groups.get(curBase) || []
  const variants = curGroup.length > 1
    ? [...curGroup].sort((a, b) => {
        const order = getVariantOptions(curBase)
        return order.indexOf(variantLabel(a, curBase)) - order.indexOf(variantLabel(b, curBase))
      })
    : []

  const pickBase = (base) => {
    const g = groups.get(base) || []
    onChange(g.includes(base) ? base : g[0]) // default variant first
    setOpen(false); setQ('')
  }

  const list = [...groups.keys()].sort((a, b) => a.localeCompare(b, 'ru')).filter(b => !q.trim() || b.toLowerCase().includes(q.trim().toLowerCase()))
  const dark = theme !== 'light'

  return (
    <div style={{ marginBottom: 14 }}>
      <button onClick={() => setOpen(true)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
        background: dark ? '#2c2c2e' : '#f2f2f7', color: dark ? '#fff' : '#1c1c1e', textAlign: 'left',
      }}>
        <Thumb key={curBase} name={curBase} size={36} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{curBase}</span>
        <span style={{ opacity: 0.4, fontSize: 12 }}>▼</span>
      </button>

      {variants.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {variants.map(n => (
            <button key={n} onClick={() => onChange(n)} style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: n === value ? '#FF9F0A' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
              color: n === value ? '#000' : (dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
            }}>{variantLabel(n, curBase)}</button>
          ))}
        </div>
      )}

      {open && (
        <div className="modal-overlay" onClick={e => { if (e.target.classList.contains('modal-overlay')) { setOpen(false); setQ('') } }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-hdr">
              <div className="modal-title">Упражнение для графика</div>
              <div className="modal-srch-wrap"><span className="modal-srch-icon">🔍</span>
                <input className="modal-srch" placeholder="Поиск..." value={q} onChange={e => setQ(e.target.value)} />
              </div>
            </div>
            <div className="modal-list">
              {list.map(b => {
                const n = groups.get(b).length
                return (
                  <div key={b} className="modal-item" onClick={() => pickBase(b)} style={{ gap: 12, background: b === curBase ? 'rgba(255,159,10,0.1)' : undefined }}>
                    <Thumb name={b} size={40} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: b === curBase ? '#FF9F0A' : undefined }}>{b}</span>
                    {n > 1 && <span style={{ fontSize: 12, opacity: 0.4, flexShrink: 0 }}>{n} вар.</span>}
                  </div>
                )
              })}
              {!list.length && <div style={{ textAlign: 'center', opacity: 0.4, padding: 24, fontSize: 14 }}>Ничего не найдено</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
