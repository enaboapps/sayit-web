import { databaseService, PhraseBoard as DatabasePhraseBoard } from '../services/DatabaseService'
import { Phrase } from './Phrase'

export interface PhraseBoardData {
  id?: string
  name: string
  userId: string
  position: number
  phrases?: Phrase[]
}

export class PhraseBoard {
  id?: string
  name: string
  userId: string
  position: number
  phrases: Phrase[]

  constructor(data: PhraseBoardData) {
    this.id = data.id
    this.name = data.name
    this.userId = data.userId
    this.position = data.position || 0
    this.phrases = data.phrases || []
  }

  static async fromSupabase(data: DatabasePhraseBoard & { phrases?: { phrase: any }[] }): Promise<PhraseBoard> {
    const phrases = data.phrases?.map(p => p.phrase) || []
    return new PhraseBoard({
      id: data.id,
      name: data.name,
      userId: data.user_id,
      position: data.position || 0,
      phrases: await Promise.all(phrases.map(p => Phrase.fromSupabase(p)))
    })
  }

  async save(): Promise<void> {
    if (this.id) {
      await databaseService.updatePhraseBoard(this.id, {
        name: this.name,
        user_id: this.userId,
        position: this.position
      })
    } else {
      const result = await databaseService.addPhraseBoard({
        name: this.name,
        user_id: this.userId,
        position: this.position
      })
      this.id = result.id
    }
  }

  async delete(): Promise<void> {
    if (this.id) {
      await databaseService.deletePhraseBoard(this.id)
    }
  }

  async addPhrase(phrase: Phrase): Promise<void> {
    if (this.id && phrase.id) {
      await databaseService.addPhraseToBoard(phrase.id, this.id)
      this.phrases.push(phrase)
    }
  }

  async removePhrase(phrase: Phrase): Promise<void> {
    if (this.id && phrase.id) {
      await databaseService.removePhraseFromBoard(phrase.id, this.id)
      this.phrases = this.phrases.filter(p => p.id !== phrase.id)
    }
  }

  toJSON(): PhraseBoardData {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      position: this.position,
      phrases: this.phrases
    }
  }
} 