#!/usr/bin/env node
/**
 * Builds data/careers.json from:
 *   - the O*NET 31.0 database (CSV tables, CC BY 4.0, downloaded on demand), and
 *   - BLS snapshots in data-src/bls/ (OEWS May 2025 wages, Employment Projections 2025-35).
 *
 * Usage:
 *   node scripts/build-data.mjs                # downloads O*NET tables into .cache/ if missing
 *   node scripts/build-data.mjs --onet <dir>   # use an existing folder of O*NET CSV tables
 *
 * Every derived score is documented inline. Scores are normalized to 0..1 unless noted.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRA_CAREERS } from './extra-careers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = name => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : null; };
const ONET_VERSION = '31.0';
const ONET_DIR = path.resolve(arg('onet') || path.join(ROOT, '.cache', `onet-${ONET_VERSION}`));
const BLS_DIR = path.join(ROOT, 'data-src', 'bls');
const OUT = path.join(ROOT, 'data', 'careers.json');
const TABLES = ['occupation_data', 'career_interest_types', 'job_zones', 'education', 'work_context', 'essential_skills', 'transferable_skills', 'knowledge', 'abilities', 'work_activities', 'work_styles', 'sample_of_reported_titles', 'related_occupations'];

/* ---------------- I/O ---------------- */
async function ensureOnet() {
  fs.mkdirSync(ONET_DIR, { recursive: true });
  for (const t of TABLES) {
    const file = path.join(ONET_DIR, t + '.csv');
    if (fs.existsSync(file) && fs.statSync(file).size > 0) continue;
    const url = `https://www.onetcenter.org/dl_files/database/db_${ONET_VERSION.replace('.', '_')}_csv/${t}.csv`;
    console.log('Downloading', url);
    const res = await fetch(url, { headers: { 'user-agent': 'career-elimination-exam-data-builder' } });
    if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
}
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const read = t => parseCSV(fs.readFileSync(path.join(ONET_DIR, t + '.csv'), 'utf8'));

/* ---------------- helpers ---------------- */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const r2 = x => Math.round(x * 100) / 100;
const avg = a => { const v = a.filter(x => x != null && !Number.isNaN(x)); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const nz = (x, d = 0) => (x == null || Number.isNaN(x) ? d : x);

/** Index rows as code -> "Element Name|Scale" -> value. */
function index(rows, { scales, normalize }) {
  const m = new Map();
  for (const r of rows) {
    const sc = r['Scale ID'];
    if (scales && !scales.includes(sc)) continue;
    if (r['Not Relevant'] === 'Y') continue;
    const code = r['O*NET-SOC Code'];
    const v = Number(r['Data Value']);
    if (Number.isNaN(v)) continue;
    if (!m.has(code)) m.set(code, new Map());
    m.get(code).set(r['Element Name'] + '|' + sc, normalize ? normalize(v, sc) : v);
  }
  return m;
}
const norm15 = v => (v - 1) / 4;          // IM / CX scales (1..5)
const normLV = v => v / 7;                // LV scale (0..7)
const normWI = v => (v + 3) / 6;          // Work Styles impact (-3..3)

/* ---------------- load O*NET ---------------- */
await ensureOnet();
console.log('Reading O*NET', ONET_VERSION, 'from', ONET_DIR);
const occRows = read('occupation_data');
const OCC = new Map(occRows.map(r => [r['O*NET-SOC Code'], { title: r.Title, desc: r.Description }]));

const INT = index(read('career_interest_types'), { scales: ['OI'], normalize: v => (v - 1) / 6 });
const JZ = new Map(read('job_zones').map(r => [r['O*NET-SOC Code'], Number(r['Job Zone'])]));
const SK = index([...read('essential_skills'), ...read('transferable_skills')], { scales: ['IM', 'LV'], normalize: (v, s) => (s === 'IM' ? norm15(v) : normLV(v)) });
const KN = index(read('knowledge'), { scales: ['IM'], normalize: norm15 });
const AB = index(read('abilities'), { scales: ['IM'], normalize: norm15 });
const WA = index(read('work_activities'), { scales: ['IM'], normalize: norm15 });
const WS = index(read('work_styles'), { scales: ['WI'], normalize: normWI });

// Work context: CX values (1..5 -> 0..1) plus category shares for two CT elements.
const WC = new Map(); const WCcat = new Map();
for (const r of read('work_context')) {
  const code = r['O*NET-SOC Code'], el = r['Element Name'], sc = r['Scale ID'], v = Number(r['Data Value']);
  if (Number.isNaN(v)) continue;
  if (sc === 'CX') { if (!WC.has(code)) WC.set(code, new Map()); WC.get(code).set(el, norm15(v)); }
  if (sc === 'CTP') { if (!WCcat.has(code)) WCcat.set(code, new Map()); WCcat.get(code).set(el + '#' + r.Category, v / 100); }
}
// Education: Required Level of Education category shares (1..12).
const EDU = new Map();
for (const r of read('education')) {
  if (r['Scale ID'] !== 'RL') continue;
  const code = r['O*NET-SOC Code'];
  if (!EDU.has(code)) EDU.set(code, []);
  EDU.get(code)[Number(r.Category)] = Number(r['Data Value']);
}
const TITLES = new Map();
for (const r of read('sample_of_reported_titles')) {
  const code = r['O*NET-SOC Code']; if (!TITLES.has(code)) TITLES.set(code, []);
  TITLES.get(code).push({ t: r['Reported Job Title'], y: r['Shown in My Next Move'] === 'Y' });
}
const REL = new Map();
for (const r of read('related_occupations')) {
  const code = r['O*NET-SOC Code']; if (!REL.has(code)) REL.set(code, []);
  REL.get(code).push({ id: r['Related O*NET-SOC Code'], tier: r['Relatedness Tier'], i: Number(r.Index) });
}

/* ---------------- load BLS ---------------- */
const ep = JSON.parse(fs.readFileSync(path.join(BLS_DIR, 'bls-ep-2025-35.json'), 'utf8'));
const oes = JSON.parse(fs.readFileSync(path.join(BLS_DIR, 'bls-oews-m2025.json'), 'utf8'));
const invert = m => Object.fromEntries(Object.entries(m).map(([k, v]) => [String(v), k]));
const EP_EDU = invert(ep.edu), EP_EXP = invert(ep.experience), EP_OJT = invert(ep.training);
const num = s => { if (s == null || s === '' || s === '*' || s === '#') return null; const x = Number(String(s).replace(/^>/, '')); return Number.isNaN(x) ? null : x; };
const EP = new Map(ep.rows.map(r => [r[0], { emp: num(r[1]), gr: num(r[2]), se: num(r[3]), op: num(r[4]), wage: num(r[5]), edu: EP_EDU[r[6]], exp: EP_EXP[r[7]], ojt: EP_OJT[r[8]] }]));
const OES = new Map(oes.rows.map(r => {
  const hourly = r[6] === 'TRUE';
  const med = num(r[1]) ?? (num(r[4]) != null ? num(r[4]) * 2080 : null);
  const p90 = num(r[2]) ?? (num(r[5]) != null ? num(r[5]) * 2080 : null);
  return [r[0], { med, p90, p10: num(r[3]), hourly }];
}));
/** O*NET detailed codes that BLS publishes only under a combined code. */
const SOC_CROSSWALK = { '21-1011': '21-1018', '21-1014': '21-1018', '25-2055': '25-2052', '25-2056': '25-2052', '25-9042': '25-9045', '25-9043': '25-9045', '51-2022': '51-2028', '51-2023': '51-2028', '53-1042': '53-1047', '53-1043': '53-1047', '53-1044': '53-1047' };
/** BLS sometimes publishes a broad code (e.g. 13-1020) for O*NET detailed codes (13-1022). */
function blsLookup(map, code) {
  const soc = code.slice(0, 7);
  return map.get(soc) || map.get(SOC_CROSSWALK[soc]) || map.get(soc.slice(0, 6) + '0') || map.get(soc.slice(0, 5) + '00') || null;
}

/* ---------------- occupations to include ---------------- */
const codes = [...OCC.keys()].filter(c => INT.has(c) && (SK.has(c) || WA.has(c)) && WC.has(c));
console.log(`O*NET occupations: ${OCC.size}; with interest, skill and context data: ${codes.length}`);

/* ---------------- percentile helper ---------------- */
function percentiles(values) {
  const sorted = values.map((v, i) => [v, i]).filter(x => x[0] != null).sort((a, b) => a[0] - b[0]);
  const out = new Array(values.length).fill(null);
  sorted.forEach(([, i], rank) => { out[i] = sorted.length > 1 ? rank / (sorted.length - 1) : 0.5; });
  return out;
}

/* ---------------- raw features per occupation ---------------- */
const g = (m, code, k) => (m.get(code) ? m.get(code).get(k) ?? null : null);
const sk = (code, name, sc = 'IM') => g(SK, code, `${name}|${sc}`);
const kn = (code, name) => g(KN, code, `${name}|IM`);
const ab = (code, name) => g(AB, code, `${name}|IM`);
const wa = (code, name) => g(WA, code, `${name}|IM`);
const ws = (code, name) => g(WS, code, `${name}|WI`);
const wc = (code, name) => g(WC, code, name);
const wcat = (code, name, cat) => g(WCcat, code, `${name}#${cat}`);
const titleOf = code => OCC.get(code).title;
const has = (code, re) => re.test(titleOf(code));
const major = code => code.slice(0, 2);

const RAW = codes.map(code => {
  const r = {};
  r.people = avg([wc(code, 'Contact With Others'), wc(code, 'Face-to-Face Discussions with Individuals and Within Teams'), wc(code, 'Deal With External Customers or the Public in General'), wa(code, 'Establishing and Maintaining Interpersonal Relationships'), wa(code, 'Assisting and Caring for Others'), wa(code, 'Communicating with People Outside the Organization')]);
  r.physical = avg([wa(code, 'Performing General Physical Activities'), wa(code, 'Handling and Moving Objects'), wc(code, 'Spend Time Standing'), wc(code, 'Spend Time Walking or Running'), wc(code, 'Spend Time Kneeling, Crouching, Stooping, or Crawling'), wc(code, 'Spend Time Bending or Twisting Your Body'), ab(code, 'Static Strength'), ab(code, 'Stamina')]);
  r.structure = avg([wc(code, 'Importance of Repeating Same Tasks'), wc(code, 'Importance of Being Exact or Accurate'), 1 - nz(wc(code, 'Freedom to Make Decisions'), 0.5), 1 - nz(wc(code, 'Determine Tasks, Priorities and Goals'), 0.5), 1 - nz(ws(code, 'Tolerance for Ambiguity'), 0.5)]);
  r.pace = avg([wc(code, 'Time Pressure'), wc(code, 'Frequency of Decision Making'), wc(code, 'Pace Determined by Speed of Equipment')]);
  r.stress = avg([ws(code, 'Stress Tolerance'), wc(code, 'Time Pressure'), wc(code, 'Consequence of Error'), wc(code, 'Conflict Situations'), wc(code, 'Dealing With Unpleasant, Angry, or Discourteous People')]);
  // AI exposure: information-processing work rises, physical and caring work falls.
  const info = avg([wa(code, 'Working with Computers'), wa(code, 'Processing Information'), wa(code, 'Documenting/Recording Information'), wa(code, 'Analyzing Data or Information'), wa(code, 'Getting Information'), sk(code, 'Writing')]);
  const hands = avg([wa(code, 'Performing General Physical Activities'), wa(code, 'Handling and Moving Objects'), wa(code, 'Repairing and Maintaining Mechanical Equipment'), wa(code, 'Operating Vehicles, Mechanized Devices, or Equipment')]);
  const care = avg([wa(code, 'Assisting and Caring for Others'), wc(code, 'Physical Proximity'), wa(code, 'Performing for or Working Directly with the Public')]);
  r.ai = 0.55 * nz(info) + 0.15 * nz(wc(code, 'Degree of Automation')) + 0.1 * nz(wc(code, 'Importance of Repeating Same Tasks')) - 0.3 * nz(hands) - 0.2 * nz(care);
  // Work-style based personality demands (raw; percentiles taken below).
  r.dO = avg([ws(code, 'Innovation'), ws(code, 'Intellectual Curiosity'), ws(code, 'Tolerance for Ambiguity')]);
  r.dC = avg([ws(code, 'Dependability'), ws(code, 'Attention to Detail'), ws(code, 'Perseverance'), ws(code, 'Cautiousness')]);
  r.dE = avg([ws(code, 'Social Orientation'), ws(code, 'Leadership Orientation'), ws(code, 'Self-Confidence'), r.people]);
  r.dA = avg([ws(code, 'Cooperation'), ws(code, 'Empathy'), ws(code, 'Humility')]);
  r.dS = avg([ws(code, 'Stress Tolerance'), ws(code, 'Self-Control'), ws(code, 'Adaptability'), r.stress]);
  return r;
});
const P = {};
for (const k of ['people', 'physical', 'structure', 'pace', 'stress', 'ai', 'dO', 'dC', 'dE', 'dA', 'dS']) P[k] = percentiles(RAW.map(x => x[k]));

/* ---------------- curated code lists for flags that O*NET does not measure ---------------- */
const prefix = (code, list) => list.some(p => code.startsWith(p));
const LICENSED = ['29-1', '29-2', '23-1011', '23-1012', '13-2011', '17-2', '47-2111', '47-2152', '49-9021', '25-2', '21-1011', '21-1012', '21-1013', '21-1014', '21-1015', '21-1018', '21-1019', '21-1021', '21-1022', '21-1023', '21-1029', '39-5', '41-9021', '41-9022', '41-3031', '53-2011', '53-2012', '13-2052', '33-3', '31-9011', '39-4031', '29-9', '47-2011', '53-5021', '17-1011', '17-1012', '17-1022', '19-3033', '19-3034'];
const COMMISSION = ['41-3011', '41-3021', '41-3031', '41-3091', '41-4011', '41-4012', '41-9021', '41-9022', '41-9041', '41-9091', '41-2031', '13-2052', '41-3041', '41-9031', '41-9011'];
const TRAVEL = ['53-2011', '53-2012', '53-2031', '53-3032', '41-4011', '41-4012', '41-9031', '13-1111', '13-1121', '27-2021', '27-2022', '27-2011', '27-2041', '27-2042', '53-5011', '53-5021', '53-5022', '53-5031', '45-3031', '47-5013', '47-5012', '27-3023', '19-2042', '33-3021', '27-4032'];
const NIGHT = ['29-1141', '29-1151', '29-1171', '29-2042', '29-2043', '29-2034', '29-2035', '29-2010', '31-1131', '31-1132', '31-1133', '31-1120', '33-1', '33-2', '33-3', '33-9032', '43-5031', '43-4081', '53-3032', '53-2011', '53-2012', '53-2021', '53-2031', '53-4', '39-9011', '29-2052', '29-1229', '29-1211', '29-1214', '29-1215', '29-1216', '29-1218', '29-1222', '29-1223', '29-1224', '29-124', '27-2011', '27-2042', '27-2041', '31-9096', '51-8', '35-2014', '35-3011'];
const TY_OVERRIDE = { '23-1011': 7, '23-1012': 2, '29-1051': 8, '29-1131': 8 };
const ONCALL = ['29-12', '29-1151', '29-1171', '29-2042', '29-2043', '49-9051', '49-9052', '47-2152', '49-9021', '29-1131', '39-4031', '21-1021', '21-2011', '15-1244', '15-1231', '15-1212', '33-2011', '33-1021', '47-2111', '53-2021'];
const RE = {
  kids: /child|preschool|kindergarten|elementary|middle school|nanny|teaching assistant|special education|pediatric|school psycholog|camp counselor|youth|juvenile|daycare|childcare/i,
  animals: /animal|veterinar|livestock|zoolog|wildlife|kennel|groomer|ranch|aquacultur|fish(?!ing vessel)|farmworkers, farm, ranch|poultry|dairy|horse|equine|dog/i,
  death: /funeral|mortician|embalm|coroner|hospice|oncolog|forensic|crime scene|chaplain|clergy|critical care|emergency medicine|trauma|crematory|medical examiner/i,
  trauma: /police|detective|correctional|firefight|paramedic|emergency medical|crisis|forensic|crime|bailiff|child, family|probation|security guard|fire inspector|dispatcher/i,
  politics: /legislat|political|lobby|campaign|elected/i,
  sports: /athlet|sport|coach|umpire|referee|fitness|recreation|exercise|trainer/i,
  env: /environment|conservation|forest|wildlife|recycl|energy|solar|wind turbine|hazardous|water|soil|climate|ecolog|sustainab|range manag|geoscien|hydrolog/i,
  space: /aero|astro|aircraft|aviation|pilot|flight|space|satellite|air traffic|avionics/i,
  food: /food|chef|cook|baker|bakers|agricult|farm|butcher|meat|dietitian|nutrition|brew|wine|crop|grain|bartender|dining|restaurant/i,
  cities: /urban|planner|architect|construction|civil|transportation|surveyor|building|real estate|property/i,
  lab: /laborator|technolog|chemist|biolog|microbiolog|biochem|scientist|lab |histotech|cytotech|phlebotom|pharmac/i,
  stage: /actor|dancer|musician|singer|music director|composer|choreograph|disc jockey|announcer|broadcast|camera operator|producer|director|entertainer|comedian|magician|model|athlete|umpire|referee|sound engineer|audio and video|lighting/i,
  gov: /government|federal|postal|legislat|judge|magistrate|tax examiner|court|police|correctional|firefight|transit|regulatory|compliance officer|eligibility interviewer|social science research|urban and regional|emergency management|fish and game|forest and conservation worker|park|census|election/i,
  nonprofit: /social work|community|counselor|clergy|religious|health education|nonprofit|fundraiser|advocate/i,
  acad: /postsecondary|professor|research|scientist|curator|archivist|historian|anthropolog|economist|sociolog|astronom|physicist/i,
};

/* ---------------- build records ---------------- */
const SKILL_KEYS = ['quant', 'analytic', 'code', 'science', 'writing', 'verbal', 'people', 'lead', 'detail', 'org', 'mech', 'spatial', 'art', 'perform', 'physical', 'lang', 'memory'];
const VALUE_KEYS = ['income', 'security', 'impact', 'creativity', 'autonomy', 'prestige', 'variety', 'balance', 'leadership', 'mastery', 'achievement', 'belonging', 'adventure'];
const EDU_FROM_EP = { 'No formal educational credential': 0, 'High school diploma or equivalent': 0, 'Some college, no degree': 1, 'Postsecondary nondegree award': 1, "Associate's degree": 2, "Bachelor's degree": 3, "Master's degree": 4, 'Doctoral or professional degree': 5 };
const REQ_YEARS = [0, 0.75, 2, 4, 6, 8];
const RL_TO_LEVEL = [null, 0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5];
const logn = (x, lo, hi) => clamp((Math.log(Math.max(x, 1)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)));

const stats = { noWage: 0, noEP: 0, wageFromEP: 0 };
const careers = codes.map((code, i) => {
  const o = OCC.get(code), raw = RAW[i], soc = code.slice(0, 7);
  const h = ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'].map(k => r2(nz(g(INT, code, k + '|OI'), 0)));
  const epr = blsLookup(EP, code), oer = blsLookup(OES, code);
  if (!epr) stats.noEP++;
  // Education level 0..5 (none, certificate, 2-year/apprenticeship, bachelor, master, doctorate/professional).
  let e;
  if (epr && epr.edu in EDU_FROM_EP) e = EDU_FROM_EP[epr.edu];
  else { const d = EDU.get(code) || []; let best = 2, bv = -1; d.forEach((v, cat) => { if (v != null && v > bv) { bv = v; best = cat; } }); e = RL_TO_LEVEL[best] ?? 2; }
  if (epr && epr.ojt === 'Apprenticeship') e = Math.max(e, 2);
  // Years of training after high school before full pay.
  let ty = REQ_YEARS[e];
  if (epr) {
    if (epr.ojt === 'Apprenticeship') ty = Math.max(ty, 4);
    else if (epr.ojt === 'Long-term on-the-job training') ty += 1;
    else if (epr.ojt === 'Internship/residency') ty = prefix(code, ['29-124']) ? 13 : prefix(code, ['29-12', '29-1229']) ? 11 : ty + 1.5;
    if (epr.exp === '5 years or more') ty += 5; else if (epr.exp === 'Less than 5 years') ty += 2;
  }
  if (TY_OVERRIDE[soc] != null) ty = TY_OVERRIDE[soc];
  // Pay in $k: OEWS median and 90th percentile, falling back to the projections table.
  let p = oer && oer.med != null ? oer.med : null, t = oer && oer.p90 != null ? oer.p90 : null;
  if (p == null && epr && epr.wage != null) { p = epr.wage; stats.wageFromEP++; }
  if (p == null) stats.noWage++;
  if (t == null && p != null) t = p * 1.75;
  const pk = p == null ? null : Math.round(p / 1000), tk = t == null ? null : Math.round(t / 1000);
  const gr = epr ? epr.gr : null, se = epr ? nz(epr.se, 0) : 0;

  // Continuous attributes (0..1).
  const hr = nz(wcat(code, 'Duration of Typical Work Week', 3), 0.2);   // share working 40+ hours
  const irregular = nz(wcat(code, 'Work Schedules', 2), 0) + nz(wcat(code, 'Work Schedules', 3), 0);
  const pp = P.people[i], ph = P.physical[i], sx = P.structure[i], pc = P.pace[i], st = P.stress[i], ai = P.ai[i];
  const computers = nz(wa(code, 'Working with Computers'));
  const remoteBlocks = [wc(code, 'Outdoors, Exposed to All Weather Conditions') >= 0.75, wc(code, 'Dealing with Violent or Physically Aggressive People') >= 0.5, wc(code, 'Wear Common Protective or Safety Equipment such as Safety Shoes, Glasses, Gloves, Hearing Protection, Hard Hats, or Life Jackets') >= 0.75, wc(code, 'Spend Time Walking or Running') >= 0.5, wc(code, 'Exposed to Disease or Infections') >= 0.75, wa(code, 'Performing General Physical Activities') >= 0.75, wa(code, 'Handling and Moving Objects') >= 0.75, wa(code, 'Controlling Machines and Processes') >= 0.75, wa(code, 'Operating Vehicles, Mechanized Devices, or Equipment') >= 0.75, wa(code, 'Performing for or Working Directly with the Public') >= 0.75, wa(code, 'Repairing and Maintaining Mechanical Equipment') >= 0.75, wa(code, 'Assisting and Caring for Others') >= 0.75, wc(code, 'Physical Proximity') >= 0.75].filter(Boolean).length;
  const rm = r2(clamp([1, 0.5, 0.25, 0.1][Math.min(3, remoteBlocks)] * (0.35 + 0.65 * computers)));
  const sell = nz(wa(code, 'Selling or Influencing Others'));
  const rk = r2(clamp(0.6 * clamp(se / 60) + 0.15 * nz(wc(code, 'Level of Competition')) + 0.1 * irregular + 0.15 * sell * (prefix(code, COMMISSION) ? 1 : 0.3) + (major(code) === '27' ? 0.15 : 0)));

  // Settings.
  const set = new Set();
  if (nz(wc(code, 'Outdoors, Exposed to All Weather Conditions')) >= 0.6 || nz(wc(code, 'Outdoors, Under Cover')) >= 0.6) set.add('x');
  if (['29', '31'].includes(major(code)) || (major(code) === '19' && has(code, RE.lab)) || has(code, RE.lab) && major(code) !== '15') set.add('l');
  if (major(code) === '25') set.add('k');
  if (['21', '33'].includes(major(code))) set.add('f');
  if (has(code, RE.stage) && ['27'].includes(major(code))) set.add('s');
  if (nz(wc(code, 'In an Enclosed Vehicle or Operate Enclosed Equipment')) >= 0.75 || nz(wc(code, 'In an Open Vehicle or Operating Equipment')) >= 0.75 || prefix(code, TRAVEL)) set.add('r');
  if (nz(wc(code, 'Indoors, Not Environmentally Controlled')) >= 0.6 || ['47', '49', '51'].includes(major(code))) set.add('w');
  if (rm >= 0.55) set.add('h');
  if (major(code) === '35' || major(code) === '37') set.add('w');
  if (nz(wc(code, 'Indoors, Environmentally Controlled')) >= 0.6 && nz(wc(code, 'Spend Time Sitting')) >= 0.4 && !set.has('l') && !set.has('k') && !set.has('w')) set.add('o');
  if (!set.size) set.add(ph >= 0.5 ? 'w' : 'o');

  // Dealbreaker flags.
  const fl = new Set();
  const disease = nz(wc(code, 'Exposed to Disease or Infections'));
  if ((disease >= 0.75 && (['29', '31'].includes(major(code)) || nz(wa(code, 'Assisting and Caring for Others')) >= 0.6)) || /phlebotom|surgeon|surgical|dental|nurse|embalm|mortician|medical (and clinical )?laboratory|histotech/i.test(o.title)) fl.add('blood');
  if (has(code, RE.death) || prefix(code, ['29-12', '29-2042', '29-2043', '39-4'])) fl.add('death');
  if (nz(wc(code, 'Dealing with Violent or Physically Aggressive People')) >= 0.5 || has(code, RE.trauma)) fl.add('trauma');
  if (sell >= 0.75 || major(code) === '41' && sell >= 0.6) fl.add('sales');
  if (prefix(code, COMMISSION)) fl.add('commission');
  if (nz(wc(code, 'Public Speaking')) >= 0.6) fl.add('speak');
  if (prefix(code, NIGHT) || irregular >= 0.55) fl.add('night');
  if (prefix(code, ONCALL)) fl.add('oncall');
  if (prefix(code, TRAVEL)) fl.add('travel');
  if (nz(wc(code, 'Exposed to Hazardous Conditions')) >= 0.6 || nz(wc(code, 'Exposed to Hazardous Equipment')) >= 0.75 || ['33-1', '33-2', '33-3', '55-'].some(x => code.startsWith(x))) fl.add('danger');
  if (hr >= 0.6) fl.add('long');
  if (has(code, RE.kids)) fl.add('kids');
  if (has(code, RE.animals)) fl.add('animals');
  if (nz(wc(code, 'Outdoors, Exposed to All Weather Conditions')) >= 0.75) fl.add('weather');
  if (nz(wc(code, 'Conflict Situations')) >= 0.6 || nz(wc(code, 'Dealing With Unpleasant, Angry, or Discourteous People')) >= 0.75) fl.add('conflict');
  if (['33', '55'].includes(major(code)) || code.startsWith('53-2031')) fl.add('uniform');
  if (has(code, RE.lab) && major(code) !== '15' || (major(code) === '19' && Math.max(nz(kn(code, 'Chemistry')), nz(kn(code, 'Biology'))) >= 0.7)) fl.add('lab');
  if (nz(sk(code, 'Mathematics', 'LV')) >= 0.6 || nz(kn(code, 'Mathematics')) >= 0.8) fl.add('math');
  if (nz(sk(code, 'Programming')) >= 0.6) fl.add('code');
  if (nz(sk(code, 'Writing')) >= 0.75 && nz(wa(code, 'Documenting/Recording Information')) >= 0.7) fl.add('writing');
  if (nz(wc(code, 'Spend Time Sitting')) >= 0.75 && computers >= 0.5 && !set.has('r')) fl.add('desk');
  if (nz(wc(code, 'Deal With External Customers or the Public in General')) >= 0.85 && nz(wa(code, 'Performing for or Working Directly with the Public')) >= 0.75 && !['21', '25', '29', '31'].includes(major(code))) fl.add('customer');
  if (nz(wc(code, 'Exposed to Contaminants')) >= 0.75) fl.add('dirty');
  if (nz(wc(code, 'Exposed to High Places')) >= 0.5 || nz(wc(code, 'Exposed to Cramped Work Space, Awkward Positions')) >= 0.6 || nz(wc(code, 'Spend Time Climbing Ladders, Scaffolds, or Poles')) >= 0.5) fl.add('heights');
  if (nz(ab(code, 'Static Strength')) >= 0.6 || nz(wa(code, 'Handling and Moving Objects')) >= 0.75) fl.add('lifting');
  if (prefix(code, LICENSED)) fl.add('license');
  if (has(code, RE.politics)) fl.add('politics');
  if (epr && epr.emp != null && epr.emp < 8) fl.add('relocate');

  // Skill importance vector (0..1) in SKILL_KEYS order.
  const fine = nz(kn(code, 'Fine Arts')), pub = nz(wa(code, 'Performing for or Working Directly with the Public'));
  const sv = [
    avg([sk(code, 'Mathematics'), kn(code, 'Mathematics')]),
    avg([sk(code, 'Critical Thinking'), sk(code, 'Complex Problem Solving'), sk(code, 'Systems Analysis')]),
    Math.max(nz(sk(code, 'Programming')), 0.6 * nz(kn(code, 'Computers and Electronics'))),
    Math.max(nz(sk(code, 'Science')), nz(kn(code, 'Biology')), nz(kn(code, 'Chemistry')), nz(kn(code, 'Physics'))),
    sk(code, 'Writing'),
    avg([sk(code, 'Speaking'), sk(code, 'Persuasion')]),
    avg([sk(code, 'Social Perceptiveness'), sk(code, 'Service Orientation')]),
    avg([sk(code, 'Management of Personnel Resources'), sk(code, 'Coordination'), ws(code, 'Leadership Orientation')]),
    avg([ws(code, 'Attention to Detail'), wc(code, 'Importance of Being Exact or Accurate'), sk(code, 'Quality Control Analysis')]),
    avg([sk(code, 'Time Management'), sk(code, 'Management of Material Resources'), wa(code, 'Organizing, Planning, and Prioritizing Work')]),
    Math.max(nz(sk(code, 'Repairing')), nz(sk(code, 'Equipment Maintenance')), nz(sk(code, 'Troubleshooting')), nz(sk(code, 'Operation and Control')), nz(sk(code, 'Installation'))),
    avg([ab(code, 'Visualization'), ab(code, 'Spatial Orientation')]),
    Math.max(fine, 0.6 * nz(wa(code, 'Thinking Creatively')) * nz(h[2])),
    major(code) === '27' ? Math.max(fine * pub, has(code, RE.stage) ? 0.7 : 0) : fine * pub * 0.6,
    avg([ab(code, 'Stamina'), ab(code, 'Static Strength'), ab(code, 'Dynamic Strength'), ab(code, 'Gross Body Coordination')]),
    nz(kn(code, 'Foreign Language')),
    nz(ab(code, 'Memorization')),
  ].map(x => r2(clamp(nz(x))));
  const skTop = SKILL_KEYS.map((k, j) => [k, sv[j]]).sort((a, b) => b[1] - a[1]).filter(x => x[1] >= 0.35).slice(0, 4).map(x => x[0]);

  // Value provision (0..1) in VALUE_KEYS order.
  const income = clamp(0.8 * logn(nz(p, 40000), 30000, 200000) + 0.2 * logn(nz(t, 60000), 50000, 350000));
  const growth01 = clamp((nz(gr, 3) + 10) / 30);
  const assist = nz(wa(code, 'Assisting and Caring for Others'));
  const flagNightOncall = fl.has('night') || fl.has('oncall');
  const vals = {
    income,
    security: clamp(0.4 * (1 - rk) + 0.25 * growth01 + 0.2 * (1 - ai) + 0.15 * logn(nz(epr && epr.emp, 50), 5, 1500)),
    impact: clamp(0.45 * h[3] + 0.35 * assist + 0.2 * Math.max(nz(kn(code, 'Therapy and Counseling')), nz(kn(code, 'Medicine and Dentistry')), nz(kn(code, 'Education and Training')), nz(kn(code, 'Public Safety and Security')) * 0.8)),
    creativity: clamp(0.5 * h[2] + 0.35 * nz(wa(code, 'Thinking Creatively')) + 0.15 * nz(ab(code, 'Originality'))),
    autonomy: clamp(0.35 * nz(wc(code, 'Freedom to Make Decisions')) + 0.25 * nz(wc(code, 'Determine Tasks, Priorities and Goals')) + 0.2 * clamp(se / 50) + 0.2 * rm),
    prestige: clamp(0.4 * income + 0.35 * e / 5 + 0.25 * nz(wc(code, 'Impact of Decisions on Co-workers or Company Results'))),
    variety: clamp(0.45 * (1 - nz(wc(code, 'Importance of Repeating Same Tasks'), 0.5)) + 0.25 * nz(ws(code, 'Adaptability'), 0.5) + 0.3 * (1 - sx)),
    balance: clamp(0.5 * (1 - hr) + 0.3 * (1 - st) + 0.2 * (flagNightOncall ? 0 : 1)),
    leadership: clamp(0.4 * nz(wc(code, 'Coordinate or Lead Others in Accomplishing Work Activities')) + 0.3 * nz(sk(code, 'Management of Personnel Resources')) + 0.3 * h[4]),
    mastery: clamp(0.35 * e / 5 + 0.2 * nz(sk(code, 'Active Learning')) + 0.25 * h[1] + 0.2 * (nz(JZ.get(code), 3) - 1) / 4),
    achievement: clamp(0.4 * nz(ws(code, 'Achievement Orientation'), 0.5) + 0.3 * h[4] + 0.3 * nz(wc(code, 'Level of Competition'))),
    belonging: clamp(0.6 * nz(wc(code, 'Work With or Contribute to a Work Group or Team')) + 0.4 * nz(ws(code, 'Cooperation'), 0.5)),
    adventure: clamp(0.3 * (set.has('x') || set.has('r') ? 1 : 0) + 0.25 * (fl.has('danger') ? 1 : 0) + 0.25 * (fl.has('travel') ? 1 : 0) + 0.2 * pc),
  };
  const v = VALUE_KEYS.map(k => r2(vals[k]));

  // Causes.
  const cz = new Set();
  if (['29', '31'].includes(major(code)) || nz(kn(code, 'Medicine and Dentistry')) >= 0.55) cz.add('health');
  if (major(code) === '25' || nz(kn(code, 'Education and Training')) >= 0.7) cz.add('edu');
  if (has(code, RE.env)) cz.add('env');
  if (['15'].includes(major(code)) || nz(kn(code, 'Computers and Electronics')) >= 0.7 || nz(kn(code, 'Engineering and Technology')) >= 0.7) cz.add('tech');
  if (major(code) === '13' && nz(kn(code, 'Economics and Accounting')) >= 0.5 || nz(kn(code, 'Economics and Accounting')) >= 0.7) cz.add('money');
  if (major(code) === '23' || nz(kn(code, 'Law and Government')) >= 0.7) cz.add('justice');
  if (major(code) === '27' || fine >= 0.5) cz.add('arts');
  if (major(code) === '21' || nz(kn(code, 'Therapy and Counseling')) >= 0.6 || nz(kn(code, 'Sociology and Anthropology')) >= 0.6) cz.add('community');
  if (major(code) === '19' || Math.max(nz(kn(code, 'Physics')), nz(kn(code, 'Chemistry')), nz(kn(code, 'Biology'))) >= 0.75) cz.add('science');
  if (fl.has('animals')) cz.add('animals');
  if (has(code, RE.sports)) cz.add('sports');
  if (['35', '45'].includes(major(code)) || nz(kn(code, 'Food Production')) >= 0.5 || has(code, RE.food)) cz.add('food');
  if (['47'].includes(major(code)) || has(code, RE.cities) || nz(kn(code, 'Building and Construction')) >= 0.65) cz.add('cities');
  if (['33', '55'].includes(major(code)) || nz(kn(code, 'Public Safety and Security')) >= 0.75) cz.add('defense');
  if (has(code, RE.space)) cz.add('space');

  // Employer types.
  const emp = new Set();
  if (se >= 20) emp.add('self');
  if (has(code, RE.gov) || major(code) === '33') emp.add('gov');
  if (major(code) === '55') emp.add('mil');
  if (major(code) === '25' || ['29', '31'].includes(major(code))) emp.add('inst');
  if (code.startsWith('25-1') || (major(code) === '19' && has(code, RE.acad))) emp.add('acad');
  if (major(code) === '21' || has(code, RE.nonprofit)) emp.add('nonprofit');
  if (['15', '13', '17'].includes(major(code)) && nz(gr, 0) >= 4) emp.add('startup');
  if (major(code) === '27' && se >= 10) emp.add('free');
  if (!['55'].includes(major(code)) && (emp.size === 0 || !['25', '33'].includes(major(code)))) emp.add('corp');

  // Focus: data, ideas, people, things.
  const fo = Object.entries({
    d: avg([wa(code, 'Processing Information'), wa(code, 'Analyzing Data or Information'), wa(code, 'Documenting/Recording Information'), wa(code, 'Working with Computers')]),
    i: avg([wa(code, 'Thinking Creatively'), wa(code, 'Developing Objectives and Strategies'), wa(code, 'Updating and Using Relevant Knowledge'), wa(code, 'Making Decisions and Solving Problems')]),
    p: avg([wa(code, 'Assisting and Caring for Others'), wa(code, 'Communicating with People Outside the Organization'), wa(code, 'Establishing and Maintaining Interpersonal Relationships'), wa(code, 'Training and Teaching Others')]),
    t: avg([wa(code, 'Handling and Moving Objects'), wa(code, 'Controlling Machines and Processes'), wa(code, 'Repairing and Maintaining Mechanical Equipment'), wa(code, 'Operating Vehicles, Mechanized Devices, or Equipment')]),
  }).sort((a, b) => nz(b[1]) - nz(a[1])).slice(0, 2).map(x => x[0]).join('');

  // Energy-audit activities present in the work.
  const acts = [];
  const A = (k, cond) => { if (cond) acts.push(k); };
  A('debate', (nz(sk(code, 'Persuasion')) >= 0.7 && nz(sk(code, 'Negotiation')) >= 0.6) || nz(kn(code, 'Law and Government')) >= 0.75);
  A('fix', nz(sk(code, 'Repairing')) >= 0.5 || nz(sk(code, 'Troubleshooting')) >= 0.6);
  A('beauty', fine >= 0.5 || (nz(wa(code, 'Thinking Creatively')) >= 0.7 && h[2] >= 0.6));
  A('teach', nz(wa(code, 'Training and Teaching Others')) >= 0.75 || nz(sk(code, 'Instructing')) >= 0.7);
  A('organize', nz(wa(code, 'Organizing, Planning, and Prioritizing Work')) >= 0.75 && h[5] >= 0.5 || nz(sk(code, 'Time Management')) >= 0.7);
  A('numbers', nz(sk(code, 'Mathematics')) >= 0.6);
  A('write', nz(sk(code, 'Writing')) >= 0.7);
  A('perform', sv[13] >= 0.5 || nz(wc(code, 'Public Speaking')) >= 0.7);
  A('build', nz(wa(code, 'Handling and Moving Objects')) >= 0.6 && h[0] >= 0.6);
  A('research', nz(sk(code, 'Science')) >= 0.6 || (nz(wa(code, 'Analyzing Data or Information')) >= 0.7 && h[1] >= 0.6));
  A('comfort', assist >= 0.75 && nz(sk(code, 'Social Perceptiveness')) >= 0.65);
  A('persuade', sell >= 0.7);
  A('strategy', nz(wa(code, 'Developing Objectives and Strategies')) >= 0.7);
  A('code', nz(sk(code, 'Programming')) >= 0.5);
  A('outdoors', set.has('x'));
  A('rally', nz(sk(code, 'Management of Personnel Resources')) >= 0.65 || nz(wa(code, 'Guiding, Directing, and Motivating Subordinates')) >= 0.75);

  // Personality demands as percentiles mapped to 0.1..0.9.
  const sp = x => r2(0.1 + 0.8 * nz(x, 0.5));
  const b5 = [sp(avg([P.dO[i], (h[1] + h[2]) / 2])), sp(avg([P.dC[i], sx])), sp(P.dE[i]), sp(P.dA[i]), sp(P.dS[i])];

  const titles = (TITLES.get(code) || []).sort((a, b) => Number(b.y) - Number(a.y)).map(x => x.t).filter(x => x.toLowerCase() !== o.title.toLowerCase()).slice(0, 5);
  const rel = (REL.get(code) || []).sort((a, b) => a.i - b.i).map(x => x.id).slice(0, 8);
  const own = clamp(se / 60);

  return {
    id: code, n: o.title, d: o.desc.length > 420 ? o.desc.slice(0, o.desc.lastIndexOf(' ', 417)) + '…' : o.desc,
    g: major(code), h, e, ty: r2(ty), p: pk, t: tk, gr, se: r2(se), em: epr ? epr.emp : null, op: epr ? epr.op : null,
    ai: r2(ai), rk, hr: r2(hr), st: r2(st), ph: r2(ph), pp: r2(pp), rm, sx: r2(sx), pc: r2(pc),
    set: [...set].join(''), fl: [...fl], sv, sk: skTop, v, cz: [...cz], emp: [...emp], fo, acts, b5, own: r2(own),
    alt: titles, rel, jz: JZ.get(code) ?? null,
  };
});

/* ---------------- curated non-standard paths ---------------- */
for (const x of EXTRA_CAREERS) careers.push(x);
const ids = new Set(careers.map(c => c.id));
for (const c of careers) c.rel = c.rel.filter(r => ids.has(r));

/* ---------------- validate + write ---------------- */
const problems = [];
for (const c of careers) {
  if (c.h.length !== 6 || c.sv.length !== 17 || c.v.length !== 13 || c.b5.length !== 5) problems.push(`${c.id}: bad vector length`);
  for (const k of ['ai', 'rk', 'hr', 'st', 'ph', 'pp', 'rm', 'sx', 'pc']) if (!(c[k] >= 0 && c[k] <= 1)) problems.push(`${c.id}: ${k}=${c[k]}`);
  if (!(c.e >= 0 && c.e <= 5)) problems.push(`${c.id}: e=${c.e}`);
}
if (problems.length) { console.error(problems.slice(0, 20).join('\n')); process.exit(1); }
const meta = {
  generated: new Date().toISOString().slice(0, 10),
  count: careers.length,
  sources: [
    { name: `O*NET ${ONET_VERSION} Database`, by: 'U.S. Department of Labor, Employment and Training Administration (USDOL/ETA)', license: 'CC BY 4.0', url: 'https://www.onetcenter.org/database.html' },
    { name: ep.source, by: 'U.S. Bureau of Labor Statistics', license: 'Public domain', url: ep.url },
    { name: oes.source, by: 'U.S. Bureau of Labor Statistics', license: 'Public domain', url: oes.url },
  ],
  fields: { h: 'RIASEC interest profile 0..1', e: 'education level 0..5', ty: 'years of training after high school', p: 'median pay $k', t: '90th percentile pay $k', gr: 'projected employment change % 2025-35', se: '% self-employed', ai: 'estimated AI/automation exposure percentile', sv: 'skill importance vector', v: 'value provision vector', b5: 'personality demand O,C,E,A,S' },
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ meta, careers }));
const size = fs.statSync(OUT).size;
console.log(`Wrote ${careers.length} careers to ${path.relative(ROOT, OUT)} (${(size / 1024).toFixed(0)} KB).`);
console.log(`No BLS projections match: ${stats.noEP}; wages from projections table: ${stats.wageFromEP}; no wage: ${stats.noWage}.`);
