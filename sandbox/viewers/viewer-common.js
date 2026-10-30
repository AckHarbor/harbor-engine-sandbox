window.$ = id => document.getElementById(id);
window.esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
window.renderInsight = function(el, info, fix){
  if (!el) return;
  el.innerHTML = '<h2>'+esc(info.title)+'</h2>'
    + '<p>'+esc(info.what)+'</p>'
    + (info.values ? '<p><b>Common values</b><br>'+esc(info.values)+'</p>' : '')
    + (info.mistakes ? '<p><b>Common mistakes</b><br>'+esc(info.mistakes)+'</p>' : '')
    + (fix ? '<div class="fix '+(fix.level||'')+'"><b>'+esc(fix.title||'How to fix')+'</b><br>'+esc(fix.body)+'</div>' : '')
    + (info.spec ? '<p class="spec">Spec: <a href="'+esc(info.spec.href)+'" target="_blank" rel="noopener">'+esc(info.spec.label)+'</a></p>' : '')
    + '<div class="cta">Practice with Penford training data in the <a href="https://ackharbor.com/download">free Sandbox</a> or the <a href="https://ackharbor.com/preview">Academy preview</a>.</div>';
};
