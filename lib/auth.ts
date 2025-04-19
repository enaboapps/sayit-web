import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential,
    AuthError,
    sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '@/lib/config/firebase'

export const authService = {
    signUp: async (email: string, password: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            return userCredential
        } catch (error) {
            const authError = error as AuthError
            throw new Error(authError.message)
        }
    },
    signIn: async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            return userCredential
        } catch (error) {
            const authError = error as AuthError
            throw new Error(authError.message)
        }
    },
    sendPasswordResetEmail: async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email)
        } catch (error) {
            const authError = error as AuthError
            throw new Error(authError.message)
        }
    },
    signOut: async () => {
        await signOut(auth)
    },
    isPasswordStrongEnough: (password: string) => {
        return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
    },
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback)
    },
    getCurrentUser: () => {
        return auth.currentUser
    },
    getAuth: () => {
        return auth
    }
}

