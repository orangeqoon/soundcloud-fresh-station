document.addEventListener('DOMContentLoaded', async function () {
  let currentLang = 'auto';
  let t = FreshDigI18n.getTexts(currentLang);
  let cachedData = null;

  // 言語の読み込み
  if (chrome.storage && chrome.storage.local) {
    const stored = await chrome.storage.local.get(['preferredLanguage']);
    if (stored && stored.preferredLanguage) {
      currentLang = stored.preferredLanguage;
    }
  }
  t = FreshDigI18n.getTexts(currentLang);

  function setActiveFlag(lang) {
    const flagBtns = document.querySelectorAll('#lang-flags .lang-flag-btn');
    flagBtns.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  const langFlags = document.getElementById('lang-flags');
  if (langFlags) {
    setActiveFlag(currentLang);
    langFlags.addEventListener('click', function (e) {
      const btn = e.target.closest('.lang-flag-btn');
      if (!btn) return;
      const selectedLang = btn.getAttribute('data-lang');
      if (!selectedLang || selectedLang === currentLang) return;
      currentLang = selectedLang;
      setActiveFlag(currentLang);
      t = FreshDigI18n.getTexts(currentLang);
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ preferredLanguage: currentLang });
      }
      // タブ側（station_hook）へも言語設定を通知
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          target: 'SC_FRESH_STATION',
          action: 'SET_LANGUAGE',
          language: currentLang
        }, function () { void chrome.runtime.lastError; });
      }
      applyStaticTranslations();
      if (cachedData) renderData(tab ? tab.id : null, cachedData);
    });
  }

  function applyStaticTranslations() {
    document.documentElement.lang = FreshDigI18n.resolveLanguage(currentLang);
    document.getElementById('btn-miniplayer').textContent = t.btnMiniPlayer;

    document.getElementById('auto-mp-label-wrapper').title = t.autoMpTitle;
    document.getElementById('auto-mp-text').textContent = t.autoMpLabel;
    const autoMpNote = document.getElementById('auto-mp-note');
    if (autoMpNote) {
      autoMpNote.textContent = t.autoMpPermissionNote;
      autoMpNote.classList.remove('unsupported');
    }
    const autoMpStatus = document.getElementById('auto-mp-status');
    if (autoMpStatus) {
      autoMpStatus.textContent = t.autoMpStatusUnknown;
      autoMpStatus.classList.remove('unsupported');
    }

    document.getElementById('label-discovery-title').textContent = t.discoveryMode;
    const discoveryToggle = document.getElementById('discovery-toggle');
    if (discoveryToggle) discoveryToggle.setAttribute('aria-label', t.discoveryMode);

    const guideBtn = document.getElementById('btn-open-guide');
    if (guideBtn) guideBtn.textContent = t.onboardingGuideButton;

    document.getElementById('label-target-pl').textContent = t.targetPlaylist;
    document.getElementById('sync-btn').textContent = t.btnSync;

    document.getElementById('label-dislike-section').textContent = t.dislikeSection;
    document.getElementById('btn-export-dislikes').textContent = t.btnExportDislikes;
    document.getElementById('btn-import-dislikes').textContent = t.btnImportDislikes;

    document.getElementById('label-advanced').textContent = t.advancedSettings;
    const btnReport = document.getElementById('btn-download-report');
    if (btnReport) btnReport.textContent = t.btnDownloadReport;
    const btnCopyLog = document.getElementById('btn-copy-log');
    if (btnCopyLog) btnCopyLog.textContent = t.btnCopyLog;

    const rateTitle = document.getElementById('rate-title');
    if (rateTitle && t.ratePromptTitle) rateTitle.textContent = t.ratePromptTitle;
    const rateDesc = document.getElementById('rate-desc');
    if (rateDesc && t.ratePromptDesc) rateDesc.textContent = t.ratePromptDesc;
    const btnRateNow = document.getElementById('btn-rate-now');
    if (btnRateNow && t.btnRateNow) btnRateNow.textContent = t.btnRateNow;
    const btnRateLater = document.getElementById('btn-rate-later');
    if (btnRateLater && t.btnRateLater) btnRateLater.textContent = t.btnRateLater;
    const btnRateDismiss = document.getElementById('btn-rate-dismiss');
    if (btnRateDismiss && t.btnRateDismiss) btnRateDismiss.textContent = t.btnRateDismiss;

    document.getElementById('label-stat-likes').textContent = t.statLikes;
    document.getElementById('label-stat-follows').textContent = t.statFollow;
    document.getElementById('label-stat-dislikes').textContent = t.statDislike;

    const tgl = document.getElementById('discovery-toggle');
    if (tgl) updateDiscoveryUI(tgl.checked);
    const badge0 = document.getElementById('conn-badge');
    if (badge0 && !cachedData) badge0.textContent = t.notConnected;
    const plSel = document.getElementById('pl-select');
    if (typeof renderLists === 'function') renderLists();
    if (typeof renderFresh === 'function') renderFresh();
    if (plSel && plSel.options.length === 1 && plSel.options[0].value === '') plSel.options[0].textContent = t.loadingSC;
  }

  let tab = null;

  // ---- リスト（R3 除外した作者 / R6 後で聴く / NoPlay） ----
  let listTab = 'later';
  let listLimit = 50;
  let laterList = [];

  function rowEl(nameText, href, sub, btnText, onBtn) {
    const row = document.createElement('div');
    row.className = 'list-row';
    const nm = document.createElement(href ? 'a' : 'span');
    nm.className = 'nm';
    nm.textContent = nameText;
    if (href) {
      nm.href = href;
      nm.addEventListener('click', function (e) { e.preventDefault(); chrome.tabs.create({ url: href }); });
    }
    row.appendChild(nm);
    if (sub) {
      const sb = document.createElement('span');
      sb.className = 'sub';
      sb.textContent = sub;
      row.appendChild(sb);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = btnText;
    b.addEventListener('click', onBtn);
    row.appendChild(b);
    return row;
  }

  function laterDateValue(value) {
    if (value === undefined || value === null || value === '') return null;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  function compareLaterEntries(a, b) {
    const aDate = laterDateValue(a && a.addedAt);
    const bDate = laterDateValue(b && b.addedAt);
    if (aDate !== bDate) {
      if (aDate === null) return 1;
      if (bDate === null) return -1;
      return aDate - bDate;
    }

    // Keep records without a date deterministic instead of relying on object order.
    const aName = String((a && a.name) || '').toLowerCase();
    const bName = String((b && b.name) || '').toLowerCase();
    if (aName !== bName) return aName < bName ? -1 : 1;
    const aId = String(a && a.artistId !== undefined ? a.artistId : '');
    const bId = String(b && b.artistId !== undefined ? b.artistId : '');
    if (aId !== bId) return aId < bId ? -1 : 1;
    return 0;
  }

  function renderLists() {
    const body = document.getElementById('list-body');
    if (!body) return;
    const q = (document.getElementById('list-search').value || '').trim().toLowerCase();
    const hatedTab = document.getElementById('tab-hated');
    const noPlayTab = document.getElementById('tab-noplay');
    hatedTab.textContent = '🤬';
    hatedTab.title = t.tabHated;
    hatedTab.setAttribute('aria-label', t.tabHated);
    if (noPlayTab) {
      noPlayTab.textContent = '⏭️';
      noPlayTab.title = t.tabNoPlay || 'NoPlay';
      noPlayTab.setAttribute('aria-label', t.tabNoPlay || 'NoPlay');
    }
    document.getElementById('tab-later').textContent = t.tabLater;
    document.getElementById('tab-hated').classList.toggle('active', listTab === 'hated');
    if (noPlayTab) noPlayTab.classList.toggle('active', listTab === 'noplay');
    document.getElementById('tab-later').classList.toggle('active', listTab === 'later');
    hatedTab.setAttribute('aria-pressed', String(listTab === 'hated'));
    if (noPlayTab) noPlayTab.setAttribute('aria-pressed', String(listTab === 'noplay'));
    document.getElementById('tab-later').setAttribute('aria-pressed', String(listTab === 'later'));
    body.setAttribute('aria-labelledby', 'tab-' + listTab);
    document.getElementById('list-search').placeholder = t.listSearch;
    body.textContent = '';
    let rows = [];
    if (listTab === 'hated') {
      if (!cachedData) {
        rows = null;
      } else {
        const da = cachedData.dislikedArtists || {};
        const items = Object.keys(da).map(function (k) { return { key: k, rec: da[k] || {} }; });
        items.sort(function (a, b) { return (b.rec.ts || 0) - (a.rec.ts || 0); });
        rows = items.filter(function (it) { return !q || String(it.rec.name || '').toLowerCase().indexOf(q) !== -1; }).map(function (it) {
          return function () {
            const href = it.rec.permalink ? 'https://soundcloud.com/' + encodeURIComponent(it.rec.permalink) : '';
            return rowEl(it.rec.name || it.key, href, it.rec.date || '', t.listUnban, function () {
              if (!tab) return;
              chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'REMOVE', targetType: 'artist', targetId: it.key }, function () {
                void chrome.runtime.lastError;
                delete cachedData.dislikedArtists[it.key];
                renderLists();
              });
            });
          };
        });
      }
    } else if (listTab === 'noplay') {
      if (!cachedData) {
        rows = null;
      } else {
        const dt = cachedData.dislikedTracks || {};
        const items = Object.keys(dt).map(function (k) { return { key: k, rec: dt[k] || {} }; });
        rows = items.filter(function (it) {
          const rec = it.rec || {};
          const searchText = [rec.title, rec.artist, it.key].filter(Boolean).join(' ').toLowerCase();
          return !q || searchText.indexOf(q) !== -1;
        }).map(function (it) {
          return function () {
            const rec = it.rec || {};
            let href = '';
            try {
              const url = new URL(rec.permalink_url || rec.permalink || '', 'https://soundcloud.com');
              if ((rec.permalink_url || rec.permalink) && url.protocol === 'https:' && url.hostname === 'soundcloud.com') href = url.href;
            } catch (e) {}
            const sub = [rec.artist, rec.date].filter(Boolean).join(' · ');
            return rowEl(rec.title || rec.name || it.key, href, sub, t.listLaterDelete, function () {
              if (!tab) return;
              chrome.tabs.sendMessage(tab.id, {
                target: 'SC_FRESH_STATION',
                action: 'REMOVE',
                targetType: 'track',
                targetId: it.key
              }, function (result) {
                if (chrome.runtime.lastError || !result || result.success !== true) return;
                if (cachedData && cachedData.dislikedTracks) delete cachedData.dislikedTracks[it.key];
                renderLists();
              });
            });
          };
        });
      }
    } else {
      const sortedLater = laterList.slice().sort(compareLaterEntries);
      rows = sortedLater.filter(function (x) { return !q || String(x.name || '').toLowerCase().indexOf(q) !== -1; }).map(function (x) {
        return function () {
          const href = x.permalink ? 'https://soundcloud.com/' + encodeURIComponent(x.permalink) + '/tracks' : '';
          const timestamp = laterDateValue(x.addedAt);
          const d = timestamp === null ? '' : new Date(timestamp).toLocaleDateString();
          const row = rowEl(x.name || x.artistId, href, d, t.listLaterDelete, function () {
            chrome.runtime.sendMessage({ action: 'LATER_REMOVE', artistId: x.artistId }, function () { void chrome.runtime.lastError; });
          });
          if (x.fromTrackTitle) row.title = t.listFrom + ': ' + x.fromTrackTitle;
          return row;
        };
      });
    }
    const more = document.getElementById('list-more');
    if (rows === null) {
      const e = document.createElement('div');
      e.className = 'list-empty';
      e.textContent = t.listNeedTab;
      body.appendChild(e);
      more.style.display = 'none';
      return;
    }
    if (rows.length === 0) {
      const e = document.createElement('div');
      e.className = 'list-empty';
      e.textContent = t.listEmpty;
      body.appendChild(e);
    }
    rows.slice(0, listLimit).forEach(function (mk) { body.appendChild(mk()); });
    more.style.display = rows.length > listLimit ? '' : 'none';
    more.textContent = t.listMore + ' (' + (rows.length - listLimit) + ')';
  }

  document.getElementById('tab-hated').addEventListener('click', function () { listTab = 'hated'; listLimit = 50; renderLists(); });
  document.getElementById('tab-noplay').addEventListener('click', function () { listTab = 'noplay'; listLimit = 50; renderLists(); });
  document.getElementById('tab-later').addEventListener('click', function () { listTab = 'later'; listLimit = 50; renderLists(); });
  document.getElementById('list-search').addEventListener('input', function () { listLimit = 50; renderLists(); });
  document.getElementById('list-more').addEventListener('click', function () { listLimit += 50; renderLists(); });
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('laterArtists', function (st) {
      laterList = (st && Array.isArray(st.laterArtists)) ? st.laterArtists : [];
      renderLists();
    });
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === 'local' && changes.laterArtists) {
        laterList = changes.laterArtists.newValue || [];
        renderLists();
      }
    });
  }

  // ---- フレッシュさで飛ばす（R10） ----
  const FRESH_ROWS = [
    ['followers', 'fresh-followers', 'freshFollowersPre', 'freshFollowersPost'],
    ['trackCount', 'fresh-tracks', 'freshTracksPre', 'freshTracksPost'],
    ['playCount', 'fresh-plays', 'freshPlaysPre', 'freshPlaysPost'],
    ['ageDays', 'fresh-age', 'freshAgePre', 'freshAgePost']
  ];
  let freshFilter = FreshDigCore.normalizeFreshFilter(null);

  function renderFresh() {
    document.getElementById('fresh-title').textContent = t.freshTitle;
    document.getElementById('fresh-hint').textContent = t.freshHint;
    FRESH_ROWS.forEach(function (r) {
      document.getElementById(r[1] + '-pre').textContent = t[r[2]];
      document.getElementById(r[1] + '-post').textContent = t[r[3]];
      document.getElementById(r[1] + '-on').checked = !!freshFilter[r[0]].on;
      const n = document.getElementById(r[1] + '-n');
      if (document.activeElement !== n) n.value = freshFilter[r[0]].n;
    });
  }

  function saveFresh() {
    FRESH_ROWS.forEach(function (r) {
      freshFilter[r[0]] = { on: document.getElementById(r[1] + '-on').checked, n: Number(document.getElementById(r[1] + '-n').value) };
    });
    freshFilter = FreshDigCore.normalizeFreshFilter(freshFilter);
    if (chrome.storage && chrome.storage.local) chrome.storage.local.set({ freshFilter: freshFilter });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'SET_FRESH_FILTER', filter: freshFilter }, function () { void chrome.runtime.lastError; });
    }
  }

  FRESH_ROWS.forEach(function (r) {
    document.getElementById(r[1] + '-on').addEventListener('change', saveFresh);
    document.getElementById(r[1] + '-n').addEventListener('change', saveFresh);
  });
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('freshFilter', function (st) {
      if (st && st.freshFilter) freshFilter = FreshDigCore.normalizeFreshFilter(st.freshFilter);
      renderFresh();
    });
  }

  applyStaticTranslations();


  const guideButton = document.getElementById('btn-open-guide');
  if (guideButton) {
    guideButton.addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('guide.html') }, function () {
        if (!chrome.runtime.lastError) window.close();
      });
    });
  }

  const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (currentTabs[0] && currentTabs[0].url && currentTabs[0].url.indexOf('soundcloud.com') !== -1) {
    tab = currentTabs[0];
  } else {
    const scTabs = await chrome.tabs.query({ url: '*://*.soundcloud.com/*' });
    if (scTabs && scTabs.length > 0) {
      tab = scTabs[0];
    }
  }

  if (!tab) {
    document.getElementById('conn-badge').textContent = t.openSCTab;
    return;
  }

  // 1. chrome.cookies API から oauth_token を取得してタブへ注入
  if (chrome.cookies) {
    chrome.cookies.get({ url: 'https://soundcloud.com', name: 'oauth_token' }, function (cookie) {
      if (cookie && cookie.value) {
        const tok = cookie.value.startsWith('OAuth ') ? cookie.value : ('OAuth ' + cookie.value);
        chrome.tabs.sendMessage(tab.id, {
          target: 'SC_FRESH_STATION',
          action: 'INJECT_AUTH_TOKEN',
          token: tok
        });
      }
    });
  }

  function requestData() {
    chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'GET_DATA' }, function (response) {
      const badge = document.getElementById('conn-badge');
      if (chrome.runtime.lastError) {
        badge.textContent = t.reloadRequired;
        badge.style.color = '#ffb300';
        badge.title = t.reloadRequiredDesc;
        return;
      }
      if (!response) {
        badge.textContent = t.loadingSC;
        return;
      }
      cachedData = response;
      renderData(tab.id, response);
    });
  }

  requestData();

  // 同期ボタン
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', function () {
      syncBtn.textContent = t.btnSyncing;
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'FORCE_SYNC' }, function () {
        void chrome.runtime.lastError;
        syncBtn.textContent = t.btnSync;
        requestData();
      });
    });
  }

  // 診断レポート保存 (JSON)
  const downloadReportBtn = document.getElementById('btn-download-report');
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', function () {
      const hint = document.getElementById('log-hint');
      if (!tab || !tab.id) {
        if (hint) hint.textContent = t.reportFailed;
        return;
      }
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'GET_DIAG_LOG' }, function (response) {
        if (chrome.runtime.lastError || !response || !response.success) {
          if (hint) hint.textContent = t.reportFailed;
          return;
        }
        try {
          const manifest = (chrome.runtime && chrome.runtime.getManifest) ? chrome.runtime.getManifest() : { version: '2.1.0' };
          const report = {
            schema: 1,
            version: manifest.version || '2.1.0',
            createdAt: new Date().toISOString(),
            browser: navigator.userAgent,
            page: tab.url || '',
            settings: {
              preferredLanguage: currentLang,
              freshFilter: (cachedData && cachedData.freshFilter) || {},
              autoMiniPlayer: (cachedData && cachedData.autoMiniPlayer) || false,
              playbackMode: (cachedData && cachedData.playbackMode) || 'DISCOVERY',
              discoveryEnabled: (cachedData && cachedData.discoveryEnabled) !== false
            },
            stats: response.stats || {},
            entries: response.entries || []
          };
          const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const now = new Date();
          const pad = function (n) { return String(n).padStart(2, '0'); };
          const ts = '' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' +
                     pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
          a.download = 'freshdig-report-' + ts + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          if (hint) hint.textContent = t.reportSaved;
        } catch (e) {
          if (hint) hint.textContent = t.reportFailed;
        }
      });
    });
  }

  // Dislike エクスポート / インポートボタン
  const exportBtn = document.getElementById('btn-export-dislikes');
  const importBtn = document.getElementById('btn-import-dislikes');
  const syncMsg = document.getElementById('dislike-sync-msg');

  function showSyncMsg(text, isError) {
    if (!syncMsg) return;
    syncMsg.style.display = 'block';
    syncMsg.textContent = text;
    syncMsg.style.color = isError ? '#ff5252' : '#69f0ae';
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      exportBtn.disabled = true;
      exportBtn.textContent = t.btnExportingDislikes;
      showSyncMsg(t.exportingMsg, false);
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'EXPORT_DISLIKES' }, function (res) {
        exportBtn.disabled = false;
        exportBtn.textContent = t.btnExportDislikes;
        if (chrome.runtime.lastError || !res) {
          showSyncMsg(t.commErrorMsg, true);
        } else {
          showSyncMsg(res.message, !res.success);
          requestData();
        }
      });
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', function () {
      importBtn.disabled = true;
      importBtn.textContent = t.btnImportingDislikes;
      showSyncMsg(t.importingMsg, false);
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'IMPORT_DISLIKES' }, function (res) {
        importBtn.disabled = false;
        importBtn.textContent = t.btnImportDislikes;
        if (chrome.runtime.lastError || !res) {
          showSyncMsg(t.commErrorMsg, true);
        } else {
          showSyncMsg(res.message, !res.success);
          requestData();
        }
      });
    });
  }

  // ミニプレイヤー起動ボタン
  const mpBtn = document.getElementById('btn-miniplayer');
  if (mpBtn) {
    mpBtn.addEventListener('click', function () {
      chrome.tabs.update(tab.id, { active: true }, function () {
        void chrome.runtime.lastError;
        chrome.tabs.sendMessage(tab.id, {
          target: 'SC_FRESH_STATION',
          action: 'TOGGLE_MINI_PLAYER'
        }, function () { void chrome.runtime.lastError; });
        window.close();
      });
    });
  }

  // 別タブを開いたらミニプレイヤーを自動表示 ON/OFF
  const autoMpToggle = document.getElementById('auto-mp-toggle');
  if (autoMpToggle) {
    autoMpToggle.addEventListener('change', function () {
      const enabled = autoMpToggle.checked;
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ autoMiniPlayer: enabled });
      }
      chrome.tabs.sendMessage(tab.id, {
        target: 'SC_FRESH_STATION',
        action: 'SET_AUTO_MINI_PLAYER',
        enabled: enabled
      }, function () {
        if (!chrome.runtime.lastError) requestData();
      });
    });
  }

  // 発掘モード ON/OFF
  const discoveryToggle = document.getElementById('discovery-toggle');
  if (discoveryToggle) {
    discoveryToggle.addEventListener('change', function () {
      const enabled = discoveryToggle.checked;
      updateDiscoveryUI(enabled);
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ discoveryEnabled: enabled });
      }
      chrome.tabs.sendMessage(tab.id, {
        target: 'SC_FRESH_STATION',
        action: 'SET_DISCOVERY_ENABLED',
        enabled: enabled
      }, function () { void chrome.runtime.lastError; });
    });
  }

  function updateDiscoveryUI(enabled) {
    const toggle = document.getElementById('discovery-toggle');
    const card = document.getElementById('discovery-card');
    const desc = document.getElementById('discovery-desc');
    const status = document.getElementById('discovery-status');
    if (toggle && toggle.checked !== enabled) toggle.checked = enabled;
    if (card) card.classList.toggle('off', !enabled);
    if (status) status.textContent = enabled ? t.discoveryStatusOn : t.discoveryStatusOff;
    if (desc) {
      desc.textContent = enabled ? t.discoveryOnDesc : t.discoveryOffDesc;
    }
  }

  function renderData(tabId, data) {
    const badge = document.getElementById('conn-badge');
    if (badge) {
      if (!data.loggedIn) {
        badge.textContent = t.notLoggedIn;
        badge.style.color = '#ff5252';
        badge.title = t.notLoggedInDesc;
      } else if (data.accountName) {
        badge.textContent = '✅ @' + data.accountName;
        badge.style.color = data.isReady ? '#00e676' : '#ffb300';
        badge.title = data.isReady ? t.connectedReady : t.connectedSyncing;
      } else {
        badge.textContent = t.connecting;
        badge.style.color = '#ffb300';
        badge.title = t.connectingDesc;
      }
    }

    updateDiscoveryUI(data.discoveryEnabled !== false);
    if (data.freshFilter) freshFilter = FreshDigCore.normalizeFreshFilter(data.freshFilter);
    renderFresh();
    renderLists();

    const autoMpToggleEl = document.getElementById('auto-mp-toggle');
    if (autoMpToggleEl) {
      autoMpToggleEl.checked = data.autoMiniPlayer !== false;
      const unsupported = data.autoPipSupported === false || data.autoPipStatus === 'unsupported';
      autoMpToggleEl.disabled = unsupported;
      autoMpToggleEl.setAttribute('aria-describedby', 'auto-mp-note');
      const status = document.getElementById('auto-mp-status');
      if (status) {
        status.textContent = unsupported
          ? t.autoMpStatusUnsupported
          : !autoMpToggleEl.checked ? t.discoveryStatusOff
          : data.autoPipStatus === 'registered' ? t.autoMpStatusRegistered : t.autoMpStatusUnknown;
        status.classList.toggle('unsupported', unsupported || !!data.autoPipLastError);
      }
      const note = document.getElementById('auto-mp-note');
      if (note) {
        note.classList.toggle('unsupported', unsupported || !!data.autoPipLastError);
        note.textContent = (unsupported ? t.autoMpNotSupported + ' ' : '') + t.autoMpPermissionNote +
          (data.autoPipLastError ? ' ' + t.autoMpLastError : '');
      }
      const wrapper = document.getElementById('auto-mp-label-wrapper');
      if (wrapper) wrapper.title = unsupported ? t.autoMpNotSupported : t.autoMpTitle;
    }

    const statLikes = document.getElementById('stat-likes');
    if (statLikes) statLikes.textContent = data.likedCount || 0;

    const statFollowings = document.getElementById('stat-followings');
    if (statFollowings) statFollowings.textContent = data.followingCount || 0;

    const totalDislikes = Object.keys(data.dislikedTracks || {}).length +
                          Object.keys(data.dislikedArtists || {}).length +
                          Object.keys(data.dislikedGenres || {}).length;
    const statDislikes = document.getElementById('stat-dislikes');
    if (statDislikes) statDislikes.textContent = totalDislikes;

    const plSelect = document.getElementById('pl-select');
    if (plSelect) {
      plSelect.innerHTML = '';
      if (!data.myPlaylists || data.myPlaylists.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = data.isReady ? t.noPlaylistFound : t.playlistSyncing;
        plSelect.appendChild(opt);
      } else {
        data.myPlaylists.forEach(function (pl) {
          const opt = document.createElement('option');
          opt.value = pl.id;
          opt.textContent = pl.title + ' (' + pl.trackCount + t.trackCountSuffix + ')';
          if (String(pl.id) === String(data.targetPlaylistId)) {
            opt.selected = true;
          }
          plSelect.appendChild(opt);
        });

        plSelect.onchange = function (e) {
          const plVal = e.target.value;
          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ targetPlaylistId: plVal });
          }
          if (tabId) {
            chrome.tabs.sendMessage(tabId, {
              target: 'SC_FRESH_STATION',
              action: 'SET_TARGET_PLAYLIST',
              targetId: plVal
            });
          }
        };
      }
    }

    // レビュー（レーティング）促進バナーの表示判定
    checkRatingPrompt(data.stats);
  }

  // ---- レビュー促進バナー制御 ----
  async function checkRatingPrompt(stats) {
    if (!chrome.storage || !chrome.storage.local) return;
    try {
      const stored = await chrome.storage.local.get(['hasRated', 'rateDismissed', 'rateSnoozeUntil', 'rate100Shown']);
      if (stored && stored.hasRated) return; // hasRated なら出さない
      const skips = (stats && stats.totalSkips) || 0;
      const plAdds = (stats && stats.totalPlaylistAdds) || 0;
      const noPlays = (stats && stats.totalNoPlays) || 0;

      let shouldShow = false;
      // 100曲NoPlay達成時: rateDismissed・スヌーズ中でも1回だけ出す（rate100Shownで記録）
      if (noPlays >= 100 && (!stored || !stored.rate100Shown)) {
        shouldShow = true;
        chrome.storage.local.set({ rate100Shown: true });
      } else if (!stored || (!stored.rateDismissed && (!stored.rateSnoozeUntil || Date.now() >= stored.rateSnoozeUntil))) {
        // 通常の判定基準: 累計30曲スキップ達成 または プレイリスト追加5回以上
        if (skips >= 30 || plAdds >= 5) {
          shouldShow = true;
        }
      }

      if (shouldShow) {
        const banner = document.getElementById('rate-banner');
        if (banner) banner.style.display = 'block';
      }
    } catch (e) {}
  }

  const btnRateNow = document.getElementById('btn-rate-now');
  if (btnRateNow) {
    btnRateNow.addEventListener('click', function () {
      // ストアから入れた拡張の ID はストアの ID と同じ。Edge は Edge アドオンストア、それ以外は Chrome ウェブストアへ
      const extId = (chrome.runtime && chrome.runtime.id) || '';
      const isEdge = navigator.userAgent.indexOf(" Edg/") !== -1;
      const url = isEdge
        ? (extId ? ('https://microsoftedge.microsoft.com/addons/detail/' + extId) : 'https://microsoftedge.microsoft.com/addons/')
        : (extId ? ('https://chromewebstore.google.com/detail/' + extId + '/reviews') : 'https://chromewebstore.google.com/');
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: url });
      } else {
        window.open(url, '_blank');
      }
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ hasRated: true });
      }
      const banner = document.getElementById('rate-banner');
      if (banner) banner.style.display = 'none';
    });
  }

  const btnRateLater = document.getElementById('btn-rate-later');
  if (btnRateLater) {
    btnRateLater.addEventListener('click', function () {
      // 「あとで」は 7 日間出さない（毎回ポップアップを開くたびに出るのを防ぐ）
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ rateSnoozeUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      }
      const banner = document.getElementById('rate-banner');
      if (banner) banner.style.display = 'none';
    });
  }

  const btnRateDismiss = document.getElementById('btn-rate-dismiss');
  if (btnRateDismiss) {
    btnRateDismiss.addEventListener('click', function () {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ rateDismissed: true });
      }
      const banner = document.getElementById('rate-banner');
      if (banner) banner.style.display = 'none';
    });
  }
});
