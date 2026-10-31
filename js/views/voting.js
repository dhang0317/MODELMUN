  // Check if roll call voting for a motion has finished, determine pass/fail, and auto-navigate
  function checkMotionVotingAutoFinish(eligibleVoters, favorCount, againstCount, remainingToVote, requiredMajority) {
    if (state.activeVoteTarget !== 'motion' || state.currentTab !== 'vote') return;
    const curMot = state.votingMotion || (state.motions && state.motions[0]);
    if (!curMot) return;

    // Only auto finish if all eligible voters have cast their votes
    if (remainingToVote > 0 || eligibleVoters.length === 0) return;

    const t = I18N[state.language] || I18N.en;
    let isPassed = false;

    if (state.voteThreshold === 'twothirds') {
      isPassed = (favorCount > 0 && favorCount >= requiredMajority);
    } else {
      isPassed = (favorCount > againstCount);
    }

    const motName = formatMotionType(curMot.type);
    const motProposer = curMot.proposer || '';
    const originalIdx = (typeof curMot.originalIndex === 'number') ? curMot.originalIndex : 0;

    // Prevent re-triggering during transition
    state.activeVoteTarget = 'resolution';
    state.votingMotion = null;

    if (isPassed) {
      if (typeof showToast === 'function' && curMot && curMot.type !== 'close' && curMot.type !== 'previous_question') {
        const passMsg = state.language === 'zh'
          ? `動議【${motName}】(${motProposer}) 表決通過！`
          : `Motion "${motName}" passed!`;
        showToast(passMsg, 'success', 3500);
      }
      setTimeout(() => {
        executeMotion(curMot, originalIdx);
      }, 500);
    } else {
      if (typeof showToast === 'function') {
        const failMsg = state.language === 'zh'
          ? `動議【${motName}】(${motProposer}) 表決未獲通過（否決）。`
          : `Motion "${motName}" failed.`;
        showToast(failMsg, 'error', 3500);
      }
      setTimeout(() => {
        state.selectedCountries.forEach(c => { c.vote = 'none'; c.hasRights = false; });
        state.voteStage = 'r1';
        state.activeVoterIndex = 0;
        if (typeof removeMotion === 'function') {
          removeMotion(originalIdx);
        } else if (typeof originalIdx === 'number' && originalIdx >= 0 && state.motions) {
          state.motions.splice(originalIdx, 1);
        }
        switchTab('motions');
      }, 700);
    }
  }

  // Check if roll call voting for a substantive draft resolution has finished, determine pass/fail, and auto-conclude
  let lastAutoConcludedRes = null;
  function checkResolutionVotingAutoFinish(eligibleVoters, favorCount, againstCount, requiredMajority) {
    if (state.activeVoteTarget === 'motion' || state.currentTab !== 'vote') return;
    const resTitle = (state.voteResolutionTitle || state.resolutionTitle) || 'Draft Resolution 1.1';
    const totalVotesKey = `${resTitle}_${favorCount}_${againstCount}_${eligibleVoters.length}`;
    if (lastAutoConcludedRes === totalVotesKey) return;
    lastAutoConcludedRes = totalVotesKey;

    const t = I18N[state.language] || I18N.en;
    let isPassed = false;

    if (state.voteThreshold === 'consensus') {
      isPassed = (againstCount === 0 && favorCount > 0);
    } else if (state.voteThreshold === 'unsc9') {
      isPassed = (favorCount >= 9);
    } else if (state.voteThreshold === 'twothirds') {
      isPassed = (favorCount > 0 && favorCount >= requiredMajority);
    } else {
      isPassed = (favorCount > againstCount);
    }

    state.resolutionPassed = isPassed;
    const verdictElem = document.getElementById('vote-verdict');
    if (verdictElem) {
      if (isPassed) {
        verdictElem.textContent = (t.passed || 'PASSED').toUpperCase();
        verdictElem.className = 'text-xs sm:text-sm font-black tracking-wide text-emerald-600';
      } else {
        verdictElem.textContent = (t.failed || 'FAILED').toUpperCase();
        verdictElem.className = 'text-xs sm:text-sm font-black tracking-wide text-rose-600';
      }
    }
    saveToLocalStorage(true, true);

    if (isPassed) {
      if (typeof customAlert === 'function') {
        customAlert(
          state.language === 'zh' ? '通過' : 'Passed',
          ''
        );
      }
    } else {
      if (typeof customAlert === 'function') {
        customAlert(
          state.language === 'zh' ? '未通過' : 'Failed',
          ''
        );
      }
    }
  }

  function renderVotingView() {
    // Always render roll call grid so it's ready when viewing rollcall
    renderRollCallGrid();
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

      const presentLabel = state.language === 'zh' ? '出席' : (t.present || 'Present');
      const absentLabel = state.language === 'zh' ? '缺席' : (t.absent || 'Absent');
      const pvLabel = state.language === 'zh' ? '出席且投票' : (t.pv || 'P & Voting');

      if (isUncalled) {
        // 出席缺席大小要一樣，透亮半透明色彩 (橄欖抹茶綠 #7D9462 / 覆盆子紅 #913D48)
        rightContent = `
          <div class="rollcall-btn-container flex items-center space-x-2 shrink-0">
            <button type="button" class="btn-rollcall-present flex-1 rounded-xl font-black text-center transition cursor-pointer" style="border: 1.5px solid #7D9462 !important; color: #7D9462 !important; background-color: rgba(125, 148, 98, 0.2) !important;">
              ${presentLabel}
            </button>
            <button type="button" class="btn-rollcall-absent flex-1 rounded-xl font-black text-center transition cursor-pointer" style="border: 1.5px solid #913D48 !important; color: #913D48 !important; background-color: rgba(145, 61, 72, 0.15) !important;">
              ${absentLabel}
            </button>
          </div>
        `;
      } else if (isPresent) {
        // 出席（橄欖抹茶綠）：透亮半透明綠底 (rgba(125, 148, 98, 0.32))，搭配橄欖抹茶綠邊框 (#7D9462)
        rightContent = `
          <div class="rollcall-btn-container shrink-0 flex justify-end">
            <button type="button" class="btn-rollcall-expanded btn-rollcall-status-present w-full rounded-xl font-black text-center transition cursor-pointer" style="background-color: rgba(125, 148, 98, 0.32) !important; background: rgba(125, 148, 98, 0.32) !important; color: #5B6D46 !important; border: 2px solid #7D9462 !important;">
              ${presentLabel}
            </button>
          </div>
        `;
      } else if (isPv) {
        // 出席且投票（PV 琥珀金/香檳金）：透亮半透明金底，搭配金色邊框與文字
        rightContent = `
          <div class="rollcall-btn-container shrink-0 flex justify-end">
            <button type="button" class="btn-rollcall-expanded btn-rollcall-status-pv w-full rounded-xl font-black text-center transition cursor-pointer" style="background-color: rgba(214, 181, 117, 0.28) !important; background: rgba(214, 181, 117, 0.28) !important; color: #B58A38 !important; border: 2px solid #D6B575 !important;">
              ${pvLabel}
            </button>
          </div>
        `;
      } else if (isAbsent) {
        // 缺席（覆盆子紅）：透亮半透明紅底 (rgba(145, 61, 72, 0.25))，搭配覆盆子紅邊框與文字
        rightContent = `
          <div class="rollcall-btn-container shrink-0 flex justify-end">
            <button type="button" class="btn-rollcall-expanded btn-rollcall-status-absent w-full rounded-xl font-black text-center transition cursor-pointer" style="background-color: rgba(145, 61, 72, 0.25) !important; background: rgba(145, 61, 72, 0.25) !important; color: #913D48 !important; border: 2px solid #913D48 !important;">
              ${absentLabel}
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

  function updateMotionVoteHeaderInfo() {
    const isMotionVote = state.activeVoteTarget === 'motion';
    const titleContainer = document.getElementById('resolution-title-container');
    const titleInput = document.getElementById('vote-resolution-title-input');
    const motionDescEl = document.getElementById('motion-vote-desc');
    const motionDetailsText = document.getElementById('motion-vote-details-text');
    const motionProposerFlag = document.getElementById('motion-vote-proposer-flag');
    const motionSubtitleEl = document.getElementById('motion-vote-type-subtitle');
    const motionTypeText = document.getElementById('motion-vote-type-text');
    const threshElem = document.getElementById('select-vote-threshold');
    const t = I18N[state.language] || I18N.en;

    if (threshElem) {
      threshElem.value = state.voteThreshold || 'simple';
    }

    if (isMotionVote) {
      const activeMotion = state.votingMotion || (state.motions && state.motions[0]) || null;
      if (activeMotion) {
        const motionTypeName = `${formatMotionType(activeMotion.type)}`;
        
        // Hide editable resolution title input; show large motion details title & subtitle
        if (titleContainer) titleContainer.classList.add('hidden');
        if (titleInput) {
          titleInput.value = motionTypeName;
        }

        if (motionDescEl) {
          motionDescEl.classList.remove('hidden');
          const mCountry = state.selectedCountries.find(c => getCountryDisplayName(c) === activeMotion.proposer);
          const flagHtml = mCountry ? `<img src="${getFlagUrl(mCountry)}" class="w-5 h-3.5 inline-block rounded object-cover mr-1.5 align-middle border border-slate-300">` : '';
          if (motionProposerFlag) motionProposerFlag.innerHTML = flagHtml;
          if (motionDetailsText) {
            motionDetailsText.textContent = `${activeMotion.proposer} • ${activeMotion.topic || t.generalDiscussion || 'General Discussion'}`;
          }
        }

        if (motionSubtitleEl) {
          motionSubtitleEl.classList.remove('hidden');
          if (motionTypeText) {
            motionTypeText.textContent = motionTypeName;
          }
        }
      } else {
        if (titleContainer) titleContainer.classList.remove('hidden');
        if (titleInput) {
          titleInput.value = t.noMotionsAvailableToVote || '無待表決之動議';
          titleInput.readOnly = true;
        }
        if (motionDescEl) motionDescEl.classList.add('hidden');
        if (motionSubtitleEl) motionSubtitleEl.classList.add('hidden');
      }
    } else {
      if (titleContainer) titleContainer.classList.remove('hidden');
      if (titleInput) {
        titleInput.value = state.voteResolutionTitle || 'Draft Resolution 1.1';
        titleInput.readOnly = false;
        titleInput.classList.add('hover:border-slate-300', 'focus:border-primary');
      }
      if (motionDescEl) motionDescEl.classList.add('hidden');
      if (motionSubtitleEl) motionSubtitleEl.classList.add('hidden');
    }
  }

  function updateScoreboardAndVerdict() {
    const scoreboard = document.getElementById('voting-scoreboard');
    const isMotionVote = state.activeVoteTarget === 'motion';
    const isSessionMode = state.votingSubtab === 'session';
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
    let favorCount = 0;
    let againstCount = 0;
    let abstainCount = 0;

    if (isSessionMode && Array.isArray(state.sessionVotes) && state.sessionVotes.length > 0) {
      const activeSess = state.sessionVotes.find(s => s.id === state.activeSessionId) || state.sessionVotes[0];
      if (activeSess) {
        favorCount = activeSess.favor || 0;
        againstCount = activeSess.against || 0;
        abstainCount = activeSess.abstain || 0;
      }
    } else {
      favorCount = state.selectedCountries.filter(c => c.vote === 'favor').length;
      againstCount = state.selectedCountries.filter(c => c.vote === 'against').length;
      abstainCount = state.selectedCountries.filter(c => c.vote === 'abstain').length;
    }

    const elFavor = document.getElementById('vote-count-favor');
    const elAgainst = document.getElementById('vote-count-against');
    const elAbstain = document.getElementById('vote-count-abstain');
    const elMajority = document.getElementById('vote-count-majority');
    if (elFavor) elFavor.textContent = favorCount;
    if (elAgainst) elAgainst.textContent = againstCount;
    if (elAbstain) elAbstain.textContent = abstainCount;

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
      const base = (state.voteType === 'procedural' || isSessionMode) ? totalPresent : (substantiveVoters > 0 ? substantiveVoters : totalPresent);
      requiredMajority = Math.ceil((base * 2) / 3);
    } else if (state.voteThreshold === 'consensus') {
      requiredMajority = totalPresent;
    } else {
      // Simple majority
      const base = (state.voteType === 'procedural' || isSessionMode) ? totalPresent : (substantiveVoters > 0 ? substantiveVoters : totalPresent);
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
    const btnMotionExecute = document.getElementById('btn-motion-vote-execute');
    const btnMotionExecuteText = document.getElementById('btn-motion-vote-execute-text');

    if (verdictElem) {
      if (totalVotesCast === 0) {
        verdictElem.textContent = t.pending || 'PENDING';
      } else if (isSessionMode) {
        // In session mode, calculate verdict dynamically
        if (state.voteThreshold === 'twothirds') {
          verdictElem.textContent = (favorCount > 0 && favorCount >= requiredMajority) ? (t.passed || 'PASSED').toUpperCase() : (t.failed || 'FAILED').toUpperCase();
        } else if (state.voteThreshold === 'unsc9') {
          verdictElem.textContent = (favorCount >= 9) ? (t.passed || 'PASSED').toUpperCase() : (t.failed || 'FAILED').toUpperCase();
        } else if (state.voteThreshold === 'consensus') {
          verdictElem.textContent = (againstCount === 0 && favorCount > 0) ? (t.passed || 'PASSED').toUpperCase() : (t.failed || 'FAILED').toUpperCase();
        } else {
          verdictElem.textContent = (favorCount > againstCount) ? (t.passed || 'PASSED').toUpperCase() : (t.failed || 'FAILED').toUpperCase();
        }
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

      // If this is a motion vote and it passed, show the "Execute Motion" button
      const isPassed = verdictElem.textContent.includes((t.passed || 'PASSED').toUpperCase());
      const btnQuickPass = document.getElementById('btn-quick-pass');
      if (btnQuickPass) {
        if (isPassed) {
          btnQuickPass.classList.remove('hidden');
        } else {
          btnQuickPass.classList.add('hidden');
        }
      }

      if (btnMotionExecute) {
        if (isMotionVote && isPassed && (state.votingMotion || state.motions.length > 0)) {
          btnMotionExecute.classList.remove('hidden');
          const curMot = state.votingMotion || state.motions[0];
          if (btnMotionExecuteText) {
            if (curMot && (curMot.type === 'previous_question' || curMot.type === 'close')) {
              btnMotionExecuteText.textContent = state.language === 'zh' ? '結束辯論，進入決議案實質表決' : (t.enterSubstantiveVotePrompt || 'Close Debate & Enter Resolution Vote');
            } else {
              btnMotionExecuteText.textContent = t.executeMotionBtn || '執行動議';
            }
          }
        } else {
          btnMotionExecute.classList.add('hidden');
        }
      }

      // Check if all countries finished voting on a motion, auto-judge and auto-navigate (rollcall only)
      if (!isSessionMode) {
        if (isMotionVote && remainingToVote === 0 && eligibleVoters.length > 0) {
          checkMotionVotingAutoFinish(eligibleVoters, favorCount, againstCount, remainingToVote, requiredMajority);
        } else if (!isMotionVote && remainingToVote === 0 && eligibleVoters.length > 0) {
          checkResolutionVotingAutoFinish(eligibleVoters, favorCount, againstCount, requiredMajority);
        }
      }
    }
  }

  function renderResolutionVoteGrid() {
    const btnR1 = document.getElementById('vote-stage-r1');
    const btnR2 = document.getElementById('vote-stage-r2');
    const btnRights = document.getElementById('vote-stage-rights');
    const pRights = document.getElementById('panel-rights-speeches');
    const pBallots = document.getElementById('panel-ballots-container');
    const pActiveCard = document.getElementById('panel-active-voter-card');
    const pSession = document.getElementById('panel-session-votes-container');
    const detailsCard = document.getElementById('card-voting-details');
    const btnSubtabRollcall = document.getElementById('btn-voting-subtab-rollcall');
    const btnSubtabSession = document.getElementById('btn-voting-subtab-session');
    const topSessionControls = document.getElementById('vote-session-top-controls');
    const voteStagesGroup = document.getElementById('vote-stages-group');

    // Check if motion vote is active
    const isMotionVote = state.activeVoteTarget === 'motion';
    const curMotion = isMotionVote ? (state.votingMotion || (state.motions && state.motions[0])) : null;
    const motionType = curMotion ? curMotion.type : null;
    const isSessionAllowed = true;

    // Auto-populate Vote Topic from current motion if in motion vote mode and topic is empty
    if (isMotionVote && curMotion && !state.voteTopic && typeof getMotionAutoTopicText === 'function') {
      state.voteTopic = getMotionAutoTopicText(curMotion);
    }

    // Sync Vote Topic input
    const inputVoteTopic = document.getElementById('input-vote-topic');
    if (inputVoteTopic && document.activeElement !== inputVoteTopic) {
      inputVoteTopic.value = state.voteTopic || '';
    }

    // Default votingSubtab is session if voting for motion, otherwise rollcall
    if (!state.votingSubtab || state.votingSubtab === 'ballots') {
      state.votingSubtab = isMotionVote ? 'session' : 'rollcall';
    }

    const isRollcall = state.votingSubtab === 'rollcall';
    const isSession = state.votingSubtab === 'session';

    // Update Subtab button styling
    if (btnSubtabRollcall) {
      btnSubtabRollcall.className = `px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
        isRollcall ? 'active font-bold' : ''
      }`;
    }
    if (btnSubtabSession) {
      btnSubtabSession.disabled = false;
      btnSubtabSession.style.opacity = '1';
      btnSubtabSession.style.cursor = 'pointer';
      btnSubtabSession.title = '';
      btnSubtabSession.className = `px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
        isSession ? 'active font-bold' : ''
      }`;
    }

    // Toggle top controls based on subtab
    if (topSessionControls) {
      topSessionControls.classList.toggle('hidden', !isSession);
    }
    if (voteStagesGroup) {
      voteStagesGroup.classList.add('hidden');
    }

    // If Session Subtab is active: handle details card and visibility
    const hintBanner = document.getElementById('motion-session-hint-banner');
    const scoreboard = document.getElementById('voting-scoreboard');

    if (state.votingSubtab === 'session') {
      if (pBallots) pBallots.classList.add('hidden');
      if (pActiveCard) pActiveCard.classList.add('hidden');
      if (pRights) pRights.classList.add('hidden');
      if (pSession) pSession.classList.remove('hidden');

      // Keep detailsCard visible in Session mode so users can view statistics
      if (detailsCard) detailsCard.classList.remove('hidden');
      if (scoreboard && state.showResults) {
        scoreboard.style.display = '';
        scoreboard.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      }
      if (hintBanner) {
        if (isMotionVote) {
          hintBanner.classList.remove('hidden');
          const hintText = document.getElementById('motion-session-hint-text');
          if (hintText) {
            const m = state.votingMotion || (state.motions && state.motions[0]);
            if (state.language === 'zh') {
              hintText.textContent = m ? `正在進行動議會期快速表決：${formatMotionType(m.type)} (${m.proposer})` : '正在進行動議會期快速表決';
            } else {
              hintText.textContent = m ? `Quick Session Vote in Progress: ${formatMotionType(m.type)} (${m.proposer})` : 'Quick Session Vote in Progress';
            }
          }
        } else {
          hintBanner.classList.add('hidden');
        }
      }

      // Populate titles and motion badges even in session mode
      updateMotionVoteHeaderInfo();
      renderSessionVotesGrid();
      // Update scoreboard counters, required majority and progress for session mode
      updateScoreboardAndVerdict();
      return;
    } else {
      if (detailsCard) detailsCard.classList.remove('hidden');
      if (pSession) pSession.classList.add('hidden');
      if (hintBanner) hintBanner.classList.add('hidden');
      if (scoreboard && state.showResults) scoreboard.classList.remove('hidden');
    }

    // Stage button styles
    [btnR1, btnR2].forEach(b => {
      if (b) b.className = 'px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 transition';
    });
    
    if (state.voteStage === 'r2') {
      if (btnR2) btnR2.className = 'px-3 py-1.5 bg-primary text-white rounded-lg text-xs transition shadow-sm';
      if (pRights) pRights.classList.add('hidden');
      if (pBallots) pBallots.classList.add('hidden');
      if (pActiveCard) pActiveCard.classList.remove('hidden');
    } else {
      state.voteStage = 'r1';
      if (btnR1) btnR1.className = 'px-3 py-1.5 bg-primary text-white rounded-lg text-xs transition shadow-sm';
      if (pRights) pRights.classList.add('hidden');
      if (pBallots) pBallots.classList.add('hidden');
      if (pActiveCard) pActiveCard.classList.remove('hidden');
    }

    // Stages Group & Target Buttons
    const btnTargetRes = document.getElementById('btn-vote-target-resolution');
    const btnTargetMot = document.getElementById('btn-vote-target-motion');
    const stagesGroup = document.getElementById('vote-stages-group');
    const btnMotionExecute = document.getElementById('btn-motion-vote-execute');
    const btnMotionExecuteText = document.getElementById('btn-motion-vote-execute-text');
    const badgeMotionRule = document.getElementById('badge-motion-vote-rule');
    const motionDescEl = document.getElementById('motion-vote-desc');
    const motionDetailsText = document.getElementById('motion-vote-details-text');
    const motionProposerFlag = document.getElementById('motion-vote-proposer-flag');

    if (btnTargetRes && btnTargetMot) {
      if (isMotionVote) {
        btnTargetRes.className = 'px-3 py-1.5 rounded-lg text-xs font-medium transition text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 cursor-pointer';
        btnTargetMot.className = 'px-3 py-1.5 rounded-lg text-xs font-medium transition bg-white shadow-sm text-slate-800 flex items-center space-x-1.5 cursor-pointer font-bold';
      } else {
        btnTargetRes.className = 'px-3 py-1.5 rounded-lg text-xs font-medium transition bg-white shadow-sm text-slate-800 flex items-center space-x-1.5 cursor-pointer font-bold';
        btnTargetMot.className = 'px-3 py-1.5 rounded-lg text-xs font-medium transition text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 cursor-pointer';
      }
    }

    // In procedural motion vote, rights speeches don't apply; hide stage buttons or lock to R1
    if (stagesGroup) {
      const btnR2 = document.getElementById('vote-stage-r2');
      const btnRightsStage = document.getElementById('vote-stage-rights');
      if (btnRightsStage) btnRightsStage.classList.add('hidden');
      if (isMotionVote) {
        if (btnR2) btnR2.classList.add('hidden');
      } else {
        if (btnR2) btnR2.classList.remove('hidden');
      }
    }

    // Update motion vote header info and badge labels
    updateMotionVoteHeaderInfo();

    updateScoreboardAndVerdict();

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
            state.speakingSubtab = 'intro';
            switchTab('gsl');
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
    if (pool.length > 0 && state.activeVoterIndex > pool.length) {
      state.activeVoterIndex = pool.length;
    }

    // Render MUN Command Active Voter Card
    const isCompleted = pool.length > 0 && state.activeVoterIndex >= pool.length;
    const currentVoter = (!isCompleted && pool.length > 0) ? (pool[state.activeVoterIndex] || null) : null;
    const flagEl = document.getElementById('active-voter-flag');
    const nameEl = document.getElementById('active-voter-name');
    const statusEl = document.getElementById('active-voter-status');
    const queueEl = document.getElementById('label-voter-queue-status');
    const stageLabel = document.getElementById('label-active-voter-stage');

    if (stageLabel) {
      stageLabel.textContent = state.voteStage === 'r2' ? (t.round2RollCall || 'Round 2 Roll Call (Passes)') : (t.round1RollCall || 'Round 1 Roll Call');
    }

    if (currentVoter) {
      if (flagEl) {
        flagEl.src = getFlagUrl(currentVoter);
        flagEl.style.display = '';
      }
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
      if (flagEl) {
        flagEl.src = 'assets/img/general/all_countries.svg';
        flagEl.style.display = 'none';
      }
      if (nameEl) nameEl.textContent = pool.length === 0 && state.voteStage === 'r2' ? (t.noPassInRound1Short || 'No delegates passed in Round 1') : (t.allVotesRecorded || 'All votes recorded');
      if (statusEl) statusEl.textContent = pool.length === 0 ? '' : (t.votingComplete || 'Voting complete');
      if (queueEl) queueEl.textContent = `${pool.length} / ${pool.length}`;
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

  // ================= NON-VOTING / SESSION VOTES GRID =================
  function renderSessionVotesGrid() {
    const grid = document.getElementById('grid-session-cards');
    const inputCount = document.getElementById('input-session-count');
    if (!grid) return;

    // Ensure sessionVotes array is consistent with sessionCount
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

    if (inputCount) {
      inputCount.value = state.sessionVotes.length;
    }

    grid.innerHTML = '';
    const t = I18N[state.language] || I18N.en;

    state.sessionVotes.forEach((sess) => {
      const isSelected = (sess.id === state.activeSessionId);
      const totalVotes = (sess.favor || 0) + (sess.against || 0) + (sess.abstain || 0);

      const card = document.createElement('div');
      card.className = `p-5 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between ${
        isSelected
          ? 'bg-white border-primary shadow-md ring-2 ring-primary/20'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`;

      card.innerHTML = `
        <div class="space-y-3">
          <!-- Header: Title & Total Badge -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 gap-2">
            <div class="flex items-center space-x-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-slate-300'} shrink-0"></span>
              <input type="text" class="session-name-input font-bold text-slate-800 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:outline-none transition px-1 py-0.5 rounded truncate" value="${sess.name || `Session ${sess.id}`}" placeholder="Session Name">
            </div>
            <div class="flex items-center space-x-1 shrink-0">
              <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                ${t.totalVotesLabel || '總票'}: ${totalVotes}
              </span>
              <button type="button" class="btn-clear-session text-slate-400 hover:text-rose-500 p-1 text-xs transition cursor-pointer" data-id="${sess.id}" title="${state.language === 'zh' ? '清空此會期票數' : 'Clear this session votes'}">
                ✕
              </button>
            </div>
          </div>

          <!-- Pure Counters: Agree / Disagree / Abstain -->
          <div class="space-y-2 pt-1">
            <!-- Agree (Favor) -->
            <div class="p-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3">
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span class="text-xs font-bold text-emerald-600">${t.yes || '同意'}</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <button type="button" class="btn-dec-favor w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 font-black text-sm flex items-center justify-center transition cursor-pointer" data-id="${sess.id}">-</button>
                <input type="number" min="0" class="input-val-favor w-14 h-7 text-center font-mono font-bold text-sm bg-white border border-emerald-500/30 rounded-lg text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500" value="${sess.favor || 0}" data-id="${sess.id}">
                <button type="button" class="btn-inc-favor w-7 h-7 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-sm" data-id="${sess.id}">+</button>
              </div>
            </div>

            <!-- Disagree (Against) -->
            <div class="p-2 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between gap-3">
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                <span class="text-xs font-bold text-rose-600">${t.no || '不同意'}</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <button type="button" class="btn-dec-against w-7 h-7 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 font-black text-sm flex items-center justify-center transition cursor-pointer" data-id="${sess.id}">-</button>
                <input type="number" min="0" class="input-val-against w-14 h-7 text-center font-mono font-bold text-sm bg-white border border-rose-500/30 rounded-lg text-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-500" value="${sess.against || 0}" data-id="${sess.id}">
                <button type="button" class="btn-inc-against w-7 h-7 rounded-lg bg-rose-500 text-white hover:bg-rose-600 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-sm" data-id="${sess.id}">+</button>
              </div>
            </div>

            <!-- Abstain -->
            <div class="p-2 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-3">
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span class="text-xs font-bold text-amber-600">${t.abs || '棄票'}</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <button type="button" class="btn-dec-abstain w-7 h-7 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 font-black text-sm flex items-center justify-center transition cursor-pointer" data-id="${sess.id}">-</button>
                <input type="number" min="0" class="input-val-abstain w-14 h-7 text-center font-mono font-bold text-sm bg-white border border-amber-500/30 rounded-lg text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500" value="${sess.abstain || 0}" data-id="${sess.id}">
                <button type="button" class="btn-inc-abstain w-7 h-7 rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-sm" data-id="${sess.id}">+</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Event Bindings for this session card
      const nameInput = card.querySelector('.session-name-input');
      if (nameInput) {
        nameInput.addEventListener('change', (e) => {
          sess.name = e.target.value.trim() || `Session ${sess.id}`;
          saveToLocalStorage(true, true);
        });
      }

      const noteInput = card.querySelector('.session-note-input');
      if (noteInput) {
        noteInput.addEventListener('change', (e) => {
          sess.note = e.target.value.trim();
          saveToLocalStorage(true, true);
        });
      }

      // Favor
      const btnIncFavor = card.querySelector('.btn-inc-favor');
      const btnDecFavor = card.querySelector('.btn-dec-favor');
      const inputFavor = card.querySelector('.input-val-favor');
      if (btnIncFavor) {
        btnIncFavor.addEventListener('click', (e) => {
          e.stopPropagation();
          sess.favor = (sess.favor || 0) + 1;
          saveToLocalStorage(true, true);
          renderSessionVotesGrid();
          updateScoreboardAndVerdict();
        });
      }
      if (btnDecFavor) {
        btnDecFavor.addEventListener('click', (e) => {
          e.stopPropagation();
          if ((sess.favor || 0) > 0) {
            sess.favor--;
            saveToLocalStorage(true, true);
            renderSessionVotesGrid();
            updateScoreboardAndVerdict();
          }
        });
      }
      if (inputFavor) {
        inputFavor.addEventListener('change', (e) => {
          sess.favor = Math.max(0, parseInt(e.target.value) || 0);
          saveToLocalStorage(true, true);
          renderSessionVotesGrid();
          updateScoreboardAndVerdict();
        });
      }

      // Against
      const btnIncAgainst = card.querySelector('.btn-inc-against');
      const btnDecAgainst = card.querySelector('.btn-dec-against');
      const inputAgainst = card.querySelector('.input-val-against');
      if (btnIncAgainst) {
        btnIncAgainst.addEventListener('click', (e) => {
          e.stopPropagation();
          sess.against = (sess.against || 0) + 1;
          saveToLocalStorage(true, true);
          renderSessionVotesGrid();
          updateScoreboardAndVerdict();
        });
      }
      if (btnDecAgainst) {
        btnDecAgainst.addEventListener('click', (e) => {
          e.stopPropagation();
          if ((sess.against || 0) > 0) {
            sess.against--;
            saveToLocalStorage(true, true);
            renderSessionVotesGrid();
            updateScoreboardAndVerdict();
          }
        });
      }
      if (inputAgainst) {
        inputAgainst.addEventListener('change', (e) => {
          sess.against = Math.max(0, parseInt(e.target.value) || 0);
          saveToLocalStorage(true, true);
          renderSessionVotesGrid();
          updateScoreboardAndVerdict();
        });
      }

      // Abstain
      const btnIncAbstain = card.querySelector('.btn-inc-abstain');
      const btnDecAbstain = card.querySelector('.btn-dec-abstain');
      const inputAbstain = card.querySelector('.input-val-abstain');
      if (btnIncAbstain) {
        btnIncAbstain.addEventListener('click', (e) => {
          e.stopPropagation();
          sess.abstain = (sess.abstain || 0) + 1;
          saveToLocalStorage(true, true);
          renderSessionVotesGrid();
          updateScoreboardAndVerdict();
        });
      }
      if (btnDecAbstain) {
        btnDecAbstain.addEventListener('click', (e) => {
          e.stopPropagation();
          if ((sess.abstain || 0) > 0) {
            sess.abstain--;
            saveToLocalStorage(true, true);
            renderSessionVotesGrid();
            updateScoreboardAndVerdict();
          }
        });
      }
      if (inputAbstain) {
        inputAbstain.addEventListener('change', (e) => {
          sess.abstain = Math.max(0, parseInt(e.target.value) || 0);
          saveToLocalStorage(true, true);
          renderSessionVotesGrid();
          updateScoreboardAndVerdict();
        });
      }

      // Clear Session
      const btnClear = card.querySelector('.btn-clear-session');
      if (btnClear) {
        btnClear.addEventListener('click', (e) => {
          e.stopPropagation();
          sess.favor = 0;
          sess.against = 0;
          sess.abstain = 0;
          saveToLocalStorage(true, true);
          renderSessionVotesGrid();
          updateScoreboardAndVerdict();
        });
      }

      // Adopt Session
      const btnAdoptSess = card.querySelector('.btn-adopt-session');
      if (btnAdoptSess) {
        btnAdoptSess.addEventListener('click', (e) => {
          e.stopPropagation();
          adoptVotingSession(sess);
        });
      }

      card.addEventListener('click', () => {
        if (state.activeSessionId !== sess.id) {
          state.activeSessionId = sess.id;
          saveToLocalStorage(true, true);
          renderSessionVotesGrid();
          updateScoreboardAndVerdict();
        }
      });

      grid.appendChild(card);
    });
  }

  function adoptVotingSession(sess) {
    const t = I18N[state.language] || I18N.en;
    const sessName = sess.name || `Session ${sess.id}`;
    const favor = sess.favor || 0;
    const against = sess.against || 0;
    const abstain = sess.abstain || 0;

    showModal({
      title: state.language === 'zh' ? '確認通過表決' : 'Confirm Adoption',
      message: state.language === 'zh' 
        ? `確定要通過【${sessName}】嗎？\n(贊成: ${favor}，反對: ${against}，棄權: ${abstain})`
        : `Are you sure you want to adopt 【${sessName}】?\n(In Favor: ${favor}, Against: ${against}, Abstain: ${abstain})`,
      confirmText: state.language === 'zh' ? '確認通過' : 'Pass & Adopt',
      cancelText: t.cancel || '取消',
      onConfirm: () => {
        sess.status = 'passed';
        saveToLocalStorage(true, true);
        renderSessionVotesGrid();
        customAlert(
          state.language === 'zh' ? '表決已通過' : 'Vote Adopted',
          state.language === 'zh' ? `【${sessName}】已正式通過！` : `【${sessName}】has been officially passed and adopted!`
        );
      }
    });
  }

  function adoptCurrentVote() {
    const t = I18N[state.language] || I18N.en;
    const isMotion = state.activeVoteTarget === 'motion' || (state.motions && state.motions.length > 0 && state.votingMotion);

    if (isMotion) {
      const curMot = state.votingMotion || (state.motions && state.motions[0]);
      if (curMot) {
        const targetIdx = (typeof curMot.originalIndex === 'number') ? curMot.originalIndex : 0;
        showModal({
          title: state.language === 'zh' ? '確認通過動議' : 'Adopt Motion',
          message: state.language === 'zh' 
            ? `確定要宣布通過此動議嗎？\n【${curMot.topic || curMot.type || '動議'}】`
            : `Confirm adoption of this motion?\n【${curMot.topic || curMot.type || 'Motion'}】`,
          confirmText: state.language === 'zh' ? '通過並執行' : 'Adopt & Execute',
          cancelText: t.cancel || '取消',
          onConfirm: () => {
            if (typeof executeMotion === 'function') {
              executeMotion(curMot, targetIdx);
            }
          }
        });
        return;
      }
    }

    // Substantive Resolution Vote or Session Vote
    if (state.votingSubtab === 'session') {
      const activeSess = state.sessionVotes.find(s => s.id === state.activeSessionId) || state.sessionVotes[0];
      if (activeSess) {
        adoptVotingSession(activeSess);
        return;
      }
    }

    // Resolution Vote
    const resTitle = (state.voteResolutionTitle || state.resolutionTitle) || 'Draft Resolution 1.1';
    showModal({
      title: state.language === 'zh' ? '宣布決議案結算' : 'Conclude Draft Resolution',
      message: state.language === 'zh' 
        ? `確定主席正式結算並宣布【${resTitle}】通過嗎？`
        : `Confirm official conclusion and passing of 【${resTitle}】?`,
      confirmText: state.language === 'zh' ? '結算通過' : 'Conclude & Pass',
      cancelText: t.cancel || '取消',
      onConfirm: () => {
        state.resolutionPassed = true;
        // Set all non-voted or current verdict to passed
        const verdictElem = document.getElementById('vote-verdict');
        if (verdictElem) {
          verdictElem.textContent = (t.passed || 'PASSED').toUpperCase();
          verdictElem.className = 'text-xs sm:text-sm font-black tracking-wide text-emerald-600';
        }
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
        customAlert(
          state.language === 'zh' ? '通過' : 'Passed',
          ''
        );
      }
    });
  }

  // Expose to window for global event handlers
  window.adoptCurrentVote = adoptCurrentVote;
  window.adoptVotingSession = adoptVotingSession;
