// This class is used to manage purchases
// It is used to create a session, retrieve a session, check if a session is paid, check if the user is pro, and set the user as pro
// It is also used to redirect the user to the Stripe checkout page

import Firebase from '../backend/Firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import Auth from '../backend/Auth';
import Stripe from 'stripe';
import { setSessionId } from './stripeSessionStorage';
import { getProStatus, setProStatus } from './proBrowserStorage';

// Test credentials for Stripe:
const stripeTestKey = "sk_test_51N5QMCHFy05HLttRx6ciQZMvLkpmsoXwLAAEIz1HPhFVTk9bOQ0KhV0xK6v9PeR8hiPsjOMEey1Rc6PQNH53ohNH00GRpWzSen";
const stripeOTPTestPriceId = "price_1N5QTOHFy05HLttR9XqlArL1";
const stripeSubTestPriceId = "price_1N9SelHFy05HLttRs2ddf9xs";

// Live credentials for Stripe:
const stripeLiveKey = "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";
const stripeOTPLivePriceId = "price_1N8h7yHFy05HLttR0rmb6NeO";
const stripeSubLivePriceId = "price_1N8h4THFy05HLttRCKTj2wlT";

class PurchaseManager {
    // Function to return a Stripe object
    getStripe() {
        return new Stripe(stripeLiveKey, {
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

    // Function to get the price for a subscription
    async getSubPrice() {
        return await this.getPrice(stripeSubLivePriceId);
    }

    // Function to get the price for a one-time purchase
    async getOTPPrice() {
        return await this.getPrice(stripeOTPLivePriceId);
    }

    // Function to start a checkout session for a subscription
    async startSubCheckoutSession(successUrl: string, cancelUrl: string) {
        return await this.createSession("subscription", stripeSubLivePriceId, successUrl, cancelUrl);
    }

    // Function to start a checkout session for a one-time purchase
    async startOTPCheckoutSession(successUrl: string, cancelUrl: string) {
        return await this.createSession("payment", stripeOTPLivePriceId, successUrl, cancelUrl);
    }

    // Create a session for a payment
    async createSession(sessionMode: Stripe.Checkout.SessionCreateParams.Mode, priceId: string, successUrl: string, cancelUrl: string) {
        const stripe = this.getStripe();
        const session = await stripe.checkout.sessions.create({
            mode: sessionMode,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        // Redirect the user to the Stripe checkout page and store the session ID
        if (session && session.url && session.id) {
            setSessionId(session.id);
            this.redirectToCheckout(session.url);
        }
        // Return the session
        return session;
    }

    // Function to retrieve a session
    async retrieveSession(sessionId: string) {
        const stripe = this.getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return session;
    }

    // Function to check if a session is paid
    async isPaid(session: Stripe.Checkout.Session) {
        return session.payment_status === "paid";
    }

    // Function to check if a session is paid and is a subscription
    async isPaidSub(session: Stripe.Checkout.Session) {
        return session.payment_status === "paid" && session.mode === "subscription";
    }

    // Function to check if the user is pro
    async isPro() {
        // First, check the browser storage
        if (getProStatus()) {
            return true;
        }

        // If not, check the subscription status in the database
        if (await this.isSubscriber()) {
            return true;
        }

        const db = Firebase.getDb();
        let pro = false;
        if (db) {
            const col = collection(db, 'customers');
            const docRef = await getDoc(doc(col, Auth.getCurrentUserId() || ''));
            if (docRef.exists()) {
                const data = docRef.data();
                if (data) {
                    pro = data.isPro;
                    setProStatus(pro);
                }
            }
        }
        return pro;
    }

    // Function to set the user as pro
    async setPro(customerId: string, type: string) {
        // First, set the pro status in the browser storage
        setProStatus(true);

        const db = Firebase.getDb();
        if (db) {
            const docRef = doc(db, 'customers', Auth.getCurrentUserId() || '');
            await setDoc(docRef, {
                customerId: customerId,
                type: type,
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

    // Function to check if the user is a subscriber
    async isSubscriber() {
        // first get the customer ID from firestore
        const db = Firebase.getDb();
        let customerId = '';
        if (db) {
            const col = collection(db, 'customers');
            const docRef = await getDoc(doc(col, Auth.getCurrentUserId() || ''));
            if (docRef.exists()) {
                const data = docRef.data();
                if (data) {
                    customerId = data.customerId;
                }
            }
        }
        // Then check if the customer is a subscriber
        const stripe = this.getStripe();
        const customer = await stripe.customers.retrieve(customerId);
        if (customer as Stripe.Customer) {
            const customerData = customer as Stripe.Customer;
            if (customerData.subscriptions) {
                const subscriptions = customerData.subscriptions.data;
                if (subscriptions && subscriptions.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    // Function to go to customer portal
    async goToCustomerPortal() {
        const db = Firebase.getDb();
        let customerId = '';
        if (db) {
            const col = collection(db, 'customers');
            const docRef = await getDoc(doc(col, Auth.getCurrentUserId() || ''));
            if (docRef.exists()) {
                const data = docRef.data();
                if (data) {
                    customerId = data.customerId;
                }
            }
        }
        const stripe = this.getStripe();
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: window.location.href,
        });
        window.location.assign(portalSession.url);
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