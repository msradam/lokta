// validate/site.spec.mjs. axe-core over the docs pages that aren't theme-switched
// (the hub and the verification dashboard), so the whole site is held to the bar.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const pg of ['index.html', 'verification.html']) {
  test(`axe-core: ${pg}`, async ({ page }) => {
    await page.goto(`http://localhost:8080/${pg}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations).toEqual([]);
  });
}
