# @lokta/motion

Flat, accessibility-first motion for the Lokta system. Reduced motion is the floor, not an afterthought: every screen is complete and usable with zero motion, and the primitives layer on top.

The CSS primitives live in `@lokta/css/lokta-motion.css`. This package is the small runtime that drives them.

## Install

```
npm install github:msradam/lokta-motion
```

```html
<link rel="stylesheet" href="@lokta/css/lokta-motion.css" />
<script src="@lokta/motion/lokta-motion.js" defer></script>
```

## Primitives

| Primitive   | Tier | Trigger                              | Use                                                   |
| ----------- | ---- | ------------------------------------ | ----------------------------------------------------- |
| `rule-in`   | 1    | `.lk-rule-in` + `[data-lk-anim]`     | lines, dividers, the end-mark, drawn via `scaleX`     |
| `set-in`    | 1    | `.lk-set-in` + `[data-lk-anim]`      | a keyline frame rules in, then content is set at once |
| `leaf-turn` | 2    | `.lk-leaf` + `[data-lk-anim="turn"]` | a flat clip wipe with a hatched leading edge          |
| `stamp`     | 1    | `.lk-stamp` + `[data-lk-anim]`       | a stepped confirmation fill, never a spinning blur    |
| `write-in`  | 2    | `[data-lk-write]` (calls `write()`)  | text drawn unit by unit                               |

Tier 1 keeps a static equivalent under reduced motion. Tier 2 is removed entirely. Elements with `[data-lk-anim]`, `[data-lk-write]`, or `[data-lk-draw]` are auto-run on scroll-in, motion-safe only.

## API

```js
LoktaMotion.write(el, { cps: 90, mode: 'char', caret: true });
LoktaMotion.draw(svg, { duration: 900, stagger: 120 });
LoktaMotion.toggleMotion(); // persisted in localStorage
LoktaMotion.reduced(); // true if reduced motion is in effect
```

### Streaming a live response

Ship a chunked delivery pattern, not a per-character typewriter. The animating layer is `aria-hidden`; the complete message is announced once via a polite `role="log"` region that exists on load and starts empty.

```html
<div class="lk-stream">
  <p class="lk-stream-status" data-stream-status></p>
  <div class="lk-stream-body" data-stream-body></div>
  <div role="log" aria-live="polite" aria-atomic="false" class="lk-sr-only" data-stream-log></div>
  <button class="lk-btn" data-stream-stop>Stop generating</button>
</div>
```

```js
const s = LoktaMotion.stream({
  body: el.querySelector('[data-stream-body]'),
  log: el.querySelector('[data-stream-log]'),
  status: el.querySelector('[data-stream-status]'),
});
for await (const chunk of response) s.push(chunk);
s.done(fullText); // announces the complete message once
el.querySelector('[data-stream-stop]').onclick = s.stop;
```

## The toggle

`LoktaMotion.toggleMotion()` flips `data-lk-motion` on `<html>` and persists it. Any element with `[data-lk-motion-toggle]` is wired automatically and gets `aria-pressed` reflecting the reduced state. The OS `prefers-reduced-motion: reduce` is always honoured on top of the toggle.

## Accessibility contract

The full text is always in the DOM. A reveal is visual masking only, so assistive tech reads the complete content immediately. Under reduced motion the final state shows at once. Any key or click completes a running reveal (WCAG 2.2.2). Nothing loops; nothing flashes more than three times a second (WCAG 2.3.1).
