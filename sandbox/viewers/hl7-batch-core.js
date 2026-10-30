/* HL7 v2 batch core: split, index, field paths, filters, stats, diff, CSV/PDF. Shared by the page and the worker. No network. */
(function(G){
'use strict';
function split(text){ const t = String(text || '').replace(/[\x0b\x1c]/g, '\r').replace(/\r\n|\n/g, '\r'); const out = []; let cur = null;
  for (const raw of t.split('\r')){ const seg = raw.replace(/^\s+/, ''); if (!seg) continue; const id = seg.slice(0, 3);
    if (id === 'MSH'){ if (cur) out.push(cur.join('\r')); cur = [seg]; } else if (/^(FHS|BHS|BTS|FTS)$/.test(id)) continue; else if (cur) cur.push(seg.replace(/\s+$/, '')); }
  if (cur) out.push(cur.join('\r')); return out; }
function enc(raw){ const fs = raw[3] || '|'; const e = raw.slice(4, 8).split(fs)[0]; return { fs, cs: e[0] || '^', rs: e[1] || '~', es: e[2] || '\\', ss: e[3] || '&' }; }
function index(raw){ const nl = raw.indexOf('\r'); const msh = nl < 0 ? raw : raw.slice(0, nl); const E = enc(raw); const p = msh.split(E.fs); const c = (x, i) => String(x || '').split(E.cs)[i] || '';
  return { t: c(p[8], 0), e: c(p[8], 1), ctrl: p[9] || '', ts: c(p[6], 0), app: c(p[2], 0), fac: c(p[3], 0), ver: c(p[11], 0), n: raw.split('\r').length }; }
const PATH = /^([A-Z][A-Z0-9]{2})(?:\[(\d+)\])?(?:-(\d+)(?:\[(\d+)\])?(?:\.(\d+)(?:\.(\d+))?)?)?$/i;
function path(s){ const m = PATH.exec(String(s || '').trim()); if (!m) return null; return { seg: m[1].toUpperCase(), occ: +m[2] || 0, f: +m[3] || 0, rep: +m[4] || 0, c: +m[5] || 0, s: +m[6] || 0 }; }
function fieldOf(seg, p, E){ const parts = seg.split(E.fs); if (p.seg === 'MSH'){ if (p.f === 1) return { v: E.fs, raw: true }; if (p.f === 2) return { v: parts[1] || '', raw: true }; return { v: parts[p.f - 1] }; } return { v: parts[p.f] }; }
function vals(raw, p){ if (typeof p === 'string') p = path(p); if (!p) return []; const E = enc(raw); const out = []; let n = 0;
  for (const seg of raw.split('\r')){ if (seg.slice(0, 3) !== p.seg) continue; n++; if (p.occ && n !== p.occ) continue; if (!p.f){ out.push(seg); continue; }
    const F = fieldOf(seg, p, E); const fv = F.v == null ? '' : F.v; if (F.raw){ out.push(fv); continue; }
    const reps = fv.split(E.rs); reps.forEach((r, i) => { if (p.rep && i + 1 !== p.rep) return; let v = r; if (p.c){ v = r.split(E.cs)[p.c - 1] || ''; if (p.s) v = v.split(E.ss)[p.s - 1] || ''; } out.push(v); });
    if (p.rep > reps.length) out.push(''); }
  return out; }
const get = (raw, p) => vals(raw, p).join('~');
const rtrim = (a, sep) => { while (a.length > 1 && a[a.length - 1] === '') a.pop(); return a.join(sep); };
/* Apply fn(old) -> new at a path (every occurrence/repetition unless given). Returns { raw, ch } */
function mapv(raw, p, fn){ if (typeof p === 'string') p = path(p); if (!p || !p.f) return { raw, ch: 0 }; const E = enc(raw); let n = 0, ch = 0;
  const segs = raw.split('\r').map(seg => { if (seg.slice(0, 3) !== p.seg) return seg; n++; if (p.occ && n !== p.occ) return seg; if (p.seg === 'MSH' && p.f <= 2) return seg;
    const parts = seg.split(E.fs); const idx = p.seg === 'MSH' ? p.f - 1 : p.f; const had = parts.length; while (parts.length <= idx) parts.push('');
    const reps = parts[idx].split(E.rs); const max = p.rep ? Math.max(reps.length, p.rep) : reps.length; let local = 0;
    for (let i = 0; i < max; i++){ if (p.rep && i + 1 !== p.rep) continue; const r = reps[i] == null ? '' : reps[i];
      if (p.c){ const cs = r.split(E.cs); while (cs.length < p.c) cs.push('');
        if (p.s){ const ss = cs[p.c - 1].split(E.ss); while (ss.length < p.s) ss.push(''); const o = ss[p.s - 1], x = String(fn(o)); if (x !== o){ ss[p.s - 1] = x; local++; } cs[p.c - 1] = rtrim(ss, E.ss); }
        else { const o = cs[p.c - 1], x = String(fn(o)); if (x !== o){ cs[p.c - 1] = x; local++; } }
        reps[i] = rtrim(cs, E.cs); }
      else { const x = String(fn(r)); if (x !== r){ reps[i] = x; local++; } } }
    if (!local){ return seg; } ch += local; parts[idx] = rtrim(reps.map(x => x == null ? '' : x), E.rs); const o = rtrim(parts, E.fs); return o.length < 4 ? seg.slice(0,3) + E.fs : o; });
  return { raw: segs.join('\r'), ch }; }
/* Filters: one per line or joined with AND. PATH | PATH=V | PATH!=V | PATH contains V | PATH ~ regex | PATH empty */
function parseFilter(text){ const out = [];
  for (const line of String(text || '').split(/\n|\s+AND\s+/i)){ const l = line.trim(); if (!l) continue;
    const m = /^([A-Za-z][A-Za-z0-9]{2}(?:\[\d+\])?(?:-\d+(?:\[\d+\])?(?:\.\d+){0,2})?)\s*(!=|=|~|\bcontains\b|\bnot contains\b|\bempty\b|\bexists\b)?\s*(.*)$/i.exec(l);
    if (!m || !path(m[1])) return { error: 'Cannot read filter "' + l + '". Use e.g. PV1-2=I, MSH-9 contains A08, PID-5.1 ~ ^SM, PID-3' };
    const op = (m[2] || 'exists').toLowerCase(); let v = m[3].trim(), re = null;
    if (op === '~'){ try { re = new RegExp(v.replace(/^\/(.*)\/([a-z]*)$/, '$1'), (/^\/.*\/([a-z]*)$/.exec(v) || [,'i'])[1] || 'i'); } catch(e){ return { error: 'Bad regular expression in "' + l + '": ' + e.message }; } }
    out.push({ p: path(m[1]), src: m[1], op, v, re }); }
  return { list: out }; }
function test(raw, f){ const vs = vals(raw, f.p);
  switch (f.op){ case 'exists': return vs.some(x => x !== ''); case 'empty': return !vs.some(x => x !== '');
    case '=': return vs.some(x => x === f.v || x.split(enc(raw).cs)[0] === f.v); case '!=': return !vs.some(x => x === f.v || x.split(enc(raw).cs)[0] === f.v);
    case 'contains': return vs.some(x => x.toLowerCase().includes(f.v.toLowerCase())); case 'not contains': return !vs.some(x => x.toLowerCase().includes(f.v.toLowerCase()));
    case '~': return vs.some(x => f.re.test(x)); } return false; }
function matchAll(raw, filters, text, regex){ for (const f of filters) if (!test(raw, f)) return false;
  if (text){ if (regex){ if (!regex.test(raw)) return false; } else if (!raw.toLowerCase().includes(text.toLowerCase())) return false; } return true; }
function count(list, key){ const m = new Map(); for (const x of list){ const k = key(x); m.set(k, (m.get(k) || 0) + 1); } return [...m].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))); }
/* Field-by-field diff (segment occurrence / field / repetition / component / subcomponent aware) */
function diff(a, b, ignore){ const ig = (ignore || []).map(s => String(s).trim().toUpperCase()).filter(Boolean); const skip = p => ig.some(x => p.replace(/\[\d+\]/g, '') === x || p.replace(/\[\d+\]/g, '').startsWith(x + '.') || p.replace(/\[\d+\]/g, '').startsWith(x + '[')|| p === x);
  const EA = enc(a), EB = enc(b); const occ = raw => { const m = {}, o = []; for (const s of raw.split('\r')){ const id = s.slice(0, 3); m[id] = (m[id] || 0) + 1; o.push([id + '[' + m[id] + ']', id, s]); } return o; };
  const A = occ(a), B = occ(b); const keys = []; for (const x of [...A, ...B]) if (!keys.includes(x[0])) keys.push(x[0]); const rows = [];
  const fields = (s, E, id) => { const p = s.split(E.fs); if (id === 'MSH'){ return [null, E.fs, ...p.slice(1)]; } return p; };
  for (const k of keys){ const sa = A.find(x => x[0] === k), sb = B.find(x => x[0] === k); const id = k.slice(0, 3);
    if (!sa || !sb){ if (!skip(id)) rows.push({ path: k, kind: sa ? 'removed' : 'added', a: sa ? sa[2] : '', b: sb ? sb[2] : '' }); continue; }
    const fa = fields(sa[2], EA, id), fb = fields(sb[2], EB, id);
    for (let f = 1; f < Math.max(fa.length, fb.length); f++){ const va = fa[f] || '', vb = fb[f] || ''; if (va === vb) continue; const fp = id + '-' + f; if (skip(fp)) continue;
      if (id === 'MSH' && f <= 2){ rows.push({ path: k + '-' + f, kind: 'changed', a: va, b: vb }); continue; }
      const ra = va.split(EA.rs), rb = vb.split(EB.rs);
      for (let r = 0; r < Math.max(ra.length, rb.length); r++){ const xa = ra[r] || '', xb = rb[r] || ''; if (xa === xb) continue; const rp = k + '-' + f + (Math.max(ra.length, rb.length) > 1 ? '[' + (r + 1) + ']' : '');
        const ca = xa.split(EA.cs), cb = xb.split(EB.cs);
        if (ca.length === 1 && cb.length === 1){ rows.push({ path: rp, kind: !xa ? 'added' : !xb ? 'removed' : 'changed', a: xa, b: xb }); continue; }
        for (let c = 0; c < Math.max(ca.length, cb.length); c++){ const ya = ca[c] || '', yb = cb[c] || ''; if (ya === yb) continue; if (skip(fp + '.' + (c + 1))) continue;
          rows.push({ path: rp + '.' + (c + 1), kind: !ya ? 'added' : !yb ? 'removed' : 'changed', a: ya, b: yb }); } } } }
  return rows; }
/* HL7 escape sequences (v2.5.1 section 2.7): \F\ \S\ \T\ \R\ \E\ \Xhh..\ \.br\ \H\ \N\ */
function decodeEscapes(v, E){ E = E || { fs:'|', cs:'^', rs:'~', es:'\\', ss:'&' }; const e = E.es; if (!e || String(v).indexOf(e) < 0) return v;
  const re = new RegExp(e.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&') + '([^' + e.replace(/[\\\]^-]/g, '\\$&') + ']*)' + e.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'), 'g');
  return String(v).replace(re, (all, x) => { if (x === 'F') return E.fs; if (x === 'S') return E.cs; if (x === 'T') return E.ss; if (x === 'R') return E.rs; if (x === 'E') return E.es;
    if (x === '.br') return '\n'; if (x === 'H' || x === 'N') return ''; if (/^X([0-9A-Fa-f]{2})+$/.test(x)) return x.slice(1).match(/../g).map(h => String.fromCharCode(parseInt(h, 16))).join(''); return all; }); }
const csvCell = v => { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) || /^[=+\-@]/.test(s) ? '"' + (/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
/* Minimal text PDF (PDF 1.4, Courier, Latin-1), built in the browser. */
function pdf(title, lines){ const W = 100, PER = 64; const wrap = []; for (const l of [title, '', ...lines]){ let s = String(l).replace(/[^\x20-\x7e\xa0-\xff]/g, '?'); if (!s) wrap.push(''); while (s.length){ wrap.push(s.slice(0, W)); s = s.slice(W); } }
  const pages = []; for (let i = 0; i < wrap.length; i += PER) pages.push(wrap.slice(i, i + PER)); if (!pages.length) pages.push(['']);
  const objs = []; const add = s => { objs.push(s); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>'); add(''); add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'); const kids = [];
  pages.forEach((pg, n) => { const esc = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const body = 'BT /F1 9 Tf 11 TL 40 760 Td ' + pg.map(l => '(' + esc(l) + ') Tj T*').join(' ') + ' ET BT /F1 8 Tf 40 30 Td (' + esc(title.slice(0, 60) + '  -  page ' + (n + 1) + ' of ' + pages.length) + ') Tj ET';
    const c = add('<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream'); kids.push(add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ' + c + ' 0 R >>')); });
  objs[1] = '<< /Type /Pages /Kids [' + kids.map(k => k + ' 0 R').join(' ') + '] /Count ' + kids.length + ' >>';
  let out = '%PDF-1.4\n'; const off = []; objs.forEach((o, i) => { off.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const x = out.length; out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF\n';
  const b = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) b[i] = out.charCodeAt(i) & 255; return b; }
G.HL7BC = { split, enc, index, path, vals, get, mapv, parseFilter, test, matchAll, count, diff, decodeEscapes, csv, pdf };
})(typeof self !== 'undefined' ? self : window);
