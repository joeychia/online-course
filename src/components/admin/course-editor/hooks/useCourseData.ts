import { useState, useEffect, useCallback } from 'react';
import { Course } from '../../../../types';
import { getCourse, getUnit } from '../../../../services/dataService';

export const useCourseData = (courseId: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedCourse = await getCourse(courseId);
      if (loadedCourse) {
        // Fetch lesson counts for each unit
        const unitsWithLessonCounts = await Promise.all(
          loadedCourse.units.map(async (unit) => {
            const unitDetails = await getUnit(unit.id);
            return {
              ...unit,
              lessons: unitDetails?.lessons || []
            };
          })
        );
        setCourse({
          ...loadedCourse,
          units: unitsWithLessonCounts
        });
      } else {
        setCourse(null);
      }
    } catch (err) {
      console.error('Error loading course:', err);
      setError(err instanceof Error ? err : new Error('Failed to load course'));
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  return {
    course,
    isLoading,
    error,
    reloadCourse: loadCourse
  };
};
