import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_INPUT_FILE = path.resolve(__dirname, '../data/backups/course-qianlizhixing-2728.json');
const CSV_INPUT_FILE = path.resolve(__dirname, '../data/backups/qlzx_2728.csv');
const OUTPUT_FILE = path.resolve(__dirname, '../data/backups/course-qianlizhixing-2728-reconstructed.json');

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

/*
// Simple CSV parser that handles quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Double quote inside quotes -> single quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // End of quotes
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  result.push(currentField);
  return result;
}
*/

async function reconstruct() {
  console.log('Reading original JSON file for structure...');
  let backupData: BackupData;
  try {
    const dataStr = await fs.readFile(JSON_INPUT_FILE, 'utf-8');
    backupData = JSON.parse(dataStr);
    console.log(`Original JSON has ${Object.keys(backupData.lessons || {}).length} lessons.`);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return;
  }

  console.log('Reading CSV file...');
  let csvContent: string;
  try {
    csvContent = await fs.readFile(CSV_INPUT_FILE, 'utf-8');
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return;
  }

  // Unit names will be extracted from CSV 'unit_name' column
  const unitNamesMap: Record<string, string> = {};

  // Use a more robust CSV parsing approach that handles multi-line fields
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < csvContent.length && csvContent[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && i + 1 < csvContent.length && csvContent[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField);
        if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
             rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  // Add last row if exists
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length < 2) {
    console.error('CSV file is empty or missing header.');
    return;
  }

  const headers = rows[0];
  // Expected headers: id,unitId,name,video-title,video-url,quizId,content,link_1_text,link_1_url,...

  // Map header name to index
  const headerMap = new Map<string, number>();
  headers.forEach((h, i) => headerMap.set(h, i));

  const newLessons: Record<string, Lesson> = {};
  let processedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const columns = rows[i];
    
    // Helper to get value by column name
    const getCol = (name: string) => {
      const idx = headerMap.get(name);
      return (idx !== undefined && idx < columns.length) ? columns[idx] : '';
    };

    const id = getCol('id');
    const unitId = getCol('unitId');
    
    // Extract unit name from CSV if present
    const unitNameInCsv = getCol('unit_name');
    if (unitId && unitNameInCsv) {
      unitNamesMap[unitId] = unitNameInCsv;
    }

    if (!id || !unitId) continue;
    const name = getCol('name');
    const videoTitle = getCol('video-title');
    const videoUrl = getCol('video-url');
    const quizId = getCol('quizId');
    let content = getCol('content');

    // Reconstruct links
    const linkSlots: ({ text: string; url: string } | undefined)[] = [];
    // We have 8 link slots
    for (let j = 1; j <= 8; j++) {
      const text = getCol(`link_${j}_text`);
      const url = getCol(`link_${j}_url`);
      if (text && url) {
        linkSlots[j-1] = { text, url };
      } else {
        linkSlots[j-1] = undefined;
      }
    }

    if (linkSlots.some(l => l)) {
      let linksSection = '### 讀經\n\n';
      
      // Link 1
      if (linkSlots[0]) {
        linksSection += `- [${linkSlots[0].text}](${linkSlots[0].url})\n`;
      }

      // Links 2-4
      const group1 = [linkSlots[1], linkSlots[2], linkSlots[3]].filter(l => l);
      if (group1.length > 0) {
        linksSection += ` - ${group1.map(l => `[${l!.text}](${l!.url})`).join(' | ')}\n`;
      }

      // Link 5
      if (linkSlots[4]) {
        linksSection += `- [${linkSlots[4].text}](${linkSlots[4].url})\n`;
      }

      // Links 6-8
      const group2 = [linkSlots[5], linkSlots[6], linkSlots[7]].filter(l => l);
      if (group2.length > 0) {
        linksSection += ` - ${group2.map(l => `[${l!.text}](${l!.url})`).join(' | ')}\n`;
      }

      linksSection += '\n';
      
      content = linksSection + content.trim();
    }

    const lesson: Lesson = {
      id,
      unitId,
      name,
      content,
      "video-title": videoTitle || undefined,
      "video-url": videoUrl || undefined,
      quizId: quizId || null // Explicitly null if empty string, or undefined? JSON usually uses null for empty quizId
    };
    
    // Clean up undefined/null values to match JSON style if needed, but JSON.stringify handles undefined by omitting
    
    newLessons[id] = lesson;
    processedCount++;
  }

  console.log(`Processed ${processedCount} lessons from CSV.`);

  // 1. Fix Unit IDs in root 'units' object to match CSV format (unit_qlzx_2728_weekX)
  const newUnits: Record<string, any> = {};
  if (backupData.units) {
    for (const [key, unit] of Object.entries(backupData.units)) {
      let newKey = key;
      let newId = unit.id;

      const match = key.match(/^unit_qlzx_week(\d+)_2728$/);
      if (match) {
        newKey = `unit_qlzx_2728_week${match[1]}`;
        newId = newKey;
      }
      
      // Update Name if available in unitNamesMap
      let unitName = unit.name;
      if (unitNamesMap[newKey]) {
          unitName = unitNamesMap[newKey];
      }
      
      newUnits[newKey] = {
        ...unit,
        id: newId,
        name: unitName
      };
    }
    backupData.units = newUnits;
  }

  // 2. Fix Unit IDs in 'courses' -> 'units' array
  if (backupData.courses) {
    for (const course of Object.values(backupData.courses)) {
      if (course.units && Array.isArray(course.units)) {
        course.units = course.units.map((u: any) => {
           const match = u.id.match(/^unit_qlzx_week(\d+)_2728$/);
           let newUnitId = u.id;
           if (match) {
             newUnitId = `unit_qlzx_2728_week${match[1]}`;
           }
           
           let unitName = u.name;
           if (unitNamesMap[newUnitId]) {
               unitName = unitNamesMap[newUnitId];
           }

           return { 
               ...u, 
               id: newUnitId,
               name: unitName
           };
        });
      }
    }
  }

  // 3. Clean up old lessons and merge new ones
  const finalLessons: Record<string, Lesson> = {};
  if (backupData.lessons) {
    for (const [key, lesson] of Object.entries(backupData.lessons)) {
      // Keep lesson_0
      if (key === 'lesson_0') {
        // Fix unitId if needed: point to unit_0_2728 if unit_0 doesn't exist
        if (lesson.unitId === 'unit_0' && backupData.units['unit_0_2728']) {
           lesson.unitId = 'unit_0_2728';
        }
        finalLessons[key] = lesson;
        continue;
      }
      
      // Remove old daily lessons (pattern: lesson_qlzx_dayX)
      if (key.match(/^lesson_qlzx_day\d+$/)) {
        continue;
      }

      // Keep any other lessons not matching the old pattern
      finalLessons[key] = lesson;
    }
  }

  // Merge new lessons
  Object.assign(finalLessons, newLessons);
  backupData.lessons = finalLessons;

  // 4. Update Unit lesson lists and counts based on finalLessons
  // Group lessons by unitId
  const unitLessonsMap: Record<string, Lesson[]> = {};
  
  // Initialize with empty arrays for all known units
  if (backupData.units) {
    for (const unitId of Object.keys(backupData.units)) {
      unitLessonsMap[unitId] = [];
    }
  }

  // Populate map with lessons
  for (const lesson of Object.values(finalLessons)) {
    const unitId = lesson.unitId;
    if (unitId) {
      if (!unitLessonsMap[unitId]) {
        unitLessonsMap[unitId] = [];
      }
      unitLessonsMap[unitId].push(lesson);
    }
  }

  // Sort lessons within each unit (optional, but good for consistency)
  // Assuming IDs like lesson_qlzx2728_dayX can be sorted by extracting the number
  for (const unitId in unitLessonsMap) {
    unitLessonsMap[unitId].sort((a, b) => {
      // Handle lesson_0 special case
      if (a.id === 'lesson_0') return -1;
      if (b.id === 'lesson_0') return 1;

      const extractNum = (id: string) => {
        const match = id.match(/day(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return extractNum(a.id) - extractNum(b.id);
    });
  }

  // Rename the last lesson of every unit to "經文回顧及測試"
  for (const unitId in unitLessonsMap) {
    const lessons = unitLessonsMap[unitId];
    if (lessons.length > 0) {
      const lastLesson = lessons[lessons.length - 1];
      // Only rename if it's not lesson_0 (just in case)
      if (lastLesson.id !== 'lesson_0') {
         lastLesson.name = '經文回顧及測試';
         // Also update in the main lessons map if needed, though they are references so it should be fine.
         // But just to be explicit if they were copies (they are not copies here).
      }
    }
  }

  // Update 'units' object: set 'lessons' array for each unit
  if (backupData.units) {
    for (const unitId of Object.keys(backupData.units)) {
      const lessons = unitLessonsMap[unitId] || [];
      // Create minimal lesson objects for the unit's lesson list if needed, 
      // or just reference them. The original JSON structure often has a 'lessons' array in the unit 
      // which contains partial lesson info (id, name, hasQuiz, etc.)
      
      // Based on previous grep, the unit object looks like:
      // "unit_0_2728": { ..., "lessons": [ { "name": "...", "id": "...", "hasQuiz": false } ] }
      
      backupData.units[unitId].lessons = lessons.map(l => ({
        id: l.id,
        name: l.name,
        hasQuiz: !!l.quizId // Simple check for quiz
      }));
    }
  }

  // Update 'courses' -> 'units' array: set 'lessonCount'
  if (backupData.courses) {
    for (const course of Object.values(backupData.courses)) {
      if (course.units && Array.isArray(course.units)) {
        course.units = course.units.map((u: any) => {
          const unitId = u.id;
          const lessons = unitLessonsMap[unitId] || [];
          return {
            ...u,
            lessonCount: lessons.length
          };
        });
      }
    }
  }

  console.log('Writing reconstructed JSON file...');
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(backupData, null, 2));
  console.log(`Reconstructed JSON written to ${OUTPUT_FILE}`);
}

reconstruct().catch(console.error);
