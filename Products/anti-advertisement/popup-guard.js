// Chặn tab quảng cáo bật lên (popunder): web phim / truyện hay gắn script "bấm đâu cũng mở tab quảng cáo".
// Chạy trong chính trang (world MAIN) để bọc window.open. Mạng popunder đổi tên miền liên tục nên không chặn theo danh sách
// được (vd yanhh3d.blog dùng pd.warkedmalie.com, chưa có trong EasyList / ABPVN 2026-11-18) → chặn theo HÀNH VI:
//  1. window.open sang trang KHÁC mà người dùng không bấm vào đúng một link tới trang đó → chặn.
//  2. Script tự "bấm hộ" link target=_blank sang trang khác (click giả, isTrusted = false) → chặn.
//  3. Link trong suốt phủ kín trình phát / trang (bẫy bấm) mở sang trang khác → chặn.
// Mỗi lần chặn hiện thông báo nhỏ có nút "Vẫn mở". Trang đã tắt chặn quảng cáo thì content.js báo tắt luôn phần này.
(() => {
  if (window.__veltrixPopupGuard) return;
  window.__veltrixPopupGuard = true;

  // content.js (world riêng) đặt <html data-veltrix-popup-guard="off"> khi trang được phép quảng cáo / tắt chặn mọi trang.
  // Dùng thuộc tính DOM vì dữ liệu kèm sự kiện không đi qua được giữa hai world.
  let enabled = true;
  window.addEventListener('veltrix:popup-guard', () => {
    enabled = document.documentElement.dataset.veltrixPopupGuard !== 'off';
  });

  // Tên miền gốc (vd m.shein.com → shein.com, abc.com.vn → abc.com.vn) để so "cùng trang" hay "trang khác".
  const SLD = new Set(['com', 'net', 'org', 'edu', 'gov', 'co', 'ac', 'info', 'biz', 'name', 'pro', 'int', 'health', 'ne', 'or', 'go']);
  const siteOf = (host) => {
    const p = host.toLowerCase().replace(/\.$/, '').split('.');
    if (p.length <= 2) return p.join('.');
    const n = p[p.length - 1].length === 2 && SLD.has(p[p.length - 2]) ? 3 : 2;
    return p.slice(-n).join('.');
  };
  // Đăng nhập / thanh toán / chia sẻ hay mở cửa sổ riêng: luôn cho mở.
  const TRUSTED = new Set([
    'google.com', 'youtube.com', 'facebook.com', 'messenger.com', 'instagram.com', 'apple.com', 'microsoft.com', 'microsoftonline.com',
    'live.com', 'github.com', 'twitter.com', 'x.com', 'linkedin.com', 'discord.com', 'tiktok.com', 'zalo.me', 'zaloapp.com',
    'paypal.com', 'stripe.com', 'momo.vn', 'vnpay.vn', 'zalopay.vn', 'shopeepay.vn', 'napas.com.vn',
  ]);
  const here = () => siteOf(location.hostname);
  const targetSite = (url) => {
    try {
      const u = new URL(url, location.href);
      if (!/^https?:$/.test(u.protocol)) return null; // about:blank, javascript:, blob:… → không xét
      return siteOf(u.hostname);
    } catch { return null; }
  };
  const isForeign = (url) => {
    const s = targetSite(url);
    return Boolean(s) && s !== here() && !TRUSTED.has(s);
  };

  // Lần bấm thật gần nhất của người dùng: bấm vào link nào (nếu có).
  let lastClick = { t: -1e9, href: null };
  window.addEventListener('click', (e) => {
    if (!e.isTrusted) return;
    const a = e.target?.closest?.('a[href]');
    lastClick = { t: performance.now(), href: a ? a.href : null };
  }, true);

  // ---- Thông báo "đã chặn" (shadow DOM để CSS của trang không làm vỡ) ----
  let toastHost = null, toastTimer = 0, blockedCount = 0;
  const realOpen = window.open;
  function notify(url) {
    if (window.top !== window) { // trong khung con: nhờ khung chính hiện thông báo
      try { window.top.postMessage({ veltrixPopupBlocked: String(url) }, '*'); } catch { /* bỏ qua */ }
      return;
    }
    blockedCount++;
    if (!document.body) return;
    if (!toastHost) {
      toastHost = document.createElement('veltrix-popup-toast');
      toastHost.style.cssText = 'all:initial;position:fixed;z-index:2147483647;right:16px;bottom:16px;';
      const root = toastHost.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>
        .t{display:flex;align-items:center;gap:10px;max-width:min(380px,calc(100vw - 32px));padding:10px 12px 10px 14px;border-radius:12px;
          background:#1c1c24;color:#f2f2f7;font:13px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35)}
        .d{width:8px;height:8px;border-radius:50%;background:#a78bfa;flex-shrink:0}
        .m{flex:1}.m small{display:block;color:#a1a1b5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px}
        button{all:unset;cursor:pointer;padding:5px 10px;border-radius:8px;font-weight:600;color:#c4b5fd}
        button:hover{background:rgba(255,255,255,.08)} .x{color:#a1a1b5;padding:5px 8px}</style>
        <div class="t" role="status"><span class="d"></span><span class="m"><b></b><small></small></span>
        <button class="o" type="button">Vẫn mở</button><button class="x" type="button" aria-label="Đóng">✕</button></div>`;
      root.querySelector('.x').addEventListener('click', () => toastHost.remove());
      root.querySelector('.o').addEventListener('click', () => {
        toastHost.remove();
        realOpen.call(window, toastHost.dataset.url, '_blank', 'noopener');
      });
    }
    const root = toastHost.shadowRoot;
    root.querySelector('b').textContent = blockedCount > 1 ? `Veltrix đã chặn ${blockedCount} tab quảng cáo bật lên` : 'Veltrix đã chặn 1 tab quảng cáo bật lên';
    let shown = url; try { shown = new URL(url, location.href).hostname; } catch { /* giữ nguyên */ }
    root.querySelector('small').textContent = shown;
    toastHost.dataset.url = url;
    if (!toastHost.isConnected) document.documentElement.appendChild(toastHost);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastHost.remove(), 6000);
  }
  if (window.top === window) {
    window.addEventListener('message', (e) => { if (e.data && typeof e.data.veltrixPopupBlocked === 'string') notify(e.data.veltrixPopupBlocked); });
  }

  // Mạng popunder (vd pd.warkedmalie.com trên yanhh3d.blog, đọc mã 2026-11-18) né lớp bọc bằng 4 mánh, bịt cả 4:
  //  a. Function.prototype.toString.call(window.open) để xem có còn "[native code]" → giả toString cho mọi hàm bọc.
  //  b. Tạo iframe about:blank rồi gọi iframe.contentWindow.open "sạch" → bọc luôn window.open của iframe cùng nguồn.
  //  c. window.open('about:blank') rồi mới đổi địa chỉ tab đó → background.js đóng tab nếu nó chuyển sang trang khác.
  //  d. <form target="_blank"> + form.submit() → bọc HTMLFormElement.submit / requestSubmit.
  const disguised = new WeakMap(); // hàm bọc → hàm gốc (để toString trả về mã gốc)
  const nativeToString = Function.prototype.toString;
  const fakeToString = function () { return nativeToString.call(disguised.get(this) ?? this); };
  disguised.set(fakeToString, nativeToString);
  try { Object.defineProperty(Function.prototype, 'toString', { value: fakeToString, writable: true, configurable: true }); } catch { /* bỏ qua */ }

  const userClickedLinkTo = (url) => performance.now() - lastClick.t < 1500 && lastClick.href && targetSite(lastClick.href) === targetSite(url);

  // ---- 1. window.open (của trang và của mọi iframe cùng nguồn) ----
  function guardWindow(w) {
    try {
      if (!w || w.__veltrixGuarded) return;
      const orig = w.open;
      const guarded = function (url, ...rest) {
        if (enabled && url != null && isForeign(String(url)) && !userClickedLinkTo(String(url))) {
          notify(String(new URL(String(url), location.href)));
          return null;
        }
        return orig.call(this, url, ...rest);
      };
      disguised.set(guarded, orig);
      Object.defineProperty(w, 'open', { value: guarded, writable: true, configurable: true });
      Object.defineProperty(w, '__veltrixGuarded', { value: true });
    } catch { /* iframe khác nguồn: không đụng được, cũng không lấy được open của nó */ }
  }
  guardWindow(window); // realOpen (dùng cho nút "Vẫn mở") đã lấy bản gốc ở phần thông báo phía trên

  // iframe.contentWindow / contentDocument: bọc window.open của iframe trước khi trả về cho script.
  for (const prop of ['contentWindow', 'contentDocument']) {
    const d = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, prop);
    if (!d?.get) continue;
    const get = function () {
      const v = d.get.call(this);
      guardWindow(prop === 'contentWindow' ? v : v?.defaultView);
      return v;
    };
    disguised.set(get, d.get);
    Object.defineProperty(HTMLIFrameElement.prototype, prop, { ...d, get });
  }

  // ---- 1b. form.submit() mở tab mới sang trang khác ----
  const opensNewTab = (t) => Boolean(t) && !['_self', '_top', '_parent'].includes(t.toLowerCase());
  for (const name of ['submit', 'requestSubmit']) {
    const orig = HTMLFormElement.prototype[name];
    if (typeof orig !== 'function') continue;
    const guarded = function (...a) {
      if (enabled && opensNewTab(this.target) && isForeign(this.action) && !userClickedLinkTo(this.action)) {
        notify(this.action);
        return undefined;
      }
      return orig.apply(this, a);
    };
    disguised.set(guarded, orig);
    Object.defineProperty(HTMLFormElement.prototype, name, { value: guarded, writable: true, configurable: true });
  }

  // ---- 2 + 3. Link target=_blank: bấm giả, hoặc bẫy bấm trong suốt ----
  const coversScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.width * r.height > window.innerWidth * window.innerHeight * 0.3;
  };
  const looksInvisible = (el) => {
    const cs = getComputedStyle(el);
    return Number(cs.opacity) < 0.1 || (!el.textContent.trim() && !el.querySelector('img,video,svg,picture'));
  };
  window.addEventListener('click', (e) => {
    if (!enabled) return;
    const a = e.target?.closest?.('a[href]');
    if (!a || !isForeign(a.href)) return;
    const newTab = (a.target && a.target !== '_self' && a.target !== '_top' && a.target !== '_parent');
    const trap = coversScreen(a) && looksInvisible(a);
    if ((!e.isTrusted && newTab) || trap) {
      e.preventDefault();
      e.stopImmediatePropagation();
      notify(a.href);
    }
  }, true);
})();
