// SoundCloud Fresh Station & Follower Stream
(function () {
    'use strict';

    console.log('[SC-FreshStation] Hook loaded in MAIN world (FreshDig v1.6.0)');

    const STORAGE_KEY = 'sc_fresh_station_data_v1';
    const TARGET_PLAYLIST_KEY = 'sc_fresh_station_target_playlist_id';
    const PLAYBACK_MODE_KEY = 'sc_fresh_station_playback_mode';
    const CACHE_LIKES_KEY = 'sc_fresh_station_cache_likes';
    const CACHE_FOLLOWS_KEY = 'sc_fresh_station_cache_follows';
    const CACHE_PLAYLISTS_KEY = 'sc_fresh_station_cache_playlists';
    const CACHE_CLIENT_ID_KEY = 'sc_fresh_station_client_id';

    const state = {
        myUserId: null,
        oauthToken: null,
        clientId: localStorage.getItem(CACHE_CLIENT_ID_KEY) || null,
        likedTrackIds: new Set(),
        followingUserIds: new Set(),
        isUserDataLoaded: false,
        playbackMode: localStorage.getItem(PLAYBACK_MODE_KEY) || 'DISCOVERY', // 'DISCOVERY' or 'FOLLOWING_NEW'
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
            state.playbackMode = localStorage.getItem(PLAYBACK_MODE_KEY) || 'DISCOVERY';

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

    // Cookieから即座にトークンを抽出
    function extractAuthTokenFromCookie() {
        if (state.oauthToken) return state.oauthToken;
        const match = document.cookie.match(/(?:^|;\s*)oauth_token=([^;]+)/);
        if (match && match[1]) {
            const tok = decodeURIComponent(match[1]);
            state.oauthToken = tok.startsWith('OAuth ') ? tok : ('OAuth ' + tok);
            return state.oauthToken;
        }
        return null;
    }

    window.addEventListener('message', async function (event) {
        if (event.data && event.data.type === 'SC_FRESH_STATION_POPUP_ACTION') {
            const action = event.data.action;
            const targetType = event.data.targetType;
            const targetId = event.data.targetId;

            if (action === 'INJECT_AUTH_TOKEN') {
                if (event.data.token) {
                    state.oauthToken = event.data.token;
                    console.log('[SC-FreshStation] Injected OAuth token from extension:', state.oauthToken.slice(0, 15) + '...');
                    if (!state.isUserDataLoaded || state.myPlaylists.length === 0) {
                        initUserData();
                    }
                }
            } else if (action === 'FORCE_SYNC') {
                console.log('[SC-FreshStation] Force sync requested from popup');
                state.isUserDataLoaded = false;
                await initUserData();
            } else if (action === 'REMOVE') {
                if (targetType === 'track') delete state.dislikedTracks[targetId];
                if (targetType === 'artist') delete state.dislikedArtists[targetId];
                if (targetType === 'genre') delete state.dislikedGenres[targetId];
                saveDislikeData();
            } else if (action === 'SET_TARGET_PLAYLIST') {
                state.targetPlaylistId = targetId;
                if (targetId) {
                    localStorage.setItem(TARGET_PLAYLIST_KEY, targetId);
                } else {
                    localStorage.removeItem(TARGET_PLAYLIST_KEY);
                }
                updatePlaylistButtonUI();
            } else if (action === 'SET_PLAYBACK_MODE') {
                state.playbackMode = event.data.mode;
                localStorage.setItem(PLAYBACK_MODE_KEY, state.playbackMode);
                console.log('[SC-FreshStation] Switched mode to:', state.playbackMode);
            } else if (action === 'EXPORT_DISLIKES') {
                exportDislikesToPlaylist().then(function (result) {
                    window.postMessage({
                        type: 'SC_FRESH_STATION_ACTION_RESULT',
                        action: 'EXPORT_DISLIKES',
                        result: result
                    }, '*');
                });
            } else if (action === 'IMPORT_DISLIKES') {
                importDislikesFromPlaylist().then(function (result) {
                    window.postMessage({
                        type: 'SC_FRESH_STATION_ACTION_RESULT',
                        action: 'IMPORT_DISLIKES',
                        result: result
                    }, '*');
                });
            } else if (action === 'TOGGLE_MINI_PLAYER') {
                toggleMiniPlayer();
            } else if (action === 'GET_DATA') {
                loadCachedData();
                extractAuthTokenFromCookie();
                if (state.clientId && state.oauthToken && (!state.isUserDataLoaded || state.myPlaylists.length === 0)) {
                    initUserData();
                }
                window.postMessage({
                    type: 'SC_FRESH_STATION_DATA_RESPONSE',
                    data: {
                        dislikedTracks: state.dislikedTracks,
                        dislikedArtists: state.dislikedArtists,
                        dislikedGenres: state.dislikedGenres,
                        myPlaylists: state.myPlaylists,
                        targetPlaylistId: state.targetPlaylistId,
                        playbackMode: state.playbackMode,
                        likedCount: state.likedTrackIds.size,
                        followingCount: state.followingUserIds.size,
                        isReady: state.isUserDataLoaded
                    }
                }, '*');
            }
        }
    });

    loadCachedData();
    extractAuthTokenFromCookie();

    // 積極的 client_id 発見ロジック
    async function discoverClientId() {
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
                }
                const options = args[1];
                if (options && options.headers) {
                    const headers = options.headers;
                    const auth = (typeof headers.get === 'function' ? headers.get('Authorization') : headers.Authorization) || headers['authorization'];
                    if (auth && auth.indexOf('OAuth ') === 0) {
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
                if (trackData && trackData.id && trackData.title) {
                    updateCurrentTrackInfo(trackData);
                }
            } catch (e) {}
            return response;
        }

        // C. Intercept Stream (タイムライン / Stream: フォロー中の新曲)
        if (url.indexOf('api-v2.soundcloud.com/stream') !== -1) {
            const response = await originalFetch.apply(this, args);
            if (state.playbackMode === 'FOLLOWING_NEW') {
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

            if (!state.isUserDataLoaded) {
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
                    while (data.collection.length < 10 && nextHref) {
                        const nextUrl = nextHref.indexOf('client_id=') !== -1 ? nextHref : (nextHref + '&client_id=' + state.clientId);
                        const nextRes = await originalFetch(nextUrl, {
                            headers: { 'Authorization': state.oauthToken }
                        });
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

    async function initUserData() {
        extractAuthTokenFromCookie();
        if (!state.clientId) {
            await discoverClientId();
        }
        if (!state.clientId) {
            console.warn('[SC-FreshStation] Still waiting for clientId...');
            return;
        }

        console.log('[SC-FreshStation] Syncing user profile, playlists, likes...');

        try {
            const authHeaders = state.oauthToken ? { 'Authorization': state.oauthToken } : {};

            let meData = null;
            try {
                const meRes = await originalFetch('https://api-v2.soundcloud.com/me?client_id=' + state.clientId, {
                    headers: authHeaders,
                    credentials: 'include'
                });
                if (meRes.ok) {
                    meData = await meRes.json();
                }
            } catch (e) {}

            if (meData && meData.id) {
                state.myUserId = meData.id;
            }

            // myUserId がまだなければ hydration からフォールバック取得
            if (!state.myUserId && window.__sc_hydration && Array.isArray(window.__sc_hydration)) {
                for (const item of window.__sc_hydration) {
                    if (item.hydratable === 'user' && item.data && item.data.id) {
                        state.myUserId = item.data.id;
                        break;
                    }
                }
            }

            if (state.myUserId) {
                // プレイリスト一覧取得
                const plRes = await originalFetch('https://api-v2.soundcloud.com/users/' + state.myUserId + '/playlists?limit=50&client_id=' + state.clientId, {
                    headers: authHeaders,
                    credentials: 'include'
                });
                const plData = await plRes.json();
                if (plData && plData.collection) {
                    state.myPlaylists = plData.collection.map(function (p) {
                        return {
                            id: p.id,
                            title: p.title,
                            trackCount: p.track_count || 0
                        };
                    });
                    if (!state.targetPlaylistId && state.myPlaylists.length > 0) {
                        state.targetPlaylistId = String(state.myPlaylists[0].id);
                        localStorage.setItem(TARGET_PLAYLIST_KEY, state.targetPlaylistId);
                    }
                    updatePlaylistButtonUI();
                }

                // ライク一覧取得 (最大1000件)
                let likesUrl = 'https://api-v2.soundcloud.com/users/' + state.myUserId + '/track_likes?limit=200&client_id=' + state.clientId;
                while (likesUrl && state.likedTrackIds.size < 1000) {
                    const res = await originalFetch(likesUrl, { headers: authHeaders, credentials: 'include' });
                    const d = await res.json();
                    if (d.collection) {
                        d.collection.forEach(function (item) {
                            const tId = item.track ? item.track.id : (item.target ? item.target.id : item.id);
                            if (tId) state.likedTrackIds.add(tId);
                        });
                    }
                    likesUrl = d.next_href ? (d.next_href + '&client_id=' + state.clientId) : null;
                }

                // フォロー一覧取得 (最大1000件)
                let followingsUrl = 'https://api-v2.soundcloud.com/users/' + state.myUserId + '/followings?limit=200&client_id=' + state.clientId;
                while (followingsUrl && state.followingUserIds.size < 1000) {
                    const res = await originalFetch(followingsUrl, { headers: authHeaders, credentials: 'include' });
                    const d = await res.json();
                    if (d.collection) {
                        d.collection.forEach(function (u) {
                            if (u.id) state.followingUserIds.add(u.id);
                        });
                    }
                    followingsUrl = d.next_href ? (d.next_href + '&client_id=' + state.clientId) : null;
                }

                state.isUserDataLoaded = true;
                saveCacheData();
                console.log('[SC-FreshStation] Full sync complete! ' + state.myPlaylists.length + ' playlists, ' + state.likedTrackIds.size + ' likes, ' + state.followingUserIds.size + ' followings.');
            }
        } catch (e) {
            console.error('[SC-FreshStation] Failed to sync user data:', e);
        }
    }

    function updateCurrentTrackInfo(track) {
        state.currentTrack = {
            id: track.id,
            title: track.title,
            artistId: track.user ? track.user.id : track.user_id,
            artistName: track.user ? track.user.username : 'Unknown',
            genre: (track.genre || '').trim()
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
            updateMediaSessionMetadata(title, artist);
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

        // 5. 連続スキップ防止ブレーキ（万が一の無限ループ防止）
        if (marginGuard.consecutiveSkips >= 10) {
            console.warn('[SC-FreshStation] ⚠️ 連続スキップが10曲に達したため、安全のため自動スキップを一時停止しました。');
            marginGuard.hasChecked = true;
            return;
        }

        // --- ここからマージン経過後の正確な除外判定 ---
        marginGuard.hasChecked = true; // この曲の判定を完了済みにマーク

        // 未知の曲発掘モード（DISCOVERY）の場合に除外スキップ
        if (state.playbackMode === 'DISCOVERY') {
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

        // 1. Dislikeボタン (アイコン1個: 👎) - この曲だけ除外
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

        // 2. Hateボタン (アイコン1個: 🚫) - この作者の曲すべてを除外
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

        // 3. プレイリスト一発挿入ボタン (アイコン1個: ➕)
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

        // 4. ミニプレイヤー起動ボタン (アイコン1個: 🪟)
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

    function chooseTargetPlaylistPrompt() {
        if (state.myPlaylists.length === 0) {
            alert('プレイリストが見つかりませんでした。SoundCloudにログインしているか確認してください。');
            return;
        }
        const listText = state.myPlaylists.map(function (p, idx) { return '[' + (idx + 1) + '] ' + p.title + ' (' + p.trackCount + '曲)'; }).join('\n');
        const choice = prompt('ワンクリックで追加するプレイリストの番号を入力してください：\n\n' + listText);
        if (!choice) return;
        const num = parseInt(choice, 10);
        if (!isNaN(num) && num >= 1 && num <= state.myPlaylists.length) {
            const selected = state.myPlaylists[num - 1];
            state.targetPlaylistId = String(selected.id);
            localStorage.setItem(TARGET_PLAYLIST_KEY, state.targetPlaylistId);
            updatePlaylistButtonUI();
            alert('保存先プレイリストを「' + selected.title + '」に設定しました！');
        } else {
            alert('無効な番号です。');
        }
    }

    async function handleAddTrackToPlaylist() {
        const btn = document.getElementById('sc-fresh-station-playlist-btn');
        if (!state.currentTrack || !state.currentTrack.id) {
            // DOMからトラック情報の解決を試みる
            const titleLink = document.querySelector('.playbackSoundBadge__titleLink');
            if (titleLink && titleLink.getAttribute('href') && state.clientId) {
                try {
                    if (btn) btn.innerHTML = '⏳';
                    const href = titleLink.getAttribute('href');
                    const resolveUrl = 'https://api-v2.soundcloud.com/resolve?url=' + encodeURIComponent('https://soundcloud.com' + href) + '&client_id=' + state.clientId;
                    const rRes = await originalFetch(resolveUrl, {
                        headers: state.oauthToken ? { 'Authorization': state.oauthToken } : {},
                        credentials: 'include'
                    });
                    const rData = await rRes.json();
                    if (rData && rData.id) {
                        state.currentTrack = {
                            id: rData.id,
                            title: rData.title,
                            artistId: rData.user ? rData.user.id : rData.user_id,
                            artistName: rData.user ? rData.user.username : 'Unknown',
                            genre: (rData.genre || '').trim()
                        };
                    }
                } catch (e) {}
            }
        }

        if (!state.currentTrack || !state.currentTrack.id) {
            alert('現在再生中のトラック情報が取得できませんでした。曲を再生してから押してください。');
            if (btn) btn.innerHTML = '➕';
            return;
        }
        if (!state.targetPlaylistId) {
            chooseTargetPlaylistPrompt();
            if (!state.targetPlaylistId) {
                if (btn) btn.innerHTML = '➕';
                return;
            }
        }

        const playlist = state.myPlaylists.find(function (p) { return String(p.id) === String(state.targetPlaylistId); });
        const plTitle = playlist ? playlist.title : '指定プレイリスト';
        const trackTitle = state.currentTrack.title;
        const trackId = state.currentTrack.id;

        if (btn) btn.innerHTML = '⏳';

        try {
            const plUrl = 'https://api-v2.soundcloud.com/playlists/' + state.targetPlaylistId + '?client_id=' + state.clientId;
            const plRes = await originalFetch(plUrl, {
                headers: state.oauthToken ? { 'Authorization': state.oauthToken } : {},
                credentials: 'include'
            });
            const plData = await plRes.json();

            let currentTrackIds = (plData.tracks || []).map(function (t) { return t.id; });
            if (currentTrackIds.indexOf(trackId) !== -1) {
                alert('「' + trackTitle + '」はすでに「' + plTitle + '」に入っています。');
                if (btn) btn.innerHTML = '➕';
                return;
            }

            currentTrackIds.push(trackId);

            const putRes = await originalFetch('https://api-v2.soundcloud.com/playlists/' + state.targetPlaylistId + '?client_id=' + state.clientId, {
                method: 'PUT',
                headers: {
                    ...(state.oauthToken ? { 'Authorization': state.oauthToken } : {}),
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    playlist: {
                        tracks: currentTrackIds
                    }
                })
            });

            if (putRes.ok) {
                console.log('[SC-FreshStation] Added track ' + trackId + ' to playlist ' + state.targetPlaylistId);
                if (btn) {
                    btn.innerHTML = '✅';
                    btn.style.background = '#00c853';
                    btn.style.borderColor = '#00c853';
                    setTimeout(function () {
                        btn.innerHTML = '➕';
                        btn.style.background = '#ff5500';
                        btn.style.borderColor = '#ff5500';
                        updatePlaylistButtonUI();
                    }, 1500);
                }
            } else {
                throw new Error('Status ' + putRes.status);
            }
        } catch (err) {
            console.error('[SC-FreshStation] Failed to add track to playlist:', err);
            alert('プレイリストへの追加に失敗しました: ' + err.message);
            if (btn) {
                btn.innerHTML = '➕';
                btn.style.background = '#ff5500';
            }
        }
    }

    async function ensureCurrentTrackInfo() {
        if (state.currentTrack && (state.currentTrack.id || state.currentTrack.title)) {
            return state.currentTrack;
        }
        detectPlayingTrackFromDOM();
        const titleLink = document.querySelector('.playbackSoundBadge__titleLink');
        if (titleLink && titleLink.getAttribute('href') && state.clientId) {
            try {
                const href = titleLink.getAttribute('href');
                const resolveUrl = 'https://api-v2.soundcloud.com/resolve?url=' + encodeURIComponent('https://soundcloud.com' + href) + '&client_id=' + state.clientId;
                const rRes = await originalFetch(resolveUrl, {
                    headers: state.oauthToken ? { 'Authorization': state.oauthToken } : {},
                    credentials: 'include'
                });
                const rData = await rRes.json();
                if (rData && rData.id) {
                    state.currentTrack = {
                        id: rData.id,
                        title: rData.title,
                        artistId: rData.user ? rData.user.id : rData.user_id,
                        artistName: rData.user ? rData.user.username : 'Unknown',
                        genre: (rData.genre || '').trim()
                    };
                }
            } catch (e) {}
        }
        return state.currentTrack;
    }

    const DISLIKE_PLAYLIST_TITLE = '[FreshDig] Disliked Tracks';

    // Dislike 曲を SoundCloud プレイリストにエクスポート
    async function exportDislikesToPlaylist() {
        extractAuthTokenFromCookie();
        if (!state.oauthToken || !state.clientId) {
            return { success: false, message: 'SoundCloudのログイン情報が取得できませんでした。ログインをご確認ください。' };
        }

        // 数値トラックIDを収集
        const trackIds = [];
        for (const key of Object.keys(state.dislikedTracks)) {
            const numId = parseInt(key, 10);
            if (!isNaN(numId) && numId > 0) {
                trackIds.push(numId);
            }
        }

        if (trackIds.length === 0) {
            return { success: false, message: 'エクスポートするDislike曲が登録されていません。' };
        }

        try {
            await initUserData();
            const existingPl = state.myPlaylists.find(p => p.title.toLowerCase() === DISLIKE_PLAYLIST_TITLE.toLowerCase());

            if (existingPl) {
                const plUrl = 'https://api-v2.soundcloud.com/playlists/' + existingPl.id + '?client_id=' + state.clientId;
                const plRes = await originalFetch(plUrl, {
                    headers: { 'Authorization': state.oauthToken },
                    credentials: 'include'
                });
                const plData = await plRes.json();
                const currentIds = (plData.tracks || []).map(t => t.id);
                const mergedIds = Array.from(new Set([...currentIds, ...trackIds]));

                const putRes = await originalFetch('https://api-v2.soundcloud.com/playlists/' + existingPl.id + '?client_id=' + state.clientId, {
                    method: 'PUT',
                    headers: {
                        'Authorization': state.oauthToken,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        playlist: { tracks: mergedIds }
                    })
                });

                if (putRes.ok) {
                    return { success: true, message: `プレイリスト「${DISLIKE_PLAYLIST_TITLE}」に ${trackIds.length} 曲をエクスポートしました！（合計 ${mergedIds.length} 曲）` };
                } else {
                    return { success: false, message: 'エクスポート更新に失敗しました (HTTP ' + putRes.status + ')' };
                }
            } else {
                const postRes = await originalFetch('https://api-v2.soundcloud.com/playlists?client_id=' + state.clientId, {
                    method: 'POST',
                    headers: {
                        'Authorization': state.oauthToken,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        playlist: {
                            title: DISLIKE_PLAYLIST_TITLE,
                            sharing: 'private',
                            tracks: trackIds
                        }
                    })
                });

                if (postRes.ok) {
                    await initUserData();
                    return { success: true, message: `新しい非公開プレイリスト「${DISLIKE_PLAYLIST_TITLE}」を作成し、${trackIds.length} 曲をエクスポートしました！` };
                } else {
                    return { success: false, message: 'プレイリスト新規作成に失敗しました (HTTP ' + postRes.status + ')' };
                }
            }
        } catch (e) {
            console.error('[SC-FreshStation] Export dislikes error:', e);
            return { success: false, message: 'エラーが発生しました: ' + e.message };
        }
    }

    // SoundCloud プレイリストから Dislike 曲をインポート
    async function importDislikesFromPlaylist() {
        extractAuthTokenFromCookie();
        if (!state.oauthToken || !state.clientId) {
            return { success: false, message: 'SoundCloudのログイン情報が取得できませんでした。ログインをご確認ください。' };
        }

        try {
            await initUserData();
            let targetPl = state.myPlaylists.find(p => p.title.toLowerCase() === DISLIKE_PLAYLIST_TITLE.toLowerCase());
            if (!targetPl) {
                targetPl = state.myPlaylists.find(p => p.title.toLowerCase().includes('dislike'));
            }

            if (!targetPl) {
                return { success: false, message: `「${DISLIKE_PLAYLIST_TITLE}」という名前のプレイリストが見つかりませんでした。先にエクスポートするか、プレイリストを作成してください。` };
            }

            const plUrl = 'https://api-v2.soundcloud.com/playlists/' + targetPl.id + '?client_id=' + state.clientId;
            const res = await originalFetch(plUrl, {
                headers: { 'Authorization': state.oauthToken },
                credentials: 'include'
            });

            if (!res.ok) {
                return { success: false, message: 'プレイリスト取得失敗 (HTTP ' + res.status + ')' };
            }

            const plData = await res.json();
            const tracks = plData.tracks || [];
            if (tracks.length === 0) {
                return { success: false, message: `プレイリスト「${targetPl.title}」には曲がありませんでした。` };
            }

            let importedCount = 0;
            tracks.forEach(track => {
                if (track && track.id) {
                    const key = String(track.id);
                    if (!state.dislikedTracks[key]) {
                        importedCount++;
                    }
                    state.dislikedTracks[key] = {
                        title: track.title || 'Unknown',
                        artist: track.user ? track.user.username : 'Unknown',
                        genre: track.genre || '',
                        date: new Date().toLocaleDateString()
                    };
                }
            });

            saveDislikeData();
            return { success: true, message: `プレイリスト「${targetPl.title}」から ${tracks.length} 曲を読み込み、${importedCount} 件をDislikeリストに反映しました！` };
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
    // 🎵 Windows タスクバー / メディアキー / 音量フライアウト連携 (Media Session API)
    // =========================================================================
    function initMediaSessionHandlers() {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.setActionHandler('play', function () {
                const btn = document.querySelector('.playControls__play');
                if (btn) btn.click();
            });
            navigator.mediaSession.setActionHandler('pause', function () {
                const btn = document.querySelector('.playControls__play');
                if (btn) btn.click();
            });
            navigator.mediaSession.setActionHandler('previoustrack', function () {
                const btn = document.querySelector('.playControls__prev');
                if (btn) btn.click();
            });
            navigator.mediaSession.setActionHandler('nexttrack', function () {
                const btn = document.querySelector('.playControls__next');
                if (btn) btn.click();
            });
            console.log('[SC-FreshStation] 🎵 Windows Taskbar & Media Keys (MediaSession) handlers connected!');
        } catch (e) {
            console.warn('[SC-FreshStation] MediaSession registration warning:', e);
        }
    }

    function updateMediaSessionMetadata(title, artist, artworkUrl) {
        if (!('mediaSession' in navigator) || !window.MediaMetadata) return;

        let art = artworkUrl || '';
        if (!art) {
            const badgeImg = document.querySelector('.playbackSoundBadge__avatar span.sc-artwork');
            if (badgeImg && badgeImg.style.backgroundImage) {
                const m = badgeImg.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
                if (m) art = m[1];
            }
        }
        if (art) {
            art = art.replace(/-t(50|120|200)x(50|120|200)\./, '-t500x500.').replace(/-large\./, '-t500x500.');
        }

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || 'SoundCloud Track',
                artist: artist || 'Unknown Artist',
                album: 'FreshDig for SoundCloud',
                artwork: art ? [
                    { src: art, sizes: '500x500', type: 'image/jpeg' },
                    { src: art, sizes: '256x256', type: 'image/jpeg' },
                    { src: art, sizes: '128x128', type: 'image/jpeg' }
                ] : []
            });
        } catch (e) {
            console.warn('[SC-FreshStation] MediaSession metadata update warning:', e);
        }
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
                    height: 170
                });
            } else {
                miniPlayerWindow = window.open(
                    '',
                    'SCFreshMiniPlayer',
                    'width=350,height=170,menubar=no,toolbar=no,location=no,status=no,resizable=no'
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
                    gap: 5px;
                    margin-top: 3px;
                }
                .status-badge {
                    display: inline-block;
                    font-size: 9px;
                    padding: 1px 5px;
                    border-radius: 3px;
                    background: rgba(255, 85, 0, 0.2);
                    color: #ff5500;
                    white-space: nowrap;
                }
                .btn-follow {
                    background: #222;
                    border: 1px solid #444;
                    color: #aaa;
                    font-size: 9px;
                    padding: 1px 6px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
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
                        <button class="btn-follow" id="mp-follow" title="アーティストをフォロー">👤＋ フォロー</button>
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

        function seekToSoundCloudRatio(ratio) {
            const progressWrapper = document.querySelector('.playbackTimeline__progressWrapper');
            if (progressWrapper) {
                const rect = progressWrapper.getBoundingClientRect();
                const clientX = rect.left + rect.width * ratio;
                const clientY = rect.top + rect.height / 2;
                progressWrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX, clientY }));
                progressWrapper.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX, clientY }));
            }
        }

        // いいね (Like)
        doc.getElementById('mp-like')?.addEventListener('click', function () {
            const likeBtn = document.querySelector('.playbackSoundBadge__like');
            if (likeBtn) {
                likeBtn.click();
                const wasLiked = likeBtn.classList.contains('sc-button-selected');
                showToast(wasLiked ? '🤍 ライクを解除しました' : '❤️ ライクしました！');
                setTimeout(syncMiniPlayerUI, 300);
            } else {
                showToast('⚠️ Likeボタンが見つかりません');
            }
        });

        // リポスト (Repost) (DOM優先 + APIハイブリッド)
        doc.getElementById('mp-repost')?.addEventListener('click', async function () {
            const repostBtn = document.querySelector('.playbackSoundBadge button.sc-button-repost, .playbackSoundBadge__actions button[title*="Repost"], .playbackSoundBadge__actions button[aria-label*="Repost"], .soundActions button.sc-button-repost, button.sc-button-repost');
            if (repostBtn) {
                repostBtn.click();
                const wasReposted = repostBtn.classList.contains('sc-button-selected');
                showToast(wasReposted ? '🔁 リポストを解除しました' : '🔁 リポストしました！');
                setTimeout(syncMiniPlayerUI, 400);
                return;
            }

            const t = await ensureCurrentTrackInfo();
            const trackId = t && t.id;
            if (!trackId) {
                showToast('⚠️ トラック情報を取得中...');
                return;
            }

            extractAuthTokenFromCookie();
            if (!state.oauthToken || !state.clientId) {
                showToast('⚠️ ログイン認証が必要です');
                return;
            }

            if (!state.repostedTrackIds) state.repostedTrackIds = new Set();
            const isCurrentlyReposted = state.repostedTrackIds.has(trackId);
            showToast(isCurrentlyReposted ? '🔁 リポスト解除中...' : '🔁 リポスト中...');

            try {
                const method = isCurrentlyReposted ? 'DELETE' : 'PUT';
                const url = 'https://api-v2.soundcloud.com/me/track_reposts/' + trackId + '?client_id=' + state.clientId;
                const res = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': state.oauthToken,
                        'Accept': 'application/json'
                    }
                });

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
                extractAuthTokenFromCookie();
                if (!state.oauthToken || !state.clientId) {
                    showToast('⚠️ ログイン認証が必要です');
                    return;
                }

                const method = isFollowing ? 'DELETE' : 'PUT';
                const url = 'https://api-v2.soundcloud.com/me/followings/' + artistId + '?client_id=' + state.clientId;
                const res = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': state.oauthToken,
                        'Accept': 'application/json'
                    }
                });

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

        // プレイリスト追加 & 除外
        doc.getElementById('mp-add-pl')?.addEventListener('click', async function () {
            showToast('➕ 追加中...');
            await handleAddTrackToPlaylist();
            showToast('✅ 追加完了！');
        });
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
                mpFollow.textContent = '👤＋ フォロー';
                mpFollow.classList.remove('following');
            }
        }

        if (mpStatus) {
            mpStatus.textContent = state.playbackMode === 'DISCOVERY' ? '🔍 発掘モード' : '👥 フォロー新曲';
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
    }

    // 初期化実行: タスクバー MediaSession 登録
    initMediaSessionHandlers();

})();
