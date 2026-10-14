// SoundCloud Fresh Station & Follower Stream
(function () {
    'use strict';

    console.log('[SC-FreshStation] Hook loaded in MAIN world (FreshDig v2.1.0)');

    const STORAGE_KEY = 'sc_fresh_station_data_v1';
    const TARGET_PLAYLIST_KEY = 'sc_fresh_station_target_playlist_id';
    const PLAYBACK_MODE_KEY = 'sc_fresh_station_playback_mode';
    const CACHE_LIKES_KEY = 'sc_fresh_station_cache_likes';
    const CACHE_FOLLOWS_KEY = 'sc_fresh_station_cache_follows';
    const CACHE_PLAYLISTS_KEY = 'sc_fresh_station_cache_playlists';
    const CACHE_CLIENT_ID_KEY = 'sc_fresh_station_client_id';
    const CACHE_OAUTH_TOKEN_KEY = 'sc_fresh_station_cache_oauth_token';

    const DISCOVERY_ENABLED_KEY = 'sc_fresh_station_discovery_enabled';
    const AUTO_MINI_PLAYER_KEY = 'sc_fresh_station_auto_miniplayer';
    const PREFERRED_LANGUAGE_KEY = 'sc_fresh_station_preferred_language';

    // 画面に出す文字を辞書(i18n.js)から取る。{name} などは vars で差し込む
    function tt(key, vars) {
        let v = getI18nTexts()[key];
        if (typeof v !== 'string') return key;
        if (vars) v = v.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] === undefined || vars[k] === null ? '' : String(vars[k]); });
        return v;
    }

    function getI18nTexts() {
        if (typeof FreshDigI18n !== 'undefined' && FreshDigI18n.getTexts) {
            return FreshDigI18n.getTexts(state.preferredLanguage);
        }
        return {
            barStationTitle: '📻 この曲のステーションを開始',
            barDislikeTitle: '⏭️ 不再生：この曲を今後は流さず、すぐ次へ（嫌いではなく「もう十分聴いた」曲に）',
            barHateTitle: '🤬 作者除外 (この作者の曲すべてを今後再生せずスキップ)',
            barMiniPlayerTitle: '🪟 ミニプレイヤー (最前面ウィンドウで浮遊操作)',
            barDiscoveryOffTitle: '🔍 発掘モード OFF（クリックで ON：知っている曲を自動スキップ）',
            barDiscoveryOnTitle: '🔍 発掘モード ON（クリックで OFF：SoundCloud 通常再生）',
            barFollowingModeTitle: '👥 フォロー新曲モード (クリックで「発掘モード」へ切替)',
            mpTitle: 'FreshDig - アーティスト発掘ミニプレイヤー',
            mpPromptOpen: '🪟 ここをクリックしてミニプレイヤーを開く',
            mpLoadingTrack: '曲を読み込み中...',
            mpStatusWaiting: '再生待機中',
            mpStatusDigging: '発掘中',
            mpFollowBtn: '👤 フォロー',
            mpFollowBtnTitle: 'アーティストをフォロー',
            mpStationBtn: '📻 ステーション',
            mpStationBtnTitle: 'この曲のステーションを開始',
            mpPrevTitle: '前の曲',
            mpPlayTitle: '再生 / 一時停止',
            mpNextTitle: '次の曲',
            mpLikeTitle: 'いいね (Like)',
            mpRepostTitle: 'リポスト (Repost)',
            mpAddPlTitle: 'プレイリストに追加',
            mpDislikeTitle: '⏭️ 不再生：この曲を今後は流さず、すぐ次へ（嫌いではなく「もう十分聴いた」曲に）',
            mpHateTitle: '作者除外 & スキップ',
            mpToastDislike: '⏭️ 不再生に登録してスキップ',
            mpToastHate: '🤬 作者を除外してスキップ',
            mpToastAddedPl: '➕ プレイリストに追加しました',
            mpToastRemovedPl: '➖ プレイリストから解除しました',
            mpToastLiked: '❤️ いいねしました',
            mpToastUnliked: '🤍 いいねを解除しました',
            mpToastReposted: '🔁 リポストしました',
            mpToastUnreposted: '↩️ リポストを解除しました',
            mpToastFollowed: '👤 フォローしました',
            mpToastUnfollowed: '👤 フォローを解除しました',
            mpStatusToggleOff: 'クリックで発掘モードを OFF（SoundCloud 通常再生）',
            mpStatusToggleOn: 'クリックで発掘モードを ON（知っている曲を自動スキップ）',
            pickerTitle: '➕ ワンクリック追加先を選択',
            pickerCancel: 'キャンセル',
            trackCountSuffix: '曲',
            skipToastPrefix: 'スキップ',
            skipReasonDisliked: '不再生の曲',
            skipReasonHated: '除外した作者',
            skipReasonGenre: '除外したジャンル',
            skipReasonOwn: '自分の曲',
            skipReasonLiked: 'ライク済み',
            skipReasonFollowing: 'フォロー中のアーティスト',
            robotBanner: 'SoundCloud のロボット確認が出ています。ページで確認を済ませてください',
            robotShort: 'ロボット確認中'
        };
    }

    // 「フォロー新曲のみ（リポスト除外）」モードは現在使わないため無効化（コードは残してある。true で復活）
    const FOLLOWING_NEW_MODE_ENABLED = false;

    function normalizePlaybackMode(mode) {
        if (mode === 'FOLLOWING_NEW' && FOLLOWING_NEW_MODE_ENABLED) return 'FOLLOWING_NEW';
        return 'DISCOVERY';
    }

    function readDiscoveryEnabled() {
        try {
            return localStorage.getItem(DISCOVERY_ENABLED_KEY) !== 'false'; // 未設定なら ON
        } catch (e) {
            return true;
        }
    }

    const MAX_STATION_EXTRA_PAGES = 5;      // ステーション補充で追加取得するページ数の上限
    const MAX_LIKES_SYNC = 20000;           // 同期するLikesの上限件数（ID のみ取得なので軽い）
    const MAX_FOLLOWINGS_SYNC = 20000;      // 同期するフォローの上限件数
    const AUTO_SYNC_COOLDOWN_MS = 60000;    // 自動同期の最短間隔（リクエスト連打防止）

    const state = {
        myUserId: null,
        myPermalink: null,       // 自分のプロフィールURL名（/permalink/likes 等の判定用）
        oauthToken: null,        // 直近で使う認証ヘッダー値 ("OAuth xxx")。毎回 getAuthToken() で最新化する
        capturedToken: null,     // SoundCloud 自身の通信から捕捉したトークン
        injectedToken: null,     // 拡張機能 background から注入されたトークン
        myUsername: null,
        clientId: localStorage.getItem(CACHE_CLIENT_ID_KEY) || null,
        likedTrackIds: new Set(),
        followingUserIds: new Set(),
        isUserDataLoaded: false,
        playbackMode: normalizePlaybackMode(localStorage.getItem(PLAYBACK_MODE_KEY)), // 'DISCOVERY'（'FOLLOWING_NEW' は現在無効）
        discoveryEnabled: readDiscoveryEnabled(), // 発掘モード（自動スキップ・ステーション絞り込み）の ON/OFF
        autoMiniPlayer: (function () { try { return localStorage.getItem(AUTO_MINI_PLAYER_KEY) !== 'false'; } catch (e) { return true; } })(), // 別タブへ切替時にミニプレイヤーを自動表示
        preferredLanguage: (function () { try { return localStorage.getItem(PREFERRED_LANGUAGE_KEY) || 'auto'; } catch (e) { return 'auto'; } })(), // 表示言語: auto / ja / en
        dislikedTracks: {},
        dislikedArtists: {},
        dislikedGenres: {},
        myPlaylists: [],
        targetPlaylistId: localStorage.getItem(TARGET_PLAYLIST_KEY) || null,
        currentTrack: null,
        lastSkippedTrackKey: null,
        repostedTrackIds: new Set(),
        robotBlocked: false      // SoundCloud のロボット確認が出ている間 true（自動スキップと自分の API 呼び出しを止める）
    };

    // 1. キャッシュから即時復元（ページ表示0秒後から除外有効化）
    function loadCachedData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                state.dislikedTracks = parsed.dislikedTracks || {};
                state.dislikedArtists = parsed.dislikedArtists || {};
                state.dislikedGenres = parsed.dislikedGenres || {};
            }
            state.targetPlaylistId = localStorage.getItem(TARGET_PLAYLIST_KEY) || null;
            state.playbackMode = normalizePlaybackMode(localStorage.getItem(PLAYBACK_MODE_KEY));
            state.discoveryEnabled = readDiscoveryEnabled();
            try { state.preferredLanguage = localStorage.getItem(PREFERRED_LANGUAGE_KEY) || 'auto'; } catch (e) {}

            const cachedLikes = localStorage.getItem(CACHE_LIKES_KEY);
            if (cachedLikes) {
                const arr = JSON.parse(cachedLikes);
                state.likedTrackIds = new Set((Array.isArray(arr) ? arr : []).map(Number).filter(function (n) { return n > 0; }));
            }

            const cachedFollows = localStorage.getItem(CACHE_FOLLOWS_KEY);
            if (cachedFollows) {
                const arr = JSON.parse(cachedFollows);
                state.followingUserIds = new Set((Array.isArray(arr) ? arr : []).map(Number).filter(function (n) { return n > 0; }));
            }

            const cachedPls = localStorage.getItem(CACHE_PLAYLISTS_KEY);
            if (cachedPls) {
                state.myPlaylists = JSON.parse(cachedPls);
            }

            const cachedReposts = localStorage.getItem(CACHE_REPOSTS_KEY);
            if (cachedReposts) {
                const arr = JSON.parse(cachedReposts);
                state.repostedTrackIds = new Set((Array.isArray(arr) ? arr : []).map(Number).filter(function (n) { return n > 0; }));
            }

            if (state.likedTrackIds.size > 0 || state.followingUserIds.size > 0) {
                state.isUserDataLoaded = true;
                console.log('[SC-FreshStation] Loaded from cache: ' + state.likedTrackIds.size + ' likes, ' + state.followingUserIds.size + ' follows');
            }

            // 無効なゴミキーの完全クリーンアップ（全スキップバグの防止）
            const invalidKeys = ['undefined', 'null', 'unknown', 'title_unknown', 'artist_unknown', ''];
            let cleaned = false;
            Object.keys(state.dislikedTracks).forEach(function (k) {
                if (!k || invalidKeys.includes(k.toLowerCase().trim())) {
                    delete state.dislikedTracks[k];
                    cleaned = true;
                }
            });
            Object.keys(state.dislikedArtists).forEach(function (k) {
                if (!k || invalidKeys.includes(k.toLowerCase().trim())) {
                    delete state.dislikedArtists[k];
                    cleaned = true;
                }
            });
            Object.keys(state.dislikedGenres).forEach(function (k) {
                if (!k || invalidKeys.includes(k.toLowerCase().trim())) {
                    delete state.dislikedGenres[k];
                    cleaned = true;
                }
            });
            if (cleaned) {
                saveDislikeData();
                console.log('[SC-FreshStation] Cleaned up invalid blacklist keys.');
            }
        } catch (e) {
            console.error('[SC-FreshStation] Cache load error:', e);
        }
    }

    function saveDislikeData() {
        try {
            const payload = {
                dislikedTracks: state.dislikedTracks,
                dislikedArtists: state.dislikedArtists,
                dislikedGenres: state.dislikedGenres,
                updatedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            try { fdBus.post('dislike-changed'); } catch (e2) {}
        } catch (e) {
            console.error('[SC-FreshStation] Failed to save dislike data:', e);
        }
    }

    function saveCacheData() {
        try {
            localStorage.setItem(CACHE_LIKES_KEY, JSON.stringify(Array.from(state.likedTrackIds)));
            localStorage.setItem(CACHE_FOLLOWS_KEY, JSON.stringify(Array.from(state.followingUserIds)));
            localStorage.setItem(CACHE_PLAYLISTS_KEY, JSON.stringify(state.myPlaylists));
            localStorage.setItem(CACHE_REPOSTS_KEY, JSON.stringify(Array.from(state.repostedTrackIds)));
            if (state.clientId) {
                localStorage.setItem(CACHE_CLIENT_ID_KEY, state.clientId);
            }
        } catch (e) {}
    }

    // =========================================================================
    // 🔌 SoundCloud 内部モジュールへのアクセス (webpack)
    //    音量・認証トークン・client_id を SoundCloud 本体と同じ仕組みで扱うため
    // =========================================================================
    const scInternals = { req: null, probed: false, ids: {}, misses: {} };

    function getScRequire() {
        if (scInternals.req) return scInternals.req;
        const jp = window.webpackJsonp;
        // webpack ランタイムが起動済み（push が差し替え済み）になってから一度だけプローブする
        if (scInternals.probed || !jp || typeof jp.push !== 'function' || jp.push === Array.prototype.push) return null;
        scInternals.probed = true;
        try {
            const probeId = '__freshdig_probe';
            jp.push([[probeId + '_' + Date.now()], {
                [probeId]: function (module, exports, require) { scInternals.req = require; }
            }, [[probeId]]]);
        } catch (e) {
            console.warn('[SC-FreshStation] webpack probe failed:', e);
        }
        return scInternals.req;
    }

    function findScModule(name, predicate) {
        const req = getScRequire();
        if (!req || !req.c) return null;
        const cachedId = scInternals.ids[name];
        if (cachedId !== undefined) {
            const m = req.c[cachedId];
            try { if (m && m.exports && predicate(m.exports)) return m.exports; } catch (e) {}
            delete scInternals.ids[name];
        }
        // 見つからなかった直後は再走査しない（500ms 毎の UI 同期で全モジュールを走査しないため）
        if (scInternals.misses[name] && Date.now() - scInternals.misses[name] < 5000) return null;
        for (const id of Object.keys(req.c)) {
            const ex = req.c[id] && req.c[id].exports;
            if (!ex || (typeof ex !== 'object' && typeof ex !== 'function')) continue;
            try {
                if (predicate(ex)) {
                    scInternals.ids[name] = id;
                    delete scInternals.misses[name];
                    return ex;
                }
            } catch (e) {}
        }
        scInternals.misses[name] = Date.now();
        return null;
    }

    function getScVolumeModule() {
        return findScModule('volume', function (ex) {
            return typeof ex.setVolumeAndMuted === 'function' && typeof ex.getVolume === 'function' &&
                typeof ex.getMuted === 'function' && typeof ex.setMuted === 'function';
        });
    }

    function getScAuthModule() {
        return findScModule('auth', function (ex) {
            return typeof ex.getAuthToken === 'function' && typeof ex.isLoggedIn === 'function';
        });
    }

    function getScConfigClientId() {
        const cfg = findScModule('config', function (ex) {
            if (typeof ex.get !== 'function' || typeof ex.set !== 'function') return false;
            const v = ex.get('client_id');
            return typeof v === 'string' && /^[a-zA-Z0-9]{20,40}$/.test(v);
        });
        return cfg ? cfg.get('client_id') : null;
    }

    function toOAuthHeader(tok) {
        if (!tok || typeof tok !== 'string') return null;
        tok = tok.trim();
        if (!tok || tok === 'null' || tok === 'undefined') return null;
        return tok.indexOf('OAuth ') === 0 ? tok : ('OAuth ' + tok);
    }

    function readTokenCookie() {
        const match = document.cookie.match(/(?:^|;\s*)oauth_token=([^;]+)/);
        return match && match[1] ? toOAuthHeader(decodeURIComponent(match[1])) : null;
    }

    // 最新の認証トークンを取得。SoundCloud はトークンを定期的に更新するため、キャッシュより
    // 「今の Cookie / SoundCloud 本体が使っている値」を必ず優先する（古いトークン固定が接続失敗の原因だった）
    function getAuthToken() {
        let tok = readTokenCookie();
        if (!tok) {
            try {
                const auth = getScAuthModule();
                if (auth && auth.isLoggedIn()) tok = toOAuthHeader(auth.getAuthToken());
            } catch (e) {}
        }
        return tok || state.capturedToken || state.injectedToken || null;
    }

    // 認証情報（トークン・client_id）を最新化。トークンが無ければ拡張機能本体へ要求する
    function extractAuthTokenFromCookie() {
        state.oauthToken = getAuthToken();
        const cid = getScConfigClientId();
        if (cid && cid !== state.clientId) {
            state.clientId = cid;
            try { localStorage.setItem(CACHE_CLIENT_ID_KEY, cid); } catch (e) {}
        }
        if (!state.oauthToken) {
            requestAuthFromExtension();
        }
        return state.oauthToken;
    }

    // 拡張機能本体（background）へのトークン要求。連発しないよう 2 秒に1回まで
    let lastAuthRequestAt = 0;
    function requestAuthFromExtension() {
        if (Date.now() - lastAuthRequestAt < 2000) return;
        lastAuthRequestAt = Date.now();
        window.postMessage({ type: 'SC_FRESH_STATION_REQUEST_AUTH' }, window.location.origin);
    }

    // トークンが得られるまで最大 waitMs 待つ（background からの注入待ち）
    async function waitForAuthToken(waitMs) {
        if (extractAuthTokenFromCookie()) return state.oauthToken;
        const until = Date.now() + (waitMs || 1500);
        while (Date.now() < until) {
            await new Promise(function (r) { setTimeout(r, 100); });
            if (extractAuthTokenFromCookie()) return state.oauthToken;
        }
        return null;
    }

    // =========================================================================
    // 🩺 診断ログ・タブ間連絡・API 呼び出しの上限・ロボット確認の検出（v2.0 P1）
    //    ・診断ログ: 最新 300 件の出来事を localStorage に残す（ポップアップからコピー）
    //    ・自分の API 呼び出しは apiFetch() を通す（間隔 250ms 以上・1 分 60 回まで・403/429 で待つ）
    //    ・ロボット確認（DataDome）を見つけたら自動スキップと API 呼び出しを止め、消えたら再開（突破はしない）
    // =========================================================================
    const TAB_ID = Math.random().toString(36).slice(2, 8);
    const DIAG_LOG_KEY = 'sc_fresh_station_diag_log';
    const LAST_FULL_SYNC_KEY = 'sc_fresh_station_last_full_sync';
    const CACHE_ME_KEY = 'sc_fresh_station_cache_me';
    const CACHE_REPOSTS_KEY = 'sc_fresh_station_cache_reposts';
    const DIAG_MAX = 300;
    let diagPending = [];
    let diagTimer = null;

    function flushDiagLog() {
        diagTimer = null;
        if (!diagPending.length) return;
        const batch = diagPending;
        diagPending = [];
        try {
            let stored = [];
            try { stored = JSON.parse(localStorage.getItem(DIAG_LOG_KEY) || '[]'); } catch (e) {}
            localStorage.setItem(DIAG_LOG_KEY, JSON.stringify(FreshDigCore.mergeLogs(stored, batch, DIAG_MAX)));
        } catch (e) {}
    }

    function dlog(type, detail) {
        try {
            diagPending.push({ t: Date.now(), tab: TAB_ID, type: type, d: detail === undefined ? '' : detail });
            if (diagPending.length > DIAG_MAX) diagPending.shift();
            if (!diagTimer) diagTimer = setTimeout(flushDiagLog, 2000);
        } catch (e) {}
    }
    window.addEventListener('pagehide', flushDiagLog);

    function getDiagLogText() {
        flushDiagLog();
        let list = [];
        try { list = JSON.parse(localStorage.getItem(DIAG_LOG_KEY) || '[]'); } catch (e) {}
        const head = 'FreshDig diag log (' + list.length + ' entries) UA=' + navigator.userAgent + ' url=' + location.pathname;
        return head + '\n' + list.map(function (x) {
            const dt = new Date(x.t);
            const hms = dt.toTimeString().slice(0, 8) + '.' + String(dt.getMilliseconds()).padStart(3, '0');
            return hms + ' [' + x.tab + '] ' + x.type + (x.d === '' ? '' : ' ' + JSON.stringify(x.d));
        }).join('\n');
    }

    function getDiagLogEntries() {
        flushDiagLog();
        let list = [];
        try { list = JSON.parse(localStorage.getItem(DIAG_LOG_KEY) || '[]'); } catch (e) {}
        return list.map(function (x) {
            return { t: x.t, tab: x.tab, type: x.type, detail: x.d === undefined ? '' : x.d };
        });
    }

    // 同じ soundcloud.com の全タブへの連絡（拡張の裏側を通さない）。自分が送ったものは受け取らない
    const fdBus = (function () {
        const handlers = {};
        let ch = null;
        try { ch = new BroadcastChannel('freshdig'); } catch (e) {}
        if (ch) {
            ch.onmessage = function (ev) {
                const m = ev && ev.data;
                if (!m || typeof m.type !== 'string' || m.fromTabId === TAB_ID) return;
                (handlers[m.type] || []).forEach(function (fn) { try { fn(m); } catch (e) {} });
            };
        }
        return {
            on: function (type, fn) { (handlers[type] = handlers[type] || []).push(fn); },
            post: function (type, payload) {
                if (!ch) return;
                try { ch.postMessage(Object.assign({ type: type, fromTabId: TAB_ID }, payload || {})); } catch (e) {}
            }
        };
    })();

    // ---- API の上限 ----
    const apiLimiter = FreshDigCore.createRateLimiter({ minGapMs: 250, perMinute: 45 });
    const apiBackoff = FreshDigCore.createBackoff([60000, 120000, 300000]);
    const robotState = { iframe: false, api: false };

    function sleepMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function isRobotBlocked() { return robotState.iframe || robotState.api; }

    function refreshRobotState(source) {
        const was = !!state.robotBlocked;
        const now = isRobotBlocked();
        state.robotBlocked = now;
        if (was === now) return;
        dlog(now ? 'robot-check-detected' : 'robot-check-cleared', source);
        console.warn('[SC-FreshStation] robot check ' + (now ? 'detected (' + source + ') - auto-skip and own API calls paused' : 'cleared - resumed'));
        try {
            let el = document.getElementById('sc-fresh-station-robot-banner');
            if (now) {
                if (!el && document.body) {
                    el = document.createElement('div');
                    el.id = 'sc-fresh-station-robot-banner';
                    el.style.cssText = 'position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:2147483646;background:#b71c1c;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.5);';
                    document.body.appendChild(el);
                }
                if (el) el.textContent = '⚠️ ' + getI18nTexts().robotBanner;
            } else if (el) {
                el.remove();
            }
        } catch (e) {}
        try { syncMiniPlayerUI(); } catch (e) {}
    }

    function blockedApiResponse() {
        return new Response('{"freshdig":"paused"}', { status: 503, statusText: 'FreshDig paused' });
    }

    function apiPathForLog(url) {
        try { return new URL(url, 'https://api-v2.soundcloud.com').pathname; } catch (e) { return String(url).slice(0, 60); }
    }

    // 自分の API 呼び出し（scApi・ステーション補充・/resolve）はすべてここを通す
    async function apiFetch(url, init) {
        if (robotState.iframe || apiBackoff.isBlocked(Date.now())) return blockedApiResponse();
        const wait = apiLimiter.reserve(Date.now());
        if (wait > 0) await sleepMs(wait);
        const res = await originalFetch(url, init);
        try {
            if (res.status === 403 || res.status === 429) {
                let body = '';
                if (res.status === 403) { try { body = await res.clone().text(); } catch (e) {} }
                const isRobot = FreshDigCore.isRobotCheckResponse(res.status, function (n) { return res.headers.get(n); }, body);
                const waitMs = apiBackoff.fail(Date.now());
                dlog('api-blocked', { status: res.status, robot: isRobot, path: apiPathForLog(url), waitMs: waitMs });
                if (isRobot) { robotState.api = true; refreshRobotState('api'); }
            } else if (res.ok) {
                apiBackoff.ok();
                if (robotState.api) { robotState.api = false; refreshRobotState('api-ok'); }
            } else if (res.status !== 401) {
                dlog('api-error', { status: res.status, path: apiPathForLog(url) });
            }
        } catch (e) {}
        return res;
    }

    // SoundCloud 本体の通信（XHR）が 403 + DataDome の時も気づく
    function observeScXhr(xhr) {
        try {
            if (xhr.status === 403) {
                let body = '';
                try { body = (xhr.responseType === '' || xhr.responseType === 'text') ? xhr.responseText : ''; } catch (e) {}
                if (FreshDigCore.isRobotCheckResponse(403, function (n) { return xhr.getResponseHeader(n); }, body)) {
                    dlog('sc-xhr-robot-check', { path: apiPathForLog(xhr._scUrl) });
                    robotState.api = true;
                    apiBackoff.fail(Date.now());
                    refreshRobotState('sc-xhr');
                }
            } else if (xhr.status >= 200 && xhr.status < 300 && robotState.api && !apiBackoff.isBlocked(Date.now())) {
                robotState.api = false;
                apiBackoff.ok();
                refreshRobotState('sc-xhr-ok');
            }
        } catch (e) {}
    }

    // 3 秒ごとに、ロボット確認の画面（iframe）があるか見る。API 側で止まっている時は待ちが終わったら 1 回だけ試す
    setInterval(function () {
        try {
            const found = !!document.querySelector('iframe[src*="captcha-delivery.com"]');
            if (found !== robotState.iframe) {
                robotState.iframe = found;
                refreshRobotState('iframe');
            }
            if (robotState.api && !robotState.iframe && !apiBackoff.isBlocked(Date.now()) && !document.hidden) {
                scApi('me').catch(function () {});
            }
        } catch (e) {}
    }, 3000);

    // 音声要素の出来事（音が止まる不具合の調査用）。イベントは親へ伝わらないので capture で受ける
    ['pause', 'waiting', 'stalled', 'error', 'ended', 'volumechange'].forEach(function (evName) {
        document.addEventListener(evName, function (ev) {
            const m = ev.target;
            if (!m || (m.tagName !== 'AUDIO' && m.tagName !== 'VIDEO')) return;
            try {
                const d = { ct: Math.round((m.currentTime || 0) * 10) / 10, dur: isFinite(m.duration) ? Math.round(m.duration) : null,
                    vol: Math.round((m.volume || 0) * 100) / 100, muted: !!m.muted, ready: m.readyState, net: m.networkState };
                if (m.error) d.err = m.error.code;
                dlog('audio-' + evName, d);
            } catch (e) {}
        }, true);
    });
    document.addEventListener('visibilitychange', function () { dlog('tab-visibility', document.hidden ? 'hidden' : 'visible'); });

    // SoundCloud API v2 呼び出しの共通処理：client_id と最新トークンを付与し、401 なら最新トークンで1回だけ再試行
    async function scApi(pathOrUrl, options) {
        options = options || {};
        extractAuthTokenFromCookie();
        if (!state.clientId) await discoverClientId();
        const buildUrl = function () {
            const u = new URL(pathOrUrl.indexOf('http') === 0 ? pathOrUrl : ('https://api-v2.soundcloud.com/' + pathOrUrl.replace(/^\//, '')));
            if (state.clientId) u.searchParams.set('client_id', state.clientId);
            return u.toString();
        };
        const doFetch = function () {
            const headers = Object.assign({ 'Accept': 'application/json' }, options.headers || {});
            if (state.oauthToken) headers['Authorization'] = state.oauthToken;
            const init = { method: options.method || 'GET', headers: headers, credentials: 'include' };
            if (options.body !== undefined) {
                init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
                headers['Content-Type'] = 'application/json';
            }
            return apiFetch(buildUrl(), init);
        };
        let res = await doFetch();
        if (res.status === 401) {
            const before = state.oauthToken;
            state.capturedToken = null;
            state.injectedToken = null;
            lastAuthRequestAt = 0;
            requestAuthFromExtension();
            await new Promise(function (r) { setTimeout(r, 800); });
            extractAuthTokenFromCookie();
            if (state.oauthToken && state.oauthToken !== before) {
                console.warn('[SC-FreshStation] API 401 -> retrying with refreshed token');
                res = await doFetch();
            }
        }
        return res;
    }

    // content_bridge 経由のポップアップ操作に requestId 付きで応答する
    function replyToBridge(requestId, type, payload) {
        if (!requestId) return;
        const msg = { type: type, requestId: requestId };
        if (type === 'SC_FRESH_STATION_DATA_RESPONSE') {
            msg.data = payload;
        } else {
            msg.result = payload;
        }
        window.postMessage(msg, window.location.origin);
    }

    window.addEventListener('message', async function (event) {
        // 同一ウィンドウ（content_bridge / 自分自身）以外（iframe等）からのメッセージは無視
        if (event.source !== window || !event.data) return;

        if (event.data.type === 'SC_FRESH_STATION_RESTORE_STORAGE') {
            const d = event.data.data;
            if (d && d.targetPlaylistId) {
                state.targetPlaylistId = String(d.targetPlaylistId);
                localStorage.setItem(TARGET_PLAYLIST_KEY, state.targetPlaylistId);
                updatePlaylistButtonUI();
                console.log('[SC-FreshStation] Restored targetPlaylistId from extension storage:', state.targetPlaylistId);
            }
            if (d && (d.playbackMode === 'DISCOVERY' || d.playbackMode === 'FOLLOWING_NEW')) {
                state.playbackMode = normalizePlaybackMode(d.playbackMode);
                localStorage.setItem(PLAYBACK_MODE_KEY, state.playbackMode);
                updateModeButtonUI();
            }
            if (d && Array.isArray(d.laterArtists)) setLaterList(d.laterArtists);
            if (d && d.freshFilter) applyFreshFilter(d.freshFilter, { noSync: true, noBroadcast: true });
            if (d && typeof d.autoMiniPlayer === 'boolean' && d.autoMiniPlayer !== state.autoMiniPlayer) {
                setAutoMiniPlayer(d.autoMiniPlayer, { noSync: true });
            }
            if (d && d.preferredLanguage && d.preferredLanguage !== state.preferredLanguage) {
                state.preferredLanguage = d.preferredLanguage;
                try { localStorage.setItem(PREFERRED_LANGUAGE_KEY, state.preferredLanguage); } catch (e) {}
                updatePlayerBarTitles();
                syncMiniPlayerUI();
            }
            if (d && typeof d.discoveryEnabled === 'boolean' && d.discoveryEnabled !== state.discoveryEnabled) {
                state.discoveryEnabled = d.discoveryEnabled;
                try { localStorage.setItem(DISCOVERY_ENABLED_KEY, String(state.discoveryEnabled)); } catch (e) {}
                updateModeButtonUI();
            }
            return;
        }

        if (event.data.type === 'SC_FRESH_STATION_POPUP_ACTION') {
            const action = event.data.action;
            const targetType = event.data.targetType;
            const targetId = event.data.targetId;
            const requestId = event.data.requestId;
            const ack = function (result) {
                replyToBridge(requestId, 'SC_FRESH_STATION_ACTION_RESULT', result || { success: true });
            };

            try {
                if (action === 'INJECT_AUTH_TOKEN') {
                    if (event.data.token) {
                        state.injectedToken = toOAuthHeader(event.data.token);
                        extractAuthTokenFromCookie();
                        console.log('[SC-FreshStation] Received OAuth token from extension');
                        if (!state.isUserDataLoaded || state.myPlaylists.length === 0) {
                            initUserData();
                        }
                    }
                    ack();
                } else if (action === 'FORCE_SYNC') {
                    console.log('[SC-FreshStation] Force sync requested from popup');
                    await initUserData({ force: true });
                    ack({ success: state.isUserDataLoaded });
                } else if (action === 'REMOVE') {
                    if (targetType === 'track') delete state.dislikedTracks[targetId];
                    if (targetType === 'artist') delete state.dislikedArtists[targetId];
                    if (targetType === 'genre') delete state.dislikedGenres[targetId];
                    saveDislikeData();
                    ack();
                } else if (action === 'SET_TARGET_PLAYLIST') {
                    saveTargetPlaylist(targetId);
                    ack();
                } else if (action === 'SET_PLAYBACK_MODE') {
                    savePlaybackMode(event.data.mode);
                    ack();
                } else if (action === 'SET_LANGUAGE') {
                    state.preferredLanguage = event.data.language || 'auto';
                    try { localStorage.setItem(PREFERRED_LANGUAGE_KEY, state.preferredLanguage); } catch (e) {}
                    applyLanguage();
                    fdBus.post('lang', { language: state.preferredLanguage });
                    ack({ success: true, preferredLanguage: state.preferredLanguage });
                } else if (action === 'SET_FRESH_FILTER') {
                    applyFreshFilter(event.data.filter);
                    ack({ success: true, freshFilter: state.freshFilter });
                } else if (action === 'SET_AUTO_MINI_PLAYER') {
                    setAutoMiniPlayer(event.data.enabled !== false);
                    ack({ success: true, autoMiniPlayer: state.autoMiniPlayer });
                } else if (action === 'SET_DISCOVERY_ENABLED') {
                    setDiscoveryEnabled(event.data.enabled !== false, { silent: true });
                    ack({ success: true, discoveryEnabled: state.discoveryEnabled });
                } else if (action === 'EXPORT_DISLIKES') {
                    ack(await exportDislikesToPlaylist());
                } else if (action === 'IMPORT_DISLIKES') {
                    ack(await importDislikesFromPlaylist());
                } else if (action === 'START_STATION') {
                    ack(await startTrackStation());
                } else if (action === 'TOGGLE_MINI_PLAYER') {
                    toggleMiniPlayer();
                    ack();
                } else if (action === 'SET_VOLUME') {
                    if (typeof event.data.volume === 'number') {
                        setSoundCloudVolume(event.data.volume);
                    }
                    ack({ success: true, volume: getSoundCloudVolume() });
                } else if (action === 'TOGGLE_MUTE') {
                    toggleSoundCloudMute();
                    ack({ success: true, volume: getSoundCloudVolume() });
                } else if (action === 'GET_DIAG_LOG') {
                    ack({ success: true, text: getDiagLogText(), entries: getDiagLogEntries(), stats: getStats() });
                } else if (action === 'GET_DATA') {
                    loadCachedData();
                    extractAuthTokenFromCookie();
                    if (state.clientId && state.oauthToken && (!state.isUserDataLoaded || !state.myUserId || state.myPlaylists.length === 0)) {
                        initUserData();
                    }
                    replyToBridge(requestId, 'SC_FRESH_STATION_DATA_RESPONSE', {
                        dislikedTracks: state.dislikedTracks,
                        dislikedArtists: state.dislikedArtists,
                        dislikedGenres: state.dislikedGenres,
                        myPlaylists: state.myPlaylists,
                        targetPlaylistId: state.targetPlaylistId,
                        playbackMode: state.playbackMode,
                        discoveryEnabled: state.discoveryEnabled,
                        autoMiniPlayer: state.autoMiniPlayer,
                        autoPipSupported: 'documentPictureInPicture' in window,
                        preferredLanguage: state.preferredLanguage,
                        freshFilter: state.freshFilter,
                        likedCount: state.likedTrackIds.size,
                        followingCount: state.followingUserIds.size,
                        isReady: state.isUserDataLoaded,
                        loggedIn: !!state.oauthToken,
                        accountName: state.myUsername,
                        volume: getSoundCloudVolume(),
                        stats: getStats()
                    });
                } else {
                    ack({ success: false, message: 'Unknown action: ' + action });
                }
            } catch (e) {
                console.error('[SC-FreshStation] Popup action error (' + action + '):', e);
                ack({ success: false, message: tt('m_errorOcc', { msg: e && e.message }) });
            }
        }
    });

    loadCachedData();
    // 旧バージョンが保存していた（更新されずに失効する）トークンキャッシュを削除
    try { localStorage.removeItem(CACHE_OAUTH_TOKEN_KEY); } catch (e) {}
    extractAuthTokenFromCookie();

    // 拡張機能本体（chrome.storage.local）から最新設定の同期を要求
    window.postMessage({ type: 'SC_FRESH_STATION_REQUEST_STORAGE' }, window.location.origin);

    // 積極的 client_id 発見ロジック
    async function discoverClientId() {
        const cfgCid = getScConfigClientId();
        if (cfgCid) {
            state.clientId = cfgCid;
            return state.clientId;
        }
        if (state.clientId) return state.clientId;

        // 1. window.__sc_hydration
        try {
            if (window.__sc_hydration && Array.isArray(window.__sc_hydration)) {
                for (const item of window.__sc_hydration) {
                    if (item.hydratable === 'user' && item.data && item.data.id) {
                        state.myUserId = item.data.id;
                    }
                }
            }
        } catch (e) {}

        // 2. DOM内のスクリプトタグを走査
        try {
            const scripts = Array.from(document.querySelectorAll('script[src*="sndcdn.com"]'));
            for (const s of scripts) {
                if (s.src && s.src.indexOf('assets/') !== -1) {
                    const res = await originalFetch(s.src);
                    const txt = await res.text();
                    const m = txt.match(/client_id[:=]["']([a-zA-Z0-9]{32})["']/);
                    if (m && m[1]) {
                        state.clientId = m[1];
                        localStorage.setItem(CACHE_CLIENT_ID_KEY, m[1]);
                        console.log('[SC-FreshStation] Discovered client_id from script assets:', state.clientId);
                        return state.clientId;
                    }
                }
            }
        } catch (e) {}

        return state.clientId;
    }

    // 1. XMLHttpRequest Hook (SoundCloudの全XHR通信からclient_id/tokenを補足)
    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._scUrl = typeof url === 'string' ? url : '';
        if (this._scUrl.indexOf('api-v2.soundcloud.com') !== -1) {
            if (!this._scObserved) {
                this._scObserved = true;
                this.addEventListener('loadend', function () { observeScXhr(this); });
            }
            try {
                const parsed = new URL(this._scUrl, window.location.origin);
                if (parsed.searchParams.has('client_id')) {
                    const cid = parsed.searchParams.get('client_id');
                    if (cid && cid !== state.clientId) {
                        state.clientId = cid;
                        localStorage.setItem(CACHE_CLIENT_ID_KEY, cid);
                    }
                }
            } catch (e) {}
        }
        return origXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        try {
            if (header && header.toLowerCase() === 'authorization' && value && value.indexOf('OAuth ') === 0) {
                state.capturedToken = value;
                state.oauthToken = value;
                if (state.clientId && (!state.isUserDataLoaded || state.myPlaylists.length === 0)) {
                    initUserData();
                }
            }
        } catch (e) {}
        return origXhrSetRequestHeader.apply(this, arguments);
    };

    // 2. window.fetch Hook
    // ※ 2026-09 時点の SoundCloud は API 通信をすべて XMLHttpRequest で行っており、ページの曲リストも
    //    HTML に埋め込まれているため、下の B〜D（fetch 経由の書き換え）は実際にはほぼ動かない。
    //    発掘モードの本体は「曲の切替通知での即時スキップ」（hookScCurrentSoundChange）。
    const originalFetch = window.fetch;

    window.fetch = async function () {
        const args = Array.prototype.slice.call(arguments);
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');

        // A. Capture Auth Tokens & Client ID
        if (url.indexOf('api-v2.soundcloud.com') !== -1) {
            try {
                const parsedUrl = new URL(url, window.location.origin);
                if (parsedUrl.searchParams.has('client_id')) {
                    state.clientId = parsedUrl.searchParams.get('client_id');
                    localStorage.setItem(CACHE_CLIENT_ID_KEY, state.clientId);
                }
                const options = args[1];
                if (options && options.headers) {
                    const headers = options.headers;
                    const auth = (typeof headers.get === 'function' ? headers.get('Authorization') : headers.Authorization) || headers['authorization'];
                    if (auth && auth.indexOf('OAuth ') === 0) {
                        state.capturedToken = auth;
                        state.oauthToken = auth;
                    }
                }
                if (state.clientId && state.oauthToken && !state.isUserDataLoaded) {
                    initUserData();
                }
            } catch (e) {}
        }

        // B. Track current playing track info
        if (url.indexOf('api-v2.soundcloud.com/tracks/') !== -1) {
            const response = await originalFetch.apply(this, args);
            try {
                const clone = response.clone();
                const trackData = await clone.json();
                // 閲覧中の別ページ等の曲で「再生中の曲」を上書きしないよう、再生中hrefと一致する時だけ採用
                if (trackData && trackData.id && trackData.title && isCurrentlyPlayingTrack(trackData)) {
                    updateCurrentTrackInfo(trackData);
                }
            } catch (e) {}
            return response;
        }

        // C. Intercept Stream (タイムライン / Stream: フォロー中の新曲)
        if (url.indexOf('api-v2.soundcloud.com/stream') !== -1) {
            const response = await originalFetch.apply(this, args);
            if (FOLLOWING_NEW_MODE_ENABLED && state.discoveryEnabled && state.playbackMode === 'FOLLOWING_NEW') {
                try {
                    const clone = response.clone();
                    let data = await clone.json();
                    if (data && Array.isArray(data.collection)) {
                        const originalCount = data.collection.length;
                        // Streamアイテムから「本人の新曲ポスト（type === track）」のみを残し、リポストや除外対象をカット
                        data.collection = data.collection.filter(function (item) {
                            // 1. リポストは除外
                            if (item.type !== 'track') return false;

                            const track = item.track;
                            if (!track) return false;

                            const authorId = track.user ? track.user.id : track.user_id;

                            // 2. 自分がフォローしている人本人による投稿であること
                            if (!state.followingUserIds.has(authorId) && authorId !== state.myUserId) {
                                return false;
                            }

                            // 3. Dislike除外
                            if (state.dislikedTracks[track.id]) return false;
                            if (authorId && state.dislikedArtists[authorId]) return false;
                            const genre = (track.genre || '').trim().toLowerCase();
                            if (genre && state.dislikedGenres[genre]) return false;

                            return true;
                        });
                        console.log('[SC-FreshStation:FollowingMode] Stream filtered: ' + originalCount + ' -> ' + data.collection.length + ' tracks.');

                        return new Response(JSON.stringify(data), {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers
                        });
                    }
                } catch (e) {
                    console.error('[SC-FreshStation] Stream filter error:', e);
                }
            }
            return response;
        }

        // D. Intercept Station (ステーション再生)
        if (url.indexOf('/stations/') !== -1 && url.indexOf('/tracks') !== -1) {
            console.log('[SC-FreshStation] Intercepted Station tracks request:', url);
            const response = await originalFetch.apply(this, args);

            if (!state.isUserDataLoaded || !state.discoveryEnabled) {
                return response;
            }

            try {
                const clone = response.clone();
                let data = await clone.json();

                if (data && Array.isArray(data.collection)) {
                    const originalCount = data.collection.length;
                    data.collection = filterStationTracks(data.collection);
                    console.log('[SC-FreshStation] Filtered: ' + originalCount + ' -> ' + data.collection.length);

                    let nextHref = data.next_href;
                    let extraPages = 0;
                    extractAuthTokenFromCookie();
                    // 全曲除外されても無限にページを辿らないよう上限を設ける
                    while (data.collection.length < 10 && nextHref && extraPages < MAX_STATION_EXTRA_PAGES) {
                        extraPages++;
                        const nextUrl = nextHref.indexOf('client_id=') !== -1 ? nextHref : (nextHref + '&client_id=' + state.clientId);
                        const nextRes = await apiFetch(nextUrl, {
                            headers: state.oauthToken ? { 'Authorization': state.oauthToken } : {}
                        });
                        if (!nextRes.ok) break;
                        const nextData = await nextRes.json();
                        if (nextData && Array.isArray(nextData.collection)) {
                            const freshNext = filterStationTracks(nextData.collection);
                            data.collection.push.apply(data.collection, freshNext);
                            nextHref = nextData.next_href;
                        } else {
                            break;
                        }
                    }
                    data.next_href = nextHref;

                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }
            } catch (err) {
                console.error('[SC-FreshStation] Error filtering station response:', err);
                return response;
            }
        }

        return originalFetch.apply(this, args);
    };

    function filterStationTracks(tracks) {
        return tracks.filter(function (track) {
            if (!track) return false;

            const trackId = track.id;
            const artistId = track.user ? track.user.id : track.user_id;
            const genre = (track.genre || '').trim().toLowerCase();

            // 共通除外: Dislike
            if (state.dislikedTracks[trackId]) return false;
            if (artistId && state.dislikedArtists[artistId]) return false;
            if (genre && state.dislikedGenres[genre]) return false;
            if (state.myUserId && artistId === state.myUserId) return false;

            // モードによる分岐
            if (state.playbackMode === 'FOLLOWING_NEW') {
                // フォロー中アーティストのみ通過
                if (!artistId || !state.followingUserIds.has(artistId)) {
                    return false;
                }
            } else {
                // 未知の曲発掘モード (DISCOVERY): 既知・フォローを除外
                if (state.likedTrackIds.has(trackId)) return false;
                if (artistId && state.followingUserIds.has(artistId)) return false;
            }

            return true;
        });
    }

    // 同期処理の多重実行・連打防止用
    let userDataSyncPromise = null;
    let lastUserDataSyncAttempt = 0;

    // options.force: クールダウンを無視して必ず同期（ポップアップの「同期」ボタン等）
    // 全件同期は全タブで 1 回だけ: Web Locks で 1 タブだけが行い、6 時間以内の同期済みならキャッシュを読むだけ。
    // 終わったら BroadcastChannel で他のタブにキャッシュの読み直しを知らせる
    function initUserData(options) {
        const force = !!(options && options.force);
        if (userDataSyncPromise) return userDataSyncPromise;
        if (!force && Date.now() - lastUserDataSyncAttempt < AUTO_SYNC_COOLDOWN_MS) {
            return Promise.resolve();
        }
        lastUserDataSyncAttempt = Date.now();
        userDataSyncPromise = runUserDataSync(force).finally(function () {
            userDataSyncPromise = null;
        });
        return userDataSyncPromise;
    }

    function restoreMeFromCache() {
        try {
            const me = JSON.parse(localStorage.getItem(CACHE_ME_KEY) || 'null');
            if (me && me.id) {
                state.myUserId = me.id;
                state.myUsername = me.username || null;
                state.myPermalink = me.permalink || null;
                return true;
            }
        } catch (e) {}
        return false;
    }

    async function runUserDataSync(force) {
        const needsFull = function () {
            loadCachedData();
            const hasCache = (state.likedTrackIds.size > 0 || state.followingUserIds.size > 0) && !!localStorage.getItem(CACHE_ME_KEY);
            return FreshDigCore.shouldFullSync(localStorage.getItem(LAST_FULL_SYNC_KEY), Date.now(), { force: force, hasCache: hasCache });
        };
        if (!needsFull()) {
            restoreMeFromCache();
            updatePlaylistButtonUI();
            dlog('sync-skipped-recent');
            return;
        }
        if (!(navigator.locks && navigator.locks.request)) return doInitUserData();
        return navigator.locks.request('freshdig-sync', force ? {} : { ifAvailable: true }, async function (lock) {
            if (!lock) { dlog('sync-skipped-other-tab'); return; }
            // 順番待ちの間に別のタブが終えていたら、それを使う
            if (!needsFull()) { restoreMeFromCache(); updatePlaylistButtonUI(); return; }
            dlog('sync-start', { force: force });
            await doInitUserData();
        });
    }

    fdBus.on('cache-updated', function () {
        loadCachedData();
        restoreMeFromCache();
        updatePlaylistButtonUI();
    });

    // ページングAPIから全件取得。途中で失敗したら null を返す（既存キャッシュを壊さないため）
    async function fetchPaged(firstPath, maxCount, onItem) {
        let count = 0;
        let url = firstPath;
        while (url && count < maxCount) {
            const res = await scApi(url);
            if (!res.ok) return null;
            const d = await res.json();
            if (d && Array.isArray(d.collection)) {
                d.collection.forEach(function (item) {
                    if (onItem(item) !== false) count++;
                });
            }
            url = (d && d.next_href) ? d.next_href : null;
        }
        return count;
    }

    async function fetchPagedIds(firstPath, maxCount, pickId) {
        const ids = new Set();
        const ok = await fetchPaged(firstPath, maxCount, function (item) {
            const id = pickId(item);
            if (id === undefined || id === null || id === '') return false;
            ids.add(id);
        });
        return ok === null ? null : ids;
    }

    async function doInitUserData() {
        if (state.robotBlocked) return;
        extractAuthTokenFromCookie();
        if (!state.clientId) {
            await discoverClientId();
        }
        if (!state.clientId) {
            console.warn('[SC-FreshStation] Still waiting for clientId...');
            return;
        }
        if (!state.oauthToken) {
            await waitForAuthToken(1500);
        }

        console.log('[SC-FreshStation] Syncing user profile, playlists, likes...');

        try {
            let meData = null;
            try {
                const meRes = await scApi('me');
                if (meRes.ok) {
                    meData = await meRes.json();
                } else {
                    console.warn('[SC-FreshStation] /me returned ' + meRes.status + ' (SoundCloud未ログイン、またはトークン失効)');
                }
            } catch (e) {}

            if (meData && meData.id) {
                state.myUserId = meData.id;
                state.myUsername = meData.username || meData.permalink || null;
                state.myPermalink = meData.permalink ? String(meData.permalink).toLowerCase() : null;
                try { localStorage.setItem(CACHE_ME_KEY, JSON.stringify({ id: state.myUserId, username: state.myUsername, permalink: state.myPermalink })); } catch (e) {}
            } else {
                // ログインしていない（またはトークンが無効）なら、他人のデータで判定しないよう打ち切る
                state.myUsername = null;
                return;
            }

            // プレイリスト一覧取得（非公開含む・ページング対応）
            const playlists = [];
            const plOk = await fetchPaged('users/' + state.myUserId + '/playlists?limit=50&linked_partitioning=1', 200, function (p) {
                if (!p || !p.id) return false;
                playlists.push({ id: p.id, title: p.title || tt('m_untitled'), trackCount: p.track_count || 0 });
            });
            if (plOk !== null) {
                state.myPlaylists = playlists;
                if (state.targetPlaylistId && !playlists.some(function (p) { return String(p.id) === String(state.targetPlaylistId); })) {
                    console.warn('[SC-FreshStation] Saved target playlist no longer exists in your account:', state.targetPlaylistId);
                }
                if (!state.targetPlaylistId && playlists.length > 0) {
                    saveTargetPlaylist(playlists[0].id);
                }
                updatePlaylistButtonUI();
            }

            // ライク一覧（ID のみの軽いエンドポイントで全件。失敗時は従来の一覧から取得）
            // 新規Setに集めて成功時のみ置換 → いいね解除も反映される
            let likes = await fetchPagedIds('me/track_likes/ids?limit=200', MAX_LIKES_SYNC, toNumId);
            if (!likes) {
                likes = await fetchPagedIds(
                    'users/' + state.myUserId + '/track_likes?limit=200&linked_partitioning=1', MAX_LIKES_SYNC,
                    function (item) { return toNumId(item.track ? item.track.id : (item.target ? item.target.id : item.id)); }
                );
            }
            if (likes) state.likedTrackIds = likes;

            // フォロー一覧（同上 → フォロー解除も反映される）
            let followings = await fetchPagedIds('users/' + state.myUserId + '/followings/ids?limit=5000', MAX_FOLLOWINGS_SYNC, toNumId);
            if (!followings) {
                followings = await fetchPagedIds(
                    'users/' + state.myUserId + '/followings?limit=200&linked_partitioning=1', MAX_FOLLOWINGS_SYNC,
                    function (u) { return toNumId(u.id); }
                );
            }
            if (followings) state.followingUserIds = followings;

            // リポスト済み一覧・追加先プレイリストの中身（ボタン表示用）
            await syncRepostedTrackIds();
            refreshTargetPlaylistCache(true);

            if (likes || followings) {
                state.isUserDataLoaded = true;
            }
            saveCacheData();
            if (likes && followings) {
                try { localStorage.setItem(LAST_FULL_SYNC_KEY, String(Date.now())); } catch (e) {}
            }
            dlog('sync-finished', { likes: state.likedTrackIds.size, follows: state.followingUserIds.size, partial: !(likes && followings) });
            fdBus.post('cache-updated');
            console.log('[SC-FreshStation] Sync finished (@' + state.myUsername + '): ' + state.myPlaylists.length + ' playlists, ' + state.likedTrackIds.size + ' likes, ' + state.followingUserIds.size + ' followings.' + (likes && followings ? '' : ' (partial)'));
        } catch (e) {
            console.error('[SC-FreshStation] Failed to sync user data:', e);
        }
    }

    // プレイヤーバーに表示中の曲 href（例: /artist/track）を取得
    function getPlayingTrackHref() {
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        return titleEl ? (titleEl.getAttribute('href') || '') : '';
    }

    function normalizeTrackPath(hrefOrUrl) {
        if (!hrefOrUrl) return '';
        try {
            return new URL(hrefOrUrl, 'https://soundcloud.com').pathname.replace(/\/+$/, '').toLowerCase();
        } catch (e) {
            return '';
        }
    }

    function isCurrentlyPlayingTrack(track) {
        const playing = normalizeTrackPath(getPlayingTrackHref());
        const candidate = normalizeTrackPath(track.permalink_url);
        return !!playing && !!candidate && playing === candidate;
    }

    function updateCurrentTrackInfo(track) {
        state.currentTrack = {
            id: track.id,
            title: track.title,
            artistId: track.user ? track.user.id : track.user_id,
            artistName: track.user ? track.user.username : 'Unknown',
            artistPermalink: track.user ? (track.user.permalink || '') : '',
            avatarUrl: track.user ? (track.user.avatar_url || '') : '',
            genre: (track.genre || '').trim(),
            href: getPlayingTrackHref()
        };
    }

    // マージン制御用の状態管理
    const marginGuard = {
        lastTrackHref: '',
        loadStartTime: 0,
        hasChecked: false,
        lastSkipTime: 0,
        consecutiveSkips: 0
    };

    // 3. 定期監視タイマー (500ms おきに実行 / try-catchでエラー落ち完全防止)
    setInterval(function () {
        try {
            injectButtons();
        } catch (e) {
            console.warn('[SC-FreshStation] injectButtons exception:', e);
        }
        try {
            hookScCurrentSoundChange();
        } catch (e) {}
        try {
            monitorPlaybackWithMargin();
        } catch (e) {
            console.warn('[SC-FreshStation] monitorPlayback exception:', e);
        }
        try {
            updateHateButtons();
        } catch (e) {}
        try {
            broadcastNow();
        } catch (e) {}
        try {
            syncMiniPlayerUI();
        } catch (e) {
            console.warn('[SC-FreshStation] syncMiniPlayer exception:', e);
        }
        try {
            syncMediaSession();
        } catch (e) {
            console.warn('[SC-FreshStation] syncMediaSession exception:', e);
        }
    }, 500);

    // マージン付き再生監視＆安全自動スキップ
    // ユーザー自身が意図して開いているライブラリ・Likes一覧・自作プレイリストページかを判定
    function isExplicitLibraryPage() {
        try {
            const path = window.location.pathname.toLowerCase();
            // 自分のライブラリ（/you/likes, /you/sets, /you/history など）
            if (path.indexOf('/you/') === 0) return true;
            // 自分のプロフィールの Likes / プレイリスト（/自分のpermalink/likes, /自分のpermalink/sets/...）
            if (state.myPermalink && (path.indexOf('/' + state.myPermalink + '/likes') === 0 || path.indexOf('/' + state.myPermalink + '/sets') === 0)) {
                return true;
            }
        } catch (e) {}
        return false;
    }

    // ---- 発掘モードの除外判定（曲の切替通知と定期監視の両方から使う共通処理） ----
    function toNumId(v) {
        return FreshDigCore.toNumId(v);
    }

    // info: { id, artistId, title, artistName, genre }。スキップすべきなら理由のキー（skipReason...）、しないなら null
    // 判定の中身は freshdig_core.js（Node でテスト済み）
    function getSkipReason(info) {
        if (state.robotBlocked) return null;
        const details = FreshDigCore.getSkipReasonDetails(info, {
            discoveryEnabled: state.discoveryEnabled,
            playbackMode: state.playbackMode,
            dislikedTracks: state.dislikedTracks,
            dislikedArtists: state.dislikedArtists,
            dislikedGenres: state.dislikedGenres,
            myUserId: state.myUserId,
            likedTrackIds: state.likedTrackIds,
            followingUserIds: state.followingUserIds,
            inLibrary: isExplicitLibraryPage(),
            onArtistPage: isOnLaterArtistPage()
        });
        if (details) {
            if (info && typeof info === 'object') {
                info._matchedRuleKey = details.key;
            }
            return details.reason;
        }
        if (!state.discoveryEnabled || state.playbackMode !== 'DISCOVERY') return null;
        const fresh = getFreshReason(info);
        if (fresh && info && typeof info === 'object') {
            info._matchedRuleKey = 'fresh';
        }
        return fresh;
    }

    // ---- R10: フレッシュさで飛ばす（既定 OFF。ほかの規則の後に見る） ----
    const FRESH_FILTER_KEY = 'sc_fresh_station_fresh_filter';
    const AUTHOR_STATS_KEY = 'sc_fresh_station_author_stats_v1';
    const FRESH_LATE_SKIP_SEC = 2; // 数字が遅れて分かったとき、再生開始からこの秒数以内なら飛ばす
    const AUTHOR_STATS_TTL = 7 * 86400000;
    const AUTHOR_STATS_MAX = 5000;
    const authorStats = { map: null, pending: {}, pendingCount: 0, saveTimer: null };

    try { state.freshFilter = FreshDigCore.normalizeFreshFilter(JSON.parse(localStorage.getItem(FRESH_FILTER_KEY) || 'null')); }
    catch (e) { state.freshFilter = FreshDigCore.normalizeFreshFilter(null); }

    function loadAuthorStats() {
        if (!authorStats.map) {
            let raw = {};
            try { raw = JSON.parse(localStorage.getItem(AUTHOR_STATS_KEY) || '{}') || {}; } catch (e) {}
            authorStats.map = FreshDigCore.pruneAuthorStats(raw, Date.now(), AUTHOR_STATS_TTL, AUTHOR_STATS_MAX);
        }
        return authorStats.map;
    }

    function saveAuthorStatsSoon() {
        if (authorStats.saveTimer) return;
        authorStats.saveTimer = setTimeout(function () {
            authorStats.saveTimer = null;
            try {
                authorStats.map = FreshDigCore.pruneAuthorStats(authorStats.map, Date.now(), AUTHOR_STATS_TTL, AUTHOR_STATS_MAX);
                localStorage.setItem(AUTHOR_STATS_KEY, JSON.stringify(authorStats.map));
            } catch (e) {}
        }, 2000);
    }

    function cachedAuthorStats(id) {
        const e = id ? loadAuthorStats()[String(id)] : null;
        return e && Date.now() - e.at < AUTHOR_STATS_TTL ? { followers: e.f, trackCount: e.t } : null;
    }

    // 作者のフォロワー数・投稿曲数が曲の情報に無いときだけ users/<id> を取りに行く（apiFetch の上限を通る。同時 3 件まで）
    function fetchAuthorStats(id) {
        const key = String(id);
        if (!id || authorStats.pending[key] || authorStats.pendingCount >= 3 || state.robotBlocked) return;
        if (cachedAuthorStats(id)) return;
        authorStats.pending[key] = true;
        authorStats.pendingCount++;
        scApi('users/' + key).then(function (res) {
            return res && res.ok ? res.json() : null;
        }).then(function (u) {
            if (u && typeof u.followers_count === 'number') {
                loadAuthorStats()[key] = { f: u.followers_count, t: typeof u.track_count === 'number' ? u.track_count : undefined, at: Date.now() };
                saveAuthorStatsSoon();
                onAuthorStatsArrived(key);
            }
        }).catch(function () {}).then(function () {
            delete authorStats.pending[key];
            authorStats.pendingCount--;
        });
    }

    function getFreshReason(info) {
        const ff = state.freshFilter;
        if (!ff || !info) return null;
        if (!(ff.followers.on || ff.trackCount.on || ff.playCount.on || ff.ageDays.on)) return null;
        if (isOnLaterArtistPage()) return null; // 「後で聴く作者」のページから聴いているときは効かせない
        const stats = Object.assign({}, info.stats || {});
        const cached = cachedAuthorStats(info.artistId);
        if (cached) {
            if (stats.followers === undefined) stats.followers = cached.followers;
            if (stats.trackCount === undefined) stats.trackCount = cached.trackCount;
        }
        const needFollowers = ff.followers.on && stats.followers === undefined;
        const needTracks = ff.trackCount.on && stats.trackCount === undefined;
        if ((needFollowers || needTracks) && info.artistId) fetchAuthorStats(info.artistId);
        return FreshDigCore.getFreshSkipReasonKey(stats, ff);
    }

    // 数字が分かった時: 今の曲なら再生開始から 5 秒以内だけ飛ばす。行列の先は先読みし直す
    function onAuthorStatsArrived(artistId) {
        try {
            const sound = getScCurrentSound();
            if (sound) {
                const info = soundToTrackInfo(sound);
                const pos = getPlaybackPositionSeconds();
                if (String(info.artistId) === String(artistId) && pos && pos.position <= FRESH_LATE_SKIP_SEC && info.id && (!info.kind || info.kind === 'track')) {
                    const reason = getSkipReason(info);
                    if (reason) doAutoSkip(reason, info);
                }
            }
        } catch (e) {}
        try { scheduleQueuePrune(); } catch (e) {}
    }

    function applyFreshFilter(raw, opts) {
        state.freshFilter = FreshDigCore.normalizeFreshFilter(raw);
        try { localStorage.setItem(FRESH_FILTER_KEY, JSON.stringify(state.freshFilter)); } catch (e) {}
        if (!(opts && opts.noSync)) {
            window.postMessage({ type: 'SC_FRESH_STATION_SYNC_STORAGE', key: 'freshFilter', value: state.freshFilter }, window.location.origin);
        }
        if (!(opts && opts.noBroadcast)) fdBus.post('fresh-filter', { f: state.freshFilter });
        try { scheduleQueuePrune(); } catch (e) {}
    }
    fdBus.on('fresh-filter', function (m) { applyFreshFilter(m.f, { noSync: true, noBroadcast: true }); });

    const MAX_CONSECUTIVE_AUTO_SKIPS = 20;

    // ---- 再生待ち行列の先読み（飛ばす曲を、音を読み込む前に行列から外す / 一気に飛ぶ） ----
    // SoundCloud の再生管理モジュールの行列（getQueue().models。各要素は .sound を持つ）。
    // removeItem(item) は今の曲以外を外せ、setCurrentItem(item, opts) は行列内の好きな曲へ直接移れる。
    const QUEUE_LOOKAHEAD = 30;
    const queueWatch = { queue: null, timer: null };

    function readScQueue(pm) {
        try {
            if (!pm || typeof pm.getQueue !== 'function' || typeof pm.getCurrentQueueItem !== 'function') return null;
            const q = pm.getQueue();
            const models = q && q.models;
            if (!Array.isArray(models)) return null;
            const curPos = models.indexOf(pm.getCurrentQueueItem());
            if (curPos < 0) return null;
            const infos = models.map(function (it) {
                try {
                    const i = soundToTrackInfo(it && it.sound);
                    return (i.id && (!i.kind || i.kind === 'track')) ? i : null;
                } catch (e) { return null; }
            });
            return { q: q, models: models, curPos: curPos, infos: infos };
        } catch (e) { return null; }
    }

    function pruneQueueAhead(source) {
        if (state.robotBlocked || !state.discoveryEnabled || state.playbackMode !== 'DISCOVERY' || !state.isUserDataLoaded) return 0;
        const pm = getScPlaybackManager();
        if (!pm || typeof pm.removeItem !== 'function') return 0;
        const qi = readScQueue(pm);
        if (!qi) return 0;
        const plan = FreshDigCore.planQueueAhead(qi.infos, qi.curPos, getSkipReason, QUEUE_LOOKAHEAD);
        let removed = 0;
        const removedTracks = [];
        plan.remove.forEach(function (pos) {
            const item = qi.models[pos];
            const info = qi.infos[pos];
            try {
                pm.removeItem(item);
                removed++;
                if (info) {
                    removedTracks.push({
                        id: info.id,
                        title: info.title || '',
                        artist: info.artistName || '',
                        ruleKey: info._matchedRuleKey || ''
                    });
                }
            } catch (e) {}
        });
        if (removed) dlog('queue-prune', { removed: removed, source: source, tracks: removedTracks });
        return removed;
    }

    // 今の曲を飛ばすとき、次に流してよい曲まで一気に移る。移れたら true
    function jumpToNextAllowedInQueue() {
        try {
            const pm = getScPlaybackManager();
            if (!pm || typeof pm.setCurrentItem !== 'function') return false;
            const qi = readScQueue(pm);
            if (!qi) return false;
            const plan = FreshDigCore.planQueueAhead(qi.infos, qi.curPos, getSkipReason, QUEUE_LOOKAHEAD);
            if (plan.firstKeep < 0 || plan.firstKeep === qi.curPos + 1) return false; // 隣なら普通の「次へ」でよい
            pm.setCurrentItem(qi.models[plan.firstKeep], { seek: 0, userInitiated: false });
            dlog('queue-jump', { over: plan.firstKeep - qi.curPos - 1 });
            return true;
        } catch (e) { return false; }
    }

    function scheduleQueuePrune() {
        if (queueWatch.timer) return;
        queueWatch.timer = setTimeout(function () {
            queueWatch.timer = null;
            try { pruneQueueAhead('queue-change'); } catch (e) {}
        }, 150);
    }

    // 行列に曲が足された時（ステーションの補充など）も先読みする
    function watchScQueue() {
        try {
            const pm = getScPlaybackManager();
            const q = pm && typeof pm.getQueue === 'function' ? pm.getQueue() : null;
            if (!q || typeof q.on !== 'function' || q === queueWatch.queue) return;
            queueWatch.queue = q;
            q.on('add reset', scheduleQueuePrune);
        } catch (e) {}
    }

    // 自動スキップ実行。連続しすぎたら（全部既知などの異常時）1曲だけそのまま流す
    // 5 曲を超えて連続したら 1 回ごとに 1.5 秒空ける（短時間の大量リクエストを避ける）
    const SKIP_SLOWDOWN_AFTER = 5;
    const SKIP_SLOWDOWN_MS = 1500;
    function doAutoSkip(reason, info) {
        if (state.robotBlocked) return false;
        if (marginGuard.consecutiveSkips >= MAX_CONSECUTIVE_AUTO_SKIPS) {
            console.warn('[SC-FreshStation] ⚠️ 連続スキップが' + MAX_CONSECUTIVE_AUTO_SKIPS + '曲に達したため、この曲はそのまま再生します。');
            showGlobalToast(tt('m_streakStop'));
            dlog('skip-brake', MAX_CONSECUTIVE_AUTO_SKIPS);
            marginGuard.consecutiveSkips = 0;
            return false;
        }
        marginGuard.lastSkipTime = Date.now();
        marginGuard.consecutiveSkips++;
        recordStat('totalSkips');
        const title = (info && info.title) || '';
        const reasonText = getI18nTexts()[reason] || reason;
        console.log('[SC-FreshStation] ⏩ Auto-skip [' + reason + ']: "' + title + '" (' + ((info && info.artistName) || '') + ')');
        showGlobalToast('⏩ ' + tt('skipToastPrefix') + ' (' + reasonText + ')' + (title ? ': ' + title : ''));
        dlog('auto-skip', {
            reason: reason,
            id: info && info.id,
            title: title,
            artist: (info && info.artistName) || '',
            artistId: info && info.artistId,
            ruleKey: (info && info._matchedRuleKey) || '',
            n: marginGuard.consecutiveSkips
        });

        const run = function () {
            // 行列の先まで飛ばす曲が続くなら、1 曲ずつ「次へ」せず一気に移る（音の読み込みを減らす）
            if (jumpToNextAllowedInQueue()) return true;
            const skipBtn = document.querySelector('.playControls__next');
            if (skipBtn) {
                skipBtn.click();
                return true;
            }
            const pm = getScPlaybackManager();
            if (pm) {
                try { pm.playNext({ userInitiated: false }); return true; } catch (e) {}
            }
            return false;
        };

        if (marginGuard.consecutiveSkips > SKIP_SLOWDOWN_AFTER) {
            const expectId = info && toNumId(info.id);
            try { const pm0 = getScPlaybackManager(); if (pm0 && pm0.pauseCurrent) pm0.pauseCurrent(); } catch (e) {}
            setTimeout(function () {
                if (state.robotBlocked) return;
                // 待っている間にユーザーが別の曲へ動かしていたら何もしない
                const cur = getScCurrentSound();
                if (expectId && cur && toNumId(cur.id) !== expectId) return;
                run();
            }, SKIP_SLOWDOWN_MS);
            return true;
        }
        return run();
    }

    // ---- 曲の切替を SoundCloud 本体から即座に受け取る（再生が始まる前に判定・スキップできる） ----
    const soundChangeState = { hooked: false, decidedPath: '', decidedAt: 0 };

    function soundToTrackInfo(sound) {
        const a = (sound && sound.attributes) || {};
        const user = a.user || {};
        let path = '';
        try { path = a.permalink_url ? new URL(a.permalink_url).pathname : ''; } catch (e) {}
        const stats = {};
        if (typeof user.followers_count === 'number') stats.followers = user.followers_count;
        if (typeof user.track_count === 'number') stats.trackCount = user.track_count;
        if (typeof a.playback_count === 'number') stats.playCount = a.playback_count;
        const created = a.created_at ? Date.parse(a.created_at) : NaN;
        if (isFinite(created)) stats.createdAt = created;
        return {
            stats: stats,
            id: toNumId(sound && sound.id !== undefined ? sound.id : a.id),
            artistId: toNumId(a.user_id !== undefined ? a.user_id : user.id),
            title: a.title || '',
            artistName: user.username || '',
            artistPermalink: user.permalink || '',
            avatarUrl: user.avatar_url || '',
            genre: (a.genre || '').trim(),
            href: path,
            kind: a.kind || ''
        };
    }

    function onScCurrentSoundChanged() {
        const sound = getScCurrentSound();
        if (!sound) return;
        const info = soundToTrackInfo(sound);
        if (!info.id || (info.kind && info.kind !== 'track')) return;

        state.currentTrack = {
            id: info.id,
            title: info.title,
            artistId: info.artistId,
            artistName: info.artistName,
            artistPermalink: info.artistPermalink,
            avatarUrl: info.avatarUrl,
            genre: info.genre,
            href: info.href
        };

        // ➕ ボタンの表示（追加済みなら ✔）を今の曲に合わせる
        updatePlaylistButtonUI();
        refreshTargetPlaylistCache(false);

        // 定期監視側で同じ曲を二重判定しないよう記録
        soundChangeState.decidedPath = normalizeTrackPath(info.href);
        soundChangeState.decidedAt = Date.now();

        const reason = getSkipReason(info);
        if (reason) {
            doAutoSkip(reason, info);
        } else if (state.discoveryEnabled) {
            marginGuard.consecutiveSkips = 0;
        }
        watchScQueue();
        pruneQueueAhead('sound-change');
    }

    function hookScCurrentSoundChange() {
        if (soundChangeState.hooked) return;
        const pm = getScPlaybackManager();
        if (!pm || typeof pm.on !== 'function') return;
        try {
            pm.on('change:currentSound', function () {
                // 本体の切替処理が終わってから判定する
                setTimeout(function () {
                    try { onScCurrentSoundChanged(); } catch (e) { console.warn('[SC-FreshStation] sound change handler error:', e); }
                }, 0);
            });
            soundChangeState.hooked = true;
            console.log('[SC-FreshStation] Hooked SoundCloud track-change events (instant skip enabled)');
        } catch (e) {}
    }

    // 今の曲の再生位置（ミリ秒）。分からなければ 0
    function getPlaybackPositionMs() {
        try {
            const snd = getScCurrentSound();
            if (snd && typeof snd.currentTime === 'function') {
                const v = Number(snd.currentTime());
                return isFinite(v) && v > 0 ? v : 0;
            }
        } catch (e) {}
        return 0;
    }

    // 定期監視（フォールバック）：切替通知が使えない場合や、DOM の Like 表示での判定用
    function monitorPlaybackWithMargin() {
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        const likeBtn = document.querySelector('.playbackSoundBadge__like');

        if (!titleEl || !artistEl) return;

        const currentHref = titleEl.getAttribute('href') || '';
        const title = titleEl.getAttribute('title') || (titleEl.textContent ? titleEl.textContent.trim() : '');
        const artist = artistEl.getAttribute('title') || (artistEl.textContent ? artistEl.textContent.trim() : '');

        if (!currentHref || !title) return;

        const now = Date.now();

        // 1. 新しい曲に切り替わったことを検知
        if (currentHref !== marginGuard.lastTrackHref) {
            marginGuard.lastTrackHref = currentHref;
            marginGuard.loadStartTime = now;
            marginGuard.hasChecked = false;

            const samePath = normalizeTrackPath(currentHref);
            if (state.currentTrack && state.currentTrack.id && normalizeTrackPath(state.currentTrack.href) === samePath) {
                // 切替通知で既に曲情報を取得済み（上書きしない）
            } else {
                state.currentTrack = {
                    id: null,
                    title: title,
                    artistName: artist,
                    artistId: null,
                    href: currentHref,
                    genre: ''
                };
                ensureCurrentTrackInfo().then(function () { updatePlaylistButtonUI(); });
            }
            updatePlaylistButtonUI();
            refreshTargetPlaylistCache(false);
            return;
        }

        // 2. この曲ですでに判定完了していれば何もしない（1曲につき1回）
        if (marginGuard.hasChecked) return;

        // 3. 表示が安定するまで少し待つ
        if (now - marginGuard.loadStartTime < 800) return;

        // 4. 前回スキップ直後は待つ（連打ループ防止）
        if (now - marginGuard.lastSkipTime < 1500) return;

        // 5. ID 未解決なら最大 4 秒待つ（ID 登録の Dislike / Likes / フォロー判定のため）
        if (!(state.currentTrack && state.currentTrack.id) && now - marginGuard.loadStartTime < 4000) return;

        marginGuard.hasChecked = true;
        if (!state.discoveryEnabled || state.playbackMode !== 'DISCOVERY') return;
        // 曲の途中（再生開始から 5 秒より後）では自動スキップしない（聴いている曲を後から飛ばさない）
        if (getPlaybackPositionMs() > 5000) {
            dlog('monitor-skip-ignored-midtrack', getPlaybackPositionMs());
            return;
        }

        const pathNow = normalizeTrackPath(currentHref);
        const alreadyDecided = soundChangeState.decidedPath === pathNow && now - soundChangeState.decidedAt < 15000;

        const info = {
            id: state.currentTrack && state.currentTrack.id,
            artistId: state.currentTrack && state.currentTrack.artistId,
            title: title,
            artistName: artist,
            genre: (state.currentTrack && state.currentTrack.genre) || ''
        };

        // 切替通知で判定済みの曲は、DOM の Like 表示（Likes 一覧の上限外やその場でのライク）だけ追加確認
        let reason = alreadyDecided ? null : getSkipReason(info);
        if (!reason && !isExplicitLibraryPage() && !isOnLaterArtistPage() && likeBtn) {
            const isSelected = likeBtn.classList.contains('sc-button-selected');
            const ariaChecked = likeBtn.getAttribute('aria-checked') === 'true';
            const titleAttr = (likeBtn.getAttribute('title') || '').toLowerCase();
            if (isSelected || ariaChecked || titleAttr.indexOf('unlike') !== -1) {
                reason = 'skipReasonLiked';
            }
        }

        if (reason) {
            doAutoSkip(reason, info);
        } else if (!alreadyDecided) {
            marginGuard.consecutiveSkips = 0;
        }
    }

    // R9: FreshDig のボタンは SoundCloud の曲名欄(.playbackSoundBadge__actions)に入れず、プレイヤー部分の専用の枠に置く。
    // 常に出すのは 👎 🚫 ➕ と「⋯」。残り(🔍 📻 🪟)は「⋯」のメニューに入れる
    function ensureFreshBar() {
        const host = document.querySelector('.playControls__elements');
        if (!host) return null;
        let bar = document.getElementById('sc-fresh-station-bar');
        if (bar && bar.parentElement === host) return bar;
        if (bar) bar.remove();
        bar = document.createElement('div');
        bar.id = 'sc-fresh-station-bar';
        bar.style.cssText = 'position:relative;display:inline-flex;align-items:center;flex:0 0 auto;margin-left:8px;';
        const menu = document.createElement('div');
        menu.id = 'sc-fresh-station-menu';
        menu.style.cssText = 'display:none;position:absolute;bottom:34px;right:0;z-index:2147483645;background:#222;border:1px solid #555;border-radius:6px;padding:4px 6px 4px 1px;box-shadow:0 4px 15px rgba(0,0,0,0.5);white-space:nowrap;';
        bar.appendChild(menu);
        const more = document.createElement('button');
        more.id = 'sc-fresh-station-more-btn';
        more.type = 'button';
        more.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
        more.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #777; background: transparent; color: #ccc; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
        more.textContent = '⋯';
        more.title = 'FreshDig';
        more.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
        bar.appendChild(more);
        document.addEventListener('click', function (e) {
            if (menu.style.display !== 'none' && !bar.contains(e.target)) menu.style.display = 'none';
        }, true);
        const vol = host.querySelector('.playControls__volume');
        if (vol && vol.nextSibling) host.insertBefore(bar, vol.nextSibling); else host.appendChild(bar);
        return bar;
    }

    function injectButtons() {
        const bar = ensureFreshBar();
        if (!bar) return;
        const menuGroup = document.getElementById('sc-fresh-station-menu');   // 「⋯」の中
        const moreBtn = document.getElementById('sc-fresh-station-more-btn');
        const addMain = function (el) { bar.insertBefore(el, moreBtn); };

        // 0. 発掘モード切替ボタン (アイコン: 🔍 または 👥)
        if (!document.getElementById('sc-fresh-station-mode-btn')) {
            const modeBtn = document.createElement('button');
            modeBtn.id = 'sc-fresh-station-mode-btn';
            modeBtn.type = 'button';
            modeBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            modeBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle; transition: all 0.15s ease;';
            modeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                toggleDiscoveryEnabled();
            });
            addMain(modeBtn);
        }
        updateModeButtonUI();

        // 1. ステーション開始ボタン (アイコン: 📻)
        if (!document.getElementById('sc-fresh-station-station-btn')) {
            const stBtn = document.createElement('button');
            stBtn.id = 'sc-fresh-station-station-btn';
            stBtn.type = 'button';
            stBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            stBtn.title = getI18nTexts().barStationTitle;
            stBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #00e676; background: transparent; color: #00e676; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle; transition: all 0.15s ease;';
            stBtn.innerHTML = '📻';
            stBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                startTrackStation();
            });
            menuGroup.appendChild(stBtn);
        }

        // 2. Never Playボタン (アイコン1個: ⏭️) - この曲だけ除外
        if (!document.getElementById('sc-fresh-station-dislike-btn')) {
            const btn = document.createElement('button');
            btn.id = 'sc-fresh-station-dislike-btn';
            btn.type = 'button';
            btn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            btn.title = getI18nTexts().barDislikeTitle;
            btn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #ff5500; color: #ff5500; background: transparent; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            btn.innerHTML = '⏭️';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                handleDislikeClick();
            });
            addMain(btn);
        }

        // 3. Block Artist (Hate) ボタン (アイコン1個: 🤬) - この作者の曲すべてを除外
        if (!document.getElementById('sc-fresh-station-hate-btn')) {
            const hateBtn = document.createElement('button');
            hateBtn.id = 'sc-fresh-station-hate-btn';
            hateBtn.type = 'button';
            hateBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            hateBtn.title = getI18nTexts().barHateTitle;
            hateBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #e53935; color: #e53935; background: transparent; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            hateBtn.innerHTML = '🤬';
            hateBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                handleHateClick().then(function (r) { showGlobalToast(hateToastText(r)); });
            });
            menuGroup.appendChild(hateBtn);
        }

        // 3.5 後で聴くボタン (🧐)
        if (!document.getElementById('sc-fresh-station-later-btn')) {
            const lb = document.createElement('button');
            lb.id = 'sc-fresh-station-later-btn';
            lb.type = 'button';
            lb.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            lb.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #7e57c2; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            lb.innerHTML = '🧐';
            lb.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                toggleLater().then(showGlobalToast);
            });
            menuGroup.appendChild(lb);
            updateLaterButton();
        }

        // 4. プレイリスト一発挿入ボタン (アイコン1個: ➕)
        if (!document.getElementById('sc-fresh-station-playlist-btn')) {
            const plBtn = document.createElement('button');
            plBtn.id = 'sc-fresh-station-playlist-btn';
            plBtn.type = 'button';
            plBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            plBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #ff5500; background: #ff5500; color: #fff; font-size: 13px; font-weight: bold; cursor: pointer; line-height: 1; vertical-align: middle;';
            plBtn.innerHTML = '➕';
            
            plBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                handleAddTrackToPlaylist();
            });

            plBtn.addEventListener('contextmenu', function (e) {
                e.stopPropagation();
                e.preventDefault();
                chooseTargetPlaylistPrompt();
            });

            addMain(plBtn);
            updatePlaylistButtonUI();
        }

        // 5. ミニプレイヤー起動ボタン (アイコン1個: 🪟)
        if (!document.getElementById('sc-fresh-station-miniplayer-btn')) {
            const mpBtn = document.createElement('button');
            mpBtn.id = 'sc-fresh-station-miniplayer-btn';
            mpBtn.type = 'button';
            mpBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            mpBtn.title = getI18nTexts().barMiniPlayerTitle;
            mpBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #777; background: transparent; color: #ccc; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            mpBtn.innerHTML = '🪟';
            mpBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                toggleMiniPlayer();
            });
            addMain(mpBtn);
        }
    }

    // 言語を変えたとき: ページのボタン・開いているミニプレイヤーの文字をすぐ入れ替える（R2）
    function applyLanguage() {
        try { updatePlayerBarTitles(); } catch (e) {}
        try { updatePlaylistButtonUI(); } catch (e) {}
        try {
            if (miniPlayerWindow && !miniPlayerWindow.closed) {
                const doc = miniPlayerWindow.document;
                const tx = getI18nTexts();
                doc.title = tx.mpTitle;
                const set = function (id, key, withText) {
                    const el = doc.getElementById(id);
                    if (!el) return;
                    el.title = (tx)[key];
                    if (withText) el.textContent = (tx)[withText];
                };
                set('mp-follow', 'mpFollowBtnTitle', null);
                set('mp-station', 'mpStationBtnTitle', 'mpStationBtn');
                set('mp-prev', 'mpPrevTitle');
                set('mp-play', 'mpPlayTitle');
                set('mp-like', 'mpLikeTitle');
                set('mp-add-pl', 'mpAddPlTitle');
                set('mp-dislike', 'mpDislikeTitle');
                set('mp-hate', 'mpHateTitle');
                set('mp-vol-icon', 'volMute');
                set('mp-vol-input', 'volSliderTitle');
            }
        } catch (e) {}
        try { syncMiniPlayerUI(); } catch (e) {}
    }
    fdBus.on('lang', function (m) {
        if (!m.language || m.language === state.preferredLanguage) return;
        state.preferredLanguage = m.language;
        try { localStorage.setItem(PREFERRED_LANGUAGE_KEY, state.preferredLanguage); } catch (e) {}
        applyLanguage();
    });

    function updatePlayerBarTitles() {
        const tx = getI18nTexts();
        const stBtn = document.getElementById('sc-fresh-station-station-btn');
        if (stBtn) stBtn.title = tx.barStationTitle;
        const dislikeBtn = document.getElementById('sc-fresh-station-dislike-btn');
        if (dislikeBtn) dislikeBtn.title = tx.barDislikeTitle;
        const hateBtn = document.getElementById('sc-fresh-station-hate-btn');
        if (hateBtn) hateBtn.title = tx.barHateTitle;
        const mpBtn = document.getElementById('sc-fresh-station-miniplayer-btn');
        if (mpBtn) mpBtn.title = tx.barMiniPlayerTitle;
        updateModeButtonUI();
    }

    function updateModeButtonUI() {
        const btn = document.getElementById('sc-fresh-station-mode-btn');
        if (!btn) return;
        const tx = getI18nTexts();
        if (!state.discoveryEnabled) {
            btn.innerHTML = '🔍';
            btn.style.borderColor = '#555';
            btn.style.color = '#777';
            btn.style.background = 'transparent';
            btn.style.opacity = '0.55';
            btn.title = tx.barDiscoveryOffTitle;
            return;
        }
        btn.style.opacity = '1';
        if (state.playbackMode === 'DISCOVERY') {
            btn.innerHTML = '🔍';
            btn.style.borderColor = '#ff5500';
            btn.style.color = '#ffaa00';
            btn.style.background = 'rgba(255, 85, 0, 0.15)';
            btn.title = tx.barDiscoveryOnTitle;
        } else {
            btn.innerHTML = '👥';
            btn.style.borderColor = '#29b6f6';
            btn.style.color = '#4fc3f7';
            btn.style.background = 'rgba(41, 182, 246, 0.15)';
            btn.title = tx.barFollowingModeTitle;
        }
    }

    function saveTargetPlaylist(targetId) {
        if (!targetId) return;
        state.targetPlaylistId = String(targetId);
        try {
            localStorage.setItem(TARGET_PLAYLIST_KEY, state.targetPlaylistId);
        } catch (e) {}
        updatePlaylistButtonUI();
        refreshTargetPlaylistCache(true);
        window.postMessage({
            type: 'SC_FRESH_STATION_SYNC_STORAGE',
            key: 'targetPlaylistId',
            value: state.targetPlaylistId
        }, window.location.origin);
        console.log('[SC-FreshStation] Target playlist saved & synced to extension storage:', state.targetPlaylistId);
    }

    function savePlaybackMode(mode) {
        if (mode !== 'DISCOVERY' && mode !== 'FOLLOWING_NEW') return;
        state.playbackMode = normalizePlaybackMode(mode);
        try {
            localStorage.setItem(PLAYBACK_MODE_KEY, state.playbackMode);
        } catch (e) {}
        updateModeButtonUI();
        window.postMessage({
            type: 'SC_FRESH_STATION_SYNC_STORAGE',
            key: 'playbackMode',
            value: state.playbackMode
        }, window.location.origin);
        console.log('[SC-FreshStation] Playback mode saved & synced to extension storage:', state.playbackMode);
    }

    // 追加先プレイリストに入っている曲IDのキャッシュ（ボタンを「追加」か「外す」かで表示するため）
    const targetPlaylistCache = { playlistId: null, ids: new Set(), fetchedAt: 0, loading: false };

    function getTargetPlaylistName() {
        const found = state.myPlaylists.find(function (p) { return String(p.id) === String(state.targetPlaylistId); });
        return found ? found.title : tt('m_savedTo');
    }

    // 今の曲が追加先プレイリストに入っているか（キャッシュ基準。不明なら false）
    function isCurrentTrackInTargetPlaylist() {
        const id = state.currentTrack && toNumId(state.currentTrack.id);
        return !!(id && targetPlaylistCache.playlistId === String(state.targetPlaylistId) && targetPlaylistCache.ids.has(id));
    }

    function setTargetPlaylistCache(playlistId, ids) {
        targetPlaylistCache.playlistId = String(playlistId);
        targetPlaylistCache.ids = new Set(ids.map(toNumId).filter(Boolean));
        targetPlaylistCache.fetchedAt = Date.now();
    }

    // 追加先プレイリストの中身を取得してキャッシュ（60秒以内なら再取得しない）
    async function refreshTargetPlaylistCache(force) {
        if (!state.targetPlaylistId || targetPlaylistCache.loading) return;
        const same = targetPlaylistCache.playlistId === String(state.targetPlaylistId);
        if (!force && same && Date.now() - targetPlaylistCache.fetchedAt < 60000) return;
        if (!getAuthToken()) return;
        targetPlaylistCache.loading = true;
        try {
            const res = await scApi('playlists/' + state.targetPlaylistId);
            if (res.ok) {
                const data = await res.json();
                setTargetPlaylistCache(state.targetPlaylistId, (data.tracks || []).map(function (t) { return t.id; }));
            }
        } catch (e) {
        } finally {
            targetPlaylistCache.loading = false;
            updatePlaylistButtonUI();
        }
    }

    function updatePlaylistButtonUI() {
        const inPl = isCurrentTrackInTargetPlaylist();
        const name = state.targetPlaylistId ? getTargetPlaylistName() : '';
        const title = !state.targetPlaylistId
            ? tt('m_plBtnNoTarget')
            : (inPl
                ? tt('m_plBtnIn', { name: name })
                : tt('m_plBtnOut', { name: name }));

        const btn = document.getElementById('sc-fresh-station-playlist-btn');
        if (btn && btn.innerHTML !== '⏳') {
            btn.title = title;
            btn.innerHTML = inPl ? '✔' : '➕';
            btn.style.background = inPl ? '#00c853' : '#ff5500';
            btn.style.borderColor = inPl ? '#00c853' : '#ff5500';
        }

        if (miniPlayerWindow && !miniPlayerWindow.closed) {
            try {
                const mpBtn = miniPlayerWindow.document.getElementById('mp-add-pl');
                if (mpBtn && mpBtn.textContent !== '⏳') {
                    mpBtn.title = title;
                    mpBtn.textContent = inPl ? '✔' : '➕';
                    mpBtn.classList.toggle('in-pl', inPl);
                }
            } catch (e) {}
        }
    }

    // 画面内のプレイリスト選択パネル（prompt()/alert() はミニプレイヤーからだと裏の窓に出て見えないため）
    function showPlaylistPicker(doc, playlists, currentId) {
        doc = doc || document;
        return new Promise(function (resolve) {
            const tx = getI18nTexts();
            const old = doc.getElementById('sc-fresh-station-pl-picker');
            if (old) old.remove();

            const overlay = doc.createElement('div');
            overlay.id = 'sc-fresh-station-pl-picker';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

            const panel = doc.createElement('div');
            panel.style.cssText = 'background:#1a1a1a;color:#eee;border:1px solid #ff5500;border-radius:8px;width:min(320px,92vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,0.6);';

            const head = doc.createElement('div');
            head.textContent = tx.pickerTitle;
            head.style.cssText = 'padding:10px 12px;font-size:13px;font-weight:bold;border-bottom:1px solid #333;';
            panel.appendChild(head);

            const list = doc.createElement('div');
            list.style.cssText = 'overflow-y:auto;padding:4px 0;';
            const done = function (value) {
                doc.removeEventListener('keydown', onKey, true);
                overlay.remove();
                resolve(value);
            };
            const onKey = function (e) { if (e.key === 'Escape') done(null); };

            playlists.forEach(function (p) {
                const item = doc.createElement('button');
                item.type = 'button';
                const isCur = String(p.id) === String(currentId);
                const tCount = tx.trackCountSuffix ? (' ' + tx.trackCountSuffix) : '曲'; item.textContent = (isCur ? '★ ' : '') + p.title + ' (' + p.trackCount + tCount + ')';
                item.style.cssText = 'display:block;width:100%;text-align:left;background:' + (isCur ? 'rgba(255,85,0,0.18)' : 'transparent') + ';color:#eee;border:none;padding:7px 12px;font-size:12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                item.addEventListener('mouseenter', function () { item.style.background = '#333'; });
                item.addEventListener('mouseleave', function () { item.style.background = isCur ? 'rgba(255,85,0,0.18)' : 'transparent'; });
                item.addEventListener('click', function () { done(p); });
                list.appendChild(item);
            });
            panel.appendChild(list);

            const cancel = doc.createElement('button');
            cancel.type = 'button';
            cancel.textContent = tx.pickerCancel;
            cancel.style.cssText = 'margin:8px 12px 10px;padding:6px;background:#2a2a2a;color:#bbb;border:1px solid #444;border-radius:4px;cursor:pointer;font-size:12px;';
            cancel.addEventListener('click', function () { done(null); });
            panel.appendChild(cancel);

            overlay.addEventListener('click', function (e) { if (e.target === overlay) done(null); });
            doc.addEventListener('keydown', onKey, true);
            overlay.appendChild(panel);
            (doc.body || doc.documentElement).appendChild(overlay);
        });
    }

    async function chooseTargetPlaylistPrompt(doc) {
        doc = doc || document;
        if (!state.myPlaylists || state.myPlaylists.length === 0) {
            showGlobalToast(tt('m_plFetching'));
            await initUserData({ force: true });
        }

        if (!state.myUserId) {
            showGlobalToast(tt('m_plNoLogin'));
            return null;
        }
        if (!state.myPlaylists || state.myPlaylists.length === 0) {
            showGlobalToast(tt('m_plNone'));
            return null;
        }

        const selected = await showPlaylistPicker(doc, state.myPlaylists, state.targetPlaylistId);
        if (!selected) return null;
        saveTargetPlaylist(selected.id);
        showGlobalToast(tt('m_plTargetSet', { name: selected.title }));
        return selected;
    }

    let isAddingToPlaylist = false;

    // ➕ ボタン：今の曲が追加先に入っていなければ追加、入っていれば外す（2回目の押下で外す）
    async function handleAddTrackToPlaylist(doc) {
        if (isAddingToPlaylist) return false; // 連打による二重操作を防止
        isAddingToPlaylist = true;
        const btn = document.getElementById('sc-fresh-station-playlist-btn');
        const setBusy = function (busy) {
            if (btn) btn.innerHTML = busy ? '⏳' : btn.innerHTML;
            if (miniPlayerWindow && !miniPlayerWindow.closed) {
                try {
                    const mpBtn = miniPlayerWindow.document.getElementById('mp-add-pl');
                    if (mpBtn && busy) mpBtn.textContent = '⏳';
                } catch (e) {}
            }
        };
        try {
            const track = await ensureCurrentTrackInfo();
            if (!track || !track.id) {
                showGlobalToast(tt('m_noTrackInfo'));
                return false;
            }
            const trackId = Number(track.id);

            // 認証トークンの確認（最新の Cookie / SoundCloud 本体のトークンを使用）
            if (!(await waitForAuthToken(1500))) {
                showGlobalToast(tt('m_loginToken'));
                return false;
            }

            // 追加先プレイリストのチェック
            if (!state.targetPlaylistId) {
                showGlobalToast(tt('m_pickTarget'));
                const selected = await chooseTargetPlaylistPrompt(doc);
                if (!selected) {
                    showGlobalToast(tt('m_plAborted'));
                    return false;
                }
            }

            setBusy(true);

            // 最新のプレイリストの中身を見て、追加か削除かを決める（キャッシュだけで判断しない）
            const toggleInPlaylist = async function (plId) {
                const plRes = await scApi('playlists/' + plId);
                if (plRes.status === 401 || plRes.status === 403) return { authError: true, status: plRes.status };
                if (!plRes.ok) return { notFound: true, status: plRes.status };

                const plData = await plRes.json();
                const plTitle = plData.title || tt('m_plDefaultName');
                const currentTrackIds = (plData.tracks || []).map(function (t) { return Number(t.id); }).filter(function (id) { return id > 0; });
                const isIn = currentTrackIds.indexOf(trackId) !== -1;

                let nextIds;
                if (isIn) {
                    nextIds = currentTrackIds.filter(function (id) { return id !== trackId; });
                } else {
                    if (currentTrackIds.length >= 500) return { full: true, plTitle: plTitle };
                    nextIds = currentTrackIds.concat([trackId]);
                }

                const putRes = await scApi('playlists/' + plId, {
                    method: 'PUT',
                    body: { playlist: { tracks: nextIds } }
                });
                if (putRes.ok) {
                    setTargetPlaylistCache(plId, nextIds);
                    return { success: true, removed: isIn, plTitle: plTitle, count: nextIds.length };
                }
                if (putRes.status === 401 || putRes.status === 403) return { authError: true, status: putRes.status };
                return { failed: true, status: putRes.status };
            };

            let res = await toggleInPlaylist(state.targetPlaylistId);

            // プレイリストが見つからない（削除済み・別アカウントのID等）なら再選択して再試行
            if (res.notFound) {
                showGlobalToast(tt('m_plTargetMissing'));
                const newSelected = await chooseTargetPlaylistPrompt(doc);
                if (!newSelected) {
                    showGlobalToast(tt('m_plNoTargetAbort'));
                    return false;
                }
                res = await toggleInPlaylist(state.targetPlaylistId);
            }

            if (res.authError) {
                showGlobalToast(tt('m_authFail', { s: res.status }));
                return false;
            }
            if (res.full) {
                showGlobalToast(tt('m_plFull', { name: res.plTitle }));
                return false;
            }
            if (res.success) {
                const pl = state.myPlaylists.find(function (p) { return String(p.id) === String(state.targetPlaylistId); });
                if (pl) pl.trackCount = res.count;
                if (res.removed) {
                    console.log('[SC-FreshStation] Removed track ' + trackId + ' from playlist ' + state.targetPlaylistId);
                    showGlobalToast(tt('m_plRemoved', { track: track.title, name: res.plTitle }));
                } else {
                    console.log('[SC-FreshStation] Added track ' + trackId + ' to playlist ' + state.targetPlaylistId);
                    recordStat('totalPlaylistAdds');
                    showGlobalToast(tt('m_plAdded', { track: track.title, name: res.plTitle }));
                }
                return true;
            }
            showGlobalToast(tt('m_plUpdateFail', { s: res.status }));
            return false;
        } catch (err) {
            console.error('[SC-FreshStation] Failed to update playlist:', err);
            showGlobalToast(tt('m_error', { msg: err.message }));
            return false;
        } finally {
            isAddingToPlaylist = false;
            if (btn && btn.innerHTML === '⏳') btn.innerHTML = '➕';
            try {
                const mpBtn = miniPlayerWindow && !miniPlayerWindow.closed && miniPlayerWindow.document.getElementById('mp-add-pl');
                if (mpBtn && mpBtn.textContent === '⏳') mpBtn.textContent = '➕';
            } catch (e) {}
            updatePlaylistButtonUI();
        }
    }

    async function ensureCurrentTrackInfo() {
        // 呼び出し時点で再生中の曲。await 中に曲が変わった場合、古い曲の解決結果で state を上書きしない
        const startHref = getPlayingTrackHref();
        const isStillSameTrack = function () {
            return normalizeTrackPath(getPlayingTrackHref()) === normalizeTrackPath(startHref);
        };

        // すでに有効な ID があれば即座に返す（ただし再生中の曲と一致する場合のみ）
        if (state.currentTrack && state.currentTrack.id &&
            (!startHref || !state.currentTrack.href || normalizeTrackPath(state.currentTrack.href) === normalizeTrackPath(startHref))) {
            return state.currentTrack;
        }

        // 0. SoundCloud 本体の再生管理から現在の曲を取得（最も確実・同期）
        try {
            const sound = getScCurrentSound();
            if (sound) {
                const info = soundToTrackInfo(sound);
                if (info.id && (!startHref || normalizeTrackPath(info.href) === normalizeTrackPath(startHref))) {
                    state.currentTrack = {
                        id: info.id,
                        title: info.title,
                        artistId: info.artistId,
                        artistName: info.artistName,
                        artistPermalink: info.artistPermalink,
                        avatarUrl: info.avatarUrl,
                        genre: info.genre,
                        href: info.href
                    };
                    return state.currentTrack;
                }
            }
        } catch (e) {}

        // 1. React Fiber / Internal Props から瞬時に track オブジェクトを取得（同期・高速）
        try {
            const probeSelectors = [
                '.playbackSoundBadge',
                '.playbackSoundBadge__like',
                '.playbackSoundBadge__titleLink',
                '.playbackSoundBadge__actions',
                '.playControls'
            ];
            for (const sel of probeSelectors) {
                const el = document.querySelector(sel);
                if (!el) continue;

                const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
                const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));

                let sound = null;
                if (propsKey && el[propsKey]) {
                    const p = el[propsKey];
                    sound = p.sound || p.track || p.currentSound || (p.children && p.children.props && (p.children.props.sound || p.children.props.track));
                }
                if (!sound && fiberKey && el[fiberKey]) {
                    let curr = el[fiberKey];
                    let depth = 0;
                    while (curr && depth < 12) {
                        const memo = curr.memoizedProps;
                        if (memo) {
                            sound = memo.sound || memo.track || memo.currentSound;
                            if (sound && sound.id) break;
                        }
                        curr = curr.return;
                        depth++;
                    }
                }

                if (sound && sound.id) {
                    state.currentTrack = {
                        id: sound.id,
                        title: sound.title || (state.currentTrack && state.currentTrack.title) || '',
                        artistId: sound.user ? sound.user.id : sound.user_id,
                        artistName: sound.user ? (sound.user.username || sound.user.name) : 'Unknown',
                        genre: (sound.genre || '').trim(),
                        href: sound.permalink_url ? new URL(sound.permalink_url).pathname : (sound.permalink || '')
                    };
                    console.log('[SC-FreshStation] Resolved track info via React Fiber from ' + sel + ':', state.currentTrack.id, state.currentTrack.title);
                    return state.currentTrack;
                }
            }
        } catch (e) {
            console.warn('[SC-FreshStation] React Fiber track extraction skipped:', e);
        }

        // 2. DOMからタイトル・アーティスト・href を取得
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        const href = titleEl ? titleEl.getAttribute('href') : (state.currentTrack ? state.currentTrack.href : null);
        const title = titleEl ? (titleEl.getAttribute('title') || (titleEl.textContent ? titleEl.textContent.trim() : '')) : (state.currentTrack ? state.currentTrack.title : '');
        const artistName = artistEl ? (artistEl.getAttribute('title') || (artistEl.textContent ? artistEl.textContent.trim() : '')) : (state.currentTrack ? state.currentTrack.artistName : '');

        if (!state.currentTrack) {
            state.currentTrack = { id: null, title: title, artistName: artistName, artistId: null, href: href, genre: '' };
        } else {
            if (title && !state.currentTrack.title) state.currentTrack.title = title;
            if (artistName && !state.currentTrack.artistName) state.currentTrack.artistName = artistName;
            if (href && !state.currentTrack.href) state.currentTrack.href = href;
        }

        // 3. clientId の確保
        if (!state.clientId) {
            await discoverClientId();
        }

        // 4. /resolve API による確実な解決（401/403時は公開APIとして即リトライ）
        if (href && state.clientId) {
            try {
                const fullUrl = href.startsWith('http') ? href : ('https://soundcloud.com' + href);
                const resolveUrl = 'https://api-v2.soundcloud.com/resolve?url=' + encodeURIComponent(fullUrl) + '&client_id=' + state.clientId;
                extractAuthTokenFromCookie();

                let rRes = await apiFetch(resolveUrl, {
                    headers: state.oauthToken ? { 'Authorization': state.oauthToken } : {},
                    credentials: 'include'
                });

                // 認証エラー(401/403)なら、Authorizationヘッダーを外して公開APIとして即リトライ！
                if (!rRes.ok && (rRes.status === 401 || rRes.status === 403)) {
                    console.warn('[SC-FreshStation] Resolve with token returned ' + rRes.status + ', retrying as public request...');
                    requestAuthFromExtension();
                    rRes = await apiFetch(resolveUrl, {
                        credentials: 'include'
                    });
                }

                if (rRes.ok) {
                    const rData = await rRes.json();
                    if (rData && rData.id) {
                        const resolved = {
                            id: rData.id,
                            title: rData.title || title,
                            artistId: rData.user ? rData.user.id : rData.user_id,
                            artistName: rData.user ? (rData.user.username || rData.user.name) : artistName,
                            genre: (rData.genre || '').trim(),
                            href: href
                        };
                        if (!isStillSameTrack()) {
                            console.log('[SC-FreshStation] Track changed during /resolve; not overwriting current track:', resolved.id);
                            return resolved;
                        }
                        state.currentTrack = resolved;
                        console.log('[SC-FreshStation] Resolved track info via /resolve API:', state.currentTrack.id, state.currentTrack.title);
                        return state.currentTrack;
                    }
                }
            } catch (e) {
                console.warn('[SC-FreshStation] API resolve error:', e);
            }
        }

        // 5. DOM上のデータ属性からの探索 (data-sound-id / data-track-id)
        try {
            const activeItems = document.querySelectorAll('.soundList__item.active, .soundList__item.playing, .sound.playing');
            for (const item of activeItems) {
                const sid = item.getAttribute('data-sound-id') || item.getAttribute('data-track-id');
                if (sid && isStillSameTrack()) {
                    state.currentTrack.id = sid;
                    console.log('[SC-FreshStation] Resolved track ID via DOM attribute:', sid);
                    return state.currentTrack;
                }
            }
        } catch (e) {}

        return state.currentTrack;
    }

    const NEVER_PLAY_PLAYLIST_PREFIX = '[FreshDig] NoPlay';
    const LEGACY_NEVER_PLAY_PLAYLIST_PREFIX = '[FreshDig] Never Play';
    const LEGACY_DISLIKE_PLAYLIST_PREFIX = '[FreshDig] Disliked Tracks';

    function recordStat(type) {
        try {
            const key = 'sc_fresh_station_stats_v1';
            let stats = {};
            try { stats = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
            stats[type] = (stats[type] || 0) + 1;
            localStorage.setItem(key, JSON.stringify(stats));
        } catch (e) {}
    }

    function getStats() {
        try {
            return JSON.parse(localStorage.getItem('sc_fresh_station_stats_v1')) || { totalSkips: 0, totalPlaylistAdds: 0, totalNoPlays: 0 };
        } catch (e) {
            return { totalSkips: 0, totalPlaylistAdds: 0, totalNoPlays: 0 };
        }
    }

    // NoPlay 曲を SoundCloud プレイリストにエクスポート（500曲上限を連番プレイリストで自動突破）
    async function exportDislikesToPlaylist() {
        if (!(await waitForAuthToken(1500))) {
            return { success: false, message: tt('m_exLogin') };
        }

        // 数値トラックIDを収集
        const trackIds = [];
        for (const key of Object.keys(state.dislikedTracks)) {
            const numId = parseInt(key, 10);
            if (!isNaN(numId) && numId > 0 && String(numId) === String(key).trim()) {
                trackIds.push(numId);
            }
        }

        if (trackIds.length === 0) {
            return { success: false, message: tt('m_exNone') };
        }

        try {
            await initUserData({ force: true });
            if (!state.myUserId) {
                return { success: false, message: tt('m_connectFail') };
            }

            // すでに SoundCloud にある NoPlay プレイリスト（連番・旧名も）を番号順に集める
            // 1 番目: "[FreshDig] NoPlay" / "[FreshDig] Never Play" / "[FreshDig] Disliked Tracks"、2 番目以降: 末尾に " 2", " 3" ...
            const familyRe = /^\[freshdig\] (?:noplay|never play)(?: (\d+))?$/i;
            const existingByNo = {};
            state.myPlaylists.forEach(function (p) {
                const title = String(p.title || '').trim();
                let no = null;
                const m = title.match(familyRe);
                if (m) no = m[1] ? parseInt(m[1], 10) : 1;
                else if (title.toLowerCase() === LEGACY_DISLIKE_PLAYLIST_PREFIX.toLowerCase()) no = 1;
                if (no && !existingByNo[no]) existingByNo[no] = p;
            });

            // SoundCloud 側の曲 + 手元の曲を合わせる（別の PC で登録した曲を消さないため）
            const mergedIds = [];
            const seen = new Set();
            const pushId = function (v) {
                const n = toNumId(v);
                if (n && !seen.has(n)) { seen.add(n); mergedIds.push(n); }
            };
            const existingNos = Object.keys(existingByNo).map(Number).sort(function (a, b) { return a - b; });
            for (const no of existingNos) {
                const plRes = await scApi('playlists/' + existingByNo[no].id);
                if (!plRes.ok) {
                    // 読めないプレイリストを上書きすると曲が消えるので、ここで止める
                    return { success: false, message: tt('m_exPlFail', { s: plRes.status }) };
                }
                const plData = await plRes.json();
                (plData.tracks || []).forEach(function (t) { pushId(t && t.id); });
            }
            trackIds.forEach(pushId);

            // 500曲単位に分割（SoundCloud のプレイリスト上限が 500 曲）
            const chunkSize = 500;
            const chunks = [];
            for (let i = 0; i < mergedIds.length; i += chunkSize) {
                chunks.push(mergedIds.slice(i, i + chunkSize));
            }

            let failStatus = null;
            for (let idx = 0; idx < chunks.length; idx++) {
                const no = idx + 1;
                const plTitle = no === 1 ? NEVER_PLAY_PLAYLIST_PREFIX : (NEVER_PLAY_PLAYLIST_PREFIX + ' ' + no);
                const existingPl = existingByNo[no];
                const res = existingPl
                    ? await scApi('playlists/' + existingPl.id, {
                        method: 'PUT',
                        body: { playlist: { title: plTitle, tracks: chunks[idx] } }
                    })
                    : await scApi('playlists', {
                        method: 'POST',
                        body: { playlist: { title: plTitle, sharing: 'private', tracks: chunks[idx] } }
                    });
                if (!res.ok) {
                    failStatus = res.status;
                    break;
                }
            }

            await initUserData({ force: true });
            if (failStatus !== null) {
                return { success: false, message: tt('m_exUpdateFail', { s: failStatus }) };
            }
            if (chunks.length === 1) {
                return { success: true, message: tt('m_exCreated', { name: NEVER_PLAY_PLAYLIST_PREFIX, n: mergedIds.length }) };
            }
            return {
                success: true,
                message: tt('m_exMultiDone', { name: NEVER_PLAY_PLAYLIST_PREFIX, c: chunks.length, n: mergedIds.length })
            };
        } catch (e) {
            console.error('[SC-FreshStation] Export NoPlay error:', e);
            return { success: false, message: tt('m_errorOcc', { msg: e.message }) };
        }
    }

    // 全連番プレイリストから NoPlay 曲を一括インポート
    async function importDislikesFromPlaylist() {
        if (!(await waitForAuthToken(1500))) {
            return { success: false, message: tt('m_imLogin') };
        }

        try {
            await initUserData({ force: true });
            if (!state.myUserId) {
                return { success: false, message: tt('m_connectFail') };
            }

            // [FreshDig] NoPlay または [FreshDig] Never Play または [FreshDig] Disliked Tracks または dislike を含む全プレイリストを探索
            const matchingPls = state.myPlaylists.filter(function (p) {
                const t = (p.title || '').toLowerCase();
                return t.includes('noplay') || t.includes('never play') || t.includes('disliked tracks') || t.includes('dislike');
            });

            if (matchingPls.length === 0) {
                return { success: false, message: tt('m_imNotFound', { name: NEVER_PLAY_PLAYLIST_PREFIX }) };
            }

            let totalTracks = 0;
            let importedCount = 0;

            for (const pl of matchingPls) {
                const res = await scApi('playlists/' + pl.id);
                if (!res.ok) continue;
                const plData = await res.json();
                const tracks = plData.tracks || [];
                totalTracks += tracks.length;

                tracks.forEach(function (track) {
                    if (track && track.id) {
                        const key = String(track.id);
                        if (!state.dislikedTracks[key]) {
                            importedCount++;
                            state.dislikedTracks[key] = {
                                title: track.title || ('Track ' + key),
                                artist: track.user ? track.user.username : '',
                                genre: track.genre || '',
                                date: new Date().toLocaleDateString()
                            };
                        }
                    }
                });
            }

            saveDislikeData();
            if (matchingPls.length === 1) {
                return { success: true, message: tt('m_imDone', { name: matchingPls[0].title, n: totalTracks, c: importedCount }) };
            }
            return {
                success: true,
                message: tt('m_imMultiDone', { c: matchingPls.length, n: totalTracks, added: importedCount })
            };
        } catch (e) {
            console.error('[SC-FreshStation] Import Never Play error:', e);
            return { success: false, message: tt('m_errorOcc', { msg: e.message }) };
        }
    }

    async function handleDislikeClick() {
        const btn = document.getElementById('sc-fresh-station-dislike-btn');
        if (btn) {
            btn.style.background = '#ff5500';
            btn.style.color = '#fff';
            setTimeout(function () {
                btn.style.background = 'transparent';
                btn.style.color = '#ff5500';
            }, 500);
        }

        const t = await ensureCurrentTrackInfo();
        const title = (t && t.title) ? t.title : (document.querySelector('.playbackSoundBadge__titleLink')?.getAttribute('title') || 'Unknown');
        const artist = (t && t.artistName) ? t.artistName : (document.querySelector('.playbackSoundBadge__lightLink')?.getAttribute('title') || 'Unknown');
        const trackKey = (t && t.id) ? t.id : ('title_' + encodeURIComponent(title));

        state.dislikedTracks[trackKey] = {
            title: title,
            artist: artist,
            genre: (t && t.genre) ? t.genre : '',
            date: new Date().toLocaleDateString()
        };

        saveDislikeData();
        recordStat('totalNoPlays');
        console.log('[SC-FreshStation] 👎 1-Click Dislike! Track only: "' + title + '" (' + artist + '). Skipping immediately...');

        const skipBtn = document.querySelector('.playControls__next');
        if (skipBtn) {
            skipBtn.click();
        }
    }

    // 除外中の作者の記録のキー（なければ null）
    function findHatedKey(t) {
        if (!t) return null;
        const keys = [];
        if (t.artistId) keys.push(String(t.artistId));
        if (t.artistName) keys.push('artist_' + encodeURIComponent(t.artistName), t.artistName);
        for (let i = 0; i < keys.length; i++) {
            if (state.dislikedArtists[keys[i]]) return keys[i];
        }
        return null;
    }

    function getArtistPermalink(t) {
        if (t && t.artistPermalink) return String(t.artistPermalink).toLowerCase();
        try {
            const a = document.querySelector('.playbackSoundBadge__lightLink');
            if (a && a.href) return (new URL(a.href).pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
        } catch (e) {}
        return '';
    }

    // 戻り値: { added: true/false, name }。除外中の作者なら解除、そうでなければ除外してスキップ
    async function handleHateClick() {
        const t = await ensureCurrentTrackInfo();
        const artist = (t && t.artistName) ? t.artistName : (document.querySelector('.playbackSoundBadge__lightLink')?.getAttribute('title') || 'Unknown');
        const hatedKey = findHatedKey(t);
        if (hatedKey) {
            delete state.dislikedArtists[hatedKey];
            saveDislikeData();
            updateHateButtons();
            return { added: false, name: artist };
        }
        const artistKey = (t && t.artistId) ? t.artistId : ('artist_' + encodeURIComponent(artist));

        state.dislikedArtists[artistKey] = {
            name: artist,
            permalink: getArtistPermalink(t),
            date: new Date().toLocaleDateString(),
            ts: Date.now()
        };

        saveDislikeData();
        updateHateButtons();
        console.log('[SC-FreshStation] 🚫 1-Click Hate! Artist completely: "' + artist + '". Skipping immediately...');

        const skipBtn = document.querySelector('.playControls__next');
        if (skipBtn) {
            skipBtn.click();
        }
        return { added: true, name: artist };
    }

    function hateToastText(r) {
        return r && r.added ? getI18nTexts().mpToastHate : tt('m_hateOff', { name: (r && r.name) || '' });
    }

    function isCurrentArtistHated() {
        return !!findHatedKey(state.currentTrack);
    }

    // 今の曲の作者が除外中なら 🚫 を塗りつぶしの赤にする（ページのボタン）。ミニプレイヤーは syncMiniPlayerUI
    function updateHateButtons() {
        const hated = isCurrentArtistHated();
        const btn = document.getElementById('sc-fresh-station-hate-btn');
        if (btn) {
            btn.title = hated ? tt('m_hateOnTip') : getI18nTexts().barHateTitle;
            btn.style.background = hated ? '#e53935' : 'transparent';
            btn.style.color = hated ? '#fff' : '#e53935';
        }
        updateLaterButton();
        updateProfileTag();
    }

    fdBus.on('dislike-changed', function () {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                state.dislikedTracks = parsed.dislikedTracks || {};
                state.dislikedArtists = parsed.dislikedArtists || {};
                state.dislikedGenres = parsed.dislikedGenres || {};
            }
        } catch (e) {}
        try { updateHateButtons(); } catch (e) {}
    });

    // 作者のプロフィールページ: 除外中の作者には小さな札「🚫 FreshDig で除外中 [解除]」を出す
    function updateProfileTag() {
        let tag = document.getElementById('sc-fresh-station-profile-tag');
        const path = window.location.pathname;
        let key = null;
        if (FreshDigCore.isArtistPagePath(path)) {
            const seg = (path.split('/').filter(Boolean)[0] || '').toLowerCase();
            const nameEl = document.querySelector('.profileHeaderInfo__userName');
            const pageName = nameEl ? nameEl.textContent.trim() : '';
            const ks = Object.keys(state.dislikedArtists);
            for (let i = 0; i < ks.length; i++) {
                const rec = state.dislikedArtists[ks[i]] || {};
                if ((rec.permalink && String(rec.permalink).toLowerCase() === seg) ||
                    (!rec.permalink && pageName && rec.name === pageName)) { key = ks[i]; break; }
            }
            if (key && nameEl) {
                if (!tag) {
                    tag = document.createElement('span');
                    tag.id = 'sc-fresh-station-profile-tag';
                    tag.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-left:10px;padding:2px 8px;border-radius:10px;background:#e53935;color:#fff;font-size:12px;font-weight:normal;vertical-align:middle;';
                    const label = document.createElement('span');
                    label.className = 'fd-tag-label';
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'fd-tag-btn';
                    btn.style.cssText = 'border:1px solid #fff;background:transparent;color:#fff;border-radius:8px;font-size:11px;padding:0 6px;cursor:pointer;';
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const k = tag.dataset.key;
                        if (k && state.dislikedArtists[k]) {
                            delete state.dislikedArtists[k];
                            saveDislikeData();
                            updateHateButtons();
                        }
                    });
                    tag.appendChild(label);
                    tag.appendChild(btn);
                    nameEl.parentNode.insertBefore(tag, nameEl.nextSibling);
                }
                tag.dataset.key = key;
                tag.querySelector('.fd-tag-label').textContent = tt('m_profileTag');
                tag.querySelector('.fd-tag-btn').textContent = tt('m_profileUnban');
                return;
            }
        }
        if (tag) tag.remove();
    }

    // ---- R6: 後で聴く作者（保存は chrome.storage.local の laterArtists。書き込みは background.js 経由） ----
    const laterState = { map: {}, pending: {}, seq: 0 };

    function setLaterList(list) {
        const m = {};
        (Array.isArray(list) ? list : []).forEach(function (x) { if (x && x.artistId !== undefined) m[String(x.artistId)] = x; });
        laterState.map = m;
        try { updateLaterButton(); } catch (e) {}
        try { syncMiniPlayerUI(); } catch (e) {}
    }

    window.addEventListener('message', function (event) {
        if (event.source !== window || !event.data) return;
        const d = event.data;
        if (d.type === 'SC_FRESH_STATION_LATER_CHANGED') setLaterList(d.list);
        if (d.type === 'SC_FRESH_STATION_LATER_RESULT') {
            const p = laterState.pending[d.reqId];
            if (p) { delete laterState.pending[d.reqId]; p(d.result); }
        }
    });

    function laterOp(msg) {
        return new Promise(function (resolve) {
            const reqId = ++laterState.seq;
            laterState.pending[reqId] = resolve;
            setTimeout(function () {
                if (laterState.pending[reqId]) { delete laterState.pending[reqId]; resolve({ ok: false, reason: 'timeout' }); }
            }, 5000);
            window.postMessage(Object.assign({ type: 'SC_FRESH_STATION_LATER_OP', reqId: reqId }, msg), window.location.origin);
        });
    }

    function isCurrentArtistSavedLater() {
        const t = state.currentTrack;
        return !!(t && t.artistId && laterState.map[String(t.artistId)]);
    }

    // いま開いているのが「後で聴く」に入れた作者のページか（そのページから聴くときは、ライク済み・フォロー中でも飛ばさない）
    function isOnLaterArtistPage() {
        try {
            const path = window.location.pathname;
            if (!FreshDigCore.isArtistPagePath(path)) return false;
            const seg = (path.split('/').filter(Boolean)[0] || '').toLowerCase();
            if (!seg) return false;
            const vals = Object.keys(laterState.map);
            for (let i = 0; i < vals.length; i++) {
                const p = laterState.map[vals[i]] && laterState.map[vals[i]].permalink;
                if (p && String(p).toLowerCase() === seg) return true;
            }
        } catch (e) {}
        return false;
    }

    // 戻り値: 画面に出す文
    async function toggleLater() {
        const t = await ensureCurrentTrackInfo();
        if (!t || !t.artistId) return tt('m_artistLoading');
        const id = String(t.artistId);
        const name = t.artistName || '';
        if (laterState.map[id]) {
            const r = await laterOp({ op: 'remove', artistId: id });
            if (!r.ok) return tt('m_laterFail');
            delete laterState.map[id];
            updateLaterButton();
            return tt('m_laterRemoved', { name: name });
        }
        const r = await laterOp({ op: 'add', item: { artistId: id, name: name, permalink: getArtistPermalink(t), avatarUrl: t.avatarUrl || '', fromTrackTitle: t.title || '' } });
        if (!r.ok) return r.reason === 'limit' ? tt('m_laterLimit') : tt('m_laterFail');
        laterState.map[id] = { artistId: id, name: name, permalink: getArtistPermalink(t) };
        updateLaterButton();
        return tt('m_laterAdded', { name: name });
    }

    function updateLaterButton() {
        const btn = document.getElementById('sc-fresh-station-later-btn');
        if (!btn) return;
        const saved = isCurrentArtistSavedLater();
        btn.title = saved ? tt('m_laterRemoveTip') : tt('m_laterAddTip');
        btn.style.background = saved ? '#7e57c2' : 'transparent';
        btn.style.color = saved ? '#fff' : '#b39ddb';
    }

    // =========================================================================
    // 🔊 ボリューム管理 (Volume Control & Mute)
    // =========================================================================
    const VOLUME_STORAGE_KEY = 'sc_fresh_station_volume';
    let lastNonZeroVolume = 0.8;
    // SoundCloud 内部モジュールが見つからない場合のフォールバック用：最後に play() された要素
    let lastPlayedMedia = null;
    let volumePrecisionRestored = false;

    // ユーザーが本拡張で設定した音量（未設定なら null）
    function getSavedVolume() {
        try {
            const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
            if (saved !== null) {
                const v = parseFloat(saved);
                if (!isNaN(v)) return Math.max(0, Math.min(1, v));
            }
        } catch (e) {}
        return null;
    }

    // SoundCloud は音量を 0.1 刻みでしか保存しないため、再読込後に本拡張で保存した細かい値へ一度だけ戻す
    function restoreVolumePrecisionOnce(volMod) {
        if (volumePrecisionRestored || !volMod) return;
        volumePrecisionRestored = true;
        const saved = getSavedVolume();
        try {
            if (saved !== null && saved > 0 && !volMod.getMuted() && Math.abs(volMod.getVolume() - saved) <= 0.051) {
                volMod.setVolumeAndMuted({ volume: saved, muted: false });
            }
        } catch (e) {}
    }

    function getSoundCloudVolume() {
        // 1. SoundCloud 本体の音量（スライダー表示・全プレイヤーに適用される値）
        const volMod = getScVolumeModule();
        if (volMod) {
            restoreVolumePrecisionOnce(volMod);
            try { return volMod.getMuted() ? 0 : volMod.getVolume(); } catch (e) {}
        }
        // 2. フォールバック
        if (lastPlayedMedia && typeof lastPlayedMedia.volume === 'number' && !isNaN(lastPlayedMedia.volume)) {
            return lastPlayedMedia.muted ? 0 : lastPlayedMedia.volume;
        }
        const audios = document.querySelectorAll('audio');
        for (const a of audios) {
            if (typeof a.volume === 'number' && !isNaN(a.volume)) {
                return a.volume;
            }
        }
        const saved = getSavedVolume();
        return saved !== null ? saved : 0.8;
    }

    function setSoundCloudVolume(vol) {
        const v = Math.max(0, Math.min(1, Number(vol) || 0));
        dlog('freshdig-set-volume', { v: v });
        if (v > 0) {
            lastNonZeroVolume = v;
        }
        try {
            localStorage.setItem(VOLUME_STORAGE_KEY, v.toString());
        } catch (e) {}

        const volMod = getScVolumeModule();
        if (volMod) {
            // SoundCloud 本体の音量として設定 → 曲が変わっても維持され、本体スライダーとも同期する
            try {
                if (v === 0) {
                    volMod.setMuted(true);
                } else {
                    volMod.setVolumeAndMuted({ volume: v, muted: false });
                }
            } catch (e) {
                console.warn('[SC-FreshStation] SoundCloud volume module error:', e);
            }
        } else {
            // フォールバック：内部モジュールが見つからない場合は audio 要素へ直接反映
            const audios = Array.from(document.querySelectorAll('audio'));
            if (lastPlayedMedia && audios.indexOf(lastPlayedMedia) === -1) audios.push(lastPlayedMedia);
            audios.forEach(function (a) {
                try {
                    a.volume = v;
                    a.muted = v === 0;
                } catch (e) {}
            });
        }

        syncMiniPlayerVolumeUI(getSoundCloudVolume());
        return v;
    }

    function toggleSoundCloudMute() {
        const volMod = getScVolumeModule();
        if (volMod) {
            try {
                if (volMod.getMuted() || volMod.getVolume() === 0) {
                    const restore = volMod.getVolume() > 0 ? volMod.getVolume() : (lastNonZeroVolume > 0 ? lastNonZeroVolume : 0.8);
                    volMod.setVolumeAndMuted({ volume: restore, muted: false });
                    showGlobalToast(tt('m_volRestored', { n: Math.round(restore * 100) }));
                } else {
                    lastNonZeroVolume = volMod.getVolume();
                    volMod.setMuted(true);
                    showGlobalToast(tt('m_muted'));
                }
            } catch (e) {}
            syncMiniPlayerVolumeUI(getSoundCloudVolume());
            return;
        }
        const cur = getSoundCloudVolume();
        if (cur > 0) {
            lastNonZeroVolume = cur;
            setSoundCloudVolume(0);
            showGlobalToast(tt('m_muted'));
        } else {
            const restore = lastNonZeroVolume > 0 ? lastNonZeroVolume : 0.8;
            setSoundCloudVolume(restore);
            showGlobalToast(tt('m_volRestored', { n: Math.round(restore * 100) }));
        }
    }

    function syncMiniPlayerVolumeUI(vol) {
        if (!miniPlayerWindow || miniPlayerWindow.closed) return;
        try {
            const doc = miniPlayerWindow.document;
            const input = doc.getElementById('mp-vol-input');
            const fill = doc.getElementById('mp-vol-fill');
            const text = doc.getElementById('mp-vol-text');
            const icon = doc.getElementById('mp-vol-icon');

            const pct = Math.round(vol * 100);
            if (input && doc.activeElement !== input) input.value = pct;
            if (fill) fill.style.width = pct + '%';
            if (text) text.textContent = pct + '%';
            if (icon) {
                icon.textContent = vol === 0 ? '🔇' : (vol < 0.5 ? '🔉' : '🔊');
                icon.title = vol === 0 ? tt('m_unmute') : tt('volMute');
            }
        } catch (e) {}
    }

    // フォールバック時のみ：曲が変わって audio が再生された時に保存音量を再適用
    // （SoundCloud 内部モジュール経由で設定していれば、本体が全プレイヤーに適用するので何もしない）
    function applySavedVolumeTo(media) {
        if (getScVolumeModule()) return;
        const v = getSavedVolume();
        if (v === null || !media) return;
        try {
            if (Math.abs(media.volume - v) > 0.001) media.volume = v;
        } catch (err) {}
    }

    document.addEventListener('play', function (e) {
        if (e.target && e.target.tagName === 'AUDIO') {
            lastPlayedMedia = e.target;
            applySavedVolumeTo(e.target);
        }
    }, true);

    // DOM に挿入されていない Audio 要素の play はイベントが document に届かないため、play() 自体をフック
    try {
        const origMediaPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            try {
                if (this && this.tagName === 'AUDIO') {
                    lastPlayedMedia = this;
                    applySavedVolumeTo(this);
                }
            } catch (e) {}
            return origMediaPlay.apply(this, arguments);
        };
    } catch (e) {}

    function showGlobalToast(msg) {
        // 1. Mini player toast if open
        if (miniPlayerWindow && !miniPlayerWindow.closed) {
            try {
                const mpToast = miniPlayerWindow.document.getElementById('mp-toast');
                if (mpToast) {
                    mpToast.textContent = msg;
                    mpToast.classList.add('show');
                    clearTimeout(mpToast._timer);
                    mpToast._timer = setTimeout(function () { mpToast.classList.remove('show'); }, 1800);
                    return;
                }
            } catch (e) {}
        }
        // 2. Main SoundCloud window floating toast
        try {
            let toast = document.getElementById('sc-fresh-station-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'sc-fresh-station-toast';
                toast.style.cssText = 'position: fixed; bottom: 65px; left: 50%; transform: translateX(-50%); background: rgba(20,20,20,0.92); border: 1px solid #ff5500; color: #fff; font-size: 13px; font-weight: bold; padding: 7px 18px; border-radius: 20px; z-index: 100000; box-shadow: 0 4px 15px rgba(0,0,0,0.5); pointer-events: none; transition: opacity 0.25s ease; opacity: 0;';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            clearTimeout(toast._timer);
            toast._timer = setTimeout(function () {
                toast.style.opacity = '0';
            }, 2000);
        } catch (e) {}
    }

    // 発掘モードの ON/OFF（localStorage と chrome.storage.local の両方に保存）
    function setDiscoveryEnabled(enabled, options) {
        enabled = !!enabled;
        const changed = enabled !== state.discoveryEnabled;
        state.discoveryEnabled = enabled;
        try { localStorage.setItem(DISCOVERY_ENABLED_KEY, String(enabled)); } catch (e) {}
        window.postMessage({
            type: 'SC_FRESH_STATION_SYNC_STORAGE',
            key: 'discoveryEnabled',
            value: enabled
        }, window.location.origin);
        if (enabled && changed) {
            // ON にした瞬間、今の曲も判定し直す
            marginGuard.hasChecked = false;
            marginGuard.consecutiveSkips = 0;
            marginGuard.loadStartTime = Date.now();
            soundChangeState.decidedPath = '';
            setTimeout(function () {
                try { onScCurrentSoundChanged(); } catch (e) {}
            }, 0);
        }
        updateModeButtonUI();
        syncMiniPlayerUI();
        if (!(options && options.silent) || changed) {
            showGlobalToast(enabled ? tt('m_discOn') : tt('m_discOff'));
        }
        console.log('[SC-FreshStation] Discovery mode:', enabled ? 'ON' : 'OFF');
    }

    function toggleDiscoveryEnabled() {
        setDiscoveryEnabled(!state.discoveryEnabled);
    }

    // （現在未使用）発掘モード ⇔ フォロー新曲モードの切り替え。FOLLOWING_NEW_MODE_ENABLED = true で復活
    function togglePlaybackMode() {
        if (!FOLLOWING_NEW_MODE_ENABLED) {
            toggleDiscoveryEnabled();
            return;
        }
        const newMode = state.playbackMode === 'DISCOVERY' ? 'FOLLOWING_NEW' : 'DISCOVERY';
        // chrome.storage.local にも同期（しないと再読込時に拡張側の古いモードで上書きされる）
        savePlaybackMode(newMode);
        console.log('[SC-FreshStation] Toggled mode to:', newMode);

        const msg = newMode === 'DISCOVERY'
            ? tt('m_toDiscovery')
            : tt('m_toFollowing');
        showGlobalToast(msg);

        updateModeButtonUI();
        syncMiniPlayerUI();
    }

    async function startTrackStation() {
        console.log('[SC-FreshStation] startTrackStation called');

        // Step 0: トラック情報の取得を保証
        let currentTrackId = state.currentTrack && state.currentTrack.id;
        if (!currentTrackId) {
            const t = await ensureCurrentTrackInfo();
            if (t && t.id) currentTrackId = t.id;
        }

        // Step 1: DOM上のステーションボタンがあれば最優先で直接クリック
        const directStationSelectors = [
            '.playbackSoundBadge button.sc-button-station',
            '.playbackSoundBadge__actions button[title*="Station" i]',
            '.playbackSoundBadge__actions button[aria-label*="Station" i]',
            '.playbackSoundBadge__actions button[title*="ステーション"]',
            '.playbackSoundBadge__actions button[aria-label*="ステーション"]',
            '.playControls button.sc-button-station',
            'button.sc-button-station'
        ];
        for (const sel of directStationSelectors) {
            const btn = document.querySelector(sel);
            if (btn && btn.id !== 'mp-station' && btn.id !== 'sc-fresh-station-station-btn' && btn.offsetParent !== null) {
                btn.click();
                showGlobalToast(tt('m_stationStarted'));
                return { success: true, message: tt('m_stationStartedMsg') };
            }
        }

        // Step 2: プレイヤーバーの「... (More / その他)」メニューを開いてステーションを探索
        const actionsGroup = document.querySelector('.playbackSoundBadge__actions');
        if (actionsGroup) {
            actionsGroup.style.opacity = '1';
            actionsGroup.style.visibility = 'visible';
        }

        const moreBtnSelectors = [
            '.playbackSoundBadge button.sc-button-more',
            '.playbackSoundBadge__actions button.sc-button-more',
            '.playbackSoundBadge button[aria-haspopup="menu"]',
            '.playbackSoundBadge button[aria-haspopup="true"]',
            '.playbackSoundBadge__actions button[title*="More" i]',
            '.playbackSoundBadge__actions button[aria-label*="More" i]',
            '.playbackSoundBadge__actions button[title*="その他"]',
            '.playbackSoundBadge__actions button[aria-label*="その他"]',
            '.playControls button.sc-button-more',
            'button.sc-button-more'
        ];

        let moreBtn = null;
        for (const sel of moreBtnSelectors) {
            const el = document.querySelector(sel);
            if (el && el.id !== 'mp-station') {
                moreBtn = el;
                break;
            }
        }

        if (moreBtn) {
            moreBtn.click();
            let foundStationItem = null;
            for (let i = 0; i < 15; i++) {
                await new Promise(r => setTimeout(r, 40));
                const items = document.querySelectorAll('.moreActions button, .dropdownMenu button, [role="menu"] button, [role="menuitem"], .sc-popper button, .moreActions__group button, button.sc-button-station');
                for (const item of items) {
                    const text = ((item.textContent || '') + ' ' + (item.title || '') + ' ' + (item.getAttribute('aria-label') || '') + ' ' + item.className).toLowerCase();
                    if (text.includes('station') || text.includes('ステーション')) {
                        foundStationItem = item;
                        break;
                    }
                }
                if (foundStationItem) break;
            }

            if (foundStationItem) {
                foundStationItem.click();
                showGlobalToast(tt('m_stationStarted'));
                return { success: true, message: tt('m_stationStartedMsg') };
            } else {
                moreBtn.click(); // メニューを閉じる
            }
        }

        // Step 3: 現在再生中のトラックカードからステーション開始ボタンを探索
        const trackCards = document.querySelectorAll('.sound.playing, .soundList__item.active, .soundList__item.playing');
        for (const card of trackCards) {
            const cardStation = card.querySelector('button.sc-button-station, button[title*="Station" i], button[title*="ステーション"]');
            if (cardStation) {
                cardStation.click();
                showGlobalToast(tt('m_stationStarted'));
                return { success: true, message: tt('m_stationStartedMsg') };
            }
        }

        // Step 4: トラックIDによるSPAナビゲーション + 自動再生
        if (currentTrackId) {
            showGlobalToast(tt('m_stationLoading'));
            const stationUrl = '/discover/sets/track-stations:' + currentTrackId;

            // SPAリンククリックで確実にルーターをキック
            try {
                let link = document.createElement('a');
                link.href = stationUrl;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (e) {}

            setTimeout(function () {
                if (window.location.pathname.indexOf('track-stations') === -1) {
                    try {
                        window.history.pushState({}, '', stationUrl);
                        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
                    } catch (e) {
                        window.location.href = 'https://soundcloud.com' + stationUrl;
                    }
                }
            }, 120);

            // ステーション画面の再生ボタン出現を待機して自動クリック
            let playStarted = false;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 150));
                const playBtn = document.querySelector('.heroSoundTitle button.playButton, .soundTitle__playButton button, .listenSection button.sc-button-play, .sound__coverArt button.playButton, .trackItem button.sc-button-play');
                if (playBtn) {
                    playBtn.click();
                    playStarted = true;
                    showGlobalToast(tt('m_stationPlaying'));
                    break;
                }
            }
            if (!playStarted) {
                const mainPlay = document.querySelector('.playControls__play');
                if (mainPlay && !mainPlay.classList.contains('playing')) {
                    mainPlay.click();
                }
            }
            return { success: true, message: tt('m_stationStartedMsg') };
        }

        showGlobalToast(tt('m_stationNoTrack'));
        return { success: false, message: tt('m_stationNoTrackMsg') };
    }

    // =========================================================================
    // 🎵 Windows メディア操作パネル / メディアキー連携 (Media Session API)
    //    SoundCloud 本体が 再生・一時停止・前へ・次へ・±5秒シーク・曲情報 を自前で登録するため、
    //    それらは上書きしない。本体が送っていない「再生位置（シークバー）」「位置指定シーク」「停止」を補う。
    // =========================================================================
    const mediaSessionState = {
        trackHref: '',
        prevTrackArt: '',
        ownMetaTitle: '',
        ownMetaArt: '',
        handlersAt: 0
    };

    function getScPlaybackManager() {
        return findScModule('playback', function (ex) {
            return typeof ex.playNext === 'function' && typeof ex.playPrev === 'function' &&
                typeof ex.getCurrentSound === 'function' && typeof ex.pauseCurrent === 'function';
        });
    }

    // 再生中のサウンド（SoundCloud 内部モデル）。currentTime()/duration() はミリ秒、seek(ms)
    function getScCurrentSound() {
        try {
            const pm = getScPlaybackManager();
            if (!pm) return null;
            if (typeof pm.hasCurrentSound === 'function' && !pm.hasCurrentSound()) return null;
            const s = pm.getCurrentSound();
            if (s && typeof s.currentTime === 'function' && typeof s.duration === 'function' && typeof s.seek === 'function') return s;
        } catch (e) {}
        return null;
    }

    function parseClockText(text) {
        if (!text) return null;
        const parts = String(text).trim().split(':').map(function (x) { return parseInt(x, 10); });
        if (parts.length < 2 || parts.some(isNaN)) return null;
        return parts.reduce(function (acc, v) { return acc * 60 + v; }, 0);
    }

    // 再生位置を秒で取得 { position, duration }（取得できなければ null）
    function getPlaybackPositionSeconds() {
        const sound = getScCurrentSound();
        if (sound) {
            try {
                const d = sound.duration() / 1000;
                const p = sound.currentTime() / 1000;
                if (d > 0 && isFinite(d) && isFinite(p)) return { position: Math.min(Math.max(p, 0), d), duration: d };
            } catch (e) {}
        }
        const passedEl = document.querySelector('.playbackTimeline__timePassed span[aria-hidden="true"]');
        const durationEl = document.querySelector('.playbackTimeline__duration span[aria-hidden="true"]');
        const p = parseClockText(passedEl && passedEl.textContent);
        const d = parseClockText(durationEl && durationEl.textContent);
        if (p !== null && d && d > 0) return { position: Math.min(p, d), duration: d };
        return null;
    }

    // 曲の割合（0〜1）でシーク。SoundCloud 内部モデルが使えればミリ秒単位で正確に、無ければシークバーをクリック
    function seekToSoundCloudRatio(ratio) {
        ratio = Math.max(0, Math.min(1, ratio));
        const sound = getScCurrentSound();
        if (sound) {
            try {
                sound.seek(Math.floor(sound.duration() * ratio));
                return;
            } catch (e) {}
        }
        const progressWrapper = document.querySelector('.playbackTimeline__progressWrapper');
        if (progressWrapper) {
            const rect = progressWrapper.getBoundingClientRect();
            const clientX = rect.left + rect.width * ratio;
            const clientY = rect.top + rect.height / 2;
            progressWrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: clientX, clientY: clientY }));
            progressWrapper.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: clientX, clientY: clientY }));
        }
    }

    // 別タブに切り替えたときにミニプレイヤーを自動表示（Edge / Chrome の「自動ピクチャー イン ピクチャー」）
    // ブラウザは、音が鳴っているタブが裏に回った時だけこのハンドラーを呼び、その中でのみ PiP ウィンドウを開ける
    function setAutoMiniPlayer(enabled, options) {
        state.autoMiniPlayer = !!enabled;
        try { localStorage.setItem(AUTO_MINI_PLAYER_KEY, String(state.autoMiniPlayer)); } catch (e) {}
        if (!(options && options.noSync)) {
            window.postMessage({ type: 'SC_FRESH_STATION_SYNC_STORAGE', key: 'autoMiniPlayer', value: state.autoMiniPlayer }, window.location.origin);
        }
        registerAutoMiniPlayerHandler();
    }

    function registerAutoMiniPlayerHandler() {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.setActionHandler('enterpictureinpicture', state.autoMiniPlayer && ('documentPictureInPicture' in window) ? function () {
                if (miniPlayerWindow && !miniPlayerWindow.closed) return;
                openMiniPlayer({ auto: true });
            } : null);
        } catch (e) {
            // 未対応のブラウザ（'enterpictureinpicture' を知らない）では何もしない
        }
    }

    function registerExtraMediaSessionHandlers() {
        if (!('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
        registerAutoMiniPlayerHandler();
        try {
            ms.setActionHandler('seekto', function (details) {
                const pos = getPlaybackPositionSeconds();
                if (!pos || !details || typeof details.seekTime !== 'number') return;
                seekToSoundCloudRatio(details.seekTime / pos.duration);
                setTimeout(updateMediaSessionPosition, 300);
            });
        } catch (e) {}
        try {
            ms.setActionHandler('stop', function () {
                const pm = getScPlaybackManager();
                if (pm) {
                    try { pm.pauseCurrent(); return; } catch (e) {}
                }
                const btn = document.querySelector('.playControls__play.playing');
                if (btn) btn.click();
            });
        } catch (e) {}
        mediaSessionState.handlersAt = Date.now();
    }

    function updateMediaSessionPosition() {
        if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
        const pos = getPlaybackPositionSeconds();
        if (!pos) return;
        try {
            navigator.mediaSession.setPositionState({ duration: pos.duration, position: pos.position, playbackRate: 1 });
        } catch (e) {}
    }

    function getBadgeArtworkUrl() {
        const badgeImg = document.querySelector('.playbackSoundBadge__avatar span.sc-artwork');
        if (badgeImg && badgeImg.style.backgroundImage) {
            const m = badgeImg.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
            if (m) return m[1];
        }
        return '';
    }

    // 曲情報：SoundCloud 本体が設定していればそのまま。設定されていない時だけ補う
    // （以前は曲が変わるたびに上書きしており、ジャケット画像が前の曲のまま表示されることがあった）
    function syncMediaSessionMetadata() {
        if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        if (!titleEl) return;
        const href = titleEl.getAttribute('href') || '';
        const title = titleEl.getAttribute('title') || (titleEl.textContent || '').trim();
        const artist = artistEl ? (artistEl.getAttribute('title') || (artistEl.textContent || '').trim()) : '';
        const art = getBadgeArtworkUrl();

        if (href !== mediaSessionState.trackHref) {
            mediaSessionState.prevTrackArt = mediaSessionState.ownMetaArt || art;
            mediaSessionState.trackHref = href;
            mediaSessionState.ownMetaTitle = '';
            mediaSessionState.ownMetaArt = '';
            return; // 本体が曲情報を設定するのを待つ（次の周期で確認）
        }

        const current = navigator.mediaSession.metadata;
        const scSetIt = current && current.title === title && current.title !== mediaSessionState.ownMetaTitle;
        if (scSetIt) return;

        // 前の曲のジャケットがまだ残っている間は画像なしにする
        const freshArt = art && art !== mediaSessionState.prevTrackArt ? art.replace(/-t(50|120|200)x(50|120|200)\./, '-t500x500.').replace(/-large\./, '-t500x500.') : '';
        if (mediaSessionState.ownMetaTitle === title && mediaSessionState.ownMetaArt === freshArt) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || 'SoundCloud',
                artist: artist || '',
                album: '',
                artwork: freshArt ? [
                    { src: freshArt, sizes: '500x500', type: 'image/jpeg' },
                    { src: freshArt.replace('-t500x500.', '-t300x300.'), sizes: '300x300', type: 'image/jpeg' }
                ] : []
            });
            mediaSessionState.ownMetaTitle = title;
            mediaSessionState.ownMetaArt = freshArt;
        } catch (e) {}
    }

    function syncMediaSession() {
        if (!('mediaSession' in navigator)) return;
        syncMediaSessionMetadata();
        updateMediaSessionPosition();
        // 本体が曲ごとに操作ハンドラーを登録し直すため、追加分（位置指定シーク・停止）を定期的に再登録
        if (Date.now() - mediaSessionState.handlersAt > 5000) registerExtraMediaSessionHandlers();
    }

    // =========================================================================
    // 🔁 リポスト（コメント付き）
    // =========================================================================
    const REPOST_CAPTION_MAX = 140; // SoundCloud 本体のリポストコメント上限

    function isTrackReposted(trackId) {
        const id = toNumId(trackId);
        return !!(id && state.repostedTrackIds && state.repostedTrackIds.has(id));
    }

    // リポスト済みの曲IDを取得（ミニプレイヤーの表示と「解除」の判定用）
    async function syncRepostedTrackIds() {
        try {
            const ids = await fetchPagedIds('me/track_reposts/ids?limit=200', 20000, toNumId);
            if (ids) state.repostedTrackIds = ids;
        } catch (e) {}
    }

    // コメント入力パネル。送信で文字列（空文字＝コメントなし）、キャンセルで null を返す
    function showRepostCaptionDialog(doc, trackTitle) {
        doc = doc || document;
        return new Promise(function (resolve) {
            const old = doc.getElementById('sc-fresh-station-repost-dialog');
            if (old) old.remove();

            const overlay = doc.createElement('div');
            overlay.id = 'sc-fresh-station-repost-dialog';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

            const panel = doc.createElement('div');
            panel.style.cssText = 'background:#1a1a1a;color:#eee;border:1px solid #ff5500;border-radius:8px;width:min(320px,94vw);padding:8px 10px;box-sizing:border-box;box-shadow:0 8px 30px rgba(0,0,0,0.6);';

            const head = doc.createElement('div');
            head.textContent = tt('m_repostHead') + (trackTitle ? ': ' + trackTitle : '');
            head.style.cssText = 'font-size:12px;font-weight:bold;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            panel.appendChild(head);

            const ta = doc.createElement('textarea');
            ta.maxLength = REPOST_CAPTION_MAX;
            ta.rows = 3;
            ta.placeholder = tt('m_repostPh', { n: REPOST_CAPTION_MAX });
            ta.style.cssText = 'width:100%;box-sizing:border-box;resize:none;background:#111;color:#eee;border:1px solid #444;border-radius:4px;padding:5px;font-size:12px;font-family:inherit;user-select:text;';
            panel.appendChild(ta);

            const row = doc.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:6px;';
            const counter = doc.createElement('span');
            counter.style.cssText = 'flex:1;font-size:10px;color:#888;';
            const updateCounter = function () { counter.textContent = ta.value.length + ' / ' + REPOST_CAPTION_MAX; };
            updateCounter();
            ta.addEventListener('input', updateCounter);

            const mkBtn = function (label, primary) {
                const b = doc.createElement('button');
                b.type = 'button';
                b.textContent = label;
                b.style.cssText = 'flex:none;height:26px;padding:0 10px;border-radius:4px;cursor:pointer;font-size:12px;border:1px solid ' + (primary ? '#ff5500' : '#444') + ';background:' + (primary ? '#ff5500' : '#2a2a2a') + ';color:' + (primary ? '#fff' : '#bbb') + ';';
                return b;
            };
            const cancelBtn = mkBtn(tt('pickerCancel'), false);
            const sendBtn = mkBtn(tt('m_send'), true);
            row.appendChild(counter);
            row.appendChild(cancelBtn);
            row.appendChild(sendBtn);
            panel.appendChild(row);

            const done = function (value) {
                doc.removeEventListener('keydown', onKey, true);
                overlay.remove();
                resolve(value);
            };
            const onKey = function (e) {
                if (e.key === 'Escape') { e.preventDefault(); done(null); }
                // Ctrl+Enter / ⌘+Enter で送信（Enter だけだと改行）
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); done(ta.value.trim()); }
            };
            cancelBtn.addEventListener('click', function () { done(null); });
            sendBtn.addEventListener('click', function () { done(ta.value.trim()); });
            overlay.addEventListener('click', function (e) { if (e.target === overlay) done(null); });
            doc.addEventListener('keydown', onKey, true);

            overlay.appendChild(panel);
            (doc.body || doc.documentElement).appendChild(overlay);
            setTimeout(function () { try { ta.focus(); } catch (e) {} }, 0);
        });
    }

    // リポスト（コメント付きまたは通常リポスト）
    async function repostTrackWithCaption(trackId, caption, toast) {
        toast = toast || showGlobalToast;
        const numId = toNumId(trackId);
        if (!numId) return false;
        toast(tt('m_reposting'));
        try {
            const res = await scApi('me/track_reposts/' + numId, { method: 'PUT' });
            if (!res.ok) {
                dlog('repost-fail', { trackId: numId, status: res.status });
                toast(tt('m_repostFail', { s: res.status }));
                return false;
            }
            if (!state.repostedTrackIds) state.repostedTrackIds = new Set();
            state.repostedTrackIds.add(numId);
            saveCacheData();

            let verified = false;
            try {
                const chk = await scApi('me/track_reposts/ids?limit=50');
                if (chk && chk.ok) {
                    const idsData = await chk.json();
                    const list = Array.isArray(idsData) ? idsData : ((idsData && Array.isArray(idsData.collection)) ? idsData.collection : []);
                    if (list.map(toNumId).includes(numId)) {
                        verified = true;
                    }
                }
            } catch (e) {}

            const hasCaption = !!(caption && caption.trim());
            if (hasCaption) {
                try {
                    const capText = caption.trim().slice(0, REPOST_CAPTION_MAX);
                    const cRes = await scApi('me/track_reposts/' + numId + '/caption', {
                        method: 'PUT',
                        body: { caption: capText }
                    });
                    if (cRes.ok) {
                        toast(tt('m_repostedCap'));
                    } else {
                        toast(tt('m_repostCapFail', { s: cRes.status }));
                    }
                } catch (cErr) {
                    console.error('[SC-FreshStation] Repost caption error:', cErr);
                    toast(tt('m_repostCapFail', { s: 'net' }));
                }
            } else {
                toast(tt('m_reposted'));
            }
            dlog('repost', { trackId: numId, status: res.status, verified: verified, caption: hasCaption });
            return true;
        } catch (err) {
            console.error('[SC-FreshStation] Repost error:', err);
            dlog('repost-fail', { trackId: numId, error: String(err) });
            toast(tt('m_commErr'));
            return false;
        }
    }

    // =========================================================================
    // 🪟 浮遊ミニプレイヤー (Document Picture-in-Picture & Fallback)
    // =========================================================================
    let miniPlayerWindow = null;

    async function toggleMiniPlayer(options) {
        if (miniPlayerWindow && !miniPlayerWindow.closed) {
            miniPlayerWindow.close();
            miniPlayerWindow = null;
            return;
        }
        await openMiniPlayer(options);
    }

    // ページ内のクリックが無いと PiP / ポップアップは開けない（拡張機能ポップアップからの操作は「ページのクリック」扱いにならない）
    // → ページ上に「ミニプレイヤーを開く」ボタンを出して、それを押してもらう
    function showMiniPlayerLaunchPrompt() {
        const old = document.getElementById('sc-fresh-station-mp-launch');
        if (old) old.remove();
        const btn = document.createElement('button');
        btn.id = 'sc-fresh-station-mp-launch';
        btn.type = 'button';
        btn.textContent = getI18nTexts().mpPromptOpen;
        btn.style.cssText = 'position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:2147483647;background:#1a1a1a;color:#fff;border:1px solid #ff5500;border-radius:20px;padding:9px 18px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.5);';
        btn.addEventListener('click', function () {
            btn.remove();
            openMiniPlayer();
        });
        document.body.appendChild(btn);
        setTimeout(function () { if (btn.isConnected) btn.remove(); }, 12000);
    }

    async function openMiniPlayer(options) {
        const isAuto = !!(options && options.auto);
        try {
            if ('documentPictureInPicture' in window) {
                miniPlayerWindow = await window.documentPictureInPicture.requestWindow({
                    width: 350,
                    height: 195
                });
            } else {
                miniPlayerWindow = window.open(
                    '',
                    'SCFreshMiniPlayer',
                    'width=350,height=195,menubar=no,toolbar=no,location=no,status=no,resizable=no'
                );
            }

            if (!miniPlayerWindow) {
                if (!isAuto) showMiniPlayerLaunchPrompt();
                return;
            }

            const win = miniPlayerWindow;
            setupMiniPlayerUI(win.document);

            // 古いウィンドウの終了通知で、新しく開いたウィンドウの参照を消さないようにする
            const onClose = function () {
                if (miniPlayerWindow === win) miniPlayerWindow = null;
            };
            win.addEventListener('pagehide', function () { dlog('miniplayer-closed'); });
            win.addEventListener('pagehide', onClose);
            win.addEventListener('beforeunload', onClose);

            dlog('miniplayer-opened', { auto: isAuto });
            syncMiniPlayerUI();
            updatePlaylistButtonUI();
            console.log('[SC-FreshStation] 🪟 Mini Player opened successfully' + (isAuto ? ' (auto on tab switch)' : ''));
        } catch (err) {
            miniPlayerWindow = null;
            if (err && err.name === 'NotAllowedError') {
                // ページ内のクリック直後でないため開けなかった
                if (!isAuto) showMiniPlayerLaunchPrompt();
            } else {
                console.error('[SC-FreshStation] Failed to open Mini Player:', err);
            }
        }
    }

    let isSeekingInMiniPlayer = false;

    // ミニプレイヤー（Document PiP の小窓）ではブラウザ標準の title の吹き出しが出ないため、自前で出す。
    // title は 0.5 秒ごとの同期で書き直されるので、乗せた時に毎回 data-tip へ移す（標準の吹き出しと二重にならないように）
    function setupMiniPlayerTooltip(doc) {
        const tip = doc.getElementById('mp-tip');
        if (!tip) return;
        let timer = null;
        let current = null;
        const hide = function () {
            clearTimeout(timer);
            timer = null;
            current = null;
            tip.style.display = 'none';
        };
        doc.addEventListener('mouseover', function (e) {
            const el = e.target && e.target.closest ? e.target.closest('[title],[data-tip]') : null;
            if (!el || el === doc.body) { hide(); return; }
            if (el.getAttribute('title')) {
                el.dataset.tip = el.getAttribute('title');
                el.removeAttribute('title');
            }
            if (el === current) return;
            hide();
            current = el;
            timer = setTimeout(function () {
                const text = el.dataset.tip || '';
                if (!text || current !== el) return;
                tip.textContent = text;
                tip.style.display = 'block';
                const win = doc.defaultView;
                const r = el.getBoundingClientRect();
                const tw = tip.offsetWidth;
                const th = tip.offsetHeight;
                let left = Math.min(Math.max(4, r.left + r.width / 2 - tw / 2), win.innerWidth - tw - 4);
                let top = r.top - th - 4;
                if (top < 2) top = Math.min(r.bottom + 4, win.innerHeight - th - 2);
                tip.style.left = left + 'px';
                tip.style.top = top + 'px';
            }, 400);
        });
        doc.addEventListener('mouseleave', hide);
        doc.addEventListener('mousedown', hide);
    }

    function setupMiniPlayerUI(doc) {
        const tx = getI18nTexts();
        doc.title = tx.mpTitle;
        doc.body.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                body {
                    background: #141414;
                    color: #fff;
                    padding: 8px 10px 6px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 100vh;
                    overflow: hidden;
                }
                .track-info-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .artwork {
                    width: 50px;
                    height: 50px;
                    min-width: 50px;
                    border-radius: 8px;
                    background: #252525 url('https://a-v2.sndcdn.com/assets/images/default/avatar--large-3b8c34f249.png') center/cover no-repeat;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                }
                .meta {
                    flex: 1;
                    min-width: 0;
                }
                .title {
                    font-size: 13px;
                    font-weight: bold;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: #f2f2f2;
                    line-height: 1.2;
                }
                .artist {
                    font-size: 11px;
                    color: #999;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-top: 1px;
                    line-height: 1.2;
                }
                .badge-row {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 4px;
                }
                .badge-row button {
                    height: 24px;
                    width: 24px;
                    min-width: 24px;
                    border-radius: 5px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                    background: #222;
                    padding: 0;
                    font-size: 17px;
                    line-height: 1;
                    overflow: hidden;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    height: 24px;
                    padding: 0 8px;
                    border-radius: 6px;
                    background: #222;
                    border: 1px solid #ff5500;
                    color: #ffaa00;
                    white-space: nowrap;
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    line-height: 1;
                    box-sizing: border-box;
                }
                .status-badge:hover {
                    background: #ff5500;
                    color: #fff;
                    transform: scale(1.04);
                }
                .status-badge.following-mode {
                    border-color: #29b6f6;
                    background: #222;
                    color: #4fc3f7;
                }
                .status-badge.off {
                    border-color: #a259ff;
                    background: #222;
                    color: #d4a5ff;
                }
                .status-badge.off:hover {
                    background: #a259ff;
                    border-color: #a259ff;
                    color: #fff;
                }
                .status-badge.following-mode:hover {
                    background: #0288d1;
                    color: #fff;
                }
                .btn-station {
                    border: 1px solid #ff5500;
                    color: #ff7700;
                    font-size: 17px;
                }
                .btn-station:hover {
                    background: #ff5500;
                    color: #fff;
                }
                .btn-later {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 17px;
                    opacity: 0.75;
                }
                .btn-later:hover {
                    background: #333;
                    color: #fff;
                    opacity: 1;
                }
                .btn-later.saved {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                    opacity: 1;
                }
                .btn-follow {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 17px;
                    opacity: 0.75;
                }
                .btn-follow:hover {
                    background: #333;
                    color: #fff;
                    opacity: 1;
                }
                .btn-follow.following {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                    opacity: 1;
                }
                .btn-hate {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 17px;
                    opacity: 0.75;
                }
                .btn-hate:hover {
                    background: #333;
                    color: #fff;
                    opacity: 1;
                }
                .btn-hate.hated {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                    opacity: 1;
                }

                /* シークバーエリア */
                .timeline-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin: 4px 0 2px;
                }
                .time-text {
                    font-size: 9px;
                    color: #777;
                    min-width: 26px;
                    text-align: center;
                    font-variant-numeric: tabular-nums;
                }
                .seekbar-container {
                    flex: 1;
                    position: relative;
                    height: 12px;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                .seekbar-bg {
                    width: 100%;
                    height: 4px;
                    background: #2a2a2a;
                    border-radius: 2px;
                    position: relative;
                    overflow: hidden;
                }
                .seekbar-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 0%;
                    background: linear-gradient(90deg, #ff7700, #ff5500);
                    border-radius: 2px;
                    transition: width 0.1s linear;
                }
                .seekbar-input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    margin: 0;
                    z-index: 10;
                }

                /* ボリュームコントロールエリア */
                .volume-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin: 2px 0 4px;
                    padding: 0 2px;
                }
                .btn-vol-icon {
                    background: transparent;
                    border: none;
                    font-size: 13px;
                    color: #aaa;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    flex: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.15s ease;
                }
                .btn-vol-icon:hover {
                    color: #29b6f6;
                    background: transparent;
                    transform: none;
                }
                .volumebar-container {
                    flex: 1;
                    position: relative;
                    height: 12px;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                .volumebar-bg {
                    width: 100%;
                    height: 4px;
                    background: #2a2a2a;
                    border-radius: 2px;
                    position: relative;
                    overflow: hidden;
                }
                .volumebar-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 80%;
                    background: linear-gradient(90deg, #4fc3f7, #1e88e5);
                    border-radius: 2px;
                    transition: width 0.05s linear;
                }
                .volumebar-input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    margin: 0;
                    z-index: 10;
                }
                .vol-text {
                    font-size: 9px;
                    color: #777;
                    min-width: 26px;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }

                /* 一列にきれいに収まるコントロールボタン群 */
                .controls-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 3px;
                    padding-top: 2px;
                }
                button {
                    border: 1px solid #444;
                    background: #222;
                    color: #888;
                    font-size: 19px;
                    line-height: 1;
                    border-radius: 5px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                    flex: 1;
                    height: 30px;
                    padding: 0;
                    min-width: 0;
                    overflow: hidden;
                    opacity: 0.85;
                }
                button:hover {
                    background: #333;
                    color: #fff;
                    opacity: 1;
                    transform: translateY(-1px);
                }
                button:active {
                    transform: translateY(0);
                }
                .btn-play {
                    flex: 1.25;
                    background: #222;
                    border: 1px solid #444;
                    color: #888;
                    font-size: 21px;
                }
                .btn-play:hover {
                    background: #333;
                    border-color: #ff7700;
                    color: #ff7700;
                }
                .btn-play.playing {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                    opacity: 1;
                }
                .btn-play.playing:hover {
                    background: #ff7700;
                    border-color: #ff7700;
                    color: #fff;
                }
                .btn-like {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 19px;
                }
                .btn-like.liked {
                    color: #fff;
                    background: #ff5500;
                    border-color: #ff5500;
                    opacity: 1;
                }
                .btn-repost {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 19px;
                }
                .btn-repost.reposted {
                    color: #fff;
                    background: #ff5500;
                    border-color: #ff5500;
                    opacity: 1;
                }
                .btn-pl {
                    border: 1px solid #444;
                    color: #888;
                    font-weight: bold;
                    font-size: 21px;
                }
                .btn-pl:hover {
                    background: #333;
                    color: #fff;
                }
                .btn-pl.in-pl {
                    border-color: #ff5500;
                    color: #fff;
                    background: #ff5500;
                    opacity: 1;
                }
                .btn-pl.in-pl:hover {
                    background: #ff7700;
                    border-color: #ff7700;
                }
                .btn-dislike {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 18px;
                }
                .btn-dislike:hover {
                    border-color: #ff5500;
                    color: #ff5500;
                }
                .toast {
                    position: fixed;
                    bottom: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.85);
                    border: 1px solid #ff5500;
                    color: #fff;
                    font-size: 10px;
                    padding: 3px 8px;
                    border-radius: 15px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                    white-space: nowrap;
                    max-width: 94%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    z-index: 100;
                }
                .toast.show {
                    opacity: 1;
                }
            </style>
            <div class="track-info-row">
                <div class="artwork" id="mp-art"></div>
                <div class="meta">
                    <div class="title" id="mp-title">${tx.mpLoadingTrack}</div>
                    <div class="artist" id="mp-artist">SoundCloud</div>
                    <div class="badge-row">
                        <span class="status-badge" id="mp-status">${tx.mpStatusWaiting}</span>
                        <button class="btn-station" id="mp-station" title="${tx.mpStationBtnTitle}">📻</button>
                        <button class="btn-later" id="mp-later" title="">🧐</button>
                        <button class="btn-follow" id="mp-follow" title="${tx.mpFollowBtnTitle}">👤</button>
                        <button class="btn-hate" id="mp-hate" title="${tx.mpHateTitle}">🤬</button>
                    </div>
                </div>
            </div>

            <!-- シークバーエリア -->
            <div class="timeline-row">
                <span class="time-text" id="mp-time-passed">0:00</span>
                <div class="seekbar-container">
                    <div class="seekbar-bg">
                        <div class="seekbar-fill" id="mp-seekbar-fill"></div>
                    </div>
                    <input type="range" min="0" max="100" value="0" step="0.1" class="seekbar-input" id="mp-seekbar-input">
                </div>
                <span class="time-text" id="mp-time-duration">0:00</span>
            </div>

            <!-- ボリュームエリア -->
            <div class="volume-row">
                <button class="btn-vol-icon" id="mp-vol-icon" title="${tx.volMute}">🔊</button>
                <div class="volumebar-container">
                    <div class="volumebar-bg">
                        <div class="volumebar-fill" id="mp-vol-fill"></div>
                    </div>
                    <input type="range" min="0" max="100" value="80" step="1" class="volumebar-input" id="mp-vol-input" title="${tx.volSliderTitle}">
                </div>
                <span class="vol-text" id="mp-vol-text">80%</span>
            </div>

            <!-- コントロールボタン列 -->
            <div class="controls-row">
                <button id="mp-prev" title="${tx.mpPrevTitle}">⏮</button>
                <button class="btn-play" id="mp-play" title="${tx.mpPlayTitle}">⏯</button>
                <button class="btn-dislike" id="mp-dislike" title="${tx.mpDislikeTitle}">⏭️</button>
                <button class="btn-like" id="mp-like" title="${tx.mpLikeTitle}">🤍</button>
                <button class="btn-repost" id="mp-repost" title="${tx.mpRepostTitle}">🔁</button>
                <button class="btn-pl" id="mp-add-pl" title="${tx.mpAddPlTitle}">➕</button>
            </div>
            <div class="toast" id="mp-toast"></div>
            <div id="mp-tip" style="position:fixed;z-index:50;display:none;max-width:calc(100vw - 12px);background:#000;color:#fff;border:1px solid #555;border-radius:4px;padding:3px 6px;font-size:10px;line-height:1.35;pointer-events:none;white-space:normal;"></div>
        `;

        setupMiniPlayerTooltip(doc);

        function showToast(msg) {
            const toast = doc.getElementById('mp-toast');
            if (toast) {
                toast.textContent = msg;
                toast.classList.add('show');
                setTimeout(function () { toast.classList.remove('show'); }, 1500);
            }
        }

        // 操作は run() 経由。音を出している別のタブのミニプレイヤーとして動いているときは、そのタブへ送る（R4）
        function run(name, args) {
            if (mpUseRemote()) return mpRemoteCall(name, args || {});
            const fn = MP_ACTIONS[name];
            return fn ? fn(args || {}, showToast, doc) : undefined;
        }

        // 基本メディア操作
        doc.getElementById('mp-prev')?.addEventListener('click', function () { run('prev'); });
        doc.getElementById('mp-play')?.addEventListener('click', function () { run('play'); });
        doc.getElementById('mp-next')?.addEventListener('click', function () { run('next'); });

        // シーク操作
        const seekInput = doc.getElementById('mp-seekbar-input');
        const seekFill = doc.getElementById('mp-seekbar-fill');

        seekInput?.addEventListener('input', function (e) {
            isSeekingInMiniPlayer = true;
            const val = parseFloat(e.target.value);
            if (seekFill) seekFill.style.width = val + '%';
        });

        seekInput?.addEventListener('change', function (e) {
            const ratio = parseFloat(e.target.value) / 100;
            run('seek', { ratio: ratio });
            setTimeout(() => { isSeekingInMiniPlayer = false; }, 300);
        });

        // ボリューム操作
        const volInput = doc.getElementById('mp-vol-input');
        volInput?.addEventListener('input', function (e) {
            run('vol', { v: parseFloat(e.target.value) / 100 });
        });
        doc.getElementById('mp-vol-icon')?.addEventListener('click', function () { run('mute'); });

        doc.getElementById('mp-like')?.addEventListener('click', function () { run('like'); });

        // リポスト：未リポストならコメントダイアログを表示してリポスト、リポスト済みなら解除
        doc.getElementById('mp-repost')?.addEventListener('click', async function () {
            const d = mpCurrentData();
            if (d.reposted) {
                run('repost', { unrepost: true });
            } else {
                const cap = await showRepostCaptionDialog(doc, d.title || '');
                if (cap !== null) {
                    run('repost', { caption: cap });
                }
            }
        });

        doc.getElementById('mp-follow')?.addEventListener('click', function () { run('follow'); });

        // ステータスバッジ（発掘モード／フォロー新曲）クリックでモード切替（設定は全タブ共通なのでこのタブで行う）
        doc.getElementById('mp-status')?.addEventListener('click', function () {
            toggleDiscoveryEnabled();
        });

        doc.getElementById('mp-station')?.addEventListener('click', function () { run('station'); });

        // プレイリスト追加 & 設定
        const mpAddPlBtn = doc.getElementById('mp-add-pl');
        if (mpAddPlBtn) {
            mpAddPlBtn.addEventListener('click', function () { run('addPl'); });
            mpAddPlBtn.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                run('pickPl');
            });
        }
        doc.getElementById('mp-dislike')?.addEventListener('click', function () { run('dislike'); });
        doc.getElementById('mp-hate')?.addEventListener('click', function () { run('hate'); });
        doc.getElementById('mp-later')?.addEventListener('click', function () { run('later'); });
    }

    // ---- R4: 複数タブ。音を出しているタブの「今の曲」を BroadcastChannel で流し、ミニプレイヤーはそれを写す ----
    const fdRemote = { now: null, active: false, seq: 0, pending: {} };

    function isLocalPlaying() {
        const m = lastPlayedMedia;
        if (m && m.src && m.readyState > 0 && !m.ended) return !m.paused;
        const playBtn = document.querySelector('.playControls__play');
        return !!(playBtn && playBtn.classList.contains('playing'));
    }

    function formatClock(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const ss = String(sec % 60).padStart(2, '0');
        return h > 0 ? (h + ':' + String(m).padStart(2, '0') + ':' + ss) : (m + ':' + ss);
    }

    function mpToast(msg) {
        try {
            const t = miniPlayerWindow && !miniPlayerWindow.closed && miniPlayerWindow.document.getElementById('mp-toast');
            if (t) {
                t.textContent = msg;
                t.classList.add('show');
                setTimeout(function () { t.classList.remove('show'); }, 1500);
            }
        } catch (e) {}
    }

    // 自分のタブが再生中なら自分の表示。そうでなく、他のタブが最後に再生を知らせてきていればそちら
    function mpUseRemote() {
        const r = fdRemote.now;
        if (!r) return false;
        if (isLocalPlaying()) return false;
        // 他タブが再生中なら 5秒、一時停止中等でも最大 30 秒以内の心拍のみ有効とする（眠り・切断対策）
        return r.d.playing ? (Date.now() - r.at < 5000) : (Date.now() - r.at < 30000);
    }

    function mpCurrentData() {
        return mpUseRemote() ? fdRemote.now.d : localSnapshot();
    }

    function localSnapshot() {
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        const likeBtn = document.querySelector('.playbackSoundBadge__like');
        const repostBtn = document.querySelector('.playbackSoundBadge__actions button[title*="Repost"], .playbackSoundBadge__actions button[aria-label*="Repost"], .playbackSoundBadge__repost');

        const title = (state.currentTrack && state.currentTrack.title) || (titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : '') || tt('m_notPlaying');
        const artist = (state.currentTrack && state.currentTrack.artistName) || (artistEl ? (artistEl.getAttribute('title') || artistEl.textContent) : '') || 'SoundCloud';

        let art = '';
        const badgeImg = document.querySelector('.playbackSoundBadge__avatar span.sc-artwork');
        if (badgeImg && badgeImg.style.backgroundImage) {
            const m = badgeImg.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
            if (m) art = m[1];
        }
        if (art) art = art.replace(/-t(50|120|200)x(50|120|200)\./, '-t200x200.').replace(/-large\./, '-t200x200.');

        const trackId = state.currentTrack && state.currentTrack.id;
        let reposted = isTrackReposted(trackId);
        if (!reposted && repostBtn) reposted = repostBtn.classList.contains('sc-button-selected') || repostBtn.getAttribute('aria-checked') === 'true';

        let following = null;
        if (state.currentTrack && state.currentTrack.artistId) following = state.followingUserIds.has(state.currentTrack.artistId);

        const timePassedEl = document.querySelector('.playbackTimeline__timePassed span[aria-hidden="true"]');
        const durationEl = document.querySelector('.playbackTimeline__duration span[aria-hidden="true"]');
        const progressBar = document.querySelector('.playbackTimeline__progressWrapper');
        let ratio = 0;
        if (progressBar) {
            const ariaVal = parseFloat(progressBar.getAttribute('aria-valuenow'));
            const ariaMax = parseFloat(progressBar.getAttribute('aria-valuemax')) || 1;
            if (!isNaN(ariaVal) && ariaMax > 0) ratio = Math.min(1, Math.max(0, ariaVal / ariaMax));
        }

        // 元のページが裏にあると画面の時間表示が止まるので、再生管理から直接読む
        let passed = timePassedEl ? timePassedEl.textContent.trim() : '0:00';
        let duration = durationEl ? durationEl.textContent.trim() : '0:00';
        try {
            const pos = getPlaybackPositionSeconds();
            if (pos && pos.duration > 0) {
                passed = formatClock(pos.position);
                duration = formatClock(pos.duration);
                ratio = Math.min(1, Math.max(0, pos.position / pos.duration));
            }
        } catch (e) {}

        return {
            title: title,
            artist: artist,
            art: art,
            playing: isLocalPlaying(),
            liked: !!(likeBtn && (likeBtn.classList.contains('sc-button-selected') || likeBtn.getAttribute('aria-checked') === 'true')),
            hasLikeBtn: !!likeBtn,
            reposted: !!reposted,
            following: following,
            passed: passed,
            duration: duration,
            ratio: ratio,
            hated: isCurrentArtistHated(),
            later: isCurrentArtistSavedLater(),
            vol: getSoundCloudVolume()
        };
    }

    // 音を出しているタブが 0.5 秒ごとに呼ぶ（再生が止まってもそのタブが「最後に鳴らしたタブ」の間は流し続ける）
    function broadcastNow() {
        if (isLocalPlaying()) fdRemote.active = true;
        if (!fdRemote.active) return;
        fdBus.post('now', { d: localSnapshot() });
    }

    fdBus.on('now', function (m) {
        if (!m.d) return;
        if (m.d.playing) {
            fdRemote.active = false;       // 他のタブが鳴らし始めた
            fdRemote.now = { tabId: m.fromTabId, at: Date.now(), d: m.d };
        } else if (!fdRemote.now || fdRemote.now.tabId === m.fromTabId) {
            fdRemote.now = { tabId: m.fromTabId, at: Date.now(), d: m.d };
        }
    });

    fdBus.on('bye', function (m) {
        if (fdRemote.now && fdRemote.now.tabId === m.fromTabId) fdRemote.now = null;
    });

    window.addEventListener('pagehide', function () {
        if (fdRemote.active) fdBus.post('bye');
    });

    // ミニプレイヤーの操作を、音を出しているタブへ送る
    function mpRemoteCall(name, args) {
        const r = fdRemote.now;
        if (!r) return;
        const id = ++fdRemote.seq;
        fdRemote.pending[id] = true;
        fdBus.post('cmd', { to: r.tabId, id: id, name: name, args: args });
        setTimeout(function () {
            if (!fdRemote.pending[id]) return;
            delete fdRemote.pending[id];
            if (fdRemote.now && fdRemote.now.tabId === r.tabId) fdRemote.now = null;
            mpToast(tt('m_tabNoReply'));
            // 相手タブが応答しなかったため、自タブでフォールバック実行を試みる
            const localFn = MP_ACTIONS[name];
            if (localFn) {
                try {
                    const res = localFn(args || {}, mpToast, null);
                    if (res && typeof res.catch === 'function') res.catch(function () {});
                } catch (e) {}
            }
        }, 1500);
    }

    fdBus.on('cmd', function (m) {
        if (m.to !== TAB_ID) return;
        fdBus.post('cmd-ack', { to: m.fromTabId, id: m.id });
        const fn = MP_ACTIONS[m.name];
        if (!fn) return;
        const reply = function (text) { fdBus.post('cmd-toast', { to: m.fromTabId, text: text }); };
        try {
            const r = fn(m.args || {}, reply, null);
            if (r && typeof r.catch === 'function') r.catch(function (e) { dlog('remote-cmd-error', m.name + ' ' + (e && e.message)); });
        } catch (e) { dlog('remote-cmd-error', m.name + ' ' + (e && e.message)); }
    });
    fdBus.on('cmd-ack', function (m) {
        if (m.to === TAB_ID) delete fdRemote.pending[m.id];
    });
    fdBus.on('cmd-toast', function (m) {
        if (m.to === TAB_ID && typeof m.text === 'string') mpToast(m.text);
    });

    // 前・次: 再生管理があればそれで、なければ画面のボタンを押す
    function scTransport(method, selector) {
        try {
            const pm = getScPlaybackManager();
            if (pm && typeof pm[method] === 'function') { pm[method]({ userInitiated: true }); return; }
        } catch (e) {}
        const b = document.querySelector(selector);
        if (b) b.click();
    }

    // 再生/一時停止: 音声そのもの・再生管理を直接動かす。画面のボタンは裏のタブでは反応しないことがあるため、最後の手段にする
    function scTogglePlay() {
        const clickBtn = function () { const b = document.querySelector('.playControls__play'); if (b) b.click(); };
        const media = lastPlayedMedia;
        if (isLocalPlaying()) {
            try {
                const pm = getScPlaybackManager();
                if (pm && typeof pm.pauseCurrent === 'function') { pm.pauseCurrent(); return; }
            } catch (e) {}
            if (media && !media.paused) { try { media.pause(); return; } catch (e) {} }
            clickBtn();
            return;
        }
        if (media && media.src && media.paused && !media.ended) {
            let r;
            try { r = media.play(); } catch (e) { clickBtn(); return; }
            if (r && typeof r.catch === 'function') r.catch(function (e) { dlog('mini-play-blocked', e && e.name); clickBtn(); });
            setTimeout(function () { if (media.paused && !isLocalPlaying()) clickBtn(); }, 600);
            return;
        }
        clickBtn();
    }

    // ミニプレイヤーの操作の中身。(args, toast, doc) を受ける。doc はこのタブのミニプレイヤー（別タブから呼ばれたときは null）
    const MP_ACTIONS = {
        prev: function () { scTransport('playPrev', '.playControls__prev'); },
        play: function () { scTogglePlay(); },
        next: function () { scTransport('playNext', '.playControls__next'); },
        seek: function (a) { if (typeof a.ratio === 'number') seekToSoundCloudRatio(a.ratio); },
        vol: function (a) { if (typeof a.v === 'number') setSoundCloudVolume(a.v); },
        mute: function () { toggleSoundCloudMute(); },
        like: function (a, toast) {
            const likeBtn = document.querySelector('.playbackSoundBadge__like');
            if (!likeBtn) { toast(tt('m_noLikeBtn')); return; }
            const isCurrentlyLiked = likeBtn.classList.contains('sc-button-selected') || likeBtn.getAttribute('aria-checked') === 'true';
            likeBtn.click();
            const likedId = state.currentTrack && toNumId(state.currentTrack.id);
            if (likedId) {
                if (isCurrentlyLiked) state.likedTrackIds.delete(likedId); else state.likedTrackIds.add(likedId);
            }
            toast(isCurrentlyLiked ? tt('mpToastUnliked') : tt('mpToastLiked'));
            setTimeout(syncMiniPlayerUI, 300);
        },
        repost: async function (a, toast) {
            const t = await ensureCurrentTrackInfo();
            const trackId = t && toNumId(t.id);
            if (!trackId) { toast(tt('m_trackLoading')); return; }
            if (!(await waitForAuthToken(1500))) { toast(tt('m_loginPlease')); return; }
            if (a.unrepost) {
                toast(tt('m_unreposting'));
                try {
                    const res = await scApi('me/track_reposts/' + trackId, { method: 'DELETE' });
                    if (res.ok) {
                        state.repostedTrackIds.delete(trackId);
                        saveCacheData();
                        dlog('unrepost', { trackId: trackId, status: res.status });
                        toast(tt('mpToastUnreposted'));
                    } else {
                        dlog('unrepost-fail', { trackId: trackId, status: res.status });
                        toast(tt('m_unrepostFail', { s: res.status }));
                    }
                } catch (err) {
                    console.error('[SC-FreshStation] Unrepost error:', err);
                    dlog('unrepost-fail', { trackId: trackId, error: String(err) });
                    toast(tt('m_commErr'));
                }
            } else {
                await repostTrackWithCaption(trackId, typeof a.caption === 'string' ? a.caption : '', toast);
            }
            syncMiniPlayerUI();
        },
        follow: async function (a, toast) {
            const t = await ensureCurrentTrackInfo();
            const artistId = t && t.artistId;
            const artistName = (t && t.artistName) || tt('m_artistDefault');
            if (!artistId) { toast(tt('m_artistLoading')); return; }
            const isFollowing = state.followingUserIds.has(artistId);
            toast(isFollowing ? tt('m_unfollowing') : tt('m_following'));
            try {
                if (!(await waitForAuthToken(1500))) { toast(tt('m_loginPlease')); return; }
                // SoundCloud API: フォローは POST、解除は DELETE
                const res = await scApi('me/followings/' + artistId, { method: isFollowing ? 'DELETE' : 'POST' });
                if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
                    if (isFollowing) {
                        state.followingUserIds.delete(artistId);
                        toast(tt('m_unfollowed', { name: artistName }));
                    } else {
                        state.followingUserIds.add(artistId);
                        toast(tt('m_followed', { name: artistName }));
                    }
                    saveCacheData();
                    syncMiniPlayerUI();
                } else {
                    toast(tt('m_followFail', { s: res.status }));
                }
            } catch (e) {
                console.error('[SC-FreshStation] Follow error:', e);
                toast(tt('m_commErr'));
            }
        },
        station: function () { return startTrackStation(); },
        addPl: function (a, toast, doc) { return handleAddTrackToPlaylist(doc || undefined); },
        pickPl: function (a, toast, doc) { return chooseTargetPlaylistPrompt(doc || undefined); },
        dislike: function (a, toast) { toast(getI18nTexts().mpToastDislike); return handleDislikeClick(); },
        hate: async function (a, toast) { toast(hateToastText(await handleHateClick())); },
        later: async function (a, toast) { toast(await toggleLater()); }
    };

    function syncMiniPlayerUI() {
        if (!miniPlayerWindow) return;
        try {
            if (miniPlayerWindow.closed) {
                miniPlayerWindow = null;
                return;
            }
        } catch (e) {
            miniPlayerWindow = null;
            return;
        }

        let doc;
        try {
            doc = miniPlayerWindow.document;
            if (!doc || !doc.body) return;
        } catch (e) {
            return;
        }

        const d = mpCurrentData();

        const mpTitle = doc.getElementById('mp-title');
        const mpArtist = doc.getElementById('mp-artist');
        const mpArt = doc.getElementById('mp-art');
        const mpPlay = doc.getElementById('mp-play');
        const mpLike = doc.getElementById('mp-like');
        const mpRepost = doc.getElementById('mp-repost');
        const mpFollow = doc.getElementById('mp-follow');
        const mpStatus = doc.getElementById('mp-status');

        if (mpTitle && mpTitle.textContent !== d.title) mpTitle.textContent = d.title;
        if (mpArtist && mpArtist.textContent !== d.artist) mpArtist.textContent = d.artist;
        if (mpArt && d.art && mpArt.dataset.art !== d.art) {
            mpArt.dataset.art = d.art;
            mpArt.style.backgroundImage = 'url("' + d.art + '")';
        }
        if (mpPlay) {
            mpPlay.textContent = d.playing ? '⏸' : '▶';
            mpPlay.classList.toggle('playing', !!d.playing);
        }

        const mpAddPl = doc.getElementById('mp-add-pl');
        if (mpAddPl && d.inPl !== undefined && mpAddPl.textContent !== '⏳') {
            mpAddPl.classList.toggle('in-pl', !!d.inPl);
            mpAddPl.textContent = d.inPl ? '✔' : '➕';
        }

        // Like 状態
        if (mpLike && d.hasLikeBtn !== false) {
            mpLike.textContent = '🤍';
            mpLike.classList.toggle('liked', !!d.liked);
        }

        // Repost 状態
        if (mpRepost) {
            mpRepost.title = d.reposted ? tt('m_repostedTip') : tt('m_repostTip');
            mpRepost.classList.toggle('reposted', !!d.reposted);
        }

        // Follow 状態
        if (mpFollow && d.following !== null && d.following !== undefined) {
            mpFollow.textContent = '👤';
            mpFollow.classList.toggle('following', !!d.following);
            mpFollow.title = d.following ? tt('m_followingLbl') : tt('mpFollowBtnTitle');
        }

        const mpHate = doc.getElementById('mp-hate');
        if (mpHate) {
            mpHate.classList.toggle('hated', !!d.hated);
            mpHate.title = d.hated ? tt('m_hateOnTip') : getI18nTexts().mpHateTitle;
        }
        const mpLater = doc.getElementById('mp-later');
        if (mpLater) {
            mpLater.classList.toggle('saved', !!d.later);
            mpLater.title = d.later ? tt('m_laterRemoveTip') : tt('m_laterAddTip');
        }

        if (mpStatus) {
            const isOn = state.discoveryEnabled;
            const isDiscovery = state.playbackMode === 'DISCOVERY';
            const label = state.robotBlocked ? ('⚠️ ' + getI18nTexts().robotShort) : (!isOn ? tt('m_stOff') : (isDiscovery ? tt('m_stOn') : tt('m_stFollow')));
            if (mpStatus.textContent !== label) mpStatus.textContent = label;
            const tStatus = getI18nTexts(); mpStatus.title = isOn ? tStatus.mpStatusToggleOff : tStatus.mpStatusToggleOn;
            mpStatus.classList.toggle('off', !isOn);
            mpStatus.classList.toggle('following-mode', isOn && !isDiscovery);
        }

        // シークバーの同期
        if (!isSeekingInMiniPlayer) {
            const mpPassed = doc.getElementById('mp-time-passed');
            const mpDuration = doc.getElementById('mp-time-duration');
            const mpFill = doc.getElementById('mp-seekbar-fill');
            const mpInput = doc.getElementById('mp-seekbar-input');

            if (mpPassed && mpPassed.textContent !== d.passed) mpPassed.textContent = d.passed;
            if (mpDuration && mpDuration.textContent !== d.duration) mpDuration.textContent = d.duration;
            if (mpFill) mpFill.style.width = (d.ratio * 100) + '%';
            if (mpInput) mpInput.value = (d.ratio * 100);
        }

        // 音量UIの同期
        syncMiniPlayerVolumeUI(typeof d.vol === 'number' ? d.vol : getSoundCloudVolume());
    }

    // 初期化実行: Windows メディア操作パネル用の追加ハンドラー登録
    registerExtraMediaSessionHandlers();

})();
