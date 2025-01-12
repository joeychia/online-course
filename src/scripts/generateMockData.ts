import * as fs from 'fs';
import * as path from 'path';

interface Course {
  id: string;
  name: string;
  description: string;
  unitIds: { [key: string]: boolean };
  groupIds: { [key: string]: boolean };
  isPublic?: boolean;
}

interface Unit {
  id: string;
  courseId: string;
  name: string;
  description: string;
  lessonIds: { [key: string]: boolean };
  isPublic?: boolean;
}

interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  quizId?: string;
  orderIndex: number;
}

interface Quiz {
  id: string;
  type: 'multiple choice' | 'true/false' | 'short answer';
  questions: {
    [key: string]: {
      text: string;
      options: {
        [key: string]: {
          text: string;
          isCorrect: boolean;
        };
      };
    };
  };
}

interface Group {
  id: string;
  courseId: string;
  name: string;
  description: string;
  members: { [key: string]: boolean };
}

interface Grade {
  courseId: string;
  userId: string;
  grade: number;
}

interface Note {
  lessonId: string;
  userId: string;
  text: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  registeredCourses: { [key: string]: boolean };
  progress: {
    [courseId: string]: {
      [lessonId: string]: {
        completed: boolean;
      };
    };
  };
  groupIds: { [key: string]: boolean };
}

function processMarkdownFile(filePath: string): { title: string; content: string } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
  return { title, content };
}

function generateMockData() {
  const dataDir = path.resolve(__dirname, '../data');
  const mockData: {
    courses: { [key: string]: Course };
    units: { [key: string]: Unit };
    lessons: { [key: string]: Lesson };
    quizzes: { [key: string]: Quiz };
    groups: { [key: string]: Group };
    grades: { [key: string]: Grade };
    notes: { [key: string]: Note };
    users: { [key: string]: UserProfile };
  } = {
    courses: {},
    units: {},
    lessons: {},
    quizzes: {},
    groups: {},
    grades: {},
    notes: {},
    users: {}
  };

  // Create a course
  const courseId = 'bible-reading-plan';
  mockData.courses[courseId] = {
    id: courseId,
    name: '「謙理之行」兩年讀經計劃',
    description: '兩年讀經計劃的每日靈修材料',
    unitIds: {},
    groupIds: {},
    isPublic: true
  };

  // Process each week folder
  const weekFolders = fs.readdirSync(dataDir)
    .filter(folder => folder.startsWith('wk'))
    .sort();

  weekFolders.forEach((weekFolder, weekIndex) => {
    const weekPath = path.join(dataDir, weekFolder);
    const unitId = weekFolder;
    
    // Create unit
    mockData.units[unitId] = {
      id: unitId,
      courseId: courseId,
      name: `第${weekFolder.substring(2)}週`,
      description: `第${weekFolder.substring(2)}週的每日讀經內容`,
      lessonIds: {},
      isPublic: true
    };
    mockData.courses[courseId].unitIds[unitId] = true;

    // Process daily files
    const dailyFiles = fs.readdirSync(weekPath)
      .filter(file => file.endsWith('-daily.md'))
      .sort();

    dailyFiles.forEach((file, dayIndex) => {
      const filePath = path.join(weekPath, file);
      const { title, content } = processMarkdownFile(filePath);
      const lessonId = `${unitId}_day${dayIndex + 1}`;

      // Create lesson
      mockData.lessons[lessonId] = {
        id: lessonId,
        unitId: unitId,
        name: title,
        content: content,
        orderIndex: dayIndex + 1
      };
      mockData.units[unitId].lessonIds[lessonId] = true;
    });
  });

  // Create demo user
  const userId = 'demo_user';
  mockData.users[userId] = {
    id: userId,
    name: 'Demo User',
    email: 'demo@example.com',
    registeredCourses: { [courseId]: true },
    progress: {
      [courseId]: Object.keys(mockData.lessons).reduce((acc, lessonId) => {
        acc[lessonId] = { completed: false };
        return acc;
      }, {} as { [key: string]: { completed: boolean } })
    },
    groupIds: {}
  };

  // Create demo group
  const groupId = 'demo_group';
  mockData.groups[groupId] = {
    id: groupId,
    courseId: courseId,
    name: 'Demo Study Group',
    description: 'A study group for the Bible reading plan',
    members: { [userId]: true }
  };
  mockData.courses[courseId].groupIds[groupId] = true;
  mockData.users[userId].groupIds[groupId] = true;

  // Write mock data to file
  const outputPath = path.resolve(__dirname, '../mockData.ts');
  const outputContent = `export const mockData = ${JSON.stringify(mockData, null, 2)} as const;\n`;
  fs.writeFileSync(outputPath, outputContent);
}

generateMockData(); 