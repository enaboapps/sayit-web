import JSZip from 'jszip';
import { BoardSummary, BoardTileSummary } from '@/app/components/phrases/types';
import { ExportableBoard, OPEN_BOARD_FORMAT, OpenBoardExportOptions, OpenBoardFile, OpenBoardManifest } from './types';

const DEFAULT_COLUMNS = 4;

export function boardToOpenBoardFile(board: ExportableBoard, options: OpenBoardExportOptions = {}): OpenBoardFile {
  const tiles = getExportableTiles(board);
  const fixedRows = board.layoutMode === 'fixedGrid' ? board.gridRows : undefined;
  const fixedColumns = board.layoutMode === 'fixedGrid' ? board.gridColumns : undefined;
  const columns = fixedColumns ?? (tiles.length > 0 ? (options.columns ?? DEFAULT_COLUMNS) : 1);
  const rows = fixedRows ?? Math.max(1, Math.ceil(tiles.length / columns));

  // Buttons reference images by id. Build a phrase.id -> imageId map so two
  // tiles wired to the same phrase produce ONE images[] entry (the OBF spec
  // explicitly allows multiple buttons to share an image_id, and emitting
  // duplicates inflates the export and confuses downstream importers about
  // whether the assets are intentionally distinct).
  const imageIdByPhraseId = new Map<string, string>();
  for (const [index, tile] of tiles.entries()) {
    if (tile.kind !== 'phrase' || !tile.phrase.symbolUrl) continue;
    const phraseId = tile.phrase.id || `tile_${index}`;
    if (imageIdByPhraseId.has(phraseId)) continue;
    imageIdByPhraseId.set(phraseId, `image_${sanitizeId(phraseId)}`);
  }

  const buttons = tiles.map((tile, index) => {
    const id = `button_${sanitizeId(tile.id || String(index))}`;
    const label = labelForTile(tile);
    const imageId = tile.kind === 'phrase' && tile.phrase.symbolUrl
      ? imageIdByPhraseId.get(tile.phrase.id || `tile_${index}`)
      : undefined;

    return {
      id,
      label,
      vocalization: tile.kind === 'phrase' ? tile.phrase.text : label,
      ...(imageId ? { image_id: imageId } : {}),
      ...(tile.kind === 'navigate'
        ? { load_board: { id: `sayit_${sanitizeId(tile.targetBoardId)}` } }
        : {}),
    };
  });

  const seenImageIds = new Set<string>();
  const images = tiles.flatMap((tile, index) => {
    if (tile.kind !== 'phrase' || !tile.phrase.symbolUrl) return [];
    const imageId = imageIdByPhraseId.get(tile.phrase.id || `tile_${index}`);
    if (!imageId || seenImageIds.has(imageId)) return [];
    seenImageIds.add(imageId);
    return [{
      id: imageId,
      width: 300,
      height: 300,
      content_type: 'image/png',
      url: tile.phrase.symbolUrl,
    }];
  });

  const order = Array.from({ length: rows }, () => Array.from({ length: columns }, () => null as string | null));
  tiles.forEach((tile, index) => {
    const row = typeof tile.cellRow === 'number' ? tile.cellRow : Math.floor(index / columns);
    const column = typeof tile.cellColumn === 'number' ? tile.cellColumn : index % columns;
    if (row >= 0 && row < rows && column >= 0 && column < columns) {
      order[row][column] = buttons[index].id;
    }
  });

  return {
    format: OPEN_BOARD_FORMAT,
    id: `sayit_${sanitizeId(board.id)}`,
    locale: options.locale ?? 'en',
    name: board.name,
    default_layout: 'landscape',
    license: { type: 'private' },
    buttons,
    images,
    sounds: [],
    grid: {
      rows,
      columns,
      order,
    },
  };
}

export function createOpenBoardBlob(board: BoardSummary) {
  return new Blob([JSON.stringify(boardToOpenBoardFile(board), null, 2)], {
    type: 'application/json',
  });
}

export async function createOpenBoardZipBlob(boards: BoardSummary[]) {
  const zip = new JSZip();
  const boardPaths: Record<string, string> = {};
  const exportedBoards = boards.map((board) => boardToOpenBoardFile(board));

  exportedBoards.forEach((board) => {
    const path = `boards/${board.id}.obf`;
    boardPaths[board.id] = path;
    zip.file(path, JSON.stringify(board, null, 2));
  });

  const manifest: OpenBoardManifest = {
    format: OPEN_BOARD_FORMAT,
    root: exportedBoards[0] ? boardPaths[exportedBoards[0].id] : 'boards/empty.obf',
    paths: {
      boards: boardPaths,
    },
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function filenameForBoard(boardName: string, extension: 'obf' | 'obz') {
  const base = boardName
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'sayit-board';

  return `${base}.${extension}`;
}

function getExportableTiles(board: ExportableBoard): BoardTileSummary[] {
  if (board.tiles && board.tiles.length > 0) return board.tiles;
  return board.phrases.map((phrase, index) => ({
    id: phrase.id,
    kind: 'phrase',
    position: index,
    phrase,
  }));
}

function labelForTile(tile: BoardTileSummary) {
  if (tile.kind === 'phrase') return tile.phrase.text;
  if (tile.kind === 'navigate') return tile.targetBoardName ?? 'Go to board';
  return tile.audioLabel;
}

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_');
}
