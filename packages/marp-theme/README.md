# @lokta/marp-theme

The Lokta presentation theme for [Marp](https://marp.app), with a sample deck.
Editorial slides: tracked mono labels, hatched end-marks, hard rules, and the
house pigment grounds.

## Use

In a deck's front matter, point Marp at the theme:

```markdown
---
marp: true
theme: lokta
---
```

When rendering with the CLI, pass the theme file and keep the `fonts/` directory
beside the output (font URLs resolve relative to the rendered HTML):

```
marp deck.md --theme lokta.marp.css -o deck.html
```

### Slide classes

Set a class on a slide with `<!-- _class: NAME -->`.

| Class | Effect |
| --- | --- |
| `lead` | Cover slide. Centered, oversized headline. |
| `invert` | Ink dark stock. |
| `marigold` | Marigold feature ground (dark text). |
| `peach` | Peach heritage ground (dark text). |

Inline helpers: a backtick `LABEL` on its own line renders as a tracked eyebrow.
`---` becomes the hatched end-mark divider. `>` blockquotes set in Source Serif.

## Build

From the repo root:

```
npm run fonts            # vendor the woff2 files into fonts/
npm run build:deck       # renders deck.html and lokta-deck.pdf
```

PDF rendering needs a Chromium or Chrome install (Marp drives it under the hood).

## Fonts

Self-hosted in `fonts/` (SIL OFL): Archivo, Spline Sans Mono, Source Serif 4,
Noto Sans JP. The theme does not hot-link the Google Fonts CDN, which would send
viewer IPs to Google (a GDPR exposure in the EU).

## License

MIT. Fonts are SIL OFL.
