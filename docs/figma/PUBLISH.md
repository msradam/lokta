# Publishing Lokta to the Figma Community

What only you can do is the final click (it needs your Figma account and profile).
Everything up to it is prepared here. Steps are ordered.

## What publishing involves

A free Community file goes live immediately. There is no human pre-publish review
for a free file or UI kit. The one automated gate is a scan of the cover and
preview images for prohibited content (nudity, violence), which Lokta's editorial
art does not trip. Plugins and widgets get a manual review; a kit file does not.

After it is live, moderation is reactive: human reviewers act on user reports
against three policies, Copyright and IP, Community Guidelines, and Code of
Conduct. So the attention to spend is on IP hygiene, not on a review queue. See
the checklist below.

## 1. Build the variables collections

The token graph is already emitted as a Figma Variables manifest:

```
npm run build:figma
# -> packages/tokens/dist/figma/lokta.variables.json
```

It has two collections: Lokta Primitives (one mode) and Lokta Semantic (a mode
per stock: Paper, Ink, Bone, Indigo). References stay as aliases, so the tier
graph survives the import. Two ways to get it into a file:

- Tokens Studio plugin (any plan): import `tokens/lokta.tokens.json` (DTCG /
  Tokens Studio format), then push to Figma variables. Use the `$themes` to map
  each stock to a mode.
- Enterprise Variables REST API: POST `lokta.variables.json` to
  `POST /v1/files/:file_key/variables`. The manifest is already in that shape.

Hide the Primitives collection from publishing so consumers build against the
Semantic layer, where theming and AA come for free.

## 2. Build the components

Use the live reference as the source of truth for anatomy, states, and spacing:

- Components and accessibility: https://msradam.github.io/lokta/components.html
- Application tier (shell, stat, data viz, marketing): the patterns gallery,
  https://msradam.github.io/lokta/patterns.html

Bind every fill, stroke, text, and radius to a Semantic variable, never a raw
hex, so switching the collection mode re-themes the whole component. Keep the
locked aesthetic: square corners, no blur shadows (the one dialog shadow is a
hard offset), 36px minimum targets.

## 3. Code Connect (optional, links Figma to the CSS)

`figma.config.json` is set for the HTML parser over `packages/css`. Code Connect
maps each Figma component to its `lk-` class. It needs the node IDs from your
published file, so it is a post-publish step:

```
npx figma connect create <figma-node-url>   # scaffold per component
npx figma connect publish
```

Map, for example, the Button component to `.lk-btn` / `.lk-btn-primary`, the
Stat to `.lk-stat`, the Segmented control to `.lk-segment`.

## 4. Listing metadata

All copy is in `docs/figma/listing.md` (name, category, tags, description,
license, support). Cover and carousel images are in `docs/figma/media`
(1920 x 1080); regenerate with `npm run build:figma-media` if components change.
Order: cover (thumbnail), stocks, components, colour, diagram, document, verify.

## 5. IP checklist (the only real exposure)

- Attribution is in the description: drawn from Cuisine on Screen (Sachiyo
  Harada, Prestel) and Siddika Kabir's Ranna Khaddo Pushti, as inspiration, not
  reproduction. No text, photography, or artwork from either book is included.
  Keep this line.
- Fonts are SIL OFL (Archivo, Spline Sans Mono, Source Serif 4, Noto Sans JP,
  Anek Bangla), which permits embedding and redistribution. Do not swap in a
  non-OFL face.
- The cookbook demo on the docs site references film dish names. That demo is a
  web page, not part of this Figma file. If you ever publish the demo as a Figma
  file, genericize the dish and film labels first, since trademarked titles are
  the most reportable surface.
- Ship no screenshots of the source books in the cover or carousel images.

## 6. Publish

Open the file, Share, Publish to Community, paste the listing metadata, attach
the media, set the license, Publish. It is live at once. If you later need a
cached old version purged, that is a GitHub or Figma support request, not a
publish setting.
