export interface TypingTab {
  id: string;              // Unique identifier (nanoid)
  label: string;           // Tab display name (e.g., "Message 1" or text preview)
  text: string;            // The draft content
  createdAt: number;       // Timestamp
  lastModified: number;    // Timestamp
  isCustomLabel: boolean;  // True if user manually renamed the tab
}

export interface TypingTabsState {
  tabs: TypingTab[];
  activeTabId: string | null;
  nextTabNumber: number;   // For auto-naming (Draft 1, Draft 2, etc.)
}
