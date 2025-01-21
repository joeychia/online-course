export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  enrolledCourses?: string[];
  createdAt: Date;
  updatedAt: Date;
} 