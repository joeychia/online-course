// Minimal unit data stored in course
export interface CourseUnit {
  id: string;
  name: string;
  lessonCount: number;
  openDate?: string; // ISO date string for course availability
}

export interface Course {
  id: string;
  name: string;
  description: string;
  settings: {
    unlockLessonIndex: number;
    token?: string;
    enableNote?: boolean;
  };
  units: CourseUnit[];
  groupIds: Record<string, boolean>;
  isPublic?: boolean;
}

// Full unit data with lessons, loaded on demand
export interface Unit {
  id: string;
  courseId: string;
  name: string;
  description: string;
  lessons: UnitLesson[];
}

export interface UnitLesson {
  id: string;
  name: string;
  hasQuiz: boolean;
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
  quizId: string;
  userId: string;
  courseId: string;
  lessonId: string;
  answers: Record<string, string>;
  score: number;
  completedAt: string;
  correct: number;
  total: number;
  title?: string; // Unit name
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
  QuizHistory: Record<string, QuizHistory>;
  createdAt?: Date;
  updatedAt?: Date;
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
  courseId: string;
  unitName: string;
  lessonName: string;
  text: string;
  updatedAt: string;
}
