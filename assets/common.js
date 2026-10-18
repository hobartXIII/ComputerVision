/* 共用：章節清單、頁首、目錄、主題切換、KaTeX、測驗、矩陣與畫布工具 */
(function () {
  'use strict';

  // 新增一章時，在這裡加一行（done: 網頁是否完成）
  const CHAPTERS = [
    { id: 'c0', no: 'C0', title: '課程導論：什麼是電腦視覺', desc: '四大任務、傳統 vs 現代電腦視覺、課程規則', done: true },
    { id: 'c1', no: 'C1', title: '視覺機器學習模型', desc: 'SVM、KNN、PCA、神經網路、損失函數、梯度下降、優化器', done: true },
    { id: 'c2', no: 'C2', title: '卷積神經網路（CNN）', desc: '卷積、padding、stride、ReLU、pooling、參數量計算', done: true },
    { id: 'c3', no: 'C3', title: '模型品質與改進', desc: '混淆矩陣、Precision／Recall／F1、Overfitting、L1／L2、Dropout、Early Stopping、BN、資料擴增', done: true },
    { id: 'c4', no: 'C4', title: '進階影像視覺模型（Part 1）', desc: 'VGG、Inception、ResNet、GAP、SqueezeNet、MobileNet、EfficientNet', done: true },
    { id: 'c4-2', no: 'C4-2', title: '進階影像視覺模型（Part 2）', desc: 'DenseNet、Dense Block、增長率、Bottleneck、過渡層、DenseNet-BC', done: true },
    { id: 'c5', no: 'C5', title: '遷移學習與微調', desc: '特徵提取、微調、Full／Partial（Last-k）、PEFT（LoRA）、Regularized（L2-SP）', done: true },
  ];
  const EXAMS = [
    { name: '期中考', date: '2026-10-29' },
    { name: '期末考', date: '2026-12-17' },
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c != null) e.append(c);
    return e;
  }

  // 數字格式：去掉多餘的 0
  function fmt(n, d = 3) {
    if (!isFinite(n)) return String(n);
    const r = Number(n.toFixed(d));
    return Object.is(r, -0) ? '0' : String(r);
  }
  const int = (n) => Math.round(n).toLocaleString('en-US');

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- 主題 ---------- */
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    document.dispatchEvent(new Event('themechange'));
  }
  applyTheme(store('cv-theme'));
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      document.dispatchEvent(new Event('themechange'));
    });
  }
  function isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ---------- 頁首 ---------- */
  function buildTopbar() {
    const current = document.body.dataset.chapter || 'home';
    const inChapter = current !== 'home';
    const prefix = inChapter ? '../' : '';
    const nav = el('nav', { class: 'chapnav', 'aria-label': '章節' });
    nav.append(el('a', { href: prefix + 'index.html', text: '首頁', class: current === 'home' ? 'active' : '' }));
    for (const c of CHAPTERS) {
      if (!c.done) continue;
      nav.append(el('a', {
        href: prefix + 'chapters/' + c.id + '.html',
        text: c.no, title: c.title, class: current === c.id ? 'active' : '',
      }));
    }
    const themeBtn = el('button', { class: 'icon-btn', type: 'button', title: '切換深色／淺色' });
    const label = () => { themeBtn.textContent = isDark() ? '☀ 淺色' : '☾ 深色'; };
    label();
    themeBtn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      store('cv-theme', next);
      applyTheme(next);
      label();
    });
    const bar = el('header', { class: 'topbar' }, [
      el('div', { class: 'topbar-inner' }, [
        el('a', { class: 'brand', href: prefix + 'index.html', text: '👁️ 電腦視覺筆記' }),
        nav, themeBtn,
      ]),
    ]);
    document.body.prepend(bar);
  }

  /* ---------- 目錄 ---------- */
  function buildToc() {
    const toc = $('.toc');
    const main = $('main');
    if (!toc || !main) return;
    const heads = $$('h2, h3', main).filter((h) => !h.closest('.widget, .quiz, .callout'));
    let n = 0;
    const links = [];
    for (const h of heads) {
      if (!h.id) h.id = 'sec-' + (++n);
      const a = el('a', { href: '#' + h.id, text: h.textContent, class: h.tagName === 'H3' ? 'sub' : '' });
      toc.append(a);
      links.push([h, a]);
    }
    // 目前位置 = 最後一個已捲過頁首的標題
    let ticking = false;
    const sync = () => {
      ticking = false;
      let cur = links[0];
      for (const l of links) { if (l[0].getBoundingClientRect().top < 110) cur = l; else break; }
      links.forEach(([, a]) => a.classList.toggle('active', cur && a === cur[1]));
      if (cur) {
        const a = cur[1], t = toc.getBoundingClientRect(), r = a.getBoundingClientRect();
        if (r.top < t.top || r.bottom > t.bottom) toc.scrollTop += r.top - t.top - t.height / 3;
      }
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
    sync();
  }

  /* ---------- KaTeX ---------- */
  function renderMath(root = document.body) {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
    });
  }
  // 把 TeX 字串渲染進元素（互動元件用）
  function tex(elm, s, display = false) {
    if (window.katex) window.katex.render(s, elm, { displayMode: display, throwOnError: false });
    else elm.textContent = s;
  }

  /* ---------- 測驗 ---------- */
  function initQuizzes() {
    for (const q of $$('.quiz[data-answer]')) {
      const ans = q.dataset.answer;
      const explain = $('.explain', q);
      const btns = $$('.opts button', q);
      for (const b of btns) {
        b.type = 'button';
        b.addEventListener('click', () => {
          const ok = b.dataset.opt === ans;
          b.classList.add(ok ? 'right' : 'wrong');
          if (ok) {
            btns.forEach((x) => { x.disabled = true; });
            if (explain) explain.hidden = false;
          } else {
            b.disabled = true;
          }
        });
      }
      if (explain) {
        const reveal = el('button', { class: 'btn', type: 'button', text: '直接看解答', style: 'margin-top:8px' });
        reveal.addEventListener('click', () => {
          btns.forEach((x) => {
            x.disabled = true;
            if (x.dataset.opt === ans) x.classList.add('right');
          });
          explain.hidden = false;
          reveal.remove();
        });
        explain.before(reveal);
      }
    }
  }

  /* ---------- 逐步展開 ---------- */
  // <div class="steps"><p class="steps-title">…</p><ol><li>…</li></ol></div>
  // 一開始只顯示題目，按「下一步」一次多顯示一步
  function initSteps() {
    for (const box of $$('.steps')) {
      const items = $$('ol > li', box);
      if (!items.length) continue;
      let shown = 0;
      const next = el('button', { class: 'btn primary', type: 'button' });
      const all = el('button', { class: 'btn', type: 'button', text: '全部展開' });
      const reset = el('button', { class: 'btn', type: 'button', text: '收起' });
      const count = el('span', { class: 'muted', style: 'font-size:.88rem' });
      const sync = () => {
        items.forEach((li, i) => { li.hidden = i >= shown; });
        next.textContent = shown === 0 ? '開始第 1 步 ▶' : '下一步 ▶';
        next.disabled = all.disabled = shown >= items.length;
        reset.hidden = shown === 0;
        count.textContent = shown >= items.length ? `共 ${items.length} 步，全部展開` : `${shown}／${items.length} 步`;
      };
      next.addEventListener('click', () => { shown = Math.min(items.length, shown + 1); sync(); });
      all.addEventListener('click', () => { shown = items.length; sync(); });
      reset.addEventListener('click', () => { shown = 0; sync(); });
      box.append(el('div', { class: 'steps-ctrl' }, [next, all, reset, count]));
      sync();
    }
  }

  /* ---------- 矩陣 ---------- */
  // M: 2D 陣列；opts.cls(i,j,v) 回傳 class 字串；opts.onClick(i,j)；opts.text(i,j,v)
  function matrix(M, opts = {}) {
    const rows = M.length;
    const cols = rows ? M[0].length : 0;
    const g = el('div', { class: 'matrix' + (opts.small ? ' small' : '') });
    g.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const v = M[i][j];
        const txt = opts.text ? opts.text(i, j, v) : (v === null || v === undefined ? '' : fmt(v, 2));
        let cls = 'cell';
        if (v === null || v === undefined) cls += ' empty';
        else if (typeof v === 'number' && v < 0) cls += ' neg';
        if (opts.cls) cls += ' ' + (opts.cls(i, j, v) || '');
        if (opts.onClick) cls += ' click';
        const c = el('div', { class: cls, text: txt || (v == null ? '·' : '') });
        if (opts.onClick) c.addEventListener('click', () => opts.onClick(i, j));
        g.append(c);
      }
    }
    if (!opts.caption) return g;
    return el('div', { class: 'matrix-block' }, [g, el('div', { class: 'cap', text: opts.caption })]);
  }

  /* ---------- 畫布 ---------- */
  // 建立高解析度畫布，回傳 { ctx, w, h }（w,h 為 CSS 像素，依 aspect 比例）
  function setupCanvas(canvas, aspect) {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
    const h = Math.round(w * aspect);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '13px system-ui, sans-serif';
    return { ctx, w, h };
  }
  // 元件重畫：主題切換、視窗縮放時自動呼叫
  const redrawers = [];
  function onRedraw(fn) { redrawers.push(fn); fn(); }
  let rt = null;
  const redrawAll = () => redrawers.forEach((f) => f());
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(redrawAll, 120); });
  document.addEventListener('themechange', () => requestAnimationFrame(redrawAll));

  // 指標座標（CSS 像素）
  function pointer(canvas, ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  // 可重現的亂數
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function gauss(r) {
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // 綁定滑桿與數值顯示：<input id=x> 旁邊的 <span data-for=x>
  function bindRange(input, onChange, format = (v) => v) {
    const out = document.querySelector(`[data-for="${input.id}"]`);
    const upd = () => { if (out) out.textContent = format(Number(input.value)); onChange(Number(input.value)); };
    input.addEventListener('input', upd);
    upd();
  }

  /* ---------- 螢光筆 ---------- */
  // 選取 <main> 裡的文字 → 跳出色票；點已標記的文字可換色或移除。
  // 標記以「純文字位置＋原文」存在 localStorage（cv-hl:<chapter>），只留在這個瀏覽器。
  // 互動元件、公式、按鈕裡的文字會變動，不能標記，也不算進位置。
  const MARKS = [
    { c: 'y', label: '黃底' }, { c: 'g', label: '綠底' }, { c: 'p', label: '粉底' },
    { c: 'r', label: '紅字' }, { c: 'b', label: '藍字' },
  ];
  const HL_SKIP = '.widget, .katex, script, style, button, .steps-ctrl, .hl-tool';

  function initHighlighter() {
    const chapter = document.body.dataset.chapter;
    const main = $('main');
    if (!chapter || !main) return;
    const key = 'cv-hl:' + chapter;
    let list = [];
    try { list = JSON.parse(store(key) || '[]'); } catch (e) { list = []; }
    const save = () => store(key, JSON.stringify(list));

    // 可標記的文字節點與其在全文中的起點
    function textNodes() {
      const out = [];
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement.closest(HL_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      let base = 0;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) { out.push({ n, base }); base += n.length; }
      return out;
    }

    function rangeToOffsets(range) {
      let s = Infinity, e = -Infinity;
      for (const { n, base } of textNodes()) {
        if (!range.intersectsNode(n)) continue;
        const st = n === range.startContainer ? range.startOffset : 0;
        const en = n === range.endContainer ? range.endOffset : n.length;
        if (en > st) { s = Math.min(s, base + st); e = Math.max(e, base + en); }
      }
      return s < e ? { s, e } : null;
    }

    function wrap(h) {
      const nodes = textNodes();
      const full = nodes.map((x) => x.n.data).join('');
      let { s, e } = h;
      if (full.slice(s, e) !== h.text) {       // 內容改過：改用原文找
        s = full.indexOf(h.text);
        if (s < 0) return false;
        e = s + h.text.length;
      }
      const segs = [];
      for (const { n, base } of nodes) {
        const a = Math.max(s, base) - base, b = Math.min(e, base + n.length) - base;
        if (b > a && n.data.slice(a, b).trim()) segs.push([n, a, b]);
      }
      for (let [n, a, b] of segs) {
        if (b < n.length) n.splitText(b);
        if (a > 0) n = n.splitText(a);
        const m = el('mark', { class: 'cv-mark', 'data-c': h.c, 'data-id': h.id });
        n.replaceWith(m);
        m.append(n);
      }
      return segs.length > 0;
    }

    function unwrap(id) {
      for (const m of $$(`mark.cv-mark[data-id="${id}"]`, main)) {
        const p = m.parentNode;
        m.replaceWith(...m.childNodes);
        p.normalize();
      }
    }

    // 浮動工具列
    const tool = el('div', { class: 'hl-tool', hidden: '' });
    document.body.append(tool);
    tool.addEventListener('mousedown', (ev) => ev.preventDefault());   // 不要讓點按鈕清掉選取
    const hide = () => { tool.hidden = true; };

    function show(rect, buttons) {
      tool.replaceChildren(...buttons);
      tool.hidden = false;
      const vw = document.documentElement.clientWidth;
      const w = tool.offsetWidth;
      const x = Math.max(8, Math.min(vw - w - 8, rect.left + rect.width / 2 - w / 2));
      tool.style.left = x + window.scrollX + 'px';
      tool.style.top = rect.bottom + window.scrollY + 8 + 'px';
    }

    const swatch = (c, label, current, onPick) => el('button', {
      type: 'button', class: 'hl-sw' + (c === current ? ' on' : ''), 'data-c': c, title: label, 'aria-label': label,
      text: c === 'r' || c === 'b' ? 'A' : '', onclick: onPick,
    });

    function onSelect() {
      const sel = window.getSelection();
      if (!sel.rangeCount || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const inMain = (node) => main.contains(node) && !(node.nodeType === 1 ? node : node.parentElement).closest('.widget');
      if (!inMain(range.startContainer) || !inMain(range.endContainer)) return;
      const off = rangeToOffsets(range);
      if (!off) return;
      show(range.getBoundingClientRect(), MARKS.map((m) => swatch(m.c, m.label, null, () => {
        const full = textNodes().map((x) => x.n.data).join('');
        const h = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), c: m.c, ...off, text: full.slice(off.s, off.e) };
        sel.removeAllRanges();
        if (wrap(h)) { list.push(h); save(); }
        hide();
      })));
    }

    function onMarkClick(mark) {
      const h = list.find((x) => x.id === mark.dataset.id);
      if (!h) return;
      const recolor = (c) => () => {
        h.c = c; save();
        $$(`mark.cv-mark[data-id="${h.id}"]`, main).forEach((m) => { m.dataset.c = c; });
        hide();
      };
      const del = el('button', { type: 'button', class: 'btn', text: '移除', onclick: () => {
        unwrap(h.id); list = list.filter((x) => x !== h); save(); hide();
      } });
      const clearAll = el('button', { type: 'button', class: 'btn', text: '清除本頁全部' });
      clearAll.addEventListener('click', () => {
        if (clearAll.dataset.armed) {
          list.forEach((x) => unwrap(x.id)); list = []; save(); hide();
        } else {
          clearAll.dataset.armed = '1';
          clearAll.textContent = `再按一次清除 ${list.length} 個`;
        }
      });
      show(mark.getBoundingClientRect(), [...MARKS.map((m) => swatch(m.c, m.label, h.c, recolor(m.c))), del, clearAll]);
    }

    document.addEventListener('mouseup', (ev) => { if (!tool.contains(ev.target)) setTimeout(onSelect, 0); });
    document.addEventListener('keyup', (ev) => { if (ev.shiftKey) onSelect(); });
    document.addEventListener('touchend', () => setTimeout(onSelect, 300));
    document.addEventListener('mousedown', (ev) => { if (!tool.contains(ev.target)) hide(); });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') hide(); });
    main.addEventListener('click', (ev) => {
      const mark = ev.target.closest('mark.cv-mark');
      if (mark && window.getSelection().isCollapsed) onMarkClick(mark);
    });

    // 公式渲染後才還原，位置才會跟選取時一致；找不到的先保留，不刪
    list.forEach(wrap);
  }

  /* ---------- 首頁 ---------- */
  function buildHome() {
    const cards = $('#chapter-cards');
    if (cards) {
      for (const c of CHAPTERS) {
        cards.append(el('a', { class: 'card' + (c.done ? '' : ' todo'), href: 'chapters/' + c.id + '.html' }, [
          el('span', { class: 'num', text: c.no }),
          el('h3', { text: c.title }),
          el('p', { text: c.done ? c.desc : '尚未完成' }),
        ]));
      }
    }
    const cd = $('#countdown');
    if (cd) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      for (const e of EXAMS) {
        const d = new Date(e.date + 'T00:00:00');
        const days = Math.round((d - today) / 86400000);
        cd.append(el('div', { class: 'count-card' }, [
          el('div', { class: 'n', text: days > 0 ? days + ' 天' : days === 0 ? '今天！' : '已結束' }),
          el('div', { class: 'l', text: `${e.name}　${e.date}` }),
        ]));
      }
    }
  }

  window.CV = {
    CHAPTERS, $, $$, el, fmt, int, cssVar, tex, matrix, setupCanvas, onRedraw, pointer, rng, gauss,
    bindRange, renderMath, isDark,
  };

  document.addEventListener('DOMContentLoaded', () => {
    buildTopbar();
    buildHome();
    initQuizzes();
    initSteps();
    buildToc();
  });
  // KaTeX 以 defer 載入，等全部載完再渲染
  window.addEventListener('load', () => { renderMath(); initHighlighter(); });
})();
