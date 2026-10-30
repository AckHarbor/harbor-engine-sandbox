/* Beginner hints: small (i) bubbles and glossary popovers. Tap on phones, hover or click on desktop. Original wording. */
(function(){
const G = {
  'MLLP':'Minimal Lower Layer Protocol: the simple wrapper used to send HL7 v2 messages over a network (TCP) connection. A start byte goes before each message and two end bytes after it.',
  'ACK':'Acknowledgment: the reply a system sends to say it got a message. MSA-1 says how it went: AA = accepted, AE = error, AR = rejected.',
  'NAK':'An informal name for a negative acknowledgment: an ACK whose MSA-1 is AE or AR.',
  'MRN':'Medical record number: the ID a hospital gives a patient. In HL7 v2 it usually sits in PID-3 with identifier type MR.',
  'segment':'One line of an HL7 v2 message. It starts with a three-letter ID such as MSH, PID or OBX.',
  'component':'A part of a field, separated by ^. In PID-5 (patient name), component 1 is the family name and component 2 the given name.',
  'Z-segment':'A segment a site defines for its own data. Its ID starts with Z (for example ZPI). Both sides must agree on it in the interface spec.',
  'LOINC':'A standard code system for lab tests and clinical observations, for example 2345-7 = glucose in serum or plasma. In HL7 v2 its coding-system ID is LN.',
  'UCUM':'Unified Code for Units of Measure: a standard, case-sensitive way to write units, for example mg/dL.',
  'SNOMED CT':'A large clinical terminology for diagnoses, findings, procedures and more.',
  'ADT':'Admit, discharge, transfer: messages about patients and visits, for example A01 admit, A03 discharge, A04 register, A08 update.',
  'ORM':'An order message (ORM^O01): a new or changed order, such as a lab test.',
  'ORU':'An observation result message (ORU^R01): results, such as lab values, carried in OBX segments.',
  'trigger event':'The real-world event that caused a message, for example A04 = a patient was registered. It is in MSH-9.2.',
  'interface engine':'Software that receives messages from one system, changes them if needed, and sends them on to other systems.',
  'channel':'One flow in an interface engine: where messages come in, how they are filtered and changed, and where they go.',
  'MSH':'Message header: always the first segment. It says who sent the message, when, and what type it is.',
  'PID':'Patient identification segment: IDs, name, date of birth, sex, address and phone.',
  'PV1':'Patient visit segment: visit class, location, doctors and the visit number.',
  'OBR':'Observation request segment: the order or test that results belong to.',
  'OBX':'Observation segment: one result value with its code, units and flags.',
  'control ID':'MSH-10: a unique ID for each message. The receiver echoes it in the ACK (MSA-2) so the sender can match the reply.',



  'endpoint':'The address (URL, or host and port) that a system sends messages or requests to.',
  'profile':'Extra rules on top of a standard message or resource, for example which elements are required.',

  'REST':'A style of web API: you read and write resources with HTTP methods such as GET, POST and PUT.',

};
let pop = null, pinned = false, owner = null;
function ensure(){ if (pop) return pop; pop = document.createElement('div'); pop.id = 'tipPop'; pop.setAttribute('role','tooltip'); pop.hidden = true; document.body.appendChild(pop); return pop; }
function show(el, text, pin){ const p = ensure(); p.textContent = text; p.hidden = false; owner = el; pinned = !!pin;
  const r = el.getBoundingClientRect(), w = Math.min(280, window.innerWidth - 16); p.style.maxWidth = w + 'px';
  const pw = p.offsetWidth, ph = p.offsetHeight; let x = r.left + r.width/2 - pw/2; x = Math.max(8, Math.min(x, window.innerWidth - pw - 8));
  let y = r.bottom + 6; if (y + ph > window.innerHeight - 8) y = Math.max(8, r.top - ph - 6); p.style.left = x + 'px'; p.style.top = y + 'px'; el.setAttribute('aria-expanded','true'); }
function hide(){ if (pop) pop.hidden = true; if (owner) owner.setAttribute('aria-expanded','false'); owner = null; pinned = false; }
const textOf = el => el.getAttribute('data-tip') || G[el.getAttribute('data-g')] || '';
document.addEventListener('click', e => { const el = e.target.closest && e.target.closest('[data-tip],[data-g]');
  if (el){ e.preventDefault(); e.stopPropagation(); if (owner === el && pinned) hide(); else show(el, textOf(el), true); return; }
  if (pop && !pop.hidden && !e.target.closest('#tipPop')) hide(); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
window.addEventListener('scroll', () => { if (!pinned) hide(); }, true);
const canHover = () => window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.addEventListener('mouseover', e => { if (!canHover() || pinned) return; const el = e.target.closest && e.target.closest('[data-tip],[data-g]'); if (el && el !== owner) show(el, textOf(el), false); });
document.addEventListener('mouseout', e => { if (!canHover() || pinned) return; const el = e.target.closest && e.target.closest('[data-tip],[data-g]'); if (el && (!e.relatedTarget || !el.contains(e.relatedTarget))) hide(); });
function bubble(text, label){ const b = document.createElement('button'); b.type = 'button'; b.className = 'tipi'; b.setAttribute('data-tip', text); b.setAttribute('aria-label', 'What is ' + (label||'this') + '?'); b.setAttribute('aria-expanded','false'); b.textContent = 'i'; return b; }
/* Wrap the first use of each glossary term in a lesson (skips code, examples, buttons and links). */
function glossify(root){ if (!root) return 0; const used = new Set(); let n = 0;
  const keys = Object.keys(G).sort((a,b) => b.length - a.length);
  const re = new RegExp('(^|[^A-Za-z0-9-])(' + keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')(?![A-Za-z0-9])', 'g');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: t => t.parentElement.closest('code,pre,.ex2,button,a,.gl,.opt,h2,.kicker,textarea,input,select,label,.practice') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const t of nodes){ const s = t.nodeValue; let m, last = 0, frag = null; re.lastIndex = 0;
    while ((m = re.exec(s))){ const term = m[2]; const key = keys.find(k => k === term); if (!key || used.has(key)) continue; used.add(key);
      frag = frag || document.createDocumentFragment(); const at = m.index + m[1].length; frag.appendChild(document.createTextNode(s.slice(last, at)));
      const b = document.createElement('button'); b.type = 'button'; b.className = 'gl'; b.setAttribute('data-g', key); b.setAttribute('aria-label', term + ': show meaning'); b.setAttribute('aria-expanded','false'); b.textContent = term; frag.appendChild(b); last = at + term.length; n++; }
    if (frag){ frag.appendChild(document.createTextNode(s.slice(last))); t.replaceWith(frag); } }
  return n; }
/* Add (i) bubbles next to matching controls. rules: [selector, exact text, tip] */
function addBubbles(root, rules){ if (!root) return; rules.forEach(([sel, txt, tip]) => root.querySelectorAll(sel).forEach(el => {
  const own = Array.from(el.childNodes).filter(n => !(n.classList && n.classList.contains('tipi'))).map(n => n.textContent).join('').replace(/\s+/g,' ').trim();
  if (txt instanceof RegExp ? !txt.test(own) : own !== txt) return;
  if (el.tagName === 'A' || el.tagName === 'H1'){ if (!el.querySelector('.tipi')) el.appendChild(bubble(tip, own)); }
  else if (!(el.nextElementSibling && el.nextElementSibling.classList.contains('tipi'))) el.after(bubble(tip, own)); })); }
window.IHA_TIPS = { G, glossify, addBubbles, show, hide };
})();
