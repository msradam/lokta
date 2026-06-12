# @lokta/datatype

Charts in the sentence. Datatype is a variable OpenType data font (SIL OFL, by Frank Tisellano) that turns text like `{b:30,70,50}` into an inline chart through ligature substitution. No SVG, no chart library, no build step: it is just text in a font, so it renders identically in a web page, a Marp slide, and a Typst PDF.

It complements the SVG `--viz` charts in `@lokta/css` rather than replacing them. Use Datatype for charts in a sentence, stat blocks, and dense tables; use the SVG path for large, interactive, or fully-labelled figures.

## Install

```
npm install github:msradam/lokta-datatype
```

```html
<link rel="stylesheet" href="@lokta/datatype/css" />
<script src="@lokta/datatype/chart" defer></script>
```

The woff2 is self-hosted beside the CSS. Do not hot-link a CDN: it is a GDPR exposure in the EU.

## The three marks

| Mark      | Source            | Class           |
| --------- | ----------------- | --------------- |
| Bars      | `{b:15,45,80,30}` | `.dt .dt-bars`  |
| Sparkline | `{l:10,40,25,70}` | `.dt .dt-spark` |
| Pie       | `{p:62}`          | `.dt .dt-pie`   |

Values are 0 to 100, up to 20 for bars and sparklines, one percentage for pie. The marks inherit `currentColor`. Variable axes: width 50 to 150 (spacing), weight 100 to 900 (line thickness), mapped to the Lokta type weights.

## A chart made of text is still text

A screen reader pointed at `{b:30,70,50}` reads the literal braces, which is noise. Every Datatype chart is wrapped to speak its meaning, never its syntax:

```html
<span class="dt dt-spark" role="img" aria-label="sparkline, rising from 20 to 95: 20, 45, 60, 55, 80, 95"
  >{l:20,45,60,55,80,95}</span
>
```

`role="img"` stops the reader walking into the braces; `aria-label` replaces them with a sentence. Colour is never the only signal: where the mark carries meaning (up vs down), the label says so.

### lokta-chart.js

The helper emits the source and the label together, so they cannot drift, and adds the no-font fallback (if Datatype fails to load, the braces are swapped for a readable values list).

```js
const el = LoktaChart.spark([20, 45, 60, 55, 80, 95], { name: 'weekly actives' });
// <span class="dt dt-spark" role="img" aria-label="weekly actives: sparkline, rising from 20 to 95: …">{l:…}</span>
document.querySelector('#stat').append(el);
```

Pure functions for server-side or Typst generation:

```js
LoktaChart.source('bars', [62, 24, 14]); // "{b:62,24,14}"
LoktaChart.label('bars', [62, 24, 14]); // "bar chart: 62, 24, 14"
```

Declarative upgrade:

```html
<span data-lk-chart="spark" data-name="error rate">8,6,7,5,6,4</span>
```

`LoktaChart.auto()` runs on load and replaces it with the wrapped chart.
