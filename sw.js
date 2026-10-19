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

// Fetch: network-first with cache fallback (offline support).
// Network-first guarantees returning visitors always get the latest deploy.
function withIsolationHeaders(request, response) {
    // COEP/COOP for the processing page (required for SharedArrayBuffer / FFmpeg.wasm).
    // Injected here because static hosts like GitHub Pages can't set custom headers.
    if (!request.url.includes('/procesar')) return response;
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}

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
        fetch(event.request, { cache: 'no-cache' })
            .then((fetchRes) => {
                if (fetchRes && fetchRes.status === 200 && fetchRes.type === 'basic') {
                    const responseToCache = fetchRes.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                }
                return withIsolationHeaders(event.request, fetchRes);
            })
            .catch(() =>
                caches.match(event.request).then((cached) =>
                    cached ? withIsolationHeaders(event.request, cached) : Response.error()
                )
            )
    );
});