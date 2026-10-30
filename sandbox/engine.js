// AckHarbor™ Academy — Interface Engine Lab (original code, client-side only).
// Training sample data only (Penford).
const ENG_SAMPLES = {
  "CODES — ORU with Penford local lab codes": "MSH|^~\\&|HARBORLAB|PMC|PENEHR|PMC|20260918101500-0400||ORU^R01^ORU_R01|HL-ORU-90120|P|2.5.1\rPID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F\rPV1|1|ER|ED^12^A^PMC||||||||||||||||V1008841^^^PMC^VN\rOBR|1|ORD-77120^PENEHR|LAB-90120^HARBORLAB|GLU^Glucose^L|||20260918093000-0400\rOBX|1|NM|GLU^Glucose^L||182|MG/DL|70-99|HIGH|||F",
  "ESCAPES — A04 with a comment (Maya Chen)": "MSH|^~\\&|PENEHR|PMC|HARBORLAB|PMC|20260914160512-0400||ADT^A04^ADT_A01|PMC-ADT-160599|P|2.5.1\rEVN|A04|20260914160500-0400\rPID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F\rPV1|1|E|ED^12^A^PMC||||||||||||||||V1008841^^^PMC^VN\rNTE|1||Replace this text",
  "FORMATS — A04 with messy values (Tam Nguyen)": "MSH|^~\\&|PENEHR|PMC|HARBORLAB|PMC|20260917091500-0400||ADT^A04^ADT_A01|PMC-ADT-190007|P|2.5.1\rEVN|A04|20260917091400-0400\rPID|1||10044120^^^PMC^MR||Nguyen^Tam||11/30/1992|F|||7 Quay Ln^^Penford^^00000||(555) 555-0172^PRN^PH||||||900-00-0001\rPV1|1|E|ED^14^A^PMC|E|||||||||||||||V1009310^^^PMC^VN",
  "ADT^A04 — ED registration (Maya Chen)": "MSH|^~\\&|PENEHR|PMC|HARBORLAB|PMC|20260914160512-0400||ADT^A04^ADT_A01|PMC-ADT-160501|P|2.5.1|||AL|NE\rEVN|A04|20260914160500-0400\rPID|1||10028471^^^PMC^MR~P880214^^^PMCMPI^PI||Chen^Maya^Lin||19880314|F|||22 Mercer St^^Penford^^00000||^PRN^PH^^^555^5550148|||||E449102^^^PMC^AN\rPV1|1|E|ED^12^A^PMC|E|||D143796^Patel^Anika^R^^^MD|||EMR||||7|||||V1008841^^^PMC^VN",
  "ADT^A01 — Inpatient admit (Omar Reyes)": "MSH|^~\\&|PENEHR|PMC|HARBORLAB|PMC|20260915083000-0400||ADT^A01^ADT_A01|PMC-ADT-170002|P|2.5.1|||AL|NE\rEVN|A01|20260915082900-0400\rPID|1||10031177^^^PMC^MR||Reyes^Omar^J||19650702|M|||9 Harbor Rd^^Penford^^00000||^PRN^PH^^^555^5550199\rPV1|1|I|4W^402^B^PMC|U|||D200411^Okafor^Grace^^^^MD||||||||||||V2001930^^^PMC^VN",
  "ORM^O01 — Stat troponin (lab)": "MSH|^~\\&|PENEHR|PMC|HARBORLAB|PMC|20260914162800-0400||ORM^O01^ORM_O01|PMC-ORM-162801|P|2.5.1\rPID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F\rPV1|1|E|ED^12^A^PMC||||||||||||||||V1008841^^^PMC^VN\rORC|NW|LAB-88321^PENEHR|||||^^^^^S\rOBR|1|LAB-88321^PENEHR||10839-9^Troponin I SerPl-mCnc^LN|||20260914162800-0400|||||||||D143796^Patel^Anika||||||||LAB",
  "OML^O21 — Lab order, newer message type (troponin)": "MSH|^~\\&|PENEHR|PMC|HARBORLAB|PMC|20260914162900-0400||OML^O21^OML_O21|PMC-OML-162901|P|2.5.1\rPID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F\rPV1|1|E|ED^12^A^PMC||||||||||||||||V1008841^^^PMC^VN\rORC|NW|LAB-88322^PENEHR|||||^^^^^S\rOBR|1|LAB-88322^PENEHR||10839-9^Troponin I SerPl-mCnc^LN|||20260914162900-0400|||||||||D143796^Patel^Anika||||||||LAB",
  "ORM^O01 — Chest X-ray (radiology)": "MSH|^~\\&|PENEHR|PMC|HARBORRAD|PMC|20260914163500-0400||ORM^O01^ORM_O01|PMC-ORM-163502|P|2.5.1\rPID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F\rORC|NW|RAD-5512^PENEHR\rOBR|1|RAD-5512^PENEHR||XR-CHEST2^Chest X-ray 2 views^L|||20260914163500-0400|||||||||D143796^Patel^Anika||||||||RAD",
  "ORU^R01 — Troponin result": "MSH|^~\\&|HARBORLAB|PMC|PENEHR|PMC|20260914171000-0400||ORU^R01^ORU_R01|HL-ORU-900113|P|2.5.1\rPID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F\rOBR|1|LAB-88321^PENEHR|HL55001^HARBORLAB|10839-9^Troponin I SerPl-mCnc^LN|||20260914162800-0400\rOBX|1|NM|10839-9^Troponin I SerPl-mCnc^LN||0.02|ng/mL|<0.04|N|||F",
  "DFT^P03 — ED charge to Billing (Maya Chen)": "MSH|^~\\&|PENEHR|PMC|PENFIN|PMC|20260914180055-0400||DFT^P03^DFT_P03|PMC-DFT-180001|P|2.5.1\rEVN|P03|20260914180050-0400\rPID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F||||||||||E449102^^^PMC^AN\rPV1|1|E|ED^12^A^PMC||||D143796^Patel^Anika^R^^^MD||||||||||||V1008841^^^PMC^VN\rFT1|1|||20260914162800-0400|20260914180050-0400|CG|LAB-TROP^Troponin I^L|||1|||||||||||||||84484^Troponin, quantitative^C4",
  "BROKEN — ADT^A04 with errors": "MSH|^~\\&|PENEHR|PMC|HARBORLAB|PMC|2026-09-14 16:05||ADT^A04^ADT_A01||P|2.5.1\rPID|1||||Nguyen^Tam||19921340|Q\rPV1|1|E",
  "Z-segment — ADT^A08 with ZPI": "MSH|^~\\&|PENEHR|PMC|HARBORLAB|PMC|20260916101500-0400||ADT^A08^ADT_A01|PMC-ADT-180044|P|2.5.1\rEVN|A08|20260916101400-0400\rPID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F\rPV1|1|O|CLINIC^^^PMC\rZPI|1|Prefers text reminders|Y"
};
const ENG_TABLES_DEFAULT = '{\n  "sex": {"M":"male","F":"female","U":"unknown","O":"other"},\n  "class": {"E":"EMER","I":"INPT","O":"OUTPT"}\n}';
const ENG_ROUTES_DEFAULT = [
  { dest: "Lab", types: "ORM^O01,OML^O21", cond: "OBR-24=LAB" },
  { dest: "Radiology", types: "ORM^O01", cond: "OBR-24=RAD" },
  { dest: "Billing", types: "ADT^A01,ADT^A04,DFT^P03", cond: "" }
];
const VALID_SEX = ["M","F","U","O","A","N"];
let ENG = null;
function engDefault(){ return { input: ENG_SAMPLES["ADT^A04 — ED registration (Maya Chen)"], filter: "", maps: [], tables: ENG_TABLES_DEFAULT, routes: JSON.parse(JSON.stringify(ENG_ROUTES_DEFAULT)), js: "", log: [], done: {}, last: null }; }
function engLoad(){ try{ ENG = Object.assign(engDefault(), JSON.parse(localStorage.getItem('iha_engine')||'{}')); }catch(e){ ENG = engDefault(); } }
function engSave(){ try{ localStorage.setItem('iha_engine', JSON.stringify(ENG)); }catch(e){} }
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---------- Parser ----------
function hl7Parse(raw){
  raw = String(raw||'').replace(/\r\n|\n/g,'\r').replace(/^\s+|\s+$/g,'');
  if (!raw.startsWith('MSH')) return { ok:false, error:'Message must start with an MSH segment.', segs:[] };
  const fs = raw[3], enc = raw.slice(4, 8);
  const d = { fs, comp: enc[0]||'^', rep: enc[1]||'~', esc: enc[2]||'\\', sub: enc[3]||'&' };
  const segs = raw.split('\r').filter(Boolean).map(line => {
    const parts = line.split(fs); const id = parts[0];
    let fields;
    if (id === 'MSH') fields = [fs, parts[1]].concat(parts.slice(2)); // MSH-1 = separator, MSH-2 = encoding chars
    else fields = parts.slice(1);
    return { id, fields };
  });
  return { ok:true, d, segs };
}
function hl7Serialize(m){
  return m.segs.map(s => s.id==='MSH' ? ['MSH'].concat(s.fields.slice(1)).join(m.d.fs) : [s.id].concat(s.fields).join(m.d.fs)).join('\r');
}
// path: SEG[n]-F[r].C.S   e.g. PID-5.1, PID-3[2].5, OBX[2]-5
function parsePath(p){
  const r = /^([A-Z0-9]{3})(?:\[(\d+)\])?(?:-(\d+)(?:\[(\d+)\])?(?:\.(\d+))?(?:\.(\d+))?)?$/.exec(String(p).trim().toUpperCase());
  if (!r) return null;
  return { seg:r[1], si:+(r[2]||1), f:r[3]?+r[3]:0, ri:+(r[4]||1), c:r[5]?+r[5]:0, s:r[6]?+r[6]:0 };
}
function hl7Get(m, path){
  const p = parsePath(path); if (!p || !m.ok) return undefined;
  const segs = m.segs.filter(s => s.id === p.seg); const seg = segs[p.si-1]; if (!seg) return undefined;
  if (!p.f) return seg.id;
  let v = seg.fields[p.f-1]; if (v === undefined) return '';
  if (seg.id==='MSH' && p.f<=2) return v;
  v = v.split(m.d.rep)[p.ri-1]; if (v === undefined) return '';
  if (!p.c) return v; v = v.split(m.d.comp)[p.c-1]; if (v === undefined) return '';
  if (!p.s) return v; v = v.split(m.d.sub)[p.s-1]; return v === undefined ? '' : v;
}
function hl7Set(m, path, val){
  const p = parsePath(path); if (!p || !p.f) throw new Error('Bad target path: '+path);
  let segs = m.segs.filter(s => s.id === p.seg);
  while (segs.length < p.si){ const ns={id:p.seg, fields:[]}; m.segs.push(ns); segs.push(ns); }
  const seg = segs[p.si-1];
  if (seg.id==='MSH' && p.f<=2) throw new Error('MSH-1 and MSH-2 cannot be mapped.');
  while (seg.fields.length < p.f) seg.fields.push('');
  const pad = (arr,n)=>{ while(arr.length<n) arr.push(''); return arr; };
  let reps = pad(seg.fields[p.f-1].split(m.d.rep), p.ri);
  if (!p.c) reps[p.ri-1] = val; else {
    let comps = pad(reps[p.ri-1].split(m.d.comp), p.c);
    if (!p.s) comps[p.c-1] = val; else { let subs = pad(comps[p.c-1].split(m.d.sub), p.s); subs[p.s-1] = val; comps[p.c-1] = subs.join(m.d.sub); }
    reps[p.ri-1] = comps.join(m.d.comp).replace(new RegExp('\\'+m.d.comp+'+$'),'');
  }
  seg.fields[p.f-1] = reps.join(m.d.rep);
}
function msgType(m){ return (hl7Get(m,'MSH-9.1')||'')+'^'+(hl7Get(m,'MSH-9.2')||''); }

// ---------- Validator ----------
const DTM_RE = /^\d{4}(\d{2}(\d{2}(\d{2}(\d{2}(\d{2}(\.\d{1,4})?)?)?)?)?)?([+-]\d{4})?$/;
const NM_RE=/^[+-]?(\d+\.?\d*|\.\d+)$/;
const T0203=["AM", "AN", "ANC", "AND", "ANON", "ANT", "APRN", "BA", "BC", "BR", "BRN", "CC", "CY", "DDS", "DEA", "DFN", "DI", "DL", "DN", "DO", "DPM", "DR", "DS", "EI", "EN", "FI", "GI", "GL", "GN", "HC", "IND", "JHN", "LI", "LN", "LR", "MA", "MB", "MC", "MCD", "MCN", "MCR", "MD", "MI", "MR", "MRT", "MS", "NE", "NH", "NI", "NII", "NIIP", "NNxxx", "NP", "NPI", "OD", "PA", "PCN", "PE", "PEN", "PI", "PN", "PNT", "PPN", "PRC", "PRN", "PT", "QA", "RI", "RN", "RPH", "RR", "RRI", "SL", "SN", "SR", "SS", "TAX", "TN", "U", "UPIN", "VN", "VS", "WC", "WCN", "XX"]; // HL7 v2.5.1 table 0203
function dtmValid(v){ const r=/^(\d{4})(?:(\d{2})(?:(\d{2})(?:(\d{2})(?:(\d{2})(?:(\d{2})(?:\.\d{1,4})?)?)?)?)?)?([+-]\d{4})?$/.exec(v); if(!r) return false;
  const [,y,mo,dd,hh,mi,ss,tz]=r; if(mo&&(+mo<1||+mo>12)) return false; if(dd){ const dim=new Date(+y,+mo,0).getDate(); if(+dd<1||+dd>dim) return false; }
  if(hh&&+hh>23) return false; if(mi&&+mi>59) return false; if(ss&&+ss>59) return false; if(tz&&(+tz.slice(1,3)>23||+tz.slice(3)>59)) return false; return true; }
function dtHint(v){ if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) return ' Looks like MM/DD/YYYY; v2 wants YYYYMMDD.'; if(/^\d{4}-\d{2}-\d{2}/.test(v)) return ' Looks like ISO/FHIR style with dashes; v2 wants digits only, e.g. 19880314.'; return ''; }
function hl7Validate(m){
  const errs = []; const add=(sev,loc,msg,code)=>errs.push({sev,loc,msg,code});
  if (!m.ok){ add('E','MSH',m.error,'100'); return errs; }
  if (m.d.fs !== '|') add('W','MSH-1','Field separator is "'+m.d.fs+'"; "|" is recommended.','');
  if (hl7Get(m,'MSH-2').length < 4) add('E','MSH-2','Encoding characters must list component, repetition, escape and subcomponent (e.g. ^~\\&).','100');
  const req = {'MSH-3':'Sending application','MSH-7':'Message date/time','MSH-9':'Message type','MSH-10':'Message control ID','MSH-11':'Processing ID','MSH-12':'Version ID'};
  for (const k in req) if (!hl7Get(m,k)) add('E',k,req[k]+' is required.','101');
  const t7=hl7Get(m,'MSH-7'); if (t7 && !dtmValid(t7)) add('E','MSH-7','"'+t7+'" is not a valid TS/DTM (YYYY[MM[DD[HH[MM[SS[.S…]]]]]][+/-ZZZZ]).'+dtHint(t7),'102'); if (t7 && dtmValid(t7) && !/[+-]\d{4}$/.test(t7)) add('W','MSH-7','No time zone offset: the receiver must assume the sender\'s local time. Send +/-ZZZZ.','');
  if (t7 && t7.length>26) add('W','MSH-7','Longer than 26, the v2.5.1 length of TS.',''); const p11=hl7Get(m,'MSH-11.1'); if (p11 && !['P','T','D'].includes(p11)) add('E','MSH-11','Processing ID must be P, T or D.','202');
  if (hl7Get(m,'MSH-9') && !hl7Get(m,'MSH-9.2')) add('E','MSH-9.2','Trigger event component is missing.','101');
  m.segs.forEach((s,i)=>{ if(!/^[A-Z][A-Z0-9]{2}$/.test(s.id)) add('E','Segment '+(i+1),'"'+s.id+'" is not a valid segment ID.','100'); });
  const type=hl7Get(m,'MSH-9.1');
  if (['ADT','ORM','ORU','OML','SIU','DFT'].includes(type)){
    if (!m.segs.some(s=>s.id==='PID')) add('E','PID','PID segment is required for '+type+'.','100');
    else {
      if (!hl7Get(m,'PID-3.1')) add('E','PID-3','Patient identifier list (PID-3) is required.','101');
      if (hl7Get(m,'PID-3.1') && !hl7Get(m,'PID-3.5')) add('W','PID-3.5','Identifier type code (e.g. MR) is missing.','');
      if (!hl7Get(m,'PID-5')) add('E','PID-5','Patient name (PID-5) is required.','101');
      const dob=hl7Get(m,'PID-7'); if (dob && !dtmValid(dob)) add('E','PID-7','Date of birth "'+dob+'" is not a valid date.'+dtHint(dob),'102');
      if (!hl7Get(m,'PID-5.1') && hl7Get(m,'PID-5.2')) add('W','PID-5.1','XPN puts the family name first (family^given^middle).','');
      const ssn=hl7Get(m,'PID-19'); if (ssn){ if(ssn.length>16) add('W','PID-19','PID-19 is longer than 16, its v2.5.1 length.',''); add('W','PID-19','PID-19 is backward-compatible only in v2.5.1 and withdrawn in v2.7+. Prefer PID-3 with identifier type SS, and send SSNs only where the interface truly needs them (PHI).',''); }
      (m.segs.find(x=>x.id==='PID').fields[12]||'').split(m.d.rep).filter(Boolean).forEach((t,i)=>{ const c=t.split(m.d.comp); if(c[0] && !c[6]) add('W','PID-13','Phone "'+c[0]+'" is only in XTN.1 (v2.3 style, backward-compatible since v2.3). Prefer components: ^PRN^PH^^^area^local.',''); if(c[5] && !(NM_RE.test(c[5]) && c[5].length<=5)) add('E','PID-13.6','Area/city code "'+c[5]+'" must be NM (digits only), at most 5 characters.','102'); if(c[6] && !(NM_RE.test(c[6]) && c[6].length<=9)) add('E','PID-13.7','Local number "'+c[6]+'" must be NM (digits, no dash), at most 9 characters.','102'); });
      const zip=hl7Get(m,'PID-11.5'); if (zip && zip.length>12) add('W','PID-11.5','ZIP/postal code is longer than 12, the v2.5.1 length of XAD.5.','');
      (m.segs.find(x=>x.id==='PID').fields[2]||'').split(m.d.rep).forEach(r=>{ const t=r.split(m.d.comp)[4]; if(t && !T0203.includes(t)) add('W','PID-3.5','Identifier type "'+t+'" is not a v2.5.1 table 0203 code (e.g. MR, PI, AN, VN, SS).',''); });
      const sx=hl7Get(m,'PID-8'); if (sx && !VALID_SEX.includes(sx)) add('E','PID-8','Administrative sex "'+sx+'" is not in table 0001 values (M, F, U, O, A, N).','103');
    }
  }
  if (type==='ADT' && !m.segs.some(s=>s.id==='PV1') && hl7Get(m,'MSH-9.2')!=='A40') add('E','PV1','PV1 segment is required for this ADT event.','100');
  if (type==='ORM' && !m.segs.some(s=>s.id==='ORC')) add('E','ORC','ORC segment is required for ORM.','100');
  m.segs.filter(s=>s.id==='OBX').forEach((s,i)=>{ const vt=s.fields[1]; if(vt==='NM' && s.fields[4] && !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s.fields[4])) add('E','OBX['+(i+1)+']-5','Value type NM but value "'+s.fields[4]+'" is not numeric.','102'); const c3=(s.fields[2]||'').split(m.d.comp); if(c3[0] && !c3[2]) add('W','OBX['+(i+1)+']-3','Code "'+c3[0]+'" has no coding system (component 3), e.g. LN for LOINC.',''); });
  return errs;
}

// ---------- Filter / Transform / Router / ACK ----------
function passesFilter(m, filter){
  const list = String(filter||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
  if (!list.length) return true;
  const t = msgType(m).toUpperCase();
  return list.some(f => f===t || (f.endsWith('^*') && t.startsWith(f.slice(0,-1))));
}
function resolveSource(src, inMsg, tables){
  src = String(src||'').trim();
  let r;
  if ((r=/^'(.*)'$/.exec(src)) || (r=/^"(.*)"$/.exec(src))) return r[1];
  if ((r=/^lookup\(\s*(\w+)\s*,\s*([^)]+)\)$/i.exec(src))){
    const t = tables[r[1]]; if (!t) throw new Error('Unknown code table "'+r[1]+'"');
    const k = hl7Get(inMsg, r[2]); return (t[k]!==undefined) ? t[k] : (t['*']!==undefined ? t['*'] : k);
  }
  if (src.toUpperCase()==='NOW()') return nowDTM();
  if (parsePath(src)) return hl7Get(inMsg, src) || '';
  throw new Error('Source "'+src+'" must be a path (PID-5.1), a \'constant\', lookup(table, PATH) or NOW()');
}
function nowDTM(){ const d=new Date(), p=n=>String(n).padStart(2,'0'); const o=-d.getTimezoneOffset(); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+(o>=0?'+':'-')+p(Math.floor(Math.abs(o)/60))+p(Math.abs(o)%60); }
function applyMaps(inMsg, maps, tablesText){
  let tables; try { tables = JSON.parse(tablesText||'{}'); } catch(e){ throw new Error('Code tables are not valid JSON: '+e.message); }
  const out = JSON.parse(JSON.stringify(inMsg));
  (maps||[]).forEach(mp => { if (!mp.target) return; hl7Set(out, mp.target, resolveSource(mp.source, inMsg, tables)); });
  return out;
}
// Sandboxed user JS: runs in a Web Worker (no DOM, no page access), 1s timeout.
function runSandbox(code, msg){
  return new Promise((resolve, reject) => {
    if (!String(code||'').trim()) return resolve(msg);
    const src = `self.onmessage=function(ev){var msg=ev.data;var d=msg.d;
      function P(p){var r=/^([A-Z0-9]{3})(?:\\[(\\d+)\\])?-(\\d+)(?:\\.(\\d+))?$/.exec(p);if(!r)throw new Error('Bad path '+p);return{s:r[1],i:+(r[2]||1),f:+r[3],c:r[4]?+r[4]:0};}
      function seg(p){return msg.segs.filter(function(s){return s.id===p.s})[p.i-1];}
      function get(path){var p=P(path),s=seg(p);if(!s)return '';var v=s.fields[p.f-1]||'';return p.c?(v.split(d.comp)[p.c-1]||''):v;}
      function set(path,val){var p=P(path),s=seg(p);if(!s)throw new Error('No segment '+p.s);while(s.fields.length<p.f)s.fields.push('');if(!p.c){s.fields[p.f-1]=String(val);return;}var c=s.fields[p.f-1].split(d.comp);while(c.length<p.c)c.push('');c[p.c-1]=String(val);s.fields[p.f-1]=c.join(d.comp);}
      function removeSegment(id){msg.segs=msg.segs.filter(function(s){return s.id!==id});}
      try{(function(get,set,removeSegment,msg){${code}\n})(get,set,removeSegment,msg);postMessage({ok:true,msg:msg});}catch(e){postMessage({ok:false,error:String(e&&e.message||e)});}};`;
    let w; try { w = new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'}))); } catch(e){ return reject(new Error('Sandbox unavailable: '+e.message)); }
    const timer = setTimeout(()=>{ w.terminate(); reject(new Error('Transform timed out (1s limit).')); }, 1000);
    w.onmessage = ev => { clearTimeout(timer); w.terminate(); ev.data.ok ? resolve(ev.data.msg) : reject(new Error('Transform error: '+ev.data.error)); };
    w.onerror = ev => { clearTimeout(timer); w.terminate(); ev.preventDefault && ev.preventDefault(); reject(new Error('Transform syntax error: '+(ev.message||'unknown'))); };
    w.postMessage(msg);
  });
}
function routeMsg(m, routes){
  const t = msgType(m).toUpperCase();
  return (routes||[]).filter(r => {
    const types = String(r.types||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
    const typeOk = !types.length || types.some(f => f===t || (f.endsWith('^*') && t.startsWith(f.slice(0,-1))));
    if (!typeOk) return false;
    if (!r.cond) return true;
    const c = /^\s*([^=!]+?)\s*(!?=)\s*(.*)$/.exec(r.cond); if (!c) return false;
    const v = hl7Get(m, c[1]) || ''; return c[2]==='=' ? v===c[3].trim() : v!==c[3].trim();
  }).map(r => r.dest);
}
function hl7Esc(t){ return String(t).replace(/\\/g,'\\E\\').replace(/\|/g,'\\F\\').replace(/\^/g,'\\S\\').replace(/&/g,'\\T\\').replace(/~/g,'\\R\\'); }
function buildAck(m, errs){
  const hard = errs.filter(e=>e.sev==='E');
  let code = 'AA';
  if (!m.ok || hard.some(e=>/^MSH/.test(e.loc) || e.loc.startsWith('Segment'))) code = 'AR';
  else if (hard.length) code = 'AE';
  const g = p => m.ok ? (hl7Get(m,p)||'') : '';
  const lines = [
    ['MSH','^~\\&', g('MSH-5'), g('MSH-6'), g('MSH-3'), g('MSH-4'), nowDTM(), '', 'ACK^'+g('MSH-9.2')+'^ACK', 'ACK'+Date.now().toString().slice(-8), g('MSH-11')||'P', g('MSH-12')||'2.5.1'].join('|'),
    ['MSA', code, g('MSH-10')].join('|')
  ];
  hard.forEach(e => { const p=parsePath(e.loc.replace(/\[\d+\]/,'')); const loc = p ? [p.seg, 1, p.f||'', '', p.c||''].join('^').replace(/\^+$/,'') : ''; lines.push(['ERR','',loc, (e.code||'207')+'^'+hl7Esc(e.msg.slice(0,160))+'^HL70357','E'].join('|')); });
  return { code, text: lines.join('\r') };
}

// ---------- Pipeline ----------
async function engProcess(){
  engReadUI();
  const m = hl7Parse(ENG.input);
  const errs = hl7Validate(m);
  const res = { time: new Date().toLocaleTimeString(), type: m.ok?msgType(m):'?', ctrl: m.ok?hl7Get(m,'MSH-10'):'', errs, status:'', out:'', dests:[], ack:'', ackCode:'' };
  const ack = buildAck(m, errs); res.ack = ack.text; res.ackCode = ack.code;
  if (ack.code !== 'AA') res.status = ack.code==='AR' ? 'Rejected' : 'Error';
  else if (!passesFilter(m, ENG.filter)) res.status = 'Filtered';
  else {
    try {
      let out = applyMaps(m, ENG.maps, ENG.tables);
      out = await runSandbox(ENG.js, out);
      res.out = hl7Serialize(out);
      res.dests = routeMsg(out, ENG.routes);
      res.status = res.dests.length ? 'Sent' : 'No route';
    } catch(e){ res.status = 'Transform failed'; res.errs = errs.concat([{sev:'E',loc:'Transform',msg:e.message}]); }
  }
  ENG.last = res; ENG.log.unshift(res); ENG.log = ENG.log.slice(0,50); engSave(); engRender(m);
  return res;
}

// ---------- UI ----------
function engReadUI(){
  const $ = id => document.getElementById(id);
  if (!$('engInput') || window.ENG_MODE==='guided') return;
  ENG.input = $('engInput').value; ENG.filter = $('engFilter').value; ENG.tables = $('engTables').value; ENG.js = $('engJs').value;
  ENG.maps = [...document.querySelectorAll('#engMaps .map-row')].map(r => ({ target: r.querySelector('.mt').value.trim(), source: r.querySelector('.ms').value.trim() })).filter(x=>x.target||x.source);
  ENG.routes = [...document.querySelectorAll('#engRoutes .route-row')].map(r => ({ dest: r.querySelector('.rd').value.trim(), types: r.querySelector('.rt').value.trim(), cond: r.querySelector('.rc').value.trim() })).filter(x=>x.dest);
  engSave();
}
function engAddMap(t='',s=''){ engReadUI(); ENG.maps.push({target:t,source:s}); engRenderEditors(); }
function engDelMap(i){ engReadUI(); ENG.maps.splice(i,1); engSave(); engRenderEditors(); }
function engRenderEditors(){
  document.getElementById('engMaps').innerHTML = ENG.maps.map((mp,i)=>`<div class="map-row"><input class="mt" placeholder="Target e.g. PID-8" value="${esc(mp.target)}"><span>←</span><input class="ms" placeholder="PID-8 | 'CONST' | lookup(sex, PID-8)" value="${esc(mp.source)}"><button class="btn secondary sm" data-ev-click="engDelMap" data-args='[${i}]' aria-label="Remove mapping">✕</button></div>`).join('') || '<p class="muted">No mappings yet — outbound equals inbound.</p>';
  document.getElementById('engRoutes').innerHTML = ENG.routes.map(r=>`<div class="route-row"><input class="rd" value="${esc(r.dest)}" aria-label="Destination"><input class="rt" value="${esc(r.types)}" placeholder="ORM^O01,ADT^*" aria-label="Types"><input class="rc" value="${esc(r.cond)}" placeholder="optional e.g. OBR-24=LAB" aria-label="Condition"></div>`).join('');
}
function engTree(m){
  if (!m.ok) return '<p class="err">'+esc(m.error)+'</p>';
  return m.segs.map((s,si)=>{
    const idx = m.segs.slice(0,si+1).filter(x=>x.id===s.id).length; const sp = s.id+(idx>1?'['+idx+']':'');
    return `<details ${si<4?'open':''}><summary><b>${esc(s.id)}</b></summary><ul>`+s.fields.map((f,fi)=>{
      if (f==='') return ''; const path=sp+'-'+(fi+1);
      const reps = (s.id==='MSH'&&fi<2)?[f]:f.split(m.d.rep);
      return `<li><code class="pth" data-ev-click="engLookup" data-args='["${path}"]'>${path}</code> ${esc(f)}`+((reps.length>1||f.includes(m.d.comp))&&!(s.id==='MSH'&&fi<2)?'<ul>'+reps.map((r,ri)=>{ const rp=reps.length>1?`${sp}-${fi+1}[${ri+1}]`:path; return r.split(m.d.comp).map((c,ci)=>c?`<li><code class="pth" data-ev-click="engLookup" data-args='["${rp}.${ci+1}"]'>${rp}.${ci+1}</code> ${esc(c)}</li>`:'').join(''); }).join('')+'</ul>':'')+'</li>';
    }).join('')+'</ul></details>';
  }).join('');
}
function engLookup(path){
  const box=document.getElementById('engPath'); if(path) box.value=path;
  const m=hl7Parse(window.ENG_MODE==='guided'||!document.getElementById('engInput') ? ENG.input : document.getElementById('engInput').value); const v=hl7Get(m, box.value);
  document.getElementById('engPathOut').textContent = v===undefined ? 'Not found / invalid path' : (v===''?'(empty)':v);
}
function engRender(m){
  m = m || hl7Parse(ENG.input);
  const $ = id => document.getElementById(id);
  if (!$('engTree')) { engRenderExercises(); return; }
  $('engTree').innerHTML = engTree(m);
  const r = ENG.last;
  if (r){
    $('engErrors').innerHTML = r.errs.length ? '<ul>'+r.errs.map(e=>`<li class="${e.sev==='E'?'err':'warn'}"><b>${e.sev==='E'?'Error':'Warning'}</b> ${esc(e.loc)}: ${esc(e.msg)}</li>`).join('')+'</ul>' : '<p class="ok">✓ No validation errors.</p>';
    $('engOut').textContent = r.out ? r.out.replace(/\r/g,'\n') : '('+r.status+' — nothing sent)';
    $('engAck').textContent = r.ack.replace(/\r/g,'\n');
    $('engAckCode').textContent = r.ackCode; $('engAckCode').className='badge b-'+r.ackCode;
    ['Lab','Radiology','Billing'].forEach(dn => { const el=$('dest-'+dn); if(el){ const n=ENG.log.filter(l=>l.dests.includes(dn)).length; el.querySelector('span').textContent=n; el.classList.toggle('hit', r.dests.includes(dn)); } });
  }
  $('engLog').innerHTML = ENG.log.length ? '<table class="exam-table"><tr><th>Time</th><th>Type</th><th>Control ID</th><th>ACK</th><th>Status</th><th>Routed to</th></tr>'+ENG.log.map(l=>`<tr><td>${esc(l.time)}</td><td>${esc(l.type)}</td><td>${esc(l.ctrl)}</td><td>${esc(l.ackCode)}</td><td>${esc(l.status)}</td><td>${esc(l.dests.join(', '))}</td></tr>`).join('')+'</table>' : '<p class="muted">No messages processed yet.</p>';
  engRenderExercises();
}
function engPickSample(name){ if(!ENG_SAMPLES[name]) return; document.getElementById('engInput').value = ENG_SAMPLES[name].replace(/\r/g,'\n'); engReadUI(); engRender(); }
function engClearLog(){ ENG.log=[]; ENG.last=null; engSave(); engRender(); }
function engReset(){ if(!confirm('Reset all Engine Lab settings and progress?')) return; ENG=engDefault(); engSave(); initEngine(true); }

// ---------- Guided exercises ----------
const ENG_EX = (typeof ENG_EX_DATA !== 'undefined') ? ENG_EX_DATA : [];
function engRenderExercises(){
  const el=document.getElementById('engEx'); if(!el) return;
  const done=Object.keys(ENG.done).filter(k=>ENG.done[k]).length;
  el.innerHTML = `<p><b>${done}/${ENG_EX.length}</b> exercises complete (saved in this browser).</p>` + ENG_EX.map(x=>`<div class="ex ${ENG.done[x.id]?'done':''}"><div><b>${ENG.done[x.id]?'✓ ':''}${x.title}</b> <small>· ${x.mod}</small></div><p>${esc(x.goal)}</p>${x.input?`<input id="ans-${x.id}" placeholder="Your answer">`:''}<button class="btn primary sm" data-ev-click="engCheck" data-args='["${x.id}"]'>Check my work</button> <span class="ex-msg" id="msg-${x.id}"></span></div>`).join('');
}
function engCheck(id){
  engReadUI(); const x=ENG_EX.find(e=>e.id===id); const a=x.input?(document.getElementById('ans-'+id).value||''):'';
  const r=x.check(a); const ok=r===true;
  if(ok){ ENG.done[id]=true; engSave(); engRenderExercises(); document.getElementById('msg-'+id).textContent='✓ Correct — nice work!'; }
  else document.getElementById('msg-'+id).textContent='Not yet: '+r;
}

function initEngine(force){
  if (!document.getElementById('view-engine')) return;
  if (!ENG) engLoad();
  if (initEngine.done && !force) return; initEngine.done = true;
  const sel=document.getElementById('engSample');
  sel.innerHTML='<option value="">— pick a sample —</option>'+Object.keys(ENG_SAMPLES).map(k=>`<option>${esc(k)}</option>`).join('');
  document.getElementById('engInput').value = ENG.input.replace(/\r/g,'\n');
  document.getElementById('engFilter').value = ENG.filter;
  document.getElementById('engTables').value = ENG.tables;
  document.getElementById('engJs').value = ENG.js;
  engRenderEditors(); engRender();
}


// ---------- Guided mode: one pipeline step at a time ----------
window.ENG_MODE = 'guided';
const G_STEPS = [
  { k:'receive', n:'Receive', hint:'An inbound channel listens for messages (in real life on a TCP port using MLLP). Pick a sample or paste your own.' },
  { k:'parse', n:'Parse', hint:'The engine splits the text into segments (lines), fields (|) and components (^). Click any path to look it up.' },
  { k:'validate', n:'Validate', hint:'Checks required fields, date formats and code values. Errors decide the ACK later.' },
  { k:'filter', n:'Filter', hint:'Only let certain message types through. Leave blank to accept everything.' },
  { k:'transform', n:'Transform', hint:'Change the outbound copy: copy fields, set constants, or translate codes with a lookup table.' },
  { k:'route', n:'Route', hint:'Decide which destination systems get the transformed message.' },
  { k:'ack', n:'ACK', hint:'Reply to the sender: AA accepted, AE error (fix and resend), AR rejected.' }
];
let G = { i: 0, m: null, errs: [], res: null };
try { G.i = Math.min(G_STEPS.length-1, +(localStorage.getItem('iha_eng_step')||0)); } catch(e){}
function gSave(){ try{ localStorage.setItem('iha_eng_step', G.i); }catch(e){} }
function gHtml(){
  const s = G_STEPS[G.i];
  const pipe = G_STEPS.map((x,j)=>`<button class="g-node ${j===G.i?'cur':''} ${j<G.i?'done':''}" data-ev-click="gGo" data-args='[${j}]' aria-label="Step ${j+1}: ${x.n}">${j+1}. ${x.n}</button>`).join('<span class="g-arrow" aria-hidden="true">→</span>');
  let body = '', what = '';
  const m = hl7Parse(ENG.input);
  if (s.k==='receive'){
    body = `<label class="g-l" for="gSample">Choose a sample message</label><select id="gSample" data-ev-change="gPick" data-args='["$value"]'><option value="">— pick one —</option>${Object.keys(ENG_SAMPLES).map(k=>`<option>${esc(k)}</option>`).join('')}</select>
      <label class="g-l" for="gInput">…or edit the message text</label><textarea id="gInput" rows="7" spellcheck="false" data-ev-input="gSetInput" data-args='["$value"]'>${esc(ENG.input.replace(/\r/g,'\n'))}</textarea>`;
    what = m.ok ? `Received a <b>${esc(msgType(m))}</b> from <b>${esc(hl7Get(m,'MSH-3'))}</b> with ${m.segs.length} segments.` : esc(m.error);
  }
  if (s.k==='parse'){
    body = `<div class="row"><label class="g-l" for="engPath">Look up a path</label><input id="engPath" value="PID-5.1"> <button class="btn secondary sm" data-ev-click="engLookup">Look up</button> <code id="engPathOut"></code></div><div class="eng-tree" id="gTree">${engTree(m)}</div>`;
    what = m.ok ? `Split into ${m.segs.length} segments: ${m.segs.map(x=>x.id).join(', ')}. Paths like PID-5.1 mean segment PID, field 5, component 1.` : esc(m.error);
  }
  if (s.k==='validate'){
    const errs = hl7Validate(m);
    body = errs.length ? '<ul class="g-errs">'+errs.map(e=>`<li class="${e.sev==='E'?'err':'warn'}"><b>${e.sev==='E'?'Error':'Warning'} at ${esc(e.loc)}</b> — ${esc(e.msg)}</li>`).join('')+'</ul>' : '<p class="ok">✓ No problems found.</p>';
    const hard = errs.filter(e=>e.sev==='E').length;
    what = hard ? `${hard} error(s) found. The engine will not forward this message; the sender gets a negative ACK at step 7. Go back to step 1 to fix it.` : 'The message passed every check, so it continues down the pipeline.';
  }
  if (s.k==='filter'){
    const pass = passesFilter(m, ENG.filter);
    body = `<label class="g-l" for="gFilter">Allowed types (comma-separated, e.g. ADT^A01,ADT^A04 or ADT^*)</label><input id="gFilter" value="${esc(ENG.filter)}" data-ev-input="gSetFilter" data-args='["$value"]'>`;
    what = `This message is <b>${esc(msgType(m))}</b> → ${pass ? '<span class="ok">passes the filter</span>' : '<span class="err">would be filtered out (dropped, not an error)</span>'}.`;
  }
  if (s.k==='transform'){
    body = `<p class="muted">Each row: <b>target path</b> ← <b>source</b>. Source can be a path (PID-8), a 'constant', lookup(sex, PID-8) or NOW().</p><div id="gMaps">${(ENG.maps.length?ENG.maps:[{target:'',source:''}]).map((mp,i)=>`<div class="map-row"><input class="mt" aria-label="Target" placeholder="PID-8" value="${esc(mp.target)}" data-ev-change="gMapsRead"><span>←</span><input class="ms" aria-label="Source" placeholder="lookup(sex, PID-8)" value="${esc(mp.source)}" data-ev-change="gMapsRead"></div>`).join('')}</div><button class="btn secondary sm" data-ev-click="gAddRow">+ Add row</button>`;
    let prev=''; try { prev = hl7Serialize(applyMaps(m, ENG.maps, ENG.tables)).replace(/\r/g,'\n'); } catch(e){ prev = 'Mapping problem: '+e.message; }
    body += `<p class="g-l">Outbound preview</p><pre class="eng-pre">${esc(prev)}</pre>`;
    what = ENG.maps.filter(x=>x.target).length ? `${ENG.maps.filter(x=>x.target).length} mapping(s) applied to a copy — the inbound message is never changed.` : 'No mappings yet, so the outbound copy equals the inbound message. Try PID-8 ← lookup(sex, PID-8).';
  }
  if (s.k==='route'){
    let out=m; try{ out=applyMaps(m, ENG.maps, ENG.tables);}catch(e){}
    const d = routeMsg(out, ENG.routes);
    body = '<table class="exam-table"><tr><th>Destination</th><th>Message types</th><th>Condition</th><th>Match?</th></tr>'+ENG.routes.map(r=>`<tr><td>${esc(r.dest)}</td><td>${esc(r.types)}</td><td>${esc(r.cond||'—')}</td><td>${d.includes(r.dest)?'✓':'—'}</td></tr>`).join('')+'</table>';
    what = d.length ? `Would be delivered to: <b>${d.join(', ')}</b>.` : 'No route matches, so nothing would be delivered.';
  }
  if (s.k==='ack'){
    body = `<button class="btn primary" data-ev-click="gRun">▶ Run the whole pipeline</button><div id="gAck">${G.res?`<p>ACK code: <span class="badge b-${G.res.ackCode}">${G.res.ackCode}</span> · Status: <b>${esc(G.res.status)}</b>${G.res.dests.length?' → '+esc(G.res.dests.join(', ')):''}</p><pre class="eng-pre">${esc(G.res.ack.replace(/\r/g,'\n'))}</pre>`:''}</div>`;
    what = G.res ? ({AA:'Accepted: MSA-1 = AA and MSA-2 echoes the original MSH-10.',AE:'Application error: the sender should fix the content and resend.',AR:'Rejected: the header or structure was unusable, so nothing was processed.'})[G.res.ackCode] + ' The run was added to the message log.' : 'Click Run to process the message end-to-end and build the acknowledgment.';
  }
  return `<div class="g-pipe">${pipe}</div>
   <div class="g-card"><h3>Step ${G.i+1} of 7 — ${s.n}</h3><p class="g-hint">💡 ${s.hint}</p>${body}
   <div class="g-what"><b>What just happened:</b> ${what}</div>
   <div class="g-nav"><button class="btn secondary" data-ev-click="gGo" data-args='[${G.i-1}]' ${G.i===0?'disabled':''}>← Back</button>${G.i<6?`<button class="btn primary" data-ev-click="gGo" data-args='[${G.i+1}]'>Next: ${G_STEPS[G.i+1].n} →</button>`:`<span class="g-done">✓ Pipeline complete. Try the exercises below or switch to Advanced mode.</span>`}</div></div>`;
}
function gRender(){ const el=document.getElementById('engGuided'); if(!el) return; const f=document.activeElement&&document.activeElement.id; el.innerHTML=gHtml(); if(f&&document.getElementById(f)){const x=document.getElementById(f);x.focus(); if(x.setSelectionRange&&x.value) x.setSelectionRange(x.value.length,x.value.length);} }
function gSetInput(v){ ENG.input=v; engSave(); }
function gSetFilter(v){ ENG.filter=v; engSave(); gRender(); }
function gAddRow(){ ENG.maps.push({target:'',source:''}); engSave(); gRender(); }
function gGo(i){ if(i<0||i>6) return; G.i=i; gSave(); gRender(); }
function gPick(name){ if(!ENG_SAMPLES[name]) return; ENG.input=ENG_SAMPLES[name]; engSave(); gRender(); }
function gMapsRead(){ ENG.maps=[...document.querySelectorAll('#gMaps .map-row')].map(r=>({target:r.querySelector('.mt').value.trim(),source:r.querySelector('.ms').value.trim()})).filter(x=>x.target||x.source); engSave(); gRender(); }
async function gRun(){ G.res = await engProcess(); gRender(); }
function engSetMode(mode){
  window.ENG_MODE = mode; try{localStorage.setItem('iha_eng_mode',mode);}catch(e){}
  const g=document.getElementById('engGuided'), a=document.getElementById('engAdvanced');
  if (g) g.hidden = mode!=='guided'; if (a) a.hidden = mode==='guided';
  document.querySelectorAll('.eng-mode button').forEach(b=>b.classList.toggle('active', b.dataset.mode===mode));
  if (mode==='guided') gRender(); else { initEngine.done=false; initEngine(true); }
}
function initEngineGuided(){ if(!ENG) engLoad(); let m='guided'; try{ m=localStorage.getItem('iha_eng_mode')||'guided'; }catch(e){} engSetMode(m); engRenderExercises(); }
