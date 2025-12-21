# Online course system

## Product Requirements
### For Admin
- User can create/edit/delete a course - done
- User can create/edit/delete a unit - done
- User can create/edit/delete a lesson, which can include video, text, image, quiz - done
- User can create/edit/delete a quiz, where each question can include single_choice, free_form - done
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
- User can switch language between English, Simplified Chinese, and Traditional Chinese. Default is Traditional Chinese. - done

## Technical Stack

frontend:
  - React
  - TypeScript
  - Material UI
  - Firebase Auth
  - Responsive design
  - PWA support
  - Toast UI Editor (Markdown support)

backend:
  - Firestore

test:
  - vitest

data model:
Courses
```json
"courses": {
  "$courseId": {
    "id": "courseId",
    "name": "Course Name",
    "description": "Course Description",
    "settings": {
      "unlockLessonIndex": 1,
      "token": "optional token",
      "enableNote": true
    },
    "units": [
      {
        "id": "unitId",
        "name": "unit name",
        "order": 1,
        "lessons": [
          {
            "id": "lessonId",
            "name": "lesson name",
            "order": 1
          }
        ]
      }
    ],
    "groupIds": {
      "$groupId": true
    },
    "isPublic": false
  }
}
```

Units
```json
"units": {
  "$unitId": {
    "id": "unitId",
    "courseId": "courseId",
    "name": "Unit Name",
    "description": "Unit Description",
    "order": 1,
    "lessons": [
      {
        "id": "lessonId",
        "name": "lesson name",
        "order": 1
      }
    ]
  }
}
```

Lessons
```json
"lessons": {
  "$lessonId": {
    "id": "lessonId",
    "unitId": "unitId",
    "name": "Lesson Title",
    "content": "markdown content",
    "order": 1,
    "video-title": "video title",
    "video-url": "video url",
    "quizId": null
  }
}
```

Quizzes
```json
"quizzes": {
  "$quizId": {
    "id": "quizId",
    "questions": [
      {
        "type": "single_choice",
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
    "id": "groupId",
    "courseId": "courseId",
    "name": "Group Name",
    "description": "Group Description",
    "members": {
      "$userId": true
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
    "id": "userId",
    "name": "",
    "email": "",
    "roles": {
      "student": false,
      "instructor": false,
      "admin": false
    },
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
      "$groupId": true
    },
    "notes": {
      "$lessonId": {
        "id": "noteId",
        "courseId": "courseId",
        "unitName": "Unit Name",
        "lessonName": "Lesson Name",
        "text": "User's note here",
        "updatedAt": "timestamp"
      }
    },
    "QuizHistory": {
      "$lessonId": {
        "quizId": "quizId",
        "userId": "userId",
        "courseId": "courseId",
        "lessonId": "lessonId",
        "answers": {
          "$questionId": "answer"
        },
        "score": 85,
        "completedAt": "timestamp",
        "correct": 10,
        "total": 10
      }
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```
