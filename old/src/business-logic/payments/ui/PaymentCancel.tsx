// This page is the cancel page for the paywall

import React from 'react';
import BaseLayout from '../../../layout/BaseLayout';
import '../../../global.css';

function PaymentCancel() {
    return (
        <BaseLayout>
            <div className="container">
                <h1>Payment Cancelled</h1>
                <p>Payment was cancelled</p>
            </div>
        </BaseLayout>
    );
}

export default PaymentCancel;