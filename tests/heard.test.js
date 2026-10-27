'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const heard = require('../heard_history.js');

test('heard history stores minimal records and reports known IDs', async () => {
  const store = heard.createMemoryStore();
  assert.deepEqual(await store.put([
    { id: 101, heardAt: 1000, title: 'ignored' },
    { id: '202', heardAt: 2000, artistId: 9 }
  ]), { ok: true });
  assert.deepEqual(await store.put([{ id: '101', heardAt: 3000 }]), { ok: true });
  assert.deepEqual(await store.lookup(['101', '303', 202]), { ok: true, ids: ['101', '202'] });
  assert.deepEqual(await store.stats(), { ok: true, count: 2, oldestAt: 1000, newestAt: 2000 });
  const page = await store.page(null, 10);
  assert.deepEqual(page.records, [
    { id: '101', heardAt: 1000 },
    { id: '202', heardAt: 2000 }
  ]);
  assert.equal(page.done, true);
  assert.equal(page.nextCursor, null);
});

test('heard history pages are bounded and continue with an exclusive cursor', async () => {
  const store = heard.createMemoryStore();
  const records = [];
  for (let i = 1001; i <= 1205; i += 1) records.push({ id: String(i), heardAt: i });
  assert.deepEqual(await store.put(records.slice(0, 100)), { ok: true });
  for (let i = 100; i < records.length; i += 100) {
    assert.deepEqual(await store.put(records.slice(i, i + 100)), { ok: true });
  }
  assert.deepEqual(await store.page(null, heard.MAX_PAGE + 1), { ok: false, reason: 'invalid-limit' });

  const first = await store.page(null, 25);
  assert.equal(first.records.length, 25);
  assert.equal(first.done, false);
  const second = await store.page(first.nextCursor, 25);
  assert.equal(second.records.length, 25);
  assert.equal(second.records[0].id, '1026');
  assert.notEqual(second.records[0].id, first.records[first.records.length - 1].id);
});

test('heard history rejects malformed batches and remains available without indexedDB', async () => {
  const store = heard.createMemoryStore();
  assert.deepEqual(await store.put([{ id: '0', heardAt: 1 }]), { ok: false, reason: 'invalid-records' });
  assert.deepEqual(await store.put([{ id: '1', heardAt: 'not-a-timestamp' }]), { ok: false, reason: 'invalid-records' });
  assert.deepEqual(await store.lookup(new Array(heard.MAX_BATCH + 1).fill('1')), { ok: false, reason: 'invalid-ids' });

  const unavailable = heard.createStore({ indexedDB: null });
  assert.deepEqual(await unavailable.request({ op: 'lookup', ids: ['1'] }), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await unavailable.request({ op: 'put', records: [{ id: '1', heardAt: 1 }] }), { ok: false, reason: 'unavailable' });
});

test('heard history consumes an aborted IndexedDB transaction as a store error', async () => {
  const db = {
    objectStoreNames: { contains() { return true; } },
    close() {},
    transaction(_name, _mode, _options) {
      const tx = {
        error: new Error('aborted'),
        objectStore() {
          return {
            get() {
              const request = {};
              queueMicrotask(() => { if (request.onsuccess) request.onsuccess(); });
              return request;
            },
            put() {}
          };
        }
      };
      queueMicrotask(() => { if (tx.onabort) tx.onabort(); });
      return tx;
    }
  };
  const fakeIndexedDB = {
    open() {
      const request = {};
      queueMicrotask(() => {
        request.result = db;
        if (request.onsuccess) request.onsuccess();
      });
      return request;
    }
  };
  const store = heard.createStore({ indexedDB: fakeIndexedDB });
  assert.deepEqual(await store.request({ op: 'lookup', ids: ['1'] }), { ok: false, reason: 'error' });
});
