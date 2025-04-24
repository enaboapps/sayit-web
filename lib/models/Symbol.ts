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
      // Try both PNG and SVG
      const extensions = ['png', 'svg'];
      for (const extension of extensions) {
        try {
          this.url = await this.storage.getFileURL(`${this.id}.${extension}`);
          if (this.url) return this.url;
        } catch {
          continue;
        }
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
