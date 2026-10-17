  // ================= GOOGLE AUTHENTICATION =================
  function initGoogleAuth() {
    const loginBtn = document.getElementById('btn-google-login');
    const userMenu = document.getElementById('user-profile-menu');
    const avatarBtn = document.getElementById('btn-user-avatar');
    const avatarImg = document.getElementById('user-avatar-img');
    const nameText = document.getElementById('user-name-text');
    const emailText = document.getElementById('user-email-text');
    const popover = document.getElementById('user-dropdown-popover');
    const logoutBtn = document.getElementById('btn-google-logout');

    // Restore saved Google user
    try {
      const savedUser = localStorage.getItem('MUN_USER_PROFILE');
      if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        updateAuthUI();
      }
    } catch (e) {}

    function updateAuthUI() {
      if (state.currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (avatarImg) avatarImg.src = state.currentUser.picture || 'https://lh3.googleusercontent.com/a/default-user';
        const userMenuName = document.getElementById('user-menu-name');
        if (userMenuName) userMenuName.textContent = '登出 (' + (state.currentUser.name || '已登入') + ')';
        if (nameText) nameText.textContent = state.currentUser.name || 'MUN Delegate';
        if (emailText) emailText.textContent = state.currentUser.email || '';
        hidePortal();
      } else {
        if (loginBtn) loginBtn.style.display = '';
        if (userMenu) userMenu.style.display = 'none';
        if (popover) {
          popover.classList.add('hidden');
          popover.style.display = 'none';
        }
      }
    }

    if (avatarBtn && popover) {
      avatarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentDisplay = window.getComputedStyle(popover).display;
        if (currentDisplay === 'none' || popover.classList.contains('hidden')) {
          popover.classList.remove('hidden');
          popover.style.display = 'block';
          if (window.lucide) {
            window.lucide.createIcons();
          }
        } else {
          popover.classList.add('hidden');
          popover.style.display = 'none';
        }
      });
      popover.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      document.addEventListener('click', () => {
        popover.classList.add('hidden');
        popover.style.display = 'none';
      });
    }

    // ================= GOOGLE IDENTITY SERVICES (GIS) =================
    function decodeJwtResponse(token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }

    async function onUserAuthenticated(user) {
      state.currentUser = user;
      localStorage.setItem('MUN_USER_PROFILE', JSON.stringify(state.currentUser));
      updateAuthUI();

      // 檢查該使用者在雲端是否已有專屬的會議紀錄
      const loaded = await loadFromCloudKV();
      if (!loaded) {
        // 如果此帳號為初次登入或雲端尚無存檔，重置為預設會議範本，避免受到前一位使用者留存資料影響
        if (typeof resetStateToDefaults === 'function') {
          resetStateToDefaults();
        }
        updateAvailableCountriesPool();
        saveToLocalStorage(true);
        renderAll();
      }
      showToast(`歡迎回來，${state.currentUser.name}！`, 'success');
    }

    function handleGoogleCredential(response) {
      try {
        const payload = decodeJwtResponse(response.credential);
        const user = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          sub: payload.sub
        };
        onUserAuthenticated(user);
      } catch (e) {
        console.warn('Google credential decode error:', e);
      }
    }

    function initGIS() {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
      window.google.accounts.id.initialize({
        client_id: '749514935582-tjudm16kp2ddjri6ag25q6dnlqds9lr6.apps.googleusercontent.com',
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false
      });
      // Do not auto-prompt One Tap to prevent intrusive popups on every page load
    }

    if (window.google && window.google.accounts) {
      initGIS();
    } else {
      window.addEventListener('load', initGIS);
    }

    // If user is already logged in locally, attempt to load latest cloud state
    if (state.currentUser) {
      loadFromCloudKV();
    }

    const syncNowBtn = document.getElementById('btn-cloud-sync-now');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.currentUser) {
          const payload = {
            committeeName: state.committeeName,
            agenda: state.agenda,
            selectedCountries: state.selectedCountries,
            gslDefaultTime: state.gslDefaultTime,
            modTopic: state.modTopic,
            modTotalMins: state.modTotalMins,
            modSpeakerSecs: state.modSpeakerSecs,
            unmodSecsRemaining: state.unmodSecsRemaining,
            motions: state.motions,
            voteThreshold: state.voteThreshold,
            voteResolutionTitle: state.voteResolutionTitle,
            language: state.language
          };
          saveToCloudKV(payload, true);
        } else {
          saveToLocalStorage(true);
          showToast('進度已儲存至本機，登入後可雲端同步', 'info');
        }
        if (popover) {
          popover.classList.add('hidden');
          popover.style.display = 'none';
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.currentUser = null;
        localStorage.removeItem('MUN_USER_PROFILE');
        sessionStorage.removeItem('MUN_PORTAL_GUEST');
        localStorage.removeItem('MUN_COMMAND_STATE'); // 清除本地前一帳號殘留的會議資料

        // 重置為初始空白狀態
        if (typeof resetStateToDefaults === 'function') {
          resetStateToDefaults();
        }
        updateAvailableCountriesPool();
        renderAll();

        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.disableAutoSelect();
        }
        updateAuthUI();
        const drawer = document.getElementById('main-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        if (drawer) drawer.classList.add('-translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
        showToast('已登出', 'info');
      });
    }

    function triggerStandardGoogleLogin() {
      if (!window.google || !window.google.accounts) {
        showToast('Google 登入服務尚未載入，請稍候重試', 'error');
        return;
      }
      
      // Try One Tap first
      if (window.google.accounts.id) {
        window.google.accounts.id.prompt();
      }

      // Also trigger standard popup without sensitive scopes (Only profile + email)
      if (window.google.accounts.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: '749514935582-tjudm16kp2ddjri6ag25q6dnlqds9lr6.apps.googleusercontent.com',
            scope: 'openid profile email',
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const userInfo = await res.json();
                  const user = {
                    name: userInfo.name,
                    email: userInfo.email,
                    picture: userInfo.picture,
                    sub: userInfo.sub
                  };
                  await onUserAuthenticated(user);
                } catch (err) {
                  console.error('Fetch userinfo failed:', err);
                }
              }
            }
          });
          client.requestAccessToken();
        } catch (e) {
          console.warn('OAuth2 token client trigger error:', e);
        }
      }
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        triggerStandardGoogleLogin();
      });
    }

    // ================= PORTAL / COVER LANDING SCREEN LOGIC =================
    const portalModal = document.getElementById('modal-portal-landing');
    const portalLoginBtn = document.getElementById('btn-portal-google-login');
    const portalGuestBtn = document.getElementById('btn-portal-guest-continue');

    function hidePortal() {
      if (portalModal) {
        portalModal.classList.add('portal-hidden');
        portalModal.classList.add('hidden');
        portalModal.style.display = 'none';
      }
    }

    function showPortal() {
      if (portalModal) {
        portalModal.style.display = 'flex';
        portalModal.classList.remove('hidden');
        void portalModal.offsetWidth;
        portalModal.classList.remove('portal-hidden');
      }
    }

    window.hidePortalCover = hidePortal;
    window.showPortalCover = showPortal;

    // Never auto pop up portal cover on load
    hidePortal();

    if (portalGuestBtn) {
      portalGuestBtn.addEventListener('click', () => {
        sessionStorage.setItem('MUN_PORTAL_GUEST', 'true');
        hidePortal();
        showToast('已以訪客模式進入會議系統', 'info');
      });
    }

    if (portalLoginBtn) {
      portalLoginBtn.addEventListener('click', () => {
        triggerStandardGoogleLogin();
      });
    }
  }
