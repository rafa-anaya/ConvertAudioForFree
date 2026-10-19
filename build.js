const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const I18N_DIR = path.join(__dirname, 'i18n');

// Load dictionaries
const dicts = {
    es: JSON.parse(fs.readFileSync(path.join(I18N_DIR, 'es.json'), 'utf8')),
    en: JSON.parse(fs.readFileSync(path.join(I18N_DIR, 'en.json'), 'utf8'))
};

const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'en';
const SITE_URL = 'https://audiotoolpro.com'; // Cambiar por el dominio real

function build() {
    // 1. Clean dist
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DIST_DIR, { recursive: true });

    // 2. Create lang folders
    SUPPORTED_LANGS.forEach(lang => {
        fs.mkdirSync(path.join(DIST_DIR, lang), { recursive: true });
    });

    // 3. Process HTML files
    const files = fs.readdirSync(SRC_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    htmlFiles.forEach(file => {
        const srcPath = path.join(SRC_DIR, file);
        const originalHtml = fs.readFileSync(srcPath, 'utf8');

        SUPPORTED_LANGS.forEach(lang => {
            // Handle privacy policy files specifically
            if (file === 'privacidad.html' && lang === 'en') return;
            if (file === 'privacidad-en.html' && lang === 'es') return;

            let html = originalHtml;
            const dict = dicts[lang];

            // Replace <html lang="...">
            html = html.replace(/<html[^>]*lang="([^"]+)"[^>]*>/i, (match) => {
                return match.replace(/lang="[^"]+"/, `lang="${lang}"`);
            });

            // Replace <meta name="description" ...>
            html = html.replace(/<meta[^>]*data-i18n="([^"]+)"[^>]*>/i, (match, key) => {
                const translation = dict[key] || dict['meta_desc'] || '';
                // If it already has a content attribute, replace it
                if (match.includes('content="')) {
                    return match.replace(/content="[^"]*"/, `content="${translation}"`);
                }
                return match.replace('>', ` content="${translation}">`);
            });

            // Replace text content for data-i18n="..."
            html = html.replace(/(<([a-zA-Z0-9]+)[^>]*data-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/gi, (match, openTag, tagName, key, content, closeTag) => {
                if (dict[key]) {
                    return openTag + dict[key] + closeTag;
                }
                return match;
            });

            // Replace aria-labels for data-i18n-aria="..."
            html = html.replace(/data-i18n-aria="([^"]+)"/gi, (match, key) => {
                if (dict[key]) {
                    return `data-i18n-aria="${key}" aria-label="${dict[key]}"`;
                }
                return match;
            });

            // Fix internal links to keep the user in the same language folder
            html = html.replace(/href="([^"]+)"/gi, (match, url) => {
                if (url.startsWith('http') || url.startsWith('//') || url.startsWith('#') || url.startsWith('mailto:')) {
                    return match;
                }
                if (url.endsWith('.css') || url.includes('/css/')) {
                    return match;
                }
                if (url.includes('public/')) {
                    return match;
                }

                // Treat both 'Index.html' and 'index.html'
                if (url.toLowerCase() === 'index.html') {
                    return `href="/${lang}/"`;
                }

                if (url === '/') {
                    return `href="/${lang}/"`;
                }
                if (url.endsWith('.html')) {
                    const cleanUrl = url.replace('.html', '');
                    return `href="/${lang}/${cleanUrl}"`;
                }
                return match;
            });

            // Inject hreflang tags before </head>
            const originalFilenameForHreflang = file === 'privacidad-en.html' ? 'privacidad.html' : file;
            let hreflangTags = SUPPORTED_LANGS.map(l =>
                `    <link rel="alternate" hreflang="${l}" href="/${l}/${originalFilenameForHreflang === 'index.html' ? '' : originalFilenameForHreflang}">`
            ).join('\n');
            hreflangTags += `\n    <link rel="alternate" hreflang="x-default" href="/${DEFAULT_LANG}/${originalFilenameForHreflang === 'index.html' ? '' : originalFilenameForHreflang}">\n`;

            html = html.replace('</head>', `${hreflangTags}</head>`);

            // Adjust paths to assets
            html = html.replace(/(href|src)="((css|js|public)\/[^"]+)"/gi, '$1="/$2"');

            // Save translated file
            const outputFilename = file === 'privacidad-en.html' ? 'privacidad.html' : file;
            const destPath = path.join(DIST_DIR, lang, outputFilename);
            fs.writeFileSync(destPath, html);
        });
    });

    // 4. Create root index.html (Redirector)
    const rootIndex = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AudioTool Pro</title>
    <script>
        var lang = navigator.language || navigator.userLanguage;
        var langCode = lang.split('-')[0];
        if (langCode === 'es') {
            window.location.replace('/es/');
        } else {
            window.location.replace('/en/');
        }
    </script>
</head>
<body>
    <p>Redirecting... <a href="/en/">English</a> | <a href="/es/">Español</a></p>
</body>
</html>`;
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), rootIndex);

    // 5. Copy static assets to dist
    const dirsToCopy = ['css', 'js', 'public', 'i18n'];
    dirsToCopy.forEach(dir => {
        if (fs.existsSync(dir)) {
            copyDirSync(dir, path.join(DIST_DIR, dir));
        }
    });

    // 6. Copy other specific files and update sw.js
    const filesToCopy = ['_headers', 'favicon.ico', 'favicon.png', 'serve.json', 'ads.txt'];
    filesToCopy.forEach(f => {
        if (fs.existsSync(f)) {
            fs.copyFileSync(f, path.join(DIST_DIR, f));
        }
    });

    // Handle sw.js: inject generated routes
    if (fs.existsSync('sw.js')) {
        let swContent = fs.readFileSync('sw.js', 'utf8');
        const allRoutes = [];
        SUPPORTED_LANGS.forEach(lang => {
            htmlFiles.forEach(file => {
                if (file === 'privacidad.html' && lang === 'en') return;
                if (file === 'privacidad-en.html' && lang === 'es') return;

                const outputFilename = file === 'privacidad-en.html' ? 'privacidad.html' : file;
                const cleanName = outputFilename.replace('.html', '');
                allRoutes.push(`/${lang}/${cleanName === 'index' ? '' : cleanName}`);
            });
        });

        swContent = swContent.replace(/const ASSETS_TO_CACHE = \[/, `const ASSETS_TO_CACHE = [\n    ${allRoutes.map(r => `'${r}'`).join(',\n    ')},`);

        htmlFiles.forEach(file => {
            swContent = swContent.replace(new RegExp(`'/${file}',?\\s*`, 'g'), '');
        });

        // Auto-version the cache with a hash of the built content.
        // Any change in dist => new sw.js bytes => browsers install the new SW
        // and the activate handler deletes the old caches.
        const buildHash = hashDir(DIST_DIR);
        swContent = swContent.replace(/const CACHE_NAME = '[^']*';/, `const CACHE_NAME = 'audio-tool-${buildHash}';`);
        console.log(`Service worker cache: audio-tool-${buildHash}`);

        fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), swContent);
    }

    // 7. Generate Sitemap & Robots.txt
    generateSitemap(htmlFiles);

    console.log('Build completed successfully!');
}

function generateSitemap(htmlFiles) {
    const urls = [];
    const now = new Date().toISOString().split('T')[0];

    SUPPORTED_LANGS.forEach(lang => {
        htmlFiles.forEach(file => {
            if (file === 'privacidad.html' && lang === 'en') return;
            if (file === 'privacidad-en.html' && lang === 'es') return;

            const outputFilename = file === 'privacidad-en.html' ? 'privacidad.html' : file;
            const cleanName = outputFilename.replace('.html', '');
            const pagePath = `/${lang}/${cleanName === 'index' ? '' : cleanName}`;

            let urlEntry = `  <url>\n    <loc>${SITE_URL}${pagePath}</loc>\n    <lastmod>${now}</lastmod>\n`;

            // Add alternates
            SUPPORTED_LANGS.forEach(l => {
                const altOutputFilename = outputFilename; // They both share the same output name now
                const altCleanName = altOutputFilename.replace('.html', '');
                const altPath = `/${l}/${altCleanName === 'index' ? '' : altCleanName}`;
                urlEntry += `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${altPath}"/>\n`;
            });

            // Add x-default
            const defPath = `/${DEFAULT_LANG}/${outputFilename.replace('.html', '') === 'index' ? '' : outputFilename.replace('.html', '')}`;
            urlEntry += `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${defPath}"/>\n`;

            urlEntry += `  </url>`;
            urls.push(urlEntry);
        });
    });

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapContent);

    // Generate robots.txt
    const robotsContent = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`;
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsContent);
    console.log('Sitemap and robots.txt generated.');
}

function hashDir(dir) {
    const hash = crypto.createHash('sha256');
    const walk = (d) => {
        fs.readdirSync(d, { withFileTypes: true })
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(entry => {
                const full = path.join(d, entry.name);
                if (entry.isDirectory()) return walk(full);
                if (full === path.join(DIST_DIR, 'sw.js')) return;
                hash.update(path.relative(dir, full));
                hash.update(fs.readFileSync(full));
            });
    };
    walk(dir);
    return hash.digest('hex').slice(0, 10);
}

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        entry.isDirectory() ? copyDirSync(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
    }
}

build();
