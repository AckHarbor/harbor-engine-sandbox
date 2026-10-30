const G = window.FHIRG;
$('samp').innerHTML = Object.keys(G.SAMPLES).map(k => '<option>'+esc(k)+'</option>').join('');
const FIX = { E:'Fix this before sending it to a server. Open Insights for the element for the rules.', W:'Worth a look; a server may still accept it.' };
function run(){
  let j; const raw = $('in').value;
  try { j = JSON.parse(raw); }
  catch(e){ $('alerts').innerHTML = '<div class="al E"><b>E · JSON</b>'+esc(e.message)+'</div>'; $('tree').innerHTML = '<p class="empty">Fix JSON syntax to see the tree.</p>';
    renderInsight($('insight'), { title:'Not valid JSON', what:'The text could not be read as JSON. Check commas, quotes and brackets.' }, { level:'E', body:'FHIR JSON is one object with "resourceType", for example {"resourceType":"Patient", …}.' }); return; }
  const warns = G.check(j); const errs = warns.filter(w => w[0] === 'E').length;
  $('alerts').innerHTML = warns.map((w,i) => '<div class="al '+w[0]+'" data-i="'+i+'"><b>'+esc(w[0])+' · '+esc(w[1])+'</b>'+esc(w[2])+'</div>').join('') +
    (errs ? '' : '<div class="al ok"><b>Structure looks right'+(j.resourceType ? ' for '+esc(j.resourceType) : '')+'</b>These are basic checks. A server also checks its profiles and terminology.</div>');
  const rows = G.tree(j);
  $('tree').innerHTML = '<table><thead><tr><th>Element</th><th>Value</th></tr></thead><tbody>'+rows.map((r,i) => '<tr data-i="'+i+'"'+(r.leaf?'':' class="grp"')+'><td style="padding-left:'+(10+r.depth*14)+'px"><span class="path mono">'+esc(r.name)+'</span>'+(r.label?'<div class="lbl">'+esc(r.label)+'</div>':'')+'</td><td class="mono">'+esc(r.value)+'</td></tr>').join('')+'</tbody></table>';
  $('tree').querySelectorAll('tr[data-i]').forEach(tr => { tr.onclick = () => { $('tree').querySelectorAll('tr').forEach(x => x.classList.remove('on')); tr.classList.add('on'); const r = rows[+tr.dataset.i]; renderInsight($('insight'), G.note(r)); }; });
  $('alerts').querySelectorAll('.al[data-i]').forEach(el => { el.onclick = () => { const w = warns[+el.dataset.i]; const r = rows.find(x => x.path === w[1]) || { key:w[1], path:w[1], name:w[1], label:'', depth:1, rt:j.resourceType, type:'', leaf:true, value:'' }; renderInsight($('insight'), G.note(r), { level:w[0], body: w[2]+' '+FIX[w[0]] }); }; });
  renderInsight($('insight'), G.note(rows[0]));
}
$('go').onclick = run;
$('samp').onchange = () => { $('in').value = JSON.stringify(G.SAMPLES[$('samp').value], null, 2); run(); };
$('in').value = JSON.stringify(G.SAMPLES.Patient, null, 2);
run();
