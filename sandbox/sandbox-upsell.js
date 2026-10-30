(function(){ const U = window.IHA_UPSELL; if (!U) return;
  const _render = render; render = function(){ const r = _render.apply(this, arguments); try {
      const hdr = document.querySelector('.ehdr');
      if (hdr && !document.querySelector('.sb-upsell-line')){
        /* Below the bar, not inside it: a full-width line inside the flex header squeezed every header label. */
        const line = document.createElement('p'); line.className = 'sb-upsell-line';
        line.innerHTML = 'Free Sandbox: 3 channels + sample messages. <a href="'+U.url(false)+'" target="_blank" rel="noopener" style="color:#C2410C">Full lab with tickets &amp; lessons →</a>';
        hdr.insertAdjacentElement('afterend', line);
      }
    } catch(e){} return r; };
  if (typeof S !== "undefined" && S && S.messages) render(); })();