// eusouodu app: guarda a casca do app para abrir rápido e sem rede.
// Os textos do dia vêm da rede (com cópia salva pela própria página).
const CASCA = 'eusouodu-app-v1';
const ARQUIVOS = ['/app/', '/app/manifest.webmanifest', '/apple-touch-icon.png', '/icon-512.png', '/musica/cidades.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CASCA).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CASCA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  // rede primeiro, cópia guardada se estiver sem internet
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && ARQUIVOS.includes(u.pathname)) { const c = r.clone(); caches.open(CASCA).then(k => k.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});

// notificação diária (o envio do servidor entra na próxima etapa)
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch { d = { titulo: 'eusouodu', texto: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Energia astrológica do dia', { body: d.texto || '', icon: '/icon-512.png', badge: '/favicon-32.png', data: { url: d.url || '/app/' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow(e.notification.data && e.notification.data.url || '/app/'));
});
