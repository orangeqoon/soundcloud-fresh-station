// Background Service Worker for FreshDig for SoundCloud
(function () {
    'use strict';

    console.log('[SC-FreshStation] Background Service Worker initialized');

    function getSoundCloudAuthToken(callback) {
        if (!chrome.cookies) {
            callback(null);
            return;
        }
        chrome.cookies.get({ url: 'https://soundcloud.com', name: 'oauth_token' }, function (cookie) {
            if (chrome.runtime.lastError) {
                console.warn('[SC-FreshStation] Cookie error:', chrome.runtime.lastError);
                callback(null);
                return;
            }
            if (cookie && cookie.value) {
                const tok = cookie.value.startsWith('OAuth ') ? cookie.value : ('OAuth ' + cookie.value);
                callback(tok);
            } else {
                callback(null);
            }
        });
    }

    function injectTokenToTab(tabId, token) {
        if (!tabId || !token) return;
        chrome.tabs.sendMessage(tabId, {
            target: 'SC_FRESH_STATION',
            action: 'INJECT_AUTH_TOKEN',
            token: token
        }).catch(function () {
            // Tab might not be ready or not a SoundCloud page yet
        });
    }

    function broadcastTokenToAllSoundCloudTabs(token) {
        if (!token) return;
        chrome.tabs.query({ url: '*://*.soundcloud.com/*' }, function (tabs) {
            if (!tabs) return;
            tabs.forEach(function (tab) {
                injectTokenToTab(tab.id, token);
            });
        });
    }

    // 1. タブの更新を検知して自動でトークンを注入
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if ((changeInfo.status === 'loading' || changeInfo.status === 'complete') && tab.url && tab.url.includes('soundcloud.com')) {
            getSoundCloudAuthToken(function (token) {
                if (token) {
                    injectTokenToTab(tabId, token);
                }
            });
        }
    });

    // 2. Cookieの変更（ログイン・ログアウト・更新）をリアルタイム検知
    if (chrome.cookies && chrome.cookies.onChanged) {
        chrome.cookies.onChanged.addListener(function (changeInfo) {
            if (changeInfo.cookie && changeInfo.cookie.domain && changeInfo.cookie.domain.includes('soundcloud.com') && changeInfo.cookie.name === 'oauth_token') {
                if (!changeInfo.removed && changeInfo.cookie.value) {
                    const tok = changeInfo.cookie.value.startsWith('OAuth ') ? changeInfo.cookie.value : ('OAuth ' + changeInfo.cookie.value);
                    broadcastTokenToAllSoundCloudTabs(tok);
                }
            }
        });
    }

    // 「後で聴く作者」: 読み出し→変更→保存を、ここ(サービスワーカー)の 1 か所で順番に行う（タブ同士の上書き事故を防ぐ）
    const LATER_MAX = 500;
    let laterChain = Promise.resolve();

    function cleanStr(v, n) { return String(v === undefined || v === null ? '' : v).slice(0, n); }

    async function doLater(req) {
        const store = await chrome.storage.local.get('laterArtists');
        const list = Array.isArray(store.laterArtists) ? store.laterArtists : [];
        if (req.action === 'LATER_ADD') {
            const it = req.item || {};
            const id = cleanStr(it.artistId, 40);
            if (!id) return { ok: false, reason: 'bad-item' };
            if (list.some(function (x) { return String(x.artistId) === id; })) return { ok: true, exists: true };
            if (list.length >= LATER_MAX) return { ok: false, reason: 'limit' };
            list.unshift({
                artistId: id,
                name: cleanStr(it.name, 200),
                permalink: cleanStr(it.permalink, 200),
                avatarUrl: cleanStr(it.avatarUrl, 500),
                addedAt: Date.now(),
                fromTrackTitle: cleanStr(it.fromTrackTitle, 300)
            });
            await chrome.storage.local.set({ laterArtists: list });
            return { ok: true };
        }
        if (req.action === 'LATER_REMOVE') {
            const id = cleanStr(req.artistId, 40);
            const next = list.filter(function (x) { return String(x.artistId) !== id; });
            if (next.length !== list.length) await chrome.storage.local.set({ laterArtists: next });
            return { ok: true };
        }
        return { ok: false, reason: 'unknown' };
    }

    // 3. content_bridge や popup からの要求に応答
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request && (request.action === 'LATER_ADD' || request.action === 'LATER_REMOVE')) {
            laterChain = laterChain.then(function () { return doLater(request); }).catch(function (e) { return { ok: false, reason: 'error' }; });
            laterChain.then(function (res) { try { sendResponse(res); } catch (e) {} });
            return true; // 非同期レスポンス
        }
        if (request && request.action === 'GET_AUTH_TOKEN') {
            getSoundCloudAuthToken(function (token) {
                sendResponse({ token: token });
                if (token && sender && sender.tab && sender.tab.id) {
                    injectTokenToTab(sender.tab.id, token);
                }
            });
            return true; // 非同期レスポンス
        }
    });
})();
