import { Course, Unit, Lesson, Note, UserProfile, Quiz } from '../types';
import type { User as DbUser, Lesson as DbLesson, Quiz as DbQuiz, Note as DbNote } from '../types/database';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'API call failed');
    }

    return response.json();
}

// Type conversion functions
const convertDbLesson = (dbLesson: DbLesson): Lesson => ({
    ...dbLesson,
    quizId: dbLesson.quizId ?? null
});

const convertDbUser = (dbUser: DbUser): UserProfile => ({
    ...dbUser,
    notes: dbUser.notes || {}
});

const convertDbQuiz = (dbQuiz: DbQuiz): Quiz => ({
    ...dbQuiz,
    type: dbQuiz.type || "multiple choice"
});

// Get all courses
export const getAllCourses = async (): Promise<Course[]> => {
    return apiCall<Course[]>('/courses');
};

// Get a single course by ID
export const getCourse = async (courseId: string): Promise<Course | null> => {
    return apiCall<Course>(`/courses/${courseId}`);
};

// Get a single unit by ID
export const getUnit = async (unitId: string): Promise<Unit | null> => {
    return apiCall<Unit>(`/units/${unitId}`);
};

// Get a single lesson by ID
export const getLesson = async (lessonId: string): Promise<Lesson | null> => {
    const dbLesson = await apiCall<DbLesson>(`/lessons/${lessonId}`);
    return convertDbLesson(dbLesson);
};

// Get all lessons for a unit
export const getLessonsForUnit = async (unitId: string): Promise<Lesson[]> => {
    const dbLessons = await apiCall<DbLesson[]>(`/lessons/${unitId}`);
    return dbLessons.map(convertDbLesson);
};

// Get all units for a course
export const getUnitsForCourse = async (courseId: string): Promise<Unit[]> => {
    return apiCall<Unit[]>(`/units/${courseId}`);
};

// Get user profile
export const getUser = async (userId: string): Promise<UserProfile | null> => {
    const dbUser = await apiCall<DbUser>(`/users/${userId}`);
    return convertDbUser(dbUser);
};

// Update user progress
export const updateUserProgress = async (userId: string, courseId: string, lessonId: string) => {
    await apiCall(`/users/${userId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ courseId, lessonId, completed: true }),
    });
};

// Get note for a lesson
export const getNote = async (lessonId: string, userId: string): Promise<Note | null> => {
    return apiCall<Note | null>(`/notes/${lessonId}/${userId}`);
};

// Save or update a note
export const saveNote = async (note: Omit<DbNote, 'id'> | (DbNote & { id: string })) => {
    if ('id' in note && note.id) {
        return apiCall<Note>(`/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify(note),
        });
    } else {
        return apiCall<Note>('/notes', {
            method: 'POST',
            body: JSON.stringify(note),
        });
    }
};

// Get quiz by ID
export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
    const dbQuiz = await apiCall<DbQuiz>(`/quizzes/${quizId}`);
    return dbQuiz ? convertDbQuiz(dbQuiz) : null;
};

// Register user for a course
export const registerCourse = async (userId: string, courseId: string) => {
    await apiCall(`/users/${userId}/courses/${courseId}`, {
        method: 'POST',
    });
};

// Drop a course
export const dropCourse = async (userId: string, courseId: string) => {
    await apiCall(`/users/${userId}/courses/${courseId}`, {
        method: 'DELETE',
    });
}; 