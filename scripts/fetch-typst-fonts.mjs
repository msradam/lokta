// Vendor static TTF fonts for the Typst package. Typst flags variable fonts, so
// these are true static instances from google-webfonts-helper (SIL OFL). Written
// to packages/typst/fonts. Requires the `unzip` CLI (macOS and Linux ship it).
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'packages/typst/fonts');
const API = 'https://gwfh.mranftl.com/api/fonts';

// id, subsets, variants
const FONTS = [
  ['archivo', 'latin', 'regular,500,600,700,800'],
  ['spline-sans-mono', 'latin', 'regular,500,600'],
  ['source-serif-4', 'latin', 'regular,600,italic,500italic'],
  ['noto-sans-jp', 'japanese', 'regular,700'],
];

await mkdir(out, { recursive: true });
const tmp = join(out, '.tmp');
await mkdir(tmp, { recursive: true });

for (const [id, subsets, variants] of FONTS) {
  const url = `${API}/${id}?download=zip&subsets=${subsets}&formats=ttf&variants=${variants}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${id}`);
  const zip = join(tmp, `${id}.zip`);
  await (await import('node:fs/promises')).writeFile(zip, Buffer.from(await res.arrayBuffer()));
  const r = spawnSync('unzip', ['-o', '-j', zip, '*.ttf', '-d', out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`unzip failed for ${id}: ${r.stderr}`);
  console.log('vendored', id);
}

await rm(tmp, { recursive: true, force: true });
console.log('Typst fonts written to packages/typst/fonts');
