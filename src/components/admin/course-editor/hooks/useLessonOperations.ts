import { useState, useCallback } from 'react';
import { Course } from '../../../../types';
import { createLesson, updateUnit, updateCourse, getUnit } from '../../../../services/dataService';
import type { UnitLesson } from '../../../../types';

interface UseLessonOperationsProps {
  courseId: string;
  course: Course | null;
  reloadCourse: () => Promise<void>;
}

export const useLessonOperations = ({ course, reloadCourse }: UseLessonOperationsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addLesson = useCallback(async (unitId: string, name: string) => {
    if (!course || !name.trim() || !unitId) return false;
    setIsSaving(true);
    setError(null);

    try {
      const newLessonId = `lesson_${Date.now()}`;
      // Get full unit data
      const unit = await getUnit(unitId);
      if (!unit) {
        throw new Error('Unit not found');
      }

      const newOrder = unit.lessons.length;

      await createLesson(newLessonId, {
        id: newLessonId,
        name: name.trim(),
        content: '',
        unitId,
        quizId: null,
        order: newOrder
      });

      const newLesson: UnitLesson = {
        id: newLessonId,
        name: name.trim(),
        order: newOrder,
        hasQuiz: false
      };
      const updatedLessons = [...(unit.lessons || []), newLesson];
      // Update unit with new lesson
      await updateUnit(unitId, { lessons: updatedLessons });
      
      // Update course unit's lessonCount
      const updatedUnits = course.units.map(u => 
        u.id === unitId 
          ? { ...u, lessonCount: updatedLessons.length }
          : u
      );
      await updateCourse(course.id, { units: updatedUnits });
      
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
      const unit = await getUnit(unitId);
      if (!unit) {
        throw new Error('Unit not found');
      }

      const updatedLessons: UnitLesson[] = unit.lessons
        .filter((lesson: UnitLesson) => lesson.id !== lessonId)
        .map((lesson: UnitLesson, index: number) => ({ ...lesson, order: index }));

      // Update unit with filtered lessons
      await updateUnit(unitId, { lessons: updatedLessons });
      
      // Update course unit's lessonCount
      const updatedUnits = course.units.map(u => 
        u.id === unitId 
          ? { ...u, lessonCount: updatedLessons.length }
          : u
      );
      await updateCourse(course.id, { units: updatedUnits });
      
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
      const unit = await getUnit(unitId);
      if (!unit) {
        throw new Error('Unit not found');
      }

      const newLessons: UnitLesson[] = Array.from(unit.lessons);
      const [removed] = newLessons.splice(sourceIndex, 1);
      newLessons.splice(destinationIndex, 0, removed);

      // Update order for all affected lessons
      const updatedLessons = newLessons.map((lesson, index) => ({
        ...lesson,
        order: index
      }));

      // Update unit with reordered lessons
      await updateUnit(unitId, { lessons: updatedLessons });
      
      // No need to update lessonCount since we're just reordering
      
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
