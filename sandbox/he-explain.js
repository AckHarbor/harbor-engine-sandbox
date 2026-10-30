(function(){
const N = {
 MSH:{1:'Field separator',2:'Encoding characters',3:'Sending application',4:'Sending facility',5:'Receiving application',6:'Receiving facility',7:'Date/time of message',9:'Message type ^ trigger event ^ structure',10:'Message control ID (echoed in MSA-2)',11:'Processing ID (P production, T training, D debugging)',12:'Version ID',13:'Sequence number',15:'Accept acknowledgment type',16:'Application acknowledgment type',18:'Character set'},
 EVN:{1:'Event type code (backward-compatible copy of the trigger)',2:'Recorded date/time',4:'Event reason code',5:'Operator ID (who did it)',6:'Event occurred'},
 PID:{1:'Set ID',3:'Patient identifier list (CX): ID^^^authority^type, repeats with ~',5:'Patient name (XPN): family^given^middle',7:'Date/time of birth',8:'Administrative sex (table 0001)',10:'Race',11:'Patient address (XAD)',13:'Phone number - home (XTN)',14:'Phone number - business',15:'Primary language',16:'Marital status',18:'Patient account number',19:'SSN (backward-compatible only in v2.5.1)'},
 PD1:{3:'Patient primary facility',4:'Primary care provider (backward-compatible only in v2.5.1)'},
 NK1:{1:'Set ID',2:'Name of next of kin / associated party',3:'Relationship (table 0063)',5:'Phone number',7:'Contact role'},
 PV1:{1:'Set ID',2:'Patient class (table 0004: E emergency, I inpatient, O outpatient…)',3:'Assigned patient location: unit^room^bed^facility',4:'Admission type',6:'Prior patient location',7:'Attending doctor (XCN)',10:'Hospital service',14:'Admit source',19:'Visit number (CX, type VN)',44:'Admit date/time',45:'Discharge date/time'},
 AL1:{1:'Set ID',2:'Allergen type code (table 0127: DA drug, FA food, EA environmental…)',3:'Allergen code/mnemonic/description',4:'Allergy severity code (table 0128: SV severe, MO moderate, MI mild, U unknown)',5:'Allergy reaction',6:'Identification date'},
 DG1:{1:'Set ID',3:'Diagnosis code (CE): code^text^coding system, e.g. I10 = ICD-10 (table 0396)',5:'Diagnosis date/time',6:'Diagnosis type (table 0052: A admitting, W working, F final)',15:'Diagnosis priority'},
 IN1:{1:'Set ID',2:'Insurance plan ID',3:'Insurance company ID (CX)',4:'Insurance company name',8:'Group number',12:'Plan effective date',13:'Plan expiration date',15:'Plan type',16:'Name of insured',17:'Insured\'s relationship to patient (table 0063: SEL self, SPO spouse, CHD child…)',18:'Insured\'s date of birth',36:'Policy number'},
 RXE:{1:'Quantity/timing (TQ); component 6 = priority',2:'Give code: the drug (CE)',3:'Give amount - minimum',4:'Give amount - maximum',5:'Give units',6:'Give dosage form',10:'Dispense amount',11:'Dispense units'},
 RXR:{1:'Route (table 0162: PO oral, IV intravenous…)',2:'Administration site'},
 'TQ1':{1:'Set ID',7:'Start date/time',9:'Priority (table 0485: S stat, A ASAP, R routine)'},
 ORC:{1:'Order control (table 0119: NW new, CA cancel…)',2:'Placer order number (the orderer\'s number)',3:'Filler order number (the performer\'s number)',5:'Order status',7:'Quantity/timing; component 6 = priority (S stat, R routine)',9:'Date/time of transaction',12:'Ordering provider'},
 OBR:{1:'Set ID',2:'Placer order number',3:'Filler order number',4:'Universal service ID: what was ordered',7:'Observation date/time (collection)',16:'Ordering provider',22:'Results report/status change date/time',24:'Diagnostic service section (LAB, RAD…)',25:'Result status'},
 OBX:{1:'Set ID',2:'Value type (NM numeric, ST string, SN structured numeric…)',3:'Observation identifier: what was measured (code^text^system)',4:'Observation sub-ID',5:'Observation value',6:'Units',7:'Reference range',8:'Abnormal flags (table 0078: H high, L low, N normal…)',11:'Observation result status (table 0085: F final, P preliminary, C corrected)',14:'Date/time of the observation'},
 NTE:{1:'Set ID',2:'Source of comment',3:'Comment text',4:'Comment type'},
 MSA:{1:'Acknowledgment code: AA accept, AE error, AR reject',2:'Message control ID being acknowledged (= MSH-10 of the original)'},
 ERR:{2:'Error location: segment^sequence^field',3:'HL7 error code (table 0357)',4:'Severity',8:'User message'},
 MRG:{1:'Prior patient identifier list (the retired MRN)'},
 FT1:{1:'Set ID',4:'Transaction date',6:'Transaction type (CG charge…)',7:'Transaction code',10:'Quantity'},
 SCH:{1:'Placer appointment ID',2:'Filler appointment ID',6:'Event reason',7:'Appointment reason'}
};
const SEGN = {DG1:'Diagnosis',IN1:'Insurance',RXE:'Pharmacy/treatment encoded order',RXR:'Pharmacy/treatment route','TQ1':'Timing/quantity',MSH:'Message header (the envelope)',EVN:'Event type',PID:'Patient identification',PD1:'Additional demographics',NK1:'Next of kin / contact',PV1:'Patient visit',AL1:'Allergy',ORC:'Common order',OBR:'Observation request (the test as a whole)',OBX:'Observation (one result value)',NTE:'Note / comment',MSA:'Message acknowledgment',ERR:'Error',MRG:'Merge information',FT1:'Financial transaction',SCH:'Schedule activity'};
window.HE_FIELD_NAME = (seg, f) => (window.HL7G ? window.HL7G.fieldName(seg, f) : (N[seg]&&N[seg][f]) || '');
const SAMPLES = (window.HL7G && window.HL7G.SAMPLES) || {};
let EX = { name:Object.keys(SAMPLES)[0], raw:null, sel:null };
/* Spyglass (HL7 v2 viewer): the same layout and behaviour as Chart (FHIR viewer): sample picker, checks, element tree, tap for a note, paste your own. */
function exModeSw(){ return '<div class="exmode" role="tablist" aria-label="Viewer mode"><button role="tab" class="'+(EX.batch?'':'on')+'" aria-selected="'+!EX.batch+'" onclick="exMode(0)">One message</button><button role="tab" class="'+(EX.batch?'on':'')+'" aria-selected="'+!!EX.batch+'" onclick="exMode(1)">Batch file</button></div>'; }
window.exMode = b => { EX.batch = !!b; render(); };
function vExplain(){ if (EX.batch && window.HL7B) return '<div class="hd"><h1>AckHarbor Manifest™</h1><span class="sub">A batch analyzer for files of HL7® v2 messages: open or paste many messages, then filter, sort, count, compare, validate, edit and export.</span></div>'+offlineNote('hl7')+exModeSw()+'<div id="hl7bx"></div>';
  return vExplain1(); }
function vExplain1(){ const G = window.HL7G; const raw = EX.raw != null ? EX.raw : SAMPLES[EX.name]; const m = hl7Parse(raw);
  const rows = m.ok && G ? G.tree(raw) : []; const warns = m.ok && G ? G.check(raw) : [];
  const sel = EX.sel != null && rows[EX.sel] ? rows[EX.sel] : null; const info = sel && G ? G.note(sel) : null;
  const errs = warns.filter(w => w[0] === 'E').length;
  return '<div class="hd"><h1>AckHarbor Spyglass™</h1><span class="sub">A viewer that explains every segment and field of an HL7® v2 message: tap any segment, field or component to see what it is.</span></div>'+offlineNote('hl7')+(window.HL7B?exModeSw():'')+
   '<div class="card"><label class="sub" for="exSel">Sample</label> <select id="exSel" onchange="exPick(this.value)">'+Object.keys(SAMPLES).map(k=>'<option'+(k===EX.name&&EX.raw==null?' selected':'')+'>'+esc(k)+'</option>').join('')+(EX.raw!=null?'<option selected>Your pasted message</option>':'')+'</select>'+
   (!m.ok ? '<div class="al s-E"><b>Not an HL7 v2 message:</b> '+esc(m.error)+'</div>' : warns.map(w => '<div class="al s-'+w[0]+'"><b>'+esc(w[1])+'</b>: '+esc(w[2])+'</div>').join('') + (errs ? '' : '<div class="al s-ok">Structure looks right for '+esc(hl7Get(m,'MSH-9.1')+'^'+hl7Get(m,'MSH-9.2'))+'. These are basic checks; also confirm against the interface specification.</div>'))+
   '<div class="split fv"><div class="scroll"><table class="tbl tree fvt"><thead><tr><th>Element</th><th>Value</th></tr></thead><tbody>'+rows.map((r,i) => '<tr tabindex="0" class="'+(EX.sel===i?'sel ':'')+(r.leaf?'':'grp')+'" onclick="exSel('+i+')" onkeydown="if(event.key===\'Enter\')exSel('+i+')"><td style="padding-left:'+(8+r.depth*14)+'px"><span class="mono">'+esc(r.name)+'</span>'+(r.label?'<div class="sub fname">'+esc(r.label)+'</div>':'')+'</td><td class="mono">'+esc(r.value)+'</td></tr>').join('')+'</tbody></table></div>'+
   '<div class="fieldinfo" id="exInfo" aria-live="polite">'+(sel ? '<b class="mono">'+esc(sel.name)+'</b>'+'<br>Value: <code>'+esc(sel.value)+'</code>'+(info ? '<p><b>'+esc(info.title)+'</b><br>'+esc(info.what)+'</p>'+(info.values?'<p class="sub"><b>Common values:</b> '+esc(info.values)+'</p>':'')+(info.mistakes?'<p class="sub"><b>Common mistakes:</b> '+esc(info.mistakes)+'</p>':'')+(info.spec?'<p class="sub">Spec: <a href="'+esc(info.spec.href)+'" target="_blank" rel="noopener">'+esc(info.spec.label)+'</a></p>':'') : '') : '<span class="sub">Tap an element to see what it is.</span>')+'</div></div>'+
   '<details'+(EX.raw!=null?' open':'')+'><summary>Paste your own message</summary>'+(heOffline()?'':'<p class="sub">Don’t paste PHI.</p>')+'<textarea id="exIn" rows="8" spellcheck="false" aria-label="HL7 message to view">'+esc(String(raw).replace(/\r/g,'\n'))+'</textarea><button class="btn sm" onclick="exPaste()">View this message</button></details></div>'; }
window.exPick = k => { EX = { name:k, raw:null, sel:null }; render(); };
/* the batch workbench owns its own DOM: (re)attach it after every engine render that rebuilt the host */
const _rendX = render; render = function(soft){ _rendX(soft); const el = document.getElementById('hl7bx'); if (el && !el.firstChild && window.HL7B) HL7B.mount(el, { workerUrl: '/tools/hl7-batch-worker.js' }); };
window.exSel = i => { EX.sel = i; render(); };
window.exPaste = () => { const go = () => { EX.raw = $('exIn').value.replace(/\r?\n/g,'\r').trim(); EX.sel = null; render(); }; if (typeof phiConfirm==='function' && typeof phiOk==='function' && !phiOk()) return phiConfirm(go); go(); };
// nav + routing
/* Spyglass and Chart are top-level choices in the header (like the TEST/PROD switch), not sidebar items. */
const _navX = nav; nav = function(){ _navX(); let sw = $('toolSw'); const hdr = document.querySelector('.ehdr'); if (!hdr) return;
  if (!sw){ sw = document.createElement('div'); sw.id = 'toolSw'; sw.className = 'toolsw'; sw.setAttribute('role','group'); sw.setAttribute('aria-label','Tool');
    const logo = hdr.querySelector('.logo'); hdr.insertBefore(sw, logo ? logo.nextSibling : hdr.firstChild); }
  const cur = VIEW.tab === 'explain' ? 'explain' : VIEW.tab === 'fhirview' ? 'fhirview' : 'engine';
  const h = [['engine','Engine','dash',''],['explain','Spyglass','explain','HL7 v2 viewer'],['fhirview','Chart','fhirview','FHIR viewer']].map(([k,l,t,d]) => '<button class="'+(cur===k?'on':'')+'" aria-pressed="'+(cur===k)+'"'+(d?' title="AckHarbor '+l+': '+d+'"':'')+' onclick="go(\''+(k==='engine'&&VIEW.lastTab?VIEW.lastTab:t)+'\')">'+l+(d?'<small>'+d+'</small>':'')+'</button>').join('');
  if (sw.innerHTML !== h) sw.innerHTML = h; if (cur === 'engine') VIEW.lastTab = VIEW.tab; document.body.classList.toggle('viewer-on', cur !== 'engine'); };
const _vDashX = vDash; vDash = function(){ return VIEW.tab === 'explain' ? vExplain() : VIEW.tab === 'fhirview' ? vFhirView() : (SBX() && VIEW.tab === 'dash' ? offlineCard() : '') + _vDashX(); };
function SBX(){ return typeof window !== 'undefined' && !!window.HE_SANDBOX; }
/* Sandbox: the offline viewers are where people may paste their own (possibly real) messages. */
function offlineCard(){ return '<div class="card offcard" role="region" aria-label="Paste your own messages"><div class="offh"><b>Paste test messages</b> <span class="offtag">Runs fully offline</span></div>'+
  '<p class="sub">These two viewers run only on this computer. Nothing is uploaded or sent anywhere. No real patient data: do not load PHI.</p>'+
  '<div class="offbtns"><a class="btn pri" href="viewers/hl7-viewer.html" target="_blank" rel="noopener">Spyglass™ <span class="sub2">Viewer for HL7 v2 messages</span></a> <a class="btn pri" href="viewers/fhir-viewer.html" target="_blank" rel="noopener">Chart™ <span class="sub2">JSON viewer for FHIR R4</span></a></div></div>'; }
function offlineNote(k){ return SBX() ? '<div class="card offnote"><b>Your own messages?</b> Open the offline <a href="viewers/'+(k==='hl7'?'hl7':'fhir')+'-viewer.html" target="_blank" rel="noopener">'+(k==='hl7'?'Spyglass (HL7 v2 viewer)':'Chart (FHIR JSON viewer)')+'</a>. It runs fully offline, and your data stays on this computer.</div>' : ''; }
/* Chart (FHIR JSON viewer): paste FHIR R4 JSON, browse every element, tap one for a plain-English note (same Insights as the public Chart page). */
const FSAMPLES = (window.FHIRG && window.FHIRG.SAMPLES) || { 'Patient': { resourceType:'Patient', name:[{ family:'Chen', given:['Maya'] }], gender:'female' } };
let FV = { name:'Patient', raw:null, sel:null };
function vFhirView(){ const G = window.FHIRG; const raw = FV.raw != null ? FV.raw : JSON.stringify(FSAMPLES[FV.name], null, 2); let j = null, perr = '';
  try { j = JSON.parse(raw); } catch(e){ perr = e.message; }
  const rows = j && G ? G.tree(j) : []; const warns = j && G ? G.check(j) : [];
  const sel = FV.sel != null && rows[FV.sel] ? rows[FV.sel] : null; const info = sel && G ? G.note(sel) : null;
  const errs = warns.filter(w => w[0] === 'E').length;
  return '<div class="hd"><h1>AckHarbor Chart™</h1><span class="sub">A JSON viewer that explains FHIR® R4 resources: paste any resource or Bundle and tap any element to see what it is.</span></div>'+offlineNote('fhir')+
   '<div class="card"><label class="sub" for="fvSel">Sample</label> <select id="fvSel" onchange="fvPick(this.value)">'+Object.keys(FSAMPLES).map(k=>'<option'+(k===FV.name&&FV.raw==null?' selected':'')+'>'+esc(k)+'</option>').join('')+(FV.raw!=null?'<option selected>Your pasted JSON</option>':'')+'</select>'+
   (perr ? '<div class="al s-E"><b>Not valid JSON:</b> '+esc(perr)+'</div>' : warns.map(w => '<div class="al s-'+w[0]+'"><b>'+esc(w[1])+'</b>: '+esc(w[2])+'</div>').join('') + (errs ? '' : '<div class="al s-ok">Structure looks right'+(j && j.resourceType ? ' for '+esc(j.resourceType) : '')+'. These are basic checks; a server also checks its profiles.</div>'))+
   '<div class="split fv"><div class="scroll"><table class="tbl tree fvt"><thead><tr><th>Element</th><th>Value</th></tr></thead><tbody>'+rows.map((r,i) => '<tr tabindex="0" class="'+(FV.sel===i?'sel ':'')+(r.leaf?'':'grp')+'" onclick="fvSel('+i+')" onkeydown="if(event.key===\'Enter\')fvSel('+i+')"><td style="padding-left:'+(8+r.depth*14)+'px"><span class="mono">'+esc(r.name)+'</span>'+(r.label?'<div class="sub fname">'+esc(r.label)+'</div>':'')+'</td><td class="mono">'+esc(r.value)+'</td></tr>').join('')+'</tbody></table></div>'+
   '<div class="fieldinfo" aria-live="polite">'+(sel ? '<b class="mono">'+esc(sel.path)+'</b>'+(sel.leaf?'<br>Value: <code>'+esc(sel.value)+'</code>':'')+(info ? '<p><b>'+esc(info.title)+'</b><br>'+esc(info.what)+'</p>'+(info.values?'<p class="sub"><b>Common values:</b> '+esc(info.values)+'</p>':'')+(info.mistakes?'<p class="sub"><b>Common mistakes:</b> '+esc(info.mistakes)+'</p>':'')+(info.spec?'<p class="sub">Spec: <a href="'+esc(info.spec.href)+'" target="_blank" rel="noopener">'+esc(info.spec.label)+'</a></p>':'') : '') : '<span class="sub">Tap an element to see what it is.</span>')+'</div></div>'+
   '<details'+(FV.raw!=null?' open':'')+'><summary>Paste your own JSON</summary>'+(heOffline()?'':'<p class="sub">Don’t paste PHI.</p>')+'<textarea id="fvIn" rows="8" spellcheck="false" aria-label="FHIR JSON to view">'+esc(raw)+'</textarea><button class="btn sm" onclick="fvPaste()">View this JSON</button></details></div>'; }
window.fvPick = k => { FV = { name:k, raw:null, sel:null }; render(); };
window.fvSel = i => { FV.sel = i; render(); };
window.fvPaste = () => { const go = () => { FV.raw = $('fvIn').value.trim(); FV.sel = null; render(); }; if (typeof phiConfirm==='function' && typeof phiOk==='function' && !phiOk()) return phiConfirm(go); go(); };
// field names in the Parsed tab of every message
const _tree = treeHtml; treeHtml = function(raw){ return _tree(raw).replace(/<td class="mono nw">([A-Z][A-Z0-9]{2})-(\d+)<\/td>/g, (x,s,f) => { const n = HE_FIELD_NAME(s,+f); return '<td class="mono nw" title="'+esc(n)+'">'+s+'-'+f+(n?'<div class="sub fname">'+esc(n.split(/[(:]/)[0].trim())+'</div>':'')+'</td>'; }); };
// boot() in he.js reads #explain from the URL hash.
window.HE_EXPLAIN_SAMPLES = SAMPLES;
})();
