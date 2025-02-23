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
   Course
   └── Unit
       └── Lesson
           ├── Content (markdown/video)
           └── Quiz (optional)
   ```

2. Data Models
   - Courses: Top-level container with units
   - Units: Organizational structure within courses
   - Lessons: Content delivery units (moving away from Course-level lesson names)
   - Quizzes: Assessment components
   - Groups: Collaborative learning units
   - User Profiles: Progress and preferences
   - Grades: Performance tracking

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
   - CRUD operations
   - Real-time updates
   - Optimized data loading for large courses

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

2. Testing Strategy
   - Unit tests with Vitest
   - Component testing
   - Service mocking
   - Interface testing

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
   - Lazy loading
   - Code splitting
   - PWA caching
   - Optimized data structures for large courses

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
   - Interface testing

3. Error Handling
   - Consistent error patterns
   - User feedback
   - Error boundaries

4. UI/UX Patterns
   - Mobile-first design
   - Context-appropriate actions
   - Dark mode compatibility
   - Responsive layouts
