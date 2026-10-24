// background.js の「後で聴く作者」保存（追加・重複・上限500・削除）を、偽の chrome で確かめる
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const FreshDigLists = require('../list_backup.js');
const FreshDigLater = require('../later.js');

function loadBackground() {
  const store = {};
  let listener = null;
  let installed = null;
  let removedListener = null;
  let activeWindow = null;
  let nextWindowId = 21;
  let createCount = 0;
  let focusCount = 0;
  const windows = {
    onRemoved: { addListener(fn) { removedListener = fn; } },
    get(id, cb) { cb(activeWindow && activeWindow.id === id ? activeWindow : undefined); },
    getAll(opts, cb) { cb(activeWindow ? [activeWindow] : []); },
    create(opts, cb) {
      createCount += 1;
      activeWindow = { id: nextWindowId++, tabs: [{ url: opts.url }] };
      cb(activeWindow);
    },
    update(id, opts, cb) {
      focusCount += 1;
      cb(activeWindow && activeWindow.id === id ? activeWindow : undefined);
    }
  };
  const chrome = {
    cookies: null,
    tabs: { onUpdated: { addListener() {} }, query() {}, sendMessage() { return Promise.resolve(); } },
    windows,
    runtime: { lastError: null, getURL(file) { return 'chrome-extension://test/' + file; }, onMessage: { addListener(fn) { listener = fn; } }, onInstalled: { addListener(fn) { installed = fn; } } },
    storage: {
      local: {
        get(key) { return Promise.resolve(key in store ? { [key]: JSON.parse(JSON.stringify(store[key])) } : {}); },
        set(obj) { Object.assign(store, JSON.parse(JSON.stringify(obj))); return Promise.resolve(); }
      }
    }
  };
  const code = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');
  vm.runInNewContext(code, { chrome, FreshDigLists, console: { log() {}, warn() {} }, Promise, JSON, Date, String, Array, Set, Number, RegExp, Error });
  const send = (req) => new Promise((resolve) => { listener(req, {}, resolve); });
  return {
    store,
    send,
    windows,
    install: (reason) => installed({ reason }),
    get createCount() { return createCount; },
    get focusCount() { return focusCount; },
    closeWindow() { activeWindow = null; if (removedListener) removedListener(21); }
  };
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

test('later import validates the whole list, keeps existing records, and preserves dates', async () => {
  const { store, send } = loadBackground();
  store.laterArtists = [{ artistId: '1', name: 'Existing', addedAt: '2020-01-01' }];
  const imported = await send({ action: 'LATER_IMPORT', items: [
    { artistId: '1', name: 'Imported copy', addedAt: '2024-01-01' },
    { artistId: '2', name: 'New', addedAt: '2021-02-03' }
  ] });
  assert.strictEqual(imported.ok, true);
  assert.deepStrictEqual(store.laterArtists, [
    { artistId: '1', name: 'Existing', addedAt: '2020-01-01' },
    { artistId: '2', name: 'New', addedAt: '2021-02-03' }
  ]);

  const before = JSON.stringify(store.laterArtists);
  const bad = await send({ action: 'LATER_IMPORT', items: [{ name: 'missing id' }] });
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(bad.reason, 'invalid');
  assert.strictEqual(JSON.stringify(store.laterArtists), before);
});

test('later import rejects over-capacity without truncating or writing', async () => {
  const { store, send } = loadBackground();
  const original = Array.from({ length: 500 }, (_, i) => ({ artistId: String(i + 1), name: 'x' }));
  store.laterArtists = original.slice();
  const result = await send({ action: 'LATER_IMPORT', items: [{ artistId: 'new', name: 'new' }] });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, 'limit');
  assert.deepStrictEqual(store.laterArtists, original);
  const tooMany = await send({ action: 'LATER_IMPORT', items: Array.from({ length: 501 }, (_, i) => ({ artistId: 'i' + i })) });
  assert.strictEqual(tooMany.ok, false);
  assert.strictEqual(tooMany.reason, 'limit');
  assert.deepStrictEqual(store.laterArtists, original);
});

test('service worker importScripts loads FreshDigLists in its own VM realm', async () => {
  const store = {};
  let listener = null;
  const chrome = {
    cookies: null,
    tabs: { onUpdated: { addListener() {} }, query(_query, callback) { callback([]); }, sendMessage() { return Promise.resolve(); } },
    windows: { onRemoved: { addListener() {} } },
    runtime: {
      lastError: null,
      onMessage: { addListener(fn) { listener = fn; } },
      onInstalled: { addListener() {} }
    },
    storage: {
      local: {
        get() { return Promise.resolve(store.laterArtists === undefined ? {} : { laterArtists: store.laterArtists }); },
        set(obj) { Object.assign(store, obj); return Promise.resolve(); }
      }
    }
  };
  const context = vm.createContext({ chrome, console: { log() {}, warn() {} } });
  context.importScripts = function (file) {
    assert.strictEqual(file, 'list_backup.js');
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8'), context);
  const result = await new Promise((resolve) => {
    listener({ action: 'LATER_IMPORT', items: [{ artistId: 'realm-1', name: 'Realm' }] }, {}, resolve);
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(JSON.stringify(store.laterArtists), JSON.stringify([{ artistId: 'realm-1', name: 'Realm' }]));
});

test('later window opens once, focuses on duplicate requests, and recovers after close', async () => {
  const state = loadBackground();
  const opened = await Promise.all([
    state.send({ action: 'OPEN_LATER_WINDOW' }),
    state.send({ action: 'OPEN_LATER_WINDOW' })
  ]);
  assert.strictEqual(state.createCount, 1);
  assert.strictEqual(opened[0].ok, true);
  assert.strictEqual(opened[1].ok, true);
  const reused = await state.send({ action: 'OPEN_LATER_WINDOW' });
  assert.strictEqual(reused.ok, true);
  assert.strictEqual(state.focusCount, 1);
  state.closeWindow();
  const reopened = await state.send({ action: 'OPEN_LATER_WINDOW' });
  assert.strictEqual(reopened.ok, true);
  assert.strictEqual(state.createCount, 2);
});

test('later page closes through its window for the button and Escape key', async () => {
  class Element {
    constructor() {
      this.dataset = {};
      this.handlers = {};
      this.children = [];
      this.value = '';
      this.scrollTop = 0;
    }
    addEventListener(type, fn) { this.handlers[type] = fn; }
    setAttribute() {}
    appendChild(child) { this.children.push(child); }
    querySelectorAll() { return []; }
    focus() {}
  }
  const elements = {
    'later-items': new Element(),
    'later-search': new Element(),
    'later-title': new Element(),
    'later-close': new Element(),
    'later-status': new Element()
  };
  const documentHandlers = {};
  let closeCount = 0;
  const doc = {
    defaultView: { close() { closeCount += 1; } },
    documentElement: {},
    getElementById(id) { return elements[id] || null; },
    createElement() { return new Element(); },
    addEventListener(type, fn) { documentHandlers[type] = fn; }
  };
  const chrome = {
    storage: {
      local: { get() { return Promise.resolve({ laterArtists: [], preferredLanguage: 'en' }); } },
      onChanged: { addListener() {} }
    }
  };
  const i18n = {
    resolveLanguage() { return 'en'; },
    getTexts() { return { mpLaterListLabel: 'Listen later', listSearch: 'Search', listEmpty: '(empty)', listLaterDelete: 'Delete', onboardingClose: 'Close' }; }
  };
  FreshDigLater.mount(doc, chrome, i18n);
  elements['later-close'].handlers.click();
  documentHandlers.keydown({ key: 'Escape' });
  await Promise.resolve();
  assert.strictEqual(closeCount, 2);
});
