// FreshDig recovery popup manager.
//
// This module deliberately owns only the extension-window side of recovery.
// The SoundCloud page remains the source of truth for playback state and
// actions; this manager validates the target and relays a small allow-list of
// messages to the content bridge.
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.FreshDigRecovery = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const RECOVERY_FILE = 'recovery.html';
    const DEFAULT_TIMEOUT_MS = 4000;
    const RECOVERY_WIDTH = 430;
    const RECOVERY_HEIGHT = 310;

    // Keep this list intentionally small.  In particular, do not accept an
    // arbitrary station-hook action or a token-bearing payload here.
    const ACTION_NAMES = Object.freeze([
        'play', 'prev', 'next', 'vol', 'mute', 'like', 'repost', 'follow',
        'station', 'addPl', 'dislike', 'hate', 'later', 'openLater', 'dig',
        // The page hook uses this for the recovery seek slider.  Older root
        // integrations may omit it until their RECOVERY_ACTION switch is
        // updated; keeping validation here makes the popup ready for that
        // protocol without opening an arbitrary-action channel.
        'seek'
    ]);
    const ACTION_SET = new Set(ACTION_NAMES);
    const installationCache = typeof WeakMap === 'function' ? new WeakMap() : null;

    const NO_ARGS = new Set([
        'play', 'prev', 'next', 'mute', 'like', 'follow', 'station', 'addPl',
        'dislike', 'hate', 'later', 'openLater'
    ]);

    function own(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    function isTabId(value) {
        if (typeof value === 'string' && value.trim() !== '') value = Number(value);
        return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
    }

    function normalizedTabId(value) {
        return isTabId(value) ? Number(value) : null;
    }

    function isSoundCloudUrl(value) {
        if (typeof value !== 'string' || !value) return false;
        try {
            const url = new URL(value);
            const host = url.hostname.toLowerCase();
            return url.protocol === 'https:' && (host === 'soundcloud.com' || host.endsWith('.soundcloud.com'));
        } catch (e) {
            return false;
        }
    }

    function errorWithCode(code, cause) {
        const error = new Error(code);
        error.code = code;
        if (cause) error.cause = cause;
        return error;
    }

    function readLastError(api) {
        try {
            const lastError = api && api.runtime && api.runtime.lastError;
            if (lastError) return String(lastError.message || 'chrome-error');
        } catch (e) {}
        return '';
    }

    // Chrome APIs have both callback and Promise implementations depending on
    // browser/version.  Use either one, settle exactly once, and bound waits so
    // a stale SoundCloud tab cannot leave the recovery popup hanging forever.
    function callChrome(api, owner, method, args, timeoutMs) {
        const fn = owner && owner[method];
        if (typeof fn !== 'function') return Promise.reject(errorWithCode('unavailable'));
        const waitMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
        return new Promise(function (resolve, reject) {
            let settled = false;
            let timer = null;
            const finish = function (ok, value) {
                if (settled) return;
                settled = true;
                if (timer !== null) clearTimeout(timer);
                if (ok) resolve(value); else reject(value);
            };
            const callback = function (value) {
                const message = readLastError(api);
                if (message) finish(false, errorWithCode('chrome-error', new Error(message)));
                else finish(true, value);
            };

            timer = setTimeout(function () {
                finish(false, errorWithCode('timeout'));
            }, waitMs);

            try {
                const result = fn.apply(owner, (args || []).concat(callback));
                if (result && typeof result.then === 'function') {
                    result.then(function (value) {
                        const message = readLastError(api);
                        if (message) finish(false, errorWithCode('chrome-error', new Error(message)));
                        else finish(true, value);
                    }, function (error) {
                        finish(false, error || errorWithCode('chrome-error'));
                    });
                } else if (result !== undefined) {
                    // Promise-style browser shims may return a value and never
                    // invoke the callback.  Callback-based Chrome methods return
                    // undefined, so accepting a value here is unambiguous.
                    finish(true, result);
                }
            } catch (error) {
                finish(false, error || errorWithCode('chrome-error'));
            }
        });
    }

    function publicReason(error) {
        const code = error && error.code ? String(error.code) : '';
        if (code === 'timeout') return 'timeout';
        if (code === 'unavailable') return 'unavailable';
        if (code === 'tab-not-found') return 'tab-not-found';
        if (code === 'not-soundcloud') return 'not-soundcloud';
        if (code === 'invalid-tab') return 'invalid-tab';
        if (code === 'forbidden') return 'forbidden';
        if (code === 'invalid-action') return 'invalid-action';
        if (code === 'invalid-args') return 'invalid-args';
        if (code === 'chrome-error') return 'chrome-error';
        return 'error';
    }

    function recoveryBaseUrl(api) {
        try {
            if (api && api.runtime && typeof api.runtime.getURL === 'function') {
                return String(api.runtime.getURL(RECOVERY_FILE));
            }
        } catch (e) {}
        return RECOVERY_FILE;
    }

    function recoveryUrl(api, tabId) {
        return recoveryBaseUrl(api) + '?tabId=' + encodeURIComponent(String(tabId));
    }

    function sameRecoveryDocument(api, value) {
        if (typeof value !== 'string' || !value) return false;
        try {
            const actual = new URL(value);
            const expected = new URL(recoveryBaseUrl(api));
            // URL.origin is "null" for extension schemes in some runtimes;
            // compare the scheme and host explicitly so another extension
            // cannot impersonate recovery.html.
            return actual.protocol === expected.protocol && actual.hostname === expected.hostname && actual.pathname === expected.pathname;
        } catch (e) {
            return false;
        }
    }

    function recoveryTargetFromUrl(api, value) {
        if (!sameRecoveryDocument(api, value)) return null;
        try {
            const parsed = new URL(value);
            const id = parsed.searchParams.get('tabId');
            return normalizedTabId(id);
        } catch (e) {
            return null;
        }
    }

    function copyPlainObject(value) {
        if (value === undefined || value === null) return {};
        if (typeof value !== 'object' || Array.isArray(value)) return null;
        let proto;
        try { proto = Object.getPrototypeOf(value); } catch (e) { return null; }
        // Structured-clone messages normally arrive with this realm's
        // Object.prototype, while VM/browser tests may hand us an object from
        // another realm.  The tag check preserves the plain-record restriction
        // without rejecting that safe cross-realm shape.
        if (proto !== null && Object.prototype.toString.call(value) !== '[object Object]') return null;
        const output = Object.create(null);
        try {
            Object.keys(value).forEach(function (key) {
                output[key] = value[key];
            });
        } catch (e) {
            return null;
        }
        return output;
    }

    function validateActionArgs(name, args) {
        const copied = copyPlainObject(args);
        if (!copied) return null;
        const keys = Object.keys(copied);
        if (NO_ARGS.has(name)) return keys.length === 0 ? copied : null;
        if (name === 'vol') {
            if (keys.length !== 1 || keys[0] !== 'v' || typeof copied.v !== 'number' || !Number.isFinite(copied.v) || copied.v < 0 || copied.v > 1) return null;
            return { v: copied.v };
        }
        if (name === 'seek') {
            if (keys.length !== 1 || keys[0] !== 'ratio' || typeof copied.ratio !== 'number' || !Number.isFinite(copied.ratio) || copied.ratio < 0 || copied.ratio > 1) return null;
            return { ratio: copied.ratio };
        }
        if (name === 'repost') {
            if (keys.length === 0) return copied;
            if (keys.length !== 1 || keys[0] !== 'unrepost' || typeof copied.unrepost !== 'boolean') return null;
            return { unrepost: copied.unrepost };
        }
        if (name === 'dig') {
            if (keys.length === 0) return copied;
            if (keys.length === 1 && keys[0] === 'enabled' && typeof copied.enabled === 'boolean') return { enabled: copied.enabled };
            return null;
        }
        return null;
    }

    function install(chromeApi) {
        const api = chromeApi;
        if (installationCache && api && (typeof api === 'object' || typeof api === 'function')) {
            const previous = installationCache.get(api);
            if (previous) return previous;
        }
        if (!api || !api.runtime || !api.runtime.onMessage || typeof api.runtime.onMessage.addListener !== 'function') {
            return { installed: false, handleMessage: function () { return false; } };
        }

        let armInFlight = new Map();

        function send(response, sendResponse) {
            if (typeof sendResponse !== 'function') return;
            try { sendResponse(response); } catch (e) {}
        }

        async function findExistingWindow(tabId) {
            if (!api.windows || typeof api.windows.getAll !== 'function') throw errorWithCode('unavailable');
            const windows = await callChrome(api, api.windows, 'getAll', [{ populate: true }]);
            const all = Array.isArray(windows) ? windows : [];
            for (let i = 0; i < all.length; i += 1) {
                const tabs = all[i] && Array.isArray(all[i].tabs) ? all[i].tabs : [];
                for (let j = 0; j < tabs.length; j += 1) {
                    if (recoveryTargetFromUrl(api, tabs[j] && tabs[j].url) === tabId) return all[i];
                }
            }
            return null;
        }

        async function armRecovery(tabId) {
            if (!api.windows || typeof api.windows.create !== 'function') throw errorWithCode('unavailable');
            const existing = await findExistingWindow(tabId);
            if (existing && existing.id !== undefined) return { ok: true };
            const created = await callChrome(api, api.windows, 'create', [{
                url: recoveryUrl(api, tabId),
                type: 'popup',
                width: RECOVERY_WIDTH,
                height: RECOVERY_HEIGHT,
                // The fallback should not steal focus from the page the user is
                // listening to.  Browsers may still choose to focus a new
                // window, but this is the non-interrupting preference.
                focused: false
            }]);
            if (!created || created.id === undefined) throw errorWithCode('chrome-error');
            return { ok: true };
        }

        function arm(tabId) {
            const key = String(tabId);
            if (armInFlight.has(key)) return armInFlight.get(key);
            const work = armRecovery(tabId).catch(function (error) {
                return { ok: false, reason: publicReason(error) };
            }).finally(function () {
                armInFlight.delete(key);
            });
            armInFlight.set(key, work);
            return work;
        }

        function extensionSenderAllowed(sender) {
            if (!sender || typeof sender.url !== 'string') return false;
            return sameRecoveryDocument(api, sender.url);
        }

        async function getSoundCloudTab(tabId) {
            if (!api.tabs || typeof api.tabs.get !== 'function') throw errorWithCode('unavailable');
            let tab;
            try {
                tab = await callChrome(api, api.tabs, 'get', [tabId]);
            } catch (error) {
                throw errorWithCode('tab-not-found', error);
            }
            if (!tab || !isSoundCloudUrl(tab.url)) throw errorWithCode('not-soundcloud');
            return tab;
        }

        async function relaySnapshot(tabId) {
            await getSoundCloudTab(tabId);
            if (!api.tabs || typeof api.tabs.sendMessage !== 'function') throw errorWithCode('unavailable');
            return callChrome(api, api.tabs, 'sendMessage', [tabId, {
                target: 'SC_FRESH_STATION',
                action: 'RECOVERY_SNAPSHOT'
            }]);
        }

        async function relayAction(tabId, name, args) {
            await getSoundCloudTab(tabId);
            if (!ACTION_SET.has(name)) throw errorWithCode('invalid-action');
            const safeArgs = validateActionArgs(name, args);
            if (!safeArgs) throw errorWithCode('invalid-args');
            if (!api.tabs || typeof api.tabs.sendMessage !== 'function') throw errorWithCode('unavailable');
            // Construct a fresh message; never spread the caller's object into
            // the station protocol, which prevents an injected token/action
            // field from crossing the extension boundary.
            return callChrome(api, api.tabs, 'sendMessage', [tabId, {
                target: 'SC_FRESH_STATION',
                action: 'RECOVERY_ACTION',
                name: name,
                args: safeArgs
            }]);
        }

        function handleMessage(request, sender, sendResponse) {
            if (!request || typeof request.action !== 'string') return false;

            if (request.action === 'ARM_RECOVERY_PLAYER') {
                const senderTab = sender && sender.tab;
                const tabId = senderTab && normalizedTabId(senderTab.id);
                if (tabId === null || !isSoundCloudUrl(senderTab && senderTab.url)) {
                    send({ ok: false, reason: 'forbidden' }, sendResponse);
                    return false;
                }
                arm(tabId).then(function (response) { send(response, sendResponse); }, function () { send({ ok: false, reason: 'error' }, sendResponse); });
                return true;
            }

            if (request.action !== 'GET_RECOVERY_SNAPSHOT' && request.action !== 'RUN_RECOVERY_ACTION') return false;
            if (!extensionSenderAllowed(sender)) {
                send({ ok: false, reason: 'forbidden' }, sendResponse);
                return false;
            }
            const tabId = normalizedTabId(request.tabId);
            if (tabId === null) {
                send({ ok: false, reason: 'invalid-tab' }, sendResponse);
                return false;
            }

            const work = request.action === 'GET_RECOVERY_SNAPSHOT'
                ? relaySnapshot(tabId)
                : relayAction(tabId, request.name, request.args);
            work.then(function (response) {
                // The page ACK is returned unchanged so recovery.js can consume
                // the same { success, data, language, ... } contract as the
                // content bridge.  Validation failures stay extension-owned.
                send(response, sendResponse);
            }, function (error) {
                send({ ok: false, reason: publicReason(error) }, sendResponse);
            });
            return true;
        }

        api.runtime.onMessage.addListener(handleMessage);
        const result = {
            installed: true,
            handleMessage: handleMessage,
            actionNames: ACTION_NAMES.slice()
        };
        if (installationCache && api && (typeof api === 'object' || typeof api === 'function')) installationCache.set(api, result);
        return result;
    }

    return {
        ACTION_NAMES: ACTION_NAMES.slice(),
        DEFAULT_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
        isSoundCloudUrl: isSoundCloudUrl,
        validateActionArgs: validateActionArgs,
        install: install
    };
});
