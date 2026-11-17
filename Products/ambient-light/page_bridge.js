/**
 * Veltrix Main-World YouTube Player Quality Bridge
 * Runs in MAIN world to directly access #movie_player APIs
 * (getAvailableQualityLevels, setPlaybackQualityRange, setPlaybackQuality)
 */
(function () {
  'use strict';

  if (!window.location.href.startsWith('https://www.youtube.com/')) return;
  if (window.__VELTRIX_QUALITY_BRIDGE__) return;
  window.__VELTRIX_QUALITY_BRIDGE__ = true;

  // Ordered from highest to lowest YouTube internal quality code
  const YT_QUALITY_ORDER = [
    'highres', // 8K / 4320p+
    'hd2880',  // 5K
    'hd2160',  // 4K (2160p)
    'hd1440',  // 2K (1440p)
    'hd1080',  // 1080p
    'hd720',   // 720p
    'large',   // 480p
    'medium',  // 360p
    'small',   // 240p
    'tiny'     // 144p
  ];

  let desiredQuality = 'auto';

  function resolveBestMatch(requestedCode, availableLevels) {
    if (!Array.isArray(availableLevels) || availableLevels.length === 0) {
      return requestedCode;
    }

    // Filter out 'auto' from available levels when matching explicit resolutions
    const validAvailable = availableLevels.filter((q) => q && q !== 'auto');
    if (validAvailable.length === 0) return requestedCode;

    if (validAvailable.includes(requestedCode)) {
      return requestedCode;
    }

    const reqIndex = YT_QUALITY_ORDER.indexOf(requestedCode);
    if (reqIndex === -1) {
      return validAvailable[0];
    }

    // Find the closest available resolution at or below requestedCode
    for (let i = reqIndex; i < YT_QUALITY_ORDER.length; i++) {
      if (validAvailable.includes(YT_QUALITY_ORDER[i])) {
        return YT_QUALITY_ORDER[i];
      }
    }

    // Fallback to highest available
    return validAvailable[0];
  }

  function applyQualityToPlayer(qualityCode) {
    if (qualityCode) {
      desiredQuality = qualityCode;
    }
    if (!desiredQuality || desiredQuality === 'auto') {
      return;
    }

    const player = document.getElementById('movie_player');
    if (!player) return;

    try {
      const available =
        typeof player.getAvailableQualityLevels === 'function'
          ? player.getAvailableQualityLevels()
          : [];

      const target = resolveBestMatch(desiredQuality, available);

      if (typeof player.setPlaybackQualityRange === 'function') {
        player.setPlaybackQualityRange(target, target);
      }
      if (typeof player.setPlaybackQuality === 'function') {
        player.setPlaybackQuality(target);
      }
    } catch (err) {
      // Ignore transient player state errors
    }
  }

  window.addEventListener('veltrix:set-quality', (e) => {
    const code = e?.detail?.quality || 'auto';
    desiredQuality = code;
    if (code === 'auto') {
      const player = document.getElementById('movie_player');
      if (player && typeof player.setPlaybackQualityRange === 'function') {
        try {
          player.setPlaybackQualityRange('default', 'default');
        } catch (_) {}
      }
      return;
    }
    applyQualityToPlayer(code);
    setTimeout(() => applyQualityToPlayer(code), 250);
    setTimeout(() => applyQualityToPlayer(code), 900);
  });

  // Re-apply desired quality whenever a new YouTube video loads or starts playing
  window.addEventListener('yt-navigate-finish', () => {
    if (desiredQuality && desiredQuality !== 'auto') {
      setTimeout(() => applyQualityToPlayer(desiredQuality), 300);
      setTimeout(() => applyQualityToPlayer(desiredQuality), 1200);
    }
  });

  document.addEventListener(
    'playing',
    (e) => {
      if (e.target && e.target.tagName === 'VIDEO' && desiredQuality && desiredQuality !== 'auto') {
        applyQualityToPlayer(desiredQuality);
      }
    },
    true
  );

})();
