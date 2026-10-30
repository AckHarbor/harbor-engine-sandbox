const HG = window.HL7G;
$('samp').innerHTML = Object.keys(HG.SAMPLES).map(k => '<option>'+esc(k)+'</option>').join('');
const FIX = {
  'MSH-10': {level:'E', title:'How to fix', body:'Assign a unique control ID. Empty MSH-10 often yields ACK AR. Ask the sender to fix their generator; one-off: Edit & resend in Harbor Engine.'},
  'MSH-11': {level:'E', title:'How to fix', body:'Use P, T, or D. If PROD traffic hit TEST, fix the connection; do not rewrite MSH-11 to force it through.'},
  'PID-3': {level:'E', title:'How to fix', body:'Do not invent an MRN. Confirm with registration, then resend. Put the identifier type (MR, AN…) in PID-3.5.'},
  'PID-7': {level:'E', title:'How to fix', body:'Convert to YYYYMMDD. Never invent a date of birth. Slash or ISO-dashed dates are common sender mistakes.'},
  'PID-8': {level:'E', title:'How to fix', body:'Map to table 0001 (M/F/O/U/A/N) with a code-table lookup and a * default.'},
  'PID-13': {level:'W', title:'How to fix', body:'Prefer XTN components (^PRN^PH^^^area^local) over a single free-text phone number.'},
  'PV1': {level:'E', title:'How to fix', body:'Most ADT events need PV1. Add the visit segment or filter this trigger away from systems that require it.'},
  'OBX': {level:'W', title:'How to fix', body:'Make OBX-2 match OBX-5, and put a coding system in OBX-3.3 (e.g. LN).'}
};
function pickFix(loc, lvl){ const k = String(loc||'').replace(/\[\d+\]/g,''); const f = FIX[k] || FIX[k.split('.')[0]] || FIX[k.split(/[-.]/)[0]];
  return f || { level:lvl, title:'How to fix', body:'Open the Insights card and the segment reference. Prefer fixing the sender or a transformer over inventing clinical data.' }; }
function run(){
  const raw = $('in').value; const m = hl7Parse(raw);
  if (!m.ok){ $('alerts').innerHTML = '<div class="al E"><b>E · MSH</b>'+esc(m.error)+'</div>'; $('tree').innerHTML = '<p class="empty">Fix the message header to see the tree.</p>';
    renderInsight($('insight'), { title:'Not an HL7 v2 message', what:'An HL7 v2 message starts with MSH, then the field separator and encoding characters, for example MSH|^~\\&|…' }, { level:'E', body:m.error }); return; }
  const warns = HG.check(raw); const errs = warns.filter(w => w[0] === 'E').length;
  $('alerts').innerHTML = warns.map((w,i) => '<div class="al '+w[0]+'" data-i="'+i+'"><b>'+esc(w[0])+' · '+esc(w[1])+'</b>'+esc(w[2])+'</div>').join('') +
    (errs ? '' : '<div class="al ok"><b>Structure looks right for '+esc(hl7Get(m,'MSH-9.1')+'^'+hl7Get(m,'MSH-9.2'))+'</b>These are basic checks. Also confirm against your interface specification.</div>');
  const rows = HG.tree(raw);
  $('tree').innerHTML = '<table><thead><tr><th>Element</th><th>Value</th></tr></thead><tbody>'+rows.map((r,i) => '<tr data-i="'+i+'"'+(r.leaf?'':' class="grp"')+'><td style="padding-left:'+(10+r.depth*14)+'px"><span class="path mono">'+esc(r.name)+'</span>'+(r.label?'<div class="lbl">'+esc(r.label)+'</div>':'')+'</td><td class="mono">'+esc(r.value)+'</td></tr>').join('')+'</tbody></table>';
  $('tree').querySelectorAll('tr[data-i]').forEach(tr => { tr.onclick = () => { $('tree').querySelectorAll('tr').forEach(x => x.classList.remove('on')); tr.classList.add('on'); renderInsight($('insight'), HG.note(rows[+tr.dataset.i])); }; });
  $('alerts').querySelectorAll('.al[data-i]').forEach(el => { el.onclick = () => { const w = warns[+el.dataset.i]; const k = String(w[1]).replace(/\[\d+\]/g,''); const r = rows.find(x => x.path === w[1] || x.key === k) || rows.find(x => x.seg === k.split(/[-.]/)[0]) || rows[0]; renderInsight($('insight'), HG.note(r), Object.assign({}, pickFix(w[1], w[0]), { body: w[2]+' '+pickFix(w[1], w[0]).body })); }; });
  renderInsight($('insight'), HG.note(rows[0]));
}
$('go').onclick = run;
$('samp').onchange = () => { $('in').value = HG.SAMPLES[$('samp').value].replace(/\r/g,'\n'); run(); };
$('in').value = HG.SAMPLES[Object.keys(HG.SAMPLES)[0]].replace(/\r/g,'\n');
run();
function mode(b){ $('mOne').classList.toggle('on', !b); $('mBatch').classList.toggle('on', b); $('mOne').setAttribute('aria-selected', !b); $('mBatch').setAttribute('aria-selected', b);
  $('vhN').textContent = b ? 'AckHarbor Manifest™' : 'AckHarbor Spyglass™'; $('vhD').textContent = b ? 'A free batch analyzer for files of HL7® v2 messages' : 'A free viewer that explains every segment and field of an HL7® v2 message';
  $('one').hidden = b; $('batch').hidden = !b; document.querySelector('.wrap').classList.toggle('batchmode', b); $('insight').hidden = b;
  if (b && !$('batch').firstChild) HL7B.mount($('batch'), { workerUrl: 'hl7-batch-worker.js' }); }
$('mOne').onclick = () => mode(false); $('mBatch').onclick = () => mode(true);
if (/[#&]batch\b/.test(location.hash)) mode(true);
