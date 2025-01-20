export interface Course {
  id: string;
  name: string;
  description: string;
  settings: {
    unlockLessonIndex: number;
  };
  units: Array<{
    id: string;
    name: string;
  }>;
  groupIds: Record<string, boolean>;
  isPublic?: boolean;
}

export interface Unit {
  id: string;
  courseId: string;
  name: string;
  description: string;
  lessons: Array<{
    id: string;
    name: string;
  }>;
}

export interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  "video-title"?: string;
  "video-url"?: string;
  quizId: string | null;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  type: 'single_choice' | 'free_form';
  text: string;
  options?: QuizOption[];
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizHistory {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  answers: Record<string, string>;
  score: number;
  completedAt: string;
  correct: number;
  total: number;
  timeSpent: number;
}

export interface UserProgress {
  completed: boolean;
  completedAt: string;
  lessonName: string;
}

export type UserRole = 'student' | 'instructor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: Record<UserRole, boolean>;  // e.g., { student: true, instructor: true, admin: false }
  registeredCourses: Record<string, boolean>;
  progress: Record<string, Record<string, UserProgress>>;
  groupIds: Record<string, boolean>;
  notes: Record<string, Note>;
  createdAt: Date;
  updatedAt: Date;
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
  id: string;
  lessonId: string;
  text: string;
} 