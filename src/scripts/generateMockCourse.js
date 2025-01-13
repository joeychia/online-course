import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DAILY_MD_DIR = path.join(__dirname, '../data/daily_md');
const NOTES_DIR = path.join(__dirname, '../data/notes');
const OUTPUT_DIR = path.join(__dirname, '../data/mock');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateUniqueId(prefix) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

function readMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return matter(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist - return null silently
      return null;
    }
    // Log other errors
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

function extractVideoInfo(qianliContent) {
  if (!qianliContent) return {};
  
  // Try HTML format first
  const htmlMatch = qianliContent.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  if (htmlMatch) {
    return {
      'video-title': htmlMatch[2],
      'video-url': htmlMatch[1].replace('_blank', '')
    };
  }
  
  // Fallback to markdown format
  const markdownMatch = qianliContent.match(/\[([^\]]+)\]\((https:\/\/youtu[^\)]+)\)/);
  if (markdownMatch) {
    return {
      'video-title': markdownMatch[1],
      'video-url': markdownMatch[2]
    };
  }
  
  return {};
}

function generateMockData() {
  // Read all markdown files
  const files = fs.readdirSync(DAILY_MD_DIR)
    .filter(file => file.endsWith('-daily.md'))
    .sort((a, b) => a.localeCompare(b));

  console.log(`Found ${files.length} daily markdown files to process`);

  // Generate course data
  const courseId = generateUniqueId('course');
  const course = {
    id: courseId,
    name: "Bible Study 2024",
    description: "A two-year Bible reading and study program",
    unitIds: {},
    groupIds: {}
  };

  // Generate units (one per week)
  const units = {};
  const lessons = {};
  const users = {
    "system": {
      name: "System",
      email: "system@example.com",
      registeredCourses: {
        [courseId]: true
      },
      progress: {
        [courseId]: {}
      }
    }
  };

  let currentWeek = 0;
  let currentUnit = null;
  let processedCount = 0;

  for (const file of files) {
    const dailyContent = readMarkdownFile(path.join(DAILY_MD_DIR, file));
    if (!dailyContent) {
      console.log(`Skipping ${file} - could not read content`);
      continue;
    }

    const { data: frontmatter, content } = dailyContent;
    const { weekNum, dayNum, date } = frontmatter;

    // Create new unit for each week
    if (weekNum !== currentWeek) {
      currentWeek = weekNum;
      const unitId = generateUniqueId('unit');
      currentUnit = {
        id: unitId,
        courseId: courseId,
        name: `Week ${weekNum}`,
        description: `Bible study materials for week ${weekNum}`,
        lessonIds: {}
      };
      units[unitId] = currentUnit;
      course.unitIds[unitId] = true;
      console.log(`Created unit for week ${weekNum}`);
    }

    // Get meditation content from zhuolin's notes
    const dateStr = date.toISOString().split('T')[0];
    const zhuolinPath = path.join(NOTES_DIR, `${dateStr}-zhuolin.md`);
    const zhuolinContent = readMarkdownFile(zhuolinPath);

    // Get video info from qianli's notes
    const qianliPath = path.join(NOTES_DIR, `${dateStr}-qianli.md`);
    const qianliContent = readMarkdownFile(qianliPath);
    const videoInfo = extractVideoInfo(qianliContent?.content || '');

    // Create lesson
    const lessonId = generateUniqueId('lesson');
    const lesson = {
      id: lessonId,
      unitId: currentUnit.id,
      name: frontmatter.title,
      content: content,
      ...videoInfo,
      meditation: zhuolinContent?.content || '',
      quizId: null,
      orderIndex: dayNum
    };

    lessons[lessonId] = lesson;
    currentUnit.lessonIds[lessonId] = true;

    // Update system user progress
    users.system.progress[courseId][lessonId] = {
      completed: true
    };

    processedCount++;
    console.log(`Processed ${file} (${processedCount}/${files.length})`);
  }

  // Save all data
  const mockData = {
    courses: { [courseId]: course },
    units,
    lessons,
    users
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'mockData.json'),
    JSON.stringify(mockData, null, 2)
  );

  console.log('\nMock data generated successfully!');
  console.log(`Course ID: ${courseId}`);
  console.log(`Total units: ${Object.keys(units).length}`);
  console.log(`Total lessons: ${Object.keys(lessons).length}`);
}

// Run the script
generateMockData(); 