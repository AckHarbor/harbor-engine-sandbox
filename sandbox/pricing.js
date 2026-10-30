/* Generated from brand.json + i18n by tools/build-pricing.mjs. Do not edit by hand. */
window.IHA_PRICING = {"currency":"USD","v2":249,"fhir":249,"bundle":399,"placeholder":"[price TBD]","pricingUrl":"https://ackharbor.com/pricing","term":"one-time payment, 12 months of access","accessMonths":12,"extensionPrice":49,"supportEmail":"support@ackharbor.com"};
window.IHA_HERO = {"headline":"Read, troubleshoot and fix HL7® v2 and FHIR® R4 interface messages in about 5½ hours of guided practice.","subline":"For working interface analysts and their teams: 48 short lessons, Harbor Engine practice tickets and a practice exam for each course. Self-paced."};
window.IHA_HOME = {"headline":"When health data breaks, we fix it.","subline":"HL7 and FHIR interface consulting for hospitals and vendors."};
window.IHA_WHY = "Big tech is moving into healthcare. Every new app has to talk to hospital systems — and that runs on HL7 and FHIR.";
window.IHA_STRINGS = {"locale":"en","fb.button":"Feedback","fb.title":"Send feedback","fb.kind":"What kind?","fb.type.broken":"Something's broken","fb.type.idea":"Idea","fb.type.content":"Content error","fb.message":"What happened, or what would help?","fb.email":"Email (optional, only if you want a reply)","fb.err.type":"Choose a type.","fb.err.message":"Please describe it in a few words.","fb.ok":"Thanks! We read every note.","fb.queued":"We could not reach the server, so we saved it and will try again later.","up.seePlans":"See plans","up.from":"from {price}","price.term":"One-time payment, 12 months of access","price.currencyNote":"Prices are in US dollars; your card issuer may convert them.","fb.mood":"How is it going? (optional)","fb.page":"Page","fb.okSub":"Your note went straight to the team."};
window.IHA_T = function(k, v){ var s = (window.IHA_STRINGS || {})[k]; if (s == null) return k; return s.replace(/\{(\w+)\}/g, function(m, n){ return v && v[n] != null ? v[n] : m; }); };
/* Friendly "full course" reminders. Shows at most one reminder on screen at a time. */
(function(){
  const P = window.IHA_PRICING || {};
  const fmt = n => typeof n === 'number' ? new Intl.NumberFormat('en-US', { style:'currency', currency:P.currency || 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n) : (P.placeholder || '[price TBD]');
  const from = () => { const n = [P.v2, P.fhir].filter(x => typeof x === 'number'); return n.length ? (window.IHA_T ? IHA_T('up.from', { price: fmt(Math.min.apply(null, n)) }) : 'from ' + fmt(Math.min.apply(null, n))) : fmt(null); };
  const price = t => fmt(P[t]);
  const url = local => local ? '/pricing' : P.pricingUrl;
  function card(msg, local){ const d = document.createElement('aside'); d.className = 'upsell'; d.setAttribute('role','note');
    d.innerHTML = '<span>' + msg + '</span> <a class="btn sm" href="' + url(local) + '"' + (local ? '' : ' target="_blank" rel="noopener"') + '>' + (window.IHA_T ? IHA_T('up.seePlans') : 'See plans') + '</a>'; return d; }
  /* Only the first reminder that is on screen stays visible; any others are dimmed until they are the only one. */
  let io = null; const seen = new Map();
  function watch(el){ if (!('IntersectionObserver' in window)) return;
    if (!io) io = new IntersectionObserver(es => { es.forEach(e => seen.set(e.target, e.isIntersecting)); let shown = false;
      document.querySelectorAll('.upsell').forEach(u => { const on = seen.get(u); if (on && !shown){ u.classList.remove('upsell-wait'); shown = true; } else if (on) u.classList.add('upsell-wait'); else u.classList.remove('upsell-wait'); });
      document.body.classList.toggle('upsell-onscreen', shown); });
    io.observe(el); }
  function mount(target, msg, local, where){ if (!target) return null; const c = card(msg, local); (where === 'before' ? target.before(c) : where === 'prepend' ? target.prepend(c) : target.after(c)); watch(c); return c; }
  function fill(root){ (root || document).querySelectorAll('[data-price]').forEach(e => e.textContent = price(e.dataset.price)); (root || document).querySelectorAll('[data-price-from]').forEach(e => e.textContent = from()); }
  window.IHA_UPSELL = { price, from, card, mount, watch, fill, url };
  if (document.readyState !== 'loading') fill(); else document.addEventListener('DOMContentLoaded', () => fill());
})();
/* Referral links (/?ref=CODE): remember the code for 30 days so signup and checkout can apply the friend discount. */
(function(){ try { const c = new URLSearchParams(location.search).get('ref'); if (c && /^[A-Za-z0-9]{4,12}$/.test(c)) localStorage.setItem('iha_ref', JSON.stringify({ c: c.toUpperCase(), t: Date.now() })); } catch(e){}
  window.IHA_REF = function(){ try { const r = JSON.parse(localStorage.getItem('iha_ref') || 'null'); return r && Date.now() - r.t < 30 * 864e5 ? r.c : ''; } catch(e){ return ''; } }; })();
