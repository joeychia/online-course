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
  units: {
    [unitId: string]: Unit;
  };
  groups: {
    [groupId: string]: Group;
  };
  grades: {
    [userId: string]: {
      grade: number;
    };
  };
}

export interface Unit {
  id: string;
  name: string;
  description: string;
  lessons: {
    [lessonId: string]: Lesson;
  };
}

export interface Lesson {
  id: string;
  name: string;
  type: 'video' | 'text' | 'image' | 'quiz';
  content: string;
  quiz?: Quiz;
  completed: boolean;
  notes: {
    [userId: string]: {
      text: string;
    };
  };
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