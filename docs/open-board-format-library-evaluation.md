# Open Board Format Library Evaluation

## Summary

PR #599 adds Open Board Format import and export support. The implementation uses `@willwade/aac-processors` to parse `.obf` and `.obz` uploads into an AAC tree, then maps that parsed tree into SayIt's board and phrase model.

SayIt still keeps app-specific normalization and export code locally because Convex writes, symbol uploads, import warnings, and deterministic SayIt export behavior are product-specific.

## Current Implementation

SayIt's current implementation keeps the supported surface small while delegating file parsing to AACProcessors:

- Parse `.obf` and `.obz` uploads with `@willwade/aac-processors` `ObfProcessor.loadIntoTree()`.
- Convert the resulting `AACTree` pages into SayIt's internal `ParsedOpenBoardPackage`.
- Normalize OBF boards into SayIt boards and phrases.
- Upload embedded/package image assets through existing Convex storage upload URLs.
- Warn and skip unsupported remote image imports, sounds, duplicate phrases, hidden buttons, and linked-board navigation behavior.
- Export the current board as `open-board-0.1`.
- Export all accessible boards as an `.obz` package.

## AACProcessors Capabilities

`@willwade/aac-processors` is used for upload parsing in this PR because:

- It provides a browser-safe entry point.
- It lists OBF/OBZ as supported formats.
- It supports broader AAC formats beyond OBF/OBZ, including Snap, Gridset, TouchChat, OPML, Apple Panels, Asterics Grid, and Excel export.

References:

- Repository: https://github.com/willwade/AACProcessors-nodejs
- Documentation: https://willwade.github.io/AACProcessors-nodejs/
- Package metadata: https://raw.githubusercontent.com/willwade/AACProcessors-nodejs/main/package.json
- Repository license file: https://raw.githubusercontent.com/willwade/AACProcessors-nodejs/main/LICENSE

## License And Permission

The package metadata reports `MIT`, while the GitHub repository license file is GPL-3.0. The project owner has confirmed they know the maintainer and have permission to use the package in SayIt.

This PR records that permission context and intentionally adds the package as a runtime dependency. If the repository license metadata is later corrected upstream, no SayIt code change should be required.

## Remaining Considerations

- The package has a broad dependency graph, including SQLite-related packages used by other AAC formats. SayIt currently imports only the OBF processor path, and the Next.js production build must remain part of verification.
- SayIt still needs app-specific behavior regardless of parser library: Convex board creation, symbol upload handling, warnings, duplicate handling, linked-board deferral, and UI integration.
- Export remains local in this PR to preserve SayIt's deterministic OBF/OBZ output and URL-based symbol export behavior.

## Recommendation

Use `@willwade/aac-processors` for `.obf`/`.obz` parsing in PR #599 through `aacProcessorsOpenBoardAdapter`.

Keep SayIt's local normalization and export layers behind the adapter boundary so future work can expand format support without rewriting Convex/UI integration.
