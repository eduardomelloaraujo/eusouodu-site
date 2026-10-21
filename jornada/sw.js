// Jornada: guarda o essencial para abrir rápido e funcionar com internet fraca.
// A página sempre tenta a versão nova primeiro; sem internet, usa a última guardada.
const V = 'jornada-v2'; // v2: tema planetário (o manifesto em cache tinha a cor antiga)
const BASE = ['/', '/jornada/astronomy.browser.min.js', '/jornada/manifest.webmanifest', '/jornada/icon-192.png', '/jornada/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) return;
  if (u.origin === location.origin && (e.request.mode === 'navigate' || u.pathname === '/')) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put('/', c)); return r; }).catch(() => caches.match('/')));
    return;
  }
  if (u.origin === location.origin || u.hostname.endsWith('fonts.gstatic.com') || u.hostname.endsWith('fonts.googleapis.com')) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })));
  }
});
