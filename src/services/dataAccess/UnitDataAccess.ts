import { 
    doc, 
    getDoc,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import type { Unit } from '../../types';
import { withTimeout } from '../utils';
import { db } from '../firestoreConfig';

export class UnitDataAccess {
    async getUnitWithLessons(unitId: string): Promise<Unit | null> {
        const docRef = doc(db, 'units', unitId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        const unit: Unit = {
            id: docSnap.id,
            courseId: data.courseId as string,
            name: data.name as string,
            description: data.description as string,
            order: data.order as number,
            lessons: (data.lessons as Array<{ id: string; name: string; order: number; quizId?: string | null }>).map((lesson, index) => ({
                id: lesson.id,
                name: lesson.name,
                order: typeof lesson.order === 'number' ? lesson.order : index,
                hasQuiz: !!lesson.quizId
            }))
        };

        return unit;
    }

    async getUnitLessonsCount(unitId: string): Promise<number> {
        const docRef = doc(db, 'units', unitId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return 0;
        const data = docSnap.data();
        return (data.lessons as Array<any> || []).length;
    }

    async createUnit(unitId: string, unitData: Unit): Promise<void> {
        const unitRef = doc(db, 'units', unitId);
        await withTimeout(setDoc(unitRef, unitData));
    }

    async updateUnit(unitId: string, unitData: Partial<Unit>): Promise<void> {
        const unitRef = doc(db, 'units', unitId);
        await withTimeout(updateDoc(unitRef, unitData));
    }
}

export const unitDataAccess = new UnitDataAccess();
