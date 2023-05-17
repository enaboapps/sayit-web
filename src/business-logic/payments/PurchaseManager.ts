// This class is used to record payments in Firebase.
// It uses firestore-stripe-payments to record payments.

import Firebase from '../backend/Firebase';
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import Auth from '../backend/Auth';
import Stripe from 'stripe';

class PurchaseManager {
    // Function to return a Stripe object
    getStripe() {
        const key = "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";
        return new Stripe(key, {
            apiVersion: "2022-11-15", // Stripe API version
            maxNetworkRetries: 3,
        });
    }

    // Function to get a price from Stripe
    async getPrice(priceId: string) {
        const stripe = this.getStripe();
        const price = await stripe.prices.retrieve(priceId, {
            expand: ["product"],
        });
        // This is returned in the following format:
        // 1.00 will be returned as 100
        // Format it to 1.00
        const amount = price.unit_amount || 0;
        const formattedPrice = (amount / 100).toFixed(2);
        // Return the formatted price and the currency
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: price.currency,
        }).format(Number(formattedPrice));
    }

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

    // Function to retrieve a session
    async retrieveSession(sessionId: string) {
        const stripe = this.getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["status"],
        });
        return session;
    }

    // Function to check if a session is paid
    async isPaid(sessionId: string) {
        const session = await this.retrieveSession(sessionId);
        return session.payment_status === "paid";
    }

    // Function to check if the user is pro
    async isPro() {
        const db = Firebase.getDb();
        let pro = false;
        if (db) {
            const col = collection(db, 'customers');
            const docRef = await getDoc(doc(col, Auth.getCurrentUserId() || ''));
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

let purchaseManager: PurchaseManager | null = null;

function getPurchaseManager() {
    if (!purchaseManager) {
        purchaseManager = new PurchaseManager();
    }
    return purchaseManager;
}

export default getPurchaseManager;