/* Lokta kolam (part of @lokta/css). A deterministic generator for sikku-kolam
   line ornaments: a continuous line woven around a grid of pulli (dots), the
   alpana/kolam tradition the Bengali cookbook lineage draws on. Pure line, pure
   geometry, no randomness.

   The construction: each cell contributes two quarter arcs (radius s/2) centred
   on dots, the pair chosen by a tile rule over (i, j). With the checkerboard
   rule the arcs link into the woven four-point stars; other rules give other
   motifs. Output is plain SVG arc commands, so it renders identically in a web
   page, a Marp slide, and a Typst PDF, and themes through currentColor.

   path()/svg() are pure (no DOM) so they run in Node for build-time and Typst
   generation, and feed validate/kolam.mjs. auto() upgrades declarative hosts in
   the browser and, with [data-lk-draw], hands the path to @lokta/motion's draw()
   so the line writes itself in, stroke by stroke. Every kolam is role="img"
   with an aria-label, because an ornament still needs a name. */
(function (global) {
  'use strict';

  // Tile rules: (i, j) -> 0 | 1, picking which diagonal pair of arcs a cell draws.
  var PATTERNS = {
    weave: function (i, j) {
      return (i + j) % 2;
    }, // the signature woven stars
    plain: function () {
      return 0;
    }, // continuous diagonal flow, no stars
    rows: function (i, j) {
      return j % 2;
    },
    cols: function (i, j) {
      return i % 2;
    },
  };

  function num(v) {
    return Math.round(v * 100) / 100;
  }

  // ── PURE · the woven path + the dot positions ────────────────────────────
  function path(cols, rows, opts) {
    opts = opts || {};
    var s = opts.s || 60;
    var rule = typeof opts.rule === 'function' ? opts.rule : PATTERNS[opts.rule] || PATTERNS.weave;
    var r = s / 2;
    var dots = [];
    for (var j = 0; j <= rows; j++) for (var i = 0; i <= cols; i++) dots.push([i * s, j * s]);

    // sweep flag: 1 if going p0 -> p1 around centre c is clockwise on screen.
    function sweep(c, p0, p1) {
      var cross = (p0[0] - c[0]) * (p1[1] - c[1]) - (p0[1] - c[1]) * (p1[0] - c[0]);
      return cross < 0 ? 1 : 0;
    }
    var d = '';
    function arc(c, p0, p1) {
      d +=
        'M ' +
        num(p0[0]) +
        ' ' +
        num(p0[1]) +
        ' A ' +
        r +
        ' ' +
        r +
        ' 0 0 ' +
        sweep(c, p0, p1) +
        ' ' +
        num(p1[0]) +
        ' ' +
        num(p1[1]) +
        ' ';
    }
    for (var jj = 0; jj < rows; jj++)
      for (var ii = 0; ii < cols; ii++) {
        var x = ii * s,
          y = jj * s;
        var tl = [x, y],
          tr = [x + s, y],
          bl = [x, y + s],
          br = [x + s, y + s];
        var tm = [x + s / 2, y],
          bm = [x + s / 2, y + s],
          lm = [x, y + s / 2],
          rm = [x + s, y + s / 2];
        if (rule(ii, jj) === 0) {
          arc(tl, tm, lm);
          arc(br, bm, rm);
        } else {
          arc(tr, tm, rm);
          arc(bl, bm, lm);
        }
      }
    return { d: d.trim(), dots: dots, w: cols * s, h: rows * s };
  }

  // ── PURE · a complete SVG string (Node, SSR, Typst, browser) ─────────────
  function svg(cols, rows, opts) {
    opts = opts || {};
    var k = path(cols, rows, opts);
    var pad = opts.pad != null ? opts.pad : Math.round((opts.s || 60) * 0.5);
    var w = k.w + pad * 2,
      h = k.h + pad * 2;
    var weight = opts.weight || 2;
    var dotR = opts.showDots === false ? 0 : opts.dotR != null ? opts.dotR : weight * 0.7;
    var label =
      opts.label || 'sikku kolam, a continuous line woven around a ' + cols + ' by ' + rows + ' grid of dots';
    var dots = '';
    if (dotR)
      for (var n = 0; n < k.dots.length; n++)
        dots +=
          '<circle cx="' +
          num(k.dots[n][0] + pad) +
          '" cy="' +
          num(k.dots[n][1] + pad) +
          '" r="' +
          dotR +
          '" fill="currentColor"/>';
    return (
      '<svg viewBox="0 0 ' +
      w +
      ' ' +
      h +
      '" xmlns="http://www.w3.org/2000/svg" class="lk-kolam-svg' +
      (opts.className ? ' ' + opts.className : '') +
      '" role="img" aria-label="' +
      label.replace(/"/g, '&quot;') +
      '">' +
      '<g transform="translate(' +
      pad +
      ' ' +
      pad +
      ')"><path d="' +
      k.d +
      '" fill="none" stroke="currentColor" stroke-width="' +
      weight +
      '" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      dots +
      '</svg>'
    );
  }

  // ── DOM · build an element ───────────────────────────────────────────────
  function make(cols, rows, opts) {
    var tpl = document.createElement('template');
    tpl.innerHTML = svg(cols, rows, opts).trim();
    return tpl.content.firstChild;
  }

  // ── DOM · upgrade <figure class="lk-kolam" data-lk-kolam="weave"
  //         data-grid="6x6" data-weight="2" data-draw> hosts ───────────────
  function auto(root) {
    root = root || document;
    root.querySelectorAll('[data-lk-kolam]').forEach(function (host) {
      if (host.querySelector('svg')) return; // already built
      var grid = (host.getAttribute('data-grid') || '6x6').split(/[x×]/);
      var el = make(+grid[0] || 6, +grid[1] || 6, {
        rule: host.getAttribute('data-lk-kolam') || 'weave',
        s: +host.getAttribute('data-s') || 60,
        weight: +host.getAttribute('data-weight') || 2,
        showDots: host.getAttribute('data-dots') !== 'off',
        label: host.getAttribute('aria-label') || undefined,
      });
      // The label lives on the svg; clear a duplicate on the host.
      if (host.hasAttribute('aria-label')) host.removeAttribute('aria-label');
      host.appendChild(el);
      if (host.hasAttribute('data-draw') && global.LoktaMotion) {
        el.setAttribute('data-lk-draw', '');
        global.LoktaMotion.draw(el); // respects reduced motion internally
      }
    });
  }

  var API = { PATTERNS: PATTERNS, path: path, svg: svg, make: make, auto: auto };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.LoktaKolam = API;
  if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') auto();
    else
      document.addEventListener('DOMContentLoaded', function () {
        auto();
      });
  }
})(typeof window !== 'undefined' ? window : this);
