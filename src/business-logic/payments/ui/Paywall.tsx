// This page displays the paywall for the app
// It will display the paywall in a list
// It uses Stripe to process payments

import React from 'react';
import getPurchaseManager from '../PurchaseManager';
import BaseLayout from '../../../layout/BaseLayout';
import '../../../global.css';

function Paywall() {
    // State of the button
    // enabled or disabled boolean
    const [buttonState, setButtonState] = React.useState(true);

    // State of the price
    // null or price object
    const [price, setPrice] = React.useState("");

    const priceId = "price_1N8h7yHFy05HLttR0rmb6NeO";

    React.useEffect(() => {
        async function getPrice() {
            const price = await getPurchaseManager().getPrice(priceId);
            setPrice(price);
        }
        getPrice();
    }, []);

    async function handleBuyClick() {
        setButtonState(false);
        const host = "https://" + window.location.host;
        const successUrl = host + "/paywall/success";
        const cancelUrl = host + "/paywall/cancel";
        console.log("Creating session with priceId: " + priceId);
        const session = await getPurchaseManager().createSession('payment', priceId, successUrl, cancelUrl);
    }

    function priceElement() {
        if (price === "") {
            return null;
        }
        return (
            <div className="settings-item">
                <label>Price</label>
                <p>{price}</p>
            </div>
        );
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
                {priceElement()}
                <button className="btn-default" onClick={handleBuyClick} disabled={!buttonState}>Buy</button>
            </div>
        </BaseLayout>
    );
}

export default Paywall;