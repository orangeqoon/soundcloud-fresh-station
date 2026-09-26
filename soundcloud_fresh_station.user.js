// ==UserScript==
// @name         FreshDig for SoundCloud - 新アーティスト自動発掘
// @version      1.7.8
// @description  知ってる曲ゼロ！未試聴の新アーティストだけを連続再生・ワンクリック追加・Dislike除外・浮遊ミニプレイヤー
// @author       Antigravity
// @match        https://soundcloud.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// SoundCloud Fresh Station & Follower Stream
(function () {
    'use strict';

    console.log('[SC-FreshStation] Hook loaded in MAIN world (FreshDig v1.7.8)');

    const STORAGE_KEY = 'sc_fresh_station_data_v1';
    const TARGET_PLAYLIST_KEY = 'sc_fresh_station_target_playlist_id';
    const PLAYBACK_MODE_KEY = 'sc_fresh_station_playback_mode';
    const CACHE_LIKES_KEY = 'sc_fresh_station_cache_likes';
    const CACHE_FOLLOWS_KEY = 'sc_fresh_station_cache_follows';
    const CACHE_PLAYLISTS_KEY = 'sc_fresh_station_cache_playlists';
    const CACHE_CLIENT_ID_KEY = 'sc_fresh_station_client_id';
    const CACHE_OAUTH_TOKEN_KEY = 'sc_fresh_station_cache_oauth_token';

    const DISCOVERY_ENABLED_KEY = 'sc_fresh_station_discovery_enabled';

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
    const MAX_LIKES_SYNC = 1000;            // 同期するLikesの上限件数
    const MAX_FOLLOWINGS_SYNC = 5000;       // 同期するフォローの上限件数
    const AUTO_SYNC_COOLDOWN_MS = 60000;    // 自動同期の最短間隔（リクエスト連打防止）

    const state = {
        myUserId: null,
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
        dislikedTracks: {},
        dislikedArtists: {},
        dislikedGenres: {},
        myPlaylists: [],
        targetPlaylistId: localStorage.getItem(TARGET_PLAYLIST_KEY) || null,
        currentTrack: null,
        lastSkippedTrackKey: null,
        repostedTrackIds: new Set()
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

            const cachedLikes = localStorage.getItem(CACHE_LIKES_KEY);
            if (cachedLikes) {
                const arr = JSON.parse(cachedLikes);
                state.likedTrackIds = new Set(arr);
            }

            const cachedFollows = localStorage.getItem(CACHE_FOLLOWS_KEY);
            if (cachedFollows) {
                const arr = JSON.parse(cachedFollows);
                state.followingUserIds = new Set(arr);
            }

            const cachedPls = localStorage.getItem(CACHE_PLAYLISTS_KEY);
            if (cachedPls) {
                state.myPlaylists = JSON.parse(cachedPls);
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
        } catch (e) {
            console.error('[SC-FreshStation] Failed to save dislike data:', e);
        }
    }

    function saveCacheData() {
        try {
            localStorage.setItem(CACHE_LIKES_KEY, JSON.stringify(Array.from(state.likedTrackIds)));
            localStorage.setItem(CACHE_FOLLOWS_KEY, JSON.stringify(Array.from(state.followingUserIds)));
            localStorage.setItem(CACHE_PLAYLISTS_KEY, JSON.stringify(state.myPlaylists));
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
            return originalFetch(buildUrl(), init);
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
                        likedCount: state.likedTrackIds.size,
                        followingCount: state.followingUserIds.size,
                        isReady: state.isUserDataLoaded,
                        loggedIn: !!state.oauthToken,
                        accountName: state.myUsername,
                        volume: getSoundCloudVolume()
                    });
                } else {
                    ack({ success: false, message: 'Unknown action: ' + action });
                }
            } catch (e) {
                console.error('[SC-FreshStation] Popup action error (' + action + '):', e);
                ack({ success: false, message: 'エラーが発生しました: ' + (e && e.message) });
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
                        const nextRes = await originalFetch(nextUrl, {
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
    function initUserData(options) {
        const force = !!(options && options.force);
        if (userDataSyncPromise) return userDataSyncPromise;
        if (!force && Date.now() - lastUserDataSyncAttempt < AUTO_SYNC_COOLDOWN_MS) {
            return Promise.resolve();
        }
        lastUserDataSyncAttempt = Date.now();
        userDataSyncPromise = doInitUserData().finally(function () {
            userDataSyncPromise = null;
        });
        return userDataSyncPromise;
    }

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
            } else {
                // ログインしていない（またはトークンが無効）なら、他人のデータで判定しないよう打ち切る
                state.myUsername = null;
                return;
            }

            // プレイリスト一覧取得（非公開含む・ページング対応）
            const playlists = [];
            const plOk = await fetchPaged('users/' + state.myUserId + '/playlists?limit=50&linked_partitioning=1', 200, function (p) {
                if (!p || !p.id) return false;
                playlists.push({ id: p.id, title: p.title || '(無題)', trackCount: p.track_count || 0 });
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

            // ライク一覧取得（新規Setに集めて成功時のみ置換 → いいね解除も反映される）
            const likes = await fetchPagedIds(
                'users/' + state.myUserId + '/track_likes?limit=200&linked_partitioning=1', MAX_LIKES_SYNC,
                function (item) { return item.track ? item.track.id : (item.target ? item.target.id : item.id); }
            );
            if (likes) state.likedTrackIds = likes;

            // フォロー一覧取得（同上 → フォロー解除も反映される）
            const followings = await fetchPagedIds(
                'users/' + state.myUserId + '/followings?limit=200&linked_partitioning=1', MAX_FOLLOWINGS_SYNC,
                function (u) { return u.id; }
            );
            if (followings) state.followingUserIds = followings;

            if (likes || followings) {
                state.isUserDataLoaded = true;
            }
            saveCacheData();
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
            monitorPlaybackWithMargin();
        } catch (e) {
            console.warn('[SC-FreshStation] monitorPlayback exception:', e);
        }
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
            if (path.includes('/you/likes') || path.includes('/you/sets') || path.includes('/you/history')) {
                return true;
            }
        } catch (e) {}
        return false;
    }

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

        // 1. 新しい曲に切り替わったことを検知！
        if (currentHref !== marginGuard.lastTrackHref) {
            marginGuard.lastTrackHref = currentHref;
            marginGuard.loadStartTime = now;
            marginGuard.hasChecked = false;

            // 新しい曲情報で初期化
            state.currentTrack = {
                id: null,
                title: title,
                artistName: artist,
                artistId: null,
                href: currentHref,
                genre: ''
            };
            // バックグラウンドで即座に track ID を解決
            ensureCurrentTrackInfo();
            return;
        }

        // 2. この曲ですでに判定完了していればスキップ（1曲につき1回判定ルール）
        if (marginGuard.hasChecked) {
            return;
        }

        // 3. マージン待機：曲が始まってから 1.2秒（1200ms）経過するまで DOM や再生が安定するのを待つ！
        if (now - marginGuard.loadStartTime < 1200) {
            return;
        }

        // 4. 安全クールダウン：前回スキップから 2.0秒未満なら待つ（連続連打ループ防止）
        if (now - marginGuard.lastSkipTime < 2000) {
            return;
        }

        // 4b. トラックID解決待ち：ID未解決のままだと「ID登録のDislike/フォロー/Likes」判定が素通りになるため、
        //     最大 4秒 までは解決を待つ（それを過ぎたらタイトル/DOMベースの判定だけで続行）
        if (!(state.currentTrack && state.currentTrack.id) && now - marginGuard.loadStartTime < 4000) {
            return;
        }

        // 5. 連続スキップ防止ブレーキ（万が一の無限ループ防止）
        //    この曲はスキップせずに再生し、カウンタをリセットして次の曲から判定を再開する
        if (marginGuard.consecutiveSkips >= 10) {
            console.warn('[SC-FreshStation] ⚠️ 連続スキップが10曲に達したため、この曲は自動スキップせず再生します（次の曲から判定再開）。');
            showGlobalToast('⚠️ 連続スキップ上限に達したため、この曲はそのまま再生します');
            marginGuard.hasChecked = true;
            marginGuard.consecutiveSkips = 0;
            return;
        }

        // --- ここからマージン経過後の正確な除外判定 ---
        marginGuard.hasChecked = true; // この曲の判定を完了済みにマーク

        // 発掘モード ON のときだけ除外スキップ（OFF なら SoundCloud 通常再生）
        if (state.discoveryEnabled && state.playbackMode === 'DISCOVERY') {
            let shouldSkip = false;
            let skipReason = '';

            // A. DOMのLikeボタンの確認（※自発的にLikesページ等を再生している時はスキップしない！）
            if (!isExplicitLibraryPage() && likeBtn) {
                const isSelected = likeBtn.classList.contains('sc-button-selected');
                const ariaChecked = likeBtn.getAttribute('aria-checked') === 'true';
                const titleAttr = (likeBtn.getAttribute('title') || '').toLowerCase();
                if (isSelected || ariaChecked || titleAttr.indexOf('unlike') !== -1) {
                    shouldSkip = true;
                    skipReason = 'ライク済みの曲 (DOM検知)';
                }
            }

            // B. Dislike (曲) の確認
            if (!shouldSkip) {
                const trackKey = (state.currentTrack && state.currentTrack.id) ? state.currentTrack.id : ('title_' + encodeURIComponent(title));
                if (state.dislikedTracks[trackKey] || state.dislikedTracks[title]) {
                    shouldSkip = true;
                    skipReason = 'Dislike登録された曲';
                }
            }

            // C. Hate / Dislike (作者) の確認
            if (!shouldSkip) {
                const artistKey = (state.currentTrack && state.currentTrack.artistId) ? state.currentTrack.artistId : ('artist_' + encodeURIComponent(artist));
                if (state.dislikedArtists[artistKey] || state.dislikedArtists[artist]) {
                    shouldSkip = true;
                    skipReason = 'Hate登録された作者';
                }
            }

            // D. フォロー中アーティストの確認 (DISCOVERY除外)
            if (!shouldSkip && state.currentTrack && state.currentTrack.artistId) {
                if (state.followingUserIds.has(state.currentTrack.artistId)) {
                    shouldSkip = true;
                    skipReason = 'フォロー中のアーティスト';
                }
            }

            // E. 登録Likes一覧の確認（※自発的にLikesページ等を再生している時はスキップしない！）
            if (!isExplicitLibraryPage() && !shouldSkip && state.currentTrack && state.currentTrack.id) {
                if (state.likedTrackIds.has(state.currentTrack.id)) {
                    shouldSkip = true;
                    skipReason = 'ライク済みID一覧に一致';
                }
            }

            // スキップ実行
            if (shouldSkip) {
                console.log('[SC-FreshStation] ⏩ [' + skipReason + '] を検知！1.2秒マージン後にスキップ実行: "' + title + '" (' + artist + ')');
                marginGuard.lastSkipTime = Date.now();
                marginGuard.consecutiveSkips++;

                const skipBtn = document.querySelector('.playControls__next');
                if (skipBtn) {
                    skipBtn.click();
                }
            } else {
                marginGuard.consecutiveSkips = 0;
            }
        }
    }

    function injectButtons() {
        const actionGroup = document.querySelector('.playbackSoundBadge__actions');
        if (!actionGroup) return;

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
            actionGroup.appendChild(modeBtn);
        }
        updateModeButtonUI();

        // 1. ステーション開始ボタン (アイコン: 📻)
        if (!document.getElementById('sc-fresh-station-station-btn')) {
            const stBtn = document.createElement('button');
            stBtn.id = 'sc-fresh-station-station-btn';
            stBtn.type = 'button';
            stBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            stBtn.title = '📻 この曲のステーションを開始';
            stBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #00e676; background: transparent; color: #00e676; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle; transition: all 0.15s ease;';
            stBtn.innerHTML = '📻';
            stBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                startTrackStation();
            });
            actionGroup.appendChild(stBtn);
        }

        // 2. Dislikeボタン (アイコン1個: 👎) - この曲だけ除外
        if (!document.getElementById('sc-fresh-station-dislike-btn')) {
            const btn = document.createElement('button');
            btn.id = 'sc-fresh-station-dislike-btn';
            btn.type = 'button';
            btn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            btn.title = '👎 Dislike (この曲だけ二度と流さない＆スキップ)';
            btn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #ff5500; color: #ff5500; background: transparent; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            btn.innerHTML = '👎';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                handleDislikeClick();
            });
            actionGroup.appendChild(btn);
        }

        // 3. Hateボタン (アイコン1個: 🚫) - この作者の曲すべてを除外
        if (!document.getElementById('sc-fresh-station-hate-btn')) {
            const hateBtn = document.createElement('button');
            hateBtn.id = 'sc-fresh-station-hate-btn';
            hateBtn.type = 'button';
            hateBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            hateBtn.title = '🚫 Hate (この作者の曲すべてを二度と流さない＆スキップ)';
            hateBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #e53935; color: #e53935; background: transparent; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            hateBtn.innerHTML = '🚫';
            hateBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                handleHateClick();
            });
            actionGroup.appendChild(hateBtn);
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

            actionGroup.appendChild(plBtn);
            updatePlaylistButtonUI();
        }

        // 5. ミニプレイヤー起動ボタン (アイコン1個: 🪟)
        if (!document.getElementById('sc-fresh-station-miniplayer-btn')) {
            const mpBtn = document.createElement('button');
            mpBtn.id = 'sc-fresh-station-miniplayer-btn';
            mpBtn.type = 'button';
            mpBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            mpBtn.title = '🪟 ミニプレイヤー (最前面ウィンドウで浮遊操作)';
            mpBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #777; background: transparent; color: #ccc; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            mpBtn.innerHTML = '🪟';
            mpBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                toggleMiniPlayer();
            });
            actionGroup.appendChild(mpBtn);
        }
    }

    function updateModeButtonUI() {
        const btn = document.getElementById('sc-fresh-station-mode-btn');
        if (!btn) return;
        if (!state.discoveryEnabled) {
            btn.innerHTML = '🔍';
            btn.style.borderColor = '#555';
            btn.style.color = '#777';
            btn.style.background = 'transparent';
            btn.style.opacity = '0.55';
            btn.title = '🔍 発掘モード OFF（クリックで ON：知っている曲を自動スキップ）';
            return;
        }
        btn.style.opacity = '1';
        if (state.playbackMode === 'DISCOVERY') {
            btn.innerHTML = '🔍';
            btn.style.borderColor = '#ff5500';
            btn.style.color = '#ffaa00';
            btn.style.background = 'rgba(255, 85, 0, 0.15)';
            btn.title = '🔍 発掘モード ON（クリックで OFF：SoundCloud 通常再生）';
        } else {
            btn.innerHTML = '👥';
            btn.style.borderColor = '#29b6f6';
            btn.style.color = '#4fc3f7';
            btn.style.background = 'rgba(41, 182, 246, 0.15)';
            btn.title = '👥 フォロー新曲モード (クリックで「発掘モード」へ切替)';
        }
    }

    function saveTargetPlaylist(targetId) {
        if (!targetId) return;
        state.targetPlaylistId = String(targetId);
        try {
            localStorage.setItem(TARGET_PLAYLIST_KEY, state.targetPlaylistId);
        } catch (e) {}
        updatePlaylistButtonUI();
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

    function updatePlaylistButtonUI() {
        const btn = document.getElementById('sc-fresh-station-playlist-btn');
        if (!btn) return;
        if (!state.targetPlaylistId) {
            btn.title = '➕ プレイリストに一発追加 (クリックで保存先選択)';
            return;
        }
        const found = state.myPlaylists.find(function (p) { return String(p.id) === String(state.targetPlaylistId); });
        const name = found ? found.title : '保存先';
        btn.title = '➕ 「' + name + '」に一発追加 (右クリックで保存先変更)';
    }

    // 画面内のプレイリスト選択パネル（prompt()/alert() はミニプレイヤーからだと裏の窓に出て見えないため）
    function showPlaylistPicker(doc, playlists, currentId) {
        doc = doc || document;
        return new Promise(function (resolve) {
            const old = doc.getElementById('sc-fresh-station-pl-picker');
            if (old) old.remove();

            const overlay = doc.createElement('div');
            overlay.id = 'sc-fresh-station-pl-picker';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

            const panel = doc.createElement('div');
            panel.style.cssText = 'background:#1a1a1a;color:#eee;border:1px solid #ff5500;border-radius:8px;width:min(320px,92vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,0.6);';

            const head = doc.createElement('div');
            head.textContent = '➕ ワンクリック追加先を選択';
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
                item.textContent = (isCur ? '★ ' : '') + p.title + '（' + p.trackCount + '曲）';
                item.style.cssText = 'display:block;width:100%;text-align:left;background:' + (isCur ? 'rgba(255,85,0,0.18)' : 'transparent') + ';color:#eee;border:none;padding:7px 12px;font-size:12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                item.addEventListener('mouseenter', function () { item.style.background = '#333'; });
                item.addEventListener('mouseleave', function () { item.style.background = isCur ? 'rgba(255,85,0,0.18)' : 'transparent'; });
                item.addEventListener('click', function () { done(p); });
                list.appendChild(item);
            });
            panel.appendChild(list);

            const cancel = doc.createElement('button');
            cancel.type = 'button';
            cancel.textContent = 'キャンセル';
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
            showGlobalToast('🔄 プレイリスト一覧を取得中...');
            await initUserData({ force: true });
        }

        if (!state.myUserId) {
            showGlobalToast('⚠️ SoundCloudにログインしていないため、プレイリストを取得できません');
            return null;
        }
        if (!state.myPlaylists || state.myPlaylists.length === 0) {
            showGlobalToast('⚠️ プレイリストがありません。先にSoundCloudでプレイリストを作成してください');
            return null;
        }

        const selected = await showPlaylistPicker(doc, state.myPlaylists, state.targetPlaylistId);
        if (!selected) return null;
        saveTargetPlaylist(selected.id);
        showGlobalToast('📋 保存先を「' + selected.title + '」に設定しました！');
        return selected;
    }

    let isAddingToPlaylist = false;

    async function handleAddTrackToPlaylist(doc) {
        if (isAddingToPlaylist) return false; // 連打による二重追加を防止
        isAddingToPlaylist = true;
        const btn = document.getElementById('sc-fresh-station-playlist-btn');
        const resetBtn = function () {
            if (btn) {
                btn.innerHTML = '➕';
                btn.style.background = '#ff5500';
                btn.style.borderColor = '#ff5500';
            }
        };
        try {
            const track = await ensureCurrentTrackInfo();
            if (!track || !track.id) {
                showGlobalToast('⚠️ 再生中の曲情報が取得できません');
                return false;
            }
            const trackId = Number(track.id);

            // 認証トークンの確認（最新の Cookie / SoundCloud 本体のトークンを使用）
            if (!(await waitForAuthToken(1500))) {
                showGlobalToast('⚠️ SoundCloudにログインしてください（認証トークンが見つかりません）');
                return false;
            }

            // 追加先プレイリストのチェック
            if (!state.targetPlaylistId) {
                showGlobalToast('📋 追加先を選んでください');
                const selected = await chooseTargetPlaylistPrompt(doc);
                if (!selected) {
                    showGlobalToast('⚠️ プレイリストへの追加を中断しました');
                    return false;
                }
            }

            if (btn) btn.innerHTML = '⏳';
            showGlobalToast('➕ プレイリストに追加中...');

            const tryAddToPlaylist = async function (plId) {
                const plRes = await scApi('playlists/' + plId);
                if (plRes.status === 401 || plRes.status === 403) return { authError: true, status: plRes.status };
                if (!plRes.ok) return { notFound: true, status: plRes.status };

                const plData = await plRes.json();
                const plTitle = plData.title || '指定プレイリスト';
                const currentTrackIds = (plData.tracks || []).map(function (t) { return Number(t.id); }).filter(function (id) { return id > 0; });

                if (currentTrackIds.indexOf(trackId) !== -1) return { alreadyIn: true, plTitle: plTitle };
                if (currentTrackIds.length >= 500) return { full: true, plTitle: plTitle };

                currentTrackIds.push(trackId);
                const putRes = await scApi('playlists/' + plId, {
                    method: 'PUT',
                    body: { playlist: { tracks: currentTrackIds } }
                });
                if (putRes.ok) return { success: true, plTitle: plTitle };
                if (putRes.status === 401 || putRes.status === 403) return { authError: true, status: putRes.status };
                return { failed: true, status: putRes.status };
            };

            let res = await tryAddToPlaylist(state.targetPlaylistId);

            // プレイリストが見つからない（削除済み・別アカウントのID等）なら再選択して再試行
            if (res.notFound) {
                showGlobalToast('⚠️ 保存先プレイリストが見つかりません。選び直してください');
                const newSelected = await chooseTargetPlaylistPrompt(doc);
                if (!newSelected) {
                    showGlobalToast('⚠️ 追加先が設定されなかったため中断しました');
                    return false;
                }
                res = await tryAddToPlaylist(state.targetPlaylistId);
            }

            if (res.authError) {
                showGlobalToast('❌ アカウント認証に失敗しました (' + res.status + ')。SoundCloudを再読み込み／再ログインしてください');
                return false;
            }
            if (res.alreadyIn) {
                showGlobalToast('ℹ️ 「' + track.title + '」はすでに「' + res.plTitle + '」に入っています');
                return false;
            }
            if (res.full) {
                showGlobalToast('⚠️ 「' + res.plTitle + '」は500曲の上限に達しています');
                return false;
            }
            if (res.success) {
                console.log('[SC-FreshStation] Successfully added track ' + trackId + ' to playlist ' + state.targetPlaylistId);
                showGlobalToast('✅ 「' + track.title + '」を「' + res.plTitle + '」に追加しました！');
                const pl = state.myPlaylists.find(function (p) { return String(p.id) === String(state.targetPlaylistId); });
                if (pl) pl.trackCount = (pl.trackCount || 0) + 1;
                if (btn) {
                    btn.innerHTML = '✅';
                    btn.style.background = '#00c853';
                    btn.style.borderColor = '#00c853';
                    setTimeout(function () { resetBtn(); updatePlaylistButtonUI(); }, 1500);
                }
                return true;
            }
            showGlobalToast('❌ プレイリストへの追加に失敗しました (' + res.status + ')');
            return false;
        } catch (err) {
            console.error('[SC-FreshStation] Failed to add track to playlist:', err);
            showGlobalToast('❌ 追加エラー: ' + err.message);
            return false;
        } finally {
            isAddingToPlaylist = false;
            if (btn && btn.innerHTML !== '✅') resetBtn();
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

                let rRes = await originalFetch(resolveUrl, {
                    headers: state.oauthToken ? { 'Authorization': state.oauthToken } : {},
                    credentials: 'include'
                });

                // 認証エラー(401/403)なら、Authorizationヘッダーを外して公開APIとして即リトライ！
                if (!rRes.ok && (rRes.status === 401 || rRes.status === 403)) {
                    console.warn('[SC-FreshStation] Resolve with token returned ' + rRes.status + ', retrying as public request...');
                    requestAuthFromExtension();
                    rRes = await originalFetch(resolveUrl, {
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

    const DISLIKE_PLAYLIST_TITLE = '[FreshDig] Disliked Tracks';

    // Dislike 曲を SoundCloud プレイリストにエクスポート
    async function exportDislikesToPlaylist() {
        if (!(await waitForAuthToken(1500))) {
            return { success: false, message: 'SoundCloudにログインしていないため書き出せません。SoundCloudでログインしてから再試行してください。' };
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
            return { success: false, message: 'エクスポートできるDislike曲がありません（曲IDが取得できた曲のみ書き出せます）。' };
        }

        try {
            await initUserData({ force: true });
            if (!state.myUserId) {
                return { success: false, message: 'SoundCloudアカウントに接続できませんでした。ページを再読み込みしてください。' };
            }
            const existingPl = state.myPlaylists.find(function (p) { return (p.title || '').toLowerCase() === DISLIKE_PLAYLIST_TITLE.toLowerCase(); });

            if (existingPl) {
                const plRes = await scApi('playlists/' + existingPl.id);
                if (!plRes.ok) {
                    return { success: false, message: 'Dislikeプレイリストの取得に失敗しました (HTTP ' + plRes.status + ')' };
                }
                const plData = await plRes.json();
                const currentIds = (plData.tracks || []).map(function (t) { return Number(t.id); });
                const mergedIds = Array.from(new Set(currentIds.concat(trackIds))).slice(0, 500);

                const putRes = await scApi('playlists/' + existingPl.id, {
                    method: 'PUT',
                    body: { playlist: { tracks: mergedIds } }
                });

                if (putRes.ok) {
                    return { success: true, message: 'プレイリスト「' + DISLIKE_PLAYLIST_TITLE + '」に書き出しました（合計 ' + mergedIds.length + ' 曲' + (mergedIds.length >= 500 ? '・上限500曲' : '') + '）' };
                }
                return { success: false, message: 'エクスポート更新に失敗しました (HTTP ' + putRes.status + ')' };
            }

            const postRes = await scApi('playlists', {
                method: 'POST',
                body: {
                    playlist: {
                        title: DISLIKE_PLAYLIST_TITLE,
                        sharing: 'private',
                        tracks: trackIds.slice(0, 500)
                    }
                }
            });

            if (postRes.ok) {
                await initUserData({ force: true });
                return { success: true, message: '非公開プレイリスト「' + DISLIKE_PLAYLIST_TITLE + '」を作成し、' + Math.min(trackIds.length, 500) + ' 曲を書き出しました！' };
            }
            return { success: false, message: 'プレイリスト新規作成に失敗しました (HTTP ' + postRes.status + ')' };
        } catch (e) {
            console.error('[SC-FreshStation] Export dislikes error:', e);
            return { success: false, message: 'エラーが発生しました: ' + e.message };
        }
    }

    // SoundCloud プレイリストから Dislike 曲をインポート
    async function importDislikesFromPlaylist() {
        if (!(await waitForAuthToken(1500))) {
            return { success: false, message: 'SoundCloudにログインしていないため読み込めません。SoundCloudでログインしてから再試行してください。' };
        }

        try {
            await initUserData({ force: true });
            if (!state.myUserId) {
                return { success: false, message: 'SoundCloudアカウントに接続できませんでした。ページを再読み込みしてください。' };
            }
            let targetPl = state.myPlaylists.find(function (p) { return (p.title || '').toLowerCase() === DISLIKE_PLAYLIST_TITLE.toLowerCase(); });
            if (!targetPl) {
                targetPl = state.myPlaylists.find(function (p) { return (p.title || '').toLowerCase().includes('dislike'); });
            }

            if (!targetPl) {
                return { success: false, message: '「' + DISLIKE_PLAYLIST_TITLE + '」という名前のプレイリストが見つかりませんでした。先に書き出しを行ってください。' };
            }

            const res = await scApi('playlists/' + targetPl.id);
            if (!res.ok) {
                return { success: false, message: 'プレイリスト取得失敗 (HTTP ' + res.status + ')' };
            }

            const plData = await res.json();
            const tracks = plData.tracks || [];
            if (tracks.length === 0) {
                return { success: false, message: 'プレイリスト「' + targetPl.title + '」には曲がありませんでした。' };
            }

            let importedCount = 0;
            tracks.forEach(function (track) {
                if (track && track.id) {
                    const key = String(track.id);
                    if (!state.dislikedTracks[key]) {
                        importedCount++;
                        // 大きいプレイリストでは tracks の後半が ID のみの場合があるので、既存情報は上書きしない
                        state.dislikedTracks[key] = {
                            title: track.title || ('Track ' + key),
                            artist: track.user ? track.user.username : '',
                            genre: track.genre || '',
                            date: new Date().toLocaleDateString()
                        };
                    }
                }
            });

            saveDislikeData();
            return { success: true, message: 'プレイリスト「' + targetPl.title + '」から ' + tracks.length + ' 曲を確認し、新たに ' + importedCount + ' 件をDislikeリストに追加しました！' };
        } catch (e) {
            console.error('[SC-FreshStation] Import dislikes error:', e);
            return { success: false, message: 'エラーが発生しました: ' + e.message };
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
        console.log('[SC-FreshStation] 👎 1-Click Dislike! Track only: "' + title + '" (' + artist + '). Skipping immediately...');

        const skipBtn = document.querySelector('.playControls__next');
        if (skipBtn) {
            skipBtn.click();
        }
    }

    async function handleHateClick() {
        const btn = document.getElementById('sc-fresh-station-hate-btn');
        if (btn) {
            btn.style.background = '#e53935';
            btn.style.color = '#fff';
            setTimeout(function () {
                btn.style.background = 'transparent';
                btn.style.color = '#e53935';
            }, 500);
        }

        const t = await ensureCurrentTrackInfo();
        const artist = (t && t.artistName) ? t.artistName : (document.querySelector('.playbackSoundBadge__lightLink')?.getAttribute('title') || 'Unknown');
        const artistKey = (t && t.artistId) ? t.artistId : ('artist_' + encodeURIComponent(artist));

        state.dislikedArtists[artistKey] = {
            name: artist,
            date: new Date().toLocaleDateString()
        };

        saveDislikeData();
        console.log('[SC-FreshStation] 🚫 1-Click Hate! Artist completely: "' + artist + '". Skipping immediately...');

        const skipBtn = document.querySelector('.playControls__next');
        if (skipBtn) {
            skipBtn.click();
        }
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
                    showGlobalToast('🔊 音量を復元しました (' + Math.round(restore * 100) + '%)');
                } else {
                    lastNonZeroVolume = volMod.getVolume();
                    volMod.setMuted(true);
                    showGlobalToast('🔇 ミュートしました');
                }
            } catch (e) {}
            syncMiniPlayerVolumeUI(getSoundCloudVolume());
            return;
        }
        const cur = getSoundCloudVolume();
        if (cur > 0) {
            lastNonZeroVolume = cur;
            setSoundCloudVolume(0);
            showGlobalToast('🔇 ミュートしました');
        } else {
            const restore = lastNonZeroVolume > 0 ? lastNonZeroVolume : 0.8;
            setSoundCloudVolume(restore);
            showGlobalToast('🔊 音量を復元しました (' + Math.round(restore * 100) + '%)');
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
                icon.title = vol === 0 ? 'ミュート解除' : 'ミュート切替';
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
        }
        updateModeButtonUI();
        syncMiniPlayerUI();
        if (!(options && options.silent) || changed) {
            showGlobalToast(enabled ? '🔍 発掘モード ON（知っている曲を自動スキップ）' : '⏸ 発掘モード OFF（SoundCloud 通常再生）');
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
            ? '🔍 発掘モード（未知のアーティスト）に切替'
            : '👥 フォロー新曲モード（新曲のみ）に切替';
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
                showGlobalToast('📻 ステーションを開始しました！');
                return { success: true, message: 'ステーションを開始しました' };
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
                showGlobalToast('📻 ステーションを開始しました！');
                return { success: true, message: 'ステーションを開始しました' };
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
                showGlobalToast('📻 ステーションを開始しました！');
                return { success: true, message: 'ステーションを開始しました' };
            }
        }

        // Step 4: トラックIDによるSPAナビゲーション + 自動再生
        if (currentTrackId) {
            showGlobalToast('📻 ステーションを読込中...');
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
                    showGlobalToast('📻 ステーションを再生開始しました！');
                    break;
                }
            }
            if (!playStarted) {
                const mainPlay = document.querySelector('.playControls__play');
                if (mainPlay && !mainPlay.classList.contains('playing')) {
                    mainPlay.click();
                }
            }
            return { success: true, message: 'ステーションを開始しました' };
        }

        showGlobalToast('⚠️ 現在再生中の曲情報を取得できませんでした');
        return { success: false, message: '曲情報を取得できませんでした' };
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

    function registerExtraMediaSessionHandlers() {
        if (!('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
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
    // 🪟 浮遊ミニプレイヤー (Document Picture-in-Picture & Fallback)
    // =========================================================================
    let miniPlayerWindow = null;

    async function toggleMiniPlayer() {
        if (miniPlayerWindow && !miniPlayerWindow.closed) {
            miniPlayerWindow.close();
            miniPlayerWindow = null;
            return;
        }
        await openMiniPlayer();
    }

    async function openMiniPlayer() {
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
                alert('ミニプレイヤーの表示がブロックされました。ブラウザのポップアップ許可をご確認ください。');
                return;
            }

            setupMiniPlayerUI(miniPlayerWindow.document);

            miniPlayerWindow.addEventListener('pagehide', function () {
                miniPlayerWindow = null;
            });
            miniPlayerWindow.addEventListener('beforeunload', function () {
                miniPlayerWindow = null;
            });

            syncMiniPlayerUI();
            console.log('[SC-FreshStation] 🪟 Mini Player opened successfully');
        } catch (err) {
            console.error('[SC-FreshStation] Failed to open Mini Player:', err);
        }
    }

    let isSeekingInMiniPlayer = false;

    function setupMiniPlayerUI(doc) {
        doc.title = 'FreshDig - アーティスト発掘ミニプレイヤー';
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
                    margin-top: 3px;
                }
                .status-badge {
                    display: inline-block;
                    font-size: 8.5px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    background: rgba(255, 85, 0, 0.15);
                    border: 1px solid #ff5500;
                    color: #ffaa00;
                    white-space: nowrap;
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .status-badge:hover {
                    background: #ff5500;
                    color: #fff;
                    transform: scale(1.05);
                }
                .status-badge.following-mode {
                    border-color: #29b6f6;
                    background: rgba(41, 182, 246, 0.15);
                    color: #4fc3f7;
                }
                .status-badge.off {
                    border-color: #555;
                    background: #222;
                    color: #888;
                }
                .status-badge.off:hover {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                }
                .status-badge.following-mode:hover {
                    background: #0288d1;
                    color: #fff;
                }
                .btn-follow {
                    background: #222;
                    border: 1px solid #444;
                    color: #aaa;
                    font-size: 8.5px;
                    padding: 1px 5px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.15s ease;
                }
                .btn-follow:hover {
                    background: #333;
                    color: #fff;
                }
                .btn-follow.following {
                    background: rgba(0, 230, 118, 0.15);
                    border-color: #00e676;
                    color: #00e676;
                }
                .btn-station {
                    background: #222;
                    border: 1px solid #ff5500;
                    color: #ff7700;
                    font-size: 8.5px;
                    padding: 1px 5px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.15s ease;
                }
                .btn-station:hover {
                    background: #ff5500;
                    color: #fff;
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
                    color: #ff5500;
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
                    background: linear-gradient(90deg, #ff9900, #ff5500);
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
                    border: none;
                    background: #222;
                    color: #ddd;
                    font-size: 12px;
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
                }
                button:hover {
                    background: #333;
                    color: #fff;
                    transform: translateY(-1px);
                }
                button:active {
                    transform: translateY(0);
                }
                .btn-play {
                    flex: 1.25;
                    background: #ff5500;
                    color: #fff;
                    font-size: 15px;
                }
                .btn-play:hover {
                    background: #ff7700;
                }
                .btn-like.liked {
                    color: #ff3344;
                    background: rgba(255, 51, 68, 0.2);
                    border: 1px solid #ff3344;
                }
                .btn-repost.reposted {
                    color: #00e676;
                    background: rgba(0, 230, 118, 0.2);
                    border: 1px solid #00e676;
                }
                .btn-pl {
                    border: 1px solid #ff5500;
                    color: #ff5500;
                    background: rgba(255,85,0,0.1);
                    font-weight: bold;
                }
                .btn-pl:hover {
                    background: #ff5500;
                    color: #fff;
                }
                .btn-dislike {
                    border: 1px solid #ff5500;
                    color: #ff5500;
                }
                .btn-hate {
                    border: 1px solid #e53935;
                    color: #e53935;
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
                    z-index: 100;
                }
                .toast.show {
                    opacity: 1;
                }
            </style>
            <div class="track-info-row">
                <div class="artwork" id="mp-art"></div>
                <div class="meta">
                    <div class="title" id="mp-title">曲を読み込み中...</div>
                    <div class="artist" id="mp-artist">SoundCloud</div>
                    <div class="badge-row">
                        <span class="status-badge" id="mp-status">再生待機中</span>
                        <button class="btn-follow" id="mp-follow" title="アーティストをフォロー">👤 フォロー</button>
                        <button class="btn-station" id="mp-station" title="この曲のステーションを開始">📻 ステーション</button>
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
                <button class="btn-vol-icon" id="mp-vol-icon" title="ミュート切替">🔊</button>
                <div class="volumebar-container">
                    <div class="volumebar-bg">
                        <div class="volumebar-fill" id="mp-vol-fill"></div>
                    </div>
                    <input type="range" min="0" max="100" value="80" step="1" class="volumebar-input" id="mp-vol-input" title="音量調整">
                </div>
                <span class="vol-text" id="mp-vol-text">80%</span>
            </div>

            <!-- コントロールボタン列 -->
            <div class="controls-row">
                <button id="mp-prev" title="前の曲">⏮</button>
                <button class="btn-play" id="mp-play" title="再生 / 一時停止">⏯</button>
                <button id="mp-next" title="次の曲">⏭</button>
                <button class="btn-like" id="mp-like" title="いいね (Like)">🤍</button>
                <button class="btn-repost" id="mp-repost" title="リポスト (Repost)">🔁</button>
                <button class="btn-pl" id="mp-add-pl" title="プレイリストに追加">➕</button>
                <button class="btn-dislike" id="mp-dislike" title="この曲だけ除外＆スキップ">👎</button>
                <button class="btn-hate" id="mp-hate" title="この作者の曲全除外＆スキップ">🚫</button>
            </div>
            <div class="toast" id="mp-toast"></div>
        `;

        function showToast(msg) {
            const toast = doc.getElementById('mp-toast');
            if (toast) {
                toast.textContent = msg;
                toast.classList.add('show');
                setTimeout(function () { toast.classList.remove('show'); }, 1500);
            }
        }

        // 基本メディア操作
        doc.getElementById('mp-prev')?.addEventListener('click', function () {
            const btn = document.querySelector('.playControls__prev');
            if (btn) btn.click();
        });
        doc.getElementById('mp-play')?.addEventListener('click', function () {
            const btn = document.querySelector('.playControls__play');
            if (btn) btn.click();
        });
        doc.getElementById('mp-next')?.addEventListener('click', function () {
            const btn = document.querySelector('.playControls__next');
            if (btn) btn.click();
        });

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
            seekToSoundCloudRatio(ratio);
            setTimeout(() => { isSeekingInMiniPlayer = false; }, 300);
        });


        // ボリューム操作
        const volInput = doc.getElementById('mp-vol-input');
        volInput?.addEventListener('input', function (e) {
            const val = parseFloat(e.target.value);
            setSoundCloudVolume(val / 100);
        });

        doc.getElementById('mp-vol-icon')?.addEventListener('click', function () {
            toggleSoundCloudMute();
        });

        // いいね (Like)
        doc.getElementById('mp-like')?.addEventListener('click', function () {
            const likeBtn = document.querySelector('.playbackSoundBadge__like');
            if (likeBtn) {
                const isCurrentlyLiked = likeBtn.classList.contains('sc-button-selected') || likeBtn.getAttribute('aria-checked') === 'true';
                likeBtn.click();
                showToast(isCurrentlyLiked ? '🤍 ライクを解除しました' : '❤️ ライクしました！');
                setTimeout(syncMiniPlayerUI, 300);
            } else {
                showToast('⚠️ Likeボタンが見つかりません');
            }
        });

        // リポスト (Repost) (DOM優先 + APIハイブリッド)
        doc.getElementById('mp-repost')?.addEventListener('click', async function () {
            const repostBtn = document.querySelector('.playbackSoundBadge button.sc-button-repost, .playbackSoundBadge__actions button[title*="Repost"], .playbackSoundBadge__actions button[aria-label*="Repost"], .soundActions button.sc-button-repost, button.sc-button-repost');
            if (repostBtn) {
                const isCurrentlyReposted = repostBtn.classList.contains('sc-button-selected') || repostBtn.getAttribute('aria-checked') === 'true';
                repostBtn.click();
                showToast(isCurrentlyReposted ? '🔁 リポストを解除しました' : '🔁 リポストしました！');
                setTimeout(syncMiniPlayerUI, 400);
                return;
            }

            const t = await ensureCurrentTrackInfo();
            const trackId = t && t.id;
            if (!trackId) {
                showToast('⚠️ トラック情報を取得中...');
                return;
            }

            if (!(await waitForAuthToken(1500))) {
                showToast('⚠️ SoundCloudにログインしてください');
                return;
            }

            if (!state.repostedTrackIds) state.repostedTrackIds = new Set();
            const isCurrentlyReposted = state.repostedTrackIds.has(trackId);
            showToast(isCurrentlyReposted ? '🔁 リポスト解除中...' : '🔁 リポスト中...');

            try {
                const res = await scApi('me/track_reposts/' + trackId, { method: isCurrentlyReposted ? 'DELETE' : 'PUT' });

                if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
                    if (isCurrentlyReposted) {
                        state.repostedTrackIds.delete(trackId);
                        showToast('🔁 リポストを解除しました');
                    } else {
                        state.repostedTrackIds.add(trackId);
                        showToast('🔁 リポストしました！');
                    }
                    syncMiniPlayerUI();
                } else {
                    showToast('⚠️ リポスト通信失敗 (' + res.status + ')');
                }
            } catch (err) {
                console.error('[SC-FreshStation] Repost error:', err);
                showToast('⚠️ 通信エラーが発生しました');
            }
        });

        // フォロー (Follow)
        doc.getElementById('mp-follow')?.addEventListener('click', async function () {
            const t = await ensureCurrentTrackInfo();
            const artistId = t && t.artistId;
            const artistName = (t && t.artistName) || 'アーティスト';

            if (!artistId) {
                showToast('⚠️ アーティストIDを確認中...');
                return;
            }

            const isFollowing = state.followingUserIds.has(artistId);
            showToast(isFollowing ? '👤 フォロー解除中...' : '👤 フォロー中...');

            try {
                if (!(await waitForAuthToken(1500))) {
                    showToast('⚠️ SoundCloudにログインしてください');
                    return;
                }

                // SoundCloud API: フォローは POST、解除は DELETE（以前は PUT を送っていたためフォローできなかった）
                const res = await scApi('me/followings/' + artistId, { method: isFollowing ? 'DELETE' : 'POST' });

                if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
                    if (isFollowing) {
                        state.followingUserIds.delete(artistId);
                        showToast('👤 ' + artistName + ' のフォローを解除しました');
                    } else {
                        state.followingUserIds.add(artistId);
                        showToast('👤 ' + artistName + ' をフォローしました！');
                    }
                    saveCacheData();
                    syncMiniPlayerUI();
                } else {
                    showToast('⚠️ フォロー通信失敗 (' + res.status + ')');
                }
            } catch (e) {
                console.error('[SC-FreshStation] Follow error:', e);
                showToast('⚠️ 通信エラーが発生しました');
            }
        });

        // ステータスバッジ（発掘モード／フォロー新曲）クリックでモード切替
        doc.getElementById('mp-status')?.addEventListener('click', function () {
            toggleDiscoveryEnabled();
        });

        // ステーション開始 (Start Station)
        doc.getElementById('mp-station')?.addEventListener('click', async function () {
            await startTrackStation();
        });

        // プレイリスト追加 & 設定
        const mpAddPlBtn = doc.getElementById('mp-add-pl');
        if (mpAddPlBtn) {
            mpAddPlBtn.addEventListener('click', async function () {
                await handleAddTrackToPlaylist(doc);
            });
            mpAddPlBtn.addEventListener('contextmenu', async function (e) {
                e.preventDefault();
                await chooseTargetPlaylistPrompt(doc);
            });
        }
        doc.getElementById('mp-dislike')?.addEventListener('click', async function () {
            showToast('👎 曲を除外してスキップ');
            await handleDislikeClick();
        });
        doc.getElementById('mp-hate')?.addEventListener('click', async function () {
            showToast('🚫 作者を除外してスキップ');
            await handleHateClick();
        });
    }

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

        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        const playBtn = document.querySelector('.playControls__play');
        const likeBtn = document.querySelector('.playbackSoundBadge__like');
        const repostBtn = document.querySelector('.playbackSoundBadge__actions button[title*="Repost"], .playbackSoundBadge__actions button[aria-label*="Repost"], .playbackSoundBadge__repost');

        const title = (state.currentTrack && state.currentTrack.title) || (titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : '') || '未再生';
        const artist = (state.currentTrack && state.currentTrack.artistName) || (artistEl ? (artistEl.getAttribute('title') || artistEl.textContent) : '') || 'SoundCloud';

        let art = '';
        const badgeImg = document.querySelector('.playbackSoundBadge__avatar span.sc-artwork');
        if (badgeImg && badgeImg.style.backgroundImage) {
            const m = badgeImg.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
            if (m) art = m[1];
        }
        if (art) {
            art = art.replace(/-t(50|120|200)x(50|120|200)\./, '-t200x200.').replace(/-large\./, '-t200x200.');
        }

        const mpTitle = doc.getElementById('mp-title');
        const mpArtist = doc.getElementById('mp-artist');
        const mpArt = doc.getElementById('mp-art');
        const mpPlay = doc.getElementById('mp-play');
        const mpLike = doc.getElementById('mp-like');
        const mpRepost = doc.getElementById('mp-repost');
        const mpFollow = doc.getElementById('mp-follow');
        const mpStatus = doc.getElementById('mp-status');

        if (mpTitle && mpTitle.textContent !== title) mpTitle.textContent = title;
        if (mpArtist && mpArtist.textContent !== artist) mpArtist.textContent = artist;
        if (mpArt && art) {
            mpArt.style.backgroundImage = 'url("' + art + '")';
        }
        if (mpPlay && playBtn) {
            const isPlaying = playBtn.classList.contains('playing');
            mpPlay.textContent = isPlaying ? '⏸' : '▶';
        }

        // Like 状態
        if (mpLike && likeBtn) {
            const isLiked = likeBtn.classList.contains('sc-button-selected') || likeBtn.getAttribute('aria-checked') === 'true';
            if (isLiked) {
                mpLike.textContent = '❤️';
                mpLike.classList.add('liked');
            } else {
                mpLike.textContent = '🤍';
                mpLike.classList.remove('liked');
            }
        }

        // Repost 状態
        if (mpRepost) {
            const trackId = state.currentTrack && state.currentTrack.id;
            let isReposted = false;
            if (repostBtn) {
                isReposted = repostBtn.classList.contains('sc-button-selected') || repostBtn.getAttribute('aria-checked') === 'true';
            } else if (trackId && state.repostedTrackIds && state.repostedTrackIds.has(trackId)) {
                isReposted = true;
            }

            if (isReposted) {
                mpRepost.classList.add('reposted');
            } else {
                mpRepost.classList.remove('reposted');
            }
        }

        // Follow 状態
        if (mpFollow && state.currentTrack && state.currentTrack.artistId) {
            const isFollowing = state.followingUserIds.has(state.currentTrack.artistId);
            if (isFollowing) {
                mpFollow.textContent = '👤✓ フォロー中';
                mpFollow.classList.add('following');
            } else {
                mpFollow.textContent = '👤 フォロー';
                mpFollow.classList.remove('following');
            }
        }

        if (mpStatus) {
            const isOn = state.discoveryEnabled;
            const isDiscovery = state.playbackMode === 'DISCOVERY';
            const label = !isOn ? '⏸ 発掘 OFF' : (isDiscovery ? '🔍 発掘 ON' : '👥 フォロー新曲');
            if (mpStatus.textContent !== label) mpStatus.textContent = label;
            mpStatus.title = isOn ? 'クリックで発掘モードを OFF（SoundCloud 通常再生）' : 'クリックで発掘モードを ON（知っている曲を自動スキップ）';
            mpStatus.classList.toggle('off', !isOn);
            mpStatus.classList.toggle('following-mode', isOn && !isDiscovery);
        }

        // シークバーの同期
        if (!isSeekingInMiniPlayer) {
            const timePassedEl = document.querySelector('.playbackTimeline__timePassed span[aria-hidden="true"]');
            const durationEl = document.querySelector('.playbackTimeline__duration span[aria-hidden="true"]');
            const progressBar = document.querySelector('.playbackTimeline__progressWrapper');

            const passedText = timePassedEl ? timePassedEl.textContent.trim() : '0:00';
            const durationText = durationEl ? durationEl.textContent.trim() : '0:00';

            let ratio = 0;
            if (progressBar) {
                const ariaVal = parseFloat(progressBar.getAttribute('aria-valuenow'));
                const ariaMax = parseFloat(progressBar.getAttribute('aria-valuemax')) || 1;
                if (!isNaN(ariaVal) && ariaMax > 0) {
                    ratio = Math.min(1, Math.max(0, ariaVal / ariaMax));
                }
            }

            const mpPassed = doc.getElementById('mp-time-passed');
            const mpDuration = doc.getElementById('mp-time-duration');
            const mpFill = doc.getElementById('mp-seekbar-fill');
            const mpInput = doc.getElementById('mp-seekbar-input');

            if (mpPassed && mpPassed.textContent !== passedText) mpPassed.textContent = passedText;
            if (mpDuration && mpDuration.textContent !== durationText) mpDuration.textContent = durationText;
            if (mpFill) mpFill.style.width = (ratio * 100) + '%';
            if (mpInput && !isSeekingInMiniPlayer) mpInput.value = (ratio * 100);
        }

        // 音量UIの同期
        syncMiniPlayerVolumeUI(getSoundCloudVolume());
    }

    // 初期化実行: Windows メディア操作パネル用の追加ハンドラー登録
    registerExtraMediaSessionHandlers();

})();
