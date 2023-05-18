// This file contains functions to store and retrieve the Stripe session ID in the browser's session storage.

export function setSessionId(sessionId: string) {
    sessionStorage.setItem('stripeSessionId', sessionId);
}

export function getSessionId() {
    return sessionStorage.getItem('stripeSessionId');
}