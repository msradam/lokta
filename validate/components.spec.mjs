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

// ── TABLE · accessible structure (caption + scoped headers) ───────────────────
test('table: data table has a caption and scoped column headers', async ({ page }) => {
  const t = page.locator('#table table.lk-table');
  await expect(t.locator('caption')).toHaveCount(1);
  const ths = t.locator('thead th');
  const n = await ths.count();
  for (let i = 0; i < n; i++) await expect(ths.nth(i)).toHaveAttribute('scope', 'col');
});

// ── DATATYPE · a chart made of text is still text ─────────────────────────────
test('datatype: every .dt is role="img" with a non-empty aria-label', async ({ page }) => {
  const dts = page.locator('.dt');
  const n = await dts.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await expect(dts.nth(i)).toHaveAttribute('role', 'img');
    const label = (await dts.nth(i).getAttribute('aria-label')) || '';
    expect(label.trim().length).toBeGreaterThan(0);
    // The {…} ligature source must not leak into the accessible name.
    expect(label).not.toMatch(/[{}]/);
  }
});

// ── STREAMING · aria-hidden body, polite role=log announces the complete text ─
test('streaming: body is aria-hidden and the complete message lands in a polite log', async ({ page }) => {
  const region = page.locator('#stream-demo [role="log"]');
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#stream-demo [data-stream-body]')).toHaveAttribute('aria-hidden', 'true');
  await expect(region).toHaveText(''); // exists on load, starts empty
  await page.locator('#stream-demo [data-stream-go]').click();
  await expect(region).not.toHaveText('', { timeout: 5000 }); // announced once, when complete
});

// ── MOTION FLOOR · under reduced motion a primitive holds its final state ─────
test('motion: reduced motion forces the final state with no running animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  const state = await page.evaluate(() => {
    const el = document.querySelector('#primitives-demo .lk-rule-in');
    el.classList.add('lk-run'); // try to start it; the floor must override
    const cs = getComputedStyle(el);
    return { anim: cs.animationName, transform: cs.transform };
  });
  expect(state.anim).toBe('none');
  expect(state.transform === 'none' || state.transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
});

// ── MOTION TOGGLE · persists across reload (localStorage) ──────────────────────
test('motion: the reduce-motion toggle persists across reload', async ({ page }) => {
  await page.locator('[data-lk-motion-toggle]').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-lk-motion', 'off');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-lk-motion', 'off');
});

// ── GRID · ARIA grid keyboard navigation (roving tabindex + arrows) ───────────
test('grid: arrow keys move the focused cell, one cell in the tab order', async ({ page }) => {
  const cells = page.locator('#grid-demo [role="gridcell"]');
  // exactly one cell is tabbable at rest (roving tabindex); the first is a header
  const tabbable = await page
    .locator('#grid-demo [role="gridcell"][tabindex="0"], #grid-demo [role="columnheader"][tabindex="0"]')
    .count();
  expect(tabbable).toBe(1);
  await cells.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(cells.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  // moved to the second row, second column (index 1 + 3 columns = 4)
  await expect(cells.nth(4)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(cells.nth(3)).toBeFocused();
});
