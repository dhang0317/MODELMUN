
  // --- MOTION RULES & PRECEDENCE DEFINITION ---
  const PRECEDENCE = {
    adjourn_session: 100,
    adjourn_day: 98,
    adjourn: 98,
    suspend: 95,
    previous_question: 90,
    close: 90,
    unmod: 80,
    mod: 60,
    singlespeaker: 40,
    amendment: 38,
    gsl: 30
  };

  const MOTION_RULES = {
    // 常設發言名單
    gsl: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    },
    // 介紹修正案
    amendment: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    },
    // 結束辯論 / 提請表決：2/3 絕對多數程序表決，支援附議通過或表決
    previous_question: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'twothirds',
      voteType: 'procedural',
      canSecond: true
    },
    close: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'twothirds',
      voteType: 'procedural',
      canSecond: true
    },
    // 休會 / 散會動議：重大程序動議，支援附議通過或表決
    adjourn: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    },
    adjourn_day: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    },
    adjourn_session: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    },
    // 暫停會議動議：一般休會/磋商前暫停，可快速表決或附議通過
    suspend: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    },
    // 非主持核心磋商：一般程序動議，允許快速表決/附議通過
    unmod: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    },
    // 主持核心磋商：一般程序動議，允許快速表決/附議通過
    mod: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    },
    // 介紹決議案草案及修正案 / 單一發言者
    singlespeaker: {
      requiresVote: false,
      allowQuickSession: true,
      threshold: 'simple',
      voteType: 'procedural',
      canSecond: true
    }
  };

  // Helper to determine if a motion allows quick session vote
  function canMotionUseQuickSession(motionType) {
    if (!motionType) return true;
    const rule = MOTION_RULES[motionType];
    if (!rule) return true;
    return rule.allowQuickSession !== false;
  }

  // --- DEFAULT SETTINGS SCHEMA ---
  const defaultSettings = {
    conference: {
      committeeName: '聯合國安全理事會 (UNSC)',
      agenda: '對國際和平與安全之威脅',
      logoUrl: null
    },
    rules: {
      gslDefaultTime: 90,
      modDefaultTotalMins: 10,
      modDefaultSpeakerSecs: 60,
      unmodDefaultTotalSecs: 900,
      singleDefaultTime: 180,
      defaultVoteThreshold: 'simple',
      enableVeto: true
    },
    display: {
      themeMode: 'dark',
      customAccent: '#3683a8',
      globalScale: 1.0,
      showLiveResults: true
    }
  };

  // --- APP STATE ---
  const state = {
    settings: JSON.parse(JSON.stringify(defaultSettings)),
    committeeName: '聯合國安全理事會 (UNSC)',
    agenda: '對國際和平與安全之威脅',
    currentTab: 'setup',
    language: 'zh', // 'en', 'zh', 'fr'
    setupSegment: 'template',
    currentUser: null, // Google user profile: { name, email, picture }
    
    availableCountries: [],
    selectedCountries: [], 
    
    // GSL
    gslDefaultTime: 90,
    gslRemainingTime: 90,
    gslTimerInterval: null,
    gslRunning: false,
    gslQueue: [],
    currentGslSpeaker: null,

    // Mod
    modTopic: 'Discussion on Maritime Security',
    modTotalMins: 10,
    modTotalSecsRemaining: 600,
    modSpeakerSecs: 60,
    modSpeakerSecsRemaining: 60,
    modRunning: false,
    modTimerInterval: null,
    modQueue: [],
    currentModSpeaker: null,

    // Unmod
    unmodTotalSecs: 900,
    unmodSecsRemaining: 900,
    unmodRunning: false,
    unmodTimerInterval: null,

    // Single Speaker
    singleSpeaker: null,
    singleTimeRemaining: 180,
    singleRunning: false,
    singleTimerInterval: null,

    // Pro / Con Debate (正反方發言)
    speakingSubtab: 'gsl', // 'gsl' | 'mod' | 'intro' | 'procon'
    proConTopic: '',
    proConSpeakerSecs: 60,
    proConSecsRemaining: 60,
    proConRunning: false,
    proConTimerInterval: null,
    currentProConSide: 'pro', // 'pro' or 'con'
    currentProConSpeaker: null,
    proQueue: [],
    conQueue: [],

    // Recess / Suspension
    recessSecsRemaining: 900,
    recessRunning: false,
    recessTimerInterval: null,
    recessModalOpen: false,
    recessTitle: '',
    recessMode: 'suspend',

    // Motions
    motions: [],

    // Voting
    voteMode: 'rollcall',
    votingSubtab: 'rollcall', // 'rollcall' (calling card) or 'session' (非投票點名/會期表決)
    voteStage: 'r1',
    voteResolutionTitle: 'Draft Resolution 1.1',
    voteThreshold: 'simple',
    voteType: 'substantive', // 'substantive' or 'procedural'
    activeVoteTarget: 'resolution', // 'resolution' or 'motion'
    votingMotion: null, // Holds motion object currently being voted on { id, proposer, type, topic, totalMins, speakerSecs, threshold }
    showResults: true,
    rightsSpeeches: [],

    // Non-voting Session Records
    sessionCount: 3,
    activeSessionId: 1,
    sessionVotes: [
      { id: 1, name: 'Session 1', favor: 0, against: 0, abstain: 0, note: '' },
      { id: 2, name: 'Session 2', favor: 0, against: 0, abstain: 0, note: '' },
      { id: 3, name: 'Session 3', favor: 0, against: 0, abstain: 0, note: '' }
    ],

    // Theme & Background sync
    themeMode: 'dark', // 'dark' or 'light'
    customAccent: null, // hex color or null

    // Room & Viewer (Delegate) Mode
    roomId: null,
    isViewerMode: false,
    viewerPollingInterval: null
  };

  // Check URL parameters for Room & Viewer Mode
  (function detectViewerMode() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const room = params.get('room');
    if (room) {
      state.roomId = room;
    }
    if (view === '1' || view === 'true') {
      state.isViewerMode = true;
    }
    // Generate or restore room ID for chair if not in viewer mode
    if (!state.isViewerMode && !state.roomId) {
      let savedRoom = localStorage.getItem('MUN_ROOM_ID');
      if (!savedRoom) {
        savedRoom = 'room-' + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('MUN_ROOM_ID', savedRoom);
      }
      state.roomId = savedRoom;
    }
  })();

  function getFullStatePayload() {
    return {
      committeeName: state.committeeName,
      agenda: state.agenda,
      currentTab: state.currentTab,
      selectedCountries: state.selectedCountries,
      gslDefaultTime: state.gslDefaultTime,
      gslRemainingTime: state.gslRemainingTime,
      gslRunning: state.gslRunning,
      gslQueue: state.gslQueue,
      currentGslSpeaker: state.currentGslSpeaker,
      modTopic: state.modTopic,
      modTotalMins: state.modTotalMins,
      modTotalSecsRemaining: state.modTotalSecsRemaining,
      modSpeakerSecs: state.modSpeakerSecs,
      modSpeakerSecsRemaining: state.modSpeakerSecsRemaining,
      modRunning: state.modRunning,
      modQueue: state.modQueue,
      currentModSpeaker: state.currentModSpeaker,
      unmodTotalSecs: state.unmodTotalSecs || 900,
      unmodSecsRemaining: state.unmodSecsRemaining,
      unmodRunning: state.unmodRunning,
      singleSpeaker: state.singleSpeaker,
      singleTimeRemaining: state.singleTimeRemaining,
      singleRunning: state.singleRunning,
      speakingSubtab: state.speakingSubtab || 'gsl',
      proConTopic: state.proConTopic || '',
      proConSpeakerSecs: state.proConSpeakerSecs || 60,
      proConSecsRemaining: state.proConSecsRemaining || 60,
      proConRunning: state.proConRunning,
      currentProConSide: state.currentProConSide || 'pro',
      currentProConSpeaker: state.currentProConSpeaker,
      proQueue: state.proQueue || [],
      conQueue: state.conQueue || [],
      recessSecsRemaining: state.recessSecsRemaining,
      recessRunning: state.recessRunning,
      recessModalOpen: !!state.recessModalOpen,
      recessTitle: state.recessTitle || '',
      recessMode: state.recessMode || 'suspend',
      motions: state.motions,
      voteMode: state.voteMode,
      voteStage: state.voteStage,
      voteThreshold: state.voteThreshold,
      voteResolutionTitle: state.voteResolutionTitle,
      showResults: state.showResults,
      rightsSpeeches: state.rightsSpeeches,
      votingSubtab: state.votingSubtab,
      sessionCount: state.sessionCount,
      activeSessionId: state.activeSessionId,
      sessionVotes: state.sessionVotes,
      language: state.language,
      themeMode: document.body.classList.contains('light-mode') ? 'light' : 'dark',
      customAccent: localStorage.getItem('mun-custom-accent') || null,
      settings: state.settings,
      lastUpdated: Date.now()
    };
  }

  let cloudSaveTimeout = null;
  let isSavingToCloud = false;
  let pendingCloudPayload = null;

  function saveToLocalStorage(syncToCloud = true, immediate = false) {
    if (state.isViewerMode) return; // Spectators have no write permission

    const payload = getFullStatePayload();

    try {
      localStorage.setItem('MUN_COMMAND_STATE', JSON.stringify(payload));
    } catch (e) {}

    // Instant P2P / BroadcastChannel Push (0.00ms ~ 0.03s latency)
    if (window.P2PSync && typeof window.P2PSync.broadcast === 'function') {
      window.P2PSync.broadcast(payload);
    }

    // Cloud Auto-Sync to Cloudflare KV (Reliable Fallback)
    if (syncToCloud) {
      if (immediate) {
        if (cloudSaveTimeout) {
          clearTimeout(cloudSaveTimeout);
          cloudSaveTimeout = null;
        }
        triggerCloudSave(payload);
      } else {
        if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = setTimeout(() => {
          triggerCloudSave(payload);
        }, 300); // reduced from 1200ms to 300ms for fast responsiveness
      }
    }
  }

  function triggerCloudSave(payload) {
    if (isSavingToCloud) {
      pendingCloudPayload = payload;
      return;
    }
    isSavingToCloud = true;
    saveToCloudKV(payload, false).finally(() => {
      isSavingToCloud = false;
      if (pendingCloudPayload) {
        const next = pendingCloudPayload;
        pendingCloudPayload = null;
        triggerCloudSave(next);
      }
    });
  }

  async function saveToCloudKV(payload, notify = false) {
    if (state.isViewerMode) return;

    const userId = state.currentUser ? (state.currentUser.uid || state.currentUser.sub || state.currentUser.email) : null;
    const roomId = state.roomId;
    if (!userId && !roomId) return;

    const statusEl = document.getElementById('cloud-sync-status');
    if (statusEl) statusEl.textContent = '雲端同步中...';

    const payloadToSave = {
      ...payload,
      lastUpdated: Date.now()
    };

    try {
      if (window.firebaseDb) {
        // Strip out any undefined values for Firestore
        const cleanData = JSON.parse(JSON.stringify(payloadToSave));
        const promises = [];
        if (userId) {
          promises.push(window.firebaseDb.collection('users').doc(userId).set(cleanData, { merge: true }));
        }
        if (roomId) {
          promises.push(window.firebaseDb.collection('rooms').doc(roomId).set(cleanData, { merge: true }));
        }
        await Promise.all(promises);
        if (statusEl) statusEl.textContent = '雲端已同步最新進度';
        if (notify) showToast('會議資訊與進度已儲存至 Firebase 雲端！', 'success');
        return;
      }

      // Fallback to /api/sync if firebaseDb is not present
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roomId, payload: payloadToSave })
      });
      const data = await res.json();
      if (data && data.success) {
        if (statusEl) statusEl.textContent = '雲端已同步最新進度';
        if (notify) showToast('會議資訊與進度已同步至雲端！', 'success');
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      console.warn('Firebase / Cloud save error:', err);
      if (statusEl) statusEl.textContent = '雲端同步失敗';
      if (notify) showToast('無法同步至雲端：' + (err.message || '請確認網路連線'), 'error');
    }
  }

  function resetStateToDefaults() {
    state.committeeName = state.language === 'zh' ? '聯合國安全理事會 (UNSC)' : (state.language === 'fr' ? 'Conseil de sécurité des Nations unies' : 'United Nations Security Council');
    state.agenda = state.language === 'zh' ? '對國際和平與安全之威脅' : (state.language === 'fr' ? 'Menaces contre la paix et la sécurité internationales' : 'Threats to international peace and security');
    state.currentTab = 'setup';
    state.setupSegment = 'template';
    state.selectedCountries = [];
    
    state.gslDefaultTime = 90;
    state.gslRemainingTime = 90;
    if (state.gslTimerInterval) clearInterval(state.gslTimerInterval);
    state.gslTimerInterval = null;
    state.gslRunning = false;
    state.gslQueue = [];
    state.currentGslSpeaker = null;

    state.modTopic = 'Discussion on Maritime Security';
    state.modTotalMins = 10;
    state.modTotalSecsRemaining = 600;
    state.modSpeakerSecs = 60;
    state.modSpeakerSecsRemaining = 60;
    if (state.modTimerInterval) clearInterval(state.modTimerInterval);
    state.modTimerInterval = null;
    state.modRunning = false;
    state.modQueue = [];
    state.currentModSpeaker = null;

    state.unmodTotalSecs = 900;
    state.unmodSecsRemaining = 900;
    if (state.unmodTimerInterval) clearInterval(state.unmodTimerInterval);
    state.unmodTimerInterval = null;
    state.unmodRunning = false;

    state.singleSpeaker = null;
    state.singleTimeRemaining = 180;
    if (state.singleTimerInterval) clearInterval(state.singleTimerInterval);
    state.singleTimerInterval = null;
    state.singleRunning = false;

    state.recessSecsRemaining = 900;
    if (state.recessTimerInterval) clearInterval(state.recessTimerInterval);
    state.recessTimerInterval = null;
    state.recessRunning = false;
    state.recessModalOpen = false;
    state.recessTitle = '';
    state.recessMode = 'suspend';

    state.motions = [];
    state.voteMode = 'rollcall';
    state.voteStage = 'r1';
    state.voteResolutionTitle = 'Draft Resolution 1.1';
    state.voteThreshold = 'simple';
    state.showResults = true;
    state.rightsSpeeches = [];

    // 預設自動載入安理會 15 國代表
    if (typeof applyPreset === 'function') {
      applyPreset('unsc');
    } else {
      state.selectedCountries = [];
    }
  }

  async function loadFromCloudKV() {
    const userId = state.currentUser ? (state.currentUser.uid || state.currentUser.sub || state.currentUser.email) : null;
    const roomId = state.roomId;
    if (!userId && !roomId) return false;

    try {
      if (window.firebaseDb) {
        let docData = null;
        if (state.isViewerMode && roomId) {
          const docSnap = await window.firebaseDb.collection('rooms').doc(roomId).get();
          if (docSnap.exists) docData = docSnap.data();
        } else if (userId) {
          const docSnap = await window.firebaseDb.collection('users').doc(userId).get();
          if (docSnap.exists) docData = docSnap.data();
        } else if (roomId) {
          const docSnap = await window.firebaseDb.collection('rooms').doc(roomId).get();
          if (docSnap.exists) docData = docSnap.data();
        }

        if (docData && typeof docData === 'object' && Object.keys(docData).length > 0) {
          loadStateFromData(docData);
          updateAvailableCountriesPool();
          renderAll();
          const statusEl = document.getElementById('cloud-sync-status');
          if (statusEl) statusEl.textContent = '雲端已同步最新進度';
          return true;
        }
        return false;
      }

      // Fallback to /api/sync if firebaseDb is not present
      const query = (state.isViewerMode && roomId) 
        ? `roomId=${encodeURIComponent(roomId)}` 
        : (userId ? `userId=${encodeURIComponent(userId)}` : `roomId=${encodeURIComponent(roomId)}`);

      const res = await fetch(`/api/sync?${query}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          loadStateFromData(data);
          updateAvailableCountriesPool();
          renderAll();
          const statusEl = document.getElementById('cloud-sync-status');
          if (statusEl) statusEl.textContent = '雲端已同步最新進度';
          return true;
        }
      }
    } catch (err) {
      console.warn('Cloud load error:', err);
    }
    return false;
  }

  // Start polling / real-time listener in Viewer (Delegate) Mode
  function startViewerPolling() {
    if (!state.isViewerMode || !state.roomId) return;

    // Initial load immediately
    loadFromCloudKV();

    // Use Firestore real-time onSnapshot listener for instant updates
    if (window.firebaseDb) {
      if (window._viewerUnsubscribe) {
        try { window._viewerUnsubscribe(); } catch (e) {}
      }
      window._viewerUnsubscribe = window.firebaseDb.collection('rooms').doc(state.roomId).onSnapshot((docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data && typeof data === 'object' && (!state.lastUpdated || data.lastUpdated > state.lastUpdated)) {
            state.lastUpdated = data.lastUpdated;
            loadStateFromData(data);
            updateAvailableCountriesPool();
            renderAll();
          }
        }
      }, (e) => {
        console.warn('Firestore viewer real-time error:', e);
      });
      return;
    }

    // Polling fallback
    if (state.viewerPollingInterval) clearInterval(state.viewerPollingInterval);
    state.viewerPollingInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sync?roomId=${encodeURIComponent(state.roomId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && (!state.lastUpdated || data.lastUpdated > state.lastUpdated)) {
            state.lastUpdated = data.lastUpdated;
            loadStateFromData(data);
            updateAvailableCountriesPool();
            renderAll();
          }
        }
      } catch (e) {
        console.warn('Viewer polling error:', e);
      }
    }, 500);
  }

  function loadStateFromData(parsed) {
    if (!parsed) return;
    if (parsed.settings) {
      state.settings = {
        conference: { ...defaultSettings.conference, ...(parsed.settings.conference || {}) },
        rules: { ...defaultSettings.rules, ...(parsed.settings.rules || {}) },
        display: { ...defaultSettings.display, ...(parsed.settings.display || {}) }
      };
    } else {
      if (!state.settings) state.settings = JSON.parse(JSON.stringify(defaultSettings));
      if (parsed.committeeName) state.settings.conference.committeeName = parsed.committeeName;
      if (parsed.agenda) state.settings.conference.agenda = parsed.agenda;
      if (typeof parsed.gslDefaultTime !== 'undefined') state.settings.rules.gslDefaultTime = parsed.gslDefaultTime;
      if (typeof parsed.modTotalMins !== 'undefined') state.settings.rules.modDefaultTotalMins = parsed.modTotalMins;
      if (typeof parsed.modSpeakerSecs !== 'undefined') state.settings.rules.modDefaultSpeakerSecs = parsed.modSpeakerSecs;
      if (parsed.voteThreshold) state.settings.rules.defaultVoteThreshold = parsed.voteThreshold;
      if (parsed.themeMode) state.settings.display.themeMode = parsed.themeMode;
      if (parsed.customAccent) state.settings.display.customAccent = parsed.customAccent;
    }
    if (parsed.committeeName) state.committeeName = parsed.committeeName;
    if (parsed.agenda) state.agenda = parsed.agenda;
    if (parsed.currentTab && state.isViewerMode) {
      if (typeof switchTab === 'function') switchTab(parsed.currentTab);
    }
    if (Array.isArray(parsed.selectedCountries) && parsed.selectedCountries.length > 0) {
      const rawMap = {};
      (window.MUN_COUNTRIES || []).forEach(item => { rawMap[item.id] = item; });
      state.selectedCountries = parsed.selectedCountries.map(c => {
        const raw = rawMap[c.id];
        return {
          ...c,
          name_en: raw ? raw.name_en : c.name_en,
          name_zh: (c.id && ZH_TW_COUNTRIES[c.id]) ? ZH_TW_COUNTRIES[c.id] : (raw ? raw.name_zh : c.name_zh),
          name_fr: raw ? raw.name_fr : c.name_fr,
          countryUrl: raw ? raw.countryUrl : c.countryUrl
        };
      });
    }
    if (typeof parsed.gslDefaultTime !== 'undefined') state.gslDefaultTime = parsed.gslDefaultTime;
    if (typeof parsed.gslRemainingTime !== 'undefined') state.gslRemainingTime = parsed.gslRemainingTime;
    if (typeof parsed.gslRunning !== 'undefined') state.gslRunning = parsed.gslRunning;
    if (Array.isArray(parsed.gslQueue)) state.gslQueue = parsed.gslQueue;
    if (typeof parsed.currentGslSpeaker !== 'undefined') state.currentGslSpeaker = parsed.currentGslSpeaker;

    if (parsed.modTopic) state.modTopic = parsed.modTopic;
    if (typeof parsed.modTotalMins !== 'undefined') state.modTotalMins = parsed.modTotalMins;
    if (typeof parsed.modTotalSecsRemaining !== 'undefined') state.modTotalSecsRemaining = parsed.modTotalSecsRemaining;
    if (typeof parsed.modSpeakerSecs !== 'undefined') state.modSpeakerSecs = parsed.modSpeakerSecs;
    if (typeof parsed.modSpeakerSecsRemaining !== 'undefined') state.modSpeakerSecsRemaining = parsed.modSpeakerSecsRemaining;
    if (typeof parsed.modRunning !== 'undefined') state.modRunning = parsed.modRunning;
    if (Array.isArray(parsed.modQueue)) state.modQueue = parsed.modQueue;
    if (typeof parsed.currentModSpeaker !== 'undefined') state.currentModSpeaker = parsed.currentModSpeaker;

    if (typeof parsed.unmodTotalSecs !== 'undefined') state.unmodTotalSecs = parsed.unmodTotalSecs;
    if (typeof parsed.unmodSecsRemaining !== 'undefined') state.unmodSecsRemaining = parsed.unmodSecsRemaining;
    if (typeof parsed.unmodRunning !== 'undefined') state.unmodRunning = parsed.unmodRunning;

    if (typeof parsed.singleSpeaker !== 'undefined') state.singleSpeaker = parsed.singleSpeaker;
    if (typeof parsed.singleTimeRemaining !== 'undefined') state.singleTimeRemaining = parsed.singleTimeRemaining;
    if (typeof parsed.singleRunning !== 'undefined') state.singleRunning = parsed.singleRunning;
    if (parsed.speakingSubtab) state.speakingSubtab = parsed.speakingSubtab;
    if (typeof parsed.proConTopic !== 'undefined') state.proConTopic = parsed.proConTopic;
    if (typeof parsed.proConSpeakerSecs !== 'undefined') state.proConSpeakerSecs = parsed.proConSpeakerSecs;
    if (typeof parsed.proConSecsRemaining !== 'undefined') state.proConSecsRemaining = parsed.proConSecsRemaining;
    if (typeof parsed.proConRunning !== 'undefined') state.proConRunning = parsed.proConRunning;
    if (parsed.currentProConSide) state.currentProConSide = parsed.currentProConSide;
    if (typeof parsed.currentProConSpeaker !== 'undefined') state.currentProConSpeaker = parsed.currentProConSpeaker;
    if (Array.isArray(parsed.proQueue)) state.proQueue = parsed.proQueue;
    if (Array.isArray(parsed.conQueue)) state.conQueue = parsed.conQueue;

    if (typeof parsed.recessSecsRemaining !== 'undefined') state.recessSecsRemaining = parsed.recessSecsRemaining;
    if (typeof parsed.recessRunning !== 'undefined') state.recessRunning = parsed.recessRunning;
    if (typeof parsed.recessTitle !== 'undefined') state.recessTitle = parsed.recessTitle;
    if (typeof parsed.recessMode !== 'undefined') state.recessMode = parsed.recessMode;

    if (typeof parsed.recessModalOpen !== 'undefined') {
      const wasOpen = !!state.recessModalOpen;
      state.recessModalOpen = !!parsed.recessModalOpen;
      if (state.isViewerMode) {
        const modal = document.getElementById('modal-recess');
        if (state.recessModalOpen) {
          if (typeof openRecessScreen === 'function') {
            openRecessScreen(Math.ceil((state.recessSecsRemaining || 0) / 60), state.recessTitle, state.recessMode);
          } else if (modal) {
            modal.classList.remove('hidden');
          }
        } else if (modal) {
          modal.classList.add('hidden');
        }
      }
    }

    if (Array.isArray(parsed.motions)) state.motions = parsed.motions;
    if (parsed.voteMode) state.voteMode = parsed.voteMode;
    if (parsed.voteStage) state.voteStage = parsed.voteStage;
    if (parsed.voteThreshold) state.voteThreshold = parsed.voteThreshold;
    if (parsed.voteType) state.voteType = parsed.voteType;
    if (parsed.activeVoteTarget) state.activeVoteTarget = parsed.activeVoteTarget;
    if (typeof parsed.votingMotion !== 'undefined') state.votingMotion = parsed.votingMotion;
    if (parsed.voteResolutionTitle) state.voteResolutionTitle = parsed.voteResolutionTitle;
    if (typeof parsed.showResults !== 'undefined') state.showResults = parsed.showResults;
    if (Array.isArray(parsed.rightsSpeeches)) state.rightsSpeeches = parsed.rightsSpeeches;
    if (parsed.votingSubtab) state.votingSubtab = parsed.votingSubtab;
    if (typeof parsed.sessionCount === 'number') state.sessionCount = parsed.sessionCount;
    if (typeof parsed.activeSessionId === 'number') state.activeSessionId = parsed.activeSessionId;
    if (Array.isArray(parsed.sessionVotes)) state.sessionVotes = parsed.sessionVotes;
    if (parsed.language) state.language = parsed.language;

    // Synchronize dark/light theme and background color with Chair
    if (state.isViewerMode) {
      if (parsed.themeMode) {
        state.themeMode = parsed.themeMode;
        const isLight = parsed.themeMode === 'light';
        document.body.classList.toggle('light-mode', isLight);
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
          themeIcon.classList.toggle('fa-sun', !isLight);
          themeIcon.classList.toggle('fa-moon', isLight);
        }
      }
      if (typeof parsed.customAccent !== 'undefined') {
        state.customAccent = parsed.customAccent;
        if (typeof applyCustomThemeColor === 'function') {
          applyCustomThemeColor(parsed.customAccent);
        }
      }
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('MUN_COMMAND_STATE');
      if (saved) {
        loadStateFromData(JSON.parse(saved));
      }
      if (!state.language) state.language = 'zh';
    } catch (e) {
      state.language = 'zh';
    }
  }

  function computeStats() {
    const totalSelected = state.selectedCountries.length;
    const presentCount = state.selectedCountries.filter(c => c.attendance === 'present' || c.attendance === 'pv').length;
    const pvCount = state.selectedCountries.filter(c => c.attendance === 'pv').length;
    
    const quorum = Math.ceil(totalSelected / 3);
    const majority = presentCount > 0 ? Math.floor(presentCount / 2) + 1 : 0;
    const twoThirds = Math.ceil((presentCount * 2) / 3);

    return { totalSelected, presentCount, pvCount, quorum, majority, twoThirds };
  }

  function ensureRollCallDone() {
    const t = I18N[state.language] || I18N.en;
    if (!state.selectedCountries || state.selectedCountries.length === 0) {
      customAlert(t.sessionSetup || '會議設定', t.addCountryBeforeStartAlert || '請先加入代表國家！', () => {
        if (typeof switchTab === 'function') switchTab('setup');
      });
      return false;
    }
    const stats = computeStats();
    if (stats.presentCount === 0) {
      customAlert(t.tabRollCall || '點名', t.rollCallRequiredAlert || '會議尚未完成點名（出席人數為 0），請先進行點名才能開始！', () => {
        if (typeof switchTab === 'function') switchTab('rollcall');
      });
      return false;
    }
    return true;
  }

  // --- RENDERING ---