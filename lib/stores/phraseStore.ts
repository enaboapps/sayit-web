import { create } from 'zustand';
import { Phrase, PhraseData } from '../models/Phrase';
import { PhraseBoard, PhraseBoardData } from '../models/PhraseBoard';
import { databaseService, Phrase as DatabasePhrase } from '../services/DatabaseService';
import { storageService } from '../services/StorageService';

interface PhraseStore {
  phrases: Phrase[]
  boards: PhraseBoard[]
  loading: boolean
  error: string | null
  fetchPhrases: (userId: string) => Promise<void>
  fetchBoards: (userId: string) => Promise<void>
  addPhrase: (phraseData: Omit<PhraseData, 'id' | 'createdAt' | 'updatedAt'>, boardId: string, symbolUrl: string | null) => Promise<void>
  deletePhrase: (phraseId: string, boardId: string) => Promise<void>
  updatePhrase: (phraseId: string, phraseData: Partial<Omit<PhraseData, 'id' | 'createdAt' | 'updatedAt'>>, symbolUrl: string | null) => Promise<void>
  getPhrase: (userId: string, boardId: string, phraseId: string) => Promise<Phrase | null>
  createPhraseBoard: (userId: string, name: string) => Promise<void>
  getPhraseBoard: (userId: string, boardId: string) => Promise<PhraseBoard | null>
  updatePhraseBoard: (userId: string, boardId: string, updates: Partial<Omit<PhraseBoardData, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deletePhraseBoard: (userId: string, boardId: string) => Promise<void>
}

type SetState = (fn: (state: PhraseStore) => Partial<PhraseStore>) => void

export const phraseStore = create<PhraseStore>((set: SetState) => ({
  phrases: [],
  boards: [],
  loading: false,
  error: null,
  fetchPhrases: async (userId: string) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      const phrases = await databaseService.getPhrases(userId);
      const phraseInstances = await Promise.all(phrases.map(p => Phrase.fromSupabase(p)));
      set((state) => ({ ...state, phrases: phraseInstances, loading: false }));
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to fetch phrases', loading: false }));
      throw err;
    }
  },
  fetchBoards: async (userId: string) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      const boards = await databaseService.getPhraseBoards(userId);
      const phraseBoards = await Promise.all(boards.map(b => PhraseBoard.fromSupabase(b)));
      set((state) => ({ ...state, boards: phraseBoards, loading: false }));
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to fetch boards', loading: false }));
      throw err;
    }
  },
  addPhrase: async (phraseData: Omit<PhraseData, 'id' | 'createdAt' | 'updatedAt'>, boardId: string, symbolUrl: string | null) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      const dbPhraseData: Omit<DatabasePhrase, 'id' | 'created_at' | 'updated_at'> = {
        text: phraseData.text,
        user_id: phraseData.userId,
        symbol_id: phraseData.symbol_id || null,
        frequency: phraseData.frequency || 0,
        position: phraseData.position || 0,
      };
      const newPhrase = await databaseService.addPhrase(dbPhraseData);
      await databaseService.addPhraseToBoard(newPhrase.id, boardId);
      if (symbolUrl) {
        await storageService.uploadSymbol(newPhrase.id, symbolUrl);
      }
      const phraseInstance = await Phrase.fromSupabase(newPhrase);
      set((state) => ({ ...state, phrases: [...state.phrases, phraseInstance], loading: false }));
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to add phrase', loading: false }));
      throw err;
    }
  },
  deletePhrase: async (phraseId: string, boardId: string) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      await databaseService.deletePhrase(phraseId);
      await databaseService.removePhraseFromBoard(phraseId, boardId);
      set((state) => ({
        ...state,
        phrases: state.phrases.filter((p) => p.id !== phraseId),
        loading: false,
      }));
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to delete phrase', loading: false }));
      throw err;
    }
  },
  updatePhrase: async (phraseId: string, phraseData: Partial<Omit<PhraseData, 'id' | 'createdAt' | 'updatedAt'>>, symbolUrl: string | null) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      const dbPhraseData: Partial<Omit<DatabasePhrase, 'id' | 'created_at' | 'updated_at'>> = {
        text: phraseData.text,
        user_id: phraseData.userId,
        symbol_id: phraseData.symbol_id || null,
        frequency: phraseData.frequency,
        position: phraseData.position,
      };
      const updatedPhrase = await databaseService.updatePhrase(phraseId, dbPhraseData);
      if (symbolUrl) {
        await storageService.uploadSymbol(phraseId, symbolUrl);
      }
      const phraseInstance = await Phrase.fromSupabase(updatedPhrase);
      set((state) => ({
        ...state,
        phrases: state.phrases.map((p) => (p.id === phraseId ? phraseInstance : p)),
        loading: false,
      }));
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to update phrase', loading: false }));
      throw err;
    }
  },
  getPhrase: async (userId: string, boardId: string, phraseId: string) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      const phrase = await databaseService.getPhrase(phraseId);
      set((state) => ({ ...state, loading: false }));
      return phrase ? await Phrase.fromSupabase(phrase) : null;
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to get phrase', loading: false }));
      throw err;
    }
  },
  createPhraseBoard: async (userId: string, name: string) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      const board = await databaseService.addPhraseBoard({
        name,
        user_id: userId,
        position: 0,
      });
      const phraseBoard = await PhraseBoard.fromSupabase(board);
      set((state) => ({ ...state, boards: [...state.boards, phraseBoard], loading: false }));
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to create board', loading: false }));
      throw err;
    }
  },
  getPhraseBoard: async (userId: string, boardId: string) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      const board = await databaseService.getPhraseBoard(boardId);
      set((state) => ({ ...state, loading: false }));
      return board ? await PhraseBoard.fromSupabase(board) : null;
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to get board', loading: false }));
      throw err;
    }
  },
  updatePhraseBoard: async (userId: string, boardId: string, updates: Partial<Omit<PhraseBoardData, 'id' | 'createdAt' | 'updatedAt'>>) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      const dbBoardData = {
        name: updates.name,
        user_id: userId,
        position: updates.position || 0,
      };
      const updatedBoard = await databaseService.updatePhraseBoard(boardId, dbBoardData);
      const phraseBoard = await PhraseBoard.fromSupabase(updatedBoard);
      set((state) => ({
        ...state,
        boards: state.boards.map((b) => (b.id === boardId ? phraseBoard : b)),
        loading: false,
      }));
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to update board', loading: false }));
      throw err;
    }
  },
  deletePhraseBoard: async (userId: string, boardId: string) => {
    set((state) => ({ ...state, loading: true, error: null }));
    try {
      await databaseService.deletePhraseBoard(boardId);
      set((state) => ({
        ...state,
        boards: state.boards.filter((b) => b.id !== boardId),
        loading: false,
      }));
    } catch (err) {
      set((state) => ({ ...state, error: 'Failed to delete board', loading: false }));
      throw err;
    }
  },
}));
