import { firestoreService } from './firestoreService';
import type { Course, Unit, Lesson, Quiz, Note, UserProfile } from '../types';

export const getAllCourses = async (): Promise<Course[]> => {
  return await firestoreService.getAllCourses();
};

export const getCourse = async (courseId: string): Promise<Course | null> => {
  return await firestoreService.getCourseById(courseId);
};

export const getUnit = async (unitId: string): Promise<Unit | null> => {
  return await firestoreService.getUnitById(unitId);
};

export const getLesson = async (lessonId: string): Promise<Lesson | null> => {
  return await firestoreService.getLessonById(lessonId);
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  return await firestoreService.getQuizById(quizId);
};

export const getLessonsForUnit = async (unitId: string): Promise<Lesson[]> => {
  return await firestoreService.getLessonsForUnit(unitId);
};

export const getUnitsForCourse = async (courseId: string): Promise<Unit[]> => {
  return await firestoreService.getUnitsForCourse(courseId);
};

export const getUser = async (userId: string): Promise<UserProfile | null> => {
  return await firestoreService.getUserById(userId);
};

export const updateUserProgress = async (
  userId: string,
  courseId: string,
  lessonId: string,
  completed: boolean = true,
  completedAt: string = new Date().toISOString(),
  lessonName: string = ''
): Promise<void> => {
  await firestoreService.updateUserProgress(userId, courseId, lessonId, completed, completedAt, lessonName);
};

export const saveNote = async (userId: string, lessonId: string, text: string): Promise<Note> => {
  return await firestoreService.saveNote(userId, lessonId, text);
};

export const getNotesForLesson = async (userId: string, lessonId: string): Promise<Note | null> => {
  return await firestoreService.getNoteForLesson(userId, lessonId);
};