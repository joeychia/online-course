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

export const saveQuiz = async (quizData: Omit<Quiz, 'id'> & { id?: string }): Promise<string> => {
  return await firestoreService.saveQuiz(quizData);
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

export const saveNote = async (userId: string, lessonId: string, courseId: string, text: string, lessonName: string, unitName: string): Promise<Note> => {
  return await firestoreService.saveNote(userId, lessonId, courseId, text, lessonName, unitName);
};

export const getNotesForLesson = async (userId: string, lessonId: string): Promise<Note | null> => {
  return await firestoreService.getNoteForLesson(userId, lessonId)
};

export const getNotesForUserCourse = async (userId: string, courseId: string, startDate?: Date, endDate?: Date): Promise<Note[]> => {
  return await firestoreService.getNotesForUserCourse(userId, courseId, startDate, endDate);
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

export const createCourse = async (courseData: Omit<Course, 'id'>): Promise<string> => {
  const newCourse = {
    ...courseData,
    units: [],
    groupIds: {},
    isPublic: false
  };
  return await firestoreService.createCourse(newCourse);
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<void> => {
  await firestoreService.updateCourse(courseId, courseData);
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await firestoreService.deleteCourse(courseId);
};

export const createUnit = async (unitId: string, unitData: Unit): Promise<void> => {
  await firestoreService.createUnit(unitId, unitData);
};

export const updateUnit = async (unitId: string, unitData: Partial<Unit>): Promise<void> => {
  await firestoreService.updateUnit(unitId, unitData);
};

export const createLesson = async (lessonId: string, lessonData: Lesson): Promise<void> => {
  await firestoreService.createLesson(lessonId, lessonData);
};

export const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>): Promise<void> => {
  await firestoreService.updateLesson(lessonId, lessonData);
};
