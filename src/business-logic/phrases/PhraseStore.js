// This class manages the CRUD operations for phrases and phrase boards
// The data is stored in Firebase Firestore
// The data is stored in the following path: {uid}-phraseboards/{phraseBoardId}

import { doc, getDoc, getDocs, addDoc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import Firebase from '../backend/Firebase';
import Auth from '../backend/Auth';
import PhraseBoard from './models/PhraseBoard';
import Phrase from './models/Phrase';

class PhraseStore {
    // Variables to keep track of the number of phrase boards and phrases
    // This is used to determine the position of a new phrase board or phrase
    phraseBoardCount;
    phraseCount;

    constructor() {
        this.phraseBoardCount = 0;
        this.phraseCount = 0;
    }

    getCollectionName() {
        const user = Auth.getCurrentUserId();
        return `${user}-phraseboards`;
    }

    getCollection() {
        const db = Firebase.getDb();
        const collectionName = this.getCollectionName();
        return collection(db, collectionName);
    }

    // Create a new phrase board
    // Returns true if the phrase board was successfully created, false otherwise
    async createPhraseBoard(name, symbol = null) {
        const col = this.getCollection();
        const phraseBoard = new PhraseBoard();
        phraseBoard.name = name;
        phraseBoard.position = this.phraseBoardCount + 1;
        var success = false;
        await addDoc(col, phraseBoard.toDocument())
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
                success = true;
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
                success = false;
            });
        return success;
    }

    // Delete a phrase board
    // Returns true if the phrase board was successfully deleted, false otherwise
    async deletePhraseBoard(phraseBoardId) {
        const col = this.getCollection();
        const docRef = doc(col, phraseBoardId);
        var success = false;
        await deleteDoc(docRef)
            .then(() => {
                console.log("Document successfully deleted!");
                success = true;
            })
            .catch((error) => {
                console.error("Error removing document: ", error);
                success = false;
            });
        return success;
    }

    // Get a phrase board
    // Returns the phrase board if it exists, null otherwise
    async getPhraseBoard(phraseBoardId, callback) {
        const col = this.getCollection();
        const docRef = doc(col, phraseBoardId);
        await getDoc(docRef)
            .then((doc) => {
                if (doc.exists()) {
                    callback(PhraseBoard.fromDocument(doc));
                } else {
                    console.log("No such document!");
                    callback(null);
                }
            })
            .catch((error) => {
                console.log("Error getting document:", error);
                callback(error);
            });
    }

    // Get all phrase boards
    // Returns an array of phrase boards via the callback function
    async getAllPhraseBoards(callback) {
        const col = this.getCollection();
        await getDocs(col)
            .then((querySnapshot) => {
                const phraseBoards = [];
                querySnapshot.forEach((doc) => {
                    phraseBoards.push(PhraseBoard.fromDocument(doc));
                });
                this.phraseBoardCount = phraseBoards.length;
                // Order the phrase boards by position
                phraseBoards.sort((a, b) => a.position - b.position);
                callback(phraseBoards);
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
    }

    // Update a phrase board
    // Returns true if the phrase board was successfully updated, false otherwise
    async updatePhraseBoard(phraseBoardId, name, symbol = null) {
        const col = this.getCollection();
        const docRef = doc(col, phraseBoardId);
        const phraseBoard = new PhraseBoard();
        phraseBoard.id = phraseBoardId;
        phraseBoard.name = name;
        var success = false;
        await setDoc(docRef, phraseBoard.toDocument())
            .then(() => {
                console.log("Document successfully updated!");
                success = true;
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
                success = false;
            });
        return success;
    }

    // Create a new phrase
    // Returns true if the phrase was successfully created, false otherwise
    async createPhrase(phraseBoardId, text, symbol = null) {
        const col = this.getCollection();
        const phraseCol = collection(col, phraseBoardId, "phrases");
        const phrase = new Phrase();
        phrase.text = text;
        phrase.position = this.phraseCount + 1;
        var success = false;
        await addDoc(phraseCol, phrase.toDocument())
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
                success = true;
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
                success = false;
            });
        return success;
    }

    // Delete a phrase
    // Returns true if the phrase was successfully deleted, false otherwise
    async deletePhrase(phraseBoardId, phraseId) {
        const col = this.getCollection();
        const phraseCol = collection(col, phraseBoardId, "phrases");
        const docRef = doc(phraseCol, phraseId);
        var success = false;
        await deleteDoc(docRef)
            .then(() => {
                console.log("Document successfully deleted!");
                success = true;
            })
            .catch((error) => {
                console.error("Error removing document: ", error);
                success = false;
            });
        return success;
    }

    // Get a phrase
    // Returns the phrase if it exists, null otherwise
    async getPhrase(phraseBoardId, phraseId, callback) {
        const col = this.getCollection();
        const phraseCol = collection(col, phraseBoardId, "phrases");
        const docRef = doc(phraseCol, phraseId);
        await getDoc(docRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    callback(Phrase.fromDocument(docSnap));
                } else {
                    callback(null);
                }
            })
            .catch((error) => {
                console.log("Error getting document: ", error);
                callback(null);
            });
    }

    // Get all phrases
    // Returns an array of phrases
    async getPhrases(phraseBoardId, callback) {
        const col = this.getCollection();
        const phraseCol = collection(col, phraseBoardId, "phrases");
        await getDocs(phraseCol)
            .then((querySnapshot) => {
                const phrases = [];
                querySnapshot.forEach((doc) => {
                    console.log(doc.id, " => ", doc.data());
                    phrases.push(Phrase.fromDocument(doc));
                });
                this.phraseCount = phrases.length;
                // Order the phrases by their position
                phrases.sort((a, b) => {
                    return a.position - b.position;
                });
                for (var i = 0; i < phrases.length; i++) {
                    console.log(phrases[i].text);
                }
                callback(phrases);
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
                callback(null);
            });
    }

    // Update a phrase
    async updatePhrase(phraseBoardId, phraseId, phrase) {
        const col = this.getCollection();
        const phraseCol = collection(col, phraseBoardId, "phrases");
        const p = new Phrase();
        p.id = phraseId;
        p.text = phrase.text;
        p.position = phrase.position;
        console.log(p.toDocument());
        const docRef = doc(phraseCol, phraseId);
        var success = false;
        await setDoc(docRef, p.toDocument())
            .then(() => {
                console.log("Document successfully updated!");
                success = true;
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
                success = false;
            });
        return success;
    }
}

let phraseStoreInstance = null; // Singleton instance of PhraseStore

// Get the singleton instance of PhraseStore
function getPhraseStoreInstance() {
    if (phraseStoreInstance == null) {
        phraseStoreInstance = new PhraseStore();
    }
    return phraseStoreInstance;
}

export default getPhraseStoreInstance;