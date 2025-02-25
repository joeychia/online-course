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
  unitId,
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
      if (loadedLesson) {
        // Ensure unitId is set from props
        setLesson({ ...loadedLesson, unitId });
      } else {
        setLesson(null);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setLesson(null);
    }
  };

  const handleSave = async () => {
    if (!lesson) return;

    try {
      // Start with required fields
      const { name, content, quizId, unitId } = lesson;
      const updateData: Partial<Lesson> = { name, content, quizId, unitId };

      // Only include video fields if they exist and are non-empty strings
      if (typeof lesson['video-title'] === 'string' && lesson['video-title'].length > 0) {
        updateData['video-title'] = lesson['video-title'];
      }
      if (typeof lesson['video-url'] === 'string' && lesson['video-url'].length > 0) {
        updateData['video-url'] = lesson['video-url'];
      }

      await updateLesson(lessonId, updateData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
    }
  };

  const handleVideoFieldChange = (field: 'video-title' | 'video-url', value: string) => {
    setLesson(prev => {
      if (!prev) return null;

      // Create a new lesson object without the video fields
      const { ['video-title']: _, ['video-url']: __, ...baseLesson } = prev;

      // Only add back non-empty video fields
      const updates: Partial<Lesson> = {};
      
      // Handle video title changes
      if (field === 'video-title') {
        // Add new video title if it has a value
        if (value.length > 0) {
          updates['video-title'] = value;
        }
        // Preserve existing video URL if it exists
        const existingUrl = prev['video-url'];
        if (existingUrl && existingUrl.length > 0) {
          updates['video-url'] = existingUrl;
        }
      }
      
      // Handle video URL changes
      if (field === 'video-url') {
        // Add new video URL if it has a value
        if (value.length > 0) {
          updates['video-url'] = value;
        }
        // Preserve existing video title if it exists
        const existingTitle = prev['video-title'];
        if (existingTitle && existingTitle.length > 0) {
          updates['video-title'] = existingTitle;
        }
      }

      return {
        ...baseLesson,
        ...updates
      } as Lesson;
    });
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Lesson: {lesson?.name}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} my={2}>
          <TextField
            label="Lesson Name"
            fullWidth
            value={lesson?.name ?? ''}
            onChange={(e) => setLesson(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
          
          <TextField
            label="Video Title"
            fullWidth
            value={lesson?.['video-title'] ?? ''}
            onChange={(e) => handleVideoFieldChange('video-title', e.target.value)}
          />

          <TextField
            label="Video URL"
            fullWidth
            value={lesson?.['video-url'] ?? ''}
            onChange={(e) => handleVideoFieldChange('video-url', e.target.value)}
          />

          <Box>
            <RichTextEditor
              value={lesson?.content ?? ''}
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
