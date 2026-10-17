  function getRelativeLuminance(r, g, b) {
    const sRGB = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  function getContrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function applyCustomThemeColor(hex) {
    if (!hex) {
      document.body.classList.remove('has-custom-accent');
      document.documentElement.style.removeProperty('--theme-accent');
      document.documentElement.style.removeProperty('--theme-text');
      localStorage.removeItem('mun-custom-accent');
      const preview = document.getElementById('theme-color-preview');
      if (preview) {
        preview.style.backgroundColor = '';
        preview.className = 'w-4 h-4 rounded-full border border-white/30 inline-block bg-slate-700';
      }
      return;
    }

    // Top header & text contrast calculation:
    // Determine whether text over hex background is best in pure black (#000000) or pure white (#ffffff)
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    
    const bgLum = getRelativeLuminance(r, g, b);
    const whiteLum = 1.0;
    const blackLum = 0.0;
    const contrastWithWhite = getContrastRatio(bgLum, whiteLum);
    const contrastWithBlack = getContrastRatio(bgLum, blackLum);
    
    // Choose whichever gives higher contrast ratio
    const textColor = contrastWithBlack >= contrastWithWhite ? '#000000' : '#ffffff';

    document.documentElement.style.setProperty('--theme-accent', hex);
    document.documentElement.style.setProperty('--theme-text', textColor);
    document.body.classList.add('has-custom-accent');
    localStorage.setItem('mun-custom-accent', hex);

    const preview = document.getElementById('theme-color-preview');
    if (preview) {
      preview.style.backgroundColor = hex;
      preview.className = 'w-4 h-4 rounded-full border border-white/50 inline-block shadow-sm';
    }
  }

  function applyCustomLogo(logoSrc) {
    if (!logoSrc) return;
    const logoImg = document.querySelector('#btn-logo-home img');
    if (logoImg) {
      logoImg.src = logoSrc;
    }
  }

  function openCustomColorModal() {
    const t = I18N[state.language] || I18N.en;
    const currentCustom = localStorage.getItem('mun-custom-accent') || '#3683a8';

    // Helper functions for shade / tint calculation
    function hexToRgb(hex) {
      let clean = hex.replace('#', '');
      if (clean.length === 3) {
        clean = clean.split('').map(c => c + c).join('');
      }
      const num = parseInt(clean, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
      };
    }

    function rgbToHex(r, g, b) {
      const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
      return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // val: -100 to 100. Negative = darken (mix black), Positive = lighten (mix white)
    function adjustShade(hex, val) {
      if (!hex || !/^#[0-9A-Fa-f]{6}$/i.test(hex)) return hex;
      const { r, g, b } = hexToRgb(hex);
      const factor = val / 100;
      let newR, newG, newB;
      if (factor > 0) {
        // Lighten: mix with white (255, 255, 255)
        newR = r + (255 - r) * factor;
        newG = g + (255 - g) * factor;
        newB = b + (255 - b) * factor;
      } else {
        // Darken: mix with black (0, 0, 0)
        newR = r * (1 + factor);
        newG = g * (1 + factor);
        newB = b * (1 + factor);
      }
      return rgbToHex(newR, newG, newB);
    }

    // User provided color tokens grouped by hue
    const paletteGroups = [
      {
        name: state.language === 'zh' ? '粉紅' : (state.language === 'fr' ? 'Rose' : 'Pink'),
        shades: [
          { shade: '50', hex: '#fedaee' },
          { shade: '100', hex: '#fec1e3' },
          { shade: '200', hex: '#fea9d7' },
          { shade: '300', hex: '#fe7fc5' },
          { shade: '700', hex: '#a83675' }
        ]
      },
      {
        name: state.language === 'zh' ? '紅色' : (state.language === 'fr' ? 'Rouge' : 'Red'),
        shades: [
          { shade: '50', hex: '#fedcde' },
          { shade: '100', hex: '#fec0c4' },
          { shade: '200', hex: '#fea5aa' },
          { shade: '300', hex: '#fe7a82' },
          { shade: '700', hex: '#a93737' }
        ]
      },
      {
        name: state.language === 'zh' ? '黃色' : (state.language === 'fr' ? 'Jaune' : 'Yellow'),
        shades: [
          { shade: '50', hex: '#fefbd8' },
          { shade: '100', hex: '#fef7b5' },
          { shade: '200', hex: '#fef392' },
          { shade: '300', hex: '#feee59' },
          { shade: '700', hex: '#b87a1d' }
        ]
      },
      {
        name: state.language === 'zh' ? '綠色' : (state.language === 'fr' ? 'Vert' : 'Green'),
        shades: [
          { shade: '50', hex: '#dcfbe6' },
          { shade: '100', hex: '#bef8d1' },
          { shade: '200', hex: '#a3f5bc' },
          { shade: '300', hex: '#74ef9a' },
          { shade: '700', hex: '#36a858' }
        ]
      },
      {
        name: state.language === 'zh' ? '藍色' : (state.language === 'fr' ? 'Bleu' : 'Blue'),
        shades: [
          { shade: '50', hex: '#ddf2fe' },
          { shade: '100', hex: '#c0e6fe' },
          { shade: '200', hex: '#a4dafd' },
          { shade: '300', hex: '#76c6fd' },
          { shade: '700', hex: '#3683a8' }
        ]
      },
      {
        name: state.language === 'zh' ? '紫色' : (state.language === 'fr' ? 'Violet' : 'Purple'),
        shades: [
          { shade: '50', hex: '#eedbfe' },
          { shade: '100', hex: '#e2befd' },
          { shade: '200', hex: '#d6a2fd' },
          { shade: '300', hex: '#c274fd' },
          { shade: '700', hex: '#8036a8' }
        ]
      }
    ];

    let baseColor = currentCustom.startsWith('#') ? currentCustom : '#3683a8';
    let currentSliderVal = 0;

    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in';

    const box = document.createElement('div');
    box.className = 'bg-slate-900 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-700 max-h-[90vh] overflow-y-auto';

    let paletteHtml = paletteGroups.map(group => `
      <div class="space-y-1">
        <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">${group.name}</div>
        <div class="grid grid-cols-5 gap-1.5">
          ${group.shades.map(s => `
            <button data-hex="${s.hex}" class="btn-theme-swatch group relative p-1 rounded-lg border border-slate-700 hover:border-white transition flex flex-col items-center space-y-1 ${baseColor.toLowerCase() === s.hex.toLowerCase() ? 'ring-2 ring-white border-transparent' : ''}" title="${group.name} ${s.shade} (${s.hex})">
              <span class="w-7 h-7 rounded-md shadow-inner border border-white/20 transition group-hover:scale-105" style="background-color: ${s.hex}"></span>
              <span class="text-[10px] font-mono text-slate-300 w-full text-center">${s.shade}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    box.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-700 pb-3">
        <h3 class="font-bold text-lg text-slate-100">
          <span>${t.colorSchemeTitle}</span>
        </h3>
        <button class="modal-close-icon p-1 text-slate-400 hover:text-slate-200">✕</button>
      </div>

      <div class="space-y-4">
        <!-- 1. Base Primary Color Selection -->
        <div class="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
          <label class="block text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>${t.primaryColorLabel}</span>
            <span id="final-color-preview-tag" class="text-[11px] font-mono px-2 py-0.5 rounded border border-white/20 shadow-sm" style="background-color: ${baseColor}">
              ${baseColor.toUpperCase()}
            </span>
          </label>
          <div class="flex items-center space-x-3">
            <input type="color" id="theme-color-input" value="${baseColor}" class="w-11 h-9 rounded-lg cursor-pointer bg-transparent border border-slate-600 p-0.5">
            <input type="text" id="theme-color-hex-text" value="${baseColor}" placeholder="#3683a8" maxlength="7" class="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-400">
            <button id="btn-apply-custom-color" class="px-3.5 py-1.5 border border-sky-400 text-sky-300 hover:text-white font-bold text-xs rounded-lg transition">${t.apply}</button>
          </div>
        </div>

        <!-- 2. Real-time Brightness / Shade & Tint Slider -->
        <div class="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2.5">
          <div class="flex justify-between items-center text-xs text-slate-200 font-semibold">
            <span>${t.brightnessSliderLabel}</span>
            <span id="slider-val-display" class="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300">0%</span>
          </div>
          <input type="range" id="theme-shade-slider" min="-80" max="80" value="0" step="2" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400">
          <div class="flex justify-between text-[10px] text-slate-400">
            <span class="flex items-center space-x-1 hover:text-white cursor-pointer" id="btn-snap-dark"><span>◀</span> <span>${t.darkerLabel} (-80%)</span></span>
            <span class="hover:text-white cursor-pointer font-bold" id="btn-snap-zero"><span>${t.normalLabel} (0%)</span></span>
            <span class="flex items-center space-x-1 hover:text-white cursor-pointer" id="btn-snap-light"><span>${t.lighterLabel} (+80%)</span> <span>▶</span></span>
          </div>
        </div>

        <!-- 3. Palette Grid by Hue -->
        <div class="space-y-2.5 pt-1">
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">${t.presetPaletteLabel}</label>
          <div class="space-y-2.5 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            ${paletteHtml}
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
        <button id="btn-reset-theme-color" class="text-xs text-rose-400 hover:text-rose-300 font-semibold transition">
          <span>${t.resetDefaultColor}</span>
        </button>
        <button class="modal-close-btn px-4 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-200 transition">${t.done}</button>
      </div>
    `;

    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    function cleanup() {
      backdrop.remove();
    }
    box.querySelector('.modal-close-icon').onclick = cleanup;
    box.querySelector('.modal-close-btn').onclick = cleanup;

    const picker = box.querySelector('#theme-color-input');
    const hexInput = box.querySelector('#theme-color-hex-text');
    const slider = box.querySelector('#theme-shade-slider');
    const sliderValDisplay = box.querySelector('#slider-val-display');
    const previewTag = box.querySelector('#final-color-preview-tag');

    function updateActiveColor(saveToStorage = true) {
      const finalHex = adjustShade(baseColor, currentSliderVal);
      if (previewTag) {
        previewTag.style.backgroundColor = finalHex;
        previewTag.innerText = finalHex.toUpperCase();
        // Adjust preview tag text color for readability
        const { r, g, b } = hexToRgb(finalHex);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        previewTag.style.color = luma > 150 ? '#000000' : '#ffffff';
      }
      applyCustomThemeColor(finalHex);
      if (saveToStorage) {
        localStorage.setItem('mun-custom-accent', finalHex);
      }
    }

    // Palette selection click
    box.querySelectorAll('.btn-theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-hex');
        baseColor = hex;
        if (picker) picker.value = hex;
        if (hexInput) hexInput.value = hex;

        box.querySelectorAll('.btn-theme-swatch').forEach(b => {
          b.classList.remove('ring-2', 'ring-white', 'border-transparent');
        });
        btn.classList.add('ring-2', 'ring-white', 'border-transparent');

        updateActiveColor(true);
      });
    });

    // Slider real-time input event
    if (slider) {
      slider.addEventListener('input', (e) => {
        currentSliderVal = parseInt(e.target.value, 10) || 0;
        if (sliderValDisplay) {
          const prefix = currentSliderVal > 0 ? '+' : '';
          sliderValDisplay.innerText = `${prefix}${currentSliderVal}%`;
        }
        updateActiveColor(true);
      });
    }

    // Snap buttons for slider
    const snapZero = box.querySelector('#btn-snap-zero');
    if (snapZero) {
      snapZero.addEventListener('click', () => {
        if (slider) {
          slider.value = 0;
          currentSliderVal = 0;
          if (sliderValDisplay) sliderValDisplay.innerText = '0%';
          updateActiveColor(true);
        }
      });
    }
    const snapDark = box.querySelector('#btn-snap-dark');
    if (snapDark) {
      snapDark.addEventListener('click', () => {
        if (slider) {
          slider.value = -50;
          currentSliderVal = -50;
          if (sliderValDisplay) sliderValDisplay.innerText = '-50%';
          updateActiveColor(true);
        }
      });
    }
    const snapLight = box.querySelector('#btn-snap-light');
    if (snapLight) {
      snapLight.addEventListener('click', () => {
        if (slider) {
          slider.value = 50;
          currentSliderVal = 50;
          if (sliderValDisplay) sliderValDisplay.innerText = '+50%';
          updateActiveColor(true);
        }
      });
    }

    // 67 Easter Egg Effect
    // 67 Easter Egg Effect (Explosive Pop-out / 蹦出來)
    function triggerEasterEgg67() {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 pointer-events-none z-[99999] overflow-hidden';
      document.body.appendChild(overlay);

      // Central burst origin (center of screen or custom modal)
      const originX = window.innerWidth / 2;
      const originY = window.innerHeight / 2;

      const colors = ['#676767', '#ffffff', '#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#4ade80', '#fb7185', '#22d3ee'];
      const count = 90;

      for (let i = 0; i < count; i++) {
        const item = document.createElement('div');
        item.textContent = '67';
        item.className = 'font-black select-none pointer-events-none';
        
        const fontSize = 24 + Math.floor(Math.random() * 48); // Large prominent 67
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];

        item.style.position = 'fixed';
        item.style.left = `${originX}px`;
        item.style.top = `${originY}px`;
        item.style.fontSize = `${fontSize}px`;
        item.style.color = chosenColor;
        item.style.textShadow = '0 0 15px rgba(255,255,255,0.8), 0 4px 15px rgba(0,0,0,0.8)';
        item.style.transform = 'translate(-50%, -50%) scale(0.1)';
        item.style.opacity = '1';
        item.style.zIndex = '99999';

        overlay.appendChild(item);

        // Explosion physics
        const angle = Math.random() * Math.PI * 2;
        const speed = 400 + Math.random() * 750; // Pop out violently
        const vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed - (150 + Math.random() * 200); // Upward boost

        let posX = originX;
        let posY = originY;
        let scale = 0.2;
        let targetScale = 0.8 + Math.random() * 0.8;
        let rot = Math.random() * 360;
        const spin = (Math.random() - 0.5) * 800;
        let opacity = 1;
        let lastTime = performance.now();

        function animate(now) {
          const dt = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;

          vy += 900 * dt; // Gravity pulls it back down
          posX += vx * dt;
          posY += vy * dt;
          rot += spin * dt;
          scale = Math.min(targetScale, scale + dt * 6); // Rapid pop scale up

          // Fade out near bottom or after a short delay
          if (posY > window.innerHeight * 0.75) {
            opacity -= dt * 1.5;
          }

          item.style.transform = `translate(${posX - originX}px, ${posY - originY}px) rotate(${rot}deg) scale(${scale})`;
          item.style.opacity = Math.max(0, opacity);

          if (opacity > 0 && posY < window.innerHeight + 150) {
            requestAnimationFrame(animate);
          } else {
            item.remove();
          }
        }

        // Slight stagger for a richer firework burst feel
        setTimeout(() => {
          requestAnimationFrame(animate);
        }, Math.random() * 120);
      }

      setTimeout(() => {
        overlay.remove();
      }, 4200);
    }

    let easterEggTriggered = false;
    function checkEasterEgg(val) {
      if (!val) return;
      const clean = val.trim().toLowerCase().replace('#', '');
      if (clean === '676767' && !easterEggTriggered) {
        easterEggTriggered = true;
        triggerEasterEgg67();
        setTimeout(() => { easterEggTriggered = false; }, 3500);
      }
    }

    // Color picker input sync
    if (picker && hexInput) {
      picker.addEventListener('input', (e) => {
        baseColor = e.target.value;
        hexInput.value = baseColor;
        updateActiveColor(true);
        checkEasterEgg(baseColor);
      });
      hexInput.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        checkEasterEgg(val);
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          baseColor = val;
          picker.value = val;
          updateActiveColor(true);
        }
      });
    }

    // Apply button
    const applyBtn = box.querySelector('#btn-apply-custom-color');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        let val = hexInput.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        checkEasterEgg(val);
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          baseColor = val;
          updateActiveColor(true);
          if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) {
            saveToLocalStorage(true, true);
          }
          cleanup();
        } else {
          showToast('請輸入正確的 6 碼 Hex 色碼，例如 #3683a8', 'error');
        }
      });
    }

    // Reset button
    const resetBtn = box.querySelector('#btn-reset-theme-color');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        applyCustomThemeColor(null);
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) {
          saveToLocalStorage(true, true);
        }
        cleanup();
      });
    }
  }

function initTheme() {

    // === THEME TOGGLE ===
    const btnTheme = document.getElementById('btn-toggle-theme');
    const themeIcon = document.getElementById('theme-icon');
    // Load saved preference
    if (localStorage.getItem('mun-theme') === 'light') {
      document.body.classList.add('light-mode');
      if (themeIcon) { themeIcon.classList.remove('fa-sun'); themeIcon.classList.add('fa-moon'); }
    }
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('mun-theme', isLight ? 'light' : 'dark');
        if (themeIcon) {
          themeIcon.classList.toggle('fa-sun', !isLight);
          themeIcon.classList.toggle('fa-moon', isLight);
        }
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) {
          saveToLocalStorage(true, true);
        }
      });
    }

    // Load saved custom theme color
    const savedCustomAccent = localStorage.getItem('mun-custom-accent');
    if (savedCustomAccent) {
      applyCustomThemeColor(savedCustomAccent);
    }

    // Load saved custom logo
    const savedCustomLogo = localStorage.getItem('mun-custom-logo');
    if (savedCustomLogo) {
      applyCustomLogo(savedCustomLogo);
    }
}
