// Vendor the SIL OFL fonts as self-hosted woff2 (no Google Fonts CDN in
// production: hot-linking it is a GDPR exposure in the EU). Files are pulled
// from the @fontsource mirror on jsdelivr and written next to the CSS that
// references them. Idempotent: existing files are skipped.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const CDN = 'https://cdn.jsdelivr.net/npm/@fontsource';

// family, fontsource package, [subset, weight, style] tuples.
const FULL = [
  [
    'archivo',
    'archivo',
    [
      ['latin', 400, 'normal'],
      ['latin', 500, 'normal'],
      ['latin', 600, 'normal'],
      ['latin', 700, 'normal'],
      ['latin', 800, 'normal'],
    ],
  ],
  [
    'spline-sans-mono',
    'spline-sans-mono',
    [
      ['latin', 400, 'normal'],
      ['latin', 500, 'normal'],
      ['latin', 600, 'normal'],
    ],
  ],
  [
    'source-serif-4',
    'source-serif-4',
    [
      ['latin', 400, 'normal'],
      ['latin', 600, 'normal'],
      ['latin', 400, 'italic'],
      ['latin', 500, 'italic'],
    ],
  ],
  [
    'noto-sans-jp',
    'noto-sans-jp',
    [
      ['latin', 400, 'normal'],
      ['japanese', 400, 'normal'],
      ['japanese', 700, 'normal'],
    ],
  ],
  [
    'anek-bangla',
    'anek-bangla',
    [
      ['latin', 400, 'normal'],
      ['bengali', 400, 'normal'],
      ['bengali', 500, 'normal'],
      ['bengali', 700, 'normal'],
    ],
  ],
];

// Lighter set for the slide deck: display, mono, serif, and a JP face for the header.
const DECK = [
  [
    'archivo',
    'archivo',
    [
      ['latin', 400, 'normal'],
      ['latin', 500, 'normal'],
      ['latin', 700, 'normal'],
      ['latin', 800, 'normal'],
    ],
  ],
  [
    'spline-sans-mono',
    'spline-sans-mono',
    [
      ['latin', 400, 'normal'],
      ['latin', 500, 'normal'],
      ['latin', 600, 'normal'],
    ],
  ],
  [
    'source-serif-4',
    'source-serif-4',
    [
      ['latin', 400, 'italic'],
      ['latin', 500, 'italic'],
    ],
  ],
  ['noto-sans-jp', 'noto-sans-jp', [['japanese', 400, 'normal']]],
];

const file = (family, subset, weight, style) => `${family}-${subset}-${weight}-${style}.woff2`;
const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

async function fetchSet(set, outDir) {
  await mkdir(outDir, { recursive: true });
  let got = 0;
  let skipped = 0;
  for (const [family, pkg, faces] of set) {
    for (const [subset, weight, style] of faces) {
      const name = file(family, subset, weight, style);
      const dest = join(outDir, name);
      if (await exists(dest)) {
        skipped++;
        continue;
      }
      const url = `${CDN}/${pkg}@5/files/${name}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      got++;
    }
  }
  console.log(`${outDir}: ${got} downloaded, ${skipped} already present`);
}

await fetchSet(FULL, join(root, 'packages/css/fonts'));
await fetchSet(DECK, join(root, 'packages/marp-theme/fonts'));
