import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { Symbol } from './Symbol'

export interface PhraseBoardData {
  id?: string
  name: string
  userId: string
  symbol?: Symbol
  position: number
}

export class PhraseBoard {
  id?: string
  name: string
  userId: string
  symbol: Symbol | null
  position: number

  constructor(data: PhraseBoardData) {
    this.id = data.id
    this.name = data.name
    this.userId = data.userId
    this.symbol = data.symbol || null
    this.position = data.position
  }

  static fromDocument(doc: QueryDocumentSnapshot<DocumentData>): PhraseBoard {
    const data = doc.data()
    return new PhraseBoard({
      id: doc.id,
      name: data.name || '',
      userId: data.userId || '',
      symbol: data.symbol ? new Symbol(data.symbol.id, data.symbol.name, data.symbol.url) : undefined,
      position: data.position || 0
    })
  }

  toDocument(): PhraseBoardData {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      symbol: this.symbol || undefined,
      position: this.position
    }
  }

  toJSON(): PhraseBoardData {
    return this.toDocument()
  }
} 