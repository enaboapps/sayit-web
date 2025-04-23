import { supabase, getCurrentSession } from '../supabase'

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

export interface DatabasePhraseBoard {
  id: string
  name: string
  user_id: string
  position: number
  created_at: string
  updated_at: string
}

export interface IDatabaseService {
  getPhrases(userId: string): Promise<Phrase[]>
  addPhrase(phrase: Omit<Phrase, 'id' | 'created_at' | 'updated_at'>): Promise<Phrase>
  updatePhrase(id: string, updates: Partial<Omit<Phrase, 'id' | 'created_at' | 'updated_at'>>): Promise<Phrase>
  deletePhrase(id: string): Promise<void>
  getPhrase(id: string): Promise<Phrase | null>
  getPhraseBoards(userId: string): Promise<DatabasePhraseBoard[]>
  addPhraseBoard(board: Omit<PhraseBoard, 'id' | 'created_at' | 'updated_at'>): Promise<PhraseBoard>
  updatePhraseBoard(id: string, updates: Partial<PhraseBoard>): Promise<PhraseBoard>
  deletePhraseBoard(id: string): Promise<void>
  getPhraseBoard(id: string): Promise<(PhraseBoard & { phrases?: { phrase: Phrase }[] }) | null>
  addPhraseToBoard(phraseId: string, boardId: string): Promise<void>
  removePhraseFromBoard(phraseId: string, boardId: string): Promise<void>
}

export class DatabaseService implements IDatabaseService {
  private async ensureAuth() {
    try {
      console.log('Checking authentication...')
      const session = await getCurrentSession()
      console.log('Session:', session)
      
      if (!session) {
        console.error('No active session found')
        throw new Error('Not authenticated')
      }

      const user = session.user
      console.log('User:', user)
      
      if (!user) {
        console.error('No user found in session')
        throw new Error('Not authenticated')
      }

      console.log('Authentication successful')
      return user
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    }
  }

  async getPhrases(userId: string) {
    console.log('Fetching phrases for user:', userId)
    const { data, error } = await supabase
      .from('phrases')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching phrases:', error)
      throw error
    }
    return data || []
  }

  async addPhrase(phrase: Omit<Phrase, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const user = await this.ensureAuth()
      console.log('Adding phrase for user:', user.id)
      
      const phraseWithUserId = {
        ...phrase,
        user_id: user.id,
        frequency: phrase.frequency || 0,
        position: phrase.position || 0
      }

      console.log('Phrase data being inserted:', phraseWithUserId)

      const { data, error } = await supabase
        .from('phrases')
        .insert([phraseWithUserId])
        .select()
        .single()

      if (error) {
        console.error('Error adding phrase:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('Successfully added phrase:', data)
      return data
    } catch (error) {
      console.error('Error in addPhrase:', error)
      throw error
    }
  }

  async updatePhrase(id: string, updates: Partial<Omit<Phrase, 'id' | 'created_at' | 'updated_at'>>) {
    console.log('Updating phrase:', id, updates)
    const { data, error } = await supabase
      .from('phrases')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating phrase:', error)
      throw error
    }
    return data
  }

  async deletePhrase(id: string) {
    console.log('Deleting phrase:', id)
    const { error } = await supabase
      .from('phrases')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting phrase:', error)
      throw error
    }
  }

  async getPhrase(id: string) {
    console.log('Fetching phrase:', id)
    const { data, error } = await supabase
      .from('phrases')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching phrase:', error)
      throw error
    }
    return data
  }

  async getPhraseBoards(userId: string): Promise<DatabasePhraseBoard[]> {
    try {
      console.log('Getting phrase boards for user:', userId)
      const { data, error } = await supabase
        .from('phrase_boards')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching phrase boards:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('Successfully fetched phrase boards:', data)
      return data || []
    } catch (error) {
      console.error('Error in getPhraseBoards:', error)
      throw error
    }
  }

  async addPhraseBoard(board: Omit<PhraseBoard, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const user = await this.ensureAuth()
      console.log('Adding phrase board for user:', user.id)
      
      const boardWithUserId = {
        ...board,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('phrase_boards')
        .insert([boardWithUserId])
        .select()
        .single()

      if (error) {
        console.error('Error adding phrase board:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('Successfully added phrase board:', data)
      return data
    } catch (error) {
      console.error('Error in addPhraseBoard:', error)
      throw error
    }
  }

  async updatePhraseBoard(id: string, updates: Partial<PhraseBoard>) {
    console.log('Updating phrase board:', id, updates)
    const { data, error } = await supabase
      .from('phrase_boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating phrase board:', error)
      throw error
    }
    return data
  }

  async deletePhraseBoard(id: string) {
    console.log('Deleting phrase board:', id)
    const { error } = await supabase
      .from('phrase_boards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting phrase board:', error)
      throw error
    }
  }

  async getPhraseBoard(id: string) {
    try {
      console.log('Fetching phrase board:', id)

      const { data, error } = await supabase
        .from('phrase_boards')
        .select(`
          *,
          phrase_board_phrases (
            phrase:phrases (
              *
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching phrase board:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('Successfully fetched phrase board with phrases:', data)
      return data
    } catch (error) {
      console.error('Error in getPhraseBoard:', error)
      throw error
    }
  }

  async addPhraseToBoard(phraseId: string, boardId: string) {
    try {
      console.log('Adding phrase to board:', { phraseId, boardId })

      const { data, error } = await supabase
        .from('phrase_board_phrases')
        .insert([{
          phrase_id: phraseId,
          board_id: boardId
        }])
        .select()

      if (error) {
        console.error('Error adding phrase to board:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('Successfully added phrase to board:', data)
    } catch (error) {
      console.error('Error in addPhraseToBoard:', error)
      throw error
    }
  }

  async removePhraseFromBoard(phraseId: string, boardId: string) {
    console.log('Removing phrase from board:', { phraseId, boardId })
    const { error } = await supabase
      .from('phrase_board_phrases')
      .delete()
      .eq('phrase_id', phraseId)
      .eq('board_id', boardId)

    if (error) {
      console.error('Error removing phrase from board:', error)
      throw error
    }
  }
}

export const databaseService = new DatabaseService() 