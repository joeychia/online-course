export interface Course {
  id: string;
  name: string;
  description: string;
  settings?: {
    unlockLessonIndex?: number;
  };
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
  orderIndex?: number;
}

export interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  quizId: string | null;
  orderIndex: number;
}

export interface Quiz {
  id: string;
  type: 'multiple choice' | 'true/false' | 'short answer';
  questions: {
    [key: string]: {
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
  notes: { [noteId: string]: Note };
  groupIds: { [key: string]: boolean };
} 