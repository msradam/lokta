// Lokta themes for Shiki. Shiki consumes TextMate themes, so this just loads the
// shared .tmTheme files (the same source Typst raw blocks and VS Code use).
//   import { loktaThemes } from "@lokta/code/lokta-shiki.mjs";
//   const hl = await createHighlighter({ themes: await loktaThemes(), langs: ["ts"] });
//   hl.codeToHtml(code, { lang: "ts", theme: "lokta-light" });
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const plist = async (name) => {
  // Minimal plist -> Shiki theme: parse name + the settings array.
  const xml = await readFile(join(here, name), 'utf8');
  const settings = [];
  for (const m of xml.matchAll(/<dict>\s*(?:<key>scope<\/key><string>([^<]*)<\/string>\s*)?<key>settings<\/key><dict>([\s\S]*?)<\/dict>\s*<\/dict>/g)) {
    const scope = m[1];
    const s = {};
    const fg = m[2].match(/<key>foreground<\/key><string>([^<]+)<\/string>/);
    const bg = m[2].match(/<key>background<\/key><string>([^<]+)<\/string>/);
    const fs = m[2].match(/<key>fontStyle<\/key><string>([^<]+)<\/string>/);
    if (fg) s.foreground = fg[1];
    if (bg) s.background = bg[1];
    if (fs) s.fontStyle = fs[1];
    settings.push(scope ? { scope, settings: s } : { settings: s });
  }
  const nameM = xml.match(/<key>name<\/key><string>([^<]+)<\/string>/);
  const type = name.includes('dark') ? 'dark' : 'light';
  const bg = settings.find((x) => !x.scope)?.settings;
  return { name: name.includes('dark') ? 'lokta-dark' : 'lokta-light', displayName: nameM?.[1], type, settings, bg: bg?.background, fg: bg?.foreground };
};
export const loktaThemes = async () => [await plist('lokta-light.tmTheme'), await plist('lokta-dark.tmTheme')];
