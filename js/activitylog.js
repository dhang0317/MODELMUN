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

    // ---------- 1. 按鈕點擊（事件委派） ----------
    const clickMap = {
      'btn-set-all-uncalled': () => tr('點名：全部設為未點名', 'Roll call: set all to uncalled', 'Appel : tous non appelés'),
      'btn-set-all-present': () => tr('點名：全部設為出席', 'Roll call: set all present', 'Appel : tous présents'),
      'btn-set-all-absent': () => tr('點名：全部設為缺席', 'Roll call: set all absent', 'Appel : tous absents'),
      'btn-gsl-start': () => tr('主發言名單：開始計時', 'GSL: timer started', 'GSL : chrono démarré'),
      'btn-gsl-pause': () => tr('主發言名單：暫停計時', 'GSL: timer paused', 'GSL : chrono en pause'),
      'btn-gsl-next': () => tr('主發言名單：下一位發言', 'GSL: next speaker', 'GSL : orateur suivant'),
      'btn-mod-start': () => tr('有主持磋商：開始計時', 'Moderated caucus: timer started', 'Caucus modéré : chrono démarré'),
      'btn-mod-next': () => tr('有主持磋商：下一位發言', 'Moderated caucus: next speaker', 'Caucus modéré : orateur suivant'),
      'btn-unmod-start': () => tr('無主持磋商：開始計時', 'Unmoderated caucus: timer started', 'Caucus non modéré : chrono démarré'),
      'btn-single-start': () => tr('單一代表發言：開始計時', 'Single speaker: timer started', 'Orateur unique : chrono démarré'),
      'btn-procon-start': () => tr('正反方辯論：開始計時', 'Pro/Con: timer started', 'Pour/Contre : chrono démarré'),
      'btn-procon-next': () => tr('正反方辯論：下一位發言', 'Pro/Con: next speaker', 'Pour/Contre : orateur suivant'),
      'btn-reset-votes': () => tr('表決：重置票數', 'Voting: votes reset', 'Vote : votes réinitialisés'),
      'btn-reset-current-session': () => tr('會期表決：重設當前會期票數', 'Session vote: reset current session', 'Session : session actuelle réinitialisée'),
      'btn-reset-all-sessions': () => tr('會期表決：重設所有會期票數', 'Session vote: reset all sessions', 'Session : toutes les sessions réinitialisées'),
      'btn-add-new-session': () => tr('會期表決：新增會期', 'Session vote: session added', 'Session : session ajoutée'),
      'btn-clear-motions': () => tr('動議：清除所有動議', 'Motions: all cleared', 'Motions : toutes effacées')
    };

    const castMap = {
      'btn-cast-favor': ['贊成', 'In favor', 'Pour'],
      'btn-cast-against': ['反對', 'Against', 'Contre'],
      'btn-cast-abstain': ['棄權', 'Abstain', 'Abstention'],
      'btn-cast-pass': ['跳過 (Pass)', 'Pass', 'Passe']
    };

    document.addEventListener('click', (e) => {
      if (!state.currentUser || state.isViewerMode) return;
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.id;
      if (clickMap[id]) {
        logAction(clickMap[id]());
      } else if (castMap[id]) {
        const nameEl = document.getElementById('active-voter-name');
        const who = nameEl ? nameEl.textContent.trim() : '';
        const v = castMap[id];
        logAction(tr(`唱名表決：${who} → ${v[0]}`, `Roll-call vote: ${who} → ${v[1]}`, `Vote nominal : ${who} → ${v[2]}`));
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
        return `<div class="text-sm text-zinc-400 py-8 text-center">${tr('請先登入 Google 帳號，系統才會自動記錄您的所有操作。', 'Sign in with Google to automatically record all your actions.', 'Connectez-vous avec Google pour enregistrer toutes vos actions.')}</div>`;
      }
      if (list.length === 0) {
        return `<div class="text-sm text-zinc-400 py-8 text-center">${tr('目前尚無紀錄，開始操作後會自動出現在這裡。', 'No records yet. Your actions will appear here.', 'Aucun enregistrement pour le moment.')}</div>`;
      }
      return list.map(en => {
        const safe = String(en.text).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        return `<div class="flex gap-3 py-2 border-b border-zinc-800/60 text-xs sm:text-sm"><span class="font-mono text-zinc-400 shrink-0">${fmtTime(en.ts)}</span><span class="text-white">${safe}</span></div>`;
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
      modalEl.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4';
      modalEl.innerHTML = `
        <div class="bg-zinc-900 text-white rounded-3xl max-w-2xl w-full shadow-2xl border border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden">
          <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <h3 class="font-bold text-lg">${tr('操作紀錄', 'Activity Log', 'Journal d\'activité')}</h3>
            <button type="button" id="activity-log-close" class="p-2 text-zinc-400 hover:text-white rounded-xl cursor-pointer" aria-label="Close">
              <svg class="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div id="activity-log-body" class="px-6 py-3 overflow-y-auto flex-1">${buildLines()}</div>
          <div class="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-2 shrink-0">
            <button type="button" id="activity-log-clear" class="px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 text-xs font-semibold cursor-pointer">${tr('清除紀錄', 'Clear', 'Effacer')}</button>
            <button type="button" id="activity-log-export" class="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-semibold cursor-pointer">${tr('匯出', 'Export', 'Exporter')}</button>
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
