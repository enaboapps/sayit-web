import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { Symbol } from './Symbol'

export interface PhraseData {
  id?: string
  title?: string
  text: string
  userId?: string
  boardId?: string
  symbol?: number | null
  frequency?: number
  position?: number
  createdAt?: Date
  updatedAt?: Date
}

export class Phrase {
  id?: string
  title: string
  text: string
  userId: string
  boardId: string
  symbol?: number | null
  frequency: number
  position: number
  createdAt?: Date
  updatedAt?: Date

  constructor(data: PhraseData) {
    this.id = data.id || this.generateRandomId()
    this.title = data.title || ''
    this.text = data.text
    this.userId = data.userId || ''
    this.boardId = data.boardId || ''
    this.symbol = data.symbol || null
    this.frequency = data.frequency || 0
    this.position = data.position || 0
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  private generateRandomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let id = ''
    for (let i = 0; i < 20; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return id
  }

  static fromDocument(doc: QueryDocumentSnapshot<DocumentData>): Phrase {
    const data = doc.data()
    const phrase = new Phrase({
      id: doc.id,
      title: data.title || '',
      text: data.text || '',
      userId: data.userId || '',
      boardId: data.boardId || '',
      frequency: data.frequency || 0,
      position: data.position || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    })

    // Handle symbol data
    if (data.symbol) {
      phrase.symbol = data.symbol
    }

    return phrase
  }

  getSymbol(): Symbol | null {
    if (!this.symbol) {
      return null
    }
    return Symbol.fromId(this.symbol)
  }

  toDocument(): PhraseData {
    const document: PhraseData = {
      id: this.id,
      title: this.title,
      text: this.text,
      userId: this.userId,
      boardId: this.boardId,
      frequency: this.frequency,
      position: this.position,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    if (this.symbol) {
      document.symbol = this.symbol
    }

    return document
  }

  toJSON(): PhraseData {
    return this.toDocument()
  }
} 