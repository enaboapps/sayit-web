// This page indicates that the user has successfully paid for the app

import React, { useEffect } from 'react';
import BaseLayout from '../../../layout/BaseLayout';
import '../../../global.css';
import PurchaseManager from '../PurchaseManager';

function PaymentSuccess() {
    // Retrieve the customer 
    useEffect(() => {
        async function setPro() {
            await PurchaseManager.setPro();
        }
        setPro();
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