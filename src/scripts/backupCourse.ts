import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Course, Unit, Lesson, Quiz, Grade, Note, UserProfile, QuizHistory, Announcement } from '../types';
import { fileURLToPath } from 'url';

dotenv.config();

interface UserBackup {
    profile: UserProfile;
    quizHistory: { [key: string]: QuizHistory };
}

interface BackupData {
    courses: { [key: string]: Course };
    units: { [key: string]: Unit };
    lessons: { [key: string]: Lesson };
    quizzes: { [key: string]: Quiz };
    users: { [key: string]: UserBackup };
    notes: { [key: string]: Note };
    grades: { [key: string]: Grade };
    announcements: { [key: string]: Announcement };
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
            quizzes: {},
            users: {},
            notes: {},
            grades: {},
            announcements: {}
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

async function backupAllCollections(): Promise<void> {
    try {
        console.log('Starting full database backup...');
        
        const backupData: BackupData = {
            courses: {},
            units: {},
            lessons: {},
            quizzes: {},
            users: {},
            notes: {},
            grades: {},
            announcements: {}
        };

        // 1. Courses
        console.log('Backing up courses...');
        const coursesSnapshot = await db.collection('courses').get();
        coursesSnapshot.forEach(doc => {
            backupData.courses[doc.id] = doc.data() as Course;
        });
        console.log(`Backed up ${Object.keys(backupData.courses).length} courses`);

        // 2. Units
        console.log('Backing up units...');
        const unitsSnapshot = await db.collection('units').get();
        unitsSnapshot.forEach(doc => {
            backupData.units[doc.id] = doc.data() as Unit;
        });
        console.log(`Backed up ${Object.keys(backupData.units).length} units`);

        // 3. Lessons
        console.log('Backing up lessons...');
        const lessonsSnapshot = await db.collection('lessons').get();
        lessonsSnapshot.forEach(doc => {
            backupData.lessons[doc.id] = doc.data() as Lesson;
        });
        console.log(`Backed up ${Object.keys(backupData.lessons).length} lessons`);

        // 4. Quizzes
        console.log('Backing up quizzes...');
        const quizzesSnapshot = await db.collection('quizzes').get();
        quizzesSnapshot.forEach(doc => {
            backupData.quizzes[doc.id] = doc.data() as Quiz;
        });
        console.log(`Backed up ${Object.keys(backupData.quizzes).length} quizzes`);

        // 5. Users and Quiz History
        console.log('Backing up users and quiz history...');
        const usersSnapshot = await db.collection('users').get();
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data() as UserProfile;
            
            const quizHistorySnapshot = await userDoc.ref.collection('quizHistory').get();
            const quizHistory: { [key: string]: QuizHistory } = {};
            
            quizHistorySnapshot.forEach(qhDoc => {
                quizHistory[qhDoc.id] = qhDoc.data() as QuizHistory;
            });

            backupData.users[userId] = {
                profile: userData,
                quizHistory
            };
        }
        console.log(`Backed up ${Object.keys(backupData.users).length} users`);

        // 6. Notes
        console.log('Backing up notes...');
        const notesSnapshot = await db.collection('notes').get();
        notesSnapshot.forEach(doc => {
            backupData.notes[doc.id] = doc.data() as Note;
        });
        console.log(`Backed up ${Object.keys(backupData.notes).length} notes`);

        // 7. Grades
        console.log('Backing up grades...');
        const gradesSnapshot = await db.collection('grades').get();
        gradesSnapshot.forEach(doc => {
            backupData.grades[doc.id] = doc.data() as Grade;
        });
        console.log(`Backed up ${Object.keys(backupData.grades).length} grades`);

        // 8. Announcements
        console.log('Backing up announcements...');
        const announcementsSnapshot = await db.collection('announcements').get();
        announcementsSnapshot.forEach(doc => {
            backupData.announcements[doc.id] = doc.data() as Announcement;
        });
        console.log(`Backed up ${Object.keys(backupData.announcements).length} announcements`);

        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `full-backup-${timestamp}.json`;
        const backupDir = join(process.cwd(), 'src', 'data', 'backups');
        const filePath = join(backupDir, filename);

        if (!existsSync(backupDir)) {
            mkdirSync(backupDir, { recursive: true });
        }

        writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        console.log(`Full backup saved to: ${filePath}`);
        console.log('Full backup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error performing full backup:', error instanceof Error ? error.message : 'Unknown error');
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
            console.log('\nPlease enter a course ID (or "all" to backup all tables):');
            process.stdin.setEncoding('utf-8');
            process.stdin.on('data', (data) => {
                const input = (data as any).trim();
                if (input === 'all') {
                    backupAllCollections();
                } else if (input) {
                    backupCourse(input).then(() => process.exit(0));
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
        backupAllCollections();
    } else {
        backupCourse(courseId).then(() => process.exit(0));
    }
}