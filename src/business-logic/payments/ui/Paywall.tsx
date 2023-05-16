// This page displays the paywall for the app
// It will display the paywall in a list
// It uses Stripe to process payments

import React from 'react';
import PaymentRecorder from '../PaymentRecorder';
import BaseLayout from '../../../layout/BaseLayout';
import '../../../global.css';

function Paywall() {
    // State of the button
    // enabled or disabled boolean
    const [buttonState, setButtonState] = React.useState(true);

    async function handleBuyClick() {
        setButtonState(false);
        const host = "https://" + window.location.host;
        const successUrl = host + "/paywall/success";
        const cancelUrl = host + "/paywall/cancel";
        const priceId = "price_1N7N6qHFy05HLttR4MUcrhzC";
        console.log("Creating session with priceId: " + priceId);
        const session = await PaymentRecorder.createSession(priceId, successUrl, cancelUrl);
    }

    function whatYouGet() {
        return (
            <div className="settings-item">
                <label>What you get</label>
                <p>AI integration</p>
                <p>Unlimited number of Phrase Boards and Phrases</p>
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Upgrade to Pro</h1>
                {whatYouGet()}
                <button className="btn-default" onClick={handleBuyClick} disabled={!buttonState}>Buy</button>
            </div>
        </BaseLayout>
    );
}

export default Paywall;