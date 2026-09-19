# FreshDig for SoundCloud (Edge / Chrome Extension)

[![Edge Add-ons](https://img.shields.io/badge/Microsoft%20Edge-Add--ons-0078D7?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons)
[![Version](https://img.shields.io/badge/version-1.4.0-orange.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**知っている曲は、もう流さない。まだ出会ったことのない新しいアーティストだけを無限にディグする、SoundCloud専用の発掘アシスタント。**

*Never hear the same track twice. Meet your next favorite artist with FreshDig for SoundCloud.*

---

## 🎧 コンセプト: なぜ FreshDig なのか？

SoundCloudのステーション機能は素晴らしいですが、使っているとこんな悩みにぶつかります：
> 「気づけば過去にいいねした曲ばかり流れてくる…」  
> 「すでにフォローしている有名アーティストの曲がループして、新しい才能に出会えない…」

**FreshDig** は、あなたのライク履歴やフォロー中アーティストを自動判定し、**「あなたがまだ知らない新しいアーティストの曲だけ」** を抽出してエンドレスに流し続ける**発掘（Dig）特化型拡張機能**です。

作業中、ゲーム中、ブラウジング中に、手元で次々と新しいアーティストを発掘できます。

---

## ✨ 主な機能 (Features)

### 1. 🔍 完全未試聴フィルター（Pure Discovery Engine）
- 過去に「いいね（Like）」した曲や、フォロー中のアーティストの曲は1秒で自動スキップ。
- あなたにとって **「100%初めて出会うアーティスト」** だけが流れる専用ステーションに生まれ変わります。
- **マージン付き安全スキップ**: 曲が始まってから1.2秒の安定マージンを待って判定・スキップするため、誤爆やループなしにスムーズに未知曲だけが流れます。

### 2. ⚡ 秒速の選別（Dislike & Hate フィルター）
- **`[ 👎 ]` Dislike**: 「この曲だけ」を二度と流さないよう除外して即座にスキップ。
- **`[ 🚫 ]` Hate**: 「この作者の曲すべて」をブラックリストに入れて即座にスキップ。
- 好みに合わない曲・作者を一瞬で切り捨て、理想の新しい才能に出会う確率を極限まで高めます。

### 3. 💎 出会った瞬間にワンクリック保存
聴いていて「このアーティストいいな！」と思ったら、その場ですぐに収穫：
- **`[ ➕ ]`**: 事前設定したお気に入りプレイリストに一発追加（右クリックで追加先変更）。
- **`[ ❤️ ]`**: いいね（Like）。
- **`[ 🔁 ]`**: リポスト（Repost）。
- **`[ 👤＋ ]`**: アーティストをその場で即フォロー。

### 4. 🪟 浮遊ミニプレイヤー (Picture-in-Picture)
- **常に最前面（Always on Top）**: 仕事やゲーム、ブラウジングをしていても、画面の右下に小さなプレイヤーが常駐。
- アートワークや作者名を確認しながら、**「➕」「❤️」「🔁」「👤フォロー」「👎」** が手元で直感的に操作できます。

### 5. 🎵 Windows タスクバー連携 (Media Session API)
- Windowsタスクバー上のEdgeアイコンにマウスを乗せるだけで、**高解像度アルバムジャケット・曲名・アーティスト名** と共に「前へ・再生・次へ」のウィジェットが出現。
- キーボードのメディアキーやWindowsの音量バーとも連動します。

---

## 🚀 インストール手順 (Installation)

### Microsoft Edge / Google Chrome
1. 本リポジトリの最新ZIPパッケージ、またはクローンしたフォルダを用意します。
2. ブラウザで `edge://extensions` または `chrome://extensions` を開きます。
3. **「開発者モード」** を ON にします。
4. **「展開して読み込む」**（Load unpacked）をクリックし、本フォルダを選択します。

### Tampermonkey をご利用の場合
- `soundcloud_fresh_station.user.js` をTampermonkeyにインポートすることで、同様の機能を利用できます。

---

## 🔒 プライバシーと安全性 (Privacy & Security)
- 全ての設定、除外リスト、再生履歴は**ユーザーのブラウザ内（ローカル）にのみ安全に保存**されます。
- 個人情報や閲覧履歴を外部サーバーへ送信・収集することは一切ありません。

---

## English Overview

**FreshDig for SoundCloud** is the ultimate music discovery engine designed exclusively for digging unplayed tracks from new and underground artists.

### Key Highlights:
- **Pure Discovery**: Automatically skips previously liked tracks and followed artists.
- **Smart Dislike & Hate**: 1-click blacklist for unwanted tracks (`👎`) or entire artists (`🚫`).
- **1-Click Acquisition**: Instantly add tracks to playlists (`➕`), Like (`❤️`), Repost (`🔁`), or Follow (`👤+`).
- **Floating Mini Player (PiP)**: Keep an always-on-top compact player in your screen corner to dig artists while working or gaming.
- **Windows Taskbar Integration**: Control playback and view artwork directly from Windows taskbar thumbnail toolbars.

## License
MIT License
