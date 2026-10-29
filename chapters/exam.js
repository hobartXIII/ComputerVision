/* 考題問答：題目 → 輸入框 → 正確答案 */
(() => {
  const { $, $$, el } = window.CV;
  const KEY = 'cv-exam-input';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 無法儲存時只是不記住 */ } };

  const CHS = [['all', '全部'], ['c1', 'C1'], ['c2', 'C2'], ['c3', 'C3'], ['c4', 'C4'], ['c5', 'C5']];

  function render(ch) {
    const inputs = load();
    const list = $('#ex-list');
    list.textContent = '';
    const items = window.EXAM_DATA.map((d, i) => ({ ...d, id: i })).filter((d) => ch === 'all' || d.ch === ch);
    for (const d of items) {
      const box = el('textarea', { class: 'ex-input', rows: '3', placeholder: 'Please Input', 'aria-label': '作答' });
      box.value = inputs[d.id] || '';
      box.addEventListener('input', () => { const v = load(); v[d.id] = box.value; save(v); });
      const ans = el('div', { class: 'ex-ans', hidden: '' }, [el('p', { class: 'ex-ans-text', text: d.a })]);
      const btn = el('button', { class: 'btn', type: 'button', text: '正確答案', 'aria-expanded': 'false' });
      btn.addEventListener('click', () => {
        ans.hidden = !ans.hidden;
        btn.setAttribute('aria-expanded', String(!ans.hidden));
        btn.textContent = ans.hidden ? '正確答案' : '收起答案';
      });
      list.append(el('li', { class: 'ex-item' }, [
        el('p', { class: 'ex-q' }, [el('span', { class: 'ex-tag', text: d.ch.toUpperCase() }), document.createTextNode(d.q)]),
        box, btn, ans,
      ]));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const seg = $('#ex-chs');
    for (const [id, label] of CHS) {
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
