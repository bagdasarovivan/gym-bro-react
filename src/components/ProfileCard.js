import { useState } from 'react'

// Profile (name / body weight / height) with an explicit edit → save flow.
// Text inputs with a numeric keyboard: iOS with a Russian layout types a comma, which type=number rejects.
// View mode shows the saved values; "Изменить" switches to inputs, "Сохранить" validates and saves.
const LIMITS = { weight: [30, 300], height: [100, 250] }

function validate(p) {
  const errors = {}
  if (p.username.trim().length > 30) errors.username = 'Не длиннее 30 символов'
  for (const key of ['weight', 'height']) {
    if (p[key] === '') continue
    const v = Number(String(p[key]).replace(',', '.'))
    const [min, max] = LIMITS[key]
    if (!Number.isFinite(v) || v < min || v > max) errors[key] = `От ${min} до ${max}`
  }
  return errors
}

export function ProfileCard({ settings, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ username: '', weight: '', height: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null) // null | 'saving' | 'saved' | 'error'

  const startEdit = () => {
    setDraft({ username: settings.username || '', weight: settings.weight ?? '', height: settings.height ?? '' })
    setErrors({}); setStatus(null); setEditing(true)
  }
  const save = async () => {
    const errs = validate(draft)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const clean = {
      username: draft.username.trim(),
      weight: draft.weight === '' ? '' : String(Number(String(draft.weight).replace(',', '.'))),
      height: draft.height === '' ? '' : String(Math.round(Number(String(draft.height).replace(',', '.')))),
    }
    setStatus('saving')
    const ok = await onSave(clean)
    setStatus(ok ? 'saved' : 'error')
    if (ok) { setEditing(false); setTimeout(() => setStatus(s => (s === 'saved' ? null : s)), 2500) }
  }

  const label = { fontSize: 12, opacity: 0.45, marginBottom: 6, fontWeight: 500 }
  const value = { fontSize: 16, fontWeight: 600, minHeight: 22 }
  const err = { fontSize: 11, color: '#FF453A', marginTop: 4 }
  const btn = (primary) => ({
    flex: 1, padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
    background: primary ? '#30D158' : 'rgba(255,255,255,0.08)', color: primary ? '#000' : 'inherit',
  })
  const empty = <span style={{ opacity: 0.35, fontWeight: 500 }}>не указано</span>

  return (
    <div className="settings-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="settings-section-title" style={{ marginBottom: 0 }}>👤 Профиль</div>
        {!editing && (
          <button onClick={startEdit} style={{ background: 'none', border: 'none', color: '#30D158', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '2px 4px' }}>
            ✏️ Изменить
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={label}>Имя</div>
            <div style={value}>{settings.username || empty}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={label}>Вес</div>
              <div style={value}>{settings.weight ? `${settings.weight} кг` : empty}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={label}>Рост</div>
              <div style={value}>{settings.height ? `${settings.height} см` : empty}</div>
            </div>
          </div>
          {status === 'saved' && <div style={{ fontSize: 12, color: '#30D158', marginTop: 12, fontWeight: 600 }}>✓ Сохранено в аккаунте</div>}
        </>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={label}>Имя</div>
            <input className="settings-inp" placeholder="Введи имя" maxLength={30} value={draft.username} autoFocus
              onChange={e => setDraft(d => ({ ...d, username: e.target.value }))} />
            {errors.username && <div style={err}>{errors.username}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={label}>Вес (кг)</div>
              <input className="settings-inp" type="text" inputMode="decimal" placeholder="70" value={draft.weight}
                onChange={e => setDraft(d => ({ ...d, weight: e.target.value }))} />
              {errors.weight && <div style={err}>{errors.weight}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={label}>Рост (см)</div>
              <input className="settings-inp" type="text" inputMode="numeric" placeholder="175" value={draft.height}
                onChange={e => setDraft(d => ({ ...d, height: e.target.value }))} />
              {errors.height && <div style={err}>{errors.height}</div>}
            </div>
          </div>
          {status === 'error' && <div style={{ ...err, marginBottom: 10, fontSize: 12 }}>Не удалось сохранить. Проверь интернет и попробуй ещё раз.</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(false)} onClick={() => { setEditing(false); setStatus(null) }} disabled={status === 'saving'}>Отмена</button>
            <button style={btn(true)} onClick={save} disabled={status === 'saving'}>{status === 'saving' ? 'Сохраняю…' : 'Сохранить'}</button>
          </div>
        </>
      )}
    </div>
  )
}
