# FreshDig v2.1 計画（phased-project・計画: Opus 2026-10-14）

決まりは `CLAUDE.md`（版を 4 か所・`.user.js` は生成・`ack` 必須・API は `scApi`/`apiFetch` のみ 等）。この計画はその上に乗る。

## 目的
ユーザーが挙げた 9 件を直す・足す。1 件ずつ、各件の終わりにユーザーが Edge（展開して読み込む）で確かめられる形にする。

## ユーザーが決めたこと（蒸し返さない）
- 国旗は絵だけ（文字なし）。Windows は国旗の絵文字を描けないので、拡張機能に入れた画像で出す。
- バグレポートは Dig Config から出してポップアップの一番下へ。押すとダウンロードフォルダへ保存。形式は AI が読みやすい JSON。
- ミニプレイヤーの「Discovery」は「Dig」にし、ボタンを大きく。**OFF のときは紫の枠で囲む**（ON は今の橙の枠）。
- レビュー依頼は今の条件に加えて、**NoPlay（⏭️ ボタン）が 100 曲たまったら**もう一度出す。
- リポストの症状: **ミニプレイヤー上ではリポスト済みの表示になるが、SoundCloud 上では実際にはリポストされていない。**
- 初回だけ使い方の説明を 3 画面（1 画面 1 機能）出し、3 つ見たら使える。
- ノーマライズは「できるなら入れる」。方法は下の設計 8 の A を先に（初期値オフ）。

## 今のコード（調べた結果）
| 件 | 今の作り | 場所 |
|---|---|---|
| リポスト | 🔁 → `showRepostCaptionDialog` → `MP_ACTIONS.repost` → `repostTrackWithCaption` → `scApi('me/track_reposts/'+id, {method:'PUT'})`。キャプションは**曲へのコメント**（`POST tracks/:id/comments`）。`apiFetch` は止められているとき偽の応答を返す。状態は `state.repostedTrackIds` | station_hook.js:3464, 3472, 3541-3558, 4139, 4195, 4446, 465 |
| 国旗 | 言語の `<select>` の `<option>` に 🌐🇯🇵🇺🇸🇩🇪🇷🇺 | popup.html:318-322 |
| バグレポート | `#btn-copy-log` が `<details id="advanced-details">` の中。`GET_DIAG_LOG` → `getDiagLogText()` → クリップボード | popup.html:414-417, popup.js:316-325, station_hook.js:381-390, 690 |
| レビュー依頼 | `checkRatingPrompt(stats)`。`totalSkips>=30 \|\| totalPlaylistAdds>=5`。`hasRated`/`rateDismissed`/`rateSnoozeUntil` | popup.js:585-643, popup.html:329-337, station_hook.js:2427-2437 |
| スキップ | 理由: Disliked/Hated/Genre/Own/Liked/Following ＋鮮度 4 種（初期オフ）＋DOM のいいね判定。名前で一致、表は普通の `{}` | freshdig_core.js:17, 38-72, station_hook.js:1352, 1377, 1428, 1486-1491, 1551, 1688-1694, 2622, 2672 |
| 眠り | Document PiP（`openMiniPlayer`）。命令は `fdBus`（BroadcastChannel）→ 1.5 秒で返事が無ければ `m_tabNoReply`。`mpUseRemote` は止まっているタブを期限なしで使い続ける。眠り対策なし | station_hook.js:3612, 4158, 4260, 4336, 4361-4371, 4405 |
| 音量 | `setSoundCloudVolume`。Web Audio 未使用 | station_hook.js:2911, 3008, 3018 |
| ミニプレイヤーの段 | `#mp-status`（`m_stOn`/`m_stOff`/`m_stFollow`）、CSS `.status-badge`（ON 橙）・`.off`（灰） | station_hook.js:3772-3808, 4097-4106, 4575-4582, i18n.js:167-169, 408-410 |
| 初回 | 無い | — |

## 設計（ざっくり。細部は実行役が決めてよい）
1. **国旗**: `icons/flags/{jp,us,de,ru}.svg`（自作の単純な図形でよい。外部から取らない）。`<select>` を、絵のボタンが並ぶ自作の選択に替える（🌐 自動は残す）。選んだ値の保存は今と同じ所。
2. **バグレポート**: ボタンをポップアップ最下部へ。`GET_DIAG_LOG` に構造化した形も返させ、ポップアップで `Blob` → `<a download>` で `freshdig-report-YYYYMMDD-HHMMSS.json`。中身 `{schema:1, version, createdAt, browser, page, settings, stats, entries:[{t, tab, type, detail}]}`。トークン・Cookie は入れない。`downloads` 権限は足さない。
3. **Dig ボタン**: 文言を 4 言語で「Dig ON / Dig OFF」系に。`.status-badge` の文字と高さを大きく。`.off` を紫の枠（例 `#a259ff`）に。ミニプレイヤーが 350×195 なので段があふれないか確かめる。
4. **レビュー依頼**: NoPlay ボタンを押すたびに `recordStat('totalNoPlays')`。`totalNoPlays>=100` で表示。`hasRated` なら出さない。`rateDismissed`・スヌーズ中でも 100 到達時に 1 回だけ出す（`rate100Shown` で記録）。
5. **飛ばされる件**: 先にログを増やす（auto-skip・queue-prune に曲名・作者名・作者 ID・理由・当たった規則のキー）。表の参照を `Object.hasOwn` にして `constructor` 等の誤一致を直す（確かな不具合）。ジャンルの表も掃除の対象に。名前だけの除外が別人に当たる件は、ID がある記録では ID を優先して名前一致をしない。ほかはログを見てから。
6. **リポスト**: 表示が「済み」なのに実際は無い → 成功判定が偽の応答・別タブ・楽観的な表示更新のどれかを疑う。SoundCloud 本体のリポストボタンを押したときの通信（内蔵ブラウザかユーザーの開発者ツール）と比べて、送り先・方法・本文を合わせる。成功は応答の中身で判定し、PUT の後に `me/track_reposts/ids` を取り直して本当に入ったか確かめてから表示を変える。キャプションは SoundCloud と同じ形に直す（コメント投稿をやめる。形は通信を見て決める）。repost の結果を診断ログへ。
7. **眠り**: background.js で SoundCloud のタブに `chrome.tabs.update(id,{autoDiscardable:false})`。`mpUseRemote` は止まっているタブの心拍が一定時間（例 30 秒）来なければ自分のタブを使う。返事が無いときは background 経由でそのタブを起こして送り直す（方法は実行役が試して決める）。
8. **ノーマライズ A**: 曲の `waveform_url` の JSON から大きさ（例 上位の平均）を見積もり、目標に合わせた倍率を曲ごとにかける（ユーザーの音量 × 倍率、上限あり）。`setSoundCloudVolume` を通す。設定はポップアップに 1 つ（初期オフ）。波形が取れない・CORS で止まるときは何もしない。B（Web Audio）はやらない。
9. **初回の説明**: `chrome.storage.local.onboardingDone` が無いとき、ポップアップに 3 画面（次へ・3 枚目で「始める」）。文言は 4 言語。中身は下の「質問」の答えで決める。

## フェーズ
| フェーズ | 中身 | 大きさ |
|---|---|---|
| F1 画面の小物 | 1 国旗(S)・2 バグレポート(M)・3 Dig ボタン(S)・4 レビュー依頼(S) | popup.html, popup.js, station_hook.js, i18n.js, icons/flags/ |
| F2 不具合 | 5 飛ばされる件(M)・6 リポスト(M)・7 眠り(M) | station_hook.js, freshdig_core.js, background.js, tests/ |
| F3 新機能 | 8 ノーマライズ A(L)・9 初回の説明(M) | station_hook.js, popup.*, i18n.js |

F2 の 6 は F1 の 2（JSON 保存）を使ってユーザーから記録をもらえる。順番を崩さない。

## 進み具合
| 件 | フェーズ | 状態 | コミット | メモ |
|---|---|---|---|---|
| 1 国旗 | F1 | 済 | 943089b | icons/flags/*.svg 5種、ポップアップ言語切替ボタン群UI |
| 2 バグレポート JSON | F1 | 済 | 943089b | ポップアップ最下部に配置、構造化JSON自動ダウンロード（Blob） |
| 3 Dig ボタン | F1 | 済 | 943089b | ミニプレイヤーDig ON/OFF文言・サイズ拡大・OFF時紫枠(#a259ff) |
| 4 レビュー依頼 100 NoPlay | F1 | 済 | 943089b | totalNoPlays>=100到達時にスヌーズ中でも1度だけ再表示 |
| 5 飛ばされる件 | F2 | 未 | | |
| 6 リポスト | F2 | 未 | | |
| 7 眠り | F2 | 未 | | |
| 8 ノーマライズ A | F3 | 未 | | |
| 9 初回の説明 | F3 | 未 | | |

## 未決の質問（フェーズごと）
- F1: バグレポートのクリップボードへのコピーも残すか（決まっていなければ残さない）。
- F2: 6 で SoundCloud 本体の通信を見るため、ユーザーに開発者ツールで 1 回リポストしてもらう必要があるかもしれない（必要になったら聞く）。
- F3（9）: 決定済み（2026-10-14）: 「一度流れた曲は二度と流さない」機能は**足さない**。説明の 1 枚目は下の答えの言い方（いいね済み・フォロー中の作者の曲を飛ばし、まだ出会っていない作者の曲だけ流す）にする。2・3 枚目は計画どおり（NoPlay/🤬 で好みを教える、➕ とミニプレイヤー）。

### 質問 9 への答え（Opus）
今の FreshDig は**聞いた曲を記録していない**。「聞いたことがない」とは判断していない。飛ばしているのは「いいね済み・フォロー中の作者・自分の曲・NoPlay/🤬 した曲と作者・除外したジャンル」と、オンにしたときだけ鮮度フィルタ（人気すぎる・古すぎる）。
そのため説明の 1 枚目は「いいね済みやフォロー中の作者の曲を自動で飛ばし、まだ出会っていない作者の曲だけ流す」と書くのが正しい。
「一度流れた曲を二度と流さない」を本当にやるなら、聞いた曲の ID を記録する規則を新しく足す（F3 に 1 件追加、M）。足すかはユーザーが決める。

## 実行役（Sonnet）への始めの言葉
```
/phased-project
C:\scripts\browser_extensions\soundcloud_fresh_station\docs\PLAN-v2.1.md の次のフェーズを進めて。
```
各件の終わり: `for f in *.js tools/*.js tests/*.js; do node --check "$f"; done`、`node --test "tests/*.test.js"`、版を 4 か所上げる、`node tools/build_userscript.js`、コミット（このフォルダのリポジトリ）。1-2 件ごとに上の表を更新。フェーズの終わりに `docs/reviews/F<n>-request.md` を書いて Opus に 1 回見てもらう。
