import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreService } from '../firestoreService';
import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    deleteDoc
} from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn()
}));

// Mock firebase config
vi.mock('../firebaseConfig', () => ({
    app: {}
}));

describe('FirestoreService', () => {
    let firestoreService: FirestoreService;
    const mockCourse = {
        id: 'course1',
        name: 'Test Course',
        description: 'Test Description',
        units: [],
        settings: { unlockLessonIndex: 0, token: 'test-token' },
        groupIds: {},
        isPublic: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
        firestoreService = new FirestoreService();
    });

    describe('Course Operations', () => {
        describe('getAllCourses', () => {
            it('should return all courses', async () => {
                const mockSnapshot = {
                    docs: [{
                        id: 'course1',
                        data: () => ({
                            name: 'Test Course',
                            description: 'Test Description',
                            units: [],
                            settings: { unlockLessonIndex: 0, token: 'test-token' },
                            groupIds: {},
                            isPublic: true
                        })
                    }]
                };

                (collection as any).mockReturnValue('courses-collection');
                (getDocs as any).mockResolvedValue(mockSnapshot);

                const result = await firestoreService.getAllCourses();

                expect(collection).toHaveBeenCalledWith(expect.anything(), 'courses');
                expect(getDocs).toHaveBeenCalledWith('courses-collection');
                expect(result).toHaveLength(1);
                expect(result[0]).toEqual(mockCourse);
            });

            it('should handle empty courses list', async () => {
                const mockSnapshot = { docs: [] };
                (collection as any).mockReturnValue('courses-collection');
                (getDocs as any).mockResolvedValue(mockSnapshot);

                const result = await firestoreService.getAllCourses();

                expect(result).toHaveLength(0);
            });
        });

        describe('getCourseById', () => {
            it('should return course by id', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    id: 'course1',
                    data: () => ({
                        name: 'Test Course',
                        description: 'Test Description',
                        units: [],
                        settings: { unlockLessonIndex: 0, token: 'test-token' },
                        groupIds: {},
                        isPublic: true
                    })
                };

                (doc as any).mockReturnValue('course-doc');
                (getDoc as any).mockResolvedValue(mockDocSnap);

                const result = await firestoreService.getCourseById('course1');

                expect(doc).toHaveBeenCalledWith(expect.anything(), 'courses', 'course1');
                expect(getDoc).toHaveBeenCalledWith('course-doc');
                expect(result).toEqual(mockCourse);
            });

            it('should return null for non-existent course', async () => {
                const mockDocSnap = {
                    exists: () => false
                };

                (doc as any).mockReturnValue('course-doc');
                (getDoc as any).mockResolvedValue(mockDocSnap);

                const result = await firestoreService.getCourseById('non-existent');

                expect(result).toBeNull();
            });
        });

        describe('createCourse', () => {
            it('should create a new course', async () => {
                const courseData = {
                    name: 'New Course',
                    description: 'New Description',
                    units: [],
                    settings: { unlockLessonIndex: 0, token: 'new-token' },
                    groupIds: {},
                    isPublic: true
                };

                const mockDocRef = { id: 'new-course-id' };
                (collection as any).mockReturnValue('courses-collection');
                (addDoc as any).mockResolvedValue(mockDocRef);

                const result = await firestoreService.createCourse(courseData);

                expect(collection).toHaveBeenCalledWith(expect.anything(), 'courses');
                expect(addDoc).toHaveBeenCalledWith('courses-collection', courseData);
                expect(result).toBe('new-course-id');
            });

            it('should handle timeout error', async () => {
                (collection as any).mockReturnValue('courses-collection');
                (addDoc as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 11000)));

                await expect(firestoreService.createCourse({} as any))
                    .rejects
                    .toThrow('Operation timed out');
            }, 15000);
        });

        describe('updateCourse', () => {
            it('should update course', async () => {
                const courseId = 'course1';
                const updateData = { name: 'Updated Course' };

                (doc as any).mockReturnValue('course-doc');
                (updateDoc as any).mockResolvedValue(undefined);

                await firestoreService.updateCourse(courseId, updateData);

                expect(doc).toHaveBeenCalledWith(expect.anything(), 'courses', courseId);
                expect(updateDoc).toHaveBeenCalledWith('course-doc', updateData);
            });
        });

        describe('deleteCourse', () => {
            it('should delete course', async () => {
                const courseId = 'course1';

                (doc as any).mockReturnValue('course-doc');
                (deleteDoc as any).mockResolvedValue(undefined);

                await firestoreService.deleteCourse(courseId);

                expect(doc).toHaveBeenCalledWith(expect.anything(), 'courses', courseId);
                expect(deleteDoc).toHaveBeenCalledWith('course-doc');
            });
        });
    });

    describe('Unit Operations', () => {
        const mockUnit = {
            id: 'unit1',
            name: 'Test Unit',
            description: 'Test Unit Description',
            order: 1,
            lessons: [],
            courseId: 'course1'
        };

        describe('getUnitById', () => {
            it('should return unit by id', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    id: 'unit1',
                    data: () => ({
                        name: 'Test Unit',
                        description: 'Test Unit Description',
                        order: 1,
                        lessons: [],
                        courseId: 'course1'
                    })
                };

                (doc as any).mockReturnValue('unit-doc');
                (getDoc as any).mockResolvedValue(mockDocSnap);

                const result = await firestoreService.getUnitById('unit1');

                expect(doc).toHaveBeenCalledWith(expect.anything(), 'units', 'unit1');
                expect(getDoc).toHaveBeenCalledWith('unit-doc');
                expect(result).toEqual(mockUnit);
            });
        });

        describe('createUnit', () => {
            it('should create a new unit', async () => {
                (doc as any).mockReturnValue('unit-doc');
                (setDoc as any).mockResolvedValue(undefined);

                await firestoreService.createUnit('unit1', mockUnit);

                expect(doc).toHaveBeenCalledWith(expect.anything(), 'units', 'unit1');
                expect(setDoc).toHaveBeenCalledWith('unit-doc', mockUnit);
            });
        });
    });

    describe('Lesson Operations', () => {
        const mockLesson = {
            id: 'lesson1',
            name: 'Test Lesson',
            content: 'Test Content',
            unitId: 'unit1',
            order: 1,
            quizId: null,
            'video-title': undefined,
            'video-url': undefined
        };

        describe('getLessonById', () => {
            it('should return lesson by id', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    id: 'lesson1',
                    data: () => ({
                        name: 'Test Lesson',
                        content: 'Test Content',
                        unitId: 'unit1',
                        order: 1,
                        quizId: null,
                        'video-title': undefined,
                        'video-url': undefined
                    })
                };

                (doc as any).mockReturnValue('lesson-doc');
                (getDoc as any).mockResolvedValue(mockDocSnap);

                const result = await firestoreService.getLessonById('lesson1');

                expect(doc).toHaveBeenCalledWith(expect.anything(), 'lessons', 'lesson1');
                expect(getDoc).toHaveBeenCalledWith('lesson-doc');
                expect(result).toEqual(mockLesson);
            });
        });
    });

    describe('Quiz Operations', () => {
        const mockQuiz = {
            id: 'quiz1',
            questions: [{
                id: 'q1',
                text: 'Test Question',
                type: 'single_choice' as 'single_choice',
                options: [
                    { text: 'A', isCorrect: true },
                    { text: 'B', isCorrect: false },
                    { text: 'C', isCorrect: false }
                ]
            }]
        };

        describe('saveQuiz', () => {
            it('should create a new quiz', async () => {
                const quizData = { questions: mockQuiz.questions };
                const mockDocRef = { id: 'new-quiz-id' };

                (collection as any).mockReturnValue('quizzes-collection');
                (addDoc as any).mockResolvedValue(mockDocRef);

                const result = await firestoreService.saveQuiz(quizData);

                expect(collection).toHaveBeenCalledWith(expect.anything(), 'quizzes');
                expect(addDoc).toHaveBeenCalledWith('quizzes-collection', quizData);
                expect(result).toBe('new-quiz-id');
            });

            it('should update existing quiz', async () => {
                const quizData = { id: 'quiz1', questions: mockQuiz.questions };
                const mockDocSnap = { exists: () => true };

                (doc as any).mockReturnValue('quiz-doc');
                (getDoc as any).mockResolvedValue(mockDocSnap);
                (updateDoc as any).mockResolvedValue(undefined);

                const result = await firestoreService.saveQuiz(quizData);

                expect(doc).toHaveBeenCalledWith(expect.anything(), 'quizzes', 'quiz1');
                expect(updateDoc).toHaveBeenCalledWith('quiz-doc', { questions: quizData.questions });
                expect(result).toBe('quiz1');
            });
        });
    });

    describe('User Operations', () => {
        const mockUser = {
            id: 'user1',
            email: 'test@example.com',
            displayName: 'Test User',
            progress: {},
            registeredCourses: {}
        };

        describe('getUserById', () => {
            it('should return user by id', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    id: 'user1',
                    data: () => ({
                        email: 'test@example.com',
                        displayName: 'Test User',
                        progress: {},
                        registeredCourses: {}
                    })
                };

                (doc as any).mockReturnValue('user-doc');
                (getDoc as any).mockResolvedValue(mockDocSnap);

                const result = await firestoreService.getUserById('user1');

                expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user1');
                expect(getDoc).toHaveBeenCalledWith('user-doc');
                expect(result).toEqual(mockUser);
            });
        });

        describe('updateUserProgress', () => {
            it('should update user progress', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    id: 'user1',
                    data: () => ({ progress: {} })
                };

                (doc as any).mockReturnValue('user-doc');
                (getDoc as any).mockResolvedValue(mockDocSnap);
                (updateDoc as any).mockResolvedValue(undefined);

                await firestoreService.updateUserProgress(
                    'user1',
                    'course1',
                    'lesson1',
                    true,
                    '2023-01-01',
                    'Test Lesson'
                );

                expect(updateDoc).toHaveBeenCalledWith('user-doc', {
                    progress: {
                        course1: {
                            lesson1: {
                                completed: true,
                                completedAt: '2023-01-01',
                                lessonName: 'Test Lesson'
                            }
                        }
                    }
                });
            });
        });
    });
});