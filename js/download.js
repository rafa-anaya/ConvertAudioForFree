// ==========================================
// DOWNLOAD — AudioTool Pro (descarga.html)
// Dynamic summary, download (single/ZIP), support section
// ==========================================

(async function () {
    'use strict';

    // ── Initialize Language ──
    initLanguage();

    // ── DOM References ──
    const downloadBtn = document.getElementById('dl-btn-main');
    const successMsg = document.getElementById('dl-success-msg');
    const statsTableBody = document.getElementById('dl-stats-body');
    const showMoreBtn = document.getElementById('dl-show-more-btn');
    const convertMoreBtn = document.getElementById('dl-convert-more-btn');

    // ── Constants ──
    const MAX_VISIBLE_ROWS = 5;
    let allFiles = [];
    let showingAll = false;

    // ── Step 1: Read processed files from IndexedDB ──
    try {
        await AudioDB.open();
        allFiles = await AudioDB.getProcessedFiles();
    } catch (err) {
        console.error('Failed to read IndexedDB:', err);
    }

    if (!allFiles || allFiles.length === 0) {
        document.getElementById('dl-success-text').textContent = t('dl_no_files');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }

    // ── Step 2: Render success message ──
    if (allFiles.length === 1) {
        document.getElementById('dl-success-text').textContent = t('dl_success_single');
        downloadBtn.textContent = t('dl_btn_download_single');
    } else {
        document.getElementById('dl-success-text').textContent =
            t('dl_success_multiple', { count: allFiles.length });
        downloadBtn.textContent = t('dl_btn_download');
    }

    // ── Step 3: Render stats table ──
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function calculateSavings(original, output) {
        if (original === 0) return { percent: 0, increased: false };
        const diff = original - output;
        const percent = Math.abs(Math.round((diff / original) * 100));
        return { percent, increased: diff < 0 };
    }

    function renderTableRows(files, limit) {
        statsTableBody.innerHTML = '';

        const visibleFiles = limit ? files.slice(0, limit) : files;

        visibleFiles.forEach((file) => {
            const savings = calculateSavings(file.originalSize, file.outputSize);
            const savingsClass = savings.increased ? 'negative' : 'positive';
            const savingsIcon = savings.increased ? t('dl_size_increase') : t('dl_size_decrease');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="dl-file-name" title="${file.originalName}">${file.originalName}</span></td>
                <td class="col-original-format">${file.originalFormat.toUpperCase()}</td>
                <td>${file.outputFormat.toUpperCase()}</td>
                <td>${formatSize(file.originalSize)}</td>
                <td>${formatSize(file.outputSize)}</td>
                <td class="col-savings">
                    <span class="dl-savings-badge ${savingsClass}">
                        ${savings.percent}% ${savingsIcon}
                    </span>
                </td>
                <td>
                    <button class="dl-btn-individual" onclick="downloadIndividual('${file.id}')" title="Download">
                        ${t('dl_btn_individual')}
                    </button>
                </td>
            `;
            statsTableBody.appendChild(tr);
        });

        // Show more button logic
        if (files.length > MAX_VISIBLE_ROWS) {
            const showMoreRow = document.getElementById('dl-show-more-row');
            if (showMoreRow) showMoreRow.style.display = '';

            if (showingAll) {
                showMoreBtn.textContent = t('dl_show_less');
            } else {
                const remaining = files.length - MAX_VISIBLE_ROWS;
                showMoreBtn.textContent = t('dl_show_more', { remaining });
            }
        } else {
            const showMoreRow = document.getElementById('dl-show-more-row');
            if (showMoreRow) showMoreRow.style.display = 'none';
        }
    }

    renderTableRows(allFiles, MAX_VISIBLE_ROWS);

    // ── Show More / Less toggle ──
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            showingAll = !showingAll;
            renderTableRows(allFiles, showingAll ? null : MAX_VISIBLE_ROWS);
        });
    }

    // ── Step 4: Download Individual ──
    window.downloadIndividual = function (fileId) {
        const file = allFiles.find(f => f.id === fileId);
        if (!file) return;

        const url = URL.createObjectURL(file.outputBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.outputName;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Step 5: Main Download Button (ZIP or single) ──
    downloadBtn.addEventListener('click', async () => {
        if (allFiles.length === 0) return;

        downloadBtn.disabled = true;
        downloadBtn.textContent = currentLang === 'es' ? 'Preparando descarga...' : 'Preparing download...';

        try {
            if (allFiles.length === 1) {
                // Single file: direct download
                const file = allFiles[0];
                const url = URL.createObjectURL(file.outputBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.outputName;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Multiple files: ZIP download
                const zip = new JSZip();

                allFiles.forEach(file => {
                    zip.file(file.outputName, file.outputBlob);
                });

                const zipBlob = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 }
                });

                const zipName = t('dl_zip_name');
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = zipName;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Download error:', err);
            alert(currentLang === 'es'
                ? 'Error al preparar la descarga.'
                : 'Error preparing download.');
        } finally {
            downloadBtn.disabled = false;
            if (allFiles.length === 1) {
                downloadBtn.textContent = t('dl_btn_download_single');
            } else {
                downloadBtn.textContent = t('dl_btn_download');
            }
        }
    });

    // ── Step 6: Convert More Button ──
    if (convertMoreBtn) {
        convertMoreBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await AudioDB.clearAll().catch(() => {});
            window.location.href = '/';
        });
    }

    // ── Step 7: Cleanup on page leave ──
    function cleanupIDB() {
        AudioDB.clearAll().catch(() => {});
    }

    window.addEventListener('beforeunload', cleanupIDB);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            cleanupIDB();
        }
    });

    // ── Step 8: React to language changes ──
    document.addEventListener('langchange', () => {
        // Re-render dynamic content
        if (allFiles.length === 1) {
            document.getElementById('dl-success-text').textContent = t('dl_success_single');
            downloadBtn.textContent = t('dl_btn_download_single');
        } else {
            document.getElementById('dl-success-text').textContent =
                t('dl_success_multiple', { count: allFiles.length });
            downloadBtn.textContent = t('dl_btn_download');
        }
        renderTableRows(allFiles, showingAll ? null : MAX_VISIBLE_ROWS);
    });

})();
