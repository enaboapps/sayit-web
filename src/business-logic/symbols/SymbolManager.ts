// This class uses a combination of the CloudStorageManager and idb to store and get symbols.

import getCloudStorageManager from "../backend/CloudStorageManager";
import { Symbol } from "./models/Symbol";
import { openDB, IDBPDatabase } from 'idb';

class SymbolsManager {
    private dbPromise: Promise<IDBPDatabase>;
    private cloudStorageManager = getCloudStorageManager();

    constructor() {
        this.dbPromise = openDB('symbols-db', 1, {
            upgrade(db) {
                db.createObjectStore('symbols', { keyPath: 'id' });
            },
        });
    }

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


    async addSymbol(id: number, blob: Blob): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('symbols', 'readwrite');
        const symbol = new Symbol(id);
        tx.store.add(symbol);
        await tx.done;
        const file = new File([blob], `${id}.png`, { type: 'image/png' });
        await this.cloudStorageManager.uploadFile(`symbols/${id}.png`, file);
    }

    async getImageURL(id: number): Promise<string | undefined> {
        const url = await this.cloudStorageManager.getFileURL(`symbols/${id}.png`);
        return url;
    }

    async getSymbol(id: number): Promise<Symbol | undefined> {
        const db = await this.dbPromise;
        let symbol = await db.get('symbols', id);
        if (!symbol) {
            symbol = new Symbol(id);
            const url = await this.cloudStorageManager.getFileURL(`symbols/${id}.png`);
            if (url) {

            }
        }
        return symbol;
    }

    async updateSymbol(symbol: Symbol): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('symbols', 'readwrite');
        tx.store.put(symbol);
        await tx.done;
    }

    async deleteSymbol(id: number): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('symbols', 'readwrite');
        tx.store.delete(id);
        await tx.done;
    }

    async getAllSymbols(): Promise<Symbol[]> {
        const db = await this.dbPromise;
        return db.getAll('symbols');
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