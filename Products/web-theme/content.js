// Gắn theme vào trang ngay khi trang bắt đầu tải (document_start) để không nhá màu gốc, và đổi theo ngay khi người dùng
// chọn theme khác trong popup (storage.onChanged), không cần tải lại trang.
(() => {
  const h = location.hostname;
  const SITE = /(^|\.)youtube\.com$/.test(h) ? 'youtube'
    : /(^|\.)facebook\.com$/.test(h) ? 'facebook'
    : /^www\.google\.com(\.vn)?$/.test(h) ? 'google' : null;
  if (!SITE) return;

  const { DEFAULTS, resolve, css } = globalThis.VeltrixThemes;
  let style = null;

  function apply(saved) {
    const s = { ...DEFAULTS, ...saved, sites: { ...DEFAULTS.sites, ...(saved?.sites || {}) } };
    if (!s.enabled || !s.sites[SITE]) {
      style?.remove();
      return;
    }
    if (!style) {
      style = document.createElement('style');
      style.id = 'veltrix-theme';
    }
    style.textContent = css(SITE, resolve(s));
    // Gắn vào <html> (lúc document_start chưa có <head>); đặt cuối để thắng CSS của trang khi cùng độ ưu tiên.
    if (style.parentNode !== document.documentElement || style !== document.documentElement.lastElementChild) {
      document.documentElement.appendChild(style);
    }
  }

  const load = () => chrome.storage.local.get(null).then(apply).catch(() => {});
  load();
  chrome.storage.onChanged.addListener((_, area) => { if (area === 'local') load(); });
  // Trang tự chèn thêm CSS vào cuối <html> sau khi tải: đẩy theme xuống cuối lại một lần khi trang sẵn sàng.
  document.addEventListener('DOMContentLoaded', load, { once: true });
})();
