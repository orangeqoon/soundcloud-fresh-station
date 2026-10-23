'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('storage changes propagate Dig settings and Later removals to the MAIN world', () => {
  const posted = [];
  let onChange;
  let writes = 0;
  const window = { location: { origin: 'https://soundcloud.com' }, addEventListener() {}, postMessage(m) { posted.push(m); } };
  const chrome = {
    runtime: { lastError: null, sendMessage(req, cb) { cb(null); }, onMessage: { addListener() {} } },
    storage: { local: { get(keys, cb) { cb({}); }, set() { writes++; } }, onChanged: { addListener(fn) { onChange = fn; } } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../content_bridge.js'), 'utf8'), {
    window, chrome, console: { log() {} }, setTimeout() {}, clearTimeout() {}, Map
  });
  posted.length = 0;
  onChange({ discoveryEnabled: { newValue: false }, laterArtists: { newValue: [] }, onboardingPending: { newValue: true } }, 'local');
  assert.equal(posted.length, 2);
  assert.equal(posted[0].type, 'SC_FRESH_STATION_LATER_CHANGED');
  assert.equal(posted[0].list.length, 0);
  assert.equal(posted[1].type, 'SC_FRESH_STATION_RESTORE_STORAGE');
  assert.equal(posted[1].data.discoveryEnabled, false);
  assert.equal('onboardingPending' in posted[1].data, false);
  assert.equal(writes, 0, 'receiving a change must not write it back in a loop');
  posted.length = 0;
  onChange({ discoveryEnabled: { newValue: true } }, 'sync');
  assert.equal(posted.length, 0);
});
