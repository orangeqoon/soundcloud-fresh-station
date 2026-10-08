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

    document.getElementById('label-stat-likes').textContent = t.statLikes;
    document.getElementById('label-stat-follows').textContent = t.statFollow;
    document.getElementById('label-stat-dislikes').textContent = t.statDislike;
  }

  applyStaticTranslations();

  let tab = null;
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
