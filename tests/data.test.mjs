import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GROUPS, FLAG_LABEL, SKILL_KEYS, VALUE_KEYS } from '../assets/catalog.js';

const { meta, careers } = JSON.parse(fs.readFileSync(new URL('../data/careers.json', import.meta.url), 'utf8'));

test('dataset covers the full O*NET occupation list', () => {
  assert.ok(careers.length >= 900, `expected 900+ careers, got ${careers.length}`);
  assert.equal(meta.count, careers.length);
  assert.ok(meta.sources.some(s => /O\*NET/.test(s.name) && s.license === 'CC BY 4.0'), 'O*NET source and license recorded');
});

test('ids are unique and groups are known', () => {
  const ids = new Set();
  for (const c of careers) {
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`); ids.add(c.id);
    assert.ok(GROUPS[c.g], `${c.id} has unknown group ${c.g}`);
  }
  for (const c of careers) for (const r of c.rel) assert.ok(ids.has(r), `${c.id} links to missing ${r}`);
});

test('every record has well-formed vectors and ranges', () => {
  for (const c of careers) {
    assert.equal(c.h.length, 6, c.id); assert.equal(c.sv.length, SKILL_KEYS.length, c.id);
    assert.equal(c.v.length, VALUE_KEYS.length, c.id); assert.equal(c.b5.length, 5, c.id);
    for (const k of ['ai', 'rk', 'hr', 'st', 'ph', 'pp', 'rm', 'sx', 'pc']) assert.ok(c[k] >= 0 && c[k] <= 1, `${c.id}.${k}=${c[k]}`);
    for (const x of [...c.h, ...c.sv, ...c.v, ...c.b5]) assert.ok(x >= 0 && x <= 1, `${c.id} vector value ${x}`);
    assert.ok(Number.isInteger(c.e) && c.e >= 0 && c.e <= 5, `${c.id}.e`);
    assert.ok(c.ty >= 0 && c.ty <= 20, `${c.id}.ty`);
    for (const f of c.fl) assert.ok(FLAG_LABEL[f], `${c.id} unknown flag ${f}`);
    assert.ok(c.n && c.d && c.set.length > 0, `${c.id} text fields`);
  }
});

test('pay data is present for nearly every occupation', () => {
  const missing = careers.filter(c => c.p == null);
  assert.ok(missing.length <= 5, `missing pay for ${missing.map(c => c.n).join(', ')}`);
  for (const c of careers) if (c.p != null && c.t != null) assert.ok(c.t >= c.p, `${c.id}: top pay below median`);
});

test('well-known occupations look right', () => {
  const get = id => careers.find(c => c.id === id);
  const dev = get('15-1252.00'), rn = get('29-1141.00'), elec = get('47-2111.00');
  assert.ok(dev.fl.includes('code') && dev.rm > 0.6 && dev.e === 3);
  assert.ok(rn.fl.includes('blood') && rn.cz.includes('health'));
  assert.ok(elec.fl.includes('danger') && elec.e === 2 && elec.h[0] > 0.7);
});
