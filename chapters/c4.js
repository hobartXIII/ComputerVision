/* C4 互動元件 */
(function () {
  'use strict';
  const { $, $$, el, fmt, int, cssVar, setupCanvas, onRedraw, bindRange } = CV;

  // 座標框：xr、yr 為資料範圍，pad 為四周留白（CSS 像素）
  function frame(canvas, aspect, xr, yr, pad = [14, 14, 14, 14]) {
    const { ctx, w, h } = setupCanvas(canvas, aspect);
    const [pt, pr, pb, pl] = pad;
    const sx = (w - pl - pr) / (xr[1] - xr[0]), sy = (h - pt - pb) / (yr[1] - yr[0]);
    return {
      ctx, w, h,
      X: (x) => pl + (x - xr[0]) * sx,
      Y: (y) => h - pb - (y - yr[0]) * sy,
    };
  }
  function line(ctx, x1, y1, x2, y2, color, width = 1.5, dash = []) {
    ctx.save(); ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function poly(ctx, pts, color, width = 2, dash = []) {
    ctx.save(); ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke(); ctx.restore();
  }
  function dot(ctx, x, y, r, fill) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  }
  function colors() {
    return { a: cssVar('--c-a'), b: cssVar('--c-b'), c: cssVar('--c-c'), text: cssVar('--text'), text2: cssVar('--text-2'), border: cssVar('--border'), accent: cssVar('--accent'), pos: cssVar('--pos'), neg: cssVar('--neg') };
  }
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
  const posInt = (input, min = 1) => Math.max(min, Math.round(Number(input.value) || 0));
  const big = (n) => (n >= 1e6 ? fmt(n / 1e6, 1) + 'M' : n >= 1e3 ? fmt(n / 1e3, 1) + 'K' : String(n));
  const sci = (v) => {
    if (v >= 1e3 && v < 1e5) return int(v);
    if (v === 0 || (v >= 1e-3 && v < 1e5)) return fmt(v, 4);
    const [m, e] = v.toExponential(2).split('e');
    return `${m} × 10<sup>${Number(e)}</sup>`;
  };
  const ok = (s) => `<div class="good" style="margin-top:6px">✓ ${s}</div>`;
  function bindSeg(attr, onPick) {
    const btns = $$(`[data-${attr}]`);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onPick(b.dataset[attr]);
    }));
  }

  /* ===== 卷積三數字（逐步代入） ===== */
  (function conv3() {
    const ins = ['n', 'ci', 'k', 'p', 's', 'co'].map((k) => $('#c3-' + k));
    function upd() {
      const [n, ci, k, p, s, co] = ins.map((i, j) => posInt(i, j === 3 ? 0 : 1));
      const num = n - k + 2 * p, o = Math.floor(num / s) + 1;
      if (num < 0) { $('#c3-out').innerHTML = '<span class="bad">kernel 比（補過 padding 的）輸入還大，沒有輸出。</span>'; return; }
      const per = k * k * ci, params = (per + 1) * co, vals = o * o * co, mult = vals * per;
      const step = (title, body, why) => `<li style="margin:.4em 0"><strong>${title}</strong>：<span class="mono" style="font-size:.9rem">${body}</span>${why ? `<div class="muted" style="font-size:.88rem">${why}</div>` : ''}</li>`;
      let html = '<ol style="margin:0;padding-left:0;list-style:none">';
      html += step('① 輸出尺寸', `⌊(${n} − ${k} + 2×${p}) ÷ ${s}⌋ + 1 = ⌊${num} ÷ ${s}⌋ + 1 = ${o}　→ 輸出 ${o}×${o}×${co}`,
        num % s ? `${num} ÷ ${s} 不整除，向下取整：最後一步走不滿，就不算。` : (o === n ? '輸出和輸入一樣大：這就是 same padding。' : ''));
      html += step('② 一個 filter 的權重', `${k}×${k}×${ci} = ${int(per)}（＋1 bias = ${int(per + 1)}）`, `filter 的深度一定等於輸入通道數 ${ci}。`);
      html += step('③ 參數量', `${int(per + 1)} × ${co} = ${int(params)}`, `${co} 個 filter。注意這一步沒有用到輸入大小 ${n}。`);
      html += step('④ 輸出有幾個數字', `${o}×${o}×${co} = ${int(vals)}`);
      html += step('⑤ 每個數字乘幾次', `${k}×${k}×${ci} = ${int(per)}`, 'filter 蓋住多少個數字，就要乘幾次。');
      html += step('⑥ 乘法次數', `${int(vals)} × ${int(per)} = ${int(mult)}（約 ${big(mult)}）`);
      html += '</ol>';
      const key = [n, ci, k, p, s, co].join(',');
      const CHECK = {
        '12,3,5,0,1,128': '講義：輸出 8×8×128、一般卷積 614,400 次乘法',
        '28,192,5,2,1,32': '講義：直接 5×5 約 120M（120,422,400）',
        '28,192,1,0,1,16': '講義：1×1 瓶頸約 2.4M（2,408,448）',
        '224,3,3,1,1,64': 'VGG 第一層 1,792 個參數，和 2.3 元件的表格一致',
        '32,1,5,0,1,6': 'LeNet Conv1：28×28×6、156 個參數，和 4.8 的表格一致',
      };
      if (CHECK[key]) html += ok(CHECK[key]);
      $('#c3-out').innerHTML = html;
    }
    ins.forEach((i) => i.addEventListener('input', upd));
    $$('[data-c3]').forEach((b) => b.addEventListener('click', () => {
      b.dataset.c3.split(',').forEach((v, j) => { ins[j].value = v; });
      upd();
    }));
    upd();
  })();

  /* ===== VGG 逐段參數量 ===== */
  (function vgg() {
    const CFG = { 16: [2, 2, 3, 3, 3], 19: [2, 2, 4, 4, 4] };
    const CH = [64, 128, 256, 512, 512];
    let ver = '16';
    const gapIn = $('#vgg-gap');
    function upd() {
      const useGap = gapIn.checked;
      const rows = [];
      let c = 3, s = 224;
      CFG[ver].forEach((n, b) => {
        let p = 0, how = [];
        for (let i = 0; i < n; i++) { p += (9 * c + 1) * CH[b]; how.push(`(3×3×${c}+1)×${CH[b]}`); c = CH[b]; }
        rows.push([`Block ${b + 1}：${n}× Conv`, `${s}×${s}×${CH[b]}`, how.length > 2 ? `${how[0]} ＋ ${n - 1}×${how[1]}` : how.join(' ＋ '), p, 'conv']);
        s /= 2;
        rows.push(['Max Pool', `${s}×${s}×${CH[b]}`, '2×2, stride 2', 0, 'pool']);
      });
      const flat = s * s * c;
      if (useGap) {
        rows.push(['GAP', `1×1×${c}`, '每張特徵圖取平均', 0, 'pool']);
        rows.push(['FC（輸出）', '1000', `(${c}+1)×1000`, (c + 1) * 1000, 'fc']);
      } else {
        rows.push(['Flatten', int(flat), `${s}×${s}×${c}`, 0, 'pool']);
        rows.push(['FC1', '4096', `(${int(flat)}+1)×4096`, (flat + 1) * 4096, 'fc']);
        rows.push(['FC2', '4096', '(4096+1)×4096', 4097 * 4096, 'fc']);
        rows.push(['FC3（輸出）', '1000', '(4096+1)×1000', 4097 * 1000, 'fc']);
      }
      const total = rows.reduce((a, r) => a + r[3], 0);
      const conv = rows.filter((r) => r[4] === 'conv').reduce((a, r) => a + r[3], 0);
      const pct = (p) => fmt((100 * p) / total, 1) + '%';
      let html = '<table><tr><th>層</th><th>輸出</th><th>怎麼算</th><th class="num">參數量</th><th class="num">占比</th></tr>';
      rows.forEach(([name, shape, how, p, kind]) => {
        html += `<tr${kind === 'pool' ? ' class="muted"' : ''}><td>${name}</td><td class="mono">${shape}</td><td class="mono" style="font-size:.82rem">${how}</td><td class="num">${int(p)}</td><td class="num">${p ? pct(p) : '—'}</td></tr>`;
      });
      html += `<tr><td><strong>合計</strong></td><td></td><td></td><td class="num"><strong>${int(total)}</strong></td><td class="num">100%</td></tr></table>`;
      $('#vgg-table').innerHTML = html;
      const bars = $('#vgg-bars'); bars.innerHTML = '';
      rows.filter((r) => r[3] > 0).forEach(([name, , , p, kind]) => {
        bars.append(el('div', { class: 'bar-row', style: 'grid-template-columns:7.5em 1fr 4.5em' }, [
          el('span', { text: name.replace('：', ' ').replace('（輸出）', ''), style: 'font-size:.82rem' }),
          el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill', style: `width:${(100 * p) / total}%;background:${kind === 'fc' ? 'var(--c-a)' : 'var(--accent)'}` })]),
          el('span', { class: 'val', text: pct(p) }),
        ]));
      });
      const nConv = CFG[ver].reduce((a, b) => a + b, 0);
      let out = `VGG${ver}：${nConv} 層 Conv ＋ ${useGap ? 1 : 3} 層 FC，合計 <strong>${int(total)}</strong> 個參數。卷積層 ${int(conv)}（${pct(conv)}），FC 層 ${int(total - conv)}（<span class="bad">${pct(total - conv)}</span>）。`;
      if (!useGap && ver === '16' && total === 138357544) out += ok('VGG16 = 138,357,544 ≈ 1.38 億，與講義（MobileNet 比較表的 138M）相同');
      if (useGap) out += `<div style="margin-top:6px">換成 GAP 後只剩原本的 <strong>${fmt((100 * total) / (conv + (flat + 1) * 4096 + 4097 * 4096 + 4097 * 1000), 1)}%</strong>：大部分參數本來都在 FC 層，卷積層其實不多。這就是 ResNet、SqueezeNet 用 GAP 的理由（見 <a href="#w-gap">2.6</a>）。</div>`;
      else out += `<div style="margin-top:6px">光是 FC1（${int(flat)} → 4,096）就佔了 ${pct((flat + 1) * 4096)}；卷積層做了大部分的「運算」，但「參數」大多在 FC。</div>`;
      $('#vgg-out').innerHTML = out;
    }
    bindSeg('vgg', (v) => { ver = v; upd(); });
    gapIn.addEventListener('change', upd);
    upd();
  })();

  /* ===== Inception module ===== */
  (function inception() {
    const HW = 28, CIN = 192;
    const redIn = $('#inc-red'), sameIn = $('#inc-same');
    function branches(red) {
      return red
        ? [[['conv', 1, 64]], [['conv', 1, 96], ['conv', 3, 128]], [['conv', 1, 16], ['conv', 5, 32]], [['pool', 3], ['conv', 1, 32]]]
        : [[['conv', 1, 64]], [['conv', 3, 128]], [['conv', 5, 32]], [['pool', 3]]];
    }
    function upd() {
      const red = redIn.checked, same = sameIn.checked;
      const res = branches(red).map((ops) => {
        let s = HW, c = CIN, mult = 0;
        const steps = ops.map(([kind, k, co]) => {
          const so = same ? s : s - k + 1;
          let m = 0;
          if (kind === 'conv') { m = so * so * co * k * k * c; c = co; }
          s = so; mult += m;
          return { label: kind === 'conv' ? `${k}×${k} conv, ${co}` : '3×3 max pool', m, shape: `${s}×${s}×${c}` };
        });
        return { steps, s, c, mult };
      });
      const W = 640, H = 300, colW = W / 4;
      const svg = svgRoot(W, H, 'Inception module 示意圖');
      svg.append(svgBox(W / 2 - 90, 6, 180, 30, 'var(--surface-2)'));
      svg.append(svgText(W / 2, 26, `輸入 ${HW}×${HW}×${CIN}`, 'font-weight:600'));
      const canCat = res.every((r) => r.s === res[0].s);
      res.forEach((r, i) => {
        const cx = colW * i + colW / 2;
        svg.append(svgEl('line', { x1: W / 2, y1: 36, x2: cx, y2: 58, style: 'stroke:var(--text-2);stroke-width:1' }));
        r.steps.forEach((st, j) => {
          const y = 60 + j * 62;
          const isRed = red && st.label.startsWith('1×1') && r.steps.length > 1 && j === 0;
          const fill = st.label.includes('pool') ? 'color-mix(in srgb, var(--c-c) 25%, var(--surface))' : isRed ? 'color-mix(in srgb, var(--pos) 22%, var(--surface))' : 'color-mix(in srgb, var(--accent) 18%, var(--surface))';
          svg.append(svgBox(cx - 66, y, 132, 34, fill));
          svg.append(svgText(cx, y + 15, st.label, 'font-size:11.5px;font-weight:600'));
          svg.append(svgText(cx, y + 29, st.m ? `${big(st.m)} 次乘法` : '0 次乘法', 'font-size:10.5px;fill:var(--text-2)'));
          if (j < r.steps.length - 1) svg.append(svgEl('line', { x1: cx, y1: y + 34, x2: cx, y2: y + 62, style: 'stroke:var(--text-2);stroke-width:1' }));
        });
        const yEnd = 60 + (r.steps.length - 1) * 62 + 34;
        svg.append(svgEl('line', { x1: cx, y1: yEnd, x2: cx, y2: 214, style: 'stroke:var(--text-2);stroke-width:1' }));
        const mismatch = r.s !== HW;
        svg.append(svgText(cx, 210, `${r.s}×${r.s}×${r.c}`, `font-family:var(--mono);font-size:11.5px;${mismatch ? 'fill:var(--neg);font-weight:700' : ''}`));
        svg.append(svgEl('line', { x1: cx, y1: 216, x2: W / 2, y2: 246, style: `stroke:${canCat ? 'var(--text-2)' : 'var(--neg)'};stroke-width:1;${canCat ? '' : 'stroke-dasharray:4 3'}` }));
      });
      const outC = res.reduce((a, r) => a + r.c, 0);
      svg.append(svgBox(W / 2 - 130, 248, 260, 40, canCat ? 'var(--accent-soft)' : 'color-mix(in srgb, var(--neg) 15%, var(--surface))'));
      svg.append(svgText(W / 2, 266, canCat ? '串接（concatenate，通道方向）' : '✗ 寬高不同，無法串接', `font-weight:600;${canCat ? '' : 'fill:var(--neg)'}`));
      svg.append(svgText(W / 2, 282, canCat ? `${HW}×${HW}×(${res.map((r) => r.c).join('+')}) = ${HW}×${HW}×${outC}` : res.map((r) => r.s + '×' + r.s).join('、'), 'font-family:var(--mono);font-size:11.5px'));
      const box = $('#inc-svg'); box.innerHTML = ''; box.append(svg);

      const total = res.reduce((a, r) => a + r.mult, 0);
      let html = '';
      if (!canCat) html += '<div class="bad">各分支輸出寬高不同（' + res.map((r) => r.s).join('、') + '），沒辦法沿通道方向疊起來。所以 Inception 所有分支都要 same padding、stride 1。</div>';
      html += `<div>總乘法次數：<strong>${int(total)}</strong>（約 ${big(total)}）</div>`;
      if (canCat) html += `<div>輸出通道 = ${res.map((r) => r.c).join(' ＋ ')} = <strong>${outC}</strong></div>`;
      if (red && same) html += `<div class="muted" style="margin-top:6px">綠色是 1×1 降維（瓶頸層）。關掉降維看看：3×3 和 5×5 直接吃 192 個通道，運算量會變成約 2.4 倍；而且 max pooling 不改通道數，pooling 分支會直接輸出 192 個通道，讓下一層的輸入越疊越厚。</div>`;
      if (!red && same) html += `<div style="margin-top:6px">沒有降維：約 ${big(total)} 次乘法（有降維時約 128M），其中 5×5 分支就佔 120M（講義的數字）。pooling 分支原封不動地輸出 <span class="bad">192</span> 個通道，所以總輸出 ${outC} 比輸入還厚。</div>`;
      $('#inc-out').innerHTML = html;
    }
    redIn.addEventListener('change', upd);
    sameIn.addEventListener('change', upd);
    upd();
  })();

  /* ===== ResNet：學恆等映射 ＋ 梯度相乘 ===== */
  (function residual() {
    const w1In = $('#res-w1'), w2In = $('#res-w2'), canvas = $('#res-canvas');
    const relu = (v) => Math.max(0, v);
    let w1 = 1, w2 = 1;
    const plain = (x) => w2 * relu(w1 * x), resid = (x) => x + w2 * relu(w1 * x);
    const XS = Array.from({ length: 81 }, (_, i) => -2 + i * 0.05);
    const mse = (f) => XS.reduce((a, x) => a + (f(x) - x) ** 2, 0) / XS.length;
    function draw() {
      const col = colors();
      const f = frame(canvas, 0.5, [-2, 2], [-3, 3], [10, 12, 22, 28]);
      const { ctx, h } = f;
      line(ctx, f.X(-2), f.Y(0), f.X(2), f.Y(0), col.border, 1);
      line(ctx, f.X(0), f.Y(-3), f.X(0), f.Y(3), col.border, 1);
      ctx.fillStyle = col.text2; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
      [-2, -1, 1, 2].forEach((v) => ctx.fillText(String(v), f.X(v), h - 6));
      ctx.textAlign = 'right';
      [-2, 2].forEach((v) => ctx.fillText(String(v), f.X(-2) - 4, f.Y(v) + 4));
      poly(ctx, XS.map((x) => [f.X(x), f.Y(x)]), col.text2, 2, [6, 4]);
      const clip = (y) => Math.max(-3.2, Math.min(3.2, y));
      poly(ctx, XS.map((x) => [f.X(x), f.Y(clip(plain(x)))]), col.a, 2.6);
      poly(ctx, XS.map((x) => [f.X(x), f.Y(clip(resid(x)))]), col.b, 2.6);
      ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = col.a; ctx.fillText('普通網路', f.X(-1.95), f.Y(2.7));
      ctx.fillStyle = col.b; ctx.fillText('ResNet', f.X(-1.95), f.Y(2.2));
      ctx.fillStyle = col.text2; ctx.fillText('目標 H(x)=x', f.X(-1.95), f.Y(1.7));
    }
    function upd() {
      draw();
      const mp = mse(plain), mr = mse(resid);
      let html = `誤差（MSE，x 從 −2 到 2）：<span style="color:var(--c-a);font-weight:600">普通網路 ${fmt(mp, 3)}</span>　<span style="color:var(--c-b);font-weight:600">ResNet ${fmt(mr, 3)}</span>`;
      if (mr < 1e-9) html += ok('ResNet 只要讓 F(x) = 0（w₂ = 0），輸出就剛好等於輸入：「什麼都不做」非常好學。');
      else html += '<div style="margin-top:6px">試試看按「w₂ = 0」。</div>';
      if (Math.abs(w2) < 1e-9) html += '<div class="muted" style="margin-top:6px">同一組權重放在普通網路裡，輸出是一條 0 的水平線：普通網路要「什麼都不做」，反而得精準地把 w₁、w₂ 調成某種組合，而且 ReLU 把負的一半切掉了，怎麼調都只能對一半。</div>';
      $('#res-out').innerHTML = html;
    }
    bindRange(w1In, (v) => { w1 = v; upd(); }, (v) => fmt(v, 1));
    bindRange(w2In, (v) => { w2 = v; upd(); }, (v) => fmt(v, 1));
    $('#res-zero').addEventListener('click', () => { w2In.value = 0; w2In.dispatchEvent(new Event('input')); });
    onRedraw(draw);

    const nIn = $('#grad-n'), dIn = $('#grad-d'), fIn = $('#grad-f'), gc = $('#grad-canvas');
    let N = 20, d = 0.5, fp = 0.05;
    function drawG() {
      const col = colors();
      const LO = -12, HI = 6;
      const f = frame(gc, 0.42, [0, N], [LO, HI], [10, 12, 24, 40]);
      const { ctx, h } = f;
      ctx.fillStyle = col.text2; ctx.font = '11px system-ui, sans-serif';
      for (let e = LO; e <= HI; e += 3) {
        line(ctx, f.X(0), f.Y(e), f.X(N), f.Y(e), col.border, e === 0 ? 1.4 : 0.6);
        ctx.textAlign = 'right'; ctx.fillText(e === 0 ? '1' : `1e${e}`, f.X(0) - 4, f.Y(e) + 4);
      }
      ctx.textAlign = 'center';
      ctx.fillText('0', f.X(0), h - 7); ctx.fillText(`${N} 層`, f.X(N) - 12, h - 7);
      const clip = (v) => Math.max(LO, Math.min(HI, v));
      const ks = Array.from({ length: N + 1 }, (_, k) => k);
      poly(ctx, ks.map((k) => [f.X(k), f.Y(clip(k * Math.log10(d)))]), col.a, 2.4);
      poly(ctx, ks.map((k) => [f.X(k), f.Y(clip(k * Math.log10(1 + fp)))]), col.b, 2.4);
      ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = col.a; ctx.fillText(`普通 dᵏ`, f.X(0) + 6, f.Y(HI) + 14);
      ctx.fillStyle = col.b; ctx.fillText(`ResNet (1+F′)ᵏ`, f.X(0) + 6, f.Y(HI) + 30);
    }
    function updG() {
      drawG();
      const gp = Math.pow(d, N), gr = Math.pow(1 + fp, N);
      let html = `穿過 ${N} 層後的梯度倍率：<span style="color:var(--c-a);font-weight:600">普通 ${fmt(d, 2)}<sup>${N}</sup> = ${sci(gp)}</span>　<span style="color:var(--c-b);font-weight:600">ResNet ${fmt(1 + fp, 2)}<sup>${N}</sup> = ${sci(gr)}</span>`;
      if (N === 20 && Math.abs(d - 0.5) < 1e-9) html += ok('0.5²⁰ ≈ 9.5 × 10⁻⁷：梯度幾乎消失，前面的層學不動');
      else if (N === 20 && Math.abs(d - 1.5) < 1e-9) html += ok('1.5²⁰ ≈ 3,325：梯度爆炸');
      else html += '<div class="muted" style="margin-top:6px">把 d 拉到 1.5 看梯度爆炸；N = 20、d = 0.5 是筆記的梯度消失例子。</div>';
      html += '<div class="muted" style="margin-top:6px">縱軸是對數刻度。只要殘差分支的導數 F′ 不大，每個 block 的倍率都接近 1，梯度可以一路傳回前面的層。<span class="tag add">補充</span>F′ 太大時 ResNet 仍可能爆炸，所以實務上會搭配 BN（C3）一起用。</div>';
      $('#grad-out').innerHTML = html;
    }
    bindRange(nIn, (v) => { N = v; updG(); });
    bindRange(dIn, (v) => { d = v; updG(); }, (v) => fmt(v, 2));
    bindRange(fIn, (v) => { fp = v; updG(); }, (v) => fmt(v, 2));
    onRedraw(drawG);
  })();

  /* ===== GAP ===== */
  (function gap() {
    const nIn = $('#gap-n');
    let n = 7, preset = 'small', M;
    function make(kind) {
      const A = Array.from({ length: n }, () => Array(n).fill(0));
      const fill = (r0, r1, c0, c1) => { for (let i = r0; i <= r1; i++) for (let j = c0; j <= c1; j++) A[i][j] = 9; };
      if (kind === 'small') fill(1, 2, 1, 2);
      else if (kind === 'shift') fill(n - 3, n - 2, n - 3, n - 2);
      else fill(1, n - 2, 1, n - 2);
      return A;
    }
    function upd() {
      const grid = $('#gap-grid'); grid.innerHTML = '';
      grid.append(CV.matrix(M, {
        small: n > 7,
        cls: (i, j, v) => (v ? 'g1' : ''),
        text: (i, j, v) => String(v),
        onClick: (i, j) => { M[i][j] = M[i][j] ? 0 : 9; upd(); },
        caption: `某一個通道的 ${n}×${n} 特徵圖（點格子切換）`,
      }));
      const flatVals = M.flat(), sum = flatVals.reduce((a, b) => a + b, 0), mx = Math.max(...flatVals), on = flatVals.filter((v) => v).length;
      let html = `<div><strong>GAP</strong> = ${sum} ／ ${n * n} = <span class="big">${fmt(sum / (n * n), 3)}</span></div>`;
      html += `<div><strong>Global Max Pooling</strong> = <span class="big">${mx}</span></div>`;
      if (preset === 'small' || preset === 'shift') html += `<div style="margin-top:6px">物體只佔 ${on} ／ ${n * n} 格，GAP 被大片背景沖淡成 ${fmt(sum / (n * n), 2)}；Max Pooling 仍保留 ${mx} 的強烈反應。</div>`;
      if (preset === 'shift') html += '<div style="margin-top:6px">和「小物體」比較：物體換了位置，GAP 完全一樣 → <strong>位置資訊丟掉了</strong>，所以 GAP 不適合直接做偵測、分割。</div>';
      if (preset === 'big') html += '<div style="margin-top:6px">物體佔大部分畫面時，GAP 能如實反映「這個特徵很強」。</div>';
      $('#gap-out').innerHTML = html;

      const C = 512, flat = n * n * C, fc = (flat + 1) * 4096, g = (C + 1) * 1000;
      let p = `<div><strong>整層 ${n}×${n}×${C} 的參數比較</strong></div>`;
      p += `<div class="mono" style="font-size:.9rem">Flatten → ${int(flat)} 維 → FC 4096：(${int(flat)}+1)×4096 = <strong>${int(fc)}</strong></div>`;
      p += `<div class="mono" style="font-size:.9rem">GAP → ${C} 維（0 參數）→ FC 1000：(${C}+1)×1000 = <strong>${int(g)}</strong></div>`;
      if (n === 7) p += ok('7×7×512 → 102,764,544 vs 513,000，與筆記 4.6 相同');
      else p += `<div style="margin-top:6px">特徵圖從 7×7 變成 ${n}×${n}，flatten 後的長度從 25,088 變成 <span class="bad">${int(flat)}</span>，原本訓練好的 FC 權重接不上；GAP 的輸出仍然是 <span class="good">${C}</span> 維，後面的層不用改。</div>`;
      $('#gap-param').innerHTML = p;
    }
    function apply(kind) { preset = kind; M = make(kind); upd(); }
    $$('[data-gap]').forEach((b) => b.addEventListener('click', () => apply(b.dataset.gap)));
    nIn.addEventListener('change', () => { n = Number(nIn.value); apply(preset); });
    apply('small');
  })();

  /* ===== Fire module ===== */
  (function fire() {
    const ins = { in: $('#fire-in'), s: $('#fire-s'), e1: $('#fire-e1'), e3: $('#fire-e3') };
    function upd() {
      const cin = posInt(ins.in), s = posInt(ins.s), e1 = posInt(ins.e1, 0), e3 = posInt(ins.e3, 0);
      const sq = (cin + 1) * s, x1 = (s + 1) * e1, x3 = (9 * s + 1) * e3, total = sq + x1 + x3, cout = e1 + e3;
      const direct = (9 * cin + 1) * cout;
      // 示意圖：寬度依通道數的平方根
      const W = 560, H = 230, maxC = Math.max(cin, s, e1, e3, cout, 1);
      const wd = (c) => 30 + 230 * Math.sqrt(c / maxC);
      const svg = svgRoot(W, H, 'Fire module 示意圖', 560);
      const layer = (y, w, label, sub, fill, cx = W / 2) => {
        svg.append(svgBox(cx - w / 2, y, w, 30, fill));
        svg.append(svgText(cx, y + 19, label, 'font-size:11.5px;font-weight:600'));
        if (sub) svg.append(svgText(cx + w / 2 + 6, y + 19, sub, 'font-size:11px;fill:var(--text-2)', 'start'));
      };
      const arrow = (x1_, y1, x2_, y2) => svg.append(svgEl('line', { x1: x1_, y1, x2: x2_, y2, style: 'stroke:var(--text-2);stroke-width:1' }));
      layer(8, wd(cin), `輸入 ${cin}`, '', 'var(--surface-2)');
      arrow(W / 2, 38, W / 2, 58);
      layer(58, wd(s), `squeeze 1×1 × ${s}`, `${int(sq)} 參數`, 'color-mix(in srgb, var(--pos) 25%, var(--surface))');
      const ex1 = W / 2 - 140, ex3 = W / 2 + 140;
      arrow(W / 2, 88, ex1, 118); arrow(W / 2, 88, ex3, 118);
      const ew = (c) => Math.min(250, wd(c));
      svg.append(svgBox(ex1 - ew(e1) / 2, 118, ew(e1), 30, 'color-mix(in srgb, var(--accent) 20%, var(--surface))'));
      svg.append(svgText(ex1, 137, `expand 1×1 × ${e1}`, 'font-size:11.5px;font-weight:600'));
      svg.append(svgText(ex1, 164, `${int(x1)} 參數`, 'font-size:11px;fill:var(--text-2)'));
      svg.append(svgBox(ex3 - ew(e3) / 2, 118, ew(e3), 30, 'color-mix(in srgb, var(--c-c) 28%, var(--surface))'));
      svg.append(svgText(ex3, 137, `expand 3×3 × ${e3}`, 'font-size:11.5px;font-weight:600'));
      svg.append(svgText(ex3, 164, `${int(x3)} 參數`, 'font-size:11px;fill:var(--text-2)'));
      arrow(ex1, 170, W / 2, 192); arrow(ex3, 170, W / 2, 192);
      layer(192, wd(cout), `串接 → ${cout} 通道`, '', 'var(--accent-soft)');
      const box = $('#fire-svg'); box.innerHTML = ''; box.append(svg);

      let html = `<div class="mono" style="font-size:.9rem">squeeze：(1×1×${cin}+1)×${s} = ${int(sq)}</div>`;
      html += `<div class="mono" style="font-size:.9rem">expand 1×1：(1×1×${s}+1)×${e1} = ${int(x1)}</div>`;
      html += `<div class="mono" style="font-size:.9rem">expand 3×3：(3×3×${s}+1)×${e3} = ${int(x3)}</div>`;
      html += `<div style="margin-top:4px">Fire module 合計 <span class="big">${int(total)}</span>，輸出 ${e1} ＋ ${e3} = ${cout} 通道</div>`;
      html += `<div>直接用 3×3 卷積 ${cin} → ${cout}：(3×3×${cin}+1)×${cout} = <strong>${int(direct)}</strong>，是 Fire module 的 <strong>${fmt(direct / total, 1)}</strong> 倍</div>`;
      if (cin === 96 && s === 16 && e1 === 64 && e3 === 64) html += ok('fire2 = 11,920（直接 3×3 為 110,720），與筆記 4.9 相同');
      if (cin === 128 && s === 16 && e1 === 64 && e3 === 64) html += ok('自我測驗第 5 題：12,432 vs 147,584');
      if (s > (e1 + e3) / 2) html += '<div class="bad" style="margin-top:6px">squeeze 比 expand 還寬，就沒有「先壓縮」的效果了（SqueezeNet 中 squeeze 約是 expand 的 1/8）。</div>';
      else html += `<div class="muted" style="margin-top:6px">squeeze ／ expand = ${s} ／ ${cout} = ${fmt(s / cout, 3)}。省參數的兩個關鍵：3×3 的輸入只有 ${s} 個通道（策略二），而且一半的 expand 用 1×1（策略一）。</div>`;
      $('#fire-out').innerHTML = html;
    }
    Object.values(ins).forEach((i) => i.addEventListener('input', upd));
    $$('[data-fire]').forEach((b) => b.addEventListener('click', () => {
      const [a, s, e1, e3] = b.dataset.fire.split(',');
      ins.in.value = a; ins.s.value = s; ins.e1.value = e1; ins.e3.value = e3; upd();
    }));
    upd();
  })();

  /* ===== 瓶頸層 ===== */
  (function bottleneck() {
    const hwIn = $('#bn-hw'), cIn = $('#bn-c'), kIn = $('#bn-k'), oIn = $('#bn-o'), bIn = $('#bn-b');
    function upd() {
      const hw = posInt(hwIn), c = posInt(cIn), k = Number(kIn.value), o = posInt(oIn);
      bIn.max = c;
      const b = Math.min(posInt(bIn), c);
      const P = hw * hw;
      const direct = P * o * k * k * c, s1 = P * b * c, s2 = P * o * k * k * b, sum = s1 + s2;
      // 沙漏圖
      const W = 560, H = 120, maxC = Math.max(c, b, o);
      const h = (ch) => 14 + 86 * Math.sqrt(ch / maxC);
      const svg = svgRoot(W, H, '瓶頸層沙漏示意圖', 560);
      const slab = (x, ch, label, fill) => {
        const hh = h(ch);
        svg.append(svgEl('rect', { x, y: (H - 16 - hh) / 2, width: 70, height: hh, rx: 4, style: `fill:${fill};stroke:var(--border)` }));
        svg.append(svgText(x + 35, H - 2, label, 'font-size:11.5px;font-family:var(--mono)'));
      };
      const arrowL = (x1, x2, label) => {
        svg.append(svgEl('line', { x1, y1: (H - 16) / 2, x2, y2: (H - 16) / 2, style: 'stroke:var(--text-2);stroke-width:1.2' }));
        svg.append(svgText((x1 + x2) / 2, (H - 16) / 2 - 6, label, 'font-size:11px;fill:var(--text-2)'));
      };
      slab(20, c, `${hw}×${hw}×${c}`, 'var(--surface-2)');
      arrowL(92, 230, '1×1 conv');
      slab(235, b, `${hw}×${hw}×${b}`, 'color-mix(in srgb, var(--pos) 28%, var(--surface))');
      arrowL(307, 445, `${k}×${k} conv`);
      slab(450, o, `${hw}×${hw}×${o}`, 'var(--accent-soft)');
      const box = $('#bneck-svg'); box.innerHTML = ''; box.append(svg);

      let html = `<div class="mono" style="font-size:.9rem">直接 ${k}×${k}：${hw}×${hw}×${o}×(${k}×${k}×${c}) = <strong>${int(direct)}</strong></div>`;
      html += `<div class="mono" style="font-size:.9rem">① 1×1 壓到 ${b}：${hw}×${hw}×${b}×${c} = ${int(s1)}</div>`;
      html += `<div class="mono" style="font-size:.9rem">② ${k}×${k} 輸出 ${o}：${hw}×${hw}×${o}×(${k}×${k}×${b}) = ${int(s2)}</div>`;
      html += `<div style="margin-top:4px">瓶頸合計 <span class="big">${int(sum)}</span>，是直接做的 <strong>${fmt((100 * sum) / direct, 1)}%</strong>（約 1/${fmt(direct / sum, 1)}）</div>`;
      if (hw === 28 && c === 192 && k === 5 && o === 32 && b === 16) html += ok('120,422,400 → 2,408,448 ＋ 10,035,200 = 12,443,648，與講義的 120M → 2.4M ＋ 10M ≈ 12.4M 相同');
      if (sum >= direct) html += '<div class="bad" style="margin-top:6px">瓶頸太寬，加一層 1×1 反而更貴了。</div>';
      $('#bneck-out').innerHTML = html;
    }
    [hwIn, cIn, oIn].forEach((i) => i.addEventListener('input', upd));
    kIn.addEventListener('change', upd);
    bindRange(bIn, upd);
  })();

  /* ===== Depthwise Separable ===== */
  (function dsc() {
    const hwIn = $('#dsc-hw'), ciIn = $('#dsc-ci'), kIn = $('#dsc-k'), coIn = $('#dsc-co'), pIn = $('#dsc-p');
    function kernelStack(svg, x, y, k, depth, fill, sz) {
      // 以斜向堆疊表示 k×k×depth 的 kernel（最多畫 6 片）
      const n = Math.min(depth, 6), off = 5;
      for (let i = n - 1; i >= 0; i--) svg.append(svgEl('rect', { x: x + i * off, y: y - i * off, width: sz, height: sz, rx: 2, style: `fill:${fill};stroke:var(--text-2);stroke-width:.8` }));
      return n;
    }
    function upd() {
      const hw = posInt(hwIn), ci = posInt(ciIn), k = Number(kIn.value), co = posInt(coIn), same = pIn.value === 'same';
      const out = same ? hw : hw - k + 1;
      if (out < 1) { $('#dsc-out').innerHTML = '<span class="bad">輸入比 kernel 還小，沒有輸出。</span>'; $('#dsc-svg').innerHTML = ''; return; }
      const P = out * out;
      const std = P * co * k * k * ci, dw = k * k * P * ci, pw = ci * P * co, sep = dw + pw;
      const W = 600, H = 150;
      const svg = svgRoot(W, H, '三種 kernel 形狀比較', 600);
      const sz = 16 + k * 5;
      // 一般卷積
      kernelStack(svg, 30, 60, k, ci, 'color-mix(in srgb, var(--c-a) 30%, var(--surface))', sz);
      svg.append(svgText(75, 120, `${k}×${k}×${ci}`, 'font-family:var(--mono);font-size:11.5px'));
      svg.append(svgText(75, 138, `× ${co} 個（一般卷積）`, 'font-size:11px;fill:var(--text-2)'));
      // depthwise：分開的 ci 片
      const nd = Math.min(ci, 5);
      for (let i = 0; i < nd; i++) svg.append(svgEl('rect', { x: 200 + i * (sz * 0.55 + 6), y: 48, width: sz * 0.55, height: sz * 0.55, rx: 2, style: 'fill:color-mix(in srgb, var(--pos) 30%, var(--surface));stroke:var(--text-2);stroke-width:.8' }));
      if (ci > nd) svg.append(svgText(200 + nd * (sz * 0.55 + 6) + 6, 48 + sz * 0.3, '…', 'font-size:14px', 'start'));
      svg.append(svgText(270, 120, `${ci} 片 ${k}×${k}×1`, 'font-family:var(--mono);font-size:11.5px'));
      svg.append(svgText(270, 138, 'Depthwise（各掃各的）', 'font-size:11px;fill:var(--text-2)'));
      // pointwise：1×1×ci 細長條
      const barH = Math.min(80, 10 + ci * 4);
      svg.append(svgEl('rect', { x: 452, y: 88 - barH, width: 12, height: barH, rx: 2, style: 'fill:color-mix(in srgb, var(--accent) 35%, var(--surface));stroke:var(--text-2);stroke-width:.8' }));
      svg.append(svgText(500, 120, `1×1×${ci}`, 'font-family:var(--mono);font-size:11.5px'));
      svg.append(svgText(500, 138, `× ${co} 個（Pointwise）`, 'font-size:11px;fill:var(--text-2)'));
      svg.append(svgText(370, 70, '＋', 'font-size:20px;fill:var(--text-2)'));
      const box = $('#dsc-svg'); box.innerHTML = ''; box.append(svg);

      let html = `<div>輸出 ${out}×${out}×${co}（${same ? 'same padding' : `${hw} − ${k} + 1 = ${out}`}），共 ${P} 個位置</div>`;
      html += `<div class="mono" style="font-size:.9rem;margin-top:4px">一般卷積：(${k}×${k}×${ci}) × ${P} × ${co} = <strong>${int(std)}</strong></div>`;
      html += `<div class="mono" style="font-size:.9rem">Depthwise：${k}×${k} × ${P} × ${ci} = ${int(dw)}</div>`;
      html += `<div class="mono" style="font-size:.9rem">Pointwise：${ci} × ${P} × ${co} = ${int(pw)}</div>`;
      html += `<div style="margin-top:4px">Depthwise Separable 合計 <span class="big">${int(sep)}</span>，比值 ${fmt(sep / std, 4)}（約 1/${fmt(std / sep, 1)}）</div>`;
      html += `<div class="muted">公式：1/C<sub>out</sub> ＋ 1/k² = 1/${co} ＋ 1/${k * k} = ${fmt(1 / co + 1 / (k * k), 4)}</div>`;
      html += `<div class="muted">參數量（不含 bias）：一般 ${k}×${k}×${ci}×${co} = ${int(k * k * ci * co)}；分離式 ${k}×${k}×${ci} ＋ ${ci}×${co} = ${int(k * k * ci + ci * co)} <span class="tag add">補充</span></div>`;
      if (std === 614400 && sep === 29376) html += ok('講義例子：614,400 vs 29,376，約 1/20');
      if (std === 4718592 && sep === 598016) html += ok('自我測驗第 4 題：4,718,592 vs 598,016，約 1/7.9');
      $('#dsc-out').innerHTML = html;
    }
    [hwIn, ciIn, coIn].forEach((i) => i.addEventListener('input', upd));
    [kIn, pIn].forEach((i) => i.addEventListener('change', upd));
    $$('[data-dsc]').forEach((b) => b.addEventListener('click', () => {
      const [hw, ci, k, co, p] = b.dataset.dsc.split(',');
      hwIn.value = hw; ciIn.value = ci; kIn.value = k; coIn.value = co; pIn.value = p; upd();
    }));
    upd();
  })();

  /* ===== MobileNet α、ρ ===== */
  (function mobile() {
    const aIn = $('#mob-a'), rIn = $('#mob-r');
    // MobileNet 論文 Table 6、7、9：[ImageNet Acc, 百萬乘加, 百萬參數]
    const PAPER = {
      '1,224': [70.6, 569, 4.2], '0.75,224': [68.4, 325, 2.6], '0.5,224': [63.7, 149, 1.3], '0.25,224': [50.6, 41, 0.5],
      '1,192': [69.1, 418, 4.2], '1,160': [67.2, 290, 4.2], '1,128': [64.4, 186, 4.2], '0.5,160': [60.2, 76, 1.32],
    };
    function layer(a, res) {
      const ci = Math.round(64 * a), co = Math.round(128 * a), F = Math.round((112 * res) / 224);
      return { ci, co, F, mult: F * F * (9 * ci + ci * co), param: 9 * ci + ci * co };
    }
    function upd() {
      const a = Number(aIn.value), res = Number(rIn.value), rho = res / 224;
      const L = layer(a, res), L0 = layer(1, 224);
      let html = `<div><strong>示範層</strong>（3×3 depthwise separable）：${L.F}×${L.F}，${L.ci} → ${L.co} 通道</div>`;
      html += `<div class="mono" style="font-size:.9rem">運算量 ${L.F}²×(9×${L.ci} ＋ ${L.ci}×${L.co}) = ${int(L.mult)}，是 α=1、224 的 <strong>${fmt(L.mult / L0.mult, 3)}</strong> 倍（α²ρ² = ${fmt(a * a * rho * rho, 3)}）</div>`;
      html += `<div class="mono" style="font-size:.9rem">參數量 9×${L.ci} ＋ ${L.ci}×${L.co} = ${int(L.param)}，是原本的 <strong>${fmt(L.param / L0.param, 3)}</strong> 倍（α² = ${fmt(a * a, 3)}）</div>`;
      html += `<div class="muted">只有 ρ 改變時參數量完全不變${a < 1 ? '；比值和 α² 差一點，是因為 depthwise 那項（9×C<sub>in</sub>）只和 α 成正比' : ''}。</div>`;
      const estM = 569 * a * a * rho * rho, estP = 4.2 * a * a;
      html += `<div style="margin-top:8px"><strong>整個模型</strong>（${a === 1 ? '1.0' : a} MobileNet-${res}）：估算約 <strong>${fmt(estM, 0)}M</strong> 乘加、<strong>${fmt(estP, 2)}M</strong> 參數</div>`;
      const pp = PAPER[a + ',' + res];
      if (pp) html += `<div>論文實際值：ImageNet ${pp[0]}%、${pp[1]}M 乘加、${pp[2]}M 參數 <span class="tag add">補充</span></div>`;
      if (a === 0.5 && res === 224) html += ok('講義例子：64 → 128 變成 32 → 64，運算量與參數量約變 0.25 倍');
      if (a === 1 && res === 160) html += ok('講義例子：ρ ≈ 0.714，運算量約變 0.51 倍，參數量不變');
      $('#mob-out').innerHTML = html;
      const bars = $('#mob-bars'); bars.innerHTML = '';
      [['運算量', estM / 569], ['參數量', estP / 4.2]].forEach(([name, r]) => bars.append(el('div', { class: 'bar-row' }, [
        el('span', { text: name }),
        el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill', style: `width:${r * 100}%` })]),
        el('span', { class: 'val', text: fmt(r * 100, 1) + '%' }),
      ])));
    }
    [aIn, rIn].forEach((i) => i.addEventListener('change', upd));
    $$('[data-mob]').forEach((b) => b.addEventListener('click', () => {
      const [a, r] = b.dataset.mob.split(',');
      aIn.value = a; rIn.value = r; upd();
    }));
    upd();
  })();

  /* ===== EfficientNet Compound Scaling ===== */
  (function scaling() {
    const pIn = $('#sc-phi'), mIn = $('#sc-mode');
    const A = 1.2, B = 1.1, G = 1.15, BASE = A * B * B * G * G;
    let phi = 1;
    function upd() {
      const mode = mIn.value, F = Math.pow(BASE, phi);
      let d = 1, w = 1, r = 1;
      if (mode === 'all') { d = Math.pow(A, phi); w = Math.pow(B, phi); r = Math.pow(G, phi); }
      else if (mode === 'd') d = F;
      else if (mode === 'w') w = Math.sqrt(F);
      else r = Math.sqrt(F);
      const W = 600, H = 210;
      const svg = svgRoot(W, H, 'Compound Scaling 示意圖', 600);
      // baseline（虛線）與放大後的網路：高 = 深度、寬 = 寬度、左側方塊 = 解析度
      const bw = (x) => Math.min(200, 90 * x), rs = (x) => Math.min(130, 50 * x);
      const draw = (dd, ww, rr, dashed, x0) => {
        const style = dashed ? 'fill:none;stroke:var(--text-2);stroke-dasharray:4 3' : 'fill:color-mix(in srgb, var(--accent) 22%, var(--surface));stroke:var(--accent)';
        const s = rs(rr);
        svg.append(svgEl('rect', { x: x0, y: 190 - s, width: s, height: s, rx: 3, style: dashed ? style : 'fill:color-mix(in srgb, var(--c-c) 30%, var(--surface));stroke:var(--c-c)' }));
        const nb = Math.min(40, Math.max(1, Math.round(5 * dd))), hgt = Math.min(180, 70 * dd), lh = hgt / nb;
        for (let i = 0; i < nb; i++) svg.append(svgEl('rect', { x: x0 + s + 20, y: 190 - (i + 1) * lh, width: bw(ww), height: Math.max(1.5, lh - 2), rx: 2, style }));
      };
      draw(1, 1, 1, true, 20);
      draw(d, w, r, false, 250);
      svg.append(svgText(110, 204, 'baseline（B0）', 'font-size:11px;fill:var(--text-2)'));
      svg.append(svgText(420, 204, mode === 'all' ? `compound φ = ${phi}` : `只放大一個維度（同樣運算量）`, 'font-size:11px;fill:var(--text-2)'));
      const box = $('#sc-svg'); box.innerHTML = ''; box.append(svg);

      let html = `<div>深度 × <strong>${fmt(d, 3)}</strong>　寬度 × <strong>${fmt(w, 3)}</strong>　解析度 × <strong>${fmt(r, 3)}</strong>（224 → ${Math.round(224 * r)}）</div>`;
      html += `<div class="mono" style="font-size:.9rem">運算量 ≈ d × w² × r² = ${fmt(d, 3)} × ${fmt(w * w, 3)} × ${fmt(r * r, 3)} = <strong>${fmt(d * w * w * r * r, 3)}</strong>（≈ 2<sup>${phi}</sup> = ${2 ** phi}）</div>`;
      if (mode === 'all' && phi === 1) html += ok('B0 係數：1.2 × 1.1² × 1.15² ≈ 1.92 ≈ 2');
      if (mode === 'all' && phi === 2) html += ok('筆記例子：φ = 2 → 1.44、1.21、1.32，運算量約 3.7 倍');
      if (mode !== 'all') html += '<div class="muted" style="margin-top:6px">同樣的運算量全部花在單一維度上：講義說放大任一維度都能提升準確率，但越大增益越小；平衡放大三者效果最好。</div>';
      html += '<div class="muted" style="margin-top:6px">示意圖：左邊方塊是輸入解析度、每一條是一層（寬 = 通道數、條數 = 深度）。</div>';
      $('#sc-out').innerHTML = html;
    }
    bindRange(pIn, (v) => { phi = v; upd(); });
    mIn.addEventListener('change', upd);
  })();

  /* ===== 準確率 vs 參數量 ===== */
  (function models() {
    const SETS = {
      imagenet: { name: 'ImageNet Accuracy', yr: [50, 75], rows: [
        ['1.0 MobileNet-224', 70.6, 4.2, 'm'], ['GoogLeNet', 69.8, 6.8, 'o'], ['VGG16', 71.5, 138, 'o'],
        ['0.50 MobileNet-160', 60.2, 1.32, 'm'], ['SqueezeNet', 57.5, 1.25, 'o'], ['AlexNet', 57.2, 60, 'o']] },
      dogs: { name: 'Stanford Dogs Top-1', yr: [78, 86], rows: [
        ['Inception V3', 84, 23.2, 'o'], ['1.0 MobileNet-224', 83.3, 3.3, 'm'], ['0.75 MobileNet-224', 81.9, 1.9, 'm'],
        ['1.0 MobileNet-192', 81.9, 3.3, 'm'], ['0.75 MobileNet-192', 80.5, 1.9, 'm']] },
    };
    let set = 'imagenet';
    const canvas = $('#models-canvas');
    function draw() {
      const col = colors(), S = SETS[set];
      const f = frame(canvas, 0.55, [Math.log10(0.8), Math.log10(250)], S.yr, [12, 16, 28, 40]);
      const { ctx, h } = f;
      ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = col.text2;
      [1, 3, 10, 30, 100].forEach((v) => {
        line(ctx, f.X(Math.log10(v)), f.Y(S.yr[0]), f.X(Math.log10(v)), f.Y(S.yr[1]), col.border, 0.6);
        ctx.textAlign = 'center'; ctx.fillText(v + 'M', f.X(Math.log10(v)), h - 10);
      });
      const step = set === 'dogs' ? 2 : 5;
      for (let y = S.yr[0]; y <= S.yr[1]; y += step) {
        line(ctx, f.X(Math.log10(0.8)), f.Y(y), f.X(Math.log10(250)), f.Y(y), col.border, 0.6);
        ctx.textAlign = 'right'; ctx.fillText(y + '%', f.X(Math.log10(0.8)) - 4, f.Y(y) + 4);
      }
      ctx.font = '600 11.5px system-ui, sans-serif';
      const placed = [];
      S.rows.forEach(([name, acc, p, kind]) => {
        const x = f.X(Math.log10(p)), y = f.Y(acc), c = kind === 'm' ? col.b : col.a;
        dot(ctx, x, y, 5, c);
        let ly = y - 8;
        while (placed.some((q) => Math.abs(q[1] - ly) < 13 && Math.abs(q[0] - x) < 120)) ly += 14;
        placed.push([x, ly]);
        const right = x > f.X(Math.log10(40));
        ctx.textAlign = right ? 'right' : 'left'; ctx.fillStyle = c;
        ctx.fillText(name, x + (right ? -8 : 8), ly);
      });
    }
    function table() {
      const S = SETS[set];
      let html = `<table><tr><th>模型</th><th class="num">${S.name}</th><th class="num">參數量（百萬）</th></tr>`;
      S.rows.forEach(([n, a, p]) => { html += `<tr><td>${n}</td><td class="num">${a}%</td><td class="num">${p}</td></tr>`; });
      $('#models-table').innerHTML = html + '</table>';
    }
    bindSeg('mset', (v) => { set = v; draw(); table(); });
    table();
    onRedraw(draw);
  })();
})();
