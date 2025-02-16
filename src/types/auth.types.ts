import { UserProfile } from './user.types';

export interface AuthUser {
  id: string;
  name: string;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}
