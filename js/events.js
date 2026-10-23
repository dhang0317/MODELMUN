  function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(`view-${tabId}`);
    if (target) {
      target.classList.remove('hidden');
      target.scrollTop = 0;
    }
    // Prevent document / window from drifting or scrolling header out of view
    window.scrollTo(0, 0);
    if (document.body) document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;

    if (!state.isViewerMode) {
      saveToLocalStorage(true, true);
    }
    renderAll();
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    const drawer = document.getElementById('main-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    function openDrawer() {
      drawer.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    }
    function closeDrawer() {
      drawer.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
    const openDrawerBtn = document.getElementById('btn-open-drawer');
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // Floating Confetti Cannon Button
    const btnFloatingConfetti = document.getElementById('btn-floating-confetti');
    if (btnFloatingConfetti) {
      btnFloatingConfetti.addEventListener('click', () => {
        launchConfettiCannon();
      });
    }

    // Delegate QR Code Launch Buttons (Header and Drawer)
    const btnOpenQrCode = document.getElementById('btn-open-qrcode');
    if (btnOpenQrCode) {
      btnOpenQrCode.addEventListener('click', () => {
        openQRCodeModal();
      });
    }
    const drawerBtnQrCode = document.getElementById('drawer-btn-qrcode');
    if (drawerBtnQrCode) {
      drawerBtnQrCode.addEventListener('click', () => {
        closeDrawer();
        openQRCodeModal();
      });
    }

    // Upload Logo handler
    const uploadLogoBtn = document.getElementById('drawer-btn-upload-logo');
    const inputLogoFile = document.getElementById('input-logo-file');
    if (uploadLogoBtn && inputLogoFile) {
      uploadLogoBtn.addEventListener('click', () => {
        inputLogoFile.click();
      });
      inputLogoFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const base64 = evt.target.result;
            try {
              localStorage.setItem('mun-custom-logo', base64);
              applyCustomLogo(base64);
              const t = I18N[state.language] || I18N.en;
              showToast(t.logoUpdatedSuccess, 'success');
              closeDrawer();
            } catch (err) {
              console.error('Save logo error:', err);
              showToast('圖片檔案較大，請選擇較小的圖片檔', 'error');
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const btnLogoHome = document.getElementById('btn-logo-home');
    if (btnLogoHome) {
      btnLogoHome.addEventListener('click', () => {
        if (state.isViewerMode) return; // Spectators cannot enter setup
        switchTab('setup');
      });
    }

    const segBtnTemplate = document.getElementById('segment-btn-template');
    if (segBtnTemplate) {
      segBtnTemplate.addEventListener('click', () => {
        state.setupSegment = 'template';
        renderSetupView();
      });
    }

    const segBtnFile = document.getElementById('segment-btn-file');
    if (segBtnFile) {
      segBtnFile.addEventListener('click', () => {
        state.setupSegment = 'file';
        renderSetupView();
      });
    }

    const btnTriggerUpload = document.getElementById('btn-trigger-upload');
    if (btnTriggerUpload) {
      btnTriggerUpload.addEventListener('click', () => {
        document.getElementById('input-import-file').click();
      });
    }

    const btnStartSession = document.getElementById('btn-start-session');
    if (btnStartSession) {
      btnStartSession.addEventListener('click', () => {
        const t = I18N[state.language] || I18N.en;
        if (state.selectedCountries.length === 0) {
          customAlert(t.sessionSetup, t.addCountryBeforeStartAlert);
          return;
        }
        const stats = computeStats();
        if (stats.presentCount === 0) {
          switchTab('rollcall');
        } else {
          switchTab('gsl');
        }
      });
    }

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        applyPreset(preset);
      });
    });

    const headerGaSelect = document.getElementById('header-ga-select');
    if (headerGaSelect) {
      headerGaSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          applyPreset(val);
          // reset back to default title for next selection
          headerGaSelect.selectedIndex = 0;
        }
      });
    }

    const gaSelect = document.getElementById('select-ga-preset');
    if (gaSelect) {
      gaSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          applyPreset(val);
        }
      });
    }

    document.getElementById('search-countries').addEventListener('input', () => {
      renderSetupView();
      if (window.lucide) window.lucide.createIcons();
    });

    document.getElementById('btn-clear-selection').addEventListener('click', () => {
      state.selectedCountries = [];
      updateAvailableCountriesPool();
      saveToLocalStorage();
      renderAll();
    });

    const btnAddCustom = document.getElementById('btn-add-custom-country');
    if (btnAddCustom) {
      btnAddCustom.addEventListener('click', () => {
        const input = document.getElementById('input-custom-country');
        const val = input ? input.value.trim() : '';
        if (val) {
          const customObj = {
            id: 'CC_' + Date.now(),
            countryName: val,
            name_en: val,
            name_zh: val,
            name_fr: val,
            countryUrl: 'https://flagcdn.com/w80/un.png',
            attendance: 'uncalled',
            powerStatus: 'observer',
            vote: 'abstain',
            hasRights: false
          };
          state.selectedCountries.push(customObj);
          state.selectedCountries.sort(countrySortCompare);
          if (input) input.value = '';
          saveToLocalStorage();
          renderAll();
        }
      });
    }

    const headerCommInput = document.getElementById('header-committee-input');
    if (headerCommInput) {
      headerCommInput.addEventListener('input', (e) => {
        state.committeeName = e.target.value;
        const commNameInput = document.getElementById('input-committee-name');
        if (commNameInput) commNameInput.value = state.committeeName;
        saveToLocalStorage(true, false);
      });
    }

    const headerAgendaInput = document.getElementById('header-agenda-input');
    if (headerAgendaInput) {
      headerAgendaInput.addEventListener('input', (e) => {
        state.agenda = e.target.value;
        const agendaTitleInput = document.getElementById('input-agenda-title');
        if (agendaTitleInput) agendaTitleInput.value = state.agenda;
        saveToLocalStorage(true, false);
      });
    }

    const commNameInput = document.getElementById('input-committee-name');
    if (commNameInput) {
      commNameInput.addEventListener('input', (e) => {
        state.committeeName = e.target.value;
        const hComm = document.getElementById('header-committee-input');
        if (hComm) hComm.value = state.committeeName;
        saveToLocalStorage(true, false);
      });
    }

    const agendaTitleInput = document.getElementById('input-agenda-title');
    if (agendaTitleInput) {
      agendaTitleInput.addEventListener('input', (e) => {
        state.agenda = e.target.value;
        const hAg = document.getElementById('header-agenda-input');
        if (hAg) hAg.value = state.agenda;
        saveToLocalStorage(true, false);
      });
    }

    const btnEditAgenda = document.getElementById('btn-edit-agenda');
    if (btnEditAgenda) {
      btnEditAgenda.addEventListener('click', () => {
        const t = I18N[state.language] || I18N.en;
        customPrompt(t.editAgenda, t.enterAgendaPrompt, state.agenda, (val) => {
          if (val) {
            state.agenda = val;
            const hAg = document.getElementById('header-agenda-input');
            if (hAg) hAg.value = val;
            saveToLocalStorage();
          }
        });
      });
    }

    const btnQuickRollcall = document.getElementById('btn-quick-rollcall');
    if (btnQuickRollcall) {
      btnQuickRollcall.addEventListener('click', () => {
        state.voteMode = 'rollcall';
        switchTab('vote');
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
          return;
        }
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        document.body.classList.add('is-fullscreen');
      } else {
        document.body.classList.remove('is-fullscreen');
      }
    });

    // GSL
    document.getElementById('btn-gsl-start').addEventListener('click', startGslTimer);
    document.getElementById('btn-gsl-pause').addEventListener('click', pauseGslTimer);
    document.getElementById('btn-gsl-reset').addEventListener('click', resetGslTimer);
    document.getElementById('btn-gsl-next').addEventListener('click', nextGslSpeaker);

    document.getElementById('btn-yield-chair').addEventListener('click', () => {
      const t = I18N[state.language] || I18N.en;
      const name = getCountryDisplayName(state.currentGslSpeaker);
      customAlert(t.yieldRemaining, `${name} ${t.yieldChairAlert}`);
      nextGslSpeaker();
    });
    document.getElementById('btn-yield-questions').addEventListener('click', () => {
      const t = I18N[state.language] || I18N.en;
      const name = getCountryDisplayName(state.currentGslSpeaker);
      customAlert(t.yieldRemaining, `${name} ${t.yieldQuestionsAlert}`);
    });
    document.getElementById('btn-yield-delegate').addEventListener('click', () => {
      const t = I18N[state.language] || I18N.en;
      openAddSpeakerModal((country) => {
        const fromName = getCountryDisplayName(state.currentGslSpeaker);
        const toName = getCountryDisplayName(country);
        customAlert(t.yieldRemaining, `${fromName} ${t.yieldToAlert} ${toName}.`);
        setGslSpeaker(country);
        renderAll();
      });
    });

    document.getElementById('btn-open-add-speaker').addEventListener('click', () => {
      openAddSpeakerModal((c) => {
        state.gslQueue.push(c);
        renderGslView();
        saveToLocalStorage();
      }, true, 'gsl');
    });

    const defineTimeModal = document.getElementById('modal-define-time');
    document.getElementById('btn-gsl-set-time').addEventListener('click', () => {
      defineTimeModal.classList.remove('hidden');
      const m = Math.floor(state.gslDefaultTime / 60);
      const s = state.gslDefaultTime % 60;
      document.getElementById('input-time-minutes').value = m;
      document.getElementById('input-time-seconds').value = s;
    });
    document.getElementById('btn-save-speaking-time').addEventListener('click', () => {
      const m = parseInt(document.getElementById('input-time-minutes').value) || 0;
      const s = parseInt(document.getElementById('input-time-seconds').value) || 0;
      state.gslDefaultTime = m * 60 + s;
      state.gslRemainingTime = state.gslDefaultTime;
      defineTimeModal.classList.add('hidden');
      saveToLocalStorage();
      renderAll();
    });

    // Mod
    document.getElementById('btn-mod-start').addEventListener('click', startModTimer);
    document.getElementById('btn-mod-pause').addEventListener('click', pauseModTimer);
    document.getElementById('btn-mod-reset').addEventListener('click', resetModTimer);
    document.getElementById('btn-mod-next').addEventListener('click', nextModSpeaker);

    document.getElementById('btn-mod-add-speaker').addEventListener('click', () => {
      openAddSpeakerModal((c) => {
        state.modQueue.push(c);
        renderModView();
        saveToLocalStorage();
      }, true, 'mod');
    });

    const modConfigModal = document.getElementById('modal-mod-config');
    const btnModConfig = document.getElementById('btn-mod-config');
    if (btnModConfig) {
      btnModConfig.addEventListener('click', () => {
        if (modConfigModal) {
          modConfigModal.classList.remove('hidden');
          document.getElementById('input-mod-topic').value = state.modTopic;
          document.getElementById('input-mod-total-mins').value = state.modTotalMins;
          document.getElementById('input-mod-speaker-secs').value = state.modSpeakerSecs;
        }
      });
    }
    const btnSaveModConfig = document.getElementById('btn-save-mod-config');
    if (btnSaveModConfig) {
      btnSaveModConfig.addEventListener('click', () => {
        state.modTopic = document.getElementById('input-mod-topic').value;
        state.modTotalMins = parseInt(document.getElementById('input-mod-total-mins').value) || 10;
        state.modTotalSecsRemaining = state.modTotalMins * 60;
        state.modSpeakerSecs = parseInt(document.getElementById('input-mod-speaker-secs').value) || 60;
        state.modSpeakerSecsRemaining = state.modSpeakerSecs;
        if (modConfigModal) modConfigModal.classList.add('hidden');
        saveToLocalStorage();
        renderAll();
      });
    }

    // Unmod
    document.getElementById('btn-unmod-start').addEventListener('click', startUnmodTimer);
    document.getElementById('btn-unmod-pause').addEventListener('click', pauseUnmodTimer);
    document.getElementById('btn-unmod-reset').addEventListener('click', resetUnmodTimer);
    const btnUnmodSetup = document.getElementById('btn-unmod-setup');
    if (btnUnmodSetup) {
      btnUnmodSetup.addEventListener('click', () => {
        const t = I18N[state.language] || I18N.en;
        customPrompt(t.unmod, t.enterUnmodTimePrompt, Math.round((state.unmodTotalSecs || state.unmodSecsRemaining) / 60), (val) => {
          if (val) {
            const total = (parseInt(val) || 15) * 60;
            state.unmodTotalSecs = total;
            state.unmodSecsRemaining = total;
            saveToLocalStorage();
            renderAll();
          }
        });
      });
    }
    document.querySelectorAll('.btn-extend-unmod').forEach(btn => {
      btn.addEventListener('click', () => {
        const add = parseInt(btn.getAttribute('data-add')) || 60;
        state.unmodSecsRemaining += add;
        if (state.unmodSecsRemaining > (state.unmodTotalSecs || 900)) {
          state.unmodTotalSecs = state.unmodSecsRemaining;
        }
        saveToLocalStorage();
        renderAll();
      });
    });

    // Speaking Subtabs Switching (GSL, MOD, INTRO, PROCON)
    const btnSubGsl = document.getElementById('btn-speaking-subtab-gsl');
    if (btnSubGsl) {
      btnSubGsl.addEventListener('click', () => {
        state.speakingSubtab = 'gsl';
        saveToLocalStorage(true, true);
        renderAll();
      });
    }
    const btnSubMod = document.getElementById('btn-speaking-subtab-mod');
    if (btnSubMod) {
      btnSubMod.addEventListener('click', () => {
        state.speakingSubtab = 'mod';
        saveToLocalStorage(true, true);
        renderAll();
      });
    }
    const btnSubIntro = document.getElementById('btn-speaking-subtab-intro');
    if (btnSubIntro) {
      btnSubIntro.addEventListener('click', () => {
        state.speakingSubtab = 'intro';
        saveToLocalStorage(true, true);
        renderAll();
      });
    }
    const btnSubProcon = document.getElementById('btn-speaking-subtab-procon');
    if (btnSubProcon) {
      btnSubProcon.addEventListener('click', () => {
        state.speakingSubtab = 'procon';
        saveToLocalStorage(true, true);
        renderAll();
      });
    }

    // Pro / Con Debate Controls
    const btnProSide = document.getElementById('btn-procon-side-pro');
    if (btnProSide) {
      btnProSide.addEventListener('click', () => {
        state.currentProConSide = 'pro';
        saveToLocalStorage(true, true);
        renderGslView();
      });
    }
    const btnConSide = document.getElementById('btn-procon-side-con');
    if (btnConSide) {
      btnConSide.addEventListener('click', () => {
        state.currentProConSide = 'con';
        saveToLocalStorage(true, true);
        renderGslView();
      });
    }
    const btnProconStart = document.getElementById('btn-procon-start');
    if (btnProconStart) btnProconStart.addEventListener('click', startProConTimer);
    const btnProconPause = document.getElementById('btn-procon-pause');
    if (btnProconPause) btnProconPause.addEventListener('click', pauseProConTimer);
    const btnProconReset = document.getElementById('btn-procon-reset');
    if (btnProconReset) btnProconReset.addEventListener('click', resetProConTimer);
    const btnProconNext = document.getElementById('btn-procon-next');
    if (btnProconNext) btnProconNext.addEventListener('click', nextProConSpeaker);

    const btnProconSetTime = document.getElementById('btn-procon-set-time');
    if (btnProconSetTime) {
      btnProconSetTime.addEventListener('click', () => {
        customPrompt('Pro / Con Debate', '請輸入個別代表發言時間（秒）：', String(state.proConSpeakerSecs || 60), (val) => {
          if (val) {
            const secs = parseInt(val, 10) || 60;
            state.proConSpeakerSecs = secs;
            state.proConSecsRemaining = secs;
            saveToLocalStorage(true, true);
            renderAll();
          }
        });
      });
    }

    // Direct Inline Typing on Pro / Con Big Timer Display
    const proconTimerInput = document.getElementById('procon-timer-input');
    if (proconTimerInput) {
      proconTimerInput.addEventListener('focus', () => {
        const m = Math.floor(state.proConSecsRemaining / 60);
        const s = state.proConSecsRemaining % 60;
        proconTimerInput.value = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        proconTimerInput.select();
      });
      proconTimerInput.addEventListener('blur', () => {
        applyProConTypedTime();
      });
      proconTimerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          proconTimerInput.blur();
        } else if (e.key === 'Escape') {
          const m = Math.floor(state.proConSecsRemaining / 60);
          const s = state.proConSecsRemaining % 60;
          proconTimerInput.value = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
          proconTimerInput.blur();
        }
      });
    }

    function applyProConTypedTime() {
      if (!proconTimerInput) return;
      const val = proconTimerInput.value.trim();
      let totalSecs = 0;
      if (val.includes(':')) {
        const parts = val.split(':');
        const min = parseInt(parts[0], 10) || 0;
        const sec = parseInt(parts[1], 10) || 0;
        totalSecs = min * 60 + sec;
      } else {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          totalSecs = num > 59 ? num : num * 60;
        }
      }
      if (totalSecs > 0) {
        state.proConSpeakerSecs = totalSecs;
        state.proConSecsRemaining = totalSecs;
        saveToLocalStorage(true, true);
        renderAll();
      } else {
        const m = Math.floor(state.proConSecsRemaining / 60);
        const s = state.proConSecsRemaining % 60;
        proconTimerInput.value = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
      }
    }

    const btnAddPro = document.getElementById('btn-procon-add-pro');
    if (btnAddPro) {
      btnAddPro.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAddSpeakerModal((c) => {
          if (!state.proQueue) state.proQueue = [];
          state.proQueue.push(c);
          saveToLocalStorage(true, true);
          renderAll();
        }, true, 'pro');
      });
    }

    const btnAddCon = document.getElementById('btn-procon-add-con');
    if (btnAddCon) {
      btnAddCon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAddSpeakerModal((c) => {
          if (!state.conQueue) state.conQueue = [];
          state.conQueue.push(c);
          saveToLocalStorage(true, true);
          renderAll();
        }, true, 'con');
      });
    }

    // Single Speaker (Intro)
    document.getElementById('btn-single-start').addEventListener('click', startSingleTimer);
    document.getElementById('btn-single-pause').addEventListener('click', pauseSingleTimer);
    document.getElementById('btn-single-reset').addEventListener('click', resetSingleTimer);
    const btnIntroToProcon = document.getElementById('btn-intro-to-procon');
    if (btnIntroToProcon) {
      btnIntroToProcon.addEventListener('click', () => {
        state.speakingSubtab = 'procon';
        saveToLocalStorage(true, true);
        renderAll();
      });
    }
    document.getElementById('btn-single-select-country').addEventListener('click', () => {
      openAddSpeakerModal((c) => {
        state.singleSpeaker = c;
        renderAll();
      });
    });
    document.getElementById('btn-single-set-time').addEventListener('click', () => {
      const t = I18N[state.language] || I18N.en;
      customPrompt(t.singleSpeaker, t.enterSingleTimePrompt, '3', (val) => {
        if (val) {
          state.singleTimeRemaining = (parseFloat(val) || 3) * 60;
          renderAll();
        }
      });
    });

    // Motions
    const btnClearMotions = document.getElementById('btn-clear-motions');
    if (btnClearMotions) {
      btnClearMotions.addEventListener('click', () => {
        state.motions = [];
        saveToLocalStorage();
        renderAll();
      });
    }

    const addMotionModal = document.getElementById('modal-add-motion');
    const selectMotionType = document.getElementById('select-motion-type');
    const fieldTopic = document.getElementById('motion-field-topic');
    const fieldTimeContainer = document.getElementById('motion-time-fields');
    const fieldTotalMins = document.getElementById('motion-field-total-mins');
    const labelTotalMins = document.getElementById('label-motion-total-mins');
    const fieldSpeakerSecs = document.getElementById('motion-field-speaker-secs');

    function updateMotionModalFields() {
      const type = selectMotionType ? selectMotionType.value : 'mod';
      const t = I18N[state.language] || I18N.en;

      if (type === 'mod') {
        if (fieldTopic) fieldTopic.classList.remove('hidden');
        if (fieldTimeContainer) {
          fieldTimeContainer.classList.remove('hidden');
          fieldTimeContainer.className = 'grid grid-cols-2 gap-3';
        }
        if (fieldTotalMins) fieldTotalMins.classList.remove('hidden');
        if (labelTotalMins) labelTotalMins.textContent = t.durationMins || 'Duration (mins)';
        if (fieldSpeakerSecs) fieldSpeakerSecs.classList.remove('hidden');
      } else if (type === 'unmod') {
        if (fieldTopic) fieldTopic.classList.remove('hidden');
        if (fieldTimeContainer) {
          fieldTimeContainer.classList.remove('hidden');
          fieldTimeContainer.className = 'grid grid-cols-1 gap-3';
        }
        if (fieldTotalMins) fieldTotalMins.classList.remove('hidden');
        if (labelTotalMins) labelTotalMins.textContent = t.durationMins || 'Duration (mins)';
        if (fieldSpeakerSecs) fieldSpeakerSecs.classList.add('hidden');
      } else if (type === 'singlespeaker') {
        if (fieldTopic) fieldTopic.classList.add('hidden');
        if (fieldTimeContainer) {
          fieldTimeContainer.classList.remove('hidden');
          fieldTimeContainer.className = 'grid grid-cols-1 gap-3';
        }
        if (fieldTotalMins) fieldTotalMins.classList.remove('hidden');
        if (labelTotalMins) labelTotalMins.textContent = state.language === 'zh' ? '發言時間 (分鐘)' : 'Speaking Time (mins)';
        if (fieldSpeakerSecs) fieldSpeakerSecs.classList.add('hidden');
      } else if (type === 'suspend') {
        if (fieldTopic) fieldTopic.classList.add('hidden');
        if (fieldTimeContainer) {
          fieldTimeContainer.classList.remove('hidden');
          fieldTimeContainer.className = 'grid grid-cols-1 gap-3';
        }
        if (fieldTotalMins) fieldTotalMins.classList.remove('hidden');
        if (labelTotalMins) labelTotalMins.textContent = state.language === 'zh' ? '暫停時間 (分鐘)' : 'Suspension Duration (mins)';
        if (fieldSpeakerSecs) fieldSpeakerSecs.classList.add('hidden');
      } else if (type === 'adjourn_day' || type === 'adjourn') {
        if (fieldTopic) fieldTopic.classList.add('hidden');
        if (fieldTimeContainer) fieldTimeContainer.classList.add('hidden');
      } else if (type === 'adjourn_session') {
        if (fieldTopic) fieldTopic.classList.add('hidden');
        if (fieldTimeContainer) fieldTimeContainer.classList.add('hidden');
      } else if (type === 'close') {
        if (fieldTopic) fieldTopic.classList.add('hidden');
        if (fieldTimeContainer) fieldTimeContainer.classList.add('hidden');
      }
    }

    if (selectMotionType) {
      selectMotionType.addEventListener('change', updateMotionModalFields);
    }

    document.getElementById('btn-add-motion').addEventListener('click', () => {
      const select = document.getElementById('select-motion-proposer');
      select.innerHTML = '';
      state.selectedCountries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = getCountryDisplayName(c);
        const enPart = (c.name_en && state.language !== 'en') ? ` (${c.name_en})` : '';
        opt.textContent = `${getCountryDisplayName(c)}${enPart}`;
        select.appendChild(opt);
      });
      updateMotionModalFields();
      addMotionModal.classList.remove('hidden');
    });

    document.getElementById('btn-submit-motion').addEventListener('click', () => {
      const proposer = document.getElementById('select-motion-proposer').value;
      const type = document.getElementById('select-motion-type').value;
      const topic = document.getElementById('input-motion-topic').value;
      const defaultMins = (type === 'adjourn_day' || type === 'adjourn' || type === 'adjourn_session' ? 0 : (type === 'suspend' ? 15 : (type === 'singlespeaker' ? 3 : 10)));
      const totalMins = (type === 'adjourn_day' || type === 'adjourn' || type === 'adjourn_session' || type === 'close') ? 0 : (parseInt(document.getElementById('input-motion-total-mins').value) || defaultMins);
      const speakerSecs = parseInt(document.getElementById('input-motion-speaker-secs').value) || 60;

      const motion = {
        id: 'M_' + Date.now(),
        proposer,
        type,
        topic,
        totalMins,
        speakerSecs,
        precedence: PRECEDENCE[type] || 50
      };

      state.motions.push(motion);
      addMotionModal.classList.add('hidden');
      document.getElementById('input-motion-topic').value = '';

      // 提動議後自動跳轉至表決頁面（預設進入 Session 表決）
      state.motions.sort((a, b) => {
        if (b.precedence !== a.precedence) return b.precedence - a.precedence;
        return (b.totalMins || 0) - (a.totalMins || 0);
      });
      const topIdx = state.motions.findIndex(m => m.id === motion.id);
      sendMotionToVotingTab(motion, topIdx >= 0 ? topIdx : 0);
    });

    const btnHeroSecond = document.getElementById('btn-hero-motion-second');
    if (btnHeroSecond) {
      btnHeroSecond.addEventListener('click', () => {
        if (state.motions.length > 0) executeMotion(state.motions[0], 0);
      });
    }

    const btnHeroPassLegacy = document.getElementById('btn-hero-motion-pass');
    if (btnHeroPassLegacy) {
      btnHeroPassLegacy.addEventListener('click', () => {
        if (state.motions.length > 0) executeMotion(state.motions[0], 0);
      });
    }

    const btnHeroVote = document.getElementById('btn-hero-motion-vote');
    if (btnHeroVote) {
      btnHeroVote.addEventListener('click', () => {
        if (state.motions.length > 0) {
          sendMotionToVotingTab(state.motions[0], 0);
        }
      });
    }

    const btnHeroFail = document.getElementById('btn-hero-motion-fail');
    if (btnHeroFail) {
      btnHeroFail.addEventListener('click', () => {
        if (state.motions.length > 0) removeMotion(0);
      });
    }

    // Recess modal buttons
    const btnRecessToggle = document.getElementById('btn-recess-toggle-timer');
    if (btnRecessToggle) {
      btnRecessToggle.addEventListener('click', toggleRecessTimer);
    }
    const btnRecessReconvene = document.getElementById('btn-recess-reconvene');
    if (btnRecessReconvene) {
      btnRecessReconvene.addEventListener('click', closeRecessScreen);
    }

    // Roll Call Bulk Actions
    const btnSetAllUncalled = document.getElementById('btn-set-all-uncalled');
    if (btnSetAllUncalled) {
      btnSetAllUncalled.addEventListener('click', () => {
        state.selectedCountries.forEach(c => c.attendance = 'uncalled');
        saveToLocalStorage(true, true);
        renderAll();
      });
    }
    const btnSetAllPresent = document.getElementById('btn-set-all-present');
    if (btnSetAllPresent) {
      btnSetAllPresent.addEventListener('click', () => {
        state.selectedCountries.forEach(c => c.attendance = 'present');
        saveToLocalStorage(true, true);
        renderAll();
      });
    }
    const btnSetAllAbsent = document.getElementById('btn-set-all-absent');
    if (btnSetAllAbsent) {
      btnSetAllAbsent.addEventListener('click', () => {
        state.selectedCountries.forEach(c => c.attendance = 'absent');
        saveToLocalStorage(true, true);
        renderAll();
      });
    }
    const btnResetVotes = document.getElementById('btn-reset-votes');
    if (btnResetVotes) {
      btnResetVotes.addEventListener('click', () => {
        // 1. Reset Rollcall & Substantive Ballots for all delegates
        state.selectedCountries.forEach(c => {
          c.vote = 'none';
          c.hasRights = false;
        });
        state.voteStage = 'r1';
        state.activeVoterIndex = 0;

        // 2. If currently in Session voting subtab, also reset the active session votes
        if (state.votingSubtab === 'session' && Array.isArray(state.sessionVotes)) {
          const curSess = state.sessionVotes.find(s => s.id === state.activeSessionId) || state.sessionVotes[0];
          if (curSess) {
            curSess.favor = 0;
            curSess.against = 0;
            curSess.abstain = 0;
          }
        }

        saveToLocalStorage(true, true);
        renderAll();
      });
    }
    document.getElementById('select-vote-threshold').addEventListener('change', (e) => {
      state.voteThreshold = e.target.value;
      saveToLocalStorage(true, true);
      renderAll();
    });

    const titleInputRes = document.getElementById('vote-resolution-title-input');
    if (titleInputRes) {
      titleInputRes.addEventListener('input', (e) => {
        state.voteResolutionTitle = e.target.value;
        saveToLocalStorage(true, true);
      });
    }

    const btnStageR1 = document.getElementById('vote-stage-r1');
    if (btnStageR1) {
      btnStageR1.addEventListener('click', () => {
        state.voteStage = 'r1';
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }
    const btnStageR2 = document.getElementById('vote-stage-r2');
    if (btnStageR2) {
      btnStageR2.addEventListener('click', () => {
        state.voteStage = 'r2';
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }
    const btnStageRights = document.getElementById('vote-stage-rights');
    if (btnStageRights) {
      btnStageRights.addEventListener('click', () => {
        state.voteStage = 'rights';
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    // Adopt / Pass Vote
    const btnAdoptVote = document.getElementById('btn-adopt-vote');
    if (btnAdoptVote) {
      btnAdoptVote.addEventListener('click', () => {
        if (typeof window.adoptCurrentVote === 'function') {
          window.adoptCurrentVote();
        }
      });
    }

    const btnQuickPass = document.getElementById('btn-quick-pass');
    if (btnQuickPass) {
      btnQuickPass.addEventListener('click', () => {
        if (typeof window.adoptCurrentVote === 'function') {
          window.adoptCurrentVote();
        }
      });
    }

    // Consensus vote with Custom Modal (if element exists)
    const btnConsensusVote = document.getElementById('btn-consensus-vote');
    if (btnConsensusVote) {
      btnConsensusVote.addEventListener('click', () => {
        const t = I18N[state.language] || I18N.en;
        showModal({
          title: t.consensusVote,
          message: t.consensusConfirm,
          confirmText: t.consensusPassConfirm,
          cancelText: t.consensusObjectionCancel,
          onConfirm: () => {
            // Adopt by consensus
            state.selectedCountries.forEach(c => {
              if (c.powerStatus !== 'observer' && c.attendance !== 'absent') {
                c.vote = 'favor';
                c.hasRights = false;
              }
            });
            saveToLocalStorage(true, true);
            renderAll();
            customAlert(t.consensusVote, t.consensusAdoptedAlert);
          }
        });
      });
    }

    // Vote Target Switcher (Resolution vs Motion)
    const btnTargetRes = document.getElementById('btn-vote-target-resolution');
    if (btnTargetRes) {
      btnTargetRes.addEventListener('click', () => {
        state.activeVoteTarget = 'resolution';
        state.votingMotion = null;
        state.voteType = 'substantive';
        state.voteThreshold = state.settings?.rules?.defaultVoteThreshold || 'simple';
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    const btnTargetMot = document.getElementById('btn-vote-target-motion');
    if (btnTargetMot) {
      btnTargetMot.addEventListener('click', () => {
        state.activeVoteTarget = 'motion';
        state.voteType = 'procedural';
        state.votingSubtab = 'session';
        if (state.motions && state.motions.length > 0 && !state.votingMotion) {
          state.votingMotion = { ...state.motions[0], originalIndex: 0 };
        }
        if (state.votingMotion) {
          const rule = (typeof MOTION_RULES !== 'undefined' && MOTION_RULES[state.votingMotion.type]) ? MOTION_RULES[state.votingMotion.type] : { threshold: 'simple' };
          state.voteThreshold = rule.threshold || 'simple';
        }
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    // Execute Motion from Vote Tab when passed
    const btnMotionExecute = document.getElementById('btn-motion-vote-execute');
    if (btnMotionExecute) {
      btnMotionExecute.addEventListener('click', () => {
        const curMot = state.votingMotion || (state.motions && state.motions[0]);
        if (!curMot) return;
        const targetIdx = (typeof curMot.originalIndex === 'number') ? curMot.originalIndex : 0;
        executeMotion(curMot, targetIdx);
      });
    }

    // Voting Mode & Configure Modal Handlers
    const modalConfigureVote = document.getElementById('modal-configure-voting');
    const btnConfigureVote = document.getElementById('btn-configure-vote');
    if (btnConfigureVote && modalConfigureVote) {
      btnConfigureVote.addEventListener('click', () => {
        // Init radio values
        const typeRadios = modalConfigureVote.querySelectorAll('input[name="modal-vote-type"]');
        typeRadios.forEach(r => {
          r.checked = (r.value === (state.voteType || 'substantive'));
        });
        const threshRadios = modalConfigureVote.querySelectorAll('input[name="modal-vote-threshold"]');
        threshRadios.forEach(r => {
          r.checked = (r.value === (state.voteThreshold || 'simple'));
        });
        modalConfigureVote.classList.remove('hidden');
      });
    }

    const btnSaveVoteConfig = document.getElementById('btn-save-vote-config');
    if (btnSaveVoteConfig && modalConfigureVote) {
      btnSaveVoteConfig.addEventListener('click', () => {
        const checkedType = modalConfigureVote.querySelector('input[name="modal-vote-type"]:checked');
        if (checkedType) state.voteType = checkedType.value;
        const checkedThresh = modalConfigureVote.querySelector('input[name="modal-vote-threshold"]:checked');
        if (checkedThresh) state.voteThreshold = checkedThresh.value;
        modalConfigureVote.classList.add('hidden');
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    // Voting Subtabs Switching (Rollcall Calling Card vs Session)
    const btnSubtabRollcall = document.getElementById('btn-voting-subtab-rollcall');
    if (btnSubtabRollcall) {
      btnSubtabRollcall.addEventListener('click', () => {
        state.votingSubtab = 'rollcall';
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }
    const btnSubtabSession = document.getElementById('btn-voting-subtab-session');
    if (btnSubtabSession) {
      btnSubtabSession.addEventListener('click', () => {
        // Guard: check if current motion vote prohibits quick session
        if (state.activeVoteTarget === 'motion') {
          const curMot = state.votingMotion || (state.motions && state.motions[0]);
          if (curMot && typeof canMotionUseQuickSession === 'function' && !canMotionUseQuickSession(curMot.type)) {
            const t = I18N[state.language] || I18N.en;
            showToast(state.language === 'zh' ? '此動議依議事規則強制正式唱名表決，禁止快速表決帶過！' : 'This motion requires formal roll call vote!', 'warning');
            return;
          }
        }
        state.votingSubtab = 'session';
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    const btnSwitchRollcallInline = document.getElementById('btn-switch-to-rollcall-inline');
    if (btnSwitchRollcallInline) {
      btnSwitchRollcallInline.addEventListener('click', () => {
        state.votingSubtab = 'rollcall';
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    // Session Subtab Controls
    const btnSessionInc = document.getElementById('btn-session-inc');
    if (btnSessionInc) {
      btnSessionInc.addEventListener('click', () => {
        if (state.isViewerMode) return;
        state.sessionCount = (state.sessionCount || 3) + 1;
        if (!state.sessionVotes) state.sessionVotes = [];
        state.sessionVotes.push({
          id: state.sessionCount,
          name: `Session ${state.sessionCount}`,
          favor: 0,
          against: 0,
          abstain: 0,
          note: ''
        });
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    const btnSessionDec = document.getElementById('btn-session-dec');
    if (btnSessionDec) {
      btnSessionDec.addEventListener('click', () => {
        if (state.isViewerMode) return;
        if ((state.sessionCount || 1) <= 1) return;
        state.sessionCount--;
        if (state.sessionVotes && state.sessionVotes.length > state.sessionCount) {
          state.sessionVotes = state.sessionVotes.slice(0, state.sessionCount);
        }
        if (state.activeSessionId > state.sessionCount) {
          state.activeSessionId = state.sessionCount;
        }
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    const inputSessionCount = document.getElementById('input-session-count');
    if (inputSessionCount) {
      inputSessionCount.addEventListener('change', (e) => {
        if (state.isViewerMode) return;
        let val = parseInt(e.target.value) || 1;
        if (val < 1) val = 1;
        if (val > 50) val = 50;
        state.sessionCount = val;
        if (!state.sessionVotes) state.sessionVotes = [];
        while (state.sessionVotes.length < val) {
          const nextId = state.sessionVotes.length + 1;
          state.sessionVotes.push({
            id: nextId,
            name: `Session ${nextId}`,
            favor: 0,
            against: 0,
            abstain: 0,
            note: ''
          });
        }
        if (state.sessionVotes.length > val) {
          state.sessionVotes = state.sessionVotes.slice(0, val);
        }
        if (state.activeSessionId > val) {
          state.activeSessionId = val;
        }
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    const btnAddNewSession = document.getElementById('btn-add-new-session');
    if (btnAddNewSession) {
      btnAddNewSession.addEventListener('click', () => {
        if (state.isViewerMode) return;
        state.sessionCount = (state.sessionCount || 3) + 1;
        if (!state.sessionVotes) state.sessionVotes = [];
        state.sessionVotes.push({
          id: state.sessionCount,
          name: `Session ${state.sessionCount}`,
          favor: 0,
          against: 0,
          abstain: 0,
          note: ''
        });
        state.activeSessionId = state.sessionCount;
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    const btnResetCurrentSession = document.getElementById('btn-reset-current-session');
    if (btnResetCurrentSession) {
      btnResetCurrentSession.addEventListener('click', () => {
        if (state.isViewerMode) return;
        const curSession = (state.sessionVotes || []).find(s => s.id === state.activeSessionId);
        if (curSession) {
          curSession.favor = 0;
          curSession.against = 0;
          curSession.abstain = 0;
          saveToLocalStorage(true, true);
          renderResolutionVoteGrid();
        }
      });
    }

    // Timer for detecting single click vs double click on Active Voter Card buttons
    let activeVoterClickTimer = null;
    let lastActiveAction = null;

    // Helper function for active voter buttons with single-click (vote & next) vs double-click (+Rights)
    function handleActiveVoterClick(action) {
      if (state.isViewerMode) return;
      const eligible = state.selectedCountries.filter(c => {
        if (state.voteType === 'procedural') {
          return c.attendance === 'present' || c.attendance === 'pv';
        }
        return c.powerStatus !== 'observer' && (c.attendance === 'present' || c.attendance === 'pv');
      });
      const pool = state.voteStage === 'r2' ? eligible.filter(c => c.vote === 'pass') : eligible;
      const idx = state.activeVoterIndex || 0;
      const voter = pool[idx];
      if (!voter) return;

      // If clicked again within 300ms for favor/against, treat as double click (+Rights)
      if (activeVoterClickTimer && lastActiveAction === action && (action === 'favor' || action === 'against')) {
        clearTimeout(activeVoterClickTimer);
        activeVoterClickTimer = null;
        lastActiveAction = null;

        // Double Click Triggered:
        // Set to Favor / Against with Rights, then advance to next country
        voter.vote = action;
        voter.hasRights = true;
        state.activeVoterIndex = idx + 1;
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
        return;
      }

      // If there was a pending timer for a different action, flush it first
      if (activeVoterClickTimer) {
        clearTimeout(activeVoterClickTimer);
        activeVoterClickTimer = null;
      }

      lastActiveAction = action;

      if (action === 'favor' || action === 'against') {
        // Wait 280ms to see if user double-clicks for (+Rights)
        activeVoterClickTimer = setTimeout(() => {
          activeVoterClickTimer = null;
          lastActiveAction = null;

          // Single Click: vote normally and advance to next country
          voter.vote = action;
          voter.hasRights = false;
          state.activeVoterIndex = idx + 1;
          saveToLocalStorage(true, true);
          renderResolutionVoteGrid();
        }, 280);
      } else {
        // Abstain / Pass - immediate single click action and advance
        lastActiveAction = null;
        voter.vote = action;
        voter.hasRights = false;
        state.activeVoterIndex = idx + 1;
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      }
    }

    const btnCastFavor = document.getElementById('btn-cast-favor');
    if (btnCastFavor) {
      btnCastFavor.addEventListener('click', () => handleActiveVoterClick('favor'));
    }
    const btnCastAgainst = document.getElementById('btn-cast-against');
    if (btnCastAgainst) {
      btnCastAgainst.addEventListener('click', () => handleActiveVoterClick('against'));
    }
    const btnCastAbstain = document.getElementById('btn-cast-abstain');
    if (btnCastAbstain) {
      btnCastAbstain.addEventListener('click', () => handleActiveVoterClick('abstain'));
    }
    const btnCastPass = document.getElementById('btn-cast-pass');
    if (btnCastPass) {
      btnCastPass.addEventListener('click', () => handleActiveVoterClick('pass'));
    }
    const btnPrevVoter = document.getElementById('btn-prev-voter');
    if (btnPrevVoter) {
      btnPrevVoter.addEventListener('click', () => {
        if (typeof state.activeVoterIndex === 'number' && state.activeVoterIndex > 0) {
          state.activeVoterIndex--;
          renderResolutionVoteGrid();
        }
      });
    }
    const btnNextVoter = document.getElementById('btn-next-voter');
    if (btnNextVoter) {
      btnNextVoter.addEventListener('click', () => {
        const eligible = state.selectedCountries.filter(c => {
          if (state.voteType === 'procedural') {
            return c.attendance === 'present' || c.attendance === 'pv';
          }
          return c.powerStatus !== 'observer' && (c.attendance === 'present' || c.attendance === 'pv');
        });
        const pool = state.voteStage === 'r2' ? eligible.filter(c => c.vote === 'pass') : eligible;
        if (typeof state.activeVoterIndex === 'number' && state.activeVoterIndex < pool.length) {
          state.activeVoterIndex++;
          renderResolutionVoteGrid();
        }
      });
    }

    const btnToggleResults = document.getElementById('btn-toggle-results');
    if (btnToggleResults) {
      btnToggleResults.addEventListener('click', () => {
        state.showResults = !state.showResults;
        saveToLocalStorage(true, true);
        renderResolutionVoteGrid();
      });
    }

    // Global Page-Wide Content Scale Slider
    function setupGlobalScaleSlider() {
      const slider = document.getElementById('slider-global-scale');
      const label = document.getElementById('label-global-scale');
      const mainEl = document.querySelector('main');
      if (!slider || !label || !mainEl) return;

      function applyGlobalScale(val) {
        const num = parseFloat(val) || 1;
        const percent = Math.round(num * 100);
        label.textContent = `${percent}%`;

        // 將縮放變數作用在 main，卡片內部所有元件（國旗、字體、Padding、按鈕等）同步縮放
        mainEl.style.setProperty('--content-scale', num);

        // 自適應點名卡片欄數 (縮放極大時自動調整為單欄，極小時可多欄)
        const rcGrid = document.getElementById('grid-rollcall-delegates');
        if (rcGrid) {
          rcGrid.className = rcGrid.className.replace(/grid-cols-\d+|md:grid-cols-\d+|xl:grid-cols-\d+/g, '').trim();
          if (num >= 1.25) {
            rcGrid.className += ' grid-cols-1';
          } else if (num <= 0.8) {
            rcGrid.className += ' grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
          } else {
            rcGrid.className += ' grid-cols-1 md:grid-cols-2';
          }
        }

        // 自適應投票卡片欄數
        const voteGrid = document.getElementById('grid-substantive-ballots');
        if (voteGrid) {
          voteGrid.className = voteGrid.className.replace(/grid-cols-\d+|md:grid-cols-\d+|xl:grid-cols-\d+/g, '').trim();
          if (num >= 1.25) {
            voteGrid.className += ' grid-cols-1';
          } else if (num <= 0.8) {
            voteGrid.className += ' grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
          } else {
            voteGrid.className += ' grid-cols-1 md:grid-cols-2';
          }
        }

        try {
          localStorage.setItem('MUN_GLOBAL_CONTENT_SCALE', val);
        } catch (e) {}
      }

      const savedVal = localStorage.getItem('MUN_GLOBAL_CONTENT_SCALE') || '1';
      slider.value = savedVal;
      applyGlobalScale(savedVal);

      slider.addEventListener('input', (e) => {
        applyGlobalScale(e.target.value);
      });
    }

    setupGlobalScaleSlider();

    // Export & Import
    document.getElementById('drawer-btn-export').addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        committeeName: state.committeeName,
        agenda: state.agenda,
        selectedCountries: state.selectedCountries
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${state.committeeName.replace(/\s+/g, '_')}_setup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      closeDrawer();
    });

    const fileInput = document.getElementById('input-import-file');
    document.getElementById('drawer-btn-import').addEventListener('click', () => {
      fileInput.click();
    });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        const t = I18N[state.language] || I18N.en;
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed.committeeName) state.committeeName = parsed.committeeName;
          if (parsed.agenda) state.agenda = parsed.agenda;
          if (Array.isArray(parsed.selectedCountries)) state.selectedCountries = parsed.selectedCountries;
          updateAvailableCountriesPool();
          saveToLocalStorage();
          renderAll();
          closeDrawer();
          customAlert(t.importCommittee, t.importSuccessAlert);
        } catch (err) {
          customAlert(t.importCommittee, t.importInvalidAlert);
        }
      };
      reader.readAsText(file);
    });

    // Modal Close Buttons (General & Settings)
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#modal-add-speaker, #modal-define-time, #modal-mod-config, #modal-add-motion').forEach(m => {
          m.classList.add('hidden');
          m.style.display = 'none';
        });
      });
    });

    const doneSpeakerBtn = document.getElementById('btn-done-add-speaker');
    if (doneSpeakerBtn) {
      doneSpeakerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const modal = document.getElementById('modal-add-speaker');
        if (modal) {
          modal.classList.add('hidden');
          modal.style.display = 'none';
        }
      });
    }

    const settingsDoneBtn = document.getElementById('btn-save-settings-done');
    if (settingsDoneBtn) {
      settingsDoneBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sModal = document.getElementById('modal-unified-settings');
        if (sModal) {
          sModal.classList.add('hidden');
          sModal.style.display = 'none';
        }
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) {
          saveToLocalStorage(true);
        }
        if (typeof renderAll === 'function') renderAll();
      });
    }

    const settingsCloseBtn = document.getElementById('btn-close-settings-modal');
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sModal = document.getElementById('modal-unified-settings');
        if (sModal) {
          sModal.classList.add('hidden');
          sModal.style.display = 'none';
        }
        if (typeof saveToLocalStorage === 'function' && !state.isViewerMode) {
          saveToLocalStorage(true);
        }
        if (typeof renderAll === 'function') renderAll();
      });
    }

    ['modal-add-speaker', 'modal-define-time', 'modal-mod-config', 'modal-add-motion'].forEach(id => {
      const modalEl = document.getElementById(id);
      if (modalEl) {
        modalEl.addEventListener('click', (e) => {
          if (e.target === modalEl) modalEl.classList.add('hidden');
        });
      }
    });

    // Language selection dialog with custom UI (English, 繁體中文, Français)
    const langBtn = document.getElementById('drawer-btn-language');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        closeDrawer();
        openLanguageModal();
      });
    }

    const headerLangBtn = document.getElementById('btn-header-lang');
    if (headerLangBtn) {
      headerLangBtn.addEventListener('click', () => {
        openLanguageModal();
      });
    }

    // Header Theme Toggle Button
    const headerThemeBtn = document.getElementById('btn-header-theme');
    if (headerThemeBtn) {
      headerThemeBtn.addEventListener('click', () => {
        const drawerThemeBtn = document.getElementById('btn-toggle-theme');
        if (drawerThemeBtn) {
          drawerThemeBtn.click();
        } else {
          const isLight = document.body.classList.toggle('light-mode');
          localStorage.setItem('mun-theme', isLight ? 'light' : 'dark');
        }
      });
    }

    // Unified Settings Center Modal Openers
    const openSettingsBtn = document.getElementById('btn-open-settings');
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => {
        if (typeof openUnifiedSettingsModal === 'function') openUnifiedSettingsModal('conference');
      });
    }

    const drawerSettingsBtn = document.getElementById('drawer-btn-settings');
    if (drawerSettingsBtn) {
      drawerSettingsBtn.addEventListener('click', () => {
        closeDrawer();
        if (typeof openUnifiedSettingsModal === 'function') openUnifiedSettingsModal('conference');
      });
    }

    // Custom Color Scheme Picker Dialog
    const customColorBtn = document.getElementById('btn-custom-color');
    if (customColorBtn) {
      customColorBtn.addEventListener('click', () => {
        closeDrawer();
        openCustomColorModal();
      });
    }

  }

  // Celebratory Confetti / Ribbon Burst Animation (Simpler & Elegant for Session Adjournment)