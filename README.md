# FreshDig for SoundCloud

FreshDigは、SoundCloudのステーション再生を整理するEdge / Chrome拡張機能です。いいね済み、フォロー中、または自分で除外した曲や作者をDigモードでスキップし、気になった作者をその場で保存できます。

## 解決する問題

ステーションを聴いていると、知っている曲や避けたい作者が繰り返し混ざることがあります。FreshDigは、SoundCloud上の曲情報とFreshDigのローカル設定を使って、次に進める曲を選びます。

## 主な機能

- **Digモード**：いいね済み、フォロー中、除外済みの曲や作者、ジャンルを検知してスキップ
- **一度でも聴いた曲を飛ばす**：Dig設定でオンにした場合だけ、実際に10秒再生した曲を記録して次回からスキップ（初期状態はオフ）
- **Dislike / Hate**：曲単位または作者単位で除外
- **後で聴く人リスト**：作者を保存し、拡張機能のアイコンから作者のトラックページを開く
- **ミニプレイヤー**：別ウィンドウで再生、次へ、音量、プレイリスト追加、Like、Repost、Follow、除外を操作
- **リストのバックアップ**：後で聴く人・不再生の曲・作者除外・ジャンル除外の4リストをMarkdownで書き出し、JSONから復元
- **不具合レポート**：再生停止などを調べるためのローカル診断レポートを保存

## 「一度でも聴いた曲を飛ばす」の記録方法

この設定は初期状態ではオフです。オンにすると、再生位置が実際に10秒進んだ曲だけを曲ID単位で記録します。シークや一時停止だけでは記録しません。記録はページ側のIndexedDBに保存し、利用できない場合はlocalStorageへフォールバックします。作者のトラックページを直接開いているときは、そのページの再生を優先してDigのスキップ判定を適用しません。

## データとプライバシー

FreshDigの設定、リスト、聞いた曲の記録はブラウザ内に保存されます。FreshDig独自の分析サーバーや広告用の外部送信は行いません。Like、Follow、Repost、プレイリスト追加などの操作では、SoundCloudアカウントを操作するためSoundCloudとの通信が発生します。

## インストール

1. `edge://extensions` または `chrome://extensions` を開く
2. 開発者モードを有効にする
3. 「展開して読み込む」で拡張機能フォルダーを選ぶ

Tampermonkeyでは、リポジトリの `soundcloud_fresh_station.user.js` を読み込めます。

## ライセンス

MIT License

## Giới thiệu bằng tiếng Việt

FreshDig là tiện ích Edge / Chrome giúp sắp xếp việc phát station trên SoundCloud. Dig mode tự bỏ qua bài hát đã thích, nghệ sĩ đang theo dõi và các mục bạn đã loại trừ, đồng thời cho phép lưu nghệ sĩ để nghe sau.

### Tính năng chính

- Dig mode bỏ qua bài hát, nghệ sĩ và thể loại đã loại trừ
- Tùy chọn bỏ qua bài đã nghe một lần: mặc định tắt; khi bật, ghi nhận sau 10 giây phát thực tế
- Dislike cho một bài hát và Hate cho toàn bộ nghệ sĩ
- Danh sách nghệ sĩ để nghe sau, mở từ biểu tượng tiện ích
- Mini player riêng để phát, chuyển bài, chỉnh âm lượng, Like, Repost, Follow và thêm playlist
- Xuất bốn danh sách sang Markdown và nhập bản sao lưu JSON
- Lưu báo cáo chẩn đoán cục bộ khi cần kiểm tra lỗi phát

Cài đặt, danh sách và lịch sử bài đã nghe được lưu trong trình duyệt. FreshDig không sử dụng máy chủ phân tích riêng. Các thao tác tài khoản như Like, Follow, Repost và thêm playlist vẫn được gửi tới SoundCloud.

