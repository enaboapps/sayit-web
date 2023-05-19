// This page indicates that the user has successfully paid for the app

import React, { useEffect } from 'react';
import BaseLayout from '../../../layout/BaseLayout';
import '../../../global.css';
import getPurchaseManager from '../PurchaseManager';
import { getSessionId } from '../stripeSessionStorage';
import { onAuthStateChanged } from 'firebase/auth';
import Firebase from '../../backend/Firebase';

function PaymentSuccess() {
    // Error state
    const [error, setError] = React.useState("");
    const [isSub, setIsSub] = React.useState(false);

    // Retrieve the customer 
    useEffect(() => {
        async function checkSession() {
            const id = getSessionId();
            if (!id) {
                setError("Oops, something went wrong");
                console.log("Session not found");
                return;
            }
            const session = await getPurchaseManager().retrieveSession(id);
            if (!session) {
                setError("Oops, something went wrong");
                console.log("Session not found");
                return;
            }
            setIsSub(session.mode === "subscription");
            const paid = await getPurchaseManager().isPaid(session);
            if (!paid) {
                setError("Oops, something went wrong");
                console.log("Payment not found");
                return;
            } else {
                await getPurchaseManager().setPro(session.customer?.toString() || '', session.mode);
            }
        }
        // Use onAuthStateChanged to check if the user is logged in
        const auth = Firebase.getAuth();
        if (auth) {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    checkSession();
                } else {
                    setError("Oops, something went wrong");
                }
            });
        } else {
            setError("Oops, something went wrong");
            console.log("Auth not found");
        }
    }, []);

    return (
        <BaseLayout>
            <div className="container">
                {error != "" && (
                    <div>
                        <h1>Payment Error</h1>
                        <p>{error}</p>
                    </div>
                ) || (
                    <div>
                        <h1>Payment Success</h1>
                        <p>Payment was successful</p>
                    </div>
                )}
            </div>
        </BaseLayout>
    );
}

export default PaymentSuccess;