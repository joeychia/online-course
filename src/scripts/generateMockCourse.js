import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROCESSED_DIR = path.join(__dirname, '..', 'data', 'processed');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'mock');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateUniqueId(prefix) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMockData() {
  // Read all processed files
  const files = fs.readdirSync(PROCESSED_DIR)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => {
      const [aWeek, aDay] = a.match(/wk(\d+)-day(\d+)/).slice(1).map(Number);
      const [bWeek, bDay] = b.match(/wk(\d+)-day(\d+)/).slice(1).map(Number);
      return aWeek === bWeek ? aDay - bDay : aWeek - bWeek;
    });

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
  const notes = {};
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

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(PROCESSED_DIR, file)));
    const [week, day] = file.match(/wk(\d+)-day(\d+)/).slice(1).map(Number);

    // Create new unit for each week
    if (week !== currentWeek) {
      currentWeek = week;
      const unitId = generateUniqueId('unit');
      currentUnit = {
        id: unitId,
        courseId: courseId,
        name: `Week ${week}`,
        description: `Bible study materials for week ${week}`,
        lessonIds: {}
      };
      units[unitId] = currentUnit;
      course.unitIds[unitId] = true;
    }

    // Create lesson
    const lessonId = generateUniqueId('lesson');
    const lesson = {
      id: lessonId,
      unitId: currentUnit.id,
      name: content.title,
      orderIndex: day,
      content: generateLessonContent(content),
      quizId: null // No quiz for now
    };

    lessons[lessonId] = lesson;
    currentUnit.lessonIds[lessonId] = true;

    // Add system note
    const noteId = `${lessonId}_system`;
    notes[noteId] = {
      lessonId: lessonId,
      userId: "system",
      text: content.meditation.my_story.content
    };

    // Update system user progress
    users.system.progress[courseId][lessonId] = {
      completed: true
    };
  }

  // Save all data
  const mockData = {
    courses: { [courseId]: course },
    units,
    lessons,
    notes,
    users
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'mockData.json'),
    JSON.stringify(mockData, null, 2)
  );

  console.log('Mock data generated successfully!');
  console.log(`Course ID: ${courseId}`);
  console.log(`Total units: ${Object.keys(units).length}`);
  console.log(`Total lessons: ${Object.keys(lessons).length}`);
}

function generateLessonContent(data) {
  return `# ${data.title}

${data.date}

## Question
${data.question}

## Bible Reading

### Main Reading
${data.readings.main.text}

* [Traditional Chinese](${data.readings.main.links.traditional})
* [Simplified Chinese](${data.readings.main.links.simplified})
* [NIV](${data.readings.main.links.niv})
* [YouVersion](${data.readings.main.links.youversion})

### Psalm Reading
${data.readings.psalm.text}

* [Traditional Chinese](${data.readings.psalm.links.traditional})
* [Simplified Chinese](${data.readings.psalm.links.simplified})
* [NIV](${data.readings.psalm.links.niv})
* [YouVersion](${data.readings.psalm.links.youversion})

## Meditation

### ${data.meditation.gods_story.title}
${data.meditation.gods_story.content}

### ${data.meditation.my_story.title}
${data.meditation.my_story.content}

${data.qianli ? `## Video Sharing
[${data.qianli.youtube?.text || 'Watch Video'}](${data.qianli.youtube?.url})` : ''}

## Additional Resources
${data.sharing_links.map(link => `* [${link.title}](${link.url})`).join('\n')}`;
}

// Run the script
generateMockData(); 