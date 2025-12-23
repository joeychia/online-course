
import fs from 'fs';
import path from 'path';

// Interfaces based on the CSV structures
interface OriginalRow {
  bookId: string;
  secondaryBookId: string;
  name: string;
  videoTitle: string;
  videoUrl: string;
  quizId: string;
  content: string;
  links: { text: string; url: string }[]; // 8 links
}

interface TargetRow {
  bookId: string;
  secondaryBookId: string;
  unitId: string;
  id: string;
  quizId: string;
}

// CSV Parser Helper
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

// Function to read CSV file properly handling multi-line quoted fields
function readCsvFile(filePath: string): string[][] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < fileContent.length; i++) {
    const char = fileContent[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < fileContent.length && fileContent[i + 1] === '"') {
          currentField += '"';
          i++; // Skip next quote
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
        if (char === '\r' && i + 1 < fileContent.length && fileContent[i + 1] === '\n') {
          i++; // Skip \n
        }
        currentRow.push(currentField);
        if (currentRow.length > 1 || currentRow[0] !== '') { // Skip empty lines
             rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  
  return rows;
}

// Helper to escape CSV fields for output
function escapeCsv(field: string | undefined): string {
  if (field === undefined || field === null) return '';
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

const originalCsvPath = path.resolve(process.cwd(), 'src/data/backups/original.csv');
const targetCsvPath = path.resolve(process.cwd(), 'src/data/backups/target.csv');
const outputCsvPath = path.resolve(process.cwd(), 'src/data/backups/qlzx_2728.csv');

console.log('Reading files...');
const originalData = readCsvFile(originalCsvPath);
const targetData = readCsvFile(targetCsvPath);

console.log(`Original rows: ${originalData.length}`);
console.log(`Target rows: ${targetData.length}`);

// Map headers
const originalHeader = originalData[0];
const targetHeader = targetData[0];

// Helper to find index
const getIdx = (headers: string[], name: string) => headers.findIndex(h => h.trim() === name);

const idxBookId = getIdx(originalHeader, 'book id');
const idxSecBookId = getIdx(originalHeader, 'Secondary book id');
const idxName = getIdx(originalHeader, 'name');
const idxVideoTitle = getIdx(originalHeader, 'video-title');
const idxVideoUrl = getIdx(originalHeader, 'video-url');
const idxQuizId = getIdx(originalHeader, 'quizId');
const idxContent = getIdx(originalHeader, 'content');
// Links start after content
const idxLink1Text = getIdx(originalHeader, 'link_1_text');

// Create Lookups
const primaryLookup = new Map<string, string[]>(); // key: bookId -> row
const secondaryLookup = new Map<string, string[]>(); // key: secBookId -> row

// Normalize function
const normalize = (s: string) => s ? s.replace(/%20/g, ' ').replace(/:/g, '.').trim() : '';

// Function to handle known typos in original.csv
const fixLookupKey = (key: string) => {
  if (!key) return key;
  // Handle Proverbs -> Provebs typo in original.csv
  if (key.startsWith('Proverbs.')) {
    return key.replace('Proverbs.', 'Provebs.');
  }
  // Handle Song of Solomon -> Songs
  if (key.startsWith('Song of Solomon.')) {
    return key.replace('Song of Solomon.', 'Songs.');
  }
  return key;
};

// Populate lookups
// Skip header
for (let i = 1; i < originalData.length; i++) {
  const row = originalData[i];
  if (row.length < 2) continue;
  
  const bookId = normalize(row[idxBookId]);
  
  const secBookId = normalize(row[idxSecBookId]);
  
  if (bookId && !primaryLookup.has(bookId)) {
    primaryLookup.set(bookId, row);
  }
  
  // For secondary, we just need ANY row that has this secondary ID
  if (secBookId && !secondaryLookup.has(secBookId)) {
    secondaryLookup.set(secBookId, row);
  }
}

const outputRows: string[][] = [];
// Output Header
const outputHeader = [
  'id', 'unitId', 'name', 'video-title', 'video-url', 'quizId', 'content',
  'link_1_text', 'link_1_url', 'link_2_text', 'link_2_url', 
  'link_3_text', 'link_3_url', 'link_4_text', 'link_4_url',
  'link_5_text', 'link_5_url', 'link_6_text', 'link_6_url', 
  'link_7_text', 'link_7_url', 'link_8_text', 'link_8_url'
];
outputRows.push(outputHeader);

// Process Target
const tIdxBookId = getIdx(targetHeader, 'Book id');
const tIdxSecBookId = getIdx(targetHeader, 'Secondary book id');
const tIdxUnitId = getIdx(targetHeader, 'unitId');
const tIdxId = getIdx(targetHeader, 'id');
const tIdxQuizId = getIdx(targetHeader, 'quizId');

let matchCount = 0;
let failCount = 0;

// Data structure to hold aggregation info
interface UnitAggregation {
  unitId: string;
  lessons: {
    rowIndex: number; // Index in outputRows
    meditationContent: string;
    name: string; // Add name to track lesson names
  }[];
}
const unitAggregations = new Map<string, UnitAggregation>();

for (let i = 1; i < targetData.length; i++) {
  const tRow = targetData[i];
  if (tRow.length < 2) continue;
  
  const tBookId = normalize(tRow[tIdxBookId]);
  
  const tSecBookId = normalize(tRow[tIdxSecBookId]);
  
  // Apply typo fix for lookup
  const lookupBookId = fixLookupKey(tBookId);
  const lookupSecBookId = fixLookupKey(tSecBookId);
  
  const unitId = tRow[tIdxUnitId];
  const id = tRow[tIdxId];
  // Prefer original quizId if available, else target? User said "take ... quizId ... add to first row".
  // Assuming "take from original". But if original not found, maybe use target?
  let targetQuizVal = tRow[tIdxQuizId]; 

  let primaryRow: string[] | undefined;
  
  if (lookupBookId) {
    primaryRow = primaryLookup.get(lookupBookId);
  }

  // Secondary lookup
  let secondaryRow: string[] | undefined;
  if (lookupSecBookId) {
    secondaryRow = secondaryLookup.get(lookupSecBookId);
  }

  if (!primaryRow && !secondaryRow) {
    console.warn(`Row ${i}: No match found for BookId="${tBookId}" (lookup="${lookupBookId}") or SecBookId="${tSecBookId}" (lookup="${lookupSecBookId}"). Skipping.`);
    failCount++;
    continue;
  }
  
  // If strict matching is required "If you find anything not matching, throw it":
  // If tBookId is present but not found -> throw?
  if (tBookId && !primaryRow) {
     console.warn(`Row ${i}: BookId="${tBookId}" (lookup="${lookupBookId}") specified but not found in original. Skipping.`);
     failCount++;
     continue;
  }
  // If tSecBookId is present but not found -> throw?
  if (tSecBookId && !secondaryRow) {
     console.warn(`Row ${i}: SecBookId="${tSecBookId}" (lookup="${lookupSecBookId}") specified but not found in original. Skipping.`);
     failCount++;
     continue;
  }

  // Construct output
  const newRow: string[] = [];
  
  newRow.push(id);
  newRow.push(unitId);
  
  let content = '';
  let meditationText = '';
  let lessonName = ''; // Track lesson name

  // Name, Video, Content from Primary
  if (primaryRow) {
    lessonName = primaryRow[idxName];
    
    // Fix format: Replace dots with colons in scripture references (e.g. "6.9-9.29" -> "6:9-9:29")
    lessonName = lessonName.replace(/(\d+)\.(\d+)/g, '$1:$2');

    newRow.push(lessonName);
    newRow.push(primaryRow[idxVideoTitle]);
    newRow.push(primaryRow[idxVideoUrl]);
    // QuizId: User said "take... quizId". If original has it, use it.
    const origQuiz = primaryRow[idxQuizId];
    newRow.push(origQuiz || targetQuizVal);
    
    // Process Content
    const rawContent = primaryRow[idxContent] || '';
    
    // Extract 默想經文
    const meditationRegex = /###\s*默想經文([\s\S]*?)(?=###|$)/;
    const match = rawContent.match(meditationRegex);
    
    if (match) {
      meditationText = match[1].trim();
      // Remove from content
      content = rawContent.replace(match[0], '').trim();
    } else {
      content = rawContent;
    }
    
    newRow.push(content);
    
    // Links 1-4 from Primary
    // idxLink1Text is the start
    // We want 4 pairs (8 columns)
    for (let k = 0; k < 8; k++) {
      let val = primaryRow[idxLink1Text + k];
      // Fix link_1_text (k=0) format: Replace dots with colons (e.g. "6.9-9.29" -> "6:9-9:29")
      if (k === 0 && val) {
         val = val.replace(/(\d+)\.(\d+)/g, '$1:$2');
      }
      newRow.push(val);
    }
  } else {
    // No primary row (empty BookId)
    // Fill with empty strings
    newRow.push(''); // Name
    newRow.push(''); // Video
    newRow.push(''); // Url
    newRow.push(targetQuizVal); // QuizId from target
    newRow.push(''); // Content
    for (let k = 0; k < 8; k++) newRow.push(''); // Links 1-4
  }
  
  // Links 5-8 from Secondary
  if (secondaryRow) {
    // Links start at idxLink1Text.
    // Links 5-8 start at idxLink1Text + 8.
    for (let k = 8; k < 16; k++) {
      let val = secondaryRow[idxLink1Text + k];
      // Fix link_5_text (k=8) format: Replace dots with colons
      if (k === 8 && val) {
          val = val.replace(/(\d+)\.(\d+)/g, '$1:$2');
      }
      newRow.push(val);
    }
  } else {
    for (let k = 0; k < 8; k++) newRow.push('');
  }

  // Store raw row (escape later)
  outputRows.push(newRow);
  matchCount++;

  // Track for aggregation
  if (!unitAggregations.has(unitId)) {
    unitAggregations.set(unitId, { unitId, lessons: [] });
  }
  unitAggregations.get(unitId)?.lessons.push({
    rowIndex: outputRows.length - 1, // Current row index
    meditationContent: meditationText,
    name: lessonName
  });
}

// Perform Aggregation and Unit Naming
console.log('Performing aggregation of meditation scriptures and generating unit names...');
const unitNames = new Map<string, string>();

for (const [unitId, data] of unitAggregations.entries()) {
  const lessons = data.lessons;
  if (lessons.length === 0) continue;

  // Filter out lessons with empty names (e.g. Psalms/Meditations without primary row)
  const validLessons = lessons.filter(l => l.name && l.name.trim() !== '');

  // Generate Unit Name
  // Format: "第X週 StartBook StartChap[-EndBook EndChap]"
  
  // Extract week number from unitId (unit_qlzx_2728_weekX)
  const weekMatch = unitId.match(/week(\d+)/);
  const weekNum = weekMatch ? weekMatch[1] : '';
  const weekTitle = weekNum ? `第${weekNum}週` : '';

  let unitName = weekTitle;

  if (validLessons.length > 0) {
      const firstLessonName = validLessons[0].name.trim();
      const lastLessonName = validLessons[validLessons.length - 1].name.trim();

      // Helper to parse "Book Chapter.Verse" or "Book Chapter-Verse"
      // Expected formats: "Genesis 1.1-2.3", "創世記 1.1-2.3", "撒加利亞書 9-11"
      // Split by space to get Book and Ref
      const parseName = (name: string) => {
          const parts = name.split(' ');
          if (parts.length < 2) return { book: name, ref: '' };
          const book = parts[0];
          const ref = parts.slice(1).join(' '); // rest is ref
          return { book, ref };
      };

      const first = parseName(firstLessonName);
      const last = parseName(lastLessonName);

      if (first.book === last.book) {
          // Same book
          const getStart = (ref: string) => ref.split('-')[0]; // "1.1" from "1.1-2.3"
          const getEnd = (ref: string) => {
              const parts = ref.split('-');
              return parts.length > 1 ? parts[parts.length - 1] : parts[0];
          };

          const startRef = getStart(first.ref);
          const endRef = getEnd(last.ref);
          
          unitName += ` ${first.book} ${startRef}-${endRef}`;
      } else {
          // Different books
          // "FirstBook FirstRefStart-LastBook LastRefEnd"
          const getStart = (ref: string) => ref.split('-')[0];
          const getEnd = (ref: string) => {
               const parts = ref.split('-');
               return parts.length > 1 ? parts[parts.length - 1] : parts[0];
          };
          
          const startRef = getStart(first.ref);
          const endRef = getEnd(last.ref);
          
          unitName += ` ${first.book} ${startRef}-${last.book} ${endRef}`;
      }
  }
  
  // Store generated name
  unitNames.set(unitId, unitName);

  if (unitId === 'unit_qlzx_2728_week104') continue;

  // Aggregation Logic
  let aggregatedText = '\n\n【本週默想經文】';
  let hasMeditation = false;

  lessons.forEach((lesson, index) => {
      if (lesson.meditationContent) {
          hasMeditation = true;
          aggregatedText += `\n* 第${index + 1}天 ${lesson.meditationContent}`;
      }
  });

  if (hasMeditation) {
      // Add to the last lesson of the unit
      const lastLessonIdx = lessons[lessons.length - 1].rowIndex;
      // Content is at index 6
      const currentContent = outputRows[lastLessonIdx][6];
      outputRows[lastLessonIdx][6] = currentContent + aggregatedText;
  }
}

console.log(`Processed ${outputRows.length - 1} rows.`);
console.log(`Matches: ${matchCount}, Failed/Skipped: ${failCount}`);

// Add Unit Name column to CSV
// Update Header
outputRows[0].push('unit_name');

// Update Rows
const unitIdIdx = 1; // unitId is at index 1 in outputHeader
for (let i = 1; i < outputRows.length; i++) {
  const row = outputRows[i];
  const unitId = row[unitIdIdx];
  const unitName = unitNames.get(unitId) || '';
  row.push(unitName);
}

// Write Unit Names to a separate file (keeping this for backup/reference)
const unitNamesObj = Object.fromEntries(unitNames);
fs.writeFileSync(path.resolve(process.cwd(), 'src/data/backups/unit_names.json'), JSON.stringify(unitNamesObj, null, 2));
console.log('Unit names written to src/data/backups/unit_names.json');

// Apply escaping at the very end
const csvContent = outputRows.map(row => row.map(escapeCsv).join(',')).join('\n');
fs.writeFileSync(outputCsvPath, csvContent);
console.log(`Written to ${outputCsvPath}`);