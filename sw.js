const CACHE_NAME = 'audio-tool-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js'
];

// Instalar: cachear assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    // Forzar activación inmediata sin esperar a que cierren pestañas
    self.skipWaiting();
});

// Activar: eliminar caches de versiones anteriores
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names.filter(name => name !== CACHE_NAME)
                     .map(name => caches.delete(name))
            );
        })
    );
    // Tomar control de las pestañas abiertas inmediatamente
    self.clients.claim();
});

// Fetch: cache-first con fallback a red
self.addEventListener('fetch', (event) => {
    // Solo procesar peticiones GET con esquemas http/https
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchRes) => {
                if (!fetchRes || fetchRes.status !== 200 || (fetchRes.type !== 'basic' && fetchRes.type !== 'cors')) {
                    return fetchRes;
                }
                const responseToCache = fetchRes.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return fetchRes;
            });
        })
    );
});