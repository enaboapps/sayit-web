import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { Symbol } from './Phrase'

export class PhraseBoard {
  id: string
  name: string
  symbol: Symbol | null
  position: number

  constructor() {
    this.id = this.generateRandomId()
    this.name = ''
    this.symbol = null
    this.position = 0
  }

  private generateRandomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let id = ''
    for (let i = 0; i < 20; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return id
  }

  static fromDocument(doc: QueryDocumentSnapshot<DocumentData>): PhraseBoard {
    const data = doc.data()
    const board = new PhraseBoard()
    board.id = doc.id
    board.name = data.name || ''
    if (data.symbolId && data.symbolId !== 0) {
      board.symbol = {
        id: data.symbolId,
        name: data.symbolName || '',
        url: data.symbolUrl || ''
      }
    }
    board.position = data.position || 0
    return board
  }

  toDocument() {
    const document: any = {
      id: this.id,
      name: this.name,
      position: this.position
    }

    if (this.symbol) {
      document.symbolId = this.symbol.id
      document.symbolName = this.symbol.name
      document.symbolUrl = this.symbol.url
    } else {
      document.symbolId = 0
    }

    return document
  }
} 