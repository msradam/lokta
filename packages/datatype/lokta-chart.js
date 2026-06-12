/* @lokta/css — Datatype chart helper. A chart made of text is still text, so
   the source string and its spoken label must never drift. These helpers take a
   value array and emit both together: the {…} ligature source the Datatype font
   renders, and the aria-label a screen reader speaks. Every chart is role="img".

   Pure functions (source/label) work in Node, SSR, and Typst-side generation;
   the DOM helpers (bars/spark/pie/auto) upgrade in the browser and add the
   no-font fallback (if Datatype fails to load, the braces are swapped for a
   readable values list, so the fallback is data, not glyphs).

   Usage:
     LoktaChart.spark([20,45,60,55,80,95])      -> <span class="dt dt-spark" role="img" …>
     LoktaChart.bars([62,24,14], { label: "region split" })
     LoktaChart.pie(62)
     LoktaChart.auto()   // upgrades <span data-lk-chart="spark">20,45,60</span> */
(function (global) {
  'use strict';

  function clampList(values) {
    return values.map(function (v) {
      return Math.max(0, Math.min(100, Math.round(+v)));
    });
  }
  var MARK = { bars: 'b', spark: 'l', pie: 'p' };

  // ── PURE · the {…} source string ─────────────────────────────────────────
  function source(kind, values) {
    var v = kind === 'pie' ? [clampList([values])[0]] : clampList([].concat(values)).slice(0, 20);
    return '{' + MARK[kind] + ':' + v.join(',') + '}';
  }

  // ── PURE · a spoken label that states the trend, then the values ─────────
  function label(kind, values, name) {
    var lead = name ? name + ': ' : '';
    if (kind === 'pie') {
      var p = clampList([values])[0];
      return lead + 'pie chart, ' + p + ' percent';
    }
    var v = clampList([].concat(values)).slice(0, 20);
    if (kind === 'bars') return lead + 'bar chart: ' + v.join(', ');
    // spark: describe direction from first to last
    var dir = v[v.length - 1] > v[0] ? 'rising' : v[v.length - 1] < v[0] ? 'falling' : 'steady';
    return lead + 'sparkline, ' + dir + ' from ' + v[0] + ' to ' + v[v.length - 1] + ': ' + v.join(', ');
  }

  // ── DOM · build a role="img" Datatype span with source + label paired ────
  function make(kind, values, opts) {
    opts = opts || {};
    var el = document.createElement('span');
    el.className =
      'dt ' +
      (kind === 'bars' ? 'dt-bars' : kind === 'spark' ? 'dt-spark' : 'dt-pie') +
      (opts.className ? ' ' + opts.className : '');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', opts.label || label(kind, values, opts.name));
    el.textContent = source(kind, values);
    if (opts.color) el.style.color = opts.color;
    el.dataset.lkChartValues = (
      kind === 'pie' ? [clampList([values])[0]] : clampList([].concat(values))
    ).join(',');
    el.dataset.lkChartKind = kind;
    return el;
  }
  var bars = function (v, o) {
    return make('bars', v, o);
  };
  var spark = function (v, o) {
    return make('spark', v, o);
  };
  var pie = function (v, o) {
    return make('pie', v, o);
  };

  // ── DOM · no-font fallback. If Datatype is unavailable, swap the braces for
  //         a compact values list so the visible text is data, not syntax. ──
  function applyFallback(root) {
    (root || document).querySelectorAll('.dt[data-lk-chart-values]').forEach(function (el) {
      var vals = el.dataset.lkChartValues.split(',');
      el.classList.add('dt-fallback');
      el.style.fontFamily = 'var(--font-family-mono, monospace)';
      el.textContent = el.dataset.lkChartKind === 'pie' ? vals[0] + '%' : vals.join(' · ');
    });
  }
  function withFontCheck(root) {
    if (!('fonts' in document)) return;
    document.fonts
      .load('16px "Datatype"')
      .then(function () {
        return document.fonts.ready;
      })
      .then(function () {
        if (!document.fonts.check('16px "Datatype"')) applyFallback(root);
      })
      .catch(function () {
        applyFallback(root);
      });
  }

  // ── DOM · upgrade declarative <span data-lk-chart="spark">20,45,60</span> ─
  function auto(root) {
    root = root || document;
    root.querySelectorAll('[data-lk-chart]').forEach(function (host) {
      if (host.dataset.lkChartKind) return; // already built
      var kind = host.getAttribute('data-lk-chart');
      var raw =
        host.getAttribute('data-values') != null ? host.getAttribute('data-values') : host.textContent;
      var values = raw
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number);
      var el = make(kind, kind === 'pie' ? values[0] : values, {
        label: host.getAttribute('data-label') || undefined,
        name: host.getAttribute('data-name') || undefined,
        color: host.getAttribute('data-color') || undefined,
      });
      host.replaceWith(el);
    });
    withFontCheck(root);
  }

  var API = { source: source, label: label, bars: bars, spark: spark, pie: pie, auto: auto };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.LoktaChart = API;
  if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') auto();
    else
      document.addEventListener('DOMContentLoaded', function () {
        auto();
      });
  }
})(typeof window !== 'undefined' ? window : this);
