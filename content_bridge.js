// Bridge between popup.js and MAIN world station_hook.js
(function () {
    'use strict';

    // Relay messages from popup to window (MAIN world)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
            const handler = (event) => {
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
