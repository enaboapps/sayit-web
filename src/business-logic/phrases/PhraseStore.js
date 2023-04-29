// This class manages the CRUD operations for phrases and phrase boards
// The data is stored in Firebase Firestore
// The data is stored in the following path: {uid}-phraseboards/{phraseBoardId}

import { doc, getDoc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import Firebase from '../backend/Firebase';
import Auth from '../backend/Auth';
import PhraseBoard from './models/PhraseBoard';
import Phrase from './models/Phrase';

class PhraseStore {
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
    // Returns null if the phrase board was successfully created, an error otherwise
    async createPhraseBoard(name, symbol = null, callback) {
        const col = this.getCollection();
        const phraseBoard = new PhraseBoard(name, symbol);
        await setDoc(doc(col, phraseBoard.id), phraseBoard.toDocument())
            .then(() => {
                callback(null);
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
                callback(error);
            });
    }

    // Delete a phrase board
    // Returns null if the phrase board was successfully deleted, an error otherwise
    async deletePhraseBoard(phraseBoardId, callback) {
        const col = this.getCollection();
        const docRef = doc(col, phraseBoardId);
        await deleteDoc(docRef)
            .then(() => {
                callback(null);
            })
            .catch((error) => {
                console.error("Error removing document: ", error);
                callback(error);
            });
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
                callback(phraseBoards);
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
    }

    // Update a phrase board
    // Returns null if the phrase board was successfully updated, an error otherwise (callback)
    async updatePhraseBoard(phraseBoardId, name, symbol = null, callback) {
        const col = this.getCollection();
        const docRef = doc(col, phraseBoardId);
        const phraseBoard = new PhraseBoard(name, symbol);
        await setDoc(docRef, phraseBoard.toDocument())
            .then(() => {
                callback(null);
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
                callback(error);
            });
    }

    // Create a new phrase
    // Returns null if the phrase was successfully created, an error otherwise (callback)
    async createPhrase(phraseBoardId, title, text, callback) {
        const phrase = new Phrase(title, text);
        const col = this.getCollection();
        await setDoc(doc(col, phraseBoardId, "phrases", phrase.id), phrase.toDocument())
            .then(() => {
                console.log("Document successfully written!");
                callback(null);
            })
            .catch((error) => {
                console.error("Error writing document: ", error);
                callback(error);
            });
    }

    // Delete a phrase
    // Returns null if the phrase was successfully deleted, an error otherwise (callback)
    async deletePhrase(phraseBoardId, phraseId, callback) {
        const col = this.getCollection();
        const docRef = doc(col, phraseBoardId, "phrases", phraseId);
        await deleteDoc(docRef)
            .then(() => {
                console.log("Document successfully deleted!");
                callback(null);
            })
            .catch((error) => {
                console.error("Error removing document: ", error);
                callback(error);
            });
    }

    // Get a phrase
    // Returns the phrase if it exists, null otherwise
    async getPhrase(phraseBoardId, phraseId, callback) {
        const col = this.getCollection();
        const docRef = doc(col, phraseBoardId, "phrases", phraseId);
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
        await getDocs(col, phraseBoardId, "phrases")
            .then((querySnapshot) => {
                const phrases = [];
                querySnapshot.forEach((doc) => {
                    phrases.push(Phrase.fromDocument(doc));
                });
                callback(phrases);
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
                callback(null);
            });
    }

    // Update a phrase
    async updatePhrase(phraseBoardId, phrase, callback) {
        const col = this.getCollection();
        const docRef = doc(col, phraseBoardId, "phrases", phrase.id);
        await setDoc(docRef, phrase.toDocument())
            .then(() => {
                console.log("Document successfully written!");
                callback(null);
            })
            .catch((error) => {
                console.error("Error writing document: ", error);
                callback(error);
            });
    }
}

export default new PhraseStore();