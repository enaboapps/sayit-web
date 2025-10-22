import { supabase } from '../supabase';

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

export interface TypingSession {
  id: string
  user_id: string
  session_key: string
  content: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface IDatabaseService {
  getPhrases(userId: string): Promise<Phrase[]>
  addPhrase(userId: string, phrase: Omit<Phrase, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Phrase>
  updatePhrase(id: string, userId: string, updates: Partial<Omit<Phrase, 'id' | 'created_at' | 'updated_at'>>): Promise<Phrase>
  deletePhrase(id: string, userId: string): Promise<void>
  getPhrase(id: string, userId: string): Promise<Phrase | null>
  getPhraseBoards(userId: string): Promise<DatabasePhraseBoard[]>
  addPhraseBoard(userId: string, board: Omit<PhraseBoard, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<PhraseBoard>
  updatePhraseBoard(id: string, userId: string, updates: Partial<Omit<PhraseBoard, 'id' | 'created_at' | 'updated_at'>>): Promise<PhraseBoard>
  deletePhraseBoard(id: string, userId: string): Promise<void>
  getPhraseBoard(id: string, userId: string): Promise<DatabasePhraseBoard | null>
  addPhraseToBoard(phraseId: string, boardId: string, userId: string): Promise<void>
  removePhraseFromBoard(phraseId: string, boardId: string, userId: string): Promise<void>
  createTypingSession(userId: string, sessionKey: string): Promise<TypingSession>
  getTypingSession(sessionKey: string): Promise<TypingSession | null>
  updateTypingSessionContent(sessionKey: string, userId: string, content: string): Promise<TypingSession>
  deleteTypingSession(sessionKey: string, userId: string): Promise<void>
  getUserTypingSessions(userId: string): Promise<TypingSession[]>
}

export class DatabaseService implements IDatabaseService {

  async getPhrases(userId: string): Promise<Phrase[]> {
    const { data, error } = await supabase
      .from('phrases')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  async addPhrase(userId: string, phrase: Omit<Phrase, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Phrase> {
    const { data, error } = await supabase
      .from('phrases')
      .insert([{ ...phrase, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePhrase(id: string, userId: string, updates: Partial<Omit<Phrase, 'id' | 'created_at' | 'updated_at'>>): Promise<Phrase> {
    const { data, error } = await supabase
      .from('phrases')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePhrase(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('phrases')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getPhrase(id: string, userId: string): Promise<Phrase | null> {
    const { data, error } = await supabase
      .from('phrases')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async getPhraseBoards(userId: string): Promise<DatabasePhraseBoard[]> {
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

  async addPhraseBoard(userId: string, board: Omit<PhraseBoard, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<PhraseBoard> {
    const { data, error } = await supabase
      .from('phrase_boards')
      .insert([{ ...board, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePhraseBoard(id: string, userId: string, updates: Partial<Omit<PhraseBoard, 'id' | 'created_at' | 'updated_at'>>): Promise<PhraseBoard> {
    const { data, error } = await supabase
      .from('phrase_boards')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePhraseBoard(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('phrase_boards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getPhraseBoard(id: string, userId: string): Promise<DatabasePhraseBoard | null> {
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
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    console.log('Fetched board:', data);
    return data;
  }

  async addPhraseToBoard(phraseId: string, boardId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('phrase_board_phrases')
      .insert([{ phrase_id: phraseId, board_id: boardId }]);

    if (error) throw error;
  }

  async removePhraseFromBoard(phraseId: string, boardId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('phrase_board_phrases')
      .delete()
      .eq('phrase_id', phraseId)
      .eq('board_id', boardId);

    if (error) throw error;
  }

  async createTypingSession(userId: string, sessionKey: string): Promise<TypingSession> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from('typing_sessions')
      .insert([{
        user_id: userId,
        session_key: sessionKey,
        content: '',
        expires_at: expiresAt.toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTypingSession(sessionKey: string): Promise<TypingSession | null> {
    const { data, error } = await supabase
      .from('typing_sessions')
      .select('*')
      .eq('session_key', sessionKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  async updateTypingSessionContent(sessionKey: string, userId: string, content: string): Promise<TypingSession> {
    const { data, error } = await supabase
      .from('typing_sessions')
      .update({ content })
      .eq('session_key', sessionKey)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTypingSession(sessionKey: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('typing_sessions')
      .delete()
      .eq('session_key', sessionKey)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getUserTypingSessions(userId: string): Promise<TypingSession[]> {
    const { data, error } = await supabase
      .from('typing_sessions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const databaseService = new DatabaseService();
