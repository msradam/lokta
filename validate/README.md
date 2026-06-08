# Lokta validation suite

Deterministic gates for design-rule alignment and component behavior. Three tiers, each exits non-zero on failure so CI blocks a regression.

## What runs

1. **`../scripts/verify.mjs`**, token math (pure Node). WCAG AA contrast for every text role x surface x stock, cross-surface parity (Typst + Mermaid literals equal their primitive), and the 8px grid.

2. **`lint.mjs`**, static design-rule lint (pure Node, no browser). Parses the CSS/HTML as text and asserts: no stray hex outside the primitive palette, no `border-radius` except `var(--lk-radius)`, no `box-shadow` with blur (only the modal's hard offset), and a `:focus-visible` rule for every interactive class. Run: `node validate/lint.mjs .`

3. **`components.spec.mjs`**, interaction + a11y tests (Playwright + axe-core). Renders the components page in headless Chromium and asserts the real WAI-ARIA behaviors (tabs roving tabindex + arrow keys, accordion Enter toggle, dialog focus-trap + Escape + focus return, menu arrow/Escape, status colour-plus-glyph), runs an **axe-core** audit in five stocks, and checks computed border-radius and target size. Setup:
   ```
   npm i -D @playwright/test @axe-core/playwright
   npx playwright install --with-deps chromium
   PAGE_URL=http://localhost:8080/components.html npx playwright test validate/components.spec.mjs
   ```

## Wire as npm scripts

```json
{
  "scripts": {
    "verify": "node scripts/verify.mjs",
    "lint:rules": "node validate/lint.mjs .",
    "test:components": "playwright test validate/components.spec.mjs",
    "validate": "npm run verify && npm run lint:rules && npm run test:components"
  }
}
```

## What stays a human eye-check

Visual hierarchy, optical balance, and whether a layout "feels like Lokta" are not deterministic. The components page and the verification dashboard (`../proof/Lokta Verification.html`) are there for that review. Visual-regression snapshots can be added later (deterministic given pinned fonts + browser, but baselines need a human to bless).
