/* Gym BRO service worker: lets the installed app open without a connection.
   - pages: network first, the cached app shell when offline
   - built files (/static/…, hashed names) and pictures: cache first, filled as they are used
   Supabase requests are not touched (other origin): offline data and saving are handled in the app. */
const SHELL = 'gymbro-shell-v1'
const ASSETS = 'gymbro-assets-v1'

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL)
    await cache.addAll(['/', '/manifest.json', '/apple-touch-icon.png', '/logo192.png', '/logo512.png'])
    // the current JS/CSS bundles, so the first offline start works right after installing
    try {
      const res = await fetch('/asset-manifest.json', { cache: 'no-store' })
      const files = Object.values((await res.json()).files || {}).filter(f => typeof f === 'string' && /\.(js|css)$/.test(f))
      await (await caches.open(ASSETS)).addAll(files)
    } catch (e) { /* will be cached on first use */ }
    self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL, ASSETS]
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k)
    await self.clients.claim()
  })())
})

// keep the asset cache from growing forever (old bundles of earlier versions)
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // App pages: fresh from the network, the saved shell when offline
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req)
        if (res.ok) (await caches.open(SHELL)).put('/', res.clone())
        return res
      } catch (e) {
        return (await caches.match('/')) || Response.error()
      }
    })())
    return
  }

  // Hashed bundles and pictures: from the cache, otherwise from the network (and saved)
  if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/images/') || /\.(png|webp|ico|json)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const hit = await caches.match(req)
      if (hit) return hit
      try {
        const res = await fetch(req)
        if (res.ok) { const c = await caches.open(ASSETS); c.put(req, res.clone()); trim(ASSETS, 300) }
        return res
      } catch (e) {
        return hit || Response.error()
      }
    })())
  }
})
