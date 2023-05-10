import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

class PhraseBoard {
    id: string;
    name: string;
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
        this.position = 0;
    }

    // Construct from a Firebase document
    static fromDocument(doc: QueryDocumentSnapshot<DocumentData>) {
        const data = doc.data();
        const phraseBoard = new PhraseBoard();
        phraseBoard.id = doc.id;
        phraseBoard.name = data.name;
        phraseBoard.position = data.position;
        return phraseBoard;
    }

    // Construct a json object for Firebase
    toDocument() {
        return {
            name: this.name,
            position: this.position,
        };
    }

    deletePhrase(index: number) {
        this.phrases.splice(index, 1);
    }
}

export default PhraseBoard; 