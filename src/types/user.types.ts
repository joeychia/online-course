import { Note } from './note.types';
import { QuizHistory } from './quiz.types';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface UserProgress {
  completed: boolean;
  completedAt: string;
  lessonName: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: Record<UserRole, boolean>;
  registeredCourses: Record<string, boolean>;
  progress: Record<string, Record<string, UserProgress>>;
  groupIds: Record<string, boolean>;
  notes: Record<string, Note>;
  QuizHistory: Record<string, QuizHistory>;
  createdAt?: Date;
  updatedAt?: Date;
}
