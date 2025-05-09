import { type IStorageService, storageService } from '../services/StorageService';
import { supabase } from '../supabase';

export class Symbol {
  id: string;
  name: string | null;
  url: string | null;
  private storage: IStorageService;

  constructor(id: string, name: string | null, url: string | null) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.storage = storageService;
  }

  setURL(url: string | null) {
    this.url = url;
  }

  static fromId(id: string): Symbol | null {
    return new Symbol(id, null, null);
  }

  async getImageURL() {
    if (!this.url) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // List files in the user's directory to find the matching file
      const { data: files, error } = await supabase.storage
        .from('symbols')
        .list(`${user.id}`);

      if (error) {
        throw error;
      }

      // Find the file that matches our symbol ID (regardless of extension)
      const matchingFile = files?.find(file => file.name.startsWith(`${this.id}.`));
      
      if (matchingFile) {
        this.url = await this.storage.getFileURL(matchingFile.name);
        return this.url;
      }

      throw new Error('Symbol image not found');
    }
    return this.url;
  }

  async uploadImage(file: File): Promise<string> {
    console.log('Starting image upload for symbol:', this.id);
    try {
      this.url = await this.storage.uploadSymbol(this.id, file);
      return this.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  async deleteImage() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    await this.storage.deleteFile(`${user.id}/${this.id}.png`);
    this.url = null;
  }
}
