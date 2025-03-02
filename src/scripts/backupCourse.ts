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
const serviceAccountPath = join(process.cwd(), 'service-account.json');
if (!existsSync(serviceAccountPath)) {
    console.error('Service account file not found!');
    console.log('\nTo use this script, you need to:');
    console.log('1. Go to your Firebase project settings');
    console.log('2. Navigate to "Service accounts" tab');
    console.log('3. Click "Generate New Private Key"');
    console.log('4. Save the downloaded file as "service-account.json"');
    console.log(`5. Place it in the project root directory: ${process.cwd()}\n`);
    console.warn(`WANNING! NEVER SHARE THIS FILE NOR COMMIT IT TO GITHUB! \n`);
    process.exit(1);
}
console.log('Using service account file:', serviceAccountPath);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

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
    } catch (error) {
        console.error('Error backing up course:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

async function getAllCourses(): Promise<{ id: string; name: string }[]> {
    const coursesSnapshot = await db.collection('courses').get();
    return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: (doc.data() as Course).name
    }));
}

async function backupAllCourses() {
    console.log('Starting backup of all courses...');
    const courses = await getAllCourses();
    const consolidatedData: BackupData = {
        courses: {},
        units: {},
        lessons: {},
        quizzes: {}
    };

    for (const course of courses) {
        // Backup individual course
        await backupCourse(course.id);

        // Add to consolidated data
        const courseDoc = await db.doc(`courses/${course.id}`).get();
        consolidatedData.courses[course.id] = courseDoc.data() as Course;

        const unitsSnapshot = await db.collection('units')
            .where('courseId', '==', course.id)
            .get();

        for (const unitDoc of unitsSnapshot.docs) {
            const unitId = unitDoc.id;
            consolidatedData.units[unitId] = unitDoc.data() as Unit;

            const lessonsSnapshot = await db.collection('lessons')
                .where('unitId', '==', unitId)
                .get();

            for (const lessonDoc of lessonsSnapshot.docs) {
                const lessonId = lessonDoc.id;
                const lessonData = lessonDoc.data() as Lesson;
                consolidatedData.lessons[lessonId] = lessonData;

                if (lessonData.quizId) {
                    const quizDoc = await db.doc(`quizzes/${lessonData.quizId}`).get();
                    if (quizDoc.exists) {
                        consolidatedData.quizzes![lessonData.quizId] = quizDoc.data() as Quiz;
                    }
                }
            }
        }
    }

    // Save consolidated backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `all-courses-backup-${timestamp}.json`;
    const backupDir = join(process.cwd(), 'src/data/backups');
    const filePath = join(backupDir, filename);

    if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
    }

    writeFileSync(filePath, JSON.stringify(consolidatedData, null, 2));
    console.log(`Consolidated backup saved to: ${filePath}`);
    console.log('All courses backup completed successfully!');
    process.exit(0);
}

// Allow running from command line
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    const courseId = process.argv[2];
    if (!courseId) {
        // List all available courses and prompt for selection
        console.log('Available courses:');
        getAllCourses().then(courses => {
            courses.forEach(course => {
                console.log(`${course.id}: ${course.name}`);
            });
            console.log('\nPlease enter a course ID (or "all" to backup all courses):');
            process.stdin.setEncoding('utf-8');
            process.stdin.on('data', (data) => {
                const inputCourseId = (data as any).trim();
                if (inputCourseId === 'all') {
                    backupAllCourses().then(() => process.exit(0));
                } else if (inputCourseId) {
                    backupCourse(inputCourseId).then(() => process.exit(0));
                } else {
                    console.error('Course ID cannot be empty');
                    process.exit(1);
                }
            });
        }).catch(error => {
            console.error('Error getting courses:', error);
            process.exit(1);
        });
    } else if (courseId === 'all') {
        backupAllCourses().then(() => process.exit(0));
    } else {
        backupCourse(courseId).then(() => process.exit(0));
    }
}