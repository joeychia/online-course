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
    // Cache for loaded units
    private unitCache: Map<string, { data: Unit; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    async getUnitWithLessons(unitId: string): Promise<Unit | null> {
        // Check cache first
        const cached = this.unitCache.get(unitId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        // If not in cache or expired, fetch from Firestore
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
            lessons: (data.lessons as Array<{ id: string; name: string; order: number; quizId?: string | null }>).map(lesson => ({
                id: lesson.id,
                name: lesson.name,
                order: lesson.order,
                hasQuiz: !!lesson.quizId
            }))
        };

        // Cache the result
        this.unitCache.set(unitId, {
            data: unit,
            timestamp: Date.now()
        });

        return unit;
    }

    async getUnitLessonsCount(unitId: string): Promise<number> {
        // Check cache first
        const cached = this.unitCache.get(unitId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data.lessons.length;
        }

        const docRef = doc(db, 'units', unitId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return 0;
        const data = docSnap.data();
        return (data.lessons as Array<any> || []).length;
    }

    async createUnit(unitId: string, unitData: Unit): Promise<void> {
        const unitRef = doc(db, 'units', unitId);
        await withTimeout(setDoc(unitRef, unitData));
        this.clearUnitCache(unitId);
    }

    async updateUnit(unitId: string, unitData: Partial<Unit>): Promise<void> {
        const unitRef = doc(db, 'units', unitId);
        await withTimeout(updateDoc(unitRef, unitData));
        this.clearUnitCache(unitId);
    }

    // Cache management
    clearUnitCache(unitId: string) {
        this.unitCache.delete(unitId);
    }

    clearAllUnitCache() {
        this.unitCache.clear();
    }

}

export const unitDataAccess = new UnitDataAccess();
