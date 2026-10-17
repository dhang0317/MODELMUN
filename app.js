// MUN Command - Modular Entry Point
function playBeep(f = 880, d = 0.25) {}
function playAlertChime() {}

  function init() {
    loadFromLocalStorage();

    const rawList = window.MUN_COUNTRIES || [];
    state.availableCountries = rawList.map(c => ({
      id: c.id,
      countryName: c.name_en || c.name || c.id,
      name_en: c.name_en,
      name_zh: c.name_zh,
      name_fr: c.name_fr,
      countryUrl: c.countryUrl,
      attendance: 'uncalled', 
      powerStatus: (c.id === 'USA' || c.id === 'RUS' || c.id === 'CHN' || c.id === 'GBR' || c.id === 'FRA') ? 'veto' : 'normal',
      vote: 'none',
      hasRights: false
    })).sort(countrySortCompare);

    updateAvailableCountriesPool();

    renderAll();
    setupEventListeners();
    initTheme();

    if (window.P2PSync) {
      window.P2PSync.init();
    }

    if (state.isViewerMode) {
      const portalModal = document.getElementById('modal-portal-landing');
      if (portalModal) {
        portalModal.classList.add('portal-hidden');
        portalModal.style.display = 'none';
      }
      // Delegate Viewer Mode: default to roll call or gsl view if in setup
      if (state.currentTab === 'setup') {
        switchTab('rollcall');
      }
      startViewerPolling();
    } else {
      initGoogleAuth();
    }
  }

  function updateAvailableCountriesPool() {
    const selectedIds = new Set(state.selectedCountries.map(c => c.id));
    state.availableCountries = (window.MUN_COUNTRIES || []).map(c => ({
      id: c.id,
      countryName: c.name_en || c.name || c.id,
      name_en: c.name_en,
      name_zh: c.name_zh,
      name_fr: c.name_fr,
      countryUrl: c.countryUrl,
      attendance: 'uncalled',
      powerStatus: 'normal',
      vote: 'none',
      hasRights: false
    })).filter(c => !selectedIds.has(c.id))
      .sort(countrySortCompare);
  }

  function applyPreset(presetKey) {
    const presetLookupKey = presetKey.startsWith('ga') ? 'ga' : presetKey;
    const ids = (window.MUN_PRESETS && window.MUN_PRESETS[presetLookupKey]) || (presetKey.startsWith('ga') && window.MUN_PRESETS && window.MUN_PRESETS['ga']) || [];
    const all = (window.MUN_COUNTRIES || []).map(c => ({
      id: c.id,
      countryName: c.name_en || c.name || c.id,
      name_en: c.name_en,
      name_zh: c.name_zh,
      name_fr: c.name_fr,
      countryUrl: c.countryUrl,
      attendance: 'uncalled',
      powerStatus: 'normal',
      vote: 'none',
      hasRights: false
    }));

    state.selectedCountries = all.filter(c => ids.includes(c.id))
      .sort(countrySortCompare);

    const titles = {
      unsc: state.language === 'zh' ? '聯合國安全理事會 (UNSC)' : (state.language === 'fr' ? 'Conseil de sécurité des Nations unies' : 'United Nations Security Council'),
      ga: state.language === 'zh' ? '聯合國大會 (UNGA 全體會議)' : (state.language === 'fr' ? 'Assemblée générale des Nations unies (Plénière)' : 'UN General Assembly (Plenary)'),
      ga_plenary: state.language === 'zh' ? '聯合國大會 (UNGA 全體會議)' : (state.language === 'fr' ? 'Assemblée générale des Nations unies (Plénière)' : 'UN General Assembly (Plenary)'),
      ga1: state.language === 'zh' ? '裁軍與國際安全委員會 (GA1 - DISEC)' : (state.language === 'fr' ? 'Première Commission: Désarmement et sécurité internationale (GA1 - DISEC)' : 'General Assembly First Committee (GA1 - DISEC)'),
      ga2: state.language === 'zh' ? '經濟和金融委員會 (GA2 - ECOFIN)' : (state.language === 'fr' ? 'Deuxième Commission: Économique et financière (GA2 - ECOFIN)' : 'General Assembly Second Committee (GA2 - ECOFIN)'),
      ga3: state.language === 'zh' ? '社會、人道主義和文化委員會 (GA3 - SOCHUM)' : (state.language === 'fr' ? 'Troisième Commission: Sociale, humanitaire et culturelle (GA3 - SOCHUM)' : 'General Assembly Third Committee (GA3 - SOCHUM)'),
      ga4: state.language === 'zh' ? '特別政治和非殖民化委員會 (GA4 - SPECPOL)' : (state.language === 'fr' ? 'Quatrième Commission: Questions politiques spéciales et décolonisation (GA4 - SPECPOL)' : 'General Assembly Fourth Committee (GA4 - SPECPOL)'),
      ga5: state.language === 'zh' ? '行政和預算委員會 (GA5)' : (state.language === 'fr' ? 'Cinquième Commission: Questions administratives et budgétaires (GA5)' : 'General Assembly Fifth Committee (GA5)'),
      ga6: state.language === 'zh' ? '法律委員會 (GA6 - Legal)' : (state.language === 'fr' ? 'Sixième Commission: Juridique (GA6)' : 'General Assembly Sixth Committee (GA6 - Legal)'),
      unicef: state.language === 'zh' ? '聯合國兒童基金會 (UNICEF)' : 'UNICEF Executive Board',
      who: state.language === 'zh' ? '世界衛生組織 (WHO)' : 'World Health Organization Executive Board',
      unhrc: state.language === 'zh' ? '聯合國人權理事會 (UNHRC)' : 'United Nations Human Rights Council',
      unhcr: state.language === 'zh' ? '聯合國難民署 (UNHCR)' : 'United Nations High Commissioner for Refugees',
      ecosoc: state.language === 'zh' ? '經濟及社會理事會 (ECOSOC)' : 'Economic and Social Council',
      g20: state.language === 'zh' ? '二十國集團 (G20)' : 'Group of Twenty',
      nato: state.language === 'zh' ? '北大西洋公約組織 (NATO)' : 'North Atlantic Treaty Organization',
      asean: state.language === 'zh' ? '東南亞國家協會 (ASEAN)' : 'Association of Southeast Asian Nations',
      eu: state.language === 'zh' ? '歐洲聯盟 (EU)' : 'European Union',
      au: state.language === 'zh' ? '非洲聯盟 (AU)' : 'African Union'
    };

    if (titles[presetKey]) {
      state.committeeName = titles[presetKey];
      const titleInput = document.getElementById('input-committee-name');
      if (titleInput) titleInput.value = state.committeeName;
      const headerTitleInput = document.getElementById('header-committee-input');
      if (headerTitleInput) headerTitleInput.value = state.committeeName;
      if (presetKey === 'unsc') state.voteThreshold = 'unsc9';
      else state.voteThreshold = 'simple';
      const threshElem = document.getElementById('select-vote-threshold');
      if (threshElem) threshElem.value = state.voteThreshold;
    }

    updateAvailableCountriesPool();
    saveToLocalStorage();
    renderAll();
  }


window.addEventListener('DOMContentLoaded', init);
