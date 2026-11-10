/* Career Elimination Exam: browser UI. Data: data/careers.json (built by scripts/build-data.mjs). */
import {
  REPO_URL, REPO_API, GROUPS, RIASEC, ARCH, FLAGS, FLAG_LABEL, SKILLS, SKILL_LABEL, VALUES, VAL_LABEL, VALUE_KEYS,
  CAUSE_LABEL, SETTING_LABEL, ACT_LABEL, EDU_REQ, EDU_SHORT, COMPS, PLAN90, PARTS, QMAP, QCOUNT, SCALES,
  growthLabel, level4, riskLabel, remoteLabel, stepFor, sampleAnswers
} from './catalog.js';
import { prepareCareers, computeAll, explain, bracket, pickOptions, hollandCode, clamp, avg, topIdx, lc, joinNice, fmtYears } from './engine.js';

/* ===================== state ===================== */
const KEY = 'career-elim-exam-v2', OLD_KEY = 'career-elim-exam-v1', STAR_KEY = 'cee-star';
const fresh = () => ({ v: 2, a: {}, marks: {}, stars: {}, over: {}, duel: null, part: 0, started: false, sample: false, board: { q: '', f: 'all', g: 'cluster', grp: 'all', shown: 60 } });
let state = fresh();
let CAREERS = [], byId = {}, META = null, TOTAL = 0;
let R = null, prevStatus = null, recent = [], justCrossed = new Set();
let openId = null, lastFocus = null, starCount = null;
const expanded = new Set();

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }
function load() {
  let s = null;
  try { const raw = localStorage.getItem(KEY); if (raw) s = JSON.parse(raw); } catch (e) { /* ignore */ }
  if (!s) {
    try { const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null'); if (old && old.a) s = { a: old.a, started: !!old.started, part: Math.min(old.part || 0, PARTS.length - 1), sample: !!old.sample }; } catch (e) { /* ignore */ }
  }
  if (s && typeof s === 'object') state = Object.assign(fresh(), s, { board: Object.assign(fresh().board, s.board || {}) });
  for (const k of ['marks', 'stars', 'over']) for (const id of Object.keys(state[k])) if (!byId[id]) delete state[k][id];
  if (state.duel && !state.duel.seeds.every(id => byId[id])) state.duel = null;
}
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
};

/* ===================== helpers ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'checked') { el.checked = !!v; el.defaultChecked = !!v; }
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(String(kid))); }
  return el;
}
const fmtFit = x => (x == null ? '–' : String(Math.round(x)));
const pay = c => (c.p == null ? 'Not published' : `$${c.p}k`);
const payTop = c => (c.t == null ? 'Not published' : `$${c.t}k+`);
const signed = x => (x > 0 ? '+' : '') + x;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600); }
function optLabel(k, v) { const q = QMAP[k]; const o = q && q.o && q.o.find(x => x[0] === String(v)); return o ? o[1] : ''; }
function isAnswered(q) { const v = state.a[q.k]; if (q.t === 'multi') return Array.isArray(v); return v != null && v !== ''; }
function partProgress(pi) {
  const p = PARTS[pi];
  if (p.special === 'gut') { if (!R || R.nComp < 4) return [0, 1]; const n = R.gutPool.length; return [R.gutPool.filter(c => state.marks[c.id]).length, Math.max(1, n)]; }
  if (p.special === 'duel') { const d = state.duel; if (!d) return [0, 1]; return [d.picks.length, bracket(d).length]; }
  return [p.qs.filter(isAnswered).length, p.qs.length];
}
function armButton(btn, label, action) {
  if (btn.dataset.armed) { action(); return; }
  const old = btn.textContent; btn.dataset.armed = '1'; btn.textContent = label;
  setTimeout(() => { if (btn.isConnected && btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = old; } }, 4000);
}
const card = (title, ...kids) => h('div', { class: 'card' }, title ? h('h3', null, title) : null, ...kids);

/* ===================== compute ===================== */
function compute() {
  R = computeAll(CAREERS, state);
  justCrossed = new Set();
  if (prevStatus) {
    for (const c of CAREERS) if (prevStatus[c.id] === 'in' && R.res[c.id].status === 'x') { recent.unshift({ id: c.id, why: R.res[c.id].short }); justCrossed.add(c.id); }
    recent = recent.filter((x, i, arr) => arr.findIndex(y => y.id === x.id) === i && R.res[x.id].status === 'x').slice(0, 8);
  }
  prevStatus = Object.fromEntries(CAREERS.map(c => [c.id, R.res[c.id].status]));
}

/* ===================== header + rail ===================== */
function updateHeader() {
  const pill = $('#pill'), f = R.funnel, before = pill.dataset.n;
  pill.replaceChildren(h('b', null, String(f.standing)), ` of ${TOTAL} standing`);
  if (before != null && Number(before) > f.standing) { pill.classList.remove('pulse'); void pill.offsetWidth; pill.classList.add('pulse'); }
  pill.dataset.n = String(f.standing);
}
function renderRail() {
  const rail = $('#rail'); if (!rail) return;
  rail.replaceChildren();
  const f = R.funnel, pct = n => (100 * n / TOTAL) + '%';
  rail.append(h('div', { class: 'card' },
    h('div', { class: 'eyebrow' }, 'Still standing'),
    h('div', { class: 'big' }, String(f.standing), h('small', null, ` / ${TOTAL}`)),
    h('div', { class: 'stack', role: 'img', 'aria-label': `${f.standing} standing, ${f.hard} out on dealbreakers, ${f.soft} out on weak fit, ${f.you} crossed off by you` },
      h('i', { class: 'c-in', style: `width:${pct(f.standing)}` }), h('i', { class: 'c-hard', style: `width:${pct(f.hard)}` }), h('i', { class: 'c-soft', style: `width:${pct(f.soft)}` }), h('i', { class: 'c-you', style: `width:${pct(f.you)}` })),
    h('div', { class: 'legend' },
      h('i', { class: 'c-in' }), h('span', null, 'Standing'), h('b', null, f.standing),
      h('i', { class: 'c-hard' }), h('span', null, 'Dealbreakers and limits'), h('b', null, f.hard),
      h('i', { class: 'c-soft' }), h('span', null, 'Weak fit'), h('b', null, f.soft),
      h('i', { class: 'c-you' }), h('span', null, 'Crossed off by you'), h('b', null, f.you))
  ));
  const lead = card('Leading right now');
  if (R.nComp === 0) lead.append(h('p', { class: 'muted', style: 'margin:0;font-size:13.5px' }, 'Leaders appear once you start answering Parts 2 to 9.'));
  else {
    const ul = h('ol', { class: 'leaders' });
    R.ranked.slice(0, 6).forEach((c, i) => {
      const r = R.res[c.id];
      ul.append(h('li', null, h('span', { class: 'rk' }, i + 1), h('button', { class: 'plain', type: 'button', onclick: () => openDetail(c.id) }, c.n), h('span', { class: 'ft' }, fmtFit(r.fit)), h('span', { class: 'bar' }, h('i', { style: `width:${r.fit ?? 0}%` }))));
    });
    lead.append(ul);
    if (R.nComp < 4) lead.append(h('p', { class: 'muted', style: 'margin:10px 0 0;font-size:12.5px' }, `Weak fits start dropping out once 4 scoring areas have answers (${R.nComp} so far).`));
  }
  rail.append(lead);
  const rc = card('Just crossed off');
  if (!recent.length) rc.append(h('p', { class: 'muted', style: 'margin:0;font-size:13.5px' }, 'Nothing yet. Dealbreakers and weak fits will show up here as you answer.'));
  else {
    const ul = h('ul', { class: 'recent' });
    recent.slice(0, 6).forEach(x => { const c = byId[x.id]; ul.append(h('li', null, h('button', { class: 'plain', type: 'button', onclick: () => openDetail(c.id) }, h('span', { class: 'struck' + (justCrossed.has(c.id) ? ' anim' : '') }, c.n)), h('span', { class: 'why' }, x.why))); });
    rc.append(ul);
  }
  rail.append(rc);
  const cov = h('div', { class: 'cov' }), comp0 = R.res[CAREERS[0].id].comp;
  COMPS.forEach(([k, l]) => cov.append(h('span', { class: comp0[k] != null ? 'on' : '' }, l)));
  rail.append(card('What is scoring you', cov, h('p', { class: 'muted', style: 'margin:10px 0 0;font-size:12.5px' }, 'Interests count most, then values, work style and strengths.')));
}

/* ===================== exam ===================== */
function renderExam() {
  const main = $('#exam-main'); main.replaceChildren();
  if (state.sample) main.append(sampleBanner());
  if (!state.started) { main.append(renderIntro()); renderRail(); return; }
  main.append(renderSteps());
  const p = PARTS[state.part];
  main.append(h('div', { class: 'part-head' },
    h('div', { class: 'eyebrow' }, `Part ${String(state.part + 1).padStart(2, '0')} of ${PARTS.length}`),
    h('h1', { class: 'part-title' }, p.title),
    h('p', { class: 'part-intro' }, p.intro),
    h('div', { class: 'part-meta' }, (p.qs ? [`${p.qs.length} questions`] : []).concat(p.meta || []).map(m => h('span', null, m)))));
  if (p.special === 'gut') main.append(renderGut());
  else if (p.special === 'duel') main.append(renderDuel());
  else main.append(renderQuestions(p));
  main.append(partFoot());
  renderRail();
}
function sampleBanner() {
  return h('div', { class: 'banner' }, h('span', null, 'Example answers are loaded so you can see how it works. They are not yours.'),
    h('button', { class: 'btn', type: 'button', onclick: () => { resetAll(); toast('Example answers cleared.'); } }, 'Clear and start my own'),
    h('button', { class: 'btn', type: 'button', onclick: () => { state.sample = false; commit({ all: true }); } }, 'Keep and edit them'));
}
function groupCounts() {
  const out = {};
  for (const c of CAREERS) { const o = out[c.g] || (out[c.g] = { all: 0, in: 0 }); o.all++; if (R.res[c.id].status === 'in') o.in++; }
  return out;
}
function renderIntro() {
  const counts = groupCounts(), answered = R.nComp > 0;
  const grid = h('div', { class: 'groups' });
  Object.keys(GROUPS).forEach(g => {
    const n = counts[g]; if (!n) return;
    grid.append(h('button', { type: 'button', class: 'grp-btn', onclick: () => { Object.assign(state.board, { grp: g, f: 'all', q: '', g: 'cluster' }); save(); go('board'); } },
      h('span', null, GROUPS[g]), h('b', null, answered ? [h('em', null, n.in), ` / ${n.all}`] : `${n.all}`)));
  });
  const parts = h('ol', { class: 'parts-list' });
  PARTS.forEach((p, i) => parts.append(h('li', null, h('span', { class: 'n' }, String(i + 1).padStart(2, '0')), h('span', null, p.title))));
  const hasAnswers = Object.keys(state.a).length > 0;
  return h('div', { class: 'intro' },
    h('div', { class: 'eyebrow' }, 'Career Elimination Exam'),
    h('h1', { class: 'intro-title' }, h('em', null, String(TOTAL)), ' careers on the table. Cross off every one that is not you.'),
    h('p', { class: 'intro-lede' }, `Every occupation in the U.S. government's O*NET database is here, from actuaries to zoologists, plus a few paths like startup founder and content creator. Answer eleven short parts about your situation, personality, interests, strengths, values, work style, dealbreakers, life goals and energy. Every answer re-scores all ${TOTAL} careers. Dealbreakers cross careers off instantly, weak fits drop out as the picture sharpens, and you make the final cuts yourself. You finish with three focus options and a first-year plan.`),
    h('div', { class: 'meta-row' }, h('span', null, '11 parts'), h('span', null, `${QCOUNT} questions + gut check`), h('span', null, '30 to 40 minutes'), h('span', null, 'Free, no sign-up'), h('span', null, 'Answers stay in your browser')),
    h('div', { class: 'cta' },
      h('button', { class: 'btn accent', type: 'button', onclick: () => { state.started = true; save(); renderExam(); window.scrollTo(0, 0); } }, hasAnswers && !state.sample ? 'Continue the exam' : 'Start Part 1'),
      state.sample ? null : h('button', { class: 'btn ghost', type: 'button', onclick: loadSample }, 'Try it with example answers')),
    card('The eleven parts', parts),
    card(answered ? `Still standing in each field` : `On the table: ${TOTAL} careers in ${Object.keys(counts).length} fields`, grid),
    h('p', { class: 'fine' }, 'This is a structured self-reflection tool, not a validated psychological test. Pay and growth come from the Bureau of Labor Statistics; AI exposure is an estimate.'));
}
function renderSteps() {
  const nav = h('nav', { class: 'steps', id: 'steps', 'aria-label': 'Exam parts' });
  PARTS.forEach((p, i) => {
    const [a, t] = partProgress(i), done = a >= t && t > 0, partial = a > 0 && !done;
    nav.append(h('button', { type: 'button', class: 'step' + (done ? ' done' : partial ? ' part' : ''), style: partial ? `--p:${Math.round(100 * a / t)}%` : null, 'aria-current': i === state.part ? 'step' : null, onclick: () => goPart(i) },
      h('span', { class: 'sn' }, done ? '✓' : String(i + 1)), p.short));
  });
  return nav;
}
function goPart(i) {
  state.part = clamp(i, 0, PARTS.length - 1); state.started = true; save();
  if (currentView() !== 'exam') { go('exam'); return; }
  renderExam(); const s = $('#steps'); if (s) { const cur = s.querySelector('[aria-current]'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' }); }
  window.scrollTo(0, 0);
}
function partFoot() {
  const pi = state.part, [a, t] = partProgress(pi), p = PARTS[pi];
  const left = h('div', { class: 'mono muted', id: 'part-prog', style: 'font-size:13px' }, p.special ? '' : `${a} of ${t} answered`);
  const grp = h('div', { class: 'grp' });
  if (!p.special && a < t) grp.append(h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { const q = p.qs.find(x => !isAnswered(x)); const el = q && document.getElementById(qid(q.k)); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 'Next unanswered'));
  if (pi > 0) grp.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => goPart(pi - 1) }, 'Back'));
  if (pi < PARTS.length - 1) grp.append(h('button', { class: 'btn', type: 'button', onclick: () => goPart(pi + 1) }, `Next: ${PARTS[pi + 1].title}`));
  else grp.append(h('button', { class: 'btn accent', type: 'button', onclick: () => go('results') }, 'See my results'));
  return h('div', { class: 'part-foot' }, left, grp);
}
function updateExamChrome() {
  const s = $('#steps'); if (s) s.replaceWith(renderSteps());
  const pp = $('#part-prog'), p = PARTS[state.part];
  if (pp && !p.special) { const [a, t] = partProgress(state.part); pp.textContent = `${a} of ${t} answered`; }
}
const qid = k => 'q_' + k.replace(/\W/g, '_');
function multiCountText(q) { const v = state.a[q.k]; if (!Array.isArray(v)) return q.max ? `Pick up to ${q.max}` : 'Tick all that apply'; if (!v.length) return q.none ? `${q.none} selected` : 'None selected'; return q.max ? `${v.length} of ${q.max} picked` : `${v.length} ticked`; }
function renderQuestions(p) {
  const sheet = h('div', { class: 'sheet' });
  p.qs.forEach((q, i) => sheet.append(renderQ(q, i + 1)));
  sheet.addEventListener('change', onQChange);
  sheet.addEventListener('click', e => {
    const b = e.target.closest('[data-none]'); if (!b) return;
    const k = b.dataset.none; state.a[k] = [];
    $$(`input[name="${k}"]`, sheet).forEach(x => { x.checked = false; });
    refreshQ(QMAP[k]); commit();
  });
  return sheet;
}
function renderQ(q, n) {
  const id = qid(q.k), cur = state.a[q.k], wide = q.t === 'single' || q.t === 'multi';
  const el = h('div', { class: 'q' + (wide ? ' wide' : '') + (isAnswered(q) ? ' answered' : ''), id, role: 'group', 'aria-labelledby': id + '_t' });
  el.append(h('div', { class: 'q-num', 'aria-hidden': 'true' }, String(n).padStart(2, '0')));
  const body = h('div', { class: 'q-body' });
  body.append(h('div', { class: 'q-text', id: id + '_t' }, q.q, q.hint ? h('span', { class: 'q-hint' }, q.hint) : null));
  if (q.t === 'likert' || q.t === 'scale') {
    const labels = q.t === 'likert' ? SCALES[q.s] : null, ends = labels ? [labels[0], labels[4]] : q.ends;
    const row = h('div', { class: 'bub-row' });
    for (let v = 1; v <= 5; v++) {
      const lab = labels ? labels[v - 1] : (v === 1 ? ends[0] : v === 5 ? ends[1] : v === 3 ? 'In the middle' : v === 2 ? `Leaning: ${lc(ends[0])}` : `Leaning: ${lc(ends[1])}`);
      row.append(h('label', { class: 'bub', title: lab }, h('input', { type: 'radio', name: q.k, value: String(v), checked: Number(cur) === v, 'aria-label': lab }), h('span', { 'aria-hidden': 'true' }, String(v))));
    }
    body.append(h('div', { class: 'bubs' }, row, h('div', { class: 'bub-ends', 'aria-hidden': 'true' }, h('span', null, ends[0]), h('span', { style: 'text-align:right' }, ends[1]))));
  } else if (q.t === 'single') {
    const opts = h('div', { class: 'opts' });
    for (const [v, l] of q.o) opts.append(h('label', { class: 'opt' }, h('input', { type: 'radio', name: q.k, value: v, checked: cur === v }), h('span', null, l)));
    body.append(opts);
  } else {
    const arr = Array.isArray(cur) ? cur : [];
    const opts = h('div', { class: 'opts' });
    for (const [v, l] of q.o) opts.append(h('label', { class: 'opt' + (q.flag ? ' flag' : '') }, h('input', { type: 'checkbox', name: q.k, value: v, checked: arr.includes(v) }), h('span', null, l)));
    const meta = h('div', { class: 'multi-meta' }, h('span', { 'data-count': q.k }, multiCountText(q)));
    if (q.flag) meta.append(h('span', null, `Each tick crosses off every career that involves it.`));
    if (q.none) meta.append(h('button', { type: 'button', class: 'linkbtn', 'data-none': q.k, 'aria-pressed': String(Array.isArray(cur) && cur.length === 0) }, q.none));
    body.append(opts, meta);
  }
  el.append(body);
  return el;
}
function refreshQ(q) {
  const el = document.getElementById(qid(q.k)); if (!el) return;
  el.classList.toggle('answered', isAnswered(q));
  const cnt = el.querySelector('[data-count]'); if (cnt) cnt.textContent = multiCountText(q);
  const nb = el.querySelector('[data-none]'); if (nb) { const v = state.a[q.k]; nb.setAttribute('aria-pressed', String(Array.isArray(v) && v.length === 0)); }
}
function onQChange(e) {
  const t = e.target, q = QMAP[t.name]; if (!q) return;
  if (q.t === 'multi') {
    let vals = $$(`input[name="${q.k}"]`, e.currentTarget).filter(b => b.checked).map(b => b.value);
    if (q.max && vals.length > q.max) { t.checked = false; vals = vals.filter(v => v !== t.value); toast(`Pick up to ${q.max}. Untick one first.`); }
    state.a[q.k] = vals;
  } else if (q.t === 'single') state.a[q.k] = t.value;
  else state.a[q.k] = Number(t.value);
  refreshQ(q); commit();
  if (q.k === 'd.flags' && t.checked) { const n = CAREERS.filter(c => c.fl.includes(t.value)).length; toast(`${FLAG_LABEL[t.value]}: ${n} careers involve it.`); }
}
function lockedNote() {
  const need = ['big5', 'riasec', 'skills', 'values', 'work', 'life', 'energy'].map(id => PARTS.findIndex(p => p.id === id));
  const box = h('div', { class: 'sheet pad' }, h('p', { style: 'margin-top:0' }, `This unlocks once at least four scoring areas have answers. You have ${R.nComp} so far.`));
  const g = h('div', { class: 'cta' });
  need.forEach(i => { const [a, t] = partProgress(i); if (a < t) g.append(h('button', { class: 'btn ghost sm', type: 'button', onclick: () => goPart(i) }, `Part ${i + 1}: ${PARTS[i].title}`)); });
  box.append(g);
  return box;
}
function renderGut() {
  if (R.nComp < 4) return lockedNote();
  const box = h('div', { class: 'sheet pad' }), list = R.gutPool;
  if (!list.length) { box.append(h('p', null, 'No careers survived your dealbreakers. Loosen a dealbreaker in Part 7 or restore careers on the career board.')); return box; }
  box.append(h('p', { class: 'muted', style: 'margin:0 0 6px' }, `Your top ${list.length} remaining careers, best fit first. Open a name for details. Keeps get a small boost; crosses are removed from your results.`));
  list.forEach((c, i) => box.append(gutRow(c, i + 1)));
  return box;
}
function gutRow(c, n) {
  const r = R.res[c.id], m = state.marks[c.id] || '';
  const row = h('div', { class: 'gut-row' });
  row.append(h('span', { class: 'q-num' }, String(n).padStart(2, '0')));
  row.append(h('button', { type: 'button', class: 'gut-name', onclick: () => openDetail(c.id) }, h('span', { class: 'nm' }, h('span', { class: m === 'x' ? 'struck' : '' }, c.n)), h('span', { class: 'gut-sub' }, `${GROUPS[c.g]} · fit ${fmtFit(r.fit)} · ${pay(c)}`)));
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': `Decision for ${c.n}` });
  [['k', 'Keep'], ['m', 'Maybe'], ['x', 'Cross off']].forEach(([v, l]) => seg.append(h('button', { type: 'button', class: 'gs-' + v, 'aria-pressed': String(m === v), onclick: () => setMark(c.id, m === v ? null : v) }, l)));
  row.append(seg);
  return row;
}
function setMark(id, v) {
  if (v) state.marks[id] = v; else delete state.marks[id];
  const y = window.scrollY; commit({ exam: true }); window.scrollTo(0, y);
}
function duelSeeds() {
  const cands = R.ranked.slice().sort((a, b) => ((state.marks[b.id] === 'k') - (state.marks[a.id] === 'k')) || ((R.res[b.id].fit ?? 0) - (R.res[a.id].fit ?? 0)));
  return cands.length >= 8 ? cands.slice(0, 8) : cands.length >= 4 ? cands.slice(0, 4) : cands;
}
function renderDuel() {
  if (R.nComp < 4) return lockedNote();
  const box = h('div', { class: 'sheet pad' }), seeds = duelSeeds(), d = state.duel;
  if (!d) {
    if (seeds.length < 4) { box.append(h('p', { style: 'margin:0' }, 'You need at least 4 careers still standing. Restore some in the gut check or on the career board.')); return box; }
    box.append(h('p', { style: 'margin-top:0' }, `${seeds.length} careers enter: your Keeps first, then your best fits.`));
    box.append(h('ol', { style: 'margin:0 0 16px;padding-left:20px' }, seeds.map(c => h('li', null, c.n, h('span', { class: 'muted' }, ` · fit ${fmtFit(R.res[c.id].fit)}`)))));
    box.append(h('button', { class: 'btn accent', type: 'button', onclick: () => { state.duel = { seeds: seeds.map(c => c.id), picks: [] }; commit({ exam: true }); } }, 'Start the showdown'));
    return box;
  }
  const M = bracket(d), cur = M.findIndex((m, i) => d.picks[i] == null && m.a && m.b);
  const roundNames = M[M.length - 1].round === 2 ? ['Quarterfinal', 'Semifinal', 'Final'] : ['Semifinal', 'Final'];
  if (cur >= 0) {
    const m = M[cur];
    box.append(h('div', { class: 'eyebrow' }, `${roundNames[m.round]} · match ${cur + 1} of ${M.length}`), h('div', { class: 'duel-q' }, 'Which would you rather do for the next five years?'));
    const dc = id => { const c = byId[id], r = R.res[id]; return h('button', { type: 'button', class: 'duel-card', onclick: () => { d.picks[cur] = id; commit({ exam: true }); } }, h('span', { class: 'eyebrow' }, GROUPS[c.g]), h('span', { class: 'nm' }, c.n), h('span', { class: 'ds' }, c.d), h('span', { class: 'fx' }, `Fit ${fmtFit(r.fit)} · ${pay(c)} · ${EDU_SHORT[c.e]}`)); };
    box.append(h('div', { class: 'duel-pair' }, dc(m.a), h('span', { class: 'duel-vs' }, 'or'), dc(m.b)));
  } else {
    const champ = byId[d.picks[M.length - 1]];
    box.append(h('div', { class: 'champ' }, h('span', { class: 'eyebrow', style: 'color:inherit' }, 'Your showdown winner'), h('span', { class: 'nm' }, champ ? champ.n : ''), h('span', null, 'It gets a 10-point boost in your results. The runner-up gets 6, semifinalists 3.')));
    box.append(h('div', { class: 'cta', style: 'margin-top:14px' }, h('button', { class: 'btn accent', type: 'button', onclick: () => go('results') }, 'See my results')));
  }
  const br = h('div', { class: 'bracket' });
  [...new Set(M.map(m => m.round))].forEach(rd => {
    const col = h('div', null, h('h4', null, roundNames[rd]));
    M.forEach((m, i) => { if (m.round !== rd) return; const w = d.picks[i], nm = id => (id ? byId[id].n : 'To be decided');
      col.append(h('div', { class: 'match' }, h('div', { class: w ? (w === m.a ? 'w' : 'l') : '' }, nm(m.a)), h('div', { class: w ? (w === m.b ? 'w' : 'l') : '' }, nm(m.b)))); });
    br.append(col);
  });
  box.append(br);
  const ctr = h('div', { class: 'cta', style: 'margin-top:16px' });
  if (d.picks.length) ctr.append(h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { d.picks.pop(); commit({ exam: true }); } }, 'Undo last pick'));
  const changed = d.seeds.join() !== seeds.map(c => c.id).join();
  ctr.append(h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { state.duel = seeds.length >= 4 ? { seeds: seeds.map(c => c.id), picks: [] } : null; commit({ exam: true }); } }, changed ? 'Restart with your current shortlist' : 'Restart the showdown'));
  box.append(ctr);
  if (changed) box.append(h('p', { class: 'muted', style: 'margin:8px 0 0;font-size:13px' }, 'Your shortlist has changed since this showdown started.'));
  return box;
}

/* ===================== board ===================== */
function renderBoard() {
  const v = $('#view-board'); v.replaceChildren();
  const B = state.board;
  v.append(h('div', { class: 'view-head' }, h('div', null, h('div', { class: 'eyebrow' }, 'Career board'), h('h1', { class: 'view-title' }, `${R.funnel.standing} of ${TOTAL} still standing`), h('p', { class: 'view-sub' }, 'Every career in the exam. Crossed-off names show why they went. Open any career for its fit breakdown, pay, outlook and similar careers, or to star it, cross it off or keep it anyway.'))));
  const search = h('input', { class: 'search', id: 'board-q', type: 'search', placeholder: 'Search 917 careers and job titles', 'aria-label': 'Search careers', value: B.q });
  search.addEventListener('input', () => { B.q = search.value; B.shown = 60; save(); renderBoardList(); });
  const seg = (key, opts, label) => { const s = h('div', { class: 'seg', role: 'group', 'aria-label': label }); opts.forEach(([val, l]) => s.append(h('button', { type: 'button', 'aria-pressed': String(B[key] === val), onclick: () => { B[key] = val; B.shown = 60; save(); renderBoard(); } }, l))); return s; };
  const sel = h('select', { class: 'select', 'aria-label': 'Field' }, h('option', { value: 'all' }, 'All fields'), Object.keys(GROUPS).map(g => h('option', { value: g, selected: B.grp === g }, GROUPS[g])));
  sel.addEventListener('change', () => { B.grp = sel.value; B.shown = 60; save(); renderBoardList(); });
  v.append(h('div', { class: 'tools' }, search, sel, seg('f', [['all', 'All'], ['in', 'Standing'], ['x', 'Crossed off'], ['star', 'Starred']], 'Filter'), seg('g', [['cluster', 'By field'], ['fit', 'By fit']], 'Layout')));
  v.append(h('div', { id: 'board-list' }));
  renderBoardList();
}
function tile(c, rankLabel) {
  const r = R.res[c.id], x = r.status === 'x';
  const b = h('button', { type: 'button', class: 'tile' + (x ? ' x' : '') + (state.stars[c.id] ? ' star' : ''), onclick: () => openDetail(c.id) });
  b.append(h('span', { class: 'nm' }, rankLabel ? h('span', { class: 'rk' }, rankLabel) : null, h('span', { class: x ? 'struck' + (justCrossed.has(c.id) ? ' anim' : '') : '' }, c.n)));
  b.append(h('span', { class: 'ft', 'aria-label': x ? null : `fit ${fmtFit(r.fit)}` }, x ? '' : fmtFit(r.fit)));
  if (x) b.append(h('span', { class: 'why' }, r.short));
  return b;
}
function renderBoardList() {
  const box = $('#board-list'); if (!box) return;
  box.replaceChildren();
  const B = state.board, q = B.q.trim().toLowerCase();
  const ok = c => {
    const r = R.res[c.id];
    if (B.f === 'in' && r.status !== 'in') return false;
    if (B.f === 'x' && r.status !== 'x') return false;
    if (B.f === 'star' && !state.stars[c.id]) return false;
    if (B.grp !== 'all' && c.g !== B.grp) return false;
    if (q && !q.split(/\s+/).every(w => c.search.includes(w))) return false;
    return true;
  };
  const score = c => R.res[c.id].final ?? R.res[c.id].fit ?? -1;
  const order = (a, b) => ((R.res[a.id].status === 'in' ? 0 : 1) - (R.res[b.id].status === 'in' ? 0 : 1)) || (score(b) - score(a)) || a.n.localeCompare(b.n);
  const items = CAREERS.filter(ok).sort(order);
  box.append(h('p', { class: 'count-line' }, `${items.length} career${items.length === 1 ? '' : 's'} shown · ${items.filter(c => R.res[c.id].status === 'in').length} standing`));
  if (!items.length) { box.append(h('div', { class: 'empty card' }, 'No careers match. Clear the search or change the filters.')); return; }
  const grid = h('div', { class: 'clusters' });
  if (B.g === 'cluster') {
    const CAP = q ? 40 : 12;
    Object.keys(GROUPS).forEach(k => {
      const list = items.filter(c => c.g === k); if (!list.length) return;
      const all = CAREERS.filter(c => c.g === k), st = all.filter(c => R.res[c.id].status === 'in').length;
      const open = expanded.has(k) || B.grp === k;
      const shown = open ? list : list.slice(0, CAP);
      const block = h('div', { class: 'cl-block' }, h('div', { class: 'cl-head' }, h('span', { class: 'cl-name' }, GROUPS[k]), h('span', { class: 'cl-count' }, `${st} / ${all.length}`)), shown.map(c => tile(c)));
      if (list.length > shown.length) block.append(h('button', { type: 'button', class: 'more', onclick: () => { expanded.add(k); renderBoardList(); } }, `Show ${list.length - shown.length} more`));
      else if (expanded.has(k) && list.length > CAP) block.append(h('button', { type: 'button', class: 'more', onclick: () => { expanded.delete(k); renderBoardList(); } }, 'Show fewer'));
      grid.append(block);
    });
  } else {
    const shown = items.slice(0, B.shown), cols = 3, per = Math.ceil(shown.length / cols);
    for (let i = 0; i < cols; i++) { const chunk = shown.slice(i * per, (i + 1) * per); if (chunk.length) grid.append(h('div', { class: 'cl-block' }, chunk.map(c => tile(c, R.res[c.id].rank ? '#' + R.res[c.id].rank : '')))); }
    box.append(grid);
    if (items.length > shown.length) box.append(h('button', { type: 'button', class: 'more', style: 'margin-top:14px', onclick: () => { B.shown += 120; save(); renderBoardList(); } }, `Show more (${items.length - shown.length} left)`));
    return;
  }
  box.append(grid);
}

/* ===================== detail drawer ===================== */
function openDetail(id, keepFocus) {
  const c = byId[id]; if (!c) return;
  if (!keepFocus) lastFocus = document.activeElement;
  openId = id;
  const r = R.res[id], ex = explain(c, R.U, r);
  const p = $('#panel'); p.replaceChildren();
  p.append(h('button', { type: 'button', class: 'close', 'aria-label': 'Close', 'data-close': '' }, '×'));
  p.append(h('div', null, h('div', { class: 'eyebrow' }, GROUPS[c.g], c.x ? [' ', h('span', { class: 'badge est' }, 'Estimate')] : null), h('h2', { class: 'dr-title', id: 'dr-title' }, h('span', { class: r.status === 'x' ? 'struck' : '' }, c.n)), h('p', { class: 'dr-desc' }, c.d), c.alt && c.alt.length ? h('p', { class: 'alt' }, 'Also called: ' + c.alt.join(', ')) : null));
  const st = h('div');
  if (r.status === 'in') st.append(h('span', { class: 'chip in' }, r.rank ? `Still standing · #${r.rank} of ${R.ranked.length}` : 'Still standing'));
  else { st.append(h('span', { class: 'chip x' }, 'Crossed off')); st.append(h('ul', { class: 'reasons' }, r.reasons.map(x => h('li', null, x)))); }
  if (state.over[id] && r.hard.length) st.append(h('p', { class: 'muted', style: 'font-size:13px;margin:8px 0 0' }, 'You are keeping it despite: ' + r.hard.map(x => lc(x.r)).join('; ') + '.'));
  p.append(st);
  const act = h('div', { class: 'actions' });
  act.append(h('button', { type: 'button', class: 'btn ghost sm', 'aria-pressed': String(!!state.stars[id]), onclick: () => { if (state.stars[id]) delete state.stars[id]; else state.stars[id] = true; commit(); } }, state.stars[id] ? '★ Starred' : '☆ Star it'));
  if (state.marks[id] === 'x') act.append(h('button', { type: 'button', class: 'btn ghost sm', onclick: () => { delete state.marks[id]; commit(); } }, 'Restore it'));
  else if (r.status === 'in') act.append(h('button', { type: 'button', class: 'btn danger sm', onclick: () => { state.marks[id] = 'x'; commit(); } }, 'Cross it off'));
  if (r.hard.length && !state.over[id] && state.marks[id] !== 'x') act.append(h('button', { type: 'button', class: 'btn ghost sm', onclick: () => { state.over[id] = true; commit(); } }, 'Keep it anyway'));
  if (state.over[id]) act.append(h('button', { type: 'button', class: 'btn ghost sm', onclick: () => { delete state.over[id]; commit(); } }, 'Stop overriding'));
  p.append(act);
  if (r.fit != null) {
    const bars = h('div', { class: 'cbars' });
    COMPS.forEach(([k, l]) => { const v = r.comp[k]; bars.append(h('div', { class: 'cbar' }, h('span', null, l), h('span', { class: 'track' + (v == null ? ' off' : '') }, h('i', { style: `width:${v == null ? 0 : Math.round(v * 100)}%` })), h('span', { class: 'v' }, v == null ? '–' : Math.round(v * 100)))); });
    p.append(h('div', null, h('div', { class: 'fitrow' }, h('span', { class: 'fitbig' }, fmtFit(r.fit)), h('span', { class: 'muted' }, 'overall fit out of 100')), bars));
  } else p.append(h('p', { class: 'muted', style: 'margin:0' }, 'Fit scores appear once you answer some of Parts 2 to 9.'));
  if (ex.why.length || ex.watch.length) p.append(h('div', { class: 'lists' }, ex.why.length ? [h('h4', null, 'Why it fits'), h('ul', { class: 'why' }, ex.why.map(x => h('li', null, x)))] : null, ex.watch.length ? [h('h4', null, 'Watch out for'), h('ul', { class: 'watch' }, ex.watch.map(x => h('li', null, x)))] : null));
  const dl = h('dl', { class: 'facts' }), fact = (k, v) => dl.append(h('dt', null, k), h('dd', null, v));
  fact('Typical pay', c.p == null ? 'Not published' : `About $${c.p}k a year`); fact('Top 10% earn', payTop(c)); fact('Usually requires', EDU_REQ[c.e]);
  if (r.extra != null) fact('Training for you', r.extra > 0.4 ? `About ${fmtYears(r.extra)} more` : 'You likely have the schooling already');
  fact('Job outlook', c.gr == null ? 'No projection' : `${growthLabel(c.gr)} (${signed(c.gr)}% by 2035)`);
  if (c.em != null) fact('Jobs in the U.S.', `${Math.round(c.em * 1000).toLocaleString()}` + (c.op != null ? ` · ${Math.round(c.op * 1000).toLocaleString()} openings a year` : ''));
  if (!c.x) fact('Self-employed', `${Math.round(c.se)}%`);
  fact('Estimated AI exposure', level4(c.ai)); fact('Income stability', riskLabel(c.rk)); fact('Long hours', `${Math.round(c.hr * 100)}% work over 40 hours`);
  fact('Stress', level4(c.st)); fact('Physical demand', level4(c.ph)); fact('People contact', level4(c.pp)); fact('Remote work', remoteLabel(c.rm));
  fact('Where', [...c.set].map(s => SETTING_LABEL[s]).join(', '));
  p.append(dl);
  if (c.fl.length) { const mine = R.U.flags || []; p.append(h('div', null, h('div', { class: 'eyebrow', style: 'margin-bottom:6px' }, 'What the work involves'), h('div', { class: 'flags-list' }, c.fl.map(f => h('span', { class: mine.includes(f) ? 'hit' : '' }, FLAG_LABEL[f]))))); }
  p.append(h('div', { class: 'trybox' }, h('b', null, 'Try it this month'), stepFor(c)));
  const rel = (c.rel || []).map(x => byId[x]).filter(Boolean);
  if (rel.length) p.append(h('div', null, h('div', { class: 'eyebrow', style: 'margin-bottom:6px' }, 'Similar careers'), h('div', { class: 'rel' }, rel.map(o => h('button', { type: 'button', class: R.res[o.id].status === 'x' ? 'x' : '', onclick: () => openDetail(o.id, true) }, o.n)))));
  if (!c.x) p.append(h('div', { class: 'extlinks' }, h('a', { href: `https://www.onetonline.org/link/summary/${c.id}`, target: '_blank', rel: 'noopener' }, 'Full O*NET profile'), h('a', { href: `https://www.mynextmove.org/profile/summary/${c.id}`, target: '_blank', rel: 'noopener' }, 'My Next Move summary')));
  p.append(h('p', { class: 'fine' }, c.x ? 'Not a standard government occupation. Figures are rough estimates for comparison.' : 'Pay: BLS, May 2025. Outlook: BLS projections, 2025–35. Stress, physical demand and people contact are relative to other careers.'));
  const dr = $('#drawer');
  if (dr.hidden) { dr.hidden = false; document.body.style.overflow = 'hidden'; }
  p.scrollTop = 0;
  if (!keepFocus || !p.contains(document.activeElement)) p.querySelector('.close').focus();
}
function closeDetail() {
  const dr = $('#drawer'); if (dr.hidden) return;
  dr.hidden = true; openId = null; document.body.style.overflow = '';
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
}

/* ===================== profile ===================== */
const viewHead = (eyebrow, title, sub) => h('div', { class: 'view-head' }, h('div', null, h('div', { class: 'eyebrow' }, eyebrow), h('h1', { class: 'view-title' }, title), sub ? h('p', { class: 'view-sub' }, sub) : null));
function hexChart(vals) {
  const W = 440, H = 300, cx = 220, cy = 150, Rr = 100, NS = 'http://www.w3.org/2000/svg';
  const ang = i => (-90 + i * 60) * Math.PI / 180, pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'hex'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Interest profile across the six Holland types');
  const el = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; svg.append(e); return e; };
  const poly = r => [0, 1, 2, 3, 4, 5].map(i => pt(i, r).map(n => n.toFixed(1)).join(',')).join(' ');
  [0.25, 0.5, 0.75, 1].forEach(f => el('polygon', { class: 'ring', points: poly(Rr * f) }));
  for (let i = 0; i < 6; i++) { const [x, y] = pt(i, Rr); el('line', { class: 'axis', x1: cx, y1: cy, x2: x.toFixed(1), y2: y.toFixed(1) }); }
  el('polygon', { class: 'area', points: vals.map((v, i) => pt(i, Rr * Math.max(0.04, v)).map(n => n.toFixed(1)).join(',')).join(' ') });
  vals.forEach((v, i) => { const [x, y] = pt(i, Rr * Math.max(0.04, v)); el('circle', { class: 'dot', cx: x.toFixed(1), cy: y.toFixed(1), r: 3.5 }); });
  RIASEC.forEach((t, i) => {
    const [x, y] = pt(i, Rr + 20), cos = Math.cos(ang(i));
    const anchor = Math.abs(cos) < 0.1 ? 'middle' : cos > 0 ? 'start' : 'end', dy = i === 0 ? -8 : i === 3 ? 14 : 4;
    const tx = el('text', { class: 'l', x: x.toFixed(1), y: (y + dy).toFixed(1), 'text-anchor': anchor }, `${t.k} `);
    const ts = document.createElementNS(NS, 'tspan'); ts.setAttribute('class', 'v'); ts.setAttribute('dx', '2'); ts.textContent = `${t.n} ${Math.round(vals[i] * 100)}`; tx.append(ts);
  });
  return svg;
}
function emptyNote(text, partId) { const i = PARTS.findIndex(p => p.id === partId); return h('div', null, h('p', { class: 'muted', style: 'margin:0 0 10px;font-size:14px' }, text), h('button', { class: 'btn ghost sm', type: 'button', onclick: () => goPart(i) }, `Go to Part ${i + 1}`)); }
const hbar = (label, v, extra) => h('div', { class: 'hbar' }, h('span', { class: 'lab' }, label, extra || null), h('span', { class: 'track' }, h('i', { style: `width:${Math.round(v * 100)}%` })), h('span', { class: 'v' }, Math.round(v * 100)));
function renderProfile() {
  const v = $('#view-profile'); v.replaceChildren();
  const U = R.U;
  v.append(viewHead('Your profile', 'What the exam has learned about you', 'It fills in as you answer. Everything here feeds the career scores.'));
  if (state.sample) v.append(sampleBanner());
  const g = h('div', { class: 'grid2' }), colA = h('div', { class: 'stack-v' }), colB = h('div', { class: 'stack-v' });
  const code = hollandCode(U);
  if (code) {
    const a = ARCH[code.slice(0, 2)] || ['', ''];
    colA.append(card('Your archetype', h('div', { class: 'code', 'aria-label': `Holland code ${code}` }, code), h('div', { class: 'arch-name' }, a[0]), h('p', { style: 'margin:0' }, a[1]), h('p', { class: 'muted', style: 'margin:8px 0 0;font-size:13px' }, `Your Holland code lists your three strongest interest types: ${joinNice(code.split('').map(k => RIASEC.find(r => r.k === k).n))}.`)));
    const list = h('div', { class: 'hbars', style: 'margin-top:8px' });
    RIASEC.map((t, i) => [t, U.riasec[i]]).sort((x, y) => y[1] - x[1]).forEach(([t, val]) => list.append(hbar(`${t.n}: ${lc(t.d)}`, val)));
    colA.append(card('Interests', hexChart(U.riasec), list));
  } else colA.append(card('Your archetype', emptyNote('Answer Part 3 to get your Holland code and archetype.', 'riasec')));
  const b5c = card('Personality');
  if (U.b5) {
    [['O', 'Openness', 'Practical, prefers the familiar', 'Curious, drawn to new ideas'], ['C', 'Conscientiousness', 'Flexible, spontaneous', 'Organized, disciplined'], ['E', 'Extraversion', 'Reserved, recharges alone', 'Outgoing, recharges with people'], ['A', 'Agreeableness', 'Direct, competitive', 'Warm, cooperative'], ['S', 'Emotional stability', 'Feels stress strongly', 'Steady under pressure']].forEach(([k, n, lo, hi]) => {
      const val = U.b5[k]; if (val == null) return;
      b5c.append(h('div', { class: 'b5' }, h('div', { class: 'b5-top' }, h('span', null, n), h('span', null, `${Math.round(val * 100)} / 100`)), h('div', { class: 'b5-track' }, h('span', { class: 'b5-dot', style: `left:${val * 100}%` })), h('div', { class: 'b5-ends' }, h('span', null, lo), h('span', { style: 'text-align:right' }, hi))));
    });
  } else b5c.append(emptyNote('Answer at least 8 statements in Part 2.', 'big5'));
  colA.append(b5c);
  const ik = h('div', { class: 'ikigai' }), loves = [];
  if (U.riasec) loves.push(...topIdx(U.riasec, 2).map(i => RIASEC[i].love));
  if (U.energy.on && U.energy.on.length) loves.push(...U.energy.on.map(a => ACT_LABEL[a]));
  const good = Object.entries(U.skills).sort((a, b) => b[1] - a[1]).slice(0, 4).filter(e => e[1] >= 0.5).map(e => SKILL_LABEL[e[0]]);
  const paid = []; if (U.income) paid.push(`At least $${U.income}k a year`);
  R.ranked.slice(0, 10).filter(c => c.p != null).sort((a, b) => b.p - a.p).slice(0, 3).forEach(c => paid.push(`${c.n} (about $${c.p}k)`));
  const needs = (U.life.causes || []).map(z => CAUSE_LABEL[z]);
  [['What you love', loves], ['What you are good at', good], ['What you can be paid for', paid], ['What the world needs from you', needs]].forEach(([t, arr]) => ik.append(h('div', { class: 'ik' }, h('b', null, t), arr.length ? arr.join('; ') : h('span', { class: 'muted' }, 'Not answered yet'))));
  colA.append(card('Your ikigai', h('p', { class: 'muted', style: 'margin:0 0 10px;font-size:13px' }, 'The Japanese idea of a reason for being: where love, skill, pay and need overlap.'), ik));
  const vc = card('Values');
  if (Object.keys(U.valsRaw).length) { const hb = h('div', { class: 'hbars' }); Object.entries(U.valsRaw).sort((a, b) => b[1] - a[1]).forEach(([k, val]) => hb.append(hbar(VAL_LABEL[k], val, U.must.includes(k) ? h('span', { class: 'must' }, 'Must') : null))); vc.append(hb); }
  else vc.append(emptyNote('Answer Part 5 to rank what matters to you.', 'values'));
  colB.append(vc);
  const sk = card('Strengths');
  if (U.skillsN) { const hb = h('div', { class: 'hbars' }); Object.entries(U.skills).sort((a, b) => b[1] - a[1]).forEach(([k, val]) => hb.append(hbar(SKILL_LABEL[k], val))); sk.append(hb); }
  else sk.append(emptyNote('Rate yourself in Part 4.', 'skills'));
  colB.append(sk);
  const E = U.env, ws = h('dl', { class: 'kv' });
  const kv = (dl, k, val) => { if (val) dl.append(h('dt', null, k), h('dd', null, val)); };
  const scaleTxt = (val, lo, hi) => (val == null ? null : val <= 0.25 ? lo : val >= 0.75 ? hi : `Between ${lc(lo)} and ${lc(hi)}`);
  kv(ws, 'People', scaleTxt(E.people, 'Mostly alone', 'With people all day')); kv(ws, 'Structure', scaleTxt(E.structure, 'Figure it out as I go', 'Clear rules and routines'));
  kv(ws, 'Pace', scaleTxt(E.pace, 'Calm and steady', 'Fast and high-pressure')); kv(ws, 'Physical', scaleTxt(E.physical, 'At a desk', 'On my feet'));
  kv(ws, 'Remote', E.remote && optLabel('w.remote', E.remote)); kv(ws, 'Max hours', E.hours != null && optLabel('w.hours', E.hours) + ' a week');
  kv(ws, 'Schedule', E.sched && optLabel('w.sched', E.sched)); kv(ws, 'Settings', E.settings && E.settings.map(s => SETTING_LABEL[s]).join(', '));
  kv(ws, 'Employers', E.emp && (E.emp.length ? E.emp.map(x => optLabel('w.emp', x)).join(', ') : 'No preference')); kv(ws, 'Role', E.role && optLabel('w.role', E.role));
  kv(ws, 'Works best with', E.focus && E.focus.map(x => optLabel('w.focus', x)).join(', '));
  colB.append(card('Work style', ws.children.length ? ws : emptyNote('Answer Part 6.', 'work')));
  const lim = h('dl', { class: 'kv' });
  kv(lim, 'Education now', U.curEdu != null && optLabel('ctx.edu', U.curEdu)); kv(lim, 'Willing to complete', state.a['d.edu'] != null && optLabel('d.edu', state.a['d.edu']));
  kv(lim, 'Income floor', state.a['d.income'] != null && optLabel('d.income', state.a['d.income'])); kv(lim, 'Income swings', U.risk != null && optLabel('d.risk', U.risk));
  kv(lim, 'Full salary needed', U.time != null && optLabel('ctx.time', U.time)); kv(lim, 'Runway', U.runway != null && optLabel('ctx.runway', U.runway)); kv(lim, 'Moving', U.loc != null && optLabel('ctx.loc', U.loc));
  const dc = card('Limits and dealbreakers', lim.children.length ? lim : null);
  if (U.flags.length) dc.append(h('div', { class: 'tags', style: 'margin-top:12px' }, U.flags.map(f => h('span', { class: 'tag x' }, FLAG_LABEL[f]))));
  if (!lim.children.length && !U.flags.length) dc.append(emptyNote('Answer Parts 1 and 7.', 'deal'));
  colB.append(dc);
  const L = U.life, lf = h('dl', { class: 'kv' });
  kv(lf, 'Success at 45', L.success && L.success.map(s => optLabel('l.success', s)).join('; ')); kv(lf, 'Causes', L.causes && (L.causes.length ? L.causes.map(z => CAUSE_LABEL[z]).join(', ') : 'None in particular'));
  kv(lf, 'Biggest regret to avoid', L.regret && optLabel('l.regret', L.regret));
  kv(lf, 'Drains you', U.energy.off && (U.energy.off.length ? U.energy.off.map(a => ACT_LABEL[a]).join(', ') : 'Nothing listed'));
  colB.append(card('Life and energy', lf.children.length ? lf : emptyNote('Answer Parts 8 and 9.', 'life')));
  g.append(colA, colB); v.append(g);
}

/* ===================== results ===================== */
function skillToBuild(c, U) {
  const rated = c.sk.filter(k => U.skills[k] != null).sort((a, b) => U.skills[a] - U.skills[b]);
  return rated.length && U.skills[rated[0]] < 0.75 ? rated[0] : null;
}
function renderResults() {
  const v = $('#view-results'); v.replaceChildren();
  const U = R.U;
  if (state.sample) v.append(sampleBanner());
  if (R.nComp < 4) {
    v.append(viewHead('Results', 'Not enough answers yet', `Results unlock once four scoring areas have answers. You have ${R.nComp}.`));
    v.append(lockedNote());
    return;
  }
  const opts = pickOptions(R), code = hollandCode(U), arch = code ? ARCH[code.slice(0, 2)] : null;
  const gutDone = R.gutPool.length && R.gutPool.every(c => state.marks[c.id]);
  const duelDone = state.duel && state.duel.picks.length && state.duel.picks.length === bracket(state.duel).length;
  v.append(h('div', { class: 'res-hero' }, h('div', { class: 'eyebrow' }, arch ? `${code} · ${arch[0]}` : 'Results'), h('h1', { class: 'view-title' }, 'Your focus options'),
    h('p', { class: 'view-sub' }, `${R.funnel.standing} of ${TOTAL} careers survived. These three are where to put your energy next.`)));
  if (!gutDone || !duelDone) v.append(h('div', { class: 'banner', style: 'background:var(--accent-soft);color:var(--ink)' }, h('span', null, 'Provisional. Finish the gut check and the showdown to sharpen these picks.'), h('button', { class: 'btn ghost sm', type: 'button', style: 'color:var(--ink);border-color:var(--ink)', onclick: () => goPart(PARTS.findIndex(p => p.id === (gutDone ? 'duel' : 'gut'))) }, gutDone ? 'Go to the showdown' : 'Go to the gut check')));
  if (!opts.length) { v.append(card(null, h('p', { style: 'margin:0' }, 'Every career has been crossed off. Loosen a dealbreaker in Part 7, or restore careers on the career board.'))); return; }
  const grid = h('div', { class: 'options' });
  opts.forEach(([c, label, sub], i) => {
    const r = R.res[c.id], ex = explain(c, U, r);
    grid.append(h('article', { class: 'ocard' + (i === 0 ? ' first' : '') },
      h('div', { class: 'lbl' }, h('span', { class: 'eyebrow' }, `Option ${'ABC'[i]} · ${label}`), h('span', { class: 'fit' }, h('b', null, fmtFit(r.fit)), ' fit')),
      h('h2', { class: 'nm' }, h('button', { class: 'plain', type: 'button', onclick: () => openDetail(c.id) }, c.n)),
      h('div', { class: 'cl' }, `${GROUPS[c.g]} · ${sub}`),
      ex.why.length ? h('ul', { class: 'why' }, ex.why.slice(0, 4).map(x => h('li', null, x))) : null,
      ex.watch.length ? h('ul', { class: 'watch' }, ex.watch.slice(0, 3).map(x => h('li', null, x))) : null,
      h('div', { class: 'minifacts' },
        h('div', null, h('span', null, 'Typical pay'), h('b', null, pay(c))), h('div', null, h('span', null, 'Top 10%'), h('b', null, payTop(c))),
        h('div', null, h('span', null, 'Schooling'), h('b', null, r.extra != null ? (r.extra > 0.4 ? `${fmtYears(r.extra)} more` : 'You have it') : EDU_SHORT[c.e])), h('div', null, h('span', null, 'Outlook'), h('b', null, c.gr == null ? 'No projection' : `${signed(c.gr)}% by 2035`))),
      h('div', { class: 'trybox' }, h('b', null, 'First step'), stepFor(c))));
  });
  v.append(grid);
  if (store.get(STAR_KEY) !== 'starred' && store.get(STAR_KEY) !== 'never') v.append(starCard());
  const trio = opts.map(o => o[0]), [A, B, C] = trio;
  const avgH = [0, 1, 2, 3, 4, 5].map(i => avg(trio.map(c => c.h[i])));
  const sharedTypes = topIdx(avgH, 2).map(i => RIASEC[i].n);
  const sharedVals = VALUE_KEYS.filter(k => trio.every(c => c.prov[k] >= 0.55) && ((U.valsRaw[k] ?? 0) >= 0.5 || U.must.includes(k))).slice(0, 3).map(k => lc(VAL_LABEL[k]));
  const sharedCause = (U.life.causes || []).filter(z => trio.filter(c => c.cz.includes(z)).length >= 2).map(z => lc(CAUSE_LABEL[z]));
  const tie = [`All ${trio.length === 1 ? 'of it leans' : 'three lean'} ${joinNice(sharedTypes)}.`];
  if (sharedVals.length) tie.push(`They all offer ${joinNice(sharedVals)}.`);
  if (sharedCause.length) tie.push(`Most of them touch ${joinNice(sharedCause)}.`);
  const skB = skillToBuild(A, U);
  let stmt = `Your focus for the next twelve months: ${A.n}. Test it for real this month, then go deeper only if the work itself energizes you.`;
  if (skB) stmt += ` The skill to build first is ${lc(SKILL_LABEL[skB])}.`;
  if (C && C !== A) stmt += ` Keep ${C.n} alive on the side so you have a real comparison.`;
  const rA = R.res[A.id];
  const yearTxt = rA.extra != null && rA.extra > 0.4 ? `Start the credential. This path usually needs ${EDU_REQ[A.e]}; with training and experience that is about ${fmtYears(rA.extra)} for you. Map the exact programs, prerequisites and costs.` : 'You likely have the schooling it needs. Go for experience: an internship, apprenticeship or entry-level role.';
  v.append(h('h2', { class: 'section-title' }, 'Your next twelve months'));
  v.append(h('div', { class: 'grid2' },
    card('What ties your options together', h('p', { class: 'focus-stmt', style: 'font-size:15.5px' }, tie.join(' ')), arch ? h('p', { class: 'muted', style: 'margin:10px 0 0;font-size:14px' }, `${arch[0]}: ${lc(arch[1])}`) : null, h('h3', { style: 'margin-top:16px' }, 'Your focus'), h('p', { class: 'focus-stmt' }, stmt)),
    card(`Plan for ${A.n}`, h('ol', { class: 'timeline' },
      h('li', null, h('span', { class: 'when' }, 'This month'), h('span', null, stepFor(A))),
      h('li', null, h('span', { class: 'when' }, 'Next 90 days'), h('span', null, `${PLAN90[A.g] || PLAN90.ix} Talk to three people who do this work and ask what they wish they had known.`)),
      h('li', null, h('span', { class: 'when' }, 'This year'), h('span', null, yearTxt)),
      h('li', null, h('span', { class: 'when' }, 'In 6 months'), h('span', null, `Retake this exam with your new experience. If this path still leads, commit. If not, move to ${B && B !== A ? B.n : C ? C.n : 'your next best option'}.`))))));
  const more = R.ranked.filter(c => !trio.includes(c)).slice(0, 8);
  const similar = [...new Set(trio.flatMap(c => c.rel || []))].map(id => byId[id]).filter(c => c && !trio.includes(c) && R.res[c.id].status === 'in').slice(0, 6);
  if (more.length) v.append(card('Also still in the running', h('div', { class: 'rel' }, more.map(c => h('button', { type: 'button', onclick: () => openDetail(c.id) }, `${c.n} · ${fmtFit(R.res[c.id].fit)}`)))));
  if (similar.length) v.append(h('div', { style: 'margin-top:16px' }, card('Close cousins of your options', h('div', { class: 'rel' }, similar.map(c => h('button', { type: 'button', onclick: () => openDetail(c.id) }, c.n))))));
  v.append(h('h2', { class: 'section-title' }, 'How you got here'));
  const f = R.funnel, after1 = TOTAL - f.hard, after2 = after1 - f.soft;
  const rows = [['All careers in the exam', TOTAL], ['Survived your dealbreakers and limits', after1], ['Strong enough overall fit', after2], ['Survived your own cuts', f.standing], ['Your focus options', opts.length]];
  const fun = h('div', { class: 'fun' });
  rows.forEach(([l, n], i) => fun.append(h('div', { class: 'fun-row' + (i === rows.length - 1 ? ' last' : '') }, h('span', null, l), h('b', null, n), h('span', { class: 'fun-track' }, h('i', { style: `width:${Math.max(1, 100 * n / TOTAL)}%` })))));
  const reasonCount = {}, TNAME = { edu: 'Too much schooling', pay: 'Pay below your floor', risk: 'Income too unstable', loc: 'Few jobs where you live', remote: 'Cannot be remote', hours: 'Hours too long', time: 'Takes too long to reach full pay' };
  CAREERS.forEach(c => { const r = R.res[c.id]; if (r.stage === 'hard') r.hard.forEach(x => { const key = x.t === 'flag' ? x.r : TNAME[x.t]; reasonCount[key] = (reasonCount[key] || 0) + 1; }); });
  const topReasons = Object.entries(reasonCount).sort((a, b) => b[1] - a[1]).slice(0, 7);
  v.append(h('div', { class: 'grid2' }, card('The funnel', fun), card('Your biggest filters', topReasons.length ? h('div', { class: 'hbars' }, topReasons.map(([l, n]) => h('div', { class: 'hbar' }, h('span', { class: 'lab' }, l), h('span', { class: 'track' }, h('i', { style: `width:${100 * n / topReasons[0][1]}%;background:var(--strike)` })), h('span', { class: 'v' }, n)))) : h('p', { class: 'muted', style: 'margin:0' }, 'No dealbreakers have crossed anything off yet.'))));
  v.append(h('h2', { class: 'section-title' }, `Every career still standing (${R.ranked.length})`));
  const tw = h('div', { class: 'tbl-wrap' });
  const tb = h('table', null, h('thead', null, h('tr', null, h('th', { class: 'num' }, '#'), h('th', null, 'Career'), h('th', { class: 'num' }, 'Fit'), ...COMPS.slice(0, 5).map(([, l]) => h('th', { class: 'num' }, l)), h('th', { class: 'num' }, 'Pay'), h('th', { class: 'num' }, 'Growth'), h('th', null, 'Schooling'))));
  const body = h('tbody');
  R.ranked.forEach(c => { const r = R.res[c.id]; body.append(h('tr', null, h('td', { class: 'num' }, r.rank), h('td', null, h('button', { class: 'plain', type: 'button', onclick: () => openDetail(c.id) }, c.n), state.stars[c.id] ? ' ★' : ''), h('td', { class: 'num' }, fmtFit(r.fit)), ...COMPS.slice(0, 5).map(([k]) => h('td', { class: 'num' }, r.comp[k] == null ? '–' : Math.round(r.comp[k] * 100))), h('td', { class: 'num' }, c.p == null ? '–' : `$${c.p}k`), h('td', { class: 'num' }, c.gr == null ? '–' : `${signed(c.gr)}%`), h('td', null, EDU_SHORT[c.e]))); });
  tb.append(body); tw.append(tb); v.append(tw);
  v.append(h('h2', { class: 'section-title' }, `Crossed off (${TOTAL - f.standing})`));
  const elog = card(null);
  [['hard', 'Dealbreakers and limits'], ['soft', 'Weak overall fit'], ['you', 'Crossed off by you']].forEach(([st, label]) => {
    const list = CAREERS.filter(c => R.res[c.id].stage === st).sort((a, b) => a.n.localeCompare(b.n));
    if (!list.length) return;
    const ul = h('ul');
    const det = h('details', { class: 'elog' }, h('summary', null, label, h('span', null, list.length)), ul);
    det.addEventListener('toggle', () => { if (det.open && !ul.children.length) list.forEach(c => ul.append(h('li', null, h('button', { class: 'plain', type: 'button', onclick: () => openDetail(c.id) }, c.n), h('span', { class: 'why' }, ' · ' + R.res[c.id].reasons.join(' · '))))); });
    elog.append(det);
  });
  v.append(elog);
  v.append(h('h2', { class: 'section-title' }, 'Get a personal read from Claude'));
  v.append(card(null, h('p', { class: 'muted', style: 'margin:0 0 12px;font-size:14px' }, 'Copy a ready-made prompt with your profile and results, then paste it into a chat with Claude for a short, personal interpretation and paths this exam may have missed.'),
    h('div', { class: 'cta' }, h('button', { class: 'btn accent', type: 'button', onclick: () => copyText(buildPrompt(), 'Prompt copied. Paste it into Claude.') }, 'Copy prompt for Claude'), h('a', { class: 'btn ghost', href: 'https://claude.ai/new', target: '_blank', rel: 'noopener' }, 'Open Claude')), h('div', { id: 'copy-fallback-ai' })));
  v.append(h('h2', { class: 'section-title' }, 'Save your results'));
  v.append(renderSaveCard());
}

/* ===================== GitHub star prompt ===================== */
const STAR_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>';
function starIcon() { const d = h('div', { class: 'star-ico' }); d.innerHTML = STAR_SVG; return d; }
function starLink(label) {
  return h('a', { class: 'btn accent', href: REPO_URL, target: '_blank', rel: 'noopener', onclick: () => { store.set(STAR_KEY, 'starred'); closeModal(); setTimeout(() => toast('Thank you! Stars help other people find the exam.'), 300); if (currentView() === 'results') setTimeout(renderResults, 400); } }, label);
}
function starCard() {
  return h('div', { class: 'card star-card', style: 'margin-top:16px' }, starIcon(),
    h('div', { class: 'txt' }, h('h3', null, 'Was this useful?'), h('p', { class: 'muted', style: 'margin:0;font-size:14px' }, 'The exam is free and open source. A star on GitHub helps other people find it' + (starCount >= 10 ? ` (${starCount} so far).` : '.'))),
    h('div', { class: 'cta' }, starLink('Star on GitHub'), h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { store.set(STAR_KEY, 'never'); renderResults(); } }, 'Hide this')));
}
function showStarModal() {
  const s = store.get(STAR_KEY);
  if (s === 'starred' || s === 'never' || store.sget('cee-star-later')) return;
  const m = $('#modal'), c = $('#modal-card');
  c.replaceChildren(starIcon(),
    h('h2', { id: 'modal-title' }, 'That was the example run'),
    h('p', null, `The board just went from ${TOTAL} careers to ${R.funnel.standing}, all in your browser. If the exam looks useful, would you star it on GitHub? It is free and open source, and stars help other people find it.`),
    starCount >= 10 ? h('p', { class: 'muted', style: 'font-size:13px' }, `★ ${starCount} stars so far`) : null,
    h('div', { class: 'cta' }, starLink('Star on GitHub'), h('button', { class: 'btn ghost', type: 'button', 'data-mclose': '', onclick: () => store.sset('cee-star-later', '1') }, 'Maybe later')),
    h('button', { class: 'linkbtn', type: 'button', style: 'align-self:flex-start', onclick: () => { store.set(STAR_KEY, 'never'); closeModal(); } }, "Don't ask again"));
  m.hidden = false;
  const first = c.querySelector('a, button'); if (first) first.focus();
}
function closeModal() { const m = $('#modal'); if (!m.hidden) m.hidden = true; }
async function fetchStars() {
  const cached = store.sget('cee-stars');
  if (cached != null) { starCount = Number(cached); paintStars(); return; }
  try {
    const r = await fetch(REPO_API, { headers: { accept: 'application/vnd.github+json' } });
    if (!r.ok) return;
    const j = await r.json();
    if (typeof j.stargazers_count === 'number') { starCount = j.stargazers_count; store.sset('cee-stars', String(starCount)); paintStars(); }
  } catch (e) { /* offline or rate limited */ }
}
function paintStars() { const el = $('#gh-count'); if (el && starCount >= 10) { el.textContent = String(starCount); el.hidden = false; } }

/* ===================== export ===================== */
function summaryLines() {
  const U = R.U, L = [], code = hollandCode(U), opts = R.nComp >= 4 ? pickOptions(R) : [];
  L.push('# Career Elimination Exam results', '', `Saved ${new Date().toLocaleDateString()}. ${R.funnel.standing} of ${TOTAL} careers still standing.`, '');
  if (opts.length) {
    L.push('## Focus options');
    opts.forEach(([c, label], i) => { const r = R.res[c.id], ex = explain(c, U, r); L.push(`${i + 1}. **${c.n}** (${label}), fit ${fmtFit(r.fit)}. Typical pay ${pay(c)}; usually requires ${EDU_REQ[c.e]}; outlook ${c.gr == null ? 'n/a' : signed(c.gr) + '% by 2035'}.`); if (ex.why.length) L.push(`   - Why: ${ex.why.join('; ')}`); if (ex.watch.length) L.push(`   - Watch out: ${ex.watch.join('; ')}`); L.push(`   - First step: ${stepFor(c)}`); });
    L.push('');
  }
  L.push('## Profile');
  if (code) L.push(`- Holland code: ${code} (${RIASEC.map((t, i) => `${t.n} ${Math.round(U.riasec[i] * 100)}`).join(', ')})`);
  if (code && ARCH[code.slice(0, 2)]) L.push(`- Archetype: ${ARCH[code.slice(0, 2)][0]}`);
  if (U.b5) L.push(`- Personality: openness ${Math.round((U.b5.O ?? 0.5) * 100)}, conscientiousness ${Math.round((U.b5.C ?? 0.5) * 100)}, extraversion ${Math.round((U.b5.E ?? 0.5) * 100)}, agreeableness ${Math.round((U.b5.A ?? 0.5) * 100)}, emotional stability ${Math.round((U.b5.S ?? 0.5) * 100)}`);
  const tv = Object.entries(U.valsRaw).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => VAL_LABEL[k]);
  if (tv.length) L.push(`- Top values: ${tv.join(', ')}`);
  if (U.must.length) L.push(`- Must-haves: ${U.must.map(k => VAL_LABEL[k]).join(', ')}`);
  const ts = Object.entries(U.skills).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => SKILL_LABEL[k]);
  if (ts.length) L.push(`- Top strengths: ${ts.join(', ')}`);
  if (U.flags.length) L.push(`- Dealbreakers: ${U.flags.map(f => FLAG_LABEL[f]).join(', ')}`);
  if (U.life.causes && U.life.causes.length) L.push(`- Causes: ${U.life.causes.map(z => CAUSE_LABEL[z]).join(', ')}`);
  if (U.life.success && U.life.success.length) L.push(`- Success at 45: ${U.life.success.map(s => optLabel('l.success', s)).join('; ')}`);
  if (U.energy.on && U.energy.on.length) L.push(`- Energized by: ${U.energy.on.map(a => ACT_LABEL[a]).join(', ')}`);
  if (U.energy.off && U.energy.off.length) L.push(`- Drained by: ${U.energy.off.map(a => ACT_LABEL[a]).join(', ')}`);
  L.push('', '## Still standing (ranked)');
  R.ranked.slice(0, 30).forEach(c => L.push(`${R.res[c.id].rank}. ${c.n} (fit ${fmtFit(R.res[c.id].fit)})`));
  const crossed = CAREERS.filter(c => R.res[c.id].status === 'x');
  L.push('', `## Crossed off (${crossed.length})`);
  const top = {}; crossed.forEach(c => { const k = R.res[c.id].short; top[k] = (top[k] || 0) + 1; });
  Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, n]) => L.push(`- ${n} careers: ${k}`));
  L.push('', `Data: O*NET ${META ? META.sources[0].name.replace('O*NET ', '') : ''} (USDOL/ETA, CC BY 4.0) and U.S. Bureau of Labor Statistics. ${location.origin}${location.pathname}`);
  return L;
}
function buildPrompt() {
  const U = R.U, E = U.env, extra = [];
  const pct = x => (x == null ? 'n/a' : Math.round(x * 100) + '/100');
  extra.push(`Work style: people contact ${pct(E.people)}, structure ${pct(E.structure)}, pace ${pct(E.pace)}, physical ${pct(E.physical)}, remote: ${E.remote ? optLabel('w.remote', E.remote) : 'n/a'}, role: ${E.role ? optLabel('w.role', E.role) : 'n/a'}.`);
  extra.push(`Situation: ${state.a['ctx.stage'] ? optLabel('ctx.stage', state.a['ctx.stage']) : 'n/a'}; education ${U.curEdu != null ? optLabel('ctx.edu', U.curEdu) : 'n/a'}; willing to complete ${state.a['d.edu'] != null ? optLabel('d.edu', state.a['d.edu']) : 'n/a'}; income floor ${state.a['d.income'] != null ? optLabel('d.income', state.a['d.income']) : 'n/a'}; risk: ${U.risk != null ? optLabel('d.risk', U.risk) : 'n/a'}; regret to avoid: ${U.life.regret ? optLabel('l.regret', U.life.regret) : 'n/a'}.`);
  const kept = Object.keys(state.marks).filter(id => state.marks[id] === 'k' && byId[id]).map(id => byId[id].n);
  const cut = Object.keys(state.marks).filter(id => state.marks[id] === 'x' && byId[id]).map(id => byId[id].n);
  if (kept.length) extra.push(`They chose to keep in the gut check: ${kept.join(', ')}.`);
  if (cut.length) extra.push(`They personally crossed off: ${cut.join(', ')}.`);
  return [
    `You are a thoughtful, plain-spoken career counselor. Someone just finished a career elimination exam that scored ${TOTAL} careers (every O*NET occupation plus a few entrepreneurial paths) against their personality, interests, strengths, values, work style, dealbreakers, life goals and energy. Below is their data and results.`,
    'Write them a personal read, addressing them as "you". Use exactly these sections:',
    '## What stands out about you (3 to 4 sentences on the patterns in their answers, including any tension between them)',
    '## Your three focus options (for each: why it fits, the biggest risk, and one concrete first step this month)',
    '## Paths this exam may have missed (2 or 3 specific roles or niches, one line each on why they fit)',
    '## Questions to sit with (3 short questions)',
    'Keep it under 550 words. Be specific to the data and do not invent facts about the person.',
    '', '--- DATA ---', ...summaryLines(), '', ...extra
  ].join('\n');
}
function copyText(text, done) {
  try { navigator.clipboard.writeText(text).then(() => toast(done || 'Summary copied.'), () => copyFallback(text)); }
  catch (e) { copyFallback(text); }
}
function copyFallback(text) {
  const box = $('#copy-fallback') || $('#copy-fallback-ai'); if (!box) return;
  const ta = h('textarea', { class: 'copybox', readonly: true, 'aria-label': 'Text to copy' }); ta.value = text;
  box.replaceChildren(h('p', { style: 'margin:12px 0 6px;font-size:13px' }, 'Copying is blocked here. The text is selected below; press Ctrl+C or Cmd+C.'), ta);
  ta.focus(); ta.select();
}
function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = h('a', { href: url, download: name, style: 'display:none' }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000); toast('Download started.');
}
function renderSaveCard() {
  const c = card(null), row = h('div', { class: 'cta' });
  row.append(h('button', { class: 'btn', type: 'button', onclick: () => copyText(summaryLines().join('\n')) }, 'Copy summary'));
  row.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => download('career-exam-results.md', summaryLines().join('\n'), 'text/markdown') }, 'Save results (.md)'));
  row.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => download('career-exam-answers.json', JSON.stringify({ app: 'career-elimination-exam', v: 2, a: state.a, marks: state.marks, stars: state.stars, over: state.over, duel: state.duel }, null, 2), 'application/json') }, 'Save answers (.json)'));
  const fileIn = h('input', { type: 'file', accept: '.json,application/json', class: 'hidden-file', id: 'load-file' });
  fileIn.addEventListener('change', () => {
    const file = fileIn.files && fileIn.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(String(rd.result)); if (!d || typeof d.a !== 'object') throw new Error('bad');
        const keep = o => Object.fromEntries(Object.entries(o || {}).filter(([id]) => byId[id]));
        state = Object.assign(fresh(), { a: d.a, marks: keep(d.marks), stars: keep(d.stars), over: keep(d.over), duel: d.duel && d.duel.seeds && d.duel.seeds.every(id => byId[id]) ? d.duel : null, started: true, board: state.board });
        prevStatus = null; recent = []; commit({ all: true }); toast('Answers loaded.');
      } catch (err) { toast('That file is not a saved answers file from this exam.'); }
    };
    rd.readAsText(file); fileIn.value = '';
  });
  row.append(h('label', { class: 'btn ghost', for: 'load-file', style: 'cursor:pointer' }, 'Load answers file'), fileIn);
  const reset = h('button', { class: 'btn danger', type: 'button' }, 'Start over');
  reset.addEventListener('click', () => armButton(reset, 'Click again to erase all answers', () => { resetAll(); toast('All answers erased.'); }));
  row.append(reset);
  c.append(row, h('p', { class: 'muted', style: 'margin:12px 0 0;font-size:13px' }, 'Your answers stay in this browser only. Saving an answers file lets you continue on another device.'), h('div', { id: 'copy-fallback' }));
  return c;
}

/* ===================== sample + reset ===================== */
function loadSample() {
  state = Object.assign(fresh(), { a: sampleAnswers(), sample: true, started: false, board: state.board });
  recent = []; prevStatus = Object.fromEntries(CAREERS.map(c => [c.id, 'in']));
  commit({ all: true });
  toast(`Example loaded: ${R.funnel.standing} of ${TOTAL} careers left standing.`);
  setTimeout(showStarModal, 2200);
}
function resetAll() {
  state = Object.assign(fresh(), { board: state.board });
  recent = []; prevStatus = null;
  commit({ all: true });
}

/* ===================== routing ===================== */
const VIEWS = ['exam', 'board', 'profile', 'results'];
function currentView() { const v = (location.hash || '').slice(1); return VIEWS.includes(v) ? v : 'exam'; }
function go(v) { if (currentView() === v) route(); else location.hash = v; }
function renderView(v) { if (v === 'exam') renderExam(); else if (v === 'board') renderBoard(); else if (v === 'profile') renderProfile(); else renderResults(); }
let lastView = null;
function route() {
  const v = currentView();
  VIEWS.forEach(x => { $('#view-' + x).hidden = x !== v; });
  $$('.tab').forEach(t => t.setAttribute('aria-current', t.dataset.view === v ? 'page' : 'false'));
  renderView(v);
  if (lastView !== v) window.scrollTo(0, 0);
  lastView = v;
  document.title = v === 'exam' ? 'Career Elimination Exam' : `${{ board: 'Career board', profile: 'Your profile', results: 'Results' }[v]} · Career Elimination Exam`;
}
function commit(opts = {}) {
  save(); compute(); updateHeader();
  const v = currentView();
  if (v === 'exam') { if (opts.exam || opts.all) renderExam(); else { renderRail(); updateExamChrome(); } }
  else renderView(v);
  if (openId && !$('#drawer').hidden) openDetail(openId, true);
}
function setHdr() { const t = $('#top'); if (t) document.documentElement.style.setProperty('--hdr', t.offsetHeight + 'px'); }

async function boot() {
  try {
    const res = await fetch('data/careers.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    META = data.meta; CAREERS = prepareCareers(data.careers); TOTAL = CAREERS.length; byId = Object.fromEntries(CAREERS.map(c => [c.id, c]));
  } catch (e) {
    $('#loading').replaceChildren(h('p', null, 'Could not load the career data. Check your connection and reload the page.'));
    return;
  }
  load(); compute(); updateHeader();
  $('#loading').remove();
  $$('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.view)));
  window.addEventListener('hashchange', route);
  window.addEventListener('resize', setHdr);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else closeDetail(); } });
  $('#drawer').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDetail(); });
  $('#modal').addEventListener('click', e => { if (e.target.closest('[data-mclose]')) closeModal(); });
  route(); setHdr();
  fetchStars();
}
boot();
