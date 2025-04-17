import { 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth } from './firebase';

class Auth {
  // Sign up with email and password
  async signUpWithEmailAndPassword(email: string, password: string): Promise<string | null> {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return null;
    } catch (error: any) {
      console.log("errorCode: ", error.code);
      console.log("errorMessage: ", error.message);
      return error.message;
    }
  }

  // Sign in with email and password
  async signInWithEmailAndPassword(email: string, password: string): Promise<string | null> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null;
    } catch (error: any) {
      console.log("errorCode: ", error.code);
      console.log("errorMessage: ", error.message);
      return error.message;
    }
  }

  // Sign out
  async signOut(): Promise<string | null> {
    try {
      await signOut(auth);
      return null;
    } catch (error: any) {
      console.log("error: ", error);
      return error.message;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<string | null> {
    try {
      await sendPasswordResetEmail(auth, email);
      return null;
    } catch (error: any) {
      console.log("error: ", error);
      return error.message;
    }
  }

  // Check if user is signed in
  isSignedIn(): boolean {
    return auth.currentUser !== null;
  }

  // Get current user email
  getCurrentUserEmail(): string {
    return auth.currentUser?.email || '';
  }

  // Get current user id
  getCurrentUserId(): string {
    return auth.currentUser?.uid || '';
  }

  // Check if password is strong enough
  isPasswordStrongEnough(password: string): boolean {
    const strongEnoughRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})"
    );
    return strongEnoughRegex.test(password);
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export default new Auth(); 