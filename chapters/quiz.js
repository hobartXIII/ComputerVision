/* 期中模擬題庫：練習模式、模擬考模式、錯題本（題目在 quiz-data.js） */
(function () {
  'use strict';
  const { el, $, $$ } = window.CV;
  const DATA = window.QUIZ_DATA;
  const LETTER = 'ABCD';
  const CHS = [
    { id: 'c0', no: 'C0（不考）' }, { id: 'c1', no: 'C1' }, { id: 'c2', no: 'C2' }, { id: 'c3', no: 'C3' },
    { id: 'c4', no: 'C4（含 DenseNet）' }, { id: 'c5', no: 'C5' },
  ];
  const PAGE_NO = { c0: 'C0', c1: 'C1', c2: 'C2', c3: 'C3', c4: 'C4', 'c4-2': 'C4-2', c5: 'C5' };
  const ALL = [
    ...DATA.mcq.map((q) => Object.assign({ type: 'mcq' }, q)),
    ...DATA.short.map((q) => Object.assign({ type: 'short' }, q)),
  ];
  const BY_ID = new Map(ALL.map((q) => [q.id, q]));

  /* ---------- 錯題本：存在 localStorage，讀寫失敗時只留在記憶體 ---------- */
  const KEY = 'cv-quiz-wrong';
  let wrongSet = null;
  function wrong() {
    if (wrongSet) return wrongSet;
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      wrongSet = new Set(Array.isArray(v) ? v.filter((id) => BY_ID.has(id)) : []);
    } catch (e) { wrongSet = new Set(); }
    return wrongSet;
  }
  function saveWrong() {
    try { localStorage.setItem(KEY, JSON.stringify([...wrong()])); } catch (e) { /* 無法儲存就算了 */ }
  }
  // 答錯加進錯題本，答對（或自評「會了」）就移除
  function markWrong(id, isWrong) {
    if (isWrong) wrong().add(id); else wrong().delete(id);
    saveWrong();
  }

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const btn = (text, onClick, cls = 'btn') => el('button', { class: cls, type: 'button', text, onclick: onClick });
  const wrapTables = (root) => {
    for (const t of $$('table', root)) {
      if (t.parentElement.classList.contains('table-wrap')) continue;
      const w = el('div', { class: 'table-wrap' });
      t.replaceWith(w);
      w.append(t);
    }
  };

  /* ---------- 設定（練習、模擬考共用章節） ---------- */
  const settings = {
    chs: new Set(CHS.map((c) => c.id)),
    type: 'mcq', order: 'seq', onlyWrong: false, nMcq: 25, nShort: 5,
  };
  const pool = (type) => ALL.filter((q) => (type === 'both' || q.type === type) && settings.chs.has(q.ch));

  function chapterBar(onChange) {
    const seg = el('span', { class: 'seg' });
    for (const c of CHS) {
      const b = btn(c.no, () => {
        if (settings.chs.has(c.id)) {
          if (settings.chs.size === 1) return;   // 至少留一章
          settings.chs.delete(c.id);
        } else settings.chs.add(c.id);
        b.setAttribute('aria-pressed', String(settings.chs.has(c.id)));
        onChange();
      });
      b.setAttribute('aria-pressed', String(settings.chs.has(c.id)));
      seg.append(b);
    }
    const all = btn('全選', () => {
      CHS.forEach((c) => settings.chs.add(c.id));
      $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', 'true'));
      onChange();
    });
    return el('div', { class: 'qz-bar' }, [el('span', { class: 'lbl', text: '章節' }), seg, all]);
  }

  function choiceBar(label, key, options, onChange) {
    const seg = el('span', { class: 'seg' });
    for (const [v, t] of options) {
      const b = btn(t, () => {
        settings[key] = v;
        $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        if (onChange) onChange();
      });
      b.setAttribute('aria-pressed', String(settings[key] === v));
      seg.append(b);
    }
    return el('div', { class: 'qz-bar' }, [el('span', { class: 'lbl', text: label }), seg]);
  }

  /* ---------- 題目卡片 ---------- */
  function meta(q, idx) {
    return el('div', { class: 'qz-meta' }, [
      el('span', { text: (idx ? `第 ${idx} 題　·　` : '') + `${PAGE_NO[q.page]}　·　${q.type === 'mcq' ? '選擇' : '問答'} ${q.n}` }),
      q.star ? el('span', { class: 'tag add', text: '⭐ 模擬考／老師提過' }) : null,
      el('a', { href: q.page + '.html', target: '_blank', rel: 'noopener', text: '看筆記 ↗' }),
    ]);
  }

  // 選擇題。instant = true：選了馬上判斷（練習）；false：可改答案，交卷後才 reveal（模擬考）
  function mcqCard(q, st, opt) {
    const opts = el('div', { class: 'opts' });
    const explain = el('div', { class: 'explain' });
    const card = el('div', { class: 'quiz' }, [meta(q, opt.idx), el('p', { class: 'q', html: q.q }), opts, explain]);
    const btns = q.o.map((t, k) => {
      const b = el('button', { type: 'button', html: `<span class="k">(${LETTER[k]})</span>${t}` });
      b.addEventListener('click', () => pick(k));
      opts.append(b);
      return b;
    });
    function reveal() {
      const s = st.get(q.id) || {};
      btns.forEach((b, k) => {
        b.disabled = true;
        b.removeAttribute('aria-pressed');
        if (k === q.a) b.classList.add('right');
        else if (k === s.pick) b.classList.add('wrong');
      });
      const ok = s.pick === q.a;
      card.classList.add(ok ? 'ok' : 'ng');
      const head = ok ? '<span class="good">答對！</span> '
        : s.pick === undefined ? `<span class="bad">沒有作答</span>，正確答案是 (${LETTER[q.a]})。 `
          : `<span class="bad">答錯</span>，正確答案是 (${LETTER[q.a]})。 `;
      explain.innerHTML = head + q.e;
    }
    function pick(k) {
      if (opt.instant) {
        if (st.has(q.id)) return;
        st.set(q.id, { pick: k, ok: k === q.a });
        markWrong(q.id, k !== q.a);
        reveal();
      } else {
        if (opt.locked()) return;
        st.set(q.id, { pick: k });
        btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === k)));
      }
      if (opt.onAnswer) opt.onAnswer();
    }
    const s = st.get(q.id);
    if (s && s.pick !== undefined) {
      if (opt.instant) reveal();
      else btns[s.pick].setAttribute('aria-pressed', 'true');
    }
    return { node: card, pick, reveal };
  }

  // 問答題：先寫答案，看參考答案後自評「會了／還不會」
  function shortCard(q, st, opt) {
    const s = st.get(q.id) || {};
    const ta = el('textarea', { placeholder: '先寫下你的答案，再看參考答案…', 'aria-label': '你的答案' });
    ta.value = s.text || '';
    ta.addEventListener('input', () => {
      const cur = st.get(q.id) || {};
      cur.text = ta.value;
      st.set(q.id, cur);
      if (opt.onAnswer) opt.onAnswer();
    });
    const ans = el('div', { class: 'qz-ans', html: q.a });
    wrapTables(ans);
    ans.hidden = true;
    const yes = btn('✓ 會了', () => setSelf(true));
    const no = btn('✗ 還不會', () => setSelf(false));
    const self = el('div', { class: 'qz-bar' }, [el('span', { class: 'lbl', text: '自評' }), yes, no]);
    self.hidden = true;
    const show = btn('看參考答案', () => reveal());
    show.hidden = !opt.instant;   // 模擬考要交卷後才能看
    const card = el('div', { class: 'quiz' }, [
      meta(q, opt.idx), el('p', { class: 'q', html: q.q }), ta, el('div', { class: 'qz-bar' }, [show]), ans, self,
    ]);
    function paint(ok) {
      yes.setAttribute('aria-pressed', String(ok === true));
      no.setAttribute('aria-pressed', String(ok === false));
      card.classList.toggle('ok', ok === true);
      card.classList.toggle('ng', ok === false);
    }
    function setSelf(ok) {
      const cur = st.get(q.id) || {};
      cur.ok = ok;
      st.set(q.id, cur);
      markWrong(q.id, !ok);
      paint(ok);
      if (opt.onSelf) opt.onSelf();
      if (opt.onAnswer) opt.onAnswer();
    }
    function reveal() {
      const cur = st.get(q.id) || {};
      cur.shown = true;
      st.set(q.id, cur);
      ans.hidden = false;
      show.hidden = true;
      self.hidden = false;
      if (!opt.instant) ta.readOnly = true;
    }
    if (s.shown) reveal();
    if (s.ok !== undefined) paint(s.ok);
    return { node: card, reveal };
  }

  /* ---------- 畫面 ---------- */
  const panel = $('#qz-panel');
  let mode = 'practice';
  let prac = null;    // 練習中：{ list, i, st }
  let exam = null;    // 模擬考中：{ list, st, start, done, cards }
  let timer = null;
  let current = null; // 練習中目前這題的卡片（給鍵盤用）

  const topOfPanel = () => {
    const y = panel.getBoundingClientRect().top + window.scrollY - 70;
    if (window.scrollY > y) window.scrollTo({ top: y });
  };

  function setMode(m) {
    mode = m;
    $$('#qz-tabs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    render();
  }

  function render() {
    clearInterval(timer);
    current = null;
    if (mode === 'practice') prac ? renderPractice() : renderPracticeSetup();
    else if (mode === 'exam') exam ? renderExam() : renderExamSetup();
    else renderWrong();
  }

  /* ----- 練習 ----- */
  function practicePool() {
    let p = pool(settings.type);
    if (settings.onlyWrong) p = p.filter((q) => wrong().has(q.id));
    return p;
  }

  function renderPracticeSetup() {
    const info = el('span', { class: 'muted' });
    const start = btn('開始練習', () => {
      const p = practicePool();
      startPractice(settings.order === 'rand' ? shuffle(p) : p);
    }, 'btn primary');
    const upd = () => {
      const n = practicePool().length;
      info.textContent = `符合條件：${n} 題`;
      start.disabled = !n;
    };
    const only = el('input', { type: 'checkbox' });
    only.checked = settings.onlyWrong;
    only.addEventListener('change', () => { settings.onlyWrong = only.checked; upd(); });
    panel.replaceChildren(el('div', { class: 'widget' }, [
      el('p', { class: 'w-title', text: '練習模式' }),
      el('p', { class: 'w-desc', text: '一題一題作答：選擇題選了馬上顯示對錯與解析；問答題先寫答案，再看參考答案自評。答錯（或自評還不會）的題目會加進錯題本，之後答對就移除。可用鍵盤 1～4 選答案、← → 換題。' }),
      chapterBar(upd),
      choiceBar('題型', 'type', [['mcq', '選擇題'], ['short', '問答題'], ['both', '全部']], upd),
      choiceBar('順序', 'order', [['seq', '照題號'], ['rand', '隨機']]),
      el('div', { class: 'qz-bar' }, [el('label', {}, [only, ' 只練錯題本裡的題目'])]),
      el('div', { class: 'qz-bar' }, [start, info]),
    ]));
    upd();
  }

  function startPractice(list) {
    prac = { list, i: 0, st: new Map() };
    mode = 'practice';
    $$('#qz-tabs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === 'practice')));
    render();
    topOfPanel();
  }

  function practiceStats() {
    let mDone = 0, mOk = 0, sDone = 0, sOk = 0;
    for (const q of prac.list) {
      const s = prac.st.get(q.id);
      if (!s || s.ok === undefined) continue;
      if (q.type === 'mcq') { mDone++; if (s.ok) mOk++; } else { sDone++; if (s.ok) sOk++; }
    }
    return { mDone, mOk, sDone, sOk };
  }

  function renderPractice() {
    const { list, i, st } = prac;
    const q = list[i];
    const prog = el('span', { class: 'qz-progress' });
    const upd = () => {
      const s = practiceStats();
      const parts = [`第 ${i + 1}／${list.length} 題`];
      if (s.mDone) parts.push(`選擇答對 ${s.mOk}／${s.mDone}`);
      if (s.sDone) parts.push(`問答會了 ${s.sOk}／${s.sDone}`);
      prog.textContent = parts.join('　·　');
    };
    const opt = { instant: true, onAnswer: upd };
    current = q.type === 'mcq' ? mcqCard(q, st, opt) : shortCard(q, st, opt);
    const prev = btn('← 上一題', () => go(-1));
    prev.disabled = i === 0;
    const last = i === list.length - 1;
    const next = btn(last ? '完成' : '下一題 →', () => (last ? renderPracticeDone() : go(1)), 'btn primary');
    panel.replaceChildren(
      el('div', { class: 'qz-nav' }, [prog, btn('結束練習', renderPracticeDone)]),
      current.node,
      el('div', { class: 'qz-nav' }, [prev, next]),
    );
    upd();
  }

  function go(d) {
    const n = prac.i + d;
    if (n < 0 || n >= prac.list.length) return;
    prac.i = n;
    renderPractice();
    topOfPanel();
  }

  function renderPracticeDone() {
    const s = practiceStats();
    const list = prac.list;
    const lines = [];
    if (s.mDone) lines.push(`選擇題答對 ${s.mOk}／${s.mDone}（${Math.round((s.mOk / s.mDone) * 100)}%）`);
    if (s.sDone) lines.push(`問答題自評會了 ${s.sOk}／${s.sDone}`);
    if (!lines.length) lines.push('這次沒有作答任何題目。');
    prac = null;
    current = null;
    panel.replaceChildren(el('div', { class: 'widget' }, [
      el('p', { class: 'w-title', text: '練習結束' }),
      ...lines.map((t) => el('p', { text: t })),
      el('p', { class: 'muted', text: `錯題本目前有 ${wrong().size} 題。` }),
      el('div', { class: 'qz-bar' }, [
        btn('同一組題目再練一次', () => startPractice(list), 'btn primary'),
        btn('回到設定', render),
        btn('看錯題本', () => setMode('wrong')),
      ]),
    ]));
  }

  /* ----- 模擬考 ----- */
  function renderExamSetup() {
    const info = el('span', { class: 'muted' });
    const start = btn('開始模擬考', () => {
      const m = shuffle(pool('mcq')).slice(0, settings.nMcq);
      const s = shuffle(pool('short')).slice(0, settings.nShort);
      exam = { list: [...m, ...s], st: new Map(), start: Date.now(), done: false, onlyWrong: false };
      render();
      topOfPanel();
    }, 'btn primary');
    const upd = () => {
      const m = Math.min(settings.nMcq, pool('mcq').length);
      const s = Math.min(settings.nShort, pool('short').length);
      info.textContent = `會抽 選擇 ${m} 題、問答 ${s} 題`;
      start.disabled = !(m + s);
    };
    panel.replaceChildren(el('div', { class: 'widget' }, [
      el('p', { class: 'w-title', text: '模擬考模式' }),
      el('p', { class: 'w-desc', text: '從選定的章節隨機抽題，全部作答完再交卷。交卷後顯示分數、各章答對率與解析；答錯的選擇題會加進錯題本。問答題交卷後看參考答案自評。' }),
      chapterBar(upd),
      choiceBar('選擇題', 'nMcq', [[10, '10 題'], [25, '25 題'], [50, '50 題']], upd),
      choiceBar('問答題', 'nShort', [[0, '不考'], [3, '3 題'], [5, '5 題'], [10, '10 題']], upd),
      el('div', { class: 'qz-bar' }, [start, info]),
    ]));
    upd();
  }

  const mmss = (ms) => {
    const t = Math.floor(ms / 1000);
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };

  function examScore() {
    const byCh = new Map(CHS.map((c) => [c.id, { n: 0, ok: 0 }]));
    let n = 0, ok = 0, sN = 0, sKnow = 0, sRated = 0;
    for (const q of exam.list) {
      const s = exam.st.get(q.id) || {};
      if (q.type === 'mcq') {
        const r = byCh.get(q.ch);
        n++; r.n++;
        if (s.pick === q.a) { ok++; r.ok++; }
      } else {
        sN++;
        if (s.ok !== undefined) { sRated++; if (s.ok) sKnow++; }
      }
    }
    return { n, ok, byCh, sN, sKnow, sRated };
  }

  function renderExam() {
    const { list, st } = exam;
    const status = el('span', { class: 'qz-progress' });
    const submit = btn('交卷', onSubmit, 'btn primary');
    let warned = false;
    const answered = () => list.filter((q) => {
      const s = st.get(q.id);
      return s && (q.type === 'mcq' ? s.pick !== undefined : (s.text || '').trim() !== '');
    }).length;
    const upd = () => {
      const used = mmss((exam.done ? exam.end : Date.now()) - exam.start);
      status.textContent = exam.done ? `已交卷　·　用時 ${used}` : `已作答 ${answered()}／${list.length}　·　用時 ${used}`;
    };
    const summary = el('div');
    const cards = list.map((q, k) => {
      const opt = { instant: false, idx: k + 1, locked: () => exam.done, onAnswer: upd, onSelf: () => paintSummary() };
      const c = q.type === 'mcq' ? mcqCard(q, st, opt) : shortCard(q, st, opt);
      c.q = q;
      return c;
    });
    const listBox = el('div', {}, cards.map((c) => c.node));

    function onSubmit() {
      const left = list.length - answered();
      if (left && !warned) {
        warned = true;
        submit.textContent = `還有 ${left} 題沒作答，再按一次交卷`;
        return;
      }
      exam.done = true;
      exam.end = Date.now();
      for (const q of list) {
        if (q.type !== 'mcq') continue;
        const s = st.get(q.id) || {};
        markWrong(q.id, s.pick !== q.a);
      }
      renderExam();
      topOfPanel();
    }

    function paintSummary() {
      if (!exam.done) { summary.replaceChildren(); return; }
      const sc = examScore();
      const rows = CHS.map((c) => sc.byCh.get(c.id)).map((r, k) => (r.n
        ? el('tr', {}, [el('td', { text: CHS[k].no }), el('td', { class: 'num', text: `${r.ok}／${r.n}` }),
          el('td', { class: 'num', text: Math.round((r.ok / r.n) * 100) + '%' })])
        : null));
      const onlyWrong = btn('只顯示答錯的', () => {
        exam.onlyWrong = !exam.onlyWrong;
        onlyWrong.setAttribute('aria-pressed', String(exam.onlyWrong));
        filterCards();
      });
      onlyWrong.setAttribute('aria-pressed', String(exam.onlyWrong));
      summary.replaceChildren(el('div', { class: 'widget' }, [
        el('p', { class: 'w-title', text: '成績' }),
        sc.n ? el('p', {}, [el('span', { class: 'qz-score', text: `${Math.round((sc.ok / sc.n) * 100)} 分` }),
          el('span', { class: 'muted', text: `　選擇題答對 ${sc.ok}／${sc.n}` })]) : null,
        sc.sN ? el('p', { text: `問答題自評：會了 ${sc.sKnow}／${sc.sN}` + (sc.sRated < sc.sN ? `（還有 ${sc.sN - sc.sRated} 題沒自評）` : '') }) : null,
        sc.n ? el('div', { class: 'table-wrap' }, [el('table', {}, [
          el('tr', {}, [el('th', { text: '章節' }), el('th', { class: 'num', text: '答對' }), el('th', { class: 'num', text: '答對率' })]),
          ...rows,
        ])]) : null,
        el('div', { class: 'qz-bar' }, [
          btn('同樣設定再考一次', () => { exam = null; renderExamSetup(); $('.btn.primary', panel).click(); }, 'btn primary'),
          btn('回到設定', () => { exam = null; render(); }),
          onlyWrong,
        ]),
      ]));
    }

    function filterCards() {
      for (const c of cards) {
        const s = st.get(c.q.id) || {};
        const bad = c.q.type === 'mcq' ? s.pick !== c.q.a : s.ok !== true;
        c.node.hidden = exam.done && exam.onlyWrong && !bad;
      }
    }

    const sticky = el('div', { class: 'qz-sticky' }, [status, exam.done ? null : submit]);
    panel.replaceChildren(summary, listBox, sticky);
    if (exam.done) {
      cards.forEach((c) => c.reveal());
      paintSummary();
      filterCards();
    } else {
      panel.prepend(el('div', { class: 'qz-nav' }, [
        el('span', { class: 'muted', text: `選擇 ${list.filter((q) => q.type === 'mcq').length} 題、問答 ${list.filter((q) => q.type === 'short').length} 題；交卷前可以改答案。` }),
        btn('放棄這次', () => { exam = null; render(); }),
      ]));
      timer = setInterval(upd, 1000);
    }
    upd();
  }

  /* ----- 錯題本 ----- */
  function renderWrong() {
    const ids = [...wrong()].filter((id) => BY_ID.has(id))
      .map((id) => BY_ID.get(id))
      .sort((a, b) => (a.type === b.type ? a.n - b.n : a.type === 'mcq' ? -1 : 1));
    if (!ids.length) {
      panel.replaceChildren(el('div', { class: 'widget' }, [
        el('p', { class: 'w-title', text: '錯題本' }),
        el('p', { text: '目前沒有錯題。練習或模擬考答錯的題目會自動加進來。' }),
      ]));
      return;
    }
    const count = (ch, type) => ids.filter((q) => q.ch === ch && q.type === type).length;
    const rows = CHS.map((c) => el('tr', {}, [
      el('td', { text: c.no }), el('td', { class: 'num', text: count(c.id, 'mcq') }), el('td', { class: 'num', text: count(c.id, 'short') }),
    ]));
    const clear = btn('清空錯題本', () => {
      if (clear.dataset.armed) {
        wrong().clear();
        saveWrong();
        renderWrong();
        return;
      }
      clear.dataset.armed = '1';
      clear.textContent = '再按一次確認清空';
      setTimeout(() => { delete clear.dataset.armed; clear.textContent = '清空錯題本'; }, 3000);
    });
    const items = ids.map((q) => {
      const body = q.type === 'mcq'
        ? el('div', { class: 'qz-ans', html: `正確答案 (${LETTER[q.a]}) ${q.o[q.a]}<br><span class="muted">${q.e}</span>` })
        : el('div', { class: 'qz-ans', html: q.a });
      wrapTables(body);
      const remove = btn('移除', () => { markWrong(q.id, false); renderWrong(); });
      return el('div', { class: 'quiz' }, [
        meta(q), el('p', { class: 'q', html: q.q }),
        el('details', { class: 'answer' }, [el('summary', { text: '看答案' }), body]),
        el('div', { class: 'qz-bar' }, [remove]),
      ]);
    });
    panel.replaceChildren(
      el('div', { class: 'widget' }, [
        el('p', { class: 'w-title', text: `錯題本（${ids.length} 題）` }),
        el('div', { class: 'table-wrap' }, [el('table', {}, [
          el('tr', {}, [el('th', { text: '章節' }), el('th', { class: 'num', text: '選擇' }), el('th', { class: 'num', text: '問答' })]),
          ...rows,
        ])]),
        el('div', { class: 'qz-bar' }, [
          btn('練錯題', () => {
            CHS.forEach((c) => settings.chs.add(c.id));
            settings.type = 'both';
            settings.onlyWrong = true;
            startPractice(ids);
          }, 'btn primary'),
          clear,
        ]),
      ]),
      ...items,
    );
  }

  /* ---------- 鍵盤：練習時 1～4／A～D 選答案，← → 換題 ---------- */
  document.addEventListener('keydown', (e) => {
    if (mode !== 'practice' || !prac || !current) return;
    if (e.target.closest && e.target.closest('textarea, input, select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
    if (k >= 0 && e.key.length === 1 && current.pick) { current.pick(k); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
  });

  document.addEventListener('DOMContentLoaded', () => {
    $$('#qz-tabs button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    setMode('practice');
  });
})();
