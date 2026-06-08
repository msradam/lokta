// validate/components.spec.mjs, Lokta interaction + a11y tests (Playwright + axe-core).
// Deterministic: same input, same assertion. Covers the WAI-ARIA behaviors the system
// ships, plus an axe-core audit and computed-style checks for the locked aesthetic.
//
// Setup:
//   npm i -D @playwright/test @axe-core/playwright
//   npx playwright install --with-deps chromium
// Run (serve the docs site or the components page first, then):
//   PAGE_URL=http://localhost:8080/components.html npx playwright test validate/components.spec.mjs
//
// The page under test must expose the real Lokta component markup (the components
// reference page does). Adjust selectors if your IDs differ.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const URL = process.env.PAGE_URL || 'http://localhost:8080/components.html';
test.beforeEach(async ({ page }) => {
  // Wait for the icons (fetched from Iconify) and fonts to settle so axe sees
  // the final, deterministic page rather than a mid-load state.
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
});

// ── A11Y · axe-core, every stock ─────────────────────────────────────────────
for (const stock of ['paper', 'ink', 'indigo', 'slate', 'steel-light', 'manuscript', 'highland']) {
  test(`axe-core has no violations · ${stock}`, async ({ page }) => {
    await page.evaluate((s) => document.documentElement.setAttribute('data-theme', s), stock);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

// ── TABS · roving tabindex, arrow keys ───────────────────────────────────────
test('tabs: ArrowRight moves selection and switches panel', async ({ page }) => {
  const tabs = page.locator('#tabs [role="tab"]');
  await tabs.first().focus();
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#p2')).toBeVisible();
  await expect(page.locator('#p1')).toBeHidden();
  await page.keyboard.press('End');
  await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
});

// ── ACCORDION · Enter toggles aria-expanded + panel ──────────────────────────
test('accordion: Enter toggles a panel', async ({ page }) => {
  const head = page.locator('#accordion .lk-acc-head').nth(1);
  await expect(head).toHaveAttribute('aria-expanded', 'false');
  await head.focus();
  await page.keyboard.press('Enter');
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#ac2')).toBeVisible();
});

// ── DIALOG · open, focus trap, Escape closes, focus returns ───────────────────
test('dialog: focus trap, Escape closes, focus returns to trigger', async ({ page }) => {
  const trigger = page.locator('[data-open-dialog="demoDialog"]');
  await trigger.click();
  const dialog = page.locator('#demoDialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  // focus is inside the dialog
  expect(await page.evaluate(() => document.activeElement.closest('#demoDialog') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

// ── MENU · ArrowDown opens, Escape closes and restores focus ──────────────────
test('menu: ArrowDown opens, Escape closes and restores focus', async ({ page }) => {
  const btn = page.locator('#menu [data-menu-btn]');
  await btn.focus();
  await page.keyboard.press('ArrowDown');
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(btn).toBeFocused();
});

// ── STATUS · colour is always paired with a glyph (1.4.1) ─────────────────────
test('status: every status has a non-empty ::before glyph', async ({ page }) => {
  const glyphs = await page.$$eval('#status .lk-status', (els) =>
    els.map((e) => getComputedStyle(e, '::before').content),
  );
  for (const g of glyphs) expect(g === 'none' || g === '""' || g === '').toBe(false);
});

// ── HARD EDGE · computed border-radius is 0 on controls ───────────────────────
test('aesthetic: controls have zero border-radius', async ({ page }) => {
  const radii = await page.$$eval('.lk-btn, .lk-input, .lk-tag', (els) =>
    els.map((e) => getComputedStyle(e).borderTopLeftRadius),
  );
  for (const r of radii) expect(parseFloat(r)).toBe(0);
});

// ── TARGET SIZE · interactive controls are at least 36px tall ─────────────────
test('targets: buttons and inputs are >= 36px', async ({ page }) => {
  // Only visible controls; hidden ones (closed dialog, inactive tab panels) report 0.
  const heights = await page.$$eval('.lk-btn, .lk-input', (els) =>
    els.filter((e) => e.offsetParent !== null).map((e) => e.getBoundingClientRect().height),
  );
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(35.5);
});
