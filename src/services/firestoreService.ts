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
    deleteDoc,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import type { Course, Unit, Lesson, Quiz, Group, Grade, Note, UserProfile as User } from '../types';
import { app } from './firebaseConfig';

const db = getFirestore(app);

class FirestoreService {
    // Course operations
    async getAllCourses(): Promise<Course[]> {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Course));
    }

    async getCourseById(id: string): Promise<Course | null> {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Course : null;
    }

    // Unit operations
    async getUnitsForCourse(courseId: string): Promise<Unit[]> {
        const unitsRef = collection(db, 'units');
        const q = query(unitsRef, where('courseId', '==', courseId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Unit));
    }

    async getUnitById(id: string): Promise<Unit | null> {
        const docRef = doc(db, 'units', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Unit : null;
    }

    // Lesson operations
    async getLessonsForUnit(unitId: string): Promise<Lesson[]> {
        const lessonsRef = collection(db, 'lessons');
        const q = query(
            lessonsRef, 
            where('unitId', '==', unitId),
            orderBy('orderIndex')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Lesson));
    }

    async getLessonById(id: string): Promise<Lesson | null> {
        const docRef = doc(db, 'lessons', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Lesson : null;
    }

    // Quiz operations
    async getQuizById(id: string): Promise<Quiz | null> {
        const docRef = doc(db, 'quizzes', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Quiz : null;
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

    async updateUserProgress(userId: string, courseId: string, lessonId: string, completed: boolean): Promise<void> {
        const userRef = doc(db, 'users', userId);
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        const progress = user.progress || {};
        if (!progress[courseId]) {
            progress[courseId] = {};
        }
        progress[courseId][lessonId] = { completed };

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
        const noteId = `${lessonId}_${userId}`;
        const userRef = doc(db, 'users', userId);

        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;

        const note = userSnap.data()?.notes?.[noteId] || null;
        
        return note ? { ...note, id: noteId } : null;
    }

    async saveNote(userId: string, lessonId: string, text: string): Promise<Note> {
        const userRef = doc(db, 'users', userId);
        const noteId = `${lessonId}_${userId}`;
        const note: Note = { id: noteId, lessonId, text };
        // Update or set the note directly
        await updateDoc(userRef, {
            [`notes.${noteId}`]:note
        });

        return note;
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
                courseId: data.courseId,
                userId: data.userId,
                grade: data.grade
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
            courseId: data.courseId,
            userId: data.userId,
            grade: data.grade
        } as Grade;
    }
}

export const firestoreService = new FirestoreService(); 