const fs = require('fs');
const path = require('path');

// Read the lessonData.json file
const lessonDataPath = path.join(__dirname, '../data/lessonData.json');
const data = JSON.parse(fs.readFileSync(lessonDataPath, 'utf8'));

// Function to process the content
function processContent(content) {
  if (!content) return content;

  // Process date and author swap
  let processedContent = content.replace(/\((\d{4}-\d{2}-\d{2})\)([\s\S]*?)Zhuolin/g, '作者: Zhuolin$2$1');

  // Remove backtick quotations
  processedContent = processedContent.replace(/`([^`]+)`/g, '$1');

  // Remove specific links (both Markdown and HTML)
  processedContent = processedContent.replace(/\[本週經文回顧\]\([^)]+\)/g, '');
  processedContent = processedContent.replace(/\[本週測驗題\]\([^)]+\)/g, '');
  processedContent = processedContent.replace(/<a[^>]*>本週經文回顧<\/a>/g, '');
  processedContent = processedContent.replace(/<a[^>]*>本週測驗題<\/a>/g, '');

  // Remove specific headers
  processedContent = processedContent.replace(/### 禱告：\n?/g, '');
  processedContent = processedContent.replace(/### 筆記與回應：\n?/g, '');

  return processedContent;
}

// Process all lessons
function processLessons(data) {
  for (const courseId in data.courses) {
    const course = data.courses[courseId];
    if (course.lessons) {
      for (const lessonId in course.lessons) {
        const lesson = course.lessons[lessonId];
        if (lesson.content) {
          lesson.content = processContent(lesson.content);
        }
      }
    }
  }
  return data;
}

// Process the data
const processedData = processLessons(data);

// Write the processed data back to file
fs.writeFileSync(
  lessonDataPath,
  JSON.stringify(processedData, null, 2),
  'utf8'
);

console.log('Lesson data processing completed!');