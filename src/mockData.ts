export interface Course {
  id: string;
  name: string;
  description: string;
  unitIds: { [key: string]: boolean };
  groupIds: { [key: string]: boolean };
  isPublic?: boolean;
}

export interface Unit {
  id: string;
  courseId: string;
  name: string;
  description: string;
  lessonIds: { [key: string]: boolean };
  isPublic?: boolean;
}

export interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  quizId?: string;
}

export interface Quiz {
  id: string;
  questions: {
    [key: string]: {
      type: 'single_choice' | 'free_form';
      text: string;
      options: {
        [key: string]: {
          text: string;
          isCorrect: boolean;
        };
      };
    };
  };
}

export interface Group {
  id: string;
  courseId: string;
  name: string;
  description: string;
  members: { [key: string]: boolean };
}

export interface Grade {
  courseId: string;
  userId: string;
  grade: number;
}

export interface Note {
  lessonId: string;
  userId: string;
  text: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  registeredCourses: { [key: string]: boolean };
  progress: {
    [courseId: string]: {
      [lessonId: string]: {
        completed: boolean;
      };
    };
  };
  groupIds: { [key: string]: boolean };
}

export interface MockData {
  courses: { [key: string]: Course };
  units: { [key: string]: Unit };
  lessons: { [key: string]: Lesson };
  quizzes: { [key: string]: Quiz };
  groups: { [key: string]: Group };
  grades: { [key: string]: Grade };
  notes: { [key: string]: Note };
  users: { [key: string]: UserProfile };
}

export const mockData: MockData = {
  courses: {},
  units: {},
  lessons: {},
  quizzes: {},
  groups: {},
  grades: {},
  notes: {},
  users: {}
}; 