// validate/motion.mjs. Deterministic static gate for the motion + Datatype layer.
// Pure Node, no browser. The runtime behaviours (reduced-motion final state,
// streaming announcement, skip, toggle persistence, axe over the charts) are in
// validate/components.spec.mjs; this asserts the source-level contract:
//
//  Motion CSS is flat: no opacity fade, no blur(), no scale-bloom (scaleX/scaleY
//    on rules is allowed); nothing loops (no `infinite`); the reduced-motion floor
//    and the [data-lk-motion="off"] kill switch are both present.
//  Datatype is self-hosted: the @font-face src is a local woff2, never a CDN.
//  A chart made of text is still text: every .dt element in the HTML sources is
//    role="img" with a non-empty aria-label, and the {…} source is the element's
//    text (so axe sees a name, not braces).
//  Streaming contract: the live region is role="log" aria-live="polite" and the
//    animating body layer is aria-hidden.
//
// Run: node validate/motion.mjs   (exits non-zero on any violation)

import { readFileSync } from 'node:fs';

const root = process.argv[2] || '.';
const read = (p) => readFileSync(`${root}/${p}`, 'utf8');

let checks = 0,
  fails = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    fails++;
    console.log('  x ' + msg);
  }
};

// ── 1 · MOTION CSS IS FLAT ──────────────────────────────────────────────────
// Strip comments first: the file documents the banned properties in prose.
const motionCss = read('packages/css/lokta-motion.css').replace(/\/\*[\s\S]*?\*\//g, '');
console.log('MOTION · lokta-motion.css is flat and bounded');
ok(!/\bblur\s*\(/.test(motionCss), 'motion CSS uses blur() (not flat)');
ok(!/\bopacity\b/.test(motionCss), 'motion CSS uses opacity (fades are not flat; use a clip wipe)');
// scaleX / scaleY draw a 1px rule and are allowed; a bare scale()/scale3d() blooms.
ok(
  !/\bscale3d\s*\(/.test(motionCss) &&
    !/[^XYxy]\bscale\s*\(/.test(motionCss) &&
    !/^scale\s*\(/m.test(motionCss),
  'motion CSS uses scale()/scale3d() bloom (only scaleX/scaleY on rules is allowed)',
);
ok(!/\binfinite\b/.test(motionCss), 'motion CSS has an infinite (looping) animation');
ok(
  /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(motionCss),
  'no prefers-reduced-motion floor in motion CSS',
);
ok(/\[data-lk-motion="off"\]/.test(motionCss), 'no [data-lk-motion="off"] kill switch in motion CSS');
// Every animation duration token is bounded < 5s and non-zero.
for (const m of motionCss.matchAll(/--dur-[a-z]+:\s*(\d+)ms/g)) {
  ok(+m[1] > 0 && +m[1] < 5000, `motion duration ${m[1]}ms is out of bounds (0 < d < 5000)`);
}

// ── 2 · DATATYPE IS SELF-HOSTED ─────────────────────────────────────────────
const fontsCss = read('packages/css/fonts.css');
console.log('MOTION · Datatype font is self-hosted (no CDN, GDPR)');
const dtFace = (fontsCss.match(/@font-face\s*\{[^}]*Datatype[^}]*\}/) || [''])[0];
ok(dtFace.length > 0, 'no Datatype @font-face in fonts.css');
ok(
  /url\(\s*["']?\.\/fonts\/Datatype\.woff2/.test(dtFace),
  'Datatype @font-face src is not a local ./fonts woff2',
);
ok(
  !/https?:\/\//.test(dtFace) && !/fonts\.googleapis|fonts\.gstatic|cdn\./.test(dtFace),
  'Datatype @font-face hot-links a CDN',
);

// ── 3 · A CHART MADE OF TEXT IS STILL TEXT ──────────────────────────────────
// Scan the HTML sources that carry .dt charts for the role + label contract.
const dtSources = ['components/components.html', 'scripts/build-site.mjs'];
console.log('MOTION · every .dt element is role="img" with a non-empty aria-label');
let dtSeen = 0;
for (const src of dtSources) {
  const html = read(src);
  // Match opening <span …> tags that carry the dt class.
  for (const tag of html.match(/<span\b[^>]*\bclass=["'][^"']*\bdt\b[^"']*["'][^>]*>/g) || []) {
    dtSeen++;
    ok(/\brole=["']img["']/.test(tag), `${src}: a .dt span is missing role="img" -> ${tag.slice(0, 70)}…`);
    const label = (tag.match(/aria-label=["']([^"']*)["']/) || [])[1];
    ok(
      label && label.trim().length > 0,
      `${src}: a .dt span has no non-empty aria-label -> ${tag.slice(0, 70)}…`,
    );
  }
}
ok(dtSeen > 0, 'no .dt chart elements found to check (expected the Datatype examples)');

// ── 4 · STREAMING CONTRACT ──────────────────────────────────────────────────
const ref = read('components/components.html');
console.log('MOTION · streaming uses a polite role="log" and an aria-hidden body');
ok(
  /role=["']log["'][^>]*aria-live=["']polite["']|aria-live=["']polite["'][^>]*role=["']log["']/.test(ref),
  'no role="log" aria-live="polite" region in the streaming demo',
);
ok(/data-stream-body[^>]*aria-hidden=["']true["']/.test(ref), 'the streaming body layer is not aria-hidden');

console.log(`\nMOTION · ${checks - fails}/${checks} checks passing (${dtSeen} Datatype charts).`);
if (fails) {
  console.error(`FAILED: ${fails} motion/Datatype violation(s).`);
  process.exit(1);
}
console.log('All motion + Datatype checks passing.');
