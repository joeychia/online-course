import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function extractFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontMatterRegex);
  if (!match) return {};
  
  const frontMatter = {};
  const lines = match[1].split('\n');
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontMatter[key.trim()] = valueParts.join(':').trim();
    }
  });
  return frontMatter;
}

function processMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontMatter = extractFrontMatter(content);
  const mainContent = content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  
  // Extract date from filename (e.g., 2025-01-01-daily.md)
  const fileName = path.basename(filePath, '.md');
  const [_, __, day] = fileName.split('-'); // Ignore year and month
  const dayNumber = day.padStart(2, '0'); // Ensure 2 digits

  return {
    id: `day${dayNumber}`,
    name: frontMatter.title || '',
    type: 'text',
    content: mainContent,
    completed: false,
    notes: {}
  };
}

function processWeekFolder(folderPath) {
  const weekId = path.basename(folderPath);
  const weekNumber = weekId.replace('wk', '');
  const files = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('-daily.md'))
    .sort();

  const lessons = {};
  files.forEach(file => {
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
    .filter(folder => folder.startsWith('wk'))
    .sort();

  const units = {};
  weekFolders.forEach(folder => {
    const folderPath = path.join(dataDir, folder);
    const weekData = processWeekFolder(folderPath);
    units[weekData.id] = weekData;
  });

  const mockCourses = [
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