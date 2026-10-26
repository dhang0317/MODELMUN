  // --- CUSTOM UI MODAL HELPER (NO BROWSER ALERT / PROMPT) ---
  function showModal({ title, message, showInput = false, inputDefault = '', inputPlaceholder = '', confirmText = null, cancelText = null, onConfirm = null }) {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in custom-dialog-backdrop';
    
    const box = document.createElement('div');
    box.className = 'custom-dialog-box bg-[#F7F4EE] text-[#3E2723] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 transform transition-all scale-100 border border-[#D7CCC8]';

    const lang = state.language;
    const okBtnText = confirmText || I18N[lang].confirm;
    const noBtnText = cancelText || I18N[lang].cancel;

    box.innerHTML = `
      <div class="flex items-center justify-between border-b border-[#D7CCC8] pb-3">
        <h3 class="font-bold text-lg text-[#3E2723]">${title || ''}</h3>
        <button class="modal-close-icon p-1 text-[#8D6E63] hover:text-[#3E2723] transition cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      ${message ? `<div class="text-sm text-[#5D4037] leading-relaxed font-medium">${message}</div>` : ''}
      ${showInput ? `<input type="text" class="modal-input w-full px-3 py-2 bg-white border border-[#D7CCC8] text-[#3E2723] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3E2723] font-medium" value="${inputDefault}" placeholder="${inputPlaceholder}">` : ''}
      <div class="flex items-center justify-end space-x-2 pt-2">
        ${cancelText !== false ? `<button class="modal-btn-cancel px-4 py-2 border border-[#D7CCC8] bg-[#EFEBE9] hover:bg-[#D7CCC8] text-[#3E2723] rounded-xl text-xs font-semibold cursor-pointer">${noBtnText}</button>` : ''}
        <button class="modal-btn-confirm px-5 py-2 bg-[#3E2723] hover:bg-[#4E342E] text-[#F7F4EE] rounded-xl text-xs font-bold shadow border border-[#3E2723] cursor-pointer">${okBtnText}</button>
      </div>
    `;

    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    if (window.lucide) window.lucide.createIcons();

    const inputField = box.querySelector('.modal-input');
    if (inputField) {
      setTimeout(() => {
        inputField.focus();
        inputField.select();
      }, 50);
    }

    function cleanup() {
      backdrop.remove();
    }

    box.querySelector('.modal-close-icon').onclick = cleanup;
    const cancelBtn = box.querySelector('.modal-btn-cancel');
    if (cancelBtn) cancelBtn.onclick = cleanup;

    box.querySelector('.modal-btn-confirm').onclick = () => {
      const val = inputField ? inputField.value : true;
      cleanup();
      if (onConfirm) onConfirm(val);
    };

    if (inputField) {
      inputField.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const val = inputField.value;
          cleanup();
          if (onConfirm) onConfirm(val);
        } else if (e.key === 'Escape') {
          cleanup();
        }
      };
    }
  }

  function showToast(message, type = 'success', duration = 2500) {
    let container = document.getElementById('mun-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'mun-toast-container';
      container.className = 'fixed top-2 right-3 z-[99999] flex flex-col items-end space-y-1.5 pointer-events-none overflow-hidden';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-slide-in px-3 py-1.5 rounded-lg shadow-lg border text-xs font-semibold flex items-center space-x-1.5 max-w-[280px] pointer-events-auto ${
      type === 'success' ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20' :
      type === 'error' ? 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20' :
      'bg-slate-900 text-white border-slate-700 shadow-slate-950/30'
    }`;
    
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-3.5 h-3.5 flex-shrink-0"></i>
      <span class="truncate">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Auto dismiss: slide smoothly out to right
    setTimeout(() => {
      toast.classList.remove('toast-slide-in');
      toast.classList.add('toast-slide-out');
      setTimeout(() => toast.remove(), 320);
    }, duration);
  }

  function customAlert(title, message) {
    showModal({ title, message, cancelText: false });
  }

  function customPrompt(title, message, defaultVal, callback) {
    showModal({ title, message, showInput: true, inputDefault: defaultVal, onConfirm: callback });
  }

  function customConfirm(title, message, callback) {
    showModal({ title, message, onConfirm: callback });
  }