// Bathroom (floor) scale icon for the body weight button; uses currentColor.
export function ScaleIcon({ size = 20, strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M7.5 10.5a4.5 4.5 0 0 1 9 0" />
      <path d="M12 10.5l1.8-2.2" />
      <circle cx="12" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
