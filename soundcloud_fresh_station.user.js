// ==UserScript==
// @name         FreshDig for SoundCloud - 新アーティスト自動発掘
// @version      1.9.13
// @description  知ってる曲ゼロ！未試聴の新アーティストだけを連続再生・ワンクリック追加・Dislike除外・浮遊ミニプレイヤー
// @author       Antigravity
// @match        https://soundcloud.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

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
      skipReasonDisliked: '不再生の曲',
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
      advancedSettings: '⚙ Dig Config',
      btnCopyLog: '📋 診断ログをコピー',
      logCopied: 'コピーしました。止まった時の状況と一緒に貼ってください',
      logCopyFailed: 'コピーできませんでした',
      logHint: '音が止まった直後に押して、貼り付けてください',

      dislikeSection: '⏭️ 不再生 (NoPlay) プレイリスト連携',
      btnExportDislikes: '📤 SCへ書き出し',
      btnExportingDislikes: '⏳ 書き出し中...',
      btnImportDislikes: '📥 SCから読み込み',
      btnImportingDislikes: '⏳ 読み込み中...',
      exportingMsg: 'SoundCloudへプレイリストを作成/更新しています...',
      importingMsg: 'SoundCloudプレイリストからDislike曲を取得中...',
      commErrorMsg: 'SoundCloudとの通信に失敗しました。ページを再読み込みしてください。',

      statLikes: '除外Likes',
      statFollow: '除外Follow',
      statDislike: 'NoPlay',

      langLabel: '🌐 言語',

      // In-page Player Bar
      barStationTitle: '📻 この曲のステーションを開始',
      barDislikeTitle: '⏭️ 不再生 (NoPlay: この曲を今後再生せずスキップ)',
      barHateTitle: '🤬 作者除外 (この作者の曲すべてを今後再生せずスキップ)',
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
      mpDislikeTitle: '不再生 (NoPlay) & スキップ',
      mpHateTitle: '作者除外 & スキップ',
      mpToastDislike: '⏭️ 不再生に登録してスキップ',
      mpToastHate: '🤬 作者を除外してスキップ',
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

      // Messages (toasts, tooltips, results)
      m_streakStop: '⚠️ 知っている曲が続いたため、この曲はそのまま再生します',
      m_savedTo: '保存先',
      m_plBtnNoTarget: '➕ プレイリストに一発追加（クリックで保存先を選択）',
      m_plBtnIn: '✔ 「{name}」に追加済み（クリックで外す／右クリックで保存先変更）',
      m_plBtnOut: '➕ 「{name}」に一発追加（もう一度押すと外す／右クリックで保存先変更）',
      m_plFetching: '🔄 プレイリスト一覧を取得中...',
      m_plNoLogin: '⚠️ SoundCloudにログインしていないため、プレイリストを取得できません',
      m_plNone: '⚠️ プレイリストがありません。先にSoundCloudでプレイリストを作成してください',
      m_plTargetSet: '📋 保存先を「{name}」に設定しました！',
      m_noTrackInfo: '⚠️ 再生中の曲情報が取得できません',
      m_loginToken: '⚠️ SoundCloudにログインしてください（認証トークンが見つかりません）',
      m_pickTarget: '📋 追加先を選んでください',
      m_plAborted: '⚠️ プレイリストへの追加を中断しました',
      m_plDefaultName: '指定プレイリスト',
      m_plTargetMissing: '⚠️ 保存先プレイリストが見つかりません。選び直してください',
      m_plNoTargetAbort: '⚠️ 追加先が設定されなかったため中断しました',
      m_authFail: '❌ アカウント認証に失敗しました ({s})。SoundCloudを再読み込み／再ログインしてください',
      m_plFull: '⚠️ 「{name}」は500曲の上限に達しています',
      m_plRemoved: '➖ 「{track}」を「{name}」から外しました',
      m_plAdded: '✅ 「{track}」を「{name}」に追加しました（もう一度押すと外せます）',
      m_plUpdateFail: '❌ プレイリストの更新に失敗しました ({s})',
      m_error: '❌ エラー: {msg}',
      m_errorOcc: 'エラーが発生しました: {msg}',
      m_exLogin: 'SoundCloudにログインしていないため書き出せません。SoundCloudでログインしてから再試行してください。',
      m_exNone: 'エクスポートできるDislike曲がありません（曲IDが取得できた曲のみ書き出せます）。',
      m_connectFail: 'SoundCloudアカウントに接続できませんでした。ページを再読み込みしてください。',
      m_exPlFail: 'Dislikeプレイリストの取得に失敗しました (HTTP {s})',
      m_exUpdated: 'プレイリスト「{name}」に書き出しました（合計 {n} 曲{cap}）',
      m_exCap: '・上限500曲',
      m_exUpdateFail: 'エクスポート更新に失敗しました (HTTP {s})',
      m_exCreated: '非公開プレイリスト「{name}」を作成し、{n} 曲を書き出しました！',
      m_exCreateFail: 'プレイリスト新規作成に失敗しました (HTTP {s})',
      m_imLogin: 'SoundCloudにログインしていないため読み込めません。SoundCloudでログインしてから再試行してください。',
      m_imNotFound: '「{name}」という名前のプレイリストが見つかりませんでした。先に書き出しを行ってください。',
      m_imFail: 'プレイリスト取得失敗 (HTTP {s})',
      m_imEmpty: 'プレイリスト「{name}」には曲がありませんでした。',
      m_imDone: 'プレイリスト「{name}」から {n} 曲を確認し、新たに {c} 件をDislikeリストに追加しました！',
      m_volRestored: '🔊 音量を復元しました ({n}%)',
      m_muted: '🔇 ミュートしました',
      m_unmute: 'ミュート解除',
      m_discOn: '🔍 発掘モード ON（知っている曲を自動スキップ）',
      m_discOff: '⏸ 発掘モード OFF（SoundCloud 通常再生）',
      m_toDiscovery: '🔍 発掘モード（未知のアーティスト）に切替',
      m_toFollowing: '👥 フォロー新曲モード（新曲のみ）に切替',
      m_stOff: '⏸ 発掘 OFF',
      m_stOn: '🔍 発掘 ON',
      m_stFollow: '👥 フォロー新曲',
      m_stationStarted: '📻 ステーションを開始しました！',
      m_stationStartedMsg: 'ステーションを開始しました',
      m_stationLoading: '📻 ステーションを読込中...',
      m_stationPlaying: '📻 ステーションを再生開始しました！',
      m_stationNoTrack: '⚠️ 現在再生中の曲情報を取得できませんでした',
      m_stationNoTrackMsg: '曲情報を取得できませんでした',
      m_repostHead: '🔁 リポスト',
      m_repostPh: '曲へのコメント（任意・{n}文字まで）',
      m_send: '送信',
      m_reposting: '🔁 リポスト中...',
      m_repostFail: '⚠️ リポストに失敗しました ({s})',
      m_repostCapFail: '⚠️ リポストしましたが、コメント投稿に失敗しました ({s})',
      m_repostedCap: '🔁 リポスト＆曲へコメントしました！',
      m_reposted: '🔁 リポストしました！',
      m_commErr: '⚠️ 通信エラーが発生しました',
      m_tabNoReply: '⚠️ 音を出しているタブが応答しません',
      m_noLikeBtn: '⚠️ Likeボタンが見つかりません',
      m_trackLoading: '⚠️ トラック情報を取得中...',
      m_loginPlease: '⚠️ SoundCloudにログインしてください',
      m_unreposting: '🔁 リポスト解除中...',
      m_unrepostFail: '⚠️ リポスト解除に失敗しました ({s})',
      m_artistDefault: 'アーティスト',
      m_artistLoading: '⚠️ アーティストIDを確認中...',
      m_unfollowing: '👤 フォロー解除中...',
      m_following: '👤 フォロー中...',
      m_unfollowed: '👤 {name} のフォローを解除しました',
      m_followed: '👤 {name} をフォローしました！',
      m_followFail: '⚠️ フォロー通信失敗 ({s})',
      m_notPlaying: '未再生',
      m_repostedTip: 'リポスト済み（クリックで解除）',
      m_repostTip: 'リポスト（コメントを付けられます）',
      m_followingLbl: '👤✓ フォロー中',
      m_untitled: '(無題)',

      // Lists (R3, R6)
      m_hateOff: '🤬 「{name}」の除外を解除しました',
      m_hateOnTip: '🤬 除外中（クリックで解除）',
      m_laterAdded: '🧐 「{name}」を後で聴くに保存しました',
      m_laterRemoved: '🧐 「{name}」を後で聴くから外しました',
      m_laterLimit: '⚠️ 後で聴くは500件までです',
      m_laterFail: '⚠️ 後で聴くを保存できませんでした',
      m_laterAddTip: '🧐 後で聴く（この作者を保存）',
      m_laterRemoveTip: '🧐 保存済み（クリックで外す）',
      m_profileTag: '🤬 FreshDig で作者除外中',
      m_profileUnban: '解除',
      listsTitle: '📚 リスト',
      tabHated: '🤬 作者除外',
      tabLater: '🧐 後で聴く',
      listSearch: '検索',
      listMore: 'もっと見る',
      listUnban: '解除 ✕',
      listLaterDelete: '✕ 削除',
      listEmpty: '(まだありません)',
      listNeedTab: 'SoundCloudのタブを開くと一覧が出ます',
      listFrom: 'きっかけ',

      // Freshness filter (R10)
      freshTitle: '✨ フレッシュさで飛ばす（発掘モードのとき）',
      freshFollowersPre: 'フォロワーが',
      freshFollowersPost: '人より多い作者を飛ばす',
      freshTracksPre: '投稿曲が',
      freshTracksPost: '曲より多い作者を飛ばす',
      freshPlaysPre: '再生回数が',
      freshPlaysPost: '回より多い曲を飛ばす',
      freshAgePre: '投稿から',
      freshAgePost: '日より古い曲を飛ばす',
      freshHint: '分からないときは飛ばしません。作者の数字は7日間保存します。',

      // Playlist picker popup
      pickerTitle: '➕ ワンクリック追加先を選択',
      pickerCancel: 'キャンセル',
      // Rating prompt
      ratePromptTitle: '🌟 FreshDig で新しい音楽は見つかりましたか？',
      ratePromptDesc: 'この拡張機能がSoundCloud利用を促進すると思っていただけたら、Chromeストアで評価やご意見をお聞かせください！新しいアーティストの励みとなる機能を追加していきます。',
      btnRateNow: '⭐ レビューを書く',
      btnRateLater: 'あとで',
      btnRateDismiss: '閉じる',

      // Multi-playlist
      m_exMultiDone: '連番プレイリスト「{name}」を含む {c} 件のプレイリストに合計 {n} 曲を書き出しました！',
      m_imMultiDone: '{c} 個の NoPlay プレイリストから合計 {n} 曲を確認し、新たに {added} 件を追加しました！',

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
      skipReasonDisliked: 'NoPlay track',
      skipReasonHated: 'Blocked artist',
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
      advancedSettings: '⚙ Dig Config',
      btnCopyLog: '📋 Copy diagnostic log',
      logCopied: 'Copied. Paste it together with what happened.',
      logCopyFailed: 'Could not copy',
      logHint: 'Press right after the sound stops, then paste it',

      dislikeSection: '⏭️ Sync NoPlay with SC Playlist',
      btnExportDislikes: '📤 Export to SC',
      btnExportingDislikes: '⏳ Exporting...',
      btnImportDislikes: '📥 Import from SC',
      btnImportingDislikes: '⏳ Importing...',
      exportingMsg: 'Creating / updating playlist on SoundCloud...',
      importingMsg: 'Fetching disliked tracks from SoundCloud playlist...',
      commErrorMsg: 'Failed to communicate with SoundCloud. Please reload the page.',

      statLikes: 'Skip Likes',
      statFollow: 'Skip Follows',
      statDislike: 'NoPlay',

      langLabel: '🌐 Language',

      // In-page Player Bar
      barStationTitle: '📻 Start station from this track',
      barDislikeTitle: '⏭️ NoPlay (Skip & do not play this track)',
      barHateTitle: '🤬 Exclude Artist (Skip all tracks by this artist)',
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
      mpDislikeTitle: 'NoPlay & skip',
      mpHateTitle: 'Exclude artist & skip',
      mpToastDislike: '⏭️ Added to NoPlay & skipped',
      mpToastHate: '🤬 Excluded artist & skipped',
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

      // Messages (toasts, tooltips, results)
      m_streakStop: '⚠️ Many known tracks in a row - playing this one as is',
      m_savedTo: 'Target',
      m_plBtnNoTarget: '➕ One-click add to playlist (click to choose the target)',
      m_plBtnIn: '✔ Already in "{name}" (click to remove / right-click to change target)',
      m_plBtnOut: '➕ One-click add to "{name}" (press again to remove / right-click to change target)',
      m_plFetching: '🔄 Fetching playlists...',
      m_plNoLogin: '⚠️ Not logged in to SoundCloud - cannot fetch playlists',
      m_plNone: '⚠️ No playlists. Create one on SoundCloud first',
      m_plTargetSet: '📋 Target set to "{name}"!',
      m_noTrackInfo: '⚠️ Cannot get the current track info',
      m_loginToken: '⚠️ Please log in to SoundCloud (no auth token found)',
      m_pickTarget: '📋 Please choose a playlist',
      m_plAborted: '⚠️ Adding to the playlist was cancelled',
      m_plDefaultName: 'the playlist',
      m_plTargetMissing: '⚠️ Target playlist not found. Please choose again',
      m_plNoTargetAbort: '⚠️ Cancelled because no playlist was chosen',
      m_authFail: '❌ Account authentication failed ({s}). Reload SoundCloud or log in again',
      m_plFull: '⚠️ "{name}" has reached the 500-track limit',
      m_plRemoved: '➖ Removed "{track}" from "{name}"',
      m_plAdded: '✅ Added "{track}" to "{name}" (press again to remove)',
      m_plUpdateFail: '❌ Failed to update the playlist ({s})',
      m_error: '❌ Error: {msg}',
      m_errorOcc: 'An error occurred: {msg}',
      m_exLogin: 'Not logged in to SoundCloud, so nothing can be exported. Log in and try again.',
      m_exNone: 'No disliked tracks to export (only tracks with a known ID can be exported).',
      m_connectFail: 'Could not connect to the SoundCloud account. Please reload the page.',
      m_exPlFail: 'Failed to fetch the Dislike playlist (HTTP {s})',
      m_exUpdated: 'Exported to playlist "{name}" ({n} tracks in total{cap})',
      m_exCap: ', 500-track limit',
      m_exUpdateFail: 'Failed to update the export (HTTP {s})',
      m_exCreated: 'Created private playlist "{name}" and exported {n} tracks!',
      m_exCreateFail: 'Failed to create the playlist (HTTP {s})',
      m_imLogin: 'Not logged in to SoundCloud, so nothing can be imported. Log in and try again.',
      m_imNotFound: 'No playlist named "{name}" was found. Export first.',
      m_imFail: 'Failed to fetch the playlist (HTTP {s})',
      m_imEmpty: 'Playlist "{name}" has no tracks.',
      m_imDone: 'Checked {n} tracks in playlist "{name}" and added {c} new ones to the Dislike list!',
      m_volRestored: '🔊 Volume restored ({n}%)',
      m_muted: '🔇 Muted',
      m_unmute: 'Unmute',
      m_discOn: '🔍 Discovery Mode ON (known tracks are skipped)',
      m_discOff: '⏸ Discovery Mode OFF (normal SoundCloud playback)',
      m_toDiscovery: '🔍 Switched to Discovery Mode (unknown artists)',
      m_toFollowing: '👥 Switched to Following Only Mode (new tracks only)',
      m_stOff: '⏸ Discovery OFF',
      m_stOn: '🔍 Discovery ON',
      m_stFollow: '👥 Following only',
      m_stationStarted: '📻 Station started!',
      m_stationStartedMsg: 'Station started',
      m_stationLoading: '📻 Loading station...',
      m_stationPlaying: '📻 Station is now playing!',
      m_stationNoTrack: '⚠️ Could not get the current track info',
      m_stationNoTrackMsg: 'Could not get the track info',
      m_repostHead: '🔁 Repost',
      m_repostPh: 'Comment on track (optional, up to {n} chars)',
      m_send: 'Send',
      m_reposting: '🔁 Reposting...',
      m_repostFail: '⚠️ Repost failed ({s})',
      m_repostCapFail: '⚠️ Reposted, but comment failed ({s})',
      m_repostedCap: '🔁 Reposted & posted comment!',
      m_reposted: '🔁 Reposted!',
      m_commErr: '⚠️ A communication error occurred',
      m_tabNoReply: '⚠️ The tab that is playing does not respond',
      m_noLikeBtn: '⚠️ Like button not found',
      m_trackLoading: '⚠️ Getting the track info...',
      m_loginPlease: '⚠️ Please log in to SoundCloud',
      m_unreposting: '🔁 Removing the repost...',
      m_unrepostFail: '⚠️ Failed to remove the repost ({s})',
      m_artistDefault: 'the artist',
      m_artistLoading: '⚠️ Checking the artist ID...',
      m_unfollowing: '👤 Unfollowing...',
      m_following: '👤 Following...',
      m_unfollowed: '👤 Unfollowed {name}',
      m_followed: '👤 Followed {name}!',
      m_followFail: '⚠️ Follow failed ({s})',
      m_notPlaying: 'Not playing',
      m_repostedTip: 'Reposted (click to remove)',
      m_repostTip: 'Repost (you can add a comment)',
      m_followingLbl: '👤✓ Following',
      m_untitled: '(untitled)',

      // Lists (R3, R6)
      m_hateOff: '🤬 Removed "{name}" from excluded',
      m_hateOnTip: '🤬 Excluded (click to remove)',
      m_laterAdded: '🧐 Saved "{name}" to Listen later',
      m_laterRemoved: '🧐 Removed "{name}" from Listen later',
      m_laterLimit: '⚠️ Listen later holds up to 500 artists',
      m_laterFail: '⚠️ Could not save Listen later',
      m_laterAddTip: '🧐 Listen later (save this artist)',
      m_laterRemoveTip: '🧐 Saved (click to remove)',
      m_profileTag: '🤬 Excluded by FreshDig',
      m_profileUnban: 'Remove',
      listsTitle: '📚 Lists',
      tabHated: '🤬 Excluded artists',
      tabLater: '🧐 Listen later',
      listSearch: 'Search',
      listMore: 'Show more',
      listUnban: 'Remove ✕',
      listLaterDelete: '✕ Delete',
      listEmpty: '(nothing yet)',
      listNeedTab: 'Open a SoundCloud tab to see this list',
      listFrom: 'From',

      // Freshness filter (R10)
      freshTitle: '✨ Skip by freshness (Discovery Mode)',
      freshFollowersPre: 'Skip artists with more than',
      freshFollowersPost: 'followers',
      freshTracksPre: 'Skip artists with more than',
      freshTracksPost: 'tracks',
      freshPlaysPre: 'Skip tracks played more than',
      freshPlaysPost: 'times',
      freshAgePre: 'Skip tracks older than',
      freshAgePost: 'days',
      freshHint: 'Nothing is skipped when a number is unknown. Artist numbers are kept for 7 days.',

      // Playlist picker popup
      pickerTitle: '➕ Select 1-Click Target Playlist',
      pickerCancel: 'Cancel',
      // Rating prompt
      ratePromptTitle: '🌟 Finding new music with FreshDig?',
      ratePromptDesc: 'If you feel this extension helps discover SoundCloud music, please leave a rating or review on the Chrome Web Store! It encourages new artists and feature updates.',
      btnRateNow: '⭐ Write Review',
      btnRateLater: 'Later',
      btnRateDismiss: 'Dismiss',

      // Multi-playlist
      m_exMultiDone: 'Exported {n} tracks across {c} playlists including "{name}"!',
      m_imMultiDone: 'Checked {n} tracks across {c} NoPlay playlists and added {added} new ones!',

    },
    de: {
      appName: 'FreshDig',
      notConnected: 'SoundCloud nicht verbunden',
      notLoggedIn: '⚠️ Nicht bei SoundCloud angemeldet',
      notLoggedInDesc: 'Melde dich bei SoundCloud an, um Likes/Gefolgte zu überspringen und 1-Klick-Playlists zu nutzen.',
      connecting: '🔄 Konto wird verbunden...',
      connectingDesc: 'Wenn keine Verbindung möglich ist, klicke auf [🔄 Synchronisieren] oder lade SoundCloud neu.',
      connectedReady: 'Konto verbunden & aktiv',
      connectedSyncing: 'Konto verbunden & synchronisiert',
      reloadRequired: '⚠️ Bitte SoundCloud-Tab neu laden',
      reloadRequiredDesc: 'Nach dem Update der Erweiterung muss der geöffnete SoundCloud-Tab neu geladen werden.',
      openSCTab: 'Bitte öffne einen SoundCloud-Tab',
      loadingSC: 'SoundCloud wird geladen...',

      // Buttons & Controls
      btnMiniPlayer: '🪟 Mini-Player',
      btnStation: '📻 Station starten',
      btnStationTitle: 'Station vom aktuell abgespielten Titel starten',
      autoMpLabel: 'Mini-Player automatisch beim Tab-Wechsel anzeigen',
      autoMpTitle: 'Öffnet automatisch den Mini-Player, wenn du bei laufender Musik zu einem anderen Tab wechselst (Dokument-PiP)',
      autoMpNotSupported: 'Dieser Browser unterstützt kein automatisches Bild-im-Bild',

      volControl: '🔊 Lautstärkeregelung',
      volMute: 'Stummschaltung umschalten',
      volSliderTitle: 'Lautstärkeregler',

      discoveryMode: '🔍 Entdeckungsmodus',
      discoveryOnDesc: 'Überspringt bekannte Titel automatisch (Likes, Gefolgte, Dislikes)',
      discoveryOffDesc: 'AUS: Normale SoundCloud-Wiedergabe ohne Überspringen',

      targetPlaylist: '➕ 1-Klick-Ziel-Playlist',
      btnSync: '🔄 Synchronisieren',
      btnSyncing: '⏳ Wird synchronisiert...',
      noPlaylistFound: '(Keine Playlists gefunden)',
      playlistSyncing: 'Synchronisierung läuft... Bitte auf [🔄 Synchronisieren] klicken',
      trackCountSuffix: 'Titel',
      skipToastPrefix: 'Übersprungen',
      skipReasonDisliked: 'NoPlay-Titel',
      skipReasonHated: 'Gesperrter Künstler',
      skipReasonGenre: 'Ausgeschlossenes Genre',
      skipReasonOwn: 'Eigener Titel',
      skipReasonLiked: 'Bereits geliked',
      skipReasonFollowing: 'Gefolgter Künstler',
      skipReasonManyFollowers: 'Künstler mit vielen Followern',
      skipReasonManyTracks: 'Künstler mit vielen Titeln',
      skipReasonManyPlays: 'Titel mit vielen Aufrufen',
      skipReasonOldTrack: 'Älterer Titel',
      robotBanner: 'SoundCloud zeigt eine Bot-Prüfung an. Bitte schließe sie auf der Seite ab.',
      robotShort: 'Bot-Prüfung',
      advancedSettings: '⚙ Dig Config',
      btnCopyLog: '📋 Diagnoseprotokoll kopieren',
      logCopied: 'Kopiert. Bitte zusammen mit dem Fehlerbericht einfügen.',
      logCopyFailed: 'Kopieren fehlgeschlagen',
      logHint: 'Direkt nach dem Musikstopp drücken und einfügen',

      dislikeSection: '⏭️ NoPlay mit SC-Playlist synchronisieren',
      btnExportDislikes: '📤 Zu SC exportieren',
      btnExportingDislikes: '⏳ Wird exportiert...',
      btnImportDislikes: '📥 Von SC importieren',
      btnImportingDislikes: '⏳ Wird importiert...',
      exportingMsg: 'Playlist auf SoundCloud wird erstellt/aktualisiert...',
      importingMsg: 'Dislike-Titel werden aus SoundCloud-Playlist geladen...',
      commErrorMsg: 'Kommunikation mit SoundCloud fehlgeschlagen. Bitte Seite neu laden.',

      statLikes: 'Skip Likes',
      statFollow: 'Skip Follows',
      statDislike: 'NoPlay',

      langLabel: '🌐 Sprache',

      // In-page Player Bar
      barStationTitle: '📻 Station für diesen Titel starten',
      barDislikeTitle: '⏭️ NoPlay (Diesen Titel überspringen)',
      barHateTitle: '🤬 Künstler ausschließen (Alle Titel überspringen)',
      barMiniPlayerTitle: '🪟 Mini-Player (Immer im Vordergrund schwebendes Fenster)',
      barDiscoveryOffTitle: '🔍 Entdeckungsmodus AUS (Klicken zum Einschalten: bekannte Titel überspringen)',
      barDiscoveryOnTitle: '🔍 Entdeckungsmodus AN (Klicken zum Ausschalten: normale Wiedergabe)',
      barFollowingModeTitle: '👥 Nur-Gefolgte-Modus (Klicken zum Wechseln in den Entdeckungsmodus)',

      // Mini Player
      mpTitle: 'FreshDig - Entdeckungs-Mini-Player',
      mpPromptOpen: '🪟 Hier klicken, um den Mini-Player zu öffnen',
      mpLoadingTrack: 'Titel wird geladen...',
      mpStatusWaiting: 'Bereit',
      mpStatusDigging: 'Am Entdecken',
      mpFollowBtn: '👤 Folgen',
      mpFollowBtnTitle: 'Künstler folgen',
      mpStationBtn: '📻 Station',
      mpStationBtnTitle: 'Station für diesen Titel starten',
      mpPrevTitle: 'Vorheriger Titel',
      mpPlayTitle: 'Wiedergabe / Pause',
      mpNextTitle: 'Nächster Titel',
      mpLikeTitle: 'Gefällt mir (Like)',
      mpRepostTitle: 'Repost',
      mpAddPlTitle: 'Zu Playlist hinzufügen',
      mpDislikeTitle: 'NoPlay & überspringen',
      mpHateTitle: 'Künstler ausschließen & überspringen',
      mpToastDislike: '⏭️ Zu NoPlay hinzugefügt & übersprungen',
      mpToastHate: '🤬 Künstler ausgeschlossen & übersprungen',
      mpToastAddedPl: '➕ Zu Playlist hinzugefügt',
      mpToastRemovedPl: '➖ Aus Playlist entfernt',
      mpToastLiked: '❤️ Titel geliked',
      mpToastUnliked: '🤍 Like entfernt',
      mpToastReposted: '🔁 Titel repostet',
      mpToastUnreposted: '↩️ Repost entfernt',
      mpToastFollowed: '👤 Künstler gefolgt',
      mpToastUnfollowed: '👤 Entfolgt',
      mpStatusToggleOff: 'Klicken, um Entdeckungsmodus auszuschalten (Normale Wiedergabe)',
      mpStatusToggleOn: 'Klicken, um Entdeckungsmodus einzuschalten (Bekannte Titel überspringen)',

      // Messages (toasts, tooltips, results)
      m_streakStop: '⚠️ Mehrere bekannte Titel in Folge – dieser Titel wird abgespielt',
      m_savedTo: 'Ziel',
      m_plBtnNoTarget: '➕ 1-Klick-Hinzufügen zu Playlist (Klicken, um Ziel zu wählen)',
      m_plBtnIn: '✔ Bereits in „{name}“ (Klicken zum Entfernen / Rechtsklick zum Ändern)',
      m_plBtnOut: '➕ 1-Klick-Hinzufügen zu „{name}“ (Erneut drücken zum Entfernen / Rechtsklick zum Ändern)',
      m_plFetching: '🔄 Playlists werden abgerufen...',
      m_plNoLogin: '⚠️ Nicht bei SoundCloud angemeldet – Playlists können nicht geladen werden',
      m_plNone: '⚠️ Keine Playlists vorhanden. Erstelle zuerst eine auf SoundCloud',
      m_plTargetSet: '📋 Ziel auf „{name}“ gesetzt!',
      m_noTrackInfo: '⚠️ Titelinformationen können nicht abgerufen werden',
      m_loginToken: '⚠️ Bitte bei SoundCloud anmelden (Kein Auth-Token gefunden)',
      m_pickTarget: '📋 Bitte eine Playlist auswählen',
      m_plAborted: '⚠️ Hinzufügen zur Playlist abgebrochen',
      m_plDefaultName: 'die Playlist',
      m_plTargetMissing: '⚠️ Ziel-Playlist nicht gefunden. Bitte neu auswählen',
      m_plNoTargetAbort: '⚠️ Abgebrochen, da keine Playlist ausgewählt wurde',
      m_authFail: '❌ Konto-Authentifizierung fehlgeschlagen ({s}). SoundCloud neu laden oder erneut anmelden',
      m_plFull: '⚠️ „{name}“ hat das Limit von 500 Titeln erreicht',
      m_plRemoved: '➖ „{track}“ aus „{name}“ entfernt',
      m_plAdded: '✅ „{track}“ zu „{name}“ hinzugefügt (Erneut drücken zum Entfernen)',
      m_plUpdateFail: '❌ Aktualisierung der Playlist fehlgeschlagen ({s})',
      m_error: '❌ Fehler: {msg}',
      m_errorOcc: 'Ein Fehler ist aufgetreten: {msg}',
      m_exLogin: 'Nicht bei SoundCloud angemeldet. Bitte anmelden und erneut versuchen.',
      m_exNone: 'Keine Dislike-Titel zum Exportieren (Nur Titel mit bekannter ID können exportiert werden).',
      m_connectFail: 'Verbindung zum SoundCloud-Konto fehlgeschlagen. Bitte Seite neu laden.',
      m_exPlFail: 'Abrufen der Dislike-Playlist fehlgeschlagen (HTTP {s})',
      m_exUpdated: 'In Playlist „{name}“ exportiert (insgesamt {n} Titel{cap})',
      m_exCap: ', Limit von 500 Titeln',
      m_exUpdateFail: 'Export-Aktualisierung fehlgeschlagen (HTTP {s})',
      m_exCreated: 'Private Playlist „{name}“ erstellt und {n} Titel exportiert!',
      m_exCreateFail: 'Erstellung der Playlist fehlgeschlagen (HTTP {s})',
      m_imLogin: 'Nicht bei SoundCloud angemeldet. Bitte anmelden und erneut versuchen.',
      m_imNotFound: 'Keine Playlist mit dem Namen „{name}“ gefunden. Bitte zuerst exportieren.',
      m_imFail: 'Abrufen der Playlist fehlgeschlagen (HTTP {s})',
      m_imEmpty: 'Playlist „{name}“ enthält keine Titel.',
      m_imDone: '{n} Titel in Playlist „{name}“ überprüft und {c} neue zur Dislike-Liste hinzugefügt!',
      m_volRestored: '🔊 Lautstärke wiederhergestellt ({n}%)',
      m_muted: '🔇 Stummgeschaltet',
      m_unmute: 'Stummschaltung aufheben',
      m_discOn: '🔍 Entdeckungsmodus AN (bekannte Titel werden übersprungen)',
      m_discOff: '⏸ Entdeckungsmodus AUS (normale SoundCloud-Wiedergabe)',
      m_toDiscovery: '🔍 Zum Entdeckungsmodus gewechselt (unbekannte Künstler)',
      m_toFollowing: '👥 Zum Nur-Gefolgte-Modus gewechselt (nur neue Titel)',
      m_stOff: '⏸ Entdeckung AUS',
      m_stOn: '🔍 Entdeckung AN',
      m_stFollow: '👥 Nur Gefolgte',
      m_stationStarted: '📻 Station gestartet!',
      m_stationStartedMsg: 'Station gestartet',
      m_stationLoading: '📻 Station wird geladen...',
      m_stationPlaying: '📻 Station wird abgespielt!',
      m_stationNoTrack: '⚠️ Titelinformationen konnten nicht abgerufen werden',
      m_stationNoTrackMsg: 'Titelinformationen konnten nicht abgerufen werden',
      m_repostHead: '🔁 Repost',
      m_repostPh: 'Kommentar zum Titel (optional, bis zu {n} Zeichen)',
      m_send: 'Senden',
      m_reposting: '🔁 Wird repostet...',
      m_repostFail: '⚠️ Repost fehlgeschlagen ({s})',
      m_repostCapFail: '⚠️ Repostet, aber Kommentar fehlgeschlagen ({s})',
      m_repostedCap: '🔁 Repostet & Titel kommentiert!',
      m_reposted: '🔁 Repostet!',
      m_commErr: '⚠️ Ein Kommunikationsfehler ist aufgetreten',
      m_tabNoReply: '⚠️ Der abspielende Tab antwortet nicht',
      m_noLikeBtn: '⚠️ Like-Button nicht gefunden',
      m_trackLoading: '⚠️ Titelinformationen werden geladen...',
      m_loginPlease: '⚠️ Bitte bei SoundCloud anmelden',
      m_unreposting: '🔁 Repost wird entfernt...',
      m_unrepostFail: '⚠️ Repost konnte nicht entfernt werden ({s})',
      m_artistDefault: 'der Künstler',
      m_artistLoading: '⚠️ Künstler-ID wird überprüft...',
      m_unfollowing: '👤 Wird entfolgt...',
      m_following: '👤 Folgen...',
      m_unfollowed: '👤 {name} entfolgt',
      m_followed: '👤 {name} gefolgt!',
      m_followFail: '⚠️ Folgen fehlgeschlagen ({s})',
      m_notPlaying: 'Keine Wiedergabe',
      m_repostedTip: 'Repostet (Klicken zum Entfernen)',
      m_repostTip: 'Repost (Kommentar möglich)',
      m_followingLbl: '👤✓ Gefolgt',
      m_untitled: '(Ohne Titel)',

      // Lists (R3, R6)
      m_hateOff: '🤬 „{name}“ aus ausgeschlossenen entfernt',
      m_hateOnTip: '🤬 Ausgeschlossen (Klicken zum Entfernen)',
      m_laterAdded: '🧐 „{name}“ für später gespeichert',
      m_laterRemoved: '🧐 „{name}“ aus Später anhören entfernt',
      m_laterLimit: '⚠️ Später anhören fasst maximal 500 Künstler',
      m_laterFail: '⚠️ Konnte nicht für später gespeichert werden',
      m_laterAddTip: '🧐 Später anhören (diesen Künstler merken)',
      m_laterRemoveTip: '🧐 Gespeichert (Klicken zum Entfernen)',
      m_profileTag: '🤬 Von FreshDig ausgeschlossen',
      m_profileUnban: 'Entfernen',
      listsTitle: '📚 Listen',
      tabHated: '🤬 Ausgeschlossene Künstler',
      tabLater: '🧐 Später anhören',
      listSearch: 'Suchen',
      listMore: 'Mehr anzeigen',
      listUnban: 'Entfernen ✕',
      listLaterDelete: '✕ Löschen',
      listEmpty: '(Noch nichts vorhanden)',
      listNeedTab: 'Öffne einen SoundCloud-Tab, um diese Liste zu sehen',
      listFrom: 'Quelle',

      // Freshness filter (R10)
      freshTitle: '✨ Nach Frische überspringen (Entdeckungsmodus)',
      freshFollowersPre: 'Künstler überspringen mit mehr als',
      freshFollowersPost: 'Followern',
      freshTracksPre: 'Künstler überspringen mit mehr als',
      freshTracksPost: 'Titeln',
      freshPlaysPre: 'Titel überspringen mit mehr als',
      freshPlaysPost: 'Aufrufen',
      freshAgePre: 'Titel überspringen, die älter sind als',
      freshAgePost: 'Tage',
      freshHint: 'Unbekannte Werte werden nicht übersprungen. Künstlerdaten werden 7 Tage gespeichert.',

      // Playlist picker popup
      pickerTitle: '➕ 1-Klick-Ziel-Playlist auswählen',
      pickerCancel: 'Abbrechen',
      // Rating prompt
      ratePromptTitle: '🌟 Neue Musik mit FreshDig entdeckt?',
      ratePromptDesc: 'Wenn du findest, dass diese Erweiterung das Entdecken auf SoundCloud fördert, hinterlasse bitte eine Bewertung im Chrome Web Store! Es ermutigt neue Künstler und unterstützt zukünftige Updates.',
      btnRateNow: '⭐ Bewerten',
      btnRateLater: 'Später',
      btnRateDismiss: 'Schließen',

      // Multi-playlist
      m_exMultiDone: '{n} Titel in {c} Playlists einschließlich „{name}“ exportiert!',
      m_imMultiDone: '{n} Titel aus {c} NoPlay-Playlists überprüft und {added} neue hinzugefügt!',

    },
    ru: {
      appName: 'FreshDig',
      notConnected: 'SoundCloud не подключен',
      notLoggedIn: '⚠️ Не выполнен вход в SoundCloud',
      notLoggedInDesc: 'Войдите в SoundCloud, чтобы пропускать лайки/подписки и добавлять треки в плейлист в 1 клик.',
      connecting: '🔄 Подключение аккаунта...',
      connectingDesc: 'Если не удается подключиться, нажмите [🔄 Синхронизация] или обновите страницу SoundCloud.',
      connectedReady: 'Аккаунт подключен и активен',
      connectedSyncing: 'Аккаунт подключен, синхронизация...',
      reloadRequired: '⚠️ Пожалуйста, обновите вкладку SoundCloud',
      reloadRequiredDesc: 'После обновления расширения необходимо перезагрузить открытую вкладку SoundCloud.',
      openSCTab: 'Пожалуйста, откройте вкладку SoundCloud',
      loadingSC: 'Загрузка SoundCloud...',

      // Buttons & Controls
      btnMiniPlayer: '🪟 Мини-плеер',
      btnStation: '📻 Запустить станцию',
      btnStationTitle: 'Запустить станцию на основе текущего трека',
      autoMpLabel: 'Автоматически открывать мини-плеер при переключении вкладок',
      autoMpTitle: 'Автоматически открывает мини-плеер при переключении на другую вкладку во время воспроизведения музыки (Document PiP)',
      autoMpNotSupported: 'Этот браузер не поддерживает автоматический режим "Картинка в картинке"',

      volControl: '🔊 Громкость',
      volMute: 'Вкл/выкл звук',
      volSliderTitle: 'Регулятор громкости',

      discoveryMode: '🔍 Режим поиска',
      discoveryOnDesc: 'Автопропуск знакомых треков (лайки, подписки, дизлайки)',
      discoveryOffDesc: 'ВЫКЛ: обычное воспроизведение SoundCloud без пропуска',

      targetPlaylist: '➕ Плейлист для добавления в 1 клик',
      btnSync: '🔄 Синхронизация',
      btnSyncing: '⏳ Синхронизация...',
      noPlaylistFound: '(Плейлисты не найдены)',
      playlistSyncing: 'Синхронизация... Нажмите [🔄 Синхронизация]',
      trackCountSuffix: 'треков',
      skipToastPrefix: 'Пропущено',
      skipReasonDisliked: 'Трек NoPlay',
      skipReasonHated: 'Заблокированный артист',
      skipReasonGenre: 'Исключенный жанр',
      skipReasonOwn: 'Свой трек',
      skipReasonLiked: 'Уже в лайках',
      skipReasonFollowing: 'Отслеживаемый артист',
      skipReasonManyFollowers: 'Артист с большим числом подписчиков',
      skipReasonManyTracks: 'Артист с большим числом треков',
      skipReasonManyPlays: 'Трек с большим числом прослушиваний',
      skipReasonOldTrack: 'Старый трек',
      robotBanner: 'SoundCloud показывает проверку на робота. Пожалуйста, пройдите её на странице.',
      robotShort: 'Проверка на робота',
      advancedSettings: '⚙ Dig Config',
      btnCopyLog: '📋 Скопировать лог диагностики',
      logCopied: 'Скопировано. Вставьте вместе с описанием проблемы.',
      logCopyFailed: 'Не удалось скопировать',
      logHint: 'Нажмите сразу после остановки звука и вставьте',

      dislikeSection: '⏭️ Синхронизация NoPlay с плейлистом SC',
      btnExportDislikes: '📤 Экспорт в SC',
      btnExportingDislikes: '⏳ Экспорт...',
      btnImportDislikes: '📥 Импорт из SC',
      btnImportingDislikes: '⏳ Импорт...',
      exportingMsg: 'Создание/обновление плейлиста в SoundCloud...',
      importingMsg: 'Получение дизлайков из плейлиста SoundCloud...',
      commErrorMsg: 'Ошибка связи с SoundCloud. Пожалуйста, обновите страницу.',

      statLikes: 'Пропуск лайков',
      statFollow: 'Пропуск подписок',
      statDislike: 'Дизлайки',

      langLabel: '🌐 Язык',

      // In-page Player Bar
      barStationTitle: '📻 Запустить станцию этого трека',
      barDislikeTitle: '⏭️ NoPlay (Пропустить этот трек)',
      barHateTitle: '🤬 Исключить артиста (Пропускать все треки артиста)',
      barMiniPlayerTitle: '🪟 Мини-плеер (плавающее окно поверх всех окон)',
      barDiscoveryOffTitle: '🔍 Режим поиска ВЫКЛ (Нажмите для ВКЛ: пропуск знакомых треков)',
      barDiscoveryOnTitle: '🔍 Режим поиска ВКЛ (Нажмите для ВЫКЛ: обычное воспроизведение)',
      barFollowingModeTitle: '👥 Только подписки (Нажмите для переключения в режим поиска)',

      // Mini Player
      mpTitle: 'FreshDig - Мини-плеер поиска',
      mpPromptOpen: '🪟 Нажмите здесь, чтобы открыть мини-плеер',
      mpLoadingTrack: 'Загрузка трека...',
      mpStatusWaiting: 'Ожидание',
      mpStatusDigging: 'Поиск',
      mpFollowBtn: '👤 Подписаться',
      mpFollowBtnTitle: 'Подписаться на артиста',
      mpStationBtn: '📻 Станция',
      mpStationBtnTitle: 'Запустить станцию этого трека',
      mpPrevTitle: 'Предыдущий трек',
      mpPlayTitle: 'Воспроизведение / Пауза',
      mpNextTitle: 'Следующий трек',
      mpLikeTitle: 'Лайк',
      mpRepostTitle: 'Репост',
      mpAddPlTitle: 'Добавить в плейлист',
      mpDislikeTitle: 'Больше не воспроизводить этот трек и пропустить',
      mpHateTitle: 'Исключить артиста и пропустить',
      mpToastDislike: '⏭️ Добавлено в NoPlay и пропущено',
      mpToastHate: '🤬 Артист исключен и пропущен',
      mpToastAddedPl: '➕ Добавлено в плейлист',
      mpToastRemovedPl: '➖ Удалено из плейлиста',
      mpToastLiked: '❤️ Трек добавлен в лайки',
      mpToastUnliked: '🤍 Лайк удален',
      mpToastReposted: '🔁 Сделан репост трека',
      mpToastUnreposted: '↩️ Репост отменен',
      mpToastFollowed: '👤 Вы подписались на артиста',
      mpToastUnfollowed: '👤 Подписка отменена',
      mpStatusToggleOff: 'Нажмите, чтобы выключить поиск (обычное воспроизведение)',
      mpStatusToggleOn: 'Нажмите, чтобы включить поиск (пропуск знакомых треков)',

      // Messages (toasts, tooltips, results)
      m_streakStop: '⚠️ Несколько знакомых треков подряд — воспроизводим этот как есть',
      m_savedTo: 'Назначение',
      m_plBtnNoTarget: '➕ Добавить в плейлист в 1 клик (нажмите для выбора)',
      m_plBtnIn: '✔ Уже в «{name}» (нажмите для удаления / правый клик для смены)',
      m_plBtnOut: '➕ Добавить в «{name}» в 1 клик (повторный клик удалит / правый клик для смены)',
      m_plFetching: '🔄 Получение плейлистов...',
      m_plNoLogin: '⚠️ Не выполнен вход в SoundCloud — невозможно загрузить плейлисты',
      m_plNone: '⚠️ Нет плейлистов. Сначала создайте плейлист в SoundCloud',
      m_plTargetSet: '📋 Выбран плейлист «{name}»!',
      m_noTrackInfo: '⚠️ Не удалось получить информацию о треке',
      m_loginToken: '⚠️ Пожалуйста, войдите в SoundCloud (токен не найден)',
      m_pickTarget: '📋 Пожалуйста, выберите плейлист',
      m_plAborted: '⚠️ Добавление в плейлист отменено',
      m_plDefaultName: 'плейлист',
      m_plTargetMissing: '⚠️ Целевой плейлист не найден. Выберите заново',
      m_plNoTargetAbort: '⚠️ Отменено: плейлист не был выбран',
      m_authFail: '❌ Ошибка авторизации ({s}). Обновите SoundCloud или войдите заново',
      m_plFull: '⚠️ В «{name}» достигнут лимит в 500 треков',
      m_plRemoved: '➖ «{track}» удален из «{name}»',
      m_plAdded: '✅ «{track}» добавлен в «{name}» (повторный клик удалит)',
      m_plUpdateFail: '❌ Не удалось обновить плейлист ({s})',
      m_error: '❌ Ошибка: {msg}',
      m_errorOcc: 'Произошла ошибка: {msg}',
      m_exLogin: 'Вход в SoundCloud не выполнен. Войдите и повторите попытку.',
      m_exNone: 'Нет треков с дизлайком для экспорта (экспортируются только треки с известным ID).',
      m_connectFail: 'Не удалось подключиться к SoundCloud. Обновите страницу.',
      m_exPlFail: 'Не удалось получить плейлист дизлайков (HTTP {s})',
      m_exUpdated: 'Экспортировано в плейлист «{name}» (всего {n} треков{cap})',
      m_exCap: ', лимит 500 треков',
      m_exUpdateFail: 'Не удалось обновить экспорт (HTTP {s})',
      m_exCreated: 'Создан приватный плейлист «{name}» и экспортировано {n} треков!',
      m_exCreateFail: 'Не удалось создать плейлист (HTTP {s})',
      m_imLogin: 'Вход в SoundCloud не выполнен. Войдите и повторите попытку.',
      m_imNotFound: 'Плейлист с именем «{name}» не найден. Сначала выполните экспорт.',
      m_imFail: 'Не удалось получить плейлист (HTTP {s})',
      m_imEmpty: 'В плейлисте «{name}» нет треков.',
      m_imDone: 'Проверено {n} треков в плейлисте «{name}», добавлено {c} новых в дизлайки!',
      m_volRestored: '🔊 Громкость восстановлена ({n}%)',
      m_muted: '🔇 Звук выключен',
      m_unmute: 'Включить звук',
      m_discOn: '🔍 Режим поиска ВКЛ (знакомые треки пропускаются)',
      m_discOff: '⏸ Режим поиска ВЫКЛ (обычное воспроизведение SoundCloud)',
      m_toDiscovery: '🔍 Переключено в режим поиска (неизвестные артисты)',
      m_toFollowing: '👥 Переключено в режим отслеживаемых (только новые треки)',
      m_stOff: '⏸ Поиск ВЫКЛ',
      m_stOn: '🔍 Поиск ВКЛ',
      m_stFollow: '👥 Только подписки',
      m_stationStarted: '📻 Станция запущена!',
      m_stationStartedMsg: 'Станция запущена',
      m_stationLoading: '📻 Загрузка станции...',
      m_stationPlaying: '📻 Станция играет!',
      m_stationNoTrack: '⚠️ Не удалось получить информацию о текущем треке',
      m_stationNoTrackMsg: 'Не удалось получить информацию о треке',
      m_repostHead: '🔁 Репост',
      m_repostPh: 'Комментарий к треку (до {n} симв.)',
      m_send: 'Отправить',
      m_reposting: '🔁 Отправка репоста...',
      m_repostFail: '⚠️ Не удалось сделать репост ({s})',
      m_repostCapFail: '⚠️ Репост сделан, но комментарий не удался ({s})',
      m_repostedCap: '🔁 Репост и комментарий опубликованы!',
      m_reposted: '🔁 Репост выполнен!',
      m_commErr: '⚠️ Произошла ошибка связи',
      m_tabNoReply: '⚠️ Воспроизводящая вкладка не отвечает',
      m_noLikeBtn: '⚠️ Кнопка «Лайк» не найдена',
      m_trackLoading: '⚠️ Получение информации о треке...',
      m_loginPlease: '⚠️ Пожалуйста, войдите в SoundCloud',
      m_unreposting: '🔁 Отмена репоста...',
      m_unrepostFail: '⚠️ Не удалось отменить репост ({s})',
      m_artistDefault: 'артист',
      m_artistLoading: '⚠️ Проверка ID артиста...',
      m_unfollowing: '👤 Отписка...',
      m_following: '👤 Подписка...',
      m_unfollowed: '👤 Вы отписались от {name}',
      m_followed: '👤 Вы подписались на {name}!',
      m_followFail: '⚠️ Ошибка при подписке ({s})',
      m_notPlaying: 'Не воспроизводится',
      m_repostedTip: 'Сделан репост (нажмите для отмены)',
      m_repostTip: 'Сделать репост (можно добавить комментарий)',
      m_followingLbl: '👤✓ Вы подписаны',
      m_untitled: '(Без названия)',

      // Lists (R3, R6)
      m_hateOff: '🤬 Артист «{name}» удален из списка',
      m_hateOnTip: '🤬 Исключен (нажмите для отмены)',
      m_laterAdded: '🧐 «{name}» сохранен в «Послушать позже»',
      m_laterRemoved: '🧐 «{name}» удален из «Послушать позже»',
      m_laterLimit: '⚠️ В «Послушать позже» помещается до 500 артистов',
      m_laterFail: '⚠️ Не удалось сохранить в «Послушать позже»',
      m_laterAddTip: '🧐 Послушать позже (сохранить этого артиста)',
      m_laterRemoveTip: '🧐 Сохранено (нажмите для удаления)',
      m_profileTag: '🤬 Исключен в FreshDig',
      m_profileUnban: 'Удалить',
      listsTitle: '📚 Списки',
      tabHated: '🤬 Исключенные артисты',
      tabLater: '🧐 Послушать позже',
      listSearch: 'Поиск',
      listMore: 'Показать еще',
      listUnban: 'Удалить ✕',
      listLaterDelete: '✕ Удалить',
      listEmpty: '(пока пусто)',
      listNeedTab: 'Откройте вкладку SoundCloud, чтобы увидеть этот список',
      listFrom: 'Источник',

      // Freshness filter (R10)
      freshTitle: '✨ Пропускать по новизне (в режиме поиска)',
      freshFollowersPre: 'Пропускать артистов с более чем',
      freshFollowersPost: 'подписчиками',
      freshTracksPre: 'Пропускать артистов с более чем',
      freshTracksPost: 'треками',
      freshPlaysPre: 'Пропускать треки с более чем',
      freshPlaysPost: 'прослушиваниями',
      freshAgePre: 'Пропускать треки старше чем',
      freshAgePost: 'дней',
      freshHint: 'Если значение неизвестно, трек не пропускается. Данные артистов сохраняются 7 дней.',

      // Playlist picker popup
      pickerTitle: '➕ Выберите плейлист для добавления в 1 клик',
      pickerCancel: 'Отмена',
      // Rating prompt
      ratePromptTitle: '🌟 Находите новую музыку с FreshDig?',
      ratePromptDesc: 'Если вы считаете, что это расширение помогает открывать музыку на SoundCloud, пожалуйста, оставьте отзыв в Chrome Web Store! Это вдохновляет новых артистов и помогает развитию.',
      btnRateNow: '⭐ Написать отзыв',
      btnRateLater: 'Позже',
      btnRateDismiss: 'Закрыть',

      // Multi-playlist
      m_exMultiDone: 'Экспортировано {n} треков в {c} плейлистов, включая «{name}»!',
      m_imMultiDone: 'Проверено {n} треков из {c} плейлистов NoPlay, добавлено {added} новых!',

    }
  };

  function resolveLanguage(langPref) {
    if (langPref === 'ja' || langPref === 'en' || langPref === 'de' || langPref === 'ru') return langPref;
    // auto detect from browser/navigator
    try {
      const navLang = ((typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en').toLowerCase();
      if (navLang.startsWith('ja')) return 'ja';
      if (navLang.startsWith('de')) return 'de';
      if (navLang.startsWith('ru')) return 'ru';
      return 'en';
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

// FreshDig の純粋な判定処理（DOM・通信・状態を触らない）。Node からもテストできる。
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FreshDigCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function toNumId(v) {
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : null;
  }

  // 除外記録（Dislike 曲・作者・ジャンル）に空のキーを入れない（全曲スキップ事故の防止）
  function isValidDislikeKey(key) {
    if (key === undefined || key === null) return false;
    const s = String(key).trim();
    return s !== '' && s !== 'undefined' && s !== 'null' && s !== 'title_' && s !== 'artist_' && s !== '0' && s !== 'NaN';
  }

  // 曲の除外判定。理由は言語に依存しないキーで返す（表示時に i18n で訳す）。
  // info: { id, artistId, title, artistName, genre }
  // ctx: { discoveryEnabled, playbackMode, dislikedTracks, dislikedArtists, dislikedGenres,
  //        myUserId, likedTrackIds(Set), followingUserIds(Set), inLibrary, onArtistPage }
  function getSkipReasonKey(info, ctx) {
    if (!ctx || !ctx.discoveryEnabled || ctx.playbackMode !== 'DISCOVERY' || !info) return null;
    const id = toNumId(info.id);
    const artistId = toNumId(info.artistId);
    const title = info.title || '';
    const artist = info.artistName || '';
    const genre = (info.genre || '').trim().toLowerCase();
    const dTracks = ctx.dislikedTracks || {};
    const dArtists = ctx.dislikedArtists || {};
    const dGenres = ctx.dislikedGenres || {};

    if ((id && dTracks[id]) ||
        (title && (dTracks['title_' + encodeURIComponent(title)] || dTracks[title]))) {
      return 'skipReasonDisliked';
    }
    if ((artistId && dArtists[artistId]) ||
        (artist && (dArtists['artist_' + encodeURIComponent(artist)] || dArtists[artist]))) {
      return 'skipReasonHated';
    }
    if (genre && dGenres[genre]) return 'skipReasonGenre';
    if (artistId && ctx.myUserId && artistId === toNumId(ctx.myUserId)) return 'skipReasonOwn';
    // 自分で Likes ページ等を開いて再生している時 / 作者のページから再生している時は、ライク済み・フォロー中では止めない
    const keepKnown = !!(ctx.inLibrary || ctx.onArtistPage);
    if (!keepKnown && id && ctx.likedTrackIds && ctx.likedTrackIds.has(id)) return 'skipReasonLiked';
    if (!ctx.onArtistPage && artistId && ctx.followingUserIds && ctx.followingUserIds.has(artistId)) {
      return 'skipReasonFollowing';
    }
    return null;
  }

  // フレッシュさ判定（R10）。info.stats = { followers, trackCount, playCount, createdAt(ms) }（分からない項目は無し）
  // filter: { followers:{on,n}, trackCount:{on,n}, playCount:{on,n}, ageDays:{on,n} }。分からない値では飛ばさない
  function getFreshSkipReasonKey(stats, filter, now) {
    if (!filter || !stats) return null;
    const num = function (v) { return typeof v === 'number' && isFinite(v) ? v : null; };
    const over = function (rule, value) {
      return !!(rule && rule.on && num(rule.n) !== null && value !== null && value > rule.n);
    };
    if (over(filter.followers, num(stats.followers))) return 'skipReasonManyFollowers';
    if (over(filter.trackCount, num(stats.trackCount))) return 'skipReasonManyTracks';
    if (over(filter.playCount, num(stats.playCount))) return 'skipReasonManyPlays';
    const created = num(stats.createdAt);
    if (filter.ageDays && filter.ageDays.on && num(filter.ageDays.n) !== null && created !== null) {
      const ageDays = ((now || Date.now()) - created) / 86400000;
      if (ageDays > filter.ageDays.n) return 'skipReasonOldTrack';
    }
    return null;
  }

  // 設定（R10）の形を整える。壊れた値・足りない値は既定に戻す。既定はすべて OFF
  const FRESH_DEFAULTS = {
    followers: { on: false, n: 1000 },
    trackCount: { on: false, n: 100 },
    playCount: { on: false, n: 10000 },
    ageDays: { on: false, n: 30 }
  };
  function normalizeFreshFilter(raw) {
    const out = {};
    Object.keys(FRESH_DEFAULTS).forEach(function (k) {
      const r = raw && typeof raw === 'object' ? raw[k] : null;
      const n = r ? Number(r.n) : NaN;
      out[k] = {
        on: !!(r && r.on),
        n: (isFinite(n) && n >= 0 && n <= 1e9) ? Math.floor(n) : FRESH_DEFAULTS[k].n
      };
    });
    return out;
  }

  // 作者ごとの統計の保存（期限つき・件数上限つき）。map: { id: { f, t, at } }。期限切れを消し、多ければ古い順に消す
  function pruneAuthorStats(map, now, ttlMs, max) {
    const entries = Object.keys(map || {}).filter(function (k) {
      const e = map[k];
      return e && typeof e.at === 'number' && now - e.at < ttlMs && now >= e.at - 60000;
    });
    entries.sort(function (a, b) { return map[b].at - map[a].at; });
    const out = {};
    entries.slice(0, max).forEach(function (k) { out[k] = map[k]; });
    return out;
  }

  // 再生待ち行列の先読み。infos: 行列の順に並べた曲情報（分からないものは null）、curPos: 今の曲の位置。
  // remove: 先に外してよい位置、firstKeep: 次に流してよい最初の位置（無ければ -1）
  function planQueueAhead(infos, curPos, reasonFn, maxLook) {
    const remove = [];
    let firstKeep = -1;
    const last = Math.min(infos.length - 1, curPos + (maxLook || 30));
    for (let i = curPos + 1; i <= last; i++) {
      const info = infos[i];
      if (!info) { if (firstKeep < 0) firstKeep = i; continue; }
      if (reasonFn(info)) remove.push(i);
      else if (firstKeep < 0) firstKeep = i;
    }
    return { remove: remove, firstKeep: firstKeep };
  }

  // 作者のページ（/<作者>、/tracks など）か。予約パスと、reposts は除く
  const RESERVED_TOP = ['you', 'discover', 'stream', 'feed', 'search', 'upload', 'messages', 'notifications', 'charts',
    'settings', 'terms-of-use', 'pages', 'popular', 'tags', 'mobile', 'jobs', 'imprint', 'creator-pro', 'stations', 'people', 'logout'];
  const ARTIST_SUBPAGES = ['', 'tracks', 'popular-tracks', 'albums', 'sets'];
  function isArtistPagePath(pathname) {
    const parts = String(pathname || '').toLowerCase().split('/').filter(Boolean);
    if (parts.length === 0 || RESERVED_TOP.indexOf(parts[0]) !== -1) return false;
    const sub = parts[1] || '';
    return ARTIST_SUBPAGES.indexOf(sub) !== -1;
  }


  // ---- 自分の API 呼び出しの間隔・上限（ロボット確認を出にくくする） ----
  // reserve(now) は「何ミリ秒待ってから送るか」を返し、その送信枠を予約する。
  function createRateLimiter(opts) {
    const minGapMs = (opts && opts.minGapMs) || 250;
    const perMinute = (opts && opts.perMinute) || 60;
    const times = [];
    let last = -Infinity;
    return {
      reserve: function (now) {
        let t = Math.max(now, last + minGapMs);
        for (;;) {
          while (times.length && times[0] <= t - 60000) times.shift();
          if (times.length < perMinute) break;
          t = Math.max(t, times[times.length - perMinute] + 60000);
        }
        times.push(t);
        last = t;
        return t - now;
      }
    };
  }

  // 403 / 429 が来たら 60 秒 → 2 分 → 5 分と待ちを伸ばす。成功したら戻す
  function createBackoff(steps) {
    const list = steps || [60000, 120000, 300000];
    let idx = -1;
    let until = 0;
    return {
      fail: function (now) {
        idx = Math.min(idx + 1, list.length - 1);
        until = now + list[idx];
        return list[idx];
      },
      ok: function () { idx = -1; until = 0; },
      remaining: function (now) { return Math.max(0, until - now); },
      isBlocked: function (now) { return until > now; }
    };
  }

  // 「SoundCloud のロボット確認（DataDome）」の応答か。403 かつ DataDome の印があるものだけ
  function isRobotCheckResponse(status, getHeader, bodyText) {
    if (status !== 403) return false;
    const h = function (n) { try { return (getHeader && getHeader(n)) || ''; } catch (e) { return ''; } };
    if (h('x-datadome') || h('x-datadome-cid') || h('x-dd-b')) return true;
    return /captcha-delivery\.com|datadome/i.test(String(bodyText || ''));
  }

  // 診断ログ（輪の形）。複数タブの記録を時刻順に混ぜて最新 max 件だけ残す
  function mergeLogs(stored, pending, max) {
    const all = (Array.isArray(stored) ? stored : []).concat(pending || []);
    all.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    return all.length > max ? all.slice(all.length - max) : all;
  }

  // 全件同期が必要か（6 時間以内なら不要。force は常に必要）
  function shouldFullSync(lastSyncAt, now, opts) {
    const ttl = (opts && opts.ttlMs) || 6 * 3600 * 1000;
    if (opts && opts.force) return true;
    if (!opts || !opts.hasCache) return true;
    const last = Number(lastSyncAt);
    if (!isFinite(last) || last <= 0) return true;
    return now - last >= ttl || now < last;
  }

  return {
    planQueueAhead: planQueueAhead,
    createRateLimiter: createRateLimiter,
    createBackoff: createBackoff,
    isRobotCheckResponse: isRobotCheckResponse,
    mergeLogs: mergeLogs,
    shouldFullSync: shouldFullSync,
    toNumId: toNumId,
    isValidDislikeKey: isValidDislikeKey,
    getSkipReasonKey: getSkipReasonKey,
    getFreshSkipReasonKey: getFreshSkipReasonKey,
    normalizeFreshFilter: normalizeFreshFilter,
    pruneAuthorStats: pruneAuthorStats,
    isArtistPagePath: isArtistPagePath
  };
});

// SoundCloud Fresh Station & Follower Stream
(function () {
    'use strict';

    console.log('[SC-FreshStation] Hook loaded in MAIN world (FreshDig v1.9.13)');

    const STORAGE_KEY = 'sc_fresh_station_data_v1';
    const TARGET_PLAYLIST_KEY = 'sc_fresh_station_target_playlist_id';
    const PLAYBACK_MODE_KEY = 'sc_fresh_station_playback_mode';
    const CACHE_LIKES_KEY = 'sc_fresh_station_cache_likes';
    const CACHE_FOLLOWS_KEY = 'sc_fresh_station_cache_follows';
    const CACHE_PLAYLISTS_KEY = 'sc_fresh_station_cache_playlists';
    const CACHE_CLIENT_ID_KEY = 'sc_fresh_station_client_id';
    const CACHE_OAUTH_TOKEN_KEY = 'sc_fresh_station_cache_oauth_token';

    const DISCOVERY_ENABLED_KEY = 'sc_fresh_station_discovery_enabled';
    const AUTO_MINI_PLAYER_KEY = 'sc_fresh_station_auto_miniplayer';
    const PREFERRED_LANGUAGE_KEY = 'sc_fresh_station_preferred_language';

    // 画面に出す文字を辞書(i18n.js)から取る。{name} などは vars で差し込む
    function tt(key, vars) {
        let v = getI18nTexts()[key];
        if (typeof v !== 'string') return key;
        if (vars) v = v.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] === undefined || vars[k] === null ? '' : String(vars[k]); });
        return v;
    }

    function getI18nTexts() {
        if (typeof FreshDigI18n !== 'undefined' && FreshDigI18n.getTexts) {
            return FreshDigI18n.getTexts(state.preferredLanguage);
        }
        return {
            barStationTitle: '📻 この曲のステーションを開始',
            barDislikeTitle: '⏭️ 不再生 (NoPlay: この曲を今後再生せずスキップ)',
            barHateTitle: '🤬 作者除外 (この作者の曲すべてを今後再生せずスキップ)',
            barMiniPlayerTitle: '🪟 ミニプレイヤー (最前面ウィンドウで浮遊操作)',
            barDiscoveryOffTitle: '🔍 発掘モード OFF（クリックで ON：知っている曲を自動スキップ）',
            barDiscoveryOnTitle: '🔍 発掘モード ON（クリックで OFF：SoundCloud 通常再生）',
            barFollowingModeTitle: '👥 フォロー新曲モード (クリックで「発掘モード」へ切替)',
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
            mpDislikeTitle: '不再生 (NoPlay) & スキップ',
            mpHateTitle: '作者除外 & スキップ',
            mpToastDislike: '⏭️ 不再生に登録してスキップ',
            mpToastHate: '🤬 作者を除外してスキップ',
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
            pickerTitle: '➕ ワンクリック追加先を選択',
            pickerCancel: 'キャンセル',
            trackCountSuffix: '曲',
            skipToastPrefix: 'スキップ',
            skipReasonDisliked: '不再生の曲',
            skipReasonHated: '除外した作者',
            skipReasonGenre: '除外したジャンル',
            skipReasonOwn: '自分の曲',
            skipReasonLiked: 'ライク済み',
            skipReasonFollowing: 'フォロー中のアーティスト',
            robotBanner: 'SoundCloud のロボット確認が出ています。ページで確認を済ませてください',
            robotShort: 'ロボット確認中'
        };
    }

    // 「フォロー新曲のみ（リポスト除外）」モードは現在使わないため無効化（コードは残してある。true で復活）
    const FOLLOWING_NEW_MODE_ENABLED = false;

    function normalizePlaybackMode(mode) {
        if (mode === 'FOLLOWING_NEW' && FOLLOWING_NEW_MODE_ENABLED) return 'FOLLOWING_NEW';
        return 'DISCOVERY';
    }

    function readDiscoveryEnabled() {
        try {
            return localStorage.getItem(DISCOVERY_ENABLED_KEY) !== 'false'; // 未設定なら ON
        } catch (e) {
            return true;
        }
    }

    const MAX_STATION_EXTRA_PAGES = 5;      // ステーション補充で追加取得するページ数の上限
    const MAX_LIKES_SYNC = 20000;           // 同期するLikesの上限件数（ID のみ取得なので軽い）
    const MAX_FOLLOWINGS_SYNC = 20000;      // 同期するフォローの上限件数
    const AUTO_SYNC_COOLDOWN_MS = 60000;    // 自動同期の最短間隔（リクエスト連打防止）

    const state = {
        myUserId: null,
        myPermalink: null,       // 自分のプロフィールURL名（/permalink/likes 等の判定用）
        oauthToken: null,        // 直近で使う認証ヘッダー値 ("OAuth xxx")。毎回 getAuthToken() で最新化する
        capturedToken: null,     // SoundCloud 自身の通信から捕捉したトークン
        injectedToken: null,     // 拡張機能 background から注入されたトークン
        myUsername: null,
        clientId: localStorage.getItem(CACHE_CLIENT_ID_KEY) || null,
        likedTrackIds: new Set(),
        followingUserIds: new Set(),
        isUserDataLoaded: false,
        playbackMode: normalizePlaybackMode(localStorage.getItem(PLAYBACK_MODE_KEY)), // 'DISCOVERY'（'FOLLOWING_NEW' は現在無効）
        discoveryEnabled: readDiscoveryEnabled(), // 発掘モード（自動スキップ・ステーション絞り込み）の ON/OFF
        autoMiniPlayer: (function () { try { return localStorage.getItem(AUTO_MINI_PLAYER_KEY) !== 'false'; } catch (e) { return true; } })(), // 別タブへ切替時にミニプレイヤーを自動表示
        preferredLanguage: (function () { try { return localStorage.getItem(PREFERRED_LANGUAGE_KEY) || 'auto'; } catch (e) { return 'auto'; } })(), // 表示言語: auto / ja / en
        dislikedTracks: {},
        dislikedArtists: {},
        dislikedGenres: {},
        myPlaylists: [],
        targetPlaylistId: localStorage.getItem(TARGET_PLAYLIST_KEY) || null,
        currentTrack: null,
        lastSkippedTrackKey: null,
        repostedTrackIds: new Set(),
        robotBlocked: false      // SoundCloud のロボット確認が出ている間 true（自動スキップと自分の API 呼び出しを止める）
    };

    // 1. キャッシュから即時復元（ページ表示0秒後から除外有効化）
    function loadCachedData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                state.dislikedTracks = parsed.dislikedTracks || {};
                state.dislikedArtists = parsed.dislikedArtists || {};
                state.dislikedGenres = parsed.dislikedGenres || {};
            }
            state.targetPlaylistId = localStorage.getItem(TARGET_PLAYLIST_KEY) || null;
            state.playbackMode = normalizePlaybackMode(localStorage.getItem(PLAYBACK_MODE_KEY));
            state.discoveryEnabled = readDiscoveryEnabled();
            try { state.preferredLanguage = localStorage.getItem(PREFERRED_LANGUAGE_KEY) || 'auto'; } catch (e) {}

            const cachedLikes = localStorage.getItem(CACHE_LIKES_KEY);
            if (cachedLikes) {
                const arr = JSON.parse(cachedLikes);
                state.likedTrackIds = new Set((Array.isArray(arr) ? arr : []).map(Number).filter(function (n) { return n > 0; }));
            }

            const cachedFollows = localStorage.getItem(CACHE_FOLLOWS_KEY);
            if (cachedFollows) {
                const arr = JSON.parse(cachedFollows);
                state.followingUserIds = new Set((Array.isArray(arr) ? arr : []).map(Number).filter(function (n) { return n > 0; }));
            }

            const cachedPls = localStorage.getItem(CACHE_PLAYLISTS_KEY);
            if (cachedPls) {
                state.myPlaylists = JSON.parse(cachedPls);
            }

            const cachedReposts = localStorage.getItem(CACHE_REPOSTS_KEY);
            if (cachedReposts) {
                const arr = JSON.parse(cachedReposts);
                state.repostedTrackIds = new Set((Array.isArray(arr) ? arr : []).map(Number).filter(function (n) { return n > 0; }));
            }

            if (state.likedTrackIds.size > 0 || state.followingUserIds.size > 0) {
                state.isUserDataLoaded = true;
                console.log('[SC-FreshStation] Loaded from cache: ' + state.likedTrackIds.size + ' likes, ' + state.followingUserIds.size + ' follows');
            }

            // 無効なゴミキーの完全クリーンアップ（全スキップバグの防止）
            const invalidKeys = ['undefined', 'null', 'unknown', 'title_unknown', 'artist_unknown', ''];
            let cleaned = false;
            Object.keys(state.dislikedTracks).forEach(function (k) {
                if (!k || invalidKeys.includes(k.toLowerCase().trim())) {
                    delete state.dislikedTracks[k];
                    cleaned = true;
                }
            });
            Object.keys(state.dislikedArtists).forEach(function (k) {
                if (!k || invalidKeys.includes(k.toLowerCase().trim())) {
                    delete state.dislikedArtists[k];
                    cleaned = true;
                }
            });
            if (cleaned) {
                saveDislikeData();
                console.log('[SC-FreshStation] Cleaned up invalid blacklist keys.');
            }
        } catch (e) {
            console.error('[SC-FreshStation] Cache load error:', e);
        }
    }

    function saveDislikeData() {
        try {
            const payload = {
                dislikedTracks: state.dislikedTracks,
                dislikedArtists: state.dislikedArtists,
                dislikedGenres: state.dislikedGenres,
                updatedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            try { fdBus.post('dislike-changed'); } catch (e2) {}
        } catch (e) {
            console.error('[SC-FreshStation] Failed to save dislike data:', e);
        }
    }

    function saveCacheData() {
        try {
            localStorage.setItem(CACHE_LIKES_KEY, JSON.stringify(Array.from(state.likedTrackIds)));
            localStorage.setItem(CACHE_FOLLOWS_KEY, JSON.stringify(Array.from(state.followingUserIds)));
            localStorage.setItem(CACHE_PLAYLISTS_KEY, JSON.stringify(state.myPlaylists));
            localStorage.setItem(CACHE_REPOSTS_KEY, JSON.stringify(Array.from(state.repostedTrackIds)));
            if (state.clientId) {
                localStorage.setItem(CACHE_CLIENT_ID_KEY, state.clientId);
            }
        } catch (e) {}
    }

    // =========================================================================
    // 🔌 SoundCloud 内部モジュールへのアクセス (webpack)
    //    音量・認証トークン・client_id を SoundCloud 本体と同じ仕組みで扱うため
    // =========================================================================
    const scInternals = { req: null, probed: false, ids: {}, misses: {} };

    function getScRequire() {
        if (scInternals.req) return scInternals.req;
        const jp = window.webpackJsonp;
        // webpack ランタイムが起動済み（push が差し替え済み）になってから一度だけプローブする
        if (scInternals.probed || !jp || typeof jp.push !== 'function' || jp.push === Array.prototype.push) return null;
        scInternals.probed = true;
        try {
            const probeId = '__freshdig_probe';
            jp.push([[probeId + '_' + Date.now()], {
                [probeId]: function (module, exports, require) { scInternals.req = require; }
            }, [[probeId]]]);
        } catch (e) {
            console.warn('[SC-FreshStation] webpack probe failed:', e);
        }
        return scInternals.req;
    }

    function findScModule(name, predicate) {
        const req = getScRequire();
        if (!req || !req.c) return null;
        const cachedId = scInternals.ids[name];
        if (cachedId !== undefined) {
            const m = req.c[cachedId];
            try { if (m && m.exports && predicate(m.exports)) return m.exports; } catch (e) {}
            delete scInternals.ids[name];
        }
        // 見つからなかった直後は再走査しない（500ms 毎の UI 同期で全モジュールを走査しないため）
        if (scInternals.misses[name] && Date.now() - scInternals.misses[name] < 5000) return null;
        for (const id of Object.keys(req.c)) {
            const ex = req.c[id] && req.c[id].exports;
            if (!ex || (typeof ex !== 'object' && typeof ex !== 'function')) continue;
            try {
                if (predicate(ex)) {
                    scInternals.ids[name] = id;
                    delete scInternals.misses[name];
                    return ex;
                }
            } catch (e) {}
        }
        scInternals.misses[name] = Date.now();
        return null;
    }

    function getScVolumeModule() {
        return findScModule('volume', function (ex) {
            return typeof ex.setVolumeAndMuted === 'function' && typeof ex.getVolume === 'function' &&
                typeof ex.getMuted === 'function' && typeof ex.setMuted === 'function';
        });
    }

    function getScAuthModule() {
        return findScModule('auth', function (ex) {
            return typeof ex.getAuthToken === 'function' && typeof ex.isLoggedIn === 'function';
        });
    }

    function getScConfigClientId() {
        const cfg = findScModule('config', function (ex) {
            if (typeof ex.get !== 'function' || typeof ex.set !== 'function') return false;
            const v = ex.get('client_id');
            return typeof v === 'string' && /^[a-zA-Z0-9]{20,40}$/.test(v);
        });
        return cfg ? cfg.get('client_id') : null;
    }

    function toOAuthHeader(tok) {
        if (!tok || typeof tok !== 'string') return null;
        tok = tok.trim();
        if (!tok || tok === 'null' || tok === 'undefined') return null;
        return tok.indexOf('OAuth ') === 0 ? tok : ('OAuth ' + tok);
    }

    function readTokenCookie() {
        const match = document.cookie.match(/(?:^|;\s*)oauth_token=([^;]+)/);
        return match && match[1] ? toOAuthHeader(decodeURIComponent(match[1])) : null;
    }

    // 最新の認証トークンを取得。SoundCloud はトークンを定期的に更新するため、キャッシュより
    // 「今の Cookie / SoundCloud 本体が使っている値」を必ず優先する（古いトークン固定が接続失敗の原因だった）
    function getAuthToken() {
        let tok = readTokenCookie();
        if (!tok) {
            try {
                const auth = getScAuthModule();
                if (auth && auth.isLoggedIn()) tok = toOAuthHeader(auth.getAuthToken());
            } catch (e) {}
        }
        return tok || state.capturedToken || state.injectedToken || null;
    }

    // 認証情報（トークン・client_id）を最新化。トークンが無ければ拡張機能本体へ要求する
    function extractAuthTokenFromCookie() {
        state.oauthToken = getAuthToken();
        const cid = getScConfigClientId();
        if (cid && cid !== state.clientId) {
            state.clientId = cid;
            try { localStorage.setItem(CACHE_CLIENT_ID_KEY, cid); } catch (e) {}
        }
        if (!state.oauthToken) {
            requestAuthFromExtension();
        }
        return state.oauthToken;
    }

    // 拡張機能本体（background）へのトークン要求。連発しないよう 2 秒に1回まで
    let lastAuthRequestAt = 0;
    function requestAuthFromExtension() {
        if (Date.now() - lastAuthRequestAt < 2000) return;
        lastAuthRequestAt = Date.now();
        window.postMessage({ type: 'SC_FRESH_STATION_REQUEST_AUTH' }, window.location.origin);
    }

    // トークンが得られるまで最大 waitMs 待つ（background からの注入待ち）
    async function waitForAuthToken(waitMs) {
        if (extractAuthTokenFromCookie()) return state.oauthToken;
        const until = Date.now() + (waitMs || 1500);
        while (Date.now() < until) {
            await new Promise(function (r) { setTimeout(r, 100); });
            if (extractAuthTokenFromCookie()) return state.oauthToken;
        }
        return null;
    }

    // =========================================================================
    // 🩺 診断ログ・タブ間連絡・API 呼び出しの上限・ロボット確認の検出（v2.0 P1）
    //    ・診断ログ: 最新 300 件の出来事を localStorage に残す（ポップアップからコピー）
    //    ・自分の API 呼び出しは apiFetch() を通す（間隔 250ms 以上・1 分 60 回まで・403/429 で待つ）
    //    ・ロボット確認（DataDome）を見つけたら自動スキップと API 呼び出しを止め、消えたら再開（突破はしない）
    // =========================================================================
    const TAB_ID = Math.random().toString(36).slice(2, 8);
    const DIAG_LOG_KEY = 'sc_fresh_station_diag_log';
    const LAST_FULL_SYNC_KEY = 'sc_fresh_station_last_full_sync';
    const CACHE_ME_KEY = 'sc_fresh_station_cache_me';
    const CACHE_REPOSTS_KEY = 'sc_fresh_station_cache_reposts';
    const DIAG_MAX = 300;
    let diagPending = [];
    let diagTimer = null;

    function flushDiagLog() {
        diagTimer = null;
        if (!diagPending.length) return;
        const batch = diagPending;
        diagPending = [];
        try {
            let stored = [];
            try { stored = JSON.parse(localStorage.getItem(DIAG_LOG_KEY) || '[]'); } catch (e) {}
            localStorage.setItem(DIAG_LOG_KEY, JSON.stringify(FreshDigCore.mergeLogs(stored, batch, DIAG_MAX)));
        } catch (e) {}
    }

    function dlog(type, detail) {
        try {
            diagPending.push({ t: Date.now(), tab: TAB_ID, type: type, d: detail === undefined ? '' : detail });
            if (diagPending.length > DIAG_MAX) diagPending.shift();
            if (!diagTimer) diagTimer = setTimeout(flushDiagLog, 2000);
        } catch (e) {}
    }
    window.addEventListener('pagehide', flushDiagLog);

    function getDiagLogText() {
        flushDiagLog();
        let list = [];
        try { list = JSON.parse(localStorage.getItem(DIAG_LOG_KEY) || '[]'); } catch (e) {}
        const head = 'FreshDig diag log (' + list.length + ' entries) UA=' + navigator.userAgent + ' url=' + location.pathname;
        return head + '\n' + list.map(function (x) {
            const dt = new Date(x.t);
            const hms = dt.toTimeString().slice(0, 8) + '.' + String(dt.getMilliseconds()).padStart(3, '0');
            return hms + ' [' + x.tab + '] ' + x.type + (x.d === '' ? '' : ' ' + JSON.stringify(x.d));
        }).join('\n');
    }

    // 同じ soundcloud.com の全タブへの連絡（拡張の裏側を通さない）。自分が送ったものは受け取らない
    const fdBus = (function () {
        const handlers = {};
        let ch = null;
        try { ch = new BroadcastChannel('freshdig'); } catch (e) {}
        if (ch) {
            ch.onmessage = function (ev) {
                const m = ev && ev.data;
                if (!m || typeof m.type !== 'string' || m.fromTabId === TAB_ID) return;
                (handlers[m.type] || []).forEach(function (fn) { try { fn(m); } catch (e) {} });
            };
        }
        return {
            on: function (type, fn) { (handlers[type] = handlers[type] || []).push(fn); },
            post: function (type, payload) {
                if (!ch) return;
                try { ch.postMessage(Object.assign({ type: type, fromTabId: TAB_ID }, payload || {})); } catch (e) {}
            }
        };
    })();

    // ---- API の上限 ----
    const apiLimiter = FreshDigCore.createRateLimiter({ minGapMs: 250, perMinute: 45 });
    const apiBackoff = FreshDigCore.createBackoff([60000, 120000, 300000]);
    const robotState = { iframe: false, api: false };

    function sleepMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function isRobotBlocked() { return robotState.iframe || robotState.api; }

    function refreshRobotState(source) {
        const was = !!state.robotBlocked;
        const now = isRobotBlocked();
        state.robotBlocked = now;
        if (was === now) return;
        dlog(now ? 'robot-check-detected' : 'robot-check-cleared', source);
        console.warn('[SC-FreshStation] robot check ' + (now ? 'detected (' + source + ') - auto-skip and own API calls paused' : 'cleared - resumed'));
        try {
            let el = document.getElementById('sc-fresh-station-robot-banner');
            if (now) {
                if (!el && document.body) {
                    el = document.createElement('div');
                    el.id = 'sc-fresh-station-robot-banner';
                    el.style.cssText = 'position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:2147483646;background:#b71c1c;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.5);';
                    document.body.appendChild(el);
                }
                if (el) el.textContent = '⚠️ ' + getI18nTexts().robotBanner;
            } else if (el) {
                el.remove();
            }
        } catch (e) {}
        try { syncMiniPlayerUI(); } catch (e) {}
    }

    function blockedApiResponse() {
        return new Response('{"freshdig":"paused"}', { status: 503, statusText: 'FreshDig paused' });
    }

    function apiPathForLog(url) {
        try { return new URL(url, 'https://api-v2.soundcloud.com').pathname; } catch (e) { return String(url).slice(0, 60); }
    }

    // 自分の API 呼び出し（scApi・ステーション補充・/resolve）はすべてここを通す
    async function apiFetch(url, init) {
        if (robotState.iframe || apiBackoff.isBlocked(Date.now())) return blockedApiResponse();
        const wait = apiLimiter.reserve(Date.now());
        if (wait > 0) await sleepMs(wait);
        const res = await originalFetch(url, init);
        try {
            if (res.status === 403 || res.status === 429) {
                let body = '';
                if (res.status === 403) { try { body = await res.clone().text(); } catch (e) {} }
                const isRobot = FreshDigCore.isRobotCheckResponse(res.status, function (n) { return res.headers.get(n); }, body);
                const waitMs = apiBackoff.fail(Date.now());
                dlog('api-blocked', { status: res.status, robot: isRobot, path: apiPathForLog(url), waitMs: waitMs });
                if (isRobot) { robotState.api = true; refreshRobotState('api'); }
            } else if (res.ok) {
                apiBackoff.ok();
                if (robotState.api) { robotState.api = false; refreshRobotState('api-ok'); }
            } else if (res.status !== 401) {
                dlog('api-error', { status: res.status, path: apiPathForLog(url) });
            }
        } catch (e) {}
        return res;
    }

    // SoundCloud 本体の通信（XHR）が 403 + DataDome の時も気づく
    function observeScXhr(xhr) {
        try {
            if (xhr.status === 403) {
                let body = '';
                try { body = (xhr.responseType === '' || xhr.responseType === 'text') ? xhr.responseText : ''; } catch (e) {}
                if (FreshDigCore.isRobotCheckResponse(403, function (n) { return xhr.getResponseHeader(n); }, body)) {
                    dlog('sc-xhr-robot-check', { path: apiPathForLog(xhr._scUrl) });
                    robotState.api = true;
                    apiBackoff.fail(Date.now());
                    refreshRobotState('sc-xhr');
                }
            } else if (xhr.status >= 200 && xhr.status < 300 && robotState.api && !apiBackoff.isBlocked(Date.now())) {
                robotState.api = false;
                apiBackoff.ok();
                refreshRobotState('sc-xhr-ok');
            }
        } catch (e) {}
    }

    // 3 秒ごとに、ロボット確認の画面（iframe）があるか見る。API 側で止まっている時は待ちが終わったら 1 回だけ試す
    setInterval(function () {
        try {
            const found = !!document.querySelector('iframe[src*="captcha-delivery.com"]');
            if (found !== robotState.iframe) {
                robotState.iframe = found;
                refreshRobotState('iframe');
            }
            if (robotState.api && !robotState.iframe && !apiBackoff.isBlocked(Date.now()) && !document.hidden) {
                scApi('me').catch(function () {});
            }
        } catch (e) {}
    }, 3000);

    // 音声要素の出来事（音が止まる不具合の調査用）。イベントは親へ伝わらないので capture で受ける
    ['pause', 'waiting', 'stalled', 'error', 'ended', 'volumechange'].forEach(function (evName) {
        document.addEventListener(evName, function (ev) {
            const m = ev.target;
            if (!m || (m.tagName !== 'AUDIO' && m.tagName !== 'VIDEO')) return;
            try {
                const d = { ct: Math.round((m.currentTime || 0) * 10) / 10, dur: isFinite(m.duration) ? Math.round(m.duration) : null,
                    vol: Math.round((m.volume || 0) * 100) / 100, muted: !!m.muted, ready: m.readyState, net: m.networkState };
                if (m.error) d.err = m.error.code;
                dlog('audio-' + evName, d);
            } catch (e) {}
        }, true);
    });
    document.addEventListener('visibilitychange', function () { dlog('tab-visibility', document.hidden ? 'hidden' : 'visible'); });

    // SoundCloud API v2 呼び出しの共通処理：client_id と最新トークンを付与し、401 なら最新トークンで1回だけ再試行
    async function scApi(pathOrUrl, options) {
        options = options || {};
        extractAuthTokenFromCookie();
        if (!state.clientId) await discoverClientId();
        const buildUrl = function () {
            const u = new URL(pathOrUrl.indexOf('http') === 0 ? pathOrUrl : ('https://api-v2.soundcloud.com/' + pathOrUrl.replace(/^\//, '')));
            if (state.clientId) u.searchParams.set('client_id', state.clientId);
            return u.toString();
        };
        const doFetch = function () {
            const headers = Object.assign({ 'Accept': 'application/json' }, options.headers || {});
            if (state.oauthToken) headers['Authorization'] = state.oauthToken;
            const init = { method: options.method || 'GET', headers: headers, credentials: 'include' };
            if (options.body !== undefined) {
                init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
                headers['Content-Type'] = 'application/json';
            }
            return apiFetch(buildUrl(), init);
        };
        let res = await doFetch();
        if (res.status === 401) {
            const before = state.oauthToken;
            state.capturedToken = null;
            state.injectedToken = null;
            lastAuthRequestAt = 0;
            requestAuthFromExtension();
            await new Promise(function (r) { setTimeout(r, 800); });
            extractAuthTokenFromCookie();
            if (state.oauthToken && state.oauthToken !== before) {
                console.warn('[SC-FreshStation] API 401 -> retrying with refreshed token');
                res = await doFetch();
            }
        }
        return res;
    }

    // content_bridge 経由のポップアップ操作に requestId 付きで応答する
    function replyToBridge(requestId, type, payload) {
        if (!requestId) return;
        const msg = { type: type, requestId: requestId };
        if (type === 'SC_FRESH_STATION_DATA_RESPONSE') {
            msg.data = payload;
        } else {
            msg.result = payload;
        }
        window.postMessage(msg, window.location.origin);
    }

    window.addEventListener('message', async function (event) {
        // 同一ウィンドウ（content_bridge / 自分自身）以外（iframe等）からのメッセージは無視
        if (event.source !== window || !event.data) return;

        if (event.data.type === 'SC_FRESH_STATION_RESTORE_STORAGE') {
            const d = event.data.data;
            if (d && d.targetPlaylistId) {
                state.targetPlaylistId = String(d.targetPlaylistId);
                localStorage.setItem(TARGET_PLAYLIST_KEY, state.targetPlaylistId);
                updatePlaylistButtonUI();
                console.log('[SC-FreshStation] Restored targetPlaylistId from extension storage:', state.targetPlaylistId);
            }
            if (d && (d.playbackMode === 'DISCOVERY' || d.playbackMode === 'FOLLOWING_NEW')) {
                state.playbackMode = normalizePlaybackMode(d.playbackMode);
                localStorage.setItem(PLAYBACK_MODE_KEY, state.playbackMode);
                updateModeButtonUI();
            }
            if (d && Array.isArray(d.laterArtists)) setLaterList(d.laterArtists);
            if (d && d.freshFilter) applyFreshFilter(d.freshFilter, { noSync: true, noBroadcast: true });
            if (d && typeof d.autoMiniPlayer === 'boolean' && d.autoMiniPlayer !== state.autoMiniPlayer) {
                setAutoMiniPlayer(d.autoMiniPlayer, { noSync: true });
            }
            if (d && d.preferredLanguage && d.preferredLanguage !== state.preferredLanguage) {
                state.preferredLanguage = d.preferredLanguage;
                try { localStorage.setItem(PREFERRED_LANGUAGE_KEY, state.preferredLanguage); } catch (e) {}
                updatePlayerBarTitles();
                syncMiniPlayerUI();
            }
            if (d && typeof d.discoveryEnabled === 'boolean' && d.discoveryEnabled !== state.discoveryEnabled) {
                state.discoveryEnabled = d.discoveryEnabled;
                try { localStorage.setItem(DISCOVERY_ENABLED_KEY, String(state.discoveryEnabled)); } catch (e) {}
                updateModeButtonUI();
            }
            return;
        }

        if (event.data.type === 'SC_FRESH_STATION_POPUP_ACTION') {
            const action = event.data.action;
            const targetType = event.data.targetType;
            const targetId = event.data.targetId;
            const requestId = event.data.requestId;
            const ack = function (result) {
                replyToBridge(requestId, 'SC_FRESH_STATION_ACTION_RESULT', result || { success: true });
            };

            try {
                if (action === 'INJECT_AUTH_TOKEN') {
                    if (event.data.token) {
                        state.injectedToken = toOAuthHeader(event.data.token);
                        extractAuthTokenFromCookie();
                        console.log('[SC-FreshStation] Received OAuth token from extension');
                        if (!state.isUserDataLoaded || state.myPlaylists.length === 0) {
                            initUserData();
                        }
                    }
                    ack();
                } else if (action === 'FORCE_SYNC') {
                    console.log('[SC-FreshStation] Force sync requested from popup');
                    await initUserData({ force: true });
                    ack({ success: state.isUserDataLoaded });
                } else if (action === 'REMOVE') {
                    if (targetType === 'track') delete state.dislikedTracks[targetId];
                    if (targetType === 'artist') delete state.dislikedArtists[targetId];
                    if (targetType === 'genre') delete state.dislikedGenres[targetId];
                    saveDislikeData();
                    ack();
                } else if (action === 'SET_TARGET_PLAYLIST') {
                    saveTargetPlaylist(targetId);
                    ack();
                } else if (action === 'SET_PLAYBACK_MODE') {
                    savePlaybackMode(event.data.mode);
                    ack();
                } else if (action === 'SET_LANGUAGE') {
                    state.preferredLanguage = event.data.language || 'auto';
                    try { localStorage.setItem(PREFERRED_LANGUAGE_KEY, state.preferredLanguage); } catch (e) {}
                    applyLanguage();
                    fdBus.post('lang', { language: state.preferredLanguage });
                    ack({ success: true, preferredLanguage: state.preferredLanguage });
                } else if (action === 'SET_FRESH_FILTER') {
                    applyFreshFilter(event.data.filter);
                    ack({ success: true, freshFilter: state.freshFilter });
                } else if (action === 'SET_AUTO_MINI_PLAYER') {
                    setAutoMiniPlayer(event.data.enabled !== false);
                    ack({ success: true, autoMiniPlayer: state.autoMiniPlayer });
                } else if (action === 'SET_DISCOVERY_ENABLED') {
                    setDiscoveryEnabled(event.data.enabled !== false, { silent: true });
                    ack({ success: true, discoveryEnabled: state.discoveryEnabled });
                } else if (action === 'EXPORT_DISLIKES') {
                    ack(await exportDislikesToPlaylist());
                } else if (action === 'IMPORT_DISLIKES') {
                    ack(await importDislikesFromPlaylist());
                } else if (action === 'START_STATION') {
                    ack(await startTrackStation());
                } else if (action === 'TOGGLE_MINI_PLAYER') {
                    toggleMiniPlayer();
                    ack();
                } else if (action === 'SET_VOLUME') {
                    if (typeof event.data.volume === 'number') {
                        setSoundCloudVolume(event.data.volume);
                    }
                    ack({ success: true, volume: getSoundCloudVolume() });
                } else if (action === 'TOGGLE_MUTE') {
                    toggleSoundCloudMute();
                    ack({ success: true, volume: getSoundCloudVolume() });
                } else if (action === 'GET_DIAG_LOG') {
                    ack({ success: true, text: getDiagLogText() });
                } else if (action === 'GET_DATA') {
                    loadCachedData();
                    extractAuthTokenFromCookie();
                    if (state.clientId && state.oauthToken && (!state.isUserDataLoaded || !state.myUserId || state.myPlaylists.length === 0)) {
                        initUserData();
                    }
                    replyToBridge(requestId, 'SC_FRESH_STATION_DATA_RESPONSE', {
                        dislikedTracks: state.dislikedTracks,
                        dislikedArtists: state.dislikedArtists,
                        dislikedGenres: state.dislikedGenres,
                        myPlaylists: state.myPlaylists,
                        targetPlaylistId: state.targetPlaylistId,
                        playbackMode: state.playbackMode,
                        discoveryEnabled: state.discoveryEnabled,
                        autoMiniPlayer: state.autoMiniPlayer,
                        autoPipSupported: 'documentPictureInPicture' in window,
                        preferredLanguage: state.preferredLanguage,
                        freshFilter: state.freshFilter,
                        likedCount: state.likedTrackIds.size,
                        followingCount: state.followingUserIds.size,
                        isReady: state.isUserDataLoaded,
                        loggedIn: !!state.oauthToken,
                        accountName: state.myUsername,
                        volume: getSoundCloudVolume(),
                        stats: getStats()
                    });
                } else {
                    ack({ success: false, message: 'Unknown action: ' + action });
                }
            } catch (e) {
                console.error('[SC-FreshStation] Popup action error (' + action + '):', e);
                ack({ success: false, message: tt('m_errorOcc', { msg: e && e.message }) });
            }
        }
    });

    loadCachedData();
    // 旧バージョンが保存していた（更新されずに失効する）トークンキャッシュを削除
    try { localStorage.removeItem(CACHE_OAUTH_TOKEN_KEY); } catch (e) {}
    extractAuthTokenFromCookie();

    // 拡張機能本体（chrome.storage.local）から最新設定の同期を要求
    window.postMessage({ type: 'SC_FRESH_STATION_REQUEST_STORAGE' }, window.location.origin);

    // 積極的 client_id 発見ロジック
    async function discoverClientId() {
        const cfgCid = getScConfigClientId();
        if (cfgCid) {
            state.clientId = cfgCid;
            return state.clientId;
        }
        if (state.clientId) return state.clientId;

        // 1. window.__sc_hydration
        try {
            if (window.__sc_hydration && Array.isArray(window.__sc_hydration)) {
                for (const item of window.__sc_hydration) {
                    if (item.hydratable === 'user' && item.data && item.data.id) {
                        state.myUserId = item.data.id;
                    }
                }
            }
        } catch (e) {}

        // 2. DOM内のスクリプトタグを走査
        try {
            const scripts = Array.from(document.querySelectorAll('script[src*="sndcdn.com"]'));
            for (const s of scripts) {
                if (s.src && s.src.indexOf('assets/') !== -1) {
                    const res = await originalFetch(s.src);
                    const txt = await res.text();
                    const m = txt.match(/client_id[:=]["']([a-zA-Z0-9]{32})["']/);
                    if (m && m[1]) {
                        state.clientId = m[1];
                        localStorage.setItem(CACHE_CLIENT_ID_KEY, m[1]);
                        console.log('[SC-FreshStation] Discovered client_id from script assets:', state.clientId);
                        return state.clientId;
                    }
                }
            }
        } catch (e) {}

        return state.clientId;
    }

    // 1. XMLHttpRequest Hook (SoundCloudの全XHR通信からclient_id/tokenを補足)
    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._scUrl = typeof url === 'string' ? url : '';
        if (this._scUrl.indexOf('api-v2.soundcloud.com') !== -1) {
            if (!this._scObserved) {
                this._scObserved = true;
                this.addEventListener('loadend', function () { observeScXhr(this); });
            }
            try {
                const parsed = new URL(this._scUrl, window.location.origin);
                if (parsed.searchParams.has('client_id')) {
                    const cid = parsed.searchParams.get('client_id');
                    if (cid && cid !== state.clientId) {
                        state.clientId = cid;
                        localStorage.setItem(CACHE_CLIENT_ID_KEY, cid);
                    }
                }
            } catch (e) {}
        }
        return origXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        try {
            if (header && header.toLowerCase() === 'authorization' && value && value.indexOf('OAuth ') === 0) {
                state.capturedToken = value;
                state.oauthToken = value;
                if (state.clientId && (!state.isUserDataLoaded || state.myPlaylists.length === 0)) {
                    initUserData();
                }
            }
        } catch (e) {}
        return origXhrSetRequestHeader.apply(this, arguments);
    };

    // 2. window.fetch Hook
    // ※ 2026-09 時点の SoundCloud は API 通信をすべて XMLHttpRequest で行っており、ページの曲リストも
    //    HTML に埋め込まれているため、下の B〜D（fetch 経由の書き換え）は実際にはほぼ動かない。
    //    発掘モードの本体は「曲の切替通知での即時スキップ」（hookScCurrentSoundChange）。
    const originalFetch = window.fetch;

    window.fetch = async function () {
        const args = Array.prototype.slice.call(arguments);
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');

        // A. Capture Auth Tokens & Client ID
        if (url.indexOf('api-v2.soundcloud.com') !== -1) {
            try {
                const parsedUrl = new URL(url, window.location.origin);
                if (parsedUrl.searchParams.has('client_id')) {
                    state.clientId = parsedUrl.searchParams.get('client_id');
                    localStorage.setItem(CACHE_CLIENT_ID_KEY, state.clientId);
                }
                const options = args[1];
                if (options && options.headers) {
                    const headers = options.headers;
                    const auth = (typeof headers.get === 'function' ? headers.get('Authorization') : headers.Authorization) || headers['authorization'];
                    if (auth && auth.indexOf('OAuth ') === 0) {
                        state.capturedToken = auth;
                        state.oauthToken = auth;
                    }
                }
                if (state.clientId && state.oauthToken && !state.isUserDataLoaded) {
                    initUserData();
                }
            } catch (e) {}
        }

        // B. Track current playing track info
        if (url.indexOf('api-v2.soundcloud.com/tracks/') !== -1) {
            const response = await originalFetch.apply(this, args);
            try {
                const clone = response.clone();
                const trackData = await clone.json();
                // 閲覧中の別ページ等の曲で「再生中の曲」を上書きしないよう、再生中hrefと一致する時だけ採用
                if (trackData && trackData.id && trackData.title && isCurrentlyPlayingTrack(trackData)) {
                    updateCurrentTrackInfo(trackData);
                }
            } catch (e) {}
            return response;
        }

        // C. Intercept Stream (タイムライン / Stream: フォロー中の新曲)
        if (url.indexOf('api-v2.soundcloud.com/stream') !== -1) {
            const response = await originalFetch.apply(this, args);
            if (FOLLOWING_NEW_MODE_ENABLED && state.discoveryEnabled && state.playbackMode === 'FOLLOWING_NEW') {
                try {
                    const clone = response.clone();
                    let data = await clone.json();
                    if (data && Array.isArray(data.collection)) {
                        const originalCount = data.collection.length;
                        // Streamアイテムから「本人の新曲ポスト（type === track）」のみを残し、リポストや除外対象をカット
                        data.collection = data.collection.filter(function (item) {
                            // 1. リポストは除外
                            if (item.type !== 'track') return false;

                            const track = item.track;
                            if (!track) return false;

                            const authorId = track.user ? track.user.id : track.user_id;

                            // 2. 自分がフォローしている人本人による投稿であること
                            if (!state.followingUserIds.has(authorId) && authorId !== state.myUserId) {
                                return false;
                            }

                            // 3. Dislike除外
                            if (state.dislikedTracks[track.id]) return false;
                            if (authorId && state.dislikedArtists[authorId]) return false;
                            const genre = (track.genre || '').trim().toLowerCase();
                            if (genre && state.dislikedGenres[genre]) return false;

                            return true;
                        });
                        console.log('[SC-FreshStation:FollowingMode] Stream filtered: ' + originalCount + ' -> ' + data.collection.length + ' tracks.');

                        return new Response(JSON.stringify(data), {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers
                        });
                    }
                } catch (e) {
                    console.error('[SC-FreshStation] Stream filter error:', e);
                }
            }
            return response;
        }

        // D. Intercept Station (ステーション再生)
        if (url.indexOf('/stations/') !== -1 && url.indexOf('/tracks') !== -1) {
            console.log('[SC-FreshStation] Intercepted Station tracks request:', url);
            const response = await originalFetch.apply(this, args);

            if (!state.isUserDataLoaded || !state.discoveryEnabled) {
                return response;
            }

            try {
                const clone = response.clone();
                let data = await clone.json();

                if (data && Array.isArray(data.collection)) {
                    const originalCount = data.collection.length;
                    data.collection = filterStationTracks(data.collection);
                    console.log('[SC-FreshStation] Filtered: ' + originalCount + ' -> ' + data.collection.length);

                    let nextHref = data.next_href;
                    let extraPages = 0;
                    extractAuthTokenFromCookie();
                    // 全曲除外されても無限にページを辿らないよう上限を設ける
                    while (data.collection.length < 10 && nextHref && extraPages < MAX_STATION_EXTRA_PAGES) {
                        extraPages++;
                        const nextUrl = nextHref.indexOf('client_id=') !== -1 ? nextHref : (nextHref + '&client_id=' + state.clientId);
                        const nextRes = await apiFetch(nextUrl, {
                            headers: state.oauthToken ? { 'Authorization': state.oauthToken } : {}
                        });
                        if (!nextRes.ok) break;
                        const nextData = await nextRes.json();
                        if (nextData && Array.isArray(nextData.collection)) {
                            const freshNext = filterStationTracks(nextData.collection);
                            data.collection.push.apply(data.collection, freshNext);
                            nextHref = nextData.next_href;
                        } else {
                            break;
                        }
                    }
                    data.next_href = nextHref;

                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }
            } catch (err) {
                console.error('[SC-FreshStation] Error filtering station response:', err);
                return response;
            }
        }

        return originalFetch.apply(this, args);
    };

    function filterStationTracks(tracks) {
        return tracks.filter(function (track) {
            if (!track) return false;

            const trackId = track.id;
            const artistId = track.user ? track.user.id : track.user_id;
            const genre = (track.genre || '').trim().toLowerCase();

            // 共通除外: Dislike
            if (state.dislikedTracks[trackId]) return false;
            if (artistId && state.dislikedArtists[artistId]) return false;
            if (genre && state.dislikedGenres[genre]) return false;
            if (state.myUserId && artistId === state.myUserId) return false;

            // モードによる分岐
            if (state.playbackMode === 'FOLLOWING_NEW') {
                // フォロー中アーティストのみ通過
                if (!artistId || !state.followingUserIds.has(artistId)) {
                    return false;
                }
            } else {
                // 未知の曲発掘モード (DISCOVERY): 既知・フォローを除外
                if (state.likedTrackIds.has(trackId)) return false;
                if (artistId && state.followingUserIds.has(artistId)) return false;
            }

            return true;
        });
    }

    // 同期処理の多重実行・連打防止用
    let userDataSyncPromise = null;
    let lastUserDataSyncAttempt = 0;

    // options.force: クールダウンを無視して必ず同期（ポップアップの「同期」ボタン等）
    // 全件同期は全タブで 1 回だけ: Web Locks で 1 タブだけが行い、6 時間以内の同期済みならキャッシュを読むだけ。
    // 終わったら BroadcastChannel で他のタブにキャッシュの読み直しを知らせる
    function initUserData(options) {
        const force = !!(options && options.force);
        if (userDataSyncPromise) return userDataSyncPromise;
        if (!force && Date.now() - lastUserDataSyncAttempt < AUTO_SYNC_COOLDOWN_MS) {
            return Promise.resolve();
        }
        lastUserDataSyncAttempt = Date.now();
        userDataSyncPromise = runUserDataSync(force).finally(function () {
            userDataSyncPromise = null;
        });
        return userDataSyncPromise;
    }

    function restoreMeFromCache() {
        try {
            const me = JSON.parse(localStorage.getItem(CACHE_ME_KEY) || 'null');
            if (me && me.id) {
                state.myUserId = me.id;
                state.myUsername = me.username || null;
                state.myPermalink = me.permalink || null;
                return true;
            }
        } catch (e) {}
        return false;
    }

    async function runUserDataSync(force) {
        const needsFull = function () {
            loadCachedData();
            const hasCache = (state.likedTrackIds.size > 0 || state.followingUserIds.size > 0) && !!localStorage.getItem(CACHE_ME_KEY);
            return FreshDigCore.shouldFullSync(localStorage.getItem(LAST_FULL_SYNC_KEY), Date.now(), { force: force, hasCache: hasCache });
        };
        if (!needsFull()) {
            restoreMeFromCache();
            updatePlaylistButtonUI();
            dlog('sync-skipped-recent');
            return;
        }
        if (!(navigator.locks && navigator.locks.request)) return doInitUserData();
        return navigator.locks.request('freshdig-sync', force ? {} : { ifAvailable: true }, async function (lock) {
            if (!lock) { dlog('sync-skipped-other-tab'); return; }
            // 順番待ちの間に別のタブが終えていたら、それを使う
            if (!needsFull()) { restoreMeFromCache(); updatePlaylistButtonUI(); return; }
            dlog('sync-start', { force: force });
            await doInitUserData();
        });
    }

    fdBus.on('cache-updated', function () {
        loadCachedData();
        restoreMeFromCache();
        updatePlaylistButtonUI();
    });

    // ページングAPIから全件取得。途中で失敗したら null を返す（既存キャッシュを壊さないため）
    async function fetchPaged(firstPath, maxCount, onItem) {
        let count = 0;
        let url = firstPath;
        while (url && count < maxCount) {
            const res = await scApi(url);
            if (!res.ok) return null;
            const d = await res.json();
            if (d && Array.isArray(d.collection)) {
                d.collection.forEach(function (item) {
                    if (onItem(item) !== false) count++;
                });
            }
            url = (d && d.next_href) ? d.next_href : null;
        }
        return count;
    }

    async function fetchPagedIds(firstPath, maxCount, pickId) {
        const ids = new Set();
        const ok = await fetchPaged(firstPath, maxCount, function (item) {
            const id = pickId(item);
            if (id === undefined || id === null || id === '') return false;
            ids.add(id);
        });
        return ok === null ? null : ids;
    }

    async function doInitUserData() {
        if (state.robotBlocked) return;
        extractAuthTokenFromCookie();
        if (!state.clientId) {
            await discoverClientId();
        }
        if (!state.clientId) {
            console.warn('[SC-FreshStation] Still waiting for clientId...');
            return;
        }
        if (!state.oauthToken) {
            await waitForAuthToken(1500);
        }

        console.log('[SC-FreshStation] Syncing user profile, playlists, likes...');

        try {
            let meData = null;
            try {
                const meRes = await scApi('me');
                if (meRes.ok) {
                    meData = await meRes.json();
                } else {
                    console.warn('[SC-FreshStation] /me returned ' + meRes.status + ' (SoundCloud未ログイン、またはトークン失効)');
                }
            } catch (e) {}

            if (meData && meData.id) {
                state.myUserId = meData.id;
                state.myUsername = meData.username || meData.permalink || null;
                state.myPermalink = meData.permalink ? String(meData.permalink).toLowerCase() : null;
                try { localStorage.setItem(CACHE_ME_KEY, JSON.stringify({ id: state.myUserId, username: state.myUsername, permalink: state.myPermalink })); } catch (e) {}
            } else {
                // ログインしていない（またはトークンが無効）なら、他人のデータで判定しないよう打ち切る
                state.myUsername = null;
                return;
            }

            // プレイリスト一覧取得（非公開含む・ページング対応）
            const playlists = [];
            const plOk = await fetchPaged('users/' + state.myUserId + '/playlists?limit=50&linked_partitioning=1', 200, function (p) {
                if (!p || !p.id) return false;
                playlists.push({ id: p.id, title: p.title || tt('m_untitled'), trackCount: p.track_count || 0 });
            });
            if (plOk !== null) {
                state.myPlaylists = playlists;
                if (state.targetPlaylistId && !playlists.some(function (p) { return String(p.id) === String(state.targetPlaylistId); })) {
                    console.warn('[SC-FreshStation] Saved target playlist no longer exists in your account:', state.targetPlaylistId);
                }
                if (!state.targetPlaylistId && playlists.length > 0) {
                    saveTargetPlaylist(playlists[0].id);
                }
                updatePlaylistButtonUI();
            }

            // ライク一覧（ID のみの軽いエンドポイントで全件。失敗時は従来の一覧から取得）
            // 新規Setに集めて成功時のみ置換 → いいね解除も反映される
            let likes = await fetchPagedIds('me/track_likes/ids?limit=200', MAX_LIKES_SYNC, toNumId);
            if (!likes) {
                likes = await fetchPagedIds(
                    'users/' + state.myUserId + '/track_likes?limit=200&linked_partitioning=1', MAX_LIKES_SYNC,
                    function (item) { return toNumId(item.track ? item.track.id : (item.target ? item.target.id : item.id)); }
                );
            }
            if (likes) state.likedTrackIds = likes;

            // フォロー一覧（同上 → フォロー解除も反映される）
            let followings = await fetchPagedIds('users/' + state.myUserId + '/followings/ids?limit=5000', MAX_FOLLOWINGS_SYNC, toNumId);
            if (!followings) {
                followings = await fetchPagedIds(
                    'users/' + state.myUserId + '/followings?limit=200&linked_partitioning=1', MAX_FOLLOWINGS_SYNC,
                    function (u) { return toNumId(u.id); }
                );
            }
            if (followings) state.followingUserIds = followings;

            // リポスト済み一覧・追加先プレイリストの中身（ボタン表示用）
            await syncRepostedTrackIds();
            refreshTargetPlaylistCache(true);

            if (likes || followings) {
                state.isUserDataLoaded = true;
            }
            saveCacheData();
            if (likes && followings) {
                try { localStorage.setItem(LAST_FULL_SYNC_KEY, String(Date.now())); } catch (e) {}
            }
            dlog('sync-finished', { likes: state.likedTrackIds.size, follows: state.followingUserIds.size, partial: !(likes && followings) });
            fdBus.post('cache-updated');
            console.log('[SC-FreshStation] Sync finished (@' + state.myUsername + '): ' + state.myPlaylists.length + ' playlists, ' + state.likedTrackIds.size + ' likes, ' + state.followingUserIds.size + ' followings.' + (likes && followings ? '' : ' (partial)'));
        } catch (e) {
            console.error('[SC-FreshStation] Failed to sync user data:', e);
        }
    }

    // プレイヤーバーに表示中の曲 href（例: /artist/track）を取得
    function getPlayingTrackHref() {
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        return titleEl ? (titleEl.getAttribute('href') || '') : '';
    }

    function normalizeTrackPath(hrefOrUrl) {
        if (!hrefOrUrl) return '';
        try {
            return new URL(hrefOrUrl, 'https://soundcloud.com').pathname.replace(/\/+$/, '').toLowerCase();
        } catch (e) {
            return '';
        }
    }

    function isCurrentlyPlayingTrack(track) {
        const playing = normalizeTrackPath(getPlayingTrackHref());
        const candidate = normalizeTrackPath(track.permalink_url);
        return !!playing && !!candidate && playing === candidate;
    }

    function updateCurrentTrackInfo(track) {
        state.currentTrack = {
            id: track.id,
            title: track.title,
            artistId: track.user ? track.user.id : track.user_id,
            artistName: track.user ? track.user.username : 'Unknown',
            artistPermalink: track.user ? (track.user.permalink || '') : '',
            avatarUrl: track.user ? (track.user.avatar_url || '') : '',
            genre: (track.genre || '').trim(),
            href: getPlayingTrackHref()
        };
    }

    // マージン制御用の状態管理
    const marginGuard = {
        lastTrackHref: '',
        loadStartTime: 0,
        hasChecked: false,
        lastSkipTime: 0,
        consecutiveSkips: 0
    };

    // 3. 定期監視タイマー (500ms おきに実行 / try-catchでエラー落ち完全防止)
    setInterval(function () {
        try {
            injectButtons();
        } catch (e) {
            console.warn('[SC-FreshStation] injectButtons exception:', e);
        }
        try {
            hookScCurrentSoundChange();
        } catch (e) {}
        try {
            monitorPlaybackWithMargin();
        } catch (e) {
            console.warn('[SC-FreshStation] monitorPlayback exception:', e);
        }
        try {
            updateHateButtons();
        } catch (e) {}
        try {
            broadcastNow();
        } catch (e) {}
        try {
            syncMiniPlayerUI();
        } catch (e) {
            console.warn('[SC-FreshStation] syncMiniPlayer exception:', e);
        }
        try {
            syncMediaSession();
        } catch (e) {
            console.warn('[SC-FreshStation] syncMediaSession exception:', e);
        }
    }, 500);

    // マージン付き再生監視＆安全自動スキップ
    // ユーザー自身が意図して開いているライブラリ・Likes一覧・自作プレイリストページかを判定
    function isExplicitLibraryPage() {
        try {
            const path = window.location.pathname.toLowerCase();
            // 自分のライブラリ（/you/likes, /you/sets, /you/history など）
            if (path.indexOf('/you/') === 0) return true;
            // 自分のプロフィールの Likes / プレイリスト（/自分のpermalink/likes, /自分のpermalink/sets/...）
            if (state.myPermalink && (path.indexOf('/' + state.myPermalink + '/likes') === 0 || path.indexOf('/' + state.myPermalink + '/sets') === 0)) {
                return true;
            }
        } catch (e) {}
        return false;
    }

    // ---- 発掘モードの除外判定（曲の切替通知と定期監視の両方から使う共通処理） ----
    function toNumId(v) {
        return FreshDigCore.toNumId(v);
    }

    // info: { id, artistId, title, artistName, genre }。スキップすべきなら理由のキー（skipReason...）、しないなら null
    // 判定の中身は freshdig_core.js（Node でテスト済み）
    function getSkipReason(info) {
        if (state.robotBlocked) return null;
        const base = FreshDigCore.getSkipReasonKey(info, {
            discoveryEnabled: state.discoveryEnabled,
            playbackMode: state.playbackMode,
            dislikedTracks: state.dislikedTracks,
            dislikedArtists: state.dislikedArtists,
            dislikedGenres: state.dislikedGenres,
            myUserId: state.myUserId,
            likedTrackIds: state.likedTrackIds,
            followingUserIds: state.followingUserIds,
            inLibrary: isExplicitLibraryPage(),
            onArtistPage: isOnLaterArtistPage()
        });
        if (base) return base;
        if (!state.discoveryEnabled || state.playbackMode !== 'DISCOVERY') return null;
        return getFreshReason(info);
    }

    // ---- R10: フレッシュさで飛ばす（既定 OFF。ほかの規則の後に見る） ----
    const FRESH_FILTER_KEY = 'sc_fresh_station_fresh_filter';
    const AUTHOR_STATS_KEY = 'sc_fresh_station_author_stats_v1';
    const FRESH_LATE_SKIP_SEC = 2; // 数字が遅れて分かったとき、再生開始からこの秒数以内なら飛ばす
    const AUTHOR_STATS_TTL = 7 * 86400000;
    const AUTHOR_STATS_MAX = 5000;
    const authorStats = { map: null, pending: {}, pendingCount: 0, saveTimer: null };

    try { state.freshFilter = FreshDigCore.normalizeFreshFilter(JSON.parse(localStorage.getItem(FRESH_FILTER_KEY) || 'null')); }
    catch (e) { state.freshFilter = FreshDigCore.normalizeFreshFilter(null); }

    function loadAuthorStats() {
        if (!authorStats.map) {
            let raw = {};
            try { raw = JSON.parse(localStorage.getItem(AUTHOR_STATS_KEY) || '{}') || {}; } catch (e) {}
            authorStats.map = FreshDigCore.pruneAuthorStats(raw, Date.now(), AUTHOR_STATS_TTL, AUTHOR_STATS_MAX);
        }
        return authorStats.map;
    }

    function saveAuthorStatsSoon() {
        if (authorStats.saveTimer) return;
        authorStats.saveTimer = setTimeout(function () {
            authorStats.saveTimer = null;
            try {
                authorStats.map = FreshDigCore.pruneAuthorStats(authorStats.map, Date.now(), AUTHOR_STATS_TTL, AUTHOR_STATS_MAX);
                localStorage.setItem(AUTHOR_STATS_KEY, JSON.stringify(authorStats.map));
            } catch (e) {}
        }, 2000);
    }

    function cachedAuthorStats(id) {
        const e = id ? loadAuthorStats()[String(id)] : null;
        return e && Date.now() - e.at < AUTHOR_STATS_TTL ? { followers: e.f, trackCount: e.t } : null;
    }

    // 作者のフォロワー数・投稿曲数が曲の情報に無いときだけ users/<id> を取りに行く（apiFetch の上限を通る。同時 3 件まで）
    function fetchAuthorStats(id) {
        const key = String(id);
        if (!id || authorStats.pending[key] || authorStats.pendingCount >= 3 || state.robotBlocked) return;
        if (cachedAuthorStats(id)) return;
        authorStats.pending[key] = true;
        authorStats.pendingCount++;
        scApi('users/' + key).then(function (res) {
            return res && res.ok ? res.json() : null;
        }).then(function (u) {
            if (u && typeof u.followers_count === 'number') {
                loadAuthorStats()[key] = { f: u.followers_count, t: typeof u.track_count === 'number' ? u.track_count : undefined, at: Date.now() };
                saveAuthorStatsSoon();
                onAuthorStatsArrived(key);
            }
        }).catch(function () {}).then(function () {
            delete authorStats.pending[key];
            authorStats.pendingCount--;
        });
    }

    function getFreshReason(info) {
        const ff = state.freshFilter;
        if (!ff || !info) return null;
        if (!(ff.followers.on || ff.trackCount.on || ff.playCount.on || ff.ageDays.on)) return null;
        if (isOnLaterArtistPage()) return null; // 「後で聴く作者」のページから聴いているときは効かせない
        const stats = Object.assign({}, info.stats || {});
        const cached = cachedAuthorStats(info.artistId);
        if (cached) {
            if (stats.followers === undefined) stats.followers = cached.followers;
            if (stats.trackCount === undefined) stats.trackCount = cached.trackCount;
        }
        const needFollowers = ff.followers.on && stats.followers === undefined;
        const needTracks = ff.trackCount.on && stats.trackCount === undefined;
        if ((needFollowers || needTracks) && info.artistId) fetchAuthorStats(info.artistId);
        return FreshDigCore.getFreshSkipReasonKey(stats, ff);
    }

    // 数字が分かった時: 今の曲なら再生開始から 5 秒以内だけ飛ばす。行列の先は先読みし直す
    function onAuthorStatsArrived(artistId) {
        try {
            const sound = getScCurrentSound();
            if (sound) {
                const info = soundToTrackInfo(sound);
                const pos = getPlaybackPositionSeconds();
                if (String(info.artistId) === String(artistId) && pos && pos.position <= FRESH_LATE_SKIP_SEC && info.id && (!info.kind || info.kind === 'track')) {
                    const reason = getSkipReason(info);
                    if (reason) doAutoSkip(reason, info);
                }
            }
        } catch (e) {}
        try { scheduleQueuePrune(); } catch (e) {}
    }

    function applyFreshFilter(raw, opts) {
        state.freshFilter = FreshDigCore.normalizeFreshFilter(raw);
        try { localStorage.setItem(FRESH_FILTER_KEY, JSON.stringify(state.freshFilter)); } catch (e) {}
        if (!(opts && opts.noSync)) {
            window.postMessage({ type: 'SC_FRESH_STATION_SYNC_STORAGE', key: 'freshFilter', value: state.freshFilter }, window.location.origin);
        }
        if (!(opts && opts.noBroadcast)) fdBus.post('fresh-filter', { f: state.freshFilter });
        try { scheduleQueuePrune(); } catch (e) {}
    }
    fdBus.on('fresh-filter', function (m) { applyFreshFilter(m.f, { noSync: true, noBroadcast: true }); });

    const MAX_CONSECUTIVE_AUTO_SKIPS = 20;

    // ---- 再生待ち行列の先読み（飛ばす曲を、音を読み込む前に行列から外す / 一気に飛ぶ） ----
    // SoundCloud の再生管理モジュールの行列（getQueue().models。各要素は .sound を持つ）。
    // removeItem(item) は今の曲以外を外せ、setCurrentItem(item, opts) は行列内の好きな曲へ直接移れる。
    const QUEUE_LOOKAHEAD = 30;
    const queueWatch = { queue: null, timer: null };

    function readScQueue(pm) {
        try {
            if (!pm || typeof pm.getQueue !== 'function' || typeof pm.getCurrentQueueItem !== 'function') return null;
            const q = pm.getQueue();
            const models = q && q.models;
            if (!Array.isArray(models)) return null;
            const curPos = models.indexOf(pm.getCurrentQueueItem());
            if (curPos < 0) return null;
            const infos = models.map(function (it) {
                try {
                    const i = soundToTrackInfo(it && it.sound);
                    return (i.id && (!i.kind || i.kind === 'track')) ? i : null;
                } catch (e) { return null; }
            });
            return { q: q, models: models, curPos: curPos, infos: infos };
        } catch (e) { return null; }
    }

    function pruneQueueAhead(source) {
        if (state.robotBlocked || !state.discoveryEnabled || state.playbackMode !== 'DISCOVERY' || !state.isUserDataLoaded) return 0;
        const pm = getScPlaybackManager();
        if (!pm || typeof pm.removeItem !== 'function') return 0;
        const qi = readScQueue(pm);
        if (!qi) return 0;
        const plan = FreshDigCore.planQueueAhead(qi.infos, qi.curPos, getSkipReason, QUEUE_LOOKAHEAD);
        let removed = 0;
        plan.remove.map(function (pos) { return qi.models[pos]; }).forEach(function (item) {
            try { pm.removeItem(item); removed++; } catch (e) {}
        });
        if (removed) dlog('queue-prune', { removed: removed, source: source });
        return removed;
    }

    // 今の曲を飛ばすとき、次に流してよい曲まで一気に移る。移れたら true
    function jumpToNextAllowedInQueue() {
        try {
            const pm = getScPlaybackManager();
            if (!pm || typeof pm.setCurrentItem !== 'function') return false;
            const qi = readScQueue(pm);
            if (!qi) return false;
            const plan = FreshDigCore.planQueueAhead(qi.infos, qi.curPos, getSkipReason, QUEUE_LOOKAHEAD);
            if (plan.firstKeep < 0 || plan.firstKeep === qi.curPos + 1) return false; // 隣なら普通の「次へ」でよい
            pm.setCurrentItem(qi.models[plan.firstKeep], { seek: 0, userInitiated: false });
            dlog('queue-jump', { over: plan.firstKeep - qi.curPos - 1 });
            return true;
        } catch (e) { return false; }
    }

    function scheduleQueuePrune() {
        if (queueWatch.timer) return;
        queueWatch.timer = setTimeout(function () {
            queueWatch.timer = null;
            try { pruneQueueAhead('queue-change'); } catch (e) {}
        }, 150);
    }

    // 行列に曲が足された時（ステーションの補充など）も先読みする
    function watchScQueue() {
        try {
            const pm = getScPlaybackManager();
            const q = pm && typeof pm.getQueue === 'function' ? pm.getQueue() : null;
            if (!q || typeof q.on !== 'function' || q === queueWatch.queue) return;
            queueWatch.queue = q;
            q.on('add reset', scheduleQueuePrune);
        } catch (e) {}
    }

    // 自動スキップ実行。連続しすぎたら（全部既知などの異常時）1曲だけそのまま流す
    // 5 曲を超えて連続したら 1 回ごとに 1.5 秒空ける（短時間の大量リクエストを避ける）
    const SKIP_SLOWDOWN_AFTER = 5;
    const SKIP_SLOWDOWN_MS = 1500;
    function doAutoSkip(reason, info) {
        if (state.robotBlocked) return false;
        if (marginGuard.consecutiveSkips >= MAX_CONSECUTIVE_AUTO_SKIPS) {
            console.warn('[SC-FreshStation] ⚠️ 連続スキップが' + MAX_CONSECUTIVE_AUTO_SKIPS + '曲に達したため、この曲はそのまま再生します。');
            showGlobalToast(tt('m_streakStop'));
            dlog('skip-brake', MAX_CONSECUTIVE_AUTO_SKIPS);
            marginGuard.consecutiveSkips = 0;
            return false;
        }
        marginGuard.lastSkipTime = Date.now();
        marginGuard.consecutiveSkips++;
        recordStat('totalSkips');
        const title = (info && info.title) || '';
        const reasonText = getI18nTexts()[reason] || reason;
        console.log('[SC-FreshStation] ⏩ Auto-skip [' + reason + ']: "' + title + '" (' + ((info && info.artistName) || '') + ')');
        showGlobalToast('⏩ ' + tt('skipToastPrefix') + ' (' + reasonText + ')' + (title ? ': ' + title : ''));
        dlog('auto-skip', { reason: reason, id: info && info.id, n: marginGuard.consecutiveSkips });

        const run = function () {
            // 行列の先まで飛ばす曲が続くなら、1 曲ずつ「次へ」せず一気に移る（音の読み込みを減らす）
            if (jumpToNextAllowedInQueue()) return true;
            const skipBtn = document.querySelector('.playControls__next');
            if (skipBtn) {
                skipBtn.click();
                return true;
            }
            const pm = getScPlaybackManager();
            if (pm) {
                try { pm.playNext({ userInitiated: false }); return true; } catch (e) {}
            }
            return false;
        };

        if (marginGuard.consecutiveSkips > SKIP_SLOWDOWN_AFTER) {
            const expectId = info && toNumId(info.id);
            try { const pm0 = getScPlaybackManager(); if (pm0 && pm0.pauseCurrent) pm0.pauseCurrent(); } catch (e) {}
            setTimeout(function () {
                if (state.robotBlocked) return;
                // 待っている間にユーザーが別の曲へ動かしていたら何もしない
                const cur = getScCurrentSound();
                if (expectId && cur && toNumId(cur.id) !== expectId) return;
                run();
            }, SKIP_SLOWDOWN_MS);
            return true;
        }
        return run();
    }

    // ---- 曲の切替を SoundCloud 本体から即座に受け取る（再生が始まる前に判定・スキップできる） ----
    const soundChangeState = { hooked: false, decidedPath: '', decidedAt: 0 };

    function soundToTrackInfo(sound) {
        const a = (sound && sound.attributes) || {};
        const user = a.user || {};
        let path = '';
        try { path = a.permalink_url ? new URL(a.permalink_url).pathname : ''; } catch (e) {}
        const stats = {};
        if (typeof user.followers_count === 'number') stats.followers = user.followers_count;
        if (typeof user.track_count === 'number') stats.trackCount = user.track_count;
        if (typeof a.playback_count === 'number') stats.playCount = a.playback_count;
        const created = a.created_at ? Date.parse(a.created_at) : NaN;
        if (isFinite(created)) stats.createdAt = created;
        return {
            stats: stats,
            id: toNumId(sound && sound.id !== undefined ? sound.id : a.id),
            artistId: toNumId(a.user_id !== undefined ? a.user_id : user.id),
            title: a.title || '',
            artistName: user.username || '',
            artistPermalink: user.permalink || '',
            avatarUrl: user.avatar_url || '',
            genre: (a.genre || '').trim(),
            href: path,
            kind: a.kind || ''
        };
    }

    function onScCurrentSoundChanged() {
        const sound = getScCurrentSound();
        if (!sound) return;
        const info = soundToTrackInfo(sound);
        if (!info.id || (info.kind && info.kind !== 'track')) return;

        state.currentTrack = {
            id: info.id,
            title: info.title,
            artistId: info.artistId,
            artistName: info.artistName,
            artistPermalink: info.artistPermalink,
            avatarUrl: info.avatarUrl,
            genre: info.genre,
            href: info.href
        };

        // ➕ ボタンの表示（追加済みなら ✔）を今の曲に合わせる
        updatePlaylistButtonUI();
        refreshTargetPlaylistCache(false);

        // 定期監視側で同じ曲を二重判定しないよう記録
        soundChangeState.decidedPath = normalizeTrackPath(info.href);
        soundChangeState.decidedAt = Date.now();

        const reason = getSkipReason(info);
        if (reason) {
            doAutoSkip(reason, info);
        } else if (state.discoveryEnabled) {
            marginGuard.consecutiveSkips = 0;
        }
        watchScQueue();
        pruneQueueAhead('sound-change');
    }

    function hookScCurrentSoundChange() {
        if (soundChangeState.hooked) return;
        const pm = getScPlaybackManager();
        if (!pm || typeof pm.on !== 'function') return;
        try {
            pm.on('change:currentSound', function () {
                // 本体の切替処理が終わってから判定する
                setTimeout(function () {
                    try { onScCurrentSoundChanged(); } catch (e) { console.warn('[SC-FreshStation] sound change handler error:', e); }
                }, 0);
            });
            soundChangeState.hooked = true;
            console.log('[SC-FreshStation] Hooked SoundCloud track-change events (instant skip enabled)');
        } catch (e) {}
    }

    // 今の曲の再生位置（ミリ秒）。分からなければ 0
    function getPlaybackPositionMs() {
        try {
            const snd = getScCurrentSound();
            if (snd && typeof snd.currentTime === 'function') {
                const v = Number(snd.currentTime());
                return isFinite(v) && v > 0 ? v : 0;
            }
        } catch (e) {}
        return 0;
    }

    // 定期監視（フォールバック）：切替通知が使えない場合や、DOM の Like 表示での判定用
    function monitorPlaybackWithMargin() {
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        const likeBtn = document.querySelector('.playbackSoundBadge__like');

        if (!titleEl || !artistEl) return;

        const currentHref = titleEl.getAttribute('href') || '';
        const title = titleEl.getAttribute('title') || (titleEl.textContent ? titleEl.textContent.trim() : '');
        const artist = artistEl.getAttribute('title') || (artistEl.textContent ? artistEl.textContent.trim() : '');

        if (!currentHref || !title) return;

        const now = Date.now();

        // 1. 新しい曲に切り替わったことを検知
        if (currentHref !== marginGuard.lastTrackHref) {
            marginGuard.lastTrackHref = currentHref;
            marginGuard.loadStartTime = now;
            marginGuard.hasChecked = false;

            const samePath = normalizeTrackPath(currentHref);
            if (state.currentTrack && state.currentTrack.id && normalizeTrackPath(state.currentTrack.href) === samePath) {
                // 切替通知で既に曲情報を取得済み（上書きしない）
            } else {
                state.currentTrack = {
                    id: null,
                    title: title,
                    artistName: artist,
                    artistId: null,
                    href: currentHref,
                    genre: ''
                };
                ensureCurrentTrackInfo().then(function () { updatePlaylistButtonUI(); });
            }
            updatePlaylistButtonUI();
            refreshTargetPlaylistCache(false);
            return;
        }

        // 2. この曲ですでに判定完了していれば何もしない（1曲につき1回）
        if (marginGuard.hasChecked) return;

        // 3. 表示が安定するまで少し待つ
        if (now - marginGuard.loadStartTime < 800) return;

        // 4. 前回スキップ直後は待つ（連打ループ防止）
        if (now - marginGuard.lastSkipTime < 1500) return;

        // 5. ID 未解決なら最大 4 秒待つ（ID 登録の Dislike / Likes / フォロー判定のため）
        if (!(state.currentTrack && state.currentTrack.id) && now - marginGuard.loadStartTime < 4000) return;

        marginGuard.hasChecked = true;
        if (!state.discoveryEnabled || state.playbackMode !== 'DISCOVERY') return;
        // 曲の途中（再生開始から 5 秒より後）では自動スキップしない（聴いている曲を後から飛ばさない）
        if (getPlaybackPositionMs() > 5000) {
            dlog('monitor-skip-ignored-midtrack', getPlaybackPositionMs());
            return;
        }

        const pathNow = normalizeTrackPath(currentHref);
        const alreadyDecided = soundChangeState.decidedPath === pathNow && now - soundChangeState.decidedAt < 15000;

        const info = {
            id: state.currentTrack && state.currentTrack.id,
            artistId: state.currentTrack && state.currentTrack.artistId,
            title: title,
            artistName: artist,
            genre: (state.currentTrack && state.currentTrack.genre) || ''
        };

        // 切替通知で判定済みの曲は、DOM の Like 表示（Likes 一覧の上限外やその場でのライク）だけ追加確認
        let reason = alreadyDecided ? null : getSkipReason(info);
        if (!reason && !isExplicitLibraryPage() && !isOnLaterArtistPage() && likeBtn) {
            const isSelected = likeBtn.classList.contains('sc-button-selected');
            const ariaChecked = likeBtn.getAttribute('aria-checked') === 'true';
            const titleAttr = (likeBtn.getAttribute('title') || '').toLowerCase();
            if (isSelected || ariaChecked || titleAttr.indexOf('unlike') !== -1) {
                reason = 'skipReasonLiked';
            }
        }

        if (reason) {
            doAutoSkip(reason, info);
        } else if (!alreadyDecided) {
            marginGuard.consecutiveSkips = 0;
        }
    }

    // R9: FreshDig のボタンは SoundCloud の曲名欄(.playbackSoundBadge__actions)に入れず、プレイヤー部分の専用の枠に置く。
    // 常に出すのは 👎 🚫 ➕ と「⋯」。残り(🔍 📻 🪟)は「⋯」のメニューに入れる
    function ensureFreshBar() {
        const host = document.querySelector('.playControls__elements');
        if (!host) return null;
        let bar = document.getElementById('sc-fresh-station-bar');
        if (bar && bar.parentElement === host) return bar;
        if (bar) bar.remove();
        bar = document.createElement('div');
        bar.id = 'sc-fresh-station-bar';
        bar.style.cssText = 'position:relative;display:inline-flex;align-items:center;flex:0 0 auto;margin-left:8px;';
        const menu = document.createElement('div');
        menu.id = 'sc-fresh-station-menu';
        menu.style.cssText = 'display:none;position:absolute;bottom:34px;right:0;z-index:2147483645;background:#222;border:1px solid #555;border-radius:6px;padding:4px 6px 4px 1px;box-shadow:0 4px 15px rgba(0,0,0,0.5);white-space:nowrap;';
        bar.appendChild(menu);
        const more = document.createElement('button');
        more.id = 'sc-fresh-station-more-btn';
        more.type = 'button';
        more.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
        more.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #777; background: transparent; color: #ccc; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
        more.textContent = '⋯';
        more.title = 'FreshDig';
        more.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
        bar.appendChild(more);
        document.addEventListener('click', function (e) {
            if (menu.style.display !== 'none' && !bar.contains(e.target)) menu.style.display = 'none';
        }, true);
        const vol = host.querySelector('.playControls__volume');
        if (vol && vol.nextSibling) host.insertBefore(bar, vol.nextSibling); else host.appendChild(bar);
        return bar;
    }

    function injectButtons() {
        const bar = ensureFreshBar();
        if (!bar) return;
        const menuGroup = document.getElementById('sc-fresh-station-menu');   // 「⋯」の中
        const moreBtn = document.getElementById('sc-fresh-station-more-btn');
        const addMain = function (el) { bar.insertBefore(el, moreBtn); };

        // 0. 発掘モード切替ボタン (アイコン: 🔍 または 👥)
        if (!document.getElementById('sc-fresh-station-mode-btn')) {
            const modeBtn = document.createElement('button');
            modeBtn.id = 'sc-fresh-station-mode-btn';
            modeBtn.type = 'button';
            modeBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            modeBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle; transition: all 0.15s ease;';
            modeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                toggleDiscoveryEnabled();
            });
            addMain(modeBtn);
        }
        updateModeButtonUI();

        // 1. ステーション開始ボタン (アイコン: 📻)
        if (!document.getElementById('sc-fresh-station-station-btn')) {
            const stBtn = document.createElement('button');
            stBtn.id = 'sc-fresh-station-station-btn';
            stBtn.type = 'button';
            stBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            stBtn.title = getI18nTexts().barStationTitle;
            stBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #00e676; background: transparent; color: #00e676; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle; transition: all 0.15s ease;';
            stBtn.innerHTML = '📻';
            stBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                startTrackStation();
            });
            menuGroup.appendChild(stBtn);
        }

        // 2. Never Playボタン (アイコン1個: ⏭️) - この曲だけ除外
        if (!document.getElementById('sc-fresh-station-dislike-btn')) {
            const btn = document.createElement('button');
            btn.id = 'sc-fresh-station-dislike-btn';
            btn.type = 'button';
            btn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            btn.title = getI18nTexts().barDislikeTitle;
            btn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #ff5500; color: #ff5500; background: transparent; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            btn.innerHTML = '⏭️';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                handleDislikeClick();
            });
            addMain(btn);
        }

        // 3. Block Artist (Hate) ボタン (アイコン1個: 🤬) - この作者の曲すべてを除外
        if (!document.getElementById('sc-fresh-station-hate-btn')) {
            const hateBtn = document.createElement('button');
            hateBtn.id = 'sc-fresh-station-hate-btn';
            hateBtn.type = 'button';
            hateBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            hateBtn.title = getI18nTexts().barHateTitle;
            hateBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #e53935; color: #e53935; background: transparent; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            hateBtn.innerHTML = '🤬';
            hateBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                handleHateClick().then(function (r) { showGlobalToast(hateToastText(r)); });
            });
            menuGroup.appendChild(hateBtn);
        }

        // 3.5 後で聴くボタン (🧐)
        if (!document.getElementById('sc-fresh-station-later-btn')) {
            const lb = document.createElement('button');
            lb.id = 'sc-fresh-station-later-btn';
            lb.type = 'button';
            lb.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            lb.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #7e57c2; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            lb.innerHTML = '🧐';
            lb.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                toggleLater().then(showGlobalToast);
            });
            menuGroup.appendChild(lb);
            updateLaterButton();
        }

        // 4. プレイリスト一発挿入ボタン (アイコン1個: ➕)
        if (!document.getElementById('sc-fresh-station-playlist-btn')) {
            const plBtn = document.createElement('button');
            plBtn.id = 'sc-fresh-station-playlist-btn';
            plBtn.type = 'button';
            plBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            plBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #ff5500; background: #ff5500; color: #fff; font-size: 13px; font-weight: bold; cursor: pointer; line-height: 1; vertical-align: middle;';
            plBtn.innerHTML = '➕';
            
            plBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                handleAddTrackToPlaylist();
            });

            plBtn.addEventListener('contextmenu', function (e) {
                e.stopPropagation();
                e.preventDefault();
                chooseTargetPlaylistPrompt();
            });

            addMain(plBtn);
            updatePlaylistButtonUI();
        }

        // 5. ミニプレイヤー起動ボタン (アイコン1個: 🪟)
        if (!document.getElementById('sc-fresh-station-miniplayer-btn')) {
            const mpBtn = document.createElement('button');
            mpBtn.id = 'sc-fresh-station-miniplayer-btn';
            mpBtn.type = 'button';
            mpBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            mpBtn.title = getI18nTexts().barMiniPlayerTitle;
            mpBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #777; background: transparent; color: #ccc; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle;';
            mpBtn.innerHTML = '🪟';
            mpBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                toggleMiniPlayer();
            });
            addMain(mpBtn);
        }
    }

    // 言語を変えたとき: ページのボタン・開いているミニプレイヤーの文字をすぐ入れ替える（R2）
    function applyLanguage() {
        try { updatePlayerBarTitles(); } catch (e) {}
        try { updatePlaylistButtonUI(); } catch (e) {}
        try {
            if (miniPlayerWindow && !miniPlayerWindow.closed) {
                const doc = miniPlayerWindow.document;
                const tx = getI18nTexts();
                doc.title = tx.mpTitle;
                const set = function (id, key, withText) {
                    const el = doc.getElementById(id);
                    if (!el) return;
                    el.title = (tx)[key];
                    if (withText) el.textContent = (tx)[withText];
                };
                set('mp-follow', 'mpFollowBtnTitle', null);
                set('mp-station', 'mpStationBtnTitle', 'mpStationBtn');
                set('mp-prev', 'mpPrevTitle');
                set('mp-play', 'mpPlayTitle');
                set('mp-like', 'mpLikeTitle');
                set('mp-add-pl', 'mpAddPlTitle');
                set('mp-dislike', 'mpDislikeTitle');
                set('mp-hate', 'mpHateTitle');
                set('mp-vol-icon', 'volMute');
                set('mp-vol-input', 'volSliderTitle');
            }
        } catch (e) {}
        try { syncMiniPlayerUI(); } catch (e) {}
    }
    fdBus.on('lang', function (m) {
        if (!m.language || m.language === state.preferredLanguage) return;
        state.preferredLanguage = m.language;
        try { localStorage.setItem(PREFERRED_LANGUAGE_KEY, state.preferredLanguage); } catch (e) {}
        applyLanguage();
    });

    function updatePlayerBarTitles() {
        const tx = getI18nTexts();
        const stBtn = document.getElementById('sc-fresh-station-station-btn');
        if (stBtn) stBtn.title = tx.barStationTitle;
        const dislikeBtn = document.getElementById('sc-fresh-station-dislike-btn');
        if (dislikeBtn) dislikeBtn.title = tx.barDislikeTitle;
        const hateBtn = document.getElementById('sc-fresh-station-hate-btn');
        if (hateBtn) hateBtn.title = tx.barHateTitle;
        const mpBtn = document.getElementById('sc-fresh-station-miniplayer-btn');
        if (mpBtn) mpBtn.title = tx.barMiniPlayerTitle;
        updateModeButtonUI();
    }

    function updateModeButtonUI() {
        const btn = document.getElementById('sc-fresh-station-mode-btn');
        if (!btn) return;
        const tx = getI18nTexts();
        if (!state.discoveryEnabled) {
            btn.innerHTML = '🔍';
            btn.style.borderColor = '#555';
            btn.style.color = '#777';
            btn.style.background = 'transparent';
            btn.style.opacity = '0.55';
            btn.title = tx.barDiscoveryOffTitle;
            return;
        }
        btn.style.opacity = '1';
        if (state.playbackMode === 'DISCOVERY') {
            btn.innerHTML = '🔍';
            btn.style.borderColor = '#ff5500';
            btn.style.color = '#ffaa00';
            btn.style.background = 'rgba(255, 85, 0, 0.15)';
            btn.title = tx.barDiscoveryOnTitle;
        } else {
            btn.innerHTML = '👥';
            btn.style.borderColor = '#29b6f6';
            btn.style.color = '#4fc3f7';
            btn.style.background = 'rgba(41, 182, 246, 0.15)';
            btn.title = tx.barFollowingModeTitle;
        }
    }

    function saveTargetPlaylist(targetId) {
        if (!targetId) return;
        state.targetPlaylistId = String(targetId);
        try {
            localStorage.setItem(TARGET_PLAYLIST_KEY, state.targetPlaylistId);
        } catch (e) {}
        updatePlaylistButtonUI();
        refreshTargetPlaylistCache(true);
        window.postMessage({
            type: 'SC_FRESH_STATION_SYNC_STORAGE',
            key: 'targetPlaylistId',
            value: state.targetPlaylistId
        }, window.location.origin);
        console.log('[SC-FreshStation] Target playlist saved & synced to extension storage:', state.targetPlaylistId);
    }

    function savePlaybackMode(mode) {
        if (mode !== 'DISCOVERY' && mode !== 'FOLLOWING_NEW') return;
        state.playbackMode = normalizePlaybackMode(mode);
        try {
            localStorage.setItem(PLAYBACK_MODE_KEY, state.playbackMode);
        } catch (e) {}
        updateModeButtonUI();
        window.postMessage({
            type: 'SC_FRESH_STATION_SYNC_STORAGE',
            key: 'playbackMode',
            value: state.playbackMode
        }, window.location.origin);
        console.log('[SC-FreshStation] Playback mode saved & synced to extension storage:', state.playbackMode);
    }

    // 追加先プレイリストに入っている曲IDのキャッシュ（ボタンを「追加」か「外す」かで表示するため）
    const targetPlaylistCache = { playlistId: null, ids: new Set(), fetchedAt: 0, loading: false };

    function getTargetPlaylistName() {
        const found = state.myPlaylists.find(function (p) { return String(p.id) === String(state.targetPlaylistId); });
        return found ? found.title : tt('m_savedTo');
    }

    // 今の曲が追加先プレイリストに入っているか（キャッシュ基準。不明なら false）
    function isCurrentTrackInTargetPlaylist() {
        const id = state.currentTrack && toNumId(state.currentTrack.id);
        return !!(id && targetPlaylistCache.playlistId === String(state.targetPlaylistId) && targetPlaylistCache.ids.has(id));
    }

    function setTargetPlaylistCache(playlistId, ids) {
        targetPlaylistCache.playlistId = String(playlistId);
        targetPlaylistCache.ids = new Set(ids.map(toNumId).filter(Boolean));
        targetPlaylistCache.fetchedAt = Date.now();
    }

    // 追加先プレイリストの中身を取得してキャッシュ（60秒以内なら再取得しない）
    async function refreshTargetPlaylistCache(force) {
        if (!state.targetPlaylistId || targetPlaylistCache.loading) return;
        const same = targetPlaylistCache.playlistId === String(state.targetPlaylistId);
        if (!force && same && Date.now() - targetPlaylistCache.fetchedAt < 60000) return;
        if (!getAuthToken()) return;
        targetPlaylistCache.loading = true;
        try {
            const res = await scApi('playlists/' + state.targetPlaylistId);
            if (res.ok) {
                const data = await res.json();
                setTargetPlaylistCache(state.targetPlaylistId, (data.tracks || []).map(function (t) { return t.id; }));
            }
        } catch (e) {
        } finally {
            targetPlaylistCache.loading = false;
            updatePlaylistButtonUI();
        }
    }

    function updatePlaylistButtonUI() {
        const inPl = isCurrentTrackInTargetPlaylist();
        const name = state.targetPlaylistId ? getTargetPlaylistName() : '';
        const title = !state.targetPlaylistId
            ? tt('m_plBtnNoTarget')
            : (inPl
                ? tt('m_plBtnIn', { name: name })
                : tt('m_plBtnOut', { name: name }));

        const btn = document.getElementById('sc-fresh-station-playlist-btn');
        if (btn && btn.innerHTML !== '⏳') {
            btn.title = title;
            btn.innerHTML = inPl ? '✔' : '➕';
            btn.style.background = inPl ? '#00c853' : '#ff5500';
            btn.style.borderColor = inPl ? '#00c853' : '#ff5500';
        }

        if (miniPlayerWindow && !miniPlayerWindow.closed) {
            try {
                const mpBtn = miniPlayerWindow.document.getElementById('mp-add-pl');
                if (mpBtn && mpBtn.textContent !== '⏳') {
                    mpBtn.title = title;
                    mpBtn.textContent = inPl ? '✔' : '➕';
                    mpBtn.classList.toggle('in-pl', inPl);
                }
            } catch (e) {}
        }
    }

    // 画面内のプレイリスト選択パネル（prompt()/alert() はミニプレイヤーからだと裏の窓に出て見えないため）
    function showPlaylistPicker(doc, playlists, currentId) {
        doc = doc || document;
        return new Promise(function (resolve) {
            const tx = getI18nTexts();
            const old = doc.getElementById('sc-fresh-station-pl-picker');
            if (old) old.remove();

            const overlay = doc.createElement('div');
            overlay.id = 'sc-fresh-station-pl-picker';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

            const panel = doc.createElement('div');
            panel.style.cssText = 'background:#1a1a1a;color:#eee;border:1px solid #ff5500;border-radius:8px;width:min(320px,92vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,0.6);';

            const head = doc.createElement('div');
            head.textContent = tx.pickerTitle;
            head.style.cssText = 'padding:10px 12px;font-size:13px;font-weight:bold;border-bottom:1px solid #333;';
            panel.appendChild(head);

            const list = doc.createElement('div');
            list.style.cssText = 'overflow-y:auto;padding:4px 0;';
            const done = function (value) {
                doc.removeEventListener('keydown', onKey, true);
                overlay.remove();
                resolve(value);
            };
            const onKey = function (e) { if (e.key === 'Escape') done(null); };

            playlists.forEach(function (p) {
                const item = doc.createElement('button');
                item.type = 'button';
                const isCur = String(p.id) === String(currentId);
                const tCount = tx.trackCountSuffix ? (' ' + tx.trackCountSuffix) : '曲'; item.textContent = (isCur ? '★ ' : '') + p.title + ' (' + p.trackCount + tCount + ')';
                item.style.cssText = 'display:block;width:100%;text-align:left;background:' + (isCur ? 'rgba(255,85,0,0.18)' : 'transparent') + ';color:#eee;border:none;padding:7px 12px;font-size:12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                item.addEventListener('mouseenter', function () { item.style.background = '#333'; });
                item.addEventListener('mouseleave', function () { item.style.background = isCur ? 'rgba(255,85,0,0.18)' : 'transparent'; });
                item.addEventListener('click', function () { done(p); });
                list.appendChild(item);
            });
            panel.appendChild(list);

            const cancel = doc.createElement('button');
            cancel.type = 'button';
            cancel.textContent = tx.pickerCancel;
            cancel.style.cssText = 'margin:8px 12px 10px;padding:6px;background:#2a2a2a;color:#bbb;border:1px solid #444;border-radius:4px;cursor:pointer;font-size:12px;';
            cancel.addEventListener('click', function () { done(null); });
            panel.appendChild(cancel);

            overlay.addEventListener('click', function (e) { if (e.target === overlay) done(null); });
            doc.addEventListener('keydown', onKey, true);
            overlay.appendChild(panel);
            (doc.body || doc.documentElement).appendChild(overlay);
        });
    }

    async function chooseTargetPlaylistPrompt(doc) {
        doc = doc || document;
        if (!state.myPlaylists || state.myPlaylists.length === 0) {
            showGlobalToast(tt('m_plFetching'));
            await initUserData({ force: true });
        }

        if (!state.myUserId) {
            showGlobalToast(tt('m_plNoLogin'));
            return null;
        }
        if (!state.myPlaylists || state.myPlaylists.length === 0) {
            showGlobalToast(tt('m_plNone'));
            return null;
        }

        const selected = await showPlaylistPicker(doc, state.myPlaylists, state.targetPlaylistId);
        if (!selected) return null;
        saveTargetPlaylist(selected.id);
        showGlobalToast(tt('m_plTargetSet', { name: selected.title }));
        return selected;
    }

    let isAddingToPlaylist = false;

    // ➕ ボタン：今の曲が追加先に入っていなければ追加、入っていれば外す（2回目の押下で外す）
    async function handleAddTrackToPlaylist(doc) {
        if (isAddingToPlaylist) return false; // 連打による二重操作を防止
        isAddingToPlaylist = true;
        const btn = document.getElementById('sc-fresh-station-playlist-btn');
        const setBusy = function (busy) {
            if (btn) btn.innerHTML = busy ? '⏳' : btn.innerHTML;
            if (miniPlayerWindow && !miniPlayerWindow.closed) {
                try {
                    const mpBtn = miniPlayerWindow.document.getElementById('mp-add-pl');
                    if (mpBtn && busy) mpBtn.textContent = '⏳';
                } catch (e) {}
            }
        };
        try {
            const track = await ensureCurrentTrackInfo();
            if (!track || !track.id) {
                showGlobalToast(tt('m_noTrackInfo'));
                return false;
            }
            const trackId = Number(track.id);

            // 認証トークンの確認（最新の Cookie / SoundCloud 本体のトークンを使用）
            if (!(await waitForAuthToken(1500))) {
                showGlobalToast(tt('m_loginToken'));
                return false;
            }

            // 追加先プレイリストのチェック
            if (!state.targetPlaylistId) {
                showGlobalToast(tt('m_pickTarget'));
                const selected = await chooseTargetPlaylistPrompt(doc);
                if (!selected) {
                    showGlobalToast(tt('m_plAborted'));
                    return false;
                }
            }

            setBusy(true);

            // 最新のプレイリストの中身を見て、追加か削除かを決める（キャッシュだけで判断しない）
            const toggleInPlaylist = async function (plId) {
                const plRes = await scApi('playlists/' + plId);
                if (plRes.status === 401 || plRes.status === 403) return { authError: true, status: plRes.status };
                if (!plRes.ok) return { notFound: true, status: plRes.status };

                const plData = await plRes.json();
                const plTitle = plData.title || tt('m_plDefaultName');
                const currentTrackIds = (plData.tracks || []).map(function (t) { return Number(t.id); }).filter(function (id) { return id > 0; });
                const isIn = currentTrackIds.indexOf(trackId) !== -1;

                let nextIds;
                if (isIn) {
                    nextIds = currentTrackIds.filter(function (id) { return id !== trackId; });
                } else {
                    if (currentTrackIds.length >= 500) return { full: true, plTitle: plTitle };
                    nextIds = currentTrackIds.concat([trackId]);
                }

                const putRes = await scApi('playlists/' + plId, {
                    method: 'PUT',
                    body: { playlist: { tracks: nextIds } }
                });
                if (putRes.ok) {
                    setTargetPlaylistCache(plId, nextIds);
                    return { success: true, removed: isIn, plTitle: plTitle, count: nextIds.length };
                }
                if (putRes.status === 401 || putRes.status === 403) return { authError: true, status: putRes.status };
                return { failed: true, status: putRes.status };
            };

            let res = await toggleInPlaylist(state.targetPlaylistId);

            // プレイリストが見つからない（削除済み・別アカウントのID等）なら再選択して再試行
            if (res.notFound) {
                showGlobalToast(tt('m_plTargetMissing'));
                const newSelected = await chooseTargetPlaylistPrompt(doc);
                if (!newSelected) {
                    showGlobalToast(tt('m_plNoTargetAbort'));
                    return false;
                }
                res = await toggleInPlaylist(state.targetPlaylistId);
            }

            if (res.authError) {
                showGlobalToast(tt('m_authFail', { s: res.status }));
                return false;
            }
            if (res.full) {
                showGlobalToast(tt('m_plFull', { name: res.plTitle }));
                return false;
            }
            if (res.success) {
                const pl = state.myPlaylists.find(function (p) { return String(p.id) === String(state.targetPlaylistId); });
                if (pl) pl.trackCount = res.count;
                if (res.removed) {
                    console.log('[SC-FreshStation] Removed track ' + trackId + ' from playlist ' + state.targetPlaylistId);
                    showGlobalToast(tt('m_plRemoved', { track: track.title, name: res.plTitle }));
                } else {
                    console.log('[SC-FreshStation] Added track ' + trackId + ' to playlist ' + state.targetPlaylistId);
                    recordStat('totalPlaylistAdds');
                    showGlobalToast(tt('m_plAdded', { track: track.title, name: res.plTitle }));
                }
                return true;
            }
            showGlobalToast(tt('m_plUpdateFail', { s: res.status }));
            return false;
        } catch (err) {
            console.error('[SC-FreshStation] Failed to update playlist:', err);
            showGlobalToast(tt('m_error', { msg: err.message }));
            return false;
        } finally {
            isAddingToPlaylist = false;
            if (btn && btn.innerHTML === '⏳') btn.innerHTML = '➕';
            try {
                const mpBtn = miniPlayerWindow && !miniPlayerWindow.closed && miniPlayerWindow.document.getElementById('mp-add-pl');
                if (mpBtn && mpBtn.textContent === '⏳') mpBtn.textContent = '➕';
            } catch (e) {}
            updatePlaylistButtonUI();
        }
    }

    async function ensureCurrentTrackInfo() {
        // 呼び出し時点で再生中の曲。await 中に曲が変わった場合、古い曲の解決結果で state を上書きしない
        const startHref = getPlayingTrackHref();
        const isStillSameTrack = function () {
            return normalizeTrackPath(getPlayingTrackHref()) === normalizeTrackPath(startHref);
        };

        // すでに有効な ID があれば即座に返す（ただし再生中の曲と一致する場合のみ）
        if (state.currentTrack && state.currentTrack.id &&
            (!startHref || !state.currentTrack.href || normalizeTrackPath(state.currentTrack.href) === normalizeTrackPath(startHref))) {
            return state.currentTrack;
        }

        // 0. SoundCloud 本体の再生管理から現在の曲を取得（最も確実・同期）
        try {
            const sound = getScCurrentSound();
            if (sound) {
                const info = soundToTrackInfo(sound);
                if (info.id && (!startHref || normalizeTrackPath(info.href) === normalizeTrackPath(startHref))) {
                    state.currentTrack = {
                        id: info.id,
                        title: info.title,
                        artistId: info.artistId,
                        artistName: info.artistName,
                        artistPermalink: info.artistPermalink,
                        avatarUrl: info.avatarUrl,
                        genre: info.genre,
                        href: info.href
                    };
                    return state.currentTrack;
                }
            }
        } catch (e) {}

        // 1. React Fiber / Internal Props から瞬時に track オブジェクトを取得（同期・高速）
        try {
            const probeSelectors = [
                '.playbackSoundBadge',
                '.playbackSoundBadge__like',
                '.playbackSoundBadge__titleLink',
                '.playbackSoundBadge__actions',
                '.playControls'
            ];
            for (const sel of probeSelectors) {
                const el = document.querySelector(sel);
                if (!el) continue;

                const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
                const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));

                let sound = null;
                if (propsKey && el[propsKey]) {
                    const p = el[propsKey];
                    sound = p.sound || p.track || p.currentSound || (p.children && p.children.props && (p.children.props.sound || p.children.props.track));
                }
                if (!sound && fiberKey && el[fiberKey]) {
                    let curr = el[fiberKey];
                    let depth = 0;
                    while (curr && depth < 12) {
                        const memo = curr.memoizedProps;
                        if (memo) {
                            sound = memo.sound || memo.track || memo.currentSound;
                            if (sound && sound.id) break;
                        }
                        curr = curr.return;
                        depth++;
                    }
                }

                if (sound && sound.id) {
                    state.currentTrack = {
                        id: sound.id,
                        title: sound.title || (state.currentTrack && state.currentTrack.title) || '',
                        artistId: sound.user ? sound.user.id : sound.user_id,
                        artistName: sound.user ? (sound.user.username || sound.user.name) : 'Unknown',
                        genre: (sound.genre || '').trim(),
                        href: sound.permalink_url ? new URL(sound.permalink_url).pathname : (sound.permalink || '')
                    };
                    console.log('[SC-FreshStation] Resolved track info via React Fiber from ' + sel + ':', state.currentTrack.id, state.currentTrack.title);
                    return state.currentTrack;
                }
            }
        } catch (e) {
            console.warn('[SC-FreshStation] React Fiber track extraction skipped:', e);
        }

        // 2. DOMからタイトル・アーティスト・href を取得
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        const href = titleEl ? titleEl.getAttribute('href') : (state.currentTrack ? state.currentTrack.href : null);
        const title = titleEl ? (titleEl.getAttribute('title') || (titleEl.textContent ? titleEl.textContent.trim() : '')) : (state.currentTrack ? state.currentTrack.title : '');
        const artistName = artistEl ? (artistEl.getAttribute('title') || (artistEl.textContent ? artistEl.textContent.trim() : '')) : (state.currentTrack ? state.currentTrack.artistName : '');

        if (!state.currentTrack) {
            state.currentTrack = { id: null, title: title, artistName: artistName, artistId: null, href: href, genre: '' };
        } else {
            if (title && !state.currentTrack.title) state.currentTrack.title = title;
            if (artistName && !state.currentTrack.artistName) state.currentTrack.artistName = artistName;
            if (href && !state.currentTrack.href) state.currentTrack.href = href;
        }

        // 3. clientId の確保
        if (!state.clientId) {
            await discoverClientId();
        }

        // 4. /resolve API による確実な解決（401/403時は公開APIとして即リトライ）
        if (href && state.clientId) {
            try {
                const fullUrl = href.startsWith('http') ? href : ('https://soundcloud.com' + href);
                const resolveUrl = 'https://api-v2.soundcloud.com/resolve?url=' + encodeURIComponent(fullUrl) + '&client_id=' + state.clientId;
                extractAuthTokenFromCookie();

                let rRes = await apiFetch(resolveUrl, {
                    headers: state.oauthToken ? { 'Authorization': state.oauthToken } : {},
                    credentials: 'include'
                });

                // 認証エラー(401/403)なら、Authorizationヘッダーを外して公開APIとして即リトライ！
                if (!rRes.ok && (rRes.status === 401 || rRes.status === 403)) {
                    console.warn('[SC-FreshStation] Resolve with token returned ' + rRes.status + ', retrying as public request...');
                    requestAuthFromExtension();
                    rRes = await apiFetch(resolveUrl, {
                        credentials: 'include'
                    });
                }

                if (rRes.ok) {
                    const rData = await rRes.json();
                    if (rData && rData.id) {
                        const resolved = {
                            id: rData.id,
                            title: rData.title || title,
                            artistId: rData.user ? rData.user.id : rData.user_id,
                            artistName: rData.user ? (rData.user.username || rData.user.name) : artistName,
                            genre: (rData.genre || '').trim(),
                            href: href
                        };
                        if (!isStillSameTrack()) {
                            console.log('[SC-FreshStation] Track changed during /resolve; not overwriting current track:', resolved.id);
                            return resolved;
                        }
                        state.currentTrack = resolved;
                        console.log('[SC-FreshStation] Resolved track info via /resolve API:', state.currentTrack.id, state.currentTrack.title);
                        return state.currentTrack;
                    }
                }
            } catch (e) {
                console.warn('[SC-FreshStation] API resolve error:', e);
            }
        }

        // 5. DOM上のデータ属性からの探索 (data-sound-id / data-track-id)
        try {
            const activeItems = document.querySelectorAll('.soundList__item.active, .soundList__item.playing, .sound.playing');
            for (const item of activeItems) {
                const sid = item.getAttribute('data-sound-id') || item.getAttribute('data-track-id');
                if (sid && isStillSameTrack()) {
                    state.currentTrack.id = sid;
                    console.log('[SC-FreshStation] Resolved track ID via DOM attribute:', sid);
                    return state.currentTrack;
                }
            }
        } catch (e) {}

        return state.currentTrack;
    }

    const NEVER_PLAY_PLAYLIST_PREFIX = '[FreshDig] NoPlay';
    const LEGACY_NEVER_PLAY_PLAYLIST_PREFIX = '[FreshDig] Never Play';
    const LEGACY_DISLIKE_PLAYLIST_PREFIX = '[FreshDig] Disliked Tracks';

    function recordStat(type) {
        try {
            const key = 'sc_fresh_station_stats_v1';
            let stats = {};
            try { stats = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
            stats[type] = (stats[type] || 0) + 1;
            localStorage.setItem(key, JSON.stringify(stats));
        } catch (e) {}
    }

    function getStats() {
        try {
            return JSON.parse(localStorage.getItem('sc_fresh_station_stats_v1')) || { totalSkips: 0, totalPlaylistAdds: 0 };
        } catch (e) {
            return { totalSkips: 0, totalPlaylistAdds: 0 };
        }
    }

    // NoPlay 曲を SoundCloud プレイリストにエクスポート（500曲上限を連番プレイリストで自動突破）
    async function exportDislikesToPlaylist() {
        if (!(await waitForAuthToken(1500))) {
            return { success: false, message: tt('m_exLogin') };
        }

        // 数値トラックIDを収集
        const trackIds = [];
        for (const key of Object.keys(state.dislikedTracks)) {
            const numId = parseInt(key, 10);
            if (!isNaN(numId) && numId > 0 && String(numId) === String(key).trim()) {
                trackIds.push(numId);
            }
        }

        if (trackIds.length === 0) {
            return { success: false, message: tt('m_exNone') };
        }

        try {
            await initUserData({ force: true });
            if (!state.myUserId) {
                return { success: false, message: tt('m_connectFail') };
            }

            // 500曲単位にチャンク分割（SoundCloudのプレイリスト上限が500曲）
            const chunkSize = 500;
            const chunks = [];
            for (let i = 0; i < trackIds.length; i += chunkSize) {
                chunks.push(trackIds.slice(i, i + chunkSize));
            }

            let successCount = 0;
            for (let idx = 0; idx < chunks.length; idx++) {
                const chunkTracks = chunks[idx];
                const plTitle = idx === 0 ? NEVER_PLAY_PLAYLIST_PREFIX : (NEVER_PLAY_PLAYLIST_PREFIX + ' ' + (idx + 1));
                const legacyPlTitle = idx === 0 ? LEGACY_NEVER_PLAY_PLAYLIST_PREFIX : (LEGACY_NEVER_PLAY_PLAYLIST_PREFIX + ' ' + (idx + 1));
                const existingPl = state.myPlaylists.find(function (p) {
                    const t = (p.title || '').toLowerCase();
                    return t === plTitle.toLowerCase() ||
                        t === legacyPlTitle.toLowerCase() ||
                        (idx === 0 && t === LEGACY_DISLIKE_PLAYLIST_PREFIX.toLowerCase());
                });

                if (existingPl) {
                    const putRes = await scApi('playlists/' + existingPl.id, {
                        method: 'PUT',
                        body: { playlist: { title: plTitle, tracks: chunkTracks } }
                    });
                    if (putRes.ok) successCount++;
                } else {
                    const postRes = await scApi('playlists', {
                        method: 'POST',
                        body: {
                            playlist: {
                                title: plTitle,
                                sharing: 'private',
                                tracks: chunkTracks
                            }
                        }
                    });
                    if (postRes.ok) successCount++;
                }
            }

            await initUserData({ force: true });
            if (chunks.length === 1) {
                return { success: true, message: tt('m_exCreated', { name: NEVER_PLAY_PLAYLIST_PREFIX, n: trackIds.length }) };
            }
            return {
                success: true,
                message: tt('m_exMultiDone', { name: NEVER_PLAY_PLAYLIST_PREFIX, c: chunks.length, n: trackIds.length })
            };
        } catch (e) {
            console.error('[SC-FreshStation] Export NoPlay error:', e);
            return { success: false, message: tt('m_errorOcc', { msg: e.message }) };
        }
    }

    // 全連番プレイリストから NoPlay 曲を一括インポート
    async function importDislikesFromPlaylist() {
        if (!(await waitForAuthToken(1500))) {
            return { success: false, message: tt('m_imLogin') };
        }

        try {
            await initUserData({ force: true });
            if (!state.myUserId) {
                return { success: false, message: tt('m_connectFail') };
            }

            // [FreshDig] NoPlay または [FreshDig] Never Play または [FreshDig] Disliked Tracks または dislike を含む全プレイリストを探索
            const matchingPls = state.myPlaylists.filter(function (p) {
                const t = (p.title || '').toLowerCase();
                return t.includes('noplay') || t.includes('never play') || t.includes('disliked tracks') || t.includes('dislike');
            });

            if (matchingPls.length === 0) {
                return { success: false, message: tt('m_imNotFound', { name: NEVER_PLAY_PLAYLIST_PREFIX }) };
            }

            let totalTracks = 0;
            let importedCount = 0;

            for (const pl of matchingPls) {
                const res = await scApi('playlists/' + pl.id);
                if (!res.ok) continue;
                const plData = await res.json();
                const tracks = plData.tracks || [];
                totalTracks += tracks.length;

                tracks.forEach(function (track) {
                    if (track && track.id) {
                        const key = String(track.id);
                        if (!state.dislikedTracks[key]) {
                            importedCount++;
                            state.dislikedTracks[key] = {
                                title: track.title || ('Track ' + key),
                                artist: track.user ? track.user.username : '',
                                genre: track.genre || '',
                                date: new Date().toLocaleDateString()
                            };
                        }
                    }
                });
            }

            saveDislikeData();
            if (matchingPls.length === 1) {
                return { success: true, message: tt('m_imDone', { name: matchingPls[0].title, n: totalTracks, c: importedCount }) };
            }
            return {
                success: true,
                message: tt('m_imMultiDone', { c: matchingPls.length, n: totalTracks, added: importedCount })
            };
        } catch (e) {
            console.error('[SC-FreshStation] Import Never Play error:', e);
            return { success: false, message: tt('m_errorOcc', { msg: e.message }) };
        }
    }

    async function handleDislikeClick() {
        const btn = document.getElementById('sc-fresh-station-dislike-btn');
        if (btn) {
            btn.style.background = '#ff5500';
            btn.style.color = '#fff';
            setTimeout(function () {
                btn.style.background = 'transparent';
                btn.style.color = '#ff5500';
            }, 500);
        }

        const t = await ensureCurrentTrackInfo();
        const title = (t && t.title) ? t.title : (document.querySelector('.playbackSoundBadge__titleLink')?.getAttribute('title') || 'Unknown');
        const artist = (t && t.artistName) ? t.artistName : (document.querySelector('.playbackSoundBadge__lightLink')?.getAttribute('title') || 'Unknown');
        const trackKey = (t && t.id) ? t.id : ('title_' + encodeURIComponent(title));

        state.dislikedTracks[trackKey] = {
            title: title,
            artist: artist,
            genre: (t && t.genre) ? t.genre : '',
            date: new Date().toLocaleDateString()
        };

        saveDislikeData();
        console.log('[SC-FreshStation] 👎 1-Click Dislike! Track only: "' + title + '" (' + artist + '). Skipping immediately...');

        const skipBtn = document.querySelector('.playControls__next');
        if (skipBtn) {
            skipBtn.click();
        }
    }

    // 除外中の作者の記録のキー（なければ null）
    function findHatedKey(t) {
        if (!t) return null;
        const keys = [];
        if (t.artistId) keys.push(String(t.artistId));
        if (t.artistName) keys.push('artist_' + encodeURIComponent(t.artistName), t.artistName);
        for (let i = 0; i < keys.length; i++) {
            if (state.dislikedArtists[keys[i]]) return keys[i];
        }
        return null;
    }

    function getArtistPermalink(t) {
        if (t && t.artistPermalink) return String(t.artistPermalink).toLowerCase();
        try {
            const a = document.querySelector('.playbackSoundBadge__lightLink');
            if (a && a.href) return (new URL(a.href).pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
        } catch (e) {}
        return '';
    }

    // 戻り値: { added: true/false, name }。除外中の作者なら解除、そうでなければ除外してスキップ
    async function handleHateClick() {
        const t = await ensureCurrentTrackInfo();
        const artist = (t && t.artistName) ? t.artistName : (document.querySelector('.playbackSoundBadge__lightLink')?.getAttribute('title') || 'Unknown');
        const hatedKey = findHatedKey(t);
        if (hatedKey) {
            delete state.dislikedArtists[hatedKey];
            saveDislikeData();
            updateHateButtons();
            return { added: false, name: artist };
        }
        const artistKey = (t && t.artistId) ? t.artistId : ('artist_' + encodeURIComponent(artist));

        state.dislikedArtists[artistKey] = {
            name: artist,
            permalink: getArtistPermalink(t),
            date: new Date().toLocaleDateString(),
            ts: Date.now()
        };

        saveDislikeData();
        updateHateButtons();
        console.log('[SC-FreshStation] 🚫 1-Click Hate! Artist completely: "' + artist + '". Skipping immediately...');

        const skipBtn = document.querySelector('.playControls__next');
        if (skipBtn) {
            skipBtn.click();
        }
        return { added: true, name: artist };
    }

    function hateToastText(r) {
        return r && r.added ? getI18nTexts().mpToastHate : tt('m_hateOff', { name: (r && r.name) || '' });
    }

    function isCurrentArtistHated() {
        return !!findHatedKey(state.currentTrack);
    }

    // 今の曲の作者が除外中なら 🚫 を塗りつぶしの赤にする（ページのボタン）。ミニプレイヤーは syncMiniPlayerUI
    function updateHateButtons() {
        const hated = isCurrentArtistHated();
        const btn = document.getElementById('sc-fresh-station-hate-btn');
        if (btn) {
            btn.title = hated ? tt('m_hateOnTip') : getI18nTexts().barHateTitle;
            btn.style.background = hated ? '#e53935' : 'transparent';
            btn.style.color = hated ? '#fff' : '#e53935';
        }
        updateLaterButton();
        updateProfileTag();
    }

    fdBus.on('dislike-changed', function () {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                state.dislikedTracks = parsed.dislikedTracks || {};
                state.dislikedArtists = parsed.dislikedArtists || {};
                state.dislikedGenres = parsed.dislikedGenres || {};
            }
        } catch (e) {}
        try { updateHateButtons(); } catch (e) {}
    });

    // 作者のプロフィールページ: 除外中の作者には小さな札「🚫 FreshDig で除外中 [解除]」を出す
    function updateProfileTag() {
        let tag = document.getElementById('sc-fresh-station-profile-tag');
        const path = window.location.pathname;
        let key = null;
        if (FreshDigCore.isArtistPagePath(path)) {
            const seg = (path.split('/').filter(Boolean)[0] || '').toLowerCase();
            const nameEl = document.querySelector('.profileHeaderInfo__userName');
            const pageName = nameEl ? nameEl.textContent.trim() : '';
            const ks = Object.keys(state.dislikedArtists);
            for (let i = 0; i < ks.length; i++) {
                const rec = state.dislikedArtists[ks[i]] || {};
                if ((rec.permalink && String(rec.permalink).toLowerCase() === seg) ||
                    (!rec.permalink && pageName && rec.name === pageName)) { key = ks[i]; break; }
            }
            if (key && nameEl) {
                if (!tag) {
                    tag = document.createElement('span');
                    tag.id = 'sc-fresh-station-profile-tag';
                    tag.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-left:10px;padding:2px 8px;border-radius:10px;background:#e53935;color:#fff;font-size:12px;font-weight:normal;vertical-align:middle;';
                    const label = document.createElement('span');
                    label.className = 'fd-tag-label';
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'fd-tag-btn';
                    btn.style.cssText = 'border:1px solid #fff;background:transparent;color:#fff;border-radius:8px;font-size:11px;padding:0 6px;cursor:pointer;';
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const k = tag.dataset.key;
                        if (k && state.dislikedArtists[k]) {
                            delete state.dislikedArtists[k];
                            saveDislikeData();
                            updateHateButtons();
                        }
                    });
                    tag.appendChild(label);
                    tag.appendChild(btn);
                    nameEl.parentNode.insertBefore(tag, nameEl.nextSibling);
                }
                tag.dataset.key = key;
                tag.querySelector('.fd-tag-label').textContent = tt('m_profileTag');
                tag.querySelector('.fd-tag-btn').textContent = tt('m_profileUnban');
                return;
            }
        }
        if (tag) tag.remove();
    }

    // ---- R6: 後で聴く作者（保存は chrome.storage.local の laterArtists。書き込みは background.js 経由） ----
    const laterState = { map: {}, pending: {}, seq: 0 };

    function setLaterList(list) {
        const m = {};
        (Array.isArray(list) ? list : []).forEach(function (x) { if (x && x.artistId !== undefined) m[String(x.artistId)] = x; });
        laterState.map = m;
        try { updateLaterButton(); } catch (e) {}
        try { syncMiniPlayerUI(); } catch (e) {}
    }

    window.addEventListener('message', function (event) {
        if (event.source !== window || !event.data) return;
        const d = event.data;
        if (d.type === 'SC_FRESH_STATION_LATER_CHANGED') setLaterList(d.list);
        if (d.type === 'SC_FRESH_STATION_LATER_RESULT') {
            const p = laterState.pending[d.reqId];
            if (p) { delete laterState.pending[d.reqId]; p(d.result); }
        }
    });

    function laterOp(msg) {
        return new Promise(function (resolve) {
            const reqId = ++laterState.seq;
            laterState.pending[reqId] = resolve;
            setTimeout(function () {
                if (laterState.pending[reqId]) { delete laterState.pending[reqId]; resolve({ ok: false, reason: 'timeout' }); }
            }, 5000);
            window.postMessage(Object.assign({ type: 'SC_FRESH_STATION_LATER_OP', reqId: reqId }, msg), window.location.origin);
        });
    }

    function isCurrentArtistSavedLater() {
        const t = state.currentTrack;
        return !!(t && t.artistId && laterState.map[String(t.artistId)]);
    }

    // いま開いているのが「後で聴く」に入れた作者のページか（そのページから聴くときは、ライク済み・フォロー中でも飛ばさない）
    function isOnLaterArtistPage() {
        try {
            const path = window.location.pathname;
            if (!FreshDigCore.isArtistPagePath(path)) return false;
            const seg = (path.split('/').filter(Boolean)[0] || '').toLowerCase();
            if (!seg) return false;
            const vals = Object.keys(laterState.map);
            for (let i = 0; i < vals.length; i++) {
                const p = laterState.map[vals[i]] && laterState.map[vals[i]].permalink;
                if (p && String(p).toLowerCase() === seg) return true;
            }
        } catch (e) {}
        return false;
    }

    // 戻り値: 画面に出す文
    async function toggleLater() {
        const t = await ensureCurrentTrackInfo();
        if (!t || !t.artistId) return tt('m_artistLoading');
        const id = String(t.artistId);
        const name = t.artistName || '';
        if (laterState.map[id]) {
            const r = await laterOp({ op: 'remove', artistId: id });
            if (!r.ok) return tt('m_laterFail');
            delete laterState.map[id];
            updateLaterButton();
            return tt('m_laterRemoved', { name: name });
        }
        const r = await laterOp({ op: 'add', item: { artistId: id, name: name, permalink: getArtistPermalink(t), avatarUrl: t.avatarUrl || '', fromTrackTitle: t.title || '' } });
        if (!r.ok) return r.reason === 'limit' ? tt('m_laterLimit') : tt('m_laterFail');
        laterState.map[id] = { artistId: id, name: name, permalink: getArtistPermalink(t) };
        updateLaterButton();
        return tt('m_laterAdded', { name: name });
    }

    function updateLaterButton() {
        const btn = document.getElementById('sc-fresh-station-later-btn');
        if (!btn) return;
        const saved = isCurrentArtistSavedLater();
        btn.title = saved ? tt('m_laterRemoveTip') : tt('m_laterAddTip');
        btn.style.background = saved ? '#7e57c2' : 'transparent';
        btn.style.color = saved ? '#fff' : '#b39ddb';
    }

    // =========================================================================
    // 🔊 ボリューム管理 (Volume Control & Mute)
    // =========================================================================
    const VOLUME_STORAGE_KEY = 'sc_fresh_station_volume';
    let lastNonZeroVolume = 0.8;
    // SoundCloud 内部モジュールが見つからない場合のフォールバック用：最後に play() された要素
    let lastPlayedMedia = null;
    let volumePrecisionRestored = false;

    // ユーザーが本拡張で設定した音量（未設定なら null）
    function getSavedVolume() {
        try {
            const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
            if (saved !== null) {
                const v = parseFloat(saved);
                if (!isNaN(v)) return Math.max(0, Math.min(1, v));
            }
        } catch (e) {}
        return null;
    }

    // SoundCloud は音量を 0.1 刻みでしか保存しないため、再読込後に本拡張で保存した細かい値へ一度だけ戻す
    function restoreVolumePrecisionOnce(volMod) {
        if (volumePrecisionRestored || !volMod) return;
        volumePrecisionRestored = true;
        const saved = getSavedVolume();
        try {
            if (saved !== null && saved > 0 && !volMod.getMuted() && Math.abs(volMod.getVolume() - saved) <= 0.051) {
                volMod.setVolumeAndMuted({ volume: saved, muted: false });
            }
        } catch (e) {}
    }

    function getSoundCloudVolume() {
        // 1. SoundCloud 本体の音量（スライダー表示・全プレイヤーに適用される値）
        const volMod = getScVolumeModule();
        if (volMod) {
            restoreVolumePrecisionOnce(volMod);
            try { return volMod.getMuted() ? 0 : volMod.getVolume(); } catch (e) {}
        }
        // 2. フォールバック
        if (lastPlayedMedia && typeof lastPlayedMedia.volume === 'number' && !isNaN(lastPlayedMedia.volume)) {
            return lastPlayedMedia.muted ? 0 : lastPlayedMedia.volume;
        }
        const audios = document.querySelectorAll('audio');
        for (const a of audios) {
            if (typeof a.volume === 'number' && !isNaN(a.volume)) {
                return a.volume;
            }
        }
        const saved = getSavedVolume();
        return saved !== null ? saved : 0.8;
    }

    function setSoundCloudVolume(vol) {
        const v = Math.max(0, Math.min(1, Number(vol) || 0));
        dlog('freshdig-set-volume', { v: v });
        if (v > 0) {
            lastNonZeroVolume = v;
        }
        try {
            localStorage.setItem(VOLUME_STORAGE_KEY, v.toString());
        } catch (e) {}

        const volMod = getScVolumeModule();
        if (volMod) {
            // SoundCloud 本体の音量として設定 → 曲が変わっても維持され、本体スライダーとも同期する
            try {
                if (v === 0) {
                    volMod.setMuted(true);
                } else {
                    volMod.setVolumeAndMuted({ volume: v, muted: false });
                }
            } catch (e) {
                console.warn('[SC-FreshStation] SoundCloud volume module error:', e);
            }
        } else {
            // フォールバック：内部モジュールが見つからない場合は audio 要素へ直接反映
            const audios = Array.from(document.querySelectorAll('audio'));
            if (lastPlayedMedia && audios.indexOf(lastPlayedMedia) === -1) audios.push(lastPlayedMedia);
            audios.forEach(function (a) {
                try {
                    a.volume = v;
                    a.muted = v === 0;
                } catch (e) {}
            });
        }

        syncMiniPlayerVolumeUI(getSoundCloudVolume());
        return v;
    }

    function toggleSoundCloudMute() {
        const volMod = getScVolumeModule();
        if (volMod) {
            try {
                if (volMod.getMuted() || volMod.getVolume() === 0) {
                    const restore = volMod.getVolume() > 0 ? volMod.getVolume() : (lastNonZeroVolume > 0 ? lastNonZeroVolume : 0.8);
                    volMod.setVolumeAndMuted({ volume: restore, muted: false });
                    showGlobalToast(tt('m_volRestored', { n: Math.round(restore * 100) }));
                } else {
                    lastNonZeroVolume = volMod.getVolume();
                    volMod.setMuted(true);
                    showGlobalToast(tt('m_muted'));
                }
            } catch (e) {}
            syncMiniPlayerVolumeUI(getSoundCloudVolume());
            return;
        }
        const cur = getSoundCloudVolume();
        if (cur > 0) {
            lastNonZeroVolume = cur;
            setSoundCloudVolume(0);
            showGlobalToast(tt('m_muted'));
        } else {
            const restore = lastNonZeroVolume > 0 ? lastNonZeroVolume : 0.8;
            setSoundCloudVolume(restore);
            showGlobalToast(tt('m_volRestored', { n: Math.round(restore * 100) }));
        }
    }

    function syncMiniPlayerVolumeUI(vol) {
        if (!miniPlayerWindow || miniPlayerWindow.closed) return;
        try {
            const doc = miniPlayerWindow.document;
            const input = doc.getElementById('mp-vol-input');
            const fill = doc.getElementById('mp-vol-fill');
            const text = doc.getElementById('mp-vol-text');
            const icon = doc.getElementById('mp-vol-icon');

            const pct = Math.round(vol * 100);
            if (input && doc.activeElement !== input) input.value = pct;
            if (fill) fill.style.width = pct + '%';
            if (text) text.textContent = pct + '%';
            if (icon) {
                icon.textContent = vol === 0 ? '🔇' : (vol < 0.5 ? '🔉' : '🔊');
                icon.title = vol === 0 ? tt('m_unmute') : tt('volMute');
            }
        } catch (e) {}
    }

    // フォールバック時のみ：曲が変わって audio が再生された時に保存音量を再適用
    // （SoundCloud 内部モジュール経由で設定していれば、本体が全プレイヤーに適用するので何もしない）
    function applySavedVolumeTo(media) {
        if (getScVolumeModule()) return;
        const v = getSavedVolume();
        if (v === null || !media) return;
        try {
            if (Math.abs(media.volume - v) > 0.001) media.volume = v;
        } catch (err) {}
    }

    document.addEventListener('play', function (e) {
        if (e.target && e.target.tagName === 'AUDIO') {
            lastPlayedMedia = e.target;
            applySavedVolumeTo(e.target);
        }
    }, true);

    // DOM に挿入されていない Audio 要素の play はイベントが document に届かないため、play() 自体をフック
    try {
        const origMediaPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            try {
                if (this && this.tagName === 'AUDIO') {
                    lastPlayedMedia = this;
                    applySavedVolumeTo(this);
                }
            } catch (e) {}
            return origMediaPlay.apply(this, arguments);
        };
    } catch (e) {}

    function showGlobalToast(msg) {
        // 1. Mini player toast if open
        if (miniPlayerWindow && !miniPlayerWindow.closed) {
            try {
                const mpToast = miniPlayerWindow.document.getElementById('mp-toast');
                if (mpToast) {
                    mpToast.textContent = msg;
                    mpToast.classList.add('show');
                    clearTimeout(mpToast._timer);
                    mpToast._timer = setTimeout(function () { mpToast.classList.remove('show'); }, 1800);
                    return;
                }
            } catch (e) {}
        }
        // 2. Main SoundCloud window floating toast
        try {
            let toast = document.getElementById('sc-fresh-station-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'sc-fresh-station-toast';
                toast.style.cssText = 'position: fixed; bottom: 65px; left: 50%; transform: translateX(-50%); background: rgba(20,20,20,0.92); border: 1px solid #ff5500; color: #fff; font-size: 13px; font-weight: bold; padding: 7px 18px; border-radius: 20px; z-index: 100000; box-shadow: 0 4px 15px rgba(0,0,0,0.5); pointer-events: none; transition: opacity 0.25s ease; opacity: 0;';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            clearTimeout(toast._timer);
            toast._timer = setTimeout(function () {
                toast.style.opacity = '0';
            }, 2000);
        } catch (e) {}
    }

    // 発掘モードの ON/OFF（localStorage と chrome.storage.local の両方に保存）
    function setDiscoveryEnabled(enabled, options) {
        enabled = !!enabled;
        const changed = enabled !== state.discoveryEnabled;
        state.discoveryEnabled = enabled;
        try { localStorage.setItem(DISCOVERY_ENABLED_KEY, String(enabled)); } catch (e) {}
        window.postMessage({
            type: 'SC_FRESH_STATION_SYNC_STORAGE',
            key: 'discoveryEnabled',
            value: enabled
        }, window.location.origin);
        if (enabled && changed) {
            // ON にした瞬間、今の曲も判定し直す
            marginGuard.hasChecked = false;
            marginGuard.consecutiveSkips = 0;
            marginGuard.loadStartTime = Date.now();
            soundChangeState.decidedPath = '';
            setTimeout(function () {
                try { onScCurrentSoundChanged(); } catch (e) {}
            }, 0);
        }
        updateModeButtonUI();
        syncMiniPlayerUI();
        if (!(options && options.silent) || changed) {
            showGlobalToast(enabled ? tt('m_discOn') : tt('m_discOff'));
        }
        console.log('[SC-FreshStation] Discovery mode:', enabled ? 'ON' : 'OFF');
    }

    function toggleDiscoveryEnabled() {
        setDiscoveryEnabled(!state.discoveryEnabled);
    }

    // （現在未使用）発掘モード ⇔ フォロー新曲モードの切り替え。FOLLOWING_NEW_MODE_ENABLED = true で復活
    function togglePlaybackMode() {
        if (!FOLLOWING_NEW_MODE_ENABLED) {
            toggleDiscoveryEnabled();
            return;
        }
        const newMode = state.playbackMode === 'DISCOVERY' ? 'FOLLOWING_NEW' : 'DISCOVERY';
        // chrome.storage.local にも同期（しないと再読込時に拡張側の古いモードで上書きされる）
        savePlaybackMode(newMode);
        console.log('[SC-FreshStation] Toggled mode to:', newMode);

        const msg = newMode === 'DISCOVERY'
            ? tt('m_toDiscovery')
            : tt('m_toFollowing');
        showGlobalToast(msg);

        updateModeButtonUI();
        syncMiniPlayerUI();
    }

    async function startTrackStation() {
        console.log('[SC-FreshStation] startTrackStation called');

        // Step 0: トラック情報の取得を保証
        let currentTrackId = state.currentTrack && state.currentTrack.id;
        if (!currentTrackId) {
            const t = await ensureCurrentTrackInfo();
            if (t && t.id) currentTrackId = t.id;
        }

        // Step 1: DOM上のステーションボタンがあれば最優先で直接クリック
        const directStationSelectors = [
            '.playbackSoundBadge button.sc-button-station',
            '.playbackSoundBadge__actions button[title*="Station" i]',
            '.playbackSoundBadge__actions button[aria-label*="Station" i]',
            '.playbackSoundBadge__actions button[title*="ステーション"]',
            '.playbackSoundBadge__actions button[aria-label*="ステーション"]',
            '.playControls button.sc-button-station',
            'button.sc-button-station'
        ];
        for (const sel of directStationSelectors) {
            const btn = document.querySelector(sel);
            if (btn && btn.id !== 'mp-station' && btn.id !== 'sc-fresh-station-station-btn' && btn.offsetParent !== null) {
                btn.click();
                showGlobalToast(tt('m_stationStarted'));
                return { success: true, message: tt('m_stationStartedMsg') };
            }
        }

        // Step 2: プレイヤーバーの「... (More / その他)」メニューを開いてステーションを探索
        const actionsGroup = document.querySelector('.playbackSoundBadge__actions');
        if (actionsGroup) {
            actionsGroup.style.opacity = '1';
            actionsGroup.style.visibility = 'visible';
        }

        const moreBtnSelectors = [
            '.playbackSoundBadge button.sc-button-more',
            '.playbackSoundBadge__actions button.sc-button-more',
            '.playbackSoundBadge button[aria-haspopup="menu"]',
            '.playbackSoundBadge button[aria-haspopup="true"]',
            '.playbackSoundBadge__actions button[title*="More" i]',
            '.playbackSoundBadge__actions button[aria-label*="More" i]',
            '.playbackSoundBadge__actions button[title*="その他"]',
            '.playbackSoundBadge__actions button[aria-label*="その他"]',
            '.playControls button.sc-button-more',
            'button.sc-button-more'
        ];

        let moreBtn = null;
        for (const sel of moreBtnSelectors) {
            const el = document.querySelector(sel);
            if (el && el.id !== 'mp-station') {
                moreBtn = el;
                break;
            }
        }

        if (moreBtn) {
            moreBtn.click();
            let foundStationItem = null;
            for (let i = 0; i < 15; i++) {
                await new Promise(r => setTimeout(r, 40));
                const items = document.querySelectorAll('.moreActions button, .dropdownMenu button, [role="menu"] button, [role="menuitem"], .sc-popper button, .moreActions__group button, button.sc-button-station');
                for (const item of items) {
                    const text = ((item.textContent || '') + ' ' + (item.title || '') + ' ' + (item.getAttribute('aria-label') || '') + ' ' + item.className).toLowerCase();
                    if (text.includes('station') || text.includes('ステーション')) {
                        foundStationItem = item;
                        break;
                    }
                }
                if (foundStationItem) break;
            }

            if (foundStationItem) {
                foundStationItem.click();
                showGlobalToast(tt('m_stationStarted'));
                return { success: true, message: tt('m_stationStartedMsg') };
            } else {
                moreBtn.click(); // メニューを閉じる
            }
        }

        // Step 3: 現在再生中のトラックカードからステーション開始ボタンを探索
        const trackCards = document.querySelectorAll('.sound.playing, .soundList__item.active, .soundList__item.playing');
        for (const card of trackCards) {
            const cardStation = card.querySelector('button.sc-button-station, button[title*="Station" i], button[title*="ステーション"]');
            if (cardStation) {
                cardStation.click();
                showGlobalToast(tt('m_stationStarted'));
                return { success: true, message: tt('m_stationStartedMsg') };
            }
        }

        // Step 4: トラックIDによるSPAナビゲーション + 自動再生
        if (currentTrackId) {
            showGlobalToast(tt('m_stationLoading'));
            const stationUrl = '/discover/sets/track-stations:' + currentTrackId;

            // SPAリンククリックで確実にルーターをキック
            try {
                let link = document.createElement('a');
                link.href = stationUrl;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (e) {}

            setTimeout(function () {
                if (window.location.pathname.indexOf('track-stations') === -1) {
                    try {
                        window.history.pushState({}, '', stationUrl);
                        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
                    } catch (e) {
                        window.location.href = 'https://soundcloud.com' + stationUrl;
                    }
                }
            }, 120);

            // ステーション画面の再生ボタン出現を待機して自動クリック
            let playStarted = false;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 150));
                const playBtn = document.querySelector('.heroSoundTitle button.playButton, .soundTitle__playButton button, .listenSection button.sc-button-play, .sound__coverArt button.playButton, .trackItem button.sc-button-play');
                if (playBtn) {
                    playBtn.click();
                    playStarted = true;
                    showGlobalToast(tt('m_stationPlaying'));
                    break;
                }
            }
            if (!playStarted) {
                const mainPlay = document.querySelector('.playControls__play');
                if (mainPlay && !mainPlay.classList.contains('playing')) {
                    mainPlay.click();
                }
            }
            return { success: true, message: tt('m_stationStartedMsg') };
        }

        showGlobalToast(tt('m_stationNoTrack'));
        return { success: false, message: tt('m_stationNoTrackMsg') };
    }

    // =========================================================================
    // 🎵 Windows メディア操作パネル / メディアキー連携 (Media Session API)
    //    SoundCloud 本体が 再生・一時停止・前へ・次へ・±5秒シーク・曲情報 を自前で登録するため、
    //    それらは上書きしない。本体が送っていない「再生位置（シークバー）」「位置指定シーク」「停止」を補う。
    // =========================================================================
    const mediaSessionState = {
        trackHref: '',
        prevTrackArt: '',
        ownMetaTitle: '',
        ownMetaArt: '',
        handlersAt: 0
    };

    function getScPlaybackManager() {
        return findScModule('playback', function (ex) {
            return typeof ex.playNext === 'function' && typeof ex.playPrev === 'function' &&
                typeof ex.getCurrentSound === 'function' && typeof ex.pauseCurrent === 'function';
        });
    }

    // 再生中のサウンド（SoundCloud 内部モデル）。currentTime()/duration() はミリ秒、seek(ms)
    function getScCurrentSound() {
        try {
            const pm = getScPlaybackManager();
            if (!pm) return null;
            if (typeof pm.hasCurrentSound === 'function' && !pm.hasCurrentSound()) return null;
            const s = pm.getCurrentSound();
            if (s && typeof s.currentTime === 'function' && typeof s.duration === 'function' && typeof s.seek === 'function') return s;
        } catch (e) {}
        return null;
    }

    function parseClockText(text) {
        if (!text) return null;
        const parts = String(text).trim().split(':').map(function (x) { return parseInt(x, 10); });
        if (parts.length < 2 || parts.some(isNaN)) return null;
        return parts.reduce(function (acc, v) { return acc * 60 + v; }, 0);
    }

    // 再生位置を秒で取得 { position, duration }（取得できなければ null）
    function getPlaybackPositionSeconds() {
        const sound = getScCurrentSound();
        if (sound) {
            try {
                const d = sound.duration() / 1000;
                const p = sound.currentTime() / 1000;
                if (d > 0 && isFinite(d) && isFinite(p)) return { position: Math.min(Math.max(p, 0), d), duration: d };
            } catch (e) {}
        }
        const passedEl = document.querySelector('.playbackTimeline__timePassed span[aria-hidden="true"]');
        const durationEl = document.querySelector('.playbackTimeline__duration span[aria-hidden="true"]');
        const p = parseClockText(passedEl && passedEl.textContent);
        const d = parseClockText(durationEl && durationEl.textContent);
        if (p !== null && d && d > 0) return { position: Math.min(p, d), duration: d };
        return null;
    }

    // 曲の割合（0〜1）でシーク。SoundCloud 内部モデルが使えればミリ秒単位で正確に、無ければシークバーをクリック
    function seekToSoundCloudRatio(ratio) {
        ratio = Math.max(0, Math.min(1, ratio));
        const sound = getScCurrentSound();
        if (sound) {
            try {
                sound.seek(Math.floor(sound.duration() * ratio));
                return;
            } catch (e) {}
        }
        const progressWrapper = document.querySelector('.playbackTimeline__progressWrapper');
        if (progressWrapper) {
            const rect = progressWrapper.getBoundingClientRect();
            const clientX = rect.left + rect.width * ratio;
            const clientY = rect.top + rect.height / 2;
            progressWrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: clientX, clientY: clientY }));
            progressWrapper.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: clientX, clientY: clientY }));
        }
    }

    // 別タブに切り替えたときにミニプレイヤーを自動表示（Edge / Chrome の「自動ピクチャー イン ピクチャー」）
    // ブラウザは、音が鳴っているタブが裏に回った時だけこのハンドラーを呼び、その中でのみ PiP ウィンドウを開ける
    function setAutoMiniPlayer(enabled, options) {
        state.autoMiniPlayer = !!enabled;
        try { localStorage.setItem(AUTO_MINI_PLAYER_KEY, String(state.autoMiniPlayer)); } catch (e) {}
        if (!(options && options.noSync)) {
            window.postMessage({ type: 'SC_FRESH_STATION_SYNC_STORAGE', key: 'autoMiniPlayer', value: state.autoMiniPlayer }, window.location.origin);
        }
        registerAutoMiniPlayerHandler();
    }

    function registerAutoMiniPlayerHandler() {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.setActionHandler('enterpictureinpicture', state.autoMiniPlayer && ('documentPictureInPicture' in window) ? function () {
                if (miniPlayerWindow && !miniPlayerWindow.closed) return;
                openMiniPlayer({ auto: true });
            } : null);
        } catch (e) {
            // 未対応のブラウザ（'enterpictureinpicture' を知らない）では何もしない
        }
    }

    function registerExtraMediaSessionHandlers() {
        if (!('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
        registerAutoMiniPlayerHandler();
        try {
            ms.setActionHandler('seekto', function (details) {
                const pos = getPlaybackPositionSeconds();
                if (!pos || !details || typeof details.seekTime !== 'number') return;
                seekToSoundCloudRatio(details.seekTime / pos.duration);
                setTimeout(updateMediaSessionPosition, 300);
            });
        } catch (e) {}
        try {
            ms.setActionHandler('stop', function () {
                const pm = getScPlaybackManager();
                if (pm) {
                    try { pm.pauseCurrent(); return; } catch (e) {}
                }
                const btn = document.querySelector('.playControls__play.playing');
                if (btn) btn.click();
            });
        } catch (e) {}
        mediaSessionState.handlersAt = Date.now();
    }

    function updateMediaSessionPosition() {
        if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
        const pos = getPlaybackPositionSeconds();
        if (!pos) return;
        try {
            navigator.mediaSession.setPositionState({ duration: pos.duration, position: pos.position, playbackRate: 1 });
        } catch (e) {}
    }

    function getBadgeArtworkUrl() {
        const badgeImg = document.querySelector('.playbackSoundBadge__avatar span.sc-artwork');
        if (badgeImg && badgeImg.style.backgroundImage) {
            const m = badgeImg.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
            if (m) return m[1];
        }
        return '';
    }

    // 曲情報：SoundCloud 本体が設定していればそのまま。設定されていない時だけ補う
    // （以前は曲が変わるたびに上書きしており、ジャケット画像が前の曲のまま表示されることがあった）
    function syncMediaSessionMetadata() {
        if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        if (!titleEl) return;
        const href = titleEl.getAttribute('href') || '';
        const title = titleEl.getAttribute('title') || (titleEl.textContent || '').trim();
        const artist = artistEl ? (artistEl.getAttribute('title') || (artistEl.textContent || '').trim()) : '';
        const art = getBadgeArtworkUrl();

        if (href !== mediaSessionState.trackHref) {
            mediaSessionState.prevTrackArt = mediaSessionState.ownMetaArt || art;
            mediaSessionState.trackHref = href;
            mediaSessionState.ownMetaTitle = '';
            mediaSessionState.ownMetaArt = '';
            return; // 本体が曲情報を設定するのを待つ（次の周期で確認）
        }

        const current = navigator.mediaSession.metadata;
        const scSetIt = current && current.title === title && current.title !== mediaSessionState.ownMetaTitle;
        if (scSetIt) return;

        // 前の曲のジャケットがまだ残っている間は画像なしにする
        const freshArt = art && art !== mediaSessionState.prevTrackArt ? art.replace(/-t(50|120|200)x(50|120|200)\./, '-t500x500.').replace(/-large\./, '-t500x500.') : '';
        if (mediaSessionState.ownMetaTitle === title && mediaSessionState.ownMetaArt === freshArt) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || 'SoundCloud',
                artist: artist || '',
                album: '',
                artwork: freshArt ? [
                    { src: freshArt, sizes: '500x500', type: 'image/jpeg' },
                    { src: freshArt.replace('-t500x500.', '-t300x300.'), sizes: '300x300', type: 'image/jpeg' }
                ] : []
            });
            mediaSessionState.ownMetaTitle = title;
            mediaSessionState.ownMetaArt = freshArt;
        } catch (e) {}
    }

    function syncMediaSession() {
        if (!('mediaSession' in navigator)) return;
        syncMediaSessionMetadata();
        updateMediaSessionPosition();
        // 本体が曲ごとに操作ハンドラーを登録し直すため、追加分（位置指定シーク・停止）を定期的に再登録
        if (Date.now() - mediaSessionState.handlersAt > 5000) registerExtraMediaSessionHandlers();
    }

    // =========================================================================
    // 🔁 リポスト（コメント付き）
    // =========================================================================
    const REPOST_CAPTION_MAX = 140; // SoundCloud 本体のリポストコメント上限

    function isTrackReposted(trackId) {
        const id = toNumId(trackId);
        return !!(id && state.repostedTrackIds && state.repostedTrackIds.has(id));
    }

    // リポスト済みの曲IDを取得（ミニプレイヤーの表示と「解除」の判定用）
    async function syncRepostedTrackIds() {
        try {
            const ids = await fetchPagedIds('me/track_reposts/ids?limit=200', 20000, toNumId);
            if (ids) state.repostedTrackIds = ids;
        } catch (e) {}
    }

    // コメント入力パネル。送信で文字列（空文字＝コメントなし）、キャンセルで null を返す
    function showRepostCaptionDialog(doc, trackTitle) {
        doc = doc || document;
        return new Promise(function (resolve) {
            const old = doc.getElementById('sc-fresh-station-repost-dialog');
            if (old) old.remove();

            const overlay = doc.createElement('div');
            overlay.id = 'sc-fresh-station-repost-dialog';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

            const panel = doc.createElement('div');
            panel.style.cssText = 'background:#1a1a1a;color:#eee;border:1px solid #ff5500;border-radius:8px;width:min(320px,94vw);padding:8px 10px;box-sizing:border-box;box-shadow:0 8px 30px rgba(0,0,0,0.6);';

            const head = doc.createElement('div');
            head.textContent = tt('m_repostHead') + (trackTitle ? ': ' + trackTitle : '');
            head.style.cssText = 'font-size:12px;font-weight:bold;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            panel.appendChild(head);

            const ta = doc.createElement('textarea');
            ta.maxLength = REPOST_CAPTION_MAX;
            ta.rows = 3;
            ta.placeholder = tt('m_repostPh', { n: REPOST_CAPTION_MAX });
            ta.style.cssText = 'width:100%;box-sizing:border-box;resize:none;background:#111;color:#eee;border:1px solid #444;border-radius:4px;padding:5px;font-size:12px;font-family:inherit;user-select:text;';
            panel.appendChild(ta);

            const row = doc.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:6px;';
            const counter = doc.createElement('span');
            counter.style.cssText = 'flex:1;font-size:10px;color:#888;';
            const updateCounter = function () { counter.textContent = ta.value.length + ' / ' + REPOST_CAPTION_MAX; };
            updateCounter();
            ta.addEventListener('input', updateCounter);

            const mkBtn = function (label, primary) {
                const b = doc.createElement('button');
                b.type = 'button';
                b.textContent = label;
                b.style.cssText = 'flex:none;height:26px;padding:0 10px;border-radius:4px;cursor:pointer;font-size:12px;border:1px solid ' + (primary ? '#ff5500' : '#444') + ';background:' + (primary ? '#ff5500' : '#2a2a2a') + ';color:' + (primary ? '#fff' : '#bbb') + ';';
                return b;
            };
            const cancelBtn = mkBtn(tt('pickerCancel'), false);
            const sendBtn = mkBtn(tt('m_send'), true);
            row.appendChild(counter);
            row.appendChild(cancelBtn);
            row.appendChild(sendBtn);
            panel.appendChild(row);

            const done = function (value) {
                doc.removeEventListener('keydown', onKey, true);
                overlay.remove();
                resolve(value);
            };
            const onKey = function (e) {
                if (e.key === 'Escape') { e.preventDefault(); done(null); }
                // Ctrl+Enter / ⌘+Enter で送信（Enter だけだと改行）
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); done(ta.value.trim()); }
            };
            cancelBtn.addEventListener('click', function () { done(null); });
            sendBtn.addEventListener('click', function () { done(ta.value.trim()); });
            overlay.addEventListener('click', function (e) { if (e.target === overlay) done(null); });
            doc.addEventListener('keydown', onKey, true);

            overlay.appendChild(panel);
            (doc.body || doc.documentElement).appendChild(overlay);
            setTimeout(function () { try { ta.focus(); } catch (e) {} }, 0);
        });
    }

    // リポスト（コメント付きまたは通常リポスト）
    async function repostTrackWithCaption(trackId, caption, toast) {
        toast = toast || showGlobalToast;
        toast(tt('m_reposting'));
        try {
            const res = await scApi('me/track_reposts/' + trackId, { method: 'PUT' });
            if (!res.ok) {
                toast(tt('m_repostFail', { s: res.status }));
                return false;
            }
            if (!state.repostedTrackIds) state.repostedTrackIds = new Set();
            state.repostedTrackIds.add(toNumId(trackId));

            if (caption && caption.trim()) {
                try {
                    const cRes = await scApi('tracks/' + trackId + '/comments', {
                        method: 'POST',
                        body: { comment: { body: caption.trim().slice(0, REPOST_CAPTION_MAX), timestamp: 0 } }
                    });
                    if (cRes.ok) {
                        toast(tt('m_repostedCap'));
                    } else {
                        toast(tt('m_repostCapFail', { s: cRes.status }));
                    }
                } catch (cErr) {
                    console.error('[SC-FreshStation] Repost comment error:', cErr);
                    toast(tt('m_repostCapFail', { s: 'net' }));
                }
            } else {
                toast(tt('m_reposted'));
            }
            return true;
        } catch (err) {
            console.error('[SC-FreshStation] Repost error:', err);
            toast(tt('m_commErr'));
            return false;
        }
    }

    // =========================================================================
    // 🪟 浮遊ミニプレイヤー (Document Picture-in-Picture & Fallback)
    // =========================================================================
    let miniPlayerWindow = null;

    async function toggleMiniPlayer(options) {
        if (miniPlayerWindow && !miniPlayerWindow.closed) {
            miniPlayerWindow.close();
            miniPlayerWindow = null;
            return;
        }
        await openMiniPlayer(options);
    }

    // ページ内のクリックが無いと PiP / ポップアップは開けない（拡張機能ポップアップからの操作は「ページのクリック」扱いにならない）
    // → ページ上に「ミニプレイヤーを開く」ボタンを出して、それを押してもらう
    function showMiniPlayerLaunchPrompt() {
        const old = document.getElementById('sc-fresh-station-mp-launch');
        if (old) old.remove();
        const btn = document.createElement('button');
        btn.id = 'sc-fresh-station-mp-launch';
        btn.type = 'button';
        btn.textContent = getI18nTexts().mpPromptOpen;
        btn.style.cssText = 'position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:2147483647;background:#1a1a1a;color:#fff;border:1px solid #ff5500;border-radius:20px;padding:9px 18px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.5);';
        btn.addEventListener('click', function () {
            btn.remove();
            openMiniPlayer();
        });
        document.body.appendChild(btn);
        setTimeout(function () { if (btn.isConnected) btn.remove(); }, 12000);
    }

    async function openMiniPlayer(options) {
        const isAuto = !!(options && options.auto);
        try {
            if ('documentPictureInPicture' in window) {
                miniPlayerWindow = await window.documentPictureInPicture.requestWindow({
                    width: 350,
                    height: 195
                });
            } else {
                miniPlayerWindow = window.open(
                    '',
                    'SCFreshMiniPlayer',
                    'width=350,height=195,menubar=no,toolbar=no,location=no,status=no,resizable=no'
                );
            }

            if (!miniPlayerWindow) {
                if (!isAuto) showMiniPlayerLaunchPrompt();
                return;
            }

            const win = miniPlayerWindow;
            setupMiniPlayerUI(win.document);

            // 古いウィンドウの終了通知で、新しく開いたウィンドウの参照を消さないようにする
            const onClose = function () {
                if (miniPlayerWindow === win) miniPlayerWindow = null;
            };
            win.addEventListener('pagehide', function () { dlog('miniplayer-closed'); });
            win.addEventListener('pagehide', onClose);
            win.addEventListener('beforeunload', onClose);

            dlog('miniplayer-opened', { auto: isAuto });
            syncMiniPlayerUI();
            updatePlaylistButtonUI();
            console.log('[SC-FreshStation] 🪟 Mini Player opened successfully' + (isAuto ? ' (auto on tab switch)' : ''));
        } catch (err) {
            miniPlayerWindow = null;
            if (err && err.name === 'NotAllowedError') {
                // ページ内のクリック直後でないため開けなかった
                if (!isAuto) showMiniPlayerLaunchPrompt();
            } else {
                console.error('[SC-FreshStation] Failed to open Mini Player:', err);
            }
        }
    }

    let isSeekingInMiniPlayer = false;

    function setupMiniPlayerUI(doc) {
        const tx = getI18nTexts();
        doc.title = tx.mpTitle;
        doc.body.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                body {
                    background: #141414;
                    color: #fff;
                    padding: 8px 10px 6px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 100vh;
                    overflow: hidden;
                }
                .track-info-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .artwork {
                    width: 50px;
                    height: 50px;
                    min-width: 50px;
                    border-radius: 8px;
                    background: #252525 url('https://a-v2.sndcdn.com/assets/images/default/avatar--large-3b8c34f249.png') center/cover no-repeat;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                }
                .meta {
                    flex: 1;
                    min-width: 0;
                }
                .top-actions {
                    display: flex;
                    gap: 4px;
                    align-self: flex-start;
                    flex-shrink: 0;
                }
                .top-actions button {
                    flex: none;
                    width: 34px;
                    height: 34px;
                    font-size: 14px;
                }
                .title {
                    font-size: 13px;
                    font-weight: bold;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: #f2f2f2;
                    line-height: 1.2;
                }
                .artist {
                    font-size: 11px;
                    color: #999;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-top: 1px;
                    line-height: 1.2;
                }
                .badge-row {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 3px;
                }
                .status-badge {
                    display: inline-block;
                    font-size: 8.5px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    background: rgba(255, 85, 0, 0.15);
                    border: 1px solid #ff5500;
                    color: #ffaa00;
                    white-space: nowrap;
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .status-badge:hover {
                    background: #ff5500;
                    color: #fff;
                    transform: scale(1.05);
                }
                .status-badge.following-mode {
                    border-color: #29b6f6;
                    background: rgba(41, 182, 246, 0.15);
                    color: #4fc3f7;
                }
                .status-badge.off {
                    border-color: #555;
                    background: #222;
                    color: #888;
                }
                .status-badge.off:hover {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                }
                .status-badge.following-mode:hover {
                    background: #0288d1;
                    color: #fff;
                }
                .btn-follow {
                    background: #222;
                    border: 1px solid #444;
                    color: #aaa;
                    font-size: 8.5px;
                    padding: 1px 5px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.15s ease;
                }
                .btn-follow:hover {
                    background: #333;
                    color: #fff;
                }
                .btn-follow.following {
                    background: rgba(0, 230, 118, 0.15);
                    border-color: #00e676;
                    color: #00e676;
                }
                .btn-station {
                    background: #222;
                    border: 1px solid #ff5500;
                    color: #ff7700;
                    font-size: 8.5px;
                    padding: 1px 5px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.15s ease;
                }
                .btn-station:hover {
                    background: #ff5500;
                    color: #fff;
                }

                /* シークバーエリア */
                .timeline-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin: 4px 0 2px;
                }
                .time-text {
                    font-size: 9px;
                    color: #777;
                    min-width: 26px;
                    text-align: center;
                    font-variant-numeric: tabular-nums;
                }
                .seekbar-container {
                    flex: 1;
                    position: relative;
                    height: 12px;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                .seekbar-bg {
                    width: 100%;
                    height: 4px;
                    background: #2a2a2a;
                    border-radius: 2px;
                    position: relative;
                    overflow: hidden;
                }
                .seekbar-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 0%;
                    background: linear-gradient(90deg, #ff7700, #ff5500);
                    border-radius: 2px;
                    transition: width 0.1s linear;
                }
                .seekbar-input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    margin: 0;
                    z-index: 10;
                }

                /* ボリュームコントロールエリア */
                .volume-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin: 2px 0 4px;
                    padding: 0 2px;
                }
                .btn-vol-icon {
                    background: transparent;
                    border: none;
                    font-size: 13px;
                    color: #aaa;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    flex: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.15s ease;
                }
                .btn-vol-icon:hover {
                    color: #29b6f6;
                    background: transparent;
                    transform: none;
                }
                .volumebar-container {
                    flex: 1;
                    position: relative;
                    height: 12px;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                .volumebar-bg {
                    width: 100%;
                    height: 4px;
                    background: #2a2a2a;
                    border-radius: 2px;
                    position: relative;
                    overflow: hidden;
                }
                .volumebar-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 80%;
                    background: linear-gradient(90deg, #4fc3f7, #1e88e5);
                    border-radius: 2px;
                    transition: width 0.05s linear;
                }
                .volumebar-input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    margin: 0;
                    z-index: 10;
                }
                .vol-text {
                    font-size: 9px;
                    color: #777;
                    min-width: 26px;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }

                /* 一列にきれいに収まるコントロールボタン群 */
                .controls-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 3px;
                    padding-top: 2px;
                }
                button {
                    border: none;
                    background: #222;
                    color: #ddd;
                    font-size: 12px;
                    border-radius: 5px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                    flex: 1;
                    height: 30px;
                    padding: 0;
                    min-width: 0;
                }
                button:hover {
                    background: #333;
                    color: #fff;
                    transform: translateY(-1px);
                }
                button:active {
                    transform: translateY(0);
                }
                .btn-play {
                    flex: 1.25;
                    background: #ff5500;
                    color: #fff;
                    font-size: 15px;
                }
                .btn-play:hover {
                    background: #ff7700;
                }
                .btn-like.liked {
                    color: #ff3344;
                    background: rgba(255, 51, 68, 0.2);
                    border: 1px solid #ff3344;
                }
                .btn-repost.reposted {
                    color: #00e676;
                    background: rgba(0, 230, 118, 0.2);
                    border: 1px solid #00e676;
                }
                .btn-pl {
                    border: 1px solid #ff5500;
                    color: #ff5500;
                    background: rgba(255,85,0,0.1);
                    font-weight: bold;
                }
                .btn-pl:hover {
                    background: #ff5500;
                    color: #fff;
                }
                .btn-pl.in-pl {
                    border-color: #00c853;
                    color: #fff;
                    background: #00c853;
                }
                .btn-pl.in-pl:hover {
                    background: #e53935;
                    border-color: #e53935;
                }
                .btn-dislike {
                    border: 1px solid #ff5500;
                    color: #ff5500;
                }
                .btn-hate {
                    border: 1px solid #e53935;
                    color: #e53935;
                }
                .btn-hate.hated {
                    background: #e53935;
                    color: #fff;
                }
                .btn-later {
                    border: 1px solid #7e57c2;
                    color: #b39ddb;
                }
                .btn-later.saved {
                    background: #7e57c2;
                    color: #fff;
                }
                .toast {
                    position: fixed;
                    bottom: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.85);
                    border: 1px solid #ff5500;
                    color: #fff;
                    font-size: 10px;
                    padding: 3px 8px;
                    border-radius: 15px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                    white-space: nowrap;
                    max-width: 94%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    z-index: 100;
                }
                .toast.show {
                    opacity: 1;
                }
            </style>
            <div class="track-info-row">
                <div class="artwork" id="mp-art"></div>
                <div class="meta">
                    <div class="title" id="mp-title">${tx.mpLoadingTrack}</div>
                    <div class="artist" id="mp-artist">SoundCloud</div>
                    <div class="badge-row">
                        <span class="status-badge" id="mp-status">${tx.mpStatusWaiting}</span>
                        <button class="btn-follow" id="mp-follow" title="${tx.mpFollowBtnTitle}">${tx.mpFollowBtn}</button>
                        <button class="btn-station" id="mp-station" title="${tx.mpStationBtnTitle}">${tx.mpStationBtn}</button>
                    </div>
                </div>
                <div class="top-actions">
                    <button class="btn-pl" id="mp-add-pl" title="${tx.mpAddPlTitle}">➕</button>
                    <button class="btn-hate" id="mp-hate" title="${tx.mpHateTitle}">🤬</button>
                </div>
            </div>

            <!-- シークバーエリア -->
            <div class="timeline-row">
                <span class="time-text" id="mp-time-passed">0:00</span>
                <div class="seekbar-container">
                    <div class="seekbar-bg">
                        <div class="seekbar-fill" id="mp-seekbar-fill"></div>
                    </div>
                    <input type="range" min="0" max="100" value="0" step="0.1" class="seekbar-input" id="mp-seekbar-input">
                </div>
                <span class="time-text" id="mp-time-duration">0:00</span>
            </div>

            <!-- ボリュームエリア -->
            <div class="volume-row">
                <button class="btn-vol-icon" id="mp-vol-icon" title="${tx.volMute}">🔊</button>
                <div class="volumebar-container">
                    <div class="volumebar-bg">
                        <div class="volumebar-fill" id="mp-vol-fill"></div>
                    </div>
                    <input type="range" min="0" max="100" value="80" step="1" class="volumebar-input" id="mp-vol-input" title="${tx.volSliderTitle}">
                </div>
                <span class="vol-text" id="mp-vol-text">80%</span>
            </div>

            <!-- コントロールボタン列 -->
            <div class="controls-row">
                <button id="mp-prev" title="${tx.mpPrevTitle}">⏮</button>
                <button class="btn-play" id="mp-play" title="${tx.mpPlayTitle}">⏯</button>
                <button class="btn-dislike" id="mp-dislike" title="${tx.mpDislikeTitle}">⏭️</button>
                <button class="btn-like" id="mp-like" title="${tx.mpLikeTitle}">🤍</button>
                <button class="btn-repost" id="mp-repost" title="${tx.mpRepostTitle}">🔁</button>
                <button class="btn-later" id="mp-later" title="">🧐</button>
            </div>
            <div class="toast" id="mp-toast"></div>
        `;

        function showToast(msg) {
            const toast = doc.getElementById('mp-toast');
            if (toast) {
                toast.textContent = msg;
                toast.classList.add('show');
                setTimeout(function () { toast.classList.remove('show'); }, 1500);
            }
        }

        // 操作は run() 経由。音を出している別のタブのミニプレイヤーとして動いているときは、そのタブへ送る（R4）
        function run(name, args) {
            if (mpUseRemote()) return mpRemoteCall(name, args || {});
            const fn = MP_ACTIONS[name];
            return fn ? fn(args || {}, showToast, doc) : undefined;
        }

        // 基本メディア操作
        doc.getElementById('mp-prev')?.addEventListener('click', function () { run('prev'); });
        doc.getElementById('mp-play')?.addEventListener('click', function () { run('play'); });
        doc.getElementById('mp-next')?.addEventListener('click', function () { run('next'); });

        // シーク操作
        const seekInput = doc.getElementById('mp-seekbar-input');
        const seekFill = doc.getElementById('mp-seekbar-fill');

        seekInput?.addEventListener('input', function (e) {
            isSeekingInMiniPlayer = true;
            const val = parseFloat(e.target.value);
            if (seekFill) seekFill.style.width = val + '%';
        });

        seekInput?.addEventListener('change', function (e) {
            const ratio = parseFloat(e.target.value) / 100;
            run('seek', { ratio: ratio });
            setTimeout(() => { isSeekingInMiniPlayer = false; }, 300);
        });

        // ボリューム操作
        const volInput = doc.getElementById('mp-vol-input');
        volInput?.addEventListener('input', function (e) {
            run('vol', { v: parseFloat(e.target.value) / 100 });
        });
        doc.getElementById('mp-vol-icon')?.addEventListener('click', function () { run('mute'); });

        doc.getElementById('mp-like')?.addEventListener('click', function () { run('like'); });

        // リポスト：未リポストならコメントダイアログを表示してリポスト、リポスト済みなら解除
        doc.getElementById('mp-repost')?.addEventListener('click', async function () {
            const d = mpCurrentData();
            if (d.reposted) {
                run('repost', { unrepost: true });
            } else {
                const cap = await showRepostCaptionDialog(doc, d.title || '');
                if (cap !== null) {
                    run('repost', { caption: cap });
                }
            }
        });

        doc.getElementById('mp-follow')?.addEventListener('click', function () { run('follow'); });

        // ステータスバッジ（発掘モード／フォロー新曲）クリックでモード切替（設定は全タブ共通なのでこのタブで行う）
        doc.getElementById('mp-status')?.addEventListener('click', function () {
            toggleDiscoveryEnabled();
        });

        doc.getElementById('mp-station')?.addEventListener('click', function () { run('station'); });

        // プレイリスト追加 & 設定
        const mpAddPlBtn = doc.getElementById('mp-add-pl');
        if (mpAddPlBtn) {
            mpAddPlBtn.addEventListener('click', function () { run('addPl'); });
            mpAddPlBtn.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                run('pickPl');
            });
        }
        doc.getElementById('mp-dislike')?.addEventListener('click', function () { run('dislike'); });
        doc.getElementById('mp-hate')?.addEventListener('click', function () { run('hate'); });
        doc.getElementById('mp-later')?.addEventListener('click', function () { run('later'); });
    }

    // ---- R4: 複数タブ。音を出しているタブの「今の曲」を BroadcastChannel で流し、ミニプレイヤーはそれを写す ----
    const fdRemote = { now: null, active: false, seq: 0, pending: {} };

    function isLocalPlaying() {
        const m = lastPlayedMedia;
        if (m && m.src && m.readyState > 0 && !m.ended) return !m.paused;
        const playBtn = document.querySelector('.playControls__play');
        return !!(playBtn && playBtn.classList.contains('playing'));
    }

    function formatClock(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const ss = String(sec % 60).padStart(2, '0');
        return h > 0 ? (h + ':' + String(m).padStart(2, '0') + ':' + ss) : (m + ':' + ss);
    }

    function mpToast(msg) {
        try {
            const t = miniPlayerWindow && !miniPlayerWindow.closed && miniPlayerWindow.document.getElementById('mp-toast');
            if (t) {
                t.textContent = msg;
                t.classList.add('show');
                setTimeout(function () { t.classList.remove('show'); }, 1500);
            }
        } catch (e) {}
    }

    // 自分のタブが再生中なら自分の表示。そうでなく、他のタブが最後に再生を知らせてきていればそちら
    function mpUseRemote() {
        const r = fdRemote.now;
        if (!r) return false;
        if (isLocalPlaying()) return false;
        return r.d.playing ? (Date.now() - r.at < 5000) : true;
    }

    function mpCurrentData() {
        return mpUseRemote() ? fdRemote.now.d : localSnapshot();
    }

    function localSnapshot() {
        const titleEl = document.querySelector('.playbackSoundBadge__titleLink');
        const artistEl = document.querySelector('.playbackSoundBadge__lightLink');
        const likeBtn = document.querySelector('.playbackSoundBadge__like');
        const repostBtn = document.querySelector('.playbackSoundBadge__actions button[title*="Repost"], .playbackSoundBadge__actions button[aria-label*="Repost"], .playbackSoundBadge__repost');

        const title = (state.currentTrack && state.currentTrack.title) || (titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : '') || tt('m_notPlaying');
        const artist = (state.currentTrack && state.currentTrack.artistName) || (artistEl ? (artistEl.getAttribute('title') || artistEl.textContent) : '') || 'SoundCloud';

        let art = '';
        const badgeImg = document.querySelector('.playbackSoundBadge__avatar span.sc-artwork');
        if (badgeImg && badgeImg.style.backgroundImage) {
            const m = badgeImg.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
            if (m) art = m[1];
        }
        if (art) art = art.replace(/-t(50|120|200)x(50|120|200)\./, '-t200x200.').replace(/-large\./, '-t200x200.');

        const trackId = state.currentTrack && state.currentTrack.id;
        let reposted = isTrackReposted(trackId);
        if (!reposted && repostBtn) reposted = repostBtn.classList.contains('sc-button-selected') || repostBtn.getAttribute('aria-checked') === 'true';

        let following = null;
        if (state.currentTrack && state.currentTrack.artistId) following = state.followingUserIds.has(state.currentTrack.artistId);

        const timePassedEl = document.querySelector('.playbackTimeline__timePassed span[aria-hidden="true"]');
        const durationEl = document.querySelector('.playbackTimeline__duration span[aria-hidden="true"]');
        const progressBar = document.querySelector('.playbackTimeline__progressWrapper');
        let ratio = 0;
        if (progressBar) {
            const ariaVal = parseFloat(progressBar.getAttribute('aria-valuenow'));
            const ariaMax = parseFloat(progressBar.getAttribute('aria-valuemax')) || 1;
            if (!isNaN(ariaVal) && ariaMax > 0) ratio = Math.min(1, Math.max(0, ariaVal / ariaMax));
        }

        // 元のページが裏にあると画面の時間表示が止まるので、再生管理から直接読む
        let passed = timePassedEl ? timePassedEl.textContent.trim() : '0:00';
        let duration = durationEl ? durationEl.textContent.trim() : '0:00';
        try {
            const pos = getPlaybackPositionSeconds();
            if (pos && pos.duration > 0) {
                passed = formatClock(pos.position);
                duration = formatClock(pos.duration);
                ratio = Math.min(1, Math.max(0, pos.position / pos.duration));
            }
        } catch (e) {}

        return {
            title: title,
            artist: artist,
            art: art,
            playing: isLocalPlaying(),
            liked: !!(likeBtn && (likeBtn.classList.contains('sc-button-selected') || likeBtn.getAttribute('aria-checked') === 'true')),
            hasLikeBtn: !!likeBtn,
            reposted: !!reposted,
            following: following,
            passed: passed,
            duration: duration,
            ratio: ratio,
            hated: isCurrentArtistHated(),
            later: isCurrentArtistSavedLater(),
            vol: getSoundCloudVolume()
        };
    }

    // 音を出しているタブが 0.5 秒ごとに呼ぶ（再生が止まってもそのタブが「最後に鳴らしたタブ」の間は流し続ける）
    function broadcastNow() {
        if (isLocalPlaying()) fdRemote.active = true;
        if (!fdRemote.active) return;
        fdBus.post('now', { d: localSnapshot() });
    }

    fdBus.on('now', function (m) {
        if (!m.d) return;
        if (m.d.playing) {
            fdRemote.active = false;       // 他のタブが鳴らし始めた
            fdRemote.now = { tabId: m.fromTabId, at: Date.now(), d: m.d };
        } else if (!fdRemote.now || fdRemote.now.tabId === m.fromTabId) {
            fdRemote.now = { tabId: m.fromTabId, at: Date.now(), d: m.d };
        }
    });

    fdBus.on('bye', function (m) {
        if (fdRemote.now && fdRemote.now.tabId === m.fromTabId) fdRemote.now = null;
    });

    window.addEventListener('pagehide', function () {
        if (fdRemote.active) fdBus.post('bye');
    });

    // ミニプレイヤーの操作を、音を出しているタブへ送る
    function mpRemoteCall(name, args) {
        const r = fdRemote.now;
        if (!r) return;
        const id = ++fdRemote.seq;
        fdRemote.pending[id] = true;
        fdBus.post('cmd', { to: r.tabId, id: id, name: name, args: args });
        setTimeout(function () {
            if (!fdRemote.pending[id]) return;
            delete fdRemote.pending[id];
            if (fdRemote.now && fdRemote.now.tabId === r.tabId) fdRemote.now = null;
            mpToast(tt('m_tabNoReply'));
        }, 1500);
    }

    fdBus.on('cmd', function (m) {
        if (m.to !== TAB_ID) return;
        fdBus.post('cmd-ack', { to: m.fromTabId, id: m.id });
        const fn = MP_ACTIONS[m.name];
        if (!fn) return;
        const reply = function (text) { fdBus.post('cmd-toast', { to: m.fromTabId, text: text }); };
        try {
            const r = fn(m.args || {}, reply, null);
            if (r && typeof r.catch === 'function') r.catch(function (e) { dlog('remote-cmd-error', m.name + ' ' + (e && e.message)); });
        } catch (e) { dlog('remote-cmd-error', m.name + ' ' + (e && e.message)); }
    });
    fdBus.on('cmd-ack', function (m) {
        if (m.to === TAB_ID) delete fdRemote.pending[m.id];
    });
    fdBus.on('cmd-toast', function (m) {
        if (m.to === TAB_ID && typeof m.text === 'string') mpToast(m.text);
    });

    // 前・次: 再生管理があればそれで、なければ画面のボタンを押す
    function scTransport(method, selector) {
        try {
            const pm = getScPlaybackManager();
            if (pm && typeof pm[method] === 'function') { pm[method]({ userInitiated: true }); return; }
        } catch (e) {}
        const b = document.querySelector(selector);
        if (b) b.click();
    }

    // 再生/一時停止: 音声そのもの・再生管理を直接動かす。画面のボタンは裏のタブでは反応しないことがあるため、最後の手段にする
    function scTogglePlay() {
        const clickBtn = function () { const b = document.querySelector('.playControls__play'); if (b) b.click(); };
        const media = lastPlayedMedia;
        if (isLocalPlaying()) {
            try {
                const pm = getScPlaybackManager();
                if (pm && typeof pm.pauseCurrent === 'function') { pm.pauseCurrent(); return; }
            } catch (e) {}
            if (media && !media.paused) { try { media.pause(); return; } catch (e) {} }
            clickBtn();
            return;
        }
        if (media && media.src && media.paused && !media.ended) {
            let r;
            try { r = media.play(); } catch (e) { clickBtn(); return; }
            if (r && typeof r.catch === 'function') r.catch(function (e) { dlog('mini-play-blocked', e && e.name); clickBtn(); });
            setTimeout(function () { if (media.paused && !isLocalPlaying()) clickBtn(); }, 600);
            return;
        }
        clickBtn();
    }

    // ミニプレイヤーの操作の中身。(args, toast, doc) を受ける。doc はこのタブのミニプレイヤー（別タブから呼ばれたときは null）
    const MP_ACTIONS = {
        prev: function () { scTransport('playPrev', '.playControls__prev'); },
        play: function () { scTogglePlay(); },
        next: function () { scTransport('playNext', '.playControls__next'); },
        seek: function (a) { if (typeof a.ratio === 'number') seekToSoundCloudRatio(a.ratio); },
        vol: function (a) { if (typeof a.v === 'number') setSoundCloudVolume(a.v); },
        mute: function () { toggleSoundCloudMute(); },
        like: function (a, toast) {
            const likeBtn = document.querySelector('.playbackSoundBadge__like');
            if (!likeBtn) { toast(tt('m_noLikeBtn')); return; }
            const isCurrentlyLiked = likeBtn.classList.contains('sc-button-selected') || likeBtn.getAttribute('aria-checked') === 'true';
            likeBtn.click();
            const likedId = state.currentTrack && toNumId(state.currentTrack.id);
            if (likedId) {
                if (isCurrentlyLiked) state.likedTrackIds.delete(likedId); else state.likedTrackIds.add(likedId);
            }
            toast(isCurrentlyLiked ? tt('mpToastUnliked') : tt('mpToastLiked'));
            setTimeout(syncMiniPlayerUI, 300);
        },
        repost: async function (a, toast) {
            const t = await ensureCurrentTrackInfo();
            const trackId = t && toNumId(t.id);
            if (!trackId) { toast(tt('m_trackLoading')); return; }
            if (!(await waitForAuthToken(1500))) { toast(tt('m_loginPlease')); return; }
            if (a.unrepost) {
                toast(tt('m_unreposting'));
                try {
                    const res = await scApi('me/track_reposts/' + trackId, { method: 'DELETE' });
                    if (res.ok) {
                        state.repostedTrackIds.delete(trackId);
                        toast(tt('mpToastUnreposted'));
                    } else {
                        toast(tt('m_unrepostFail', { s: res.status }));
                    }
                } catch (err) {
                    console.error('[SC-FreshStation] Unrepost error:', err);
                    toast(tt('m_commErr'));
                }
            } else {
                await repostTrackWithCaption(trackId, typeof a.caption === 'string' ? a.caption : '', toast);
            }
            syncMiniPlayerUI();
        },
        follow: async function (a, toast) {
            const t = await ensureCurrentTrackInfo();
            const artistId = t && t.artistId;
            const artistName = (t && t.artistName) || tt('m_artistDefault');
            if (!artistId) { toast(tt('m_artistLoading')); return; }
            const isFollowing = state.followingUserIds.has(artistId);
            toast(isFollowing ? tt('m_unfollowing') : tt('m_following'));
            try {
                if (!(await waitForAuthToken(1500))) { toast(tt('m_loginPlease')); return; }
                // SoundCloud API: フォローは POST、解除は DELETE
                const res = await scApi('me/followings/' + artistId, { method: isFollowing ? 'DELETE' : 'POST' });
                if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
                    if (isFollowing) {
                        state.followingUserIds.delete(artistId);
                        toast(tt('m_unfollowed', { name: artistName }));
                    } else {
                        state.followingUserIds.add(artistId);
                        toast(tt('m_followed', { name: artistName }));
                    }
                    saveCacheData();
                    syncMiniPlayerUI();
                } else {
                    toast(tt('m_followFail', { s: res.status }));
                }
            } catch (e) {
                console.error('[SC-FreshStation] Follow error:', e);
                toast(tt('m_commErr'));
            }
        },
        station: function () { return startTrackStation(); },
        addPl: function (a, toast, doc) { return handleAddTrackToPlaylist(doc || undefined); },
        pickPl: function (a, toast, doc) { return chooseTargetPlaylistPrompt(doc || undefined); },
        dislike: function (a, toast) { toast(getI18nTexts().mpToastDislike); return handleDislikeClick(); },
        hate: async function (a, toast) { toast(hateToastText(await handleHateClick())); },
        later: async function (a, toast) { toast(await toggleLater()); }
    };

    function syncMiniPlayerUI() {
        if (!miniPlayerWindow) return;
        try {
            if (miniPlayerWindow.closed) {
                miniPlayerWindow = null;
                return;
            }
        } catch (e) {
            miniPlayerWindow = null;
            return;
        }

        let doc;
        try {
            doc = miniPlayerWindow.document;
            if (!doc || !doc.body) return;
        } catch (e) {
            return;
        }

        const d = mpCurrentData();

        const mpTitle = doc.getElementById('mp-title');
        const mpArtist = doc.getElementById('mp-artist');
        const mpArt = doc.getElementById('mp-art');
        const mpPlay = doc.getElementById('mp-play');
        const mpLike = doc.getElementById('mp-like');
        const mpRepost = doc.getElementById('mp-repost');
        const mpFollow = doc.getElementById('mp-follow');
        const mpStatus = doc.getElementById('mp-status');

        if (mpTitle && mpTitle.textContent !== d.title) mpTitle.textContent = d.title;
        if (mpArtist && mpArtist.textContent !== d.artist) mpArtist.textContent = d.artist;
        if (mpArt && d.art && mpArt.dataset.art !== d.art) {
            mpArt.dataset.art = d.art;
            mpArt.style.backgroundImage = 'url("' + d.art + '")';
        }
        if (mpPlay) mpPlay.textContent = d.playing ? '⏸' : '▶';

        // Like 状態
        if (mpLike && d.hasLikeBtn !== false) {
            mpLike.textContent = d.liked ? '❤️' : '🤍';
            mpLike.classList.toggle('liked', !!d.liked);
        }

        // Repost 状態
        if (mpRepost) {
            mpRepost.title = d.reposted ? tt('m_repostedTip') : tt('m_repostTip');
            mpRepost.classList.toggle('reposted', !!d.reposted);
        }

        // Follow 状態
        if (mpFollow && d.following !== null && d.following !== undefined) {
            mpFollow.textContent = d.following ? tt('m_followingLbl') : tt('mpFollowBtn');
            mpFollow.classList.toggle('following', !!d.following);
        }

        const mpHate = doc.getElementById('mp-hate');
        if (mpHate) {
            mpHate.classList.toggle('hated', !!d.hated);
            mpHate.title = d.hated ? tt('m_hateOnTip') : getI18nTexts().mpHateTitle;
        }
        const mpLater = doc.getElementById('mp-later');
        if (mpLater) {
            mpLater.classList.toggle('saved', !!d.later);
            mpLater.title = d.later ? tt('m_laterRemoveTip') : tt('m_laterAddTip');
        }

        if (mpStatus) {
            const isOn = state.discoveryEnabled;
            const isDiscovery = state.playbackMode === 'DISCOVERY';
            const label = state.robotBlocked ? ('⚠️ ' + getI18nTexts().robotShort) : (!isOn ? tt('m_stOff') : (isDiscovery ? tt('m_stOn') : tt('m_stFollow')));
            if (mpStatus.textContent !== label) mpStatus.textContent = label;
            const tStatus = getI18nTexts(); mpStatus.title = isOn ? tStatus.mpStatusToggleOff : tStatus.mpStatusToggleOn;
            mpStatus.classList.toggle('off', !isOn);
            mpStatus.classList.toggle('following-mode', isOn && !isDiscovery);
        }

        // シークバーの同期
        if (!isSeekingInMiniPlayer) {
            const mpPassed = doc.getElementById('mp-time-passed');
            const mpDuration = doc.getElementById('mp-time-duration');
            const mpFill = doc.getElementById('mp-seekbar-fill');
            const mpInput = doc.getElementById('mp-seekbar-input');

            if (mpPassed && mpPassed.textContent !== d.passed) mpPassed.textContent = d.passed;
            if (mpDuration && mpDuration.textContent !== d.duration) mpDuration.textContent = d.duration;
            if (mpFill) mpFill.style.width = (d.ratio * 100) + '%';
            if (mpInput) mpInput.value = (d.ratio * 100);
        }

        // 音量UIの同期
        syncMiniPlayerVolumeUI(typeof d.vol === 'number' ? d.vol : getSoundCloudVolume());
    }

    // 初期化実行: Windows メディア操作パネル用の追加ハンドラー登録
    registerExtraMediaSessionHandlers();

})();
