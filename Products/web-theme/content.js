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
    // Xem trước video: theo công tắc riêng, chạy cả khi tắt theme màu
    pv.on = Boolean(s.preview) && s.sites.youtube !== false;
    pv.delay = Math.min(5, Math.max(1, Number(s.previewDelay) || 3));
    pv.effect = s.previewEffect === 'zoom' ? 'zoom' : 'spin';
    if (!pv.on) closePreview();
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

  // ---- Xem trước video (YouTube): rê chuột lên thumbnail đủ N giây → khung nổi bay từ thumbnail ra giữa màn hình (xoay 3D
  // hoặc chỉ phóng to) và phát bản nhúng tắt tiếng. Không dùng preview có sẵn của YouTube: nó dính vào thumbnail, rời chuột là
  // tắt. Rời khung / bấm ra ngoài / Esc → thu về chỗ cũ rồi đóng. Mỗi lúc chỉ 1 khung (trình phát nhúng tốn ~50–100 MB).
  const pv = { on: false, delay: 3, effect: 'spin' };
  let pvTimer = 0, pvBox = null, pvClosing = false, pvAudio = null;
  const videoOf = (a) => {
    try {
      const u = new URL(a.href, location.href);
      if (u.pathname === '/watch') return { id: u.searchParams.get('v'), short: false };
      const m = u.pathname.match(/^\/shorts\/([\w-]{6,})/);
      return m ? { id: m[1], short: true } : null;
    } catch { return null; }
  };
  const thumbAt = (el) => {
    const a = el?.closest?.('a[href*="/watch?v="],a[href^="/shorts/"],a[href*="youtube.com/shorts/"]');
    return a && a.querySelector('img') && !a.closest('#movie_player') ? a : null;
  };
  function closePreview() {
    if (!pvBox || pvClosing) return;
    pvClosing = true;
    const { host, card, from } = pvBox;
    const anim = card.animate([{ transform: 'none', opacity: 1 }, { transform: from, opacity: 0.2 }], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' });
    host.shadowRoot.querySelector('.dim').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: 'forwards' });
    anim.onfinish = () => { host.remove(); pvBox = null; pvClosing = false; pvAudio?.ac.close().catch(() => {}); pvAudio = null; };
  }
  function openPreview(a) {
    const v = videoOf(a);
    if (!v?.id || pvBox) return;
    const r = a.getBoundingClientRect();
    if (!r.width) return;
    const vw = innerWidth, vh = innerHeight;
    const ratio = v.short ? 9 / 16 : 16 / 9;
    const w = Math.min(vw * 0.7, vh * 0.72 * ratio), h = w / ratio;
    const left = (vw - w) / 2, top = (vh - h) / 2;
    const from = `translate(${r.left - left}px,${r.top - top}px) scale(${r.width / w},${r.height / h})`;
    const host = document.createElement('veltrix-preview');
    host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483646;';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      .dim{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px)}
      .wrap{position:fixed;inset:0;perspective:1600px;pointer-events:none}
      .card{position:fixed;left:${left}px;top:${top}px;width:${w}px;height:${h}px;border-radius:16px;overflow:hidden;background:#000;
        box-shadow:0 30px 90px rgba(0,0,0,.6);pointer-events:auto;transform-origin:50% 50%}
      iframe{width:100%;height:100%;border:0;display:block}
      .bar{position:absolute;right:10px;top:10px;display:flex;gap:8px}
      button{all:unset;cursor:pointer;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.65);color:#fff;font:600 13px system-ui,sans-serif}
      button:hover{background:rgba(0,0,0,.85)}</style>
      <div class="dim"></div><div class="wrap"><div class="card">
        <iframe allow="autoplay; encrypted-media; picture-in-picture" src="https://www.youtube.com/embed/${v.id}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1"></iframe>
        <div class="bar"><button class="snd" type="button">🔊 Bật tiếng</button><button class="go" type="button">Mở video ↗</button><button class="x" type="button" aria-label="Đóng">✕</button></div>
      </div></div>`;
    document.documentElement.appendChild(host);
    const card = root.querySelector('.card');
    const dim = root.querySelector('.dim');
    pvBox = { host, card, from };
    const frames = pv.effect === 'spin'
      ? [{ transform: `${from} rotateY(0deg)`, opacity: 0.6 }, { transform: 'scale(.85) rotateY(300deg)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }]
      : [{ transform: from, opacity: 0.6 }, { transform: 'none', opacity: 1 }];
    // Chỉ tính "rời khung" sau khi khung bay xong VÀ người dùng đã đưa chuột vào: lúc khung bay từ thumbnail ra giữa, con trỏ
    // đứng yên nên bị tính là rời khung → đóng ngay (lỗi khi thử 2026-11-19).
    let armed = false, entered = false;
    card.animate(frames, { duration: pv.effect === 'spin' ? 800 : 380, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => { armed = true; };
    dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    dim.addEventListener('click', closePreview);
    root.querySelector('.x').addEventListener('click', closePreview);
    root.querySelector('.go').addEventListener('click', () => { location.href = a.href; });
    // Trình phát nhúng có thể bị YouTube từ chối (vd "Mã lỗi 152-4" trên trình duyệt người dùng 2026-11-19, cả bản nocookie).
    // Khi đó mở CHÍNH TRANG XEM của YouTube (/watch, /shorts) trong khung: cùng nguồn youtube.com nên được nhúng và điều khiển
    // được DOM; ẩn hết giao diện, chỉ chừa trình phát. Nặng hơn (~150–300 MB khi mở) nên chỉ dùng khi nhúng lỗi; nhớ theo tab.
    const frame = root.querySelector('iframe');
    card.style.background = `#000 url("${a.querySelector('img')?.src || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}") center/cover no-repeat`;
    let watchTimer = 0;
    function startWatchMode() {
      try { sessionStorage.setItem('vxPreviewWatch', '1'); } catch { /* bỏ qua */ }
      frame.style.opacity = '0'; // hiện thumbnail trong lúc trang trong khung tải
      frame.removeAttribute('allow');
      frame.src = v.short ? `/shorts/${v.id}` : `/watch?v=${v.id}`;
      let n = 0;
      clearInterval(watchTimer);
      watchTimer = setInterval(() => {
        if (!host.isConnected) { clearInterval(watchTimer); return; }
        const doc = frame.contentDocument;
        if (!doc?.documentElement) return;
        if (!doc.getElementById('vx-only-player')) {
          const st = doc.createElement('style');
          st.id = 'vx-only-player';
          st.textContent = `html,body{background:#000!important;overflow:hidden!important}
            body *{visibility:hidden!important}
            #movie_player,#movie_player *,#shorts-player,#shorts-player *{visibility:visible!important}
            #movie_player,#shorts-player{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;z-index:2147483647!important;border-radius:0!important;transform:none!important}
            #movie_player video,#shorts-player video{width:100vw!important;height:100vh!important;left:0!important;top:0!important;object-fit:contain!important}`;
          doc.documentElement.appendChild(st);
        }
        const vid = doc.querySelector('#movie_player video, #shorts-player video');
        if (vid) {
          if (!vid.dataset.vx) {
            vid.dataset.vx = '1';
            // Tắt tiếng ở ĐƯỜNG RA (Web Audio, gain 0) thay vì video.muted: YouTube ghi đè muted, và có thể lưu "tắt tiếng" vào
            // cài đặt âm lượng của người dùng → video mở bình thường sau đó cũng câm. Nút "Bật tiếng" chỉ mở gain.
            try {
              const ac = new AudioContext();
              const gain = ac.createGain(); gain.gain.value = 0;
              ac.createMediaElementSource(vid).connect(gain).connect(ac.destination);
              pvAudio = { ac, gain };
            } catch { pvAudio = null; }
            frame.contentWindow.dispatchEvent(new Event('resize'));
          }
          if (!vid.paused && vid.currentTime > 0) { frame.style.opacity = '1'; }
          else vid.play?.().catch(() => {});
        }
        if (++n > 60 && frame.style.opacity === '0') { clearInterval(watchTimer); showFallback(); } // 15 giây vẫn chưa phát
      }, 250);
    }
    // Nút bật tiếng: chế độ trang xem → bỏ tắt tiếng thẳng trên <video>; chế độ nhúng → lệnh của API nhúng.
    root.querySelector('.snd').onclick = (e) => {
      const vid = frame.isConnected && frame.contentDocument?.querySelector?.('#movie_player video, #shorts-player video');
      if (vid && pvAudio) { pvAudio.ac.resume(); pvAudio.gain.gain.value = 1; }
      else if (vid) vid.muted = false;
      else frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
      e.currentTarget.remove();
    };
    let useWatch = false;
    try { useWatch = sessionStorage.getItem('vxPreviewWatch') === '1'; } catch { /* bỏ qua */ }
    if (useWatch) startWatchMode();
    else {
      // API nhúng chính thức (enablejsapi=1): gửi "listening" khi khung tải xong, trình phát trả onError khi bị từ chối.
      const onMsg = (e) => {
        if (e.source !== frame.contentWindow || typeof e.data !== 'string') return;
        let d; try { d = JSON.parse(e.data); } catch { return; }
        if (d?.event !== 'onError') return;
        removeEventListener('message', onMsg);
        startWatchMode();
      };
      addEventListener('message', onMsg);
      const ping = () => frame.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
      frame.addEventListener('load', ping, { once: true });
      // Dự phòng: trang lỗi của trình phát nhúng cùng nguồn → đọc được .ytp-error ngay cả khi không có onError
      let k = 0;
      const probe = setInterval(() => {
        if (!host.isConnected || ++k > 32 || frame.src.includes('/watch') || frame.src.includes('/shorts/')) { clearInterval(probe); return; }
        let bad = false;
        try { bad = Boolean(frame.contentDocument?.querySelector('.ytp-error')); } catch { /* bỏ qua */ }
        if (bad) { clearInterval(probe); removeEventListener('message', onMsg); startWatchMode(); }
      }, 250);
    }
    function showFallback() {
      const img = a.querySelector('img')?.src || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
      frame.replaceWith(Object.assign(document.createElement('div'), { className: 'fb' }));
      const fb = root.querySelector('.fb');
      fb.style.cssText = `width:100%;height:100%;background:#000 url("${img}") center/cover no-repeat;display:grid;place-items:end start`;
      const note = document.createElement('span');
      note.textContent = 'Không phát được bản xem trước, bấm "Mở video ↗" để xem';
      note.style.cssText = 'margin:14px;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.7);color:#fff;font:600 13px system-ui,sans-serif';
      fb.appendChild(note);
      root.querySelector('.snd')?.remove();
    }
    let leaveT = 0; // lướt qua mép khung chưa đóng ngay
    card.addEventListener('pointerenter', () => { clearTimeout(leaveT); if (armed) entered = true; });
    card.addEventListener('pointermove', () => { if (armed) entered = true; });
    card.addEventListener('pointerleave', () => { if (armed && entered) leaveT = setTimeout(closePreview, 450); });
  }
  if (SITE === 'youtube') {
    let hoverA = null;
    document.addEventListener('pointerover', (e) => {
      if (!pv.on || pvBox) return;
      const a = thumbAt(e.target);
      if (a === hoverA) return;
      clearTimeout(pvTimer);
      hoverA = a;
      if (a) pvTimer = setTimeout(() => { if (hoverA === a) openPreview(a); }, pv.delay * 1000);
    }, true);
    document.addEventListener('pointerout', (e) => {
      if (hoverA && !hoverA.contains(e.relatedTarget)) { clearTimeout(pvTimer); hoverA = null; }
    }, true);
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closePreview(); });
    addEventListener('yt-navigate-start', closePreview);
  }

  const load = () => chrome.storage.local.get(null).then(apply).catch(() => {});
  load();
  chrome.storage.onChanged.addListener((_, area) => { if (area === 'local') load(); });
  // Trang tự chèn thêm CSS vào cuối <html> sau khi tải: đẩy theme xuống cuối lại một lần khi trang sẵn sàng.
  document.addEventListener('DOMContentLoaded', load, { once: true });
})();
