import type { AacLayoutMode, AacLayoutPreset, TileRole, WordClass } from '@/lib/aacLayout';

export interface PhraseSummary {
  id: string;
  text: string;
  symbolUrl?: string;
  symbolStorageId?: string;
}

export interface TileLayoutSummary {
  cellRow?: number;
  cellColumn?: number;
  cellRowSpan?: number;
  cellColumnSpan?: number;
  tileRole?: TileRole;
  wordClass?: WordClass;
  isLocked?: boolean;
}

/**
 * Polymorphic UI representation of a single tile placed on a board.
 *
 * Mirrors the shape returned by `convex/phraseBoards.getPhraseBoard` /
 * `convex/boardTiles.listByBoard` but decoupled from Convex Id types so
 * presentational components stay framework-agnostic.
 *
 * Adding a new tile kind: add a member to this union, add a render branch
 * in BoardTileRenderer, add a form for creating/editing it.
 */
export type BoardTileSummary =
  | ({
      id: string;
      kind: 'phrase';
      position: number;
      phrase: PhraseSummary;
    } & TileLayoutSummary)
  | ({
      id: string;
      kind: 'navigate';
      position: number;
      targetBoardId: string;
      /** Live name of the target board; null when target is missing/deleted. */
      targetBoardName: string | null;
    } & TileLayoutSummary)
  | ({
      id: string;
      kind: 'audio';
      position: number;
      audioLabel: string;
      audioUrl: string | null;
      audioMimeType: string;
      audioDurationMs: number;
      audioByteSize: number;
    } & TileLayoutSummary);

export interface BoardSummary {
  id: string;
  name: string;
  position?: number;
  phrases: PhraseSummary[];
  tiles?: BoardTileSummary[];
  isShared?: boolean;
  isOwner?: boolean;
  accessLevel?: 'view' | 'edit';
  sharedBy?: string | null;
  forClientId?: string | null;
  forClientName?: string | null;
  layoutMode?: AacLayoutMode;
  layoutPreset?: AacLayoutPreset;
  gridRows?: number;
  gridColumns?: number;
  layoutVersion?: number;
  sourceTemplate?: 'sayitCoreV1' | 'custom';
  /**
   * When true, the board is omitted from picker UIs (sidebar dropdown,
   * mobile carousel, board grid popup) but remains fully usable through
   * navigate-tile links. Defaults to false. Set automatically by the OBF
   * importer for drill-down boards; user-toggleable from the edit-board page.
   */
  hiddenFromPicker?: boolean;
}
