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
      if (chrome.runtime.lastError || !response) {
        document.getElementById('conn-badge').textContent = 'SoundCloud読込中...';
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
        setTimeout(function () {
          syncBtn.textContent = '🔄 今すぐ同期';
          requestData();
        }, 1500);
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
});

function renderData(tabId, data) {
  const badge = document.getElementById('conn-badge');
  if (badge) {
    badge.textContent = data.isReady ? '稼働中' : '同期中...';
    badge.style.color = data.isReady ? '#00e676' : '#ffb300';
  }

  const modeSelect = document.getElementById('mode-select');
  if (modeSelect) {
    modeSelect.value = data.playbackMode || 'DISCOVERY';
    modeSelect.onchange = function (e) {
      chrome.tabs.sendMessage(tabId, {
        target: 'SC_FRESH_STATION',
        action: 'SET_PLAYBACK_MODE',
        mode: e.target.value
      });
    };
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
        chrome.tabs.sendMessage(tabId, {
          target: 'SC_FRESH_STATION',
          action: 'SET_TARGET_PLAYLIST',
          targetId: e.target.value
        });
      };
    }
  }
}
