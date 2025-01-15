export interface Course {
  id: string;
  name: string;
  description: string;
  settings: {
    unlockLessonIndex: number;
  };
  unitIds: Record<string, boolean>;
  groupIds: Record<string, boolean>;
  isPublic?: boolean;
}

export interface Unit {
  id: string;
  courseId: string;
  name: string;
  description: string;
  lessonIds: Record<string, boolean>;
}

export interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  "video-title"?: string;
  "video-url"?: string;
  meditation?: string;
  quizId: string | null;
  orderIndex: number;
}

export interface Quiz {
  id: string;
  type: "multiple choice" | "true/false" | "short answer";
  questions: Record<string, QuizQuestion>;
}

export interface QuizQuestion {
  questionType: 'single_choice' | 'free_form';
  text: string;
  options: Record<string, QuizOption>;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface UserProgress {
  completed: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  registeredCourses: Record<string, boolean>;
  progress: Record<string, Record<string, UserProgress>>;
  groupIds: Record<string, boolean>;
  notes: Record<string, Note>;
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
  userId: string;
  text: string;
} 