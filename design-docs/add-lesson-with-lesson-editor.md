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

4. This approach ensures:
   - No database write until the user confirms
   - All lesson properties can be edited before creation
   - Clear UI distinction between editing and creating
   - Simplified interface when adding a new lesson (no Quiz option)

The user can always add a quiz later after creating the lesson, which keeps the initial creation process simpler and more focused.
