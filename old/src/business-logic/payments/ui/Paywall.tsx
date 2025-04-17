// This page displays the paywall for the app
// It will display the one-time payment option and the subscription option
// and their respective prices

import React from 'react';
import getPurchaseManager from '../PurchaseManager';
import BaseLayout from '../../../layout/BaseLayout';
import '../../../global.css';
import './styles/Paywall.css';

function Paywall() {
    // Error state
    const [error, setError] = React.useState("");

    // One-time payment state
    const [oneTimePaymentPrice, setOneTimePaymentPrice] = React.useState("");
    const [oneTimePaymentLoading, setOneTimePaymentLoading] = React.useState(false);

    // Subscription state
    const [subscriptionPrice, setSubscriptionPrice] = React.useState("");
    const [subscriptionLoading, setSubscriptionLoading] = React.useState(false);

    // Retrieve the prices
    React.useEffect(() => {
        async function getPrices() {
            const oneTimePrice = await getPurchaseManager().getOTPPrice();
            const subscriptionPrice = await getPurchaseManager().getSubPrice();
            if (oneTimePrice) {
                setOneTimePaymentPrice(oneTimePrice);
            }
            if (subscriptionPrice) {
                setSubscriptionPrice(subscriptionPrice);
            }
        }
        getPrices();
    }, []);

    // define success and cancel urls
    const successUrl = window.location.origin + "/payment/success";
    const cancelUrl = window.location.origin + "/payment/cancel";

    // One-time payment handler
    const handleOneTimePayment = async () => {
        if (subscriptionLoading || oneTimePaymentLoading) {
            return;
        }
        setOneTimePaymentLoading(true);
        await getPurchaseManager().startOTPCheckoutSession(successUrl, cancelUrl);
        setOneTimePaymentLoading(false);
    }

    // Subscription handler
    const handleSubscription = async () => {
        if (subscriptionLoading || oneTimePaymentLoading) {
            return;
        }
        setSubscriptionLoading(true);
        await getPurchaseManager().startSubCheckoutSession(successUrl, cancelUrl);
        setSubscriptionLoading(false);
    }

    const whatYouGet = () => {
        return (
            <div className="what-you-get">
                <h2>What you get</h2>
                <p>By paying for the app, you get access to all the features of the app, including:</p>
                <ul>Unlimited access to the app</ul>
                <ul>Access to all future features</ul>
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Upgrade to Pro</h1>
                {error != "" && (
                    <div>
                        <h1>Payment Error</h1>
                        <p>{error}</p>
                    </div>
                ) || (
                    <div>
                        {whatYouGet()}
                        <h1>Payment Options</h1>
                        <div className="grid">
                            <button className='card' onClick={handleOneTimePayment}>
                                <h2>One-time Payment</h2>
                                <p>{oneTimePaymentPrice}</p>
                                {oneTimePaymentLoading && (
                                    <p>Loading...</p>
                                )}
                            </button>
                            <button className='card' onClick={handleSubscription}>
                                <h2>Subscription</h2>
                                <p>{subscriptionPrice} / month</p>
                                {subscriptionLoading && (
                                    <p>Loading...</p>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </BaseLayout>
    );
}

export default Paywall;