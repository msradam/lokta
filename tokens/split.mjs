// Split the canonical Tokens Studio export into one file per token set.
// Each set's *contents* become the file root so paths stay flat
// (primitives.paper.00 -> token path paper.00 -> --paper-00), matching
// tokens/lokta.reference.css. $themes/$metadata are written to $themes.json.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(await readFile(join(here, 'lokta.tokens.json'), 'utf8'));

const sets = ['primitives', 'semantic-paper', 'semantic-ink', 'stock-bone', 'stock-indigo'];

for (const set of sets) {
  if (!src[set]) throw new Error(`missing token set: ${set}`);
  await writeFile(join(here, 'sets', `${set}.json`), JSON.stringify(src[set], null, 2) + '\n');
}

await writeFile(
  join(here, 'sets', '$themes.json'),
  JSON.stringify({ $themes: src.$themes, $metadata: src.$metadata }, null, 2) + '\n',
);

console.log('Split tokens into', sets.length, 'sets:', sets.join(', '));
