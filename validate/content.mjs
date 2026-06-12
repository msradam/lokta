// validate/content.mjs. Deterministic gate for the Lokta voice, drawn from the
// editorial grammar of the source cookbook (Cuisine on Screen, Prestel). Pure
// Node. Checks the product copy, not the code around it:
//   voice      no marketing filler (the book never sells; neither do we).
//   inclusive  no blacklist/whitelist/master-slave.
//   links      descriptive link text, never "click here" / "read more".
//   "and"      Lokta's own labels spell out "and", never "&" (the book does:
//              "Soups, Stews, and Noodles"). Proper titles keep their real
//              punctuation, so the example templates (film and dish names like
//              "Julie & Julia") are exempt.
// Em dashes are allowed: the book uses them, so the voice does too.
// Run: node validate/content.mjs   (exits non-zero on any violation)

import { readFileSync } from 'node:fs';

// HTML chrome whose visible copy is Lokta's own (the "and" rule applies).
const CHROME = ['components/components.html', 'proof/lokta-verification.html'];
// Product copy that also gets the voice checks, but carries proper-noun titles
// (film and dish names), so it is exempt from the "and" rule.
const TEMPLATES = [
  'templates/dashboard.html',
  'templates/landing.html',
  'templates/cookbook.html',
  'templates/patterns.html',
];
// Generated-site source + docs prose: voice checks only (raw scan is safe here).
const PROSE = ['scripts/build-site.mjs', 'README.md', 'packages/css/README.md'];

const MARKETING =
  /\b(blazingly|blazing[-\s]fast|delightful|seamless(?:ly)?|effortless(?:ly)?|supercharged?|revolutionary|game[-\s]chang(?:er|ing)|cutting[-\s]edge|world[-\s]class|best[-\s]in[-\s]class|unleash|next[-\s]generation|turnkey|synergy|robust yet)\b/i;
const NONINCLUSIVE = /\b(blacklist|whitelist|master\/slave|master-slave)\b/i;
const BAD_LINK = />\s*(click here|read more|learn more|here)\s*<\/a>/i;
const AMP = /[A-Za-z]+\s(?:&|&amp;)\s[A-Za-z]+/;

const read = (p) => readFileSync(p, 'utf8');
// Strip code, style, comments, and tags; decode entities to visible prose.
const visible = (html) =>
  html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<code[\s\S]*?<\/code>/gi, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/g, ' ');

let checks = 0,
  fails = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    fails++;
    console.log('  x ' + msg);
  }
};

console.log('CONTENT · the voice is un-marketed, inclusive, and accessible');
for (const f of [...CHROME, ...TEMPLATES, ...PROSE]) {
  const raw = read(f);
  const text = f.endsWith('.html') ? visible(raw) : raw;
  const m = text.match(MARKETING);
  ok(!m, m && `${f}: marketing word "${m[0]}" (the book never sells; rewrite plainly)`);
  const n = text.match(NONINCLUSIVE);
  ok(!n, n && `${f}: non-inclusive term "${n[0]}" (use allowlist/blocklist, primary/replica)`);
  const l = raw.match(BAD_LINK);
  ok(!l, l && `${f}: non-descriptive link text "${l[0]}" (say where the link goes)`);
}

console.log('CONTENT · Lokta’s own labels spell out "and", never "&"');
for (const f of CHROME) {
  const a = visible(read(f)).match(AMP);
  ok(!a, a && `${f}: "${a[0].trim()}" uses "&" as a conjunction (the book spells out "and")`);
}

console.log(`\nCONTENT · ${checks - fails}/${checks} checks passing.`);
if (fails) {
  console.error(`FAILED: ${fails} content-voice violation(s).`);
  process.exit(1);
}
console.log('All content-voice checks passing.');
