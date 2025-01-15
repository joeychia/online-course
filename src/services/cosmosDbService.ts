import { CosmosClient, Container, Database, ItemDefinition, Resource } from "@azure/cosmos";
import { Course, Unit, Lesson, Quiz, Group, Grade, Note, User, UserProgress } from "../types/database";

type WithId<T> = T & { id: string };

class CosmosDbService {
    private client: CosmosClient;
    private database: Database;
    private containers: Map<string, Container>;
    private initialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {
        const connectionString = import.meta.env.VITE_COSMOS_DB_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error("Cosmos DB connection string not found in environment variables");
        }

        this.client = new CosmosClient(connectionString);
        this.database = this.client.database(import.meta.env.VITE_COSMOS_DB_NAME || "online-course-db");
        this.containers = new Map();

        // Initialize containers
        this.initializationPromise = this.initializeContainers();
    }

    private async initializeContainers() {
        if (this.initialized) return;

        const containerNames = ['courses', 'units', 'lessons', 'quizzes', 'groups', 'grades', 'notes', 'users'];
        for (const name of containerNames) {
            this.containers.set(name, this.database.container(name));
        }
        
        this.initialized = true;
    }

    private async ensureInitialized() {
        if (!this.initialized && this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    private getContainer(name: string): Container {
        const container = this.containers.get(name);
        if (!container) {
            throw new Error(`Container ${name} not found`);
        }
        return container;
    }

    // Course operations
    async getAllCourses(): Promise<Course[]> {
        await this.ensureInitialized();
        const container = this.getContainer('courses');
        const { resources } = await container.items.query("SELECT * FROM c").fetchAll();
        return resources as Course[];
    }

    async getCourseById(id: string): Promise<Course | null> {
        return this.getItemById<Course>('courses', id);
    }

    async createCourse(course: Omit<Course, 'id'>): Promise<Course> {
        return this.createItem<Course>('courses', course);
    }

    async updateCourse(id: string, course: Course): Promise<Course> {
        return this.updateItem<Course>('courses', id, course);
    }

    async deleteCourse(id: string): Promise<void> {
        return this.deleteItem('courses', id);
    }

    // Unit operations
    async getUnitsForCourse(courseId: string): Promise<Unit[]> {
        await this.ensureInitialized();
        const container = this.getContainer('units');
        const querySpec = {
            query: "SELECT * FROM c WHERE c.courseId = @courseId",
            parameters: [{ name: "@courseId", value: courseId }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources as Unit[];
    }

    async createUnit(unit: Omit<Unit, 'id'>): Promise<Unit> {
        return this.createItem<Unit>('units', unit);
    }

    async updateUnit(id: string, unit: Unit): Promise<Unit> {
        return this.updateItem<Unit>('units', id, unit);
    }

    async deleteUnit(id: string): Promise<void> {
        return this.deleteItem('units', id);
    }

    // Lesson operations
    async getLessonsForUnit(unitId: string): Promise<Lesson[]> {
        await this.ensureInitialized();
        const container = this.getContainer('lessons');
        const querySpec = {
            query: "SELECT * FROM c WHERE c.unitId = @unitId ORDER BY c.orderIndex",
            parameters: [{ name: "@unitId", value: unitId }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources as Lesson[];
    }

    async createLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson> {
        return this.createItem<Lesson>('lessons', lesson);
    }

    async updateLesson(id: string, lesson: Lesson): Promise<Lesson> {
        return this.updateItem<Lesson>('lessons', id, lesson);
    }

    async deleteLesson(id: string): Promise<void> {
        return this.deleteItem('lessons', id);
    }

    // Quiz operations
    async getQuizById(id: string): Promise<Quiz | null> {
        return this.getItemById<Quiz>('quizzes', id);
    }

    async createQuiz(quiz: Omit<Quiz, 'id'>): Promise<Quiz> {
        return this.createItem<Quiz>('quizzes', quiz);
    }

    async updateQuiz(id: string, quiz: Quiz): Promise<Quiz> {
        return this.updateItem<Quiz>('quizzes', quiz.id, quiz);
    }

    // Group operations
    async getGroupsForCourse(courseId: string): Promise<Group[]> {
        const container = this.getContainer('groups');
        const querySpec = {
            query: "SELECT * FROM c WHERE c.courseId = @courseId",
            parameters: [{ name: "@courseId", value: courseId }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources as Group[];
    }

    async addUserToGroup(groupId: string, userId: string): Promise<void> {
        const group = await this.getItemById<Group>('groups', groupId);
        if (!group) throw new Error('Group not found');

        group.members[userId] = true;
        await this.updateItem('groups', groupId, group);
    }

    async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
        const group = await this.getItemById<Group>('groups', groupId);
        if (!group) throw new Error('Group not found');

        delete group.members[userId];
        await this.updateItem('groups', groupId, group);
    }

    // User operations
    async getUserById(id: string): Promise<User | null> {
        return this.getItemById<User>('users', id);
    }

    async updateUserProgress(userId: string, courseId: string, lessonId: string, completed: boolean): Promise<void> {
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        if (!user.progress[courseId]) {
            user.progress[courseId] = {};
        }
        user.progress[courseId][lessonId] = { completed };

        await this.updateItem('users', userId, user);
    }

    async registerCourse(userId: string, courseId: string): Promise<void> {
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        user.registeredCourses[courseId] = true;
        await this.updateItem('users', userId, user);
    }

    async dropCourse(userId: string, courseId: string): Promise<void> {
        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        delete user.registeredCourses[courseId];
        await this.updateItem('users', userId, user);
    }

    // Note operations
    async getNoteForLesson(lessonId: string, userId: string): Promise<Note | null> {
        await this.ensureInitialized();
        const container = this.getContainer('notes');
        const querySpec = {
            query: "SELECT * FROM c WHERE c.lessonId = @lessonId AND c.userId = @userId",
            parameters: [
                { name: "@lessonId", value: lessonId },
                { name: "@userId", value: userId }
            ]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources[0] as Note || null;
    }

    async saveNote(note: Omit<Note, 'id'>): Promise<Note> {
        return this.createItem<Note>('notes', note);
    }

    async updateNote(id: string, note: Note): Promise<Note> {
        return this.updateItem<Note>('notes', id, note);
    }

    // Grade operations
    async getGradesForCourse(courseId: string): Promise<Grade[]> {
        await this.ensureInitialized();
        const container = this.getContainer('grades');
        const querySpec = {
            query: "SELECT * FROM c WHERE c.courseId = @courseId",
            parameters: [{ name: "@courseId", value: courseId }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources as Grade[];
    }

    async getUserGrade(userId: string, courseId: string): Promise<Grade | null> {
        await this.ensureInitialized();
        const container = this.getContainer('grades');
        const querySpec = {
            query: "SELECT * FROM c WHERE c.courseId = @courseId AND c.userId = @userId",
            parameters: [
                { name: "@courseId", value: courseId },
                { name: "@userId", value: userId }
            ]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources[0] as Grade || null;
    }

    // Generic operations
    async getItemById<T extends ItemDefinition>(containerName: string, id: string): Promise<T | null> {
        await this.ensureInitialized();
        try {
            const container = this.getContainer(containerName);
            const { resource } = await container.item(id).read();
            return resource ? (resource as unknown as T) : null;
        } catch (error) {
            if ((error as any).code === 404) {
                return null;
            }
            throw error;
        }
    }

    private async createItem<T extends ItemDefinition>(containerName: string, item: Omit<T, 'id'>): Promise<T> {
        await this.ensureInitialized();
        const container = this.getContainer(containerName);
        const { resource } = await container.items.create(item);
        return resource as unknown as T;
    }

    private async updateItem<T extends ItemDefinition>(containerName: string, id: string, item: T): Promise<T> {
        await this.ensureInitialized();
        const container = this.getContainer(containerName);
        const { resource } = await container.item(id).replace(item);
        return resource as unknown as T;
    }

    private async deleteItem(containerName: string, id: string): Promise<void> {
        await this.ensureInitialized();
        const container = this.getContainer(containerName);
        await container.item(id).delete();
    }

    // Add specific methods for each entity type
    async getUnitById(id: string): Promise<Unit | null> {
        return this.getItemById<Unit>('units', id);
    }

    async getLessonById(id: string): Promise<Lesson | null> {
        return this.getItemById<Lesson>('lessons', id);
    }
}

export const cosmosDbService = new CosmosDbService(); 