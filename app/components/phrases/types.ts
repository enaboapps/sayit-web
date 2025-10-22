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
}
