/* Scoring engine: pure functions, no DOM. Imported by the app and by the tests. */
import {
  B5, SKILL_KEYS, VALUE_KEYS, COMPS, RIASEC, CUR_YEARS, RUNWAY_Y, TIME_MAX, FIELD_GROUPS,
  EDU_REQ, EDU_HELD, FLAG_LABEL, VAL_LABEL, SKILL_LABEL, CAUSE_LABEL, ACT_LABEL, SETTING_LABEL, hoursBucket
} from './catalog.js';

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const wavg = parts => { let n = 0, d = 0; for (const [w, v] of parts) { n += w * v; d += w; } return d ? n / d : 0; };
export const topIdx = (arr, k) => arr.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, k).map(x => x[1]);
export const lc = s => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
export const joinNice = arr => { if (arr.length <= 1) return arr[0] || ''; if (arr.some(x => / and /.test(x))) return arr.join('; '); return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]; };
export const fmtYears = y => { const r = Math.round(y * 2) / 2; if (r < 1) return 'under a year'; return r === 1 ? '1 year' : `${r} years`; };
export const logn = (x, lo, hi) => clamp((Math.log(Math.max(x, 1)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)));
function pearson(x, y) {
  const mx = avg(x), my = avg(y); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) { const a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  if (sxx < 1e-9 || syy < 1e-9) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/** Adds derived lookup fields to raw career records (idempotent). */
export function prepareCareers(list) {
  for (const c of list) {
    if (c.prov) continue;
    c.prov = Object.fromEntries(VALUE_KEYS.map((k, i) => [k, c.v[i]]));
    c.skv = Object.fromEntries(SKILL_KEYS.map((k, i) => [k, c.sv[i]]));
    c.role = c.g === 'ix' ? 'own' : c.prov.leadership >= 0.62 ? 'mgr' : 'ic';
    c.roles = c.g === 'ix' ? ['own'] : ['ic'];
    if (c.prov.leadership >= 0.5 && !c.roles.includes('mgr')) c.roles.push('mgr');
    if (c.own >= 0.35 && !c.roles.includes('own')) c.roles.push('own');
    c.vis = clamp(0.45 * c.skv.perform + 0.3 * (c.fl.includes('speak') ? 1 : 0) + 0.25 * c.prov.prestige);
    c.hrB = hoursBucket(c.hr);
    c.rmB = c.rm < 0.3 ? 0 : c.rm < 0.6 ? 1 : 2;
    c.gr01 = c.gr == null ? 0.4 : clamp((c.gr + 10) / 30);
    c.search = (c.n + ' ' + (c.alt || []).join(' ')).toLowerCase();
  }
  return list;
}

/** Turns raw answers into a normalized user model. */
export function userModel(A) {
  const U = {};
  const num = k => (A[k] == null || A[k] === '' ? null : Number(A[k]));
  const sc = k => { const v = num(k); return v == null ? null : (v - 1) / 4; };
  let rn = 0; const rv = [];
  for (const L of 'RIASEC') { let s = 0, n = 0; for (let i = 1; i <= 5; i++) { const v = num(`r.${L}${i}`); if (v != null) { s += (v - 1) / 4; n++; rn++; } } rv.push(n ? s / n : null); }
  U.riasecN = rn; U.riasec = rn >= 6 ? rv.map(x => x ?? 0.5) : null;
  let bn = 0; const b = {};
  for (const T of ['O', 'C', 'E', 'A', 'S']) { let s = 0, n = 0; for (const it of B5.filter(x => x[1] === T)) { const v = num('b.' + it[0]); if (v != null) { s += it[2] ? (5 - v) / 4 : (v - 1) / 4; n++; bn++; } } b[T] = n ? s / n : null; }
  U.b5N = bn; U.b5 = bn >= 8 ? b : null;
  U.skills = {}; let sn = 0;
  for (const k of SKILL_KEYS) { const v = num('s.' + k); if (v != null) { U.skills[k] = (v - 1) / 4; sn++; } }
  U.skillsN = sn;
  U.topSkills = Object.entries(U.skills).sort((a, b) => b[1] - a[1]).filter(e => e[1] >= 0.75).slice(0, 3).map(e => e[0]);
  const vals = {}; let vn = 0;
  for (const k of VALUE_KEYS) { const v = num('v.' + k); if (v != null) { vals[k] = (v - 1) / 4; vn++; } }
  U.must = Array.isArray(A['v.must']) ? A['v.must'] : [];
  U.valsRaw = vals; U.vals = vn >= 6 ? vals : null;
  U.env = { settings: A['w.setting'] || null, people: sc('w.people'), structure: sc('w.structure'), pace: sc('w.pace'), physical: sc('w.physical'), remote: A['w.remote'] || null, hours: num('w.hours'), sched: A['w.sched'] || null, emp: A['w.emp'] || null, role: A['w.role'] || null, focus: A['w.focus'] || null };
  U.curEdu = num('ctx.edu'); U.curYears = U.curEdu == null ? null : CUR_YEARS[U.curEdu];
  const de = num('d.edu'); U.maxEdu = de == null ? null : Math.max(U.curEdu ?? 0, de);
  const inc = num('d.income'); U.income = inc || null;
  U.risk = num('d.risk'); U.aiWorry = sc('d.ai');
  U.runway = num('ctx.runway'); U.time = num('ctx.time'); U.loc = num('ctx.loc');
  U.fields = (A['ctx.field'] || []).filter(f => f !== 'und'); U.build = num('ctx.build') || 0;
  U.flags = A['d.flags'] || [];
  U.life = { success: A['l.success'] || null, causes: A['l.causes'] || null, meaning: sc('l.meaning'), visible: sc('l.visible'), ownbiz: sc('l.ownbiz'), family: sc('l.family'), regret: A['l.regret'] || null };
  U.energy = { on: A['e.on'] || null, off: A['e.off'] || null };
  U.practical = ['d.ai', 'd.income', 'ctx.runway', 'd.risk'].some(k => A[k] != null);
  return U;
}

const SUCCESS_FIT = {
  wealth: c => c.prov.income, expert: c => (c.prov.mastery + c.prov.prestige) / 2, built: c => Math.max(c.own, c.prov.creativity * 0.8),
  difference: c => c.prov.impact, creative: c => c.prov.creativity * 0.7 + c.vis * 0.3, family: c => c.prov.balance,
  adventure: c => c.prov.adventure, lead: c => c.prov.leadership
};
const REGRET_FIT = {
  safe: c => 0.5 * c.rk + 0.5 * Math.max(c.prov.adventure, c.own), money: c => c.prov.income, help: c => c.prov.impact,
  create: c => Math.max(c.prov.creativity, c.own), people: c => c.prov.balance, mastery: c => c.prov.mastery
};

/** Scores one career against the user model. Returns component scores (0..1), overall fit (0..100) and hard eliminations. */
export function scoreCareer(c, U) {
  const comp = {};
  const extra = U.curYears == null ? null : Math.max(0, c.ty - U.curYears);
  if (U.riasec) {
    const cv = c.h, sum = cv.reduce((s, x) => s + x, 0) || 1;
    const raw = cv.reduce((s, x, i) => s + x * U.riasec[i], 0) / sum;
    const r = pearson(cv, U.riasec);
    comp.interest = clamp(0.6 * raw + 0.4 * (r == null ? raw : (r + 1) / 2));
  }
  if (U.b5) {
    const B = U.b5, g = k => B[k] ?? 0.5, [dO, dC, dE, dA, dS] = c.b5;
    const fit = 0.25 * (1 - Math.abs(g('E') - dE)) + 0.2 * (1 - Math.abs(g('O') - dO)) + 0.15 * (1 - Math.abs(g('A') - dA)) + 0.2 * (1 - Math.max(0, dC - g('C'))) + 0.2 * (1 - 1.2 * Math.max(0, dS - g('S')));
    comp.personality = clamp((fit - 0.45) / 0.5);
  }
  if (U.vals) {
    let n = 0, d = 0;
    for (const k of VALUE_KEYS) { const w = U.vals[k]; if (w == null) continue; const ww = 0.05 + w * w; n += ww * c.prov[k]; d += ww; }
    let V = clamp((n / d - 0.3) / 0.45);
    for (const m of U.must) if (c.prov[m] < 0.45) V -= 0.12;
    comp.values = clamp(V);
  }
  const E = U.env, ep = [];
  if (E.people != null) ep.push([1.2, 1 - Math.abs(E.people - c.pp)]);
  if (E.structure != null) ep.push([1, 1 - Math.abs(E.structure - c.sx)]);
  if (E.pace != null) ep.push([1, 1 - Math.abs(E.pace - c.pc)]);
  if (E.physical != null) ep.push([1.2, 1 - Math.abs(E.physical - c.ph)]);
  if (E.settings && E.settings.length) ep.push([1.2, [...c.set].some(s => E.settings.includes(s)) ? 1 : 0.25]);
  if (E.remote) { const m = { need: [0, 0.4, 1], prefer: [0.3, 0.7, 1], hybrid: [0.6, 1, 1], inperson: [1, 1, 0.75], any: [1, 1, 1] }[E.remote]; if (m) ep.push([1, m[c.rmB]]); }
  if (E.hours != null) { const over = c.hrB - Math.min(3, E.hours); ep.push([1, over <= 0 ? 1 : Math.max(0, 1 - 0.45 * over)]); }
  if (E.sched) { const night = c.fl.includes('night') || c.fl.includes('oncall'); ep.push([0.8, { day: night ? 0.15 : 1, eve: night ? 0.55 : 1, shift: 1, any: 1 }[E.sched] ?? 1]); }
  if (E.emp && E.emp.length) ep.push([0.8, c.emp.some(x => E.emp.includes(x)) ? 1 : 0.4]);
  if (E.role && E.role !== 'unsure') ep.push([0.8, c.role === E.role ? 1 : c.roles.includes(E.role) ? 0.8 : 0.45]);
  if (E.focus && E.focus.length) ep.push([1, 0.25 + 0.75 * (E.focus.filter(f => c.fo.includes(f)).length / E.focus.length)]);
  if (ep.length >= 3) comp.env = clamp((wavg(ep) - 0.35) / 0.6);
  if (U.skillsN >= 6) {
    let n = 0, d = 0;
    for (const k of SKILL_KEYS) { const w = c.skv[k] * c.skv[k]; n += w * (U.skills[k] ?? 0.5); d += w; }
    comp.skills = clamp(0.1 + 0.95 * (d ? n / d : 0.5) + 0.05 * c.sk.filter(k => U.topSkills.includes(k)).length);
  }
  const Lf = U.life, mp = [];
  if (Lf.causes && Lf.causes.length) mp.push([1.3, c.cz.some(z => Lf.causes.includes(z)) ? 1 : 0.2]);
  if (Lf.success && Lf.success.length) mp.push([1.3, avg(Lf.success.map(s => (SUCCESS_FIT[s] || (() => 0.5))(c)))]);
  if (Lf.meaning != null) mp.push([0.9, Lf.meaning * c.prov.impact + (1 - Lf.meaning) * c.prov.income]);
  if (Lf.visible != null) mp.push([0.7, 1 - Math.abs(Lf.visible - c.vis)]);
  if (Lf.ownbiz != null) mp.push([0.8, 1 - Math.abs(Lf.ownbiz - c.own)]);
  if (Lf.family != null) mp.push([0.8, 1 - Math.max(0, Lf.family - c.prov.balance)]);
  if (Lf.regret && REGRET_FIT[Lf.regret]) mp.push([1, REGRET_FIT[Lf.regret](c)]);
  if (mp.length >= 2) comp.meaning = clamp((wavg(mp) - 0.25) / 0.65);
  const on = U.energy.on, off = U.energy.off;
  if (on || off) {
    const fOn = on && on.length ? on.filter(a => c.acts.includes(a)).length / on.length : 0;
    const fOff = off && off.length ? off.filter(a => c.acts.includes(a)).length / off.length : 0;
    comp.energy = clamp(0.45 + 0.65 * fOn - 0.6 * fOff);
  }
  if (U.practical) {
    const aiW = 0.2 + 0.5 * (U.aiWorry ?? 0.5);
    const op = [[1, c.gr01], [aiW * 2, 1 - c.ai]];
    if (U.income && c.p != null) op.push([1.2, c.p >= U.income ? 1 : Math.pow(clamp(c.p / U.income), 2)]);
    if (U.runway != null && extra != null && extra > 0) op.push([1, extra <= RUNWAY_Y[U.runway] + 1 ? 1 : 0.35]);
    comp.outlook = clamp(wavg(op));
  }
  let num = 0, den = 0;
  for (const [k, , w] of COMPS) if (comp[k] != null) { num += w * comp[k]; den += w; }
  let fit = den ? (100 * num) / den : null;
  if (fit != null) {
    if (U.build > 0 && U.fields.length) fit += U.fields.some(f => (FIELD_GROUPS[f] || []).includes(c.g)) ? 2 * U.build : -1.5 * U.build;
    if (U.loc === 1 && c.fl.includes('relocate')) fit -= 4;
    fit = clamp(fit, 0, 100);
  }
  const hard = [];
  if (U.maxEdu != null && c.e > U.maxEdu) hard.push({ t: 'edu', r: `Requires ${EDU_REQ[c.e]}; you would stop at ${EDU_HELD[U.maxEdu]}` });
  if (U.income && c.t != null && c.t < U.income) hard.push({ t: 'pay', r: `Even top earners make about $${c.t}k; you need $${U.income}k` });
  else if (U.income && c.p != null && c.p < U.income * 0.65) hard.push({ t: 'pay', r: `Typical pay is about $${c.p}k, far below your $${U.income}k floor` });
  if (U.risk === 0 && c.rk >= 0.55) hard.push({ t: 'risk', r: 'Income swings a lot; you need steady pay' });
  if (U.risk === 1 && c.rk >= 0.75) hard.push({ t: 'risk', r: 'Income is very unpredictable' });
  for (const f of c.fl) if (U.flags.includes(f)) hard.push({ t: 'flag', f, r: 'Involves ' + lc(FLAG_LABEL[f]) });
  if (U.loc === 0 && c.fl.includes('relocate')) hard.push({ t: 'loc', r: 'Few jobs, so you would likely have to move' });
  if (E.remote === 'need' && c.rmB === 0) hard.push({ t: 'remote', r: 'Has to be done in person' });
  if (E.hours === 0 && c.hrB === 3) hard.push({ t: 'hours', r: 'Most people in this job work over 40 hours; you want under 40' });
  if (U.time != null && extra != null && extra > TIME_MAX[U.time]) hard.push({ t: 'time', r: `Needs about ${fmtYears(extra)} more training before full pay` });
  return { comp, fit, extra, hard };
}

function weakest(r) { let best = null; for (const [k, l] of COMPS) { if (r.comp[k] == null) continue; if (!best || r.comp[k] < best[1]) best = [l, r.comp[k]]; } return best; }

export function bracket(d) {
  const s = d.seeds, n = s.length;
  const first = n === 8 ? [[0, 7], [3, 4], [1, 6], [2, 5]] : [[0, 3], [1, 2]];
  const M = first.map(([i, j]) => ({ a: s[i], b: s[j], round: 0 }));
  let start = 0, count = first.length, round = 1;
  while (count > 1) {
    for (let k = 0; k < count; k += 2) M.push({ a: d.picks[start + k] ?? null, b: d.picks[start + k + 1] ?? null, round });
    start += count; count /= 2; round++;
  }
  return M;
}
export function duelBonus(d) {
  const out = {}; if (!d) return out;
  const M = bracket(d), last = M.length - 1, finalRound = M[last].round;
  M.forEach((m, i) => {
    const w = d.picks[i]; if (!w) return;
    const loser = m.a === w ? m.b : m.a;
    if (i === last) { out[w] = 10; if (loser) out[loser] = 6; }
    else if (m.round === finalRound - 1 && loser && out[loser] == null) out[loser] = 3;
  });
  return out;
}

export const SOFT = { gap: 25, maxRank: 40, minKeep: 15, minComponents: 4, gutSize: 20 };

/**
 * Scores every career, applies hard eliminations, the weak-fit cut and the user's own marks.
 * state = { a, marks, stars, over, duel }
 */
export function computeAll(careers, state) {
  const U = userModel(state.a || {}), res = {};
  for (const c of careers) res[c.id] = scoreCareer(c, U);
  const nComp = careers.length ? Object.keys(res[careers[0].id].comp).length : 0;
  const marks = state.marks || {}, stars = state.stars || {}, over = state.over || {};
  const fitOf = c => res[c.id].fit ?? -1;
  const byFit = (a, b) => fitOf(b) - fitOf(a) || a.n.localeCompare(b.n);
  const hardOut = c => res[c.id].hard.length > 0 && !over[c.id];
  const pool = careers.filter(c => !hardOut(c)).sort(byFit);
  const soft = new Set();
  const leaderFit = pool.length && res[pool[0].id].fit != null ? res[pool[0].id].fit : null;
  if (nComp >= SOFT.minComponents && leaderFit != null) {
    pool.forEach((c, i) => { if (over[c.id] || stars[c.id] || marks[c.id] === 'k') return; if (res[c.id].fit < leaderFit - SOFT.gap || i >= SOFT.maxRank) soft.add(c.id); });
    const kept = pool.filter(c => !soft.has(c.id));
    if (kept.length < SOFT.minKeep) for (const c of pool) { if (kept.length >= SOFT.minKeep) break; if (soft.has(c.id)) { soft.delete(c.id); kept.push(c); } }
  }
  const D = duelBonus(state.duel);
  for (const c of careers) {
    const r = res[c.id];
    if (marks[c.id] === 'x') { r.status = 'x'; r.stage = 'you'; r.short = 'You crossed it off'; r.reasons = ['You crossed it off yourself.']; }
    else if (hardOut(c)) { r.status = 'x'; r.stage = 'hard'; r.short = r.hard[0].r; r.reasons = r.hard.map(x => x.r); }
    else if (soft.has(c.id)) {
      r.status = 'x'; r.stage = 'soft'; const w = weakest(r);
      r.short = `Weak fit: ${Math.round(r.fit)} vs ${Math.round(leaderFit)}${w ? ', weakest on ' + w[0].toLowerCase() : ''}`;
      r.reasons = [`Weak overall fit: ${Math.round(r.fit)} against ${Math.round(leaderFit)} for your top career.` + (w ? ` Weakest area: ${w[0].toLowerCase()} (${Math.round(w[1] * 100)}/100).` : '')];
    } else { r.status = 'in'; r.stage = null; r.short = ''; r.reasons = []; }
    r.final = r.fit == null ? null : r.fit + (marks[c.id] === 'k' ? 5 : 0) + (stars[c.id] ? 5 : 0) + (D[c.id] || 0);
    r.rank = null;
  }
  const standing = careers.filter(c => res[c.id].status === 'in');
  const ranked = standing.slice().sort((a, b) => ((res[b.id].final ?? -1) - (res[a.id].final ?? -1)) || a.n.localeCompare(b.n));
  ranked.forEach((c, i) => { res[c.id].rank = i + 1; });
  const cnt = st => careers.filter(c => res[c.id].stage === st).length;
  const funnel = { total: careers.length, hard: cnt('hard'), soft: cnt('soft'), you: cnt('you'), standing: standing.length };
  const gutPool = pool.filter(c => !soft.has(c.id)).slice(0, SOFT.gutSize);
  return { U, res, nComp, ranked, funnel, gutPool, leaderFit };
}

/** Plain-language reasons a career fits or might not. */
export function explain(c, U, r) {
  const why = [], watch = [];
  if (r.comp.interest != null && U.riasec) {
    const ut = topIdx(U.riasec, 3), ct = topIdx(c.h, 2), shared = ct.filter(i => ut.includes(i));
    if (r.comp.interest >= 0.6 && shared.length) why.push(`Matches your ${joinNice(shared.map(i => RIASEC[i].n))} interests`);
    else if (r.comp.interest < 0.42) watch.push(`Light on what you enjoy most (${joinNice(ut.slice(0, 2).map(i => RIASEC[i].n))})`);
  }
  if (U.vals) {
    const imp = VALUE_KEYS.filter(k => (U.vals[k] ?? 0) >= 0.75 || U.must.includes(k));
    const met = imp.filter(k => c.prov[k] >= 0.62).sort((a, b) => c.prov[b] - c.prov[a]).slice(0, 3);
    if (met.length) why.push(`Delivers what you value: ${joinNice(met.map(k => lc(VAL_LABEL[k])))}`);
    for (const m of U.must) if (c.prov[m] < 0.45) watch.push(`Weak on a must-have: ${lc(VAL_LABEL[m])}`);
  }
  if (U.skillsN >= 6) {
    const strong = c.sk.filter(k => (U.skills[k] ?? 0) >= 0.75);
    const gaps = c.sk.filter(k => U.skills[k] != null && U.skills[k] <= 0.25 && c.skv[k] >= 0.5);
    if (strong.length) why.push(`Uses your strengths: ${joinNice(strong.map(k => lc(SKILL_LABEL[k])))}`);
    if (gaps.length) watch.push(`You would need to build: ${joinNice(gaps.map(k => lc(SKILL_LABEL[k])))}`);
  }
  const E = U.env;
  if (E.people != null) {
    const d = E.people - c.pp;
    if (Math.abs(d) <= 0.2) why.push(c.pp >= 0.5 ? 'Lots of people contact, which you want' : 'Plenty of quiet focus time, which you want');
    else if (d <= -0.5) watch.push('Far more people contact than you want');
    else if (d >= 0.5) watch.push('More solitary than you want');
  }
  if (E.settings && E.settings.length) { const s = [...c.set].find(x => E.settings.includes(x)); if (s) why.push(`Happens in a setting you like: ${lc(SETTING_LABEL[s])}`); }
  if (E.physical != null && Math.abs(E.physical - c.ph) >= 0.6) watch.push(c.ph > E.physical ? 'More physical than you want' : 'More desk-bound than you want');
  if (E.hours != null && c.hrB > Math.min(3, E.hours)) watch.push(`About ${Math.round(c.hr * 100)}% of workers put in more than 40 hours a week`);
  if (E.remote === 'prefer' && c.rmB === 0) watch.push('Rarely remote');
  if (U.b5) {
    if (c.st >= 0.75 && U.b5.S != null && U.b5.S < 0.45) watch.push('High-stress work, and you said pressure gets to you');
    if (c.st >= 0.75 && U.b5.S != null && U.b5.S >= 0.7) why.push('High-pressure work suits your steady temperament');
    if (c.pp >= 0.8 && U.b5.E != null && U.b5.E < 0.35) watch.push('Constant people contact may drain you');
  }
  if (U.life.causes && U.life.causes.length) { const cz = c.cz.filter(z => U.life.causes.includes(z)); if (cz.length) why.push(`Connects to causes you care about: ${joinNice(cz.map(z => lc(CAUSE_LABEL[z])))}`); }
  const on = (U.energy.on || []).filter(a => c.acts.includes(a)), off = (U.energy.off || []).filter(a => c.acts.includes(a));
  if (on.length) why.push(`Full of things that energize you: ${joinNice(on.map(a => lc(ACT_LABEL[a])))}`);
  if (off.length) watch.push(`Includes things that drain you: ${joinNice(off.map(a => lc(ACT_LABEL[a])))}`);
  if (U.income && c.p != null && c.p < U.income) watch.push(`Typical pay (about $${c.p}k) is below your $${U.income}k target; top earners reach about $${c.t}k`);
  if (r.extra != null && r.extra > 0.4) watch.push(`About ${fmtYears(r.extra)} more training before you are fully qualified`);
  if (c.ai >= 0.67 && (U.aiWorry ?? 0) >= 0.5) watch.push('Higher estimated exposure to AI and automation');
  if (c.rk >= 0.55 && U.risk === 1) watch.push('Income can swing from year to year');
  if (U.loc === 1 && c.fl.includes('relocate')) watch.push('Few jobs, so you may need to move');
  if (c.gr != null && c.gr >= 8) why.push(`Much faster than average job growth (+${c.gr}% by 2035)`);
  if (c.gr != null && c.gr <= -3) watch.push(`Jobs are projected to shrink (${c.gr}% by 2035)`);
  return { why: why.slice(0, 5), watch: watch.slice(0, 5) };
}

/** Chooses the three focus options from the ranked standing careers. */
export function pickOptions(R) {
  const ranked = R.ranked; const A = ranked[0]; if (!A) return [];
  const ceil = c => c.t ?? c.p ?? 0;
  const up = c => (R.res[c.id].final ?? 0) + 30 * logn(ceil(c) * 1000, 80000, 500000) + 8 * c.own;
  const higher = ranked.slice(1, 7).filter(c => ceil(c) >= ceil(A) * 1.15 || c.own >= A.own + 0.3);
  let B = null, bl = '', bs = '';
  if (higher.length) {
    B = higher.sort((x, y) => up(y) - up(x))[0]; bl = 'Highest ceiling';
    bs = ceil(B) >= ceil(A) * 1.15 ? `More upside: top earners reach about $${ceil(B)}k.` : 'More room to build something of your own.';
  } else if (ranked[1]) { B = ranked[1]; bl = 'Runner-up'; bs = 'Your next strongest match.'; }
  const rest = ranked.slice(1).filter(c => c !== B);
  const C = rest.find(c => c.g !== A.g && (!B || c.g !== B.g)) || rest.find(c => c.g !== A.g) || rest[0];
  const cOut = C && C.g !== A.g;
  return [[A, 'Best overall fit', 'The career that matches the most of you.'], [B, bl, bs], [C, cOut ? 'A different direction' : 'Another strong option', cOut ? 'Your best match outside the field of your top pick.' : 'Your next best match.']].filter(x => x[0]);
}

export function hollandCode(U) { return U.riasec ? topIdx(U.riasec, 3).map(i => RIASEC[i].k).join('') : null; }
