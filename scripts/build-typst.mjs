// Compile every Typst example in packages/typst to PDF using the vendored
// static fonts. Output to packages/typst/dist. Requires the `typst` CLI.
import { readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..', 'packages/typst');
const dist = join(pkg, 'dist');
await mkdir(dist, { recursive: true });

const has = spawnSync('typst', ['--version'], { encoding: 'utf8' });
if (has.status !== 0) {
  console.error('typst CLI not found. Install it: https://github.com/typst/typst');
  process.exit(1);
}

// Top-level example*.typ plus the lokta-hitec sub-package example.
const examples = (await readdir(pkg))
  .filter((f) => f.startsWith('example') && f.endsWith('.typ'))
  .map((f) => [f, f.replace(/\.typ$/, '.pdf')]);
examples.push(['lokta-hitec/example.typ', 'lokta-hitec-example.pdf']);

let failed = 0;
for (const [src, out] of examples.sort()) {
  const r = spawnSync(
    'typst',
    ['compile', '--font-path', 'fonts', '--ignore-system-fonts', src, join('dist', out)],
    { cwd: pkg, encoding: 'utf8' },
  );
  if (r.status === 0) {
    console.log('OK   ', out);
  } else {
    failed++;
    console.error('FAIL ', src, '\n', r.stderr);
  }
}
if (failed) process.exit(1);
console.log(`Built ${examples.length} Typst PDFs into packages/typst/dist.`);
