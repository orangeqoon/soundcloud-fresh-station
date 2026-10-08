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
    for (const k of used) assert.ok(k in dict, f + ' uses missing key: ' + k);
  }
});
