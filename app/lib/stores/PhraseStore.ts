import { collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Phrase } from '../models/Phrase'
import { PhraseBoard } from '../models/PhraseBoard'
import { Symbol } from '../models/Phrase'

class PhraseStore {
  private phraseBoardCount: number
  private phraseCount: number

  constructor() {
    this.phraseBoardCount = 0
    this.phraseCount = 0
  }

  private getCollectionName(userId: string): string {
    return `${userId}-phraseboards`
  }

  private getCollection(userId: string) {
    return collection(db, this.getCollectionName(userId))
  }

  async createPhraseBoard(userId: string, name: string, symbol?: Symbol): Promise<boolean> {
    const col = this.getCollection(userId)
    const board = new PhraseBoard()
    board.name = name
    if (symbol) {
      board.symbol = symbol
    }
    board.position = this.phraseBoardCount + 1

    try {
      await addDoc(col, board.toDocument())
      return true
    } catch (error) {
      console.error('Error creating phrase board:', error)
      return false
    }
  }

  async deletePhraseBoard(userId: string, phraseBoardId: string): Promise<boolean> {
    const col = this.getCollection(userId)
    try {
      await deleteDoc(doc(col, phraseBoardId))
      return true
    } catch (error) {
      console.error('Error deleting phrase board:', error)
      return false
    }
  }

  async getPhraseBoard(userId: string, phraseBoardId: string): Promise<PhraseBoard | null> {
    const col = this.getCollection(userId)
    try {
      const docRef = doc(col, phraseBoardId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return PhraseBoard.fromDocument(docSnap)
      }
      return null
    } catch (error) {
      console.error('Error getting phrase board:', error)
      return null
    }
  }

  async getAllPhraseBoards(userId: string): Promise<PhraseBoard[]> {
    const col = this.getCollection(userId)
    try {
      const q = query(col, orderBy('position'))
      const querySnapshot = await getDocs(q)
      const boards: PhraseBoard[] = []
      querySnapshot.forEach((doc) => {
        boards.push(PhraseBoard.fromDocument(doc))
      })
      return boards
    } catch (error) {
      console.error('Error getting phrase boards:', error)
      return []
    }
  }

  async updatePhraseBoard(userId: string, board: PhraseBoard): Promise<boolean> {
    const col = this.getCollection(userId)
    try {
      await setDoc(doc(col, board.id), board.toDocument())
      return true
    } catch (error) {
      console.error('Error updating phrase board:', error)
      return false
    }
  }

  async createPhrase(userId: string, phraseBoardId: string, text: string, symbol?: Symbol): Promise<boolean> {
    const col = this.getCollection(userId)
    try {
      const phraseCol = collection(col, phraseBoardId, 'phrases')
      const phrase = new Phrase()
      phrase.text = text
      if (symbol) {
        phrase.symbol = symbol
      }
      phrase.position = this.phraseCount + 1
      await addDoc(phraseCol, phrase.toDocument())
      return true
    } catch (error) {
      console.error('Error creating phrase:', error)
      return false
    }
  }

  async deletePhrase(userId: string, phraseBoardId: string, phraseId: string): Promise<boolean> {
    const col = this.getCollection(userId)
    try {
      const phraseCol = collection(col, phraseBoardId, 'phrases')
      await deleteDoc(doc(phraseCol, phraseId))
      return true
    } catch (error) {
      console.error('Error deleting phrase:', error)
      return false
    }
  }

  async getPhrase(userId: string, phraseBoardId: string, phraseId: string): Promise<Phrase | null> {
    const col = this.getCollection(userId)
    try {
      const phraseCol = collection(col, phraseBoardId, 'phrases')
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
  }

  async getPhrases(userId: string, phraseBoardId: string): Promise<Phrase[]> {
    const col = this.getCollection(userId)
    try {
      const phraseCol = collection(col, phraseBoardId, 'phrases')
      const q = query(phraseCol, orderBy('position'))
      const querySnapshot = await getDocs(q)
      const phrases: Phrase[] = []
      querySnapshot.forEach((doc) => {
        phrases.push(Phrase.fromDocument(doc))
      })
      this.phraseCount = phrases.length
      return phrases
    } catch (error) {
      console.error('Error getting phrases:', error)
      return []
    }
  }

  async updatePhrase(userId: string, phraseBoardId: string, phraseId: string, phrase: Phrase): Promise<boolean> {
    const col = this.getCollection(userId)
    try {
      const phraseCol = collection(col, phraseBoardId, 'phrases')
      await setDoc(doc(phraseCol, phraseId), phrase.toDocument())
      return true
    } catch (error) {
      console.error('Error updating phrase:', error)
      return false
    }
  }
}

// Create a singleton instance
const phraseStore = new PhraseStore()
export default phraseStore 