import { useState } from 'react'
import { BodyWeightChart } from './BodyWeightChart'
import { localDateStr } from '../utils/format'
import { ScaleIcon } from './ScaleIcon'

// Bottom sheet opened from the scale button in the header: add today's (or another day's) body weight,
// see how it changes and remove a wrong entry. One entry per day — saving the same date replaces it.
export function WeightModal({ entries, status, onAdd, onDelete, onClose }) {
  const sorted = [...entries].sort((a, b) => b.measured_on.localeCompare(a.measured_on))
  const last = sorted[0]
  const today = localDateStr(new Date())
  const [value, setValue] = useState(last ? String(last.weight).replace('.', ',') : '')
  const [date, setDate] = useState(today)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const save = async () => {
    const v = Number(String(value).replace(',', '.'))
    if (!Number.isFinite(v) || v < 30 || v > 300) { setError('Вес от 30 до 300 кг'); return }
    setError(null); setSaving(true)
    const ok = await onAdd(date, Math.round(v * 10) / 10)
    setSaving(false)
    if (!ok) setError('Не удалось сохранить. Проверь интернет и попробуй ещё раз.')
  }
  const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: d.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric' })
  const list = showAll ? sorted : sorted.slice(0, 7)

  return (
    <div className="timer-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="timer-modal" style={{ padding: '20px 20px 36px', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#FF9F0A', display: 'flex' }}><ScaleIcon size={22}/></span>Вес тела</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {status === 'missing' ? (
          <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.8, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.3)', borderRadius: 12, padding: 14 }}>
            История веса ещё не настроена в базе. Нужно один раз выполнить SQL из файла
            <code style={{ display: 'block', margin: '8px 0', fontSize: 12, opacity: 0.8 }}>supabase/migrations/20261003_create_body_weights.sql</code>
            в Supabase → SQL Editor.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1.2 }}>
                <div style={{ fontSize: 12, opacity: 0.45, marginBottom: 6, fontWeight: 500 }}>Вес, кг</div>
                <input className="settings-inp" type="text" inputMode="decimal" placeholder="80,5" value={value} autoFocus
                  onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save() }}
                  style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, opacity: 0.45, marginBottom: 6, fontWeight: 500 }}>Дата</div>
                <label style={{ position: 'relative', display: 'block' }}>
                  <div className="settings-inp" style={{ textAlign: 'center', padding: '17px 8px' }}>{date === today ? 'Сегодня' : fmtDate(date)}</div>
                  <input type="date" value={date} max={today} onChange={e => e.target.value && setDate(e.target.value)} aria-label="Дата взвешивания"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', colorScheme: 'dark' }} />
                </label>
              </div>
            </div>
            {error && <div style={{ fontSize: 12, color: '#FF453A', marginBottom: 10 }}>{error}</div>}
            <button onClick={save} disabled={saving || status === 'loading'} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: '#FF9F0A', color: '#000', fontSize: 16, fontWeight: 700, opacity: saving ? 0.7 : 1, marginBottom: 20 }}>
              {saving ? 'Сохраняю…' : sorted.some(e => e.measured_on === date) ? 'Обновить вес за этот день' : 'Сохранить'}
            </button>

            <BodyWeightChart entries={entries} />

            {sorted.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Взвешивания</div>
                {list.map(e => (
                  <div key={e.measured_on} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 2px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 14, opacity: 0.7 }}>{fmtDate(e.measured_on)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <b style={{ fontSize: 15 }}>{String(e.weight).replace('.', ',')} кг</b>
                      {confirmDel === e.measured_on
                        ? <button onClick={() => { onDelete(e.measured_on); setConfirmDel(null) }} style={{ background: 'rgba(255,59,48,0.15)', border: 'none', borderRadius: 8, color: '#FF453A', fontSize: 12, fontWeight: 700, padding: '4px 8px', cursor: 'pointer' }}>Удалить</button>
                        : <button onClick={() => setConfirmDel(e.measured_on)} aria-label="Удалить взвешивание" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 14, cursor: 'pointer', padding: '2px 4px' }}>✕</button>}
                    </span>
                  </div>
                ))}
                {sorted.length > 7 && (
                  <button onClick={() => setShowAll(s => !s)} style={{ width: '100%', background: 'none', border: 'none', color: '#FF9F0A', fontSize: 13, fontWeight: 600, padding: '10px 0', cursor: 'pointer' }}>
                    {showAll ? 'Свернуть' : `Показать все (${sorted.length})`}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
