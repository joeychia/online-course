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
}
