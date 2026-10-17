  function renderUnmodView() {
    formatTimerDisplay('unmod-timer-display', state.unmodSecsRemaining);
    const startBtn = document.getElementById('btn-unmod-start');
    const pauseBtn = document.getElementById('btn-unmod-pause');
    if (state.unmodRunning) {
      startBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    } else {
      startBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
    }

    const totalSecs = state.unmodTotalSecs || 900;
    const progressEl = document.getElementById('unmod-total-progress');
    if (progressEl) {
      const pct = Math.max(0, Math.min(100, (state.unmodSecsRemaining / totalSecs) * 100));
      progressEl.style.width = `${pct}%`;
    }

    const totalTextEl = document.getElementById('unmod-total-timer-text');
    if (totalTextEl) {
      totalTextEl.textContent = `${formatMinutesSeconds(state.unmodSecsRemaining)} / ${formatMinutesSeconds(totalSecs)}`;
    }
  }

  function startUnmodTimer() {
    if (!ensureRollCallDone()) return;
    state.unmodRunning = true;
    saveToLocalStorage(true);
    clearInterval(state.unmodTimerInterval);
    state.unmodTimerInterval = setInterval(() => {
      if (state.unmodSecsRemaining > 0) {
        state.unmodSecsRemaining--;
        saveToLocalStorage(true, true);
        if (state.unmodSecsRemaining === 10) playAlertChime();
        formatTimerDisplay('unmod-timer-display', state.unmodSecsRemaining);
        const totalSecs = state.unmodTotalSecs || 900;
        const progressEl = document.getElementById('unmod-total-progress');
        if (progressEl) {
          const pct = Math.max(0, Math.min(100, (state.unmodSecsRemaining / totalSecs) * 100));
          progressEl.style.width = `${pct}%`;
        }
        const totalTextEl = document.getElementById('unmod-total-timer-text');
        if (totalTextEl) {
          totalTextEl.textContent = `${formatMinutesSeconds(state.unmodSecsRemaining)} / ${formatMinutesSeconds(totalSecs)}`;
        }
      } else {
        pauseUnmodTimer();
        playAlertChime();
      }
    }, 1000);
    renderAll();
  }

  function pauseUnmodTimer() {
    state.unmodRunning = false;
    clearInterval(state.unmodTimerInterval);
    saveToLocalStorage(true);
    renderAll();
  }

  function resetUnmodTimer() {
    pauseUnmodTimer();
    state.unmodSecsRemaining = state.unmodTotalSecs || 900;
    saveToLocalStorage(true);
    renderAll();
  }

  // --- SINGLE SPEAKER VIEW ---