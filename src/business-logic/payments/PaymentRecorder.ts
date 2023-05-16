// This class is used to record payments in Firebase.
// It uses firestore-stripe-payments to record payments.

import Firebase from '../backend/Firebase';
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import Auth from '../backend/Auth';

class PaymentRecorder {
    // Create a session for a payment
    async createSession(priceId: string, successUrl: string, cancelUrl: string) {
        const db = Firebase.getDb();
        if (db) {
            const collectionRef = collection(db, 'customers', Auth.getCurrentUserId() || '', 'checkout_sessions');
            const docRef = await addDoc(collectionRef, {
                mode: "payment",
                price: priceId,
                success_url: successUrl,
                cancel_url: cancelUrl,
            });
            onSnapshot(docRef, (doc) => {
                const data = doc.data();
                if (data) {
                    const { error, url } = data;
                    if (error) {
                        console.log(error);
                    }
                    if (url) {
                        this.redirectToCheckout(url);
                    }
                }
            });
        }
    }

    // Function to check if the user is pro
    async isPro() {
        const db = Firebase.getDb();
        let pro = false;
        if (db) {
            const col = collection(db, 'customers', Auth.getCurrentUserId() || '');
            const docRef = await getDoc(doc(col));
            if (docRef.exists()) {
                const data = docRef.data();
                if (data) {
                    pro = data.isPro;
                }
            }
        }
        return pro;
    }

    // Function to set the user as pro
    async setPro() {
        const db = Firebase.getDb();
        if (db) {
            const docRef = doc(db, 'customers', Auth.getCurrentUserId() || '');
            await setDoc(docRef, {
                isPro: true,
            })
                .then(() => {
                    console.log('User is now pro');
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }

    // This function redirects the user to the Stripe checkout page
    redirectToCheckout(url: string) {
        window.location.assign(url);
    }
}

export default new PaymentRecorder();