/*
 * Refreshing the BLS snapshots in data-src/bls/
 *
 * BLS blocks scripted downloads, so these two snapshots are captured in a normal browser.
 * 1. Open https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm
 * 2. Open the browser devtools console, paste this whole file and press Enter.
 * 3. Two JSON files download: bls-ep-*.json and bls-oews-*.json. Move them into data-src/bls/
 *    (keep the file names the build script expects, or update the paths in build-data.mjs).
 * 4. Run: npm run build:data
 * Update OEWS_YEAR when a newer May release exists (oesm<YY>nat.zip).
 */
(async () => {
  const OEWS_YEAR = '25';
  const td = new TextDecoder();
  const save = (name, obj) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: 'application/json' })); a.download = name; a.click(); };
  const rows = [...document.querySelector('table tbody').querySelectorAll('tr')].map(r => [...r.children].map(c => c.innerText.trim()));
  const det = rows.filter(r => r[2] === 'Line item');
  const EDU = {}, EXP = {}, OJT = {}; const code = (m, v) => { if (!(v in m)) m[v] = Object.keys(m).length; return m[v]; };
  const num = s => { const x = s.replace(/[,$]/g, ''); if (/^>=/.test(x)) return '>' + x.slice(2); return /^-?[\d.]+$/.test(x) ? x : ''; };
  const epRows = det.map(r => [r[1], num(r[3]), num(r[8]), num(r[9]), num(r[10]), num(r[11]), String(code(EDU, r[12])), String(code(EXP, r[13])), String(code(OJT, r[14]))]);
  save('bls-ep-2025-35.json', { source: document.querySelector('caption').innerText.trim(), url: location.href, fields: ['soc', 'emp_thousands', 'pct_change', 'pct_self_employed', 'annual_openings_thousands', 'median_wage', 'edu', 'experience', 'training'], edu: EDU, experience: EXP, training: OJT, rows: epRows });
  function zip(buf) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let eocd = -1; for (let i = buf.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    const cnt = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true); const files = {};
    for (let k = 0; k < cnt; k++) { const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), loff = dv.getUint32(p + 42, true); files[td.decode(buf.subarray(p + 46, p + 46 + nlen))] = { method, csize, loff }; p += 46 + nlen + xlen + clen; }
    return { names: Object.keys(files), async bytes(name) { const f = files[name], l = f.loff, n = dv.getUint16(l + 26, true), x = dv.getUint16(l + 28, true); const data = buf.subarray(l + 30 + n + x, l + 30 + n + x + f.csize); if (f.method === 0) return data; return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); } };
  }
  const outer = zip(new Uint8Array(await (await fetch(`/oes/special-requests/oesm${OEWS_YEAR}nat.zip`)).arrayBuffer()));
  const xl = zip(await outer.bytes(outer.names.find(n => /\.xlsx$/i.test(n))));
  const ss = td.decode(await xl.bytes('xl/sharedStrings.xml'));
  const strings = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => [...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(x => x[1]).join('').replace(/&amp;/g, '&'));
  const sheet = td.decode(await xl.bytes('xl/worksheets/sheet1.xml'));
  const col = ref => { let n = 0; for (const ch of ref) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const xr = [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(m => { const r = []; for (const c of m[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) { const t = (c[2].match(/t="(\w+)"/) || [])[1]; const v = c[3] ? ((c[3].match(/<v>([^<]*)<\/v>/) || [])[1] ?? (c[3].match(/<t[^>]*>([^<]*)<\/t>/) || [])[1]) : ''; r[col(c[1])] = t === 's' ? strings[+v] : v; } return r; });
  const H = xr[0], ix = k => H.indexOf(k);
  const oesRows = xr.slice(1).filter(r => r[ix('O_GROUP')] === 'detailed').map(r => ['OCC_CODE', 'A_MEDIAN', 'A_PCT90', 'A_PCT10', 'H_MEDIAN', 'H_PCT90', 'HOURLY'].map(k => String(r[ix(k)] ?? '')));
  save(`bls-oews-m20${OEWS_YEAR}.json`, { source: `BLS OEWS May 20${OEWS_YEAR} national estimates`, url: `https://www.bls.gov/oes/special-requests/oesm${OEWS_YEAR}nat.zip`, fields: ['soc', 'a_median', 'a_pct90', 'a_pct10', 'h_median', 'h_pct90', 'hourly_only'], rows: oesRows });
  console.log(`Saved ${epRows.length} projection rows and ${oesRows.length} wage rows.`);
})();
