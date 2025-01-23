import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    setDoc,
    updateDoc,
    DocumentData,
    QueryDocumentSnapshot,
    addDoc,
    limit,
    deleteDoc
} from 'firebase/firestore';
import type { Course, Unit, Lesson, Quiz, Grade, Note, UserProfile as User, QuizHistory } from '../types';
import { app } from './firebaseConfig';

const db = getFirestore(app);

export class FirestoreService {
    // Course operations
    async getAllCourses(): Promise<Course[]> {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name as string,
                description: data.description as string,
                units: data.units as Array<{ id: string; name: string }>,
                settings: data.settings as { unlockLessonIndex: number },
                groupIds: data.groupIds as Record<string, boolean>,
                isPublic: data.isPublic as boolean | undefined
            };
        });
    }

    async getCourseById(id: string): Promise<Course | null> {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name as string,
            description: data.description as string,
            units: data.units as Array<{ id: string; name: string }>,
            settings: data.settings as { unlockLessonIndex: number },
            groupIds: data.groupIds as Record<string, boolean>,
            isPublic: data.isPublic as boolean | undefined
        };
    }

    async createCourse(courseData: Omit<Course, 'id'>): Promise<string> {
        const courseCollection = collection(db, 'courses');
        const docRef = await addDoc(courseCollection, courseData);
        return docRef.id;
    }

    async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, courseData);
    }

    async deleteCourse(courseId: string): Promise<void> {
        const courseRef = doc(db, 'courses', courseId);
        await deleteDoc(courseRef);
    }

    // Unit operations
    async getUnitsIdNameForCourse(courseId: string): Promise<Array<{ id: string; name: string }>> {
        const course = await this.getCourseById(courseId);
        if (!course) return [];
        return course.units;
    }

    async getUnitById(id: string): Promise<Unit | null> {
        const docRef = doc(db, 'units', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name as string,
            description: data.description as string,
            lessons: data.lessons as Array<{ id: string; name: string }>,
            courseId: data.courseId as string
        };
    }

    // Lesson operations
    async getLessonsIdNameForUnit(unitId: string): Promise<Array<{ id: string; name: string }>> {
        const unit = await this.getUnitById(unitId);
        if (!unit) return [];
        return unit.lessons;
    }

    async getLessonById(id: string): Promise<Lesson | null> {
        const docRef = doc(db, 'lessons', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name as string,
            content: data.content as string,
            unitId: data.unitId as string,
            quizId: data.quizId as string | null,
            'video-title': data['video-title'] as string | undefined,
            'video-url': data['video-url'] as string | undefined
        };
    }

    // Quiz operations
    async getQuizById(id: string): Promise<Quiz | null> {
        const docRef = doc(db, 'quizzes', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        return {
            id: docSnap.id,
            questions: data.questions as Quiz['questions']
        };
    }

    // Quiz History operations
    async getQuizHistoryForUserCourse(userId: string, courseId: string): Promise<QuizHistory[]> {
        const quizHistoryRef = collection(db, `users/${userId}/quizHistory`);
        const q = query(
            quizHistoryRef,
            where('courseId', '==', courseId),
            orderBy('completedAt', 'desc'),
            limit(5)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc): QuizHistory => {
            const data = doc.data();
            return {
                userId: data.userId as string,
                lessonId: data.lessonId as string,
                score: data.score as number,
                quizId: data.quizId as string,
                courseId: data.courseId as string,
                answers: data.answers as Record<string, string>,
                completedAt: data.completedAt as string,
                correct: data.correct as number,
                total: data.total as number
            };
        });
    }

    async getQuizHistoryForUserLesson(userId: string, lessonId: string): Promise<QuizHistory | null> {
        const quizHistoryRef = collection(db, `users/${userId}/quizHistory`);
        const docRef = doc(quizHistoryRef, lessonId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        
        const data = docSnap.data();
        return {
            id: docSnap.id,
            userId,
            quizId: data.quizId as string,
            lessonId: data.lessonId as string,
            courseId: data.courseId as string,
            answers: data.answers as Record<string, string>,
            completedAt: data.completedAt as string,
            correct: data.correct as number,
            score: data.score as number,
            total: data.total as number
        } as QuizHistory;
    }

    async createQuizHistory(userId: string, lessonId: string, quizHistory: Omit<QuizHistory, 'id'>): Promise<QuizHistory> {
        try {
            const quizHistoryRef = doc(db, `users/${userId}/quizHistory/${lessonId}`);
            await setDoc(quizHistoryRef, quizHistory);
            return {
                ...quizHistory,
                id: lessonId
            } as QuizHistory;
        } catch (error) {
            console.error('Error creating quiz history:', error);
            throw error;
        }
    }

    // User operations
    async getUserById(id: string): Promise<User | null> {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null;
    }

    async createUser(user: User): Promise<void> {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, user);
    }

    async updateUserProgress(userId: string, courseId: string, lessonId: string, completed: boolean, completedAt: string, lessonName: string): Promise<void> {
        const userRef = doc(db, 'users', userId);
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        const progress = user.progress || {};
        if (!progress[courseId]) {
            progress[courseId] = {};
        }
        progress[courseId][lessonId] = { completed, completedAt, lessonName };

        await updateDoc(userRef, { progress });
    }

    async registerCourse(userId: string, courseId: string): Promise<void> {
        const userRef = doc(db, 'users', userId);
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        const registeredCourses = user.registeredCourses || {};
        registeredCourses[courseId] = true;

        await updateDoc(userRef, { registeredCourses });
    }

    async dropCourse(userId: string, courseId: string): Promise<void> {
        const userRef = doc(db, 'users', userId);
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        const registeredCourses = user.registeredCourses || {};
        delete registeredCourses[courseId];

        await updateDoc(userRef, { registeredCourses });
    }

    // Note operations
    async getNoteForLesson(userId: string, lessonId: string): Promise<Note | null> {
        try {
            const noteRef = doc(db, `users/${userId}/notes/${lessonId}`);
            const noteSnap = await getDoc(noteRef);
            if (!noteSnap.exists()) {
                console.log(`[getNoteForLesson] Note not found for user ${userId} and lesson ${lessonId}`);
                return null;
            }
            const data = noteSnap.data();
            return {
                id: noteSnap.id,
                unitName: data.unitName,
                lessonName: data.lessonName,
                courseId: data.courseId,
                text: data.text,
                updatedAt: data.updatedAt,
            };
        } catch (error) {
            console.error(`[getNoteForLesson] Error getting note for user ${userId} and lesson ${lessonId}:`, error);
            return null;
        }
    }

    async saveNote(userId: string, lessonId: string, courseId: string, text: string, lessonName: string, unitName: string): Promise<Note> {
        try {
            const noteRef = doc(db, `users/${userId}/notes/${lessonId}`);
            const note = {
                courseId,
                unitName,
                lessonName,
                text,
                updatedAt: new Date().toISOString()
            };
            console.log("courseId:", courseId)
            await setDoc(noteRef, note);
            return {
                id: lessonId,
                ...note
            };
        } catch (error) {
            console.error(`[saveNote] Error saving note for user ${userId} and lesson ${lessonId}:`, error);
            throw error;
        }
    }

    // Grade operations
    async getGradesForCourse(courseId: string): Promise<Grade[]> {
        const gradesRef = collection(db, 'grades');
        const q = query(gradesRef, where('courseId', '==', courseId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
                id: doc.id,
                courseId: data.courseId as string,
                userId: data.userId as string,
                grade: data.grade as number
            } as Grade;
        });
    }

    async getUserGrade(userId: string, courseId: string): Promise<Grade | null> {
        const gradesRef = collection(db, 'grades');
        const q = query(
            gradesRef,
            where('courseId', '==', courseId),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const doc = snapshot.docs[0];
        if (!doc) return null;
        
        const data = doc.data();
        return {
            id: doc.id,
            courseId: data.courseId as string,
            userId: data.userId as string,
            grade: data.grade as number
        } as Grade;
    }

    async getNotesForUserCourse(userId: string, courseId: string): Promise<Note[]> {
        try {
            const notesRef = collection(db, `users/${userId}/notes`);
            const q = query(
                notesRef,
                where('courseId', '==', courseId),
                orderBy('updatedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    unitName: data.unitName,
                    lessonName: data.lessonName,
                    courseId: data.courseId,
                    text: data.text,
                    updatedAt: data.updatedAt,
                };
            });
        } catch (error) {
            console.error(`[getNotesForUserCourse] Error getting notes for user ${userId} and course ${courseId}:`, error);
            return [];
        }
    }
}

export const firestoreService = new FirestoreService();