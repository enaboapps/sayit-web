// This is a model of a Symbol object:

import getSymbolsManager from "../SymbolManager";

export class Symbol {
    id: number;
    imageURL?: string;

    constructor(id: number) {
        this.id = id;
    }

    setURL(url: string) {
        this.imageURL = url;
    }

    async getImageURL() {
        if (!this.imageURL) {
            const symbolsManager = getSymbolsManager();
            this.imageURL = await symbolsManager.getImageURL(this.id);
        }
        return this.imageURL;
    }
}