# Veltrix Chặn Quảng Cáo (extension Chrome / Edge)

Chặn quảng cáo, banner, popup và tab quảng cáo tự bật lên trên web. Thương hiệu: **Veltrix Store** (https://extension.veltrixhost.cloud). Dùng danh sách lọc công khai **EasyList** (quốc tế) + **ABPVN** (web Việt).

## Cài
1. Mở `chrome://extensions` (Edge: `edge://extensions`), bật **Chế độ nhà phát triển**.
2. **Tải tiện ích đã giải nén** → chọn thư mục `Products/anti-advertisement`.
3. Ghim biểu tượng lên thanh công cụ: số trên biểu tượng = số quảng cáo đã chặn trên trang.

## Dùng
- Bấm biểu tượng: xem số quảng cáo đã chặn, **tắt chặn trên trang này** (trang bị lỗi khi chặn), hoặc **tạm tắt chặn mọi trang**.

## Cách hoạt động
- **Chặn tải** (`rules/ads.json`, `rules/ads_more.json`): luật `declarativeNetRequest`, Chrome tự chặn trước khi tải.
  Bộ chính ≤ 29.000 luật (Chrome bảo đảm chạy), bộ thêm dùng phần sức chứa dư chung của trình duyệt.
  Thứ tự ưu tiên: luật cho phép → tên miền quảng cáo lớn (`CORE_AD_DOMAINS`) → chặn hẳn tên miền quảng cáo → ABPVN → luật theo đường dẫn → luật riêng từng trang.
- **Ẩn khung quảng cáo còn sót** (`cosmetic.json`): content script lấy CSS theo tên miền từ background và tự gắn vào trang ngay khi trang bắt đầu tải.
- **Chặn tab bật lên** (`popup-guard.js`, chạy trong trang): mạng popunder đổi tên miền liên tục nên chặn theo hành vi —
  `window.open` sang trang khác mà người dùng không bấm đúng link tới trang đó, script tự bấm hộ link `target=_blank`, lớp link
  trong suốt phủ kín trang. Mỗi lần chặn hiện thông báo có nút "Vẫn mở". Đăng nhập / thanh toán phổ biến (Google, Facebook,
  PayPal, MoMo…) luôn được mở. Lưới an toàn ở background: tab vừa bật lên trỏ tới tên miền quảng cáo đã biết thì đóng.
- **Tắt theo trang**: luật động `allowAllRequests` cho tên miền đó + không gắn CSS ẩn.

## Cập nhật danh sách lọc
```
node scripts/build-rules.mjs   # tải EasyList + ABPVN mới nhất, dựng lại luật
node scripts/check-rules.mjs   # nạp thử vào Edge chạy ngầm; luật Chrome từ chối thì ghi vào scripts/bad.json, dựng lại, lặp
```
Rồi bấm ↻ ở extension trong `chrome://extensions`.

## Giới hạn
- Không chặn được quảng cáo chèn thẳng vào video YouTube (YouTube đổi cách chèn liên tục; chặn cũng trái điều khoản YouTube).
- Luật dùng tính năng Chrome không có (regex, `$redirect`, `$removeparam`, `:has-text`...) bị bỏ qua.

## Số quảng cáo đã chặn lưu trong trang
Mỗi trang tự lưu vào **localStorage của chính trang đó**, khóa `veltrixAdblock`:
```json
{ "thisVisit": 12, "total": 340, "visits": 28, "site": "vnexpress.net", "updatedAt": "2026-11-17T15:59:07Z" }
```
- `thisVisit`: số quảng cáo bị chặn trong lần mở trang này; `total`: cộng dồn mọi lần mở; `visits`: số lần mở.
- Ghi khi trang tải xong, sau 5 / 15 / 35 giây (quảng cáo tải dần) và khi rời trang. Bảng nhỏ của extension hiện tổng này.
- Số lấy từ `getMatchedRules` của Chrome (hỏi chung mọi tab, tối đa 1 lần / 30 giây vì Chrome giới hạn ~20 lần / 10 phút), cộng `onRuleMatchedDebug` khi có.
