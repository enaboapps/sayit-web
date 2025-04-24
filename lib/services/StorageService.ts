import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export interface IStorageService {
  uploadSymbol(symbolId: string, file: File): Promise<string>;
  getSymbolUrl(symbolId: string): Promise<string>;
  deleteSymbol(symbolId: string): Promise<void>;
  getFileURL(fileName: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}

export class StorageService implements IStorageService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async uploadSymbol(symbolId: string, file: File): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${user.id}/${symbolId}.${extension}`;
      const { error } = await supabase.storage
        .from('symbols')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('symbols')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      throw error;
    }
  }

  async getSymbolUrl(symbolId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Try PNG first, then SVG
    const extensions = ['png', 'svg'];
    for (const extension of extensions) {
      const filePath = `${user.id}/${symbolId}.${extension}`;
      const { data: { publicUrl } } = supabase.storage
        .from('symbols')
        .getPublicUrl(filePath);
      
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (response.ok) {
          return publicUrl;
        }
      } catch {
        continue;
      }
    }
    
    throw new Error('Symbol not found');
  }

  async deleteSymbol(symbolId: string): Promise<void> {
    console.log('Deleting symbol:', symbolId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filePath = `${user.id}/${symbolId}.png`;
      const { error } = await supabase.storage
        .from('symbols')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting symbol:', {
          symbolId,
          errorMessage: error.message,
        });
        throw error;
      }
      console.log('Successfully deleted symbol:', symbolId);
    } catch (error) {
      console.error('Unexpected error in deleteSymbol:', error);
      throw error;
    }
  }

  async getFileURL(fileName: string): Promise<string> {
    console.log('Getting file URL:', fileName);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filePath = `${user.id}/${fileName}`;
      const { data } = supabase.storage
        .from('symbols')
        .getPublicUrl(filePath);

      console.log('Retrieved file URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', {
        fileName,
        error,
      });
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    console.log('Deleting file:', path);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filePath = `${user.id}/${path}`;
      const { error } = await supabase.storage
        .from('symbols')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', {
          path,
          errorMessage: error.message,
        });
        throw error;
      }
      console.log('Successfully deleted file:', path);
    } catch (error) {
      console.error('Unexpected error in deleteFile:', error);
      throw error;
    }
  }
}

export const storageService: IStorageService = new StorageService(supabase);
