// Điều khiển popup Veltrix Theme: chọn theme, chỉnh font/bo góc/kính mờ/hình nền/mật độ/cỡ chữ, màu nhấn và bật/tắt từng trang.
document.addEventListener('DOMContentLoaded', () => {
  const { THEMES, DEFAULTS, resolve, fontFacesCss, fontStack } = globalThis.VeltrixThemes;

  const enabledInput = document.getElementById('enabled');
  const controls = document.getElementById('controls');
  const themeGrid = document.getElementById('theme-grid');
  const themeNameEl = document.getElementById('theme-name');
  const resetAllBtn = document.getElementById('reset-all');
  const fontSelect = document.getElementById('font-select');
  const radiusBtns = document.querySelectorAll('[data-radius]');
  const densityBtns = document.querySelectorAll('[data-density]');
  const fontScaleInput = document.getElementById('font-scale');
  const fontScaleVal = document.getElementById('font-scale-val');
  const glassToggle = document.getElementById('glass-toggle');
  const hoverToggle = document.getElementById('hover-toggle');
  const blurRange = document.getElementById('blur-range');
  const blurVal = document.getElementById('blur-val');
  const opacityRange = document.getElementById('opacity-range');
  const opacityVal = document.getElementById('opacity-val');
  const bgState = document.getElementById('bg-state');
  const bgFileInput = document.getElementById('bg-file');
  const bgClearBtn = document.getElementById('bg-clear');
  const bgEditor = document.getElementById('bg-editor');
  const bgPreview = document.getElementById('bg-preview');
  const bgFitBtns = document.querySelectorAll('.bg-fit button');
  const bgCenterBtn = document.getElementById('bg-center');
  const bgBlurRange = document.getElementById('bg-blur'), bgBlurVal = document.getElementById('bg-blur-val');
  const bgDimRange = document.getElementById('bg-dim'), bgDimVal = document.getElementById('bg-dim-val');
  // Ô xem trước cùng tỉ lệ màn hình người dùng: phần thấy trong ô = phần hiện trên trang.
  bgPreview.style.aspectRatio = `${screen.width} / ${screen.height}`;
  let shownBg = '';
  const bgVideoInput = document.getElementById('bg-video-file');
  let previewVideo = null, shownVideo = null; // <video> trong ô xem trước khi nền là video
  async function showPreviewVideo(version) {
    if (shownVideo === version && previewVideo) return;
    shownVideo = version;
    const blob = await VeltrixVideo.get().catch(() => null);
    if (!blob) return;
    if (!previewVideo) {
      previewVideo = document.createElement('video');
      Object.assign(previewVideo, { muted: true, loop: true, autoplay: true, playsInline: true });
      previewVideo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      bgPreview.prepend(previewVideo);
    }
    if (previewVideo.src) URL.revokeObjectURL(previewVideo.src);
    previewVideo.src = URL.createObjectURL(blob);
    previewVideo.play().catch(() => {});
  }
  const setPreviewPos = (x, y) => {
    bgPreview.style.backgroundPosition = `${x}% ${y}%`;
    if (previewVideo) previewVideo.style.objectPosition = `${x}% ${y}%`;
  };
  const popupFontsStyle = document.getElementById('popup-fonts');
  const accentInput = document.getElementById('accent');
  const accentSwatch = document.getElementById('accent-swatch');
  const accentCode = document.getElementById('accent-code');
  const resetAccentBtn = document.getElementById('reset-accent');
  const siteInputs = document.querySelectorAll('input[data-site]');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  // Nạp trước 3 font đóng gói để popup xem trước được ngay
  popupFontsStyle.textContent = ['Be Vietnam Pro', 'Inter', 'Nunito'].map(fontFacesCss).join('\n');

  let state = { ...DEFAULTS, sites: { ...DEFAULTS.sites } };

  // Tạo lưới thẻ theme
  THEMES.forEach((t) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'theme-card';
    card.dataset.theme = t.id;
    card.innerHTML = `
      <div class="theme-card-top">
        <div class="theme-dots">
          <span class="theme-dot" style="background:${t.bg}" title="Màu nền"></span>
          <span class="theme-dot" style="background:${t.surface}" title="Màu bề mặt"></span>
          <span class="theme-dot" style="background:${t.accent}" title="Màu nhấn"></span>
        </div>
        <span class="theme-badge">${t.dark ? 'Tối' : 'Sáng'}</span>
      </div>
      <div class="theme-card-name">${t.name}</div>
    `;
    card.addEventListener('click', () => save({ theme: t.id }));
    themeGrid.appendChild(card);
  });

  function hasCustomOverrides() {
    return Boolean(
      state.accent ||
      state.font ||
      (state.radius !== null && state.radius !== undefined && state.radius !== '') ||
      typeof state.glass === 'boolean' ||
      (state.blur !== null && state.blur !== undefined && state.blur !== '') ||
      (state.panelOpacity !== null && state.panelOpacity !== undefined && state.panelOpacity !== '') ||
      state.background ||
      state.density ||
      (state.fontScale !== null && state.fontScale !== undefined && state.fontScale !== '') ||
      typeof state.hover === 'boolean'
    );
  }

  function render() {
    const resolved = resolve(state);
    const root = document.documentElement;

    // Tô màu + font + bo góc chính popup theo theme đang chọn
    root.style.setProperty('--bg', resolved.bg);
    root.style.setProperty('--surface', resolved.surface);
    // Popup luôn dùng màu GỐC của theme: màu chữ trên trang có thể đã được tương phản thông minh đổi theo ảnh nền,
    // dùng cho popup sẽ ra chữ tối trên nền tối (lỗi 2026-11-19).
    const look = THEMES.find((t) => t.id === resolved.id) || resolved;
    root.style.setProperty('--surface2', look.surface2);
    root.style.setProperty('--text', look.text);
    root.style.setProperty('--muted', look.muted);
    root.style.setProperty('--border', look.border);
    root.style.setProperty('--accent', resolved.accent);
    root.style.setProperty('--ink', resolved.ink);
    root.style.setProperty('--radius', `${Math.min(12, Math.max(4, resolved.radius || 4))}px`);
    root.style.setProperty('--font', fontStack(resolved.font));
    root.style.colorScheme = resolved.dark ? 'dark' : 'light';

    enabledInput.checked = Boolean(state.enabled);
    controls.classList.toggle('disabled', !state.enabled);

    themeNameEl.textContent = resolved.name;
    themeGrid.querySelectorAll('.theme-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.theme === resolved.id);
    });

    resetAllBtn.disabled = !hasCustomOverrides();

    fontSelect.value = resolved.font;
    radiusBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.radius) === resolved.radius));
    densityBtns.forEach((b) => b.classList.toggle('active', b.dataset.density === resolved.density));

    fontScaleInput.value = String(resolved.fontScale);
    fontScaleVal.textContent = `${Math.round(resolved.fontScale * 100)}%`;

    glassToggle.checked = Boolean(resolved.glass);
    hoverToggle.checked = Boolean(resolved.hover);
    blurRange.value = String(resolved.blur);
    blurVal.textContent = `${resolved.blur}px`;
    opacityRange.value = String(resolved.panelOpacity);
    opacityVal.textContent = `${Math.round(resolved.panelOpacity * 100)}%`;

    if (state.background === 'video') bgState.textContent = 'Video tuỳ chọn';
    else if (state.background?.startsWith('data:')) bgState.textContent = 'Ảnh tuỳ chọn';
    else if (state.background === 'none') bgState.textContent = 'Đã tắt';
    else if (resolved.background !== 'none') bgState.textContent = 'Gradient theme';
    else bgState.textContent = 'Không có';
    bgClearBtn.disabled = resolved.background === 'none';
    const isVideo = state.background === 'video';
    const hasImg = Boolean(state.background?.startsWith('data:')) || isVideo;
    bgEditor.hidden = !hasImg;
    if (hasImg) {
      if (isVideo) {
        bgPreview.style.backgroundImage = 'none'; shownBg = '';
        showPreviewVideo(state.bgVideoVersion);
        if (previewVideo) { previewVideo.hidden = false; previewVideo.style.objectFit = resolved.bgFit; }
      } else {
        if (previewVideo) previewVideo.hidden = true;
        if (shownBg !== state.background) { bgPreview.style.backgroundImage = `url("${state.background}")`; shownBg = state.background; }
        bgPreview.style.backgroundSize = resolved.bgFit;
      }
      setPreviewPos(resolved.bgX, resolved.bgY);
      bgBlurRange.value = String(resolved.bgBlur); bgBlurVal.textContent = `${resolved.bgBlur}px`;
      bgDimRange.value = String(resolved.bgDimUser);
      bgDimVal.textContent = resolved.bgDim > resolved.bgDimUser + 0.01
        ? `${Math.round(resolved.bgDimUser * 100)}% → tự tăng ${Math.round(resolved.bgDim * 100)}% cho chữ dễ đọc`
        : `${Math.round(resolved.bgDim * 100)}%`;
      // Ô xem trước giống trang: cùng độ mờ (thu nhỏ theo tỉ lệ ô) và lớp phủ màu theme
      const k = bgPreview.clientWidth / screen.width || 0.2;
      bgPreview.style.filter = previewVideo && isVideo ? '' : `blur(${(resolved.bgBlur * k).toFixed(1)}px)`;
      if (previewVideo) previewVideo.style.filter = `blur(${(resolved.bgBlur * k).toFixed(1)}px)`;
      bgPreview.style.boxShadow = `inset 0 0 0 999px ${resolved.bg}${Math.round(resolved.bgDim * 255).toString(16).padStart(2, '0')}`;
      bgFitBtns.forEach((b) => b.classList.toggle('active', b.dataset.fit === resolved.bgFit));
    }

    accentInput.value = resolved.accent;
    accentSwatch.style.background = resolved.accent;
    accentCode.textContent = resolved.accent.toUpperCase();
    resetAccentBtn.disabled = !state.accent;

    siteInputs.forEach((input) => {
      input.checked = Boolean(state.sites?.[input.dataset.site]);
    });

    statusDot.classList.toggle('off', !state.enabled);
    statusText.textContent = state.enabled ? 'Đang bật •' : 'Đang tắt •';
  }

  function save(patch) {
    state = {
      ...state,
      ...patch,
      sites: { ...state.sites, ...(patch.sites || {}) }
    };
    render();
    if (chrome?.storage?.local) {
      // Chỉ ghi phần vừa đổi: ghi cả state sẽ ghi lại ảnh nền (vài MB) mỗi lần kéo chỉnh → giật.
      chrome.storage.local.set(patch.sites ? { ...patch, sites: state.sites } : patch);
    }
  }

  if (chrome?.storage?.local) {
    chrome.storage.local.get(null, (stored) => {
      state = {
        ...DEFAULTS,
        ...stored,
        sites: { ...DEFAULTS.sites, ...(stored?.sites || {}) }
      };
      render();
      // Ảnh nền chọn từ bản cũ chưa đo độ sáng → tương phản thông minh chưa chạy: đo bù ngay khi mở popup.
      if (state.background?.startsWith('data:') && typeof state.bgLum !== 'number') {
        lumOfImage(state.background).then((l) => { if (typeof l === 'number') save({ bgLum: l }); });
      } else if (state.background === 'video' && typeof state.bgLum !== 'number') {
        VeltrixVideo.get().then((b) => b && lumOfVideo(b)).then((l) => { if (typeof l === 'number') save({ bgLum: l }); }).catch(() => {});
      }
    });
  } else {
    render();
  }

  enabledInput.addEventListener('change', (e) => save({ enabled: e.target.checked }));
  fontSelect.addEventListener('change', (e) => save({ font: e.target.value }));
  radiusBtns.forEach((b) => b.addEventListener('click', () => save({ radius: Number(b.dataset.radius) })));
  densityBtns.forEach((b) => b.addEventListener('click', () => save({ density: b.dataset.density })));
  fontScaleInput.addEventListener('input', (e) => save({ fontScale: parseFloat(e.target.value) }));
  glassToggle.addEventListener('change', (e) => save({ glass: e.target.checked }));
  hoverToggle.addEventListener('change', (e) => save({ hover: e.target.checked }));
  blurRange.addEventListener('input', (e) => save({ blur: Number(e.target.value) }));
  opacityRange.addEventListener('input', (e) => save({ panelOpacity: Number(e.target.value) }));

  bgFileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        if (state.background === 'video') VeltrixVideo.clear().catch(() => {});
        save({ background: reader.result, bgX: 50, bgY: 50, bgFit: 'cover', bgLum: await lumOfImage(reader.result) });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  bgClearBtn.addEventListener('click', () => {
    if (state.background === 'video') VeltrixVideo.clear().catch(() => {});
    save({ background: 'none' });
  });

  // Video nền: lưu vào IndexedDB của extension (không để trong chrome.storage vì quá nặng), cài đặt chỉ ghi số phiên bản.
  // Đo độ sáng trung bình (0–1) của ảnh / khung hình video: thu về 24×24 rồi lấy trung bình độ sáng tương đối.
  function measureLum(src) {
    const c = document.createElement('canvas'); c.width = c.height = 24;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, 24, 24);
    const d = g.getImageData(0, 0, 24, 24).data; let sum = 0;
    const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * ch(d[i]) + 0.7152 * ch(d[i + 1]) + 0.0722 * ch(d[i + 2]);
    return Math.round((sum / (d.length / 4)) * 1000) / 1000;
  }
  function lumOfImage(url) {
    return new Promise((res) => { const im = new Image(); im.onload = () => { try { res(measureLum(im)); } catch { res(undefined); } }; im.onerror = () => res(undefined); im.src = url; });
  }
  function lumOfVideo(blob) {
    return new Promise((res) => {
      const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(blob);
      let settled = false;
      const done = (x) => { if (settled) return; settled = true; URL.revokeObjectURL(v.src); res(x); };
      v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 2); };
      v.onseeked = () => { try { done(measureLum(v)); } catch { done(undefined); } };
      v.onerror = () => done(undefined);
      setTimeout(() => done(undefined), 5000);
    });
  }

  const MAX_VIDEO_MB = 200;
  bgVideoInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      bgState.textContent = `Video quá ${MAX_VIDEO_MB} MB`;
      return;
    }
    bgState.textContent = 'Đang lưu video…';
    try {
      await VeltrixVideo.put(file);
      save({ background: 'video', bgVideoVersion: Date.now(), bgX: 50, bgY: 50, bgFit: 'cover', bgLum: await lumOfVideo(file) });
    } catch {
      bgState.textContent = 'Không lưu được video';
    }
  });

  // Kéo ảnh trong ô xem trước: kéo sang phải = thấy thêm phần bên trái ảnh (giống kéo ảnh trong khung).
  let drag = null, saveTimer = 0;
  const pos = () => ({ x: Number(state.bgX ?? 50), y: Number(state.bgY ?? 50) });
  bgPreview.addEventListener('pointerdown', (e) => {
    drag = { sx: e.clientX, sy: e.clientY, ...pos() };
    bgPreview.setPointerCapture(e.pointerId);
    bgPreview.classList.add('dragging');
  });
  bgPreview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = bgPreview.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, drag.x - ((e.clientX - drag.sx) / r.width) * 150)));
    const y = Math.round(Math.min(100, Math.max(0, drag.y - ((e.clientY - drag.sy) / r.height) * 150)));
    setPreviewPos(x, y); // xem trước ngay
    state.bgX = x; state.bgY = y;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save({ bgX: x, bgY: y }), 80); // trang web đổi theo gần như ngay
  });
  const endDrag = () => { if (!drag) return; drag = null; bgPreview.classList.remove('dragging'); clearTimeout(saveTimer); save({ bgX: state.bgX, bgY: state.bgY }); };
  bgPreview.addEventListener('pointerup', endDrag);
  bgPreview.addEventListener('pointercancel', endDrag);
  bgFitBtns.forEach((b) => b.addEventListener('click', () => save({ bgFit: b.dataset.fit })));
  bgCenterBtn.addEventListener('click', () => save({ bgX: 50, bgY: 50 }));
  bgBlurRange.addEventListener('input', (e) => save({ bgBlur: Number(e.target.value) }));
  bgDimRange.addEventListener('input', (e) => save({ bgDim: Number(e.target.value) }));

  resetAllBtn.addEventListener('click', () => {
    save({
      accent: '',
      font: '',
      radius: null,
      glass: null,
      blur: null,
      panelOpacity: null,
      background: '',
      bgX: 50,
      bgY: 50,
      bgFit: 'cover',
      bgBlur: null,
      bgDim: null,
      density: '',
      fontScale: null,
      hover: null
    });
  });

  accentInput.addEventListener('input', (e) => save({ accent: e.target.value }));
  resetAccentBtn.addEventListener('click', () => save({ accent: '' }));

  siteInputs.forEach((input) => {
    input.addEventListener('change', (e) => {
      save({ sites: { [e.target.dataset.site]: e.target.checked } });
    });
  });
});

// Mở Veltrix Store trong tab mới (liên kết trong popup không tự chuyển trang)
document.getElementById('veltrix-store')?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://extension.veltrixhost.cloud' });
  window.close();
});
