// Open Board Format import caps. Single source of truth — both the server
// mutation (`convex/openBoardImport.ts`) and the client-side parser
// (`lib/open-board-format/aacProcessors.ts` via `validateImportLimits`) read
// the same numbers, so bumping a limit here automatically lifts it on both
// sides. Re-exported from `lib/open-board-format/types.ts` for callers that
// already pull from there.
//
// Why these numbers:
// - MAX_IMPORT_BOARDS: real-world AAC packages occasionally ship 100+ boards
//   (large vocabularies with category drill-downs); 150 keeps headroom while
//   preventing a single import from explosively rewriting a user's library.
// - MAX_IMPORT_TILES: 4000 covers typical packages comfortably; the cap is
//   load/UX-driven, not security — the file-size cap below is the real
//   security bound.
// - MAX_OPEN_BOARD_FILE_*: 50 MB ceiling on the raw upload to bound memory
//   before the parser allocates the whole ArrayBuffer in browser memory.
export const MAX_IMPORT_BOARDS = 150;
export const MAX_IMPORT_TILES = 4000;
export const MAX_OPEN_BOARD_FILE_MB = 50;
export const MAX_OPEN_BOARD_FILE_BYTES = MAX_OPEN_BOARD_FILE_MB * 1024 * 1024;
