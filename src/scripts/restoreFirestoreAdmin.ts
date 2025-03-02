import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Course, Unit, Lesson, Quiz, UserProfile } from '../types';

dotenv.config();

interface BackupData {
    courses: { [key: string]: Course };
    units: { [key: string]: Unit };
    lessons: { [key: string]: Lesson };
    quizzes?: { [key: string]: Quiz };
    users?: { [key: string]: UserProfile };
}

// Check and guide for service account file
const serviceAccountPath = join(process.cwd(), 'service-account-prod.json');
if (!existsSync(serviceAccountPath)) {
    console.error('Service account file not found!');
    console.log('\nTo use this script, you need to:');
    console.log('1. Go to your Firebase project settings');
    console.log('2. Navigate to "Service accounts" tab');
    console.log('3. Click "Generate New Private Key"');
    console.log('4. Save the downloaded file as "service-account.json"');
    console.log(`5. Place it in the project root directory: ${process.cwd()}\n`);
    console.warn(`WARNING! NEVER SHARE THIS FILE NOR COMMIT IT TO GITHUB!\n`);
    process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync(serviceAccountPath, 'utf-8')
);

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

// List available backup files
function listBackupFiles(): string[] {
    const backupDir = join(process.cwd(), 'src/data/backups');
    if (!existsSync(backupDir)) {
        console.error('No backups directory found!');
        process.exit(1);
    }

    const files = readdirSync(backupDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Sort in reverse chronological order

    if (files.length === 0) {
        console.error('No backup files found!');
        process.exit(1);
    }

    return files;
}

// Restore from backup file
export async function restoreFromBackup(backupFilePath: string) {
    try {
        console.log('Starting Firestore restoration from backup...');
        console.log('Using project:', process.env.VITE_FIREBASE_PROJECT_ID);
        console.log('Using backup file:', backupFilePath);

        const backupData = JSON.parse(
            readFileSync(backupFilePath, 'utf-8')
        ) as BackupData;

        // Add courses
        for (const [id, course] of Object.entries(backupData.courses)) {
            await db.doc(`courses/${id}`).set(course);
            console.log(`Restored course: ${course.name}`);
        }

        // Add units
        for (const [id, unit] of Object.entries(backupData.units)) {
            await db.doc(`units/${id}`).set(unit);
            console.log(`Restored unit: ${unit.name}`);
        }

        // Add lessons
        for (const [id, lesson] of Object.entries(backupData.lessons)) {
            await db.doc(`lessons/${id}`).set(lesson);
            console.log(`Restored lesson: ${lesson.name}`);
        }

        // Add quizzes
        if (backupData.quizzes) {
            for (const [id, quiz] of Object.entries(backupData.quizzes)) {
                await db.doc(`quizzes/${id}`).set(quiz);
                console.log(`Restored quiz: ${id}`);
            }
        }

        // Add users (optional)
        if (backupData.users) {
            for (const [id, user] of Object.entries(backupData.users)) {
                await db.doc(`users/${id}`).set(user);
                console.log(`Restored user: ${user.name}`);
            }
        }

        console.log('Firestore restoration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error restoring Firestore:', error);
        process.exit(1);
    }
}

// Allow running from command line
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    const files = listBackupFiles();
    
    console.log('Available backup files:');
    files.forEach((file, index) => {
        console.log(`${index + 1}: ${file}`);
    });

    console.log('\nPlease enter the number of the backup file to restore:');
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (data) => {
        const input = parseInt((data as any).trim(), 10);
        if (isNaN(input) || input < 1 || input > files.length) {
            console.error('Invalid selection');
            process.exit(1);
        }

        const selectedFile = files[input - 1];
        const backupFilePath = join(process.cwd(), 'src/data/backups', selectedFile);
        restoreFromBackup(backupFilePath);
    });
}