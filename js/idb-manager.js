// ==========================================
// IndexedDB Manager — AudioTool Pro
// Puente de datos entre las 3 páginas
// ==========================================

const AudioDB = (() => {
    const DB_NAME = 'AudioToolProDB';
    const DB_VERSION = 1;
    const STORE_PENDING = 'pendingJobs';
    const STORE_PROCESSED = 'processedFiles';

    let _db = null;

    /**
     * Opens (or creates) the IndexedDB database.
     * Returns a Promise that resolves with the db instance.
     */
    function open() {
        return new Promise((resolve, reject) => {
            if (_db) {
                resolve(_db);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(STORE_PENDING)) {
                    db.createObjectStore(STORE_PENDING, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_PROCESSED)) {
                    db.createObjectStore(STORE_PROCESSED, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                _db = event.target.result;
                resolve(_db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB open error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Generic helper: put an item into a store.
     */
    function _put(storeName, item) {
        return open().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.put(item);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        });
    }

    /**
     * Generic helper: get all items from a store.
     */
    function _getAll(storeName) {
        return open().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        });
    }

    /**
     * Generic helper: clear all items from a store.
     */
    function _clear(storeName) {
        return open().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.clear();
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        });
    }

    // ── Public API ──

    /**
     * Save an array of pending jobs.
     * Each job: { id, originalName, originalSize, originalFormat, targetFormat,
     *             trimStart, trimEnd, duration, fileBlob }
     */
    function savePendingJobs(jobsArray) {
        return open().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_PENDING, 'readwrite');
                const store = tx.objectStore(STORE_PENDING);

                jobsArray.forEach(job => store.put(job));

                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        });
    }

    /**
     * Get all pending jobs.
     */
    function getPendingJobs() {
        return _getAll(STORE_PENDING);
    }

    /**
     * Clear all pending jobs.
     */
    function clearPendingJobs() {
        return _clear(STORE_PENDING);
    }

    /**
     * Save a single processed file.
     * { id, originalName, originalSize, originalFormat,
     *   outputName, outputFormat, outputSize, outputBlob,
     *   trimStart, trimEnd, duration }
     */
    function saveProcessedFile(fileObj) {
        return _put(STORE_PROCESSED, fileObj);
    }

    /**
     * Get all processed files.
     */
    function getProcessedFiles() {
        return _getAll(STORE_PROCESSED);
    }

    /**
     * Clear all processed files.
     */
    function clearProcessedFiles() {
        return _clear(STORE_PROCESSED);
    }

    /**
     * Nuclear: clear both stores.
     */
    function clearAll() {
        return Promise.all([
            clearPendingJobs(),
            clearProcessedFiles()
        ]);
    }

    return {
        open,
        savePendingJobs,
        getPendingJobs,
        clearPendingJobs,
        saveProcessedFile,
        getProcessedFiles,
        clearProcessedFiles,
        clearAll
    };
})();
