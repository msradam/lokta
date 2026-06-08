// validate/templates.spec.mjs. axe-core audit of the whole-page example templates
// (dashboard, landing) across stocks. They are built only from Lokta classes, so a
// clean audit here proves the components compose into real pages, not just demos.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['dashboard.html', 'landing.html', 'cookbook.html'];
const STOCKS = ['paper', 'ink', 'indigo'];

for (const pageName of PAGES) {
  for (const stock of STOCKS) {
    test(`axe-core: ${pageName} · ${stock}`, async ({ page }) => {
      await page.goto(`http://localhost:8080/${pageName}`, { waitUntil: 'networkidle' });
      // Disable transitions so axe samples settled colors, not a mid-theme-switch
      // blend (lk-btn animates its background).
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      await page.evaluate((s) => document.documentElement.setAttribute('data-theme', s), stock);
      await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
