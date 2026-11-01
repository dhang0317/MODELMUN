  // ================= ADAPTIVE STATUS BUTTONS (依底色深淺自動調整 綠 / 紅 / 黃 按鈕) =================
  (function () {
    // 色票：light = 底色較亮時使用，dark = 底色較深時使用
    const PALETTE = {
      green:  { light: { main: '#7D9462', text: '#5B6D46', onSolid: '#FFFFFF', rgb: '125,148,98' },
                dark:  { main: '#B5C99A', text: '#C9DBAF', onSolid: '#1F2A14', rgb: '181,201,154' } },
      red:    { light: { main: '#913D48', text: '#913D48', onSolid: '#FFFFFF', rgb: '145,61,72' },
                dark:  { main: '#E59EA6', text: '#EBB0B7', onSolid: '#3A1015', rgb: '229,158,166' } },
      yellow: { light: { main: '#B58A38', text: '#8F6A22', onSolid: '#FFFFFF', rgb: '214,181,117' },
                dark:  { main: '#EBD3A0', text: '#F0DDB4', onSolid: '#3D2E0F', rgb: '235,211,160' } }
    };

    // [選取器, 顏色, 樣式] 樣式：soft = 半透明底、solid = 實心、outline = 僅外框
    const RULES = [
      ['.btn-rollcall-present, .btn-rollcall-status-present, #btn-set-all-present, #btn-cast-favor', 'green', 'soft'],
      ['.btn-rollcall-absent, .btn-rollcall-status-absent, #btn-set-all-absent, #btn-cast-against', 'red', 'soft'],
      ['.btn-rollcall-status-pv, #btn-cast-abstain, #btn-cast-pass', 'yellow', 'soft'],
      ['#btn-adopt-vote, #btn-quick-pass, #btn-motion-vote-execute, #btn-hero-motion-second, #btn-hero-motion-pass', 'green', 'solid'],
      ['#btn-hero-motion-fail', 'red', 'solid'],
      ['#btn-reset-votes, #btn-reset-current-session, #btn-reset-all-sessions', 'red', 'outline']
    ];

    function parseColor(str) {
      const m = (str || '').match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map(s => parseFloat(s));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }

    function luminance(c) {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }

    // 往上找第一個不透明的背景色；找不到就用 body
    function backdropIsDark(el) {
      let node = el.parentElement;
      while (node) {
        const c = parseColor(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0.6) return luminance(c) < 0.4;
        node = node.parentElement;
      }
      const bodyC = parseColor(getComputedStyle(document.body).backgroundColor);
      return bodyC ? luminance(bodyC) < 0.4 : false;
    }

    function setImp(el, prop, val) { el.style.setProperty(prop, val, 'important'); }

    function paint(el, color, kind) {
      const tone = backdropIsDark(el) ? 'dark' : 'light';
      if (el.dataset.adaptTone === tone && el.dataset.adaptKind === kind && el.dataset.adaptColor === color) return;
      el.dataset.adaptTone = tone;
      el.dataset.adaptKind = kind;
      el.dataset.adaptColor = color;
      const p = PALETTE[color][tone];
      const isStatus = /btn-rollcall-status/.test(el.className);
      if (kind === 'solid') {
        setImp(el, 'background-color', p.main);
        setImp(el, 'background', p.main);
        setImp(el, 'color', p.onSolid);
        setImp(el, 'border', '1.5px solid ' + p.main);
      } else if (kind === 'outline') {
        setImp(el, 'background-color', 'transparent');
        setImp(el, 'background', 'transparent');
        setImp(el, 'color', p.text);
        setImp(el, 'border', '1px solid rgba(' + p.rgb + ',0.55)');
      } else {
        const alpha = isStatus ? (tone === 'dark' ? 0.30 : 0.32) : (tone === 'dark' ? 0.24 : 0.20);
        const bg = 'rgba(' + p.rgb + ',' + alpha + ')';
        setImp(el, 'background-color', bg);
        setImp(el, 'background', bg);
        setImp(el, 'color', p.text);
        setImp(el, 'border', (isStatus ? '2px' : '1.5px') + ' solid ' + p.main);
      }
      el.classList.add('adaptive-btn');
    }

    function applyAll() {
      RULES.forEach(([sel, color, kind]) => {
        document.querySelectorAll(sel).forEach(el => paint(el, color, kind));
      });
    }

    // 一次性注入 hover 回饋（行內樣式會蓋掉原本的 hover CSS）
    const style = document.createElement('style');
    style.textContent = '.adaptive-btn{transition:filter .15s ease,transform .1s ease}.adaptive-btn:hover{filter:brightness(1.08)}.adaptive-btn:active{filter:brightness(.94)}';
    document.head.appendChild(style);

    let raf = 0;
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; applyAll(); });
    }

    // 主題 / 深淺模式 / 自訂色改變時重新判斷（需先清掉快取標記）
    function resetAndSchedule() {
      document.querySelectorAll('.adaptive-btn').forEach(el => { delete el.dataset.adaptTone; });
      schedule();
    }
    const attrObs = new MutationObserver(resetAndSchedule);
    attrObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    attrObs.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });

    // 內容重繪（新卡片、切換分頁）時補上
    const main = document.querySelector('main');
    if (main) {
      new MutationObserver(schedule).observe(main, { childList: true, subtree: true });
    }

    // 包裝 renderAll，每次重繪後重新判斷
    const origRender = window.renderAll;
    if (typeof origRender === 'function') {
      window.renderAll = function () {
        const r = origRender.apply(this, arguments);
        schedule();
        return r;
      };
    }

    window.applyAdaptiveButtons = resetAndSchedule;
    schedule();
  })();
