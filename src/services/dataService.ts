import { firestoreService } from './firestoreService';
import type { Course, Unit, Lesson, Quiz, Note, UserProfile, QuizHistory } from '../types';

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

// Get only lesson IDs and names for navigation
export const getLessonsIdNameForUnit = async (unitId: string): Promise<Array<{ id: string; name: string }>> => {
  return await firestoreService.getLessonsIdNameForUnit(unitId);
};

// Get only unit IDs and names for navigation
export const getUnitsIdNameForCourse = async (courseId: string): Promise<Array<{ id: string; name: string }>> => {
  return await firestoreService.getUnitsIdNameForCourse(courseId);
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

// Quiz History operations
export const getQuizHistoryForUserCourse = async (userId: string, courseId: string): Promise<QuizHistory[]> => {
  return await firestoreService.getQuizHistoryForUserCourse(userId, courseId);
};

export const getQuizHistoryForUserLesson = async (userId: string, lessonId: string): Promise<QuizHistory | null> => {
  return await firestoreService.getQuizHistoryForUserLesson(userId, lessonId);
};

export async function saveQuizHistory(
  quizId: string,
  userId: string,
  courseId: string,
  lessonId: string,
  answers: Record<string, string>,
  correct: number,
  total: number
): Promise<QuizHistory> {
  const quizHistory: Omit<QuizHistory, 'id'> = {
    quizId,
    userId,
    courseId,
    lessonId,
    answers,
    correct,
    total,
    completedAt: new Date().toISOString(),
    score: (correct / total) * 100 // Calculate score
  };
  return await firestoreService.createQuizHistory(userId, lessonId, quizHistory);
}