  function renderSetupView() {
    const t = I18N[state.language] || I18N.en;
    const badgeAvail = document.getElementById('badge-available-count');
    if (badgeAvail) badgeAvail.textContent = state.availableCountries.length;
    const badgeSelected = document.getElementById('badge-selected-count');
    if (badgeSelected) badgeSelected.textContent = state.selectedCountries.length;

    const commNameInput = document.getElementById('input-committee-name') || document.getElementById('header-committee-input');
    if (commNameInput && document.activeElement !== commNameInput) {
      commNameInput.value = state.committeeName;
    }
    const agendaInput = document.getElementById('input-agenda-title') || document.getElementById('header-agenda-input');
    if (agendaInput && document.activeElement !== agendaInput) {
      agendaInput.value = state.agenda;
    }

    const segTemplate = document.getElementById('segment-btn-template');
    const segFile = document.getElementById('segment-btn-file');
    const pTemplate = document.getElementById('panel-setup-template');
    const pFile = document.getElementById('panel-setup-file');

    if (segFile && segTemplate && pFile && pTemplate) {
      if (state.setupSegment === 'file') {
        segFile.classList.add('active-segment');
        segTemplate.classList.remove('active-segment');
        pFile.classList.remove('hidden');
        pTemplate.classList.add('hidden');
      } else {
        segTemplate.classList.add('active-segment');
        segFile.classList.remove('active-segment');
        pTemplate.classList.remove('hidden');
        pFile.classList.add('hidden');
      }
    }

    const availContainer = document.getElementById('list-available-countries');
    if (!availContainer) return;
    const searchInput = document.getElementById('search-countries');
    const searchVal = searchInput ? (searchInput.value || '') : '';
    
    availContainer.innerHTML = '';
    const filteredAvail = state.availableCountries.filter(c => countryMatchesSearch(c, searchVal));

    if (filteredAvail.length === 0) {
      availContainer.innerHTML = `<div class="p-6 text-center text-sm text-slate-400">${t.noMatchingCountries}</div>`;
    } else {
      filteredAvail.forEach(c => {
        const row = document.createElement('div');
        row.className = 'py-3.5 px-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl transition';
        row.innerHTML = `
          <div class="flex items-center space-x-3.5 min-w-0">
            <img src="${getFlagUrl(c)}" class="w-10 h-7 object-cover rounded shadow border border-slate-700/40 shrink-0">
            <span class="text-base sm:text-lg font-bold text-slate-100 truncate">${getCountryDisplayName(c)}</span>
            <span class="text-xs text-slate-400 font-mono shrink-0">(${c.id})</span>
          </div>
          <button class="btn-add-country-item px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 ml-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">＋</button>
        `;
        row.addEventListener('click', () => {
          selectCountry(c);
        });
        availContainer.appendChild(row);
      });
    }

    const selectedContainer = document.getElementById('list-selected-countries');
    if (!selectedContainer) return;
    selectedContainer.innerHTML = '';
    if (state.selectedCountries.length === 0) {
      selectedContainer.innerHTML = `<div class="p-6 text-center text-sm text-slate-400">${t.noDelegatesSelected}</div>`;
    } else {
      const t = I18N[state.language] || I18N.en;
      state.selectedCountries.forEach((c, idx) => {
        const row = document.createElement('div');
        row.className = 'py-3.5 px-3.5 flex items-center justify-between hover:bg-slate-50 rounded-xl transition';
        
        let powerBadge = '';
        if (c.powerStatus === 'observer') {
          powerBadge = `<span class="cursor-pointer text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600" title="Click to cycle status">${t.observer}</span>`;
        }

        row.innerHTML = `
          <div class="flex items-center space-x-3.5 min-w-0">
            <img src="${getFlagUrl(c)}" class="w-10 h-7 object-cover rounded shadow border border-slate-700/40 shrink-0">
            <span class="text-base sm:text-lg font-bold text-slate-100 truncate">${getCountryDisplayName(c)}</span>
          </div>
          <div class="flex items-center space-x-2.5 shrink-0 ml-2">
            ${powerBadge ? `<div class="status-toggle-btn">${powerBadge}</div>` : ''}
            <button class="btn-remove-country px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/30">✕</button>
          </div>
        `;

        const statusToggle = row.querySelector('.status-toggle-btn');
        if (statusToggle) {
          statusToggle.addEventListener('click', () => {
            if (c.powerStatus === 'observer') c.powerStatus = 'normal';
            else c.powerStatus = 'observer';
            saveToLocalStorage();
            renderAll();
          });
        }

        row.querySelector('.btn-remove-country').addEventListener('click', (e) => {
          e.stopPropagation();
          deselectCountry(idx);
        });

        selectedContainer.appendChild(row);
      });
    }
  }

  function selectCountry(c) {
    if (state.isViewerMode) return;
    state.selectedCountries.push(c);
    state.selectedCountries.sort(countrySortCompare);
    updateAvailableCountriesPool();
    saveToLocalStorage();
    renderAll();
  }

  function deselectCountry(index) {
    if (state.isViewerMode) return;
    state.selectedCountries.splice(index, 1);
    updateAvailableCountriesPool();
    saveToLocalStorage();
    renderAll();
  }

  // --- GSL VIEW ---