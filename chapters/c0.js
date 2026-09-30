/* C0 互動元件 */
(function () {
  'use strict';
  const { $, el, fmt, cssVar, tex, setupCanvas, onRedraw, bindRange } = CV;

  /* ===== 四大任務 ===== */
  (function tasks() {
    const W = 20, H = 14;
    // 0 背景、1 桌面、2 蘋果、3 蒂頭、4 杯子
    const img = [];
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        let v = y >= 11 ? 1 : 0;
        if ((x - 6) ** 2 + (y - 7.3) ** 2 <= 3.6 ** 2) v = 2;
        if (x >= 12 && x <= 16 && y >= 5 && y <= 11) v = 4;
        row.push(v);
      }
      img.push(row);
    }
    img[3][6] = 3; img[2][7] = 3;
    [[7, 17], [7, 18], [8, 18], [9, 18], [9, 17]].forEach(([y, x]) => { img[y][x] = 4; });
    const PAL = { 0: '#ece6d8', 1: '#c9b48e', 2: '#d8453b', 3: '#6b4a2b', 4: '#5b8fd6' };
    const OBJ = {
      apple: { name: '蘋果', ids: [2, 3], color: '#ff3b30' },
      cup: { name: '杯子', ids: [4], color: '#0a84ff' },
    };
    function bbox(ids) {
      let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (ids.includes(img[y][x])) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); n++; }
      }
      return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, n };
    }
    const bb = { apple: bbox(OBJ.apple.ids), cup: bbox(OBJ.cup.ids) };

    const MODES = [
      ['cls', '圖像分類'], ['loc', '物件定位'], ['det', '物件偵測'], ['seg', '圖像分割'],
    ];
    let mode = 'cls';
    const seg = $('#task-seg');
    const btns = MODES.map(([k, label]) => {
      const b = el('button', { class: 'btn', type: 'button', text: label, 'aria-pressed': String(k === mode) });
      b.addEventListener('click', () => { mode = k; btns.forEach((x, i) => x.setAttribute('aria-pressed', String(MODES[i][0] === mode))); draw(); });
      seg.append(b);
      return b;
    });
    const canvas = $('#task-canvas');
    const out = $('#task-out');

    function chip(ctx, x, y, text, color) {
      ctx.font = 'bold 14px system-ui, sans-serif';
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 20, tw + 12, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, x + 6, y - 5);
    }
    function box(ctx, c, b, o) {
      ctx.strokeStyle = o.color; ctx.lineWidth = 3;
      ctx.strokeRect(b.x * c + 1.5, b.y * c + 1.5, b.w * c - 3, b.h * c - 3);
      chip(ctx, b.x * c, b.y * c, o.name, o.color);
    }

    function draw() {
      const { ctx, w } = setupCanvas(canvas, H / W);
      const c = w / W;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        ctx.fillStyle = PAL[img[y][x]];
        ctx.fillRect(x * c, y * c, c + 0.5, c + 0.5);
      }
      if (mode === 'cls') {
        chip(ctx, 8, 28, '類別：蘋果（機率 0.91）', '#333');
        out.innerHTML = '<strong>輸出：一個類別標籤</strong>「蘋果」。只回答「這張圖是什麼」，不告訴你在哪裡。<br><span class="muted">注意：圖裡其實有兩個東西，但分類只會交出一個答案。</span>';
      } else if (mode === 'loc') {
        box(ctx, c, bb.apple, OBJ.apple);
        const b = bb.apple;
        out.innerHTML = `<strong>輸出：類別 ＋ 一個框</strong>　蘋果 @ (x=${b.x}, y=${b.y}, w=${b.w}, h=${b.h})<br><span class="muted">只框出主要物體；杯子沒有被處理。</span>`;
      } else if (mode === 'det') {
        box(ctx, c, bb.apple, OBJ.apple);
        box(ctx, c, bb.cup, OBJ.cup);
        out.innerHTML = '<strong>輸出：多個類別 ＋ 多個框</strong><br>' +
          ['apple', 'cup'].map((k) => `${OBJ[k].name} @ (x=${bb[k].x}, y=${bb[k].y}, w=${bb[k].w}, h=${bb[k].h})`).join('<br>') +
          '<br><span class="muted">圖中「所有」物體都被找出來了，但框裡仍包含一些背景像素。</span>';
      } else {
        const tint = { 2: 'rgba(255,59,48,.75)', 3: 'rgba(255,59,48,.75)', 4: 'rgba(10,132,255,.75)', 0: 'rgba(120,120,120,.35)', 1: 'rgba(120,120,120,.35)' };
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          ctx.fillStyle = tint[img[y][x]];
          ctx.fillRect(x * c, y * c, c + 0.5, c + 0.5);
        }
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
        for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x * c, 0); ctx.lineTo(x * c, H * c); ctx.stroke(); }
        for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0, y * c); ctx.lineTo(W * c, y * c); ctx.stroke(); }
        const total = W * H;
        out.innerHTML = `<strong>輸出：每個像素的類別</strong>（共 ${total} 個像素）<br>` +
          `<span style="color:#ff3b30">■</span> 蘋果 ${bb.apple.n} px　<span style="color:#0a84ff">■</span> 杯子 ${bb.cup.n} px　<span class="muted">■</span> 背景 ${total - bb.apple.n - bb.cup.n} px` +
          '<br><span class="muted">不是畫框，而是逐格上色；連杯子的把手形狀都精確標出來了。</span>';
      }
    }
    onRedraw(draw);
  })();

  /* ===== 手寫規則 ===== */
  (function rules() {
    const d = $('#r-d'), c = $('#r-c'), s = $('#r-s');
    const svg = $('#r-svg'), out = $('#r-out');
    let truth = '蘋果', ball = false;
    const COLORS = { red: '#d8453b', green: '#7cbf3a', yellow: '#e8c02c' };
    const CN = { red: '紅色', green: '綠色', yellow: '黃色', round: '圓形', oval: '橢圓', square: '方形' };

    function render() {
      const dia = Number(d.value);
      const r = dia * 7.4;
      const fill = COLORS[c.value];
      let shape;
      if (s.value === 'round') shape = `<circle cx="70" cy="74" r="${r}" fill="${fill}"/>`;
      else if (s.value === 'oval') shape = `<ellipse cx="70" cy="74" rx="${r * 0.75}" ry="${r}" fill="${fill}"/>`;
      else shape = `<rect x="${70 - r * 0.9}" y="${74 - r * 0.9}" width="${r * 1.8}" height="${r * 1.8}" rx="6" fill="${fill}"/>`;
      const top = s.value === 'square' ? 74 - r * 0.9 : 74 - r;
      const stem = ball ? `<circle cx="${70 - r * 0.35}" cy="${74 - r * 0.35}" r="${r * 0.18}" fill="#fff" opacity=".6"/>`
        : `<path d="M70 ${top + 4} q2 -12 8 -16" stroke="#6b4a2b" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="82" cy="${top - 10}" rx="8" ry="4" fill="#4d9a3a" transform="rotate(-25 82 ${top - 10})"/>`;
      svg.innerHTML = shape + stem;

      const checks = [
        ['直徑 5～5.1 公分', dia >= 5 && dia <= 5.1, `${fmt(dia, 2)} cm`],
        ['顏色：紅色', c.value === 'red', CN[c.value]],
        ['形狀：圓形', s.value === 'round', CN[s.value]],
      ];
      const pass = checks.every((x) => x[1]);
      let html = checks.map(([k, ok, v]) => `<div>${ok ? '<span class="good">✓</span>' : '<span class="bad">✗</span>'} ${k}　<span class="muted">（目前：${v}）</span></div>`).join('');
      html += `<div style="margin-top:6px">規則判斷：<span class="big">${pass ? '🍎 蘋果' : '不是蘋果'}</span></div>`;
      if (truth) {
        const ruleRight = (truth === '蘋果') === pass;
        html += `<div>實際上：${truth}　→ ${ruleRight ? '<span class="good">規則判斷正確</span>' : '<span class="bad">規則判斷錯誤</span>'}</div>`;
        if (!ruleRight && truth === '蘋果') html += '<div class="muted">規則寫得太死，稍微不一樣的蘋果就認不出來。要涵蓋所有蘋果，規則會越寫越多、越寫越複雜。</div>';
        if (!ruleRight && truth !== '蘋果') html += '<div class="muted">三條規則全都符合，但它根本不是蘋果：人工挑的特徵不夠分辨。這就是現代 CV 讓模型自己從大量圖片學特徵的原因。</div>';
      }
      out.innerHTML = html;
    }
    const manual = () => { truth = null; ball = false; render(); };
    bindRange(d, () => {}, (v) => fmt(v, 2));
    d.addEventListener('input', manual);
    c.addEventListener('change', manual);
    s.addEventListener('change', manual);
    document.querySelectorAll('#w-rules [data-preset]').forEach((b) => {
      b.addEventListener('click', () => {
        const [dv, cv, sv, kind] = b.dataset.preset.split(',');
        d.value = dv; c.value = cv; s.value = sv;
        d.dispatchEvent(new Event('input'));
        ball = kind === 'ball';
        truth = ball ? '紅色小球' : '蘋果';
        render();
      });
    });
    render();
  })();

  /* ===== 成績計算器 ===== */
  (function grade() {
    const items = [
      ['M', '期中考', 0.2, 70], ['F', '期末考', 0.2, 80], ['E', '課堂練習', 0.3, 90],
      ['P', '期末專題', 0.2, 85], ['A', '出席', 0.1, 100],
    ];
    const box = $('#grade-ctrls'), out = $('#grade-out');
    const inputs = items.map(([k, name, , def]) => {
      const inp = el('input', { type: 'range', min: '0', max: '100', step: '1', value: String(def), id: 'g-' + k });
      box.append(el('label', {}, [`${name}`, inp, el('span', { class: 'val', 'data-for': 'g-' + k })]));
      return inp;
    });
    function calc() {
      const vals = inputs.map((i) => Number(i.value));
      const parts = items.map(([, , w], i) => w * vals[i]);
      const total = parts.reduce((a, b) => a + b, 0);
      out.innerHTML = '<div id="g-tex"></div><div>學期總成績：<span class="big">' + fmt(total, 2) + '</span> 分</div>';
      tex($('#g-tex'), items.map(([, , w], i) => `${w}(${vals[i]})`).join('+') + '=' + parts.map((p) => fmt(p, 2)).join('+') + '=' + fmt(total, 2), true);
    }
    inputs.forEach((i) => bindRange(i, calc));
  })();
})();
