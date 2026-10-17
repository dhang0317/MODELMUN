  function renderVotingView() {
    // Render roll call grid if rollcall tab is active
    if (state.currentTab === 'rollcall') {
      renderRollCallGrid();
    }
    // Render resolution vote grid if vote tab is active
    if (state.currentTab === 'vote') {
      renderResolutionVoteGrid();
    }
  }

  function renderRollCallGrid() {
    const grid = document.getElementById('grid-rollcall-delegates');
    grid.innerHTML = '';
    const t = I18N[state.language] || I18N.en;

    state.selectedCountries.forEach((c) => {
      const card = document.createElement('div');
      card.className = 'p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 transition-all duration-200 shadow-sm';
      
      const isPresent = c.attendance === 'present';
      const isPv = c.attendance === 'pv';
      const isAbsent = c.attendance === 'absent';
      const isUncalled = !c.attendance || c.attendance === 'uncalled';

      let rightContent = '';

      if (isUncalled) {
        // 出席缺席大小要一樣，不用英文，透亮半透明色彩
        rightContent = `
          <div class="rollcall-btn-container flex items-center space-x-2 shrink-0">
            <button type="button" class="btn-rollcall-present flex-1 rounded-xl font-black text-center transition cursor-pointer" style="border: 1.5px solid #10b981 !important; color: #10b981 !important; background-color: rgba(16, 185, 129, 0.15) !important;">
              出席
            </button>
            <button type="button" class="btn-rollcall-absent flex-1 rounded-xl font-black text-center transition cursor-pointer" style="border: 1.5px solid #ef4444 !important; color: #ef4444 !important; background-color: rgba(239, 68, 68, 0.15) !important;">
              缺席
            </button>
          </div>
        `;
      } else if (isPresent) {
        // 出席（綠色）：透亮半透明綠底 (rgba(16, 185, 129, 0.28))，搭配鮮明綠色邊框與綠色文字
        rightContent = `
          <div class="rollcall-btn-container shrink-0 flex justify-end">
            <button type="button" class="btn-rollcall-expanded btn-rollcall-status-present w-full rounded-xl font-black text-center transition cursor-pointer" style="background-color: rgba(16, 185, 129, 0.28) !important; background: rgba(16, 185, 129, 0.28) !important; color: #10b981 !important; border: 2px solid #10b981 !important;">
              出席
            </button>
          </div>
        `;
      } else if (isPv) {
        // 出席且投票（PV 琥珀金）：透亮半透明琥珀金底 (rgba(245, 158, 11, 0.28))，搭配琥珀色邊框與金色文字
        rightContent = `
          <div class="rollcall-btn-container shrink-0 flex justify-end">
            <button type="button" class="btn-rollcall-expanded btn-rollcall-status-pv w-full rounded-xl font-black text-center transition cursor-pointer" style="background-color: rgba(245, 158, 11, 0.28) !important; background: rgba(245, 158, 11, 0.28) !important; color: #f59e0b !important; border: 2px solid #f59e0b !important;">
              出席且投票
            </button>
          </div>
        `;
      } else if (isAbsent) {
        // 缺席（紅色）：透亮半透明紅底 (rgba(239, 68, 68, 0.28))，搭配紅色邊框與紅色文字
        rightContent = `
          <div class="rollcall-btn-container shrink-0 flex justify-end">
            <button type="button" class="btn-rollcall-expanded btn-rollcall-status-absent w-full rounded-xl font-black text-center transition cursor-pointer" style="background-color: rgba(239, 68, 68, 0.28) !important; background: rgba(239, 68, 68, 0.28) !important; color: #ef4444 !important; border: 2px solid #ef4444 !important;">
              缺席
            </button>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="flex items-center space-x-3.5 min-w-0 flex-1">
          <img src="${getFlagUrl(c)}" class="rollcall-flag object-cover rounded-md shadow-sm border border-slate-700/30 shrink-0">
          <div class="min-w-0">
            <div class="country-name-text font-black text-slate-800 leading-snug truncate">${getCountryDisplayName(c)}</div>
            <div class="rollcall-power-text text-slate-400 font-medium">${c.powerStatus === 'observer' ? t.observer : ''}</div>
          </div>
        </div>
        ${rightContent}
      `;

      // Event bindings
      const btnPresent = card.querySelector('.btn-rollcall-present');
      const btnAbsent = card.querySelector('.btn-rollcall-absent');
      const btnExpanded = card.querySelector('.btn-rollcall-expanded');

      if (btnPresent) {
        btnPresent.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.isViewerMode) return;
          c.attendance = 'present'; // 點擊變成大小為 2 的出席按鈕
          saveToLocalStorage(true);
          renderAll();
        });
      }

      if (btnAbsent) {
        btnAbsent.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.isViewerMode) return;
          c.attendance = 'absent'; // 點擊變成大小為 2 的缺席按鈕
          saveToLocalStorage(true);
          renderAll();
        });
      }

      if (btnExpanded) {
        btnExpanded.addEventListener('click', (e) => {
          e.stopPropagation();
          if (state.isViewerMode) return;
          if (c.attendance === 'present') {
            c.attendance = 'pv'; // 出席再點一下是 PV
          } else if (c.attendance === 'pv') {
            c.attendance = 'uncalled'; // PV 再點一下重設回未點名（變回 1:1 兩按鈕）
          } else if (c.attendance === 'absent') {
            c.attendance = 'uncalled'; // 缺席再點一下重設回未點名（變回 1:1 兩按鈕）
          }
          saveToLocalStorage(true);
          renderAll();
        });
      }

      grid.appendChild(card);
    });
  }

  function renderResolutionVoteGrid() {
    const btnR1 = document.getElementById('vote-stage-r1');
    const btnR2 = document.getElementById('vote-stage-r2');
    const btnRights = document.getElementById('vote-stage-rights');
    const pRights = document.getElementById('panel-rights-speeches');
    const pBallots = document.getElementById('panel-ballots-container');
    const pActiveCard = document.getElementById('panel-active-voter-card');
    const btnSubtabBallots = document.getElementById('btn-voting-subtab-ballots');
    const btnSubtabRollcall = document.getElementById('btn-voting-subtab-rollcall');

    // Default votingSubtab is ballots
    if (!state.votingSubtab) {
      state.votingSubtab = 'ballots';
    }

    // Update Subtab button styling
    if (btnSubtabBallots && btnSubtabRollcall) {
      if (state.votingSubtab === 'ballots') {
        btnSubtabBallots.className = 'px-3 py-1.5 rounded-lg text-xs transition bg-white shadow-sm text-slate-800';
        btnSubtabRollcall.className = 'px-3 py-1.5 rounded-lg text-xs transition text-slate-600 hover:text-slate-900';
      } else {
        btnSubtabBallots.className = 'px-3 py-1.5 rounded-lg text-xs transition text-slate-600 hover:text-slate-900';
        btnSubtabRollcall.className = 'px-3 py-1.5 rounded-lg text-xs transition bg-white shadow-sm text-slate-800';
      }
    }

    // Stage button styles
    [btnR1, btnR2, btnRights].forEach(b => {
      if (b) b.className = 'px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 transition';
    });
    
    if (state.voteStage === 'r1') {
      if (btnR1) btnR1.className = 'px-3 py-1.5 bg-primary text-white rounded-lg text-xs transition shadow-sm';
      if (pRights) pRights.classList.add('hidden');
      if (state.votingSubtab === 'rollcall') {
        if (pBallots) pBallots.classList.add('hidden');
        if (pActiveCard) pActiveCard.classList.remove('hidden');
      } else {
        if (pBallots) pBallots.classList.remove('hidden');
        if (pActiveCard) pActiveCard.classList.add('hidden');
      }
    } else if (state.voteStage === 'r2') {
      if (btnR2) btnR2.className = 'px-3 py-1.5 bg-primary text-white rounded-lg text-xs transition shadow-sm';
      if (pRights) pRights.classList.add('hidden');
      if (state.votingSubtab === 'rollcall') {
        if (pBallots) pBallots.classList.add('hidden');
        if (pActiveCard) pActiveCard.classList.remove('hidden');
      } else {
        if (pBallots) pBallots.classList.remove('hidden');
        if (pActiveCard) pActiveCard.classList.add('hidden');
      }
    } else {
      if (btnRights) btnRights.className = 'px-3 py-1.5 bg-primary text-white rounded-lg text-xs transition shadow-sm';
      if (pRights) pRights.classList.remove('hidden');
      if (pBallots) pBallots.classList.add('hidden');
      if (pActiveCard) pActiveCard.classList.add('hidden');
    }

    const scoreboard = document.getElementById('voting-scoreboard');
    const detailsCard = document.getElementById('card-voting-details');
    const headerRow = document.getElementById('voting-header-row');
    const t = I18N[state.language] || I18N.en;

    if (state.showResults) {
      if (scoreboard) {
        scoreboard.style.display = '';
        scoreboard.classList.remove('opacity-0', 'pointer-events-none');
      }
      const btnToggle = document.getElementById('btn-toggle-results');
      if (btnToggle) btnToggle.textContent = t.hideResults || 'Hide Results';
    } else {
      if (scoreboard) {
        scoreboard.style.display = 'none';
        scoreboard.classList.add('opacity-0', 'pointer-events-none');
      }
      const btnToggle = document.getElementById('btn-toggle-results');
      if (btnToggle) btnToggle.textContent = t.showResults || 'Show Results';
    }

    // Counts
    const favorCount = state.selectedCountries.filter(c => c.vote === 'favor').length;
    const againstCount = state.selectedCountries.filter(c => c.vote === 'against').length;
    const abstainCount = state.selectedCountries.filter(c => c.vote === 'abstain').length;

    const elFavor = document.getElementById('vote-count-favor');
    const elAgainst = document.getElementById('vote-count-against');
    const elAbstain = document.getElementById('vote-count-abstain');
    const elMajority = document.getElementById('vote-count-majority');
    if (elFavor) elFavor.textContent = favorCount;
    if (elAgainst) elAgainst.textContent = againstCount;
    if (elAbstain) elAbstain.textContent = abstainCount;

    const titleElem = document.getElementById('vote-resolution-title');
    if (titleElem) {
      titleElem.textContent = state.voteResolutionTitle || 'Draft Resolution 1.1';
    }

    const threshElem = document.getElementById('select-vote-threshold');
    if (threshElem) {
      threshElem.value = state.voteThreshold || 'simple';
    }

    // Badge labels
    const badgeType = document.getElementById('label-vote-type-badge');
    if (badgeType) {
      badgeType.textContent = (state.voteType === 'procedural') ? (t.proceduralVote || 'Procedural Vote') : (t.substantiveVote || 'Substantive Vote');
    }
    const badgeThresh = document.getElementById('label-vote-threshold-badge');
    if (badgeThresh) {
      const th = state.voteThreshold || 'simple';
      badgeThresh.textContent = th === 'twothirds' ? (t.twoThirdsMajorityRule || '2/3 Majority') : (th === 'unsc9' ? (t.unsc9RequiredRule || 'UNSC 9 Required') : (th === 'consensus' ? (t.consensusMajorityRule || 'Consensus') : (t.simpleMajorityRule || 'Simple Majority')));
    }

    const eligibleVoters = state.selectedCountries.filter(c => {
      if (state.voteType === 'procedural') {
        return c.attendance === 'present' || c.attendance === 'pv';
      }
      return c.powerStatus !== 'observer' && (c.attendance === 'present' || c.attendance === 'pv');
    });

    const votedCount = eligibleVoters.filter(c => c.vote === 'favor' || c.vote === 'against' || c.vote === 'abstain').length;
    const remainingToVote = eligibleVoters.length - votedCount;

    // Calculate Required Majority
    let requiredMajority = 0;
    const substantiveVoters = favorCount + againstCount;
    const totalPresent = eligibleVoters.length;

    if (state.voteThreshold === 'unsc9') {
      requiredMajority = 9;
    } else if (state.voteThreshold === 'twothirds') {
      const base = state.voteType === 'procedural' ? totalPresent : (substantiveVoters > 0 ? substantiveVoters : totalPresent);
      requiredMajority = Math.ceil((base * 2) / 3);
    } else if (state.voteThreshold === 'consensus') {
      requiredMajority = totalPresent;
    } else {
      // Simple majority
      const base = state.voteType === 'procedural' ? totalPresent : (substantiveVoters > 0 ? substantiveVoters : totalPresent);
      requiredMajority = Math.floor(base / 2) + 1;
    }

    if (elMajority) elMajority.textContent = requiredMajority;

    // Progress Bar calculations
    const totalForBar = (favorCount + againstCount + abstainCount) || 1;
    const favorPct = Math.round((favorCount / totalForBar) * 100);
    const againstPct = Math.round((againstCount / totalForBar) * 100);
    const abstainPct = Math.round((abstainCount / totalForBar) * 100);

    const barFavor = document.getElementById('bar-vote-favor');
    const barAgainst = document.getElementById('bar-vote-against');
    const barAbstain = document.getElementById('bar-vote-abstain');
    if (barFavor) barFavor.style.width = `${favorPct}%`;
    if (barAgainst) barAgainst.style.width = `${againstPct}%`;
    if (barAbstain) barAbstain.style.width = `${abstainPct}%`;

    const lblFavor = document.getElementById('vote-progress-label-favor');
    const lblAgainst = document.getElementById('vote-progress-label-against');
    const favorWord = t.inFavor || t.yes || 'Favor';
    const againstWord = t.against || t.no || 'Against';
    if (lblFavor) lblFavor.textContent = `${favorWord}: ${favorPct}% (${favorCount})`;
    if (lblAgainst) lblAgainst.textContent = `${againstWord}: ${againstPct}% (${againstCount})`;

    // Veto Detection (hidden / disabled per user request)
    const vetoBanner = document.getElementById('veto-alert-banner');
    if (vetoBanner) {
      vetoBanner.classList.add('hidden');
    }

    // Verdict calculation
    const verdictElem = document.getElementById('vote-verdict');
    const totalVotesCast = favorCount + againstCount + abstainCount;

    if (verdictElem) {
      if (totalVotesCast === 0) {
        verdictElem.textContent = t.pending || 'PENDING';
      } else if (state.voteThreshold === 'consensus') {
        if (againstCount > 0) {
          verdictElem.textContent = (t.failed || 'OBJECTION RAISED - FAILED').toUpperCase();
        } else if (remainingToVote === 0 && favorCount > 0) {
          verdictElem.textContent = (t.passed || 'ADOPTED BY CONSENSUS').toUpperCase();
        } else {
          verdictElem.textContent = (t.inProgress || 'VOTING IN PROGRESS').toUpperCase();
        }
      } else if (state.voteThreshold === 'unsc9') {
        if (favorCount >= 9) {
          verdictElem.textContent = (t.passed || 'PASSED').toUpperCase();
        } else if (favorCount + remainingToVote < 9) {
          verdictElem.textContent = (t.failed || 'FAILED').toUpperCase();
        } else {
          verdictElem.textContent = (t.inProgress || 'VOTING IN PROGRESS').toUpperCase();
        }
      } else if (state.voteThreshold === 'twothirds') {
        if (remainingToVote > 0) {
          verdictElem.textContent = (t.inProgress || 'VOTING IN PROGRESS').toUpperCase();
        } else {
          if (favorCount > 0 && favorCount >= requiredMajority) {
            verdictElem.textContent = (t.passed || 'PASSED').toUpperCase();
          } else {
            verdictElem.textContent = (t.failed || 'FAILED').toUpperCase();
          }
        }
      } else {
        // Simple majority
        if (remainingToVote > 0) {
          if (favorCount > againstCount + remainingToVote) {
            verdictElem.textContent = (t.passed || 'PASSED').toUpperCase();
          } else if (favorCount + remainingToVote <= againstCount) {
            verdictElem.textContent = (t.failed || 'FAILED').toUpperCase();
          } else {
            verdictElem.textContent = (t.inProgress || 'VOTING IN PROGRESS').toUpperCase();
          }
        } else {
          if (favorCount > againstCount) {
            verdictElem.textContent = (t.passed || 'PASSED').toUpperCase();
          } else {
            verdictElem.textContent = (t.failed || 'FAILED').toUpperCase();
          }
        }
      }
    }

    // Rights Speeches list rendering
    const rightsContainer = document.getElementById('list-rights-speeches');
    if (rightsContainer) {
      rightsContainer.innerHTML = '';
      const rightsDelegations = state.selectedCountries.filter(c => c.hasRights);
      if (rightsDelegations.length === 0) {
        rightsContainer.innerHTML = '';
      } else {
        rightsDelegations.forEach(c => {
          const item = document.createElement('div');
          item.className = 'py-3 flex items-center justify-between';
          item.innerHTML = `
            <div class="flex items-center space-x-3">
              <img src="${getFlagUrl(c)}" class="w-7 h-5 object-cover rounded shadow-sm border border-slate-700/30">
              <div>
                <span class="text-xs text-slate-800">${getCountryDisplayName(c)}</span>
                <span class="text-[10px] text-primary block">${t.voting || 'Vote'}: ${(c.vote || '').toUpperCase()}</span>
              </div>
            </div>
            <button class="px-3 py-1 bg-secondary text-white rounded-lg text-xs hover:bg-cyan-600 transition">${t.giveFloor60s || 'Give Floor (60s)'}</button>
          `;
          item.querySelector('button').addEventListener('click', () => {
            state.singleSpeaker = c;
            state.singleTimeRemaining = 60;
            switchTab('singleSpeaker');
          });
          rightsContainer.appendChild(item);
        });
      }
    }

    // Determine candidate pool for the active caller card and list
    let pool = eligibleVoters;
    if (state.voteStage === 'r2') {
      pool = eligibleVoters.filter(c => c.vote === 'pass');
    }

    // Keep active voter index within bounds
    if (typeof state.activeVoterIndex !== 'number' || state.activeVoterIndex < 0) {
      state.activeVoterIndex = 0;
    }
    if (pool.length > 0 && state.activeVoterIndex >= pool.length) {
      state.activeVoterIndex = pool.length - 1;
    }

    // Render MUN Command Active Voter Card
    const currentVoter = pool[state.activeVoterIndex] || null;
    const flagEl = document.getElementById('active-voter-flag');
    const nameEl = document.getElementById('active-voter-name');
    const statusEl = document.getElementById('active-voter-status');
    const queueEl = document.getElementById('label-voter-queue-status');
    const stageLabel = document.getElementById('label-active-voter-stage');

    if (stageLabel) {
      stageLabel.textContent = state.voteStage === 'r2' ? (t.round2RollCall || 'Round 2 Roll Call (Passes)') : (t.round1RollCall || 'Round 1 Roll Call');
    }

    if (currentVoter) {
      if (flagEl) flagEl.src = getFlagUrl(currentVoter);
      if (nameEl) nameEl.textContent = getCountryDisplayName(currentVoter);
      if (statusEl) {
        let voteDisplayName = '';
        if (currentVoter.vote === 'favor') voteDisplayName = t.yes || '贊成';
        else if (currentVoter.vote === 'against') voteDisplayName = t.no || '反對';
        else if (currentVoter.vote === 'abstain') voteDisplayName = t.abs || '棄權';
        else if (currentVoter.vote === 'pass') voteDisplayName = t.pass || 'Pass';

        const voteTxt = currentVoter.vote && currentVoter.vote !== 'none' 
          ? `${t.voting || 'Vote'}: ${voteDisplayName}${currentVoter.hasRights ? ' ' + (t.withRightsTag || '(+Rights)') : ''}` 
          : (currentVoter.attendance === 'pv' ? (t.pv || '出席且投票') : (t.present || '出席'));
        statusEl.textContent = voteTxt;
      }
      if (queueEl) queueEl.textContent = `${state.activeVoterIndex + 1} / ${pool.length}`;
    } else {
      if (flagEl) flagEl.src = '';
      if (nameEl) nameEl.textContent = pool.length === 0 && state.voteStage === 'r2' ? (t.noPassInRound1Short || 'No delegates passed in Round 1') : (t.allVotesRecorded || 'All votes recorded');
      if (statusEl) statusEl.textContent = pool.length === 0 ? '' : (t.votingComplete || 'Voting complete');
      if (queueEl) queueEl.textContent = `0 / 0`;
    }

    // Pass and Abstain availability on Active Card
    const btnFavor = document.getElementById('btn-cast-favor');
    const btnAgainst = document.getElementById('btn-cast-against');
    const btnPass = document.getElementById('btn-cast-pass');
    const btnAbstain = document.getElementById('btn-cast-abstain');

    const yesText = t.yes || '贊成';
    const noText = t.no || '反對';
    const absText = t.abs || '棄權';
    const passText = t.pass || 'Pass';
    const rightsTag = t.withRightsTag || '(+Rights)';

    if (btnFavor) {
      btnFavor.disabled = !currentVoter;
      const isFavor = currentVoter && currentVoter.vote === 'favor';
      const hasR = currentVoter && currentVoter.hasRights;
      if (isFavor && hasR) {
        btnFavor.textContent = `${yesText} ${rightsTag}`;
        btnFavor.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-emerald-500 bg-emerald-500/20 text-xs transition font-normal';
      } else if (isFavor) {
        btnFavor.textContent = yesText;
        btnFavor.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-emerald-400 bg-emerald-500/10 text-xs transition font-normal';
      } else {
        btnFavor.textContent = yesText;
        btnFavor.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs transition font-normal';
      }
    }

    if (btnAgainst) {
      btnAgainst.disabled = !currentVoter;
      const isAgainst = currentVoter && currentVoter.vote === 'against';
      const hasR = currentVoter && currentVoter.hasRights;
      if (isAgainst && hasR) {
        btnAgainst.textContent = `${noText} ${rightsTag}`;
        btnAgainst.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-rose-500 bg-rose-500/20 text-xs transition font-normal';
      } else if (isAgainst) {
        btnAgainst.textContent = noText;
        btnAgainst.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-rose-400 bg-rose-500/10 text-xs transition font-normal';
      } else {
        btnAgainst.textContent = noText;
        btnAgainst.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs transition font-normal';
      }
    }

    if (btnPass) {
      // In Round 2, delegates cannot pass again
      btnPass.disabled = state.voteStage === 'r2' || !currentVoter;
      btnPass.style.opacity = (state.voteStage === 'r2' || !currentVoter) ? '0.4' : '1';
      const isPass = currentVoter && currentVoter.vote === 'pass';
      btnPass.textContent = passText;
      if (isPass) {
        btnPass.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-400 bg-slate-300 text-xs transition font-normal';
      } else {
        btnPass.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs transition font-normal';
      }
    }

    if (btnAbstain) {
      const isPv = currentVoter && currentVoter.attendance === 'pv';
      const isProcedural = state.voteType === 'procedural';
      btnAbstain.disabled = !currentVoter || isPv || isProcedural;
      btnAbstain.style.opacity = (!currentVoter || isPv || isProcedural) ? '0.4' : '1';
      const isAbstain = currentVoter && currentVoter.vote === 'abstain';
      btnAbstain.textContent = absText;
      if (isAbstain) {
        btnAbstain.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-amber-400 bg-amber-500/20 text-xs transition font-normal';
      } else {
        btnAbstain.className = 'w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs transition font-normal';
      }
    }

    // Render Full Roll Call Ballots Grid
    const grid = document.getElementById('grid-substantive-ballots');
    if (grid) {
      grid.innerHTML = '';
      let visibleCountries = state.selectedCountries;
      if (state.voteStage === 'r2') {
        visibleCountries = state.selectedCountries.filter(c => c.vote === 'pass');
        if (visibleCountries.length === 0) {
          grid.innerHTML = '';
          return;
        }
      }

      visibleCountries.forEach(c => {
        const isObserver = c.powerStatus === 'observer';
        const isAbsent = c.attendance === 'absent';
        const isUncalled = c.attendance === 'uncalled' || !c.attendance;
        const canAbstain = c.attendance !== 'pv' && state.voteType !== 'procedural';

        const card = document.createElement('div');
        card.className = 'p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm transition';

        const statusText = isObserver 
          ? t.observer 
          : (c.attendance === 'pv' 
              ? t.pv 
              : (c.attendance === 'present' 
                  ? t.present 
                  : (c.attendance === 'absent' ? t.absent : (t.uncalled || '未點名'))));

        const favorLabel = (c.vote === 'favor' && c.hasRights) ? `${t.yes || '贊成'} (+R)` : (t.yes || '贊成');
        const againstLabel = (c.vote === 'against' && c.hasRights) ? `${t.no || '反對'} (+R)` : (t.no || '反對');

        card.innerHTML = `
          <div class="flex items-center space-x-3.5 min-w-0 flex-1">
            <img src="${getFlagUrl(c)}" class="w-9 h-6 sm:w-11 sm:h-7 object-cover rounded-md shadow-sm border border-slate-700/30 shrink-0">
            <div class="min-w-0">
              <div class="country-name-text text-base sm:text-lg lg:text-xl text-slate-800 leading-snug truncate">${getCountryDisplayName(c)}</div>
              <div class="text-xs text-slate-400">${statusText}</div>
            </div>
          </div>
          ${
            (isObserver && state.voteType !== 'procedural') || isAbsent || isUncalled
            ? `<span class="text-xs text-slate-400">${isObserver ? t.observer : (isAbsent ? t.absent : (t.uncalled || '未點名'))}</span>`
            : `
              <div class="flex items-center space-x-1.5">
                <button data-vote="favor" class="btn-vote-choice px-3 py-1.5 rounded-lg text-xs transition ${c.vote === 'favor' ? (c.hasRights ? 'vote-favor ring-2 ring-emerald-500' : 'vote-favor') : 'border'}">${favorLabel}</button>
                <button data-vote="against" class="btn-vote-choice px-3 py-1.5 rounded-lg text-xs transition ${c.vote === 'against' ? (c.hasRights ? 'vote-against ring-2 ring-rose-500' : 'vote-against') : 'border'}">${againstLabel}</button>
                ${canAbstain ? `<button data-vote="abstain" class="btn-vote-choice px-2.5 py-1.5 rounded-lg text-xs transition ${c.vote === 'abstain' ? 'vote-abstain' : 'border'}">${t.abs || '棄權'}</button>` : ''}
                ${state.voteStage === 'r1' ? `<button data-vote="pass" class="btn-vote-choice px-2.5 py-1.5 rounded-lg text-xs transition ${c.vote === 'pass' ? 'vote-pass' : 'border'}">${t.pass || 'Pass'}</button>` : ''}
              </div>
            `
          }
        `;

        card.querySelectorAll('.btn-vote-choice').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.isViewerMode) return;
            const action = btn.getAttribute('data-vote');
            
            // PV-style cycle logic:
            // favor -> favor+rights -> reset (none)
            // against -> against+rights -> reset (none)
            // abstain -> reset (none)
            // pass -> reset (none)
            if (action === 'favor') {
              if (c.vote === 'favor' && !c.hasRights) {
                c.hasRights = true;
              } else if (c.vote === 'favor' && c.hasRights) {
                c.vote = 'none';
                c.hasRights = false;
              } else {
                c.vote = 'favor';
                c.hasRights = false;
              }
            } else if (action === 'against') {
              if (c.vote === 'against' && !c.hasRights) {
                c.hasRights = true;
              } else if (c.vote === 'against' && c.hasRights) {
                c.vote = 'none';
                c.hasRights = false;
              } else {
                c.vote = 'against';
                c.hasRights = false;
              }
            } else if (action === 'abstain') {
              if (c.vote === 'abstain') {
                c.vote = 'none';
              } else {
                c.vote = 'abstain';
              }
              c.hasRights = false;
            } else if (action === 'pass') {
              if (c.vote === 'pass') {
                c.vote = 'none';
              } else {
                c.vote = 'pass';
              }
              c.hasRights = false;
            }

            saveToLocalStorage(true, true);
            renderAll();
          });
        });

        // Clicking country row sets it as the active caller card
        card.addEventListener('click', () => {
          const idx = pool.indexOf(c);
          if (idx !== -1) {
            state.activeVoterIndex = idx;
            renderResolutionVoteGrid();
          }
        });

        grid.appendChild(card);
      });
    }
  }
