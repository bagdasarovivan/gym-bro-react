import { useState } from 'react'
import { PLAN_DAYS, PROGRAMS, planProgress, programOf } from '../data/plans'
import { getExImage } from '../data/exerciseCatalog'
import { exName, fmtW, plural, t } from '../i18n'

// Training programs: catalogue → program details → "My plan" (current day, weeks, working weights).

const ACC = 'var(--accent)'
const accA = (a) => `rgba(var(--accent-rgb),${a})`

function Chip({ children, thm, strong }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap',
      background: strong ? accA(0.15) : thm.card2, color: strong ? ACC : thm.text50 }}>{children}</span>
  )
}

function ProgramChips({ p, thm }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <Chip thm={thm} strong>{t(p.goal)}</Chip>
      <Chip thm={thm}>{t('{n}× в неделю', { n: p.perWeek })}</Chip>
      <Chip thm={thm}>{t(p.level)}</Chip>
      <Chip thm={thm}>{p.weeks} {plural(p.weeks, ['неделя', 'недели', 'недель'], ['week', 'weeks'])}</Chip>
    </div>
  )
}

function Thumb({ name, size = 34 }) {
  const img = getExImage(name)
  const [bad, setBad] = useState(false)
  if (!img || bad) return <div style={{ width: size, height: size, borderRadius: 9, background: 'rgba(128,128,128,0.15)', flexShrink: 0 }} />
  return <img src={img} alt="" loading="lazy" onError={() => setBad(true)} style={{ width: size, height: size, borderRadius: 9, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
}

// One exercise row of a day: picture, name, sets × reps and (in "My plan") the working weight
function ExRow({ ex, weight, guess, thm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <Thumb name={ex.name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: thm.text85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {exName(ex.name)}{ex.isBase && <span style={{ fontSize: 10, color: ACC, marginLeft: 6, fontWeight: 700 }}>{t('база')}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: thm.text70 }}>{ex.sets}×{ex.reps || t('макс')}</div>
        {weight !== undefined && <div style={{ fontSize: 11, color: weight > 0 ? ACC : thm.text40 }}>{weight > 0 ? fmtW(weight) : guess > 0 ? `≈ ${fmtW(guess)}` : t('вес подберём')}</div>}
      </div>
    </div>
  )
}

function Sheet({ children, onClose, thm }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target.classList.contains('modal-overlay')) onClose() }}>
      <div className="modal" style={{ background: thm.modalBg, maxHeight: '90dvh' }}>
        <div className="modal-handle" />
        {children}
      </div>
    </div>
  )
}

function Header({ title, onBack, onClose, thm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px 8px', flexShrink: 0 }}>
      {onBack && <button onClick={onBack} aria-label={t('Назад')} style={{ background: thm.card2, border: 'none', color: thm.text70, borderRadius: 10, width: 32, height: 32, fontSize: 16, cursor: 'pointer' }}>‹</button>}
      <div style={{ flex: 1, fontSize: 18, fontWeight: 800, color: thm.text }}>{title}</div>
      <button onClick={onClose} aria-label={t('Закрыть')} style={{ background: 'none', border: 'none', fontSize: 22, color: thm.text50, cursor: 'pointer', lineHeight: 1 }}>×</button>
    </div>
  )
}

// ── Catalogue ────────────────────────────────────────────────────────────────
function Catalog({ thm, onOpen, currentType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, color: thm.text50, marginBottom: 2 }}>{t('Выбери программу — Gym BRO подставит упражнения и будет сам повышать веса.')}</div>
      {PROGRAMS.map(p => (
        <button key={p.id} onClick={() => onOpen(p.id)} style={{ textAlign: 'left', border: `1px solid ${currentType === p.id ? accA(0.5) : thm.border}`, background: thm.card, borderRadius: 18, padding: 14, cursor: 'pointer', display: 'flex', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: accA(0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{p.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: thm.text }}>{t(p.name)}</span>
              {currentType === p.id && <span style={{ fontSize: 10, fontWeight: 800, color: ACC }}>{t('ТЕКУЩАЯ')}</span>}
            </div>
            <div style={{ fontSize: 12, color: thm.text50, margin: '3px 0 8px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t(p.desc)}</div>
            <ProgramChips p={p} thm={thm} />
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Program details ──────────────────────────────────────────────────────────
function Details({ id, thm, active, busy, onStart }) {
  const p = programOf(id)
  const days = PLAN_DAYS[id] || []
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: accA(0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{p.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: thm.text }}>{t(p.name)}</div>
      </div>
      <ProgramChips p={p} thm={thm} />
      <div style={{ fontSize: 14, color: thm.text70, lineHeight: 1.5, margin: '12px 0 16px' }}>{t(p.desc)}</div>
      {days.map((d, i) => (
        <div key={i} style={{ background: thm.card, border: `1px solid ${thm.border}`, borderRadius: 16, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: thm.text, marginBottom: 2 }}>{t(d.label)}</div>
          {d.exercises.map((ex, j) => <ExRow key={j} ex={ex} thm={thm} />)}
        </div>
      ))}
      <div style={{ position: 'sticky', bottom: 0, paddingTop: 8, paddingBottom: 4, background: thm.modalBg }}>
        {active && active.plan_type !== id && <div style={{ fontSize: 12, color: thm.text50, textAlign: 'center', marginBottom: 8 }}>{t('Текущая программа «{name}» будет заменена. Веса подставим из твоих прошлых тренировок.', { name: t(programOf(active.plan_type)?.name || '') })}</div>}
        <button disabled={busy || active?.plan_type === id} onClick={() => onStart(id)} style={{ width: '100%', padding: 15, borderRadius: 16, border: 'none', background: active?.plan_type === id ? thm.card2 : ACC, color: active?.plan_type === id ? thm.text50 : '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
          {active?.plan_type === id ? t('Это твоя текущая программа') : busy ? t('Подключаю…') : t('Начать программу')}
        </button>
      </div>
    </div>
  )
}

// ── My plan ──────────────────────────────────────────────────────────────────
function MyPlan({ plan, thm, planWeights, onStartDay, onCatalog, onStop, guessWeight }) {
  const pr = planProgress(plan)
  const [openDay, setOpenDay] = useState(pr.dayIdx)
  const [confirmStop, setConfirmStop] = useState(false)
  const weightOf = (name) => planWeights[`${plan.id}:${name}`]?.working_weight || 0
  const today = pr.days[pr.dayIdx]
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: accA(0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{pr.prog?.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: thm.text }}>{t(pr.prog?.name || '')}</div>
          <div style={{ fontSize: 12, color: thm.text50, marginTop: 2 }}>{t('Неделя {w} из {n}', { w: pr.week, n: pr.weeks })} · {t('{d} из {t} тренировок', { d: pr.done, t: pr.total })}</div>
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: thm.card2, margin: '12px 0 16px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(3, pr.pct * 100)}%`, background: ACC, borderRadius: 99 }} />
      </div>

      {today && (
        <div style={{ borderRadius: 20, padding: 16, marginBottom: 14, background: accA(0.1), border: `1px solid ${accA(0.35)}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: ACC }}>{t('СЛЕДУЮЩАЯ ТРЕНИРОВКА')}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: thm.text, margin: '4px 0 2px' }}>{t(today.label)}</div>
          <div style={{ fontSize: 12, color: thm.text50 }}>{today.exercises.length} {plural(today.exercises.length, ['упражнение', 'упражнения', 'упражнений'], ['exercise', 'exercises'])} · {t('разминка')}: {t(today.warmupHint)}</div>
          <button onClick={() => onStartDay(plan, pr.dayIdx)} style={{ width: '100%', marginTop: 12, padding: 13, borderRadius: 14, border: 'none', background: ACC, color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            ▶ {t('Начать тренировку')}
          </button>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: thm.text40, margin: '4px 0 8px' }}>{t('Дни программы')}</div>
      {pr.days.map((d, i) => {
        const isNext = i === pr.dayIdx, open = openDay === i
        return (
          <div key={i} style={{ background: thm.card, border: `1px solid ${isNext ? accA(0.45) : thm.border}`, borderRadius: 16, marginBottom: 8, overflow: 'hidden' }}>
            <button onClick={() => setOpenDay(open ? -1 : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: isNext ? ACC : thm.card2, color: isNext ? '#000' : thm.text50, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: thm.text85 }}>{t(d.label)}</span>
              {isNext && <span style={{ fontSize: 10, fontWeight: 800, color: ACC }}>{t('СЛЕДУЮЩИЙ')}</span>}
              <span style={{ color: thm.text40, fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>
            {open && (
              <div style={{ padding: '0 14px 10px' }}>
                {d.exercises.map((ex, j) => <ExRow key={j} ex={ex} weight={weightOf(ex.name)} guess={guessWeight ? guessWeight(ex.name) : 0} thm={thm} />)}
                {!isNext && (
                  <button onClick={() => onStartDay(plan, i)} style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 12, border: `1px solid ${thm.border}`, background: 'transparent', color: thm.text70, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {t('Сделать этот день сегодня')}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onCatalog} style={{ flex: 1, padding: 12, borderRadius: 14, border: `1px solid ${thm.border}`, background: thm.card, color: thm.text70, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🔄 {t('Сменить программу')}</button>
        <button onClick={() => setConfirmStop(true)} style={{ flex: 1, padding: 12, borderRadius: 14, border: 'none', background: 'rgba(255,69,58,0.12)', color: '#FF453A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('Завершить')}</button>
      </div>
      {confirmStop && (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.3)' }}>
          <div style={{ fontSize: 13, color: thm.text, fontWeight: 600 }}>{t('Завершить программу «{name}»?', { name: t(pr.prog?.name || '') })}</div>
          <div style={{ fontSize: 12, color: thm.text50, margin: '3px 0 10px' }}>{t('История и рекорды останутся — можно вернуться к ней позже.')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onStop(plan)} style={{ flex: 1, padding: 9, borderRadius: 10, border: 'none', background: '#FF453A', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{t('Завершить')}</button>
            <button onClick={() => setConfirmStop(false)} style={{ flex: 1, padding: 9, borderRadius: 10, border: 'none', background: thm.card2, color: thm.text70, fontWeight: 600, cursor: 'pointer' }}>{t('Отмена')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// The whole sheet. view: 'my' | 'catalog' | program id (details)
export function PlansSheet({ thm, activePlans, planWeights, onClose, onStartDay, onChoose, onStop, initialView, guessWeight }) {
  const active = activePlans[0] || null
  const [view, setView] = useState(initialView || (active ? 'my' : 'catalog'))
  const [busy, setBusy] = useState(false)
  const isDetails = view !== 'my' && view !== 'catalog'
  const title = view === 'my' ? t('Мой план') : view === 'catalog' ? t('Программы') : ''
  const back = isDetails ? () => setView('catalog') : view === 'catalog' && active ? () => setView('my') : null
  return (
    <Sheet onClose={onClose} thm={thm}>
      <Header title={title} onBack={back} onClose={onClose} thm={thm} />
      <div style={{ overflowY: 'auto', padding: '4px 18px 28px', flex: 1 }}>
        {view === 'my' && active && (
          <>
            {activePlans.length > 1 && <div style={{ fontSize: 12, color: thm.text40, marginBottom: 10 }}>{t('Активных программ: {n}. Показана основная.', { n: activePlans.length })}</div>}
            <MyPlan plan={active} thm={thm} planWeights={planWeights} onStartDay={onStartDay} onCatalog={() => setView('catalog')} onStop={onStop} guessWeight={guessWeight} />
          </>
        )}
        {view === 'catalog' && <Catalog thm={thm} onOpen={setView} currentType={active?.plan_type} />}
        {isDetails && programOf(view) && (
          <Details id={view} thm={thm} active={active} busy={busy}
            onStart={async (id) => { setBusy(true); const ok = await onChoose(id); setBusy(false); if (ok) setView('my') }} />
        )}
      </div>
    </Sheet>
  )
}

// Card on the start screen: next workout of the plan, one tap starts it
export function TodayPlanCard({ plan, thm, onStart, onOpen }) {
  const pr = planProgress(plan)
  const day = pr.days[pr.dayIdx]
  if (!day) return null
  return (
    <div style={{ width: '100%', maxWidth: 340, display: 'flex', alignItems: 'stretch', borderRadius: 18, border: `1px solid ${thm.border}`, background: thm.card, overflow: 'hidden' }}>
      <button onClick={() => onStart(plan, pr.dayIdx)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: accA(0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{pr.prog?.icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: ACC }}>{t('ПО ПЛАНУ')} · {t('НЕДЕЛЯ {w}', { w: pr.week })}</span>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: thm.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(day.label)}</span>
          <span style={{ display: 'block', fontSize: 12, color: thm.text50 }}>{day.exercises.length} {plural(day.exercises.length, ['упражнение', 'упражнения', 'упражнений'], ['exercise', 'exercises'])} · {t('нажми, чтобы начать')}</span>
        </span>
      </button>
      <button onClick={onOpen} aria-label={t('Мой план')} style={{ width: 46, border: 'none', borderLeft: `1px solid ${thm.border}`, background: 'none', color: thm.text50, fontSize: 20, cursor: 'pointer' }}>›</button>
    </div>
  )
}
