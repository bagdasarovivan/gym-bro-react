import { noteKind } from '../data/notes'

// Victorian-style note icons: an engraved glyph inside a medallion with a double rim.
// Drawn in one colour (the kind's colour) with thin "engraving" hatches, to match the app's illustrations.
const GLYPHS = {
  // apothecary bottle with a cross on the label
  sick: (
    <>
      <path d="M13.8 8.2h4.4v2.2h-4.4z" />
      <path d="M14.5 10.4v2.2c-2.5 1-3.9 2.9-3.9 5.3v4.4c0 .9.7 1.5 1.5 1.5h7.8c.9 0 1.5-.6 1.5-1.5v-4.4c0-2.4-1.4-4.3-3.9-5.3v-2.2" />
      <path d="M12.6 17h6.8v4.6h-6.8z" />
      <path d="M16 17.8v3M14.5 19.3h3" />
      <path d="M20.2 15.2l.6.9M20.8 17l.4.9" strokeWidth="0.7" />
    </>
  ),
  // crutch
  injury: (
    <>
      <path d="M11.2 8.6h9.6" strokeWidth="1.8" />
      <path d="M12.4 8.6l2.9 8.6M19.6 8.6l-2.9 8.6" />
      <path d="M13.5 13.4h5" strokeWidth="1.6" />
      <path d="M16 17.2v6.4" strokeWidth="1.6" />
      <path d="M14.6 23.6h2.8" />
      <path d="M17.2 18.6l.8.5M17.2 20.4l.8.5" strokeWidth="0.7" />
    </>
  ),
  // travel trunk with straps and handle
  vacation: (
    <>
      <path d="M14 12.6v-1.8c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v1.8" />
      <rect x="9.4" y="12.6" width="13.2" height="9.6" rx="1.4" />
      <path d="M13 12.6v9.6M19 12.6v9.6" />
      <path d="M9.4 16.4h13.2" strokeWidth="0.8" />
      <path d="M15.2 15.6h1.6v1.8h-1.6z" />
      <path d="M20.4 18.4l.9.9M20.4 20l.9.9" strokeWidth="0.7" />
    </>
  ),
  // crescent moon and stars
  rest: (
    <>
      <path d="M18.6 8.8a7 7 0 1 0 4.6 12.1 5.6 5.6 0 0 1-4.6-12.1z" />
      <path d="M12.4 13.2a5.6 5.6 0 0 0 1.9 6.6" strokeWidth="0.7" />
      <path d="M21.6 11v2.2M20.5 12.1h2.2" strokeWidth="0.9" />
      <path d="M10.6 9.6v1.6M9.8 10.4h1.6" strokeWidth="0.9" />
    </>
  ),
  // burnt-down candle on a dish
  tired: (
    <>
      <path d="M9.8 22.6c0 .9 2.8 1.5 6.2 1.5s6.2-.6 6.2-1.5" />
      <path d="M9.8 22.6h12.4" />
      <path d="M13.4 22.6v-6.4c.6-.6 1.2-.6 1.8 0 .5.5 1.1.5 1.6 0 .6-.6 1.2-.6 1.8 0v6.4" />
      <path d="M18.6 16.4v2.4" strokeWidth="1" />
      <path d="M16 15.6v-1.4" strokeWidth="0.9" />
      <path d="M16 13.4c-1.1-1.2-1.1-2.6 0-4.2 1.1 1.6 1.1 3 0 4.2z" />
      <path d="M14.2 18.4v3M15.4 18.8v2.6" strokeWidth="0.6" />
    </>
  ),
  // laurel wreath with a ribbon
  max: (
    <>
      <path d="M14.4 23.2c-3.2-1.2-5-4.2-4.6-8.6M17.6 23.2c3.2-1.2 5-4.2 4.6-8.6" />
      {[[10.2, 15.6, -40], [10.7, 18.4, -60], [12.2, 20.8, -80], [21.8, 15.6, 40], [21.3, 18.4, 60], [19.8, 20.8, 80]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.9" ry="0.9" transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <ellipse cx="10" cy="12.8" rx="0.9" ry="1.7" />
      <ellipse cx="22" cy="12.8" rx="0.9" ry="1.7" />
      <path d="M13.6 24.4l2.4-1.8 2.4 1.8" />
      <path d="M16 11.2l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" strokeWidth="0.9" />
    </>
  ),
  // quill in an inkwell
  note: (
    <>
      <path d="M10.6 23.6h6.8v-3.6c0-.8-.7-1.4-1.4-1.4h-4c-.8 0-1.4.6-1.4 1.4z" />
      <path d="M11.8 18.6v-1.2h4.4v1.2" />
      <path d="M14 17.4l8-9" />
      <path d="M22 8.4c-3.4.4-6 3-7 6.8 2.8-.4 5.4-2.8 7-6.8z" />
      <path d="M17 12.4l1.4.4M18.4 11l1.3.4M16 14l1.2.3" strokeWidth="0.6" />
      <path d="M12 21.2h4" strokeWidth="0.6" />
    </>
  ),
}

export function NoteIcon({ kind, size = 28, color }) {
  const k = noteKind(kind)
  const c = color || k.color
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label={k.label} role="img" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="16" cy="16" r="15" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1.2" />
      <circle cx="16" cy="16" r="12.6" fill="none" stroke={c} strokeWidth="0.5" strokeDasharray="0.6 1.4" />
      {[[16, 1.6], [30.4, 16], [16, 30.4], [1.6, 16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.9" fill={c} />)}
      <g fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">{GLYPHS[k.id]}</g>
    </svg>
  )
}

// Small glyph without the medallion (calendar cells, chart markers)
export function NoteGlyph({ kind, size = 14, color }) {
  const k = noteKind(kind)
  const c = color || k.color
  return (
    <svg width={size} height={size} viewBox="7 6.5 18 19" aria-label={k.label} role="img" style={{ display: 'block', flexShrink: 0 }}>
      <g fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{GLYPHS[k.id]}</g>
    </svg>
  )
}
