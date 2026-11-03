  // ================= ACTIVITY LOG (登入後自動記錄所有系列性動作) =================
  (function () {
    const MAX_ENTRIES = 500;

    function lang() { return state.language === 'en' || state.language === 'fr' ? state.language : 'zh'; }
    function tr(zh, en, fr) {
      const l = lang();
      return l === 'zh' ? zh : (l === 'fr' ? (fr || en) : en);
    }

    // 只有登入後才記錄；代表檢視模式不記錄
    function logAction(text) {
      if (!state.currentUser || state.isViewerMode || !text) return;
      if (!Array.isArray(state.activityLog)) state.activityLog = [];
      state.activityLog.push({ ts: Date.now(), text: text });
      if (state.activityLog.length > MAX_ENTRIES) {
        state.activityLog = state.activityLog.slice(-MAX_ENTRIES);
      }
      if (typeof saveToLocalStorage === 'function') saveToLocalStorage(true);
      refreshLogModalIfOpen();
    }
    window.logAction = logAction;

    function fmtTime(ts) {
      const d = new Date(ts);
      const p = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }

    function motionLabel(m) {
      if (!m) return '';
      const typeText = (typeof formatMotionType === 'function') ? formatMotionType(m.type) : m.type;
      return `${m.proposer || ''} ${typeText}${m.topic ? '「' + m.topic + '」' : ''}`.trim();
    }

    // ---------- 1. 主要里程碑操作（僅記錄核心會議決策） ----------
    const clickMap = {
      'btn-set-all-uncalled': () => tr('點名：全部設為未點名', 'Roll call: set all to uncalled', 'Appel : tous non appelés'),
      'btn-set-all-present': () => tr('點名：全部設為出席', 'Roll call: set all present', 'Appel : tous présents'),
      'btn-set-all-absent': () => tr('點名：全部設為缺席', 'Roll call: set all absent', 'Appel : tous absents'),
      'btn-reset-votes': () => tr('表決：重置票數', 'Voting: votes reset', 'Vote : votes réinitialisés'),
      'btn-reset-current-session': () => tr('會期表決：重設當前會期票數', 'Session vote: reset current session', 'Session : session actuelle réinitialisée'),
      'btn-reset-all-sessions': () => tr('會期表決：重設所有會期票數', 'Session vote: reset all sessions', 'Session : toutes les sessions réinitialisées'),
      'btn-add-new-session': () => tr('會期表決：新增會期', 'Session vote: session added', 'Session : session ajoutée'),
      'btn-clear-motions': () => tr('動議：清除所有動議', 'Motions: all cleared', 'Motions : toutes effacées')
    };

    document.addEventListener('click', (e) => {
      if (!state.currentUser || state.isViewerMode) return;
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.id;
      if (clickMap[id]) {
        logAction(clickMap[id]());
      }
    }, true);

    // ---------- 2. 分頁切換 ----------
    function wrap(name, fn) {
      const orig = window[name];
      if (typeof orig !== 'function') return;
      window[name] = function () {
        let msg = null;
        try { msg = fn.apply(null, arguments); } catch (e) {}
        const r = orig.apply(this, arguments);
        if (msg) logAction(msg);
        return r;
      };
    }

    wrap('switchTab', (tabId) => {
      if (tabId === state.currentTab) return null;
      const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"] span`);
      const name = btn ? btn.textContent.trim() : tabId;
      return tr(`切換至「${name}」分頁`, `Switched to "${name}" tab`, `Onglet « ${name} »`);
    });

    // ---------- 3. 動議 ----------
    wrap('sendMotionToVotingTab', (m) =>
      tr(`提出動議：${motionLabel(m)}`, `Motion proposed: ${motionLabel(m)}`, `Motion déposée : ${motionLabel(m)}`));
    wrap('executeMotion', (m) =>
      tr(`動議通過並執行：${motionLabel(m)}`, `Motion passed & executed: ${motionLabel(m)}`, `Motion adoptée et exécutée : ${motionLabel(m)}`));
    wrap('removeMotion', (idx) => {
      const m = state.motions && state.motions[idx];
      return m ? tr(`動議否決/移除：${motionLabel(m)}`, `Motion failed/removed: ${motionLabel(m)}`, `Motion rejetée : ${motionLabel(m)}`) : null;
    });
    wrap('adoptVotingSession', (sess) => {
      const n = sess && (sess.name || ('Session ' + sess.id));
      return tr(`會期表決通過：${n}（贊成 ${sess.favor || 0} / 反對 ${sess.against || 0} / 棄權 ${sess.abstain || 0}）`,
        `Session vote passed: ${n} (Favor ${sess.favor || 0} / Against ${sess.against || 0} / Abstain ${sess.abstain || 0})`,
        `Session adoptée : ${n} (Pour ${sess.favor || 0} / Contre ${sess.against || 0} / Abst. ${sess.abstain || 0})`);
    });

    // ---------- 4. 日誌彈窗 ----------
    let modalEl = null;

    function buildLines() {
      const list = (state.activityLog || []).slice().reverse();
      if (!state.currentUser) {
        return `<div class="text-sm text-[#D7CCC8] py-8 text-center">${tr('請先登入 Google 帳號，系統才會自動記錄您的所有操作。', 'Sign in with Google to automatically record all your actions.', 'Connectez-vous avec Google pour enregistrer toutes vos actions.')}</div>`;
      }
      if (list.length === 0) {
        return `<div class="text-sm text-[#D7CCC8] py-8 text-center">${tr('目前尚無紀錄，開始操作後會自動出現在這裡。', 'No records yet. Your actions will appear here.', 'Aucun enregistrement pour le moment.')}</div>`;
      }
      return list.map(en => {
        const safe = String(en.text).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        return `<div class="flex gap-3 py-2 border-b border-[#5D4037]/60 text-xs sm:text-sm"><span class="font-mono text-[#D7CCC8] shrink-0">${fmtTime(en.ts)}</span><span class="text-[#F7F4EE]">${safe}</span></div>`;
      }).join('');
    }

    function refreshLogModalIfOpen() {
      if (!modalEl || !document.body.contains(modalEl)) return;
      const body = modalEl.querySelector('#activity-log-body');
      if (body) body.innerHTML = buildLines();
    }

    function exportLog() {
      const rows = (state.activityLog || []).map(en => `${fmtTime(en.ts)}\t${en.text}`).join('\n');
      const blob = new Blob(['\ufeff' + rows], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `activity_log_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function openActivityLogModal() {
      if (modalEl && document.body.contains(modalEl)) modalEl.remove();
      modalEl = document.createElement('div');
      modalEl.id = 'modal-activity-log';
      modalEl.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4';
      modalEl.innerHTML = `
        <div class="custom-popup-card bg-[#3E2723] text-[#F7F4EE] rounded-3xl max-w-2xl w-full shadow-2xl border border-[#5D4037] flex flex-col max-h-[85vh] overflow-hidden">
          <div class="px-6 py-4 border-b border-[#5D4037] flex items-center justify-between shrink-0">
            <h3 class="font-bold text-lg text-[#F7F4EE]">${tr('操作紀錄', 'Activity Log', 'Journal d\'activité')}</h3>
            <button type="button" id="activity-log-close" class="p-2 text-[#D7CCC8] hover:text-white rounded-xl cursor-pointer" aria-label="Close">✕</button>
          </div>
          <div id="activity-log-body" class="px-6 py-3 overflow-y-auto flex-1 custom-scroll">${buildLines()}</div>
          <div class="px-6 py-4 border-t border-[#5D4037] flex items-center justify-end gap-2 shrink-0">
            <button type="button" id="activity-log-clear" class="px-4 py-2 rounded-xl border border-rose-400/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 text-xs font-semibold cursor-pointer">${tr('清除紀錄', 'Clear', 'Effacer')}</button>
            <button type="button" id="activity-log-export" class="px-4 py-2 rounded-xl border border-[#6D4C41] bg-[#4E342E] hover:bg-[#5D4037] text-[#F7F4EE] text-xs font-semibold cursor-pointer">${tr('匯出', 'Export', 'Exporter')}</button>
          </div>
        </div>`;
      document.body.appendChild(modalEl);
      const close = () => { modalEl.remove(); modalEl = null; };
      modalEl.addEventListener('click', (e) => { if (e.target === modalEl) close(); });
      modalEl.querySelector('#activity-log-close').onclick = close;
      modalEl.querySelector('#activity-log-export').onclick = exportLog;
      modalEl.querySelector('#activity-log-clear').onclick = () => {
        state.activityLog = [];
        if (typeof saveToLocalStorage === 'function') saveToLocalStorage(true, true);
        refreshLogModalIfOpen();
      };
    }
    window.openActivityLogModal = openActivityLogModal;

    const cfgBtn = document.getElementById('cfg-btn-activity-log');
    if (cfgBtn) {
      cfgBtn.addEventListener('click', openActivityLogModal);
    }

    const drawerBtn = document.getElementById('drawer-btn-activity-log');
    if (drawerBtn) {
      drawerBtn.addEventListener('click', () => {
        const drawer = document.getElementById('main-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        if (drawer) drawer.classList.add('-translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
        openActivityLogModal();
      });
    }
  })();
