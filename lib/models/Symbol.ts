import { type IStorageService, storageService } from '../services/StorageService'
import { supabase } from '../supabase'

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
            this.url = await this.storage.getFileURL(`${this.id}.png`);
        }
        return this.url;
    }

    async uploadImage(file: File): Promise<string> {
        console.log('Starting image upload for symbol:', this.id)
        console.log('File details:', {
            name: file.name,
            type: file.type,
            size: file.size
        })

        try {
            console.log('Uploading to Supabase storage...')
            const { data, error } = await this.storage.uploadSymbolImage(file, this.id)
            
            if (error) {
                console.error('Error uploading image:', {
                    error
                })
                throw error
            }

            console.log('Upload successful:', {
                path: data?.path,
                publicUrl: data?.publicUrl
            })

            if (data?.publicUrl) {
                this.url = data.publicUrl
                // Save the URL to the database
                const { error: updateError } = await supabase
                    .from('symbols')
                    .update({ url: this.url })
                    .eq('id', this.id)
                
                if (updateError) {
                    console.error('Error saving URL to database:', updateError)
                    throw updateError
                }
            }

            return this.url || ''
        } catch (error) {
            console.error('Failed to upload image:', {
                error,
                symbolId: this.id,
                fileName: file.name
            })
            throw error
        }
    }

    async deleteImage() {
        await this.storage.deleteFile(`symbols/${this.id}.png`);
        this.url = null;
    }
} 