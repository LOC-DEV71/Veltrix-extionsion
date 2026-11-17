// Chạy sớm nhất có thể trên mỗi trang / khung: lấy CSS ẩn khung quảng cáo từ background rồi tự gắn vào trang (trước khi quảng
// cáo kịp hiện). Gắn vào <html> (lúc document_start chưa có <head>); trang đổi nội dung thì vẫn còn vì nằm ngoài <head>/<body>.
chrome.runtime.sendMessage({ type: 'hide', url: location.href }).then((r) => {
  // Bộ chặn tab bật lên (popup-guard.js) tắt theo: trang được phép quảng cáo hoặc đang tạm tắt chặn mọi trang.
  document.documentElement.dataset.veltrixPopupGuard = r?.ok ? 'on' : 'off';
  window.dispatchEvent(new Event('veltrix:popup-guard'));
  // Background vừa đóng một tab quảng cáo bật lên từ trang này: nhờ popup-guard.js hiện thông báo "Vẫn mở".
  if (window.top === window) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.type === 'popupBlocked') window.postMessage({ veltrixPopupBlocked: String(msg.url) }, '*');
    });
  }
  if (!r?.css) return;
  const style = document.createElement('style');
  style.id = 'veltrix-adblock';
  style.textContent = r.css;
  (document.head || document.documentElement).appendChild(style);
}).catch(() => {});

// Số quảng cáo bị chặn trên trang: lưu vào localStorage CỦA CHÍNH TRANG (khóa "veltrixAdblock"), cộng dồn qua các lần mở
// (người dùng 2026-11-17). Chỉ khung chính ghi (khung con là quảng cáo / nhúng, không phải trang người dùng đang xem).
if (window.top === window) {
  const KEY = 'veltrixAdblock';
  let counted = 0; // số của lần mở này đã cộng vào tổng
  let opened = false;
  const save = async () => {
    let n = 0;
    try { n = (await chrome.runtime.sendMessage({ type: 'count', url: location.href }))?.blocked ?? 0; } catch { return; }
    if (n <= counted && opened) return;
    try {
      const prev = JSON.parse(localStorage.getItem(KEY) || '{}');
      const data = {
        thisVisit: n,
        total: (prev.total ?? 0) + (n - counted),
        visits: (prev.visits ?? 0) + (opened ? 0 : 1),
        site: location.hostname,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      counted = n;
      opened = true;
    } catch { /* trang chặn localStorage (khung sandbox, chế độ riêng tư...): bỏ qua */ }
  };
  // Quảng cáo tải dần: ghi khi tải xong, vài lần sau đó, và lúc rời trang.
  window.addEventListener('load', () => { save(); setTimeout(save, 5000); setTimeout(save, 15000); setTimeout(save, 35000); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
}
