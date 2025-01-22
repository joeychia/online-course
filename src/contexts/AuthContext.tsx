import React, { createContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';
import { firestoreService } from '../services/firestoreService';
import { UserProfile } from '../types';

export interface AuthContextType {
    currentUser: FirebaseUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<FirebaseUser>;
    signInWithGoogle: () => Promise<FirebaseUser>;
    signUp: (email: string, password: string) => Promise<FirebaseUser>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const profile = await firestoreService.getUserById(user.uid);
                    if (profile && 'id' in profile) {
                        const now = new Date();
                        setUserProfile({
                            id: profile.id,
                            name: profile.name || user.displayName || 'Anonymous',
                            email: profile.email || user.email || '',
                            roles: profile.roles,
                            createdAt: now,
                            updatedAt: now,
                            registeredCourses: profile.registeredCourses || [],
                            progress: profile.progress || {},
                            groupIds: profile.groupIds || [],
                            notes: profile.notes || {},
                            QuizHistory: profile.QuizHistory || []
                        });
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value: AuthContextType = {
        currentUser,
        userProfile,
        loading,
        signIn: authService.signIn,
        signInWithGoogle: authService.signInWithGoogle,
        signUp: authService.signUp,
        signOut: authService.signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 