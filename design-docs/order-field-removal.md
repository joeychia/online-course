# Design Document: Order Field Removal

## 1. Overview

This document outlines the plan to remove the `order` fields from various data structures in the online course platform. Instead of explicit order fields, we'll use array indices to determine the order of elements.

## 2. Background and Motivation

Currently, the application uses explicit `order` number fields in several interfaces:
- CourseUnit
- Unit
- UnitLesson
- Lesson

This creates redundancy since the array position already implicitly defines the order. Removing these fields will:
- Simplify the data model
- Reduce data redundancy
- Make the code more maintainable
- Reduce database document size

## 3. Current Implementation

The current implementation uses explicit `order` fields in multiple interfaces:

```typescript
// In src/types.ts
export interface CourseUnit {
  id: string;
  name: string;
  order: number; // Explicit order field
  lessonCount: number;
  openDate?: string;
}

export interface Unit {
  id: string;
  courseId: string;
  name: string;
  description: string;
  order: number; // Explicit order field
  lessons: UnitLesson[];
}

export interface UnitLesson {
  id: string;
  name: string;
  order: number; // Explicit order field
  hasQuiz: boolean;
}

export interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  order: number; // Explicit order field
  "video-title"?: string;
  "video-url"?: string;
  quizId: string | null;
}
```

These order fields are used in various operations:
- When creating new units/lessons
- When reordering units/lessons
- When mapping data from Firestore

## 4. Proposed Changes

### 4.1 Interface Changes

Remove the `order` field from all affected interfaces in `src/types.ts`:

```typescript
// Updated interfaces
export interface CourseUnit {
  id: string;
  name: string;
  // order field removed
  lessonCount: number;
  openDate?: string;
}

export interface Unit {
  id: string;
  courseId: string;
  name: string;
  description: string;
  // order field removed
  lessons: UnitLesson[];
}

export interface UnitLesson {
  id: string;
  name: string;
  // order field removed
  hasQuiz: boolean;
}

export interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  // order field removed
  "video-title"?: string;
  "video-url"?: string;
  quizId: string | null;
}
```

### 4.2 FirestoreService Changes

#### 4.2.1 Remove `migrateCourseLessonData` Method

This method is not used anywhere in the codebase and can be safely removed.

#### 4.2.2 Update `mapToCourse` Method

```typescript
// BEFORE
private async mapToCourse(id: string, data: DocumentData): Promise<Course> {
    const units = await Promise.all(
        (data.units as Array<CourseUnit>).map(async (unit, index) => {
            const lessonCount = unit.lessonCount ?? await this.getUnitLessonsCount(unit.id);
            const order = unit.order ?? index;

            return {
                ...unit,
                order,
                lessonCount
            };
        })
    );
    // ...rest of method
}

// AFTER
private async mapToCourse(id: string, data: DocumentData): Promise<Course> {
    const units = await Promise.all(
        (data.units as Array<CourseUnit>).map(async (unit, index) => {
            const lessonCount = unit.lessonCount ?? await this.getUnitLessonsCount(unit.id);
            
            // Omit the order field
            const { order, ...unitWithoutOrder } = unit;
            
            return {
                ...unitWithoutOrder,
                lessonCount
            };
        })
    );
    // ...rest of method
}
```

#### 4.2.3 Update `getUnitById` Method

```typescript
// BEFORE
async getUnitById(unitId: string): Promise<Unit | null> {
    // ...existing code
    const unit: Unit = {
        id: docSnap.id,
        courseId: data.courseId as string,
        name: data.name as string,
        description: data.description as string,
        order: data.order as number,
        lessons: (data.lessons as Array<{ id: string; name: string; order: number; quizId?: string | null }>).map((lesson, index) => ({
            id: lesson.id,
            name: lesson.name,
            order: typeof lesson.order === 'number' ? lesson.order : index,
            hasQuiz: !!lesson.quizId
        }))
    };
    // ...rest of method
}

// AFTER
async getUnitById(unitId: string): Promise<Unit | null> {
    // ...existing code
    const unit: Unit = {
        id: docSnap.id,
        courseId: data.courseId as string,
        name: data.name as string,
        description: data.description as string,
        // order field removed
        lessons: (data.lessons as Array<{ id: string; name: string; order?: number; quizId?: string | null }>).map((lesson) => {
            // Omit the order field
            const { order, ...lessonWithoutOrder } = lesson;
            
            return {
                ...lessonWithoutOrder,
                id: lesson.id,
                name: lesson.name,
                hasQuiz: !!lesson.quizId
            };
        })
    };
    // ...rest of method
}
```

### 4.3 Unit Operations Changes

#### 4.3.1 Update `addUnit` Method in `useUnitOperations.ts`

```typescript
// BEFORE
const addUnit = useCallback(async (name: string) => {
    // ...existing code
    const newOrder = course.units.length;
    
    // Create unit document data
    const unitData = {
        id: newUnitId,
        name: name.trim(),
        description: '',
        lessons: [],
        courseId,
        order: newOrder
    };
    // ...rest of method
    
    // Create minimal unit data for course update
    const newCourseUnit = {
        id: newUnitId,
        name: name.trim(),
        order: newOrder,
        lessonCount: 0
    };
    // ...rest of method
}, [course, courseId, reloadCourse]);

// AFTER
const addUnit = useCallback(async (name: string) => {
    // ...existing code
    
    // Create unit document data
    const unitData = {
        id: newUnitId,
        name: name.trim(),
        description: '',
        lessons: [],
        courseId
        // order field removed
    };
    // ...rest of method
    
    // Create minimal unit data for course update
    const newCourseUnit = {
        id: newUnitId,
        name: name.trim(),
        // order field removed
        lessonCount: 0
    };
    // ...rest of method
}, [course, courseId, reloadCourse]);
```

#### 4.3.2 Update `reorderUnits` Method in `useUnitOperations.ts`

```typescript
// BEFORE
const reorderUnits = useCallback(async (sourceIndex: number, destinationIndex: number) => {
    // ...existing code
    
    // Update order for all affected units
    const updatedUnits = newUnits.map((unit, index) => ({
        ...unit,
        order: index
    }));

    // Update course with new unit order
    await firestoreService.updateCourse(courseId, { units: updatedUnits });
    
    // Update individual unit documents
    await Promise.all(
        updatedUnits.map(unit => {
            return firestoreService.updateUnit(unit.id, { order: unit.order });
        })
    );
    // ...rest of method
}, [course, courseId, reloadCourse]);

// AFTER
const reorderUnits = useCallback(async (sourceIndex: number, destinationIndex: number) => {
    // ...existing code
    
    // No need to update order field, just reorder the array
    const updatedUnits = newUnits;

    // Update course with new unit order
    await firestoreService.updateCourse(courseId, { units: updatedUnits });
    
    // No need to update individual unit documents with order
    
    // ...rest of method
}, [course, courseId, reloadCourse]);
```

### 4.4 Lesson Operations Changes

#### 4.4.1 Update `addLesson` Method in `useLessonOperations.ts`

```typescript
// BEFORE
const addLesson = useCallback(async (unitId: string, name: string) => {
    // ...existing code
    const newOrder = unit.lessons.length;

    await firestoreService.createLesson(newLessonId, {
        id: newLessonId,
        name: name.trim(),
        content: '',
        unitId,
        quizId: null,
        order: newOrder
    });

    const newLesson: UnitLesson = {
        id: newLessonId,
        name: name.trim(),
        order: newOrder,
        hasQuiz: false
    };
    // ...rest of method
}, [course, reloadCourse]);

// AFTER
const addLesson = useCallback(async (unitId: string, name: string) => {
    // ...existing code

    await firestoreService.createLesson(newLessonId, {
        id: newLessonId,
        name: name.trim(),
        content: '',
        unitId,
        quizId: null
        // order field removed
    });

    const newLesson: UnitLesson = {
        id: newLessonId,
        name: name.trim(),
        // order field removed
        hasQuiz: false
    };
    // ...rest of method
}, [course, reloadCourse]);
```

#### 4.4.2 Update `deleteLesson` Method in `useLessonOperations.ts`

```typescript
// BEFORE
const deleteLesson = useCallback(async (unitId: string, lessonId: string) => {
    // ...existing code
    const updatedLessons: UnitLesson[] = unit.lessons
        .filter((lesson: UnitLesson) => lesson.id !== lessonId)
        .map((lesson: UnitLesson, index: number) => ({ ...lesson, order: index }));
    // ...rest of method
}, [course, reloadCourse]);

// AFTER
const deleteLesson = useCallback(async (unitId: string, lessonId: string) => {
    // ...existing code
    const updatedLessons: UnitLesson[] = unit.lessons
        .filter((lesson: UnitLesson) => lesson.id !== lessonId);
    // No need to update order field
    // ...rest of method
}, [course, reloadCourse]);
```

#### 4.4.3 Update `reorderLessons` Method in `useLessonOperations.ts`

```typescript
// BEFORE
const reorderLessons = useCallback(async (
    unitId: string,
    sourceIndex: number,
    destinationIndex: number
) => {
    // ...existing code
    
    // Update order for all affected lessons
    const updatedLessons = newLessons.map((lesson, index) => ({
        ...lesson,
        order: index
    }));
    // ...rest of method
}, [course, reloadCourse]);

// AFTER
const reorderLessons = useCallback(async (
    unitId: string,
    sourceIndex: number,
    destinationIndex: number
) => {
    // ...existing code
    
    // No need to update order field, just reorder the array
    const updatedLessons = newLessons;
    // ...rest of method
}, [course, reloadCourse]);
```

## 5. Testing Strategy

### 5.1 Update Test Fixtures

All test fixtures that include `order` fields need to be updated to remove these fields:

```typescript
// BEFORE
const mockCourse = {
  id: 'course1',
  name: 'Test Course',
  description: 'Test Description',
  units: [
    { id: 'unit1', name: 'Unit 1', order: 0, lessonCount: 2 },
    { id: 'unit2', name: 'Unit 2', order: 1, lessonCount: 1 }
  ],
  // ...other properties
};

// AFTER
const mockCourse = {
  id: 'course1',
  name: 'Test Course',
  description: 'Test Description',
  units: [
    { id: 'unit1', name: 'Unit 1', lessonCount: 2 },
    { id: 'unit2', name: 'Unit 2', lessonCount: 1 }
  ],
  // ...other properties
};
```

### 5.2 Test Cases to Verify

1. Course loading preserves unit order
2. Unit loading preserves lesson order
3. Reordering units works correctly
4. Reordering lessons works correctly
5. Adding new units/lessons places them at the end of the array
6. Deleting units/lessons maintains the order of remaining items

## 6. Implementation Progress Tracking

| Task | Status | Dependencies | Notes |
|------|--------|--------------|-------|
| Remove order field from interfaces in types.ts | Not Started | None | |
| Remove migrateCourseLessonData method | Not Started | None | |
| Update mapToCourse method | Not Started | Interface changes | |
| Update getUnitById method | Not Started | Interface changes | |
| Update addUnit method | Not Started | Interface changes | |
| Update reorderUnits method | Not Started | Interface changes | |
| Update addLesson method | Not Started | Interface changes | |
| Update deleteLesson method | Not Started | Interface changes | |
| Update reorderLessons method | Not Started | Interface changes | |
| Update test fixtures | Not Started | Interface changes | |
| Run tests to verify functionality | Not Started | All implementation tasks | |

## 7. Risks and Mitigations

### 7.1 Risks

1. **Data Consistency**: Existing data in Firestore may rely on order fields
   - **Mitigation**: Since the website is not in production, we can ignore backward compatibility

2. **Sorting Behavior**: Array indices might not preserve the intended order in all cases
   - **Mitigation**: Ensure all array manipulations maintain the correct order

3. **Test Coverage**: Some edge cases might not be covered by existing tests
   - **Mitigation**: Add specific tests for ordering behavior

## 8. Conclusion

Removing the `order` fields from our data structures will simplify our codebase and make it more maintainable. Since the website is not in production yet, this is an ideal time to make this change. The implementation is straightforward and primarily involves removing fields and simplifying the code that manipulates arrays.

Once implemented, we should verify that all ordering functionality works correctly through manual testing and automated tests.
