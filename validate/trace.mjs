// validate/trace.mjs. Gate for the line-art tracing assets. Pure Node.
// scripts/build-trace.mjs bakes a photo into a vector line drawing on demand;
// the committed SVG must keep the contract an image owes a reader and the system:
//   named      role="img" with a non-empty aria-label (a traced image is still
//              an image; the braces/paths are not a description).
//   themeable  strokes are currentColor with no baked region fills, so the line
//              art picks up the stock.
//   vector     it actually carries contour paths (not an empty or raster shell).
//   sourced    a CREDIT.md records the source and its licence (CC0 here), so a
//              third-party image is never committed without provenance.
// Run: node validate/trace.mjs   (exits non-zero on any violation)

import { readFileSync, existsSync } from 'node:fs';

const SVG = 'docs/trace/trace-sample.svg';
const CREDIT = 'docs/trace/CREDIT.md';

let checks = 0,
  fails = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    fails++;
    console.log('  x ' + msg);
  }
};

console.log('TRACE · the committed line-art asset keeps its contract');
ok(existsSync(SVG), `${SVG} is missing (run scripts/build-trace.mjs)`);
const svg = existsSync(SVG) ? readFileSync(SVG, 'utf8') : '';
ok(/role="img"/.test(svg), 'traced SVG is missing role="img"');
const label = (svg.match(/aria-label="([^"]+)"/) || [])[1];
ok(label && label.trim().length > 10, 'traced SVG has no descriptive aria-label');
const paths = (svg.match(/<path\b/g) || []).length;
ok(paths > 10, `traced SVG has too few contour paths (${paths})`);
ok(/stroke="currentColor"/.test(svg), 'traced SVG does not stroke in currentColor (not themeable)');
ok(!/fill="(?!none)/.test(svg.replace(/fill="none"/g, '')), 'traced SVG still carries baked region fills');
ok(/viewBox="0 0 \d+ \d+"/.test(svg), 'traced SVG has no viewBox (will not scale)');

console.log('TRACE · provenance is recorded');
ok(existsSync(CREDIT), `${CREDIT} is missing (record the source + licence)`);
const credit = existsSync(CREDIT) ? readFileSync(CREDIT, 'utf8') : '';
ok(/CC0|public domain|MIT|CC BY|Open Access/i.test(credit), 'CREDIT.md does not state a licence');

console.log(`\nTRACE · ${checks - fails}/${checks} checks passing (${paths} contour paths).`);
if (fails) {
  console.error(`FAILED: ${fails} trace violation(s).`);
  process.exit(1);
}
console.log('All trace checks passing.');
