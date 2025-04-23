import { create } from 'zustand'
import { Phrase, PhraseData } from '../models/Phrase'
import { PhraseBoard } from '../models/PhraseBoard'
import { databaseService } from '../services/DatabaseService'
import { Symbol } from '../models/Symbol'
import { storageService } from '../services/StorageService'

interface PhraseStore {
  phrases: Phrase[]
  boards: PhraseBoard[]
  loading: boolean
  error: string | null
  fetchPhrases: (userId: string) => Promise<void>
  fetchBoards: (userId: string) => Promise<void>
  addPhrase: (phrase: PhraseData, boardId: string, symbolUrl: string | null) => Promise<void>
  deletePhrase: (phraseId: string, boardId: string, userId: string) => Promise<void>
  updatePhrase: (phraseId: string, phrase: Phrase, symbolUrl: string | null) => Promise<void>
  getPhrase: (userId: string, boardId: string, phraseId: string) => Promise<Phrase | null>
  createPhraseBoard: (userId: string, name: string) => Promise<void>
  getPhraseBoard: (userId: string, boardId: string) => Promise<PhraseBoard | null>
  updatePhraseBoard: (userId: string, board: PhraseBoard) => Promise<void>
  deletePhraseBoard: (userId: string, boardId: string) => Promise<void>
}

type SetState = (fn: (state: PhraseStore) => Partial<PhraseStore>) => void

export const phraseStore = create<PhraseStore>((set: SetState) => ({
  phrases: [],
  boards: [],
  loading: false,
  error: null,

  fetchPhrases: async (userId: string) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const boards = await databaseService.getPhraseBoards(userId)
      let allPhrases: Phrase[] = []
      
      for (const board of boards) {
        const boardData = await databaseService.getPhraseBoard(board.id)
        if (boardData?.phrase_board_phrases) {
          const phrases = boardData.phrase_board_phrases.map((p: { phrase: any }) => p.phrase)
          console.log('Raw phrases from database:', phrases)
          const convertedPhrases = await Promise.all(phrases.map((p: any) => Phrase.fromSupabase(p)))
          console.log('Converted phrases:', convertedPhrases)
          allPhrases = [...allPhrases, ...convertedPhrases]
        }
      }
      
      set((state) => ({ ...state, phrases: allPhrases, loading: false }))
    } catch (error) {
      console.error('Error fetching phrases:', error)
      set((state) => ({ ...state, error: 'Failed to fetch phrases', loading: false }))
    }
  },

  fetchBoards: async (userId: string) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const boards = await databaseService.getPhraseBoards(userId)
      const convertedBoards = await Promise.all(boards.map(b => PhraseBoard.fromSupabase(b)))
      set((state) => ({ ...state, boards: convertedBoards, loading: false }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to fetch boards', loading: false }))
    }
  },

  addPhrase: async (phraseData: PhraseData, boardId: string, symbolUrl: string | null) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      if (symbolUrl && phraseData.symbol_id) {
        // Convert URL to File object
        const response = await fetch(symbolUrl)
        const blob = await response.blob()
        const file = new File([blob], phraseData.symbol_id, { type: 'image/png' })
        await storageService.uploadSymbolImage(file, phraseData.symbol_id)
      }
      
      const phrase = new Phrase(phraseData)
      await phrase.save()
      await databaseService.addPhraseToBoard(phrase.id!, boardId)
      
      set((state) => ({ ...state, phrases: [...state.phrases, phrase], loading: false }))
    } catch (error) {
      console.error('Error adding phrase:', error)
      set((state) => ({ ...state, error: 'Failed to add phrase', loading: false }))
    }
  },

  deletePhrase: async (phraseId: string, boardId: string, userId: string) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      await databaseService.removePhraseFromBoard(phraseId, boardId)
      await databaseService.deletePhrase(phraseId)
      set((state) => ({
        ...state,
        phrases: state.phrases.filter((phrase) => phrase.id !== phraseId),
        loading: false
      }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to delete phrase', loading: false }))
    }
  },

  updatePhrase: async (phraseId: string, phrase: Phrase, symbolUrl: string | null) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      if (symbolUrl) {
        // Generate a new symbol ID if we don't have one
        if (!phrase.symbol_id) {
          phrase.symbol_id = crypto.randomUUID()
        }
        
        // Convert URL to File object
        const response = await fetch(symbolUrl)
        const blob = await response.blob()
        const file = new File([blob], phrase.symbol_id, { type: 'image/png' })
        await storageService.uploadSymbolImage(file, phrase.symbol_id)
      }
      
      await phrase.save()
      set((state) => ({
        ...state,
        phrases: state.phrases.map((p) => (p.id === phraseId ? phrase : p)),
        loading: false
      }))
    } catch (error) {
      console.error('Error updating phrase:', error)
      set((state) => ({ ...state, error: 'Failed to update phrase', loading: false }))
    }
  },

  getPhrase: async (userId: string, boardId: string, phraseId: string) => {
    try {
      const phrase = await databaseService.getPhrase(phraseId)
      if (phrase) {
        return Phrase.fromSupabase(phrase)
      }
      return null
    } catch (error) {
      console.error('Error getting phrase:', error)
      return null
    }
  },

  createPhraseBoard: async (userId: string, name: string) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const result = await databaseService.addPhraseBoard({
        name,
        user_id: userId,
        position: 0
      })
      
      const board = await PhraseBoard.fromSupabase(result)
      set((state) => ({ ...state, boards: [...state.boards, board], loading: false }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to create board', loading: false }))
    }
  },

  getPhraseBoard: async (userId: string, boardId: string) => {
    try {
      const board = await databaseService.getPhraseBoard(boardId)
      if (board) {
        return PhraseBoard.fromSupabase(board)
      }
      return null
    } catch (error) {
      console.error('Error getting board:', error)
      return null
    }
  },

  updatePhraseBoard: async (userId: string, board: PhraseBoard) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      await board.save()
      set((state) => ({
        ...state,
        boards: state.boards.map((b) => (b.id === board.id ? board : b)),
        loading: false
      }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to update board', loading: false }))
    }
  },

  deletePhraseBoard: async (userId: string, boardId: string) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      await databaseService.deletePhraseBoard(boardId)
      set((state) => ({
        ...state,
        boards: state.boards.filter((board) => board.id !== boardId),
        loading: false
      }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to delete board', loading: false }))
    }
  }
})) 