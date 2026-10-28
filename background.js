// Background Service Worker for FreshDig for SoundCloud
(function () {
    'use strict';

    // The list module is bundled with the service worker. Tests can inject the
    // same UMD export directly, so importScripts is intentionally optional.
    if (typeof importScripts === 'function') {
        try { importScripts('list_backup.js'); } catch (e) {
            console.warn('[SC-FreshStation] Later list module unavailable:', e);
        }
        try { importScripts('heard_history.js'); } catch (e) {
            console.warn('[SC-FreshStation] Heard history module unavailable:', e);
        }
    }

    console.log('[SC-FreshStation] Background Service Worker initialized');

    // 新規インストール後、最初に開いた SoundCloud でだけ案内する。
    if (chrome.runtime.onInstalled) {
        chrome.runtime.onInstalled.addListener(function (details) {
            if (details.reason === 'install') chrome.storage.local.set({ onboardingPending: true });
        });
    }

    function getSoundCloudAuthToken(callback) {
        if (!chrome.cookies) {
            callback(null);
            return;
        }
        chrome.cookies.get({ url: 'https://soundcloud.com', name: 'oauth_token' }, function (cookie) {
            if (chrome.runtime.lastError) {
                console.warn('[SC-FreshStation] Cookie error:', chrome.runtime.lastError);
                callback(null);
                return;
            }
            if (cookie && cookie.value) {
                const tok = cookie.value.startsWith('OAuth ') ? cookie.value : ('OAuth ' + cookie.value);
                callback(tok);
            } else {
                callback(null);
            }
        });
    }

    function injectTokenToTab(tabId, token) {
        if (!tabId || !token) return;
        chrome.tabs.sendMessage(tabId, {
            target: 'SC_FRESH_STATION',
            action: 'INJECT_AUTH_TOKEN',
            token: token
        }).catch(function () {
            // Tab might not be ready or not a SoundCloud page yet
        });
    }

    function broadcastTokenToAllSoundCloudTabs(token) {
        if (!token) return;
        chrome.tabs.query({ url: '*://*.soundcloud.com/*' }, function (tabs) {
            if (!tabs) return;
            tabs.forEach(function (tab) {
                injectTokenToTab(tab.id, token);
            });
        });
    }

    function preventDiscard(tabId) {
        if (!tabId || !chrome.tabs || !chrome.tabs.update) return;
        try {
            chrome.tabs.update(tabId, { autoDiscardable: false }, function () {
                if (chrome.runtime.lastError) { /* ignore tab closure */ }
            });
        } catch (e) {}
    }

    // 起動時に既存の SoundCloud タブのスリープ破棄を防止
    chrome.tabs.query({ url: '*://*.soundcloud.com/*' }, function (tabs) {
        if (!tabs) return;
        tabs.forEach(function (tab) {
            preventDiscard(tab.id);
        });
    });

    // 1. タブの更新を検知して自動でトークンを注入 & スリープ破棄を防止
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status === 'loading' && tab.url && tab.url.includes('soundcloud.com')) {
            preventDiscard(tabId);
        }
        if ((changeInfo.status === 'loading' || changeInfo.status === 'complete') && tab.url && tab.url.includes('soundcloud.com')) {
            getSoundCloudAuthToken(function (token) {
                if (token) {
                    injectTokenToTab(tabId, token);
                }
            });
        }
    });

    // 2. Cookieの変更（ログイン・ログアウト・更新）をリアルタイム検知
    if (chrome.cookies && chrome.cookies.onChanged) {
        chrome.cookies.onChanged.addListener(function (changeInfo) {
            if (changeInfo.cookie && changeInfo.cookie.domain && changeInfo.cookie.domain.includes('soundcloud.com') && changeInfo.cookie.name === 'oauth_token') {
                if (!changeInfo.removed && changeInfo.cookie.value) {
                    const tok = changeInfo.cookie.value.startsWith('OAuth ') ? changeInfo.cookie.value : ('OAuth ' + changeInfo.cookie.value);
                    broadcastTokenToAllSoundCloudTabs(tok);
                }
            }
        });
    }

    // 「後で聴く作者」: 読み出し→変更→保存を、ここ(サービスワーカー)の 1 か所で順番に行う（タブ同士の上書き事故を防ぐ）
    const LATER_MAX = 500;
    let laterChain = Promise.resolve();
    let laterWindowId = null;
    let laterWindowOpen = null;

    function getLaterListsModule() {
        try {
            if (typeof FreshDigLists !== 'undefined' && FreshDigLists) return FreshDigLists;
        } catch (e) {}
        return null;
    }

    function chromeCall(api, args, owner) {
        return new Promise(function (resolve, reject) {
            if (typeof api !== 'function') {
                reject(new Error('api-unavailable'));
                return;
            }
            let settled = false;
            const finish = function (fn, value) {
                if (settled) return;
                settled = true;
                fn(value);
            };
            const callback = function (value) {
                const err = chrome.runtime && chrome.runtime.lastError;
                if (err) finish(reject, new Error(err.message || 'chrome-error'));
                else finish(resolve, value);
            };
            try {
                const result = api.apply(owner || chrome, (args || []).concat(callback));
                if (result && typeof result.then === 'function') {
                    result.then(function (value) { finish(resolve, value); }, function (err) { finish(reject, err); });
                } else if (result !== undefined) finish(resolve, result);
            } catch (e) {
                finish(reject, e);
            }
        });
    }

    function laterWindowPageUrl() {
        if (chrome.runtime && typeof chrome.runtime.getURL === 'function') return chrome.runtime.getURL('later.html');
        return 'later.html';
    }

    async function findExistingLaterWindow() {
        if (!chrome.windows) return null;
        if (laterWindowId !== null && laterWindowId !== undefined) {
            if (typeof chrome.windows.get !== 'function') {
                // Minimal test/browser shims may expose update without get. A
                // successful focus still proves that the tracked window lives.
                if (typeof chrome.windows.update === 'function') {
                    try {
                        await chromeCall(chrome.windows.update, [laterWindowId, { focused: true }], chrome.windows);
                        return { id: laterWindowId, focused: true };
                    } catch (e) {}
                }
                laterWindowId = null;
            }
        }
        if (laterWindowId !== null && laterWindowId !== undefined) {
            try {
                const existing = await chromeCall(chrome.windows.get, [laterWindowId], chrome.windows);
                if (existing && existing.id !== undefined) return existing;
            } catch (e) {}
            laterWindowId = null;
        }
        // A service worker can be restarted while the popup window stays open.
        // Recover it by looking for the extension page before creating another.
        if (typeof chrome.windows.getAll !== 'function') return null;
        try {
            const all = await chromeCall(chrome.windows.getAll, [{ populate: true }], chrome.windows);
            const windows = Array.isArray(all) ? all : [];
            for (let i = 0; i < windows.length; i += 1) {
                const tabs = Array.isArray(windows[i].tabs) ? windows[i].tabs : [];
                if (tabs.some(function (tab) { return tab && tab.url === laterWindowPageUrl(); })) {
                    laterWindowId = windows[i].id;
                    return windows[i];
                }
            }
        } catch (e) {}
        return null;
    }

    async function openLaterWindow() {
        if (laterWindowOpen) return laterWindowOpen;
        laterWindowOpen = (async function () {
            if (!chrome.windows || typeof chrome.windows.create !== 'function') {
                return { ok: false, reason: 'unavailable' };
            }
            const existing = await findExistingLaterWindow();
            if (existing && existing.id !== undefined) {
                laterWindowId = existing.id;
                if (typeof chrome.windows.update === 'function' && !existing.focused) {
                    try {
                        await chromeCall(chrome.windows.update, [existing.id, { focused: true }], chrome.windows);
                    } catch (e) {
                        laterWindowId = null;
                    }
                }
                if (laterWindowId !== null) return { ok: true };
            }
            try {
                const created = await chromeCall(chrome.windows.create, [{
                    url: laterWindowPageUrl(),
                    type: 'popup',
                    width: 420,
                    height: 600
                }], chrome.windows);
                if (!created || created.id === undefined) return { ok: false, reason: 'error' };
                laterWindowId = created.id;
                return { ok: true };
            } catch (e) {
                laterWindowId = null;
                return { ok: false, reason: 'error' };
            }
        })().finally(function () { laterWindowOpen = null; });
        return laterWindowOpen;
    }

    // Chrome messages and VM based tests can hand the list module values from
    // another JavaScript realm. The module deliberately accepts plain objects
    // only, so copy plain records into this realm while leaving special
    // objects (Date, Map, etc.) intact for the module to reject.
    function copyListValue(value, stack) {
        if (value === null || typeof value !== 'object') return value;
        const seen = stack || new Set();
        if (seen.has(value)) throw new Error('invalid-list');
        seen.add(value);
        try {
            if (Array.isArray(value)) {
                if (Object.keys(value).length !== value.length) throw new Error('invalid-list');
                const array = [];
                for (let i = 0; i < value.length; i += 1) {
                    array.push(copyListValue(value[i], seen));
                }
                return array;
            }
            const proto = Object.getPrototypeOf(value);
            const plain = proto === null || (
                proto && Object.prototype.hasOwnProperty.call(proto, 'constructor') &&
                proto.constructor && proto.constructor.name === 'Object' &&
                Object.getPrototypeOf(proto) === null
            );
            if (!plain) return value;
            const object = Object.create(null);
            Object.keys(value).forEach(function (key) {
                object[key] = copyListValue(value[key], seen);
            });
            return object;
        } finally {
            seen.delete(value);
        }
    }

    function copyListItems(items) {
        if (!Array.isArray(items)) throw new Error('invalid-items');
        if (Object.keys(items).length !== items.length) throw new Error('invalid-items');
        const copied = [];
        for (let i = 0; i < items.length; i += 1) copied.push(copyListValue(items[i]));
        return copied;
    }

    function normalizeImportedList(items) {
        const api = getLaterListsModule();
        if (!api || typeof api.create !== 'function' || typeof api.normalize !== 'function' || typeof api.merge !== 'function') {
            throw new Error('later-module-unavailable');
        }
        if (!Array.isArray(items)) throw new Error('invalid-items');
        if (items.length > LATER_MAX) throw new Error('limit');

        // Keep the non-Later maps explicit and empty so a backup cannot import
        // unrelated blacklist data into extension storage.
        const importedLists = Object.create(null);
        importedLists.dislikedTracks = Object.create(null);
        importedLists.dislikedArtists = Object.create(null);
        importedLists.dislikedGenres = Object.create(null);
        importedLists.laterArtists = copyListItems(items);
        const imported = api.create(importedLists);
        const normalized = api.normalize(imported);
        if (!normalized || !normalized.lists || !Array.isArray(normalized.lists.laterArtists)) {
            throw new Error('invalid-list');
        }
        return normalized.lists.laterArtists;
    }

    function importLaterItems(current, items) {
        const api = getLaterListsModule();
        if (!api || typeof api.create !== 'function' || typeof api.normalize !== 'function' || typeof api.merge !== 'function') {
            throw new Error('later-module-unavailable');
        }
        const incoming = normalizeImportedList(items);
        const currentList = Array.isArray(current) ? copyListItems(current) : [];
        const currentLists = Object.create(null);
        currentLists.dislikedTracks = Object.create(null);
        currentLists.dislikedArtists = Object.create(null);
        currentLists.dislikedGenres = Object.create(null);
        currentLists.laterArtists = currentList;
        const currentEnvelope = api.create(currentLists);
        const normalizedCurrent = api.normalize(currentEnvelope);
        if (!normalizedCurrent || !normalizedCurrent.lists || !Array.isArray(normalizedCurrent.lists.laterArtists)) throw new Error('invalid-list');
        const incomingLists = Object.create(null);
        incomingLists.dislikedTracks = Object.create(null);
        incomingLists.dislikedArtists = Object.create(null);
        incomingLists.dislikedGenres = Object.create(null);
        incomingLists.laterArtists = incoming;
        const incomingEnvelope = api.create(incomingLists);
        const normalizedIncoming = api.normalize(incomingEnvelope);
        const merged = api.merge(normalizedCurrent.lists, normalizedIncoming.lists);
        const output = Array.isArray(merged) ? merged : merged && merged.laterArtists;
        if (!Array.isArray(output)) throw new Error('invalid-list');
        if (output.length > LATER_MAX) throw new Error('limit');
        return output;
    }

    function cleanStr(v, n) { return String(v === undefined || v === null ? '' : v).slice(0, n); }

    async function doLater(req) {
        const store = await chrome.storage.local.get('laterArtists');
        const list = Array.isArray(store.laterArtists) ? store.laterArtists : [];
        if (req.action === 'LATER_ADD') {
            const it = req.item || {};
            const id = cleanStr(it.artistId, 40);
            if (!id) return { ok: false, reason: 'bad-item' };
            if (list.some(function (x) { return String(x.artistId) === id; })) return { ok: true, exists: true };
            if (list.length >= LATER_MAX) return { ok: false, reason: 'limit' };
            list.unshift({
                artistId: id,
                name: cleanStr(it.name, 200),
                permalink: cleanStr(it.permalink, 200),
                avatarUrl: cleanStr(it.avatarUrl, 500),
                addedAt: Date.now(),
                fromTrackTitle: cleanStr(it.fromTrackTitle, 300)
            });
            await chrome.storage.local.set({ laterArtists: list });
            return { ok: true };
        }
        if (req.action === 'LATER_REMOVE') {
            const id = cleanStr(req.artistId, 40);
            const next = list.filter(function (x) { return String(x.artistId) !== id; });
            if (next.length !== list.length) await chrome.storage.local.set({ laterArtists: next });
            return { ok: true };
        }
        if (req.action === 'LATER_IMPORT') {
            if (!Array.isArray(req.items)) return { ok: false, reason: 'invalid' };
            try {
                const next = importLaterItems(list, req.items);
                await chrome.storage.local.set({ laterArtists: next });
                return { ok: true };
            } catch (e) {
                const message = e && e.message ? String(e.message) : '';
                if (message === 'limit' || /500 (?:item )?limit|would exceed the 500/i.test(message)) return { ok: false, reason: 'limit' };
                if (message === 'invalid-items' || message === 'invalid-list' || /^Invalid FreshDigLists backup:/i.test(message)) return { ok: false, reason: 'invalid' };
                return { ok: false, reason: 'error' };
            }
        }
        return { ok: false, reason: 'unknown' };
    }

    // Heard-track history has its own extension-origin IndexedDB store. Keep
    // the module and database lazy so a service-worker startup without
    // indexedDB still serves the existing token/list functionality.
    let heardHistoryStore = null;
    let heardHistoryChain = Promise.resolve();
    let heardHistoryPending = 0;

    function heardSenderAllowed(request, sender) {
        try {
            const source = new URL(sender && sender.url || '');
            const ownPage = new URL(chrome.runtime.getURL('heard.html'));
            if (source.protocol === ownPage.protocol && source.host === ownPage.host && source.pathname === ownPage.pathname) return true;
            return source.protocol === 'https:' && source.hostname === 'soundcloud.com' &&
                sender && sender.tab && ['lookup', 'put'].indexOf(request.op) >= 0;
        } catch (e) { return false; }
    }

    function getHeardHistoryModule() {
        try {
            if (typeof FreshDigHeardHistory !== 'undefined' && FreshDigHeardHistory) return FreshDigHeardHistory;
        } catch (e) {}
        return null;
    }

    function getHeardHistoryStore() {
        const api = getHeardHistoryModule();
        if (!api || typeof api.createStore !== 'function') return null;
        if (!heardHistoryStore) heardHistoryStore = api.createStore();
        return heardHistoryStore;
    }

    async function doHeardHistory(req) {
        const store = getHeardHistoryStore();
        if (!store || typeof store.request !== 'function') return { ok: false, reason: 'unavailable' };
        return store.request(req || {});
    }

    function broadcastHeardHistoryChanged() {
        if (!chrome.tabs || typeof chrome.tabs.query !== 'function') return;
        try {
            chrome.tabs.query({ url: '*://*.soundcloud.com/*' }, function (tabs) {
                (Array.isArray(tabs) ? tabs : []).forEach(function (tab) {
                    if (!tab || !tab.id || typeof chrome.tabs.sendMessage !== 'function') return;
                    try {
                        const maybePromise = chrome.tabs.sendMessage(tab.id, { action: 'HEARD_HISTORY_CHANGED' });
                        if (maybePromise && typeof maybePromise.catch === 'function') maybePromise.catch(function () {});
                    } catch (e) {}
                });
            });
        } catch (e) {}
    }

    if (chrome.windows && chrome.windows.onRemoved && chrome.windows.onRemoved.addListener) {
        chrome.windows.onRemoved.addListener(function (windowId) {
            if (windowId === laterWindowId) laterWindowId = null;
        });
    }

    // 3. content_bridge や popup からの要求に応答
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request && request.action === 'HEARD_HISTORY') {
            if (!heardSenderAllowed(request, sender) || heardHistoryPending >= 64) {
                sendResponse({ requestId: request.requestId, result: { ok: false, reason: heardHistoryPending >= 64 ? 'busy' : 'forbidden' } });
                return false;
            }
            heardHistoryPending++;
            // Serialize operations so a page/export cannot race a put or clear
            // and so every response reflects a transaction-complete result.
            heardHistoryChain = heardHistoryChain.then(function () {
                return doHeardHistory(request);
            }).catch(function () {
                return { ok: false, reason: 'error' };
            });
            heardHistoryChain.then(function (result) {
                heardHistoryPending--;
                if (result && result.ok && (request.op === 'put' || request.op === 'clear' || request.op === 'deleteAll')) {
                    broadcastHeardHistoryChanged();
                }
                try {
                    sendResponse({ requestId: request.requestId, result: result });
                } catch (e) {}
            });
            return true;
        }
        if (request && (request.action === 'LATER_ADD' || request.action === 'LATER_REMOVE' || request.action === 'LATER_IMPORT')) {
            laterChain = laterChain.then(function () { return doLater(request); }).catch(function (e) { return { ok: false, reason: 'error' }; });
            laterChain.then(function (res) { try { sendResponse(res); } catch (e) {} });
            return true; // 非同期レスポンス
        }
        if (request && request.action === 'OPEN_LATER_WINDOW') {
            openLaterWindow().catch(function () { return { ok: false, reason: 'error' }; }).then(function (res) { try { sendResponse(res); } catch (e) {} });
            return true;
        }
        if (request && request.action === 'GET_AUTH_TOKEN') {
            getSoundCloudAuthToken(function (token) {
                sendResponse({ token: token });
                if (token && sender && sender.tab && sender.tab.id) {
                    injectTokenToTab(sender.tab.id, token);
                }
            });
            return true; // 非同期レスポンス
        }
    });
})();
