# Changelog - December 2025

## Highlights

This month's development focused on launching the new course **"Qian Li Zhi Xing" (Version 2627)**, implementing a Daily Study Plan feature, and establishing a data pipeline for course content generation.

## 🚀 New Features & Content Creation

### 1. New Course Content Pipeline
We established a streamlined process to generate and update content for the "Qian Li Zhi Xing" course.

*   **Source Data**: The course content (lessons, videos, text) was managed in a CSV format (`src/data/backups/qlzx_2627.csv`). This allowed for easier content editing and organization outside the codebase.
*   **Transformation Scripts**:
    *   We created `src/scripts/reconstructCourseJson.ts` to parse the CSV file.
    *   The script automatically maps CSV fields (Lesson Name, Video Title, Video URL, Content) to our JSON data model.
    *   It handles the merging of this new content into the existing course structure, ensuring data consistency.
*   **Data Migration**:
    *   Implemented `src/scripts/mergeCourseData.ts` to handle complex data merging scenarios.
    *   Added scripts for backup processing (`f5495d5`) to ensure data safety during updates.

#### Script Usage
To run the content reconstruction pipeline:
```bash
npx tsx src/scripts/reconstructCourseJson.ts
```
This script reads from `src/data/backups/qlzx_2627.csv` and generates `src/data/backups/course-qianlizhixing-2627-reconstructed.json`.

### 2. Daily Study Plan Feature
A new, specialized view was implemented for the "Qian Li Zhi Xing" course to support a daily devotional/study format.

*   **Dynamic Schedule**: The system now calculates the current "Study Day" dynamically based on a fixed start date (January 1, 2026).
*   **Daily Content**:
    *   The `CourseView` was updated to display specific "Reading" (Reading) and "Meditation" (Meditation) sections for each day.
    *   Content is automatically extracted from the lesson text using intelligent parsing logic.
*   **Localization**: Added full support for Traditional and Simplified Chinese for all new UI elements (Welcome messages, Plan headers, etc.).

## 🛠 Improvements & Fixes

### User Experience
*   **Login Forms**: Fixed an issue where form fields lacked `name` attributes (`8c8706c`), improving accessibility and enabling browser password managers to work correctly.
*   **Public Access**: Refined the logic for public course previews and added clear prompts for users to log in when necessary (`0ed0a44`).

### Codebase & Maintenance
*   **Script Refactoring**: Removed unused CSV parser implementations to clean up the codebase (`300884a`).
*   **Documentation**: Updated `requirements.md` and `README.md` to accurately reflect the current feature set and project status (`67cce76`).
*   **Course Data**: Updated the core course data version from 2728 to 2627 to align with the new content strategy (`ecd9534`).

## 📊 Technical Details
*   **Commits**: 
    *   `046a35a`: feat(course): add daily study plan feature with translations
    *   `ecd9534`: feat(course): update course data version from 2728 to 2627
    *   `f5495d5`: feat(scripts): add data transformation scripts for course backup processing
