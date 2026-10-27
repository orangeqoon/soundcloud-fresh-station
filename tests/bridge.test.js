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

test('Later bridge maps openList exactly and rejects unknown operations', () => {
  const posted = [];
  const calls = [];
  let onMessage;
  const window = {
    location: { origin: 'https://soundcloud.com' },
    addEventListener(type, fn) { if (type === 'message') onMessage = fn; },
    postMessage(m) { posted.push(m); }
  };
  const chrome = {
    runtime: {
      lastError: null,
      sendMessage(req, cb) { calls.push(req); cb({ ok: true }); },
      onMessage: { addListener() {} }
    },
    storage: {
      local: { get(keys, cb) { cb({}); }, set() {} },
      onChanged: { addListener() {} }
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../content_bridge.js'), 'utf8'), {
    window, chrome, console: { log() {} }, setTimeout() {}, clearTimeout() {}, Map
  });
  calls.length = 0;
  posted.length = 0;
  onMessage({ source: window, data: { type: 'SC_FRESH_STATION_LATER_OP', op: 'openList', reqId: 7 } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].action, 'OPEN_LATER_WINDOW');
  assert.equal(posted.length, 1);
  assert.equal(posted[0].type, 'SC_FRESH_STATION_LATER_RESULT');
  assert.equal(posted[0].reqId, 7);
  assert.equal(posted[0].result.ok, true);

  posted.length = 0;
  onMessage({ source: window, data: { type: 'SC_FRESH_STATION_LATER_OP', op: 'unexpected', reqId: 8 } });
  assert.equal(calls.length, 1, 'unknown operations never reach the background');
  assert.equal(posted[0].result.ok, false);
  assert.equal(posted[0].result.reason, 'unknown');
});

test('page history bridge cannot export or delete history, and recovery ARM returns its ACK', () => {
  let listener;
  const calls = [];
  const posted = [];
  const window = { location: { origin:'https://soundcloud.com' },
    addEventListener(type, fn) { if (type === 'message') listener = fn; },
    postMessage(message) { posted.push(message); } };
  const chrome = {
    runtime: {lastError:null,onMessage:{addListener(){}},sendMessage(request, cb) { calls.push(request); cb({ok:true}); }},
    storage: {local:{get(keys, cb){cb({});},set(){}},onChanged:{addListener(){}}}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../content_bridge.js'),'utf8'), {
    window,chrome,console:{log(){}},setTimeout(){},clearTimeout(){},Map
  });
  calls.length = 0; posted.length = 0;
  for (const op of ['clear','deleteAll','page','stats']) {
    listener({source:window,data:{type:'SC_FRESH_STATION_HEARD_REQUEST',requestId:'test',op}});
  }
  assert.equal(calls.length, 0, 'destructive/history-export operations are extension-UI-only');
  listener({source:window,data:{type:'SC_FRESH_STATION_ARM_RECOVERY_PLAYER',requestId:'arm1'}});
  assert.equal(calls[0].action,'ARM_RECOVERY_PLAYER');
  assert.equal(posted.at(-1).type,'SC_FRESH_STATION_ARM_RECOVERY_RESULT');
  assert.equal(posted.at(-1).result.ok,true);
});
