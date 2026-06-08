// Emit a Figma Variables manifest from the canonical tokens. Two collections:
//   Lokta Primitives  (one mode)  colours, dimensions, font families
//   Lokta Semantic    (modes = stocks: paper, ink, bone, indigo)  aliases primitives
// References ({ink.90}) become Figma variable aliases, so the tier graph survives.
// Output: packages/tokens/dist/figma/lokta.variables.json. This is the source for
// a Tokens Studio import, an Enterprise Variables REST POST, and the parity check.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const setPath = (s) => join(root, 'tokens/sets', `${s}.json`);
const read = async (s) => JSON.parse(await readFile(setPath(s), 'utf8'));

const prim = await read('primitives');
const STOCKS = [
  { mode: 'paper', set: 'semantic-paper' },
  { mode: 'ink', set: 'semantic-ink' },
  { mode: 'bone', set: 'stock-bone' },
  { mode: 'indigo', set: 'stock-indigo' },
];
const stockSets = Object.fromEntries(await Promise.all(STOCKS.map(async (s) => [s.mode, await read(s.set)])));

// ── helpers ──────────────────────────────────────────────────────────────────
const isRef = (v) => typeof v === 'string' && v.startsWith('{');
const refToPath = (v) => v.replace(/[{}]/g, '').replace(/\./g, '/'); // {ink.90} -> ink/90
const dimToFloat = (v) => parseFloat(String(v)); // "24px" -> 24, "0.5px" -> 0.5
const figType = (t) => (t === 'color' ? 'COLOR' : t === 'dimension' ? 'FLOAT' : t === 'fontFamily' ? 'STRING' : 'STRING');

// Flatten a token set into [{ path, type, value }] leaves.
function leaves(obj, prefix = []) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) out.push({ path: [...prefix, k], type: v.$type, value: v.$value });
    else if (v && typeof v === 'object') out.push(...leaves(v, [...prefix, k]));
  }
  return out;
}

// ── Primitives collection ────────────────────────────────────────────────────
const primLeaves = leaves(prim);
const primNames = new Set(primLeaves.map((l) => l.path.join('/')));
const primitives = primLeaves.map((l) => ({
  name: l.path.join('/'),
  type: figType(l.type),
  values: { Value: l.type === 'dimension' ? dimToFloat(l.value) : l.value },
}));

// ── Semantic collection (colour roles only; modes = stocks) ──────────────────
// Canonical role order from the paper set, then any extra roles other stocks add.
const roleOrder = [];
const seen = new Set();
for (const mode of STOCKS.map((s) => s.mode)) {
  for (const l of leaves(stockSets[mode])) {
    if (l.type !== 'color') continue;
    const name = l.path.join('/');
    if (!seen.has(name)) { seen.add(name); roleOrder.push(name); }
  }
}
const roleValue = (mode, name) => {
  const found = leaves(stockSets[mode]).find((l) => l.path.join('/') === name && l.type === 'color');
  return found ? found.value : null;
};
const semantic = roleOrder.map((name) => {
  const values = {};
  for (const { mode } of STOCKS) {
    // fall back to the paper (default) value when a stock omits a role (e.g. bone accents).
    let v = roleValue(mode, name);
    let fellBack = false;
    if (v == null) { v = roleValue('paper', name); fellBack = true; }
    if (v == null) continue;
    if (isRef(v) && primNames.has(refToPath(v))) values[mode] = { alias: refToPath(v) };
    else values[mode] = v;
    if (fellBack) values[`${mode}$note`] = 'inherits paper';
  }
  return { name, type: 'COLOR', values };
});

const manifest = {
  $generatedFrom: 'tokens/lokta.tokens.json',
  $note: 'Deterministic Figma Variables manifest. References are variable aliases. Modes on the Semantic collection are the stocks.',
  collections: [
    { name: 'Lokta Primitives', modes: ['Value'], hideFromPublishing: true, variables: primitives },
    { name: 'Lokta Semantic', modes: STOCKS.map((s) => s.mode), variables: semantic },
  ],
};

const outDir = join(root, 'packages/tokens/dist/figma');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'lokta.variables.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `Built Figma variables: ${primitives.length} primitives, ${semantic.length} semantic roles x ${STOCKS.length} modes -> packages/tokens/dist/figma/lokta.variables.json`,
);
