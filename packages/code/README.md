# @lokta/code

Syntax highlighting theme for Lokta. Ten token roles, AA on the code background in
light and dark, with a weight or italic cue per category so meaning survives in
greyscale. The roles are CSS variables (`--code-*`) shipped by `@lokta/css`, so the
theme re-points with the stock.

## Files

- `lokta-light.tmTheme`, `lokta-dark.tmTheme`: TextMate themes, the cross-surface
  source. Consumed by Typst `raw` blocks, Shiki, and VS Code.
- `lokta-prism.css`: maps Prism token classes to the `--code-*` roles.
- `lokta-hljs.css`: maps highlight.js classes to the `--code-*` roles.

## Use (Prism)

```html
<link rel="stylesheet" href="@lokta/tokens/css/lokta.css">
<link rel="stylesheet" href="@lokta/css/lokta.css">
<link rel="stylesheet" href="@lokta/code/lokta-prism.css">
```

The token values are gated on every commit by `validate/code-aa.mjs`.

## Off-the-shelf alternative

When a team wants an existing editor theme rather than the native one, **Modus
Operandi** (light) is the recommendation: it targets WCAG AAA per token and its
warm-neutral background sits beside Lokta paper. Fallback: accessible-pygments
(a11y-light, a11y-dark).
