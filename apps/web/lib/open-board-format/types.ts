import type { BoardSummary, BoardTileSummary } from '@/app/components/phrases/types';

export const OPEN_BOARD_FORMAT = 'open-board-0.1';
export const MAX_IMPORT_BOARDS = 50;
export const MAX_IMPORT_TILES = 4000;

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

export type NormalizedOpenBoardTile =
  | {
      kind: 'phrase';
      text: string;
      position: number;
      cellRow: number;
      cellColumn: number;
      symbolBlob?: Blob;
      sourceButtonId: string;
    }
  | {
      kind: 'navigate';
      label: string;
      position: number;
      cellRow: number;
      cellColumn: number;
      targetSourceId: string;
      sourceButtonId: string;
    };

export interface NormalizedOpenBoardBoard {
  sourceId: string;
  name: string;
  gridRows: number;
  gridColumns: number;
  tiles: NormalizedOpenBoardTile[];
}

export interface NormalizedOpenBoardImport {
  boards: NormalizedOpenBoardBoard[];
  warnings: string[];
}

export interface OpenBoardExportOptions {
  columns?: number;
  locale?: string;
}

export type ExportableBoard = BoardSummary & {
  tiles?: BoardTileSummary[];
};
