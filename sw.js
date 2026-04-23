const CACHE_NAME = 'audio-tool-v12';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/procesar.html',
    '/descarga.html',
    '/about.html',
    '/contact.html',
    '/css/shared.css',
    '/css/editor.css',
    '/css/processor.css',
    '/css/download.css',
    '/css/pages.css',
    '/i18n/es.json',
    '/i18n/en.json',
    '/js/i18n.js',
    '/js/idb-manager.js',
    '/js/editor.js',
    '/js/processor.js',
    '/js/download.js'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    // Force immediate activation
    self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    // Take control of open tabs immediately
    self.clients.claim();
});

// Fetch: cache-first with network fallback
self.addEventListener('fetch', (event) => {
    // Only process GET requests with http/https schemes
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    const reqUrl = new URL(event.request.url);
    if (reqUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                if (event.request.url.includes('/procesar')) {
                    const newHeaders = new Headers(response.headers);
                    newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
                    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders
                    });
                }
                return response;
            }

            return fetch(event.request).then((fetchRes) => {
                if (!fetchRes || fetchRes.status !== 200 || (fetchRes.type !== 'basic' && fetchRes.type !== 'cors')) {
                    return fetchRes;
                }
                const responseToCache = fetchRes.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                if (event.request.url.includes('/procesar')) {
                    const newHeaders = new Headers(fetchRes.headers);
                    newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
                    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
                    return new Response(fetchRes.body, {
                        status: fetchRes.status,
                        statusText: fetchRes.statusText,
                        headers: newHeaders
                    });
                }

                return fetchRes;
            });
        })
    );
});