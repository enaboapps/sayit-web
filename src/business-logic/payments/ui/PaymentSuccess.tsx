// This page indicates that the user has successfully paid for the app

import React, { useEffect } from 'react';
import BaseLayout from '../../../layout/BaseLayout';
import '../../../global.css';

function PaymentSuccess() {
    // Retrieve the customer 
    useEffect(() => {
        async function fetchData() {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');
            const stripe = (window as any).Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            console.log(session);
        }
        fetchData();
    }, []);

    return (
        <BaseLayout>
            <div className="container">
                <h1>Payment Successful</h1>
                <p>Thank you for your payment</p>
            </div>
        </BaseLayout>
    );
}

export default PaymentSuccess;