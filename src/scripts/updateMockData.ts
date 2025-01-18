import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the mock data
const mockDataPath = path.join(__dirname, '../data/mockData.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));

// Function to transform course data
function transformCourseData(course: any) {
  // Get the unit IDs from the unitIds object
  const unitIds = Object.keys(course.unitIds).filter(id => course.unitIds[id]);
  
  // Create the new units array with id and name from the units data
  const units = unitIds.map(id => ({
    id,
    name: mockData.units[id]?.name || ''
  }));

  // Replace the unitIds with the new units array
  const newCourse = {
    ...course,
    units
  };
  delete newCourse.unitIds;
  
  return newCourse;
}

// Transform all courses
for (const courseId in mockData.courses) {
  mockData.courses[courseId] = transformCourseData(mockData.courses[courseId]);
}

// Write the updated data back to the file
fs.writeFileSync(mockDataPath, JSON.stringify(mockData, null, 2)); 