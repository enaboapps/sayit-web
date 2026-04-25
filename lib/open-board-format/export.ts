import JSZip from 'jszip';
import { BoardSummary } from '@/app/components/phrases/types';
import { ExportableBoard, OPEN_BOARD_FORMAT, OpenBoardFile, OpenBoardManifest, OpenBoardExportOptions } from './types';

const DEFAULT_COLUMNS = 4;

export function boardToOpenBoardFile(board: ExportableBoard, options: OpenBoardExportOptions = {}): OpenBoardFile {
  const columns = board.phrases.length > 0 ? (options.columns ?? DEFAULT_COLUMNS) : 1;
  const rows = Math.max(1, Math.ceil(board.phrases.length / columns));
  const buttons = board.phrases.map((phrase, index) => {
    const id = `button_${sanitizeId(phrase.id || String(index))}`;
    const imageId = phrase.symbolUrl ? `image_${sanitizeId(phrase.id || String(index))}` : undefined;

    return {
      id,
      label: phrase.text,
      vocalization: phrase.text,
      ...(imageId ? { image_id: imageId } : {}),
    };
  });

  const images = board.phrases
    .map((phrase, index) => phrase.symbolUrl
      ? {
        id: `image_${sanitizeId(phrase.id || String(index))}`,
        width: 300,
        height: 300,
        content_type: 'image/png',
        url: phrase.symbolUrl,
      }
      : null)
    .filter((image): image is NonNullable<typeof image> => image !== null);

  const buttonIds = buttons.map((button) => button.id);
  const order = Array.from({ length: rows }, (_, rowIndex) => (
    Array.from({ length: columns }, (_, columnIndex) => {
      const button = buttonIds[rowIndex * columns + columnIndex];
      return button ?? null;
    })
  ));

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

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_');
}
