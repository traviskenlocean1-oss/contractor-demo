/* El Duro motion layer (2026-11-07). Vanilla JS, no libraries, one passive scroll loop. */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var scrollJobs = [];

  /* ---------- quote forms: the action was a Formspree placeholder, so submissions errored ---------- */
  $$('form').forEach(function (f) {
    if (!/YOUR_ID/.test(f.getAttribute('action') || '')) return;
    var born = Date.now();
    var hp = document.createElement('div'); hp.className = 'ed-hp'; hp.setAttribute('aria-hidden', 'true');
    hp.innerHTML = '<label>Website<input name="_gotcha" tabindex="-1" autocomplete="off"></label>'; f.appendChild(hp);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bot = f._gotcha.value !== '' || Date.now() - born < 3000;
      if (!bot && !f.checkValidity()) { f.reportValidity(); return; }
      var nm = f.querySelector('[name=fullname],[name=name]'), first = (!bot && nm && nm.value.trim().split(' ')[0]) || '';
      /* Demo site: nothing is sent. Bots get the same screen and nothing happens. */
      f.innerHTML = '<div class="ed-sent" role="status"><b>Thanks' + (first ? ', ' + first.replace(/[<>&"]/g, '') : '') + '.</b>We got your request and will call you within 24 hours with your free estimate.</div>';
    });
  });

  if (reduced) return;

  /* ---------- headings rise line by line ---------- */
  var hio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ed-on'); hio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('h1.hero-title, h2').forEach(function (h) {
    if (h.closest('form') || h.closest('.hero-form-card') || !h.textContent.trim()) return;
    var parts = h.innerHTML.split(/<br\s*\/?>/i);
    h.innerHTML = parts.map(function (p, i) { return '<span class="ed-mask"><span class="ed-line" style="--li:' + i + '">' + p.trim() + '</span></span>'; }).join('');
    hio.observe(h);
  });

  /* ---------- Marlow frame growth on photos ---------- */
  var frames = $$('.as-img-wrap, .why-img, .proj-card');
  frames.forEach(function (el) { el.classList.add('ed-frame'); });
  scrollJobs.push(function (vh) {
    frames.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var k = easeOut(clamp((vh - r.top) / (vh * 0.75), 0, 1));
      var ix = (1 - k) * 9, iy = (1 - k) * 12;
      el.style.clipPath = 'inset(' + iy + '% ' + ix + '% ' + iy + '% ' + ix + '% round ' + (1 - k) * 14 + 'px)';
      var img = el.querySelector('img'); if (img) img.style.transform = 'scale(' + (1.16 - 0.16 * k) + ')';
    });
  });

  /* ---------- services: wipe the new photo in over the old one ---------- */
  var bg = $('#se-bg'), panel = $('#se-panel');
  if (bg && panel) {
    var shown = bg.style.backgroundImage, busy = false;
    new MutationObserver(function () {
      if (busy) return;
      var next = bg.style.backgroundImage; if (!next || next === shown) return;
      busy = true; bg.style.backgroundImage = shown; busy = false;
      var w = document.createElement('div'); w.className = 'ed-wipe'; w.style.backgroundImage = next;
      bg.appendChild(w); panel.classList.add('ed-swap');
      requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add('go'); }); });
      setTimeout(function () { panel.classList.remove('ed-swap'); }, 260);
      setTimeout(function () {
        busy = true; bg.style.backgroundImage = next; busy = false; shown = next;
        $$('.ed-wipe', bg).forEach(function (x) { if (x !== w || true) x.remove(); });
      }, 900);
    }).observe(bg, { attributes: true, attributeFilter: ['style'] });
  }

  /* ---------- SOLE: dark section opens as a rising circle with curved text ---------- */
  var why = $('.why-section');
  if (why) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ed-arc'); svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(NS, 'path'); path.setAttribute('id', 'edArcPath'); path.setAttribute('fill', 'none');
    var text = document.createElementNS(NS, 'text'), tp = document.createElementNS(NS, 'textPath');
    tp.setAttribute('href', '#edArcPath'); tp.setAttribute('startOffset', '50%'); tp.setAttribute('text-anchor', 'middle');
    tp.textContent = 'Why Jacksonville chooses El Duro';
    text.appendChild(tp); svg.appendChild(path); svg.appendChild(text); why.appendChild(svg);
    var opened = false;
    scrollJobs.push(function (vh) {
      var r = why.getBoundingClientRect(); if (r.top > vh || r.bottom < 0) return;
      var W = r.width, H = r.height, diag = Math.hypot(W / 2, H) * 1.02;
      var k = easeOut(clamp((vh - r.top) / (vh * 0.9), 0, 1));
      var R = Math.max(1, diag * k);
      why.style.clipPath = k >= 1 ? 'none' : 'circle(' + R + 'px at 50% 100%)';
      var tr = Math.max(10, R - 30);
      path.setAttribute('d', 'M ' + (W / 2 - tr) + ' ' + H + ' A ' + tr + ' ' + tr + ' 0 0 1 ' + (W / 2 + tr) + ' ' + H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      text.style.opacity = k < 0.12 ? k / 0.12 : clamp(1 - (k - 0.62) / 0.25, 0, 1);
      if (k > 0.7 && !opened) { opened = true; why.classList.add('ed-open'); }
    });
    $$('.why-point', why).forEach(function (p, i) { p.style.setProperty('--pi', i); });
  }

  /* ---------- process: gold line pours across the steps ---------- */
  var grid = $('.process-grid');
  if (grid) {
    var steps = $$('.process-step', grid);
    var line = document.createElement('div'); line.className = 'ed-pline'; line.innerHTML = '<i></i>'; grid.appendChild(line);
    grid.classList.add('ed-ready');
    var fill = line.firstChild;
    scrollJobs.push(function (vh) {
      var r = grid.getBoundingClientRect(); if (r.top > vh || r.bottom < 0) return;
      var wide = innerWidth > 900;
      if (wide) {
        var k = clamp((vh * 0.85 - r.top) / (vh * 0.45), 0, 1);
        fill.style.transform = 'scaleX(' + k + ')';
        steps.forEach(function (s, i) { s.classList.toggle('lit', k >= (i + 0.5) / steps.length); });
      } else {
        steps.forEach(function (s) { var b = s.getBoundingClientRect(); s.classList.toggle('lit', b.top < vh * 0.75); });
      }
    });
  }

  /* ---------- Aurelia: hand-drawn ring around the final call to action ---------- */
  var cta = $('.cta-banner .btn-white') || $('.cta-banner a');
  if (cta) {
    var wrap = document.createElement('span'); wrap.className = 'ed-ring-wrap';
    cta.parentNode.insertBefore(wrap, cta); wrap.appendChild(cta);
    var ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ring.setAttribute('class', 'ed-ring'); ring.setAttribute('viewBox', '0 0 200 80'); ring.setAttribute('preserveAspectRatio', 'none'); ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<path d="M108 6 C 160 4, 196 18, 196 40 C 196 64, 150 76, 98 75 C 44 74, 4 62, 4 40 C 4 18, 46 6, 96 5 C 120 4, 150 8, 168 15"/>';
    wrap.appendChild(ring);
    var p = ring.querySelector('path'), len = p.getTotalLength(); p.style.setProperty('--len', len);
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { ring.classList.add('on'); o.disconnect(); } }); }, { rootMargin: '0px 0px -20% 0px' }).observe(wrap);
  }

  /* one passive scroll loop for everything scroll-linked */
  var ticking = false;
  function run() { ticking = false; var vh = innerHeight; scrollJobs.forEach(function (j) { j(vh); }); }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(run); } }
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); run();
})();
