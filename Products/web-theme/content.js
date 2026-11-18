// Gắn theme vào trang ngay khi trang bắt đầu tải (document_start) để không nhá màu gốc, và đổi theo ngay khi người dùng
// chọn theme khác trong popup (storage.onChanged), không cần tải lại trang.
(() => {
  const h = location.hostname;
  const SITE = /(^|\.)youtube\.com$/.test(h) ? 'youtube'
    : /(^|\.)facebook\.com$/.test(h) ? 'facebook'
    : /^www\.google\.com(\.vn)?$/.test(h) ? 'google' : null;
  if (!SITE) return;

  const { DEFAULTS, FONT_FILES, resolve, css } = globalThis.VeltrixThemes;
  const html = document.documentElement;
  let style = null;

  // ---- Font: nạp bằng FontFace API (dữ liệu font do sw.js gửi sang). @font-face trỏ tới chrome-extension:// bị CSP của trang
  // (Facebook, YouTube) chặn nên đổi font không ăn (lỗi người dùng báo 2026-11-19); FontFace từ ArrayBuffer không qua CSP.
  const loadedFonts = new Map(); // tên font → Promise
  function loadFont(name) {
    const faces = FONT_FILES?.[name];
    if (!faces) return Promise.resolve();
    if (!loadedFonts.has(name)) {
      loadedFonts.set(name, Promise.all(faces.map(async (f) => {
        // Nhờ service worker (sw.js) đọc file: tự fetch chrome-extension:// từ trang YouTube bị Chrome chặn.
        const res = await chrome.runtime.sendMessage({ type: 'font', file: f.file });
        if (!res?.b64) return;
        const buf = Uint8Array.from(atob(res.b64), (ch) => ch.charCodeAt(0)).buffer;
        const face = new FontFace(name, buf, { weight: f.weight, unicodeRange: f.range, display: 'swap' });
        document.fonts.add(await face.load());
      })).catch(() => {}));
    }
    return loadedFonts.get(name);
  }

  // ---- Chế độ sáng / tối của chính trang: ép theo theme. Theme chỉ đổi được phần trang dùng biến màu; phần còn lại giữ màu
  // gốc của trang. Nếu trang đang tối mà theme sáng (hoặc ngược lại) thì phần đó ra chữ tối trên nền tối khi rê chuột,
  // chỗ đổi chỗ không (lỗi 2026-11-19). Ép cùng chế độ thì phần chưa đổi vẫn cùng tông, đọc được.
  const original = SITE === 'youtube'
    ? { dark: html.hasAttribute('dark'), darker: html.hasAttribute('darker-dark-theme') }
    : SITE === 'facebook' ? { dark: html.classList.contains('__fb-dark-mode'), light: html.classList.contains('__fb-light-mode') } : null;
  let wantDark = null; // null = không ép (theme tắt)
  let enforcing = false;
  function enforceMode() {
    if (wantDark === null || enforcing) return;
    enforcing = true;
    if (SITE === 'youtube') {
      html.toggleAttribute('dark', wantDark);
      html.toggleAttribute('darker-dark-theme', wantDark);
    } else if (SITE === 'facebook') {
      html.classList.toggle('__fb-dark-mode', wantDark);
      html.classList.toggle('__fb-light-mode', !wantDark);
    }
    enforcing = false;
  }
  function restoreMode() {
    wantDark = null;
    if (SITE === 'youtube') {
      html.toggleAttribute('dark', original.dark);
      html.toggleAttribute('darker-dark-theme', original.darker);
    } else if (SITE === 'facebook') {
      html.classList.toggle('__fb-dark-mode', original.dark);
      html.classList.toggle('__fb-light-mode', original.light);
    }
  }
  // Trang tự đặt lại chế độ của nó (lúc tải, khi chuyển trang trong YouTube…): ép lại.
  if (original) new MutationObserver(enforceMode).observe(html, { attributes: true, attributeFilter: ['dark', 'darker-dark-theme', 'class'] });

  // ---- Video nền: khung bg.html của extension phủ kín phía sau trang (bg.html tự đọc video từ IndexedDB và phát).
  let videoFrame = null;
  function setVideo(on, theme) {
    if (!on) { videoFrame?.remove(); videoFrame = null; return; }
    if (!videoFrame) {
      videoFrame = document.createElement('iframe');
      videoFrame.id = 'veltrix-bg-video';
      videoFrame.src = chrome.runtime.getURL('bg.html');
      videoFrame.setAttribute('aria-hidden', 'true');
      videoFrame.tabIndex = -1;
    }
    const b = theme?.bgBlur ?? 0; // làm mờ video: tràn ra ngoài để mép mờ không lộ viền
    videoFrame.style.cssText = `all:initial;position:fixed;top:-${b * 2}px;left:-${b * 2}px;width:calc(100vw + ${b * 4}px);height:calc(100vh + ${b * 4}px);border:0;z-index:-1;pointer-events:none;filter:${b ? `blur(${b}px)` : 'none'};`;
    if (!videoFrame.isConnected) html.appendChild(videoFrame);
  }

  function apply(saved) {
    const s = { ...DEFAULTS, ...saved, sites: { ...DEFAULTS.sites, ...(saved?.sites || {}) } };
    if (!s.enabled || !s.sites[SITE]) {
      style?.remove();
      setVideo(false);
      smartOn = false; resetSmart();
      clearOn = false; resetClear();
      if (original && wantDark !== null) restoreMode();
      return;
    }
    const theme = resolve(s);
    loadFont(theme.font);
    if (original) { wantDark = Boolean(theme.dark); enforceMode(); }
    if (!style) {
      style = document.createElement('style');
      style.id = 'veltrix-theme';
    }
    style.textContent = css(SITE, theme);
    smartOn = true; resetSmart(); setTimeout(scheduleFix, 300);
    const wantClear = Boolean(theme.hasBgImage);
    if (wantClear !== clearOn) { clearOn = wantClear; resetClear(); }
    if (clearOn) { setTimeout(clearCovers, 300); setTimeout(clearCovers, 1500); }
    setVideo(theme.background === 'video', theme);
    // Gắn vào <html> (lúc document_start chưa có <head>); đặt cuối để thắng CSS của trang khi cùng độ ưu tiên.
    if (style !== html.lastElementChild) html.appendChild(style);
  }

  // ---- Chữ thông minh: đo màu chữ + màu nền THẬT của nút / chip / nhãn trên trang; dưới 3:1 thì đổi chữ sang đen / trắng
  // (bên nào tương phản cao hơn). Bắt cả chỗ trang tô màu cứng mà biến màu của theme không chạm tới (vd nút Đăng ký ở Shorts).
  const SMART = 'button,[role="button"],a.yt-spec-button-shape-next,.yt-spec-button-shape-next,tp-yt-paper-button,yt-chip-cloud-chip-renderer,.ytChipShapeChip,.badge,[class*="badge"],[role="tab"],[role="menuitem"]';
  const parseRgb = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const relLum = ({ r, g, b }) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  function bgOf(el) { // nền đặc gần nhất (bỏ qua lớp trong suốt)
    for (let e = el, n = 0; e && e.nodeType === 1 && n < 6; e = e.parentElement, n++) {
      const c = parseRgb(getComputedStyle(e).backgroundColor);
      if (c && c.a >= 0.6) return c;
    }
    return null;
  }
  let smartOn = false, queued = false;
  function fixContrast(root = document) {
    if (!smartOn) return;
    for (const el of root.querySelectorAll(SMART)) {
      if (el.dataset.vxInk === 'done') continue;
      const bg = bgOf(el); if (!bg) continue;
      const fg = parseRgb(getComputedStyle(el).color); if (!fg) continue;
      const lb = relLum(bg);
      if (ratio(relLum(fg), lb) >= 3) { el.dataset.vxInk = 'done'; continue; }
      const ink = ratio(0, lb) >= ratio(1, lb) ? '#111111' : '#ffffff';
      el.style.setProperty('color', ink, 'important');
      el.style.setProperty('fill', ink, 'important');
      el.querySelectorAll('*').forEach((k) => { k.style.setProperty('color', 'inherit', 'important'); });
      el.dataset.vxInk = 'done';
    }
  }
  function scheduleFix() {
    if (!smartOn || queued) return;
    queued = true;
    (window.requestIdleCallback || setTimeout)(() => { queued = false; fixContrast(); }, { timeout: 500 });
  }
  function resetSmart() { // đổi theme: đo lại từ đầu
    document.querySelectorAll('[data-vx-ink]').forEach((el) => {
      el.style.removeProperty('color'); el.style.removeProperty('fill'); delete el.dataset.vxInk;
      el.querySelectorAll('*').forEach((k) => k.style.removeProperty('color'));
    });
  }
  new MutationObserver(scheduleFix).observe(document.documentElement, { childList: true, subtree: true });

  // ---- Khung che nền: khi có ảnh / video nền, mọi khung RỘNG GẦN HẾT MÀN HÌNH mà nền đặc (trang xem video, Shorts… YouTube
  // có nhiều khung riêng, hay đổi tên → chặn theo tên luôn sót, lỗi "lớp màn đen" 2026-11-19) thì làm trong suốt.
  // Chừa trình phát video và các khung nổi (menu, hộp thoại).
  const KEEP = '#movie_player,.html5-video-player,ytd-player,#player,#player-container,#player-container-inner,video,canvas,[role="dialog"],[role="menu"],tp-yt-iron-dropdown,ytd-popup-container,#veltrix-bg-video';
  let clearOn = false, clearQueued = false;
  function clearCovers() {
    if (!clearOn) return;
    const vw = innerWidth, vh = innerHeight;
    const walk = (el, depth) => {
      if (depth > 9) return;
      for (const k of el.children) {
        if (k.id === 'veltrix-theme' || k.matches(KEEP)) continue;
        const r = k.getBoundingClientRect();
        if (r.width < vw * 0.6 || r.height < vh * 0.4) continue; // khung nhỏ (thẻ video, nút…) giữ nguyên
        const bg = parseRgb(getComputedStyle(k).backgroundColor);
        if (bg && bg.a > 0.05 && k.dataset.vxClear !== '1') {
          k.style.setProperty('background-color', 'transparent', 'important');
          k.style.setProperty('background-image', 'none', 'important');
          k.dataset.vxClear = '1';
        }
        // Nền vẽ ở ::before / ::after (không sửa được bằng style của phần tử): đánh dấu để CSS của theme làm trong suốt
        for (const pseudo of ['before', 'after']) {
          const cs = getComputedStyle(k, '::' + pseudo);
          if (cs.content === 'none') continue;
          const pb = parseRgb(cs.backgroundColor);
          if ((pb && pb.a > 0.05) || cs.backgroundImage !== 'none') k.setAttribute('data-vx-clear-' + pseudo, '');
        }
        walk(k, depth + 1);
      }
    };
    if (document.body) walk(document.body, 0);
  }
  function scheduleClear() {
    if (!clearOn || clearQueued) return;
    clearQueued = true;
    setTimeout(() => { clearQueued = false; clearCovers(); }, 250);
  }
  function resetClear() {
    document.querySelectorAll('[data-vx-clear]').forEach((el) => {
      el.style.removeProperty('background-color'); el.style.removeProperty('background-image'); delete el.dataset.vxClear;
    });
    document.querySelectorAll('[data-vx-clear-before],[data-vx-clear-after]').forEach((el) => { el.removeAttribute('data-vx-clear-before'); el.removeAttribute('data-vx-clear-after'); });
  }
  new MutationObserver(scheduleClear).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', scheduleClear);
  addEventListener('yt-navigate-finish', () => { setTimeout(clearCovers, 300); setTimeout(clearCovers, 1500); });

  const load = () => chrome.storage.local.get(null).then(apply).catch(() => {});
  load();
  chrome.storage.onChanged.addListener((_, area) => { if (area === 'local') load(); });
  // Trang tự chèn thêm CSS vào cuối <html> sau khi tải: đẩy theme xuống cuối lại một lần khi trang sẵn sàng.
  document.addEventListener('DOMContentLoaded', load, { once: true });
})();
