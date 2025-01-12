export interface User {
  id: string;
  name: string;
  email: string;
  courses: {
    [courseId: string]: {
      registered: boolean;
      progress: {
        [unitId: string]: {
          [lessonId: string]: {
            completed: boolean;
            note: string;
          };
        };
      };
    };
  };
  groups: {
    [groupId: string]: boolean;
  };
}

export interface Course {
  id: string;
  name: string;
  description: string;
  units: Record<string, Unit>;
  groups: Record<string, any>;
  grades: Record<string, any>;
  isPublic?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  description: string;
  lessons: Record<string, Lesson>;
  isPublic?: boolean;
}

export interface Lesson {
  id: string;
  name: string;
  type: string;
  content: string;
  completed: boolean;
  notes: Record<string, any>;
  isPublic?: boolean;
}

export interface Quiz {
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  questions: {
    [questionId: string]: Question;
  };
}

export interface Question {
  text: string;
  options?: {
    [optionId: string]: {
      text: string;
      isCorrect: boolean;
    };
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: {
    [userId: string]: boolean;
  };
} 