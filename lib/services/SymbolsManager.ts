import cloudStorageManager from './CloudStorageManager';
import { Symbol } from '../models/Symbol';

class SymbolsManager {
    private readonly GLOBAL_SYMBOLS_API_URL = 'https://globalsymbols.com/api/v1/labels/search';

    async search(keyword: string): Promise<Symbol[]> {
        const symbols: Symbol[] = [];
        const kw = keyword.replace(/ /g, "%20");
        const url = `${this.GLOBAL_SYMBOLS_API_URL}?query=${kw}&limit=100`;
        
        try {
            const response = await fetch(url);
            const json = await response.json();
            
            for (const item of json) {
                const picto = item["picto"] as { [key: string]: any };
                if (picto) {
                    const id = picto["id"] as number;
                    const imageUrl = picto["image_url"] as string;
                    const name = picto["name"] as string || '';
                    if (id && imageUrl) {
                        const symbol = new Symbol(id.toString(), name, imageUrl);
                        symbols.push(symbol);
                    }
                }
            }
        } catch (error) {
            console.error('Error searching symbols:', error);
        }

        return symbols;
    }

    async addSymbol(id: number, imageURL: string): Promise<void> {
        try {
            const response = await fetch(imageURL);
            const blob = await response.blob();
            await cloudStorageManager.uploadFile(`symbols/${id}.png`, blob);
        } catch (error) {
            console.error('Error adding symbol:', error);
            throw error;
        }
    }

    async getImageURL(id: number): Promise<string> {
        if (isNaN(id)) {
            console.error('Invalid symbol ID:', id);
            return '';
        }
        return await cloudStorageManager.getFileURL(`symbols/${id}.png`);
    }

    async getSymbol(id: number): Promise<Symbol> {
        const url = await this.getImageURL(id);
        return new Symbol(id.toString(), '', url);
    }
}

const symbolsManager = new SymbolsManager();
export default symbolsManager; 