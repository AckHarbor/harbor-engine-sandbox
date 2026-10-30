(function(){
  const hdr = document.querySelector('.ehdr'); if (!hdr || hdr.dataset.fit) return; hdr.dataset.fit = '1';
  const wrap = document.createElement('div'); wrap.className = 'hdrMore'; wrap.hidden = true;
  wrap.innerHTML = '<button type="button" class="btn sm hdrMoreBtn" aria-haspopup="true" aria-expanded="false" aria-controls="hdrMenu">More <span aria-hidden="true">▾</span></button><div class="hdrMenu" id="hdrMenu" role="menu" aria-label="More" hidden></div>';
  hdr.appendChild(wrap);
  const btn = wrap.firstChild, menu = wrap.lastChild;
  const setOpen = o => { menu.hidden = !o; btn.setAttribute('aria-expanded', String(o)); };
  btn.onclick = e => { e.stopPropagation(); setOpen(menu.hidden); };
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) setOpen(false); else if (e.target.closest('.hdrMenu a,.hdrMenu button')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ setOpen(false); btn.focus(); } });
  const q = s => hdr.querySelector(':scope > ' + s);
  /* Steps, in the order they are taken. 'move' sends the item to the More menu; 'cls' adds a compact class to the bar. */
  const STEPS = [
    ['move', '[data-feedback]'],
    ['cls', 'c-env'],
    ['move', '#hdrUp'],
    ['move', 'a.btn[href="/app/"]'],
    ['cls', 'c-tools'],
    ['cls', 'c-sim'],
    ['move', '#helpBtn'],
    ['move', '.env'],
    ['move', '#simState'],
    ['cls', 'c-logo']
  ];
  const home = new Map(); let busy = false, mo = null;
  const vis = e => { if (e.hidden) return false; const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const fullRow = e => e.classList.contains('toolsw') || e.classList.contains('envsw') ? getComputedStyle(e).flexBasis === '100%' : false;
  function over(){
    if (hdr.scrollWidth > hdr.clientWidth + 1) return true;
    const hr = hdr.getBoundingClientRect(), logo = hdr.querySelector('.logo'); if (!logo) return false;
    const lr = logo.getBoundingClientRect(), mid = lr.top + lr.height / 2;
    for (const k of hdr.children){ if (!vis(k) || fullRow(k)) continue; const r = k.getBoundingClientRect(); if (!r.width) continue;
      if (r.right > hr.right + 0.5 || r.left < hr.left - 0.5 || Math.abs(r.top + r.height / 2 - mid) > 10) return true; }
    return false;
  }
  function envLabel(short){ const e = hdr.querySelector('.env'); if (!e) return; if (!e.dataset.full) e.dataset.full = e.textContent;
    const s = e.dataset.full.split(' · ')[0]; e.textContent = short && !menu.contains(e) ? s : e.dataset.full; e.title = short ? e.dataset.full : ''; }
  function reset(){
    /* Put every menu item back where it came from. Items another script swapped in while the original sat in the menu go back before "More". */
    for (const [el, at] of [...home].reverse()){ if (el.parentNode !== menu) continue; if (at.next && at.next.parentNode === hdr) hdr.insertBefore(el, at.next); else hdr.insertBefore(el, wrap); }
    for (const el of [...menu.children]) hdr.insertBefore(el, wrap);
    home.clear(); STEPS.forEach(([k, v]) => k === 'cls' && hdr.classList.remove(v)); envLabel(false);
  }
  function fit(){
    if (busy) return; busy = true; try {
      reset(); wrap.hidden = true; [...hdr.children].forEach((e, i) => { e.dataset.hrank = i; });
      for (const [k, v] of STEPS){ if (!over()) break;
        if (k === 'cls'){ hdr.classList.add(v); if (v === 'c-env') envLabel(true); continue; }
        const el = q(v); if (!el || !vis(el)) continue;
        home.set(el, { next: el.nextElementSibling }); el.setAttribute('role', el.getAttribute('role') || 'none'); menu.insertBefore(el, [...menu.children].find(x => +x.dataset.hrank > +el.dataset.hrank) || null); wrap.hidden = false;
        if (v === '.env') envLabel(false); }
      if (!menu.children.length){ wrap.hidden = true; setOpen(false); }
    } finally { if (mo) mo.takeRecords(); busy = false; }
  }
  let raf = 0; const later = () => { if (busy) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); };
  window.hdrFit = fit;
  addEventListener('resize', later);
  if (window.ResizeObserver) new ResizeObserver(later).observe(document.documentElement);
  mo = new MutationObserver(later); mo.observe(hdr, { childList: true, subtree: true, characterData: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  if (typeof render === 'function'){ const _r = render; render = function(){ const out = _r.apply(this, arguments); later(); return out; }; }
  later(); setTimeout(later, 300);
})();
