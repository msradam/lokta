// Acceptance check: every CSS variable that the built `paper` theme and the
// hand-authored reference share must carry the same value. Reference-only
// design constants (easing, durations, type styles) live in @lokta/css base
// and are not produced by the token pipeline, so they are ignored here.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const decls = (css) => {
  const map = new Map();
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const name = m[1];
    const value = m[2]
      .replace(/\/\*[^]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    if (!map.has(name)) map.set(name, value);
  }
  return map;
};

// Reference declarations across :root and the paper scope (later wins, but the
// paper scope only re-points semantics so first-seen is fine for primitives).
const refCss = await readFile(join(root, 'tokens/lokta.reference.css'), 'utf8');
const paperHead = refCss.slice(0, refCss.indexOf('THEME · INK'));
const ref = decls(paperHead);

const built = decls(await readFile(join(root, 'packages/tokens/dist/css/lokta.paper.css'), 'utf8'));

const shared = [...ref.keys()].filter((k) => built.has(k));
const mismatches = shared.filter((k) => ref.get(k) !== built.get(k));

const core = [
  '--paper-01',
  '--ink-90',
  '--surface-page',
  '--text-primary',
  '--text-body',
  '--border-strong',
  '--accent-success',
  '--field-bg',
  '--focus-ring',
  '--type-base',
  '--space-5',
];
const missing = core.filter((k) => !built.has(k));

if (missing.length) {
  console.error('FAIL: built paper theme is missing core variables:', missing.join(', '));
  process.exit(1);
}
if (mismatches.length) {
  console.error('FAIL: built paper theme diverges from reference for:');
  for (const k of mismatches) console.error(`  ${k}: ref ${ref.get(k)} != built ${built.get(k)}`);
  process.exit(1);
}

console.log(
  `OK: ${shared.length} shared variables match the reference; ${core.length} core variables present.`,
);
