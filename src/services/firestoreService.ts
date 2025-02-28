import { 
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
    QueryConstraint
} from 'firebase/firestore';
import type { 
    Course, 
    Unit, 
    Lesson, 
    Quiz, 
    Grade, 
    Note, 
    UserProfile, 
    QuizHistory,
    CourseUnit
} from '../types';
import { withTimeout } from './utils';
import { courseDataAccess } from './dataAccess/CourseDataAccess';
import { unitDataAccess } from './dataAccess/UnitDataAccess';
import { db } from './firestoreConfig';

export class FirestoreService {
    // Course operations delegated to CourseDataAccess
    async getAllCourses(): Promise<Course[]> {
        return courseDataAccess.getAllCourses();
    }

    async getCourseById(id: string): Promise<Course | null> {
        return courseDataAccess.getCourseById(id);
    }

    async createCourse(courseData: Omit<Course, 'id'>): Promise<string> {
        return courseDataAccess.createCourse(courseData);
    }

    async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
        await courseDataAccess.updateCourse(courseId, courseData);
    }

    async deleteCourse(courseId: string): Promise<void> {
        await courseDataAccess.deleteCourse(courseId);
    }

    // Unit operations delegated to UnitDataAccess
    async getUnitWithLessons(unitId: string): Promise<Unit | null> {
        return unitDataAccess.getUnitWithLessons(unitId);
    }

    async getUnitById(unitId: string): Promise<Unit | null> {
        return unitDataAccess.getUnitWithLessons(unitId);
    }

    async getUnitsIdNameForCourse(courseId: string): Promise<Array<CourseUnit>> {
        const course = await this.getCourseById(courseId);
        if (!course) return [];
        return course.units;
    }

    async getUnitLessonsCount(unitId: string): Promise<number> {
        return unitDataAccess.getUnitLessonsCount(unitId);
    }

    async createUnit(unitId: string, unitData: Unit): Promise<void> {
        return unitDataAccess.createUnit(unitId, unitData);
    }

    async updateUnit(unitId: string, unitData: Partial<Unit>): Promise<void> {
        return unitDataAccess.updateUnit(unitId, unitData);
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
            order: data.order as number,
            quizId: data.quizId as string | null,
            'video-title': data['video-title'] as string | undefined,
            'video-url': data['video-url'] as string | undefined
        };
    }

    async createLesson(lessonId: string, lessonData: Lesson): Promise<void> {
        const lessonRef = doc(db, 'lessons', lessonId);
        await withTimeout(setDoc(lessonRef, lessonData));
    }

    async updateLesson(lessonId: string, lessonData: Partial<Lesson>): Promise<void> {
        const lessonRef = doc(db, 'lessons', lessonId);
        await withTimeout(updateDoc(lessonRef, lessonData));
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

    async saveQuiz(quizData: Omit<Quiz, 'id'> & { id?: string }): Promise<string> {
        try {
            if (quizData.id) {
                const quizRef = doc(db, 'quizzes', quizData.id);
                const docSnap = await getDoc(quizRef);

                const { id, ...dataWithoutId } = quizData;
                
                if (docSnap.exists()) {
                    await withTimeout(updateDoc(quizRef, dataWithoutId));
                } else {
                    await withTimeout(setDoc(quizRef, dataWithoutId));
                }
                return id;
            } else {
                const quizCollection = collection(db, 'quizzes');
                const docRef = await withTimeout(addDoc(quizCollection, quizData));
                return docRef.id;
            }
        } catch (error) {
            console.error('Error saving quiz:', error);
            throw error;
        }
    }

    // Quiz History operations
    async getQuizHistoryForUserCourse(userId: string, courseId: string, startDate?: Date, endDate?: Date): Promise<QuizHistory[]> {
        const quizHistoryRef = collection(db, `users/${userId}/quizHistory`);
        let constraints: QueryConstraint[] = [
            where('courseId', '==', courseId),
            orderBy('completedAt', 'desc'),
            limit(5)
        ];

        if (startDate) {
            constraints.push(where('completedAt', '>=', startDate.toISOString()));
        }
        if (endDate) {
            constraints.push(where('completedAt', '<=', endDate.toISOString()));
        }

        const q = query(quizHistoryRef, ...constraints);
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
            await withTimeout(setDoc(quizHistoryRef, quizHistory));
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
    async getUserById(id: string): Promise<UserProfile | null> {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as UserProfile : null;
    }

    async createUser(user: UserProfile): Promise<void> {
        const userRef = doc(db, 'users', user.id);
        await withTimeout(setDoc(userRef, user));
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

        await withTimeout(updateDoc(userRef, { progress }));
    }

    async registerCourse(userId: string, courseId: string): Promise<void> {
        const userRef = doc(db, 'users', userId);
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        const registeredCourses = user.registeredCourses || {};
        registeredCourses[courseId] = true;

        await withTimeout(updateDoc(userRef, { registeredCourses }));
    }

    async dropCourse(userId: string, courseId: string): Promise<void> {
        const userRef = doc(db, 'users', userId);
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        const registeredCourses = user.registeredCourses || {};
        delete registeredCourses[courseId];

        await withTimeout(updateDoc(userRef, { registeredCourses }));
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
            await withTimeout(setDoc(noteRef, note));
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

    async getNotesForUserCourse(userId: string, courseId: string, startDate?: Date, endDate?: Date): Promise<Note[]> {
        try {
            const notesRef = collection(db, `users/${userId}/notes`);
            let constraints: QueryConstraint[] = [
                where('courseId', '==', courseId),
                orderBy('updatedAt', 'desc')
            ];

            if (startDate) {
                constraints.push(where('updatedAt', '>=', startDate.toISOString()));
            }
            if (endDate) {
                constraints.push(where('updatedAt', '<=', endDate.toISOString()));
            }

            const q = query(notesRef, ...constraints);
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

    async getRegisteredUsersForCourse(courseId: string): Promise<string[]> {
        try {
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where(`registeredCourses.${courseId}`, '==', true)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.id);
        } catch (error) {
            console.error(`[getRegisteredUsersForCourse] Error getting registered users for course ${courseId}:`, error);
            return [];
        }
    }
}

export const firestoreService = new FirestoreService();
