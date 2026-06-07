# Changelog

All notable changes to Lokta are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-07

### Added

- An editorial UI system after the page layout of *Cuisine on Screen* by Sachiyo
  Harada (Prestel, 2024), with a heritage thread from Professor Siddika Kabir's
  *Ranna Khaddo Pushti*.
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

[Unreleased]: https://example.com/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/releases/tag/v0.1.0
