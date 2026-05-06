const CACHE = 'offers-v2';
const FILES = [
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache local files strictly; fonts may fail if offline on first install
      return c.addAll(['./index.html', './manifest.json', './icon.svg'])
        .then(() => fetch('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap')
          .then(r => r.ok ? c.put('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap', r) : null)
          .catch(() => null)
        );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Cache-first for local files and fonts
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(r => {
        if (r) return r;
        return fetch(e.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        }).catch(() => new Response('', {status: 408}));
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
