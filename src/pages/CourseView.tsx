import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Viewer } from '@toast-ui/react-editor';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress,
  List,
  ListItemButton,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';
import { Course, Unit, Lesson, UserProfile } from '../types';
import RichTextEditor from '../components/RichTextEditor';

interface LessonListProps {
  unit: Unit;
  lessons: { [key: string]: Lesson };
  progress: { [key: string]: { completed: boolean } };
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonId?: string;
}

const StyledListItem = styled(ListItemButton)(({ theme }) => ({
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light,
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
    }
  },
  '&.Mui-disabled': {
    opacity: 0.7,
    cursor: 'not-allowed'
  }
}));

const LessonList = ({ unit, lessons, progress, onSelectLesson, selectedLessonId }: LessonListProps) => {
  const unitLessons = Object.values(lessons)
    .filter(lesson => lesson.unitId === unit.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const completedCount = Object.values(progress).filter(p => p.completed).length;
  const totalCount = unitLessons.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const isLessonAccessible = (lesson: Lesson) => {
    if (lesson.orderIndex === 1) return true;
    const previousLesson = unitLessons.find(l => l.orderIndex === lesson.orderIndex - 1);
    return previousLesson ? progress[previousLesson.id]?.completed : false;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2">{unit.name}</Typography>
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progressPercentage} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {completedCount} of {totalCount} completed ({Math.round(progressPercentage)}%)
          </Typography>
        </Box>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {unitLessons.map((lesson) => {
          const isAccessible = isLessonAccessible(lesson);
          const isCompleted = progress[lesson.id]?.completed;

          return (
            <StyledListItem
              key={lesson.id}
              onClick={() => isAccessible && onSelectLesson(lesson)}
              selected={selectedLessonId === lesson.id}
              disabled={!isAccessible}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <Typography sx={{ flex: 1 }}>{lesson.name}</Typography>
                {isCompleted ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : !isAccessible ? (
                  <LockIcon color="disabled" fontSize="small" />
                ) : null}
              </Stack>
            </StyledListItem>
          );
        })}
      </List>
    </Box>
  );
};

interface LessonContentProps {
  lesson: Lesson | null;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onComplete?: (lessonId: string) => void;
  isCompleted?: boolean;
}

const LessonContent = ({ 
  lesson, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious,
  onComplete,
  isCompleted 
}: LessonContentProps) => {
  const [note, setNote] = useState<string>("");

  const handleSaveNote = () => {
    if (lesson && note) {
      // Here you would typically save the note to your backend
      console.log('Saving note:', { lessonId: lesson.id, note });
      // Mark lesson as completed when note is saved
      onComplete?.(lesson.id);
    }
  };

  if (!lesson) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography color="text.secondary">
          Select a lesson to view its content
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4" component="h1">
            {lesson.name}
          </Typography>
          {isCompleted && (
            <Tooltip title="Lesson completed">
              <CheckCircleIcon color="success" />
            </Tooltip>
          )}
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography color="text.secondary">
            Lesson {lesson.orderIndex}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={onPrevious}
              disabled={!hasPrevious}
              variant="outlined"
              startIcon={<span>←</span>}
            >
              Previous
            </Button>
            <Button
              onClick={onNext}
              disabled={!hasNext}
              variant="outlined"
              endIcon={<span>→</span>}
            >
              Next
            </Button>
          </Stack>
        </Stack>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Viewer initialValue={lesson.content} />
      </Box>
      
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">
            Personal Notes
            <Typography variant="body2" color="text.secondary">
              You must write a note to complete this lesson
      </Typography>
      </Typography>
          <Button 
            onClick={handleSaveNote}
            variant="contained"
            color="primary"
            disabled={!note.trim()}
          >
            Save Notes & Complete Lesson
          </Button>
        </Stack>
        <RichTextEditor
          value={note}
          onChange={setNote}
          placeholder="Write your notes here..."
        />
      </Paper>
    </Box>
  );
};

interface CourseData {
  courses: { [key: string]: Course };
  units: { [key: string]: Unit };
  lessons: { [key: string]: Lesson };
  users: { [key: string]: UserProfile };
}

// This would come from your data fetching layer
const mockData: CourseData = {
  courses: {},
  units: {},
  lessons: {},
  users: {}
};

export default function CourseView() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const course = mockData.courses[courseId || ''];
  const unit = mockData.units[unitId || ''];
  const currentUser = mockData.users['demo_user']; // In a real app, this would come from auth
  const userProgress = currentUser?.progress[courseId || ''] || {};

  if (!course || !unit) {
    return <Typography>Course or unit not found</Typography>;
  }

  const unitLessons = Object.values(mockData.lessons)
    .filter(lesson => lesson.unitId === unit.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const currentIndex = selectedLesson ? unitLessons.findIndex(l => l.id === selectedLesson.id) : -1;
  const hasNext = currentIndex < unitLessons.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setSelectedLesson(unitLessons[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setSelectedLesson(unitLessons[currentIndex - 1]);
    }
  };

  const handleComplete = (lessonId: string) => {
    // In a real app, this would update the backend
    console.log('Marking lesson as completed:', lessonId);
    userProgress[lessonId] = { completed: true };
  };

  return (
    <Paper sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 64px)', 
      overflow: 'hidden',
      borderRadius: 1
    }}>
      <Box sx={{ width: 320, borderRight: 1, borderColor: 'divider' }}>
        <LessonList
          unit={unit}
          lessons={mockData.lessons}
          progress={userProgress}
          onSelectLesson={setSelectedLesson}
          selectedLessonId={selectedLesson?.id}
        />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <LessonContent 
          lesson={selectedLesson}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onComplete={handleComplete}
          isCompleted={selectedLesson ? userProgress[selectedLesson.id]?.completed : false}
        />
      </Box>
    </Paper>
  );
} 