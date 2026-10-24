'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const FreshDigLists = require('../list_backup.js');

function emptyLists() {
    return {
        laterArtists: [],
        dislikedTracks: {},
        dislikedArtists: {},
        dislikedGenres: {}
    };
}

function sampleLists() {
    return {
        laterArtists: [{
            artistId: 42,
            name: 'A <script>artist</script>',
            permalink: 'safe-artist',
            addedAt: 1700000000000,
            fromTrackTitle: 'Title *with* markup'
        }],
        dislikedTracks: {
            '123': { trackId: 123, title: 'No Play', artist: 'Artist', date: '2026/10/24' },
            title_Intro: { title: 'Intro', date: '2026/10/23' }
        },
        dislikedArtists: {
            'artist_A': { artistId: 42, name: 'Artist', date: '2026/10/22', ts: 1700000000000 }
        },
        dislikedGenres: {
            ambient: { genre: 'ambient', date: '2026/10/21' }
        }
    };
}

function envelopeFor(lists) {
    return FreshDigLists.create(lists);
}

test('create and normalize preserve all four lists, records, IDs, dates, and schema', () => {
    const lists = sampleLists();
    const envelope = envelopeFor(lists);
    const roundTrip = FreshDigLists.normalize(JSON.parse(JSON.stringify(envelope)));

    assert.equal(envelope.format, 'FreshDigLists');
    assert.equal(envelope.schema, 1);
    assert.equal(typeof envelope.exportedAt, 'string');
    assert.deepEqual(roundTrip, envelope);
    assert.deepEqual(roundTrip.lists.dislikedTracks.title_Intro, lists.dislikedTracks.title_Intro);
    assert.equal(roundTrip.lists.laterArtists[0].addedAt, 1700000000000);
});

test('merge is additive, idempotent, and keeps existing records on duplicate IDs', () => {
    const current = sampleLists();
    const incoming = {
        laterArtists: [
            { artistId: '42', name: 'incoming replacement' },
            { artistId: 99, name: 'new artist' }
        ],
        dislikedTracks: {
            '123': { title: 'incoming replacement' },
            '456': { title: 'new track' }
        },
        dislikedArtists: { artist_A: { name: 'incoming replacement' }, artist_B: { name: 'new artist' } },
        dislikedGenres: { ambient: { genre: 'incoming replacement' }, house: true }
    };
    const before = JSON.parse(JSON.stringify(current));
    const merged = FreshDigLists.merge(current, incoming);

    assert.equal(merged.laterArtists.length, 2);
    assert.equal(merged.laterArtists[0].name, current.laterArtists[0].name);
    assert.equal(merged.dislikedTracks['123'].title, 'No Play');
    assert.equal(merged.dislikedArtists.artist_A.name, 'Artist');
    assert.equal(merged.dislikedGenres.ambient.genre, 'ambient');
    assert.deepEqual(FreshDigLists.merge(merged, incoming), merged);
    assert.deepEqual(current, before);
    assert.notStrictEqual(merged.laterArtists, current.laterArtists);
});

test('counts reports finite counts for every list', () => {
    assert.deepEqual(FreshDigLists.counts(sampleLists()), {
        laterArtists: 1,
        dislikedTracks: 2,
        dislikedArtists: 1,
        dislikedGenres: 1
    });
});

test('compact JSON stays under the 5 MiB limit when pretty JSON would not', () => {
    const lists = emptyLists();
    const title = 'x'.repeat(4096);
    for (let index = 0; index < 1270; index += 1) {
        lists.dislikedTracks['title_' + index] = { title: title };
    }

    const envelope = envelopeFor(lists);
    const compact = JSON.stringify(envelope);
    const pretty = JSON.stringify(envelope, null, 2);

    assert.ok(Buffer.byteLength(compact, 'utf8') <= FreshDigLists.MAX_JSON_BYTES);
    assert.ok(Buffer.byteLength(pretty, 'utf8') > FreshDigLists.MAX_JSON_BYTES);
    const roundTrip = FreshDigLists.normalize(JSON.parse(compact));
    assert.equal(FreshDigLists.counts(roundTrip.lists).dislikedTracks, 1270);
    assert.equal(roundTrip.lists.dislikedTracks.title_1269.title.length, 4096);
});

test('later artist limits reject overflow without truncation', () => {
    const tooMany = emptyLists();
    tooMany.laterArtists = Array.from({ length: 501 }, (_, index) => ({ artistId: index + 1, name: 'artist' }));
    assert.throws(() => FreshDigLists.create(tooMany), /500/);

    const current = emptyLists();
    current.laterArtists = Array.from({ length: 500 }, (_, index) => ({ artistId: index + 1 }));
    const incoming = emptyLists();
    incoming.laterArtists = [{ artistId: 501 }];
    assert.throws(() => FreshDigLists.merge(current, incoming), /500/);
    assert.equal(current.laterArtists.length, 500);
});

test('malformed, version-mismatched, and accidental client JSON are rejected', () => {
    const valid = envelopeFor(emptyLists());
    assert.throws(() => FreshDigLists.normalize({ ...valid, schema: 2 }), /schema/);
    assert.throws(() => FreshDigLists.normalize({ ...valid, format: 'ClientSecretExport' }), /format/);
    assert.throws(() => FreshDigLists.normalize({ ...valid, clientSecret: 'secret' }), /unrecognized/);
    assert.throws(() => FreshDigLists.normalize({ ...valid, exportedAt: 'not a date' }), /exportedAt/);
    assert.throws(() => FreshDigLists.normalize({ format: 'FreshDigLists', schema: 1, exportedAt: valid.exportedAt }), /lists/);
});

test('legacy title, artist, and genre keys remain opaque and preserve Token/Secret/Unknown names', () => {
    const lists = emptyLists();
    lists.dislikedTracks = {
        'title_Token%20Song': { title: 'Token Song', date: '2026-10-24' },
        '12345': { title: 'Unknown', date: '2026-10-24' }
    };
    lists.dislikedArtists = {
        artist_Secret: { name: 'Secret', date: '2026-10-24' },
        '67890': { name: 'Unknown', date: '2026-10-24' }
    };
    lists.dislikedGenres = {
        'genre_Unknown': { genre: 'Unknown', date: '2026-10-24' },
        Secret: { genre: 'Secret', date: '2026-10-24' }
    };

    const roundTrip = FreshDigLists.normalize(envelopeFor(lists));
    assert.deepEqual(roundTrip.lists.dislikedTracks, lists.dislikedTracks);
    assert.deepEqual(roundTrip.lists.dislikedArtists, lists.dislikedArtists);
    assert.deepEqual(roundTrip.lists.dislikedGenres, lists.dislikedGenres);
});

test('reserved unresolved keys are rejected before import', () => {
    const valid = envelopeFor(emptyLists());
    ['undefined', 'null', 'unknown', 'title_unknown', 'artist_unknown'].forEach((key) => {
        const backup = JSON.parse(JSON.stringify(valid));
        backup.lists.dislikedTracks[key] = { title: 'unresolved' };
        assert.throws(() => FreshDigLists.normalize(backup), /valid list key/);
    });
});

test('prototype pollution keys are rejected at the map and record levels', () => {
    const valid = envelopeFor(emptyLists());
    const mapPollution = JSON.parse(JSON.stringify(valid));
    mapPollution.lists.dislikedTracks['__proto__'] = { title: 'bad' };
    assert.throws(() => FreshDigLists.normalize(mapPollution), /unsafe|valid list key|must be an object/);

    const recordPollution = JSON.parse(JSON.stringify(valid));
    recordPollution.lists.dislikedTracks.good = { constructor: { polluted: true } };
    assert.throws(() => FreshDigLists.normalize(recordPollution), /unsafe/);
});

test('Markdown escapes unsafe text and only emits safe SoundCloud links', () => {
    const lists = sampleLists();
    lists.laterArtists.push({ artistId: 43, name: '[unsafe](javascript:alert(1))', permalink: 'javascript:alert(1)' });
    const markdown = FreshDigLists.toMarkdown(envelopeFor(lists));

    assert.match(markdown, /FreshDig lists backup/);
    assert.match(markdown, /https:\/\/soundcloud\.com\/safe-artist/);
    assert.doesNotMatch(markdown, /<script>/i);
    assert.doesNotMatch(markdown, /javascript:/i);
});

test('create and merge do not mutate caller data', () => {
    const current = sampleLists();
    const incoming = sampleLists();
    const currentBefore = JSON.stringify(current);
    const incomingBefore = JSON.stringify(incoming);
    FreshDigLists.create(current);
    FreshDigLists.merge(current, incoming);
    assert.equal(JSON.stringify(current), currentBefore);
    assert.equal(JSON.stringify(incoming), incomingBefore);
});
