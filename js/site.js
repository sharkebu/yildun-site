/* Yildun sitesi. Çerçeve yok, dış istek yok. Her şey isteğe bağlı: bir öğe sayfada yoksa o bölüm sessizce atlanır. */
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  var still = /[?&]durgun=1(&|$)/.test(w.location.search);
  var mq = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var calm = still || !!(mq && mq.matches);
  var wide = w.matchMedia ? w.matchMedia('(min-width: 900px)') : null;
  var hasIO = 'IntersectionObserver' in w;
  if (still) root.classList.add('still');
  w.__ready = false;

  function all(sel, el) { return Array.prototype.slice.call((el || d).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ——— yıldız tozu: tohumlu, her açılışta aynı gök; bir kez çizilir ——— */
  var sky = d.querySelector('.bg-sky');
  if (sky) {
    var seed = 11, out = '';
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var k = 0; k < 130; k++) {
      var x = rnd() * 100, y = rnd() * 100, t = rnd();
      var r = t < 0.62 ? 0.055 : t < 0.9 ? 0.08 : 0.115;
      var o = t < 0.62 ? 0.22 : t < 0.9 ? 0.42 : 0.72;
      out += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + r + '" opacity="' + o + '"/>';
    }
    sky.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + out + '</svg>';
  }

  /* ——— görseller: çerçeve hiç boş kalmaz (yer tutucu zemin), görünüme 400 px kala yüklenir, gelince belirir ——— */
  var imgs = all('.ph-f img');
  function imgOk(im) { im.classList.add('ok'); }
  imgs.forEach(function (im) {
    if (im.complete && im.naturalWidth > 0) imgOk(im);
    else {
      im.addEventListener('load', function () { imgOk(im); });
      im.addEventListener('error', function () { imgOk(im); });
    }
  });
  var lazy = imgs.filter(function (im) { return im.getAttribute('loading') === 'lazy'; });
  if (calm || !hasIO) {
    lazy.forEach(function (im) { im.loading = 'eager'; });
  } else {
    var imgIO = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (it.isIntersecting) { it.target.loading = 'eager'; imgIO.unobserve(it.target); }
      });
    }, { rootMargin: '400px 200px 400px 200px' });
    lazy.forEach(function (im) { imgIO.observe(im); });
  }

  /* ——— kaydırmada beliren sahneler ——— */
  var watched = all('.rv, .thread, .net, .umi');
  function show(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-say')) countUp(el);
    if (el === net) startAuto(3400);
  }
  if (calm || !hasIO) {
    watched.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (it.isIntersecting) { show(it.target); io.unobserve(it.target); }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -7% 0px' });
    w.setTimeout(function () { watched.forEach(function (el) { io.observe(el); }); }, 0);
  }

  /* ——— sayaç: bir kez sayarak artar; metin zaten son değerde durur ——— */
  function countUp(box) {
    all('b[data-n]', box).forEach(function (b) {
      var n = parseInt(b.getAttribute('data-n'), 10);
      if (!(n > 0)) return;
      var t0 = 0, dur = 1100;
      b.textContent = '0';
      var step = function (now) {
        if (!t0) t0 = now;
        var p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        b.textContent = String(Math.round(n * e));
        if (p < 1) w.requestAnimationFrame(step);
      };
      w.requestAnimationFrame(step);
    });
  }

  /* ——— ağ: beş adım. Dokunulmazsa 2,5 sn'de bir ilerler, bir kez; dokununca durur ——— */
  var net = d.querySelector('.net');
  var steps = all('.adimlar button');
  var caps = all('.caps .cap');
  var sure = d.querySelector('.sure');
  var order = steps.map(function (b) { return b.getAttribute('data-k'); });
  var cur = 0, autoT = 0, autoOff = calm, netSeen = false;

  function go(i) {
    if (i < 0 || i >= order.length) return;
    cur = i;
    steps.forEach(function (b, j) {
      b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      b.classList.toggle('seen', j < i);
    });
    caps.forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-k') === order[i]); });
    if (net) {
      all('[data-k]', net).forEach(function (el) {
        var at = order.indexOf(el.getAttribute('data-k'));
        el.classList.toggle('on', at === i);
        el.classList.toggle('seen', at > 0 && at < i);
      });
    }
  }
  function bar(on) {
    if (!sure) return;
    sure.classList.remove('run');
    if (on) { void sure.offsetWidth; sure.classList.add('run'); }
  }
  function queue(ms) {
    w.clearTimeout(autoT);
    if (autoOff || cur >= order.length - 1) { bar(false); return; }
    w.setTimeout(function () { if (!autoOff) bar(true); }, Math.max(0, ms - 2500));
    autoT = w.setTimeout(function () {
      if (autoOff) return;
      if (d.hidden) { queue(2500); return; }
      go(cur + 1);
      queue(2500);
    }, ms);
  }
  function startAuto(ms) { if (!netSeen && !autoOff && order.length) { netSeen = true; queue(ms); } }
  function stopAuto() { autoOff = true; w.clearTimeout(autoT); bar(false); if (sure) sure.style.visibility = 'hidden'; }
  steps.forEach(function (b, i) {
    b.addEventListener('click', function () { stopAuto(); go(i); });
  });
  if (net) {
    all('.nd[data-pick]', net).forEach(function (g) {
      g.addEventListener('click', function () { stopAuto(); go(order.indexOf(g.getAttribute('data-pick'))); });
    });
  }
  if (order.length) go(calm ? order.length - 2 : 0);

  /* ——— üst bar: bulunulan bölüm ——— */
  var navs = all('.top nav a[data-nav]');
  var secs = all('[data-sec]');
  if (navs.length && secs.length && hasIO) {
    var live = {};
    var mark = function () {
      var name = '';
      secs.forEach(function (s) { if (live[s.id]) name = s.getAttribute('data-sec'); });
      navs.forEach(function (a) {
        var on = a.getAttribute('data-nav') === name;
        a.classList.toggle('cur', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    };
    var secIO = new IntersectionObserver(function (items) {
      items.forEach(function (it) { live[it.target.id] = it.isIntersecting; });
      mark();
    }, { rootMargin: '-45% 0px -54% 0px' });
    secs.forEach(function (s) { secIO.observe(s); });
  }

  /* ——— kaydırmaya bağlı hareket: tek rAF döngüsü, yalnızca transform (rota hariç: tek öznitelik).
         Hedefe yumuşak yaklaşır, oturunca döngü durur; sekme gizliyken rAF zaten çalışmaz. ——— */
  var top = d.querySelector('.top');
  var prog = d.querySelector('.prog');
  var dial = d.querySelector('.dial');
  var falls = all('.fall').map(function (el) {
    return { el: el, near: false, top: 0, parts: all('.ph-f', el).map(function (p, i) { return { el: p, amp: [28, 72, 48][i % 3], v: -1 }; }) };
  });
  var rota = d.querySelector('.rota');
  var rotaClip = rota ? rota.querySelector('clipPath rect') : null;
  var rotaStops = rota ? all('.st', rota).map(function (g) { return { el: g, x: parseFloat(g.getAttribute('data-x')) || 0, on: false }; }) : [];
  var rotaNear = false, rotaMax = 0, rotaCur = 0, rotaW = 560, rotaTop = 0;
  var vh = w.innerHeight || 800, span = 1, raf = 0, solid = null;
  var rotNow = 0, sclNow = 1, first = true;

  function setRota(p) {
    if (rotaClip) rotaClip.setAttribute('width', (p * (rotaW + 4)).toFixed(1));
    for (var i = 0; i < rotaStops.length; i++) {
      var s = rotaStops[i];
      if (!s.on && p * rotaW >= s.x - 6) { s.on = true; s.el.classList.add('on'); }
    }
  }
  function measure() {
    vh = w.innerHeight || 800;
    span = Math.max(1, (root.scrollHeight || 0) - vh);
    var y0 = w.pageYOffset || 0;
    falls.forEach(function (f) { f.top = f.el.getBoundingClientRect().top + y0; });
    if (rota) rotaTop = rota.getBoundingClientRect().top + y0;
    /* yatay kayan ekran şeridi yalnızca gerçekten kayıyorsa klavye durağı olur */
    all('.phones').forEach(function (el) {
      if (el.scrollWidth > el.clientWidth + 4) el.setAttribute('tabindex', '0'); else el.removeAttribute('tabindex');
    });
  }
  function frame() {
    raf = 0;
    var y = w.pageYOffset || 0, busy = false;
    var p = clamp(y / span, 0, 1);
    var s = y > 24;
    if (top && s !== solid) { solid = s; top.classList.toggle('solid', s); }
    if (prog) prog.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (calm) return;

    if (dial) {
      var rotT = y * 0.022, sclT = 1 + p * 0.2;
      if (first) { rotNow = rotT; sclNow = sclT; }
      rotNow += (rotT - rotNow) * 0.14; sclNow += (sclT - sclNow) * 0.14;
      if (Math.abs(rotT - rotNow) > 0.01 || Math.abs(sclT - sclNow) > 0.0004) busy = true; else { rotNow = rotT; sclNow = sclT; }
      dial.style.transform = 'rotate(' + rotNow.toFixed(3) + 'deg) scale(' + sclNow.toFixed(4) + ')';
    }

    var fallOn = !wide || wide.matches;
    for (var i = 0; i < falls.length; i++) {
      var f = falls[i];
      if (!f.near && !first) continue;
      var q = fallOn ? clamp((vh - (f.top - y)) / (vh * 0.8), 0, 1) : 1;
      var e = 1 - Math.pow(1 - q, 3);
      for (var j = 0; j < f.parts.length; j++) {
        var part = f.parts[j], v = q >= 1 ? 0 : -(1 - e) * part.amp;
        if (v === part.v) continue;
        part.v = v;
        part.el.style.transform = v ? 'translate3d(0,' + v.toFixed(1) + 'px,0)' : '';
      }
    }

    if (rota && rotaNear) {
      var t = clamp((vh * 0.92 - (rotaTop - y)) / (vh * 0.42), 0, 1);
      if (t > rotaMax) rotaMax = t;
    }
    if (rota && rotaCur < rotaMax) {
      rotaCur += Math.max((rotaMax - rotaCur) * 0.12, 0.004);
      if (rotaCur > rotaMax) rotaCur = rotaMax;
      setRota(rotaCur);
      if (rotaCur < rotaMax) busy = true;
    }

    first = false;
    if (busy) kick();
  }
  function kick() { if (!raf) raf = w.requestAnimationFrame(frame); }

  if (!calm && hasIO) {
    var near = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (it.target === rota) rotaNear = it.isIntersecting;
        for (var i = 0; i < falls.length; i++) if (falls[i].el === it.target) falls[i].near = it.isIntersecting;
      });
      measure();
      kick();
    }, { rootMargin: '30% 0px 30% 0px' });
    falls.forEach(function (f) { near.observe(f.el); });
    if (rota) { near.observe(rota); setRota(0); }
  } else {
    rotaStops.forEach(function (s) { s.el.classList.add('on'); });
  }

  var rz = 0;
  w.addEventListener('scroll', kick, { passive: true });
  w.addEventListener('resize', function () {
    w.clearTimeout(rz);
    rz = w.setTimeout(function () { measure(); first = true; kick(); }, 150);
  }, { passive: true });
  w.addEventListener('load', function () { measure(); kick(); });
  measure();
  frame();

  /* ——— ekran görüntüsü araçları için: açılış bitince true ——— */
  var yi = d.querySelector('.yi-soma');
  var done = function () { w.__ready = true; };
  if (calm || !yi || root.classList.contains('gelmis')) w.setTimeout(done, 0);
  else {
    /* açılış atlanabilir: ilk dokunma ya da tuş son kareye götürür */
    var skip = function () {
      root.classList.add('gelmis');
      w.removeEventListener('pointerdown', skip); w.removeEventListener('keydown', skip);
      done();
    };
    w.addEventListener('pointerdown', skip, { passive: true });
    w.addEventListener('keydown', skip);
    yi.addEventListener('animationend', function () { w.setTimeout(done, 300); w.removeEventListener('pointerdown', skip); w.removeEventListener('keydown', skip); });
    w.setTimeout(done, 8000);
  }
})();
