import { useState } from 'react';
import { Course } from '../../../../types';
import { firestoreService } from '../../../../services/firestoreService';

interface UseCourseOperationsProps {
  courseId: string;
  reloadCourse: () => Promise<void>;
}

export const useCourseOperations = ({ courseId, reloadCourse }: UseCourseOperationsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateCourseSettings = async (settings: Course['settings']): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    
    try {
      await firestoreService.updateCourse(courseId, { settings });
      await reloadCourse();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update course settings'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    updateCourseSettings,
    isSaving,
    error
  };
};
