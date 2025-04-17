export interface Symbol {
  id: string
  name: string
  url: string
}

export interface PhraseData {
  id?: string
  title: string
  text: string
  userId: string
  symbol?: Symbol
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
  symbol: Symbol | null
  frequency: number
  position: number
  createdAt?: Date
  updatedAt?: Date

  constructor(data: PhraseData) {
    this.id = data.id || this.generateRandomId()
    this.title = data.title
    this.text = data.text
    this.userId = data.userId
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

  toDocument(): PhraseData {
    return {
      id: this.id,
      title: this.title,
      text: this.text,
      userId: this.userId,
      symbol: this.symbol || undefined,
      frequency: this.frequency,
      position: this.position,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  toJSON(): PhraseData {
    return this.toDocument()
  }
} 