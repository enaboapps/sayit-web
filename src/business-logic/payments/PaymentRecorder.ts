// This class is used to record payments in Firebase.
// It uses firestore-stripe-payments to record payments.

import { getStripePayments, createCheckoutSession, getProducts } from '@stripe/firestore-stripe-payments';
import Firebase from '../backend/Firebase';
import { addDoc, collection, doc, onSnapshot } from 'firebase/firestore';
import Auth from '../backend/Auth';

class PaymentRecorder {
    // Get the Firestore Stripe Payments instance
    getStripePayments() {
        const app = Firebase.getApp();
        if (app) {
            const stripePayments = getStripePayments(app, {
                customersCollection: 'customers',
                productsCollection: 'products',
            });
            return stripePayments;
        }
        return null;
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

    // Function to check if the user is pro
    async isPro() {
        const auth = Firebase.getAuth();
        const currentUser = auth?.currentUser;
        if (currentUser) {
            const token = await currentUser.getIdTokenResult();
            if (token.claims.stripeRole === 'pro') {
                return true;
            }
        }
        return false;
    }

    // This function redirects the user to the Stripe checkout page
    redirectToCheckout(url: string) {
        window.location.assign(url);
    }
}

export default new PaymentRecorder();