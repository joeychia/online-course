import { Course, Unit, Lesson, Note, UserProfile } from '../types';
import mockDataJson from './mock/mockData.json';

interface MockData {
  courses: { [key: string]: Course };
  units: { [key: string]: Unit };
  lessons: { [key: string]: Lesson & { quizId: string | null } };
  notes: { [key: string]: Note };
  users: { [key: string]: UserProfile };
  quizzes: { [key: string]: any }; // TODO: Add proper Quiz type
}

const mockData = mockDataJson as unknown as MockData;

export const getMockData = () => mockData;

export const getMockCourse = (courseId: string) => mockData.courses[courseId];
export const getMockUnit = (unitId: string) => mockData.units[unitId];
export const getMockLesson = (lessonId: string): Lesson => {
  const lesson = mockData.lessons[lessonId];
  return {
    ...lesson,
    quizId: lesson.quizId === undefined ? null : lesson.quizId
  };
};
export const getMockUser = (userId: string) => mockData.users[userId];
export const getMockNote = (noteId: string) => mockData.notes[noteId];
export const getMockQuiz = (quizId: string) => mockData.quizzes[quizId];

export const getMockLessonsForUnit = (unitId: string): Lesson[] => {
  const unit = mockData.units[unitId];
  if (!unit) return [];
  
  return Object.keys(unit.lessonIds)
    .map(lessonId => getMockLesson(lessonId))
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

export const getMockUnitsForCourse = (courseId: string): Unit[] => {
  const course = mockData.courses[courseId];
  if (!course) return [];
  
  return Object.keys(course.unitIds)
    .map(unitId => mockData.units[unitId]);
}; 