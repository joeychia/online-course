import { useState, useCallback } from 'react';
import { Course, CourseUnit } from '../../../../types';
import { firestoreService } from '../../../../services/firestoreService';

interface UseUnitOperationsProps {
  courseId: string;
  course: Course | null;
  reloadCourse: () => Promise<void>;
}

interface UnitDataInput {
  id: string;
  name: string;
  lessonCount: number;
  openDate?: string;
}

export const useUnitOperations = ({ courseId, course, reloadCourse }: UseUnitOperationsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to clean unit data
  const cleanUnitData = (unit: UnitDataInput): CourseUnit => {
    const cleanUnit: CourseUnit = {
      id: unit.id,
      name: unit.name,
      lessonCount: unit.lessonCount
    };
    
    if (unit.openDate !== undefined) {
      cleanUnit.openDate = unit.openDate;
    }
    
    return cleanUnit;
  };

  const addUnit = useCallback(async (name: string) => {
    if (!course || !name.trim()) return false;
    setIsSaving(true);
    setError(null);

    try {
      const newUnitId = `unit_${Date.now()}`;
      
      // Create unit document data
      const unitData = {
        id: newUnitId,
        name: name.trim(),
        description: '',
        lessons: [],
        courseId
      };

      // Create the unit document in Firestore
      await firestoreService.createUnit(newUnitId, unitData);

      // Create clean unit data for course update
      const newCourseUnit = cleanUnitData({
        id: newUnitId,
        name: name.trim(),
        lessonCount: 0
      });

      // Update the course's units array with clean data
      const updatedUnits = [...(course.units || [])].map(cleanUnitData);
      updatedUnits.push(newCourseUnit);
      await firestoreService.updateCourse(courseId, { units: updatedUnits });
      await reloadCourse();
      return true;
    } catch (err) {
      console.error('Error adding unit:', err);
      setError(err instanceof Error ? err : new Error('Failed to add unit'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [course, courseId, reloadCourse]);

  const updateUnitName = useCallback(async (unitId: string, newName: string) => {
    if (!course || !newName.trim()) return false;
    setIsSaving(true);
    setError(null);
    
    try {
      // Update unit document
      await firestoreService.updateUnit(unitId, { name: newName.trim() });

      // Update course units array with clean data
      const updatedUnits = course.units.map(u => 
        u.id === unitId ? cleanUnitData({
          ...u,
          name: newName.trim()
        }) : cleanUnitData(u)
      );
      await firestoreService.updateCourse(courseId, { units: updatedUnits });
      await reloadCourse();
      return true;
    } catch (err) {
      console.error('Error updating unit name:', err);
      setError(err instanceof Error ? err : new Error('Failed to update unit name'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [course, courseId, reloadCourse]);

  const deleteUnit = useCallback(async (unitId: string) => {
    if (!course) return false;
    setIsSaving(true);
    setError(null);

    try {
      // Update course with filtered and cleaned units
      const updatedUnits = course.units
        .filter(unit => unit.id !== unitId)
        .map(cleanUnitData);
      await firestoreService.updateCourse(courseId, { units: updatedUnits });
      await reloadCourse();
      return true;
    } catch (err) {
      console.error('Error deleting unit:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete unit'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [course, courseId, reloadCourse]);

  const reorderUnits = useCallback(async (sourceIndex: number, destinationIndex: number) => {
    if (!course) return false;
    setIsSaving(true);
    setError(null);

    try {
      const newUnits = Array.from(course.units);
      const [removed] = newUnits.splice(sourceIndex, 1);
      newUnits.splice(destinationIndex, 0, removed);

      // Clean all unit data
      const cleanUnits = newUnits.map(cleanUnitData);

      // Update course with new unit order
      await firestoreService.updateCourse(courseId, { units: cleanUnits });
      await reloadCourse();
      return true;
    } catch (err) {
      console.error('Error reordering units:', err);
      setError(err instanceof Error ? err : new Error('Failed to reorder units'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [course, courseId, reloadCourse]);

  return {
    addUnit,
    updateUnitName,
    deleteUnit,
    reorderUnits,
    isSaving,
    error
  };
};
