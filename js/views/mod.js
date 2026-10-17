  function renderModView() {
    const t = I18N[state.language] || I18N.en;
    document.getElementById('mod-current-topic').textContent = state.modTopic;
    document.getElementById('mod-label-total-time').textContent = formatMinutesSeconds(state.modTotalSecsRemaining);
    document.getElementById('mod-label-speaker-time').textContent = formatMinutesSeconds(state.modSpeakerSecs);

    if (state.currentModSpeaker) {
      document.getElementById('mod-current-flag').src = getFlagUrl(state.currentModSpeaker);
      document.getElementById('mod-current-country-name').textContent = getCountryDisplayName(state.currentModSpeaker);
    } else {
      document.getElementById('mod-current-flag').src = 'https://flagcdn.com/w80/un.png';
      document.getElementById('mod-current-country-name').textContent = t.noneSelected;
    }

    formatTimerDisplay('mod-speaker-timer-display', state.modSpeakerSecsRemaining);

    const indPct = Math.max(0, (state.modSpeakerSecsRemaining / state.modSpeakerSecs) * 100);
    document.getElementById('mod-speaker-progress').style.width = `${indPct}%`;

    const totalDuration = state.modTotalMins * 60;
    const elapsed = totalDuration - state.modTotalSecsRemaining;
    const totalPct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    document.getElementById('mod-total-progress').style.width = `${totalPct}%`;
    document.getElementById('mod-total-timer-text').textContent = 
      `${formatMinutesSeconds(elapsed)} / ${formatMinutesSeconds(totalDuration)}`;

    const startBtn = document.getElementById('btn-mod-start');
    const pauseBtn = document.getElementById('btn-mod-pause');
    if (state.modRunning) {
      startBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    } else {
      startBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
    }

    const queueList = document.getElementById('list-mod-queue');
    queueList.innerHTML = '';
    if (state.modQueue.length === 0) {
      queueList.innerHTML = '';
    } else {
      state.modQueue.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'py-3 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer';
        item.innerHTML = `
          <div class="flex items-center space-x-3 min-w-0">
            <span class="text-sm font-mono font-bold text-slate-400 w-5 shrink-0">${idx + 1}.</span>
            <img src="${getFlagUrl(c)}" class="w-8 h-5.5 object-cover rounded shadow-sm shrink-0">
            <span class="text-sm sm:text-base font-bold text-slate-800 truncate">${getCountryDisplayName(c)}</span>
          </div>
          <button class="btn-del-mod-queue p-1.5 text-slate-400 hover:text-rose-600 shrink-0 ml-2"><i data-lucide="x" class="w-4 h-4"></i></button>
        `;
        item.addEventListener('click', () => {
          state.currentModSpeaker = c;
          state.modSpeakerSecsRemaining = state.modSpeakerSecs;
          state.modQueue.splice(idx, 1);
          renderAll();
        });
        item.querySelector('.btn-del-mod-queue').addEventListener('click', (e) => {
          e.stopPropagation();
          state.modQueue.splice(idx, 1);
          renderAll();
        });
        queueList.appendChild(item);
      });
    }
  }

  function startModTimer() {
    if (!ensureRollCallDone()) return;

    if (!state.currentModSpeaker) {
      if (state.modQueue.length > 0) {
        state.currentModSpeaker = state.modQueue.shift();
        state.modSpeakerSecsRemaining = state.modSpeakerSecs;
      } else {
        const t = I18N[state.language] || I18N.en;
        showToast(t.addSpeakerFloorAlert, 'error');
        return;
      }
    }
    state.modRunning = true;
    saveToLocalStorage(true);
    clearInterval(state.modTimerInterval);
    state.modTimerInterval = setInterval(() => {
      if (state.modTotalSecsRemaining > 0) {
        state.modTotalSecsRemaining--;
      } else {
        pauseModTimer();
      }
      if (state.modSpeakerSecsRemaining > 0) {
        state.modSpeakerSecsRemaining--;
        if (state.modSpeakerSecsRemaining === 5) playAlertChime();
      } else {
        playAlertChime();
        pauseModTimer();
      }
      saveToLocalStorage(true, true);
      renderModView();
    }, 1000);
    renderAll();
  }

  function pauseModTimer() {
    state.modRunning = false;
    clearInterval(state.modTimerInterval);
    saveToLocalStorage(true);
    renderAll();
  }

  function resetModTimer() {
    pauseModTimer();
    state.modSpeakerSecsRemaining = state.modSpeakerSecs;
    saveToLocalStorage(true);
    renderAll();
  }

  function nextModSpeaker() {
    pauseModTimer();
    if (state.modQueue.length > 0) {
      state.currentModSpeaker = state.modQueue.shift();
      state.modSpeakerSecsRemaining = state.modSpeakerSecs;
    } else {
      state.currentModSpeaker = null;
    }
    saveToLocalStorage(true);
    renderAll();
  }

  // --- UNMODERATED CAUCUS VIEW ---