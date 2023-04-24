import Firebase from "./Firebase";

class Auth {
    constructor() {
        // Initialize Firebase auth
        this.auth = Firebase.getAuth();
    }

    // Sign up with email and password
    // Returns a promise with true if the user has successfully signed up, false otherwise
    async signUpWithEmailAndPassword(email, password) {
        try {
            await this.auth.createUserWithEmailAndPassword(email, password);
            if (this.auth.currentUser) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // Sign in with email and password
    // Returns a promise with true if the user has successfully signed in, false otherwise
    async signInWithEmailAndPassword(email, password) {
        try {
            await this.auth.signInWithEmailAndPassword(email, password);
            if (this.auth.currentUser) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // Sign out
    // Returns a promise with true if the user has successfully signed out, false otherwise
    async signOut() {
        try {
            await this.auth.signOut();
            return true;
        } catch (error) {
            console.log(error);
            return false;
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