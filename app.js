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
// 2. LÓGICA DE INTERFAZ Y ESTADO (Acordeón y Lazy Init)
// ==========================================
let filesState = []; // [{ id, file, baseFormat, start, end, duration, wsInstance }]

const dropZone = document.getElementById('drop-zone');
const audioInput = document.getElementById('audio-input');
const globalControls = document.getElementById('global-controls');
const fileListContainer = document.getElementById('file-list');
const processControls = document.getElementById('process-controls');

dropZone.addEventListener('click', () => audioInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary-hover)'; });
dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = 'var(--primary-color)');
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-color)';
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
audioInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
});

function handleFiles(files) {
    const newFiles = Array.from(files).filter(f => f.type.startsWith('audio/'));
    if (newFiles.length === 0) return;

    // Reset general if first upload
    if (filesState.length === 0) {
        globalControls.classList.remove('hidden');
        processControls.classList.remove('hidden');
    }

    newFiles.forEach((file) => {
        const id = 'file_' + Math.random().toString(36).substr(2, 9);
        filesState.push({
            id,
            file,
            start: 0,
            end: 0,
            duration: 0,
            wsInstance: null // Lazy Initialization
        });
    });

    renderFileList();
}

function renderFileList() {
    fileListContainer.innerHTML = ''; // Limpiar lista
    
    filesState.forEach((item, index) => {
        // Anuncio In-Feed cada 3 elementos (Estrategia de Monetización)
        if (index > 0 && index % 3 === 0) {
            const adDiv = document.createElement('div');
            adDiv.className = 'in-feed-ad';
            adDiv.innerHTML = '<span class="ad-label">In-Feed Advertisement</span>';
            fileListContainer.appendChild(adDiv);
        }

        const sizeMB = (item.file.size / (1024 * 1024)).toFixed(2);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = `container_${item.id}`;
        
        fileItem.innerHTML = `
            <div class="file-header" onclick="toggleAccordion('${item.id}')">
                <div class="file-info">
                    <strong>${item.file.name}</strong> <small>(${sizeMB} MB)</small>
                </div>
                <button class="btn-edit" onclick="event.stopPropagation(); toggleAccordion('${item.id}')">⚙️ Editar</button>
            </div>
            <div class="file-content" id="content_${item.id}">
                <div class="time-controls" style="margin-bottom: 1rem;">
                    <div class="control-group">
                        <label>Inicio (s):</label>
                        <input type="number" id="start_${item.id}" step="0.1" value="${item.start}" disabled>
                    </div>
                    <div class="control-group">
                        <label>Fin (s):</label>
                        <input type="number" id="end_${item.id}" step="0.1" value="${item.end}" disabled>
                    </div>
                </div>
                <div id="waveform_${item.id}" class="waveform-container"></div>
                <button class="cta-button" style="padding: 0.5rem; margin-top: 1rem; font-size: 0.9rem;" onclick="toggleAccordion('${item.id}')">Guardar y Cerrar</button>
            </div>
        `;
        
        fileListContainer.appendChild(fileItem);
        
        // Cargar metadatos básicos rápido (duración global)
        if (item.duration === 0) {
            const tempAudio = new Audio(URL.createObjectURL(item.file));
            tempAudio.onloadedmetadata = () => {
                item.duration = tempAudio.duration;
                item.end = item.duration;
                document.getElementById(`end_${item.id}`).value = item.end.toFixed(1);
            };
        }
    });

    dropZone.querySelector('p').textContent = `Audios cargados: ${filesState.length}`;
}

// Destruir todas las instancias de wavesurfer excepto la actual (Ram saving)
function destroyOtherWaveSurfers(keepId) {
    filesState.forEach(item => {
        if (item.id !== keepId) {
            if (item.wsInstance) {
                item.wsInstance.destroy();
                item.wsInstance = null;
            }
            document.getElementById(`container_${item.id}`).classList.remove('active');
            document.getElementById(`waveform_${item.id}`).innerHTML = ''; // Clean DOM
        }
    });
}

function toggleAccordion(id) {
    const item = filesState.find(f => f.id === id);
    const container = document.getElementById(`container_${id}`);
    const waveformDiv = document.getElementById(`waveform_${id}`);

    if (container.classList.contains('active')) {
        // Cerrar este acordeón
        container.classList.remove('active');
        if (item.wsInstance) {
            item.wsInstance.destroy();
            item.wsInstance = null;
        }
        waveformDiv.innerHTML = '';
        return;
    }

    // Abrir acordeón -> inicialización perezosa
    destroyOtherWaveSurfers(id);
    container.classList.add('active');

    // Inicializar WaveSurfer para el archivo activo
    if (!item.wsInstance) {
        initWaveSurfer(item);
    }
}

function initWaveSurfer(item) {
    const waveformDivID = `#waveform_${item.id}`;
    
    item.wsInstance = WaveSurfer.create({
        container: waveformDivID,
        waveColor: '#4F46E5',
        progressColor: '#4338CA',
        cursorColor: '#111827',
        barWidth: 2,
        height: 80,
        responsive: true,
        plugins: [
            WaveSurfer.Regions.create()
        ]
    });

    // Eventos tras tener el canvas listo
    item.wsInstance.on('ready', () => {
        const dur = item.wsInstance.getDuration();
        item.duration = dur;
        
        // Crear la región inicial (toda la cancion, o el ultimo estado guardado)
        let endT = item.end === 0 ? dur : item.end;
        
        item.wsInstance.addRegion({
            id: 'cut_region',
            start: item.start,
            end: endT,
            color: 'rgba(79, 70, 229, 0.2)', // Var primary
            drag: true,
            resize: true
        });
        
        document.getElementById(`end_${item.id}`).value = endT.toFixed(1);
    });

    // Actualizar estado general al mover el recorte visual (Refresh ad simulation)
    item.wsInstance.on('region-updated', (region) => {
        item.start = region.start;
        item.end = region.end;
        document.getElementById(`start_${item.id}`).value = item.start.toFixed(1);
        document.getElementById(`end_${item.id}`).value = item.end.toFixed(1);
    });

    // Cargar archivo
    item.wsInstance.loadBlob(item.file);
}

// ==========================================
// 3. MOTOR FFMPEG.WASM (Procesamiento Masivo)
// ==========================================
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ 
    log: true,
    corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

document.getElementById('process-btn').addEventListener('click', async () => {
    if (filesState.length === 0) return;

    // Destruir el visualizador activo antes de procesar para optimizar RAM 100%
    destroyOtherWaveSurfers(null);

    const modal = document.getElementById('processing-modal');
    modal.classList.remove('hidden');

    try {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        const globalFormat = document.getElementById('output-format').value;

        for (let i = 0; i < filesState.length; i++) {
            const item = filesState[i];
            
            const modalText = document.querySelector('#processing-modal h2');
            if (modalText) {
                modalText.textContent = currentLang === 'es' ? 
                    `Procesando audio ${i + 1} de ${filesState.length}...` : 
                    `Processing audio ${i + 1} of ${filesState.length}...`;
            }

            const inputName = `input_${i}.audio`;
            const outputName = `output_${i}.${globalFormat}`;

            ffmpeg.FS('writeFile', inputName, await fetchFile(item.file));

            const args = ['-i', inputName];
            
            // Si el start es > 0 o si el end es menor que la duracion original
            if (item.start > 0) args.push('-ss', item.start.toString());
            // Si recortó el final
            if (item.end > 0 && Math.abs(item.end - item.duration) > 0.5) {
                args.push('-to', item.end.toString());
            }

            args.push(outputName);

            // Run process
            await ffmpeg.run(...args);

            // Read output
            const data = ffmpeg.FS('readFile', outputName);
            const blob = new Blob([data.buffer], { type: `audio/${globalFormat}` });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const originalName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || `audio_${i}`;
            a.download = `recorte_${originalName}.${globalFormat}`;
            a.click();
            
            // Clean specific FS memory
            ffmpeg.FS('unlink', inputName);
            ffmpeg.FS('unlink', outputName);
        }

    } catch (error) {
        console.error("Error en procesamiento masivo FFmpeg:", error);
        alert(currentLang === 'es' ? "Ocurrió un error. Verifica que los archivos elegidos sean válidos." : "An error occurred. Check if selected files are valid.");
    } finally {
        modal.classList.add('hidden');
        if (document.querySelector('#processing-modal h2')) {
            applyLanguage(); 
        }
    }
});

// Inicializar
initLanguage();