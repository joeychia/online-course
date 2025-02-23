import { 
    collection, 
    doc, 
    getDoc, 
    getDocs,
    updateDoc,
    deleteDoc,
    DocumentData,
    QueryDocumentSnapshot,
    addDoc
} from 'firebase/firestore';
import type { Course, CourseUnit } from '../../types';
import { withTimeout } from '../utils';
import { unitDataAccess } from './UnitDataAccess';
import { db } from '../firestoreConfig';

export class CourseDataAccess {
    async getAllCourses(): Promise<Course[]> {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        const courses = await Promise.all(
            snapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                return this.mapToCourse(doc.id, data);
            })
        );
        return courses;
    }

    async getCourseById(id: string): Promise<Course | null> {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return this.mapToCourse(docSnap.id, docSnap.data());
    }

    async createCourse(courseData: Omit<Course, 'id'>): Promise<string> {
        const courseCollection = collection(db, 'courses');
        const docRef = await withTimeout(addDoc(courseCollection, courseData));
        return docRef.id;
    }

    async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
        const courseRef = doc(db, 'courses', courseId);
        await withTimeout(updateDoc(courseRef, courseData));
    }

    async deleteCourse(courseId: string): Promise<void> {
        const courseRef = doc(db, 'courses', courseId);
        await withTimeout(deleteDoc(courseRef));
    }

    private async mapToCourse(id: string, data: DocumentData): Promise<Course> {
        const units = await Promise.all(
            (data.units as Array<CourseUnit>).map(async unit => {
                // For historical data without lessonCount, get it from the unit document
                const lessonCount = unit.lessonCount ?? await unitDataAccess.getUnitLessonsCount(unit.id);
                
                // If the count was fetched (not from existing data), update the course
                if (!unit.lessonCount) {
                    await this.updateCourse(id, {
                        units: (data.units as Array<CourseUnit>).map(u => 
                            u.id === unit.id 
                                ? { ...u, lessonCount }
                                : u
                        )
                    });
                }

                return {
                    id: unit.id,
                    name: unit.name,
                    order: unit.order,
                    lessonCount
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
}

export const courseDataAccess = new CourseDataAccess();
