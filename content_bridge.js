// Bridge between popup.js, chrome.storage.local and MAIN world station_hook.js
(function () {
    'use strict';

    // MAIN world から chrome.storage.local へ書き込みを許可するキー（それ以外は無視）
    const SYNCABLE_KEYS = ['targetPlaylistId', 'playbackMode', 'discoveryEnabled', 'autoMiniPlayer', 'preferredLanguage', 'freshFilter', 'heardSkipEnabled', 'digSkipRules'];

    // MAIN world へ渡す（読み出し）キー。書き込みを許すのは SYNCABLE_KEYS だけ
    const READ_KEYS = SYNCABLE_KEYS.concat(['laterArtists']);

    // 応答待ちのタイムアウト（エクスポート等の長い処理も考慮）
    const RESPONSE_TIMEOUT_MS = 60000;

    let requestSeq = 0;
    const pendingResponses = new Map(); // requestId -> { sendResponse, timer }

    function sendStoredSettingsToMainWorld() {
        if (!chrome.storage || !chrome.storage.local) return;
        chrome.storage.local.get(READ_KEYS, function (items) {
            if (chrome.runtime.lastError || !items) return;
            window.postMessage({
                type: 'SC_FRESH_STATION_RESTORE_STORAGE',
                data: items
            }, window.location.origin);
        });
    }

    function requestAndInjectAuthToken() {
        try {
            chrome.runtime.sendMessage({ action: 'GET_AUTH_TOKEN' }, function (res) {
                if (chrome.runtime.lastError) return;
                if (res && res.token) {
                    window.postMessage({
                        type: 'SC_FRESH_STATION_POPUP_ACTION',
                        action: 'INJECT_AUTH_TOKEN',
                        token: res.token
                    }, window.location.origin);
                    console.log('[SC-FreshStation] Auto-injected auth token from background service worker');
                }
            });
        } catch (e) {}
    }

    // 1. Initial storage & auth token sync to MAIN world
    sendStoredSettingsToMainWorld();
    requestAndInjectAuthToken();
    setTimeout(sendStoredSettingsToMainWorld, 1000);
    setTimeout(requestAndInjectAuthToken, 1200);
    setTimeout(sendStoredSettingsToMainWorld, 3000);
    setTimeout(requestAndInjectAuthToken, 3200);

    // 2. Listen for messages from MAIN world
    window.addEventListener('message', function (event) {
        // 同一ウィンドウ（MAIN world）以外（iframe等）からのメッセージは受け付けない
        if (event.source !== window || !event.data) return;

        // Request storage from MAIN world
        if (event.data.type === 'SC_FRESH_STATION_REQUEST_STORAGE') {
            sendStoredSettingsToMainWorld();
        }

        // Request auth token from MAIN world
        if (event.data.type === 'SC_FRESH_STATION_REQUEST_AUTH') {
            requestAndInjectAuthToken();
        }

        // Save data to extension storage (chrome.storage.local)
        if (event.data.type === 'SC_FRESH_STATION_SYNC_STORAGE') {
            const key = event.data.key;
            const val = event.data.value;
            if (SYNCABLE_KEYS.indexOf(key) !== -1 && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ [key]: val }, function () {
                    if (chrome.runtime.lastError) {
                        console.warn('[SC-FreshStation] Storage save error:', chrome.runtime.lastError);
                    } else {
                        console.log('[SC-FreshStation] Synced to extension storage:', key, val);
                    }
                });
            }
        }

        // 後で聴く作者の追加・削除（実際の保存は background.js の 1 か所）
        if (event.data.type === 'SC_FRESH_STATION_LATER_OP') {
            const opName = event.data.op;
            const op = opName === 'remove' ? 'LATER_REMOVE'
                : opName === 'add' ? 'LATER_ADD'
                : opName === 'openList' ? 'OPEN_LATER_WINDOW'
                : null;
            const reqId = event.data.reqId;
            const reply = function (result) {
                window.postMessage({ type: 'SC_FRESH_STATION_LATER_RESULT', reqId: reqId, result: result }, window.location.origin);
            };
            if (!op) {
                reply({ ok: false, reason: 'unknown' });
                return;
            }
            try {
                let replied = false;
                const replyOnce = function (result) {
                    if (replied) return;
                    replied = true;
                    reply(result);
                };
                const request = { action: op };
                if (op === 'LATER_ADD') request.item = event.data.item;
                if (op === 'LATER_REMOVE') request.artistId = event.data.artistId;
                const maybePromise = chrome.runtime.sendMessage(request, function (res) {
                    if (chrome.runtime.lastError) { replyOnce({ ok: false, reason: 'error' }); return; }
                    replyOnce(res || { ok: false, reason: 'error' });
                });
                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then(function (res) { replyOnce(res || { ok: false, reason: 'error' }); }, function () { replyOnce({ ok: false, reason: 'error' }); });
                }
            } catch (e) { reply({ ok: false, reason: 'error' }); }
        }

        // Response from MAIN world for a relayed popup action (matched by requestId)
        if (event.data.type === 'SC_FRESH_STATION_DATA_RESPONSE' || event.data.type === 'SC_FRESH_STATION_ACTION_RESULT') {
            const pending = pendingResponses.get(event.data.requestId);
            if (!pending) return;
            pendingResponses.delete(event.data.requestId);
            clearTimeout(pending.timer);
            try {
                pending.sendResponse(event.data.data !== undefined ? event.data.data : event.data.result);
            } catch (e) {}
        }
    });

    // 後で聴く作者が変わったら（どのタブ・ポップアップからでも）MAIN world へ知らせる
    try {
        chrome.storage.onChanged.addListener(function (changes, area) {
            if (area !== 'local') return;
            if (changes.laterArtists) {
                window.postMessage({ type: 'SC_FRESH_STATION_LATER_CHANGED', list: changes.laterArtists.newValue || [] }, window.location.origin);
            }
            const settings = {};
            SYNCABLE_KEYS.forEach(function (key) {
                if (changes[key]) settings[key] = changes[key].newValue;
            });
            if (Object.keys(settings).length) {
                window.postMessage({ type: 'SC_FRESH_STATION_RESTORE_STORAGE', data: settings }, window.location.origin);
            }
        });
    } catch (e) {}

    // 3. Relay messages from popup / background to window (MAIN world)
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (!request || request.target !== 'SC_FRESH_STATION') return;

        const requestId = 'req_' + Date.now() + '_' + (++requestSeq);

        // 全プロパティをそのまま転送（新パラメータ追加時の中継漏れを防止）
        const payload = Object.assign({}, request, {
            type: 'SC_FRESH_STATION_POPUP_ACTION',
            requestId: requestId
        });
        delete payload.target;

        const timer = setTimeout(function () {
            if (!pendingResponses.has(requestId)) return;
            pendingResponses.delete(requestId);
            try { sendResponse(undefined); } catch (e) {}
        }, RESPONSE_TIMEOUT_MS);
        pendingResponses.set(requestId, { sendResponse: sendResponse, timer: timer });

        window.postMessage(payload, window.location.origin);
        return true; // async sendResponse
    });
})();
