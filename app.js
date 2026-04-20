// ==========================================
// 1. SISTEMA i18n (Diccionario embebido)
// ==========================================
const i18n = {
    es: {
        meta_title: "Cortar y Convertir Audio Online | 100% Privado",
        meta_desc: "Convierte audios a MP3, WAV, OGG y recórtalos directamente en tu navegador. Sin subir archivos.",
        app_title: "Convierte y Recorta tu Audio",
        app_subtitle: "100% Privado. El archivo nunca sale de tu dispositivo.",
        drop_text: "Arrastra tu audio aquí o haz clic para seleccionar",
        lbl_format: "Formato de Salida:",
        lbl_start: "Inicio (segundos):",
        lbl_end: "Fin (segundos):",
        btn_process: "Convertir y Descargar",
        modal_processing: "Procesando Audio...",
        modal_wait: "Por favor espera. Esto se ejecuta en tu dispositivo y no consume datos.",
        footer_privacy: "Privacidad 100% Client-Side. Ningún archivo es enviado a nuestros servidores.",
        // Contenido SEO
        seo_html: `
            <h2>¿Cómo cortar y convertir audios online?</h2>
            <p>Sigue estos tres sencillos pasos para manipular tus archivos de audio sin instalar programas:</p>
            <ol>
                <li><strong>Sube tu archivo:</strong> Arrastra tu audio (soporta la mayoría de formatos).</li>
                <li><strong>Ajusta los parámetros:</strong> Selecciona el segundo de inicio y fin, y elige tu formato deseado (MP3, WAV, etc.).</li>
                <li><strong>Descarga al instante:</strong> Haz clic en procesar. Todo el cálculo ocurre en tu procesador.</li>
            </ol>
            <h2>Privacidad Total (Tecnología Client-Side)</h2>
            <p>A diferencia de otras herramientas, nosotros usamos tecnología WebAssembly. Esto significa que tu audio <strong>nunca es subido a ningún servidor</strong>. Todo el procesamiento ocurre en tu propio navegador, garantizando privacidad absoluta para grabaciones sensibles, podcasts o música inédita.</p>
            <h2>Preguntas Frecuentes (FAQ)</h2>
            <h3>¿Cuál es el límite de tamaño?</h3>
            <p>No hay límite por nuestra parte. El límite está dictado por la memoria RAM disponible en tu dispositivo, ya que todo se procesa localmente.</p>
        `
    },
    en: {
        meta_title: "Audio Cutter & Converter Online | 100% Private",
        meta_desc: "Convert audio to MP3, WAV, OGG and trim them directly in your browser. No uploads.",
        app_title: "Convert and Trim Your Audio",
        app_subtitle: "100% Private. The file never leaves your device.",
        drop_text: "Drag your audio here or click to select",
        lbl_format: "Output Format:",
        lbl_start: "Start (seconds):",
        lbl_end: "End (seconds):",
        btn_process: "Convert & Download",
        modal_processing: "Processing Audio...",
        modal_wait: "Please wait. This runs on your device and doesn't use data.",
        footer_privacy: "100% Client-Side Privacy. No files are uploaded to our servers.",
        seo_html: `
            <h2>How to cut and convert audio online?</h2>
            <p>Follow these three simple steps to manipulate your audio files without installing software:</p>
            <ol>
                <li><strong>Upload:</strong> Drag your audio file (supports most formats).</li>
                <li><strong>Adjust:</strong> Select start/end times and your desired format (MP3, WAV, etc.).</li>
                <li><strong>Download:</strong> Click process. All computation happens on your CPU.</li>
            </ol>
            <h2>Total Privacy (Client-Side Tech)</h2>
            <p>Unlike other tools, we use WebAssembly. Your audio is <strong>never uploaded to a server</strong>. Processing happens entirely in your browser, ensuring absolute privacy for sensitive recordings.</p>
            <h2>Frequently Asked Questions (FAQ)</h2>
            <h3>What is the file size limit?</h3>
            <p>There is no limit on our end. The limit is determined by your device's available RAM, as everything is processed locally.</p>
        `
    }
};

let currentLang = 'en';

function initLanguage() {
    const userLang = navigator.language.slice(0, 2);
    currentLang = i18n[userLang] ? userLang : 'en';
    document.getElementById('lang-selector').value = currentLang;
    applyLanguage();
}

function applyLanguage() {
    const dict = i18n[currentLang];
    document.getElementById('html-root').lang = currentLang;
    document.title = dict.meta_title;
    document.querySelector('meta[name="description"]').content = dict.meta_desc;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });

    document.getElementById('seo-content').innerHTML = dict.seo_html;
}

document.getElementById('lang-selector').addEventListener('change', (e) => {
    currentLang = e.target.value;
    applyLanguage();
});

// ==========================================
// 2. LÓGICA DE INTERFAZ Y ARCHIVOS
// ==========================================
const dropZone = document.getElementById('drop-zone');
const audioInput = document.getElementById('audio-input');
const controlsBox = document.getElementById('controls');
let currentFile = null;

dropZone.addEventListener('click', () => audioInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary-hover)'; });
dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = 'var(--primary-color)');
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-color)';
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
audioInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(file) {
    currentFile = file;
    dropZone.querySelector('p').textContent = `Archivo seleccionado: ${file.name}`;
    controlsBox.classList.remove('hidden');
    
    // Leer duración (Básico vía Web Audio API) para rellenar el input de "Fin"
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => {
        document.getElementById('time-end').value = audio.duration.toFixed(1);
    };
}

// ==========================================
// 3. MOTOR FFMPEG.WASM (Procesamiento)
// ==========================================
const { createFFmpeg, fetchFile } = FFmpeg;
// Nota de Arquitectura: Usamos la configuración por defecto. 
// WebAssembly cargará en el navegador del usuario.
const ffmpeg = createFFmpeg({ log: true });

document.getElementById('process-btn').addEventListener('click', async () => {
    if (!currentFile) return;

    const modal = document.getElementById('processing-modal');
    modal.classList.remove('hidden');

    try {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        const inputName = 'input_audio';
        const format = document.getElementById('output-format').value;
        const outputName = `output.${format}`;
        const start = document.getElementById('time-start').value;
        const end = document.getElementById('time-end').value;

        // Escribir archivo en el sistema de archivos virtual de FFmpeg
        ffmpeg.FS('writeFile', inputName, await fetchFile(currentFile));

        // Ejecutar comando FFmpeg (Client-side puro)
        await ffmpeg.run('-i', inputName, '-ss', start, '-to', end, outputName);

        // Leer resultado
        const data = ffmpeg.FS('readFile', outputName);
        
        // Crear descarga
        const blob = new Blob([data.buffer], { type: `audio/${format}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recorte_${new Date().getTime()}.${format}`;
        a.click();
        
        // Limpiar memoria
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);

    } catch (error) {
        console.error("Error en el procesamiento:", error);
        alert(currentLang === 'es' ? "Ocurrió un error. Intenta con un archivo más pequeño." : "An error occurred. Try a smaller file.");
    } finally {
        modal.classList.add('hidden');
    }
});

// Inicializar
initLanguage();