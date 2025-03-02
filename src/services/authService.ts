import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User as FirebaseUser,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from 'firebase/auth';
import { app } from './firebaseConfig';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

class AuthService {
    async signIn(email: string, password: string): Promise<FirebaseUser> {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        return user;
    }

    async signInWithGoogle(): Promise<FirebaseUser> {
        const { user } = await signInWithPopup(auth, googleProvider);
        return user;
    }

    async signUp(email: string, password: string): Promise<FirebaseUser> {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        return user;
    }

    async signOut(): Promise<void> {
        await signOut(auth);
    }

    onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
        return onAuthStateChanged(auth, callback);
    }

    getCurrentUser(): FirebaseUser | null {
        return auth.currentUser;
    }

    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email);
    }
}

export const authService = new AuthService();