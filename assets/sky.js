/* Skyclar sky — a real night sky (Yale Bright Star Catalog, stereographic projection centred on Orion),
   full-bleed canvas: the winter sky fades in → Orion's real stars are connected → the arrow hits its mark on the bow line → the sky clears.
   mode: "story" (home hero) | "ambient" (subpage band). Requires stars.js (window.SKYCLAR_STARS). */
(function () {
  'use strict';
  var GOLD = '198,161,91', GOLD2 = '227,198,133';
  var COL = ['185,204,255', '230,236,255', '255,246,232', '255,240,200', '255,217,160', '255,184,138']; // O/B, A, F, G, K, M
  var D2R = Math.PI/180;
  // Orion's stars by HR number (Yale BSC), lines and build order
  var HR = { BET:2061, BEL:1790, MEI:1879, PH2:1907, MIN:1852, ALN:1903, ALT:1948, SAI:2004, RIG:1713, ETA:1788, IOT:1899, TH1:1897, S42:1892,
    MU:2124, NU:2159, XI:2199, CH1:2047, CH2:2135, P1:1570, P2:1544, P3:1543, P4:1552, P5:1567, P6:1601 };
  var BIG = { BET:1, RIG:1, ALT:0, BEL:0 };
  var L = [['MIN','ALN',0.2],['ALN','ALT',0.5],['ALT','BET',0.9],['MIN','BEL',0.9],['BET','MEI',1.7],['MEI','PH2',2.1],['PH2','BEL',2.3],
    ['ALT','SAI',1.7],['MIN','ETA',1.7],['ETA','RIG',2.4],['ALN','S42',1.9],['S42','TH1',2.2],['TH1','IOT',2.4],
    ['BET','MU',2.6],['MU','NU',3.0],['NU','CH1',3.4],['MU','XI',3.0],['XI','CH2',3.4],
    ['BEL','P3',2.6],['P3','P2',3.2],['P2','P1',3.5],['P3','P4',3.2],['P4','P5',3.5],['P5','P6',3.8]];
  var DLY = { MIN:0.1, ALN:0.4, ALT:0.7, BET:1.6, BEL:1.6, MEI:2.3, PH2:2.5, SAI:2.4, ETA:2.3, RIG:2.9, S42:2.4, TH1:2.6, IOT:2.9,
    MU:3.1, NU:3.6, XI:3.6, CH1:4.0, CH2:4.0, P3:3.2, P2:3.6, P1:3.9, P4:3.6, P5:3.9, P6:4.2 };
  var NAMES = { 2061:['Beteigeuze','α Orionis'], 1713:['Rigel','β Orionis'], 1790:['Bellatrix','γ Orionis'], 1852:['Mintaka','δ Orionis'], 1903:['Alnilam','ε Orionis'], 1948:['Alnitak','ζ Orionis'], 2004:['Saiph','κ Orionis'], 1879:['Meissa','λ Orionis'], 1899:['Hatysa','ι Orionis'],
    2491:['Sirius','α Canis Majoris'], 2943:['Procyon','α Canis Minoris'], 1457:['Aldebaran','α Tauri'], 2891:['Castor','α Geminorum'], 2990:['Pollux','β Geminorum'], 1708:['Capella','α Aurigae'], 1791:['Elnath','β Tauri'], 2421:['Alhena','γ Geminorum'], 2618:['Adhara','ε Canis Majoris'], 2294:['Mirzam','β Canis Majoris'], 1543:['Tabit','π³ Orionis'], 1251:['ν Tauri','Ziel des Jägers'], 1320:['μ Tauri','Taurus'] };
  var CENTER = { ra: 5.56, dec: 5.3 };     // Orion's centre (RA h, Dec deg)
  var FIG_DEG = 30.5;                        // Orion's height in degrees (Saiph → chi1)

  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
  function ease(t){return t<0?0:t>1?1:t*t*(3-2*t)}
  function easeIn(t){t=clamp(t,0,1);return t*t*t}
  function over(t){t=clamp(t,0,1);var c=1.6;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
  // galactic latitude (deg) from RA (h) / Dec (deg), J2000
  function galB(raH, dec){ var a=raH*15*D2R, d=dec*D2R, ag=192.85948*D2R, dg=27.12825*D2R; return Math.asin(Math.sin(d)*Math.sin(dg)+Math.cos(d)*Math.cos(dg)*Math.cos(a-ag))/D2R; }

  function Sky(canvas, opts) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.opts = opts || {};
    this.mode = this.opts.mode || 'story';
    this.speed = this.opts.speed || 1.15;
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.t0 = null; this.running = false; this.visible = true; this.last = 0; this.inView = true; this.progress = 0;
    this.cat = (window.SKYCLAR_STARS || []);
    this.byHR = {}; for (var i=0;i<this.cat.length;i++) this.byHR[this.cat[i][0]] = this.cat[i];
    this.resize(); this.bindEvents();
  }
  Sky.prototype.bindEvents = function () {
    var self = this, rt;
    window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ self.resize(); }, 120); });
    document.addEventListener('visibilitychange', function(){ self.visible = !document.hidden; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ self.inView = es[0].isIntersecting; }, {threshold: 0.02}).observe(this.c);
  };
  Sky.prototype.resize = function () {
    var r = this.c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.max(1, Math.round(r.width)); this.H = Math.max(1, Math.round(r.height)); this.dpr = dpr;
    this.c.width = Math.round(this.W*dpr); this.c.height = Math.round(this.H*dpr);
    this.mobile = this.W < 900;
    this.layout(); this.project();
    if (!this.running) this.draw(this.now());
  };
  // projection: stereographic, centred on Orion; sdeg = px per degree near the centre
  Sky.prototype.layout = function () {
    var W = this.W, H = this.H, sdeg, cx, cy;
    if (this.mode === 'ambient') { sdeg = Math.min(H*0.9/FIG_DEG, W*0.28/22); cx = this.mobile ? W*0.6 : W*0.76; cy = H*0.52; }
    else if (this.mode === 'scroll') { sdeg = Math.min(H*0.8/FIG_DEG, W*0.62/22); cx = W*0.44; cy = H*0.5; }
    else if (this.mobile) { sdeg = Math.min(H*0.44/FIG_DEG, W*0.6/22); cx = W*0.42; cy = H*0.28; }
    else { sdeg = Math.min(H*0.74/FIG_DEG, W*0.29/22); cx = W*0.64; cy = H*0.5; }
    this.sdeg = sdeg; this.R = sdeg/D2R; this.cx = cx; this.cy = cy;
    this.s = sdeg*0.68; // legacy "figure unit" scale for stroke widths etc.
  };
  Sky.prototype.xy = function (raH, dec) {
    var a0=CENTER.ra*15*D2R, d0=CENTER.dec*D2R, a=raH*15*D2R, d=dec*D2R;
    var cosc = Math.sin(d0)*Math.sin(d)+Math.cos(d0)*Math.cos(d)*Math.cos(a-a0);
    var k = 2/(1+cosc);
    var x = k*Math.cos(d)*Math.sin(a-a0), y = k*(Math.cos(d0)*Math.sin(d)-Math.sin(d0)*Math.cos(d)*Math.cos(a-a0));
    return [this.cx - x*this.R, this.cy - y*this.R];
  };
  Sky.prototype.project = function () {
    var W = this.W, H = this.H, self = this;
    // figure stars
    this.fig = {};
    for (var k in HR) { var s = this.byHR[HR[k]]; if (!s) continue; var p = this.xy(s[1], s[2]); this.fig[k] = { x:p[0], y:p[1], mag:s[3], r: this.magR(s[3])*1.5 + this.sdeg*0.11, big: BIG[k]===1 }; }
    // target on the bow line: Bellatrix → pi3, extended beyond the bow
    var a = this.fig.BEL, b = this.fig.P3; this.targetHR = 0;
    if (a && b) { var dx=b.x-a.x, dy=b.y-a.y, n=Math.sqrt(dx*dx+dy*dy), ux=dx/n, uy=dy/n; var ext = n*1.1; this.tx = b.x + ux*ext; this.ty = b.y + uy*ext;
      // aim at a real star: the brightest catalogue star close to the bow line, beyond the bow
      var bestMag = 99, tol = this.sdeg*2.2;
      for (var ci=0; ci<this.cat.length; ci++) { var cs = this.cat[ci]; if (cs[3] > 5.2) continue; var q = this.xy(cs[1], cs[2]); var rx = q[0]-b.x, ry = q[1]-b.y; var along = rx*ux+ry*uy, perp = Math.abs(-rx*uy+ry*ux);
        if (along > n*0.6 && along < n*1.9 && perp < tol && cs[3] < bestMag) { bestMag = cs[3]; this.tx = q[0]; this.ty = q[1]; this.targetHR = cs[0]; } } }
    // keep the target inside the viewport by shifting the whole sky
    var Rt = Math.max(10, this.sdeg*0.75) + 26; var limit = W/2 + (W/2 - Rt)/1.04; var overX = this.tx - limit; if (overX > 0) { this.cx -= overX; this.project(); return; }
    // catalog stars → screen
    var pts = [], rnd = mulberry32(3);
    for (var i=0;i<this.cat.length;i++){ var st=this.cat[i]; var q=this.xy(st[1],st[2]); if(q[0]<-40||q[0]>W+40||q[1]<-40||q[1]>H+40) continue;
      pts.push({x:q[0],y:q[1],r:this.magR(st[3]),a:clamp(0.28+(6.5-st[3])*0.13,0.16,1),c:COL[st[4]],f:0.12+rnd()*0.35,p:rnd()*6.283,hr:st[0],mag:st[3],band:false}); }
    // faint stars (beyond the catalogue's 6.5 mag) — denser along the galactic plane, so the Milky Way sits where it really is
    var n = Math.round(W*H/(this.mobile?380:210)), tries=0;
    var raSpan = (W/this.sdeg)/15*1.3, decSpan = (H/this.sdeg)*1.3;
    while (pts.length < this.cat.length + n && tries < n*6) { tries++;
      var ra = CENTER.ra + (rnd()-0.5)*raSpan, dec = CENTER.dec + (rnd()-0.5)*decSpan; var gb = Math.abs(galB(ra,dec));
      var keep = Math.exp(-gb*gb/(2*9*9))*2.2 + 0.55; if (rnd()*2.75 > keep) continue;
      var q2=this.xy(ra,dec); if(q2[0]<0||q2[0]>W||q2[1]<0||q2[1]>H) continue;
      var m = 6.6 + rnd()*2.6;
      pts.push({x:q2[0],y:q2[1],r:0.3+Math.pow(rnd(),3)*0.8,a:clamp(0.08+(9.2-m)*0.11,0.06,0.42),c:rnd()<0.3?COL[3]:COL[1],f:0.1+rnd()*0.4,p:rnd()*6.283,hr:0,mag:m,band:gb<12}); }
    this.pts = pts;
    // Milky Way haze along the galactic equator (l ≈ 170°…250° crosses this window)
    this.haze = [];
    for (var l=150; l<=260; l+=6) { var g = this.galToEq(l, 0); var q3=this.xy(g[0], g[1]); this.haze.push({x:q3[0], y:q3[1], r: this.sdeg*9, a:0.075}); }
    this.haze.push({x:this.fig.BET?this.fig.BET.x:W*0.7, y:this.fig.BET?this.fig.BET.y:H*0.4, r:this.sdeg*14, a:0.06, gold:true});
    var mr = mulberry32(99); this.meteors = [{t0:0.9,x:0.18,y:0.12,dx:0.16,dy:0.09,len:0.09},{t0:3.4,x:0.55,y:0.06,dx:-0.12,dy:0.08,len:0.07}];
    for (var mi=0; mi<60; mi++) { var dir = mr()<0.5?1:-1; this.meteors.push({t0: 11 + mi*7.5 + mr()*4, x: 0.1+mr()*0.8, y: 0.04+mr()*0.3, dx: dir*(0.08+mr()*0.08), dy: 0.05+mr()*0.05, len: 0.05+mr()*0.05}); }
  };
  Sky.prototype.galToEq = function (l, b) { // galactic (deg) → [RA h, Dec deg], J2000
    var lr=l*D2R, br=b*D2R, dg=27.12825*D2R, ag=192.85948*D2R, ln=122.93192*D2R;
    var y = Math.cos(br)*Math.sin(ln-lr), x = Math.cos(dg)*Math.sin(br)-Math.sin(dg)*Math.cos(br)*Math.cos(ln-lr);
    var dec = Math.asin(Math.sin(br)*Math.sin(dg)+Math.cos(br)*Math.cos(dg)*Math.cos(ln-lr));
    var ra = Math.atan2(y, x) + ag;
    return [((ra/D2R/15)%24+24)%24, dec/D2R];
  };
  Sky.prototype.starAt = function (px, py) { // nearest named star within 18px (screen coords)
    var best = null, bd = 18*18, W = this.W, zoom = 1 + 0.035;
    for (var i=0;i<this.pts.length;i++){ var st=this.pts[i]; if(!st.hr || !NAMES[st.hr]) continue; var sx = (st.x - W/2)*this.lastZoom + W/2 + this.lastDrift*0.5, sy = (st.y - this.H/2)*this.lastZoom + this.H/2; var d=(sx-px)*(sx-px)+(sy-py)*(sy-py); if(d<bd){bd=d;best={x:sx,y:sy,name:NAMES[st.hr][0],desig:NAMES[st.hr][1],mag:st.mag};} }
    return best;
  };
  Sky.prototype.setProgress = function (p) { this.progress = clamp(p, 0, 1); };
  Sky.prototype.magR = function (mag) { return clamp(0.6 + (6.5-mag)*0.42, 0.5, 4.2) * (this.mobile ? 0.85 : 1); };
  Sky.prototype.now = function () { return this.t0 === null ? 0 : (performance.now()-this.t0)/1000*this.speed; };
  Sky.prototype.start = function () {
    if (this.running) return; this.running = true; this.t0 = performance.now();
    if (this.reduced) { this.draw(60); this.running = false; return; }
    var self = this;
    function loop(ts){ if(!self.running) return; if (self.visible && self.inView !== false) { var fps = self.mobile ? 30 : 60; if (ts - self.last >= 1000/fps - 1) { self.last = ts; self.draw(self.now()); } } requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
  };
  Sky.prototype.draw = function (t) {
    var ctx = this.ctx, W = this.W, H = this.H, dpr = this.dpr, s = this.s, ambient = this.mode === 'ambient', scroll = this.mode === 'scroll';
    var o, intro, build, clarity, arrowT;
    if (scroll) { var pt = this.progress * 9.2; o = 0; intro = 1; build = pt; clarity = ease((pt-6.8)/1.8); arrowT = pt - 5.6; }
    else if (ambient) { o = 0.3; intro = ease(t/1.0); build = (t - o) * 1.25; clarity = 1; arrowT = 100; }
    else { o = 1.1; intro = ease(t/1.4); build = t - o; clarity = ease((t-(o+6.2))/2.2); arrowT = t - (o+5.0); }
    var breathe = 1 + 0.12*Math.sin(t*0.9);
    this.lastZoom = 1 + 0.035*ease(t/12); this.lastDrift = 8*Math.sin(t*0.06);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var zoom = this.lastZoom;
    ctx.translate(W/2*(1-zoom), H/2*(1-zoom)); ctx.scale(zoom, zoom);
    var g = ctx.createLinearGradient(0,0,W*0.4,H); g.addColorStop(0,'#0A1220'); g.addColorStop(1,'#0E1B2E');
    ctx.fillStyle = g; ctx.fillRect(-W*0.1,-H*0.1,W*1.2,H*1.2);
    var hazeLevel = 1 - clarity*0.85, drift = this.lastDrift;
    for (var i=0;i<this.haze.length;i++){ var hz=this.haze[i]; var x=hz.x+drift*0.25, y=hz.y; var col = hz.gold ? GOLD : '150,170,215';
      var rg=ctx.createRadialGradient(x,y,0,x,y,hz.r); rg.addColorStop(0,'rgba('+col+','+(hz.a*hazeLevel*intro)+')'); rg.addColorStop(1,'rgba('+col+',0)'); ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(x,y,hz.r,0,6.283); ctx.fill(); }
    var bgMul = 1 - clarity*0.5, faintMul = 1 - clarity*0.82;
    for (var k=0;k<this.pts.length;k++){ var st=this.pts[k]; var tw=0.8+0.2*Math.sin(6.283*(st.f*t+st.p)); var a=st.a*tw*(st.hr?bgMul:faintMul)*intro; if(a<0.02) continue;
      var sx=st.x+drift*0.5;
      if (st.r>1.9){ var gg=ctx.createRadialGradient(sx,st.y,0,sx,st.y,st.r*4); gg.addColorStop(0,'rgba('+st.c+','+(a*0.45)+')'); gg.addColorStop(1,'rgba('+st.c+',0)'); ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(sx,st.y,st.r*4,0,6.283); ctx.fill(); }
      ctx.fillStyle='rgba('+st.c+','+a+')'; ctx.beginPath(); ctx.arc(sx,st.y,st.r,0,6.283); ctx.fill();
      if(st.r>1.3){ ctx.fillStyle='rgba('+st.c+','+(a*0.28)+')'; ctx.fillRect(sx-st.r*3.2,st.y-0.5,st.r*6.4,1); ctx.fillRect(sx-0.5,st.y-st.r*3.2,1,st.r*6.4); } }
    var vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.8); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(3,7,14,0.5)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    if (!scroll) for (var m=0;m<this.meteors.length;m++){ var me=this.meteors[m]; var u=(t-me.t0)/0.7; if(u<=0||u>=1) continue; var mx=(me.x+me.dx*u)*W, my=(me.y+me.dy*u)*H, lx=me.len*W*(1-u*0.3), ang=Math.atan2(me.dy*H,me.dx*W), ma=Math.sin(u*Math.PI)*0.8*(1-clarity*0.5);
      var lg=ctx.createLinearGradient(mx,my,mx-Math.cos(ang)*lx,my-Math.sin(ang)*lx); lg.addColorStop(0,'rgba(255,255,255,'+ma+')'); lg.addColorStop(1,'rgba(255,255,255,0)'); ctx.strokeStyle=lg; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx-Math.cos(ang)*lx,my-Math.sin(ang)*lx); ctx.stroke(); }
    // ---- Orion: connect the real stars ----
    var oa = ambient ? 0.6 : 1, lw = clamp(this.sdeg*0.075, 1.1, 2.0); ctx.lineCap='round';
    var F = this.fig;
    for (var li=0;li<L.length;li++){ var ln=L[li]; var A=F[ln[0]], B=F[ln[1]]; if(!A||!B) continue; var p=ease((build-ln[2])/0.9); if(p<=0) continue; var x2=A.x+(B.x-A.x)*p+drift*0.5, y2=A.y+(B.y-A.y)*p;
      ctx.save(); ctx.shadowColor='rgba('+GOLD+','+(0.7*oa)+')'; ctx.shadowBlur=lw*4; ctx.strokeStyle='rgba('+GOLD+','+((0.55+0.35*clarity)*oa)+')'; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(A.x+drift*0.5,A.y); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore(); }
    for (var key in F){ var pp=build-DLY[key]; if(pp<=0) continue; var q=F[key], sc=over(pp/0.55), qx=q.x+drift*0.5; var twk=0.9+0.1*Math.sin(6.283*(0.25*t+q.x*0.01)); var rr=q.r*sc, al=Math.min(1,pp/0.3)*oa*twk;
      var hr2 = rr*(q.big?5*breathe:3.2); var gr=ctx.createRadialGradient(qx,q.y,0,qx,q.y,hr2); gr.addColorStop(0,'rgba('+GOLD2+','+(0.55*al)+')'); gr.addColorStop(0.35,'rgba('+GOLD+','+(0.22*al)+')'); gr.addColorStop(1,'rgba('+GOLD+',0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(qx,q.y,hr2,0,6.283); ctx.fill();
      if(pp<0.7){ var qq=pp/0.7; ctx.strokeStyle='rgba('+GOLD2+','+((1-qq)*0.7*oa)+')'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(qx,q.y,q.r*(1+qq*4),0,6.283); ctx.stroke(); }
      ctx.fillStyle='rgba(232,208,150,'+al+')'; ctx.beginPath(); ctx.arc(qx,q.y,rr,0,6.283); ctx.fill();
      ctx.fillStyle='rgba(255,250,235,'+(0.85*al)+')'; ctx.beginPath(); ctx.arc(qx,q.y,rr*0.45,0,6.283); ctx.fill(); }
    // ---- target + arrow on the bow line ----
    if (F.P3 && this.tx !== undefined) {
      var bow=F.P3, bx=bow.x+drift*0.5, by=bow.y, tx=this.tx+drift*0.5, ty=this.ty, R=Math.max(10, this.sdeg*0.75);
      var tgtIn = ambient ? 0.7*ease((build-4.6)/0.8) : ease((arrowT+0.9)/0.6);
      if (tgtIn>0){ ctx.save(); ctx.strokeStyle='rgba(255,255,255,'+(0.35*tgtIn)+')'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(tx,ty,R,0,6.283); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,'+(0.2*tgtIn)+')'; ctx.beginPath(); ctx.arc(tx,ty,R*0.55,0,6.283); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,'+(0.5*tgtIn)+')'; ctx.beginPath(); ctx.arc(tx,ty,2.2,0,6.283); ctx.fill(); ctx.restore(); }
      if (!ambient) {
        var charge=ease(arrowT/0.5)*(1-ease((arrowT-0.6)/0.4));
        if(charge>0){ var cg=ctx.createRadialGradient(bx,by,0,bx,by,s*6); cg.addColorStop(0,'rgba(255,240,200,'+(0.7*charge)+')'); cg.addColorStop(1,'rgba('+GOLD+',0)'); ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(bx,by,s*6,0,6.283); ctx.fill(); }
        var fl=(arrowT-0.5)/0.6;
        if(fl>0&&fl<1.25){ var pos=function(u){u=clamp(u,0,1);var e=easeIn(u)*0.35+u*0.65;return [bx+(tx-bx)*e,by+(ty-by)*e]}; var head=Math.min(fl,1);
          ctx.save(); ctx.lineCap='round'; for(var ii=0;ii<14;ii++){ var u1=head-ii*0.045,u2=head-(ii+1)*0.045; if(u2<0) break; var p1=pos(u1),p2=pos(u2); var aa=(1-ii/14)*(fl<1?1:1-(fl-1)/0.25);
            ctx.strokeStyle='rgba(255,236,190,'+(0.9*aa)+')'; ctx.lineWidth=Math.max(1.5, s*1.4)*(1-ii/16); ctx.shadowColor='rgba('+GOLD2+',0.9)'; ctx.shadowBlur=s*4; ctx.beginPath(); ctx.moveTo(p1[0],p1[1]); ctx.lineTo(p2[0],p2[1]); ctx.stroke(); }
          if(fl<1){ var hp=pos(head); ctx.fillStyle='rgba(255,252,240,1)'; ctx.beginPath(); ctx.arc(hp[0],hp[1],Math.max(1.5,s*1.1),0,6.283); ctx.fill(); } ctx.restore(); }
        var imp=arrowT-1.1;
        if(imp>0){ var flash=Math.max(0,1-imp/0.5); var ig=ctx.createRadialGradient(tx,ty,0,tx,ty,s*22); ig.addColorStop(0,'rgba(255,245,215,'+(0.9*flash)+')'); ig.addColorStop(0.3,'rgba('+GOLD2+','+(0.35*flash)+')'); ig.addColorStop(1,'rgba('+GOLD+',0)'); ctx.fillStyle=ig; ctx.beginPath(); ctx.arc(tx,ty,s*22,0,6.283); ctx.fill();
          for(var rk=0;rk<3;rk++){ var rp=imp-rk*0.22; if(rp<0) continue; var rrad=R+rp*s*28, ra=Math.max(0,1-rp/1.3)*0.55; ctx.strokeStyle='rgba('+GOLD2+','+ra+')'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(tx,ty,rrad,0,6.283); ctx.stroke(); }
          ctx.save(); ctx.shadowColor='rgba('+GOLD+',0.9)'; ctx.shadowBlur=s*4; ctx.strokeStyle='rgba('+GOLD2+',0.95)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(tx,ty,R,0,6.283); ctx.stroke(); ctx.fillStyle='rgba(255,250,235,1)'; ctx.beginPath(); ctx.arc(tx,ty,Math.max(2,s*1.2),0,6.283); ctx.fill();
          ctx.strokeStyle='rgba('+GOLD+',0.28)'; ctx.lineWidth=1; ctx.setLineDash([4,6]); ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(tx,ty); ctx.stroke(); ctx.restore(); }
      } else { ctx.save(); ctx.strokeStyle='rgba('+GOLD+','+(0.22*ease((build-4.6)/0.8))+')'; ctx.lineWidth=1; ctx.setLineDash([4,6]); ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(tx,ty); ctx.stroke(); ctx.restore(); }
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(intro<1){ ctx.fillStyle='rgba(5,9,16,'+(1-intro)+')'; ctx.fillRect(0,0,W,H); }
  };
  window.SkyclarSky = { mount: function (canvas, opts) { var sky = new Sky(canvas, opts); sky.start(); return sky; } };
  window.SkyclarSky.instances = [];
  document.addEventListener('DOMContentLoaded', function(){ var cs=document.querySelectorAll('canvas[data-sky]'); for(var i=0;i<cs.length;i++){ var inst = window.SkyclarSky.mount(cs[i], {mode: cs[i].getAttribute('data-sky')||'story'}); cs[i].__sky = inst; window.SkyclarSky.instances.push(inst); } document.dispatchEvent(new CustomEvent('skyclar:ready')); });
})();
