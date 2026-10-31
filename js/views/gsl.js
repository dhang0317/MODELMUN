  function renderSpeakingSubtabs() {
    const validSubtabs = ['gsl', 'mod', 'intro', 'procon'];
    if (!state.speakingSubtab || !validSubtabs.includes(state.speakingSubtab)) {
      state.speakingSubtab = 'gsl';
    }

    const pGsl = document.getElementById('panel-speaking-gsl');
    const pMod = document.getElementById('panel-speaking-mod');
    const pIntro = document.getElementById('panel-speaking-intro');
    const pProcon = document.getElementById('panel-speaking-procon');

    const btnGsl = document.getElementById('btn-speaking-subtab-gsl');
    const btnMod = document.getElementById('btn-speaking-subtab-mod');
    const btnIntro = document.getElementById('btn-speaking-subtab-intro');
    const btnProcon = document.getElementById('btn-speaking-subtab-procon');

    const sub = state.speakingSubtab;

    // Toggle panels visibility
    if (pGsl) pGsl.classList.toggle('hidden', sub !== 'gsl');
    if (pMod) pMod.classList.toggle('hidden', sub !== 'mod');
    if (pIntro) pIntro.classList.toggle('hidden', sub !== 'intro');
    if (pProcon) pProcon.classList.toggle('hidden', sub !== 'procon');

    // Update active button styling
    const updateBtn = (btn, isActive) => {
      if (!btn) return;
      btn.className = `speaking-subtab-btn w-full text-center px-3 py-2.5 rounded-lg text-xs transition cursor-pointer ${
        isActive ? 'subtab-active font-bold' : 'font-medium'
      }`;
    };

    updateBtn(btnGsl, sub === 'gsl');
    updateBtn(btnMod, sub === 'mod');
    updateBtn(btnIntro, sub === 'intro');
    updateBtn(btnProcon, sub === 'procon');
  }

  function renderGslView() {
    renderSpeakingSubtabs();
    renderProConView();
    if (typeof renderModView === 'function') renderModView();
    if (typeof renderSingleSpeakerView === 'function') renderSingleSpeakerView();

    const emptyDiv = document.getElementById('gsl-current-empty');
    const activeDiv = document.getElementById('gsl-current-active');
    const t = I18N[state.language] || I18N.en;
    const labelTime = document.getElementById('label-gsl-default-time');
    if (labelTime) labelTime.textContent = `${state.gslDefaultTime}s`;

    const stats = computeStats();
    if (stats.presentCount === 0 && state.selectedCountries.length > 0) {
      emptyDiv.innerHTML = `
        <p class="text-base font-bold text-amber-600">${t.rollCallFirstWarning}</p>
        <button id="btn-rollcall-warning" class="mt-2 text-xs text-primary underline font-semibold">${t.conductRollCall}</button>
      `;
      const warnBtn = document.getElementById('btn-rollcall-warning');
      if (warnBtn) warnBtn.addEventListener('click', () => switchTab('rollcall'));
    }

    formatTimerDisplay('gsl-timer-display', state.gslRemainingTime);
    const pct = Math.max(0, Math.min(100, (state.gslRemainingTime / state.gslDefaultTime) * 100));
    const pBar = document.getElementById('gsl-progress-bar');
    if (pBar) {
      pBar.style.width = `${pct}%`;
      if (state.gslRemainingTime <= 10 && state.currentGslSpeaker) {
        pBar.className = 'bg-rose-500 h-full transition-all duration-300';
        document.getElementById('gsl-timer-display').classList.add('crunch-time');
      } else {
        pBar.className = 'bg-secondary h-full transition-all duration-300';
        document.getElementById('gsl-timer-display').classList.remove('crunch-time');
      }
    }

    if (!state.currentGslSpeaker) {
      emptyDiv.classList.add('hidden');
      activeDiv.classList.remove('hidden');
      document.getElementById('gsl-current-flag').src = 'https://flagcdn.com/w80/un.png';
      document.getElementById('gsl-current-name').textContent = t.noneSelected || 'None selected';
    } else {
      emptyDiv.classList.add('hidden');
      activeDiv.classList.remove('hidden');

      document.getElementById('gsl-current-flag').src = getFlagUrl(state.currentGslSpeaker);
      document.getElementById('gsl-current-name').textContent = getCountryDisplayName(state.currentGslSpeaker);
      document.getElementById('gsl-current-status').textContent = 
        state.currentGslSpeaker.powerStatus === 'observer' ? t.observer : t.delegate;
    }

    const startBtn = document.getElementById('btn-gsl-start');
    const pauseBtn = document.getElementById('btn-gsl-pause');
    if (state.gslRunning) {
      startBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    } else {
      startBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
    }

    document.getElementById('badge-queue-count').textContent = `${state.gslQueue.length} ${t.queued}`;
    const queueList = document.getElementById('list-gsl-queue');
    queueList.innerHTML = '';
    if (state.gslQueue.length === 0) {
      queueList.innerHTML = '';
    } else {
      state.gslQueue.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'py-3 px-3.5 flex items-center justify-between hover:bg-slate-50 transition rounded-xl';
        item.innerHTML = `
          <div class="flex items-center space-x-3 cursor-pointer select-queue-item min-w-0">
            <span class="text-sm font-mono font-bold text-slate-400 w-5 shrink-0">${idx + 1}.</span>
            <img src="${getFlagUrl(c)}" class="w-8 h-5.5 object-cover rounded shadow-sm shrink-0">
            <span class="text-sm sm:text-base font-bold text-slate-800 truncate">${getCountryDisplayName(c)}</span>
          </div>
          <div class="flex items-center space-x-2 shrink-0 ml-2">
            <button class="btn-top-queue p-1.5 text-xs text-slate-400 hover:text-primary rounded-lg transition" title="Move to Next">
              ▲
            </button>
            <button class="btn-del-queue p-1.5 text-xs text-slate-400 hover:text-rose-500 rounded-lg transition" title="Delete">
              ✕
            </button>
          </div>
        `;

        item.querySelector('.select-queue-item').addEventListener('click', () => {
          setGslSpeaker(c);
          state.gslQueue.splice(idx, 1);
          renderAll();
        });

        item.querySelector('.btn-top-queue').addEventListener('click', () => {
          if (idx > 0) {
            const temp = state.gslQueue.splice(idx, 1)[0];
            state.gslQueue.unshift(temp);
            renderAll();
          }
        });

        item.querySelector('.btn-del-queue').addEventListener('click', () => {
          state.gslQueue.splice(idx, 1);
          renderAll();
        });

        queueList.appendChild(item);
      });
    }
  }

  function setGslSpeaker(country) {
    pauseGslTimer();
    state.currentGslSpeaker = country;
    state.gslRemainingTime = state.gslDefaultTime;
  }

  function startGslTimer() {
    if (!ensureRollCallDone()) return;

    if (!state.currentGslSpeaker) {
      if (state.gslQueue.length > 0) {
        state.currentGslSpeaker = state.gslQueue.shift();
        state.gslRemainingTime = state.gslDefaultTime;
      } else {
        const t = I18N[state.language] || I18N.en;
        customAlert(t.gsl, t.addSpeakerFloorAlert);
        return;
      }
    }
    state.gslRunning = true;
    saveToLocalStorage(true);
    clearInterval(state.gslTimerInterval);
    state.gslTimerInterval = setInterval(() => {
      if (state.gslRemainingTime > 0) {
        state.gslRemainingTime--;
        saveToLocalStorage(true, true);
        if (state.gslRemainingTime === 10) playAlertChime();
        formatTimerDisplay('gsl-timer-display', state.gslRemainingTime);
        const pct = Math.max(0, (state.gslRemainingTime / state.gslDefaultTime) * 100);
        document.getElementById('gsl-progress-bar').style.width = `${pct}%`;
        if (state.gslRemainingTime <= 10) {
          document.getElementById('gsl-progress-bar').className = 'bg-rose-500 h-full transition-all duration-300';
          document.getElementById('gsl-timer-display').classList.add('crunch-time');
        }
      } else {
        pauseGslTimer();
        playAlertChime();
      }
    }, 1000);
    renderAll();
  }

  function pauseGslTimer() {
    state.gslRunning = false;
    clearInterval(state.gslTimerInterval);
    saveToLocalStorage(true);
    renderAll();
  }

  function resetGslTimer() {
    pauseGslTimer();
    state.gslRemainingTime = state.gslDefaultTime;
    saveToLocalStorage(true);
    renderAll();
  }

  function nextGslSpeaker() {
    pauseGslTimer();
    if (state.gslQueue.length > 0) {
      state.currentGslSpeaker = state.gslQueue.shift();
      state.gslRemainingTime = state.gslDefaultTime;
    } else {
      state.currentGslSpeaker = null;
    }
    saveToLocalStorage(true);
    renderAll();
  }

  function renderProConView() {
    const t = I18N[state.language] || I18N.en;
    const isPro = state.currentProConSide !== 'con';

    const btnSidePro = document.getElementById('btn-procon-side-pro');
    const btnSideCon = document.getElementById('btn-procon-side-con');
    const badgeSide = document.getElementById('procon-badge-side');
    const nameEl = document.getElementById('procon-current-name');
    const flagEl = document.getElementById('procon-current-flag');
    const labelTime = document.getElementById('label-procon-speaker-time');

    if (labelTime) labelTime.textContent = `${state.proConSpeakerSecs || 60}s`;

    if (btnSidePro && btnSideCon) {
      if (isPro) {
        btnSidePro.className = 'w-full text-center px-4 py-2 rounded-lg text-xs font-bold transition bg-emerald-600 text-white shadow-sm cursor-pointer';
        btnSideCon.className = 'w-full text-center px-4 py-2 rounded-lg text-xs font-bold transition text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer';
      } else {
        btnSidePro.className = 'w-full text-center px-4 py-2 rounded-lg text-xs font-bold transition text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer';
        btnSideCon.className = 'w-full text-center px-4 py-2 rounded-lg text-xs font-bold transition bg-rose-600 text-white shadow-sm cursor-pointer';
      }
    }

    if (badgeSide) {
      badgeSide.textContent = isPro ? (t.proSideBadge || 'PRO (正方)') : (t.conSideBadge || 'CON (反方)');
      badgeSide.className = isPro
        ? 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300'
        : 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300';
    }

    if (state.currentProConSpeaker) {
      if (flagEl) flagEl.src = getFlagUrl(state.currentProConSpeaker);
      if (nameEl) nameEl.textContent = getCountryDisplayName(state.currentProConSpeaker);
    } else {
      if (flagEl) flagEl.src = 'https://flagcdn.com/w80/un.png';
      if (nameEl) nameEl.textContent = t.noneSelected || 'None selected';
    }

    formatTimerDisplay('procon-timer-display', state.proConSecsRemaining);
    const proconInput = document.getElementById('procon-timer-input');
    if (proconInput && document.activeElement !== proconInput) {
      const m = Math.floor(state.proConSecsRemaining / 60);
      const s = state.proConSecsRemaining % 60;
      proconInput.value = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    const indPct = Math.max(0, (state.proConSecsRemaining / (state.proConSpeakerSecs || 60)) * 100);
    const pBar = document.getElementById('procon-speaker-progress');
    if (pBar) {
      pBar.style.width = `${indPct}%`;
      pBar.className = isPro ? 'bg-emerald-500 h-full transition-all duration-300 w-full' : 'bg-rose-500 h-full transition-all duration-300 w-full';
    }

    const startBtn = document.getElementById('btn-procon-start');
    const pauseBtn = document.getElementById('btn-procon-pause');
    if (state.proConRunning) {
      if (startBtn) startBtn.classList.add('hidden');
      if (pauseBtn) pauseBtn.classList.remove('hidden');
    } else {
      if (startBtn) startBtn.classList.remove('hidden');
      if (pauseBtn) pauseBtn.classList.add('hidden');
    }

    // Render Pro Queue
    const proList = document.getElementById('list-pro-queue');
    const proBadge = document.getElementById('badge-pro-queue-count');
    if (proBadge) proBadge.textContent = (state.proQueue || []).length;
    if (proList) {
      proList.innerHTML = '';
      (state.proQueue || []).forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'py-2 px-2.5 flex items-center justify-between hover:bg-emerald-50/60 rounded-xl transition';
        item.innerHTML = `
          <div class="flex items-center space-x-2 cursor-pointer select-pro-item min-w-0">
            <span class="text-xs font-mono font-bold text-slate-400 w-4 shrink-0">${idx + 1}.</span>
            <img src="${getFlagUrl(c)}" class="w-6 h-4 object-cover rounded shadow-sm shrink-0">
            <span class="text-xs font-bold text-slate-800 truncate">${getCountryDisplayName(c)}</span>
          </div>
          <button class="btn-del-pro p-1 text-xs text-slate-400 hover:text-rose-500 rounded transition" title="Delete">✕</button>
        `;
        item.querySelector('.select-pro-item').addEventListener('click', () => {
          setProConSpeaker(c, 'pro');
          state.proQueue.splice(idx, 1);
          renderAll();
        });
        item.querySelector('.btn-del-pro').addEventListener('click', () => {
          state.proQueue.splice(idx, 1);
          renderAll();
        });
        proList.appendChild(item);
      });
    }

    // Render Con Queue
    const conList = document.getElementById('list-con-queue');
    const conBadge = document.getElementById('badge-con-queue-count');
    if (conBadge) conBadge.textContent = (state.conQueue || []).length;
    if (conList) {
      conList.innerHTML = '';
      (state.conQueue || []).forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'py-2 px-2.5 flex items-center justify-between hover:bg-rose-50/60 rounded-xl transition';
        item.innerHTML = `
          <div class="flex items-center space-x-2 cursor-pointer select-con-item min-w-0">
            <span class="text-xs font-mono font-bold text-slate-400 w-4 shrink-0">${idx + 1}.</span>
            <img src="${getFlagUrl(c)}" class="w-6 h-4 object-cover rounded shadow-sm shrink-0">
            <span class="text-xs font-bold text-slate-800 truncate">${getCountryDisplayName(c)}</span>
          </div>
          <button class="btn-del-con p-1 text-xs text-slate-400 hover:text-rose-500 rounded transition" title="Delete">✕</button>
        `;
        item.querySelector('.select-con-item').addEventListener('click', () => {
          setProConSpeaker(c, 'con');
          state.conQueue.splice(idx, 1);
          renderAll();
        });
        item.querySelector('.btn-del-con').addEventListener('click', () => {
          state.conQueue.splice(idx, 1);
          renderAll();
        });
        conList.appendChild(item);
      });
    }
  }

  function setProConSpeaker(country, side) {
    pauseProConTimer();
    state.currentProConSpeaker = country;
    if (side) state.currentProConSide = side;
    state.proConSecsRemaining = state.proConSpeakerSecs || 60;
    saveToLocalStorage(true);
  }

  function startProConTimer() {
    if (!ensureRollCallDone()) return;
    if (!state.currentProConSpeaker) {
      // Pick starting speaker: prefer pro, fallback to con
      let targetSide = state.currentProConSide || 'pro';
      let targetQueue = targetSide === 'con' ? state.conQueue : state.proQueue;
      if (!targetQueue || targetQueue.length === 0) {
        // Fallback to opposite side
        const otherSide = targetSide === 'con' ? 'pro' : 'con';
        const otherQueue = otherSide === 'con' ? state.conQueue : state.proQueue;
        if (otherQueue && otherQueue.length > 0) {
          targetSide = otherSide;
          targetQueue = otherQueue;
        }
      }
      if (targetQueue && targetQueue.length > 0) {
        state.currentProConSide = targetSide;
        state.currentProConSpeaker = targetQueue.shift();
        state.proConSecsRemaining = state.proConSpeakerSecs || 60;
      } else {
        customAlert('Pro / Con Debate', state.language === 'zh' ? '請先從正方或反方名單加入發言代表！' : 'Please add a delegate to the PRO or CON queue first!');
        return;
      }
    }
    state.proConRunning = true;
    saveToLocalStorage(true);
    clearInterval(state.proConTimerInterval);
    state.proConTimerInterval = setInterval(() => {
      if (state.proConSecsRemaining > 0) {
        state.proConSecsRemaining--;
        saveToLocalStorage(true, true);
        if (state.proConSecsRemaining === 10) playAlertChime();
        formatTimerDisplay('procon-timer-display', state.proConSecsRemaining);
    const proconInput = document.getElementById('procon-timer-input');
    if (proconInput && document.activeElement !== proconInput) {
      const m = Math.floor(state.proConSecsRemaining / 60);
      const s = state.proConSecsRemaining % 60;
      proconInput.value = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
        const pct = Math.max(0, (state.proConSecsRemaining / (state.proConSpeakerSecs || 60)) * 100);
        const pBar = document.getElementById('procon-speaker-progress');
        if (pBar) pBar.style.width = `${pct}%`;
      } else {
        pauseProConTimer();
        playAlertChime();
      }
    }, 1000);
    renderAll();
  }

  function pauseProConTimer() {
    state.proConRunning = false;
    clearInterval(state.proConTimerInterval);
    saveToLocalStorage(true);
    renderAll();
  }

  function resetProConTimer() {
    pauseProConTimer();
    state.proConSecsRemaining = state.proConSpeakerSecs || 60;
    saveToLocalStorage(true);
    renderAll();
  }

  function nextProConSpeaker() {
    pauseProConTimer();
    // Alternating between Pro and Con
    const nextSide = state.currentProConSide === 'pro' ? 'con' : 'pro';
    let targetQueue = nextSide === 'con' ? state.conQueue : state.proQueue;
    let actualSide = nextSide;

    if (!targetQueue || targetQueue.length === 0) {
      // If alternate queue is empty, fallback to the other queue if it has speakers
      const otherSide = nextSide === 'con' ? 'pro' : 'con';
      const otherQueue = otherSide === 'con' ? state.conQueue : state.proQueue;
      if (otherQueue && otherQueue.length > 0) {
        targetQueue = otherQueue;
        actualSide = otherSide;
      }
    }

    if (targetQueue && targetQueue.length > 0) {
      state.currentProConSide = actualSide;
      state.currentProConSpeaker = targetQueue.shift();
      state.proConSecsRemaining = state.proConSpeakerSecs || 60;
    } else {
      state.currentProConSpeaker = null;
      state.proConSecsRemaining = state.proConSpeakerSecs || 60;
    }
    saveToLocalStorage(true);
    renderAll();
  }

  // --- MODERATED CAUCUS VIEW ---