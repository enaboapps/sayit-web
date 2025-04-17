import { create } from 'zustand'
import { Phrase, PhraseData } from '../models/Phrase'
import { db } from '../config/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, DocumentData } from 'firebase/firestore'

interface PhraseStore {
  phrases: Phrase[]
  loading: boolean
  error: string | null
  fetchPhrases: (userId: string) => Promise<void>
  addPhrase: (phrase: PhraseData) => Promise<void>
  deletePhrase: (phraseId: string) => Promise<void>
}

type SetState = (fn: (state: PhraseStore) => Partial<PhraseStore>) => void

export const phraseStore = create<PhraseStore>((set: SetState) => ({
  phrases: [],
  loading: false,
  error: null,

  fetchPhrases: async (userId: string) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const phrasesRef = collection(db, 'phrases')
      const q = query(phrasesRef, where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      const phrases = querySnapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData
        return new Phrase({
          id: doc.id,
          title: data.title || '',
          text: data.text || '',
          userId: data.userId || userId,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        })
      })
      set((state) => ({ ...state, phrases, loading: false }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to fetch phrases', loading: false }))
    }
  },

  addPhrase: async (phraseData: PhraseData) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const docRef = await addDoc(collection(db, 'phrases'), phraseData)
      const newPhrase = new Phrase({ ...phraseData, id: docRef.id })
      set((state) => ({ ...state, phrases: [...state.phrases, newPhrase], loading: false }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to add phrase', loading: false }))
    }
  },

  deletePhrase: async (phraseId: string) => {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      await deleteDoc(doc(db, 'phrases', phraseId))
      set((state) => ({
        ...state,
        phrases: state.phrases.filter((phrase) => phrase.id !== phraseId),
        loading: false
      }))
    } catch (error) {
      set((state) => ({ ...state, error: 'Failed to delete phrase', loading: false }))
    }
  }
})) 