import { useState, useEffect } from 'react';
import { Viewer } from '@toast-ui/react-editor';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Stack,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Lesson } from '../types';
import RichTextEditor from '../components/RichTextEditor';

interface LessonViewProps {
  lesson: Lesson | null;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onComplete?: (lessonId: string) => void;
  isCompleted?: boolean;
}

export default function LessonView({ 
  lesson, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious,
  onComplete,
  isCompleted 
}: LessonViewProps) {
  const [note, setNote] = useState<string>("");

  // Reset note when lesson changes
  useEffect(() => {
    setNote("");
  }, [lesson?.id]);

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
        <Viewer 
          key={lesson.id}
          initialValue={lesson.content} 
        />
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
} 