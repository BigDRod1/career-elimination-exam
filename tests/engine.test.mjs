import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { prepareCareers, computeAll, userModel, scoreCareer, bracket, duelBonus, pickOptions } from '../assets/engine.js';
import { PARTS, QMAP, sampleAnswers } from '../assets/catalog.js';

const careers = prepareCareers(JSON.parse(fs.readFileSync(new URL('../data/careers.json', import.meta.url), 'utf8')).careers);
const run = (a, extra = {}) => computeAll(careers, { a, marks: {}, stars: {}, over: {}, duel: null, ...extra });

test('exam definition is consistent', () => {
  assert.equal(PARTS.length, 11);
  const keys = PARTS.flatMap(p => (p.qs || []).map(q => q.k));
  assert.equal(new Set(keys).size, keys.length, 'question keys are unique');
  const a = sampleAnswers();
  for (const k of Object.keys(QMAP)) assert.ok(a[k] != null, `example answers cover ${k}`);
});

test('no answers means nothing is crossed off and no fit is shown', () => {
  const R = run({});
  assert.equal(R.funnel.standing, careers.length);
  assert.equal(R.nComp, 0);
  assert.ok(careers.every(c => R.res[c.id].fit == null));
});

test('example answers narrow the field to a sensible shortlist', () => {
  const R = run(sampleAnswers());
  const f = R.funnel;
  assert.equal(f.hard + f.soft + f.you + f.standing, f.total);
  assert.ok(f.standing >= 15 && f.standing <= 60, `standing=${f.standing}`);
  const top = R.ranked.slice(0, 10).map(c => c.g);
  assert.ok(top.filter(g => ['29', '21', '25', '31', '19'].includes(g)).length >= 6, `top groups ${top}`);
});

test('a dealbreaker crosses off every career that involves it', () => {
  const R = run({ 'd.flags': ['code', 'blood'] });
  for (const c of careers) if (c.fl.includes('code') || c.fl.includes('blood')) assert.equal(R.res[c.id].status, 'x', c.n);
});

test('education ceiling and income floor are enforced', () => {
  const R = run({ 'ctx.edu': '0', 'd.edu': '0', 'd.income': '90' });
  for (const c of R.ranked) {
    assert.ok(c.e === 0, `${c.n} needs level ${c.e}`);
    assert.ok(c.t == null || c.t >= 90, `${c.n} top pay ${c.t}`);
  }
});

test('manual marks, stars and overrides behave', () => {
  const a = { 'd.flags': ['code'] };
  const dev = careers.find(c => c.id === '15-1252.00');
  assert.equal(run(a).res[dev.id].status, 'x');
  assert.equal(run(a, { over: { [dev.id]: true } }).res[dev.id].status, 'in');
  const nurse = careers.find(c => c.id === '29-1141.00');
  assert.equal(run({}, { marks: { [nurse.id]: 'x' } }).res[nurse.id].stage, 'you');
});

test('showdown bracket and bonuses', () => {
  const seeds = careers.slice(0, 8).map(c => c.id);
  const d = { seeds, picks: [] };
  assert.equal(bracket(d).length, 7);
  let M = bracket(d);
  for (let i = 0; i < 7; i++) { M = bracket(d); d.picks[i] = M[i].a; }
  const bonus = duelBonus(d);
  assert.equal(bonus[d.picks[6]], 10);
  assert.equal(Object.values(bonus).filter(v => v === 3).length, 2);
});

test('focus options are distinct careers from the shortlist', () => {
  const R = run(sampleAnswers());
  const opts = pickOptions(R).map(o => o[0]);
  assert.equal(opts.length, 3);
  assert.equal(new Set(opts.map(c => c.id)).size, 3);
  for (const c of opts) assert.equal(R.res[c.id].status, 'in');
});

test('re-scoring all careers is fast enough to run on every answer', () => {
  const a = sampleAnswers(); run(a);
  const t = performance.now(); for (let i = 0; i < 5; i++) run(a);
  const ms = (performance.now() - t) / 5;
  assert.ok(ms < 150, `computeAll took ${ms.toFixed(1)} ms`);
});

test('scores stay within bounds', () => {
  const U = userModel(sampleAnswers());
  for (const c of careers) { const r = scoreCareer(c, U); assert.ok(r.fit >= 0 && r.fit <= 100); for (const v of Object.values(r.comp)) assert.ok(v >= 0 && v <= 1); }
});
