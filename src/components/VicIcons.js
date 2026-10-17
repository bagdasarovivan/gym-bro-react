// Victorian-style line icons for the header and the bottom navigation (engraved look, one colour).
// Drawn on a 32×32 grid with currentColor, so they take the accent / text colour of where they sit.

const FLAME = 'M0 0c-1.7-1.2-2.1-3.1-.2-5.8.4 1 .9 1.5 1.4 1.7.3-.9.2-1.7-.1-2.5 1.7 1.5 2.3 3.2 1.5 4.8C2.2-.9 1.3-.1 0 0z'

// 8-tooth gear outline
const gearPath = (() => {
  const teeth = 8, R = 10.5, r = 8.2
  let d = ''
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i * Math.PI) / teeth, rr = i % 2 ? r : R, w = (Math.PI / teeth) * 0.32
    const p = (ang) => `${(16 + rr * Math.cos(ang)).toFixed(2)} ${(16 + rr * Math.sin(ang)).toFixed(2)}`
    d += `${i ? 'L' : 'M'}${p(a - w)}L${p(a + w)}`
  }
  return d + 'Z'
})()

const GLYPHS = {
  // body weight — kettlebell
  kettlebell: (
    <>
      <path d="M11.5 12.5c0-4 2-6.2 4.5-6.2s4.5 2.2 4.5 6.2" />
      <circle cx="16" cy="19.5" r="7.5" />
      <path d="M10.4 25.6h11.2" />
      <path d="M13 19.5h6M14 22h4" strokeWidth="1" />
      <path d="M11.2 16.4a5.6 5.6 0 0 1 2.2-2.6" strokeWidth="0.8" />
    </>
  ),
  // timer — pocket watch
  watch: (
    <>
      <circle cx="16" cy="18" r="9" />
      <circle cx="16" cy="18" r="7.2" strokeWidth="0.6" />
      <path d="M14.6 6.6h2.8v2.3h-2.8z" />
      <circle cx="16" cy="4.9" r="1.6" />
      <path d="M16 18v-4.6M16 18l3.2 1.6" />
      <path d="M16 11.4v1.1M22.6 18h-1.1M16 24.6v-1.1M9.4 18h1.1" strokeWidth="1" />
      <circle cx="16" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  // workout series — kerosene lantern with a flame
  lantern: (
    <>
      <path d="M12.2 6.6c0-2 1.7-3 3.8-3s3.8 1 3.8 3" />
      <path d="M10.6 6.6h10.8l-1.5 3h-7.8z" />
      <path d="M12.2 9.6c-2.4 2.4-3 4.6-3 7s1 4.5 3 6h7.6c2-1.5 3-3.6 3-6s-.6-4.6-3-7" />
      <path d="M11.2 10.4v11.4M20.8 10.4v11.4" strokeWidth="0.6" />
      <path d="M10 22.6h12v2.4H10zM8.8 25h14.4" />
      <path transform="translate(16 20.2) scale(1.05)" d={FLAME} fill="currentColor" stroke="none" />
    </>
  ),
  // settings — gear
  gear: (
    <>
      <path d={gearPath} />
      <circle cx="16" cy="16" r="5.4" strokeWidth="0.7" />
      <circle cx="16" cy="16" r="2.6" />
      <path d="M16 10.6v1.6M16 19.8v1.6M10.6 16h1.6M19.8 16h1.6" strokeWidth="0.8" />
    </>
  ),
  // workout — barbell: big plates in the middle, small plates outside
  barbell: (
    <>
      <path d="M1.8 16h28.4" strokeWidth="1.7" />
      <rect x="7.4" y="8.5" width="3.2" height="15" rx="1" />
      <rect x="21.4" y="8.5" width="3.2" height="15" rx="1" />
      <rect x="4.6" y="11.2" width="2.4" height="9.6" rx="0.8" />
      <rect x="25" y="11.2" width="2.4" height="9.6" rx="0.8" />
      <path d="M11.2 14.4v3.2M20.8 14.4v3.2" strokeWidth="1.3" />
    </>
  ),
  // history — open book
  book: (
    <>
      <path d="M16 9.2c-2.6-1.6-6.2-2.1-9.4-1.6v15.6c3.2-.5 6.8 0 9.4 1.6 2.6-1.6 6.2-2.1 9.4-1.6V7.6c-3.2-.5-6.8 0-9.4 1.6z" />
      <path d="M16 9.2v15.6" />
      <path d="M9 11.8c1.8 0 3.6.3 4.8.8M9 14.8c1.8 0 3.6.3 4.8.8M9 17.8c1.8 0 3.6.3 4.8.8M23 11.8c-1.8 0-3.6.3-4.8.8M23 14.8c-1.8 0-3.6.3-4.8.8" strokeWidth="0.8" />
    </>
  ),
  // progress — steps going up with an arrow
  stairs: (
    <>
      <path d="M4 27.5h24V14h-6v4.5h-6V23h-6v4.5z" />
      <path d="M6 17.5 17 7.5" />
      <path d="M12.6 7.2h4.6v4.6" />
      <path d="M10 27.5V23M16 27.5v-9M22 27.5V14" strokeWidth="0.6" />
    </>
  ),
  // exercises — exercise manual with a dumbbell emblem
  manual: (
    <>
      <path d="M8 6.5h14a2 2 0 0 1 2 2v17.5H10a2 2 0 0 1-2-2z" />
      <path d="M8 24a2 2 0 0 1 2-2h14" />
      <path d="M13.6 13h4.8" />
      <circle cx="12.4" cy="13" r="1.8" />
      <circle cx="19.6" cy="13" r="1.8" />
      <path d="M12 17.6h8" strokeWidth="0.8" />
    </>
  ),
}

export function VicIcon({ name, size = 22, color = 'currentColor', strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block', flexShrink: 0, color }}>
      {GLYPHS[name]}
    </svg>
  )
}
