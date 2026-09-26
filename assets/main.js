if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo(0, 0);
(function () {
  'use strict';
  // nav: glass once scrolled
  var nav = document.querySelector('.nav');
  function onScroll(){ if(!nav) return; nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  // mobile menu
  var burger = document.querySelector('.burger'), menu = document.querySelector('.navlinks');
  if (burger && menu) {
    burger.addEventListener('click', function(){ var open = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); document.body.classList.toggle('menu-open', open); });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open'); }); });
  }
  // reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold: 0.12, rootMargin: '0px 0px -8% 0px'});
    els.forEach(function(el){ io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }
  // count-up for stats
  var nums = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && nums.length) {
    var io2 = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(!e.isIntersecting) return; io2.unobserve(e.target); var el=e.target, target=parseFloat(el.getAttribute('data-count')), suffix=el.getAttribute('data-suffix')||'', t0=null;
      function step(ts){ if(t0===null) t0=ts; var p=Math.min(1,(ts-t0)/1100); p=1-Math.pow(1-p,3); el.textContent=Math.round(target*p)+suffix; if(p<1) requestAnimationFrame(step); } requestAnimationFrame(step); }); }, {threshold: 0.5});
    nums.forEach(function(n){ io2.observe(n); });
  }
})();
(function(){
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // photo band parallax
  var bands = document.querySelectorAll('.photo-band img');
  function par(){ if(reduced) return; var vh=window.innerHeight; bands.forEach(function(img){ var r=img.parentElement.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return; var p=(r.top+r.height/2-vh/2)/vh; img.style.translate='0 '+(p*-40)+'px'; }); }
  window.addEventListener('scroll', par, {passive:true}); par();
  // hero: mouse parallax on sky + copy
  var hero = document.querySelector('.hero-sky'), sky = hero && hero.querySelector('canvas, video.hero-video'), copy = hero && hero.querySelector('.hero-copy');
  var mx = 0, my = 0, sz = 1;
  function applySky(){ if(sky) sky.style.transform='translate('+(mx*-14)+'px,'+(my*-10)+'px) scale('+(1.03*sz)+')'; }
  if (hero && !reduced && matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('mousemove', function(e){ var r=hero.getBoundingClientRect(); mx=(e.clientX-r.left)/r.width-0.5; my=(e.clientY-r.top)/r.height-0.5; applySky(); if(copy) copy.style.transform='translate('+(mx*6)+'px,'+(my*4)+'px)'; });
    hero.addEventListener('mouseleave', function(){ mx=0; my=0; applySky(); if(copy) copy.style.transform=''; });
    if(sky){ sky.style.transition='transform .6s cubic-bezier(.2,.7,.2,1)'; } if(copy){ copy.style.transition='transform .6s cubic-bezier(.2,.7,.2,1)'; }
  }
  // hero: copy fades, sky zooms slowly as you scroll (cinematic push-in)
  if (hero && !reduced) window.addEventListener('scroll', function(){ var y=window.scrollY; if(copy){ copy.style.opacity=Math.max(0,1-y/520); copy.style.translate='0 '+(y*0.18)+'px'; } sz = 1 + Math.min(0.12, y/6000); applySky(); }, {passive:true});
  // card glow follows the pointer
  document.querySelectorAll('.card.glow').forEach(function(c){ c.addEventListener('mousemove', function(e){ var r=c.getBoundingClientRect(); c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%'); c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%'); }); });
})();

(function(){
  'use strict';
  function init(){
    // scroll-driven Orion (how-we-deliver)
    document.querySelectorAll('.how-sticky').forEach(function(sec){
      var canvas = sec.querySelector('canvas[data-sky="scroll"]'); if(!canvas || !canvas.__sky) return;
      var sky = canvas.__sky, items = sec.querySelectorAll('.how-step');
      function upd(){ var r = sec.getBoundingClientRect(), vh = window.innerHeight; var total = r.height - vh*0.7; var p = (vh*0.55 - r.top) / Math.max(1,total); sky.setProgress(p);
        items.forEach(function(it, i){ var ir = it.getBoundingClientRect(); it.classList.toggle('on', ir.top < vh*0.62 && ir.bottom > vh*0.28); }); }
      window.addEventListener('scroll', upd, {passive:true}); window.addEventListener('resize', upd); upd();
    });
    // star names on hover (hero)
    var hero = document.querySelector('.hero-sky'), canvas = hero && hero.querySelector('canvas'), tip = document.querySelector('.star-tip');
    if (hero && canvas && canvas.__sky && tip && matchMedia('(pointer:fine)').matches) {
      var sky = canvas.__sky, cur = null;
      hero.addEventListener('mousemove', function(e){ var r = canvas.getBoundingClientRect(); var st = sky.starAt(e.clientX - r.left, e.clientY - r.top);
        if (st) { if (cur !== st.name) { cur = st.name; tip.querySelector('b').textContent = st.name; tip.querySelector('span').textContent = st.desig; } tip.style.left = (st.x + r.left - hero.getBoundingClientRect().left) + 'px'; tip.style.top = (st.y + r.top - hero.getBoundingClientRect().top) + 'px'; tip.classList.add('show'); hero.classList.add('has-star'); }
        else { cur = null; tip.classList.remove('show'); hero.classList.remove('has-star'); } });
      hero.addEventListener('mouseleave', function(){ tip.classList.remove('show'); hero.classList.remove('has-star'); });
    }
  }
  if (window.SkyclarSky && window.SkyclarSky.instances && window.SkyclarSky.instances.length) init(); else document.addEventListener('skyclar:ready', init);
})();

(function(){
  'use strict';
  // brand film: play when in view, pause when out, tap to toggle, fullscreen button
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-film]').forEach(function(frame){
    var v = frame.querySelector('video'), play = frame.querySelector('.film-play'), fs = frame.querySelector('[data-fs]'), wanted = !reduced, userPaused = false;
    if (window.matchMedia('(max-width: 900px)').matches) { // portrait cut for phones
      frame.querySelectorAll('source[data-src-m]').forEach(function(sr){ sr.setAttribute('src', sr.getAttribute('data-src-m')); });
      if (v.getAttribute('data-poster-m')) v.setAttribute('poster', v.getAttribute('data-poster-m'));
      frame.classList.add('portrait'); v.load();
    }
    function tryPlay(){ if(!wanted || userPaused) return; var p = v.play(); if(p && p.catch) p.catch(function(){ frame.classList.add('paused'); }); }
    v.addEventListener('play', function(){ frame.classList.remove('paused'); });
    v.addEventListener('pause', function(){ if(userPaused || v.ended) frame.classList.add('paused'); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && e.intersectionRatio > 0.35){ wanted = !reduced; tryPlay(); } else { wanted = false; if(!v.paused) v.pause(); } }); }, {threshold:[0,0.35,0.6]});
      io.observe(frame);
    } else { wanted = true; tryPlay(); }
    if (reduced) frame.classList.add('paused');
    function toggle(){ if(v.paused){ userPaused = false; wanted = true; tryPlay(); } else { userPaused = true; v.pause(); frame.classList.add('paused'); } }
    play.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    fs.addEventListener('click', function(e){ e.stopPropagation(); var el = frame; userPaused = false; wanted = true;
      if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen(); return; }
      if (el.requestFullscreen) el.requestFullscreen().then(tryPlay).catch(function(){ if(v.webkitEnterFullscreen) v.webkitEnterFullscreen(); });
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      tryPlay(); });
  });
})();

(function(){
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // nav turns light over light sections
  var nav = document.querySelector('.nav');
  function navTone(){ if(!nav) return; var h = nav.offsetHeight + 2; var el = document.elementFromPoint(Math.round(window.innerWidth/2), h); var light = el && el.closest && el.closest('.light, footer.light'); nav.classList.toggle('on-light', !!light && !document.body.classList.contains('menu-open')); }
  window.addEventListener('scroll', navTone, {passive:true}); window.addEventListener('resize', navTone); document.addEventListener('click', function(){ setTimeout(navTone, 50); }); navTone();
  // film frame grows as it scrolls into view
  var frames = document.querySelectorAll('.film-frame');
  function filmScale(){ if(reduced) return; var vh = window.innerHeight; frames.forEach(function(f){ var r = f.getBoundingClientRect(); var p = 1 - Math.min(1, Math.max(0, (r.top + r.height*0.5 - vh*0.55) / (vh*0.55))); f.style.setProperty('--fs', (0.9 + 0.1*p).toFixed(4)); }); }
  window.addEventListener('scroll', filmScale, {passive:true}); window.addEventListener('resize', filmScale); filmScale();
  // cinema overlay
  var cin = document.getElementById('cinema'); if(!cin) return;
  var v = cin.querySelector('video'), opener = null;
  if (window.matchMedia('(max-width: 900px)').matches) { cin.querySelectorAll('source[data-src-m]').forEach(function(sr){ sr.setAttribute('src', sr.getAttribute('data-src-m')); }); if (v.getAttribute('data-poster-m')) v.setAttribute('poster', v.getAttribute('data-poster-m')); cin.classList.add('portrait'); v.load(); }
  function open(btn){ opener = btn || null; cin.hidden = false; cin.setAttribute('aria-hidden','false'); document.body.classList.add('cinema-open'); requestAnimationFrame(function(){ cin.classList.add('open'); }); try { v.currentTime = 0; } catch(e){} var p = v.play(); if (p && p.catch) p.catch(function(){}); }
  function close(){ cin.classList.remove('open'); document.body.classList.remove('cinema-open'); v.pause(); setTimeout(function(){ cin.hidden = true; cin.setAttribute('aria-hidden','true'); }, 350); if (opener && opener.focus) opener.focus(); }
  document.querySelectorAll('[data-cinema]').forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); open(b); }); });
  cin.querySelector('[data-cinema-close]').addEventListener('click', close);
  cin.addEventListener('click', function(e){ if (e.target === cin) close(); });
  v.addEventListener('ended', function(){ setTimeout(close, 600); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !cin.hidden) close(); });
})();
