# System Patterns

## Architecture Overview
The system follows a modern web application architecture with:
- React-based frontend
- Firebase/Firestore backend
- PWA capabilities
- Component-based structure

## Core Patterns

### Data Architecture
1. Hierarchical Course Structure
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

### Service Layer
1. Authentication Service
   - Firebase Auth integration
   - Role-based access control
   - Session management

2. Data Services
   - Firestore integration
   - Optimized batch operations
   - Efficient data loading patterns:
     ```typescript
     // Example of efficient data loading
     async function loadCourseData(courseId: string, page: number) {
       // Get course with minimal unit data
       const course = await getCourse(courseId);
       
       // Batch load visible units
       const unitsPerPage = 20;
       const startIndex = page * unitsPerPage;
       const visibleUnits = course.units.slice(startIndex, startIndex + unitsPerPage);
       
       // Single batch request for visible units
       const unitDetails = await batchGetUnits(visibleUnits.map(u => u.id));
       
       return {
         course,
         units: unitDetails
       };
     }
     ```

3. Analytics Service
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
   - Cache loaded units in memory
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
   - Smart data caching
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
