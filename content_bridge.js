// Bridge between popup.js, chrome.storage.local and MAIN world station_hook.js
(function () {
    'use strict';

    function sendStoredSettingsToMainWorld() {
        if (!chrome.storage || !chrome.storage.local) return;
        chrome.storage.local.get(['targetPlaylistId', 'playbackMode'], function (items) {
            if (chrome.runtime.lastError || !items) return;
            window.postMessage({
                type: 'SC_FRESH_STATION_RESTORE_STORAGE',
                data: items
            }, '*');
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
                    }, '*');
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
        if (!event.data) return;

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
            if (key && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ [key]: val }, function () {
                    if (chrome.runtime.lastError) {
                        console.warn('[SC-FreshStation] Storage save error:', chrome.runtime.lastError);
                    } else {
                        console.log('[SC-FreshStation] Synced to extension storage:', key, val);
                    }
                });
            }
        }
    });

    // 3. Relay messages from popup to window (MAIN world)
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.target === 'SC_FRESH_STATION') {
            window.postMessage({
                type: 'SC_FRESH_STATION_POPUP_ACTION',
                action: request.action,
                targetType: request.targetType,
                targetId: request.targetId,
                mode: request.mode,
                token: request.token
            }, '*');

            // Wait for response from window
            const handler = function (event) {
                if (event.data && (event.data.type === 'SC_FRESH_STATION_DATA_RESPONSE' || event.data.type === 'SC_FRESH_STATION_ACTION_RESULT')) {
                    window.removeEventListener('message', handler);
                    sendResponse(event.data.data || event.data.result);
                }
            };
            window.addEventListener('message', handler);
            return true; // async sendResponse
        }
    });
})();
