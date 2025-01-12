import { ref, set } from 'firebase/database';
import { database } from './config/firebase';

export const initializeSampleData = async () => {
  const sampleData = {
    courses: {
      course1: {
        name: "Introduction to React",
        description: "Learn the basics of React development",
        units: {
          unit1: {
            name: "Getting Started",
            description: "Basic concepts of React",
            lessons: {
              lesson1: {
                name: "What is React?",
                type: "text",
                content: "React is a JavaScript library for building user interfaces.",
                completed: false,
                notes: {}
              },
              lesson2: {
                name: "Setting up React",
                type: "video",
                content: "https://example.com/video",
                completed: false,
                notes: {}
              }
            }
          }
        }
      }
    }
  };

  try {
    await set(ref(database), sampleData);
    console.log('Sample data initialized');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}; 