# System Patterns

## Architecture Overview
The system follows a modern web application architecture with:
- React-based frontend
- Firebase/Firestore backend
- PWA capabilities
- Component-based structure

## Core Patterns

### Data Architecture
1. View Synchronization
   ```typescript
   // Pattern: Component State Synchronization
   // When data is updated in one view, ensure all affected views are refreshed:
   
   // 1. CourseEditor updates course
   await updateCourse(courseId, { name: newName });
   await reloadCourse(); // Refresh editor view
   
   // 2. CourseManagement listens for changes
   useEffect(() => {
     loadCourses(); // Reload course list
   }, [selectedCourseId]); // Trigger on editor exit
   ```
   
   Key patterns:
   - Components listen for relevant state changes
   - Reload data when returning to list views
   - Maintain consistency across different views
   - Clear stale data on navigation

2. Data Synchronization
   ```typescript
   // Pattern: Dual-Document Update with Cache Invalidation
   // When updating data that exists in multiple documents (e.g., lesson names),
   // we must update all references and handle cache invalidation:
   
   // 1. Update primary document
   await updateLesson(lessonId, { name: newName });
   
   // 2. Update references in parent documents
   const unit = await getUnit(unitId);
   const updatedLessons = unit.lessons.map(lesson =>
     lesson.id === lessonId ? { ...lesson, name: newName } : lesson
   );
   await updateUnit(unitId, { lessons: updatedLessons });
   
   // 3. Force cache refresh with forceReload parameter
   await reloadCourse(true);
   await loadUnitDetails(unitId, true);
   ```
   
   Key patterns:
   - Maintain data consistency across documents
   - Clear caches after updates
   - Force reload of affected data
   - Immediate UI updates with fresh data

2. Lesson Count Management
   ```typescript
   // Course level - minimal unit data with count
   interface CourseUnit {
     id: string;
     name: string;
     order: number;
     lessonCount: number;  // Maintained at course level
   }

   // Unit level - full lesson data
   interface Unit {
     id: string;
     lessons: Array<{
       id: string;
       name: string;
       order: number;
     }>;
   }
   ```

   Key patterns:
   - Course document maintains lesson counts for quick access
   - Unit document contains full lesson data
   - Counts synchronized during:
     * Initial data fetch
     * Lesson addition/deletion
     * Unit data updates
   - Automatic count updates in CourseDataAccess

2. Hierarchical Course Structure
   ```
   Course (with order)
   └── Unit (with order)
       └── Lesson (with order)
           ├── Content (markdown/video)
           ├── Notes (with courseId/unitName)
           └── Quiz (optional)
   ```

2. Data Models
   - Courses: Container with ordered units, settings (unlockLessonIndex, token, enableNote)
   - Units: Ordered structure with lesson references
   - Lessons: Ordered content units with video and quiz support
   - Quizzes: Assessment components (single_choice, free_form)
   - Groups: Collaborative learning units
   - User Profiles: Progress, notes, quiz history, and timestamps
   - Grades: Performance tracking
   - Notes: Enhanced with course and unit context

3. Key Model Features
   - Ordered content structure (courses, units, lessons)
   - Enhanced settings control (token, note requirements)
   - Contextual note-taking (course, unit, lesson context)
   - Comprehensive user tracking (progress, history, timestamps)
   - Flexible quiz system
   - Group-based access control

### Database Access Patterns
1. Lazy Loading
   - Load minimal course data initially
   - Fetch unit details on demand
   - Load lessons when unit expanded
   - Cache loaded unit data

2. Query Optimization
   - Store minimal unit data in course document
   - Keep full lesson data in unit documents
   - Load only what's needed, when needed
   - Leverage Firestore query efficiency

3. Data Structure
   ```typescript
   // Course document - minimal unit data
   interface Course {
     id: string;
     units: Array<{
       id: string;
       name: string;
       order: number;
     }>;
   }

   // Unit document - full lesson data, loaded on demand
   interface Unit {
     id: string;
     name: string;
     order: number;
     lessons: Array<{
       id: string;
       name: string;
       order: number;
       hasQuiz: boolean;
     }>;
   }
   ```

### Component Architecture
1. Layout Patterns
   - Responsive design with mobile-first approach
   - Component hierarchy
   - Reusable UI elements
   - Dark mode compatible components

2. Admin Interface Patterns
   - List/Detail separation
     - Simplified list view with clickable cards
     - Detailed editor view with all actions
   - Mobile-responsive action buttons
     - Full buttons on desktop
     - Icon-only on mobile
   - Context-appropriate action placement
   - Consistent dark mode contrast

3. State Management
   - Context-based state (Auth, Theme, Language, FontSize)
   - Custom hooks for business logic
   - Service layer for data operations

### Service Layer Architecture
1. Data Access Layer (services/dataAccess/)
   - CourseDataAccess: Handles course-specific Firestore operations
   - UnitDataAccess: Direct unit and lesson data operations
   - Clear separation of database interactions
   - Focused responsibility per module

2. Service Layer (services/)
   - firestoreService: Orchestrates data access operations
   - Delegates to appropriate data access modules
   - Handles business logic
   - Example structure:
     ```typescript
     // Data Access Layer
     class CourseDataAccess {
       async getCourseById(id: string): Promise<Course | null>;
       async createCourse(courseData: Omit<Course, 'id'>): Promise<string>;
       // ... other course operations
     }

     class UnitDataAccess {
       async getUnitWithLessons(unitId: string): Promise<Unit | null>;
       // ... other unit operations
     }

     // Service Layer
     class FirestoreService {
       // Delegates to CourseDataAccess
       async getCourseById(id: string) {
         return courseDataAccess.getCourseById(id);
       }

       // Delegates to UnitDataAccess
       async getUnitWithLessons(unitId: string) {
         return unitDataAccess.getUnitWithLessons(unitId);
       }
     }
     ```

3. API Layer (services/dataService)
   - Public interface for components
   - Abstracts service layer complexity
   - Provides consistent API surface
   - Example:
     ```typescript
     // API Layer
     export const getCourse = async (courseId: string) => {
       return await firestoreService.getCourseById(courseId);
     };
     ```

4. Authentication Service
   - Firebase Auth integration
   - Role-based access control
   - Session management

5. Analytics Service
   - User behavior tracking
   - Progress monitoring
   - Performance metrics

## Implementation Patterns

### Frontend Patterns
1. Component Organization
   ```
   src/
   ├── components/
   │   ├── admin/    (Admin-specific components)
   │   └── common/   (Shared components)
   ├── contexts/     (State management)
   ├── hooks/        (Custom hooks)
   ├── pages/        (Route components)
   ├── services/     (API/backend services)
   └── utils/        (Helper functions)
   ```

2. Data Loading
   - Lazy load unit details on expansion
   - Direct Firestore queries
   - Clear loading states for feedback
   - Simple and intuitive loading pattern

3. Testing Strategy
   - Unit tests with Vitest
   - Component testing
   - Service mocking
   - Performance testing

### Security Patterns
1. Authentication
   - Firebase Auth integration
   - Protected routes
   - Role-based access

2. Data Access
   - Firestore security rules
   - User permissions
   - Data validation

### Performance Patterns
1. Loading Optimization
   - Lazy loading for units
   - On-demand lesson loading
   - Direct database queries
   - Minimal initial payload

2. State Management
   - Context optimization
   - Memoization
   - Efficient re-renders

## Development Patterns
1. Code Organization
   - Feature-based structure
   - Shared components
   - Clear separation of concerns

2. Testing Approach
   - Component isolation
   - Service mocking
   - Integration testing
   - Performance testing

3. Error Handling
   - Consistent error patterns
   - User feedback
   - Error boundaries

4. UI/UX Patterns
   - Mobile-first design
   - Context-appropriate actions
   - Dark mode compatibility
   - Responsive layouts
