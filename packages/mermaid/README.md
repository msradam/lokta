# @lokta/mermaid

The Lokta theme for [Mermaid](https://mermaid.js.org) diagrams. Square nodes,
1.5px ink strokes, straight edges, Archivo node labels, Spline Sans Mono edge
labels, and a set of reusable node classes (hero, store, dec, danger, muted).

Two ways to use it: live in the browser, or pre-rendered to SVG for print and
Typst.

## Web

Mermaid is a peer dependency. Pass your own instance in.

```js
import mermaid from "mermaid";
import { initLoktaMermaid } from "@lokta/mermaid";

initLoktaMermaid(mermaid); // initialize + inject the hard-edge CSS
mermaid.run();             // or rely on startOnLoad
```

Zero install, straight from the docs site:

```html
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  import { initLoktaMermaid } from "https://msradam.github.io/lokta/lokta.mermaid.mjs";
  initLoktaMermaid(mermaid);
</script>
<pre class="mermaid">
flowchart LR
  A[Intake]:::hero --> B[Validate] --> C{Dedupe?}:::dec
  C -->|new| D[(Event store)]:::store
  C -->|dup| E[Drop]:::danger
  classDef hero fill:#FBBC0E,stroke:#1F1C13,stroke-width:1.5px,color:#1F1C13
  classDef dec fill:#2E3E5C,stroke:#1F1C13,stroke-width:1.5px,color:#FAF8EA
  classDef store fill:#6E8B6F,stroke:#1F1C13,stroke-width:1.5px,color:#FAF8EA
  classDef danger fill:#C23A26,stroke:#1F1C13,stroke-width:1.5px,color:#FAF8EA
</pre>
```

Exports: `initLoktaMermaid(mermaid, overrides?)`, `loktaMermaidConfig`,
`loktaClassDefs`, `loktaMermaidCSS`, `injectLoktaMermaidCSS()`. The CSS forces
the hard edges and mono edge labels that Mermaid's `themeVariables` cannot reach.
Load a Lokta token theme alongside it and the colours track the active stock.

## Print and Typst

Pre-render a diagram to SVG with mermaid-cli, then drop it into a document.

```sh
# colours only (themeVariables)
mmdc -c lokta-mermaid.json -i diagram.mmd -o diagram.svg

# colours plus hard edges and mono labels
mmdc -c lokta-mermaid.json -C lokta-mermaid.print.css -i diagram.mmd -o diagram.svg
```

In Typst:

```typ
#figure(image("diagram.svg", width: 90%), caption: [Pipeline stages.])
```

The print CSS is unscoped because mermaid-cli emits a bare `<svg class="flowchart">`
with no `.mermaid` wrapper.

## Node classes

Add to any flowchart with `classDef`, or use the values from `loktaClassDefs`.

| Class | Use |
| --- | --- |
| `hero` | marigold, the one node to look at first |
| `store` | celadon, a datastore |
| `dec` | indigo, a decision |
| `danger` | cinnabar, a failure or drop |
| `muted` | paper, secondary |

## License

MIT.
