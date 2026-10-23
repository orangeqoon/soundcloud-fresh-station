// background.js の「後で聴く作者」保存（追加・重複・上限500・削除）を、偽の chrome で確かめる
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadBackground() {
  const store = {};
  let listener = null;
  let installed = null;
  const chrome = {
    cookies: null,
    tabs: { onUpdated: { addListener() {} }, query() {}, sendMessage() { return Promise.resolve(); } },
    runtime: { lastError: null, onMessage: { addListener(fn) { listener = fn; } }, onInstalled: { addListener(fn) { installed = fn; } } },
    storage: {
      local: {
        get(key) { return Promise.resolve(key in store ? { [key]: JSON.parse(JSON.stringify(store[key])) } : {}); },
        set(obj) { Object.assign(store, JSON.parse(JSON.stringify(obj))); return Promise.resolve(); }
      }
    }
  };
  const code = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');
  vm.runInNewContext(code, { chrome, console: { log() {}, warn() {} }, Promise, JSON, Date, String, Array });
  const send = (req) => new Promise((resolve) => { listener(req, {}, resolve); });
  return { store, send, install: (reason) => installed({ reason }) };
}

test('onboarding is scheduled on install, not on an extension update', () => {
  const { store, install } = loadBackground();
  install('update');
  assert.strictEqual(store.onboardingPending, undefined);
  install('install');
  assert.strictEqual(store.onboardingPending, true);
  store.onboardingPending = false;
  install('update');
  assert.strictEqual(store.onboardingPending, false);
});

test('later: add, duplicate, remove', async () => {
  const { store, send } = loadBackground();
  const r1 = await send({ action: 'LATER_ADD', item: { artistId: 5, name: 'A', permalink: 'a', fromTrackTitle: 'T' } });
  assert.strictEqual(r1.ok, true);
  const r2 = await send({ action: 'LATER_ADD', item: { artistId: '5', name: 'A' } });
  assert.strictEqual(r2.exists, true);
  assert.strictEqual(store.laterArtists.length, 1);
  assert.strictEqual(store.laterArtists[0].artistId, '5');
  await send({ action: 'LATER_REMOVE', artistId: 5 });
  assert.strictEqual(store.laterArtists.length, 0);
});

test('later: refuses the 501st and rejects items without an id', async () => {
  const { store, send } = loadBackground();
  store.laterArtists = Array.from({ length: 500 }, (_, i) => ({ artistId: String(i), name: 'x' }));
  const r = await send({ action: 'LATER_ADD', item: { artistId: 'new', name: 'N' } });
  assert.deepStrictEqual([r.ok, r.reason], [false, 'limit']);
  const bad = await send({ action: 'LATER_ADD', item: { name: 'no id' } });
  assert.strictEqual(bad.ok, false);
});

test('later: simultaneous adds are not lost', async () => {
  const { store, send } = loadBackground();
  await Promise.all([1, 2, 3, 4, 5].map((i) => send({ action: 'LATER_ADD', item: { artistId: i, name: 'n' + i } })));
  assert.strictEqual(store.laterArtists.length, 5);
});
