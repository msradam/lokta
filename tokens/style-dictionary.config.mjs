// Style Dictionary v4 build. Consumes the split Lokta token sets and emits
// per-theme CSS custom properties, SCSS, and a flat JS map (Carbon-style
// outputs), then concatenates the four CSS themes into one drop-in file.
//
//   npm i -D style-dictionary @tokens-studio/sd-transforms
//   node tokens/style-dictionary.config.mjs
//
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

register(StyleDictionary);

// Kebab name transform that collapses the `type-scale` primitive group to the
// reference's `--type-*` names (e.g. type-scale.xs -> --type-xs). Names only;
// token values are untouched.
StyleDictionary.registerTransform({
  name: 'name/lokta-kebab',
  type: 'name',
  transform: (token) => {
    const path = token.path[0] === 'type-scale' ? ['type', ...token.path.slice(1)] : token.path;
    return path.join('-').toLowerCase();
  },
});

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const setPath = (s) => join(here, 'sets', `${s}.json`);
const distCss = join(root, 'packages/tokens/dist/css');

// Each theme = the primitives set + one semantic/stock set (see $themes in the JSON).
const THEMES = [
  { name: 'paper', sets: ['primitives', 'semantic-paper'], selector: ':root, [data-theme="paper"]' },
  { name: 'ink', sets: ['primitives', 'semantic-ink'], selector: '[data-theme="ink"]' },
  { name: 'bone', sets: ['primitives', 'stock-bone'], selector: '[data-theme="bone"]' },
  { name: 'indigo', sets: ['primitives', 'stock-indigo'], selector: '[data-theme="indigo"]' },
];

for (const theme of THEMES) {
  const sd = new StyleDictionary({
    source: theme.sets.map(setPath),
    preprocessors: ['tokens-studio'],
    log: { verbosity: 'silent' },
    platforms: {
      css: {
        transformGroup: 'tokens-studio',
        transforms: ['name/lokta-kebab'],
        buildPath: 'packages/tokens/dist/css/',
        files: [
          {
            destination: `lokta.${theme.name}.css`,
            format: 'css/variables',
            options: { selector: theme.selector, outputReferences: true },
          },
        ],
      },
      scss: {
        transformGroup: 'tokens-studio',
        transforms: ['name/lokta-kebab'],
        buildPath: 'packages/tokens/dist/scss/',
        files: [{ destination: `_lokta.${theme.name}.scss`, format: 'scss/variables' }],
      },
      js: {
        transformGroup: 'tokens-studio',
        transforms: ['name/camel'],
        buildPath: 'packages/tokens/dist/js/',
        files: [{ destination: `lokta.${theme.name}.js`, format: 'javascript/es6' }],
      },
    },
  });
  await sd.buildAllPlatforms();
}

// Combined all-in-one drop-in: every theme's selector block in one file.
const combined =
  ['/* Lokta tokens. All four themes. Generated. Do not edit. */', '']
    .concat(
      await Promise.all(
        THEMES.map(async (t) => (await readFile(join(distCss, `lokta.${t.name}.css`), 'utf8')).trim()),
      ),
    )
    .join('\n') + '\n';
await writeFile(join(distCss, 'lokta.css'), combined);

console.log('Built Lokta tokens for', THEMES.map((t) => t.name).join(', '), '+ combined lokta.css');
