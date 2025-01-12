# Online course system

## Product Requirements
### For Admin
- User can create/edit/delete a course
- User can create/edit/delete a unit
- User can create/edit/delete a lesson, which can include video, text, image, quiz
- User can create/edit/delete a quiz, which can include multiple choice, true/false, short answer
- User can create/edit/delete a group
- User can manage members in a group
- User can view everyone's grade in a course

### For User
- User can sign up/sign in/sign out
- User can preview a course without sign in - done
- User can view a course - done
- User can view a unit - done
- User can view a lesson - done
- User can do a quiz for a lesson if any
- User can register/drop a course
- User can join/quit a group
- User must put down a note for a lesson in order to complete the lesson - done
- User can open the first lesson of each unit, but locked out from other lessons until the previous lesson is completed
- User can view a dashboard of all courses, units, lessons, quizzes, groups, and grades

## Technical Stack

frontend:
  - React
  - TypeScript
  - Firebase Auth (could replace with Azure auth)
  - Real-time sync
  - Responsive design
  - PWA support

backend:
  - Firebase realtime database (could replace with Azure Cosmos DB)

test:
  - vitest

data model:
### Firebase Realtime Database Schema (JSON)
```json
{
  "courses": {
    "$courseId": {
      "name": "",
      "description": "",
      "units": {
        "$unitId": {
          "name": "",
          "description": "",
          "lessons": {
            "$lessonId": {
              "name": "",
              "type": "", // video, text, image, quiz
              "content": "", // URL or text content
              "quiz": {
                "type": "", // multiple choice, true/false, short answer
                "questions": {
                  "$questionId": {
                    "text": "",
                    "options": {
                      "$optionId": {
                        "text": "",
                        "isCorrect": false
                      }
                    }
                  }
                }
              },
              "completed": false,
              "notes": {
                "$userId": {
                  "text": ""
                }
              }
            }
          }
        }
      },
      "groups": {
        "$groupId": {
          "name": "",
          "description": "",
          "members": {
            "$userId": true
          }
        }
      },
      "grades": {
        "$userId": {
          "grade": 0
        }
      }
    }
  },
  "users": {
    "$userId": {
      "name": "",
      "email": "",
      "courses": {
        "$courseId": {
          "registered": true,
          "progress": {
            "$unitId": {
              "$lessonId": {
                "completed": false,
                "note": ""
              }
            }
          }
        }
      },
      "groups": {
        "$groupId": true
      }
    }
  }
}


