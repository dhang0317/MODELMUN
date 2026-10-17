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
    const t = I18N[state.language] || I18N.en;
    document.getElementById('label-current-lang').textContent = state.language.toUpperCase();

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

    // Translate Majority Rule Select Options
    const threshSelect = document.getElementById('select-vote-threshold');
    if (threshSelect && threshSelect.options.length >= 3) {
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
    if (motionTypeSelect && motionTypeSelect.options.length >= 7) {
      if (state.language === 'zh') {
        motionTypeSelect.options[0].text = '全會結束';
        motionTypeSelect.options[1].text = '休會動議 - 本日結束 (Adjournment for the Day)';
        motionTypeSelect.options[2].text = '暫停會議動議 (Suspension)';
        motionTypeSelect.options[3].text = '非主持核心磋商 (Unmoderated Caucus)';
        motionTypeSelect.options[4].text = '主持核心磋商 (Moderated Caucus)';
        motionTypeSelect.options[5].text = '介紹決議案草案及修正案 (Introduce DR & Amendments)';
        motionTypeSelect.options[6].text = '結束辯論動議 (Closure of Debate)';
      } else if (state.language === 'fr') {
        motionTypeSelect.options[0].text = 'Ajournement de la session (Clôture)';
        motionTypeSelect.options[1].text = 'Ajournement de la séance (Fin de journée)';
        motionTypeSelect.options[2].text = 'Suspension de la séance';
        motionTypeSelect.options[3].text = 'Caucus Non-Modéré';
        motionTypeSelect.options[4].text = 'Caucus Modéré';
        motionTypeSelect.options[5].text = 'Présentation du Projet de Résolution et Amendements';
        motionTypeSelect.options[6].text = 'Clôture du Débat';
      } else {
        motionTypeSelect.options[0].text = 'Adjournment of the Meeting (Session Close)';
        motionTypeSelect.options[1].text = 'Adjournment for the Day';
        motionTypeSelect.options[2].text = 'Suspension of the Meeting (Recess)';
        motionTypeSelect.options[3].text = 'Unmoderated Caucus';
        motionTypeSelect.options[4].text = 'Moderated Caucus';
        motionTypeSelect.options[5].text = 'Introduce Draft Resolution & Amendments';
        motionTypeSelect.options[6].text = 'Closure of Debate';
      }
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
