/* C4 Part 2 互動元件 */
(function () {
  'use strict';
  const { $, $$, el, fmt, int, cssVar, setupCanvas, onRedraw, bindRange } = CV;

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
  const ok = (s) => `<div class="good" style="margin-top:6px">✓ ${s}</div>`;
  const posInt = (input, min = 1) => Math.max(min, Math.round(Number(input.value) || 0));
  function bindSeg(attr, onPick) {
    const btns = $$(`[data-${attr}]`);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onPick(b.dataset[attr]);
    }));
  }
  // 各來源層的顏色（x₀ 用灰色）
  const LAYER_COLORS = [
    'var(--c-b)', 'var(--c-a)', 'var(--c-c)', 'var(--pos)',
    'color-mix(in srgb, var(--c-b) 50%, var(--c-a))', 'color-mix(in srgb, var(--c-c) 50%, var(--pos))',
  ];
  const layerColor = (i) => (i === 0 ? 'color-mix(in srgb, var(--text-2) 55%, var(--surface))' : LAYER_COLORS[(i - 1) % LAYER_COLORS.length]);

  /* ===== Dense Block：通道一層一層疊上去 ===== */
  (function denseBlock() {
    const k0In = $('#dn-k0'), kIn = $('#dn-k'), lIn = $('#dn-l');
    let mode = 'dense';
    function upd() {
      const k0 = Math.min(512, posInt(k0In)), k = Number(kIn.value), L = Number(lIn.value);
      const dense = mode === 'dense';
      const W = 640, H = 270, base = 222, top = 26, cols = L + 1, colW = W / cols;
      const bw = Math.min(colW * 0.56, 46);
      const maxC = dense ? k0 + k * L : k0;
      const sy = (base - top) / maxC;
      const svg = svgRoot(W, H, dense ? 'Dense Block 各層輸入通道組成' : 'ResNet 各層通道數');
      for (let c = 0; c < cols; c++) {
        const cx = colW * c + colW / 2, isOut = c === L;
        const nSrc = c + 1; // 第 c+1 層的輸入：x₀ … x_c；輸出欄：x₀ … x_L
        let y = base, total = 0;
        if (dense) {
          for (let s = 0; s < nSrc; s++) {
            const ch = s === 0 ? k0 : k;
            const h = ch * sy;
            y -= h; total += ch;
            svg.append(svgEl('rect', { x: cx - bw / 2, y, width: bw, height: Math.max(h - 1, 0.5), style: `fill:${layerColor(s)};stroke:var(--surface);stroke-width:1` }));
          }
        } else {
          const h = k0 * sy; y -= h; total = k0;
          svg.append(svgEl('rect', { x: cx - bw / 2, y, width: bw, height: h, rx: 3, style: 'fill:color-mix(in srgb, var(--accent) 45%, var(--surface-2));stroke:var(--border)' }));
          if (c > 0 && bw > 26) svg.append(svgText(cx, y + h / 2 + 4, 'F+x', 'font-size:10.5px'));
        }
        svg.append(svgText(cx, y - 6, String(total), `font-family:var(--mono);font-size:11.5px;font-weight:600;${isOut ? 'fill:var(--accent)' : ''}`));
        svg.append(svgText(cx, base + 18, isOut ? '區塊輸出' : `第 ${c + 1} 層`, `font-size:${cols > 9 ? 10 : 11.5}px;${isOut ? 'font-weight:700' : ''}`));
        svg.append(svgText(cx, base + 34, isOut ? '' : dense ? `輸出 +${k}` : `輸出 ${k0}`, 'font-size:10px;fill:var(--text-2)'));
      }
      // 圖例
      if (dense) {
        const items = Math.min(L, 6);
        let lx = 8;
        for (let s = 0; s <= items; s++) {
          svg.append(svgEl('rect', { x: lx, y: 6, width: 10, height: 10, style: `fill:${layerColor(s)}` }));
          const t = s === 0 ? `x₀（區塊輸入 ${k0}）` : `x${'₀₁₂₃₄₅₆₇₈₉'[s] || s}`;
          svg.append(svgText(lx + 14, 15, t, 'font-size:10.5px;fill:var(--text-2)', 'start'));
          lx += s === 0 ? 120 : 34;
        }
        if (L > 6) svg.append(svgText(lx + 2, 15, '…', 'font-size:10.5px;fill:var(--text-2)', 'start'));
      }
      const box = $('#dn-svg'); box.innerHTML = ''; box.append(svg);

      let html;
      if (dense) {
        const ins = Array.from({ length: L }, (_, i) => k0 + k * i);
        const out = k0 + k * L, links = (L * (L + 1)) / 2;
        html = `各層輸入：<span class="mono">${ins.join(' → ')}</span>（每次 +${k}）<br>`;
        html += `每層輸出固定 <strong>${k}</strong> 個；區塊輸出 \\(k_0+kL=${k0}+${k}\\times${L}=\\) <strong>${out}</strong><br>`;
        html += `直接連接 \\(L(L+1)/2=\\) <strong>${links}</strong> 條（一般 CNN 只有 ${L} 條）；第 ${L} 層同時拿得到 ${L} 個來源的特徵。`;
        if (k0 === 64 && k === 32 && L === 6) html += ok('DenseNet-121 Block 1：64、96、128、160、192、224 → 輸出 256，和 4.1 相同');
      } else {
        html = `ResNet：每層輸入、輸出都是 <strong>${k0}</strong> 個通道（相加要求形狀相同）。<br>`;
        html += '每層的結果是 \\(F(x)+x\\)，舊特徵和新特徵加在一起，後面的層<strong>拿不回</strong>原本的 \\(x_0\\)；想保留更多資訊，只能把每層做寬。';
      }
      const o = $('#dn-out'); o.innerHTML = html; CV.renderMath(o);
    }
    bindSeg('dmode', (v) => { mode = v; upd(); });
    k0In.addEventListener('input', upd);
    bindRange(kIn, upd);
    bindRange(lIn, upd);
  })();

  /* ===== Bottleneck 什麼時候才省 ===== */
  (function bottleneck() {
    const BLK = [[64, 6], [128, 12], [256, 24], [512, 16]];
    const blkIn = $('#bt-blk'), kIn = $('#bt-k'), lIn = $('#bt-l'), canvas = $('#bt-canvas');
    const noB = (C, k) => 9 * C * k;
    const withB = (C, k) => 4 * C * k + 36 * k * k;
    function cfg() {
      const [k0, n] = BLK[Number(blkIn.value)];
      return { k0, n, k: Number(kIn.value), L: Math.min(Number(lIn.value), n) };
    }
    function draw() {
      const { k0, n, k, L } = cfg();
      const { ctx, w, h } = setupCanvas(canvas, 0.46);
      const pad = { l: 64, r: 14, t: 16, b: 34 };
      const xs = (l) => pad.l + ((l - 1) / Math.max(n - 1, 1)) * (w - pad.l - pad.r);
      const Cn = k0 + k * (n - 1);
      const ymax = Math.max(noB(Cn, k), withB(Cn, k), withB(k0, k)) * 1.08;
      const ys = (v) => h - pad.b - (v / ymax) * (h - pad.t - pad.b);
      const text = cssVar('--text'), text2 = cssVar('--text-2'), border = cssVar('--border');
      ctx.strokeStyle = border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b); ctx.stroke();
      ctx.fillStyle = text2; ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const v = (ymax / 1.08) * (i / 4);
        ctx.fillText(v >= 1e3 ? fmt(v / 1e3, 0) + 'K' : fmt(v, 0), pad.l - 6, ys(v) + 4);
      }
      ctx.textAlign = 'center';
      const step = n > 12 ? 4 : n > 6 ? 2 : 1;
      for (let l = 1; l <= n; l += step) ctx.fillText(String(l), xs(l), h - pad.b + 15);
      ctx.fillText('區塊內第幾層', (pad.l + w - pad.r) / 2, h - 4);
      // 分界：C = 7.2k
      const lStar = (7.2 * k - k0) / k + 1;
      if (lStar > 1 && lStar < n) {
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = text2;
        ctx.beginPath(); ctx.moveTo(xs(lStar), pad.t); ctx.lineTo(xs(lStar), h - pad.b); ctx.stroke(); ctx.restore();
        ctx.fillStyle = text2; ctx.textAlign = 'left'; ctx.fillText(`C = 7.2k = ${fmt(7.2 * k, 1)}`, xs(lStar) + 4, pad.t + 10);
      }
      const series = [[noB, cssVar('--c-b'), '無 bottleneck 9Ck'], [withB, cssVar('--c-a'), '有 bottleneck 4Ck+36k²']];
      series.forEach(([f, color]) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        for (let l = 1; l <= n; l++) { const C = k0 + k * (l - 1); const x = xs(l), y = ys(f(C, k)); l === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
        const C = k0 + k * (L - 1);
        ctx.beginPath(); ctx.arc(xs(L), ys(f(C, k)), 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      });
      ctx.textAlign = 'left'; ctx.font = '12px system-ui, sans-serif';
      series.forEach(([, color, label], i) => {
        ctx.fillStyle = color; ctx.fillRect(pad.l + 10, pad.t + 4 + i * 18, 12, 3);
        ctx.fillStyle = text; ctx.fillText(label, pad.l + 28, pad.t + 9 + i * 18);
      });
    }
    function upd() {
      const { k0, n, k, L } = cfg();
      const C = k0 + k * (L - 1), a = noB(C, k), b = withB(C, k), r = b / a;
      let html = `第 ${L} 層輸入 \\(C=${k0}+${k}\\times${L - 1}=${C}\\)<br>`;
      html += `無 bottleneck：\\(9\\times${C}\\times${k}=\\) <strong>${int(a)}</strong><br>`;
      html += `有 bottleneck：\\(${C}\\times${4 * k}+9\\times${4 * k}\\times${k}=${int(4 * C * k)}+${int(36 * k * k)}=\\) <strong>${int(b)}</strong><br>`;
      html += `比值 \\(\\tfrac49+\\tfrac{4k}{C}=${fmt(4 / 9, 3)}+${fmt((4 * k) / C, 3)}=\\) <strong class="${r < 1 ? 'good' : 'bad'}">${fmt(r, 3)}</strong>：${r < 1 ? `省下 ${fmt((1 - r) * 100, 1)}%` : `反而多 ${fmt((r - 1) * 100, 1)}%（C ≤ 7.2k = ${fmt(7.2 * k, 1)}）`}`;
      if (C === 992 && k === 32) html += ok('285,696 vs 163,840（0.573 倍），和 4.3 的逐步展開相同');
      if (C === 512 && k === 32) html += ok('自我測驗第 5 題：147,456 vs 102,400（0.694 倍）');
      if (C === 64 && k === 32) html += ok('反例：18,432 vs 45,056，bottleneck 反而是 2.44 倍');
      const o = $('#bt-out'); o.innerHTML = html; CV.renderMath(o);
      draw();
    }
    function syncMax() {
      const n = BLK[Number(blkIn.value)][1];
      lIn.max = n;
      if (Number(lIn.value) > n) lIn.value = n;
      lIn.dispatchEvent(new Event('input'));
    }
    blkIn.addEventListener('change', syncMax);
    kIn.addEventListener('change', upd);
    $$('[data-bt]').forEach((btn) => btn.addEventListener('click', () => {
      const [b, k, l] = btn.dataset.bt.split(',');
      blkIn.value = b; kIn.value = k; lIn.max = BLK[Number(b)][1]; lIn.value = l;
      lIn.dispatchEvent(new Event('input'));
    }));
    bindRange(lIn, upd);
    CV.onRedraw(draw);
  })();

  /* ===== DenseNet 整個網路 ===== */
  (function network() {
    const vIn = $('#net-v'), kIn = $('#net-k'), tIn = $('#net-t'), bIn = $('#net-b');
    const RESNET50 = 25557032;
    function upd() {
      const blocks = vIn.value.split(',').map(Number), k = Number(kIn.value), theta = Number(tIn.value), useB = bIn.checked;
      const init = 2 * k;
      const rows = [];
      let c = init, s = 56;
      rows.push(['Stem：7×7 Conv（2k）＋ Max Pool', `${s}×${s}×${init}`, 7 * 7 * 3 * init + 2 * init, `7×7×3×${init} ＋ BN 2×${init}`]);
      blocks.forEach((n, i) => {
        const cin = c;
        let p = 0;
        for (let l = 0; l < n; l++) {
          p += useB ? 2 * c + c * 4 * k + 2 * 4 * k + 9 * 4 * k * k : 2 * c + 9 * c * k;
          c += k;
        }
        rows.push([`Dense Block ${i + 1}（${n} 層）`, `${s}×${s}×${c}`, p, `${cin} ＋ ${n}×${k} = ${c}`]);
        if (i < blocks.length - 1) {
          const co = Math.floor(theta * c);
          rows.push([`Transition ${i + 1}`, `${s / 2}×${s / 2}×${co}`, 2 * c + c * co, `⌊${theta}×${c}⌋ = ${co}、${s} ÷ 2`]);
          c = co; s /= 2;
        }
      });
      rows.push(['BN ＋ GAP ＋ FC 1000', '1000', 2 * c + c * 1000 + 1000, `(${c}+1)×1000 ＋ BN 2×${c}`]);
      const total = rows.reduce((a, r) => a + r[2], 0);
      const depth = 1 + blocks.reduce((a, b) => a + b, 0) * (useB ? 2 : 1) + (blocks.length - 1) + 1;
      let html = '<table><tr><th>階段</th><th>輸出</th><th>怎麼算</th><th class="num">參數量</th></tr>';
      rows.forEach(([name, shape, p, how]) => {
        html += `<tr${name.startsWith('Transition') ? ' class="muted"' : ''}><td>${name}</td><td class="mono">${shape}</td><td class="mono" style="font-size:.82rem">${how}</td><td class="num">${int(p)}</td></tr>`;
      });
      html += `<tr><td><strong>合計</strong></td><td></td><td></td><td class="num"><strong>${int(total)}</strong></td></tr></table>`;
      $('#net-table').innerHTML = html;
      const bars = $('#net-bars'); bars.innerHTML = '';
      const maxV = Math.max(total, RESNET50);
      [[`這個 DenseNet`, total, 'var(--pos)'], ['ResNet-50', RESNET50, 'var(--c-b)']].forEach(([name, v, color]) => {
        bars.append(el('div', { class: 'bar-row', style: 'grid-template-columns:7em 1fr 5em' }, [
          el('span', { text: name, style: 'font-size:.85rem' }),
          el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill', style: `width:${(100 * v) / maxV}%;background:${color}` })]),
          el('span', { class: 'val', text: fmt(v / 1e6, 2) + 'M' }),
        ]));
      });
      const name = `DenseNet${useB ? (theta < 1 ? '-BC' : '-B') : theta < 1 ? '-C' : ''}-${depth}`;
      let out = `${name}：深度 \\(1+${blocks.reduce((a, b) => a + b, 0)}\\times${useB ? 2 : 1}+${blocks.length - 1}+1=${depth}\\) 層，參數 <strong>${int(total)}</strong>（約 ${fmt(total / 1e6, 2)}M），是 ResNet-50 的 ${fmt((100 * total) / RESNET50, 1)}%。`;
      out += `<div class="muted" style="margin-top:4px;font-size:.9rem">最後一個區塊輸出 ${c} 個通道、7×7；卷積無 bias，BN 每通道 2 個參數（\\(\\gamma,\\beta\\)）。</div>`;
      const key = [vIn.value, k, theta, useB].join('|');
      const CHECK = {
        '6,12,24,16|32|0.5|true': 'DenseNet-121 = 7,978,856 ≈ 8.0M，與 torchvision densenet121 相同',
        '6,12,32,32|32|0.5|true': 'DenseNet-169 = 14,149,480 ≈ 14.1M（論文 14.1M）',
        '6,12,48,32|32|0.5|true': 'DenseNet-201 = 20,013,928 ≈ 20.0M（論文 20.0M）',
        '6,12,64,48|32|0.5|true': 'DenseNet-264 = 33,337,704 ≈ 33.3M（論文 33.3M）',
        '6,12,24,16|32|0.5|false': '拿掉 bottleneck：10,869,096，比有 bottleneck 多約 36%',
      };
      if (CHECK[key]) out += ok(CHECK[key]);
      const o = $('#net-out'); o.innerHTML = out; CV.renderMath(o);
    }
    [vIn, kIn, tIn, bIn].forEach((i) => i.addEventListener('change', upd));
    upd();
  })();
})();
