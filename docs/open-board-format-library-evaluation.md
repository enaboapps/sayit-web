# Open Board Format Library Evaluation

## Summary

PR #599 adds Open Board Format import and export support with a local TypeScript implementation backed by `jszip`. The local implementation is intentionally narrow: it supports `.obf` JSON files, `.obz` packages, SayIt's board and phrase model, Convex symbol uploads, user-facing import warnings, and deterministic `.obf`/`.obz` export.

`@willwade/aac-processors` is a relevant future candidate because it is a TypeScript AAC processing library with OBF/OBZ support and a browser-safe entry point. It should not be added as a dependency in this PR until its license position is clarified.

## Current Implementation

SayIt's current implementation keeps the supported surface small and app-specific:

- Parse `.obf` files directly as JSON.
- Parse `.obz` files with `jszip`, requiring `manifest.json` and manifest-listed boards.
- Normalize OBF boards into SayIt boards and phrases.
- Upload embedded/package image assets through existing Convex storage upload URLs.
- Warn and skip unsupported remote image imports, sounds, duplicate phrases, hidden buttons, and linked-board navigation behavior.
- Export the current board as `open-board-0.1`.
- Export all accessible boards as an `.obz` package.

## AACProcessors Capabilities

`@willwade/aac-processors` is technically relevant for this area:

- It provides a browser-safe entry point.
- It lists OBF/OBZ as supported formats.
- It supports broader AAC formats beyond OBF/OBZ, including Snap, Gridset, TouchChat, OPML, Apple Panels, Asterics Grid, and Excel export.

References:

- Repository: https://github.com/willwade/AACProcessors-nodejs
- Documentation: https://willwade.github.io/AACProcessors-nodejs/
- Package metadata: https://raw.githubusercontent.com/willwade/AACProcessors-nodejs/main/package.json
- Repository license file: https://raw.githubusercontent.com/willwade/AACProcessors-nodejs/main/LICENSE

## Blockers

The package should not be added to SayIt until these issues are resolved:

- The npm/package metadata reports `MIT`, while the GitHub repository license file is GPL-3.0. SayIt is closed-source, so GPL-3.0 compatibility is a blocker without explicit legal approval or maintainer clarification.
- The package has a broad dependency graph, including SQLite-related packages. The browser entry may avoid Node-only runtime paths, but this still needs bundle and build validation before adoption.
- SayIt still needs app-specific behavior regardless of parser library: Convex board creation, symbol upload handling, warnings, duplicate handling, linked-board deferral, and UI integration.

## Recommendation

Keep the current local OBF/OBZ implementation in PR #599 and do not install `@willwade/aac-processors` as a runtime dependency in this PR.

PR #599 should include an adapter boundary around the current implementation so a future PR can swap in `@willwade/aac-processors` if the license is clarified and bundle/build impact is acceptable.

After PR #599 merges, open a follow-up issue to:

- confirm the package license with the maintainer or legal review,
- prototype an adapter-backed implementation,
- compare behavior against the current local adapter,
- measure Next.js client bundle impact,
- decide whether broader AAC import support belongs in SayIt.
