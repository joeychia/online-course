# System Patterns

[Previous sections remain unchanged until Hierarchical Course Structure...]

4. Hierarchical Course Structure
   ```
   Course
   └── Unit (ordered by array position)
       └── Lesson (ordered by array position)
           ├── Content (markdown/video)
           ├── Notes (with courseId/unitName)
           └── Quiz (optional)
   ```

5. Data Models
   - Courses: Container with units (ordered by array position), settings (unlockLessonIndex, token, enableNote)
   - Units: Array-ordered structure with lesson references
   - Lessons: Array-ordered content units with video and quiz support
     * Order handling: Uses array position for consistent ordering
     * Simple and intuitive ordering system
   - Quizzes: Assessment components (single_choice, free_form)
   - Groups: Collaborative learning units
   - User Profiles: Progress, notes, quiz history, and timestamps
   - Grades: Performance tracking
   - Notes: Enhanced with course and unit context

### Database Access Patterns
1. Array-Based Ordering
   ```typescript
   // Pattern: Array Position Ordering
   // Units and lessons are ordered by their position in arrays
   
   interface OrderedItems<T> {
     items: T[];
     
     reorder(sourceIndex: number, destinationIndex: number) {
       const newItems = Array.from(this.items);
       const [removed] = newItems.splice(sourceIndex, 1);
       newItems.splice(destinationIndex, 0, removed);
       return newItems;
     }
   }
   
   // Implementation in firestoreService:
   const reorderUnits = async (courseId: string, sourceIndex: number, destinationIndex: number) => {
     const course = await getCourseById(courseId);
     if (!course) return;
     
     const newUnits = Array.from(course.units);
     const [removed] = newUnits.splice(sourceIndex, 1);
     newUnits.splice(destinationIndex, 0, removed);
     
     await updateCourse(courseId, { units: newUnits });
   };
   ```
   
   Key patterns:
   - Use array indices for natural ordering
   - Simple array manipulation for reordering
   - No need for explicit order fields
   - Consistent ordering across the system

2. Lazy Loading
   - Load minimal course data initially
   - Fetch unit details on demand
   - Load lessons when unit expanded
   - Direct database queries

3. Query Optimization
   - Store minimal unit data in course document
   - Keep full lesson data in unit documents
   - Load only what's needed, when needed
   - Leverage Firestore query efficiency

4. Data Structure
   ```typescript
   // Course document - minimal unit data
   interface Course {
     id: string;
     units: Array<{
       id: string;
       name: string;
       lessonCount: number;
     }>;
   }

   // Unit document - full lesson data, loaded on demand
   interface Unit {
     id: string;
     name: string;
     lessons: Array<{
       id: string;
       name: string;
       hasQuiz: boolean;
     }>;
   }
   ```

[Previous sections remain unchanged until Service Layer Architecture...]

### Service Layer Architecture
1. Firestore Service
   - Single point of entry for all database operations
   - Direct Firestore interactions
   - Clear and consistent API
   - Example structure:
     ```typescript
     class FirestoreService {
       // Course operations
       async getCourseById(id: string): Promise<Course | null>;
       async createCourse(courseData: Omit<Course, 'id'>): Promise<string>;
       async updateCourse(id: string, data: Partial<Course>): Promise<void>;
       async deleteCourse(id: string): Promise<void>;

       // Unit operations with array-based ordering
       async getUnitById(id: string): Promise<Unit | null>;
       async createUnit(unitData: Omit<Unit, 'id'>): Promise<string>;
       async updateUnit(id: string, data: Partial<Unit>): Promise<void>;
       async deleteUnit(id: string): Promise<void>;
       async reorderUnits(courseId: string, sourceIndex: number, destinationIndex: number): Promise<void>;

       // Lesson operations with array-based ordering
       async getLessonById(id: string): Promise<Lesson | null>;
       async createLesson(lessonData: Omit<Lesson, 'id'>): Promise<string>;
       async updateLesson(id: string, data: Partial<Lesson>): Promise<void>;
       async deleteLesson(id: string): Promise<void>;
       async reorderLessons(unitId: string, sourceIndex: number, destinationIndex: number): Promise<void>;
     }
     ```

[Rest of the file remains unchanged...]
