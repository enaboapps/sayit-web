import { create } from 'zustand'
import { Phrase, PhraseData } from '../models/Phrase'
import { PhraseBoard, PhraseBoardData } from '../models/PhraseBoard'
import { Symbol } from '../models/Symbol'
import { db } from '../config/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, DocumentData, getDoc, updateDoc } from 'firebase/firestore'
import symbolsManager from '../services/SymbolsManager'

interface PhraseStore {
  phrases: Phrase[]
  boards: PhraseBoard[]
  loading: boolean
  error: string | null
  fetchPhrases: (userId: string) => Promise<void>
  fetchBoards: (userId: string) => Promise<void>
  addPhrase: (phrase: PhraseData, boardId: string, symbolUrl: string | null) => Promise<void>
  deletePhrase: (phraseId: string, boardId: string, userId: string) => Promise<void>
  updatePhrase: (userId: string, boardId: string, phraseId: string, phrase: Phrase, symbolUrl: string | null) => Promise<void>
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
      const col = collection(db, `${userId}-phraseboards`)
      const q = query(col, orderBy('position'))
      const querySnapshot = await getDocs(q)
      
      let allPhrases: Phrase[] = []
      
      // For each board, fetch its phrases
      for (const boardDoc of querySnapshot.docs) {
        const boardId = boardDoc.id
        const phrasesCol = collection(col, boardId, 'phrases')
        const phrasesSnapshot = await getDocs(phrasesCol)
        
        const boardPhrases = phrasesSnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData
          return new Phrase({
            id: doc.id,
            title: data.title || '',
            text: data.text || '',
            userId: data.userId || userId,
            boardId: boardId,
            symbol: data.symbol ? data.symbol : undefined
          })
        })
        
        allPhrases = [...allPhrases, ...boardPhrases]
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
      const col = collection(db, `${userId}-phraseboards`)
      const q = query(col, orderBy('position'))
      const querySnapshot = await getDocs(q)
      const boards = querySnapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData
        return new PhraseBoard({
          id: doc.id,
          name: data.name || '',
          userId: data.userId || userId,
          symbol: data.symbol ? data.symbol : undefined,
          position: data.position || 0
        })
      })
      set((state) => ({ ...state, boards, loading: false }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to fetch boards', loading: false }))
    }
  },

  addPhrase: async (phraseData: PhraseData, boardId: string, symbolUrl: string | null) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const phrase = new Phrase(phraseData)
      
      const docData = {
        title: phrase.title || '',
        text: phrase.text || '',
        userId: phrase.userId || '',
        boardId: boardId,
        symbol: phrase.symbol ? phrase.symbol : undefined,
        frequency: 0,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const col = collection(db, `${docData.userId}-phraseboards`)
      const phraseCol = collection(col, boardId, 'phrases')
      const docRef = await addDoc(phraseCol, docData)
      console.log('Added phrase:', docRef)

      if (symbolUrl && phrase.symbol) {
        await symbolsManager.addSymbol(phrase.symbol, symbolUrl)
      }
      
      set((state) => ({ ...state, phrases: [...state.phrases, phrase], loading: false }))
    } catch (error) {
      console.error('Error adding phrase:', error)
      set((state) => ({ ...state, error: 'Failed to add phrase', loading: false }))
    }
  },

  deletePhrase: async (phraseId: string, boardId: string, userId: string) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const col = collection(db, `${userId}-phraseboards`)
      const phraseCol = collection(col, boardId, 'phrases')
      await deleteDoc(doc(phraseCol, phraseId))
      set((state) => ({
        ...state,
        phrases: state.phrases.filter((phrase) => phrase.id !== phraseId),
        loading: false
      }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to delete phrase', loading: false }))
    }
  },

  updatePhrase: async (userId: string, boardId: string, phraseId: string, phrase: Phrase, symbolUrl: string | null) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const col = collection(db, `${userId}-phraseboards`)
      const phraseCol = collection(col, boardId, 'phrases')
      const docRef = doc(phraseCol, phraseId)
      const docData = {
        title: phrase.title || '',
        text: phrase.text || '',
        userId: phrase.userId || '',
        boardId: boardId,
        symbol: phrase.symbol !== undefined ? phrase.symbol : null,
        frequency: phrase.frequency || 0,
        position: phrase.position || 0,
        updatedAt: new Date()
      }
      await updateDoc(docRef, docData)
      if (symbolUrl && phrase.symbol) {
        await symbolsManager.addSymbol(phrase.symbol, symbolUrl)
      }
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
      const col = collection(db, `${userId}-phraseboards`)
      const phraseCol = collection(col, boardId, 'phrases')
      const docRef = doc(phraseCol, phraseId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return Phrase.fromDocument(docSnap)
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
      const col = collection(db, `${userId}-phraseboards`)
      const docData = {
        name,
        userId,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const docRef = await addDoc(col, docData)
      const board = new PhraseBoard({
        id: docRef.id,
        name,
        userId,
        position: 0
      })
      set((state) => ({ ...state, boards: [...state.boards, board], loading: false }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to create board', loading: false }))
    }
  },

  getPhraseBoard: async (userId: string, boardId: string) => {
    try {
      const col = collection(db, `${userId}-phraseboards`)
      const docRef = doc(col, boardId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return PhraseBoard.fromDocument(docSnap)
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
      const col = collection(db, `${userId}-phraseboards`)
      const docRef = doc(col, board.id)
      await updateDoc(docRef, board.toDocument() as DocumentData)
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
      const col = collection(db, `${userId}-phraseboards`)
      await deleteDoc(doc(col, boardId))
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