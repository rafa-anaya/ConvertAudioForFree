// ==========================================
// EDITOR — AudioTool Pro (index.html)
// UI logic: drop zone, accordion, wavesurfer, sliders
// Saves to IndexedDB and redirects to /procesar.html
// ==========================================

// ── State ──
let filesState = []; // [{ id, file, baseFormat, start, end, duration, wsInstance }]

const dropZone = document.getElementById('drop-zone');
const audioInput = document.getElementById('audio-input');
const globalControls = document.getElementById('global-controls');
const fileListContainer = document.getElementById('file-list');
const processControls = document.getElementById('process-controls');

// ── Cleanup residual IndexedDB on load (anti-duplicate fallback) ──
AudioDB.clearAll().catch(() => { });

// ── Drop Zone Events ──
dropZone.addEventListener('click', () => audioInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-hover)';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--primary-color)';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-color)';
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
audioInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
});

function handleFiles(files) {
    const newFiles = Array.from(files).filter(f =>
        f.type.startsWith('audio/') ||
        f.type.startsWith('video/') ||
        f.name.match(/\.(mp4|mkv|avi|webm)$/i)
    );
    if (newFiles.length === 0) return;

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
            wsInstance: null
        });
    });

    renderFileList();
}

function renderFileList() {
    fileListContainer.innerHTML = '';

    filesState.forEach((item, index) => {
        // In-Feed ad every 6 elements (starting from index 6)
        if (index > 0 && index % 6 === 0) {
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
                <div class="file-actions">
                    <button class="btn-edit" onclick="event.stopPropagation(); toggleAccordion('${item.id}')"> ${t('btn_edit')}</button>
                    <button class="btn-delete" onclick="event.stopPropagation(); removeAudio('${item.id}', event)"> ${t('btn_delete')}</button>
                </div>
            </div>
            <div class="file-content" id="content_${item.id}">
                <div class="editor-box">
                    <div class="editor-text">${t('editor_hint')}</div>
                    
                    <div id="waveform_${item.id}" class="waveform-ui"></div>
                    
                    <div class="slider-controls">
                        <div class="slider-group">
                            <div class="slider-label-row">
                                <label>${t('lbl_trim_start')}</label>
                                <span id="val_start_${item.id}" class="slider-value">0.0s</span>
                            </div>
                            <div id="slider_start_${item.id}"></div>
                        </div>
                        <div class="slider-group">
                            <div class="slider-label-row">
                                <label>${t('lbl_trim_end')}</label>
                                <span id="val_end_${item.id}" class="slider-value">0.0s</span>
                            </div>
                            <div id="slider_end_${item.id}"></div>
                        </div>
                    </div>
                    
                    <button id="play_${item.id}" class="play-btn"> ${t('btn_play')}</button>
                </div>
            </div>
        `;

        fileListContainer.appendChild(fileItem);

        // Load basic metadata (duration)
        if (item.duration === 0) {
            const tempUrl = URL.createObjectURL(item.file);
            const tempAudio = new Audio(tempUrl);
            tempAudio.onloadedmetadata = () => {
                item.duration = tempAudio.duration;
                if (item.end === 0) {
                    item.end = item.duration;
                }
                const valEnd = document.getElementById(`val_end_${item.id}`);
                if (valEnd) valEnd.textContent = item.end.toFixed(1) + 's';
                URL.revokeObjectURL(tempUrl);
            };
        }
    });

    const dropText = dropZone.querySelector('p');
    if (dropText) {
        dropText.textContent = `${t('files_loaded')} ${filesState.length}`;
    }
}

// ── Remove specific audio ──
window.removeAudio = function (id, event) {
    if (event) event.stopPropagation();

    const item = filesState.find(f => f.id === id);
    if (item) {
        if (item.wsInstance) {
            item.wsInstance.destroy();
            item.wsInstance = null;
        }
        const sliderStart = document.getElementById(`slider_start_${id}`);
        const sliderEnd = document.getElementById(`slider_end_${id}`);
        if (sliderStart && sliderStart.noUiSlider) sliderStart.noUiSlider.destroy();
        if (sliderEnd && sliderEnd.noUiSlider) sliderEnd.noUiSlider.destroy();
    }

    filesState = filesState.filter(f => f.id !== id);
    renderFileList();

    if (filesState.length === 0) {
        dropZone.querySelector('p').textContent = t('drop_text');
        globalControls.classList.add('hidden');
        processControls.classList.add('hidden');
    }
};

// ── Destroy all WaveSurfer instances except one (RAM saving) ──
function destroyOtherWaveSurfers(keepId) {
    filesState.forEach(item => {
        if (item.id !== keepId) {
            if (item.wsInstance) {
                item.wsInstance.destroy();
                item.wsInstance = null;
            }
            const sliderStart = document.getElementById(`slider_start_${item.id}`);
            const sliderEnd = document.getElementById(`slider_end_${item.id}`);
            if (sliderStart && sliderStart.noUiSlider) sliderStart.noUiSlider.destroy();
            if (sliderEnd && sliderEnd.noUiSlider) sliderEnd.noUiSlider.destroy();

            const container = document.getElementById(`container_${item.id}`);
            if (container) container.classList.remove('active');
            const waveform = document.getElementById(`waveform_${item.id}`);
            if (waveform) waveform.innerHTML = '';
        }
    });
}

function toggleAccordion(id) {
    const item = filesState.find(f => f.id === id);
    const container = document.getElementById(`container_${id}`);
    const waveformDiv = document.getElementById(`waveform_${id}`);

    if (container.classList.contains('active')) {
        container.classList.remove('active');
        if (item.wsInstance) {
            item.wsInstance.destroy();
            item.wsInstance = null;
        }
        const sliderStart = document.getElementById(`slider_start_${id}`);
        const sliderEnd = document.getElementById(`slider_end_${id}`);
        if (sliderStart && sliderStart.noUiSlider) sliderStart.noUiSlider.destroy();
        if (sliderEnd && sliderEnd.noUiSlider) sliderEnd.noUiSlider.destroy();

        waveformDiv.innerHTML = '';
        return;
    }

    destroyOtherWaveSurfers(id);
    container.classList.add('active');

    if (!item.wsInstance) {
        initWaveSurfer(item);
    }
}

function initWaveSurfer(item) {
    const waveformDivID = `#waveform_${item.id}`;

    let updatingFromSlider = false;
    let updatingFromRegion = false;
    const isMobile = window.matchMedia('(max-width: 600px)').matches;

    item.wsInstance = WaveSurfer.create({
        container: waveformDivID,
        waveColor: '#7a88cf',
        progressColor: '#c0caf5',
        cursorColor: '#ff9e64',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 100,
        responsive: true
    });

    const wsRegions = item.wsInstance.registerPlugin(WaveSurfer.Regions.create());

    const sliderStartEl = document.getElementById(`slider_start_${item.id}`);
    const sliderEndEl = document.getElementById(`slider_end_${item.id}`);
    const valStartSpan = document.getElementById(`val_start_${item.id}`);
    const valEndSpan = document.getElementById(`val_end_${item.id}`);
    const btnPlay = document.getElementById(`play_${item.id}`);

    const syncRegionFromSliders = () => {
        if (updatingFromRegion) return;
        updatingFromSlider = true;

        let nStart = parseFloat(sliderStartEl.noUiSlider.get());
        let nEnd = parseFloat(sliderEndEl.noUiSlider.get());

        if (nStart < 0) nStart = 0;
        if (nEnd > item.duration) nEnd = item.duration;
        if (nStart >= nEnd) nStart = Math.max(0, nEnd - 0.5);

        item.start = nStart;
        item.end = nEnd;
        valStartSpan.textContent = nStart.toFixed(1) + 's';
        valEndSpan.textContent = nEnd.toFixed(1) + 's';

        const regions = wsRegions.getRegions();
        if (regions.length > 0) {
            regions[0].setOptions({
                start: item.start,
                end: item.end
            });
        } else {
            wsRegions.addRegion({
                start: item.start,
                end: item.end,
                color: 'rgba(255, 158, 100, 0.2)',
                drag: !isMobile,
                resize: !isMobile
            });
        }

        updatingFromSlider = false;
    };

    item.wsInstance.on('ready', () => {
        const dur = item.wsInstance.getDuration();
        item.duration = dur;

        let endT = item.end === 0 ? dur : item.end;
        item.end = endT;

        noUiSlider.create(sliderStartEl, {
            start: [item.start],
            connect: [true, false],
            range: { min: 0, max: dur },
            step: 0.1,
            tooltips: false
        });

        noUiSlider.create(sliderEndEl, {
            start: [endT],
            connect: [false, true],
            range: { min: 0, max: dur },
            step: 0.1,
            tooltips: false
        });

        valStartSpan.textContent = item.start.toFixed(1) + 's';
        valEndSpan.textContent = endT.toFixed(1) + 's';

        sliderStartEl.noUiSlider.on('update', syncRegionFromSliders);
        sliderEndEl.noUiSlider.on('update', syncRegionFromSliders);

        syncRegionFromSliders();
    });

    item.wsInstance.on('audioprocess', (currentTime) => {
        if (item.wsInstance.isPlaying() && currentTime >= item.end) {
            item.wsInstance.pause();
        }
    });

    wsRegions.on('region-updated', (region) => {
        if (updatingFromSlider) return;
        updatingFromRegion = true;

        item.start = region.start;
        item.end = region.end;

        sliderStartEl.noUiSlider.set(item.start);
        sliderEndEl.noUiSlider.set(item.end);
        valStartSpan.textContent = item.start.toFixed(1) + 's';
        valEndSpan.textContent = item.end.toFixed(1) + 's';

        updatingFromRegion = false;
    });

    if (!isMobile) {
        wsRegions.on('region-created', (region) => {
            const handles = region.element.querySelectorAll('[data-resize]');
            handles.forEach(handle => {
                handle.style.width = '4px';
                handle.style.background = '#ff9e64';
                handle.style.borderRadius = '4px';
                handle.style.opacity = '0.9';
            });
        });
    }

    btnPlay.onclick = () => {
        if (item.wsInstance.isPlaying()) {
            item.wsInstance.pause();
            btnPlay.textContent = t('btn_play');
        } else {
            const activeRegion = wsRegions.getRegions()[0];
            if (activeRegion) {
                activeRegion.play();
                btnPlay.textContent = t('btn_pause');
            }
        }
    };

    item.wsInstance.on('pause', () => {
        btnPlay.textContent = t('btn_play');
    });

    const audioUrl = URL.createObjectURL(item.file);
    item.wsInstance.load(audioUrl);
}

// ==========================================
// PROCESS BUTTON — Save to IndexedDB & Redirect
// ==========================================
document.getElementById('process-btn').addEventListener('click', async () => {
    if (filesState.length === 0) return;

    const btn = document.getElementById('process-btn');
    btn.disabled = true;
    btn.textContent = t('btn_preparing');

    // Destroy all wavesurfers before processing
    destroyOtherWaveSurfers(null);

    const globalFormat = document.getElementById('output-format').value;

    try {
        // Build jobs array for IndexedDB
        const jobs = filesState.map(item => {
            const ext = item.file.name.split('.').pop().toLowerCase();
            return {
                id: item.id,
                originalName: item.file.name,
                originalSize: item.file.size,
                originalFormat: ext,
                targetFormat: globalFormat,
                trimStart: item.start,
                trimEnd: item.end,
                duration: item.duration,
                fileBlob: item.file // File objects are clonable into IDB
            };
        });

        await AudioDB.savePendingJobs(jobs);

        // Redirect to processing page (clean url)
        window.location.href = 'procesar';
    } catch (error) {
        console.error('Error saving to IndexedDB:', error);
        btn.disabled = false;
        btn.textContent = t('btn_process');
        alert(t('editor_error_preparing'));
    }
});

// ── Initialize ──
initLanguage().then(() => {
    // Re-render file list if files were added before translations loaded
    if (filesState.length > 0) renderFileList();
});
