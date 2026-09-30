/* C1 互動元件 */
(function () {
  'use strict';
  const { $, el, fmt, int, cssVar, tex, setupCanvas, onRedraw, pointer, rng, gauss, bindRange } = CV;

  // 資料座標 ↔ 畫布座標。equal=true 時 x、y 同比例，y 範圍依畫布高度決定
  function frame(canvas, aspect, xr, yr, pad = 14) {
    const { ctx, w, h } = setupCanvas(canvas, aspect);
    const sx = (w - 2 * pad) / (xr[1] - xr[0]);
    let y0 = yr ? yr[0] : 0, y1 = yr ? yr[1] : 0, sy;
    if (!yr) { // 等比例
      sy = sx;
      const half = (h - 2 * pad) / sx / 2;
      y0 = -half; y1 = half;
    } else {
      sy = (h - 2 * pad) / (y1 - y0);
    }
    return {
      ctx, w, h, y0, y1,
      X: (x) => pad + (x - xr[0]) * sx,
      Y: (y) => h - pad - (y - y0) * sy,
      ix: (px) => xr[0] + (px - pad) / sx,
      iy: (py) => y0 + (h - pad - py) / sy,
      sx, sy,
    };
  }
  function dot(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function line(ctx, x1, y1, x2, y2, color, width = 1.5, dash = []) {
    ctx.save(); ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function colors() {
    return { a: cssVar('--c-a'), b: cssVar('--c-b'), c: cssVar('--c-c'), text: cssVar('--text'), text2: cssVar('--text-2'), border: cssVar('--border'), accent: cssVar('--accent'), pos: cssVar('--pos'), neg: cssVar('--neg'), surface: cssVar('--surface') };
  }

  /* ===== 像素 ===== */
  (function pixel() {
    const r = $('#px-r'), g = $('#px-g'), b = $('#px-b');
    const upd = () => {
      const R = +r.value, G = +g.value, B = +b.value;
      const gray = Math.round(0.299 * R + 0.587 * G + 0.114 * B);
      $('#px-color').style.background = `rgb(${R},${G},${B})`;
      $('#px-gray').style.background = `rgb(${gray},${gray},${gray})`;
      $('#px-gray-cap').textContent = `灰階（1 頻道）= ${gray}`;
    };
    [r, g, b].forEach((x) => bindRange(x, upd));
    const H = $('#px-h'), W = $('#px-w'), C = $('#px-c');
    const size = () => {
      const h = Math.max(1, +H.value || 1), w = Math.max(1, +W.value || 1), c = +C.value;
      const n = h * w * c;
      let s = `${h} × ${w} × ${c} = <span class="big">${int(n)}</span> 個 0～255 的數字`;
      if (c === 3) s += `<br><span class="muted">改成灰階只剩 ${int(h * w)} 個（少了 2/3）；MNIST 手寫數字 28×28×1 只有 784 個。</span>`;
      else s += '<br><span class="muted">MNIST 手寫數字就是 28×28×1 = 784 個數字。</span>';
      $('#px-out').innerHTML = s;
    };
    [H, W].forEach((x) => x.addEventListener('input', size));
    C.addEventListener('change', size);
    size();
  })();

  /* ===== SVM ===== */
  (function svm() {
    const canvas = $('#svm-canvas'), out = $('#svm-out');
    const angIn = $('#svm-ang'), offIn = $('#svm-off');
    let pts = [], seed = 7, best = null;
    let alpha = 120, off = 0.6, isBest = false;

    function makeData() {
      for (let tries = 0; tries < 50; tries++) {
        const r = rng(seed++);
        pts = [];
        for (let i = 0; i < 12; i++) pts.push({ x: -1.5 + gauss(r) * 0.55, y: -0.9 + gauss(r) * 0.5, c: -1 });
        for (let i = 0; i < 12; i++) pts.push({ x: 1.4 + gauss(r) * 0.55, y: 0.9 + gauss(r) * 0.5, c: 1 });
        best = findBest();
        if (best && best.m > 0.35) return;
      }
    }
    const nrm = (a) => { const t = a * Math.PI / 180; return [-Math.sin(t), Math.cos(t)]; };
    function evalLine(a, o) {
      const [nx, ny] = nrm(a);
      const s = pts.map((p) => nx * p.x + ny * p.y - o);
      // 兩種方向取錯誤較少的
      let err1 = 0, err2 = 0;
      pts.forEach((p, i) => { if (Math.sign(s[i]) !== p.c) err1++; if (Math.sign(s[i]) !== -p.c) err2++; });
      const err = Math.min(err1, err2);
      const m = err === 0 ? Math.min(...s.map(Math.abs)) : 0;
      return { s, err, m };
    }
    function findBest() {
      let res = null;
      for (let a = 0; a < 180; a += 0.25) {
        const [nx, ny] = nrm(a);
        const t = pts.map((p) => nx * p.x + ny * p.y);
        const pos = t.filter((_, i) => pts[i].c === 1), neg = t.filter((_, i) => pts[i].c === -1);
        for (const [lo, hi] of [[Math.max(...neg), Math.min(...pos)], [Math.max(...pos), Math.min(...neg)]]) {
          if (hi > lo) {
            const m = (hi - lo) / 2;
            if (!res || m > res.m) res = { a, o: (hi + lo) / 2, m };
          }
        }
      }
      return res;
    }
    function draw() {
      const col = colors();
      const f = frame(canvas, 0.6, [-4.5, 4.5]);
      const { ctx } = f;
      const { s, err, m } = evalLine(alpha, off);
      const [nx, ny] = nrm(alpha);
      const t = alpha * Math.PI / 180, dx = Math.cos(t), dy = Math.sin(t);
      const seg = (o, color, w, dash) => line(ctx, f.X(nx * o - dx * 12), f.Y(ny * o - dy * 12), f.X(nx * o + dx * 12), f.Y(ny * o + dy * 12), color, w, dash);
      if (m > 0) {
        // margin 帶
        ctx.save(); ctx.fillStyle = col.accent; ctx.globalAlpha = 0.1; ctx.beginPath();
        const c1 = [nx * (off + m), ny * (off + m)], c2 = [nx * (off - m), ny * (off - m)];
        ctx.moveTo(f.X(c1[0] - dx * 12), f.Y(c1[1] - dy * 12)); ctx.lineTo(f.X(c1[0] + dx * 12), f.Y(c1[1] + dy * 12));
        ctx.lineTo(f.X(c2[0] + dx * 12), f.Y(c2[1] + dy * 12)); ctx.lineTo(f.X(c2[0] - dx * 12), f.Y(c2[1] - dy * 12));
        ctx.fill(); ctx.restore();
        seg(off + m, col.text2, 1.5, [6, 5]);
        seg(off - m, col.text2, 1.5, [6, 5]);
      }
      seg(off, col.text, 2.5, []);
      pts.forEach((p, i) => {
        const sv = m > 0 && Math.abs(Math.abs(s[i]) - m) < 0.02;
        dot(ctx, f.X(p.x), f.Y(p.y), sv ? 7 : 5.5, p.c === 1 ? col.b : col.a, sv ? col.text : null);
      });
      let html = err === 0
        ? `<span class="good">✓ 兩類完全分開</span>　margin（最近的點到超平面的距離）= <strong>${fmt(m, 2)}</strong>`
        : `<span class="bad">✗ 有 ${err} 個點被分錯</span>　這條線不是有效的分隔線`;
      if (best) {
        const pct = Math.round((m / best.m) * 100);
        html += `<br>最大可能的 margin = ${fmt(best.m, 2)}` + (err === 0 ? `　→ 你的 margin 是最大值的 <strong>${pct}%</strong>` : '');
        if (isBest || pct >= 99) html += '<br><span class="good">這就是 SVM 會選的最佳超平面：margin 最大。</span>加粗外框的點就是決定這條線的「支持向量」，其他點移動一點都不影響結果。';
      }
      out.innerHTML = html;
    }
    makeData();
    bindRange(angIn, (v) => { alpha = v; isBest = false; draw(); });
    bindRange(offIn, (v) => { off = v; isBest = false; draw(); }, (v) => fmt(v, 2));
    $('#svm-best').addEventListener('click', () => {
      if (!best) return;
      alpha = best.a; off = best.o; isBest = true;
      angIn.value = Math.round(alpha); offIn.value = off;
      document.querySelector('[data-for="svm-ang"]').textContent = fmt(alpha, 1);
      document.querySelector('[data-for="svm-off"]').textContent = fmt(off, 2);
      draw();
    });
    $('#svm-new').addEventListener('click', () => { makeData(); isBest = false; draw(); });
    onRedraw(draw);
  })();

  /* ===== Kernel Trick ===== */
  (function kernel() {
    const canvas = $('#k-canvas');
    const red = [-1.5, -1, -0.5, 0, 0.4, 1.1, 1.6];
    const blue = [-3.4, -2.9, -2.4, 2.3, 2.8, 3.3, 3.7];
    let t = 0, target = 0, anim = null;
    const b1 = $('#k-1d'), b2 = $('#k-2d');
    function draw() {
      const col = colors();
      const f = frame(canvas, 0.45, [-4.2, 4.2], [-1.5, 14.5], 22);
      const { ctx } = f;
      line(ctx, f.X(-4.2), f.Y(0), f.X(4.2), f.Y(0), col.text2, 1);
      ctx.fillStyle = col.text2; ctx.fillText('x', f.X(4.05), f.Y(0) - 6);
      if (t > 0.02) {
        line(ctx, f.X(0), f.Y(-1), f.X(0), f.Y(14.3), col.border, 1);
        ctx.fillStyle = col.text2; ctx.globalAlpha = t; ctx.fillText('x²', f.X(0) + 6, f.Y(14));
        ctx.save(); ctx.strokeStyle = col.border; ctx.setLineDash([3, 4]); ctx.beginPath();
        for (let x = -3.8; x <= 3.8; x += 0.05) { const px = f.X(x), py = f.Y(t * x * x); x === -3.8 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
        ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
      }
      red.forEach((x) => dot(ctx, f.X(x), f.Y(t * x * x), 6, col.a));
      blue.forEach((x) => dot(ctx, f.X(x), f.Y(t * x * x), 6, col.b));
      ctx.font = '14px system-ui, sans-serif';
      if (t > 0.98) {
        line(ctx, f.X(-4.2), f.Y(3.9), f.X(4.2), f.Y(3.9), col.pos, 2.5, [8, 5]);
        ctx.fillStyle = col.pos; ctx.fillText('x² = 3.9：一條直線就分開了', f.X(-4.1), f.Y(3.9) - 8);
      } else if (t < 0.02) {
        ctx.fillStyle = col.text2;
        ctx.fillText('紅點在中間、藍點在兩側：一個門檻值怎麼切都切不開', f.X(-4.1), f.Y(8));
      }
    }
    function go(to) {
      target = to;
      b1.setAttribute('aria-pressed', String(to === 0));
      b2.setAttribute('aria-pressed', String(to === 1));
      cancelAnimationFrame(anim);
      const step = () => {
        t += (target - t) * 0.15;
        if (Math.abs(target - t) < 0.01) t = target;
        draw();
        if (t !== target) anim = requestAnimationFrame(step);
      };
      step();
    }
    b1.addEventListener('click', () => go(0));
    b2.addEventListener('click', () => go(1));
    onRedraw(draw);
  })();

  /* ===== KNN ===== */
  (function knn() {
    const canvas = $('#knn-canvas'), out = $('#knn-out');
    const kIn = $('#knn-k'), mIn = $('#knn-m'), modeIn = $('#knn-mode');
    let pts = [], q = { x: 0.2, y: 0.3 }, K = 5, f = null, dragging = false;
    function reset() {
      const r = rng(42);
      pts = [];
      for (let i = 0; i < 18; i++) pts.push({ x: -1.1 + gauss(r) * 0.9, y: 0.4 + gauss(r) * 0.75, c: 0 });
      for (let i = 0; i < 18; i++) pts.push({ x: 1.2 + gauss(r) * 0.9, y: -0.3 + gauss(r) * 0.75, c: 1 });
    }
    const dist = (a, b) => mIn.value === 'e' ? Math.hypot(a.x - b.x, a.y - b.y) : Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    function classify(p) {
      const ds = pts.map((o, i) => ({ d: dist(p, o), i })).sort((a, b) => a.d - b.d);
      const nb = ds.slice(0, Math.min(K, ds.length));
      const v = [0, 0];
      nb.forEach(({ i }) => v[pts[i].c]++);
      return { nb, v, r: nb.length ? nb[nb.length - 1].d : 0, cls: v[0] > v[1] ? 0 : v[1] > v[0] ? 1 : -1 };
    }
    function draw() {
      const col = colors();
      f = frame(canvas, 0.6, [-4, 4]);
      const { ctx } = f;
      // 決策區域
      const cell = 10;
      ctx.globalAlpha = 0.13;
      for (let px = 0; px < f.w; px += cell) for (let py = 0; py < f.h; py += cell) {
        const c = classify({ x: f.ix(px + cell / 2), y: f.iy(py + cell / 2) }).cls;
        ctx.fillStyle = c === 0 ? col.a : c === 1 ? col.b : col.text2;
        ctx.fillRect(px, py, cell, cell);
      }
      ctx.globalAlpha = 1;
      const res = classify(q);
      // 鄰居範圍
      ctx.save(); ctx.strokeStyle = col.text; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath();
      const rx = res.r * f.sx;
      if (mIn.value === 'e') ctx.arc(f.X(q.x), f.Y(q.y), rx, 0, Math.PI * 2);
      else { ctx.moveTo(f.X(q.x) + rx, f.Y(q.y)); ctx.lineTo(f.X(q.x), f.Y(q.y) - rx); ctx.lineTo(f.X(q.x) - rx, f.Y(q.y)); ctx.lineTo(f.X(q.x), f.Y(q.y) + rx); ctx.closePath(); }
      ctx.stroke(); ctx.restore();
      const nbSet = new Set(res.nb.map((n) => n.i));
      res.nb.forEach(({ i }) => line(ctx, f.X(q.x), f.Y(q.y), f.X(pts[i].x), f.Y(pts[i].y), col.text2, 1));
      pts.forEach((p, i) => dot(ctx, f.X(p.x), f.Y(p.y), nbSet.has(i) ? 6.5 : 5, p.c === 0 ? col.a : col.b, nbSet.has(i) ? col.text : null));
      // 星號
      const sc = res.cls === 0 ? col.a : res.cls === 1 ? col.b : col.text2;
      ctx.font = 'bold 26px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = col.surface; ctx.strokeText('★', f.X(q.x), f.Y(q.y));
      ctx.fillStyle = sc; ctx.fillText('★', f.X(q.x), f.Y(q.y));
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      let html = `最近的 ${res.nb.length} 個鄰居：<span style="color:${col.a};font-weight:700">紅 ${res.v[0]}</span> 票、<span style="color:${col.b};font-weight:700">藍 ${res.v[1]}</span> 票　→ `;
      html += res.cls === -1 ? '<span class="bad">平手！無法決定</span>' : `新樣本判為 <strong style="color:${sc}">${res.cls === 0 ? '紅' : '藍'}</strong>`;
      if (res.cls === -1) html += '<br><span class="muted">這就是講義說 K 通常設為奇數的原因（二元分類時奇數不會平手）。</span>';
      else if (K % 2 === 0) html += '<br><span class="muted">K 是偶數，有機會平手：背景的灰色區域就是會平手的位置。</span>';
      html += `<br><span class="muted">預測一次就要算 ${pts.length} 個距離：資料越多越慢，這是 KNN 的缺點之一。</span>`;
      out.innerHTML = html;
    }
    canvas.addEventListener('pointerdown', (ev) => {
      if (!f) return;
      const p = pointer(canvas, ev);
      const d = { x: f.ix(p.x), y: f.iy(p.y) };
      if (modeIn.value === 'q') { q = d; dragging = true; canvas.setPointerCapture(ev.pointerId); }
      else pts.push({ ...d, c: modeIn.value === 'a' ? 0 : 1 });
      draw();
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const p = pointer(canvas, ev);
      q = { x: f.ix(p.x), y: f.iy(p.y) };
      draw();
    });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    bindRange(kIn, (v) => { K = v; if (f) draw(); });
    mIn.addEventListener('change', draw);
    $('#knn-reset').addEventListener('click', () => { reset(); draw(); });
    reset();
    onRedraw(draw);
  })();

  /* ===== PCA ===== */
  (function pca() {
    const canvas = $('#pca-canvas'), out = $('#pca-out'), angIn = $('#pca-ang'), projIn = $('#pca-proj');
    const r = rng(11);
    let pts = [];
    const rot = 28 * Math.PI / 180;
    for (let i = 0; i < 40; i++) {
      const u = gauss(r) * 1.5, v = gauss(r) * 0.4;
      pts.push({ x: u * Math.cos(rot) - v * Math.sin(rot), y: u * Math.sin(rot) + v * Math.cos(rot) });
    }
    const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, my = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    pts = pts.map((p) => ({ x: p.x - mx, y: p.y - my }));
    const n = pts.length;
    const Sxx = pts.reduce((a, p) => a + p.x * p.x, 0) / n;
    const Syy = pts.reduce((a, p) => a + p.y * p.y, 0) / n;
    const Sxy = pts.reduce((a, p) => a + p.x * p.y, 0) / n;
    const total = Sxx + Syy;
    let bestAng = 0.5 * Math.atan2(2 * Sxy, Sxx - Syy) * 180 / Math.PI;
    if (bestAng < 0) bestAng += 180;
    let ang = 100;
    const varAt = (a) => { const t = a * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return Sxx * c * c + 2 * Sxy * c * s + Syy * s * s; };
    function draw() {
      const col = colors();
      const f = frame(canvas, 0.6, [-4.5, 4.5]);
      const { ctx } = f;
      const t = ang * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t);
      line(ctx, f.X(-ux * 10), f.Y(-uy * 10), f.X(ux * 10), f.Y(uy * 10), col.accent, 2.5);
      pts.forEach((p) => {
        const k = p.x * ux + p.y * uy;
        if (projIn.checked) {
          line(ctx, f.X(p.x), f.Y(p.y), f.X(k * ux), f.Y(k * uy), col.border, 1);
          dot(ctx, f.X(k * ux), f.Y(k * uy), 3.5, col.accent);
        }
        dot(ctx, f.X(p.x), f.Y(p.y), 4.5, col.c);
      });
      const v = varAt(ang), best = varAt(bestAng);
      let html = `投影後的變異量 = <strong>${fmt(v, 2)}</strong>，保留了總變異的 <span class="big">${Math.round((v / total) * 100)}%</span>`;
      html += `<br><span class="muted">第一主成分可以保留 ${Math.round((best / total) * 100)}%；丟掉的 ${Math.round(((total - v) / total) * 100)}% 就是降維造成的「訊息遺失」。</span>`;
      if (Math.abs(ang - bestAng) < 1.5) html += '<br><span class="good">這就是第一主成分：資料變異性最大的方向。</span>';
      out.innerHTML = html;
    }
    bindRange(angIn, (a) => { ang = a; draw(); });
    projIn.addEventListener('change', draw);
    $('#pca-best').addEventListener('click', () => {
      ang = bestAng; angIn.value = Math.round(bestAng);
      document.querySelector('[data-for="pca-ang"]').textContent = fmt(bestAng, 1);
      draw();
    });
    onRedraw(draw);
  })();

  /* ===== 距離比較 ===== */
  (function distance() {
    const canvas = $('#d-canvas'), out = $('#d-out');
    const inp = { bx: $('#d-bx'), by: $('#d-by'), cx: $('#d-cx'), cy: $('#d-cy') };
    let f = null, drag = null;
    const P = () => ({ B: { x: +inp.bx.value, y: +inp.by.value }, C: { x: +inp.cx.value, y: +inp.cy.value } });
    function draw() {
      const col = colors();
      f = frame(canvas, 0.66, [-1, 13]);
      const { ctx } = f;
      // 格線
      for (let x = 0; x <= 12; x++) line(ctx, f.X(x), f.Y(f.y0), f.X(x), f.Y(f.y1), col.border, x === 0 ? 1.5 : 0.5);
      for (let y = Math.ceil(f.y0); y <= f.y1; y++) line(ctx, f.X(-1), f.Y(y), f.X(13), f.Y(y), col.border, y === 0 ? 1.5 : 0.5);
      const { B, C } = P();
      [[B, col.a, 'B'], [C, col.b, 'C']].forEach(([p, c, name]) => {
        line(ctx, f.X(0), f.Y(0), f.X(p.x), f.Y(0), c, 2, [5, 4]);
        line(ctx, f.X(p.x), f.Y(0), f.X(p.x), f.Y(p.y), c, 2, [5, 4]);
        line(ctx, f.X(0), f.Y(0), f.X(p.x), f.Y(p.y), c, 2.5);
        dot(ctx, f.X(p.x), f.Y(p.y), 7, c);
        ctx.fillStyle = col.text; ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(`${name}(${p.x},${p.y})`, f.X(p.x) + 9, f.Y(p.y) - 8);
      });
      dot(ctx, f.X(0), f.Y(0), 6, col.text);
      ctx.fillText('A', f.X(0) + 8, f.Y(0) + 16);
      const eB = Math.hypot(B.x, B.y), eC = Math.hypot(C.x, C.y);
      const mB = Math.abs(B.x) + Math.abs(B.y), mC = Math.abs(C.x) + Math.abs(C.y);
      const verdict = (b, c) => Math.abs(b - c) < 1e-9 ? '一樣遠' : b > c ? '<strong style="color:var(--c-a)">B</strong> 比較遠' : '<strong style="color:var(--c-b)">C</strong> 比較遠';
      out.innerHTML = '<div><strong>歐幾里得</strong>（實線）</div><div id="d-e"></div><div>→ ' + verdict(eB, eC) + `（差 ${fmt(Math.abs(eB - eC), 2)}）</div>` +
        '<div style="margin-top:8px"><strong>曼哈頓</strong>（虛線，只能走直角）</div><div id="d-m"></div><div>→ ' + verdict(mB, mC) + `（差 ${fmt(Math.abs(mB - mC), 2)}）</div>`;
      tex($('#d-e'), `d(A,B)=\\sqrt{${B.x}^2+${B.y}^2}\\approx${fmt(eB, 2)},\\; d(A,C)\\approx${fmt(eC, 2)}`);
      tex($('#d-m'), `d(A,B)=|${B.x}|+|${B.y}|=${mB},\\; d(A,C)=${mC}`);
    }
    Object.values(inp).forEach((i) => i.addEventListener('input', draw));
    $('#d-reset').addEventListener('click', () => { inp.bx.value = 10; inp.by.value = 1; inp.cx.value = 7; inp.cy.value = 7; draw(); });
    canvas.addEventListener('pointerdown', (ev) => {
      const p = pointer(canvas, ev), { B, C } = P();
      const near = (q) => Math.hypot(f.X(q.x) - p.x, f.Y(q.y) - p.y) < 18;
      drag = near(B) ? 'b' : near(C) ? 'c' : null;
      if (drag) canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const p = pointer(canvas, ev);
      const x = Math.max(0, Math.min(12, Math.round(f.ix(p.x)))), y = Math.max(0, Math.min(Math.floor(f.y1), Math.round(f.iy(p.y))));
      inp[drag + 'x'].value = x; inp[drag + 'y'].value = y;
      draw();
    });
    canvas.addEventListener('pointerup', () => { drag = null; });
    onRedraw(draw);
  })();

  /* ===== Softmax ===== */
  (function softmax() {
    const zs = [$('#s-z1'), $('#s-z2'), $('#s-z3')], yIn = $('#s-y');
    const bars = $('#s-bars'), out = $('#s-out');
    const rows = [0, 1, 2].map((i) => {
      const fill = el('div', { class: 'bar-fill' });
      const v = el('span', { class: 'val' });
      bars.append(el('div', { class: 'bar-row' }, [el('span', { text: `第 ${i + 1} 類` }), el('div', { class: 'bar-track' }, [fill]), v]));
      return { fill, v };
    });
    function upd() {
      const z = zs.map((x) => +x.value), y = +yIn.value;
      const e = z.map(Math.exp), S = e.reduce((a, b) => a + b, 0), p = e.map((x) => x / S);
      rows.forEach((r, i) => { r.fill.style.width = (p[i] * 100) + '%'; r.fill.classList.toggle('true', i === y); r.v.textContent = fmt(p[i], 3); });
      const L = -Math.log(p[y]);
      out.innerHTML = '<div id="s-t1"></div><div id="s-t2"></div>';
      tex($('#s-t1'), `\\text{softmax}(z_${y + 1})=\\frac{e^{${fmt(z[y], 1)}}}{${z.map((v) => `e^{${fmt(v, 1)}}`).join('+')}}=\\frac{${fmt(e[y], 3)}}{${fmt(S, 3)}}\\approx${fmt(p[y], 3)}`, true);
      tex($('#s-t2'), `L_{CE}=-\\ln(${fmt(p[y], 3)})\\approx${fmt(L, 3)}`, true);
      out.insertAdjacentHTML('beforeend', `<div class="muted">綠色長條是正確答案。對正確答案的機率越低，損失越大${L > 2 ? '（現在的預測很沒信心，罰得很重）' : ''}。</div>`);
    }
    zs.forEach((z) => bindRange(z, upd, (v) => fmt(v, 1)));
    yIn.addEventListener('change', upd);
  })();

  /* ===== Sigmoid ===== */
  (function sigmoid() {
    const canvas = $('#sig-canvas'), zIn = $('#sig-z'), out = $('#sig-out');
    const sg = (z) => 1 / (1 + Math.exp(-z));
    let z = 0;
    function draw() {
      const col = colors();
      const f = frame(canvas, 0.35, [-8, 8], [-0.1, 1.1], 20);
      const { ctx } = f;
      line(ctx, f.X(-8), f.Y(0), f.X(8), f.Y(0), col.border, 1);
      line(ctx, f.X(-8), f.Y(1), f.X(8), f.Y(1), col.border, 1, [3, 4]);
      line(ctx, f.X(0), f.Y(-0.1), f.X(0), f.Y(1.1), col.border, 1);
      ctx.strokeStyle = col.accent; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = -8; x <= 8; x += 0.05) { x === -8 ? ctx.moveTo(f.X(x), f.Y(sg(x))) : ctx.lineTo(f.X(x), f.Y(sg(x))); }
      ctx.stroke();
      const s = sg(z), k = s * (1 - s);
      line(ctx, f.X(z - 1.5), f.Y(s - 1.5 * k), f.X(z + 1.5), f.Y(s + 1.5 * k), col.c, 2);
      dot(ctx, f.X(z), f.Y(s), 6, col.c);
      out.innerHTML = '';
      const d = el('div'); out.append(d);
      tex(d, `\\sigma(${fmt(z, 1)})=${fmt(s, 4)},\\quad \\text{斜率 } \\sigma(1-\\sigma)=${fmt(k, 4)}`);
      out.append(el('div', { class: 'muted', text: Math.abs(z) > 4 ? '曲線已經很平：梯度接近 0，權重幾乎不會更新（梯度消失）。' : s > 0.5 ? '輸出 > 0.5 → 判為正類。' : s < 0.5 ? '輸出 < 0.5 → 判為負類。' : '剛好 0.5：模型完全拿不定主意。' }));
    }
    bindRange(zIn, (v) => { z = v; draw(); }, (v) => fmt(v, 1));
    onRedraw(draw);
  })();

  /* ===== 梯度下降 ===== */
  (function gd() {
    const canvas = $('#gd-canvas'), out = $('#gd-out');
    const optIn = $('#gd-opt'), lrIn = $('#gd-lr'), w0In = $('#gd-w0'), noiseIn = $('#gd-noise');
    const L = (w) => 0.1 * w ** 4 - w * w + 0.9 * w;
    const dL = (w) => 0.4 * w ** 3 - 2 * w + 0.9;
    const newton = (w) => { for (let i = 0; i < 50; i++) w -= dL(w) / (1.2 * w * w - 2); return w; };
    const gMin = newton(-2.3), lMin = newton(2.1);
    let st, timer = null, r = rng(5);
    function reset() {
      stop();
      r = rng(Date.now()); // SGD 每次重跑的雜訊都不同
      st = { w: +w0In.value, t: 0, v: 0, m: 0, s: 0, hist: [+w0In.value], status: '' };
      draw();
    }
    function step() {
      if (st.status === 'diverged') return false;
      const lr = +lrIn.value, opt = optIn.value;
      let g = dL(st.w);
      if (opt === 'sgd') g += gauss(r) * +noiseIn.value;
      st.t++;
      const prev = st.w;
      if (opt === 'gd' || opt === 'sgd') st.w -= lr * g;
      else if (opt === 'mom') { st.v = 0.9 * st.v + g; st.w -= lr * st.v; }
      else if (opt === 'rms') { st.s = 0.9 * st.s + 0.1 * g * g; st.w -= lr * g / (Math.sqrt(st.s) + 1e-8); }
      else { st.m = 0.9 * st.m + 0.1 * g; st.s = 0.999 * st.s + 0.001 * g * g; const mh = st.m / (1 - 0.9 ** st.t), vh = st.s / (1 - 0.999 ** st.t); st.w -= lr * mh / (Math.sqrt(vh) + 1e-8); }
      st.hist.push(st.w);
      if (!isFinite(st.w) || Math.abs(st.w) > 6) { st.status = 'diverged'; return false; }
      const settled = Math.abs(st.w - prev) < 1e-4 && Math.abs(dL(st.w)) < 1e-2;
      if (settled && opt !== 'sgd') { st.status = 'settled'; return false; }
      if (st.t >= 300) { st.status = 'max'; return false; }
      return true;
    }
    function stop() { clearInterval(timer); timer = null; $('#gd-run').textContent = '▶ 執行'; }
    function draw() {
      const col = colors();
      const f = frame(canvas, 0.45, [-3.8, 3.8], [-5.5, 10], 20);
      const { ctx } = f;
      line(ctx, f.X(-3.8), f.Y(0), f.X(3.8), f.Y(0), col.border, 1);
      ctx.strokeStyle = col.text2; ctx.lineWidth = 2; ctx.beginPath();
      for (let w = -3.8; w <= 3.8; w += 0.02) { const y = Math.min(10, L(w)); w === -3.8 ? ctx.moveTo(f.X(w), f.Y(y)) : ctx.lineTo(f.X(w), f.Y(y)); }
      ctx.stroke();
      ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = col.pos; ctx.textAlign = 'center';
      ctx.fillText('全域最小值', f.X(gMin), f.Y(L(gMin)) + 18);
      ctx.fillStyle = col.c; ctx.fillText('局部最小值', f.X(lMin), f.Y(L(lMin)) + 18);
      ctx.textAlign = 'start';
      const h = st.hist.filter((w) => Math.abs(w) <= 3.8);
      ctx.save(); ctx.strokeStyle = col.accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2; ctx.beginPath();
      h.forEach((w, i) => { const px = f.X(w), py = f.Y(Math.min(10, L(w))); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.stroke(); ctx.restore();
      h.forEach((w) => dot(ctx, f.X(w), f.Y(Math.min(10, L(w))), 2.5, col.accent));
      if (Math.abs(st.w) <= 3.8) dot(ctx, f.X(st.w), f.Y(Math.min(10, L(st.w))), 7, col.neg, col.surface);
      let html = `第 ${st.t} 步　w = <strong>${fmt(st.w, 3)}</strong>　L(w) = ${fmt(L(st.w), 3)}　梯度 = ${fmt(dL(st.w), 3)}`;
      const where = Math.abs(st.w - gMin) < 0.25 ? 'g' : Math.abs(st.w - lMin) < 0.25 ? 'l' : '';
      if (st.status === 'diverged') html += '<br><span class="bad">發散了！學習率太大，每一步都跨過頭，越跳越遠。</span>';
      else if (st.status || (!timer && st.t > 0)) {
        if (st.status === 'max' && optIn.value !== 'sgd') html += '<br><span class="bad">300 步還沒收斂</span>：學習率太大，每一步都跨過谷底，一直來回震盪。';
        else if (where === 'g') html += '<br><span class="good">到達全域最小值 ✓</span>';
        else if (where === 'l') html += '<br><span class="bad">卡在局部最小值</span>：梯度是 0，一般梯度下降就不會再動了。';
      }
      out.innerHTML = html;
    }
    $('#gd-run').addEventListener('click', () => {
      if (timer) { stop(); draw(); return; }
      if (st.status) reset();
      $('#gd-run').textContent = '❚❚ 暫停';
      timer = setInterval(() => { const go = step(); draw(); if (!go) { stop(); draw(); } }, 40);
    });
    $('#gd-step').addEventListener('click', () => { stop(); if (st.status) return; step(); draw(); });
    $('#gd-reset').addEventListener('click', reset);
    const noiseLabel = $('#gd-noise-l');
    const syncNoise = () => { noiseLabel.style.display = optIn.value === 'sgd' ? '' : 'none'; };
    optIn.addEventListener('change', () => { syncNoise(); reset(); });
    syncNoise();
    bindRange(lrIn, () => { if (st) reset(); }, (v) => fmt(v, 3));
    bindRange(w0In, () => { if (st) reset(); }, (v) => fmt(v, 1));
    bindRange(noiseIn, () => {}, (v) => fmt(v, 1));
    st = { w: +w0In.value, t: 0, v: 0, m: 0, s: 0, hist: [+w0In.value], status: '' };
    onRedraw(draw);
  })();

  /* ===== 編碼 ===== */
  (function encoding() {
    const inp = $('#enc-in'), out = $('#enc-out'), note = $('#enc-note');
    function upd() {
      const cls = [...new Set(inp.value.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean))];
      const n = cls.length;
      if (!n) { out.innerHTML = ''; note.textContent = '請輸入至少一個類別。'; return; }
      const show = Math.min(n, 12);
      let html = '<table><tr><th>類別</th><th>Label Encoding</th><th>One-Hot Encoding</th></tr>';
      cls.slice(0, show).forEach((c, i) => {
        const oh = n <= 12 ? '(' + cls.map((_, j) => (j === i ? '<strong>1</strong>' : '0')).join(', ') + ')' : `長度 ${n} 的向量，第 ${i + 1} 個是 1，其他 ${n - 1} 個是 0`;
        html += `<tr><td>${c.replace(/</g, '&lt;')}</td><td class="mono">${i}</td><td class="mono">${oh}</td></tr>`;
      });
      if (n > show) html += `<tr><td colspan="3" class="muted">…還有 ${n - show} 個類別</td></tr>`;
      out.innerHTML = html + '</table>';
      note.innerHTML = `Label Encoding：每個標籤 1 個數字，但暗示了 ${cls.slice(0, 3).map((c, i) => `${c}(${i})`).join(' &lt; ')} 的<strong>虛假順序</strong>。` +
        `One-Hot：每個標籤是 <strong>${n} 維</strong>向量，類別越多越長（ImageNet 有 1000 類 → 1000 維），這就是<strong>維度爆炸</strong>。`;
    }
    inp.addEventListener('input', upd);
    upd();
  })();

  /* ===== 評估指標 ===== */
  (function metrics() {
    const ids = ['tp', 'fp', 'fn', 'tn'], inp = {};
    ids.forEach((k) => { inp[k] = $('#m-' + k); inp[k].addEventListener('input', upd); });
    function upd() {
      const v = {}; ids.forEach((k) => { v[k] = Math.max(0, +inp[k].value || 0); });
      const out = $('#m-out');
      out.innerHTML = '<div id="m-p"></div><div id="m-r"></div><div id="m-a"></div>';
      const frac = (a, b) => b === 0 ? '\\text{（分母為 0）}' : `\\frac{${a}}{${b}}=${fmt(a / b, 3)}`;
      tex($('#m-p'), `\\text{Precision}=\\frac{TP}{TP+FP}=${frac(v.tp, v.tp + v.fp)}`);
      tex($('#m-r'), `\\text{Recall}=\\frac{TP}{TP+FN}=${frac(v.tp, v.tp + v.fn)}`);
      tex($('#m-a'), `\\text{Accuracy}=\\frac{TP+TN}{\\text{全部}}=${frac(v.tp + v.tn, v.tp + v.tn + v.fp + v.fn)}`);
      out.insertAdjacentHTML('beforeend', '<div class="muted" style="margin-top:6px">Precision 看「預測為正」那一欄；Recall 看「實際為正」那一列。</div>');
    }
    upd();
  })();
})();
