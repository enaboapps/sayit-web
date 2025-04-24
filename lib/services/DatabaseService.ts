import { supabase, getCurrentSession } from '../supabase';

export interface Phrase {
  id: string
  text: string
  symbol_id: string | null
  user_id: string
  frequency: number
  position: number
  created_at: string
  updated_at: string
}

export interface PhraseBoard {
  id: string
  name: string
  user_id: string
  position: number
  created_at: string
  updated_at: string
}

export interface PhraseBoardPhrase {
  phrase_id: string
  board_id: string
  created_at: string
  phrase: Phrase
}

export interface DatabasePhraseBoard extends PhraseBoard {
  phrase_board_phrases?: PhraseBoardPhrase[]
}

export interface IDatabaseService {
  getPhrases(userId: string): Promise<Phrase[]>
  addPhrase(phrase: Omit<Phrase, 'id' | 'created_at' | 'updated_at'>): Promise<Phrase>
  updatePhrase(id: string, updates: Partial<Omit<Phrase, 'id' | 'created_at' | 'updated_at'>>): Promise<Phrase>
  deletePhrase(id: string): Promise<void>
  getPhrase(id: string): Promise<Phrase | null>
  getPhraseBoards(userId: string): Promise<DatabasePhraseBoard[]>
  addPhraseBoard(board: Omit<PhraseBoard, 'id' | 'created_at' | 'updated_at'>): Promise<PhraseBoard>
  updatePhraseBoard(id: string, updates: Partial<Omit<PhraseBoard, 'id' | 'created_at' | 'updated_at'>>): Promise<PhraseBoard>
  deletePhraseBoard(id: string): Promise<void>
  getPhraseBoard(id: string): Promise<DatabasePhraseBoard | null>
  addPhraseToBoard(phraseId: string, boardId: string): Promise<void>
  removePhraseFromBoard(phraseId: string, boardId: string): Promise<void>
}

export class DatabaseService implements IDatabaseService {
  private async ensureAuth() {
    const session = await getCurrentSession();
    if (!session?.user) {
      throw new Error('Not authenticated');
    }
    return session.user;
  }

  async getPhrases(userId: string): Promise<Phrase[]> {
    await this.ensureAuth();
    const { data, error } = await supabase
      .from('phrases')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  async addPhrase(phrase: Omit<Phrase, 'id' | 'created_at' | 'updated_at'>): Promise<Phrase> {
    const user = await this.ensureAuth();
    const { data, error } = await supabase
      .from('phrases')
      .insert([{ ...phrase, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePhrase(id: string, updates: Partial<Omit<Phrase, 'id' | 'created_at' | 'updated_at'>>): Promise<Phrase> {
    await this.ensureAuth();
    const { data, error } = await supabase
      .from('phrases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePhrase(id: string): Promise<void> {
    await this.ensureAuth();
    const { error } = await supabase
      .from('phrases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getPhrase(id: string): Promise<Phrase | null> {
    await this.ensureAuth();
    const { data, error } = await supabase
      .from('phrases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getPhraseBoards(userId: string): Promise<DatabasePhraseBoard[]> {
    await this.ensureAuth();
    const { data, error } = await supabase
      .from('phrase_boards')
      .select(`
        *,
        phrase_board_phrases:phrase_board_phrases (
          phrase_id,
          board_id,
          created_at,
          phrase:phrases (*)
        )
      `)
      .eq('user_id', userId)
      .order('position');

    if (error) throw error;
    console.log('Fetched boards:', data);
    return data || [];
  }

  async addPhraseBoard(board: Omit<PhraseBoard, 'id' | 'created_at' | 'updated_at'>): Promise<PhraseBoard> {
    const user = await this.ensureAuth();
    const { data, error } = await supabase
      .from('phrase_boards')
      .insert([{ ...board, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePhraseBoard(id: string, updates: Partial<Omit<PhraseBoard, 'id' | 'created_at' | 'updated_at'>>): Promise<PhraseBoard> {
    await this.ensureAuth();
    const { data, error } = await supabase
      .from('phrase_boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePhraseBoard(id: string): Promise<void> {
    await this.ensureAuth();
    const { error } = await supabase
      .from('phrase_boards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getPhraseBoard(id: string): Promise<DatabasePhraseBoard | null> {
    await this.ensureAuth();
    const { data, error } = await supabase
      .from('phrase_boards')
      .select(`
        *,
        phrase_board_phrases:phrase_board_phrases (
          phrase_id,
          board_id,
          created_at,
          phrase:phrases (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    console.log('Fetched board:', data);
    return data;
  }

  async addPhraseToBoard(phraseId: string, boardId: string): Promise<void> {
    await this.ensureAuth();
    const { error } = await supabase
      .from('phrase_board_phrases')
      .insert([{ phrase_id: phraseId, board_id: boardId }]);

    if (error) throw error;
  }

  async removePhraseFromBoard(phraseId: string, boardId: string): Promise<void> {
    await this.ensureAuth();
    const { error } = await supabase
      .from('phrase_board_phrases')
      .delete()
      .eq('phrase_id', phraseId)
      .eq('board_id', boardId);

    if (error) throw error;
  }
}

export const databaseService = new DatabaseService();
