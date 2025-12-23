import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.resolve(__dirname, '../data/backups/course-qianlizhixing-2728.json');
const OUTPUT_FILE = path.resolve(__dirname, '../data/backups/course-qianlizhixing-2728.csv');

interface Lesson {
  id: string;
  unitId: string;
  name: string;
  content: string;
  "video-title"?: string;
  "video-url"?: string;
  quizId?: string | null;
  [key: string]: any;
}

interface BackupData {
  courses: Record<string, any>;
  units: Record<string, any>;
  lessons: Record<string, Lesson>;
}

async function transform() {
  console.log('Reading JSON file...');
  try {
    const dataStr = await fs.readFile(INPUT_FILE, 'utf-8');
    const data: BackupData = JSON.parse(dataStr);

    if (!data.lessons) {
        console.error('No lessons found in JSON file.');
        return;
    }

    const lessons = Object.values(data.lessons);
    console.log(`Found ${lessons.length} lessons.`);

    const processedLessons = lessons.map(lesson => {
      let content = lesson.content || '';
      // Regex to capture "讀經" section.
      // Matches ### 讀經 followed by anything until the next ###, 【本週默想經文】, or end of string.
      const readingSectionRegex = /###\s*讀經([\s\S]*?)(?=(?:###|【本週|$))/;
      const match = content.match(readingSectionRegex);

      let links: { text: string; url: string }[] = [];
      
      if (match) {
        const readingContent = match[0]; // The full match including ### 讀經
        // Remove the reading section from content
        content = content.replace(readingContent, '').trim();

        // Extract links from reading content
        // Regex for markdown links: [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let linkMatch;
        // We scan the captured group (the content after ### 讀經)
        while ((linkMatch = linkRegex.exec(readingContent)) !== null) {
          links.push({
            text: linkMatch[1],
            url: linkMatch[2]
          });
        }
      }

      // Determine link placement
      // Default: fill from start
      // If exactly 4 links, fill slots 4-7 (columns link_5 to link_8)
      const maxSlots = 8;
      const finalLinks = new Array(maxSlots).fill({ text: '', url: '' });

      if (links.length === 4) {
        for (let i = 0; i < 4; i++) {
          finalLinks[i + 4] = links[i];
        }
      } else {
        for (let i = 0; i < links.length && i < maxSlots; i++) {
          finalLinks[i] = links[i];
        }
      }

      return {
        ...lesson,
        content,
        finalLinks
      };
    });

    // Determine max number of links - actually we fix it to 8 based on user requirement context, 
    // or we can just use 8 as we are mapping to 5-8.
    const maxLinks = 8; 
    console.log(`Max links set to: ${maxLinks}`);

    // Create CSV headers
    const baseHeaders = ['id', 'unitId', 'name', 'video-title', 'video-url', 'quizId', 'content'];
    const linkHeaders: string[] = [];
    for (let i = 0; i < maxLinks; i++) {
      linkHeaders.push(`link_${i+1}_text`, `link_${i+1}_url`);
    }
    
    const csvRows = [
      [...baseHeaders, ...linkHeaders].join(',')
    ];

    for (const lesson of processedLessons) {
      const row = [
        escapeCsv(lesson.id),
        escapeCsv(lesson.unitId),
        escapeCsv(lesson.name),
        escapeCsv(lesson["video-title"] || ''),
        escapeCsv(lesson["video-url"] || ''),
        escapeCsv(lesson.quizId || ''),
        escapeCsv(lesson.content),
      ];

      for (let i = 0; i < maxLinks; i++) {
        row.push(escapeCsv(lesson.finalLinks[i].text));
        row.push(escapeCsv(lesson.finalLinks[i].url));
      }

      csvRows.push(row.join(','));
    }

    console.log('Writing CSV file...');
    await fs.writeFile(OUTPUT_FILE, csvRows.join('\n'));
    console.log(`CSV written to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error transforming file:', error);
  }
}

function escapeCsv(str: string): string {
  if (str === null || str === undefined) return '';
  const stringValue = String(str);
  // If contains double quote, comma or newline, wrap in quotes and escape double quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

transform().catch(console.error);
