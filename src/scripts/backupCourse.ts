import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Course, Unit, Lesson, Quiz } from '../types';

dotenv.config();

interface BackupData {
    courses: { [key: string]: Course };
    units: { [key: string]: Unit };
    lessons: { [key: string]: Lesson };
    quizzes?: { [key: string]: Quiz };
}

// Read service account JSON
const serviceAccount = JSON.parse(
    readFileSync(join(process.cwd(), 'service-account.json'), 'utf-8')
);

// Initialize Firebase Admin
const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

export async function backupCourse(courseId: string) {
    try {
        console.log('Starting course backup...');
        console.log('Using project:', process.env.VITE_FIREBASE_PROJECT_ID);
        console.log('Backing up course:', courseId);

        const backupData: BackupData = {
            courses: {},
            units: {},
            lessons: {},
            quizzes: {}
        };

        // Get course data
        const courseDoc = await db.doc(`courses/${courseId}`).get();
        if (!courseDoc.exists) {
            throw new Error(`Course ${courseId} not found`);
        }
        backupData.courses[courseId] = courseDoc.data() as Course;
        console.log(`Retrieved course: ${backupData.courses[courseId].name}`);

        // Get all units for the course
        const unitsSnapshot = await db.collection('units')
            .where('courseId', '==', courseId)
            .get();

        // Get all lessons for each unit
        for (const unitDoc of unitsSnapshot.docs) {
            const unitId = unitDoc.id;
            backupData.units[unitId] = unitDoc.data() as Unit;
            console.log(`Retrieved unit: ${backupData.units[unitId].name}`);

            const lessonsSnapshot = await db.collection('lessons')
                .where('unitId', '==', unitId)
                .get();

            for (const lessonDoc of lessonsSnapshot.docs) {
                const lessonId = lessonDoc.id;
                const lessonData = lessonDoc.data() as Lesson;
                backupData.lessons[lessonId] = lessonData;
                console.log(`Retrieved lesson: ${lessonData.name}`);

                // If lesson has a quiz, get quiz data
                if (lessonData.quizId) {
                    const quizDoc = await db.doc(`quizzes/${lessonData.quizId}`).get();
                    if (quizDoc.exists) {
                        backupData.quizzes![lessonData.quizId] = quizDoc.data() as Quiz;
                        console.log(`Retrieved quiz for lesson: ${lessonData.name}`);
                    }
                }
            }
        }

        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `course-${courseId}-backup-${timestamp}.json`;
        const backupDir = join(process.cwd(), 'src/data/backups');
        const filePath = join(backupDir, filename);

        // Create backups directory if it doesn't exist
        if (!existsSync(backupDir)) {
            mkdirSync(backupDir, { recursive: true });
        }

        writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        console.log(`Backup saved to: ${filePath}`);
        console.log('Backup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error backing up course:', error);
        process.exit(1);
    }
}

// Allow running from command line
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    const courseId = process.argv[2];
    if (!courseId) {
        // Prompt for course ID if not provided
        console.log('Please enter a course ID:');
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (data) => {
            const inputCourseId = (data as any).trim();
            if (inputCourseId) {
                backupCourse(inputCourseId);
            } else {
                console.error('Course ID cannot be empty');
                process.exit(1);
            }
        });
    } else {
        backupCourse(courseId);
    }
}