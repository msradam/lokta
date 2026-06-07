// Install @lokta/typst into the Typst local package directory so it imports as
//   #import "@local/lokta:0.1.0": *
// Typst does not embed package fonts, so the vendored fonts are copied alongside
// and the required --font-path is printed.
import { cp, mkdir } from 'node:fs/promises';
import { homedir, platform } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..', 'packages/typst');

function localPackagesDir() {
  const env = process.env;
  if (platform() === 'win32') return join(env.APPDATA || join(homedir(), 'AppData/Roaming'), 'typst/packages/local');
  if (platform() === 'darwin') return join(homedir(), 'Library/Application Support/typst/packages/local');
  return join(env.XDG_DATA_HOME || join(homedir(), '.local/share'), 'typst/packages/local');
}

const dest = join(localPackagesDir(), 'lokta/0.1.0');
await mkdir(dest, { recursive: true });
for (const f of ['lokta.typ', 'typst.toml']) await cp(join(pkg, f), join(dest, f));
await cp(join(pkg, 'fonts'), join(dest, 'fonts'), { recursive: true });

console.log(`Installed @local/lokta:0.1.0 to ${dest}`);
console.log('Use it:');
console.log('  #import "@local/lokta:0.1.0": *');
console.log(`Compile with the bundled fonts:`);
console.log(`  typst compile --font-path "${join(dest, 'fonts')}" your-doc.typ`);
