# Lokta customization philosophy

Opinion lives in what cannot be changed. Lokta exposes a small, fixed set of brand dials, every one range-limited so that even at its extreme the output is recognizably Lokta. All real flexibility lives in the token tiers (primitive, semantic, component), not in a wider control panel.

## The six dials (two groups of three)

Identity dials (what the brand is):
- **Stock** — surface, from the curated set (paper, bone, manuscript, ink, indigo, highland, slate, steel, onyx, and the light variants). Not a freeform background colour.
- **Accent** — hero pigment, from the curated set (marigold, madder, lac, cinnabar, indigo, and so on). Not a freeform colour picker.
- **Voice** — named typeface options per role (for example Archivo or Mukta for display, Source Serif or Martel for serif). One dial, not several freeform font inputs. Script (Latin, Devanagari, Bengali, CJK) is selected automatically by content language and is never a dial.

Form dials (how it is set):
- **Density** — comfortable or compact. Two steps.
- **Radius** — clamped 0 to 3px. Square is the default and the ceiling is gentle.
- **Grain** — off, subtle, or fibrous. Three steps. Texture, never depth.

Do not add dials beyond these six. If a brand needs more, the answer is a new curated option inside an existing dial (a new stock, a new accent, a new Voice option), or a component token in the token layer, never a new knob.

## Why six, and why range-limited

The field separates two counts that are easily conflated. Tokens, the internal building blocks, can number in the hundreds. Dials, the surface a consumer is invited to change, should be very few. Token guidance is explicit that the customizable surface is a deliberately limited, discrete set rather than a continuum, and that creating too many tokens too early is a known pitfall. More variables is not the fix for flexibility either; the resolution the field settled on is the three-tier token architecture, not a wider set of knobs.

The disciplined systems converge on roughly three to eight consumer dials, clustering at five to six:

| System | Consumer dials |
| --- | --- |
| Radix Themes | accent, gray, appearance, radius, scaling, panel background (about 6) |
| Material 3 | a seed colour that generates the palette, plus light/dark (about 1 to 2) |
| Adobe Spectrum | colour theme, platform scale (about 2) |
| USWDS | colour families, spacing base, type scale, font families (a handful) |
| shadcn, Polaris, Atlassian | base colour, radius, mode, opinionated otherwise |
| **Lokta** | **Stock, Accent, Voice, Density, Radius, Grain (6)** |

Three properties make Lokta's set stronger than the median: every dial is range-limited rather than freeform, so the extreme is still Lokta; the font work is one Voice dial rather than several freeform inputs; and script is an automatic context, not a preference.

## Surfacing the dials

The dials are CSS custom properties on `:root`, usable identically across web, Marp, and Typst (the Marp theme already models this for type). A consumer sets a stock with a `data-theme` attribute and the rest with the clamped properties:

```html
<body data-theme="manuscript"
      data-density="compact"
      style="--lk-radius: 2px; --lk-grain: fibrous;
             --accent-feature-fill: var(--pigment-madder);">
```

```css
:root {
  /* VOICE — named options per role, resolved by content language */
  --font-family-display: "Archivo", "Mukta", "Anek Bangla", system-ui, sans-serif;
  --font-family-serif:   "Source Serif 4", "Martel", "Noto Serif Bengali", Georgia, serif;
  /* FORM — clamped */
  --lk-density: comfortable;   /* comfortable | compact */
  --lk-radius:  0px;           /* clamp(0px, value, 3px) */
  --lk-grain:   subtle;        /* off | subtle | fibrous */
}
:lang(ne), :lang(hi) { --font-family-display: "Mukta", "Archivo", sans-serif; }
:lang(bn)            { --font-family-display: "Anek Bangla", "Archivo", sans-serif; }
```

Everything else, the type scale, the 8px spacing grid, the AA contrast rules, component structure and states, and the flat hard-edged character, is locked. That is the point.
