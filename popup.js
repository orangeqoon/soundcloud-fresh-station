document.addEventListener('DOMContentLoaded', async function () {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('active'); });
      tabContents.forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      document.getElementById(t.dataset.target).classList.add('active');
    });
  });

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

  chrome.tabs.sendMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'GET_DATA' }, function (response) {
    if (chrome.runtime.lastError || !response) {
      document.getElementById('conn-badge').textContent = '1曲再生すると同期されます';
      return;
    }
    renderData(tab.id, response);
  });
});

function renderData(tabId, data) {
  const badge = document.getElementById('conn-badge');
  badge.textContent = data.isReady ? '稼働中' : '準備中 (1曲再生で同期)';
  badge.style.color = data.isReady ? '#00e676' : '#ffb300';

  const modeSelect = document.getElementById('mode-select');
  if (modeSelect) {
    modeSelect.value = data.playbackMode || 'DISCOVERY';
    modeSelect.addEventListener('change', function (e) {
      chrome.tabs.sendMessage(tabId, {
        target: 'SC_FRESH_STATION',
        action: 'SET_PLAYBACK_MODE',
        mode: e.target.value
      });
      updateStatsLabels(e.target.value);
    });
    updateStatsLabels(data.playbackMode || 'DISCOVERY');
  }

  document.getElementById('stat-likes').textContent = data.likedCount || 0;
  document.getElementById('stat-followings').textContent = data.followingCount || 0;

  const totalDislikes = Object.keys(data.dislikedTracks || {}).length +
                        Object.keys(data.dislikedArtists || {}).length +
                        Object.keys(data.dislikedGenres || {}).length;
  document.getElementById('stat-dislikes').textContent = totalDislikes;

  const plSelect = document.getElementById('pl-select');
  plSelect.innerHTML = '';
  if (!data.myPlaylists || data.myPlaylists.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '1曲再生すると同期されます';
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

    plSelect.addEventListener('change', function (e) {
      const newId = e.target.value;
      chrome.tabs.sendMessage(tabId, {
        target: 'SC_FRESH_STATION',
        action: 'SET_TARGET_PLAYLIST',
        targetId: newId
      });
    });
  }

  const listArtists = document.getElementById('list-artists');
  listArtists.innerHTML = '';
  const artistEntries = Object.entries(data.dislikedArtists || {});
  if (artistEntries.length === 0) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.textContent = '除外されたアーティストはいません';
    listArtists.appendChild(d);
  } else {
    artistEntries.forEach(function (entry) {
      const id = entry[0];
      const item = entry[1];
      const li = document.createElement('li');
      li.innerHTML = '<div class="item-meta"><div><strong>' + escapeHtml(item.name || id) + '</strong></div><div class="item-sub">登録日: ' + (item.date || '-') + '</div></div><button class="del-btn" title="除外を解除">✕</button>';
      li.querySelector('.del-btn').addEventListener('click', function () {
        chrome.tabs.sendMessage(tabId, { target: 'SC_FRESH_STATION', action: 'REMOVE', targetType: 'artist', targetId: id });
        li.remove();
      });
      listArtists.appendChild(li);
    });
  }

  const listGenres = document.getElementById('list-genres');
  listGenres.innerHTML = '';
  const genreEntries = Object.entries(data.dislikedGenres || {});
  if (genreEntries.length === 0) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.textContent = '除外されたジャンルはいません';
    listGenres.appendChild(d);
  } else {
    genreEntries.forEach(function (entry) {
      const id = entry[0];
      const item = entry[1];
      const li = document.createElement('li');
      li.innerHTML = '<div class="item-meta"><div><strong>' + escapeHtml(item.display || id) + '</strong></div><div class="item-sub">登録日: ' + (item.date || '-') + '</div></div><button class="del-btn" title="除外を解除">✕</button>';
      li.querySelector('.del-btn').addEventListener('click', function () {
        chrome.tabs.sendMessage(tabId, { target: 'SC_FRESH_STATION', action: 'REMOVE', targetType: 'genre', targetId: id });
        li.remove();
      });
      listGenres.appendChild(li);
    });
  }

  const listTracks = document.getElementById('list-tracks');
  listTracks.innerHTML = '';
  const trackEntries = Object.entries(data.dislikedTracks || {});
  if (trackEntries.length === 0) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.textContent = '除外された曲はいません';
    listTracks.appendChild(d);
  } else {
    trackEntries.forEach(function (entry) {
      const id = entry[0];
      const item = entry[1];
      const li = document.createElement('li');
      li.innerHTML = '<div class="item-meta"><div><strong>' + escapeHtml(item.title || id) + '</strong></div><div class="item-sub">' + escapeHtml(item.artist || 'Unknown') + ' / ' + escapeHtml(item.genre || '未分類') + ' (' + (item.date || '-') + ')</div></div><button class="del-btn" title="除外を解除">✕</button>';
      li.querySelector('.del-btn').addEventListener('click', function () {
        chrome.tabs.sendMessage(tabId, { target: 'SC_FRESH_STATION', action: 'REMOVE', targetType: 'track', targetId: id });
        li.remove();
      });
      listTracks.appendChild(li);
    });
  }
}

function updateStatsLabels(mode) {
  const lbl1 = document.getElementById('stat-label-1');
  const lbl2 = document.getElementById('stat-label-2');
  if (mode === 'FOLLOWING_NEW') {
    if (lbl1) lbl1.textContent = '登録Likes';
    if (lbl2) lbl2.textContent = '対象Follow';
  } else {
    if (lbl1) lbl1.textContent = '除外Likes';
    if (lbl2) lbl2.textContent = '除外Follow';
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
