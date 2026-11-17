/**
 * Veltrix Universal Ambient Light & Cinema Glow
 * Full-Screen Real-Time Video Frame Duplication Engine (v4.0)
 *
 * Visual Architecture:
 * - LAYER 1 (Background): A real-time 1:1 pixel duplicate of the playing <video> frame
 *   rendered via HTML5 Canvas drawImage(), stretched across the entire viewport (100vw x 100vh),
 *   scaled (1.55x) from the player's visual center, and softened with Gaussian blur (32px).
 * - LAYER 2 (Foreground): The original sharp <video> player and translucent YouTube UI on top.
 *
 * Zero color extraction, zero CSS gradients, zero fake glow replacements.
 */

(function () {
  'use strict';

  // Only run on https://www.youtube.com/
  if (!window.location.href.startsWith('https://www.youtube.com/')) return;

  if (window.__VELTRIX_AMBIENT_INITIALIZED__) return;
  window.__VELTRIX_AMBIENT_INITIALIZED__ = true;

  document.documentElement.setAttribute('data-veltrix-yt', 'true');

  console.log(
    '%c[Veltrix]%c Full-Screen Video Frame Duplication Engine v4.0 active',
    'color: #a855f7; font-weight: bold;',
    'color: #38bdf8;'
  );

  const isYouTube = window.location.hostname.includes('youtube.com');

  const STORAGE_VERSION = 8;

  const QUALITY_OPTIONS = [
    { id: '8K', label: '8K (4320p)', ytCode: 'highres', badge: 'ULTRA' },
    { id: '4K', label: '4K (2160p)', ytCode: 'hd2160', badge: 'UHD' },
    { id: '2K', label: '2K (1440p)', ytCode: 'hd1440', badge: 'QHD' },
    { id: '1080p', label: '1080p', ytCode: 'hd1080', badge: 'FHD' },
    { id: '720p', label: '720p', ytCode: 'hd720', badge: 'HD' },
    { id: '480p', label: '480p', ytCode: 'large', badge: '' },
    { id: '360p', label: '360p', ytCode: 'medium', badge: '' },
    { id: '240p', label: '240p', ytCode: 'small', badge: '' },
    { id: '144p', label: '144p', ytCode: 'tiny', badge: '' },
    { id: 'auto', label: 'Auto', ytCode: 'auto', badge: '' }
  ];

  const DEFAULT_SETTINGS = {
    storageVersion: STORAGE_VERSION,
    enabled: true,
    videoQuality: '8K',   // 144p, 240p, 360p, 480p, 720p, 1080p, 2K, 4K, 8K, auto
    brightness: 100, // 100%: True natural video frame brightness
    blur: 32,        // 32px: Preserves recognizable silhouettes, characters, clouds, flowers
    spread: 1.55,    // 1.55x: Expands central video subjects into surrounding screen space
    saturation: 110, // 110%: Natural video colors without neon gradient distortion
    fps: 144,        // 15, 30, 60, 144 Hz real-time frame cloning
    glassEffect: true
  };

  let currentSettings = { ...DEFAULT_SETTINGS };
  const renderers = new Map();

  function ensureSvgEnhancerFilters() {
    if (!document.body || document.getElementById('veltrix-svg-enhancer')) return;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.id = 'veltrix-svg-enhancer';
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;pointer-events:none;';
    svg.innerHTML = `
      <defs>
        <filter id="veltrix-sharpen-1080p" color-interpolation-filters="sRGB">
          <feConvolveMatrix order="3" kernelMatrix="0 -0.25 0 -0.25 2.0 -0.25 0 -0.25 0" preserveAlpha="true" />
        </filter>
        <filter id="veltrix-sharpen-2k" color-interpolation-filters="sRGB">
          <feConvolveMatrix order="3" kernelMatrix="0 -0.38 0 -0.38 2.52 -0.38 0 -0.38 0" preserveAlpha="true" />
        </filter>
        <filter id="veltrix-sharpen-4k" color-interpolation-filters="sRGB">
          <feConvolveMatrix order="3" kernelMatrix="-0.08 -0.45 -0.08 -0.45 3.12 -0.45 -0.08 -0.45 -0.08" preserveAlpha="true" />
        </filter>
        <filter id="veltrix-sharpen-8k" color-interpolation-filters="sRGB">
          <feConvolveMatrix order="3" kernelMatrix="-0.12 -0.55 -0.12 -0.55 3.68 -0.55 -0.12 -0.55 -0.12" preserveAlpha="true" />
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);
  }

  function applyVideoQualityChoice(qualityId) {
    const matched = QUALITY_OPTIONS.find((q) => q.id === qualityId) || QUALITY_OPTIONS[0];
    document.documentElement.setAttribute('data-veltrix-quality', matched.id);
    ensureSvgEnhancerFilters();
    window.dispatchEvent(
      new CustomEvent('veltrix:set-quality', {
        detail: { quality: matched.ytCode, id: matched.id }
      })
    );
  }

  function loadSettings() {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(null, (stored) => {
        if (!stored || !stored.storageVersion || stored.storageVersion < STORAGE_VERSION) {
          currentSettings = { ...DEFAULT_SETTINGS };
          chrome.storage.local.set(currentSettings);
        } else {
          currentSettings = { ...DEFAULT_SETTINGS, ...stored };
        }
        applySettingsToDOM();
      });
    } else {
      applySettingsToDOM();
    }
  }

  function updateQuickToggleUI() {
    const dock = document.getElementById('veltrix-quick-dock');
    if (!dock) return;

    const isEnabled = !!currentSettings.enabled;
    const currentQ = currentSettings.videoQuality || '8K';

    dock.setAttribute('data-enabled', isEnabled ? 'true' : 'false');

    const powerBtn = dock.querySelector('#veltrix-btn-power');
    if (powerBtn) {
      powerBtn.setAttribute('data-active', isEnabled ? 'true' : 'false');
      const powerText = powerBtn.querySelector('.veltrix-action-text');
      if (powerText) {
        powerText.textContent = isEnabled ? 'Veltrix Gamming ON' : 'Veltrix Gamming OFF';
      }
    }

    const qualityBtn = dock.querySelector('#veltrix-btn-quality');
    if (qualityBtn) {
      qualityBtn.setAttribute('data-active', currentQ !== 'auto' ? 'true' : 'false');
      const qText = qualityBtn.querySelector('.veltrix-action-text');
      if (qText) {
        qText.textContent = `Chất lượng: ${currentQ === 'auto' ? 'Auto' : currentQ}`;
      }
    }

    dock.querySelectorAll('.veltrix-quality-item').forEach((item) => {
      const qId = item.getAttribute('data-quality');
      item.setAttribute('data-selected', qId === currentQ ? 'true' : 'false');
    });
  }

  function ensureQuickToggleButton() {
    if (!document.body) return;

    ensureSvgEnhancerFilters();

    // Remove legacy single button if present
    const legacyBtn = document.getElementById('veltrix-quick-toggle');
    if (legacyBtn) legacyBtn.remove();

    let dock = document.getElementById('veltrix-quick-dock');
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'veltrix-quick-dock';
      dock.setAttribute('data-open', 'false');
      dock.setAttribute('data-quality-open', 'false');

      const logoUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAXJklEQVR42u17eZxdVZH/t+qce+/bekkn3VlIAiQgkLAmYXW0O4gQMrKM+AKCEYGRNYqAbLK8fmwiIAoIym4MAeyHgkGZDAwkkZEYJIBCGkRAAolk63TS/dZ776n6/fHSEhAlQILzm6H+ep9+r+8951tV36pTVQf4WD6W/7OiqkQbPtLbvyJ9l5/Tpj/63f7/n7pTUgAFgFsBmg+gE3BEpISNt/VOGN72jHc+9H+uVgFQJ8Ab/iR5Inm33z61dm0THbXdrJ+g3LhjbGoOTMaxcgxlZSK1BGGCsQBZK/CsgAzABLKkytAIpGCIsqUgbeNBg0rTZ86csjSX66R8Pi9bcqOdAI0HaAlAmD8f+Y4OB/pb69N58+zP9xzfqr7dnmB3DknH+zY1MVEtzrPGmPtUEr+AS0KNQEnBRFALCAhsGeQMlAwUBmTqwIoAYIZhA2WCGgJzM3rXv34lQEd1d3fx5jThbKHA41pbCegAOiBU1+rfbPaZ3t7m5Wl/bKjxziF0giPe5Q7mkaQ6PLCpjAdGEkDZldYitocSABy+1aw7OR5ybMjlSImtMgEGgDUKQwpT3yQsQy0AVqhhwGMQGcAwkbVgz4pN+l6maeVBs+846OFstssUCtPclrCAZ599Nr0o0TpqXUBj1NrtPN/fJZE041MBjw180+YjAABEAGIIYkQQiUWgUSOnAy/sn/75oOkuCyilRt/eWXyt/0jWIHBGiAAi4rrGEdRhJoKSgkAgYiib+mdjoOzADCgJMTMqlcy1qrldOzuzuoFK9INqHkTa9fzz/h/LzZNi9T4hHnY1ntn1AcM7EtFwP9XANmnAPuDIITQCUYeKFJ0BqQJE9TUQE9TndFCLS0+3PfH0vV2qhrLoMgVMc4dse8f5XjjyihqVHZgNsYV6GpKPpWBpiElFWJWMAdiAPAPrWRifAeIRQhbqgWDJ+elmY7H6tK7Zn74pm1VTKNAHsoKcKl9KJKf96s+/8IeOONQagZf0AXZQDQGNxXiIjUcmkUqYhsE+EIaw5GJjyLIKQG+ROTG5hHjGK/V3fL6xZUGXqiFAKQdQd7bThk/t/HuKmnYIORQYZuujErStPa3r11+aecJht2USQVXjQZ7gL0C5OUm+38ijRq10L/1+2ysjN/RrFVdyZA2rCSAcrh2c7B03duyBa/L5TgDvjxCzXWoK08idef+fDqo1j5gbxSXn+aTsqRrfqB8YP9WUQTJpoJV+8QN6KfBobkLKvWhu+oYSmlUiEBEZAKriGmzGSHX9z49MNh/RpWqmETkCgAFfPWrS3YeGa4b8oupqTjxlBYg8AwR9l839wxcv+nuLPe+U2YP+uHTkCxHSraICsSw21WTFvXnjQ/d9ekZ7+zy7YMHk+H3YPuUU1DF/Pt+3fszvJN20m0pVyDOGkwaJxjQQlvrTCSxqTtBDCUTzT9227ZkH3nh177VtI7pi0GhQpMwbfECh1hgNRKtNpf5dD25qe7UToDyRMAAUCtNcFl3m3sVHz6nanvuZPePUiaMYsQtFosEXHrBb15zph98wGAAmTrzZ25AYUXv7PHvlD4/pdVL6lorHIqpQtXGt6Ng0nTj9+IcnLVgwOc5mu8ymax+cJ5Jf9Qz/uk0O2V0qJYEoszFiYldM9Pd8eQSKO12yU8tnz9x20PdO3bbtmRteX3bUX5qG/yaENzqsVVUdkQrAxBCIJDnBWqteNbV56CsF1J8PvJUsYByWKBRkGnrOCbG+BiVSqALKzpVidq2HrHx9m8entt+y++LFJ0Xt7fMNACxYMNnlcsp77L3oJ3G86lmihCFVYXIIgoRXQ8N1qtjkLDKXy3EhCzn/9qdb11bSF5T7K6IChogkkyluissXXb7PiFln7TF6+YlPqQcAl7/cc1Ip3XpPX01Mqa8oIpbiWOEihotFrJfgUlh8bXTFXZtT5SzwV3f8KwB55CWLLn7wmRkva7L/GmKfVVUUDIWxkeuPJUruFPVt9fiU/e7+Ut2kFYCiu7tA+Xw+DlKlkw1XnTFGjVETRkVHpmW/6afMO7JQmOayWX1PK+ge30kg0uXV5OVqm1pq1bLGTsUkGk20bs3iS+bfcf3XHnopyKqaWyZRdNmLPZdrQ/OPqsVQapVIQ0ccRg5RDMROEEWqpJa4Gp3+L62t/eMBoo2SpbclKwVkBcjx0FG9346492XmgIUgAoKAbOQqLoqQqRUHzeqY+NMrNmSdOsAjc+YcviiV6J+Z8FMGoo4EVKs67S81XH3s6fOax42D/qMzRbaryxSmkTv1B8/urbbxhKhUdCrMLmJE1RimWjy3E5244eDtw67OTrr0+Z7b0djyrcr6fheHEYkSxTEQxopa7FCpOeelM8atW/cfX2lqmTNAfBu/k995iGlvB9/1yNmlxsHxhcb3SAmqXE+6FM7EEmrkQkeu9fz9J9334OfarxmyIdkxQI5HjI4uVOntYfJJHCiq1hxo8Mh1PfZb+TzJgOv83WMUAVGcuNrjBJOLgVjFBA0m7O+579pDd3w0nye5btGihm8dMmNOlBl0fN+anlhjNaJELhK4WBBHQFRTjdSitK5cS1flLKhSoVD42/e9qybQZe6jae4z4376iLjmA0ItOSIYBaBEIAKUTOx7DdYLqq+mB6056v650383ZcpDwdy5U2tfOOyxkyIM/1EoJUceM6ynZDX0kismPHD7gS/kcsr5/NsPKANh76SrnvmKpEfdWYvWOwSWKemr57s4Tb27X/fFXV44++7/HlHbavs53DJoopTXx74Paw2UrSWuH1NAhiCkLtXabGT1issvGDP8wnfT/rtYwNtPf9TYf0YkxUgFcCLqtE6LIgQGWXHFKI6CMf1rhz12SMcvjp07d2oNUDN89HM/rlVXPWc0aTSGIIrUUDpBtYbriYDu7gK9M+MbtwSau+63jaVy6vJSX6jOMWnkJBmkORHXbr7ui7u8cE5hyfhyy3bzxTRMrPasjSUWWwuhMQXkIgcXK5xTxJETtQkurex9ranMV76T+N4TgALqYfGRhf/+vJi1PyIKjIOIbgCAiMCsYPI9F5ejOEKmUm758QF7338FEbkbbji9lrLlMzUOFRFAQkaifhcEbQd8+eTfHv5OQswWwPk8yeurkuf5/uARGlbEhQTRgMu9a1YfMWrMmWfd/ezeYbLtUXBi+9r6Xqc1NZEzquqTlouv1WJoFDnEsSKOoQFZylSqZ83YeWjxncT3ni7wVgGkk6ZMQWbtK2OeJzRsBXJgYhib4iDZ/xjUNqq2TYrivgjGZz/IGOK1/9Ew9I0T7r//pDenHvjYPZ4/8ijhPmcCQ8ZPEaj8ahLP7TZ27PRKPg/N5UD5PPT4s54YX9KhiymwxviO4UOCljYTlpYeFzRFf+LMsLkc2Ixq1aklosBnm04hFfacH3s4yGWGdCAqimFoetAgY/rW/uclE4ZNGXCtv7dL/kdVnfZ28Ny5+b4gWcsb47MCKqoUupoUK/7uQ4b3XSy05mHmlKcaq4v6Y5LWg/tXbf/rwz571+5jd6h+3WBdldWy1IRq/WWBtIyN7XbfHCDE7m4QQBqG6SuJGnxXixGHqobThvpWLhrW4EKHYY9WK5Sp9JUlrgGWAk4S1xI9bx6mGr0mqeEdUX/JxSEoFIvy+mIYxOE3AcK47D8+iL1ngpJFl+nSJbrv+E/8Rl3TPk4rTsmBuMGA1sx/qvvYyR0Tf/ZT1mHTVCuxYVb2014iqZVUsPIw56dHR7Wtb4u05Ewg7PmBsufKCbty/KxZBywDSE6Z8dS/VkzrL6saOlgyYlUp4SPwKwsp8CZSOhU4VAWeEZNpsL6prGii3mlXfWHJE19/eL8VzksPdq4KJUjQPMTEfcuv/OH+25z/Xtp/DwvYODTlxUsWTxPUXEwKB+XIrXcizR177nLrv89/+ogjiVdc5ZuUZRhLcTWOKpTsKw57GDX6hKXVSxLsGXKKsBJqXGnMlItN1wEkudycVLnqfz+qQLWmBAewghDVKJbMfmFogrBYUUQkgd9oudz3tFv/2qeuzo5//NTChJucbR4Sloqikagln+M1q5Zv01e5IqfKhSze8wC2SSnqwJF5wo433+F06HFOSs4ArPDVmOq6kSOq4x587KsrD+2Y8/Ww2HKtCBuFc8YLTCLpgU3YJ2obHRFgCMTGNTSmTabhz3tXqs27UrDVrdW4z8FnAx8gHyBPIT6pGoA844KmFmuw9sHRPb/5Uj4/ve+0Wd0TSrb5ScdK1gixFck0tBivuuaYa/5127s3RfubDACQYwD47L6ZIStWD+kGUoOAmAA43zRZa1f/YNGS474GAJ/75P2HSK31HiCZJgpjMBuwJWIBGQNjDdiy+F5AZIpLY7INsOkWDiIgMAQLwAIUEMgXVd9qkGlmjVbfNPOiHWYQSFWVTvjxS//FqcH7R9WiE6MIMs2Gqr2P3nrUtgds6uY32QWAvLS3gx9ZePYqzxZzRJZV1THIxK7soqjh5CmfvHOfLLrML3/zbw+mW1btD5SWI05ajcRpJCBnYZwBRQyExGGlSnEtsw3ixGCJaiQ1ItQEG8ImKBYhSVCCPfbCv5z3k4t2OK0jpwZQHP/956aLDNk/7O13FAub2ADFogvC4lkDgXyTC/jvo0ZBQBdns0vMS7/f+kmSpt0UVVFAmVLG2L7fPv3isfuOHftQ8PLLU2uf/8zsMbX1Ix+wrnUXp8WYjbHMBiACWYYxDHgksCDyiWAJZBXwCRTAmVTGeMm4mEn0fPXGyybeO/HEp7wxva/KoImDMkXeuht+ejhQUzKqqaYWQ9WV199y4o6nvx/tvw8LqCcGWQCFQj5MJoungSIVIRVRE0b9rlZL7bP7Tjcc9/LLU2tTtrsu+Pmjx7w6es8l7dbvmZvEYEs1jrUmoAigiKAxoDEYMRFiBTkBHMFV4BA2GSlXlpra8k/feNnEe9tzajPD+7VQmOacDu30vcEjpFQWqQppGHBp9ZpVtdKbOeSUuzaB+D6oBbyNECfueNvsMGw5OpZ+VwfSwHC0Zttt4l0efGzZ6vb2Dl6wYHKsCs7u+fiNUmk9OZKKY8uGLYM8Avn1sjs8gDxADYS9DCuvf7wx+OPRt80+Yll7bp5t616thcKR7oxv/3q3dfFWT0WOyVHMDipeqsmgsuyrsy+ecNv71f77tYAN3rVEgRxnGkvnOvSsg9oNIDpn0NL65l/4AiAvbW2rFcgxkeK+pz51Suwty1nyjDo4EgULgxxADmBHQAzxkIBHfSt2GrXw8NtmH7GsvX2eXZCfHANZAIo3VzVdE4VJ62ohOIQkTYNB/+qFd1084fZstssUptH7bsR8gOZFXrIYTwuePH2ZNdWLrUkwKYlVY8WVnQubTj1wn1v3qpfZxhMAbW9XO+fZAy6B7b0rYTKGQI6VAGcgkUJCAYWkRg371HdG/ntfXXvixKe8eimtXlU++uQnp6trO6DcW3RShZEIQK2mTaZyBr1VdtePAICBwkmXOWHK2Fss9T9vkTakLKwKOGt6Vprvv1UGI+3o6BRAuXnEm2cSF1cbDUidE44VFDMQqYNLmXJxzcI7frbvvdlsl7ll8aQIUCqMg+Zy8zISpy+XSk2pqhSX4YxrMlJcf+tNuUmL6iB9sAbMB2xfkWYBnH7D1FoiFZ9mCUIgBdiIlB27wfvuNfaWYwdOlfl8Xtrb5/Odc6ettqlip0cBu1hVnIJEQGLholCMLZ25sQ7b2+cb5EleX96cC3jwKKpVhUIl1AKqrF2zJll67QKoUmFc5wdu1RI+hLQjZxcgH08ce/s9FLUe5bToGMSMBNiEq0fvuGLnwty1PW+5TpcZl1uifyhMedzH0P3UVB17qolki63yspvufXzP0wZK6AOl+hknPb7buuKwxU4YSo7VqPh+s1FZOuOuO/e68cM0Xj6EBdRlASCAUmNz8ULV9f1GfTJgMJwkaUjbmleHXAjkpR0dvCGEIJ/PSyIZnsFUVSsEcr6JojW9I8esvBTIcceC+bJxeWzF6+mr4mLGSMUBNRFf0obCnkVjR//q5jpI9KE60B+yg5uXLAo8b/Hpr3gmvCxp0uzBSgA2Gpcd1RpPOWjHWRMWYHKcRV2j2ayaexa3P0lB360WKcPOpzDqv/iamZ9bkc12Uh55GfDpY6YuOsbGww6Miv0OVTJctbBRhAQqZ+Tz+XhzTCp86BZ2AVnJQXmHdr7emuJLCaQNlEQ1ApznhVVz48Z9gUKhU3NQ9hpeOLcm6/vUrH0J53/vh3WASAClcQVo7tR5GY4arjRO1DgmqZJD1GRqxbWzb5k1ceHm6jxvhh4+aTcKNHPmcVUb1L6hiMBKapUNtOYSbug+B28/++gBQgTy0p0t0MwFx63jVM8FnFiXK0wrOGQ3ZJtZcB4kryxpPN/Who6kqCqegKz4FFfX9iZCnAMojRu3ZLPMqBA2kwxkiJNH33V/4IYdHkvZMRkySAC2vGrI9q/tPObRGb15DDRKld45S1TXalZOPeKxcetf3+YZEWuMFxMzXCLVbGPzyjl3/OdeV7//XuMWtYCNWmtQamp250JLFR8BeWCyiCWtbcP63xiVy4Mki056a5BK6e2NkiwA0nDlkKvS1OhZjVVCVXJpE4arnt9tavP12WyXWbCgY7MNXWw2APIbCPGBPxz7kk1UvpMyjezBikeeEak4U2k46Yg97t61ANrgCgMgDHSW6uFs+t4LP6/FtqlRreiMsvHVqIGQ83rPOP30T9Q29xTa5pvj2YgQJ35q6HfYll5NcIoZogaClDb6if4hN717o3QD8eXmpLxq8/ekCo1jJcTqEtxkyK7+2axH9/uvD5PxfSQADBBifubkatBQOtNnS4EE6qlnRKouqA3+5LHjfnnMW4Q44Pt14lv6wPBzk1HbaEMVsapEkU/lcu86x+vOqIPUudmH8whbQAYI8dgxj8zxwrZDQtfvlECsPtQUVw4et2bnxoez6/KA5gDKA3pi+xM7yLJhz6p6HtmYwHAJf7AtmVcvvPOZPS7fnMS3BS1ggBCzCiiZdO/ZTkpVo5Y8AbE6aZARw0t/brk0D5J2zDfd9SketT2ZqzPcFBjECqdqXdKEbsWLzR1/ujYH5c1JfFvcAupWoKYAcl8ZPTeXDkd1xlp0RIZZPYGNHG/15l4/ePLQ3wOKr+3x5CGmb/icSCKnBCNKDhyYSvDGwTO79547YFFbYp28pQAoAJKD8taT3/wOvPVLk5RhD0YtO2RkkO/3DL0ZrDgj25XU9YkbEFK93yJwadNoOLH6VzNf2LKb36IAvEWIx1WTg6KzUiZJnnpq1TNOyi5ZHbH3ObvO+0L83OiTUlHb1iJlIXVkxCNBX3/DyPIMqFLdnbbgKrGFJYsuU6Bp7pzRix8MasM+V9U+RwCrEpyt9SkZz0gyKRyTU8SBbbHl1BsX/+DFCZe2Y55dgM1PfB+RBWxEiKrUNKLvbOZy5IlPrACzUuAyTUGcTDGE2JEkJW1CvPlKMOn5OvGhw23p9W1xAPIg6QL4goWTX6z6a65JIsVGSDwxMCpqVNUTgidGiRw5b92M79715VI3CvRR3DvY4i7w18FHgIqfnZVM/mG3bt+1jIqopkYNEwGOxPk8yJQTy355xdJdD8lqPYJ8FCvjjwYA0vEAffeRL5e4sXJegj0K1KpHFkaNJiRF4GI5OSL8hqrSuI/wOgZ/VC+aBnJdUHPJy/vcI7zu4UZpMSziWOBSaGDx+6686IlJ9SlOkPyvA6CeGxQABczI6lkw5dhzFj58W6Llf07+y/Jrc/j7w0z/a6QL9eGoq0e+8O0fDurX77Ysl0u2/t3U+nebPk/8/xkJbnzXqn7XpzG7MJBHhy91tvLceavHfaZL1Uz7iIjvn+YCdcTroe2swn6VqO2N43VY7zehSkv+x95D24KhEf/XJQfl3Ibxm4/lY/lY/iny/wASF1kolF7TzgAAAABJRU5ErkJggg==';

      const qualityItemsHtml = QUALITY_OPTIONS.map(
        (q) => `
          <button type="button" class="veltrix-quality-item" data-quality="${q.id}">
            <span class="veltrix-q-label">${q.label}</span>
            ${q.badge ? `<span class="veltrix-q-badge">${q.badge}</span>` : ''}
          </button>
        `
      ).join('');

      dock.innerHTML = `
        <div class="veltrix-dock-menu" role="group" aria-label="Veltrix Quick Actions">
          <button type="button" id="veltrix-btn-power" class="veltrix-dock-action" title="Bật / Tắt hiệu ứng Veltrix Ambient">
            <span class="veltrix-qt-dot"></span>
            <span class="veltrix-action-text">Veltrix ON</span>
          </button>
          <div class="veltrix-quality-wrap">
            <div class="veltrix-quality-popover" id="veltrix-video-quality-popover" role="menu">
              <div class="veltrix-quality-header">Chất lượng Video Chính</div>
              ${qualityItemsHtml}
            </div>
            <button type="button" id="veltrix-btn-quality" class="veltrix-dock-action" title="Chọn độ phân giải & làm nét Video Chính (144p -> 8K)">
              <svg class="veltrix-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span class="veltrix-action-text">Chất lượng: 8K</span>
            </button>
          </div>
        </div>
        <button type="button" id="veltrix-logo-trigger" title="Mở menu nhanh Veltrix">
          ${
            logoUrl
              ? `<img src="${logoUrl}" alt="Veltrix" class="veltrix-logo-img" />`
              : `<span class="veltrix-logo-fallback">V</span>`
          }
          <span class="veltrix-logo-badge"></span>
        </button>
      `;

      const triggerBtn = dock.querySelector('#veltrix-logo-trigger');
      const powerBtn = dock.querySelector('#veltrix-btn-power');
      const qualityBtn = dock.querySelector('#veltrix-btn-quality');

      triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = dock.getAttribute('data-open') === 'true';
        dock.setAttribute('data-open', isOpen ? 'false' : 'true');
        if (isOpen) {
          dock.setAttribute('data-quality-open', 'false');
        }
      });

      powerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentSettings.enabled = !currentSettings.enabled;
        applySettingsToDOM();
        if (chrome?.storage?.local) {
          chrome.storage.local.set({ enabled: currentSettings.enabled });
        }
      });

      qualityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isQOpen = dock.getAttribute('data-quality-open') === 'true';
        dock.setAttribute('data-quality-open', isQOpen ? 'false' : 'true');
      });

      dock.querySelectorAll('.veltrix-quality-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const chosenQ = item.getAttribute('data-quality') || '8K';
          currentSettings.videoQuality = chosenQ;
          dock.setAttribute('data-quality-open', 'false');
          applySettingsToDOM();
          if (chrome?.storage?.local) {
            chrome.storage.local.set({ videoQuality: chosenQ });
          }
        });
      });

      document.addEventListener('click', (e) => {
        if (!dock.contains(e.target)) {
          dock.setAttribute('data-quality-open', 'false');
        }
      });

      document.body.appendChild(dock);
    }

    updateQuickToggleUI();
  }

  function applySettingsToDOM() {
    const root = document.documentElement;
    root.style.setProperty('--veltrix-blur', `${currentSettings.blur}px`);
    root.style.setProperty('--veltrix-brightness', `${currentSettings.brightness}%`);
    root.style.setProperty('--veltrix-saturate', `${currentSettings.saturation}%`);
    root.style.setProperty('--veltrix-spread', `${currentSettings.spread}`);
    root.style.setProperty('--veltrix-opacity', currentSettings.enabled ? '0.88' : '0');

    applyVideoQualityChoice(currentSettings.videoQuality || '8K');

    updateQuickToggleUI();

    renderers.forEach((renderer) => {
      renderer.updateSettings(currentSettings);
    });
  }

  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        for (const [key, change] of Object.entries(changes)) {
          currentSettings[key] = change.newValue;
        }
        applySettingsToDOM();
      }
    });
  }

  /**
   * AmbientRenderer - Real-Time Full-Viewport Video Frame Duplicator
   */
  class AmbientRenderer {
    constructor(video) {
      this.video = video;

      // LAYER 1: High-definition Canvas holding the exact duplicated video frame
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'veltrix-ambient-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d', {
        alpha: false,
        desynchronized: true,
        willReadFrequently: false
      });

      if (this.ctx) {
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
      }

      this.genericWrapper = null;
      this.animId = null;
      this.rvfcId = null;
      this.lastFrameTime = 0;
      this.frameInterval = 1000 / (currentSettings.fps || 30);
      this.isAttached = false;
      this.resizeObserver = null;

      this.init();
    }

    init() {
      this.updateCanvasResolution();
      this.attach();
      this.setupObservers();
      this.bindEvents();

      if (this.video.readyState >= 2) {
        this.renderFrame();
      }
      if (!this.video.paused && !this.video.ended) {
        this.startLoop();
      }
    }

    updateCanvasResolution() {
      const vw = this.video.videoWidth || 854;
      const vh = this.video.videoHeight || 480;
      const scale = Math.min(1, 960 / Math.max(vw, vh));
      const targetW = Math.max(320, Math.round(vw * scale));
      const targetH = Math.max(180, Math.round(vh * scale));

      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
        if (this.ctx) {
          this.ctx.imageSmoothingEnabled = true;
          this.ctx.imageSmoothingQuality = 'high';
        }
      }
    }

    attach() {
      if (isYouTube) {
        this.attachYouTube();
      } else {
        this.attachGeneric();
      }
      this.isAttached = true;
      this.syncBounds();
    }

    attachYouTube() {
      const contentRoot =
        document.querySelector('#content.ytd-app') ||
        document.querySelector('ytd-watch-flexy') ||
        document.querySelector('ytd-page-manager') ||
        document.body;

      if (!contentRoot) {
        setTimeout(() => this.attachYouTube(), 200);
        return;
      }

      let container = document.getElementById('veltrix-cinematics');
      if (!container) {
        container = document.createElement('div');
        container.id = 'veltrix-cinematics';
        container.setAttribute('aria-hidden', 'true');
      }

      if (container.parentElement !== contentRoot) {
        if (contentRoot.firstChild) {
          contentRoot.insertBefore(container, contentRoot.firstChild);
        } else {
          contentRoot.appendChild(container);
        }
      }

      if (this.canvas.parentElement !== container) {
        container.appendChild(this.canvas);
      }

      // Ensure YouTube's native gradient cinematics stay disabled
      ['cinematics', 'cinematics-container'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      document.querySelectorAll('ytd-cinematics').forEach((el) => {
        el.style.display = 'none';
      });

      this.syncBounds();
    }

    attachGeneric() {
      const host = this.findGenericHost(this.video);
      const hostParent = host.parentElement || document.body;

      if (!this.genericWrapper) {
        this.genericWrapper = document.createElement('div');
        this.genericWrapper.className = 'veltrix-ambient-wrapper';
      }

      if (this.genericWrapper.parentElement !== hostParent) {
        hostParent.insertBefore(this.genericWrapper, host);
      }

      if (this.canvas.parentElement !== this.genericWrapper) {
        this.genericWrapper.appendChild(this.canvas);
      }
    }

    findGenericHost(video) {
      let curr = video;
      let host = video;

      while (
        curr.parentElement &&
        curr.parentElement !== document.body &&
        curr.parentElement !== document.documentElement
      ) {
        const parent = curr.parentElement;
        const className = (typeof parent.className === 'string' ? parent.className : '').toLowerCase();
        const id = (parent.id || '').toLowerCase();

        if (className.includes('player') || id.includes('player') || className.includes('video-container')) {
          host = parent;
        }

        if (parent.offsetWidth > video.offsetWidth * 1.4 && parent.offsetHeight > video.offsetHeight * 1.4) {
          break;
        }
        curr = parent;
      }

      return host;
    }

    /**
     * Synchronizes the full-viewport canvas transform-origin with the video player's position
     * so the central content of the duplicated video frame radiates outward into the
     * uncovered top bar, bottom metadata section, and right sidebar.
     */
    syncBounds() {
      if (!this.isAttached) return;

      // Clear any legacy inline size overrides so the canvas always covers 100vw x 100vh via CSS
      this.canvas.style.removeProperty('top');
      this.canvas.style.removeProperty('left');
      this.canvas.style.removeProperty('width');
      this.canvas.style.removeProperty('height');

      if (isYouTube) {
        const contentRoot =
          document.querySelector('#content.ytd-app') || document.querySelector('ytd-watch-flexy');
        const moviePlayer = document.getElementById('movie_player') || this.video;

        if (contentRoot) {
          const container = document.getElementById('veltrix-cinematics');
          if (!container || container.parentElement !== contentRoot) {
            this.attachYouTube();
          }
        }

        if (moviePlayer && window.innerWidth > 0 && window.innerHeight > 0) {
          const playerRect = moviePlayer.getBoundingClientRect();
          if (playerRect.width > 0 && playerRect.height > 0) {
            const originX = Math.max(
              10,
              Math.min(50, Math.round(((playerRect.left + playerRect.width * 0.32) / window.innerWidth) * 100))
            );
            const originY = Math.max(
              15,
              Math.min(65, Math.round(((playerRect.top + playerRect.height * 0.45) / window.innerHeight) * 100))
            );
            document.documentElement.style.setProperty('--veltrix-origin', `${originX}% ${originY}%`);
          }
        }
      }

      this.updateCanvasResolution();
    }

    setupObservers() {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.syncBounds();
          this.renderFrame();
        });
        this.resizeObserver.observe(this.video);

        if (isYouTube) {
          const moviePlayer = document.getElementById('movie_player');
          if (moviePlayer) this.resizeObserver.observe(moviePlayer);
          const watchFlexy = document.querySelector('ytd-watch-flexy');
          if (watchFlexy) this.resizeObserver.observe(watchFlexy);
        }
      }
    }

    bindEvents() {
      this.onPlay = () => {
        this.canvas.classList.remove('veltrix-hidden');
        this.syncBounds();
        this.renderFrame();
        this.startLoop();
      };

      this.onPause = () => {
        // Keep the exact paused video frame duplicated in the background for inspection
        this.renderFrame();
        this.stopLoop();
      };

      this.onEnded = () => {
        this.renderFrame();
        this.stopLoop();
      };

      this.onPlaying = () => {
        this.canvas.classList.remove('veltrix-hidden');
        this.syncBounds();
        this.renderFrame();
        this.startLoop();
      };

      this.onSeeked = () => {
        this.renderFrame();
      };

      this.onLoaded = () => {
        this.syncBounds();
        this.renderFrame();
      };

      this.video.addEventListener('play', this.onPlay);
      this.video.addEventListener('pause', this.onPause);
      this.video.addEventListener('ended', this.onEnded);
      this.video.addEventListener('playing', this.onPlaying);
      this.video.addEventListener('seeked', this.onSeeked);
      this.video.addEventListener('seeking', this.onSeeked);
      this.video.addEventListener('loadeddata', this.onLoaded);
      this.video.addEventListener('loadedmetadata', this.onLoaded);
      this.video.addEventListener('timeupdate', () => {
        if (!this.animId && !this.rvfcId && !this.video.paused && !this.video.ended) {
          this.startLoop();
        }
      });
    }

    /**
     * Direct 1:1 Video Frame Duplication
     * Copies the full, uncropped current frame of <video> onto the background Canvas.
     */
    renderFrame() {
      if (!this.video || this.video.readyState < 2 || !this.ctx) return;

      try {
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      } catch (err) {
        // Ignore transient decode state errors
      }
    }

    startLoop() {
      if (!currentSettings.enabled) return;
      if (this.animId || this.rvfcId) return;

      const targetFps = currentSettings.fps || 144;
      this.frameInterval = 1000 / targetFps;

      // For >60Hz (e.g., 144Hz displays), use requestAnimationFrame synced to the monitor's
      // native 144Hz refresh rate (requestVideoFrameCallback is capped at the video stream's 30/60fps)
      if (targetFps <= 60 && 'requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const onFrame = (now) => {
          if (!this.video || this.video.paused || this.video.ended) {
            this.stopLoop();
            return;
          }

          const elapsed = now - this.lastFrameTime;
          if (elapsed >= this.frameInterval) {
            this.lastFrameTime = now;
            this.renderFrame();
          }

          this.rvfcId = this.video.requestVideoFrameCallback(onFrame);
        };

        this.rvfcId = this.video.requestVideoFrameCallback(onFrame);
      } else {
        const loop = (timestamp) => {
          if (!this.video || this.video.paused || this.video.ended) {
            this.stopLoop();
            return;
          }

          if (targetFps >= 144) {
            // Native 144Hz display-synced rendering on every v-sync tick
            this.lastFrameTime = timestamp;
            this.renderFrame();
          } else {
            const elapsed = timestamp - this.lastFrameTime;
            if (elapsed >= this.frameInterval) {
              this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
              this.renderFrame();
            }
          }

          this.animId = requestAnimationFrame(loop);
        };

        this.animId = requestAnimationFrame(loop);
      }
    }

    stopLoop() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.rvfcId && this.video && 'cancelVideoFrameCallback' in this.video) {
        this.video.cancelVideoFrameCallback(this.rvfcId);
        this.rvfcId = null;
      }
    }

    updateSettings(settings) {
      this.frameInterval = 1000 / (settings.fps || 144);
      if (settings.enabled) {
        this.canvas.classList.remove('veltrix-hidden');
        this.renderFrame();
        if (!this.video.paused && !this.video.ended) {
          this.stopLoop();
          this.startLoop();
        }
      } else {
        this.canvas.classList.add('veltrix-hidden');
        this.stopLoop();
      }
    }

    handleFullscreen() {
      const fs = document.fullscreenElement || document.webkitFullscreenElement;
      if (fs) {
        if (fs.contains(this.video) || fs === this.video) {
          if (this.canvas.parentElement !== fs) {
            fs.insertBefore(this.canvas, fs.firstChild);
          }
        }
      } else {
        this.attach();
      }
    }

    destroy() {
      this.stopLoop();
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      this.video.removeEventListener('play', this.onPlay);
      this.video.removeEventListener('pause', this.onPause);
      this.video.removeEventListener('ended', this.onEnded);
      this.video.removeEventListener('playing', this.onPlaying);
      this.video.removeEventListener('seeked', this.onSeeked);
      this.video.removeEventListener('seeking', this.onSeeked);
      this.video.removeEventListener('loadeddata', this.onLoaded);
      this.video.removeEventListener('loadedmetadata', this.onLoaded);
      if (this.canvas && this.canvas.parentElement) {
        this.canvas.parentElement.removeChild(this.canvas);
      }
      if (this.genericWrapper && this.genericWrapper.parentElement) {
        this.genericWrapper.parentElement.removeChild(this.genericWrapper);
      }
    }
  }

  function registerVideo(video) {
    if (!video || renderers.has(video)) return;

    if (isYouTube && !video.classList.contains('html5-main-video')) {
      return;
    }

    if (video.offsetWidth > 0 && video.offsetWidth < 120 && video.offsetHeight < 80) return;

    const renderer = new AmbientRenderer(video);
    renderers.set(video, renderer);
    ensureQuickToggleButton();
    applyVideoQualityChoice(currentSettings.videoQuality || '8K');
  }

  function scanVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach((vid) => registerVideo(vid));
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'VIDEO') {
            registerVideo(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video').forEach((v) => registerVideo(v));
          }
        }
      }
      for (const node of mutation.removedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'VIDEO' && renderers.has(node)) {
            renderers.get(node).destroy();
            renderers.delete(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video').forEach((v) => {
              if (renderers.has(v)) {
                renderers.get(v).destroy();
                renderers.delete(v);
              }
            });
          }
        }
      }
    }
  });

  window.addEventListener(
    'play',
    (e) => {
      if (e.target && e.target.tagName === 'VIDEO') {
        if (!renderers.has(e.target)) {
          registerVideo(e.target);
        } else {
          const r = renderers.get(e.target);
          r.syncBounds();
          r.renderFrame();
          r.startLoop();
        }
      }
    },
    true
  );

  window.addEventListener('resize', () => {
    renderers.forEach((r) => {
      r.syncBounds();
      r.renderFrame();
    });
  });

  window.addEventListener(
    'scroll',
    () => {
      renderers.forEach((r) => r.syncBounds());
    },
    { passive: true }
  );

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      renderers.forEach((r) => r.stopLoop());
    } else {
      renderers.forEach((r) => {
        r.renderFrame();
        if (!r.video.paused && !r.video.ended) {
          r.startLoop();
        }
      });
    }
  });

  const onFullscreenChange = () => {
    setTimeout(() => {
      renderers.forEach((r) => r.handleFullscreen());
    }, 150);
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  ['yt-navigate-finish', 'yt-page-data-updated', 'spfdone'].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      setTimeout(scanVideos, 200);
      setTimeout(scanVideos, 800);
      setTimeout(scanVideos, 2000);
      renderers.forEach((r) => {
        r.attach();
        r.syncBounds();
        r.renderFrame();
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  loadSettings();
  scanVideos();
  setTimeout(scanVideos, 400);
  setTimeout(scanVideos, 1200);
  setTimeout(scanVideos, 3000);
})();
