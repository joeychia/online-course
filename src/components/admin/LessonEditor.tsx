import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Lesson } from '../../types';
import { getLesson, updateLesson } from '../../services/dataService';
import RichTextEditor from '../RichTextEditor';
import QuizEditor from './QuizEditor';

interface LessonEditorProps {
  unitId: string;
  lessonId: string;
  onClose: () => void;
  onSave: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  lessonId,
  onClose,
  onSave
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const loadedLesson = await getLesson(lessonId);
      setLesson(loadedLesson);
    } catch (error) {
      console.error('Error loading lesson:', error);
      setLesson(null);
    }
  };

  const handleSave = async () => {
    if (!lesson) return;

    try {
      await updateLesson(lessonId, {
        name: lesson.name,
        content: lesson.content,
        'video-title': lesson['video-title'],
        'video-url': lesson['video-url'],
        quizId: lesson.quizId
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Lesson: {lesson?.name}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} my={2}>
          <TextField
            label="Lesson Name"
            fullWidth
            value={lesson?.name || ''}
            onChange={(e) => setLesson(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
          
          <TextField
            label="Video Title"
            fullWidth
            value={lesson?.['video-title'] || ''}
            onChange={(e) => setLesson(prev => prev ? { ...prev, 'video-title': e.target.value } : null)}
          />

          <TextField
            label="Video URL"
            fullWidth
            value={lesson?.['video-url'] || ''}
            onChange={(e) => setLesson(prev => prev ? { ...prev, 'video-url': e.target.value } : null)}
          />

          <Box>
            <RichTextEditor
              value={lesson?.content || ''}
              onChange={(content) => setLesson(prev => prev ? { ...prev, content } : null)}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              onClick={() => setIsQuizEditorOpen(true)}
            >
              {lesson?.quizId ? 'Edit Quiz' : 'Add Quiz'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>

      {isQuizEditorOpen && (
        <QuizEditor
          quizId={lesson?.quizId}
          onSave={async (quizId: string) => {
            setLesson(prev => prev ? { ...prev, quizId } : null);
            setIsQuizEditorOpen(false);
          }}
        />
      )}
    </Dialog>
  );
};