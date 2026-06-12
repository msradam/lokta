# @lokta/css

Component CSS for the Lokta design system. Built on the semantic token layer, so
the components theme automatically and inherit WCAG 2.2 AA across all four
stocks. Flat, hard-edged, editorial: no shadows except the modal's single hard
offset, and no rounded corners on controls by default.

## Install

```
npm install @lokta/tokens @lokta/css
```

## Use

Load a token theme first (it defines the semantic variables), then this package.

```css
@import '@lokta/tokens/css/lokta.css'; /* all four themes */
@import '@lokta/css/lokta.css'; /* fonts + base + components */
```

Set the stock on the root element. Paper is the default.

```html
<html data-theme="ink">
  ...
</html>
```

`lokta.css` pulls in the layer files you can also load individually:

- `fonts.css`. Self-hosted `@font-face` rules (Archivo, Spline Sans Mono, Source
  Serif 4, Noto Sans JP, Anek Bangla, Mukta, Martel, Datatype). The woff2 files
  live in `fonts/`.
- `lokta-base.css`. Non-token design constants (easing, durations, type styles,
  interaction state), the brand customisation layer, and forced-colors support.
- `lokta-components.css`. The `.lk-*` classes.
- `lokta-utilities.css`. Layout, the display type scale, the data-viz helpers,
  and the Datatype `.dt` utilities.
- `lokta-motion.css`. The five flat motion primitives and the reduced-motion
  floor.

Two small runtimes ship beside the CSS as opt-in `<script>` includes:

- `lokta-behaviors.js`. The ARIA + keyboard wiring for tabs, accordion, dialog,
  menu, tooltip.
- `lokta-motion.js`. The motion runtime: `write()`/`draw()`, the scroll-in
  auto-runner, the persisted reduce-motion toggle, and `stream()`.
- `lokta-chart.js`. The Datatype helper.

## Motion

A flat, accessibility-first reveal vocabulary. Reduced motion is the floor: every
screen is complete with zero motion, and the primitives layer on top. Five
primitives (`lk-rule-in`, `lk-set-in`, `lk-leaf`, `lk-stamp`, and write-in via
`[data-lk-write]`), each flat by construction: no opacity fade, no blur, no
scale-bloom. Tier 1 keeps a static equivalent under reduced motion; Tier 2 is
removed entirely. `[data-lk-anim]` elements auto-run on scroll-in, motion-safe
only; `LoktaMotion.toggleMotion()` flips a persisted `data-lk-motion` switch.

For a live response, ship a chunked delivery pattern, not a per-character
typewriter: the visual layer is `aria-hidden`, and the complete message is
announced once via a polite `role="log"` region.

```js
const s = LoktaMotion.stream({ body, log, status });
for await (const chunk of response) s.push(chunk);
s.done(fullText); // announces the complete message once
```

## Datatype

Datatype (SIL OFL, Frank Tisellano) is a variable data font: ligature
substitution renders `{b:…}` bars, `{l:…}` sparklines, and `{p:…}` pie as inline
charts, no SVG and no script. A chart made of text is still text, so every `.dt`
is `role="img"` with an `aria-label` that states the trend in words.
`lokta-chart.js` emits the source and the label together so they cannot drift.

```js
const el = LoktaChart.spark([20, 45, 60, 55, 80, 95], { name: 'weekly actives' });
// <span class="dt dt-spark" role="img" aria-label="weekly actives: sparkline, rising …">{l:…}</span>
```

## Fonts

The woff2 files are vendored in `fonts/` (SIL OFL). Do not hot-link the Google
Fonts CDN in production: it sends visitor IPs to Google, a GDPR exposure in the
EU. To re-fetch the files, run `npm run fonts` from the repo root.

## Brand customisation

Apps may override the brand layer. Everything else (type scale, 8px grid, AA
rules, component structure, hard-edged character) is locked.

| Knob           | How                                           | Default     |
| -------------- | --------------------------------------------- | ----------- |
| Accent pigment | `--lk-accent`                                 | marigold    |
| Control radius | `--lk-radius` (0 to 3px)                      | `0px`       |
| Density        | `data-density="compact"`                      | comfortable |
| Grain          | `data-grain="off"`                            | on          |
| Stock          | `data-theme="paper \| ink \| bone \| indigo"` | paper       |

## License

MIT. Fonts are SIL OFL.
