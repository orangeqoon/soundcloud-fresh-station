'use strict';
const test = require('node:test');
const assert = require('node:assert');
const core = require('../freshdig_core.js');
const i18n = require('../i18n.js');

const base = () => ({
  discoveryEnabled: true, playbackMode: 'DISCOVERY',
  dislikedTracks: {}, dislikedArtists: {}, dislikedGenres: {},
  myUserId: 1, likedTrackIds: new Set(), followingUserIds: new Set(),
  inLibrary: false, onArtistPage: false
});

test('off / non-discovery / no info -> null', () => {
  assert.strictEqual(core.getSkipReasonKey({ id: 5 }, { ...base(), discoveryEnabled: false }), null);
  assert.strictEqual(core.getSkipReasonKey({ id: 5 }, { ...base(), playbackMode: 'X' }), null);
  assert.strictEqual(core.getSkipReasonKey(null, base()), null);
});

test('dislike track by id and by title', () => {
  const c = base(); c.dislikedTracks[5] = true; c.dislikedTracks['title_' + encodeURIComponent('曲A')] = true;
  assert.strictEqual(core.getSkipReasonKey({ id: 5 }, c), 'skipReasonDisliked');
  assert.strictEqual(core.getSkipReasonKey({ id: 6, title: '曲A' }, c), 'skipReasonDisliked');
  assert.strictEqual(core.getSkipReasonKey({ id: 6, title: '曲B' }, c), null);
});

test('hated artist, genre, own track', () => {
  const c = base(); c.dislikedArtists[9] = true; c.dislikedGenres['pop'] = true;
  assert.strictEqual(core.getSkipReasonKey({ id: 1, artistId: 9 }, c), 'skipReasonHated');
  assert.strictEqual(core.getSkipReasonKey({ id: 1, artistId: 2, genre: ' Pop ' }, c), 'skipReasonGenre');
  assert.strictEqual(core.getSkipReasonKey({ id: 1, artistId: 1 }, c), 'skipReasonOwn');
});

test('liked / following; library and artist page keep known tracks', () => {
  const c = base(); c.likedTrackIds.add(7); c.followingUserIds.add(8);
  assert.strictEqual(core.getSkipReasonKey({ id: 7, artistId: 2 }, c), 'skipReasonLiked');
  assert.strictEqual(core.getSkipReasonKey({ id: 3, artistId: 8 }, c), 'skipReasonFollowing');
  assert.strictEqual(core.getSkipReasonKey({ id: 7, artistId: 2 }, { ...c, inLibrary: true }), null);
  assert.strictEqual(core.getSkipReasonKey({ id: 7, artistId: 8 }, { ...c, onArtistPage: true }), null);
  // 作者ページでも Dislike と Hate は効く
  c.dislikedArtists[8] = true;
  assert.strictEqual(core.getSkipReasonKey({ id: 3, artistId: 8 }, { ...c, onArtistPage: true }), 'skipReasonHated');
});

test('undefined / empty ids never match', () => {
  const c = base(); c.dislikedTracks['undefined'] = true; c.dislikedArtists[''] = true;
  assert.strictEqual(core.getSkipReasonKey({ id: undefined, artistId: null, title: '', artistName: '' }, c), null);
  assert.ok(!core.isValidDislikeKey(undefined) && !core.isValidDislikeKey('') && !core.isValidDislikeKey('title_'));
  assert.ok(core.isValidDislikeKey(123) && core.isValidDislikeKey('title_abc'));
});

test('fresh filter', () => {
  const f = { followers: { on: true, n: 1000 }, trackCount: { on: true, n: 100 }, playCount: { on: false, n: 5 }, ageDays: { on: true, n: 30 } };
  assert.strictEqual(core.getFreshSkipReasonKey({ followers: 1001 }, f), 'skipReasonManyFollowers');
  assert.strictEqual(core.getFreshSkipReasonKey({ followers: 1000, trackCount: 101 }, f), 'skipReasonManyTracks');
  assert.strictEqual(core.getFreshSkipReasonKey({ playCount: 999999 }, f), null); // off
  assert.strictEqual(core.getFreshSkipReasonKey({}, f), null); // unknown -> no skip
  const now = Date.parse('2026-10-09');
  assert.strictEqual(core.getFreshSkipReasonKey({ createdAt: now - 40 * 86400000 }, f, now), 'skipReasonOldTrack');
  assert.strictEqual(core.getFreshSkipReasonKey({ createdAt: now - 10 * 86400000 }, f, now), null);
  assert.strictEqual(core.getFreshSkipReasonKey({ followers: 5000 }, null), null);
});

test('artist page path', () => {
  assert.ok(core.isArtistPagePath('/some-artist'));
  assert.ok(core.isArtistPagePath('/some-artist/tracks'));
  assert.ok(core.isArtistPagePath('/some-artist/sets/mix'));
  assert.ok(!core.isArtistPagePath('/some-artist/reposts'));
  assert.ok(!core.isArtistPagePath('/some-artist/some-track-slug'));
  assert.ok(!core.isArtistPagePath('/you/likes'));
  assert.ok(!core.isArtistPagePath('/'));
});

test('i18n: ja and en have the same keys, and skip reasons exist', () => {
  const ja = Object.keys(i18n.translations.ja).sort();
  const en = Object.keys(i18n.translations.en).sort();
  assert.deepStrictEqual(ja, en);
  for (const k of ['skipReasonDisliked', 'skipReasonHated', 'skipReasonGenre', 'skipReasonOwn', 'skipReasonLiked', 'skipReasonFollowing']) {
    assert.ok(ja.includes(k), k);
  }
});

test('i18n: keys used in code exist in the dictionary', () => {
  const fs = require('fs');
  const dict = i18n.translations.ja;
  for (const f of ['station_hook.js', 'popup.js']) {
    const src = fs.readFileSync(require('path').join(__dirname, '..', f), 'utf8');
    const used = new Set();
    if (f === 'popup.js') for (const m of src.matchAll(/\bt\.([A-Za-z][A-Za-z0-9]*)\b/g)) used.add(m[1]);
    // station_hook.js: t. は別の変数と区別できないため、const tx = getI18nTexts() を持つ関数の中だけ見る
    if (f === 'station_hook.js') {
      for (const body of src.split(/\n    function /)) {
        if (/const tx = getI18nTexts\(\)/.test(body)) for (const m of body.matchAll(/\btx.([A-Za-z][A-Za-z0-9]*)\b/g)) used.add(m[1]);
      }
    }
    for (const m of src.matchAll(/getI18nTexts\(\)\.([A-Za-z][A-Za-z0-9]*)/g)) used.add(m[1]);
    for (const m of src.matchAll(/tt\('([A-Za-z][A-Za-z0-9_]*)'/g)) used.add(m[1]);
    for (const k of used) assert.ok(k in dict, f + ' uses missing key: ' + k);
  }
});

test('i18n: {placeholders} match between ja and en', () => {
  const ph = (v) => (String(v).match(/\{\w+\}/g) || []).sort().join(',');
  for (const k of Object.keys(i18n.translations.ja)) {
    assert.strictEqual(ph(i18n.translations.en[k]), ph(i18n.translations.ja[k]), 'placeholders differ: ' + k);
  }
});

test('rate limiter: min gap and per-minute cap', () => {
  const rl = core.createRateLimiter({ minGapMs: 250, perMinute: 3 });
  assert.strictEqual(rl.reserve(1000), 0);
  assert.strictEqual(rl.reserve(1000), 250);
  assert.strictEqual(rl.reserve(1100), 400); // 1500
  // 4 本目は 1 本目から 60 秒後以降
  assert.strictEqual(rl.reserve(1200), 61000 - 1200);
});

test('backoff: 60s -> 2min -> 5min, reset on ok', () => {
  const b = core.createBackoff();
  assert.strictEqual(b.fail(0), 60000);
  assert.ok(b.isBlocked(59999) && !b.isBlocked(60000));
  assert.strictEqual(b.fail(60000), 120000);
  assert.strictEqual(b.fail(0), 300000);
  assert.strictEqual(b.fail(0), 300000);
  b.ok();
  assert.ok(!b.isBlocked(1));
  assert.strictEqual(b.fail(0), 60000);
});

test('robot check detection', () => {
  assert.ok(core.isRobotCheckResponse(403, (n) => n === 'x-datadome' ? 'protected' : '', ''));
  assert.ok(core.isRobotCheckResponse(403, () => '', '{"url":"https://geo.captcha-delivery.com/captcha/?x"}'));
  assert.ok(!core.isRobotCheckResponse(403, () => '', '{"error":"forbidden"}'));
  assert.ok(!core.isRobotCheckResponse(200, () => 'protected', 'captcha-delivery'));
});

test('mergeLogs keeps newest max in time order', () => {
  const m = core.mergeLogs([{ t: 1 }, { t: 5 }], [{ t: 3 }, { t: 7 }], 3);
  assert.deepStrictEqual(m.map((x) => x.t), [3, 5, 7]);
  assert.deepStrictEqual(core.mergeLogs(null, null, 3), []);
});

test('shouldFullSync: 6h, force, no cache', () => {
  const now = 10 * 3600 * 1000;
  assert.ok(!core.shouldFullSync(now - 3600 * 1000, now, { hasCache: true }));
  assert.ok(core.shouldFullSync(now - 7 * 3600 * 1000, now, { hasCache: true }));
  assert.ok(core.shouldFullSync(now - 1000, now, { hasCache: true, force: true }));
  assert.ok(core.shouldFullSync(now - 1000, now, { hasCache: false }));
  assert.ok(core.shouldFullSync(null, now, { hasCache: true }));
  assert.ok(core.shouldFullSync(now + 5000, now, { hasCache: true })); // 時計が戻った
});

test('planQueueAhead: removes known tracks ahead and finds the first one to play', () => {
  const known = new Set([2, 3, 4, 6]);
  const infos = [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id }));
  const reasonFn = (i) => (known.has(i.id) ? 'x' : null);
  // 今の曲は位置 1（id 2）
  const plan = core.planQueueAhead(infos, 1, reasonFn, 30);
  assert.deepStrictEqual(plan.remove, [2, 3, 5]);
  assert.strictEqual(plan.firstKeep, 4);
  // 先読みの上限
  assert.deepStrictEqual(core.planQueueAhead(infos, 1, reasonFn, 2).remove, [2, 3]);
  // 全部既知
  assert.strictEqual(core.planQueueAhead([{ id: 2 }, { id: 3 }], 0, reasonFn, 30).firstKeep, -1);
  // 情報が無い曲は外さず、流してよい扱い
  const p2 = core.planQueueAhead([{ id: 2 }, null, { id: 3 }], 0, reasonFn, 30);
  assert.strictEqual(p2.firstKeep, 1);
  assert.deepStrictEqual(p2.remove, [2]);
});
