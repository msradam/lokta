# Changelog

All notable changes to Lokta are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A flat, accessibility-first motion layer in `@lokta/css` where reduced motion
  is the floor. Five primitives in `lokta-motion.css` (rule-in, set-in,
  leaf-turn, stamp, write-in), each flat by construction (no opacity fade, no
  blur, no scale-bloom). The runtime (`lokta-motion.js`, beside
  `lokta-behaviors.js`) carries `write()`/`draw()`, a scroll-in auto-runner, a
  persisted reduce-motion toggle (localStorage), and `stream()`, the chunked
  live-response pattern (a polite `role="log"` announces the complete message
  once; the visual layer is `aria-hidden`), not a per-character typewriter.
  Tokens in `tokens/sets/motion.json`.
- Datatype, a variable OpenType data font (SIL OFL, Frank Tisellano),
  self-hosted in `@lokta/css`. Ligature substitution renders `{b:…}` bars,
  `{l:…}` sparklines, and `{p:…}` pie as inline charts. The `.dt`/`.dt-bars`/
  `.dt-spark`/`.dt-pie` utilities, the `@font-face` in `fonts.css`, the family
  token in `tokens/sets/type.json`, and `lokta-chart.js` (emits the `{…}` source
  and the `aria-label` together so they cannot drift, with a no-font values
  fallback).
- Kolam: deterministic woven line ornaments in `@lokta/css`. `lokta-kolam.js`
  generates a sikku kolam (a continuous line woven around a grid of pulli, the
  alpana tradition) as pure SVG, so it renders the same in web, Marp, and Typst
  PDF and themes through `currentColor`. The `.dt`-style `.lk-kolam` utilities
  bind stroke weight to the rule scale (a per-instance parameter, not a dial);
  `[data-lk-draw]` lets the line write itself in via `draw()`. Tile rules:
  weave, plain, rows, cols. `validate/kolam.mjs` pins the geometry to a golden
  (same spec, same bytes) and the `role="img"` + label contract.
- Line-art tracing (`lk-trace`): `scripts/build-trace.mjs` (a headless
  Playwright trace through the vendored imagetracerjs, MIT) bakes a photo into a
  vector line drawing whose contours stroke in `currentColor`, so it themes with
  the stock and prints in Typst, the cookbook's outline idiom rather than tone.
  A deliberate treatment, not a mandate. `validate/trace.mjs` checks the
  committed asset's `role="img"` + label, currentColor strokes, viewBox, and a
  recorded source licence. A line-and-flat-region source (a woodblock print)
  traces far cleaner than a painterly one; the example is CC0 (Hiroshige, *Blue
  Bird and Hibiscus*, the Met Open Access).
- Recipe notation (`lokta-recipe.js` + `.lk-frac`/`.lk-figures`/`.lk-qty`):
  quantities set the way a cookbook does. The wrapper scopes the OpenType `frac`
  feature to each bare `N/M` so true fractions render without superscripting the
  whole number or mangling parentheticals, and quantity columns align in tabular
  figures. No new font. `validate/recipe.mjs` pins the scoping contract.
- A Motion & data section in the components reference and the docs site: the
  five primitives, the streaming-response area, write-in, inline charts,
  stat-block sparklines, the kolam ornaments, the traced line art, and the
  recipe notation.
- `validate/motion.mjs`: a deterministic gate for the motion flatness contract
  (no opacity/blur/scale-bloom, no looping, the reduced-motion floor and kill
  switch present, durations bounded), the self-hosted Datatype `@font-face`, and
  the `role="img"` + non-empty `aria-label` contract on every `.dt`. The
  Playwright suite gains the reduced-motion final-state, streaming announcement,
  toggle-persistence, and Datatype-naming checks, with the axe loop now covering
  the new section across every stock.

## [0.2.0] - 2026-06-08

### Added

- A layout + display-type utility layer (`lokta-utilities.css`): `lk-wrap`,
  `lk-grid`/`lk-cols-*`, `lk-stack`/`lk-cluster`/`lk-between`, section spacing,
  and a display scale (`lk-display`, `lk-h1..h3`, `lk-eyebrow`, `lk-lede`).
- Components from dogfooding: `lk-switch` (toggle), `lk-badge`, `lk-btn-icon`,
  `lk-btn-xl`, form states (`aria-invalid` styling, `lk-help`, `lk-error-text`,
  `lk-ok-text`, `lk-req`), and `lk-modal-body`.
- App-shell and dashboard components: `lk-shell`/`lk-sidebar`/`lk-topbar`/
  `lk-content`, sidebar `lk-nav`/`lk-nav-item`, `lk-stat` (KPI card with
  `lk-stat-up`/`-down` deltas), `lk-avatar`, `lk-segment` (segmented control),
  `lk-toast`, `lk-empty`, and `lk-skeleton`.
- Form grouping: `lk-fieldset`/`legend`, `lk-field`, `lk-input-group` with
  `lk-input-addon`, and `lk-char-count`.
- Marketing kit: `lk-feature`, `lk-plan` (with `lk-plan-featured`), `lk-quote`,
  `lk-cta`, `lk-logos`, the `lk-on-pigment`/`-dark` section mode that recolors
  furniture and buttons for a pigment ground, and `lk-link`.
- A categorical data-viz palette (`--viz-1..8`) drawn from the pigments, with a
  legend, horizontal bar list, and sparkline styling; a `lk-file` upload control
  and an `lk-field:focus-within` label affordance.
- Marp deck layouts: `columns`, `divider`, and `stat` slide classes plus a
  `source` line (image splits use Marp's native `bg` directive).
- Typst helpers in `lokta.typ`: `lk-table(headers, rows)` (mono header over an
  accent rule, hairline rows, zebra), `lk-tip`/`lk-warning` callouts, `lk-caption`
  wired as the `figure.caption` style, outline/TOC and footnote styling, and
  `lk-revisions`/`lk-references` helpers, in `lokta-tech` and `lokta-report`.
- Example artifacts built only from Lokta classes, linked from the docs site and
  audited by the axe-core gate (`validate/templates.spec.mjs`) across the paper,
  ink, and indigo stocks: a dashboard and a landing template, an interactive
  cookbook demo (search, filters, recipe dialog, save-to-list), and a patterns
  gallery cataloguing the application-tier components.
- An Install section on the docs site (npm, standalone repos, no-build drop-in),
  a mobile responsiveness pass, and a Figma publish guide (`docs/figma/PUBLISH.md`).
- From dogfooding: `lk-panel`, a card framed on the page surface for a raised
  content canvas (replaces the dashboard's page-local `.dash-card`); and
  `lk-stat-flat`, a neutral KPI delta with its own glyph.
- The Figma Variables manifest now carries all fourteen stocks as Semantic modes,
  not just the four token-built themes (`build:figma` reads `lokta-stocks.css`).
- Data surfaces, held to deterministic standards. Charts: a retuned `--viz`
  categorical palette (light and dark) that clears WCAG 1.4.11 (3:1 vs surface
  and adjacent) and stays CVD-distinguishable, a perceptually uniform sequential
  scale, a diverging scale, and pattern fills, gated by `validate/viz.mjs`. Code:
  a 10-role syntax theme (`packages/code`, a `.tmTheme` plus Prism and
  highlight.js CSS), AA per token on every stock with a greyscale cue, gated by
  `validate/code-aa.mjs`. Tables: a captioned, scoped data table and an
  interactive ARIA grid (roving tabindex, arrow keys). Documents: tagged PDF/UA-1
  output from the Typst templates. Plus an APCA advisory beside the WCAG numbers
  in `verify` (never blocking).
- Manuscript-fusion / namesake: two stocks, Manuscript (warm aged-lokta ivory)
  and Highland (stone-cool dark), each clearing the full role x surface AA matrix
  (verify is now 234 checks); the heritage pigment palette (Pala dye tones
  madder, walnut, turmeric, lac, malachite, conch, the afsani gilt, with light
  variants) as Accent dial options; first-class Devanagari (Mukta display/body,
  Martel serif, self-hosted SIL OFL) beside Bengali, with the Voice dial and
  `:lang()` script switching across web, Marp, and Typst; the trilingual
  `lk-wordmark` (लोक्ता · Lokta · লোক্তা); opt-in material motifs (`lk-deckle-r`/`-b`
  deckle edge, `lk-pothi` palm-leaf format) and a `fibrous` grain step; and the
  six-dial customization model (`CUSTOMIZATION.md` plus a docs page). All
  additive: no existing token value changed.

### Fixed

- The site `lokta.css` drop-in now imports the tokens, so a single link is
  batteries-included (the empty-variables footgun).
- `a.lk-btn` no longer inherits the link underline.
- The components reference uses the canonical modal classes
  (`lk-modal-backdrop`/`-head`/`-foot`), so copied markup styles correctly.
- Marp: a lone backtick label renders as a tracked eyebrow, not a code chip.
- Typst: `lokta-hitec` `lk-note` printed the literal word "body" and dropped its
  content; the cover title justified and its footnote overprinted the rule; the
  fallback font arrays spewed warnings. All fixed. `lokta-tech`/`lokta-report`
  headings no longer crash on an unnumbered heading (e.g. a TOC title).
- `lk-segment` and `lk-cta` paired `surface-inverse` with `text-on-fill`, which
  collide on the dark stocks (both resolve light); they now use the
  `text-primary` over `surface-raised` pairing, which holds in every stock.
- `lk-stat` sits on the page surface, where accent deltas are AA-tuned; the
  raised surface dipped below 4.5 on the dark stocks and the sunken surface on
  the light ones.

## [0.1.0] - 2026-06-08

### Added

- A self-hosted icon set: sharpened Tabler glyphs vendored as an SVG sprite
  (`packages/css/icons/lokta-icons.svg`) plus `lokta-icons.css`, built by
  `npm run build:icons`. The system no longer needs a runtime icon CDN.
- The interactive components (tabs, accordion, dialog, menu) are live on the
  docs site, wired by `lokta-behaviors.js`.
- The full validation suite as the merge gate: `verify` (token math), `lint:rules`
  (design-rule lint), `test:components` (Playwright + axe across stocks), and
  `test:visual` (visual regression in a pinned Linux image), plus `validate`.
- A Figma Variables manifest (`build:figma`) that self-verifies on build, and a
  Figma listing kit (1920x1080 media, copy, Code Connect config).
- Type definitions for `@lokta/css` behaviors and `@lokta/mermaid`, and
  `size-limit` budgets. Prettier and Stylelint configs.
- `scripts/verify.mjs`, wired as `npm run verify` and `test` and as the first CI
  gate. A pure-Node check of WCAG AA contrast (every text role on every surface
  in every stock), cross-surface parity (the Typst and Mermaid literals equal
  their primitive), and the 8px grid.
- A deterministic verification dashboard at `proof/lokta-verification.html`,
  linked from the docs site.
- Extra stocks beyond the four token stocks: pine, mulberry, and the enterprise
  set slate, steel, onyx with light variants, shipped in
  `packages/css/lokta-stocks.css` and offered in the docs theme switcher.

### Changed

- AA retune: `ink.50` is now `#615A4C`, and the Indigo stock's muted text and
  field placeholder are `#9BA3B4`. Propagated to the built CSS, the Typst and
  Marp literals, and the reference.
- Fixed a cross-surface drift: the Mermaid secondary and `muted` class are now
  `#EAE6D2` (paper-02), matching the parity gate.

### Added (foundations)

- An editorial UI system after the page layout of _Cuisine on Screen_ by Sachiyo
  Harada (Prestel, 2024), with a heritage thread from Professor Siddika Kabir's
  _Ranna Khaddo Pushti_.
- Three-tier design tokens (primitives, semantic, stocks) in Tokens Studio
  (DTCG) format, with four stocks: Paper (light), Ink (warm dark), Bone (cool
  light), and Indigo (cool dark). Every text role clears WCAG 2.2 AA on its
  surface in every stock.
- `@lokta/tokens`: a Style Dictionary v4 pipeline (`@tokens-studio/sd-transforms`)
  that builds per-theme CSS, SCSS, and JS, plus a combined `lokta.css`.
- `@lokta/css`: the component layer (buttons, tags, inputs, checkbox and radio,
  tabs, accordion, inline notifications, breadcrumb, pagination, progress,
  slider, tooltip, code, data table, modal, editorial marks, page furniture)
  built on the semantic layer, with a brand customisation layer (accent,
  density, radius, grain, stock) and forced-colors support.
- Self-hosted fonts (SIL OFL): Archivo, Spline Sans Mono, Source Serif 4,
  Noto Sans JP, Anek Bangla.
- `@lokta/marp-theme`: a Marp presentation theme and a sample deck, with Mermaid
  styling and a `marp.config.mjs` for live diagram fences.
- `@lokta/typst`: editorial document themes for Typst (technical report, editorial
  report, article, bulletin, letter, cover, recipe), with vendored static fonts.
- `@lokta/mermaid`: a Mermaid diagram theme for the web (an ESM that initializes
  Mermaid and injects the hard-edge CSS) and for print and Typst (an SVG path via
  mermaid-cli).
- A static documentation site with a four-stock theme switcher and a tokens
  reference generated from the JSON.
- A GitHub Pages workflow that builds the tokens, renders the deck, builds the
  site, and deploys.

[0.2.0]: https://github.com/msradam/lokta/releases/tag/v0.2.0
[0.1.0]: https://github.com/msradam/lokta/releases/tag/v0.1.0
