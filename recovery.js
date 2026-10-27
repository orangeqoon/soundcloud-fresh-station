// UI for the extension-owned recovery window.
//
// The page is intentionally independent of the SoundCloud document.  It polls
// the target tab through recovery_window.js and therefore remains open while
// that tab is reloading.  It never retries a mutation automatically.
(function (root, factory) {
    const expose = function () {
        const api = factory();
        // Keep the object API (`FreshDigRecoveryUI.create(...)`) while also
        // allowing a tiny CommonJS harness to call the export directly.
        const callable = function (options) { return api.create(options); };
        Object.keys(api).forEach(function (key) { callable[key] = api[key]; });
        return callable;
    };
    if (typeof module === 'object' && module.exports) {
        module.exports = expose();
    } else {
        root.FreshDigRecoveryUI = expose();
        if (root.document) {
            const start = function () {
                try {
                    root.__freshDigRecoveryUI = root.FreshDigRecoveryUI.create({
                        window: root,
                        document: root.document,
                        chrome: root.chrome,
                        i18n: root.FreshDigI18n
                    });
                    root.__freshDigRecoveryUI.start();
                } catch (e) {
                    // A partially constructed extension page should not create
                    // an unhandled rejection or prevent the browser window from
                    // closing normally.
                    try { root.console && root.console.warn('[SC-FreshStation] Recovery UI unavailable'); } catch (ignored) {}
                }
            };
            if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
            else start();
        }
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const LANGUAGES = ['ja', 'en', 'de', 'ru', 'vi', 'es'];
    const POLL_INTERVAL_MS = 1000;
    const REQUEST_TIMEOUT_MS = 3000;
    const ACTION_NAMES = [
        'station', 'later', 'openLater', 'hate',
        'prev', 'play', 'dislike', 'like', 'repost', 'addPl', 'follow', 'dig',
        'mute', 'vol', 'seek'
    ];

    // This text is intentionally local to the recovery window: i18n.js is a
    // bundled dictionary, while this short explanation describes the fallback
    // itself and should not be added to the shared product dictionary merely
    // for a recovery edge case.
    const FALLBACK_NOTE = Object.freeze({
        ja: '再読み込み後に操作を再接続します。この小窓は最前面固定ではありません。PiPはSoundCloud側のボタンから開けます。',
        en: 'Controls reconnect after reload. This window is not always on top. Open PiP from the SoundCloud page button.',
        de: 'Die Steuerung verbindet sich nach dem Neuladen erneut. Dieses Fenster bleibt nicht im Vordergrund. PiP auf der SoundCloud-Seite öffnen.',
        ru: 'Управление подключится после перезагрузки. Окно не закреплено поверх других. Откройте PiP кнопкой на SoundCloud.',
        vi: 'Điều khiển kết nối lại sau khi tải lại. Cửa sổ này không luôn ở trên cùng. Mở PiP bằng nút trên SoundCloud.',
        es: 'Los controles se reconectan tras recargar. Esta ventana no queda siempre encima. Abre PiP desde el botón de SoundCloud.'
    });

    const FALLBACK_TEXT = Object.freeze({
        appName: 'FreshDig', connecting: '🔄 Connecting Account...', loadingSC: 'Loading SoundCloud...',
        mpTitle: 'FreshDig - Discovery Mini Player', mpLoadingTrack: 'Loading track...',
        mpStatusWaiting: 'Standby', mpStatusDigging: 'Digging', mpStationBtn: '📡 Station',
        mpStationBtnTitle: 'Start station from this track', mpLaterListLabel: '🧐 Saved artists',
        mpPrevTitle: 'Previous track', mpPlayTitle: 'Play / Pause', mpNextTitle: 'Next track',
        mpLikeTitle: 'Like', mpRepostTitle: 'Repost', mpAddPlTitle: 'Add to playlist',
        mpDislikeTitle: '⏭️ Add this track to NoPlay and skip', mpHateTitle: '🤬 Exclude artist & skip',
        mpFollowBtnTitle: 'Follow artist', volMute: 'Toggle Mute', volSliderTitle: 'Volume',
        mpStatusToggleOff: 'Turn Discovery OFF', mpStatusToggleOn: 'Turn Discovery ON',
        m_stOff: '⏸ Dig OFF', m_stOn: '⛏️ Dig ON', m_repostedTip: 'Reposted (click to remove)',
        m_repostTip: 'Repost', m_followingLbl: '👤✓ Following', m_hateOnTip: '🤬 Excluded (click to remove)',
        m_laterAddTip: '🧐 Listen later (save this artist)', m_laterRemoveTip: '🧐 Saved (click to remove)'
    });

    function own(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    function finiteNumber(value, fallback) {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }

    function clamp(value, min, max, fallback) {
        const n = finiteNumber(value, fallback);
        return Math.min(max, Math.max(min, n));
    }

    function bool(value, fallback) {
        return typeof value === 'boolean' ? value : fallback;
    }

    function validTabId(value) {
        if (typeof value === 'string' && value.trim() !== '') value = Number(value);
        return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
    }

    function languageCode(i18n, value, win) {
        const requested = typeof value === 'string' ? value : 'auto';
        if (LANGUAGES.indexOf(requested) !== -1) return requested;
        if (i18n && typeof i18n.resolveLanguage === 'function') {
            try {
                const resolved = i18n.resolveLanguage(requested);
                if (LANGUAGES.indexOf(resolved) !== -1) return resolved;
            } catch (e) {}
        }
        const nav = win && win.navigator && (win.navigator.language || win.navigator.userLanguage);
        const lower = String(nav || 'en').toLowerCase();
        for (let i = 0; i < LANGUAGES.length; i += 1) {
            if (lower.indexOf(LANGUAGES[i]) === 0) return LANGUAGES[i];
        }
        return 'en';
    }

    function safeText(value, fallback) {
        if (value === undefined || value === null) return fallback || '';
        return String(value);
    }

    function create(options) {
        options = options || {};
        const win = options.window || (typeof window !== 'undefined' ? window : globalThis);
        const doc = options.document || (win && win.document);
        const chromeApi = options.chrome || (win && win.chrome);
        const i18n = options.i18n || (win && win.FreshDigI18n);
        const setTimer = options.setTimeout || (win && win.setTimeout) || setTimeout;
        const clearTimer = options.clearTimeout || (win && win.clearTimeout) || clearTimeout;
        const state = {
            tabId: null,
            language: 'en',
            tx: Object.assign({}, FALLBACK_TEXT),
            snapshot: null,
            connected: false,
            stale: true,
            started: false,
            stopped: false,
            pollInFlight: false,
            actionInFlight: false,
            pollTimer: null,
            lastError: null
        };

        function element(id) {
            try { return doc && typeof doc.getElementById === 'function' ? doc.getElementById(id) : null; } catch (e) { return null; }
        }

        function setText(id, value) {
            const node = element(id);
            if (node) node.textContent = safeText(value, '');
            return node;
        }

        function setAttr(id, name, value) {
            const node = element(id);
            if (node && typeof node.setAttribute === 'function') node.setAttribute(name, safeText(value, ''));
            return node;
        }

        function toggleClass(node, name, active) {
            if (!node || !node.classList || typeof node.classList.toggle !== 'function') return;
            node.classList.toggle(name, !!active);
        }

        function getTexts(language) {
            const code = languageCode(i18n, language, win);
            let texts = null;
            if (i18n && typeof i18n.getTexts === 'function') {
                try { texts = i18n.getTexts(code); } catch (e) {}
            }
            state.language = code;
            state.tx = Object.assign({}, FALLBACK_TEXT, texts || {});
            return state.tx;
        }

        function statusText(value) {
            setText('recovery-status', value);
        }

        function setStale(stale, error) {
            state.stale = !!stale;
            state.connected = !state.stale;
            state.lastError = error || null;
            if (doc && doc.body) toggleClass(doc.body, 'stale', state.stale);
            const controls = doc && typeof doc.querySelectorAll === 'function'
                ? doc.querySelectorAll('[data-recovery-action], #recovery-seek, #recovery-volume') : [];
            for (let i = 0; i < controls.length; i += 1) controls[i].disabled = state.stale || state.actionInFlight;
            if (state.stale) statusText(state.tx.connecting || state.tx.loadingSC);
        }

        function setActionDisabled(disabled) {
            const controls = doc && typeof doc.querySelectorAll === 'function'
                ? doc.querySelectorAll('[data-recovery-action], #recovery-seek, #recovery-volume') : [];
            for (let i = 0; i < controls.length; i += 1) controls[i].disabled = !!disabled || state.stale;
        }

        function renderLabels() {
            const tx = state.tx;
            if (doc && doc.documentElement) doc.documentElement.lang = state.language;
            setText('recovery-heading', tx.mpTitle || tx.appName);
            setText('recovery-fallback', FALLBACK_NOTE[state.language] || FALLBACK_NOTE.en);
            const station = setText('recovery-station', tx.mpStationBtn);
            if (station) setAttr('recovery-station', 'title', tx.mpStationBtnTitle);
            const later = setText('recovery-later', '🧐');
            if (later) setAttr('recovery-later', 'title', tx.m_laterAddTip);
            setText('recovery-later-list', tx.mpLaterListLabel);
            setAttr('recovery-later-list', 'title', tx.mpLaterListLabel);
            setAttr('recovery-hate', 'title', tx.mpHateTitle);
            setText('recovery-prev', '⏮');
            setAttr('recovery-prev', 'title', tx.mpPrevTitle);
            setText('recovery-play', state.snapshot && state.snapshot.playing ? '⏸' : '▶');
            setAttr('recovery-play', 'title', tx.mpPlayTitle);
            setText('recovery-dislike', '⏭️');
            setAttr('recovery-dislike', 'title', tx.mpDislikeTitle);
            setText('recovery-like', state.snapshot && state.snapshot.liked ? '❤️' : '🤍');
            setAttr('recovery-like', 'title', tx.mpLikeTitle);
            setText('recovery-repost', '🔁');
            setAttr('recovery-repost', 'title', state.snapshot && state.snapshot.reposted ? tx.m_repostedTip : tx.m_repostTip);
            setText('recovery-add-pl', '➕');
            setAttr('recovery-add-pl', 'title', tx.mpAddPlTitle);
            setText('recovery-follow', '👤');
            setAttr('recovery-follow', 'title', tx.mpFollowBtnTitle);
            setAttr('recovery-seek', 'aria-label', tx.mpPlayTitle);
            setAttr('recovery-volume', 'aria-label', tx.volSliderTitle);
            setAttr('recovery-mute', 'aria-label', tx.volMute);
            setText('recovery-dig', state.snapshot && state.snapshot.discoveryEnabled === false ? tx.m_stOff : tx.m_stOn);
            setAttr('recovery-dig', 'title', state.snapshot && state.snapshot.discoveryEnabled === false ? tx.mpStatusToggleOn : tx.mpStatusToggleOff);
            toggleClass(element('recovery-dig'), 'off', state.snapshot && state.snapshot.discoveryEnabled === false);
        }

        function renderSnapshot(ack) {
            if (!ack || ack.success !== true || !ack.data || typeof ack.data !== 'object') return false;
            const next = ack.data;
            state.snapshot = {
                title: safeText(next.title, state.tx.mpLoadingTrack),
                artist: safeText(next.artist, ''),
                art: safeText(next.art, ''),
                playing: bool(next.playing, false),
                liked: bool(next.liked, false),
                reposted: bool(next.reposted, false),
                following: typeof next.following === 'boolean' ? next.following : null,
                passed: safeText(next.passed, '0:00'),
                duration: safeText(next.duration, '0:00'),
                ratio: clamp(next.ratio, 0, 1, 0),
                hated: bool(next.hated, false),
                later: bool(next.later, false),
                vol: clamp(next.vol, 0, 1, .8),
                discoveryEnabled: typeof ack.discoveryEnabled === 'boolean' ? ack.discoveryEnabled : true
            };
            if (ack.language !== undefined) getTexts(ack.language);
            const snap = state.snapshot;
            setText('recovery-title', snap.title);
            setText('recovery-artist', snap.artist);
            const art = element('recovery-art');
            if (art) {
                // Assign the URL through the DOM property, never through HTML
                // or CSS interpolation.  Reject non-network schemes.
                let artUrl = '';
                try {
                    const parsed = new URL(snap.art, (win && win.location && win.location.href) || 'https://soundcloud.com/');
                    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') artUrl = parsed.href;
                } catch (e) {}
                if (artUrl) {
                    art.src = artUrl;
                    art.style.display = '';
                } else {
                    try { art.removeAttribute('src'); } catch (e) { art.src = ''; }
                    art.style.display = 'none';
                }
            }
            setText('recovery-passed', snap.passed);
            setText('recovery-duration', snap.duration);
            const seek = element('recovery-seek');
            if (seek && !state.actionInFlight) seek.value = String(snap.ratio * 100);
            const volume = element('recovery-volume');
            if (volume && !state.actionInFlight) volume.value = String(Math.round(snap.vol * 100));
            setText('recovery-volume-value', Math.round(snap.vol * 100) + '%');
            toggleClass(element('recovery-hate'), 'active', snap.hated);
            toggleClass(element('recovery-later'), 'active', snap.later);
            toggleClass(element('recovery-like'), 'active', snap.liked);
            toggleClass(element('recovery-repost'), 'active', snap.reposted);
            toggleClass(element('recovery-follow'), 'active', snap.following === true);
            const tx = state.tx;
            setText('recovery-play', snap.playing ? '⏸' : '▶');
            setText('recovery-like', snap.liked ? '❤️' : '🤍');
            setAttr('recovery-repost', 'title', snap.reposted ? tx.m_repostedTip : tx.m_repostTip);
            setAttr('recovery-follow', 'title', snap.following ? tx.m_followingLbl : tx.mpFollowBtnTitle);
            setAttr('recovery-hate', 'title', snap.hated ? tx.m_hateOnTip : tx.mpHateTitle);
            setAttr('recovery-later', 'title', snap.later ? tx.m_laterRemoveTip : tx.m_laterAddTip);
            renderLabels();
            return true;
        }

        function runtimeSend(message, timeoutMs) {
            return new Promise(function (resolve, reject) {
                if (!chromeApi || !chromeApi.runtime || typeof chromeApi.runtime.sendMessage !== 'function') {
                    reject(new Error('unavailable'));
                    return;
                }
                const waitMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : REQUEST_TIMEOUT_MS;
                let settled = false;
                let timer = setTimer(function () {
                    if (settled) return;
                    settled = true;
                    reject(new Error('timeout'));
                }, waitMs);
                const finish = function (ok, value) {
                    if (settled) return;
                    settled = true;
                    clearTimer(timer);
                    if (ok) resolve(value); else reject(value);
                };
                const callback = function (response) {
                    try {
                        const lastError = chromeApi.runtime && chromeApi.runtime.lastError;
                        if (lastError) finish(false, new Error('chrome-error'));
                        else finish(true, response);
                    } catch (e) {
                        finish(false, new Error('chrome-error'));
                    }
                };
                try {
                    const result = chromeApi.runtime.sendMessage(message, callback);
                    if (result && typeof result.then === 'function') {
                        result.then(function (value) { finish(true, value); }, function () { finish(false, new Error('chrome-error')); });
                    } else if (result !== undefined) {
                        finish(true, result);
                    }
                } catch (e) {
                    finish(false, new Error('chrome-error'));
                }
            });
        }

        function parseTargetId() {
            try {
                const search = win && win.location ? win.location.search : '';
                const params = new URLSearchParams(search || '');
                return validTabId(params.get('tabId'));
            } catch (e) {
                return null;
            }
        }

        function extractAck(response) {
            if (response && response.result && response.result.success === true && !response.success) return response.result;
            return response;
        }

        async function poll() {
            if (state.stopped || state.pollInFlight || state.tabId === null) return false;
            state.pollInFlight = true;
            try {
                const response = extractAck(await runtimeSend({ action: 'GET_RECOVERY_SNAPSHOT', tabId: state.tabId }, REQUEST_TIMEOUT_MS));
                if (response && response.ok === false) throw new Error('reconnect');
                if (!renderSnapshot(response)) throw new Error('reconnect');
                setStale(false);
                statusText(state.tx.connectedReady || state.tx.mpStatusWaiting);
                return true;
            } catch (error) {
                setStale(true, error);
                return false;
            } finally {
                state.pollInFlight = false;
                schedulePoll();
            }
        }

        function schedulePoll() {
            if (state.stopped || state.pollTimer !== null) return;
            state.pollTimer = setTimer(function () {
                state.pollTimer = null;
                // poll() handles its own errors; this catch is an additional
                // guard for unusual test/browser Promise implementations.
                Promise.resolve(poll()).catch(function () {});
            }, POLL_INTERVAL_MS);
        }

        function actionArgs(name) {
            if (!state.snapshot) return {};
            if (name === 'repost') return { unrepost: !!state.snapshot.reposted };
            return {};
        }

        async function runAction(name, args) {
            if (state.stopped || state.tabId === null || state.stale || state.actionInFlight) return { ok: false, reason: 'stale' };
            if (ACTION_NAMES.indexOf(name) === -1) return { ok: false, reason: 'invalid-action' };
            state.actionInFlight = true;
            setActionDisabled(true);
            try {
                const response = extractAck(await runtimeSend({
                    action: 'RUN_RECOVERY_ACTION',
                    tabId: state.tabId,
                    name: name,
                    args: args === undefined ? actionArgs(name) : args
                }, REQUEST_TIMEOUT_MS));
                if (response && response.ok === false) throw new Error('action-failed');
                if (response && response.success === false) throw new Error('action-failed');
                if (response && response.success === true && response.data) renderSnapshot(response);
                return response || { success: true };
            } catch (error) {
                // Mutations are never retried automatically.  A later poll will
                // reconcile the display with the page after a transient reload.
                state.lastError = error;
                setStale(true, error);
                return { ok: false, reason: 'error' };
            } finally {
                state.actionInFlight = false;
                setActionDisabled(state.stale);
                schedulePoll();
            }
        }

        function bind() {
            if (!doc || typeof doc.querySelectorAll !== 'function') return;
            const controls = doc.querySelectorAll('[data-recovery-action]');
            for (let i = 0; i < controls.length; i += 1) {
                const control = controls[i];
                if (String(control.tagName || '').toUpperCase() !== 'BUTTON') continue;
                control.addEventListener('click', function () {
                    const name = control.getAttribute('data-recovery-action');
                    const args = name === 'repost' ? actionArgs(name) : undefined;
                    Promise.resolve(runAction(name, args)).catch(function () {});
                });
            }
            const seek = element('recovery-seek');
            if (seek) {
                seek.addEventListener('input', function () {
                    const ratio = clamp(Number(seek.value) / 100, 0, 1, 0);
                    const fill = ratio;
                    seek.style.setProperty('--recovery-seek-ratio', String(fill));
                });
                seek.addEventListener('change', function () {
                    const ratio = clamp(Number(seek.value) / 100, 0, 1, 0);
                    Promise.resolve(runAction('seek', { ratio: ratio })).catch(function () {});
                });
            }
            const volume = element('recovery-volume');
            if (volume) {
                volume.addEventListener('input', function () {
                    setText('recovery-volume-value', Math.round(clamp(Number(volume.value) / 100, 0, 1, .8) * 100) + '%');
                });
                volume.addEventListener('change', function () {
                    const v = clamp(Number(volume.value) / 100, 0, 1, .8);
                    Promise.resolve(runAction('vol', { v: v })).catch(function () {});
                });
            }
        }

        function start() {
            if (state.started) return api;
            state.started = true;
            state.stopped = false;
            state.tabId = parseTargetId();
            getTexts('auto');
            renderLabels();
            setStale(true);
            bind();
            if (state.tabId === null) {
                statusText(state.tx.connecting || state.tx.loadingSC);
                return api;
            }
            Promise.resolve(poll()).catch(function () {});
            return api;
        }

        function stop() {
            state.stopped = true;
            if (state.pollTimer !== null) {
                clearTimer(state.pollTimer);
                state.pollTimer = null;
            }
            return api;
        }

        const api = {
            state: state,
            start: start,
            stop: stop,
            poll: poll,
            runAction: runAction,
            renderSnapshot: renderSnapshot,
            renderLabels: renderLabels,
            runtimeSend: runtimeSend
        };
        return api;
    }

    return {
        create: create,
        FALLBACK_NOTE: Object.assign({}, FALLBACK_NOTE),
        ACTION_NAMES: ACTION_NAMES.slice(),
        POLL_INTERVAL_MS: POLL_INTERVAL_MS,
        REQUEST_TIMEOUT_MS: REQUEST_TIMEOUT_MS
    };
});
