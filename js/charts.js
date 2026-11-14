/*
 * Chart builders (plain SVG/HTML). Coordinates are stage pixels on the fixed
 * 1920×1080 canvas, so font sizes in deck.css apply one-to-one.
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var D = window.DECK_DATA;
  var MINUS = '−';
  var citeNum = function () { return ''; };

  function s(name, attrs, parent, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(name, attrs, parent, html) {
    var n = document.createElement(name);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    parent.appendChild(n);
    return n;
  }
  function lin(domain, range) {
    return function (v) { return range[0] + (v - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]); };
  }
  function fmt(v, dp) { return (v < 0 ? MINUS : '') + (dp == null ? String(Math.abs(v)) : Math.abs(v).toFixed(dp)); }
  function ci(lo, hi) { return fmt(lo, 2) + ', ' + fmt(hi, 2); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function citeTag(key) { return ' [' + citeNum(key) + ']'; }
  function diamond(x, y, est, halfH) {
    return [x(est.lo) + ',' + y, x(est.md) + ',' + (y - halfH), x(est.hi) + ',' + y, x(est.md) + ',' + (y + halfH)].join(' ');
  }
  function studyByRef(ref) { return D.STUDIES.filter(function (st) { return st.ref === ref; })[0]; }

  var Tip = (function () {
    var tip;
    function place(x, y) {
      var r = tip.getBoundingClientRect();
      var px = x + 18, py = y + 18;
      if (px + r.width > innerWidth - 8) px = x - r.width - 18;
      if (py + r.height > innerHeight - 8) py = y - r.height - 18;
      tip.style.left = Math.max(8, px) + 'px';
      tip.style.top = Math.max(8, py) + 'px';
    }
    function show(html, x, y) {
      tip = tip || document.getElementById('tip');
      tip.innerHTML = html; tip.hidden = false; place(x, y);
    }
    function hide() { if (tip) tip.hidden = true; }
    function attach(node, html, onHover) {
      node.addEventListener('pointerenter', function (e) { show(html(), e.clientX, e.clientY); if (onHover) onHover(true); });
      node.addEventListener('pointermove', function (e) { if (!tip.hidden) place(e.clientX, e.clientY); });
      node.addEventListener('pointerleave', function () { hide(); if (onHover) onHover(false); });
      node.addEventListener('focus', function () { var r = node.getBoundingClientRect(); show(html(), r.left + r.width / 2, r.bottom); if (onHover) onHover(true); });
      node.addEventListener('blur', function () { hide(); if (onHover) onHover(false); });
    }
    return { attach: attach };
  })();

  function studyTip(st, extra) {
    return '<p class="tip-h">' + esc(st.label) + citeTag(st.ref) + '</p>' + (extra || '') +
      '<p>' + esc(st.design) + ' · ' + esc(st.country) + ' · n = ' + st.n + '</p>' +
      '<p>' + esc(st.indication) + ' · pain scale: ' + esc(st.scale) + '</p>' +
      '<p class="tip-sub">Lidocaine ' + st.conc + '% · ' + st.dose + ' mg · ' + st.vol + ' mL<br>' + esc(st.timingText) + '<br>' + esc(st.agent) + '</p>';
  }
  function estimateTip(title, est, rest) {
    return '<p class="tip-h">' + title + '</p><p>MD <b>' + fmt(est.md, 2) + '</b> (95% CI ' + ci(est.lo, est.hi) + ')</p>' + (rest || '');
  }

  function waffle(el) {
    for (var i = 0; i < 100; i++) h('span', { class: i < 70 ? 'w-f' : (i < 80 ? 'w-r' : 'w-e'), style: '--i:' + i }, el);
  }

  function prisma(el) {
    var P = D.PRISMA, W = 1664, rowH = 132, top = 18, barH = 44;
    var x0 = 620, k = (1330 - x0) / P.stages[0].n;
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + (top + rowH * P.stages.length), width: W, class: 'prisma', role: 'img',
      'aria-label': 'Study selection: 123 records identified, 21 duplicates removed, 102 screened, 84 excluded, 18 full texts assessed, 10 excluded, 8 studies included' }, el);
    P.stages.forEach(function (st, i) {
      var y = top + i * rowH, g = s('g', { class: 'pr-row', style: '--i:' + i }, svg);
      var last = i === P.stages.length - 1;
      s('text', { x: 0, y: y + 52, class: 'pr-n' + (last ? ' is-final' : '') }, g, st.n);
      s('text', { x: 150, y: y + 30, class: 'pr-label' }, g, st.label);
      if (i === 0) s('text', { x: 150, y: y + 60, class: 'pr-sub' }, g, P.sources.map(function (p) { return p[0] + ' ' + p[1]; }).join(' · '));
      if (i > 0) {
        var prev = P.stages[i - 1].n, exit = P.exits[i - 1];
        var gx = x0 + st.n * k + 3, gw = (prev - st.n) * k - 3;
        s('rect', { x: gx, y: y + 8, width: Math.max(2, gw), height: barH, rx: 4, class: 'pr-ghost' }, g);
        var tx = gw > 300 ? gx + 18 : gx + gw + 18;
        s('text', { x: tx, y: y + 27, class: 'pr-exit' }, g, MINUS + exit.n + ' ' + exit.label.toLowerCase());
        s('text', { x: tx, y: y + 51, class: 'pr-exit-d' }, g, exit.detail);
        s('line', { x1: x0 + prev * k, x2: x0 + prev * k, y1: y - rowH + 8 + barH, y2: y + 8, class: 'pr-link' }, g);
      }
      s('rect', { x: x0, y: y + 8, width: st.n * k, height: barH, rx: 4, class: 'pr-bar' + (last ? ' is-final' : '') }, g);
    });
  }

  function studies(el) {
    var t = h('div', { class: 'stbl', role: 'table', 'aria-label': 'Included studies' }, el);
    var head = h('div', { class: 'stbl-row stbl-head', role: 'row' }, t);
    ['Study', 'Country', 'Design', 'Indication', 'Pain scale', 'Patients'].forEach(function (c) { h('span', { role: 'columnheader' }, head, c); });
    var maxN = Math.max.apply(null, D.STUDIES.map(function (st) { return st.n; }));
    D.STUDIES.forEach(function (st, i) {
      var isCsp = st.indication !== 'Uterine fibroids';
      var r = h('div', { class: 'stbl-row', role: 'row', tabindex: 0, style: '--i:' + i }, t);
      h('span', { role: 'cell', class: 'stbl-study' }, r, esc(st.label) + ' <cite>' + citeTag(st.ref) + '</cite>');
      h('span', { role: 'cell', class: 'mono' }, r, st.iso);
      h('span', { role: 'cell' }, r, st.design === 'RCT' ? '<span class="design design--rct">RCT</span>' : '<span class="design design--retro">Retrospective</span>');
      h('span', { role: 'cell', class: 'stbl-ind' + (isCsp ? ' is-flag' : '') }, r, isCsp ? esc(st.indication) : 'Fibroids');
      h('span', { role: 'cell' }, r, esc(st.scale));
      h('span', { role: 'cell', class: 'stbl-n' }, r, '<span class="nbar" style="--w:' + (st.n / maxN).toFixed(3) + '"></span><span class="mono">' + st.n + '</span>');
      Tip.attach(r, function () { return studyTip(st); });
    });
  }

  function protocols(el) {
    var rows = [
      { key: 'conc', label: 'Concentration', unit: '%', domain: [0, 2.2], ticks: [0, 0.5, 1, 1.5, 2], range: '0.5–2%' },
      { key: 'dose', label: 'Dose', unit: 'mg', domain: [0, 220], ticks: [0, 50, 100, 150, 200], range: '40–200 mg' },
      { key: 'vol', label: 'Volume', unit: 'mL', domain: [0, 22], ticks: [0, 5, 10, 15, 20], range: '4–20 mL' }
    ];
    var W = 1664, rowH = 138, padTop = 24;
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + (padTop + rowH * rows.length), width: W, class: 'strips', role: 'img',
      'aria-label': 'Lidocaine concentration 0.5 to 2 percent, dose 40 to 200 mg, volume 4 to 20 mL across 8 studies' }, el);
    var trace = function (id) { return function (on) { highlight(el, on ? id : null); }; };
    var byYear = D.STUDIES.slice().sort(function (a, b) { return a.year - b.year; });
    rows.forEach(function (row, ri) {
      var base = padTop + ri * rowH + rowH - 46;
      var g = s('g', { class: 'strip', style: '--i:' + ri }, svg);
      var x = lin(row.domain, [300, 1250]);
      s('text', { x: 0, y: base - 4, class: 'strip-label' }, g, row.label);
      s('text', { x: 0, y: base + 26, class: 'strip-unit' }, g, row.unit);
      s('line', { x1: 300, x2: 1250, y1: base + 16, y2: base + 16, class: 'strip-axis' }, g);
      row.ticks.forEach(function (t) {
        s('line', { x1: x(t), x2: x(t), y1: base + 16, y2: base + 22, class: 'strip-tick' }, g);
        s('text', { x: x(t), y: base + 42, class: 'strip-ticklabel' }, g, String(t));
      });
      s('text', { x: W, y: base + 4, class: 'strip-range' }, g, row.range);
      var stacked = {};
      byYear.forEach(function (st) {
        var v = st[row.key];
        var level = stacked[v] = (stacked[v] || 0) + 1;
        var c = s('circle', { cx: x(v), cy: base - 4 - (level - 1) * 22, r: 9.5, class: 'strip-dot', 'data-study': st.id, tabindex: 0 }, g);
        Tip.attach(c, function () {
          return '<p class="tip-h">' + esc(st.label) + citeTag(st.ref) + '</p><p>' + row.label + ': <b>' + v + ' ' + row.unit + '</b></p><p class="tip-sub">' + esc(st.timingText) + '</p>';
        }, trace(st.id));
      });
    });

    var tb = h('div', { class: 'timing' }, el);
    h('p', { class: 'timing-label' }, tb, 'Timing');
    [['before', 'Before embolisation'], ['during', 'During, mixed with particles'], ['after', 'Immediately after']].forEach(function (b) {
      var col = h('div', {}, tb);
      h('p', { class: 'timing-h' }, col, b[1]);
      var ul = h('ul', {}, col);
      D.STUDIES.filter(function (st) { return st.timing.indexOf(b[0]) >= 0; }).forEach(function (st) {
        var li = h('li', { 'data-study': st.id, tabindex: 0 }, ul, esc(st.label) + (st.timing.length > 1 ? '<sup>*</sup>' : ''));
        Tip.attach(li, function () { return studyTip(st); }, trace(st.id));
      });
    });
    h('p', { class: 'timing-foot' }, el, '<sup>*</sup>Noel-Lamy 2017 randomised two lidocaine arms: during and after embolisation · Embolic agents: polyvinyl alcohol (5), tris-acryl gelatin (2), gelatin sponge (1)');
  }
  function highlight(root, id) {
    root.classList.toggle('is-tracing', !!id);
    root.querySelectorAll('[data-study]').forEach(function (n) { n.classList.toggle('is-hot', n.getAttribute('data-study') === id); });
  }

  function painWindow(el) {
    var W = 1180, H = 640, L = 150, R = 1150, T = 30, B = 540, peakX = 1050;
    var slotX = { 0: 270, 4: 470, 7: 670, 24: 870 };
    var revealStep = { 0: 1, 4: 2, 7: 3, 24: 3 };
    var y = lin([1.2, -2.8], [T, B]);
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, class: 'pw', role: 'img',
      'aria-label': 'Mean difference in pain score by time point. 0 h −0.54, 4 h −1.07 (significant), 7 h −0.36, 24 h −0.09, peak within 24 h −1.37 (significant).' }, el);
    s('rect', { x: L, y: y(0), width: R - L, height: B - y(0), class: 'pw-fav' }, svg);
    s('text', { x: 944, y: B - 16, class: 'pw-favlabel', 'text-anchor': 'end' }, svg, 'Favours IAL ↓');
    s('text', { x: 944, y: T + 26, class: 'pw-favlabel', 'text-anchor': 'end' }, svg, 'Favours control ↑');
    [1, 0, -1, -2].forEach(function (v) {
      s('line', { x1: L, x2: R, y1: y(v), y2: y(v), class: v === 0 ? 'pw-zero' : 'pw-grid' }, svg);
      s('text', { x: L - 16, y: y(v) + 7, class: 'pw-tick', 'text-anchor': 'end' }, svg, fmt(v));
    });
    s('text', { x: 0, y: 0, class: 'pw-ytitle', transform: 'translate(36 ' + ((T + B) / 2) + ') rotate(-90)' }, svg, 'Mean difference in pain score');
    s('line', { x1: 960, x2: 960, y1: T, y2: B, class: 'pw-sep' }, svg);
    D.TIMEPOINTS.forEach(function (p) { s('text', { x: slotX[p.t], y: B + 36, class: 'pw-xlabel' }, svg, p.label); });
    s('text', { x: (slotX[0] + slotX[24]) / 2, y: B + 82, class: 'pw-xtitle' }, svg, 'Time after the procedure');
    s('text', { x: peakX, y: B + 36, class: 'pw-xlabel' }, svg, 'Peak');
    s('text', { x: peakX, y: B + 64, class: 'pw-xsub' }, svg, 'within 24 h');

    function point(p, x, step) {
      var g = s('g', { class: 'pw-pt' + (p.sig ? ' is-sig' : ''), 'data-step': step, tabindex: 0 }, svg);
      s('line', { x1: x, x2: x, y1: y(p.hi), y2: y(p.lo), class: 'pw-ci' }, g);
      s('line', { x1: x - 9, x2: x + 9, y1: y(p.hi), y2: y(p.hi), class: 'pw-cap' }, g);
      s('line', { x1: x - 9, x2: x + 9, y1: y(p.lo), y2: y(p.lo), class: 'pw-cap' }, g);
      s('circle', { cx: x, cy: y(p.md), r: 10, class: 'pw-dot' }, g);
      s('text', { x: x, y: y(p.lo) + 32, class: 'pw-val' }, g, fmt(p.md, 2));
      s('text', { x: x, y: y(p.lo) + 56, class: 'pw-meta' }, g, 'k ' + p.k + ' · I² ' + p.i2 + '%');
      s('rect', { x: x - 40, y: y(p.hi) - 10, width: 80, height: y(p.lo) - y(p.hi) + 72, class: 'hit' }, g);
      Tip.attach(g, function () {
        return estimateTip(p.t != null ? p.label + ' after UAE' : 'Peak pain within 24 h', p,
          '<p>P = ' + p.p + ' · I² = ' + p.i2 + '% · ' + p.k + ' studies' + (p.n ? ', ' + p.n + ' patients' : '') + '</p>' +
          '<p class="tip-sub">' + (p.sig ? 'Statistically significant' : 'Not statistically significant') + '</p>');
      });
    }
    D.TIMEPOINTS.forEach(function (p) { point(p, slotX[p.t], revealStep[p.t]); });
    point(D.PEAK, peakX, 4);
  }

  function forest(el, key) {
    var F = D.FOREST[key];
    var n = F.rows.length, W = 1664, top = 104;
    var rowH = n <= 4 ? 66 : (n === 5 ? 60 : 56);
    var P0 = 1140, P1 = 1640;
    var totalY = top + n * rowH + 34, axisY = totalY + 46;
    var x = lin(F.axis, [P0, P1]);
    var col = { em: 320, es: 400, et: 470, cm: 570, cs: 650, ct: 720, w: 820, md: 1080 };
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + (axisY + 96), width: W, class: 'fp', role: 'img',
      'aria-label': 'Forest plot: ' + F.title + '. Pooled mean difference ' + fmt(F.total.md, 2) + ' (95% CI ' + ci(F.total.lo, F.total.hi) + ').' }, el);

    s('text', { x: (col.em + col.et) / 2 - 30, y: 30, class: 'fp-grp', 'text-anchor': 'middle' }, svg, 'Intra-arterial lidocaine');
    s('text', { x: (col.cm + col.ct) / 2 - 30, y: 30, class: 'fp-grp', 'text-anchor': 'middle' }, svg, 'Control');
    s('line', { x1: col.em - 90, x2: col.et, y1: 44, y2: 44, class: 'fp-grprule' }, svg);
    s('line', { x1: col.cm - 90, x2: col.ct, y1: 44, y2: 44, class: 'fp-grprule' }, svg);
    s('text', { x: col.md, y: 30, class: 'fp-grp', 'text-anchor': 'end' }, svg, 'Mean difference');
    s('text', { x: (P0 + P1) / 2, y: 30, class: 'fp-grp', 'text-anchor': 'middle' }, svg, 'Mean difference');
    [['Study', 0, 'start'], ['Mean', col.em], ['SD', col.es], ['Total', col.et], ['Mean', col.cm], ['SD', col.cs], ['Total', col.ct], ['Weight', col.w], ['IV, random, 95% CI', col.md]].forEach(function (c) {
      s('text', { x: c[1], y: 76, class: 'fp-col', 'text-anchor': c[2] || 'end' }, svg, c[0]);
    });
    s('text', { x: (P0 + P1) / 2, y: 76, class: 'fp-col', 'text-anchor': 'middle' }, svg, 'IV, random, 95% CI');
    s('line', { x1: 0, x2: W, y1: 90, y2: 90, class: 'fp-rule' }, svg);
    s('line', { x1: x(0), x2: x(0), y1: top - 6, y2: axisY, class: 'fp-zero' }, svg);

    F.rows.forEach(function (r, i) {
      var y = top + i * rowH + rowH / 2;
      var g = s('g', { class: 'fp-row', style: '--i:' + i, tabindex: 0 }, svg);
      s('rect', { x: -8, y: y - rowH / 2 + 3, width: W + 16, height: rowH - 6, rx: 6, class: 'fp-band' }, g);
      var label = s('text', { x: 0, y: y + 8, class: 'fp-study' }, g, r.study + ' ');
      s('tspan', { class: 'fp-cite' }, label, '[' + citeNum(r.ref) + ']');
      [[r.e[0], col.em], [r.e[1], col.es], [r.e[2], col.et], [r.c[0], col.cm], [r.c[1], col.cs], [r.c[2], col.ct]].forEach(function (c) {
        s('text', { x: c[1], y: y + 8, class: 'fp-num', 'text-anchor': 'end' }, g, String(c[0]));
      });
      s('text', { x: col.w, y: y + 8, class: 'fp-num fp-w', 'text-anchor': 'end' }, g, r.w.toFixed(1) + '%');
      s('text', { x: col.md, y: y + 8, class: 'fp-num', 'text-anchor': 'end' }, g, fmt(r.md, 2) + ' [' + ci(r.lo, r.hi) + ']');
      s('line', { x1: x(r.md), x2: x(r.lo), y1: y, y2: y, class: 'fp-ci', pathLength: 1 }, g);
      s('line', { x1: x(r.md), x2: x(r.hi), y1: y, y2: y, class: 'fp-ci', pathLength: 1 }, g);
      var side = 9 + Math.sqrt(r.w) * 3.1;
      s('rect', { x: x(r.md) - side / 2, y: y - side / 2, width: side, height: side, class: 'fp-sq' }, g);
      Tip.attach(g, function () {
        return studyTip(studyByRef(r.ref), '<p>MD <b>' + fmt(r.md, 2) + '</b> (95% CI ' + ci(r.lo, r.hi) + ') · weight ' + r.w.toFixed(1) + '%</p>');
      });
    });

    var T = F.total;
    var tg = s('g', { class: 'fp-total' + (T.hi < 0 || T.lo > 0 ? ' is-sig' : ''), tabindex: 0 }, svg);
    s('line', { x1: 0, x2: W, y1: totalY - 30, y2: totalY - 30, class: 'fp-rule fp-rule--soft' }, tg);
    s('text', { x: 0, y: totalY + 8, class: 'fp-study fp-bold' }, tg, 'Total (95% CI)');
    [[T.e, col.et], [T.c, col.ct], ['100.0%', col.w], [fmt(T.md, 2) + ' [' + ci(T.lo, T.hi) + ']', col.md]].forEach(function (c) {
      s('text', { x: c[1], y: totalY + 8, class: 'fp-num fp-bold', 'text-anchor': 'end' }, tg, String(c[0]));
    });
    s('polygon', { points: diamond(x, totalY, T, 13), class: 'fp-diamond' }, tg);
    Tip.attach(tg, function () { return estimateTip('Pooled estimate', T, '<p>' + esc(F.het) + '</p><p>Overall effect: ' + esc(F.overall) + '</p>'); });

    s('line', { x1: P0, x2: P1, y1: axisY, y2: axisY, class: 'fp-axisline' }, svg);
    F.ticks.forEach(function (t) {
      s('line', { x1: x(t), x2: x(t), y1: axisY, y2: axisY + 7, class: 'fp-axisline' }, svg);
      s('text', { x: x(t), y: axisY + 32, class: 'fp-tick', 'text-anchor': 'middle' }, svg, fmt(t));
    });
    s('text', { x: x(0) - 14, y: axisY + 68, class: 'fp-fav', 'text-anchor': 'end' }, svg, '← Favours IAL');
    s('text', { x: x(0) + 14, y: axisY + 68, class: 'fp-fav' }, svg, 'Favours control →');
    s('text', { x: 0, y: axisY + 18, class: 'fp-foot' }, svg, 'Heterogeneity: ' + F.het);
    s('text', { x: 0, y: axisY + 46, class: 'fp-foot' }, svg, 'Test for overall effect: ' + F.overall);
  }

  function sensitivity(el) {
    var W = 1664, blockH = 200, top = 44, H = top + blockH * 2 + 70;
    var P0 = 520, P1 = 1180, x = lin([-3.2, 0.6], [P0, P1]);
    var M0 = 1360, M1 = 1640;
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, class: 'sens', role: 'img',
      'aria-label': 'Sensitivity analysis. 4-hour pain: −1.07 with all studies, −1.52 excluding Cai 2025; I² from 82% to 56%. Maximum 24-hour pain: −1.37 to −1.71; I² 81% to 75%.' }, el);
    s('text', { x: (P0 + P1) / 2, y: 18, class: 'sens-col', 'text-anchor': 'middle' }, svg, 'Pooled mean difference (95% CI)');
    s('text', { x: M0, y: 18, class: 'sens-col' }, svg, 'Heterogeneity, I²');
    s('line', { x1: x(0), x2: x(0), y1: top, y2: top + blockH * 2, class: 'sens-zero' }, svg);
    D.SENSITIVITY.forEach(function (o, bi) {
      var y0 = top + bi * blockH;
      s('line', { x1: 0, x2: W, y1: y0, y2: y0, class: 'sens-rule' }, svg);
      s('text', { x: 0, y: y0 + 56, class: 'sens-outcome' }, svg, o.outcome);
      [['all', 'All studies · k = ' + o.k], ['excl', 'Excluding Cai 2025 · k = ' + (o.k - 1)]].forEach(function (rw, ri) {
        var v = o[rw[0]], cy = y0 + 102 + ri * 74;
        var g = s('g', { class: 'sens-row sens-' + rw[0], 'data-step': ri || null, tabindex: 0 }, svg);
        s('text', { x: 0, y: cy + 8, class: 'sens-label' }, g, rw[1]);
        s('polygon', { points: diamond(x, cy, v, 15), class: 'sens-diamond' }, g);
        s('text', { x: P1 + 20, y: cy + 8, class: 'sens-val' }, g, fmt(v.md, 2));
        var mw = (M1 - M0) * v.i2 / 100, inside = v.i2 > 80;
        s('rect', { x: M0, y: cy - 11, width: M1 - M0, height: 22, rx: 4, class: 'sens-track' }, g);
        s('rect', { x: M0, y: cy - 11, width: mw, height: 22, rx: 4, class: 'sens-meter' }, g);
        s('text', { x: M0 + mw + (inside ? -10 : 10), y: cy + 7, class: 'sens-i2' + (inside ? ' is-in' : ''), 'text-anchor': inside ? 'end' : 'start' }, g, v.i2 + '%');
        s('rect', { x: 0, y: cy - 30, width: W, height: 60, class: 'hit' }, g);
        Tip.attach(g, function () {
          return estimateTip(esc(o.outcome) + ' · ' + rw[1], v, '<p>P = ' + v.p + ' · I² = ' + v.i2 + '%</p>' + (ri ? '<p class="tip-sub">' + o.fig + '</p>' : ''));
        });
      });
    });
    var ay = top + blockH * 2 + 8;
    [-3, -2, -1, 0].forEach(function (t) { s('text', { x: x(t), y: ay + 26, class: 'sens-tick', 'text-anchor': 'middle' }, svg, fmt(t)); });
    s('text', { x: x(0) - 14, y: ay + 58, class: 'sens-fav', 'text-anchor': 'end' }, svg, '← Favours IAL');
  }

  function opioids(el) {
    D.OTHER_OPIOIDS.forEach(function (o) {
      var W = 760, X0 = 150, X1 = 700, x = lin(o.axis, [X0, X1]);
      var svg = s('svg', { viewBox: '0 0 ' + W + ' 200', width: W, class: 'mini', role: 'img',
        'aria-label': o.name + ', ' + o.who + ': IAL ' + o.ial[0] + ' ± ' + o.ial[1] + ' ' + o.unit + ' vs control ' + o.ctl[0] + ' ± ' + o.ctl[1] + ' ' + o.unit }, el);
      var title = s('text', { x: 0, y: 26, class: 'mini-h' }, svg, o.name + ' ');
      s('tspan', { class: 'mini-who' }, title, '· ' + o.who + citeTag(o.ref));
      s('text', { x: W - 10, y: 26, class: 'mini-verdict', 'text-anchor': 'end' }, svg, o.verdict);
      [['IAL', o.ial, 'is-ial'], ['Control', o.ctl, 'is-ctl']].forEach(function (grp, k) {
        var y = 76 + k * 52, mean = grp[1][0], sd = grp[1][1];
        var g = s('g', { class: 'mini-row ' + grp[2], tabindex: 0 }, svg);
        s('text', { x: 0, y: y + 7, class: 'mini-label' }, g, grp[0]);
        s('line', { x1: x(Math.max(o.axis[0], mean - sd)), x2: x(mean + sd), y1: y, y2: y, class: 'mini-sd' }, g);
        s('circle', { cx: x(mean), cy: y, r: 9, class: 'mini-dot' }, g);
        s('rect', { x: 0, y: y - 22, width: W, height: 44, class: 'hit' }, g);
        Tip.attach(g, function () { return '<p class="tip-h">' + o.name + ' · ' + grp[0] + '</p><p>' + mean + ' ± ' + sd + ' ' + o.unit + ' (mean ± SD)</p><p class="tip-sub">' + o.who + ', units as reported</p>'; });
      });
      s('line', { x1: X0, x2: X1, y1: 160, y2: 160, class: 'mini-axis' }, svg);
      o.ticks.forEach(function (t, i) { s('text', { x: x(t), y: 188, class: 'mini-tick', 'text-anchor': 'middle' }, svg, t + (i === o.ticks.length - 1 ? ' ' + o.unit : '')); });
    });
  }

  function markers(el) {
    D.MARKERS.forEach(function (m) {
      var W = 760, X0 = 150, X1 = 700, x = lin(m.axis, [X0, X1]), y = 88;
      var svg = s('svg', { viewBox: '0 0 ' + W + ' 180', width: W, class: 'mini', role: 'img',
        'aria-label': m.name + ': MD ' + fmt(m.md, 2) + ', 95% CI ' + ci(m.lo, m.hi) + ', P = ' + m.p }, el);
      s('text', { x: 0, y: 26, class: 'mini-h' }, svg, m.name);
      s('text', { x: W - 10, y: 26, class: 'mini-verdict', 'text-anchor': 'end' }, svg, 'P = ' + m.p + ' · I² ' + m.i2 + '%');
      s('line', { x1: x(0), x2: x(0), y1: 50, y2: 136, class: 'mini-zero' }, svg);
      var g = s('g', { class: 'mini-row', tabindex: 0 }, svg);
      s('text', { x: 0, y: y + 7, class: 'mini-label' }, g, 'MD');
      s('polygon', { points: diamond(x, y, m, 14), class: 'mini-diamond' }, g);
      s('text', { x: x(m.md), y: y - 24, class: 'mini-val', 'text-anchor': 'middle' }, g, fmt(m.md, 2));
      s('rect', { x: 0, y: y - 30, width: W, height: 60, class: 'hit' }, g);
      Tip.attach(g, function () { return estimateTip(m.name, m, '<p>P = ' + m.p + ' · I² = ' + m.i2 + '%</p>'); });
      s('line', { x1: X0, x2: X1, y1: 136, y2: 136, class: 'mini-axis' }, svg);
      m.ticks.forEach(function (t) { s('text', { x: x(t), y: 164, class: 'mini-tick', 'text-anchor': 'middle' }, svg, fmt(t)); });
    });
  }

  function rob(el, key) {
    var R = D.ROB[key];
    var SYM = { L: '+', M: MINUS, S: '×' };
    var used = Object.keys(R.labels).filter(function (k) { return R.rows.some(function (r) { return (r.d + r.overall).indexOf(k) >= 0; }); });
    var summary = used.map(function (k) {
      var count = R.rows.filter(function (r) { return r.overall === k; }).length;
      return count ? count + ' ' + R.labels[k].toLowerCase() : null;
    }).filter(Boolean).join(' · ');
    h('p', { class: 'rob-h' }, el, esc(R.group) + ' <span>' + esc(R.tool) + '</span>');
    h('p', { class: 'rob-sum' }, el, 'Overall: ' + summary);
    var nd = R.domains.length;
    var tbl = h('div', { class: 'rob-t', role: 'table', style: '--cols:' + (nd + 1) }, el);
    var head = h('div', { class: 'rob-r rob-head', role: 'row' }, tbl);
    h('span', { role: 'columnheader' }, head, 'Study');
    R.domains.forEach(function (d, i) {
      var c = h('span', { role: 'columnheader', tabindex: 0, class: 'rob-d', 'aria-label': 'D' + (i + 1) + ': ' + d }, head, 'D' + (i + 1));
      Tip.attach(c, function () { return '<p class="tip-h">D' + (i + 1) + '</p><p>' + esc(d) + '</p>'; });
    });
    h('span', { role: 'columnheader', class: 'rob-d rob-overall' }, head, 'Overall');
    R.rows.forEach(function (r, ri) {
      var row = h('div', { class: 'rob-r', role: 'row', style: '--i:' + ri }, tbl);
      h('span', { role: 'rowheader', class: 'rob-study' }, row, esc(r.study) + ' <cite>' + citeTag(r.ref) + '</cite>');
      (r.d + r.overall).split('').forEach(function (j, di) {
        var isOverall = di === nd, label = R.labels[j];
        var c = h('span', { role: 'cell', class: 'rob-c' + (isOverall ? ' rob-overall' : ''), style: '--j:' + di }, row,
          '<i class="rob-dot rob-' + j + '" aria-label="' + label + '">' + SYM[j] + '</i>');
        Tip.attach(c, function () {
          return '<p class="tip-h">' + esc(r.study) + ' · ' + (isOverall ? 'Overall' : 'D' + (di + 1)) + '</p>' + (isOverall ? '' : '<p>' + esc(R.domains[di]) + '</p>') + '<p><b>' + label + '</b></p>';
        });
      });
    });
    h('p', { class: 'rob-legend' }, el, used.map(function (k) { return '<span><i class="rob-dot rob-' + k + '">' + SYM[k] + '</i>' + R.labels[k] + '</span>'; }).join(''));
  }

  var builders = {
    prisma: prisma, studies: studies, protocols: protocols, window: painWindow, sensitivity: sensitivity,
    opioids: opioids, markers: markers,
    forest: function (el) { forest(el, el.getAttribute('data-key')); },
    rob: function (el) { rob(el, el.getAttribute('data-key')); }
  };

  function renderAll(citationNumber) {
    citeNum = citationNumber;
    waffle(document.getElementById('waffle'));
    document.querySelectorAll('[data-chart]').forEach(function (el) { builders[el.getAttribute('data-chart')](el); });
  }

  window.Charts = { renderAll: renderAll };
})();
