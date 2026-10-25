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

  function hasOwn(obj, key) {
    if (!obj || key === undefined || key === null || key === '') return false;
    return Object.hasOwn ? Object.hasOwn(obj, key) : Object.prototype.hasOwnProperty.call(obj, key);
  }

  const DIG_SKIP_RULE_DEFAULTS = Object.freeze({
    followingArtists: true,
    hatedArtists: true,
    laterArtists: true,
    likedTracks: true,
    noplayTracks: true
  });

  function normalizeDigSkipRules(raw) {
    const value = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    Object.keys(DIG_SKIP_RULE_DEFAULTS).forEach(function (key) {
      out[key] = value[key] === undefined ? DIG_SKIP_RULE_DEFAULTS[key] : value[key] === true;
    });
    return out;
  }

  // 曲の除外判定の詳細。当たった理由とキーを返す。
  function getSkipReasonDetails(info, ctx) {
    if (!ctx || !ctx.discoveryEnabled || ctx.playbackMode !== 'DISCOVERY' || !info) return null;
    const id = toNumId(info.id);
    const artistId = toNumId(info.artistId);
    // 後で聴く作者のページでは、その作者を意図的に聴いているので Dig の除外を解除する
    if (ctx.onArtistPage && artistId && hasOwn(ctx.laterArtists, artistId)) return null;

    const title = (info.title || '').trim();
    const artist = (info.artistName || '').trim();
    const genre = (info.genre || '').trim().toLowerCase();
    const dTracks = ctx.dislikedTracks || {};
    const dArtists = ctx.dislikedArtists || {};
    const dGenres = ctx.dislikedGenres || {};
    const rules = normalizeDigSkipRules(ctx.digSkipRules);

    // 1. 曲自体の除外判定
    if (rules.noplayTracks && id && hasOwn(dTracks, id)) {
      return { reason: 'skipReasonDisliked', key: String(id) };
    }
    if (rules.noplayTracks && title) {
      const tKey = 'title_' + encodeURIComponent(title);
      const hitKey = hasOwn(dTracks, tKey) ? tKey : (hasOwn(dTracks, title) ? title : null);
      if (hitKey) {
        const rec = dTracks[hitKey];
        const recId = toNumId(rec && typeof rec === 'object' ? (rec.trackId || rec.id) : null);
        // 記録側にIDがない（古い記録など）場合、またはIDが一致する場合のみ除外
        if (!recId || !id || recId === id) {
          return { reason: 'skipReasonDisliked', key: hitKey };
        }
      }
    }

    // 2. 作者の除外判定
    if (rules.hatedArtists && artistId && hasOwn(dArtists, artistId)) {
      return { reason: 'skipReasonHated', key: String(artistId) };
    }
    if (rules.hatedArtists && artist) {
      const aKey = 'artist_' + encodeURIComponent(artist);
      const hitKey = hasOwn(dArtists, aKey) ? aKey : (hasOwn(dArtists, artist) ? artist : null);
      if (hitKey) {
        const rec = dArtists[hitKey];
        const recId = toNumId(rec && typeof rec === 'object' ? (rec.artistId || rec.id) : null);
        // 記録側にIDがない（古い記録など）場合、またはIDが一致する場合のみ除外（IDが異なれば同姓同名の別人として除外しない）
        if (!recId || !artistId || recId === artistId) {
          return { reason: 'skipReasonHated', key: hitKey };
        }
      }
    }

    // 3. ジャンルの除外判定
    if (genre && hasOwn(dGenres, genre)) {
      return { reason: 'skipReasonGenre', key: genre };
    }

    // 4. 自分の曲
    if (artistId && ctx.myUserId && artistId === toNumId(ctx.myUserId)) {
      return { reason: 'skipReasonOwn', key: String(artistId) };
    }

    // 後で聴く作者は Dig 中には流さない。実際に聴くときは Dig を OFF にする。
    if (rules.laterArtists && artistId && hasOwn(ctx.laterArtists, artistId)) {
      return { reason: 'skipReasonLater', key: String(artistId) };
    }

    // 5. 自分で Likes ページ等を開いて再生している時 / 作者のページから再生している時は除外しない
    const keepKnown = !!(ctx.inLibrary || ctx.onArtistPage);
    if (!keepKnown && ctx.heardSkipEnabled && id && ctx.heardTrackIds && ctx.heardTrackIds.has(id)) {
      return { reason: 'skipReasonHeard', key: String(id) };
    }
    if (rules.likedTracks && !keepKnown && id && ctx.likedTrackIds && ctx.likedTrackIds.has(id)) {
      return { reason: 'skipReasonLiked', key: String(id) };
    }
    if (rules.followingArtists && !ctx.onArtistPage && artistId && ctx.followingUserIds && ctx.followingUserIds.has(artistId)) {
      return { reason: 'skipReasonFollowing', key: String(artistId) };
    }

    return null;
  }

  // 曲の除外判定。理由は言語に依存しないキーで返す（表示時に i18n で訳す）。
  function getSkipReasonKey(info, ctx) {
    const details = getSkipReasonDetails(info, ctx);
    return details ? details.reason : null;
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

  // 設定（R10）の形を整える。壊れた値・足りない値は既定に戻す。既定はすべて OFF
  const FRESH_DEFAULTS = {
    followers: { on: false, n: 1000 },
    trackCount: { on: false, n: 100 },
    playCount: { on: false, n: 10000 },
    ageDays: { on: false, n: 30 }
  };
  function normalizeFreshFilter(raw) {
    const out = {};
    Object.keys(FRESH_DEFAULTS).forEach(function (k) {
      const r = raw && typeof raw === 'object' ? raw[k] : null;
      const n = r ? Number(r.n) : NaN;
      out[k] = {
        on: !!(r && r.on),
        n: (isFinite(n) && n >= 0 && n <= 1e9) ? Math.floor(n) : FRESH_DEFAULTS[k].n
      };
    });
    return out;
  }

  // 作者ごとの統計の保存（期限つき・件数上限つき）。map: { id: { f, t, at } }。期限切れを消し、多ければ古い順に消す
  function pruneAuthorStats(map, now, ttlMs, max) {
    const entries = Object.keys(map || {}).filter(function (k) {
      const e = map[k];
      return e && typeof e.at === 'number' && now - e.at < ttlMs && now >= e.at - 60000;
    });
    entries.sort(function (a, b) { return map[b].at - map[a].at; });
    const out = {};
    entries.slice(0, max).forEach(function (k) { out[k] = map[k]; });
    return out;
  }

  // 再生待ち行列の先読み。infos: 行列の順に並べた曲情報（分からないものは null）、curPos: 今の曲の位置。
  // remove: 先に外してよい位置、firstKeep: 次に流してよい最初の位置（無ければ -1）
  function planQueueAhead(infos, curPos, reasonFn, maxLook) {
    const remove = [];
    let firstKeep = -1;
    const last = Math.min(infos.length - 1, curPos + (maxLook || 30));
    for (let i = curPos + 1; i <= last; i++) {
      const info = infos[i];
      if (!info) { if (firstKeep < 0) firstKeep = i; continue; }
      if (reasonFn(info)) remove.push(i);
      else if (firstKeep < 0) firstKeep = i;
    }
    return { remove: remove, firstKeep: firstKeep };
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
    planQueueAhead: planQueueAhead,
    createRateLimiter: createRateLimiter,
    createBackoff: createBackoff,
    isRobotCheckResponse: isRobotCheckResponse,
    mergeLogs: mergeLogs,
    shouldFullSync: shouldFullSync,
    toNumId: toNumId,
    isValidDislikeKey: isValidDislikeKey,
    getSkipReasonKey: getSkipReasonKey,
    getSkipReasonDetails: getSkipReasonDetails,
    normalizeDigSkipRules: normalizeDigSkipRules,
    getFreshSkipReasonKey: getFreshSkipReasonKey,
    normalizeFreshFilter: normalizeFreshFilter,
    pruneAuthorStats: pruneAuthorStats,
    isArtistPagePath: isArtistPagePath
  };
});
