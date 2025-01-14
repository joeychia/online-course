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

// Function to load user data from localStorage
function loadUserData(userId: string): UserProfile {
  const data = localStorage.getItem(`user_${userId}`);
  return data ? JSON.parse(data) : mockData.users[userId];
}

// Function to save user data to localStorage
export function saveUserData(userId: string, userData: UserProfile) {
  localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
}

// Update getMockUser to use localStorage
export const getMockUser = (userId: string) => {
  return loadUserData(userId);
};

// Update getMockNote to use localStorage
export const getMockNote = (noteId: string) => {
  const note = mockData.notes[noteId];
  const user = loadUserData(note.userId);
  return user.notes[noteId] || note;
};

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

// Add a function to update user progress
export const updateUserProgress = (userId: string, courseId: string, lessonId: string) => {
  const user = loadUserData(userId);
  user.progress[courseId] = user.progress[courseId] || {};
  user.progress[courseId][lessonId] = user.progress[courseId][lessonId] || { completed: false };
  user.progress[courseId][lessonId].completed = true;
  saveUserData(userId, user);
  console.log(`User progress updated for course ${courseId} and lesson ${lessonId}`);
}; 