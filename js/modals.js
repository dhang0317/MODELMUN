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
