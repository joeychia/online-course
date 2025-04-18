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
    deleteDoc,
    DocumentData,
    QueryDocumentSnapshot,
    addDoc,
    limit,
    QueryConstraint,
    collectionGroup,
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
    CourseUnit,
    Announcement
} from '../types';
import { withTimeout } from './utils';
import { db } from './firestoreConfig';
import { performanceService } from './performanceService';

export class FirestoreService {
    async getAllCourses(): Promise<Course[]> {
        const traceId = performanceService.traceFirestoreRead('courses', 'list');
        try {
            const coursesRef = collection(db, 'courses');
            const snapshot = await getDocs(coursesRef);
            const courses = await Promise.all(
                snapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
                    const data = doc.data();
                    return this.mapToCourse(doc.id, data);
                })
            );
            performanceService.recordMetric(traceId, 'documents_count', courses.length);
            performanceService.stopTrace(traceId);
            return courses;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async getCourseById(id: string): Promise<Course | null> {
        const traceId = performanceService.traceFirestoreRead('courses', 'get');
        try {
            const docRef = doc(db, 'courses', id);
            const docSnap = await getDoc(docRef);
            const result = !docSnap.exists() ? null : await this.mapToCourse(docSnap.id, docSnap.data());
            performanceService.stopTrace(traceId);
            return result;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async createCourse(courseData: Omit<Course, 'id'>): Promise<string> {
        const traceId = performanceService.traceFirestoreWrite('courses', 'create');
        try {
            const courseCollection = collection(db, 'courses');
            const docRef = await withTimeout(addDoc(courseCollection, courseData));
            performanceService.stopTrace(traceId);
            return docRef.id;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('courses', 'update');
        try {
            const courseRef = doc(db, 'courses', courseId);
            await withTimeout(updateDoc(courseRef, courseData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async deleteCourse(courseId: string): Promise<void> {
        const traceId = performanceService.traceFirestoreDelete('courses');
        try {
            const courseRef = doc(db, 'courses', courseId);
            await withTimeout(deleteDoc(courseRef));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    private async mapToCourse(id: string, data: DocumentData): Promise<Course> {
    const units = await Promise.all(
        (data.units as Array<CourseUnit>).map(async (unit) => {
            const lessonCount = unit.lessonCount ?? await this.getUnitLessonsCount(unit.id);
            
            // Only include the fields we want
            return {
                id: unit.id,
                name: unit.name,
                lessonCount,
                openDate: unit.openDate
            };
        })
    );

        return {
            id,
            name: data.name as string,
            description: data.description as string,
            units,
            settings: data.settings as { unlockLessonIndex: number; token: string },
            groupIds: data.groupIds as Record<string, boolean>,
            isPublic: data.isPublic as boolean | undefined
        };
    }

    // Unit operations
    async getUnitById(unitId: string): Promise<Unit | null> {
        const traceId = performanceService.traceFirestoreRead('units', 'get');
        try {
            const docRef = doc(db, 'units', unitId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                performanceService.stopTrace(traceId);
                return null;
            }

            const data = docSnap.data();
            const unit: Unit = {
                id: docSnap.id,
                courseId: data.courseId as string,
                name: data.name as string,
                description: data.description as string,
                lessons: (data.lessons as Array<{ id: string; name: string; order?: number; quizId?: string | null }>).map((lesson) => {
                    const { order, ...lessonWithoutOrder } = lesson;
                    return {
                        ...lessonWithoutOrder,
                        id: lesson.id,
                        name: lesson.name,
                        hasQuiz: !!lesson.quizId
                    };
                })
            };
            performanceService.stopTrace(traceId);
            return unit;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async getUnitLessonsCount(unitId: string): Promise<number> {
        const traceId = performanceService.traceFirestoreRead('units', 'get');
        try {
            const docRef = doc(db, 'units', unitId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                performanceService.stopTrace(traceId);
                return 0;
            }
            const data = docSnap.data();
            const count = (data.lessons as Array<any> || []).length;
            performanceService.recordMetric(traceId, 'lessons_count', count);
            performanceService.stopTrace(traceId);
            return count;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async createUnit(unitId: string, unitData: Unit): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('units', 'create');
        try {
            const unitRef = doc(db, 'units', unitId);
            await withTimeout(setDoc(unitRef, unitData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async updateUnit(unitId: string, unitData: Partial<Unit>): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('units', 'update');
        try {
            const unitRef = doc(db, 'units', unitId);
            await withTimeout(updateDoc(unitRef, unitData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async getUnitsIdNameForCourse(courseId: string): Promise<Array<CourseUnit>> {
        const course = await this.getCourseById(courseId);
        if (!course) return [];
        return course.units;
    }

    async getLessonsIdNameForUnit(unitId: string): Promise<Array<{ id: string; name: string }>> {
        const unit = await this.getUnitById(unitId);
        if (!unit) return [];
        return unit.lessons;
    }


    // Lesson operations
    async getLessonById(lessonId: string): Promise<Lesson | null> {
        const traceId = performanceService.traceFirestoreRead('lessons', 'get');
        try {
            const docRef = doc(db, 'lessons', lessonId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                performanceService.stopTrace(traceId);
                return null;
            }
            const data = docSnap.data();
            performanceService.stopTrace(traceId);
            return {
                id: docSnap.id,
                ...data
            } as Lesson;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async createLesson(lessonId: string, lessonData: Lesson): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('lessons', 'create');
        try {
            const lessonRef = doc(db, 'lessons', lessonId);
            await withTimeout(setDoc(lessonRef, lessonData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async updateLesson(lessonId: string, lessonData: Partial<Lesson>): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('lessons', 'update');
        try {
            const lessonRef = doc(db, 'lessons', lessonId);
            await withTimeout(updateDoc(lessonRef, lessonData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async deleteLesson(lessonId: string): Promise<void> {
        const traceId = performanceService.traceFirestoreDelete('lessons');
        try {
            const lessonRef = doc(db, 'lessons', lessonId);
            await withTimeout(deleteDoc(lessonRef));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    // Quiz operations
    async getQuizById(quizId: string): Promise<Quiz | null> {
        const traceId = performanceService.traceFirestoreRead('quizzes', 'get');
        try {
            const docRef = doc(db, 'quizzes', quizId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                performanceService.stopTrace(traceId);
                return null;
            }
            const data = docSnap.data();
            performanceService.stopTrace(traceId);
            return {
                id: docSnap.id,
                ...data
            } as Quiz;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async createQuiz(quizId: string, quizData: Quiz): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('quizzes', 'create');
        try {
            const quizRef = doc(db, 'quizzes', quizId);
            await withTimeout(setDoc(quizRef, quizData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async updateQuiz(quizId: string, quizData: Partial<Quiz>): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('quizzes', 'update');
        try {
            const quizRef = doc(db, 'quizzes', quizId);
            await withTimeout(updateDoc(quizRef, quizData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async deleteQuiz(quizId: string): Promise<void> {
        const traceId = performanceService.traceFirestoreDelete('quizzes');
        try {
            const quizRef = doc(db, 'quizzes', quizId);
            await withTimeout(deleteDoc(quizRef));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
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
    async getQuizHistoriesByUnitIds(unitIds: string[]): Promise<QuizHistory[]> {
        if (!unitIds.length) return [];

        // Use a collection group query to directly query all quizHistory subcollections
        const quizHistoryCollectionGroup = collectionGroup(db, 'quizHistory');
        const q = query(
            quizHistoryCollectionGroup, 
            where('unitId', 'in', unitIds)
        );
        
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map((doc): QuizHistory => {
            const data = doc.data();
            return {
                userId: data.userId as string,
                lessonId: data.lessonId as string,
                unitId: data.unitId as string,
                score: data.score as number,
                quizId: data.quizId as string,
                courseId: data.courseId as string,
                answers: data.answers as Record<string, string>,
                completedAt: data.completedAt as string,
                correct: data.correct as number,
                total: data.total as number,
                title: data.title as string | undefined,
            };
        });
    }

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
                unitId: data.unitId as string,
                score: data.score as number,
                quizId: data.quizId as string,
                courseId: data.courseId as string,
                answers: data.answers as Record<string, string>,
                completedAt: data.completedAt as string,
                correct: data.correct as number,
                total: data.total as number,
                title: data.title as string | undefined,
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
            unitId: data.unitId as string,
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
    async getUserById(userId: string): Promise<UserProfile | null> {
        const traceId = performanceService.traceFirestoreRead('users', 'get');
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                performanceService.stopTrace(traceId);
                return null;
            }
            const data = docSnap.data();
            performanceService.stopTrace(traceId);
            return {
                id: docSnap.id,
                ...data
            } as UserProfile;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('users', 'update');
        try {
            const userRef = doc(db, 'users', userId);
            await withTimeout(updateDoc(userRef, userData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async getNotesByUserId(userId: string): Promise<Note[]> {
        const traceId = performanceService.traceFirestoreQuery('notes', 1);
        try {
            const notesRef = collection(db, 'notes');
            const q = query(notesRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            const notes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Note[];
            performanceService.recordMetric(traceId, 'documents_count', notes.length);
            performanceService.stopTrace(traceId);
            return notes;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async createNote(noteData: Omit<Note, 'id'>): Promise<string> {
        const traceId = performanceService.traceFirestoreWrite('notes', 'create');
        try {
            const notesRef = collection(db, 'notes');
            const docRef = await withTimeout(addDoc(notesRef, noteData));
            performanceService.stopTrace(traceId);
            return docRef.id;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async updateNote(noteId: string, noteData: Partial<Note>): Promise<void> {
        const traceId = performanceService.traceFirestoreWrite('notes', 'update');
        try {
            const noteRef = doc(db, 'notes', noteId);
            await withTimeout(updateDoc(noteRef, noteData));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async deleteNote(noteId: string): Promise<void> {
        const traceId = performanceService.traceFirestoreDelete('notes');
        try {
            const noteRef = doc(db, 'notes', noteId);
            await withTimeout(deleteDoc(noteRef));
            performanceService.stopTrace(traceId);
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }

    async createUser(user: UserProfile): Promise<void> {
        const userRef = doc(db, 'users', user.id);
        await withTimeout(setDoc(userRef, user));
    }

    async getAllUsersEmails(): Promise<string[]> {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            return snapshot.docs
                .map(doc => doc.data().email)
                .filter(email => typeof email === 'string' && email.includes('@'));
        } catch (error) {
            console.error('Error fetching user emails:', error);
            throw new Error('Failed to retrieve user emails');
        }
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
    async createAnnouncement(announcement: Omit<Announcement, 'id'>) {
        const traceId = performanceService.traceFirestoreWrite('announcements', 'create');
        try {
            // Handle null/undefined courseId explicitly
            const cleanedAnnouncement = {
                ...announcement,
                courseId: announcement.courseId || null
            };
            const docRef = await withTimeout(addDoc(collection(db, 'announcements'), cleanedAnnouncement));
            performanceService.stopTrace(traceId);
            return docRef.id;
        } catch (error) {
            performanceService.stopTrace(traceId, { error: 'failed' });
            throw error;
        }
    }
    
    async getActiveAnnouncements() {
      const q = query(
        collection(db, 'announcements'),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   }
}

export const firestoreService = new FirestoreService();
