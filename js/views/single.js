  function renderSingleSpeakerView() {
    const t = I18N[state.language] || I18N.en;
    if (state.singleSpeaker) {
      document.getElementById('single-flag').src = getFlagUrl(state.singleSpeaker);
      document.getElementById('single-country-name').textContent = getCountryDisplayName(state.singleSpeaker);
      document.getElementById('single-purpose').textContent = t.designatedSpeaker;
    } else {
      document.getElementById('single-flag').src = 'https://flagcdn.com/w80/un.png';
      document.getElementById('single-country-name').textContent = t.selectDelegate;
      document.getElementById('single-purpose').textContent = t.sponsorPresentation;
    }

    formatTimerDisplay('single-timer-display', state.singleTimeRemaining);

    const startBtn = document.getElementById('btn-single-start');
    const pauseBtn = document.getElementById('btn-single-pause');
    if (state.singleRunning) {
      startBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    } else {
      startBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
    }
  }

  function startSingleTimer() {
    if (!ensureRollCallDone()) return;
    state.singleRunning = true;
    saveToLocalStorage(true);
    clearInterval(state.singleTimerInterval);
    state.singleTimerInterval = setInterval(() => {
      if (state.singleTimeRemaining > 0) {
        state.singleTimeRemaining--;
        saveToLocalStorage(true, true);
        if (state.singleTimeRemaining === 10) playAlertChime();
        formatTimerDisplay('single-timer-display', state.singleTimeRemaining);
      } else {
        pauseSingleTimer();
        playAlertChime();
      }
    }, 1000);
    renderAll();
  }

  function pauseSingleTimer() {
    state.singleRunning = false;
    clearInterval(state.singleTimerInterval);
    saveToLocalStorage(true);
    renderAll();
  }

  function resetSingleTimer() {
    pauseSingleTimer();
    state.singleTimeRemaining = 180;
    saveToLocalStorage(true);
    renderAll();
  }

  // --- MOTIONS VIEW ---