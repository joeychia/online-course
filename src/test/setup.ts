import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Firebase modules to prevent real network calls and avoid needing actual credentials
// Mock app initialization
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({
    name: '[DEFAULT]',
    options: {},
    automaticDataCollectionEnabled: false
  }))
}));

// Mock auth to control user state in tests
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn()
  })),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(() => ({
    addScope: vi.fn(),
    setCustomParameters: vi.fn()
  })),
  signInWithPopup: vi.fn()
}));

// Mock Firestore to control database operations in tests
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  limit: vi.fn(),
  deleteDoc: vi.fn()
}));

// Mock Firebase config to avoid using real credentials
vi.mock('../services/firebaseConfig', () => ({
  app: {
    name: '[DEFAULT]',
    options: {},
    automaticDataCollectionEnabled: false
  }
}));

// Mock auth service to control authentication state
vi.mock('../services/authService', () => ({
  authService: {
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    getCurrentUser: vi.fn()
  }
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
interface MediaQueryList {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: () => void;
  removeListener: () => void;
  addEventListener: () => void;
  removeEventListener: () => void;
  dispatchEvent: () => boolean;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
