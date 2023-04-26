import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

class Firebase {
    setup() {
        const firebaseConfig = {
            apiKey: "AIzaSyBh4y_-wcEKf4mSlp0pruAP16WQn3HTlII",
            authDomain: "sayit-b44d5.firebaseapp.com",
            databaseURL: "https://sayit-b44d5.firebaseio.com",
            projectId: "sayit-b44d5",
            storageBucket: "sayit-b44d5.appspot.com",
            messagingSenderId: "608911208973",
            appId: "1:608911208973:web:1b8355fc596ff3943d9b44",
            measurementId: "G-J1XJKTDB25"
        };
        // Initialize Firebase
        this.app = initializeApp(firebaseConfig);
        this.analytics = getAnalytics(this.app);
        this.auth = getAuth();
    }

    getApp() {
        return this.app;
    }

    getAuth() {
        return this.auth;
    }
}

export default new Firebase();