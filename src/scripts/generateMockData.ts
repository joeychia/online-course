const fs = require('fs');
const path = require('path');

interface Course {
  id: string;
  name: string;
  description: string;
  units: Record<string, any>;
  groups: Record<string, any>;
  grades: Record<string, any>;
}

function extractFrontMatter(content: string) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontMatterRegex);
  if (!match) return {};
  
  const frontMatter: Record<string, string> = {};
  const lines = match[1].split('\n');
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontMatter[key.trim()] = valueParts.join(':').trim();
    }
  });
  return frontMatter;
}

function processMarkdownFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontMatter = extractFrontMatter(content);
  const mainContent = content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();

  return {
    id: path.basename(filePath, '.md').split('-').pop() || '',
    name: frontMatter.title || '',
    type: 'text',
    content: mainContent,
    completed: false,
    notes: {}
  };
}

function processWeekFolder(folderPath: string) {
  const weekId = path.basename(folderPath);
  const weekNumber = weekId.replace('wk', '');
  const files = fs.readdirSync(folderPath)
    .filter((file: string) => file.endsWith('-daily.md'))
    .sort();

  const lessons: Record<string, any> = {};
  files.forEach((file: string) => {
    const filePath = path.join(folderPath, file);
    const dayData = processMarkdownFile(filePath);
    lessons[dayData.id] = dayData;
  });

  return {
    id: weekId,
    name: `第${weekNumber}週`,
    description: `第${weekNumber}週的每日讀經內容`,
    lessons
  };
}

function generateMockData() {
  const dataDir = path.resolve(__dirname, '../data');
  const weekFolders = fs.readdirSync(dataDir)
    .filter((folder: string) => folder.startsWith('wk'))
    .sort();

  const units: Record<string, any> = {};
  weekFolders.forEach((folder: string) => {
    const folderPath = path.join(dataDir, folder);
    const weekData = processWeekFolder(folderPath);
    units[weekData.id] = weekData;
  });

  const mockCourses: Course[] = [
    {
      id: 'bible-reading-plan',
      name: '「謙理之行」兩年讀經計劃',
      description: '兩年讀經計劃的每日靈修材料',
      units,
      groups: {},
      grades: {}
    }
  ];

  const outputPath = path.resolve(__dirname, '../mockData.ts');
  const output = `import { Course } from './types';\n\nexport const mockCourses: Course[] = ${JSON.stringify(mockCourses, null, 2)};`;
  fs.writeFileSync(outputPath, output);
}

generateMockData(); 