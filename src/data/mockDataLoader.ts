import { Course, Unit, Lesson, UserProfile } from '../types';

// Remove mock data functionality since we're using Firestore now
export function loadCourseData(): Course[] {
  return [];
}

export function loadUnitData(_courseId: string): Unit[] {
  return [];
}

export function loadLessonData(_unitId: string): Lesson[] {
  return [];
}

export function loadUserData(_userId: string): UserProfile | null {
  return null;
}

// ... existing code ... 