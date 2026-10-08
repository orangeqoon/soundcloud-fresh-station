# FreshDig v2.0 引き継ぎ（P3 まで完了 → 次は P4）

正本は `docs/PLAN-v2.0.md`。決まりは `CLAUDE.md`。ここは「今どこまで進んだか」だけ。

## 進み具合（サブモジュール main、push はまだ）
| フェーズ | 状態 | 版 |
|---|---|---|
| P0 土台（freshdig_core.js・テスト・build_userscript） | 済 | 1.9.1 |
| P1 診断ログ・同期1回・API上限・ロボット確認で止まる・途中で飛ばさない | 済（実機の Edge では未確認） | 1.9.2 |
| P2 スキップ（行列の先読み除去＋一気に飛ぶ） | 済（実機では未確認） | 1.9.3 |
| P3 タブとミニプレイヤー（R4・R9） | 済（実機の Edge では未確認） | 1.9.4 |
| P4 言語（R2）**次** / P5 リスト（R3・R6）/ P6 フレッシュ（R10）/ 出す | 未 | |

## 分かったこと
- 音が止まる不具合（R7）: ユーザーの観察では「シークバーは進んでいる。次の曲に飛ばしても無音。ページ再読み込みで直る」。計画書の H4（音量・消音・音声経路）寄り。診断ログはまだ無い。**ログが来るまで推測の修正はしない。** ログで見るもの: `audio-volumechange`（vol/muted）、`freshdig-set-volume`、`tab-visibility`、`audio-error`。疑う場所: `HTMLMediaElement.prototype.play` の差し替え（音量モジュールが無い時の代わり処理）、`setSoundCloudVolume`、`restoreVolumePrecisionOnce`。
- SoundCloud の再生管理モジュール（`playNext` / `getCurrentSound` / `removeItem` を持つもの。内蔵ブラウザで確認）: `getQueue().models` に曲が並び、各要素の `.sound.attributes` に曲の全情報（作者の `followers_count`・`playback_count`・`created_at` 含む）が最初から入っている。`removeItem(item)`（今の曲以外）で外せ、`setCurrentItem(item, opts)` で行列内の好きな曲へ直接移れる。→ R10 は追加の API 呼び出し無しで判定できる。
- Node 22 では `node --test tests/` が動かない。`node --test "tests/*.test.js"`。
- 内蔵ブラウザからは SoundCloud の CSP のため localhost のスクリプトを読み込めない。実機確認はユーザーの Edge（展開して読み込む）で。

## ユーザーの決定
- 別アカウントに切り替えたら「🔄 同期」を 1 回押す形でよい。
- P2 は先読み除去＋一気に飛ぶ方式で進めてよい。

## 次にやること
1. P3: R4（BroadcastChannel でミニプレイヤーを「音を出しているタブ」に合わせる。`fdBus` は station_hook.js に作ってある）と R9（ボタンを曲名欄の外へ）。R9 は先に再現してスクリーンショット。
2. 各フェーズの終わり: `node --check`、`node --test "tests/*.test.js"`、版を上げる（4 か所。`.user.js` は `node tools/build_userscript.js`）、コミット、ユーザーへ短く報告。

## P3 でやったこと（1.9.4）
- R9: 内蔵ブラウザで曲名欄（`.playbackSoundBadge__actions`）に 6 ボタンを足すと、曲名の欄の幅が 136px → 0 になるのを確認（仮説どおり）。ボタンは `.playControls__elements` の音量の隣に作った専用の枠 `#sc-fresh-station-bar` へ移した。常時は 👎 🚫 ➕ と「⋯」、🔍 📻 🪟 は「⋯」のメニュー（`#sc-fresh-station-menu`）。R6 の 🎧 はメニューへ足す。
- R4: 音を出しているタブが 0.5 秒ごとに `fdBus` で `now`（曲・状態・位置・音量）を流す（`broadcastNow` / `localSnapshot`）。ミニプレイヤーは `mpCurrentData()` で「自分が再生中なら自分、でなければ最後に流してきたタブ」を写す。ボタン操作は `MP_ACTIONS` に集め、別タブのときは `cmd` で送り、`cmd-ack`（1.5 秒で来なければ表示を自分に戻す）と `cmd-toast` で返事。タブを閉じると `bye`。
- 別タブ経由のとき、➕の選択ダイアログ（右クリック）は音を出しているタブのページ側に出る。
