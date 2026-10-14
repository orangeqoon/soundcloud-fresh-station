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

### ③ ミニプレイヤー Dig ボタン刷新 (3 Dig ボタン)
- **背景**: 「Discovery」表記を「Dig」へ統一し、ボタンサイズを拡大。OFF 時は視認性の高い紫枠に変更。
- **実装**:
  - `i18n.js` の 4 言語辞書（ja, en, de, ru）の `m_stOn` / `m_stOff` を「Dig ON / Dig OFF」（de: Dig AN / Dig AUS, ru: Dig ВКЛ / Dig ВЫКЛ）に更新。
  - `station_hook.js` の `.status-badge` を 10px / padding 3px 8px / font-weight 600 に拡大。
  - `.status-badge.off` を紫枠（`border-color: #a259ff; background: rgba(162, 89, 255, 0.15); color: #d4a5ff;`）に変更。350×195px のミニプレイヤー枠内に美しく収まることを確認。

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
