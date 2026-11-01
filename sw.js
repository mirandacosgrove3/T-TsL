// Offline cache for T-TsL.
// Opens instantly from cache, checks GitHub for a newer copy in the background
// (bypassing the browser's HTTP cache), and tells the page when one arrives.
const CACHE = 'ttsl-v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(u =>
    fetch(u, {cache: 'reload'}).then(r => { if (r.ok) return c.put(u, r); })
  ))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function tellPages() {
  const cs = await self.clients.matchAll({type: 'window'});
  cs.forEach(c => c.postMessage('ttsl-updated'));
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('version.json') || url.searchParams.has('fresh')) return;
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, {ignoreSearch: true});
    const fresh = fetch(url.href, {cache: 'no-store'}).then(async res => {
      if (!res.ok) return res;
      if (hit && isPage) {
        const [a, b] = await Promise.all([hit.clone().text(), res.clone().text()]);
        if (a !== b) { await cache.put(e.request, res.clone()); await tellPages(); }
      } else {
        await cache.put(e.request, res.clone());
      }
      return res;
    }).catch(() => hit);
    if (hit) { e.waitUntil(fresh); return hit; }
    return fresh;
  }));
});
