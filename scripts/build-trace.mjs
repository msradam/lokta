// scripts/build-trace.mjs. Trace a raster image into a Lokta line-art SVG.
// The image arm of the system in the cookbook's outline idiom: a photo becomes
// clean vector contours, ink on the stock, not tone or grain.
//
// Run on demand (needs a browser), not part of the default build:
//   node scripts/build-trace.mjs <input.jpg> <output.svg> [regions] [alt text]
//
// Uses the vendored imagetracerjs (MIT, vendor/imagetracer.js) in a headless
// page (Playwright is already a devDependency). Deterministic given fixed
// options, so the committed SVG is reproducible from a license-clean source.
// Every region becomes a currentColor stroke (fill:none), so the line art
// themes with the stock; the <svg> carries role="img" + the alt you pass.
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const [input, output, regionsArg, ...altParts] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node scripts/build-trace.mjs <input> <output.svg> [regions] [alt text]');
  process.exit(1);
}
const regions = +regionsArg || 6;
const alt = altParts.join(' ') || 'line-art tracing';
// Tuning knobs (env): smaller width + higher path-omit + more blur => fewer,
// cleaner contour lines and a far smaller inline-able SVG.
const TW = +process.env.TRACE_W || 460;
const PATHOMIT = +process.env.TRACE_PATHOMIT || 8;
const BLUR = +process.env.TRACE_BLUR || 2;

const imgBuf = await readFile(input);
const mime = input.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
const dataUrl = `data:${mime};base64,${imgBuf.toString('base64')}`;
const tracer = await readFile(new URL('../vendor/imagetracer.js', import.meta.url), 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>');
await page.addScriptTag({ content: tracer });
const raw = await page.evaluate(
  async ({ dataUrl, regions, TW, PATHOMIT, BLUR }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const TH = Math.round((TW * img.naturalHeight) / img.naturalWidth);
    const cv = document.createElement('canvas');
    cv.width = TW;
    cv.height = TH;
    cv.getContext('2d').drawImage(img, 0, 0, TW, TH);
    const id = cv.getContext('2d').getImageData(0, 0, TW, TH);
    // eslint-disable-next-line no-undef
    const svg = ImageTracer.imagedataToSVG(id, {
      numberofcolors: regions,
      ltres: 1.5,
      qtres: 1.5,
      pathomit: PATHOMIT,
      blurradius: BLUR,
      blurdelta: 20,
      linefilter: true,
      rightangleenhance: false,
    });
    return { svg, w: TW, h: TH };
  },
  { dataUrl, regions, TW, PATHOMIT, BLUR },
);
await browser.close();

// Recolour to a themeable line drawing: strip every region fill, stroke the
// boundaries in currentColor, add a viewBox + role="img" + the accessible name.
let svg = raw.svg.replace(
  /<svg\b[^>]*>/,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${raw.w} ${raw.h}" class="lk-trace-svg" role="img" aria-label="${alt.replace(/"/g, '&quot;')}">`,
);
let strokes = 0;
svg = svg.replace(/<path\b([^>]*?)\/?>/g, (m, attrs) => {
  const d = (attrs.match(/\sd="[^"]*"/) || [''])[0];
  if (!d) return m;
  strokes++;
  return `<path${d} fill="none" stroke="currentColor" stroke-width="0.6" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>`;
});
svg = svg.replace(/<\/path>/g, '');

await writeFile(output, svg);
console.log(
  `traced ${input} -> ${output} (${regions} regions, ${strokes} contour paths, ${(svg.length / 1024).toFixed(1)} KB)`,
);
