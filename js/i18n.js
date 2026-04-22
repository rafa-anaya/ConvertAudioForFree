// ==========================================
// SISTEMA i18n COMPARTIDO (Carga desde JSON para textos dinámicos)
// ==========================================
const i18n = {};
let currentLang = 'es'; // Default is now handled by folder structure
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
 * Initializes the i18n system for dynamic JS strings.
 * The static HTML is already translated by the SSG build script.
 */
async function initLanguage() {
    // Detect current language from URL instead of navigator
    if (window.location.pathname.startsWith('/en/')) {
        currentLang = 'en';
    } else {
        currentLang = 'es'; // Default
    }

    // Load active language dictionary for dynamic JS strings (t function)
    await loadTranslation(currentLang);
    i18nReady = true;

    // Dispatch event so scripts know dictionary is ready
    document.dispatchEvent(new CustomEvent('langready'));
}

/**
 * Returns a translated string, optionally with placeholder replacement.
 * Usage: t('dl_success_multiple', { count: 3 })
 */
function t(key, params) {
    const dict = i18n[currentLang] || i18n['es'] || {};
    let text = dict[key] || key;
    if (params) {
        Object.keys(params).forEach(k => {
            text = text.replace(`{${k}}`, params[k]);
        });
    }
    return text;
}

// Bind language selector to redirect
document.addEventListener('DOMContentLoaded', () => {
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        // Set selector to match current URL
        langSelector.value = window.location.pathname.startsWith('/en/') ? 'en' : 'es';

        langSelector.addEventListener('change', (e) => {
            const newLang = e.target.value;
            // Redirect to new language folder
            let currentPath = window.location.pathname;
            
            // Check if path starts with /es/ or /en/
            if (currentPath.match(/^\/(es|en)(\/|$)/)) {
                window.location.href = currentPath.replace(/^\/(es|en)/, '/' + newLang);
            } else {
                window.location.href = '/' + newLang + currentPath;
            }
        });
    }
});
