/*
 * Deck engine: fixed-canvas scaling, slide/step navigation, citations, and a
 * presenter view that stays in sync with the audience window over BroadcastChannel.
 * URL modes: ?presenter (notes, timer, previews) and ?embed / ?embed=preview (frames inside it).
 */
(function () {
  'use strict';

  var doc = document.documentElement;
  var params = new URLSearchParams(location.search);
  var MODE = params.has('presenter') ? 'presenter' : params.has('embed') ? 'embed' : 'deck';
  var PREVIEW = params.get('embed') === 'preview';
  doc.classList.add('mode-' + MODE);
  if (PREVIEW) doc.classList.add('is-static');

  var stage = document.getElementById('stage');
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  var N = slides.length;
  var REFS = window.DECK_DATA.REFS;
  var bc = 'BroadcastChannel' in window ? new BroadcastChannel('ial-uae-deck') : null;
  var state = { i: -1, step: 0 };

  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function storage(kind, key, value) {
    try { return value === undefined ? window[kind].getItem(key) : window[kind].setItem(key, value); } catch (e) { return null; }
  }

  var Cite = (function () {
    var order = [], map = {};
    function keysOf(node) {
      return ((node.getAttribute('data-cite') || '') + ' ' + (node.getAttribute('data-cite-hidden') || '')).trim().split(/\s+/).filter(Boolean);
    }
    function collect() {
      document.querySelectorAll('[data-cite], [data-cite-hidden]').forEach(function (n) {
        keysOf(n).forEach(function (k) {
          if (!REFS[k]) { console.warn('Unknown reference key:', k); return; }
          if (!map[k]) map[k] = order.push(k);
        });
      });
    }
    function num(k) { return map[k] || ''; }
    function compress(nums) {
      nums = nums.filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
      var out = [];
      for (var i = 0; i < nums.length;) {
        var j = i;
        while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
        out.push(j - i >= 2 ? nums[i] + '–' + nums[j] : nums.slice(i, j + 1).join(', '));
        i = j + 1;
      }
      return out.join(', ');
    }
    function authorYear(r) { return r.short.split(',')[0] + ' ' + (r.short.match(/\b(19|20)\d{2}\b/) || [''])[0]; }
    function render() {
      document.querySelectorAll('cite[data-cite]').forEach(function (c) {
        var ks = keysOf(c);
        c.textContent = '[' + compress(ks.map(num)) + ']';
        c.title = ks.map(function (k) { return REFS[k] ? REFS[k].short : k; }).join('; ');
      });
      slides.forEach(function (sl) {
        var footer = sl.querySelector('.slide-cites');
        if (!footer) return;
        var ks = [];
        sl.querySelectorAll('[data-cite], [data-cite-hidden]').forEach(function (n) {
          keysOf(n).forEach(function (k) { if (REFS[k] && ks.indexOf(k) < 0) ks.push(k); });
        });
        ks.sort(function (a, b) { return num(a) - num(b); });
        footer.innerHTML = ks.map(function (k) {
          return '<span><b>' + num(k) + '</b>' + (ks.length > 4 ? authorYear(REFS[k]) : REFS[k].short) + '</span>';
        }).join('');
      });
      $('ref-list').innerHTML = order.map(function (k) {
        var r = REFS[k];
        var tail = r.doi
          ? ' <a href="https://doi.org/' + r.doi + '" target="_blank" rel="noopener">https://doi.org/' + r.doi + '</a>'
          : ' Available from: <a href="' + r.url + '" target="_blank" rel="noopener">' + r.url + '</a>';
        return '<li><span class="ref-n">' + num(k) + '.</span><span>' + r.text + tail + '</span></li>';
      }).join('');
    }
    return { collect: collect, render: render, num: num };
  })();

  function fit() {
    stage.style.setProperty('--scale', Math.min(innerWidth / 1920, innerHeight / 1080));
    if (MODE === 'deck') {
      var portraitPhone = innerWidth < 720 && innerHeight > innerWidth;
      $('rotate-hint').hidden = !portraitPhone || storage('sessionStorage', 'ial-rotate-dismissed') === '1';
    }
  }

  function maxStep(sl) {
    var m = 0;
    sl.querySelectorAll('[data-step]').forEach(function (n) { m = Math.max(m, +n.getAttribute('data-step')); });
    return m;
  }
  function applySteps(sl, step) {
    sl.querySelectorAll('[data-step]').forEach(function (n) { n.classList.toggle('is-shown', +n.getAttribute('data-step') <= step); });
    for (var k = 1; k <= maxStep(sl); k++) sl.classList.toggle('st-' + k, step >= k);
  }

  var trees = {};
  function buildTrees() {
    trees.hero = Vessels.draw($('hero-tree'), Vessels.grow({ seed: 20260121, root: [250, 1110], angle: -1.2, length: 150, width: 9, depth: 8, tortuosity: 7, target: [560, 470], targetRadius: 170 }), [120, 1180]);
    trees.uae = Vessels.draw($('uae-tree'), Vessels.grow({ seed: 911, root: [120, 690], angle: -0.9, length: 150, width: 9, depth: 7, tortuosity: 6, target: [470, 320], targetRadius: 170 }), [20, 790]);
    trees.end = Vessels.draw($('end-tree'), Vessels.grow({ seed: 4242, root: [300, 1110], angle: -1.25, length: 140, width: 8, depth: 8, tortuosity: 7, target: [600, 440], targetRadius: 160 }));
  }

  var stopParticles = null;
  function clearParticles() {
    if (stopParticles) stopParticles();
    stopParticles = null;
    trees.uae.particles.innerHTML = '';
  }
  function syncUaeSlide(sl, step, arrivedMidway) {
    sl.querySelectorAll('.mon-state').forEach(function (n) { n.classList.toggle('is-on', +n.getAttribute('data-state') === step); });
    if (step === 0) clearParticles();
    else if (!stopParticles) stopParticles = Vessels.embolise(trees.uae, arrivedMidway);
  }

  function goto(i, step, opts) {
    opts = opts || {};
    i = clamp(i | 0, 0, N - 1);
    var sl = slides[i];
    step = step === 'end' ? maxStep(sl) : clamp(step | 0, 0, maxStep(sl));
    var entered = i !== state.i;
    if (entered) {
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.setAttribute('aria-hidden', k === i ? 'false' : 'true');
        s.inert = k !== i;
      });
      clearParticles();
    }
    applySteps(sl, step);
    if (sl.classList.contains('s-uae')) syncUaeSlide(sl, step, entered);
    state.i = i; state.step = step;
    updateChrome();
    if (MODE === 'deck' && !opts.keepUrl) history.replaceState(null, '', '#/' + (i + 1));
    if (!opts.silent) post({ type: 'state', i: i, step: step });
    if (MODE === 'presenter') updatePresenter();
  }
  function next() {
    if (state.step < maxStep(slides[state.i])) goto(state.i, state.step + 1);
    else if (state.i < N - 1) goto(state.i + 1, 0);
  }
  function prev() {
    if (state.step > 0) goto(state.i, state.step - 1);
    else if (state.i > 0) goto(state.i - 1, 'end');
  }

  function updateChrome() {
    var sl = slides[state.i];
    $('hud-num').textContent = pad(state.i + 1);
    $('hud-total').textContent = pad(N);
    $('hud-section').textContent = sl.getAttribute('data-section') || '';
    $('hud-bar').style.width = (state.i / (N - 1) * 100).toFixed(2) + '%';
    $('ctl-count').textContent = (state.i + 1) + ' / ' + N;
    $('sr-live').textContent = 'Slide ' + (state.i + 1) + ' of ' + N + ': ' + sl.getAttribute('data-title');
    stage.classList.toggle('is-title-slide', state.i === 0 || state.i === N - 1);
    $('drawer-list').querySelectorAll('button[data-goto]').forEach(function (b) {
      b.setAttribute('aria-current', +b.getAttribute('data-goto') === state.i ? 'true' : 'false');
    });
  }

  function fromHash() {
    var m = location.hash.match(/^#\/?(\d+)/);
    return m ? clamp(+m[1] - 1, 0, N - 1) : 0;
  }

  function post(msg) { if (bc && MODE !== 'embed') bc.postMessage(msg); }
  if (bc) bc.onmessage = function (ev) {
    var m = ev.data;
    if (m.type === 'state') {
      if (!PREVIEW) goto(m.i, m.step, { silent: true });
      else if (m.i + 1 < N) { doc.classList.remove('is-end'); goto(m.i + 1, 'end', { silent: true }); }
      else doc.classList.add('is-end');
    } else if (m.type === 'theme') {
      setTheme(m.theme, true);
    } else if (m.type === 'blackout' && MODE === 'deck') {
      $('blackout').hidden = !m.on;
    }
  };

  function setTheme(t, silent) {
    doc.setAttribute('data-theme', t);
    storage('localStorage', 'ial-deck-theme', t);
    if (!silent) post({ type: 'theme', theme: t });
  }
  function toggleTheme() { setTheme(doc.getAttribute('data-theme') === 'roadmap' ? 'dsa' : 'roadmap'); }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (doc.requestFullscreen) doc.requestFullscreen();
  }
  var blackedOut = false;
  function toggleBlackout() {
    blackedOut = !blackedOut;
    if (MODE === 'deck') $('blackout').hidden = !blackedOut;
    else post({ type: 'blackout', on: blackedOut });
  }

  var OVERLAYS = ['drawer', 'help', 'lightbox'];
  var lastFocus = null;
  function overlayOpen() { return OVERLAYS.some(function (id) { return !$(id).hidden; }); }
  function openOverlay(id) {
    closeOverlays();
    lastFocus = document.activeElement;
    var o = $(id);
    o.hidden = false;
    var f = o.querySelector('[aria-current="true"]') || o.querySelector('button, a');
    if (f) f.focus();
  }
  function closeOverlays() {
    if (!overlayOpen()) return false;
    OVERLAYS.forEach(function (id) { $(id).hidden = true; });
    if (lastFocus) lastFocus.focus();
    return true;
  }
  function buildDrawer() {
    var html = '', lastSec = null;
    slides.forEach(function (sl, k) {
      var sec = sl.getAttribute('data-section').split(' · ')[0];
      if (sec !== lastSec) { html += '<li class="drawer-sec">' + sec + '</li>'; lastSec = sec; }
      html += '<li><button type="button" data-goto="' + k + '"><span class="n">' + pad(k + 1) + '</span><span>' + sl.getAttribute('data-title') + '</span></button></li>';
    });
    $('drawer-list').innerHTML = html;
  }
  function openFigure(btn) {
    var caption = btn.getAttribute('data-caption');
    $('lightbox-img').src = btn.getAttribute('data-figure');
    $('lightbox-img').alt = caption;
    $('lightbox-cap').textContent = caption;
    openOverlay('lightbox');
  }
  function openPresenter() {
    window.open(location.pathname + '?presenter#/' + (state.i + 1), 'ial-uae-presenter', 'popup=yes,width=1440,height=880');
  }

  var digits = '', digitTimer;
  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k === 'Escape') { if (!closeOverlays() && blackedOut) toggleBlackout(); return; }
    if (overlayOpen()) return;
    var onControl = /^(BUTTON|A)$/.test(document.activeElement.tagName);
    if (/^\d$/.test(k)) {
      digits += k; clearTimeout(digitTimer); digitTimer = setTimeout(function () { digits = ''; }, 1600);
      return;
    }
    if (k === 'Enter' && digits) { e.preventDefault(); goto(+digits - 1, 0); digits = ''; return; }
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case 'n': case 'N':
        e.preventDefault(); next(); break;
      case ' ': case 'Enter':
        if (onControl) return;
        e.preventDefault(); e.shiftKey ? prev() : next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'p': case 'P':
        e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); goto(0, 0); break;
      case 'End': e.preventDefault(); goto(N - 1, 0); break;
      case 't': case 'T': toggleTheme(); break;
      case 'b': case 'B': case '.': toggleBlackout(); break;
    }
    if (MODE !== 'deck') return;
    switch (k) {
      case 'f': case 'F': toggleFullscreen(); break;
      case 'm': case 'M': openOverlay('drawer'); break;
      case 's': case 'S': openPresenter(); break;
      case '?': openOverlay('help'); break;
    }
  }

  var ACTIONS = {
    prev: prev, next: next, theme: toggleTheme, fullscreen: toggleFullscreen, presenter: openPresenter, close: closeOverlays,
    menu: function () { openOverlay('drawer'); },
    help: function () { openOverlay('help'); },
    'close-rotate': function () { $('rotate-hint').hidden = true; storage('sessionStorage', 'ial-rotate-dismissed', '1'); }
  };

  function bindDeckInput() {
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-action]');
      var target = e.target.closest('[data-goto]');
      if (a) ACTIONS[a.getAttribute('data-action')]();
      else if (target) { closeOverlays(); goto(+target.getAttribute('data-goto'), 0); }
      else if (e.target.closest('.fig-btn')) openFigure(e.target.closest('.fig-btn'));
      else if (e.target.classList.contains('drawer') || e.target.classList.contains('modal')) closeOverlays();
      else if (e.target.id === 'blackout') toggleBlackout();
    });

    var sx = null, sy = null;
    $('viewport').addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
    $('viewport').addEventListener('pointerup', function (e) {
      if (sx == null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) next(); else prev(); }
      wake();
    });

    var idle;
    function wake() {
      document.body.classList.add('is-awake');
      clearTimeout(idle);
      idle = setTimeout(function () { document.body.classList.remove('is-awake'); }, 2600);
    }
    document.addEventListener('mousemove', wake, { passive: true });
    addEventListener('hashchange', function () { if (fromHash() !== state.i) goto(fromHash(), 0); });

    // Printing shows every slide, so reveal all steps; restore the live view afterwards.
    addEventListener('beforeprint', function () {
      slides.forEach(function (sl) { applySteps(sl, maxStep(sl)); });
      Vessels.embolise(trees.uae, true);
    });
    addEventListener('afterprint', function () {
      slides.forEach(function (sl) { applySteps(sl, 0); });
      clearParticles();
      var at = { i: state.i, step: state.step };
      state.i = -1;
      goto(at.i, at.step, { silent: true });
    });
  }

  var timer = { start: 0, pausedFor: 0, pausedAt: null };
  function updatePresenter() {
    var sl = slides[state.i], m = maxStep(sl);
    $('pv-notes').innerHTML = sl.querySelector('.notes').innerHTML;
    $('pv-pos').textContent = 'Slide ' + (state.i + 1) + ' / ' + N + ' · ' + sl.getAttribute('data-title');
    $('pv-step').textContent = m ? '· step ' + state.step + ' of ' + m : '';
    $('pv-next-title').textContent = state.step < m ? 'Next step on this slide'
      : (state.i < N - 1 ? slides[state.i + 1].getAttribute('data-title') : 'End of deck');
  }
  function tick() {
    var secs = Math.floor(((timer.pausedAt || Date.now()) - timer.start - timer.pausedFor) / 1000);
    $('pv-elapsed').textContent = pad(Math.floor(secs / 60)) + ':' + pad(secs % 60);
    var now = new Date();
    $('pv-clock').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  }
  function initPresenter() {
    document.title = 'Presenter · ' + document.title;
    $('presenter').hidden = false;
    var i = fromHash();
    $('pv-current').src = location.pathname + '?embed#/' + (i + 1);
    $('pv-next').src = location.pathname + '?embed=preview#/' + Math.min(N, i + 2);
    timer.start = Date.now();
    setInterval(tick, 500);
    tick();
    $('pv-pause').addEventListener('click', function () {
      if (timer.pausedAt) { timer.pausedFor += Date.now() - timer.pausedAt; timer.pausedAt = null; this.textContent = 'Pause'; }
      else { timer.pausedAt = Date.now(); this.textContent = 'Resume'; }
    });
    $('pv-reset').addEventListener('click', function () {
      timer.start = Date.now(); timer.pausedFor = 0; timer.pausedAt = timer.pausedAt && Date.now(); tick();
    });
    document.querySelector('.pv-nav').addEventListener('click', function (e) {
      var b = e.target.closest('[data-pv]');
      if (b) { if (b.getAttribute('data-pv') === 'next') next(); else prev(); }
    });
    document.addEventListener('keydown', onKey);
    // The frames start from the URL hash; once both have loaded, push the exact step too.
    var loaded = 0;
    ['pv-current', 'pv-next'].forEach(function (id) {
      $(id).addEventListener('load', function () { if (++loaded === 2) post({ type: 'state', i: state.i, step: state.step }); });
    });
    goto(i, 0);
  }

  function boot() {
    slides.forEach(function (sl) {
      sl.setAttribute('role', 'group');
      sl.setAttribute('aria-roledescription', 'slide');
      sl.setAttribute('aria-label', sl.getAttribute('data-title'));
      sl.querySelectorAll('.rise').forEach(function (n, k) { n.style.setProperty('--i', k); });
    });
    Cite.collect();
    Cite.render();
    Charts.renderAll(Cite.num);
    buildTrees();
    buildDrawer();
    fit();
    addEventListener('resize', fit);

    if (MODE === 'presenter') return initPresenter();
    if (MODE === 'embed') return goto(fromHash(), PREVIEW ? 'end' : 0, { silent: true });
    goto(fromHash(), 0, { keepUrl: !location.hash });
    bindDeckInput();
  }

  boot();
  window.Deck = { goto: goto, state: function () { return { i: state.i, step: state.step }; } };
})();
