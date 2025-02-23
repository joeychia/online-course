import { useState, useEffect, useCallback } from 'react';
import { Course, Unit } from '../../../../types';
import * as ds from '../../../../services/dataService';

export const useCourseData = (courseId: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loadedUnits, setLoadedUnits] = useState<Record<string, Unit>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial course data with minimal unit info
  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedCourse = await ds.getCourse(courseId);
      if (loadedCourse) {
        setCourse(loadedCourse);
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

  // Load unit details when expanded
  const loadUnitDetails = useCallback(async (unitId: string) => {
    try {
      // Check if already loaded
      if (loadedUnits[unitId]) {
        return loadedUnits[unitId];
      }

      // Load unit details with lessons
      const unitDetails = await ds.getUnitWithLessons(unitId);
      if (unitDetails) {
        setLoadedUnits(prev => ({
          ...prev,
          [unitId]: unitDetails
        }));
        return unitDetails;
      }
      return null;
    } catch (err) {
      console.error('Error loading unit details:', err);
      setError(err instanceof Error ? err : new Error('Failed to load unit details'));
      return null;
    }
  }, [loadedUnits]);

  // Clear unit from cache (useful when unit is updated)
  const clearUnitCache = useCallback((unitId: string) => {
    setLoadedUnits(prev => {
      const newCache = { ...prev };
      delete newCache[unitId];
      return newCache;
    });
    ds.clearUnitCache(unitId);
  }, []);

  useEffect(() => {
    loadCourse();
    // Clear loaded units when course changes
    setLoadedUnits({});
  }, [loadCourse]);

  // Update unit lessons (useful for immediate UI updates)
  const updateUnitLessons = useCallback((unitId: string, updateFn: (unit: Unit) => Unit) => {
    setLoadedUnits(prev => {
      const unit = prev[unitId];
      if (!unit) return prev;
      
      return {
        ...prev,
        [unitId]: updateFn(unit)
      };
    });
  }, []);

  return {
    course,
    loadedUnits,
    isLoading,
    error,
    reloadCourse: loadCourse,
    loadUnitDetails,
    clearUnitCache,
    updateUnitLessons
  };
};
