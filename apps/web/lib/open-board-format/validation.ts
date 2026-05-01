import { MAX_IMPORT_BOARDS, MAX_IMPORT_TILES } from './types';

export class OpenBoardFormatError extends Error {
  constructor(message: string, public readonly warnings: string[] = []) {
    super(message);
    this.name = 'OpenBoardFormatError';
  }
}

export function validateImportLimits(boardCount: number, tileCount: number) {
  if (boardCount > MAX_IMPORT_BOARDS) {
    throw new OpenBoardFormatError(
      `Import contains ${boardCount} boards; the limit is ${MAX_IMPORT_BOARDS}.`
    );
  }
  if (tileCount > MAX_IMPORT_TILES) {
    throw new OpenBoardFormatError(
      `Import contains ${tileCount} tiles; the limit is ${MAX_IMPORT_TILES}.`
    );
  }
}
