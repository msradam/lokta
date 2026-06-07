# @lokta/typst

Lokta editorial document themes for [Typst](https://typst.app). The print arm of
the design system: the same cream stock, hatched rules, tracked mono labels, and
right-aligned grotesk titles, as page templates.

## Templates

| Template | What it is |
| --- | --- |
| `lokta-tech` | White technical report. Numbered headings, mono section numbers, hard rules. |
| `lokta-report` | Cream editorial report. The warm counterpart to `lokta-tech`. |
| `lokta-article` | Long-form editorial. Kicker, deck, byline, serif body. |
| `lokta-bulletin` | Single-sheet notice. Mono-forward, marigold header. |
| `lokta-letter` | Correspondence. Sender block, subject, signature. |
| `lokta-cover` | Pigment ground with the vertical 映画の料理 spine. |
| `lokta-recipe` | After the cookbook page: film note, vertical Ingredients label, numbered steps. |
| `lokta-doc` | The cream editorial base the others build on. |

Helpers: `lk-label`, `lk-rule`, `lk-measure`, `lk-endmark`, `lk-note`, `lk-quote`.

## Use

```typ
#import "@local/lokta:0.1.0": *

#show: lokta-tech.with(
  title: "Ingestion Pipeline",
  org: "Folio Analytics",
  doc-id: "FA-2041",
  meta: ("Author": "K. Adeyemi", "Date": "1 April 2026", "Status": "Approved"),
)

= Overview
Your content here.
```

## Install

Typst does not embed package fonts, so the vendored static fonts (Archivo, Spline
Sans Mono, Source Serif 4, Noto Sans JP) ship in `fonts/` and are passed with
`--font-path`.

Local package (imports as `@local/lokta:0.1.0`):

```sh
npm run install:typst      # from the repo root
typst compile --font-path "<printed path>/fonts" your-doc.typ
```

Or import the file directly, no install:

```typ
#import "/path/to/packages/typst/lokta.typ": *
```

```sh
typst compile --font-path /path/to/packages/typst/fonts your-doc.typ
```

## Build the examples

```sh
npm run build:typst        # compiles every example*.typ to packages/typst/dist
```

There is one example per template. `typst compile example.typ` is the canonical
check.

## Diagrams

Pre-render a Mermaid diagram to SVG with `@lokta/mermaid` and place it:

```sh
mmdc -c lokta-mermaid.json -C lokta-mermaid.print.css -i diagram.mmd -o diagram.svg
```

```typ
#figure(image("diagram.svg", width: 90%), caption: [Pipeline stages.])
```

## License

MIT. Fonts are SIL OFL.
