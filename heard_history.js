// Extension-owned heard-track history. This module deliberately opens
// IndexedDB only when a store operation is requested; importing it must be
// safe in a service worker test environment without indexedDB.
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.FreshDigHeardHistory = factory();
}(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
    'use strict';

    const DB_NAME = 'FreshDigHeardHistory';
    const DB_VERSION = 1;
    const STORE_NAME = 'heardTracks';
    const INDEX_NAME = 'heardAt';
    const MAX_BATCH = 100;
    const MAX_PAGE = 500;
    const MAX_ID_LENGTH = 64;

    function failure(reason) {
        return { ok: false, reason: String(reason || 'error') };
    }

    function isPlainArray(value, maxLength) {
        return Array.isArray(value) && (maxLength === undefined || value.length <= maxLength) && Object.keys(value).length === value.length;
    }

    // SoundCloud IDs are decimal strings in the bridge protocol. Safe integer
    // numbers remain accepted for callers that still hold numeric IDs.
    function normalizeId(value) {
        if (typeof value === 'number') {
            if (!Number.isSafeInteger(value) || value <= 0) return null;
            return String(value);
        }
        if (typeof value !== 'string') return null;
        if (value.length > MAX_ID_LENGTH) return null;
        const text = value.trim();
        if (!/^\d+$/.test(text) || /^0+$/.test(text) || text.length > MAX_ID_LENGTH) return null;
        const normalized = text.replace(/^0+(?=\d)/, '');
        return normalized.length <= MAX_ID_LENGTH ? normalized : null;
    }

    function normalizeHeardAt(value) {
        if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isSafeInteger(value) || value < 0) return null;
        return value;
    }

    function normalizeRecord(record) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
        const id = normalizeId(record.id);
        const heardAt = normalizeHeardAt(record.heardAt);
        if (!id || heardAt === null) return null;
        return { id: id, heardAt: heardAt };
    }

    function normalizeIds(ids) {
        if (!isPlainArray(ids, MAX_BATCH)) return null;
        const normalized = [];
        for (let i = 0; i < ids.length; i += 1) {
            const id = normalizeId(ids[i]);
            if (!id) return null;
            normalized.push(id);
        }
        return normalized;
    }

    function normalizeRecords(records) {
        if (!isPlainArray(records, MAX_BATCH)) return null;
        const normalized = [];
        const positions = new Map();
        for (let i = 0; i < records.length; i += 1) {
            const record = normalizeRecord(records[i]);
            if (!record) return null;
            if (positions.has(record.id)) {
                const previous = normalized[positions.get(record.id)];
                previous.heardAt = Math.min(previous.heardAt, record.heardAt);
            } else { positions.set(record.id, normalized.length); normalized.push(record); }
        }
        return normalized;
    }

    function normalizeLimit(value) {
        if (value === undefined || value === null || value === '') return 100;
        if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > MAX_PAGE) return null;
        return value;
    }

    function normalizeCursor(value) {
        if (value === undefined || value === null || value === '') return null;
        return normalizeId(value);
    }

    function compareIds(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    function requestToPromise(request) {
        return new Promise(function (resolve, reject) {
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error || new Error('idb-request')); };
        });
    }

    function transactionToPromise(transaction) {
        const promise = new Promise(function (resolve, reject) {
            let settled = false;
            const timer = setTimeout(function () {
                finish(reject, new Error('idb-timeout'));
                try { transaction.abort(); } catch (e) {}
            }, 7000);
            function finish(fn, value) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                fn(value);
            }
            transaction.oncomplete = function () { finish(resolve); };
            transaction.onerror = function () { finish(reject, transaction.error || new Error('idb-transaction')); };
            transaction.onabort = function () { finish(reject, transaction.error || new Error('idb-abort')); };
        });
        // A request can fail before the caller reaches its final await. Mark
        // the rejection handled here; callers still await the same promise to
        // preserve the failure result without an unhandled rejection.
        promise.catch(function () {});
        return promise;
    }

    function openTransaction(db, storeName, mode, durable) {
        if (durable) {
            try { return db.transaction(storeName, mode, { durability: 'strict' }); } catch (e) {}
        }
        return db.transaction(storeName, mode);
    }

    function createStore(options) {
        options = options || {};
        const indexedDb = options.indexedDB || (typeof indexedDB !== 'undefined' ? indexedDB : null);
        const keyRange = options.IDBKeyRange || (typeof IDBKeyRange !== 'undefined' ? IDBKeyRange : null);
        const dbName = options.dbName || DB_NAME;
        const storeName = options.storeName || STORE_NAME;
        let dbPromise = null;

        function openDb() {
            if (!indexedDb || typeof indexedDb.open !== 'function') return Promise.reject(new Error('unavailable'));
            if (dbPromise) return dbPromise;
            dbPromise = new Promise(function (resolve, reject) {
                let request;
                let settled = false;
                const timer = setTimeout(function () { fail(new Error('idb-open-timeout')); }, 5000);
                function fail(error) {
                    if (settled) return;
                    settled = true; clearTimeout(timer); reject(error);
                }
                try {
                    request = indexedDb.open(dbName, DB_VERSION);
                } catch (e) {
                    fail(e);
                    return;
                }
                request.onupgradeneeded = function () {
                    try {
                        const db = request.result;
                        const store = db.objectStoreNames && db.objectStoreNames.contains(storeName)
                            ? request.transaction.objectStore(storeName)
                            : db.createObjectStore(storeName, { keyPath: 'id' });
                        if (store.indexNames && !store.indexNames.contains(INDEX_NAME)) {
                            store.createIndex(INDEX_NAME, 'heardAt', { unique: false });
                        }
                    } catch (e) {
                        // The request's error/abort event will reject the open.
                        try { request.transaction.abort(); } catch (ignored) {}
                    }
                };
                request.onsuccess = function () {
                    const db = request.result;
                    if (settled) { db.close(); return; }
                    settled = true; clearTimeout(timer);
                    if (db && typeof db.onversionchange !== 'undefined') {
                        db.onversionchange = function () {
                            if (dbPromise) dbPromise = null;
                            try { db.close(); } catch (e) {}
                        };
                    }
                    resolve(db);
                };
                request.onerror = function () { fail(request.error || new Error('idb-open')); };
                request.onblocked = function () { fail(new Error('idb-blocked')); };
            }).catch(function (error) {
                // Do not permanently cache a failed open: a later request may
                // succeed after the browser has recovered storage.
                dbPromise = null;
                throw error;
            });
            return dbPromise;
        }

        async function lookup(ids) {
            const normalized = normalizeIds(ids);
            if (!normalized) return failure('invalid-ids');
            if (!normalized.length) return { ok: true, ids: [] };
            let db;
            try { db = await openDb(); } catch (e) { return failure(e && e.message === 'unavailable' ? 'unavailable' : 'error'); }
            let transactionDone = null;
            try {
                const transaction = openTransaction(db, storeName, 'readonly', false);
                transactionDone = transactionToPromise(transaction);
                const objectStore = transaction.objectStore(storeName);
                const known = [];
                for (let i = 0; i < normalized.length; i += 1) {
                    const found = await requestToPromise(objectStore.get(normalized[i]));
                    if (found) known.push(normalized[i]);
                }
                await transactionDone;
                return { ok: true, ids: known };
            } catch (e) {
                if (transactionDone) { try { await transactionDone; } catch (ignored) {} }
                return failure('error');
            }
        }

        async function put(records) {
            const normalized = normalizeRecords(records);
            if (!normalized) return failure('invalid-records');
            if (!normalized.length) return { ok: true };
            let db;
            try { db = await openDb(); } catch (e) { return failure(e && e.message === 'unavailable' ? 'unavailable' : 'error'); }
            let transactionDone = null;
            try {
                const transaction = openTransaction(db, storeName, 'readwrite', true);
                transactionDone = transactionToPromise(transaction);
                const objectStore = transaction.objectStore(storeName);
                normalized.forEach(function (record) {
                    const request = objectStore.get(record.id);
                    request.onsuccess = function () {
                        const previous = normalizeRecord(request.result);
                        const heardAt = previous ? Math.min(previous.heardAt, record.heardAt) : record.heardAt;
                        objectStore.put({ id: record.id, heardAt: heardAt });
                    };
                });
                await transactionDone;
                return { ok: true };
            } catch (e) {
                if (transactionDone) { try { await transactionDone; } catch (ignored) {} }
                return failure('error');
            }
        }

        async function stats() {
            let db;
            try { db = await openDb(); } catch (e) { return failure(e && e.message === 'unavailable' ? 'unavailable' : 'error'); }
            let transactionDone = null;
            try {
                const transaction = openTransaction(db, storeName, 'readonly', false);
                transactionDone = transactionToPromise(transaction);
                const objectStore = transaction.objectStore(storeName);
                const count = await requestToPromise(objectStore.count());
                let oldestAt = null;
                let newestAt = null;
                let index = null;
                try { index = objectStore.index(INDEX_NAME); } catch (e) {}
                if (index) {
                    const cursorValue = function (direction) {
                        return new Promise(function (resolve, reject) {
                            const request = index.openCursor(null, direction);
                            request.onsuccess = function () { resolve(request.result ? request.result.value : null); };
                            request.onerror = function () { reject(request.error || new Error('idb-cursor')); };
                        });
                    };
                    const cursorValues = await Promise.all([cursorValue('next'), cursorValue('prev')]);
                    const first = cursorValues[0];
                    const last = cursorValues[1];
                    oldestAt = first ? first.heardAt : null;
                    newestAt = last ? last.heardAt : null;
                }
                await transactionDone;
                return { ok: true, count: Number(count) || 0, oldestAt: oldestAt, newestAt: newestAt };
            } catch (e) {
                if (transactionDone) { try { await transactionDone; } catch (ignored) {} }
                return failure('error');
            }
        }

        async function page(cursor, limit) {
            const normalizedCursor = normalizeCursor(cursor);
            if (cursor !== undefined && cursor !== null && cursor !== '' && !normalizedCursor) return failure('invalid-cursor');
            const normalizedLimit = normalizeLimit(limit);
            if (!normalizedLimit) return failure('invalid-limit');
            let db;
            try { db = await openDb(); } catch (e) { return failure(e && e.message === 'unavailable' ? 'unavailable' : 'error'); }
            let transactionDone = null;
            try {
                const transaction = openTransaction(db, storeName, 'readonly', false);
                transactionDone = transactionToPromise(transaction);
                const objectStore = transaction.objectStore(storeName);
                const records = [];
                let lastId = null;
                let settled = false;
                const result = await new Promise(function (resolve, reject) {
                    const range = normalizedCursor && keyRange && typeof keyRange.lowerBound === 'function'
                        ? keyRange.lowerBound(normalizedCursor, true)
                        : null;
                    const skipCursorManually = !!normalizedCursor && !range;
                    let request;
                    try { request = objectStore.openCursor(range, 'next'); } catch (e) { reject(e); return; }
                    request.onsuccess = function () {
                        const current = request.result;
                        if (!current) {
                            if (!settled) {
                                settled = true;
                                resolve({ ok: true, records: records, nextCursor: null, done: true });
                            }
                            return;
                        }
                        if (skipCursorManually && compareIds(String(current.key), normalizedCursor) <= 0) {
                            current.continue();
                            return;
                        }
                        // One extra cursor step lets us distinguish a full final
                        // page from a full page with more data without loading it.
                        if (records.length >= normalizedLimit) {
                            if (!settled) {
                                settled = true;
                                resolve({ ok: true, records: records, nextCursor: lastId, done: false });
                            }
                            return;
                        }
                        const value = normalizeRecord(current.value);
                        if (value) {
                            records.push(value);
                            lastId = value.id;
                        }
                        current.continue();
                    };
                    request.onerror = function () { reject(request.error || new Error('idb-cursor')); };
                });
                await transactionDone;
                return result;
            } catch (e) {
                if (transactionDone) { try { await transactionDone; } catch (ignored) {} }
                return failure('error');
            }
        }

        async function clear() {
            let db;
            try { db = await openDb(); } catch (e) { return failure(e && e.message === 'unavailable' ? 'unavailable' : 'error'); }
            let transactionDone = null;
            try {
                const transaction = openTransaction(db, storeName, 'readwrite', true);
                transactionDone = transactionToPromise(transaction);
                transaction.objectStore(storeName).clear();
                await transactionDone;
                return { ok: true };
            } catch (e) {
                if (transactionDone) { try { await transactionDone; } catch (ignored) {} }
                return failure('error');
            }
        }

        async function request(message) {
            message = message || {};
            try {
                if (message.op === 'lookup') return await lookup(message.ids);
                if (message.op === 'put') return await put(message.records);
                if (message.op === 'stats') return await stats();
                if (message.op === 'page') return await page(message.cursor, message.limit);
                if (message.op === 'clear' || message.op === 'deleteAll') return await clear();
                return failure('unknown-operation');
            } catch (e) {
                return failure('error');
            }
        }

        return { lookup: lookup, put: put, stats: stats, page: page, clear: clear, request: request };
    }

    // A bounded in-memory implementation keeps the validation and pagination
    // contract testable in Node without adding an IndexedDB dependency. It is
    // not used by the extension runtime.
    function createMemoryStore() {
        const records = new Map();
        return {
            async lookup(ids) {
                const normalized = normalizeIds(ids);
                if (!normalized) return failure('invalid-ids');
                return { ok: true, ids: normalized.filter(function (id) { return records.has(id); }) };
            },
            async put(items) {
                const normalized = normalizeRecords(items);
                if (!normalized) return failure('invalid-records');
                normalized.forEach(function (record) {
                    const previous = records.get(record.id);
                    records.set(record.id, previous
                        ? { id: record.id, heardAt: Math.min(previous.heardAt, record.heardAt) }
                        : record);
                });
                return { ok: true };
            },
            async stats() {
                const values = Array.from(records.values());
                const times = values.map(function (record) { return record.heardAt; });
                return {
                    ok: true,
                    count: values.length,
                    oldestAt: times.length ? Math.min.apply(null, times) : null,
                    newestAt: times.length ? Math.max.apply(null, times) : null
                };
            },
            async page(cursor, limit) {
                const normalizedCursor = normalizeCursor(cursor);
                if (cursor !== undefined && cursor !== null && cursor !== '' && !normalizedCursor) return failure('invalid-cursor');
                const normalizedLimit = normalizeLimit(limit);
                if (!normalizedLimit) return failure('invalid-limit');
                const keys = Array.from(records.keys()).sort(compareIds);
                const start = normalizedCursor ? keys.findIndex(function (id) { return compareIds(id, normalizedCursor) > 0; }) : 0;
                const at = start < 0 ? keys.length : start;
                const pageKeys = keys.slice(at, at + normalizedLimit);
                const output = pageKeys.map(function (id) { return records.get(id); });
                const done = at + pageKeys.length >= keys.length;
                return { ok: true, records: output, nextCursor: done ? null : pageKeys[pageKeys.length - 1], done: done };
            },
            async clear() {
                records.clear();
                return { ok: true };
            },
            async request(message) {
                message = message || {};
                if (message.op === 'lookup') return this.lookup(message.ids);
                if (message.op === 'put') return this.put(message.records);
                if (message.op === 'stats') return this.stats();
                if (message.op === 'page') return this.page(message.cursor, message.limit);
                if (message.op === 'clear' || message.op === 'deleteAll') return this.clear();
                return failure('unknown-operation');
            }
        };
    }

    return {
        DB_NAME: DB_NAME,
        DB_VERSION: DB_VERSION,
        STORE_NAME: STORE_NAME,
        MAX_BATCH: MAX_BATCH,
        MAX_PAGE: MAX_PAGE,
        normalizeId: normalizeId,
        normalizeRecord: normalizeRecord,
        createStore: createStore,
        createMemoryStore: createMemoryStore
    };
}));
