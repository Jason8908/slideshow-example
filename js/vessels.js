/* Procedural arterial tree drawn as a schematic angiogram (not patient imaging). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var CONTRAST_SPEED = 800;
  var PARTICLE_SPEED = 420;
  var PARTICLES = 70;

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }

  // Catmull-Rom spline through the points, emitted as cubic Béziers.
  function smoothPath(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
        p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  function blendAngle(a, b, t) { return a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t; }

  function grow(o) {
    var R = mulberry32(o.seed);
    var segs = [];

    function branch(x, y, ang, len, w, depth, dist, parent) {
      var n = Math.max(4, Math.round(len / 10));
      var pts = [[x, y]];
      var a = ang, cx = x, cy = y;
      var phase = R() * Math.PI * 2;
      var freq = 1.6 + R() * 2.4;
      var amp = o.tortuosity * (0.5 + R() * 0.8) * Math.max(0.35, Math.min(1.2, w / 4));
      var pull = depth === 0 ? 0.10 : (depth < 3 ? 0.05 : 0.02);
      for (var i = 1; i <= n; i++) {
        a = blendAngle(a, Math.atan2(o.target[1] - cy, o.target[0] - cx), pull) + (R() - 0.5) * 0.22;
        cx += Math.cos(a) * len / n; cy += Math.sin(a) * len / n;
        var wig = Math.sin(phase + (i / n) * freq * Math.PI * 2) * amp * (i < n ? 1 : 0.4);
        pts.push([cx - Math.sin(a) * wig, cy + Math.cos(a) * wig]);
      }
      var segLen = 0;
      for (var j = 1; j < pts.length; j++) segLen += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
      var end = pts[pts.length - 1];
      var idx = segs.length;
      segs.push({ pts: pts, w: w, depth: depth, parent: parent, dist: dist, len: segLen, end: end, children: [] });
      if (parent != null) segs[parent].children.push(idx);

      if (depth >= o.depth || len < 14 || w < 0.5) return;
      // Monopodial branching: one child carries on the trunk, the others peel off thinner.
      branch(end[0], end[1], a + (R() - 0.5) * 0.35, len * (0.80 + R() * 0.12), w * 0.80, depth + 1, dist + segLen, idx);
      var k = R() < 0.22 && depth > 1 ? 3 : 2;
      for (var c = 1; c < k; c++) {
        var side = (c % 2 === 1 ? 1 : -1) * (R() < 0.5 ? 1 : -1);
        branch(end[0], end[1], a + side * (0.55 + R() * 0.6), len * (0.52 + R() * 0.2), w * (0.55 + R() * 0.1), depth + 1, dist + segLen, idx);
      }
    }

    branch(o.root[0], o.root[1], o.angle, o.length, o.width, 0, 0, null);
    segs.forEach(function (s) {
      s.feedsFibroid = s.depth >= 2 && Math.hypot(s.end[0] - o.target[0], s.end[1] - o.target[1]) < o.targetRadius;
    });
    return { segs: segs, root: o.root, target: o.target, targetRadius: o.targetRadius };
  }

  function pointsFromRoot(tree, i) {
    var chain = [];
    for (var s = i; s != null; s = tree.segs[s].parent) chain.unshift(tree.segs[s]);
    var pts = [];
    chain.forEach(function (seg, k) { pts = pts.concat(k ? seg.pts.slice(1) : seg.pts); });
    return pts;
  }

  function gradient(defs, id, color, stops) {
    var g = el('radialGradient', { id: id }, defs);
    stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': color, 'stop-opacity': s[1] }, g); });
  }

  function draw(svg, tree, catheterFrom) {
    var uid = 'v' + Math.random().toString(36).slice(2, 8);
    var defs = el('defs', {}, svg);
    gradient(defs, uid + '-blush', 'currentColor', [['0%', 0.42], ['55%', 0.16], ['100%', 0]]);
    gradient(defs, uid + '-pain', 'var(--pain)', [['0%', 0.55], ['60%', 0.16], ['100%', 0]]);
    el('feGaussianBlur', { stdDeviation: 3.2 }, el('filter', { id: uid + '-halo', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs));

    var g = el('g', {}, svg);
    var T = tree.target, r = tree.targetRadius;
    el('ellipse', { class: 'vt-pain', cx: T[0], cy: T[1], rx: r * 1.45, ry: r * 1.25, fill: 'url(#' + uid + '-pain)' }, g);
    el('ellipse', { class: 'vt-blush', cx: T[0], cy: T[1], rx: r * 0.95, ry: r * 0.82, fill: 'url(#' + uid + '-blush)' }, g);
    var halo = el('g', { class: 'vt-halo', filter: 'url(#' + uid + '-halo)' }, g);
    var main = el('g', {}, g);

    var fillTime = 0;
    tree.segs.forEach(function (s) {
      var d = smoothPath(s.pts);
      var delay = s.dist / CONTRAST_SPEED, dur = Math.max(0.05, s.len / CONTRAST_SPEED);
      fillTime = Math.max(fillTime, delay + dur);
      var style = '--len:' + Math.ceil(s.len + 2) + ';--delay:' + delay.toFixed(3) + 's;--dur:' + dur.toFixed(3) + 's';
      var cls = 'vt-seg' + (s.feedsFibroid ? ' is-feeding' : '');
      el('path', { d: d, 'stroke-width': (s.w + 3.5).toFixed(2), class: cls, style: style }, halo);
      el('path', { d: d, 'stroke-width': s.w.toFixed(2), class: cls, style: style }, main);
    });

    if (catheterFrom) {
      var c = catheterFrom, root = tree.root;
      el('path', { class: 'vt-catheter-line', d: 'M' + c[0] + ' ' + c[1] + ' C ' + (c[0] + 40) + ' ' + (c[1] - 160) + ', ' + (root[0] - 90) + ' ' + (root[1] + 60) + ', ' + root[0] + ' ' + root[1] }, g);
      el('circle', { class: 'vt-catheter-tip', cx: root[0], cy: root[1], r: 4.5 }, g);
    }

    svg.style.setProperty('--blush-delay', (fillTime * 0.65 + 0.25).toFixed(2) + 's');
    return { tree: tree, particles: el('g', {}, g) };
  }

  /* Sends particles down the fibroid feeders. With `instant`, places them at rest. Returns a stop(). */
  function embolise(handle, instant) {
    var tree = handle.tree;
    var targets = [];
    tree.segs.forEach(function (s, i) { if (s.feedsFibroid && !s.children.length) targets.push(i); });

    handle.particles.innerHTML = '';
    var routes = targets.slice(0, 34).map(function (i) {
      var p = el('path', { d: smoothPath(pointsFromRoot(tree, i)), fill: 'none' }, handle.particles);
      return { path: p, len: p.getTotalLength() };
    });
    if (!routes.length) return function () {};

    var dots = [];
    for (var k = 0; k < PARTICLES; k++) {
      dots.push({
        route: routes[k % routes.length],
        start: (k / PARTICLES) * 2.4 + Math.random() * 0.2,
        node: el('circle', { r: 2.6 + Math.random() * 1.6, class: 'vt-particle', cx: tree.root[0], cy: tree.root[1], opacity: 0 }, handle.particles)
      });
    }
    function place(d, along) {
      var pt = d.route.path.getPointAtLength(Math.min(along, d.route.len - 1));
      d.node.setAttribute('cx', pt.x.toFixed(1));
      d.node.setAttribute('cy', pt.y.toFixed(1));
      d.node.setAttribute('opacity', 1);
    }
    if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dots.forEach(function (d) { place(d, d.route.len); });
      return function () {};
    }
    var t0 = null, raf;
    function frame(ts) {
      if (t0 == null) t0 = ts;
      var t = (ts - t0) / 1000, moving = false;
      dots.forEach(function (d) {
        var along = (t - d.start) * PARTICLE_SPEED;
        if (along < d.route.len) moving = true;
        if (along >= 0) place(d, along);
      });
      if (moving) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return function () { cancelAnimationFrame(raf); };
  }

  window.Vessels = { grow: grow, draw: draw, embolise: embolise };
})();
