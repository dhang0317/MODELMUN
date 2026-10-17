  function renderSetupView() {
    const t = I18N[state.language] || I18N.en;
    document.getElementById('badge-available-count').textContent = state.availableCountries.length;
    document.getElementById('badge-selected-count').textContent = state.selectedCountries.length;

    const commNameInput = document.getElementById('input-committee-name');
    if (commNameInput && document.activeElement !== commNameInput) {
      commNameInput.value = state.committeeName;
    }
    const agendaInput = document.getElementById('input-agenda-title');
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
    const searchVal = document.getElementById('search-countries').value || '';
    
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
          <button class="btn-add-country-item p-1.5 hover:opacity-80 text-white rounded-lg shrink-0 ml-2" style="background: transparent !important; border: none !important;"><i data-lucide="plus" class="w-5 h-5"></i></button>
        `;
        row.addEventListener('click', () => {
          selectCountry(c);
        });
        availContainer.appendChild(row);
      });
    }

    const selectedContainer = document.getElementById('list-selected-countries');
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
        } else {
          powerBadge = `<span class="cursor-pointer text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/25 text-white hover:bg-emerald-500/35 border border-emerald-500/50" title="Click to cycle status">${t.delegate}</span>`;
        }

        row.innerHTML = `
          <div class="flex items-center space-x-3.5 min-w-0">
            <img src="${getFlagUrl(c)}" class="w-10 h-7 object-cover rounded shadow border border-slate-700/40 shrink-0">
            <span class="text-base sm:text-lg font-bold text-slate-100 truncate">${getCountryDisplayName(c)}</span>
          </div>
          <div class="flex items-center space-x-2.5 shrink-0 ml-2">
            <div class="status-toggle-btn">${powerBadge}</div>
            <button class="btn-remove-country p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
        `;

        row.querySelector('.status-toggle-btn').addEventListener('click', () => {
          if (c.powerStatus === 'observer') c.powerStatus = 'normal';
          else c.powerStatus = 'observer';
          saveToLocalStorage();
          renderAll();
        });

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