import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取原始数据
let data;
try {
  const rawData = fs.readFileSync(path.join(__dirname, '../data/lessonData.json'), 'utf8');
  data = JSON.parse(rawData);
  
  if (!data || !data.courses) {
    throw new Error('Invalid data structure: missing courses object');
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Error: lessonData.json file not found');
  } else {
    console.error('Error reading or parsing lessonData.json:', error.message);
  }
  process.exit(1);
}

// 创建新的数据结构
const filteredData = {
  settings: data.settings || {},
  groupIds: data.groupIds || {},
  units: {},
  lessons: {}
};

console.log('Starting to filter weekly lessons...');

// 遍历课程中的所有单元
const course = data.courses ? data.courses.course_qianlizhixing : null;
if (!course || !Array.isArray(course.units)) {
  console.error('Course has invalid units structure');
  process.exit(1);
}

course.units.forEach((unit) => {
  console.log(`Processing unit: ${unit.name}`);
  
  // 获取单元对应的课程
  const unitLessons = data.lessons ? Object.entries(data.lessons)
    .filter(([_, lesson]) => lesson.unitId === unit.id) : [];
  
  let hasWeeklyLesson = false;
  
  unitLessons.forEach(([lessonId, lesson]) => {
    // 检查课程内容是否包含周测验或周回顧链接
    if (lesson.content && (
      lesson.content.includes('本週測驗題') || 
      lesson.content.includes('本週經文回顧')
    )) {
      console.log(`Found weekly lesson in unit ${unit.name}: ${lesson.name}`);
      
      // 移除这两个链接
      let newContent = lesson.content;
      newContent = newContent.replace(/【<a href=[^>]+>本週經文回顧:[^<]+<\/a>】\n\n/g, '');
      newContent = newContent.replace(/【<a href=[^>]+>本週測驗題<\/a>】\n\n/g, '');
      
      // 添加到lessons中
      filteredData.lessons[lessonId] = {
        ...lesson,
        content: newContent
      };
      
      hasWeeklyLesson = true;
    }
  });
  
  // 只添加包含周测验的单元
  if (hasWeeklyLesson) {
    filteredData.units[unit.id] = {
      id: unit.id,
      name: unit.name,
      lessons: {}
    };
  }
});

// 将结果写入新文件
const outputPath = path.join(__dirname, '../data/weeklyLessons.json');
fs.writeFileSync(outputPath, JSON.stringify(filteredData, null, 2));
console.log('Weekly lessons have been filtered and saved to weeklyLessons.json');