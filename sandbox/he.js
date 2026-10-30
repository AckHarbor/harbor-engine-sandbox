/* Harbor Engine Sandbox (free edition). Licensed under PolyForm Noncommercial 1.0.0 (see LICENSE). */
'use strict';

/* ---- PHI training guard (remembered per browser user) ---- */
const PHI_KEY = 'iha_he_phi_ok_v1';
/* The downloaded Sandbox (opened from disk, file://) runs fully offline, so it shows no PHI notice or confirm. */
function heOffline(){ return typeof window !== 'undefined' && !!window.HE_SANDBOX && typeof location !== 'undefined' && location.protocol === 'file:'; }
function phiOk(){ if (heOffline()) return true; try { return localStorage.getItem(PHI_KEY) === '1'; } catch(e){ return false; } }
function phiRemember(){ try { localStorage.setItem(PHI_KEY, '1'); } catch(e){} }
function phiBannerHtml(){ return '<div class="phi-bar" role="note"><b>Don’t paste PHI.</b></div>'; }
function phiConfirm(then){
  if (phiOk()){ then(); return; }
  $('dlgBody').innerHTML = '<h3>Don’t paste PHI</h3><p>Harbor Engine is for practice. Don’t paste or import messages that contain PHI.</p><label class="chk"><input type="checkbox" id="phiChk"> I confirm this contains no PHI</label><div id="phiErr" class="warn"></div>';
  $('dlgBtns').innerHTML = '<button class="btn" onclick="$(\'dlg\').close()">Cancel</button> <button class="btn pri" id="phiGo">Continue</button>';
  $('phiGo').onclick = () => { if (!$('phiChk').checked){ $('phiErr').textContent = 'Check the box to continue.'; return; } phiRemember(); $('dlg').close(); then(); };
  $('dlg').showModal();
}
function withPhi(fn){ return function(){ const args = arguments; const self = this; phiConfirm(() => fn.apply(self, args)); }; }

const HE_KEY = 'iha_he_sandbox_v2';
const SB = !!(typeof window !== 'undefined' && window.HE_SANDBOX);
const MAX_CH = SB ? 3 : 999;
const $ = id => document.getElementById(id);
const clone = o => JSON.parse(JSON.stringify(o));
const uid = p => p + Math.random().toString(36).slice(2, 8);
const ts = () => new Date().toISOString();
const fmtT = s => { const d = new Date(s); return d.toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }); };
const showSeg = s => String(s||'').replace(/\r/g, '\n');

/* ---------------- Partner systems (simulated receivers) ---------------- */
const PARTNERS = {
  adt:     { name:'Bedboard (PMC-BEDS)', spec:['Accepts ADT only.','PV1-3 (location) required.','Phones must use XTN components (area code in .6, local number in .7), not the old XTN.1 string.'] },
  lab:     { name:'Lab system (HARBORLAB)', spec:['Accepts ADT and ORM.','PID-3 needs an MR identifier.','PID-8 must use lab codes: 1 = male, 2 = female, 3 = other/unknown (local table, not HL7 table 0001).','PID-7 must be a valid YYYYMMDD date.','ORM: only lab orders (OBR-24 = LAB).'] },

  rad:     { name:'Radiology (HARBORRAD)', spec:['Accepts ORM only, and only imaging orders (OBR-24 = RAD).','OBR-4.1 must be a radiology procedure code: RAD-CXR2, RAD-CTH, RAD-ANK3.'] },
  ehr:     { name:'EHR results inbox (PENEHR)', spec:['Accepts ORU only.','OBX-3 needs a coding system (e.g. LN).'] },

  file:    { name:'File writer', spec:['Writes each message to the outbox (shown under the destination).'] }
};
const RAD_OK = ['RAD-CXR2','RAD-CTH','RAD-ANK3'];
const PAPP = { adt:'BEDBOARD', lab:'HARBORLAB', rad:'HARBORRAD', ehr:'PENEHR' };
let PTYPE = '';
function partnerAck(m, errs){ const a = buildAck(m, errs.map(e => ({ sev:'E', loc:e[0], msg:e[1], code:e[2] })));
  const l = a.text.split('\r'); const f = l[0].split('|'); f[2] = PAPP[PTYPE] || f[2]; f[3] = 'PMC'; f[4] = 'HARBORENGINE'; f[5] = 'PMC'; l[0] = f.join('|'); a.text = l.join('\r'); return a; }
function partnerReceive(type, work, st){
  if (st.outage[type]) return { ok:false, conn:true, text:'Connection refused (partner down).' };

  PTYPE = type; const m = work.m, t = hl7Get(m,'MSH-9.1'), errs = [];
  if (type === 'file') return { ok:true, text:'Written: '+(hl7Get(m,'MSH-10')||'msg')+'.hl7' };
  const allow = { adt:['ADT'], lab:['ADT','ORM'], rad:['ORM'], ehr:['ORU'] }[type];
  if (!allow.includes(t)) errs.push(['MSH-9', 'Message type '+t+' not accepted by this system', '200']);
  else {
    if (type === 'adt'){
      if (!hl7Get(m,'PV1-3')) errs.push(['PV1-3','Assigned location required','101']);
      const ph = hl7Get(m,'PID-13.1'); if (ph && !hl7Get(m,'PID-13.7')) errs.push(['PID-13','Phone must use XTN components .6/.7, not the XTN.1 string','102']);
    }
    if (type === 'lab'){
      const dob = hl7Get(m,'PID-7'); if (!dob || !/^\d{8}/.test(dob) || !dtmValid(dob)) errs.push(['PID-7','Date of birth "'+dob+'" is not YYYYMMDD','102']);
    }
    if (type === 'lab'){
      const pid = m.segs.find(s=>s.id==='PID'); const reps = pid ? (pid.fields[2]||'').split(m.d.rep) : [];
      if (!reps.some(r => r.split(m.d.comp)[4] === 'MR')) errs.push(['PID-3','No MR identifier in PID-3','101']);
      const sx = hl7Get(m,'PID-8'); if (!['1','2','3'].includes(sx)) errs.push(['PID-8','Sex "'+sx+'" not in lab table (1,2,3)','103']);
      if (t === 'ORM'){ if (hl7Get(m,'OBR-24') !== 'LAB') errs.push(['OBR-24','Not a lab order (OBR-24='+(hl7Get(m,'OBR-24')||'empty')+')','207']); if (!hl7Get(m,'OBR-4.1')) errs.push(['OBR-4','Universal service ID required','101']); }
    }

    if (type === 'rad'){
      if (hl7Get(m,'OBR-24') !== 'RAD') errs.push(['OBR-24','Not an imaging order (OBR-24='+(hl7Get(m,'OBR-24')||'empty')+')','207']);
      else if (!RAD_OK.includes(hl7Get(m,'OBR-4.1'))) errs.push(['OBR-4','Unknown procedure code "'+hl7Get(m,'OBR-4.1')+'"','103']);
    }
    if (type === 'ehr'){ m.segs.filter(s=>s.id==='OBX').forEach((s,i)=>{ if (!(s.fields[2]||'').split(m.d.comp)[2]) errs.push(['OBX-3','OBX '+(i+1)+' observation code has no coding system','102']); }); }
  }
  const a = partnerAck(m, errs);
  return { ok: a.code === 'AA', ack: a.code, text: a.text };
}

/* ---------------- Simulated sending systems (Penford Medical Center) ---------------- */
const PATIENTS = [
  ['10028471','Chen','Maya','Lin','19880314','F','(555)555-0148','22 Mercer St','A7001001'],
  ['10031122','Reyes','Omar','J','19750602','M','(555)555-0191','9 Elm Ct','A7001002'],
  ['10044120','Nguyen','Tam','','19921130','F','(555)555-0172','7 Quay Ln','A7001003'],
  ['10050077','Okafor','Ben','A','19600921','M','(555)555-0133','41 Ridge Rd','A7001004'],
  ['10061234','Haddad','Lina','','20010117','F','(555)555-0107','3 Pier Way','A7001005'],
  ['10070555','Kowalski','Jan','P','19480805','M','(555)555-0164','18 Birch Ave','A7001006'],
  ['10081999','Brooks','Ava','R','19950228','F','(555)555-0125','60 Harbor St','A7001007'],
  ['10093310','Iyer','Dev','','19830711','U','(555)555-0186','12 Mill Rd','A7001008'],
  ['10102468','Santos','Rita','M','19691203','F','(555)555-0119','5 Canal St','A7001009'],
  ['10113579','Park','June','','19990420','O','(555)555-0158','27 Dock Ln','A7001010']
];
const BMP = [['2951-2','Sodium [Moles/volume] in Serum or Plasma','mmol/L',136,145,[134,141,147]],['2823-3','Potassium [Moles/volume] in Serum or Plasma','mmol/L',3.5,5.1,[3.9,4.4,5.4]],['2345-7','Glucose [Mass/volume] in Serum or Plasma','mg/dL',70,99,[88,98,131]],['2160-0','Creatinine [Mass/volume] in Serum or Plasma','mg/dL',0.6,1.1,[0.7,0.9,1.4]]];
const CLERKS = ['kjames^James^Kim','rdiaz^Diaz^Rosa','tobi^Obi^Tunde'];
const LABS = [['10839-9','Troponin I.cardiac [Mass/volume] in Serum or Plasma','0.01','ng/mL'],['2345-7','Glucose [Mass/volume] in Serum or Plasma','98','mg/dL'],['718-7','Hemoglobin [Mass/volume] in Blood','13.6','g/dL']];
const RADS = [['XR-CHEST2','XR chest 2 views'],['CT-HEAD','CT head without contrast'],['XR-ANKLE3','XR ankle 3 views']];
let SEQ = 0;
function dtm(off){ const d = new Date(Date.now() + (off||0)*60000), p = n => String(n).padStart(2,'0'); const o = -d.getTimezoneOffset(), sg = o>=0?'+':'-';
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+sg+p(Math.floor(Math.abs(o)/60))+p(Math.abs(o)%60); }
const pick = a => a[Math.floor(Math.random()*a.length)];
const DOC = '2201^Patel^Anika^^^Dr';
function genMsg(kind, opt){
  opt = opt || {}; const P = opt.patient || pick(PATIENTS); SEQ++;
  const fac = opt.north ? 'PMC-NORTH' : 'PMC';
  const ctrl = (opt.north ? 'PMN' : 'PMC') + '-' + kind + '-' + String(Date.now()).slice(-6) + String(SEQ).padStart(3,'0');
  const app = kind === 'ORU' ? 'HARBORLAB' : 'PENEHR';
  const msh = (type, struct) => ['MSH','^~\\&',app,kind==='ORU'?'PMC':fac,'HARBORENGINE','PMC',dtm(),'',type+'^'+struct,ctrl,opt.proc||'P','2.5.1'].join('|');
  let dob = P[4]; if (opt.north) dob = dob.slice(4,6)+'/'+dob.slice(6,8)+'/'+dob.slice(0,4);
  const oldPhone = opt.oldPhone !== undefined ? opt.oldPhone : Math.random() < .35;
  const digits = P[6].replace(/\D/g,'');
  const ph = oldPhone ? P[6]+'^PRN^PH' : '^PRN^PH^^^'+digits.slice(0,3)+'^'+digits.slice(3);
  const ssn = '900-0' + P[0].slice(-1) + '-' + P[0].slice(-4);
  const sex = opt.bad === 'sex' ? 'X' : P[5];
  const pid = acct18 => ['PID','1','',(opt.bad==='nomrn'?'':P[0]+'^^^PMC^MR')+(acct18?'':(opt.bad==='nomrn'?'':'~')+P[8]+'^^^PMC^AN'),'',P[1]+'^'+P[2]+(P[3]?'^'+P[3]:''),'',dob,sex,'','',P[7]+'^^Penford^^00000','',ph,'','','','',acct18?P[8]+'^^^PMC^AN':'',ssn].join('|');
  const vn = 'V' + String(2000000 + Math.floor(Math.random()*899999));
  const pv1 = cls => ['PV1','1',cls, cls==='E'?'ED^'+(10+SEQ%20)+'^A^PMC':cls==='O'?'CLINIC-B^^^PMC':'4W^'+(400+SEQ%30)+'^B^PMC','','','',DOC,'','','MED','','','','','','','','',vn+'^^^PMC^VN'].join('|');
  let segs;
  if (kind === 'ADT'){
    const ev = opt.event || pick(['A04','A04','A01','A08','A03']);
    const struct = ev === 'A03' ? 'ADT_A03' : 'ADT_A01';   // A04 and A08 reuse the ADT_A01 structure
    const p1 = pid(true).split('|'); if (p1[3] && opt.bad !== 'nomrn') p1[3] += '~E'+P[0].slice(2)+'^^^PENMPI^PI'; // enterprise ID as a 2nd PID-3 repetition, as real feeds send
    segs = [msh('ADT^'+ev, struct), 'EVN|'+ev+'|'+dtm(-1)+'|||'+pick(CLERKS), p1.join('|'), 'NK1|1|'+P[1]+'^Alex|'+pick(['SPO','MTH','FND','EMC'])+'||^PRN^PH^^^555^5550100', pv1(ev==='A04'?'E':'I')];
    if (Math.random() < .3) segs.push('AL1|1|DA|PCN^Penicillin^L|MO|Hives');
    if (Math.random() < .4) segs.push('ZPI|1|'+pick(['Prefers text reminders','Interpreter needed','Portal invite sent'])+'|Y');
  } else if (kind === 'ORM'){
    const rad = opt.rad !== undefined ? opt.rad : Math.random() < .4; const stat = opt.stat !== undefined ? opt.stat : Math.random() < .3;
    const t = rad ? (opt.code ? RADS.find(r=>r[0]===opt.code) : pick(RADS)) : (opt.test ? LABS.find(r=>r[0]===opt.test) : pick(LABS)); const ord = 'ORD' + String(Date.now()).slice(-5) + SEQ;
    segs = [msh('ORM^O01','ORM_O01'), pid(true), pv1('E'), ['ORC','NW',ord+'^PENEHR','','','','','^^^^^'+(stat?'S':'R'),'','','','',DOC].join('|'),
      ['OBR','1',ord+'^PENEHR','',t[0]+'^'+t[1]+'^'+(rad?'L':'LN'),'','',dtm(),'','','','','','','','',DOC,'','','','','','','',rad?'RAD':'LAB','','','^^^^^'+(stat?'S':'R')].join('|')];
    if (opt.note) segs.push('NTE|1|P|'+opt.note); else if (Math.random() < .35) segs.push('NTE|1|P|'+pick(rad?['Patient cannot lie flat','Rule out fracture, fell on ice']:['Chest pain started 2 hours ago','Draw with next scheduled labs']));
  } else if (kind === 'ORU'){
    const t = pick(LABS); const ord = 'ORD' + String(Date.now()).slice(-5) + SEQ;
    segs = [msh('ORU^R01','ORU_R01'), pid(true), ['OBR','1',ord+'^PENEHR','F'+SEQ+'^HARBORLAB',t[0]+'^'+t[1]+'^LN','','',dtm(-30),'','','','','','','','',DOC,'','','','','',dtm(),'','LAB','F'].join('|'),
      ['OBX','1','NM',t[0]+'^'+t[1]+(opt.noSystem?'':'^LN'),'',t[2],t[3],'','N','','','F','','',dtm(-5)].join('|')];
    if (!opt.single && Math.random() < .5){ // a panel: one OBR, several OBX lines, sometimes a lab comment
      const fl = (v,lo,hi) => v < lo ? 'L' : v > hi ? 'H' : 'N';
      segs = segs.slice(0,2).concat([segs[2].replace(t[0]+'^'+t[1]+'^LN','BMP^Basic metabolic panel^L')]);
      BMP.forEach((b,k) => { const v = pick(b[5]); segs.push(['OBX',String(k+1),'NM',b[0]+'^'+b[1]+(opt.noSystem?'':'^LN'),'',String(v),b[2],b[3]+'-'+b[4],fl(v,b[3],b[4]),'','','F','','',dtm(-5)].join('|'));
        if (b[0]==='2823-3' && v > b[4]) segs.push('NTE|1|L|Slight hemolysis; potassium may read high.'); });
    }

  }
  let raw = segs.join('\r');
  if (opt.bad === 'noctrl') raw = raw.replace('|'+ctrl+'|', '||');
  if (opt.bad === 'junk') raw = 'PID|1||'+P[0]+'\rMSH|^~\\&|PENEHR';
  return raw;
}
const FEEDS = { ADT:6661, ORM:6662, ORU:6663 };

/* ---------------- State ---------------- */
let S;
const mkDest = (type, name, x) => Object.assign({ id: uid('d'), type, name: name || PARTNERS[type].name, enabled:true, filter:{ logic:'all', rules:[] }, transforms:[], retries:3, queue:true }, x||{});
const mkCh = (id, c, state) => ({ id, draft: clone(c), live: clone(c), state: state||'started', version:1, history:[{ v:1, ts:ts(), note:'Initial build', config: clone(c) }], stats:{ recv:0, filt:0, sent:0, err:0 }, queue:[], log:[] });
function cfg(name, port, desc, dests){ return { name, desc, source:{ type:'mllp', port }, filter:{ logic:'all', rules:[], js:'' }, transforms:[], dests, ack:{ mode:'receipt', validate:false } }; }
function seedChannels(){
  const adt = mkCh('ch-adt', cfg('PEN ADT In', 6661, 'Penford EHR ADT feed', [mkDest('adt'), mkDest('file','Analytics extract (file)')]));
  const ord = mkCh('ch-ord', cfg('PEN Orders In', 6662, 'Penford EHR orders (lab + imaging)', [mkDest('lab'), mkDest('rad', null, { transforms:[{ kind:'lookup', target:'OBR-4.1', table:'RAD_CODES', source:'OBR-4.1' }] }), mkDest('file','STAT orders (file)', { enabled:false })]));
  const res = mkCh('ch-res', cfg('LAB Results In', 6663, 'HARBORLAB results back to the EHR', [mkDest('ehr')]), 'error');

  return SB ? [adt, ord, res] : [adt, ord, res];
}
function freshState(){
  const st = { v:1, channels: seedChannels(), messages: [], alerts: [], tables: { RAD_CODES: { 'XR-CHEST2':'RAD-CXR2', 'CT-HEAD':'RAD-CTH' } }, outage: {}, sim: { on:false, rate:1, bad:true, sent:0, refused:0, naks:0, log:[] }, tickets: {}, tour:false, outbox: {} };
  if (SB){
    // Free Sandbox: sample messages only (no ticket exercises). Keep the results channel started with a couple of sample ORUs.
    const res = st.channels.find(c => c.id === 'ch-res'); if (res){ res.state = 'started';
      const d = res.live.dests[0];
      for (let i=0;i<2;i++){ const raw = genMsg('ORU', { proc:'T' }); const rec = newRec(res, raw); rec.ts = new Date(Date.now() - (3-i)*3600e3).toISOString(); rec.status = 'SENT'; rec.ack = 'AA'; rec.ackText = buildAck(hl7Parse(raw), []).text; rec.work = raw; rec.seeded = true;
        rec.dests = [{ id:d.id, name:d.name, type:'ehr', status:'SENT', attempts:1, resp:'AA', out: raw, ack:'AA' }]; st.messages.push(rec); res.stats.recv++; res.stats.sent++; }
    }
    return st;
  }
  // Paid: the results channel failed overnight while the EHR inbox was down; 4 results are queued.
  const res = st.channels.find(c => c.id === 'ch-res'); const d = res.live.dests[0];
  for (let i=0;i<4;i++){ const raw = genMsg('ORU', { proc:'T' }); const rec = newRec(res, raw); rec.ts = new Date(Date.now() - (5-i)*3600e3).toISOString(); rec.status = 'QUEUED'; rec.ack = 'AA'; rec.ackText = buildAck(hl7Parse(raw), []).text; rec.work = raw; rec.seeded = true;
    rec.dests = [{ id:d.id, name:d.name, type:'ehr', status:'QUEUED', attempts:4, resp:'Connection refused (partner down).', out: raw, ack:'' }]; st.messages.push(rec); res.queue.push({ msg: rec.id, dest: d.id }); res.stats.recv++; }
  res.log.push({ ts:new Date(Date.now()-3600e3).toISOString(), lvl:'E', text:'EHR results inbox unreachable after 3 retries. Channel stopped with error. (Update: the EHR team reports the inbox is back up.)' });
  st.alerts.push({ id:uid('a'), ts:ts(), ch:'ch-res', sev:'E', text:'LAB Results In stopped with error: destination unreachable; 4 messages queued.', ack:false });
  return st;
}
/* Multi-tab sync: one shared localStorage copy + a revision counter. Every tab live-reloads on another tab's save
   (storage event + BroadcastChannel). A save based on an out-of-date revision is never written over newer work:
   the tab reloads the newer state, keeps its own copy under HE_KEY+'.conflict', and tells the user. */
const HE_REVK = HE_KEY + '.rev', HE_TAB = Math.random().toString(36).slice(2); let HE_REV = 0, HE_BUSY = 0, HE_BC = null;
function heStoredRev(){ try { return +localStorage.getItem(HE_REVK) || 0; } catch(e){ return 0; } }
function heSynced(){ HE_REV = heStoredRev(); }
let HE_LOADED = null; // the exact stored JSON this tab last loaded or wrote
function heReload(){ let raw = null; try { raw = localStorage.getItem(HE_KEY); } catch(e){}
  heSynced(); if (raw !== null && raw === HE_LOADED) return; load(); HE_LOADED = raw; render(true); }
function save(quiet){ try { heTrim();
  if (heStoredRev() !== HE_REV){ if (!quiet){ try { localStorage.setItem(HE_KEY + '.conflict', JSON.stringify(S)); } catch(e){} } heReload();
    if (!quiet) toast('Harbor Engine was changed in another tab, so your last change was not saved over it. This tab now shows the latest version; please redo that change.'); return false; }
  HE_REV++; HE_LOADED = JSON.stringify(S); localStorage.setItem(HE_KEY, HE_LOADED); localStorage.setItem(HE_REVK, String(HE_REV));
  if (HE_BC) HE_BC.postMessage({ rev: HE_REV, tab: HE_TAB }); heSrvQueue(); return true; } catch(e){ return false; } }
let HE_PEND = false, HE_RPEND = false;
/* Message store cap (400). Background traffic is dropped first, so the messages a learner sent, resent, reprocessed or
   edited, and the scenario's seeded messages, survive a long traffic run and ticket checks still see the evidence. */
let HE_BGNOW = false; // true while the background sender runs: its messages and FHIR calls are tagged bg
function heTrim(){ const L = S.messages, MAX = 400; if (L.length <= MAX) return; const drop = new Set(); let over = L.length - MAX;
  for (const m of L){ if (!over) break; if (m.bg){ drop.add(m); over--; } }
  for (const m of L){ if (!over) break; if (!m.bg && !m.seeded){ drop.add(m); over--; } }
  S.messages = L.filter(m => !drop.has(m)); }
function heRemote(rev){ if (rev > HE_REV){ if (HE_BUSY) HE_PEND = true; else { HE_PEND = false; heReload(); } } }
/* Belt and braces: re-check storage when the tab becomes visible or focused, and every 10 s while visible,
   so a missed storage/BroadcastChannel event can never leave a tab showing an older version. */
function heCheck(){ if (HE_BUSY) return; if (heStoredRev() !== HE_REV){ HE_PEND = false; heReload(); } else if (HE_RPEND) render(true); }
/* Open-source Sandbox edition: no server sync. State lives only in this browser's localStorage. */
const HE_SRV = { on:false, ready:true, dirty:false, t:null, busy:false, last:0 };
function heSrvQueue(){} async function heSrvPull(){} async function heSrvPush(){}
if (typeof window !== 'undefined' && window.addEventListener){
  window.addEventListener('storage', e => { if (e.key === HE_REVK) heRemote(+e.newValue || 0); else if (e.key === HE_KEY && e.newValue === null) heRemote(Infinity); });
  try { HE_BC = new BroadcastChannel(HE_KEY); HE_BC.onmessage = e => { if (e.data && e.data.tab !== HE_TAB) heRemote(e.data.rev); }; } catch(e){ HE_BC = null; }
  const heWake = () => { if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return; if (!S) return; heCheck(); if (HE_SRV.on && Date.now() - HE_SRV.last > 3000) heSrvPull(); };
  window.addEventListener('focus', heWake); window.addEventListener('pageshow', heWake);
  if (typeof document !== 'undefined' && document.addEventListener){ document.addEventListener('visibilitychange', heWake);
    document.addEventListener('focusout', () => setTimeout(() => { if (HE_RPEND && S) render(true); }, 0)); }
  setInterval(() => { if (!S || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return; heCheck(); if (HE_SRV.on && Date.now() - HE_SRV.last >= 15000) heSrvPull(); }, 10000); }
/* Only one tab runs the background ticker (simulator/queues), so open tabs don't race each other. */
function heTickLeader(){ try { const k = HE_KEY + '.tick', now = Date.now(); const l = JSON.parse(localStorage.getItem(k) || 'null');
  if (!l || l.tab === HE_TAB || now - l.ts > 7000 || (typeof document !== 'undefined' && document.visibilityState === 'visible' && l.hidden)){ localStorage.setItem(k, JSON.stringify({ tab: HE_TAB, ts: now, hidden: typeof document !== 'undefined' && document.visibilityState === 'hidden' })); return true; } return false; } catch(e){ return true; } }
function load(){ try { const raw = localStorage.getItem(HE_KEY); HE_LOADED = raw; S = JSON.parse(raw || 'null'); } catch(e){ S = null; } if (!S || S.v !== 1) S = freshState(); if (SB && S.channels && S.channels.length > MAX_CH) S.channels = S.channels.slice(0, MAX_CH);
  if (SB && S.channels) S.channels.forEach(c => [c.draft, c.live].concat((c.history||[]).map(h => h.config)).forEach(k => { if (k && k.dests) k.dests = k.dests.filter(d => d && PARTNERS[d.type]); })); } // Sandbox: drop destinations whose partner isn't in the free edition
function chById(id){ return S.channels.find(c => c.id === id); }
function logc(ch, lvl, text){ ch.log.push({ ts:ts(), lvl, text }); if (ch.log.length > 200) ch.log.shift(); }
function raiseAlert(ch, sev, text){ if (S.alerts.some(a => !a.ack && a.text === text)) return; S.alerts.push({ id:uid('a'), ts:ts(), ch: ch && ch.id, sev, text, ack:false }); if (S.alerts.length > 100) S.alerts.shift(); }
function mrnOf(m){ const pid = m.ok && m.segs.find(s => s.id === 'PID'); if (!pid) return ''; const r = (pid.fields[2]||'').split(m.d.rep).map(x => x.split(m.d.comp)); const mr = r.find(c => c[4] === 'MR'); return mr ? mr[0] : ''; }
function newRec(ch, raw){ const m = hl7Parse(raw); return { id: uid('m'), ch: ch.id, ts: ts(), raw, ctrl: m.ok ? hl7Get(m,'MSH-10') : '', mrn: mrnOf(m), type: m.ok ? hl7Get(m,'MSH-9.1')+'^'+hl7Get(m,'MSH-9.2') : '?', fac: m.ok ? hl7Get(m,'MSH-4') : '', status:'RECEIVED', steps:[], dests:[], skip:[], ack:'', ackText:'', errs:[], ...(HE_BGNOW ? { bg:true } : {}) }; }

/* ---------------- Pipeline ---------------- */
function ruleMatch(m, r){
  const v = hl7Get(m, r.path) || ''; const list = () => String(r.value).split(',').map(x => x.trim());
  switch (r.op){
    case 'eq': return v === r.value; case 'ne': return v !== r.value;
    case 'in': return list().includes(v); case 'notin': return !list().includes(v);
    case 'empty': return !v; case 'notempty': return !!v;
    case 'matches': try { return new RegExp(r.value).test(v); } catch(e){ return false; }
  } return false;
}
async function passes(m, f){
  const rules = (f && f.rules) || [];
  let ok = !rules.length || (f.logic === 'any' ? rules.some(r => ruleMatch(m, r)) : rules.every(r => ruleMatch(m, r)));
  if (ok && f && f.js && f.js.trim()){ const out = await runSandbox(f.js, Object.assign(clone(m), { accept:true })); ok = out.accept !== false; }
  return ok;
}
function fmtDate(v){ let r;
  if ((r = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v))) return r[3]+r[1].padStart(2,'0')+r[2].padStart(2,'0');
  if ((r = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(v))) return r[1]+r[2]+r[3]+(r[4]?r[4]+r[5]+(r[6]||''):'');
  return v; }
function fmtPhone(rep, d){ const c = rep.split(d.comp); if (!c[0] || c[6]) return rep; const dg = c[0].replace(/\D/g,''); if (dg.length !== 10) return rep; return ['', c[1]||'PRN', c[2]||'PH', '', '', dg.slice(0,3), dg.slice(3)].join(d.comp); }

async function applyTransforms(work, list){
  for (const t of list || []){
    const m = work.m;
    if (t.kind === 'map') hl7Set(m, t.target, resolveSource(t.source, m, S.tables));
    else if (t.kind === 'lookup'){ const ps = parsePath(t.target); if (ps && !m.segs.some(x => x.id === ps.seg)) continue; /* no such segment in this message: nothing to look up */ const tb = S.tables[t.table]; if (!tb) throw new Error('Unknown code table "'+t.table+'"'); const k = hl7Get(m, t.source||t.target)||''; hl7Set(m, t.target, tb[k] !== undefined ? tb[k] : (tb['*'] !== undefined ? tb['*'] : k)); }
    else if (t.kind === 'date'){ const v = hl7Get(m, t.target); if (v) hl7Set(m, t.target, fmtDate(v)); }
    else if (t.kind === 'phone'){ const p = parsePath(t.target); if (!p) throw new Error('Bad path '+t.target); const seg = m.segs.find(s => s.id === p.seg); if (seg && seg.fields[p.f-1]) seg.fields[p.f-1] = seg.fields[p.f-1].split(m.d.rep).map(r => fmtPhone(r, m.d)).join(m.d.rep); }
    else if (t.kind === 'ssn'){ const v = hl7Get(m, t.target); if (v) hl7Set(m, t.target, t.mode === 'remove' ? '' : 'XXX-XX-' + v.replace(/\D/g,'').slice(-4)); }
    else if (t.kind === 'zseg'){ const id = String(t.seg||'').toUpperCase(); if (!/^Z[A-Z0-9]{2}$/.test(id)) throw new Error('Z-segment name must be Z + 2 letters/digits, e.g. ZBB'); m.segs = m.segs.filter(s => s.id !== id); m.segs.push({ id, fields: String(t.fields||'').split(',').map(x => resolveSource(x.trim(), m, S.tables)) }); }
    else if (t.kind === 'remove'){ m.segs = m.segs.filter(s => s.id !== String(t.seg||'').toUpperCase()); }
    else if (t.kind === 'js'){ const out = await runSandbox(t.code, m); work.m = Object.assign(m, out); }

  }
  return work;
}
const showWork = w => w.fhir ? JSON.stringify(w.fhir, null, 2) : hl7Serialize(w.m);
function workFrom(rec, e){ return /^\s*\{/.test(e.out) ? { m: hl7Parse(rec.raw), fhir: JSON.parse(e.out) } : { m: hl7Parse(e.out), fhir:null }; }
function deliver(ch, rec, d, work, attempts){
  const r = partnerReceive(d.type, work, S);
  const ent = { id:d.id, name:d.name, type:d.type, out: showWork(work), attempts: attempts||1, resp:r.text, status: r.ok ? 'SENT' : (r.conn ? 'QUEUED' : 'ERROR'), ack: r.ack || (r.http ? String(r.http) : '') };
  /* Each destination keeps the ACK that partner actually sent back: MSA-1 read from its own response (HTTP status for FHIR/HTTP).
     A delivery that did not succeed never carries AA; no response means no ACK (ack '', noAck true) and the engine-side reason stays in resp. */
  { const v = v2AckWhy(r.text); if (v) ent.ack = v.code; if (ent.status !== 'SENT' && ent.ack === 'AA') ent.ack = ''; if (r.conn && !v) ent.ack = ''; ent.noAck = !ent.ack; }
  if (r.ok && d.type === 'file'){ (S.outbox[d.id] = S.outbox[d.id] || []).push({ ts:ts(), msg:rec.id, text: ent.out }); if (S.outbox[d.id].length > 30) S.outbox[d.id].shift(); }
  if (r.conn){
    if (!d.queue && ent.attempts > (d.retries||0)){ ent.status = 'ERROR'; logc(ch,'E',d.name+': unreachable after '+ent.attempts+' attempt(s); '+rec.ctrl+' errored.'); raiseAlert(ch,'E',ch.live.name+' → '+d.name+' unreachable.'); }
    else { if (!ch.queue.some(q => q.msg===rec.id && q.dest===d.id)) ch.queue.push({ msg:rec.id, dest:d.id }); logc(ch,'W',d.name+': connection refused, '+rec.ctrl+' queued (attempt '+ent.attempts+').'); raiseAlert(ch,'W',ch.live.name+' → '+d.name+' unreachable; messages are queuing.'); }
  } else if (!r.ok){ logc(ch,'E',d.name+' returned '+(ent.ack||'error')+' for '+rec.ctrl+'.'); raiseAlert(ch,'W',ch.live.name+' → '+d.name+' is rejecting messages ('+ent.ack+'). See the error queue.'); }
  return ent;
}
function finalize(rec){ const st = rec.dests.map(d => d.status); rec.status = !st.length ? 'FILTERED' : st.includes('ERROR') ? 'ERROR' : st.includes('QUEUED') ? 'QUEUED' : 'SENT'; }
/* Runs transformers one at a time and records which fields each step changed (shown in the message Compare tab). */
function flatWork(w){ return w.fhir ? flatJson(w.fhir) : flatV2(hl7Serialize(w.m)); }
function flatV2(raw){ const m = hl7Parse(raw), out = {}; if (!m.ok) return out; const cnt = {};
  for (const sg of m.segs){ cnt[sg.id] = (cnt[sg.id]||0)+1; const sid = sg.id + (cnt[sg.id] > 1 ? '['+cnt[sg.id]+']' : '');
    sg.fields.forEach((f, i) => { if (f === '') return; const base = sid+'-'+(i+1); if (sg.id === 'MSH' && i < 2){ out[base] = f; return; }
      const reps = f.split(m.d.rep); reps.forEach((r, ri) => { const rb = base + (reps.length > 1 ? '['+(ri+1)+']' : ''); const cs = r.split(m.d.comp);
        if (cs.length === 1 && r.indexOf(m.d.sub) < 0){ if (r !== '') out[rb] = r; return; }
        cs.forEach((c2, ci) => { if (c2 === '') return; const ss = c2.split(m.d.sub); if (ss.length === 1) out[rb+'.'+(ci+1)] = c2; else ss.forEach((x, si) => { if (x !== '') out[rb+'.'+(ci+1)+'.'+(si+1)] = x; }); }); }); }); }
  return out; }
function flatJson(o, pre, out){ out = out || {}; pre = pre || '';
  if (Array.isArray(o)) o.forEach((v, i) => flatJson(v, pre+'['+i+']', out));
  else if (o && typeof o === 'object') Object.keys(o).forEach(k => flatJson(o[k], pre ? pre+'.'+k : k, out));
  else if (o !== undefined && o !== null && o !== '') out[pre] = String(o);
  return out; }
function diffFlat(a, b){ const ch = []; for (const k of Object.keys(b)) if (!(k in a)) ch.push(['added', k]); else if (a[k] !== b[k]) ch.push(['changed', k]); for (const k of Object.keys(a)) if (!(k in b)) ch.push(['removed', k]); return ch; }
async function traceTransforms(work, list, where){ const tr = [];
  for (let i = 0; i < (list||[]).length; i++){ const t = list[i]; const before = flatWork(work), wasFhir = !!work.fhir;
    await applyTransforms(work, [t]);
    const lbl = where + ' transformer ' + (i+1) + ': ' + ((typeof TKINDS !== 'undefined' && (TKINDS.find(k => k[0] === t.kind)||[])[1]) || t.kind);
    tr.push({ step: lbl, conv: !wasFhir && !!work.fhir, ch: (!wasFhir && work.fhir) ? [] : diffFlat(before, flatWork(work)).slice(0, 200) }); }
  return tr; }
function count(ch, rec){ if (rec.status === 'FILTERED') ch.stats.filt++; else if (rec.status === 'SENT') ch.stats.sent++; else if (rec.status === 'ERROR') ch.stats.err++; }
async function processMsg(ch, raw, how){
  const c = ch.live; const rec = newRec(ch, raw); rec.how = how || 'mllp'; rec.version = ch.version;
  const m = hl7Parse(raw); ch.stats.recv++;
  const verrs = hl7Validate(m); const hard = verrs.filter(e => e.sev === 'E');
  const structural = !m.ok || hard.some(e => /^MSH/.test(e.loc) || /^Segment/.test(e.loc));
  rec.steps.push({ name:'Received', text: raw });
  const ack = buildAck(m, c.ack.validate ? verrs : verrs.filter(e => /^MSH/.test(e.loc) || /^Segment/.test(e.loc)));
  rec.ack = ack.code; rec.ackText = ack.text; rec.errs = verrs;
  const fail = text => { rec.status = 'ERROR'; rec.err = text; ch.stats.err++; S.messages.push(rec); return rec; };
  if (structural){ logc(ch,'E','Rejected '+(rec.ctrl||'(no control ID)')+' with AR.'); return fail('Rejected on receipt (AR): ' + (hard[0] ? hard[0].loc + ' ' + hard[0].msg : 'not a valid HL7 message')); }
  if (c.ack.validate && hard.length){ logc(ch,'E',rec.ctrl+' failed validation, sent AE.'); return fail('Inbound validation failed (AE): ' + hard.map(e => e.loc).join(', ')); }
  try {
    if (!(await passes(m, c.filter))){ rec.status = 'FILTERED'; rec.steps.push({ name:'Filter', text:'Filtered out by channel filter.' }); ch.stats.filt++; S.messages.push(rec); return rec; }
    const work = { m: hl7Parse(raw), fhir:null }; rec.trace = await traceTransforms(work, c.transforms, 'Channel');
    rec.work = showWork(work); rec.steps.push({ name:'Channel transformers', text: rec.work });
    for (const d of c.dests){
      if (!d.enabled){ rec.skip.push({ id:d.id, name:d.name, type:d.type, why:'disabled' }); continue; }
      const dm = { m: hl7Parse(hl7Serialize(work.m)), fhir: work.fhir ? clone(work.fhir) : null };
      if (!(await passes(dm.m, d.filter))){ rec.steps.push({ name:d.name+' filter', text:'Not routed (destination filter).' }); rec.skip.push({ id:d.id, name:d.name, type:d.type, why:'filtered' }); continue; }
      (rec.dtrace = rec.dtrace || {})[d.id] = await traceTransforms(dm, d.transforms, d.name);
      rec.dests.push(deliver(ch, rec, d, dm));
    }
  } catch(e){ logc(ch,'E','Transformer error on '+rec.ctrl+': '+(e.message||e)); raiseAlert(ch,'E',ch.live.name+': transformer error: '+(e.message||e)); return fail('Transformer error: '+(e.message||e)); }
  finalize(rec); count(ch, rec); S.messages.push(rec); return rec;
}
function processQueue(ch, manual){
  if (ch.state !== 'started' || !ch.live) return 0; let n = 0;
  for (const q of ch.queue.slice()){
    const rec = S.messages.find(x => x.id === q.msg); const d = ch.live.dests.find(x => x.id === q.dest);
    const prev = rec && rec.dests.find(x => x.id === q.dest);
    if (!rec || !d || !prev){ ch.queue = ch.queue.filter(x => x !== q); continue; }
    const ent = deliver(ch, rec, d, workFrom(rec, prev), (prev.attempts||0) + 1);
    Object.assign(prev, ent);
    if (ent.status !== 'QUEUED'){ ch.queue = ch.queue.filter(x => x !== q); n++; const was = rec.status; finalize(rec); if (rec.status !== was) count(ch, rec); if (manual) rec.fromQueue = true; }
  }
  if (n) logc(ch,'I','Queue: '+n+' message(s) delivered or resolved.');
  return n;
}
async function reprocess(recId){ const rec = S.messages.find(x => x.id === recId); const ch = chById(rec.ch);
  if (!ch.live) { toast('Deploy the channel first.'); return null; } if (ch.state !== 'started') { toast('Start the channel first.'); return null; }
  const nr = await processMsg(ch, rec.raw, 'reprocess'); nr.reprocessOf = rec.id; rec.reprocessedTo = nr.id;
  if (rec.status === 'ERROR' || rec.status === 'QUEUED'){ rec.status = 'REPROCESSED'; ch.queue = ch.queue.filter(q => q.msg !== rec.id); }
  logc(ch,'I','Reprocessed '+(rec.ctrl||'message')+' → '+nr.status+'.'); save(); return nr; }
function resend(recId){ const rec = S.messages.find(x => x.id === recId); const ch = chById(rec.ch);
  if (!ch.live || ch.state !== 'started'){ toast('The channel must be deployed and started.'); return null; }
  if (!rec.dests.length){ toast('Nothing to resend: this message never reached a destination. Use Reprocess.'); return null; }
  rec.version = ch.version; for (const e of rec.dests){ if (e.status === 'SENT') continue; const d = ch.live.dests.find(x => x.id === e.id); if (!d) continue; Object.assign(e, deliver(ch, rec, d, workFrom(rec, e), (e.attempts||0)+1)); }
  ch.queue = ch.queue.filter(q => !(q.msg === rec.id && rec.dests.some(e => e.id === q.dest && e.status !== 'QUEUED')));
  const was = rec.status; finalize(rec); if (rec.status !== was) count(ch, rec); logc(ch,'I','Resent '+rec.ctrl+' (stored transformed output) → '+rec.status+'.'); save(); return rec; }

/* ---------------- Inbound: MLLP feed, file drop, HTTP ---------------- */
function listener(port){ return S.channels.find(c => c.live && c.state === 'started' && c.live.source.type === 'mllp' && +c.live.source.port === +port); }
async function simSend(kind, opt){
  const raw = genMsg(kind, opt); const port = FEEDS[kind]; const ch = listener(port); S.sim.sent++;
  const line = { ts:ts(), port, kind, ctrl: (/\|((?:PMC|PMN)-[A-Z]{3}-\d+)\|/.exec(raw)||[])[1] || '(none)' };
  if (!ch){ S.sim.refused++; line.res = 'refused: no started channel on :'+port; S.sim.log.unshift(line); S.sim.log = S.sim.log.slice(0,40); return null; }
  const rec = await processMsg(ch, raw, 'mllp'); line.res = 'ACK '+rec.ack+' from '+ch.live.name+(rec.status === 'ERROR' && rec.ack === 'AA' ? ' (receipt) · delivery failed: '+errWhy(rec).map(w => w.code).join(', ') : ''); if (rec.ack !== 'AA') S.sim.naks++;
  S.sim.log.unshift(line); S.sim.log = S.sim.log.slice(0,40); return rec;
}
function splitBatch(text){ return String(text).replace(/\r\n|\n/g,'\r').split('\r').filter(l => !/^(FHS|BHS|BTS|FTS)/.test(l)).join('\r').split(/\r(?=MSH)/).map(x => x.replace(/^\r+|\r+$/g,'')).filter(x => /^MSH/.test(x)); }
async function fileDrop(ch, text){ const out = []; for (const r of splitBatch(text)) out.push(await processMsg(ch, r, 'file')); return out; }
async function httpPost(ch, body){
  const t = String(body).trim();

  const rec = await processMsg(ch, t, 'http'); return { status: rec.ack === 'AA' ? 200 : 400, text: (rec.ack === 'AA' ? '200 OK' : '400 Bad Request')+'\n'+showSeg(rec.ackText), rec };
}

/* ---------------- Traffic ticker ---------------- */
let TICK = null;
async function tick(){
  if (!heTickLeader()) return; if (heStoredRev() !== HE_REV) heReload(); HE_BUSY++; try { await tickBody(); } finally { HE_BUSY--; } }
async function tickBody(){
  let busy = false;
  for (const ch of S.channels) if (ch.queue.length && ch.state === 'started'){ processQueue(ch, false); busy = true; }
  if (S.sim.on){ busy = true;
    for (let i=0;i<S.sim.rate;i++){
      const kind = pick(['ADT','ADT','ADT','ORM','ORM','ORU']); const opt = {};
      if (S.sim.bad && Math.random() < .12) opt.bad = pick(['nomrn','noctrl','sex','junk']);
      if (kind === 'ADT' && Math.random() < .15) opt.north = true;
      if (kind === 'ADT' && Math.random() < .08) opt.proc = 'T';
      HE_BGNOW = true; try { await simSend(kind, opt); } finally { HE_BGNOW = false; } // background traffic is tagged bg (see heTrim)
    }
  }
  for (const ch of S.channels) if (ch.queue.length > 10) raiseAlert(ch,'W',(ch.live||ch.draft).name+': queue depth over 10.');
  if (busy){ save(true); render(true); }
}
function startTicker(){ if (!TICK) TICK = setInterval(tick, 3000); }

/* ---------------- Work tickets ---------------- */
const destsOf = (ch, type) => (ch && ch.live) ? ch.live.dests.filter(d => d.type === type && d.enabled) : [];
/* Ticket evidence: the learner's own messages (test sends, samples, resends, reprocessing) win over background traffic. */
/* Ticket checks only look at traffic through the channel's currently deployed version: messages from earlier attempts
   (or from a restored save) can neither block a correct fix nor close a ticket for a wrong one. Every deploy, rollback and
   promotion creates a new version number; Reprocess creates a new message on the current version, Resend re-stamps it. */
const curVer = chId => { const c = (S.channels||[]).find(x => x.id === chId); return c ? c.version : undefined; };
/* Strict only while the ticket being checked is open (Check / Resolve & close). A closed ticket keeps its earlier evidence, so
   later deploys for other tickets don't un-solve it when it is re-verified. */
let CUR_TK = null; const verOk = (m, chId) => !CUR_TK || tClosedSafe(CUR_TK.id) || m.version === curVer(chId);
function tClosedSafe(id){ try { return tClosed(id); } catch(e){ return false; } }
const recent = (chId, f, n) => { const l = S.messages.filter(m => m.ch === chId && verOk(m, chId) && f(m)); const own = l.filter(m => !m.bg); return (own.length ? own : l).slice(-(n||60)); };
const dEnt = (rec, type) => rec.dests.find(d => d.type === type);
const P8 = out => (hl7Get(hl7Parse(out||''),'PID-8')||'');
const TICKET_FROM = {};

const TICKETS = [
];
function ticketStatus(t){ let r; const prevTk = CUR_TK; CUR_TK = t; try { r = t.check(); } catch(e){ r = 'Check failed: '+e.message; } finally { CUR_TK = prevTk; }
  if (r !== true && typeof r === 'string'){ const cid = TCH[t.id]; const c = cid && cid[0] !== '@' && (S.channels||[]).find(x => x.id === cid);
    if (c && c.live && !tClosedSafe(t.id) && !S.messages.some(m => m.ch === cid && m.version === c.version && !m.bg) && !/deployed version/.test(r)) r += ' (Only messages processed by the deployed version '+c.version+' of '+(c.live.name||c.name||cid)+' count. Messages from before your last deploy are ignored, so press "Send test messages" again.)'; }
  return r; }

/* ---------------- UI ---------------- */
let VIEW = { tab:'dash', ch:null, ctab:'summary', msg:null, mtab:'raw', q:{}, ticket:null };
const MOBILE = () => window.matchMedia('(max-width: 760px)').matches;
const RO = () => (typeof envLocked==='function' && envLocked()) ? ' disabled' : '';
const q_ = s => String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
function toast(t){ const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2800); }
function badge(st){ return '<span class="bdg b-'+String(st).toLowerCase()+'">'+esc(st)+'</span>'; }
function go(tab, x){ VIEW.tab = tab; Object.assign(VIEW, x||{}); history.replaceState(null, '', '#'+tab+(tab==='channel'&&VIEW.ch?'/'+VIEW.ch:'')); closeNav(); render(); window.scrollTo(0,0); }
function closeNav(){ document.body.classList.remove('navopen'); }
function chName(c){ return (c.live||c.draft).name; }
function nav(){ const errs = S.messages.filter(m => m.status === 'ERROR').length, al = S.alerts.filter(a => !a.ack).length, done = TICKETS.filter(t => tClosed(t.id)).length;
  const items = [['dash','Dashboard',''],['channels','Channels',''],['messages','Messages',''],['errors','Error queue',errs],['alerts','Alerts',al],['tables','Code tables',''],['sim','Sending systems',S.sim.on?'on':''],['settings','Settings','']];
  $('nav').innerHTML = items.map(([k,l,n]) => '<a href="#'+k+'" data-tab="'+k+'" class="'+(VIEW.tab===k||(k==='channels'&&VIEW.tab==='channel')?'on':'')+'" onclick="go(\''+k+'\');return false">'+l+(n!==''&&n!==0?'<span class="cnt'+(k==='errors'||k==='alerts'?' red':'')+'">'+n+'</span>':'')+'</a>').join('');
  $('simState').innerHTML = '<span class="pl">Traffic: </span>' + (S.sim.on ? 'streaming' : 'paused'); $('simState').title = S.sim.on ? 'Simulated traffic: streaming' : 'Simulated traffic: paused'; $('simState').className = 'pill' + (S.sim.on ? ' live' : '');
}
function render(soft){
  nav(); const v = $('view'); const f = document.activeElement;
  if (soft && f && v.contains(f) && /INPUT|TEXTAREA|SELECT/.test(f.tagName)){ HE_RPEND = true; return; }
  if (soft && document.querySelector('dialog[open]')){ HE_RPEND = true; return; } HE_RPEND = false;
  const R = { dash:vDash, channels:vChannels, channel:vChannel, messages:vMessages, errors:vErrors, alerts:vAlerts, tables:vTables, sim:vSim, tickets:vTickets, settings:vSettings }[VIEW.tab] || vDash;
  const html = (typeof envNote==='function' ? envNote() : '') + R();
  if (soft && html === HE_HTML) return; // background re-sync with nothing new to show: leave the page untouched
  const snap = soft ? heSnap(v) : null; v.innerHTML = html; HE_HTML = html; if (snap) heRestore(v, snap);
}
/* A background re-render must not disturb the user: keep the page and every scrolled pane where it was,
   keep <details> open/closed, and keep focus and text selection. Elements are matched by id, else by
   tag + class + position among their look-alikes. */
let HE_HTML = null;
function heKey(el, root){ if (el.id) return '#'+el.id; const sig = el.tagName+'.'+(typeof el.className === 'string' ? el.className.replace(/\s*\b(sel|on|open)\b/g,'').trim() : '');
  let n = 0; for (const x of root.getElementsByTagName(el.tagName)){ if (x === el) break; if ((x.tagName+'.'+(typeof x.className === 'string' ? x.className.replace(/\s*\b(sel|on|open)\b/g,'').trim() : '')) === sig) n++; } return sig+'@'+n; }
function heFind(root, k){ if (k[0] === '#') return root.querySelector('#'+CSS.escape(k.slice(1))); const at = k.lastIndexOf('@'), sig = k.slice(0, at), n = +k.slice(at+1), tag = sig.split('.')[0]; let i = 0;
  for (const x of root.getElementsByTagName(tag)){ if ((x.tagName+'.'+(typeof x.className === 'string' ? x.className.replace(/\s*\b(sel|on|open)\b/g,'').trim() : '')) === sig){ if (i === n) return x; i++; } } return null; }
function heSnap(v){ const sc = document.scrollingElement || document.documentElement; const s = { x: window.scrollX, y: window.scrollY, panes: [], det: [], focus: null, root: v.scrollTop };
  v.querySelectorAll('*').forEach(el => { if (el.scrollTop || el.scrollLeft) s.panes.push([heKey(el, v), el.scrollTop, el.scrollLeft]); if (el.tagName === 'DETAILS') s.det.push([heKey(el, v), el.open]); });
  const a = document.activeElement; if (a && a !== v && v.contains(a)){ s.focus = [heKey(a, v)]; try { if (typeof a.selectionStart === 'number') s.focus.push(a.selectionStart, a.selectionEnd); } catch(e){} }
  const sel = window.getSelection && window.getSelection(); if (sel && sel.rangeCount && !sel.isCollapsed && v.contains(sel.anchorNode)) s.text = String(sel);
  s.h = sc.scrollHeight; return s; }
function heRestore(v, s){ s.det.forEach(([k, o]) => { const el = heFind(v, k); if (el) el.open = o; });
  s.panes.forEach(([k, t, l]) => { const el = heFind(v, k); if (el){ el.scrollTop = t; el.scrollLeft = l; } }); v.scrollTop = s.root;
  if (s.focus){ const el = heFind(v, s.focus[0]); if (el && el.focus){ el.focus({ preventScroll:true }); if (s.focus.length > 1) try { el.setSelectionRange(s.focus[1], s.focus[2]); } catch(e){} } }
  if (s.text){ const w = document.createTreeWalker(v, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())){ const i = n.nodeValue.indexOf(s.text); if (i >= 0){ const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + s.text.length); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); break; } } }
  window.scrollTo(s.x, s.y); }
function chActs(c){ const b = [];
  if (!c.live) b.push('<button class="btn sm" onclick="deploy(\''+c.id+'\')">Deploy</button>');
  else { if (c.state === 'started') b.push('<button class="btn sm" onclick="setState(\''+c.id+'\',\'stopped\')">Stop</button>'); else b.push('<button class="btn sm pri" onclick="setState(\''+c.id+'\',\'started\')">Start</button>');
    if (c.queue.length) b.push('<button class="btn sm" onclick="runQueue(\''+c.id+'\')">Process queue</button>'); }
  return b.join(' '); }
function vDash(){
  const rows = S.channels.map(c => { const st = c.live ? c.state : 'undeployed'; const k = c.live||c.draft;
    return '<tr><td><a href="#" onclick="go(\'channel\',{ch:\''+c.id+'\',ctab:\'summary\'});return false"><b>'+esc(k.name)+'</b></a><div class="sub">'+esc(k.source.type.toUpperCase())+(k.source.type==='mllp'?' :'+k.source.port:'')+' · v'+c.version+(c.live&&JSON.stringify(c.draft)!==JSON.stringify(c.live)?' · <span class="warn">undeployed changes</span>':'')+'</div></td><td>'+badge(st)+'</td><td class="n">'+c.stats.recv+'</td><td class="n">'+c.stats.filt+'</td><td class="n">'+c.stats.sent+'</td><td class="n '+(c.stats.err?'bad':'')+'">'+c.stats.err+'</td><td class="n '+(c.queue.length?'warn':'')+'">'+c.queue.length+'</td><td class="act">'+chActs(c)+'</td></tr>'; }).join('');
  const al = S.alerts.filter(a => !a.ack).slice(-3).reverse();
  return '<div class="hd"><h1>Dashboard</h1><div class="sp"></div>'+(false?'':'<button class="btn" onclick="toggleSim()">'+(S.sim.on?'Pause traffic':'Start traffic')+'</button>')+'</div>'+
    (al.length ? '<div class="card">'+al.map(a => '<div class="al s-'+a.sev+'">'+esc(a.text)+' <span class="sub">'+fmtT(a.ts)+'</span></div>').join('')+'<a href="#" onclick="go(\'alerts\');return false">All alerts →</a></div>' : '')+
    '<div class="card scrollx"><table class="tbl"><thead><tr><th>Channel</th><th>Status</th><th class="n">Received</th><th class="n">Filtered</th><th class="n">Sent</th><th class="n">Errored</th><th class="n">Queued</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div class="grid3"><div class="card kpi"><div class="sub">Sending systems</div><b>'+(S.sim.on?'Streaming':'Paused')+'</b><div class="sub">'+S.sim.sent+' sent · '+S.sim.naks+' NAKed · '+S.sim.refused+' refused</div></div><div class="card kpi"><div class="sub">Error queue</div><b>'+S.messages.filter(m=>m.status==='ERROR').length+'</b><div class="sub">messages waiting for you</div></div></div>';
}
function vChannels(){ return '<div class="hd"><h1>Channels</h1><div class="sp"></div>'+(RO()||S.channels.length>=MAX_CH?'':('<button class="btn pri" onclick="newChannel()">New channel</button>'))+(SB?'<span class="sub">'+S.channels.length+' / '+MAX_CH+' channels</span>':'')+'</div>'+S.channels.map(c => { const k = c.live||c.draft; return '<div class="card row" onclick="go(\'channel\',{ch:\''+c.id+'\',ctab:\'summary\'})"><div><b>'+esc(k.name)+'</b> <span class="sub">v'+c.version+'</span><div class="sub">'+esc(k.desc||'')+'</div><div class="sub">'+esc(k.source.type.toUpperCase())+(k.source.type==='mllp'?' :'+k.source.port:'')+' → '+(k.dests.map(d=>esc(d.name)+(d.enabled?'':' (off)')).join(', ')||'no destinations')+'</div></div><div>'+badge(c.live?c.state:'undeployed')+'</div></div>'; }).join(''); }

/* --- channel editor --- */
const OPS = [['eq','equals'],['ne','does not equal'],['in','is in list'],['notin','is not in list'],['empty','is empty'],['notempty','is not empty'],['matches','matches regex']];
const TKINDS = [['map','Field mapping'],['lookup','Code-table lookup'],['date','Date format → YYYYMMDD'],['phone','Phone format (XTN components)'],['ssn','SSN mask/remove'],['zseg','Add Z-segment'],['remove','Remove segment'],['js','JavaScript (sandbox)']];
function D(){ return chById(VIEW.ch).draft; }
function rulesHtml(f, base){ const ro = RO();
  return '<div class="rules">'+(f.rules.length?'':'<div class="sub">No rules: everything passes.</div>')+f.rules.map((r,i) => '<div class="rrow"><input aria-label="Field path" value="'+esc(r.path)+'" placeholder="e.g. MSH-9.1" onchange="edit(\''+base+'.rules.'+i+'.path\',this.value.trim().toUpperCase())"'+ro+'><select aria-label="Operator" onchange="edit(\''+base+'.rules.'+i+'.op\',this.value)"'+ro+'>'+OPS.map(o=>'<option value="'+o[0]+'"'+(o[0]===r.op?' selected':'')+'>'+o[1]+'</option>').join('')+'</select>'+(['empty','notempty'].includes(r.op)?'<span></span>':'<input aria-label="Value" value="'+esc(r.value||'')+'" placeholder="value" onchange="edit(\''+base+'.rules.'+i+'.value\',this.value.trim())"'+ro+'>')+(ro?'':'<button class="x" title="Remove rule" onclick="delAt(\''+base+'.rules\','+i+')">×</button>')+'</div>').join('')+
    (ro?'':'<div class="rbar"><button class="btn sm" onclick="addRule(\''+base+'\')">+ Rule</button> '+(f.rules.length>1?'<label class="sub">Combine <select onchange="edit(\''+base+'.logic\',this.value)"><option value="all"'+(f.logic!=='any'?' selected':'')+'>all rules (AND)</option><option value="any"'+(f.logic==='any'?' selected':'')+'>any rule (OR)</option></select></label>':'')+'</div>')+'</div>'; }
function transHtml(list, base){ const ro = RO();
  return (list.length?'':'<div class="sub">No transformers: the message passes through unchanged.</div>')+list.map((t,i) => { const p = base+'.'+i+'.'; let f = '';
    const inp = (k, ph, w) => '<input class="'+(w||'')+'" aria-label="'+k+'" value="'+esc(t[k]||'')+'" placeholder="'+esc(ph)+'" onchange="edit(\''+p+k+'\',this.value.trim())"'+ro+'>';
    if (t.kind==='map') f = '<span class="sub">target</span> '+inp('target','PID-18')+' <span class="sub">← source</span> '+inp('source',"PID-3[2] · 'CONSTANT' · lookup(TABLE, PID-8) · NOW()",'wide');
    else if (t.kind==='lookup') f = '<span class="sub">target</span> '+inp('target','PID-8')+' <span class="sub">table</span> <select aria-label="table" onchange="edit(\''+p+'table\',this.value)"'+ro+'>'+['',...Object.keys(S.tables)].map(k=>'<option'+(k===t.table?' selected':'')+'>'+esc(k)+'</option>').join('')+'</select> <span class="sub">key from</span> '+inp('source','same as target');
    else if (['date','phone','ssn'].includes(t.kind)) f = '<span class="sub">target</span> '+inp('target',t.kind==='date'?'PID-7':t.kind==='phone'?'PID-13':'PID-19')+(t.kind==='ssn'?' <select aria-label="mode" onchange="edit(\''+p+'mode\',this.value)"'+ro+'><option value="mask"'+(t.mode!=='remove'?' selected':'')+'>mask → XXX-XX-1234</option><option value="remove"'+(t.mode==='remove'?' selected':'')+'>remove</option></select>':'');
    else if (t.kind==='zseg') f = '<span class="sub">segment</span> '+inp('seg','ZBB')+' <span class="sub">fields</span> '+inp('fields',"'1', PV1-3.1, PV1-3.3",'wide');
    else if (t.kind==='remove') f = '<span class="sub">segment</span> '+inp('seg','NTE');
    else if (t.kind==='js') f = '<textarea rows="4" spellcheck="false" aria-label="JavaScript" onchange="edit(\''+p+'code\',this.value)"'+ro+' placeholder="set(\'PID-5.1\', get(\'PID-5.1\').toUpperCase());">'+esc(t.code||'')+'</textarea><div class="sub">Runs in a sandboxed Web Worker (1 s limit) with get(path), set(path, value), removeSegment(id) and msg. It has no access to the page or the network.</div>';

    return '<div class="tr"><div class="trh"><b>'+(i+1)+'. '+esc((TKINDS.find(k=>k[0]===t.kind)||[0,t.kind])[1])+'</b><span class="sp"></span>'+(ro?'':'<button class="x" onclick="moveAt(\''+base+'\','+i+',-1)" title="Move up">↑</button><button class="x" onclick="delAt(\''+base+'\','+i+')" title="Remove">×</button>')+'</div><div class="trb">'+f+'</div></div>'; }).join('')+
    (ro?'':'<div class="rbar"><select aria-label="Transformer type" id="tk-'+base.replace(/\W/g,'')+'">'+TKINDS.map(k=>'<option value="'+k[0]+'">'+k[1]+'</option>').join('')+'</select> <button class="btn sm" onclick="addTrans(\''+base+'\')">+ Add transformer</button></div>'); }
function destStats(c){ const list = (c.live || c.draft).dests || []; if (!list.length) return ''; const msgs = S.messages.filter(m => m.ch === c.id);
  const rows = list.map(d => { const n = { SENT:0, ERROR:0, QUEUED:0, skip:0 }; msgs.forEach(m => { const e = allDests(m).find(x => x.id === d.id); if (!e) return; if (e.skipped) n.skip++; else if (n[e.status] !== undefined) n[e.status]++; });
    return '<tr><td><b>'+esc(d.name)+'</b>'+(d.enabled?'':' <span class="dchip d-disabled">disabled</span>')+'</td><td>'+n.SENT+'</td><td>'+(n.ERROR?'<b class="errn">'+n.ERROR+'</b>':'0')+'</td><td>'+n.QUEUED+'</td><td>'+n.skip+'</td></tr>'; }).join('');
  return '<div class="card mt"><b>By destination</b> <span class="sub">every destination of this channel, counted from the stored messages</span><div class="scrollx"><table class="tbl"><thead><tr><th>Destination</th><th>Sent</th><th>Errored</th><th>Queued</th><th>Not routed / disabled</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'; }
function vChannel(){
  const c = chById(VIEW.ch); if (!c) return vChannels(); const d = c.draft; const dirty = !c.live || JSON.stringify(c.draft) !== JSON.stringify(c.live); const ro = RO();
  const tabs = [['summary','Summary'],['source','Source'],['filter','Filter'],['transform','Transformers'],['dests','Destinations ('+d.dests.length+')'],['history','History'],['log','Channel log']];
  let body = '';
  if (VIEW.ctab === 'summary'){
    body = '<div class="form"><label>Name<input value="'+esc(d.name)+'" onchange="edit(\'name\',this.value)"'+ro+'></label><label>Description<input value="'+esc(d.desc||'')+'" onchange="edit(\'desc\',this.value)"'+ro+'></label>'+
      '<label class="chk"><input type="checkbox" '+(d.ack.validate?'checked':'')+' onchange="edit(\'ack.validate\',this.checked)"'+ro+'> Validate inbound fields, and reply AE (and stop) on field errors</label></div>'+
      '<div class="sub">The engine always ACKs on receipt (original mode). It replies <b>AR</b> if the message can\'t be used (no MSH, missing MSH-10, bad MSH-7 and so on). With field validation on, it replies <b>AE</b> on field errors. Otherwise it replies <b>AA</b>, and partner systems do their own field checks and send their own ACK/NAK. MSA-2 always echoes the sender\'s MSH-10.</div>'+
      '<div class="grid3 mt"><div class="card kpi"><div class="sub">Received</div><b>'+c.stats.recv+'</b></div><div class="card kpi"><div class="sub">Sent / filtered</div><b>'+c.stats.sent+' / '+c.stats.filt+'</b></div><div class="card kpi"><div class="sub">Errored / queued</div><b>'+c.stats.err+' / '+c.queue.length+'</b></div></div>'+destStats(c)+
      (ro?'':'<div class="mt"><button class="btn" onclick="exportCh(\''+c.id+'\')">Export JSON</button> <button class="btn" onclick="cloneCh(\''+c.id+'\')">Clone</button> <button class="btn danger" onclick="delCh(\''+c.id+'\')">Delete</button></div>');
  } else if (VIEW.ctab === 'source'){
    const s = d.source;
    body = '<div class="form"><label>Source type<select onchange="edit(\'source.type\',this.value)"'+ro+'><option value="mllp"'+(s.type==='mllp'?' selected':'')+'>MLLP listener (TCP, simulated)</option><option value="file"'+(s.type==='file'?' selected':'')+'>File drop</option><option value="http"'+(s.type==='http'?' selected':'')+'>HTTP / FHIR endpoint</option></select></label>'+
      (s.type==='mllp'?'<label>Port<input type="number" value="'+esc(s.port||'')+'" onchange="edit(\'source.port\',+this.value)"'+ro+'></label><div class="sub">MLLP wraps each message as &lt;VT&gt; message &lt;FS&gt;&lt;CR&gt; (0x0B … 0x1C 0x0D) on a TCP connection. Penford feeds: ADT 6661, orders 6662, lab results 6663, scheduling 6664, charges 6665.</div>':'')+'</div>'+
      (s.type==='file'?'<div class="card"><b>Drop a file</b><div class="sub">Paste one or more messages, or an FHS/BHS batch (each MSH starts a new message), or choose a .hl7/.txt file. The channel must be deployed and started.</div><textarea id="dropTxt" rows="7" spellcheck="false"'+ro+'></textarea><div class="rbar"><input type="file" accept=".hl7,.txt" onchange="readDrop(this)"'+ro+'> <button class="btn pri" onclick="doDrop()"'+ro+'>Process file</button></div><pre id="dropOut" class="out"></pre></div>':'')+
      (s.type==='http'?'<div class="card"><b>Test request</b> <span class="sub">POST HL7 text. The channel must be deployed and started.</span><textarea id="httpTxt" rows="8" spellcheck="false"'+ro+'>{\n  "resourceType": "Patient",\n  "identifier": [{ "value": "10140001" }],\n  "name": [{ "family": "Lopez", "given": ["Ana"] }],\n  "gender": "female",\n  "birthDate": "1990-05-04"\n}</textarea><button class="btn pri" onclick="doHttp()"'+ro+'>Send request</button><pre id="httpOut" class="out"></pre></div>':'')+
      '<div class="sub">Source changes take effect when you deploy.</div>';
  } else if (VIEW.ctab === 'filter'){
    body = '<p class="sub">Messages that fail the channel filter are ACKed but not delivered (status FILTERED). Paths use SEG-field.component, e.g. MSH-9.2 or ORC-7.6.</p>'+rulesHtml(d.filter,'filter')+'<label class="blk">Optional JavaScript (set <code>msg.accept = false</code> to filter out)<textarea rows="3" spellcheck="false" onchange="edit(\'filter.js\',this.value)"'+ro+' placeholder="if (get(\'PV1-2\') === \'P\') msg.accept = false;">'+esc(d.filter.js||'')+'</textarea></label>';
  } else if (VIEW.ctab === 'transform'){
    body = '<p class="sub">Channel transformers run once, in order, before any destination. If only one system needs a change, use a destination transformer (Destinations tab).</p>'+transHtml(d.transforms,'transforms');
  } else if (VIEW.ctab === 'dests'){
    body = (d.dests.length?'':'<div class="sub">No destinations yet.</div>')+d.dests.map((x,i) => '<div class="card dest"><div class="trh"><b>'+esc(x.name)+'</b> <span class="sub">'+esc(PARTNERS[x.type].name)+'</span><span class="sp"></span><label class="chk"><input type="checkbox" '+(x.enabled?'checked':'')+' onchange="edit(\'dests.'+i+'.enabled\',this.checked)"'+ro+'> enabled</label>'+(ro?'':' <button class="x" onclick="delAt(\'dests\','+i+')" title="Remove destination">×</button>')+'</div>'+
      '<details><summary>Partner interface spec</summary><ul>'+PARTNERS[x.type].spec.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></details>'+
      '<div class="form two"><label>Name<input value="'+esc(x.name)+'" onchange="edit(\'dests.'+i+'.name\',this.value)"'+ro+'></label><label>Retries before error (when not queuing)<input type="number" min="0" max="10" value="'+x.retries+'" onchange="edit(\'dests.'+i+'.retries\',+this.value)"'+ro+'></label><label class="chk"><input type="checkbox" '+(x.queue?'checked':'')+' onchange="edit(\'dests.'+i+'.queue\',this.checked)"'+ro+'> Queue while the partner is down (retry every 3 s, in order)</label></div>'+
      '<h4>Destination filter</h4>'+rulesHtml(x.filter,'dests.'+i+'.filter')+'<h4>Destination transformers</h4>'+transHtml(x.transforms,'dests.'+i+'.transforms')+
      (S.outbox[x.id]&&S.outbox[x.id].length?'<details><summary>Outbox: '+S.outbox[x.id].length+' file(s), latest shown</summary><pre class="out">'+esc(showSeg(S.outbox[x.id].slice(-1)[0].text))+'</pre></details>':'')+'</div>').join('')+
      (ro?'':'<div class="rbar"><select id="newDest" aria-label="Destination type">'+Object.keys(PARTNERS).map(k=>'<option value="'+k+'">'+esc(PARTNERS[k].name)+'</option>').join('')+'</select> <button class="btn" onclick="addDest()">+ Add destination</button></div>');
  } else if (VIEW.ctab === 'history'){
    body = '<p class="sub">Each deploy saves a version. Compare versions, or restore one to the draft and deploy it again.</p><div class="scrollx"><table class="tbl"><thead><tr><th>Version</th><th>Deployed</th><th>Note</th><th></th></tr></thead><tbody>'+(c.history.slice().reverse().map(h => '<tr><td>v'+h.v+(h.v===c.version&&c.live?' '+badge('LIVE'):'')+'</td><td class="nw">'+fmtT(h.ts)+'</td><td>'+esc(h.note||'')+'</td><td class="act">'+(h.v>1?'<button class="btn sm" onclick="showDiff(\''+c.id+'\','+h.v+',true)">Diff vs v'+(h.v-1)+'</button> ':'')+'<button class="btn sm" onclick="showDiff(\''+c.id+'\','+h.v+')">Diff vs draft</button>'+(ro?'':' <button class="btn sm" onclick="restore(\''+c.id+'\','+h.v+')">Restore to draft</button>')+'</td></tr>').join('')||'<tr><td colspan="4" class="sub">Not deployed yet.</td></tr>')+'</tbody></table></div><div id="diff"></div>';
  } else if (VIEW.ctab === 'log'){
    body = '<table class="tbl log"><tbody>'+(c.log.slice().reverse().map(l => '<tr class="l-'+l.lvl+'"><td class="nw">'+fmtT(l.ts)+'</td><td>'+({I:'Info',W:'Warn',E:'Error'}[l.lvl])+'</td><td>'+esc(l.text)+'</td></tr>').join('') || '<tr><td class="sub">No entries yet.</td></tr>')+'</tbody></table>';
  }
  return '<div class="crumb"><a href="#" onclick="go(\'channels\');return false">← Channels</a></div><div class="hd"><h1>'+esc(d.name)+'</h1> '+badge(c.live?c.state:'undeployed')+' <span class="sub">v'+c.version+'</span><div class="sp"></div>'+
    (ro?'':(dirty&&c.live?'<span class="warn">Undeployed changes</span> <button class="btn" onclick="discard(\''+c.id+'\')">Discard</button> ':'')+'<button class="btn pri" id="deployBtn" onclick="deploy(\''+c.id+'\')">Deploy</button> '+(c.live?'<button class="btn" onclick="undeploy(\''+c.id+'\')">Undeploy</button> ':'')+(c.live?chActs(c):''))+'</div>'+
    '<div class="tabs">'+tabs.map(([k,l]) => '<a href="#" class="'+(VIEW.ctab===k?'on':'')+'" onclick="VIEW.ctab=\''+k+'\';render();return false">'+l+'</a>').join('')+'</div><div class="card">'+body+'</div>';
}
function pathSet(obj, path, val){ const k = path.split('.'); let o = obj; for (let i=0;i<k.length-1;i++) o = o[k[i]]; o[k[k.length-1]] = val; }
function pathGet(obj, path){ return path.split('.').reduce((o,k) => o[k], obj); }
function edit(path, val){ if (RO()) return toast('PROD is locked: change it in TEST and promote.'); pathSet(D(), path, val); save(); render(); }
function delAt(path, i){ pathGet(D(), path).splice(i,1); save(); render(); }
function moveAt(path, i, dir){ const a = pathGet(D(), path); if (i+dir < 0) return; [a[i],a[i+dir]] = [a[i+dir],a[i]]; save(); render(); }
function addRule(base){ pathGet(D(), base).rules.push({ path:'', op:'eq', value:'' }); save(); render(); }
function addTrans(base){ const k = $('tk-'+base.replace(/\W/g,'')).value; const t = { kind:k }; if (k === 'ssn') t.mode = 'mask'; if (k === 'js') t.code = ''; pathGet(D(), base).push(t); save(); render(); }
function addDest(){ const t = $('newDest').value; D().dests.push(mkDest(t)); save(); render(); }
function validateCfg(c, self){ const p = []; if (!String(c.name).trim()) p.push('Name is required.');
  if (c.source.type === 'mllp'){ if (!(c.source.port > 0 && c.source.port < 65536)) p.push('Port must be between 1 and 65535.'); const clash = S.channels.find(x => x.id !== self && x.live && x.live.source.type === 'mllp' && +x.live.source.port === +c.source.port); if (clash) p.push('Port '+c.source.port+' is already used by "'+clash.live.name+'". Two listeners can\'t share a port.'); }
  const blank = hl7Parse('MSH|^~\\&|A|B|C|D|20260101||ADT^A01|1|P|2.5.1');
  const chkT = (l, where) => l.forEach((t,i) => { const n = where+', transformer '+(i+1)+': ';
    if (['map','lookup','date','phone','ssn'].includes(t.kind) && !(parsePath(t.target||'')||{}).f) p.push(n+'target "'+(t.target||'')+'" is not a field path like PID-18.');
    if (t.kind === 'lookup' && !S.tables[t.table]) p.push(n+'choose a code table.');
    if (t.kind === 'lookup' && t.source && !parsePath(t.source)) p.push(n+'key "'+t.source+'" is not a path.');
    if (t.kind === 'map'){ try { resolveSource(t.source, blank, S.tables); } catch(e){ p.push(n+e.message); } }
    if (t.kind === 'zseg'){ if (!/^Z[A-Z0-9]{2}$/i.test(t.seg||'')) p.push(n+'Z-segment name must be Z + 2 characters, e.g. ZBB.'); else String(t.fields||'').split(',').forEach(x => { try { resolveSource(x.trim(), blank, S.tables); } catch(e){ p.push(n+e.message); } }); }
    if (t.kind === 'remove' && !/^[A-Z][A-Z0-9]{2}$/i.test(t.seg||'')) p.push(n+'enter a 3-character segment ID.');
    if (t.kind === 'remove' && /^MSH$/i.test(t.seg||'')) p.push(n+'MSH can\'t be removed.'); });
  const chkR = (f, where) => f.rules.forEach((r,i) => { if (!(parsePath(r.path||'')||{}).f) p.push(where+', rule '+(i+1)+': "'+(r.path||'')+'" is not a field path like MSH-9.1.'); if (r.op === 'matches'){ try { new RegExp(r.value); } catch(e){ p.push(where+', rule '+(i+1)+': invalid regex.'); } } });
  chkT(c.transforms,'Channel'); chkR(c.filter,'Channel filter'); c.dests.forEach(d => { chkT(d.transforms, d.name); chkR(d.filter, d.name+' filter'); });
  if (!c.dests.length) p.push('Add at least one destination.'); return p; }
function deploy(id){ const c = chById(id); const p = validateCfg(c.draft, id); if (p.length) return alertBox('Deploy blocked', p);
  askNote(note => { c.version = Math.max(0, ...c.history.map(h => h.v)) + 1; c.live = clone(c.draft); c.history.push({ v:c.version, ts:ts(), note: note || 'Deployed', config: clone(c.draft) }); c.state = 'started';
    logc(c,'I','Deployed v'+c.version+(note?' ('+note+')':'')+' and started.'); save(); toast('Deployed v'+c.version+' and started'); render(); }); }
function undeploy(id){ const c = chById(id); confirmBox('Undeploy "'+c.live.name+'"?', 'It stops listening, and senders get connection refused. Queued messages stay queued until you deploy again.', () => { c.live = null; c.state = 'undeployed'; logc(c,'I','Undeployed.'); save(); render(); }); }
function discard(id){ const c = chById(id); confirmBox('Discard draft changes?', 'The draft goes back to the deployed v'+c.version+'.', () => { c.draft = clone(c.live); save(); render(); }); }
function setState(id, st){ const c = chById(id); if (!c.live) return; c.state = st; logc(c,'I', st === 'started' ? 'Channel started.' : 'Channel stopped.'); if (st === 'started') S.alerts.filter(a => a.ch === id && /stopped with error/.test(a.text)).forEach(a => a.ack = true); save(); render(); toast(chName(c)+(st==='started'?' started':' stopped')); }
function runQueue(id){ const c = chById(id); if (c.state !== 'started') return toast('Start the channel first.'); const n = processQueue(c, true); save(); toast(n ? 'Delivered '+n+' queued message(s).' : 'Nothing delivered: is the partner still down?'); render(); }
function blankCh(cfg_){ return { id:uid('ch-'), draft:cfg_, live:null, state:'undeployed', version:0, history:[], stats:{ recv:0, filt:0, sent:0, err:0 }, queue:[], log:[] }; }
function newChannel(){ if (S.channels.length >= MAX_CH) return toast('Free Sandbox is limited to '+MAX_CH+' channels. Full lab unlocks more.'); const c = blankCh(cfg('New channel', 6670, '', [])); S.channels.push(c); save(); go('channel',{ ch:c.id, ctab:'summary' }); }
function cloneCh(id){ if (S.channels.length >= MAX_CH) return toast('Free Sandbox is limited to '+MAX_CH+' channels. Full lab unlocks more.'); const n = clone(chById(id).draft); n.name += ' (copy)'; n.source.port = (+n.source.port||6670) + 100; n.dests.forEach(d => d.id = uid('d')); const c = blankCh(n); S.channels.push(c); save(); go('channel',{ ch:c.id, ctab:'summary' }); }
function delCh(id){ const c = chById(id); confirmBox('Delete "'+c.draft.name+'"?', 'This removes the channel and its version history. Messages stay in the browser until you reset.', () => { S.channels = S.channels.filter(x => x.id !== id); save(); go('channels'); }); }
function exportJson(c){ const j = Object.assign({ harborEngineChannel:1 }, clone(c)); j.dests.forEach(d => delete d.id); return j; }
function exportCh(id){ const c = chById(id); download(c.draft.name.replace(/\W+/g,'_')+'.json', JSON.stringify(exportJson(c.draft), null, 2)); }
function download(name, text){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type:'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Downloaded '+name); }
const T_KEYS = ['kind','target','source','table','mode','seg','fields','code'];
function cleanT(l){ return (Array.isArray(l)?l:[]).filter(t => t && TKINDS.some(k => k[0] === t.kind)).map(t => { const o = {}; T_KEYS.forEach(k => { if (t[k] !== undefined) o[k] = String(t[k]); }); return o; }); }
function cleanF(f){ f = f || {}; return { logic: f.logic === 'any' ? 'any' : 'all', rules:(Array.isArray(f.rules)?f.rules:[]).map(r => ({ path:String(r.path||''), op: OPS.some(o => o[0] === r.op) ? r.op : 'eq', value:String(r.value||'') })) }; }
function importCh(text){ if (!phiOk()){ return phiConfirm(() => importCh(text)); }  let j; try { j = JSON.parse(text); } catch(e){ return alertBox('Import failed', ['Not valid JSON: '+e.message]); }
  if (j.harborEngineChannel !== 1 || !j.source || !Array.isArray(j.dests)) return alertBox('Import failed', ['This is not a Harbor Engine channel export (it needs "harborEngineChannel": 1, a source and dests).']);
  const f = cleanF(j.filter); f.js = String((j.filter||{}).js||'');
  const c = { name:String(j.name||'Imported channel').slice(0,80), desc:String(j.desc||'').slice(0,200), source:{ type:['mllp','file','http'].includes(j.source.type)?j.source.type:'mllp', port:+j.source.port||0 }, filter:f, transforms:cleanT(j.transforms),
    dests:j.dests.filter(d => d && PARTNERS[d.type]).map(d => ({ id:uid('d'), type:d.type, name:String(d.name||PARTNERS[d.type].name), enabled:d.enabled!==false, filter:cleanF(d.filter), transforms:cleanT(d.transforms), retries:Math.max(0,Math.min(10,+d.retries||0)), queue:d.queue!==false })), ack:{ mode:'receipt', validate:!!(j.ack&&j.ack.validate) } };
  if (S.channels.length >= MAX_CH) return toast('Free Sandbox is limited to '+MAX_CH+' channels. Full lab unlocks more.');
  const ch = blankCh(c); ch.log.push({ ts:ts(), lvl:'I', text:'Imported from JSON.' }); S.channels.push(ch); save(); toast('Imported "'+c.name+'" as an undeployed draft'); go('channel',{ ch:ch.id, ctab:'source' }); }
function restore(id, v){ const c = chById(id); const h = c.history.find(x => x.v === v); c.draft = clone(h.config); save(); toast('v'+v+' restored to the draft. Deploy to make it live.'); render(); }
function lineDiff(a, b){ const A = a.split('\n'), B = b.split('\n'); const n = A.length, m = B.length; const L = Array.from({ length:n+1 }, () => new Array(m+1).fill(0));
  for (let i=n-1;i>=0;i--) for (let j=m-1;j>=0;j--) L[i][j] = A[i] === B[j] ? L[i+1][j+1]+1 : Math.max(L[i+1][j], L[i][j+1]);
  const out = []; let i=0, j=0; while (i<n && j<m){ if (A[i] === B[j]){ out.push([' ',A[i]]); i++; j++; } else if (L[i+1][j] >= L[i][j+1]) out.push(['-',A[i++]]); else out.push(['+',B[j++]]); }
  while (i<n) out.push(['-',A[i++]]); while (j<m) out.push(['+',B[j++]]); return out; }
function strip(c){ return JSON.stringify(exportJson(c), null, 2); }
function showDiff(id, v, prev){ const c = chById(id); const h = c.history.find(x => x.v === v); const a = prev ? c.history.find(x => x.v === v-1) : h;
  const d = lineDiff(strip(a.config), prev ? strip(h.config) : strip(c.draft)); const n = d.filter(x => x[0] !== ' ').length;
  $('diff').innerHTML = '<h4>'+(prev ? 'v'+(v-1)+' → v'+v : 'v'+v+' → current draft')+': '+n+' changed line(s)</h4>'+(n?'<pre class="diff">'+d.map((x,k) => d.slice(Math.max(0,k-2), k+3).some(y => y[0] !== ' ') ? '<span class="d'+(x[0]==='+'?'a':x[0]==='-'?'r':'n')+'">'+x[0]+' '+esc(x[1])+'</span>' : null).filter(Boolean).join('\n')+'</pre>':'<div class="sub">Identical.</div>'); }
function readDrop(inp){ const f = inp.files[0]; if (f) f.text().then(t => { $('dropTxt').value = t; }); }
async function doDrop(){ const c = chById(VIEW.ch); if (!c.live || c.live.source.type !== 'file' || c.state !== 'started') return toast('Deploy and start this channel with a File drop source first.'); const r = await fileDrop(c, $('dropTxt').value); save(); $('dropOut').textContent = r.length ? r.map(x => (x.ctrl||'(no control ID)')+' → '+x.status+' · ACK '+x.ack).join('\n') : 'No messages found (each one must start with MSH).'; nav(); }
async function doHttp(){ if (!phiOk()){ return phiConfirm(() => doHttp()); }  const c = chById(VIEW.ch); if (!c.live || c.live.source.type !== 'http' || c.state !== 'started') return toast('Deploy and start this channel with an HTTP source first.'); const r = await httpPost(c, $('httpTxt').value); save(); $('httpOut').textContent = r.text; nav(); }
function alertBox(title, lines){ $('dlgBody').innerHTML = '<h3>'+esc(title)+'</h3><ul>'+lines.map(l => '<li>'+esc(l)+'</li>').join('')+'</ul>'; $('dlgBtns').innerHTML = '<button class="btn pri" onclick="$(\'dlg\').close()">OK</button>'; $('dlg').showModal(); }
function confirmBox(title, text, ok){ $('dlgBody').innerHTML = '<h3>'+esc(title)+'</h3><p>'+esc(text)+'</p>'; $('dlgBtns').innerHTML = '<button class="btn" onclick="$(\'dlg\').close()">Cancel</button> <button class="btn pri" id="dlgOk">Confirm</button>'; $('dlgOk').onclick = () => { $('dlg').close(); ok(); }; $('dlg').showModal(); }
function askNote(ok){ $('dlgBody').innerHTML = '<h3>Deploy</h3><label class="blk">What changed? (saved in the version history)<input id="noteIn" placeholder="e.g. '+('Send only ADT^A04 to the Bedboard')+'"></label>'; $('dlgBtns').innerHTML = '<button class="btn" onclick="$(\'dlg\').close()">Cancel</button> <button class="btn pri" id="dlgOk">Deploy</button>'; $('dlgOk').onclick = () => { const v = $('noteIn').value.trim(); $('dlg').close(); ok(v); }; $('noteIn').onkeydown = e => { if (e.key === 'Enter') $('dlgOk').click(); }; $('dlg').showModal(); $('noteIn').focus(); }

/* --- messages --- */
function filterMsgs(q){ const from = q.from ? new Date(q.from+'T00:00:00').toISOString() : '', to = q.to ? new Date(q.to+'T23:59:59.999').toISOString() : '';
  return S.messages.filter(m => (!q.ch || m.ch === q.ch) && (!q.status || m.status === q.status) && (!q.mrn || (m.mrn||'').includes(q.mrn.trim())) && (!q.ctrl || (m.ctrl||'').toUpperCase().includes(q.ctrl.trim().toUpperCase())) && (!q.type || m.type.startsWith(q.type)) && (!from || m.ts >= from) && (!to || m.ts <= to)).slice().reverse(); }
/* Toast after a send: the engine's receipt ACK, and for a failed delivery the destination's own ACK/reason (never AA). */
function sendSummary(r){ return r.status === 'ERROR' ? 'ERROR · '+errWhy(r).map(w => (w.dest ? w.dest+': ' : '')+w.code+' · '+w.text).join('; ') : 'engine ACK '+r.ack+' · '+r.status; }
/* Raw tab: the ACK each destination actually returned (never the engine's receipt ACK to the sender). */
function destAckBox(m, all){ const R = routeLines(m); if (!R.length) return '';
  return '<div class="card dackbox"><b>Destinations: status and ACK received</b>'+R.map(r => '<div class="dack" data-st="'+r.st+'"><span class="dn">'+esc(r.dest)+'</span> '+badge(r.st)+' '+(r.k === 'bad' ? '<span class="why">'+esc(r.code)+' · '+esc(r.text)+'</span>' : r.k === 'ok' ? (r.code === 'no ACK' ? '<span class="sub">'+(r.type === 'file' ? 'written to the file drop (files return no ACK)' : 'no ACK returned')+'</span>' : '<span class="mono">ACK '+esc(r.code)+'</span>') : '<span class="sub">'+esc(r.text)+'</span>')+'</div>').join('')+'</div>'; }
/* Error queue "Reason": why each failed destination failed. HL7 v2.5.1 ACK: MSA-1 (AE/AR/CE/CR) plus ERR-2 location,
   ERR-3 code^text (table 0357) and ERR-8 user message, else MSA-3. FHIR: HTTP status plus OperationOutcome issue text.
   No ACK: the engine-side reason (connection refused, timeout, filter/transformer error, rejected on receipt). */
function v2AckWhy(resp){ const segs = String(resp == null ? '' : resp).split(/\r\n?|\n/); const msa = segs.find(x => x.startsWith('MSA|')); if (!msa) return null; const f = msa.split('|');
  const errs = segs.filter(x => x.startsWith('ERR|')).map(x => { const e = x.split('|'), loc = (e[2]||'').split('^'), c = (e[3]||'').split('^');
    const where = loc[0] ? loc[0] + (loc[2] ? '-' + loc[2] : '') : ''; const what = e[8] || c[1] || c[0] || e[1] || ''; return what ? (where ? where + ': ' : '') + what : ''; }).filter(Boolean);
  return { code: f[1] || '?', text: errs.join('; ') || f[3] || '(no error text in the ACK)' }; }
function fhirWhy(resp){ const t = String(resp == null ? '' : resp); const sl = t.split('\n').find(l => /^\d{3} /.test(l)); const st = sl ? sl.slice(0,3) : ''; const j = t.indexOf('{');
  if (j >= 0) try { const o = JSON.parse(t.slice(j)); if (o.resourceType === 'OperationOutcome') return { code:'HTTP '+(st||'?'), text: (o.issue||[]).map(i => i.diagnostics || (i.details && i.details.text) || i.code).filter(Boolean).join('; ') || 'OperationOutcome with no issue text' }; } catch(e){}
  return st ? { code:'HTTP '+st, text: sl } : null; }
function errWhy(m){ const out = []; const fails = (m.dests||[]).filter(d => d.status === 'ERROR');
  for (const d of fails){ let r = v2AckWhy(d.resp) || (d.type === 'fhir' ? fhirWhy(d.resp) : null);
    if (!r){ const t = String(d.resp || d.err || ''); r = { code: /timed? ?out/i.test(t) ? 'Timeout' : /refused|unreachable|cannot connect|unknown host/i.test(t) ? 'No ACK' : (d.ack || 'Engine'), text: t || 'No response from the partner' }; }
    if (r.code === 'AA') r = { code:'No ACK', text:'Delivery failed; no error ACK was stored for this destination. Response: '+(String(d.resp||'').split(/\r|\n/)[0] || 'none') };
    out.push(Object.assign({ dest: d.name }, r)); }
  if (!out.length){ const t = m.err || ''; const c = /^Rejected on receipt \((A[ER])\)/.exec(t);
    out.push({ dest:'', code: c ? c[1] : (m.ack && m.ack !== 'AA' ? m.ack : /filter/i.test(t) ? 'Filter' : /transform|step/i.test(t) ? 'Transformer' : 'Engine'), text: (c ? t.replace(/^Rejected on receipt \(A[ER]\):\s*/, '') : t) || m.ackText || 'Error (no detail recorded)' }); }
  return out; }
/* Every destination the message was routed to, with its own status and ACK. Failed: that destination's real ACK/reason
   (never AA). Delivered: the ACK it returned. Filtered: its destination filter did not match. */
function routeLines(m){ const c = chById(m.ch); const cfg = c ? ((c.live || c.draft).dests || []) : []; const nm = id => { const d = cfg.find(x => x.id === id); return d ? d.name : id; };
  const L = (m.dests||[]).map(d => { if (d.status === 'ERROR' || d.status === 'QUEUED'){ const w = errWhy({ dests:[Object.assign({}, d, { status:'ERROR' })] })[0]; return { k:'bad', dest:d.name, st: d.status === 'QUEUED' ? 'QUEUED' : 'FAILED', code:w.code, text:w.text }; }
    const ack = d.ack && d.ack !== '' ? d.ack : 'no ACK'; return { k:'ok', dest:d.name, type:d.type, st:'DELIVERED', code: ack, text:'' }; });
  (m.skip||[]).filter(x => x.why !== 'disabled').forEach(x => L.push({ k:'skip', dest: x.name || nm(x.id), st:'FILTERED', code:'', text:'destination filter did not match' }));
  return L; }
/* Error queue list: narrow ACK column with only the destination's real ACK code (AE/AR/CE/CR, HTTP status, or "No ACK").
   Never AA on a failure. Several failed destinations: their codes, compactly. Error text is only in the message detail. */
const shortDest = n => String(n||'').replace(/\s*\([^)]*\)\s*$/,'');
function ackCell(m){ const bad = routeLines(m).filter(r => r.k === 'bad'); const W = bad.length ? bad : errWhy(m).map(w => ({ dest:w.dest, code:w.code }));
  const codes = [...new Set(W.map(w => w.code === 'AA' ? 'No ACK' : w.code))]; const title = W.map(w => (w.dest ? shortDest(w.dest)+': ' : '')+(w.code === 'AA' ? 'No ACK' : w.code)).join('\n');
  return '<td class="ackc" data-m="'+esc(m.id)+'" title="'+esc(title)+'">'+codes.map(c => '<span class="ackcode">'+esc(c)+'</span>').join('')+(W.length > 1 ? '<span class="ackn">×'+W.length+'</span>' : '')+'</td>'; }
function msgTable(list, why){ /* Error queue adds a narrow ACK column (destination ACK codes). */
  const H = why ? ['Received','ACK','Channel','Type','Control ID','Status','MRN','Destinations'] : ['Received','Channel','Type','Control ID','MRN','Status','Destinations'];
  return '<table class="tbl msgs'+(why?' errq':'')+'"><thead><tr>'+H.map(x => '<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+(list.slice(0,200).map(m => { const c = chById(m.ch);
    const C = { 'Received':'<td class="nw">'+fmtT(m.ts)+'</td>', 'ACK': why ? ackCell(m) : '', 'Channel':'<td>'+esc(c?chName(c):'(deleted)')+'</td>', 'Type':'<td>'+esc(m.type)+'</td>', 'Control ID':'<td class="mono">'+esc(m.ctrl||'—')+'</td>', 'MRN':'<td class="mono">'+esc(m.mrn||'—')+'</td>', 'Status':'<td>'+badge(m.status)+'</td>', 'Destinations':'<td class="dcell">'+allDests(m).map(dchip).join('')+'</td>' };
    return '<tr tabindex="0" class="'+(VIEW.msg===m.id?'sel':'')+'" onclick="openMsg(\''+m.id+'\')" onkeydown="if(event.key===\'Enter\')openMsg(\''+m.id+'\')">'+H.map(k => C[k]).join('')+'</tr>'; }).join('') || '<tr><td colspan="'+H.length+'" class="sub">No messages match. Start the sending systems or send a ticket\'s test messages.</td></tr>')+'</tbody></table>'; }
function vMessages(){ const q = VIEW.q;
  const f = '<div class="filters"><input aria-label="MRN" placeholder="MRN" value="'+esc(q.mrn||'')+'" onchange="VIEW.q.mrn=this.value;render()"><input aria-label="Control ID" placeholder="Control ID (MSH-10)" value="'+esc(q.ctrl||'')+'" onchange="VIEW.q.ctrl=this.value;render()"><select aria-label="Channel" onchange="VIEW.q.ch=this.value;render()"><option value="">All channels</option>'+S.channels.map(c=>'<option value="'+c.id+'"'+(q.ch===c.id?' selected':'')+'>'+esc(chName(c))+'</option>').join('')+'</select><select aria-label="Status" onchange="VIEW.q.status=this.value;render()"><option value="">Any status</option>'+['SENT','FILTERED','QUEUED','ERROR','REPROCESSED','DISMISSED','DUPLICATE'].map(s=>'<option'+(q.status===s?' selected':'')+'>'+s+'</option>').join('')+'</select><select aria-label="Type" onchange="VIEW.q.type=this.value;render()"><option value="">Any type</option>'+['ADT','ORM','ORU'].map(s=>'<option'+(q.type===s?' selected':'')+'>'+s+'</option>').join('')+'</select><label class="sub">From <input type="date" value="'+esc(q.from||'')+'" onchange="VIEW.q.from=this.value;render()"></label><label class="sub">To <input type="date" value="'+esc(q.to||'')+'" onchange="VIEW.q.to=this.value;render()"></label><button class="btn sm" onclick="VIEW.q={};render()">Clear</button></div>';
  const list = filterMsgs(q); return '<div class="hd"><h1>Messages</h1><span class="sub">'+list.length+' match</span></div>'+f+'<div class="split"><div class="card scroll">'+msgTable(list)+'</div><div class="card" id="msgPane">'+msgDetail()+'</div></div>'; }
function openMsg(id){ VIEW.msg = id; render(); if (MOBILE()) $('msgPane').scrollIntoView(); }
function treeHtml(raw){ const m = hl7Parse(raw); if (!m.ok) return '<div class="al s-E">'+esc(m.error)+'</div>'; const cnt = {};
  return m.segs.map(s => { cnt[s.id] = (cnt[s.id]||0)+1; const n = cnt[s.id];
    return '<details open><summary><b>'+s.id+(n>1?'['+n+']':'')+'</b></summary><table class="tree">'+s.fields.map((f,i) => { if (f === '') return ''; const reps = (s.id==='MSH'&&i<2) ? [f] : f.split(m.d.rep);
      return '<tr><td class="mono nw">'+s.id+'-'+(i+1)+'</td><td class="mono">'+reps.map((r,ri) => { const cs = r.split(m.d.comp); return cs.length > 1 ? '<div>'+(reps.length>1?'<span class="sub">['+(ri+1)+']</span> ':'')+cs.map((c,ci) => c ? '<span class="comp"><i>.'+(ci+1)+'</i> '+esc(c)+'</span>' : '').join(' ')+'</div>' : '<div>'+(reps.length>1?'<span class="sub">['+(ri+1)+']</span> ':'')+esc(r)+'</div>'; }).join('')+'</td></tr>'; }).join('')+'</table></details>'; }).join(''); }
/* ---- message views: Text/Parsed toggle and Compare ---- */
function viewToggle(){ const v = VIEW.mview || 'text'; return '<div class="seg" role="group" aria-label="Show as">'+[['text','Text'],['parsed','Parsed']].map(([k,l]) => '<button type="button" class="btn sm'+(v===k?' on':'')+'" aria-pressed="'+(v===k)+'" onclick="VIEW.mview=\''+k+'\';render()">'+l+'</button>').join('')+'</div>'; }
const isJson = t => /^\s*[\{\[]/.test(String(t||''));
function jsonTree(txt){ let o; try { o = JSON.parse(txt); } catch(e){ return '<pre class="out">'+esc(txt)+'</pre>'; } const f = flatJson(o);
  return '<table class="tree">'+Object.keys(f).map(k => '<tr><td class="mono nw">'+esc(k)+'</td><td class="mono">'+esc(f[k])+'</td></tr>').join('')+'</table>'; }
function showAs(txt){ if ((VIEW.mview || 'text') === 'text') return '<pre class="out">'+esc(isJson(txt) ? txt : showSeg(txt))+'</pre>'; return isJson(txt) ? jsonTree(txt) : treeHtml(txt); }
function fieldLabel(p){ const m = /^([A-Z][A-Z0-9]{2})(?:\[\d+\])?-(\d+)/.exec(p); if (!m || typeof HE_FIELD_NAME !== 'function') return ''; const n = HE_FIELD_NAME(m[1], +m[2]); return n ? n.split(/[(:]/)[0].trim() : ''; }
function compareHtml(m){ if (!m.work) return '<div class="sub">Nothing to compare: '+esc(m.status==='FILTERED'?'the channel filter stopped this message before the transformers.':(m.err||'it stopped before the transformers.'))+'</div>';
  const dests = m.dests.filter(d => d.out); const tgt = VIEW.cmpTo && dests.find(d => d.id === VIEW.cmpTo) ? VIEW.cmpTo : '';
  const after = tgt ? dests.find(d => d.id === tgt).out : m.work; const flat = t => isJson(t) ? flatJson(JSON.parse(t)) : flatV2(t);
  let A, B; try { A = flat(m.raw); B = flat(after); } catch(e){ return '<div class="sub">Could not parse one side: '+esc(e.message)+'</div>'; }
  const conv = isJson(after) && !isJson(m.raw);
  const steps = (m.trace||[]).concat(tgt ? ((m.dtrace||{})[tgt]||[]) : []); const who = {};
  for (const st of steps) for (const [, k] of (st.ch||[])) who[k] = st.step; const convStep = steps.find(st => st.conv);
  const keys = conv ? Object.keys(B) : [...new Set(Object.keys(A).concat(Object.keys(B)))];
  const order = k => { const i = Object.keys(A).indexOf(k); return i >= 0 ? i : 1e6 + Object.keys(B).indexOf(k); }; if (!conv) keys.sort((x, y) => order(x) - order(y));
  const rows = keys.map(k => { const a = conv ? undefined : A[k], b2 = B[k]; const kind = conv ? 'added' : a === undefined ? 'added' : b2 === undefined ? 'removed' : a !== b2 ? 'changed' : 'same';
    return { k, a, b: b2, kind, by: kind === 'same' ? '' : (who[k] || (conv && convStep ? convStep.step : (tgt ? 'destination filter or transformers' : ''))) }; });
  const only = VIEW.cmpOnly !== false; const shown = rows.filter(r => !only || r.kind !== 'same'); const n = rows.filter(r => r.kind !== 'same').length;
  const filt = (m.steps||[]).filter(st => /filter/i.test(st.name)).map(st => '<li>'+esc(st.name)+': '+esc(st.text)+'</li>').join('');
  return '<div class="cmpbar"><label>Compare the original with <select aria-label="Compare with" onchange="VIEW.cmpTo=this.value;render()"><option value="">channel output</option>'+dests.map(d => '<option value="'+d.id+'"'+(d.id===tgt?' selected':'')+'>what '+esc(d.name)+' received</option>').join('')+'</select></label>'+
    '<label class="chk"><input type="checkbox" id="cmpOnly"'+(only?' checked':'')+' onchange="VIEW.cmpOnly=this.checked;render()"> Show only changes</label></div>'+
    '<div class="sub">'+n+' field'+(n===1?'':'s')+' differ'+(n===1?'s':'')+'. <span class="cmpk added">added</span> <span class="cmpk changed">changed</span> <span class="cmpk removed">removed</span>'+(conv?' · converted from v2 to FHIR'+(convStep?' by '+esc(convStep.step):'')+', so every JSON path is new.':'')+'</div>'+
    (filt ? '<ul class="sub cmpf">'+filt+'</ul>' : '')+
    '<div class="cmp" role="table" aria-label="Field comparison"><div class="cmpr cmph" role="row"><div role="columnheader">Field</div><div role="columnheader">Before</div><div role="columnheader">After</div></div>'+
    (shown.length ? shown.map(r => { const nm = conv ? '' : fieldLabel(r.k); return '<div class="cmpr '+r.kind+'" role="row"><div role="cell" class="mono">'+esc(r.k)+(nm?'<div class="sub fname">'+esc(nm)+'</div>':'')+(r.by?'<div class="sub cmpby">'+esc(r.by)+'</div>':'')+'</div><div role="cell" class="mono">'+(r.a===undefined?'<span class="sub">(none)</span>':esc(r.a))+'</div><div role="cell" class="mono">'+(r.b===undefined?'<span class="sub">(removed)</span>':esc(r.b))+'</div></div>'; }).join('')
      : '<div class="cmpr" role="row"><div role="cell" class="sub">No fields changed.</div></div>')+'</div>'; }
/* Every destination of the message's channel, with what happened at each one (sent, errored, queued, not routed, disabled). */
function allDests(m){ const c = chById(m.ch); const cfgD = c ? ((c.live || c.draft).dests || []) : []; const out = [], seen = new Set(); const skip = m.skip || [];
  for (const d of cfgD){ seen.add(d.id); const e = m.dests.find(x => x.id === d.id); if (e){ out.push(e); continue; } const sk = skip.find(x => x.id === d.id);
    let st, why;
    if (sk){ st = sk.why === 'disabled' ? 'DISABLED' : 'NOT ROUTED'; why = sk.why === 'disabled' ? 'This destination was disabled, so nothing was sent to it.' : 'Its destination filter did not match this message, so it was not sent.'; }
    else if (!m.work){ st = 'NOT REACHED'; why = m.status === 'FILTERED' ? 'The channel filter stopped the message before routing.' : 'The message stopped before routing'+(m.err ? ': '+m.err : '.'); }
    else if (m.skip){ st = 'NOT ROUTED'; why = 'This destination was added after the message was processed (channel v'+(m.version||'?')+').'; }
    else { st = d.enabled ? 'NOT ROUTED' : 'DISABLED'; why = d.enabled ? 'Its destination filter did not match this message.' : 'This destination is disabled.'; }
    out.push({ id:d.id, name:d.name, type:d.type, status:st, why, skipped:true }); }
  for (const e of m.dests) if (!seen.has(e.id)) out.push(e);
  return out; }
function dchip(d){ return '<span class="dchip d-'+String(d.status).toLowerCase().replace(/\s+/g,'-')+'" title="'+esc(d.name+': '+d.status+(d.ack?' ('+d.ack+')':''))+'">'+esc(String(d.name).replace(/\s*\([^)]*\)\s*$/,''))+' · '+esc(d.status==='SENT'&&d.ack?d.ack:d.status)+'</span>'; }
function msgDetail(){ const m = S.messages.find(x => x.id === VIEW.msg); if (!m) return '<div class="sub">Select a message to see the raw and transformed message (as text or parsed), a field-by-field comparison, and every destination with its response. Every destination is listed with its status and the ACK it returned; the engine’s receipt ACK to the sender is under Raw.</div>';
  const c = chById(m.ch); const all = allDests(m); const routed = all.filter(d => !d.skipped).length;
  const tabs = [['raw','Raw'],['trans','Transformed'],['cmp','Compare'],['dest','Destinations ('+routed+' of '+all.length+')']]; if (VIEW.mtab === 'parsed' || VIEW.mtab === 'ack') VIEW.mtab = 'raw';
  let b = '';
  const ackBox = '<details class="ackbox"'+(m.ack && m.ack !== 'AA' ? ' open' : '')+'><summary><b>Receipt ACK the engine sent to the sending system</b> <span class="sub">MSA-1 '+esc(m.ack||'none')+(m.ack === 'AA' && (all||[]).some(d => d.status === 'ERROR' || d.status === 'QUEUED') ? ' · receipt only, not the destination result' : '')+'</span></summary><pre class="out">'+esc(showSeg(m.ackText))+'</pre>'+(m.errs.length?'<h4>Inbound validation notes</h4><ul class="vlist">'+m.errs.map(e=>'<li class="'+(e.sev==='E'?'bad':'')+'"><b>'+(e.sev==='E'?'Error':'Warning')+'</b> '+esc(e.loc)+': '+esc(e.msg)+'</li>').join('')+'</ul>':'')+'</details>';
  if (VIEW.mtab === 'raw') b = viewToggle()+showAs(m.raw)+ackBox;
  else if (VIEW.mtab === 'cmp') b = compareHtml(m);
  else if (VIEW.mtab === 'trans'){
    if (!m.work) b = '<div class="sub">Not transformed: '+esc(m.status==='FILTERED'?'filtered out by the channel filter.':(m.err||'it stopped before the transformers.'))+'</div>';
    else {
      b = viewToggle()+'<div class="sub">What each destination actually received, after the channel transformers and that destination\'s own transformers.</div>'+
        all.map(d => d.skipped ? '<div class="card tdest skip"><div class="trh"><b>'+esc(d.name)+'</b> '+dchip(d)+'</div><div class="sub">'+esc(d.why)+'</div></div>'
          : '<div class="card tdest"><div class="trh"><b>'+esc(d.name)+'</b> '+dchip(d)+'</div><div class="sub">'+(((m.dtrace||{})[d.id]||[]).length ? ((m.dtrace[d.id]).length+' destination transformer'+((m.dtrace[d.id]).length===1?'':'s')+' applied') : 'No destination transformers')+'</div>'+showAs(d.out)+'</div>').join(''); } }
  else if (VIEW.mtab === 'dest') b = all.map(d => d.skipped ? '<div class="card"><b>'+esc(d.name)+'</b> '+dchip(d)+'<div class="sub">'+esc(d.why)+'</div></div>'
      : '<div class="card"><b>'+esc(d.name)+'</b> '+dchip(d)+' <span class="sub">'+(d.ack?'response '+esc(d.ack)+' · ':'')+'attempts '+d.attempts+'</span><h4>Sent</h4><pre class="out">'+esc(showSeg(d.out))+'</pre><h4>Response</h4><pre class="out">'+esc(showSeg(d.resp))+'</pre></div>').join('') || '<div class="sub">This channel has no destinations.</div>';
  return '<div class="trh"><b>'+esc(m.type)+'</b> '+badge(m.status)+' <span class="sub mono">'+esc(m.ctrl||'')+'</span><span class="sp"></span>'+(false?'':'<button class="btn sm" onclick="doReprocess(\''+m.id+'\')" title="Run the original message through the currently deployed channel again">Reprocess</button> <button class="btn sm" onclick="doResend(\''+m.id+'\')" title="Send the stored output again to destinations that did not accept it">Resend</button>')+'</div>'+
    (m.err?'<div class="al s-E">'+esc(m.err)+'</div>':'')+'<div class="sub">'+esc(c?chName(c):'')+' · v'+(m.version||'?')+' · '+fmtT(m.ts)+' · via '+esc(m.how)+(m.reprocessOf?' · reprocess of an earlier message':'')+(m.reprocessedTo?' · reprocessed later':'')+'</div>'+
    destAckBox(m, all)+'<div class="tabs sm">'+tabs.map(([k,l]) => '<a href="#" class="'+(VIEW.mtab===k?'on':'')+'" onclick="VIEW.mtab=\''+k+'\';render();return false">'+l+'</a>').join('')+'</div>'+b; }
async function doReprocess(id){ const r = await reprocess(id); if (r){ VIEW.msg = r.id; toast('Reprocessed → '+r.status); } render(); }
function doResend(id){ const r = resend(id); if (r) toast('Resent → '+r.status); render(); }
function vErrors(){ const list = S.messages.filter(m => m.status === 'ERROR').reverse();
  return '<div class="hd"><h1>Error queue</h1><span class="sub">'+list.length+' message(s)</span><div class="sp"></div>'+(list.length?'<button class="btn" onclick="reprocessAll()">Reprocess all</button> <button class="btn" onclick="dismissAll()">Dismiss all</button>':'')+'</div><p class="sub">Messages rejected on receipt (AR), broken in a transformer, or NAKed by a partner. Open one, read the response, fix the channel, deploy, then Reprocess. Use Resend only when the stored output was right, e.g. after a partner-side fix.</p><div class="split"><div class="card scroll">'+msgTable(list, true)+'</div><div class="card" id="msgPane">'+msgDetail()+'</div></div>'; }
async function reprocessAll(){ const list = S.messages.filter(m => m.status === 'ERROR'); let n = 0, skip = 0; for (const m of list){ const c = chById(m.ch); if (c && c.live && c.state === 'started'){ await reprocess(m.id); n++; } else skip++; } save(); toast('Reprocessed '+n+(skip?' · skipped '+skip+' (channel not started)':'')); render(); }
function dismissAll(){ confirmBox('Dismiss all errors?', 'They leave the error queue but stay searchable in Messages (status DISMISSED).', () => { S.messages.forEach(m => { if (m.status === 'ERROR') m.status = 'DISMISSED'; }); save(); render(); }); }
function vAlerts(){ return '<div class="hd"><h1>Alerts</h1><div class="sp"></div>'+(!S.alerts.some(a=>!a.ack)?'':'<button class="btn" onclick="S.alerts.forEach(a=>a.ack=true);save();render()">Acknowledge all</button>')+'</div><p class="sub">Raised when a channel errors, a partner rejects messages, a partner can\'t be reached, or a queue goes over 10.</p>'+(S.alerts.slice().reverse().map(a => '<div class="card al s-'+a.sev+(a.ack?' ackd':'')+'"><b>'+(a.sev==='E'?'Error':'Warning')+'</b> '+esc(a.text)+' <span class="sub">'+fmtT(a.ts)+(a.ack?' · acknowledged':'')+'</span>'+(a.ack||MOBILE()?'':' <button class="btn sm" onclick="ackAlert(\''+a.id+'\')">Acknowledge</button>')+'</div>').join('') || '<div class="card sub">No alerts.</div>'); }
function ackAlert(id){ S.alerts.find(a => a.id === id).ack = true; save(); render(); }
function vTables(){ const ro = RO();
  return '<div class="hd"><h1>Code tables</h1><div class="sp"></div>'+(ro?'':'<button class="btn pri" onclick="newTable()">New table</button>')+'</div><p class="sub">Used by code-table lookup transformers and by lookup(TABLE, PATH) in field mappings. The key * is the default when nothing matches. Without it, unmatched values pass through unchanged. Edits apply at once (no deploy needed), just like shared tables in a real engine, so be careful.</p>'+
    Object.keys(S.tables).map(k => '<div class="card"><div class="trh"><b>'+esc(k)+'</b> <span class="sub">'+Object.keys(S.tables[k]).length+' rows</span><span class="sp"></span>'+(ro?'':'<button class="x" title="Delete table" onclick="delTable(\''+q_(k)+'\')">×</button>')+'</div><table class="tbl"><thead><tr><th>Incoming value</th><th>Outgoing value</th><th></th></tr></thead><tbody>'+Object.entries(S.tables[k]).map(([a,b]) => '<tr><td class="mono">'+esc(a)+'</td><td class="mono">'+esc(b)+'</td><td>'+(ro?'':'<button class="x" title="Delete row" onclick="delEntry(\''+q_(k)+'\',\''+esc(q_(a))+'\')">×</button>')+'</td></tr>').join('')+
      (ro?'':'<tr><td><input id="k-'+k+'" aria-label="Incoming value" placeholder="e.g. F"></td><td><input id="v-'+k+'" aria-label="Outgoing value" placeholder="e.g. 2" onkeydown="if(event.key===\'Enter\')addEntry(\''+q_(k)+'\')"></td><td><button class="btn sm" onclick="addEntry(\''+q_(k)+'\')">Add</button></td></tr>')+'</tbody></table></div>').join(''); }
function newTable(){ $('dlgBody').innerHTML = '<h3>New code table</h3><label class="blk">Name (letters, digits and _)<input id="tblIn" placeholder="'+('MY_CODES')+'"></label>'; $('dlgBtns').innerHTML = '<button class="btn" onclick="$(\'dlg\').close()">Cancel</button> <button class="btn pri" id="dlgOk">Create</button>';
  $('dlgOk').onclick = () => { const n = $('tblIn').value.trim().toUpperCase(); if (!/^[A-Z][A-Z0-9_]*$/.test(n)) return toast('Use letters, digits and _ only, starting with a letter.'); if (S.tables[n]) return toast('That table already exists.'); S.tables[n] = {}; $('dlg').close(); save(); render(); setTimeout(() => $('k-'+n) && $('k-'+n).focus(), 50); };
  $('tblIn').onkeydown = e => { if (e.key === 'Enter') $('dlgOk').click(); }; $('dlg').showModal(); $('tblIn').focus(); }
function delTable(k){ confirmBox('Delete table '+k+'?', 'Transformers that use it will fail until you fix them.', () => { delete S.tables[k]; save(); render(); }); }
function addEntry(k){ const a = $('k-'+k).value.trim(), b = $('v-'+k).value.trim(); if (!a) return toast('Enter an incoming value.'); S.tables[k][a] = b; save(); render(); setTimeout(() => $('k-'+k) && $('k-'+k).focus(), 30); }
function delEntry(k, a){ delete S.tables[k][a]; save(); render(); }
function vSim(){ const ro = '';
  return '<div class="hd"><h1>Sending systems</h1><div class="sp"></div>'+(ro?'':'<button class="btn pri" onclick="toggleSim()">'+(S.sim.on?'Pause traffic':'Start traffic')+'</button>')+'</div><p class="sub">Simulated Penford Medical Center systems connect over MLLP: ADT → 6661, orders → 6662, lab results (from HARBORLAB) → 6663, scheduling → 6664, charges → 6665. If no started channel listens on a port, the connection is refused and the sender keeps the message.</p>'+
    '<div class="card form two"><label>Messages every 3 s<select onchange="S.sim.rate=+this.value;save()"'+ro+'>'+[1,2,3,5].map(n=>'<option'+(S.sim.rate===n?' selected':'')+'>'+n+'</option>').join('')+'</select></label><label class="chk"><input type="checkbox" '+(S.sim.bad?'checked':'')+' onchange="S.sim.bad=this.checked;save()"'+ro+'> Include bad messages (missing MRN, no control ID, invalid sex code, broken framing)</label></div>'+
    (ro?'':'<div class="card"><b>Send one</b> '+['ADT','ORM','ORU'].map(k=>'<button class="btn sm" onclick="sendOne(\''+k+'\')">'+k+'</button>').join(' ')+' <button class="btn sm" onclick="sendOne(\'ORM\',{rad:false,stat:true})">STAT lab order</button> <button class="btn sm" onclick="sendOne(\'ADT\',{bad:\'noctrl\'})">ADT with no MSH-10</button> <button class="btn sm" onclick="sendOne(\'ADT\',{north:true})">North clinic ADT</button></div>')+
    '<div class="card"><b>Connection log</b> <span class="sub">'+S.sim.sent+' sent · '+S.sim.naks+' NAKed · '+S.sim.refused+' refused</span><div class="scrollx"><table class="tbl log"><tbody>'+(S.sim.log.map(l => '<tr><td class="nw">'+fmtT(l.ts)+'</td><td>:'+l.port+'</td><td>'+l.kind+'</td><td class="mono">'+esc(l.ctrl)+'</td><td>'+esc(l.res)+'</td></tr>').join('') || '<tr><td class="sub">Nothing sent yet.</td></tr>')+'</tbody></table></div></div>'+
    '<div class="card"><b>Partner systems</b> <span class="sub">Take one down to practise queuing and recovery.</span><table class="tbl"><tbody>'+Object.keys(PARTNERS).filter(k=>k!=='file').map(k => '<tr><td>'+esc(PARTNERS[k].name)+'</td><td>'+badge(S.outage[k]?'DOWN':'UP')+'</td><td>'+(ro?'':'<button class="btn sm" onclick="S.outage[\''+k+'\']=!S.outage[\''+k+'\'];save();render()">'+(S.outage[k]?'Bring up':'Take down')+'</button>')+'</td></tr>').join('')+'</tbody></table></div>'; }
function toggleSim(){ S.sim.on = !S.sim.on; save(); render(); toast(S.sim.on ? 'Traffic started' : 'Traffic paused'); }
async function sendOne(k, o){ const r = await simSend(k, o||{}); save(); render(); toast(r ? k+' sent → '+sendSummary(r) : 'Connection refused: no started channel on :'+FEEDS[k]); }
const TCH = {};
function tFailed(id){ const c = TCH[id]; if (!c || c[0] === '@') return null; const l = S.messages.filter(m => m.ch === c && (m.status === 'ERROR' || m.status === 'QUEUED')); return l.length ? l[l.length-1] : null; }
function goTicket(id, toMsg){ const t = TICKETS.find(x => x.id === id); const c = TCH[id]; if (t && t.env && typeof switchEnv === 'function' && S.env !== (t.envTest||t.env)) switchEnv(t.envTest||t.env);
  if (!c) return go('channels'); if (c === '@settings') return go('settings'); if (c === '@fhir') return go('fhir');
  if (toMsg){ const m = tFailed(id); if (m){ VIEW.mtab = 'raw'; return go('errors', { msg:m.id }); } }
  if (!chById(c)) return go('channels'); go('channel', { ch:c, ctab:'summary' }); }
function vTickets(){ const t = TICKETS.find(x => x.id === VIEW.ticket); const tf = VIEW.tf || '';
  const req = id => (TICKET_FROM[id]||[''])[0];
  const tt = VIEW.tt || '', trk = x => /^F/.test(x.id) ? 'fhir' : 'v2';
  const rows = TICKETS.filter(x => (!tf || (tf === 'CLOSED') === tClosed(x.id)) && (!tt || trk(x) === tt));
  const list = (tt ? '<div class="sub mt" role="status">Showing '+(tt==='fhir'?'FHIR':'HL7 v2')+' tickets · <a href="#tickets" onclick="VIEW.tt=\'\';render();return false">Show all tickets</a></div>' : '')+'<div class="card scroll"><table class="tbl tix"><thead><tr><th>#</th><th>Title</th><th>Requester</th><th>Pri</th><th>Status</th></tr></thead><tbody>'+(rows.map(x => '<tr tabindex="0" class="'+(VIEW.ticket===x.id?'sel':'')+'" onclick="openTicket(\''+x.id+'\')" onkeydown="if(event.key===\'Enter\')openTicket(\''+x.id+'\')"><td class="mono">'+x.id+'</td><td>'+esc(x.title)+'</td><td class="sub">'+esc(req(x.id))+'</td><td>'+x.pri+'</td><td>'+badge(tClosed(x.id)?'CLOSED':'OPEN')+'</td></tr>').join('') || '<tr><td colspan="5" class="sub">No '+(tf?tf.toLowerCase()+' ':'')+'tickets.</td></tr>')+'</tbody></table></div>';
  const fm = t && tFailed(t.id); const dest = t && TCH[t.id];
  const goBtns = t ? '<div class="mt"><button class="btn sm" onclick="goTicket(\''+t.id+'\')">'+(dest==='@settings'?'Go to Settings':dest==='@fhir'?'Go to FHIR server':'Go to channel')+'</button>'+(fm?' <button class="btn sm" onclick="goTicket(\''+t.id+'\',true)">Open the failed message</button>':'')+'</div>' : '';
  const det = t ? '<div class="card" id="ticketPane"><div class="trh"><b>'+t.id+' · '+esc(t.title)+'</b><span class="sp"></span>'+badge(tClosed(t.id)?'CLOSED':'OPEN')+'</div><div class="sub">Priority '+t.pri+' · '+t.area+(t.env?' · '+t.env:'')+(t.needs?' · do '+t.needs+' first':'')+'</div>'+(TICKET_FROM[t.id]?'<blockquote class="tfrom"><span class="sub">'+esc(TICKET_FROM[t.id][1])+' · reported by '+esc(TICKET_FROM[t.id][0])+'</span><br>“'+esc(TICKET_FROM[t.id][2])+'”</blockquote>':'')+'<p><b>What the team lead adds:</b> '+esc(t.body)+'</p>'+
    (t.json?'<button class="btn sm" onclick="copyJson()">Copy JSON</button><pre class="out" id="tjson">'+esc(JSON.stringify(t.json,null,2))+'</pre>':'')+samplesHtml(t)+
    '<details><summary>Hint</summary><p>'+esc(t.hint)+'</p></details>'+goBtns+ticketActions(t)+'<div id="tres"></div></div>' : '<div class="card sub">Pick a ticket. Each one is a request from someone at Penford, like a real help-desk queue. Fix it in the engine, then press "Resolve & close" (it runs the acceptance check).'+'</div>';
  const open = TICKETS.filter(x => !tClosed(x.id)).length;
  return '<div class="hd"><h1>Tickets</h1><span class="sub">'+open+' open · '+(TICKETS.length-open)+' closed</span><div class="sp"></div><select aria-label="Show tickets" onchange="VIEW.tf=this.value;render()"><option value="">All</option><option value="OPEN"'+(tf==='OPEN'?' selected':'')+'>Open</option><option value="CLOSED"'+(tf==='CLOSED'?' selected':'')+'>Closed</option></select></div><div class="split">'+list+det+'</div>'; }
function openTicket(id){ VIEW.ticket = id; render(); if (MOBILE() && $('ticketPane')) $('ticketPane').scrollIntoView(); }
function copyJson(){ const t = $('tjson').textContent; if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Copied'), () => toast('Select the text and copy it')); else toast('Select the text and copy it'); }
/* Sample messages a ticket needs: shown in full and sent one at a time (each send gets a new MSH-10). */
const SAMPLE_PREVIEW = {};
function sampleRaw(sm){ const opt = Object.assign({}, sm[2] || {}); if (typeof sm[1] === 'function') return sm[1](); if (typeof ENVS !== 'undefined' && opt.proc === undefined) opt.proc = ENVS[S.env].proc; return genMsg(sm[1], opt); }
function samplesHtml(t){ if (!t.samples || !t.samples.length) return '';
  return '<div class="card samples"><b>Sample messages for this ticket</b> <span class="sub">Send them one at a time, or all at once with "Send test messages".</span>'+t.samples.map((sm, i) => { const k = t.id+':'+i; if (!SAMPLE_PREVIEW[k]) SAMPLE_PREVIEW[k] = sampleRaw(sm);
    return '<details><summary>'+esc(sm[0])+'</summary><pre class="out">'+esc(showSeg(SAMPLE_PREVIEW[k]))+'</pre></details><div class="mt"><button class="btn sm" onclick="sendSample(\''+t.id+'\','+i+')">Send: '+esc(sm[0].split(':')[0])+'</button></div>'; }).join('')+'</div>'; }
async function sendSample(id, i){ const t = TICKETS.find(x => x.id === id); const sm = t.samples[i]; let rec = null;
  const run = async () => { if (typeof sm[1] === 'function'){ const raw = sm[1](); const port = sm[3] || (sm[2] && sm[2].port); const ch = listener(port); if (!ch) return null; return processMsg(ch, raw, 'mllp'); } return simSend(sm[1], Object.assign({}, sm[2])); };
  rec = (typeof withEnv === 'function') ? await withEnv(t.envTest || t.env || 'TEST', run) : await run();
  save(); render(); toast(rec ? sm[0].split(':')[0]+' sent → ACK '+rec.ack+' · '+rec.status : 'Connection refused: the channel for this sample is not started.'); }
async function ticketTest(id){ const t = TICKETS.find(x => x.id === id); await t.test(); save(); render(); toast('Test messages sent. Open Messages to see what happened.'); }
/* Ticket lifecycle: Open → (Resolve & close: runs the check, needs a resolution note) → Closed → Reopen */
function tRec(id){ const v = S.tickets[id]; return !v ? null : typeof v === 'string' ? { st:'CLOSED', ts:v, note:'' } : v; }
function tClosed(id){ const r = tRec(id); return !!r && r.st === 'CLOSED'; }
function ticketRun(t){ return (typeof withEnvSync === 'function') ? withEnvSync(t.env || 'TEST', () => ticketStatus(t)) : ticketStatus(t); }
function ticketActions(t){ const r = tRec(t.id);
  if (r && r.st === 'CLOSED') return '<div class="card sub tclosed"><b>Closed</b> · '+fmtT(r.ts)+(r.by?' · '+esc(r.by):'')+'<br>Resolution: '+esc(r.note||'(no note)')+'</div><div class="mt"><button class="btn" onclick="reopenTicket(\''+t.id+'\')">Reopen</button></div>';
  return '<label class="blk">Resolution note (what you changed and why)<textarea id="tnote" rows="2" placeholder="'+('e.g. What you changed, which version you deployed, and how you tested it')+'">'+esc((r&&r.draft)||'')+'</textarea></label>'+
    '<div class="mt">'+(t.test?'<button class="btn" onclick="ticketTest(\''+t.id+'\')">Send test messages</button> ':'')+'<button class="btn" onclick="ticketCheck(\''+t.id+'\')">Check only</button> <button class="btn pri" onclick="closeTicket(\''+t.id+'\')">Resolve &amp; close</button>'+(typeof ticketResetInfo==='function'&&ticketResetInfo(t)?' <button class="btn" onclick="resetTicket(\''+t.id+'\')">Reset ticket</button>':'')+'</div>'+(r&&r.reopened?'<div class="sub">Reopened '+fmtT(r.reopened)+'.</div>':''); }
function closeTicket(id, noteIn){ const t = TICKETS.find(x => x.id === id); const el = $('tnote'); const note = String(noteIn !== undefined ? noteIn : (el ? el.value : '')).trim();
  if (note.length < 5){ if ($('tres')) $('tres').innerHTML = '<div class="al s-W">Add a short resolution note first (what you changed and why).</div>'; return 'note'; }
  let r; try { r = ticketRun(t); } catch(e){ r = 'Check failed: '+e.message; }
  if (r !== true){ const prev = tRec(id) || { st:'OPEN' }; S.tickets[id] = Object.assign({}, prev, { st:'OPEN', draft:note }); save(); if ($('tres')) $('tres').innerHTML = '<div class="al s-W">Not ready to close: '+esc(r)+'</div>'; return r; }
  const prev = tRec(id); S.tickets[id] = { st:'CLOSED', ts:ts(), note, by:(typeof window !== 'undefined' && window.HE_USER) || '', reopened: prev && prev.reopened || null, history:((prev && prev.history) || []).concat([{ ev:'closed', ts:ts(), note }]) };
  save(); render(); toast(id+' closed'); return true; }
function reopenTicket(id){ const prev = tRec(id); if (!prev) return; S.tickets[id] = { st:'OPEN', reopened:ts(), draft:prev.note||'', history:(prev.history || []).concat([{ ev:'reopened', ts:ts() }]) }; save(); render(); toast(id+' reopened'); }
function ticketCheck(id){ const t = TICKETS.find(x => x.id === id); const r = ticketStatus(t); if (r === true){ $('tres').innerHTML = '<div class="al s-ok">✓ Acceptance criteria met. Add a resolution note and press Resolve &amp; close.</div>'; } else $('tres').innerHTML = '<div class="al s-W">Not yet: '+esc(r)+'</div>'; }
function vSettings(){ const ro = RO(); return '<div class="hd"><h1>Settings</h1></div>'+(ro?'':'<div class="card"><b>Import channel</b><div class="sub">Paste a Harbor Engine channel export (JSON) or choose a file. It arrives as an undeployed draft.</div><textarea id="impTxt" rows="6" spellcheck="false" aria-label="Channel JSON"></textarea><div class="rbar"><button class="btn" onclick="importCh($(\'impTxt\').value)">Import</button> <input type="file" accept=".json,application/json" onchange="this.files[0]&&this.files[0].text().then(importCh)"></div></div>')+
  '<div class="card"><b>Export</b><div class="sub">Download all channel drafts and code tables as one JSON file (good for backups or sharing with a teammate). To export one channel, use its Summary tab.</div><button class="btn" onclick="download(\'harbor-engine-config.json\',JSON.stringify({harborEngineConfig:1,channels:S.channels.map(c=>exportJson(c.draft)),tables:S.tables},null,2))">Export all</button></div>'+
  '<div class="card"><b>Onboarding tour</b> <button class="btn" onclick="tour(0)">Replay tour</button></div>'+
  (false?'':'<div class="card"><b>Reset Harbor Engine</b><div class="sub">Clears channels, messages, tables and ticket progress '+(SB?'in this browser':'(in this browser and on your other devices)')+', and restores the starting scenario.</div><button class="btn danger" onclick="resetAll()">Reset everything</button></div>')+
 '<div class="card sub">Harbor Engine is a practice tool. All patients, staff and organizations are sample training data, and SSNs use never-issued 900-series numbers. '+(SB?'Everything runs in your browser, and nothing is sent anywhere.':'Messages are processed in your browser. Your engine work is saved here and synced to your account, so your other devices show the same version.')+' Engine ACKs follow HL7 v2.5.1 original mode (MSA-1 AA/AE/AR, MSA-2 = MSH-10, ERR-2 location, ERR-3 codes from HL7 table 0357).</div>'; }
function resetAll(){ confirmBox('Reset Harbor Engine?', 'Your channels, messages, code tables and ticket progress will be replaced with the starting scenario'+(SB?' in this browser.':', here and on your other devices.'), () => { localStorage.removeItem(HE_KEY); load(); HE_REV = heStoredRev(); save(); VIEW = { tab:'dash', ch:null, ctab:'summary', msg:null, mtab:'raw', q:{}, ticket:null }; render(); toast('Harbor Engine reset'); }); }

/* --- onboarding tour --- */
const TOUR = [
  ['#nav','Welcome to Harbor Engine','This is a practice interface engine for Penford Medical Center. Channels receive HL7 messages, filter and transform them, and route them to partner systems, just like on the job.'],
  ['#view','Dashboard','Every channel with its status and counts. "Queued" means messages are waiting for a partner that is down. Press "Start traffic" to stream live messages.'],
  ['[data-tab=messages]','Messages','Every message that came in. Open one to see it raw or parsed, the reply (ACK) the sender got, and each partner\'s response.'],
  ['[data-tab=errors]','Error queue','Your daily to-do list: anything rejected, NAKed or broken in a transformer.'],

];
function tourEnd(){ $('tour').hidden = true; document.querySelectorAll('.hl').forEach(x => x.classList.remove('hl')); S.tour = true; save(); }
function tour(i){ const o = $('tour'); if (i >= TOUR.length) return tourEnd(); const [sel, h, t] = TOUR[i]; const el = document.querySelector(sel);
  document.querySelectorAll('.hl').forEach(x => x.classList.remove('hl')); if (el) el.classList.add('hl');
  o.hidden = false; o.innerHTML = '<div class="tbox" role="dialog" aria-label="Tour"><div class="sub">'+(i+1)+' of '+TOUR.length+'</div><h3>'+esc(h)+'</h3><p>'+esc(t)+'</p><div class="trh"><button class="btn" onclick="tourEnd()">Skip tour</button><span class="sp"></span>'+(i?'<button class="btn" onclick="tour('+(i-1)+')">Back</button> ':'')+'<button class="btn pri" onclick="tour('+(i+1)+')">'+(i===TOUR.length-1?'Get started':'Next')+'</button></div></div>'; }

/* --- boot --- */
{ const _pm = processMsg; processMsg = async function(){ HE_BUSY++; try { return await _pm.apply(this, arguments); } finally { HE_BUSY--; if (!HE_BUSY && HE_PEND) setTimeout(heCheck, 0); } }; }
function boot(){ load(); heSynced(); try { const q = new URLSearchParams(location.search).get('track'); if (q === 'v2' || q === 'fhir') VIEW.tt = q; } catch(e){} const h = location.hash.slice(1).split('/'); if (h[0]) VIEW.tab = h[0]; if (h[1]) VIEW.ch = h[1]; if (VIEW.tab === 'channel' && !chById(VIEW.ch)) VIEW.tab = 'channels';
  render(); startTicker(); if (!S.tour) setTimeout(() => tour(0), 300); if (HE_SRV.on) heSrvPull();
  { const dl = $('dlg'); if (dl && dl.addEventListener) dl.addEventListener('close', () => setTimeout(() => { if (HE_RPEND) render(true); }, 0)); }
  let w = innerWidth; window.addEventListener('resize', () => { if ((w <= 760) !== (innerWidth <= 760)) render(); w = innerWidth; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('tour').hidden) tourEnd(); }); }
if (typeof document !== 'undefined' && document.getElementById('view')) document.addEventListener('DOMContentLoaded', boot);
