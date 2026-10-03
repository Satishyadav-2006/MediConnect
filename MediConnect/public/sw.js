// Bump the cache name whenever caching behaviour changes so the old
// cache (and any stale API responses inside it) is purged on activate.
const CACHE_NAME = 'mediconnect-v2'
const OFFLINE_URLS = ['/', '/login', '/dashboard', '/feed']

// Requests that must always hit the network. Caching these serves stale data
// or stale code, which is far worse than being briefly offline.
function isBypassed(pathname) {
  return (
    pathname.startsWith('/api/') ||
    // Vite dev server assets and HMR
    pathname.startsWith('/@vite/') ||
    pathname.startsWith('/@react-refresh') ||
    pathname.startsWith('/@id/') ||
    pathname.startsWith('/src/') ||
    pathname.includes('/node_modules/') ||
    pathname.startsWith('/__vite')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isBypassed(url.pathname)) return

  // Network-first: always prefer a fresh response, fall back to the cache
  // only when the network is unavailable (offline app shell).
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => (
        caches.match(request).then((cached) => (
          cached || (request.mode === 'navigate' ? caches.match('/') : undefined)
        ))
      ))
  )
})
