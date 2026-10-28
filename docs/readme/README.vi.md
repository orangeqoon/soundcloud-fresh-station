# FreshDig for SoundCloud

> 🌐 [日本語](../../README.md) | [English](README.en.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md)

FreshDig là tiện ích Chrome và Edge dành cho người nghe, DJ và nhà sản xuất muốn khám phá nghệ sĩ mới qua station SoundCloud. Dig áp dụng quy tắc của bạn lên các ứng viên và hàng đợi do SoundCloud cung cấp.

## Vấn đề được giải quyết

Khi nghe station, những bài đã biết hoặc nghệ sĩ muốn tránh cứ lặp lại. FreshDig dùng thông tin bài hát trên SoundCloud và cài đặt cục bộ của FreshDig để chọn bài tiếp theo.

## Tính năng chính

- **Dig mode**: phát hiện và bỏ qua bài hát, nghệ sĩ, thể loại đã thích, đang theo dõi hoặc đã loại trừ
- **Bỏ qua bài đã nghe một lần**: chỉ khi bật trong cài đặt Dig; ghi nhận bài đã thực sự phát 10 giây và bỏ qua lần sau (mặc định tắt)
- **Dislike / Hate**: loại trừ một bài hát hoặc toàn bộ nghệ sĩ
- **Danh sách nghe sau**: lưu nghệ sĩ và mở trang bài hát của họ từ biểu tượng tiện ích
- **Mini player**: cửa sổ riêng để phát, chuyển bài, chỉnh âm lượng, thêm playlist, Like, Repost, Follow và loại trừ
- **Sao lưu danh sách**: xuất bốn danh sách (nghe sau, bài bị chặn, nghệ sĩ bị chặn, thể loại bị chặn) sang Markdown và khôi phục từ JSON
- **Báo cáo lỗi**: lưu báo cáo chẩn đoán cục bộ để kiểm tra lỗi dừng phát

## Cách ghi nhận bài đã nghe

Cài đặt này mặc định tắt. Khi bật, chỉ những bài có vị trí phát thực sự tiến 10 giây mới được ghi theo ID. Chỉ tua hoặc tạm dừng thì không được ghi. Dữ liệu lưu trong IndexedDB của trang, nếu không dùng được thì lưu vào localStorage. Khi mở trực tiếp trang bài hát của nghệ sĩ, việc phát trên trang đó được ưu tiên và quy tắc bỏ qua của Dig không áp dụng.

## Dữ liệu và quyền riêng tư

Cài đặt, danh sách và lịch sử nghe của FreshDig được lưu trong trình duyệt. FreshDig không có máy chủ phân tích riêng và không gửi dữ liệu cho quảng cáo. Các thao tác như Like, Follow, Repost và thêm playlist điều khiển tài khoản SoundCloud của bạn nên sẽ giao tiếp với SoundCloud.

## Cài đặt

1. Mở `edge://extensions` hoặc `chrome://extensions`
2. Bật chế độ nhà phát triển
3. Chọn "Tải tiện ích đã giải nén" và chọn thư mục tiện ích

Với Tampermonkey, bạn có thể tải `soundcloud_fresh_station.user.js` từ kho mã.

## Giấy phép

MIT License
