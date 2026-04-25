import type { BoardSummary } from '@/app/components/phrases/types';

export const OPEN_BOARD_FORMAT = 'open-board-0.1';
export const MAX_OPEN_BOARD_FILE_MB = 100;
export const MAX_OPEN_BOARD_FILE_BYTES = MAX_OPEN_BOARD_FILE_MB * 1024 * 1024;
export const MAX_IMPORT_BOARDS = 50;
export const MAX_IMPORT_PHRASES = 2000;

export interface OpenBoardLicense {
  type?: string;
  copyright_notice_url?: string;
  source_url?: string;
  author_name?: string;
  author_url?: string;
  author_email?: string;
  uneditable?: boolean;
}

export interface OpenBoardGrid {
  rows: number;
  columns: number;
  order: Array<Array<string | null>>;
}

export interface OpenBoardButton {
  id: string;
  label: string;
  vocalization?: string;
  image_id?: string;
  sound_id?: string;
  hidden?: boolean;
  background_color?: string;
  border_color?: string;
  action?: string;
  actions?: string[];
  load_board?: {
    id?: string;
    path?: string;
    url?: string;
    data_url?: string;
  };
}

export interface OpenBoardImage {
  id: string;
  width?: number;
  height?: number;
  content_type?: string;
  data?: string;
  url?: string;
  path?: string;
  symbol?: Record<string, unknown>;
  license?: OpenBoardLicense;
}

export interface OpenBoardSound {
  id: string;
  duration?: number;
  content_type?: string;
  data?: string;
  url?: string;
  path?: string;
  license?: OpenBoardLicense;
}

export interface OpenBoardFile {
  format: string;
  id: string;
  locale: string;
  url?: string;
  data_url?: string;
  name?: string;
  description_html?: string;
  default_layout?: string;
  buttons: OpenBoardButton[];
  images: OpenBoardImage[];
  sounds: OpenBoardSound[];
  grid: OpenBoardGrid;
  license?: OpenBoardLicense;
}

export interface OpenBoardManifest {
  format: string;
  root: string;
  paths: {
    boards: Record<string, string>;
    images?: Record<string, string>;
    sounds?: Record<string, string>;
  };
}

export interface ParsedOpenBoardPackage {
  boards: OpenBoardFile[];
  manifest?: OpenBoardManifest;
  imageBlobs: Map<string, Blob>;
  warnings: string[];
}

export interface NormalizedOpenBoardPhrase {
  text: string;
  position: number;
  symbolBlob?: Blob;
  sourceButtonId: string;
}

export interface NormalizedOpenBoardBoard {
  sourceId: string;
  name: string;
  phrases: NormalizedOpenBoardPhrase[];
}

export interface NormalizedOpenBoardImport {
  boards: NormalizedOpenBoardBoard[];
  warnings: string[];
}

export interface OpenBoardExportOptions {
  columns?: number;
  locale?: string;
}

export type ExportableBoard = BoardSummary;

export interface OpenBoardProcessorAdapter {
  parseUpload(file: File): Promise<ParsedOpenBoardPackage>;
  normalize(pkg: ParsedOpenBoardPackage): NormalizedOpenBoardImport;
  exportBoard(board: ExportableBoard, options?: OpenBoardExportOptions): OpenBoardFile;
  exportBoards(boards: ExportableBoard[]): Promise<Blob>;
}
