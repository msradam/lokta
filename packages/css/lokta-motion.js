/* Lokta motion runtime (part of @lokta/css, beside lokta-behaviors.js). The
   flat, accessibility-first reveal system in the manuscript idiom. Five
   primitives drive the CSS in lokta-motion.css:

     rule-in   lines/dividers/the end-mark drawn via scaleX     (CSS, .lk-rule-in)
     set-in    a keyline frame rules in, content set at once    (CSS, .lk-set-in)
     leaf-turn flat clip wipe with a hatched leading edge        (CSS, .lk-leaf)
     stamp     stepped confirmation fill                         (CSS, .lk-stamp)
     write-in  text drawn unit by unit                           (this file, write())

   This module adds: the persisted in-page toggle (localStorage), an auto-runner
   that triggers the CSS primitives on scroll-in (motion-safe only), write() for
   inline text, draw() for self-drawing SVG strokes, and stream() for the live
   chunked-response pattern.

   Accessibility contract (non-negotiable):
   - The real text is ALWAYS in the DOM / a11y tree. A reveal is visual masking
     only, so assistive tech reads the full content immediately, animation or not.
   - prefers-reduced-motion: reduce -> no motion, final state shown at once.
   - A global kill switch: <html data-lk-motion="off"> disables everything, and
     it persists across reloads (localStorage).
   - Any key or a click completes a running reveal instantly (WCAG 2.2.2).
   - Nothing essential loops; nothing flashes more than three times a second. */
(function (global) {
  'use strict';

  var KEY = 'lokta-motion';
  var REDUCE_MQ = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');

  // Apply a persisted "off" before first paint so the static floor is what loads.
  try {
    if (typeof document !== 'undefined' && localStorage.getItem(KEY) === 'off')
      document.documentElement.setAttribute('data-lk-motion', 'off');
  } catch (e) {}

  function motionOff() {
    return (
      (REDUCE_MQ && REDUCE_MQ.matches) || document.documentElement.getAttribute('data-lk-motion') === 'off'
    );
  }

  // ── TOGGLE · persisted in-page motion switch ─────────────────────────────
  function setMotion(on) {
    var next = on ? 'on' : 'off';
    document.documentElement.setAttribute('data-lk-motion', next);
    try {
      localStorage.setItem(KEY, next);
    } catch (e) {}
    document.querySelectorAll('[data-lk-motion-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(!on)); // pressed = motion reduced
    });
    return on;
  }
  function toggleMotion() {
    return setMotion(document.documentElement.getAttribute('data-lk-motion') === 'off');
  }

  // ── WRITE · stream text in, character or word at a time ──────────────────
  // opts: { cps (chars/sec, default 90), mode "char"|"word", caret (bool),
  //         delay (ms before start), ondone }
  function write(el, opts) {
    opts = opts || {};
    var cps = +opts.cps || +el.getAttribute('data-cps') || 90;
    var mode = opts.mode || el.getAttribute('data-mode') || 'char';
    var caret = opts.caret !== false && el.getAttribute('data-caret') !== 'false';
    var text = el.getAttribute('data-text') != null ? el.getAttribute('data-text') : el.textContent;

    // Tokenize into spans but keep the full text as the accessible label.
    el.setAttribute('aria-label', text);
    var frag = document.createDocumentFragment();
    var units = mode === 'word' ? text.split(/(\s+)/) : Array.from(text);
    var spans = [];
    units.forEach(function (u) {
      if (u === '') return;
      var s = document.createElement('span');
      s.className = 'lk-ink-unit';
      s.textContent = u;
      s.setAttribute('aria-hidden', 'true'); // aria-label on parent carries the real text
      frag.appendChild(s);
      spans.push(s);
    });
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('lk-ink');
    if (caret) el.classList.add('lk-ink-caret');

    function finish() {
      spans.forEach(function (s) {
        s.classList.add('on');
      });
      el.classList.remove('lk-ink-caret', 'lk-ink-running');
      el.classList.add('lk-ink-done');
      if (opts.ondone) opts.ondone();
    }

    if (motionOff()) {
      finish();
      return { finish: finish };
    }

    el.classList.add('lk-ink-running');
    var i = 0,
      perUnit = mode === 'word' ? 1000 / (cps / 5) : 1000 / cps;
    var start = null,
      done = false;
    function step(ts) {
      if (done) return;
      if (start === null) start = ts;
      var target = Math.floor((ts - start) / perUnit);
      while (i <= target && i < spans.length) {
        spans[i].classList.add('on');
        i++;
      }
      if (i >= spans.length) {
        done = true;
        finish();
        return;
      }
      requestAnimationFrame(step);
    }
    var t = setTimeout(function () {
      requestAnimationFrame(step);
    }, +opts.delay || 0);

    function skip() {
      if (done) return;
      done = true;
      clearTimeout(t);
      finish();
    }
    el._lkSkip = skip;
    return { finish: skip };
  }

  // ── DRAW · self-draw SVG strokes (calligraphy / pencil sketch) ───────────
  // Animates stroke-dashoffset from path length to 0. opts: { duration (ms,
  // default 900), stagger (ms between paths, default 120), ondone }
  function draw(svg, opts) {
    opts = opts || {};
    var dur = +opts.duration || +svg.getAttribute('data-duration') || 900;
    var stagger = opts.stagger != null ? +opts.stagger : +svg.getAttribute('data-stagger') || 120;
    var paths = Array.prototype.slice.call(
      svg.querySelectorAll('path, line, polyline, circle, rect, ellipse'),
    );

    var lens = paths.map(function (p) {
      var len = (p.getTotalLength ? p.getTotalLength() : 0) || 0;
      if (!len) {
        var bb = p.getBBox();
        len = 2 * (bb.width + bb.height);
      }
      return len;
    });

    function setFinal() {
      paths.forEach(function (p) {
        p.style.transition = 'none';
        p.style.strokeDasharray = 'none';
        p.style.strokeDashoffset = '0';
        p.style.opacity = '';
      });
      svg.classList.add('lk-draw-done');
      if (opts.ondone) opts.ondone();
    }
    paths.forEach(function (p, n) {
      p.style.strokeDasharray = lens[n] + ' ' + lens[n];
      p.style.strokeDashoffset = lens[n];
    });
    if (motionOff()) {
      setFinal();
      return { finish: setFinal };
    }

    var totalDone = 0,
      skipped = false;
    paths.forEach(function (p, n) {
      var d = setTimeout(function () {
        p.style.transition = 'stroke-dashoffset ' + dur + 'ms cubic-bezier(0.25,0.1,0.25,1)';
        // force reflow so the transition takes
        void p.getBoundingClientRect();
        p.style.strokeDashoffset = '0';
        var end = setTimeout(function () {
          if (++totalDone >= paths.length) setFinal();
        }, dur);
        p._lkEnd = end;
      }, n * stagger);
      p._lkDelay = d;
    });
    function skip() {
      if (skipped) return;
      skipped = true;
      paths.forEach(function (p) {
        clearTimeout(p._lkDelay);
        clearTimeout(p._lkEnd);
      });
      setFinal();
    }
    svg._lkSkip = skip;
    return { finish: skip };
  }

  // ── PRIMITIVE · trigger a CSS primitive (rule-in/set-in/stamp/chart wipe) ─
  // Adds .lk-run; for a leaf-turn (data-lk-anim="turn") adds .lk-turning. The
  // forwards fill holds the final geometry, so skip is just "let it finish".
  function runPrimitive(el) {
    if (motionOff()) return;
    var kind = el.getAttribute('data-lk-anim');
    var cls = kind === 'turn' ? 'lk-turning' : 'lk-run';
    el.classList.remove(cls);
    void el.offsetWidth; // restart
    el.classList.add(cls);
  }

  // ── STREAM · the live chunked-response pattern (NOT a typewriter) ─────────
  // Renders chunks into a visible body as they arrive; announces the COMPLETE
  // message once via a polite role="log" region that exists on load and starts
  // empty. opts: { body (el), log (el, role=log), status (el), onstop }.
  // Returns { push(chunk), done(fullText), stop() }.
  function stream(opts) {
    opts = opts || {};
    var body = opts.body,
      log = opts.log,
      status = opts.status;
    if (status) status.textContent = opts.generatingLabel || 'Generating…';
    var stopped = false;
    return {
      push: function (chunk) {
        if (stopped || !body) return;
        var block = document.createElement('div');
        block.textContent = chunk; // stable block, no per-character reflow
        body.appendChild(block);
      },
      done: function (fullText) {
        if (status) status.textContent = '';
        // Announce the complete message once, politely, when the reader is idle.
        if (log) log.textContent = fullText != null ? fullText : body ? body.textContent : '';
      },
      stop: function () {
        stopped = true;
        if (status) status.textContent = opts.stoppedLabel || 'Stopped';
        if (opts.onstop) opts.onstop();
      },
    };
  }

  // ── AUTO-INIT ────────────────────────────────────────────────────────────
  function auto() {
    // Wire any persisted-toggle buttons.
    setMotion(document.documentElement.getAttribute('data-lk-motion') !== 'off');
    document.querySelectorAll('[data-lk-motion-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        toggleMotion();
        runAllVisible();
      });
    });

    var writeEls = document.querySelectorAll('[data-lk-write]');
    var drawEls = document.querySelectorAll('[data-lk-draw]');
    var animEls = document.querySelectorAll('[data-lk-anim]');

    function runAllVisible() {
      if (motionOff()) return;
      animEls.forEach(function (el) {
        runPrimitive(el);
      });
    }

    if (!('IntersectionObserver' in global)) {
      writeEls.forEach(function (el) {
        write(el);
      });
      drawEls.forEach(function (el) {
        draw(el);
      });
      animEls.forEach(function (el) {
        runPrimitive(el);
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          if (e.target.hasAttribute('data-lk-write')) write(e.target);
          else if (e.target.hasAttribute('data-lk-draw')) draw(e.target);
          else runPrimitive(e.target);
        });
      },
      { threshold: 0.25 },
    );
    writeEls.forEach(function (el) {
      io.observe(el);
    });
    drawEls.forEach(function (el) {
      io.observe(el);
    });
    animEls.forEach(function (el) {
      io.observe(el);
    });

    // Skip-to-end: any key or click completes whatever is mid-reveal.
    function skipAll() {
      document.querySelectorAll('.lk-ink-running').forEach(function (el) {
        if (el._lkSkip) el._lkSkip();
      });
      document.querySelectorAll('[data-lk-draw]:not(.lk-draw-done)').forEach(function (el) {
        if (el._lkSkip) el._lkSkip();
      });
    }
    document.addEventListener(
      'keydown',
      function (e) {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') skipAll();
      },
      true,
    );
    document.addEventListener('click', skipAll, true);
    // expose for the toggle handler above
    auto._runAllVisible = runAllVisible;
  }
  // hoist runAllVisible reference used in the toggle wiring
  function runAllVisible() {
    if (auto._runAllVisible) auto._runAllVisible();
  }

  var API = {
    write: write,
    draw: draw,
    stream: stream,
    runPrimitive: runPrimitive,
    setMotion: setMotion,
    toggleMotion: toggleMotion,
    reduced: motionOff,
    auto: auto,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.LoktaMotion = API;
  if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') auto();
    else document.addEventListener('DOMContentLoaded', auto);
  }
})(typeof window !== 'undefined' ? window : this);
