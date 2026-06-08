// validate/visual.spec.mjs. Visual regression for the components reference.
// Deterministic given the pinned self-hosted fonts and a fixed browser. Baselines
// are generated in Linux (Docker, matching CI) and committed; run only in that
// environment, so this is a separate gate from test:components, not part of the
// default validate run. Update with: npm run test:visual:update (in Docker/CI).
import { test, expect } from '@playwright/test';

const URL = process.env.PAGE_URL || 'http://localhost:8080/components.html';
test.use({ viewport: { width: 1280, height: 900 } });

for (const stock of ['paper', 'ink', 'steel-light']) {
  test(`visual: components on ${stock}`, async ({ page }) => {
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.evaluate((s) => document.documentElement.setAttribute('data-theme', s), stock);
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
    await expect(page).toHaveScreenshot(`components-${stock}.png`, {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
}
