const fs = require('fs');
const path = require('path');

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
    const filesToCopy = ['_headers', 'favicon.ico', 'serve.json'];
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

        // Find ASSETS_TO_CACHE = [ ... ] and append allRoutes
        // This is a simple regex replacement for the array.
        // Or we can just prepend the routes to the existing array.
        swContent = swContent.replace(/const ASSETS_TO_CACHE = \[/, `const ASSETS_TO_CACHE = [\n    ${allRoutes.map(r => `'${r}'`).join(',\n    ')},`);

        // We must remove the old html paths from the array to avoid 404s
        htmlFiles.forEach(file => {
            swContent = swContent.replace(new RegExp(`'/${file}',?\\s*`, 'g'), '');
        });

        fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), swContent);
    }

    console.log('Build completed successfully!');
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
