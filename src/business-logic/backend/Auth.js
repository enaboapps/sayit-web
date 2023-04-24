import Firebase from "./Firebase";
import { sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

class Auth {
    constructor() {
        // Initialize Firebase auth
        this.auth = Firebase.getAuth();
    }

    // Sign up with email and password
    // Returns a promise with true if the user has successfully signed up, false otherwise
    async signUpWithEmailAndPassword(email, password) {
        createUserWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                console.log("user: ", user);
                return true;
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("errorCode: ", errorCode);
                console.log("errorMessage: ", errorMessage);
                return false;
            });
    }

    // Sign in with email and password
    // Returns a promise with true if the user has successfully signed in, false otherwise
    async signInWithEmailAndPassword(email, password) {
        signInWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                console.log("user: ", user);
                return true;
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("errorCode: ", errorCode);
                console.log("errorMessage: ", errorMessage);
                return false;
            });
    }

    // Sign out
    // Returns a promise with true if the user has successfully signed out, false otherwise
    async signOut() {
        signOut(this.auth)
            .then(() => {
                // Sign-out successful.
                return true;
            })
            .catch((error) => {
                // An error happened.
                return false;
            });
    }

    // Request a password reset email
    // Returns a promise with true if the email has been sent, false otherwise
    async sendPasswordResetEmail(email) {
        console.log("sendPasswordResetEmail with email: ", email);
        sendPasswordResetEmail(this.auth, email)
            .then(() => {
                // Email sent.
                return true;
            })
            .catch((error) => {
                // An error happened.
                console.log("error: ", error);
                return false;
            });
    }

    // Function to check if a password is strong enough
    // Returns true if the password is strong enough, false otherwise
    // 8 characters, 1 uppercase, 1 lowercase, 1 number
    isPasswordStrongEnough(password) {
        const strongEnoughRegex = new RegExp(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})"
        );
        return strongEnoughRegex.test(password);
    }
}

export default new Auth();