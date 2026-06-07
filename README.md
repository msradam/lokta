# Lokta

Lokta is an editorial design system that treats the screen as a printed page. It
borrows book conventions (running heads, folios, hard rules, hatched end-marks,
tracked mono labels, generous gutters) and applies them to dense interfaces. It
is deliberately flat: layering comes from borders and surface tokens, not
shadows. It is hard-edged: square caps, miter joins, no rounded controls by
default.

It ships the way IBM ships Carbon: design tokens built through a pipeline into
multiple formats, a presentation theme, reusable templates, and a static
documentation site deployed to GitHub Pages.

- **Type:** Archivo (display and body), Spline Sans Mono (labels and figures),
  Source Serif 4 (pull quotes), Noto Sans JP and Anek Bangla (CJK and Bengali).
  All SIL OFL, self-hosted.
- **Color:** warm paper surfaces, warm-tinted ink text, saturated pigment
  grounds. Marigold is the hero.
- **Stocks:** Paper (light, default), Ink (warm dark), Bone (cool light),
  Indigo (cool dark). Every text role clears WCAG 2.2 AA on each.

## Packages

| Package | What it is |
| --- | --- |
| `@lokta/tokens` | Design tokens built to CSS, SCSS, and JS, one file per stock plus a combined `lokta.css`. |
| `@lokta/css` | The component layer, built on the semantic token layer so it themes automatically. |
| `@lokta/marp-theme` | A Marp presentation theme and a sample deck. |

## Install

```
npm install @lokta/tokens @lokta/css
```

For decks:

```
npm install @lokta/marp-theme
```

## Consume a theme

Load a token theme (it defines the semantic variables), then the components, then
set the stock with `data-theme` on the root element. Paper is the default.

```css
/* all four stocks in one file */
@import "@lokta/tokens/css/lokta.css";
@import "@lokta/css/lokta.css";
```

Or load a single stock:

```css
@import "@lokta/tokens/css/lokta.paper.css";
@import "@lokta/css/lokta.css";
```

```html
<html data-theme="ink">
  <body class="lk">
    <button class="lk-btn lk-btn-primary">Action</button>
  </body>
</html>
```

Build UI against the semantic layer (`--text-primary`, `--surface-page`,
`--border-strong`, `--accent-success`, and so on) so theming and accessibility
are inherited. Never consume primitives (`--ink-90`, `--paper-01`) directly in
product UI.

### Brand customisation

Apps may override the brand layer. Everything else (type scale, 8px grid, AA
rules, component structure, hard-edged character) is locked.

| Knob | How | Default |
| --- | --- | --- |
| Accent pigment | `--lk-accent` | marigold |
| Control radius | `--lk-radius` (0 to 3px) | `0px` |
| Density | `data-density="compact"` | comfortable |
| Grain | `data-grain="off"` | on |
| Stock | `data-theme` | paper |

## Build

Requires Node 20 or newer.

```
npm install
npm run build:tokens   # Style Dictionary -> packages/tokens/dist, then verify vs the reference
npm run build:site     # static docs into site/
npm run build:deck     # render the Marp deck to HTML and PDF (needs Chrome/Chromium)
```

`npm run build` runs tokens, css (vendors fonts), and site in order. The token
pipeline reads `tokens/lokta.tokens.json`, splits it into `tokens/sets/`, and
builds per-stock CSS, SCSS, and JS. The split and verify steps:

```
npm run split:tokens   # regenerate tokens/sets/ from the canonical JSON
npm run fonts          # vendor the SIL OFL woff2 files
```

## Fonts

The woff2 files are vendored under each package's `fonts/` directory. The system
does not hot-link the Google Fonts CDN in production: that sends visitor IPs to
Google, a GDPR exposure in the EU. Run `npm run fonts` to re-fetch them.

## Documentation site

The docs site (overview, foundations, components, tokens reference, theme
switcher, embedded deck) builds into `site/` and deploys to GitHub Pages via
`.github/workflows/build-and-deploy.yml`. To publish: in the repository settings,
enable Pages with Source set to GitHub Actions, then push to `main`. The live URL
is shown in the workflow's deploy step and in Settings, Pages.

## Token architecture

1. **Primitives.** Raw values (`paper.01`, `ink.80`, `pigment.marigold`). Never
   consumed directly in product UI.
2. **Semantic.** Role aliases (`text.primary`, `surface.page`, `border.strong`,
   `accent.success`, `field.bg`, `focus.ring`).
3. **Stocks.** Each stock re-points the semantic layer, so theming and AA are
   inherited by anything built on the semantic tokens.

## Credits

Lokta is drawn from the Studio Ghibli cookbook *Cuisine on Screen* (Prestel) and
Professor Siddika Kabir's *Ranna Khaddo Pushti*, as design inspiration, not
reproduction. No artwork or text from either book is included in this repository.

## License

MIT for the code and tokens. The bundled fonts are SIL OFL 1.1. See `LICENSE`.
