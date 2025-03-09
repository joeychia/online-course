# Course Card Reuse Action Plan

## Background

The online course platform currently has two separate card implementations:
1. Course cards on the home page (CourseList.tsx)
2. Course cards in the admin view (CourseListItem.tsx)

This task involves refactoring the admin view to reuse the course cards from the home page, improving consistency and maintainability.

## Current Implementation

### Home Page (CourseList.tsx)
- Renders course cards directly in the component
- Each card displays:
  - Course title
  - "View Description" button that opens a dialog with course description
  - "Register Course" or "Enter Course" button depending on registration status
- Uses Material UI Card components with consistent styling

### Admin View (CourseManagement.tsx & CourseListItem.tsx)
- Uses a separate `CourseListItem` component
- Different styling and layout compared to the home page cards
- Includes expandable description functionality
- Uses CardActionArea for the entire card to be clickable

## Required Changes

1. Create a reusable CourseCard component based on the home page implementation
2. Update the admin view to use this component instead of CourseListItem
3. Modify the primary action button text to "管理课程" (Manage Course) for admin view
4. Ensure the admin view card click behavior remains the same

## Implementation Plan

### Step 1: Create CourseCard Component

Create a new file at `src/components/CourseCard.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import { Course } from '../types';
import { convertChinese } from '../utils/chineseConverter';
import MarkdownViewer from './MarkdownViewer';

interface CourseCardProps {
  course: Course;
  onPrimaryAction: () => void;
  primaryActionText: string;
  language?: 'zh-TW' | 'zh-CN';
  showDescriptionButton?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPrimaryAction,
  primaryActionText,
  language = 'zh-TW',
  showDescriptionButton = true,
}) => {
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);

  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDescriptionDialogOpen(true);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              flexGrow: 1,
              fontSize: 'var(--font-size-h6)',
            }}
          >
            {convertChinese(course.name, language)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="space-between">
          {showDescriptionButton && (
            <Button
              startIcon={<DescriptionIcon />}
              onClick={handleDescriptionClick}
              size="small"
            >
              {convertChinese('查看介紹', language)}
            </Button>
          )}
          <Button
            onClick={onPrimaryAction}
            size="small"
            variant="contained"
          >
            {primaryActionText}
          </Button>
        </Stack>
      </CardContent>

      <Dialog
        open={descriptionDialogOpen}
        onClose={() => setDescriptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
          {convertChinese(course.name, language)}
          <IconButton
            onClick={() => setDescriptionDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box>
            <MarkdownViewer
              content={convertChinese(course.description, language)}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CourseCard;
```

### Step 2: Update CourseList.tsx

Modify `src/pages/CourseList.tsx` to use the new CourseCard component:

1. Import the CourseCard component
2. Replace the current card implementation with CourseCard
3. Pass the appropriate props

Key changes:
```typescript
import CourseCard from '../components/CourseCard';

// Inside the render function, replace the current Card implementation with:
<Grid item xs={12} sm={6} md={4} key={course.id}>
  <CourseCard
    course={course}
    onPrimaryAction={() => isRegistered ? navigate(`/${course.id}`) : handleRegisterCourse(course)}
    primaryActionText={isRegistered ? t('enterCourse') : t('registerCourse')}
    language={language}
    showDescriptionButton={true}
  />
</Grid>
```

### Step 3: Update CourseManagement.tsx

Modify `src/components/admin/CourseManagement.tsx` to use the CourseCard component instead of CourseListItem:

1. Import the CourseCard component
2. Replace the CourseListItem usage with CourseCard
3. Pass the appropriate props

Key changes:
```typescript
import CourseCard from '../../components/CourseCard';
import { useTranslation } from '../../hooks/useTranslation';

// Inside the component:
const { language } = useTranslation();

// Replace the CourseListItem usage with:
<Grid item xs={12} sm={6} md={4} key={course.id}>
  <CourseCard
    course={course}
    onPrimaryAction={() => {
      setSelectedCourseId(course.id);
      navigate(`/admin/courses/${course.id}`);
    }}
    primaryActionText="管理课程"
    language={language}
    showDescriptionButton={true}
  />
</Grid>
```

### Step 4: Remove CourseListItem.tsx

Once the changes are verified, the `src/components/admin/CourseListItem.tsx` file can be removed as it's no longer needed.

### Step 5: Update Tests

Update the affected test files:
1. `src/__tests__/CourseList.test.tsx`
2. `src/__tests__/CourseManagement.test.tsx`

Ensure tests are updated to reflect the new component structure and props.

## Testing Requirements

1. Verify the home page course cards still function correctly:
   - Course titles display properly
   - "View Description" button opens the description dialog
   - "Register Course" / "Enter Course" buttons work as expected

2. Verify the admin view course cards:
   - Display with the same styling as home page cards
   - Show "管理课程" as the primary action button
   - Navigate to the course editor when clicked
   - Description dialog works correctly

3. Run all tests to ensure no regressions:
   ```
   npm run test:auto
   ```

4. Verify the build completes successfully:
   ```
   npm run build
   ```

## Potential Challenges

1. **Translation Handling**: Ensure the "管理课程" text is properly handled by the translation system if needed.

2. **Dialog Management**: The description dialog is now managed within the CourseCard component rather than in the parent components. Ensure this doesn't cause any issues with dialog stacking or event propagation.

3. **Grid Layout Differences**: The current admin view uses a different grid layout than the home page. Adjustments may be needed to maintain proper spacing and alignment.

4. **Test Updates**: Tests may need significant updates if they were relying on specific DOM structures or test IDs that have changed.

## Completion Criteria

The task is complete when:
1. A reusable CourseCard component is created
2. Both the home page and admin view use this component
3. The admin view cards show "管理课程" as the primary action
4. All functionality is preserved
5. All tests pass
6. The build completes successfully
