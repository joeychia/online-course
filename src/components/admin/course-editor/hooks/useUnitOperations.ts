import { useState, useCallback } from 'react';
import { Course } from '../../../../types';
import { createUnit, updateUnit, updateCourse, clearUnitCache } from '../../../../services/dataService';

interface UseUnitOperationsProps {
  courseId: string;
  course: Course | null;
  reloadCourse: () => Promise<void>;
}

export const useUnitOperations = ({ courseId, course, reloadCourse }: UseUnitOperationsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addUnit = useCallback(async (name: string) => {
    if (!course || !name.trim()) return false;
    setIsSaving(true);
    setError(null);

    try {
      const newUnitId = `unit_${Date.now()}`;
      const newOrder = course.units.length;
      
      // Create minimal unit data with lessonCount
      const newUnit = {
        id: newUnitId,
        name: name.trim(),
        order: newOrder,
        lessonCount: 0
      };

      // Create the unit document in Firestore
      await createUnit(newUnitId, {
        id: newUnitId,
        name: name.trim(),
        description: '',
        lessons: [],
        courseId,
        order: newOrder
      });

      // Update the course's units array with minimal data
      const updatedUnits = [...(course.units || []), newUnit];
      await updateCourse(courseId, { units: updatedUnits });
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
      // Update unit document and clear cache
      await updateUnit(unitId, { name: newName.trim() });
      clearUnitCache(unitId);

      // Update course units array with minimal data, preserving lessonCount
      const updatedUnits = course.units.map(u => 
        u.id === unitId ? { ...u, name: newName.trim(), lessonCount: u.lessonCount } : u
      );
      await updateCourse(courseId, { units: updatedUnits });
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
      // Clear unit cache before deletion
      clearUnitCache(unitId);
      
      // Update course with filtered units
      const updatedUnits = course.units.filter(unit => unit.id !== unitId);
      await updateCourse(courseId, { units: updatedUnits });
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

      // Update order for all affected units
      const updatedUnits = newUnits.map((unit, index) => ({
        ...unit,
        order: index
      }));

      // Update course with new unit order
      await updateCourse(courseId, { units: updatedUnits });
      
      // Update individual unit documents and clear their caches
      await Promise.all(
        updatedUnits.map(unit => {
          clearUnitCache(unit.id);
          return updateUnit(unit.id, { order: unit.order });
        })
      );

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
