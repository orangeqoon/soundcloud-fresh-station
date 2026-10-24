'use strict';
// station_hook.js を最小限の偽ブラウザ環境で読み込み、起動時の例外（未定義の変数など）が無いことを確かめる。
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function makeEnv() {
  const store = {};
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
  const listeners = {};
  const el = () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    addEventListener() {}, appendChild() {}, remove() {}, querySelector() { return null; }, setAttribute() {}, getAttribute() { return null; } });
  const posted = [];
  const win = {
    location: { origin: 'https://soundcloud.com', pathname: '/discover', href: 'https://soundcloud.com/discover' },
    localStorage,
    addEventListener(t, fn) { (listeners[t] = listeners[t] || []).push(fn); },
    postMessage(m) { posted.push(m); },
    fetch: async () => ({ ok: false, status: 503, headers: { get() { return null; } }, clone() { return this; }, text: async () => '' }),
    setInterval: () => 0, setTimeout: (fn) => 0, clearTimeout() {}, clearInterval() {},
    navigator: { userAgent: 'test', language: 'en', locks: null },
    BroadcastChannel: function () { this.postMessage = () => {}; },
    XMLHttpRequest: function () {},
    HTMLMediaElement: function () {},
    document: {
      cookie: '', hidden: false, body: el(), title: '',
      querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: el,
      addEventListener() {}
    },
    URL, Response: function (b, o) { this.status = (o && o.status) || 200; },
    console: { log() {}, warn() {}, error() {} }
  };
  win.XMLHttpRequest.prototype = { open() {}, setRequestHeader() {} };
  win.HTMLMediaElement.prototype = { play() {} };
  win.window = win; win.self = win;
  win.FreshDigI18n = require('../i18n.js');
  win.FreshDigCore = require('../freshdig_core.js');
  return { win, store, listeners, posted };
}

test('station_hook.js loads without throwing and answers GET_DIAG_LOG', async () => {
  const { win, posted, listeners } = makeEnv();
  const ctx = vm.createContext(win);
  const src = fs.readFileSync(path.join(__dirname, '..', 'station_hook.js'), 'utf8');
  vm.runInContext(src, ctx, { filename: 'station_hook.js' });
  // 診断ログの問い合わせに必ず返事をする
  for (const handler of listeners.message) await handler({ source: vm.runInContext('window', ctx), data: { type: 'SC_FRESH_STATION_POPUP_ACTION', action: 'GET_DIAG_LOG', requestId: 'r1' } });
  const reply = posted.find((m) => m.requestId === 'r1');
  assert.ok(reply, 'no reply for GET_DIAG_LOG: ' + JSON.stringify(posted).slice(0, 500));
  assert.strictEqual(reply.result.success, true);
  assert.match(reply.result.text, /FreshDig diag log/);
  assert.ok(Array.isArray(reply.result.entries), 'entries should be an array');
  assert.ok(reply.result.stats && typeof reply.result.stats.totalNoPlays === 'number', 'stats.totalNoPlays should exist');
  assert.strictEqual(reply.result.runtimeVersion, require('../manifest.json').version);
  assert.strictEqual(reply.result.playback.hasMedia, false);
  assert.strictEqual(typeof reply.result.playback.wanted, 'boolean');
});

test('icons/flags contains all required SVG files for F1', () => {
  const flags = ['auto.svg', 'jp.svg', 'us.svg', 'de.svg', 'ru.svg'];
  for (const f of flags) {
    const p = path.join(__dirname, '..', 'icons', 'flags', f);
    assert.ok(fs.existsSync(p), 'missing flag svg: ' + f);
    const content = fs.readFileSync(p, 'utf8');
    assert.ok(content.includes('<svg'), f + ' is not valid SVG');
  }
});
