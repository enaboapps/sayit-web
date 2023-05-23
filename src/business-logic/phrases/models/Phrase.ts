import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Symbol } from "../../symbols/models/Symbol";

class Phrase {
    id: string;
    title: string;
    text: string;
    symbol: Symbol | null;
    frequency: number;
    position: number;

    constructor() {
        // generate a random id
        const randomId = () => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            let id = "";
            for (let i = 0; i < 20; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        };
        this.id = randomId();
        this.title = "";
        this.text = "";
        this.symbol = null;
        this.frequency = 0;
        this.position = 0;
    }

    // Construct from a Firebase document
    static fromDocument(doc: QueryDocumentSnapshot<DocumentData>) {
        const data = doc.data();
        const phrase = new Phrase();
        phrase.id = doc.id;
        phrase.title = data.title;
        phrase.text = data.text;
        if (data.symbolId) {
            phrase.symbol = new Symbol(data.symbolId)
        }
        phrase.frequency = data.frequency;
        phrase.position = data.position;
        return phrase;
    }

    // Construct a json object for Firebase
    toDocument() {
        return {
            title: this.title,
            text: this.text,
            symbolId: this.symbol?.id,
            position: this.position,
        };
    }
}

export default Phrase;