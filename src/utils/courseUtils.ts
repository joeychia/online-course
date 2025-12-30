/**
 * Calculates the current day of the study plan.
 * Day 1 is the startDate.
 */
export function calculateStudyDay(startDateValue: any): number {
  if (!startDateValue) return 0;

  let startDate: Date;

  if (typeof startDateValue === 'string') {
    startDate = new Date(startDateValue);
  } else if (startDateValue instanceof Date) {
    startDate = startDateValue;
  } else if (typeof startDateValue === 'object' && startDateValue.toDate && typeof startDateValue.toDate === 'function') {
    // Firebase JS SDK Timestamp
    startDate = startDateValue.toDate();
  } else if (typeof startDateValue === 'object' && (startDateValue._seconds || startDateValue.seconds)) {
    // Plain object representation of Timestamp (common in some serialization/mocking)
    const seconds = startDateValue._seconds || startDateValue.seconds;
    const nanoseconds = startDateValue._nanoseconds || startDateValue.nanoseconds || 0;
    startDate = new Date(seconds * 1000 + nanoseconds / 1000000);
  } else {
    startDate = new Date(startDateValue);
  }

  if (isNaN(startDate.getTime())) {
    console.error('Invalid startDate provided to calculateStudyDay:', startDateValue);
    return 0;
  }

  startDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays + 1;
}

/**
 * Calculates the calendar date for a specific study day number.
 * Day 1 is the startDate.
 */
export function getScheduledDate(startDateValue: any, dayNumber: number): Date | null {
  if (!startDateValue || dayNumber < 1) return null;

  let startDate: Date;

  if (typeof startDateValue === 'string') {
    startDate = new Date(startDateValue);
  } else if (startDateValue instanceof Date) {
    startDate = startDateValue;
  } else if (typeof startDateValue === 'object' && startDateValue.toDate && typeof startDateValue.toDate === 'function') {
    // Firebase JS SDK Timestamp
    startDate = startDateValue.toDate();
  } else if (typeof startDateValue === 'object' && (startDateValue._seconds || startDateValue.seconds)) {
    // Plain object representation of Timestamp
    const seconds = startDateValue._seconds || startDateValue.seconds;
    const nanoseconds = startDateValue._nanoseconds || startDateValue.nanoseconds || 0;
    startDate = new Date(seconds * 1000 + nanoseconds / 1000000);
  } else {
    startDate = new Date(startDateValue);
  }

  if (isNaN(startDate.getTime())) {
    console.error('Invalid startDate provided to getScheduledDate:', startDateValue);
    return null;
  }

  startDate.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + dayNumber - 1);
  
  return targetDate;
}

/**
 * Extracts reading and meditation snippets from lesson content.
 */
export function extractLessonSnippets(lesson: any): { reading: string; meditation: string } {
  const content = lesson?.content || '';
  const name = lesson?.name || '';
  
  let reading = '';
  let meditation = '';

  // Try to find reading in content
  const readingMatch = content.match(/(?:讀經|Reading)[：:]\s*(.*)/i);
  if (readingMatch) {
    reading = readingMatch[1].split('\n')[0].trim();
  } else {
    // If not in content, use the lesson name as reading
    reading = name;
  }

  // Try to find meditation in content
  const meditationMatch = content.match(/(?:默想經文|Meditation|### 默想經文)[：:]\s*(.*)/i);
  if (meditationMatch) {
    meditation = meditationMatch[1].split('\n')[0].trim();
  } else {
    // Try multi-line meditation (common in some formats)
    const lines = content.split('\n');
    const medIdx = lines.findIndex((l: string) => l.includes('默想經文') || l.includes('Meditation'));
    if (medIdx !== -1 && medIdx + 1 < lines.length) {
      // Find the first non-empty line after the header
      for (let i = medIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#')) {
          meditation = line;
          break;
        }
      }
    }
  }

  // Clean up markdown links if present in snippets
  const cleanSnippet = (text: string) => {
    return text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').trim();
  };

  return {
    reading: cleanSnippet(reading),
    meditation: cleanSnippet(meditation)
  };
}

/**
 * Gets the lesson ID for a specific day.
 */
export function getLessonIdForDay(day: number, courseId: string): string {
  // If it's the qlzx 2627 course, use lesson_qlzx_dayX as requested
  if (courseId === 'course_qianlizhixing_2627') {
    return `lesson_qlzx_day${day}`;
  }
  
  // Fallback for other courses or future qlzx courses
  if (courseId.includes('qlzx')) {
    return `lesson_qlzx_day${day}`;
  }
  
  return `lesson_${day}`;
}
