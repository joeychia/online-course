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
  Container,
  Grid,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { mockCourses } from '../mockData';
import { Course, Unit, Lesson } from '../types';
import RichTextEditor from '../components/RichTextEditor';

interface LessonListProps {
  unit: Unit;
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonId?: string;
}

const StyledListItem = styled(ListItemButton)(({ theme }) => ({
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light,
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
    }
  }
}));

const LessonList = ({ unit, onSelectLesson, selectedLessonId }: LessonListProps) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2">{unit.name}</Typography>
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={60} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            60% Complete
          </Typography>
        </Box>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {Object.values(unit.lessons).map((lesson) => (
          <StyledListItem
            key={lesson.id}
            onClick={() => onSelectLesson(lesson)}
            selected={selectedLessonId === lesson.id}
          >
            <Typography>{lesson.name}</Typography>
          </StyledListItem>
        ))}
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
}

const LessonContent = ({ lesson, onNext, onPrevious, hasNext, hasPrevious }: LessonContentProps) => {
  const [note, setNote] = useState<string>(
    lesson?.notes?.content || "### My Notes\n\nAdd your notes here..."
  );

  const handleSaveNote = () => {
    if (lesson && note) {
      console.log('Saving note:', note);
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
        <Typography variant="h4" component="h1" gutterBottom>
          {lesson.name}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography color="text.secondary">
            Estimated time: 30 mins
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
          <Typography variant="h6">Personal Notes</Typography>
          <Button 
            onClick={handleSaveNote}
            variant="contained"
            color="primary"
          >
            Save Notes
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

export default function CourseView() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const course = mockCourses.find((c) => c.id === courseId);
  const unit = course?.units[unitId || ''];

  if (!course || !unit) {
    return <Typography>Course or unit not found</Typography>;
  }

  const lessons = Object.values(unit.lessons);
  const currentIndex = selectedLesson ? lessons.findIndex(l => l.id === selectedLesson.id) : -1;
  const hasNext = currentIndex < lessons.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setSelectedLesson(lessons[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setSelectedLesson(lessons[currentIndex - 1]);
    }
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
        />
      </Box>
    </Paper>
  );
} 