# Contributing to Lokta

## Pull requests

1. Branch from `main`. Keep one logical change per PR.
2. Run the build before opening the PR: `npm run build:tokens && npm run build:site`. Both must pass.
3. Describe what changed and why in the PR body. Plain prose, no marketing filler.
4. Add a `CHANGELOG.md` entry under `Unreleased` (see below).

## Tokens are the source of truth

Edit tokens in `tokens/lokta.tokens.json`, then re-split and rebuild:

```
npm run split:tokens
npm run build:tokens
```

Do not hand-edit anything under `packages/tokens/dist/`. It is generated.

Token values are tuned for WCAG 2.2 AA on every surface in every stock. Do not
change a value without re-checking contrast. If you need a new component-tier
token, alias an existing semantic token. Never introduce a raw hex value in a
component.

## Versioning (semver)

The repo follows [Semantic Versioning](https://semver.org). For a design system:

- **patch**: documentation, build fixes, non-visual changes.
- **minor**: new tokens, new components, new stocks, backward-compatible additions.
- **major**: renamed or removed tokens, changed token values, breaking class
  changes, anything that forces a consumer to update their markup or overrides.

## Changelog

Follow [Keep a Changelog](https://keepachangelog.com). Add your entry under an
`## [Unreleased]` heading using the `Added` / `Changed` / `Deprecated` /
`Removed` / `Fixed` / `Security` groups. On release, the `Unreleased` block is
renamed to the new version with the date, and a fresh `Unreleased` is started.

## Locked vs. customisable

The hard-edged character is intentional: flat surfaces, square caps, miter
joins, no rounded controls by default, no shadows except the modal's single hard
offset. Brand customisation is limited to the documented layer (accent, density,
radius, grain, stock). Proposals that soften the system at large should be
opened as an issue for discussion first.

## Releases

The repo is tagged with SemVer (`v0.1.0`). To cut a release:

1. Run `npm run validate` (token math, design-rule lint, component a11y, visual
   regression) and `npm run build`. All must pass.
2. Move the `Unreleased` block in `CHANGELOG.md` to the new version with the date.
3. Commit, then `git tag vX.Y.Z` and `git push --tags`.
4. `gh release create vX.Y.Z --notes-from-tag` (or paste the changelog section).

The standalone repos (`lokta-css`, `lokta-marp`, `lokta-typst`, `lokta-mermaid`)
are tagged in lockstep. They install from GitHub today
(`npm install github:msradam/lokta-css`); to publish to npm, set the package
`name`/`version`, then `npm publish --access public` per package.
