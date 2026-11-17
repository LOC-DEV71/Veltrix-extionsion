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
  const bgState = document.getElementById('bg-state');
  const bgFileInput = document.getElementById('bg-file');
  const bgClearBtn = document.getElementById('bg-clear');
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
    root.style.setProperty('--surface2', resolved.surface2);
    root.style.setProperty('--text', resolved.text);
    root.style.setProperty('--muted', resolved.muted);
    root.style.setProperty('--border', resolved.border);
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

    if (state.background?.startsWith('data:')) bgState.textContent = 'Ảnh tuỳ chọn';
    else if (state.background === 'none') bgState.textContent = 'Đã tắt';
    else if (resolved.background !== 'none') bgState.textContent = 'Gradient theme';
    else bgState.textContent = 'Không có';
    bgClearBtn.disabled = resolved.background === 'none';

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
      chrome.storage.local.set(state);
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

  bgFileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        save({ background: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  bgClearBtn.addEventListener('click', () => save({ background: 'none' }));

  resetAllBtn.addEventListener('click', () => {
    save({
      accent: '',
      font: '',
      radius: null,
      glass: null,
      background: '',
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
