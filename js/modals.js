  function openLanguageModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in';

    const box = document.createElement('div');
    box.className = 'bg-slate-900 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-700';
    box.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-700 pb-3">
        <h3 class="font-bold text-lg text-slate-100 flex items-center space-x-2">
          <i data-lucide="globe" class="w-5 h-5 text-blue-500"></i>
          <span>${I18N[state.language].language}</span>
        </h3>
        <button class="modal-close-icon p-1 text-slate-400 hover:text-slate-200"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div class="space-y-2">
        <button data-lang="en" class="btn-select-lang w-full py-3 px-4 rounded-xl text-left font-bold text-sm border flex items-center justify-between transition ${state.language === 'en' ? 'bg-blue-600/30 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}">
          <span>English</span>
          ${state.language === 'en' ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
        </button>
        <button data-lang="zh" class="btn-select-lang w-full py-3 px-4 rounded-xl text-left font-bold text-sm border flex items-center justify-between transition ${state.language === 'zh' ? 'bg-blue-600/30 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}">
          <span>繁體中文</span>
          ${state.language === 'zh' ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
        </button>
        <button data-lang="fr" class="btn-select-lang w-full py-3 px-4 rounded-xl text-left font-bold text-sm border flex items-center justify-between transition ${state.language === 'fr' ? 'bg-blue-600/30 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}">
          <span>Français</span>
          ${state.language === 'fr' ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
        </button>
      </div>
    `;

    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    if (window.lucide) window.lucide.createIcons();

    function cleanup() {
      backdrop.remove();
    }
    box.querySelector('.modal-close-icon').onclick = cleanup;

    box.querySelectorAll('.btn-select-lang').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        const prevLang = state.language;
        state.language = lang;

        // If using default committee title/topic, auto-adapt to selected language
        const defaultNames = {
          en: 'United Nations Security Council',
          zh: '聯合國安全理事會 (UNSC)',
          fr: 'Conseil de sécurité des Nations unies'
        };
        const defaultAgendas = {
          en: 'Threats to international peace and security',
          zh: '對國際和平與安全之威脅',
          fr: 'Menaces contre la paix et la sécurité internationales'
        };
        if (Object.values(defaultNames).includes(state.committeeName)) {
          state.committeeName = defaultNames[lang] || defaultNames.zh;
        }
        if (Object.values(defaultAgendas).includes(state.agenda)) {
          state.agenda = defaultAgendas[lang] || defaultAgendas.zh;
        }

        updateAvailableCountriesPool();
        saveToLocalStorage();
        cleanup();
        renderAll();
      });
    });
  }


  function openAddSpeakerModal(onSelectCallback, keepOpen = false, queueType = 'mod') {
    const modal = document.getElementById('modal-add-speaker');
    const searchInput = document.getElementById('search-queue-speaker');
    const container = document.getElementById('list-selectable-speakers');
    const footer = document.getElementById('modal-add-speaker-footer');
    const statusText = document.getElementById('modal-add-speaker-status');
    const t = I18N[state.language] || I18N.en;

    const getQueueList = () => queueType === 'gsl' ? state.gslQueue : state.modQueue;

    searchInput.value = '';
    if (statusText) {
      if (keepOpen) {
        statusText.textContent = `${t.queued}: ${getQueueList().length}`;
        if (footer) footer.classList.remove('hidden');
      } else {
        statusText.textContent = '';
        if (footer) footer.classList.add('hidden');
      }
    }

    function renderSelectable() {
      container.innerHTML = '';
      const query = searchInput.value;
      const list = state.selectedCountries.filter(c => {
        return (c.attendance === 'present' || c.attendance === 'pv') && countryMatchesSearch(c, query);
      }).sort(countrySortCompare);

      if (list.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">${t.noMatchingDelegates}</div>`;
        return;
      }

      list.forEach(c => {
        const item = document.createElement('div');
        const queueList = getQueueList();
        const inQueueCount = keepOpen ? queueList.filter(m => m.id === c.id).length : 0;
        item.className = 'py-3 px-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl transition';
        item.innerHTML = `
          <div class="flex items-center space-x-3.5 min-w-0">
            <img src="${getFlagUrl(c)}" class="w-9 h-6 object-cover rounded-md shadow-sm border border-slate-700/30 shrink-0">
            <span class="text-sm sm:text-base font-bold text-slate-100 truncate">${getCountryDisplayName(c)}</span>
            ${inQueueCount > 0 ? `<span class="px-2 py-0.5 text-xs font-bold rounded-full bg-primary/20 text-primary shrink-0">#${inQueueCount}</span>` : ''}
          </div>
          <div class="flex items-center space-x-2 shrink-0 ml-2">
            ${c.powerStatus === 'observer' ? `<span class="text-xs text-slate-400">${t.observer}</span>` : ''}
            ${keepOpen ? `<button type="button" class="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-primary hover:text-white rounded-lg text-slate-200 transition">+ ${t.add}</button>` : ''}
          </div>
        `;
        item.addEventListener('click', (e) => {
          if (!keepOpen) {
            modal.classList.add('hidden');
            onSelectCallback(c);
          } else {
            onSelectCallback(c);
            if (statusText) statusText.textContent = `${t.queued}: ${getQueueList().length}`;
            renderSelectable();
          }
        });
        container.appendChild(item);
      });
    }

    searchInput.oninput = renderSelectable;
    renderSelectable();
    modal.classList.remove('hidden');
    searchInput.focus();
  }

  function openQRCodeModal() {
    const modal = document.getElementById('modal-qrcode-join');
    const qrContainer = document.getElementById('qrcode-container');
    const roomLabel = document.getElementById('label-qrcode-room');
    const linkInput = document.getElementById('input-qrcode-link');
    const closeBtn = document.getElementById('btn-close-qrcode-modal');
    const copyBtn = document.getElementById('btn-copy-qrcode-link');
    const t = I18N[state.language] || I18N.en;

    if (!modal || !qrContainer) return;

    // Ensure we have a valid room ID
    if (!state.roomId) {
      state.roomId = 'room-' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('MUN_ROOM_ID', state.roomId);
    }

    // Save current state immediately so delegates scanning will have instant data
    saveToLocalStorage(true);

    const fullUrl = `${window.location.origin}${window.location.pathname}?view=1&room=${encodeURIComponent(state.roomId)}`;
    
    if (roomLabel) roomLabel.textContent = state.roomId;
    if (linkInput) linkInput.value = fullUrl;

    // Clear and re-render QR Code
    qrContainer.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: fullUrl,
        width: 200,
        height: 200,
        colorDark: "#090d16",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      qrContainer.innerHTML = `<div class="p-4 text-xs text-rose-500 font-mono">QRCode library loading...<br><a href="${fullUrl}" target="_blank" class="underline">${fullUrl}</a></div>`;
    }

    modal.classList.remove('hidden');

    function cleanup() {
      modal.classList.add('hidden');
    }

    if (closeBtn) closeBtn.onclick = cleanup;
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };

    if (copyBtn && linkInput) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(fullUrl);
          showToast(t.linkCopied || '已複製觀看連結！', 'success');
        } catch (err) {
          linkInput.select();
          document.execCommand('copy');
          showToast(t.linkCopied || '已複製觀看連結！', 'success');
        }
      };
    }
  }

  // ================= UNIFIED SETTINGS CENTER CONTROLLER =================
  let settingsInitialized = false;

  function switchSettingsTab(tabKey) {
    const panels = {
      conference: document.getElementById('cfg-panel-conference'),
      rules: document.getElementById('cfg-panel-rules'),
      display: document.getElementById('cfg-panel-display'),
      sync: document.getElementById('cfg-panel-sync')
    };
    const buttons = {
      conference: document.getElementById('tab-btn-cfg-conference'),
      rules: document.getElementById('tab-btn-cfg-rules'),
      display: document.getElementById('tab-btn-cfg-display'),
      sync: document.getElementById('tab-btn-cfg-sync')
    };

    Object.keys(panels).forEach(k => {
      const panel = panels[k];
      const btn = buttons[k];
      if (panel) {
        panel.classList.toggle('hidden', k !== tabKey);
      }
      if (btn) {
        if (k === tabKey) {
          btn.className = 'cfg-nav-btn py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 border-white text-white flex items-center space-x-2 transition cursor-pointer';
        } else {
          btn.className = 'cfg-nav-btn py-3 px-3 text-xs sm:text-sm font-medium border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 flex items-center space-x-2 transition cursor-pointer';
        }
      }
    });
  }

  function openUnifiedSettingsModal(initialTab = 'conference') {
    const modal = document.getElementById('modal-unified-settings');
    if (!modal) return;

    if (!settingsInitialized) {
      initUnifiedSettingsModalEvents();
      settingsInitialized = true;
    }

    const t = I18N[state.language] || I18N.en;

    // Elements
    const inputCommittee = document.getElementById('cfg-input-committee');
    const inputAgenda = document.getElementById('cfg-input-agenda');
    const previewLogo = document.getElementById('cfg-preview-logo');
    const inputGslTime = document.getElementById('cfg-input-gsl-time');
    const inputModTotal = document.getElementById('cfg-input-mod-total');
    const inputModSpeaker = document.getElementById('cfg-input-mod-speaker');
    const inputUnmodMins = document.getElementById('cfg-input-unmod-mins');
    const selectVoteThreshold = document.getElementById('cfg-select-vote-threshold');
    const selectLanguage = document.getElementById('cfg-select-language');
    const sliderScale = document.getElementById('cfg-slider-scale');
    const labelScale = document.getElementById('cfg-label-scale');
    const swatchPreview = document.getElementById('cfg-swatch-preview');
    const authAvatar = document.getElementById('cfg-auth-avatar');
    const authName = document.getElementById('cfg-auth-name');
    const authEmail = document.getElementById('cfg-auth-email');
    const authBtn = document.getElementById('cfg-btn-auth-action');
    const syncStatusText = document.getElementById('cfg-sync-status-text');

    // Populate Current Values
    if (inputCommittee) inputCommittee.value = state.committeeName || '';
    if (inputAgenda) inputAgenda.value = state.agenda || '';
    
    // Logo preview
    const savedLogo = localStorage.getItem('mun-custom-logo');
    if (previewLogo) {
      previewLogo.src = savedLogo || 'logo.png';
    }

    // Rules
    if (inputGslTime) inputGslTime.value = state.gslDefaultTime || 90;
    if (inputModTotal) inputModTotal.value = state.modTotalMins || 10;
    if (inputModSpeaker) inputModSpeaker.value = state.modSpeakerSecs || 60;
    if (inputUnmodMins) inputUnmodMins.value = Math.ceil((state.unmodTotalSecs || 900) / 60);
    if (selectVoteThreshold) selectVoteThreshold.value = state.voteThreshold || 'simple';

    // Display
    if (selectLanguage) selectLanguage.value = state.language || 'zh';
    const isLight = document.body.classList.contains('light-mode');
    updateThemeModeButtons(isLight);

    const savedScale = parseFloat(localStorage.getItem('MUN_GLOBAL_CONTENT_SCALE')) || 1.0;
    if (sliderScale) sliderScale.value = savedScale;
    if (labelScale) labelScale.textContent = `${Math.round(savedScale * 100)}%`;

    const customAccent = localStorage.getItem('mun-custom-accent') || '#3683a8';
    if (swatchPreview) swatchPreview.style.backgroundColor = customAccent;

    // Auth & Sync status
    if (state.currentUser) {
      if (authAvatar) {
        authAvatar.innerHTML = `<img src="${state.currentUser.picture || 'https://lh3.googleusercontent.com/a/default-user'}" class="w-full h-full object-cover">`;
      }
      if (authName) authName.textContent = state.currentUser.name || '已登入使用者';
      if (authEmail) authEmail.textContent = state.currentUser.email || '';
      if (authBtn) {
        authBtn.textContent = '登出 (Sign Out)';
        authBtn.className = 'px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer';
      }
    } else {
      if (authAvatar) authAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
      if (authName) authName.textContent = '訪客模式 (未登入)';
      if (authEmail) authEmail.textContent = '登入 Google 帳號可享有跨裝置永久存檔';
      if (authBtn) {
        authBtn.textContent = '登入 Google';
        authBtn.className = 'px-4 py-2 bg-white text-zinc-900 hover:bg-zinc-200 rounded-xl text-xs font-bold transition shadow cursor-pointer';
      }
    }

    if (syncStatusText) {
      if (window.firebaseDb) {
        syncStatusText.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>Firebase 雲端已連線</span>';
        syncStatusText.className = 'text-xs text-emerald-400 flex items-center space-x-1.5 mt-0.5';
      } else {
        syncStatusText.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>本機離線模式</span>';
        syncStatusText.className = 'text-xs text-amber-400 flex items-center space-x-1.5 mt-0.5';
      }
    }

    // Switch to initial Tab
    switchSettingsTab(initialTab);

    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }

  function updateThemeModeButtons(light) {
    const btnDark = document.getElementById('cfg-btn-theme-dark');
    const btnLight = document.getElementById('cfg-btn-theme-light');
    if (btnDark && btnLight) {
      if (light) {
        btnLight.className = 'px-3 py-2.5 rounded-xl border border-zinc-500 text-xs font-bold transition flex items-center justify-center space-x-2 bg-white text-zinc-900 shadow cursor-pointer';
        btnDark.className = 'px-3 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold transition flex items-center justify-center space-x-2 bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer';
      } else {
        btnDark.className = 'px-3 py-2.5 rounded-xl border border-zinc-500 text-xs font-bold transition flex items-center justify-center space-x-2 bg-zinc-800 text-white shadow cursor-pointer';
        btnLight.className = 'px-3 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold transition flex items-center justify-center space-x-2 bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer';
      }
    }
  }

  function initUnifiedSettingsModalEvents() {
    const modal = document.getElementById('modal-unified-settings');
    const closeBtn = document.getElementById('btn-close-settings-modal');
    const doneBtn = document.getElementById('btn-save-settings-done');

    function closeSettings() {
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
      if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) {
        saveToLocalStorage(true);
      }
      if (typeof renderAll === 'function') renderAll();
    }

    if (closeBtn) closeBtn.onclick = closeSettings;
    if (doneBtn) doneBtn.onclick = closeSettings;
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) closeSettings();
      };
    }

    // Tabs
    const tabBtns = [
      { id: 'tab-btn-cfg-conference', key: 'conference' },
      { id: 'tab-btn-cfg-rules', key: 'rules' },
      { id: 'tab-btn-cfg-display', key: 'display' },
      { id: 'tab-btn-cfg-sync', key: 'sync' }
    ];
    tabBtns.forEach(t => {
      const btn = document.getElementById(t.id);
      if (btn) btn.onclick = () => switchSettingsTab(t.key);
    });

    // Conference Inputs
    const inputCommittee = document.getElementById('cfg-input-committee');
    if (inputCommittee) {
      inputCommittee.addEventListener('input', (e) => {
        state.committeeName = e.target.value;
        const headerComm = document.getElementById('header-committee-input');
        if (headerComm) headerComm.value = e.target.value;
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
      });
    }

    const selectGa = document.getElementById('cfg-select-ga');
    if (selectGa) {
      selectGa.addEventListener('change', (e) => {
        const gaMap = {
          ga_plenary: 'UNGA 全體大會',
          ga1: 'GA1 裁軍安全 (DISEC)',
          ga2: 'GA2 經濟金融 (ECOFIN)',
          ga3: 'GA3 社會人道 (SOCHUM)',
          ga4: 'GA4 特別政治 (SPECPOL)',
          ga5: 'GA5 行政預算',
          ga6: 'GA6 法律委員會 (Legal)',
          unsc: '聯合國安全理事會 (UNSC)'
        };
        const title = gaMap[e.target.value];
        if (title) {
          state.committeeName = title;
          if (inputCommittee) inputCommittee.value = title;
          const headerComm = document.getElementById('header-committee-input');
          if (headerComm) headerComm.value = title;
          if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
        }
      });
    }

    const inputAgenda = document.getElementById('cfg-input-agenda');
    if (inputAgenda) {
      inputAgenda.addEventListener('input', (e) => {
        state.agenda = e.target.value;
        const headerAgenda = document.getElementById('header-agenda-input');
        if (headerAgenda) headerAgenda.value = e.target.value;
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
      });
    }

    // Logo Upload & Reset
    const btnUploadLogo = document.getElementById('cfg-btn-upload-logo');
    const btnResetLogo = document.getElementById('cfg-btn-reset-logo');
    const inputLogoFile = document.getElementById('input-logo-file');
    const previewLogo = document.getElementById('cfg-preview-logo');

    if (btnUploadLogo && inputLogoFile) {
      btnUploadLogo.onclick = () => inputLogoFile.click();
    }
    if (btnResetLogo) {
      btnResetLogo.onclick = () => {
        localStorage.removeItem('mun-custom-logo');
        if (previewLogo) previewLogo.src = 'logo.png';
        const mainLogo = document.querySelector('#btn-logo-home img');
        if (mainLogo) mainLogo.src = 'logo.png';
        showToast('已還原為預設 Logo 圖標', 'info');
      };
    }

    // Rules Inputs
    const inputGslTime = document.getElementById('cfg-input-gsl-time');
    if (inputGslTime) {
      inputGslTime.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10) || 90;
        state.gslDefaultTime = val;
        state.gslRemainingTime = val;
        const label = document.getElementById('label-gsl-default-time');
        if (label) label.textContent = `${val}s`;
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
      });
    }

    document.querySelectorAll('.btn-gsl-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-gsl-preset'), 10) || 90;
        if (inputGslTime) inputGslTime.value = val;
        state.gslDefaultTime = val;
        state.gslRemainingTime = val;
        const label = document.getElementById('label-gsl-default-time');
        if (label) label.textContent = `${val}s`;
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
      });
    });

    const inputModTotal = document.getElementById('cfg-input-mod-total');
    if (inputModTotal) {
      inputModTotal.addEventListener('change', (e) => {
        state.modTotalMins = parseInt(e.target.value, 10) || 10;
        state.modTotalSecsRemaining = state.modTotalMins * 60;
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
      });
    }

    const inputModSpeaker = document.getElementById('cfg-input-mod-speaker');
    if (inputModSpeaker) {
      inputModSpeaker.addEventListener('change', (e) => {
        state.modSpeakerSecs = parseInt(e.target.value, 10) || 60;
        state.modSpeakerSecsRemaining = state.modSpeakerSecs;
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
      });
    }

    const inputUnmodMins = document.getElementById('cfg-input-unmod-mins');
    if (inputUnmodMins) {
      inputUnmodMins.addEventListener('change', (e) => {
        const mins = parseInt(e.target.value, 10) || 15;
        state.unmodTotalSecs = mins * 60;
        state.unmodSecsRemaining = state.unmodTotalSecs;
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
      });
    }

    const selectVoteThreshold = document.getElementById('cfg-select-vote-threshold');
    if (selectVoteThreshold) {
      selectVoteThreshold.addEventListener('change', (e) => {
        state.voteThreshold = e.target.value;
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true);
      });
    }

    // Display Inputs
    const selectLanguage = document.getElementById('cfg-select-language');
    if (selectLanguage) {
      selectLanguage.addEventListener('change', (e) => {
        const lang = e.target.value;
        state.language = lang;
        if (typeof updateAvailableCountriesPool === 'function') updateAvailableCountriesPool();
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage();
        if (typeof renderAll === 'function') renderAll();
      });
    }

    const btnThemeDark = document.getElementById('cfg-btn-theme-dark');
    const btnThemeLight = document.getElementById('cfg-btn-theme-light');
    if (btnThemeDark) {
      btnThemeDark.onclick = () => {
        document.body.classList.remove('light-mode');
        localStorage.setItem('mun-theme', 'dark');
        updateThemeModeButtons(false);
        const icon = document.getElementById('theme-icon');
        if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
        const headerIcon = document.getElementById('header-theme-icon');
        if (headerIcon) { headerIcon.classList.remove('fa-moon'); headerIcon.classList.add('fa-sun'); }
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true, true);
      };
    }
    if (btnThemeLight) {
      btnThemeLight.onclick = () => {
        document.body.classList.add('light-mode');
        localStorage.setItem('mun-theme', 'light');
        updateThemeModeButtons(true);
        const icon = document.getElementById('theme-icon');
        if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
        const headerIcon = document.getElementById('header-theme-icon');
        if (headerIcon) { headerIcon.classList.remove('fa-sun'); headerIcon.classList.add('fa-moon'); }
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) saveToLocalStorage(true, true);
      };
    }

    // Scale slider
    const sliderScale = document.getElementById('cfg-slider-scale');
    const labelScale = document.getElementById('cfg-label-scale');
    const btnResetScale = document.getElementById('cfg-btn-reset-scale');
    const mainEl = document.querySelector('main');

    function applyScale(val) {
      const num = parseFloat(val) || 1.0;
      if (labelScale) labelScale.textContent = `${Math.round(num * 100)}%`;
      if (mainEl) mainEl.style.setProperty('--content-scale', num);
      localStorage.setItem('MUN_GLOBAL_CONTENT_SCALE', num);
      const drawerSlider = document.getElementById('slider-global-scale');
      const drawerLabel = document.getElementById('label-global-scale');
      if (drawerSlider) drawerSlider.value = num;
      if (drawerLabel) drawerLabel.textContent = `${Math.round(num * 100)}%`;
    }

    if (sliderScale) {
      sliderScale.addEventListener('input', (e) => applyScale(e.target.value));
    }
    if (btnResetScale) {
      btnResetScale.onclick = () => {
        if (sliderScale) sliderScale.value = 1.0;
        applyScale(1.0);
      };
    }

    // Color palette button
    const btnOpenPalette = document.getElementById('cfg-btn-open-palette');
    if (btnOpenPalette) {
      btnOpenPalette.onclick = () => {
        if (typeof openCustomColorModal === 'function') openCustomColorModal();
      };
    }

    // Sync & Auth
    const authBtn = document.getElementById('cfg-btn-auth-action');
    if (authBtn) {
      authBtn.onclick = () => {
        if (state.currentUser) {
          const logoutBtn = document.getElementById('btn-google-logout');
          if (logoutBtn) logoutBtn.click();
          closeSettings();
        } else {
          const loginBtn = document.getElementById('btn-google-login');
          if (loginBtn) loginBtn.click();
          closeSettings();
        }
      };
    }

    const btnSyncNow = document.getElementById('cfg-btn-sync-now');
    if (btnSyncNow) {
      btnSyncNow.onclick = () => {
        if (typeof saveToCloudKV === 'function') {
          saveToCloudKV(getFullStatePayload(), true);
        }
      };
    }

    const btnExport = document.getElementById('cfg-btn-export-file');
    if (btnExport) {
      btnExport.onclick = () => {
        const dExport = document.getElementById('drawer-btn-export');
        if (dExport) dExport.click();
      };
    }

    const btnImport = document.getElementById('cfg-btn-import-file');
    if (btnImport) {
      btnImport.onclick = () => {
        const dImport = document.getElementById('drawer-btn-import');
        if (dImport) dImport.click();
      };
    }

    const btnResetConf = document.getElementById('cfg-btn-reset-conference');
    if (btnResetConf) {
      btnResetConf.onclick = () => {
        customConfirm('重置會議', '確定要將會議重置為預設空白範本嗎？現有代表名單、點名與發言紀錄將被清除。', () => {
          if (typeof resetStateToDefaults === 'function') {
            resetStateToDefaults();
          }
          if (typeof updateAvailableCountriesPool === 'function') updateAvailableCountriesPool();
          if (typeof saveToLocalStorage === 'function') saveToLocalStorage(true);
          if (typeof renderAll === 'function') renderAll();
          closeSettings();
          showToast('會議已重置為預設範本', 'info');
        });
      };
    }
  }

  window.openUnifiedSettingsModal = openUnifiedSettingsModal;

