export interface Course {
    id: string;
    name: string;
    description: string;
    settings: {
        unlockLessonIndex: number;
    };
    unitIds: Record<string, boolean>;
    groupIds: Record<string, boolean>;
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
    quizId?: string;
    orderIndex: number;
}

export interface QuizOption {
    text: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    type: 'single_choice' | 'free_form';
    text: string;
    options: Record<string, QuizOption>;
}

export interface Quiz {
    id: string;
    questions: Record<string, QuizQuestion>;
}

export interface Group {
    id: string;
    courseId: string;
    name: string;
    description: string;
    members: Record<string, boolean>;
}

export interface Grade {
    id: string;
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

export interface UserProgress {
    completed: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    registeredCourses: Record<string, boolean>;
    progress: Record<string, Record<string, UserProgress>>;
    groupIds: Record<string, boolean>;
} 