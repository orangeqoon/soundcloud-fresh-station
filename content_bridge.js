// Bridge between popup.js, chrome.storage.local and MAIN world station_hook.js
(function () {
    'use strict';

    // MAIN world から chrome.storage.local へ書き込みを許可するキー（それ以外は無視）
    const SYNCABLE_KEYS = ['targetPlaylistId', 'playbackMode', 'discoveryEnabled'];

    // 応答待ちのタイムアウト（エクスポート等の長い処理も考慮）
    const RESPONSE_TIMEOUT_MS = 60000;

    let requestSeq = 0;
    const pendingResponses = new Map(); // requestId -> { sendResponse, timer }

    function sendStoredSettingsToMainWorld() {
        if (!chrome.storage || !chrome.storage.local) return;
        chrome.storage.local.get(SYNCABLE_KEYS, function (items) {
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
