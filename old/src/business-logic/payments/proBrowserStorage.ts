// This file contains functions to store and retrieve the user's pro status in the browser's local storage.

export function setProStatus(isPro: boolean) {
    localStorage.setItem('isPro', JSON.stringify(isPro));
}

export function getProStatus() {
    const isPro = localStorage.getItem('isPro') || 'false';
    if (isPro === 'true') {
        return true;
    }
    return false;
}