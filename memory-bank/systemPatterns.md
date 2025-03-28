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
       
       // User and progress operations
       async getUserById(id: string): Promise<UserProfile | null>;
       async getRegisteredUsersForCourse(courseId: string): Promise<string[]>;
       async updateUserProgress(userId: string, courseId: string, lessonId: string, completed: boolean, completedAt: string, lessonName: string): Promise<void>;
     }
     ```

2. Student Progress Tracking
   - Calculate completed lessons from user progress data
   - Track completion percentage
   - Monitor student activity
   - Example pattern:
     ```typescript
     // Pattern: Progress calculation from user data
     function calculateCompletedLessons(userProfile: UserProfile, courseId: string): number {
       const courseProgress = userProfile.progress?.[courseId] || {};
       return Object.values(courseProgress).filter(progress => progress.completed).length;
     }
     
     // Pattern: Student data aggregation
     async function getStudentProgressForCourse(courseId: string): Promise<StudentProgress[]> {
       // 1. Get all registered users for the course
       const userIds = await firestoreService.getRegisteredUsersForCourse(courseId);
       
       // 2. Fetch user profiles in parallel
       const userProfiles = await Promise.all(
         userIds.map(userId => firestoreService.getUserById(userId))
       );
       
       // 3. Calculate progress metrics for each user
       return userProfiles
         .filter(profile => profile !== null)
         .map(profile => ({
           userId: profile!.id,
           name: profile!.name,
           email: profile!.email,
           completedLessons: calculateCompletedLessons(profile!, courseId),
           // Additional metrics as needed
         }));
     }
     ```

### UI Component Patterns
1. Shared Component Architecture
   - Reusable components across different views
   - Consistent user experience
   - Reduced code duplication
   - Example structure:
     ```typescript
     interface CourseCardProps {
       course: Course;
       onPrimaryAction: () => void;
       primaryActionText: string;
       language?: 'zh-TW' | 'zh-CN';
       showDescriptionButton?: boolean;
     }
     
     // Used in both admin and user views with different configurations
     const CourseCard: React.FC<CourseCardProps> = ({
       course,
       onPrimaryAction,
       primaryActionText,
       language = 'zh-TW',
       showDescriptionButton = true,
     }) => {
       // Component implementation
     };
     ```
   
   Key patterns:
   - Flexible props to support different use cases
   - Consistent styling across the application
   - Encapsulated functionality (e.g., description dialog)
   - Clear separation of concerns
   - Configurable actions based on context

### Testing Patterns
1. Component Testing
   - Mock external dependencies
   - Test component behavior in isolation
   - Verify UI interactions
   - Example structure:
     ```typescript
     // Mock dependencies
     vi.mock('../services/firestoreService', () => ({
       firestoreService: {
         getRegisteredUsersForCourse: vi.fn(),
         getUserById: vi.fn()
       }
     }));

     // Mock UI components with simplified implementations
     vi.mock('@mui/x-data-grid', () => ({
       DataGrid: ({ rows, ...rest }: any) => (
         <div data-testid="data-grid">
           {rows && rows.length > 0 && rows.map((row: any) => (
             <div key={row.id} data-testid="student-row">
               <span>{row.name}</span>
               <span>{row.email}</span>
               <span>{row.completedLessons}</span>
             </div>
           ))}
         </div>
       ),
       GridPaginationModel: {}
     }));
     ```

2. Test-Specific Component Implementations
   - Create simplified versions of complex components for testing
   - Focus on testable behavior rather than implementation details
   - Example pattern:
     ```typescript
     // Test-specific version of a complex component
     const TestCourseStudentsPage: React.FC<CourseStudentsPageProps> = ({ 
       isAdmin = true, 
       courseId = '123' 
     }) => {
       if (!isAdmin) {
         return <MockNavigate to="/" replace />;
       }

       if (!courseId) {
         return <MockNavigate to="/admin" replace />;
       }

       return (
         <div>
           <div>
             <button>Back</button>
             <h1>Course Students</h1>
           </div>
           <MockCourseStudentsList courseId={courseId} />
         </div>
       );
     };
     ```

3. Mock Context Providers
   - Provide test-specific context values
   - Ensure all required properties are included
   - Example pattern:
     ```typescript
     // Mock auth context with all required properties
     const mockAuthContext = {
       currentUser: mockFirebaseUser,
       userProfile: mockUserProfile,
       loading: false,
       signIn: vi.fn(),
       signOut: vi.fn(),
       signInWithGoogle: vi.fn(),
       signUp: vi.fn(),
       resetPassword: vi.fn(),
       user: mockFirebaseUser,  // Required by AuthContextType
       isAdmin: false           // Required by AuthContextType
     };

     // Render with context provider
     render(
       <AuthContext.Provider value={mockAuthContext}>
         <MemoryRouter>
           <ComponentUnderTest />
         </MemoryRouter>
       </AuthContext.Provider>
     );
     ```

4. Modern API Patterns
   - Use current API versions in components
   - Update deprecated patterns
   - Example pattern:
     ```typescript
     // Modern pagination API for DataGrid
     const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
       page: 0,
       pageSize: 10,
     });

     const handlePaginationModelChange = (newModel: GridPaginationModel) => {
       setPaginationModel(newModel);
     };

     return (
       <DataGrid
         rows={data}
         columns={columns}
         paginationModel={paginationModel}
         onPaginationModelChange={handlePaginationModelChange}
         pageSizeOptions={[10, 25, 50]}
         disableRowSelectionOnClick
       />
     );
     ```

[Rest of the file remains unchanged...]
