// FreshDig の純粋な判定処理（DOM・通信・状態を触らない）。Node からもテストできる。
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FreshDigCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function toNumId(v) {
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : null;
  }

  // 除外記録（Dislike 曲・作者・ジャンル）に空のキーを入れない（全曲スキップ事故の防止）
  function isValidDislikeKey(key) {
    if (key === undefined || key === null) return false;
    const s = String(key).trim();
    return s !== '' && s !== 'undefined' && s !== 'null' && s !== 'title_' && s !== 'artist_' && s !== '0' && s !== 'NaN';
  }

  // 曲の除外判定。理由は言語に依存しないキーで返す（表示時に i18n で訳す）。
  // info: { id, artistId, title, artistName, genre }
  // ctx: { discoveryEnabled, playbackMode, dislikedTracks, dislikedArtists, dislikedGenres,
  //        myUserId, likedTrackIds(Set), followingUserIds(Set), inLibrary, onArtistPage }
  function getSkipReasonKey(info, ctx) {
    if (!ctx || !ctx.discoveryEnabled || ctx.playbackMode !== 'DISCOVERY' || !info) return null;
    const id = toNumId(info.id);
    const artistId = toNumId(info.artistId);
    const title = info.title || '';
    const artist = info.artistName || '';
    const genre = (info.genre || '').trim().toLowerCase();
    const dTracks = ctx.dislikedTracks || {};
    const dArtists = ctx.dislikedArtists || {};
    const dGenres = ctx.dislikedGenres || {};

    if ((id && dTracks[id]) ||
        (title && (dTracks['title_' + encodeURIComponent(title)] || dTracks[title]))) {
      return 'skipReasonDisliked';
    }
    if ((artistId && dArtists[artistId]) ||
        (artist && (dArtists['artist_' + encodeURIComponent(artist)] || dArtists[artist]))) {
      return 'skipReasonHated';
    }
    if (genre && dGenres[genre]) return 'skipReasonGenre';
    if (artistId && ctx.myUserId && artistId === toNumId(ctx.myUserId)) return 'skipReasonOwn';
    // 自分で Likes ページ等を開いて再生している時 / 作者のページから再生している時は、ライク済み・フォロー中では止めない
    const keepKnown = !!(ctx.inLibrary || ctx.onArtistPage);
    if (!keepKnown && id && ctx.likedTrackIds && ctx.likedTrackIds.has(id)) return 'skipReasonLiked';
    if (!ctx.onArtistPage && artistId && ctx.followingUserIds && ctx.followingUserIds.has(artistId)) {
      return 'skipReasonFollowing';
    }
    return null;
  }

  // フレッシュさ判定（R10）。info.stats = { followers, trackCount, playCount, createdAt(ms) }（分からない項目は無し）
  // filter: { followers:{on,n}, trackCount:{on,n}, playCount:{on,n}, ageDays:{on,n} }。分からない値では飛ばさない
  function getFreshSkipReasonKey(stats, filter, now) {
    if (!filter || !stats) return null;
    const num = function (v) { return typeof v === 'number' && isFinite(v) ? v : null; };
    const over = function (rule, value) {
      return !!(rule && rule.on && num(rule.n) !== null && value !== null && value > rule.n);
    };
    if (over(filter.followers, num(stats.followers))) return 'skipReasonManyFollowers';
    if (over(filter.trackCount, num(stats.trackCount))) return 'skipReasonManyTracks';
    if (over(filter.playCount, num(stats.playCount))) return 'skipReasonManyPlays';
    const created = num(stats.createdAt);
    if (filter.ageDays && filter.ageDays.on && num(filter.ageDays.n) !== null && created !== null) {
      const ageDays = ((now || Date.now()) - created) / 86400000;
      if (ageDays > filter.ageDays.n) return 'skipReasonOldTrack';
    }
    return null;
  }

  // 作者のページ（/<作者>、/tracks など）か。予約パスと、reposts は除く
  const RESERVED_TOP = ['you', 'discover', 'stream', 'feed', 'search', 'upload', 'messages', 'notifications', 'charts',
    'settings', 'terms-of-use', 'pages', 'popular', 'tags', 'mobile', 'jobs', 'imprint', 'creator-pro', 'stations', 'people', 'logout'];
  const ARTIST_SUBPAGES = ['', 'tracks', 'popular-tracks', 'albums', 'sets'];
  function isArtistPagePath(pathname) {
    const parts = String(pathname || '').toLowerCase().split('/').filter(Boolean);
    if (parts.length === 0 || RESERVED_TOP.indexOf(parts[0]) !== -1) return false;
    const sub = parts[1] || '';
    return ARTIST_SUBPAGES.indexOf(sub) !== -1;
  }


  // ---- 自分の API 呼び出しの間隔・上限（ロボット確認を出にくくする） ----
  // reserve(now) は「何ミリ秒待ってから送るか」を返し、その送信枠を予約する。
  function createRateLimiter(opts) {
    const minGapMs = (opts && opts.minGapMs) || 250;
    const perMinute = (opts && opts.perMinute) || 60;
    const times = [];
    let last = -Infinity;
    return {
      reserve: function (now) {
        let t = Math.max(now, last + minGapMs);
        for (;;) {
          while (times.length && times[0] <= t - 60000) times.shift();
          if (times.length < perMinute) break;
          t = Math.max(t, times[times.length - perMinute] + 60000);
        }
        times.push(t);
        last = t;
        return t - now;
      }
    };
  }

  // 403 / 429 が来たら 60 秒 → 2 分 → 5 分と待ちを伸ばす。成功したら戻す
  function createBackoff(steps) {
    const list = steps || [60000, 120000, 300000];
    let idx = -1;
    let until = 0;
    return {
      fail: function (now) {
        idx = Math.min(idx + 1, list.length - 1);
        until = now + list[idx];
        return list[idx];
      },
      ok: function () { idx = -1; until = 0; },
      remaining: function (now) { return Math.max(0, until - now); },
      isBlocked: function (now) { return until > now; }
    };
  }

  // 「SoundCloud のロボット確認（DataDome）」の応答か。403 かつ DataDome の印があるものだけ
  function isRobotCheckResponse(status, getHeader, bodyText) {
    if (status !== 403) return false;
    const h = function (n) { try { return (getHeader && getHeader(n)) || ''; } catch (e) { return ''; } };
    if (h('x-datadome') || h('x-datadome-cid') || h('x-dd-b')) return true;
    return /captcha-delivery\.com|datadome/i.test(String(bodyText || ''));
  }

  // 診断ログ（輪の形）。複数タブの記録を時刻順に混ぜて最新 max 件だけ残す
  function mergeLogs(stored, pending, max) {
    const all = (Array.isArray(stored) ? stored : []).concat(pending || []);
    all.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    return all.length > max ? all.slice(all.length - max) : all;
  }

  // 全件同期が必要か（6 時間以内なら不要。force は常に必要）
  function shouldFullSync(lastSyncAt, now, opts) {
    const ttl = (opts && opts.ttlMs) || 6 * 3600 * 1000;
    if (opts && opts.force) return true;
    if (!opts || !opts.hasCache) return true;
    const last = Number(lastSyncAt);
    if (!isFinite(last) || last <= 0) return true;
    return now - last >= ttl || now < last;
  }

  return {
    createRateLimiter: createRateLimiter,
    createBackoff: createBackoff,
    isRobotCheckResponse: isRobotCheckResponse,
    mergeLogs: mergeLogs,
    shouldFullSync: shouldFullSync,
    toNumId: toNumId,
    isValidDislikeKey: isValidDislikeKey,
    getSkipReasonKey: getSkipReasonKey,
    getFreshSkipReasonKey: getFreshSkipReasonKey,
    isArtistPagePath: isArtistPagePath
  };
});
