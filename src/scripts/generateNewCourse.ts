import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Course, Unit, Lesson, Quiz } from '../types';

// Load the backup data
const backupPath = join(process.cwd(), 'src/data/backups/full-backup-2025-12-21T05-43-34-963Z.json');
const backupData = JSON.parse(readFileSync(backupPath, 'utf-8'));

// Get the source course
const sourceCourseId = 'course_qianlizhixing';
const sourceCourse = backupData.courses[sourceCourseId] as Course;

if (!sourceCourse) {
    console.error(`Course ${sourceCourseId} not found in backup`);
    process.exit(1);
}

// Create new course ID
const newCourseId = 'course_qianlizhixing_2728';

// Create new course object based on source
const newCourse: Course = {
    ...sourceCourse,
    id: newCourseId,
    name: `${sourceCourse.name} (27-28)`,
    units: [] // Will be populated with new unit objects
};

// Data structures for the new export
interface ExportData {
    courses: { [key: string]: Course };
    units: { [key: string]: Unit };
    lessons: { [key: string]: Lesson };
    quizzes: { [key: string]: Quiz };
}

const newExportData: ExportData = {
    courses: {
        [newCourseId]: newCourse
    },
    units: {},
    lessons: {}, // We will reference existing lessons
    quizzes: {}  // We will reference existing quizzes
};

// Process units
// Clone units but keep lesson references
for (const sourceUnitInfo of sourceCourse.units) {
    const sourceUnitId = sourceUnitInfo.id;
    const sourceUnit = backupData.units[sourceUnitId] as Unit;
    
    if (!sourceUnit) {
        console.warn(`Unit ${sourceUnitId} not found in backup, skipping`);
        continue;
    }

    // Generate new unit ID
    const newUnitId = `${sourceUnitId}_2728`;

    // Create new unit object
    const newUnit: Unit = {
        ...sourceUnit,
        id: newUnitId,
        courseId: newCourseId,
        // lessons array in Unit object contains {id, name, hasQuiz}
        // We keep the same lesson IDs to reuse content
        lessons: sourceUnit.lessons.map((lesson: any) => ({
            ...lesson
        }))
    };

    // Add to new course units list
    newCourse.units.push({
        id: newUnitId,
        name: sourceUnitInfo.name,
        lessonCount: sourceUnitInfo.lessonCount,
        openDate: sourceUnitInfo.openDate
    });

    // Add to export data
    newExportData.units[newUnitId] = newUnit;
    
    // Copy referenced lessons and quizzes to the new export data
    // This ensures the restore script has the data it needs
    for (const lessonInfo of sourceUnit.lessons) {
        const lessonId = lessonInfo.id;
        const lesson = backupData.lessons[lessonId] as Lesson;
        
        if (lesson) {
            newExportData.lessons[lessonId] = lesson;
            
            if (lesson.quizId) {
                const quiz = backupData.quizzes[lesson.quizId] as Quiz;
                if (quiz) {
                    newExportData.quizzes[lesson.quizId] = quiz;
                }
            }
        }
    }
}

// Write the new export file
const outputPath = join(process.cwd(), 'src/data/backups/course-qianlizhixing-2728.json');
writeFileSync(outputPath, JSON.stringify(newExportData, null, 2));

console.log(`Generated new course data at ${outputPath}`);
console.log(`New Course ID: ${newCourseId}`);
console.log(`Cloned ${newCourse.units.length} units`);