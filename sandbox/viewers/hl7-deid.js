/* Offline Sandbox only: rule-based de-identification of HL7 v2 messages. Runs on this computer; nothing is sent anywhere.
   Rules follow the HIPAA Safe Harbor identifier list as applied to common v2.5.1 fields. Review the output before sharing. */
(function(){
'use strict';
const B = window.HL7B, C = window.HL7BC; if (!B || !C) return;
const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const O = { shift: -37, free: true, allDates: true, result: null };
const ID = ['PID-2','PID-3','PID-4','PID-18','PID-20','PV1-19','PV1-50','MRG-1','MRG-2','MRG-3','MRG-5','GT1-2','IN1-36','IN1-49','NK1-33','ORC-2','ORC-3','OBR-2','OBR-3','TXA-12'];
const NAME = ['PID-5','PID-6','PID-9','NK1-2','NK1-30','GT1-3','IN1-16','MRG-7'];
const ADDR = ['PID-11','NK1-4','NK1-32','GT1-5','IN1-19'];
const TEL = ['PID-13','PID-14','NK1-5','NK1-6','NK1-31','GT1-6','GT1-7'];
const DROP = ['PID-19','PID-21','NK1-37','GT1-12','IN1-50','PID-23','PID-26','PID-27','PID-28'];
const DOB = ['PID-7','PID-29','GT1-8','IN1-18','NK1-16'];
const DATES = ['MSH-7','EVN-2','EVN-3','EVN-6','PV1-44','PV1-45','ORC-9','ORC-15','OBR-6','OBR-7','OBR-8','OBR-14','OBR-22','OBX-14','OBX-19','TXA-4','TXA-6','TXA-7','FT1-4','FT1-5','RXA-3','RXA-4','DG1-5','PR1-5','AIS-4','SPM-17','SPM-18'];
function shiftDate(v, days){ const m = /^(\d{4})(\d{2})?(\d{2})?(.*)$/.exec(v); if (!m || !v) return v; const d = new Date(Date.UTC(+m[1], (+m[2] || 1) - 1, +m[3] || 1) + days * 864e5);
  const y = String(d.getUTCFullYear()), mo = String(d.getUTCMonth() + 1).padStart(2, '0'), da = String(d.getUTCDate()).padStart(2, '0'); return y + (m[2] ? mo : '') + (m[3] ? da : '') + m[4]; }
const code = n => { let s = ''; n++; while (n > 0){ n--; s = String.fromCharCode(65 + n % 26) + s; n = Math.floor(n / 26); } return s; };
function run(msgs, opt){ const maps = { id: new Map(), fam: new Map(), giv: new Map(), addr: new Map(), tel: new Map() }; const cnt = {};
  const pseudo = (m, k, mk) => { if (!m.has(k)) m.set(k, mk(m.size)); return m.get(k); };
  const out = msgs.map(raw => { let r = raw; const E = C.enc(raw);
    const apply = (list, fnFor, label) => { for (const f of list){ const p = C.path(f); const res = C.mapv(r, p, fnFor(p)); if (res.ch){ r = res.raw; cnt[label + ' ' + f] = (cnt[label + ' ' + f] || 0) + res.ch; } } };
    apply(ID, () => rep => { if (!rep) return rep; const cs = rep.split(E.cs); cs[0] = pseudo(maps.id, cs[0], n => 'D' + String(1000000 + n)); return cs.join(E.cs); }, 'identifier');
    apply(NAME, () => rep => { if (!rep) return rep; const cs = rep.split(E.cs); if (cs[0]) cs[0] = 'FAMILY' + pseudo(maps.fam, cs[0].toUpperCase(), code); if (cs[1]) cs[1] = 'GIVEN' + pseudo(maps.giv, cs[1].toUpperCase(), code); if (cs[2]) cs[2] = ''; return cs.join(E.cs).replace(new RegExp('\\' + E.cs + '+$'), ''); }, 'name');
    apply(ADDR, () => rep => rep ? pseudo(maps.addr, rep, n => (n + 1) + ' MAIN ST' + E.cs + E.cs + 'ANYTOWN' + E.cs + E.cs + '00000') : rep, 'address');
    apply(TEL, () => rep => { if (!rep) return rep; const cs = rep.split(E.cs); const n = pseudo(maps.tel, rep, k => String(k % 100).padStart(2, '0')); return '555-01' + n + (cs[1] ? E.cs + cs[1] : '') + (cs[2] ? E.cs + cs[2] : ''); }, 'phone');
    apply(DROP, () => v => '', 'removed');
    apply(DOB, () => v => v ? shiftDate(v, opt.shift) : v, 'date of birth/death shifted');
    if (opt.allDates) apply(DATES, () => v => v ? shiftDate(v, opt.shift) : v, 'date shifted');
    if (opt.free){ const segs = r.split('\r').map(s => { const id = s.slice(0, 3); const p = s.split(E.fs);
        if (id === 'OBX' && /^(TX|FT|ST)$/.test(p[2] || '') && p[5]){ p[5] = '[free text removed]'; cnt['free text OBX-5'] = (cnt['free text OBX-5'] || 0) + 1; return p.join(E.fs); }
        if (id === 'NTE' && p[3]){ p[3] = '[free text removed]'; cnt['free text NTE-3'] = (cnt['free text NTE-3'] || 0) + 1; return p.join(E.fs); } return s; }); r = segs.join('\r'); }
    return r; });
  return { out, cnt, distinct: { identifiers: maps.id.size, families: maps.fam.size, givens: maps.giv.size, addresses: maps.addr.size, phones: maps.tel.size } }; }
B.deidRun = run;
B.deid = {
  view(){ const S = B.S; if (!S.msgs.length) return '<p class="hb-empty">Load messages first.</p>'; const R = O.result;
    return '<div class="hb-al ok"><b>Runs fully offline.</b> De-identification happens on this computer. Nothing is uploaded or sent anywhere.</div><p class="hb-meta">Applies to the <b>' + S.view.length + '</b> messages matching the current filter. The same original value always gets the same replacement within a run, so patients stay linked across messages. Review the result before you share it.</p>' +
      '<div class="hb-row"><label class="hb-inl">Shift dates by (days)<input id="diShift" type="number" value="' + O.shift + '" style="width:6em"></label><label class="hb-chk"><input type="checkbox" id="diAll"' + (O.allDates ? ' checked' : '') + '> Shift all event dates too</label><label class="hb-chk"><input type="checkbox" id="diFree"' + (O.free ? ' checked' : '') + '> Remove free text (OBX-5 TX/FT/ST, NTE-3)</label><button class="hb-btn pri" data-act="dirun">De-identify</button></div>' +
      '<details><summary>Rules</summary><ul class="hb-meta"><li>Identifiers (' + ID.join(', ') + '): consistent pseudonym D1000000, D1000001…</li><li>Names (' + NAME.join(', ') + '): FAMILYA^GIVENA…, middle name removed</li><li>Addresses (' + ADDR.join(', ') + '): n MAIN ST^^ANYTOWN^^00000</li><li>Phones (' + TEL.join(', ') + '): 555-01nn</li><li>Removed (' + DROP.join(', ') + '): SSN, driver\'s license, birthplace, birth order, citizenship, veteran status</li><li>Shifted by the same number of days: ' + DOB.join(', ') + ' and optionally ' + DATES.join(', ') + '</li></ul></details>' +
      (R ? '<div class="hb-al ok">De-identified <b>' + R.out.length + '</b> messages: ' + Object.values(R.cnt).reduce((a, b) => a + b, 0) + ' values replaced.</div><div class="hb-row"><button class="hb-btn pri" data-act="disave">Save de-identified .hl7</button><button class="hb-btn" data-act="dimap">Save summary (CSV)</button><button class="hb-btn" data-act="diuse">Open result in the list</button></div>' +
        '<table class="hb-st"><thead><tr><th>Rule · field</th><th>Values replaced</th></tr></thead><tbody>' + Object.entries(R.cnt).map(([k, n]) => '<tr><td>' + h(k) + '</td><td>' + n + '</td></tr>').join('') + '</tbody></table>' +
        '<details open><summary>Preview: first message after de-identification</summary><pre class="hb-raw">' + h((R.out[0] || '').replace(/\r/g, '\n')) + '</pre></details>' : ''); },
  act(a, el, v){ const S = B.S;
    if (a === 'dirun'){ O.shift = Math.round(+v('diShift') || 0); O.allDates = document.getElementById('diAll').checked; O.free = document.getElementById('diFree').checked; O.result = run(S.view.map(i => S.msgs[i]), O); B.render(); }
    else if (a === 'disave' && O.result) B.dl('deidentified-' + O.result.out.length + '.hl7', O.result.out.map(m => m.replace(/\r/g, '\r\n')).join('\r\n\r\n') + '\r\n', 'application/octet-stream');
    else if (a === 'dimap' && O.result) B.dl('deidentify-summary.csv', C.csv([['Rule', 'Field', 'Values replaced'], ...Object.entries(O.result.cnt).map(([k, n]) => { const i = k.lastIndexOf(' '); return [k.slice(0, i), k.slice(i + 1), n]; }), [], ['Distinct pseudonyms', 'identifiers', O.result.distinct.identifiers], ['Distinct pseudonyms', 'family names', O.result.distinct.families], ['Distinct pseudonyms', 'given names', O.result.distinct.givens], ['Distinct pseudonyms', 'addresses', O.result.distinct.addresses], ['Distinct pseudonyms', 'phones', O.result.distinct.phones], ['Date shift (days)', '', O.shift], ['Note', 'Original values are not written to this file.', '']]), 'text/csv');
    else if (a === 'diuse' && O.result){ const r = O.result; O.result = null; B.load(r.out.join('\r'), 'de-identified messages'); S.tab = 'list'; } } };
})();
