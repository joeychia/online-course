# Online course system

## Product Requirements
### For Admin
- User can create/edit/delete a course
- User can create/edit/delete a unit
- User can create/edit/delete a lesson, which can include video, text, image, quiz
- User can create/edit/delete a quiz, where each question can include single_choice, free_form
- User can create/edit/delete a group
- User can manage members in a group
- User can view everyone's grade in a course

### For User
- User can sign up/sign in/sign out
- User can preview a course without sign in - done
- User can view a course - done
- User can view a unit - done
- User can view a lesson - done
- User can view their quiz history for a lesson (complete questions and answers are recorded)
- User can do a quiz for a lesson if any - done
- User can register/drop a course
- User can join/quit a group
- User must put down a note for a lesson in order to complete the lesson - done
- User can open the first lesson of each unit, but locked out from other lessons until the previous lesson is completed - done
- User can view a dashboard of all courses, units, lessons, quizzes, groups, and grades

## Technical Stack

frontend:
  - React
  - TypeScript
  - Material UI
  - Firebase Auth
  - Responsive design
  - PWA support

backend:
  - Firestore

test:
  - vitest

data model:
Courses
```json
"courses": {
  "$courseId": {
    "name": "Course Name",
    "description": "Course Description",
    "settings": {
      "unlockLessonIndex": 1
    },
    "unitIds": {
      "$unitId": true,
      "$unitId2": true
    },
    "groupIds": {
      "$groupId": true,
      "$groupId2": true
    }
    // You might also store top-level stats or metadata here.
  }
}
```
Units
```json
"units": {
  "$unitId": {
    "courseId": "courseId",
    "name": "Unit Name",
    "description": "Unit Description",
    "lessonIds": {
      "$lessonId": true,
      "$lessonId2": true
    }
  }
}
```

Lessons
```json
"lessons": {
  "$lessonId": {
    "unitId": "unitId",
    "name": "Lesson Title",
    "content": "markdown content",
    "video-title": "video title",
    "video-url": "video url",
    "meditation": "meditation markdown content",
    "quizId": "quizIdIfAny", // reference a quiz in quizzes collection
    "orderIndex": 1 // helpful for controlling locked/unlocked lesson progression
  }
}
```
Quizzes
```json
"quizzes": {
  "$quizId": {
    "questions": {
      "$questionId": {
        "type": "single_choice|free_form",
        "text": "Question text",
        "options": {
          "$optionId": {
            "text": "Option text",
            "isCorrect": false
          }
        }
      }
    }
  }
}
```

Groups
```json
"groups": {
  "$groupId": {
    "courseId": "courseId",
    "name": "Group Name",
    "description": "Group Description",
    "members": {
      "$userId1": true,
      "$userId2": true,
      // Add more users as needed
    }
  }
}
```

Grades
```json
"grades": {
  "$courseId_$userId": {
    "courseId": "courseId",
    "userId": "userId",
    "grade": 85
  }
}
```

Notes
```json

```

User Profiles & Progress
```json
"users": {
  "$userId": {
    "name": "",
    "email": "",
    "registeredCourses": {
      "$courseId": true
    },
    "progress": {
      "$courseId": {
        "$lessonId": {
          "completed": false
        }
      }
    },
    "groupIds": {
      "$groupId1": true,
      "$groupId2": true,
      // Add more groupIds as needed
    },
    "notes": {
      "$lessonId_$userId": {
        "lessonId": "lessonId",
        "text": "User's note here"
      }
    }
  }
}
```