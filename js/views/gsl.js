  function renderGslView() {
    const emptyDiv = document.getElementById('gsl-current-empty');
    const activeDiv = document.getElementById('gsl-current-active');
    const t = I18N[state.language] || I18N.en;
    document.getElementById('label-gsl-default-time').textContent = `${state.gslDefaultTime}s`;

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
      emptyDiv.classList.remove('hidden');
      activeDiv.classList.add('hidden');
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

  // --- MODERATED CAUCUS VIEW ---