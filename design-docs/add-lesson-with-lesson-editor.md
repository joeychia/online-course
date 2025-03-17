# Lesson Editor Improvement

## Current Flow
1. User clicks "Add Lesson" in a unit
2. A dialog opens asking ONLY for the lesson name
3. After saving, the lesson is created with just the name
4. User must then click on the lesson separately to open the full lesson editor

## Requested Change
Skip the initial "name only" dialog and go directly to the full lesson editor when creating a new lesson, with a default title like "New Lesson" that the user can change along with all other lesson properties.

## Implementation Plan

1. Create a new mode for the LessonEditor:
   - Add an "isNewLesson" prop to distinguish between editing and creating
   - When in "new lesson" mode:
     - Show "New Lesson" as the default title
     - Change the "Save" button text to "Add"
     - Hide the "Add Quiz" button/section completely
     - Don't save to database until the user clicks "Add"

2. Modify the CourseEditor.tsx flow:
   - When "Add Lesson" is clicked, open LessonEditor in "new lesson" mode
   - Pass a temporary lesson object with default values
   - No database write occurs at this point

3. Update the LessonEditor.tsx component:
   - Handle the "isNewLesson" prop
   - Modify the save function to either:
     - Create a new lesson (if isNewLesson=true)
     - Update an existing lesson (current behavior)
   - Change dialog title to "Add New Lesson" instead of "Edit Lesson" when in creation mode
   - Change button text from "Save" to "Add" when in creation mode
   - Conditionally render the Quiz section based on isNewLesson

## Bug Fix: Lesson Count Not Updating

After implementing the initial solution, we discovered that the lesson count displayed in the unit header wasn't being updated when adding a new lesson through the LessonEditor. This is because:

1. In the original flow, the `addLesson` function in `useLessonOperations.ts` handled updating the lesson count in the course document
2. In our new flow, the `handleSave` function in `LessonEditor.tsx` creates the lesson but doesn't update the lesson count

### Solution

Instead of duplicating the lesson count update logic in the LessonEditor component, we'll leverage the existing `addLesson` function from useLessonOperations:

1. Pass the `addLesson` function to LessonEditor:
   - Add an `onAddLesson` prop to LessonEditor
   - Pass the function from CourseEditor when opening LessonEditor in creation mode

2. Update the handleSave function in LessonEditor:
   - When `isNewLesson` is true, call the `onAddLesson` function instead of directly creating the lesson
   - Pass all necessary lesson data (name, content, video fields, etc.)
   - Keep the existing code for updating lessons

3. Modify the addLesson function in useLessonOperations:
   - Update it to accept additional parameters for lesson content and other fields
   - Or accept a complete lesson object instead of just name

This approach ensures:
- Reuse of existing code that already works correctly
- Proper updating of the lesson count
- Consistent behavior between the old and new flows
- No database write until the user confirms
- All lesson properties can be edited before creation
- Clear UI distinction between editing and creating
- Simplified interface when adding a new lesson (no Quiz option)

The user can always add a quiz later after creating the lesson, which keeps the initial creation process simpler and more focused.
