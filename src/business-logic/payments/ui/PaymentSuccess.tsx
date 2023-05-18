// This page indicates that the user has successfully paid for the app

import React, { useEffect } from 'react';
import BaseLayout from '../../../layout/BaseLayout';
import '../../../global.css';
import getPurchaseManager from '../PurchaseManager';
import { getSessionId } from '../stripeSessionStorage';

function PaymentSuccess() {
    // Error state
    const [error, setError] = React.useState("");

    // Retrieve the customer 
    useEffect(() => {
        async function checkSession() {
            const id = getSessionId();
            if (!id) {
                setError("Oops, something went wrong");
                return;
            }
            const paid = await getPurchaseManager().isPaid(id);
            if (!paid) {
                setError("Oops, something went wrong");
                return;
            } else {
                getPurchaseManager().setPro();
            }
        }
    }, []);

    return (
        <BaseLayout>
            <div className="container">
                {error && (
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