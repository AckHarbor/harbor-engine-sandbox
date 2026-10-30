'use strict';
const HAS_ENV = typeof ENVS !== 'undefined';
const procNow = () => HAS_ENV ? ENVS[S.env].proc : 'P';

/* ---------- 1. Transformers ---------- */
TKINDS.splice(0, 1, ['map','Field mapping (copy a field or set a constant)']);
TKINDS.push(['default','Default value (only if empty)'], ['concat','Join fields'], ['split','Split a field']);
T_KEYS.push('sep', 'targets');
function heSplit(v, sep){ return sep === '' ? [v] : String(v).split(sep); }
const _applyTransformsX = applyTransforms;
applyTransforms = async function(work, list){
  const rest = [];
  for (const t of list || []){
    if (!['default','concat','split'].includes(t.kind)){ rest.push(t); continue; }
    if (rest.length){ await _applyTransformsX(work, rest.splice(0)); }
    const m = work.m;
    if (t.kind === 'default'){ if (!hl7Get(m, t.target)) hl7Set(m, t.target, resolveSource(t.source, m, S.tables)); }
    else if (t.kind === 'concat'){ const sep = t.sep === undefined ? ' ' : t.sep; const parts = String(t.fields||'').split(',').map(x => resolveSource(x.trim(), m, S.tables)).filter(x => x !== ''); hl7Set(m, t.target, parts.join(sep)); }
    else if (t.kind === 'split'){ const v = hl7Get(m, t.source) || ''; const parts = heSplit(v, t.sep === undefined ? ',' : t.sep).map(x => x.trim()); String(t.targets||'').split(',').map(x => x.trim()).filter(Boolean).forEach((p, i) => hl7Set(m, p, parts[i] || '')); }
  }
  if (rest.length) await _applyTransformsX(work, rest);
  return work; };
const _transHtmlX = transHtml;
transHtml = function(list, base){ const h = _transHtmlX(list, base); const ro = RO(); const parts = h.split('<div class="tr">');
  list.forEach((t, i) => { if (!['default','concat','split'].includes(t.kind)) return; const p = base+'.'+i+'.';
    const inp = (k, ph, w) => '<input class="'+(w||'')+'" aria-label="'+k+'" value="'+esc(t[k]===undefined?'':t[k])+'" placeholder="'+esc(ph)+'" onchange="edit(\''+p+k+'\',this.value'+(k==='sep'?'':'.trim()')+')"'+ro+'>';
    let f = '';
    if (t.kind === 'default') f = '<span class="sub">target</span> '+inp('target','PV1-3')+' <span class="sub">if empty ←</span> '+inp('source',"'CLINIC-N^^^PMC-NORTH' · PID-3[2] · NOW()",'wide')+'<div class="sub">Fills the field only when the sender left it empty. Write down why in the deploy note, and agree it with the receiving team.</div>';
    else if (t.kind === 'concat') f = '<span class="sub">target</span> '+inp('target','ZAN-1')+' <span class="sub">← join</span> '+inp('fields',"PID-5.2, PID-5.1",'wide')+' <span class="sub">with</span> '+inp('sep','space')+'<div class="sub">Empty parts are skipped. Leave "with" blank for a space.</div>';
    else f = '<span class="sub">split</span> '+inp('source','NTE-3')+' <span class="sub">at</span> '+inp('sep',',')+' <span class="sub">into</span> '+inp('targets','PID-5.1, PID-5.2','wide')+'<div class="sub">Part 1 goes to the first target, part 2 to the second, and so on. Missing parts become empty.</div>';
    if (parts[i+1]) parts[i+1] = parts[i+1].replace('<div class="trb"></div>', '<div class="trb">'+f+'</div>'); });
  return parts.join('<div class="tr">'); };
const _validateCfgX = validateCfg;
validateCfg = function(c, self){ const p = _validateCfgX(c, self); const blank = hl7Parse('MSH|^~\\&|A|B|C|D|20260101||ADT^A01|1|P|2.5.1');
  const isF = x => !!(parsePath(String(x||'').trim())||{}).f;
  const chk = (l, where) => l.forEach((t, i) => { const n = where+', transformer '+(i+1)+': ';
    if (t.kind === 'default'){ if (!isF(t.target)) p.push(n+'target "'+(t.target||'')+'" is not a field path like PV1-3.'); try { resolveSource(t.source, blank, S.tables); } catch(e){ p.push(n+e.message); } }
    if (t.kind === 'concat'){ if (!isF(t.target)) p.push(n+'target "'+(t.target||'')+'" is not a field path.'); if (!String(t.fields||'').trim()) p.push(n+'list the fields to join.'); else String(t.fields).split(',').forEach(x => { try { resolveSource(x.trim(), blank, S.tables); } catch(e){ p.push(n+e.message); } }); }
    if (t.kind === 'split'){ if (!isF(t.source)) p.push(n+'split "'+(t.source||'')+'" is not a field path.'); const tg = String(t.targets||'').split(',').map(x => x.trim()).filter(Boolean); if (!tg.length) p.push(n+'list at least one target.'); tg.forEach(x => { if (!isF(x)) p.push(n+'target "'+x+'" is not a field path.'); }); } });
  chk(c.transforms, 'Channel'); c.dests.forEach(d => chk(d.transforms, d.name)); return p; };

/* ---------- 2. Edit and resend ---------- */
const HE_WHO = () => (typeof window !== 'undefined' && window.HE_USER) ? String(window.HE_USER) : 'you (this browser)';
function editable(rec){ return rec && ['ERROR','QUEUED'].includes(rec.status); }
function editOutcome(nr){
  if (!nr) return { ok:false, label:'pending', reason:'Waiting for a result.' };
  const destFail = (nr.dests||[]).find(d => d.status === 'ERROR' || (d.ack && d.ack !== 'AA'));
  if (nr.ack === 'AA' && nr.status === 'SENT' && !destFail) return { ok:true, label:'ok', reason:'ACK AA · delivered.' };
  if (nr.status === 'FILTERED') return { ok:false, label:'fail', reason:'Filtered out (accepted by the engine but not delivered).' };
  if (nr.ack === 'AE' || nr.ack === 'AR') return { ok:false, label:'fail', reason:'Engine ACK '+nr.ack+(nr.err?': '+nr.err:'') };
  if (nr.status === 'ERROR' || nr.err) return { ok:false, label:'fail', reason:nr.err || 'Processing error.' };
  if (destFail){ const w = errWhy({ dests:[Object.assign({}, destFail, { status:'ERROR' })] })[0]; return { ok:false, label:'fail', reason:(destFail.name||'Destination')+' · '+w.code+' · '+w.text }; }
  if (nr.ack === 'AA' && nr.status === 'SENT') return { ok:true, label:'ok', reason:'ACK AA · delivered.' };
  return { ok:false, label:'fail', reason:'Status '+nr.status+(nr.status === 'ERROR' ? ' · '+errWhy(nr).map(w => w.code+' · '+w.text).join('; ') : nr.ack ? ' · engine receipt ACK '+nr.ack : '') };
}
function editFieldDiff(origRaw, newRaw){
  const A = (()=>{ try { return flatV2(origRaw); } catch(e){ return {}; } })();
  const B = (()=>{ try { return flatV2(newRaw); } catch(e){ return {}; } })();
  const keys = [...new Set(Object.keys(A).concat(Object.keys(B)))];
  return keys.filter(k => A[k] !== B[k]).map(k => ({ path:k, before:A[k], after:B[k] }));
}
function editDiffHtml(fields, mode, reason){
  if (!fields.length) return '<div class="sub">No field values differ from the original yet.</div>';
  const cls = mode === 'ok' ? 'ed-ok' : mode === 'fail' ? 'ed-fail' : 'ed-pend';
  const head = mode === 'ok' ? 'Delivered (ACK AA) — changed values shown in green.' : mode === 'fail' ? 'Resend failed — changed values shown in warning color. '+(reason?esc(reason):'') : 'Pending — edits are highlighted neutrally until the resend succeeds.';
  return '<div class="sub">'+head+'</div><table class="tree ed-diff"><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody>'+
    fields.map(f => '<tr><td class="mono nw">'+esc(f.path)+'</td><td class="mono">'+esc(f.before==null?'':f.before)+'</td><td class="mono"><span class="ed-val '+cls+'">'+esc(f.after==null?'':f.after)+'</span></td></tr>').join('')+'</tbody></table>';
}
async function editAndResend(recId, text, why, who){
  const rec = S.messages.find(x => x.id === recId); if (!rec) return { err:'Message not found.' };
  if (!editable(rec)) return { err:'Only errored or queued messages can be edited.' };
  const ch = chById(rec.ch); if (!ch || !ch.live || ch.state !== 'started') return { err:'Deploy and start the channel first.' };
  const raw = String(text||'').replace(/\r\n|\n/g, '\r').replace(/^\r+|\r+$/g, '');
  if (!/^MSH/.test(raw)) return { err:'The message must start with an MSH segment.' };
  if (raw === rec.raw) return { err:'Nothing changed. Edit the message first, or use Reprocess.' };
  why = String(why||'').trim(); if (why.length < 5) return { err:'Say why you are editing (for the audit log), e.g. "MRN confirmed by registration, INC0042140".' };
  const diff = lineDiff(showSeg(rec.raw), showSeg(raw)).filter(x => x[0] !== ' ').map(x => x[0]+' '+x[1]);
  const fields = editFieldDiff(rec.raw, raw);
  const done = rec.dests.filter(e => e.status === 'SENT').map(e => e.id); const off = ch.live.dests.filter(d => d.enabled && done.includes(d.id));
  off.forEach(d => d.enabled = false); let nr;
  try { nr = await processMsg(ch, raw, 'edit'); } finally { off.forEach(d => d.enabled = true); }
  const out = editOutcome(nr);
  const audit = { by: who || HE_WHO(), ts: ts(), why, of: rec.ctrl || ('the message received '+fmtT(rec.ts)), changes: diff, fields, outcome: out.label, ok: !!out.ok, reason: out.reason, skipped: off.map(d => d.name) };
  nr.editOf = rec.id; nr.audit = audit; rec.editedTo = nr.id; rec.status = 'EDITED'; rec.auditOut = audit;
  ch.queue = ch.queue.filter(q => q.msg !== rec.id);
  logc(ch, out.ok ? 'W' : 'E', 'Edited and resent '+(rec.ctrl||'message')+' by '+audit.by+' ('+diff.length+' line(s) changed): '+why+' → '+nr.status+(out.ok?'':' · '+out.reason)+'.');
  (S.audit = S.audit || []).push(Object.assign({ ch: ch.id, msg: rec.id, copy: nr.id, env: HAS_ENV ? S.env : '' }, audit)); if (S.audit.length > 200) S.audit.shift();
  save(); return { rec: nr, outcome: out }; }
function editDlg(recId){ const rec = S.messages.find(x => x.id === recId); if (!editable(rec)) return toast('Only errored or queued messages can be edited.');
  window._edOrig = rec.raw;
  $('dlgBody').innerHTML = '<h3>Edit and resend</h3><div class="al s-W">In production every edit is logged (who, when, what changed). Edits should be rare: fix the channel or ask the sender to fix the source when you can.</div><div class="sub realeng">In real engines, editing a message usually needs a special permission, and some sites forbid it for certain feeds.</div>'+
    '<label class="blk">Message (one segment per line)<textarea id="edTxt" rows="9" spellcheck="false" oninput="edPreview()">'+esc(showSeg(rec.raw))+'</textarea></label>'+
    '<details open><summary>Changed fields</summary><div id="edTree"></div></details>'+
    '<label class="blk">Why are you editing it? (saved in the audit log)<input id="edWhy" placeholder="e.g. MRN 10140077 confirmed by registration (INC0042140)"></label><div id="edErr" class="warn"></div><div id="edResult"></div>'+
    (rec.dests.some(e => e.status === 'SENT') ? '<div class="sub">Already accepted by: '+esc(rec.dests.filter(e => e.status === 'SENT').map(e => e.name).join(', '))+'. Those destinations are skipped.</div>' : '');
  $('dlgBtns').innerHTML = '<button class="btn" onclick="$(\'dlg\').close()">Cancel</button> <button class="btn pri" id="dlgOk">Resend edited message</button>';
  $('dlgOk').onclick = async () => {
    $('edErr').textContent = ''; $('edResult').innerHTML = '';
    $('dlgOk').disabled = true; edPreview('pending');
    const r = await editAndResend(recId, $('edTxt').value, $('edWhy').value);
    $('dlgOk').disabled = false;
    if (r.err){ $('edErr').textContent = r.err; edPreview('pending'); return; }
    const mode = r.outcome && r.outcome.ok ? 'ok' : 'fail';
    edPreview(mode, r.outcome && r.outcome.reason);
    $('edResult').innerHTML = '<div class="al '+(mode==='ok'?'s-ok':'s-E')+'">'+(mode==='ok'?'Resend succeeded. ':'Resend failed. ')+esc((r.outcome&&r.outcome.reason)||r.rec.status)+'</div>';
    if (mode === 'ok'){ $('dlg').close(); VIEW.msg = r.rec.id; toast('Edited copy delivered → '+r.rec.status); render(); }
    else { VIEW.msg = r.rec.id; toast('Edited copy not delivered → '+r.rec.status); }
  };
  edPreview('pending'); $('dlg').showModal(); $('edTxt').focus(); }
function edPreview(mode, reason){ const el = $('edTree'); if (!el) return;
  const raw = ($('edTxt')?$('edTxt').value:'').replace(/\r\n|\n/g, '\r');
  const fields = editFieldDiff(window._edOrig || '', raw);
  el.innerHTML = editDiffHtml(fields, mode || 'pending', reason || ''); }


/* ---------- 3. How to fix each error in the engine ---------- */
const FIXES = [
  [/Processing ID/, 'Wrong environment: the sender pointed this message at the wrong engine. Don\'t edit MSH-11 to force it in. Dismiss it and tell the sending team so they fix their connection.'],
  [/Rejected on receipt \(AR\): MSH-10/, 'The sender left out the control ID (MSH-10), so the engine can\'t ACK it properly. Use "Edit and resend" to add a unique control ID (for example the sender\'s prefix + "-R1"), note why, and ask the sender to fix their system.'],
  [/Rejected on receipt \(AR\): (?!MSH-10|Processing ID)/, 'The engine could not read this as HL7 (MSH missing or broken). If the content is clear, repair it with "Edit and resend". If not, Dismiss it and ask the sender to resend from their side.'],
  [/Inbound validation failed/, 'Inbound validation stops the message before any transformer. Either fix the fields with "Edit and resend" (one-off), or turn validation off for this feed and fix the fields with transformers, then Reprocess.'],
  [/Transformer error/, 'A transformer in the channel failed. Fix it (Transformers tab), deploy, then Reprocess.'],
  [/Assigned location required/, 'PV1-3 is empty. If the receiving team agrees, add a "Default value (only if empty)" transformer on that destination and record the reason in the deploy note. If this event type shouldn\'t go there at all, add a destination filter instead. Then Reprocess.'],
  [/Phone must use XTN/, 'Add a "Phone format (XTN components)" transformer on PID-13, deploy, then Reprocess.'],
  [/Date of birth "" /, 'The sender left PID-7 empty. Never invent a date of birth. Ask registration for the correct DOB, then use "Edit and resend" with the value they confirm and note who confirmed it.'],
  [/Date of birth/, 'The date isn\'t YYYYMMDD. Add a "Date format → YYYYMMDD" transformer on PID-7, deploy, then Reprocess.'],
  [/No MR identifier/, 'The sender left the MRN out of PID-3. Don\'t invent one, and don\'t copy the account number (an AN is not an MR). Ask registration for the MRN, then use "Edit and resend" with it.'],
  [/not in lab table/, 'The Lab system only accepts its own sex codes (see the Lab destination\'s Partner interface spec). Translate PID-8 on the Lab destination only, so the Bedboard copy keeps the HL7 codes, then deploy.'],
  [/Not a lab order|Not an imaging order/, 'This order went to the wrong system. Add a destination filter on OBR-24 (LAB or RAD) so each system only gets its own orders.'],
  [/Universal service ID required/, 'OBR-4 is empty. If the code is somewhere else in the message, copy it with a field mapping. Otherwise ask the ordering team and use "Edit and resend".'],

  [/Unknown procedure code/, 'Add the missing code to the code table (Code tables), then Reprocess. Reprocess, not Resend: the stored output still has the old code.'],
  [/has no coding system/, 'OBX-3.3 is empty. If the codes are LOINC, set OBX-3.3 to \'LN\' with a field mapping (or translate local codes with a code table first). Then Reprocess.'],
  [/not accepted by this system/, 'This system doesn\'t take this message type. Add a destination filter on MSH-9.1 so it only gets what its spec lists.'],



  [/Unknown visit/, 'The admission hasn\'t arrived yet (out of order). When the admission is accepted, Reprocess this message. Don\'t resend the admission after it.'],









  [/Connection refused/, 'The partner system is down. Leave it queued. When it\'s back, start the channel and use "Process queue". Don\'t also reprocess, or it arrives twice.']
];
function fixText(rec){ const txt = [rec.err||''].concat(rec.dests.filter(d => d.status !== 'SENT').map(d => d.resp||'')).join('\n'); const out = [];
  FIXES.forEach(([re, t]) => { if (re.test(txt) && !out.includes(t)) out.push(t); });
  return out.filter((t, i) => !(t.startsWith('The date isn') && out.some(x => x.startsWith('The sender left PID-7')))); }
const _msgDetailX = msgDetail;
msgDetail = function(){ let h = _msgDetailX(); const m = S.messages.find(x => x.id === VIEW.msg); if (!m) return h;
  if (editable(m)) h = h.replace('<button class="btn sm" onclick="doReprocess(', '<button class="btn pri sm" onclick="editDlg(\''+m.id+'\')" title="Open the message, correct it and send the edited copy through the channel">Edit and resend</button> <button class="btn sm" onclick="doReprocess(');
  const fx = editable(m) ? fixText(m) : [];
  let extra = fx.length ? '<div class="card fixp"><b>How to fix it in the engine</b><ul>'+fx.map(t => '<li>'+esc(t)+'</li>').join('')+'</ul></div>' : '';
  if (m.audit){ const om = m.audit.outcome || (m.audit.ok ? 'ok' : (m.audit.ok === false ? 'fail' : 'ok')); const chg = (m.audit.fields && m.audit.fields.length) ? editDiffHtml(m.audit.fields, om === 'ok' ? 'ok' : 'fail', m.audit.reason) : '<pre class="out diff">'+m.audit.changes.map(l => { const c = l[0]==='+' ? (om==='ok'?'a':(om==='fail'?'f':'n')) : (l[0]==='-'?'r':'n'); return '<span class="d'+c+'">'+esc(l)+'</span>'; }).join('\n')+'</pre>'; extra += '<div class="card sub"><b>Edited copy</b> of '+esc(m.audit.of)+' · by '+esc(m.audit.by)+' · '+fmtT(m.audit.ts)+' · <b>'+(om==='ok'?'delivered':'not delivered')+'</b><br>Why: '+esc(m.audit.why)+(m.audit.reason?'<br>'+esc(m.audit.reason):'')+(m.audit.skipped&&m.audit.skipped.length?'<br>Skipped (already accepted): '+esc(m.audit.skipped.join(', ')):'')+chg+'</div>'; }
  if (m.auditOut) extra += '<div class="card sub"><b>Edited and resent</b> by '+esc(m.auditOut.by)+' · '+fmtT(m.auditOut.ts)+'. The original is kept unchanged here. <a href="#" onclick="openMsg(\''+m.editedTo+'\');return false">Open the edited copy</a></div>';
  return h.replace('<div class="tabs sm">', extra+'<div class="tabs sm">'); };


/* "Remember this?" links from tickets back to the lesson that teaches the concept. [lesson id, track, what, how it applies] */
const TRECALL = {

};
const _vTicketsR = vTickets;
vTickets = function(){ let h = _vTicketsR(); const t = TICKETS.find(x => x.id === VIEW.ticket); if (!t) return h;
  const sb = typeof window !== 'undefined' && window.HE_SANDBOX;
  const rc = (TRECALL[t.id]||[]).map(([id, tr, what, how]) => '<aside class="recall"><b>Remember '+esc(what)+'?</b> '+esc(how)+(sb ? '' : ' <a href="/app/#'+tr+'/learn/'+id+'" target="_blank" rel="noopener">Review the lesson ↗</a>')+'</aside>').join('');
  const meta = '<div class="sub">Assigned to: Interface team (you) · Number '+esc((TICKET_FROM[t.id]||['',t.id])[1])+'</div>';
  return h.replace('</details>', '</details>'+rc).replace('<blockquote class="tfrom">', meta+'<blockquote class="tfrom">'); };
