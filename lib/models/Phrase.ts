import { Symbol } from './Symbol';
import { databaseService, Phrase as DatabasePhrase } from '../services/DatabaseService';

export interface PhraseData {
  id?: string
  text: string
  userId: string
  symbol_id?: string | null
  frequency?: number
  position?: number
  createdAt?: Date
  updatedAt?: Date
  isAddTile?: boolean
}

export class Phrase {
  id: string;
  text: string;
  userId: string;
  symbol_id?: string | null;
  frequency: number;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: PhraseData & { id: string }) {
    this.id = data.id;
    this.text = data.text;
    this.userId = data.userId;
    this.symbol_id = data.symbol_id || null;
    this.frequency = data.frequency || 0;
    this.position = data.position || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async fromSupabase(data: DatabasePhrase): Promise<Phrase> {
    return new Phrase({
      id: data.id,
      text: data.text,
      userId: data.user_id,
      symbol_id: data.symbol_id,
      frequency: data.frequency,
      position: data.position,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  getSymbol(): Symbol | null {
    if (!this.symbol_id) {
      return null;
    }
    return new Symbol(this.symbol_id, null, null);
  }

  async save(): Promise<void> {
    if (this.id) {
      await databaseService.updatePhrase(this.id, {
        text: this.text,
        symbol_id: this.symbol_id || null,
        user_id: this.userId,
        frequency: this.frequency,
        position: this.position,
      });
    } else {
      const result = await databaseService.addPhrase({
        text: this.text,
        symbol_id: this.symbol_id || null,
        user_id: this.userId,
        frequency: this.frequency,
        position: this.position,
      });
      this.id = result.id;
      this.createdAt = new Date(result.created_at);
      this.updatedAt = new Date(result.updated_at);
    }
  }

  async delete(): Promise<void> {
    if (this.id) {
      await databaseService.deletePhrase(this.id);
    }
  }

  toJSON(): PhraseData {
    return {
      id: this.id,
      text: this.text,
      userId: this.userId,
      symbol_id: this.symbol_id,
      frequency: this.frequency,
      position: this.position,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
