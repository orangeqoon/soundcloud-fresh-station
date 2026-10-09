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

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', function () {
      currentLang = langSelect.value;
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
    const btnStation = document.getElementById('btn-station');
    btnStation.textContent = t.btnStation;
    btnStation.title = t.btnStationTitle;

    document.getElementById('auto-mp-label-wrapper').title = t.autoMpTitle;
    document.getElementById('auto-mp-text').textContent = t.autoMpLabel;

    document.getElementById('label-vol-control').textContent = t.volControl;
    const btnMute = document.getElementById('btn-vol-mute');
    btnMute.title = t.volMute;
    document.getElementById('vol-slider').title = t.volSliderTitle;

    document.getElementById('label-discovery-title').textContent = t.discoveryMode;

    document.getElementById('label-target-pl').textContent = t.targetPlaylist;
    document.getElementById('sync-btn').textContent = t.btnSync;

    document.getElementById('label-dislike-section').textContent = t.dislikeSection;
    document.getElementById('btn-export-dislikes').textContent = t.btnExportDislikes;
    document.getElementById('btn-import-dislikes').textContent = t.btnImportDislikes;

    document.getElementById('label-advanced').textContent = t.advancedSettings;
    document.getElementById('btn-copy-log').textContent = t.btnCopyLog;
    document.getElementById('log-hint').textContent = t.logHint;

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

  // ---- リスト（R3 除外した作者 / R6 後で聴く） ----
  let listTab = 'hated';
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

  function renderLists() {
    const body = document.getElementById('list-body');
    if (!body) return;
    const q = (document.getElementById('list-search').value || '').trim().toLowerCase();
    document.getElementById('tab-hated').textContent = t.tabHated;
    document.getElementById('tab-later').textContent = t.tabLater;
    document.getElementById('tab-hated').classList.toggle('active', listTab === 'hated');
    document.getElementById('tab-later').classList.toggle('active', listTab === 'later');
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
    } else {
      rows = laterList.filter(function (x) { return !q || String(x.name || '').toLowerCase().indexOf(q) !== -1; }).map(function (x) {
        return function () {
          const href = x.permalink ? 'https://soundcloud.com/' + encodeURIComponent(x.permalink) + '/tracks' : '';
          const d = x.addedAt ? new Date(x.addedAt).toLocaleDateString() : '';
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

  // 診断ログのコピー
  const copyLogBtn = document.getElementById('btn-copy-log');
  if (copyLogBtn) {
    copyLogBtn.addEventListener('click', function () {
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'GET_DIAG_LOG' }, async function (response) {
        const hint = document.getElementById('log-hint');
        if (chrome.runtime.lastError || !response || !response.text) {
          hint.textContent = t.logCopyFailed;
          return;
        }
        try {
          await navigator.clipboard.writeText(response.text);
          hint.textContent = t.logCopied;
        } catch (e) {
          hint.textContent = t.logCopyFailed;
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

  // ステーション開始ボタン
  const stationBtn = document.getElementById('btn-station');
  if (stationBtn) {
    stationBtn.addEventListener('click', function () {
      stationBtn.disabled = true;
      stationBtn.textContent = t.btnSyncing;
      chrome.tabs.sendMessage(tab.id, {
        target: 'SC_FRESH_STATION',
        action: 'START_STATION'
      }, function (res) {
        stationBtn.disabled = false;
        stationBtn.textContent = t.btnStation;
        setTimeout(function () { window.close(); }, 350);
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
      }, function () { void chrome.runtime.lastError; });
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

  // 音量コントロール
  const volSlider = document.getElementById('vol-slider');
  const volText = document.getElementById('vol-display-text');
  const volMuteBtn = document.getElementById('btn-vol-mute');

  if (volSlider) {
    volSlider.addEventListener('input', function (e) {
      const val = parseFloat(e.target.value);
      if (volText) volText.textContent = Math.round(val) + '%';
      if (volMuteBtn) {
        volMuteBtn.textContent = val === 0 ? '🔇' : (val < 50 ? '🔉' : '🔊');
      }
      chrome.tabs.sendMessage(tab.id, {
        target: 'SC_FRESH_STATION',
        action: 'SET_VOLUME',
        volume: val / 100
      });
    });
  }

  if (volMuteBtn) {
    volMuteBtn.addEventListener('click', function () {
      chrome.tabs.sendMessage(tab.id, {
        target: 'SC_FRESH_STATION',
        action: 'TOGGLE_MUTE'
      }, function () {
        setTimeout(requestData, 200);
      });
    });
  }

  function updateDiscoveryUI(enabled) {
    const toggle = document.getElementById('discovery-toggle');
    const card = document.getElementById('discovery-card');
    const desc = document.getElementById('discovery-desc');
    if (toggle && toggle.checked !== enabled) toggle.checked = enabled;
    if (card) card.classList.toggle('off', !enabled);
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
      if (data.autoPipSupported === false) {
        autoMpToggleEl.disabled = true;
        autoMpToggleEl.parentElement.title = t.autoMpNotSupported;
      }
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

    // 音量同期
    if (typeof data.volume === 'number') {
      const volSlider = document.getElementById('vol-slider');
      const volText = document.getElementById('vol-display-text');
      const volMuteBtn = document.getElementById('btn-vol-mute');
      const pct = Math.round(data.volume * 100);

      if (volSlider && document.activeElement !== volSlider) {
        volSlider.value = pct;
      }
      if (volText) {
        volText.textContent = pct + '%';
      }
      if (volMuteBtn) {
        volMuteBtn.textContent = data.volume === 0 ? '🔇' : (data.volume < 0.5 ? '🔉' : '🔊');
      }
    }
  }
});
