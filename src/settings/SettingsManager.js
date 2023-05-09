// This class manages the settings for the app
// The data is stored in Firebase Firestore
// The data is stored in the following path: {uid}-settings

import { doc, query, where, getDocs, addDoc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import Firebase from '../business-logic/backend/Firebase';
import Auth from '../business-logic/backend/Auth';
import Setting from './models/Setting';

class SettingsManager {
    getCollectionName() {
        const user = Auth.getCurrentUserId();
        return `${user}-settings`;
    }

    getCollection() {
        const db = Firebase.getDb();
        const collectionName = this.getCollectionName();
        return collection(db, collectionName);
    }

    // Create a new setting
    // Returns true if the setting was successfully created, false otherwise
    async createSetting(name, value) {
        const col = this.getCollection();
        const setting = new Setting();
        setting.name = name;
        setting.value = value;
        var success = false;
        await addDoc(col, setting.toDocument())
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

    // Delete a setting
    // Returns true if the setting was successfully deleted, false otherwise
    async deleteSetting(settingId) {
        const col = this.getCollection();
        const docRef = doc(col, settingId);
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

    // Get a setting by name
    // Returns the setting if it exists, null otherwise
    async getSettingByName(name, callback) {
        const col = this.getCollection();
        const q = query(col, where("name", "==", name));
        await getDocs(q)
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    console.log("No matching documents.");
                    callback(null);
                } else {
                    const doc = querySnapshot.docs[0];
                    const setting = new Setting();
                    setting.fromDocument(doc);
                    callback(setting);
                }
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
                callback(null);
            });
    }

    // Update a setting by name
    // Returns true if the setting was successfully updated, false otherwise
    async updateSettingByName(name, value) {
        const col = this.getCollection();
        const q = query(col, where("name", "==", name));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.log("No matching documents.");
            // create the setting
            const success = await this.createSetting(name, value);
            return success;
        }
        const d = querySnapshot.docs[0];
        const docRef = doc(col, d.id);
        var success = false;
        await setDoc(docRef, { value: value }, { merge: true })
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

let settingsManager = null;

function getSettingsManager() {
    if (!settingsManager) {
        settingsManager = new SettingsManager();
    }
    return settingsManager;
}

export default getSettingsManager;