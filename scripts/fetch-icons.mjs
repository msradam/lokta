// Vendor a self-hosted icon sprite from Tabler (the system's base set), sharpened
// to the Lokta edge: 24px grid, 2px stroke, square caps, miter joins, currentColor.
// Pulled once from the Iconify API at build time and committed, so the system
// ships real icons with no runtime CDN. Run: npm run build:icons
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'packages/css/icons');

// The working set the components use, plus a few common UI glyphs.
const SEED = [
  'check',
  'alert-triangle',
  'circle',
  'info-circle',
  'x',
  'chevron-right',
  'chevron-down',
  'chevron-left',
  'chevron-up',
  'arrow-right',
  'arrow-left',
  'plus',
  'minus',
  'search',
  'menu-2',
  'external-link',
  'dots',
  'trash',
  'settings',
  'download',
  'upload',
  'calendar',
  'user',
  'star',
  'eye',
  'edit',
  'copy',
  'filter',
  'sort-ascending',
  'home',
];

const res = await fetch(`https://api.iconify.design/tabler.json?icons=${SEED.join(',')}`);
if (!res.ok) throw new Error(`Iconify ${res.status}`);
const data = await res.json();
const W = data.width || 24,
  H = data.height || 24;

// Sharpen: square caps + miter joins instead of Tabler's round.
const sharpen = (body) =>
  body
    .replace(/stroke-linecap="round"/g, 'stroke-linecap="square"')
    .replace(/stroke-linejoin="round"/g, 'stroke-linejoin="miter"');

const symbols = [];
const missing = [];
for (const name of SEED) {
  const ic = data.icons[name];
  if (!ic || !ic.body) {
    missing.push(name);
    continue;
  }
  symbols.push(
    `  <symbol id="lk-i-${name}" viewBox="0 0 ${ic.width || W} ${ic.height || H}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">${sharpen(ic.body)}</symbol>`,
  );
}
if (missing.length) console.warn('missing from Tabler:', missing.join(', '));

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n${symbols.join('\n')}\n</svg>\n`;

const css = `/* Lokta icons. Self-hosted, sharpened Tabler. Reference a glyph by id:
     <svg class="lk-ico" aria-hidden="true"><use href="icons/lokta-icons.svg#lk-i-check"></use></svg>
   Icons inherit the text role through currentColor. Inline the sprite once per page
   (or fetch it) so the <use> references resolve. */
.lk-ico {
  display: inline-block;
  width: 1.25em;
  height: 1.25em;
  vertical-align: -0.18em;
  color: inherit;
}
.lk-ico-sm { width: 1em; height: 1em; }
.lk-ico-lg { width: 1.5em; height: 1.5em; }
`;

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'lokta-icons.svg'), sprite);
await writeFile(join(root, 'packages/css/lokta-icons.css'), css);
console.log(`Built icon sprite: ${symbols.length} icons -> packages/css/icons/lokta-icons.svg`);
