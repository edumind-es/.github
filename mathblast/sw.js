/* MathBlast! 2.0 · Service worker: permite jugar sin conexión.
   Sube el número de versión cada vez que cambies un archivo de la app. */
const CACHE = 'mathblast-v2.0.0';
const APP = ['./', 'index.html', 'css/styles.css', 'js/app.js', 'manifest.webmanifest', 'icons/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    // Guarda también las fuentes de Google para tenerlas sin conexión
    if (res.ok || res.type === 'opaque') {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  }).catch(() => e.request.mode === 'navigate' ? caches.match('index.html') : Response.error())));
});
