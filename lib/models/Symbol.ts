import cloudStorageManager from '../services/CloudStorageManager';

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
            this.imageURL = await cloudStorageManager.getFileURL(`symbols/${this.id}.png`);
        }
        return this.imageURL;
    }
} 