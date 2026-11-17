// Nội dung tĩnh dùng chung giữa các trang.

export const PROMISES = [
  { icon: 'gift', title: 'Miễn phí 100%', text: 'Không quảng cáo, không bản trả phí.' },
  { icon: 'user', title: 'Không cần tài khoản', text: 'Tải về là dùng, không đăng ký.' },
  { icon: 'lock', title: 'Không gửi dữ liệu đi', text: 'Mọi thứ chạy ngay trên máy bạn.' },
  { icon: 'globe', title: 'Tiếng Việt', text: 'Giao diện và hướng dẫn thuần Việt.' }
];

export const REASONS = [
  { icon: 'zap', title: 'Nhẹ và nhanh', text: 'Tiện ích dùng API gốc của trình duyệt (Manifest V3), không chạy nền vô ích, không làm chậm máy.' },
  { icon: 'lock', title: 'Riêng tư', text: 'Không thu thập lịch sử duyệt web, không gửi dữ liệu về máy chủ nào. Cài đặt chỉ lưu trên máy bạn.' },
  { icon: 'code', title: 'Xem được mã nguồn', text: 'File .zip chứa nguyên mã nguồn dễ đọc. Bạn mở ra kiểm tra trước khi cài cũng được.' },
  { icon: 'shield', title: 'Quyền truy cập rõ ràng', text: 'Trang chi tiết liệt kê từng quyền mà tiện ích xin, giải thích bằng tiếng Việt để bạn biết trước khi cài.' },
  { icon: 'globe', title: 'Làm cho người Việt', text: 'Chặn quảng cáo có danh sách lọc riêng cho web Việt. Giao diện tiện ích và hướng dẫn đều bằng tiếng Việt.' },
  { icon: 'refresh', title: 'Bản mới luôn ở đây', text: 'Mọi phiên bản mới đều đăng tại trang này. Số phiên bản và ngày cập nhật ghi rõ ở trang từng tiện ích.' }
];

export const FAQ = [
  {
    q: 'Vì sao không cài từ Chrome Web Store?',
    a: 'Tiện ích Veltrix phát hành dưới dạng file .zip để bạn dùng ngay, không phải chờ xét duyệt. Cách cài chỉ mất khoảng 1 phút và an toàn: bạn xem được toàn bộ mã nguồn trong file.'
  },
  {
    q: 'Báo lỗi “Không tìm thấy tệp kê khai” / “Manifest file is missing”',
    a: 'Bạn chọn sai thư mục. Hãy mở thư mục đã giải nén và chọn đúng thư mục có file manifest.json bên trong (thường phải vào thêm một cấp nữa).'
  },
  {
    q: 'Tôi xóa thư mục giải nén được không?',
    a: 'Không. Trình duyệt chạy tiện ích trực tiếp từ thư mục đó, xóa đi thì tiện ích ngừng hoạt động. Hãy để thư mục ở chỗ cố định.'
  },
  {
    q: 'Tiện ích có tự cập nhật không?',
    a: 'Không, vì cài thủ công. Khi có bản mới, tải file .zip mới, giải nén đè lên thư mục cũ rồi bấm nút tải lại ↻ ở trang Tiện ích của trình duyệt.'
  },
  {
    q: "Tiện ích bị tắt, báo “Chrome can't verify where this extension comes from”",
    a: 'Chrome tự tắt tiện ích cài từ thư mục khi Developer mode / Chế độ nhà phát triển bị tắt. Hãy mở chrome://extensions, bật lại công tắc Developer mode ở góc trên bên phải, rồi bật lại tiện ích. Đừng bấm “Remove all”, nếu không bạn phải cài lại.',
    img: '/guide/faq-developer-off.webp'
  },
  {
    q: 'Trình duyệt hiện thông báo về tiện ích ở chế độ nhà phát triển',
    a: 'Đây là thông báo chung cho mọi tiện ích cài từ thư mục. Bạn cứ đóng thông báo, tiện ích vẫn chạy bình thường.'
  },
  {
    q: 'Có cài được trên điện thoại không?',
    a: 'Chrome và Edge trên điện thoại không hỗ trợ tiện ích. Bạn cần dùng máy tính (Windows, macOS hoặc Linux).'
  }
];
