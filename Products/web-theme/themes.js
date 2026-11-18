// Bộ theme dùng chung cho popup.js và content.js.
// Mỗi theme gồm bảng màu + font chữ, bo góc, kính mờ, nền, mật độ, cỡ chữ và hiệu ứng rê chuột.
// css(site, theme) chuyển thành biến màu + CSS riêng cho YouTube, Facebook và Google Tìm kiếm.
(function (root) {
  const THEMES = [
    {
      id: 'veltrix', name: 'Veltrix Tím', dark: true,
      bg: '#120f24', surface: '#1b1733', surface2: '#272050', text: '#ece9ff', muted: '#a8a2cc', border: '#2d2752', accent: '#a78bfa',
      font: 'Be Vietnam Pro', radius: 16, glass: true, blur: 16,
      background: 'radial-gradient(circle at 18% 12%, rgba(167,139,250,0.18), transparent 45%), radial-gradient(circle at 82% 85%, rgba(124,58,237,0.14), transparent 50%)',
      density: 'normal', fontScale: 1, hover: true
    },
    {
      id: 'night', name: 'Đêm Xanh', dark: true,
      bg: '#0b1220', surface: '#111a2e', surface2: '#1a2640', text: '#e6edf7', muted: '#94a3b8', border: '#22304a', accent: '#22d3ee',
      font: 'Inter', radius: 8, glass: true, blur: 16,
      background: 'radial-gradient(circle at 80% 10%, rgba(34,211,238,0.14), transparent 45%)',
      density: 'normal', fontScale: 1, hover: true
    },
    {
      id: 'forest', name: 'Rừng Thông', dark: true,
      bg: '#0e1613', surface: '#15211c', surface2: '#1e2e27', text: '#e3efe8', muted: '#9bb3a6', border: '#253a31', accent: '#4ade80',
      font: 'Be Vietnam Pro', radius: 8, glass: false, blur: 0,
      background: 'none',
      density: 'comfy', fontScale: 1, hover: true
    },
    {
      id: 'sunset', name: 'Hoàng Hôn', dark: true,
      bg: '#1a1210', surface: '#241815', surface2: '#31211b', text: '#f7e9e3', muted: '#c9a99d', border: '#3b2a23', accent: '#fb923c',
      font: 'Nunito', radius: 16, glass: true, blur: 16,
      background: 'radial-gradient(circle at 50% 0%, rgba(251,146,60,0.16), transparent 55%)',
      density: 'comfy', fontScale: 1.05, hover: true
    },
    {
      id: 'oled', name: 'Đen OLED', dark: true,
      bg: '#000000', surface: '#0b0b0b', surface2: '#171717', text: '#f5f5f5', muted: '#a3a3a3', border: '#262626', accent: '#e5e5e5',
      font: 'Inter', radius: 0, glass: false, blur: 0,
      background: 'none',
      density: 'compact', fontScale: 0.95, hover: false
    },
    {
      id: 'sakura', name: 'Sakura', dark: false,
      bg: '#fff6f9', surface: '#ffffff', surface2: '#fde7ef', text: '#2b1720', muted: '#8a6474', border: '#f3d2df', accent: '#db2777',
      font: 'Nunito', radius: 16, glass: true, blur: 16,
      background: 'radial-gradient(circle at 15% 15%, rgba(219,39,119,0.10), transparent 50%), radial-gradient(circle at 85% 80%, rgba(244,114,182,0.12), transparent 50%)',
      density: 'comfy', fontScale: 1, hover: true
    },
    {
      id: 'mint', name: 'Bạc Hà', dark: false,
      bg: '#f2faf7', surface: '#ffffff', surface2: '#e0f4ec', text: '#10241d', muted: '#557367', border: '#cde8dd', accent: '#0d9488',
      font: 'Be Vietnam Pro', radius: 8, glass: false, blur: 0,
      background: 'none',
      density: 'normal', fontScale: 1, hover: true
    },
    {
      id: 'paper', name: 'Giấy Ngà', dark: false,
      bg: '#faf6ee', surface: '#fffdf8', surface2: '#f1eadb', text: '#2a241a', muted: '#7a6f5c', border: '#e6dcc6', accent: '#b45309',
      font: 'system', radius: 8, glass: false, blur: 0,
      background: 'none',
      density: 'comfy', fontScale: 1.05, hover: false
    }
  ];

  // Giá trị rỗng/null nghĩa là dùng theo mặc định của theme đang chọn
  const DEFAULTS = {
    enabled: true,
    theme: 'veltrix',
    accent: '',
    font: '',
    radius: null,
    glass: null,
    blur: null,
    panelOpacity: null,
    background: '',
    bgX: 50, // vị trí ảnh nền (%), người dùng kéo trong popup để giữ phần chính của ảnh
    bgY: 50,
    bgFit: 'cover', // 'cover' phủ kín (có cắt) | 'contain' vừa khung (hiện trọn ảnh)
    bgBlur: null, // làm mờ ảnh / video nền (px); null = 8
    bgDim: null, // phủ màu nền theme lên ảnh / video (0–0.8) cho chữ dễ đọc; null = 0.4
    density: '',
    fontScale: null,
    hover: null,
    preview: false, // xem trước video khi rê chuột (YouTube)
    previewDelay: 3, // giây
    previewEffect: 'spin', // 'spin' xoay 3D rồi phóng to | 'zoom' chỉ phóng to
    sites: { youtube: true, facebook: true, google: true }
  };

  const FONT_FILES = {
    'Be Vietnam Pro': [
      { file: 'be-vietnam-pro-vietnamese-400.woff2', weight: '400', range: 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+1EA0-1EF9' },
      { file: 'be-vietnam-pro-latin-400.woff2', weight: '400', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+FEFF, U+FFFD' },
      { file: 'be-vietnam-pro-vietnamese-700.woff2', weight: '700', range: 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+1EA0-1EF9' },
      { file: 'be-vietnam-pro-latin-700.woff2', weight: '700', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+FEFF, U+FFFD' }
    ],
    Inter: [
      { file: 'inter-vietnamese-400.woff2', weight: '400 700', range: 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+1EA0-1EF9' },
      { file: 'inter-latin-400.woff2', weight: '400 700', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+FEFF, U+FFFD' }
    ],
    Nunito: [
      { file: 'nunito-vietnamese-400.woff2', weight: '400 700', range: 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+1EA0-1EF9' },
      { file: 'nunito-latin-400.woff2', weight: '400 700', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+FEFF, U+FFFD' }
    ]
  };

  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  // Chữ trên nền màu nhấn: đen hay trắng tùy độ sáng của màu nhấn.
  // Chữ trên nền màu nhấn: đen hay trắng, chọn bên có tương phản CAO HƠN (ngưỡng cũ 0.45 chọn chữ trắng trên tím nhạt
  // #a78bfa: 2.6:1, khó đọc; chữ đen 8:1).
  const inkOn = (h) => { const [r, g, b] = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); const L = 0.2126 * r + 0.7152 * g + 0.0722 * b; return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#111111' : '#ffffff'; };

  const lum = (h) => { const [r, g, b] = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  function resolve(settings) {
    const s = { ...DEFAULTS, ...settings, sites: { ...DEFAULTS.sites, ...(settings?.sites || {}) } };
    const base = THEMES.find((t) => t.id === s.theme) || THEMES[0];
    const accent = /^#[0-9a-f]{6}$/i.test(s.accent || '') ? s.accent : base.accent;
    const font = s.font || base.font;
    const radius = s.radius !== null && s.radius !== undefined && s.radius !== '' ? Number(s.radius) : base.radius;
    const glass = typeof s.glass === 'boolean' ? s.glass : base.glass;
    const background = s.background ? s.background : base.background;
    const density = s.density || base.density;
    const fontScale = s.fontScale !== null && s.fontScale !== undefined && s.fontScale !== '' ? Number(s.fontScale) : base.fontScale;
    const hover = typeof s.hover === 'boolean' ? s.hover : base.hover;
    // 'video' = nền video (content.js đặt khung bg.html phía sau trang); trang xử lý giống nền ảnh: các khung trong suốt.
    const hasBgImage = Boolean(background && (background.startsWith('data:') || background === 'video'));
    const hasCustomBlur = s.blur !== null && s.blur !== undefined && s.blur !== '';
    const blur = hasCustomBlur ? Number(s.blur) : (hasBgImage ? Math.max(16, base.blur) : (glass ? base.blur : 0));
    const hasCustomOpacity = s.panelOpacity !== null && s.panelOpacity !== undefined && s.panelOpacity !== '';
    const panelOpacity = hasCustomOpacity ? Number(s.panelOpacity) : 0.72; // 0.48 cũ: chữ trên khung khó đọc khi ảnh rực màu
    let surfacePanel = hasBgImage ? rgba(base.surface, panelOpacity) : base.surface;
    const bgX = Number.isFinite(Number(s.bgX)) ? Math.min(100, Math.max(0, Number(s.bgX))) : 50;
    const bgY = Number.isFinite(Number(s.bgY)) ? Math.min(100, Math.max(0, Number(s.bgY))) : 50;
    const bgFit = s.bgFit === 'contain' ? 'contain' : 'cover';
    const bgBlur = s.bgBlur !== null && s.bgBlur !== undefined && s.bgBlur !== '' ? Math.min(40, Math.max(0, Number(s.bgBlur))) : 8;
    const bgDim = s.bgDim !== null && s.bgDim !== undefined && s.bgDim !== '' ? Math.min(0.85, Math.max(0, Number(s.bgDim))) : 0.4;
    // Tương phản thông minh: popup đo độ sáng ảnh / video nền (bgLum, 0–1). Giữ nguyên theme người dùng chọn, chỉ TỰ TĂNG
    // lớp phủ màu theme (bgDim) vừa đủ để chữ của theme đạt tương phản 4.5:1 với nền. Bản đầu lật cả theme sang sáng / tối
    // → chọn theme tối lại ra trang trắng, popup chữ tối trên nền tối (lỗi 2026-11-19). Chỉ khi cần phủ > 85% mới đổi tông chữ.
    let { text, muted, dark, surface2, border } = base;
    let veilDim = bgDim;
    if (hasBgImage && typeof s.bgLum === 'number') {
      const L = s.bgLum, Lb = lum(base.bg), Lt = lum(text);
      const textIsLight = Lt > Lb;
      const target = textIsLight ? (Lt + 0.05) / 4.5 - 0.05 : 4.5 * (Lt + 0.05) - 0.05; // độ sáng nền tối đa / tối thiểu
      const ok = (d) => { const e = L * (1 - d) + Lb * d; return textIsLight ? e <= target : e >= target; };
      if (!ok(veilDim)) {
        const need = textIsLight ? (L - target) / (L - Lb) : (target - L) / (Lb - L);
        if (Number.isFinite(need) && need <= 0.85) veilDim = Math.min(0.85, Math.max(veilDim, need + 0.02));
        else {
          const e = L * (1 - veilDim) + Lb * veilDim, light = e > 0.18;
          text = light ? '#121216' : '#f4f4f8';
          muted = light ? '#3f3f4a' : '#d2d2dc';
          dark = !light;
          surfacePanel = light ? `rgba(255,255,255,${panelOpacity})` : `rgba(14,14,20,${panelOpacity})`;
          surface2 = light ? 'rgba(255,255,255,0.85)' : 'rgba(30,30,40,0.85)';
          border = light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
        }
      }
    }
    // Viền chữ mảnh khi có ảnh / video nền: chỗ ảnh lúc sáng lúc tối vẫn đọc được.
    const halo = hasBgImage ? (lum(text) < 0.3 ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.6)') : '';
    return { ...base, text, muted, dark, surface2, border, halo, bgX, bgY, bgFit, bgBlur, bgDim: veilDim, bgDimUser: bgDim, accent, ink: inkOn(accent), font, radius, glass, blur, panelOpacity, background, density, fontScale, hover, hasBgImage, surfacePanel };
  }

  function fontUrl(file) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      return chrome.runtime.getURL('fonts/' + file);
    }
    return 'fonts/' + file;
  }

  function fontFacesCss(fontName) {
    const faces = FONT_FILES[fontName];
    if (!faces) return '';
    return faces.map((f) => `@font-face{font-family:'${fontName}';font-style:normal;font-weight:${f.weight};font-display:swap;src:url("${fontUrl(f.file)}") format("woff2");unicode-range:${f.range}}`).join('\n');
  }

  function fontStack(fontName) {
    if (!fontName || fontName === 'system') {
      return 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';
    }
    return `'${fontName}',-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
  }

  // Nền ảnh / video: không đặt thẳng lên html / body (không làm mờ được) mà vẽ trên lớp cố định phía sau trang:
  //  - ảnh: html::before = lớp phủ màu theme + ảnh, rồi filter: blur
  //  - video: content.js đặt khung bg.html (z-index:-1, tự làm mờ); html::after phủ màu theme đè lên khung
  // body / html phải trong suốt để thấy lớp phía sau (:root:root để thắng html[dark] của YouTube).
  function backgroundCss(t, extraTargets = '') {
    if (!t.background || t.background === 'none') return '';
    const clear = `:root:root,:root:root body${extraTargets}{background:transparent!important;background-image:none!important}`;
    const veil = rgba(t.bg, t.bgDim);
    if (t.background === 'video') {
      return `${clear}html::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:${veil}}`;
    }
    if (t.hasBgImage) {
      const pad = t.bgBlur * 2; // tràn ra ngoài để mép ảnh mờ không lộ viền sáng
      return `${clear}html::before{content:"";position:fixed;inset:-${pad}px;z-index:-1;pointer-events:none;background-image:linear-gradient(${veil},${veil}),url("${t.background}");background-size:100% 100%,${t.bgFit};background-position:0 0,${t.bgX}% ${t.bgY}%;background-repeat:no-repeat;background-color:${t.bg};filter:${t.bgBlur ? `blur(${t.bgBlur}px)` : 'none'}}`;
    }
    return `html,body${extraTargets}{background-color:${t.bg}!important;background-image:${t.background}!important;background-attachment:fixed!important}`;
  }


  // Font cho MỌI phần tử (tiêu đề video, nút… có font riêng nên chỉ đặt cho body là không ăn), trừ icon dạng font / SVG.
  const allFont = (ff) => `:where(body,body *:not(svg,svg *,i,[class*="material"],[class*="symbol"],[class*="Symbol"],[class*="icon-font"])){font-family:${ff}!important}`;

  const vars = (map) => Object.entries(map).map(([k, v]) => `${k}:${v}!important`).join(';');

  function youtube(t) {
    const ff = fontStack(t.font);
    const panel = t.surfacePanel;
    const v = vars({
      '--yt-spec-base-background': t.hasBgImage ? 'transparent' : t.bg,
      '--yt-spec-raised-background': panel, '--yt-spec-menu-background': panel,
      '--yt-spec-general-background-a': t.hasBgImage ? 'transparent' : t.bg,
      '--yt-spec-general-background-b': t.hasBgImage ? 'transparent' : t.bg,
      '--yt-spec-general-background-c': panel,
      '--yt-spec-brand-background-solid': t.bg, '--yt-spec-brand-background-primary': rgba(t.bg, 0.92), '--yt-spec-brand-background-secondary': rgba(t.bg, 0.8),
      '--yt-spec-text-primary': t.text, '--yt-spec-text-secondary': t.muted, '--yt-spec-text-disabled': rgba(t.muted, 0.6),
      '--yt-spec-text-primary-inverse': t.bg, '--yt-spec-inverted-background': t.text,
      '--yt-spec-icon-inactive': t.muted, '--yt-spec-icon-active-other': t.text, '--yt-spec-icon-disabled': rgba(t.muted, 0.5),
      '--yt-spec-10-percent-layer': t.border, '--yt-spec-outline': t.border, '--yt-spec-additive-background': rgba(t.text, 0.06),
      '--yt-spec-badge-chip-background': t.surface2, '--yt-spec-button-chip-background-hover': rgba(t.text, 0.12),
      '--yt-spec-touch-response': rgba(t.accent, 0.25), '--yt-spec-call-to-action': t.accent, '--yt-spec-suggested-action': rgba(t.accent, 0.15),
      '--yt-spec-static-brand-red': t.accent, '--yt-spec-brand-button-background': t.accent, '--yt-spec-themed-blue': t.accent,
      '--yt-sys-color-baseline--base-background': t.hasBgImage ? 'transparent' : t.bg,
      '--yt-sys-color-baseline--raised-background': panel,
      '--yt-sys-color-baseline--surface-container': panel, '--yt-sys-color-baseline--menu-background': panel,
      '--yt-sys-color-baseline--frosted-glass-desktop': rgba(t.bg, t.glass ? 0.72 : 0.95),
      '--yt-sys-color-baseline--frosted-glass-mobile': rgba(t.bg, t.glass ? 0.72 : 0.95),
      '--yt-sys-color-baseline--text-primary': t.text, '--yt-sys-color-baseline--text-secondary': t.muted,
      '--yt-sys-color-baseline--text-disabled': rgba(t.muted, 0.6), '--yt-sys-color-baseline--text-primary-inverse': t.bg,
      '--yt-sys-color-baseline--inverted-background': t.text, '--yt-sys-color-baseline--call-to-action': t.accent,
      '--yt-sys-color-baseline--outline': t.border, '--yt-sys-color-baseline--additive-background': t.surface2,
      '--yt-sys-color-baseline--tonal-background': t.surface2, '--yt-sys-color-baseline--button-chip-background-hover': rgba(t.text, 0.14),
      '--t3e41d7b17b187f69': t.hasBgImage ? 'transparent' : t.bg,
      '--t08a7c6c176cbc5c2': panel, '--t518e925f61bdcb91': panel, '--tbdeaf5bc17152abc': panel,
      '--ta889dfda9605a358': rgba(t.bg, t.glass ? 0.72 : 0.95), '--t5978da8d584b8fe9': rgba(t.bg, t.glass ? 0.72 : 0.95),
      '--tffc2fd3a644f6275': t.text, '--t285d1cbb17921f77': t.text, '--t4a6da19e16bf221a': t.muted, '--t7e34d5baa4ea6277': rgba(t.muted, 0.6),
      '--tf3fc855af2285f5f': t.border, '--t416e5931fc464589': rgba(t.text, 0.14),
      '--t7f4f2c6d54836ce0': t.surface2, '--tc87f6a7f05e65fc4': t.surface2,
      '--t1405e70a39276293': t.text, '--t6216186c28b3834b': t.bg, '--t2d807bb79e75606d': t.accent, '--t617db776af0de196': t.accent,
    });

    const blurPx = t.blur > 0 ? t.blur : 0;
    const blurDecl = blurPx > 0
      ? `backdrop-filter:blur(${blurPx}px) saturate(140%)!important;-webkit-backdrop-filter:blur(${blurPx}px) saturate(140%)!important`
      : `backdrop-filter:none!important;-webkit-backdrop-filter:none!important`;

    const headerBg = t.hasBgImage ? (t.dark ? 'rgba(14,14,20,.9)' : 'rgba(255,255,255,.9)') : t.glass ? rgba(t.bg, 0.82) : t.bg;
    const glassRule = (t.glass || t.hasBgImage)
      ? `#frosted-glass.with-chipbar.ytd-app,#frosted-glass.loading-with-chipbar.ytd-app,ytd-masthead #background.ytd-masthead,ytd-masthead.shell,ytd-masthead.shell.dark,ytd-multi-page-menu-renderer,ytd-menu-popup-renderer,tp-yt-paper-dialog,.ytSearchboxComponentSuggestionsContainer{background:${headerBg}!important;background-color:${headerBg}!important;${blurDecl}}`
      : `#frosted-glass.with-chipbar.ytd-app,#frosted-glass.loading-with-chipbar.ytd-app,ytd-masthead #background.ytd-masthead,ytd-masthead.shell,ytd-masthead.shell.dark{background:${headerBg}!important;background-color:${headerBg}!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}`;

    const densityRule = t.density === 'compact'
      ? `ytd-rich-grid-renderer{--ytd-rich-grid-items-per-row:5!important;--ytd-rich-grid-item-margin:10px!important}ytd-rich-item-renderer{margin-bottom:16px!important}`
      : t.density === 'comfy'
        ? `ytd-rich-grid-renderer{--ytd-rich-grid-items-per-row:3!important;--ytd-rich-grid-item-margin:24px!important}ytd-rich-item-renderer{margin-bottom:32px!important}`
        : '';

    const hoverRule = t.hover
      ? `ytd-thumbnail,yt-thumbnail-view-model,#thumbnail{overflow:hidden!important}ytd-thumbnail img,yt-thumbnail-view-model img{transition:transform .2s ease!important}ytd-rich-item-renderer:hover ytd-thumbnail img,ytd-rich-item-renderer:hover yt-thumbnail-view-model img,ytd-compact-video-renderer:hover ytd-thumbnail img,yt-lockup-view-model:hover yt-thumbnail-view-model img{transform:scale(1.05)!important}ytd-rich-item-renderer:hover ytd-thumbnail,ytd-rich-item-renderer:hover yt-thumbnail-view-model,yt-lockup-view-model:hover yt-thumbnail-view-model{outline:2px solid ${t.accent}!important;outline-offset:-2px!important}`
      : '';

    const bgImgCardRule = t.hasBgImage
      ? `ytd-app,ytd-page-manager,#page-manager,#content.ytd-app,ytd-browse,ytd-two-column-browse-results-renderer,ytd-rich-grid-renderer,ytd-watch-flexy,#columns,#primary,#secondary{background:transparent!important;background-color:transparent!important}
ytd-rich-item-renderer #content,ytd-watch-metadata,ytd-comments,ytd-guide-renderer,#guide-content.ytd-app,tp-yt-app-drawer#guide #contentContainer.tp-yt-app-drawer,ytd-mini-guide-renderer,.ytSearchboxComponentInputBox,ytd-searchbox #container.ytd-searchbox,.ytChipShapeInactive,ytd-playlist-panel-renderer,#secondary-inner ytd-compact-video-renderer,#secondary yt-lockup-view-model,ytd-watch-next-secondary-results-renderer yt-lockup-view-model,ytd-rich-item-renderer yt-lockup-view-model,ytd-watch-metadata #description{background-color:${panel}!important;border-radius:${t.radius}px!important;${blurDecl}}`
      : `ytd-guide-renderer,#guide-content.ytd-app,tp-yt-app-drawer#guide #contentContainer.tp-yt-app-drawer,ytd-mini-guide-renderer{background-color:${t.bg}!important;color:${t.text}!important}`;

    return `${allFont(ff)}
html,html[dark],html[darker-dark-theme],html[color-version],html[color-version][dark],[dark],[light],ytd-app{${v};color-scheme:${t.dark ? 'dark' : 'light'}}
html,html[dark],html[darker-dark-theme]{font-size:${(62.5 * t.fontScale).toFixed(2)}%!important}
html,html[dark],html[darker-dark-theme],body,ytd-app{background-color:${t.bg}!important;color:${t.text}!important;font-family:${ff}!important}
body,ytd-app,input,textarea,button,select,yt-formatted-string,.yt-core-attributed-string{font-family:${ff}!important}
${backgroundCss(t)}
${t.hasBgImage ? `/* Veltrix Ambient Light đang chiếu khung hình video ra sau trang (trang xem video): nhường nền cho nó, khỏi chồng 2 lớp nền */
:root:root[data-veltrix-yt="true"]:has(.veltrix-ambient-canvas:not(.veltrix-hidden))::before,:root:root[data-veltrix-yt="true"]:has(.veltrix-ambient-canvas:not(.veltrix-hidden))::after{display:none!important}
:root:root[data-veltrix-yt="true"]:has(.veltrix-ambient-canvas:not(.veltrix-hidden)) #veltrix-bg-video{display:none!important}
:root:root[data-veltrix-yt="true"]:has(.veltrix-ambient-canvas:not(.veltrix-hidden)){background:${t.bg}!important}` : ''}
${glassRule}
${bgImgCardRule}
${t.hasBgImage ? `#cinematics,#cinematics-container,ytd-cinematics,ytd-watch-flexy #cinematics,ytd-watch-grid #cinematics{display:none!important}[data-vx-clear-before]::before,[data-vx-clear-after]::after{background:transparent!important;background-image:none!important}`+`ytd-shorts #cinematic-container,ytd-reel-video-renderer #cinematic-container,#shorts-container #cinematic-container{display:none!important}ytd-shorts,#shorts-container,#shorts-inner-container,ytd-reel-video-renderer,.reel-video-in-sequence,.reel-video-in-sequence-new{background:transparent!important}` : ''}
#home-chips,html[darker-dark-theme] #home-chips,ytd-feed-filter-chip-bar-renderer #chips-wrapper.ytd-feed-filter-chip-bar-renderer{background-color:transparent!important}
.ytSearchboxComponentInputBox,ytd-searchbox #container.ytd-searchbox{background:${panel}!important;background-color:${panel}!important;border-color:${t.border}!important;color:${t.text}!important;border-radius:${t.radius}px!important}
.ytSearchboxComponentInputBox input,ytd-searchbox input,input#search{color:${t.text}!important}
.ytSearchboxComponentSearchButton,#search-icon-legacy.ytd-searchbox,#voice-search-button .yt-spec-button-shape-next{background:${t.surface2}!important;border-color:${t.border}!important;color:${t.text}!important;border-radius:${t.radius}px!important}
ytd-masthead svg#yt-logo-red-svg #youtube-paths path,ytd-masthead svg#yt-logo-red-updated-svg #youtube-paths path,ytd-masthead svg#yt-logo-svg #youtube-paths path,ytd-masthead svg#yt-logo-updated-svg #youtube-paths path,ytd-masthead #country-code{fill:${t.text}!important;color:${t.text}!important}
ytd-guide-entry-renderer #endpoint,ytd-mini-guide-entry-renderer #endpoint,.title.ytd-guide-entry-renderer,.title.ytd-mini-guide-entry-renderer{color:${t.text}!important}
.yt-lockup-metadata-view-model__title,#video-title,#video-title-link,yt-lockup-metadata-view-model h3{color:${t.text}!important}
.yt-content-metadata-view-model__metadata-text,#metadata-line,#channel-name,ytd-channel-name{color:${t.muted}!important}
.ytChipShapeInactive,yt-chip-cloud-chip-renderer:not([selected]) #chip-container{background-color:${t.surface2}!important;color:${t.text}!important;border-radius:${t.radius}px!important}
ytd-thumbnail,#thumbnail,yt-thumbnail-view-model,.ytThumbnailViewModelImage,#movie_player,.yt-spec-button-shape-next,tp-yt-paper-dialog,ytd-multi-page-menu-renderer,ytd-menu-popup-renderer{border-radius:${t.radius}px!important;overflow:hidden}
/* Nút Đăng ký, chip đang chọn, thanh tiến trình */
.yt-spec-button-shape-next--filled.yt-spec-button-shape-next--mono{background-color:${t.accent}!important;color:${t.ink}!important}.yt-spec-button-shape-next--filled.yt-spec-button-shape-next--mono *{color:inherit!important;fill:currentColor!important}
.ytChipShapeActive,yt-chip-cloud-chip-renderer[selected] #chip-container{background-color:${t.accent}!important;color:${t.ink}!important;border-radius:${t.radius}px!important}
.ytp-play-progress,.ytp-swatch-background-color,.ytp-volume-slider-handle,.ytp-volume-slider-handle::before{background:${t.accent}!important}
.ytp-scrubber-button.ytp-swatch-background-color{background:${t.accent}!important}
${densityRule}
${hoverRule}
::selection{background:${rgba(t.accent, 0.35)}}
${t.halo ? `:root:root body :where(h1,h2,h3,h4,a,span,p,yt-formatted-string,.yt-core-attributed-string){text-shadow:0 0 2px ${t.halo},0 1px 3px ${t.halo}}` : ''}`;
  }

  function facebook(t) {
    const ff = fontStack(t.font);
    const panel = t.surfacePanel;
    const v = vars({
      '--web-wash': t.hasBgImage ? 'transparent' : t.bg,
      '--surface-background': panel, '--card-background': panel,
      '--nav-bar-background': t.glass ? rgba(t.bg, 0.72) : panel,
      '--comment-background': t.surface2, '--input-background': t.surface2, '--secondary-button-background': t.surface2,
      '--primary-text': t.text, '--secondary-text': t.muted, '--placeholder-text': t.muted, '--disabled-text': rgba(t.muted, 0.6),
      '--primary-icon': t.text, '--secondary-icon': t.muted, '--placeholder-icon': t.muted,
      '--divider': t.border, '--media-inner-border': t.border, '--hover-overlay': rgba(t.text, 0.06), '--press-overlay': rgba(t.text, 0.1),
      '--accent': t.accent, '--blue-link': t.accent, '--primary-button-background': t.accent, '--primary-button-text': t.ink,
      '--primary-deemphasized-button-background': rgba(t.accent, 0.15), '--primary-deemphasized-button-text': t.accent,
      '--toggle-active-background': t.accent, '--toggle-active-icon': t.ink, '--progress-ring-blue-foreground': t.accent,
    });
    const glassRule = '';
    const bgImgCardRule = t.hasBgImage
      ? `[role="main"],[role="feed"]{background:transparent!important}[role="article"],[data-pagelet*="FeedUnit"]>div,input[type="search"],[role="combobox"]{background-color:${panel}!important}`
      : '';
    const densityRule = t.density === 'compact'
      ? `[data-pagelet^="FeedUnit"]{margin-bottom:8px!important}`
      : t.density === 'comfy'
        ? `[data-pagelet^="FeedUnit"]{margin-bottom:24px!important}`
        : '';
    // Facebook: khung ảnh không cắt phần tràn → không phóng to (sẽ đè chữ), chỉ viền màu nhấn.
    const hoverRule = t.hover
      ? `[role="article"] a:hover img{outline:2px solid ${t.accent}!important;outline-offset:-2px!important}`
      : '';
    return `${allFont(ff)}
:root,.__fb-light-mode,.__fb-dark-mode{${v};color-scheme:${t.dark ? 'dark' : 'light'}}
html{font-size:${Math.round(t.fontScale * 100)}%!important}
body{background-color:${t.bg}!important;color:${t.text}!important;font-family:${ff}!important}
body,input,textarea,button,select,span,div,p,a{font-family:${ff}!important}
${backgroundCss(t)}
${glassRule}
${bgImgCardRule}
[role="article"],[data-pagelet*="FeedUnit"]>div,input[type="search"],[role="combobox"],[role="dialog"],[role="menu"]{border-radius:${t.radius}px!important}
${densityRule}
${hoverRule}
::selection{background:${rgba(t.accent, 0.35)}}
${t.halo ? `:root:root body :where(h1,h2,h3,h4,a,span,p,yt-formatted-string,.yt-core-attributed-string){text-shadow:0 0 2px ${t.halo},0 1px 3px ${t.halo}}` : ''}`;
  }

  function google(t) {
    const ff = fontStack(t.font);
    const panel = t.surfacePanel;
    const blurPx = t.blur > 0 ? t.blur : 0;
    const blurDecl = blurPx > 0
      ? `backdrop-filter:blur(${blurPx}px) saturate(140%)!important;-webkit-backdrop-filter:blur(${blurPx}px) saturate(140%)!important`
      : `backdrop-filter:none!important;-webkit-backdrop-filter:none!important`;
    const glassRule = (t.glass || t.hasBgImage)
      ? `#searchform.minidiv,.sfbg{background-color:${rgba(t.bg, 0.72)}!important;${blurDecl}}`
      : '';
    const densityRule = t.density === 'compact'
      ? `.MjjYud,.g{margin-bottom:14px!important}`
      : t.density === 'comfy'
        ? `.MjjYud,.g{margin-bottom:34px!important}`
        : '';
    const hoverRule = t.hover
      ? `#rso .MjjYud a:hover img{outline:2px solid ${t.accent}!important;outline-offset:-2px!important}`
      : '';
    return `${allFont(ff)}
html{color-scheme:${t.dark ? 'dark' : 'light'};font-size:${Math.round(t.fontScale * 100)}%!important}
html,body,#main,#cnt,#rcnt,.sfbg,.minidiv,#searchform,.L3eUgb{background-color:${t.hasBgImage ? 'transparent' : t.bg}!important;color:${t.text}!important;font-family:${ff}!important}
body,input,textarea,button,select{font-family:${ff}!important}
${backgroundCss(t)}
${glassRule}
.RNNXgb{background:${t.hasBgImage ? panel : t.surface2}!important;border-color:${t.border}!important;box-shadow:none!important;border-radius:${t.radius}px!important}
.RNNXgb:hover,.RNNXgb:focus-within{border-color:${t.accent}!important}
textarea.gLFyf,input.gLFyf{color:${t.text}!important}
.LC20lb,#rso a h3,.DKV0Md{color:${t.accent}!important}
.VwiC3b,.yXK7lf,.MUxGbd,.lyLwlc,.st{color:${t.muted}!important}
cite,.tjvcx,.qLRx3b{color:${rgba(t.text, 0.75)}!important}
.gb_A svg,.gb_E{fill:${t.muted}!important}
.c93Gbe,.FPdoLc input[type=submit],.gNO89b{background:${t.hasBgImage ? panel : t.surface2}!important;color:${t.text}!important;border-color:${t.border}!important;border-radius:${t.radius}px!important}
${t.hasBgImage ? `.RNNXgb,.MjjYud,.g,.c93Gbe,.FPdoLc input[type=submit],.gNO89b{${blurDecl}}.MjjYud,.g{background:${panel}!important;padding:12px 14px!important;border-radius:${t.radius}px!important}` : `.MjjYud,.g{border-radius:${t.radius}px!important}`}
${densityRule}
${hoverRule}
::selection{background:${rgba(t.accent, 0.35)}}
${t.halo ? `:root:root body :where(h1,h2,h3,h4,a,span,p,yt-formatted-string,.yt-core-attributed-string){text-shadow:0 0 2px ${t.halo},0 1px 3px ${t.halo}}` : ''}`;
  }

  const BUILDERS = { youtube, facebook, google };
  const css = (site, theme) => (BUILDERS[site] ? BUILDERS[site](theme) : '');

  root.VeltrixThemes = { THEMES, DEFAULTS, FONT_FILES, resolve, css, inkOn, fontFacesCss, fontStack };
})(globalThis);
