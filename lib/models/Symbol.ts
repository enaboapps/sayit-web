import cloudStorageManager from '../services/CloudStorageManager';

export class Symbol {
    id: string;
    name: string | null;
    url: string | null;

    constructor(id: string, name: string | null, url: string | null) {
        this.id = id;
        this.name = name;
        this.url = url;
    }

    setURL(url: string | null) {
        this.url = url;
    }

    static fromId(id: number): Symbol | null {
        return new Symbol(id.toString(), null, null);
    }

    async getImageURL() {
        if (!this.url) {
            this.url = await cloudStorageManager.getFileURL(`symbols/${this.id}.png`);
        }
        return this.url;
    }
} 