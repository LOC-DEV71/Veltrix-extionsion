/**
 * Veltrix Universal Ambient Light - Popup Logic (v4.0)
 */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_VERSION = 8;

  const DEFAULTS = {
    storageVersion: STORAGE_VERSION,
    enabled: true,
    brightness: 100,
    blur: 32,
    spread: 1.55,
    saturation: 110,
    fps: 144,
    glassEffect: true
  };

  const PRESETS = {
    cinema: { brightness: 100, blur: 24, spread: 1.35, saturation: 105, fps: 60, glassEffect: true },
    ultra: { brightness: 105, blur: 36, spread: 1.75, saturation: 115, fps: 144, glassEffect: true },
    default: { ...DEFAULTS }
  };

  // DOM elements
  const powerToggle = document.getElementById('power-toggle');
  const controlsSection = document.getElementById('controls-section');

  const inputBrightness = document.getElementById('input-brightness');
  const valBrightness = document.getElementById('val-brightness');

  const inputBlur = document.getElementById('input-blur');
  const valBlur = document.getElementById('val-blur');

  const inputSpread = document.getElementById('input-spread');
  const valSpread = document.getElementById('val-spread');

  const inputSaturation = document.getElementById('input-saturation');
  const valSaturation = document.getElementById('val-saturation');

  const fpsButtons = document.querySelectorAll('.segment-btn');
  const fpsHint = document.getElementById('val-fps-hint');

  const btnCinema = document.getElementById('preset-cinema');
  const btnUltra = document.getElementById('preset-ultra');
  const btnDefault = document.getElementById('preset-default');

  let state = { ...DEFAULTS };

  function renderUI() {
    powerToggle.checked = state.enabled;
    if (state.enabled) {
      controlsSection.classList.remove('disabled');
    } else {
      controlsSection.classList.add('disabled');
    }

    inputBrightness.value = state.brightness;
    valBrightness.textContent = `${state.brightness}%`;

    inputBlur.value = state.blur;
    valBlur.textContent = `${state.blur}px`;

    inputSpread.value = state.spread;
    valSpread.textContent = `${Number(state.spread).toFixed(2)}x`;

    inputSaturation.value = state.saturation;
    valSaturation.textContent = `${state.saturation}%`;

    // FPS
    fpsButtons.forEach((btn) => {
      const fps = parseInt(btn.dataset.fps, 10);
      if (fps === state.fps) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (state.fps === 15) fpsHint.textContent = 'Tiết kiệm pin';
    else if (state.fps === 30) fpsHint.textContent = 'Mượt mà (chuẩn)';
    else if (state.fps === 60) fpsHint.textContent = 'Siêu mượt (60Hz)';
    else if (state.fps >= 144) fpsHint.textContent = 'Gaming 144Hz Ultra';
  }

  function saveState(newValues) {
    state = { ...state, ...newValues, storageVersion: STORAGE_VERSION };
    renderUI();
    if (chrome?.storage?.local) {
      chrome.storage.local.set(state);
    }
  }

  if (chrome?.storage?.local) {
    chrome.storage.local.get(null, (stored) => {
      if (!stored || !stored.storageVersion || stored.storageVersion < STORAGE_VERSION) {
        state = { ...DEFAULTS };
        chrome.storage.local.set(state);
      } else {
        state = { ...DEFAULTS, ...stored };
      }
      renderUI();
    });
  } else {
    renderUI();
  }

  // Event Listeners
  powerToggle.addEventListener('change', (e) => {
    saveState({ enabled: e.target.checked });
  });

  inputBrightness.addEventListener('input', (e) => {
    saveState({ brightness: parseInt(e.target.value, 10) });
  });

  inputBlur.addEventListener('input', (e) => {
    saveState({ blur: parseInt(e.target.value, 10) });
  });

  inputSpread.addEventListener('input', (e) => {
    saveState({ spread: parseFloat(e.target.value) });
  });

  inputSaturation.addEventListener('input', (e) => {
    saveState({ saturation: parseInt(e.target.value, 10) });
  });

  fpsButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const fps = parseInt(btn.dataset.fps, 10);
      saveState({ fps });
    });
  });

  // Presets
  btnCinema.addEventListener('click', () => saveState(PRESETS.cinema));
  btnUltra.addEventListener('click', () => saveState(PRESETS.ultra));
  btnDefault.addEventListener('click', () => saveState(PRESETS.default));
});

// Open Veltrix Store in a new tab (links inside extension popups don't navigate on their own)
document.getElementById('veltrix-store')?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://extension.veltrixhost.cloud' });
  window.close();
});
