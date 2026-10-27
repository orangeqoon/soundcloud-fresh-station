// Run only in a disposable browser profile: this tests real IndexedDB API
// transactions, not the test-only in-memory implementation.
(async function () {
    'use strict';
    const output = document.getElementById('result');
    const store = FreshDigHeardHistory.createStore({ dbName: 'FreshDig-test-' + Date.now() });
    let checks = 0;
    function check(value, message) { if (!value) throw new Error(message); checks++; }
    try {
        check((await store.put([{ id: 1, heardAt: 100 }, { id: '1', heardAt: 200 }, { id: 2, heardAt: 300 }])).ok, 'initial commit');
        check((await store.put([{ id: '1', heardAt: 500 }])).ok, 'additive commit');
        const first = await store.page(null, 10);
        check(first.ok && first.records[0].heardAt === 100, 'duplicate timestamps keep earliest');
        for (let start = 1000; start < 1200; start += 100) {
            const batch = Array.from({ length: 100 }, (_, i) => ({ id: start + i, heardAt: start + i }));
            check((await store.put(batch)).ok, 'batch commit');
        }
        const lookup = await store.lookup(['1', '1199', '999999']);
        check(lookup.ok && lookup.ids.length === 2, 'exact ID lookup');
        let cursor = null;
        const seen = new Set();
        do {
            const page = await store.page(cursor, 17);
            check(page.ok && page.records.length <= 17, 'bounded page');
            page.records.forEach(function (record) { check(!seen.has(record.id), 'unique page record'); seen.add(record.id); });
            cursor = page.done ? null : page.nextCursor;
        } while (cursor);
        check(seen.size === 202, 'all pages retained');
        const stats = await store.stats();
        check(stats.ok && stats.count === 202 && stats.oldestAt === 100 && stats.newestAt === 1199, 'indexed stats');
        check((await store.clear()).ok && (await store.stats()).count === 0, 'clear commit');
        output.textContent = 'PASS: ' + checks + ' real IndexedDB checks';
        document.title = 'PASS';
    } catch (error) {
        output.textContent = 'FAIL: ' + error.message + '\n' + error.stack;
        document.title = 'FAIL';
    }
})();
