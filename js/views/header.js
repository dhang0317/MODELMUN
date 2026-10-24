  function renderAll() {
    renderLanguageTexts();
    renderHeader();
    renderSetupView();
    renderGslView();
    renderModView();
    renderUnmodView();
    renderSingleSpeakerView();
    renderMotionsView();
    renderVotingView();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderLanguageTexts() {
    const t = I18N[state.language] || I18N.zh || I18N.en || {};
    const drawerLang = document.getElementById('label-current-lang');
    if (drawerLang) drawerLang.textContent = state.language.toUpperCase();
    const headerLang = document.getElementById('header-lang-label');
    if (headerLang) headerLang.textContent = state.language.toUpperCase();

    // Universal tag translation for all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    // Translate placeholder attributes if any
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key]) {
        el.placeholder = t[key];
      }
    });

    // Header labels fallback / sync
    const presEl = document.getElementById('stat-present');
    if (presEl && presEl.previousElementSibling) presEl.previousElementSibling.textContent = t.present;
    const pvEl = document.getElementById('stat-pv');
    if (pvEl && pvEl.previousElementSibling) pvEl.previousElementSibling.textContent = t.pv;
    const qEl = document.getElementById('stat-quorum');
    if (qEl && qEl.previousElementSibling) qEl.previousElementSibling.textContent = t.quorum;
    const mEl = document.getElementById('stat-majority');
    if (mEl && mEl.previousElementSibling) mEl.previousElementSibling.textContent = t.majority;
    const twEl = document.getElementById('stat-twothirds');
    if (twEl && twEl.previousElementSibling) twEl.previousElementSibling.textContent = t.twoThirds;

    // Translate Majority Rule Select Options if select element exists
    const threshSelect = document.getElementById('select-vote-threshold');
    if (threshSelect && threshSelect.options && threshSelect.options.length >= 3) {
      if (state.language === 'zh') {
        threshSelect.options[0].text = '簡單多數決 (50% + 1)';
        threshSelect.options[1].text = '絕對多數決 (2/3)';
        threshSelect.options[2].text = '安理會常任決 (9/15)';
      } else if (state.language === 'fr') {
        threshSelect.options[0].text = 'Majorité simple (50% + 1)';
        threshSelect.options[1].text = 'Majorité des deux tiers (2/3)';
        threshSelect.options[2].text = 'Conseil de sécurité (9/15)';
      } else {
        threshSelect.options[0].text = 'Simple Majority (50% + 1)';
        threshSelect.options[1].text = 'Two-Thirds Majority (2/3)';
        threshSelect.options[2].text = 'Security Council (9/15)';
      }
    }

    // Translate Motion Type Select Options
    const motionTypeSelect = document.getElementById('select-motion-type');
    if (motionTypeSelect && motionTypeSelect.options) {
      const typeTextMap = {
        zh: {
          mod: '主持核心磋商',
          unmod: '非主持核心磋商',
          gsl: '常設發言名單',
          singlespeaker: '介紹決議案草案',
          amendment: '介紹修正案',
          suspend: '休會',
          close: '結束辯論',
          adjourn: '全會結束'
        },
        fr: {
          mod: 'Caucus Modéré',
          unmod: 'Caucus Non-Modéré',
          gsl: 'Liste Générale des Orateurs',
          singlespeaker: 'Présentation du Projet de Résolution',
          amendment: 'Présentation des Amendements',
          suspend: 'Suspension de la séance (Recess)',
          close: 'Clôture du Débat',
          adjourn: 'Ajournement de la session'
        },
        en: {
          mod: 'Moderated Caucus',
          unmod: 'Unmoderated Caucus',
          gsl: "General Speakers' List",
          singlespeaker: 'Introduce Draft Resolution',
          amendment: 'Introduce Amendment',
          suspend: 'Suspension / Recess',
          close: 'Closure of Debate',
          adjourn: 'Adjournment of Meeting'
        }
      };
      const curLang = state.language === 'zh' ? 'zh' : (state.language === 'fr' ? 'fr' : 'en');
      Array.from(motionTypeSelect.options).forEach(opt => {
        if (typeTextMap[curLang] && typeTextMap[curLang][opt.value]) {
          opt.text = typeTextMap[curLang][opt.value];
        }
      });
    }

    // Sync tab button texts dynamically
    const tabKeyMap = {
      rollcall: 'tabRollCall',
      mod: 'tabMod',
      unmod: 'tabUnmod',
      gsl: 'tabGsl',
      motions: 'tabMotions',
      vote: 'tabVote'
    };
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      const key = tabKeyMap[tab];
      if (key && t[key]) {
        const span = btn.querySelector('span');
        if (span) span.textContent = t[key];
      }
    });

    // Sync drawer user menu name if logged in
    const userMenuName = document.getElementById('user-menu-name');
    if (userMenuName && state.currentUser) {
      userMenuName.textContent = `${t.googleLogout} (${state.currentUser.name || ''})`;
    }
  }

  function renderHeader() {
    const stats = computeStats();
    const t = I18N[state.language] || I18N.en;
    const headerCommInput = document.getElementById('header-committee-input');
    if (headerCommInput && document.activeElement !== headerCommInput) {
      headerCommInput.value = state.committeeName || '';
    }
    const headerAgendaInput = document.getElementById('header-agenda-input');
    if (headerAgendaInput && document.activeElement !== headerAgendaInput) {
      headerAgendaInput.value = state.agenda || '';
    }

    document.getElementById('stat-present').textContent = stats.presentCount;
    document.getElementById('stat-pv').textContent = stats.pvCount;
    document.getElementById('stat-quorum').textContent = stats.quorum;
    document.getElementById('stat-majority').textContent = stats.majority;
    document.getElementById('stat-twothirds').textContent = stats.twoThirds;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (tab === state.currentTab) {
        btn.classList.add('tab-active');
      } else {
        btn.classList.remove('tab-active');
      }
    });

    // Handle Viewer Mode UI tweaks
    const viewerBadge = document.getElementById('badge-viewer-mode');
    const qrBtn = document.getElementById('btn-open-qrcode');
    const drawerBtn = document.getElementById('btn-open-drawer');
    const logoHomeBtn = document.getElementById('btn-logo-home');

    if (state.isViewerMode) {
      if (viewerBadge) viewerBadge.classList.remove('hidden');
      if (viewerBadge) viewerBadge.classList.add('flex');
      if (qrBtn) qrBtn.classList.add('hidden');
      if (drawerBtn) drawerBtn.classList.add('hidden');
      if (headerCommInput) headerCommInput.setAttribute('readonly', 'true');
      if (headerAgendaInput) headerAgendaInput.setAttribute('readonly', 'true');
      if (logoHomeBtn) logoHomeBtn.style.pointerEvents = 'none';
      document.body.classList.add('is-viewer-mode');
    } else {
      if (viewerBadge) viewerBadge.classList.add('hidden');
      if (viewerBadge) viewerBadge.classList.remove('flex');
      if (qrBtn) qrBtn.classList.remove('hidden');
      if (drawerBtn) drawerBtn.classList.remove('hidden');
      if (headerCommInput) headerCommInput.removeAttribute('readonly');
      if (headerAgendaInput) headerAgendaInput.removeAttribute('readonly');
      if (logoHomeBtn) logoHomeBtn.style.pointerEvents = '';
      document.body.classList.remove('is-viewer-mode');
    }
  }


  function formatMinutesSeconds(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function formatTimerDisplay(elemId, totalSecs) {
    const elem = document.getElementById(elemId);
    if (elem) elem.textContent = formatMinutesSeconds(totalSecs);
  }
