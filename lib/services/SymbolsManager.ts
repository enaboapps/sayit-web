import { StorageService } from './StorageService';
import { Symbol } from '../models/Symbol';
import { supabase } from '../supabase';

interface Picto {
    id: number;
    image_url: string;
    name?: string;
}

export class SymbolsManager {
  private readonly GLOBAL_SYMBOLS_API_URL = 'https://globalsymbols.com/api/v1/labels/search';
  private storage: StorageService;

  constructor() {
    this.storage = new StorageService(supabase);
  }

  async search(keyword: string): Promise<Symbol[]> {
    console.log('Searching symbols for keyword:', keyword);
    const symbols: Symbol[] = [];
    const kw = keyword.replace(/ /g, '%20');
    const url = `${this.GLOBAL_SYMBOLS_API_URL}?query=${kw}&limit=100`;

    try {
      const response = await fetch(url);
      const json = await response.json();

      for (const item of json) {
        const picto = item['picto'] as Picto;
        if (picto) {
          const id = picto.id;
          const imageUrl = picto.image_url;
          const name = picto.name || '';
          if (id && imageUrl) {
            const symbol = new Symbol(id.toString(), name, imageUrl);
            symbols.push(symbol);
          }
        }
      }
      console.log('Found symbols:', symbols.length);
    } catch (error) {
      console.error('Error searching symbols:', {
        keyword,
        error,
      });
    }

    return symbols;
  }

  async handleSelectedSymbol(symbol: Symbol): Promise<void> {
    if (!symbol.url) {
      throw new Error('Symbol URL is required');
    }

    try {
      // Download the image from the original URL
      const response = await fetch(symbol.url);
      const blob = await response.blob();
      
      // Create a File object with the original file type
      const file = new File([blob], `${symbol.id}.${symbol.url.split('.').pop()?.toLowerCase() || 'png'}`, {
        type: blob.type || 'image/png',
      });

      // Upload the image to storage
      const storageUrl = await this.storage.uploadSymbol(symbol.id, file);
      
      // Update the symbol with the new storage URL
      symbol.url = storageUrl;
    } catch (error) {
      throw error;
    }
  }

  async uploadSymbol(id: string, blob: Blob) {
    const file = new File([blob], `${id}.${blob.type.split('/')[1] || 'png'}`, { 
      type: blob.type,
    });
    await this.storage.uploadSymbol(id, file);
  }

  async getSymbolURL(id: string) {
    console.log('Getting symbol URL in SymbolsManager:', id);
    const url = await this.storage.getSymbolUrl(id);
    console.log('Retrieved symbol URL:', url);
    return url;
  }

  async deleteSymbol(id: string) {
    console.log('Deleting symbol in SymbolsManager:', id);
    await this.storage.deleteSymbol(id);
    console.log('Successfully deleted symbol through SymbolsManager:', id);
  }

  async getSymbol(id: number): Promise<Symbol> {
    console.log('Getting symbol in SymbolsManager:', id);
    const url = await this.getSymbolURL(id.toString());
    const symbol = new Symbol(id.toString(), '', url);
    console.log('Created symbol object:', symbol);
    return symbol;
  }
}

const symbolsManager = new SymbolsManager();
export default symbolsManager;
