// Phát video nền trong khung bg.html (content.js đặt khung này phủ kín phía sau trang).
// Đọc video từ kho IndexedDB của extension; vị trí / kiểu phủ theo cài đặt; dừng khi tab ẩn cho đỡ tốn pin.
(() => {
  const v = document.getElementById('v');
  let url = '', videoVersion = null;

  async function sync() {
    const s = await chrome.storage.local.get(['bgX', 'bgY', 'bgFit', 'bgVideoVersion']);
    v.style.objectFit = s.bgFit === 'contain' ? 'contain' : 'cover';
    v.style.objectPosition = `${s.bgX ?? 50}% ${s.bgY ?? 50}%`;
    if (s.bgVideoVersion !== videoVersion) {
      videoVersion = s.bgVideoVersion;
      const blob = await VeltrixVideo.get().catch(() => null);
      if (url) URL.revokeObjectURL(url);
      url = blob ? URL.createObjectURL(blob) : '';
      v.src = url;
      if (url && !document.hidden) v.play().catch(() => {});
    }
  }

  sync();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && ['bgX', 'bgY', 'bgFit', 'bgVideoVersion'].some((k) => k in changes)) sync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) v.pause();
    else if (v.src) v.play().catch(() => {});
  });
})();
