// This is a model of a Symbol object:

import getCloudStorageManager from "../../backend/CloudStorageManager";
import getSymbolsManager from "../SymbolManager";

export class Symbol {
    id: number;
    imageURL?: string;

    constructor(id: number) {
        this.id = id;
    }

    async getImageURL(): Promise<string | undefined> {
        if (!this.imageURL) {
            const symbolsManager = getSymbolsManager();
            this.imageURL = await symbolsManager.getImageURL(this.id);
        }
        return this.imageURL;
    }
}