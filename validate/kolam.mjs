// validate/kolam.mjs. Deterministic gate for the kolam line ornaments. Pure Node.
// The generator is a pure function of (grid, tile rule), so the same spec must
// produce the same path bytes forever, and every rendered kolam must carry a
// name. Asserts:
//   determinism  two calls with the same spec are byte-identical, and a fixed
//                spec still hashes to the pinned golden (so the path can't drift
//                silently across a refactor).
//   patterns     the documented tile rules exist and produce distinct motifs.
//   geometry     a grid emits exactly 2 * cols * rows arcs.
//   a11y         svg() always emits role="img" with a non-empty aria-label, and
//                showDots:false drops the pulli circles.
// Run: node validate/kolam.mjs   (exits non-zero on any violation)

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const K = require('../packages/css/lokta-kolam.js');

const GOLDEN = 2893131833; // FNV-1a of path(4,4,{rule:'weave',s:60}).d

let checks = 0,
  fails = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    fails++;
    console.log('  x ' + msg);
  }
};
const fnv = (s) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
};

console.log('KOLAM · deterministic geometry');
const a = K.path(4, 4, { rule: 'weave', s: 60 });
const b = K.path(4, 4, { rule: 'weave', s: 60 });
ok(a.d === b.d, 'two calls with the same spec differ (not deterministic)');
ok(fnv(a.d) === GOLDEN, `path drifted from the pinned golden (got ${fnv(a.d)}, want ${GOLDEN})`);
ok((a.d.match(/A /g) || []).length === 2 * 4 * 4, 'arc count is not 2 * cols * rows');
ok(a.dots.length === 5 * 5, 'dot count is not (cols+1) * (rows+1)');

console.log('KOLAM · tile rules produce distinct motifs');
for (const name of ['weave', 'plain', 'rows', 'cols'])
  ok(typeof K.PATTERNS[name] === 'function', `missing pattern: ${name}`);
ok(
  K.path(6, 6, { rule: 'weave' }).d !== K.path(6, 6, { rule: 'plain' }).d,
  'weave and plain render the same path',
);

console.log('KOLAM · a chart of dots still needs a name');
const labelled = K.svg(3, 3, { rule: 'weave' });
ok(/role="img"/.test(labelled), 'svg() output is missing role="img"');
ok(/aria-label="[^"]+"/.test(labelled), 'svg() output has no non-empty aria-label');
const custom = K.svg(3, 3, { label: 'kolam endpaper' });
ok(/aria-label="kolam endpaper"/.test(custom), 'svg() does not honour an explicit label');
ok(!/<circle/.test(K.svg(3, 3, { showDots: false })), 'showDots:false still draws pulli circles');
ok(/currentColor/.test(labelled), 'svg() stroke is not currentColor (not themeable)');

console.log(`\nKOLAM · ${checks - fails}/${checks} checks passing.`);
if (fails) {
  console.error(`FAILED: ${fails} kolam violation(s).`);
  process.exit(1);
}
console.log('All kolam checks passing.');
