/* 考題問答：依各章內容整理排列，每段內容下面接對應的考題（題目 → 輸入框 → 正確答案） */
(() => {
  const { $, $$, el } = window.CV;
  const KEY = 'cv-exam-input';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 無法儲存時只是不記住 */ } };

  // 重點章節（CNN、C3、C4、C5）排前面，C1 放最後
  const ORDER = ['c2', 'c3', 'c4', 'c4-2', 'c5', 'c1'];
  const KEY_CH = new Set(['c2', 'c3', 'c4', 'c5']);
  const FILTERS = [['all', '全部'], ['c2', 'C2'], ['c3', 'C3'], ['c4', 'C4'], ['c5', 'C5'], ['c1', 'C1']];

  function question(d, inputs) {
    const box = el('textarea', { class: 'ex-input', rows: '3', placeholder: 'Please Input', 'aria-label': '作答' });
    box.value = inputs[d.id] || '';
    box.addEventListener('input', () => { const v = load(); v[d.id] = box.value; save(v); });
    const ans = el('div', { class: 'ex-ans', hidden: '' }, [el('p', { class: 'ex-ans-text', text: d.a })]);
    if (d.f) {
      // 公式列在答案下方，作答時用文字說明即可
      const math = el('div', { class: 'ex-f-math', text: d.f });
      CV.tex(math, d.f, true);
      ans.append(el('div', { class: 'ex-formula' }, [
        el('p', { class: 'ex-f-head', text: '📐 公式（參考，作答用文字說明即可）' }), math,
        d.fn ? el('p', { class: 'ex-f-note', text: d.fn }) : null,
      ]));
    }
    const btn = el('button', { class: 'btn', type: 'button', text: '正確答案', 'aria-expanded': 'false' });
    btn.addEventListener('click', () => {
      ans.hidden = !ans.hidden;
      btn.setAttribute('aria-expanded', String(!ans.hidden));
      btn.textContent = ans.hidden ? '正確答案' : '收起答案';
    });
    return el('div', { class: 'ex-item' }, [el('p', { class: 'ex-q', text: d.q }), box, btn, ans]);
  }

  function render(filter) {
    const inputs = load();
    const byAt = {};
    window.EXAM_DATA.forEach((d, i) => { (byAt[d.at] = byAt[d.at] || []).push({ ...d, id: i }); });
    const chapters = Object.fromEntries(window.EXAM_CONTENT.map((c) => [c.id, c]));
    const list = $('#ex-list');
    list.textContent = '';
    for (const id of ORDER) {
      const c = chapters[id];
      if (!c || (filter !== 'all' && c.ch !== filter)) continue;
      const badge = KEY_CH.has(c.ch) ? el('span', { class: 'ex-badge', text: '⭐ 重點' }) : el('span', { class: 'ex-badge base', text: '基礎' });
      list.append(el('h2', { class: 'ex-ch' }, [document.createTextNode(c.title + ' '), badge]));
      for (const g of c.groups) {
        list.append(el('h3', { class: 'ex-group', text: g.title }));
        for (const it of g.items) {
          const qs = byAt[it.at] || [];
          const sec = el('section', { class: 'ex-sec' }, [
            el('div', { class: 'ex-note' }, [el('h4', { text: it.label }), el('div', { html: it.html })]),
          ]);
          if (qs.length) sec.append(el('p', { class: 'ex-label', text: '✍️ 考題' }), ...qs.map((d) => question(d, inputs)));
          list.append(sec);
        }
      }
    }
    if (window.renderMathInElement) CV.renderMath(list);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const seg = $('#ex-chs');
    for (const [id, label] of FILTERS) {
      const b = el('button', { class: 'btn', type: 'button', text: label, 'aria-pressed': String(id === 'all') });
      b.addEventListener('click', () => {
        $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        render(id);
      });
      seg.append(b);
    }
    render('all');
  });
})();
