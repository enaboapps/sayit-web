export interface PhraseSummary {
  id: string;
  text: string;
  symbolUrl?: string;
  symbolStorageId?: string;
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
  | {
      id: string;
      kind: 'phrase';
      position: number;
      phrase: PhraseSummary;
    }
  | {
      id: string;
      kind: 'navigate';
      position: number;
      targetBoardId: string;
      /** Live name of the target board; null when target is missing/deleted. */
      targetBoardName: string | null;
    }
  | {
      id: string;
      kind: 'audio';
      position: number;
      audioLabel: string;
      audioUrl: string | null;
      audioMimeType: string;
      audioDurationMs: number;
      audioByteSize: number;
    };

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
}
