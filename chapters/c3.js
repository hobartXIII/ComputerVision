/* C3 互動元件 */
(function () {
  'use strict';
  const { $, $$, el, fmt, int, cssVar, tex, setupCanvas, onRedraw, rng, gauss, bindRange } = CV;

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
  function dot(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke(); }
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
  function colors() {
    return { a: cssVar('--c-a'), b: cssVar('--c-b'), c: cssVar('--c-c'), text: cssVar('--text'), text2: cssVar('--text-2'), border: cssVar('--border'), accent: cssVar('--accent'), pos: cssVar('--pos'), neg: cssVar('--neg'), surface: cssVar('--surface'), surface2: cssVar('--surface-2') };
  }
  const parseList = (s) => s.split(/[,，\s]+/).filter(Boolean).map(Number).filter((v) => isFinite(v));
  const safeDiv = (a, b) => (b === 0 ? NaN : a / b);
  const f3 = (v) => (isNaN(v) ? '—' : fmt(v, 3));

  /* ===== MNIST 混淆矩陣 ===== */
  (function confusion() {
    const SUP = [980, 1135, 1032, 1010, 982, 892, 958, 1028, 974, 1009]; // MNIST 測試集各數字張數
    const BIG = { '4,9': 18, '7,2': 14, '9,4': 9, '3,5': 8, '8,3': 7, '5,3': 7, '2,7': 6 };
    const r = rng(7);
    const M = SUP.map((s, i) => {
      const row = Array(10).fill(0);
      for (let j = 0; j < 10; j++) if (j !== i) row[j] = BIG[i + ',' + j] ?? Math.floor(r() * r() * 4);
      row[i] = s - row.reduce((a, b) => a + b, 0);
      return row;
    });
    const colSum = (j) => M.reduce((a, row) => a + row[j], 0);
    const total = SUP.reduce((a, b) => a + b, 0);
    const correct = M.reduce((a, row, i) => a + row[i], 0);
    const errs = [];
    M.forEach((row, i) => row.forEach((v, j) => { if (i !== j) errs.push([v, i, j]); }));
    errs.sort((a, b) => b[0] - a[0]);
    let sel = { i: 4, j: 9 };

    const cellCss = 'padding:3px 6px;text-align:right;font-family:var(--mono);font-size:.82rem;cursor:pointer;border-bottom:0';
    function render() {
      const t = el('table', { style: 'width:auto' });
      const head = el('tr', {}, [el('th', { html: '真實＼預測', style: 'font-size:.8rem;padding:3px 6px' })]);
      for (let j = 0; j < 10; j++) head.append(el('th', { text: String(j), style: 'text-align:right;padding:3px 6px' + (j === sel.j ? ';color:var(--accent)' : '') }));
      t.append(head);
      M.forEach((row, i) => {
        const tr = el('tr', {}, [el('th', { text: String(i), style: 'padding:3px 6px' + (i === sel.i ? ';color:var(--accent)' : '') })]);
        row.forEach((v, j) => {
          let bg = 'transparent', color = '';
          if (i === j) bg = 'color-mix(in srgb, var(--pos) 30%, var(--surface-2))';
          else if (v > 0) bg = `color-mix(in srgb, var(--neg) ${Math.min(75, 8 + v * 3.6)}%, var(--surface))`;
          else color = ';color:var(--text-2)';
          const isSel = i === sel.i && j === sel.j;
          const td = el('td', {
            text: String(v),
            style: `${cellCss};background:${bg}${color}${isSel ? ';outline:2px solid var(--text);outline-offset:-2px;font-weight:700' : ''}`,
            title: `真實 ${i}，預測 ${j}：${v} 張`,
          });
          td.addEventListener('click', () => { sel = { i, j }; render(); });
          tr.append(td);
        });
        t.append(tr);
      });
      const grid = $('#cm-grid'); grid.innerHTML = ''; grid.append(t);

      const v = M[sel.i][sel.j];
      let html = sel.i === sel.j
        ? `<strong>對角線</strong>：數字 ${sel.i} 被正確判為 ${sel.i}，共 <strong>${int(v)}</strong> 張，Recall<sub>${sel.i}</sub> = ${int(v)} ／ ${int(SUP[sel.i])} = ${fmt(v / SUP[sel.i], 3)}`
        : `真實是 <strong>${sel.i}</strong>、被判成 <strong>${sel.j}</strong>：${v} 張，佔所有「${sel.i}」的 ${fmt((100 * v) / SUP[sel.i], 2)}%`;
      html += `<div style="margin-top:6px">最常見的錯誤：${errs.slice(0, 3).map(([n, i, j]) => `<strong>${i} → ${j}</strong>（${n} 張）`).join('、')}</div>`;
      html += `<div class="muted" style="margin-top:6px">整體 Accuracy = ${int(correct)} ／ ${int(total)} = ${fmt(correct / total, 4)}。光看這個數字，完全看不出「4 常被當成 9」。</div>`;
      $('#cm-out').innerHTML = html;

      const rep = el('table', { style: 'width:auto' });
      rep.append(el('tr', {}, ['', 'precision', 'recall', 'f1-score', 'support'].map((h, k) => el('th', { text: h, class: k ? 'num' : '' }))));
      let mp = 0, mr = 0, mf = 0, wp = 0, wr = 0, wf = 0;
      for (let k = 0; k < 10; k++) {
        const p = M[k][k] / colSum(k), rc = M[k][k] / SUP[k], f1 = (2 * p * rc) / (p + rc);
        mp += p / 10; mr += rc / 10; mf += f1 / 10;
        wp += (p * SUP[k]) / total; wr += (rc * SUP[k]) / total; wf += (f1 * SUP[k]) / total;
        const hl = k === sel.i || k === sel.j ? ';background:var(--accent-soft)' : '';
        rep.append(el('tr', {}, [String(k), p.toFixed(2), rc.toFixed(2), f1.toFixed(2), String(SUP[k])].map((x, c) => el('td', { text: x, class: c ? 'num' : '', style: 'padding:3px 12px' + hl }))));
      }
      const tail = [['accuracy', '', '', (correct / total).toFixed(2), String(total)], ['macro avg', mp, mr, mf, total], ['weighted avg', wp, wr, wf, total]];
      tail.forEach((row) => rep.append(el('tr', {}, row.map((x, c) => el('td', { text: typeof x === 'number' && c < 4 ? x.toFixed(2) : String(x), class: c ? 'num' : '', style: 'padding:3px 12px;' + (c ? '' : 'font-weight:600') })))));
      const box = $('#cm-report'); box.innerHTML = ''; box.append(rep);
    }
    render();
  })();

  /* ===== 門檻值與 Precision／Recall ===== */
  (function threshold() {
    // 標準常態反函數（Acklam 近似）
    function invNorm(p) {
      const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
      const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
      const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
      const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
      const pl = 0.02425;
      if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
      if (p > 1 - pl) return -invNorm(1 - p);
      const q = p - 0.5, r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    // 分數依常態分位數排列，讓門檻 0.5 剛好得到講義的 TP90 FN10 FP5 TN40
    const clamp = (v) => Math.min(0.98, Math.max(0.02, v));
    const sp = 0.18 / -invNorm(0.1), sn = 0.2 / invNorm(40 / 45);
    const POS = Array.from({ length: 100 }, (_, i) => clamp(0.68 + sp * invNorm((i + 0.5) / 100)));
    const NEG = Array.from({ length: 45 }, (_, i) => clamp(0.3 + sn * invNorm((i + 0.5) / 45)));
    const tIn = $('#thr-t'), canvas = $('#thr-canvas');
    let t = 0.5;
    function draw() {
      const col = colors();
      const f = frame(canvas, 0.42, [0, 1], [0, 1], [8, 12, 26, 12]);
      const { ctx, w, h } = f;
      const BW = 0.02, laneTop = [f.Y(1), f.Y(0.5)], laneH = f.Y(0.5) - f.Y(1);
      // 判為陽性的區域
      ctx.fillStyle = col.accent; ctx.globalAlpha = 0.08;
      ctx.fillRect(f.X(t), f.Y(1), f.X(1) - f.X(t), f.Y(0) - f.Y(1)); ctx.globalAlpha = 1;
      line(ctx, f.X(0), f.Y(0.5), f.X(1), f.Y(0.5), col.border, 1);
      line(ctx, f.X(0), f.Y(0), f.X(1), f.Y(0), col.border, 1);
      const rad = Math.max(2.2, Math.min(5, (f.X(BW) - f.X(0)) / 2 - 0.4));
      [[POS, col.a, '有 COVID（100 人）'], [NEG, col.b, '沒有（45 人）']].forEach(([arr, c, name], lane) => {
        const stacks = {};
        const base = laneTop[lane] + laneH - rad - 2;
        for (const s of arr) {
          const bin = Math.floor(s / BW), k = (stacks[bin] = (stacks[bin] || 0) + 1) - 1;
          const x = f.X((bin + 0.5) * BW), y = base - k * (2 * rad + 1);
          if (s >= t) dot(ctx, x, y, rad, c); else dot(ctx, x, y, rad - 0.8, null, c);
        }
        ctx.fillStyle = c; ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(name, f.X(0) + 2, laneTop[lane] + 14);
      });
      line(ctx, f.X(t), f.Y(1), f.X(t), f.Y(0), col.text, 2, [5, 4]);
      ctx.fillStyle = col.text2; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
      for (let v = 0; v <= 1.001; v += 0.25) ctx.fillText(fmt(v, 2), f.X(v), h - 8);
      ctx.textAlign = t > 0.8 ? 'right' : 'left';
      ctx.fillStyle = col.accent; ctx.fillText('判為陽性 →', f.X(t) + (t > 0.8 ? -6 : 6), f.Y(1) + 14);
      ctx.textAlign = 'start';
      void w;
    }
    function upd() {
      const TP = POS.filter((s) => s >= t).length, FN = 100 - TP, FP = NEG.filter((s) => s >= t).length, TN = 45 - FP;
      const P = safeDiv(TP, TP + FP), R = TP / 100, F1 = (2 * P * R) / (P + R);
      let html = `<div class="table-wrap" style="margin:0 0 8px"><table style="width:auto"><tr><th></th><th>預測：有</th><th>預測：沒有</th></tr>
        <tr><th>實際：有</th><td class="num">TP = <strong>${TP}</strong></td><td class="num">FN = <strong>${FN}</strong></td></tr>
        <tr><th>實際：沒有</th><td class="num">FP = <strong>${FP}</strong></td><td class="num">TN = <strong>${TN}</strong></td></tr></table></div>`;
      html += `Recall = ${TP}/100 = <strong>${f3(R)}</strong>　Precision = ${TP}/${TP + FP} = <strong>${f3(P)}</strong>　F1 = ${f3(F1)}<br>`;
      html += `FPR = ${FP}/45 = ${f3(FP / 45)}　Specificity = ${TN}/45 = ${f3(TN / 45)}　Accuracy = ${TP + TN}/145 = ${f3((TP + TN) / 145)}`;
      if (Math.abs(t - 0.5) < 1e-9) html += '<div class="good" style="margin-top:6px">✓ 與講義相同：TP 90、FN 10、FP 5、TN 40</div>';
      else if (t < 0.5) html += '<div style="margin-top:6px">門檻<strong>降低</strong> → 更多人被判陽性：漏掉的病人變少（Recall ↑），但誤報變多（Precision ↓）。看診篩檢通常選這邊。</div>';
      else html += '<div style="margin-top:6px">門檻<strong>提高</strong> → 只有很確定的才判陽性：誤報變少（Precision ↑），但漏掉更多病人（Recall ↓）。</div>';
      $('#thr-out').innerHTML = html;
    }
    bindRange(tIn, (v) => { t = v; draw(); upd(); }, (v) => v.toFixed(2));
    $('#thr-reset').addEventListener('click', () => { tIn.value = 0.5; tIn.dispatchEvent(new Event('input')); });
    onRedraw(draw);
  })();

  /* ===== 多項式擬合與 Overfitting ===== */
  (function overfit() {
    const LAMS = [0, 1e-5, 1e-4, 1e-3, 1e-2, 0.1, 1, 10];
    const truth = (x) => Math.sin(Math.PI * x) * 0.8;
    const dIn = $('#fit-d'), lIn = $('#fit-l'), canvas = $('#fit-canvas');
    let seed = 11, train, test;
    // MSE canvas 接在主畫布後面
    const mseCanvas = el('canvas', { id: 'fit-mse', style: 'margin-top:8px' });
    canvas.parentElement.after(el('div', { class: 'canvas-wrap', style: 'margin-top:8px' }, [mseCanvas]));
    function gen() {
      const r = rng(seed);
      train = Array.from({ length: 12 }, (_, i) => -1 + (2 * (i + 0.2 + 0.6 * r())) / 12).map((x) => [x, truth(x) + 0.2 * gauss(r)]);
      test = Array.from({ length: 40 }, () => -1 + 2 * r()).map((x) => [x, truth(x) + 0.2 * gauss(r)]);
    }
    function solve(A, b) {
      const n = b.length, M = A.map((row, i) => row.concat([b[i]]));
      for (let c = 0; c < n; c++) {
        let p = c;
        for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
        [M[c], M[p]] = [M[p], M[c]];
        for (let r = c + 1; r < n; r++) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
      }
      const x = Array(n).fill(0);
      for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j]; x[r] = s / M[r][r]; }
      return x;
    }
    // 最小化 MSE + λΣθ²（不懲罰常數項）
    function fit(d, lam) {
      const n = train.length, A = Array.from({ length: d + 1 }, () => Array(d + 1).fill(0)), b = Array(d + 1).fill(0);
      for (const [x, y] of train) {
        const p = Array.from({ length: d + 1 }, (_, k) => x ** k);
        for (let i = 0; i <= d; i++) { b[i] += (p[i] * y) / n; for (let j = 0; j <= d; j++) A[i][j] += (p[i] * p[j]) / n; }
      }
      for (let i = 0; i <= d; i++) A[i][i] += (i ? lam : 0) + 1e-12;
      return solve(A, b);
    }
    const predict = (th, x) => th.reduce((s, c, k) => s + c * x ** k, 0);
    const mse = (th, pts) => pts.reduce((s, [x, y]) => s + (predict(th, x) - y) ** 2, 0) / pts.length;
    function draw() {
      const col = colors(), d = +dIn.value, lam = LAMS[+lIn.value];
      const th = fit(d, lam);
      const f = frame(canvas, 0.5, [-1.05, 1.05], [-1.8, 1.8], [10, 10, 10, 10]);
      const { ctx } = f;
      line(ctx, f.X(-1.05), f.Y(0), f.X(1.05), f.Y(0), col.border, 1);
      const pts = (fn) => { const a = []; for (let x = -1.05; x <= 1.0501; x += 0.005) a.push([f.X(x), f.Y(Math.max(-1.8, Math.min(1.8, fn(x))))]); return a; };
      poly(ctx, pts(truth), col.text2, 1.2, [4, 4]);
      ctx.save(); ctx.beginPath(); ctx.rect(0, f.Y(1.8), f.w, f.Y(-1.8) - f.Y(1.8)); ctx.clip();
      poly(ctx, pts((x) => predict(th, x)), col.accent, 2.4); ctx.restore();
      test.forEach(([x, y]) => dot(ctx, f.X(x), f.Y(y), 3.2, null, col.text2));
      train.forEach(([x, y]) => dot(ctx, f.X(x), f.Y(y), 4.5, col.a));
      ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = col.text2;
      ctx.fillText('虛線：真實規律　藍線：模型　紅點：訓練　灰圈：測試', 12, 18);

      // 各次方的 MSE 曲線
      const rows = [];
      for (let k = 1; k <= 11; k++) { const t = fit(k, lam); rows.push([k, mse(t, train), mse(t, test)]); }
      const lo = Math.log10(1e-3), hi = Math.log10(10);
      const g = frame(mseCanvas, 0.3, [0.5, 11.5], [lo, hi], [10, 12, 22, 40]);
      const c2 = g.ctx, ly = (v) => g.Y(Math.max(lo, Math.min(hi, Math.log10(Math.max(v, 1e-6)))));
      c2.font = '11px system-ui, sans-serif'; c2.fillStyle = col.text2; c2.textAlign = 'right';
      [0.001, 0.01, 0.1, 1, 10].forEach((v) => { line(c2, g.X(0.5), ly(v), g.X(11.5), ly(v), col.border, 0.6); c2.fillText(String(v), g.X(0.5) - 4, ly(v) + 4); });
      c2.textAlign = 'center';
      for (let k = 1; k <= 11; k++) c2.fillText(String(k), g.X(k), g.h - 6);
      line(c2, g.X(d), g.Y(lo), g.X(d), g.Y(hi), col.text, 1.2, [3, 3]);
      poly(c2, rows.map(([k, a]) => [g.X(k), ly(a)]), col.a, 2);
      poly(c2, rows.map(([k, , b]) => [g.X(k), ly(b)]), col.text2, 2);
      rows.forEach(([k, a, b]) => { dot(c2, g.X(k), ly(a), 3, col.a); dot(c2, g.X(k), ly(b), 3, col.text2); });
      c2.textAlign = 'left'; c2.fillStyle = col.a; c2.fillText('訓練 MSE', g.X(0.6), g.Y(hi) + 12);
      c2.fillStyle = col.text2; c2.fillText('測試 MSE', g.X(0.6) + 64, g.Y(hi) + 12);

      const trE = mse(th, train), teE = mse(th, test), best = rows.reduce((a, b) => (b[2] < a[2] ? b : a));
      let html = `次方 ${d}（${d + 1} 個參數）、λ = ${lam}　訓練 MSE = <strong>${fmt(trE, 4)}</strong>　測試 MSE = <strong>${fmt(teE, 4)}</strong>`;
      if (trE > 0.08) html += '<br><span class="bad">擬合不足（Underfitting）</span>：連訓練資料都學不好' + (lam >= 1 ? '，λ 太大，權重被壓得太小。' : '，模型太簡單。');
      else if (teE > 1.5 * best[2] && teE > 1.5 * trE) html += '<br><span class="bad">過度擬合（Overfitting）</span>：訓練誤差很小，但測試誤差變大，曲線為了穿過每個訓練點而亂彎。試試把 λ 調大。';
      else html += '<br><span class="good">泛化良好</span>：訓練與測試誤差都低。';
      html += `<div class="muted" style="margin-top:4px">目前 λ 下，測試誤差最低的是 ${best[0]} 次方。</div>`;
      $('#fit-out').innerHTML = html;
    }
    bindRange(dIn, () => train && draw());
    bindRange(lIn, () => train && draw(), (v) => String(LAMS[v]));
    $('#fit-new').addEventListener('click', () => { seed++; gen(); draw(); });
    gen();
    onRedraw(draw);
  })();

  /* ===== Dropout ===== */
  (function dropout() {
    const SIZES = [4, 6, 6, 2], NS = 'http://www.w3.org/2000/svg';
    const pIn = $('#drop-p'), box = $('#drop-svg');
    let mode = 'train', r = rng(21), off = [[], [], [], []], batch = 1;
    // 每個隱藏層關閉 round(rate × n) 個節點，位置隨機
    const sample = () => {
      off = SIZES.map((n, l) => {
        const k = l === 1 || l === 2 ? Math.round(+pIn.value * n) : 0;
        const idx = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
        idx.length = k;
        return Array.from({ length: n }, (_, i) => idx.includes(i));
      });
    };
    const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    function render() {
      const W = 420, H = 230, test = mode === 'test';
      const pos = SIZES.map((n, l) => Array.from({ length: n }, (_, i) => [50 + l * 107, H / 2 + (i - (n - 1) / 2) * 34]));
      const isOff = (l, i) => !test && off[l][i];
      const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'plot', role: 'img', 'aria-label': 'Dropout 網路示意圖', style: 'max-width:560px;margin:0 auto' });
      let edges = 0, total = 0;
      for (let l = 0; l < 3; l++) pos[l].forEach((a, i) => pos[l + 1].forEach((b, j) => {
        total++;
        const dead = isOff(l, i) || isOff(l + 1, j);
        if (!dead) edges++;
        svg.append(svgEl('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: dead ? 'stroke:var(--border);stroke-width:.6;stroke-dasharray:2 3' : 'stroke:var(--accent);stroke-width:1.1;opacity:.55' }));
      }));
      const names = ['輸入層', '隱藏層 1', '隱藏層 2', '輸出層'];
      pos.forEach((layer, l) => {
        layer.forEach(([x, y], i) => {
          const dead = isOff(l, i);
          svg.append(svgEl('circle', { cx: x, cy: y, r: 11, style: dead ? 'fill:var(--surface-2);stroke:var(--border);stroke-width:1.5' : `fill:${l === 1 || l === 2 ? 'var(--accent)' : 'var(--text-2)'};stroke:var(--surface);stroke-width:2` }));
          if (dead) {
            svg.append(svgEl('line', { x1: x - 6, y1: y - 6, x2: x + 6, y2: y + 6, style: 'stroke:var(--neg);stroke-width:2.2' }));
            svg.append(svgEl('line', { x1: x - 6, y1: y + 6, x2: x + 6, y2: y - 6, style: 'stroke:var(--neg);stroke-width:2.2' }));
          }
        });
        const t = svgEl('text', { x: pos[l][0][0], y: 18, 'text-anchor': 'middle', style: 'fill:var(--text-2);font-size:12px' });
        t.textContent = names[l]; svg.append(t);
      });
      box.innerHTML = ''; box.append(svg);
      const hid = off[1].concat(off[2]), nOff = test ? 0 : hid.filter(Boolean).length;
      let html = test
        ? '<strong>測試模式</strong>：所有 12 個隱藏節點都打開，用完整的網路做預測。'
        : `<strong>第 ${batch} 個 mini-batch</strong>：關閉 ${nOff} ／ 12 個隱藏節點，剩 ${edges} ／ ${total} 條連線，這一輪只更新亮著的權重。`;
      html += '<div class="muted" style="margin-top:6px"><span class="tag add">補充</span>PyTorch／Keras 用的是 inverted dropout：訓練時把留下來的輸出乘上 1／(1 − rate)，讓期望值不變，所以測試時直接用全部節點、不必再縮放。</div>';
      $('#drop-out').innerHTML = html;
    }
    bindRange(pIn, () => { sample(); render(); }, (v) => v.toFixed(1));
    $('#drop-next').addEventListener('click', () => {
      if (mode === 'test') { mode = 'train'; $$('[data-dm]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dm === 'train'))); }
      batch++; sample(); render();
    });
    $$('[data-dm]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.dm;
      $$('[data-dm]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
  })();

  /* ===== 二元分類指標 ===== */
  (function binary() {
    const ids = ['tp', 'fn', 'fp', 'tn'], inp = {};
    ids.forEach((k) => { inp[k] = $('#b-' + k); inp[k].addEventListener('input', upd); });
    function upd() {
      const v = {}; ids.forEach((k) => { v[k] = Math.max(0, Math.round(+inp[k].value || 0)); });
      const { tp, fn, fp, tn } = v, all = tp + fn + fp + tn;
      $('#b-rp').textContent = tp + fn; $('#b-rn').textContent = fp + tn;
      $('#b-cp').textContent = tp + fp; $('#b-cn').textContent = fn + tn; $('#b-all').textContent = all;
      const out = $('#b-out'); out.innerHTML = '';
      const fr = (a, b) => (b === 0 ? '\\text{（分母為 0）}' : `\\frac{${a}}{${b}}=${fmt(a / b, 3)}`);
      const acc = safeDiv(tp + tn, all), P = safeDiv(tp, tp + fp), R = safeDiv(tp, tp + fn);
      const rows = [
        `\\text{Accuracy}=\\frac{TP+TN}{\\text{Total}}=${fr(tp + tn, all)}`,
        `\\text{Error Rate}=1-\\text{Accuracy}=${isNaN(acc) ? '—' : fmt(1 - acc, 3)}`,
        `\\text{Recall (TPR)}=\\frac{TP}{TP+FN}=${fr(tp, tp + fn)}`,
        `\\text{FPR}=\\frac{FP}{FP+TN}=${fr(fp, fp + tn)}`,
        `\\text{Specificity (TNR)}=\\frac{TN}{FP+TN}=${fr(tn, fp + tn)}`,
        `\\text{Precision}=\\frac{TP}{TP+FP}=${fr(tp, tp + fp)}`,
        `F_1=\\frac{2PR}{P+R}=${isNaN(P) || isNaN(R) || P + R === 0 ? '—' : fmt((2 * P * R) / (P + R), 3)}`,
      ];
      rows.forEach((s) => { const d = el('div', { style: 'margin:2px 0' }); tex(d, s); out.append(d); });
      let note = 'Recall、FPR、Specificity 看「實際」那一列；Precision 看「預測為有」那一欄。FPR + Specificity = 1。';
      if (tp === 90 && fn === 10 && fp === 5 && tn === 40) note = '<span class="good">✓ 講義 COVID 例子</span>：Accuracy 0.897、Error 0.103、Recall 0.9、FPR 0.111（講義寫 0.11）、Specificity 0.889（講義寫 0.89）、Precision 90/95 ≈ 0.947。' + note;
      out.append(el('div', { class: 'muted', style: 'margin-top:6px', html: note }));
    }
    $$('[data-bin]').forEach((b) => b.addEventListener('click', () => {
      b.dataset.bin.split(',').forEach((x, i) => { inp[['tp', 'fn', 'fp', 'tn'][i]].value = x; });
      upd();
    }));
    upd();
  })();

  /* ===== L1 vs L2 ===== */
  (function penalty() {
    const wIn = $('#pen-w'), lIn = $('#pen-l');
    function upd() {
      const w = parseList(wIn.value), lam = Math.max(0, +lIn.value || 0);
      const out = $('#pen-out'); out.innerHTML = '';
      if (!w.length) { out.textContent = '請輸入至少一個權重（逗號分隔）'; return; }
      const par = (v) => (v < 0 ? `(${v})` : String(v));
      const l1 = w.reduce((s, v) => s + Math.abs(v), 0), l2 = w.reduce((s, v) => s + v * v, 0);
      const a = el('div'), b = el('div');
      tex(a, `\\text{L1}=\\lambda\\sum|\\theta_j|=${lam}\\times(${w.map((v) => fmt(Math.abs(v), 4)).join('+')})=${lam}\\times${fmt(l1, 4)}=\\mathbf{${fmt(lam * l1, 6)}}`);
      tex(b, `\\text{L2}=\\lambda\\sum\\theta_j^2=${lam}\\times(${w.map((v) => par(v) + '^2').join('+')})=${lam}\\times${fmt(l2, 4)}=\\mathbf{${fmt(lam * l2, 6)}}`);
      out.append(a, b);
      const big = w.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0);
      if (l2 > 0 && w.length > 1) out.append(el('div', { class: 'muted', style: 'margin-top:6px', text: `L2 裡最大的權重 ${big} 就貢獻了 ${fmt((100 * big * big) / l2, 1)}% 的 penalty；L1 裡它佔 ${fmt((100 * Math.abs(big)) / l1, 1)}%。` }));
    }
    [wIn, lIn].forEach((x) => x.addEventListener('input', upd));
    upd();

    // 縮小實驗：單一權重損失 (w − a)²，加上 λ|w| 或 λw² 後的最佳解
    const A = [2.0, 1.2, 0.6, 0.3, -0.15, -0.8];
    const sIn = $('#shr-l'), NS = 'http://www.w3.org/2000/svg';
    const l1 = (a, lam) => Math.sign(a) * Math.max(Math.abs(a) - lam / 2, 0);
    const l2 = (a, lam) => a / (1 + lam);
    const svgEl = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; return e; };
    function render(lam) {
      const W = 420, RH = 26, H = 30 + A.length * RH, panel = 165, sc = panel / 2 / 2.1;
      const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'plot', role: 'img', 'aria-label': 'L1 與 L2 權重縮小比較', style: 'max-width:560px;margin:0 auto' });
      [['L1（Lasso）', 70], ['L2（Ridge）', 70 + panel + 18]].forEach(([name, x0], pi) => {
        const cx = x0 + panel / 2;
        svg.append(svgEl('text', { x: cx, y: 16, 'text-anchor': 'middle', style: 'fill:var(--text);font-size:13px;font-weight:600' }, name));
        svg.append(svgEl('line', { x1: cx, y1: 24, x2: cx, y2: H - 2, style: 'stroke:var(--border)' }));
        A.forEach((a, i) => {
          const y = 28 + i * RH, v = pi ? l2(a, lam) : l1(a, lam);
          svg.append(svgEl('rect', { x: Math.min(cx, cx + a * sc), y: y + 3, width: Math.abs(a) * sc, height: RH - 8, rx: 3, style: 'fill:var(--surface-2);stroke:var(--border);stroke-dasharray:3 2' }));
          if (v !== 0) svg.append(svgEl('rect', { x: Math.min(cx, cx + v * sc), y: y + 6, width: Math.abs(v) * sc, height: RH - 14, rx: 2, style: `fill:${pi ? 'var(--c-b)' : 'var(--c-a)'}` }));
          else svg.append(svgEl('text', { x: cx + 5, y: y + RH / 2 + 4, style: 'fill:var(--neg);font-size:11px;font-weight:700' }, '= 0'));
        });
      });
      A.forEach((a, i) => svg.append(svgEl('text', { x: 4, y: 28 + i * RH + RH / 2 + 4, style: 'fill:var(--text-2);font-size:12px;font-family:var(--mono)' }, `a=${a}`)));
      const box = $('#shr-bars'); box.innerHTML = ''; box.append(svg);
      const z1 = A.filter((a) => l1(a, lam) === 0).length;
      $('#shr-out').innerHTML = `虛線框：原本的最佳權重 a；實心：加上 Penalty 後。L1：<span class="mono">w = sign(a)·max(|a| − λ/2, 0)</span>，已歸零 <strong>${z1}</strong> 個；L2：<span class="mono">w = a ／ (1 + λ)</span>，每個都縮成原本的 ${fmt(1 / (1 + lam), 3)} 倍，歸零 <strong>0</strong> 個。`
        + '<div class="muted" style="margin-top:4px"><span class="tag add">補充</span>L1 每單位懲罰固定，小權重「不值得留」就直接變 0（特徵選取）；L2 的懲罰與權重大小成正比，越接近 0 推力越小，所以只會變小、不會剛好是 0。</div>';
    }
    bindRange(sIn, render, (v) => v.toFixed(2));
  })();

  /* ===== Batch Normalization ===== */
  (function batchnorm() {
    const xIn = $('#bn-x'), gIn = $('#bn-g'), bIn = $('#bn-b'), canvas = $('#bn-canvas');
    const EPS = 1e-5;
    let st = null;
    function compute() {
      const x = parseList(xIn.value);
      if (x.length < 2) return null;
      const m = x.length, mu = x.reduce((a, b) => a + b, 0) / m;
      const v = x.reduce((a, b) => a + (b - mu) ** 2, 0) / m, sd = Math.sqrt(v + EPS);
      const xh = x.map((t) => (t - mu) / sd), g = +gIn.value, b = +bIn.value;
      return { x, m, mu, v, sd, xh, y: xh.map((t) => g * t + b), g, b };
    }
    function draw() {
      const col = colors(), f0 = setupCanvas(canvas, 0.36);
      if (!st) { f0.ctx.fillStyle = col.text2; f0.ctx.fillText('請輸入至少兩個數字', 12, 24); return; }
      const all = st.x.concat(st.xh, st.y), lo = Math.min(...all, -1.5), hi = Math.max(...all, 1.5), padv = (hi - lo) * 0.06;
      const f = frame(canvas, 0.36, [lo - padv, hi + padv], [0, 3], [6, 12, 22, 92]);
      const { ctx, h } = f;
      const rows = [['原始 x', st.x, st.mu, Math.sqrt(st.v), col.text2], ['標準化 x̂', st.xh, 0, 1, col.b], ['輸出 y = γx̂ + β', st.y, st.b, Math.abs(st.g) * Math.sqrt(st.v / (st.v + EPS)), col.a]];
      ctx.font = '12px system-ui, sans-serif';
      rows.forEach(([name, vals, mean, sd, c], k) => {
        const y = f.Y(2.5 - k);
        line(ctx, f.X(lo - padv), y, f.X(hi + padv), y, col.border, 1);
        ctx.fillStyle = c; ctx.textAlign = 'right'; ctx.fillText(name, 86, y + 4);
        // ±1 STD 範圍
        ctx.fillStyle = c; ctx.globalAlpha = 0.14; ctx.fillRect(f.X(mean - sd), y - 12, f.X(mean + sd) - f.X(mean - sd), 24); ctx.globalAlpha = 1;
        vals.forEach((v) => dot(ctx, f.X(v), y, 5.5, c, col.surface));
        ctx.fillStyle = col.text; ctx.beginPath(); ctx.moveTo(f.X(mean), y + 9); ctx.lineTo(f.X(mean) - 5, y + 16); ctx.lineTo(f.X(mean) + 5, y + 16); ctx.fill();
      });
      ctx.fillStyle = col.text2; ctx.textAlign = 'center';
      const step = (hi - lo) > 12 ? 5 : (hi - lo) > 5 ? 2 : 1;
      for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ctx.fillText(String(v), f.X(v), h - 6);
      ctx.textAlign = 'start';
    }
    function upd() {
      st = compute();
      const out = $('#bn-out'); out.innerHTML = '';
      if (st) {
        const vec = (a) => `(${a.map((v) => fmt(v, 3)).join(',\\ ')})`;
        const lines = [
          `\\mu_B=\\tfrac{${st.x.map((v) => fmt(v, 4)).join('+')}}{${st.m}}=${fmt(st.mu, 4)}`,
          `\\sigma_B^2=\\tfrac{1}{${st.m}}\\sum(x_i-\\mu_B)^2=${fmt(st.v, 4)},\\quad \\sigma_B\\approx${fmt(Math.sqrt(st.v), 3)}`,
          `\\hat{x}=${vec(st.xh)}`,
          `y=${fmt(st.g, 2)}\\,\\hat{x}${st.b < 0 ? '-' : '+'}${fmt(Math.abs(st.b), 2)}=${vec(st.y)}`,
        ];
        lines.forEach((s) => { const d = el('div', { style: 'margin:2px 0' }); tex(d, s); out.append(d); });
        let note = `輸出 y 的平均 = β = ${fmt(st.b, 2)}，標準差 ≈ |γ| = ${fmt(Math.abs(st.g), 2)}。三角形是平均、色帶是 ±1 個標準差。`;
        if (xIn.value.replace(/\s/g, '') === '2,4,6,8' && st.g === 2 && st.b === 1) note = '<span class="good">✓ 與筆記相同</span>：x̂ ≈ (−1.342, −0.447, 0.447, 1.342)，y ≈ (−1.683, 0.106, 1.894, 3.683)。' + note;
        out.append(el('div', { class: 'muted', style: 'margin-top:6px', html: note }));
      }
      draw();
    }
    xIn.addEventListener('input', upd);
    bindRange(gIn, () => upd(), (v) => v.toFixed(1));
    bindRange(bIn, () => upd(), (v) => v.toFixed(1));
    onRedraw(draw);

    // running mean
    const mSel = $('#rm-m'), rc = $('#rm-canvas');
    let rm, hist, r;
    function reset() { rm = 0; hist = [{ bm: null, rm: 0 }]; r = rng(31); drawRm(); }
    function next() {
      const t = hist.length; // 第 t 個 batch
      const bm = t === 1 ? 5 : t === 2 ? 4 : 5 + 0.8 * gauss(r);
      const m = +mSel.value, prev = rm;
      rm = m * rm + (1 - m) * bm;
      hist.push({ bm, rm, prev });
    }
    function drawRm() {
      const col = colors(), n = Math.max(10, hist.length - 1);
      const f = frame(rc, 0.34, [0, n], [0, 8], [10, 12, 22, 30]);
      const { ctx, h } = f;
      ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = col.text2; ctx.textAlign = 'right';
      [0, 2, 4, 6, 8].forEach((v) => { line(ctx, f.X(0), f.Y(v), f.X(n), f.Y(v), col.border, 0.6); ctx.fillText(String(v), f.X(0) - 4, f.Y(v) + 4); });
      ctx.textAlign = 'center';
      const tick = n > 40 ? 10 : n > 20 ? 5 : 1;
      for (let k = 0; k <= n; k += tick) ctx.fillText(String(k), f.X(k), h - 6);
      line(ctx, f.X(0), f.Y(5), f.X(n), f.Y(5), col.pos, 1.4, [5, 4]);
      hist.forEach((p, k) => { if (p.bm !== null) dot(ctx, f.X(k), f.Y(Math.max(0, Math.min(8, p.bm))), 3, null, col.text2); });
      poly(ctx, hist.map((p, k) => [f.X(k), f.Y(p.rm)]), col.accent, 2.2);
      dot(ctx, f.X(hist.length - 1), f.Y(rm), 5, col.accent, col.surface);
      ctx.textAlign = 'left'; ctx.fillStyle = col.pos; ctx.fillText('真實平均 5', f.X(0) + 4, f.Y(5) - 5);
      const last = hist[hist.length - 1], m = +mSel.value;
      let html = `已看過 ${hist.length - 1} 個 batch，running_mean = <strong>${fmt(rm, 3)}</strong>`;
      if (last.bm !== null) html += `<div class="mono" style="margin-top:4px">${m} × ${fmt(last.prev, 3)} + ${fmt(1 - m, 2)} × ${fmt(last.bm, 3)} = ${fmt(rm, 3)}</div>`;
      else html += '<div class="muted" style="margin-top:4px">按「下一個 batch」。空心點是每個 batch 的 mean，藍線是 running_mean。</div>';
      if (m === 0.9 && hist.length === 3) html += '<div class="good" style="margin-top:4px">✓ 與筆記相同：0.5 → 0.85，慢慢往真實平均靠近</div>';
      html += '<div class="muted" style="margin-top:4px">momentum 越大，更新越慢、越平滑；推論時直接用最後這個值，不再更新。</div>';
      $('#rm-out').innerHTML = html;
    }
    $('#rm-next').addEventListener('click', () => { next(); drawRm(); });
    $('#rm-run').addEventListener('click', () => { for (let i = 0; i < 50; i++) next(); drawRm(); });
    $('#rm-reset').addEventListener('click', reset);
    mSel.addEventListener('change', reset);
    reset();
    onRedraw(drawRm);
  })();

  /* ===== Early Stopping ===== */
  (function earlyStop() {
    const vIn = $('#es-v'), pIn = $('#es-p'), canvas = $('#es-canvas');
    let trainLoss = null;
    const PRESETS = {
      note: { v: [0.5, 0.4, 0.35, 0.36, 0.37, 0.38], p: 3 },
      quiz: { v: [0.9, 0.6, 0.5, 0.55, 0.52], p: 2 },
    };
    function simulate() {
      const r = rng(41), tr = [], va = [];
      for (let e = 1; e <= 40; e++) {
        tr.push(0.12 + 1.0 * Math.exp(-e / 6) + 0.008 * gauss(r));
        va.push(0.32 + 0.9 * Math.exp(-e / 5) + 0.0006 * e ** 1.6 + 0.012 * gauss(r));
      }
      return { tr: tr.map((v) => +v.toFixed(3)), va: va.map((v) => +v.toFixed(3)) };
    }
    function run(v, P) {
      let best = Infinity, bestE = 0, wait = 0, stop = 0;
      const log = [];
      for (let e = 1; e <= v.length; e++) {
        const imp = v[e - 1] < best;
        if (imp) { best = v[e - 1]; bestE = e; wait = 0; } else wait++;
        log.push({ e, v: v[e - 1], imp, wait });
        if (wait >= P) { stop = e; break; }
      }
      return { bestE, best, stop, log };
    }
    function render() {
      const v = parseList(vIn.value), P = +pIn.value, col = colors();
      const out = $('#es-out');
      if (trainLoss && trainLoss.length !== v.length) trainLoss = null;
      if (v.length < 2) { out.textContent = '請輸入至少兩個 Val Loss（逗號分隔）'; setupCanvas(canvas, 0.42); return; }
      const res = run(v, P), n = v.length;
      const all = v.concat(trainLoss || []), lo = Math.min(...all), hi = Math.max(...all), pd = (hi - lo) * 0.12 || 0.05;
      const f = frame(canvas, 0.42, [0.5, n + 0.5], [lo - pd, hi + pd], [12, 12, 22, 40]);
      const { ctx, h } = f;
      ctx.font = '11px system-ui, sans-serif';
      if (res.stop) {
        ctx.fillStyle = col.text2; ctx.globalAlpha = 0.12;
        ctx.fillRect(f.X(res.stop + 0.5), f.Y(hi + pd), f.X(n + 0.5) - f.X(res.stop + 0.5), f.Y(lo - pd) - f.Y(hi + pd)); ctx.globalAlpha = 1;
        line(ctx, f.X(res.stop), f.Y(hi + pd), f.X(res.stop), f.Y(lo - pd), col.neg, 1.6, [5, 4]);
        ctx.fillStyle = col.neg; ctx.textAlign = res.stop > n * 0.75 ? 'right' : 'left';
        ctx.fillText(`第 ${res.stop} 個 epoch 停止`, f.X(res.stop) + (res.stop > n * 0.75 ? -5 : 5), f.Y(hi + pd) + 12);
      }
      ctx.fillStyle = col.text2; ctx.textAlign = 'right';
      for (let k = 0; k <= 4; k++) { const y = lo - pd + ((hi - lo + 2 * pd) * k) / 4; ctx.fillText(fmt(y, 2), f.X(0.5) - 4, f.Y(y) + 4); }
      ctx.textAlign = 'center';
      const tick = n > 20 ? 5 : 1;
      for (let e = tick; e <= n; e += tick) ctx.fillText(String(e), f.X(e), h - 6);
      if (trainLoss) poly(ctx, trainLoss.map((y, i) => [f.X(i + 1), f.Y(y)]), col.b, 2);
      poly(ctx, v.map((y, i) => [f.X(i + 1), f.Y(y)]), col.a, 2.2);
      v.forEach((y, i) => dot(ctx, f.X(i + 1), f.Y(y), n > 20 ? 2.5 : 4, res.stop && i + 1 > res.stop ? col.surface2 : col.a));
      dot(ctx, f.X(res.bestE), f.Y(res.best), 8, null, col.pos);
      ctx.textAlign = 'left'; ctx.fillStyle = col.a; ctx.fillText('Val Loss', f.X(0.5) + 4, f.Y(lo - pd) - 6);
      if (trainLoss) { ctx.fillStyle = col.b; ctx.fillText('Train Loss', f.X(0.5) + 60, f.Y(lo - pd) - 6); }

      const chips = res.log.map((x) => `${x.e}:${fmt(x.v, 3)}${x.imp ? '<span class="good">✓</span>' : `<span class="bad">(${x.wait})</span>`}`).join('　');
      let html = `<div class="mono" style="font-size:.88rem">${chips}</div>`;
      html += '<div class="muted" style="font-size:.85rem">✓ = 創新低（存下權重）；(k) = 已連續 k 個 epoch 沒進步</div>';
      html += res.stop
        ? `<div style="margin-top:6px">最佳是第 <strong>${res.bestE}</strong> 個 epoch（Val Loss ${fmt(res.best, 3)}），之後連續 ${P} 個 epoch 沒進步 → 在第 <strong>${res.stop}</strong> 個 epoch 停止，取回第 ${res.bestE} 個 epoch 的權重。</div>`
        : `<div style="margin-top:6px">跑完 ${n} 個 epoch 都沒有觸發 Early Stopping；最佳是第 <strong>${res.bestE}</strong> 個 epoch。</div>`;
      if (trainLoss && res.stop) html += `<div class="muted" style="margin-top:4px">停止時 Train Loss 還在下降，但 Val Loss 已經回升：再訓練下去只會更 overfit。P 太小可能被雜訊騙到而太早停；P 太大則多浪費幾個 epoch。</div>`;
      out.innerHTML = html;
    }
    const setP = (p) => { pIn.value = p; $('[data-for="es-p"]').textContent = p; };
    $$('[data-es]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.es;
      if (k === 'sim') { const s = simulate(); trainLoss = s.tr; vIn.value = s.va.join(', '); setP(5); }
      else { trainLoss = null; vIn.value = PRESETS[k].v.map((x) => x.toFixed(2)).join(', '); setP(PRESETS[k].p); }
      render();
    }));
    vIn.addEventListener('input', () => { trainLoss = null; render(); });
    bindRange(pIn, () => {});
    pIn.addEventListener('input', render);
    onRedraw(render);
  })();

  /* ===== 資料擴增 ===== */
  (function augment() {
    const S = 128;
    const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    const SCENES = [
      { name: '狗', emo: '🐶', at: [74, 74], size: 62 },
      { name: '貓', emo: '🐱', at: [64, 70], size: 64 },
      { name: '消防車', emo: '🚒', at: [64, 76], size: 66 },
      { name: '鴨子', emo: '🦆', at: [60, 66], size: 60 },
    ];
    function background(ctx, k) {
      let g;
      if (k === 0) {
        g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#8ccaf7'); g.addColorStop(1, '#e3f3ff');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#5fae4e'; ctx.fillRect(0, 92, S, 36);
        ctx.fillStyle = '#7a5230'; ctx.fillRect(16, 52, 8, 44);
        ctx.fillStyle = '#2f8a3a'; ctx.beginPath(); ctx.arc(20, 46, 16, 0, Math.PI * 2); ctx.fill();
      } else if (k === 1) {
        ctx.fillStyle = '#f2dfc0'; ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#a8784c'; ctx.fillRect(0, 98, S, 30);
        ctx.fillStyle = '#9fd0f5'; ctx.fillRect(86, 14, 32, 30);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(86, 14, 32, 30);
        ctx.beginPath(); ctx.moveTo(102, 14); ctx.lineTo(102, 44); ctx.stroke();
      } else if (k === 2) {
        g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#ffcf8a'); g.addColorStop(1, '#ffe9c9');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#8a8f98'; ctx.fillRect(0, 96, S, 32);
        ctx.fillStyle = '#f5f5f5'; for (let x = 4; x < S; x += 28) ctx.fillRect(x, 111, 14, 3);
        ctx.fillStyle = '#c9b8a4'; ctx.fillRect(98, 30, 26, 66);
      } else {
        g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#bfe6ff'); g.addColorStop(1, '#ffffff');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#3a8fd1'; ctx.fillRect(0, 78, S, 50);
        ctx.strokeStyle = '#8cc8f0'; ctx.lineWidth = 2;
        for (let y = 90; y < S; y += 12) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(40, y); ctx.moveTo(70, y + 5); ctx.lineTo(110, y + 5); ctx.stroke(); }
      }
    }
    function object(ctx, k, x, y, scale = 1) {
      const sc = SCENES[k];
      ctx.save();
      ctx.font = `${Math.round(sc.size * scale)}px ${EMOJI}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sc.emo, x ?? sc.at[0], y ?? sc.at[1]);
      ctx.restore();
    }
    const mk = () => { const c = document.createElement('canvas'); c.width = S; c.height = S; return c; };
    const IMG = SCENES.map((_, k) => { const c = mk(), ctx = c.getContext('2d'); background(ctx, k); object(ctx, k); return c; });

    const DEF = {
      flipH: { desc: '左右翻轉。狗還是狗，模型要學會方向不影響類別。' },
      flipV: { desc: '上下翻轉。對自然照片常會產生不真實的圖（天空在下面），要看任務決定要不要用。' },
      rotate: { params: [{ id: 'deg', label: '角度', min: -45, max: 45, step: 1, value: 20, fmt: (v) => v + '°' }], desc: '旋轉後四角露出的地方填 0（黑色）。', dice: { deg: [-45, 45] } },
      color: { params: [{ id: 'br', label: '亮度', min: -0.5, max: 0.5, step: 0.05, value: 0.25, fmt: (v) => (v > 0 ? '+' : '') + v.toFixed(2) }, { id: 'ct', label: '對比', min: 0.4, max: 2, step: 0.05, value: 1.4, fmt: (v) => '×' + v.toFixed(2) }], desc: '每個像素 v → (v − 128) × 對比 + 128 + 亮度 × 255，模擬不同光線。', dice: { br: [-0.5, 0.5], ct: [0.5, 1.8] } },
      zoom: { params: [{ id: 'z', label: '放大', min: 1, max: 2.5, step: 0.1, value: 1.6, fmt: (v) => '×' + v.toFixed(1) }], desc: '隨機裁一塊再放大回原尺寸；物件可能只剩一部分。' },
      shear: { params: [{ id: 'k', label: '斜切', min: -0.6, max: 0.6, step: 0.05, value: 0.3, fmt: (v) => v.toFixed(2) }], desc: '<span class="tag add">補充</span>講義的「扭曲」這裡用斜切（shear）示範；實務上還有透視、彈性變形等。', dice: { k: [-0.6, 0.6] } },
      cutout: { params: [{ id: 'L', label: '邊長', min: 8, max: 72, step: 4, value: 44, fmt: (v) => v + ' px' }], desc: '固定大小的正方形、填 0（黑色），位置隨機，可以超出圖片邊緣。' },
      erase: { params: [{ id: 'amax', label: '最大面積', min: 0.1, max: 0.5, step: 0.05, value: 0.33, fmt: (v) => Math.round(v * 100) + '%' }], desc: '矩形的面積（2%～最大面積）與長寬比（0.3～3.3）都隨機，填 0～255 的隨機雜訊，限制在圖內。' },
      hide: { params: [{ id: 'G', label: '網格 S', min: 2, max: 8, step: 1, value: 4, fmt: (v) => v + '×' + v }, { id: 'hp', label: '遮蔽機率', min: 0, max: 1, step: 0.05, value: 0.5, fmt: (v) => v.toFixed(2) }], desc: '切成 S×S 格，每格「獨立」依機率遮掉（設為 0）。多按幾次會發現有時遮太多、有時幾乎沒遮。' },
      grid: { params: [{ id: 'd', label: '週期 d', min: 16, max: 64, step: 4, value: 32, fmt: (v) => v + ' px' }, { id: 'gr', label: '遮擋邊長比例', min: 0.2, max: 0.8, step: 0.05, value: 0.5, fmt: (v) => v.toFixed(2) }], desc: '規律、等間距的方塊遮擋，只有整體位置隨機偏移；遮掉的比例固定，不會一次遮太多或太少。' },
      mixup: { params: [{ id: 'lam', label: 'λ', min: 0, max: 1, step: 0.05, value: 0.7, fmt: (v) => v.toFixed(2) }], desc: '整張圖線性混合：x̃ = λ·狗 + (1 − λ)·貓，標籤也用同樣比例混合。' },
      cutmix: { params: [{ id: 'cs', label: '貼上的方塊', min: 0, max: 32, step: 2, value: 16, fmt: (v) => `${v}×${v}（在 32×32 中）` }], desc: '把狗圖的一塊換成貓圖同位置的一塊，標籤依面積比例混合。圖片視為 32×32 格。' },
      paste: { params: [{ id: 'ps', label: '貼上物件大小', min: 0.4, max: 1.2, step: 0.05, value: 0.75, fmt: (v) => '×' + v.toFixed(2) }], desc: '把貓「連同 mask」（只有物件、不含背景）貼到狗的場景裡；Albumentations 會同步更新 mask、bounding box、keypoints（虛線框）。' },
      mosaic: { desc: '四張圖以隨機中心點拼成田字形；一張訓練圖裡同時有不同背景、尺度、位置的物件。常用於物件偵測（YOLO）。' },
    };
    const vals = {};
    for (const [m, d] of Object.entries(DEF)) { vals[m] = {}; (d.params || []).forEach((p) => { vals[m][p.id] = p.value; }); }
    const mSel = $('#aug-m'), src = $('#aug-src'), dst = $('#aug-dst');
    let seed = 1;

    function buildParams() {
      const box = $('#aug-params'), m = mSel.value; box.innerHTML = '';
      (DEF[m].params || []).forEach((p) => {
        const id = 'aug-' + p.id;
        const inp = el('input', { type: 'range', id, min: p.min, max: p.max, step: p.step, value: vals[m][p.id] });
        box.append(el('label', {}, [p.label + ' ', inp, ' ', el('span', { class: 'val', 'data-for': id })]));
        bindRange(inp, (v) => { vals[m][p.id] = v; draw(); }, p.fmt);
      });
      if (!(DEF[m].params || []).length) box.append(el('span', { class: 'muted', style: 'font-size:.9rem', text: '這個方法沒有參數。' }));
    }

    // 回傳 { canvas, label, boxes }
    function augment(m, P, r) {
      const W = mk(), ctx = W.getContext('2d'), A = IMG[0];
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S);
      let label = '狗 1.0', boxes = null;
      const rect = (x, y, w, h) => { ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); };
      if (m === 'flipH') { ctx.translate(S, 0); ctx.scale(-1, 1); ctx.drawImage(A, 0, 0); }
      else if (m === 'flipV') { ctx.translate(0, S); ctx.scale(1, -1); ctx.drawImage(A, 0, 0); }
      else if (m === 'rotate') { ctx.translate(S / 2, S / 2); ctx.rotate((P.deg * Math.PI) / 180); ctx.drawImage(A, -S / 2, -S / 2); }
      else if (m === 'color') {
        ctx.drawImage(A, 0, 0);
        const d = ctx.getImageData(0, 0, S, S), px = d.data;
        for (let i = 0; i < px.length; i += 4) for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, (px[i + c] - 128) * P.ct + 128 + P.br * 255));
        ctx.putImageData(d, 0, 0);
      } else if (m === 'zoom') {
        const cs = S / P.z, ox = r() * (S - cs), oy = r() * (S - cs);
        ctx.drawImage(A, ox, oy, cs, cs, 0, 0, S, S);
      } else if (m === 'shear') { ctx.setTransform(1, 0, P.k, 1, -P.k * S / 2, 0); ctx.drawImage(A, 0, 0); }
      else if (m === 'cutout') {
        ctx.drawImage(A, 0, 0);
        const cx = r() * S, cy = r() * S; rect(cx - P.L / 2, cy - P.L / 2, P.L, P.L);
      } else if (m === 'erase') {
        ctx.drawImage(A, 0, 0);
        let w = 0, h = 0;
        for (let t = 0; t < 20; t++) {
          const area = (0.02 + r() * (P.amax - 0.02)) * S * S, ar = Math.exp(Math.log(0.3) + r() * (Math.log(3.3) - Math.log(0.3)));
          h = Math.round(Math.sqrt(area * ar)); w = Math.round(Math.sqrt(area / ar));
          if (w < S && h < S) break;
        }
        w = Math.min(w, S - 1); h = Math.min(h, S - 1);
        const x0 = Math.floor(r() * (S - w)), y0 = Math.floor(r() * (S - h));
        const d = ctx.getImageData(x0, y0, w, h);
        for (let i = 0; i < d.data.length; i += 4) { d.data[i] = r() * 256; d.data[i + 1] = r() * 256; d.data[i + 2] = r() * 256; }
        ctx.putImageData(d, x0, y0);
      } else if (m === 'hide') {
        ctx.drawImage(A, 0, 0);
        const c = S / P.G; let k = 0;
        for (let i = 0; i < P.G; i++) for (let j = 0; j < P.G; j++) if (r() < P.hp) { rect(j * c, i * c, c, c); k++; }
        label = `狗 1.0（遮掉 ${k} ／ ${P.G * P.G} 格）`;
      } else if (m === 'grid') {
        ctx.drawImage(A, 0, 0);
        const l = P.d * P.gr, dx = r() * P.d, dy = r() * P.d;
        for (let y = dy - P.d; y < S; y += P.d) for (let x = dx - P.d; x < S; x += P.d) rect(x, y, l, l);
      } else if (m === 'mixup') {
        ctx.drawImage(A, 0, 0); ctx.globalAlpha = 1 - P.lam; ctx.drawImage(IMG[1], 0, 0); ctx.globalAlpha = 1;
        label = `狗 ${fmt(P.lam, 2)}、貓 ${fmt(1 - P.lam, 2)}`;
      } else if (m === 'cutmix') {
        ctx.drawImage(A, 0, 0);
        const u = S / 32, s = P.cs, gx = Math.floor(r() * (32 - s + 1)), gy = Math.floor(r() * (32 - s + 1));
        if (s > 0) ctx.drawImage(IMG[1], gx * u, gy * u, s * u, s * u, gx * u, gy * u, s * u, s * u);
        const b = (s * s) / 1024;
        label = `面積比例 ${s * s} ／ 1024 = ${fmt(b, 4)} → 狗 ${fmt(1 - b, 4)}、貓 ${fmt(b, 4)}`;
        boxes = s > 0 ? [[gx * u, gy * u, s * u, s * u, '貓的區塊']] : null;
      } else if (m === 'paste') {
        ctx.drawImage(A, 0, 0);
        const sz = SCENES[1].size * P.ps, x = sz / 2 + r() * (S - sz), y = sz / 2 + r() * (S - sz);
        object(ctx, 1, x, y, P.ps);
        const d0 = SCENES[0];
        boxes = [[d0.at[0] - d0.size * 0.5, d0.at[1] - d0.size * 0.5, d0.size, d0.size, '狗'], [x - sz / 2, y - sz / 2, sz, sz, '貓']];
        label = '狗、貓（物件偵測：每個物件各有自己的框與 mask）';
      } else if (m === 'mosaic') {
        const cx = S * (0.3 + 0.4 * r()), cy = S * (0.3 + 0.4 * r());
        const q = [[0, 0, cx, cy], [cx, 0, S - cx, cy], [0, cy, cx, S - cy], [cx, cy, S - cx, S - cy]];
        q.forEach(([x, y, w, h], k) => {
          // 以 cover 方式填滿象限
          const sc = Math.max(w / S, h / S), sw = w / sc, sh = h / sc;
          ctx.drawImage(IMG[k], (S - sw) / 2, (S - sh) / 2, sw, sh, x, y, w, h);
        });
        label = '狗、貓、消防車、鴨子（同一張圖裡 4 個物件）';
        boxes = q.map(([x, y, w, h], k) => [x, y, w, h, SCENES[k].name]);
      }
      return { canvas: W, label, boxes };
    }

    function paint(canvas, img, boxes) {
      const { ctx, w } = setupCanvas(canvas, 1), k = w / S;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, w, w);
      if (boxes) {
        ctx.save(); ctx.setLineDash([5, 3]); ctx.lineWidth = 2; ctx.font = '600 12px system-ui, sans-serif';
        boxes.forEach(([x, y, bw, bh, name]) => {
          ctx.strokeStyle = '#ffd400'; ctx.strokeRect(x * k + 1, y * k + 1, bw * k - 2, bh * k - 2);
          const tw = ctx.measureText(name).width;
          ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x * k + 2, y * k + 2, tw + 8, 17);
          ctx.fillStyle = '#ffd400'; ctx.fillText(name, x * k + 6, y * k + 15);
        });
        ctx.restore();
      }
    }
    function draw() {
      const m = mSel.value, res = augment(m, vals[m], rng(seed * 7919 + 13));
      paint(src, IMG[0]);
      paint(dst, res.canvas, res.boxes);
      $('#aug-out').innerHTML = `${DEF[m].desc}<div style="margin-top:6px">標籤：<strong>${res.label}</strong></div>`
        + (m === 'mixup' && Math.abs(vals[m].lam - 0.7) < 1e-9 ? '<div class="good" style="margin-top:4px">✓ 與筆記相同：λ = 0.7 → 狗 0.7、貓 0.3</div>' : '')
        + (m === 'cutmix' && vals[m].cs === 16 ? '<div class="good" style="margin-top:4px">✓ 與筆記相同：32×32 貼 16×16 → 0.25，標籤 A 0.75、B 0.25</div>' : '');
    }
    $('#aug-again').addEventListener('click', () => {
      seed++;
      const m = mSel.value, dice = DEF[m].dice;
      if (dice) {
        const r = rng(seed * 31 + 5);
        (DEF[m].params || []).forEach((p) => {
          if (!dice[p.id]) return;
          const [lo, hi] = dice[p.id];
          const v = Math.round((lo + r() * (hi - lo)) / p.step) * p.step;
          vals[m][p.id] = +v.toFixed(4);
        });
        buildParams();
      }
      draw();
    });
    mSel.addEventListener('change', () => { buildParams(); draw(); });
    buildParams();
    onRedraw(draw);
  })();
})();
