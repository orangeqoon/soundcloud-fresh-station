# Sonnet への引き継ぎ（FreshDig v2.0）

新しいチャットで、モデルを Sonnet にして、下の枠の中をそのまま貼る。

```
FreshDig（SoundCloud 用のブラウザ拡張）の v2.0 を実装してください。

作業フォルダ: C:\scripts\browser_extensions\soundcloud_fresh_station
（C:\scripts のサブモジュール。独自リポジトリ、ブランチ main）

最初に読む順番:
1. C:\scripts\browser_extensions\soundcloud_fresh_station\CLAUDE.md（決まり）
2. 同じフォルダの CLAUDE_REVIEW_GUIDE.md（作りとデータの置き場所）
3. 同じフォルダの docs\PLAN-v2.0.md（Opus が書いた計画書。これが正本）

進め方:
- 計画書のフェーズ P0 → P1 → … → 出す、の順に 1 つずつ。各フェーズの終わりに
  「node --check 全ファイル」「node --test tests/」を通してから、このサブモジュールの main にコミット
  （push はしない。最後にまとめて私に聞く）。
- 作業を始める前に C:\scripts\docs\current-status.md に「FreshDig v2.0（Sonnet）」と宣言する。
- P2（スキップを速くする）は、SoundCloud の再生待ち行列を調べた結果を先に私に報告してから作る。
- P1 の後で、私が診断ログを取って渡します（音が止まる不具合の原因はそれを見てから直す）。
- ロボット確認を自動で突破・回避する仕組みは作らない。出にくくする・出たら止まって知らせる、だけ。
- manifest の権限を増やす必要が出たら、止めて私に聞く。
- 同じ不具合を 2 回直して直らなければ、止めて Opus に相談する。
- 返事は日本語で、むずかしい言葉を使わずに。

各フェーズが終わるたびに、次の形で短く報告:
- やったこと（計画書の番号 R1 など）
- 確かめたこと（テストの結果、画面で試したこと）
- 計画書と違うことをした所と理由
- 私に聞きたいこと
```
