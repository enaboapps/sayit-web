import { boardToOpenBoardFile, createOpenBoardZipBlob } from './export';
import { parseOpenBoardUpload } from './files';
import { normalizeOpenBoardPackage } from './import';
import type { OpenBoardProcessorAdapter } from './types';

export const localOpenBoardAdapter: OpenBoardProcessorAdapter = {
  parseUpload: parseOpenBoardUpload,
  normalize: normalizeOpenBoardPackage,
  exportBoard: boardToOpenBoardFile,
  exportBoards: createOpenBoardZipBlob,
};
