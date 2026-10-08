// Internationalization (i18n) Dictionary for FreshDig
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FreshDigI18n = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const translations = {
    ja: {
      appName: 'FreshDig',
      notConnected: 'SoundCloud未接続',
      notLoggedIn: '⚠️ SoundCloud未ログイン',
      notLoggedInDesc: 'SoundCloudにログインすると、Likes/フォローの除外やプレイリスト追加が使えます',
      connecting: '🔄 アカウント接続中...',
      connectingDesc: '接続できない場合は [🔄 同期] を押すか、SoundCloudを再読み込みしてください',
      connectedReady: 'アカウント接続済み・稼働中',
      connectedSyncing: 'アカウント接続済み・同期中',
      reloadRequired: '⚠️ SoundCloudタブを再読み込みしてください',
      reloadRequiredDesc: '拡張機能の更新後は、開いているSoundCloudタブの再読み込みが必要です',
      openSCTab: 'SoundCloudタブを開いてください',
      loadingSC: 'SoundCloud読込中...',

      // Buttons & Controls
      btnMiniPlayer: '🪟 ミニプレイヤー',
      btnStation: '📻 ステーション開始',
      btnStationTitle: '現在再生中の曲のステーションを開始',
      autoMpLabel: '別のタブを開いたらミニプレイヤーを自動表示',
      autoMpTitle: '音楽の再生中に別のタブへ切り替えると、ミニプレイヤーが自動で表示されます（Edge / Chrome の自動ピクチャー イン ピクチャー機能）',
      autoMpNotSupported: 'このブラウザはミニプレイヤーの自動表示に対応していません',

      volControl: '🔊 音量コントロール',
      volMute: 'ミュート切替',
      volSliderTitle: '音量調整',

      discoveryMode: '🔍 発掘モード',
      discoveryOnDesc: '知っている曲（Likes・フォロー中・Dislike）を自動スキップ',
      discoveryOffDesc: 'OFF：自動スキップせず SoundCloud 通常再生',

      targetPlaylist: '➕ ワンクリック追加先プレイリスト',
      btnSync: '🔄 同期',
      btnSyncing: '⏳ 同期中...',
      noPlaylistFound: '（プレイリストが見つかりません）',
      playlistSyncing: '同期中... [🔄 同期] を押してください',
      trackCountSuffix: '曲',
      skipToastPrefix: 'スキップ',
      skipReasonDisliked: 'Dislike登録した曲',
      skipReasonHated: '除外した作者',
      skipReasonGenre: '除外したジャンル',
      skipReasonOwn: '自分の曲',
      skipReasonLiked: 'ライク済み',
      skipReasonFollowing: 'フォロー中のアーティスト',
      skipReasonManyFollowers: 'フォロワーが多い作者',
      skipReasonManyTracks: '投稿曲が多い作者',
      skipReasonManyPlays: '再生回数が多い曲',
      skipReasonOldTrack: '古い曲',
      robotBanner: 'SoundCloud のロボット確認が出ています。ページで確認を済ませてください',
      robotShort: 'ロボット確認中',
      advancedSettings: '⚙ 詳細設定',
      btnCopyLog: '📋 診断ログをコピー',
      logCopied: 'コピーしました。止まった時の状況と一緒に貼ってください',
      logCopyFailed: 'コピーできませんでした',
      logHint: '音が止まった直後に押して、貼り付けてください',

      dislikeSection: '🚫 Dislike曲のプレイリスト連携',
      btnExportDislikes: '📤 SCへ書き出し',
      btnExportingDislikes: '⏳ 書き出し中...',
      btnImportDislikes: '📥 SCから読み込み',
      btnImportingDislikes: '⏳ 読み込み中...',
      exportingMsg: 'SoundCloudへプレイリストを作成/更新しています...',
      importingMsg: 'SoundCloudプレイリストからDislike曲を取得中...',
      commErrorMsg: 'SoundCloudとの通信に失敗しました。ページを再読み込みしてください。',

      statLikes: '除外Likes',
      statFollow: '除外Follow',
      statDislike: 'Dislike',

      langLabel: '🌐 言語',

      // In-page Player Bar
      barStationTitle: '📻 この曲のステーションを開始',
      barDislikeTitle: '👎 Dislike (この曲だけ二度と流さない＆スキップ)',
      barHateTitle: '🚫 Hate (この作者の曲すべてを二度と流さない＆スキップ)',
      barMiniPlayerTitle: '🪟 ミニプレイヤー (最前面ウィンドウで浮遊操作)',
      barDiscoveryOffTitle: '🔍 発掘モード OFF（クリックで ON：知っている曲を自動スキップ）',
      barDiscoveryOnTitle: '🔍 発掘モード ON（クリックで OFF：SoundCloud 通常再生）',
      barFollowingModeTitle: '👥 フォロー新曲モード (クリックで「発掘モード」へ切替)',

      // Mini Player
      mpTitle: 'FreshDig - アーティスト発掘ミニプレイヤー',
      mpPromptOpen: '🪟 ここをクリックしてミニプレイヤーを開く',
      mpLoadingTrack: '曲を読み込み中...',
      mpStatusWaiting: '再生待機中',
      mpStatusDigging: '発掘中',
      mpFollowBtn: '👤 フォロー',
      mpFollowBtnTitle: 'アーティストをフォロー',
      mpStationBtn: '📻 ステーション',
      mpStationBtnTitle: 'この曲のステーションを開始',
      mpPrevTitle: '前の曲',
      mpPlayTitle: '再生 / 一時停止',
      mpNextTitle: '次の曲',
      mpLikeTitle: 'いいね (Like)',
      mpRepostTitle: 'リポスト (Repost)',
      mpAddPlTitle: 'プレイリストに追加',
      mpDislikeTitle: 'この曲だけ除外＆スキップ',
      mpHateTitle: 'この作者の曲全除外＆スキップ',
      mpToastDislike: '👎 曲を除外してスキップ',
      mpToastHate: '🚫 作者を除外してスキップ',
      mpToastAddedPl: '➕ プレイリストに追加しました',
      mpToastRemovedPl: '➖ プレイリストから解除しました',
      mpToastLiked: '❤️ いいねしました',
      mpToastUnliked: '🤍 いいねを解除しました',
      mpToastReposted: '🔁 リポストしました',
      mpToastUnreposted: '↩️ リポストを解除しました',
      mpToastFollowed: '👤 フォローしました',
      mpToastUnfollowed: '👤 フォローを解除しました',
      mpStatusToggleOff: 'クリックで発掘モードを OFF（SoundCloud 通常再生）',
      mpStatusToggleOn: 'クリックで発掘モードを ON（知っている曲を自動スキップ）',

      // Playlist picker popup
      pickerTitle: '➕ ワンクリック追加先を選択',
      pickerCancel: 'キャンセル'
    },
    en: {
      appName: 'FreshDig',
      notConnected: 'SoundCloud Not Connected',
      notLoggedIn: '⚠️ Not Logged In',
      notLoggedInDesc: 'Log in to SoundCloud to skip Liked/Followed tracks and enable 1-click playlist add.',
      connecting: '🔄 Connecting Account...',
      connectingDesc: 'If connection fails, click [🔄 Sync] or reload SoundCloud.',
      connectedReady: 'Account Connected & Active',
      connectedSyncing: 'Account Connected & Syncing',
      reloadRequired: '⚠️ Please reload SoundCloud tab',
      reloadRequiredDesc: 'After extension update, the open SoundCloud tab must be reloaded.',
      openSCTab: 'Please open a SoundCloud tab',
      loadingSC: 'Loading SoundCloud...',

      // Buttons & Controls
      btnMiniPlayer: '🪟 Mini Player',
      btnStation: '📻 Start Station',
      btnStationTitle: 'Start station from currently playing track',
      autoMpLabel: 'Auto show Mini Player when switching tabs',
      autoMpTitle: 'Automatically opens Mini Player when you switch to another tab while music is playing (Document PiP)',
      autoMpNotSupported: 'This browser does not support automatic picture-in-picture',

      volControl: '🔊 Volume Control',
      volMute: 'Toggle Mute',
      volSliderTitle: 'Volume Slider',

      discoveryMode: '🔍 Discovery Mode',
      discoveryOnDesc: 'Auto-skips known tracks (Likes, Followed, Dislikes)',
      discoveryOffDesc: 'OFF: Normal SoundCloud playback without skipping',

      targetPlaylist: '➕ 1-Click Target Playlist',
      btnSync: '🔄 Sync',
      btnSyncing: '⏳ Syncing...',
      noPlaylistFound: '(No playlists found)',
      playlistSyncing: 'Syncing... Please click [🔄 Sync]',
      trackCountSuffix: 'tracks',
      skipToastPrefix: 'Skipped',
      skipReasonDisliked: 'Disliked track',
      skipReasonHated: 'Excluded artist',
      skipReasonGenre: 'Excluded genre',
      skipReasonOwn: 'Your own track',
      skipReasonLiked: 'Already liked',
      skipReasonFollowing: 'Artist you follow',
      skipReasonManyFollowers: 'Artist with many followers',
      skipReasonManyTracks: 'Artist with many tracks',
      skipReasonManyPlays: 'Track with many plays',
      skipReasonOldTrack: 'Old track',
      robotBanner: 'SoundCloud is showing a robot check. Please complete it on the page.',
      robotShort: 'Robot check',
      advancedSettings: '⚙ Advanced settings',
      btnCopyLog: '📋 Copy diagnostic log',
      logCopied: 'Copied. Paste it together with what happened.',
      logCopyFailed: 'Could not copy',
      logHint: 'Press right after the sound stops, then paste it',

      dislikeSection: '🚫 Sync Dislikes with SC Playlist',
      btnExportDislikes: '📤 Export to SC',
      btnExportingDislikes: '⏳ Exporting...',
      btnImportDislikes: '📥 Import from SC',
      btnImportingDislikes: '⏳ Importing...',
      exportingMsg: 'Creating / updating playlist on SoundCloud...',
      importingMsg: 'Fetching disliked tracks from SoundCloud playlist...',
      commErrorMsg: 'Failed to communicate with SoundCloud. Please reload the page.',

      statLikes: 'Skip Likes',
      statFollow: 'Skip Follows',
      statDislike: 'Dislikes',

      langLabel: '🌐 Language',

      // In-page Player Bar
      barStationTitle: '📻 Start station from this track',
      barDislikeTitle: '👎 Dislike (Skip & blacklist this track)',
      barHateTitle: '🚫 Hate (Skip & blacklist all tracks by this artist)',
      barMiniPlayerTitle: '🪟 Mini Player (Floating always-on-top window)',
      barDiscoveryOffTitle: '🔍 Discovery Mode OFF (Click to turn ON: skip known tracks)',
      barDiscoveryOnTitle: '🔍 Discovery Mode ON (Click to turn OFF: standard playback)',
      barFollowingModeTitle: '👥 Following Only Mode (Click to switch to Discovery Mode)',

      // Mini Player
      mpTitle: 'FreshDig - Discovery Mini Player',
      mpPromptOpen: '🪟 Click here to open Mini Player',
      mpLoadingTrack: 'Loading track...',
      mpStatusWaiting: 'Standby',
      mpStatusDigging: 'Digging',
      mpFollowBtn: '👤 Follow',
      mpFollowBtnTitle: 'Follow artist',
      mpStationBtn: '📻 Station',
      mpStationBtnTitle: 'Start station from this track',
      mpPrevTitle: 'Previous track',
      mpPlayTitle: 'Play / Pause',
      mpNextTitle: 'Next track',
      mpLikeTitle: 'Like',
      mpRepostTitle: 'Repost',
      mpAddPlTitle: 'Add to playlist',
      mpDislikeTitle: 'Skip & blacklist this track',
      mpHateTitle: 'Skip & blacklist all tracks by artist',
      mpToastDislike: '👎 Track blacklisted & skipped',
      mpToastHate: '🚫 Artist blacklisted & skipped',
      mpToastAddedPl: '➕ Added to playlist',
      mpToastRemovedPl: '➖ Removed from playlist',
      mpToastLiked: '❤️ Liked track',
      mpToastUnliked: '🤍 Unliked track',
      mpToastReposted: '🔁 Reposted track',
      mpToastUnreposted: '↩️ Un-reposted track',
      mpToastFollowed: '👤 Followed artist',
      mpToastUnfollowed: '👤 Unfollowed artist',
      mpStatusToggleOff: 'Click to turn Discovery OFF (Standard playback)',
      mpStatusToggleOn: 'Click to turn Discovery ON (Skip known tracks)',

      // Playlist picker popup
      pickerTitle: '➕ Select 1-Click Target Playlist',
      pickerCancel: 'Cancel'
    }
  };

  function resolveLanguage(langPref) {
    if (langPref === 'ja' || langPref === 'en') return langPref;
    // auto detect from browser/navigator
    try {
      const navLang = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en';
      return navLang.toLowerCase().startsWith('ja') ? 'ja' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function getTexts(lang) {
    const code = resolveLanguage(lang);
    return translations[code] || translations.en;
  }

  return {
    translations: translations,
    resolveLanguage: resolveLanguage,
    getTexts: getTexts
  };
});
