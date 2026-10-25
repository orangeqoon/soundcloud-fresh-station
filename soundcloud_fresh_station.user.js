// ==UserScript==
// @name         FreshDig for SoundCloud - 新アーティスト自動発掘
// @version      2.12.0
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
      btnMiniPlayer: '📻 ミニプレイヤー',
      btnStation: '📡 ステーション開始',
      btnStationTitle: '現在の曲からステーションを開始',
      autoMpLabel: '別のタブを開いたらブラウザの許可範囲でミニプレイヤーを自動表示',
      autoMpTitle: 'タブ切替時に自動でミニプレイヤーを表示（ブラウザ許可）',
      autoMpNotSupported: 'このブラウザでは自動PiPを利用できません（保存した設定は保持されます）',
      autoMpPermissionNote: 'ブラウザの許可と音が聞こえる再生が必要です。タブ切替時の動作はブラウザが決めます。',
      autoMpStatusRegistered: '準備完了',
      autoMpStatusUnsupported: '非対応（設定は保存済み）',
      autoMpStatusUnknown: '確認中',
      autoMpLastError: '自動PiPをブラウザに登録できませんでした',

      volControl: '🔊 音量コントロール',
      volMute: 'ミュート切替',
      volSliderTitle: '音量',

      discoveryMode: '⛏️ 発掘モード',
      discoveryOnDesc: '不再生・Like済み・フォロー中の作者の曲を自動スキップ',
      discoveryOffDesc: 'OFF：通常再生',
      discoveryStatusOn: 'ON',
      discoveryStatusOff: 'OFF',

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
      skipReasonHeard: '一度聴いた曲',
      heardSkipLabel: '一度でも聴いた曲を飛ばす',
      heardSkipHint: '実際に10秒再生した曲を、発掘モード中は自動で飛ばします。初期状態はOFFです。',
      robotBanner: 'SoundCloud のロボット確認が出ています。ページで確認を済ませてください',
      robotShort: 'ロボット確認中',
      advancedSettings: '⚙ Dig設定',
      btnCopyLog: '📋 診断ログをコピー',
      btnDownloadReport: '📥 不具合レポート保存 (JSON)',
      btnExportLists: '📤 リスト書き出し',
      btnImportLists: '📥 読み込み',
      m_laterOpenFail: '⚠️ 後で聴く人リストを開けませんでした',
      reportSaved: '✅ レポートを保存しました',
      reportFailed: '⚠️ レポート保存に失敗しました',
      logCopied: 'コピーしました。止まった時の状況と一緒に貼ってください',
      logCopyFailed: 'コピーできませんでした',
      logHint: '音が止まった直後に押して、貼り付けてください',

      dislikeSection: '⏭️ 不再生プレイリスト連携',
      btnExportDislikes: '📤 SCへ書き出し',
      btnExportingDislikes: '⏳ 書き出し中...',
      btnImportDislikes: '📥 SCから読み込み',
      btnImportingDislikes: '⏳ 読み込み中...',
      exportingMsg: 'SoundCloudへプレイリストを作成/更新しています...',
      importingMsg: 'SoundCloudプレイリストから不再生の曲を取得中...',
      commErrorMsg: 'SoundCloudとの通信に失敗しました。ページを再読み込みしてください。',

      statLikes: '除外Likes',
      statFollow: '除外Follow',
      statDislike: '不再生',

      langLabel: '🌐 言語',

      // In-page Player Bar
      barStationTitle: '📡 この曲からステーションを開始',
      barDislikeTitle: '⏭️ この曲を不再生に登録して次へ',
      barHateTitle: '🤬 作者を除外してスキップ',
      barMiniPlayerTitle: '📻 ミニプレイヤーを開く',
      barDiscoveryOffTitle: '⛏️ 発掘モードをONにする',
      barDiscoveryOnTitle: '⛏️ 発掘モードをOFFにする',
      barFollowingModeTitle: '👥 フォロー中の新曲（クリックで発掘モード）',

      // Mini Player
      mpTitle: 'FreshDig - アーティスト発掘ミニプレイヤー',
      mpPromptOpen: '📻 ここをクリックしてミニプレイヤーを開く',
      mpLoadingTrack: '曲を読み込み中...',
      mpStatusWaiting: '再生待機中',
      mpStatusDigging: '発掘中',
      mpFollowBtn: '👤 フォロー',
      mpFollowBtnTitle: '作者をフォロー',
      mpStationBtn: '📡 ステーション',
      mpStationBtnTitle: 'この曲からステーションを開始',
      mpLaterListLabel: '🧐 後で聴く人リスト',
      mpDigListening: '⏸ 作者を試聴中',
      mpPrevTitle: '前の曲',
      mpPlayTitle: '再生 / 一時停止',
      mpNextTitle: '次の曲',
      mpLikeTitle: 'いいね (Like)',
      mpRepostTitle: 'リポスト (Repost)',
      mpAddPlTitle: 'プレイリストに追加',
      mpDislikeTitle: '⏭️ この曲を不再生に登録して次へ',
      mpHateTitle: '🤬 作者を除外してスキップ',
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
      mpStatusToggleOff: '発掘モードをOFFにする',
      mpStatusToggleOn: '発掘モードをONにする',

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
      m_exNone: '書き出せる不再生の曲がありません（曲IDが取得できた曲のみ書き出せます）。',
      m_connectFail: 'SoundCloudアカウントに接続できませんでした。ページを再読み込みしてください。',
      m_exPlFail: '不再生プレイリストの取得に失敗しました (HTTP {s})',
      m_exUpdated: 'プレイリスト「{name}」に書き出しました（合計 {n} 曲{cap}）',
      m_exCap: '・上限500曲',
      m_exUpdateFail: 'エクスポート更新に失敗しました (HTTP {s})',
      m_exCreated: '非公開プレイリスト「{name}」を作成し、{n} 曲を書き出しました！',
      m_exCreateFail: 'プレイリスト新規作成に失敗しました (HTTP {s})',
      m_imLogin: 'SoundCloudにログインしていないため読み込めません。SoundCloudでログインしてから再試行してください。',
      m_imNotFound: '「{name}」という名前のプレイリストが見つかりませんでした。先に書き出しを行ってください。',
      m_imFail: 'プレイリスト取得失敗 (HTTP {s})',
      m_imEmpty: 'プレイリスト「{name}」には曲がありませんでした。',
      m_imDone: 'プレイリスト「{name}」から {n} 曲を確認し、新たに {c} 件を不再生に追加しました！',
      m_volRestored: '🔊 音量を復元しました ({n}%)',
      m_muted: '🔇 ミュートしました',
      m_unmute: 'ミュート解除',
      m_discOn: '⛏️ 発掘モード ON（知っている曲を自動スキップ）',
      m_discOff: '⏸ 発掘モード OFF（SoundCloud 通常再生）',
      m_toDiscovery: '⛏️ 発掘モード（未知のアーティスト）に切替',
      m_toFollowing: '👥 フォロー新曲モード（新曲のみ）に切替',
      m_stOff: '⏸ Dig OFF',
      m_stOn: '⛏️ Dig ON',
      m_stFollow: '👥 フォロー新曲',
      m_stationStarted: '📡 ステーションを開始しました！',
      m_stationStartedMsg: 'ステーションを開始しました',
      m_stationLoading: '📡 ステーションを読込中...',
      m_stationPlaying: '📡 ステーションを再生開始しました！',
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
      m_actionPending: '操作を受け付けました。まだ処理中の可能性があります。ページで結果を確認してください',
      m_volumeUnavailable: '音量操作を確認できません。SoundCloud本体の音量で操作してください',
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
      m_repostTip: 'リポスト',
      m_repostUnverified: '⚠️ SoundCloud でリポストを確認できませんでした',
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
      tabLater: '🧐 後で聴く人リスト',
      tabNoPlay: '⏭️ 不再生リスト',
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

      // First-use guide
      onboardingDialogLabel: 'FreshDig の使い方ガイド',
      onboardingTitle: 'FreshDig の使い方',
      onboardingStep1Title: 'ミニプレイヤーを開く',
      onboardingStep1Body: 'FreshDigの一押し機能です。拡張機能アイコン、またはSoundCloudの📻から開けます。',
      onboardingStep2Title: 'Dig ONモード',
      onboardingStep2Body: 'ONにすると、不再生にした曲・Like済みの曲・フォロー中の作者の曲を飛ばします。',
      onboardingStep3Title: '🧐 後で聴く人リスト',
      onboardingStep3Body: '下段の🧐で作者を保存。拡張機能アイコンから一覧を開き、作者を選ぶとトラックページへ移動できます。',
      onboardingOpenLauncher: '📻 ページのランチャーを開く',
      onboardingLauncherHint: 'ページのプレイヤー操作欄にある 📻 をクリックしてください。',
      onboardingNext: '次へ',
      onboardingBack: '戻る',
      onboardingDone: '使い始める',
      onboardingSkip: 'ガイドをスキップ',
      onboardingClose: '閉じる',
      onboardingProgress: '{n} / 3',
      onboardingGuideButton: '使い方を見る',

      // Multi-playlist
      m_exMultiDone: '連番プレイリスト「{name}」を含む {c} 件のプレイリストに合計 {n} 曲を書き出しました！',
      m_imMultiDone: '{c} 個の不再生プレイリストから合計 {n} 曲を確認し、新たに {added} 件を追加しました！',

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
      btnMiniPlayer: '📻 Mini Player',
      btnStation: '📡 Start Station',
      btnStationTitle: 'Start station from current track',
      autoMpLabel: 'Auto-open Mini Player when switching tabs (browser controlled)',
      autoMpTitle: 'Auto-open Mini Player on tab switch (browser permission)',
      autoMpNotSupported: 'Automatic PiP is not supported here (your saved setting is kept)',
      autoMpPermissionNote: 'Requires browser permission and audible playback. The browser decides what happens on a tab switch.',
      autoMpStatusRegistered: 'Ready',
      autoMpStatusUnsupported: 'Unsupported (setting kept)',
      autoMpStatusUnknown: 'Checking',
      autoMpLastError: 'The browser could not register automatic PiP',

      volControl: '🔊 Volume Control',
      volMute: 'Toggle Mute',
      volSliderTitle: 'Volume',

      discoveryMode: '⛏️ Discovery Mode',
      discoveryOnDesc: 'Auto-skip NoPlay, liked, and followed-artist tracks',
      discoveryOffDesc: 'OFF: Normal playback',
      discoveryStatusOn: 'ON',
      discoveryStatusOff: 'OFF',

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
      skipReasonHeard: 'Already heard',
      heardSkipLabel: 'Skip tracks heard once',
      heardSkipHint: 'Tracks played for 10 seconds are skipped in Discovery Mode. Starts OFF.',
      robotBanner: 'SoundCloud is showing a robot check. Please complete it on the page.',
      robotShort: 'Robot check',
      advancedSettings: '⚙ Dig Config',
      btnCopyLog: '📋 Copy diagnostic log',
      btnDownloadReport: '📥 Save Bug Report (JSON)',
      btnExportLists: '📤 Export lists',
      btnImportLists: '📥 Import',
      m_laterOpenFail: '⚠️ Could not open Saved artists',
      reportSaved: '✅ Report saved',
      reportFailed: '⚠️ Failed to save report',
      logCopied: 'Copied. Paste it together with what happened.',
      logCopyFailed: 'Could not copy',
      logHint: 'Press right after the sound stops, then paste it',

      dislikeSection: '⏭️ Sync NoPlay with SC Playlist',
      btnExportDislikes: '📤 Export to SC',
      btnExportingDislikes: '⏳ Exporting...',
      btnImportDislikes: '📥 Import from SC',
      btnImportingDislikes: '⏳ Importing...',
      exportingMsg: 'Creating / updating playlist on SoundCloud...',
      importingMsg: 'Fetching NoPlay tracks from SoundCloud playlist...',
      commErrorMsg: 'Failed to communicate with SoundCloud. Please reload the page.',

      statLikes: 'Skip Likes',
      statFollow: 'Skip Follows',
      statDislike: 'NoPlay',

      langLabel: '🌐 Language',

      // In-page Player Bar
      barStationTitle: '📡 Start station from this track',
      barDislikeTitle: '⏭️ Add this track to NoPlay and skip',
      barHateTitle: '🤬 Exclude artist & skip',
      barMiniPlayerTitle: '📻 Open Mini Player',
      barDiscoveryOffTitle: '⛏️ Turn Discovery ON',
      barDiscoveryOnTitle: '⛏️ Turn Discovery OFF',
      barFollowingModeTitle: '👥 Following only (click for Discovery)',

      // Mini Player
      mpTitle: 'FreshDig - Discovery Mini Player',
      mpPromptOpen: '📻 Click here to open Mini Player',
      mpLoadingTrack: 'Loading track...',
      mpStatusWaiting: 'Standby',
      mpStatusDigging: 'Digging',
      mpFollowBtn: '👤 Follow',
      mpFollowBtnTitle: 'Follow artist',
      mpStationBtn: '📡 Station',
      mpStationBtnTitle: 'Start station from this track',
      mpLaterListLabel: '🧐 Saved artists',
      mpDigListening: '⏸ Listening to artist',
      mpPrevTitle: 'Previous track',
      mpPlayTitle: 'Play / Pause',
      mpNextTitle: 'Next track',
      mpLikeTitle: 'Like',
      mpRepostTitle: 'Repost',
      mpAddPlTitle: 'Add to playlist',
      mpDislikeTitle: '⏭️ Add this track to NoPlay and skip',
      mpHateTitle: '🤬 Exclude artist & skip',
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
      mpStatusToggleOff: 'Turn Discovery OFF',
      mpStatusToggleOn: 'Turn Discovery ON',

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
      m_exNone: 'No NoPlay tracks to export (only tracks with a known ID can be exported).',
      m_connectFail: 'Could not connect to the SoundCloud account. Please reload the page.',
      m_exPlFail: 'Failed to fetch the NoPlay playlist (HTTP {s})',
      m_exUpdated: 'Exported to playlist "{name}" ({n} tracks in total{cap})',
      m_exCap: ', 500-track limit',
      m_exUpdateFail: 'Failed to update the export (HTTP {s})',
      m_exCreated: 'Created private playlist "{name}" and exported {n} tracks!',
      m_exCreateFail: 'Failed to create the playlist (HTTP {s})',
      m_imLogin: 'Not logged in to SoundCloud, so nothing can be imported. Log in and try again.',
      m_imNotFound: 'No playlist named "{name}" was found. Export first.',
      m_imFail: 'Failed to fetch the playlist (HTTP {s})',
      m_imEmpty: 'Playlist "{name}" has no tracks.',
      m_imDone: 'Checked {n} tracks in playlist "{name}" and added {c} new ones to NoPlay!',
      m_volRestored: '🔊 Volume restored ({n}%)',
      m_muted: '🔇 Muted',
      m_unmute: 'Unmute',
      m_discOn: '⛏️ Discovery Mode ON (known tracks are skipped)',
      m_discOff: '⏸ Discovery Mode OFF (normal SoundCloud playback)',
      m_toDiscovery: '⛏️ Switched to Discovery Mode (unknown artists)',
      m_toFollowing: '👥 Switched to Following Only Mode (new tracks only)',
      m_stOff: '⏸ Dig OFF',
      m_stOn: '⛏️ Dig ON',
      m_stFollow: '👥 Following only',
      m_stationStarted: '📡 Station started!',
      m_stationStartedMsg: 'Station started',
      m_stationLoading: '📡 Loading station...',
      m_stationPlaying: '📡 Station is now playing!',
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
      m_actionPending: 'The action was received and may still be processing. Check its result on SoundCloud.',
      m_volumeUnavailable: 'Volume change could not be confirmed. Use the SoundCloud volume control.',
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
      m_repostTip: 'Repost',
      m_repostUnverified: '⚠️ Could not verify repost on SoundCloud',
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
      tabLater: '🧐 Saved artists',
      tabNoPlay: '⏭️ NoPlay List',
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

      // First-use guide
      onboardingDialogLabel: 'FreshDig guide',
      onboardingTitle: 'How FreshDig works',
      onboardingStep1Title: 'Open the Mini Player',
      onboardingStep1Body: 'FreshDig’s standout feature. Open it from the extension icon or the 📻 on SoundCloud.',
      onboardingStep2Title: 'Dig ON mode',
      onboardingStep2Body: 'When ON, Dig skips NoPlay tracks, liked tracks, and tracks by artists you follow.',
      onboardingStep3Title: '🧐 Saved artists',
      onboardingStep3Body: 'Save an artist with 🧐 in the bottom row. Open the list from the extension icon, then select an artist to open their tracks page.',
      onboardingOpenLauncher: '📻 Open the page launcher',
      onboardingLauncherHint: 'Click the 📻 in the player controls on the SoundCloud page.',
      onboardingNext: 'Next',
      onboardingBack: 'Back',
      onboardingDone: 'Start using FreshDig',
      onboardingSkip: 'Skip guide',
      onboardingClose: 'Close',
      onboardingProgress: '{n} / 3',
      onboardingGuideButton: 'View guide',

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
      btnMiniPlayer: '📻 Mini-Player',
      btnStation: '📡 Station starten',
      btnStationTitle: 'Station für aktuellen Titel starten',
      autoMpLabel: 'Mini-Player beim Tab-Wechsel automatisch anzeigen (browsergesteuert)',
      autoMpTitle: 'Mini-Player bei Tab-Wechsel öffnen (Browserfreigabe)',
      autoMpNotSupported: 'Automatisches PiP wird hier nicht unterstützt (gespeicherte Einstellung bleibt erhalten)',
      autoMpPermissionNote: 'Browserberechtigung und hörbare Wiedergabe erforderlich. Der Browser entscheidet über das Verhalten beim Tab-Wechsel.',
      autoMpStatusRegistered: 'Bereit',
      autoMpStatusUnsupported: 'Nicht unterstützt (Einstellung bleibt)',
      autoMpStatusUnknown: 'Wird geprüft',
      autoMpLastError: 'Der Browser konnte automatisches PiP nicht registrieren',

      volControl: '🔊 Lautstärkeregelung',
      volMute: 'Stummschaltung umschalten',
      volSliderTitle: 'Lautstärke',

      discoveryMode: '⛏️ Entdeckungsmodus',
      discoveryOnDesc: 'NoPlay-, gelikte und Titel gefolgter Künstler automatisch überspringen',
      discoveryOffDesc: 'AUS: Normale Wiedergabe',
      discoveryStatusOn: 'AN',
      discoveryStatusOff: 'AUS',

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
      skipReasonHeard: 'Bereits gehört',
      heardSkipLabel: 'Einmal gehörte Titel überspringen',
      heardSkipHint: 'Titel nach 10 Sekunden Wiedergabe im Entdeckungsmodus überspringen. Standardmäßig AUS.',
      robotBanner: 'SoundCloud zeigt eine Bot-Prüfung an. Bitte schließe sie auf der Seite ab.',
      robotShort: 'Bot-Prüfung',
      advancedSettings: '⚙ Dig Config',
      btnCopyLog: '📋 Diagnoseprotokoll kopieren',
      btnDownloadReport: '📥 Fehlerbericht speichern (JSON)',
      btnExportLists: '📤 Listen exportieren',
      btnImportLists: '📥 Importieren',
      m_laterOpenFail: '⚠️ Die Später-Liste konnte nicht geöffnet werden',
      reportSaved: '✅ Bericht gespeichert',
      reportFailed: '⚠️ Bericht konnte nicht gespeichert werden',
      logCopied: 'Kopiert. Bitte zusammen mit dem Fehlerbericht einfügen.',
      logCopyFailed: 'Kopieren fehlgeschlagen',
      logHint: 'Direkt nach dem Musikstopp drücken und einfügen',

      dislikeSection: '⏭️ NoPlay mit SC-Playlist synchronisieren',
      btnExportDislikes: '📤 Zu SC exportieren',
      btnExportingDislikes: '⏳ Wird exportiert...',
      btnImportDislikes: '📥 Von SC importieren',
      btnImportingDislikes: '⏳ Wird importiert...',
      exportingMsg: 'Playlist auf SoundCloud wird erstellt/aktualisiert...',
      importingMsg: 'NoPlay-Titel werden aus SoundCloud-Playlist geladen...',
      commErrorMsg: 'Kommunikation mit SoundCloud fehlgeschlagen. Bitte Seite neu laden.',

      statLikes: 'Skip Likes',
      statFollow: 'Skip Follows',
      statDislike: 'NoPlay',

      langLabel: '🌐 Sprache',

      // In-page Player Bar
      barStationTitle: '📡 Station für diesen Titel starten',
      barDislikeTitle: '⏭️ Titel als NoPlay speichern und überspringen',
      barHateTitle: '🤬 Künstler ausschließen & überspringen',
      barMiniPlayerTitle: '📻 Mini-Player öffnen',
      barDiscoveryOffTitle: '⛏️ Entdeckungsmodus einschalten',
      barDiscoveryOnTitle: '⛏️ Entdeckungsmodus ausschalten',
      barFollowingModeTitle: '👥 Nur gefolgte Künstler (klicken für Entdeckungsmodus)',

      // Mini Player
      mpTitle: 'FreshDig - Entdeckungs-Mini-Player',
      mpPromptOpen: '📻 Hier klicken, um den Mini-Player zu öffnen',
      mpLoadingTrack: 'Titel wird geladen...',
      mpStatusWaiting: 'Bereit',
      mpStatusDigging: 'Am Entdecken',
      mpFollowBtn: '👤 Folgen',
      mpFollowBtnTitle: 'Künstler folgen',
      mpStationBtn: '📡 Station',
      mpStationBtnTitle: 'Station für diesen Titel starten',
      mpLaterListLabel: '🧐 Gespeicherte Künstler',
      mpDigListening: '⏸ Künstler anhören',
      mpPrevTitle: 'Vorheriger Titel',
      mpPlayTitle: 'Wiedergabe / Pause',
      mpNextTitle: 'Nächster Titel',
      mpLikeTitle: 'Gefällt mir (Like)',
      mpRepostTitle: 'Repost',
      mpAddPlTitle: 'Zu Playlist hinzufügen',
      mpDislikeTitle: '⏭️ Titel als NoPlay speichern und überspringen',
      mpHateTitle: '🤬 Künstler ausschließen & überspringen',
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
      mpStatusToggleOff: 'Entdeckungsmodus ausschalten',
      mpStatusToggleOn: 'Entdeckungsmodus einschalten',

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
      m_exNone: 'Keine NoPlay-Titel zum Exportieren (Nur Titel mit bekannter ID können exportiert werden).',
      m_connectFail: 'Verbindung zum SoundCloud-Konto fehlgeschlagen. Bitte Seite neu laden.',
      m_exPlFail: 'Abrufen der NoPlay-Playlist fehlgeschlagen (HTTP {s})',
      m_exUpdated: 'In Playlist „{name}“ exportiert (insgesamt {n} Titel{cap})',
      m_exCap: ', Limit von 500 Titeln',
      m_exUpdateFail: 'Export-Aktualisierung fehlgeschlagen (HTTP {s})',
      m_exCreated: 'Private Playlist „{name}“ erstellt und {n} Titel exportiert!',
      m_exCreateFail: 'Erstellung der Playlist fehlgeschlagen (HTTP {s})',
      m_imLogin: 'Nicht bei SoundCloud angemeldet. Bitte anmelden und erneut versuchen.',
      m_imNotFound: 'Keine Playlist mit dem Namen „{name}“ gefunden. Bitte zuerst exportieren.',
      m_imFail: 'Abrufen der Playlist fehlgeschlagen (HTTP {s})',
      m_imEmpty: 'Playlist „{name}“ enthält keine Titel.',
      m_imDone: '{n} Titel in Playlist „{name}“ überprüft und {c} neue zu NoPlay hinzugefügt!',
      m_volRestored: '🔊 Lautstärke wiederhergestellt ({n}%)',
      m_muted: '🔇 Stummgeschaltet',
      m_unmute: 'Stummschaltung aufheben',
      m_discOn: '⛏️ Entdeckungsmodus AN (bekannte Titel werden übersprungen)',
      m_discOff: '⏸ Entdeckungsmodus AUS (normale SoundCloud-Wiedergabe)',
      m_toDiscovery: '⛏️ Zum Entdeckungsmodus gewechselt (unbekannte Künstler)',
      m_toFollowing: '👥 Zum Nur-Gefolgte-Modus gewechselt (nur neue Titel)',
      m_stOff: '⏸ Dig AUS',
      m_stOn: '⛏️ Dig AN',
      m_stFollow: '👥 Nur Gefolgte',
      m_stationStarted: '📡 Station gestartet!',
      m_stationStartedMsg: 'Station gestartet',
      m_stationLoading: '📡 Station wird geladen...',
      m_stationPlaying: '📡 Station wird abgespielt!',
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
      m_actionPending: 'Die Aktion wurde empfangen und wird möglicherweise noch verarbeitet. Prüfe das Ergebnis auf SoundCloud.',
      m_volumeUnavailable: 'Die Lautstärkeänderung konnte nicht bestätigt werden. Nutze den SoundCloud-Lautstärkeregler.',
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
      m_repostTip: 'Repost',
      m_repostUnverified: '⚠️ Repost konnte auf SoundCloud nicht bestätigt werden',
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
      tabLater: '🧐 Gespeicherte Künstler',
      tabNoPlay: '⏭️ NoPlay-Liste',
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

      // First-use guide
      onboardingDialogLabel: 'FreshDig-Anleitung',
      onboardingTitle: 'So funktioniert FreshDig',
      onboardingStep1Title: 'Mini-Player öffnen',
      onboardingStep1Body: 'FreshDig-Highlight: Über das Erweiterungssymbol oder 📻 auf SoundCloud öffnen.',
      onboardingStep2Title: 'Dig-ON-Modus',
      onboardingStep2Body: 'Bei ON überspringt Dig NoPlay-Titel, gelikte Titel und Titel von Künstlern, denen du folgst.',
      onboardingStep3Title: '🧐 Gespeicherte Künstler',
      onboardingStep3Body: 'Speichere Künstler unten mit 🧐. Öffne die Liste über das Erweiterungssymbol und wähle einen Künstler, um seine Track-Seite zu öffnen.',
      onboardingOpenLauncher: '📻 Seiten-Launcher öffnen',
      onboardingLauncherHint: 'Klicke auf der SoundCloud-Seite in den Player-Steuerelementen auf 📻.',
      onboardingNext: 'Weiter',
      onboardingBack: 'Zurück',
      onboardingDone: 'FreshDig starten',
      onboardingSkip: 'Anleitung überspringen',
      onboardingClose: 'Schließen',
      onboardingProgress: '{n} / 3',
      onboardingGuideButton: 'Anleitung ansehen',

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
      btnMiniPlayer: '📻 Мини-плеер',
      btnStation: '📡 Запустить станцию',
      btnStationTitle: 'Запустить станцию текущего трека',
      autoMpLabel: 'Автоматически открывать мини-плеер при смене вкладки (управляет браузер)',
      autoMpTitle: 'Открывать мини-плеер при смене вкладки (нужно разрешение)',
      autoMpNotSupported: 'Автоматический PiP здесь не поддерживается (сохраненная настройка остается)',
      autoMpPermissionNote: 'Нужны разрешение браузера и слышимое воспроизведение. Поведение при смене вкладки определяет браузер.',
      autoMpStatusRegistered: 'Готово',
      autoMpStatusUnsupported: 'Не поддерживается (настройка сохранена)',
      autoMpStatusUnknown: 'Проверка',
      autoMpLastError: 'Браузер не смог зарегистрировать автоматический PiP',

      volControl: '🔊 Громкость',
      volMute: 'Вкл/выкл звук',
      volSliderTitle: 'Громкость',

      discoveryMode: '⛏️ Режим поиска',
      discoveryOnDesc: 'Пропускать треки NoPlay, лайкнутые треки и треки артистов, на которых вы подписаны',
      discoveryOffDesc: 'ВЫКЛ: обычное воспроизведение',
      discoveryStatusOn: 'ВКЛ',
      discoveryStatusOff: 'ВЫКЛ',

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
      skipReasonHeard: 'Уже прослушан',
      heardSkipLabel: 'Пропускать уже прослушанные треки',
      heardSkipHint: 'Треки после 10 секунд воспроизведения пропускаются в режиме поиска. По умолчанию ВЫКЛ.',
      robotBanner: 'SoundCloud показывает проверку на робота. Пожалуйста, пройдите её на странице.',
      robotShort: 'Проверка на робота',
      advancedSettings: '⚙ Dig Config',
      btnCopyLog: '📋 Скопировать лог диагностики',
      btnDownloadReport: '📥 Сохранить отчёт об ошибке (JSON)',
      btnExportLists: '📤 Экспорт списков',
      btnImportLists: '📥 Импорт',
      m_laterOpenFail: '⚠️ Не удалось открыть список на потом',
      reportSaved: '✅ Отчет сохранен',
      reportFailed: '⚠️ Не удалось сохранить отчет',
      logCopied: 'Скопировано. Вставьте вместе с описанием проблемы.',
      logCopyFailed: 'Не удалось скопировать',
      logHint: 'Нажмите сразу после остановки звука и вставьте',

      dislikeSection: '⏭️ Синхронизация NoPlay с плейлистом SC',
      btnExportDislikes: '📤 Экспорт в SC',
      btnExportingDislikes: '⏳ Экспорт...',
      btnImportDislikes: '📥 Импорт из SC',
      btnImportingDislikes: '⏳ Импорт...',
      exportingMsg: 'Создание/обновление плейлиста в SoundCloud...',
      importingMsg: 'Получение треков NoPlay из плейлиста SoundCloud...',
      commErrorMsg: 'Ошибка связи с SoundCloud. Пожалуйста, обновите страницу.',

      statLikes: 'Пропуск лайков',
      statFollow: 'Пропуск подписок',
      statDislike: 'Дизлайки',

      langLabel: '🌐 Язык',

      // In-page Player Bar
      barStationTitle: '📡 Запустить станцию этого трека',
      barDislikeTitle: '⏭️ Добавить трек в NoPlay и пропустить',
      barHateTitle: '🤬 Исключить артиста и пропустить',
      barMiniPlayerTitle: '📻 Открыть мини-плеер',
      barDiscoveryOffTitle: '⛏️ Включить режим поиска',
      barDiscoveryOnTitle: '⛏️ Выключить режим поиска',
      barFollowingModeTitle: '👥 Только подписки (нажмите для режима поиска)',

      // Mini Player
      mpTitle: 'FreshDig - Мини-плеер поиска',
      mpPromptOpen: '📻 Нажмите здесь, чтобы открыть мини-плеер',
      mpLoadingTrack: 'Загрузка трека...',
      mpStatusWaiting: 'Ожидание',
      mpStatusDigging: 'Поиск',
      mpFollowBtn: '👤 Подписаться',
      mpFollowBtnTitle: 'Подписаться на артиста',
      mpStationBtn: '📡 Станция',
      mpStationBtnTitle: 'Запустить станцию этого трека',
      mpLaterListLabel: '🧐 Сохранённые авторы',
      mpDigListening: '⏸ Слушаем артиста',
      mpPrevTitle: 'Предыдущий трек',
      mpPlayTitle: 'Воспроизведение / Пауза',
      mpNextTitle: 'Следующий трек',
      mpLikeTitle: 'Лайк',
      mpRepostTitle: 'Репост',
      mpAddPlTitle: 'Добавить в плейлист',
      mpDislikeTitle: '⏭️ Добавить трек в NoPlay и пропустить',
      mpHateTitle: '🤬 Исключить артиста и пропустить',
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
      mpStatusToggleOff: 'Выключить режим поиска',
      mpStatusToggleOn: 'Включить режим поиска',

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
      m_exNone: 'Нет треков NoPlay для экспорта (экспортируются только треки с известным ID).',
      m_connectFail: 'Не удалось подключиться к SoundCloud. Обновите страницу.',
      m_exPlFail: 'Не удалось получить плейлист NoPlay (HTTP {s})',
      m_exUpdated: 'Экспортировано в плейлист «{name}» (всего {n} треков{cap})',
      m_exCap: ', лимит 500 треков',
      m_exUpdateFail: 'Не удалось обновить экспорт (HTTP {s})',
      m_exCreated: 'Создан приватный плейлист «{name}» и экспортировано {n} треков!',
      m_exCreateFail: 'Не удалось создать плейлист (HTTP {s})',
      m_imLogin: 'Вход в SoundCloud не выполнен. Войдите и повторите попытку.',
      m_imNotFound: 'Плейлист с именем «{name}» не найден. Сначала выполните экспорт.',
      m_imFail: 'Не удалось получить плейлист (HTTP {s})',
      m_imEmpty: 'В плейлисте «{name}» нет треков.',
      m_imDone: 'Проверено {n} треков в плейлисте «{name}», добавлено {c} новых в NoPlay!',
      m_volRestored: '🔊 Громкость восстановлена ({n}%)',
      m_muted: '🔇 Звук выключен',
      m_unmute: 'Включить звук',
      m_discOn: '⛏️ Режим поиска ВКЛ (знакомые треки пропускаются)',
      m_discOff: '⏸ Режим поиска ВЫКЛ (обычное воспроизведение SoundCloud)',
      m_toDiscovery: '⛏️ Переключено в режим поиска (неизвестные артисты)',
      m_toFollowing: '👥 Переключено в режим отслеживаемых (только новые треки)',
      m_stOff: '⏸ Dig ВЫКЛ',
      m_stOn: '⛏️ Dig ВКЛ',
      m_stFollow: '👥 Только подписки',
      m_stationStarted: '📡 Станция запущена!',
      m_stationStartedMsg: 'Станция запущена',
      m_stationLoading: '📡 Загрузка станции...',
      m_stationPlaying: '📡 Станция играет!',
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
      m_actionPending: 'Действие получено и может ещё выполняться. Проверьте результат на SoundCloud.',
      m_volumeUnavailable: 'Не удалось подтвердить изменение громкости. Используйте регулятор SoundCloud.',
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
      m_repostTip: 'Сделать репост',
      m_repostUnverified: '⚠️ Не удалось подтвердить репост в SoundCloud',
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
      tabLater: '🧐 Сохранённые авторы',
      tabNoPlay: '⏭️ Список NoPlay',
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

      // First-use guide
      onboardingDialogLabel: 'Руководство FreshDig',
      onboardingTitle: 'Как работает FreshDig',
      onboardingStep1Title: 'Откройте мини-плеер',
      onboardingStep1Body: 'Главная функция FreshDig. Откройте его через значок расширения или 📻 на SoundCloud.',
      onboardingStep2Title: 'Режим Dig ВКЛ',
      onboardingStep2Body: 'В режиме ВКЛ пропускаются треки NoPlay, лайкнутые треки и треки артистов, на которых вы подписаны.',
      onboardingStep3Title: '🧐 Сохранённые авторы',
      onboardingStep3Body: 'Сохраните артиста кнопкой 🧐 внизу. Откройте список через значок расширения и выберите артиста, чтобы открыть страницу его треков.',
      onboardingOpenLauncher: '📻 Открыть кнопку на странице',
      onboardingLauncherHint: 'Нажмите 📻 в элементах управления плеером на странице SoundCloud.',
      onboardingNext: 'Далее',
      onboardingBack: 'Назад',
      onboardingDone: 'Начать работу с FreshDig',
      onboardingSkip: 'Пропустить руководство',
      onboardingClose: 'Закрыть',
      onboardingProgress: '{n} / 3',
      onboardingGuideButton: 'Посмотреть руководство',

      // Multi-playlist
      m_exMultiDone: 'Экспортировано {n} треков в {c} плейлистов, включая «{name}»!',
      m_imMultiDone: 'Проверено {n} треков из {c} плейлистов NoPlay, добавлено {added} новых!',

    }
  };

  // Vietnamese uses the complete English dictionary as a fallback for newer or
  // less common messages, while the primary popup, player and onboarding text
  // is translated here. This keeps the locale usable as the feature set grows.
  translations.vi = Object.assign({}, translations.en, {
    appName: 'FreshDig',
    notConnected: 'Chưa kết nối SoundCloud',
    notLoggedIn: '⚠️ Chưa đăng nhập SoundCloud',
    notLoggedInDesc: 'Đăng nhập SoundCloud để bỏ qua bài đã thích/nghệ sĩ theo dõi và thêm playlist',
    connecting: '🔄 Đang kết nối tài khoản...',
    connectingDesc: 'Nếu không kết nối được, hãy bấm [🔄 Đồng bộ] hoặc tải lại SoundCloud',
    connectedReady: 'Đã kết nối tài khoản · Sẵn sàng',
    connectedSyncing: 'Đã kết nối tài khoản · Đang đồng bộ',
    reloadRequired: '⚠️ Hãy tải lại tab SoundCloud',
    reloadRequiredDesc: 'Sau khi cập nhật tiện ích, cần tải lại tab SoundCloud đang mở',
    openSCTab: 'Hãy mở một tab SoundCloud',
    loadingSC: 'Đang tải SoundCloud...',
    btnMiniPlayer: '📻 Mini player',
    btnStation: '📡 Bắt đầu station',
    btnStationTitle: 'Bắt đầu station từ bài hiện tại',
    autoMpLabel: 'Tự mở mini player khi chuyển sang tab khác (trong phạm vi trình duyệt cho phép)',
    autoMpTitle: 'Tự hiển thị mini player khi đổi tab (cần quyền trình duyệt)',
    autoMpNotSupported: 'Trình duyệt này không hỗ trợ PiP tự động (cài đặt vẫn được lưu)',
    autoMpPermissionNote: 'Cần quyền trình duyệt và phát âm thanh. Trình duyệt quyết định hành vi khi đổi tab.',
    volControl: '🔊 Điều khiển âm lượng',
    volMute: 'Bật/tắt tiếng',
    volSliderTitle: 'Âm lượng',
    discoveryMode: '⛏️ Dig mode',
    discoveryOnDesc: 'Tự bỏ qua bài không phát, bài đã thích và nghệ sĩ đang theo dõi',
    discoveryOffDesc: 'TẮT: Phát bình thường',
    discoveryStatusOn: 'BẬT',
    discoveryStatusOff: 'TẮT',
    targetPlaylist: '➕ Playlist thêm nhanh',
    btnSync: '🔄 Đồng bộ',
    btnSyncing: '⏳ Đang đồng bộ...',
    noPlaylistFound: '(Không tìm thấy playlist)',
    trackCountSuffix: ' bài',
    skipToastPrefix: 'Đã bỏ qua',
    skipReasonDisliked: 'Bài bị loại trừ',
    skipReasonHated: 'Nghệ sĩ bị loại trừ',
    skipReasonGenre: 'Thể loại bị loại trừ',
    skipReasonOwn: 'Bài của bạn',
    skipReasonLiked: 'Đã thích',
    skipReasonFollowing: 'Nghệ sĩ đang theo dõi',
    skipReasonHeard: 'Đã nghe một lần',
    heardSkipLabel: 'Bỏ qua bài đã nghe một lần',
    heardSkipHint: 'Bài đã phát thực tế 10 giây sẽ bị bỏ qua trong Dig mode. Mặc định TẮT.',
    robotBanner: 'SoundCloud đang hiển thị bước xác minh bot. Hãy hoàn tất trên trang.',
    robotShort: 'Đang xác minh bot',
    advancedSettings: '⚙ Dig Settings',
    btnCopyLog: '📋 Sao chép nhật ký lỗi',
    btnDownloadReport: '📥 Lưu báo cáo lỗi (JSON)',
    btnExportLists: '📤 Xuất danh sách',
    btnImportLists: '📥 Nhập',
    m_laterOpenFail: '⚠️ Không thể mở danh sách nghệ sĩ để nghe sau',
    reportSaved: '✅ Đã lưu báo cáo',
    reportFailed: '⚠️ Không thể lưu báo cáo',
    logCopied: 'Đã sao chép. Hãy gửi cùng mô tả lúc phát bị dừng.',
    listsTitle: '📚 Danh sách',
    tabHated: '🤬 Nghệ sĩ bị loại trừ',
    tabLater: '🧐 Nghệ sĩ để nghe sau',
    tabNoPlay: '⏭️ Danh sách không phát',
    listSearch: 'Tìm kiếm',
    listMore: 'Hiển thị thêm',
    listUnban: 'Xóa ✕',
    listLaterDelete: '✕ Xóa',
    listEmpty: '(Chưa có mục nào)',
    listNeedTab: 'Mở tab SoundCloud để xem danh sách này',
    listFrom: 'Nguồn',
    pickerTitle: '➕ Chọn playlist để thêm nhanh',
    pickerCancel: 'Hủy',
    onboardingDialogLabel: 'Hướng dẫn FreshDig',
    onboardingTitle: 'FreshDig hoạt động như thế nào',
    onboardingStep1Title: 'Mở mini player',
    onboardingStep1Body: 'Tính năng chính của FreshDig. Mở từ biểu tượng tiện ích hoặc nút 📻 trên SoundCloud.',
    onboardingStep2Title: 'Dig mode BẬT',
    onboardingStep2Body: 'Khi BẬT, bài không phát, bài đã thích và bài của nghệ sĩ đang theo dõi sẽ được bỏ qua.',
    onboardingStep3Title: '🧐 Nghệ sĩ để nghe sau',
    onboardingStep3Body: 'Lưu nghệ sĩ bằng nút 🧐. Mở danh sách từ biểu tượng tiện ích rồi chọn nghệ sĩ để mở trang các bài hát.',
    onboardingOpenLauncher: '📻 Mở nút trên trang',
    onboardingLauncherHint: 'Bấm 📻 trong bộ điều khiển player trên SoundCloud.',
    onboardingNext: 'Tiếp theo',
    onboardingBack: 'Quay lại',
    onboardingDone: 'Bắt đầu với FreshDig',
    onboardingSkip: 'Bỏ qua hướng dẫn',
    onboardingClose: 'Đóng',
    onboardingProgress: '{n} / 3',
    onboardingGuideButton: 'Xem hướng dẫn',
    m_laterAdded: '🧐 Đã lưu “{name}” vào danh sách nghệ sĩ để nghe sau',
    m_laterRemoved: '🧐 Đã xóa “{name}” khỏi danh sách nghệ sĩ để nghe sau',
    m_laterAddTip: '🧐 Nghe sau (lưu nghệ sĩ này)',
    m_laterRemoveTip: '🧐 Đã lưu (bấm để xóa)',
    barMiniPlayerTitle: '📻 Mở mini player FreshDig',
    barStationTitle: '📡 Bắt đầu station từ bài này',
    barDislikeTitle: '⏭️ Không phát: bỏ qua bài này từ bây giờ',
    barHateTitle: '🤬 Loại trừ nghệ sĩ và bỏ qua',
    mpTitle: 'FreshDig - Mini player Dig', mpFollowBtnTitle: 'Theo dõi nghệ sĩ', mpStationBtnTitle: 'Bắt đầu station từ bài này',
    mpPrevTitle: 'Bài trước', mpPlayTitle: 'Phát / tạm dừng', mpNextTitle: 'Bài tiếp theo', mpLikeTitle: 'Thích (Like)', mpRepostTitle: 'Đăng lại (Repost)',
    mpAddPlTitle: 'Thêm vào playlist', mpDislikeTitle: '⏭️ Không phát: bỏ qua bài này', mpHateTitle: 'Loại trừ nghệ sĩ và bỏ qua',
    mpPromptOpen: '📻 Bấm để mở mini player',
    m_discOn: '⛏️ Dig mode BẬT (bài quen thuộc sẽ bị bỏ qua)',
    m_discOff: '⏸ Dig mode TẮT (phát SoundCloud bình thường)'
  });

  translations.es = Object.assign({}, translations.en, {
    appName: 'FreshDig',
    notConnected: 'SoundCloud no conectado', notLoggedIn: '⚠️ No has iniciado sesión en SoundCloud',
    notLoggedInDesc: 'Inicia sesión para omitir Me gusta/seguidos y añadir canciones a playlists',
    connecting: '🔄 Conectando la cuenta...', connectingDesc: 'Si no conecta, pulsa [🔄 Sincronizar] o recarga SoundCloud',
    connectedReady: 'Cuenta conectada · Listo', connectedSyncing: 'Cuenta conectada · Sincronizando',
    reloadRequired: '⚠️ Recarga la pestaña de SoundCloud', reloadRequiredDesc: 'Después de actualizar la extensión, recarga la pestaña de SoundCloud abierta',
    openSCTab: 'Abre una pestaña de SoundCloud', loadingSC: 'Cargando SoundCloud...',
    btnMiniPlayer: '📻 Mini reproductor', btnStation: '📡 Iniciar estación', btnStationTitle: 'Iniciar una estación desde la canción actual',
    autoMpLabel: 'Mostrar automáticamente el mini reproductor al abrir otra pestaña (según los permisos del navegador)',
    autoMpTitle: 'Mostrar automáticamente el mini reproductor al cambiar de pestaña (requiere permiso)',
    autoMpNotSupported: 'Este navegador no admite PiP automático (la configuración se conserva)',
    autoMpPermissionNote: 'Requiere permiso del navegador y reproducción con sonido. El navegador decide qué ocurre al cambiar de pestaña.',
    volControl: '🔊 Control de volumen', volMute: 'Activar/desactivar silencio', volSliderTitle: 'Volumen',
    discoveryMode: '⛏️ Modo Dig', discoveryOnDesc: 'Omite automáticamente canciones no reproducibles, con Me gusta y de artistas seguidos',
    discoveryOffDesc: 'DESACTIVADO: Reproducción normal', discoveryStatusOn: 'ACTIVADO', discoveryStatusOff: 'DESACTIVADO',
    targetPlaylist: '➕ Playlist para añadir con un clic', btnSync: '🔄 Sincronizar', btnSyncing: '⏳ Sincronizando...', noPlaylistFound: '(No se encontraron playlists)',
    trackCountSuffix: ' canciones', skipToastPrefix: 'Omitida', skipReasonDisliked: 'Canción excluida', skipReasonHated: 'Artista excluido',
    skipReasonGenre: 'Género excluido', skipReasonOwn: 'Tu propia canción', skipReasonLiked: 'Ya tiene Me gusta', skipReasonFollowing: 'Artista seguido', skipReasonHeard: 'Escuchada una vez',
    heardSkipLabel: 'Omitir canciones escuchadas una vez', heardSkipHint: 'Las canciones reproducidas durante 10 segundos se omiten en el modo Dig. DESACTIVADO de forma predeterminada.',
    robotBanner: 'SoundCloud muestra una verificación de bot. Complétala en la página.', robotShort: 'Verificación de bot', advancedSettings: '⚙ Configuración de Dig',
    btnCopyLog: '📋 Copiar registro de errores', btnDownloadReport: '📥 Guardar informe de error (JSON)', btnExportLists: '📤 Exportar listas', btnImportLists: '📥 Importar',
    m_laterOpenFail: '⚠️ No se pudo abrir la lista de artistas para escuchar después', reportSaved: '✅ Informe guardado', reportFailed: '⚠️ No se pudo guardar el informe',
    logCopied: 'Copiado. Envíalo junto con lo ocurrido cuando se detuvo la reproducción.', listsTitle: '📚 Listas', tabHated: '🤬 Artistas excluidos', tabLater: '🧐 Artistas para escuchar después',
    tabNoPlay: '⏭️ Lista de no reproducir', listSearch: 'Buscar', listMore: 'Mostrar más', listUnban: 'Eliminar ✕', listLaterDelete: '✕ Eliminar', listEmpty: '(Todavía no hay elementos)',
    listNeedTab: 'Abre una pestaña de SoundCloud para ver esta lista', listFrom: 'Origen', pickerTitle: '➕ Elige una playlist para añadir con un clic', pickerCancel: 'Cancelar',
    onboardingDialogLabel: 'Guía de FreshDig', onboardingTitle: 'Cómo funciona FreshDig', onboardingStep1Title: 'Abre el mini reproductor',
    onboardingStep1Body: 'La función principal de FreshDig. Ábrelo desde el icono de la extensión o el botón 📻 de SoundCloud.', onboardingStep2Title: 'Modo Dig ACTIVADO',
    onboardingStep2Body: 'Cuando está ACTIVADO, se omiten canciones no reproducibles, con Me gusta y de artistas que sigues.', onboardingStep3Title: '🧐 Artistas para escuchar después',
    onboardingStep3Body: 'Guarda un artista con el botón 🧐. Abre la lista desde el icono de la extensión y elige un artista para abrir su página de canciones.',
    onboardingOpenLauncher: '📻 Mostrar el botón en la página', onboardingLauncherHint: 'Pulsa 📻 en los controles del reproductor de SoundCloud.', onboardingNext: 'Siguiente', onboardingBack: 'Atrás',
    onboardingDone: 'Empezar a usar FreshDig', onboardingSkip: 'Omitir guía', onboardingClose: 'Cerrar', onboardingProgress: '{n} / 3', onboardingGuideButton: 'Ver guía',
    m_laterAdded: '🧐 “{name}” se guardó en artistas para escuchar después', m_laterRemoved: '🧐 “{name}” se eliminó de artistas para escuchar después',
    m_laterAddTip: '🧐 Escuchar después (guardar este artista)', m_laterRemoveTip: '🧐 Guardado (pulsa para eliminar)',
    barMiniPlayerTitle: '📻 Abrir mini reproductor FreshDig', barStationTitle: '📡 Iniciar estación desde esta canción',
    barDislikeTitle: '⏭️ No reproducir: omitir esta canción desde ahora', barHateTitle: '🤬 Excluir artista y omitir',
    mpTitle: 'FreshDig - Mini reproductor Dig', mpFollowBtnTitle: 'Seguir al artista', mpStationBtnTitle: 'Iniciar estación desde esta canción',
    mpPrevTitle: 'Canción anterior', mpPlayTitle: 'Reproducir / pausar', mpNextTitle: 'Siguiente canción', mpLikeTitle: 'Me gusta (Like)', mpRepostTitle: 'Repost',
    mpAddPlTitle: 'Añadir a playlist', mpDislikeTitle: '⏭️ No reproducir: omitir esta canción', mpHateTitle: 'Excluir artista y omitir',
    mpPromptOpen: '📻 Pulsa para abrir el mini reproductor', m_discOn: '⛏️ Modo Dig ACTIVADO (se omiten canciones conocidas)', m_discOff: '⏸ Modo Dig DESACTIVADO (reproducción normal de SoundCloud)'
  });

  // Fill every remaining runtime message for Vietnamese and Spanish so the
  // UI never silently displays English in those locales.
  Object.assign(translations.vi, {
    autoMpStatusRegistered:'Đã sẵn sàng',autoMpStatusUnsupported:'Không được hỗ trợ (giữ cài đặt)',autoMpStatusUnknown:'Đang kiểm tra',autoMpLastError:'Trình duyệt không đăng ký được PiP tự động',playlistSyncing:'Đang đồng bộ… Hãy nhấn [🔄 Đồng bộ]',
    skipReasonManyFollowers:'Nghệ sĩ có nhiều người theo dõi',skipReasonManyTracks:'Nghệ sĩ có nhiều bài hát',skipReasonManyPlays:'Bài hát có nhiều lượt phát',skipReasonOldTrack:'Bài hát cũ',logCopyFailed:'Không thể sao chép',logHint:'Nhấn ngay sau khi âm thanh dừng rồi dán nội dung',
    dislikeSection:'⏭️ Đồng bộ NoPlay với playlist SC',btnExportDislikes:'📤 Xuất sang SC',btnExportingDislikes:'⏳ Đang xuất…',btnImportDislikes:'📥 Nhập từ SC',btnImportingDislikes:'⏳ Đang nhập…',exportingMsg:'Đang tạo hoặc cập nhật playlist trên SoundCloud…',importingMsg:'Đang lấy bài NoPlay từ playlist SoundCloud…',commErrorMsg:'Không thể liên lạc với SoundCloud. Hãy tải lại trang.',
    statLikes:'Bỏ qua lượt thích',statFollow:'Bỏ qua lượt theo dõi',statDislike:'NoPlay',langLabel:'🌐 Ngôn ngữ',barDiscoveryOffTitle:'⛏️ Bật chế độ Dig',barDiscoveryOnTitle:'⛏️ Tắt chế độ Dig',barFollowingModeTitle:'👥 Chỉ người theo dõi (nhấn để Dig)',
    mpLoadingTrack:'Đang tải bài hát…',mpStatusWaiting:'Đang chờ',mpStatusDigging:'Đang đào',mpFollowBtn:'👤 Theo dõi',mpStationBtn:'📡 Station',mpLaterListLabel:'🧐 Danh sách nghe sau',mpDigListening:'⏸ Đang nghe nghệ sĩ',mpToastDislike:'⏭️ Đã thêm vào NoPlay và bỏ qua',mpToastHate:'🤬 Đã loại nghệ sĩ và bỏ qua',mpToastAddedPl:'➕ Đã thêm vào playlist',mpToastRemovedPl:'➖ Đã xóa khỏi playlist',mpToastLiked:'❤️ Đã thích bài hát',mpToastUnliked:'🤍 Đã bỏ thích bài hát',mpToastReposted:'🔁 Đã đăng lại bài hát',mpToastUnreposted:'↩️ Đã bỏ đăng lại',mpToastFollowed:'👤 Đã theo dõi nghệ sĩ',mpToastUnfollowed:'👤 Đã bỏ theo dõi nghệ sĩ',mpStatusToggleOff:'Tắt chế độ Dig',mpStatusToggleOn:'Bật chế độ Dig',
    m_streakStop:'⚠️ Nhiều bài đã biết liên tiếp — phát bài này như bình thường',m_savedTo:'Đích',m_plBtnNoTarget:'➕ Thêm vào playlist bằng một chạm (nhấn để chọn đích)',m_plBtnIn:'✔ Đã có trong “{name}” (nhấn để xóa / nhấp phải để đổi đích)',m_plBtnOut:'➕ Thêm vào “{name}” (nhấn lại để xóa / nhấp phải để đổi đích)',m_plFetching:'🔄 Đang lấy playlist…',m_plNoLogin:'⚠️ Chưa đăng nhập SoundCloud — không thể lấy playlist',m_plNone:'⚠️ Chưa có playlist. Hãy tạo một playlist trên SoundCloud trước',m_plTargetSet:'📋 Đã chọn “{name}” làm đích!',m_noTrackInfo:'⚠️ Không lấy được thông tin bài hiện tại',m_loginToken:'⚠️ Hãy đăng nhập SoundCloud (không tìm thấy mã xác thực)',m_pickTarget:'📋 Hãy chọn playlist',m_plAborted:'⚠️ Đã hủy thêm vào playlist',m_plDefaultName:'playlist',m_plTargetMissing:'⚠️ Không tìm thấy playlist đích. Hãy chọn lại',m_plNoTargetAbort:'⚠️ Đã hủy vì chưa chọn playlist',m_authFail:'❌ Xác thực tài khoản thất bại ({s}). Hãy tải lại SoundCloud hoặc đăng nhập lại',m_plFull:'⚠️ “{name}” đã đạt giới hạn 500 bài',m_plRemoved:'➖ Đã xóa “{track}” khỏi “{name}”',m_plAdded:'✅ Đã thêm “{track}” vào “{name}” (nhấn lại để xóa)',m_plUpdateFail:'❌ Không thể cập nhật playlist ({s})',m_error:'❌ Lỗi: {msg}',m_errorOcc:'Đã xảy ra lỗi: {msg}',
    m_exLogin:'Chưa đăng nhập SoundCloud nên không thể xuất. Hãy đăng nhập rồi thử lại.',m_exNone:'Không có bài NoPlay để xuất (chỉ xuất được bài có ID).',m_connectFail:'Không thể kết nối tài khoản SoundCloud. Hãy tải lại trang.',m_exPlFail:'Không thể lấy playlist NoPlay (HTTP {s})',m_exUpdated:'Đã xuất vào playlist “{name}” (tổng {n} bài{cap})',m_exCap:', giới hạn 500 bài',m_exUpdateFail:'Không thể cập nhật bản xuất (HTTP {s})',m_exCreated:'Đã tạo playlist riêng tư “{name}” và xuất {n} bài!',m_exCreateFail:'Không thể tạo playlist (HTTP {s})',m_imLogin:'Chưa đăng nhập SoundCloud nên không thể nhập. Hãy đăng nhập rồi thử lại.',m_imNotFound:'Không tìm thấy playlist “{name}”. Hãy xuất trước.',m_imFail:'Không thể lấy playlist (HTTP {s})',m_imEmpty:'Playlist “{name}” không có bài hát.',m_imDone:'Đã kiểm tra {n} bài trong “{name}” và thêm {c} bài mới vào NoPlay!',m_exMultiDone:'Đã xuất {n} bài qua {c} playlist, gồm “{name}”!',m_imMultiDone:'Đã kiểm tra {n} bài qua {c} playlist NoPlay và thêm {added} bài mới!',
    m_volRestored:'🔊 Đã khôi phục âm lượng ({n}%)',m_muted:'🔇 Đã tắt tiếng',m_unmute:'Bật tiếng',m_toDiscovery:'⛏️ Đã chuyển sang chế độ Dig (nghệ sĩ chưa biết)',m_toFollowing:'👥 Đã chuyển sang chỉ theo dõi (chỉ bài mới)',m_stOff:'⏸ Tắt Dig',m_stOn:'⛏️ Bật Dig',m_stFollow:'👥 Chỉ theo dõi',m_stationStarted:'📡 Đã khởi động station!',m_stationStartedMsg:'Đã khởi động station',m_stationLoading:'📡 Đang tải station…',m_stationPlaying:'📡 Station đang phát!',m_stationNoTrack:'⚠️ Không lấy được thông tin bài hiện tại',m_stationNoTrackMsg:'Không lấy được thông tin bài',
    m_repostHead:'🔁 Đăng lại',m_repostPh:'Bình luận về bài hát (không bắt buộc, tối đa {n} ký tự)',m_send:'Gửi',m_reposting:'🔁 Đang đăng lại…',m_repostFail:'⚠️ Đăng lại thất bại ({s})',m_repostCapFail:'⚠️ Đã đăng lại nhưng bình luận thất bại ({s})',m_repostedCap:'🔁 Đã đăng lại và gửi bình luận!',m_reposted:'🔁 Đã đăng lại!',m_commErr:'⚠️ Đã xảy ra lỗi liên lạc',m_tabNoReply:'⚠️ Tab đang phát không phản hồi',m_actionPending:'Đã nhận thao tác và có thể vẫn đang xử lý. Kiểm tra kết quả trên SoundCloud.',m_volumeUnavailable:'Không xác nhận được thay đổi âm lượng. Hãy dùng điều khiển âm lượng SoundCloud.',m_noLikeBtn:'⚠️ Không tìm thấy nút thích',m_trackLoading:'⚠️ Đang lấy thông tin bài hát…',m_loginPlease:'⚠️ Hãy đăng nhập SoundCloud',m_unreposting:'🔁 Đang bỏ đăng lại…',m_unrepostFail:'⚠️ Không thể bỏ đăng lại ({s})',m_artistDefault:'nghệ sĩ',m_artistLoading:'⚠️ Đang kiểm tra ID nghệ sĩ…',m_unfollowing:'👤 Đang bỏ theo dõi…',m_following:'👤 Đang theo dõi…',m_unfollowed:'👤 Đã bỏ theo dõi {name}',m_followed:'👤 Đã theo dõi {name}!',m_followFail:'⚠️ Theo dõi thất bại ({s})',m_notPlaying:'Không phát',m_repostedTip:'Đã đăng lại (nhấn để bỏ)',m_repostTip:'Đăng lại',m_repostUnverified:'⚠️ Không thể xác minh đăng lại trên SoundCloud',m_followingLbl:'👤✓ Đang theo dõi',m_untitled:'(không có tên)',m_hateOff:'🤬 Đã bỏ “{name}” khỏi danh sách loại trừ',m_hateOnTip:'🤬 Đã loại trừ (nhấn để bỏ)',m_laterLimit:'⚠️ Danh sách nghe sau chứa tối đa 500 nghệ sĩ',m_laterFail:'⚠️ Không thể lưu danh sách nghe sau',m_profileTag:'🤬 Bị FreshDig loại trừ',m_profileUnban:'Bỏ loại trừ',
    freshTitle:'✨ Bỏ qua theo độ mới (chế độ Dig)',freshFollowersPre:'Bỏ qua nghệ sĩ có hơn',freshFollowersPost:'người theo dõi',freshTracksPre:'Bỏ qua nghệ sĩ có hơn',freshTracksPost:'bài hát',freshPlaysPre:'Bỏ qua bài được phát hơn',freshPlaysPost:'lần',freshAgePre:'Bỏ qua bài cũ hơn',freshAgePost:'ngày',freshHint:'Không bỏ qua khi không biết số liệu. Số liệu nghệ sĩ được lưu 7 ngày.',ratePromptTitle:'🌟 Bạn có tìm thấy nhạc mới với FreshDig không?',ratePromptDesc:'Nếu tiện ích giúp bạn khám phá nhạc SoundCloud, hãy đánh giá hoặc viết nhận xét trên Chrome Web Store! Điều đó khích lệ nghệ sĩ mới và các bản cập nhật.',btnRateNow:'⭐ Viết đánh giá',btnRateLater:'Để sau',btnRateDismiss:'Bỏ qua',onboardingProgress:'{n} / 3'
  });
  Object.assign(translations.es, {
    autoMpStatusRegistered:'Listo',autoMpStatusUnsupported:'No compatible (se conserva la configuración)',autoMpStatusUnknown:'Comprobando',autoMpLastError:'El navegador no pudo registrar el PiP automático',playlistSyncing:'Sincronizando… Pulsa [🔄 Sincronizar]',
    skipReasonManyFollowers:'Artista con muchos seguidores',skipReasonManyTracks:'Artista con muchas pistas',skipReasonManyPlays:'Pista con muchas reproducciones',skipReasonOldTrack:'Pista antigua',logCopyFailed:'No se pudo copiar',logHint:'Pulsa justo después de que se detenga el sonido y pega el contenido',
    dislikeSection:'⏭️ Sincronizar NoPlay con la playlist de SC',btnExportDislikes:'📤 Exportar a SC',btnExportingDislikes:'⏳ Exportando…',btnImportDislikes:'📥 Importar de SC',btnImportingDislikes:'⏳ Importando…',exportingMsg:'Creando o actualizando la playlist en SoundCloud…',importingMsg:'Obteniendo pistas NoPlay de la playlist de SoundCloud…',commErrorMsg:'No se pudo comunicar con SoundCloud. Recarga la página.',
    statLikes:'Omitir Me gusta',statFollow:'Omitir seguidos',statDislike:'NoPlay',langLabel:'🌐 Idioma',barDiscoveryOffTitle:'⛏️ Activar modo Dig',barDiscoveryOnTitle:'⛏️ Desactivar modo Dig',barFollowingModeTitle:'👥 Solo seguidos (pulsa para Dig)',
    mpLoadingTrack:'Cargando pista…',mpStatusWaiting:'En espera',mpStatusDigging:'Excavando',mpFollowBtn:'👤 Seguir',mpStationBtn:'📡 Station',mpLaterListLabel:'🧐 Lista para escuchar después',mpDigListening:'⏸ Escuchando al artista',mpToastDislike:'⏭️ Añadida a NoPlay y omitida',mpToastHate:'🤬 Artista excluido y omitido',mpToastAddedPl:'➕ Añadida a la playlist',mpToastRemovedPl:'➖ Eliminada de la playlist',mpToastLiked:'❤️ Pista marcada con Me gusta',mpToastUnliked:'🤍 Me gusta eliminado',mpToastReposted:'🔁 Pista republicada',mpToastUnreposted:'↩️ Republicación eliminada',mpToastFollowed:'👤 Artista seguido',mpToastUnfollowed:'👤 Artista dejado de seguir',mpStatusToggleOff:'Desactivar modo Dig',mpStatusToggleOn:'Activar modo Dig',
    m_streakStop:'⚠️ Varias pistas conocidas seguidas: esta se reproduce sin filtrar',m_savedTo:'Destino',m_plBtnNoTarget:'➕ Añadir a una playlist con un clic (pulsa para elegir destino)',m_plBtnIn:'✔ Ya está en “{name}” (pulsa para quitar / clic derecho para cambiar destino)',m_plBtnOut:'➕ Añadir a “{name}” (pulsa otra vez para quitar / clic derecho para cambiar destino)',m_plFetching:'🔄 Obteniendo playlists…',m_plNoLogin:'⚠️ No has iniciado sesión en SoundCloud; no se pueden obtener playlists',m_plNone:'⚠️ No hay playlists. Crea una en SoundCloud primero',m_plTargetSet:'📋 Destino establecido: “{name}”',m_noTrackInfo:'⚠️ No se pudo obtener la pista actual',m_loginToken:'⚠️ Inicia sesión en SoundCloud (no se encontró el token)',m_pickTarget:'📋 Elige una playlist',m_plAborted:'⚠️ Añadido a la playlist cancelado',m_plDefaultName:'la playlist',m_plTargetMissing:'⚠️ No se encontró la playlist de destino. Elígela de nuevo',m_plNoTargetAbort:'⚠️ Cancelado porque no se eligió playlist',m_authFail:'❌ Falló la autenticación ({s}). Recarga SoundCloud o inicia sesión de nuevo',m_plFull:'⚠️ “{name}” alcanzó el límite de 500 pistas',m_plRemoved:'➖ Se quitó “{track}” de “{name}”',m_plAdded:'✅ Se añadió “{track}” a “{name}” (pulsa otra vez para quitar)',m_plUpdateFail:'❌ No se pudo actualizar la playlist ({s})',m_error:'❌ Error: {msg}',m_errorOcc:'Se produjo un error: {msg}',
    m_exLogin:'No has iniciado sesión en SoundCloud; no se puede exportar. Inicia sesión e inténtalo de nuevo.',m_exNone:'No hay pistas NoPlay para exportar (solo se exportan pistas con ID conocido).',m_connectFail:'No se pudo conectar con la cuenta de SoundCloud. Recarga la página.',m_exPlFail:'No se pudo obtener la playlist NoPlay (HTTP {s})',m_exUpdated:'Exportadas a “{name}” ({n} pistas en total{cap})',m_exCap:', límite de 500 pistas',m_exUpdateFail:'No se pudo actualizar la exportación (HTTP {s})',m_exCreated:'Se creó la playlist privada “{name}” y se exportaron {n} pistas',m_exCreateFail:'No se pudo crear la playlist (HTTP {s})',m_imLogin:'No has iniciado sesión en SoundCloud; no se puede importar. Inicia sesión e inténtalo de nuevo.',m_imNotFound:'No se encontró la playlist “{name}”. Exporta primero.',m_imFail:'No se pudo obtener la playlist (HTTP {s})',m_imEmpty:'La playlist “{name}” no tiene pistas.',m_imDone:'Se comprobaron {n} pistas de “{name}” y se añadieron {c} nuevas a NoPlay',m_exMultiDone:'Se exportaron {n} pistas en {c} playlists, incluida “{name}”',m_imMultiDone:'Se comprobaron {n} pistas en {c} playlists NoPlay y se añadieron {added} nuevas',
    m_volRestored:'🔊 Volumen restaurado ({n}%)',m_muted:'🔇 Silenciado',m_unmute:'Activar sonido',m_toDiscovery:'⛏️ Cambiado al modo Dig (artistas desconocidos)',m_toFollowing:'👥 Cambiado al modo Solo seguidos (solo pistas nuevas)',m_stOff:'⏸ Dig desactivado',m_stOn:'⛏️ Dig activado',m_stFollow:'👥 Solo seguidos',m_stationStarted:'📡 ¡Station iniciada!',m_stationStartedMsg:'Station iniciada',m_stationLoading:'📡 Cargando station…',m_stationPlaying:'📡 ¡La station está reproduciendo!',m_stationNoTrack:'⚠️ No se pudo obtener la pista actual',m_stationNoTrackMsg:'No se pudo obtener la pista',
    m_repostHead:'🔁 Republicar',m_repostPh:'Comentario de la pista (opcional, hasta {n} caracteres)',m_send:'Enviar',m_reposting:'🔁 Republicando…',m_repostFail:'⚠️ Falló la republicación ({s})',m_repostCapFail:'⚠️ Republicada, pero falló el comentario ({s})',m_repostedCap:'🔁 ¡Republicada y comentario publicado!',m_reposted:'🔁 ¡Republicada!',m_commErr:'⚠️ Se produjo un error de comunicación',m_tabNoReply:'⚠️ La pestaña que reproduce no responde',m_actionPending:'La acción se recibió y puede seguir procesándose. Comprueba el resultado en SoundCloud.',m_volumeUnavailable:'No se pudo confirmar el volumen. Usa el control de volumen de SoundCloud.',m_noLikeBtn:'⚠️ No se encontró el botón Me gusta',m_trackLoading:'⚠️ Obteniendo información de la pista…',m_loginPlease:'⚠️ Inicia sesión en SoundCloud',m_unreposting:'🔁 Quitando la republicación…',m_unrepostFail:'⚠️ No se pudo quitar la republicación ({s})',m_artistDefault:'el artista',m_artistLoading:'⚠️ Comprobando el ID del artista…',m_unfollowing:'👤 Dejando de seguir…',m_following:'👤 Siguiendo…',m_unfollowed:'👤 Dejaste de seguir a {name}',m_followed:'👤 ¡Sigues a {name}!',m_followFail:'⚠️ Falló el seguimiento ({s})',m_notPlaying:'No se está reproduciendo',m_repostedTip:'Republicada (pulsa para quitar)',m_repostTip:'Republicar',m_repostUnverified:'⚠️ No se pudo verificar la republicación en SoundCloud',m_followingLbl:'👤✓ Siguiendo',m_untitled:'(sin título)',m_hateOff:'🤬 “{name}” eliminado de las exclusiones',m_hateOnTip:'🤬 Excluido (pulsa para quitar)',m_laterLimit:'⚠️ La lista para después admite hasta 500 artistas',m_laterFail:'⚠️ No se pudo guardar la lista para después',m_profileTag:'🤬 Excluido por FreshDig',m_profileUnban:'Quitar exclusión',
    freshTitle:'✨ Omitir por antigüedad (modo Dig)',freshFollowersPre:'Omitir artistas con más de',freshFollowersPost:'seguidores',freshTracksPre:'Omitir artistas con más de',freshTracksPost:'pistas',freshPlaysPre:'Omitir pistas reproducidas más de',freshPlaysPost:'veces',freshAgePre:'Omitir pistas de más de',freshAgePost:'días',freshHint:'No se omite nada cuando se desconoce el número. Los datos del artista se conservan 7 días.',ratePromptTitle:'🌟 ¿Has descubierto música nueva con FreshDig?',ratePromptDesc:'Si esta extensión te ayuda a descubrir música en SoundCloud, deja una valoración o reseña en Chrome Web Store. Ayuda a mejorar FreshDig y anima a nuevos artistas.',btnRateNow:'⭐ Escribir reseña',btnRateLater:'Más tarde',btnRateDismiss:'Descartar',onboardingProgress:'{n} / 3'
  });
  Object.assign(translations.de, {
    advancedSettings:'⚙ Dig-Einstellungen',statLikes:'Likes überspringen',statFollow:'Gefolgte überspringen',statDislike:'NoPlay',mpStationBtn:'📡 Station',mpRepostTitle:'Repost',m_repostHead:'🔁 Repost',m_repostTip:'Repost',onboardingProgress:'{n} / 3'
  });
  Object.assign(translations.ru, { advancedSettings:'⚙ Настройки Dig', onboardingProgress:'{n} / 3' });
  const digRuleLabels = {
    ja: { digRulesTitle: 'Digモードで飛ばす条件', digRulesHint: '選択した条件だけをDig ON中にスキップします。初期状態はすべてONです。', digRuleFollowing: 'フォロー中の作者', digRuleHated: 'BANした作者', digRuleLater: '後で聴く人リストの作者', digRuleLiked: 'Like済みの曲', digRuleNoplay: 'NoPlayに入っている曲' },
    en: { digRulesTitle: 'Skip conditions in Dig mode', digRulesHint: 'Only selected conditions are skipped while Dig is ON. All are enabled by default.', digRuleFollowing: 'Followed artists', digRuleHated: 'Banned artists', digRuleLater: 'Artists in Saved artists', digRuleLiked: 'Liked tracks', digRuleNoplay: 'Tracks in NoPlay' },
    de: { digRulesTitle: 'Überspringen im Dig-Modus', digRulesHint: 'Nur ausgewählte Bedingungen werden bei aktiviertem Dig übersprungen. Standardmäßig sind alle aktiv.', digRuleFollowing: 'Gefolgte Künstler', digRuleHated: 'Gesperrte Künstler', digRuleLater: 'Künstler in „Für später“', digRuleLiked: 'Titel mit „Gefällt mir“', digRuleNoplay: 'Titel in NoPlay' },
    ru: { digRulesTitle: 'Пропускать в режиме Dig', digRulesHint: 'При включенном Dig пропускаются только выбранные условия. По умолчанию включены все.', digRuleFollowing: 'Авторы, на которых вы подписаны', digRuleHated: 'Заблокированные авторы', digRuleLater: 'Авторы в списке «На потом»', digRuleLiked: 'Понравившиеся треки', digRuleNoplay: 'Треки в NoPlay' },
    vi: { digRulesTitle: 'Điều kiện bỏ qua trong Dig mode', digRulesHint: 'Chỉ các điều kiện đã chọn mới bị bỏ qua khi Dig BẬT. Mặc định bật tất cả.', digRuleFollowing: 'Nghệ sĩ đang theo dõi', digRuleHated: 'Nghệ sĩ bị cấm', digRuleLater: 'Nghệ sĩ trong danh sách nghe sau', digRuleLiked: 'Bài đã thích', digRuleNoplay: 'Bài trong NoPlay' },
    es: { digRulesTitle: 'Condiciones que se omiten en el modo Dig', digRulesHint: 'Con Dig ACTIVADO solo se omiten las condiciones seleccionadas. Todas están activadas inicialmente.', digRuleFollowing: 'Artistas seguidos', digRuleHated: 'Artistas bloqueados', digRuleLater: 'Artistas para escuchar después', digRuleLiked: 'Canciones con Me gusta', digRuleNoplay: 'Canciones en NoPlay' }
  };
  Object.keys(digRuleLabels).forEach(function (lang) { Object.assign(translations[lang], digRuleLabels[lang]); });

  function resolveLanguage(langPref) {
    if (langPref === 'ja' || langPref === 'en' || langPref === 'de' || langPref === 'ru' || langPref === 'vi' || langPref === 'es') return langPref;
    // auto detect from browser/navigator
    try {
      const navLang = ((typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en').toLowerCase();
      if (navLang.startsWith('ja')) return 'ja';
      if (navLang.startsWith('de')) return 'de';
      if (navLang.startsWith('ru')) return 'ru';
      if (navLang.startsWith('vi')) return 'vi';
      if (navLang.startsWith('es')) return 'es';
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

  function hasOwn(obj, key) {
    if (!obj || key === undefined || key === null || key === '') return false;
    return Object.hasOwn ? Object.hasOwn(obj, key) : Object.prototype.hasOwnProperty.call(obj, key);
  }

  const DIG_SKIP_RULE_DEFAULTS = Object.freeze({
    followingArtists: true,
    hatedArtists: true,
    laterArtists: true,
    likedTracks: true,
    noplayTracks: true
  });

  function normalizeDigSkipRules(raw) {
    const value = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    Object.keys(DIG_SKIP_RULE_DEFAULTS).forEach(function (key) {
      out[key] = value[key] === undefined ? DIG_SKIP_RULE_DEFAULTS[key] : value[key] === true;
    });
    return out;
  }

  // 曲の除外判定の詳細。当たった理由とキーを返す。
  function getSkipReasonDetails(info, ctx) {
    if (!ctx || !ctx.discoveryEnabled || ctx.playbackMode !== 'DISCOVERY' || !info) return null;
    const id = toNumId(info.id);
    const artistId = toNumId(info.artistId);
    // 後で聴く作者のページでは、その作者を意図的に聴いているので Dig の除外を解除する
    if (ctx.onArtistPage && artistId && hasOwn(ctx.laterArtists, artistId)) return null;

    const title = (info.title || '').trim();
    const artist = (info.artistName || '').trim();
    const genre = (info.genre || '').trim().toLowerCase();
    const dTracks = ctx.dislikedTracks || {};
    const dArtists = ctx.dislikedArtists || {};
    const dGenres = ctx.dislikedGenres || {};
    const rules = normalizeDigSkipRules(ctx.digSkipRules);

    // 1. 曲自体の除外判定
    if (rules.noplayTracks && id && hasOwn(dTracks, id)) {
      return { reason: 'skipReasonDisliked', key: String(id) };
    }
    if (rules.noplayTracks && title) {
      const tKey = 'title_' + encodeURIComponent(title);
      const hitKey = hasOwn(dTracks, tKey) ? tKey : (hasOwn(dTracks, title) ? title : null);
      if (hitKey) {
        const rec = dTracks[hitKey];
        const recId = toNumId(rec && typeof rec === 'object' ? (rec.trackId || rec.id) : null);
        // 記録側にIDがない（古い記録など）場合、またはIDが一致する場合のみ除外
        if (!recId || !id || recId === id) {
          return { reason: 'skipReasonDisliked', key: hitKey };
        }
      }
    }

    // 2. 作者の除外判定
    if (rules.hatedArtists && artistId && hasOwn(dArtists, artistId)) {
      return { reason: 'skipReasonHated', key: String(artistId) };
    }
    if (rules.hatedArtists && artist) {
      const aKey = 'artist_' + encodeURIComponent(artist);
      const hitKey = hasOwn(dArtists, aKey) ? aKey : (hasOwn(dArtists, artist) ? artist : null);
      if (hitKey) {
        const rec = dArtists[hitKey];
        const recId = toNumId(rec && typeof rec === 'object' ? (rec.artistId || rec.id) : null);
        // 記録側にIDがない（古い記録など）場合、またはIDが一致する場合のみ除外（IDが異なれば同姓同名の別人として除外しない）
        if (!recId || !artistId || recId === artistId) {
          return { reason: 'skipReasonHated', key: hitKey };
        }
      }
    }

    // 3. ジャンルの除外判定
    if (genre && hasOwn(dGenres, genre)) {
      return { reason: 'skipReasonGenre', key: genre };
    }

    // 4. 自分の曲
    if (artistId && ctx.myUserId && artistId === toNumId(ctx.myUserId)) {
      return { reason: 'skipReasonOwn', key: String(artistId) };
    }

    // 後で聴く作者は Dig 中には流さない。実際に聴くときは Dig を OFF にする。
    if (rules.laterArtists && artistId && hasOwn(ctx.laterArtists, artistId)) {
      return { reason: 'skipReasonLater', key: String(artistId) };
    }

    // 5. 自分で Likes ページ等を開いて再生している時 / 作者のページから再生している時は除外しない
    const keepKnown = !!(ctx.inLibrary || ctx.onArtistPage);
    if (!keepKnown && ctx.heardSkipEnabled && id && ctx.heardTrackIds && ctx.heardTrackIds.has(id)) {
      return { reason: 'skipReasonHeard', key: String(id) };
    }
    if (rules.likedTracks && !keepKnown && id && ctx.likedTrackIds && ctx.likedTrackIds.has(id)) {
      return { reason: 'skipReasonLiked', key: String(id) };
    }
    if (rules.followingArtists && !ctx.onArtistPage && artistId && ctx.followingUserIds && ctx.followingUserIds.has(artistId)) {
      return { reason: 'skipReasonFollowing', key: String(artistId) };
    }

    return null;
  }

  // 曲の除外判定。理由は言語に依存しないキーで返す（表示時に i18n で訳す）。
  function getSkipReasonKey(info, ctx) {
    const details = getSkipReasonDetails(info, ctx);
    return details ? details.reason : null;
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
    getSkipReasonDetails: getSkipReasonDetails,
    normalizeDigSkipRules: normalizeDigSkipRules,
    getFreshSkipReasonKey: getFreshSkipReasonKey,
    normalizeFreshFilter: normalizeFreshFilter,
    pruneAuthorStats: pruneAuthorStats,
    isArtistPagePath: isArtistPagePath
  };
});

(function (root, factory) {
    'use strict';
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.FreshDigLists = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const FORMAT = 'FreshDigLists';
    const SCHEMA = 1;
    const MAX_JSON_BYTES = 5 * 1024 * 1024;
    const MAX_LATER_ARTISTS = 500;
    const MAX_MAP_ENTRIES = 10000;
    const MAX_ARRAY_ITEMS = 10000;
    const MAX_STRING_LENGTH = 4096;
    const MAX_KEY_LENGTH = 512;
    const MAX_OBJECT_PROPERTIES = 64;
    const MAX_DEPTH = 8;
    const LIST_KEYS = ['laterArtists', 'dislikedTracks', 'dislikedArtists', 'dislikedGenres'];
    const LIST_KEY_SET = new Set(LIST_KEYS);
    const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
    const RESERVED_MAP_KEYS = new Set(['undefined', 'null', 'unknown', 'title_unknown', 'artist_unknown']);

    function hasOwn(value, key) {
        return Object.prototype.hasOwnProperty.call(value, key);
    }

    function isPlainObject(value) {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
        const proto = Object.getPrototypeOf(value);
        return proto === Object.prototype || proto === null;
    }

    function invalid(message) {
        throw new Error('Invalid FreshDigLists backup: ' + message);
    }

    function assertSafeProperty(key) {
        if (DANGEROUS_KEYS.has(key)) invalid('unsafe property name "' + key + '"');

        // List data must never be a way to carry credentials or API material.
        const compact = String(key).replace(/[\s_-]/g, '').toLowerCase();
        if (compact.indexOf('token') !== -1 || compact.indexOf('secret') !== -1 ||
            compact.indexOf('password') !== -1 || compact.indexOf('credential') !== -1 ||
            compact === 'authorization' || compact === 'cookie' ||
            compact === 'clientid' || compact === 'apikey') {
            invalid('credential-like property "' + key + '"');
        }
    }

    function assertFiniteNumber(value, path) {
        if (typeof value !== 'number' || !Number.isFinite(value) ||
            Math.abs(value) > Number.MAX_SAFE_INTEGER) {
            invalid(path + ' must be a finite number');
        }
    }

    function cloneValue(value, path, depth, stack) {
        if (depth > MAX_DEPTH) invalid(path + ' is too deeply nested');
        if (value === null || typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            if (value.length > MAX_STRING_LENGTH) invalid(path + ' is too long');
            return value;
        }
        if (typeof value === 'number') {
            assertFiniteNumber(value, path);
            return value;
        }
        if (typeof value !== 'object') invalid(path + ' has an unsupported value');

        if (stack.has(value)) invalid(path + ' contains a circular reference');
        stack.add(value);

        let result;
        if (Array.isArray(value)) {
            if (value.length > MAX_ARRAY_ITEMS) invalid(path + ' has too many items');
            const ownKeys = Object.keys(value);
            if (ownKeys.length !== value.length) invalid(path + ' must be a dense array');
            result = [];
            for (let i = 0; i < value.length; i += 1) {
                result.push(cloneValue(value[i], path + '[' + i + ']', depth + 1, stack));
            }
        } else {
            if (!isPlainObject(value)) invalid(path + ' must be a plain object');
            const keys = Object.keys(value);
            if (keys.length > MAX_OBJECT_PROPERTIES) invalid(path + ' has too many properties');
            result = {};
            keys.forEach(function (key) {
                assertSafeProperty(key);
                result[key] = cloneValue(value[key], path + '.' + key, depth + 1, stack);
            });
        }
        stack.delete(value);
        return result;
    }

    function validateMapKey(key, path) {
        if (typeof key !== 'string') invalid(path + ' must be a string');
        if (!key.trim() || key.length > MAX_KEY_LENGTH) invalid(path + ' is empty or too long');
        const trimmed = key.trim();
        // Map keys are opaque SoundCloud IDs/title_/artist_ keys.  Credential
        // checks belong to record property names; a song or genre may itself
        // legitimately contain words such as "Token", "Secret", or "Unknown".
        if (DANGEROUS_KEYS.has(key) || RESERVED_MAP_KEYS.has(trimmed.toLowerCase()) ||
            trimmed === 'title_' || trimmed === 'artist_' || trimmed === '0' || trimmed === 'NaN') {
            invalid(path + ' is not a valid list key');
        }
    }

    function validateArtistId(value, path) {
        if (typeof value === 'number') {
            if (!Number.isFinite(value) || value <= 0 || value > Number.MAX_SAFE_INTEGER) {
                invalid(path + ' must be a positive id');
            }
            return;
        }
        if (typeof value !== 'string' || !value.trim() || value.length > MAX_KEY_LENGTH) {
            invalid(path + ' must be a non-empty id');
        }
        const lower = value.trim().toLowerCase();
        if (lower === 'undefined' || lower === 'null') invalid(path + ' must be a real id');
    }

    function cloneMap(value, name) {
        if (!isPlainObject(value)) invalid('lists.' + name + ' must be an object');
        const keys = Object.keys(value);
        if (keys.length > MAX_MAP_ENTRIES) invalid('lists.' + name + ' has too many entries');
        const result = {};
        keys.forEach(function (key) {
            validateMapKey(key, 'lists.' + name + '[' + key + ']');
            result[key] = cloneValue(value[key], 'lists.' + name + '[' + key + ']', 0, new Set());
        });
        return result;
    }

    function cloneLaterArtists(value) {
        if (!Array.isArray(value)) invalid('lists.laterArtists must be an array');
        if (value.length > MAX_LATER_ARTISTS) invalid('lists.laterArtists exceeds the 500 item limit');
        const result = [];
        const ids = new Set();
        value.forEach(function (item, index) {
            if (!isPlainObject(item)) invalid('lists.laterArtists[' + index + '] must be an object');
            if (!hasOwn(item, 'artistId')) invalid('lists.laterArtists[' + index + '] is missing artistId');
            validateArtistId(item.artistId, 'lists.laterArtists[' + index + '].artistId');
            const id = String(item.artistId);
            if (ids.has(id)) invalid('lists.laterArtists contains duplicate artistId ' + id);
            ids.add(id);
            result.push(cloneValue(item, 'lists.laterArtists[' + index + ']', 0, new Set()));
        });
        return result;
    }

    function normalizeLists(value, path) {
        const prefix = path || 'lists';
        if (!isPlainObject(value)) invalid(prefix + ' must be an object');
        Object.keys(value).forEach(function (key) {
            if (!LIST_KEY_SET.has(key)) invalid(prefix + ' has an unrecognized property "' + key + '"');
        });
        LIST_KEYS.forEach(function (key) {
            if (!hasOwn(value, key)) invalid(prefix + ' is missing ' + key);
        });
        return {
            laterArtists: cloneLaterArtists(value.laterArtists),
            dislikedTracks: cloneMap(value.dislikedTracks, 'dislikedTracks'),
            dislikedArtists: cloneMap(value.dislikedArtists, 'dislikedArtists'),
            dislikedGenres: cloneMap(value.dislikedGenres, 'dislikedGenres')
        };
    }

    function utf8ByteLength(value) {
        if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
        if (typeof Buffer !== 'undefined' && Buffer.byteLength) return Buffer.byteLength(value, 'utf8');
        return unescape(encodeURIComponent(value)).length;
    }

    function assertEnvelopeSize(envelope) {
        let text;
        try {
            text = JSON.stringify(envelope);
        } catch (e) {
            invalid('cannot be serialized');
        }
        if (utf8ByteLength(text) > MAX_JSON_BYTES) invalid('file exceeds the 5 MiB limit');
    }

    function normalize(envelope) {
        if (!isPlainObject(envelope)) invalid('root must be an object');
        Object.keys(envelope).forEach(function (key) {
            if (key !== 'format' && key !== 'schema' && key !== 'exportedAt' && key !== 'lists') {
                invalid('unrecognized root property "' + key + '"');
            }
            assertSafeProperty(key);
        });
        if (envelope.format !== FORMAT) invalid('format is not FreshDigLists');
        if (envelope.schema !== SCHEMA) invalid('unsupported schema version');
        if (typeof envelope.exportedAt !== 'string' || !envelope.exportedAt.trim() ||
            !Number.isFinite(Date.parse(envelope.exportedAt))) {
            invalid('exportedAt must be a valid date');
        }
        if (!hasOwn(envelope, 'lists')) invalid('lists is missing');
        const normalized = {
            format: FORMAT,
            schema: SCHEMA,
            exportedAt: envelope.exportedAt,
            lists: normalizeLists(envelope.lists, 'lists')
        };
        assertEnvelopeSize(normalized);
        return normalized;
    }

    function create(lists) {
        const normalizedLists = normalizeLists(lists, 'lists');
        const envelope = {
            format: FORMAT,
            schema: SCHEMA,
            exportedAt: new Date().toISOString(),
            lists: normalizedLists
        };
        assertEnvelopeSize(envelope);
        return envelope;
    }

    function merge(currentLists, incomingLists) {
        const current = normalizeLists(currentLists, 'current lists');
        const incoming = normalizeLists(incomingLists, 'incoming lists');
        const merged = {
            laterArtists: current.laterArtists.slice(),
            dislikedTracks: Object.assign({}, current.dislikedTracks),
            dislikedArtists: Object.assign({}, current.dislikedArtists),
            dislikedGenres: Object.assign({}, current.dislikedGenres)
        };

        const existingLaterIds = new Set(merged.laterArtists.map(function (item) { return String(item.artistId); }));
        incoming.laterArtists.forEach(function (item) {
            const id = String(item.artistId);
            if (!existingLaterIds.has(id)) {
                if (merged.laterArtists.length >= MAX_LATER_ARTISTS) {
                    invalid('merged lists would exceed the 500 later artist limit');
                }
                existingLaterIds.add(id);
                merged.laterArtists.push(item);
            }
        });

        ['dislikedTracks', 'dislikedArtists', 'dislikedGenres'].forEach(function (name) {
            Object.keys(incoming[name]).forEach(function (key) {
                if (!hasOwn(merged[name], key)) merged[name][key] = incoming[name][key];
            });
        });

        // Keep a final finite bound check in case the constants are changed later.
        normalizeLists(merged, 'merged lists');
        return merged;
    }

    function counts(lists) {
        const normalized = normalizeLists(lists, 'lists');
        return {
            laterArtists: normalized.laterArtists.length,
            dislikedTracks: Object.keys(normalized.dislikedTracks).length,
            dislikedArtists: Object.keys(normalized.dislikedArtists).length,
            dislikedGenres: Object.keys(normalized.dislikedGenres).length
        };
    }

    function markdownEscape(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/[\\`*_[\]()<>&#|]/g, '\\$&')
            .replace(/\b(javascript|data|vbscript):/gi, '$1\\:')
            .replace(/[\r\n]+/g, ' ')
            .trim();
    }

    function safeSoundCloudUrl(permalink) {
        if (permalink === undefined || permalink === null) return '';
        const raw = String(permalink).trim();
        if (!raw || raw.length > MAX_KEY_LENGTH || /[\s?#]/.test(raw)) return '';
        if (/^https?:\/\//i.test(raw)) {
            try {
                const parsed = new URL(raw);
                if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'soundcloud.com') return '';
                const path = parsed.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
                if (path.length !== 1) return '';
                return 'https://soundcloud.com/' + encodeURIComponent(path[0]);
            } catch (e) {
                return '';
            }
        }
        if (raw.indexOf('/') !== -1 || raw.indexOf('\\') !== -1 || raw.indexOf(':') !== -1) return '';
        return 'https://soundcloud.com/' + encodeURIComponent(raw);
    }

    function recordLabel(key, record) {
        if (record && typeof record === 'object' && !Array.isArray(record)) {
            return record.name || record.title || record.artist || record.genre || key;
        }
        return key;
    }

    function recordDate(record) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) return '';
        if (record.date !== undefined && record.date !== null) return String(record.date);
        if (record.addedAt !== undefined && record.addedAt !== null) return String(record.addedAt);
        return '';
    }

    function mapMarkdown(title, map) {
        const lines = ['## ' + title + ' (' + Object.keys(map).length + ')'];
        const keys = Object.keys(map).sort();
        if (!keys.length) {
            lines.push('_None_');
            return lines;
        }
        keys.forEach(function (key) {
            const record = map[key];
            const label = markdownEscape(recordLabel(key, record));
            const url = record && typeof record === 'object' && !Array.isArray(record)
                ? safeSoundCloudUrl(record.permalink) : '';
            const linked = url ? '[' + label + '](' + url + ')' : label;
            const date = recordDate(record);
            const details = date ? ' — ' + markdownEscape(date) : '';
            lines.push('- ' + linked + ' (`' + markdownEscape(key) + '`)' + details);
        });
        return lines;
    }

    function toMarkdown(envelope) {
        const normalized = normalize(envelope);
        const lists = normalized.lists;
        const lines = [
            '# FreshDig lists backup',
            '',
            '- Format: `' + FORMAT + '`',
            '- Schema: `' + SCHEMA + '`',
            '- Exported: ' + markdownEscape(normalized.exportedAt),
            ''
        ];
        lines.push('## Later artists (' + lists.laterArtists.length + ')');
        if (!lists.laterArtists.length) {
            lines.push('_None_');
        } else {
            lists.laterArtists.forEach(function (item) {
                const label = markdownEscape(item.name || item.artistId);
                const url = safeSoundCloudUrl(item.permalink);
                const linked = url ? '[' + label + '](' + url + ')' : label;
                const date = item.addedAt === undefined || item.addedAt === null ? '' :
                    ' — ' + markdownEscape(item.addedAt);
                lines.push('- ' + linked + ' (`' + markdownEscape(item.artistId) + '`)' + date);
            });
        }
        lines.push('');
        lines.push.apply(lines, mapMarkdown('Disliked tracks', lists.dislikedTracks));
        lines.push('');
        lines.push.apply(lines, mapMarkdown('Disliked artists', lists.dislikedArtists));
        lines.push('');
        lines.push.apply(lines, mapMarkdown('Disliked genres', lists.dislikedGenres));
        lines.push('');
        return lines.join('\n');
    }

    return Object.freeze({
        FORMAT: FORMAT,
        SCHEMA: SCHEMA,
        MAX_JSON_BYTES: MAX_JSON_BYTES,
        MAX_LATER_ARTISTS: MAX_LATER_ARTISTS,
        create: create,
        normalize: normalize,
        merge: merge,
        counts: counts,
        toMarkdown: toMarkdown
    });
}));

// SoundCloud Fresh Station & Follower Stream
(function () {
    'use strict';

    console.log('[SC-FreshStation] Hook loaded in MAIN world (FreshDig v2.12.0)');
    const RUNTIME_VERSION = '2.12.0';

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
    const HEARD_SKIP_ENABLED_KEY = 'sc_fresh_station_heard_skip_enabled';
    const DIG_SKIP_RULES_KEY = 'sc_fresh_station_dig_skip_rules';
    const HEARD_TRACKS_FALLBACK_KEY = 'sc_fresh_station_heard_tracks_v1';
    const HEARD_THRESHOLD_SEC = 10;
    const PLAYBACK_RELOAD_GUARD_KEY = 'sc_fresh_station_playback_reload_guard_v1';
    const MINI_PLAYER_RESTORE_KEY = 'sc_fresh_station_miniplayer_restore_v1';

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
            barStationTitle: '📡 この曲のステーションを開始',
            barDislikeTitle: '⏭️ 不再生：この曲を今後は流さず、すぐ次へ（嫌いではなく「もう十分聴いた」曲に）',
            barHateTitle: '🤬 作者除外 (この作者の曲すべてを今後再生せずスキップ)',
            barMiniPlayerTitle: '📻 ミニプレイヤー (最前面ウィンドウで浮遊操作)',
            barDiscoveryOffTitle: '⛏️ 発掘モード OFF（クリックで ON：知っている曲を自動スキップ）',
            barDiscoveryOnTitle: '⛏️ 発掘モード ON（クリックで OFF：SoundCloud 通常再生）',
            barFollowingModeTitle: '👥 フォロー新曲モード (クリックで「発掘モード」へ切替)',
            mpTitle: 'FreshDig - アーティスト発掘ミニプレイヤー',
            mpPromptOpen: '📻 ここをクリックしてミニプレイヤーを開く',
            mpLoadingTrack: '曲を読み込み中...',
            mpStatusWaiting: '再生待機中',
            mpStatusDigging: '発掘中',
            mpFollowBtn: '👤 フォロー',
            mpFollowBtnTitle: 'アーティストをフォロー',
            mpStationBtn: '📡 ステーション',
            mpStationBtnTitle: 'この曲のステーションを開始',
            mpPrevTitle: '前の曲',
            mpPlayTitle: '再生 / 一時停止',
            mpNextTitle: '次の曲',
            mpLikeTitle: 'いいね (Like)',
            mpRepostTitle: 'リポスト (Repost)',
            mpAddPlTitle: 'プレイリストに追加',
            mpDislikeTitle: '⏭️ 不再生：この曲を今後は流さず、すぐ次へ（嫌いではなく「もう十分聴いた」曲に）',
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

    function readHeardSkipEnabled() {
        try { return localStorage.getItem(HEARD_SKIP_ENABLED_KEY) === 'true'; } catch (e) { return false; }
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
        heardTrackIds: new Set(),
        isUserDataLoaded: false,
        playbackMode: normalizePlaybackMode(localStorage.getItem(PLAYBACK_MODE_KEY)), // 'DISCOVERY'（'FOLLOWING_NEW' は現在無効）
        discoveryEnabled: readDiscoveryEnabled(), // 発掘モード（自動スキップ・ステーション絞り込み）の ON/OFF
        heardSkipEnabled: readHeardSkipEnabled(),
        digSkipRules: FreshDigCore.normalizeDigSkipRules(null),
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
            state.heardSkipEnabled = readHeardSkipEnabled();
            try { state.digSkipRules = FreshDigCore.normalizeDigSkipRules(JSON.parse(localStorage.getItem(DIG_SKIP_RULES_KEY) || 'null')); } catch (e) { state.digSkipRules = FreshDigCore.normalizeDigSkipRules(null); }
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
            Object.keys(state.dislikedGenres).forEach(function (k) {
                if (!k || invalidKeys.includes(k.toLowerCase().trim())) {
                    delete state.dislikedGenres[k];
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

    function currentExclusionsForBackup() {
        // Another tab may have persisted a change before its BroadcastChannel
        // notification reaches this tab. Read storage again for backup/import.
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { dislikedTracks: state.dislikedTracks, dislikedArtists: state.dislikedArtists, dislikedGenres: state.dislikedGenres };
        const saved = JSON.parse(raw);
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid exclusion storage');
        return { dislikedTracks: saved.dislikedTracks || {}, dislikedArtists: saved.dislikedArtists || {}, dislikedGenres: saved.dislikedGenres || {} };
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

    function getDiagLogEntries() {
        flushDiagLog();
        let list = [];
        try { list = JSON.parse(localStorage.getItem(DIAG_LOG_KEY) || '[]'); } catch (e) {}
        return list.map(function (x) {
            return { t: x.t, tab: x.tab, type: x.type, detail: x.d === undefined ? '' : x.d };
        });
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
    let apiRequestTail = Promise.resolve();
    const robotRecovery = { inFlight: false, lastProbeAt: 0, minIntervalMs: 30000, armed: false };

    function sleepMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    // SoundCloud can have several FreshDig requests waiting on the limiter at once.
    // Serializing the gate means a challenge discovered while one request is waiting
    // is observed before the next request is sent.
    function enqueueApiRequest(task) {
        const run = apiRequestTail.then(task, task);
        apiRequestTail = run.catch(function () {});
        return run;
    }

    function isRobotBlocked() { return robotState.iframe || robotState.api; }

    function refreshRobotState(source) {
        const was = !!state.robotBlocked;
        const now = isRobotBlocked();
        if (source === 'api-ok' || source === 'sc-fetch-ok' || source === 'sc-xhr-ok') robotRecovery.armed = false;
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
        init = init || {};
        const recoveryProbe = !!init.__freshDigRecoveryProbe;
        if (robotState.iframe || apiBackoff.isBlocked(Date.now()) || (robotState.api && !recoveryProbe)) return blockedApiResponse();
        return enqueueApiRequest(async function () {
            // The limiter wait is part of the guarded section. A challenge may have
            // appeared while this request was queued, so check again before sending.
            if (robotState.iframe || apiBackoff.isBlocked(Date.now()) || (robotState.api && !recoveryProbe)) return blockedApiResponse();
            const wait = apiLimiter.reserve(Date.now());
            if (wait > 0) await sleepMs(wait);
            if (robotState.iframe || apiBackoff.isBlocked(Date.now()) || (robotState.api && !recoveryProbe)) return blockedApiResponse();
            const requestInit = recoveryProbe ? Object.assign({}, init) : init;
            if (recoveryProbe) delete requestInit.__freshDigRecoveryProbe;
            const res = await originalFetch(url, requestInit);
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
        });
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
            } else if (xhr.status >= 200 && xhr.status < 300 && robotState.api) {
                robotState.api = false;
                apiBackoff.ok();
                refreshRobotState('sc-xhr-ok');
            }
        } catch (e) {}
    }

    // Inspect page fetch responses through a clone so SoundCloud keeps the original
    // response body. Only the specific DataDome/robot markers are considered.
    function observeScFetchResponse(url, response) {
        if (!response || String(url || '').indexOf('api-v2.soundcloud.com') === -1) return;
        if (response.status >= 200 && response.status < 300 && robotState.api) {
            robotState.api = false;
            apiBackoff.ok();
            refreshRobotState('sc-fetch-ok');
            return;
        }
        if (response.status !== 403) return;
        let headerHit = false;
        try {
            headerHit = FreshDigCore.isRobotCheckResponse(403, function (n) { return response.headers && response.headers.get ? response.headers.get(n) : ''; }, '');
        } catch (e) {}
        const mark = function (body) {
            let isRobot = headerHit;
            if (!isRobot) {
                try {
                    isRobot = FreshDigCore.isRobotCheckResponse(403, function (n) { return response.headers && response.headers.get ? response.headers.get(n) : ''; }, body);
                } catch (e) {}
            }
            if (!isRobot || robotState.api) return;
            dlog('sc-fetch-robot-check', { path: apiPathForLog(url) });
            robotState.api = true;
            apiBackoff.fail(Date.now());
            refreshRobotState('sc-fetch');
        };
        if (headerHit) {
            mark('');
            return;
        }
        try {
            const clone = response.clone();
            if (clone && typeof clone.text === 'function') {
                clone.text().then(function (body) { mark(String(body || '').slice(0, 200000)); }).catch(function () {});
            }
        } catch (e) {}
    }

    function probeRobotRecovery() {
        const now = Date.now();
        if (!robotState.api || !robotRecovery.armed || robotState.iframe || apiBackoff.isBlocked(now) || document.hidden) return;
        if (robotRecovery.inFlight || now - robotRecovery.lastProbeAt < robotRecovery.minIntervalMs) return;
        robotRecovery.inFlight = true;
        robotRecovery.lastProbeAt = now;
        robotRecovery.armed = false;
        scApi('me', { __freshDigRecoveryProbe: true }).catch(function () {}).then(function () {
            robotRecovery.inFlight = false;
        }, function () {
            robotRecovery.inFlight = false;
        });
    }

    // 3 秒ごとに、ロボット確認の画面（iframe）があるか見る。手動で確認画面が
    // 消えた後だけ、backoff が終わった可視タブから最大でも 1 回 / 30 秒だけ確認する。
    setInterval(function () {
        try {
            const found = !!document.querySelector('iframe[src*="captcha-delivery.com"]');
            if (found !== robotState.iframe) {
                const hadIframe = robotState.iframe;
                robotState.iframe = found;
                if (hadIframe && !found) robotRecovery.armed = true;
                refreshRobotState('iframe');
            }
            probeRobotRecovery();
        } catch (e) {}
    }, 3000);

    const playbackIntent = {
        wanted: false,
        trackKey: '',
        recoveries: 0,
        lastRecoveryAt: 0,
        recoveryInFlight: false,
        suppressPauseUntil: 0,
        pageReloadInFlight: false
    };

    function notePausedMedia(media) {
        if (media.ended) return;
        const pending = skipPacing.pendingPause;
        if (pending && pending.expectedPause && pending.media === media) pending.expectedPause = false;
        else playbackIntent.pauseRevision = (playbackIntent.pauseRevision || 0) + 1;
        playbackIntent.wanted = false;
    }

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
                if (evName === 'play') {
                    playbackIntent.wanted = true;
                } else if (evName === 'pause') {
                    // A natural end may leave the media element paused and ended before
                    // the ended event reaches us. Keep the intent in that case so the
                    // bounded next-track recovery can run; a ready non-ended pause is
                    // the explicit user pause signal.
                    if (!m.ended) {
                        notePausedMedia(m);
                    }
                } else if (evName === 'stalled' || evName === 'waiting' || evName === 'error' || evName === 'ended') {
                    schedulePlaybackRecovery(m, evName);
                }
            } catch (e) {}
        }, true);
    });
    document.addEventListener('play', function (ev) {
        const m = ev.target;
        if (!m || (m.tagName !== 'AUDIO' && m.tagName !== 'VIDEO')) return;
        playbackIntent.wanted = true;
        const key = playbackTrackKey();
        if (key && key !== playbackIntent.trackKey) {
            playbackIntent.trackKey = key;
            playbackIntent.recoveries = 0;
            playbackIntent.lastRecoveryAt = 0;
        }
    }, true);
    // The page's own play button can become visually active while the media
    // clock remains frozen after a long-idle tab. Probe native clicks too, so
    // recovery also works when the user starts playback outside the mini player.
    document.addEventListener('click', function (ev) {
        let button = null;
        try { button = ev.target && ev.target.closest ? ev.target.closest('.playControls__play') : null; } catch (e) {}
        if (!button || button.classList.contains('playing') || playbackIntent.recoveryInFlight) return;
        playbackIntent.wanted = true;
        const media = getActiveMedia(true);
        const initialPosition = readPlaybackPosition(media);
        setTimeout(async function () {
            if (!playbackIntent.wanted || playbackIntent.recoveryInFlight) return;
            const result = await verifyAndRecoverExplicitPlay(getActiveMedia(true) || media, initialPosition);
            if (!result.success && !result.reloading) playbackIntent.wanted = false;
        }, 180);
    }, true);
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
            if (options.__freshDigRecoveryProbe) init.__freshDigRecoveryProbe = true;
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
            if (d && typeof d.heardSkipEnabled === 'boolean' && d.heardSkipEnabled !== state.heardSkipEnabled) {
                state.heardSkipEnabled = d.heardSkipEnabled;
                try { localStorage.setItem(HEARD_SKIP_ENABLED_KEY, String(state.heardSkipEnabled)); } catch (e) {}
                marginGuard.hasChecked = false;
            }
            if (d && d.digSkipRules) {
                state.digSkipRules = FreshDigCore.normalizeDigSkipRules(d.digSkipRules);
                try { localStorage.setItem(DIG_SKIP_RULES_KEY, JSON.stringify(state.digSkipRules)); } catch (e) {}
                marginGuard.hasChecked = false;
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
                } else if (action === 'GET_LISTS') {
                    ack({ success: true, lists: currentExclusionsForBackup() });
                } else if (action === 'IMPORT_EXCLUSIONS') {
                    const incoming = FreshDigLists.normalize({ format: 'FreshDigLists', schema: 1, exportedAt: new Date().toISOString(), lists: event.data.lists }).lists;
                    const merged = FreshDigLists.merge(Object.assign({ laterArtists: [] }, currentExclusionsForBackup()), incoming);
                    // Persist before changing live state, so a quota/write failure cannot
                    // leave an apparent successful import that disappears on reload.
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dislikedTracks: merged.dislikedTracks,
                        dislikedArtists: merged.dislikedArtists, dislikedGenres: merged.dislikedGenres, updatedAt: Date.now() }));
                    state.dislikedTracks = merged.dislikedTracks;
                    state.dislikedArtists = merged.dislikedArtists;
                    state.dislikedGenres = merged.dislikedGenres;
                    fdBus.post('dislike-changed');
                    try { updateHateButtons(); scheduleQueuePrune(); } catch (e) {}
                    ack({ success: true });
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
                } else if (action === 'SET_HEARD_SKIP_ENABLED') {
                    state.heardSkipEnabled = event.data.enabled === true;
                    try { localStorage.setItem(HEARD_SKIP_ENABLED_KEY, String(state.heardSkipEnabled)); } catch (e) {}
                    marginGuard.hasChecked = false;
                    soundChangeState.decidedPath = '';
                    ack({ success: true, heardSkipEnabled: state.heardSkipEnabled });
                } else if (action === 'SET_DIG_SKIP_RULES') {
                    state.digSkipRules = FreshDigCore.normalizeDigSkipRules(event.data.rules);
                    try { localStorage.setItem(DIG_SKIP_RULES_KEY, JSON.stringify(state.digSkipRules)); } catch (e) {}
                    marginGuard.hasChecked = false;
                    soundChangeState.decidedPath = '';
                    try { scheduleQueuePrune(); } catch (e) {}
                    ack({ success: true, digSkipRules: state.digSkipRules });
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
                    const applied = typeof event.data.volume === 'number' ? setSoundCloudVolume(event.data.volume) : null;
                    ack({ success: applied !== null, volume: getSoundCloudVolume() });
                } else if (action === 'TOGGLE_MUTE') {
                    ack(Object.assign({}, toggleSoundCloudMute(), { volume: getSoundCloudVolume() }));
                } else if (action === 'GET_DIAG_LOG') {
                    ack({ success: true, runtimeVersion: RUNTIME_VERSION, playback: getPlaybackDiagnostic(), text: getDiagLogText(), entries: getDiagLogEntries(), stats: getStats() });
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
                        heardSkipEnabled: state.heardSkipEnabled,
                        digSkipRules: state.digSkipRules,
                        autoMiniPlayer: state.autoMiniPlayer,
                        autoPipSupported: getAutoPipDiagnostics().autoPipSupported,
                        autoPipStatus: getAutoPipDiagnostics().autoPipStatus,
                        autoPipLastError: getAutoPipDiagnostics().autoPipLastError,
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
            observeScFetchResponse(url, response);
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
            observeScFetchResponse(url, response);
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
            observeScFetchResponse(url, response);

            const hasLaterArtists = Object.keys(laterState.map).length > 0;
            if ((!state.isUserDataLoaded && !hasLaterArtists) || !state.discoveryEnabled) {
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
                    while (state.isUserDataLoaded && data.collection.length < 10 && nextHref && extraPages < MAX_STATION_EXTRA_PAGES) {
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

        const response = await originalFetch.apply(this, args);
        observeScFetchResponse(url, response);
        return response;
    };

    function filterStationTracks(tracks) {
        return tracks.filter(function (track) {
            if (!track) return false;

            const trackId = track.id;
            const artistId = track.user ? track.user.id : track.user_id;
            const genre = (track.genre || '').trim().toLowerCase();

            // モードによる分岐
            if (state.playbackMode === 'FOLLOWING_NEW') {
                // Shared core rules intentionally apply Later only in DISCOVERY.
                if (state.dislikedTracks[trackId]) return false;
                if (artistId && state.dislikedArtists[artistId]) return false;
                if (genre && state.dislikedGenres[genre]) return false;
                if (state.myUserId && artistId === state.myUserId) return false;
                // フォロー中アーティストのみ通過
                if (!artistId || !state.followingUserIds.has(artistId)) {
                    return false;
                }
            } else {
                // Keep station filtering aligned with the immediate skip decision,
                // including Later artists and the intentional artist-page behavior.
                const info = {
                    id: trackId,
                    artistId: artistId,
                    title: track.title || '',
                    artistName: track.user ? (track.user.username || '') : '',
                    artistPermalink: track.user ? (track.user.permalink || '') : '',
                    genre: genre
                };
                if (getCoreSkipReason(info)) return false;
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
        try { observeHeardPlayback(); } catch (e) {}
        try {
            updateHateButtons();
        } catch (e) {}
        try {
            syncCurrentTrackInteractionsFromDom();
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

    // 既聴曲の正本。IndexedDBには曲IDと最小限の記録だけを保存し、判定用の直近IDだけをメモリに置く。
    let heardDbPromise = null;
    const heardPlayback = { key: '', lastTime: null, accumulated: 0, marked: false };
    function heardDb() {
        if (heardDbPromise) return heardDbPromise;
        if (typeof indexedDB === 'undefined' || !indexedDB.open) return Promise.resolve(null);
        heardDbPromise = new Promise(function (resolve) {
            try {
                const req = indexedDB.open('FreshDig', 1);
                req.onupgradeneeded = function () { try { req.result.createObjectStore('heardTracks', { keyPath: 'id' }); } catch (e) {} };
                req.onsuccess = function () { resolve(req.result); };
                req.onerror = function () { resolve(null); };
            } catch (e) { resolve(null); }
        });
        return heardDbPromise;
    }
    function heardFallbackRead() {
        try { const raw = JSON.parse(localStorage.getItem(HEARD_TRACKS_FALLBACK_KEY) || '{}'); return raw && typeof raw === 'object' ? raw : {}; } catch (e) { return {}; }
    }
    function heardFallbackWrite(id, rec) {
        try { const all = heardFallbackRead(); all[String(id)] = rec; localStorage.setItem(HEARD_TRACKS_FALLBACK_KEY, JSON.stringify(all)); } catch (e) {}
    }
    function heardLookup(id) {
        id = toNumId(id);
        if (!id) return Promise.resolve(false);
        if (state.heardTrackIds.has(id)) return Promise.resolve(true);
        return heardDb().then(function (db) {
            if (!db) return !!heardFallbackRead()[String(id)];
            return new Promise(function (resolve) {
                try {
                    const req = db.transaction('heardTracks', 'readonly').objectStore('heardTracks').get(id);
                    req.onsuccess = function () { resolve(!!req.result); };
                    req.onerror = function () { resolve(false); };
                } catch (e) { resolve(false); }
            });
        });
    }
    function rememberHeardTrack(info) {
        const id = toNumId(info && info.id);
        if (!id || state.heardTrackIds.has(id)) return;
        state.heardTrackIds.add(id);
        const rec = { id: id, heardAt: Date.now(), title: String((info && info.title) || '').slice(0, 200), artistId: toNumId(info && info.artistId) };
        heardDb().then(function (db) {
            if (!db) { heardFallbackWrite(id, rec); return; }
            try { db.transaction('heardTracks', 'readwrite').objectStore('heardTracks').put(rec); } catch (e) { heardFallbackWrite(id, rec); }
        });
        dlog('heard-track-recorded', { trackId: id, thresholdSec: HEARD_THRESHOLD_SEC });
    }
    function queueHeardLookup(info) {
        if (!state.heardSkipEnabled || !info || !toNumId(info.id)) return;
        const id = toNumId(info.id);
        heardLookup(id).then(function (known) {
            if (known) state.heardTrackIds.add(id);
            if (state.currentTrack && toNumId(state.currentTrack.id) === id) {
                marginGuard.hasChecked = false;
                soundChangeState.decidedPath = '';
            }
        });
    }
    function observeHeardPlayback() {
        if (!state.heardSkipEnabled || !state.currentTrack || !toNumId(state.currentTrack.id)) return;
        const key = String(toNumId(state.currentTrack.id));
        if (heardPlayback.key !== key) { heardPlayback.key = key; heardPlayback.lastTime = null; heardPlayback.accumulated = 0; heardPlayback.marked = false; }
        if (heardPlayback.marked || state.heardTrackIds.has(Number(key))) return;
        const media = getActiveMedia(true);
        const now = media && Number.isFinite(media.currentTime) ? Number(media.currentTime) : getPlaybackPositionMs() / 1000;
        const playing = media ? (!media.paused && !media.ended) : now > 0;
        if (!playing || !Number.isFinite(now) || now < 0) { heardPlayback.lastTime = now; return; }
        if (heardPlayback.lastTime !== null) {
            const delta = now - heardPlayback.lastTime;
            if (delta >= 0 && delta <= 3) heardPlayback.accumulated += delta;
        }
        heardPlayback.lastTime = now;
        if (heardPlayback.accumulated >= HEARD_THRESHOLD_SEC) { heardPlayback.marked = true; rememberHeardTrack(state.currentTrack); }
    }

    function getCoreSkipReason(info) {
        const details = FreshDigCore.getSkipReasonDetails(info, {
            discoveryEnabled: state.discoveryEnabled,
            playbackMode: state.playbackMode,
            dislikedTracks: state.dislikedTracks,
            dislikedArtists: state.dislikedArtists,
            dislikedGenres: state.dislikedGenres,
            myUserId: state.myUserId,
            laterArtists: laterState.map,
            likedTrackIds: state.likedTrackIds,
            followingUserIds: state.followingUserIds,
            heardSkipEnabled: state.heardSkipEnabled,
            heardTrackIds: state.heardTrackIds,
            digSkipRules: state.digSkipRules,
            inLibrary: isExplicitLibraryPage(),
            onArtistPage: isOnLaterArtistPage(info) || isOnFollowedArtistPage(info)
        });
        return details ? details.reason : null;
    }

    // info: { id, artistId, title, artistName, genre }。スキップすべきなら理由のキー（skipReason...）、しないなら null
    // 判定の中身は freshdig_core.js（Node でテスト済み）
    function getSkipReason(info) {
        if (state.robotBlocked) return null;
        const coreReason = getCoreSkipReason(info);
        if (coreReason) {
            if (info && typeof info === 'object') {
                const details = FreshDigCore.getSkipReasonDetails(info, {
                    discoveryEnabled: state.discoveryEnabled,
                    playbackMode: state.playbackMode,
                    dislikedTracks: state.dislikedTracks,
                    dislikedArtists: state.dislikedArtists,
                    dislikedGenres: state.dislikedGenres,
                    myUserId: state.myUserId,
                    laterArtists: laterState.map,
                    likedTrackIds: state.likedTrackIds,
                    followingUserIds: state.followingUserIds,
                    heardSkipEnabled: state.heardSkipEnabled,
                    heardTrackIds: state.heardTrackIds,
                    digSkipRules: state.digSkipRules,
                    inLibrary: isExplicitLibraryPage(),
                    onArtistPage: isOnLaterArtistPage(info) || isOnFollowedArtistPage(info)
                });
                info._matchedRuleKey = details && details.key;
            }
            return coreReason;
        }
        if (!state.discoveryEnabled || state.playbackMode !== 'DISCOVERY') return null;
        const fresh = getFreshReason(info);
        if (fresh && info && typeof info === 'object') {
            info._matchedRuleKey = 'fresh';
        }
        return fresh;
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
        if (isOnLaterArtistPage(info)) return null; // 保存した作者のページで、その作者を聴くときは発掘条件を一時停止
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
        const removedTracks = [];
        plan.remove.forEach(function (pos) {
            const item = qi.models[pos];
            const info = qi.infos[pos];
            try {
                pm.removeItem(item);
                removed++;
                if (info) {
                    removedTracks.push({
                        id: info.id,
                        title: info.title || '',
                        artist: info.artistName || '',
                        ruleKey: info._matchedRuleKey || ''
                    });
                }
            } catch (e) {}
        });
        if (removed) dlog('queue-prune', { removed: removed, source: source, tracks: removedTracks });
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
    const SKIP_MIN_GAP_MS = 750;
    const skipPacing = { nextAt: 0, pendingPause: null };
    function doAutoSkip(reason, info) {
        if (state.robotBlocked || shouldKeepTrackOnArtistPage(reason, info)) return false;
        const skipKey = String((info && info.id) || (info && info.href) || (info && info.title) || 'unknown');
        if (state.lastSkippedTrackKey === skipKey && Date.now() - marginGuard.lastSkipTime < 10000) return false;
        if (marginGuard.consecutiveSkips >= MAX_CONSECUTIVE_AUTO_SKIPS) {
            console.warn('[SC-FreshStation] ⚠️ 連続スキップが' + MAX_CONSECUTIVE_AUTO_SKIPS + '曲に達したため、この曲はそのまま再生します。');
            showGlobalToast(tt('m_streakStop'));
            dlog('skip-brake', MAX_CONSECUTIVE_AUTO_SKIPS);
            marginGuard.consecutiveSkips = 0;
            return false;
        }
        state.lastSkippedTrackKey = skipKey;
        marginGuard.lastSkipTime = Date.now();
        marginGuard.consecutiveSkips++;
        recordStat('totalSkips');
        const title = (info && info.title) || '';
        const reasonText = getI18nTexts()[reason] || reason;
        console.log('[SC-FreshStation] ⏩ Auto-skip [' + reason + ']: "' + title + '" (' + ((info && info.artistName) || '') + ')');
        showGlobalToast('⏩ ' + tt('skipToastPrefix') + ' (' + reasonText + ')' + (title ? ': ' + title : ''));
        dlog('auto-skip', {
            reason: reason,
            id: info && info.id,
            title: title,
            artist: (info && info.artistName) || '',
            artistId: info && info.artistId,
            ruleKey: (info && info._matchedRuleKey) || '',
            n: marginGuard.consecutiveSkips
        });

        const run = function () {
            if (!state.discoveryEnabled || shouldKeepTrackOnArtistPage(reason, info)) return false;
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

        const pacingDelay = Math.max(0, skipPacing.nextAt - Date.now());
        const slowdownDelay = marginGuard.consecutiveSkips > SKIP_SLOWDOWN_AFTER ? SKIP_SLOWDOWN_MS : 0;
        const delay = Math.max(pacingDelay, slowdownDelay);
        skipPacing.nextAt = Date.now() + delay + SKIP_MIN_GAP_MS;
        if (delay > 0) {
            const expectId = info && toNumId(info.id);
            const pause = { media: getActiveMedia(true), expectedPause: true, wanted: playbackIntent.wanted || isLocalPlaying(), revision: playbackIntent.pauseRevision || 0 };
            skipPacing.pendingPause = pause;
            playbackIntent.wanted = false;
            playbackIntent.suppressPauseUntil = Date.now() + 600;
            try { const pm0 = getScPlaybackManager(); if (pm0 && pm0.pauseCurrent) pm0.pauseCurrent(); } catch (e) {}
            setTimeout(function () {
                if (skipPacing.pendingPause !== pause) return;
                skipPacing.pendingPause = null;
                if (state.robotBlocked) return;
                // 待っている間にユーザーが別の曲へ動かしていたら何もしない
                const cur = getScCurrentSound();
                if (expectId && cur && toNumId(cur.id) !== expectId) return;
                if (!state.discoveryEnabled || shouldKeepTrackOnArtistPage(reason, info)) {
                    const sameTrack = expectId && state.currentTrack && toNumId(state.currentTrack.id) === expectId;
                    const unchangedIntent = pause.revision === (playbackIntent.pauseRevision || 0);
                    if (sameTrack && unchangedIntent && pause.wanted && pause.media && getActiveMedia(true) === pause.media) {
                        playbackIntent.wanted = true;
                        invokeMediaPlay(pause.media, 700, false).then(function (result) {
                            if (!result.success && !result.pending && pause.revision === (playbackIntent.pauseRevision || 0) && state.currentTrack && toNumId(state.currentTrack.id) === expectId) playbackIntent.wanted = false;
                        });
                    }
                    return;
                }
                run();
            }, delay);
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
        queueHeardLookup(info);

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
            artistPermalink: state.currentTrack && state.currentTrack.artistPermalink,
            title: title,
            artistName: artist,
            genre: (state.currentTrack && state.currentTrack.genre) || ''
        };
        queueHeardLookup(info);

        // 切替通知で判定済みの曲は、DOM の Like 表示（Likes 一覧の上限外やその場でのライク）だけ追加確認
        let reason = alreadyDecided ? null : getSkipReason(info);
        if (!reason && !isExplicitLibraryPage() && !isOnLaterArtistPage() && !isOnFollowedArtistPage() && likeBtn) {
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
    // 常に出すのは ⛏️ ⏭️ 📻 と「⋯」。追加先プレイリストなどは「⋯」へ。
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

    // SoundCloud may mount the playback controls only after the first track is
    // opened. Keep the onboarding target available during that gap, then move
    // the same button into the real bar once it exists (one ID, one listener).
    function ensureMiniPlayerLauncherFallback() {
        if (!document.body || document.getElementById('sc-fresh-station-miniplayer-btn')) return;
        const fallback = document.createElement('div');
        fallback.id = 'sc-fresh-station-miniplayer-fallback';
        fallback.style.cssText = 'position:fixed;right:14px;bottom:64px;z-index:2147483645;display:flex;align-items:center;';
        const mpBtn = document.createElement('button');
        mpBtn.id = 'sc-fresh-station-miniplayer-btn';
        mpBtn.type = 'button';
        mpBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
        mpBtn.title = getI18nTexts().barMiniPlayerTitle;
        mpBtn.style.cssText = 'width:32px;height:32px;min-width:32px;padding:0;display:inline-flex;justify-content:center;align-items:center;border-radius:5px;border:1px solid #ff5500;background:#ff5500;color:#fff;font-size:15px;cursor:pointer;line-height:1;box-shadow:0 2px 8px rgba(0,0,0,0.35);';
        mpBtn.innerHTML = '📻';
        mpBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            toggleMiniPlayer();
        });
        fallback.appendChild(mpBtn);
        document.body.appendChild(fallback);
    }

    function injectButtons() {
        const bar = ensureFreshBar();
        if (!bar) {
            ensureMiniPlayerLauncherFallback();
            return;
        }
        const menuGroup = document.getElementById('sc-fresh-station-menu');   // 「⋯」の中
        const moreBtn = document.getElementById('sc-fresh-station-more-btn');
        const addMain = function (el) { bar.insertBefore(el, moreBtn); };

        const fallback = document.getElementById('sc-fresh-station-miniplayer-fallback');
        const existingLauncher = document.getElementById('sc-fresh-station-miniplayer-btn');
        if (fallback && existingLauncher && existingLauncher.parentNode === fallback) {
            addMain(existingLauncher);
            existingLauncher.style.cssText = 'margin-left:5px;width:26px;height:26px;min-width:26px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid #ff5500;border-radius:4px;background:#ff5500;color:#fff;font-size:13px;cursor:pointer;line-height:1;';
            fallback.remove();
        }

        // 0. 発掘モード切替ボタン (アイコン: ⛏️ または 👥)
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

        // 1. ステーション開始ボタン (アイコン: 📡)
        if (!document.getElementById('sc-fresh-station-station-btn')) {
            const stBtn = document.createElement('button');
            stBtn.id = 'sc-fresh-station-station-btn';
            stBtn.type = 'button';
            stBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            stBtn.title = getI18nTexts().barStationTitle;
            stBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #00e676; background: transparent; color: #00e676; font-size: 13px; cursor: pointer; line-height: 1; vertical-align: middle; transition: all 0.15s ease;';
            stBtn.innerHTML = '📡';
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
            plBtn.style.cssText = 'margin-left: 5px; width: 26px; height: 26px; min-width: 26px; padding: 0; display: inline-flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid #ff5500; background: transparent; color: #ff5500; font-size: 13px; font-weight: bold; cursor: pointer; line-height: 1; vertical-align: middle;';
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

            menuGroup.appendChild(plBtn);
            updatePlaylistButtonUI();
        }

        // 5. ミニプレイヤー起動ボタン (アイコン1個: 📻)
        if (!document.getElementById('sc-fresh-station-miniplayer-btn')) {
            const mpBtn = document.createElement('button');
            mpBtn.id = 'sc-fresh-station-miniplayer-btn';
            mpBtn.type = 'button';
            mpBtn.className = 'sc-button sc-button-small sc-button-icon sc-button-responsive';
            mpBtn.title = getI18nTexts().barMiniPlayerTitle;
            mpBtn.style.cssText = 'margin-left:5px;width:26px;height:26px;min-width:26px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid #ff5500;border-radius:4px;background:#ff5500;color:#fff;font-size:13px;cursor:pointer;line-height:1;';
            mpBtn.innerHTML = '📻';
            mpBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                toggleMiniPlayer();
            });
            addMain(mpBtn);
        }
        // Keep one consistent order even when the radio launcher started as a
        // floating fallback before SoundCloud mounted the native player bar.
        let nextButton = moreBtn;
        ['sc-fresh-station-miniplayer-btn', 'sc-fresh-station-dislike-btn', 'sc-fresh-station-mode-btn'].forEach(function (id) {
            const button = document.getElementById(id);
            if (button) {
                if (button.parentNode !== bar || button.nextSibling !== nextButton) bar.insertBefore(button, nextButton);
                nextButton = button;
            }
        });
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
                set('mp-station', 'mpStationBtnTitle', null);
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
            btn.innerHTML = '⛏️';
            btn.style.borderColor = '#555';
            btn.style.color = '#777';
            btn.style.background = 'transparent';
            btn.style.opacity = '0.55';
            btn.title = tx.barDiscoveryOffTitle;
            return;
        }
        btn.style.opacity = '1';
        if (state.playbackMode === 'DISCOVERY') {
            btn.innerHTML = '⛏️';
            btn.style.borderColor = '#ff5500';
            btn.style.color = '#fff';
            btn.style.background = '#ff5500';
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
            btn.style.background = 'transparent';
            btn.style.color = inPl ? '#00c853' : '#ff5500';
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
                        artistPermalink: sound.user ? (sound.user.permalink || '') : '',
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
                            artistPermalink: rData.user ? (rData.user.permalink || '') : '',
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
            return JSON.parse(localStorage.getItem('sc_fresh_station_stats_v1')) || { totalSkips: 0, totalPlaylistAdds: 0, totalNoPlays: 0 };
        } catch (e) {
            return { totalSkips: 0, totalPlaylistAdds: 0, totalNoPlays: 0 };
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

            // すでに SoundCloud にある NoPlay プレイリスト（連番・旧名も）を番号順に集める
            // 1 番目: "[FreshDig] NoPlay" / "[FreshDig] Never Play" / "[FreshDig] Disliked Tracks"、2 番目以降: 末尾に " 2", " 3" ...
            const familyRe = /^\[freshdig\] (?:noplay|never play)(?: (\d+))?$/i;
            const existingByNo = {};
            state.myPlaylists.forEach(function (p) {
                const title = String(p.title || '').trim();
                let no = null;
                const m = title.match(familyRe);
                if (m) no = m[1] ? parseInt(m[1], 10) : 1;
                else if (title.toLowerCase() === LEGACY_DISLIKE_PLAYLIST_PREFIX.toLowerCase()) no = 1;
                if (no && !existingByNo[no]) existingByNo[no] = p;
            });

            // SoundCloud 側の曲 + 手元の曲を合わせる（別の PC で登録した曲を消さないため）
            const mergedIds = [];
            const seen = new Set();
            const pushId = function (v) {
                const n = toNumId(v);
                if (n && !seen.has(n)) { seen.add(n); mergedIds.push(n); }
            };
            const existingNos = Object.keys(existingByNo).map(Number).sort(function (a, b) { return a - b; });
            for (const no of existingNos) {
                const plRes = await scApi('playlists/' + existingByNo[no].id);
                if (!plRes.ok) {
                    // 読めないプレイリストを上書きすると曲が消えるので、ここで止める
                    return { success: false, message: tt('m_exPlFail', { s: plRes.status }) };
                }
                const plData = await plRes.json();
                (plData.tracks || []).forEach(function (t) { pushId(t && t.id); });
            }
            trackIds.forEach(pushId);

            // 500曲単位に分割（SoundCloud のプレイリスト上限が 500 曲）
            const chunkSize = 500;
            const chunks = [];
            for (let i = 0; i < mergedIds.length; i += chunkSize) {
                chunks.push(mergedIds.slice(i, i + chunkSize));
            }

            let failStatus = null;
            for (let idx = 0; idx < chunks.length; idx++) {
                const no = idx + 1;
                const plTitle = no === 1 ? NEVER_PLAY_PLAYLIST_PREFIX : (NEVER_PLAY_PLAYLIST_PREFIX + ' ' + no);
                const existingPl = existingByNo[no];
                const res = existingPl
                    ? await scApi('playlists/' + existingPl.id, {
                        method: 'PUT',
                        body: { playlist: { title: plTitle, tracks: chunks[idx] } }
                    })
                    : await scApi('playlists', {
                        method: 'POST',
                        body: { playlist: { title: plTitle, sharing: 'private', tracks: chunks[idx] } }
                    });
                if (!res.ok) {
                    failStatus = res.status;
                    break;
                }
            }

            await initUserData({ force: true });
            if (failStatus !== null) {
                return { success: false, message: tt('m_exUpdateFail', { s: failStatus }) };
            }
            if (chunks.length === 1) {
                return { success: true, message: tt('m_exCreated', { name: NEVER_PLAY_PLAYLIST_PREFIX, n: mergedIds.length }) };
            }
            return {
                success: true,
                message: tt('m_exMultiDone', { name: NEVER_PLAY_PLAYLIST_PREFIX, c: chunks.length, n: mergedIds.length })
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
            trackId: t && t.id ? toNumId(t.id) : null,
            title: title,
            artist: artist,
            genre: (t && t.genre) ? t.genre : '',
            date: new Date().toLocaleDateString()
        };

        saveDislikeData();
        recordStat('totalNoPlays');
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
            artistId: t && t.artistId ? toNumId(t.artistId) : null,
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
        const changed = JSON.stringify(Object.keys(laterState.map).sort()) !== JSON.stringify(Object.keys(m).sort());
        laterState.map = m;
        try { updateLaterButton(); } catch (e) {}
        try { syncMiniPlayerUI(); } catch (e) {}
        // Reconsider only future queue items. A user who is already listening to a
        // track should not lose it merely because the Later list changed.
        if (changed) {
            try { scheduleQueuePrune(); } catch (e) {}
        }
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

    // フォロー中の作者を、その作者自身のページで意図的に聴いているか。
    // 曲のメタデータで作者を照合し、別の作者や古いフッターの表示を流用しない。
    function isOnFollowedArtistPage(info) {
        try {
            const track = info || state.currentTrack;
            const id = track && toNumId(track.artistId);
            if (!id || !state.followingUserIds || !state.followingUserIds.has(id) || !track.artistPermalink) return false;
            const parts = window.location.pathname.split('/').filter(Boolean);
            const individualTrack = parts.length === 2 && ['likes', 'reposts', 'followers', 'following', 'stations'].indexOf(parts[1].toLowerCase()) === -1;
            if (!FreshDigCore.isArtistPagePath(window.location.pathname) && !individualTrack) return false;
            return String(track.artistPermalink).toLowerCase() === (parts[0] || '').toLowerCase();
        } catch (e) {}
        return false;
    }

    function shouldKeepTrackOnArtistPage(reason, info) {
        if (isOnLaterArtistPage(info)) return true;
        return (reason === 'skipReasonFollowing' || reason === 'skipReasonLiked') &&
            isOnFollowedArtistPage(info) && !getSkipReason(info);
    }

    // いま開いているのが「後で聴く」に入れた作者のページか（そのページから聴くときは、ライク済み・フォロー中でも飛ばさない）
    function isOnLaterArtistPage(info) {
        try {
            const path = window.location.pathname;
            const parts = path.split('/').filter(Boolean);
            const trackPage = parts.length === 2 && ['likes', 'reposts', 'followers', 'following', 'stations'].indexOf(parts[1].toLowerCase()) === -1;
            if (!FreshDigCore.isArtistPagePath(path) && !trackPage) return false;
            const track = info || state.currentTrack;
            const id = track && toNumId(track.artistId);
            const saved = id && laterState.map[String(id)];
            return !!(saved && saved.permalink && String(saved.permalink).toLowerCase() === (parts[0] || '').toLowerCase());
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
            try { scheduleQueuePrune(); } catch (e) {}
            return tt('m_laterRemoved', { name: name });
        }
        const r = await laterOp({ op: 'add', item: { artistId: id, name: name, permalink: getArtistPermalink(t), avatarUrl: t.avatarUrl || '', fromTrackTitle: t.title || '' } });
        if (!r.ok) return r.reason === 'limit' ? tt('m_laterLimit') : tt('m_laterFail');
        laterState.map[id] = laterState.map[id] || { artistId: id, name: name, permalink: getArtistPermalink(t), addedAt: Date.now() };
        updateLaterButton();
        try { scheduleQueuePrune(); } catch (e) {}
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
    let lastPlayedMediaTrackKey = '';
    const trackedMediaEvents = new WeakSet();
    let volumePrecisionRestored = false;

    function rememberPlaybackMedia(media) {
        lastPlayedMedia = media;
        lastPlayedMediaTrackKey = playbackTrackKey();
        if (!media || trackedMediaEvents.has(media) || typeof media.addEventListener !== 'function') return;
        trackedMediaEvents.add(media);
        ['play', 'pause', 'waiting', 'stalled', 'error', 'ended'].forEach(function (type) {
            media.addEventListener(type, function () {
                // Connected media is already observed by the document capture listener.
                if (isConnectedMedia(media) || lastPlayedMedia !== media) return;
                dlog('audio-' + type, getPlaybackDiagnostic(media));
                if (type === 'play') playbackIntent.wanted = true;
                else if (type === 'pause' && !media.ended) notePausedMedia(media);
                else if (type !== 'pause') schedulePlaybackRecovery(media, type);
            });
        });
    }

    function isConnectedMedia(media) {
        if (!media || (media.tagName !== 'AUDIO' && media.tagName !== 'VIDEO')) return false;
        if (media.isConnected === false) return false;
        try {
            if (document.documentElement && typeof document.documentElement.contains === 'function' && !document.documentElement.contains(media)) return false;
        } catch (e) {}
        return !!media.src;
    }

    function getActiveMedia(includePaused) {
        let media = [];
        try { media = Array.from(document.querySelectorAll('audio,video')).filter(isConnectedMedia); } catch (e) {}
        const playing = media.filter(function (m) { return !m.paused && !m.ended && m.readyState > 0; });
        if (playing.length) return playing[0];
        // SoundCloud may use new Audio() without inserting it into the DOM.
        // A prototype-observed player is valid even when detached, but a paused
        // player from an older track must not be resumed after a track change.
        if (lastPlayedMedia && (lastPlayedMedia.src || lastPlayedMedia.currentSrc) && !lastPlayedMedia.ended) {
            if (!lastPlayedMedia.paused || (includePaused && lastPlayedMediaTrackKey === playbackTrackKey())) return lastPlayedMedia;
        }
        if (!includePaused) return null;
        return media.find(function (m) { return !m.ended && m.readyState > 0; }) || null;
    }

    function playbackTrackKey() {
        const t = state.currentTrack;
        return t && (t.id || normalizeTrackPath(t.href) || t.title) ? String(t.id || normalizeTrackPath(t.href) || t.title) : '';
    }

    function waitForLocalPlaying(expected, timeoutMs) {
        const timeout = timeoutMs || 700;
        return new Promise(function (resolve) {
            const started = Date.now();
            const check = function () {
                const playing = isLocalPlaying();
                if (playing === expected || Date.now() - started >= timeout) {
                    resolve(playing === expected);
                    return;
                }
                setTimeout(check, 50);
            };
            check();
        });
    }

    // A media element can report "playing" while its position is frozen after
    // a long-idle tab. Verify that the seek position actually advances before
    // reporting a successful play command.
    function readPlaybackPosition(media) {
        if (media && Number.isFinite(media.currentTime)) return Number(media.currentTime);
        const pos = getPlaybackPositionSeconds();
        return pos && Number.isFinite(pos.position) ? Number(pos.position) : null;
    }

    function waitForPlaybackProgress(media, initialPosition, timeoutMs) {
        const timeout = timeoutMs || 1000;
        const started = Date.now();
        const baseline = Number.isFinite(initialPosition) ? initialPosition : readPlaybackPosition(media);
        return new Promise(function (resolve) {
            const check = function () {
                const now = readPlaybackPosition(media);
                if (Number.isFinite(now) && Number.isFinite(baseline) && now > baseline + 0.15) {
                    resolve(true);
                    return;
                }
                if (Date.now() - started >= timeout) {
                    resolve(false);
                    return;
                }
                setTimeout(check, 100);
            };
            check();
        });
    }

    function requestPlaybackPageReload(reason) {
        if (playbackIntent.pageReloadInFlight || !window.location || typeof window.location.reload !== 'function') return false;
        const trackKey = playbackTrackKey() || 'unknown';
        const now = Date.now();
        let previous = null;
        try { previous = JSON.parse(sessionStorage.getItem(PLAYBACK_RELOAD_GUARD_KEY) || 'null'); } catch (e) {}
        // A reload can itself take a moment to restore the player. Do not loop
        // on the same frozen track if the refreshed page reports no progress.
        if (previous && previous.trackKey === trackKey && now - Number(previous.at || 0) < 60000) {
            dlog('playback-page-reload-suppressed', { reason: reason, trackKey: trackKey });
            return false;
        }
        try {
            sessionStorage.setItem(PLAYBACK_RELOAD_GUARD_KEY, JSON.stringify({ trackKey: trackKey, at: now }));
            // A page reload destroys Document PiP/window.open ownership. Remember
            // that the player was open so the new page can reopen it once loaded.
            if (miniPlayerWindow && !miniPlayerWindow.closed) {
                sessionStorage.setItem(MINI_PLAYER_RESTORE_KEY, JSON.stringify({ at: now, reason: reason || 'playback-reload' }));
                dlog('miniplayer-restore-armed', { reason: reason || 'playback-reload', trackKey: trackKey });
            }
        } catch (e) {}
        playbackIntent.pageReloadInFlight = true;
        dlog('playback-page-reload-requested', { reason: reason, trackKey: trackKey });
        setTimeout(function () {
            try { window.location.reload(); } catch (e) { playbackIntent.pageReloadInFlight = false; dlog('playback-page-reload-failed', errorName(e)); }
        }, 120);
        return true;
    }

    async function verifyAndRecoverExplicitPlay(media, initialPosition) {
        if (await waitForPlaybackProgress(media, initialPosition, 1000)) return { success: true, verified: true };
        dlog('playback-progress-stalled', { playback: getPlaybackDiagnostic(media) });

        // First retry the native page control once. This handles a stale media
        // element without immediately discarding the SoundCloud page state.
        const button = document.querySelector('.playControls__play:not(.playing)');
        if (button) {
            try { button.click(); } catch (e) {}
            if (await waitForPlaybackProgress(getActiveMedia(true) || media, readPlaybackPosition(media), 900)) {
                dlog('playback-progress-recovered', { method: 'native-button' });
                return { success: true, verified: true, recovered: true };
            }
        }
        if (requestPlaybackPageReload('explicit-play-no-progress')) {
            return { success: false, reloading: true, verified: false };
        }
        return { success: false, verified: false, stalled: true };
    }

    // HTMLMediaElement.play() can reject or remain pending when the browser's
    // autoplay/permission state is unresolved. Never leave a remote command or
    // recovery attempt waiting forever, and never fall back to a second toggle.
    function invokeMediaPlay(media, timeoutMs, cancelOnTimeout) {
        const timeout = timeoutMs || 700;
        return new Promise(function (resolve) {
            let settled = false;
            let timer = null;
            const done = function (result) {
                if (settled) return;
                settled = true;
                if (timer) clearTimeout(timer);
                resolve(result);
            };
            let result;
            try {
                result = media && typeof media.play === 'function' ? media.play() : null;
            } catch (e) {
                done({ success: false, error: e });
                return;
            }
            Promise.resolve(result).then(function () {
                done({ success: true });
            }, function (e) {
                done({ success: false, error: e });
            });
            timer = setTimeout(function () {
                // An automatic recovery must not turn slow buffering into a pause.
                // Only an explicit play command cancels its pending request on timeout.
                if (cancelOnTimeout !== false) {
                    try { if (media && media.pause) media.pause(); } catch (e) {}
                }
                done({ success: false, pending: cancelOnTimeout === false, error: { name: 'PlayTimeout' } });
            }, timeout);
        });
    }

    function getPlaybackDiagnostic(media) {
        const active = media || getActiveMedia(true);
        const track = state.currentTrack;
        return {
            trackId: track ? toNumId(track.id) : null,
            wanted: !!playbackIntent.wanted,
            discoveryEnabled: !!state.discoveryEnabled,
            robotBlocked: !!state.robotBlocked,
            recoveryInFlight: !!playbackIntent.recoveryInFlight,
            hasMedia: !!active,
            paused: active ? !!active.paused : null,
            ended: active ? !!active.ended : null,
            currentTime: active && Number.isFinite(active.currentTime) ? Math.round(active.currentTime * 10) / 10 : null,
            readyState: active ? active.readyState : null,
            networkState: active ? active.networkState : null,
            mediaError: active && active.error ? active.error.code : null
        };
    }

    function schedulePlaybackRecovery(media, reason) {
        const key = playbackTrackKey();
        if (!key || !playbackIntent.wanted || !state.discoveryEnabled || state.robotBlocked || playbackIntent.recoveryInFlight) return;
        if (playbackIntent.trackKey !== key) {
            playbackIntent.trackKey = key;
            playbackIntent.recoveries = 0;
            playbackIntent.lastRecoveryAt = 0;
        }
        if (playbackIntent.recoveries >= 2 || Date.now() - playbackIntent.lastRecoveryAt < 1500) return;
        playbackIntent.recoveryInFlight = true;
        playbackIntent.recoveries++;
        playbackIntent.lastRecoveryAt = Date.now();
        dlog('playback-recovery-attempt', { reason: reason, n: playbackIntent.recoveries, playback: getPlaybackDiagnostic(media) });
        setTimeout(async function () {
            let outcome = 'cancelled';
            try {
                if (!playbackIntent.wanted || !state.discoveryEnabled || state.robotBlocked || playbackTrackKey() !== key) return;
                if (reason === 'ended') {
                    const pm = getScPlaybackManager();
                    if (!pm || typeof pm.playNext !== 'function') { outcome = 'no-queue'; return; }
                    pm.playNext({ userInitiated: false });
                    await sleepMs(250);
                    outcome = isLocalPlaying() ? 'playing' : 'not-playing';
                    if (outcome === 'not-playing') dlog('playback-recovery-failed', { reason: reason, n: playbackIntent.recoveries });
                    return;
                }
                const active = getActiveMedia(true);
                if (!active || (media && active !== media && !isConnectedMedia(media))) { outcome = 'no-current-media'; return; }
                const playResult = await invokeMediaPlay(active, 700, false);
                if (!playResult.success) {
                    outcome = errorName(playResult.error);
                    dlog('playback-recovery-failed', { reason: reason, n: playbackIntent.recoveries, error: errorName(playResult.error) });
                    return;
                }
                outcome = (await waitForLocalPlaying(true, 500)) ? 'playing' : 'not-playing';
                if (outcome === 'not-playing') dlog('playback-recovery-failed', { reason: reason, n: playbackIntent.recoveries });
            } catch (e) {
                outcome = errorName(e);
                dlog('playback-recovery-failed', { reason: reason, n: playbackIntent.recoveries, error: errorName(e) });
            } finally {
                playbackIntent.recoveryInFlight = false;
                dlog('playback-recovery-result', { reason: reason, forTrack: key, outcome: outcome, playback: getPlaybackDiagnostic() });
            }
        }, reason === 'ended' ? 700 : 350);
    }

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

    function setVolumeThroughNativeControl(v) {
        try {
            const input = document.querySelector('.volume input[type="range"]');
            if (input) {
                const min = Number(input.min || 0);
                const max = Number(input.max || 1);
                input.value = String(min + (max - min) * v);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            const mute = document.querySelector('.volume__button');
            const current = getSoundCloudVolume();
            if (mute && ((v === 0 && current > 0) || (v > 0 && current === 0))) mute.click();
            const root = document.querySelector('.volume');
            if (root) root.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            const slider = document.querySelector('.volume__sliderWrapper');
            if (!slider) return !!mute && Math.abs(getSoundCloudVolume() - v) < 0.02;
            const rect = slider.getBoundingClientRect();
            if (!rect.height || !rect.width) return false;
            const point = { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height * (1 - v), button: 0 };
            slider.dispatchEvent(new MouseEvent('mousedown', point));
            document.dispatchEvent(new MouseEvent('mousemove', point));
            document.dispatchEvent(new MouseEvent('mouseup', point));
            return true;
        } catch (e) { return false; }
    }

    function setSoundCloudVolume(vol) {
        const v = Math.max(0, Math.min(1, Number(vol) || 0));
        dlog('freshdig-set-volume', { v: v });
        const volMod = getScVolumeModule();
        let applied = false;
        if (volMod) {
            // SoundCloud 本体の音量として設定 → 曲が変わっても維持され、本体スライダーとも同期する
            try {
                if (v === 0) {
                    volMod.setMuted(true);
                } else {
                    volMod.setVolumeAndMuted({ volume: v, muted: false });
                }
                applied = true;
            } catch (e) {
                console.warn('[SC-FreshStation] SoundCloud volume module error:', e);
            }
        } else {
            applied = setVolumeThroughNativeControl(v);
            if (!applied) dlog('volume-module-unavailable', { v: v });
        }
        // Never report mute/volume success when no native control applied it.
        applied = applied && Math.abs(getSoundCloudVolume() - v) < 0.02;
        if (applied) {
            if (v > 0) lastNonZeroVolume = v;
            try { localStorage.setItem(VOLUME_STORAGE_KEY, String(v)); } catch (e) {}
        } else {
            showGlobalToast(tt('m_volumeUnavailable'));
        }
        syncMiniPlayerVolumeUI(getSoundCloudVolume());
        return applied ? v : null;
    }

    function toggleSoundCloudMute() {
        const cur = getSoundCloudVolume();
        if (cur > 0) lastNonZeroVolume = cur;
        const target = cur > 0 ? 0 : (lastNonZeroVolume > 0 ? lastNonZeroVolume : 0.8);
        const applied = setSoundCloudVolume(target);
        if (applied === null) return { success: false, verified: false, message: tt('m_volumeUnavailable') };
        const message = target === 0 ? tt('m_muted') : tt('m_volRestored', { n: Math.round(target * 100) });
        showGlobalToast(message);
        return { success: true, verified: true, muted: target === 0 };
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

    // SoundCloud 内部モジュール経由で音量を設定できない場合は、音声要素へ直接
    // 書き込まず、次回の本体同期で適用できるよう保存値だけを維持する。
    function applySavedVolumeTo(media) {
        if (!media || getScVolumeModule()) return;
        getSavedVolume();
    }

    document.addEventListener('play', function (e) {
        if (e.target && e.target.tagName === 'AUDIO') {
            rememberPlaybackMedia(e.target);
            applySavedVolumeTo(e.target);
        }
    }, true);

    // DOM に挿入されていない Audio 要素の play はイベントが document に届かないため、play() 自体をフック
    try {
        const origMediaPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            try {
                if (this && this.tagName === 'AUDIO') {
                    rememberPlaybackMedia(this);
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
    const autoPipState = {
        callable: false,
        status: 'unsupported',
        lastError: null,
        registered: false,
        lastLogged: ''
    };

    function errorName(err) {
        const raw = err && err.name ? String(err.name) : 'UnknownError';
        return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) || 'UnknownError';
    }

    function isAutoPipCallable() {
        try {
            return !!(window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === 'function');
        } catch (e) {
            return false;
        }
    }

    function logAutoPipState(reason) {
        const key = autoPipState.status + '|' + autoPipState.lastError;
        if (key === autoPipState.lastLogged) return;
        autoPipState.lastLogged = key;
        dlog('auto-pip-registration', {
            status: autoPipState.status,
            error: autoPipState.lastError,
            reason: reason || ''
        });
        console.log('[SC-FreshStation] Auto-PiP ' + autoPipState.status + (autoPipState.lastError ? ' (' + autoPipState.lastError + ')' : ''));
    }

    function setAutoPipFailure(err, reason) {
        autoPipState.lastError = errorName(err);
        logAutoPipState(reason || 'callback');
    }

    function getAutoPipDiagnostics() {
        return {
            autoPipSupported: autoPipState.callable && autoPipState.status === 'registered',
            autoPipStatus: autoPipState.status,
            autoPipLastError: autoPipState.lastError
        };
    }

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
                return true;
            } catch (e) {}
        }
        const progressWrapper = document.querySelector('.playbackTimeline__progressWrapper');
        if (progressWrapper) {
            const rect = progressWrapper.getBoundingClientRect();
            const clientX = rect.left + rect.width * ratio;
            const clientY = rect.top + rect.height / 2;
            progressWrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: clientX, clientY: clientY }));
            progressWrapper.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: clientX, clientY: clientY }));
            return true;
        }
        return false;
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
        autoPipState.callable = isAutoPipCallable();
        if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setActionHandler !== 'function' || !autoPipState.callable) {
            if (autoPipState.registered && navigator.mediaSession && typeof navigator.mediaSession.setActionHandler === 'function') {
                try { navigator.mediaSession.setActionHandler('enterpictureinpicture', null); } catch (e) {}
            }
            autoPipState.registered = false;
            autoPipState.status = 'unsupported';
            autoPipState.lastError = null;
            logAutoPipState('unsupported');
            return;
        }
        if (autoPipState.registered) return;
        try {
            navigator.mediaSession.setActionHandler('enterpictureinpicture', function (details) {
                const reason = details && (details.enterPictureInPictureReason || details.reason);
                dlog('auto-pip-callback', { reason: reason || 'unknown' });
                if (!state.autoMiniPlayer) return;
                if (miniPlayerWindow && !miniPlayerWindow.closed) return;
                Promise.resolve(openMiniPlayer({ auto: true, reason: reason || 'unknown' })).then(function (result) {
                    if (result && result.success === false) setAutoPipFailure({ name: result.error || 'OpenFailed' }, 'callback');
                }).catch(function (err) { setAutoPipFailure(err, 'callback'); });
            });
            autoPipState.registered = true;
            autoPipState.status = 'registered';
            autoPipState.lastError = null;
            logAutoPipState('registered');
        } catch (e) {
            autoPipState.registered = false;
            autoPipState.status = 'unsupported';
            autoPipState.lastError = errorName(e);
            logAutoPipState('registration-error');
        }
    }

    function registerExtraMediaSessionHandlers() {
        if (!('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
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
    // =========================================================================
    // 🔁 リポスト
    // =========================================================================
    function isTrackReposted(trackId) {
        const id = toNumId(trackId);
        return !!(id && state.repostedTrackIds && state.repostedTrackIds.has(id));
    }

    // 曲が変わった直後は画面のボタンがまだ前の曲のまま。読み取りは画面の曲と記録の曲が同じで、1 秒以上変わっていないときだけ
    const domInteractionSync = { href: '', since: 0 };
    const pendingInteractions = Object.create(null);
    const INTERACTION_TIMEOUT_MS = 2500;

    function interactionKey(action, id) { return action + ':' + String(id); }

    function beginInteraction(action, id, expected, trackId) {
        const key = interactionKey(action, id);
        const token = { key: key, action: action, id: toNumId(id), trackId: toNumId(trackId || (state.currentTrack && state.currentTrack.id)), expected: !!expected, startedAt: Date.now() };
        pendingInteractions[key] = token;
        setTimeout(function () {
            if (pendingInteractions[key] === token) delete pendingInteractions[key];
        }, INTERACTION_TIMEOUT_MS);
        return token;
    }

    function getPendingInteraction(action, id) {
        const key = interactionKey(action, id);
        const token = pendingInteractions[key];
        if (token && Date.now() - token.startedAt <= INTERACTION_TIMEOUT_MS) return token;
        if (token) delete pendingInteractions[key];
        return null;
    }

    function endInteraction(token) {
        if (token && pendingInteractions[token.key] === token) delete pendingInteractions[token.key];
    }

    function nativeButtonActive(button) {
        if (!button) return false;
        if (button.classList && button.classList.contains('sc-button-selected')) return true;
        if (button.getAttribute && (button.getAttribute('aria-checked') === 'true' || button.getAttribute('aria-pressed') === 'true')) return true;
        const text = ((button.getAttribute && (button.getAttribute('title') || button.getAttribute('aria-label')) || '') + ' ' + (button.textContent || '')).toLowerCase();
        return /unlike|unfollow|unrepost|following|フォロー中|フォロー解除|リポスト解除/.test(text);
    }

    function nativeLikeButton() { return document.querySelector('.playbackSoundBadge__like'); }

    function nativeRepostButton() {
        return document.querySelector('.playbackSoundBadge__actions button[title*="Repost" i], .playbackSoundBadge__actions button[aria-label*="Repost" i], .playbackSoundBadge__repost');
    }

    function nativeFollowButton() {
        // A profile/recommendation button can belong to a different artist than
        // the playing track. Only the current playback footer is safe to use.
        const domHref = normalizeTrackPath(getPlayingTrackHref());
        const curHref = normalizeTrackPath(state.currentTrack && state.currentTrack.href);
        if (!domHref || domHref !== curHref) return null;
        return document.querySelector('.playbackSoundBadge__follow');
    }

    function currentTrackMatches(id) {
        return !!(state.currentTrack && toNumId(state.currentTrack.id) === toNumId(id));
    }

    async function waitForNativeInteraction(action, id, button, expected, token) {
        let stable = 0;
        for (let i = 0; i < 20; i++) {
            await sleepMs(100);
            if (getPendingInteraction(action, id) !== token || !currentTrackMatches(token.trackId) || button.isConnected === false) return false;
            if (nativeButtonActive(button) === !!expected) {
                stable++;
                if (stable >= 2) return true;
            } else {
                stable = 0;
            }
        }
        return false;
    }

    function commitInteraction(action, id, active) {
        const numId = toNumId(id);
        if (!numId) return;
        if (action === 'like') {
            if (active) state.likedTrackIds.add(numId); else state.likedTrackIds.delete(numId);
        } else if (action === 'repost') {
            if (active) state.repostedTrackIds.add(numId); else state.repostedTrackIds.delete(numId);
        } else if (action === 'follow') {
            if (active) state.followingUserIds.add(numId); else state.followingUserIds.delete(numId);
        }
        saveCacheData();
        fdBus.post('interaction-changed', { action: action, id: numId, active: !!active });
        syncMiniPlayerUI();
    }

    fdBus.on('interaction-changed', function (m) {
        const id = toNumId(m && m.id);
        if (!id || !m || typeof m.action !== 'string') return;
        if (m.action === 'like') {
            if (m.active) state.likedTrackIds.add(id); else state.likedTrackIds.delete(id);
        } else if (m.action === 'repost') {
            if (m.active) state.repostedTrackIds.add(id); else state.repostedTrackIds.delete(id);
        } else if (m.action === 'follow') {
            if (m.active) state.followingUserIds.add(id); else state.followingUserIds.delete(id);
        } else return;
        syncMiniPlayerUI();
    });

    async function runNativeInteraction(action, id, button, expected, toast, successText, trackId) {
        const expectedTrack = toNumId(trackId || (action === 'follow' ? state.currentTrack && state.currentTrack.id : id));
        const domHref = normalizeTrackPath(getPlayingTrackHref());
        const curHref = normalizeTrackPath(state.currentTrack && state.currentTrack.href);
        if (!button || !currentTrackMatches(expectedTrack) || !domHref || domHref !== curHref) return { success: false, verified: false, message: tt('m_trackLoading') };
        if (getPendingInteraction(action, id)) return { success: false, pending: true, message: tt('m_actionPending') };
        const before = nativeButtonActive(button);
        if (before === !!expected) {
            commitInteraction(action, id, before);
            if (toast && successText) toast(successText);
            return { success: true, verified: true, changed: false, active: before };
        }
        const token = beginInteraction(action, id, expected, expectedTrack);
        try {
            button.click();
            const verified = await waitForNativeInteraction(action, id, button, expected, token);
            if (!verified) {
                const failure = { success: false, message: tt('m_commErr'), verified: false };
                if (toast) toast(failure.message);
                return failure;
            }
            commitInteraction(action, id, expected);
            if (toast && successText) toast(successText);
            return { success: true, verified: true, changed: true, active: !!expected };
        } catch (e) {
            const failure = { success: false, message: errorName(e), verified: false };
            if (toast) toast(failure.message);
            return failure;
        } finally {
            endInteraction(token);
        }
    }

    async function toggleLikeFromNative(toast) {
        toast = toast || showGlobalToast;
        const id = state.currentTrack && toNumId(state.currentTrack.id);
        const button = nativeLikeButton();
        if (!id || !button) {
            const failure = { success: false, message: !button ? tt('m_noLikeBtn') : tt('m_trackLoading') };
            toast(failure.message);
            return failure;
        }
        const expected = !nativeButtonActive(button);
        return runNativeInteraction('like', id, button, expected, toast, expected ? tt('mpToastLiked') : tt('mpToastUnliked'));
    }

    // 再生中の曲の DOM ボタン（Repost / Like）の状態を読み取り、ローカル状態＆キャッシュへ自動同期
    function syncCurrentTrackInteractionsFromDom() {
        const trackId = state.currentTrack && toNumId(state.currentTrack.id);
        if (!trackId) return;
        const domHref = normalizeTrackPath(getPlayingTrackHref());
        const curHref = normalizeTrackPath(state.currentTrack.href);
        if (!domHref || !curHref || domHref !== curHref) { domInteractionSync.href = ''; return; }
        const now = Date.now();
        if (domInteractionSync.href !== domHref) { domInteractionSync.href = domHref; domInteractionSync.since = now; return; }
        if (now - domInteractionSync.since < 1000) return;

        // Do not let the 500ms DOM poll undo a native click while SoundCloud is
        // still resolving it. The pending key contains both action and track id.
        const pendingRepost = getPendingInteraction('repost', trackId);
        const repostBtn = nativeRepostButton();
        if (repostBtn && !pendingRepost) {
            const isReposted = nativeButtonActive(repostBtn);
            if (isReposted !== state.repostedTrackIds.has(trackId)) commitInteraction('repost', trackId, isReposted);
        }

        const pendingLike = getPendingInteraction('like', trackId);
        const likeBtn = nativeLikeButton();
        if (likeBtn && !pendingLike) {
            const isLiked = nativeButtonActive(likeBtn);
            if (isLiked !== state.likedTrackIds.has(trackId)) commitInteraction('like', trackId, isLiked);
        }

        const artistId = state.currentTrack && toNumId(state.currentTrack.artistId);
        const pendingFollow = artistId && getPendingInteraction('follow', artistId);
        const followBtn = nativeFollowButton();
        if (followBtn && artistId && !pendingFollow) {
            const isFollowing = nativeButtonActive(followBtn);
            if (isFollowing !== state.followingUserIds.has(artistId)) commitInteraction('follow', artistId, isFollowing);
        }
    }

    // リポスト済みの曲IDを取得（ミニプレイヤーの表示と「解除」の判定用）
    async function syncRepostedTrackIds() {
        try {
            const ids = await fetchPagedIds('me/track_reposts/ids?limit=200', 20000, toNumId);
            if (ids) state.repostedTrackIds = ids;
        } catch (e) {}
    }

    // 通常リポスト実行と検証。ネイティブ操作がある場合は SoundCloud に状態を
    // 任せ、完了を DOM で確認してから FreshDig のキャッシュを更新する。
    async function repostTrack(trackId, toast, desired) {
        toast = toast || showGlobalToast;
        const numId = toNumId(trackId);
        if (!numId) return { success: false, message: tt('m_trackLoading') };
        const native = nativeRepostButton();
        if (native && currentTrackMatches(numId)) {
            const want = desired === undefined ? true : !!desired;
            return runNativeInteraction('repost', numId, native, want, toast, want ? tt('mpToastReposted') : tt('mpToastUnreposted'));
        }
        if (!(await waitForAuthToken(1500))) {
            const failure = { success: false, message: tt('m_loginPlease'), verified: false };
            toast(failure.message);
            return failure;
        }
        toast(desired === false ? tt('m_unreposting') : tt('m_reposting'));
        try {
            const res = await scApi('me/track_reposts/' + numId, { method: desired === false ? 'DELETE' : 'PUT' });
            if (!res.ok) {
                dlog('repost-fail', { trackId: numId, status: res.status });
                const failure = { success: false, message: tt(desired === false ? 'm_unrepostFail' : 'm_repostFail', { s: res.status }), verified: false };
                toast(failure.message);
                return failure;
            }

            const active = desired !== false;
            commitInteraction('repost', numId, active);
            toast(active ? tt('m_reposted') : tt('mpToastUnreposted'));
            dlog('repost', { trackId: numId, status: res.status, verified: false, apiOk: true });
            return { success: true, verified: false, active: active };
        } catch (err) {
            console.error('[SC-FreshStation] Repost error:', err);
            dlog('repost-fail', { trackId: numId, error: errorName(err) });
            const failure = { success: false, message: tt('m_commErr'), verified: false };
            toast(failure.message);
            return failure;
        }
    }

    // =========================================================================
    // 📻 浮遊ミニプレイヤー (Document Picture-in-Picture & Fallback)
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
                return { success: false, error: 'NoWindow' };
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
            console.log('[SC-FreshStation] 📻 Mini Player opened successfully' + (isAuto ? ' (auto on tab switch)' : ''));
            return { success: true };
        } catch (err) {
            miniPlayerWindow = null;
            const name = errorName(err);
            if (err && err.name === 'NotAllowedError') {
                // ページ内のクリック直後でないため開けなかった
                if (!isAuto) showMiniPlayerLaunchPrompt();
            } else {
                console.error('[SC-FreshStation] Failed to open Mini Player:', name);
            }
            if (isAuto) dlog('auto-pip-failure', { name: name });
            return { success: false, error: name };
        }
    }

    function restoreMiniPlayerAfterReload() {
        let marker = null;
        try { marker = JSON.parse(sessionStorage.getItem(MINI_PLAYER_RESTORE_KEY) || 'null'); } catch (e) {}
        if (!marker || !marker.at || Date.now() - Number(marker.at) > 60000) return;
        try { sessionStorage.removeItem(MINI_PLAYER_RESTORE_KEY); } catch (e) {}
        // Wait for SoundCloud's player and document body to settle after reload.
        setTimeout(function () {
            if (miniPlayerWindow && !miniPlayerWindow.closed) return;
            openMiniPlayer({ auto: true, reason: 'after-playback-reload' }).then(function (result) {
                if (!result || result.success !== false) return;
                dlog('miniplayer-restore-failed', { error: result.error || 'OpenFailed' });
                // Browsers may require a transient user activation for PiP. The
                // existing in-page launcher is the safe fallback in that case.
                showMiniPlayerLaunchPrompt();
            }).catch(function (err) {
                dlog('miniplayer-restore-failed', { error: errorName(err) });
                showMiniPlayerLaunchPrompt();
            });
        }, 900);
    }

    let isSeekingInMiniPlayer = false;

    // ミニプレイヤー（Document PiP の小窓）ではブラウザ標準の title の吹き出しが出ないため、自前で出す。
    // title は 0.5 秒ごとの同期で書き直されるので、乗せた時に毎回 data-tip へ移す（標準の吹き出しと二重にならないように）
    function setupMiniPlayerTooltip(doc) {
        const tip = doc.getElementById('mp-tip');
        if (!tip) return;
        let timer = null;
        let current = null;
        const hide = function () {
            clearTimeout(timer);
            timer = null;
            current = null;
            tip.style.display = 'none';
        };
        doc.addEventListener('mouseover', function (e) {
            const el = e.target && e.target.closest ? e.target.closest('[title],[data-tip]') : null;
            if (!el || el === doc.body) { hide(); return; }
            if (el.getAttribute('title')) {
                el.dataset.tip = el.getAttribute('title');
                el.removeAttribute('title');
            }
            if (el === current) return;
            hide();
            current = el;
            timer = setTimeout(function () {
                const text = el.dataset.tip || '';
                if (!text || current !== el) return;
                tip.textContent = text;
                tip.style.display = 'block';
                const win = doc.defaultView;
                const r = el.getBoundingClientRect();
                const tw = tip.offsetWidth;
                const th = tip.offsetHeight;
                let left = Math.min(Math.max(4, r.left + r.width / 2 - tw / 2), win.innerWidth - tw - 4);
                let top = r.top - th - 4;
                if (top < 2) top = Math.min(r.bottom + 4, win.innerHeight - th - 2);
                tip.style.left = left + 'px';
                tip.style.top = top + 'px';
            }, 400);
        });
        doc.addEventListener('mouseleave', hide);
        doc.addEventListener('mousedown', hide);
    }

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
                    position: relative;
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
                .title {
                    padding-right: 85px;
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
                    margin-top: 4px;
                }
                .badge-row button {
                    flex: 0 0 26px;
                    height: 24px;
                    width: 24px;
                    min-width: 24px;
                    border-radius: 5px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                    background: #222;
                    padding: 0;
                    font-size: 17px;
                    line-height: 1;
                    overflow: hidden;
                }
                .status-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    height: 24px;
                    padding: 0 8px;
                    border-radius: 6px;
                    background: #ff5500;
                    border: 1px solid #ff5500;
                    color: #fff;
                    white-space: nowrap;
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    line-height: 1;
                    box-sizing: border-box;
                }
                .status-badge:hover {
                    background: #ff5500;
                    color: #fff;
                    transform: scale(1.04);
                }
                .badge-row .status-badge { width: auto; min-width: 72px; max-width: 155px; padding: 0 7px; font-size: 10px; text-overflow: ellipsis; background: #ff5500; color: #fff; }
                .status-badge.following-mode {
                    border-color: #29b6f6;
                    background: #222;
                    color: #4fc3f7;
                }
                .status-badge.off {
                    border-color: #a259ff;
                    background: #222;
                    color: #d4a5ff;
                }
                .status-badge.off:hover {
                    background: #a259ff;
                    border-color: #a259ff;
                    color: #fff;
                }
                .status-badge.following-mode:hover {
                    background: #0288d1;
                    color: #fff;
                }
                .btn-station {
                    border: 1px solid #ff5500;
                    color: #ff7700;
                    font-size: 17px;
                }
                .btn-station:hover {
                    background: #ff5500;
                    color: #fff;
                }
                .btn-later {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 17px;
                    opacity: 0.75;
                }
                .btn-later:hover {
                    background: #333;
                    color: #fff;
                    opacity: 1;
                }
                .btn-later.saved {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                    opacity: 1;
                }
                .btn-follow {
                    border: 1px solid #444;
                    color: #eee;
                    font-size: 17px;
                    opacity: 1;
                }
                .btn-follow svg { width: 21px; height: 21px; pointer-events: none; }
                .badge-row .btn-later { flex: 0 0 34px; width: 34px; min-width: 34px; height: 30px; font-size: 19px; border-color: #ff5500; color: #ff9a55; opacity: 1; }
                .badge-row .btn-later-list { width: auto; min-width: 0; flex: 1; height: 30px; padding: 0 10px; font-size: 13px; font-weight: 700; color: #ff9a55; border-color: #ff5500; opacity: 1; white-space: nowrap; text-overflow: ellipsis; }
                button:focus-visible, a:focus-visible { outline: 2px solid #ffb36b; outline-offset: 1px; }
                .btn-follow:hover {
                    background: #333;
                    color: #fff;
                    opacity: 1;
                }
                .btn-follow.following {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                    opacity: 1;
                }
                .btn-hate {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 17px;
                    opacity: 0.75;
                }
                .btn-hate:hover {
                    background: #333;
                    color: #fff;
                    opacity: 1;
                }
                .btn-hate.hated {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                    opacity: 1;
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
                    border: 1px solid #444;
                    background: #222;
                    color: #888;
                    font-size: 19px;
                    line-height: 1;
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
                    overflow: hidden;
                    opacity: 0.85;
                }
                button:hover {
                    background: #333;
                    color: #fff;
                    opacity: 1;
                    transform: translateY(-1px);
                }
                button:active {
                    transform: translateY(0);
                }
                .btn-play {
                    flex: 1.25;
                    background: #222;
                    border: 1px solid #444;
                    color: #888;
                    font-size: 21px;
                }
                .btn-play:hover {
                    background: #333;
                    border-color: #ff7700;
                    color: #ff7700;
                }
                .btn-play.playing {
                    background: #ff5500;
                    border-color: #ff5500;
                    color: #fff;
                    opacity: 1;
                }
                .btn-play.playing:hover {
                    background: #ff7700;
                    border-color: #ff7700;
                    color: #fff;
                }
                .btn-like {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 19px;
                }
                .btn-like.liked {
                    color: #fff;
                    background: #ff5500;
                    border-color: #ff5500;
                    opacity: 1;
                }
                .btn-repost {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 19px;
                }
                .btn-repost.reposted {
                    color: #fff;
                    background: #ff5500;
                    border-color: #ff5500;
                    opacity: 1;
                }
                .btn-pl {
                    border: 1px solid #444;
                    color: #888;
                    font-weight: bold;
                    font-size: 21px;
                }
                .btn-pl:hover {
                    background: #333;
                    color: #fff;
                }
                .btn-pl.in-pl {
                    border-color: #ff5500;
                    color: #fff;
                    background: #ff5500;
                    opacity: 1;
                }
                .btn-pl.in-pl:hover {
                    background: #ff7700;
                    border-color: #ff7700;
                }
                .btn-dislike {
                    border: 1px solid #444;
                    color: #888;
                    font-size: 18px;
                }
                .btn-dislike:hover {
                    border-color: #ff5500;
                    color: #ff5500;
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
                        <button class="status-badge" id="mp-status" type="button">${tx.mpStatusWaiting}</button>
                        <button class="btn-station" id="mp-station" title="${tx.mpStationBtnTitle}"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 9 6 21h12L12 9Zm-3 6h6M7 21l5-6 5 6M12 4v5M8 3a6 6 0 0 0 0 8M16 3a6 6 0 0 1 0 8M5 1a9 9 0 0 0 0 12M19 1a9 9 0 0 1 0 12"/></svg></button>
                        <button class="btn-later" id="mp-later" title="">🧐</button>
                        <button class="btn-later-list" id="mp-later-list" type="button">${tx.mpLaterListLabel}</button>
                        <button class="btn-hate" id="mp-hate" title="${tx.mpHateTitle}">🤬</button>
                    </div>
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
                <button class="btn-pl" id="mp-add-pl" title="${tx.mpAddPlTitle}">➕</button>
                <button class="btn-follow" id="mp-follow" title="${tx.mpFollowBtnTitle}" aria-label="${tx.mpFollowBtnTitle}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></svg></button>
            </div>
            <div class="toast" id="mp-toast"></div>
            <div id="mp-tip" style="position:fixed;z-index:50;display:none;max-width:calc(100vw - 12px);background:#000;color:#fff;border:1px solid #555;border-radius:4px;padding:3px 6px;font-size:10px;line-height:1.35;pointer-events:none;white-space:normal;"></div>
        `;

        setupMiniPlayerTooltip(doc);

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

        // リポスト：未リポストなら通常リポスト、リポスト済みなら解除
        doc.getElementById('mp-repost')?.addEventListener('click', function () {
            const d = mpCurrentData();
            run('repost', { unrepost: !!d.reposted });
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
        const listButton = doc.getElementById('mp-later-list');
        listButton.addEventListener('click', function () {
            laterOp({ op: 'openList' }).then(function (result) {
                if (!result.ok) mpToast(tt('m_laterOpenFail'));
            });
        });
    }
    // ---- R4: 複数タブ。音を出しているタブの「今の曲」を BroadcastChannel で流し、ミニプレイヤーはそれを写す ----
    const fdRemote = { now: null, active: false, seq: 0, pending: {} };

    function isLocalPlaying() {
        const m = getActiveMedia(false);
        if (m) return !m.paused && !m.ended;
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
        // 他タブが再生中なら 5秒、一時停止中等でも最大 30 秒以内の心拍のみ有効とする（眠り・切断対策）
        return r.d.playing ? (Date.now() - r.at < 5000) : (Date.now() - r.at < 30000);
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
        try { syncCurrentTrackInteractionsFromDom(); } catch (e) {}
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
            digSuspended: isOnLaterArtistPage(),
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
        if (!r) return Promise.resolve({ success: false, message: tt('m_tabNoReply') });
        const existing = Object.keys(fdRemote.pending).map(function (key) { return fdRemote.pending[key]; }).find(function (p) {
            return p.tabId === r.tabId && p.name === name;
        });
        if (existing) return existing.promise;
        const id = ++fdRemote.seq;
        let resolveCommand;
        const promise = new Promise(function (resolve) { resolveCommand = resolve; });
        const pending = { name: name, tabId: r.tabId, resolve: resolveCommand, promise: promise, received: false };
        pending.onTimeout = function () {
            if (fdRemote.pending[id] !== pending) return;
            const result = { success: false, uncertain: true, pending: pending.received, message: pending.received ? tt('m_actionPending') : tt('m_tabNoReply') };
            mpToast(result.message);
            pending.resolve(result);
            // Keep the in-flight key for late completion instead of retrying a
            // mutation that may already have reached SoundCloud. Bound retention.
            pending.cleanupTimer = setTimeout(function () {
                if (fdRemote.pending[id] === pending) delete fdRemote.pending[id];
            }, 240000);
        };
        fdRemote.pending[id] = pending;
        pending.receiptTimer = setTimeout(pending.onTimeout, 1500);
        fdBus.post('cmd', { to: r.tabId, id: id, name: name, args: args });
        return promise;
    }

    fdBus.on('cmd-received', function (m) {
        if (m.to !== TAB_ID) return;
        const pending = fdRemote.pending[m.id];
        if (!pending || pending.tabId !== m.fromTabId || pending.received) return;
        pending.received = true;
        clearTimeout(pending.receiptTimer);
        pending.completionTimer = setTimeout(pending.onTimeout, 60000);
    });

    fdBus.on('cmd', function (m) {
        if (m.to !== TAB_ID) return;
        fdBus.post('cmd-received', { to: m.fromTabId, id: m.id });
        const fn = MP_ACTIONS[m.name];
        const reply = function (text) { fdBus.post('cmd-toast', { to: m.fromTabId, text: text }); };
        if (!fn) {
            fdBus.post('cmd-ack', { to: m.fromTabId, id: m.id, result: { success: false, message: 'Unknown action: ' + m.name } });
            return;
        }
        try {
            const r = fn(m.args || {}, reply, null);
            Promise.resolve(r).then(function (result) {
                fdBus.post('cmd-ack', { to: m.fromTabId, id: m.id, result: result || { success: true, verified: false } });
            }, function (e) {
                const failure = { success: false, message: tt('m_commErr') };
                dlog('remote-cmd-error', m.name + ' ' + errorName(e));
                fdBus.post('cmd-ack', { to: m.fromTabId, id: m.id, result: failure });
            });
        } catch (e) {
            const failure = { success: false, message: tt('m_commErr') };
            dlog('remote-cmd-error', m.name + ' ' + errorName(e));
            fdBus.post('cmd-ack', { to: m.fromTabId, id: m.id, result: failure });
        }
    });
    fdBus.on('cmd-ack', function (m) {
        if (m.to !== TAB_ID) return;
        const pending = fdRemote.pending[m.id];
        if (!pending || pending.tabId !== m.fromTabId) return;
        clearTimeout(pending.receiptTimer);
        clearTimeout(pending.completionTimer);
        clearTimeout(pending.cleanupTimer);
        delete fdRemote.pending[m.id];
        const result = m.result || { success: true };
        if (result.success === false) mpToast(result.message || tt('m_commErr'));
        if (pending.resolve) pending.resolve(result);
    });
    fdBus.on('cmd-toast', function (m) {
        if (m.to === TAB_ID && typeof m.text === 'string') mpToast(m.text);
    });

    // 前・次: 再生管理があればそれで、なければ画面のボタンを押す
    async function scTransport(method, selector, toast) {
        let invoked = false;
        try {
            const pm = getScPlaybackManager();
            if (pm && typeof pm[method] === 'function') { pm[method]({ userInitiated: true }); invoked = true; }
        } catch (e) { dlog('transport-fail', { method: method, error: errorName(e) }); }
        if (invoked) return { success: true, method: method, verified: false };
        const b = document.querySelector(selector);
        if (b) {
            try { b.click(); invoked = true; } catch (e) {}
        }
        if (!invoked) {
            const failure = { success: false, message: tt('m_commErr') };
            if (toast) toast(failure.message);
            return failure;
        }
        return { success: true, method: method, verified: false };
    }

    // 再生/一時停止: 一度だけネイティブ経路を選び、結果を検証して返す。
    async function scTogglePlay(toast) {
        playbackIntent.pauseRevision = (playbackIntent.pauseRevision || 0) + 1;
        const playing = isLocalPlaying();
        const media = getActiveMedia(true);
        const fail = function (message) {
            const result = { success: false, message: message || tt('m_commErr') };
            if (toast) toast(result.message);
            return result;
        };
        if (playing) {
            playbackIntent.wanted = false;
            playbackIntent.suppressPauseUntil = Date.now() + 500;
            let invoked = false;
            try {
                const pm = getScPlaybackManager();
                if (pm && typeof pm.pauseCurrent === 'function') { pm.pauseCurrent(); invoked = true; }
            } catch (e) {}
            if (!invoked && media && typeof media.pause === 'function') {
                try { media.pause(); invoked = true; } catch (e) {}
            }
            if (!invoked) {
                const b = document.querySelector('.playControls__play.playing, .playControls__play');
                if (b) { try { b.click(); invoked = true; } catch (e) {} }
            }
            if (!invoked) return fail(tt('m_commErr'));
            if (!(await waitForLocalPlaying(false, 700))) return fail(tt('m_commErr'));
            return { success: true, playing: false, verified: true };
        }

        playbackIntent.wanted = true;
        const initialPosition = readPlaybackPosition(media);
        let invoked = false;
        try {
            if (media && typeof media.play === 'function' && !media.ended) {
                const playResult = await invokeMediaPlay(media, 700);
                if (!playResult.success) {
                    playbackIntent.wanted = false;
                    dlog('mini-play-blocked', errorName(playResult.error));
                    return fail(errorName(playResult.error));
                }
                invoked = true;
            }
        } catch (e) {
            playbackIntent.wanted = false;
            dlog('mini-play-blocked', errorName(e));
            return fail(errorName(e));
        }
        if (!invoked) {
            const b = document.querySelector('.playControls__play');
            if (!b) {
                playbackIntent.wanted = false;
                return fail(tt('m_commErr'));
            }
            try { b.click(); invoked = true; } catch (e) {
                playbackIntent.wanted = false;
                return fail(errorName(e));
            }
        }
        if (!(await waitForLocalPlaying(true, 700))) {
            playbackIntent.wanted = false;
            return fail(tt('m_commErr'));
        }
        const verified = await verifyAndRecoverExplicitPlay(getActiveMedia(true) || media, initialPosition);
        if (!verified.success) {
            if (verified.reloading) {
                if (toast) toast(tt('reloadRequired'));
                return { success: false, playing: false, verified: false, reloading: true, message: tt('reloadRequired') };
            }
            playbackIntent.wanted = false;
            return fail(tt('m_commErr'));
        }
        return { success: true, playing: true, verified: true, recovered: !!verified.recovered };
    }

    // ミニプレイヤーの操作の中身。(args, toast, doc) を受ける。doc はこのタブのミニプレイヤー（別タブから呼ばれたときは null）
    const MP_ACTIONS = {
        prev: function (a, toast) { return scTransport('playPrev', '.playControls__prev', toast); },
        play: function (a, toast) { return scTogglePlay(toast); },
        next: function (a, toast) { return scTransport('playNext', '.playControls__next', toast); },
        seek: function (a, toast) {
            if (typeof a.ratio !== 'number') return { success: false, message: tt('m_commErr') };
            const ok = seekToSoundCloudRatio(a.ratio);
            if (!ok && toast) toast(tt('m_commErr'));
            return { success: !!ok, verified: !!ok, message: ok ? '' : tt('m_commErr') };
        },
        vol: function (a) { return { success: typeof a.v === 'number' && setSoundCloudVolume(a.v) !== null }; },
        mute: function () { return toggleSoundCloudMute(); },
        like: function (a, toast) { return toggleLikeFromNative(toast); },
        repost: async function (a, toast) {
            const t = await ensureCurrentTrackInfo();
            const trackId = t && toNumId(t.id);
            if (!trackId) { const failure = { success: false, message: tt('m_trackLoading') }; toast(failure.message); return failure; }
            return repostTrack(trackId, toast, !a.unrepost);
        },
        follow: async function (a, toast) {
            const t = await ensureCurrentTrackInfo();
            const artistId = t && toNumId(t.artistId);
            const artistName = (t && t.artistName) || tt('m_artistDefault');
            if (!artistId) { const failure = { success: false, message: tt('m_artistLoading') }; toast(failure.message); return failure; }
            const native = nativeFollowButton();
            if (native && currentTrackMatches(t.id)) {
                const expected = !nativeButtonActive(native);
                return runNativeInteraction('follow', artistId, native, expected, toast, expected ? tt('mpToastFollowed') : tt('mpToastUnfollowed'), t.id);
            }
            const isFollowing = state.followingUserIds.has(artistId);
            toast(isFollowing ? tt('m_unfollowing') : tt('m_following'));
            try {
                if (!(await waitForAuthToken(1500))) { const failure = { success: false, message: tt('m_loginPlease'), verified: false }; toast(failure.message); return failure; }
                // SoundCloud API: フォローは POST、解除は DELETE
                const res = await scApi('me/followings/' + artistId, { method: isFollowing ? 'DELETE' : 'POST' });
                if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
                    const active = !isFollowing;
                    commitInteraction('follow', artistId, active);
                    toast(active ? tt('m_followed', { name: artistName }) : tt('m_unfollowed', { name: artistName }));
                    return { success: true, verified: false, active: active };
                } else {
                    const failure = { success: false, message: tt('m_followFail', { s: res.status }), verified: false };
                    toast(failure.message);
                    return failure;
                }
            } catch (e) {
                console.error('[SC-FreshStation] Follow error:', e);
                const failure = { success: false, message: tt('m_commErr'), verified: false };
                toast(failure.message);
                return failure;
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
        if (mpPlay) {
            mpPlay.textContent = d.playing ? '⏸' : '▶';
            mpPlay.classList.toggle('playing', !!d.playing);
        }

        const mpAddPl = doc.getElementById('mp-add-pl');
        if (mpAddPl && d.inPl !== undefined && mpAddPl.textContent !== '⏳') {
            mpAddPl.classList.toggle('in-pl', !!d.inPl);
            mpAddPl.textContent = d.inPl ? '✔' : '➕';
        }

        // Like 状態
        if (mpLike && d.hasLikeBtn !== false) {
            mpLike.textContent = '🤍';
            mpLike.classList.toggle('liked', !!d.liked);
        }

        // Repost 状態
        if (mpRepost) {
            mpRepost.title = d.reposted ? tt('m_repostedTip') : tt('m_repostTip');
            mpRepost.classList.toggle('reposted', !!d.reposted);
        }

        // Follow 状態
        if (mpFollow && d.following !== null && d.following !== undefined) {
            mpFollow.classList.toggle('following', !!d.following);
            mpFollow.title = d.following ? tt('m_followingLbl') : tt('mpFollowBtnTitle');
            mpFollow.setAttribute('aria-label', mpFollow.title);
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
            const suspended = isOn && !!d.digSuspended;
            const label = state.robotBlocked ? ('⚠️ ' + getI18nTexts().robotShort) : (suspended ? tt('mpDigListening') : (!isOn ? tt('m_stOff') : (isDiscovery ? tt('m_stOn') : tt('m_stFollow'))));
            if (mpStatus.textContent !== label) mpStatus.textContent = label;
            const tStatus = getI18nTexts(); mpStatus.title = isOn ? tStatus.mpStatusToggleOff : tStatus.mpStatusToggleOn;
            mpStatus.classList.toggle('off', !isOn || suspended);
            mpStatus.classList.toggle('following-mode', isOn && !isDiscovery);
        }
        const listButton = doc.getElementById('mp-later-list');
        if (listButton) listButton.textContent = getI18nTexts().mpLaterListLabel;

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
    registerAutoMiniPlayerHandler();
    registerExtraMediaSessionHandlers();
    restoreMiniPlayerAfterReload();

})();




