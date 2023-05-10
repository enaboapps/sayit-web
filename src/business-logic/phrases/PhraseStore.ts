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
        if (db) {
            const col = collection(db, this.getCollectionName());
            return col;
        }
        return null;
    }

    // Create a new phrase board
    // Returns true if the phrase board was successfully created, false otherwise
    async createPhraseBoard(name: string) {
        const col = this.getCollection();
        const phraseBoard = new PhraseBoard();
        phraseBoard.name = name;
        phraseBoard.position = this.phraseBoardCount + 1;
        var success = false;
        if (col) {
            await addDoc(col, phraseBoard.toDocument())
                .then((docRef) => {
                    console.log("Document written with ID: ", docRef.id);
                    success = true;
                })
                .catch((error) => {
                    console.error("Error adding document: ", error);
                    success = false;
                });
        }
        return success;
    }

    // Delete a phrase board
    // Returns true if the phrase board was successfully deleted, false otherwise
    async deletePhraseBoard(phraseBoardId: string) {
        const col = this.getCollection();
        var success = false;
        if (col) {
            await deleteDoc(doc(col, phraseBoardId))
                .then(() => {
                    console.log("Document successfully deleted!");
                    success = true;
                })
                .catch((error) => {
                    console.error("Error removing document: ", error);
                    success = false;
                });
        }
        return success;
    }

    // Get a phrase board
    // Returns the phrase board if it exists, null otherwise
    async getPhraseBoard(phraseBoardId: string, callback: (phraseBoard: PhraseBoard | undefined) => void) {
        const col = this.getCollection();
        if (col) {
            const docRef = doc(col, phraseBoardId);
            await getDoc(docRef)
                .then((doc) => {
                    if (doc.exists()) {
                        const phraseBoard = PhraseBoard.fromDocument(doc);
                        callback(phraseBoard);
                    } else {
                        console.log("No such document!");
                        callback(undefined);
                    }
                })
                .catch((error) => {
                    console.log("Error getting document:", error);
                    callback(undefined);
                });
        }
    }

    // Get all phrase boards
    // Returns an array of phrase boards via the callback function
    async getAllPhraseBoards(callback: (phraseBoards: PhraseBoard[]) => void) {
        const col = this.getCollection();
        if (col) {
            const querySnapshot = await getDocs(col);
            const phraseBoards: PhraseBoard[] = [];
            querySnapshot.forEach((doc) => {
                phraseBoards.push(PhraseBoard.fromDocument(doc));
            });
            callback(phraseBoards);
        }
    }

    // Update a phrase board
    // Returns true if the phrase board was successfully updated, false otherwise
    async updatePhraseBoard(phraseBoard: PhraseBoard) {
        const col = this.getCollection();
        var success = false;
        if (col) {
            const docRef = doc(col, phraseBoard.id);
            await setDoc(docRef, phraseBoard.toDocument())
                .then(() => {
                    console.log("Document successfully updated!");
                    success = true;
                })
                .catch((error) => {
                    console.error("Error updating document: ", error);
                    success = false;
                });
        }
        return success;
    }

    // Create a new phrase
    // Returns true if the phrase was successfully created, false otherwise
    async createPhrase(phraseBoardId: string, text: string) {
        const col = this.getCollection();
        var success = false;
        if (col) {
            const phraseCol = collection(col, phraseBoardId, "phrases");
            const phrase = new Phrase();
            phrase.text = text;
            phrase.position = this.phraseCount + 1;
            await addDoc(phraseCol, phrase.toDocument())
                .then((docRef) => {
                    console.log("Document written with ID: ", docRef.id);
                    success = true;
                })
                .catch((error) => {
                    console.error("Error adding document: ", error);
                    success = false;
                });
        }
        return success;
    }

    // Delete a phrase
    // Returns true if the phrase was successfully deleted, false otherwise
    async deletePhrase(phraseBoardId: string, phraseId: string) {
        const col = this.getCollection();
        var success = false;
        if (col) {
            const phraseCol = collection(col, phraseBoardId, "phrases");
            await deleteDoc(doc(phraseCol, phraseId))
                .then(() => {
                    console.log("Document successfully deleted!");
                    success = true;
                })
                .catch((error) => {
                    console.error("Error removing document: ", error);
                    success = false;
                });
        }
        return success;
    }

    // Get a phrase
    // Returns the phrase if it exists, null otherwise
    async getPhrase(phraseBoardId: string, phraseId: string, callback: (phrase: Phrase | undefined) => void) {
        const col = this.getCollection();
        if (col) {
            const phraseCol = collection(col, phraseBoardId, "phrases");
            const docRef = doc(phraseCol, phraseId);
            await getDoc(docRef)
                .then((doc) => {
                    if (doc.exists()) {
                        callback(Phrase.fromDocument(doc));
                    } else {
                        console.log("No such document!");
                        callback(undefined);
                    }
                })
                .catch((error) => {
                    console.log("Error getting document:", error);
                    callback(undefined);
                });
        }
    }

    // Get all phrases
    // Returns an array of phrases
    async getPhrases(phraseBoardId: string, callback: (phrases: Phrase[]) => void) {
        const col = this.getCollection();
        if (col) {
            const phraseCol = collection(col, phraseBoardId, "phrases");
            await getDocs(phraseCol)
                .then((querySnapshot) => {
                    const phrases: Phrase[] = [];
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
                    callback([]);
                });
        }
    }

    // Update a phrase
    async updatePhrase(phraseBoardId: string, phraseId: string, phrase: Phrase) {
        const col = this.getCollection();
        var success = false;
        if (col) {
            const phraseCol = collection(col, phraseBoardId, "phrases");
            const docRef = doc(phraseCol, phraseId);
            await setDoc(docRef, phrase.toDocument())
                .then(() => {
                    console.log("Document successfully updated!");
                    success = true;
                })
                .catch((error) => {
                    console.error("Error updating document: ", error);
                    success = false;
                });
        }
        return success;
    }
}

let phraseStoreInstance: PhraseStore | null = null;

// Get the singleton instance of PhraseStore
function getPhraseStoreInstance() {
    if (phraseStoreInstance == null) {
        phraseStoreInstance = new PhraseStore();
    }
    return phraseStoreInstance;
}

export default getPhraseStoreInstance;