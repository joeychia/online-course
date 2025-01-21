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
- User can sign up/sign in/sign out - done
- User can preview a course without sign in - done
- User can view a course - done
- User can view a unit - done
- User can view a lesson - done
- User can view their quiz history for a lesson (complete questions and answers are recorded) - done
- User can do a quiz for a lesson if any - done
- User can register/drop a course - done
- User can join/quit a group
- User must put down a note for a lesson in order to complete the lesson - done
- User can open the first lesson of each unit, but locked out from other lessons until the previous lesson is completed - done
- User can switch language between English, Simplified Chinese, and Traditional Chinese. Default is Traditional Chinese.

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
    "units": [
      {"$unitId": "unit name"},
      {"$unitId2": "unit name2"}
    ],
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
    "lessons": [
      {"$lessonId": "lesson name"},
      {"$lessonId2": "lesson name2"}
    ]
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
    "quizId": "quizIdIfAny", // reference a quiz in quizzes collection
  }
}
```
Quizzes
```json
"quizzes": {
  "$quizId": {
    "questions": [
      {
        "type": "single_choice|free_form",
        "text": "Question text",
        "options": [
          {
            "text": "Option text",
            "isCorrect": false
          }
        ]
      }
    ]
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
          "completed": false,
          "completedAt": "timestamp",
          "lessonName": "lessonName"
        }
      }
    },
    "groupIds": {
      "$groupId1": true,
      "$groupId2": true,
      // Add more groupIds as needed
    },
    "notes": {
      "$lessonId": {
        "lessonId": "lessonId",
        "text": "User's note here",
        "updatedAt": "timestamp"
      }
    },
    "quizHistory": {
      "$lessonId": {
        "quizId": "quizId",
        "courseId": "courseId",
        "answers": {
          "$questionId": "answer"
        },
        "completedAt": "timestamp",
        "correct": 10,
        "total": 10
      }
    }
  }
}
```