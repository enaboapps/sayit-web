export interface PhraseSummary {
  id: string;
  text: string;
  frequency?: number;
}

export interface BoardSummary {
  id: string;
  name: string;
  position?: number;
  phrases: PhraseSummary[];
  isShared?: boolean;
  isOwner?: boolean;
  accessLevel?: 'view' | 'edit';
  sharedBy?: string | null;
  forClientId?: string | null;
  forClientName?: string | null;
}
