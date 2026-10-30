const HE_TIP_RULES = [
  ['#view .tabs a', /^Compare$/, 'Puts the original next to the transformed message, field by field. Green = added, amber = changed, red = removed. Each change names the transformer step that made it.'],
  ['#view .seg', /Text\s*Parsed/, 'Text shows the message as it travels. Parsed splits it into segments and fields with their names, so you can find a value without counting pipes.'],
  ['#view .tabs a', /^Source$/, 'How messages arrive (the inbound connector): an MLLP listener on a port, a file drop, or an HTTP endpoint.'],
  ['#view .tabs a', /^Filter$/, 'A filter decides which messages go on. Messages that fail it are still acknowledged, but not delivered (status FILTERED).'],
  ['#view .tabs a', /^Transformers$/, 'Transformers change the message on its way through: copy a field, set a value, translate a code, fix a date.'],
  ['#view .tabs a', /^Destinations/, 'Where the channel sends messages (outbound connectors). Each destination can have its own filter, which is how routing works, and its own transformers.'],
  ['#view .tabs a', /^History$/, 'Every deploy saves a version, so you can compare versions and roll back.'],
  ['#view .tabs a', /^ACK sent$/, 'The reply the engine sent back to the sender. MSA-1: AA = accepted, AE = error, AR = rejected. MSA-2 repeats the sender\'s MSH-10.'],
  ['#view h1', /^Error queue$/, 'Messages that were rejected, NAKed by a partner, or broke in a transformer. Work through them like a to-do list.'],
  ['#view h1', /^Code tables$/, 'Lists that translate one system\'s codes into another\'s, for example F → 2 for the lab.'],
  ['#view h1', /^Sending systems$/, 'Simulated Penford systems that send messages to your channels.'],
  ['#view h1', /^Alerts$/, 'Warnings the engine raises when something needs attention, such as a partner system that is down.'],
  ['#view h1', /^Tickets$/, 'Requests from Penford staff, like a help-desk queue. Each has a number, priority, requester and status.'],
  ['#view button', /^Deploy$/, 'Makes your draft the live version and starts the channel. Each deploy is saved as a new version.'],
  ['#view button', /^Process queue$/, 'Delivers messages that were waiting for a partner system that was down, in their original order.'],
  ['#view button', /^Edit and resend$/, 'Correct a copy of this message and send it through the channel again. The original is kept, and the edit is logged with who, when and why.'],
  ['#view button', /^Reprocess$/, 'Runs the original message through the current channel again. Use it after you fix the channel.'],
  ['#view button', /^Resend$/, 'Sends the stored output again to destinations that did not accept it. Use it after the partner has fixed their side.'],
  ['#view button', /^Resolve & close$/, 'Runs the ticket\'s acceptance check. If it passes, the ticket closes with your note. If not, it tells you what is still wrong.']
];
(function(){ if (!window.IHA_TIPS) return;

  const _renderT = render;
  render = function(){ const out = _renderT.apply(this, arguments);
    try { IHA_TIPS.addBubbles(document, HE_TIP_RULES);
       } catch(e){}
    return out; };
  if (typeof helpOpen === 'function'){ const _ho = helpOpen; helpOpen = function(){ const r = _ho.apply(this, arguments); const d = document.getElementById('helpDrawer');
    if (d && !d.querySelector('#tipsAgain')){ const p = document.createElement('div'); p.className = 'card sub'; p.innerHTML = '<button class="btn sm" id="tipsAgain" type="button">Show tips again</button> Replays the short tour. Tap any small <b>i</b> for a quick explanation.';
      const hh = d.querySelector('.hhead'); if (hh) hh.after(p); else d.prepend(p); p.querySelector('button').onclick = () => { if (typeof helpClose === 'function') helpClose(); S.tour = false; save(); tour(0); };  if (window.IHA_FEEDBACK && !d.querySelector('#helpFb')){ const f = document.createElement('div'); f.className = 'card sub'; f.innerHTML = '<button class="btn sm" id="helpFb" type="button">Send feedback</button> Something broken, an idea, or a content error? Tell us.'; p.after(f); f.querySelector('button').onclick = () => { if (typeof helpClose === 'function') helpClose(); IHA_FEEDBACK.open(); }; } } return r; }; }
  if (typeof S !== "undefined" && S && S.E) render();
})();
