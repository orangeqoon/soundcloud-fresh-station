'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const i18n = require('../i18n.js');
const core = require('../freshdig_core.js');

async function openPopup(language, connected) {
  class Element {
    constructor() {
      this.children = []; this.handlers = {}; this.style = {}; this.dataset = {};
      this.value = ''; this.checked = false; this._text = ''; this.attributes = {};
      this.classList = { toggle() {}, add() {}, remove() {} };
    }
    set textContent(value) { this._text = value; this.children = []; }
    get textContent() { return this._text; }
    set innerHTML(value) { this.textContent = value; }
    get options() { return this.children; }
    addEventListener(type, fn) { this.handlers[type] = fn; }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key]; }
    appendChild(child) { this.children.push(child); return child; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    querySelectorAll() { return []; }
  }
  const elements = {};
  const html = fs.readFileSync(path.join(__dirname, '../popup.html'), 'utf8');
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) elements[match[1]] = new Element();
  let start;
  const document = {
    documentElement: new Element(), activeElement: null,
    getElementById(id) { return elements[id] || null; },
    querySelectorAll() { return []; }, createElement() { return new Element(); },
    addEventListener(type, fn) { if (type === 'DOMContentLoaded') start = fn; }
  };
  const stored = {
    preferredLanguage: language,
    laterArtists: [{ artistId: '7', name: 'Saved Author', permalink: 'saved-author' }],
    digSkipRules: { followingArtists: false, hatedArtists: true, laterArtists: true, likedTracks: true, noplayTracks: true }
  };
  const data = {
    loggedIn: true, accountName: 'popup-test', isReady: true,
    dislikedArtists: { '8': { name: 'Excluded Author' } },
    dislikedTracks: { '9': { title: 'NoPlay Track' } },
    digSkipRules: stored.digSkipRules, myPlaylists: [], stats: {}
  };
  const requests = [];
  const chrome = {
    runtime: { lastError: null, getURL(file) { return 'chrome-extension://test/' + file; }, sendMessage() {} },
    storage: {
      local: {
        get(keys, callback) {
          const result = {};
          (Array.isArray(keys) ? keys : [keys]).forEach(key => { if (key in stored) result[key] = stored[key]; });
          if (callback) { queueMicrotask(() => callback(result)); return; }
          return Promise.resolve(result);
        },
        set() {}
      },
      onChanged: { addListener() {} }
    },
    tabs: {
      async query() { return connected ? [{ id: 3, url: 'https://soundcloud.com/discover' }] : []; },
      sendMessage(id, request, callback) {
        requests.push(request.action);
        if (callback) queueMicrotask(() => callback(request.action === 'GET_DATA' ? data : { success: true }));
      },
      create() {}
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8'), {
    document, chrome, FreshDigI18n: i18n, FreshDigCore: core, URL, console,
    window: { close() {} }, navigator: { userAgent: 'test' }, setTimeout
  });
  await start();
  await new Promise(resolve => setImmediate(resolve));
  return { elements, requests };
}

for (const language of ['ja', 'en', 'de', 'ru', 'vi', 'es', 'ro']) {
  test('popup initializes translated lists, Dig settings and SoundCloud connection: ' + language, async () => {
    const { elements, requests } = await openPopup(language, true);
    const texts = i18n.getTexts(language);
    assert.ok(requests.includes('GET_DATA'));
    assert.equal(elements['conn-badge'].textContent, '✅ @popup-test');
    assert.equal(elements['fresh-title'].textContent, texts.freshTitle);
    assert.equal(elements['dig-rule-following-label'].textContent, texts.digRuleFollowing);
    assert.equal(elements['dig-rule-following'].checked, false);
    const names = () => elements['list-body'].children.map(row => row.children[0] && row.children[0].textContent);
    assert.ok(names().includes('Saved Author'));
    elements['tab-hated'].handlers.click();
    assert.ok(names().includes('Excluded Author'));
    elements['tab-noplay'].handlers.click();
    assert.ok(names().includes('NoPlay Track'));
  });
}

test('popup shows saved Later authors and translated Dig settings even without a SoundCloud tab', async () => {
  const { elements, requests } = await openPopup('ja', false);
  assert.equal(requests.length, 0);
  assert.equal(elements['conn-badge'].textContent, i18n.getTexts('ja').openSCTab);
  assert.ok(elements['fresh-title'].textContent);
  assert.ok(elements['list-body'].children.some(row => row.children[0] && row.children[0].textContent === 'Saved Author'));
});
