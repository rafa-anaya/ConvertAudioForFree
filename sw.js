const CACHE_NAME = 'audio-tool-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js'
    // Nota: El binario de unpkg de FFmpeg se cacheará automáticamente si interceptamos las requests de red.
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    // Solo procesar peticiones GET con esquemas http/https soportados
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Retorna cache si existe, si no, hace la petición a la red
            return response || fetch(event.request).then((fetchRes) => {
                // Guardar en cache sólo si es una respuesta válida
                if (!fetchRes || fetchRes.status !== 200 || fetchRes.type !== 'basic' && fetchRes.type !== 'cors') {
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