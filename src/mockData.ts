import { Course } from './types';

export const mockCourses: Course[] = [
  {
    id: 'course1',
    name: 'Introduction to React',
    description: 'Learn the basics of React development',
    units: {
      unit1: {
        id: 'unit1',
        name: 'Getting Started',
        description: 'Basic concepts of React',
        lessons: {
          lesson1: {
            id: 'lesson1',
            name: 'What is React?',
            type: 'text',
            content: 'React is a JavaScript library for building user interfaces.',
            completed: false,
            notes: {}
          },
          lesson2: {
            id: 'lesson2',
            name: 'Setting up React',
            type: 'video',
            content: 'https://example.com/video',
            completed: false,
            notes: {}
          }
        }
      },
      unit2: {
        id: 'unit2',
        name: 'React Hooks',
        description: 'Understanding React Hooks',
        lessons: {
          lesson1: {
            id: 'lesson1',
            name: 'Introduction to Hooks',
            type: 'text',
            content: 'Hooks are a new addition in React 16.8.',
            completed: false,
            notes: {}
          },
          lesson2: {
            id: 'lesson2',
            name: 'useState Hook',
            type: 'video',
            content: 'https://example.com/video2',
            completed: false,
            notes: {}
          }
        }
      }
    },
    groups: {},
    grades: {}
  },
  {
    id: 'course2',
    name: 'Advanced TypeScript',
    description: 'Master TypeScript for large applications',
    units: {
      unit1: {
        id: 'unit1',
        name: 'TypeScript Basics',
        description: 'Fundamental concepts of TypeScript',
        lessons: {
          lesson1: {
            id: 'lesson1',
            name: 'Why TypeScript?',
            type: 'text',
            content: 'TypeScript adds static typing to JavaScript',
            completed: false,
            notes: {}
          },
          lesson2: {
            id: 'lesson2',
            name: 'Basic Types',
            type: 'quiz',
            content: 'Test your knowledge of TypeScript types',
            completed: false,
            notes: {}
          }
        }
      }
    },
    groups: {},
    grades: {}
  }
]; 