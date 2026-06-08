# Changelog

All notable changes to Lokta are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/msradam/lokta/releases/tag/v0.1.0
