/* csp-events.js — event handlers without inline on*= attributes, so the Content-Security-Policy can block inline script.
   Markup:  <button data-ev-click="goStep" data-args="[3]">   (also data-ev-change / -input / -submit / -keydown)
   data-args is a JSON array; the strings "$value", "$num" (+value), "$checked", "$el" and "$event" are replaced at run time.
   The handler is a global function (dotted paths such as "IHA_FEEDBACK.open" work). data-prevent="1" (or a handler
   returning false) calls preventDefault(). An attribute value of "a,b" calls a() then b() with the same args. */
(function(){ if (window.CSPEV) return;
  var EVS = ['click', 'change', 'input', 'submit', 'keydown'];
  function resolve(path){ var o = window, parent = null, parts = String(path).split('.');
    for (var i = 0; i < parts.length; i++){ if (o == null) return null; parent = o; o = o[parts[i]]; }
    return typeof o === 'function' ? { f: o, self: parent } : null; }
  function args(el, ev){ var raw = el.getAttribute('data-args'); if (!raw) return [];
    var a; try { a = JSON.parse(raw); } catch (e) { return []; }
    return a.map(function(x){ if (typeof x !== 'string' || x.charAt(0) !== '$') return x;
      if (x === '$value') return el.value; if (x === '$num') return +el.value; if (x === '$checked') return el.checked;
      if (x === '$el') return el; if (x === '$event') return ev; if (x.slice(0, 2) === '$$') return x.slice(1); return x; }); }
  function run(ev){ var attr = 'data-ev-' + ev.type, t = ev.target;
    var el = t && t.closest ? t.closest('[' + attr + ']') : null; if (!el) return;
    var names = el.getAttribute(attr).split(','), a = args(el, ev), out;
    if (el.hasAttribute('data-prevent')) ev.preventDefault();
    for (var i = 0; i < names.length; i++){ var r = resolve(names[i].trim()); if (!r) { if (window.console) console.warn('csp-events: no handler ' + names[i]); continue; }
      out = r.f.apply(r.self === window ? el : r.self, a); if (out === false) ev.preventDefault(); } }
  EVS.forEach(function(e){ document.addEventListener(e, run); });
  window.CSPEV = { run: run };
})();
