import { useState } from 'react'
import { TIERS } from '../data/achievements'
import { locale, t } from '../i18n'

const ORANGE = '#FF9F0A'
const card = (isDark, thm) => ({ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 20, padding: '18px 20px', marginBottom: 12, border: `1px solid ${thm.border}` })
const sectionTitle = (thm) => ({ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: thm.text40, marginBottom: 14 })
const monthName = (m) => { const s = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1) }
const shortDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })

export function AchTabs({ tab, setTab, thm, isDark }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', margin: '14px 20px 0' }}>
      {[['month', t('Месяц')], ['all', t('Рекорды')]].map(([id, label]) => (
        <button key={id} onClick={() => setTab(id)} style={{
          flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
          background: tab === id ? ORANGE : 'transparent', color: tab === id ? '#000' : thm.text50,
        }}>{label}</button>
      ))}
    </div>
  )
}

// Progress bar with bronze / silver / gold marks
function TierBar({ value, tiers, isDark }) {
  const max = tiers[tiers.length - 1] || 1
  const pct = Math.min(1, value / max)
  return (
    <div style={{ position: 'relative', height: 6, borderRadius: 99, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', margin: '8px 0 4px' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, borderRadius: 99, background: ORANGE, transition: 'width 0.5s ease' }} />
      {tiers.slice(0, -1).map((thr, i) => (
        <div key={i} style={{ position: 'absolute', left: `${(thr / max) * 100}%`, top: -2, width: 2, height: 10, borderRadius: 1, background: TIERS[i].color, opacity: 0.9 }} />
      ))}
    </div>
  )
}

export function MonthChallenges({ month, thm, isDark }) {
  return (
    <div style={card(isDark, thm)}>
      <div style={sectionTitle(thm)}>{t('Испытания месяца')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {month.challenges.map(c => {
          const next = c.tiers[c.tier]
          return (
            <div key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, width: 26, textAlign: 'center' }}>{c.emoji}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: thm.text }}>{t(c.name)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: thm.text70 }}>{c.fmt(c.value)}</span>
                <span style={{ fontSize: 18, width: 24, textAlign: 'right', filter: c.tier ? 'none' : 'grayscale(1)', opacity: c.tier ? 1 : 0.3 }}>{c.tier ? TIERS[c.tier - 1].medal : '🥉'}</span>
              </div>
              <div style={{ paddingLeft: 36 }}>
                <TierBar value={c.value} tiers={c.tiers} isDark={isDark} />
                <div style={{ fontSize: 11, color: thm.text40 }}>
                  {next !== undefined ? `${TIERS[c.tier].medal} ${t(TIERS[c.tier].name).toLowerCase()} — ${c.fmt(next)}` : t('Максимум за месяц 🎉')}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 11, color: thm.text35, marginTop: 12, lineHeight: 1.4 }}>{t('Пороги веса — от твоих прошлых месяцев: бронза — обычный месяц, серебро — +10 %, золото — побить лучший.')}</div>
    </div>
  )
}

export function MonthArchive({ archive, thm, isDark }) {
  if (!archive.length) return null
  return (
    <div style={card(isDark, thm)}>
      <div style={sectionTitle(thm)}>{t('Прошлые месяцы')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {archive.map(m => (
          <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{m.visits ? m.rank.icon : '💤'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: thm.text70 }}>{monthName(m.month)}</div>
              <div style={{ fontSize: 12, color: thm.text40 }}>{m.visits ? `${t(m.rank.name)} · ${m.visits} ${t('тр.')}` : t('Нет тренировок')}</div>
            </div>
            <div style={{ display: 'flex', gap: 2, fontSize: 16 }}>
              {m.challenges.filter(c => c.tier).map(c => <span key={c.id} title={`${t(c.name)}: ${t(TIERS[c.tier - 1].name)}`}>{TIERS[c.tier - 1].medal}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Badge({ a, size = 64 }) {
  const got = a.tier > 0
  const color = got ? (a.tiers.length > 1 ? TIERS[a.tier - 1].color : ORANGE) : 'rgba(128,128,128,0.35)'
  const hidden = a.secret && !got
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, background: got ? `${color}22` : 'rgba(128,128,128,0.08)', filter: got ? 'none' : 'grayscale(1)', opacity: got ? 1 : 0.45, flexShrink: 0,
      boxShadow: got ? `0 0 14px ${color}55` : 'none' }}>
      {hidden ? '❓' : a.emoji}
    </div>
  )
}

export function BadgeGrid({ list, thm, isDark }) {
  const [open, setOpen] = useState(null)
  const groups = [...new Set(list.map(a => a.group))]
  const total = list.reduce((s, a) => s + a.tiers.length, 0), got = list.reduce((s, a) => s + a.tier, 0)
  return (
    <>
      <div style={{ ...card(isDark, thm), display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 36 }}>🏅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: thm.text }}>{got} <span style={{ fontSize: 14, color: thm.text40, fontWeight: 600 }}>{t('из')} {total}</span></div>
          <div style={{ height: 6, borderRadius: 99, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', marginTop: 6 }}>
            <div style={{ height: '100%', width: `${(got / total) * 100}%`, borderRadius: 99, background: ORANGE }} />
          </div>
        </div>
      </div>
      {groups.map(g => (
        <div key={g} style={card(isDark, thm)}>
          <div style={sectionTitle(thm)}>{t(g)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 8px' }}>
            {list.filter(a => a.group === g).map(a => {
              const hidden = a.secret && !a.tier
              const next = a.tiers[a.tier]
              return (
                <button key={a.id} onClick={() => setOpen(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0 }}>
                  <Badge a={a} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: a.tier ? thm.text : thm.text50, textAlign: 'center', lineHeight: 1.25 }}>{hidden ? t('Секрет') : t(a.name)}</div>
                  <div style={{ fontSize: 10, color: a.tier ? (a.tiers.length > 1 ? TIERS[a.tier - 1].color : ORANGE) : thm.text35, textAlign: 'center', minHeight: 12 }}>
                    {hidden ? '???' : next !== undefined ? `${a.fmt(a.value)} / ${a.fmt(next)}` : (a.tiers.length > 1 ? t(TIERS[a.tier - 1].name) : t('Получено'))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: thm.modalBg, borderRadius: 24, padding: '26px 22px 20px', width: '100%', maxWidth: 340, border: `1px solid ${thm.border}`, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Badge a={open} size={84} /></div>
            <div style={{ fontSize: 20, fontWeight: 800, color: thm.text }}>{open.secret && !open.tier ? t('Секретное достижение') : t(open.name)}</div>
            <div style={{ fontSize: 13, color: thm.text50, margin: '4px 0 16px' }}>{open.secret && !open.tier ? t('Условие откроется, когда получишь') : t(open.desc)}</div>
            {!(open.secret && !open.tier) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                {open.tiers.map((thr, i) => {
                  const d = open.earned[i]
                  const tierName = open.tiers.length > 1 ? `${TIERS[i].medal} ${t(TIERS[i].name)}` : '🏅'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: d ? 1 : 0.45 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: thm.text, flex: 1 }}>{tierName} · {open.fmt(thr)}</span>
                      <span style={{ fontSize: 12, color: d ? ORANGE : thm.text40 }}>{d ? shortDate(d) : '—'}</span>
                    </div>
                  )
                })}
                {open.tier < open.tiers.length && <div style={{ fontSize: 12, color: thm.text40, marginTop: 4 }}>{t('Сейчас:')} {open.fmt(open.value)}</div>}
              </div>
            )}
            <button onClick={() => setOpen(null)} style={{ marginTop: 18, width: '100%', padding: 12, borderRadius: 14, border: 'none', background: ORANGE, color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{t('Закрыть')}</button>
          </div>
        </div>
      )}
    </>
  )
}

// Full-screen "new achievement" moment
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100, delay: (i % 7) * 0.12, dur: 1.6 + (i % 5) * 0.25, color: ['#FF9F0A', '#FFD700', '#ffffff', '#FF6400', '#C0C0C0'][i % 5], rot: (i * 47) % 360,
}))
export function AchievementCelebration({ item, left, onNext }) {
  if (!item) return null
  return (
    <div onClick={onNext} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, overflow: 'hidden', backdropFilter: 'blur(6px)' }}>
      <style>{`@keyframes gbConf{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(540deg)}}@keyframes gbPop{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}`}</style>
      {CONFETTI.map((c, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, left: `${c.left}%`, width: 8, height: 14, borderRadius: 2, background: c.color, transform: `rotate(${c.rot}deg)`, animation: `gbConf ${c.dur}s ${c.delay}s ease-in infinite`, opacity: 0.85 }} />
      ))}
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: ORANGE, marginBottom: 18 }}>{t('Новое достижение')}</div>
      <div style={{ width: 150, height: 150, borderRadius: '50%', border: `5px solid ${item.color}`, background: `${item.color}22`, boxShadow: `0 0 40px ${item.color}88`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, animation: 'gbPop 0.6s cubic-bezier(0.34,1.4,0.64,1) both' }}>{item.emoji}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 22, textAlign: 'center' }}>{item.title}</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 6, textAlign: 'center' }}>{item.sub}</div>
      <button onClick={e => { e.stopPropagation(); onNext() }} style={{ marginTop: 28, padding: '14px 40px', borderRadius: 16, border: 'none', background: ORANGE, color: '#000', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
        {left > 0 ? t('Круто! Ещё {n}',{n:left}) : t('Круто!')}
      </button>
    </div>
  )
}
