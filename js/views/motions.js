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
    const topRule = (typeof MOTION_RULES !== 'undefined' && MOTION_RULES[top.type]) ? MOTION_RULES[top.type] : { requiresVote: false, threshold: 'simple', voteType: 'procedural', canSecond: true };

    document.getElementById('hero-motion-type').textContent = formatMotionType(top.type);
    document.getElementById('hero-motion-proposer').textContent = top.proposer;
    document.getElementById('hero-motion-topic').textContent = top.topic || t.generalDiscussion;
    document.getElementById('hero-motion-details').textContent = formatMotionDetails(top);
    const topCountry = state.selectedCountries.find(c => getCountryDisplayName(c) === top.proposer);
    const topFlagEl = document.getElementById('hero-motion-flag');
    if (topFlagEl) topFlagEl.src = getFlagUrl(topCountry);

    // Rule tag on Hero Card
    const ruleTag = document.getElementById('hero-motion-rule-tag');
    if (ruleTag) {
      if (topRule.requiresVote) {
        ruleTag.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-500';
        ruleTag.textContent = t.ruleTwoThirdsMandatory || 'Mandatory 2/3 Procedural Vote';
      } else {
        ruleTag.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500';
        ruleTag.textContent = t.ruleSecondOrVote || 'Second / Procedural Vote';
      }
    }

    // Hero buttons setup
    const btnHeroSecond = document.getElementById('btn-hero-motion-second');
    const btnHeroVote = document.getElementById('btn-hero-motion-vote');
    const btnHeroSecondText = document.getElementById('hero-motion-second-text');

    if (btnHeroSecond) {
      if (topRule.requiresVote) {
        // Motions that MUST vote (e.g. Previous Question / Closure) cannot be informally seconded
        btnHeroSecond.classList.add('hidden');
      } else {
        btnHeroSecond.classList.remove('hidden');
        if (btnHeroSecondText) btnHeroSecondText.textContent = t.passSecond || '附議通過';
      }
    }

    if (state.motions.length > 1) {
      for (let i = 1; i < state.motions.length; i++) {
        const m = state.motions[i];
        const mRule = (typeof MOTION_RULES !== 'undefined' && MOTION_RULES[m.type]) ? MOTION_RULES[m.type] : { requiresVote: false, threshold: 'simple', voteType: 'procedural', canSecond: true };
        const row = document.createElement('div');
        row.className = 'p-3.5 bg-surface-secondary border border-subtle hover:border-strong rounded-xl flex items-center justify-between gap-3 transition flex-wrap sm:flex-nowrap';
        const motionTimeLabel = formatMotionDetails(m);
        const proposerCountry = state.selectedCountries.find(c => getCountryDisplayName(c) === m.proposer);
        const flagUrl = getFlagUrl(proposerCountry);

        const ruleBadgeHtml = mRule.requiresVote
          ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-500">${t.ruleTwoThirdsMandatory || '2/3 強制表決'}</span>`
          : `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500">${t.ruleSecondOrVote || '附議/表決'}</span>`;

        row.innerHTML = `
          <div class="flex items-center space-x-3 min-w-0 flex-1">
            <span class="flex-shrink-0 w-6 h-6 rounded-full border border-subtle bg-surface-tertiary flex items-center justify-center text-[10px] font-mono text-content-secondary font-medium">#${i + 1}</span>
            <img src="${flagUrl}" class="w-6 h-4 object-cover rounded shadow-sm flex-shrink-0 border border-subtle" onerror="this.src='https://flagcdn.com/w80/un.png'">
            <div class="min-w-0">
              <div class="flex items-center space-x-2 flex-wrap">
                <span class="text-xs font-medium text-content-primary">${formatMotionType(m.type)}</span>
                <span class="text-content-muted text-xs">•</span>
                <span class="text-xs font-medium text-content-secondary truncate">${m.proposer}</span>
                ${ruleBadgeHtml}
              </div>
              <div class="text-sm font-medium text-content-primary truncate mt-0.5">${m.topic || t.generalDiscussion}</div>
              <div class="text-[11px] text-content-muted mt-0.5 flex items-center space-x-1">
                <span>${motionTimeLabel}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2 flex-shrink-0">
            <button class="btn-vote-motion-fail px-3 py-1.5 rounded-lg text-xs font-medium border border-subtle transition cursor-pointer text-content-muted hover:text-content-primary hover:bg-surface-tertiary">
              ${t.fail || '否決'}
            </button>
            <button class="btn-vote-motion-vote px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition cursor-pointer">
              ${t.putToVote || '交付表決'}
            </button>
            ${!mRule.requiresVote ? `
              <button class="btn-vote-motion-pass px-3 py-1.5 rounded-lg text-xs font-medium border border-subtle bg-brand text-content-inverse hover:opacity-90 transition cursor-pointer">
                ${t.passSecond || '附議通過'}
              </button>
            ` : ''}
          </div>
        `;

        if (!mRule.requiresVote) {
          const passBtn = row.querySelector('.btn-vote-motion-pass');
          if (passBtn) passBtn.addEventListener('click', () => executeMotion(m, i));
        }
        row.querySelector('.btn-vote-motion-vote').addEventListener('click', () => sendMotionToVotingTab(m, i));
        row.querySelector('.btn-vote-motion-fail').addEventListener('click', () => removeMotion(i));
        listContainer.appendChild(row);
      }
    } else {
      listContainer.innerHTML = `<div class="p-6 text-center text-xs text-zinc-500 font-medium">${t.noMotionsPending}</div>`;
    }
  }

  function sendMotionToVotingTab(motion, index) {
    if (!ensureRollCallDone()) return;
    state.activeVoteTarget = 'motion';
    state.votingMotion = { ...motion, originalIndex: index };
    state.voteType = 'procedural';
    const rule = (typeof MOTION_RULES !== 'undefined' && MOTION_RULES[motion.type]) ? MOTION_RULES[motion.type] : { threshold: 'simple' };
    state.voteThreshold = rule.threshold || 'simple';
    
    // Clear previous roll call votes to ready a fresh procedural ballot
    state.selectedCountries.forEach(c => {
      c.vote = 'none';
      c.hasRights = false;
    });
    state.voteStage = 'r1';
    state.activeVoterIndex = 0;

    // All motions jump to session voting by default
    state.votingSubtab = 'session';

    // Ensure sessionVotes exists and active session note is populated with motion info
    if (!Array.isArray(state.sessionVotes) || state.sessionVotes.length === 0) {
      const count = state.sessionCount || 3;
      state.sessionVotes = [];
      for (let i = 1; i <= count; i++) {
        state.sessionVotes.push({
          id: i,
          name: `Session ${i}`,
          favor: 0,
          against: 0,
          abstain: 0,
          note: ''
        });
      }
    }
    if (!state.activeSessionId) {
      state.activeSessionId = 1;
    }
    const currentSess = state.sessionVotes.find(s => s.id === state.activeSessionId) || state.sessionVotes[0];
    if (currentSess) {
      const motionName = formatMotionType(motion.type);
      currentSess.note = `${motionName} (${motion.proposer})`;
    }

    saveToLocalStorage(true, true);
    switchTab('vote');
  }

  function formatMotionType(type) {
    const t = I18N[state.language] || I18N.en;
    if (state.language === 'zh') {
      switch (type) {
        case 'previous_question': return '結束辯論動議 / 提請表決 (Previous Question)';
        case 'close': return '結束辯論動議 (Closure of Debate)';
        case 'unmod': return '非主持核心磋商 (Unmod)';
        case 'mod': return '主持核心磋商 (Mod)';
        case 'singlespeaker': return '介紹決議案草案及修正案';
        case 'suspend': return '暫停會議動議 (Suspension)';
        case 'adjourn_session': return t.motionAdjournSession;
        case 'adjourn_day': return '休會動議 - 本日結束 (Adjournment for the Day)';
        case 'adjourn': return '休會動議 (Adjournment)';
        default: return type;
      }
    }
    if (state.language === 'fr') {
      switch (type) {
        case 'previous_question': return "Motion d'ajournement du débat (Previous Question)";
        case 'close': return 'Clôture du Débat (Closure of Debate)';
        case 'unmod': return 'Caucus Non-Modéré';
        case 'mod': return 'Caucus Modéré';
        case 'singlespeaker': return 'Présentation du Projet de Résolution et Amendements';
        case 'suspend': return 'Suspension de la séance';
        case 'adjourn_session': return t.motionAdjournSession;
        case 'adjourn_day': return 'Ajournement pour la journée';
        case 'adjourn': return 'Ajournement de la séance';
        default: return type;
      }
    }
    switch (type) {
      case 'previous_question': return 'Motion to the Previous Question (Closure of Debate)';
      case 'close': return 'Closure of Debate';
      case 'unmod': return 'Unmoderated Caucus';
      case 'mod': return 'Moderated Caucus';
      case 'singlespeaker': return 'Introduce Draft Resolution & Amendments';
      case 'suspend': return 'Suspension of Meeting';
      case 'adjourn_session': return t.motionAdjournSession;
      case 'adjourn_day': return 'Adjournment for the Day';
      case 'adjourn': return 'Adjournment of Meeting';
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
    } else if (motion.type === 'close' || motion.type === 'previous_question') {
      const t = I18N[state.language] || I18N.en;
      showToast(t.enterSubstantiveVotePrompt || t.debateClosedToast, 'success', 4000);
      state.activeVoteTarget = 'resolution';
      state.votingMotion = null;
      state.voteType = 'substantive';
      state.voteThreshold = state.settings?.rules?.defaultVoteThreshold || 'simple';
      // Clear votes for a fresh substantive resolution ballot
      state.selectedCountries.forEach(c => {
        c.vote = 'none';
        c.hasRights = false;
      });
      state.voteStage = 'r1';
      state.activeVoterIndex = 0;
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