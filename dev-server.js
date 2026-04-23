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

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
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
