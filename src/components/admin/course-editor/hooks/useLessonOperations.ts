import { useState, useCallback } from 'react';
import { Course, CourseUnit, UnitLesson } from '../../../../types';
import { firestoreService } from '../../../../services/firestoreService';

interface UseLessonOperationsProps {
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

export const useLessonOperations = ({ course, reloadCourse }: UseLessonOperationsProps) => {
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

  const addLesson = useCallback(async (unitId: string, name: string) => {
    if (!course || !name.trim() || !unitId) return false;
    setIsSaving(true);
    setError(null);

    try {
      const newLessonId = `lesson_${Date.now()}`;
      // Get full unit data
      const unit = await firestoreService.getUnitById(unitId);
      if (!unit) {
        throw new Error('Unit not found');
      }

      await firestoreService.createLesson(newLessonId, {
        id: newLessonId,
        name: name.trim(),
        content: '',
        unitId,
        quizId: null
      });

      const newLesson: UnitLesson = {
        id: newLessonId,
        name: name.trim(),
        hasQuiz: false
      };
      const updatedLessons = [...(unit.lessons || []), newLesson];
      // Update unit with new lesson
      await firestoreService.updateUnit(unitId, { lessons: updatedLessons });
      
      // Update course unit's lessonCount with clean data
      const updatedUnits = course.units.map(u => 
        u.id === unitId 
          ? cleanUnitData({
              ...u,
              lessonCount: updatedLessons.length
            })
          : cleanUnitData(u)
      );
      await firestoreService.updateCourse(course.id, { units: updatedUnits });
      
      await reloadCourse();
      return true;
    } catch (err) {
      console.error('Error adding lesson:', err);
      setError(err instanceof Error ? err : new Error('Failed to add lesson'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [course, reloadCourse]);

  const deleteLesson = useCallback(async (unitId: string, lessonId: string) => {
    if (!course) return false;
    setIsSaving(true);
    setError(null);

    try {
      // Get full unit data
      const unit = await firestoreService.getUnitById(unitId);
      if (!unit) {
        throw new Error('Unit not found');
      }

      const updatedLessons: UnitLesson[] = unit.lessons
        .filter((lesson: UnitLesson) => lesson.id !== lessonId);

      // Update unit with filtered lessons
      await firestoreService.updateUnit(unitId, { lessons: updatedLessons });
      
      // Update course unit's lessonCount with clean data
      const updatedUnits = course.units.map(u => 
        u.id === unitId 
          ? cleanUnitData({
              ...u,
              lessonCount: updatedLessons.length
            })
          : cleanUnitData(u)
      );
      await firestoreService.updateCourse(course.id, { units: updatedUnits });
      
      await reloadCourse();
      return true;
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete lesson'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [course, reloadCourse]);

  const reorderLessons = useCallback(async (
    unitId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    if (!course) return false;
    setIsSaving(true);
    setError(null);

    try {
      // Get full unit data
      const unit = await firestoreService.getUnitById(unitId);
      if (!unit) {
        throw new Error('Unit not found');
      }

      const newLessons: UnitLesson[] = Array.from(unit.lessons);
      const [removed] = newLessons.splice(sourceIndex, 1);
      newLessons.splice(destinationIndex, 0, removed);

      // Update unit with reordered lessons
      await firestoreService.updateUnit(unitId, { lessons: newLessons });
      
      // No need to update lessonCount since we're just reordering
      // But still need to clean the unit data
      const updatedUnits = course.units.map(cleanUnitData);
      await firestoreService.updateCourse(course.id, { units: updatedUnits });
      
      // Force reload the unit data to get the updated lesson order
      const updatedUnit = await firestoreService.getUnitById(unitId);
      if (updatedUnit) {
        // Update the unit in the course with the new lesson order
        const finalUnits = course.units.map(u => 
          u.id === unitId 
            ? cleanUnitData({
                ...u,
                lessonCount: updatedUnit.lessons.length
              })
            : cleanUnitData(u)
        );
        await firestoreService.updateCourse(course.id, { units: finalUnits });
      }
      
      await reloadCourse();
      return true;
    } catch (err) {
      console.error('Error reordering lessons:', err);
      setError(err instanceof Error ? err : new Error('Failed to reorder lessons'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [course, reloadCourse]);

  return {
    addLesson,
    deleteLesson,
    reorderLessons,
    isSaving,
    error
  };
};
