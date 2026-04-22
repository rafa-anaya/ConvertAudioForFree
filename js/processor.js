// ==========================================
// PROCESSOR — AudioTool Pro (procesar.html)
// FFmpeg.wasm processing engine
// Reads from IndexedDB pendingJobs, writes to processedFiles
// ==========================================

(async function () {
    'use strict';

    // ── DOM References ──
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    const fileProgress = document.getElementById('file-progress');
    const currentFileName = document.getElementById('current-file-name');
    const estimatedTime = document.getElementById('estimated-time');
    const statusBox = document.getElementById('proc-status-box');

    // ── Initialize Language ──
    await initLanguage();

    // ── Helper: Update UI ──
    function updateProgress(percent) {
        progressFill.style.width = percent + '%';
        progressPercent.textContent = Math.round(percent) + '%';
    }

    function updateStatus(msgKey, cssClass, params) {
        statusBox.className = 'proc-status ' + cssClass;
        statusBox.innerHTML =
            (cssClass === 'processing' ? '<span class="proc-spinner"></span>' : '') +
            t(msgKey, params);
    }

    function formatTime(seconds) {
        if (seconds < 60) return Math.round(seconds) + 's';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    // ── Step 1: Read pending jobs from IndexedDB ──
    let jobs;
    try {
        await AudioDB.open();
        jobs = await AudioDB.getPendingJobs();
    } catch (err) {
        console.error('Failed to open IndexedDB:', err);
        updateStatus('proc_error', 'error');
        return;
    }

    if (!jobs || jobs.length === 0) {
        updateStatus('proc_no_files', 'error');
        setTimeout(() => {
            window.location.href = './';
        }, 2000);
        return;
    }

    const totalFiles = jobs.length;

    // ── Step 2: Load FFmpeg ──
    updateStatus('proc_file_progress', 'processing', { current: 0, total: totalFiles });
    currentFileName.textContent = t('proc_loading_engine');

    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({
        log: false,
        corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
    });

    try {
        await ffmpeg.load();
    } catch (err) {
        console.error('FFmpeg load failed:', err);
        updateStatus('proc_error', 'error');
        return;
    }

    // ── Step 3: Process each file ──
    const startTime = Date.now();

    for (let i = 0; i < totalFiles; i++) {
        const job = jobs[i];
        const currentNum = i + 1;

        // Update UI
        const overallPercent = (i / totalFiles) * 100;
        updateProgress(overallPercent);
        updateStatus('proc_file_progress', 'processing', { current: currentNum, total: totalFiles });
        fileProgress.textContent = t('proc_file_progress', { current: currentNum, total: totalFiles });
        currentFileName.textContent = job.originalName;

        // Estimate time
        if (i > 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const avgPerFile = elapsed / i;
            const remaining = avgPerFile * (totalFiles - i);
            estimatedTime.textContent = formatTime(remaining);
        } else {
            estimatedTime.textContent = t('proc_calculating');
        }

        try {
            const inputName = `input_${i}.audio`;
            const outputName = `output_${i}.${job.targetFormat}`;

            // Write input file to FFmpeg FS
            ffmpeg.FS('writeFile', inputName, await fetchFile(job.fileBlob));

            // Build FFmpeg args
            const args = ['-i', inputName];

            if (job.trimStart > 0) {
                args.push('-ss', job.trimStart.toString());
            }
            if (job.trimEnd > 0 && Math.abs(job.trimEnd - job.duration) > 0.5) {
                args.push('-to', job.trimEnd.toString());
            }

            args.push(outputName);

            // Run FFmpeg
            await ffmpeg.run(...args);

            // Read output
            const data = ffmpeg.FS('readFile', outputName);
            const outputBlob = new Blob([data.buffer], { type: `audio/${job.targetFormat}` });

            const originalBaseName = job.originalName.substring(0, job.originalName.lastIndexOf('.')) || `audio_${i}`;
            const outputFileName = `recorte_${originalBaseName}.${job.targetFormat}`;

            // Save to IndexedDB processedFiles
            await AudioDB.saveProcessedFile({
                id: job.id,
                originalName: job.originalName,
                originalSize: job.originalSize,
                originalFormat: job.originalFormat,
                outputName: outputFileName,
                outputFormat: job.targetFormat,
                outputSize: outputBlob.size,
                outputBlob: outputBlob,
                trimStart: job.trimStart,
                trimEnd: job.trimEnd,
                duration: job.duration
            });

            // Clean FFmpeg FS memory
            ffmpeg.FS('unlink', inputName);
            ffmpeg.FS('unlink', outputName);

        } catch (err) {
            console.error(`Error processing file ${job.originalName}:`, err);
            // Continue with next file
        }

        // Update progress after processing
        updateProgress(((i + 1) / totalFiles) * 100);
    }

    // ── Step 4: Cleanup pending jobs ──
    try {
        await AudioDB.clearPendingJobs();
    } catch (err) {
        console.warn('Failed to clear pending jobs:', err);
    }

    // ── Step 5: Complete and redirect ──
    updateProgress(100);
    updateStatus('proc_completed', 'completed');
    estimatedTime.textContent = '';
    currentFileName.textContent = t('proc_redirecting');

    setTimeout(() => {
        window.location.href = 'descarga';
    }, 1500);

})();
