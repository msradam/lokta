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

`lokta.css` pulls in three files you can also load individually:

- `fonts.css`. Self-hosted `@font-face` rules (Archivo, Spline Sans Mono, Source
  Serif 4, Noto Sans JP, Anek Bangla). The woff2 files live in `fonts/`.
- `lokta-base.css`. Non-token design constants (easing, durations, type styles,
  interaction state), the brand customisation layer, and forced-colors support.
- `lokta-components.css`. The `.lk-*` classes.

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
