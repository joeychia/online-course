import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Course, Unit, Lesson, Quiz } from '../types';
import { fileURLToPath } from 'url';

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
    console.warn(`WARNING! NEVER SHARE THIS FILE NOR COMMIT IT TO GITHUB!\n`);
    process.exit(1);
}
console.log('Using service account file:', serviceAccountPath);

interface ServiceAccount {
    project_id: string;
    private_key: string;
    client_email: string;
}

let serviceAccount: ServiceAccount;
try {
    const serviceAccountContent = readFileSync(serviceAccountPath, 'utf-8');
    console.log('Service account file read successfully');
    const parsedAccount = JSON.parse(serviceAccountContent);
    
    // Validate required service account fields
    if (!parsedAccount.project_id || !parsedAccount.private_key || !parsedAccount.client_email) {
        throw new Error('Invalid service account file: missing required fields');
    }
    serviceAccount = parsedAccount;
    console.log('Service account file parsed and validated successfully');
} catch (error) {
    console.error('Error processing service account file:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error) {
        console.error('Error stack trace:', error.stack);
    }
    throw error;
}

// Initialize Firebase Admin
console.log('Initializing Firebase Admin...');
const app = initializeApp({
    credential: cert({
        projectId: serviceAccount.project_id,
        privateKey: serviceAccount.private_key,
        clientEmail: serviceAccount.client_email
    })
});
console.log('Firebase Admin initialized successfully');

console.log('Getting Firestore instance...');
const db = getFirestore(app);
console.log('Firestore instance obtained successfully');

export async function backupCourse(courseId: string): Promise<void> {
    try {
        console.log('Starting course backup...');
        console.log('Using project:', serviceAccount.project_id);
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

        // Get units directly using unit IDs from course data
        for (const unitInfo of backupData.courses[courseId].units) {
            const unitId = unitInfo.id;
            const unitDoc = await db.doc(`units/${unitId}`).get();
            if (!unitDoc.exists) {
                console.warn(`Unit ${unitId} not found, skipping...`);
                continue;
            }
            backupData.units[unitId] = unitDoc.data() as Unit;
            console.log(`Retrieved unit: ${backupData.units[unitId].name}`);

            // Get lessons directly using lesson IDs from unit data
            for (const lessonInfo of backupData.units[unitId].lessons) {
                const lessonId = lessonInfo.id;
                const lessonDoc = await db.doc(`lessons/${lessonId}`).get();
                if (!lessonDoc.exists) {
                    console.warn(`Lesson ${lessonId} not found, skipping...`);
                    continue;
                }
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
        const backupDir = join(process.cwd(), 'src', 'data', 'backups');
        const filePath = join(backupDir, filename);

        // Create backups directory if it doesn't exist
        if (!existsSync(backupDir)) {
            mkdirSync(backupDir, { recursive: true });
        }

        writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        console.log(`Backup saved to: ${filePath}`);
        console.log('Backup completed successfully!');
    } catch (error) {
        console.error('Error backing up course:', error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof Error) {
            console.error('Error stack trace:', error.stack);
        }
        throw error;
    }
}

async function getAllCourses(): Promise<{ id: string; name: string }[]> {
    try {
        const coursesSnapshot = await db.collection('courses').get();
        return coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: (doc.data() as Course).name
        }));
    } catch (error) {
        console.error('Error getting all courses:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

async function backupAllCourses(): Promise<void> {
    try {
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

            // Get units directly from course data
            for (const unitInfo of consolidatedData.courses[course.id].units) {
                const unitId = unitInfo.id;
                const unitDoc = await db.doc(`units/${unitId}`).get();
                if (!unitDoc.exists) {
                    console.warn(`Unit ${unitId} not found, skipping...`);
                    continue;
                }
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
        const backupDir = join(process.cwd(), 'src', 'data', 'backups');
        const filePath = join(backupDir, filename);

        if (!existsSync(backupDir)) {
            mkdirSync(backupDir, { recursive: true });
        }

        writeFileSync(filePath, JSON.stringify(consolidatedData, null, 2));
        console.log(`Consolidated backup saved to: ${filePath}`);
        console.log('All courses backup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error backing up all courses:', error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof Error) {
            console.error('Error stack trace:', error.stack);
        }
        throw error;
    }
}

// Allow running from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
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