import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';
import { Lesson } from '../../types';
import { getLesson, updateLesson } from '../../services/dataService';
import RichTextEditor from '../RichTextEditor';

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

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    const loadedLesson = await getLesson(lessonId);
    setLesson(loadedLesson);
  };

  const handleSave = async () => {
    if (!lesson) return;

    await updateLesson(lessonId, {
      name: lesson.name,
      content: lesson.content,
      'video-title': lesson['video-title'],
      'video-url': lesson['video-url']
    });

    onSave();
    onClose();
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 