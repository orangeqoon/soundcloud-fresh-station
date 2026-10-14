# FreshDig v2.1 F1 レビュー依頼（画面の小物）

- 計画書: `docs/PLAN-v2.1.md`
- 担当: Antigravity
- 版: `2.1.0`（4箇所すべて同期済み）
- 検査結果: `node --check` 0件エラー、`node --test tests/*.test.js` 24/24 PASS、`check_layout.ps1` PASS

---

## 1. 実施内容

### ① 国旗アイコン・言語セレクタ刷新 (1 国旗)
- **背景**: Windows の Segoe UI Emoji は国旗絵文字（🇯🇵🇺🇸🇩🇪🇷🇺）を描画できず、国コード（JP, US）等のテキストにフォールバックされる問題。
- **実装**:
  - `icons/flags/{auto,jp,us,de,ru}.svg` を自作の軽量 SVG として新設。
  - `popup.html` の `<select id="lang-select">` を廃止し、ボタングループ `<div class="lang-flags" id="lang-flags">` に刷新。
  - `popup.js` に `setActiveFlag(lang)` を追加し、選択中言語の枠線ハイライト（`.active`）とストレージ同期を実装。

### ② 構造化バグレポート JSON ダウンロード (2 バグレポート JSON)
- **背景**: 診断ログを Dig Config の奥から出し、ユーザーがワンクリックでダウンロードフォルダに JSON 保存できるようにする。
- **実装**:
  - `popup.html` の Dig Config 内から `#btn-copy-log` を撤去し、ポップアップ最下部（ステータスバー下）に `#btn-download-report` を新設。
  - `station_hook.js` の `GET_DIAG_LOG` でテキストだけでなく構造化配列 `entries`（`getDiagLogEntries()`）と統計 `stats` を返すよう拡張。
  - `popup.js` 側で `{ schema: 1, version, createdAt, browser, page, settings, stats, entries }` の構造化 JSON を構築し、Blob + `<a download="freshdig-report-YYYYMMDD-HHMMSS.json">` で自動ダウンロード保存（`downloads` 権限不使用）。
  - トークン・Cookie などの機微情報は一切含めない安全なサニタイズ設定を徹底。

### ③ ミニプレイヤー Dig ボタン刷新 & ボタン再配置・有効/無効スタイル統一 (3 Dig ボタン)
- **背景**:
  - 「Discovery」表記を「Dig」へ統一し、文字を拡大。OFF 時は紫枠で囲む。
  - アイコン位置の整理（上段にサブアクション、下段にコントロールを統一）。
  - 有効・無効時の色彩表現の統一（有効時は中を鮮やかに塗りつぶし、無効時は四角の中を背景色と同じ暗色にして少し薄くトーンダウン）。
- **実装**:
  - **ボタン再配置**:
    - 上段 (`badge-row`): `[Dig ON/OFF]` `[🧐 後で聴く]` `[👤 Follow]` `[🤬 出禁]` `[📻 Station]` を一列に集約（旧 `top-actions` を撤去）。
    - 下段 (`controls-row`): `[⏮]` `[⏯]` `[⏭️]` `[🤍]` `[🔁]` `[➕ プレイリスト追加]` の 6 ボタン均等配置に再編成。
  - **色彩ルールの統一**:
    - **有効時 (Active)**: 中をソリッド塗りつぶし（白文字 `#fff`）。
      - `mp-like`: 赤ベタ塗り (`#ff3344`)
      - `mp-repost`: 緑ベタ塗り (`#00c853`)
      - `mp-pl`: 追加済みで緑ベタ塗り (`#00c853`)
      - `mp-follow`: フォロー中で緑ベタ塗り (`#00c853`)
      - `mp-hate`: 出禁で赤ベタ塗り (`#e53935`)
      - `mp-later`: 保存済みで紫ベタ塗り (`#7e57c2`)
      - `mp-play`: 再生中はオレンジベタ塗り (`#ff5500`)
    - **無効時 (Inactive)**: 中は背景色と同じ（`#222`）で塗りつぶさず、各テーマ色の控えめな枠線＋落ち着いたアイコン色で統一。
    - **Dig ボタン**: ON は橙枠（`border: 1px solid #ff5500`）、OFF は指示通り紫枠（`border: 1px solid #a259ff`）。中は背景色と同じ。
  - `i18n.js` の 4 言語辞書（ja, en, de, ru）の `m_stOn` / `m_stOff` を「Dig ON / Dig OFF」（de: Dig AN / Dig AUS, ru: Dig ВКЛ / Dig ВЫКЛ）に更新。

### ④ レビュー依頼 100 NoPlay トリガー (4 レビュー依頼 100 NoPlay)
- **背景**: 累計 100 曲の NoPlay を記録したヘビーユーザーに対して、スヌーズ・非表示済みであっても 1 度だけ再オファーする。
- **実装**:
  - `station_hook.js` の `handleDislikeClick()` で NoPlay 登録時に `recordStat('totalNoPlays')` をインクリメント。
  - `getStats()` のデフォルトに `totalNoPlays: 0` を追加。
  - `popup.js` の `checkRatingPrompt(stats)` で `totalNoPlays >= 100` かつ `!stored.rate100Shown` の場合にバナーを表示し、`rate100Shown: true` を永続化。

---

## 2. 変更ファイル一覧

- `icons/flags/auto.svg` (新設)
- `icons/flags/jp.svg` (新設)
- `icons/flags/us.svg` (新設)
- `icons/flags/de.svg` (新設)
- `icons/flags/ru.svg` (新設)
- `manifest.json` (v2.1.0)
- `popup.html` (v2.1.0, 国旗ボタン群, 最下部レポート保存ボタン)
- `popup.js` (国旗切替, レポートJSON保存, 100 NoPlay レビュー判定)
- `station_hook.js` (v2.1.0, getDiagLogEntries, DigボタンCSS, recordStat('totalNoPlays'))
- `i18n.js` (4言語: btnDownloadReport, reportSaved, reportFailed, Dig ON/OFF)
- `soundcloud_fresh_station.user.js` (ビルド再生成 v2.1.0)
- `tests/smoke.test.js` (GET_DIAG_LOG entries/stats 検証, 国旗 SVG 存在検証追加)
- `docs/PLAN-v2.1.md` (F1 進捗更新)
- `.gitignore` (`__pycache__/` 追加)

---

## 3. レビュー確認のお願い
F1 のすべての実装が完了し、テストもパスしています。
レビューおよびご確認よろしくお願いいたします。
