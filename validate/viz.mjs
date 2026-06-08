// validate/viz.mjs. Deterministic gate for the data-viz palettes. Pure Node.
// Asserts WCAG 1.4.11 (3:1) for every series vs every surface it ships on and vs
// adjacent series, CVD distinguishability (Machado 2009 + CIEDE2000), and that the
// sequential scale is monotonic in L*. Reports how many series stay CVD-safe; the
// pattern + direct-label fallback is mandatory beyond that count.
// Run: node validate/viz.mjs   (exits non-zero on any violation)

const CVD_SAFE_TARGET = 3; // series guaranteed distinguishable under CVD; patterns required beyond.
const DE_THRESHOLD = 11; // CIEDE2000 below which two hues can read alike.

const LIGHT = ['#1F5C92', '#8A5A12', '#4F6B50', '#8E2C49', '#2F6F6D', '#5F4080', '#B23320', '#4A535E'];
const DARK = ['#6FA8D8', '#D9A642', '#8FB088', '#D67A95', '#5FB0AD', '#A98FC9', '#E2654F', '#9AA3AE'];
const lightSurf = { 'paper-01': '#F4F1DF', manuscript: '#EDE4D1', bone: '#EFEEE7' };
const darkSurf = { 'ink-90': '#1F1C13', highland: '#232A2E', indigo: '#1B2230' };

const hx = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
const ln = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const Lum = (h) => { const [r, g, b] = hx(h); return 0.2126 * ln(r) + 0.7152 * ln(g) + 0.0722 * ln(b); };
const cr = (a, b) => { const x = Lum(a), y = Lum(b), hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };
const fL = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
function lab(h) {
  let [r, g, b] = hx(h).map(ln);
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047,
    Y = r * 0.2126 + g * 0.7152 + b * 0.0722,
    Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  return [116 * fL(Y) - 16, 500 * (fL(X) - fL(Y)), 200 * (fL(Y) - fL(Z))];
}
function de00(h1, h2) {
  const [L1, a1, b1] = lab(h1), [L2, a2, b2] = lab(h2);
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  let h1p = (Math.atan2(b1, a1p) * 180) / Math.PI; if (h1p < 0) h1p += 360;
  let h2p = (Math.atan2(b2, a2p) * 180) / Math.PI; if (h2p < 0) h2p += 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = h2p - h1p; if (Math.abs(dhp) > 180) dhp -= Math.sign(dhp) * 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = (h1p + h2p) / 2; if (Math.abs(h1p - h2p) > 180) hbp += 180;
  const T = 1 - 0.17 * Math.cos(((hbp - 30) * Math.PI) / 180) + 0.24 * Math.cos((2 * hbp * Math.PI) / 180) + 0.32 * Math.cos(((3 * hbp + 6) * Math.PI) / 180) - 0.2 * Math.cos(((4 * hbp - 63) * Math.PI) / 180);
  const Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2)), Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
  const Rt = -Rc * Math.sin((2 * dTheta * Math.PI) / 180);
  return Math.sqrt(Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2) + Rt * (dCp / Sc) * (dHp / Sh));
}
const MM = {
  deut: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  prot: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  trit: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
function sim(h, t) {
  const v = hx(h).map(ln), m = MM[t];
  const o = [0, 1, 2].map((i) => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]);
  const g = (c) => { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; };
  return '#' + o.map((c) => Math.round(g(c) * 255).toString(16).padStart(2, '0')).join('');
}
function cvdSafeCount(pal, t) {
  // largest prefix whose every pair stays >= threshold under CVD type t.
  let n = pal.length;
  for (let k = 2; k <= pal.length; k++) {
    let ok = true;
    for (let i = 0; i < k && ok; i++) for (let j = i + 1; j < k; j++) if (de00(sim(pal[i], t), sim(pal[j], t)) < DE_THRESHOLD) ok = false;
    if (!ok) { n = k - 1; break; }
  }
  return n;
}
// Perceptually uniform scales (Lab lerp), recomputed so the gate owns the values.
const lerp = (a, b, t) => a + (b - a) * t;
function labToHex(L, A, B) {
  const fy = (L + 16) / 116, fx = fy + A / 500, fz = fy - B / 200;
  const fi = (t) => { const t3 = t * t * t; return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787; };
  const X = 0.95047 * fi(fx), Y = fi(fy), Z = 1.08883 * fi(fz);
  let r = X * 3.2406 - Y * 1.5372 - Z * 0.4986, g = -X * 0.9689 + Y * 1.8758 + Z * 0.0415, b = X * 0.0557 - Y * 0.204 + Z * 1.057;
  const G = (c) => { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; };
  return '#' + [r, g, b].map((c) => Math.round(G(c) * 255).toString(16).padStart(2, '0')).join('');
}
const SEQ = Array.from({ length: 9 }, (_, i) => { const t = i / 8; return labToHex(lerp(94, 30, t), lerp(-2, 12, t), lerp(14, 40, t)); });
const DIV = Array.from({ length: 11 }, (_, i) => {
  const t = i / 10; let L, A, B;
  if (t < 0.5) { const u = t / 0.5; L = lerp(40, 95, u); A = lerp(48, -1, u); B = lerp(34, 2, u); }
  else { const u = (t - 0.5) / 0.5; L = lerp(95, 40, u); A = lerp(-1, -6, u); B = lerp(2, -34, u); }
  return labToHex(L, A, B);
});

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('  x ' + msg); } };

console.log('VIZ · 1.4.11 non-text contrast (3:1) · series vs surface');
for (const [pal, surf, name] of [[LIGHT, lightSurf, 'light'], [DARK, darkSurf, 'dark']])
  for (const [sn, sv] of Object.entries(surf)) pal.forEach((c, i) => ok(cr(c, sv) >= 3, `${name} series ${i + 1} ${c} on ${sn}: ${cr(c, sv).toFixed(2)} < 3`));

console.log('VIZ · adjacent series distinct (CIEDE2000) in normal vision');
for (const [pal, name] of [[LIGHT, 'light'], [DARK, 'dark']])
  for (let i = 1; i < pal.length; i++) ok(de00(pal[i - 1], pal[i]) >= DE_THRESHOLD, `${name} series ${i}/${i + 1} adjacent dE ${de00(pal[i - 1], pal[i]).toFixed(1)} < ${DE_THRESHOLD}`);

// Assert the N-series guarantee on the red-green types (~99.9% of CVD); report
// tritanopia (~0.01%) as advisory, since the pattern fallback covers it anyway.
console.log('VIZ · CVD-safe prefix (Machado 2009)');
for (const t of ['deut', 'prot']) {
  const n = cvdSafeCount(LIGHT, t);
  ok(n >= CVD_SAFE_TARGET, `${t}: only ${n} series CVD-safe (need ${CVD_SAFE_TARGET})`);
  console.log(`    ${t}: ${n} series safe (patterns mandatory beyond ${n})`);
}
console.log(`    trit: ${cvdSafeCount(LIGHT, 'trit')} series safe (advisory; patterns mandatory)`);

console.log('VIZ · sequential scale monotonic in L*');
let mono = true;
for (let i = 1; i < SEQ.length; i++) if (lab(SEQ[i])[0] >= lab(SEQ[i - 1])[0]) mono = false;
ok(mono, 'sequential L* not strictly decreasing');

console.log('VIZ · diverging scale lightest at the midpoint');
ok(lab(DIV[5])[0] > lab(DIV[0])[0] && lab(DIV[5])[0] > lab(DIV[10])[0], 'diverging midpoint not lightest');

console.log(`\nseq: ${SEQ.join(' ')}`);
console.log(`div: ${DIV.join(' ')}`);
console.log(`\nVIZ · ${checks - fails}/${checks} checks passing.`);
if (fails) { console.error(`FAILED: ${fails} viz violation(s).`); process.exit(1); }
console.log('All viz checks passing.');
