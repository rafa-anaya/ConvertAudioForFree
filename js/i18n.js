// ==========================================
// SISTEMA i18n COMPARTIDO (Carga desde JSON)
// ==========================================
const i18n = {};
let currentLang = 'en';
let i18nReady = false;

/**
 * Loads a translation JSON file for the given language code.
 * Returns the parsed dictionary object.
 */
async function loadTranslation(lang) {
    if (i18n[lang]) return i18n[lang];
    try {
        const resp = await fetch(`/i18n/${lang}.json`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        i18n[lang] = await resp.json();
    } catch (err) {
        console.warn(`[i18n] Could not load /i18n/${lang}.json:`, err);
        i18n[lang] = {};
    }
    return i18n[lang];
}

/**
 * Initializes the i18n system:
 *   1. Detects browser language
 *   2. Loads both language files (active + fallback)
 *   3. Applies translations to the DOM
 */
async function initLanguage() {
    const userLang = navigator.language.slice(0, 2);
    currentLang = (userLang === 'es') ? 'es' : 'en';

    // Load both languages in parallel so switching is instant
    await Promise.all([
        loadTranslation('es'),
        loadTranslation('en')
    ]);

    i18nReady = true;

    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.value = currentLang;
    }
    applyLanguage();
}

/**
 * Applies the current language dictionary to all DOM elements
 * with data-i18n, data-i18n-aria, and meta tags.
 */
function applyLanguage() {
    const dict = i18n[currentLang] || {};
    const htmlRoot = document.getElementById('html-root');
    if (htmlRoot) htmlRoot.lang = currentLang;

    // Page title
    if (dict.meta_title) document.title = dict.meta_title;

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        const key = metaDesc.getAttribute('data-i18n');
        if (key && dict[key]) {
            metaDesc.content = dict[key];
        } else if (dict.meta_desc) {
            metaDesc.content = dict.meta_desc;
        }
    }

    // Text content: data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });

    // Aria labels: data-i18n-aria
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (dict[key]) el.setAttribute('aria-label', dict[key]);
    });
}

/**
 * Returns a translated string, optionally with placeholder replacement.
 * Usage: t('dl_success_multiple', { count: 3 })
 */
function t(key, params) {
    const dict = i18n[currentLang] || i18n['en'] || {};
    let text = dict[key] || key;
    if (params) {
        Object.keys(params).forEach(k => {
            text = text.replace(`{${k}}`, params[k]);
        });
    }
    return text;
}

// Bind language selector if present
document.addEventListener('DOMContentLoaded', () => {
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.addEventListener('change', (e) => {
            currentLang = e.target.value;
            applyLanguage();
            // Dispatch custom event so page-specific JS can react
            document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang } }));
        });
    }
});
