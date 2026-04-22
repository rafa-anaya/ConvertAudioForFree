// ==========================================
// SISTEMA i18n COMPARTIDO (Diccionario embebido)
// ==========================================
const i18n = {
    es: {
        // === META ===
        meta_title: "Cortar y Convertir Audio Online | 100% Privado",
        meta_desc: "Convierte audios a MP3, WAV, OGG y recórtalos directamente en tu navegador. Sin subir archivos.",

        // === EDITOR (index.html) ===
        app_title: "Convierte y Recorta tu Audio",
        app_subtitle: "100% Privado. El archivo nunca sale de tu dispositivo.",
        drop_text: "Arrastra tu audio aquí o haz clic para seleccionar",
        lbl_format: "Formato de Salida:",
        lbl_start: "Inicio (segundos):",
        lbl_end: "Fin (segundos):",
        btn_process: "Procesar Archivos",
        btn_edit: "⚙️ Editar",
        btn_delete: "🗑️ Eliminar",
        editor_hint: "Ajusta los deslizadores para definir el segmento de audio a recortar.",
        lbl_trim_start: "Inicio",
        lbl_trim_end: "Fin",
        btn_play: "▶ Reproducir",
        btn_pause: "⏸ Pausar",
        files_loaded: "Audios cargados:",

        // === PROCESAMIENTO (procesar.html) ===
        proc_meta_title: "Procesando Audio | AudioTool Pro",
        proc_title: "Procesando tus audios...",
        proc_subtitle: "Tu dispositivo está trabajando. No cierres ni recargues esta pestaña.",
        proc_file_progress: "Procesando archivo {current} de {total}",
        proc_current_file: "Archivo actual:",
        proc_estimated_time: "Tiempo estimado restante:",
        proc_calculating: "Calculando...",
        proc_completed: "¡Completado!",
        proc_redirecting: "Redirigiendo a la descarga...",
        proc_error: "Ocurrió un error al procesar. Verifica que los archivos sean válidos.",
        proc_no_files: "No hay archivos para procesar. Redirigiendo al editor...",

        // === DESCARGA (descarga.html) ===
        dl_meta_title: "Descarga tus Audios | AudioTool Pro",
        dl_instruction: "Haz clic en el botón para descargar tus audios",
        dl_btn_download: "📥 Descargar Todos los Archivos",
        dl_btn_download_single: "📥 Descargar Archivo",
        dl_success_single: "¡Excelente! Tu audio ha sido procesado exitosamente.",
        dl_success_multiple: "¡Excelente! Hemos procesado tus {count} audios exitosamente.",
        dl_table_name: "Archivo Original",
        dl_table_original_format: "Formato Original",
        dl_table_new_format: "Nuevo Formato",
        dl_table_original_size: "Peso Original",
        dl_table_new_size: "Nuevo Peso",
        dl_table_savings: "Ahorro",
        dl_table_action: "Acción",
        dl_btn_individual: "📥",
        dl_show_more: "Ver más ({remaining} restantes)",
        dl_show_less: "Ver menos",
        dl_support_title: "❤️ Apoya este proyecto",
        dl_support_text: "AudioTool Pro es completamente gratuito y sin registro. Los anuncios nos ayudan a mantener el sitio en línea y cubrir los costos de desarrollo. Si usas un bloqueador de anuncios, considera desactivarlo para este sitio — cada impresión cuenta.",
        dl_support_alt: "Si la herramienta te fue útil, también puedes invitarnos un café ☕",
        dl_btn_donate: "☕ Cómprame un café",
        dl_btn_convert_more: "🔄 Convertir más archivos",
        dl_no_files: "No hay archivos para descargar. Redirigiendo al editor...",
        dl_zip_name: "audiotool_pro_archivos.zip",
        dl_size_increase: "⬆",
        dl_size_decrease: "⬇",

        // === SEO (index.html) ===
        seo_h2_1: "¿Cómo recortar y convertir audio o video gratis sin programas?",
        seo_p_1: "AudioTool Pro convierte tu navegador en un editor de audio profesional. Recorta, convierte y extrae el audio de archivos de video (MP4, MKV, AVI, WEBM) directamente en tu dispositivo — sin subir nada a la nube, sin registros y sin instalar software. Tu música, podcasts y grabaciones nunca abandonan tu equipo.",
        seo_h3_1: "Tres pasos para editar tu audio",
        seo_step_1: "Arrastra tu archivo de audio o video al área de carga. Soporta MP3, WAV, OGG, FLAC, MP4, MKV, AVI y WEBM.",
        seo_step_2: "Usa los deslizadores de inicio y fin para recortar con precisión. La visualización de onda te ayuda a identificar silencios y secciones clave.",
        seo_step_3: "Elige el formato de salida (MP3, WAV, OGG o AAC) y haz clic en «Procesar». El procesamiento ocurre localmente en tu CPU.",
        seo_h3_2: "Formatos de audio y video compatibles",
        seo_p_2: "Acepta las entradas de audio más populares (WAV, MP3, OGG, FLAC) además de contenedores de video (MP4, MKV, AVI, WEBM). El motor FFmpeg.wasm extrae automáticamente el canal de audio del video sin pérdida de calidad.",
        seo_h3_3: "Privacidad total: tecnología 100% client-side",
        seo_p_3: "A diferencia de otros convertidores online, AudioTool Pro usa WebAssembly para ejecutar FFmpeg directamente en tu navegador. Ningún archivo se sube a servidores externos. Ideal para grabaciones sensibles, demos musicales inéditas o contenido privado que necesitas proteger.",
        seo_h3_4: "Conversión masiva por lotes",
        seo_p_4: "Puedes cargar múltiples archivos de audio simultáneamente. Define un formato de salida global, ajusta los puntos de corte individuales para cada pista, y descárgalos todos con un solo clic. Perfecto para preparar ringtones, efectos de sonido o lotes de episodios de podcast.",
        seo_h3_5: "Preguntas frecuentes",
        seo_faq_q1: "¿Cuál es el límite de tamaño de archivo?",
        seo_faq_a1: "No hay límite por nuestra parte. La única restricción es la memoria RAM disponible en tu dispositivo, ya que todo se procesa localmente en tu navegador.",
        seo_faq_q2: "¿Funciona en el celular?",
        seo_faq_a2: "Sí. AudioTool Pro es completamente responsivo y funciona en cualquier navegador moderno de Android o iOS. Los controles de recorte están optimizados para pantallas táctiles.",
        seo_faq_q3: "¿Es realmente gratis?",
        seo_faq_a3: "Totalmente. El servicio es gratuito y sin registro. Funciona con tecnología WebAssembly que no genera costos de servidor porque todo el procesamiento ocurre en tu dispositivo.",

        // === FOOTER ===
        footer_privacy: "Privacidad 100% Client-Side. Ningún archivo es enviado a nuestros servidores."
    },
    en: {
        // === META ===
        meta_title: "Audio Cutter & Converter Online | 100% Private",
        meta_desc: "Convert audio to MP3, WAV, OGG and trim them directly in your browser. No uploads.",

        // === EDITOR (index.html) ===
        app_title: "Convert and Trim Your Audio",
        app_subtitle: "100% Private. The file never leaves your device.",
        drop_text: "Drag your audio here or click to select",
        lbl_format: "Output Format:",
        lbl_start: "Start (seconds):",
        lbl_end: "End (seconds):",
        btn_process: "Process Files",
        btn_edit: "⚙️ Edit",
        btn_delete: "🗑️ Remove",
        editor_hint: "Adjust the sliders to define the audio segment to trim.",
        lbl_trim_start: "Start",
        lbl_trim_end: "End",
        btn_play: "▶ Play",
        btn_pause: "⏸ Pause",
        files_loaded: "Files loaded:",

        // === PROCESAMIENTO (procesar.html) ===
        proc_meta_title: "Processing Audio | AudioTool Pro",
        proc_title: "Processing your audio files...",
        proc_subtitle: "Your device is working. Do not close or reload this tab.",
        proc_file_progress: "Processing file {current} of {total}",
        proc_current_file: "Current file:",
        proc_estimated_time: "Estimated time remaining:",
        proc_calculating: "Calculating...",
        proc_completed: "Completed!",
        proc_redirecting: "Redirecting to download...",
        proc_error: "An error occurred during processing. Check if the files are valid.",
        proc_no_files: "No files to process. Redirecting to editor...",

        // === DESCARGA (descarga.html) ===
        dl_meta_title: "Download your Audio | AudioTool Pro",
        dl_instruction: "Click the button to download your audio files",
        dl_btn_download: "📥 Download All Files",
        dl_btn_download_single: "📥 Download File",
        dl_success_single: "Excellent! Your audio has been processed successfully.",
        dl_success_multiple: "Excellent! We've processed your {count} audio files successfully.",
        dl_table_name: "Original File",
        dl_table_original_format: "Original Format",
        dl_table_new_format: "New Format",
        dl_table_original_size: "Original Size",
        dl_table_new_size: "New Size",
        dl_table_savings: "Savings",
        dl_table_action: "Action",
        dl_btn_individual: "📥",
        dl_show_more: "Show more ({remaining} remaining)",
        dl_show_less: "Show less",
        dl_support_title: "❤️ Support this project",
        dl_support_text: "AudioTool Pro is completely free and requires no sign-up. Ads help us keep the site online and cover development costs. If you use an ad blocker, consider disabling it for this site — every impression counts.",
        dl_support_alt: "If you found this tool useful, you can also buy us a coffee ☕",
        dl_btn_donate: "☕ Buy me a coffee",
        dl_btn_convert_more: "🔄 Convert more files",
        dl_no_files: "No files to download. Redirecting to editor...",
        dl_zip_name: "audiotool_pro_files.zip",
        dl_size_increase: "⬆",
        dl_size_decrease: "⬇",

        // === SEO (index.html) ===
        seo_h2_1: "How to trim and convert audio or video for free without software?",
        seo_p_1: "AudioTool Pro turns your browser into a professional audio editor. Trim, convert, and extract audio from video files (MP4, MKV, AVI, WEBM) directly on your device — no cloud uploads, no sign-ups, no software to install. Your music, podcasts, and recordings never leave your device.",
        seo_h3_1: "Three steps to edit your audio",
        seo_step_1: "Drag your audio or video file to the upload area. Supports MP3, WAV, OGG, FLAC, MP4, MKV, AVI, and WEBM.",
        seo_step_2: "Use the start and end sliders to trim with precision. The waveform visualization helps you identify silences and key sections.",
        seo_step_3: "Choose the output format (MP3, WAV, OGG, or AAC) and click «Process». Processing happens locally on your CPU.",
        seo_h3_2: "Supported audio and video formats",
        seo_p_2: "Accepts the most popular audio inputs (WAV, MP3, OGG, FLAC) as well as video containers (MP4, MKV, AVI, WEBM). The FFmpeg.wasm engine automatically extracts the audio channel from video without quality loss.",
        seo_h3_3: "Total privacy: 100% client-side technology",
        seo_p_3: "Unlike other online converters, AudioTool Pro uses WebAssembly to run FFmpeg directly in your browser. No files are uploaded to external servers. Ideal for sensitive recordings, unreleased music demos, or private content you need to protect.",
        seo_h3_4: "Batch conversion",
        seo_p_4: "You can load multiple audio files simultaneously. Set a global output format, adjust individual cut points for each track, and download them all with a single click. Perfect for preparing ringtones, sound effects, or podcast episode batches.",
        seo_h3_5: "Frequently asked questions",
        seo_faq_q1: "What is the file size limit?",
        seo_faq_a1: "There is no limit on our end. The only restriction is the available RAM on your device, as everything is processed locally in your browser.",
        seo_faq_q2: "Does it work on mobile?",
        seo_faq_a2: "Yes. AudioTool Pro is fully responsive and works on any modern Android or iOS browser. The trimming controls are optimized for touchscreens.",
        seo_faq_q3: "Is it really free?",
        seo_faq_a3: "Absolutely. The service is free and requires no registration. It runs on WebAssembly technology that generates no server costs because all processing happens on your device.",

        // === FOOTER ===
        footer_privacy: "100% Client-Side Privacy. No files are uploaded to our servers."
    }
};

let currentLang = 'en';

function initLanguage() {
    const userLang = navigator.language.slice(0, 2);
    currentLang = i18n[userLang] ? userLang : 'en';
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.value = currentLang;
    }
    applyLanguage();
}

function applyLanguage() {
    const dict = i18n[currentLang];
    const htmlRoot = document.getElementById('html-root');
    if (htmlRoot) htmlRoot.lang = currentLang;

    document.title = dict.meta_title || document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict.meta_desc) metaDesc.content = dict.meta_desc;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });
}

/**
 * Returns a translated string, optionally with placeholder replacement.
 * Usage: t('dl_success_multiple', { count: 3 })
 */
function t(key, params) {
    const dict = i18n[currentLang] || i18n['en'];
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
