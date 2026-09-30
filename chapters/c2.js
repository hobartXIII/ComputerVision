/* C2 互動元件 */
(function () {
  'use strict';
  const { $, $$, el, fmt, int, tex, matrix, rng, bindRange } = CV;

  const LEC_X = [[1, 0, 1, 0, 1], [1, 0, 0, 1, 1], [0, 1, 1, 0, 0], [1, 0, 0, 1, 0], [0, 0, 1, 1, 0]];
  const INPUTS = {
    lec: LEC_X,
    edge: Array.from({ length: 5 }, () => [1, 1, 0, 0, 0]),
    hedge: [[1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
  };
  const KERNELS = {
    lec: [[0, 1, 0], [1, 0, -1], [0, 1, 0]],
    v: [[1, 0, -1], [1, 0, -1], [1, 0, -1]],
    h: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]],
  };
  const clone = (M) => M.map((r) => r.slice());
  const pad = (X, p) => {
    const n = X.length + 2 * p;
    const P = Array.from({ length: n }, () => Array(n).fill(0));
    X.forEach((r, i) => r.forEach((v, j) => { P[i + p][j + p] = v; }));
    return P;
  };
  const outSize = (n, f, p, s) => Math.floor((n + 2 * p - f) / s) + 1;
  const clickDelta = (ev) => (ev && ev.shiftKey ? -1 : 1);

  /* ===== 卷積逐步 ===== */
  (function conv() {
    const inSel = $('#cv-in'), kSel = $('#cv-k'), pSel = $('#cv-p'), sSel = $('#cv-s');
    const mats = $('#cv-mats'), out = $('#cv-out');
    let X = clone(LEC_X), K = clone(KERNELS.lec), k = 0, timer = null, lastEv = null;
    const P = () => +pSel.value, S = () => +sSel.value;
    const M = () => outSize(X.length, K.length, P(), S());
    function valueAt(pos) {
      const m = M(), i = Math.floor(pos / m), j = pos % m, s = S(), PX = pad(X, P());
      const terms = [];
      let sum = 0;
      for (let a = 0; a < K.length; a++) for (let b = 0; b < K.length; b++) {
        const x = PX[i * s + a][j * s + b], w = K[a][b];
        terms.push([x, w]); sum += x * w;
      }
      return { i, j, terms, sum };
    }
    function render() {
      const m = M(), s = S(), p = P(), PX = pad(X, p), f = K.length;
      const Y = Array.from({ length: m }, () => Array(m).fill(null));
      for (let t = 0; t < k; t++) { const v = valueAt(t); Y[v.i][v.j] = v.sum; }
      const cur = k > 0 ? valueAt(k - 1) : null;
      const inWin = (i, j) => cur && i >= cur.i * s && i < cur.i * s + f && j >= cur.j * s && j < cur.j * s + f;
      const n = PX.length;
      mats.innerHTML = '';
      mats.append(
        matrix(PX, {
          caption: `輸入 ${X.length}×${X.length}` + (p ? `（padding 後 ${n}×${n}）` : ''),
          cls: (i, j) => {
            const isPad = i < p || j < p || i >= n - p || j >= n - p;
            return (isPad ? 'pad ' : '') + (inWin(i, j) ? 'win' : '');
          },
          onClick: (i, j) => {
            if (i < p || j < p || i >= n - p || j >= n - p) return;
            X[i - p][j - p] += clickDelta(lastEv); render();
          },
        }),
        el('span', { class: 'op', text: '*' }),
        matrix(K, { caption: `濾波器 ${f}×${f}`, cls: () => (cur ? 'win' : ''), onClick: (i, j) => { K[i][j] += clickDelta(lastEv); render(); } }),
        el('span', { class: 'op', text: '=' }),
        matrix(Y, { caption: `特徵圖 ${m}×${m}`, cls: (i, j) => (cur && cur.i === i && cur.j === j ? 'cur' : '') }),
      );
      let html = `m = ⌊(${X.length} + 2×${p} − ${f}) / ${s}⌋ + 1 = <strong>${m}</strong>　·　第 ${k} / ${m * m} 個位置`;
      if (cur) {
        const txt = cur.terms.map(([x, w]) => `(${x}×${w < 0 ? '(' + w + ')' : w})`).join(' + ');
        html += `<div style="margin-top:6px" class="mono">${txt} = <strong>${cur.sum}</strong></div>`;
      } else {
        html += '<div class="muted" style="margin-top:6px">按「下一步」開始。黃色框是濾波器目前蓋住的區域。</div>';
      }
      if (k === m * m) {
        const same = (A, B) => JSON.stringify(A) === JSON.stringify(B);
        if (same(X, LEC_X) && same(K, KERNELS.lec)) {
          if (p === 0 && s === 1) html += '<div class="good" style="margin-top:6px">✓ 與講義結果相同：[[2,1,−1],[−1,1,3],[2,1,1]]</div>';
          if (p === 0 && s === 2) html += '<div class="good" style="margin-top:6px">✓ 與講義 stride = 2 的結果相同：[[2,−1],[2,1]]</div>';
          if (p === 1) html += '<div style="margin-top:6px"><span class="tag chk">待確認</span>講義 padding 頁印的第一列是 2 1 −1 2 2，與這裡的實際計算不同；中間 3×3 與無 padding 的結果相同。</div>';
        }
        if (same(K, KERNELS.v) && same(X, INPUTS.edge) && p === 0 && s === 1) html += '<div class="good" style="margin-top:6px">✓ 與講義相同：每列都是 3 3 0，亮暗交界處輸出大值。</div>';
      }
      out.innerHTML = html;
      $('#cv-prev').disabled = k === 0;
      $('#cv-next').disabled = k === m * m;
    }
    mats.addEventListener('pointerdown', (ev) => { lastEv = ev; }, true);
    const stop = () => { clearInterval(timer); timer = null; $('#cv-play').textContent = '▶ 自動播放'; };
    $('#cv-next').addEventListener('click', () => { stop(); if (k < M() * M()) k++; render(); });
    $('#cv-prev').addEventListener('click', () => { stop(); if (k > 0) k--; render(); });
    $('#cv-all').addEventListener('click', () => { stop(); k = M() * M(); render(); });
    $('#cv-clear').addEventListener('click', () => { stop(); k = 0; render(); });
    $('#cv-play').addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (k >= M() * M()) k = 0;
      $('#cv-play').textContent = '❚❚ 暫停';
      timer = setInterval(() => { k++; render(); if (k >= M() * M()) stop(); }, 700);
    });
    inSel.addEventListener('change', () => { stop(); X = clone(INPUTS[inSel.value]); k = 0; render(); });
    kSel.addEventListener('change', () => { stop(); K = clone(KERNELS[kSel.value]); k = 0; render(); });
    [pSel, sSel].forEach((x) => x.addEventListener('change', () => { stop(); k = 0; render(); }));
    render();
  })();

  /* ===== 多頻道卷積 ===== */
  (function rgb() {
    const box = $('#rgb-mats'), out = $('#rgb-out'), biasIn = $('#rgb-bias');
    let seed = 3, patch, filt;
    function gen() {
      const r = rng(seed++);
      const ri = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
      patch = [0, 1, 2].map(() => Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ri(0, 3))));
      filt = [0, 1, 2].map(() => Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ri(-1, 1))));
    }
    function render() {
      const names = [['R', '#e5484d'], ['G', '#30a46c'], ['B', '#3e63dd']];
      box.innerHTML = '';
      const sums = [0, 1, 2].map((c) => patch[c].reduce((a, row, i) => a + row.reduce((b, v, j) => b + v * filt[c][i][j], 0), 0));
      names.forEach(([n, color], c) => {
        box.append(el('div', { class: 'mat-row', style: 'margin:8px 0' }, [
          el('strong', { text: n, style: `color:${color};width:1.2em` }),
          matrix(patch[c], { small: true, caption: `圖片區塊（${n}）` }),
          el('span', { class: 'op', text: '⊙' }),
          matrix(filt[c], { small: true, caption: `濾波器第 ${c + 1} 層` }),
          el('span', { class: 'op', text: '→' }),
          el('span', { class: 'big mono', text: String(sums[c]) }),
        ]));
      });
      const b = Math.round(+biasIn.value || 0);
      const total = sums[0] + sums[1] + sums[2] + b;
      out.innerHTML = '';
      const d = el('div'); out.append(d);
      tex(d, `${sums.map((v) => (v < 0 ? `(${v})` : v)).join('+')}+\\underbrace{${b < 0 ? `(${b})` : b}}_{\\text{bias}}=\\mathbf{${total}}`, true);
      out.append(el('div', { class: 'muted', html: '三層加總成<strong>一個</strong>數字 → 一個濾波器只產生<strong>一張</strong>特徵圖。這個濾波器有 3×3×3 = 27 個權重 ＋ 1 個 bias = 28 個參數。' }));
    }
    $('#rgb-new').addEventListener('click', () => { gen(); render(); });
    biasIn.addEventListener('input', render);
    gen(); render();
  })();

  /* ===== 覆蓋次數 ===== */
  (function cover() {
    const box = $('#cover-mat'), out = $('#cover-out');
    const btns = $$('[data-cp]');
    function render(p) {
      btns.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.cp === p)));
      const n = 5, f = 3, N = n + 2 * p, m = N - f + 1;
      const C = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++)
        for (let a = 0; a < f; a++) for (let b = 0; b < f; b++) {
          const x = i + a - p, y = j + b - p;
          if (x >= 0 && y >= 0 && x < n && y < n) C[x][y]++;
        }
      const max = 9;
      box.innerHTML = '';
      const mt = matrix(C, { caption: '每個像素被卷到的次數' });
      $$('.cell', mt).forEach((c, idx) => {
        const v = C[Math.floor(idx / n)][idx % n];
        c.style.background = `color-mix(in srgb, var(--accent) ${Math.round((v / max) * 70)}%, var(--surface-2))`;
      });
      box.append(mt);
      out.innerHTML = `輸出 ${m}×${m}　·　角落像素：<strong>${C[0][0]}</strong> 次、中心像素：<strong>${C[2][2]}</strong> 次` +
        (p === 0 ? '<br><span class="muted">角落只被卷到 1 次，對特徵圖的貢獻遠小於中間像素；輸出也從 5×5 縮成 3×3。</span>'
          : '<br><span class="muted">補一圈 0 之後，角落的貢獻變成 4 次，輸出也維持 5×5。</span>');
    }
    btns.forEach((b) => b.addEventListener('click', () => render(+b.dataset.cp)));
    render(0);
  })();

  /* ===== 天使與魔鬼 ===== */
  (function why() {
    const w = $('#why-w'), w1 = $('#why-w1'), w2 = $('#why-w2');
    const verdict = (a, b) => (a > 0 && b > 0 ? '<span class="good">✓ 兩種邊緣都加分</span>'
      : '<span class="bad">✗ 沒辦法兩種都加分</span>');
    function upd() {
      const W = +w.value, W1 = +w1.value, W2 = +w2.value;
      const a = 3 * W, b = -3 * W;
      $('#why-a').innerHTML = `由暗到亮（+3）：3 × ${fmt(W, 1)} = <strong>${fmt(a, 1)}</strong><br>由亮到暗（−3）：(−3) × ${fmt(W, 1)} = <strong>${fmt(b, 1)}</strong><br>` +
        verdict(a, b) + (W !== 0 ? '<br><span class="muted">一個往上、一個往下，幅度還一樣：一個加分另一個就自動被扣分。</span>' : '<br><span class="muted">w = 0 時兩者都是 0，等於完全不看這個特徵。</span>');
      const c = 3 * W1, d = 3 * W2;
      $('#why-b').innerHTML = `通道 1 = ReLU(x)，通道 2 = ReLU(−x)<br>由暗到亮：通道 1 = 3、通道 2 = 0 → 3 × ${fmt(W1, 1)} = <strong>${fmt(c, 1)}</strong><br>由亮到暗：通道 1 = 0、通道 2 = 3 → 3 × ${fmt(W2, 1)} = <strong>${fmt(d, 1)}</strong><br>` +
        verdict(c, d) + '<br><span class="muted">兩種特徵各有自己的權重，可以獨立評估。</span>';
    }
    [w, w1, w2].forEach((x) => bindRange(x, upd, (v) => fmt(v, 1)));
  })();

  /* ===== ReLU + Pooling ===== */
  (function pool() {
    const typeIn = $('#pool-t'), reluIn = $('#pool-relu'), box = $('#pool-mats'), out = $('#pool-out');
    let A = [[3, -1, 0, 2], [1, 5, -2, -4], [-3, 2, 6, 1], [0, -1, 1, 4]];
    let seed = 9, lastEv = null;
    const blk = (i, j) => 'g' + (Math.floor(i / 2) * 2 + Math.floor(j / 2));
    function render() {
      const R = reluIn.checked ? A.map((r) => r.map((v) => Math.max(0, v))) : A;
      const t = typeIn.value;
      const Pm = [[0, 0], [0, 0]], lines = [], maxPos = new Set();
      for (let bi = 0; bi < 2; bi++) for (let bj = 0; bj < 2; bj++) {
        const vals = [R[2 * bi][2 * bj], R[2 * bi][2 * bj + 1], R[2 * bi + 1][2 * bj], R[2 * bi + 1][2 * bj + 1]];
        let v;
        if (t === 'max') {
          v = Math.max(...vals);
          const k = vals.indexOf(v);
          maxPos.add(`${2 * bi + (k >> 1)},${2 * bj + (k & 1)}`);
        } else if (t === 'avg') v = vals.reduce((a, b) => a + b, 0) / 4;
        else v = vals.reduce((a, b) => a + b, 0);
        Pm[bi][bj] = v;
        lines.push(`${t}(${vals.join(', ')}) = <strong>${fmt(v, 2)}</strong>`);
      }
      box.innerHTML = '';
      box.append(matrix(A, { caption: '原始特徵圖 4×4', cls: blk, onClick: (i, j) => { A[i][j] += lastEv && lastEv.shiftKey ? -1 : 1; render(); } }));
      if (reluIn.checked) {
        box.append(el('span', { class: 'op', text: '→ReLU→' }));
        box.append(matrix(R, { caption: 'ReLU 後', cls: (i, j) => blk(i, j) + (maxPos.has(`${i},${j}`) ? ' maxcell' : '') }));
      }
      box.append(el('span', { class: 'op', text: '→pool→' }));
      box.append(matrix(Pm, { caption: '池化後 2×2', cls: (i, j) => 'g' + (i * 2 + j) }));
      const zeroed = A.flat().filter((v) => v < 0).length;
      out.innerHTML = lines.join('<br>') + `<br><span class="muted">4×4 = 16 個數字 → 2×2 = 4 個：尺寸減半，資料量剩 1/4，而且這一層沒有任何要學的參數。` +
        (reluIn.checked && zeroed ? `ReLU 把 ${zeroed} 個負數變成 0。` : '') + '</span>';
    }
    box.addEventListener('pointerdown', (ev) => { lastEv = ev; }, true);
    typeIn.addEventListener('change', render);
    reluIn.addEventListener('change', render);
    $('#pool-rand').addEventListener('click', () => {
      const r = rng(seed++);
      A = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => Math.floor(r() * 12) - 5));
      render();
    });
    render();
  })();

  /* ===== 尺寸計算器 ===== */
  (function size() {
    const f = { type: $('#sz-type'), n: $('#sz-n'), c: $('#sz-c'), f: $('#sz-f'), p: $('#sz-p'), s: $('#sz-s'), nf: $('#sz-nf') };
    const out = $('#sz-out');
    function upd() {
      const conv = f.type.value === 'conv';
      $('#sz-nf-l').style.display = conv ? '' : 'none';
      const n = Math.max(1, Math.round(+f.n.value || 1)), c = Math.max(1, Math.round(+f.c.value || 1)), k = Math.max(1, Math.round(+f.f.value || 1));
      const p = Math.max(0, Math.round(+f.p.value || 0)), s = Math.max(1, Math.round(+f.s.value || 1)), nf = Math.max(1, Math.round(+f.nf.value || 1));
      out.innerHTML = '';
      if (n + 2 * p < k) { out.innerHTML = '<span class="bad">濾波器比（padding 後的）輸入還大，無法計算。</span>'; return; }
      const m = outSize(n, k, p, s), depth = conv ? nf : c;
      const d1 = el('div'); out.append(d1);
      tex(d1, `m=\\left\\lfloor\\frac{${n}+2\\times${p}-${k}}{${s}}\\right\\rfloor+1=\\left\\lfloor\\frac{${n + 2 * p - k}}{${s}}\\right\\rfloor+1=${m}`, true);
      out.append(el('div', { html: `輸出尺寸：<span class="big">${m} × ${m} × ${depth}</span>` + (conv ? '　（深度 = 濾波器數量）' : '　（池化不改變深度）') }));
      if ((n + 2 * p - k) % s !== 0) out.append(el('div', { class: 'muted', text: '不整除：向下取整，最右邊／最下面有幾格不會被濾波器蓋到。' }));
      const d2 = el('div', { style: 'margin-top:6px' }); out.append(d2);
      if (conv) {
        const params = (k * k * c + 1) * nf;
        tex(d2, `\\text{參數量}=((${k}\\times${k}\\times${c})+1)\\times${nf}=${(k * k * c + 1)}\\times${nf}=${int(params).replace(/,/g, '{,}')}`);
      } else {
        d2.innerHTML = '參數量：<strong>0</strong>（池化只是取最大值／平均，沒有要學的權重）';
      }
    }
    Object.values(f).forEach((x) => x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', upd));
    $$('[data-sz]').forEach((b) => b.addEventListener('click', () => {
      const [t, n, c, k, p, s, nf] = b.dataset.sz.split(',');
      f.type.value = t; f.n.value = n; f.c.value = c; f.f.value = k; f.p.value = p; f.s.value = s; f.nf.value = nf;
      upd();
    }));
    upd();
  })();

  /* ===== MNIST CNN ===== */
  (function cnn() {
    const ids = ['in', 'c1', 'c2', 'k', 'fc', 'out'];
    const inp = {}; ids.forEach((k) => { inp[k] = $('#cnn-' + k); });
    const DEF = { in: 28, c1: 32, c2: 64, k: 3, fc: 128, out: 10 };
    const tbl = $('#cnn-table'), bars = $('#cnn-bars'), cmp = $('#cnn-cmp');
    function upd() {
      const v = {}; ids.forEach((k) => { v[k] = Math.max(1, Math.round(+inp[k].value || 1)); });
      const k = v.k, n1 = v.in - k + 1, n2 = n1 - k + 1, n3 = Math.floor(n2 / 2);
      if (n3 < 1) { tbl.innerHTML = '<p class="bad" style="padding:8px 12px;margin:0">輸入太小，卷積兩次後就沒有東西了。</p>'; bars.innerHTML = ''; cmp.innerHTML = ''; return; }
      const L = n3 * n3 * v.c2;
      const rows = [
        ['Input', `${v.in}×${v.in}×1`, '灰階圖', 0],
        ['Conv_1', `${n1}×${n1}×${v.c1}`, `${v.in}−${k}+1 = ${n1}；((${k}×${k}×1)+1)×${v.c1}`, (k * k + 1) * v.c1],
        ['ReLU', `${n1}×${n1}×${v.c1}`, '不變', 0, true],
        ['Conv_2', `${n2}×${n2}×${v.c2}`, `${n1}−${k}+1 = ${n2}；((${k}×${k}×${v.c1})+1)×${v.c2}`, (k * k * v.c1 + 1) * v.c2],
        ['ReLU', `${n2}×${n2}×${v.c2}`, '不變', 0, true],
        ['Max Pool', `${n3}×${n3}×${v.c2}`, `⌊${n2} ÷ 2⌋ = ${n3}`, 0],
        ['Flatten', `${int(L)}`, `${n3}×${n3}×${v.c2}`, 0],
        ['FC', `${v.fc}`, `(${int(L)}+1)×${v.fc}`, (L + 1) * v.fc],
        ['Output（FC＋Softmax）', `${v.out}`, `(${v.fc}+1)×${v.out}`, (v.fc + 1) * v.out],
      ];
      const total = rows.reduce((a, r) => a + r[3], 0);
      const pct = (r) => fmt(r * 100, r < 0.01 ? 3 : 1) + '%';
      let html = '<table><tr><th>層</th><th>輸出</th><th>怎麼算</th><th class="num">參數量</th><th class="num">占比</th></tr>';
      rows.forEach(([name, shape, how, p, muted]) => {
        html += `<tr${muted ? ' class="muted"' : ''}><td>${name}</td><td class="mono">${shape}</td><td class="mono" style="font-size:.85rem">${how}</td><td class="num">${int(p)}</td><td class="num">${p ? pct(p / total) : '—'}</td></tr>`;
      });
      html += `<tr><td><strong>合計</strong></td><td></td><td></td><td class="num"><strong>${int(total)}</strong></td><td class="num">100%</td></tr></table>`;
      tbl.innerHTML = html;
      bars.innerHTML = '';
      rows.filter((r) => r[3] > 0).forEach(([name, , , p]) => {
        bars.append(el('div', { class: 'bar-row' }, [
          el('span', { text: name.replace('（FC＋Softmax）', '') }),
          el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill', style: `width:${(p / total) * 100}%` })]),
          el('span', { class: 'val', text: pct(p / total) }),
        ]));
      });
      const isDef = ids.every((key) => v[key] === DEF[key]);
      const dense = v.in * v.in * n1 * n1 * v.c1, c1p = (k * k + 1) * v.c1;
      cmp.innerHTML = (isDef ? (total === 1199882 ? '<div class="good">✓ 合計 1,199,882，與講義相同。</div>' : '<div class="bad">✗ 與講義不同，請檢查。</div>') : '') +
        `<div><strong>為什麼 CNN 有用？</strong>如果第一層改用一般的全連接層，輸出一樣多的節點（${n1}×${n1}×${v.c1} = ${int(n1 * n1 * v.c1)}）：</div>` +
        `<div class="mono">${v.in * v.in} × ${int(n1 * n1 * v.c1)} = <strong>${int(dense)}</strong> 個參數（未計 bias）</div>` +
        `<div>CNN 的 Conv_1 只要 <strong>${int(c1p)}</strong> 個，差了約 <strong>${int(dense / c1p)}</strong> 倍：局部連接 ＋ 權重共享。</div>`;
    }
    ids.forEach((k) => inp[k].addEventListener(inp[k].tagName === 'SELECT' ? 'change' : 'input', upd));
    $('#cnn-reset').addEventListener('click', () => { ids.forEach((k) => { inp[k].value = DEF[k]; }); upd(); });
    upd();
  })();
})();
