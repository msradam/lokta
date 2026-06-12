/* Lokta recipe notation (part of @lokta/css). Quantities set the way a cookbook
   does. The OpenType `frac` feature renders "1/2" as a true fraction, but applied
   to a whole line it superscripts whole numbers ("2 1/2" -> "2/1 over 2") and
   mangles parentheticals ("(320 ml)" -> superscript). So frac must be scoped to
   the fraction substring only.

   frac() is pure (no DOM): it wraps each bare N/M fraction in a
   <span class="lk-frac"> and escapes the rest, so the source ("2 1/2 cups
   (320 ml)") and the set output cannot drift. auto() applies it across the text
   of any .lk-recipe element, leaving whole numbers and parentheticals untouched.
   Pair with .lk-figures / .lk-qty for tabular, lining figures in quantity columns. */
(function (global) {
  'use strict';

  // A bare fraction: 1-2 digits / 1-2 digits, not glued to another digit or slash
  // (so "11/2" matches as eleven-halves, but "1/2" inside it is not double-wrapped,
  // and dates/paths like "1/2/3" or "km/h" do not trip it).
  var FRAC_G = /(?<![\d/])(\d{1,2})\/(\d{1,2})(?![\d/])/g;
  var FRAC_T = /(?<![\d/])\d{1,2}\/\d{1,2}(?![\d/])/;

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── PURE · wrap bare fractions, escape everything else ───────────────────
  function frac(text) {
    var out = '',
      last = 0,
      m;
    FRAC_G.lastIndex = 0;
    while ((m = FRAC_G.exec(text))) {
      out += esc(text.slice(last, m.index));
      out += '<span class="lk-frac">' + m[1] + '/' + m[2] + '</span>';
      last = m.index + m[0].length;
    }
    out += esc(text.slice(last));
    return out;
  }

  // ── DOM · set fractions across every .lk-recipe ──────────────────────────
  function auto(root) {
    root = root || document;
    root.querySelectorAll('.lk-recipe').forEach(function (scope) {
      if (scope.dataset.lkRecipeDone) return;
      var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
      var targets = [],
        n;
      while ((n = walker.nextNode()))
        if (FRAC_T.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest('.lk-frac')))
          targets.push(n);
      targets.forEach(function (node) {
        var tpl = document.createElement('template');
        tpl.innerHTML = frac(node.nodeValue);
        node.replaceWith(tpl.content);
      });
      scope.dataset.lkRecipeDone = '1';
    });
  }

  var API = { frac: frac, auto: auto };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.LoktaRecipe = API;
  if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') auto();
    else
      document.addEventListener('DOMContentLoaded', function () {
        auto();
      });
  }
})(typeof window !== 'undefined' ? window : this);
