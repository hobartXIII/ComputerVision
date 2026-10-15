/* C5 互動元件 */
(function () {
  'use strict';
  const { $, $$, el, fmt, int, cssVar, setupCanvas, onRedraw, bindRange, pointer } = CV;

  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function svgRoot(W, H, label, maxW = 640) {
    return svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'plot', role: 'img', 'aria-label': label, style: `max-width:${maxW}px;margin:0 auto` });
  }
  const svgText = (x, y, s, style = '', anchor = 'middle') => svgEl('text', { x, y, 'text-anchor': anchor, style: 'fill:var(--text);font-size:12px;' + style }, s);
  const svgBox = (x, y, w, h, fill, extra = '') => svgEl('rect', { x, y, width: w, height: h, rx: 5, style: `fill:${fill};stroke:var(--border);stroke-width:1;${extra}` });
  const svgLine = (x1, y1, x2, y2, style) => svgEl('line', { x1, y1, x2, y2, style });
  const ok = (s) => `<div class="good" style="margin-top:6px">✓ ${s}</div>`;
  const posInt = (input, min = 1) => Math.max(min, Math.round(Number(input.value) || 0));
  const big = (n) => (n >= 1e6 ? fmt(n / 1e6, 2) + 'M' : n >= 1e3 ? fmt(n / 1e3, 1) + 'K' : String(n));
  const mb = (bytes) => fmt(bytes / 1e6, 1) + ' MB';
  const pct = (a, b) => {
    const p = (100 * a) / b;
    return (p < 10 ? fmt(p, 2) : fmt(p, 1)) + '%';
  };
  function bindSeg(attr, onPick) {
    const btns = $$(`[data-${attr}]`);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onPick(b.dataset[attr]);
    }));
  }
  const FROZEN = 'color-mix(in srgb, var(--text-2) 16%, var(--surface))';
  const TRAIN = 'color-mix(in srgb, var(--accent) 30%, var(--surface))';
  const PARTIAL = 'color-mix(in srgb, var(--pos) 26%, var(--surface))';

  // ResNet-50 各段參數（含 BN），逐層算出來，合計應為 25,557,032
  const RESNET50 = (function () {
    const stages = [{ name: 'Stem', total: 7 * 7 * 3 * 64 + 2 * 64, bn: 2 * 64 }];
    let cin = 64;
    [[3, 64], [4, 128], [6, 256], [3, 512]].forEach(([n, m], i) => {
      let total = 0, bn = 0;
      for (let b = 0; b < n; b++) {
        const conv = cin * m + 9 * m * m + m * 4 * m + (b === 0 ? cin * 4 * m : 0);
        const bnp = 2 * (m + m + 4 * m) + (b === 0 ? 2 * 4 * m : 0);
        total += conv + bnp; bn += bnp; cin = 4 * m;
      }
      stages.push({ name: `Layer${i + 1}`, total, bn });
    });
    return { stages, feat: cin, fc1000: cin * 1000 + 1000 };
  })();

  /* ===== 微調策略比較 ===== */
  (function strategies() {
    const kIn = $('#st-k'), nIn = $('#st-n'), optIn = $('#st-opt');
    let strat = 'fe';
    const NAMES = { fe: '特徵提取', lastk: 'Last-k', bn: '只更新 BN', full: 'Full FT', l2sp: 'L2-SP' };
    function upd() {
      const k = Number(kIn.value), nCls = posInt(nIn, 2), s = Number(optIn.value);
      kIn.disabled = strat !== 'lastk';
      const head = RESNET50.feat * nCls + nCls;
      const st = RESNET50.stages;
      const backbone = st.reduce((a, x) => a + x.total, 0);
      const P = backbone + head;
      // 每段的可訓練參數
      const train = st.map((x, i) => {
        if (strat === 'full' || strat === 'l2sp') return x.total;
        if (strat === 'lastk') return i >= st.length - k ? x.total : 0;
        if (strat === 'bn') return x.bn;
        return 0;
      });
      const T = train.reduce((a, b) => a + b, 0) + head;

      // 示意圖
      const W = 640, H = strat === 'l2sp' ? 230 : 196;
      const svg = svgRoot(W, H, '微調策略示意圖');
      const y0 = strat === 'l2sp' ? 70 : 36, bh = 58;
      const items = [{ name: '輸入影像', total: 0, img: true }, ...st.map((x, i) => ({ name: x.name, total: x.total, t: train[i], bn: x.bn })), { name: `新 head（${nCls} 類）`, total: head, t: head, head: true }];
      const n = items.length, gap = 8, bw = (W - gap * (n + 1)) / n;
      const centers = [];
      items.forEach((it, i) => {
        const x = gap + i * (bw + gap), cx = x + bw / 2;
        centers.push(cx);
        let fill = FROZEN, tag = '凍結 🔒';
        if (it.img) { fill = 'var(--surface-2)'; tag = ''; }
        else if (it.t === it.total) { fill = TRAIN; tag = '可訓練'; }
        else if (it.t > 0) { fill = PARTIAL; tag = '只 BN'; }
        svg.append(svgBox(x, y0, bw, bh, fill, it.t ? 'stroke:var(--accent);stroke-width:1.5' : ''));
        svg.append(svgText(cx, y0 + 19, it.head ? '新 head' : it.name, 'font-size:11.5px;font-weight:700'));
        if (!it.img) svg.append(svgText(cx, y0 + 35, big(it.total), 'font-size:11px;font-family:var(--mono)'));
        svg.append(svgText(cx, y0 + 50, it.head ? `${nCls} 類` : tag, `font-size:10px;fill:${it.t ? 'var(--accent)' : 'var(--text-2)'}`));
        if (i < n - 1) svg.append(svgLine(x + bw, y0 + bh / 2, x + bw + gap, y0 + bh / 2, 'stroke:var(--text-2);stroke-width:1'));
      });
      // 優化器狀態：只連到可訓練的部分
      const oy = y0 + bh + 46;
      svg.append(svgBox(W / 2 - 110, oy, 220, 30, 'var(--accent-soft)'));
      svg.append(svgText(W / 2, oy + 19, s ? `優化器狀態（每個可訓練參數 ${s} 份）` : '優化器：SGD 不需額外狀態', 'font-size:11.5px;font-weight:600'));
      items.forEach((it, i) => {
        if (it.t) svg.append(svgLine(centers[i], y0 + bh, W / 2 + (centers[i] - W / 2) * 0.35, oy, `stroke:var(--accent);stroke-width:1;${s ? '' : 'stroke-dasharray:3 3'}`));
      });
      if (strat === 'l2sp') {
        svg.append(svgBox(W / 2 - 150, 8, 300, 30, 'color-mix(in srgb, var(--c-c) 22%, var(--surface))'));
        svg.append(svgText(W / 2, 27, '預訓練權重 w⁰（固定，作為參考點）', 'font-size:11.5px;font-weight:600'));
        items.forEach((it, i) => {
          if (i === 0 || it.head) return;
          svg.append(svgLine(W / 2 + (centers[i] - W / 2) * 0.4, 38, centers[i], y0, 'stroke:var(--c-c);stroke-width:1.2;stroke-dasharray:4 3'));
        });
        svg.append(svgText(centers[n - 1], y0 - 8, '一般 L2', 'font-size:10px;fill:var(--text-2)'));
      }
      const box = $('#st-svg'); box.innerHTML = ''; box.append(svg);

      // 數字
      const wB = 4 * P, gB = 4 * T, oB = 4 * s * T, w0B = strat === 'l2sp' ? 4 * backbone : 0;
      const tot = wB + gB + oB + w0B;
      const fullTot = 4 * P * (2 + s);
      let html = `<strong>${NAMES[strat]}${strat === 'lastk' ? `（k = ${k}）` : ''}</strong>：可訓練 <span class="big">${int(T)}</span> 個參數，佔全部 ${int(P)} 的 <strong>${pct(T, P)}</strong>。<br>`;
      html += `<span class="muted" style="font-size:.9rem">新 head：\\((${RESNET50.feat}+1)\\times${nCls}=${int(head)}\\)；原本 1000 類的 head（${int(RESNET50.fc1000)}）已拿掉。</span><br>`;
      html += `記憶體 ≈ 權重 ${mb(wB)} ＋ 梯度 ${mb(gB)} ＋ 優化器狀態 ${mb(oB)}${w0B ? ` ＋ w⁰ 副本 ${mb(w0B)}` : ''} ＝ <strong>${mb(tot)}</strong>（Full FT 為 ${mb(fullTot)}，不含激活值）`;
      const NOTE = {
        fe: '凍結整個卷積基底，只訓練新 head。這也是微調的第一步：先把隨機初始化的 head 訓練好，再解凍。',
        lastk: `解凍最後 ${k} 個 block（k 不含 head）。凍結的 block 裡有 BN，要另外設成 eval 模式。越後面的 block 參數越多：k = 1 就已經是 ${pct(train[st.length - 1] + head, P)}。`,
        bn: `依參數類型選擇：只更新 BN 的 \\(\\gamma,\\beta\\)（共 ${int(st.reduce((a, x) => a + x.bn, 0))} 個）和新 head，其他權重凍結。`,
        full: '全部參數都可以改：適應能力最大，但記憶體最高、資料少時容易 overfit。要先訓練 head 再解凍、用很小的學習率。',
        l2sp: '可訓練參數和 Full FT 一樣多，另外還要存一份 w⁰；靠懲罰項 \\(\\frac{\\alpha}{2}\\lVert w-w^0\\rVert^2\\) 限制不要離預訓練值太遠。optimizer 不要再設 weight_decay。',
      };
      html += `<div style="margin-top:6px">${NOTE[strat]}</div>`;
      if (nCls === 10 && s === 2) {
        if (strat === 'fe') html += ok('特徵提取：20,490（0.09%），記憶體約 94.4 MB，和 4.1、4.2 相同');
        if (strat === 'lastk' && k === 1) html += ok('Last-k（k = 1）：14,985,226（63.7%），和 4.1 的逐步展開相同');
        if (strat === 'lastk' && k === 2) html += ok('Last-k（k = 2）：22,083,594（93.9%）');
        if (strat === 'full') html += ok('Full FT：23,528,522，Adam 下約 376 MB');
      }
      const o = $('#st-out'); o.innerHTML = html; CV.renderMath(o);

      const bars = $('#st-bars'); bars.innerHTML = '';
      [['權重', wB, 'var(--text-2)'], ['梯度', gB, 'var(--c-b)'], ['優化器', oB, 'var(--accent)'], ['w⁰ 副本', w0B, 'var(--c-c)']].forEach(([name, v, color]) => {
        if (name === 'w⁰ 副本' && !v) return;
        bars.append(el('div', { class: 'bar-row', style: 'grid-template-columns:5em 1fr 5.5em' }, [
          el('span', { text: name }),
          el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill', style: `width:${(100 * v) / fullTot}%;background:${color}` })]),
          el('span', { class: 'val', text: mb(v) }),
        ]));
      });
    }
    bindSeg('strat', (v) => { strat = v; upd(); });
    nIn.addEventListener('input', upd);
    optIn.addEventListener('change', upd);
    bindRange(kIn, upd);
  })();

  /* ===== k 怎麼選 ===== */
  (function chooseK() {
    const dIn = $('#k-data'), sIn = $('#k-sim');
    const ADVICE = {
      'few|sim': ['k 小（1～2），甚至只做特徵提取', '資料少，解凍太多容易 overfit；而且和 ImageNet 相似，舊特徵本來就很好用。'],
      'few|diff': ['兩個因素拉扯：先從小 k 開始，逐步加大並看驗證集', '資料少要 k 小、差異大要 k 大。【補充】實務上可搭配 L2-SP 或 PEFT，在「能改」與「不 overfit」之間取平衡。'],
      'many|sim': ['k 可以大一些', '資料夠多，不太怕 overfit，多解凍幾層可以再提升；但因為相似，不一定需要全部解凍。'],
      'many|diff': ['k 大，甚至 Full Fine-tuning', '差異大時，淺層的特徵也可能需要重新適應；資料多也撐得起大量參數。講義：Full FT 在資料夠大時是最強 baseline、domain 差異大時較有調整能力。'],
    };
    function upd() {
      const d = dIn.value, s = sIn.value;
      const cell = (dd, ss) => {
        const on = dd === d && ss === s;
        return `<td style="${on ? 'background:var(--accent-soft);color:var(--accent);font-weight:700' : ''}">${ADVICE[dd + '|' + ss][0]}</td>`;
      };
      $('#k-table').innerHTML = `<table><tr><th></th><th>相似</th><th>差異大</th></tr>
        <tr><th>資料少</th>${cell('few', 'sim')}${cell('few', 'diff')}</tr>
        <tr><th>資料多</th>${cell('many', 'sim')}${cell('many', 'diff')}</tr></table>`;
      const [a, why] = ADVICE[d + '|' + s];
      $('#k-out').innerHTML = `<strong>${a}</strong><div class="muted" style="font-size:.92rem;margin-top:4px">${why}</div>`;
    }
    dIn.addEventListener('change', upd);
    sIn.addEventListener('change', upd);
    upd();
  })();

  /* ===== LoRA 參數量 ===== */
  (function lora() {
    const dIn = $('#lo-d'), kIn = $('#lo-k'), rIn = $('#lo-r'), nIn = $('#lo-n');
    const VIT_B = 86e6, VIT_LAYERS = 12, VIT_D = 768;
    function drawSvg(d, k, r) {
      const W = 640, H = 210, maxS = 150;
      const sc = maxS / Math.max(d, k);
      const wd = Math.max(k * sc, 8), hd = Math.max(d * sc, 8);
      const rw = Math.max(r * sc, 3);
      const svg = svgRoot(W, H, 'LoRA 矩陣大小示意');
      const y = 24;
      let x = 14;
      const block = (bx, by, w, h, fill, label, sub) => {
        svg.append(svgEl('rect', { x: bx, y: by, width: w, height: h, rx: 2, style: `fill:${fill};stroke:var(--border)` }));
        svg.append(svgText(bx + w / 2, y + maxS + 22, label, 'font-size:12px;font-weight:700'));
        svg.append(svgText(bx + w / 2, y + maxS + 38, sub, 'font-size:10.5px;fill:var(--text-2);font-family:var(--mono)'));
      };
      block(x, y, wd, hd, FROZEN, 'W₀ 凍結', `${d}×${k}`);
      x += wd + 14; svg.append(svgText(x + 6, y + hd / 2 + 5, '+', 'font-size:20px;fill:var(--text-2)')); x += 24;
      block(x, y, rw, hd, 'var(--c-a)', 'B', `${d}×${r}`);
      x += rw + 8; svg.append(svgText(x + 5, y + hd / 2 + 5, '×', 'font-size:16px;fill:var(--text-2)')); x += 18;
      block(x, y, wd, rw, 'var(--c-b)', 'A', `${r}×${k}`);
      x += wd + 14; svg.append(svgText(x + 6, y + hd / 2 + 5, '=', 'font-size:20px;fill:var(--text-2)')); x += 24;
      svg.append(svgEl('rect', { x, y, width: wd, height: hd, rx: 2, style: 'fill:color-mix(in srgb, var(--c-a) 30%, var(--c-b) 30%);stroke:var(--border);opacity:.8' }));
      svg.append(svgText(x + wd / 2, y + maxS + 22, 'ΔW = BA', 'font-size:12px;font-weight:700'));
      svg.append(svgText(x + wd / 2, y + maxS + 38, `${d}×${k}，秩 ≤ ${r}`, 'font-size:10.5px;fill:var(--text-2);font-family:var(--mono)'));
      if (x + wd > W) svg.setAttribute('viewBox', `0 0 ${x + wd + 10} ${H}`);
      const box = $('#lo-svg'); box.innerHTML = ''; box.append(svg);
    }
    function upd() {
      const d = posInt(dIn), k = posInt(kIn), r = Number(rIn.value), N = Number(nIn.value);
      drawSvg(d, k, r);
      const full = d * k, lo = r * (d + k);
      let html = `原本：\\(d\\times k=${d}\\times${k}=\\) <strong>${int(full)}</strong><br>`;
      html += `LoRA：\\(r(d+k)=${r}\\times(${d}+${k})=\\) <strong>${int(lo)}</strong>（B ${int(d * r)} ＋ A ${int(r * k)}），是原本的 <strong>${pct(lo, full)}</strong>`;
      if (r >= Math.min(d, k) / 2) html += `<div class="bad" style="margin-top:4px">r 已經接近 min(d, k)：LoRA 參數 ${lo >= full ? '比原本還多' : '省不了多少'}，失去省參數的優勢。</div>`;
      if (d === 768 && k === 768 && r === 8) html += ok('講義：約 59 萬（589,824）→ 12,288，約 2%');
      if (d === 1024 && k === 1024 && r === 16) html += ok('自我測驗第 2 題：32,768（約 3.1%）');
      const o = $('#lo-out'); o.innerHTML = html; CV.renderMath(o);

      // 多任務儲存（ViT-Base、Q/K/V/O）
      const perTask = VIT_LAYERS * 4 * r * (2 * VIT_D);
      const fullStore = N * VIT_B, loraStore = VIT_B + N * perTask;
      const bars = $('#lo-bars'); bars.innerHTML = '';
      [['Full FT', fullStore, 'var(--c-a)'], ['LoRA', loraStore, 'var(--pos)']].forEach(([name, v, color]) => {
        bars.append(el('div', { class: 'bar-row', style: 'grid-template-columns:5em 1fr 5.5em' }, [
          el('span', { text: name }),
          el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill', style: `width:${(100 * v) / fullStore}%;background:${color}` })]),
          el('span', { class: 'val', text: fmt(v / 1e6, 1) + 'M' }),
        ]));
      });
      let st = `每個任務的 LoRA：\\(12\\times4\\times${r}\\times(768+768)=${int(perTask)}\\)（不含各任務的 head）<br>`;
      st += `${N} 個任務：Full FT \\(${N}\\times86\\text{M}\\approx\\) <strong>${fmt(fullStore / 1e6, 0)}M</strong>；LoRA \\(86\\text{M}+${N}\\times${fmt(perTask / 1e6, 2)}\\text{M}\\approx\\) <strong>${fmt(loraStore / 1e6, 1)}M</strong>`;
      if (r === 8 && N === 10) st += ok('4.6：約 860M vs 約 92M');
      const s2 = $('#lo-store'); s2.innerHTML = st; CV.renderMath(s2);
    }
    [dIn, kIn].forEach((i) => i.addEventListener('input', upd));
    $$('[data-lo]').forEach((b) => b.addEventListener('click', () => {
      const [d, k, r] = b.dataset.lo.split(',');
      dIn.value = d; kIn.value = k; rIn.value = r;
      rIn.dispatchEvent(new Event('input'));
    }));
    bindRange(rIn, upd);
    bindRange(nIn, upd);
  })();

  /* ===== LoRA 數字例子：初始化與合併 ===== */
  (function merge() {
    const ins = ['b1', 'b2', 'a1', 'a2'].map((k) => $('#mg-' + k));
    const DEF = [0.5, 1, 2, -1];
    const x = [3, 1];
    const f = (v) => fmt(v, 3);
    const mat = (M) => `\\begin{bmatrix}${M.map((r) => r.map(f).join('&')).join('\\\\')}\\end{bmatrix}`;
    function upd() {
      const [b1, b2, a1, a2] = ins.map((i) => Number(i.value));
      const Ax = a1 * x[0] + a2 * x[1];
      const BAx = [b1 * Ax, b2 * Ax];
      const h = [x[0] + BAx[0], x[1] + BAx[1]];
      const BA = [[b1 * a1, b1 * a2], [b2 * a1, b2 * a2]];
      const Wm = [[1 + BA[0][0], BA[0][1]], [BA[1][0], 1 + BA[1][1]]];
      const Wx = [Wm[0][0] * x[0] + Wm[0][1] * x[1], Wm[1][0] * x[0] + Wm[1][1] * x[1]];
      const zero = b1 === 0 && b2 === 0;
      const rank = (b1 === 0 && b2 === 0) || (a1 === 0 && a2 === 0) ? 0 : 1;
      let html = `<div>\\(Ax=${f(a1)}\\times3+(${f(a2)})\\times1=${f(Ax)}\\)　→　\\(BAx=${f(Ax)}\\times(${f(b1)},\\ ${f(b2)})=(${f(BAx[0])},\\ ${f(BAx[1])})\\)</div>`;
      html += `<div>\\(h=W_0x+BAx=(3,\\ 1)+(${f(BAx[0])},\\ ${f(BAx[1])})=\\) <strong>\\((${f(h[0])},\\ ${f(h[1])})\\)</strong></div>`;
      html += `<div style="margin-top:6px">合併：\\(BA=${mat(BA)}\\)（秩 ${rank}），\\(W=W_0+BA=${mat(Wm)}\\)，\\(Wx=(${f(Wx[0])},\\ ${f(Wx[1])})\\)</div>`;
      if (zero) html += ok('B = 0：BA = 0，h = W₀x = (3, 1)，和預訓練模型完全相同（LoRA 的初始化）');
      else if ([b1, b2, a1, a2].every((v, i) => v === DEF[i])) html += ok('講義式的例子：h = (5.5, 6)，合併後 Wx 也是 (5.5, 6)，推論只要一次矩陣乘法');
      else html += '<div class="muted" style="margin-top:4px;font-size:.9rem">不論 B、A 怎麼調，合併後的 Wx 都和 W₀x + BAx 相同。</div>';
      const o = $('#mg-out'); o.innerHTML = html; CV.renderMath(o);
    }
    ins.forEach((i) => bindRange(i, upd));
    $('#mg-zero').addEventListener('click', () => { ins[0].value = 0; ins[1].value = 0; ins.forEach((i) => i.dispatchEvent(new Event('input'))); });
    $('#mg-reset').addEventListener('click', () => { ins.forEach((i, j) => { i.value = DEF[j]; i.dispatchEvent(new Event('input')); }); });
  })();

  /* ===== L2-SP vs Weight Decay ===== */
  (function l2sp() {
    const aIn = $('#sp-a'), wdIn = $('#sp-wd'), canvas = $('#sp-canvas');
    const W0 = [2, 1];
    const DEF = [3, 3];
    let ws = DEF.slice();
    const XR = [-0.5, 4.5], YR = [-0.5, 3.5];
    let geo = null;
    function draw() {
      const { ctx, w, h } = setupCanvas(canvas, 0.6);
      const pad = 16;
      const s = Math.min((w - 2 * pad) / (XR[1] - XR[0]), (h - 2 * pad) / (YR[1] - YR[0]));
      const ox = (w - s * (XR[1] - XR[0])) / 2, oy = (h - s * (YR[1] - YR[0])) / 2;
      const X = (v) => ox + (v - XR[0]) * s, Y = (v) => h - oy - (v - YR[0]) * s;
      geo = { X, Y, s, ox, oy, h };
      const a = Number(aIn.value);
      const sp = [(ws[0] + a * W0[0]) / (1 + a), (ws[1] + a * W0[1]) / (1 + a)];
      const wd = [ws[0] / (1 + a), ws[1] / (1 + a)];
      const C = { text: cssVar('--text'), text2: cssVar('--text-2'), border: cssVar('--border'), a: cssVar('--c-a'), b: cssVar('--c-b'), c: cssVar('--c-c'), pos: cssVar('--pos') };
      // 格線與軸
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        ctx.beginPath(); ctx.moveTo(X(g), Y(YR[0])); ctx.lineTo(X(g), Y(YR[1])); ctx.stroke();
        if (g <= 3) { ctx.beginPath(); ctx.moveTo(X(XR[0]), Y(g)); ctx.lineTo(X(XR[1]), Y(g)); ctx.stroke(); }
      }
      ctx.strokeStyle = C.text2; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(X(XR[0]), Y(0)); ctx.lineTo(X(XR[1]), Y(0)); ctx.moveTo(X(0), Y(YR[0])); ctx.lineTo(X(0), Y(YR[1])); ctx.stroke();
      ctx.fillStyle = C.text2; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
      for (let g = 1; g <= 4; g++) ctx.fillText(String(g), X(g), Y(0) + 14);
      ctx.textAlign = 'right';
      for (let g = 1; g <= 3; g++) ctx.fillText(String(g), X(0) - 5, Y(g) + 4);
      // task loss 等高線（以 w* 為中心）
      ctx.save(); ctx.strokeStyle = C.a; ctx.globalAlpha = 0.35; ctx.setLineDash([4, 4]);
      [0.5, 1, 1.5, 2].forEach((r) => { ctx.beginPath(); ctx.arc(X(ws[0]), Y(ws[1]), r * s, 0, Math.PI * 2); ctx.stroke(); });
      ctx.restore();
      // 連線
      const seg = (p, q, color) => { ctx.save(); ctx.setLineDash([2, 4]); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(p[0]), Y(p[1])); ctx.lineTo(X(q[0]), Y(q[1])); ctx.stroke(); ctx.restore(); };
      seg(ws, W0, C.pos);
      if (wdIn.checked) seg(ws, [0, 0], C.c);
      const dot = (p, color, label, r = 6, ring = false) => {
        ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), r, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        if (ring) { ctx.strokeStyle = C.text; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.fillStyle = C.text; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(label, X(p[0]) + 9, Y(p[1]) - 7);
      };
      dot([0, 0], C.text2, '0', 4);
      dot(W0, C.b, 'w⁰ 預訓練');
      if (wdIn.checked) dot(wd, C.c, 'weight decay', 6, true);
      dot(sp, C.pos, 'L2-SP', 6, true);
      dot(ws, C.a, 'w* 只看新資料（拖我）', 7);
      return { a, sp, wd };
    }
    function upd() {
      const { a, sp, wd } = draw();
      const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
      const f = (v) => fmt(v, 2);
      let html = `L2-SP 最佳解 \\(\\dfrac{w^*+\\alpha w^0}{1+\\alpha}=\\dfrac{(${f(ws[0])},\\ ${f(ws[1])})+${f(a)}\\times(2,\\ 1)}{1+${f(a)}}=\\) <strong class="good">(${f(sp[0])}, ${f(sp[1])})</strong>，離 \\(w^0\\) ${f(d(sp, W0))}<br>`;
      html += `Weight decay 最佳解 \\(\\dfrac{w^*}{1+\\alpha}=\\) <strong>(${f(wd[0])}, ${f(wd[1])})</strong>，離 \\(w^0\\) ${f(d(wd, W0))}<br>`;
      html += `<span class="muted" style="font-size:.9rem">α 越大，L2-SP 越靠近 \\(w^0\\)（保留預訓練知識）；weight decay 則越往原點縮，連預訓練學到的值也一起丟掉。α = 0 時兩者都等於 \\(w^*\\)（可能 overfit 新資料）。</span>`;
      if (a === 1 && ws[0] === 3 && ws[1] === 3) html += ok('預設：L2-SP (2.5, 2)、weight decay (1.5, 1.5)');
      const o = $('#sp-out'); o.innerHTML = html; CV.renderMath(o);
    }
    // 拖曳 w*
    let dragging = false;
    const toData = (ev) => {
      const p = pointer(canvas, ev);
      const xv = XR[0] + (p.x - geo.ox) / geo.s, yv = YR[0] + (geo.h - geo.oy - p.y) / geo.s;
      const snap = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v * 10) / 10));
      return [snap(xv, XR[0], XR[1]), snap(yv, YR[0], YR[1])];
    };
    canvas.addEventListener('pointerdown', (ev) => {
      if (!geo) return;
      const p = pointer(canvas, ev);
      if (Math.hypot(p.x - geo.X(ws[0]), p.y - geo.Y(ws[1])) > 28) return;
      dragging = true; canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove', (ev) => { if (dragging) { ws = toData(ev); upd(); } });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
    wdIn.addEventListener('change', upd);
    $('#sp-reset').addEventListener('click', () => { ws = DEF.slice(); aIn.value = 1; aIn.dispatchEvent(new Event('input')); });
    bindRange(aIn, upd);
    onRedraw(upd);
  })();
})();
