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
            zoom: 0,
            wsInstance: null
        });
    });

    renderFileList();
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60);
    const secsFormatted = secs.toFixed(1).padStart(4, '0');
    return `${mins}:${secsFormatted}`;
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

                    <!-- Toolbar superior: Zoom y duración seleccionada -->
                    <div class="waveform-toolbar">
                        <div class="zoom-controls">
                            <span class="zoom-title">🔍 ${t('zoom_label') || 'Zoom'}:</span>
                            <button type="button" class="btn-ctrl" id="zoom_out_${item.id}" title="${t('zoom_out') || 'Alejar zoom'}">−</button>
                            <input type="range" class="zoom-range" id="zoom_range_${item.id}" min="0" max="300" value="${item.zoom || 0}" step="10" title="${t('zoom_label') || 'Zoom'}">
                            <button type="button" class="btn-ctrl" id="zoom_in_${item.id}" title="${t('zoom_in') || 'Acercar zoom'}">+</button>
                            <button type="button" class="btn-ctrl btn-zoom-fit" id="zoom_fit_${item.id}" title="${t('zoom_fit') || 'Ajustar a pantalla'}">${t('zoom_fit') || 'Ajustar'}</button>
                            <span id="zoom_val_${item.id}" class="zoom-level">${(item.zoom || 0) === 0 ? (t('zoom_fit') || 'Ajustar') : `${item.zoom} px/s`}</span>
                        </div>
                        <div class="time-selection-badge">
                            <span>${t('lbl_selection') || 'Selección:'}</span>
                            <strong id="val_diff_${item.id}">0.0s (0:00.0)</strong>
                        </div>
                    </div>
                    
                    <!-- Contenedor WaveSurfer -->
                    <div id="waveform_${item.id}" class="waveform-ui" title="Usa Ctrl + Rueda del ratón para hacer zoom"></div>

                    <!-- Barra de Transporte y Reproducción -->
                    <div class="playback-toolbar">
                        <div class="playback-time">
                            <span id="cur_time_${item.id}" class="time-cur">0:00.0</span>
                            <span class="time-sep">/</span>
                            <span id="tot_time_${item.id}" class="time-tot">${formatTime(item.duration)}</span>
                        </div>
                        <div class="playback-actions">
                            <button type="button" id="seek_back_${item.id}" class="btn-playback-ctrl" title="Retroceder 1s">⏪ -1s</button>
                            <button type="button" id="play_${item.id}" class="play-btn-primary">▶ ${t('btn_play')}</button>
                            <button type="button" id="seek_fwd_${item.id}" class="btn-playback-ctrl" title="Avanzar 1s">+1s ⏩</button>
                            <button type="button" id="stop_${item.id}" class="btn-playback-ctrl" title="Detener">⏹</button>
                        </div>
                    </div>
                    
                    <!-- Deslizadores y Botones de Precisión -->
                    <div class="slider-controls">
                        <div class="slider-group">
                            <div class="slider-label-row">
                                <label>${t('lbl_trim_start')}</label>
                                <div class="slider-time-inputs">
                                    <span id="val_start_${item.id}" class="slider-value">0.0s (0:00.0)</span>
                                    <input type="number" id="input_start_${item.id}" class="time-number-input" step="0.1" min="0" value="${item.start.toFixed(1)}" title="Segundos de inicio">
                                </div>
                            </div>
                            <div id="slider_start_${item.id}"></div>
                            <div class="step-btn-row">
                                <button type="button" class="btn-step" id="step_start_m1_${item.id}" title="Retroceder 1 segundo">-1s</button>
                                <button type="button" class="btn-step" id="step_start_m01_${item.id}" title="Retroceder 0.1s (fracción)">-0.1s</button>
                                <button type="button" class="btn-step" id="step_start_p01_${item.id}" title="Avanzar 0.1s (fracción)">+0.1s</button>
                                <button type="button" class="btn-step" id="step_start_p1_${item.id}" title="Avanzar 1 segundo">+1s</button>
                                <button type="button" class="btn-step btn-step-seek" id="seek_start_${item.id}" title="${t('btn_seek_start') || 'Ver inicio en onda'}">📍</button>
                            </div>
                        </div>

                        <div class="slider-group">
                            <div class="slider-label-row">
                                <label>${t('lbl_trim_end')}</label>
                                <div class="slider-time-inputs">
                                    <span id="val_end_${item.id}" class="slider-value">0.0s (0:00.0)</span>
                                    <input type="number" id="input_end_${item.id}" class="time-number-input" step="0.1" min="0" value="${item.end.toFixed(1)}" title="Segundos de fin">
                                </div>
                            </div>
                            <div id="slider_end_${item.id}"></div>
                            <div class="step-btn-row">
                                <button type="button" class="btn-step" id="step_end_m1_${item.id}" title="Retroceder 1 segundo">-1s</button>
                                <button type="button" class="btn-step" id="step_end_m01_${item.id}" title="Retroceder 0.1s (fracción)">-0.1s</button>
                                <button type="button" class="btn-step" id="step_end_p01_${item.id}" title="Avanzar 0.1s (fracción)">+0.1s</button>
                                <button type="button" class="btn-step" id="step_end_p1_${item.id}" title="Avanzar 1 segundo">+1s</button>
                                <button type="button" class="btn-step btn-step-seek" id="seek_end_${item.id}" title="${t('btn_seek_end') || 'Ver fin en onda'}">📍</button>
                            </div>
                        </div>
                    </div>
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
                if (valEnd) valEnd.textContent = `${item.end.toFixed(1)}s (${formatTime(item.end)})`;
                const inputEnd = document.getElementById(`input_end_${item.id}`);
                if (inputEnd) inputEnd.value = item.end.toFixed(1);
                const totTime = document.getElementById(`tot_time_${item.id}`);
                if (totTime) totTime.textContent = formatTime(item.duration);
                const valDiff = document.getElementById(`val_diff_${item.id}`);
                if (valDiff) {
                    const diff = Math.max(0, item.end - item.start);
                    valDiff.textContent = `${diff.toFixed(1)}s (${formatTime(diff)})`;
                }
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
    const waveformDiv = document.getElementById(`waveform_${item.id}`);

    let isUpdating = false;
    const isMobile = window.matchMedia('(max-width: 600px)').matches;

    // Element references
    const sliderStartEl = document.getElementById(`slider_start_${item.id}`);
    const sliderEndEl = document.getElementById(`slider_end_${item.id}`);
    const valStartSpan = document.getElementById(`val_start_${item.id}`);
    const valEndSpan = document.getElementById(`val_end_${item.id}`);
    const valDiffSpan = document.getElementById(`val_diff_${item.id}`);
    const inputStartEl = document.getElementById(`input_start_${item.id}`);
    const inputEndEl = document.getElementById(`input_end_${item.id}`);

    // Zoom element references
    const zoomRange = document.getElementById(`zoom_range_${item.id}`);
    const zoomInBtn = document.getElementById(`zoom_in_${item.id}`);
    const zoomOutBtn = document.getElementById(`zoom_out_${item.id}`);
    const zoomFitBtn = document.getElementById(`zoom_fit_${item.id}`);
    const zoomValSpan = document.getElementById(`zoom_val_${item.id}`);

    // Transport element references
    const btnPlay = document.getElementById(`play_${item.id}`);
    const btnStop = document.getElementById(`stop_${item.id}`);
    const btnSeekBack = document.getElementById(`seek_back_${item.id}`);
    const btnSeekFwd = document.getElementById(`seek_fwd_${item.id}`);
    const curTimeSpan = document.getElementById(`cur_time_${item.id}`);
    const totTimeSpan = document.getElementById(`tot_time_${item.id}`);

    // Step buttons references
    const btnStartM1 = document.getElementById(`step_start_m1_${item.id}`);
    const btnStartM01 = document.getElementById(`step_start_m01_${item.id}`);
    const btnStartP01 = document.getElementById(`step_start_p01_${item.id}`);
    const btnStartP1 = document.getElementById(`step_start_p1_${item.id}`);
    const btnSeekStart = document.getElementById(`seek_start_${item.id}`);

    const btnEndM1 = document.getElementById(`step_end_m1_${item.id}`);
    const btnEndM01 = document.getElementById(`step_end_m01_${item.id}`);
    const btnEndP01 = document.getElementById(`step_end_p01_${item.id}`);
    const btnEndP1 = document.getElementById(`step_end_p1_${item.id}`);
    const btnSeekEnd = document.getElementById(`seek_end_${item.id}`);

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

    // ── Central Synchronized Trim Update Function ──
    function updateTrim(source, proposedStart, proposedEnd, centerTarget) {
        if (isUpdating) return;
        isUpdating = true;

        const dur = item.duration || 1;
        let s = proposedStart !== undefined ? proposedStart : item.start;
        let e = proposedEnd !== undefined ? proposedEnd : item.end;

        // Round to 1 decimal place to eliminate floating point glitches
        s = Math.round(s * 10) / 10;
        e = Math.round(e * 10) / 10;

        if (s < 0) s = 0;
        if (e > dur) e = dur;
        if (s >= e) {
            if (source === 'start' || source === 'input_start' || source === 'step_start') {
                s = Math.max(0, Math.round((e - 0.1) * 10) / 10);
            } else {
                e = Math.min(dur, Math.round((s + 0.1) * 10) / 10);
            }
        }

        item.start = s;
        item.end = e;

        // Update display text and inputs
        if (valStartSpan) valStartSpan.textContent = `${s.toFixed(1)}s (${formatTime(s)})`;
        if (valEndSpan) valEndSpan.textContent = `${e.toFixed(1)}s (${formatTime(e)})`;
        if (valDiffSpan) {
            const diff = Math.max(0, e - s);
            valDiffSpan.textContent = `${diff.toFixed(1)}s (${formatTime(diff)})`;
        }

        if (inputStartEl && source !== 'input_start') inputStartEl.value = s.toFixed(1);
        if (inputEndEl && source !== 'input_end') inputEndEl.value = e.toFixed(1);

        // Update noUiSliders
        if (sliderStartEl && sliderStartEl.noUiSlider && source !== 'slider_start') {
            sliderStartEl.noUiSlider.set(s);
        }
        if (sliderEndEl && sliderEndEl.noUiSlider && source !== 'slider_end') {
            sliderEndEl.noUiSlider.set(e);
        }

        // Update WaveSurfer Region
        const regions = wsRegions.getRegions();
        if (regions.length > 0) {
            regions[0].setOptions({ start: s, end: e });
        } else {
            wsRegions.addRegion({
                start: s,
                end: e,
                color: 'rgba(255, 158, 100, 0.2)',
                drag: !isMobile,
                resize: !isMobile
            });
        }

        // Scroll / Center Waveform viewport to target point if requested
        if (centerTarget === 'start') {
            const prog = dur > 0 ? Math.min(1, Math.max(0, s / dur)) : 0;
            item.wsInstance.seekTo(prog);
            if (curTimeSpan) curTimeSpan.textContent = formatTime(s);
        } else if (centerTarget === 'end') {
            const prog = dur > 0 ? Math.min(1, Math.max(0, e / dur)) : 0;
            item.wsInstance.seekTo(prog);
            if (curTimeSpan) curTimeSpan.textContent = formatTime(e);
        }

        isUpdating = false;
    }

    // ── Zoom Handler ──
    function applyZoom(zoomPx) {
        const clampedZoom = Math.max(0, Math.min(300, Math.round(zoomPx)));
        item.zoom = clampedZoom;

        if (zoomRange) zoomRange.value = clampedZoom;
        if (zoomValSpan) {
            zoomValSpan.textContent = clampedZoom === 0 ? (t('zoom_fit') || 'Ajustar') : `${clampedZoom} px/s`;
        }

        if (item.wsInstance) {
            item.wsInstance.zoom(clampedZoom);
        }
    }

    if (zoomRange) {
        zoomRange.addEventListener('input', (e) => applyZoom(parseFloat(e.target.value) || 0));
    }
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => applyZoom((item.zoom || 0) === 0 ? 20 : (item.zoom || 0) + 20));
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => applyZoom((item.zoom || 0) - 20));
    }
    if (zoomFitBtn) {
        zoomFitBtn.addEventListener('click', () => applyZoom(0));
    }

    // Zoom with Mouse Wheel (Ctrl / Cmd / Alt + Wheel)
    if (waveformDiv) {
        waveformDiv.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 20 : -20;
                applyZoom((item.zoom || 0) + delta);
            }
        }, { passive: false });
    }

    // ── Precision Step Buttons for Start ──
    if (btnStartM1) btnStartM1.addEventListener('click', () => updateTrim('step_start', item.start - 1.0, undefined, 'start'));
    if (btnStartM01) btnStartM01.addEventListener('click', () => updateTrim('step_start', item.start - 0.1, undefined, 'start'));
    if (btnStartP01) btnStartP01.addEventListener('click', () => updateTrim('step_start', item.start + 0.1, undefined, 'start'));
    if (btnStartP1) btnStartP1.addEventListener('click', () => updateTrim('step_start', item.start + 1.0, undefined, 'start'));
    if (btnSeekStart) {
        btnSeekStart.addEventListener('click', () => {
            const prog = item.duration > 0 ? Math.min(1, Math.max(0, item.start / item.duration)) : 0;
            item.wsInstance.seekTo(prog);
            if (curTimeSpan) curTimeSpan.textContent = formatTime(item.start);
        });
    }

    // ── Precision Step Buttons for End ──
    if (btnEndM1) btnEndM1.addEventListener('click', () => updateTrim('step_end', undefined, item.end - 1.0, 'end'));
    if (btnEndM01) btnEndM01.addEventListener('click', () => updateTrim('step_end', undefined, item.end - 0.1, 'end'));
    if (btnEndP01) btnEndP01.addEventListener('click', () => updateTrim('step_end', undefined, item.end + 0.1, 'end'));
    if (btnEndP1) btnEndP1.addEventListener('click', () => updateTrim('step_end', undefined, item.end + 1.0, 'end'));
    if (btnSeekEnd) {
        btnSeekEnd.addEventListener('click', () => {
            const prog = item.duration > 0 ? Math.min(1, Math.max(0, item.end / item.duration)) : 0;
            item.wsInstance.seekTo(prog);
            if (curTimeSpan) curTimeSpan.textContent = formatTime(item.end);
        });
    }

    // ── Direct Number Inputs ──
    if (inputStartEl) {
        inputStartEl.addEventListener('change', () => {
            const val = parseFloat(inputStartEl.value);
            updateTrim('input_start', isNaN(val) ? 0 : val, undefined, 'start');
        });
        inputStartEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') inputStartEl.blur();
        });
    }
    if (inputEndEl) {
        inputEndEl.addEventListener('change', () => {
            const val = parseFloat(inputEndEl.value);
            updateTrim('input_end', undefined, isNaN(val) ? item.duration : val, 'end');
        });
        inputEndEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') inputEndEl.blur();
        });
    }

    // ── Transport / Playback Controls ──
    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            if (item.wsInstance.isPlaying()) {
                item.wsInstance.pause();
                btnPlay.textContent = `▶ ${t('btn_play')}`;
            } else {
                const cur = item.wsInstance.getCurrentTime();
                if (cur < item.start || cur >= item.end) {
                    const prog = item.duration > 0 ? item.start / item.duration : 0;
                    item.wsInstance.seekTo(prog);
                }
                item.wsInstance.play();
                btnPlay.textContent = `⏸ ${t('btn_pause')}`;
            }
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            item.wsInstance.pause();
            const prog = item.duration > 0 ? item.start / item.duration : 0;
            item.wsInstance.seekTo(prog);
            if (btnPlay) btnPlay.textContent = `▶ ${t('btn_play')}`;
            if (curTimeSpan) curTimeSpan.textContent = formatTime(item.start);
        });
    }

    if (btnSeekBack) {
        btnSeekBack.addEventListener('click', () => {
            const cur = item.wsInstance.getCurrentTime();
            const next = Math.max(0, cur - 1.0);
            const prog = item.duration > 0 ? next / item.duration : 0;
            item.wsInstance.seekTo(prog);
            if (curTimeSpan) curTimeSpan.textContent = formatTime(next);
        });
    }

    if (btnSeekFwd) {
        btnSeekFwd.addEventListener('click', () => {
            const cur = item.wsInstance.getCurrentTime();
            const next = Math.min(item.duration, cur + 1.0);
            const prog = item.duration > 0 ? next / item.duration : 0;
            item.wsInstance.seekTo(prog);
            if (curTimeSpan) curTimeSpan.textContent = formatTime(next);
        });
    }

    // ── WaveSurfer Ready Event ──
    item.wsInstance.on('ready', () => {
        const dur = item.wsInstance.getDuration();
        item.duration = dur;

        let endT = item.end === 0 ? dur : item.end;
        item.end = endT;

        if (totTimeSpan) totTimeSpan.textContent = formatTime(dur);
        if (inputStartEl) inputStartEl.max = dur;
        if (inputEndEl) inputEndEl.max = dur;

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

        sliderStartEl.noUiSlider.on('update', () => {
            if (isUpdating) return;
            const val = parseFloat(sliderStartEl.noUiSlider.get());
            updateTrim('slider_start', val, undefined);
        });

        sliderEndEl.noUiSlider.on('update', () => {
            if (isUpdating) return;
            const val = parseFloat(sliderEndEl.noUiSlider.get());
            updateTrim('slider_end', undefined, val);
        });

        updateTrim('init', item.start, endT);

        // Apply saved zoom if any
        if (item.zoom && item.zoom > 0) {
            applyZoom(item.zoom);
        }
    });

    item.wsInstance.on('audioprocess', (currentTime) => {
        if (curTimeSpan) curTimeSpan.textContent = formatTime(currentTime);
        if (item.wsInstance.isPlaying() && currentTime >= item.end) {
            item.wsInstance.pause();
            const prog = item.duration > 0 ? item.start / item.duration : 0;
            item.wsInstance.seekTo(prog);
            if (btnPlay) btnPlay.textContent = `▶ ${t('btn_play')}`;
            if (curTimeSpan) curTimeSpan.textContent = formatTime(item.start);
        }
    });

    item.wsInstance.on('interaction', (newTime) => {
        if (curTimeSpan) curTimeSpan.textContent = formatTime(newTime);
    });

    item.wsInstance.on('pause', () => {
        if (btnPlay) btnPlay.textContent = `▶ ${t('btn_play')}`;
    });

    wsRegions.on('region-updated', (region) => {
        if (isUpdating) return;
        updateTrim('region', region.start, region.end);
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
