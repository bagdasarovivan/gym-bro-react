import { useState } from 'react'
import { BODY_PARTS, NOTE_KINDS, dateRange, noteKind, noteSpan } from '../data/notes'
import { NoteIcon } from './NoteIcon'
import { locale, t } from '../i18n'

// Bottom sheet to add / edit / delete a day note (illness, injury, vacation…).
// Illness, injury, vacation and rest can cover several days: "from" is the tapped day (or the start of
// an existing period), "to" is picked below. Saving rewrites the whole period, deleting removes it.
export function NoteModal({ date, notes, status, onSave, onDelete, onClose, thm }) {
  const existing = notes[date]
  const span = existing ? noteSpan(notes, date) : null
  const from = span ? span.from : date
  const [kind, setKind] = useState(existing?.kind || 'sick')
  const [part, setPart] = useState(existing?.body_part || '')
  const [text, setText] = useState(existing?.text || '')
  const [to, setTo] = useState(span ? span.to : date)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const k = noteKind(kind)
  const end = k.range && to > from ? to : from
  const days = dateRange(from, end)
  const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'long' })

  const save = async () => {
    if (kind === 'note' && !text.trim()) { setError(t('Напиши текст заметки')); return }
    setSaving(true); setError(null)
    // when an existing period got shorter, the days cut off are removed
    const oldDays = span ? dateRange(span.from, span.to) : []
    const ok = await onSave(days, { kind, body_part: kind === 'injury' ? part || null : null, text: text.trim() || null }, oldDays.filter(d => !days.includes(d)))
    setSaving(false)
    if (ok) onClose(); else setError(status === 'missing' ? t('Пометки ещё не настроены в базе') : t('Не удалось сохранить. Проверь интернет и попробуй ещё раз.'))
  }
  const del = async () => {
    setSaving(true)
    const ok = await onDelete(dateRange(span.from, span.to))
    setSaving(false)
    if (ok) onClose(); else setError(t('Не удалось удалить. Проверь интернет и попробуй ещё раз.'))
  }

  const chip = (active, color) => ({
    padding: '7px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${active ? color : thm.border}`, background: active ? `color-mix(in srgb, ${color} 18%, transparent)` : 'transparent',
    color: active ? color : thm.text50,
  })

  return (
    <div className="timer-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="timer-modal" style={{ padding: '20px 20px 36px', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{existing ? t('Пометка') : t('Новая пометка')} · {fmt(from)}</div>
          <button onClick={onClose} aria-label={t('Закрыть')} style={{ background: 'none', border: 'none', color: thm.text50, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {status === 'missing' && (
          <div style={{ fontSize: 13, lineHeight: 1.5, background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.3)', borderRadius: 12, padding: 12, marginBottom: 14, color: thm.text70 }}>
            {t('Пометки ещё не настроены в базе. Нужно один раз выполнить SQL из файла')}
            <code style={{ display: 'block', margin: '6px 0', fontSize: 11 }}>supabase/migrations/20261017_day_notes_cardio.sql</code>
            {t('в Supabase → SQL Editor.')}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {NOTE_KINDS.map(x => (
            <button key={x.id} onClick={() => setKind(x.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 2px 8px', borderRadius: 14, cursor: 'pointer',
              border: `1px solid ${kind === x.id ? x.color : thm.border}`, background: kind === x.id ? `color-mix(in srgb, ${x.color} 14%, transparent)` : 'transparent',
            }}>
              <NoteIcon kind={x.id} size={34} />
              <span style={{ fontSize: 11, fontWeight: 600, color: kind === x.id ? x.color : thm.text50 }}>{t(x.label)}</span>
            </button>
          ))}
        </div>

        {kind === 'injury' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: thm.text45, marginBottom: 8, fontWeight: 600 }}>{t('Что травмировано')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BODY_PARTS.map(p => <button key={p.id} onClick={() => setPart(p.id === part ? '' : p.id)} style={chip(part === p.id, k.color)}>{t(p.label)}</button>)}
            </div>
          </div>
        )}

        {k.range && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: thm.text50, flex: 1 }}>
              {days.length > 1 ? t('{from} — {to} · {n} дн.', { from: fmt(from), to: fmt(end), n: days.length }) : t('Один день')}
            </div>
            <label style={{ position: 'relative', fontSize: 13, fontWeight: 600, padding: '8px 12px', borderRadius: 10, background: thm.btnBg || 'rgba(255,255,255,0.08)', color: thm.text70, cursor: 'pointer' }}>
              {t('До')}: {fmt(end)} ▾
              <input type="date" value={end} min={from} max={dateRange(from, '9999-12-31').pop()} onChange={e => e.target.value && setTo(e.target.value)}
                aria-label={t('До какого дня')} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', colorScheme: 'dark' }} />
            </label>
          </div>
        )}

        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={500}
          placeholder={kind === 'injury' ? t('Например: потянул плечо на жиме') : kind === 'note' ? t('Например: плохо спал, жал легче') : t('Комментарий (необязательно)')}
          style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${thm.border}`, background: thm.input, color: thm.text, padding: 12, fontSize: 15, fontFamily: 'inherit', resize: 'vertical', marginBottom: 14 }} />

        {error && <div style={{ color: '#FF453A', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button onClick={save} disabled={saving} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#000', fontSize: 16, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
          {saving ? t('⏳ Сохранение...') : t('Сохранить')}
        </button>
        {existing && (!confirmDel ? (
          <button onClick={() => setConfirmDel(true)} disabled={saving} style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 14, border: `1px solid ${thm.border}`, background: 'transparent', color: '#FF453A', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {span.from !== span.to ? t('Удалить пометку ({from} — {to})', { from: fmt(span.from), to: fmt(span.to) }) : t('Удалить пометку')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: 12, borderRadius: 14, border: `1px solid ${thm.border}`, background: 'transparent', color: thm.text70, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t('Отмена')}</button>
            <button onClick={del} disabled={saving} style={{ flex: 1, padding: 12, borderRadius: 14, border: 'none', background: '#FF453A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('Да, удалить')}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact note line for cards: medallion + label (+ body part) + text
export function NoteLine({ note, span, onClick, thm, compact }) {
  const k = noteKind(note.kind)
  const part = note.kind === 'injury' && note.body_part ? BODY_PARTS.find(p => p.id === note.body_part) : null
  const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'short' }).replace('.', '')
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: compact ? 0 : '10px 14px', cursor: onClick ? 'pointer' : 'default', textAlign: 'left', color: thm.text }}>
      <NoteIcon kind={note.kind} size={compact ? 24 : 30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: k.color }}>
          {t(k.label)}{part ? ` · ${t(part.label).toLowerCase()}` : ''}
          {span && span.from !== span.to && <span style={{ fontWeight: 500, color: thm.text40 }}> · {fmt(span.from)} — {fmt(span.to)}</span>}
        </div>
        {note.text && <div style={{ fontSize: 13, color: thm.text70, marginTop: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{note.text}</div>}
      </div>
    </button>
  )
}
