// Standalone extension window for the Later artist list.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FreshDigLater = api;
  if (root && root.document && root.chrome) {
    const start = function () { api.mount(root.document, root.chrome, root.FreshDigI18n); };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  function dateValue(value) {
    if (value === undefined || value === null || value === '') return null;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  function compareEntries(a, b) {
    const aDate = dateValue(a && a.addedAt);
    const bDate = dateValue(b && b.addedAt);
    if (aDate !== bDate) {
      if (aDate === null) return 1;
      if (bDate === null) return -1;
      return aDate - bDate;
    }
    const aName = String((a && a.name) || '').toLowerCase();
    const bName = String((b && b.name) || '').toLowerCase();
    if (aName !== bName) return aName < bName ? -1 : 1;
    const aId = String(a && a.artistId !== undefined ? a.artistId : '');
    const bId = String(b && b.artistId !== undefined ? b.artistId : '');
    return aId === bId ? 0 : aId < bId ? -1 : 1;
  }

  function safeArtistUrl(permalink) {
    let value = String(permalink === undefined || permalink === null ? '' : permalink).trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) {
      try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'soundcloud.com') return '';
        const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
        if (parts.length !== 1) return '';
        value = parts[0];
      } catch (e) {
        return '';
      }
    }
    if (!value || /[\s?#/:\\]/.test(value)) return '';
    const slug = value;
    return 'https://soundcloud.com/' + encodeURIComponent(slug) + '/tracks';
  }

  function normalizeRecords(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(function (record) {
      return !!record && typeof record === 'object' && !Array.isArray(record) && String(record.artistId === undefined || record.artistId === null ? '' : record.artistId).trim() !== '';
    }).map(function (record) {
      return Object.assign({}, record, { artistId: String(record.artistId) });
    });
  }

  function storageGet(chromeApi, keys) {
    return new Promise(function (resolve, reject) {
      if (!chromeApi || !chromeApi.storage || !chromeApi.storage.local || typeof chromeApi.storage.local.get !== 'function') {
        reject(new Error('storage-unavailable'));
        return;
      }
      let settled = false;
      const finish = function (fn, value) {
        if (settled) return;
        settled = true;
        fn(value);
      };
      const callback = function (value) {
        const error = chromeApi.runtime && chromeApi.runtime.lastError;
        if (error) finish(reject, new Error(error.message || 'storage-error'));
        else finish(resolve, value || {});
      };
      try {
        const result = chromeApi.storage.local.get(keys, callback);
        if (result && typeof result.then === 'function') result.then(function (value) { finish(resolve, value || {}); }, function (error) { finish(reject, error); });
      } catch (e) {
        finish(reject, e);
      }
    });
  }

  function removeRecord(chromeApi, artistId) {
    return new Promise(function (resolve) {
      if (!chromeApi || !chromeApi.runtime || typeof chromeApi.runtime.sendMessage !== 'function') {
        resolve({ ok: false, reason: 'error' });
        return;
      }
      let settled = false;
      const finish = function (result) {
        if (settled) return;
        settled = true;
        resolve(result && typeof result === 'object' ? result : { ok: false, reason: 'error' });
      };
      try {
        const result = chromeApi.runtime.sendMessage({ action: 'LATER_REMOVE', artistId: artistId }, function (response) {
          if (chromeApi.runtime.lastError) finish({ ok: false, reason: 'error' });
          else finish(response);
        });
        if (result && typeof result.then === 'function') result.then(finish, function () { finish({ ok: false, reason: 'error' }); });
      } catch (e) {
        finish({ ok: false, reason: 'error' });
      }
    });
  }

  function mount(doc, chromeApi, i18n) {
    const itemsEl = doc.getElementById('later-items');
    const searchEl = doc.getElementById('later-search');
    const titleEl = doc.getElementById('later-title');
    const closeEl = doc.getElementById('later-close');
    const statusEl = doc.getElementById('later-status');
    if (!itemsEl || !searchEl) return;

    let records = [];
    let language = 'auto';
    let texts = i18n && i18n.getTexts ? i18n.getTexts(language) : {
      mpLaterListLabel: 'Listen later', listSearch: 'Search', listEmpty: '(empty)', listLaterDelete: 'Delete', listFrom: 'From', onboardingClose: 'Close', m_laterFail: 'Could not save Listen later'
    };

    function locale() {
      return i18n && i18n.resolveLanguage ? i18n.resolveLanguage(language) : 'en';
    }

    function applyTexts() {
      if (i18n && i18n.getTexts) texts = i18n.getTexts(language);
      const resolved = locale();
      doc.documentElement.lang = resolved;
      if (titleEl) titleEl.textContent = texts.mpLaterListLabel || texts.tabLater || 'Listen later';
      if (closeEl) closeEl.setAttribute('aria-label', texts.onboardingClose || 'Close');
      if (searchEl) searchEl.placeholder = texts.listSearch || 'Search';
      if (statusEl && !statusEl.dataset.error) statusEl.textContent = '';
      render();
    }

    function setStatus(message, error) {
      if (!statusEl) return;
      statusEl.textContent = message || '';
      if (message) statusEl.dataset.error = error ? '1' : '';
      else delete statusEl.dataset.error;
    }

    function formatDate(value) {
      const timestamp = dateValue(value);
      if (timestamp === null) return '—';
      try { return new Date(timestamp).toLocaleDateString(locale()); } catch (e) { return new Date(timestamp).toLocaleDateString(); }
    }

    function focusAfterDelete(index) {
      const rows = itemsEl.querySelectorAll('.later-row');
      if (!rows.length) {
        if (closeEl && typeof closeEl.focus === 'function') closeEl.focus();
        else itemsEl.focus();
        return;
      }
      const row = rows[Math.min(index, rows.length - 1)];
      const target = row.querySelector('.later-remove, a, button');
      if (target && typeof target.focus === 'function') target.focus();
    }

    function removeOne(record, button) {
      if (button.disabled) return;
      const row = button.closest ? button.closest('.later-row') : button.parentNode;
      const visibleRows = Array.prototype.slice.call(itemsEl.querySelectorAll('.later-row'));
      const rowIndex = Math.max(0, visibleRows.indexOf(row));
      const scrollTop = itemsEl.scrollTop;
      button.disabled = true;
      removeRecord(chromeApi, record.artistId).then(function (result) {
        if (!result || result.ok !== true) {
          button.disabled = false;
          setStatus(texts.m_laterFail || 'Could not save Listen later', true);
          return;
        }
        records = records.filter(function (entry) { return String(entry.artistId) !== String(record.artistId); });
        setStatus('', false);
        render(scrollTop, rowIndex);
      });
    }

    function closeWindow() {
      const view = (doc && doc.defaultView) || (typeof window !== 'undefined' ? window : null);
      if (view && typeof view.close === 'function') view.close();
    }

    function render(scrollTop, focusIndex) {
      const keepScroll = scrollTop === undefined ? itemsEl.scrollTop : scrollTop;
      const query = String(searchEl.value || '').trim().toLowerCase();
      const visible = records.slice().sort(compareEntries).filter(function (record) {
        if (!query) return true;
        return [record.name, record.permalink, record.fromTrackTitle, record.artistId].map(function (v) { return String(v || '').toLowerCase(); }).some(function (v) { return v.indexOf(query) !== -1; });
      });
      itemsEl.textContent = '';
      visible.forEach(function (record) {
        const row = doc.createElement('div');
        row.className = 'later-row later-item';
        row.setAttribute('role', 'listitem');
        const name = String(record.name || record.artistId);
        const href = safeArtistUrl(record.permalink);
        const label = href ? doc.createElement('a') : doc.createElement('span');
        label.className = href ? 'later-item-name' : 'name later-item-name';
        label.textContent = name;
        if (href) {
          label.href = href;
          label.target = '_blank';
          label.rel = 'noopener noreferrer';
        }
        if (record.fromTrackTitle) label.title = String(texts.listFrom || 'From') + ': ' + String(record.fromTrackTitle);
        row.appendChild(label);
        const date = doc.createElement('time');
        const timestamp = dateValue(record.addedAt);
        date.textContent = formatDate(record.addedAt);
        if (timestamp !== null) date.dateTime = new Date(timestamp).toISOString();
        row.appendChild(date);
        const remove = doc.createElement('button');
        remove.type = 'button';
        remove.className = 'later-remove';
        remove.textContent = '×';
        remove.setAttribute('aria-label', (texts.listLaterDelete || 'Delete') + ': ' + name);
        remove.addEventListener('click', function () { removeOne(record, remove); });
        row.appendChild(remove);
        itemsEl.appendChild(row);
      });
      if (!visible.length) {
        const empty = doc.createElement('p');
        empty.className = 'empty';
        empty.textContent = texts.listEmpty || '(empty)';
        itemsEl.appendChild(empty);
      }
      itemsEl.scrollTop = keepScroll;
      if (focusIndex !== undefined) focusAfterDelete(focusIndex);
    }

    searchEl.addEventListener('input', function () { render(); });
    if (closeEl) closeEl.addEventListener('click', closeWindow);
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeWindow();
    });
    if (chromeApi.storage && chromeApi.storage.onChanged && chromeApi.storage.onChanged.addListener) {
      chromeApi.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'local') return;
        if (changes.preferredLanguage) language = changes.preferredLanguage.newValue || 'auto';
        if (changes.laterArtists) records = normalizeRecords(changes.laterArtists.newValue);
        if (changes.preferredLanguage || changes.laterArtists) applyTexts();
      });
    }

    records = [];
    applyTexts();
    storageGet(chromeApi, ['laterArtists', 'preferredLanguage']).then(function (stored) {
      language = stored.preferredLanguage || 'auto';
      records = normalizeRecords(stored.laterArtists);
      applyTexts();
    }).catch(function () {
      setStatus(texts.m_laterFail || 'Could not load Listen later', true);
    });
  }

  return {
    dateValue: dateValue,
    compareEntries: compareEntries,
    safeArtistUrl: safeArtistUrl,
    normalizeRecords: normalizeRecords,
    mount: mount
  };
});
