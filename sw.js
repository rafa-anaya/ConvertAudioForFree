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
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Retorna cache si existe, si no, hace la petición a la red
            return response || fetch(event.request).then((fetchRes) => {
                // Si es el binario WebAssembly, lo guardamos dinámicamente
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request.url, fetchRes.clone());
                    return fetchRes;
                });
            });
        })
    );
});