import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Symbol } from "../../symbols/models/Symbol";

class PhraseBoard {
    id: string;
    name: string;
    symbol: Symbol | null;
    position: number;
    phrases: any;

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
        this.name = "";
        this.symbol = null;
        this.position = 0;
    }

    // Construct from a Firebase document
    static fromDocument(doc: QueryDocumentSnapshot<DocumentData>) {
        const data = doc.data();
        const phraseBoard = new PhraseBoard();
        phraseBoard.id = doc.id;
        phraseBoard.name = data.name;
        if (data.symbolId && data.symbolId !== 0) {
            phraseBoard.symbol = new Symbol(data.symbolId);
        }
        phraseBoard.position = data.position;
        return phraseBoard;
    }

    // Construct a json object for Firebase
    toDocument() {
        let symbolId = null;
        if (this.symbol) {
            symbolId = this.symbol.id;
        }
        if (symbolId) {
            return {
                id: this.id,
                name: this.name,
                symbolId: symbolId,
                position: this.position,
            };
        }
        return {
            id: this.id,
            name: this.name,
            symbolId: 0,
            position: this.position,
        };
    }

    deletePhrase(index: number) {
        this.phrases.splice(index, 1);
    }
}

export default PhraseBoard; 