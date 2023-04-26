import { sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import Firebase from "./Firebase";

class Auth {
    getAuth() {
        return Firebase.getAuth();
    }

    // Sign up with email and password
    // Returns null if the user has successfully signed up, an error otherwise
    async signUpWithEmailAndPassword(email, password) {
        const auth = this.getAuth();
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                console.log("user: ", user);
                return null;
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("errorCode: ", errorCode);
                console.log("errorMessage: ", errorMessage);
                return errorMessage;
            });
    }

    // Sign in with email and password
    // Returns null if the user has successfully signed in, an error otherwise
    async signInWithEmailAndPassword(email, password) {
        const auth = this.getAuth();
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                console.log("user: ", user);
                return null;
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("errorCode: ", errorCode);
                console.log("errorMessage: ", errorMessage);
                return errorMessage;
            });
    }

    // Sign out
    // Returns null if the user has successfully signed out, an error otherwise
    async signOut() {
        const auth = this.getAuth();
        signOut(auth)
            .then(() => {
                // Sign-out successful.
                return null;
            })
            .catch((error) => {
                // An error happened.
                return error;
            });
    }

    // Request a password reset email
    // Returns null if the email has been sent, an error otherwise
    async sendPasswordResetEmail(email) {
        console.log("sendPasswordResetEmail with email: ", email);
        const auth = this.getAuth();
        sendPasswordResetEmail(auth, email)
            .then(() => {
                // Email sent.
                return null;
            })
            .catch((error) => {
                // An error happened.
                console.log("error: ", error);
                return error;
            });
    }

    // Function to check if user is signed in
    // Returns true if the user is signed in, false otherwise
    isSignedIn() {
        const auth = this.getAuth();
        const user = auth.currentUser;
        return !!user;
    }

    // Function to get the current user email
    // Returns the user email if the user is signed in, null otherwise
    getCurrentUserEmail() {
        const auth = this.getAuth();
        const user = auth.currentUser;
        if (user) {
            return user.email;
        } else {
            return null;
        }
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