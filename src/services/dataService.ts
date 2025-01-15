import { firestoreService } from './firestoreService';
import { indexedDBService } from './indexedDBService';
import type { Course, Unit, Lesson, Quiz, Note, UserProfile } from '../types';

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Helper function to check if cache is valid
const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Wrapper functions with caching
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    // Try to get from IndexedDB first
    const cachedCourses = await indexedDBService.getAll('courses');
    if (cachedCourses && cachedCourses.length > 0) {
      return cachedCourses;
    }

    // If not in cache, get from Firestore and cache
    const courses = await firestoreService.getAllCourses();
    await indexedDBService.putAll('courses', courses);
    return courses;
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    // If IndexedDB fails, fallback to Firestore
    return await firestoreService.getAllCourses();
  }
};

export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    // Try to get from IndexedDB first
    const cachedCourse = await indexedDBService.get('courses', courseId);
    if (cachedCourse) {
      return cachedCourse;
    }

    // If not in cache, get from Firestore and cache
    const course = await firestoreService.getCourseById(courseId);
    if (course) {
      await indexedDBService.put('courses', course);
    }
    return course;
  } catch (error) {
    console.error('Error in getCourse:', error);
    // If IndexedDB fails, fallback to Firestore
    return await firestoreService.getCourseById(courseId);
  }
};

export const getUnit = async (unitId: string): Promise<Unit | null> => {
  try {
    // Try to get from IndexedDB first
    const cachedUnit = await indexedDBService.get('units', unitId);
    if (cachedUnit) {
      return cachedUnit;
    }

    // If not in cache, get from Firestore and cache
    const unit = await firestoreService.getUnitById(unitId);
    if (unit) {
      await indexedDBService.put('units', unit);
    }
    return unit;
  } catch (error) {
    console.error('Error in getUnit:', error);
    return await firestoreService.getUnitById(unitId);
  }
};

export const getLesson = async (lessonId: string): Promise<Lesson | null> => {
  try {
    // Try to get from IndexedDB first
    const cachedLesson = await indexedDBService.get('lessons', lessonId);
    if (cachedLesson) {
      console.log('loaded lesson from indexeddb for lesson', lessonId);
      return cachedLesson;
    }

    // If not in cache, get from Firestore and cache
    const lesson = await firestoreService.getLessonById(lessonId);
    if (lesson) {
      await indexedDBService.put('lessons', lesson);
    }
    return lesson;
  } catch (error) {
    console.error('Error in getLesson:', error);
    return await firestoreService.getLessonById(lessonId);
  }
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  try {
    // Try to get from IndexedDB first
    const cachedQuiz = await indexedDBService.get('quizzes', quizId);
    if (cachedQuiz) {
      console.log('loaded quiz from indexeddb for quiz', quizId);
      return cachedQuiz;
    }

    // If not in cache, get from Firestore and cache
    const quiz = await firestoreService.getQuizById(quizId);
    if (quiz) {
      await indexedDBService.put('quizzes', quiz);
    }
    return quiz;
  } catch (error) {
    console.error('Error in getQuiz:', error);
    return await firestoreService.getQuizById(quizId);
  }
};

export const getLessonsForUnit = async (unitId: string): Promise<Lesson[]> => {
  try {
    // Try to get from IndexedDB first
    const cachedLessons = await indexedDBService.getAll('lessons');
    const unitLessons = cachedLessons.filter(lesson => lesson.unitId === unitId);
    if (unitLessons.length > 0) {
      console.log('loaded lessons from indexeddb for unit', unitId);
      // Sort lessons by orderIndex before returning
      return unitLessons.sort((a, b) => a.orderIndex - b.orderIndex);
    }
    // If not in cache, get from Firestore and cache
    const lessons = await firestoreService.getLessonsForUnit(unitId);
    await indexedDBService.putAll('lessons', lessons);
    // Sort lessons by orderIndex before returning
    return lessons.sort((a, b) => a.orderIndex - b.orderIndex);
  } catch (error) {
    console.error('Error in getLessonsForUnit:', error);
    return await firestoreService.getLessonsForUnit(unitId);
  }
};

export const getUnitsForCourse = async (courseId: string): Promise<Unit[]> => {
  try {
    // Try to get from IndexedDB first
    const cachedUnits = await indexedDBService.getAll('units');
    const courseUnits = cachedUnits.filter(unit => unit.courseId === courseId);
    if (courseUnits.length > 0) {
      console.log('loaded units from indexeddb for course', courseId);
      return courseUnits;
    }

    // If not in cache, get from Firestore and cache
    const units = await firestoreService.getUnitsForCourse(courseId);
    await indexedDBService.putAll('units', units);
    return units;
  } catch (error) {
    console.error('Error in getUnitsForCourse:', error);
    return await firestoreService.getUnitsForCourse(courseId);
  }
};

// Non-cached operations (user-specific data)
export const getUser = async (userId: string): Promise<UserProfile | null> => {
  return await firestoreService.getUserById(userId);
};

export const getNote = async (lessonId: string, userId: string): Promise<Note | null> => {
  return await firestoreService.getNoteForLesson(lessonId, userId);
};

export const updateUserProgress = async (
  userId: string,
  courseId: string,
  lessonId: string,
  completed: boolean = true
): Promise<void> => {
  await firestoreService.updateUserProgress(userId, courseId, lessonId, completed);
};

export const saveNote = async (note: Omit<Note, 'id'>): Promise<Note> => {
  return await firestoreService.saveNote(note);
};

export const updateNote = async (id: string, note: Note): Promise<Note> => {
  return await firestoreService.updateNote(id, note);
}; 