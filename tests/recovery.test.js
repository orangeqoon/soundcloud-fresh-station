'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Recovery = require('../recovery_window.js');
const RecoveryUI = require('../recovery.js');

function makeChrome(options) {
    options = options || {};
    let listener = null;
    let created = [];
    const windows = {
        getAll(opts, callback) {
            if (options.getAll) return options.getAll(opts, callback);
            callback(options.windows || []);
        },
        create(opts, callback) {
            created.push(opts);
            if (options.create) return options.create(opts, callback);
            callback({ id: 100 + created.length, tabs: [{ url: opts.url }] });
        }
    };
    const forwarded = [];
    const tabs = {
        get(tabId, callback) {
            if (options.getTab) return options.getTab(tabId, callback);
            callback({ id: tabId, url: options.tabUrl || 'https://soundcloud.com/discover' });
        },
        sendMessage(tabId, message, callback) {
            forwarded.push({ tabId, message });
            if (options.sendMessage) return options.sendMessage(tabId, message, callback);
            callback(options.reply || { success: true, data: { title: 'Track' } });
        }
    };
    const chrome = {
        windows,
        tabs,
        runtime: {
            id: 'recovery-test',
            lastError: null,
            getURL(file) { return 'chrome-extension://recovery-test/' + file; },
            onMessage: { addListener(fn) { listener = fn; } }
        }
    };
    const installed = Recovery.install(chrome);
    return {
        chrome,
        installed,
        created,
        forwarded,
        invoke(request, sender) {
            return new Promise((resolve) => {
                const returned = listener(request, sender, resolve);
                if (returned === false && request.action !== 'UNKNOWN') {
                    // Synchronous validation responses are delivered before the
                    // Promise constructor returns; this branch is only a guard
                    // for malformed test shims.
                }
            });
        }
    };
}

test('SoundCloud URL validation requires HTTPS and a real SoundCloud host', () => {
    assert.equal(Recovery.isSoundCloudUrl('https://soundcloud.com/discover'), true);
    assert.equal(Recovery.isSoundCloudUrl('https://i1.sndcdn.com/track.jpg'), false);
    assert.equal(Recovery.isSoundCloudUrl('https://evil-soundcloud.com/'), false);
    assert.equal(Recovery.isSoundCloudUrl('http://soundcloud.com/'), false);
    assert.equal(Recovery.isSoundCloudUrl('https://soundcloud.com.evil.test/'), false);
});

test('ARM_RECOVERY_PLAYER creates one unfocused extension popup', async () => {
    const harness = makeChrome();
    const response = await harness.invoke({ action: 'ARM_RECOVERY_PLAYER' }, {
        tab: { id: 12, url: 'https://soundcloud.com/discover' }
    });
    assert.deepEqual(response, { ok: true });
    assert.equal(harness.created.length, 1);
    assert.deepEqual(harness.created[0], {
        url: 'chrome-extension://recovery-test/recovery.html?tabId=12',
        type: 'popup', width: 430, height: 310, focused: false
    });
});

test('ARM_RECOVERY_PLAYER deduplicates a popup found after a service-worker restart', async () => {
    let windows = [{ id: 55, tabs: [{ url: 'chrome-extension://recovery-test/recovery.html?tabId=12' }] }];
    const harness = makeChrome({ windows });
    const first = await harness.invoke({ action: 'ARM_RECOVERY_PLAYER' }, {
        tab: { id: 12, url: 'https://soundcloud.com/you' }
    });
    assert.deepEqual(first, { ok: true });
    assert.equal(harness.created.length, 0);

    // The manager must not rely only on an in-memory window id. A fresh
    // installation still finds the same extension URL through getAll().
    windows = [{ id: 55, tabs: [{ url: 'chrome-extension://recovery-test/recovery.html?tabId=12' }] }];
    const second = await harness.invoke({ action: 'ARM_RECOVERY_PLAYER' }, {
        tab: { id: 12, url: 'https://soundcloud.com/you' }
    });
    assert.deepEqual(second, { ok: true });
    assert.equal(harness.created.length, 0);
});

test('ARM_RECOVERY_PLAYER rejects non-SoundCloud or tab-less senders', async () => {
    const harness = makeChrome();
    assert.deepEqual(await harness.invoke({ action: 'ARM_RECOVERY_PLAYER' }, {}), { ok: false, reason: 'forbidden' });
    assert.deepEqual(await harness.invoke({ action: 'ARM_RECOVERY_PLAYER' }, {
        tab: { id: 3, url: 'http://soundcloud.com/discover' }
    }), { ok: false, reason: 'forbidden' });
    assert.deepEqual(await harness.invoke({ action: 'ARM_RECOVERY_PLAYER' }, {
        tab: { id: 3, url: 'https://soundcloud.com.evil.test/discover' }
    }), { ok: false, reason: 'forbidden' });
    assert.equal(harness.created.length, 0);
});

test('recovery page requests validate sender, target tab, and proxy fixed actions', async () => {
    const harness = makeChrome({ reply: { success: true, data: { title: 'Safe title' }, language: 'en', discoveryEnabled: true } });
    const sender = { url: 'chrome-extension://recovery-test/recovery.html?tabId=12' };
    const snapshot = await harness.invoke({ action: 'GET_RECOVERY_SNAPSHOT', tabId: 12 }, sender);
    assert.equal(snapshot.success, true);
    assert.deepEqual(harness.forwarded[0], {
        tabId: 12,
        message: { target: 'SC_FRESH_STATION', action: 'RECOVERY_SNAPSHOT' }
    });

    const result = await harness.invoke({ action: 'RUN_RECOVERY_ACTION', tabId: 12, name: 'vol', args: { v: 0.4 } }, sender);
    assert.equal(result.success, true);
    assert.deepEqual(harness.forwarded[1], {
        tabId: 12,
        message: { target: 'SC_FRESH_STATION', action: 'RECOVERY_ACTION', name: 'vol', args: { v: 0.4 } }
    });
});

test('recovery proxy rejects extension impostors, non-SoundCloud targets, and injected fields', async () => {
    const impostor = makeChrome();
    assert.deepEqual(await impostor.invoke({ action: 'GET_RECOVERY_SNAPSHOT', tabId: 12 }, {
        url: 'chrome-extension://other/recovery.html?tabId=12'
    }), { ok: false, reason: 'forbidden' });

    const nonSoundCloud = makeChrome({ tabUrl: 'https://example.test/page' });
    const sender = { url: 'chrome-extension://recovery-test/recovery.html?tabId=12' };
    assert.deepEqual(await nonSoundCloud.invoke({ action: 'RUN_RECOVERY_ACTION', tabId: 12, name: 'play', args: {} }, sender), {
        ok: false, reason: 'not-soundcloud'
    });
    assert.deepEqual(await impostor.invoke({ action: 'RUN_RECOVERY_ACTION', tabId: 12, name: 'play', args: { token: 'secret' } }, sender), {
        ok: false, reason: 'invalid-args'
    });
    assert.equal(impostor.forwarded.length, 0);
});

test('only allow-listed action arguments cross the recovery boundary', async () => {
    const harness = makeChrome();
    const sender = { url: 'chrome-extension://recovery-test/recovery.html?tabId=12' };
    const allowed = [
        ['play', {}], ['prev', {}], ['next', {}], ['mute', {}], ['like', {}], ['follow', {}],
        ['station', {}], ['addPl', {}], ['dislike', {}], ['hate', {}], ['later', {}],
        ['openLater', {}], ['dig', {}], ['dig', { enabled: false }], ['vol', { v: 0.75 }],
        ['seek', { ratio: 0.25 }], ['repost', { unrepost: true }]
    ];
    for (const [name, args] of allowed) {
        const result = await harness.invoke({ action: 'RUN_RECOVERY_ACTION', tabId: 12, name, args }, sender);
        assert.equal(result.success, true, name);
    }
    const forwardedNames = harness.forwarded.map((entry) => entry.message.name);
    assert.deepEqual(forwardedNames, allowed.map(([name]) => name));
    assert.deepEqual(await harness.invoke({ action: 'RUN_RECOVERY_ACTION', tabId: 12, name: 'deleteEverything', args: {} }, sender), {
        ok: false, reason: 'invalid-action'
    });
    assert.deepEqual(await harness.invoke({ action: 'RUN_RECOVERY_ACTION', tabId: 12, name: 'vol', args: { v: 2 } }, sender), {
        ok: false, reason: 'invalid-args'
    });
});

test('recovery UI renders snapshot text without HTML interpolation', () => {
    const nodes = new Map();
    function node() {
        return {
            textContent: '', style: { setProperty() {} }, classList: { toggle() {} },
            setAttribute(name, value) { this[name] = String(value); },
            removeAttribute() {}, addEventListener() {}, disabled: false, value: '', src: ''
        };
    }
    const ids = ['recovery-heading', 'recovery-status', 'recovery-fallback', 'recovery-station', 'recovery-later', 'recovery-later-list', 'recovery-hate', 'recovery-prev', 'recovery-play', 'recovery-dislike', 'recovery-like', 'recovery-repost', 'recovery-add-pl', 'recovery-follow', 'recovery-dig', 'recovery-seek', 'recovery-volume', 'recovery-volume-value', 'recovery-mute', 'recovery-title', 'recovery-artist', 'recovery-art', 'recovery-passed', 'recovery-duration'];
    ids.forEach((id) => nodes.set(id, node()));
    const document = {
        readyState: 'complete', documentElement: {}, body: { classList: { toggle() {} } },
        getElementById(id) { return nodes.get(id) || null; },
        querySelectorAll() { return []; }
    };
    const window = { location: { search: '?tabId=12', href: 'chrome-extension://recovery-test/recovery.html?tabId=12' }, navigator: { language: 'en' } };
    const ui = RecoveryUI.create({ window, document, i18n: require('../i18n.js'), setTimeout() { return 1; }, clearTimeout() {} });
    ui.state.tabId = 12;
    assert.equal(ui.renderSnapshot({
        success: true,
        language: 'en',
        discoveryEnabled: true,
        data: { title: '<img src=x>', artist: 'A & B', art: 'javascript:alert(1)', playing: true, ratio: .5, vol: .25, passed: '0:02', duration: '0:30', liked: true, reposted: false, following: true, hated: false, later: false }
    }), true);
    assert.equal(nodes.get('recovery-title').textContent, '<img src=x>');
    assert.equal(nodes.get('recovery-artist').textContent, 'A & B');
    assert.equal(nodes.get('recovery-art').style.display, 'none');
    assert.equal(nodes.get('recovery-seek').value, '50');
    assert.equal(nodes.get('recovery-volume-value').textContent, '25%');
});
