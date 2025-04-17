// This class uses a combination of the CloudStorageManager and idb to store and get symbols.

import getCloudStorageManager from "../backend/CloudStorageManager";
import { Symbol } from "./models/Symbol";

class SymbolsManager {
    private cloudStorageManager = getCloudStorageManager();

    async search(keyword: string): Promise<Symbol[]> {
        const symbols: Symbol[] = [];
        const kw = keyword.replace(/ /g, "%20");
        const url = `https://globalsymbols.com/api/v1/labels/search?query=${kw}&limit=100`;
        const response = await fetch(url);
        const json = await response.json();
        for (const item of json) {
            console.log(item);
            const picto = item["picto"] as { [key: string]: any };
            if (picto) {
                const id = picto["id"] as number;
                const i = picto["image_url"] as string;
                if (id && i) {
                    const symbol = new Symbol(id);
                    symbol.imageURL = i;
                    symbols.push(symbol);
                }
            }
        }

        return symbols;
    }


    async addSymbol(id: number, imageURL: string): Promise<void> {
        const symbol = new Symbol(id);
        symbol.imageURL = imageURL;
        // upload the image to cloud storage
        const response = await fetch(imageURL);
        const blob = await response.blob();
        await this.cloudStorageManager.uploadFile(`symbols/${id}.png`, blob);
    }

    async getImageURL(id: number) {
        const url = await this.cloudStorageManager.getFileURL(`symbols/${id}.png`);
        return url;
    }

    async getSymbol(id: number) {
        return new Symbol(id);
    }
}

let symbolsManager: SymbolsManager | null = null;

function getSymbolsManager() {
    if (!symbolsManager) {
        symbolsManager = new SymbolsManager();
    }
    return symbolsManager;
}

export default getSymbolsManager;