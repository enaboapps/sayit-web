import { databaseService, PhraseBoard as DatabasePhraseBoard, Phrase as DatabasePhrase, PhraseBoardPhrase } from '../services/DatabaseService';
import { Phrase } from './Phrase';

export interface PhraseBoardData {
  id?: string
  name: string
  userId: string
  position?: number
  phrases?: Phrase[]
  createdAt?: Date
  updatedAt?: Date
}

export class PhraseBoard {
  id?: string;
  name: string;
  userId: string;
  position: number;
  phrases: Phrase[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: PhraseBoardData) {
    this.id = data.id;
    this.name = data.name;
    this.userId = data.userId;
    this.position = data.position || 0;
    this.phrases = data.phrases || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async fromSupabase(data: DatabasePhraseBoard & { 
    phrase_board_phrases?: {
      phrase_id: string;
      board_id: string;
      created_at: string;
      phrase: DatabasePhrase;
    }[]
  }): Promise<PhraseBoard> {
    console.log('Converting board data:', data);
    const phrases = data.phrase_board_phrases
      ?.filter((p) => p.phrase) // Filter out any null phrases
      .map((p) => p.phrase) || [];
    console.log('Extracted phrases:', phrases);
    
    return new PhraseBoard({
      id: data.id,
      name: data.name,
      userId: data.user_id,
      position: data.position || 0,
      phrases: await Promise.all(phrases.map((p) => Phrase.fromSupabase(p))),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  async save(): Promise<void> {
    if (this.id) {
      await databaseService.updatePhraseBoard(this.id, {
        name: this.name,
        user_id: this.userId,
        position: this.position,
      });
    } else {
      const result = await databaseService.addPhraseBoard({
        name: this.name,
        user_id: this.userId,
        position: this.position,
      });
      this.id = result.id;
      this.createdAt = new Date(result.created_at);
      this.updatedAt = new Date(result.updated_at);
    }
  }

  async delete(): Promise<void> {
    if (this.id) {
      await databaseService.deletePhraseBoard(this.id);
    }
  }

  async addPhrase(phrase: Phrase): Promise<void> {
    if (this.id && phrase.id) {
      await databaseService.addPhraseToBoard(phrase.id, this.id);
      this.phrases.push(phrase);
    }
  }

  async removePhrase(phrase: Phrase): Promise<void> {
    if (this.id && phrase.id) {
      await databaseService.removePhraseFromBoard(phrase.id, this.id);
      this.phrases = this.phrases.filter(p => p.id !== phrase.id);
    }
  }

  toJSON(): PhraseBoardData {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      position: this.position,
      phrases: this.phrases,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
