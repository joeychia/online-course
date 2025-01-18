import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Course, Unit, Lesson, Quiz, UserProfile } from '../types';

dotenv.config();

interface MockData {
    courses: { [key: string]: Course };
    units: { [key: string]: Unit };
    lessons: { [key: string]: Lesson };
    quizzes?: { [key: string]: Quiz };
    users?: { [key: string]: UserProfile };
}

// Read service account JSON
const serviceAccount = JSON.parse(
    readFileSync(join(process.cwd(), 'service-account.json'), 'utf-8')
);

// Read mock data
const mockData = JSON.parse(
    readFileSync(join(process.cwd(), 'src/data/mock/mockData.json'), 'utf-8')
) as MockData;

// Initialize Firebase Admin
const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

export async function seedFirestore() {
    try {
        console.log('Starting Firestore seeding with Admin SDK...');
        console.log('Using project:', process.env.VITE_FIREBASE_PROJECT_ID);

        // Add courses
        for (const [id, course] of Object.entries(mockData.courses)) {
            await db.doc(`courses/${id}`).set(course);
            console.log(`Added course: ${course.name}`);
        }

        // // Add units
        // for (const [id, unit] of Object.entries(mockData.units)) {
        //     await db.doc(`units/${id}`).set(unit);
        //     console.log(`Added unit: ${unit.name}`);
        // }

        // // Add lessons
        // for (const [id, lesson] of Object.entries(mockData.lessons)) {
        //     await db.doc(`lessons/${id}`).set(lesson);
        //     console.log(`Added lesson: ${lesson.name}`);
        // }

        // // Add quizzes
        // if (mockData.quizzes) {
        //     for (const [id, quiz] of Object.entries(mockData.quizzes)) {
        //         await db.doc(`quizzes/${id}`).set(quiz);
        //         console.log(`Added quiz: ${id}`);
        //     }
        // }

        // // Add users (optional, you might want to handle this separately)
        // if (mockData.users) {
        //     for (const [id, user] of Object.entries(mockData.users)) {
        //         await db.doc(`users/${id}`).set(user);
        //         console.log(`Added user: ${user.name}`);
        //     }
        // }

        console.log('Firestore seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding Firestore:', error);
        process.exit(1);
    }
} 