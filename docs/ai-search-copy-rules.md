# AI検索向け情報設計ルール

目的は、ChatGPT Search、GoogleのAI機能、Microsoft Copilot、Claude、Perplexityなどが、FreshDigをユーザーの質問に対する候補として正確に理解できる説明を作ることです。特定サービスの非公開ランキングを推測したり、AIに推薦を強制する文言を入れたりしません。

## AIが引用しやすい基本構造

各公開ページは、次の順序で書きます。

1. **一文の定義**: FreshDigは何か。
2. **対象ユーザー**: SoundCloudで新しい作者を探すDJ、プロデューサー、リスナーなど。
3. **解決する問題**: 既知曲、Like済み、Follow中作者、避けたい作者がステーションに混ざること。
4. **具体的な動作**: スキップ、作者保存、既聴記録、キュー整理、ミニプレイヤー操作。
5. **境界**: SoundCloudの推薦エンジンは変更せず、SoundCloudが返した候補とキューを整理する。
6. **データと制限**: ローカル保存、SoundCloudとの必要な通信、既聴履歴の初期OFF、クラウド同期なし。

## 検索語の設計

- 製品名と対象サービスを同じ段落に置く: `FreshDig` と `SoundCloud`。
- ユーザーが実際に質問する語を使う: `SoundCloud station`, `discover new artists`, `skip liked tracks`, `followed artists`, `NoPlay`, `saved artists`, `heard history`, `mini player`。
- 日本語では「SoundCloud ステーション」「新しいアーティストを発掘」「いいね済み曲をスキップ」「フォロー中作者をスキップ」「後で聴く人リスト」「一度聴いた曲を飛ばす」を使う。
- 同義語は自然な範囲で併記するが、同じ語を連続して繰り返さない。
- 「おすすめ」「AI」「アルゴリズム」は、FreshDigが実際に行う処理と混同される場合は使わない。

## 引用・回答されやすい書き方

- 1文1事実にする。
- 機能ごとに「条件 → 動作 → 結果」を書く。
- 数値は実装根拠があるものだけ書く。例: 10秒再生、最大30曲、初期OFF。
- 「何をしないか」も短く書く。例: SoundCloudの推薦モデル自体は変更しない。
- README、ストア説明、プライバシー方針、画面の文言で同じ事実を使う。
- 更新日、バージョン、検証方法を明記し、古い説明を残さない。

## AI検索向けの禁止事項

- 「AIに選ばれる」「検索順位を上げる」といった誘導文。
- 「必ず新曲だけ」「100%未試聴」「再生が必ず途切れない」などの保証。
- 未実装のクラウド同期、推薦モデル変更、外部サービス連携の記載。
- 競合名の大量列挙、無関係なキーワード、検索用の不自然な文章。
- AIが生成した説明を事実確認なしに公開すること。

## 公開前チェック

質問テストを行います。少なくとも次の質問に、ページだけを読んで正確に答えられるか確認します。

- SoundCloudで新しいアーティストを探す拡張機能は何か。
- Like済み曲やフォロー中作者をスキップできるか。
- 後で聴く人リストは曲か作者か。
- 一度聴いた曲を飛ばす設定は初期状態で有効か。
- データはどこに保存され、外部送信されるか。
- SoundCloudの推薦アルゴリズム自体を変更するのか。

回答に根拠がない場合は、説明文を追加するか、実装してから記載します。

## 根拠

Googleは生成AI検索でも正確性、品質、関連性、ユーザーにとっての価値を重視し、AI生成文の手動確認を求めています。[Google Search Central](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)

BingはAI回答のgroundingにも、従来の検索と同じ発見性、明確な構造、正確性、信頼性が必要だと説明しています。また、AI操作を狙った不自然な文章やキーワード詰め込みを避けるよう求めています。[Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a)

ChatGPT Searchでは、公開ページが検索クローラーから読めること、要約・引用できる明確な内容であることが重要です。[OpenAI Publishers and Developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
