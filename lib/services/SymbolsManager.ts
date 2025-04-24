import { storageService } from './StorageService';
import { Symbol } from '../models/Symbol';

interface Picto {
    id: number;
    image_url: string;
    name?: string;
}

class SymbolsManager {
  private readonly GLOBAL_SYMBOLS_API_URL = 'https://globalsymbols.com/api/v1/labels/search';

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

  async handleSelectedSymbol(symbol: Symbol): Promise<Symbol> {
    console.log('Handling selected symbol:', symbol);
    try {
      // Download the image from the original URL
      const imageResponse = await fetch(symbol.url || '');
      const blob = await imageResponse.blob();
      
      // Upload to our storage
      await this.uploadSymbol(symbol.id, blob);
      
      // Get the new storage URL
      const storedUrl = await this.getSymbolURL(symbol.id);
      symbol.setURL(storedUrl);
      
      return symbol;
    } catch (error) {
      console.error('Error handling selected symbol:', error);
      throw error;
    }
  }

  async uploadSymbol(id: string, blob: Blob) {
    console.log('Starting symbol upload in SymbolsManager:', { id, blobSize: blob.size });
    const file = new File([blob], `${id}.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });
    await storageService.uploadSymbol(id, file);
    console.log('Successfully uploaded symbol through SymbolsManager:', id);
  }

  async getSymbolURL(id: string) {
    console.log('Getting symbol URL in SymbolsManager:', id);
    const url = await storageService.getSymbolUrl(id);
    console.log('Retrieved symbol URL:', url);
    return url;
  }

  async deleteSymbol(id: string) {
    console.log('Deleting symbol in SymbolsManager:', id);
    await storageService.deleteSymbol(id);
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
