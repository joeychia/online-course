import { Lesson } from '../types';

/**
 * Calculates the current day of the study plan.
 * Day 1 is the startDate.
 */
export function calculateStudyDay(startDateStr: string): number {
  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays + 1;
}

/**
 * Extracts snippets from lesson content.
 * Specifically looks for "讀經" and "默想經文".
 */
export function extractLessonSnippets(content: string): { reading?: string; meditation?: string } {
  const result: { reading?: string; meditation?: string } = {};
  
  // Try to find reading (讀經)
  // Usually looks like: * 讀經：創世記 1:1-2:3
  const readingMatch = content.match(/[\*•]\s*讀經[：:]\s*([^\n]+)/);
  if (readingMatch) {
    result.reading = readingMatch[1].trim();
  }
  
  // Try to find meditation (默想經文)
  // Usually looks like: * 默想經文：創世記 1:1
  const meditationMatch = content.match(/[\*•]\s*默想經文[：:]\s*([^\n]+)/);
  if (meditationMatch) {
    result.meditation = meditationMatch[1].trim();
  }
  
  return result;
}

/**
 * Gets the lesson ID for a specific day.
 */
export function getLessonIdForDay(day: number): string {
  return `lesson_qlzx_day${day}`;
}
