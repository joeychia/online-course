import { initializeApp } from 'firebase/app';

const getEnvVar = (key: string): string => {
    return typeof process !== 'undefined' && process.env
        ? process.env[`VITE_${key}`] || import.meta.env[`VITE_${key}`]
        : import.meta.env[`VITE_${key}`] || '';
};

const firebaseConfig = {
    apiKey: getEnvVar('FIREBASE_API_KEY'),
    authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('FIREBASE_APP_ID')
};

export const app = initializeApp(firebaseConfig);