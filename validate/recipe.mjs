// validate/recipe.mjs. Gate for the recipe-notation fraction wrapper. Pure Node.
// The OpenType `frac` feature must be scoped to the fraction substring only;
// applied to a whole line it superscripts whole numbers and mangles
// parentheticals. frac() must wrap bare N/M and nothing else, so the source and
// the set output cannot drift.
// Run: node validate/recipe.mjs   (exits non-zero on any violation)

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const R = require('../packages/css/lokta-recipe.js');

let checks = 0,
  fails = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    fails++;
    console.log('  x ' + msg);
  }
};

console.log('RECIPE · frac is scoped to the fraction, never the whole line');
const a = R.frac('2 1/2 cups (320 ml) water');
ok(a.includes('<span class="lk-frac">1/2</span>'), 'did not wrap the 1/2 fraction');
ok(a.includes('2 <span'), 'the whole number 2 was swept into the fraction');
ok(a.includes('(320 ml)'), 'the parenthetical (320 ml) was mangled');
ok(!a.includes('320</span>') && !a.includes('>320'), '320 was wrapped as a fraction');

const b = R.frac('3/4 tsp salt');
ok(b === '<span class="lk-frac">3/4</span> tsp salt', `bare leading fraction wrong: ${b}`);

console.log('RECIPE · non-fractions are left alone');
ok(R.frac('simmer 90 minutes') === 'simmer 90 minutes', 'wrapped text with no fraction');
ok(R.frac('reduce by half') === 'reduce by half', 'wrapped prose with no fraction');
ok(!/lk-frac/.test(R.frac('1:30 on the clock')), 'a time (1:30) was treated as a fraction');

console.log('RECIPE · the wrapped text escapes HTML');
ok(R.frac('a < b & c') === 'a &lt; b &amp; c', 'did not escape HTML in the surrounding text');

console.log(`\nRECIPE · ${checks - fails}/${checks} checks passing.`);
if (fails) {
  console.error(`FAILED: ${fails} recipe-notation violation(s).`);
  process.exit(1);
}
console.log('All recipe-notation checks passing.');
