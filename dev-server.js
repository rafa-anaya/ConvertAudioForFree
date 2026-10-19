const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.wasm': 'application/wasm'
};

// Serve the built site (run `node build.js` first)
const ROOT = path.join(__dirname, 'dist');

function resolveFile(urlPath) {
    let decoded;
    try {
        decoded = decodeURIComponent(urlPath);
    } catch {
        return null;
    }
    let filePath = path.normalize(path.join(ROOT, decoded));
    if (!filePath.startsWith(ROOT)) return null; // path traversal guard

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        filePath += '.html'; // clean URLs: /en/about -> /en/about.html
    }
    return filePath;
}

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    const cleanUrl = req.url.split('?')[0];
    const filePath = resolveFile(cleanUrl);
    if (!filePath) {
        res.writeHead(400);
        res.end('Ruta inválida');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Archivo no encontrado');
            } else {
                res.writeHead(500);
                res.end(`Error de servidor: ${error.code}`);
            }
        } else {
            const headers = { 'Content-Type': contentType };

            // COEP/COOP headers ONLY for the processing page
            // Required for SharedArrayBuffer (FFmpeg.wasm multithreaded)
            // NOT applied to other pages to allow AdSense iframes
            if (req.url.includes('procesar')) {
                headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
                headers['Cross-Origin-Opener-Policy'] = 'same-origin';
            }

            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Servidor de desarrollo corriendo en: http://localhost:${PORT}`);
    console.log('Presiona Ctrl+C para detenerlo.\n');
});
