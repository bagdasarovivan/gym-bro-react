import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const MIN_MS = 1000  // keep the logo on screen at least this long
const FADE_MS = 450

// Launch screen drawn over the app: shows the logo for at least MIN_MS (and until the
// session is read), then fades out. Rendered next to <App/>, so it never blocks the app
// from loading underneath.
export function Splash() {
  const [phase, setPhase] = useState('show') // show | fade | gone

  useEffect(() => {
    let alive = true
    const minTime = new Promise(r => setTimeout(r, MIN_MS))
    const session = supabase.auth.getSession().catch(() => null)
    Promise.all([minTime, session]).then(() => {
      if (!alive) return
      setPhase('fade')
      setTimeout(() => alive && setPhase('gone'), FADE_MS)
    })
    return () => { alive = false }
  }, [])

  if (phase === 'gone') return null
  return (
    <div aria-hidden="true" style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'fade' ? 0 : 1, transition: `opacity ${FADE_MS}ms ease`,
      pointerEvents: phase === 'fade' ? 'none' : 'auto',
    }}>
      <style>{`@keyframes gbSplashIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ animation: 'gbSplashIn 0.5s cubic-bezier(0.34,1.3,0.64,1) both', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 120, height: 120, borderRadius: 28, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.08)' }}>
          <img src="/images/gymbro_logo.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 16, letterSpacing: 1, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Gym BRO</div>
      </div>
    </div>
  )
}
