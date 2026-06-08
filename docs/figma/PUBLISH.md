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
# -> packages/tokens/dist/figma/lokta.variables.json       (14 modes, Org+)
# -> packages/tokens/dist/figma/lokta.variables.pro.json   (10 modes, Professional)
```

Two collections: Lokta Primitives (one mode) and Lokta Semantic (a mode per
stock). References stay as aliases, so the tier graph survives the import. Get it
into a file two ways:

- Tokens Studio plugin: import `tokens/lokta.tokens.json` (DTCG format), then push
  to Figma variables, mapping each stock to a mode.
- Variables REST API: POST the manifest to `POST /v1/files/:file_key/variables`.

Hide the Primitives collection from publishing so consumers build against the
Semantic layer, where theming and AA come for free.

### Plan, seat, and the mode cap (read before paying)

- **Seat.** Running the plugin and building components needs a **Full seat**, not
  the $3 Collab seat (comment-only) or the $12 Dev seat (inspect-only). Cheapest
  Full seat is Professional at **$15/month annual** ($20 monthly).
- **Mode cap.** Figma caps variable modes per collection by plan: Professional
  **10**, Organization **20**, Enterprise 40. Lokta ships **14 stocks**.
  - On **Professional ($15)**, use `lokta.variables.pro.json` (Paper, Ink, Bone,
    Indigo, Manuscript, Highland, Slate, Slate L, Steel, Onyx). It imports without
    trimming.
  - For all 14 stocks, use `lokta.variables.json` on **Organization ($55)**.
- **Publishing** a free Community file does not itself need a paid plan; the paid
  seat is for building the variable-driven library.

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
