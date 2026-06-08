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
const figType = (t) =>
  t === 'color' ? 'COLOR' : t === 'dimension' ? 'FLOAT' : t === 'fontFamily' ? 'STRING' : 'STRING';

// Flatten a token set into [{ path, type, value }] leaves.
function leaves(obj, prefix = []) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v)
      out.push({ path: [...prefix, k], type: v.$type, value: v.$value });
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

// ── Extra stocks (CSS-only themes in lokta-stocks.css) become Semantic modes ──
// --surface-page -> surface/page; raw hex stays, var(--pigment-x) becomes an alias.
const stocksCss = await readFile(join(root, 'packages/css/lokta-stocks.css'), 'utf8');
const varToRole = (v) => v.replace(/^--/, '').replace('-', '/');
const resolveVal = (raw) => {
  raw = raw.trim();
  if (raw.startsWith('#')) return raw.toUpperCase();
  const m = raw.match(/^var\(--([a-z0-9-]+)\)$/);
  if (m) {
    const path = m[1].replace('-', '/');
    return primNames.has(path) ? { alias: path } : null;
  }
  return null;
};
const EXTRA = [];
for (const block of stocksCss.matchAll(/\[data-theme="([^"]+)"\]\s*\{([^}]*)\}/g)) {
  const roles = {};
  for (const d of block[2].matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
    const v = resolveVal(d[2]);
    if (v != null) roles[varToRole('--' + d[1])] = v;
  }
  EXTRA.push({ mode: block[1], roles });
}

// ── Semantic collection (colour roles only; modes = stocks) ──────────────────
// Canonical role order from the paper set, then any extra roles other stocks add.
const roleOrder = [];
const seen = new Set();
for (const mode of STOCKS.map((s) => s.mode)) {
  for (const l of leaves(stockSets[mode])) {
    if (l.type !== 'color') continue;
    const name = l.path.join('/');
    if (!seen.has(name)) {
      seen.add(name);
      roleOrder.push(name);
    }
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
    if (v == null) {
      v = roleValue('paper', name);
      fellBack = true;
    }
    if (v == null) continue;
    if (isRef(v) && primNames.has(refToPath(v))) values[mode] = { alias: refToPath(v) };
    else values[mode] = v;
    if (fellBack) values[`${mode}$note`] = 'inherits paper';
  }
  for (const e of EXTRA) {
    let v = e.roles[name];
    if (v == null) {
      const pv = roleValue('paper', name);
      if (pv == null) continue;
      v = isRef(pv) && primNames.has(refToPath(pv)) ? { alias: refToPath(pv) } : pv;
      values[`${e.mode}$note`] = 'inherits paper';
    }
    values[e.mode] = v;
  }
  return { name, type: 'COLOR', values };
});

const ALL_MODES = [...STOCKS.map((s) => s.mode), ...EXTRA.map((e) => e.mode)];

const manifest = {
  $generatedFrom: 'tokens/lokta.tokens.json',
  $note:
    'Deterministic Figma Variables manifest. References are variable aliases. Modes on the Semantic collection are the stocks.',
  collections: [
    { name: 'Lokta Primitives', modes: ['Value'], hideFromPublishing: true, variables: primitives },
    { name: 'Lokta Semantic', modes: ALL_MODES, variables: semantic },
  ],
};

// ── Integrity check (deterministic): the export must round-trip the tokens ───
// Every alias resolves to a real primitive, every mode is filled, every COLOR is
// a hex, and a few semantic values resolve to the exact reference hex.
let fails = 0;
const bad = (m) => {
  fails++;
  console.error('  x ' + m);
};
const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v);
const primByName = Object.fromEntries(primitives.map((v) => [v.name, v.values.Value]));
const SPOT = {
  'surface/page': { paper: '#F4F1DF', ink: '#1F1C13' },
  'text/primary': { paper: '#1F1C13', ink: '#FAF8EA' },
};
for (const v of semantic) {
  for (const mode of ALL_MODES) {
    const val = v.values[mode];
    if (val == null) {
      bad(`${v.name}: missing mode ${mode}`);
      continue;
    }
    const hex = val && val.alias ? primByName[val.alias] : val;
    if (val && val.alias && !(val.alias in primByName))
      bad(`${v.name}.${mode}: alias ${val.alias} has no primitive`);
    if (!isHex(hex)) bad(`${v.name}.${mode}: not a colour (${JSON.stringify(val)})`);
    if (SPOT[v.name] && SPOT[v.name][mode] && hex.toUpperCase() !== SPOT[v.name][mode])
      bad(`${v.name}.${mode}: ${hex} != ${SPOT[v.name][mode]}`);
  }
}
if (fails) {
  console.error(`Figma export FAILED ${fails} integrity check(s).`);
  process.exit(1);
}

const outDir = join(root, 'packages/tokens/dist/figma');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'lokta.variables.json'), JSON.stringify(manifest, null, 2) + '\n');

// Professional-tier variant: Figma caps the Professional plan at 10 variable modes
// per collection, so emit a 10-stock manifest that imports without trimming on a
// $15 seat. The full 14-mode file needs Organization (20-mode cap).
const PRO_MODES = ['paper', 'ink', 'bone', 'indigo', 'manuscript', 'highland', 'pine', 'mulberry', 'slate', 'slate-light'];
const proSemantic = semantic.map((v) => {
  const values = {};
  for (const m of PRO_MODES) {
    if (m in v.values) values[m] = v.values[m];
    if (`${m}$note` in v.values) values[`${m}$note`] = v.values[`${m}$note`];
  }
  return { ...v, values };
});
const proManifest = {
  ...manifest,
  $note: `${manifest.$note} Professional-tier: ${PRO_MODES.length} modes (the Professional plan caps a collection at 10).`,
  collections: [
    { name: 'Lokta Primitives', modes: ['Value'], hideFromPublishing: true, variables: primitives },
    { name: 'Lokta Semantic', modes: PRO_MODES, variables: proSemantic },
  ],
};
// Re-verify: every pro mode is filled (a subset of the already-verified full set).
for (const v of proSemantic)
  for (const mode of PRO_MODES)
    if (v.values[mode] == null) bad(`pro ${v.name}: missing mode ${mode}`);
if (fails) {
  console.error(`Figma pro export FAILED.`);
  process.exit(1);
}
await writeFile(join(outDir, 'lokta.variables.pro.json'), JSON.stringify(proManifest, null, 2) + '\n');

console.log(
  `Built + verified Figma variables: ${primitives.length} primitives, ${semantic.length} semantic roles -> ` +
    `lokta.variables.json (${ALL_MODES.length} modes, Org+) and lokta.variables.pro.json (${PRO_MODES.length} modes, Professional).`,
);
