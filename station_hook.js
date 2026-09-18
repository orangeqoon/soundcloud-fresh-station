// SoundCloud Fresh Station & Follower Stream
(function () {
    'use strict';

    console.log('[SC-FreshStation] Hook loaded in MAIN world (v1.1.1)');

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
        lastSkippedTrackKey: null
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

    // 3. 定期監視タイマー（UIボタン挿入 ＆ 再生中トラックのリアルタイム除外ガード）
    setInterval(function () {
        injectButtons();
        detectAndGuardPlayingTrack();
    }, 1000);

    // 二重防壁: すり抜けて再生された曲をDOM＆IDから即座に検知してスキップ
    function detectAndGuardPlayingTrack() {
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        const likeBtn = document.querySelector('.playbackSoundBadge__like');

        let title = '';
        let artist = '';
        if (titleEl && artistEl) {
            title = titleEl.getAttribute('title') || (titleEl.textContent ? titleEl.textContent.trim() : '');
            artist = artistEl.getAttribute('title') || (artistEl.textContent ? artistEl.textContent.trim() : '');
            if (state.currentTrack && state.currentTrack.title !== title) {
                state.currentTrack.title = title;
                state.currentTrack.artistName = artist;
            }
        }

        const currentTrackKey = title + '::' + artist;
        if (!title || currentTrackKey === state.lastSkippedTrackKey) {
            return;
        }

        // DISCOVERYモード時のガード判定
        if (state.playbackMode === 'DISCOVERY') {
            let shouldSkip = false;
            let reason = '';

            // A. DOMのライクボタンがすでに「選択中(ライク済み)」になっている場合 (100%確実)
            if (likeBtn) {
                const isSelected = likeBtn.classList.contains('sc-button-selected');
                const ariaChecked = likeBtn.getAttribute('aria-checked') === 'true';
                const titleAttr = (likeBtn.getAttribute('title') || '').toLowerCase();
                if (isSelected || ariaChecked || titleAttr.indexOf('unlike') !== -1) {
                    shouldSkip = true;
                    reason = '再生中トラックはすでにLike済み (DOM検知)';
                }
            }

            // B. トラックIDがLikesに含まれている場合
            if (!shouldSkip && state.currentTrack && state.currentTrack.id) {
                if (state.likedTrackIds.has(state.currentTrack.id)) {
                    shouldSkip = true;
                    reason = '再生中トラックIDがLikes一覧に一致';
                } else if (state.currentTrack.artistId && state.followingUserIds.has(state.currentTrack.artistId)) {
                    shouldSkip = true;
                    reason = '再生中トラックの作者をフォロー中';
                }
            }

            // C. Dislikeに登録されている場合
            if (!shouldSkip) {
                if (state.currentTrack && state.currentTrack.id && state.dislikedTracks[state.currentTrack.id]) {
                    shouldSkip = true;
                    reason = '再生中トラックはDislike登録済み';
                } else if (state.currentTrack && state.currentTrack.artistId && state.dislikedArtists[state.currentTrack.artistId]) {
                    shouldSkip = true;
                    reason = '再生中アーティストはDislike登録済み';
                }
            }

            if (shouldSkip) {
                console.warn('[SC-FreshStation:Guard] 🚫 ' + reason + ' -> 自動スキップ実行: ' + title + ' (' + artist + ')');
                state.lastSkippedTrackKey = currentTrackKey;
                const skipBtn = document.querySelector('.playControls__next');
                if (skipBtn) {
                    skipBtn.click();
                }
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
        detectAndGuardPlayingTrack();
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

    async function handleDislikeClick() {
        const t = await ensureCurrentTrackInfo();
        if (!t || (!t.id && !t.title)) {
            alert('現在再生中のトラック情報が取得できませんでした。少し待ってから再度押してください。');
            return;
        }

        const confirmMsg = '【👎 Dislike: この曲のみ除外】\n\n' +
            '曲名: "' + t.title + '"\n' +
            '作者: ' + t.artistName + '\n\n' +
            'この曲を二度と流れないよう除外して、次へスキップしますか？\n' +
            '（※この作者の他の曲は今後も再生されます）';

        if (!confirm(confirmMsg)) return;

        const trackKey = t.id || ('title_' + encodeURIComponent(t.title));
        state.dislikedTracks[trackKey] = {
            title: t.title,
            artist: t.artistName,
            genre: t.genre,
            date: new Date().toLocaleDateString()
        };

        saveDislikeData();
        console.log('[SC-FreshStation] Disliked track only: ' + t.title + '. Skipping...');

        const skipBtn = document.querySelector('.playControls__next');
        if (skipBtn) {
            skipBtn.click();
        }
    }

    async function handleHateClick() {
        const t = await ensureCurrentTrackInfo();
        if (!t || (!t.id && !t.title)) {
            alert('現在再生中のトラック情報が取得できませんでした。少し待ってから再度押してください。');
            return;
        }

        const confirmMsg = '【🚫 Hate: この作者の全曲を除外】\n\n' +
            '作者: ' + t.artistName + '\n' +
            '再生中: "' + t.title + '"\n\n' +
            'この作者「' + t.artistName + '」の全楽曲を今後一切流さないよう除外して、次へスキップしますか？\n' +
            '（※この作者のすべての曲がステーション再生から完全排除されます）';

        if (!confirm(confirmMsg)) return;

        const artistKey = t.artistId || ('artist_' + encodeURIComponent(t.artistName));
        state.dislikedArtists[artistKey] = {
            name: t.artistName,
            date: new Date().toLocaleDateString()
        };

        saveDislikeData();
        console.log('[SC-FreshStation] Hated artist completely: ' + t.artistName + '. Skipping...');

        const skipBtn = document.querySelector('.playControls__next');
        if (skipBtn) {
            skipBtn.click();
        }
    }

})();
