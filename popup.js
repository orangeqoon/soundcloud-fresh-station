document.addEventListener('DOMContentLoaded', async function () {
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
    document.getElementById('conn-badge').textContent = 'SoundCloudタブを開いてください';
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
        // 拡張機能のインストール/更新前から開いていたタブにはスクリプトが入っていない
        badge.textContent = '⚠️ SoundCloudタブを再読み込みしてください';
        badge.style.color = '#ffb300';
        badge.title = '拡張機能の更新後は、開いているSoundCloudタブの再読み込みが必要です';
        return;
      }
      if (!response) {
        badge.textContent = 'SoundCloud読込中...';
        return;
      }
      renderData(tab.id, response);
    });
  }

  requestData();

  // 同期ボタン
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', function () {
      syncBtn.textContent = '⏳ 同期中...';
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'FORCE_SYNC' }, function () {
        void chrome.runtime.lastError;
        syncBtn.textContent = '🔄 同期';
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
      exportBtn.textContent = '⏳ 書き出し中...';
      showSyncMsg('SoundCloudへプレイリストを作成/更新しています...', false);
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'EXPORT_DISLIKES' }, function (res) {
        exportBtn.disabled = false;
        exportBtn.textContent = '📤 SCへ書き出し';
        if (chrome.runtime.lastError || !res) {
          showSyncMsg('SoundCloudとの通信に失敗しました。ページを再読み込みしてください。', true);
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
      importBtn.textContent = '⏳ 読み込み中...';
      showSyncMsg('SoundCloudプレイリストからDislike曲を取得中...', false);
      chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'IMPORT_DISLIKES' }, function (res) {
        importBtn.disabled = false;
        importBtn.textContent = '📥 SCから読み込み';
        if (chrome.runtime.lastError || !res) {
          showSyncMsg('SoundCloudとの通信に失敗しました。ページを再読み込みしてください。', true);
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
      chrome.tabs.sendMessage(tab.id, {
        target: 'SC_FRESH_STATION',
        action: 'TOGGLE_MINI_PLAYER'
      });
      window.close();
    });
  }

  // ステーション開始ボタン
  const stationBtn = document.getElementById('btn-station');
  if (stationBtn) {
    stationBtn.addEventListener('click', function () {
      stationBtn.disabled = true;
      stationBtn.textContent = '⏳ 開始中...';
      chrome.tabs.sendMessage(tab.id, {
        target: 'SC_FRESH_STATION',
        action: 'START_STATION'
      }, function (res) {
        stationBtn.disabled = false;
        stationBtn.textContent = '📻 ステーション開始';
        setTimeout(function () { window.close(); }, 350);
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
});

function updateDiscoveryUI(enabled) {
  const toggle = document.getElementById('discovery-toggle');
  const card = document.getElementById('discovery-card');
  const desc = document.getElementById('discovery-desc');
  if (toggle && toggle.checked !== enabled) toggle.checked = enabled;
  if (card) card.classList.toggle('off', !enabled);
  if (desc) {
    desc.textContent = enabled
      ? '知っている曲（Likes・フォロー中・Dislike）を自動スキップ'
      : 'OFF：自動スキップせず SoundCloud 通常再生';
  }
}

function renderData(tabId, data) {
  const badge = document.getElementById('conn-badge');
  if (badge) {
    if (!data.loggedIn) {
      badge.textContent = '⚠️ SoundCloud未ログイン';
      badge.style.color = '#ff5252';
      badge.title = 'SoundCloudにログインすると、Likes/フォローの除外やプレイリスト追加が使えます';
    } else if (data.accountName) {
      badge.textContent = '✅ @' + data.accountName;
      badge.style.color = data.isReady ? '#00e676' : '#ffb300';
      badge.title = data.isReady ? 'アカウント接続済み・稼働中' : 'アカウント接続済み・同期中';
    } else {
      badge.textContent = '🔄 アカウント接続中...';
      badge.style.color = '#ffb300';
      badge.title = '接続できない場合は [🔄 同期] を押すか、SoundCloudを再読み込みしてください';
    }
  }

  updateDiscoveryUI(data.discoveryEnabled !== false);

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
      opt.textContent = data.isReady ? '（プレイリストが見つかりません）' : '同期中... [🔄 同期] を押してください';
      plSelect.appendChild(opt);
    } else {
      data.myPlaylists.forEach(function (pl) {
        const opt = document.createElement('option');
        opt.value = pl.id;
        opt.textContent = pl.title + ' (' + pl.trackCount + '曲)';
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
        chrome.tabs.sendMessage(tabId, {
          target: 'SC_FRESH_STATION',
          action: 'SET_TARGET_PLAYLIST',
          targetId: plVal
        });
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
