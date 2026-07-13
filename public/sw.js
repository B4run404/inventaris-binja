// Service Worker — Inventaris Binja
// Strategy: Network-first for API calls, Cache-first for static assets.
// Keeps the app usable even with flaky connections in the field.

const CACHE_NAME = 'binja-v1'

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-512.png',
]

// ---- Install: pre-cache essential shell ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ---- Activate: clean old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ---- Fetch: network-first with cache fallback ----
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and Supabase auth requests (always fresh)
  if (request.method !== 'GET') return
  if (url.pathname.includes('/auth/')) return

  // For Supabase REST API: network-only (data must be fresh)
  if (url.hostname.includes('supabase')) return

  // For everything else (app shell, CSS, JS, fonts): stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      const fetchPromise = fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            cache.put(request, response.clone())
          }
          return response
        })
        .catch(() => cached) // If network fails, fall back to cache

      return cached || fetchPromise
    })
  )
})
