  function renderMotionsView() {
    const t = I18N[state.language] || I18N.en;
    state.motions.sort((a, b) => {
      if (b.precedence !== a.precedence) return b.precedence - a.precedence;
      return (b.totalMins || 0) - (a.totalMins || 0);
    });

    const heroCard = document.getElementById('hero-motion-card');
    const listContainer = document.getElementById('list-motions');
    listContainer.innerHTML = '';

    if (state.motions.length === 0) {
      heroCard.classList.add('hidden');
      listContainer.innerHTML = '';
      return;
    }

    function formatMotionDetails(m) {
      if (!m.totalMins) return t.proceduralAction || 'Procedural Action';
      if (m.type === 'mod') {
        if (t.durationAndSpeakingTime) {
          return t.durationAndSpeakingTime.replace('{total}', m.totalMins).replace('{speaker}', m.speakerSecs);
        }
        return `Duration: ${m.totalMins} mins • Individual: ${m.speakerSecs}s`;
      } else if (m.type === 'singlespeaker') {
        if (state.language === 'zh') return `發言時間：${m.totalMins} 分鐘`;
        if (state.language === 'fr') return `Temps de parole : ${m.totalMins} mins`;
        return `Speaking Time: ${m.totalMins} mins`;
      } else if (m.type === 'suspend') {
        if (state.language === 'zh') return `暫停時間：${m.totalMins} 分鐘`;
        if (state.language === 'fr') return `Durée de la suspension : ${m.totalMins} mins`;
        return `Suspension Duration: ${m.totalMins} mins`;
      } else if (m.type === 'adjourn_session') {
        return t.motionAdjournSession;
      } else if (m.type === 'adjourn_day' || m.type === 'adjourn') {
        return t.motionAdjournDay;
      } else {
        // unmod or others
        if (state.language === 'zh') return `磋商時長：${m.totalMins} 分鐘`;
        if (state.language === 'fr') return `Durée du caucus : ${m.totalMins} mins`;
        return `Duration: ${m.totalMins} mins`;
      }
    }

    heroCard.classList.remove('hidden');
    const top = state.motions[0];
    document.getElementById('hero-motion-type').textContent = formatMotionType(top.type);
    document.getElementById('hero-motion-proposer').textContent = top.proposer;
    document.getElementById('hero-motion-topic').textContent = top.topic || t.generalDiscussion;
    document.getElementById('hero-motion-details').textContent = formatMotionDetails(top);
    const topCountry = state.selectedCountries.find(c => getCountryDisplayName(c) === top.proposer);
    const topFlagEl = document.getElementById('hero-motion-flag');
    if (topFlagEl) topFlagEl.src = getFlagUrl(topCountry);

    if (state.motions.length > 1) {
      for (let i = 1; i < state.motions.length; i++) {
        const m = state.motions[i];
        const row = document.createElement('div');
        row.className = 'p-3.5 bg-black border border-white/40 hover:border-white rounded-xl flex items-center justify-between gap-3 transition';
        const motionTimeLabel = formatMotionDetails(m);
        const proposerCountry = state.selectedCountries.find(c => getCountryDisplayName(c) === m.proposer);
        const flagUrl = getFlagUrl(proposerCountry);

        row.innerHTML = `
          <div class="flex items-center space-x-3 min-w-0">
            <span class="flex-shrink-0 w-6 h-6 rounded-full border border-white/40 flex items-center justify-center text-[10px] font-mono text-white font-bold">#${i + 1}</span>
            <img src="${flagUrl}" class="w-6 h-4 object-cover rounded shadow-sm flex-shrink-0" onerror="this.src='https://flagcdn.com/w80/un.png'">
            <div class="min-w-0">
              <div class="flex items-center space-x-2 flex-wrap">
                <span class="text-xs font-bold text-white">${formatMotionType(m.type)}</span>
                <span class="text-white/40 text-xs">•</span>
                <span class="text-xs font-medium text-white truncate">${m.proposer}</span>
              </div>
              <div class="text-sm font-bold text-white truncate mt-0.5">${m.topic || t.generalDiscussion}</div>
              <div class="text-[11px] text-white/70 mt-0.5 flex items-center space-x-1">
                <i class="fa-regular fa-clock text-[10px] mr-1 text-white/50"></i>
                <span>${motionTimeLabel}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2 flex-shrink-0">
            <button class="btn-vote-motion-pass px-3 py-1.5 rounded-lg text-xs font-bold border transition">
              ${t.pass}
            </button>
            <button class="btn-vote-motion-fail px-3 py-1.5 rounded-lg text-xs font-bold border transition">
              ${t.fail}
            </button>
          </div>
        `;

        row.querySelector('.btn-vote-motion-pass').addEventListener('click', () => executeMotion(m, i));
        row.querySelector('.btn-vote-motion-fail').addEventListener('click', () => removeMotion(i));
        listContainer.appendChild(row);
      }
    } else {
      listContainer.innerHTML = `<div class="p-6 text-center text-xs text-zinc-500 font-medium">${t.noMotionsPending}</div>`;
    }
  }

  function formatMotionType(type) {
    const t = I18N[state.language] || I18N.en;
    if (state.language === 'zh') {
      switch (type) {
        case 'unmod': return '非主持核心磋商 (Unmod)';
        case 'mod': return '主持核心磋商 (Mod)';
        case 'singlespeaker': return '介紹決議案草案及修正案';
        case 'suspend': return '暫停會議動議 (Suspension)';
        case 'adjourn_session': return t.motionAdjournSession;
        case 'adjourn_day': return '休會動議 - 本日結束 (Adjournment for the Day)';
        case 'adjourn': return '休會動議 (Adjournment)';
        case 'close': return '結束辯論動議 (Closure)';
        default: return type;
      }
    }
    if (state.language === 'fr') {
      switch (type) {
        case 'unmod': return 'Caucus Non-Modéré';
        case 'mod': return 'Caucus Modéré';
        case 'singlespeaker': return 'Présentation du Projet de Résolution et Amendements';
        case 'suspend': return 'Suspension de la séance';
        case 'adjourn_session': return t.motionAdjournSession;
        case 'adjourn_day': return 'Ajournement pour la journée';
        case 'adjourn': return 'Ajournement de la séance';
        case 'close': return 'Clôture du Débat';
        default: return type;
      }
    }
    switch (type) {
      case 'unmod': return 'Unmoderated Caucus';
      case 'mod': return 'Moderated Caucus';
      case 'singlespeaker': return 'Introduce Draft Resolution & Amendments';
      case 'suspend': return 'Suspension of Meeting';
      case 'adjourn_session': return t.motionAdjournSession;
      case 'adjourn_day': return 'Adjournment for the Day';
      case 'adjourn': return 'Adjournment of Meeting';
      case 'close': return 'Closure of Debate';
      default: return type;
    }
  }

  function executeMotion(motion, index) {
    if (!ensureRollCallDone()) return;

    // Remove the motion from floor first
    if (typeof index === 'number' && index >= 0) {
      state.motions.splice(index, 1);
      saveToLocalStorage();
    }

    if (motion.type === 'mod') {
      pauseModTimer();
      const totalMins = parseInt(motion.totalMins, 10) || 10;
      const speakerSecs = parseInt(motion.speakerSecs, 10) || 60;
      state.modTopic = motion.topic || '';
      state.modTotalMins = totalMins;
      state.modTotalSecsRemaining = totalMins * 60;
      state.modSpeakerSecs = speakerSecs;
      state.modSpeakerSecsRemaining = speakerSecs;
      state.modQueue = [];
      state.currentModSpeaker = null;
      switchTab('mod');
    } else if (motion.type === 'unmod') {
      pauseUnmodTimer();
      const totalMins = parseInt(motion.totalMins, 10) || 10;
      state.unmodSecsRemaining = totalMins * 60;
      switchTab('unmod');
    } else if (motion.type === 'singlespeaker') {
      pauseSingleTimer();
      const durationSecs = (parseInt(motion.totalMins, 10) || 3) * 60;
      state.singleTimeRemaining = durationSecs;
      
      // Match the proposer country to state.singleSpeaker
      if (motion.proposer) {
        const found = state.selectedCountries.find(c => getCountryDisplayName(c) === motion.proposer);
        if (found) {
          state.singleSpeaker = found;
        }
      }
      switchTab('singleSpeaker');
    } else if (motion.type === 'suspend') {
      const totalMins = parseInt(motion.totalMins, 10) || 15;
      const t = I18N[state.language] || I18N.en;
      openRecessScreen(totalMins, motion.topic || t.motionSuspendMeeting, 'suspend');
      renderAll();
    } else if (motion.type === 'adjourn_day') {
      const t = I18N[state.language] || I18N.en;
      openRecessScreen(0, motion.topic || t.motionAdjournDay, 'adjourn_day');
      renderAll();
    } else if (motion.type === 'adjourn_session') {
      const t = I18N[state.language] || I18N.en;
      openRecessScreen(0, motion.topic || t.motionAdjournSession, 'adjourn_session');
      renderAll();
    } else if (motion.type === 'adjourn') {
      const t = I18N[state.language] || I18N.en;
      openRecessScreen(0, motion.topic || t.motionAdjournMeeting, 'adjourn_day');
      renderAll();
    } else if (motion.type === 'close') {
      const t = I18N[state.language] || I18N.en;
      showToast(t.debateClosedToast, 'info', 3500);
      switchTab('vote');
    }
    saveToLocalStorage(true, true);
    renderAll();
  }

  function openRecessScreen(totalMins, title, mode = 'suspend') {
    const modal = document.getElementById('modal-recess');
    if (!modal) return;
    const t = I18N[state.language] || I18N.en;

    state.recessSecsRemaining = totalMins * 60;
    state.recessRunning = false;
    state.recessModalOpen = true;
    state.recessTitle = title || '';
    state.recessMode = mode || 'suspend';
    clearInterval(state.recessTimerInterval);

    const titleEl = document.getElementById('recess-title');
    if (titleEl) titleEl.textContent = title || t.recessSuspendedTitle;

    const subtitleEl = document.getElementById('recess-subtitle');
    if (subtitleEl) {
      if (mode === 'adjourn_session') {
        subtitleEl.textContent = t.recessAdjournSessionSubtitle;
      } else if (mode === 'adjourn_day' || mode === 'adjourn') {
        subtitleEl.textContent = t.recessAdjournDaySubtitle;
      } else {
        subtitleEl.textContent = t.recessSuspendedSubtitle;
      }
    }

    const toggleBtn = document.getElementById('btn-recess-toggle-timer');
    const timerDisplay = document.getElementById('recess-timer-display');
    const reconveneEl = document.getElementById('recess-reconvene-time');
    const timerBox = document.getElementById('recess-timer-container');

    const badgeEl = document.getElementById('recess-badge');
    const reconveneBtn = document.getElementById('btn-recess-reconvene');

    if (mode === 'adjourn_session') {
      if (badgeEl) badgeEl.classList.add('hidden');
      if (subtitleEl) subtitleEl.classList.add('hidden');
      if (toggleBtn) toggleBtn.classList.add('hidden');
      if (timerBox) timerBox.classList.add('hidden');
      if (reconveneBtn) {
        reconveneBtn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i><span>${t.confirm || '確定'}</span>`;
      }
      // Gentle celebratory confetti ribbons for session close
      setTimeout(() => {
        launchConfettiCannon();
      }, 300);
    } else if (mode === 'adjourn_day' || mode === 'adjourn') {
      if (badgeEl) badgeEl.classList.remove('hidden');
      if (subtitleEl) subtitleEl.classList.remove('hidden');
      if (toggleBtn) toggleBtn.classList.add('hidden');
      if (timerBox) timerBox.classList.add('hidden');
      if (reconveneEl) reconveneEl.textContent = t.recessAdjournDayNotice;
      if (reconveneBtn) {
        reconveneBtn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i><span>${t.recessFormalReconvene}</span>`;
      }
    } else {
      if (badgeEl) badgeEl.classList.remove('hidden');
      if (subtitleEl) subtitleEl.classList.remove('hidden');
      if (toggleBtn) toggleBtn.classList.remove('hidden');
      if (timerBox) timerBox.classList.remove('hidden');
      if (reconveneBtn) {
        reconveneBtn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i><span>${t.recessFormalReconvene}</span>`;
      }
      const toggleBtnLabel = document.getElementById('recess-toggle-label');
      if (toggleBtnLabel) toggleBtnLabel.textContent = t.recessStartTimer;
      updateRecessDisplay();
    }

    updateRecessDisplay();
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function updateRecessDisplay() {
    const t = I18N[state.language] || I18N.en;
    formatTimerDisplay('recess-timer-display', state.recessSecsRemaining);
    const reconveneEl = document.getElementById('recess-reconvene-time');
    if (reconveneEl) {
      const targetTime = new Date(Date.now() + state.recessSecsRemaining * 1000);
      const hours = String(targetTime.getHours()).padStart(2, '0');
      const mins = String(targetTime.getMinutes()).padStart(2, '0');
      reconveneEl.textContent = `${t.recessReconvenePrefix}${hours}:${mins}`;
    }
  }

  function toggleRecessTimer() {
    const t = I18N[state.language] || I18N.en;
    const toggleBtnLabel = document.getElementById('recess-toggle-label');
    if (state.recessRunning) {
      state.recessRunning = false;
      clearInterval(state.recessTimerInterval);
      if (toggleBtnLabel) toggleBtnLabel.textContent = t.recessResumeTimer;
    } else {
      state.recessRunning = true;
      if (toggleBtnLabel) toggleBtnLabel.textContent = t.recessPauseTimer;
      clearInterval(state.recessTimerInterval);
      state.recessTimerInterval = setInterval(() => {
        if (state.recessSecsRemaining > 0) {
          state.recessSecsRemaining--;
          saveToLocalStorage(true, true);
          updateRecessDisplay();
        } else {
          state.recessRunning = false;
          clearInterval(state.recessTimerInterval);
          saveToLocalStorage(true, true);
          if (toggleBtnLabel) toggleBtnLabel.textContent = t.recessTimeExpired;
        }
      }, 1000);
    }
  }

  function closeRecessScreen() {
    const t = I18N[state.language] || I18N.en;
    state.recessRunning = false;
    state.recessModalOpen = false;
    clearInterval(state.recessTimerInterval);
    const modal = document.getElementById('modal-recess');
    if (modal) modal.classList.add('hidden');
    saveToLocalStorage(true, true);
    showToast(t.sessionReconvenedToast, 'success');
  }

  function removeMotion(index) {
    state.motions.splice(index, 1);
    saveToLocalStorage(true, true);
    renderAll();
  }

  // --- VOTING & ROLL CALL VIEW ---