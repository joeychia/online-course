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
    // Separate method for data migrations
    async migrateCourseLessonData(courseId: string): Promise<void> {
        const course = await this.getCourseById(courseId);
        if (!course) return;

        const needsMigration = course.units.some(unit => 
            unit.lessonCount === undefined || unit.order === undefined
        );

        if (needsMigration) {
            const updatedUnits = await Promise.all(
                course.units.map(async (unit, index) => {
                    const lessonCount = unit.lessonCount ?? await unitDataAccess.getUnitLessonsCount(unit.id);
                    return {
                        ...unit,
                        lessonCount,
                        order: unit.order ?? index
                    };
                })
            );

            await this.updateCourse(courseId, { units: updatedUnits });
        }
    }

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
            (data.units as Array<CourseUnit>).map(async (unit, index) => {
                // Use defaults without triggering updates
                const lessonCount = unit.lessonCount ?? await unitDataAccess.getUnitLessonsCount(unit.id);
                const order = unit.order ?? index;

                return {
                    id: unit.id,
                    name: unit.name,
                    order,
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
