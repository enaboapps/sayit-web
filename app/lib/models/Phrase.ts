import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

export interface Symbol {
  id: string
  name: string
  url: string
}

export class Phrase {
  id: string
  title: string
  text: string
  symbol: Symbol | null
  frequency: number
  position: number

  constructor() {
    this.id = this.generateRandomId()
    this.title = ''
    this.text = ''
    this.symbol = null
    this.frequency = 0
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

  static fromDocument(doc: QueryDocumentSnapshot<DocumentData>): Phrase {
    const data = doc.data()
    const phrase = new Phrase()
    phrase.id = doc.id
    phrase.title = data.title || ''
    phrase.text = data.text || ''
    if (data.symbolId && data.symbolId !== 0) {
      phrase.symbol = {
        id: data.symbolId,
        name: data.symbolName || '',
        url: data.symbolUrl || ''
      }
    }
    phrase.frequency = data.frequency || 0
    phrase.position = data.position || 0
    return phrase
  }

  toDocument() {
    const document: any = {
      id: this.id,
      title: this.title,
      text: this.text,
      frequency: this.frequency,
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