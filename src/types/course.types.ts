export interface Course {
  id: string;
  name: string;
  description: string;
  settings: {
    unlockLessonIndex: number;
    token?: string;
    enableNote?: boolean;
  };
  units: Array<{
    id: string;
    name: string;
    order: number;
    lessons: Array<{
      id: string;
      name: string;
      order: number;
    }>;
  }>;
  groupIds: Record<string, boolean>;
  isPublic?: boolean;
}

export interface Unit {
  id: string;
  courseId: string;
  name: string;
  description: string;
  order: number;
  lessons: Array<{
    id: string;
    name: string;
    order: number;
  }>;
}

export interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  order: number;
  "video-title"?: string;
  "video-url"?: string;
  quizId: string | null;
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
