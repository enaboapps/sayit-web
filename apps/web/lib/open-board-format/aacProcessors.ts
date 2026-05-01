import {
  MAX_OPEN_BOARD_FILE_BYTES,
  MAX_OPEN_BOARD_FILE_MB,
  type NormalizedOpenBoardBoard,
  type NormalizedOpenBoardImport,
  type NormalizedOpenBoardTile,
} from './types';
import { OpenBoardFormatError, validateImportLimits } from './validation';

// `data:image/png;base64,...` -> Blob. Lives here (not in a util) because the
// AAC adapter is the only caller now that the custom OBF parser has been
// retired in favor of @willwade/aac-processors.
function dataUriToBlob(dataUri: string): Blob {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new OpenBoardFormatError('Image data URI is malformed.');
  const [, contentType, base64] = match;
  const binary = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
}

type AacProcessorButton = {
  id: string;
  label?: string;
  message?: string;
  targetPageId?: string;
  image?: string;
  resolvedImageEntry?: string;
  visibility?: string;
  action?: {
    type?: string;
    targetPageId?: string;
    message?: string;
  } | null;
  semanticAction?: {
    intent?: string;
    text?: string;
    targetId?: string;
    fallback?: {
      type?: string;
      targetPageId?: string;
      message?: string;
    };
  };
  // Recorded sound attached to the button (OBF `sound_id`). The willwade
  // library exposes it as `audioRecording`. We don't import these as audio
  // tiles today — pushing a warning lets users know the data was dropped.
  audioRecording?: unknown;
};

type AacProcessorPage = {
  id: string;
  name?: string;
  grid?: Array<Array<AacProcessorButton | null>>;
  buttons?: AacProcessorButton[];
};

type AacProcessorTree = {
  pages: Record<string, AacProcessorPage>;
  rootId?: string | null;
  metadata?: {
    name?: string;
    format?: string;
    // For .obz packages the library populates this with a `pageId -> entryPath`
    // map so we can resolve `load_board.path`-style navigation targets back
    // to the actual page id used as the cross-board sourceId in the importer.
    _obfPagePaths?: Record<string, string>;
  };
};

const AAC_PROCESSOR_ACCEPT_EXTENSIONS = [
  '.dot',
  '.opml',
  '.obf',
  '.obz',
];

export const AAC_PROCESSOR_ACCEPT = AAC_PROCESSOR_ACCEPT_EXTENSIONS.join(',');

export function canUseAacProcessorsForFile(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return AAC_PROCESSOR_ACCEPT_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export async function normalizeAacProcessorsUpload(file: File): Promise<NormalizedOpenBoardImport> {
  // Refuse oversize files BEFORE reading them into memory. Without this gate
  // a malicious / malformed .obz could OOM the browser tab — the post-parse
  // caps in `validateImportLimits` only fire after JSZip has decompressed
  // every entry. Pair this with the 4000-tile / 50-board caps below.
  if (file.size > MAX_OPEN_BOARD_FILE_BYTES) {
    throw new OpenBoardFormatError(
      `File is larger than the ${MAX_OPEN_BOARD_FILE_MB} MB import limit.`
    );
  }
  const extension = extensionForFile(file.name);
  const [processor, buffer] = await Promise.all([
    processorForExtension(extension),
    file.arrayBuffer(),
  ]);
  const tree = await processor.loadIntoTree(buffer);
  return normalizeAacProcessorsTree(tree as AacProcessorTree);
}

export function normalizeAacProcessorsTree(tree: AacProcessorTree): NormalizedOpenBoardImport {
  const warnings: string[] = [];
  // For .obz packages the willwade library encodes navigation targets as the
  // ZIP entry path (e.g. "boards/food.obf"), but downstream code keys boards
  // by their page id ("food_board"). Build a path -> id reverse map once so
  // each navigation tile can be rewritten. If two pageIds claim the same
  // entryPath (malformed manifest) keep the first and warn — overwriting
  // silently would mean cross-board links land on the wrong destination.
  const pathToPageId = new Map<string, string>();
  const obfPagePaths = tree.metadata?._obfPagePaths;
  if (obfPagePaths) {
    for (const [pageId, entryPath] of Object.entries(obfPagePaths)) {
      const existing = pathToPageId.get(entryPath);
      if (existing && existing !== pageId) {
        warnings.push(
          `Manifest path "${entryPath}" maps to multiple boards (${existing}, ${pageId}); navigation links to "${pageId}" will resolve to "${existing}".`
        );
        continue;
      }
      pathToPageId.set(entryPath, pageId);
    }
  }

  // The set of page ids the importer will actually create. Used below to
  // flag navigation tiles that point at a destination not present in this
  // upload (e.g. a manifest references an external .obf the user didn't
  // include). Without the warning these links silently disappear at import.
  const knownPageIds = new Set(Object.keys(tree.pages));

  const boards = Object.values(tree.pages)
    .filter((page) => Array.isArray(page.grid))
    .map((page) => normalizePage(page, warnings, pathToPageId, knownPageIds));
  const tileCount = boards.reduce((total, board) => total + board.tiles.length, 0);

  validateImportLimits(boards.length, tileCount);

  return { boards, warnings };
}

function normalizePage(
  page: AacProcessorPage,
  warnings: string[],
  pathToPageId: Map<string, string>,
  knownPageIds: Set<string>
): NormalizedOpenBoardBoard {
  const grid = page.grid ?? [];
  const rows = Math.max(1, grid.length);
  const columns = Math.max(1, ...grid.map((row) => row.length));
  const seenCells = new Set<string>();
  const tiles: NormalizedOpenBoardTile[] = [];
  const boardLabel = page.name?.trim() || page.id;

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
    const row = grid[rowIndex];
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const button = row[columnIndex];
      if (!button || isHidden(button)) continue;

      const cellKey = `${rowIndex}:${columnIndex}`;
      if (seenCells.has(cellKey)) continue;
      seenCells.add(cellKey);

      // OBF buttons can carry a recorded sound (`sound_id` -> resolved by
      // the library to `audioRecording`). We don't import these as native
      // audio tiles today; warn the user that the audio data was dropped
      // so they aren't surprised by silent buttons in the imported board.
      if (button.audioRecording) {
        warnings.push(
          `${boardLabel}: dropped audio for "${labelForButton(button) || button.id}" — recorded sounds are not imported.`
        );
      }

      const position = rowIndex * columns + columnIndex;
      const rawTarget = navigationTarget(button);
      // Rewrite ZIP-path navigation targets to the actual page id when
      // possible. If the target wasn't a known path, leave it alone so any
      // future processor that emits ids directly still works.
      const targetSourceId = rawTarget ? pathToPageId.get(rawTarget) ?? rawTarget : undefined;
      if (targetSourceId) {
        // The importer drops navigate tiles whose target isn't in the upload.
        // Surface that as a warning so users know why a link "disappeared"
        // instead of silently shipping a broken board.
        if (!knownPageIds.has(targetSourceId)) {
          warnings.push(
            `${boardLabel}: dropped navigation tile "${labelForButton(button) || button.id}" — target "${rawTarget}" is not in this upload.`
          );
          continue;
        }
        tiles.push({
          kind: 'navigate',
          label: labelForButton(button) || 'Go to board',
          position,
          cellRow: rowIndex,
          cellColumn: columnIndex,
          targetSourceId,
          sourceButtonId: button.id,
        });
        continue;
      }

      const text = phraseText(button);
      if (!text) continue;

      tiles.push({
        kind: 'phrase',
        text,
        position,
        cellRow: rowIndex,
        cellColumn: columnIndex,
        symbolBlob: symbolBlobForButton(button, warnings, page.name || page.id, text),
        sourceButtonId: button.id,
      });
    }
  }

  return {
    sourceId: page.id,
    name: page.name?.trim() || 'Imported Board',
    gridRows: rows,
    gridColumns: columns,
    tiles,
  };
}

function extensionForFile(fileName: string) {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  if (!match) throw new Error('Unsupported AAC file type.');
  return match[0];
}

async function processorForExtension(extension: string): Promise<{
  loadIntoTree(input: ArrayBuffer): Promise<unknown>;
}> {
  // Use the `/browser` entry point so the bundler picks `dist/browser/...`
  // instead of the Node bundle. The browser ObfProcessor's zipAdapter detects
  // the runtime: in Node it uses adm-zip, in browser it dynamically imports
  // jszip — keeping client bundles free of `node:fs`/`node:path` references.
  const lib = await import('@willwade/aac-processors/browser');
  switch (extension) {
  case '.dot':
    return new lib.DotProcessor();
  case '.opml':
    return new lib.OpmlProcessor();
  case '.obf':
  case '.obz':
    return new lib.ObfProcessor();
  default:
    throw new Error('Unsupported AAC file type.');
  }
}

function isHidden(button: AacProcessorButton) {
  return button.visibility === 'Hidden' || button.visibility === 'Empty' || button.visibility === 'Disabled';
}

function navigationTarget(button: AacProcessorButton) {
  if (button.targetPageId) return button.targetPageId;
  if (button.action?.type === 'NAVIGATE' && button.action.targetPageId) return button.action.targetPageId;
  if (button.semanticAction?.targetId) return button.semanticAction.targetId;
  if (
    button.semanticAction?.fallback?.type === 'NAVIGATE' &&
    button.semanticAction.fallback.targetPageId
  ) {
    return button.semanticAction.fallback.targetPageId;
  }
  return undefined;
}

function labelForButton(button: AacProcessorButton) {
  return button.label?.trim() || button.message?.trim() || button.semanticAction?.text?.trim() || '';
}

function phraseText(button: AacProcessorButton) {
  return button.message?.trim()
    || button.semanticAction?.text?.trim()
    || button.action?.message?.trim()
    || button.label?.trim()
    || '';
}

function symbolBlobForButton(
  button: AacProcessorButton,
  warnings: string[],
  boardName: string,
  phraseTextValue: string
) {
  const image = button.resolvedImageEntry || button.image;
  if (!image || !image.startsWith('data:')) return undefined;

  try {
    return dataUriToBlob(image);
  } catch {
    warnings.push(`${boardName}: could not decode image for "${phraseTextValue}".`);
    return undefined;
  }
}
