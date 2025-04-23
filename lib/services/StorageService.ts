import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../supabase'

export interface IStorageService {
  uploadSymbol(symbolId: string, file: string): Promise<void>
  getSymbolUrl(symbolId: string): Promise<string>
  deleteSymbol(symbolId: string): Promise<void>
  uploadSymbolImage(file: File, symbolId: string): Promise<{ data: { path: string; publicUrl: string } | null; error: Error | null }>
  getFileURL(fileName: string): Promise<string>
  deleteFile(path: string): Promise<void>
}

export class StorageService implements IStorageService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async uploadSymbol(symbolId: string, file: string): Promise<void> {
    console.log('Starting symbol upload:', { symbolId, fileSize: file.length })
    try {
      const { error } = await this.supabase.storage
        .from('symbols')
        .upload(symbolId, file, {
          upsert: true
        })
      
      if (error) {
        console.error('Error uploading symbol:', {
          symbolId,
          errorMessage: error.message
        })
        throw error
      }
      console.log('Successfully uploaded symbol:', symbolId)
    } catch (error) {
      console.error('Unexpected error in uploadSymbol:', error)
      throw error
    }
  }

  async getSymbolUrl(symbolId: string): Promise<string> {
    console.log('Getting symbol URL:', symbolId)
    try {
      const { data } = this.supabase.storage
        .from('symbols')
        .getPublicUrl(symbolId)
      
      console.log('Retrieved symbol URL:', data.publicUrl)
      return data.publicUrl
    } catch (error) {
      console.error('Error getting symbol URL:', {
        symbolId,
        error
      })
      throw error
    }
  }

  async deleteSymbol(symbolId: string): Promise<void> {
    console.log('Deleting symbol:', symbolId)
    try {
      const { error } = await this.supabase.storage
        .from('symbols')
        .remove([symbolId])
      
      if (error) {
        console.error('Error deleting symbol:', {
          symbolId,
          errorMessage: error.message
        })
        throw error
      }
      console.log('Successfully deleted symbol:', symbolId)
    } catch (error) {
      console.error('Unexpected error in deleteSymbol:', error)
      throw error
    }
  }

  async uploadSymbolImage(file: File, symbolId: string): Promise<{ data: { path: string; publicUrl: string } | null; error: Error | null }> {
    console.log('StorageService: Starting symbol image upload')
    
    try {
      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const userFolder = user.id
      const filePath = `${userFolder}/${symbolId}.png`

      console.log('Upload details:', {
        symbolId,
        bucket: 'symbols',
        filePath,
        fileSize: file.size,
        fileType: file.type
      })

      const { data, error } = await this.supabase.storage
        .from('symbols')
        .upload(filePath, file, {
          upsert: true,
          contentType: 'image/png'
        })

      if (error) {
        console.error('StorageService: Upload failed:', {
          error,
          message: error.message,
          name: error.name
        })
        return { data: null, error }
      }

      // Get the public URL after successful upload
      const { data: publicUrlData } = this.supabase.storage
        .from('symbols')
        .getPublicUrl(filePath)

      return {
        data: {
          path: data.path,
          publicUrl: publicUrlData.publicUrl
        },
        error: null
      }
    } catch (error) {
      console.error('StorageService: Unexpected error during upload:', error)
      return { data: null, error: error as Error }
    }
  }

  async getFileURL(fileName: string): Promise<string> {
    console.log('Getting file URL:', fileName)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const userFolder = user.id
      const path = `${userFolder}/${fileName}`
      const { data } = this.supabase.storage
        .from('symbols')
        .getPublicUrl(path)
      
      console.log('Retrieved file URL:', data.publicUrl)
      return data.publicUrl
    } catch (error) {
      console.error('Error getting file URL:', {
        fileName,
        error
      })
      throw error
    }
  }

  async deleteFile(path: string): Promise<void> {
    console.log('Deleting file:', path)
    try {
      const { error } = await this.supabase.storage
        .from('symbols')
        .remove([path])
      
      if (error) {
        console.error('Error deleting file:', {
          path,
          errorMessage: error.message
        })
        throw error
      }
      console.log('Successfully deleted file:', path)
    } catch (error) {
      console.error('Unexpected error in deleteFile:', error)
      throw error
    }
  }
}

export const storageService: IStorageService = new StorageService(supabase) 